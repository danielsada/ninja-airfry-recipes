# ninja-speedi

Cook times, temperatures, liquid amounts and a Speedi Meal builder for the Ninja Speedi Rapid Cooker & Air Fryer: https://danielsada.github.io/ninja-speedi/

I love my Ninja Speedi, but the quick start guide lives in a drawer and the recipe builder on Ninja's site is gone, so the numbers I cook with live here.

- **Cook charts** (`/charts/`): every food from the quick start guide's Steam & Crisp, Air Fry, Steam and Dehydrate charts, plus the Steam & Bake recipes. Filter by function or type to search (`/`); the filter is kept in the URL.
- **Speedi Meal builder** (`/builder/`): pick a base, a protein and vegetables and get the liquid, temperature, time and steps, for 3–4 or 1–2 servings. Every meal has a shareable link.

## Running the project

Requires **Hugo 0.170.1** (any edition; the theme needs ≥ 0.158). No Node, Tailwind or other build step.

```sh
hugo server        # http://localhost:1313/ninja-speedi/
hugo               # build into public/
```

## Deploy

`.github/workflows/hugo.yml` builds and publishes to GitHub Pages on every push to `main`. It uses `--panicOnWarning`, so a build warning fails the deploy, and it checks that every link keeps the `/ninja-speedi/` base path.

## Theme

The site uses the same theme and colours as [danielsada.tech](https://danielsada.tech), **Breeze Plasma** ([hugo-breeze-plasma-inspired-theme](https://github.com/danielsada/hugo-breeze-plasma-inspired-theme)), vendored as plain files in `themes/hugo-breeze-plasma-inspired-theme/`, so the two sites look and navigate alike. To update it, replace that folder with a newer copy of the theme repository, without its repo-only folders (`exampleSite/`, `docs/`, `images/`, `scripts/`, `.github/`). Don't edit files in the vendored theme; use these extension points instead:

| What | Where |
|---|---|
| Identity, colours, home widgets | `hugo.toml` (`[params]`) |
| **Places**: kept identical to danielsada.tech (absolute links) | `hugo.toml` (`[[menus.main]]`) |
| This site's pages, a second panel section below Places | `hugo.toml` (`[[menus.app]]`), rendered by `layouts/_partials/breeze/panel-projects.html` |
| Cook charts and builder views | `layouts/_partials/views/charts.html`, `views/builder.html` (picked by `params.view` in `content/charts.md`, `content/builder.md`) |
| Home widgets | `layouts/_partials/home/{modes,builder,mainsite}.html` |
| Chart filter and builder script | `assets/js/speedi.js` (loaded by `layouts/_partials/hooks/body-end.html`) |
| Extra CSS | `assets/css/custom.css` (theme tokens only, so light/dark follow the theme) |
| Extra icons | `assets/breeze/icons/*.svg` |

## Data

Everything comes from one file, `data/speedi.json`:

- `sources`: where the numbers come from (listed on the About page).
- `modes`: one entry per function (`id`, `name`, `icon`, `note`, `items`). Each item has `name`, `category`, `amount`, `prep`, `oil`, `liquid`, `accessory`, `temp_f` (or `setting`), `time_min`, `time_max`, `time_unit` (`min` by default, `hr` for Dehydrate), `tips` and `source`. Leave out what doesn't apply.
- `meals`: the Speedi Meal builder. `bases`, `proteins` and `vegetables` use structured amounts (`{qty, unit, units, what, detail, prep}`) so the builder can halve them for 1–2 servings. Bases list their `liquid` parts and `steam` time; proteins their `temp_f` and safe internal temperature (`done_f`, USDA); vegetables can be `frozen`, `delicate` (added to the tray for the last 5–7 minutes) or `base_only`. `examples` are presets.

The charts follow Ninja's US quick start guide for the Speedi (SF300 series). The plain-pasta, tomato-sauce and potato bases come from the UK guide, converted to US units. Values that couldn't be confirmed are left out rather than guessed.