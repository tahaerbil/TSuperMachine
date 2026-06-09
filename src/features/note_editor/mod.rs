pub mod document;
pub mod extensions;
pub mod history;
pub mod editor;

use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;
use editor::NativeRichTextEditor;

/// Renders the 100% native Rust Rich Text Editor inside the shared generic container.
pub fn show_note_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
) -> bool {
    // Lazily initialize the native editor state if not present
    if widget.note_editor.is_none() {
        let initial_text = format!(
            "# {}\n\nBuraya teknik notlarınızı alabilirsiniz.\n- Kısayollar: **Ctrl+B** (Kalın), **Ctrl+I** (İtalik)\n- Üst menüden başlıkları düzenleyebilirsiniz.",
            widget.name
        );
        widget.note_editor = Some(NativeRichTextEditor::new(&initial_text));
    }

    draw_widget_container(
        widget,
        ui,
        ctx,
        frame,
        rect,
        zoom,
        pan,
        |widget, ui, _frame, content_rect| {
            if let Some(ref mut editor) = widget.note_editor {
                // Renders the interactive editor within the allocated container client area
                let mut inner_ui = ui.child_ui(content_rect, egui::Layout::top_down(egui::Align::Min));
                editor.show(&mut inner_ui, ctx);
            }
        },
    )
}
