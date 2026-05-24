use argon2::{Algorithm, Argon2, Params, Version};
use chacha20poly1305::aead::rand_core::RngCore;
use chacha20poly1305::aead::{Aead, KeyInit, OsRng};
use chacha20poly1305::{Key, XChaCha20Poly1305, XNonce};
use serde::{Deserialize, Serialize};
use std::fmt;

pub const KEY_LEN: usize = 32;
pub const NONCE_LEN: usize = 24;
pub const SALT_LEN: usize = 16;
pub const DEFAULT_ARGON2_MEMORY_KIB: u32 = 64 * 1024;
pub const DEFAULT_ARGON2_ITERATIONS: u32 = 3;
pub const DEFAULT_ARGON2_PARALLELISM: u32 = 1;
const ARGON2ID: &str = "argon2id";

#[derive(Clone, PartialEq, Eq)]
pub struct WorkspaceKey([u8; KEY_LEN]);

#[derive(Clone, PartialEq, Eq)]
pub struct KeyEncryptionKey([u8; KEY_LEN]);

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct KdfParams {
    pub algorithm: String,
    pub memory_kib: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ciphertext {
    pub nonce: [u8; NONCE_LEN],
    pub ciphertext: Vec<u8>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct WrappedWorkspaceKey {
    pub salt: [u8; SALT_LEN],
    pub kdf: KdfParams,
    pub encrypted_key: Ciphertext,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CryptoError {
    InvalidKdfParams,
    KeyDerivationFailed,
    EncryptFailed,
    DecryptFailed,
    RandomFailed,
}

impl fmt::Display for CryptoError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::InvalidKdfParams => "invalid key derivation parameters",
            Self::KeyDerivationFailed => "key derivation failed",
            Self::EncryptFailed => "encryption failed",
            Self::DecryptFailed => "decryption failed",
            Self::RandomFailed => "secure random generation failed",
        };
        f.write_str(message)
    }
}

impl std::error::Error for CryptoError {}

impl fmt::Debug for WorkspaceKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("WorkspaceKey([redacted])")
    }
}

impl fmt::Debug for KeyEncryptionKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("KeyEncryptionKey([redacted])")
    }
}

impl WorkspaceKey {
    pub fn from_bytes(bytes: [u8; KEY_LEN]) -> Self {
        Self(bytes)
    }

    pub fn expose_for_crypto(&self) -> &[u8; KEY_LEN] {
        &self.0
    }
}

impl KeyEncryptionKey {
    fn as_key(&self) -> &[u8; KEY_LEN] {
        &self.0
    }
}

pub fn default_kdf_params() -> KdfParams {
    KdfParams {
        algorithm: ARGON2ID.to_string(),
        memory_kib: DEFAULT_ARGON2_MEMORY_KIB,
        iterations: DEFAULT_ARGON2_ITERATIONS,
        parallelism: DEFAULT_ARGON2_PARALLELISM,
    }
}

pub fn generate_salt() -> Result<[u8; SALT_LEN], CryptoError> {
    random_array()
}

pub fn generate_nonce() -> Result<[u8; NONCE_LEN], CryptoError> {
    random_array()
}

pub fn generate_workspace_key() -> Result<WorkspaceKey, CryptoError> {
    random_array().map(WorkspaceKey)
}

pub fn derive_kek(
    passphrase: &str,
    salt: &[u8; SALT_LEN],
    params: &KdfParams,
) -> Result<KeyEncryptionKey, CryptoError> {
    validate_kdf_params(params)?;

    let argon_params = Params::new(
        params.memory_kib,
        params.iterations,
        params.parallelism,
        Some(KEY_LEN),
    )
    .map_err(|_| CryptoError::InvalidKdfParams)?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon_params);
    let mut key = [0u8; KEY_LEN];

    argon2
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|_| CryptoError::KeyDerivationFailed)?;

    Ok(KeyEncryptionKey(key))
}

pub fn encrypt(key: &WorkspaceKey, plaintext: &[u8]) -> Result<Ciphertext, CryptoError> {
    encrypt_bytes(key.expose_for_crypto(), plaintext)
}

pub fn decrypt(key: &WorkspaceKey, sealed: &Ciphertext) -> Result<Vec<u8>, CryptoError> {
    decrypt_bytes(key.expose_for_crypto(), sealed)
}

pub fn wrap_workspace_key(
    workspace_key: &WorkspaceKey,
    passphrase: &str,
) -> Result<WrappedWorkspaceKey, CryptoError> {
    let salt = generate_salt()?;
    let kdf = default_kdf_params();
    let kek = derive_kek(passphrase, &salt, &kdf)?;
    let encrypted_key = encrypt_bytes(kek.as_key(), workspace_key.expose_for_crypto())?;

    Ok(WrappedWorkspaceKey {
        salt,
        kdf,
        encrypted_key,
    })
}

pub fn unwrap_workspace_key(
    wrapped: &WrappedWorkspaceKey,
    passphrase: &str,
) -> Result<WorkspaceKey, CryptoError> {
    let kek = derive_kek(passphrase, &wrapped.salt, &wrapped.kdf)?;
    let key_bytes = decrypt_bytes(kek.as_key(), &wrapped.encrypted_key)?;
    let key: [u8; KEY_LEN] = key_bytes
        .try_into()
        .map_err(|_| CryptoError::DecryptFailed)?;

    Ok(WorkspaceKey(key))
}

fn encrypt_bytes(key_bytes: &[u8; KEY_LEN], plaintext: &[u8]) -> Result<Ciphertext, CryptoError> {
    let nonce = generate_nonce()?;
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key_bytes));
    let ciphertext = cipher
        .encrypt(XNonce::from_slice(&nonce), plaintext)
        .map_err(|_| CryptoError::EncryptFailed)?;

    Ok(Ciphertext { nonce, ciphertext })
}

fn decrypt_bytes(key_bytes: &[u8; KEY_LEN], sealed: &Ciphertext) -> Result<Vec<u8>, CryptoError> {
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key_bytes));

    cipher
        .decrypt(XNonce::from_slice(&sealed.nonce), sealed.ciphertext.as_slice())
        .map_err(|_| CryptoError::DecryptFailed)
}

fn validate_kdf_params(params: &KdfParams) -> Result<(), CryptoError> {
    if params.algorithm != ARGON2ID
        || params.memory_kib < DEFAULT_ARGON2_MEMORY_KIB
        || params.iterations < DEFAULT_ARGON2_ITERATIONS
        || params.parallelism == 0
    {
        return Err(CryptoError::InvalidKdfParams);
    }

    Ok(())
}

fn random_array<const N: usize>() -> Result<[u8; N], CryptoError> {
    let mut bytes = [0u8; N];
    OsRng
        .try_fill_bytes(&mut bytes)
        .map_err(|_| CryptoError::RandomFailed)?;
    Ok(bytes)
}

#[cfg(test)]
mod tests;
