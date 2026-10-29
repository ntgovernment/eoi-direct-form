const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

function loadVariant(filename, fields) {
  let variant;
  const context = {
    URL,
    window: { EoiForm: { registerVariant(config) { variant = config; } } },
    $(selector) {
      assert.ok(fields[selector], `Unexpected selector: ${selector}`);
      return fields[selector];
    },
  };
  vm.runInNewContext(readFileSync(join(__dirname, filename), "utf8"), context);
  return variant;
}

function field(value = "") {
  return {
    value,
    val() { return this.value; },
    toggle(visible) { this.visible = visible; },
    toggleClass(name, enabled) { this.error = enabled; },
    on(events, handler) { this.events = events; this.handler = handler; },
  };
}

function loadSharedDateHelpers() {
  const context = {
    window: {},
    document: { addEventListener() {} },
    $() { return { ready() {} }; },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(join(__dirname, "eoi-form.js"), "utf8"), context);
  return context;
}

for (const scenario of [
  { day: 26, hour: 11, minute: 59, days: 2, expected: [2026, 10, 28] },
  { day: 26, hour: 12, minute: 0, days: 3, expected: [2026, 10, 29] },
  { day: 26, hour: 12, minute: 1, days: 3, expected: [2026, 10, 29] },
  { day: 30, hour: 11, minute: 59, days: 2, expected: [2026, 11, 3] },
  { day: 30, hour: 12, minute: 0, days: 3, expected: [2026, 11, 4] },
]) {
  test(`closing date on October ${scenario.day} at ${scenario.hour}:${scenario.minute} adds ${scenario.days} working days`, () => {
    const helpers = loadSharedDateHelpers();
    const now = new Date(2026, 9, scenario.day, scenario.hour, scenario.minute);
    const minimumDays = helpers.getMinimumCloseDateWorkingDays(now);
    assert.equal(minimumDays, scenario.days);
    const closeDate = helpers.addWorkingDays(now, minimumDays);
    assert.deepEqual(
      [closeDate.getFullYear(), closeDate.getMonth() + 1, closeDate.getDate()],
      scenario.expected,
    );
    assert.equal(helpers.isCloseDateValid(closeDate, now), true);
    const earlierDate = new Date(closeDate);
    earlierDate.setDate(earlierDate.getDate() - 1);
    assert.equal(helpers.isCloseDateValid(earlierDate, now), false);
    assert.equal(now.getDate(), scenario.day);
  });
}

test("document variant requires an attachment and responds to file changes", () => {
  const input = field();
  input[0] = { files: [] };
  const warning = field();
  const variant = loadVariant("eoi-form-doc.js", {
    "input[name='word_doc_0']": input,
    "#documentation-warning": warning,
  });
  assert.equal(variant.validate(), false);
  assert.equal(warning.visible, true);
  assert.equal(input.error, true);
  input[0].files.push({ name: "description.docx" });
  assert.equal(variant.validate(), true);
  assert.equal(warning.visible, false);
  assert.equal(input.error, false);
  const update = () => {};
  variant.setup(update);
  assert.equal(input.events, "change");
  assert.equal(input.handler, update);
});

test("document variant fails closed when the file field is missing", () => {
  const variant = loadVariant("eoi-form-doc.js", {
    "input[name='word_doc_0']": field(),
    "#documentation-warning": field(),
  });
  assert.equal(variant.validate(), false);
});

test("link variant validates URLs without accessing a file field", () => {
  const input = field();
  const warning = field();
  const variant = loadVariant("eoi-form-link.js", {
    "#link_0_207": input,
    "#link-warning": warning,
  });
  for (const value of ["", "   ", "not a URL", "/relative", "javascript:alert(1)", "ftp://jobs.nt.gov.au"]) {
    input.value = value;
    assert.equal(variant.validate(), false, value);
    assert.equal(warning.visible, true);
    assert.equal(input.error, true);
  }
  for (const value of ["https://jobs.nt.gov.au/Home/JobDetails?rtfId=123456", " http://jobs.nt.gov.au/ "]) {
    input.value = value;
    assert.equal(variant.validate(), true, value);
    assert.equal(warning.visible, false);
    assert.equal(input.error, false);
  }
  const update = () => {};
  variant.setup(update);
  assert.equal(input.events, "input change");
  assert.equal(input.handler, update);
});