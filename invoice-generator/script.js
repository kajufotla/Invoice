/**
 * Invoice Generator Web App Core Engine
 * Architecture: State-driven Vanilla JavaScript
 * Supports: LocalStorage auto-save, International Tax/Currency, PDF Export (Print API)
 */

const APP_STATE_KEY = 'invoice_app_draft_v1';

const DEFAULT_STATE = {
    documentType: 'invoice', // invoice, receipt, quote
    currency: 'USD',         // USD, GBP, CAD, AUD
    taxRegion: 'USA',        // USA, UK, CAN, AUS
    taxEnabled: false,
    taxRate: 0,              // Dynamic based on region or custom input
    discountType: 'fixed',   // fixed, percentage
    discountValue: 0,
    customer: {
        name: '',
        email: '',
        address: ''
    },
    metadata: {
        docNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: ''
    },
    items: [
        { id: generateId(), description: '', quantity: 1, price: 0 }
    ]
};

const TAX_RATES = {
    'USA': 0,    // US state taxes vary wildly; default to 0, requires manual input
    'UK': 20,    // Standard VAT
    'CAN': 5,    // Default GST, varies by province (5-15%)
    'AUS': 10    // Standard GST
};

const DOC_PREFIX = {
    'invoice': 'INV',
    'receipt': 'REC',
    'quote': 'QUO'
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadDraft();
    bindEvents();
    renderAll();
    startAutoSave();
});

// --- STATE MANAGEMENT & STORAGE ---
function loadDraft() {
    const saved = localStorage.getItem(APP_STATE_KEY);
    if (saved) {
        try {
            state = { ...DEFAULT_STATE, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to parse draft, falling back to default.', e);
        }
    } else {
        generateDocNumber();
    }
}

function startAutoSave() {
    setInterval(() => {
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
    }, 5000);
}

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function generateDocNumber() {
    const prefix = DOC_PREFIX[state.documentType] || 'DOC';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    state.metadata.docNumber = `${prefix}-${randomNum}`;
    updateValue('doc-number', state.metadata.docNumber);
}

// --- DOM BINDINGS & EVENT LISTENERS ---
function bindEvents() {
    // Metadata & Customer
    bindInput('customer-name', (v) => state.customer.name = v);
    bindInput('customer-email', (v) => state.customer.email = v);
    bindInput('customer-address', (v) => state.customer.address = v);
    bindInput('doc-date', (v) => state.metadata.date = v);
    bindInput('doc-due-date', (v) => state.metadata.dueDate = v);
    bindInput('doc-number', (v) => state.metadata.docNumber = v);

    // Document Settings
    bindSelect('doc-type', (v) => {
        state.documentType = v;
        generateDocNumber();
        updateDocumentLabels();
    });
    bindSelect('currency', (v) => { state.currency = v; renderTotals(); renderItems(); });
    bindSelect('tax-region', (v) => handleTaxRegionChange(v));
    bindCheckbox('tax-toggle', (v) => { state.taxEnabled = v; renderTotals(); });
    bindInput('tax-rate-input', (v) => { state.taxRate = parseFloat(v) || 0; renderTotals(); }, 'number');
    
    // Discounts
    bindSelect('discount-type', (v) => { state.discountType = v; renderTotals(); });
    bindInput('discount-input', (v) => { state.discountValue = parseFloat(v) || 0; renderTotals(); }, 'number');

    // Items
    const addBtn = document.getElementById('add-item-btn');
    if (addBtn) addBtn.addEventListener('click', addItem);

    // Export
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);
}

function bindInput(id, callback, type = 'text') {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
        callback(e.target.value);
    });
}

function bindSelect(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
        callback(e.target.value);
    });
}

function bindCheckbox(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
        callback(e.target.checked);
        toggleVisibility('tax-settings-container', e.target.checked);
    });
}

// --- CORE LOGIC & CALCULATIONS ---
function handleTaxRegionChange(region) {
    state.taxRegion = region;
    state.taxRate = TAX_RATES[region] || 0;
    updateValue('tax-rate-input', state.taxRate);
    
    const taxLabel = document.getElementById('tax-label-text');
    if (taxLabel) {
        const labels = { 'USA': 'State Tax', 'UK': 'VAT', 'CAN': 'GST/HST', 'AUS': 'GST' };
        taxLabel.textContent = labels[region] || 'Tax';
    }
    renderTotals();
}

function calculateTotals() {
    let subtotal = 0;
    state.items.forEach(item => {
        subtotal += (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
    });

    let discountAmount = 0;
    if (state.discountType === 'percentage') {
        discountAmount = subtotal * (state.discountValue / 100);
    } else {
        discountAmount = state.discountValue;
    }
    
    // Prevent negative subtotal after discount
    const amountAfterDiscount = Math.max(0, subtotal - discountAmount);

    let taxAmount = 0;
    if (state.taxEnabled) {
        taxAmount = amountAfterDiscount * (state.taxRate / 100);
    }

    const grandTotal = amountAfterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, grandTotal };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat(getLocaleForCurrency(state.currency), {
        style: 'currency',
        currency: state.currency
    }).format(amount);
}

function getLocaleForCurrency(currency) {
    const locales = {
        'USD': 'en-US',
        'GBP': 'en-GB',
        'CAD': 'en-CA',
        'AUD': 'en-AU'
    };
    return locales[currency] || 'en-US';
}

// --- UI RENDERING ---
function renderAll() {
    updateValue('customer-name', state.customer.name);
    updateValue('customer-email', state.customer.email);
    updateValue('customer-address', state.customer.address);
    updateValue('doc-date', state.metadata.date);
    updateValue('doc-due-date', state.metadata.dueDate);
    updateValue('doc-number', state.metadata.docNumber);
    updateValue('doc-type', state.documentType);
    updateValue('currency', state.currency);
    
    const taxCheckbox = document.getElementById('tax-toggle');
    if (taxCheckbox) taxCheckbox.checked = state.taxEnabled;
    toggleVisibility('tax-settings-container', state.taxEnabled);
    
    updateValue('tax-region', state.taxRegion);
    updateValue('tax-rate-input', state.taxRate);
    updateValue('discount-type', state.discountType);
    updateValue('discount-input', state.discountValue);

    handleTaxRegionChange(state.taxRegion);
    updateDocumentLabels();
    renderItems();
}

function renderItems() {
    const container = document.getElementById('items-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    state.items.forEach((item, index) => {
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        
        const row = document.createElement('div');
        row.className = 'item-row grid grid-cols-12 gap-4 mb-4 items-center'; 
        row.innerHTML = `
            <div class="col-span-5">
                <input type="text" class="item-desc w-full p-2 border rounded" placeholder="Item description" value="${escapeHtml(item.description)}">
            </div>
            <div class="col-span-2">
                <input type="number" class="item-qty w-full p-2 border rounded" min="1" step="1" value="${item.quantity}">
            </div>
            <div class="col-span-2">
                <input type="number" class="item-price w-full p-2 border rounded" min="0" step="0.01" value="${item.price}">
            </div>
            <div class="col-span-2 text-right font-semibold">
                ${formatCurrency(itemTotal)}
            </div>
            <div class="col-span-1 text-right">
                <button class="delete-item-btn text-red-500 hover:text-red-700 font-bold px-2 py-1" data-id="${item.id}">✕</button>
            </div>
        `;

        // Event Listeners for Dynamic Rows
        row.querySelector('.item-desc').addEventListener('input', (e) => updateItem(item.id, 'description', e.target.value));
        row.querySelector('.item-qty').addEventListener('input', (e) => updateItem(item.id, 'quantity', e.target.value));
        row.querySelector('.item-price').addEventListener('input', (e) => updateItem(item.id, 'price', e.target.value));
        row.querySelector('.delete-item-btn').addEventListener('click', () => removeItem(item.id));

        container.appendChild(row);
    });

    renderTotals();
}

function renderTotals() {
    const totals = calculateTotals();
    
    updateHTML('subtotal-el', formatCurrency(totals.subtotal));
    updateHTML('discount-el', formatCurrency(totals.discountAmount) + (state.discountType === 'percentage' ? ` (${state.discountValue}%)` : ''));
    updateHTML('tax-el', formatCurrency(totals.taxAmount) + (state.taxEnabled ? ` (${state.taxRate}%)` : ''));
    updateHTML('total-el', formatCurrency(totals.grandTotal));
    
    toggleVisibility('discount-row', totals.discountAmount > 0);
    toggleVisibility('tax-row', state.taxEnabled);
}

function updateDocumentLabels() {
    const docTitleEls = document.querySelectorAll('.dynamic-doc-title');
    const titleMap = {
        'invoice': 'INVOICE',
        'receipt': 'RECEIPT',
        'quote': 'QUOTE'
    };
    docTitleEls.forEach(el => {
        el.textContent = titleMap[state.documentType] || 'INVOICE';
    });
}

// --- ITEM MANAGEMENT ---
function addItem() {
    state.items.push({ id: generateId(), description: '', quantity: 1, price: 0 });
    renderItems();
}

function removeItem(id) {
    if (state.items.length === 1) return; // Prevent deleting the last item
    state.items = state.items.filter(item => item.id !== id);
    renderItems();
}

function updateItem(id, field, value) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        item[field] = (field === 'quantity' || field === 'price') ? parseFloat(value) || 0 : value;
        renderTotals();
        
        // Re-render specific item total directly to avoid input focus loss
        const container = document.getElementById('items-container');
        if (container && (field === 'quantity' || field === 'price')) {
            const index = state.items.findIndex(i => i.id === id);
            const itemTotalEl = container.children[index].querySelector('.col-span-2.text-right');
            if (itemTotalEl) {
                itemTotalEl.textContent = formatCurrency((item.quantity || 0) * (item.price || 0));
            }
        }
    }
}

// --- UTILITIES ---
function updateValue(id, value) {
    const el = document.getElementById(id);
    if (el && el.value !== undefined) el.value = value;
}

function updateHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function toggleVisibility(id, condition) {
    const el = document.getElementById(id);
    if (el) el.style.display = condition ? (el.dataset.display || 'flex') : 'none';
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// --- EXPORT FUNCTIONALITY ---
function exportPDF() {
    // Save draft immediately before printing
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
    
    // Add print-specific class to body
    document.body.classList.add('exporting-pdf');
    
    // Trigger native browser print which can save as clean PDF
    // Ensure CSS hides elements with '.no-print' during this phase
    setTimeout(() => {
        window.print();
        document.body.classList.remove('exporting-pdf');
    }, 300);
}
