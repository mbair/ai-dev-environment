# Dashboard and data views

Apply these rules to the affected metrics and interactions, without expanding a focused change into a dashboard redesign. Preserve the project's component library, tokens, locale conventions, and business definitions.

## Decision and attention

Identify the primary question the screen answers, the exceptions that need attention, and the next action. Put the exception beside its underlying data and provide a direct path to investigate or act.

Use emphasis selectively. When low values indicate a problem, make those values conspicuous rather than letting a pale low-end color scale hide them. Preserve stable category colors; add a label, icon, shape, or pattern to communicate status without color alone.

Keep definitions, caveats, and instructions visible when users need them to interpret a number or make a decision. Tooltips can hold exact values and supporting detail, but must also work on keyboard focus and have a usable touch equivalent.

## Metric and comparison contract

For each changed headline metric, establish its unit, included population, aggregation, time window, timezone, and comparison baseline from the real data path. Repeated values must agree when these definitions agree; label intentional differences in scope.

- Compare equal elapsed periods: today's partial result against the same elapsed part of the comparison day, using explicit boundaries and timezone. If comparable data is unavailable, label the full-period baseline and avoid presenting the difference as a performance verdict.
- Compute percentage change only when the baseline supports it. A zero baseline has no ordinary percentage change; show the absolute change or a suitable label. For small counts, prefer an absolute difference and baseline over a dramatic percentage. Choose any small-base threshold for the metric, not as a universal cutoff.
- Distinguish percentage points from percent change: 20% to 25% is +5 percentage points, or +25% relative change.
- Color changes by business meaning. Falling error rates can be favorable; rising volume may be neutral. Direction alone does not establish success or failure.
- Use the same window and aggregation for related sparklines and charts, or visibly label the difference. Mark incomplete buckets and distinguish estimates from observations.

## Data states and financial meaning

| State | Presentation |
| --- | --- |
| Confirmed zero | Format as zero in the correct unit. |
| Missing or unavailable | Show an explicit absence marker or label; do not substitute zero. |
| Loading | Preserve structure with a skeleton or a loading indicator. |
| Refreshing with prior data | Retain prior values with a visible refreshing/stale indication and their original scope and timestamp. Do not relabel old values as the newly requested range. |
| Failed refresh | Explain the failure and recovery; identify retained values as the last successful result. |
| No records | Explain what the empty state means; do not infer that everything is healthy. |
| Sample data | Label it clearly and keep it separate from real totals. |

Cancel or ignore obsolete responses when range or filter requests overlap. Prevent actions that would mistakenly treat stale values as current, while preserving usable navigation and accessible explanations.

For financial metrics, expose currency and the relevant net/gross, tax, fee, and period basis. Preserve legally and operationally distinct categories. Show exact amounts where users reconcile or transact; compact formatting elsewhere must provide access to the exact value. Use established money calculations and rounding rules; formatting must not redefine totals. Label estimated amounts and their basis.

## Choose and scale the chart

| Reader's task | Preferred starting point |
| --- | --- |
| Compare categories | Sorted bars or dots on a common scale. |
| Follow a trend | Line or time-based bars, according to continuity and sampling. |
| Compare actual with a target | Bar with a target marker; add qualitative ranges only when defined. |
| Inspect a measure across two dimensions | Heatmap with a legend, meaningful thresholds, and a distinct missing-data state. |
| Understand shares of a total | Ranked list or segmented bar; use a pie/donut only when coarse part-to-whole reading is sufficient. |

Start quantitative bars at zero. A narrowed line-chart axis must be clearly labeled and must not exaggerate the takeaway. Use readable round ticks and consistent scales where users compare panels. Avoid dual axes unless their relationship is necessary and unmistakable.

Give charts an accessible summary and access to exact values through keyboard interaction or an equivalent table. Do not rely on hover or color alone. Select representations using representative data, including gaps, zeros, outliers, negative values where valid, and long localized labels.

## Verification: numbers before appearance

For changed calculations or cross-view consistency, use a small fixed dataset and derive expected results independently of the production selector/query being checked. Reusing the same faulty calculation in three components proves agreement, not correctness.

Check applicable relationships against those expectations: headline total and delta; chart buckets; table rows and any omitted or "Other" group; shares and tooltips. Reconcile only measures that should mathematically agree: daily distinct counts, averages, and cumulative values cannot generally be summed into a period total. Respect defined rounding tolerances.

Use focused executable checks where calculations or data contracts change. Rendering mocks cannot establish correctness of backend calculations or live persistence; report which layer was verified.

Inspect the rendered surface at relevant phone, desktop, and wide widths. Check the first visual emphasis, exact-value access, long translations, representative data, and applicable loading/missing/stale/error states. Exercise rapid filter changes when requests can overlap. Preserve the general skill's keyboard, zoom, contrast, and responsive checks. In an audit, report observed defects and unknowns without creating records or changing live data.

## Source context

Selected principles synthesized and adapted from [dashboard-design-skill](https://github.com/abdiraimov-otabek/dashboard-design-skill), especially its [component patterns](https://github.com/abdiraimov-otabek/dashboard-design-skill/blob/main/skills/dashboard-design/references/components.md), [perception guidance](https://github.com/abdiraimov-otabek/dashboard-design-skill/blob/main/skills/dashboard-design/references/perception.md), and [numerical QA](https://github.com/abdiraimov-otabek/dashboard-design-skill/blob/main/skills/dashboard-design/references/qa.md). These local rules adapt the concepts to existing products; they do not import the source's house style, promotional sign-off, or blanket ban on explanatory sentences.
