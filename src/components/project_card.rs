use crate::Project;
use leptos::prelude::*;
use stylance::import_crate_style;

import_crate_style!(style, "src/components/project_card.module.css");

#[component]
pub fn ProjectCard(#[prop(into)] project: Project, index: usize) -> impl IntoView {
    let Project {
        title,
        description,
        tags,
        color,
        github_url,
        ..
    } = project;
    let delay = format!("{:.1}s", index as f64 * 0.12);

    view! {
        <article
            class=format!("{} {} js-tilt", style::card, style::revealed)
            style=format!(
                "--project-color: {}; --reveal-delay: {}",
                color,
                delay,
            )
        >
            <div class="shine" />
            <div class=style::top>
                <span class=style::index>{format!("/{:02}", index + 1)}</span>
                <span class=style::dot />
                <span class=style::title>{title}</span>
            </div>
            <p class=style::description>{description}</p>
            <div class=style::techStack>
                {tags.into_iter().map(|tech| {
                    view! {
                        <span class=style::badge>{tech}</span>
                    }
                }).collect::<Vec<_>>()}
            </div>
            <div class=style::links>
                <a
                    class=style::link
                    href={github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    "source →"
                </a>
            </div>
        </article>
    }
}
