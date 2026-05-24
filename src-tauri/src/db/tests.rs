use super::connections::{insert_connection, validate_connection_record};
use super::models::{AuthSource, ConnectionRecord, WorkspaceMetadata};
use super::workspace::{insert_workspace_metadata, load_workspace_metadata};
use super::*;
use crate::crypto::{generate_workspace_key, unwrap_workspace_key, wrap_workspace_key};
use rusqlite::Connection;

#[test]
fn fresh_database_migrates() {
    let mut conn = Connection::open_in_memory().unwrap();
    migrate(&mut conn).unwrap();

    for table in [
        "schema_migrations",
        "workspace_metadata",
        "vault_items",
        "connections",
        "settings",
        "host_keys",
        "rdp_cert_trust",
        "device_info",
    ] {
        assert!(table_exists(&conn, table));
    }
}

#[test]
fn migrations_are_idempotent() {
    let mut conn = Connection::open_in_memory().unwrap();
    migrate(&mut conn).unwrap();
    migrate(&mut conn).unwrap();

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| row.get(0))
        .unwrap();
    assert_eq!(count, 1);
}

#[test]
fn workspace_metadata_roundtrip_preserves_wrapped_key() {
    let mut conn = Connection::open_in_memory().unwrap();
    migrate(&mut conn).unwrap();
    let passphrase = "correct horse battery staple";
    let workspace_key = generate_workspace_key().unwrap();
    let wrapped_key = wrap_workspace_key(&workspace_key, passphrase).unwrap();
    let metadata = WorkspaceMetadata::new(
        "ws_test".to_string(),
        nowish(),
        wrapped_key,
        "local_only".to_string(),
        None,
    );

    insert_workspace_metadata(&conn, &metadata).unwrap();
    let loaded = load_workspace_metadata(&conn).unwrap();
    let unwrapped = unwrap_workspace_key(&loaded.wrapped_key, passphrase).unwrap();

    assert_eq!(unwrapped, workspace_key);
    assert_eq!(loaded.workspace_id, "ws_test");
}

#[test]
fn vault_items_have_no_plaintext_secret_columns() {
    let mut conn = Connection::open_in_memory().unwrap();
    migrate(&mut conn).unwrap();
    let mut stmt = conn.prepare("PRAGMA table_info(vault_items)").unwrap();
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();

    for forbidden in ["secret_value", "password", "private_key", "credential"] {
        assert!(!columns.iter().any(|column| column == forbidden));
    }
    assert!(columns.iter().any(|column| column == "secret_nonce"));
    assert!(columns.iter().any(|column| column == "secret_ciphertext"));
}

#[test]
fn connection_constraints_reject_invalid_protocol_host_port() {
    let valid = valid_connection();
    for mut invalid in [
        ConnectionRecord {
            host: " ".to_string(),
            ..valid.clone()
        },
        ConnectionRecord {
            port: 0,
            ..valid.clone()
        },
        ConnectionRecord {
            protocol: "telnet".to_string(),
            ..valid.clone()
        },
    ] {
        invalid.id = format!("{}_invalid", invalid.id);
        assert_eq!(validate_connection_record(&invalid), Err(DbError::InvalidRecord));
    }
}

#[test]
fn connection_auth_ref_rejects_secret_copy_shapes() {
    let mut conn = Connection::open_in_memory().unwrap();
    migrate(&mut conn).unwrap();
    let mut record = valid_connection();

    record.auth_source = AuthSource::LocalKeyPath("/home/me/.ssh/id_ed25519".to_string());
    insert_connection(&conn, &record).unwrap();

    record.id = "conn_empty_ref".to_string();
    record.auth_source = AuthSource::VaultItem(" ".to_string());
    assert_eq!(validate_connection_record(&record), Err(DbError::InvalidRecord));

    let db_rejected = conn.execute(
        "INSERT INTO connections (
            id, name, protocol, host, port, auth_source, auth_vault_item_id, auth_local_key_path,
            tags_json, sync_state, created_at, updated_at
        ) VALUES ('conn_bad', 'Bad', 'ssh', 'example.com', 22, 'vault_item', 'vault_1', '/tmp/key', '[]', 'local', 'now', 'now')",
        [],
    );
    assert!(db_rejected.is_err());
}

fn table_exists(conn: &Connection, table: &str) -> bool {
    conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
        [table],
        |row| row.get::<_, i64>(0),
    )
    .unwrap()
        == 1
}

fn valid_connection() -> ConnectionRecord {
    ConnectionRecord {
        id: "conn_1".to_string(),
        name: "Production".to_string(),
        protocol: "ssh".to_string(),
        host: "example.com".to_string(),
        port: 22,
        username: Some("ubuntu".to_string()),
        auth_source: AuthSource::None,
        tags_json: "[]".to_string(),
        notes: None,
        sync_state: "local".to_string(),
        created_at: nowish(),
        updated_at: nowish(),
    }
}

fn nowish() -> String {
    "2026-05-24T00:00:00.000Z".to_string()
}
