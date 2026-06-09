use eframe::egui;

pub enum Shape3D {
    Box { w: f32, h: f32, d: f32 },
    Cylinder { radius: f32, height: f32 },
    Sphere { radius: f32 },
}

pub struct ShapeInstance {
    pub name: String,
    pub shape: Shape3D,
    pub color: egui::Color32,
}
