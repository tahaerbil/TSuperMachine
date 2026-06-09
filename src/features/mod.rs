pub mod instance;
pub mod container;
pub mod note_editor;
pub mod cad_2d;
pub mod cad_3d;
pub mod spreadsheet;
pub mod engineering_calculator;
pub mod ai_assistant;
pub mod data_vault;

pub use instance::{WidgetInstance, WidgetState};
pub use container::draw_widget_container;
pub use note_editor::show_note_widget;
pub use cad_2d::{show_cad2d_widget, Cad2DViewport};
pub use cad_3d::{show_cad3d_widget, Cad3DViewport};
pub use spreadsheet::{show_spreadsheet_widget, SpreadsheetState};
pub use engineering_calculator::{show_calculator_widget, CalculatorState};
pub use ai_assistant::{show_ai_assistant_widget, AiAssistantState};
pub use data_vault::{show_data_vault_widget, DataVaultState};
