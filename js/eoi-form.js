const SELECTORS = {
  wrappers: '.sq-asset-builder-tab-content',
  date: {
    all: '[id^="metadata_field_date_445509"]',
    year: '[id^="metadata_field_date_445509"][id$="_datetimevalue_y"]',
    month: '[id^="metadata_field_date_445509"][id$="_datetimevalue_m"]',
    day: '[id^="metadata_field_date_445509"][id$="_datetimevalue_d"]',
    hour: '[id^="metadata_field_date_445509"][id$="_datetimevalue_h"]',
    min: '[id^="metadata_field_date_445509"][id$="_datetimevalue_i"]',
  },
  designation: 'select[id^="metadata_field_select_445634"]',
  duration: '[id^="metadata_field_text_445506"]',
  agency: 'select[id^="metadata_field_select_445640"]',
  position: '[id^="metadata_field_text_445504"]',
  advertise: 'input[name^="metadata_field_select_446182"]',
  location: 'select[id^="metadata_field_select_445518"]',
  // Unique ids
  file: '[name="word_doc_0"]',
  rtfid: '#metadata_field_text_998904_link_value',
  link: {
    name: '#link_0_206',
    url: '#link_0_207'
  }
};

(function ($) {

  $('body').ready(enhanceForm);

  function enhanceForm() {
    const submitBtnId = '#sq_commit_button';
    const inputBtns = document.querySelectorAll(submitBtnId);
    if (!inputBtns.length) {
        console.error('Commit button not found in the DOM.');
        return;
    }

    serverErrorChecks();

    const wrappers = $(SELECTORS.wrappers);
    let activeWrapper = [...wrappers].find(w => w.style.display !== 'none');
    const observer = new MutationObserver((mutations) => {
      const newActive = mutations.filter((mutation) => (
        mutation.type === 'attributes' &&
        mutation.target.style.display !== 'none'
      ))?.[0]?.target;
      if (newActive && newACtive !== activeWrapper) {
        activeWrapper = newActive;
      }
    });
    for (const wrapper of wrappers) {
      observer.observe(wrapper, { attributes: true });
    }
    
    // Replace <input type='submit'> with <button type='submit'> so child
    let submitButtons = $();
    for (const inputBtn of inputBtns) {
      // elements (e.g. spinner icon) can be rendered inside the button.
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.id = inputBtn.id;
      submitButton.className = inputBtn.className;
      submitButton.classList.remove('ntgc-file-upload');
      submitButton.textContent = 'Submit';
      // Disable immediately — updateSubmitButton() will re-enable when valid
      submitButton.disabled = true;
      inputBtn.parentNode.replaceChild(submitButton, inputBtn);
      submitButtons = submitButtons.add(submitButton);
    }
    
    let syncRegistry = new Set();
    function syncFields(selectors = []) {
      if (typeof selectors === 'string') selectors = [selectors];
      syncRegistry = new Set([...syncRegistry, ...selectors]);
    }

    syncFields([
      SELECTORS.designation,
      SELECTORS.duration,
      SELECTORS.agency,
      SELECTORS.position,
      SELECTORS.location
    ]);
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
    // the complex selectors will find for both contexts
    // ie [wrapers.length] times duplicates and set them
    $([
      `${SELECTORS.date.day} [value="${ closeDate.getDate() }"]`,
      `${SELECTORS.date.month} [value="${ closeDate.getMonth() + 1 }"]`,
      `${SELECTORS.date.year} [value="${ closeDate.getFullYear() }"]`,
      `${SELECTORS.date.hour} [value="23"]`,
      `${SELECTORS.date.min} [value="59"]`,
    ].join(',')).prop('selected', true);
    $(`${SELECTORS.date.all} option[value="--"]`).remove();
    syncFields(Object.values(SELECTORS.date));

    /**
     * Advertise rows visibility and syncing
     */
    syncFields(SELECTORS.advertise);
    const rows = $('#advertise-selection tr:not(:first-child)');
    rows.hide();
    $(SELECTORS.agency).on('change', (event) => {
      rows.hide().prop('checked', false);
      const found = $(`${SELECTORS.advertise}[value="${event.target.value}"]`)
        .prop('checked', true);
      found.closest('tr').show();
      if (!found.length) {
        // make sure central checked
        $(`${SELECTORS.advertise}[value="WoG"]`).prop('checked', true)
      }
    });
    
    // Manually sync link {name, url} based on position and rtfid values
    const linkName = $(SELECTORS.link.name);
    const linkUrl = $(SELECTORS.link.url);
    $('body').on('input', SELECTORS.position, (event) => {
      linkName.val(event.target.value);
    });
    $(SELECTORS.rtfid).on('input', (event) => {
      const value = event.target.value;
      const url = value
            ? 'https://jobs.nt.gov.au/Home/JobDetails?rtfId=' + value
            : '';
      // future validate? prefill?
      linkUrl.val(url);
    });

    /**
     * SYNC VALUES BETWEEN IDENTICAL FIELDS
     */
    let lastSyncMatch;
    $('body').on('change input', (event) => {
      const { target } = event;
      if (!$(target).parents(`[id="${activeWrapper.id}"]`).length) {
        console.log('skip sync');
        return;
      }
      console.log('DEBUG sync', lastSyncMatch, target);
      let registered, matchedSelector;
      for (const selector of syncRegistry) {
        registered = $(target.closest(selector));
        if (registered[0] === target) {
          matchedSelector = selector;
          break;
        }
      }

      if (!matchedSelector) return;
      if (matchedSelector === lastSyncMatch) {
        console.log('DEBUG dont');
        return;
      }
      lastSyncMatch = matchedSelector;
      
      if (registered.is('select, input:not([type="checkbox"])')) {
        const others = $(matchedSelector).not(registered);
        others.val(registered.val());
      } else if (registered.is('[type="checkbox')) {
        const others = $(`${matchedSelector}[value="${registered.val()}"]`).not(registered);
        others.prop('checked', registered.is(':checked'));
      }
    });

    let validationTimer;
    $('form[id^="page_asset_builder"]').on('change input', (event) => {
      clearTimeout(validationTimer);
      validationTimer = setTimeout(() => validate(event), 500);
    });

    function validate(event) {
      console.log('DEBUG validate');
      const { target } = event;
      const errors = [];
      const activeTabId = $('.sq-asset-builder-tab-active').attr('id');
      const assetType = activeTabId.match(/type_([a-z_]+)_tab/)?.[1];
      
      /**
       * The asset type requirements
       */
      switch (assetType) {
        case 'link':
          {
            /**
             * Note: the asset name and url is set in the hidden fields
             */
            const rtfid =  $(SELECTORS.rtfid);
            if (!target || [...rtfid].includes(target)) {
              const val = rtfid.val();
              rtfid.removeClass('error');
              if (!val || val.length !== 6 || isNaN(val))  {
                rtfid.addClass('error');
                errors.push(
                  'Jobs NT id must be a 6 digit number'
                );
              }
            }
          }
          break;
        case 'word_doc':
          {
            const file = $(SELECTORS.file);
            if (!target || [...file].includes(target)) {
              file.removeClass('ntgc-file--error');
              if (!file?.[0]?.files?.length) {
                file.addClass('ntgc-file--error');
                errors.push('file required');
              }
            }
          }
          break;
      }

      /**
       * Position
       */
      const position = $(SELECTORS.position);
      
      if (!target || [...position].includes(target)) {
        position.removeClass('error');
        if (!position.val().trim()) {
          position.addClass('error');
          errors.push('position required');
        }
      }

      /**
       * Designation
       */
      const designation = $(SELECTORS.designation);
      if (!target || [...designation].includes(target)) {
        designation.removeClass('error');
        if (!designation.length) {
          designation.addClass('error');
          errors.push('designation required');
        }
      }

      /**
       * Closing date
       */
      if (!target || target.closest('.sq-metadata-date-wrapper')) {
        const day = $(SELECTORS.date.day);
        const month = $(SELECTORS.date.month);
        const year = $(SELECTORS.date.year);
        const selectedDate = new Date(day.val(), month.val() + 1, year.val());
        const today = new Date();
        today.setHours(0,0,0,0);
        const all = $('.sq-metadata-date-wrapper select').removeClass('ngtc-date--error');
        if (isNaN(selectedDate) || countWorkingDays(today, selectedDate) < 3) {
          
          all.addClass('ntgc-date--error');
          errors.push('closing date required');
        }
      }

      /**
       * Display errors?
       */
      if (errors.length) {
        // console.error('TODO', errors);
      }

      submitButtons.prop('disabled', errors.length);
    }
  }

  function serverErrorChecks() {
    
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

  /**
   * DEPRECATED
   * `$('body').on('change', SELECTORS.advertise, validateCheckboxes);`
   * this is redundant becaus ethe display logic enforces state

  const MSG_WOG_CHECKED_MAX_2 = 'You can only select NTG Central and one other advertise.';
  const MSG_WOG_UNCHECKED_MAX_1 = 'You can only select one advertise.';
  const MSG_NO_advertise_CHECKED = 'Please select NTG Central or one advertise.';

  function validateCheckboxes(event) {
      const { target } = event;
      const parent = event.target.closest('#advertise-selection');
      const checked = $(SELECTORS.advertise + ':checked', parent);
      const wogChecked = checked.filter('[value="WoG"]').length;
      const { length } = checked;
      const msg = wogChecked && length > 2
            ? MSG_WOG_CHECKED_MAX_2
            : !wogChecked && length > 1
            ? MSG_WOG_UNCHECKED_MAX_1
            : MSG_NO_advertise_CHECKED;

      if ([MSG_WOG_CHECKED_MAX_2, MSG_WOG_UNCHECKED_MAX_1].includes(msg)) {
        $(target).prop('checked', false);
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      console.log(msg);
  }
      */

  
})(jQuery);