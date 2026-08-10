let currentDocType = 'Quote';
let currentProjectId = null;
let lineItems = [];

// Internal fallback helpers to prevent crashes if storage/calc scripts fail to load
const SafeStorage = {
  getProjects: () => {
    try { return JSON.parse(localStorage.getItem('assan_projects')) || {}; }
    catch(e) { return {}; }
  },
  saveProjects: (p) => localStorage.setItem('assan_projects', JSON.stringify(p)),
  getBranding: () => {
    try {
      return JSON.parse(localStorage.getItem('assan_branding')) || {
        name: 'Assan Balkov Electrical Contractor',
        info: '(570) 236-6942 • Lic # XXXXXXXX'
      };
    } catch(e) {
      return { name: 'Assan Balkov Electrical Contractor', info: '(570) 236-6942 • Lic # XXXXXXXX' };
    }
  },
  saveBranding: (name, info) => localStorage.setItem('assan_branding', JSON.stringify({ name, info }))
};

function safeCalculate(items, markupPct, taxPct) {
  let matSub = 0, laborSub = 0;
  (items || []).forEach(item => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const total = qty * price;
    if (item.type === 'Material') matSub += total;
    else laborSub += total;
  });
  const markupVal = matSub * ((parseFloat(markupPct) || 0) / 100);
  const taxVal = (matSub + markupVal) * ((parseFloat(taxPct) || 0) / 100);
  const grandTotal = matSub + markupVal + laborSub + taxVal;
  return { matSub, laborSub, markupVal, taxVal, grandTotal };
}

let projects = SafeStorage.getProjects();

function getPresets() {
  return window.PresetLibrary || (typeof PresetLibrary !== 'undefined' ? PresetLibrary : []);
}

document.addEventListener('DOMContentLoaded', () => {
  initBranding();
  bindEvents();
  renderLineItems();
  updateCategoryDropdown();
  refreshProjectSelector();
  updateCalculations();
});

function initBranding() {
  const brand = SafeStorage.getBranding();
  const n = document.getElementById('bizNameDisplay');
  const i = document.getElementById('bizInfoDisplay');
  if (n) n.innerText = brand.name || 'Assan Balkov Electrical Contractor';
  if (i) i.innerText = brand.info || '(570) 236-6942 • Lic # XXXXXXXX';
}

function renderLineItems() {
  const container = document.getElementById('itemsContainer');
  if (!container) return;
  container.innerHTML = '';

  if (lineItems.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-400 italic text-center py-2">No items added yet. Choose a preset above or tap + Custom Item.</div>`;
    return;
  }

  lineItems.forEach((item, i) => {
    const isCO = item.isChangeOrder || false;
    const row = document.createElement('div');
    row.className = `p-3 rounded-xl border ${isCO ? 'bg-amber-950/30 border-amber-500/60' : 'bg-slate-900 border-slate-700'} space-y-2`;
    row.innerHTML = `
      <div class="flex justify-between items-center gap-2">
        <div class="flex items-center gap-2">
          <select class="item-type bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-amber-400" data-index="${i}">
            <option value="Labor" ${item.type==='Labor'?'selected':''}>Labor</option>
            <option value="Material" ${item.type==='Material'?'selected':''}>Material</option>
          </select>
          <label class="flex items-center gap-1 text-[11px] font-bold text-amber-400 cursor-pointer">
            <input type="checkbox" class="item-change-order" data-index="${i}" ${isCO ? 'checked' : ''}>
            <span>Change Order</span>
          </label>
        </div>
        <button type="button" class="btn-remove-item text-red-400 font-bold text-xs px-1" data-index="${i}">✕ Remove</button>
      </div>
      <input type="text" value="${item.desc || ''}" placeholder="Item Description" class="item-desc w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" data-index="${i}">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label class="text-slate-400 block mb-0.5">Qty</label>
          <input type="number" value="${item.qty !== undefined ? item.qty : 1}" min="0" class="item-qty w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold" data-index="${i}">
        </div>
        <div>
          <label class="text-slate-400 block mb-0.5">Unit Cost ($)</label>
          <input type="number" value="${item.unitPrice !== undefined ? item.unitPrice : 0}" min="0" class="item-price w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold" data-index="${i}">
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  attachLineItemListeners();
}

function attachLineItemListeners() {
  document.querySelectorAll('.item-type').forEach(el => {
    el.onchange = (e) => { lineItems[e.target.dataset.index].type = e.target.value; updateCalculations(); };
  });
  document.querySelectorAll('.item-change-order').forEach(el => {
    el.onchange = (e) => { lineItems[e.target.dataset.index].isChangeOrder = e.target.checked; updateCalculations(); };
  });
  document.querySelectorAll('.item-desc').forEach(el => {
    el.oninput = (e) => { lineItems[e.target.dataset.index].desc = e.target.value; updateCalculations(); };
  });
  document.querySelectorAll('.item-qty').forEach(el => {
    el.oninput = (e) => { lineItems[e.target.dataset.index].qty = parseFloat(e.target.value) || 0; updateCalculations(); };
  });
  document.querySelectorAll('.item-price').forEach(el => {
    el.oninput = (e) => { lineItems[e.target.dataset.index].unitPrice = parseFloat(e.target.value) || 0; updateCalculations(); };
  });
  document.querySelectorAll('.btn-remove-item').forEach(el => {
    el.onclick = (e) => { lineItems.splice(e.target.dataset.index, 1); renderLineItems(); updateCalculations(); };
  });
}

function updateCategoryDropdown() {
  const tradeEl = document.getElementById('tradeSelector');
  const catSelect = document.getElementById('presetCategory');
  if (!tradeEl || !catSelect) return;

  const trade = tradeEl.value || 'electrical';
  catSelect.innerHTML = '<option value="all">-- All Categories --</option>';

  const categoryMaps = {
    electrical: [
      { val: 'outlets', label: 'Outlets & Switches' },
      { val: 'lighting', label: 'Interior & Exterior Lighting' },
      { val: 'panels', label: 'Service Panels & Upgrades' },
      { val: 'heavy', label: 'EV Chargers & 240V Heavy Lines' },
      { val: 'repairs', label: 'Safety, Rewiring & Repairs' }
    ],
    framing_drywall: [
      { val: 'framing', label: 'Wall & Door Framing' },
      { val: 'drywall', label: 'Drywall, Trim & Finishing' }
    ],
    plumbing: [
      { val: 'fixtures', label: 'Faucets, Sinks & Toilets' },
      { val: 'pipes', label: 'Pipes & Water Shutoffs' },
      { val: 'drains', label: 'Drain Snaking & Clearing' },
      { val: 'water_heaters', label: 'Water Heaters & Filtration' },
      { val: 'repairs', label: 'Valves & Appliance Hookups' }
    ],
    handyman: [
      { val: 'assembly', label: 'TV Mounting & Assembly' },
      { val: 'doors_windows', label: 'Doors, Windows & Hardware' },
      { val: 'general', label: 'General Repairs & Caulking' }
    ]
  };

  if (categoryMaps[trade]) {
    categoryMaps[trade].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.val;
      opt.innerText = c.label;
      catSelect.appendChild(opt);
    });
  }

  populatePresetDropdown();
}

function populatePresetDropdown() {
  const tradeEl = document.getElementById('tradeSelector');
  const catSelect = document.getElementById('presetCategory');
  const presetSelect = document.getElementById('presetSelector');

  if (!tradeEl || !catSelect || !presetSelect) return;

  const trade = tradeEl.value || 'electrical';
  const cat = catSelect.value || 'all';
  const lib = getPresets();

  presetSelect.innerHTML = '<option value="">-- Choose an Item to Add --</option>';

  const filtered = lib.filter(item => {
    const matchesTrade = item.trade === trade;
    const matchesCategory = cat === 'all' || item.category === cat;
    return matchesTrade && matchesCategory;
  });

  filtered.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `[${item.type}] ${item.desc} - $${(item.unitPrice || 0).toFixed(2)}`;
    opt.setAttribute('data-desc', item.desc);
    opt.setAttribute('data-qty', item.qty || 1);
    opt.setAttribute('data-price', item.unitPrice || 0);
    opt.setAttribute('data-type', item.type || 'Labor');
    presetSelect.appendChild(opt);
  });
}

function addSelectedPresetItem() {
  const presetSelect = document.getElementById('presetSelector');
  if (!presetSelect) return;
  const opt = presetSelect.options[presetSelect.selectedIndex];
  if (!opt || !opt.getAttribute('data-desc')) return;

  lineItems.push({
    desc: opt.getAttribute('data-desc'),
    qty: parseFloat(opt.getAttribute('data-qty')) || 1,
    unitPrice: parseFloat(opt.getAttribute('data-price')) || 0,
    type: opt.getAttribute('data-type') || 'Labor',
    isChangeOrder: false
  });

  presetSelect.selectedIndex = 0;
  renderLineItems();
  updateCalculations();
}

function updateCalculations() {
  const markup = document.getElementById('markupPct')?.value || 15;
  const tax = document.getElementById('taxPct')?.value || 6;
  const depPct = parseFloat(document.getElementById('depositPct')?.value) || 0;

  const miles = parseFloat(document.getElementById('mileageMiles')?.value) || 0;
  const mileRate = parseFloat(document.getElementById('mileageRate')?.value) || 0;
  const travelFee = miles * mileRate;

  const totals = safeCalculate(lineItems, markup, tax);
  const grandTotalWithTravel = totals.grandTotal + travelFee;

  const depositVal = grandTotalWithTravel * (depPct / 100);
  const balanceVal = grandTotalWithTravel - depositVal;

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setTxt('dispMat', `$${totals.matSub.toFixed(2)}`);
  setTxt('dispMarkup', `$${totals.markupVal.toFixed(2)}`);
  setTxt('dispLabor', `$${totals.laborSub.toFixed(2)}`);
  setTxt('dispTravel', `$${travelFee.toFixed(2)}`);
  setTxt('dispTax', `$${totals.taxVal.toFixed(2)}`);
  setTxt('dispGrandTotal', `$${grandTotalWithTravel.toFixed(2)}`);
  setTxt('dispDepositVal', `$${depositVal.toFixed(2)}`);
  setTxt('dispBalanceVal', `$${balanceVal.toFixed(2)}`);

  const brand = SafeStorage.getBranding();
  setTxt('docBizName', brand.name || 'Assan Balkov Electrical Contractor');
  setTxt('docBizInfo', brand.info || '(570) 236-6942 • Lic # XXXXXXXX');
  setTxt('docType', `OFFICIAL ${currentDocType.toUpperCase()}`);
  setTxt('docDate', new Date().toLocaleDateString());
  setTxt('docClientName', document.getElementById('clientName')?.value || 'Valued Customer');
  setTxt('docJobScope', document.getElementById('projectName')?.value || 'Electrical Work Scope');

  const tbody = document.getElementById('docTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    if (lineItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 12px; text-align: center; font-style: italic; color: #64748b;">No line items added yet.</td></tr>`;
    } else {
      lineItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #cbd5e1";
        const isCO = item.isChangeOrder;
        tr.innerHTML = `
          <td style="padding: 6px 2px; text-align: left;">
            ${item.desc}
            ${isCO ? '<span style="display:inline-block; font-size: 8px; font-weight: bold; background: #f59e0b; color: #000; padding: 1px 4px; border-radius: 3px; margin-left: 4px;">CHANGE ORDER</span>' : ''}
          </td>
          <td style="padding: 6px 2px; text-align: center;">${item.type}</td>
          <td style="padding: 6px 2px; text-align: center;">${item.qty}</td>
          <td style="padding: 6px 2px; text-align: right;">$${(item.unitPrice || 0).toFixed(2)}</td>
          <td style="padding: 6px 2px; text-align: right;">$${((item.qty || 1) * (item.unitPrice || 0)).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  setTxt('docSubtotal', `$${(totals.matSub + totals.laborSub).toFixed(2)}`);
  setTxt('docTravelFee', `$${travelFee.toFixed(2)}`);
  setTxt('docTaxMarkup', `$${(totals.markupVal + totals.taxVal).toFixed(2)}`);
  setTxt('docGrandTotal', `$${grandTotalWithTravel.toFixed(2)}`);
  setTxt('docDepositLabel', `${depPct}%`);
  setTxt('docDepositVal', `$${depositVal.toFixed(2)}`);
  setTxt('docBalanceVal', `$${balanceVal.toFixed(2)}`);

  updateEmailLink(brand, totals, grandTotalWithTravel, depositVal, balanceVal);

  return { ...totals, travelFee, grandTotalWithTravel, depositVal, balanceVal };
}

function updateEmailLink(brand, totals, grandTotal, depositVal, balanceVal) {
  const clientName = document.getElementById('clientName')?.value || 'Customer';
  const clientEmail = document.getElementById('clientEmail')?.value || '';
  const proj = document.getElementById('projectName')?.value || 'Electrical Work';

  let summary = '';
  lineItems.forEach(item => {
    summary += `• ${item.desc} ${item.isChangeOrder ? '[CHANGE ORDER]' : ''} (${item.qty} x $${(item.unitPrice || 0).toFixed(2)}) = $${((item.qty || 1) * (item.unitPrice || 0)).toFixed(2)}\n`;
  });

  const body = 
`Hello ${clientName},

Below are the project details and estimate breakdown for: ${proj}.

--- ITEMIZED BREAKDOWN ---
${summary}
Subtotal: $${(totals.matSub + totals.laborSub).toFixed(2)}
Travel Fee: $${totals.travelFee.toFixed(2)}
Tax & Overhead: $${(totals.markupVal + totals.taxVal).toFixed(2)}
---------------------------
TOTAL AMOUNT: $${grandTotal.toFixed(2)}
Deposit Due Now: $${depositVal.toFixed(2)}
Balance Upon Completion: $${balanceVal.toFixed(2)}

Payment Method Accepted: CHECK OR CASH ONLY.

Please reply directly to this email if you have any questions or are ready to approve.

Best regards,
${brand.name || 'Assan Balkov Electrical Contractor'}
${brand.info || '(570) 236-6942'}`;

  const mailto = `mailto:${encodeURIComponent(clientEmail)}?subject=${encodeURIComponent('Official ' + currentDocType + ': ' + proj)}&body=${encodeURIComponent(body)}`;
  const btn = document.getElementById('btnSendEmail');
  if (btn) btn.setAttribute('href', mailto);
}

function bindEvents() {
  const bind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  bind('btnAddLineItem', 'click', (e) => {
    e.preventDefault();
    lineItems.push({ desc: '', qty: 1, unitPrice: 0, type: 'Material', isChangeOrder: false });
    renderLineItems();
    updateCalculations();
  });

  bind('tradeSelector', 'change', updateCategoryDropdown);
  bind('presetCategory', 'change', populatePresetDropdown);
  bind('btnAddPreset', 'click', addSelectedPresetItem);
  bind('presetSelector', 'change', addSelectedPresetItem);

  bind('clientName', 'input', updateCalculations);
  bind('clientEmail', 'input', updateCalculations);
  bind('projectName', 'input', updateCalculations);
  bind('activeJobTitle', 'input', updateCalculations);

  bind('mileageMiles', 'input', updateCalculations);
  bind('mileageRate', 'input', updateCalculations);

  bind('btnQuote', 'click', () => setDocumentType('Quote'));
  bind('btnInvoice', 'click', () => setDocumentType('Invoice'));

  bind('btnSaveProject', 'click', saveCurrentProject);
  bind('btnNewProject', 'click', createNewProject);
  bind('btnArchiveProject', 'click', archiveCurrentProject);
  bind('projectSelector', 'change', loadSelectedProject);

  bind('btnPrintPDF', 'click', () => {
    updateCalculations();
    window.print();
  });

  bind('btnOpenSettings', 'click', toggleSettingsModal);
  bind('btnCancelSettings', 'click', toggleSettingsModal);
  bind('btnSaveSettings', 'click', saveBusinessSettings);

  bind('markupPct', 'input', updateCalculations);
  bind('taxPct', 'input', updateCalculations);
  bind('depositPct', 'change', updateCalculations);
  bind('projectStatus', 'change', updateCalculations);
}

function setDocumentType(type) {
  currentDocType = type;
  const btnQ = document.getElementById('btnQuote');
  const btnI = document.getElementById('btnInvoice');
  if (btnQ) btnQ.className = type === 'Quote' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  if (btnI) btnI.className = type === 'Invoice' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  updateCalculations();
}

function refreshProjectSelector() {
  const sel = document.getElementById('projectSelector');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Load Saved Job --</option>';
  Object.keys(projects).forEach(id => {
    const p = projects[id];
    const opt = document.createElement('option');
    opt.value = id;
    const title = p.activeJobTitle || p.projectName || 'Unnamed Job';
    opt.innerText = `[${p.status || 'Draft'}] ${title}`;
    if (id === currentProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function saveCurrentProject() {
  if (!currentProjectId) currentProjectId = 'job_' + Date.now();

  projects[currentProjectId] = {
    id: currentProjectId,
    activeJobTitle: document.getElementById('activeJobTitle')?.value || '',
    clientName: document.getElementById('clientName')?.value || '',
    clientEmail: document.getElementById('clientEmail')?.value || '',
    projectName: document.getElementById('projectName')?.value || '',
    docType: currentDocType,
    status: document.getElementById('projectStatus')?.value || 'Draft',
    markupPct: document.getElementById('markupPct')?.value || 15,
    taxPct: document.getElementById('taxPct')?.value || 6,
    mileageMiles: document.getElementById('mileageMiles')?.value || 0,
    mileageRate: document.getElementById('mileageRate')?.value || 0.67,
    depositPct: document.getElementById('depositPct')?.value || 50,
    lineItems: lineItems
  };

  SafeStorage.saveProjects(projects);
  refreshProjectSelector();
  alert('Job Estimate Saved!');
}

function loadSelectedProject() {
  const sel = document.getElementById('projectSelector');
  if (!sel) return;
  const id = sel.value;
  if (!id || !projects[id]) return;

  currentProjectId = id;
  const p = projects[id];

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('activeJobTitle', p.activeJobTitle || '');
  setVal('clientName', p.clientName || '');
  setVal('clientEmail', p.clientEmail || '');
  setVal('projectName', p.projectName || '');
  setVal('projectStatus', p.status || 'Draft');
  setVal('markupPct', p.markupPct || 15);
  setVal('taxPct', p.taxPct || 6);
  setVal('mileageMiles', p.mileageMiles || 0);
  setVal('mileageRate', p.mileageRate || 0.67);
  setVal('depositPct', p.depositPct || 50);

  lineItems = p.lineItems || [];
  setDocumentType(p.docType || 'Quote');
  renderLineItems();
  updateCalculations();
}

function createNewProject() {
  currentProjectId = null;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('activeJobTitle', '');
  setVal('clientName', '');
  setVal('clientEmail', '');
  setVal('projectName', '');
  setVal('projectStatus', 'Draft');
  setVal('mileageMiles', 0);
  setVal('projectSelector', '');
  lineItems = [];
  renderLineItems();
  updateCalculations();
}

function archiveCurrentProject() {
  if (!currentProjectId) return;
  delete projects[currentProjectId];
  SafeStorage.saveProjects(projects);
  createNewProject();
  refreshProjectSelector();
}

function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  const brand = SafeStorage.getBranding();
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('editBizName', brand.name || 'Assan Balkov Electrical Contractor');
  setVal('editBizInfo', brand.info || '(570) 236-6942 • Lic # XXXXXXXX');
}

function saveBusinessSettings() {
  const n = document.getElementById('editBizName')?.value;
  const i = document.getElementById('editBizInfo')?.value;
  SafeStorage.saveBranding(n, i);
  initBranding();
  toggleSettingsModal();
}