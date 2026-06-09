use eframe::egui;
use crate::features::instance::{WidgetInstance, WidgetState};

/// A generic, premium window manager shell for all infinite canvas widgets.
/// Consolidates coordinates, header drag bars, close/maximize/pop-out actions,
/// and maximized states into a single DRY structure.
pub fn draw_widget_container<F>(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    render_content: F,
) -> bool
where
    F: FnOnce(&mut WidgetInstance, &mut egui::Ui, &mut eframe::Frame, egui::Rect),
{
    let mut keep_alive = true;

    // Dynamic scale factor based on zoom level to ensure visual consistency
    let scale = zoom.clamp(0.4, 1.0);
    let header_height = 30.0 * scale;
    let font_size = 11.0 * scale;
    let rounding = 8.0 * scale;

    match widget.state {
        WidgetState::Dormant => {
            // 1. Calculate screen coordinates for the static placeholder
            let sx = rect.min.x + (widget.x * zoom) + pan.x;
            let sy = rect.min.y + (widget.y * zoom) + pan.y;
            let sw = widget.width * zoom;
            let sh = widget.height * zoom;

            let window_rect = egui::Rect::from_min_size(egui::pos2(sx, sy), egui::vec2(sw, sh));
            
            // Drag & Hover interactions
            let response = ui.allocate_rect(window_rect, egui::Sense::click_and_drag());
            if response.dragged() {
                widget.x += response.drag_delta().x / zoom;
                widget.y += response.drag_delta().y / zoom;
            }

            if response.double_clicked() {
                widget.set_state(WidgetState::Focus);
            }

            // Draw window body
            ui.painter().rect_filled(window_rect, rounding, egui::Color32::from_gray(20));
            ui.painter().rect_stroke(window_rect, rounding, egui::Stroke::new(1.0 * scale, egui::Color32::from_gray(40)));
            
            // Header bar
            let header_rect = egui::Rect::from_min_size(egui::pos2(sx, sy), egui::vec2(sw, header_height));
            ui.painter().rect_filled(
                header_rect,
                egui::Rounding { nw: rounding, ne: rounding, sw: 0.0, se: 0.0 },
                egui::Color32::from_gray(30),
            );

            // Title - scaled and truncated/hidden if too narrow to prevent overlap
            if sw > 60.0 * scale {
                let max_chars = ((sw / (6.5 * scale)) as usize).max(3);
                let display_title = if widget.name.chars().count() > max_chars {
                    let mut truncated: String = widget.name.chars().take(max_chars - 3).collect();
                    truncated.push_str("...");
                    truncated
                } else {
                    widget.name.clone()
                };

                ui.painter().text(
                    egui::pos2(sx + 10.0 * scale, sy + header_height / 2.0),
                    egui::Align2::LEFT_CENTER,
                    display_title,
                    egui::FontId::proportional(font_size),
                    egui::Color32::from_gray(220),
                );
            }

            // Sleek Flat Icon Action Buttons - only render if there is enough visual room
            let show_buttons = sw >= 150.0 * scale && zoom >= 0.45;
            if show_buttons {
                let btn_width = 110.0 * scale;
                let btn_rect = egui::Rect::from_min_max(
                    egui::pos2(sx + sw - btn_width - 5.0 * scale, sy + 3.0 * scale),
                    egui::pos2(sx + sw - 5.0 * scale, sy + header_height - 3.0 * scale),
                );
                ui.allocate_ui_at_rect(btn_rect, |ui| {
                    ui.horizontal(|ui| {
                        ui.style_mut().spacing.button_padding = egui::vec2(4.0 * scale, 1.0 * scale);
                        ui.style_mut().text_styles.insert(
                            egui::TextStyle::Button,
                            egui::FontId::proportional(10.0 * scale)
                        );
                        
                        let btn_close = ui.button("❌").on_hover_text("Widget'ı Kapat & Kaldır");
                        if btn_close.clicked() {
                            keep_alive = false;
                        }
                        
                        let btn_focus = ui.button("✏").on_hover_text("Fokus & Düzenle");
                        if btn_focus.clicked() {
                            widget.set_state(WidgetState::Focus);
                        }
                        
                        let btn_max = ui.button("🗖").on_hover_text("Tam Ekran");
                        if btn_max.clicked() {
                            widget.set_state(WidgetState::Maximized);
                        }
                        
                        let btn_pop = ui.button("↗").on_hover_text("Dış Pencere");
                        if btn_pop.clicked() {
                            widget.set_state(WidgetState::PopOut);
                        }
                    });
                });
            }

            // Center placeholder visual - hidden if the widget is extremely small
            if sw > 90.0 * scale && sh > 50.0 * scale {
                let icon_text = match widget.widget_type.as_str() {
                    "NOTE" => "📝 Not Defteri",
                    "SPREADSHEET" => "📊 Tablo Çalışması",
                    "CALCULATOR" => "🧮 Mühendislik Hesabı",
                    "AI_ASSISTANT" => "🤖 Yapay Zeka Asistanı",
                    "DATA_VAULT" => "📂 Veri Kasası",
                    "CAD_3D" => "📐 3D Modelleme",
                    "CAD_2D" => "📏 2D Çizim Portu",
                    _ => "📦 Hibrit Widget"
                };
                let display_text = if zoom >= 0.55 {
                    format!("{}\n(Çift Tıklayın)", icon_text)
                } else {
                    icon_text.to_string()
                };
                ui.painter().text(
                    window_rect.center(),
                    egui::Align2::CENTER_CENTER,
                    display_text,
                    egui::FontId::proportional(11.0 * scale),
                    egui::Color32::from_gray(100),
                );
            }
        }
        WidgetState::Focus => {
            let sx = rect.min.x + (widget.x * zoom) + pan.x;
            let sy = rect.min.y + (widget.y * zoom) + pan.y;
            let sw = widget.width * zoom;
            let sh = widget.height * zoom;

            let window_rect = egui::Rect::from_min_size(egui::pos2(sx, sy), egui::vec2(sw, sh));
            ui.painter().rect_stroke(window_rect, rounding, egui::Stroke::new(1.5 * scale, egui::Color32::from_rgb(59, 130, 246)));

            // Header dragging
            let header_rect = egui::Rect::from_min_size(egui::pos2(sx, sy), egui::vec2(sw, header_height));
            let response = ui.allocate_rect(header_rect, egui::Sense::drag());
            if response.dragged() {
                widget.x += response.drag_delta().x / zoom;
                widget.y += response.drag_delta().y / zoom;
            }

            ui.painter().rect_filled(header_rect, egui::Rounding { nw: rounding, ne: rounding, sw: 0.0, se: 0.0 }, egui::Color32::from_gray(30));

            // Title - scaled and truncated/hidden if too narrow to prevent overlap
            if sw > 60.0 * scale {
                let max_chars = ((sw / (6.5 * scale)) as usize).max(3);
                let display_title = if widget.name.chars().count() > max_chars {
                    let mut truncated: String = widget.name.chars().take(max_chars - 3).collect();
                    truncated.push_str("...");
                    truncated
                } else {
                    widget.name.clone()
                };

                ui.painter().text(
                    egui::pos2(sx + 10.0 * scale, sy + header_height / 2.0),
                    egui::Align2::LEFT_CENTER,
                    format!("{} (Fokus)", display_title),
                    egui::FontId::proportional(font_size),
                    egui::Color32::WHITE,
                );
            }

            // Sleek Flat Icon Action Buttons - only render if there is enough visual room
            let show_buttons = sw >= 150.0 * scale && zoom >= 0.45;
            if show_buttons {
                let btn_width = 110.0 * scale;
                let btn_rect = egui::Rect::from_min_max(
                    egui::pos2(sx + sw - btn_width - 5.0 * scale, sy + 3.0 * scale),
                    egui::pos2(sx + sw - 5.0 * scale, sy + header_height - 3.0 * scale),
                );
                ui.allocate_ui_at_rect(btn_rect, |ui| {
                    ui.horizontal(|ui| {
                        ui.style_mut().spacing.button_padding = egui::vec2(4.0 * scale, 1.0 * scale);
                        ui.style_mut().text_styles.insert(
                            egui::TextStyle::Button,
                            egui::FontId::proportional(10.0 * scale)
                        );
                        
                        let btn_close = ui.button("❌").on_hover_text("Widget'ı Kapat & Kaldır");
                        if btn_close.clicked() {
                            keep_alive = false;
                        }
                        
                        let btn_dormant = ui.button("🗕").on_hover_text("Fokustan Çık");
                        if btn_dormant.clicked() {
                            widget.set_state(WidgetState::Dormant);
                        }
                        
                        let btn_max = ui.button("🗖").on_hover_text("Tam Ekran");
                        if btn_max.clicked() {
                            widget.set_state(WidgetState::Maximized);
                        }
                        
                        let btn_pop = ui.button("↗").on_hover_text("Dış Pencere");
                        if btn_pop.clicked() {
                            widget.set_state(WidgetState::PopOut);
                        }
                    });
                });
            }

            // Delegate specialized content drawing to the closure (bounds are dynamically scaled to prevent overlays)
            let content_rect = egui::Rect::from_min_size(
                egui::pos2(sx + 4.0 * scale, sy + (header_height + 4.0 * scale)),
                egui::vec2(sw - 8.0 * scale, sh - (header_height + 8.0 * scale))
            );
            render_content(widget, ui, frame, content_rect);
        }
        WidgetState::Maximized => {
            let sx = rect.min.x;
            let sy = rect.min.y;
            let sw = rect.width();
            let sh = rect.height();

            // 1. Draw professional non-overlapping top header bar
            let header_rect = egui::Rect::from_min_size(egui::pos2(sx, sy), egui::vec2(sw, 30.0));
            ui.painter().rect_filled(header_rect, 0.0, egui::Color32::from_gray(25));
            ui.painter().text(
                egui::pos2(sx + 15.0, sy + 15.0),
                egui::Align2::LEFT_CENTER,
                format!("{} (Tam Ekran)", widget.name),
                egui::FontId::proportional(12.0),
                egui::Color32::WHITE,
            );

            // Close button inside header (no WebView overlap!)
            egui::Area::new(egui::Id::new("max_exit"))
                .fixed_pos(egui::pos2(sx + sw - 150.0, sy + 3.0))
                .show(ctx, |ui| {
                    ui.style_mut().spacing.button_padding = egui::vec2(8.0, 3.0);
                    if ui.button("🔙 Kanvasa Geri Dön").clicked() {
                        widget.set_state(WidgetState::Dormant);
                    }
                });

            // Delegate maximized content drawing (shifted by 30px top bar)
            let content_rect = egui::Rect::from_min_size(
                egui::pos2(sx, sy + 30.0),
                egui::vec2(sw, sh - 30.0)
            );
            render_content(widget, ui, frame, content_rect);
        }
        WidgetState::PopOut => {
            let mut open = true;
            egui::Window::new(&widget.name)
                .open(&mut open)
                .resizable(true)
                .default_size([widget.width, widget.height])
                .show(ctx, |ui| {
                    let inner_rect = ui.available_rect_before_wrap();
                    let size = ui.available_size();

                    // Delegate popped-out window content drawing
                    let content_rect = egui::Rect::from_min_size(
                        inner_rect.min,
                        size
                    );
                    render_content(widget, ui, frame, content_rect);
                });

            if !open {
                widget.set_state(WidgetState::Dormant);
            }
        }
    }

    keep_alive
}
