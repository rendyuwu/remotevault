use super::DbError;
use rusqlite::{params, Connection};

const INITIAL_VERSION: i64 = 1;
const INITIAL_NAME: &str = "initial_local_workspace_schema";

pub fn run(conn: &mut Connection) -> Result<(), DbError> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );",
    )
    .map_err(|_| DbError::MigrationFailed)?;

    let applied = migration_applied(conn, INITIAL_VERSION)?;
    if applied {
        return Ok(());
    }

    let tx = conn.transaction().map_err(|_| DbError::MigrationFailed)?;
    tx.execute_batch(INITIAL_SQL)
        .map_err(|_| DbError::MigrationFailed)?;
    tx.execute(
        "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
        params![INITIAL_VERSION, INITIAL_NAME],
    )
    .map_err(|_| DbError::MigrationFailed)?;
    tx.commit().map_err(|_| DbError::MigrationFailed)
}

fn migration_applied(conn: &Connection, version: i64) -> Result<bool, DbError> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM schema_migrations WHERE version = ?1",
            params![version],
            |row| row.get(0),
        )
        .map_err(|_| DbError::MigrationFailed)?;
    Ok(count > 0)
}

const INITIAL_SQL: &str = r#"
CREATE TABLE workspace_metadata (
    workspace_id TEXT PRIMARY KEY CHECK (length(trim(workspace_id)) > 0),
    format_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    workspace_key_version INTEGER NOT NULL DEFAULT 1,
    wrapped_key_nonce BLOB NOT NULL CHECK (length(wrapped_key_nonce) = 24),
    wrapped_key_ciphertext BLOB NOT NULL CHECK (length(wrapped_key_ciphertext) > 0),
    kdf_algorithm TEXT NOT NULL CHECK (kdf_algorithm = 'argon2id'),
    kdf_salt BLOB NOT NULL CHECK (length(kdf_salt) = 16),
    kdf_memory_kib INTEGER NOT NULL CHECK (kdf_memory_kib >= 65536),
    kdf_iterations INTEGER NOT NULL CHECK (kdf_iterations >= 3),
    kdf_parallelism INTEGER NOT NULL CHECK (kdf_parallelism >= 1),
    sync_provider TEXT NOT NULL DEFAULT 'local_only' CHECK (sync_provider IN ('local_only', 'local_folder', 's3')),
    sync_root TEXT
);

CREATE TABLE vault_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    item_type TEXT NOT NULL CHECK (item_type IN ('password', 'private_key', 'private_key_passphrase', 'generic_secret')),
    secret_nonce BLOB NOT NULL CHECK (length(secret_nonce) = 24),
    secret_ciphertext BLOB NOT NULL CHECK (length(secret_ciphertext) > 0),
    tags_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    sync_state TEXT NOT NULL DEFAULT 'local' CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict')),
    conflict_state TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
);

CREATE TABLE connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    protocol TEXT NOT NULL CHECK (protocol IN ('ssh', 'rdp')),
    host TEXT NOT NULL CHECK (length(trim(host)) > 0),
    port INTEGER NOT NULL CHECK (port BETWEEN 1 AND 65535),
    username TEXT,
    auth_source TEXT NOT NULL DEFAULT 'none' CHECK (auth_source IN ('none', 'agent', 'vault_item', 'local_key_path')),
    auth_vault_item_id TEXT REFERENCES vault_items(id) ON DELETE RESTRICT,
    auth_local_key_path TEXT,
    tags_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    sync_state TEXT NOT NULL DEFAULT 'local' CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict')),
    conflict_state TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    CHECK (
        (auth_source IN ('none', 'agent') AND auth_vault_item_id IS NULL AND auth_local_key_path IS NULL)
        OR (auth_source = 'vault_item' AND auth_vault_item_id IS NOT NULL AND auth_local_key_path IS NULL)
        OR (auth_source = 'local_key_path' AND auth_vault_item_id IS NULL AND length(trim(auth_local_key_path)) > 0)
    )
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY CHECK (length(trim(key)) > 0),
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE host_keys (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL CHECK (length(trim(host)) > 0),
    port INTEGER NOT NULL CHECK (port BETWEEN 1 AND 65535),
    key_algorithm TEXT NOT NULL,
    key_fingerprint_sha256 TEXT NOT NULL,
    key_blob BLOB NOT NULL,
    trusted_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    changed_at TEXT,
    UNIQUE(host, port, key_algorithm)
);

CREATE TABLE rdp_cert_trust (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL CHECK (length(trim(host)) > 0),
    port INTEGER NOT NULL CHECK (port BETWEEN 1 AND 65535),
    certificate_fingerprint_sha256 TEXT NOT NULL,
    certificate_der BLOB,
    subject TEXT,
    issuer TEXT,
    trusted_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    changed_at TEXT,
    UNIQUE(host, port, certificate_fingerprint_sha256)
);

CREATE TABLE device_info (
    device_id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL CHECK (length(trim(device_name)) > 0),
    os TEXT,
    app_version TEXT,
    public_key BLOB,
    is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
    sync_state TEXT NOT NULL DEFAULT 'local' CHECK (sync_state IN ('local', 'pending', 'synced', 'conflict')),
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    revoked_at TEXT
);

CREATE UNIQUE INDEX device_info_one_current ON device_info(is_current) WHERE is_current = 1;
"#;
