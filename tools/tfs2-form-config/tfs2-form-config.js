// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const { actions } = await DA_SDK;

const configForm = document.getElementById('form-config-form');
const actionSelect = document.getElementById('action-type-select');
const selectedActionsEl = document.getElementById('selected-actions');
const configSections = document.getElementById('config-sections');
const sessionStorageToggle = document.getElementById('enable-session-storage');
const sessionStorageFields = document.getElementById('session-storage-fields');

const selectedActions = new Set();

const ACTION_TEMPLATES = {
  1001: 'tpl-eloqua',
  1002: 'tpl-gcms',
  1004: 'tpl-nonlsg',
  1005: 'tpl-marketo',
  1006: 'tpl-email',
  1009: 'tpl-s3',
};

const ACTION_LABELS = {
  1001: 'Eloqua',
  1002: 'GCMS',
  1003: 'LSG',
  1004: 'Non LSG',
  1005: 'Marketo',
  1006: 'Email',
  1007: 'CORA',
  1009: 'S3',
  1010: 'ELMS',
  1011: 'FSBIO',
  1013: 'Genesys DB',
};

function buildBlockTable(blockName, fields) {
  const rows = fields
    .filter(([, value]) => value)
    .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
    .join('');
  return `<table><tr><th colspan="2">${blockName}</th></tr>${rows}</table>`;
}

function createRepeatableRow(type) {
  const row = document.createElement('div');
  row.className = 'repeatable-row';

  if (type === 'eloqua-region') {
    row.innerHTML = `
      <select class="region-select"><option value="">Select Region</option><option value="north-america">North America</option><option value="europe">Europe</option><option value="asia-pacific">Asia Pacific</option><option value="latin-america">Latin America</option></select>
      <select class="country-select"><option value="">Select Country</option><option value="us">United States</option><option value="uk">United Kingdom</option><option value="de">Germany</option><option value="in">India</option></select>
      <input type="text" class="region-form-name" placeholder="Region Form Name">
      <button type="button" class="btn-remove-row">&times;</button>
    `;
  } else if (type === 'gcms-region') {
    row.innerHTML = `
      <select class="region-select"><option value="">Select Region</option><option value="north-america">North America</option><option value="europe">Europe</option><option value="asia-pacific">Asia Pacific</option><option value="latin-america">Latin America</option></select>
      <div class="input-with-btn">
        <input type="text" class="region-gcms-id" placeholder="Region GCMS Id">
        <button type="button" class="btn-fetch btn-sm" disabled title="API pending">Fetch</button>
      </div>
      <button type="button" class="btn-remove-row">&times;</button>
    `;
  } else if (type === 'email-mailto') {
    row.innerHTML = `
      <input type="text" class="mailto-input" placeholder="email@example.com">
      <button type="button" class="btn-remove-row">&times;</button>
    `;
  } else if (type === 'email-regional') {
    row.innerHTML = `
      <div class="regional-row-content">
        <select class="region-select"><option value="">Select Region</option><option value="north-america">North America</option><option value="europe">Europe</option><option value="asia-pacific">Asia Pacific</option><option value="latin-america">Latin America</option></select>
        <input type="text" class="regional-subject" placeholder="Subject">
        <input type="text" class="regional-mailto" placeholder="mailto@example.com">
      </div>
      <button type="button" class="btn-remove-row">&times;</button>
    `;
  }

  row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
  return row;
}

function removeActionType(code) {
  selectedActions.delete(code);
  const tag = selectedActionsEl.querySelector(`[data-code="${code}"]`);
  if (tag) tag.remove();
  const panel = configSections.querySelector(`[data-action="${code}"]`);
  if (panel) panel.remove();
}

function initConfigPanel(code) {
  const panel = configSections.querySelector(`[data-action="${code}"]`);
  if (!panel) return;

  if (code === '1001') {
    panel.querySelector('.add-eloqua-region').addEventListener('click', () => {
      panel.querySelector('.eloqua-regions').appendChild(createRepeatableRow('eloqua-region'));
    });
  } else if (code === '1002') {
    panel.querySelector('.add-gcms-region').addEventListener('click', () => {
      panel.querySelector('.gcms-regions').appendChild(createRepeatableRow('gcms-region'));
    });
  } else if (code === '1006') {
    panel.querySelector('.add-email-mailto').addEventListener('click', () => {
      panel.querySelector('.email-mailto').appendChild(createRepeatableRow('email-mailto'));
    });
    panel.querySelector('.add-email-regional').addEventListener('click', () => {
      panel.querySelector('.email-regional').appendChild(createRepeatableRow('email-regional'));
    });
    panel.querySelector('.enable-regional-email').addEventListener('change', (e) => {
      panel.querySelector('.regional-email-config').style.display = e.target.checked ? 'block' : 'none';
    });
  }
}

function addActionType(code) {
  if (selectedActions.has(code)) return;
  selectedActions.add(code);

  const tag = document.createElement('span');
  tag.className = 'action-tag';
  tag.dataset.code = code;
  tag.innerHTML = `Form: Send form data to ${ACTION_LABELS[code]} <button type="button" class="tag-remove">&times;</button>`;
  tag.querySelector('.tag-remove').addEventListener('click', () => removeActionType(code));
  selectedActionsEl.appendChild(tag);

  const templateId = ACTION_TEMPLATES[code];
  if (templateId) {
    const template = document.getElementById(templateId);
    if (template) {
      const panel = template.content.cloneNode(true);
      configSections.appendChild(panel);
      initConfigPanel(code);
    }
  }

  actionSelect.value = '';
}

function collectFormData() {
  const fields = [];

  fields.push(['action-types', [...selectedActions].join(',')]);

  selectedActions.forEach((code) => {
    const panel = configSections.querySelector(`[data-action="${code}"]`);
    if (!panel) return;

    if (code === '1001') {
      const formName = panel.querySelector('.eloqua-form-name').value.trim();
      const instance = panel.querySelector('.eloqua-instance').value;
      if (formName) fields.push(['eloqua-form-name', formName]);
      if (instance) fields.push(['eloqua-instance', instance]);
      const regions = [];
      panel.querySelectorAll('.eloqua-regions .repeatable-row').forEach((row) => {
        const region = row.querySelector('.region-select').value;
        const country = row.querySelector('.country-select').value;
        const name = row.querySelector('.region-form-name').value.trim();
        if (region) regions.push(`${region}:${country}:${name}`);
      });
      if (regions.length) fields.push(['eloqua-regions', regions.join('|')]);
    } else if (code === '1002') {
      const formId = panel.querySelector('.gcms-form-id').value.trim();
      if (formId) fields.push(['gcms-form-id', formId]);
      const regions = [];
      panel.querySelectorAll('.gcms-regions .repeatable-row').forEach((row) => {
        const region = row.querySelector('.region-select').value;
        const gcmsId = row.querySelector('.region-gcms-id').value.trim();
        if (region) regions.push(`${region}:${gcmsId}`);
      });
      if (regions.length) fields.push(['gcms-regions', regions.join('|')]);
    } else if (code === '1005') {
      const formId = panel.querySelector('.marketo-form-id').value.trim();
      if (formId) fields.push(['marketo-form-id', formId]);
    } else if (code === '1006') {
      const template = panel.querySelector('.email-template').value;
      const subject = panel.querySelector('.email-subject').value.trim();
      if (template) fields.push(['email-template', template]);
      if (subject) fields.push(['email-subject', subject]);
      const mailtos = [];
      panel.querySelectorAll('.email-mailto .mailto-input').forEach((input) => {
        if (input.value.trim()) mailtos.push(input.value.trim());
      });
      if (mailtos.length) fields.push(['email-mailto', mailtos.join(',')]);
      const regionalEnabled = panel.querySelector('.enable-regional-email').checked;
      if (regionalEnabled) {
        fields.push(['email-regional-enabled', 'true']);
        const regionals = [];
        panel.querySelectorAll('.email-regional .repeatable-row').forEach((row) => {
          const region = row.querySelector('.region-select').value;
          const subj = row.querySelector('.regional-subject').value.trim();
          const mailto = row.querySelector('.regional-mailto').value.trim();
          if (region) regionals.push(`${region}:${subj}:${mailto}`);
        });
        if (regionals.length) fields.push(['email-regional-config', regionals.join('|')]);
      }
    } else if (code === '1004') {
      const nonlsgType = panel.querySelector('.nonlsg-type').value;
      if (nonlsgType) fields.push(['nonlsg-type', nonlsgType]);
    } else if (code === '1009') {
      const formId = panel.querySelector('.s3-form-id').value.trim();
      if (formId) fields.push(['s3-form-id', formId]);
    }
  });

  const mqo = document.getElementById('mqo-form').value;
  const division = document.getElementById('division').value;
  const formId = document.getElementById('form-container-id').value.trim();
  if (mqo) fields.push(['mqo-form', mqo]);
  if (division) fields.push(['division', division]);
  if (formId) fields.push(['id', formId]);

  const sessionEnabled = sessionStorageToggle.checked;
  if (sessionEnabled) {
    fields.push(['session-storage', 'true']);
    const sessionKey = document.getElementById('session-key').value.trim();
    const sessionPersist = document.getElementById('session-persist').checked;
    if (sessionKey) fields.push(['session-key', sessionKey]);
    if (sessionPersist) fields.push(['session-persist', 'true']);
  }

  return fields;
}

let editMode = false;

// --- Edit Mode ---
function parseSelectionHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const firstRow = table.querySelector('tr');
  if (!firstRow) return null;

  const headerCell = firstRow.querySelector('td[colspan], th');
  const headerText = headerCell ? headerCell.textContent.trim() : '';
  if (headerText !== 'tfs2-form') return null;

  const config = {};
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

function populateFormConfig(config) {
  if (config['action-types']) {
    config['action-types'].split(',').forEach((code) => {
      addActionType(code.trim());
    });
  }

  if (config['eloqua-form-name']) {
    const panel = configSections.querySelector('[data-action="1001"]');
    if (panel) panel.querySelector('.eloqua-form-name').value = config['eloqua-form-name'];
  }
  if (config['eloqua-instance']) {
    const panel = configSections.querySelector('[data-action="1001"]');
    if (panel) panel.querySelector('.eloqua-instance').value = config['eloqua-instance'];
  }
  if (config['gcms-form-id']) {
    const panel = configSections.querySelector('[data-action="1002"]');
    if (panel) panel.querySelector('.gcms-form-id').value = config['gcms-form-id'];
  }
  if (config['marketo-form-id']) {
    const panel = configSections.querySelector('[data-action="1005"]');
    if (panel) panel.querySelector('.marketo-form-id').value = config['marketo-form-id'];
  }
  if (config['email-template']) {
    const panel = configSections.querySelector('[data-action="1006"]');
    if (panel) panel.querySelector('.email-template').value = config['email-template'];
  }
  if (config['email-subject']) {
    const panel = configSections.querySelector('[data-action="1006"]');
    if (panel) panel.querySelector('.email-subject').value = config['email-subject'];
  }
  if (config['email-mailto']) {
    const panel = configSections.querySelector('[data-action="1006"]');
    if (panel) {
      config['email-mailto'].split(',').forEach((email) => {
        const row = createRepeatableRow('email-mailto');
        row.querySelector('.mailto-input').value = email.trim();
        panel.querySelector('.email-mailto').appendChild(row);
      });
    }
  }
  if (config['nonlsg-type']) {
    const panel = configSections.querySelector('[data-action="1004"]');
    if (panel) panel.querySelector('.nonlsg-type').value = config['nonlsg-type'];
  }
  if (config['s3-form-id']) {
    const panel = configSections.querySelector('[data-action="1009"]');
    if (panel) panel.querySelector('.s3-form-id').value = config['s3-form-id'];
  }

  if (config['mqo-form']) document.getElementById('mqo-form').value = config['mqo-form'];
  if (config.division) document.getElementById('division').value = config.division;
  if (config.id) document.getElementById('form-container-id').value = config.id;

  if (config['session-storage'] === 'true') {
    sessionStorageToggle.checked = true;
    sessionStorageFields.style.display = 'block';
    if (config['session-key']) document.getElementById('session-key').value = config['session-key'];
    if (config['session-persist'] === 'true') document.getElementById('session-persist').checked = true;
  }
}

async function tryEditSelection() {
  try {
    const selection = await actions.getSelection();
    if (selection) {
      const config = parseSelectionHTML(selection);
      if (config) {
        editMode = true;
        populateFormConfig(config);
        document.getElementById('config-submit-btn').textContent = 'Update';
        return true;
      }
    }
  } catch (err) {
    // No selection — proceed with add mode
  }
  return false;
}

// --- Edit button ---
const editBtn = document.createElement('button');
editBtn.type = 'button';
editBtn.className = 'btn-edit-selected';
editBtn.textContent = 'Edit Selected Form Config';
editBtn.addEventListener('click', async () => {
  const edited = await tryEditSelection();
  if (!edited) {
    editBtn.textContent = 'Select a tfs2-form block table first';
    setTimeout(() => { editBtn.textContent = 'Edit Selected Form Config'; }, 2000);
  }
});
document.querySelector('.plugin-header').appendChild(editBtn);

// --- Tab switching ---
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const { tab: tabName } = tab.dataset;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
  });
});

// --- Action type select ---
actionSelect.addEventListener('change', () => {
  const code = actionSelect.value;
  if (code) addActionType(code);
});

// --- Session storage toggle ---
sessionStorageToggle.addEventListener('change', () => {
  sessionStorageFields.style.display = sessionStorageToggle.checked ? 'block' : 'none';
});

// --- Submit ---
configForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = collectFormData();
  const tableHTML = buildBlockTable('tfs2-form', fields);
  actions.sendHTML(tableHTML);
  if (editMode) actions.closeLibrary();
});

// --- Cancel ---
document.getElementById('config-cancel-btn').addEventListener('click', () => {
  actions.closeLibrary();
});
