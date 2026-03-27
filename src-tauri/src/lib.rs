use serde::{Deserialize, Serialize};
use std::env;
use std::fs;

#[derive(Serialize)]
pub struct AlarmData {
    pub title: String,
    pub content: String,
}

#[tauri::command]
fn get_alarm_data() -> AlarmData {
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
        if let Ok(json_str) = fs::read_to_string(&json_path) {
            if let Ok(items) = serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                for item in items {
                    if let Some(obj) = item.as_object() {
                        if let Some(t) = obj.get("title").and_then(|v| v.as_str()) {
                            if let Some(id_val) = obj.get("id") {
                                let id_str = if let Some(s) = id_val.as_str() {
                                    Some(s.to_string())
                                } else if let Some(n) = id_val.as_number() {
                                    Some(n.to_string())
                                } else {
                                    None
                                };

                                if let Some(id) = id_str {
                                    if id == alarm_id {
                                        title = t.to_string();
                                        break;
                                    }
                                } else {
                                    if title == "제목없음" {
                                        title = t.to_string();
                                    }
                                }
                            } else {
                                if title == "제목없음" {
                                    title = t.to_string();
                                }
                            }
                        }
                    }
                }
            }
        }

        // Read alarm_id.md
        if !alarm_id.is_empty() {
            let md_path = home_dir.join(format!("{}.md", alarm_id));
            if let Ok(md_str) = fs::read_to_string(&md_path) {
                content = md_str;
            }
        }
    }

    AlarmData { title, content }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_alarm_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
