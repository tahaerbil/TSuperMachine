use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;

pub struct SpreadsheetState {
    pub cells: [[String; 6]; 10], // 10 rows x 6 columns
    pub selected_cell: Option<(usize, usize)>,
}

impl SpreadsheetState {
    pub fn new() -> Self {
        let mut cells: [[String; 6]; 10] = Default::default();
        // Pre-populate mock values for demo
        cells[0][0] = "Parça No".to_string();
        cells[0][1] = "Miktar".to_string();
        cells[0][2] = "Birim Fiyat".to_string();
        cells[0][3] = "Toplam".to_string();

        cells[1][0] = "M4 Cıvata".to_string();
        cells[1][1] = "150".to_string();
        cells[1][2] = "0.45".to_string();
        cells[1][3] = "67.50".to_string();

        cells[2][0] = "L Profil 50x50".to_string();
        cells[2][1] = "12".to_string();
        cells[2][2] = "8.20".to_string();
        cells[2][3] = "98.40".to_string();

        cells[3][0] = "Servo Motor".to_string();
        cells[3][1] = "4".to_string();
        cells[3][2] = "45.00".to_string();
        cells[3][3] = "180.00".to_string();

        Self {
            cells,
            selected_cell: None,
        }
    }
}

pub fn show_spreadsheet_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    state: &mut SpreadsheetState,
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
                // Header tool menu
                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new("📊 Yerel Tablo Hesaplayıcı").strong());
                    ui.separator();
                    if ui.button("Sıfırla").clicked() {
                        *state = SpreadsheetState::new();
                    }
                });
                
                ui.add_space(4.0);
                
                // Formül barı
                ui.horizontal(|ui| {
                    ui.label("Formül fx: ");
                    if let Some((r, c)) = state.selected_cell {
                        let text = &mut state.cells[r][c];
                        ui.text_edit_singleline(text);
                    } else {
                        let mut empty = String::new();
                        ui.add_enabled(false, egui::TextEdit::singleline(&mut empty).hint_text("Bir hücre seçin"));
                    }
                });
                
                ui.add_space(4.0);

                // Grid table
                egui::ScrollArea::both().show(ui, |ui| {
                    egui::Grid::new("spreadsheet_grid")
                        .striped(true)
                        .min_row_height(22.0)
                        .spacing(egui::vec2(2.0, 2.0))
                        .show(ui, |ui| {
                            // Column Headers (A, B, C...)
                            ui.label(""); // Row index header spacer
                            for col in 0..6 {
                                ui.centered_and_justified(|ui| {
                                    ui.label(egui::RichText::new(((b'A' + col as u8) as char).to_string()).strong());
                                });
                            }
                            ui.end_row();

                            for r in 0..10 {
                                // Row Header (1, 2, 3...)
                                ui.label(egui::RichText::new((r + 1).to_string()).strong());
                                
                                for c in 0..6 {
                                    let is_selected = state.selected_cell == Some((r, c));
                                    let content = &state.cells[r][c];
                                    
                                    let text_color = if r == 0 {
                                        egui::Color32::LIGHT_BLUE
                                    } else {
                                        egui::Color32::WHITE
                                    };

                                    let button = ui.add(
                                        egui::Button::new(
                                            egui::RichText::new(content)
                                                .color(text_color)
                                                .size(11.0)
                                        )
                                        .fill(if is_selected {
                                            egui::Color32::from_rgb(30, 41, 59)
                                        } else {
                                            egui::Color32::from_gray(25)
                                        })
                                        .min_size(egui::vec2(75.0, 20.0))
                                    );

                                    if button.clicked() {
                                        state.selected_cell = Some((r, c));
                                    }
                                }
                                ui.end_row();
                            }
                        });
                });
            });
        },
    )
}
