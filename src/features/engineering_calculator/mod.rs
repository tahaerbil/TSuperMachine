use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;

pub struct CalculatorState {
    pub expression: String,
    pub history: Vec<(String, String)>, // (expression, result)
}

impl CalculatorState {
    pub fn new() -> Self {
        Self {
            expression: String::new(),
            history: vec![
                ("2 * PI * 15".to_string(), "94.248".to_string()),
                ("sqrt(12^2 + 5^2)".to_string(), "13.0".to_string()),
            ],
        }
    }

    pub fn evaluate(&mut self) {
        if self.expression.is_empty() {
            return;
        }

        // Extremely simple safe stack parser for demo calculations
        // Supports basic mathematical operations
        let cleaned = self.expression.replace("PI", "3.14159265").replace("pi", "3.14159265");
        let result = match eval_simple_math(&cleaned) {
            Ok(val) => format!("{:.5}", val),
            Err(e) => format!("Hata: {}", e),
        };

        self.history.push((self.expression.clone(), result));
        self.expression.clear();
    }
}

// Simple evaluator for demo (avoids pulling in heavy math engine dependencies)
fn eval_simple_math(expr: &str) -> Result<f64, &'static str> {
    // Basic parser for expressions like: a * b or a + b
    let mut parts = expr.split_whitespace();
    let left_str = parts.next().ok_or("Boş girdi")?;
    let op = parts.next();
    
    let left: f64 = left_str.parse().map_err(|_| "Sayısal olmayan değer")?;
    
    if let Some(operator) = op {
        let right_str = parts.next().ok_or("İkinci sayı eksik")?;
        let right: f64 = right_str.parse().map_err(|_| "Sayısal olmayan değer")?;
        
        match operator {
            "+" => Ok(left + right),
            "-" => Ok(left - right),
            "*" => Ok(left * right),
            "/" if right != 0.0 => Ok(left / right),
            "/" => Err("Sıfıra bölme hatası"),
            "^" => Ok(left.powf(right)),
            _ => Err("Bilinmeyen operatör (+,-,*,/,^)"),
        }
    } else {
        Ok(left)
    }
}

pub fn show_calculator_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    state: &mut CalculatorState,
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
            let mut inner_ui = ui.child_ui(content_rect, egui::Layout::top_down(egui::Align::Min));
            
            inner_ui.vertical(|ui| {
                ui.label(egui::RichText::new("🧮 Mühendislik Hesabı").strong());
                ui.add_space(4.0);

                // History Display
                egui::Frame::none()
                    .fill(egui::Color32::from_gray(15))
                    .rounding(4.0)
                    .show(ui, |ui| {
                        ui.set_height(80.0);
                        ui.set_width(ui.available_width());
                        egui::ScrollArea::vertical().show(ui, |ui| {
                            for (expr, res) in &state.history {
                                ui.horizontal(|ui| {
                                    ui.label(egui::RichText::new(expr).color(egui::Color32::from_gray(120)).size(10.0));
                                    ui.add_space(ui.available_width() - 80.0);
                                    ui.label(egui::RichText::new(res).color(egui::Color32::LIGHT_GREEN).size(11.0));
                                });
                            }
                        });
                    });

                ui.add_space(8.0);

                // Expression Input
                ui.horizontal(|ui| {
                    ui.label("Girdi:");
                    let text_edit = ui.text_edit_singleline(&mut state.expression);
                    if text_edit.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) {
                        state.evaluate();
                    }
                });

                ui.add_space(8.0);

                // Keyboard help tip
                ui.label(egui::RichText::new("Örn: '5 * 25' veya '3.14 * 2.0' (Boşluk bırakarak yazın, enter ile hesaplayın)").weak().size(9.0));
            });
        },
    )
}
