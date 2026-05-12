// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { context, token, actions } = await DA_SDK;

const pickerScreen = document.getElementById('picker-screen');
const inputScreen = document.getElementById('input-screen');
const optionsScreen = document.getElementById('options-screen');
const buttonScreen = document.getElementById('button-screen');
const buttonForm = document.getElementById('button-form');
const fragmentScreen = document.getElementById('fragment-screen');
const fragmentForm = document.getElementById('fragment-form');
const stepScreen = document.getElementById('step-screen');
const stepForm = document.getElementById('step-form');
const formScreen = document.getElementById('form-screen');
const formContainerForm = document.getElementById('form-container-form');
const inputForm = document.getElementById('input-form');
const optionsForm = document.getElementById('options-form');
const backBtn = document.getElementById('back-btn');
const cancelBtn = document.getElementById('cancel-btn');
const inputLabel = document.getElementById('input-label');
const inputName = document.getElementById('input-name');
const qparamToggle = document.getElementById('input-qparam-toggle');
const qparamGroup = document.getElementById('qparam-name-group');
const optionsSource = document.getElementById('options-source');
const optionsLocalGroup = document.getElementById('options-local-group');
const optionsDatasourceGroup = document.getElementById('options-datasource-group');
const optionsDatasourceType = document.getElementById('options-datasource-type');
const optionsRegionGroup = document.getElementById('options-region-group');
const optionsCustomUrlGroup = document.getElementById('options-custom-url-group');
const optionsRequired = document.getElementById('options-required');
const optionsRequiredMsgGroup = document.getElementById('options-required-msg-group');
const optionsLabel = document.getElementById('options-label');
const optionsName = document.getElementById('options-name');

let editMode = false;

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  screen.classList.add('active');
}

function buildBlockTable(blockName, fields) {
  const rows = fields
    .filter(([, value]) => value)
    .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
    .join('');
  return `<table><tr><th colspan="2">${blockName}</th></tr>${rows}</table>`;
}

// --- Input Field Logic ---

function autoGenerateName(labelEl, nameEl) {
  const label = labelEl.value.trim();
  if (label && !nameEl.dataset.manual) {
    nameEl.value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  }
}

// --- Rules Tab Logic ---
const ruleConditions = document.getElementById('rule-conditions');
const addRuleConditionBtn = document.getElementById('add-rule-condition');
const availableFields = [];

async function loadAvailableFields() {
  try {
    const { org, repo, path } = context;
    if (!path || !org || !repo) return;

    const url = `https://admin.da.live/source/${org}/${repo}${path}.html`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return;

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('div[class*="tfs2-form-"]').forEach((block) => {
      const rows = block.querySelectorAll(':scope > div');
      rows.forEach((row) => {
        const key = row.children[0]?.textContent?.trim();
        const val = row.children[1]?.textContent?.trim();
        if (key === 'name' && val && !availableFields.includes(val)) {
          availableFields.push(val);
        }
      });
    });
  } catch (err) {
    // Fallback — fields not available, text input shown instead
  }
}

function buildFieldDropdown() {
  let options = '<option value="">Select source field</option>';
  availableFields.forEach((name) => {
    options += `<option value="${name}">${name}</option>`;
  });
  options += '<option value="__custom__">Type custom name...</option>';
  return options;
}

function addRuleConditionRow(sourceField = '', operator = 'contains', value = '') {
  const row = document.createElement('div');
  row.className = 'rule-condition-row';

  if (availableFields.length > 0) {
    row.innerHTML = `
      <select class="rule-source-field">${buildFieldDropdown()}</select>
      <select class="rule-operator">
        <option value="contains"${operator === 'contains' ? ' selected' : ''}>contains</option>
        <option value="is-equal-to"${operator === 'is-equal-to' ? ' selected' : ''}>is equal to</option>
        <option value="is-not-equal-to"${operator === 'is-not-equal-to' ? ' selected' : ''}>is not equal to</option>
        <option value="starts-with"${operator === 'starts-with' ? ' selected' : ''}>starts with</option>
        <option value="is-empty"${operator === 'is-empty' ? ' selected' : ''}>is empty</option>
        <option value="is-not-empty"${operator === 'is-not-empty' ? ' selected' : ''}>is not empty</option>
      </select>
      <input type="text" class="rule-value" placeholder="Value" value="${value}">
      <button type="button" class="btn-remove-condition">&times;</button>
    `;

    const sourceSelect = row.querySelector('.rule-source-field');
    if (sourceField) {
      if ([...sourceSelect.options].some((o) => o.value === sourceField)) {
        sourceSelect.value = sourceField;
      } else {
        const customOpt = document.createElement('option');
        customOpt.value = sourceField;
        customOpt.textContent = sourceField;
        sourceSelect.insertBefore(customOpt, sourceSelect.lastElementChild);
        sourceSelect.value = sourceField;
      }
    }

    sourceSelect.addEventListener('change', () => {
      if (sourceSelect.value === '__custom__') {
        // eslint-disable-next-line no-alert
        const customName = prompt('Enter the source field name:');
        if (customName) {
          const opt = document.createElement('option');
          opt.value = customName;
          opt.textContent = customName;
          sourceSelect.insertBefore(opt, sourceSelect.lastElementChild);
          sourceSelect.value = customName;
        } else {
          sourceSelect.value = '';
        }
      }
    });
  } else {
    row.innerHTML = `
      <input type="text" class="rule-source-field" placeholder="Source field name" value="${sourceField}">
      <select class="rule-operator">
        <option value="contains"${operator === 'contains' ? ' selected' : ''}>contains</option>
        <option value="is-equal-to"${operator === 'is-equal-to' ? ' selected' : ''}>is equal to</option>
        <option value="is-not-equal-to"${operator === 'is-not-equal-to' ? ' selected' : ''}>is not equal to</option>
        <option value="starts-with"${operator === 'starts-with' ? ' selected' : ''}>starts with</option>
        <option value="is-empty"${operator === 'is-empty' ? ' selected' : ''}>is empty</option>
        <option value="is-not-empty"${operator === 'is-not-empty' ? ' selected' : ''}>is not empty</option>
      </select>
      <input type="text" class="rule-value" placeholder="Value" value="${value}">
      <button type="button" class="btn-remove-condition">&times;</button>
    `;
  }

  row.querySelector('.btn-remove-condition').addEventListener('click', () => row.remove());
  ruleConditions.appendChild(row);
}

addRuleConditionBtn.addEventListener('click', () => addRuleConditionRow());

// Load available fields on plugin init
loadAvailableFields();

function resetRuleFields() {
  ruleConditions.innerHTML = '';
  document.getElementById('rule-action').value = 'show';
  document.getElementById('rule-logic').value = 'any';
}

function collectRuleFields() {
  const fields = [];
  const ruleAction = document.getElementById('rule-action').value;
  const ruleLogic = document.getElementById('rule-logic').value;
  const conditionRows = ruleConditions.querySelectorAll('.rule-condition-row');

  if (conditionRows.length > 0) {
    const hasValidCondition = [...conditionRows].some((row) => row.querySelector('.rule-source-field').value);
    if (hasValidCondition) {
      fields.push(['rule-action', ruleAction]);
      fields.push(['rule-logic', ruleLogic]);
      conditionRows.forEach((row, i) => {
        const source = row.querySelector('.rule-source-field').value.trim();
        const op = row.querySelector('.rule-operator').value;
        const val = row.querySelector('.rule-value').value.trim();
        if (source) {
          fields.push([`rule-${i + 1}`, `${source}~${op}~${val}`]);
        }
      });
    }
  }
  return fields;
}

function populateRuleFields(config) {
  if (config['rule-action']) document.getElementById('rule-action').value = config['rule-action'];
  if (config['rule-logic']) document.getElementById('rule-logic').value = config['rule-logic'];
  let i = 1;
  while (config[`rule-${i}`]) {
    const parts = config[`rule-${i}`].split('~');
    const source = parts[0] || '';
    const op = parts[1] || 'contains';
    const val = parts.slice(2).join(':') || '';
    addRuleConditionRow(source, op, val);
    i += 1;
  }
}

function resetInputForm() {
  inputForm.reset();
  inputName.dataset.manual = '';
  editMode = false;
  qparamGroup.style.display = 'none';
  resetRuleFields();
  document.getElementById('submit-btn').textContent = 'Add to Page';
  inputScreen.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  inputScreen.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
}

function parseSelectionHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const firstRow = table.querySelector('tr');
  if (!firstRow) return null;

  const headerCell = firstRow.querySelector('td[colspan], th');
  const headerText = headerCell ? headerCell.textContent.trim() : '';

  let blockType = null;
  if (headerText === 'tfs2-form') blockType = 'form';
  else if (headerText.includes('tfs2-form-input')) blockType = 'input';
  else if (headerText.includes('tfs2-form-options')) blockType = 'options';
  else if (headerText.includes('tfs2-form-button')) blockType = 'button';
  else if (headerText.includes('tfs2-form-step')) blockType = 'step';
  else if (headerText.includes('tfs2-form-fragment')) blockType = 'fragment';
  if (!blockType) return null;

  const config = { blockType };
  const rows = table.querySelectorAll('tr');
  rows.forEach((row, index) => {
    if (index === 0) return;
    const cells = row.querySelectorAll('td');
    if (cells.length === 2) {
      const key = cells[0].textContent.trim();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

function populateInputForm(config) {
  if (config.label) inputLabel.value = config.label;
  if (config.type) document.getElementById('input-constraint').value = config.type;
  if (config.name) {
    inputName.value = config.name;
    inputName.dataset.manual = 'true';
  }
  if (config.placeholder) document.getElementById('input-placeholder').value = config.placeholder;
  if (config.value) document.getElementById('input-value').value = config.value;
  if (config.required === 'true') document.getElementById('input-required').checked = true;
  if (config.readonly === 'true') document.getElementById('input-readonly').checked = true;
  if (config['hide-title'] === 'true') document.getElementById('input-hide-title').checked = true;
  if (config['constraint-message']) document.getElementById('input-constraint-msg').value = config['constraint-message'];
  if (config.minlength) document.getElementById('input-minlength').value = config.minlength;
  if (config.maxlength) document.getElementById('input-maxlength').value = config.maxlength;
  if (config['multi-value'] === 'true') document.getElementById('input-multivalue').checked = true;
  if (config['confirmation-field'] === 'true') document.getElementById('input-confirmation').checked = true;
  if (config['query-param']) {
    qparamToggle.checked = true;
    qparamGroup.style.display = 'flex';
    document.getElementById('input-qparam').value = config['query-param'];
  }
  if (config['help-message']) document.getElementById('input-help').value = config['help-message'];
  if (config.id) document.getElementById('input-id').value = config.id;
  populateRuleFields(config);
}

// --- Options Field Logic ---

function addOptionRow(text = '', value = '') {
  const list = document.getElementById('options-list');
  const row = document.createElement('div');
  row.className = 'option-row';
  row.innerHTML = `
    <input type="text" placeholder="Display text" value="${text}">
    <input type="text" placeholder="Value" value="${value}">
    <button type="button" class="btn-remove-option">&times;</button>
  `;
  row.querySelector('.btn-remove-option').addEventListener('click', () => row.remove());
  list.appendChild(row);
}

function resetOptionsRuleFields() {
  document.getElementById('options-rule-conditions').innerHTML = '';
  document.getElementById('options-rule-action').value = 'show';
  document.getElementById('options-rule-logic').value = 'any';
}

function collectOptionsRuleFields() {
  const fields = [];
  const ruleAction = document.getElementById('options-rule-action').value;
  const ruleLogic = document.getElementById('options-rule-logic').value;
  const conditionRows = document.getElementById('options-rule-conditions').querySelectorAll('.rule-condition-row');

  if (conditionRows.length > 0) {
    const hasValid = [...conditionRows].some((row) => row.querySelector('.rule-source-field').value.trim());
    if (hasValid) {
      fields.push(['rule-action', ruleAction]);
      fields.push(['rule-logic', ruleLogic]);
      conditionRows.forEach((row, i) => {
        const source = row.querySelector('.rule-source-field').value.trim();
        const op = row.querySelector('.rule-operator').value;
        const val = row.querySelector('.rule-value').value.trim();
        if (source) {
          fields.push([`rule-${i + 1}`, `${source}~${op}~${val}`]);
        }
      });
    }
  }
  return fields;
}

function addOptionsRuleConditionRow(sourceField = '', operator = 'contains', value = '') {
  const container = document.getElementById('options-rule-conditions');
  const row = document.createElement('div');
  row.className = 'rule-condition-row';

  if (availableFields.length > 0) {
    row.innerHTML = `
      <select class="rule-source-field">${buildFieldDropdown()}</select>
      <select class="rule-operator">
        <option value="contains"${operator === 'contains' ? ' selected' : ''}>contains</option>
        <option value="is-equal-to"${operator === 'is-equal-to' ? ' selected' : ''}>is equal to</option>
        <option value="is-not-equal-to"${operator === 'is-not-equal-to' ? ' selected' : ''}>is not equal to</option>
        <option value="starts-with"${operator === 'starts-with' ? ' selected' : ''}>starts with</option>
        <option value="is-empty"${operator === 'is-empty' ? ' selected' : ''}>is empty</option>
        <option value="is-not-empty"${operator === 'is-not-empty' ? ' selected' : ''}>is not empty</option>
      </select>
      <input type="text" class="rule-value" placeholder="Value" value="${value}">
      <button type="button" class="btn-remove-condition">&times;</button>
    `;
    const sourceSelect = row.querySelector('.rule-source-field');
    if (sourceField && ![...sourceSelect.options].some((o) => o.value === sourceField)) {
      const customOpt = document.createElement('option');
      customOpt.value = sourceField;
      customOpt.textContent = sourceField;
      sourceSelect.insertBefore(customOpt, sourceSelect.lastElementChild);
    }
    if (sourceField) sourceSelect.value = sourceField;
  } else {
    row.innerHTML = `
      <input type="text" class="rule-source-field" placeholder="Source field name" value="${sourceField}">
      <select class="rule-operator">
        <option value="contains"${operator === 'contains' ? ' selected' : ''}>contains</option>
        <option value="is-equal-to"${operator === 'is-equal-to' ? ' selected' : ''}>is equal to</option>
        <option value="is-not-equal-to"${operator === 'is-not-equal-to' ? ' selected' : ''}>is not equal to</option>
        <option value="starts-with"${operator === 'starts-with' ? ' selected' : ''}>starts with</option>
        <option value="is-empty"${operator === 'is-empty' ? ' selected' : ''}>is empty</option>
        <option value="is-not-empty"${operator === 'is-not-empty' ? ' selected' : ''}>is not empty</option>
      </select>
      <input type="text" class="rule-value" placeholder="Value" value="${value}">
      <button type="button" class="btn-remove-condition">&times;</button>
    `;
  }

  row.querySelector('.btn-remove-condition').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function populateOptionsRuleFields(config) {
  if (config['rule-action']) document.getElementById('options-rule-action').value = config['rule-action'];
  if (config['rule-logic']) document.getElementById('options-rule-logic').value = config['rule-logic'];
  let i = 1;
  while (config[`rule-${i}`]) {
    const parts = config[`rule-${i}`].split('~');
    addOptionsRuleConditionRow(parts[0] || '', parts[1] || 'contains', parts.slice(2).join(':') || '');
    i += 1;
  }
}

function resetOptionsForm() {
  optionsForm.reset();
  optionsName.dataset.manual = '';
  editMode = false;
  document.getElementById('options-list').innerHTML = '';
  optionsLocalGroup.style.display = 'block';
  optionsDatasourceGroup.style.display = 'none';
  optionsRequiredMsgGroup.style.display = 'none';
  optionsRegionGroup.style.display = 'block';
  optionsCustomUrlGroup.style.display = 'none';
  resetOptionsRuleFields();
  document.getElementById('options-submit-btn').textContent = 'Add to Page';
  optionsScreen.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  optionsScreen.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
}

function populateOptionsForm(config) {
  if (config.label) optionsLabel.value = config.label;
  if (config.type) document.getElementById('options-type').value = config.type;
  if (config.name) {
    optionsName.value = config.name;
    optionsName.dataset.manual = 'true';
  }
  if (config.source) {
    optionsSource.value = config.source;
    if (config.source === 'datasource') {
      optionsLocalGroup.style.display = 'none';
      optionsDatasourceGroup.style.display = 'block';
    }
  }
  if (config['datasource-type']) {
    optionsDatasourceType.value = config['datasource-type'];
    if (config['datasource-type'] === 'custom') {
      optionsRegionGroup.style.display = 'none';
      optionsCustomUrlGroup.style.display = 'block';
    }
  }
  if (config['datasource-region']) document.getElementById('options-datasource-region').value = config['datasource-region'];
  if (config['datasource-url']) document.getElementById('options-datasource-url').value = config['datasource-url'];
  if (config.options) {
    config.options.split('|').forEach((opt) => {
      const parts = opt.split(',');
      addOptionRow(parts[0] || '', parts[1] || parts[0] || '');
    });
  }
  if (config.required === 'true') {
    optionsRequired.checked = true;
    optionsRequiredMsgGroup.style.display = 'block';
  }
  if (config['required-message']) document.getElementById('options-required-msg').value = config['required-message'];
  if (config['hide-title'] === 'true') document.getElementById('options-hide-title').checked = true;
  if (config['constraint-message']) document.getElementById('options-constraint-msg').value = config['constraint-message'];
  if (config.readonly === 'true') document.getElementById('options-readonly').checked = true;
  if (config['help-message']) document.getElementById('options-help').value = config['help-message'];
  if (config.placeholder) document.getElementById('options-placeholder').value = config.placeholder;
  if (config.id) document.getElementById('options-id').value = config.id;
  populateOptionsRuleFields(config);
}

// --- Form Container: Reset ---
function resetFormContainerForm() {
  formContainerForm.reset();
  editMode = false;
  document.getElementById('form-submit-btn').textContent = 'Add to Page';
}

// --- Form Container: Populate for edit ---
function populateFormContainerForm(config) {
  if (config.action) document.getElementById('form-action').value = config.action;
  if (config.thankyou) document.getElementById('form-thankyou').value = config.thankyou;
  if (config.method) document.getElementById('form-method').value = config.method;
  if (config.id) document.getElementById('form-id').value = config.id;
}

// --- Step: Reset ---
function resetStepForm() {
  stepForm.reset();
  editMode = false;
  document.getElementById('step-submit-btn').textContent = 'Add to Page';
}

// --- Step: Populate for edit ---
function populateStepForm(config) {
  if (config.title) document.getElementById('step-title').value = config.title;
  if (config.step) document.getElementById('step-number').value = config.step;
}

// --- Fragment: Reset ---
function resetFragmentForm() {
  fragmentForm.reset();
  editMode = false;
  document.getElementById('fragment-submit-btn').textContent = 'Add to Page';
}

// --- Fragment: Populate for edit ---
function populateFragmentForm(config) {
  if (config.path) document.getElementById('fragment-path').value = config.path;
}

// --- Button: Reset ---
function resetButtonForm() {
  buttonForm.reset();
  editMode = false;
  document.getElementById('button-submit-btn').textContent = 'Add to Page';
  buttonScreen.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  buttonScreen.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
}

// --- Button: Populate for edit ---
function populateButtonForm(config) {
  if (config.type) document.getElementById('button-type').value = config.type;
  if (config.label) document.getElementById('button-title').value = config.label;
  if (config.name) document.getElementById('button-name').value = config.name;
  if (config.value) document.getElementById('button-value').value = config.value;
  if (config.id) document.getElementById('button-id').value = config.id;
  if (config['error-message']) document.getElementById('button-error-msg').value = config['error-message'];
  if (config['server-error-message']) document.getElementById('button-server-error-msg').value = config['server-error-message'];
}

// --- Edit Mode ---

async function tryEditSelection() {
  try {
    const selection = await actions.getSelection();
    if (selection) {
      const config = parseSelectionHTML(selection);
      if (config) {
        editMode = true;
        if (config.blockType === 'input') {
          populateInputForm(config);
          document.getElementById('submit-btn').textContent = 'Update';
          showScreen(inputScreen);
        } else if (config.blockType === 'options') {
          populateOptionsForm(config);
          document.getElementById('options-submit-btn').textContent = 'Update';
          showScreen(optionsScreen);
        } else if (config.blockType === 'button') {
          populateButtonForm(config);
          document.getElementById('button-submit-btn').textContent = 'Update';
          showScreen(buttonScreen);
        } else if (config.blockType === 'step') {
          populateStepForm(config);
          document.getElementById('step-submit-btn').textContent = 'Update';
          showScreen(stepScreen);
        } else if (config.blockType === 'fragment') {
          populateFragmentForm(config);
          document.getElementById('fragment-submit-btn').textContent = 'Update';
          showScreen(fragmentScreen);
        } else if (config.blockType === 'form') {
          populateFormContainerForm(config);
          document.getElementById('form-submit-btn').textContent = 'Update';
          showScreen(formScreen);
        }
        return true;
      }
      const debugEl = document.getElementById('debug-output');
      if (debugEl) debugEl.textContent = `Got selection but couldn't parse: ${selection.substring(0, 500)}`;
    } else {
      const debugEl = document.getElementById('debug-output');
      if (debugEl) debugEl.textContent = 'No selection returned (empty)';
    }
  } catch (err) {
    const debugEl = document.getElementById('debug-output');
    if (debugEl) debugEl.textContent = `Error: ${err.message}`;
  }
  return false;
}

async function checkForEditMode() {
  const editBtn = document.getElementById('edit-selected-btn');
  editBtn.style.display = 'block';
  editBtn.addEventListener('click', async () => {
    const edited = await tryEditSelection();
    if (!edited) {
      const debugEl = document.getElementById('debug-output');
      if (!debugEl.textContent) {
        debugEl.textContent = 'Select a block table in the editor, then click here again';
      }
    }
  });
}

// (Rules logic moved above resetRuleFields)

// --- Tab switching (scoped) ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const { tab: tabName } = tab.dataset;
    const tabContainer = tab.closest('.screen') || document;
    tabContainer.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tabContainer.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    tabContainer.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
  });
});

// --- Field type picker ---
document.querySelectorAll('.field-type-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const { type } = btn.dataset;
    if (type === 'form') showScreen(formScreen);
    else if (type === 'input') showScreen(inputScreen);
    else if (type === 'options') showScreen(optionsScreen);
    else if (type === 'button') showScreen(buttonScreen);
    else if (type === 'step') showScreen(stepScreen);
    else if (type === 'fragment') showScreen(fragmentScreen);
  });
});

// --- Input: Auto-generate name ---
inputLabel.addEventListener('input', () => autoGenerateName(inputLabel, inputName));
inputName.addEventListener('input', () => { inputName.dataset.manual = 'true'; });

// --- Options: Auto-generate name ---
optionsLabel.addEventListener('input', () => autoGenerateName(optionsLabel, optionsName));
optionsName.addEventListener('input', () => { optionsName.dataset.manual = 'true'; });

// --- Input: Query param toggle ---
qparamToggle.addEventListener('change', () => {
  qparamGroup.style.display = qparamToggle.checked ? 'flex' : 'none';
});

// --- Options: Source toggle ---
optionsSource.addEventListener('change', () => {
  const isLocal = optionsSource.value === 'local';
  optionsLocalGroup.style.display = isLocal ? 'block' : 'none';
  optionsDatasourceGroup.style.display = isLocal ? 'none' : 'block';
});

// --- Options: Datasource type toggle ---
optionsDatasourceType.addEventListener('change', () => {
  const isCustom = optionsDatasourceType.value === 'custom';
  optionsRegionGroup.style.display = isCustom ? 'none' : 'block';
  optionsCustomUrlGroup.style.display = isCustom ? 'block' : 'none';
});

// --- Options: Required toggle ---
optionsRequired.addEventListener('change', () => {
  optionsRequiredMsgGroup.style.display = optionsRequired.checked ? 'block' : 'none';
});

// --- Options: Add option button ---
document.getElementById('add-option-btn').addEventListener('click', () => addOptionRow());
document.getElementById('add-options-rule-condition').addEventListener('click', () => addOptionsRuleConditionRow());

// --- Back/Cancel buttons ---
backBtn.addEventListener('click', () => { resetInputForm(); showScreen(pickerScreen); });
cancelBtn.addEventListener('click', () => { resetInputForm(); showScreen(pickerScreen); });
document.getElementById('options-back-btn').addEventListener('click', () => { resetOptionsForm(); showScreen(pickerScreen); });
document.getElementById('options-cancel-btn').addEventListener('click', () => { resetOptionsForm(); showScreen(pickerScreen); });

// --- Submit Input form ---
inputForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = [
    ['label', inputLabel.value.trim()],
    ['type', document.getElementById('input-constraint').value],
    ['name', inputName.value.trim()],
    ['placeholder', document.getElementById('input-placeholder').value.trim()],
    ['value', document.getElementById('input-value').value.trim()],
    ['required', document.getElementById('input-required').checked ? 'true' : ''],
    ['readonly', document.getElementById('input-readonly').checked ? 'true' : ''],
    ['hide-title', document.getElementById('input-hide-title').checked ? 'true' : ''],
    ['constraint-message', document.getElementById('input-constraint-msg').value.trim()],
    ['minlength', document.getElementById('input-minlength').value.trim()],
    ['maxlength', document.getElementById('input-maxlength').value.trim()],
    ['multi-value', document.getElementById('input-multivalue').checked ? 'true' : ''],
    ['confirmation-field', document.getElementById('input-confirmation').checked ? 'true' : ''],
    ['query-param', qparamToggle.checked ? document.getElementById('input-qparam').value.trim() : ''],
    ['help-message', document.getElementById('input-help').value.trim()],
    ['id', document.getElementById('input-id').value.trim()],
    ...collectRuleFields(),
  ];

  actions.sendHTML(buildBlockTable('tfs2-form-input', fields));
  if (editMode) actions.closeLibrary();
  resetInputForm();
  showScreen(pickerScreen);
});

// --- Submit Options form ---
optionsForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const source = optionsSource.value;
  let optionsValue = '';

  if (source === 'local') {
    const rows = document.querySelectorAll('#options-list .option-row');
    const opts = [];
    rows.forEach((row) => {
      const inputs = row.querySelectorAll('input[type="text"]');
      const text = inputs[0].value.trim();
      const val = inputs[1].value.trim() || text;
      if (text) opts.push(`${text},${val}`);
    });
    optionsValue = opts.join('|');
  }

  const fields = [
    ['label', optionsLabel.value.trim()],
    ['type', document.getElementById('options-type').value],
    ['name', optionsName.value.trim()],
    ['source', source],
    ['options', optionsValue],
    ['datasource-type', source === 'datasource' ? optionsDatasourceType.value : ''],
    ['datasource-region', source === 'datasource' && optionsDatasourceType.value !== 'custom' ? document.getElementById('options-datasource-region').value : ''],
    ['datasource-url', source === 'datasource' && optionsDatasourceType.value === 'custom' ? document.getElementById('options-datasource-url').value.trim() : ''],
    ['placeholder', document.getElementById('options-placeholder').value.trim()],
    ['required', optionsRequired.checked ? 'true' : ''],
    ['required-message', optionsRequired.checked ? document.getElementById('options-required-msg').value.trim() : ''],
    ['hide-title', document.getElementById('options-hide-title').checked ? 'true' : ''],
    ['constraint-message', document.getElementById('options-constraint-msg').value.trim()],
    ['readonly', document.getElementById('options-readonly').checked ? 'true' : ''],
    ['help-message', document.getElementById('options-help').value.trim()],
    ['id', document.getElementById('options-id').value.trim()],
    ...collectOptionsRuleFields(),
  ];

  actions.sendHTML(buildBlockTable('tfs2-form-options', fields));
  if (editMode) actions.closeLibrary();
  resetOptionsForm();
  showScreen(pickerScreen);
});

// --- Button: Back/Cancel ---
document.getElementById('button-back-btn').addEventListener('click', () => { resetButtonForm(); showScreen(pickerScreen); });
document.getElementById('button-cancel-btn').addEventListener('click', () => { resetButtonForm(); showScreen(pickerScreen); });

// --- Submit Button form ---
buttonForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = [
    ['label', document.getElementById('button-title').value.trim()],
    ['type', document.getElementById('button-type').value],
    ['name', document.getElementById('button-name').value.trim()],
    ['value', document.getElementById('button-value').value.trim()],
    ['id', document.getElementById('button-id').value.trim()],
    ['error-message', document.getElementById('button-error-msg').value.trim()],
    ['server-error-message', document.getElementById('button-server-error-msg').value.trim()],
  ];

  actions.sendHTML(buildBlockTable('tfs2-form-button', fields));
  if (editMode) actions.closeLibrary();
  resetButtonForm();
  showScreen(pickerScreen);
});

// --- Form Container: Back/Cancel ---
document.getElementById('form-back-btn').addEventListener('click', () => { resetFormContainerForm(); showScreen(pickerScreen); });
document.getElementById('form-cancel-btn').addEventListener('click', () => { resetFormContainerForm(); showScreen(pickerScreen); });

// --- Submit Form Container ---
formContainerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = [
    ['action', document.getElementById('form-action').value.trim()],
    ['thankyou', document.getElementById('form-thankyou').value.trim()],
    ['method', document.getElementById('form-method').value],
    ['id', document.getElementById('form-id').value.trim()],
  ];

  actions.sendHTML(buildBlockTable('tfs2-form', fields));
  if (editMode) actions.closeLibrary();
  resetFormContainerForm();
  showScreen(pickerScreen);
});

// --- Step: Back/Cancel ---
document.getElementById('step-back-btn').addEventListener('click', () => { resetStepForm(); showScreen(pickerScreen); });
document.getElementById('step-cancel-btn').addEventListener('click', () => { resetStepForm(); showScreen(pickerScreen); });

// --- Submit Step form ---
stepForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = [
    ['title', document.getElementById('step-title').value.trim()],
    ['step', document.getElementById('step-number').value.trim()],
  ];

  actions.sendHTML(buildBlockTable('tfs2-form-step', fields));
  if (editMode) actions.closeLibrary();
  resetStepForm();
  showScreen(pickerScreen);
});

// --- Fragment: Back/Cancel ---
document.getElementById('fragment-back-btn').addEventListener('click', () => { resetFragmentForm(); showScreen(pickerScreen); });
document.getElementById('fragment-cancel-btn').addEventListener('click', () => { resetFragmentForm(); showScreen(pickerScreen); });

// --- Submit Fragment form ---
fragmentForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = [
    ['path', document.getElementById('fragment-path').value.trim()],
  ];

  actions.sendHTML(buildBlockTable('tfs2-form-fragment', fields));
  if (editMode) actions.closeLibrary();
  resetFragmentForm();
  showScreen(pickerScreen);
});

// On plugin load — check if there's a selection to edit
checkForEditMode();
