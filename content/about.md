---
title: About this guide
description: Why this Ninja Speedi guide exists, where its numbers come from, and how to suggest a fix.
params:
  sayhi: true
---
I love my [Ninja Speedi](https://www.ninjakitchen.com/), but the quick start guide lives in a drawer, the recipe builder on Ninja's site moved, and the times I actually cook with were scattered across notes. This site keeps them in one place: the cook charts for every function, the base and liquid amounts for Speedi Meals, and a small [builder](/builder/) that turns *base + protein + veg* into steps.

It's a side project of [danielsada.tech](https://danielsada.tech/), built with Hugo and the same theme, so you can hop between the two.

## Where the numbers come from

The charts and the Speedi Meal tables follow Ninja's quick start guide for the Speedi (SF300 series, 6 qt). The plain-pasta, tomato-sauce and potato bases come from the UK edition, converted to US units, and the done temperatures are the USDA's. Values I couldn't confirm are left out rather than guessed.

{{< sources >}}

Times are guides: thickness, starting temperature and how full the pot is all change them. Check meat and fish with a thermometer. This guide isn't affiliated with or endorsed by SharkNinja; *Ninja*, *Speedi* and *Rapid Cooker* are their trademarks.

## Fixes and additions

The data is one JSON file, [`data/speedi.json`](https://github.com/danielsada/ninja-speedi/blob/main/data/speedi.json). Open an issue or a pull request on [GitHub](https://github.com/danielsada/ninja-speedi) if a time is off or something you cook is missing.