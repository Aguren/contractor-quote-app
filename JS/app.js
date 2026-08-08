// Electrical Preset Master Library (Easy to expand to 100+ items)
const presetLibrary = [
  // Service Panels & Breakers
  { category: 'panels', desc: '200A Main Service Panel Upgrade', qty: 1, unitPrice: 1850, type: 'Labor' },
  { category: 'panels', desc: '100A Subpanel Installation', qty: 1, unitPrice: 950, type: 'Labor' },
  { category: 'panels', desc: '20A Single-Pole Circuit Breaker', qty: 1, unitPrice: 18, type: 'Material' },
  { category: 'panels', desc: '50A Double-Pole Breaker', qty: 1, unitPrice: 45, type: 'Material' },
  
  // Wire & Cable
  { category: 'wiring', desc: '12/2 ROMEX Wire (250ft Roll)', qty: 1, unitPrice: 145, type: 'Material' },
  { category: 'wiring', desc: '14/2 ROMEX Wire (250ft Roll)', qty: 1, unitPrice: 115, type: 'Material' },
  { category: 'wiring', desc: '10/3 ROMEX Wire (100ft Roll)', qty: 1, unitPrice: 180, type: 'Material' },
  { category: 'wiring', desc: '3/4" EMT Conduit (10ft Stick)', qty: 1, unitPrice: 16, type: 'Material' },

  // Lighting & Fixtures
  { category: 'lighting', desc: 'LED Recessed Can Light (Each)', qty: 4, unitPrice: 95, type: 'Labor' },
  { category: 'lighting', desc: 'Under-Cabinet LED Lighting Kit', qty: 1, unitPrice: 220, type: 'Material' },
  
  // EV Chargers & Specialty Outlets
  { category: 'ev', desc: 'EV Charger 50A Outlet Install', qty: 1, unitPrice: 650, type: 'Labor' },
  { category: 'ev', desc: 'NEMA 14-50 Heavy Duty Receptacle', qty: 1, unitPrice: 35, type: 'Material' },

  // Common Labor Rates
  { category: 'labor', desc: 'Master Electrician Hourly Labor', qty: 1, unitPrice: 110, type: 'Labor' },
  { category: 'labor', desc: 'Apprentice / Helper Hourly Labor', qty: 1, unitPrice: 55, type: 'Labor' },
  { category: 'labor', desc: 'Emergency Service Call & Diagnostic Fee', qty: 1, unitPrice: 175, type: 'Labor' }
];

// Function to populate the selector dropdown based on selected category
function populatePresetDropdown() {
  const category = document.getElementById('presetCategory').value;
  const selector = document.getElementById('presetSelector');
  selector.innerHTML = '';

  const filtered = category === 'all' 
    ? presetLibrary 
    : presetLibrary.filter(item => item.category === category);

  filtered.forEach((item, index) => {
    const opt = document.createElement('option');
    opt.value = index; // or store index in filtered array
    opt.innerText = `[${item.type}] ${item.desc} - $${item.unitPrice.toFixed(2)}`;
    // Store object as dataset for easy retrieval
    opt.dataset.desc = item.desc;
    opt.dataset.qty = item.qty;
    opt.dataset.price = item.unitPrice;
    opt.dataset.type = item.type;
    selector.appendChild(opt);
  });
}

// Event bindings in bindEvents()
document.getElementById('presetCategory').addEventListener('change', populatePresetDropdown);

document.getElementById('btnAddPreset').addEventListener('click', () => {
  const selector = document.getElementById('presetSelector');
  const selectedOpt = selector.options[selector.selectedIndex];
  if (!selectedOpt) return;

  lineItems.push({
    desc: selectedOpt.dataset.desc,
    qty: parseFloat(selectedOpt.dataset.qty),
    unitPrice: parseFloat(selectedOpt.dataset.price),
    type: selectedOpt.dataset.type
  });

  renderLineItems();
  updateCalculations();
});

// Initialize on page boot
populatePresetDropdown();