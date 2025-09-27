# The frontend of Memos

## Pomodoro Timer Page

A new customizable Pomodoro timer page is available at the route `/pomodoro`.

Features:
- Home mode: shows large digital clock and date.
- Focus mode: Pomodoro timer (25m default) with start/stop/reset.
- Ambient mode: Break timer (5m default) with its own style.
- Customize modal: choose background wallpapers (image/video), filter by tags, choose how the background is applied (Fill/Center/Stretch/Tile), and select a font scoped to this page.

Assets:
- Place images or videos under `web/public/pomodoro/wallpapers/` and update the component's `wallpapers` list in `web/src/pages/Pomodoro/index.tsx` if you add new entries.

Notes:
- Selected fonts are applied only to the Pomodoro page via inline `fontFamily` on the root container.
- Replace the placeholder files under `web/public/pomodoro/wallpapers/` with real media files to avoid 404s.

Running tests:

If the project is set up for testing, run the frontend tests from the `web/` folder. Typical commands:

```
cd web; pnpm install; pnpm test
```
