#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum WidgetState {
    Dormant,    // Static preview container (0% CPU/RAM)
    Focus,      // Live native widget on the canvas
    Maximized,  // Live native widget covering the entire viewport
    PopOut,     // Live native widget detached into an egui Window
}

pub struct WidgetInstance {
    pub id: String,
    pub name: String,
    pub widget_type: String, // e.g. "NOTE", "CAD_3D", "CAD_2D", "SPREADSHEET", "CALCULATOR", "AI_ASSISTANT", "DATA_VAULT"
    pub x: f32,      // World X coordinate
    pub y: f32,      // World Y coordinate
    pub width: f32,  // World Width
    pub height: f32, // World Height
    pub state: WidgetState,
    pub note_editor: Option<super::note_editor::editor::NativeRichTextEditor>,
}

impl WidgetInstance {
    pub fn new(id: &str, name: &str, widget_type: &str, x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            widget_type: widget_type.to_string(),
            x,
            y,
            width,
            height,
            state: WidgetState::Dormant,
            note_editor: None,
        }
    }

    pub fn set_state(&mut self, new_state: WidgetState) {
        if self.state != new_state {
            log::info!("Widget {} transitioning from {:?} to {:?}", self.name, self.state, new_state);
            self.state = new_state;
        }
    }
}
