use eframe::egui;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Cad2DTool {
    None,
    Line,
    Circle,
    Rectangle,
}

pub enum Cad2DEntity {
    Line { p1: egui::Pos2, p2: egui::Pos2 },
    Circle { center: egui::Pos2, radius: f32 },
    Rectangle { rect: egui::Rect },
}
