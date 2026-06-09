use eframe::egui;
use crate::canvas::Canvas;
use crate::panels::{Sidebar, ActiveTool};
use crate::features::{
    WidgetInstance, WidgetState,
    show_note_widget, show_cad3d_widget, show_cad2d_widget,
    show_spreadsheet_widget, show_calculator_widget,
    show_ai_assistant_widget, show_data_vault_widget,
    Cad2DViewport, Cad3DViewport, SpreadsheetState,
    CalculatorState, AiAssistantState, DataVaultState,
};

pub struct TSuperMachineApp {
    sidebar: Sidebar,
    canvas: Canvas,
    widgets: Vec<WidgetInstance>,
    cad2d: Cad2DViewport,
    cad3d: Cad3DViewport,
    spreadsheet: SpreadsheetState,
    calculator: CalculatorState,
    ai: AiAssistantState,
    vault: DataVaultState,
}

impl TSuperMachineApp {
    pub fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        // 1. Native Zengin Metin Not Defteri Widget'ı (Saf Rust)
        let mut note_widget = WidgetInstance::new(
            "note_1",
            "Mühendislik Not Defteri (Yerel Rust)",
            "NOTE",
            100.0,
            150.0,
            420.0,
            350.0,
        );
        note_widget.set_state(WidgetState::Focus);

        // 2. Pure Native GPU Widget (SolidWorks 3D CAD)
        let mut cad3d_widget = WidgetInstance::new(
            "cad3d_1",
            "3D CAD Modelleme (SolidWorks Yerel)",
            "CAD_3D",
            580.0,
            150.0,
            550.0,
            400.0,
        );
        cad3d_widget.set_state(WidgetState::Focus);

        Self {
            sidebar: Sidebar::new(),
            canvas: Canvas::new(),
            widgets: vec![note_widget, cad3d_widget],
            cad2d: Cad2DViewport::new(),
            cad3d: Cad3DViewport::new(),
            spreadsheet: SpreadsheetState::new(),
            calculator: CalculatorState::new(),
            ai: AiAssistantState::new(),
            vault: DataVaultState::new(),
        }
    }
}

impl eframe::App for TSuperMachineApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let mut visuals = egui::Visuals::dark();
        visuals.window_rounding = egui::Rounding::same(8.0);
        ctx.set_visuals(visuals);

        // 1. Render Sidebar Panel (Hovering glass dock)
        self.sidebar.show(ctx, &mut self.widgets);

        // 2. Render Status Footer Panel
        egui::TopBottomPanel::bottom("status_bar")
            .resizable(false)
            .show(ctx, |ui| {
                ui.horizontal(|ui| {
                    ui.label("Status: Active");
                    ui.add_space(20.0);
                    
                    let tool_text = match self.sidebar.active_tool {
                        ActiveTool::Workspace => "Mode: Infinite Canvas Workspace (Hybrid Core)",
                        ActiveTool::Cad2D => "Mode: 2D CAD Viewport (AutoCAD Yerel)",
                        ActiveTool::AiAssistant => "Mode: AI Chatbot Assistant",
                        ActiveTool::Settings => "Mode: Settings",
                    };
                    ui.label(tool_text);

                    ui.add_space(ui.available_width() - 340.0);
                    ui.label(format!("Zoom: {:.2}x", self.canvas.zoom_level));
                    ui.separator();
                    ui.label("GPU Acceleration: Active");
                });
            });

        // 3. Render Central Panel
        egui::CentralPanel::default().show(ctx, |ui| {
            let rect = ui.available_rect_before_wrap();

            match self.sidebar.active_tool {
                ActiveTool::Workspace => {
                    // Draw infinite GPU grid
                    self.canvas.show(ui);

                    let zoom = self.canvas.zoom_level;
                    let pan = self.canvas.pan_offset;

                    // Keep references to active sub-widgets state
                    let active_cad2d = &mut self.cad2d;
                    let active_cad3d = &mut self.cad3d;
                    let active_spreadsheet = &mut self.spreadsheet;
                    let active_calculator = &mut self.calculator;
                    let active_ai = &mut self.ai;
                    let active_vault = &mut self.vault;

                    self.widgets.retain_mut(|widget| {
                        let keep = match widget.widget_type.as_str() {
                            "NOTE" => {
                                show_note_widget(widget, ui, ctx, _frame, rect, zoom, pan)
                            }
                            "SPREADSHEET" => {
                                show_spreadsheet_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_spreadsheet)
                            }
                            "CALCULATOR" => {
                                show_calculator_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_calculator)
                            }
                            "AI_ASSISTANT" => {
                                show_ai_assistant_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_ai)
                            }
                            "DATA_VAULT" => {
                                show_data_vault_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_vault)
                            }
                            "CAD_3D" => {
                                show_cad3d_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_cad3d)
                            }
                            "CAD_2D" => {
                                show_cad2d_widget(widget, ui, ctx, _frame, rect, zoom, pan, active_cad2d)
                            }
                            _ => true,
                        };
                        keep
                    });
                }
                ActiveTool::Cad2D => {
                    // Render the high-performance AutoCAD 2D viewport natively!
                    self.cad2d.show(ui);
                }
                _ => {
                    match self.sidebar.active_tool {
                        ActiveTool::AiAssistant => {
                            ui.vertical_centered(|ui| {
                                ui.add_space(100.0);
                                ui.heading("🤖 Yerel Yapay Zeka Asistanı");
                                ui.add_space(20.0);
                                ui.label("Offline LLM model chat goes here.");
                            });
                        }
                        ActiveTool::Settings => {
                            ui.vertical_centered(|ui| {
                                ui.add_space(100.0);
                                ui.heading("⚙️ Settings");
                                ui.add_space(20.0);
                                ui.label("Theme, Language, and Native Core parameters configuration panel.");
                            });
                        }
                        _ => {}
                    }
                }
            }
        });
    }
}
