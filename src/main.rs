mod components;
mod hooks;

use components::{Hero, ProjectsGrid};
use leptos::prelude::*;
use serde::Deserialize;
use std::sync::LazyLock;

#[derive(Clone, PartialEq, Eq, Deserialize)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub description: String,
    pub tags: Vec<String>,
    pub color: String,
    pub github_url: String,
    #[serde(default)]
    pub play_url: Option<String>,
}

static PROJECTS: LazyLock<Vec<Project>> = LazyLock::new(|| {
    let json = include_str!("./projects.json");
    serde_json::from_str::<Vec<Project>>(json).unwrap_or_default()
});

fn main() {
    console_error_panic_hook::set_once();

    mount_to_body(App)
}

#[component]
fn App() -> impl IntoView {
    view! {
        <Hero />
        <ProjectsGrid projects={PROJECTS.clone()} />
    }
}
