# UI Foundations Vanilla Starter

Minimal starter with [Vite](https://vitejs.dev/) and `ui-foundations` (CSS-first, without React).

## Requirements

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
npm install ui-foundations
```

## Development

```bash
npm run dev
```

Then open the local URL shown in your terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Using `ui-foundations`

In `src/main.js`:

```js
import "ui-foundations/core.css";
import "ui-foundations/ui.css";
```

Optional token CSS:

```js
import "ui-foundations/tokens/color.css";
import "ui-foundations/tokens/semantic.css";
import "ui-foundations/tokens/components.css";
```

## Project Structure

- `index.html` - entry point
- `src/main.js` - app initialization
- `src/style.css` - project-specific styles

## License

MIT
