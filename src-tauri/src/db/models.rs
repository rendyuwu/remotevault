use crate::crypto::{Ciphertext, KdfParams, WrappedWorkspaceKey};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct WorkspaceMetadata {
    pub workspace_id: String,
    pub created_at: String,
    pub updated_at: String,
    pub workspace_key_version: u32,
    pub wrapped_key: WrappedWorkspaceKey,
    pub sync_provider: String,
    pub sync_root: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DeviceInfo {
    pub device_id: String,
    pub device_name: String,
    pub os: Option<String>,
    pub app_version: Option<String>,
    pub is_current: bool,
    pub sync_state: String,
    pub created_at: String,
    pub last_seen_at: String,
    pub revoked_at: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ConnectionRecord {
    pub id: String,
    pub name: String,
    pub protocol: String,
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub auth_source: AuthSource,
    pub tags_json: String,
    pub notes: Option<String>,
    pub sync_state: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AuthSource {
    None,
    Agent,
    VaultItem(String),
    LocalKeyPath(String),
}

impl AuthSource {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Agent => "agent",
            Self::VaultItem(_) => "vault_item",
            Self::LocalKeyPath(_) => "local_key_path",
        }
    }

    pub fn vault_item_id(&self) -> Option<&str> {
        match self {
            Self::VaultItem(id) => Some(id),
            _ => None,
        }
    }

    pub fn local_key_path(&self) -> Option<&str> {
        match self {
            Self::LocalKeyPath(path) => Some(path),
            _ => None,
        }
    }
}

impl WorkspaceMetadata {
    pub fn new(
        workspace_id: String,
        timestamp: String,
        wrapped_key: WrappedWorkspaceKey,
        sync_provider: String,
        sync_root: Option<String>,
    ) -> Self {
        Self {
            workspace_id,
            created_at: timestamp.clone(),
            updated_at: timestamp,
            workspace_key_version: 1,
            wrapped_key,
            sync_provider,
            sync_root,
        }
    }
}

pub fn ciphertext_from_parts(nonce: Vec<u8>, ciphertext: Vec<u8>) -> Option<Ciphertext> {
    let nonce = nonce.try_into().ok()?;
    Some(Ciphertext { nonce, ciphertext })
}

pub fn wrapped_key_from_parts(
    salt: Vec<u8>,
    kdf: KdfParams,
    encrypted_key: Ciphertext,
) -> Option<WrappedWorkspaceKey> {
    let salt = salt.try_into().ok()?;
    Some(WrappedWorkspaceKey {
        salt,
        kdf,
        encrypted_key,
    })
}
