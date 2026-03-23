# eoi-direct-form

Front-end assets (JS and CSS) for the **Expression of Interest Direct Publish** form in Squiz Matrix. The source files are authored here and served to Matrix via a **Git File Bridge**, which allows Matrix to reference the raw files directly from this repository without a build step.

---

## Project structure

```
eoi-direct-form/
├── js/
│   └── eoi-form.js          # Main JavaScript entry point – all form logic goes here
├── css/
│   └── eoi-form.css         # Main stylesheet – all form styles go here
├── index.html               # Dev-only redirect to the reference HTML page
├── vite.config.js           # Vite configuration (dev server only)
├── package.json
└── README.md
```

> The `Directly publish an expression of interest _ NTG Central.html` file and its `_files/` folder are **gitignored** — they are a local reference copy downloaded from the live site and are not deployed.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

---

## Local development

Install dependencies (first time only):

```bash
npm install
```

Start the local dev server with hot module replacement (HMR):

```bash
npm run dev
```

Vite starts at `http://localhost:5173` and opens the reference HTML page automatically. Any changes to `js/eoi-form.js` or `css/eoi-form.css` are reflected in the browser instantly without a page reload.

---

## Editing the source files

| File               | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `js/eoi-form.js`   | JavaScript for the EOI form. Import additional modules here as needed.                                             |
| `css/eoi-form.css` | Styles for the EOI form. The file is imported from within `eoi-form.js` so Vite can process it during development. |

The CSS import at the top of `eoi-form.js` is only needed for the local dev server (Vite handles it). In production, Matrix references `css/eoi-form.css` directly — the import line has no effect in that context.

---

## Squiz Matrix integration (Git File Bridge)

The Git File Bridge in Matrix is pointed at this repository. Matrix serves the files directly from the repo at their committed paths:

| Asset      | Repository path    |
| ---------- | ------------------ |
| JavaScript | `js/eoi-form.js`   |
| Stylesheet | `css/eoi-form.css` |

**To deploy a change:**

1. Edit `js/eoi-form.js` and/or `css/eoi-form.css`.
2. Commit and push to the target branch the Git File Bridge is tracking.
3. Matrix will serve the updated files on the next bridge sync (or immediately if configured to pull on demand).

No build step is required — Matrix reads the source files directly.

---

## Coding agent notes

- Do **not** add a build pipeline or output directory. Matrix references the source files directly; compiled output is not needed.
- Keep all JS in `js/eoi-form.js` and all CSS in `css/eoi-form.css` unless the scope of the form grows significantly enough to justify splitting.
- The `index.html` at the project root is a dev-only redirect and should not contain any form logic.
- The `Directly publish an expression of interest _ NTG Central.html` file is a read-only reference snapshot of the live Matrix page — use it to understand the existing DOM structure when writing JS/CSS selectors.
- `vite.config.js` is configured for the dev server only (`root: "."`, `server.open`). Do not add a `build` block unless a compiled output is explicitly required.
