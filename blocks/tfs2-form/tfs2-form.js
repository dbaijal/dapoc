function getBlockConfig(block) {
  const config = {};
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const key = row.children[0]?.textContent?.trim().toLowerCase();
    const value = row.children[1]?.textContent?.trim();
    if (key) config[key] = value || '';
  });
  return config;
}

function getBlockType(block) {
  if (block.classList.contains('tfs2-form-input')) return 'input';
  if (block.classList.contains('tfs2-form-options')) return 'options';
  if (block.classList.contains('tfs2-form-label')) return 'label';
  if (block.classList.contains('tfs2-form-button')) return 'button';
  if (block.classList.contains('tfs2-form-step')) return 'step';
  return null;
}

async function fetchFragmentFields(path) {
  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) return [];

  const html = await resp.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const blocks = doc.querySelectorAll(
    '.tfs2-form-input, .tfs2-form-options, .tfs2-form-label, .tfs2-form-button',
  );

  return [...blocks].map((b) => ({
    type: getBlockType(b),
    config: getBlockConfig(b),
  }));
}

function buildInput(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs2-form-field';

  const fieldId = config.id || config.name || '';

  if (config.label && config['hide-title'] !== 'true') {
    const label = document.createElement('label');
    label.textContent = config.label;
    label.setAttribute('for', fieldId);
    if (config.required === 'true') {
      const req = document.createElement('span');
      req.className = 'tfs2-form-required';
      req.textContent = '*';
      label.append(req);
    }
    wrapper.append(label);
  }

  if (config['help-message']) {
    const help = document.createElement('p');
    help.className = 'tfs2-form-help';
    help.textContent = config['help-message'];
    wrapper.append(help);
  }

  const input = document.createElement('input');
  input.type = config.type || 'text';
  input.name = config.name || '';
  input.id = fieldId;
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.value) input.value = config.value;
  if (config.required === 'true') input.required = true;
  if (config.readonly === 'true') input.readOnly = true;
  if (config.minlength) input.minLength = parseInt(config.minlength, 10);
  if (config.maxlength) input.maxLength = parseInt(config.maxlength, 10);
  if (config['constraint-message']) input.title = config['constraint-message'];
  if (config['query-param']) input.dataset.qparam = config['query-param'];
  wrapper.append(input);

  if (config['confirmation-field'] === 'true') {
    const confirmInput = document.createElement('input');
    confirmInput.type = config.type || 'text';
    confirmInput.name = `${config.name}-confirm`;
    confirmInput.id = `${fieldId}-confirm`;
    confirmInput.placeholder = `Confirm ${config.label || ''}`;
    if (config.required === 'true') confirmInput.required = true;
    wrapper.append(confirmInput);
  }

  if (config['rule-action']) {
    wrapper.dataset.ruleAction = config['rule-action'];
    wrapper.dataset.ruleLogic = config['rule-logic'] || 'any';
    let idx = 1;
    while (config[`rule-${idx}`]) {
      wrapper.dataset[`rule${idx}`] = config[`rule-${idx}`];
      idx += 1;
    }
  }

  return wrapper;
}

function parseOptions(config) {
  if (!config.options) return [];
  if (config.options.includes('|')) {
    return config.options.split('|').map((o) => {
      const parts = o.split(',');
      return { text: parts[0].trim(), value: (parts[1] || parts[0]).trim() };
    }).filter((o) => o.text);
  }
  return config.options.split(',').map((o) => ({
    text: o.trim(),
    value: o.trim().toLowerCase().replace(/\s+/g, '-'),
  })).filter((o) => o.text);
}

async function fetchDatasourceOptions(config) {
  const dsType = config['datasource-type'];
  const dsRegion = config['datasource-region'] || 'global';
  let url = '';

  if (dsType === 'custom') {
    url = config['datasource-url'] || '';
  } else {
    url = `/data/${dsType}${dsRegion !== 'global' ? `-${dsRegion}` : ''}.json`;
  }

  if (!url) return [];
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const json = await resp.json();
    const data = json.data || json;
    return data.map((item) => ({
      text: item.text || item.label || item.name || item.Option || '',
      value: item.value || item.code || item.Value || '',
    })).filter((o) => o.text);
  } catch (err) {
    return [];
  }
}

async function buildOptions(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs2-form-field';

  const optionType = config.type || 'select';
  const fieldId = config.id || config.name || '';

  let options = [];
  if (config.source === 'datasource') {
    options = await fetchDatasourceOptions(config);
  } else {
    options = parseOptions(config);
  }

  if (config.label && config['hide-title'] !== 'true') {
    const label = document.createElement('label');
    label.textContent = config.label;
    if (optionType === 'select' || optionType === 'multiselect') label.setAttribute('for', fieldId);
    if (config.required === 'true') {
      const req = document.createElement('span');
      req.className = 'tfs2-form-required';
      req.textContent = '*';
      label.append(req);
    }
    wrapper.append(label);
  }

  if (config['help-message']) {
    const help = document.createElement('p');
    help.className = 'tfs2-form-help';
    help.textContent = config['help-message'];
    wrapper.append(help);
  }

  if (optionType === 'select' || optionType === 'multiselect') {
    const select = document.createElement('select');
    select.name = config.name || '';
    select.id = fieldId;
    if (config.required === 'true') select.required = true;
    if (optionType === 'multiselect') select.multiple = true;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = config.placeholder || '-Select-';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.append(placeholder);

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      select.append(option);
    });
    wrapper.append(select);
  } else {
    const group = document.createElement('div');
    group.className = `tfs2-form-${optionType}-group`;
    group.setAttribute('role', optionType === 'radio' ? 'radiogroup' : 'group');

    options.forEach((opt) => {
      const optWrapper = document.createElement('div');
      optWrapper.className = 'tfs2-form-option';

      const input = document.createElement('input');
      input.type = optionType;
      input.name = config.name || '';
      input.value = opt.value;
      input.id = `${config.name}-${opt.value}`;
      if (config.required === 'true' && optionType === 'radio') input.required = true;

      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.textContent = opt.text;

      optWrapper.append(input, label);
      group.append(optWrapper);
    });
    wrapper.append(group);
  }

  return wrapper;
}

function buildLabel(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs2-form-label';

  const level = config.size === 'small' ? 'h3' : 'h2';
  const heading = document.createElement(level);
  heading.textContent = config.text || '';
  wrapper.append(heading);

  return wrapper;
}

function buildButton(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs2-form-actions';

  if (config['error-message']) {
    const errorSpan = document.createElement('span');
    errorSpan.className = 'tfs2-form-error-msg';
    errorSpan.textContent = config['error-message'];
    errorSpan.style.display = 'none';
    wrapper.append(errorSpan);
  }

  if (config['server-error-message']) {
    const serverErrorSpan = document.createElement('span');
    serverErrorSpan.className = 'tfs2-form-server-error-msg';
    serverErrorSpan.textContent = config['server-error-message'];
    serverErrorSpan.style.display = 'none';
    wrapper.append(serverErrorSpan);
  }

  const button = document.createElement('button');
  button.type = config.type || 'submit';
  button.textContent = config.label || 'Submit';
  button.className = 'tfs2-form-btn';
  if (config.name) button.name = config.name;
  if (config.value) button.value = config.value;
  if (config.id) button.id = config.id;
  wrapper.append(button);

  return wrapper;
}

async function buildField(type, config) {
  switch (type) {
    case 'input': return buildInput(config);
    case 'options': return buildOptions(config);
    case 'label': return buildLabel(config);
    case 'button': return buildButton(config);
    default: return null;
  }
}

async function processFieldBlock(fieldBlock) {
  if (fieldBlock.classList.contains('tfs2-form-fragment')) {
    const fragmentConfig = getBlockConfig(fieldBlock);
    const path = fragmentConfig.path || '';
    if (path) {
      const fragmentFields = await fetchFragmentFields(path);
      const built = await Promise.all(
        fragmentFields.map((f) => buildField(f.type, f.config)),
      );
      return built.filter(Boolean);
    }
    return [];
  }

  const fieldConfig = getBlockConfig(fieldBlock);
  const type = getBlockType(fieldBlock);
  const element = await buildField(type, fieldConfig);
  return element ? [element] : [];
}

function setupMultiStep(form) {
  const steps = form.querySelectorAll('.tfs2-form-step-panel');
  if (steps.length === 0) return;

  let currentStep = 0;

  const stepper = document.createElement('div');
  stepper.className = 'tfs2-form-stepper';

  steps.forEach((step, i) => {
    const title = step.querySelector('.tfs2-form-step-title');
    const stepLabel = title ? title.textContent : `Step ${i + 1}`;

    const indicator = document.createElement('div');
    indicator.className = 'tfs2-form-stepper-item';
    indicator.innerHTML = `<span class="tfs2-form-stepper-circle">${i + 1}</span><span class="tfs2-form-stepper-label">${stepLabel}</span>`;
    stepper.append(indicator);

    if (title) title.remove();
  });

  form.prepend(stepper);

  const nav = document.createElement('div');
  nav.className = 'tfs2-form-step-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'tfs2-form-btn tfs2-form-btn-secondary';
  prevBtn.textContent = 'Previous';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'tfs2-form-btn';
  nextBtn.textContent = 'Next';

  nav.append(prevBtn, nextBtn);
  form.append(nav);

  function showStep(index) {
    steps.forEach((step, i) => {
      step.style.display = i === index ? 'flex' : 'none';
    });
    stepper.querySelectorAll('.tfs2-form-stepper-item').forEach((item, i) => {
      item.classList.toggle('active', i === index);
      item.classList.toggle('completed', i < index);
    });
    prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
    nextBtn.style.display = index === steps.length - 1 ? 'none' : 'inline-block';
    nav.style.display = index === steps.length - 1 ? 'none' : 'flex';

    if (index === steps.length - 1) {
      const lastStepActions = steps[index].querySelector('.tfs2-form-actions');
      if (lastStepActions && !lastStepActions.querySelector('.tfs2-form-btn-prev')) {
        const prevClone = document.createElement('button');
        prevClone.type = 'button';
        prevClone.className = 'tfs2-form-btn tfs2-form-btn-secondary tfs2-form-btn-prev';
        prevClone.textContent = 'Previous';
        prevClone.addEventListener('click', () => {
          currentStep -= 1;
          showStep(currentStep);
        });
        lastStepActions.prepend(prevClone);
      }
    }
  }

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep -= 1;
      showStep(currentStep);
    }
  });

  nextBtn.addEventListener('click', () => {
    const currentPanel = steps[currentStep];
    const invalidField = currentPanel.querySelector(':invalid');
    if (invalidField) {
      invalidField.focus();
      invalidField.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (currentStep < steps.length - 1) {
      currentStep += 1;
      showStep(currentStep);
    }
  });

  showStep(0);
}

function getFieldValue(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) return '';
  if (field.type === 'checkbox') {
    return [...form.querySelectorAll(`[name="${name}"]:checked`)].map((cb) => cb.value).join(',');
  }
  if (field.type === 'radio') {
    const checked = form.querySelector(`[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }
  return field.value || '';
}

function evalCondition(fieldValue, operator, ruleValue) {
  switch (operator) {
    case 'is-equal-to': return fieldValue === ruleValue;
    case 'is-not-equal-to': return fieldValue !== ruleValue;
    case 'contains': return fieldValue.includes(ruleValue);
    case 'starts-with': return fieldValue.startsWith(ruleValue);
    case 'is-empty': return !fieldValue;
    case 'is-not-empty': return !!fieldValue;
    default: return false;
  }
}

function initRuleEngine(form) {
  const rules = [];
  form.querySelectorAll('.tfs2-form-field, .tfs2-form-actions').forEach((fieldWrapper) => {
    const fieldEl = fieldWrapper.querySelector('input, select, textarea');
    if (!fieldEl) return;
    const { name: fieldName } = fieldEl;
    if (!fieldName) return;

    const { ruleAction, ruleLogic } = fieldWrapper.dataset;
    if (!ruleAction) return;

    const conditions = [];
    let idx = 1;
    while (fieldWrapper.dataset[`rule${idx}`]) {
      const parts = fieldWrapper.dataset[`rule${idx}`].split(':');
      conditions.push({
        sourceField: parts[0] || '',
        operator: parts[1] || 'contains',
        value: parts.slice(2).join(':') || '',
      });
      idx += 1;
    }

    if (conditions.length) {
      rules.push({
        targetField: fieldName,
        action: ruleAction,
        logic: ruleLogic,
        conditions,
      });
    }
  });

  if (rules.length === 0) return;

  const evaluateRules = () => {
    rules.forEach((rule) => {
      const results = rule.conditions.map(
        (c) => evalCondition(getFieldValue(form, c.sourceField), c.operator, c.value),
      );
      const met = rule.logic === 'any' ? results.some((r) => r) : results.every((r) => r);
      const target = form.querySelector(`[name="${rule.targetField}"]`);
      if (!target) return;
      const wrapper = target.closest('.tfs2-form-field');
      if (!wrapper) return;

      if (rule.action === 'show') {
        wrapper.style.display = met ? 'flex' : 'none';
      } else {
        wrapper.style.display = met ? 'none' : 'flex';
      }
    });
  };

  rules.forEach((rule) => {
    if (rule.action === 'show') {
      const target = form.querySelector(`[name="${rule.targetField}"]`);
      if (target) {
        const wrapper = target.closest('.tfs2-form-field');
        if (wrapper) wrapper.style.display = 'none';
      }
    }
  });

  form.addEventListener('change', evaluateRules);
  form.addEventListener('input', evaluateRules);
}

export default async function decorate(block) {
  const config = getBlockConfig(block);
  const section = block.closest('.section');
  if (!section) return;

  const isMultiStep = config.multistep === 'true';

  const form = document.createElement('form');
  if (config.action) form.action = config.action;
  form.method = config.method || 'POST';
  if (config.thankyou) form.dataset.thankyou = config.thankyou;

  const allBlocks = section.querySelectorAll(
    '.tfs2-form-input, .tfs2-form-options, .tfs2-form-label, .tfs2-form-button, .tfs2-form-fragment, .tfs2-form-step',
  );

  if (isMultiStep) {
    const panels = [];
    let panelIndex = -1;

    [...allBlocks].forEach((fieldBlock) => {
      if (fieldBlock.classList.contains('tfs2-form-step')) {
        const stepConfig = getBlockConfig(fieldBlock);
        panelIndex += 1;
        panels.push({ stepConfig, fields: [] });
      } else if (panelIndex >= 0) {
        panels[panelIndex].fields.push(fieldBlock);
      }
    });

    const panelPromises = panels.map(async (panel) => {
      const div = document.createElement('div');
      div.className = 'tfs2-form-step-panel';
      div.dataset.step = panel.stepConfig.step || '';

      const stepHeading = document.createElement('h3');
      stepHeading.className = 'tfs2-form-step-title';
      stepHeading.textContent = panel.stepConfig.title || `Step ${panel.stepConfig.step}`;
      div.append(stepHeading);

      const fieldResults = await Promise.all(
        panel.fields.map((fb) => processFieldBlock(fb)),
      );
      fieldResults.forEach((elements) => {
        elements.forEach((el) => div.append(el));
      });

      return div;
    });

    const builtPanels = await Promise.all(panelPromises);
    builtPanels.forEach((p) => form.append(p));

    setupMultiStep(form);
  } else {
    const fieldBlocks = section.querySelectorAll(
      '.tfs2-form-input, .tfs2-form-options, .tfs2-form-label, .tfs2-form-button, .tfs2-form-fragment',
    );

    const processingPromises = [...fieldBlocks].map(
      (fieldBlock) => processFieldBlock(fieldBlock),
    );

    const results = await Promise.all(processingPromises);
    results.forEach((elements) => {
      elements.forEach((el) => form.append(el));
    });
  }

  allBlocks.forEach((fieldBlock) => {
    fieldBlock.closest(
      '.tfs2-form-input-wrapper, .tfs2-form-options-wrapper, .tfs2-form-label-wrapper, .tfs2-form-button-wrapper, .tfs2-form-fragment-wrapper, .tfs2-form-step-wrapper',
    )?.remove();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid:not(fieldset)');
      if (firstInvalid) {
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (form.dataset.thankyou) {
      window.location.href = form.dataset.thankyou;
    }
  });

  block.textContent = '';
  block.append(form);
  initRuleEngine(form);
}
