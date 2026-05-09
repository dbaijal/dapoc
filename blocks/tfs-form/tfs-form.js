function getBlockConfig(block) {
  const config = {};
  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const key = row.children[0]?.textContent?.trim().toLowerCase();
    const value = row.children[1]?.textContent?.trim();
    if (key) config[key] = value || '';
  });
  return config;
}

function buildInput(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs-form-field';

  if (config.label) {
    const label = document.createElement('label');
    label.textContent = config.label;
    label.setAttribute('for', config.name || '');
    if (config.required === 'true') {
      const req = document.createElement('span');
      req.className = 'tfs-form-required';
      req.textContent = '*';
      label.append(req);
    }
    wrapper.append(label);
  }

  const input = document.createElement('input');
  input.type = config.type || 'text';
  input.name = config.name || '';
  input.id = config.name || '';
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.required === 'true') input.required = true;
  wrapper.append(input);

  return wrapper;
}

function buildOptions(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs-form-field';

  const optionType = config.type || 'select';
  const options = (config.options || '').split(',').map((o) => o.trim()).filter(Boolean);

  if (config.label) {
    const label = document.createElement('label');
    label.textContent = config.label;
    if (optionType === 'select') label.setAttribute('for', config.name || '');
    if (config.required === 'true') {
      const req = document.createElement('span');
      req.className = 'tfs-form-required';
      req.textContent = '*';
      label.append(req);
    }
    wrapper.append(label);
  }

  if (optionType === 'select') {
    const select = document.createElement('select');
    select.name = config.name || '';
    select.id = config.name || '';
    if (config.required === 'true') select.required = true;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = config.placeholder || 'Select...';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.append(placeholder);

    options.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt.toLowerCase().replace(/\s+/g, '-');
      option.textContent = opt;
      select.append(option);
    });
    wrapper.append(select);
  } else {
    const group = document.createElement('div');
    group.className = `tfs-form-${optionType}-group`;
    group.setAttribute('role', optionType === 'radio' ? 'radiogroup' : 'group');

    options.forEach((opt) => {
      const optWrapper = document.createElement('div');
      optWrapper.className = 'tfs-form-option';

      const input = document.createElement('input');
      input.type = optionType;
      input.name = config.name || '';
      input.value = opt.toLowerCase().replace(/\s+/g, '-');
      input.id = `${config.name}-${input.value}`;
      if (config.required === 'true' && optionType === 'radio') input.required = true;

      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.textContent = opt;

      optWrapper.append(input, label);
      group.append(optWrapper);
    });
    wrapper.append(group);
  }

  return wrapper;
}

function buildLabel(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs-form-label';

  const level = config.size === 'small' ? 'h3' : 'h2';
  const heading = document.createElement(level);
  heading.textContent = config.text || '';
  wrapper.append(heading);

  return wrapper;
}

function buildButton(config) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tfs-form-actions';

  const button = document.createElement('button');
  button.type = config.type || 'submit';
  button.textContent = config.label || 'Submit';
  button.className = `tfs-form-btn${config.style ? ` tfs-form-btn-${config.style}` : ''}`;
  wrapper.append(button);

  return wrapper;
}

export default async function decorate(block) {
  const config = getBlockConfig(block);
  const section = block.closest('.section');
  if (!section) return;

  const form = document.createElement('form');
  if (config.action) form.action = config.action;
  form.method = 'POST';
  if (config.thankyou) form.dataset.thankyou = config.thankyou;

  const fieldBlocks = section.querySelectorAll(
    '.tfs-form-input, .tfs-form-options, .tfs-form-label, .tfs-form-button',
  );

  fieldBlocks.forEach((fieldBlock) => {
    const fieldConfig = getBlockConfig(fieldBlock);

    if (fieldBlock.classList.contains('tfs-form-input')) {
      form.append(buildInput(fieldConfig));
    } else if (fieldBlock.classList.contains('tfs-form-options')) {
      form.append(buildOptions(fieldConfig));
    } else if (fieldBlock.classList.contains('tfs-form-label')) {
      form.append(buildLabel(fieldConfig));
    } else if (fieldBlock.classList.contains('tfs-form-button')) {
      form.append(buildButton(fieldConfig));
    }

    fieldBlock.closest('.tfs-form-input-wrapper, .tfs-form-options-wrapper, .tfs-form-label-wrapper, .tfs-form-button-wrapper')?.remove();
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
}
