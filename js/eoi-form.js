/**
 * eoi-form.js
 * -----------
 * Client-side behaviour for the "Directly publish an expression of interest"
 * form on NTG Central (Squiz Matrix CMS).
 *
 * ## Overview
 * The form is a Squiz Matrix asset-builder page. On DOMContentLoaded this
 * script runs the following setup steps, then plain DOM event listeners handle
 * ongoing event-driven behaviour:
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
 * Runs synchronously on DOMContentLoaded to ensure:
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
        const errorDiv = document.querySelector(
          ".ntgc-form-alerts.ntgc-form-alerts--error",
        );
        if (errorDiv) {
          errorDiv.style.display = "block";
          errorDiv.innerHTML = `
                        <div style="width: 100%; color: var(--clr-status-danger, #A60F37); font-size: 14px; font-family: Roboto; font-weight: 400; line-height: 20px; word-wrap: break-word">The internal vacancy was not created. Ensure you have entered all required information and try again.</div>
                    `;
          errorDiv.scrollIntoView({ behavior: "smooth", block: "start" });
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
  return Array.from(document.querySelectorAll(EOI_VARIANT_SELECTOR));
}

function getActiveVariantContext() {
  return (
    getVariantContexts().find(function (context) {
      return window.getComputedStyle(context).display !== "none";
    }) || null
  );
}

function getVariantMode(context) {
  var contextId = context?.id || "";
  return contextId.endsWith("_type_word_doc") ? "word_doc" : "link";
}

function findOne(context, selector) {
  if (!context) {
    return null;
  }

  return context.querySelector(selector);
}

function findAll(context, selector) {
  if (!context) {
    return [];
  }

  return Array.from(context.querySelectorAll(selector));
}

function getAgencyCode(value) {
  return (value || "").replace(/\s+/g, "");
}

function getAdvertiseCheckboxPrefix(context) {
  return "metadata_field_select_446182_" + getVariantMode(context) + "_";
}

function setDisplayed(element, isVisible) {
  if (element) {
    element.style.display = isVisible ? "" : "none";
  }
}

function toggleClass(element, className, isEnabled) {
  if (element) {
    element.classList.toggle(className, isEnabled);
  }
}

function setChecked(element, isChecked) {
  if (element) {
    element.checked = isChecked;
  }
}

function setDisabled(element, isDisabled) {
  if (element) {
    element.disabled = isDisabled;
  }
}

function getSelectValues(select) {
  if (!select) {
    return [];
  }

  if (select.multiple) {
    return Array.from(select.selectedOptions)
      .map(function (option) {
        return option.value;
      })
      .filter(Boolean);
  }

  return select.value ? [select.value] : [];
}

function populateCloseDateFields(context) {
  var dayField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var hourField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_h"]',
  );
  var minuteField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_i"]',
  );

  if (!dayField || !monthField || !yearField) {
    return;
  }

  var today = new Date();
  var closeDate = new Date(
    today.setDate(today.getDate() + (today.getDay() < 3 ? 3 : 5)),
  );

  dayField.value = String(closeDate.getDate());
  monthField.value = String(closeDate.getMonth() + 1);
  yearField.value = String(closeDate.getFullYear());
  if (hourField) hourField.value = "23";
  if (minuteField) minuteField.value = "45";
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

function syncAdvertiseRows(context) {
  var sites = findAll(
    context,
    '#advertise-selection table input[type="checkbox"]',
  );
  var siteRows = findAll(context, '#advertise-selection table tr');
  var agencyField = findOne(
    context,
    'select[id^="metadata_field_select_445640_"]',
  );
  var agencyValue = agencyField ? agencyField.value : "";
  var advertisePrefix = getAdvertiseCheckboxPrefix(context);
  var ntgcId = advertisePrefix + "WoG";
  var agencyCheckboxId = advertisePrefix + getAgencyCode(agencyValue);

  siteRows.forEach(function (row, index) {
    setDisplayed(row, index === 0);
  });

  sites.forEach(function (site, index) {
    if (site.id !== ntgcId) {
      setChecked(site, false);
      if (agencyValue && site.id === agencyCheckboxId) {
        setDisplayed(siteRows[index], true);
      } else {
        setDisplayed(siteRows[index], false);
      }
    }
  });

  if (!agencyValue) {
    return;
  }

  var agencyCheckbox = findOne(context, '[id="' + agencyCheckboxId + '"]');
  if (!agencyCheckbox) {
    setChecked(findOne(context, '[id="' + ntgcId + '"]'), true);
  } else {
    setChecked(agencyCheckbox, true);
    setDisplayed(agencyCheckbox.closest("tr"), true);
  }
}

function getVariantState(context) {
  var designationField = findOne(
    context,
    'select[id^="metadata_field_select_445634_"]',
  );
  var locationField = findOne(
    context,
    'select[id^="metadata_field_select_445518_"]',
  );
  var agencyField = findOne(
    context,
    'select[id^="metadata_field_select_445640_"]',
  );
  var dayField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    context,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var advertiseCheckboxes = findAll(
    context,
    'input[name^="metadata_field_select_446182_"]',
  );
  var idField = findOne(
    context,
    'input[id^="metadata_field_text_998904_"][id$="_value"]',
  );
  var fileInput = findOne(context, "input[name='word_doc_0']");
  var agencyValue = agencyField ? agencyField.value : "";
  var advertisePrefix = getAdvertiseCheckboxPrefix(context);
  var agencyCheckboxId = advertisePrefix + getAgencyCode(agencyValue);
  var isLinkMode = getVariantMode(context) === "link";
  var designationSelected = getSelectValues(designationField);
  var locationSelected = getSelectValues(locationField);

  return {
    designationField,
    designationOk: designationSelected.length > 0,
    locationField,
    locationOk: locationSelected.length > 0,
    agencyField,
    agencySelected: !!agencyValue,
    agencyHasDedicatedRow:
      !!agencyValue && !!findOne(context, '[id="' + agencyCheckboxId + '"]'),
    advertiseOk: advertiseCheckboxes.some(function (checkbox) {
      return checkbox.checked;
    }),
    dayField,
    monthField,
    yearField,
    dateOk:
      !!dayField?.value &&
      dayField.value !== "--" &&
      !!monthField?.value &&
      monthField.value !== "--" &&
      !!yearField?.value &&
      yearField.value !== "--",
    isLinkMode,
    idField,
    idFieldOk: !isLinkMode || !!(idField && idField.value.trim()),
    fileInput,
    documentationOk:
      isLinkMode ||
      !!(fileInput && fileInput.files && fileInput.files.length > 0),
  };
}

function checkCloseDateWarning(context) {
  var activeContext = context || getActiveVariantContext();
  if (!activeContext) {
    return;
  }

  var dayField = findOne(
    activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_d"]',
  );
  var monthField = findOne(
    activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_m"]',
  );
  var yearField = findOne(
    activeContext,
    'select[id^="metadata_field_date_445509_"][id$="_datetimevalue_y"]',
  );
  var warning = findOne(activeContext, '[id="date-close-warning"]');

  if (!dayField || !monthField || !yearField) {
    return;
  }

  if (
    !dayField.value ||
    dayField.value === "--" ||
    !monthField.value ||
    monthField.value === "--" ||
    !yearField.value ||
    yearField.value === "--"
  ) {
    setDisplayed(warning, false);
    [dayField, monthField, yearField].forEach(function (field) {
      toggleClass(field, "ntgc-date--error", false);
    });
    return;
  }

  var selectedDate = new Date(
    parseInt(yearField.value, 10),
    parseInt(monthField.value, 10) - 1,
    parseInt(dayField.value, 10),
  );
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  if (countWorkingDays(today, selectedDate) < 3) {
    setDisplayed(warning, true);
    [dayField, monthField, yearField].forEach(function (field) {
      toggleClass(field, "ntgc-date--error", true);
    });
  } else {
    setDisplayed(warning, false);
    [dayField, monthField, yearField].forEach(function (field) {
      toggleClass(field, "ntgc-date--error", false);
    });
  }
}

function getActiveSubmitButton(context) {
  var activeContext = context || getActiveVariantContext();
  return findOne(activeContext, '[id="sq_commit_button"]');
}

function updateSubmitButton(context) {
  var activeContext = context || getActiveVariantContext();
  var btn = getActiveSubmitButton(activeContext);

  if (!btn || !activeContext) {
    document
      .querySelectorAll('[id="sq_commit_button"]')
      .forEach(function (button) {
        setDisabled(button, true);
      });
    return false;
  }

  var state = getVariantState(activeContext);

  setDisplayed(
    findOne(activeContext, '[id="designation-warning"]'),
    !state.designationOk,
  );
  toggleClass(state.designationField, "ntgc-select--error", !state.designationOk);

  setDisplayed(
    findOne(activeContext, '[id="location-warning"]'),
    !state.locationOk,
  );
  toggleClass(state.locationField, "ntgc-select--error", !state.locationOk);

  setDisplayed(
    findOne(activeContext, '[id="agency-advertise-warning"]'),
    state.agencySelected && !state.agencyHasDedicatedRow,
  );
  toggleClass(
    state.agencyField,
    "ntgc-select--error",
    state.agencySelected && !state.agencyHasDedicatedRow,
  );

  if (state.isLinkMode) {
    toggleClass(state.idField, "ntgc-select--error", !state.idFieldOk);
    setDisplayed(findOne(activeContext, '[id="documentation-warning"]'), false);
  } else {
    setDisplayed(
      findOne(activeContext, '[id="documentation-warning"]'),
      !state.documentationOk,
    );
    toggleClass(state.fileInput, "ntgc-file--error", !state.documentationOk);
  }

  var isValid =
    state.designationOk &&
    state.locationOk &&
    state.dateOk &&
    state.agencySelected &&
    state.advertiseOk &&
    state.idFieldOk &&
    state.documentationOk;

  setDisabled(btn, !isValid);
  return isValid;
}

function updateActiveVariantState() {
  var activeContext = getActiveVariantContext();
  checkCloseDateWarning(activeContext);
  return updateSubmitButton(activeContext);
}

function validateActiveVariantForSubmit() {
  var activeContext = getActiveVariantContext();
  if (!activeContext) {
    return false;
  }

  var durationField = findOne(
    activeContext,
    'input[id^="metadata_field_text_445506_"][id$="_value"]',
  );
  var durationOk = !durationField || !!durationField.value.trim();

  toggleClass(durationField, "error", !durationOk);

  return updateActiveVariantState() && durationOk;
}

// ---------------------------------------------------------------------------
// 3. DOMContentLoaded — date pre-population, advertise filter, change listeners
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  getVariantContexts().forEach(function (context) {
    populateCloseDateFields(context);
    syncAdvertiseRows(context);
  });

  // -- Change listeners ----------------------------------------------------
  document.addEventListener("change", function (event) {
    if (event.target.matches('select[id^="metadata_field_select_445640_"]')) {
      syncAdvertiseRows(event.target.closest(EOI_VARIANT_SELECTOR));
      updateActiveVariantState();
      return;
    }

    if (
      event.target.matches(
        'select[id^="metadata_field_select_445634_"], select[id^="metadata_field_select_445518_"], input[name="word_doc_0"], input[name^="metadata_field_select_446182_"], select[id^="metadata_field_date_445509_"][id*="_datetimevalue_"]',
      )
    ) {
      updateActiveVariantState();
    }
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest('[id$="_type_link_tab"] a, [id$="_type_word_doc_tab"] a')) {
      window.requestAnimationFrame(updateActiveVariantState);
    }
  });

  // -- Initial state -------------------------------------------------------
  // Run both checks after the date is pre-populated so the page starts in the
  // correct visual state without requiring any user interaction.
  updateActiveVariantState();
});
