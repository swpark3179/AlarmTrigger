use serde::{Deserialize, Serialize};
use std::env;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct AlarmData {
    pub title: String,
    pub content: String,
}

#[derive(Deserialize)]
struct AlarmEntry {
    id: Option<serde_json::Value>,
    title: Option<String>,
}

pub fn disable_one_off_alarm(json_str: &str, alarm_id: &str) -> Option<String> {
    let mut modified = false;
    if let Ok(mut items) = serde_json::from_str::<Vec<serde_json::Value>>(json_str) {
        for item in &mut items {
            if let Some(obj) = item.as_object_mut() {
                let is_match = obj.get("id").and_then(|v| {
                    if let Some(s) = v.as_str() {
                        Some(s == alarm_id)
                    } else if let Some(n) = v.as_number() {
                        Some(n.to_string() == alarm_id)
                    } else {
                        None
                    }
                }).unwrap_or(false);

                if is_match {
                    let is_one_off = obj.get("repeat_type").map_or(false, |v| v.as_str() == Some("None") || v.is_null());
                    if is_one_off {
                        obj.insert("enabled".to_string(), serde_json::Value::Bool(false));
                        modified = true;
                    }
                }
            }
        }
        if modified {
            return serde_json::to_string_pretty(&items).ok();
        }
    }
    None
}

pub fn parse_alarm_title(json_str: &str, alarm_id: &str) -> Option<String> {
    let mut default_title = None;
    if let Ok(items) = serde_json::from_str::<Vec<AlarmEntry>>(json_str) {
        for item in items {
            if let Some(t) = item.title {
                if let Some(id_val) = item.id {
                    let id_str = if let Some(s) = id_val.as_str() {
                        Some(s.to_string())
                    } else if let Some(n) = id_val.as_number() {
                        Some(n.to_string())
                    } else {
                        None
                    };

                    if let Some(id) = id_str {
                        if id == alarm_id {
                            return Some(t);
                        }
                    } else {
                        if default_title.is_none() {
                            default_title = Some(t);
                        }
                    }
                } else {
                    if default_title.is_none() {
                        default_title = Some(t);
                    }
                }
            }
        }
    }
    default_title
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
async fn get_alarm_data() -> AlarmData {
    let mut alarm_id = String::new();
    let args: Vec<String> = env::args().collect();
    // Find the first argument that is not the executable path and doesn't start with '--'
    for arg in args.into_iter().skip(1) {
        if !arg.starts_with("--") {
            alarm_id = arg;
            break;
        }
    }

    let mut title = "제목없음".to_string();
    let mut content = String::new();

    if let Some(mut home_dir) = dirs::home_dir() {
        home_dir.push(".alarm");

        // Read alarms.json
        let json_path = home_dir.join("alarms.json");
        if let Ok(json_str) = tokio::fs::read_to_string(&json_path).await {
            if let Some(t) = parse_alarm_title(&json_str, &alarm_id) {
                title = t;
            }
            if !alarm_id.is_empty() {
                if let Some(updated_json) = disable_one_off_alarm(&json_str, &alarm_id) {
                    let _ = tokio::fs::write(&json_path, updated_json).await;
                }
            }
        }

        // Read alarm_id.md
        if !alarm_id.is_empty() && is_safe_filename(&alarm_id) {
            let md_path = home_dir.join(format!("{}.md", alarm_id));
            if let Ok(md_str) = tokio::fs::read_to_string(&md_path).await {
                content = md_str;
            }
        }
    }

    AlarmData { title, content }
}

fn is_safe_filename(name: &str) -> bool {
    !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_alarm_data, close_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_alarm_title_found_string_id() {
        let json_str = r#"[
            {"id": "123", "title": "Test Title 1"},
            {"id": "456", "title": "Test Title 2"}
        ]"#;
        assert_eq!(
            parse_alarm_title(json_str, "456"),
            Some("Test Title 2".to_string())
        );
    }

    #[test]
    fn test_parse_alarm_title_found_number_id() {
        let json_str = r#"[
            {"id": 123, "title": "Test Title 1"},
            {"id": 456, "title": "Test Title 2"}
        ]"#;
        assert_eq!(
            parse_alarm_title(json_str, "456"),
            Some("Test Title 2".to_string())
        );
    }

    #[test]
    fn test_parse_alarm_title_not_found_returns_first_without_id_or_invalid_id() {
        let json_str = r#"[
            {"id": "123", "title": "Test Title 1"},
            {"title": "Default Title"},
            {"id": "789", "title": "Test Title 3"}
        ]"#;
        assert_eq!(
            parse_alarm_title(json_str, "999"),
            Some("Default Title".to_string())
        );
    }

    #[test]
    fn test_parse_alarm_title_empty_json() {
        let json_str = r#"[]"#;
        assert_eq!(parse_alarm_title(json_str, "123"), None);
    }

    #[test]
    fn test_is_safe_filename() {
        assert!(is_safe_filename("valid_id-123"));
        assert!(is_safe_filename("1234"));
        assert!(is_safe_filename("abc_DEF-99"));

        assert!(!is_safe_filename(""));
        assert!(!is_safe_filename("../test"));
        assert!(!is_safe_filename("test/bar"));
        assert!(!is_safe_filename("test\\bar"));
        assert!(!is_safe_filename("."));
        assert!(!is_safe_filename(".."));
        assert!(!is_safe_filename("test.md"));
        assert!(!is_safe_filename("test..md"));
        assert!(!is_safe_filename("test\0"));
    }
  
    #[test]
    fn test_parse_alarm_title_invalid_json() {
        let json_str = r#"{"invalid": json}"#;
        assert_eq!(parse_alarm_title(json_str, "123"), None);
    }

    #[test]
    fn test_disable_one_off_alarm_modifies() {
        let json_str = r#"[
            {"id": "123", "title": "Test Title 1", "repeat_type": "None", "enabled": true},
            {"id": "456", "title": "Test Title 2", "repeat_type": "None", "enabled": true}
        ]"#;

        let result = disable_one_off_alarm(json_str, "456");
        assert!(result.is_some());

        let updated_json = result.unwrap();
        let items: Vec<serde_json::Value> = serde_json::from_str(&updated_json).unwrap();

        assert_eq!(items[0].get("enabled").unwrap().as_bool(), Some(true));
        assert_eq!(items[1].get("enabled").unwrap().as_bool(), Some(false));
    }

    #[test]
    fn test_disable_one_off_alarm_ignores() {
        let json_str = r#"[
            {"id": "123", "title": "Test Title 1", "repeat_type": "Daily", "enabled": true},
            {"id": "456", "title": "Test Title 2", "repeat_type": "Daily", "enabled": true}
        ]"#;

        let result = disable_one_off_alarm(json_str, "456");
        assert!(result.is_none());
    }

    #[test]
    fn test_disable_one_off_alarm_null_repeat_type() {
        let json_str = r#"[
            {"id": "123", "title": "Test Title 1", "repeat_type": null, "enabled": true}
        ]"#;

        let result = disable_one_off_alarm(json_str, "123");
        assert!(result.is_some());

        let updated_json = result.unwrap();
        let items: Vec<serde_json::Value> = serde_json::from_str(&updated_json).unwrap();

        assert_eq!(items[0].get("enabled").unwrap().as_bool(), Some(false));
    }
}
