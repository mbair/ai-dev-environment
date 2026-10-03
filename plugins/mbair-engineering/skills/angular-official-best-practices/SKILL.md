---
name: angular-official-best-practices
description: Apply the current official Angular coding, architecture, accessibility, performance, and testing guidance when developing or reviewing Angular applications, with explicit adaptation for Angular 21 projects.
metadata:
  author: OpenAI
  version: '1.0'
---

# Angular official best practices

Use the official Angular guidance as the primary reference for Angular code and architecture:

- [Angular best practices](https://angular.dev/assets/context/best-practices.md)
- [Angular full context](https://angular.dev/assets/context/llms-full.txt)
- [Angular style guide](https://angular.dev/style-guide)
- [Angular performance best practices](https://next.angular.dev/best-practices/performance)

## Version-aware application

1. Inspect the repository's actual Angular version before choosing an API.
2. This workspace is Angular 21. Use APIs that are stable and supported by Angular 21 and its installed TypeScript version.
3. Do not apply guidance that is explicitly Angular 22+ only. In particular, do not introduce Signal Forms or a hypothetical newer service decorator into this Angular 21 application; use typed Reactive Forms and `@Injectable` where they match the existing code.
4. Standalone components, native control flow (`@if`, `@for`, `@switch`), signals, lazy routes, and `inject()` are preferred for new or deliberately modernized code. Preserve a working NgModule boundary when a low-risk incremental refactor is more appropriate.

## Implementation rules

- Prefer strict typing and `unknown` over `any`.
- Keep components focused on presentation; move reusable business logic and transformations into services or pure functions.
- Use `inject()` for new dependencies when it improves clarity, but do not churn stable constructor injection solely for style.
- Prefer signals and `computed()` for local synchronous state; keep observable APIs where existing services and async workflows already depend on them.
- Prefer native `class` and `style` bindings over `ngClass` and `ngStyle`.
- Use Angular's native control flow and keep template expressions simple.
- Keep related component TypeScript, template, styles, and tests together with matching names and relative `templateUrl`/`styleUrls` paths.
- Prefer feature-oriented organization and lazy loading for feature routes.
- Use lifecycle interfaces when implementing lifecycle hooks, and keep lifecycle methods small by delegating named work to methods.
- Use `NgOptimizedImage` for static images where its constraints fit the asset; preserve inline SVG and branding assets when optimization would alter their behavior or output.
- Preserve existing application conventions when a mechanical migration would increase risk.

## Performance workflow

- Measure first with Chrome DevTools and Angular DevTools; do not apply performance changes solely from intuition.
- For loading performance, preserve lazy-loaded routes and consider `@defer` for heavy, below-the-fold, or non-initial features after checking their loading and error states.
- Use responsive image loading and `NgOptimizedImage` for static image assets when it fits the asset pipeline; do not rewrite inline SVG or tenant branding blindly.
- Keep expensive filtering, sorting, mapping, and date/formatting work out of template expressions. Prefer precomputed state, signals, pure functions, or services and verify that repeated change-detection work is reduced.
- Use stable identities with `track` in `@for` loops and avoid recreating arrays or objects on every change-detection pass.
- Treat zoneless change detection as a measured migration. Angular's current guidance targets newer Angular defaults, but this Angular 21 application must first be checked for zone-dependent behavior, third-party components, tests, and global providers before changing it.
- Consider `OnPush` or equivalent subtree-skipping only where profiling shows a benefit and the component's input/observable/event contract is understood. Do not perform a broad change-detection rewrite without regression coverage.
- Do not introduce newer or unavailable APIs such as `injectAsync` merely because they appear in the current `next.angular.dev` documentation; verify Angular 21 support first.
- Report bundle-size warnings, runtime measurements, and functional regressions separately.

## Accessibility and verification

- Treat WCAG AA, keyboard operation, visible focus, semantic HTML, labels, error association, and correct ARIA placement as acceptance criteria.
- Verify the rendered DOM for third-party components; an ARIA attribute on an Angular/PrimeNG host is not sufficient if the native control does not receive it.
- Run focused unit tests, the project's build check, and relevant accessibility/browser checks after UI changes. Report warnings separately from failures.
- For this repository, keep Angular 21 and PrimeNG 21 dependencies unchanged unless the user explicitly requests an upgrade.

## Project-specific validation

For `/home/mbair/GIT/NFCreserve/frontend/Zichy2`, normally run:

```bash
npm run validate:i18n
npm test -- --include='src/app/demo/components/<feature>/<feature>.component.spec.ts' --watch=false --progress=false
npm run build:check
git diff --check
```

Use the repository's Node 24 path and Playwright Chrome path when the WSL defaults do not resolve them. For visual changes, inspect the actual localhost render and browser console as well.
