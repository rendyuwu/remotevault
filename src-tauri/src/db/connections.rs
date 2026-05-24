use super::models::{AuthSource, ConnectionRecord};
use super::DbError;
use rusqlite::{params, Connection};

pub fn validate_connection_record(record: &ConnectionRecord) -> Result<(), DbError> {
    if record.id.trim().is_empty()
        || record.name.trim().is_empty()
        || record.host.trim().is_empty()
        || record.port == 0
        || !matches!(record.protocol.as_str(), "ssh" | "rdp")
        || !matches!(record.sync_state.as_str(), "local" | "pending" | "synced" | "conflict")
    {
        return Err(DbError::InvalidRecord);
    }

    match &record.auth_source {
        AuthSource::None | AuthSource::Agent => Ok(()),
        AuthSource::VaultItem(id) if !id.trim().is_empty() => Ok(()),
        AuthSource::LocalKeyPath(path) if !path.trim().is_empty() => Ok(()),
        _ => Err(DbError::InvalidRecord),
    }
}

pub fn insert_connection(conn: &Connection, record: &ConnectionRecord) -> Result<(), DbError> {
    validate_connection_record(record)?;
    conn.execute(
        "INSERT INTO connections (
            id, name, protocol, host, port, username, auth_source,
            auth_vault_item_id, auth_local_key_path, tags_json, notes, sync_state,
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            record.id,
            record.name,
            record.protocol,
            record.host,
            record.port,
            record.username,
            record.auth_source.kind(),
            record.auth_source.vault_item_id(),
            record.auth_source.local_key_path(),
            record.tags_json,
            record.notes,
            record.sync_state,
            record.created_at,
            record.updated_at,
        ],
    )
    .map_err(|_| DbError::ConstraintFailed)?;
    Ok(())
}
