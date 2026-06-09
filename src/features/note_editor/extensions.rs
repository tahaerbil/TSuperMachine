use eframe::egui;
use super::document::{BlockNode, InlineNode, MarkType};

pub struct EditorState {
    pub document: Vec<BlockNode>,
    pub active_block_idx: usize,
    pub cursor_char_idx: usize,
    pub selection_start: Option<(usize, usize)>, // (block, char)
}

impl EditorState {
    pub fn new(document: Vec<BlockNode>) -> Self {
        Self {
            document,
            active_block_idx: 0,
            cursor_char_idx: 0,
            selection_start: None,
        }
    }

    // Toggle formatting mark for the active line/selection
    pub fn toggle_mark_for_active_block(&mut self, mark: MarkType) {
        if self.active_block_idx >= self.document.len() {
            return;
        }

        match &mut self.document[self.active_block_idx] {
            BlockNode::Paragraph(inlines) | BlockNode::Heading { content: inlines, .. } => {
                // For simplicity, toggle the mark on the entire paragraph/line
                // If any span has the mark, remove it. If none have it, add it.
                let has_mark = inlines.iter().any(|node| match node {
                    InlineNode::Text { marks, .. } => marks.contains(&mark),
                });

                for node in inlines.iter_mut() {
                    match node {
                        InlineNode::Text { marks, .. } => {
                            if has_mark {
                                marks.retain(|&m| m != mark);
                            } else {
                                if !marks.contains(&mark) {
                                    marks.push(mark);
                                }
                            }
                        }
                    }
                }
            }
            _ => {}
        }
    }
}

pub trait EditorExtension {
    fn name(&self) -> &'static str;
    
    // Process keyboard shortcut commands (e.g. Ctrl+B, tab, enter)
    // Returns true if event is consumed
    fn handle_keyboard_shortcut(&self, state: &mut EditorState, ctx: &egui::Context) -> bool;

    // Optional custom rendering hook for specialized blocks
    fn render_block_override(&self, ui: &mut egui::Ui, block: &BlockNode) -> Option<egui::Response>;
}

// 1. Bold Formatting Extension (Ctrl+B)
pub struct BoldExtension;
impl EditorExtension for BoldExtension {
    fn name(&self) -> &'static str { "bold" }
    
    fn handle_keyboard_shortcut(&self, state: &mut EditorState, ctx: &egui::Context) -> bool {
        let is_ctrl_b = ctx.input(|i| i.modifiers.command && i.key_pressed(egui::Key::B));
        if is_ctrl_b {
            state.toggle_mark_for_active_block(MarkType::Bold);
            return true;
        }
        false
    }

    fn render_block_override(&self, _ui: &mut egui::Ui, _block: &BlockNode) -> Option<egui::Response> {
        None
    }
}

// 2. Italic Formatting Extension (Ctrl+I)
pub struct ItalicExtension;
impl EditorExtension for ItalicExtension {
    fn name(&self) -> &'static str { "italic" }
    
    fn handle_keyboard_shortcut(&self, state: &mut EditorState, ctx: &egui::Context) -> bool {
        let is_ctrl_i = ctx.input(|i| i.modifiers.command && i.key_pressed(egui::Key::I));
        if is_ctrl_i {
            state.toggle_mark_for_active_block(MarkType::Italic);
            return true;
        }
        false
    }

    fn render_block_override(&self, _ui: &mut egui::Ui, _block: &BlockNode) -> Option<egui::Response> {
        None
    }
}

// 3. Custom Code Block Highlighting Extension
pub struct CodeBlockExtension;
impl EditorExtension for CodeBlockExtension {
    fn name(&self) -> &'static str { "code_block" }
    
    fn handle_keyboard_shortcut(&self, _state: &mut EditorState, _ctx: &egui::Context) -> bool {
        false
    }

    fn render_block_override(&self, ui: &mut egui::Ui, block: &BlockNode) -> Option<egui::Response> {
        if let BlockNode::CodeBlock { language, code } = block {
            // Render styled source code box with a clean dark-grey container
            let response = egui::Frame::none()
                .fill(egui::Color32::from_rgb(30, 30, 35))
                .stroke(egui::Stroke::new(1.0, egui::Color32::from_gray(50)))
                .rounding(6.0)
                .inner_margin(8.0)
                .show(ui, |ui| {
                    ui.set_width(ui.available_width());
                    ui.horizontal(|ui| {
                        ui.label(egui::RichText::new(language).color(egui::Color32::LIGHT_BLUE).size(10.0).strong());
                        ui.add_space(ui.available_width() - 80.0);
                    });
                    ui.add_space(4.0);
                    ui.label(egui::RichText::new(code).monospace().color(egui::Color32::from_rgb(200, 220, 200)).size(11.0));
                }).response;
            Some(response)
        } else {
            None
        }
    }
}
