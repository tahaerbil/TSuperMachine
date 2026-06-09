use eframe::egui;
use crate::features::{WidgetInstance, WidgetState};

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ActiveTool {
    Workspace,
    Cad2D,
    AiAssistant,
    Settings,
}

pub struct Sidebar {
    pub active_tool: ActiveTool,
}

impl Sidebar {
    pub fn new() -> Self {
        Self {
            active_tool: ActiveTool::Workspace,
        }
    }

    /// Renders the left-side hovering translucent dock panel
    pub fn show(&mut self, ctx: &egui::Context, widgets: &mut Vec<WidgetInstance>) {
        egui::Area::new(egui::Id::new("hovering_dock"))
            .anchor(egui::Align2::LEFT_CENTER, egui::vec2(15.0, 0.0))
            .show(ctx, |ui| {
                egui::Frame::none()
                    .fill(egui::Color32::from_rgba_unmultiplied(15, 20, 25, 235)) // Translucent glassmorphism
                    .rounding(16.0)
                    .stroke(egui::Stroke::new(1.0, egui::Color32::from_rgba_unmultiplied(255, 255, 255, 12))) // Subtle white edge border
                    .inner_margin(8.0)
                    .show(ui, |ui| {
                        ui.set_width(52.0);
                        ui.vertical_centered(|ui| {
                            // Section 1: Core Navigation Switchers
                            ui.label(egui::RichText::new("⚙").size(22.0).color(egui::Color32::from_rgb(59, 130, 246)));
                            ui.add_space(8.0);
                            ui.separator();
                            ui.add_space(8.0);

                            self.tool_button(ui, "🎨", ActiveTool::Workspace, "Sonsuz Kanvas Alanı");
                            ui.add_space(12.0);
                            
                            self.tool_button(ui, "✏", ActiveTool::Cad2D, "Yerel 2D CAD Ekranı");
                            ui.add_space(12.0);
                            
                            self.tool_button(ui, "🤖", ActiveTool::AiAssistant, "Çevrimdışı Yapay Zeka");
                            ui.add_space(12.0);
                            
                            self.tool_button(ui, "⚙", ActiveTool::Settings, "Sistem Ayarları");
                            
                            ui.add_space(15.0);
                            ui.separator();
                            ui.add_space(15.0);

                            // Section 2: Spawner Title
                            ui.label(egui::RichText::new("EKLE").size(8.0).strong().color(egui::Color32::from_gray(130)));
                            ui.add_space(8.0);

                            // Spawn Note
                            if ui.button("📝").on_hover_text("Not Defteri Ekle").clicked() {
                                let id = format!("note_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("Not Defteri #{}", widgets.len() + 1),
                                    "NOTE",
                                    100.0,
                                    150.0,
                                    420.0,
                                    350.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn 3D CAD
                            if ui.button("📐").on_hover_text("3D Modelleme Ekle").clicked() {
                                let id = format!("cad3d_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("3D CAD Modeli #{}", widgets.len() + 1),
                                    "CAD_3D",
                                    300.0,
                                    150.0,
                                    550.0,
                                    400.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn 2D CAD (Embedded)
                            if ui.button("📏").on_hover_text("2D CAD Çizimi Ekle").clicked() {
                                let id = format!("cad2d_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("2D CAD Çizimi #{}", widgets.len() + 1),
                                    "CAD_2D",
                                    200.0,
                                    200.0,
                                    550.0,
                                    400.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn Spreadsheet
                            if ui.button("📊").on_hover_text("E-Tablo Ekle").clicked() {
                                let id = format!("spreadsheet_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("E-Tablo #{}", widgets.len() + 1),
                                    "SPREADSHEET",
                                    150.0,
                                    250.0,
                                    580.0,
                                    420.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn Calculator
                            if ui.button("🧮").on_hover_text("Hesap Makinesi Ekle").clicked() {
                                let id = format!("calc_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("Hesap Makinesi #{}", widgets.len() + 1),
                                    "CALCULATOR",
                                    250.0,
                                    200.0,
                                    420.0,
                                    350.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn AI Chat
                            if ui.button("🤖").on_hover_text("AI Asistanı Ekle").clicked() {
                                let id = format!("ai_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("AI Asistanı #{}", widgets.len() + 1),
                                    "AI_ASSISTANT",
                                    350.0,
                                    100.0,
                                    450.0,
                                    500.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                            ui.add_space(10.0);

                            // Spawn Data Vault
                            if ui.button("📂").on_hover_text("Veri Kasası Ekle").clicked() {
                                let id = format!("vault_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
                                let mut w = WidgetInstance::new(
                                    &id,
                                    &format!("Veri Kasası #{}", widgets.len() + 1),
                                    "DATA_VAULT",
                                    180.0,
                                    180.0,
                                    450.0,
                                    500.0,
                                );
                                w.set_state(WidgetState::Focus);
                                widgets.push(w);
                            }
                        });
                    });
            });
    }

    fn tool_button(&mut self, ui: &mut egui::Ui, icon: &str, tool: ActiveTool, tooltip: &str) {
        let is_selected = self.active_tool == tool;
        
        let button_text = egui::RichText::new(icon).size(18.0);
        let button = if is_selected {
            egui::Button::new(button_text)
                .fill(egui::Color32::from_rgba_unmultiplied(59, 130, 246, 50)) // Selected tint
                .stroke(egui::Stroke::new(1.0, egui::Color32::from_rgb(59, 130, 246)))
        } else {
            egui::Button::new(button_text)
                .fill(egui::Color32::TRANSPARENT)
                .stroke(egui::Stroke::NONE)
        };

        if ui.add(button).on_hover_text(tooltip).clicked() {
            self.active_tool = tool;
        }
    }
}

