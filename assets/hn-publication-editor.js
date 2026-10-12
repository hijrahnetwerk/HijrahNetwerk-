(function () {
  'use strict';

  var root = document.getElementById('blocksEditor');
  var addButton = document.getElementById('btnAddBlock');
  var typeSelect = document.getElementById('blockTypeToAdd');
  var legacyField = document.getElementById('fContent');
  if (!root || !addButton || !typeSelect || !legacyField) return;

  var blocks = [];
  var names = {
    paragraph: 'Tekst / alinea',
    heading: 'Hoofdstuktitel',
    quote: 'Uitgelicht citaat',
    callout: 'Informatiekader',
    accordion: 'Uitklapbare verdieping',
    checklist: 'Checklist',
    image: 'Afbeelding met onderschrift',
    divider: 'Scheiding',
    budget: 'Gezinsbudgetcalculator'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  function newBlock(type) {
    var block = {
      id: 'block-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      type: names[type] ? type : 'paragraph',
      text: '',
      title: '',
      attribution: '',
      items: [],
      url: '',
      alt: '',
      caption: '',
      level: 2
    };
    if (type === 'callout') block.title = 'Goed om te weten';
    if (type === 'accordion') block.title = 'Meer over dit onderwerp';
    if (type === 'budget') {
      block.title = 'Gezinsbudget inschatten';
      block.text = 'Pas de bedragen aan om een eerste maandinschatting te maken.';
    }
    return block;
  }

  function normalize(input, legacy) {
    if (Array.isArray(input) && input.length) {
      return input.filter(function (item) { return item && typeof item === 'object'; }).map(function (item) {
        var type = names[item.type] ? item.type : 'paragraph';
        var normalized = Object.assign(newBlock(type), item);
        normalized.id = item.id || normalized.id;
        normalized.type = type;
        normalized.items = Array.isArray(item.items) ? item.items.map(String) : [];
        return normalized;
      });
    }
    return String(legacy || '').split(/\n\s*\n/).map(function (text) {
      return text.trim();
    }).filter(Boolean).map(function (text) {
      var block = newBlock('paragraph');
      block.text = text;
      return block;
    });
  }

  function plainText(block) {
    if (block.type === 'heading' || block.type === 'paragraph') return block.text || '';
    if (block.type === 'quote') return [block.text, block.attribution ? '— ' + block.attribution : ''].filter(Boolean).join('\n');
    if (block.type === 'callout' || block.type === 'accordion' || block.type === 'budget') return [block.title, block.text].filter(Boolean).join('\n');
    if (block.type === 'checklist') return [block.title, (block.items || []).join('\n')].filter(Boolean).join('\n');
    if (block.type === 'image') return [block.caption, block.alt].filter(Boolean).join('\n');
    return '';
  }

  function hasContent(block) {
    if (block.type === 'divider') return true;
    if (block.type === 'image') return !!(block.url || block.caption || block.alt);
    return !!plainText(block).trim();
  }

  function syncLegacy() {
    legacyField.value = blocks.map(plainText).filter(Boolean).join('\n\n').trim();
  }

  function field(label, index, key, value, kind) {
    var val = Array.isArray(value) ? value.join('\n') : String(value == null ? '' : value);
    var attrs = ' data-block-index="' + index + '" data-block-field="' + key + '"';
    if (kind === 'textarea') {
      return '<div><label>' + esc(label) + '</label><textarea' + attrs + '>' + esc(val) + '</textarea></div>';
    }
    return '<div><label>' + esc(label) + '</label><input type="' + (kind === 'url' ? 'url' : 'text') + '"' + attrs + ' value="' + esc(val) + '"></div>';
  }

  function render() {
    if (!blocks.length) {
      root.innerHTML = '<div class="block-empty">Nog geen inhoudsblokken. Kies hierboven een bloksoort en voeg het eerste blok toe.</div>';
      syncLegacy();
      return;
    }

    root.innerHTML = blocks.map(function (block, index) {
      var fields = '';
      if (block.type === 'paragraph') fields = field('Tekst', index, 'text', block.text, 'textarea');
      if (block.type === 'heading') {
        fields = field('Hoofdstuktitel', index, 'text', block.text, 'text') +
          '<div><label>Kopniveau</label><select data-block-index="' + index + '" data-block-field="level">' +
          '<option value="2"' + (Number(block.level) === 3 ? '' : ' selected') + '>Hoofdstuk (H2)</option>' +
          '<option value="3"' + (Number(block.level) === 3 ? ' selected' : '') + '>Subhoofdstuk (H3)</option></select></div>';
      }
      if (block.type === 'quote') fields = field('Citaat', index, 'text', block.text, 'textarea') + field('Toeschrijving', index, 'attribution', block.attribution, 'text');
      if (block.type === 'callout') fields = field('Titel', index, 'title', block.title, 'text') + field('Inhoud', index, 'text', block.text, 'textarea');
      if (block.type === 'accordion') fields = field('Vraag of uitklaptitel', index, 'title', block.title, 'text') + field('Antwoord / verdieping', index, 'text', block.text, 'textarea');
      if (block.type === 'checklist') fields = field('Titel (optioneel)', index, 'title', block.title, 'text') + field('Checklist — één punt per regel', index, 'items', block.items, 'textarea');
      if (block.type === 'image') fields = field('Afbeelding-URL', index, 'url', block.url, 'url') + field('Alternatieve tekst', index, 'alt', block.alt, 'text') + field('Onderschrift', index, 'caption', block.caption, 'text');
      if (block.type === 'budget') fields = field('Titel van de tool', index, 'title', block.title, 'text') + field('Uitleg boven de calculator', index, 'text', block.text, 'textarea');
      if (block.type === 'divider') fields = '<p class="field-hint">Een rustige visuele scheiding tussen twee inhoudsdelen.</p>';

      var options = Object.keys(names).map(function (type) {
        return '<option value="' + type + '"' + (block.type === type ? ' selected' : '') + '>' + esc(names[type]) + '</option>';
      }).join('');

      return '<section class="block-card"><div class="block-card-head"><strong>Blok ' + (index + 1) + '</strong>' +
        '<select class="block-type-select" data-block-index="' + index + '" data-block-type aria-label="Bloksoort">' + options + '</select>' +
        '<button type="button" data-block-action="up" data-index="' + index + '"' + (index === 0 ? ' disabled' : '') + ' aria-label="Blok omhoog">↑</button>' +
        '<button type="button" data-block-action="down" data-index="' + index + '"' + (index === blocks.length - 1 ? ' disabled' : '') + ' aria-label="Blok omlaag">↓</button>' +
        '<button type="button" data-block-action="delete" data-index="' + index + '">Verwijderen</button></div>' +
        '<div class="block-card-body">' + fields + '</div></section>';
    }).join('');
    syncLegacy();
  }

  addButton.addEventListener('click', function () {
    blocks.push(newBlock(typeSelect.value));
    render();
    var cards = root.querySelectorAll('.block-card');
    if (cards.length) cards[cards.length - 1].scrollIntoView({behavior: 'smooth', block: 'nearest'});
  });

  root.addEventListener('input', function (event) {
    var element = event.target;
    if (!element.hasAttribute('data-block-field')) return;
    var block = blocks[Number(element.dataset.blockIndex)];
    if (!block) return;
    var key = element.dataset.blockField;
    block[key] = key === 'items' ? element.value.split('\n').map(function (item) { return item.trim(); }).filter(Boolean) : element.value;
    syncLegacy();
  });

  root.addEventListener('change', function (event) {
    var element = event.target;
    var index = Number(element.dataset.blockIndex);
    if (element.hasAttribute('data-block-type')) {
      var old = blocks[index];
      if (!old) return;
      var next = newBlock(element.value);
      next.id = old.id;
      ['text','title','attribution','url','alt','caption','level','items'].forEach(function (key) {
        var value = old[key];
        if (Array.isArray(value) ? value.length > 0 : value != null && String(value).trim() !== '') next[key] = value;
      });
      blocks[index] = next;
      render();
      return;
    }
    if (element.hasAttribute('data-block-field')) {
      var block = blocks[index];
      if (!block) return;
      var key = element.dataset.blockField;
      block[key] = key === 'items' ? element.value.split('\n').map(function (item) { return item.trim(); }).filter(Boolean) : element.value;
      syncLegacy();
    }
  });

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-block-action]');
    if (!button) return;
    var index = Number(button.dataset.index);
    var action = button.dataset.blockAction;
    if (!blocks[index]) return;
    if (action === 'delete') blocks.splice(index, 1);
    if (action === 'up' && index > 0) {
      var previous = blocks[index - 1]; blocks[index - 1] = blocks[index]; blocks[index] = previous;
    }
    if (action === 'down' && index < blocks.length - 1) {
      var next = blocks[index + 1]; blocks[index + 1] = blocks[index]; blocks[index] = next;
    }
    render();
  });

  window.HNPublicationEditor = {
    setBlocks: function (contentBlocks, legacy) {
      blocks = normalize(contentBlocks, legacy);
      render();
    },
    getBlocks: function () {
      return blocks.filter(hasContent).map(function (block) {
        var copy = Object.assign({}, block);
        copy.items = Array.isArray(block.items) ? block.items.slice() : [];
        return copy;
      });
    },
    getPlainText: function () {
      syncLegacy();
      return legacyField.value;
    }
  };

  blocks = [newBlock('paragraph')];
  render();
})();
