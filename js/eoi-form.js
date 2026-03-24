/**
 * eoi-form.js
 * -----------
 * Client-side behaviour for the "Directly publish an expression of interest"
 * form on NTG Central (Squiz Matrix CMS).
 *
 * ## Overview
 * The form is a Squiz Matrix asset-builder page. On DOMContentLoaded this
 * script runs the following setup steps, then jQuery ready handles ongoing
 * event-driven behaviour:
 *
 *   1. Declaration section — auto-checks the hidden declaration checkbox
 *      (#metadata_field_select_691088_declare) and hides both the #declaration
 *      div and its preceding <label>. This bypasses the approval step that is
 *      not required for the direct-publish workflow.
 *
 *   2. Submit button — the CMS renders an <input type="submit"> which cannot
 *      contain child elements. The script replaces it at runtime with a
 *      <button type="submit"> (same id and classes, minus ntgc-file-upload)
 *      labelled "Submit", starts disabled, and has its CMS inline onclick
 *      removed so all submission logic is fully controlled here.
 *
 *   3. Click-time validation — when the button is clicked a secondary
 *      validation pass runs (backup to updateSubmitButton). If any field fails,
 *      the CMS error banner is shown and the page scrolls to it. On success:
 *        - The button is immediately disabled (prevents double-submit).
 *        - Its label changes to "Submitting...please wait" with a
 *          FontAwesome Pro fa-spinner-third fa-spin icon appended inside.
 *        - Submission is handed to the CMS via submit_form(form, true), with a
 *          plain form.submit() fallback if the CMS function is unavailable.
 *
 *   4. Close date pre-population — defaults to today + 3 calendar days (Mon/
 *      Tue) or today + 5 calendar days (Wed–Sun) to guarantee a minimum of
 *      3 business days. Time is set to 23:45 (hidden in the UI via CSS).
 *
 *   5. Advertise filter — hides all rows in the "Where do you want to
 *      advertise?" table on load except NTG Central. When an agency is
 *      selected, shows the matching row and auto-checks its checkbox.
 *      If no matching row exists the NTG Central checkbox is checked instead
 *      and #agency-advertise-warning is shown.
 *
 *   6. Real-time gate (updateSubmitButton) — re-evaluates all five required-
 *      field conditions on every watched change event and enables/disables
 *      the submit button accordingly.
 *
 * ## Dependencies
 * - jQuery 3.4.1 (loaded by the CMS page template before this script)
 * - Squiz Matrix global `submit_form(form, bool)` (injected by CMS at runtime)
 * - FontAwesome Pro (loaded by the CMS asset pipeline; dev kit in reference HTML)
 *   Icon used: fas fa-spinner-third fa-spin (inside the submit button on submit)
 *
 * ## Field ID reference
 * | Field                    | Element ID / selector                            |
 * |--------------------------|--------------------------------------------------|
 * | Designation (multi-sel.) | #metadata_field_select_445634                    |
 * | Close date – day         | #metadata_field_date_445509_datetimevalue_d      |
 * | Close date – month       | #metadata_field_date_445509_datetimevalue_m      |
 * | Close date – year        | #metadata_field_date_445509_datetimevalue_y      |
 * | Close date – hour        | #metadata_field_date_445509_datetimevalue_h      |
 * | Close date – minute      | #metadata_field_date_445509_datetimevalue_i      |
 * | Vacancy duration         | #metadata_field_text_445506_value                |
 * | Agency (single-sel.)     | #metadata_field_select_445640                    |
 * | Location (multi-sel.)    | #metadata_field_select_445518                    |
 * | Advertise checkboxes     | input[name^="metadata_field_select_446182"]      |
 * | NTG Central checkbox     | #metadata_field_select_446182_WoG                |
 * | Agency checkbox (dyn.)   | #metadata_field_select_446182_{AGENCY_CODE}      |
 * | Documentation (file)     | input[name="word_doc_0"]                         |
 * | Declaration checkbox     | #metadata_field_select_691088_declare            |
 * | Declaration section      | #declaration                                     |
 * | Submit button            | #sq_commit_button  (a <button>, not <input>)     |
 *
 * ## Warning / error element IDs (in html/eoi-form.html, hidden by default)
 * | Element ID                | Shown when…                                          |
 * |---------------------------|------------------------------------------------------|
 * | #designation-warning      | No designation selected                              |
 * | #date-close-warning        | Close date is < 3 business days from today           |
 * | #location-warning         | No location selected                                 |
 * | #agency-advertise-warning | Agency chosen but has no matching advertise checkbox |
 * | #documentation-warning    | No Word document attached                            |
 *
 * ## CSS error classes (defined in css/eoi-form.css)
 * | Class                | Applied to                                    |
 * |----------------------|-----------------------------------------------|
 * | .ntgc-date--error    | Close-date day / month / year <select>s       |
 * | .ntgc-select--error  | Designation, Location, Agency <select>s       |
 * | .ntgc-file--error    | Documentation file <input>                    |
 *
 * ## Agencies without an intranet advertise row (NTG Central fallback only)
 * AAPA, AGO, DPC, DWC, ICAC, InfoComm, JE, LDC, NTEC, NTJC, NTLAC,
 * OCC, OCPE, OMB, PWC
 * These agencies appear in the Agency dropdown (#metadata_field_select_445640)
 * but have no corresponding checkbox in the advertise table. When selected,
 * #agency-advertise-warning is shown and the form cannot be submitted.
 */

// ---------------------------------------------------------------------------
// 1. DOMContentLoaded — declaration hide, button replacement, click validation
// ---------------------------------------------------------------------------
/**
 * Runs synchronously on DOMContentLoaded (before jQuery ready) to ensure:
 *   a) The declaration section is hidden before the user sees the page.
 *   b) The CMS <input type="submit"> is replaced with a <button type="submit">
 *      before any other code references #sq_commit_button, so the button can
 *      hold child elements (e.g. the spinner icon injected on submit).
 *   c) The button starts disabled — updateSubmitButton() enables it once all
 *      required fields are filled.
 *   d) The CMS inline onclick is stripped; submission is fully controlled by
 *      the click listener attached here.
 */
document.addEventListener("DOMContentLoaded", function () {
  // Auto-check the declaration checkbox and hide the entire section
  const declaration = document.getElementById("declaration");
  if (declaration) {
    const declarationCheckbox = document.getElementById(
      "metadata_field_select_691088_declare",
    );
    if (declarationCheckbox) declarationCheckbox.checked = true;
    const declarationLabel = declaration.previousElementSibling;
    if (declarationLabel) declarationLabel.style.display = "none";
    declaration.style.display = "none";
  }

  const inputBtn = document.getElementById("sq_commit_button");

  // Replace <input type="submit"> with <button type="submit"> so child
  // elements (e.g. spinner icon) can be rendered inside the button.
  const commitButton = document.createElement("button");
  commitButton.type = "submit";
  commitButton.id = inputBtn.id;
  commitButton.className = inputBtn.className;
  commitButton.classList.remove("ntgc-file-upload");
  commitButton.textContent = "Submit";
  // Disable immediately — updateSubmitButton() will re-enable when valid
  commitButton.disabled = true;
  inputBtn.parentNode.replaceChild(commitButton, inputBtn);

  if (commitButton) {
    // Remove the CMS-injected inline onclick so we fully control submission
    commitButton.removeAttribute("onclick");

    commitButton.addEventListener("click", function (event) {
      event.preventDefault();

      /**
       * Secondary (server-side backup) validation list.
       * updateSubmitButton() already guards the button, but this catches any
       * edge cases where the button becomes clickable unexpectedly.
       *
       * Fields without an `id` property are handled by custom logic below
       * (e.g. the "Advertise" checkbox group uses a name-prefix selector).
       */
      const requiredFields = [
        { id: "metadata_field_select_445634", name: "Designation" },
        { id: "metadata_field_text_445506_value", name: "Duration" },
        { id: "metadata_field_select_445640", name: "Agency" },
        { name: "Advertise" }, // checkbox group — handled separately below
      ];

      let allFilled = true;

      requiredFields.forEach((field) => {
        if (field.id) {
          const element = document.getElementById(field.id);
          if (element) {
            if (element.type === "text" && !element.value.trim()) {
              allFilled = false;
              element.classList.add("error");
              console.log(`${field.name} (${field.id}) is empty`);
            } else if (element.tagName === "SELECT" && !element.value) {
              allFilled = false;
              element.classList.add("error");
              console.log(`${field.name} (${field.id}) is not selected`);
            } else {
              element.classList.remove("error");
            }
          } else {
            console.error(
              `Required field '${field.name}' (${field.id}) is missing in the DOM.`,
            );
            allFilled = false;
          }
        } else {
          // "Advertise" checkbox group — at least one must be checked
          const checkboxes = document.querySelectorAll(
            'input[name^="metadata_field_select_446182"]',
          );
          const isChecked = Array.from(checkboxes).some(
            (checkbox) => checkbox.checked,
          );
          if (!isChecked) {
            allFilled = false;
            console.log(`${field.name} is not selected`);
          }
        }
      });

      console.log(`All fields filled: ${allFilled}`);

      if (!allFilled) {
        // Surface the CMS error banner (.ntgc-form-alerts--error) if present
        const errorDiv = $(".ntgc-form-alerts.ntgc-form-alerts--error");
        if (errorDiv.length) {
          errorDiv.css("display", "block");
          errorDiv.html(`
                        <div style="width: 100%; color: var(--clr-status-danger, #A60F37); font-size: 14px; font-family: Roboto; font-weight: 400; line-height: 20px; word-wrap: break-word">The internal vacancy was not created. Ensure you have entered all required information and try again.</div>
                    `);
          $("html, body").animate({ scrollTop: errorDiv.offset().top }, 500);
        }
        return;
      }

      // All validations passed — disable button, show spinner, then submit
      const btn = this;
      btn.disabled = true;
      btn.innerHTML =
        "Submitting...please wait" +
        '<i class="fas fa-spinner-third fa-spin" style="margin-left: 8px"></i>';

      if (typeof submit_form === "function") {
        this.form.sq_committing.value = 1;
        submit_form(this.form, true);
      } else {
        this.form.submit();
      }
    });
  } else {
    console.error("Commit button not found in the DOM.");
  }
});

// ---------------------------------------------------------------------------
// 2. Utility — addWorkingDays (Mon–Fri only, no public holiday awareness)
// ---------------------------------------------------------------------------
/**
 * @param {Date} date  - The start date.
 * @param {number} days - Number of working days to add.
 * @returns {Date} A new Date object `days` working days after `date`.
 */
function addWorkingDays(date, days) {
  let result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      count++;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// 3. jQuery ready — date pre-population, advertise filter, change listeners
// ---------------------------------------------------------------------------
$(document).ready(function () {
  // -- Element references --------------------------------------------------
  var agency = $("#metadata_field_select_445640");

  /**
   * `sites`    — all checkbox inputs inside the advertise-selection table.
   * `siteRows` — the corresponding <tr> elements (index-matched to `sites`).
   * On agency change, all rows except the NTG Central row and the matching
   * agency row are hidden, and only the matching checkbox is checked.
   */
  var sites = $("#advertise-selection table input");
  var siteRows = $("#advertise-selection table tr");

  // ID of the always-visible "NTG Central" checkbox
  var ntgcId = "metadata_field_select_446182_WoG";

  // -- Pre-populate close date ---------------------------------------------
  /**
   * Default close date rule:
   *   - If today is Mon or Tue (getDay < 3): add 3 calendar days → lands Thu/Fri
   *   - Otherwise: add 5 calendar days → skips the weekend
   * This ensures the default is always at least 3 business days ahead.
   * Hour is set to 23:45 (hidden from users via CSS) to expire at end of day.
   */
  const today = new Date();
  const closeDate = new Date(
    today.setDate(today.getDate() + (today.getDay() < 3 ? 3 : 5)),
  );

  // Collect month names from the existing <option> elements for reference
  var monthNames = [];
  $("#metadata_field_date_445509_datetimevalue_m option").each(function () {
    monthNames.push($(this).html());
  });

  $(
    "#metadata_field_date_445509_datetimevalue_d option:eq(" +
      closeDate.getDate() +
      ")",
  ).prop("selected", true);
  $("#metadata_field_date_445509_datetimevalue_m").val(
    closeDate.getMonth() + 1,
  );
  $(
    "#metadata_field_date_445509_datetimevalue_y option:eq(" +
      closeDate.getFullYear() +
      ")",
  ).prop("selected", true);
  // Time set to 23:45 — hidden via CSS but required by the CMS date field
  $("#metadata_field_date_445509_datetimevalue_h option:eq(23)").prop(
    "selected",
    true,
  );
  $("#metadata_field_date_445509_datetimevalue_i option:eq(45)").prop(
    "selected",
    true,
  );

  // Hide all advertise rows on load; the first row (NTG Central) stays visible
  $(siteRows).hide();
  $(siteRows[0]).show();

  // -- Agency change handler -----------------------------------------------
  /**
   * When the user selects an agency:
   *   1. Build the expected checkbox ID from the agency value
   *      e.g. "AGD" → "#metadata_field_select_446182_AGD"
   *   2. Show only the matching row (and keep NTG Central always visible).
   *   3. Auto-check the matching checkbox.
   *   4. If no matching checkbox exists (agency not in the advertise list),
   *      fall back to checking NTG Central only.
   *   5. Re-evaluate submit button state.
   */
  $(agency).on("change", function () {
    var agencyValue = this.value;
    var agencyId = `#metadata_field_select_446182_${agencyValue.replaceAll(" ", "")}`;

    $(sites).each(function (index) {
      if ($(this).attr("id").localeCompare(ntgcId) != 0) {
        $(this).prop("checked", false);
        $(this).attr("id").localeCompare(agencyId.replace("#", "")) != 0
          ? $(siteRows[index]).hide()
          : $(siteRows[index]).show();
      }
    });

    if (
      $(agencyId) == null ||
      $(agencyId) == undefined ||
      $(agencyId).length < 1
    ) {
      // Agency has no intranet option — publish on NTG Central only
      $(`#${ntgcId}`).prop("checked", true);
    } else {
      $(agencyId).prop("checked", true);
      $(agencyId).show();
    }
    updateSubmitButton();
  });

  // -- Utility: count working days between two dates -----------------------
  /**
   * Counts Mon–Fri days from `start` (exclusive) to `end` (inclusive).
   * Does not account for public holidays.
   *
   * @param {Date} start
   * @param {Date} end
   * @returns {number}
   */
  function countWorkingDays(start, end) {
    let count = 0;
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    let target = new Date(end);
    target.setHours(0, 0, 0, 0);
    while (current < target) {
      current.setDate(current.getDate() + 1);
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        count++;
      }
    }
    return count;
  }

  // -- Close date warning --------------------------------------------------
  /**
   * Shows #date-close-warning and applies .ntgc-date--error to the three
   * date <select> elements when the selected close date is fewer than 3
   * working days from today.
   *
   * Called on change of any of the three date selects, and once on page load
   * after the default date is set.
   */
  function checkCloseDateWarning() {
    var d = $("#metadata_field_date_445509_datetimevalue_d").val();
    var m = $("#metadata_field_date_445509_datetimevalue_m").val();
    var y = $("#metadata_field_date_445509_datetimevalue_y").val();
    var warning = $("#date-close-warning");

    // If any part of the date is unset, hide the warning silently
    if (!d || d === "--" || !m || m === "--" || !y || y === "--") {
      warning.hide();
      return;
    }

    var selectedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var dateSelects = $(
      "#metadata_field_date_445509_datetimevalue_d, #metadata_field_date_445509_datetimevalue_m, #metadata_field_date_445509_datetimevalue_y",
    );

    if (countWorkingDays(today, selectedDate) < 3) {
      warning.show();
      dateSelects.addClass("ntgc-date--error");
    } else {
      warning.hide();
      dateSelects.removeClass("ntgc-date--error");
    }
  }

  $(
    "#metadata_field_date_445509_datetimevalue_d, #metadata_field_date_445509_datetimevalue_m, #metadata_field_date_445509_datetimevalue_y",
  ).on("change", checkCloseDateWarning);

  // -- Submit button gate + inline field warnings --------------------------
  /**
   * Evaluates all required-field conditions and:
   *   - Enables or disables #sq_commit_button
   *   - Shows/hides each inline warning <div>
   *   - Adds/removes error CSS classes on the relevant inputs
   *
   * Conditions that disable the button (any one failing blocks submission):
   *   1. Designation multi-select — at least one option selected
   *   2. Location multi-select   — at least one option selected
   *   3. Close date              — all three parts (d/m/y) must be set (not "--")
   *   4. Agency + advertise      — an agency must be chosen AND a matching
   *                                checkbox row must exist in the advertise table
   *   5. Documentation           — a file must be attached to word_doc_0
   *
   * Called from:
   *   - $(agency).on("change", …)
   *   - Designation / location change listeners
   *   - Date select change listeners
   *   - File input change listener
   *   - $(document).ready() on page load (after date pre-population)
   */
  function updateSubmitButton() {
    var btn = $("#sq_commit_button");

    // 1. Designation
    var designationSelected = $("#metadata_field_select_445634").val();
    var designationOk = designationSelected && designationSelected.length > 0;
    $("#designation-warning").toggle(!designationOk);
    $("#metadata_field_select_445634").toggleClass(
      "ntgc-select--error",
      !designationOk,
    );

    // 2. Location
    var locationSelected = $("#metadata_field_select_445518").val();
    var locationOk = locationSelected && locationSelected.length > 0;
    $("#location-warning").toggle(!locationOk);
    $("#metadata_field_select_445518").toggleClass(
      "ntgc-select--error",
      !locationOk,
    );

    // 3. Close date (warning text handled separately by checkCloseDateWarning)
    var d = $("#metadata_field_date_445509_datetimevalue_d").val();
    var m = $("#metadata_field_date_445509_datetimevalue_m").val();
    var y = $("#metadata_field_date_445509_datetimevalue_y").val();
    var dateOk = d && d !== "--" && m && m !== "--" && y && y !== "--";

    // 4. Agency + advertise checkbox
    // agencyOk is true only when the selected agency value has a corresponding
    // checkbox element in the advertise table (id pattern: metadata_field_select_446182_{VALUE}).
    // Agencies that exist in the Agency dropdown but not in the advertise table
    // (e.g. AAPA, AGO, DPC, DWC, ICAC, InfoComm, JE, LDC, NTEC, NTJC, NTLAC,
    //  OCC, OCPE, OMB, PWC) will show #agency-advertise-warning.
    var agencyValue = $("#metadata_field_select_445640").val();
    var agencyOk = false;
    if (agencyValue) {
      var agencyCheckboxId =
        "#metadata_field_select_446182_" + agencyValue.replaceAll(" ", "");
      agencyOk = $(agencyCheckboxId).length > 0;
    }
    var agencySelected = !!agencyValue;
    $("#agency-advertise-warning").toggle(agencySelected && !agencyOk);
    $("#metadata_field_select_445640").toggleClass(
      "ntgc-select--error",
      agencySelected && !agencyOk,
    );

    // 5. Documentation file upload
    var fileInput = $("input[name='word_doc_0']");
    var documentationOk =
      fileInput.length > 0 &&
      fileInput[0].files &&
      fileInput[0].files.length > 0;
    $("#documentation-warning").toggle(!documentationOk);
    fileInput.toggleClass("ntgc-file--error", !documentationOk);

    btn.prop(
      "disabled",
      !(designationOk && locationOk && dateOk && agencyOk && documentationOk),
    );
  }

  // -- Change listeners ----------------------------------------------------
  $("#metadata_field_select_445634, #metadata_field_select_445518").on(
    "change",
    updateSubmitButton,
  );

  $("input[name='word_doc_0']").on("change", updateSubmitButton);

  $(
    "#metadata_field_date_445509_datetimevalue_d, #metadata_field_date_445509_datetimevalue_m, #metadata_field_date_445509_datetimevalue_y",
  ).on("change", updateSubmitButton);

  // -- Initial state -------------------------------------------------------
  // Run both checks after the date is pre-populated so the page starts in the
  // correct visual state without requiring any user interaction.
  checkCloseDateWarning();
  updateSubmitButton();
});
