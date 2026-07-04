import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { defaultState } from "./config-data.js";
import { store, saveState, saveLibrary, validateInvoice, formatMoney, saveProductToLibrary } from "./invoice-manager.js";
import { renderPreview } from "./preview-manager.js";

// ==========================================
// 1. UTILITIES & DATABASE ABSTRACTIONS
// ==========================================

// Security Helper: Prevent XSS by escaping HTML entities from user input
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

// Firebase Reliability Helper: Safe retry logic for network operations
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Operation failed, retrying... (${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
}

let toastTimeout;
export function showToast(msg) {
    try {
        const toastElApp = document.getElementById('toast');
        if (!toastElApp) {
            console.warn("Toast element missing. Fallback alert used.");
            return alert(msg);
        }
        // Use textContent instead of innerHTML for security
        toastElApp.textContent = msg;
        toastElApp.classList.remove('translate-y-24', 'opacity-0');

        clearTimeout(toastTimeout); 
        toastTimeout = setTimeout(() => { 
            toastElApp.classList.add('translate-y-24', 'opacity-0'); 
        }, 3000); 
    } catch (error) { 
        console.error("Error displaying toast:", error); 
    } 
}

const DOMUtils = {
    get: (id) => document.getElementById(id),
    setVal: (id, val) => { const el = document.getElementById(id); if (el) el.value = val; },
    on: (id, evt, cb) => { const el = document.getElementById(id); if (el) el.addEventListener(evt, cb); }
};

// IndexedDB Wrapper for Enterprise Offline Scalability (Maintains LS Backward Compatibility)
const idbStorage = {
    dbName: 'SaaS_Invoice_Enterprise_DB',
    async getDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('appData')) db.createObjectStore('appData');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    async set(key, value) {
        try {
            const db = await this.getDB();
            const tx = db.transaction('appData', 'readwrite');
            tx.objectStore('appData').put(value, key);
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); // Backward Sync
        } catch (e) {
            console.warn("IDB write failed, falling back to LocalStorage", e);
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
    },
    async get(key) {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const req = db.transaction('appData', 'readonly').objectStore('appData').get(key);
                req.onsuccess = () => resolve(req.result || localStorage.getItem(key));
                req.onerror = () => resolve(localStorage.getItem(key));
            });
        } catch (e) {
            return localStorage.getItem(key);
        }
    }
};

// ==========================================
// 2. DOM INJECTION & SYNC
// ==========================================

export function injectDynamicUIElements() {
    try {
        const taxManualEl = DOMUtils.get('tax-rate-manual');
        if (taxManualEl && taxManualEl.tagName.toLowerCase() === 'input') {
            const select = document.createElement('select');
            select.id = taxManualEl.id;
            select.className = taxManualEl.className;
            const rates = [0, 1, 2, 3, 4, 5, 7.5, 10, 12, 15, 18, 20, 25];
            select.innerHTML = rates.map(r => `<option value="${r}">${r}%</option>`).join('');
            taxManualEl.parentNode.replaceChild(select, taxManualEl);
        }

        const dashContainer = DOMUtils.get('view-dashboard'); 
        if (dashContainer && !DOMUtils.get('btn-export-backup')) { 
            dashContainer.insertAdjacentHTML('beforeend', ` 
            <div class="mt-8 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"> 
                <h3 class="text-md font-bold text-slate-800 dark:text-slate-100 mb-4">Data Management</h3> 
                <div class="flex gap-4"> 
                    <button id="btn-export-backup" class="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded font-semibold text-sm transition">Export Backup (JSON)</button> 
                    <label class="px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded font-semibold text-sm transition cursor-pointer"> 
                        Import Backup 
                        <input type="file" id="btn-import-backup" accept=".json" class="hidden"> 
                    </label> 
                </div> 
            </div> 
            `); 
        } 
        
        const companyProfileBody = DOMUtils.get('prof-company-address'); 
        if (companyProfileBody && !DOMUtils.get('prof-stripe')) { 
            companyProfileBody.parentNode.insertAdjacentHTML('beforeend', ` 
            <div class="mt-4 border-t pt-4 border-slate-200"> 
                <p class="text-xs font-bold text-slate-500 mb-2 uppercase">Payment Links (Optional)</p> 
                <input type="text" id="prof-stripe" placeholder="Stripe Payment Link" class="w-full mb-2 px-3 py-2 text-sm border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700"> 
                <input type="text" id="prof-paypal" placeholder="PayPal Link" class="w-full mb-2 px-3 py-2 text-sm border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700"> 
                <input type="text" id="prof-wise" placeholder="Wise Link" class="w-full mb-2 px-3 py-2 text-sm border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700"> 
                <textarea id="prof-bank" placeholder="Bank Transfer Details" class="w-full px-3 py-2 text-sm border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700" rows="2"></textarea> 
            </div> 
            `); 
        } 
        
        const historyListContainer = DOMUtils.get('history-list'); 
        if (historyListContainer && !DOMUtils.get('history-search')) { 
            historyListContainer.insertAdjacentHTML('beforebegin', ` 
            <div class="flex gap-2 mb-4"> 
                <input type="text" id="history-search" placeholder="Search Invoice # or Client" class="w-full px-3 py-2 text-xs border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-brand-500"> 
                <select id="history-status" class="px-3 py-2 text-xs border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700 outline-none"> 
                    <option value="">All Status</option> 
                    <option value="Paid">Paid</option> 
                    <option value="Unpaid">Unpaid</option> 
                    <option value="Pending">Pending</option> 
                </select> 
                <input type="date" id="history-date" class="px-3 py-2 text-xs border border-slate-300 rounded dark:bg-slate-900 dark:border-slate-700 outline-none"> 
            </div> 
            `); 
        } 
    } catch (error) { 
        console.error("UI Injection Error:", error); 
    } 
}

export function syncDOMWithState() {
    try {
        const { state } = store;
        DOMUtils.setVal('doc-type', state.docType);
        DOMUtils.setVal('currency', state.currency);
        DOMUtils.setVal('region', state.region);
        DOMUtils.setVal('doc-number', state.docNumber);
        DOMUtils.setVal('doc-date', state.date);
        DOMUtils.setVal('doc-due-date', state.dueDate);
        DOMUtils.setVal('sender-details', state.senderDetails);
        DOMUtils.setVal('client-details', state.clientDetails);
        DOMUtils.setVal('payment-details', state.paymentDetails);
        DOMUtils.setVal('payment-link-input', state.paymentLink || '');

        if (state.companyName) DOMUtils.setVal('prof-company-name', state.companyName); 
        DOMUtils.setVal('discount-type', state.discountType); 
        DOMUtils.setVal('discount-value', state.discountValue); 
        DOMUtils.setVal('tax-rate-manual', state.taxRateManual); 
        DOMUtils.setVal('doc-status', state.status); 
        DOMUtils.setVal('doc-template', state.template_id); 
        DOMUtils.setVal('invoice-notes', state.notes || ''); 
        DOMUtils.setVal('invoice-terms', state.terms || ''); 
        
        const toggleQr = DOMUtils.get('toggle-qr'); 
        if (toggleQr && toggleQr.type === 'checkbox') toggleQr.checked = state.showQR; 
        
        const taxContainer = DOMUtils.get('tax-input-container'); 
        if (taxContainer) taxContainer.style.display = state.region === 'USA' ? 'flex' : 'none'; 
        
        const langBtn = DOMUtils.get('btn-lang-toggle'); 
        if (langBtn) langBtn.textContent = state.lang.toUpperCase(); 
    } catch (error) { 
        console.error("DOM Sync Error:", error); 
    } 
}

// ==========================================
// 3. LIBRARY & PROFILE MANAGEMENT
// ==========================================

export function updateClientDropdown() {
    const select = DOMUtils.get('lib-clients');
    if (!select) return;
    try {
        // Escaped output to prevent XSS
        select.innerHTML = 'Load...' + store.library.clients.map((c, i) => {
            const shortName = escapeHTML(c.split('\n')[0].substring(0, 20));
            return `<option value="${i}">${shortName}</option>`;
        }).join('');
    } catch (e) {
        console.error("Client Dropdown Update Error:", e);
    }
}

export function updateProductDatalist() {
    const dp = DOMUtils.get('library-products');
    // Escaped output to prevent XSS
    if (dp) dp.innerHTML = store.library.products.map(p => `<option value="${escapeHTML(p.desc)}">`).join('');
}

export async function loadCompanyProfile() {
    try {
        let profileStr = await idbStorage.get('invoiceCompanyProfile');
        if (!profileStr) profileStr = localStorage.getItem('invoiceCompanyProfile'); // Redundant check for safety

        if (profileStr) { 
            let profile;
            try {
                profile = typeof profileStr === 'string' ? JSON.parse(profileStr) : profileStr; 
            } catch(e) {
                console.error("Profile JSON parse error", e);
                return;
            }

            if (profile.name) store.state.companyName = profile.name; 
            if (profile.address && !store.state.senderDetails) store.state.senderDetails = profile.address; 
            
            DOMUtils.setVal('prof-company-name', profile.name || ''); 
            DOMUtils.setVal('prof-company-address', profile.address || ''); 
            
            if (profile.paymentLinks) { 
                store.state.paymentLinks = profile.paymentLinks; 
                DOMUtils.setVal('prof-stripe', profile.paymentLinks.stripe || ''); 
                DOMUtils.setVal('prof-paypal', profile.paymentLinks.paypal || ''); 
                DOMUtils.setVal('prof-wise', profile.paymentLinks.wise || ''); 
                DOMUtils.setVal('prof-bank', profile.paymentLinks.bank || ''); 
            } 
        } 
    } catch (error) { 
        console.error("Profile Load Error:", error); 
    } 
}

// ==========================================
// 4. RENDERING & DASHBOARD
// ==========================================

export function renderClientsDbList() {
    const container = DOMUtils.get('clients-db-list');
    if (!container) return;

    if (!store.library.clients?.length) { 
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No database client profiles stored.</p>`; 
        return; 
    } 
    
    // Escaped output to prevent XSS
    container.innerHTML = store.library.clients.map((c, i) => ` 
    <li class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"> 
        <p class="text-xs font-mono font-medium truncate max-w-[300px] text-slate-700 dark:text-slate-300">${escapeHTML(c.split('\n')[0])}</p> 
        <button class="btn-del-client text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-1 rounded font-bold transition" data-index="${i}">Delete</button> 
    </li> 
    `).join(''); 
}

export function renderHistoryList() {
    const list = DOMUtils.get('history-list');
    if (!list) return;

    try { 
        const searchQ = DOMUtils.get('history-search')?.value.toLowerCase() || ''; 
        const statusF = DOMUtils.get('history-status')?.value || ''; 
        const dateF = DOMUtils.get('history-date')?.value || ''; 
        
        const filtered = store.library.history.filter(h => { 
            const matchQuery = h.docNumber.toLowerCase().includes(searchQ) || h.clientInfo.toLowerCase().includes(searchQ); 
            const matchStatus = statusF === '' || h.status === statusF; 
            const matchDate = dateF === '' || h.date === dateF; 
            return matchQuery && matchStatus && matchDate; 
        }); 
        
        if (filtered.length === 0) { 
            list.innerHTML = `<p class="text-sm text-slate-500 text-center py-6">No records found.</p>`; 
            return; 
        } 
        
        // Output with XSS escaping for safe rendering of records
        list.innerHTML = filtered.map(h => ` 
        <li class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition hover:shadow"> 
            <div> 
                <div class="flex items-center gap-2"> 
                    <p class="font-bold text-sm text-brand-600">${escapeHTML(h.docNumber)}</p> 
                    <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : h.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">${escapeHTML(h.status)}</span> 
                </div> 
                <p class="text-xs text-slate-500 font-medium">${escapeHTML(h.clientInfo)} • ${escapeHTML(h.currency)} ${h.total.toFixed(2)} • <span class="font-normal">${escapeHTML(h.date)}</span></p> 
            </div> 
            <div class="flex gap-2"> 
                <button class="btn-load-history px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold rounded-lg shadow-sm transition" data-id="${h.id}">Load</button> 
                <button class="btn-del-history px-2 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 text-xs font-semibold rounded-lg shadow-sm transition" data-id="${h.id}">Del</button> 
            </div> 
        </li> 
        `).join(''); 
    } catch (error) { 
        console.error("History Rendering Error:", error); 
    } 
}

export function updateDashboard() {
    if (!store.library.history) return;

    try { 
        let totalRev = 0, paid = 0, unpaid = 0; 
        const count = store.library.history.length; 
        const monthlyData = {}; 
        const statusData = { 'Paid': 0, 'Pending': 0, 'Unpaid': 0 }; 
        
        store.library.history.forEach(h => { 
            const status = h.status || 'Pending'; 
            if (status === 'Paid') { 
                paid++; 
                totalRev += h.total; 
            } else {
                unpaid++; 
            }
            statusData[status] = (statusData[status] || 0) + 1; 
            const month = new Date(h.date).toLocaleString('default', { month: 'short' }); 
            monthlyData[month] = (monthlyData[month] || 0) + (status === 'Paid' ? h.total : 0); 
        }); 
        
        const safeSetText = (id, text) => { 
            const el = DOMUtils.get(id); 
            if (el) el.textContent = text; 
        }; 
        
        safeSetText('dash-revenue', formatMoney(totalRev)); 
        safeSetText('dash-count', count); 
        safeSetText('dash-paid', paid); 
        safeSetText('dash-unpaid', unpaid); 
        
        if (typeof Chart !== 'undefined') { 
            const ctxRevEl = DOMUtils.get('revenueChart'); 
            if (ctxRevEl) { 
                if (store.chartsInstance.revenue) store.chartsInstance.revenue.destroy(); 
                store.chartsInstance.revenue = new Chart(ctxRevEl.getContext('2d'), { 
                    type: 'line', 
                    data: { 
                        labels: Object.keys(monthlyData).reverse(), 
                        datasets: [{ 
                            label: 'Revenue', 
                            data: Object.values(monthlyData).reverse(), 
                            borderColor: '#4f46e5', 
                            tension: 0.4, 
                            fill: true, 
                            backgroundColor: 'rgba(79, 70, 229, 0.1)' 
                        }] 
                    }, 
                    options: { responsive: true, plugins: { legend: { display: false } } } 
                }); 
            } 
            
            const ctxStatEl = DOMUtils.get('statusChart'); 
            if (ctxStatEl) { 
                if (store.chartsInstance.status) store.chartsInstance.status.destroy(); 
                store.chartsInstance.status = new Chart(ctxStatEl.getContext('2d'), { 
                    type: 'doughnut', 
                    data: { 
                        labels: Object.keys(statusData), 
                        datasets: [{ 
                            data: Object.values(statusData), 
                            backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'] 
                        }] 
                    }, 
                    options: { responsive: true, maintainAspectRatio: false } 
                }); 
            } 
        } 
    } catch (error) { 
        console.error("Dashboard Update Error:", error); 
    } 
}

export function renderItemsEditor() {
    const itemsContainer = DOMUtils.get('items-container');
    if (!itemsContainer) return;

    try { 
        itemsContainer.innerHTML = store.state.items.map(item => { 
            const qtyValue = item.qty === 0 ? '' : item.qty; 
            const priceValue = item.price === 0 ? '' : item.price; 
            // Escaped description for security
            return ` 
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 items-center"> 
                <input type="text" list="library-products" placeholder="Description" value="${escapeHTML(item.desc)}" data-id="${item.id}" data-field="desc" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500"> 
                <input type="number" min="1" step="1" value="${qtyValue}" placeholder="1" data-id="${item.id}" data-field="qty" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-center dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500"> 
                <input type="number" min="0" step="0.01" value="${priceValue}" placeholder="0.00" data-id="${item.id}" data-field="price" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-right dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500"> 
                <div class="text-right text-xs font-semibold px-2 item-total text-slate-800 dark:text-slate-100">${formatMoney(item.qty * item.price)}</div> 
                <button class="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-rose-50 hover:border-rose-200 text-rose-500 dark:hover:bg-rose-950/30 del-item outline-none shadow-sm transition focus:ring-2 focus:ring-rose-500/20" data-id="${item.id}"> 
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> 
                </button> 
            </div> 
            `}).join(''); 
    } catch (error) { 
        console.error("Item Rendering Error:", error); 
    } 
}

// ==========================================
// 5. MODULARIZED EVENT DELEGATION
// ==========================================

function initDocumentControls() {
    DOMUtils.on('btn-reset', 'click', () => {
        if (!confirm("Are you sure you want to start a new invoice? Current unsaved changes will be cleared.")) return;

        try { 
            let maxNum = store.library.history?.reduce((max, h) => { 
                const num = parseInt((h.docNumber.match(/\d+/) || [0])[0], 10); 
                return num > max ? num : max; 
            }, 0) || 0; 
            
            const nextNum = maxNum > 0 ? maxNum + 1 : 1001; 
            const prefix = store.state.docType === 'Invoice' ? 'INV-' : store.state.docType === 'Receipt' ? 'REC-' : 'QTE-'; 
            
            store.state = { 
                ...defaultState, 
                id: crypto.randomUUID(), 
                docNumber: prefix + nextNum.toString().padStart(4, '0'), 
                senderDetails: store.state.senderDetails, 
                paymentLinks: store.state.paymentLinks, 
                companyName: store.state.companyName, 
                logoDataUrl: store.state.logoDataUrl, 
                sigDataUrl: store.state.sigDataUrl, 
                lang: store.state.lang, 
                items: [{ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 }] 
            }; 
            
            saveState(); 
            syncDOMWithState(); 
            renderItemsEditor(); 
            renderPreview(); 
            showToast("Workspace cleared. Fresh invoice started."); 
        } catch (e) { 
            console.error("Reset Error:", e); 
        } 
    }); 
    
    const resetBtnEl = DOMUtils.get('btn-reset'); 
    if (resetBtnEl) { 
        resetBtnEl.textContent = "New Invoice"; 
        resetBtnEl.className = "px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded font-semibold text-sm transition"; 
    } 
    
    DOMUtils.on('btn-auto-invoice', 'click', () => { 
        let maxNum = store.library.history?.reduce((max, h) => { 
            const num = parseInt((h.docNumber.match(/\d+/) || [0])[0], 10); 
            return num > max ? num : max; 
        }, 0) || 0; 
        
        const nextNum = maxNum > 0 ? maxNum + 1 : 1001; 
        const prefix = store.state.docType === 'Invoice' ? 'INV-' : store.state.docType === 'Receipt' ? 'REC-' : 'QTE-'; 
        store.state.docNumber = prefix + nextNum.toString().padStart(4, '0'); 
        DOMUtils.setVal('doc-number', store.state.docNumber); 
        saveState(); 
        renderPreview(); 
        showToast(`Generated: ${store.state.docNumber}`); 
    }); 
    
    DOMUtils.on('btn-duplicate', 'click', () => { 
        if (!store.state.docNumber) return showToast("No active template instance to duplicate."); 
        store.state.id = crypto.randomUUID(); 
        store.state.docNumber = store.state.docNumber + "-DUP"; 
        DOMUtils.setVal('doc-number', store.state.docNumber); 
        saveState(); 
        renderPreview(); 
        showToast("Invoice duplicated. ID refreshed."); 
    }); 
}

function initProfileListeners() {
    ['prof-company-name', 'prof-company-address'].forEach(id => {
        DOMUtils.on(id, 'input', (e) => {
            const isName = id === 'prof-company-name';
            store.state[isName ? 'companyName' : 'senderDetails'] = e.target.value;
            if (!isName) DOMUtils.setVal('sender-details', store.state.senderDetails);
            saveState();
            renderPreview();
        });
    });

    DOMUtils.on('btn-save-profile', 'click', async () => { 
        try { 
            const name = DOMUtils.get('prof-company-name')?.value.trim(); 
            const address = DOMUtils.get('prof-company-address')?.value.trim(); 
            if (!name) return showToast("Company Name is required."); 
            
            const paymentLinks = { 
                stripe: DOMUtils.get('prof-stripe')?.value.trim() || '', 
                paypal: DOMUtils.get('prof-paypal')?.value.trim() || '', 
                wise: DOMUtils.get('prof-wise')?.value.trim() || '', 
                bank: DOMUtils.get('prof-bank')?.value.trim() || '' 
            }; 
            
            const profile = { name, address, paymentLinks }; 
            // Persist via IDB with LS fallback inside idbStorage 
            await idbStorage.set('invoiceCompanyProfile', JSON.stringify(profile)); 
            
            store.state.companyName = name; 
            store.state.senderDetails = address; 
            store.state.paymentLinks = paymentLinks; 
            DOMUtils.setVal('sender-details', store.state.senderDetails); 
            saveState(); 
            renderPreview(); 
            showToast("Profile saved successfully."); 
        } catch (e) { 
            console.error("Profile Save Error", e); 
            showToast("Failed to save profile."); 
        } 
    }); 
}

function initClientListeners() {
    DOMUtils.on('btn-save-client', 'click', () => {
        if (!store.state.clientDetails.trim()) return showToast("Client details are empty.");
        if (!store.library.clients.includes(store.state.clientDetails)) {
            store.library.clients.push(store.state.clientDetails);
            saveLibrary();
            updateClientDropdown();
            showToast("Client saved to library.");
        } else {
            showToast("Client already exists in library.");
        }
    });

    DOMUtils.on('lib-clients', 'change', (e) => { 
        if (e.target.value !== "") { 
            store.state.clientDetails = store.library.clients[parseInt(e.target.value)]; 
            DOMUtils.setVal('client-details', store.state.clientDetails); 
            saveState(); 
            renderPreview(); 
            e.target.value = ""; 
        } 
    }); 
    
    const clientsModal = DOMUtils.get('clients-modal'); 
    DOMUtils.on('btn-manage-clients', 'click', () => { 
        renderClientsDbList(); 
        clientsModal?.classList.remove('hidden'); 
    }); 
    
    DOMUtils.on('btn-close-clients', 'click', () => clientsModal?.classList.add('hidden')); 
    
    DOMUtils.on('clients-db-list', 'click', (e) => { 
        if (e.target.classList.contains('btn-del-client')) { 
            const index = parseInt(e.target.dataset.index, 10); 
            store.library.clients.splice(index, 1); 
            saveLibrary(); 
            updateClientDropdown(); 
            renderClientsDbList(); 
            showToast("Client configuration dropped from records."); 
        } 
    }); 
}

function initCloudSyncListeners() {
    DOMUtils.on('btn-save-invoice', 'click', async () => {
        try {
            const validation = validateInvoice();
            if (validation !== true) return showToast(validation);

            if (!store.state.id) store.state.id = crypto.randomUUID(); 
            
            const duplicateCheck = store.library.history.find(h => h.docNumber.trim() === store.state.docNumber.trim() && h.id !== store.state.id); 
            if (duplicateCheck) return showToast("Error: Invoice Number already exists."); 
            
            const record = { 
                id: store.state.id, 
                date: store.state.date, 
                docNumber: store.state.docNumber, 
                clientInfo: store.state.clientDetails.split('\n')[0], 
                total: store.calcTotals.total, 
                currency: store.state.currency, 
                status: store.state.status, 
                stateSnapshot: JSON.stringify(store.state) 
            }; 
            
            const existingIdx = store.library.history.findIndex(h => h.id === store.state.id); 
            if (existingIdx > -1) store.library.history[existingIdx] = record; 
            else store.library.history.unshift(record); 
            
            saveLibrary(); 
            
            // Sync with Firebase using secure retry wrapper
            if (window.firebaseDb) { 
                try { 
                    await withRetry(() => setDoc(doc(window.firebaseDb, "public_invoices", store.state.id), record, { merge: true }));
                } catch (dbErr) { 
                    console.error("Firebase Sync Error", dbErr); 
                    return showToast("Saved locally, but failed to sync to cloud.");
                } 
            } 
            showToast("Invoice secured to Cloud & History."); 
        } catch (error) { 
            console.error("Save Invoice Error:", error); 
            showToast("Error processing invoice save."); 
        } 
    }); 
}

function initNavigationListeners() {
    DOMUtils.on('nav-editor', 'click', (e) => {
        DOMUtils.get('view-editor')?.classList.remove('hidden');
        DOMUtils.get('view-dashboard')?.classList.add('hidden');
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600');
        DOMUtils.get('nav-dashboard')?.classList.remove('border-b-2', 'border-brand-600', 'text-brand-600');
    });

    DOMUtils.on('nav-dashboard', 'click', (e) => { 
        DOMUtils.get('view-editor')?.classList.add('hidden'); 
        DOMUtils.get('view-dashboard')?.classList.remove('hidden'); 
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600'); 
        DOMUtils.get('nav-editor')?.classList.remove('border-b-2', 'border-brand-600', 'text-brand-600'); 
        updateDashboard(); 
    }); 
}

function initHistoryAndBackupListeners() {
    const historyModal = DOMUtils.get('history-modal');
    DOMUtils.on('btn-history', 'click', () => { renderHistoryList(); historyModal?.classList.remove('hidden'); });
    DOMUtils.on('btn-close-history', 'click', () => historyModal?.classList.add('hidden'));

    ['history-search', 'history-status', 'history-date'].forEach(id => DOMUtils.on(id, 'input', renderHistoryList)); 
    
    DOMUtils.on('history-list', 'click', (e) => { 
        try { 
            const id = e.target.dataset.id; 
            if (!id) return; 
            
            if (e.target.classList.contains('btn-load-history')) { 
                const record = store.library.history.find(h => h.id === id); 
                if (record) { 
                    store.state = { ...defaultState, ...JSON.parse(record.stateSnapshot) }; 
                    saveState(); 
                    syncDOMWithState(); 
                    renderItemsEditor(); 
                    renderPreview(); 
                    historyModal?.classList.add('hidden'); 
                    showToast("Invoice loaded successfully."); 
                } 
            } else if (e.target.classList.contains('btn-del-history')) { 
                store.library.history = store.library.history.filter(h => h.id !== id); 
                saveLibrary(); 
                renderHistoryList(); 
            } 
        } catch (err) { 
            console.error("History Interaction Error:", err); 
        } 
    }); 
    
    DOMUtils.on('btn-export-backup', 'click', () => { 
        try { 
            const payload = JSON.stringify({ state: store.state, library: store.library }); 
            const blob = new Blob([payload], { type: "application/json" }); 
            const url = URL.createObjectURL(blob); 
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `SaaS_Backup_${new Date().toISOString().split('T')[0]}.json`; 
            a.click(); 
            URL.revokeObjectURL(url); 
            showToast("Backup generated."); 
        } catch (e) { 
            console.error("Backup Export Error:", e); 
        } 
    }); 
    
    DOMUtils.on('btn-import-backup', 'change', (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        
        const reader = new FileReader(); 
        reader.onload = function(evt) { 
            try { 
                const data = JSON.parse(evt.target.result); 
                // Enhanced validation for security
                if (!data || typeof data !== 'object' || Array.isArray(data)) {
                    throw new Error("Invalid JSON structure");
                }
                
                if (data.state && typeof data.state === 'object' && data.library && typeof data.library === 'object') { 
                    store.state = { ...defaultState, ...data.state }; 
                    store.library = data.library; 
                    saveState(); 
                    saveLibrary(); 
                    syncDOMWithState(); 
                    renderItemsEditor(); 
                    renderPreview(); 
                    updateDashboard(); 
                    showToast("System restored from backup."); 
                } else { 
                    showToast("Invalid enterprise backup format."); 
                } 
            } catch (err) { 
                console.error("Backup Import Error:", err); 
                showToast("Data integrity check failed on import."); 
            } 
        }; 
        reader.readAsText(file); 
        e.target.value = ''; 
    }); 
}

function initEditorInteractions() {
    const itemsContainer = DOMUtils.get('items-container');
    if (itemsContainer) {
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.tagName !== 'INPUT') return;
            try {
                const { id, field } = e.target.dataset;
                const item = store.state.items.find(i => i.id === id);
                if (item) {
                    item[field] = field === 'desc' ? e.target.value : parseFloat(e.target.value) || 0;

                    if (field === 'desc') { 
                        const libItem = store.library.products.find(p => p.desc === e.target.value); 
                        if (libItem) { 
                            item.price = libItem.price; 
                            e.target.closest('.grid').querySelector('[data-field="price"]').value = libItem.price; 
                        } 
                    } 
                    const row = e.target.closest('.grid'); 
                    const totalEl = row.querySelector('.item-total'); 
                    if (totalEl) totalEl.textContent = formatMoney(item.qty * item.price); 
                    
                    saveState(); 
                    renderPreview(); 
                } 
            } catch (err) { 
                console.error("Line Item Update Error:", err); 
            } 
        }); 
        
        itemsContainer.addEventListener('focusout', (e) => { 
            if (e.target.tagName === 'INPUT' && ['desc', 'price'].includes(e.target.dataset.field)) { 
                const item = store.state.items.find(i => i.id === e.target.dataset.id); 
                if (item && item.desc && item.price > 0) saveProductToLibrary(item.desc, item.price); 
            } 
        }); 
        
        itemsContainer.addEventListener('click', (e) => { 
            const btn = e.target.closest('.del-item'); 
            if (btn) { 
                store.state.items = store.state.items.filter(i => i.id !== btn.dataset.id); 
                if (store.state.items.length === 0) store.state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 }); 
                saveState(); 
                renderItemsEditor(); 
                renderPreview(); 
            } 
        }); 
    } 
    
    DOMUtils.on('btn-add-item', 'click', () => { 
        store.state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 }); 
        saveState(); 
        renderItemsEditor(); 
        renderPreview(); 
    }); 
}

function initFormInputBindings() {
    const bindChange = (id) => {
        DOMUtils.on(id, 'change', (e) => {
            const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (id === 'doc-template') store.state.template_id = e.target.value;
            else store.state[key] = e.target.value;

            if (id === 'region') { 
                const taxContainer = DOMUtils.get('tax-input-container'); 
                if (taxContainer) taxContainer.style.display = store.state.region === 'USA' ? 'flex' : 'none'; 
            } 
            
            saveState(); 
            if (id === 'currency') renderItemsEditor(); 
            renderPreview(); 
        }); 
    }; 
    ['doc-type', 'currency', 'region', 'doc-template', 'discount-type', 'doc-status'].forEach(bindChange); 
    
    const bindInput = (id) => { 
        DOMUtils.on(id, 'input', (e) => { 
            const mapping = { 
                'invoice-notes': 'notes', 
                'invoice-terms': 'terms', 
                'doc-date': 'date', 
                'doc-due-date': 'dueDate', 
                'payment-link-input': 'paymentLink' 
            }; 
            const key = mapping[id] || id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()); 
            store.state[key] = e.target.value; 
            saveState(); 
            renderPreview(); 
        }); 
    }; 
    ['doc-number', 'doc-date', 'doc-due-date', 'sender-details', 'client-details', 'payment-details', 'payment-link-input', 'discount-value', 'tax-rate-manual', 'invoice-notes', 'invoice-terms'].forEach(bindInput); 
    
    DOMUtils.on('btn-lang-toggle', 'click', (e) => { 
        store.state.lang = store.state.lang === 'en' ? 'ur' : 'en'; 
        e.target.textContent = store.state.lang.toUpperCase(); 
        saveState(); 
        renderPreview(); 
    }); 
    
    DOMUtils.on('btn-dark-toggle', 'click', () => document.documentElement.classList.toggle('dark')); 
}

// Master Initialization Function
export function setupUIListeners() {
    try {
        initDocumentControls();
        initProfileListeners();
        initClientListeners();
        initCloudSyncListeners();
        initNavigationListeners();
        initHistoryAndBackupListeners();
        initEditorInteractions();
        initFormInputBindings();
    } catch (error) {
        console.error("Critical Application Boot Error:", error);
        showToast("System initialization encountered an issue. Check console.");
    }
}
