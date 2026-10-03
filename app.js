(() => {
  'use strict';

  const DATA = window.LJ_ANNOUNCEMENT_DATA;
  if (!DATA || !Array.isArray(DATA.announcements)) {
    const overlayStatus = document.getElementById('startStatus');
    const startButton = document.getElementById('btnStart');
    if (overlayStatus) overlayStatus.textContent = 'Announcement data could not be loaded. Check data/announcements.js.';
    if (startButton) startButton.disabled = true;
    return;
  }
  const synth = window.speechSynthesis;
  const hasSpeech = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

  const STORAGE = {
    flight: 'ljtag.flight',
    destination: 'ljtag.destination',
    koVoice: 'ljtag.koVoice',
    enVoice: 'ljtag.enVoice',
    speed: 'ljtag.speed',
    pitch: 'ljtag.pitch',
    keepAwake: 'ljtag.keepAwake',
    codeshare: 'ljtag.codeshare'
  };

  const LEGACY_STORAGE = {
    flight: 'tts-flight',
    destination: 'tts-dest',
    koVoice: 'tts-ko-voice',
    enVoice: 'tts-en-voice'
  };

  const translationCache = new Map();

  const state = {
    currentFlight: DATA.flights[0],
    currentDest: Object.keys(DATA.destinations)[0],
    voices: [],
    unlocked: false,
    keepAliveTimer: null,
    active: null,
    playbackId: 0,
    wakeLock: null,
    keepAwakeEnabled: false,
    codeshareEnabled: false
  };

  const els = {
    startOverlay: document.getElementById('startOverlay'),
    btnStart: document.getElementById('btnStart'),
    btnStartFallback: document.getElementById('btnStartFallback'),
    startStatus: document.getElementById('startStatus'),
    branchLabel: document.getElementById('branchLabel'),
    flightButtons: document.getElementById('flightButtons'),
    destinationButtons: document.getElementById('destinationButtons'),
    annCatalog: document.getElementById('annCatalog'),
    catalogCount: document.getElementById('catalogCount'),
    customAnnouncement: document.getElementById('customAnnouncement'),
    selVoiceKo: document.getElementById('selVoiceKo'),
    selVoiceEn: document.getElementById('selVoiceEn'),
    rngSpeed: document.getElementById('rngSpeed'),
    rngPitch: document.getElementById('rngPitch'),
    lblSpeed: document.getElementById('lblSpeed'),
    lblPitch: document.getElementById('lblPitch'),
    btnPreviewKo: document.getElementById('btnPreviewKo'),
    btnPreviewEn: document.getElementById('btnPreviewEn'),
    btnPreviewSpeed: document.getElementById('btnPreviewSpeed'),
    btnPreviewPitch: document.getElementById('btnPreviewPitch'),
    btnResetSpeed: document.getElementById('btnResetSpeed'),
    btnResetPitch: document.getElementById('btnResetPitch'),
    chkKeepAwake: document.getElementById('chkKeepAwake'),
    chkCodeshare: document.getElementById('chkCodeshare'),
    wakeLockStatus: document.getElementById('wakeLockStatus'),
    pullRefreshIndicator: document.getElementById('pullRefreshIndicator'),
    pullRefreshIcon: document.getElementById('pullRefreshIcon'),
    pullRefreshText: document.getElementById('pullRefreshText'),
    versionLabel: document.getElementById('versionLabel'),
    modal: document.getElementById('alertModal'),
    modalMessage: document.getElementById('modalMessage'),
    modalClose: document.getElementById('modalClose')
  };

  function storageGet(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (_) { /* storage may be unavailable */ }
  }

  function readPreference(key, legacyKey, fallback) {
    return storageGet(key, legacyKey ? storageGet(legacyKey, fallback) : fallback);
  }

  function showModal(message) {
    els.modalMessage.textContent = message;
    els.modal.classList.remove('is-hidden');
    els.modalClose.focus();
  }

  function closeModal() {
    els.modal.classList.add('is-hidden');
  }

  function normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return '';
    const n = Number.parseInt(String(value), 10);
    return Number.isFinite(n) ? String(n) : '';
  }

  function formatFlightNumberForReading(flightNumber) {
    if (!flightNumber) return '';
    const alphaMap = {
      A:'에이', B:'비', C:'씨', D:'디', E:'이', F:'에프', G:'지', H:'에이치', I:'아이',
      J:'제이', K:'케이', L:'엘', M:'엠', N:'엔', O:'오', P:'피', Q:'큐', R:'알',
      S:'에스', T:'티', U:'유', V:'브이', W:'더블유', X:'엑스', Y:'와이', Z:'제트'
    };
    const digitMap = {'0':'공','1':'일','2':'이','3':'삼','4':'사','5':'오','6':'육','7':'칠','8':'팔','9':'구'};
    const letters = (flightNumber.match(/[A-Za-z]+/g) || []).join('');
    const numbers = (flightNumber.match(/\d+/g) || []).join('');
    const letterText = letters.split('').map(ch => alphaMap[ch.toUpperCase()] || ch).join('');
    const numberText = numbers.split('').map(ch => digitMap[ch] || ch).join(', ');
    return [letterText, numberText].filter(Boolean).join(', ');
  }

  function currentCodeshare() {
    if (!state.codeshareEnabled || !DATA.codeshares) return null;
    return DATA.codeshares[state.currentFlight] || null;
  }

  function flightNumberForTemplate(mode = 'display', language = 'ko') {
    const primary = state.currentFlight;
    const codeshare = currentCodeshare();

    if (language === 'en') {
      if (!codeshare) return primary;
      return `${primary}, also operating as ${codeshare.carrierEn} flight ${codeshare.flight}`;
    }

    if (mode === 'speech') {
      const primarySpoken = formatFlightNumberForReading(primary);
      if (!codeshare) return primarySpoken;
      const codeshareSpoken = formatFlightNumberForReading(codeshare.flight);
      return `${primarySpoken}편, 공동운항 ${codeshare.carrierKo} ${codeshareSpoken}`;
    }

    if (!codeshare) return primary;
    return `${primary}편, 공동운항 ${codeshare.carrierKo} ${codeshare.flight}`;
  }

  function detectStrongLanguage(char) {
    if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char)) return 'ko';
    if (/[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/.test(char)) return 'en';
    return null;
  }

  function parseTextToSegments(text, forcedLanguage = 'auto') {
    if (!text) return [];
    if (forcedLanguage === 'ko' || forcedLanguage === 'en') {
      return [{ text, lang: forcedLanguage, startIndex: 0 }];
    }

    const segments = [];
    let buffer = '';
    let lang = null;
    let startIndex = 0;

    const push = () => {
      if (!buffer) return;
      segments.push({ text: buffer, lang: lang || 'ko', startIndex });
      buffer = '';
      lang = null;
    };

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const charLang = detectStrongLanguage(char);

      if (!buffer) {
        buffer = char;
        lang = charLang;
        startIndex = i;
        continue;
      }

      if (charLang === null) {
        buffer += char;
        continue;
      }

      if (lang === null) {
        lang = charLang;
        buffer += char;
        continue;
      }

      if (charLang === lang) {
        buffer += char;
        continue;
      }

      push();
      buffer = char;
      lang = charLang;
      startIndex = i;
    }

    push();
    return segments;
  }

  function currentDestination(language = 'ko') {
    const dest = DATA.destinations[state.currentDest] || DATA.destinations[Object.keys(DATA.destinations)[0]];
    return language === 'en' ? dest.en : dest.ko;
  }

  function renderTemplate(template, context, mode = 'display', language = 'ko') {
    if (!template) return '';
    const base = {
      ...context,
      flightNumber: flightNumberForTemplate(mode, language),
      destination: currentDestination(language)
    };
    return template.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key) => {
      const value = base[key];
      return value === undefined || value === null ? match : String(value);
    });
  }

  function getAnnouncementById(id) {
    return DATA.announcements.find(a => a.id === String(id));
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function syncDestinationInputs() {
    document.querySelectorAll('[data-input-type="destination"]').forEach(control => {
      control.dataset.value = state.currentDest;
      control.querySelectorAll('button[data-choice-value]').forEach(button => {
        const active = button.dataset.choiceValue === state.currentDest;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function renderQuickControls() {
    els.flightButtons.replaceChildren();
    DATA.flights.forEach(flight => {
      const btn = createEl('button', state.currentFlight === flight ? 'is-active' : '');
      btn.type = 'button';
      btn.dataset.value = flight;
      const codeshare = state.codeshareEnabled && DATA.codeshares ? DATA.codeshares[flight] : null;

      btn.appendChild(createEl('span', 'flight-primary', flight));
      if (codeshare) {
        btn.appendChild(createEl('span', 'flight-codeshare', `(${codeshare.flight})`));
        btn.setAttribute('aria-label', `${flight}, codeshare ${codeshare.carrierEn} ${codeshare.flight}`);
      } else {
        btn.setAttribute('aria-label', flight);
      }

      btn.setAttribute('aria-pressed', String(state.currentFlight === flight));
      btn.addEventListener('click', () => {
        if (state.currentFlight === flight) return;
        stopSpeech();
        state.currentFlight = flight;
        storageSet(STORAGE.flight, flight);
        renderQuickControls();
        refreshAllPreviews();
      });
      els.flightButtons.appendChild(btn);
    });

    if (els.chkCodeshare) {
      els.chkCodeshare.checked = state.codeshareEnabled;
      els.chkCodeshare.setAttribute('aria-checked', String(state.codeshareEnabled));
    }

    els.destinationButtons.replaceChildren();
    Object.entries(DATA.destinations).forEach(([code, dest]) => {
      const btn = createEl('button', state.currentDest === code ? 'is-active' : '', dest.label);
      btn.type = 'button';
      btn.dataset.value = code;
      btn.setAttribute('aria-pressed', String(state.currentDest === code));
      btn.addEventListener('click', () => {
        if (state.currentDest === code) return;
        stopSpeech();
        state.currentDest = code;
        storageSet(STORAGE.destination, code);
        renderQuickControls();
        refreshAllPreviews();
      });
      els.destinationButtons.appendChild(btn);
    });
    syncDestinationInputs();
  }

  function renderInput(card, ann, spec) {
    const group = createEl('div', 'input-group');
    if (spec.type === 'textarea') group.classList.add('is-wide');

    if (spec.type === 'repeat') {
      const labelRow = createEl('div', 'input-label-row repeat-label-row');
      labelRow.appendChild(createEl('span', 'input-label', spec.label));
      const box = createEl('div', 'repeat-box');
      const controls = createEl('div', 'repeat-controls');
      const minus = createEl('button', 'repeat-button', '−');
      const value = createEl('span', 'repeat-value', String(spec.default ?? 1));
      const plus = createEl('button', 'repeat-button', '+');
      minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', `${spec.label} decrease`);
      plus.setAttribute('aria-label', `${spec.label} increase`);
      value.dataset.inputKey = spec.key;
      value.dataset.inputType = 'repeat';
      value.dataset.value = String(spec.default ?? 1);

      const change = delta => {
        const current = Number.parseInt(value.dataset.value || '1', 10);
        const min = spec.min ?? 1;
        const max = spec.max ?? 99;
        const next = Math.min(max, Math.max(min, current + delta));
        value.dataset.value = String(next);
        value.textContent = String(next);
        updateCardPreview(card, ann);
      };
      minus.addEventListener('click', () => change(-1));
      plus.addEventListener('click', () => change(1));
      controls.append(minus, value, plus);
      box.appendChild(controls);
      group.append(labelRow, box);
      return group;
    }

    if (spec.type === 'choice' || spec.type === 'destination') {
      const labelRow = createEl('div', 'input-label-row');
      labelRow.appendChild(createEl('span', 'input-label', spec.label));
      const control = createEl('div', 'choice-control');
      control.dataset.inputKey = spec.key;
      control.dataset.inputType = spec.type;

      const options = spec.type === 'destination'
        ? Object.entries(DATA.destinations).map(([value, dest]) => ({ value, label: dest.label, ko: dest.ko, en: dest.en }))
        : (spec.options || []).map(option => typeof option === 'string' ? { value: option, label: option } : option);
      const defaultValue = spec.type === 'destination'
        ? state.currentDest
        : String(spec.default ?? options[0]?.value ?? '');
      control.dataset.value = defaultValue;

      const setChoice = value => {
        control.dataset.value = value;
        control.querySelectorAll('button[data-choice-value]').forEach(button => {
          const active = button.dataset.choiceValue === value;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });

        if (spec.type === 'destination') {
          if (state.currentDest !== value) {
            stopSpeech();
            state.currentDest = value;
            storageSet(STORAGE.destination, value);
            renderQuickControls();
          }
          refreshAllPreviews();
        } else {
          updateCardPreview(card, ann);
        }
      };

      options.forEach(optionSpec => {
        const value = String(optionSpec.value);
        const button = createEl('button', value === defaultValue ? 'is-active' : '', optionSpec.label ?? value);
        button.type = 'button';
        button.dataset.choiceValue = value;
        button.setAttribute('aria-pressed', String(value === defaultValue));
        button.addEventListener('click', () => setChoice(value));
        control.appendChild(button);
      });

      group.append(labelRow, control);
      return group;
    }

    const labelRow = createEl('div', 'input-label-row');
    const label = createEl('label', 'input-label', spec.label);
    const inputId = `ann-${ann.id}-${spec.key}`;
    label.htmlFor = inputId;
    labelRow.appendChild(label);

    let input;
    let translate = null;
    if (spec.type === 'textarea') {
      input = createEl('textarea', 'textarea-control');
      input.rows = 2;
      input.autocomplete = 'off';
      input.spellcheck = false;
      if (spec.translate) {
        translate = createEl('button', 'mini-button translate-button', 'A→가');
        translate.type = 'button';
        translate.dataset.translateTarget = spec.key;
        translate.title = 'Convert name to Korean (internet required)';
        translate.setAttribute('aria-label', 'Convert name to Korean');
        translate.addEventListener('click', () => translateName(card, ann, input, translate));
      }
    } else if (spec.type === 'select') {
      input = createEl('select', 'input-control');
      (spec.options || []).forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        input.appendChild(option);
      });
      if (spec.default !== undefined) input.value = String(spec.default);
    } else {
      input = createEl('input', 'input-control');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.addEventListener('input', () => {
        const sanitized = input.value.replace(/[^0-9]/g, '');
        if (input.value !== sanitized) input.value = sanitized;
      });
    }

    input.id = inputId;
    input.dataset.inputKey = spec.key;
    input.dataset.inputType = spec.type;
    if (spec.placeholder) input.placeholder = spec.placeholder;
    if (spec.default !== undefined && spec.type !== 'select') input.value = String(spec.default);
    input.addEventListener('input', () => updateCardPreview(card, ann));
    input.addEventListener('change', () => updateCardPreview(card, ann));
    group.append(labelRow, input);
    if (translate) group.appendChild(translate);
    return group;
  }

  function buildContext(card, ann, preview = false) {
    const context = {};
    const specs = ann.inputs || [];

    specs.forEach(spec => {
      const el = card.querySelector(`[data-input-key="${spec.key}"]`);
      let value = '';
      if (spec.type === 'repeat' || spec.type === 'choice' || spec.type === 'destination') {
        value = el?.dataset.value || String(spec.default ?? '');
      } else {
        value = el?.value?.trim() || '';
      }

      if ((spec.type === 'number') && value) value = normalizeNumber(value);
      if (spec.type === 'textarea' && value) value = value.replace(/\s+/g, ' ').trim();

      if (!value && preview && spec.type !== 'repeat') {
        if (spec.key === 'names') value = '[Passenger name]';
        else if (spec.key === 'gate') value = '[Gate]';
        else if (spec.key === 'floor') value = '[Floor]';
        else if (spec.key === 'hour') value = '[Hour]';
        else if (spec.key === 'minute') value = '[Minute]';
        else value = `[${spec.label}]`;
      }
      context[spec.key] = value;

      if (spec.type === 'destination' && value) {
        const dest = DATA.destinations[value];
        if (dest) {
          context[`${spec.key}Ko`] = dest.ko;
          context[`${spec.key}En`] = dest.en;
          context[`${spec.key}Label`] = dest.label;
        }
      } else if (spec.type === 'choice' && value) {
        const option = (spec.options || []).map(item => typeof item === 'string' ? { value: item, label: item } : item)
          .find(item => String(item.value) === String(value));
        if (option) {
          context[`${spec.key}Ko`] = option.ko ?? option.value;
          context[`${spec.key}En`] = option.en ?? option.value;
          context[`${spec.key}Label`] = option.label ?? option.value;
        }
      }
    });

    (ann.derived || []).forEach(rule => {
      const unit = rule.template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key) => context[key] ?? '');
      const repeat = Math.max(1, Number.parseInt(context[rule.repeatKey] || '1', 10) || 1);
      context[rule.key] = Array(repeat).fill(unit).join(rule.separator ?? ', ');
    });

    return context;
  }

  function validateAnnouncement(card, ann) {
    const context = buildContext(card, ann, false);
    for (const spec of ann.inputs || []) {
      if (spec.type === 'repeat') continue;
      const value = context[spec.key];
      if (spec.required && !value) return { ok: false, message: `${spec.label}: enter a value.` };
      if (spec.type === 'number' && value) {
        const n = Number.parseInt(value, 10);
        if (!Number.isFinite(n)) return { ok: false, message: `${spec.label}: enter a number.` };
        if (spec.min !== undefined && n < spec.min) return { ok: false, message: `${spec.label}: enter ${spec.min} or higher.` };
        if (spec.max !== undefined && n > spec.max) return { ok: false, message: `${spec.label}: enter ${spec.max} or lower.` };
      }
    }
    return { ok: true, context };
  }

  function updateCardPreview(card, ann) {
    const context = buildContext(card, ann, true);
    const script = card.querySelector('[data-role="script"]');
    if (script && state.active?.card !== card) {
      script.textContent = renderTemplate(ann.template, context, 'display', 'ko');
    }
    const english = card.querySelector('[data-role="english"]');
    if (english && ann.englishTemplate) {
      english.textContent = renderTemplate(ann.englishTemplate, context, 'display', 'en');
    }
  }

  function refreshAllPreviews() {
    DATA.announcements.forEach(ann => {
      const card = els.annCatalog.querySelector(`[data-ann-id="${ann.id}"]`);
      if (card) updateCardPreview(card, ann);
    });
  }

  function scrollOpenedCardToTop(card) {
    if (!card) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const align = () => {
      const stickyHeader = document.querySelector('.app-header');
      const headerBottom = stickyHeader ? stickyHeader.getBoundingClientRect().bottom : 0;
      const targetTop = window.scrollY + card.getBoundingClientRect().top - headerBottom - 8;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    };
    // Wait until the selected card opens and the previously open card collapses.
    window.requestAnimationFrame(() => window.requestAnimationFrame(align));
  }

  function getRepeatInputClusters(ann) {
    const specs = ann.inputs || [];
    const byKey = new Map(specs.map(spec => [spec.key, spec]));
    const claimed = new Set();
    const clusters = [];

    (ann.derived || []).forEach(rule => {
      if (!rule.repeatKey || !rule.template) return;
      const repeatSpec = byKey.get(rule.repeatKey);
      if (!repeatSpec || repeatSpec.type !== 'repeat') return;

      const keys = [...rule.template.matchAll(/\{([A-Za-z0-9_]+)\}/g)]
        .map(match => match[1])
        .filter((key, index, list) => list.indexOf(key) === index && byKey.has(key) && key !== rule.repeatKey);
      const sourceSpecs = keys.map(key => byKey.get(key)).filter(Boolean);
      if (!sourceSpecs.length) return;

      const members = [...sourceSpecs, repeatSpec];
      const indices = members.map(spec => specs.indexOf(spec)).filter(index => index >= 0);
      if (!indices.length || members.some(spec => claimed.has(spec.key))) return;

      members.forEach(spec => claimed.add(spec.key));
      clusters.push({ start: Math.min(...indices), sourceSpecs, repeatSpec });
    });

    return { clusters, claimed };
  }

  function renderAnnouncementInputs(card, ann) {
    const inputArea = createEl('div', 'input-area');
    const specs = ann.inputs || [];
    const { clusters, claimed } = getRepeatInputClusters(ann);
    const clusterByStart = new Map(clusters.map(cluster => [cluster.start, cluster]));

    specs.forEach((spec, index) => {
      const cluster = clusterByStart.get(index);
      if (cluster) {
        const row = createEl('div', 'input-cluster');
        row.dataset.sourceCount = String(cluster.sourceSpecs.length);
        const sourceKeys = cluster.sourceSpecs.map(sourceSpec => sourceSpec.key);
        const isTimeCluster = sourceKeys.length === 2 && sourceKeys[0] === 'hour' && sourceKeys[1] === 'minute';

        let translateAction = null;

        if (isTimeCluster) {
          row.classList.add('time-input-cluster');
          const timeGroup = createEl('div', 'time-entry-group cluster-primary');
          const timeLabel = createEl('div', 'input-label-row');
          timeLabel.appendChild(createEl('span', 'input-label', 'Est. boarding time'));
          const timeControls = createEl('div', 'time-entry-controls');

          cluster.sourceSpecs.forEach((sourceSpec, sourceIndex) => {
            const inputGroup = renderInput(card, ann, sourceSpec);
            inputGroup.classList.add('time-part');
            const labelRow = inputGroup.querySelector('.input-label-row');
            if (labelRow) labelRow.classList.add('sr-only');
            const input = inputGroup.querySelector('[data-input-key]');
            if (input) {
              input.setAttribute('aria-label', sourceSpec.key === 'hour' ? 'Estimated boarding hour' : 'Estimated boarding minute');
              input.placeholder = sourceSpec.key === 'hour' ? 'HH' : 'MM';
            }
            timeControls.appendChild(inputGroup);
            if (sourceIndex === 0) timeControls.appendChild(createEl('span', 'time-separator', ':'));
          });

          timeGroup.append(timeLabel, timeControls);
          row.appendChild(timeGroup);
        } else {
          cluster.sourceSpecs.forEach(sourceSpec => {
            const input = renderInput(card, ann, sourceSpec);
            input.classList.add('cluster-primary');
            const translate = input.querySelector('.translate-button');
            if (translate && !translateAction) {
              translateAction = translate;
              translate.remove();
            }
            row.appendChild(input);
          });
        }

        const repeat = renderInput(card, ann, cluster.repeatSpec);
        repeat.classList.add('cluster-repeat');
        const repeatLabel = repeat.querySelector('.input-label');
        if (repeatLabel) {
          repeatLabel.textContent = 'Repeats';
          repeatLabel.title = cluster.repeatSpec.label;
        }
        if (translateAction) {
          repeat.appendChild(translateAction);
          row.classList.add('has-translate-action');
        }
        row.appendChild(repeat);
        inputArea.appendChild(row);
        return;
      }

      if (claimed.has(spec.key)) return;
      inputArea.appendChild(renderInput(card, ann, spec));
    });

    return inputArea;
  }

  function renderAnnouncementCard(ann) {
    const card = createEl('article', 'ann-card');
    card.dataset.annId = ann.id;

    if (ann.tone) card.dataset.tone = ann.tone;

    const header = createEl('button', 'card-header');
    header.type = 'button';
    header.setAttribute('aria-expanded', 'false');

    const visual = createEl('span', 'card-visual');
    visual.setAttribute('aria-hidden', 'true');
    const icon = createEl('span', 'card-icon', ann.icon || '🔊');
    const number = createEl('span', 'card-number-badge', ann.id);
    visual.append(icon, number);

    const titleBlock = createEl('span', 'card-title-block');
    const title = createEl('h3', 'card-title', ann.title);
    titleBlock.append(title);

    const chevron = createEl('span', 'card-chevron', '⌄');
    chevron.setAttribute('aria-hidden', 'true');
    header.append(visual, titleBlock, chevron);

    const body = createEl('div', 'card-body');
    body.hidden = true;

    if (ann.inputs?.length) {
      body.appendChild(renderAnnouncementInputs(card, ann));
    }

    const progress = createEl('div', 'progress-wrap');
    const progressFill = createEl('div', 'progress-fill');
    progress.appendChild(progressFill);
    body.appendChild(progress);

    if (ann.englishTemplate) {
      const toolbar = createEl('div', 'script-toolbar');
      const enBtn = createEl('button', 'mini-button english-button', 'Show English Reference');
      enBtn.type = 'button';
      toolbar.appendChild(enBtn);
      body.appendChild(toolbar);

      const englishPanel = createEl('div', 'english-reference');
      englishPanel.dataset.role = 'english';
      englishPanel.hidden = true;
      body.appendChild(englishPanel);
      enBtn.addEventListener('click', () => {
        englishPanel.hidden = !englishPanel.hidden;
        enBtn.textContent = englishPanel.hidden ? 'Show English Reference' : 'Hide English Reference';
      });
    }

    const script = createEl('p', 'script-text');
    script.dataset.role = 'script';
    body.appendChild(script);

    const validation = createEl('p', 'validation-message');
    validation.hidden = true;
    validation.dataset.role = 'validation';
    validation.setAttribute('role', 'alert');
    body.appendChild(validation);

    const player = createEl('div', 'player-row');
    const play = createEl('button', 'button button-primary play-button', '▶ Play');
    const stop = createEl('button', 'button stop-button', '■ Stop');
    play.type = stop.type = 'button';
    play.dataset.role = 'play';
    stop.dataset.role = 'stop';
    player.append(play, stop);
    body.appendChild(player);

    header.addEventListener('click', () => {
      const shouldOpen = body.hidden;
      stopSpeech();
      els.annCatalog.querySelectorAll('.ann-card').forEach(otherCard => {
        const otherBody = otherCard.querySelector('.card-body');
        const otherHeader = otherCard.querySelector('.card-header');
        if (otherBody) otherBody.hidden = true;
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      });
      if (shouldOpen) {
        body.hidden = false;
        header.setAttribute('aria-expanded', 'true');
        scrollOpenedCardToTop(card);
      }
    });

    play.addEventListener('click', () => playAnnouncement(card, ann));
    stop.addEventListener('click', () => stopSpeech());

    card.append(header, body);
    updateCardPreview(card, ann);
    return card;
  }

  function renderAnnouncements() {
    els.annCatalog.replaceChildren();
    DATA.announcements.forEach(ann => els.annCatalog.appendChild(renderAnnouncementCard(ann)));
  }

  function renderCustomAnnouncement() {
    const card = createEl('article', 'ann-card custom-card');
    card.dataset.annId = 'free';
    const labelRow = createEl('div', 'custom-input-label-row');
    const label = createEl('label', 'input-label', 'Enter the announcement text.');
    label.htmlFor = 'customText';
    const clear = createEl('button', 'mini-button custom-clear-button', '✕ Clear');
    clear.type = 'button';
    clear.disabled = true;
    clear.setAttribute('aria-label', 'Clear custom announcement text');
    const textarea = createEl('textarea', 'textarea-control');
    textarea.id = 'customText';
    textarea.rows = 5;
    textarea.placeholder = 'Korean and English can be used together.';
    textarea.spellcheck = true;
    const progress = createEl('div', 'progress-wrap');
    const fill = createEl('div', 'progress-fill');
    progress.appendChild(fill);
    const script = createEl('p', 'script-text custom-preview', 'Your text will appear here.');
    script.dataset.role = 'script';
    const validation = createEl('p', 'validation-message');
    validation.hidden = true;
    validation.dataset.role = 'validation';
    validation.setAttribute('role', 'alert');
    const player = createEl('div', 'player-row');
    const play = createEl('button', 'button button-primary play-button', '▶ Play');
    const stop = createEl('button', 'button stop-button', '■ Stop');
    play.type = stop.type = 'button';
    play.dataset.role = 'play';
    stop.dataset.role = 'stop';
    player.append(play, stop);

    let lastClearedText = '';
    const setClearMode = () => {
      clear.textContent = '✕ Clear';
      clear.dataset.mode = 'clear';
      clear.setAttribute('aria-label', 'Clear custom announcement text');
      clear.disabled = !textarea.value.trim();
    };
    const setUndoMode = () => {
      clear.textContent = '↶ Undo';
      clear.dataset.mode = 'undo';
      clear.setAttribute('aria-label', 'Restore cleared custom announcement text');
      clear.disabled = false;
    };

    textarea.addEventListener('input', () => {
      if (lastClearedText && textarea.value) lastClearedText = '';
      setClearMode();
      if (state.active?.card === card) return;
      script.textContent = textarea.value.trim() || 'Your text will appear here.';
    });
    clear.addEventListener('click', () => {
      if (clear.dataset.mode === 'undo' && lastClearedText) {
        textarea.value = lastClearedText;
        lastClearedText = '';
        script.textContent = textarea.value.trim() || 'Your text will appear here.';
        setClearMode();
        textarea.focus();
        return;
      }
      if (!textarea.value) return;
      if (state.active?.card === card) stopSpeech();
      lastClearedText = textarea.value;
      textarea.value = '';
      script.textContent = 'Your text will appear here.';
      clearValidation(card);
      setUndoMode();
      textarea.focus();
    });
    play.addEventListener('click', () => {
      if (state.active?.card === card) {
        togglePauseResume(card);
        return;
      }
      const text = textarea.value.trim();
      if (!text) {
        showValidation(card, 'Enter the announcement text.');
        return;
      }
      clearValidation(card);
      script.textContent = text;
      beginPlayback(card, text, 'auto');
    });
    stop.addEventListener('click', () => stopSpeech());

    labelRow.append(label, clear);
    card.append(labelRow, textarea, progress, script, validation, player);
    els.customAnnouncement.replaceChildren(card);
  }

  function showValidation(card, message) {
    const el = card.querySelector('[data-role="validation"]');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function clearValidation(card) {
    const el = card.querySelector('[data-role="validation"]');
    if (!el) return;
    el.textContent = '';
    el.hidden = true;
  }

  async function translateName(card, ann, input, button) {
    const query = input.value.trim();
    if (!query) {
      showValidation(card, 'Enter the passenger name first.');
      return;
    }
    clearValidation(card);
    if (translationCache.has(query)) {
      input.value = translationCache.get(query);
      updateCardPreview(card, ann);
      return;
    }
    if (navigator.onLine === false) {
      showModal('Name translation requires an internet connection.\nYou can enter the Korean pronunciation manually and use all announcement functions normally.');
      return;
    }

    const original = button.textContent;
    button.disabled = true;
    button.textContent = '…';
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|ko`;
      const response = await fetch(url, { method: 'GET', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const translated = result?.responseData?.translatedText;
      if (!translated) throw new Error('No translation result');
      const decoder = document.createElement('textarea');
      decoder.innerHTML = translated;
      input.value = decoder.value;
      translationCache.set(query, decoder.value);
      updateCardPreview(card, ann);
    } catch (error) {
      console.error('Translation failed:', error);
      showModal(`Name translation failed.\n(${error.message})\nEnter the Korean pronunciation manually.`);
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function renderHighlightText(element, text) {
    element.replaceChildren();
    const tokens = [];
    const regex = /\S+/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) element.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      const span = createEl('span', '', match[0]);
      element.appendChild(span);
      tokens.push({ span, start: match.index, end: match.index + match[0].length });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) element.appendChild(document.createTextNode(text.slice(lastIndex)));
    return tokens;
  }

  function updateHighlight(active, charIndex) {
    if (!active?.tokens?.length) return;
    let target = active.tokens.find(token => charIndex >= token.start && charIndex < token.end);
    if (!target) target = active.tokens.find(token => token.start >= charIndex) || active.tokens[active.tokens.length - 1];
    active.tokens.forEach(token => token.span.classList.toggle('hl-word', token === target));
    const pct = Math.min(100, Math.max(0, (Math.max(charIndex, target.end) / active.text.length) * 100));
    active.progress.style.width = `${pct}%`;
  }

  function selectedVoice(language) {
    const select = language === 'en' ? els.selVoiceEn : els.selVoiceKo;
    if (!select.value) return null;
    return state.voices.find(v => v.name === select.value && v.lang.toLowerCase().startsWith(language))
      || state.voices.find(v => v.name === select.value)
      || null;
  }

  function beginPlayback(card, text, forcedLanguage = 'auto') {
    if (!hasSpeech) {
      showModal('Web Speech API is not available in this browser. Try the latest Safari or a Chromium-based browser.');
      return;
    }
    stopSpeech();
    state.playbackId += 1;
    const id = state.playbackId;
    const script = card.querySelector('[data-role="script"]');
    const progress = card.querySelector('.progress-fill');
    const playButton = card.querySelector('[data-role="play"]');
    const segments = parseTextToSegments(text, forcedLanguage);
    const tokens = renderHighlightText(script, text);

    state.active = {
      id, card, text, script, progress, playButton, segments, tokens,
      segmentIndex: 0,
      status: 'playing'
    };
    progress.style.width = '0%';
    playButton.textContent = '❚❚ Pause';
    speakNextSegment(id);
  }

  function speakNextSegment(id) {
    const active = state.active;
    if (!active || active.id !== id) return;
    if (active.segmentIndex >= active.segments.length) {
      finishPlayback(id);
      return;
    }

    const segment = active.segments[active.segmentIndex];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.rate = Number.parseFloat(els.rngSpeed.value) || 1;
    utterance.pitch = Number.parseFloat(els.rngPitch.value) || 1;
    utterance.lang = segment.lang === 'en' ? 'en-US' : 'ko-KR';
    const voice = selectedVoice(segment.lang);
    if (voice) utterance.voice = voice;

    utterance.onboundary = event => {
      const current = state.active;
      if (!current || current.id !== id || typeof event.charIndex !== 'number') return;
      const globalIndex = segment.startIndex + event.charIndex;
      updateHighlight(current, globalIndex);
    };

    utterance.onend = () => {
      const current = state.active;
      if (!current || current.id !== id) return;
      const segmentEnd = segment.startIndex + segment.text.length;
      updateHighlight(current, Math.max(0, segmentEnd - 1));
      current.segmentIndex += 1;
      window.setTimeout(() => speakNextSegment(id), 10);
    };

    utterance.onerror = event => {
      const current = state.active;
      if (!current || current.id !== id) return;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      console.error('Speech error:', event.error);
      showModal(`Speech playback error: ${event.error || 'unknown'}.\nChoose another TTS voice or check the device voice settings.`);
      stopSpeech();
    };

    try {
      synth.speak(utterance);
    } catch (error) {
      console.error(error);
      showModal('Speech playback could not start. Check the device TTS settings.');
      stopSpeech();
    }
  }

  function finishPlayback(id) {
    const active = state.active;
    if (!active || active.id !== id) return;
    active.progress.style.width = '100%';
    active.playButton.textContent = '▶ Play';
    active.status = 'finished';
    const finishedCard = active.card;
    const finishedId = id;
    window.setTimeout(() => {
      if (state.active?.id === finishedId) {
        state.active = null;
        resetPlaybackUI(finishedCard);
      }
    }, 450);
  }

  function resetPlaybackUI(card) {
    if (!card) return;
    const play = card.querySelector('[data-role="play"]');
    const progress = card.querySelector('.progress-fill');
    if (play) play.textContent = '▶ Play';
    if (progress) progress.style.width = '0%';

    if (card.dataset.annId === 'free') {
      const input = card.querySelector('#customText');
      const script = card.querySelector('[data-role="script"]');
      if (script) script.textContent = input?.value.trim() || 'Your text will appear here.';
    } else {
      const ann = getAnnouncementById(card.dataset.annId);
      if (ann) updateCardPreview(card, ann);
    }
  }

  function stopSpeech() {
    state.playbackId += 1;
    const activeCard = state.active?.card || null;
    state.active = null;
    if (hasSpeech) {
      try { synth.cancel(); } catch (_) { /* noop */ }
    }
    if (activeCard) resetPlaybackUI(activeCard);
  }

  function togglePauseResume(card) {
    const active = state.active;
    if (!active || active.card !== card) return false;
    if (active.status === 'paused') {
      try { synth.resume(); } catch (_) { /* noop */ }
      active.status = 'playing';
      active.playButton.textContent = '❚❚ Pause';
      return true;
    }
    if (active.status === 'playing') {
      try { synth.pause(); } catch (_) { /* noop */ }
      active.status = 'paused';
      active.playButton.textContent = '▶ Resume';
      return true;
    }
    return false;
  }

  function playAnnouncement(card, ann) {
    if (state.active?.card === card && togglePauseResume(card)) return;
    const validation = validateAnnouncement(card, ann);
    if (!validation.ok) {
      showValidation(card, validation.message);
      return;
    }
    clearValidation(card);
    const text = renderTemplate(ann.template, validation.context, 'speech', 'ko').trim();
    if (!text) {
      showValidation(card, 'The announcement could not be generated. Check the input values.');
      return;
    }
    beginPlayback(card, text, ann.language || 'auto');
  }

  function populateVoiceSelect(select, voices, savedName, fallbackLabel) {
    select.replaceChildren();
    if (!voices.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = `${fallbackLabel} · System default`;
      select.appendChild(option);
      return;
    }
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      select.appendChild(option);
    });
    if (savedName && voices.some(v => v.name === savedName)) select.value = savedName;
  }

  function refreshVoices() {
    if (!hasSpeech) return 0;
    const seen = new Set();
    state.voices = synth.getVoices()
      .filter(voice => {
        const key = `${voice.name}|${voice.lang}|${voice.voiceURI}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const ko = state.voices.filter(v => v.lang.toLowerCase().startsWith('ko'));
    const en = state.voices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const koSaved = readPreference(STORAGE.koVoice, LEGACY_STORAGE.koVoice, '');
    const enSaved = readPreference(STORAGE.enVoice, LEGACY_STORAGE.enVoice, '');
    const currentKo = els.selVoiceKo.value || koSaved;
    const currentEn = els.selVoiceEn.value || enSaved;
    populateVoiceSelect(els.selVoiceKo, ko, currentKo, 'Korean');
    populateVoiceSelect(els.selVoiceEn, en, currentEn, 'English');

    return state.voices.length;
  }

  function loadVoices(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        const count = refreshVoices();
        if (count > 0) return resolve(count);
        if (Date.now() - started >= timeoutMs) return reject(new Error('Voice loading timed out.'));
        window.setTimeout(poll, 100);
      };
      poll();
    });
  }

  function wakeSpeechSynth() {
    if (!hasSpeech || !state.unlocked || synth.speaking || synth.paused) return;
    try {
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      utterance.rate = 1;
      synth.speak(utterance);
    } catch (_) { /* noop */ }
  }

  function wakeLockSupported() {
    return window.isSecureContext
      && 'wakeLock' in navigator
      && typeof navigator.wakeLock.request === 'function';
  }

  function updateWakeLockUi(status) {
    if (!els.wakeLockStatus) return;
    els.wakeLockStatus.textContent = status;
  }

  async function releaseScreenWakeLock() {
    const current = state.wakeLock;
    state.wakeLock = null;
    if (current && !current.released) {
      try { await current.release(); } catch (_) { /* noop */ }
    }
    updateWakeLockUi('Off');
  }

  async function requestScreenWakeLock(notifyOnFailure = false) {
    if (!state.keepAwakeEnabled || document.visibilityState !== 'visible') return;
    if (!wakeLockSupported()) {
      updateWakeLockUi('Unavailable');
      return;
    }
    if (state.wakeLock && !state.wakeLock.released) {
      updateWakeLockUi('On');
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      state.wakeLock = sentinel;
      updateWakeLockUi('On');
      sentinel.addEventListener('release', () => {
        if (state.wakeLock === sentinel) state.wakeLock = null;
        updateWakeLockUi(state.keepAwakeEnabled ? 'Paused' : 'Off');
      }, { once: true });
    } catch (error) {
      console.warn('Screen wake lock failed:', error);
      state.wakeLock = null;
      updateWakeLockUi('Unavailable');
      if (notifyOnFailure) {
        showModal('The screen-awake request could not be enabled. Keep this page visible, check battery or browser restrictions, and try again.');
      }
    }
  }

  function setKeepAwake(enabled, userInitiated = false) {
    state.keepAwakeEnabled = Boolean(enabled);
    storageSet(STORAGE.keepAwake, state.keepAwakeEnabled ? 'true' : 'false');
    if (els.chkKeepAwake) els.chkKeepAwake.checked = state.keepAwakeEnabled;

    if (!state.keepAwakeEnabled) {
      releaseScreenWakeLock();
      return;
    }
    if (!state.unlocked) {
      updateWakeLockUi('Ready');
      return;
    }
    requestScreenWakeLock(userInitiated);
  }

  function initCodeshareSetting() {
    if (!els.chkCodeshare) return;
    state.codeshareEnabled = storageGet(STORAGE.codeshare, 'false') === 'true';
    els.chkCodeshare.checked = state.codeshareEnabled;
    els.chkCodeshare.addEventListener('change', () => {
      stopSpeech();
      state.codeshareEnabled = els.chkCodeshare.checked;
      storageSet(STORAGE.codeshare, state.codeshareEnabled ? 'true' : 'false');
      renderQuickControls();
      refreshAllPreviews();
    });
  }

  function initWakeLockSetting() {
    if (!els.chkKeepAwake) return;

    if (!wakeLockSupported()) {
      els.chkKeepAwake.checked = false;
      els.chkKeepAwake.disabled = true;
      state.keepAwakeEnabled = false;
      updateWakeLockUi('Unavailable');
      return;
    }

    state.keepAwakeEnabled = storageGet(STORAGE.keepAwake, 'false') === 'true';
    els.chkKeepAwake.checked = state.keepAwakeEnabled;
    updateWakeLockUi(state.keepAwakeEnabled ? 'Ready' : 'Off');

    els.chkKeepAwake.addEventListener('change', () => {
      setKeepAwake(els.chkKeepAwake.checked, true);
    });
  }

  async function startApp() {
    if (!hasSpeech) {
      els.startStatus.textContent = 'This browser does not support the Web Speech API.';
      els.btnStart.disabled = true;
      return;
    }
    els.btnStart.disabled = true;
    els.btnStartFallback.classList.add('is-hidden');
    els.btnStart.textContent = 'Loading voice list…';
    els.startStatus.textContent = 'Checking TTS voices available to this browser.';

    try {
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      synth.speak(unlock);
    } catch (_) { /* noop */ }

    try {
      await loadVoices();
      unlockApp();
    } catch (error) {
      console.error(error);
      els.startStatus.textContent = 'The voice list could not be loaded. Check the device TTS settings and try again.';
      els.btnStart.disabled = false;
      els.btnStart.textContent = 'Try Again';
      els.btnStartFallback.classList.remove('is-hidden');
    }
  }

  function unlockApp() {
    state.unlocked = true;
    els.startOverlay.classList.add('is-hidden');
    if (state.keepAliveTimer) window.clearInterval(state.keepAliveTimer);
    state.keepAliveTimer = window.setInterval(wakeSpeechSynth, 10000);
    wakeSpeechSynth();
    if (state.keepAwakeEnabled) requestScreenWakeLock(true);
  }

  function previewSpeech(text, language) {
    if (!hasSpeech) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number.parseFloat(els.rngSpeed.value) || 1;
    utterance.pitch = Number.parseFloat(els.rngPitch.value) || 1;
    utterance.lang = language === 'en' ? 'en-US' : 'ko-KR';
    const voice = selectedVoice(language);
    if (voice) utterance.voice = voice;
    try { synth.speak(utterance); } catch (_) { showModal('Preview could not be played.'); }
  }

  function initSettings() {
    const storedSpeed = Number.parseFloat(storageGet(STORAGE.speed, '1'));
    const storedPitch = Number.parseFloat(storageGet(STORAGE.pitch, '1'));
    els.rngSpeed.value = Number.isFinite(storedSpeed) ? String(Math.min(2, Math.max(.5, storedSpeed))) : '1';
    els.rngPitch.value = Number.isFinite(storedPitch) ? String(Math.min(2, Math.max(0, storedPitch))) : '1';
    els.lblSpeed.textContent = Number.parseFloat(els.rngSpeed.value).toFixed(1);
    els.lblPitch.textContent = Number.parseFloat(els.rngPitch.value).toFixed(1);

    els.rngSpeed.addEventListener('input', () => {
      els.lblSpeed.textContent = Number.parseFloat(els.rngSpeed.value).toFixed(1);
      storageSet(STORAGE.speed, els.rngSpeed.value);
    });
    els.rngPitch.addEventListener('input', () => {
      els.lblPitch.textContent = Number.parseFloat(els.rngPitch.value).toFixed(1);
      storageSet(STORAGE.pitch, els.rngPitch.value);
    });
    els.selVoiceKo.addEventListener('change', () => storageSet(STORAGE.koVoice, els.selVoiceKo.value));
    els.selVoiceEn.addEventListener('change', () => storageSet(STORAGE.enVoice, els.selVoiceEn.value));
    els.btnPreviewKo.addEventListener('click', () => previewSpeech('안녕하세요. 한국어 음성입니다.', 'ko'));
    els.btnPreviewEn.addEventListener('click', () => previewSpeech('Hello, this is an English voice.', 'en'));
    els.btnPreviewSpeed.addEventListener('click', () => previewSpeech('현재 설정된 음성 속도입니다.', 'ko'));
    els.btnPreviewPitch.addEventListener('click', () => previewSpeech('현재 설정된 음높이입니다.', 'ko'));
    els.btnResetSpeed.addEventListener('click', () => {
      els.rngSpeed.value = '1';
      els.lblSpeed.textContent = '1.0';
      storageSet(STORAGE.speed, '1');
    });
    els.btnResetPitch.addEventListener('click', () => {
      els.rngPitch.value = '1';
      els.lblPitch.textContent = '1.0';
      storageSet(STORAGE.pitch, '1');
    });
  }

  function initPreferences() {
    const savedFlight = readPreference(STORAGE.flight, LEGACY_STORAGE.flight, DATA.flights[0]);
    const savedDest = readPreference(STORAGE.destination, LEGACY_STORAGE.destination, Object.keys(DATA.destinations)[0]);
    state.currentFlight = DATA.flights.includes(savedFlight) ? savedFlight : DATA.flights[0];
    state.currentDest = Object.prototype.hasOwnProperty.call(DATA.destinations, savedDest) ? savedDest : Object.keys(DATA.destinations)[0];
  }

  function isIOSStandaloneMode() {
    // navigator.standalone is an iOS/iPadOS Safari Home Screen property.
    // Keep the custom gesture iOS-only so normal Safari and Android can use
    // their native browser refresh behavior.
    return window.navigator.standalone === true;
  }

  function initStandalonePullToRefresh() {
    if (!isIOSStandaloneMode() || !els.pullRefreshIndicator) return;

    document.documentElement.classList.add('standalone-mode');

    const triggerDistance = 92;
    const indicatorStartDistance = 12;
    const maximumVisualPull = 74;

    let tracking = false;
    let startY = null;
    let latestTouchY = null;
    let rawPullDistance = 0;
    let visualPullDistance = 0;
    let armed = false;
    let refreshing = false;

    const pageIsAtTop = () => {
      // iOS standalone PWAs can report a negative scrollY while rubber-banding.
      // Treat every value <= 1 as the top rather than clamping it away.
      const docTop = document.scrollingElement?.scrollTop ?? 0;
      return docTop <= 1 && (window.scrollY || 0) <= 1;
    };

    const nativeOverscrollDistance = () => Math.max(0, -(window.scrollY || 0));

    const positionIndicator = () => {
      const header = document.querySelector('.app-header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      els.pullRefreshIndicator.style.top = `${Math.max(headerBottom + 8, 8)}px`;
    };

    const renderPullState = () => {
      const visible = rawPullDistance >= indicatorStartDistance || refreshing;
      els.pullRefreshIndicator.classList.toggle('is-visible', visible);
      els.pullRefreshIndicator.classList.toggle('is-armed', armed && !refreshing);
      els.pullRefreshIndicator.classList.toggle('is-refreshing', refreshing);
      els.pullRefreshIndicator.setAttribute('aria-hidden', visible ? 'false' : 'true');

      // A small translation gives direct visual feedback even when iOS itself
      // does not visibly rubber-band the standalone page.
      const offset = refreshing ? 0 : Math.min(14, visualPullDistance * 0.18);
      els.pullRefreshIndicator.style.setProperty('--pull-offset', `${offset}px`);

      if (refreshing) {
        els.pullRefreshText.textContent = 'Refreshing…';
      } else {
        els.pullRefreshText.textContent = armed ? 'Release to refresh' : 'Pull to refresh';
      }
    };

    const updatePullDistance = touchY => {
      latestTouchY = touchY;
      const fingerDistance = startY == null ? 0 : Math.max(0, touchY - startY);
      const overscrollDistance = nativeOverscrollDistance();
      rawPullDistance = Math.max(fingerDistance, overscrollDistance);
      visualPullDistance = Math.min(maximumVisualPull, rawPullDistance * 0.48);
      armed = rawPullDistance >= triggerDistance;
      renderPullState();
    };

    const resetPull = () => {
      tracking = false;
      startY = null;
      latestTouchY = null;
      rawPullDistance = 0;
      visualPullDistance = 0;
      armed = false;
      if (!refreshing) renderPullState();
    };

    const beginTracking = event => {
      if (refreshing || event.touches.length !== 1) return;
      if (!pageIsAtTop()) return;

      tracking = true;
      startY = event.touches[0].screenY;
      latestTouchY = startY;
      rawPullDistance = 0;
      visualPullDistance = 0;
      armed = false;
      positionIndicator();
      renderPullState();
    };

    const moveTracking = event => {
      if (refreshing || event.touches.length !== 1) return;

      // iOS can begin the overscroll before our first useful touchstart reaches
      // the page. If that happens, start tracking lazily during touchmove.
      if (!tracking) {
        if (!pageIsAtTop()) return;
        tracking = true;
        startY = event.touches[0].screenY;
        latestTouchY = startY;
        positionIndicator();
      }

      const touchY = event.touches[0].screenY;
      const fingerDelta = startY == null ? 0 : touchY - startY;

      if (fingerDelta < 0 && nativeOverscrollDistance() === 0) {
        resetPull();
        return;
      }

      updatePullDistance(touchY);

      // We intentionally do not depend on preventDefault() for detection.
      // When WebKit allows cancellation, preventing the default keeps the
      // gesture controlled by our UI; when it does not, negative scrollY is
      // still detected above as a fallback.
      if (rawPullDistance > 0 && event.cancelable) event.preventDefault();
    };

    const finishPull = () => {
      if (!tracking || refreshing) return;
      const shouldRefresh = armed || nativeOverscrollDistance() >= triggerDistance;

      if (!shouldRefresh) {
        resetPull();
        return;
      }

      refreshing = true;
      armed = false;
      rawPullDistance = triggerDistance;
      visualPullDistance = Math.min(maximumVisualPull, triggerDistance * 0.48);
      renderPullState();

      try { stopSpeech(); } catch (_) { /* noop */ }

      // replace() is avoided so that a normal reload semantics is preserved.
      window.setTimeout(() => window.location.reload(), 120);
    };

    const observeNativeOverscroll = () => {
      if (refreshing) return;
      const overscroll = nativeOverscrollDistance();
      if (overscroll <= 0) return;

      if (!tracking) {
        tracking = true;
        startY = latestTouchY;
        positionIndicator();
      }

      rawPullDistance = Math.max(rawPullDistance, overscroll);
      visualPullDistance = Math.min(maximumVisualPull, rawPullDistance * 0.48);
      armed = rawPullDistance >= triggerDistance;
      renderPullState();
    };

    // Bind to window rather than document. This mirrors established iOS PWA
    // pull-to-refresh workarounds and avoids document-level event quirks.
    window.addEventListener('touchstart', beginTracking, { passive: true });
    window.addEventListener('touchmove', moveTracking, { passive: false });
    window.addEventListener('touchend', finishPull, { passive: true });
    window.addEventListener('touchcancel', resetPull, { passive: true });
    window.addEventListener('scroll', observeNativeOverscroll, { passive: true });
    window.addEventListener('resize', positionIndicator, { passive: true });
    window.addEventListener('orientationchange', positionIndicator, { passive: true });
  }

  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Service worker registration failed:', error));
    });
  }

  function preventPageZoom() {
    const preventGesture = event => event.preventDefault();
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    document.addEventListener('gestureend', preventGesture, { passive: false });
    document.addEventListener('touchmove', event => {
      if (event.touches && event.touches.length > 1) event.preventDefault();
    }, { passive: false });
  }

  function init() {
    preventPageZoom();
    initStandalonePullToRefresh();
    initPreferences();
    initSettings();
    initCodeshareSetting();
    initWakeLockSetting();
    els.branchLabel.textContent = DATA.branch || 'TAG Branch';
    els.versionLabel.textContent = `Ver. ${DATA.appVersion || '—'}`;
    if (els.catalogCount) els.catalogCount.textContent = `${DATA.announcements.length} announcements`;
    renderQuickControls();
    renderAnnouncements();
    renderCustomAnnouncement();

    els.btnStart.addEventListener('click', startApp);
    els.btnStartFallback.addEventListener('click', () => {
      refreshVoices();
      unlockApp();
    });
    els.modalClose.addEventListener('click', closeModal);
    els.modal.addEventListener('click', event => { if (event.target === els.modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !els.modal.classList.contains('is-hidden')) closeModal(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshVoices();
        wakeSpeechSynth();
        if (state.keepAwakeEnabled) requestScreenWakeLock(false);
      }
    });
    if (hasSpeech && typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refreshVoices);
    } else if (hasSpeech) {
      synth.onvoiceschanged = refreshVoices;
    }

    initServiceWorker();
    if (!hasSpeech) {
      els.startStatus.textContent = 'Web Speech API is not available in this browser.';
    }
  }

  init();
})();
