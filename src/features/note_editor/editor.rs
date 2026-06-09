use eframe::egui;
use super::document::{BlockNode, InlineNode, MarkType};
use super::extensions::{EditorState, EditorExtension, BoldExtension, ItalicExtension, CodeBlockExtension};
use super::history::EditHistory;

pub struct NativeRichTextEditor {
    pub state: EditorState,
    pub history: EditHistory,
    pub extensions: Vec<Box<dyn EditorExtension>>,
}

impl NativeRichTextEditor {
    pub fn new(initial_markdown: &str) -> Self {
        let doc = super::document::parse_markdown(initial_markdown);
        Self {
            state: EditorState::new(doc),
            history: EditHistory::new(),
            extensions: vec![
                Box::new(BoldExtension),
                Box::new(ItalicExtension),
                Box::new(CodeBlockExtension),
            ],
        }
    }

    /// Renders and handles interaction for the rich text editor
    pub fn show(&mut self, ui: &mut egui::Ui, ctx: &egui::Context) {
        ui.vertical(|ui| {
            // 1. Editor Ribbon Toolbar
            self.draw_toolbar(ui);
            ui.add_space(8.0);
            ui.separator();
            ui.add_space(8.0);

            // 2. Render Document Blocks
            let mut block_to_delete = None;
            let mut block_to_split = None;
            
            let doc_len = self.state.document.len();
            
            egui::ScrollArea::vertical()
                .auto_shrink([false, true])
                .show(ui, |ui| {
                    ui.set_width(ui.available_width());
                    
                    for idx in 0..doc_len {
                        let is_active = self.state.active_block_idx == idx;
                        
                        // Check if any extension overrides rendering for this block (e.g., CodeBlock)
                        let mut rendered_by_extension = false;
                        for ext in &self.extensions {
                            // Check shortcuts
                            let _ = ext.handle_keyboard_shortcut(&mut self.state, ctx);
                            
                            // Render override
                            if !is_active {
                                if let Some(_resp) = ext.render_block_override(ui, &self.state.document[idx]) {
                                    rendered_by_extension = true;
                                    break;
                                }
                            }
                        }

                        if rendered_by_extension {
                            ui.add_space(6.0);
                            continue;
                        }

                        // Normal block editing/rendering
                        if is_active {
                            // Render editable text box for the active block
                            let mut text_content = get_block_plain_text(&self.state.document[idx]);
                            
                            let text_edit = ui.add(
                                egui::TextEdit::multiline(&mut text_content)
                                    .frame(false)
                                    .font(egui::FontId::proportional(get_block_font_size(&self.state.document[idx])))
                                    .text_color(egui::Color32::WHITE)
                                    .hint_text("Yazmaya başlayın...")
                                    .desired_width(ui.available_width())
                            );

                            if text_edit.changed() {
                                self.history.record_state(self.state.document.clone());
                                update_block_text(&mut self.state.document[idx], &text_content);
                            }

                            // Capture Enter and Backspace events inside active block
                            if text_edit.has_focus() {
                                if ui.input(|i| i.key_pressed(egui::Key::Enter) && !i.modifiers.shift) {
                                    // Split block
                                    block_to_split = Some(idx);
                                }
                                if ui.input(|i| i.key_pressed(egui::Key::Backspace)) && text_content.is_empty() {
                                    // Delete / merge block
                                    block_to_delete = Some(idx);
                                }
                                if ui.input(|i| i.key_pressed(egui::Key::ArrowUp)) && idx > 0 {
                                    self.state.active_block_idx = idx - 1;
                                }
                                if ui.input(|i| i.key_pressed(egui::Key::ArrowDown)) && idx + 1 < doc_len {
                                    self.state.active_block_idx = idx + 1;
                                }
                            }
                        } else {
                            // Render formatted preview using LayoutJob
                            let layout_job = compile_layout_job(&self.state.document[idx]);
                            let label = ui.add(egui::Label::new(layout_job).sense(egui::Sense::click()));
                            
                            if label.clicked() {
                                self.state.active_block_idx = idx;
                            }
                        }
                        ui.add_space(6.0);
                    }
                });

            // Perform splits/deletes after loop to avoid borrowing issues
            if let Some(idx) = block_to_split {
                self.state.document.insert(idx + 1, BlockNode::Paragraph(vec![
                    InlineNode::Text { text: String::new(), marks: Vec::new() }
                ]));
                self.state.active_block_idx = idx + 1;
            }

            if let Some(idx) = block_to_delete {
                if doc_len > 1 {
                    self.state.document.remove(idx);
                    self.state.active_block_idx = if idx > 0 { idx - 1 } else { 0 };
                }
            }
        });
    }

    fn draw_toolbar(&mut self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.style_mut().spacing.button_padding = egui::vec2(8.0, 4.0);

            // Bold Toggle
            let btn_bold = ui.button(egui::RichText::new("B").strong());
            if btn_bold.clicked() {
                self.history.record_state(self.state.document.clone());
                self.state.toggle_mark_for_active_block(MarkType::Bold);
            }

            // Italic Toggle
            let btn_italic = ui.button(egui::RichText::new("I").italics());
            if btn_italic.clicked() {
                self.history.record_state(self.state.document.clone());
                self.state.toggle_mark_for_active_block(MarkType::Italic);
            }

            ui.separator();

            // Headings
            if ui.button("H1").clicked() {
                self.history.record_state(self.state.document.clone());
                self.convert_active_block_to_heading(1);
            }
            if ui.button("H2").clicked() {
                self.history.record_state(self.state.document.clone());
                self.convert_active_block_to_heading(2);
            }
            if ui.button("P").clicked() {
                self.history.record_state(self.state.document.clone());
                self.convert_active_block_to_paragraph();
            }

            ui.separator();

            // Undo / Redo buttons
            let btn_undo = ui.button("⮪ Geri");
            if btn_undo.clicked() {
                if let Some(prev) = self.history.undo(self.state.document.clone()) {
                    self.state.document = prev;
                }
            }

            let btn_redo = ui.button("⮫ İleri");
            if btn_redo.clicked() {
                if let Some(next) = self.history.redo(self.state.document.clone()) {
                    self.state.document = next;
                }
            }
        });
    }

    fn convert_active_block_to_heading(&mut self, level: u32) {
        let idx = self.state.active_block_idx;
        if idx >= self.state.document.len() {
            return;
        }

        let content = match &self.state.document[idx] {
            BlockNode::Paragraph(inlines) | BlockNode::Heading { content: inlines, .. } => inlines.clone(),
            BlockNode::BulletList(items) => items.first().cloned().unwrap_or_default(),
            BlockNode::CodeBlock { code, .. } => vec![InlineNode::Text { text: code.clone(), marks: Vec::new() }],
        };

        self.state.document[idx] = BlockNode::Heading { level, content };
    }

    fn convert_active_block_to_paragraph(&mut self) {
        let idx = self.state.active_block_idx;
        if idx >= self.state.document.len() {
            return;
        }

        let content = match &self.state.document[idx] {
            BlockNode::Paragraph(inlines) | BlockNode::Heading { content: inlines, .. } => inlines.clone(),
            BlockNode::BulletList(items) => items.first().cloned().unwrap_or_default(),
            BlockNode::CodeBlock { code, .. } => vec![InlineNode::Text { text: code.clone(), marks: Vec::new() }],
        };

        self.state.document[idx] = BlockNode::Paragraph(content);
    }
}

// Helpers for block attributes
fn get_block_plain_text(block: &BlockNode) -> String {
    match block {
        BlockNode::Paragraph(inlines) | BlockNode::Heading { content: inlines, .. } => {
            inlines.iter().map(|node| match node {
                InlineNode::Text { text, .. } => text.as_str(),
            }).collect::<Vec<&str>>().join("")
        }
        BlockNode::CodeBlock { code, .. } => code.clone(),
        BlockNode::BulletList(items) => {
            items.iter().map(|inlines| {
                inlines.iter().map(|node| match node {
                    InlineNode::Text { text, .. } => text.as_str(),
                }).collect::<Vec<&str>>().join("")
            }).collect::<Vec<String>>().join("\n")
        }
    }
}

fn update_block_text(block: &mut BlockNode, text: &str) {
    match block {
        BlockNode::Paragraph(inlines) | BlockNode::Heading { content: inlines, .. } => {
            // Keep the formatting marks of the first element but replace text content
            if let Some(InlineNode::Text { marks, .. }) = inlines.first().cloned() {
                *inlines = vec![InlineNode::Text { text: text.to_string(), marks }];
            } else {
                *inlines = vec![InlineNode::Text { text: text.to_string(), marks: Vec::new() }];
            }
        }
        BlockNode::CodeBlock { code, .. } => {
            *code = text.to_string();
        }
        BlockNode::BulletList(items) => {
            *items = text.lines().map(|line| {
                vec![InlineNode::Text { text: line.to_string(), marks: Vec::new() }]
            }).collect();
        }
    }
}


fn get_block_font_size(block: &BlockNode) -> f32 {
    match block {
        BlockNode::Heading { level, .. } => {
            match level {
                1 => 22.0,
                2 => 18.0,
                _ => 15.0,
            }
        }
        BlockNode::CodeBlock { .. } => 12.0,
        _ => 14.0,
    }
}

// Map BlockNode AST spans into egui LayoutJob
fn compile_layout_job(block: &BlockNode) -> egui::text::LayoutJob {
    let mut job = egui::text::LayoutJob::default();
    
    match block {
        BlockNode::Paragraph(inlines) => {
            for node in inlines {
                match node {
                    InlineNode::Text { text, marks } => {
                        let mut font_id = egui::FontId::proportional(14.0);
                        let mut color = egui::Color32::from_gray(220);
                        
                        if marks.contains(&MarkType::Bold) {
                            font_id = egui::FontId::new(14.0, egui::FontFamily::Proportional);
                            color = egui::Color32::WHITE;
                        }
                        if marks.contains(&MarkType::Italic) {
                            // Simple mock italic styling using custom tint
                            color = egui::Color32::from_rgb(200, 200, 255);
                        }
                        if marks.contains(&MarkType::Code) {
                            font_id = egui::FontId::monospace(13.0);
                            color = egui::Color32::from_rgb(244, 63, 94); // Light rose code text
                        }
                        
                        job.append(
                            text,
                            0.0,
                            egui::TextFormat {
                                font_id,
                                color,
                                ..Default::default()
                            }
                        );
                    }
                }
            }
        }
        BlockNode::Heading { level, content } => {
            let size = match level {
                1 => 22.0,
                2 => 18.0,
                _ => 15.0,
            };
            for node in content {
                match node {
                    InlineNode::Text { text, .. } => {
                        job.append(
                            text,
                            0.0,
                            egui::TextFormat {
                                font_id: egui::FontId::new(size, egui::FontFamily::Proportional),
                                color: egui::Color32::WHITE,
                                ..Default::default()
                            }
                        );
                    }
                }
            }
        }
        BlockNode::BulletList(items) => {
            for inlines in items {
                job.append(
                    " •  ",
                    0.0,
                    egui::TextFormat {
                        font_id: egui::FontId::proportional(14.0),
                        color: egui::Color32::from_rgb(59, 130, 246), // Blue bullet point
                        ..Default::default()
                    }
                );
                
                for node in inlines {
                    match node {
                        InlineNode::Text { text, marks } => {
                            let font_id = egui::FontId::proportional(14.0);
                            let mut color = egui::Color32::from_gray(220);
                            
                            if marks.contains(&MarkType::Bold) {
                                color = egui::Color32::WHITE;
                            }
                            
                            job.append(
                                text,
                                0.0,
                                egui::TextFormat {
                                    font_id,
                                    color,
                                    ..Default::default()
                                }
                            );
                        }
                    }
                }
                job.append("\n", 0.0, Default::default());
            }
        }
        BlockNode::CodeBlock { .. } => {}
    }
    
    job
}
