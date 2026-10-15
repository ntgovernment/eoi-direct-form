const SELECTORS = {
  wrappers: '.sq-asset-builder-tab-content',
  closingDate: {
    year: '[id^="metadata_field_date_445509"][id$="_datetimevalue_y"]',
    month: '[id^="metadata_field_date_445509"][id$="_datetimevalue_m"]',
    day: '[id^="metadata_field_date_445509"][id$="_datetimevalue_d"]',
    hour: '[id^="metadata_field_date_445509"][id$="_datetimevalue_h"]',
    min: '[id^="metadata_field_date_445509"][id$="_datetimevalue_i"]',
  },
  visibleClosingDate: '.sq-metadata-date-wrapper select:visible',
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
  rtfid: 'Jobs NT id is required and must be a 6 digit number.',
  file: 'A Word document job description must be attached.',
  position: 'Position title is required.',
  designation: 'Please select at least one designation.',
  visibleClosingDate: `The selected close date is less than 3 business days from today. 
        <br>An EOI must be advertised for at least 3 business days.`,
  duration: 'Vacancy duration is required.',
  agency: 'Please select at an agency.',
  location: 'Please select at least one location.'
};

const ADVERTISE_STATE_MESSAGES = {
  centralOnly: `The selected agency does not have a dedicated intranet listing. 
             <br>This EOI will be published on NTG Central only.`,
  centralAndAgency: `The EOI will be advertised on the agency intranet and NTG Central
             <br>Untick NTG Central to advertise only on the agency intranet.`,
  centralOnlyAgencyAvailable: 'This EOI will be published on NTG Central only.',
  agencyOnly: 'The EOI will be advertised on the agency intranet.'
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

    let errors = []; // live errors
    let validateHasEverRan;
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
        sessionStorage.setItem('eoi-tab', `#${activeWrapper.id}_tab a`);
        // revalidate when switching tabs
        if (validateHasEverRan) validate();
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
      submitButtons.on('click', () => {
        $(this).attr('disabled', true).html(`
          Submitting...please wait
          <i class="fas fa-spinner-third fa-spin" style="margin-left: 8px"></i>
        `);
      });
    }

    $(SELECTORS.file).attr('accept', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword');

    let syncRegistry = new Set();
    function syncFields(selectors = []) {
      if (typeof selectors === 'string') selectors = [selectors];
      syncRegistry = new Set([...syncRegistry, ...selectors]);
    }

    syncFields([
      SELECTORS.designation,
      SELECTORS.duration,
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
    const closeDate = addWorkingDays(
      today,
      getMinimumCloseDateWorkingDays(today),
    );
    // the complex selectors will find for both contexts
    // ie [wrapers.length] times duplicates and set them
    $([
      `${SELECTORS.closingDate.day} [value="${ closeDate.getDate() }"]`,
      `${SELECTORS.closingDate.month} [value="${ closeDate.getMonth() + 1 }"]`,
      `${SELECTORS.closingDate.year} [value="${ closeDate.getFullYear() }"]`,
      `${SELECTORS.closingDate.hour} [value="23"]`,
      `${SELECTORS.closingDate.min} [value="45"]`,
    ].join(',')).prop('selected', true);
    $('.sq-metadata-date-wrapper option[value="--"]').remove();
    const hourMinSelector = [SELECTORS.closingDate.hour, SELECTORS.closingDate.min].join(',');
    $(hourMinSelector).hide();
    syncFields(Object.values(SELECTORS.closingDate));

    /**
     * Advertise rows visibility and syncing and Agency
     */
    syncFields([SELECTORS.agency, SELECTORS.advertise]);
    const rows = $('#advertise-selection tr:not(:first-child)').hide();
    const advertiseTip = $('.advertise-tip');
    const handleAdvertise = (event) => {
      const { target } = event;
      const advertise = $(SELECTORS.advertise + ':visible', activeWrapper);
      const advertiseUnchecked = advertise.not(':checked');
      const length = advertise.length - advertiseUnchecked.length;
      let tipKey;
      switch (length) {
        case 0:
          // enforce NTG central ticked if its the only checkbox
          $(`${SELECTORS.advertise}[value="WoG"]`).prop('checked', true);
          tipKey = 'centralOnly';
          break;
        case 1:
          tipKey = advertiseUnchecked.is('[value="WoG"]') ? 'agencyOnly' : 'centralOnlyAgencyAvailable'
          break
        case 2:
          tipKey = 'centralAndAgency';
          break;
      }
      advertiseTip.html(ADVERTISE_STATE_MESSAGES[tipKey]);
    };
    const handleAgency = (event) => {
      rows.hide().prop('checked', false);
      const found = $(`${SELECTORS.advertise}[value="${event.target.value}"]`)
        .prop('checked', true);
      found.closest('tr').show();
      handleAdvertise(event);
    };
    $(SELECTORS.agency).on('change', handleAgency);
    $(SELECTORS.advertise).on('change', handleAdvertise);
    // init agency/advertise state
    handleAgency({target: $(SELECTORS.agency + ':visible', activeWrapper)[0]});
    
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
    .on('change input', (event) => {
      const {type} = event;
      clearTimeout(validationTimer);
      validationTimer = setTimeout(() => validate(event), type === 'input' ? 500 : 0);
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

      validateHasEverRan = true;
      errors = [];
      
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
            setError('rtfid', rtfid, {
              valid: val && val.length === 6 && !isNaN(val),
              inline: !target || rtfid[0] === target
            });
          }
          break;
        case 'word_doc':
          {
            const file = $(SELECTORS.file);
            setError('file', file, {
              valid: file?.[0]?.files?.length,
              inline: !target || file[0] === target
            });
          }
          break;
      }
      
      /**
       * Position
       */
      const position = $(SELECTORS.position, activeWrapper);
      setError('position', position, {
        valid: position.val().trim(),
        inline: !target || position[0] === target
      });
      

      /**
       * Designation
       */
      const designation = $(SELECTORS.designation, activeWrapper);
      setError('designation', designation, {
        valid: designation.val().length,
        inline: !target || designation[0] === target
      })

      /**
       * Closing date
       */
      const day = $(SELECTORS.closingDate.day, activeWrapper);
      const month = $(SELECTORS.closingDate.month, activeWrapper);
      const year = $(SELECTORS.closingDate.year, activeWrapper);
      const selectedDate = new Date(
        parseInt(year.val()), 
        parseInt(month.val()) - 1,
        parseInt(day.val())
      );
      selectedDate.setHours(23,45,0,0);
      const today = new Date();
      const dayOffset = today.getHours() > 11 ? 3 : 2;
      setError(
        'visibleClosingDate', // all the visible selects 
        day, // wwe only need one of them for this
        {
          valid: !isNaN(selectedDate) && isCloseDateValid(selectedDate, today),
          inline: !target || target.closest('.sq-metadata-date-wrapper')
        }
      )

      /**
       * Duration
       */
      const duration = $(SELECTORS.duration, activeWrapper);
      setError('duration', duration, {
        valid: duration.val().trim(),
        inline: !target || duration[0] === target
      });
      
      /**
       * Agency
       */
      const agency = $(SELECTORS.agency, activeWrapper);
      const agencyS = $(SELECTORS.agency);
      setError('agency', agency, {
        valid: agency.val().trim(),
        inline: !target || agency[0] === target
      });

      /**
       * Location
       */
      const location = $(SELECTORS.location, activeWrapper);
      const locationS = $(SELECTORS.location);
      setError('location', location, {
        valid: location.val().length,
        inline: !target || location[0] === target
      });

      /**
       * Advertise
       * No validation, its state are enforced in enhancement above
       */

      /**
       * Submit buttons state
       */
      submitButtons.prop('disabled', errors.length);

      /**
       * If there is a target sync fields
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
       * Display errors at top?
       */
      if (errors.length) {
        console.error(errors);
      } else {
        console.log('valid');
        $('.ntgc-form-alerts.ntgc-form-alerts--error').hide();
      }
    }

    function setError(name, field, {valid, inline}) {
      const multiples = $(SELECTORS[name]);
      if (valid) {
        multiples.removeClass('--error');
        inlineError(field, '');
        return;
      }
      const msg = ERRORS[name];
      errors.push(msg);
      if (inline) {
        multiples.addClass('--error');
        inlineError(field, msg);
      }
    }

    const inlineErrors = new Map();
    function inlineError(field, msg) {
      const rawField = $(field)[0];
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

    const serverErrorDiv = $('.ntgc-form-alerts.ntgc-form-alerts--error');
    // Check if the div exists and contains the specific error message
    const hasServerError = serverErrorDiv.length && serverErrorDiv.data('error-text');
    if (hasServerError) {
        const errorMessage = serverErrorDiv.data('error-text');
        // Log the error message to the console
        console.log('Error message found:', errorMessage);
        // Update the alert message content
        serverErrorDiv.html(`
            <p>The internal vacancy was not created. Ensure you have entered all required information and try again.</p>
        `);
        serverErrorDiv.show();
        // Scroll to the error message
        $("html, body").animate({
            scrollTop: serverErrorDiv.offset().top
        }, 500);
        $(sessionStorage.getItem('eoi-tab')).trigger('click');
        validate();
    } else {
      sessionStorage.removeItem('eoi-tab');
    }
  }

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

function getMinimumCloseDateWorkingDays(date) {
  return date.getHours() < 12 ? 2 : 3;
}

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

/**
 * @param {Date} selectedDate
 * @param {Date} now
 * @returns {boolean}
 */
function isCloseDateValid(selectedDate, now) {
  return (
    countWorkingDays(now, selectedDate) >=
    getMinimumCloseDateWorkingDays(now)
  );
}

  
})(jQuery);