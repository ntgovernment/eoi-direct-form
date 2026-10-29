window.EoiForm.registerVariant({
  setup(updateSubmitButton) {
    const linkInput = $("#link_0_207");
    const linkName = $("#link_0_206");
    const designation = $("#metadata_field_select_445634");
    const positionTitle = $("#metadata_field_text_445504_value");
    const agency = $("#metadata_field_select_445640");

    const syncLinkName = () => {
      let rtfId = "";
      try {
        rtfId = new URL(linkInput.val().trim()).searchParams.get("rtfId")?.trim() || "";
      } catch {
        // An invalid or incomplete URL has no usable rtfId yet.
      }

      const designationValues = Array.isArray(designation.val())
        ? designation.val()
        : [designation.val()];
      const designationValue = designationValues
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(" ");
      const parts = [
        rtfId ? `RTF ${rtfId}` : "",
        designationValue,
        String(positionTitle.val() ?? "").trim(),
        String(agency.val() ?? "").trim(),
      ].filter(Boolean);

      linkName.val(parts.join(" "));
    };

    linkInput.on("input change", updateSubmitButton);
    linkInput.on("input change", syncLinkName);
    designation.on("change", syncLinkName);
    positionTitle.on("input change", syncLinkName);
    agency.on("change", syncLinkName);
    syncLinkName();
  },
  validate() {
    const linkInput = $("#link_0_207");
    let valid = false;
    try {
      const url = new URL(linkInput.val().trim());
      valid = url.protocol === "https:" || url.protocol === "http:";
    } catch {
      valid = false;
    }
    $("#link-warning").toggle(!valid);
    linkInput.toggleClass("ntgc-select--error", !valid);
    return valid;
  },
});