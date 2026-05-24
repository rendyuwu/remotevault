use super::*;
use std::collections::HashSet;

#[test]
fn encrypt_decrypt_roundtrip() {
    let key = generate_workspace_key().unwrap();
    let plaintext = b"super-secret-token";

    let sealed = encrypt(&key, plaintext).unwrap();

    assert_ne!(sealed.ciphertext, plaintext);
    assert_eq!(decrypt(&key, &sealed).unwrap(), plaintext);
}

#[test]
fn decrypt_rejects_wrong_workspace_key() {
    let key = generate_workspace_key().unwrap();
    let wrong_key = generate_workspace_key().unwrap();
    let sealed = encrypt(&key, b"super-secret-token").unwrap();

    assert_eq!(
        decrypt(&wrong_key, &sealed),
        Err(CryptoError::DecryptFailed)
    );
}

#[test]
fn decrypt_rejects_tampered_ciphertext() {
    let key = generate_workspace_key().unwrap();
    let mut sealed = encrypt(&key, b"super-secret-token").unwrap();
    sealed.ciphertext[0] ^= 1;

    assert_eq!(decrypt(&key, &sealed), Err(CryptoError::DecryptFailed));
}

#[test]
fn encrypt_generates_distinct_nonces() {
    let key = generate_workspace_key().unwrap();
    let first = encrypt(&key, b"same-secret").unwrap();
    let second = encrypt(&key, b"same-secret").unwrap();

    assert_ne!(first.nonce, second.nonce);
    assert_ne!(first.ciphertext, second.ciphertext);
}

#[test]
fn generated_nonces_are_24_bytes_and_distinct() {
    let mut seen = HashSet::new();

    for _ in 0..128 {
        let nonce = generate_nonce().unwrap();
        assert_eq!(nonce.len(), NONCE_LEN);
        assert!(seen.insert(nonce));
    }
}

#[test]
fn default_kdf_params_satisfy_spec() {
    let params = default_kdf_params();

    assert_eq!(params.algorithm, "argon2id");
    assert!(params.memory_kib >= 64 * 1024);
    assert!(params.iterations >= 3);
    assert!(params.parallelism >= 1);
}

#[test]
fn derive_kek_is_deterministic_for_same_inputs() {
    let salt = generate_salt().unwrap();
    let params = default_kdf_params();

    let first = derive_kek("correct horse battery staple", &salt, &params).unwrap();
    let second = derive_kek("correct horse battery staple", &salt, &params).unwrap();

    assert_eq!(first.as_key(), second.as_key());
}

#[test]
fn derive_kek_changes_with_salt() {
    let params = default_kdf_params();
    let first = derive_kek(
        "correct horse battery staple",
        &generate_salt().unwrap(),
        &params,
    )
    .unwrap();
    let second = derive_kek(
        "correct horse battery staple",
        &generate_salt().unwrap(),
        &params,
    )
    .unwrap();

    assert_ne!(first.as_key(), second.as_key());
}

#[test]
fn derive_kek_rejects_weak_params() {
    let salt = generate_salt().unwrap();
    let mut params = default_kdf_params();
    params.memory_kib = DEFAULT_ARGON2_MEMORY_KIB - 1;

    assert_eq!(
        derive_kek("passphrase", &salt, &params),
        Err(CryptoError::InvalidKdfParams)
    );

    let mut params = default_kdf_params();
    params.iterations = DEFAULT_ARGON2_ITERATIONS - 1;

    assert_eq!(
        derive_kek("passphrase", &salt, &params),
        Err(CryptoError::InvalidKdfParams)
    );
}

#[test]
fn passphrase_is_not_used_directly_as_key() {
    let passphrase = "0123456789abcdef0123456789abcdef";
    let salt = generate_salt().unwrap();
    let kek = derive_kek(passphrase, &salt, &default_kdf_params()).unwrap();

    assert_ne!(kek.as_key(), passphrase.as_bytes());
}

#[test]
fn workspace_key_is_random_256_bit() {
    let first = generate_workspace_key().unwrap();
    let second = generate_workspace_key().unwrap();

    assert_eq!(first.expose_for_crypto().len(), KEY_LEN);
    assert_eq!(second.expose_for_crypto().len(), KEY_LEN);
    assert_ne!(first, second);
}

#[test]
fn wrap_unwrap_workspace_key_roundtrip() {
    let key = generate_workspace_key().unwrap();
    let wrapped = wrap_workspace_key(&key, "correct horse battery staple").unwrap();
    let unwrapped = unwrap_workspace_key(&wrapped, "correct horse battery staple").unwrap();

    assert_eq!(key, unwrapped);
}

#[test]
fn unwrap_workspace_key_rejects_wrong_passphrase() {
    let key = generate_workspace_key().unwrap();
    let wrapped = wrap_workspace_key(&key, "correct horse battery staple").unwrap();

    assert_eq!(
        unwrap_workspace_key(&wrapped, "wrong passphrase"),
        Err(CryptoError::DecryptFailed)
    );
}

#[test]
fn wrapped_workspace_key_contains_storage_metadata() {
    let key = generate_workspace_key().unwrap();
    let wrapped = wrap_workspace_key(&key, "correct horse battery staple").unwrap();

    assert_eq!(wrapped.salt.len(), SALT_LEN);
    assert_eq!(wrapped.encrypted_key.nonce.len(), NONCE_LEN);
    assert!(wrapped.kdf.memory_kib >= DEFAULT_ARGON2_MEMORY_KIB);
    assert!(wrapped.kdf.iterations >= DEFAULT_ARGON2_ITERATIONS);
    assert_ne!(wrapped.encrypted_key.ciphertext, key.expose_for_crypto());
}

#[test]
fn wrapping_same_key_twice_uses_distinct_salt_nonce_ciphertext() {
    let key = generate_workspace_key().unwrap();
    let first = wrap_workspace_key(&key, "correct horse battery staple").unwrap();
    let second = wrap_workspace_key(&key, "correct horse battery staple").unwrap();

    assert_ne!(first.salt, second.salt);
    assert_ne!(first.encrypted_key.nonce, second.encrypted_key.nonce);
    assert_ne!(first.encrypted_key.ciphertext, second.encrypted_key.ciphertext);
}

#[test]
fn crypto_errors_do_not_include_secret_inputs() {
    let secret = "DO_NOT_LEAK_TEST_SECRET";
    let key = generate_workspace_key().unwrap();
    let wrapped = wrap_workspace_key(&key, secret).unwrap();
    let err = unwrap_workspace_key(&wrapped, "wrong passphrase").unwrap_err();

    assert!(!format!("{err}").contains(secret));
    assert!(!format!("{err:?}").contains(secret));
}

#[test]
fn key_debug_is_redacted() {
    let key = WorkspaceKey::from_bytes([7u8; KEY_LEN]);
    let kek = KeyEncryptionKey([9u8; KEY_LEN]);

    assert_eq!(format!("{key:?}"), "WorkspaceKey([redacted])");
    assert_eq!(format!("{kek:?}"), "KeyEncryptionKey([redacted])");
    assert!(!format!("{key:?}").contains("7, 7, 7"));
    assert!(!format!("{kek:?}").contains("9, 9, 9"));
}
