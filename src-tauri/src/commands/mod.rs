pub mod workspace;

#[derive(Clone, Debug, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
    pub recoverable: bool,
}

impl CommandError {
    pub fn new(code: &str, message: &str, field: Option<&str>, recoverable: bool) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            field: field.map(str::to_string),
            recoverable,
        }
    }
}
