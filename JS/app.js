let currentDocType = 'Quote';
let currentProjectId = null;
let projects = StorageManager.getProjects();

let lineItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initBranding();
  bindEvents();
  renderLineItems();
  updateCategoryDropdown();
  refreshProjectSelector();
  updateCalculations();
});

function initBranding() {
  const brand = StorageManager.getBranding();
  const defaultName = 'Assan Balkov Electrical Contractor';
  const defaultInfo = '(570) 236-6942 • Lic # XXXXXXXX';

  document.getElementById('bizNameDisplay').innerText = brand.name || defaultName;
  document.getElementById('bizInfoDisplay').innerText = brand.info || defaultInfo;
}

function renderLineItems() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  if (lineItems.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-400 italic text-center py-2">No items added yet. Choose a preset above or tap + Custom Item.</div>`;
    return;
  }

  lineItems.forEach((item, i) => {
    const isChangeOrder = item.isChangeOrder || false;
    const row = document.createElement('div');
    row.className = `p-3 rounded-xl border ${isChangeOrder ? 'bg-amber-950/30 border-amber-500/60' : 'bg-slate-900 border-slate-700'} space-y-2`;
    row.innerHTML = `
      <div class="flex justify-between items-center gap-2">
        <div class="flex items-center gap-2">
          <select class="item-type bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-amber-400" data-index="${i}">
            <option value="Labor" ${item.type==='Labor'?'selected':''}>Labor</option>
            <option value="Material" ${item.type==='Material'?'selected':''}>Material</option>
          </select>
          <label class="flex items-center gap-1 text-[11px] font-bold text-amber-400 cursor-pointer">
            <input type="checkbox" class="item-change-order" data-index="${i}" ${isChangeOrder ? 'checked' : ''}>
            <span>Change Order</span>
          </label>
        </div>
        <button class="btn-remove-item text-red-400 font-bold text-xs px-1" data-index="${i}">✕ Remove</button>
      </div>
      <input type="text" value="${item.desc}" placeholder="Description" class="item-desc w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white" data-index="${i}">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label class="text-slate-400 block mb-0.5">Qty</label>
          <input type="number" value="${item.qty}" min="0" class="item-qty w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold" data-index="${i}">
        </div>
        <div>
          <label class="text-slate-400 block mb-0.5">Unit Cost ($)</label>
          <input type="number" value="${item.unitPrice}" min="0" class="item-price w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold" data-index="${i}">
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  attachLineItemListeners();
}

function attachLineItemListeners() {
  document.querySelectorAll('.item-type').forEach(el => {
    el.addEventListener('change', (e) => {
      lineItems[e.target.dataset.index].type = e.target.value;
      updateCalculations();
    });
  });

  document.querySelectorAll('.item-change-order').forEach(el => {
    el.addEventListener('change', (e) => {
      lineItems[e.target.dataset.index].isChangeOrder = e.target.checked;
      renderLineItems();
      updateCalculations();
    });
  });

  document.querySelectorAll('.item-desc').forEach(el => {
    el.addEventListener('change', (e) => {
      lineItems[e.target.dataset.index].desc = e.target.value;
      updateCalculations();
    });
  });

  document.querySelectorAll('.item-qty').forEach(el => {
    el.addEventListener('input', (e) => {
      lineItems[e.target.dataset.index].qty = parseFloat(e.target.value) || 0;
      updateCalculations();
    });
  });

  document.querySelectorAll('.item-price').forEach(el => {
    el.addEventListener('input', (e) => {
      lineItems[e.target.dataset.index].unitPrice = parseFloat(e.target.value) || 0;
      updateCalculations();
    });
  });

  document.querySelectorAll('.btn-remove-item').forEach(el => {
    el.addEventListener('click', (e) => {
      lineItems.splice(e.target.dataset.index, 1);
      renderLineItems();
      updateCalculations();
    });
  });
}

function updateCategoryDropdown() {
  const trade = document.getElementById('tradeSelector').value;
  const catSelect = document.getElementById('presetCategory');
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
  const trade = document.getElementById('tradeSelector').value;
  const catSelect = document.getElementById('presetCategory').value;
  const presetSelect = document.getElementById('presetSelector');

  if (!presetSelect || typeof PresetLibrary === 'undefined') return;

  presetSelect.innerHTML = '<option value="">-- Choose an Item to Add --</option>';

  const filtered = PresetLibrary.filter(item => {
    const matchesTrade = item.trade === trade;
    const matchesCategory = catSelect === 'all' || item.category === catSelect;
    return matchesTrade && matchesCategory;
  });

  filtered.forEach((item, idx) => {
    const opt = document.createElement('option');
    opt.value = idx;
    opt.innerText = `[${item.type}] ${item.desc} - $${item.unitPrice.toFixed(2)}`;
    opt.setAttribute('data-desc', item.desc);
    opt.setAttribute('data-qty', item.qty);
    opt.setAttribute('data-price', item.unitPrice);
    opt.setAttribute('data-type', item.type);
    presetSelect.appendChild(opt);
  });
}

function addSelectedPresetItem() {
  const presetSelect = document.getElementById('presetSelector');
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
  const markup = document.getElementById('markupPct').value;
  const tax = document.getElementById('taxPct').value;
  const depPct = parseFloat(document.getElementById('depositPct').value) || 0;

  const miles = parseFloat(document.getElementById('mileageMiles').value) || 0;
  const mileRate = parseFloat(document.getElementById('mileageRate').value) || 0;
  const travelFee = miles * mileRate;

  const totals = Calculator.calculateTotals(lineItems, markup, tax);
  const grandTotalWithTravel = totals.grandTotal + travelFee;

  const depositVal = grandTotalWithTravel * (depPct / 100);
  const balanceVal = grandTotalWithTravel - depositVal;

  // 1. Update On-Screen Display Controls
  document.getElementById('dispMat').innerText = `$${totals.matSub.toFixed(2)}`;
  document.getElementById('dispMarkup').innerText = `$${totals.markupVal.toFixed(2)}`;
  document.getElementById('dispLabor').innerText = `$${totals.laborSub.toFixed(2)}`;
  document.getElementById('dispTravel').innerText = `$${travelFee.toFixed(2)}`;
  document.getElementById('dispTax').innerText = `$${totals.taxVal.toFixed(2)}`;
  document.getElementById('dispGrandTotal').innerText = `$${grandTotalWithTravel.toFixed(2)}`;

  document.getElementById('dispDepositVal').innerText = `$${depositVal.toFixed(2)}`;
  document.getElementById('dispBalanceVal').innerText = `$${balanceVal.toFixed(2)}`;

  // 2. Update Live Document Preview Sheet
  const brand = StorageManager.getBranding();
  document.getElementById('docBizName').innerText = brand.name || 'Assan Balkov Electrical Contractor';
  document.getElementById('docBizInfo').innerText = brand.info || '(570) 236-6942 • Lic # XXXXXXXX';
  document.getElementById('docType').innerText = `OFFICIAL ${currentDocType.toUpperCase()}`;
  document.getElementById('docDate').innerText = new Date().toLocaleDateString();
  document.getElementById('docClientName').innerText = document.getElementById('clientName').value || 'Valued Customer';
  document.getElementById('docJobScope').innerText = document.getElementById('projectName').value || 'Electrical Work Scope';

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
          <td style="padding: 6px 2px; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 6px 2px; text-align: right;">$${(item.qty * item.unitPrice).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  document.getElementById('docSubtotal').innerText = `$${(totals.matSub + totals.laborSub).toFixed(2)}`;
  document.getElementById('docTravelFee').innerText = `$${travelFee.toFixed(2)}`;
  document.getElementById('docTaxMarkup').innerText = `$${(totals.markupVal + totals.taxVal).toFixed(2)}`;
  document.getElementById('docGrandTotal').innerText = `$${grandTotalWithTravel.toFixed(2)}`;

  document.getElementById('docDepositLabel').innerText = `${depPct}%`;
  document.getElementById('docDepositVal').innerText = `$${depositVal.toFixed(2)}`;
  document.getElementById('docBalanceVal').innerText = `$${balanceVal.toFixed(2)}`;

  return { ...totals, travelFee, grandTotalWithTravel, depositVal, balanceVal };
}

function bindEvents() {
  document.getElementById('btnAddLineItem').addEventListener('click', () => {
    lineItems.push({ desc: '', qty: 1, unitPrice: 0, type: 'Material', isChangeOrder: false });
    renderLineItems();
    updateCalculations();
  });

  document.getElementById('tradeSelector').addEventListener('change', updateCategoryDropdown);
  document.getElementById('presetCategory').addEventListener('change', populatePresetDropdown);
  document.getElementById('btnAddPreset').addEventListener('click', addSelectedPresetItem);
  document.getElementById('presetSelector').addEventListener('change', addSelectedPresetItem);

  document.getElementById('clientName').addEventListener('input', updateCalculations);
  document.getElementById('projectName').addEventListener('input', updateCalculations);

  document.getElementById('mileageMiles').addEventListener('input', updateCalculations);
  document.getElementById('mileageRate').addEventListener('input', updateCalculations);

  document.getElementById('btnQuote').addEventListener('click', () => setDocumentType('Quote'));
  document.getElementById('btnInvoice').addEventListener('click', () => setDocumentType('Invoice'));

  document.getElementById('btnSaveProject').addEventListener('click', saveCurrentProject);
  document.getElementById('btnNewProject').addEventListener('click', createNewProject);
  document.getElementById('btnArchiveProject').addEventListener('click', archiveCurrentProject);
  document.getElementById('projectSelector').addEventListener('change', loadSelectedProject);

  document.getElementById('btnSendEmail').addEventListener('click', sendEmailDoc);
  document.getElementById('btnPrintPDF').addEventListener('click', printIsolatedDocument);

  document.getElementById('btnOpenSettings').addEventListener('click', toggleSettingsModal);
  document.getElementById('btnCancelSettings').addEventListener('click', toggleSettingsModal);
  document.getElementById('btnSaveSettings').addEventListener('click', saveBusinessSettings);

  document.getElementById('markupPct').addEventListener('input', updateCalculations);
  document.getElementById('taxPct').addEventListener('input', updateCalculations);
  document.getElementById('depositPct').addEventListener('change', updateCalculations);
  document.getElementById('projectStatus').addEventListener('change', updateCalculations);
}

function setDocumentType(type) {
  currentDocType = type;
  document.getElementById('btnQuote').className = type === 'Quote' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  document.getElementById('btnInvoice').className = type === 'Invoice' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  updateCalculations();
}

function refreshProjectSelector() {
  const sel = document.getElementById('projectSelector');
  sel.innerHTML = '<option value="">-- Load Saved Job --</option>';
  Object.keys(projects).forEach(id => {
    const p = projects[id];
    const opt = document.createElement('option');
    opt.value = id;
    opt.innerText = `[${p.status || 'Draft'}] ${p.projectName || 'Unnamed Job'}`;
    if (id === currentProjectId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function saveCurrentProject() {
  if (!currentProjectId) currentProjectId = 'job_' + Date.now();

  projects[currentProjectId] = {
    id: currentProjectId,
    clientName: document.getElementById('clientName').value,
    clientEmail: document.getElementById('clientEmail').value,
    projectName: document.getElementById('projectName').value,
    docType: currentDocType,
    status: document.getElementById('projectStatus').value,
    markupPct: document.getElementById('markupPct').value,
    taxPct: document.getElementById('taxPct').value,
    mileageMiles: document.getElementById('mileageMiles').value,
    mileageRate: document.getElementById('mileageRate').value,
    depositPct: document.getElementById('depositPct').value,
    lineItems: lineItems
  };

  StorageManager.saveProjects(projects);
  refreshProjectSelector();
  alert('Job Estimate Saved!');
}

function loadSelectedProject() {
  const id = document.getElementById('projectSelector').value;
  if (!id || !projects[id]) return;

  currentProjectId = id;
  const p = projects[id];

  document.getElementById('clientName').value = p.clientName || '';
  document.getElementById('clientEmail').value = p.clientEmail || '';
  document.getElementById('projectName').value = p.projectName || '';
  document.getElementById('projectStatus').value = p.status || 'Draft';
  document.getElementById('markupPct').value = p.markupPct || 15;
  document.getElementById('taxPct').value = p.taxPct || 6;
  document.getElementById('mileageMiles').value = p.mileageMiles || 0;
  document.getElementById('mileageRate').value = p.mileageRate || 0.67;
  document.getElementById('depositPct').value = p.depositPct || 50;

  lineItems = p.lineItems || [];
  setDocumentType(p.docType || 'Quote');
  renderLineItems();
  updateCalculations();
}

function createNewProject() {
  currentProjectId = null;
  document.getElementById('clientName').value = '';
  document.getElementById('clientEmail').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectStatus').value = 'Draft';
  document.getElementById('mileageMiles').value = 0;
  lineItems = [];
  document.getElementById('projectSelector').value = '';
  renderLineItems();
  updateCalculations();
}

function archiveCurrentProject() {
  if (!currentProjectId) return;
  delete projects[currentProjectId];
  StorageManager.saveProjects(projects);
  createNewProject();
  refreshProjectSelector();
}

function printIsolatedDocument() {
  updateCalculations();
  const docHtml = document.getElementById('documentSheet').outerHTML;

  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!printWindow) {
    alert('Please allow popups for this app to print/save your document.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${currentDocType} - ${document.getElementById('clientName').value || 'Customer'}</title>
        <style>
          @page { size: portrait; margin: 0.4in; }
          body { font-family: Arial, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 10px; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
        ${docHtml}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

function sendEmailDoc() {
  const brand = StorageManager.getBranding();
  const clientName = document.getElementById('clientName').value || 'Customer';
  const clientEmail = document.getElementById('clientEmail').value;
  const proj = document.getElementById('projectName').value || 'Electrical Work';
  const totals = updateCalculations();

  let summary = '';
  lineItems.forEach(item => {
    summary += `• ${item.desc} ${item.isChangeOrder ? '[CHANGE ORDER]' : ''} (${item.qty} x $${item.unitPrice.toFixed(2)}) = $${(item.qty * item.unitPrice).toFixed(2)}\n`;
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
TOTAL AMOUNT: $${totals.grandTotalWithTravel.toFixed(2)}
Deposit Due Now: $${totals.depositVal.toFixed(2)}
Balance Upon Completion: $${totals.balanceVal.toFixed(2)}

Payment Method Accepted: CHECK OR CASH ONLY.

Please reply directly to this email if you have any questions or are ready to approve.

Best regards,
${brand.name || 'Assan Balkov Electrical Contractor'}
${brand.info || '(570) 236-6942'}`;

  const mailto = `mailto:${clientEmail}?subject=${encodeURIComponent('Official ' + currentDocType + ': ' + proj)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.toggle('hidden');
  const brand = StorageManager.getBranding();
  document.getElementById('editBizName').value = brand.name || 'Assan Balkov Electrical Contractor';
  document.getElementById('editBizInfo').value = brand.info || '(570) 236-6942 • Lic # XXXXXXXX';
}

function saveBusinessSettings() {
  const n = document.getElementById('editBizName').value;
  const i = document.getElementById('editBizInfo').value;
  StorageManager.saveBranding(n, i);
  initBranding();
  toggleSettingsModal();
}