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
    assert_eq!(opened.sync_provider, "local_only");

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
