#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod canvas;
pub mod panels;
pub mod features;
pub mod app;

use eframe::egui;
use app::TSuperMachineApp;

fn main() -> eframe::Result<()> {
    #[cfg(target_os = "linux")]
    unsafe {
        std::env::set_var("WINIT_UNIX_BACKEND", "x11");
        std::env::set_var("GDK_BACKEND", "x11");
    }

    env_logger::init();


    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1280.0, 800.0])
            .with_title("TSuperMachine - High Performance Native Canvas"),
        ..Default::default()
    };

    eframe::run_native(
        "com.tsupermachine.native",
        options,
        Box::new(|cc| {
            Box::new(TSuperMachineApp::new(cc))
        }),
    )
}
