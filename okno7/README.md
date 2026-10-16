# Следующий!

Браузерная игра про окно №7 в МФЦ. Статичная: сборки нет, зависимостей нет.

## Запуск

Открыть `index.html` в браузере или поднять любой статичный сервер в этой папке:

    python -m http.server 8000

Для GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `/ (root)`.

## Структура

- `index.html` — разметка экранов и подключение скриптов
- `css/style.css` — стили, `css/fonts.css` — подключение шрифтов
- `fonts/` — шрифты woff2 (кириллица и латиница), лицензия SIL OFL, источник Google Fonts
- `js/` — игра. Это обычные скрипты, они делят одну глобальную область, **порядок подключения в `index.html` важен**:
  `util` → `sound` → `graphics` → `data-*` (people, rules, days, season) → `state` → `arcs` → `arc-razan` → `visitors` → `docs` → `screens` → `shift` → `inspect` → `lens` → `decision` → `evening` → `endings` → `main`
- `balance-sim.js` — автопрогон кампании разными стратегиями без интерфейса: `node balance-sim.js 200`

Прогресс хранится в `localStorage` под префиксом `okno7.`.
