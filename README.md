# ninja-airfry-recipes

Cook times, temperatures and recipes for my Ninja air fryers, the **Ninja Speedi** and the **Ninja Double Stack**: https://ninja.danielsada.tech/

The quick start guides live in a drawer and Ninja's Speedi recipe builder is gone, so the numbers I cook with live here.

- **Speedi cook times** (`/speedi/`): every food from the quick start guide's Steam & Crisp, Air Fry, Steam and Dehydrate charts, plus the Steam & Bake recipes. Filter by function or type to search (`/`); the filter is kept in the URL.
- **Speedi Meal builder** (`/speedi/meal-builder/`): a rebuild of Ninja Test Kitchen's retired [Speedi Recipe Builder](https://web.archive.org/web/20250906142114/https://ninjatestkitchen.com/speedi-recipe-builder/). Pick a base, protein, seasoning (up to 2), vegetables (up to 3) and toppings, and it writes the recipe: ingredients, liquid, temperature, time and steps, for 3–4 or 1–2 servings. Recipes have shareable links and can be saved in the browser.
- **Double Stack cook times** (`/double-stack/`): the Double Stack XL (SL400 / SL401) chart with each food's time with one drawer or both drawers cooking, two-layer meals stacked in one drawer (rack on top) and Dehydrate. An explainer at the top (`layouts/_shortcodes/doublestack-modes.html`) separates the two.

## Running the project

Requires **Hugo 0.170.1** (any edition; the theme needs ≥ 0.158). No Node, Tailwind or other build step.

```sh
hugo server        # http://localhost:1313/
hugo               # build into public/
```

## Deploy

The site is deployed by **Cloudflare Pages** from the `main` branch to https://ninja.danielsada.tech, the same way as danielsada.tech:

| Setting | Value |
|---|---|
| Framework preset | Hugo |
| Build command | `hugo --minify --gc` |
| Build output directory | `public` |
| Environment variable (Production and Preview) | `HUGO_VERSION` = `0.170.1` |
| Custom domain | `ninja.danielsada.tech` |

`baseURL` in `hugo.toml` is the custom domain, so canonical links, the sitemap and the social card point there. Keep `HUGO_VERSION` in sync with the version you use locally (minimum 0.158).

`.github/workflows/hugo.yml` checks every push and pull request: the build must have no warnings (`--panicOnWarning`) and every internal link must point at a file that was built.
## Theme

The site uses the same theme and colours as [danielsada.tech](https://danielsada.tech), **Breeze Plasma** ([hugo-breeze-plasma-inspired-theme](https://github.com/danielsada/hugo-breeze-plasma-inspired-theme)), vendored as plain files in `themes/hugo-breeze-plasma-inspired-theme/`, so the two sites look and navigate alike. To update it, replace that folder with a newer copy of the theme repository, without its repo-only folders (`exampleSite/`, `docs/`, `images/`, `scripts/`, `.github/`). Don't edit files in the vendored theme; use these extension points instead:

| What | Where |
|---|---|
| Identity, colours, home widgets | `hugo.toml` (`[params]`) |
| **Places**: kept identical to danielsada.tech (absolute links) | `hugo.toml` (`[[menus.main]]`) |
| One panel section per appliance below Places (Ninja Speedi, Ninja Double Stack) | `hugo.toml` (`[[params.panel.sections]]` + `[[menus.speedi]]`, `[[menus.doublestack]]`, `[[menus.guide]]`), rendered by `layouts/_partials/breeze/panel-projects.html` |
| Cook charts and builder views | `layouts/_partials/views/charts.html`, `views/builder.html` (picked by `params.view` in `content/speedi.md`, `content/double-stack.md`, `content/speedi-meal-builder.md`) |
| SEO: JSON-LD, keywords, robots.txt, social card | `layouts/_partials/hooks/head-end.html`, `layouts/robots.txt`, `assets/images/og.png` |
| Home widgets | `layouts/_partials/home/{modes,builder,mainsite}.html` |
| Chart filter and builder script | `assets/js/speedi.js` (loaded by `layouts/_partials/hooks/body-end.html`) |
| Extra CSS | `assets/css/custom.css` (theme tokens only, so light/dark follow the theme) |
| Extra icons | `assets/breeze/icons/*.svg` |

## Data

The cook charts come from `data/speedi.json` (Ninja Speedi) and `data/doublestack.json` (Ninja Double Stack), both rendered by `views/charts.html` (`params.data` in the page picks the file):

- `sources`: where the numbers come from (listed on the About page).
- `modes`: one entry per function (`id`, `name`, `icon`, `note`, `items`). Each item has `name`, `category`, `amount`, `prep`, `oil`, `liquid`, `accessory`, `temp_f` (or `setting`), `time_min`, `time_max`, `time_unit` (`min` by default, `hr` for Dehydrate), `tips`, `approx` (shows ≈) and `source`. Two-drawer appliances add `dualzone` (the time with both drawers cooking) and name both time columns in `columns`. Leave out what doesn't apply.
`data/builder.json` drives the Speedi Meal builder:

- `steps`: the five pickers (`id`, `key` into this file, `title`, `limit`: 1 = one choice, 0 = any number, `icon` prefix).
- `bases`, `proteins`, `seasonings`, `vegetables`, `toppings`: the original builder's options, in its order. Amounts are structured (`{qty, unit, units, what, detail, prep}`) so they can be halved. Bases list their `liquid` parts and `steam` time; proteins their `temp_f` and USDA `done_f`; vegetables a `place` (`base`, `tray` from the start, or `late`: on the tray for the last 5–7 minutes). Values the guide doesn't give carry an `estimate` explaining where they come from, and the recipe lists them.
- `examples`: presets on the home page and in the builder.

Ingredient icons are SVGs in `assets/speedi/icons/<icon prefix>-<id>.svg`, built into their own sprite that only the builder loads.

The charts follow Ninja's US quick start guide for the Speedi (SF300 series). The plain-pasta, tomato-sauce and potato bases come from the UK guide, converted to US units. Values that couldn't be confirmed are left out rather than guessed.