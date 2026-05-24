use crate::crypto;
use crate::db::models::{DeviceInfo, WorkspaceMetadata};
use crate::db::workspace::{
    insert_workspace_metadata, load_current_device_id, load_workspace_metadata, upsert_current_device,
    workspace_exists,
};
use crate::db::{self, DbError};
use crate::state::OpenWorkspace;
use chacha20poly1305::aead::rand_core::RngCore;
use chacha20poly1305::aead::OsRng;
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};
use time::OffsetDateTime;

const DB_FILE: &str = "remotevault.sqlite3";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorkspaceError {
    InvalidPath,
    WorkspaceExists,
    WorkspaceNotFound,
    InvalidPassphrase,
    StorageFailed,
    DatabaseFailed,
    CryptoFailed,
}

impl fmt::Display for WorkspaceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::InvalidPath => "workspace path is invalid",
            Self::WorkspaceExists => "workspace already exists",
            Self::WorkspaceNotFound => "workspace was not found",
            Self::InvalidPassphrase => "workspace could not be opened",
            Self::StorageFailed => "workspace storage failed",
            Self::DatabaseFailed => "workspace database failed",
            Self::CryptoFailed => "workspace encryption failed",
        };
        f.write_str(message)
    }
}

impl std::error::Error for WorkspaceError {}

pub fn create_local_workspace(
    workspace_dir: &Path,
    passphrase: &str,
    device_name: Option<&str>,
) -> Result<OpenWorkspace, WorkspaceError> {
    validate_workspace_dir(workspace_dir)?;
    validate_passphrase(passphrase)?;
    fs::create_dir_all(workspace_dir).map_err(|_| WorkspaceError::StorageFailed)?;
    let database_path = database_path_for_workspace_dir(workspace_dir);
    let conn = db::open_database(&database_path).map_err(map_db_error)?;
    if workspace_exists(&conn).map_err(map_db_error)? {
        return Err(WorkspaceError::WorkspaceExists);
    }

    let workspace_id = generate_id("ws")?;
    let device_id = generate_id("dev")?;
    let timestamp = timestamp_now();
    let workspace_key = crypto::generate_workspace_key().map_err(|_| WorkspaceError::CryptoFailed)?;
    let wrapped_key = crypto::wrap_workspace_key(&workspace_key, passphrase)
        .map_err(|_| WorkspaceError::CryptoFailed)?;
    let metadata = WorkspaceMetadata::new(
        workspace_id.clone(),
        timestamp.clone(),
        wrapped_key,
        "local_only".to_string(),
        None,
    );
    insert_workspace_metadata(&conn, &metadata).map_err(map_db_error)?;
    upsert_current_device(&conn, &new_device(&device_id, device_name, &timestamp))
        .map_err(map_db_error)?;

    Ok(OpenWorkspace::new(
        workspace_id,
        device_id,
        workspace_dir.to_path_buf(),
        database_path,
        metadata.sync_provider,
        metadata.workspace_key_version,
        timestamp,
        workspace_key,
    ))
}

pub fn open_local_workspace(
    workspace_dir: &Path,
    passphrase: &str,
    device_name: Option<&str>,
) -> Result<OpenWorkspace, WorkspaceError> {
    validate_workspace_dir(workspace_dir)?;
    validate_passphrase(passphrase)?;
    let database_path = database_path_for_workspace_dir(workspace_dir);
    if !database_path.exists() {
        return Err(WorkspaceError::WorkspaceNotFound);
    }

    let conn = db::open_existing_database(&database_path).map_err(map_db_error)?;
    let metadata = load_workspace_metadata(&conn).map_err(map_db_error)?;
    let workspace_key = crypto::unwrap_workspace_key(&metadata.wrapped_key, passphrase)
        .map_err(|_| WorkspaceError::InvalidPassphrase)?;
    let device_id = load_current_device_id(&conn)
        .map_err(map_db_error)?
        .map(Ok)
        .unwrap_or_else(|| generate_id("dev"))?;
    let timestamp = timestamp_now();
    upsert_current_device(&conn, &new_device(&device_id, device_name, &timestamp))
        .map_err(map_db_error)?;

    Ok(OpenWorkspace::new(
        metadata.workspace_id,
        device_id,
        workspace_dir.to_path_buf(),
        database_path,
        metadata.sync_provider,
        metadata.workspace_key_version,
        metadata.created_at,
        workspace_key,
    ))
}

pub fn database_path_for_workspace_dir(workspace_dir: &Path) -> PathBuf {
    workspace_dir.join(DB_FILE)
}

fn validate_workspace_dir(workspace_dir: &Path) -> Result<(), WorkspaceError> {
    if workspace_dir.as_os_str().is_empty() {
        return Err(WorkspaceError::InvalidPath);
    }
    Ok(())
}

fn validate_passphrase(passphrase: &str) -> Result<(), WorkspaceError> {
    if passphrase.is_empty() {
        return Err(WorkspaceError::InvalidPassphrase);
    }
    Ok(())
}

fn new_device(device_id: &str, device_name: Option<&str>, timestamp: &str) -> DeviceInfo {
    DeviceInfo {
        device_id: device_id.to_string(),
        device_name: device_name
            .filter(|name| !name.trim().is_empty())
            .unwrap_or("Current device")
            .to_string(),
        os: Some(std::env::consts::OS.to_string()),
        app_version: Some(env!("CARGO_PKG_VERSION").to_string()),
        is_current: true,
        sync_state: "local".to_string(),
        created_at: timestamp.to_string(),
        last_seen_at: timestamp.to_string(),
        revoked_at: None,
    }
}

fn generate_id(prefix: &str) -> Result<String, WorkspaceError> {
    let mut bytes = [0u8; 16];
    OsRng
        .try_fill_bytes(&mut bytes)
        .map_err(|_| WorkspaceError::CryptoFailed)?;
    Ok(format!("{}_{}", prefix, hex_encode(&bytes)))
}

fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0x0f) as usize] as char);
    }
    out
}

fn timestamp_now() -> String {
    OffsetDateTime::now_utc()
        .format(&time::format_description::well_known::Rfc3339)
        .unwrap_or_else(|_| "1970-01-01T00:00:00Z".to_string())
}

fn map_db_error(error: DbError) -> WorkspaceError {
    match error {
        DbError::NotFound => WorkspaceError::WorkspaceNotFound,
        DbError::ConstraintFailed => WorkspaceError::WorkspaceExists,
        DbError::OpenFailed => WorkspaceError::StorageFailed,
        _ => WorkspaceError::DatabaseFailed,
    }
}

#[cfg(test)]
mod tests;
