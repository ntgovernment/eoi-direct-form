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
├── Directly publish an expression of interest _ NTG Central_files/ # Static assets for above (not deployed)
├── package.json
└── README.md
```

> The `Directly publish an expression of interest _ NTG Central.html` file and its `_files/` folder are **gitignored** — they are a local reference copy of the live Matrix page. They are never deployed.

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

Vite starts at `http://localhost:5173` and opens the reference HTML page automatically via the `index.html` redirect. Any changes to `js/eoi-form.js` or `css/eoi-form.css` are reflected in the browser instantly without a page reload.

---

## Reference HTML — local dev modifications

The reference HTML (`Directly publish an expression of interest _ NTG Central.html`) is a snapshot of the live Matrix page. For it to work correctly in the local Vite dev server, several modifications are made to the file that differ from the production version. These changes are **never deployed** — they exist only to support local development.

| What                           | Production (Matrix)                                                                                 | Local dev (reference HTML)                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| FontAwesome                    | Pro CSS loaded via Matrix asset pipeline                                                            | Kit JS: `<script src="https://kit.fontawesome.com/9bf658a5c7.js">`        |
| jQuery                         | Loaded by Matrix from `https://ntgcentral-dev.nt.gov.au/…/jquery-3.4.1.min.js`                      | Loaded from local `_files/jquery-3.4.1.min.js`                            |
| `eoi-form.css` loading         | `<style href="https://ntgcentral-dev.nt.gov.au/…/git_bridge/…/eoi-form.css">` (Matrix bridge)       | `<link rel="stylesheet" href="/css/eoi-form.css">` (Vite serves it)       |
| `eoi-form.js` loading          | `<script type="text/javascript" src="https://ntgcentral-dev.nt.gov.au/…/git_bridge/…/eoi-form.js">` | `<script type="module" src="/js/eoi-form.js">` (Vite processes it)        |
| `JSON.parse` in status toolbar | `JSON.parse('')` (Matrix renders an empty string — valid in its server context)                     | `JSON.parse('{}')` (prevents `SyntaxError: Unexpected end of JSON input`) |

### FontAwesome dev kit

The kit URL (`9bf658a5c7`) is a FontAwesome Pro dev kit. It is already applied to the reference HTML — do not add it to `eoi-form.js` or `eoi-form.css`.

In production, Matrix loads FontAwesome via its own asset pipeline. Icon classes (e.g. `fal fa-cog`) will render correctly in both environments.

### CORS font warnings (expected in dev)

When running locally, the browser will log CORS errors for web fonts hosted on `ntgcentral-dev.nt.gov.au`:

```
Access to font at 'https://ntgcentral-dev.nt.gov.au/…/latin.woff2' has been blocked by CORS policy
```

These are **expected and harmless** in the local dev environment. The remote server does not send `Access-Control-Allow-Origin` headers, and these fonts cannot be proxied easily. Icons and layout will still function; only font rendering may differ slightly from production.

---

## Editing the source files

| File               | Purpose                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `js/eoi-form.js`   | JavaScript for the EOI form.                                                                                                |
| `css/eoi-form.css` | Styles for the EOI form. Loaded via `<link>` in the local dev reference HTML; loaded via the Git File Bridge in production. |

---

## Runtime dependencies

### jQuery

jQuery is **not bundled** in this repo. In production, it is loaded by Matrix before the Git File Bridge assets. In local development, it is loaded from the local `_files/` folder in the reference HTML:

```html
<script src="./Directly%20publish%20an%20expression%20of%20interest%20_%20NTG%20Central_files/jquery-3.4.1.min.js"></script>
```

All `$()` calls in `eoi-form.js` depend on jQuery being available as a global. Do **not** import or bundle jQuery.

---

## Form field reference

These are the Matrix-generated field IDs targeted by `eoi-form.js` and `eoi-form.css`. When adding new selectors, verify the IDs against the reference HTML.

| Field                            | Element type             | ID / selector                                          | Matrix asset ID |
| -------------------------------- | ------------------------ | ------------------------------------------------------ | --------------- |
| Position title                   | `<input text>`           | `metadata_field_text_445504_value`                     | 445504          |
| Designation(s)                   | `<select multi>`         | `metadata_field_select_445634`                         | 445634          |
| Preferred advertising close date | `<select>` set           | `metadata_field_date_445509_datetimevalue_[d/m/y/h/i]` | 445509          |
| Vacancy duration                 | `<input text>`           | `metadata_field_text_445506_value`                     | 445506          |
| Agency                           | `<select>`               | `metadata_field_select_445640`                         | 445640          |
| Location(s)                      | `<select multi>`         | `metadata_field_select_445518`                         | 445518          |
| Advertise on (checkboxes)        | `<input checkbox>` group | `metadata_field_select_446182[n]`                      | 446182          |
| — NTG Central checkbox           | `<input checkbox>`       | `metadata_field_select_446182_WoG`                     |                 |
| — Agency-specific checkbox       | `<input checkbox>`       | `metadata_field_select_446182_{AGENCY_CODE}`           |                 |
| File upload                      | `<input file>`           | inside `div[data-ref="file-upload"]`                   |                 |
| Submit button                    | `<input button>`         | `sq_commit_button`                                     |                 |
| Close date warning               | `<div>`                  | `#date-close-warning`                                  |                 |
| Error alert banner               | `<div>`                  | `.ntgc-form-alerts.ntgc-form-alerts--error`            |                 |

### Agency codes

Agency checkbox IDs follow the pattern `metadata_field_select_446182_{CODE}` where `{CODE}` matches the value of the selected `<option>` in `#metadata_field_select_445640`. Codes must not contain spaces (the JS calls `.replaceAll(" ", "")`). Examples: `AGD`, `DAF`, `CMC`, `DOH`, `NTPF`.

---

## JavaScript behaviour summary (`js/eoi-form.js`)

### On `DOMContentLoaded`

1. Finds `#sq_commit_button`, sets its label to `"Submit"`, and replaces the Matrix-injected inline `onclick` attribute with a custom click handler.
2. **Validation** — the click handler checks all of the following before allowing submission:
   - `#metadata_field_select_445634` (Designation) — `<select>` must have a value
   - `#metadata_field_text_445506_value` (Duration) — `<input text>` must not be blank
   - `#metadata_field_select_445640` (Agency) — `<select>` must have a value
   - At least one `input[name^="metadata_field_select_446182"]` checkbox must be checked
3. **On validation failure**: makes `.ntgc-form-alerts.ntgc-form-alerts--error` visible, injects the error message HTML, and scrolls to it.
4. **On validation pass**: sets the button label to `"Saving..."`, then calls Matrix's global `submit_form(form, true)` if defined, or falls back to `form.submit()`.

### On `$(document).ready`

#### Close date pre-population

Calculates a default close date and pre-selects the five date/time `<select>` dropdowns (`_d`, `_m`, `_y`, `_h`, `_i`):

- **Default offset**: 3 working days from today.
- **Thursday/Friday adjustment**: if today is Thu (day 4) or Fri (day 5), adds 5 calendar days instead of 3, ensuring the result clears the coming weekend.
- **Time**: always pre-set to 23:45 (`_h` index 23, `_i` index 45).

#### Agency → advertise-site sync

When `#metadata_field_select_445640` (Agency) changes:

1. All non-NTG-Central site rows in `#advertise-selection table tr` are hidden.
2. All agency-specific checkboxes are unchecked.
3. The row matching `#metadata_field_select_446182_{AGENCY_CODE}` is shown and its checkbox pre-checked.
4. If no matching agency row exists, the NTG Central checkbox (`_WoG`) is checked instead.

#### Close date warning

`checkCloseDateWarning()` reads the `_d`, `_m`, `_y` selects and computes working days to the selected date. If fewer than 3 working days remain, `#date-close-warning` is shown and `.ntgc-date--error` is added to the three date selects. The check runs on every date select change and once on page load (to cover pre-populated dates).

### Helper functions

| Function                       | Scope    | Description                                                                     |
| ------------------------------ | -------- | ------------------------------------------------------------------------------- |
| `addWorkingDays(date, days)`   | Global   | Returns a new `Date` incremented by `days` working days (Mon–Fri).              |
| `countWorkingDays(start, end)` | Closured | Returns the integer count of working days between two `Date` objects.           |
| `checkCloseDateWarning()`      | Closured | Reads the three close date `<select>` elements and updates the warning display. |

> `addWorkingDays` is declared at module scope (not inside `$(document).ready`) because it may be called by other scripts on the Matrix page.

---

## CSS summary (`css/eoi-form.css`)

| Rule / selector                                                        | Purpose                                                                               |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `.sq-limbo-section-heading`                                            | Hides the Matrix asset builder section heading                                        |
| `tr[data-attribute-filter*="file-name/title/allowunrestrictedaccess"]` | Hides irrelevant file upload table rows injected by Matrix's asset builder UI         |
| `tr[data-attribute-filter*="file"] > td:nth-of-type(1)`                | Hides the label cell in the file upload row                                           |
| `.sq-form-upload`                                                      | Adds bottom margin to the file upload input                                           |
| `div[data-ref="designation"] select`                                   | Sets minimum height on the multi-select and removes the default dropdown arrow        |
| `.ntgc-table__cell`                                                    | Removes padding and bottom border from table cells                                    |
| `div[data-ref="location/homepage/platforms"] .ntgc-table__wrapper`     | Adds top margin to table wrappers in those sections                                   |
| `.sq-metadata-date-wrapper select.ntgc-select--block`                  | Makes date part selects `inline-block` and fixed-width (`6rem`)                       |
| `.sq-metadata-date-wrapper .sq-inline-fields-wrapper:nth-of-type(2/3)` | Hides the "OR IN duration" and "OR keyword" date rows injected by Matrix              |
| `div[data-ref="file-upload"] .sq-backend-smallprint`                   | Hides the file type/size hint text below the upload field                             |
| `#metadata_field_date_445509_datetimevalue_h/i`                        | Hides hour and minute selects (time is set programmatically to 23:45)                 |
| `div.sq-metadata-date-wrapper`                                         | Sets text colour to white to hide the colon separator between the hidden time selects; nested `& select { margin-bottom: 0 }` removes gap below selects. Uses CSS nesting — requires a browser that supports it (all modern browsers). |
| `#declaration tr` / `#declaration tr:first-child`                      | Collapses the approvals table but keeps the first row (declaration text) visible      |
| `.ntgc-tip`                                                            | Small helper text style (0.75 rem, 10 px bottom margin)                               |
| `#date-close-warning`                                                  | Danger-coloured warning below the close date field                                    |
| `#metadata_field_date_445509_datetimevalue_[d/m/y].ntgc-date--error`   | Red border on date selects when the close-date warning is active                      |

---

## Squiz Matrix integration (Git File Bridge)

The Git File Bridge in Matrix is pointed at this repository. Matrix serves the files directly from the repo at their committed paths — **no build step is required**.

| Asset      | Repository path    |
| ---------- | ------------------ |
| JavaScript | `js/eoi-form.js`   |
| Stylesheet | `css/eoi-form.css` |

**To deploy a change:**

1. Edit `js/eoi-form.js` and/or `css/eoi-form.css`.
2. Commit and push to the branch the Git File Bridge is tracking.
3. Matrix will serve the updated files on the next bridge sync (or immediately if configured to pull on demand).

The production Matrix page loads `eoi-form.js` as a plain `text/javascript` script (not a module). Do not use ES module syntax (`import`/`export`) at the top level of `eoi-form.js`.

---

## Coding agent notes

- **Do not add a build step.** Matrix reads `js/eoi-form.js` and `css/eoi-form.css` directly from the repo. There is no `dist/` folder and no bundler output.
- **Do not import or bundle jQuery.** It is a runtime global provided by Matrix. All `$()` calls rely on this global.
- **`eoi-form.js` runs as a plain script in production** (not a module). Do not use ES module syntax (`import`/`export`) — there is no bundler to process it, and it will throw a `SyntaxError` at runtime.
- **The reference HTML is the source of truth for DOM structure.** Before adding or changing a selector in `js/eoi-form.js` or `css/eoi-form.css`, verify the ID, class, or `data-attribute-filter` value against the reference HTML file.
- **The reference HTML has been modified for local dev** (see the [Local dev modifications](#reference-html--local-dev-modifications) table above). When refreshing the reference HTML from the live site, re-apply those five changes before running `npm run dev`.
- **Do not edit the reference HTML to implement features.** It is a local dev aid only. All logic belongs in `js/eoi-form.js` and `css/eoi-form.css`.
- **CORS font errors in dev are expected** and do not indicate a problem with the code.
- **Matrix injects many irrelevant UI rows and labels into the form DOM.** The CSS deliberately hides these with `[data-attribute-filter]` selectors. If a DOM element appears to be missing, check whether it is being hidden by one of these rules before concluding it doesn't exist.
- `vite.config.js` is intentionally minimal (`root: "."`, `server.open`). Do not add a `build` block unless compiled output is explicitly required by a new deployment target.
- Keep all JS in `js/eoi-form.js` and all CSS in `css/eoi-form.css` unless scope grows significantly and splitting is discussed with the team.
