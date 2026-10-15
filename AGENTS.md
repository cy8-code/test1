# Project Guidelines

## Architecture
- Keep this project frontend-only: use vanilla HTML, CSS, and JavaScript; do not add a framework, server, or API without an explicit request.
- Keep roulette behavior in `app.js`, page structure in `index.html`, and presentation in `styles.css`.
- Use Canvas 2D for the wheel and `localStorage` for browser-local presets and menu state.

## UI and Accessibility
- Preserve the mobile-first responsive layout and the existing visual style.
- Keep wheel labels readable, respect `prefers-reduced-motion`, and provide accessible labels for interactive controls.
- Validate menu input and keep wheel entries between 2 and 20.

## Build and Test
- This is a static site; open `index.html` directly in a browser.
- Check JavaScript syntax with `node --check app.js` and verify interactive changes in the browser.
