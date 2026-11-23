---
title: About this guide
description: Why this Ninja air fryer guide exists, where its cook times come from, and how to suggest a fix.
params:
  sayhi: true
---
I cook with two Ninja air fryers, a [Ninja Speedi](/speedi/) and a [Ninja Double Stack](/double-stack/). Their quick start guides live in a drawer, Ninja's Speedi recipe builder is gone, and the times I actually cook with were scattered across notes. This site keeps them in one place: every cook time and temperature for both, the base and liquid amounts for Speedi Meals, a [Speedi Meal builder](/speedi/meal-builder/) that rebuilds Ninja's retired recipe builder, and Double Stack times for one drawer, both drawers at once, or two layers stacked in one drawer.

It's a side project of [danielsada.tech](https://danielsada.tech/), built with Hugo and the same theme, so you can hop between the two.

## Where the numbers come from

- **Ninja Speedi:** Ninja's quick start guide for the Speedi (SF300 series, 6 qt). The plain-pasta, tomato-sauce and potato bases come from the UK edition, converted to US units. The builder's ingredient options are the ones from Ninja's archived recipe builder; where the guide has no number for one of them, the recipe says so and explains the estimate.
- **Ninja Double Stack:** Ninja's quick start guide for the Double Stack XL (SL400 / SL401, 10 qt). The guide gives stacked-meal times with both drawers cooking; the one-drawer stacked times apply its "cut the time by 40–50%" rule, so they're marked ≈. The 8-quart Double Stack (SL201) has its own chart, which isn't here yet.
- **Done temperatures:** the USDA's.
- **Metric:** the charts and the builder have a *US / Metric* switch. Ninja's numbers are in US units; metric converts them on the page and rounds the way you'd set or weigh them: oven temperatures to the nearest 5 °C (390 °F → 200 °C), done temperatures to the degree, weights to the nearest 5–50 g, cups to millilitres and inches to millimetres or centimetres. Spoons (tbsp, tsp) stay as they are.

{{< sources >}}

Times are guides: thickness, starting temperature and how full the basket or drawer is all change them. Check meat and fish with a thermometer. This guide isn't affiliated with or endorsed by SharkNinja; *Ninja*, *Speedi*, *DoubleStack* and *Rapid Cooker* are their trademarks.

## Fixes and additions

The data is in [`data/`](https://github.com/danielsada/ninja-airfry-recipes/tree/main/data): `speedi.json`, `builder.json` and `doublestack.json`. Open an issue or a pull request on [GitHub](https://github.com/danielsada/ninja-airfry-recipes) if a time is off or something you cook is missing.