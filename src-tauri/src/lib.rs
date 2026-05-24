pub mod commands;
pub mod crypto;
pub mod db;
pub mod state;
pub mod workspace;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::workspace::workspace_create_local,
            commands::workspace::workspace_open_local,
            commands::workspace::workspace_open_synced,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
