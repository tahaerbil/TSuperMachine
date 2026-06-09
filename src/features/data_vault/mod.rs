use eframe::egui;
use crate::features::instance::WidgetInstance;
use crate::features::container::draw_widget_container;

pub struct DataVaultState {
    pub selected_file: Option<String>,
}

impl DataVaultState {
    pub fn new() -> Self {
        Self {
            selected_file: None,
        }
    }
}

pub fn show_data_vault_widget(
    widget: &mut WidgetInstance,
    ui: &mut egui::Ui,
    ctx: &egui::Context,
    frame: &mut eframe::Frame,
    rect: egui::Rect,
    zoom: f32,
    pan: egui::Vec2,
    state: &mut DataVaultState,
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
                ui.label(egui::RichText::new("📂 Veri Kasası (Data Vault)").strong());
                ui.add_space(4.0);

                ui.columns(2, |cols| {
                    // Left column: Tree list
                    cols[0].vertical(|ui| {
                        ui.label(egui::RichText::new("Dosya Ağacı:").weak().size(11.0));
                        ui.add_space(2.0);

                        egui::ScrollArea::vertical().show(ui, |ui| {
                            egui::Frame::group(ui.style()).show(ui, |ui| {
                                ui.set_min_height(100.0);
                                ui.set_width(ui.available_width());

                                if ui.link("📁 3D_Models/").clicked() {}
                                ui.indent("3d_indent", |ui| {
                                    if ui.link("📄 taban_blok.sldprt").clicked() {
                                        state.selected_file = Some("taban_blok.sldprt".to_string());
                                    }
                                    if ui.link("📄 pim_baglantisi.sldasm").clicked() {
                                        state.selected_file = Some("pim_baglantisi.sldasm".to_string());
                                    }
                                });

                                if ui.link("📁 2D_Drawings/").clicked() {}
                                ui.indent("2d_indent", |ui| {
                                    if ui.link("📄 temel_kroki.dxf").clicked() {
                                        state.selected_file = Some("temel_kroki.dxf".to_string());
                                    }
                                    if ui.link("📄 montaj_plani.dwg").clicked() {
                                        state.selected_file = Some("montaj_plani.dwg".to_string());
                                    }
                                });
                            });
                        });
                    });

                    // Right column: File information
                    cols[1].vertical(|ui| {
                        ui.label(egui::RichText::new("Dosya Detayları:").weak().size(11.0));
                        ui.add_space(2.0);

                        if let Some(ref filename) = state.selected_file {
                            egui::Frame::group(ui.style()).show(ui, |ui| {
                                ui.set_min_height(100.0);
                                ui.set_width(ui.available_width());

                                ui.label(egui::RichText::new(filename).strong().color(egui::Color32::LIGHT_BLUE));
                                ui.separator();
                                
                                if filename.ends_with(".sldprt") {
                                    ui.label("Tür: SolidWorks Parçası\nBoyut: 4.8 MB\nVersiyon: v4.2 (Rev 2)\nDurum: Onaylandı");
                                } else if filename.ends_with(".sldasm") {
                                    ui.label("Tür: SolidWorks Montajı\nBoyut: 18.2 MB\nVersiyon: v1.0\nDurum: Taslak");
                                } else if filename.ends_with(".dxf") {
                                    ui.label("Tür: AutoCAD DXF Çizimi\nBoyut: 1.2 MB\nVersiyon: v12\nDurum: İncelemede");
                                } else {
                                    ui.label("Tür: DWG Çizimi\nBoyut: 8.5 MB\nVersiyon: v2024\nDurum: Güncel");
                                }
                            });
                        } else {
                            ui.label("Seçili dosya yok.");
                        }
                    });
                });
            });
        },
    )
}
