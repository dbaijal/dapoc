// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { actions } = await DA_SDK;

const pickerScreen = document.getElementById('picker-screen');
const inputScreen = document.getElementById('input-screen');
const optionsScreen = document.getElementById('options-screen');
const buttonScreen = document.getElementById('button-screen');
const buttonForm = document.getElementById('button-form');
const fragmentScreen = document.getElementById('fragment-screen');
const fragmentForm = document.getElementById('fragment-form');
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

function resetInputForm() {
  inputForm.reset();
  inputName.dataset.manual = '';
  editMode = false;
  qparamGroup.style.display = 'none';
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
  if (headerText.includes('tfs2-form-input')) blockType = 'input';
  else if (headerText.includes('tfs2-form-options')) blockType = 'options';
  else if (headerText.includes('tfs2-form-button')) blockType = 'button';
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
        } else if (config.blockType === 'fragment') {
          populateFragmentForm(config);
          document.getElementById('fragment-submit-btn').textContent = 'Update';
          showScreen(fragmentScreen);
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
    if (type === 'input') showScreen(inputScreen);
    else if (type === 'options') showScreen(optionsScreen);
    else if (type === 'button') showScreen(buttonScreen);
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
