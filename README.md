# eoi-direct-form

Front-end assets (JS and CSS) for the **EOI document** and **eRecruit link** direct-publish forms in Squiz Matrix. The source files are authored here and served to Matrix via a **Git File Bridge**, which allows Matrix to reference the raw files directly from this repository without a build step.

---

## Project structure

```
eoi-direct-form/
├── html/
│   ├── eoi-form-doc.html    # EOI document content template
│   ├── eoi-form-link.html   # eRecruit link content template
│   └── dev/                # Development content templates
├── js/
│   ├── eoi-form.js          # Shared form behaviour and variant registration
│   ├── eoi-form-doc.js      # EOI document-upload validation
│   ├── eoi-form-link.js     # eRecruit URL validation and Link name generation
│   ├── eoi-form.test.cjs    # Node regression tests
│   └── eoi-form-doc-and-link.js # Separate combined-tab implementation
├── css/
│   └── eoi-form.css         # Main stylesheet – all form styles go here
├── vite.config.js           # Vite configuration (dev server only)
├── Direct publish an EOI _ NTG Central.html          # Ignored local snapshot
├── Direct publish an eRecruit link _ NTG Central.html # Ignored local snapshot
├── package.json
└── README.md
```

> Reference snapshots matching `Direct publish*`, including their `_files/` folders, are **gitignored** local copies of the live Matrix pages. They are not deployed or included in a fresh clone; obtain them separately for full-page previews.

---

## Form scripts

Each Matrix page must load jQuery, then the shared script, then exactly one
variant script. Use the existing Git File Bridge URL prefix for production:

```html
<script src="/js/eoi-form.js"></script>
<!-- EOI document page only -->
<script src="/js/eoi-form-doc.js"></script>
```

On the eRecruit page, use `js/eoi-form-link.js` instead of `js/eoi-form-doc.js`.
Use ordinary scripts in this order, without `async`, before DOMContentLoaded.
Do not also load the old snapshot copies or the separate combined-tab script
`js/eoi-form-doc-and-link.js` on these pages.

`window.EoiForm.registerVariant({ setup, validate })` connects each variant to
the shared form. `setup(updateSubmitButton)` binds its input events; `validate()`
updates its warnings and returns a boolean. Shared validation calls it both
when updating the submit button and immediately before submitting. Without a
registered variant, submission stays disabled.

The EOI variant requires an attachment in `input[name="word_doc_0"]` and uses
`#documentation-warning`. The link variant requires an absolute HTTP or HTTPS
URL in `#link_0_207` and uses `#link-warning`; it does not require an upload.
It does not restrict the URL hostname or require a particular job-ID format.
The link variant also generates the hidden Matrix Link name field `#link_0_206`
as `RTF {rtfId} {designation} {position title} {agency}`. It reads `rtfId`
from the URL query string, uses selected option values for Designation and
Agency, includes multiple Designations in option order, and updates the name
when any source field changes. Empty values are omitted. The link content
templates use `%details-S_details%` to render Matrix's link details; confirm
that the link schema renders both `#link_0_207` and `#link_0_206` when deploying.
The Link name input is required by Matrix even though it is inside a hidden
container. The link variant script must load and populate it before submission;
otherwise native browser validation blocks Matrix's submit handler because the
invalid required control cannot be focused. The shared `All fields filled`
message does not check this browser-level constraint.

Run the focused validation tests with:

```bash
node --test js/eoi-form.test.cjs
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

---

## Local development

Install dependencies (first time only):

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Vite normally starts at `http://localhost:5173`; use the URL printed in the
terminal if that port is occupied. The Vite configuration opens the eRecruit
snapshot directly. Navigate to a snapshot URL if the browser did not open it:

- EOI: `http://localhost:5173/Direct%20publish%20an%20EOI%20_%20NTG%20Central.html`
- eRecruit: `http://localhost:5173/Direct%20publish%20an%20eRecruit%20link%20_%20NTG%20Central.html`

The `Direct publish*` snapshots and their `_files/` folders are gitignored local
copies, so they are not present in a fresh clone. Obtain the snapshots separately
to preview the full pages; `html/` contains Matrix templates with server-side
placeholders and is not a standalone substitute. If the browser reports a
connection error, first confirm that `npm run dev` is still running and check
the URL Vite printed. A Vite 404 at that URL instead indicates the requested
snapshot file is unavailable. Each snapshot should load `/css/eoi-form.css`,
then `/js/eoi-form.js` followed by its matching variant script after jQuery.
Reload the page after JavaScript edits.

---

## Reference HTML — local dev modifications

The reference HTML files are snapshots of the live Matrix pages. For them to work in the local Vite dev server, use the local source paths below rather than the downloaded script copies. These snapshot changes are **never deployed**.

| What                           | Production (Matrix)                                                                                 | Local dev (reference HTML)                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| FontAwesome                    | Pro CSS loaded via Matrix asset pipeline                                                            | Kit JS: `<script src="https://kit.fontawesome.com/9bf658a5c7.js">`        |
| jQuery                         | Loaded by Matrix from `https://ntgcentral-dev.nt.gov.au/…/jquery-3.4.1.min.js`                      | Loaded from local `_files/jquery-3.4.1.min.js`                            |
| Stylesheet loading            | Git File Bridge URL for `css/eoi-form.css` | `<link rel="stylesheet" href="/css/eoi-form.css">` |
| Script loading                | Git File Bridge URLs for the shared script and one variant | Plain `<script>` tags for `/js/eoi-form.js`, then `/js/eoi-form-doc.js` or `/js/eoi-form-link.js` |
| `JSON.parse` in status toolbar | `JSON.parse('')` throws `SyntaxError: Unexpected end of JSON input` when evaluated in the browser | Use a valid value such as `JSON.parse('{}')` in a local snapshot |

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

| File                 | Purpose                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `html/eoi-form-doc.html` | Matrix content template for the EOI document asset builder page. |
| `html/eoi-form-link.html` | Matrix content template for the eRecruit link asset builder page. |
| `js/eoi-form.js`     | Shared declaration, submission, closing-date, agency, and common validation behaviour. |
| `js/eoi-form-doc.js` | Document-only input listener, required-upload validation, and warning state. |
| `js/eoi-form-link.js` | Link-only input listeners, URL validation, and warning state. |
| `js/eoi-form.test.cjs` | Regression tests for both variants and the noon/weekend closing-date rules. |
| `css/eoi-form.css`   | Styles for the EOI form. Loaded via `<link>` in the local dev reference HTML; loaded via the Git File Bridge in production. |

---

## Matrix page templates

Use `html/eoi-form-doc.html` as the **Content** of the document asset builder page and `html/eoi-form-link.html` for the link page. These define the form body layout and are pasted into (or bridged into) the Matrix CMS content editor. Configure the script tags separately in each page's asset loading.

### Matrix template syntax

| Syntax | Expands to |
|--------|------------|
| `%metadata-F_{ASSET_ID}%` | The rendered form field HTML for that metadata field |
| `%metadata-id_F_{ASSET_ID}%` | The field's HTML `id` attribute value (used in `<label for="">`) |
| `%globals_date_Y%` | Current four-digit year (server-side variable) |
| `%globals_date_y%` | Current two-digit year |
| `%details-S_{SCHEMA_ID}%` | Renders the asset details schema (document upload or link details, depending on the page's asset type) |
| `%commit_button^replace:{OLD_CLASS}:{NEW_CLASS}%` | Renders the Matrix submit button, replacing `{OLD_CLASS}` with `{NEW_CLASS}` on the element |

### Warning elements required in this file

The shared and variant scripts show and hide inline warning `<div>`s by ID. The templates include these elements; retain them when deploying or editing CMS content. Each must be present in the rendered form with `style="display: none;"` initially:

| ID | Place after | Trigger condition |
|----|-------------|-------------------|
| `#designation-warning` | `%metadata-F_445634%` | No designation selected |
| `#location-warning` | `%metadata-F_445518%` | No location selected |
| `#agency-advertise-warning` | `#advertise-selection` | Selected agency has no matching advertise checkbox row (informational — NTG Central fallback still allows submission) |
| `#documentation-warning` | `%details-S_details%` | No file attached |
| `#link-warning` | `%details-S_details%` | URL is empty or is not an absolute HTTP/HTTPS URL (link page only) |

`#documentation-warning` belongs on the document page only. Both templates also include `#date-close-warning` adjacent to the close date field.

---

## Runtime dependencies

### jQuery

jQuery is **not bundled** in this repo. In production, it is loaded by Matrix before the Git File Bridge assets. In local development, it is loaded from the local `_files/` folder in the reference HTML:

```html
<script src="./Direct%20publish%20an%20EOI%20_%20NTG%20Central_files/jquery-3.4.1.min.js"></script>
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
| eRecruit URL                     | `<input text>`           | `link_0_207`                                           |                 |
| eRecruit Link name               | `<input text>` (required, hidden) | `link_0_206`                                     |                 |
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
  - Close date must satisfy the current working-day minimum
  - The registered document or link validator must return `true`
3. **On validation failure**: makes `.ntgc-form-alerts.ntgc-form-alerts--error` visible, injects the error message HTML, and scrolls to it.
4. **On validation pass**: disables the button, displays `"Submitting...please wait"` with a spinner, then calls Matrix's global `submit_form(form, true)` if defined, or falls back to `form.submit()`.

### On `$(document).ready`

#### Close date pre-population

Calculates a default close date and pre-selects the five date/time `<select>` dropdowns (`_d`, `_m`, `_y`, `_h`, `_i`):

- **Offset logic**: uses working days and the current time:
  - Before 12pm → add **2** working days.
  - From 12pm onward → add **3** working days.
- **Time**: always pre-set to 23:45.

The cutoff is exactly **12:00 noon**, using the browser's local time. At and after noon, the default is one additional **working day**, not necessarily one calendar day. Saturdays and Sundays are skipped; public holidays are not accounted for. Both separate forms use this shared calculation, matching the combined-tab script.

For example, opening on Monday before noon defaults to Wednesday; Monday at or after noon defaults to Thursday. Friday before noon defaults to Tuesday; Friday at or after noon defaults to Wednesday. Defaults are set on page load; validation recalculates the minimum using the current time, so a form left open across noon may need its close date advanced before submission.

#### Agency → advertise-site sync

When `#metadata_field_select_445640` (Agency) changes:

1. All non-NTG-Central site rows in `#advertise-selection table tr` are hidden.
2. All agency-specific checkboxes are unchecked.
3. The row matching `#metadata_field_select_446182_{AGENCY_CODE}` is shown and its checkbox pre-checked.
4. If no matching agency row exists, the NTG Central checkbox (`_WoG`) is checked instead, and `#agency-advertise-warning` is shown (informational only — `updateSubmitButton()` gates on whether any checkbox ends up checked, not on the dedicated row existing).

#### Close date warning

`checkCloseDateWarning()` reads the `_d`, `_m`, `_y` selects and computes working days to the selected date. If the selected date is earlier than the current minimum of 2 working days before noon or 3 working days from noon onward, `#date-close-warning` is shown and `.ntgc-date--error` is added to the three date selects. The check runs on every date select change and once on page load (to cover pre-populated dates).

### Helper functions

| Function                       | Scope    | Description                                                                     |
| ------------------------------ | -------- | ------------------------------------------------------------------------------- |
| `addWorkingDays(date, days)`   | Global   | Returns a new `Date` incremented by `days` working days (Mon–Fri).              |
| `getMinimumCloseDateWorkingDays(date)` | Global | Returns 2 before noon and 3 from noon onward. |
| `countWorkingDays(start, end)` | Global | Returns the integer count of working days between two `Date` objects.           |
| `isCloseDateValid(selectedDate, now)` | Global | Enforces the same time-based working-day minimum used by the default date. |
| `checkCloseDateWarning()`      | Closured | Reads the three close date `<select>` elements and updates the warning display using the same time-based working-day rule as the prefill. |
| `updateSubmitButton()`         | Closured | Evaluates all required-field conditions; enables/disables `#sq_commit_button` and toggles all inline warning `<div>`s and error CSS classes. The close date must be present and satisfy the same before-noon/after-noon working-day rule used by the prefill. Gates on Agency by "is a value selected and at least one advertise checkbox checked", not on a dedicated advertise row existing for that agency. Call this after any programmatic field change. |

> `addWorkingDays` is declared at module scope (not inside `$(document).ready`) because it may be called by other scripts on the Matrix page.

---

## CSS summary (`css/eoi-form.css`)

| Rule / selector                                                        | Purpose                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.sq-limbo-section-heading`                                            | Hides the Matrix asset builder section heading                                                                                                                                                                                         |
| `tr[data-attribute-filter*="file-name/title/allowunrestrictedaccess"]` | Hides irrelevant file upload table rows injected by Matrix's asset builder UI                                                                                                                                                          |
| `tr[data-attribute-filter*="file"] > td:nth-of-type(1)`                | Hides the label cell in the file upload row                                                                                                                                                                                            |
| `.sq-form-upload`                                                      | Adds bottom margin to the file upload input                                                                                                                                                                                            |
| `div[data-ref="designation"] select`                                   | Sets minimum height on the multi-select and removes the default dropdown arrow                                                                                                                                                         |
| `.ntgc-table__cell`                                                    | Removes padding and bottom border from table cells                                                                                                                                                                                     |
| `div[data-ref="location/homepage/platforms"] .ntgc-table__wrapper`     | Adds top margin to table wrappers in those sections                                                                                                                                                                                    |
| `.sq-metadata-date-wrapper select.ntgc-select--block`                  | Makes date part selects `inline-block` and fixed-width (`6rem`)                                                                                                                                                                        |
| `.sq-metadata-date-wrapper .sq-inline-fields-wrapper:nth-of-type(2/3)` | Hides the "OR IN duration" and "OR keyword" date rows injected by Matrix                                                                                                                                                               |
| `div[data-ref="file-upload"] .sq-backend-smallprint`                   | Hides the file type/size hint text below the upload field                                                                                                                                                                              |
| `#metadata_field_date_445509_datetimevalue_h/i`                        | Hides hour and minute selects (time is set programmatically to 23:45)                                                                                                                                                                  |
| `div.sq-metadata-date-wrapper`                                         | Sets text colour to white to hide the colon separator between the hidden time selects; nested `& select { margin-bottom: 0 }` removes gap below selects. Uses CSS nesting — requires a browser that supports it (all modern browsers). |
| `#declaration tr` / `#declaration tr:first-child`                      | Collapses the approvals table but keeps the first row (declaration text) visible                                                                                                                                                       |
| `.ntgc-tip`                                                            | Small helper text style (0.75 rem, 10 px bottom margin)                                                                                                                                                                                |
| `#date-close-warning`                                                  | Danger-coloured warning below the close date field                                                                                                                                                                                     |
| `#metadata_field_date_445509_datetimevalue_[d/m/y].ntgc-date--error`   | Red border on date selects when the close-date warning is active                                                                                                                                                                       |

---

## Squiz Matrix integration (Git File Bridge)

The Git File Bridge in Matrix is pointed at this repository. Matrix serves the files directly from the repo at their committed paths — **no build step is required**.

| Asset      | Repository path    |
| ---------- | ------------------ |
| JavaScript | `js/eoi-form.js`   |
| EOI variant | `js/eoi-form-doc.js` |
| eRecruit variant | `js/eoi-form-link.js` |
| Stylesheet | `css/eoi-form.css` |

**To deploy a change:**

1. Edit the appropriate shared or variant script, stylesheet, or content template.
2. Run `node --test js/eoi-form.test.cjs` and check syntax for any modified scripts.
3. Configure each Matrix page to load the shared script followed by its own variant, as shown above. Apply template changes in the corresponding asset builder page.
4. Commit and push to the branch the Git File Bridge is tracking.
5. Matrix will serve the updated files on the next bridge sync (or immediately if configured to pull on demand).

The Node tests cover required uploads, missing upload fields, valid and invalid URLs, variant event bindings, the noon boundary, and weekend rollover. Local browser checks also covered each form's submit gate and click-time variant validation. These checks do not publish a real vacancy or verify the production Matrix configuration.

The production Matrix page loads `eoi-form.js` as a plain `text/javascript` script (not a module). Do not use ES module syntax (`import`/`export`) at the top level of `eoi-form.js`.

---

## Coding agent notes

- **Do not add a build step.** Matrix reads `js/eoi-form.js` and `css/eoi-form.css` directly from the repo. There is no `dist/` folder and no bundler output.
- **Do not import or bundle jQuery.** It is a runtime global provided by Matrix. All `$()` calls rely on this global.
- **`eoi-form.js` runs as a plain script in production** (not a module). Do not use ES module syntax (`import`/`export`) — there is no bundler to process it, and it will throw a `SyntaxError` at runtime.
- **The reference HTML is the source of truth for DOM structure.** Before adding or changing a selector in `js/eoi-form.js` or `css/eoi-form.css`, verify the ID, class, or `data-attribute-filter` value against the reference HTML file.
- **The reference HTML has been modified for local dev** (see the [Local dev modifications](#reference-html--local-dev-modifications) table above). When refreshing the reference HTML from the live site, re-apply those five changes before running `npm run dev`.
- **Do not edit the reference HTML to implement features.** It is a local dev aid only. Shared logic belongs in `js/eoi-form.js`, document-specific behaviour in `js/eoi-form-doc.js`, link-specific behaviour in `js/eoi-form-link.js`, and styles in `css/eoi-form.css`.
- **CORS font errors in dev are expected** and do not indicate a problem with the code.
- **Matrix injects many irrelevant UI rows and labels into the form DOM.** The CSS deliberately hides these with `[data-attribute-filter]` selectors. If a DOM element appears to be missing, check whether it is being hidden by one of these rules before concluding it doesn't exist.
- **`html/eoi-form-doc.html` and `html/eoi-form-link.html` are the Matrix page content templates.** Make layout, label, tip, or warning placement changes in the appropriate template, then apply them in Matrix. Reference snapshots serve a different purpose.
- **Warning `<div>` elements must exist in the Matrix page HTML.** Shared validation updates the common warnings; each variant updates its own warning. If these elements are absent, warnings silently fail to appear. See the [Warning elements](#warning-elements-required-in-this-file) table.
- `vite.config.js` is intentionally minimal (`root: "."`, `server.open`). Do not add a `build` block unless compiled output is explicitly required by a new deployment target.
- Keep common JavaScript in `js/eoi-form.js` and form-specific behaviour in the matching variant. Do not load `js/eoi-form-doc-and-link.js` alongside the separate-form scripts.
