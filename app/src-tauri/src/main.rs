// A release build on Windows must not open a console alongside the window.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    kenya_one_lib::run()
}
