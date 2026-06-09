use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;

pub struct AiAssistantState {
    pub messages: Vec<(String, String)>, // (role, content)
    pub input_message: String,
}

impl AiAssistantState {
    pub fn new() -> Self {
        Self {
            messages: vec![
                ("ai".to_string(), "Merhaba Mühendis Taha! Size bugün CAD tasarımı, hesaplamalar veya teknik notlarınız konusunda nasıl yardımcı olabilirim?".to_string()),
            ],
            input_message: String::new(),
        }
    }

    pub fn send(&mut self) {
        if self.input_message.is_empty() {
            return;
        }

        self.messages.push(("user".to_string(), self.input_message.clone()));
        let user_query = self.input_message.clone();
        self.input_message.clear();

        // Simulate a mock offline engineering response
        let ai_response = match user_query.to_lowercase().as_str() {
            q if q.contains("vida") || q.contains("civata") => {
                "M4 standart cıvatalar için diş adımı 0.7mm'dir. Önerilen delik çapı 3.3mm'dir. Detaylı tork dayanım tablosunu Data Vault modülünde bulabilirsiniz."
            }
            q if q.contains("hacim") || q.contains("alan") => {
                "3D modelleme panelinde yer alan 'Taban Blok (Box)' modelinizin hacmi: 120 x 40 x 80 = 384,000 mm³'tür."
            }
            _ => "Anladım. Yerel modeliniz çevrimdışı çalışıyor. SolidWorks 3D viewport veya AutoCAD 2D komut penceresi üzerinden tasarımlarınızı analiz edebilirim."
        };

        self.messages.push(("ai".to_string(), ai_response.to_string()));
    }
}

pub fn show_ai_assistant_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    state: &mut AiAssistantState,
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
                ui.label(egui::RichText::new("🤖 Yerel Yapay Zeka Asistanı").strong());
                ui.add_space(4.0);

                // Messages area
                egui::Frame::none()
                    .fill(egui::Color32::from_gray(15))
                    .rounding(4.0)
                    .show(ui, |ui| {
                        ui.set_height(ui.available_height() - 45.0); // Make space for entry box below
                        ui.set_width(ui.available_width());

                        egui::ScrollArea::vertical().show(ui, |ui| {
                            ui.horizontal_wrapped(|ui| {
                                for (role, content) in &state.messages {
                                    if role == "ai" {
                                        ui.colored_label(egui::Color32::from_rgb(59, 130, 246), "AI > ");
                                        ui.label(content);
                                    } else {
                                        ui.colored_label(egui::Color32::from_rgb(34, 197, 94), "Siz > ");
                                        ui.label(content);
                                    }
                                    ui.add_space(8.0);
                                }
                            });
                        });
                    });

                ui.add_space(8.0);

                // Message entry
                ui.horizontal(|ui| {
                    let text_edit = ui.text_edit_singleline(&mut state.input_message);
                    if text_edit.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)) {
                        state.send();
                    }
                    if ui.button("Gönder").clicked() {
                        state.send();
                    }
                });
            });
        },
    )
}
