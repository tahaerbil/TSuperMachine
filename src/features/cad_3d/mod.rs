pub mod types;
pub mod viewport;

pub use types::{Shape3D, ShapeInstance};
pub use viewport::Cad3DViewport;

use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;

/// Renders the SolidWorks 3D modeling viewport inside the shared generic container.
pub fn show_cad3d_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    cad3d: &mut Cad3DViewport,
) -> bool {
    draw_widget_container(
        widget,
        ui,
        ctx,
        frame,
        rect,
        zoom,
        pan,
        |_widget, ui, _frame, content_rect| {
            // Allocate child UI specifically within the generic client area to render the 3D viewport
            let mut inner_ui = ui.child_ui(content_rect, egui::Layout::top_down(egui::Align::Min));
            cad3d.show(&mut inner_ui);
        },
    )
}
