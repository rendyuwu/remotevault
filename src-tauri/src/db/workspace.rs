use super::models::{ciphertext_from_parts, wrapped_key_from_parts, DeviceInfo, WorkspaceMetadata};
use super::DbError;
use crate::crypto::KdfParams;
use rusqlite::{params, Connection, OptionalExtension};

pub fn workspace_exists(conn: &Connection) -> Result<bool, DbError> {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM workspace_metadata", [], |row| row.get(0))
        .map_err(|_| DbError::QueryFailed)?;
    Ok(count > 0)
}

pub fn insert_workspace_metadata(
    conn: &Connection,
    metadata: &WorkspaceMetadata,
) -> Result<(), DbError> {
    conn.execute(
        "INSERT INTO workspace_metadata (
            workspace_id, created_at, updated_at, workspace_key_version,
            wrapped_key_nonce, wrapped_key_ciphertext, kdf_algorithm, kdf_salt,
            kdf_memory_kib, kdf_iterations, kdf_parallelism, sync_provider, sync_root
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            metadata.workspace_id,
            metadata.created_at,
            metadata.updated_at,
            metadata.workspace_key_version,
            metadata.wrapped_key.encrypted_key.nonce.as_slice(),
            metadata.wrapped_key.encrypted_key.ciphertext.as_slice(),
            metadata.wrapped_key.kdf.algorithm,
            metadata.wrapped_key.salt.as_slice(),
            metadata.wrapped_key.kdf.memory_kib,
            metadata.wrapped_key.kdf.iterations,
            metadata.wrapped_key.kdf.parallelism,
            metadata.sync_provider,
            metadata.sync_root,
        ],
    )
    .map_err(|_| DbError::ConstraintFailed)?;
    Ok(())
}

pub fn load_workspace_metadata(conn: &Connection) -> Result<WorkspaceMetadata, DbError> {
    conn.query_row(
        "SELECT workspace_id, created_at, updated_at, workspace_key_version,
            wrapped_key_nonce, wrapped_key_ciphertext, kdf_algorithm, kdf_salt,
            kdf_memory_kib, kdf_iterations, kdf_parallelism, sync_provider, sync_root
         FROM workspace_metadata LIMIT 1",
        [],
        |row| {
            let nonce: Vec<u8> = row.get(4)?;
            let encrypted_key = ciphertext_from_parts(nonce, row.get(5)?).ok_or_else(|| {
                rusqlite::Error::InvalidColumnType(
                    4,
                    "wrapped_key_nonce".to_string(),
                    rusqlite::types::Type::Blob,
                )
            })?;
            let kdf = KdfParams {
                algorithm: row.get(6)?,
                memory_kib: row.get(8)?,
                iterations: row.get(9)?,
                parallelism: row.get(10)?,
            };
            let wrapped_key = wrapped_key_from_parts(row.get(7)?, kdf, encrypted_key).ok_or_else(|| {
                rusqlite::Error::InvalidColumnType(
                    7,
                    "kdf_salt".to_string(),
                    rusqlite::types::Type::Blob,
                )
            })?;
            Ok(WorkspaceMetadata {
                workspace_id: row.get(0)?,
                created_at: row.get(1)?,
                updated_at: row.get(2)?,
                workspace_key_version: row.get(3)?,
                wrapped_key,
                sync_provider: row.get(11)?,
                sync_root: row.get(12)?,
            })
        },
    )
    .optional()
    .map_err(|_| DbError::QueryFailed)?
    .ok_or(DbError::NotFound)
}

pub fn upsert_current_device(conn: &Connection, device: &DeviceInfo) -> Result<(), DbError> {
    conn.execute("UPDATE device_info SET is_current = 0 WHERE is_current = 1", [])
        .map_err(|_| DbError::QueryFailed)?;
    conn.execute(
        "INSERT INTO device_info (
            device_id, device_name, os, app_version, is_current, sync_state,
            created_at, last_seen_at, revoked_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        ON CONFLICT(device_id) DO UPDATE SET
            device_name = excluded.device_name,
            os = excluded.os,
            app_version = excluded.app_version,
            is_current = excluded.is_current,
            sync_state = excluded.sync_state,
            last_seen_at = excluded.last_seen_at,
            revoked_at = excluded.revoked_at",
        params![
            device.device_id,
            device.device_name,
            device.os,
            device.app_version,
            i64::from(device.is_current),
            device.sync_state,
            device.created_at,
            device.last_seen_at,
            device.revoked_at,
        ],
    )
    .map_err(|_| DbError::ConstraintFailed)?;
    Ok(())
}

pub fn load_current_device_id(conn: &Connection) -> Result<Option<String>, DbError> {
    conn.query_row(
        "SELECT device_id FROM device_info WHERE is_current = 1 LIMIT 1",
        [],
        |row| row.get(0),
    )
    .optional()
    .map_err(|_| DbError::QueryFailed)
}

pub fn current_device_exists(conn: &Connection) -> Result<bool, DbError> {
    Ok(load_current_device_id(conn)?.is_some())
}
