use super::*;
use crate::db::workspace::{current_device_exists, load_workspace_metadata};
use crate::state::{AppState, WorkspaceStateError};
use rusqlite::Connection;
use std::fs;
use std::path::{Path, PathBuf};

#[test]
fn create_local_workspace_creates_db_and_metadata() {
    let dir = test_dir("create_local_workspace_creates_db_and_metadata");
    let workspace = create_local_workspace(&dir, "strong passphrase", Some("Laptop")).unwrap();

    assert!(database_path_for_workspace_dir(&dir).exists());
    assert_eq!(workspace.workspace_dir, dir);
    let conn = Connection::open(workspace.database_path).unwrap();
    let metadata = load_workspace_metadata(&conn).unwrap();
    assert_eq!(metadata.workspace_id, workspace.workspace_id);
    assert!(current_device_exists(&conn).unwrap());

    cleanup(&dir);
}

#[test]
fn open_local_workspace_unwraps_existing_key() {
    let dir = test_dir("open_local_workspace_unwraps_existing_key");
    let created = create_local_workspace(&dir, "strong passphrase", Some("Laptop")).unwrap();
    let opened = open_local_workspace(&dir, "strong passphrase", Some("Desktop")).unwrap();

    assert_eq!(opened.workspace_id, created.workspace_id);
    assert_eq!(opened.device_id, created.device_id);
    assert_eq!(opened.sync_provider, "local_only");

    cleanup(&dir);
}

#[test]
fn create_local_workspace_rejects_empty_passphrase() {
    let dir = test_dir("create_local_workspace_rejects_empty_passphrase");
    for passphrase in ["", "   "] {
        let error = match create_local_workspace(&dir, passphrase, Some("Laptop")) {
            Ok(_) => panic!("blank passphrase created workspace"),
            Err(error) => error,
        };
        assert_eq!(error, WorkspaceError::InvalidPassphrase);
    }
    cleanup(&dir);
}

#[test]
fn synced_local_folder_uses_cache_and_new_device_id() {
    let provider_dir = test_dir("synced_local_folder_provider");
    let cache_dir = test_dir("synced_local_folder_cache");
    let created = create_local_workspace(&provider_dir, "strong passphrase", Some("Laptop")).unwrap();
    let opened = open_synced_local_folder_workspace(
        &provider_dir,
        &cache_dir,
        "strong passphrase",
        Some("Desktop"),
    )
    .unwrap();

    assert_eq!(opened.workspace_id, created.workspace_id);
    assert_ne!(opened.device_id, created.device_id);
    assert_eq!(opened.workspace_dir, cache_dir);
    assert!(database_path_for_workspace_dir(&provider_dir).exists());
    assert!(database_path_for_workspace_dir(&cache_dir).exists());

    cleanup(&provider_dir);
    cleanup(&cache_dir);
}

#[test]
fn synced_local_folder_rejects_provider_as_cache() {
    let provider_dir = test_dir("synced_local_folder_rejects_provider_as_cache");
    create_local_workspace(&provider_dir, "strong passphrase", Some("Laptop")).unwrap();

    let error = match open_synced_local_folder_workspace(
        &provider_dir,
        &provider_dir,
        "strong passphrase",
        Some("Desktop"),
    ) {
        Ok(_) => panic!("provider root used as cache"),
        Err(error) => error,
    };

    assert_eq!(error, WorkspaceError::InvalidPath);
    cleanup(&provider_dir);
}

#[test]
fn synced_local_folder_rejects_symlink_cache_to_provider() {
    let provider_dir = test_dir("synced_local_folder_rejects_symlink_provider");
    let link_dir = test_dir("synced_local_folder_rejects_symlink_link");
    create_local_workspace(&provider_dir, "strong passphrase", Some("Laptop")).unwrap();
    std::os::unix::fs::symlink(&provider_dir, &link_dir).unwrap();

    let error = match open_synced_local_folder_workspace(
        &provider_dir,
        &link_dir,
        "strong passphrase",
        Some("Desktop"),
    ) {
        Ok(_) => panic!("symlink cache used provider root"),
        Err(error) => error,
    };

    assert_eq!(error, WorkspaceError::InvalidPath);
    cleanup(&link_dir);
    cleanup(&provider_dir);
}

#[test]
fn synced_local_folder_rejects_cache_for_other_workspace() {
    let provider_dir = test_dir("synced_local_folder_provider_mismatch");
    let cache_dir = test_dir("synced_local_folder_cache_mismatch");
    create_local_workspace(&provider_dir, "strong passphrase", Some("Laptop")).unwrap();
    create_local_workspace(&cache_dir, "strong passphrase", Some("Other")).unwrap();

    let error = match open_synced_local_folder_workspace(
        &provider_dir,
        &cache_dir,
        "strong passphrase",
        Some("Desktop"),
    ) {
        Ok(_) => panic!("wrong cache workspace opened"),
        Err(error) => error,
    };

    assert_eq!(error, WorkspaceError::WorkspaceExists);
    cleanup(&provider_dir);
    cleanup(&cache_dir);
}

#[test]
fn workspace_timestamps_are_rfc3339() {
    let dir = test_dir("workspace_timestamps_are_rfc3339");
    let created = create_local_workspace(&dir, "strong passphrase", Some("Laptop")).unwrap();

    assert!(created.created_at.contains('T'));
    assert!(created.created_at.ends_with('Z'));
    assert!(!created.created_at.starts_with("unix-ms:"));

    cleanup(&dir);
}

#[test]
fn open_local_workspace_rejects_wrong_passphrase_secret_free() {
    let dir = test_dir("open_local_workspace_rejects_wrong_passphrase_secret_free");
    let wrong = "wrong passphrase";
    create_local_workspace(&dir, "right passphrase", Some("Laptop")).unwrap();

    let error = match open_local_workspace(&dir, wrong, Some("Desktop")) {
        Ok(_) => panic!("wrong passphrase opened workspace"),
        Err(error) => error,
    };
    let rendered = error.to_string();

    assert_eq!(error, WorkspaceError::InvalidPassphrase);
    assert!(!rendered.contains(wrong));
    assert!(!rendered.contains("right passphrase"));

    cleanup(&dir);
}

#[test]
fn create_local_workspace_refuses_existing_workspace() {
    let dir = test_dir("create_local_workspace_refuses_existing_workspace");
    create_local_workspace(&dir, "strong passphrase", Some("Laptop")).unwrap();

    let error = match create_local_workspace(&dir, "strong passphrase", Some("Laptop")) {
        Ok(_) => panic!("existing workspace was overwritten"),
        Err(error) => error,
    };

    assert_eq!(error, WorkspaceError::WorkspaceExists);
    cleanup(&dir);
}

#[test]
fn app_state_starts_without_workspace() {
    let state = AppState::default();

    assert_eq!(
        state.workspace_snapshot(),
        Err(WorkspaceStateError::NotOpen)
    );
}

fn test_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "remotevault_{}_{}",
        name,
        std::process::id()
    ));
    cleanup(&dir);
    dir
}

fn cleanup(dir: &Path) {
    if dir.exists() {
        fs::remove_dir_all(dir).unwrap();
    }
}
