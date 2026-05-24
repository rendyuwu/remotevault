use crate::crypto::WorkspaceKey;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct AppState {
    workspace: Mutex<Option<OpenWorkspace>>,
}

pub struct OpenWorkspace {
    pub workspace_id: String,
    pub device_id: String,
    pub workspace_dir: PathBuf,
    pub database_path: PathBuf,
    pub sync_provider: String,
    pub workspace_key_version: u32,
    pub created_at: String,
    workspace_key: WorkspaceKey,
}

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSessionInfo {
    pub workspace_id: String,
    pub device_id: String,
    pub workspace_dir: String,
    pub database_path: String,
    pub sync_provider: String,
    pub workspace_key_version: u32,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WorkspaceStateError {
    NotOpen,
    Unavailable,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            workspace: Mutex::new(None),
        }
    }
}

impl AppState {
    pub fn set_workspace(&self, workspace: OpenWorkspace) -> Result<(), WorkspaceStateError> {
        let mut guard = self.workspace.lock().map_err(|_| WorkspaceStateError::Unavailable)?;
        *guard = Some(workspace);
        Ok(())
    }

    pub fn clear_workspace(&self) -> Result<(), WorkspaceStateError> {
        let mut guard = self.workspace.lock().map_err(|_| WorkspaceStateError::Unavailable)?;
        *guard = None;
        Ok(())
    }

    pub fn workspace_snapshot(&self) -> Result<WorkspaceSessionInfo, WorkspaceStateError> {
        let guard = self.workspace.lock().map_err(|_| WorkspaceStateError::Unavailable)?;
        guard
            .as_ref()
            .map(OpenWorkspace::session_info)
            .ok_or(WorkspaceStateError::NotOpen)
    }
}

impl OpenWorkspace {
    pub fn new(
        workspace_id: String,
        device_id: String,
        workspace_dir: PathBuf,
        database_path: PathBuf,
        sync_provider: String,
        workspace_key_version: u32,
        created_at: String,
        workspace_key: WorkspaceKey,
    ) -> Self {
        Self {
            workspace_id,
            device_id,
            workspace_dir,
            database_path,
            sync_provider,
            workspace_key_version,
            created_at,
            workspace_key,
        }
    }

    pub fn session_info(&self) -> WorkspaceSessionInfo {
        let _keep_key_in_memory = &self.workspace_key;
        WorkspaceSessionInfo {
            workspace_id: self.workspace_id.clone(),
            device_id: self.device_id.clone(),
            workspace_dir: self.workspace_dir.to_string_lossy().into_owned(),
            database_path: self.database_path.to_string_lossy().into_owned(),
            sync_provider: self.sync_provider.clone(),
            workspace_key_version: self.workspace_key_version,
            created_at: self.created_at.clone(),
        }
    }
}
