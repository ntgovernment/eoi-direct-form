document.addEventListener("DOMContentLoaded", function () {
  const commitButton = document.getElementById("sq_commit_button");

  $(commitButton).prop("value", "Submit");

  if (commitButton) {
    // Remove the inline onclick handler
    commitButton.removeAttribute("onclick");

    commitButton.addEventListener("click", function (event) {
      // Prevent the default action
      event.preventDefault();

      // Collect all required fields
      const requiredFields = [
        { id: "metadata_field_select_445634", name: "Designation" },
        { id: "metadata_field_text_445506_value", name: "Duration" },
        { id: "metadata_field_select_445640", name: "Agency" },
        { name: "Advertise" }, // Handle checkbox group separately
      ];

      let allFilled = true;

      // Check each required field
      requiredFields.forEach((field) => {
        if (field.id) {
          const element = document.getElementById(field.id); // Get the element by ID
          if (element) {
            // Validate text input fields
            if (element.type === "text" && !element.value.trim()) {
              allFilled = false;
              element.classList.add("error");
              console.log(`${field.name} (${field.id}) is empty`); // Debugging output
            }
            // Validate select elements
            else if (element.tagName === "SELECT" && !element.value) {
              allFilled = false;
              element.classList.add("error");
              console.log(`${field.name} (${field.id}) is not selected`); // Debugging output
            } else {
              element.classList.remove("error"); // Clear error styling if filled
            }
          } else {
            console.error(
              `Required field '${field.name}' (${field.id}) is missing in the DOM.`,
            ); // Detailed error message
            allFilled = false; // Treat as not filled if null
          }
        } else {
          // Handle the "Advertise" checkbox group
          const checkboxes = document.querySelectorAll(
            'input[name^="metadata_field_select_446182"]',
          );
          const isChecked = Array.from(checkboxes).some(
            (checkbox) => checkbox.checked,
          );
          if (!isChecked) {
            allFilled = false;
            console.log(`${field.name} is not selected`); // Debugging output
          }
        }
      });

      console.log(`All fields filled: ${allFilled}`); // Debugging output

      // Conditional form submission based on validation
      if (!allFilled) {
        // alert('Please fill in all mandatory fields.'); // Alert for user feedback

        // Error message handling
        const errorDiv = $(".ntgc-form-alerts.ntgc-form-alerts--error");

        // Check if the div exists
        if (errorDiv.length) {
          // Remove 'display: none;' if it exists
          errorDiv.css("display", "block");

          // Update the alert message content
          errorDiv.html(`
                        <div style="width: 100%; color: var(--clr-status-danger, #A60F37); font-size: 14px; font-family: Roboto; font-weight: 400; line-height: 20px; word-wrap: break-word">The internal vacancy was not created. Ensure you have entered all required information and try again.</div>
                    `);

          // Scroll to the error message
          $("html, body").animate(
            {
              scrollTop: errorDiv.offset().top,
            },
            500,
          );
        }

        return; // Prevent further code execution
      } else {
        console.log("Submitting the form..."); // Debugging output

        // Change button text to "Saving..."
        $("#sq_commit_button").attr("value", "Saving...");

        // Check if submit_form function is defined and handle submission
        if (typeof submit_form === "function") {
          this.form.sq_committing.value = 1; // Set value if needed
          submit_form(this.form, true); // Call submit_form
        } else {
          this.form.submit(); // Default form submission
        }
      }
    });
  } else {
    console.error("Commit button not found in the DOM.");
  }
});

function addWorkingDays(date, days) {
  let result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    // Check if it's a weekday (Monday to Friday)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      count++;
    }
  }
  return result;
}

$(document).ready(function () {
  var agency = $("#metadata_field_select_445640");
  var sites = $("#advertise-selection table input");
  var siteRows = $("#advertise-selection table tr");
  // console.log(`${$(sites).length} ${$(siteRows).length}`)

  var ntgcId = "metadata_field_select_446182_WoG";
  const today = new Date();
  const closeDate = new Date(
    today.setDate(today.getDate() + (today.getDay() < 3 ? 3 : 5)),
  );
  var monthNames = [];

  $("#metadata_field_date_445509_datetimevalue_m option").each(function () {
    monthNames.push($(this).html());
  });

  // console.log(monthNames)

  // console.log(`${closeDate.getDate()} ${monthNames[closeDate.getMonth() + 1]} ${closeDate.getFullYear()}`)

  $(
    "#metadata_field_date_445509_datetimevalue_d option:eq(" +
      closeDate.getDate() +
      ")",
  ).prop("selected", true);
  // $('#metadata_field_date_445509_datetimevalue_m option:eq('+ monthNames[closeDate.getMonth() + 1] +')').prop('selected', true);
  $("#metadata_field_date_445509_datetimevalue_m").val(
    closeDate.getMonth() + 1,
  );
  $(
    "#metadata_field_date_445509_datetimevalue_y option:eq(" +
      closeDate.getFullYear() +
      ")",
  ).prop("selected", true);
  $("#metadata_field_date_445509_datetimevalue_h option:eq(23)").prop(
    "selected",
    true,
  );
  $("#metadata_field_date_445509_datetimevalue_i option:eq(45)").prop(
    "selected",
    true,
  );

  $(siteRows).hide();
  $(siteRows[0]).show();

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
      // console.log('Publish on NTGC')
      $(`#${ntgcId}`).prop("checked", true);
    } else {
      $(agencyId).prop("checked", true);
      $(agencyId).show();
    }
  });

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

  function checkCloseDateWarning() {
    var d = $("#metadata_field_date_445509_datetimevalue_d").val();
    var m = $("#metadata_field_date_445509_datetimevalue_m").val();
    var y = $("#metadata_field_date_445509_datetimevalue_y").val();
    var warning = $("#date-close-warning");
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

  // Run on page load in case pre-populated date is < 3 working days
  checkCloseDateWarning();
});
