import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { actions } = await DA_SDK;

const pickerScreen = document.getElementById('picker-screen');
const inputScreen = document.getElementById('input-screen');
const inputForm = document.getElementById('input-form');
const backBtn = document.getElementById('back-btn');
const cancelBtn = document.getElementById('cancel-btn');
const inputLabel = document.getElementById('input-label');
const inputName = document.getElementById('input-name');

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
}

// Field type picker
document.querySelectorAll('.field-type-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
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
  const type = document.getElementById('input-type').value;
  const name = inputName.value.trim();
  const placeholder = document.getElementById('input-placeholder').value.trim();
  const required = document.getElementById('input-required').checked;

  const fields = [
    ['label', label],
    ['type', type],
    ['name', name],
    ['placeholder', placeholder],
    ['required', required ? 'true' : ''],
  ];

  const tableHTML = buildBlockTable('tfs2-form-input', fields);
  actions.sendText(tableHTML);

  resetInputForm();
  showScreen(pickerScreen);
});
