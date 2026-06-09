use eframe::egui;
use super::types::{Shape3D, ShapeInstance};

pub struct Cad3DViewport {
    pub features: Vec<ShapeInstance>,
    pub selected_index: Option<usize>,
    pub yaw: f32,   // Rotation around Y axis
    pub pitch: f32, // Rotation around X axis
}

impl Cad3DViewport {
    pub fn new() -> Self {
        // Pre-populate parametric features like a SolidWorks modeling tree
        let features = vec![
            ShapeInstance {
                name: "Taban Blok (Box)".to_string(),
                shape: Shape3D::Box { w: 120.0, h: 40.0, d: 80.0 },
                color: egui::Color32::from_rgb(148, 163, 184), // Steel blue
            },
            ShapeInstance {
                name: "Silindirik Pim (Cylinder)".to_string(),
                shape: Shape3D::Cylinder { radius: 25.0, height: 60.0 },
                color: egui::Color32::from_rgb(59, 130, 246), // Blue
            },
        ];

        Self {
            features,
            selected_index: Some(0),
            yaw: 0.5,    // Initial angles in radians
            pitch: -0.4,
        }
    }

    /// Renders the SolidWorks-style 3D Feature Tree and GPU Orbit viewport
    pub fn show(&mut self, ui: &mut egui::Ui) {
        let _rect = ui.available_rect_before_wrap();

        // 1. Viewport Toolbar
        ui.horizontal(|ui| {
            ui.label(egui::RichText::new("SolidWorks Modu:").strong());
            if ui.button("➕ Kutu Ekle").clicked() {
                self.features.push(ShapeInstance {
                    name: format!("Kutu {}", self.features.len() + 1),
                    shape: Shape3D::Box { w: 60.0, h: 60.0, d: 60.0 },
                    color: egui::Color32::from_rgb(234, 179, 8),
                });
            }
            if ui.button("➕ Silindir Ekle").clicked() {
                self.features.push(ShapeInstance {
                    name: format!("Silindir {}", self.features.len() + 1),
                    shape: Shape3D::Cylinder { radius: 20.0, height: 50.0 },
                    color: egui::Color32::from_rgb(34, 197, 94),
                });
            }
            if ui.button("Reset Orbit").clicked() {
                self.yaw = 0.5;
                self.pitch = -0.4;
            }
        });

        ui.add_space(8.0);

        // 2. Main content split into Feature Tree (Left) and 3D Viewport (Right)
        ui.columns(2, |columns| {
            // --- LEFT COLUMN: SolidWorks Feature Tree ---
            columns[0].vertical(|ui| {
                ui.label(egui::RichText::new("📁 Unsurlar (Feature Tree)").strong().color(egui::Color32::from_rgb(59, 130, 246)));
                ui.add_space(5.0);
                
                egui::Frame::group(ui.style()).show(ui, |ui| {
                    ui.set_min_height(150.0);
                    ui.set_width(ui.available_width());
                    
                    let mut delete_index = None;
                    for (i, feature) in self.features.iter().enumerate() {
                        let is_selected = Some(i) == self.selected_index;
                        ui.horizontal(|ui| {
                            let label = ui.selectable_label(is_selected, format!("📐 {}", feature.name));
                            if label.clicked() {
                                self.selected_index = Some(i);
                            }
                            
                            // Delete button
                            if ui.button("🗑").clicked() {
                                delete_index = Some(i);
                            }
                        });
                    }

                    if let Some(idx) = delete_index {
                        self.features.remove(idx);
                        self.selected_index = None;
                    }
                });

                // Display selected feature parameters
                if let Some(idx) = self.selected_index {
                    if idx < self.features.len() {
                        ui.add_space(10.0);
                        ui.label(egui::RichText::new("⚙ Parametreler").strong());
                        let feature = &self.features[idx];
                        match feature.shape {
                            Shape3D::Box { w, h, d } => {
                                ui.label(format!("Tip: Dikdörtgen Prizma\nGenişlik: {:.1} mm\nYükseklik: {:.1} mm\nDerinlik: {:.1} mm", w, h, d));
                            }
                            Shape3D::Cylinder { radius, height } => {
                                ui.label(format!("Tip: Silindir\nYarıçap: {:.1} mm\nYükseklik: {:.1} mm", radius, height));
                            }
                            Shape3D::Sphere { radius } => {
                                ui.label(format!("Tip: Küre\nYarıçap: {:.1} mm", radius));
                            }
                        }
                    }
                }
            });

            // --- RIGHT COLUMN: 3D Orbit Viewport ---
            columns[1].vertical(|ui| {
                ui.label(egui::RichText::new("👁 3D Görünüm").strong().color(egui::Color32::from_rgb(148, 163, 184)));
                ui.add_space(5.0);

                let (response, painter) = ui.allocate_painter(
                    ui.available_size(),
                    egui::Sense::drag(),
                );

                let viewport_rect = response.rect;

                // Black mechanical engineering viewport background
                painter.rect_filled(viewport_rect, 4.0, egui::Color32::from_rgb(15, 20, 25));

                // Mouse Orbit controls (drag rotates 3D viewport)
                if response.dragged() {
                    let delta = response.drag_delta();
                    self.yaw += delta.x * 0.01;
                    self.pitch = (self.pitch - delta.y * 0.01).clamp(-1.4, 1.4); // Clamp pitch to avoid gimbal lock
                }

                // Render coordinate axes helper in corner
                let axis_origin = egui::pos2(viewport_rect.min.x + 40.0, viewport_rect.max.y - 40.0);
                self.draw_axes(&painter, axis_origin);

                // Project and Draw 3D entities
                let center = viewport_rect.center();
                
                // Rotation matrix math values
                let cos_y = self.yaw.cos();
                let sin_y = self.yaw.sin();
                let cos_p = self.pitch.cos();
                let sin_p = self.pitch.sin();

                // Helper projection closure: maps 3D points -> 2D screen points
                let project = |x: f32, y: f32, z: f32| -> egui::Pos2 {
                    // Rotate Y (Yaw)
                    let x_y = x * cos_y - z * sin_y;
                    let z_y = x * sin_y + z * cos_y;
                    
                    // Rotate X (Pitch)
                    let y_p = y * cos_p - z_y * sin_p;
                    
                    // Orthographic projection to 2D Screen
                    egui::pos2(center.x + x_y, center.y - y_p)
                };

                // Draw each feature from the SolidWorks tree
                for (idx, feature) in self.features.iter().enumerate() {
                    let stroke_color = if Some(idx) == self.selected_index {
                        egui::Color32::from_rgb(239, 68, 68) // Red highlighting for selection
                    } else {
                        feature.color
                    };
                    
                    let stroke = egui::Stroke::new(2.0, stroke_color);

                    match feature.shape {
                        Shape3D::Box { w, h, d } => {
                            // Render 3D Wireframe Box (8 corners, 12 segments)
                            let hw = w / 2.0;
                            let hh = h / 2.0;
                            let hd = d / 2.0;

                            // 3D coordinates of 8 vertices
                            let v = [
                                project(-hw, -hh, -hd), // 0
                                project(hw, -hh, -hd),  // 1
                                project(hw, hh, -hd),   // 2
                                project(-hw, hh, -hd),  // 3
                                project(-hw, -hh, hd),  // 4
                                project(hw, -hh, hd),   // 5
                                project(hw, hh, hd),    // 6
                                project(-hw, hh, hd),   // 7
                            ];

                            // Draw bottom frame
                            painter.line_segment([v[0], v[1]], stroke);
                            painter.line_segment([v[1], v[2]], stroke);
                            painter.line_segment([v[2], v[3]], stroke);
                            painter.line_segment([v[3], v[0]], stroke);

                            // Draw top frame
                            painter.line_segment([v[4], v[5]], stroke);
                            painter.line_segment([v[5], v[6]], stroke);
                            painter.line_segment([v[6], v[7]], stroke);
                            painter.line_segment([v[7], v[4]], stroke);

                            // Draw verticals connecting columns
                            painter.line_segment([v[0], v[4]], stroke);
                            painter.line_segment([v[1], v[5]], stroke);
                            painter.line_segment([v[2], v[6]], stroke);
                            painter.line_segment([v[3], v[7]], stroke);
                        }
                        Shape3D::Cylinder { radius, height } => {
                            // Render Cylinder (Top circle, bottom circle, and side silhouette lines)
                            let hh = height / 2.0;
                            let steps = 16;
                            
                            // Draw top and bottom circle faces
                            let mut prev_v_top = project(radius, -hh, 0.0);
                            let mut prev_v_bottom = project(radius, hh, 0.0);
                            
                            for s in 1..=steps {
                                let angle = (s as f32) * (std::f32::consts::PI * 2.0) / (steps as f32);
                                let cx = radius * angle.cos();
                                let cz = radius * angle.sin();

                                let v_top = project(cx, -hh, cz);
                                let v_bottom = project(cx, hh, cz);

                                painter.line_segment([prev_v_top, v_top], stroke);
                                painter.line_segment([prev_v_bottom, v_bottom], stroke);

                                // Draw vertical silhouettes at cardinal directions to give 3D cylinder depth
                                if s == steps || s == steps / 2 || s == steps / 4 || s == (3 * steps) / 4 {
                                    painter.line_segment([v_top, v_bottom], stroke);
                                }

                                prev_v_top = v_top;
                                prev_v_bottom = v_bottom;
                            }
                        }
                        Shape3D::Sphere { radius } => {
                            // Render Sphere circles along three perpendicular axis lines
                            let steps = 16;
                            let mut prev_p = project(radius, 0.0, 0.0);
                            for s in 1..=steps {
                                let angle = (s as f32) * (std::f32::consts::PI * 2.0) / (steps as f32);
                                let cx = radius * angle.cos();
                                let cz = radius * angle.sin();
                                let v = project(cx, 0.0, cz);
                                painter.line_segment([prev_p, v], stroke);
                                prev_p = v;
                            }
                        }
                    }
                }
            });
        });
    }

    fn draw_axes(&self, painter: &egui::Painter, origin: egui::Pos2) {
        let size = 25.0;
        let cos_y = self.yaw.cos();
        let sin_y = self.yaw.sin();
        let cos_p = self.pitch.cos();
        let sin_p = self.pitch.sin();

        let project_axis = |ax: f32, ay: f32, az: f32| -> egui::Pos2 {
            let rx = ax * cos_y - az * sin_y;
            let ry = ax * sin_y + az * cos_y;
            let rp = ay * cos_p - ry * sin_p;
            egui::pos2(origin.x + rx * size, origin.y - rp * size)
        };

        let x_end = project_axis(1.0, 0.0, 0.0);
        let y_end = project_axis(0.0, 1.0, 0.0);
        let z_end = project_axis(0.0, 0.0, 1.0);

        // Draw axes lines (Red: X, Green: Y, Blue: Z)
        painter.line_segment([origin, x_end], egui::Stroke::new(2.0, egui::Color32::RED));
        painter.line_segment([origin, y_end], egui::Stroke::new(2.0, egui::Color32::GREEN));
        painter.line_segment([origin, z_end], egui::Stroke::new(2.0, egui::Color32::BLUE));
    }
}
