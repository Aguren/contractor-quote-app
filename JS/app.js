let currentDocType = 'Quote';
let currentProjectId = null;
let projects = StorageManager.getProjects();

let lineItems = [
  { desc: '200A Main Service Panel Upgrade', qty: 1, unitPrice: 1850, type: 'Labor' },
  { desc: '12/2 ROMEX Wire (250ft Roll)', qty: 1, unitPrice: 145, type: 'Material' }
];

document.addEventListener('DOMContentLoaded', () => {
  initBranding();
  bindEvents();
  renderLineItems();
  refreshProjectSelector();
  updateCalculations();
});

function initBranding() {
  const brand = StorageManager.getBranding();
  document.getElementById('bizNameDisplay').innerText = brand.name;
  document.getElementById('bizInfoDisplay').innerText = brand.info;
}

function renderLineItems() {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  lineItems.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = "bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2";
    row.innerHTML = `
      <div class="flex justify-between items-center">
        <select class="item-type bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-amber-400" data-index="${i}">
          <option value="Labor" ${item.type==='Labor'?'selected':''}>Labor</option>
          <option value="Material" ${item.type==='Material'?'selected':''}>Material</option>
        </select>
        <button class="btn-remove-item text-red-400 font-bold text-sm px-2" data-index="${i}">✕ Remove</button>
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

function updateCalculations() {
  const markup = document.getElementById('markupPct').value;
  const tax = document.getElementById('taxPct').value;
  const totals = Calculator.calculateTotals(lineItems, markup, tax);

  document.getElementById('dispMat').innerText = `$${totals.matSub.toFixed(2)}`;
  document.getElementById('dispMarkup').innerText = `$${totals.markupVal.toFixed(2)}`;
  document.getElementById('dispLabor').innerText = `$${totals.laborSub.toFixed(2)}`;
  document.getElementById('dispTax').innerText = `$${totals.taxVal.toFixed(2)}`;
  document.getElementById('dispGrandTotal').innerText = `$${totals.grandTotal.toFixed(2)}`;

  return totals;
}

function bindEvents() {
  document.getElementById('btnAddLineItem').addEventListener('click', () => {
    lineItems.push({ desc: '', qty: 1, unitPrice: 0, type: 'Material' });
    renderLineItems();
    updateCalculations();
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const [desc, qty, unitPrice, type] = e.target.closest('button').dataset.preset.split(',');
      lineItems.push({ desc, qty: parseFloat(qty), unitPrice: parseFloat(unitPrice), type });
      renderLineItems();
      updateCalculations();
    });
  });

  document.getElementById('btnQuote').addEventListener('click', () => setDocumentType('Quote'));
  document.getElementById('btnInvoice').addEventListener('click', () => setDocumentType('Invoice'));

  document.getElementById('btnSaveProject').addEventListener('click', saveCurrentProject);
  document.getElementById('btnNewProject').addEventListener('click', createNewProject);
  document.getElementById('btnArchiveProject').addEventListener('click', archiveCurrentProject);
  document.getElementById('projectSelector').addEventListener('change', loadSelectedProject);

  document.getElementById('btnSendEmail').addEventListener('click', sendEmailDoc);
  document.getElementById('btnExportPDF').addEventListener('click', exportPDF);

  document.getElementById('btnOpenSettings').addEventListener('click', toggleSettingsModal);
  document.getElementById('btnCancelSettings').addEventListener('click', toggleSettingsModal);
  document.getElementById('btnSaveSettings').addEventListener('click', saveBusinessSettings);

  document.getElementById('markupPct').addEventListener('input', updateCalculations);
  document.getElementById('taxPct').addEventListener('input', updateCalculations);
}

function setDocumentType(type) {
  currentDocType = type;
  document.getElementById('btnQuote').className = type === 'Quote' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  document.getElementById('btnInvoice').className = type === 'Invoice' ? 'flex-1 font-extrabold rounded-md py-2 text-center bg-amber-500 text-slate-950' : 'flex-1 font-extrabold rounded-md py-2 text-center text-slate-400';
  updateCalculations();
}

function refreshProjectSelector() {
  const sel = document.getElementById('projectSelector');
  sel.innerHTML = '<option value="">-- Load Saved Electrical Job --</option>';
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
  if (!currentProjectId) currentProjectId = 'elec_' + Date.now();

  projects[currentProjectId] = {
    id: currentProjectId,
    clientName: document.getElementById('clientName').value,
    clientEmail: document.getElementById('clientEmail').value,
    projectName: document.getElementById('projectName').value,
    docType: currentDocType,
    markupPct: document.getElementById('markupPct').value,
    taxPct: document.getElementById('taxPct').value,
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
  document.getElementById('markupPct').value = p.markupPct || 15;
  document.getElementById('taxPct').value = p.taxPct || 8;

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
  lineItems = [{ desc: 'Electrical Service Call', qty: 1, unitPrice: 125, type: 'Labor' }];
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

function exportPDF() {
  const totals = updateCalculations();
  const brand = StorageManager.getBranding();

  document.getElementById('printBizName').innerText = brand.name;
  document.getElementById('printBizInfo').innerText = brand.info;
  document.getElementById('printDocType').innerText = `ELECTRICAL ${currentDocType.toUpperCase()}`;
  document.getElementById('printDate').innerText = new Date().toLocaleDateString();
  document.getElementById('printClientName').innerText = document.getElementById('clientName').value || 'Valued Customer';
  document.getElementById('printJobScope').innerText = document.getElementById('projectName').value || 'Electrical Work Scope';

  const tbody = document.getElementById('printTableBody');
  tbody.innerHTML = '';
  lineItems.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = "border-b border-slate-200";
    tr.innerHTML = `
      <td class="py-2">${item.desc}</td>
      <td class="py-2 text-center">${item.type}</td>
      <td class="py-2 text-center">${item.qty}</td>
      <td class="py-2 text-right">$${item.unitPrice.toFixed(2)}</td>
      <td class="py-2 text-right">$${(item.qty * item.unitPrice).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('printSubtotal').innerText = `$${(totals.matSub + totals.laborSub).toFixed(2)}`;
  document.getElementById('printTaxMarkup').innerText = `$${(totals.markupVal + totals.taxVal).toFixed(2)}`;
  document.getElementById('printGrandTotal').innerText = `$${totals.grandTotal.toFixed(2)}`;

  window.print();
}

function sendEmailDoc() {
  const brand = StorageManager.getBranding();
  const clientName = document.getElementById('clientName').value || 'Customer';
  const clientEmail = document.getElementById('clientEmail').value;
  const proj = document.getElementById('projectName').value || 'Electrical Work';
  const totals = updateCalculations();

  let summary = '';
  lineItems.forEach(item => {
    summary += `• ${item.desc} (${item.qty} x $${item.unitPrice.toFixed(2)}) = $${(item.qty * item.unitPrice).toFixed(2)}\n`;
  });

  const body = 
`Hello ${clientName},

Below are the electrical project details and breakdown for: ${proj}.

--- ITEMIZED BREAKDOWN ---
${summary}
Subtotal: $${(totals.matSub + totals.laborSub).toFixed(2)}
Tax & Overhead: $${(totals.markupVal + totals.taxVal).toFixed(2)}
---------------------------
TOTAL AMOUNT: $${totals.grandTotal.toFixed(2)}

Please reply directly to this email if you have any questions or are ready to approve.

Best regards,
${brand.name}`;

  const mailto = `mailto:${clientEmail}?subject=${encodeURIComponent('Electrical ' + currentDocType + ': ' + proj)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

function toggleSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.toggle('hidden');
  const brand = StorageManager.getBranding();
  document.getElementById('editBizName').value = brand.name;
  document.getElementById('editBizInfo').value = brand.info;
}

function saveBusinessSettings() {
  const n = document.getElementById('editBizName').value;
  const i = document.getElementById('editBizInfo').value;
  StorageManager.saveBranding(n, i);
  initBranding();
  toggleSettingsModal();
}