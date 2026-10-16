# tools

- `game-loader.js` — загружает игру из `js/*.js` в Node (DOM заменён заглушкой). Им пользуются `balance-sim.js` и `tests/run.js`.
- `og.html` — исходник картинки для превью ссылки `og.png` (1200×630).
- `icon.html` — исходник иконки `apple-touch-icon.png` (180×180): `icon.html?s=180`.

Как пересобрать картинки (нужен любой статичный сервер в папке `okno7/`, чтобы подтянулись шрифты, и Edge или Chrome):

    python -m http.server 8000
    msedge --headless=new --hide-scrollbars --virtual-time-budget=4000 --screenshot=og.png --window-size=1200,630 http://localhost:8000/tools/og.html
    msedge --headless=new --hide-scrollbars --virtual-time-budget=4000 --screenshot=apple-touch-icon.png --window-size=180,180 "http://localhost:8000/tools/icon.html?s=180"
