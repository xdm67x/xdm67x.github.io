use crate::hooks::use_scroll_progress;
use leptos::prelude::*;
use stylance::{classes, import_crate_style};

import_crate_style!(style, "src/components/hero.module.css");

const HERO_NAME: &str = "MEHMET OZKAN";
const HERO_BIO: &str =
    "AI enthusiast, video game aficionado, crafting web experiences. Ready to join your squad.";
const HERO_LABEL: &str = "<PLAYER 1 READY>";

#[component]
pub fn Hero() -> impl IntoView {
    let progress = use_scroll_progress(0.0);

    let opacity = move || (1.0 - progress.get() * 1.8).max(0.0);
    let scale = move || 1.0 - progress.get() * 0.15;
    let translate_y = move || -progress.get() * 60.0;
    let decor_opacity = move || (1.0 - progress.get() * 2.5).max(0.0);

    view! {
        <section class=style::hero>
            <div
                class=style::hero_grid
                style=move || format!("opacity: {:.3}", decor_opacity() * 0.5)
            />

            <div
                class=style::hero_shapes
                style=move || format!("opacity: {:.3}", decor_opacity() * 0.15)
            >
                <div class=classes!(style::hero_shape, style::hero_rect) />
                <div class=classes!(style::hero_shape, style::hero_circle) />
                <div class=classes!(style::hero_shape, style::hero_diamond) />
            </div>

            <div
                class=style::hero_content
                style=move || format!(
                    "opacity: {:.3}; transform: scale({:.4}) translateY({:.1}px)",
                    opacity(),
                    scale(),
                    translate_y()
                )
            >
                <span class=style::hero_label>{HERO_LABEL}</span>

                <h1 class=style::hero_name attr:data-text=HERO_NAME>
                    {HERO_NAME}
                </h1>

                <p class=style::hero_subtitle>
                    <span class=style::hero_subtitle_accent>"PIXEL ARCHITECT"</span>
                    <span class=style::hero_subtitle_dot>" • "</span>
                    <span>"LVL 99 WIZARD"</span>
                </p>

                <p class=style::hero_bio>{HERO_BIO}</p>

                <a class=style::hero_next href="#projects">
                    <span class=style::hero_next_ok>"✓ PORTFOLIO LOADED"</span>
                    <span class=style::hero_next_hint>"SCROLL FOR QUESTS"</span>
                    <span class=style::hero_next_arrow>"▼"</span>
                </a>
            </div>
        </section>
    }
}
