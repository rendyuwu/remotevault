use super::CommandError;
use crate::state::{AppState, WorkspaceSessionInfo, WorkspaceStateError};
use crate::workspace::{
    create_local_workspace, open_local_workspace, open_synced_local_folder_workspace, WorkspaceError,
};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceCreateLocalRequest {
    pub workspace_dir: Option<String>,
    pub workspace_name: Option<String>,
    pub device_name: Option<String>,
    pub passphrase: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceOpenLocalRequest {
    pub workspace_dir: Option<String>,
    pub device_name: Option<String>,
    pub passphrase: String,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase", tag = "provider")]
pub enum WorkspaceOpenSyncedRequest {
    LocalFolder {
        folder_path: String,
        passphrase: String,
        device_name: Option<String>,
        local_cache_dir: Option<String>,
    },
    S3 {
        passphrase: String,
        device_name: Option<String>,
    },
}

#[tauri::command]
pub fn workspace_create_local(
    app: AppHandle,
    state: State<'_, AppState>,
    request: WorkspaceCreateLocalRequest,
) -> Result<WorkspaceSessionInfo, CommandError> {
    let workspace_dir = resolve_workspace_dir(&app, request.workspace_dir, request.workspace_name)?;
    let workspace = create_local_workspace(
        &workspace_dir,
        &request.passphrase,
        request.device_name.as_deref(),
    )
    .map_err(command_error_from_workspace)?;
    let info = workspace.session_info();
    state.set_workspace(workspace).map_err(command_error_from_state)?;
    Ok(info)
}

#[tauri::command]
pub fn workspace_open_local(
    app: AppHandle,
    state: State<'_, AppState>,
    request: WorkspaceOpenLocalRequest,
) -> Result<WorkspaceSessionInfo, CommandError> {
    let workspace_dir = resolve_workspace_dir(&app, request.workspace_dir, None)?;
    let workspace = open_local_workspace(
        &workspace_dir,
        &request.passphrase,
        request.device_name.as_deref(),
    )
    .map_err(command_error_from_workspace)?;
    let info = workspace.session_info();
    state.set_workspace(workspace).map_err(command_error_from_state)?;
    Ok(info)
}

#[tauri::command]
pub fn workspace_open_synced(
    _app: AppHandle,
    state: State<'_, AppState>,
    request: WorkspaceOpenSyncedRequest,
) -> Result<WorkspaceSessionInfo, CommandError> {
    match request {
        WorkspaceOpenSyncedRequest::LocalFolder {
            folder_path,
            passphrase,
            device_name,
            local_cache_dir,
        } => {
            let Some(local_cache_dir) = local_cache_dir.filter(|path| !path.trim().is_empty()) else {
                return Err(CommandError::new(
                    "INVALID_WORKSPACE_PATH",
                    "Local cache path is required.",
                    Some("localCacheDir"),
                    true,
                ));
            };
            let provider_path = PathBuf::from(folder_path.trim());
            let cache_path = PathBuf::from(local_cache_dir.trim());
            let workspace = open_synced_local_folder_workspace(
                &provider_path,
                &cache_path,
                &passphrase,
                device_name.as_deref(),
            )
            .map_err(command_error_from_workspace)?;
            let info = workspace.session_info();
            state.set_workspace(workspace).map_err(command_error_from_state)?;
            Ok(info)
        }
        WorkspaceOpenSyncedRequest::S3 { .. } => Err(CommandError::new(
            "UNSUPPORTED_PROVIDER",
            "S3 workspace bootstrap is not available yet.",
            Some("provider"),
            true,
        )),
    }
}

fn resolve_workspace_dir(
    app: &AppHandle,
    workspace_dir: Option<String>,
    workspace_name: Option<String>,
) -> Result<PathBuf, CommandError> {
    if let Some(path) = workspace_dir {
        let trimmed = path.trim();
        if trimmed.is_empty() {
            return Err(CommandError::new(
                "INVALID_WORKSPACE_PATH",
                "Workspace path is invalid.",
                Some("workspaceDir"),
                true,
            ));
        }
        return Ok(PathBuf::from(trimmed));
    }

    let base = app
        .path()
        .app_data_dir()
        .map_err(|_| CommandError::new("LOCAL_STORAGE_FAILED", "Workspace path is unavailable.", None, true))?;
    let name = workspace_name
        .filter(|name| !name.trim().is_empty())
        .unwrap_or_else(|| "local".to_string());
    if name.contains('/') || name.contains('\\') || name == "." || name == ".." || name.contains("..") {
        return Err(CommandError::new(
            "INVALID_WORKSPACE_PATH",
            "Workspace name is invalid.",
            Some("workspaceName"),
            true,
        ));
    }
    Ok(base.join("workspaces").join(name))
}

fn command_error_from_workspace(error: WorkspaceError) -> CommandError {
    match error {
        WorkspaceError::InvalidPath => CommandError::new(
            "INVALID_WORKSPACE_PATH",
            "Workspace path is invalid.",
            Some("workspaceDir"),
            true,
        ),
        WorkspaceError::WorkspaceExists => CommandError::new(
            "WORKSPACE_EXISTS",
            "Workspace already exists.",
            Some("workspaceDir"),
            true,
        ),
        WorkspaceError::WorkspaceNotFound => CommandError::new(
            "WORKSPACE_NOT_FOUND",
            "Workspace was not found.",
            Some("workspaceDir"),
            true,
        ),
        WorkspaceError::InvalidPassphrase => CommandError::new(
            "INVALID_PASSPHRASE",
            "Workspace could not be opened.",
            Some("passphrase"),
            true,
        ),
        WorkspaceError::StorageFailed => CommandError::new(
            "LOCAL_STORAGE_FAILED",
            "Local workspace storage failed.",
            None,
            true,
        ),
        WorkspaceError::DatabaseFailed => CommandError::new(
            "LOCAL_STORAGE_FAILED",
            "Local workspace database failed.",
            None,
            true,
        ),
        WorkspaceError::CryptoFailed => CommandError::new(
            "LOCAL_STORAGE_FAILED",
            "Workspace encryption setup failed.",
            None,
            true,
        ),
    }
}

fn command_error_from_state(error: WorkspaceStateError) -> CommandError {
    match error {
        WorkspaceStateError::NotOpen => CommandError::new(
            "WORKSPACE_NOT_OPEN",
            "Workspace is not open.",
            None,
            true,
        ),
        WorkspaceStateError::Unavailable => CommandError::new(
            "WORKSPACE_STATE_UNAVAILABLE",
            "Workspace state is unavailable.",
            None,
            true,
        ),
    }
}
