const SELECTORS = {
  wrappers: '.sq-asset-builder-tab-content',
  closingDate: {
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

const ERRORS = {
  rtfid: 'Jobs NT id is required and must be a 6 digit number',
  file: 'A Word document job description must be attached.',
  position: 'Position title is required.',
  designation: 'Please select at least one designation.',
  closingDate: `The selected close date is less than 3 business days from today. 
        An EOI must be advertised for at least 3 business days.`,
  duration: 'Vacancy duration is required.',
  agency: 'Please select at an agency.',
  location: 'Please select at least one location.'
};

const ADVERTISE_STATE_MESSAGES = {
  centralOnly: `The selected agency does not have a dedicated intranet listing. 
             This EOI will be published on NTG Central only.`,
  centralAndAgency: `The EOI will be advertised on the agency intranet and NTG Central
             Untick NTG Central to advertise only on the agency intranet.`,
  agencyOnly: 'The EOI will be advertised on the agency intranet'
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
    let assetType = activeWrapper.id.match(/type_([a-z_]+)$/)?.[1];
    const observer = new MutationObserver((mutations) => {
      const newActive = mutations.filter((mutation) => (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'style' &&
        mutation.target.style.display !== 'none'
      ))?.[0]?.target;
      if (newActive && newActive !== activeWrapper) {
        activeWrapper = newActive;
        assetType = activeWrapper.id.match(/type_([a-z_]+)$/)?.[1];
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
      // submitButton.disabled = true;
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
      `${SELECTORS.closingDate.day} [value="${ closeDate.getDate() }"]`,
      `${SELECTORS.closingDate.month} [value="${ closeDate.getMonth() + 1 }"]`,
      `${SELECTORS.closingDate.year} [value="${ closeDate.getFullYear() }"]`,
      `${SELECTORS.closingDate.hour} [value="23"]`,
      `${SELECTORS.closingDate.min} [value="59"]`,
    ].join(',')).prop('selected', true);
    $('.sq-metadata-date-wrapper option[value="--"]').remove();
    syncFields(Object.values(SELECTORS.closingDate));

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
    const linkName = $(SELECTORS.link.name).attr('required', null);
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

    /** TODO
     * Pre fill duration
     */
    // on change of closing dat if duration empty
    // on blur of duration if empty



    let validationTimer;
    $('form[id^="page_asset_builder"]')
    .on('change input submit', (event) => {
      console.log(event.type);
      if (event.type === 'submit') event.preventDefault();
      clearTimeout(validationTimer);
      validationTimer = setTimeout(() => validate(event), 500);
    })
    .attr('onsubmit', null);

    function validate(event = {}) {
      let { target, type: eventType } = event;
      if (eventType === 'submit') {
        // for form submit just act like theres no target
        // which will run all
        target = null;
      }
      if (target && !$(target).parents(`[id="${activeWrapper.id}"]`).length) {
        // skip events triggered by syncing other wrapper fields
        return;
      }
      
      const errors = [];
      
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
            const val = rtfid.val();
            rtfid.removeClass('--error');
            inlineError(rtfid[0], '');
            if (!val || val.length !== 6 || isNaN(val))  {
              if (!target || rtfid[0] === target) {
                rtfid.addClass('--error');
                inlineError(rtfid[0], ERRORS.rtfid);
              }
              errors.push(ERRORS.rtfid);
            }
          }
          break;
        case 'word_doc':
          {
            const file = $(SELECTORS.file);
            file.removeClass('--error');
            inlineError(file[0], '');
            if (!file?.[0]?.files?.length) {
              if (!target || file[0] === target) {
                file.addClass('--error');
                inlineError(file[0], ERRORS.file);
              }
              errors.push('file required');
            }
          }
          break;
      }
      
      /**
       * Position
       */
      const position = $(SELECTORS.position, activeWrapper);
      const positionS = $(SELECTORS.position);

      positionS.removeClass('--error');
      inlineError(position[0], '');
      if (!position.val().trim()) {
        if (!target || position[0] === target) {
          positionS.addClass('--error'); 
          inlineError(position[0], ERRORS.position);
        }
        errors.push(ERRORS.position);
      }
      

      /**
       * Designation
       */
      const designation = $(SELECTORS.designation, activeWrapper);
      const designationS = $(SELECTORS.designation);
      
      designationS.removeClass('--error');
      inlineError(designation[0], '');
      if (!designation.val().length) {
        if (!target || designation[0] === target) {
          designationS.addClass('--error');
          inlineError(designation[0], ERRORS.designation);
        }
        errors.push('Designations');
      }

      /**
       * Closing date
       */
      const day = $(SELECTORS.closingDate.day, activeWrapper);
      const all = $('.sq-metadata-date-wrapper select').removeClass('--error');
      inlineError(day[0], '');
      if (!target || target.closest('.sq-metadata-date-wrapper')) {
        const month = $(SELECTORS.closingDate.month, activeWrapper);
        const year = $(SELECTORS.closingDate.year, activeWrapper);
        const selectedDate = new Date(
          parseInt(year.val()), 
          parseInt(month.val()) - 1,
          parseInt(day.val())
        );
        const today = new Date();
        today.setHours(0,0,0,0);
        if (isNaN(selectedDate) || countWorkingDays(today, selectedDate) < 3) {
          all.addClass('--error');
          inlineError(day[0], ERRORS.closingDate);
          errors.push('closing date required');
        }
      }

      /**
       * Duration
       */
      const duration = $(SELECTORS.duration, activeWrapper);
      const durationS = $(SELECTORS.duration);
      
      durationS.removeClass('--error');
      if (!duration.val().trim()) {
        if (!target || duration[0] === target) {
          durationS.addClass('--error');
        }
        errors.push('duration required');
      }

      /**
       * Agency
       */
      const agency = $(SELECTORS.agency, activeWrapper);
      const agencyS = $(SELECTORS.agency);
      
      agencyS.removeClass('--error');
      if (!agency.val().trim()) {
        if (!target || agency[0] === target) {
          agencyS.addClass('--error');
        }
        errors.push('agency required');
      }

      /**
       * Location
       */
      const location = $(SELECTORS.location, activeWrapper);
      const locationS = $(SELECTORS.location);
      
      locationS.removeClass('--error');
      if (!location.val().length) {
        if (!target || location[0] === target) {
          locationS.addClass('--error');
        }
        errors.push('location required');
      }

      /**
       * Advertise
       * This logic is weirder than the rest.
       * 
       * - Get the visible advertise from activeWrapper
       * - Get uncheched from those visible
       * - Get all from all wrappers to remove any error
       * - If visible - unchecked is 0
       *   - if target in visible
       *     - set error class on unchecked of all wrappers
       *   - add error
       * 
       * UPDATE:
       * Rather than having error we simply check ntg if none checked
       * TODO: lift this out of validatino completely and just have enhancement live
       */
      const advertise = $(SELECTORS.advertise + ':visible', activeWrapper);
      const advertiseUnchecked = advertise.not(':checked');
      const advertiseS = $(SELECTORS.advertise);
      // advertiseS.removeClass('--error'); // remove from all
      if (!(advertise.length - advertiseUnchecked.length)) {
        if (!target || [...advertise].includes(target)) {
          const uncheckedSelector = [...advertiseUnchecked]
            .map(i => `${SELECTORS.advertise}[value="${i.value}"]`);
          /**
           * No idea why but when we run the selector directly
           * jquery was only finding one at this time...
           * very odd, so using querySelectorAll to get them.
           */
          // $(document.querySelectorAll(uncheckedSelector)).addClass('--error');
          
          // UPDATE: just check ntg again
          $(`${SELECTORS.advertise}[value="WoG"]`).prop('checked', true)
        }
        // errors.push('advertise required');
      }


      /**
       * Submit buttons state
       */
      submitButtons.prop('disabled', errors.length);

      /**
       * sync fields to the other wrapper(s)
       */
      if (target) {
        let registered, matchedSelector;
        for (const selector of syncRegistry) {
          registered = $(target.closest(selector));
          if (registered[0] === target) {
            matchedSelector = selector;
            break;
          }
        }

        if (matchedSelector) {
          if (registered.is('select, input:not([type="checkbox"])')) {
            const others = $(matchedSelector).not(registered).eq(0);
            others.val(registered.val());
          } else if (registered.is('[type="checkbox')) {
            const others = $(`${matchedSelector}[value="${registered.val()}"]`).not(registered);
            others.prop('checked', registered.is(':checked'));
          }
        }
      }

      /**
       * Display errors?
       */
      if (errors.length) {
        console.error(errors);
      } else {
        console.log('valid');
        if (eventType === 'submit') form_on_submit();
      }
    }

    const inlineErrors = new Map();
    function inlineError(rawField, msg) {
      const containerChild = rawField.closest('.container > *');
     
      let displays = inlineErrors.get(containerChild);
      
      if (!displays) {
        displays = $('.inline-error', containerChild);
        const idParts = rawField.id.split(assetType);
        const selector = `[id^="${idParts.join('"][id$="')}"]`;
        const other = $(selector).not(rawField);
        let otherContainerChild;
        if (other.length) {
          otherContainerChild = other.closest('.container > *');
          displays = displays.add($('.inline-error', otherContainerChild));
        }
        inlineErrors.set(containerChild, displays);
        if (otherContainerChild) inlineErrors.set(otherContainerChild, displays);
      }
      
      console.log({msg, displays});
      if (msg) {
        displays.html(msg).show();
      } else {
        displays.hide();
      }
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