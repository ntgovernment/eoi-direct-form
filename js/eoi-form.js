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
 *      the submit button accordingly. An agency without a dedicated
 *      advertise row only blocks submission if no checkbox ends up checked
 *      (i.e. the NTG Central fallback also failed) — the warning shown for
 *      that case is informational, not a hard error.
 *
 * ## Dependencies
 * - jQuery 3.4.1 (loaded by the CMS page template before this script)
 * - Squiz Matrix global `submit_form(form, bool)` (injected by CMS at runtime)
 * - FontAwesome Pro (loaded by the CMS asset pipeline; dev kit in reference HTML)
 *   Icon used: fas fa-spinner-third fa-spin (inside the submit button on submit)
 *
 * ## Field ID reference
 * The editable fields live in two variant wrappers whose IDs end in
 * `_type_link` or `_type_word_doc`. Shared logic always scopes lookups to the
 * currently visible wrapper, then uses the selector families below.
 *
 * | Field                    | Element selector                                      |
 * |--------------------------|-------------------------------------------------------|
 * | Designation (multi-sel.) | select[id^="metadata_field_select_445634_"]           |
 * | Close date – day         | select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"] |
 * | Close date – month       | select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"] |
 * | Close date – year        | select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"] |
 * | Close date – hour        | select[id^="metadata_field_date_445509_"][id$="_datetimevalue_h"] |
 * | Close date – minute      | select[id^="metadata_field_date_445509_"][id$="_datetimevalue_i"] |
 * | Vacancy duration         | input[id^="metadata_field_text_445506_"][id$="_value"] |
 * | Agency (single-sel.)     | select[id^="metadata_field_select_445640_"]           |
 * | Location (multi-sel.)    | select[id^="metadata_field_select_445518_"]           |
 * | Advertise checkboxes     | input[name^="metadata_field_select_446182_"]         |
 * | NTG Central checkbox     | [id^="metadata_field_select_446182_"][id$="_WoG"]   |
 * | Agency checkbox (dyn.)   | #metadata_field_select_446182_{MODE}_{AGENCY_CODE} |
 * | Jobs NT id (link mode)   | input[id^="metadata_field_text_998904_"][id$="_value"] |
 * | Documentation (file)     | input[name="word_doc_0"] (word_doc mode only)         |
 * | Declaration checkbox     | #metadata_field_select_691088_declare                 |
 * | Declaration section      | #declaration                                          |
 * | Submit button            | #sq_commit_button within the active variant wrapper   |
 *
 * ## Warning / error element IDs (in html/eoi-form.html, hidden by default)
 * | Element ID                | Shown when…                                          |
 * |---------------------------|------------------------------------------------------|
 * | #designation-warning      | No designation selected                              |
 * | #date-close-warning        | Close date is < 3 business days from today           |
 * | #location-warning         | No location selected                                 |
 * | #agency-advertise-warning | Agency chosen has no matching advertise checkbox (informational — NTG Central fallback still allows submission) |
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
 * These agencies appear in each Agency dropdown
 * but have no corresponding checkbox in the advertise table. When selected,
 * #agency-advertise-warning is shown and the NTG Central checkbox is
 * auto-checked in its place, so the form can still be submitted.
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

  const inputButtons = document.querySelectorAll('[id="sq_commit_button"]');

  inputButtons.forEach(function (inputBtn) {
    // Replace <input type="submit"> with <button type="submit"> so child
    // elements (e.g. spinner icon) can be rendered inside the button.
    const commitButton = document.createElement("button");
    commitButton.type = "submit";
    commitButton.id = inputBtn.id;
    commitButton.name = inputBtn.name;
    commitButton.className = inputBtn.className;
    commitButton.classList.remove("ntgc-file-upload");
    commitButton.textContent = "Submit";
    // Disable immediately — updateSubmitButton() will re-enable when valid
    commitButton.disabled = true;
    inputBtn.parentNode.replaceChild(commitButton, inputBtn);

    // Remove the CMS-injected inline onclick so we fully control submission
    commitButton.removeAttribute("onclick");

    commitButton.addEventListener("click", function (event) {
      event.preventDefault();

      const allFilled = validateActiveVariantForSubmit();

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
  });

  if (!inputButtons.length) {
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

const EOI_VARIANT_SELECTOR =
  '[id$="_type_link"], [id$="_type_word_doc"]';

function getVariantContexts() {
  return $(EOI_VARIANT_SELECTOR);
}

function getActiveVariantContext() {
  return getVariantContexts()
    .filter(function () {
      return $(this).css("display") !== "none";
    })
    .first();
}

function getVariantMode($context) {
  var contextId = $context.attr("id") || "";
  return contextId.endsWith("_type_word_doc") ? "word_doc" : "link";
}

function findOne($context, selector) {
  if (!$context || !$context.length) {
    return $();
  }

  var element = $context[0].querySelector(selector);
  return element ? $(element) : $();
}

function findAll($context, selector) {
  if (!$context || !$context.length) {
    return $();
  }

  return $($context[0].querySelectorAll(selector));
}

function getAgencyCode(value) {
  return (value || "").replace(/\s+/g, "");
}

function getAdvertiseCheckboxPrefix($context) {
  return "metadata_field_select_446182_" + getVariantMode($context) + "_";
}

function populateCloseDateFields($context) {
  var dayField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var hourField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_h"]',
  );
  var minuteField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_i"]',
  );

  if (!dayField.length || !monthField.length || !yearField.length) {
    return;
  }

  var today = new Date();
  var closeDate = new Date(
    today.setDate(today.getDate() + (today.getDay() < 3 ? 3 : 5)),
  );

  dayField.val(String(closeDate.getDate()));
  monthField.val(String(closeDate.getMonth() + 1));
  yearField.val(String(closeDate.getFullYear()));
  hourField.val("23");
  minuteField.val("45");
}

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

function syncAdvertiseRows($context) {
  var sites = findAll(
    $context,
    '#advertise-selection table input[type="checkbox"]',
  );
  var siteRows = findAll($context, '#advertise-selection table tr');
  var agencyField = findOne(
    $context,
    'select[id^="metadata_field_select_445640_"]',
  );
  var agencyValue = agencyField.val();
  var advertisePrefix = getAdvertiseCheckboxPrefix($context);
  var ntgcId = advertisePrefix + "WoG";
  var agencyCheckboxId = advertisePrefix + getAgencyCode(agencyValue);

  siteRows.hide();
  siteRows.first().show();

  sites.each(function (index) {
    if (this.id !== ntgcId) {
      $(this).prop("checked", false);
      if (agencyValue && this.id === agencyCheckboxId) {
        $(siteRows[index]).show();
      } else {
        $(siteRows[index]).hide();
      }
    }
  });

  if (!agencyValue) {
    return;
  }

  var agencyCheckbox = findOne($context, '[id="' + agencyCheckboxId + '"]');
  if (!agencyCheckbox.length) {
    findOne($context, '[id="' + ntgcId + '"]').prop("checked", true);
  } else {
    agencyCheckbox.prop("checked", true);
    agencyCheckbox.closest("tr").show();
  }
}

function getVariantState($context) {
  var designationField = findOne(
    $context,
    'select[id^="metadata_field_select_445634_"]',
  );
  var locationField = findOne(
    $context,
    'select[id^="metadata_field_select_445518_"]',
  );
  var agencyField = findOne(
    $context,
    'select[id^="metadata_field_select_445640_"]',
  );
  var dayField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    $context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var advertiseCheckboxes = findAll(
    $context,
    'input[name^="metadata_field_select_446182_"]',
  );
  var idField = findOne(
    $context,
    'input[id^="metadata_field_text_998904_"][id$="_value"]',
  );
  var fileInput = findOne($context, "input[name='word_doc_0']");
  var agencyValue = agencyField.val();
  var advertisePrefix = getAdvertiseCheckboxPrefix($context);
  var agencyCheckboxId = advertisePrefix + getAgencyCode(agencyValue);
  var isLinkMode = getVariantMode($context) === "link";
  var designationSelected = designationField.val();
  var locationSelected = locationField.val();

  return {
    designationField,
    designationOk: !!(designationSelected && designationSelected.length > 0),
    locationField,
    locationOk: !!(locationSelected && locationSelected.length > 0),
    agencyField,
    agencySelected: !!agencyValue,
    agencyHasDedicatedRow:
      !!agencyValue && findOne($context, '[id="' + agencyCheckboxId + '"]').length > 0,
    advertiseOk: advertiseCheckboxes.filter(":checked").length > 0,
    dayField,
    monthField,
    yearField,
    dateOk:
      !!dayField.val() &&
      dayField.val() !== "--" &&
      !!monthField.val() &&
      monthField.val() !== "--" &&
      !!yearField.val() &&
      yearField.val() !== "--",
    isLinkMode,
    idField,
    idFieldOk: !isLinkMode || !!(idField.length && idField.val().trim()),
    fileInput,
    documentationOk:
      isLinkMode ||
      (fileInput.length > 0 &&
        fileInput[0].files &&
        fileInput[0].files.length > 0),
  };
}

function checkCloseDateWarning($context) {
  var $activeContext = $context && $context.length ? $context : getActiveVariantContext();
  if (!$activeContext.length) {
    return;
  }

  var dayField = findOne(
    $activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    $activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    $activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var warning = findOne($activeContext, '[id="date-close-warning"]');

  if (!dayField.length || !monthField.length || !yearField.length) {
    return;
  }

  if (
    !dayField.val() ||
    dayField.val() === "--" ||
    !monthField.val() ||
    monthField.val() === "--" ||
    !yearField.val() ||
    yearField.val() === "--"
  ) {
    warning.hide();
    dayField.add(monthField).add(yearField).removeClass("ntgc-date--error");
    return;
  }

  var selectedDate = new Date(
    parseInt(yearField.val(), 10),
    parseInt(monthField.val(), 10) - 1,
    parseInt(dayField.val(), 10),
  );
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var dateFields = dayField.add(monthField).add(yearField);

  if (countWorkingDays(today, selectedDate) < 3) {
    warning.show();
    dateFields.addClass("ntgc-date--error");
  } else {
    warning.hide();
    dateFields.removeClass("ntgc-date--error");
  }
}

function getActiveSubmitButton($context) {
  var $activeContext = $context && $context.length ? $context : getActiveVariantContext();
  return findOne($activeContext, '[id="sq_commit_button"]');
}

function updateSubmitButton($context) {
  var $activeContext = $context && $context.length ? $context : getActiveVariantContext();
  var btn = getActiveSubmitButton($activeContext);

  if (!btn.length || !$activeContext.length) {
    $(document.querySelectorAll('[id="sq_commit_button"]')).prop("disabled", true);
    return false;
  }

  var state = getVariantState($activeContext);

  findOne($activeContext, '[id="designation-warning"]').toggle(!state.designationOk);
  state.designationField.toggleClass("ntgc-select--error", !state.designationOk);

  findOne($activeContext, '[id="location-warning"]').toggle(!state.locationOk);
  state.locationField.toggleClass("ntgc-select--error", !state.locationOk);

  findOne($activeContext, '[id="agency-advertise-warning"]').toggle(
    state.agencySelected && !state.agencyHasDedicatedRow,
  );
  state.agencyField.toggleClass(
    "ntgc-select--error",
    state.agencySelected && !state.agencyHasDedicatedRow,
  );

  if (state.isLinkMode) {
    state.idField.toggleClass("ntgc-select--error", !state.idFieldOk);
    findOne($activeContext, '[id="documentation-warning"]').hide();
  } else {
    findOne($activeContext, '[id="documentation-warning"]').toggle(
      !state.documentationOk,
    );
    state.fileInput.toggleClass("ntgc-file--error", !state.documentationOk);
  }

  var isValid =
    state.designationOk &&
    state.locationOk &&
    state.dateOk &&
    state.agencySelected &&
    state.advertiseOk &&
    state.idFieldOk &&
    state.documentationOk;

  btn.prop("disabled", !isValid);
  return isValid;
}

function updateActiveVariantState() {
  var $activeContext = getActiveVariantContext();
  checkCloseDateWarning($activeContext);
  return updateSubmitButton($activeContext);
}

function validateActiveVariantForSubmit() {
  var $activeContext = getActiveVariantContext();
  if (!$activeContext.length) {
    return false;
  }

  var durationField = findOne(
    $activeContext,
    'input[id^="metadata_field_text_445506_"][id$="_value"]',
  );
  var durationOk = !durationField.length || !!durationField.val().trim();

  durationField.toggleClass("error", !durationOk);

  return updateActiveVariantState() && durationOk;
}

// ---------------------------------------------------------------------------
// 3. jQuery ready — date pre-population, advertise filter, change listeners
// ---------------------------------------------------------------------------
$(document).ready(function () {
  getVariantContexts().each(function () {
    var $context = $(this);
    populateCloseDateFields($context);
    syncAdvertiseRows($context);
  });

  // -- Change listeners ----------------------------------------------------
  $(document).on(
    "change",
    'select[id^="metadata_field_select_445640_"]',
    function () {
      syncAdvertiseRows($(this).closest(EOI_VARIANT_SELECTOR));
      updateActiveVariantState();
    },
  );

  $(document).on(
    "change",
    'select[id^="metadata_field_select_445634_"], select[id^="metadata_field_select_445518_"], input[name="word_doc_0"], input[name^="metadata_field_select_446182_"], select[id^="metadata_field_date_445509_"][id*="_datetimevalue_"]',
    updateActiveVariantState,
  );

  $(document).on(
    "click",
    '[id$="_type_link_tab"] a, [id$="_type_word_doc_tab"] a',
    function () {
      window.requestAnimationFrame(updateActiveVariantState);
    },
  );

  // -- Initial state -------------------------------------------------------
  // Run both checks after the date is pre-populated so the page starts in the
  // correct visual state without requiring any user interaction.
  updateActiveVariantState();
});
