/**
============================================================================

ENTERPRISE INVOICE SaaS ENGINE (v3.0.0 - Production Ready)

Entity: Hamid Hussain & Co. / PDFExpert Integration Ready / Smart Ledger

Architecture: Enterprise Modular Manager Pattern

Storage Layer: IndexedDB (Offline-First, Privacy-Centric) -> Firebase Ready

Compliance: WCAG Accessibility, Strict XSS Prevention, Locale/RTL Aware

============================================================================
*/


/* ================= SYSTEM CONFIGURATION ================= */
const AppConfig = {
appName: 'Hamid Hussain & Co. Enterprise SaaS',
version: '3.0.0',
debugMode: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
maxHistoryStates: 100,
defaultCurrencySym: '$',
defaultCurrencyCode: 'USD',
defaultLocale: 'en-US',
animationDuration: 150,
storagePrefix: 'erp_inv_v3_'
};

/* ================= UTILITIES & LOGGING ================= */
const Logger = {
info: (msg, ...args) => { if (AppConfig.debugMode) console.info(`[INFO] ${msg}`, ...args); },
warn: (msg, ...args) => { if (AppConfig.debugMode) console.warn(`[WARN] ${msg}`, ...args); },
error: (msg, ...args) => { console.error(`[ERROR] ${msg}`, ...args); }
};

const Sanitizer = {
escapeHTML: (str) => {
if (typeof str !== 'string') return str;
return str.replace(/[&<>'"]/g, tag => ({
'&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;'
}[tag]));
},
sanitizeObject: (obj) => {
if (typeof obj !== 'object' || obj === null) return Sanitizer.escapeHTML(obj);
if (Array.isArray(obj)) return obj.map(Sanitizer.sanitizeObject);
const sanitized = {};
for (const [key, value] of Object.entries(obj)) {
sanitized[key] = typeof value === 'string' ? Sanitizer.escapeHTML(value) : Sanitizer.sanitizeObject(value);
}
return sanitized;
}
};

const Utility = {
getEl: (id) => document.getElementById(id),
getVal: (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; },
generateId: () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
debounce: (func, delay = 300) => {
let timeoutId;
return (...args) => {
clearTimeout(timeoutId);
timeoutId = setTimeout(() => func.apply(null, args), delay);
};
},
throttle: (func, limit = 100) => {
let inThrottle;
return (...args) => {
if (!inThrottle) {
func.apply(null, args);
inThrottle = true;
setTimeout(() => inThrottle = false, limit);
}
};
},
formatDate: (dStr, locale = AppConfig.defaultLocale) => {
if (!dStr) return '';
try { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dStr)); }
catch (e) { return dStr; }
},
formatCurrency: (amount, locale = AppConfig.defaultLocale) => {
return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
},
numberToWords: (amount) => {
if (amount === 0) return 'Zero';
if (amount < 0) return 'Negative ' + Utility.numberToWords(Math.abs(amount));
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
let word = '', numInt = Math.floor(amount), decimal = Math.round((amount - numInt) * 100);
if (numInt === 0) word = 'Zero';
else {
let scaleIdx = 0;
while (numInt > 0) {
let chunk = numInt % 1000;
if (chunk > 0) {
let chunkWord = '';
if (chunk > 99) { chunkWord += ones[Math.floor(chunk / 100)] + ' Hundred '; chunk %= 100; }
if (chunk > 19) { chunkWord += tens[Math.floor(chunk / 10)] + ' '; chunk %= 10; }
if (chunk > 0) chunkWord += ones[chunk] + ' ';
word = chunkWord + scales[scaleIdx] + ' ' + word;
}
numInt = Math.floor(numInt / 1000);
scaleIdx++;
}
}
return word.trim() + (decimal > 0 ? ` and ${decimal}/100` : '') + ' Only';
}
};

/* ================= INTERNATIONALIZATION (i18n) ================= */
const I18nManager = {
currentLang: 'en',
dictionaries: {
en: { dir: 'ltr', loading: 'Processing request...', saved: 'Saved successfully', validationErr: 'Validation Error:', deleted: 'Item deleted', copied: 'Copied to clipboard!', duplicateSuccess: 'Invoice duplicated' },
ur: { dir: 'rtl', loading: 'درخواست پر کارروائی ہو رہی ہے...', saved: 'کامیابی سے محفوظ ہو گیا', validationErr: 'توثیق کی خرابی:', deleted: 'آئٹم حذف کر دیا گیا', copied: 'کلپ بورڈ پر کاپی ہو گیا!', duplicateSuccess: 'انوائس کی نقل تیار ہو گئی' },
ar: { dir: 'rtl', loading: 'جاري معالجة الطلب...', saved: 'تم الحفظ بنجاح', validationErr: 'خطأ في التحقق:', deleted: 'تم حذف العنصر', copied: 'تم النسخ!', duplicateSuccess: 'تم تكرار الفاتورة' },
fr: { dir: 'ltr', loading: 'Traitement en cours...', saved: 'Enregistré avec succès', validationErr: 'Erreur de validation:', deleted: 'Élément supprimé', copied: 'Copié!', duplicateSuccess: 'Facture dupliquée' }
},
t: (key) => I18nManager.dictionaries[I18nManager.currentLang][key] || key,
setLanguage: (lang) => {
if (!I18nManager.dictionaries[lang]) return;
I18nManager.currentLang = lang;
document.documentElement.lang = lang;
document.documentElement.dir = I18nManager.dictionaries[lang].dir;
NotificationManager.show(`Language changed to ${lang.toUpperCase()}`, 'info');
}
};

/* ================= ENTERPRISE DOM ENGINE ================= */
const DOM = {
create: (tag, attributes = {}, children = []) => {
const el = document.createElement(tag);
for (const [key, value] of Object.entries(attributes)) {
if (key === 'className' && value) el.className = value;
else if (key === 'dataset' && typeof value === 'object') Object.entries(value).forEach(([dKey, dVal]) => el.dataset[dKey] = dVal);
else if (key === 'style' && typeof value === 'object') Object.entries(value).forEach(([sKey, sVal]) => el.style[sKey] = sVal);
else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.substring(2).toLowerCase(), value);
else if (value !== null && value !== undefined) {
el.setAttribute(key, value);
if (['value', 'checked', 'type', 'id', 'src', 'alt', 'placeholder', 'title', 'role', 'aria-label'].includes(key)) el[key] = value;
}
}
children.forEach(child => {
if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
else if (child instanceof Node) el.appendChild(child);
});
return el;
},
clear: (element) => { if (element) while (element.firstChild) element.removeChild(element.firstChild); }
};

/* ================= VALIDATION ENGINE ================= */
const Validator = {
isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
isURL: (url) => /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/.test(url),
isPhone: (phone) => /^[\d\s+\-\(\)]+$/.test(phone),
isNumeric: (val) => !isNaN(parseFloat(val)) && isFinite(val),
isWallet: (address) => /^[a-zA-Z0-9]{26,62}$/.test(address),
isIBAN: (iban) => /^[A-Z]{2}[0-9]{2}[a-zA-Z0-9]{11,30}$/.test(iban.replace(/\s/g, '')),
validateItemBounds: (val, fieldName) => { if (parseFloat(val) < 0) throw new Error(`${fieldName} cannot be negative.`); return true; },
validateDiscount: (discount, subtotal, isPercent) => {
const d = parseFloat(discount) || 0;
if (d < 0) throw new Error('Discount cannot be negative.');
if (isPercent && d > 100) throw new Error('Discount percentage cannot exceed 100%.');
if (!isPercent && d > subtotal) throw new Error('Fixed discount cannot exceed subtotal.');
return true;
}
};

/* ================= ROBUST STORAGE ENGINE (IndexedDB -> Firebase Prep) ================= */
const StorageEngine = {
dbName: 'HamidHussainEnterpriseDB',
version: 1,
db: null,
stores: ['invoices', 'customers', 'products', 'payments', 'settings', 'notes'],

init: () => new Promise((resolve, reject) => {  
    const req = indexedDB.open(StorageEngine.dbName, StorageEngine.version);  
    req.onupgradeneeded = (e) => {  
        const db = e.target.result;  
        StorageEngine.stores.forEach(store => {  
            if (!db.objectStoreNames.contains(store)) {  
                const os = db.createObjectStore(store, { keyPath: 'id' });  
                if (store === 'invoices') {  
                    os.createIndex('status', 'status', { unique: false });  
                    os.createIndex('date', 'date', { unique: false });  
                }  
            }  
        });  
    };  
    req.onsuccess = () => { StorageEngine.db = req.result; resolve(StorageEngine.db); };  
    req.onerror = () => { Logger.error('IndexedDB Init Failed', req.error); reject(req.error); };  
}),  

_tx: (storeName, mode = 'readonly') => {  
    if (!StorageEngine.db) throw new Error("Database not initialized");  
    return StorageEngine.db.transaction(storeName, mode).objectStore(storeName);  
},  

put: (storeName, data) => new Promise((resolve, reject) => {  
    const req = StorageEngine._tx(storeName, 'readwrite').put(data);  
    req.onsuccess = () => resolve(data.id);  
    req.onerror = () => reject(req.error);  
}),  

get: (storeName, id) => new Promise((resolve, reject) => {  
    const req = StorageEngine._tx(storeName).get(id);  
    req.onsuccess = () => resolve(req.result);  
    req.onerror = () => reject(req.error);  
}),  

getAll: (storeName) => new Promise((resolve, reject) => {  
    const req = StorageEngine._tx(storeName).getAll();  
    req.onsuccess = () => resolve(req.result);  
    req.onerror = () => reject(req.error);  
}),  

delete: (storeName, id) => new Promise((resolve, reject) => {  
    const req = StorageEngine._tx(storeName, 'readwrite').delete(id);  
    req.onsuccess = () => resolve();  
    req.onerror = () => reject(req.error);  
}),  

// LocalStorage fallback for simple key-value settings  
setKV: (key, value) => localStorage.setItem(AppConfig.storagePrefix + key, JSON.stringify(value)),  
getKV: (key) => { try { return JSON.parse(localStorage.getItem(AppConfig.storagePrefix + key)); } catch(e){ return null; } }

};

/* ================= NOTIFICATION MANAGER ================= */
const NotificationManager = {
queue: [], isShowing: false,
show: (msg, type = 'success') => {
NotificationManager.queue.push({ msg, type });
if (!NotificationManager.isShowing) NotificationManager.processQueue();
},
processQueue: () => {
if (NotificationManager.queue.length === 0) { NotificationManager.isShowing = false; return; }
NotificationManager.isShowing = true;
const { msg, type } = NotificationManager.queue.shift();
const container = Utility.getEl('toast-container');
if (!container) { NotificationManager.isShowing = false; return; }

let iconClass = type === 'success' ? 'fa-check-circle text-success' : type === 'error' ? 'fa-circle-xmark text-danger' : type === 'warning' ? 'fa-triangle-exclamation text-warning' : 'fa-info-circle text-primary';  
    const icon = DOM.create('i', { className: `fa-solid ${iconClass}`, style: { color: `var(--${type})` } });  
    const toast = DOM.create('div', { className: `toast toast-${type}`, role: 'alert', 'aria-live': 'assertive' }, [icon, document.createTextNode(` ${msg}`)]);  
      
    container.appendChild(toast);  
    setTimeout(() => {  
        toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s ease';  
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); NotificationManager.processQueue(); }, 300);  
    }, 3000);  
}

};

/* ================= STATE MANAGER ================= */
const StateManager = {
history: [], historyIndex: -1, isUndoing: false,
currentInvoiceId: null,
items: [{ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false }],
currencySym: AppConfig.defaultCurrencySym,
currencyCode: AppConfig.defaultCurrencyCode,
uploadedQRImage: null,

saveState: Utility.debounce(async () => {  
    if (StateManager.isUndoing) return;  
    try {  
        const currentState = { items: JSON.parse(JSON.stringify(StateManager.items)), inputs: {}, customQR: StateManager.uploadedQRImage };  
        document.querySelectorAll('input, select, textarea').forEach(el => {  
            if (el.id && el.type !== 'file') currentState.inputs[el.id] = el.type === 'checkbox' ? el.checked : el.value;  
        });  
        StateManager.history = StateManager.history.slice(0, StateManager.historyIndex + 1);  
        StateManager.history.push(currentState);  
        if (StateManager.history.length > AppConfig.maxHistoryStates) StateManager.history.shift();  
        else StateManager.historyIndex++;  
          
        await StorageEngine.setKV('autosave_draft', currentState);  
    } catch (error) { Logger.error('Save state failed:', error); }  
}, 500),  

undo: () => {  
    if (StateManager.historyIndex > 0) {  
        StateManager.isUndoing = true; StateManager.historyIndex--;  
        StateManager.restoreState(StateManager.history[StateManager.historyIndex]);  
        StateManager.isUndoing = false;  
    }  
},  

redo: () => {  
    if (StateManager.historyIndex < StateManager.history.length - 1) {  
        StateManager.isUndoing = true; StateManager.historyIndex++;  
        StateManager.restoreState(StateManager.history[StateManager.historyIndex]);  
        StateManager.isUndoing = false;  
    }  
},  

restoreState: (state) => {  
    try {  
        StateManager.items = JSON.parse(JSON.stringify(state.items));  
        StateManager.uploadedQRImage = state.customQR || null;  
        for (let id in state.inputs) {  
            const el = Utility.getEl(id);  
            if (el) { if (el.type === 'checkbox') el.checked = state.inputs[id]; else el.value = state.inputs[id]; }  
        }  
        UIManager.renderItems(); PaymentManager.renderPaymentFields(); InvoiceEngine.sync();  
    } catch (error) { Logger.error('Restore state failed:', error); }  
},  

recoverDraft: async () => {  
    const draft = StorageEngine.getKV('autosave_draft');  
    if (draft && confirm("Unsaved draft found. Recover it?")) {  
        StateManager.restoreState(draft);  
        NotificationManager.show(I18nManager.t('saved'), "success");  
    }  
}

};

/* ================= ENTITY MANAGERS (Customers, Products, Payments, Settings) ================= */
const EntityManager = {
// Customers DB
saveCustomerProfile: async () => {
const id = Utility.getVal('cli-taxid') || Utility.generateId();
const customer = { id, name: Utility.getVal('cli-name'), email: Utility.getVal('cli-email'), phone: Utility.getVal('cli-phone'), address1: Utility.getVal('cli-addr1'), address2: Utility.getVal('cli-addr2'), contact: Utility.getVal('cli-contact') };
if (!customer.name) return NotificationManager.show('Customer Name required to save profile.', 'error');
await StorageEngine.put('customers', customer);
NotificationManager.show('Customer Profile Saved', 'success');
},
loadCustomerProfile: async (id) => {
const customer = await StorageEngine.get('customers', id);
if (customer) {
['cli-name','cli-email','cli-phone','cli-addr1','cli-addr2','cli-contact','cli-taxid'].forEach(key => {
const el = Utility.getEl(key); if (el) el.value = customer[key.replace('cli-', '')] || '';
});
InvoiceEngine.syncDebounced();
NotificationManager.show('Customer Loaded', 'success');
}
},

// Products DB  
saveProductToLibrary: async (itemIdx) => {  
    const item = StateManager.items[itemIdx];  
    if (!item.desc) return NotificationManager.show('Item description required to save.', 'error');  
    const product = { id: item.sku || Utility.generateId(), desc: item.desc, price: item.price, unit: item.unit, tax: item.tax, notes: item.notes };  
    await StorageEngine.put('products', product);  
    NotificationManager.show('Product Saved to Library', 'success');  
},  

// Payment Methods DB  
savePaymentMethod: async () => {  
    const method = Utility.getVal('p-method');  
    const id = method + '_' + Date.now();  
    const payload = { id, methodType: method, details: {} };  
    const inputs = document.querySelectorAll('#payment-dynamic-fields input, #payment-dynamic-fields textarea');  
    inputs.forEach(inp => payload.details[inp.id] = inp.value);  
    await StorageEngine.put('payments', payload);  
    NotificationManager.show('Payment Method Saved', 'success');  
},  

// Notes DB  
saveNotesTemplate: async () => {  
    const payload = { id: Utility.generateId(), title: prompt('Template Name:'), public: Utility.getVal('n-public'), terms: Utility.getVal('n-terms'), footer: Utility.getVal('n-footer') };  
    if(payload.title) { await StorageEngine.put('notes', payload); NotificationManager.show('Notes Template Saved', 'success'); }  
},  

// Company Settings DB  
saveCompanyProfile: async () => {  
    const payload = { id: Utility.generateId(), name: Utility.getVal('c-name'), email: Utility.getVal('c-email'), phone: Utility.getVal('c-phone'), addr1: Utility.getVal('c-addr1'), addr2: Utility.getVal('c-addr2'), web: Utility.getVal('c-web'), taxid: Utility.getVal('c-taxid'), reg: Utility.getVal('c-reg') };  
    if(payload.name) { await StorageEngine.put('settings', payload); NotificationManager.show('Company Profile Saved', 'success'); }  
}

};

/* ================= INVOICE ENGINE & HISTORY ================= */
const InvoiceEngine = {
autoCalcDueDate: () => {
const terms = Utility.getVal('f-terms'), dateInput = Utility.getEl('f-date'), dueInput = Utility.getEl('f-due');
if (terms !== 'custom' && dateInput && dueInput && dateInput.value) {
let d = new Date(dateInput.value); d.setDate(d.getDate() + parseInt(terms)); dueInput.valueAsDate = d;
}
InvoiceEngine.syncDebounced();
},

generateInvoiceNumber: async () => {  
    const date = new Date(), year = date.getFullYear();  
    let seq = StorageEngine.getKV('invoice_sequence') || 1;  
    const invInput = Utility.getEl('f-inv-num');  
    if (invInput) invInput.value = `INV-${year}-${String(seq).padStart(6, '0')}`;  
    StorageEngine.setKV('invoice_sequence', seq + 1);  
    InvoiceEngine.syncDebounced();  
},  

addItem: () => {  
    StateManager.items.push({ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false });  
    UIManager.renderItems(); StateManager.saveState();  
},  

deleteItem: (idx) => {  
    if (StateManager.items.length === 1 && !confirm("This is the last item. Delete?")) return;  
    else if (StateManager.items.length > 1 && !confirm(I18nManager.t('deleted'))) return;  
    StateManager.items.splice(idx, 1);  
    if (StateManager.items.length === 0) InvoiceEngine.addItem();  
    else UIManager.renderItems();  
    StateManager.saveState();  
},  

clearItems: () => {  
    if(confirm("Clear all items?")) { StateManager.items = []; InvoiceEngine.addItem(); }  
},  

updateItem: (idx, field, val) => {  
    try {  
        if (['qty', 'price', 'tax', 'disc'].includes(field) && val !== '') Validator.validateItemBounds(val, field.toUpperCase());  
        StateManager.items[idx][field] = val;  
        InvoiceEngine.syncDebounced();  
    } catch (e) { NotificationManager.show(`${I18nManager.t('validationErr')} ${e.message}`, 'error'); UIManager.renderItems(); }  
},  

saveFinalInvoice: async () => {  
    UIManager.setLoadingState(true, 'Saving Invoice to History...');  
    try {  
        const invoiceData = {  
            id: Utility.getVal('f-inv-num') || Utility.generateId(),  
            date: Utility.getVal('f-date'),  
            client: Utility.getVal('cli-name'),  
            total: parseFloat(Utility.getEl('out-grand')?.textContent.replace(/[^0-9.-]+/g,"")) || 0,  
            status: 'Final',  
            state: { items: StateManager.items, customQR: StateManager.uploadedQRImage, inputs: {} }  
        };  
        document.querySelectorAll('input, select, textarea').forEach(el => { if (el.id && el.type !== 'file') invoiceData.state.inputs[el.id] = el.type === 'checkbox' ? el.checked : el.value; });  
        await StorageEngine.put('invoices', invoiceData);  
        NotificationManager.show('Invoice Saved to Database', 'success');  
    } catch (e) { Logger.error(e); NotificationManager.show('Failed to save invoice', 'error'); }  
    finally { UIManager.setLoadingState(false); }  
},  

duplicateInvoice: async (id) => {  
    const inv = await StorageEngine.get('invoices', id);  
    if (inv) {  
        StateManager.restoreState(inv.state);  
        await InvoiceEngine.generateInvoiceNumber(); // New number for clone  
        NotificationManager.show(I18nManager.t('duplicateSuccess'), 'success');  
    }  
},  

sync: () => {  
    try {  
        const textMap = {  
            'out-doc-type': 'f-doc-type', 'out-inv-num': 'f-inv-num', 'out-po': 'f-po', 'out-ref': 'f-ref',  
            'out-c-name': 'c-name', 'out-c-addr1': 'c-addr1', 'out-c-addr2': 'c-addr2', 'out-c-email': 'c-email', 'out-c-phone': 'c-phone', 'out-c-web': 'c-web', 'out-c-taxid': 'c-taxid', 'out-c-reg': 'c-reg',  
            'out-cli-name': 'cli-name', 'out-cli-addr1': 'cli-addr1', 'out-cli-addr2': 'cli-addr2', 'out-cli-contact': 'cli-contact', 'out-cli-email': 'cli-email', 'out-cli-phone': 'cli-phone', 'out-cli-taxid': 'cli-taxid',  
            'out-sign-name': 'b-sign-name', 'out-sign-role': 'b-sign-role', 'out-tax-label': 'f-tax-label'  
        };  
        for (let outId in textMap) { const el = Utility.getEl(outId); if (el) el.textContent = Utility.getVal(textMap[outId]); }  

        ['c-taxid','c-reg','po','ref','cli-contact','cli-email','cli-phone','cli-taxid'].forEach(o => {  
            const wrap = Utility.getEl(`wrap-${o}`), src = o === 'po' || o === 'ref' ? `f-${o}` : o.replace('-', '-');   
            if (wrap) wrap.style.display = Utility.getVal(src) ? 'block' : 'none';  
        });  

        const currParts = Utility.getVal('f-currency').split('|');  
        StateManager.currencyCode = currParts[0] || AppConfig.defaultCurrencyCode;  
        StateManager.currencySym = currParts[1] || AppConfig.defaultCurrencySym;  

        if (Utility.getEl('out-date')) Utility.getEl('out-date').textContent = Utility.formatDate(Utility.getVal('f-date'));  
        if (Utility.getEl('out-due')) Utility.getEl('out-due').textContent = Utility.formatDate(Utility.getVal('f-due'));  

        const nPublic = Utility.getVal('n-public');  
        if(Utility.getEl('out-n-public')) Utility.getEl('out-n-public').textContent = nPublic;  
        if(Utility.getEl('wrap-n-public')) Utility.getEl('wrap-n-public').style.display = nPublic ? 'block' : 'none';  
          
        const nTerms = Utility.getVal('n-terms');  
        if(Utility.getEl('out-n-terms')) Utility.getEl('out-n-terms').textContent = nTerms;  
        if(Utility.getEl('wrap-n-terms')) Utility.getEl('wrap-n-terms').style.display = nTerms ? 'block' : 'none';  
        if(Utility.getEl('out-n-footer')) Utility.getEl('out-n-footer').textContent = Utility.getVal('n-footer');  

        // Payment safe render  
        const outPayment = Utility.getEl('out-payment'), wrapPay = Utility.getEl('wrap-pay');  
        if (outPayment) {  
            DOM.clear(outPayment);  
            const pMethod = Utility.getVal('p-method'), frag = document.createDocumentFragment();  
            let hasData = false;  
            const addLine = (label, valStr) => {  
                if (!valStr || valStr.trim() === '') return;  
                hasData = true;  
                frag.appendChild(DOM.create('strong', {}, [label + ': ']));  
                frag.appendChild(document.createTextNode(valStr));  
                frag.appendChild(DOM.create('br'));  
            };  

            if (pMethod === 'bank') { addLine('Bank', Utility.getVal('p-bank')); addLine('Account', `${Utility.getVal('p-accname')} (${Utility.getVal('p-accno')})`); addLine('IBAN', Utility.getVal('p-iban')); addLine('SWIFT', Utility.getVal('p-swift')); }  
            else if (pMethod === 'paypal') addLine('PayPal', Utility.getVal('p-paypal'));  
            else if (pMethod === 'stripe') addLine('Pay Online', Utility.getVal('p-stripe'));  
            else if (pMethod === 'wise') addLine('Wise Account', Utility.getVal('p-wise'));  
            else if (pMethod === 'payoneer') addLine('Payoneer', Utility.getVal('p-payoneer'));  
            else if (pMethod === 'crypto') { addLine('Coin', `${Utility.getVal('p-coin')} (${Utility.getVal('p-net')})`); addLine('Wallet', Utility.getVal('p-wallet')); }  
            else if (pMethod === 'easypaisa') { addLine('Mobile Money', `${Utility.getVal('p-mobi-name')} - ${Utility.getVal('p-mobi-no')}`); }  
            else {  
                const customText = Utility.getVal('p-custom');  
                if (customText) { hasData = true; customText.split('\n').forEach(line => { frag.appendChild(document.createTextNode(line)); frag.appendChild(DOM.create('br')); }); }  
            }  
            outPayment.appendChild(frag);  
            if (wrapPay) wrapPay.style.display = hasData ? 'block' : 'none';  
        }  

        // Items Table  
        let tbody = Utility.getEl('out-items-body'), subtotal = 0;  
        if(tbody) DOM.clear(tbody);  
        let hasItemTaxDisc = StateManager.items.some(i => (Number(i.tax) || 0) > 0 || (Number(i.disc) || 0) > 0);  
        if (Utility.getEl('th-tax')) Utility.getEl('th-tax').style.display = hasItemTaxDisc ? 'table-cell' : 'none';  

        const tbFrag = document.createDocumentFragment();  
        StateManager.items.forEach(it => {  
            let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0;  
            let baseTotal = q * p, finalTotal = baseTotal - d + ((baseTotal - d) * (t / 100));  
            subtotal += finalTotal;  
              
            if (it.desc || finalTotal > 0) {  
                const tr = DOM.create('tr');  
                const tdDetails = DOM.create('td');  
                tdDetails.appendChild(DOM.create('span', { className: 'td-item-name' }, [it.desc]));  
                if (it.notes) tdDetails.appendChild(DOM.create('span', { className: 'td-item-desc' }, [it.notes]));  
                if (it.sku || it.unit) tdDetails.appendChild(DOM.create('span', { className: 'td-item-meta' }, [`SKU: ${it.sku||'N/A'} | Unit: ${it.unit||'N/A'}`]));  
                tr.appendChild(tdDetails);  
                tr.appendChild(DOM.create('td', { className: 'center' }, [q.toString()]));  
                tr.appendChild(DOM.create('td', { className: 'right' }, [`${StateManager.currencySym}${Utility.formatCurrency(p)}`]));  
                  
                if (hasItemTaxDisc) {  
                    const tdMeta = DOM.create('td', { className: 'right', style: { color: '#64748B' } });  
                    if (d > 0) tdMeta.appendChild(document.createTextNode(`-${StateManager.currencySym}${d} `));  
                    if (t > 0) tdMeta.appendChild(document.createTextNode(`+${t}%`));  
                    tr.appendChild(tdMeta);  
                }  
                tr.appendChild(DOM.create('td', { className: 'right', style: { fontWeight: '600' } }, [`${StateManager.currencySym}${Utility.formatCurrency(finalTotal)}`]));  
                tbFrag.appendChild(tr);  
            }  
        });  
        if (tbody) tbody.appendChild(tbFrag);  

        // Globals  
        let gDiscType = Utility.getVal('f-disc-type'), gDiscVal = Number(Utility.getVal('f-disc-val')) || 0, gTax = Number(Utility.getVal('f-global-tax')) || 0;  
        try { Validator.validateDiscount(gDiscVal, subtotal, gDiscType === 'percent'); }  
        catch(e) { gDiscVal = 0; Utility.getEl('f-disc-val').value = '0'; NotificationManager.show(e.message, 'warning'); }  

        let discAmt = gDiscType === 'percent' ? subtotal * (gDiscVal/100) : gDiscVal, afterDisc = subtotal - discAmt, taxAmt = afterDisc * (gTax/100), grandTotal = afterDisc + taxAmt;  

        if (Utility.getEl('out-subtotal')) Utility.getEl('out-subtotal').textContent = `${StateManager.currencySym}${Utility.formatCurrency(subtotal)}`;  
        if (Utility.getEl('wrap-global-disc')) Utility.getEl('wrap-global-disc').style.display = discAmt > 0 ? 'flex' : 'none';  
        if (Utility.getEl('out-global-disc')) Utility.getEl('out-global-disc').textContent = `-${StateManager.currencySym}${Utility.formatCurrency(discAmt)}`;  
        if (Utility.getEl('wrap-global-tax')) Utility.getEl('wrap-global-tax').style.display = taxAmt > 0 ? 'flex' : 'none';  
        if (Utility.getEl('out-global-tax')) Utility.getEl('out-global-tax').textContent = `${StateManager.currencySym}${Utility.formatCurrency(taxAmt)}`;  
        if (Utility.getEl('out-grand')) Utility.getEl('out-grand').textContent = `${StateManager.currencySym}${Utility.formatCurrency(grandTotal)}`;  
        if (Utility.getEl('out-words')) Utility.getEl('out-words').textContent = Utility.numberToWords(grandTotal) + ` ${StateManager.currencyCode}`;  

        PaymentManager.renderQRCode(); StateManager.saveState();  
    } catch (error) { Logger.error('Sync failed:', error); }  
}

};
InvoiceEngine.syncDebounced = Utility.debounce(InvoiceEngine.sync, 150);

/* ================= REPORTS & ANALYTICS MANAGER ================= */
const ReportsManager = {
generateStatistics: async () => {
const invoices = await StorageEngine.getAll('invoices');
let totalRev = 0, count = invoices.length;
invoices.forEach(inv => totalRev += parseFloat(inv.total || 0));
return { totalRevenue: totalRev, totalInvoices: count, averageValue: count > 0 ? totalRev/count : 0 };
}
};

/* ================= UI MANAGER ================= */
const UIManager = {
toggleSidebar: () => { const s = Utility.getEl('app-sidebar'); if (s) s.classList.toggle('hidden'); },
switchTab: (tabId, event) => {
document.querySelectorAll('.tab-pane, .tab-btn').forEach(el => el.classList.remove('active'));
const target = Utility.getEl(tabId); if (target) target.classList.add('active');
if (event && event.target) event.target.classList.add('active');
const s = Utility.getEl('app-sidebar'); if (s) s.classList.remove('hidden');
},
toggleDarkMode: async () => { const isDark = document.body.classList.toggle('dark-mode'); await StorageEngine.setKV('theme_dark', isDark); },
loadThemePersistence: async () => {
if (StorageEngine.getKV('theme_dark')) document.body.classList.add('dark-mode');
const branding = StorageEngine.getKV('theme_branding');
if (branding) {
if (branding.color) { document.documentElement.style.setProperty('--inv-color', branding.color); const c = Utility.getEl('b-color'); if(c) c.value = branding.color; }
if (branding.font) { document.documentElement.style.setProperty('--inv-font', branding.font); const f = Utility.getEl('b-font'); if(f) f.value = branding.font; }
}
},
setupDragAndDrop: () => {
const container = Utility.getEl('items-container');
if (!container || typeof Sortable === 'undefined') return;
new Sortable(container, { handle: '.drag-handle', animation: AppConfig.animationDuration, ghostClass: 'drag-ghost', delay: 150, delayOnTouchOnly: true, onEnd: function (evt) {
const moved = StateManager.items.splice(evt.oldIndex, 1)[0]; StateManager.items.splice(evt.newIndex, 0, moved); UIManager.renderItems(); StateManager.saveState();
}});
},
renderItems: () => {
const cont = Utility.getEl('items-container'); if (!cont) return;
DOM.clear(cont); const frag = document.createDocumentFragment();

StateManager.items.forEach((it, idx) => {  
        let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0, total = (q * p) - d + ((q * p - d) * (t/100));  
        const row = DOM.create('div', { className: 'item-row', dataset: { id: it.id } });  
          
        const dragHandle = DOM.create('div', { className: 'drag-handle', title: 'Drag to reorder', role: 'button', tabIndex: '0', 'aria-label': 'Drag' }, [DOM.create('i', { className: 'fa-solid fa-grip-vertical' })]);  
        const textCol = DOM.create('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [  
            DOM.create('input', { type: 'text', className: 'input-control', placeholder: 'Item Name / Description', value: it.desc, oninput: (e) => InvoiceEngine.updateItem(idx, 'desc', e.target.value) }),  
            DOM.create('input', { type: 'text', className: 'input-control', style: { fontSize: '11px', padding: '6px', color: 'var(--text-muted)' }, placeholder: 'Additional notes...', value: it.notes, oninput: (e) => InvoiceEngine.updateItem(idx, 'notes', e.target.value) })  
        ]);  
        const qtyInput = DOM.create('input', { type: 'number', className: 'input-control', placeholder: 'Qty', value: it.qty, oninput: (e) => InvoiceEngine.updateItem(idx, 'qty', e.target.value) });  
        const priceInput = DOM.create('input', { type: 'number', className: 'input-control', placeholder: 'Price', value: it.price, oninput: (e) => InvoiceEngine.updateItem(idx, 'price', e.target.value) });  
          
        const btnAdv = DOM.create('button', { className: 'btn btn-icon', title: 'Edit Advanced', 'aria-label': 'Toggle Advanced', onclick: () => { StateManager.items[idx].showAdv = !it.showAdv; UIManager.renderItems(); } }, [DOM.create('i', { className: 'fa-solid fa-sliders' })]);  
        const btnLib = DOM.create('button', { className: 'btn btn-icon text-primary', title: 'Save to Product Library', onclick: () => EntityManager.saveProductToLibrary(idx) }, [DOM.create('i', { className: 'fa-solid fa-bookmark' })]);  
        const btnDel = DOM.create('button', { className: 'btn btn-icon btn-danger', title: 'Delete Item', onclick: () => InvoiceEngine.deleteItem(idx) }, [DOM.create('i', { className: 'fa-solid fa-trash' })]);  
        const btnGroup = DOM.create('div', { style: { display: 'flex', gap: '4px' } }, [btnAdv, btnLib, btnDel]);  

        row.appendChild(DOM.create('div', { className: 'item-main' }, [dragHandle, textCol, qtyInput, priceInput, btnGroup]));  

        if (it.showAdv) {  
            const metaGroup = DOM.create('div', { className: 'item-meta' });  
            const createFormGroup = (l, t, ph, val, field) => DOM.create('div', { className: 'form-group' }, [DOM.create('label', {}, [l]), DOM.create('input', { type: t, className: 'input-control input-sm', placeholder: ph, value: val, oninput: (e) => InvoiceEngine.updateItem(idx, field, e.target.value) })]);  
            metaGroup.appendChild(createFormGroup('SKU', 'text', '', it.sku||'', 'sku')); metaGroup.appendChild(createFormGroup('Unit', 'text', 'hrs, pcs, kg', it.unit||'', 'unit')); metaGroup.appendChild(createFormGroup(`Discount (${StateManager.currencySym})`, 'number', '0', it.disc, 'disc')); metaGroup.appendChild(createFormGroup('Tax (%)', 'number', '0', it.tax, 'tax'));  
            row.appendChild(metaGroup); row.appendChild(DOM.create('div', { className: 'item-total-display' }, [`Line Total: ${StateManager.currencySym}${Utility.formatCurrency(total)}`]));  
        }  
        frag.appendChild(row);  
    });  
    cont.appendChild(frag); InvoiceEngine.syncDebounced();  
},  

saveInvoiceData: () => { InvoiceEngine.saveFinalInvoice(); },  
  
applyBranding: async () => {  
    const c = Utility.getVal('b-color'), f = Utility.getVal('b-font');  
    if (c) document.documentElement.style.setProperty('--inv-color', c);  
    if (f) document.documentElement.style.setProperty('--inv-font', f);  
    await StorageEngine.setKV('theme_branding', { color: c, font: f }); StateManager.saveState();  
},  

handleImageUpload: (input, imgId) => {  
    if (input.files && input.files[0]) {  
        const reader = new FileReader();  
        reader.onload = function(e) {  
            const img = Utility.getEl(imgId);  
            if (img) {  
                img.src = e.target.result; img.style.display = 'block';  
                if (imgId === 'img-logo' && Utility.getEl('logo-placeholder')) Utility.getEl('logo-placeholder').style.display = 'none';  
                if (imgId === 'img-sign' && Utility.getEl('sign-placeholder')) Utility.getEl('sign-placeholder').style.display = 'none';  
                if (imgId === 'img-stamp' && Utility.getEl('wrap-stamp')) Utility.getEl('wrap-stamp').style.display = 'block';  
                StateManager.saveState();  
            }  
        };  
        reader.onerror = () => NotificationManager.show('Failed to load image.', 'error');  
        reader.readAsDataURL(input.files[0]);  
    }  
},  

setLoadingState: (isLoading, text = I18nManager.t('loading')) => {  
    let overlay = Utility.getEl('enterprise-loading-overlay');  
    if (isLoading) {  
        if (!overlay) {  
            overlay = DOM.create('div', { id: 'enterprise-loading-overlay', role: 'alert', 'aria-busy': 'true', style: { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: '9999', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'inherit' } }, [  
                DOM.create('div', { className: 'spinner', style: { border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' } }),  
                DOM.create('div', { style: { marginTop: '15px', fontWeight: '500' } }, [text]),  
                DOM.create('style', {}, ['@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'])  
            ]);  
            document.body.appendChild(overlay);  
        }  
        document.body.style.overflow = 'hidden'; document.querySelectorAll('button').forEach(b => b.disabled = true);  
    } else {  
        if (overlay) document.body.removeChild(overlay);  
        document.body.style.overflow = ''; document.querySelectorAll('button').forEach(b => b.disabled = false);  
    }  
}

};

/* ================= PAYMENT MANAGER ================= */
const PaymentManager = {
renderPaymentFields: () => {
const method = Utility.getVal('p-method'), container = Utility.getEl('payment-dynamic-fields');
if (!container) return; DOM.clear(container); const frag = document.createDocumentFragment();
const createGroup = (label, id, type = 'text', placeholder = '', isFull = false) => DOM.create('div', { className: `form-group${isFull ? ' full' : ''}` }, [DOM.create('label', {}, [label]), DOM.create(type === 'textarea' ? 'textarea' : 'input', { type: type !== 'textarea' ? type : undefined, className: 'input-control', id, placeholder, rows: type === 'textarea' ? '4' : undefined, oninput: InvoiceEngine.syncDebounced })]);

if (method === 'bank') { frag.appendChild(createGroup('Bank Name', 'p-bank', 'text', '', true)); frag.appendChild(createGroup('Account Name', 'p-accname')); frag.appendChild(createGroup('Account Number', 'p-accno')); frag.appendChild(createGroup('Routing / IBAN', 'p-iban')); frag.appendChild(createGroup('SWIFT / BIC', 'p-swift')); }  
    else if (method === 'paypal') frag.appendChild(createGroup('PayPal Email / Link', 'p-paypal', 'text', 'paypal.me/username', true));  
    else if (method === 'stripe') frag.appendChild(createGroup('Stripe Payment Link', 'p-stripe', 'text', 'https://buy.stripe.com/...', true));  
    else if (method === 'wise') frag.appendChild(createGroup('Wise Account Email', 'p-wise', 'email', '', true));  
    else if (method === 'payoneer') frag.appendChild(createGroup('Payoneer Email', 'p-payoneer', 'email', '', true));  
    else if (method === 'crypto') { frag.appendChild(createGroup('Cryptocurrency', 'p-coin')); frag.appendChild(createGroup('Network', 'p-net')); frag.appendChild(createGroup('Wallet Address', 'p-wallet', 'text', '', true)); }  
    else if (method === 'easypaisa') { frag.appendChild(createGroup('Account Title', 'p-mobi-name')); frag.appendChild(createGroup('Mobile Number', 'p-mobi-no')); }  
    else if (method === 'custom') frag.appendChild(createGroup('Custom Instructions', 'p-custom', 'textarea', '', true));  

    // Add save profile button  
    if(method) {  
        const saveBtn = DOM.create('button', { className: 'btn btn-outline', style: { marginTop: '10px' }, onclick: EntityManager.savePaymentMethod }, [DOM.create('i', { className: 'fa-solid fa-save' }), ' Save this Payment Method']);  
        frag.appendChild(DOM.create('div', { className: 'form-group full' }, [saveBtn]));  
    }  

    container.appendChild(frag); InvoiceEngine.syncDebounced();  
},  
handleQRUpload: (input) => {  
    if (input.files && input.files[0]) {  
        const reader = new FileReader();  
        reader.onload = function(e) { StateManager.uploadedQRImage = e.target.result; PaymentManager.renderQRCode(); StateManager.saveState(); };  
        reader.readAsDataURL(input.files[0]);  
    }  
},  
renderQRCode: () => {  
    const qrContainer = Utility.getEl('qrcode'); if (!qrContainer) return; DOM.clear(qrContainer);  
    if (StateManager.uploadedQRImage) qrContainer.appendChild(DOM.create('img', { src: StateManager.uploadedQRImage, alt: 'Payment QR', style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' } }));  
}

};

/* ================= ENTERPRISE EXPORT ENGINE (PDF, CSV, JSON) ================= */
const ExportManager = {
generatePDF: async () => {
const element = Utility.getEl('invoice-render'); if (!element) return NotificationManager.show('Render area not found.', 'error');
const invNum = Utility.getVal('f-inv-num') || 'Invoice', client = Utility.getVal('cli-name') || 'Client';
UIManager.setLoadingState(true, 'Generating Enterprise PDF...');
try {
const opt = { margin: [0, 0, 0, 0], filename: `${invNum}_${client}.pdf`.replace(/[^a-z0-9_-]/gi, '_'), image: { type: 'jpeg', quality: 1.0 }, html2canvas: { scale: 4, useCORS: true, logging: false, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } };
if (typeof html2pdf === 'undefined') throw new Error('html2pdf not loaded.');
await html2pdf().set(opt).from(element).save();
NotificationManager.show('PDF exported successfully.', 'success');
} catch (error) { Logger.error(error); NotificationManager.show('Failed to generate PDF.', 'error'); }
finally { UIManager.setLoadingState(false); }
},

exportJSON: async () => {  
    const data = { version: AppConfig.version, timestamp: new Date().toISOString(), invoiceState: StateManager.history[StateManager.historyIndex] };  
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });  
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Backup_${Utility.getVal('f-inv-num')}.json`;  
    link.click(); URL.revokeObjectURL(link.href);  
    NotificationManager.show('JSON Backup Downloaded', 'success');  
},  

exportCSV: () => {  
    let csvContent = "data:text/csv;charset=utf-8,Description,Notes,SKU,Unit,Qty,Price,Tax,Discount,Total\n";  
    StateManager.items.forEach(it => {  
        let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0, total = (q * p) - d + ((q * p - d) * (t/100));  
        let row = [ `"${it.desc}"`, `"${it.notes}"`, `"${it.sku}"`, `"${it.unit}"`, q, p, t, d, total ].join(",");  
        csvContent += row + "\n";  
    });  
    const encodedUri = encodeURI(csvContent); const link = document.createElement("a");  
    link.setAttribute("href", encodedUri); link.setAttribute("download", `Invoice_${Utility.getVal('f-inv-num')}_Items.csv`);  
    document.body.appendChild(link); link.click(); document.body.removeChild(link);  
    NotificationManager.show('CSV Exported', 'success');  
},  

mailInvoice: () => {  
    const email = Utility.getVal('cli-email');  
    if (email && !Validator.isEmail(email)) return NotificationManager.show("Invalid client email address.", "warning");  
    const invNum = Utility.getVal('f-inv-num') || 'Invoice', total = Utility.getEl('out-grand')?.textContent || '0.00';  
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`New Invoice: ${invNum}`)}&body=${encodeURIComponent(`Hello,\n\nPlease find details for invoice ${invNum}. Total due: ${total}.\n\nThank you.`)}`;  
    NotificationManager.show("Opening Mail Client...", "success");  
},  

shareInvoice: async () => {  
    const shareData = `Invoice ${Utility.getVal('f-inv-num')} - Total: ${Utility.getEl('out-grand')?.textContent}`;  
    try {  
        if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(shareData); NotificationManager.show(I18nManager.t('copied'), "success"); }   
        else throw new Error("Clipboard API not supported");  
    } catch (err) {  
        const textArea = document.createElement("textarea"); textArea.value = shareData; document.body.appendChild(textArea); textArea.focus(); textArea.select();  
        try { document.execCommand('copy'); NotificationManager.show(I18nManager.t('copied'), "success"); } catch (e) { NotificationManager.show('Failed to copy', "error"); }  
        document.body.removeChild(textArea);  
    }  
}

};

/* ================= KEYBOARD ACCESSIBILITY ================= */
document.addEventListener('keydown', (e) => {
if (e.ctrlKey || e.metaKey) {
switch (e.key.toLowerCase()) {
case 's': e.preventDefault(); InvoiceEngine.saveFinalInvoice(); break;
case 'z': e.preventDefault(); if (e.shiftKey) StateManager.redo(); else StateManager.undo(); break;
case 'y': e.preventDefault(); StateManager.redo(); break;
case 'p': e.preventDefault(); ExportManager.generatePDF(); break;
}
}
});

/* ================= INITIALIZATION BOOTSTRAP ================= */
document.addEventListener('DOMContentLoaded', async () => {
try {
Logger.info(`${AppConfig.appName} Boot Sequence v${AppConfig.version}`);
UIManager.setLoadingState(true, 'Initializing Enterprise Architecture...');

// 1. Initialize IndexedDB  
    await StorageEngine.init();  
      
    // 2. Set Dates natively  
    const dateEl = Utility.getEl('f-date'); if (dateEl) dateEl.valueAsDate = new Date();  
      
    // 3. Load UI & Themes  
    await UIManager.loadThemePersistence();  
    InvoiceEngine.autoCalcDueDate();  
    await InvoiceEngine.generateInvoiceNumber();  

    // 4. Default Setup  
    const docType = Utility.getEl('f-doc-type'); if (docType) docType.value = "TAX INVOICE";  
    const nPublic = Utility.getEl('n-public'); if (nPublic) nPublic.value = "Thank you for your business. We appreciate your prompt payment.";  
    const nTerms = Utility.getEl('n-terms'); if (nTerms) nTerms.value = "1. Please quote invoice number when remitting funds.\n2. Late payments are subject to a 2% monthly fee.";  

    // 5. Render Core Components  
    UIManager.setupDragAndDrop();  
    PaymentManager.renderPaymentFields();  
    UIManager.renderItems();  
    InvoiceEngine.sync();   
      
    // 6. State Restoration  
    await StateManager.recoverDraft();  
    StateManager.saveState();  
      
    UIManager.setLoadingState(false);  
    Logger.info('Enterprise Bootstrap Complete.');  
} catch (error) {  
    UIManager.setLoadingState(false);  
    Logger.error('Critical failure during initialization sequence:', error);  
    NotificationManager.show('System Boot Failure. Check logs.', 'error');  
}

});

/* ================= GLOBAL PROXY BINDINGS (Maintains HTML API Compatibility) ================= */
window.toggleSidebar = UIManager.toggleSidebar;
window.switchTab = UIManager.switchTab;
window.toggleDarkMode = UIManager.toggleDarkMode;
window.showToast = NotificationManager.show;
window.setLanguage = I18nManager.setLanguage;

window.saveInvoiceData = UIManager.saveInvoiceData;
window.mailInvoice = ExportManager.mailInvoice;
window.shareInvoice = ExportManager.shareInvoice;

window.saveState = StateManager.saveState;
window.undo = StateManager.undo;
window.redo = StateManager.redo;
window.restoreState = StateManager.restoreState;

window.autoCalcDueDate = InvoiceEngine.autoCalcDueDate;
window.generateInvoiceNumber = InvoiceEngine.generateInvoiceNumber;
window.formatDate = Utility.formatDate;
window.numberToWords = Utility.numberToWords;

window.setupDragAndDrop = UIManager.setupDragAndDrop;
window.renderItems = UIManager.renderItems;
window.addItem = InvoiceEngine.addItem;
window.deleteItem = InvoiceEngine.deleteItem;
window.clearItems = InvoiceEngine.clearItems;
window.updateItem = InvoiceEngine.updateItem;

window.renderPaymentFields = PaymentManager.renderPaymentFields;
window.sync = InvoiceEngine.sync;

window.generateCodes = PaymentManager.renderQRCode;
window.handleQRUpload = PaymentManager.handleQRUpload;

window.applyBranding = UIManager.applyBranding;
window.handleImageUpload = UIManager.handleImageUpload;

window.generatePDF = ExportManager.generatePDF;
window.exportCSV = ExportManager.exportCSV;
window.exportJSON = ExportManager.exportJSON;

window.saveCustomerProfile = EntityManager.saveCustomerProfile;
window.loadCustomerProfile = EntityManager.loadCustomerProfile;
window.saveCompanyProfile = EntityManager.saveCompanyProfile;
window.saveNotesTemplate = EntityManager.saveNotesTemplate;
window.savePaymentMethod = EntityManager.savePaymentMethod;
window.saveProductToLibrary = EntityManager.saveProductToLibrary;
window.duplicateInvoice = InvoiceEngine.duplicateInvoice;
