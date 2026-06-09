use eframe::egui;

pub struct Canvas {
    pub zoom_level: f32,
    pub pan_offset: egui::Vec2,
}

impl Canvas {
    pub fn new() -> Self {
        Self {
            zoom_level: 1.0,
            pan_offset: egui::Vec2::ZERO,
        }
    }

    /// Renders the infinite canvas grid and handles drag/zoom interactions
    pub fn show(&mut self, ui: &mut egui::Ui) -> egui::Response {
        // Allocate full available space
        let (response, painter) = ui.allocate_painter(
            ui.available_size(),
            egui::Sense::drag(),
        );

        let rect = response.rect;

        // 1. Handle Panning (dragging with Middle or Primary mouse button)
        if response.dragged_by(egui::PointerButton::Middle) || response.dragged_by(egui::PointerButton::Primary) {
            self.pan_offset += response.drag_delta();
        }

        // 2. Handle Zooming (smooth zoom to mouse cursor position)
        let scroll_delta = ui.input(|i| i.smooth_scroll_delta);
        if scroll_delta.y != 0.0 {
            // Get current mouse cursor position, default to screen center if not on screen
            let cursor_pos = ui.input(|i| i.pointer.hover_pos()).unwrap_or(rect.center());

            let zoom_factor = 1.05_f32.powf(scroll_delta.y / 50.0);
            let old_zoom = self.zoom_level;
            let new_zoom = (self.zoom_level * zoom_factor).clamp(0.05, 20.0);

            if old_zoom != new_zoom {
                self.zoom_level = new_zoom;
                // Zoom-to-cursor formula: Shift the pan offset so the coordinate under the cursor remains static
                self.pan_offset = cursor_pos.to_vec2() - (cursor_pos.to_vec2() - self.pan_offset) * (new_zoom / old_zoom);
            }
        }

        // 3. Draw GPU Infinite Grid (Major and Minor lines)
        let minor_grid_size = 50.0 * self.zoom_level;
        let major_grid_size = minor_grid_size * 5.0; // Thick line every 5 minor grid cells

        let stroke_minor = egui::Stroke::new(0.5, egui::Color32::from_gray(30));
        let stroke_major = egui::Stroke::new(1.0, egui::Color32::from_gray(50));

        // Background dark card aesthetic fill
        painter.rect_filled(rect, 0.0, egui::Color32::from_gray(17));

        // Draw Minor Grid lines
        if minor_grid_size > 8.0 { // Prevent grid overload when zoomed out extremely far
            // Vertical minor lines
            let start_x = rect.min.x + (self.pan_offset.x % minor_grid_size);
            let mut x = start_x;
            while x < rect.max.x {
                painter.line_segment([egui::pos2(x, rect.min.y), egui::pos2(x, rect.max.y)], stroke_minor);
                x += minor_grid_size;
            }

            // Horizontal minor lines
            let start_y = rect.min.y + (self.pan_offset.y % minor_grid_size);
            let mut y = start_y;
            while y < rect.max.y {
                painter.line_segment([egui::pos2(rect.min.x, y), egui::pos2(rect.max.x, y)], stroke_minor);
                y += minor_grid_size;
            }
        }

        // Draw Major Grid lines (Always visible for structure)
        // Vertical major lines
        let start_major_x = rect.min.x + (self.pan_offset.x % major_grid_size);
        let mut mx = start_major_x;
        while mx < rect.max.x {
            painter.line_segment([egui::pos2(mx, rect.min.y), egui::pos2(mx, rect.max.y)], stroke_major);
            mx += major_grid_size;
        }

        // Horizontal major lines
        let start_major_y = rect.min.y + (self.pan_offset.y % major_grid_size);
        let mut my = start_major_y;
        while my < rect.max.y {
            painter.line_segment([egui::pos2(rect.min.x, my), egui::pos2(rect.max.x, my)], stroke_major);
            my += major_grid_size;
        }

        // Draw coordinate center cross (0,0 world coordinate)
        let center_x = rect.min.x + self.pan_offset.x;
        let center_y = rect.min.y + self.pan_offset.y;
        
        let axis_stroke = egui::Stroke::new(1.5, egui::Color32::from_rgb(59, 130, 246)); // Blue axis color
        painter.line_segment(
            [egui::pos2(center_x - 20.0, center_y), egui::pos2(center_x + 20.0, center_y)],
            axis_stroke,
        );
        painter.line_segment(
            [egui::pos2(center_x, center_y - 20.0), egui::pos2(center_x, center_y + 20.0)],
            axis_stroke,
        );

        response
    }
}
