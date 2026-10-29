window.EoiForm.registerVariant({
  setup(updateSubmitButton) {
    $("#link_0_207").on("input change", updateSubmitButton);
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