use rusqlite::{Connection, OpenFlags};
use std::fmt;
use std::path::Path;

pub mod connections;
mod migrations;
pub mod models;
pub mod workspace;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DbError {
    OpenFailed,
    MigrationFailed,
    QueryFailed,
    ConstraintFailed,
    NotFound,
    InvalidRecord,
    CryptoMetadataInvalid,
}

impl fmt::Display for DbError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::OpenFailed => "database could not be opened",
            Self::MigrationFailed => "database migration failed",
            Self::QueryFailed => "database query failed",
            Self::ConstraintFailed => "database constraint failed",
            Self::NotFound => "record not found",
            Self::InvalidRecord => "record is invalid",
            Self::CryptoMetadataInvalid => "crypto metadata is invalid",
        };
        f.write_str(message)
    }
}

impl std::error::Error for DbError {}

pub fn open_database(path: &Path) -> Result<Connection, DbError> {
    let mut conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| DbError::OpenFailed)?;
    migrate(&mut conn)?;
    Ok(conn)
}

pub fn open_existing_database(path: &Path) -> Result<Connection, DbError> {
    let mut conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .map_err(|_| DbError::OpenFailed)?;
    migrate(&mut conn)?;
    Ok(conn)
}

pub fn migrate(conn: &mut Connection) -> Result<(), DbError> {
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|_| DbError::MigrationFailed)?;
    migrations::run(conn)
}

#[cfg(test)]
mod tests;
