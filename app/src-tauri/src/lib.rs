//! The Kenya One desktop shell.
//!
//! This crate owns the window and, later, the calculation worker. It holds no
//! engineering maths: those stay in `aircraft_design/` until a measurement says
//! otherwise.

/// Build and run the application.
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to start the Kenya One window");
}
