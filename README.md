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
├── Directly publish an expression of interest _ NTG Central.html  # Local reference snapshot (not deployed)
├── Directly publish an expression of interest _ NTG Central_files/ # Assets for above (not deployed)
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

### FontAwesome (local dev only)

The reference HTML page loads a FontAwesome kit for icon rendering during local development:

```html
<script src="https://kit.fontawesome.com/9bf658a5c7.js" crossorigin="anonymous"></script>
```

This is already present in the reference HTML file. In production, Matrix loads FontAwesome via its own asset pipeline — do not add the kit script to the source JS or CSS files.

---

## Editing the source files

| File               | Purpose                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `js/eoi-form.js`   | JavaScript for the EOI form. Import additional modules here as needed.                                             |
| `css/eoi-form.css` | Styles for the EOI form. The file is imported from within `eoi-form.js` so Vite can process it during development. |

The CSS import at the top of `eoi-form.js` (`import "../css/eoi-form.css"`) is only needed for the local dev server (Vite handles it). In production, Matrix references `css/eoi-form.css` directly — the import line has no effect in that context.

---

## Runtime dependencies

### jQuery

jQuery is **not bundled** in this repo. In production, it is loaded by Matrix before the Git File Bridge assets. In local development, it is present in the reference HTML file via:

```html
<script src="./..._files/jquery.js"></script>
```

All `$()` calls in `eoi-form.js` depend on jQuery being available globally. Do not import jQuery into the module.

---

## Form field reference

These are the Matrix-generated field IDs targeted by `eoi-form.js` and `eoi-form.css`. When adding new selectors, verify the IDs against the reference HTML.

| Field                       | Element type     | ID / selector                                     | Matrix asset ID |
| --------------------------- | ---------------- | ------------------------------------------------- | --------------- |
| Position title              | `<input text>`   | `metadata_field_text_445504_value`                | 445504          |
| Designation(s)              | `<select multi>` | `metadata_field_select_445634`                    | 445634          |
| Preferred advertising close date | `<select>` set | `metadata_field_date_445509_datetimevalue_[d/m/y/h/i]` | 445509     |
| Vacancy duration            | `<input text>`   | `metadata_field_text_445506_value`                | 445506          |
| Agency                      | `<select>`       | `metadata_field_select_445640`                    | 445640          |
| Location(s)                 | `<select multi>` | `metadata_field_select_445518`                    | 445518          |
| Advertise on (checkboxes)   | `<input checkbox>` group | `metadata_field_select_446182[n]`       | 446182          |
| — NTG Central checkbox      | `<input checkbox>` | `metadata_field_select_446182_WoG`              |                 |
| — Agency-specific checkbox  | `<input checkbox>` | `metadata_field_select_446182_{AGENCY_CODE}`    |                 |
| File upload                 | `<input file>`   | inside `div[data-ref="file-upload"]`              |                 |
| Submit button               | `<input button>` | `sq_commit_button`                                |                 |
| Close date warning          | `<div>`          | `date-close-warning`                              |                 |
| Error alert banner          | `<div>`          | `.ntgc-form-alerts.ntgc-form-alerts--error`       |                 |

### Agency codes

Agency checkbox IDs follow the pattern `metadata_field_select_446182_{CODE}` where `{CODE}` matches the value of the `<select id="metadata_field_select_445640">` option. Examples: `AGD`, `DAF`, `CMC`, `DOH`, `NTPF`.

---

## JavaScript behaviour summary (`js/eoi-form.js`)

### On `DOMContentLoaded`
- Finds `#sq_commit_button`, removes its inline `onclick` attribute, and attaches a custom click handler.
- **Validation** checks that Designation, Duration, Agency, and at least one Advertise checkbox are filled before allowing submission.
- On failure: shows `.ntgc-form-alerts--error`, scrolls to it.
- On success: sets button value to `"Saving..."`, calls Matrix's `submit_form()` if available, or falls back to `form.submit()`.

### On `$(document).ready`
- **Close date pre-population**: calculates a default close date 3 working days from today (5 days if the current day is Thursday or Friday to skip the weekend) and pre-selects the day/month/year dropdowns. Time is set to 23:45.
- **Agency → advertise sync**: when the Agency `<select>` changes, hides all agency-specific advertise rows and shows only the matching agency row. The NTG Central checkbox is always visible.
- **Close date warning**: `checkCloseDateWarning()` computes working days between today and the selected close date; shows `#date-close-warning` and applies `.ntgc-date--error` border if fewer than 3 working days remain.

### Helper functions
| Function | Description |
| --- | --- |
| `addWorkingDays(date, days)` | Returns a `Date` incremented by `days` working days. Defined globally (used elsewhere in the Matrix page). |
| `countWorkingDays(start, end)` | Returns the number of working days between two `Date` objects. |
| `checkCloseDateWarning()` | Reads the close date dropdowns and shows/hides the warning div. |

---

## CSS summary (`css/eoi-form.css`)

| Rule / selector | Purpose |
| --- | --- |
| `.sq-limbo-section-heading` | Hides the Matrix asset builder section heading |
| `tr[data-attribute-filter*="file-name/title/allowunrestrictedaccess"]` | Hides irrelevant file upload table rows from Matrix's asset builder UI |
| `tr[data-attribute-filter*="file"] > td:nth-of-type(1)` | Hides the label cell in the file upload row |
| `.sq-form-upload` | Adds bottom margin to the file upload input |
| `div[data-ref="designation"] select` | Sets a minimum height on the multi-select and removes the default arrow |
| `.ntgc-table__cell` | Removes padding and bottom border from table cells in NTGC tables |
| `div[data-ref="location/homepage/platforms"] .ntgc-table__wrapper` | Adds top margin to table wrappers in those sections |
| `.sq-metadata-date-wrapper select.ntgc-select--block` | Makes date part selects inline and fixed-width |
| `.sq-metadata-date-wrapper .sq-inline-fields-wrapper:nth-of-type(2/3)` | Hides the "OR IN duration" and "OR keyword" date rows |
| `div[data-ref="file-upload"] .sq-backend-smallprint` | Hides the file type/size hint text below the upload field |
| `#metadata_field_date_445509_datetimevalue_h/i` | Hides hour and minute selects (time is set programmatically) |
| `div.sq-metadata-date-wrapper` | Sets text colour to white to hide the colon between hidden time selects |
| `#declaration tr` / `#declaration tr:first-child` | Collapses the approvals section but keeps the first row (the declaration text) visible |
| `.ntgc-tip` | Small helper text style (0.75rem, 10px bottom margin) |
| `#date-close-warning` | Danger-coloured warning message below the close date field |
| `#metadata_field_date_445509_datetimevalue_[d/m/y].ntgc-date--error` | Red border on date selects when the warning is active |

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
- Keep all JS in `js/eoi-form.js` and all CSS in `css/eoi-form.css` unless the scope significantly grows.
- The `index.html` at the project root is a dev-only redirect and should not contain any form logic.
- The `Directly publish an expression of interest _ NTG Central.html` file is a **read-only** reference snapshot of the live Matrix page. Use it to understand the existing DOM structure (IDs, class names, nesting) when writing JS/CSS selectors. Do not edit it to implement features.
- Any `<style>` or `<script>` blocks found inside the reference HTML that duplicate logic already in `eoi-form.js` or `eoi-form.css` should be removed from the HTML and confirmed to exist in the source files before removal.
- `vite.config.js` is configured for the dev server only (`root: "."`, `server.open`). Do not add a `build` block unless compiled output is explicitly required.
- jQuery (`$`) is a global provided by Matrix at runtime. Never import or bundle it.
- The Matrix asset builder injects many irrelevant UI rows and labels into the DOM. The CSS deliberately hides these — check that selector before concluding a DOM element is missing.
