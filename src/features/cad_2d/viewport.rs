use eframe::egui;
use super::types::{Cad2DTool, Cad2DEntity};

pub struct Cad2DViewport {
    pub entities: Vec<Cad2DEntity>,
    pub active_tool: Cad2DTool,
    pub first_point: Option<egui::Pos2>,
    pub command_input: String,
    pub command_history: Vec<String>,
}

impl Cad2DViewport {
    pub fn new() -> Self {
        // Pre-populate some vector shapes to represent an engineering drawing
        let entities = vec![
            Cad2DEntity::Rectangle {
                rect: egui::Rect::from_min_max(egui::pos2(100.0, 100.0), egui::pos2(400.0, 300.0)),
            },
            Cad2DEntity::Circle {
                center: egui::pos2(250.0, 200.0),
                radius: 50.0,
            },
            Cad2DEntity::Line {
                p1: egui::pos2(100.0, 100.0),
                p2: egui::pos2(400.0, 300.0),
            },
            Cad2DEntity::Line {
                p1: egui::pos2(100.0, 300.0),
                p2: egui::pos2(400.0, 100.0),
            },
        ];

        Self {
            entities,
            active_tool: Cad2DTool::None,
            first_point: None,
            command_input: String::new(),
            command_history: vec!["TSuperMachine 2D CAD Çekirdeği Hazır.".to_string()],
        }
    }

    /// Renders the AutoCAD-style interactive 2D CAD drawing viewport
    pub fn show(&mut self, ui: &mut egui::Ui) {
        let _rect = ui.available_rect_before_wrap();

        // 1. Draw viewport toolbar
        ui.horizontal(|ui| {
            ui.label(egui::RichText::new("AutoCAD Modu:").strong());
            if ui.selectable_label(self.active_tool == Cad2DTool::Line, "L (Çizgi)").clicked() {
                self.set_tool(Cad2DTool::Line, "Komut: LINE (Çizgi). Birinci noktayı seçin...");
            }
            if ui.selectable_label(self.active_tool == Cad2DTool::Circle, "C (Daire)").clicked() {
                self.set_tool(Cad2DTool::Circle, "Komut: CIRCLE (Daire). Merkez noktayı seçin...");
            }
            if ui.selectable_label(self.active_tool == Cad2DTool::Rectangle, "REC (Dikdörtgen)").clicked() {
                self.set_tool(Cad2DTool::Rectangle, "Komut: RECTANGLE (Dikdörtgen). Köşe noktayı seçin...");
            }
            if ui.button("Temizle").clicked() {
                self.entities.clear();
                self.command_history.push("Tüm çizim temizlendi.".to_string());
                self.active_tool = Cad2DTool::None;
                self.first_point = None;
            }
        });

        ui.add_space(8.0);

        // 2. Allocate canvas drawing area
        let (response, painter) = ui.allocate_painter(
            ui.available_size() - egui::vec2(0.0, 30.0), // Reserve bottom for command prompt
            egui::Sense::click_and_drag(),
        );

        let canvas_rect = response.rect;

        // Draw drawing background grid (AutoCAD style black workspace)
        painter.rect_filled(canvas_rect, 4.0, egui::Color32::from_rgb(10, 15, 15));
        
        let grid_stroke = egui::Stroke::new(0.5, egui::Color32::from_gray(25));
        let step = 30.0;
        
        let mut x = canvas_rect.min.x;
        while x < canvas_rect.max.x {
            painter.line_segment([egui::pos2(x, canvas_rect.min.y), egui::pos2(x, canvas_rect.max.y)], grid_stroke);
            x += step;
        }
        let mut y = canvas_rect.min.y;
        while y < canvas_rect.max.y {
            painter.line_segment([egui::pos2(canvas_rect.min.x, y), egui::pos2(canvas_rect.max.x, y)], grid_stroke);
            y += step;
        }

        // 3. Render all existing CAD vector entities on the GPU
        let entity_stroke = egui::Stroke::new(1.5, egui::Color32::from_rgb(34, 211, 238)); // Cyan vectors
        for entity in &self.entities {
            match entity {
                Cad2DEntity::Line { p1, p2 } => {
                    painter.line_segment([*p1, *p2], entity_stroke);
                }
                Cad2DEntity::Circle { center, radius } => {
                    painter.circle_stroke(*center, *radius, entity_stroke);
                }
                Cad2DEntity::Rectangle { rect } => {
                    painter.rect_stroke(*rect, 0.0, entity_stroke);
                }
            }
        }

        // 4. Handle interactive drawing clicks
        if response.clicked() {
            if let Some(pointer_pos) = response.interact_pointer_pos() {
                match self.active_tool {
                    Cad2DTool::Line => {
                        if let Some(p1) = self.first_point {
                            self.entities.push(Cad2DEntity::Line { p1, p2: pointer_pos });
                            self.command_history.push(format!("Çizgi çizildi: ({:.1}, {:.1}) -> ({:.1}, {:.1})", p1.x, p1.y, pointer_pos.x, pointer_pos.y));
                            self.first_point = None; // Reset
                        } else {
                            self.first_point = Some(pointer_pos);
                            self.command_history.push("Birinci nokta seçildi. İkinci noktayı seçin...".to_string());
                        }
                    }
                    Cad2DTool::Circle => {
                        if let Some(center) = self.first_point {
                            let radius = center.distance(pointer_pos);
                            self.entities.push(Cad2DEntity::Circle { center, radius });
                            self.command_history.push(format!("Daire çizildi: Merkez ({:.1}, {:.1}), Yarıçap: {:.1}", center.x, center.y, radius));
                            self.first_point = None;
                        } else {
                            self.first_point = Some(pointer_pos);
                            self.command_history.push("Daire merkezi seçildi. Yarıçapı belirlemek için bir nokta seçin...".to_string());
                        }
                    }
                    Cad2DTool::Rectangle => {
                        if let Some(p1) = self.first_point {
                            let rect = egui::Rect::from_two_pos(p1, pointer_pos);
                            self.entities.push(Cad2DEntity::Rectangle { rect });
                            self.command_history.push(format!("Dikdörtgen çizildi: ({:.1}, {:.1}) -> ({:.1}, {:.1})", p1.x, p1.y, pointer_pos.x, pointer_pos.y));
                            self.first_point = None;
                        } else {
                            self.first_point = Some(pointer_pos);
                            self.command_history.push("Dikdörtgen köşesi seçildi. Karşı köşeyi seçin...".to_string());
                        }
                    }
                    Cad2DTool::None => {}
                }
            }
        }

        // Draw rubber-band/guideline preview during drawing
        if let Some(p1) = self.first_point {
            if let Some(pointer_pos) = ui.input(|i| i.pointer.hover_pos()) {
                let preview_stroke = egui::Stroke::new(1.0, egui::Color32::from_rgba_unmultiplied(234, 179, 8, 150)); // Yellow dashed preview
                match self.active_tool {
                    Cad2DTool::Line => {
                        painter.line_segment([p1, pointer_pos], preview_stroke);
                    }
                    Cad2DTool::Circle => {
                        let radius = p1.distance(pointer_pos);
                        painter.circle_stroke(p1, radius, preview_stroke);
                    }
                    Cad2DTool::Rectangle => {
                        let rect = egui::Rect::from_two_pos(p1, pointer_pos);
                        painter.rect_stroke(rect, 0.0, preview_stroke);
                    }
                    _ => {}
                }
            }
        }

        ui.add_space(8.0);

        // 5. AutoCAD-style bottom Command Line prompt
        egui::TopBottomPanel::bottom("cad_command_line")
            .resizable(false)
            .show_inside(ui, |ui| {
                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new("KOMUT >").strong().color(egui::Color32::from_rgb(34, 211, 238)));
                    
                    let last_history = self.command_history.last().cloned().unwrap_or_default();
                    ui.label(egui::RichText::new(&last_history).color(egui::Color32::from_gray(160)));
                });
            });
    }

    fn set_tool(&mut self, tool: Cad2DTool, prompt: &str) {
        self.active_tool = tool;
        self.first_point = None;
        self.command_history.push(prompt.to_string());
    }
}
