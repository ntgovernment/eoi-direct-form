window.EoiForm.registerVariant({
  setup(updateSubmitButton) {
    $("input[name='word_doc_0']").on("change", updateSubmitButton);
  },
  validate() {
    const fileInput = $("input[name='word_doc_0']");
    const valid = !!fileInput[0]?.files?.length;
    $("#documentation-warning").toggle(!valid);
    fileInput.toggleClass("ntgc-file--error", !valid);
    return valid;
  },
});