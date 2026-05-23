use crate::Project;
use leptos::prelude::*;
use stylance::import_crate_style;

import_crate_style!(style, "src/components/featured_card.module.css");

#[component]
pub fn FeaturedCard(#[prop(into)] project: Project, index: usize) -> impl IntoView {
    let Project {
        title,
        description,
        tags,
        color,
        github_url,
        play_url,
        ..
    } = project;

    let play_url = play_url.unwrap_or_default();

    view! {
        <article
            class=format!("{} js-tilt", style::featured)
            style=format!("--project-color: {}", color)
        >
            <div class="shine" />
            <div class=style::inner>
                <div class=style::preview_col>
                    <div class=style::preview>
                        <div class=style::preview_tiles>
                            <div class=format!("{} {}", style::tile, style::tile_v2)>{"2"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v4)>{"4"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v8)>{"8"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v16)>{"16"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v32)>{"32"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v64)>{"64"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v128)>{"128"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v256)>{"256"}</div>
                            <div class=format!("{} {}", style::tile, style::tile_v512)>{"512"}</div>
                        </div>
                    </div>
                </div>

                <div class=style::content_col>
                    <div class=style::top>
                        <span class=style::index_label>{format!("/{:02}", index + 1)}</span>
                        <span class=style::dot />
                        <div class=style::tag_row>
                            {tags.into_iter().map(|t| view! {
                                <span class=style::badge>{t}</span>
                            }).collect::<Vec<_>>()}
                        </div>
                    </div>

                    <h2 class=style::title>{title}</h2>
                    <p class=style::description>{description}</p>

                    <div class=style::links>
                        <a
                            class=style::play_btn
                            href={play_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span class=style::play_icon>{"▶"}</span>
                            "PLAY NOW"
                        </a>
                        <a
                            class=style::source_link
                            href={github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            "source →"
                        </a>
                    </div>
                </div>
            </div>
        </article>
    }
}
