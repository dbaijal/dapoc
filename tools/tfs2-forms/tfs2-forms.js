// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { actions } = await DA_SDK;

const pickerScreen = document.getElementById('picker-screen');
const inputScreen = document.getElementById('input-screen');
const inputForm = document.getElementById('input-form');
const backBtn = document.getElementById('back-btn');
const cancelBtn = document.getElementById('cancel-btn');
const inputLabel = document.getElementById('input-label');
const inputName = document.getElementById('input-name');
const qparamToggle = document.getElementById('input-qparam-toggle');
const qparamGroup = document.getElementById('qparam-name-group');

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  screen.classList.add('active');
}

function autoGenerateName() {
  const label = inputLabel.value.trim();
  if (label && !inputName.dataset.manual) {
    inputName.value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  }
}

function buildBlockTable(blockName, fields) {
  const rows = fields
    .filter(([, value]) => value)
    .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
    .join('');
  return `<table><tr><th colspan="2">${blockName}</th></tr>${rows}</table>`;
}

function resetInputForm() {
  inputForm.reset();
  inputName.dataset.manual = '';
  qparamGroup.style.display = 'none';
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0);
  });
  document.querySelectorAll('.tab-panel').forEach((p, i) => {
    p.classList.toggle('active', i === 0);
  });
}

// Tab switching
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const { tab: tabName } = tab.dataset;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
  });
});

// Field type picker
document.querySelectorAll('.field-type-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const { type } = btn.dataset;
    if (type === 'input') {
      showScreen(inputScreen);
    }
  });
});

// Auto-generate name from label
inputLabel.addEventListener('input', autoGenerateName);
inputName.addEventListener('input', () => {
  inputName.dataset.manual = 'true';
});

// Query param toggle
qparamToggle.addEventListener('change', () => {
  qparamGroup.style.display = qparamToggle.checked ? 'flex' : 'none';
});

// Back button
backBtn.addEventListener('click', () => {
  resetInputForm();
  showScreen(pickerScreen);
});

// Cancel button
cancelBtn.addEventListener('click', () => {
  resetInputForm();
  showScreen(pickerScreen);
});

// Submit input form
inputForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const label = inputLabel.value.trim();
  const type = document.getElementById('input-constraint').value;
  const name = inputName.value.trim();
  const placeholder = document.getElementById('input-placeholder').value.trim();
  const value = document.getElementById('input-value').value.trim();
  const required = document.getElementById('input-required').checked;
  const readonly = document.getElementById('input-readonly').checked;
  const hideTitle = document.getElementById('input-hide-title').checked;
  const constraintMsg = document.getElementById('input-constraint-msg').value.trim();
  const minlength = document.getElementById('input-minlength').value.trim();
  const maxlength = document.getElementById('input-maxlength').value.trim();
  const multivalue = document.getElementById('input-multivalue').checked;
  const confirmation = document.getElementById('input-confirmation').checked;
  const qparam = qparamToggle.checked ? document.getElementById('input-qparam').value.trim() : '';
  const helpMsg = document.getElementById('input-help').value.trim();
  const customId = document.getElementById('input-id').value.trim();

  const fields = [
    ['label', label],
    ['type', type],
    ['name', name],
    ['placeholder', placeholder],
    ['value', value],
    ['required', required ? 'true' : ''],
    ['readonly', readonly ? 'true' : ''],
    ['hide-title', hideTitle ? 'true' : ''],
    ['constraint-message', constraintMsg],
    ['minlength', minlength],
    ['maxlength', maxlength],
    ['multi-value', multivalue ? 'true' : ''],
    ['confirmation-field', confirmation ? 'true' : ''],
    ['query-param', qparam],
    ['help-message', helpMsg],
    ['id', customId],
  ];

  const tableHTML = buildBlockTable('tfs2-form-input', fields);
  actions.sendHTML(tableHTML);

  resetInputForm();
  showScreen(pickerScreen);
});
