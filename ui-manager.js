import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { defaultState } from "./config-data.js";
import { store, saveState, saveLibrary, validateInvoice, formatMoney, saveProductToLibrary } from "./invoice-manager.js";
import { renderPreview } from "./preview-manager.js";

export function showToast(msg) {
    const toastElApp = document.getElementById('toast');
    if(!toastElApp) return alert(msg); 
    toastElApp.textContent = msg;
    toastElApp.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toastElApp.classList.add('translate-y-24', 'opacity-0'), 3000);
}

export function injectDynamicUIElements() {
    // Replace manual tax input with a dropdown dynamically
    const taxManualEl = document.getElementById('tax-rate-manual');
    if (taxManualEl && taxManualEl.tagName.toLowerCase() === 'input') {
        const select = document.createElement('select');
        select.id = taxManualEl.id;
        select.className = taxManualEl.className;
        const rates = [0, 1, 2, 3, 4, 5, 7.5, 10, 12, 15, 18, 20, 25];
        select.innerHTML = rates.map(r => `<option value="${r}">${r}%</option>`).join('');
        taxManualEl.parentNode.replaceChild(select, taxManualEl);
    }

    // Add Advanced Backup & Payment config UI to DOM if missing
    const dashContainer = document.getElementById('view-dashboard');
    if (dashContainer && !document.getElementById('btn-export-backup')) {
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

    // Inject payment configuration into Company Profile Modal if missing
    const companyProfileBody = document.getElementById('prof-company-address');
    if (companyProfileBody && !document.getElementById('prof-stripe')) {
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

    // Advanced Search Injection in History
    const historyListContainer = document.getElementById('history-list');
    if (historyListContainer && !document.getElementById('history-search')) {
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
}

export function syncDOMWithState() {
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val; };
    
    setVal('doc-type', store.state.docType);
    setVal('currency', store.state.currency);
    setVal('region', store.state.region);
    setVal('doc-number', store.state.docNumber);
    setVal('doc-date', store.state.date);
    setVal('doc-due-date', store.state.dueDate);
    setVal('sender-details', store.state.senderDetails);
    setVal('client-details', store.state.clientDetails);
    setVal('payment-details', store.state.paymentDetails);
    setVal('discount-type', store.state.discountType);
    setVal('discount-value', store.state.discountValue);
    setVal('tax-rate-manual', store.state.taxRateManual);
    setVal('doc-status', store.state.status);
    setVal('doc-template', store.state.template_id);
    setVal('invoice-notes', store.state.notes || '');
    setVal('invoice-terms', store.state.terms || '');
    
    const toggleQr = document.getElementById('toggle-qr');
    if (toggleQr && toggleQr.type === 'checkbox') toggleQr.checked = store.state.showQR;

    const taxContainer = document.getElementById('tax-input-container');
    if(taxContainer) taxContainer.style.display = store.state.region === 'USA' ? 'flex' : 'none';
    
    const langBtn = document.getElementById('btn-lang-toggle');
    if(langBtn) langBtn.textContent = store.state.lang.toUpperCase();
}

export function updateClientDropdown() {
    const select = document.getElementById('lib-clients');
    if(!select) return;
    select.innerHTML = '<option value="">Load...</option>' + store.library.clients.map((c, i) => {
        const shortName = c.split('\n')[0].substring(0, 20);
        return `<option value="${i}">${shortName}</option>`;
    }).join('');
}

export function updateProductDatalist() {
    const dp = document.getElementById('library-products');
    if(dp) dp.innerHTML = store.library.products.map(p => `<option value="${p.desc}">`).join('');
}

export function loadCompanyProfile() {
    const profileStr = localStorage.getItem('invoiceCompanyProfile');
    if (profileStr) {
        try {
            const profile = JSON.parse(profileStr);
            if(document.getElementById('prof-company-name')) document.getElementById('prof-company-name').value = profile.name || '';
            if(document.getElementById('prof-company-address')) document.getElementById('prof-company-address').value = profile.address || '';
            
            if(profile.paymentLinks) {
                store.state.paymentLinks = profile.paymentLinks;
                if(document.getElementById('prof-stripe')) document.getElementById('prof-stripe').value = profile.paymentLinks.stripe || '';
                if(document.getElementById('prof-paypal')) document.getElementById('prof-paypal').value = profile.paymentLinks.paypal || '';
                if(document.getElementById('prof-wise')) document.getElementById('prof-wise').value = profile.paymentLinks.wise || '';
                if(document.getElementById('prof-bank')) document.getElementById('prof-bank').value = profile.paymentLinks.bank || '';
            }
        } catch(e){}
    }
}

export function renderClientsDbList() {
    const container = document.getElementById('clients-db-list');
    if(!container) return;
    if (!store.library.clients || store.library.clients.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No database client profiles stored.</p>`;
        return;
    }
    container.innerHTML = store.library.clients.map((c, i) => `
        <li class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <p class="text-xs font-mono font-medium truncate max-w-[300px] text-slate-700 dark:text-slate-300">${c.split('\n')[0]}</p>
            <button class="btn-del-client text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-1 rounded font-bold transition" data-index="${i}">Delete</button>
        </li>
    `).join('');
}

export function renderHistoryList() {
    const list = document.getElementById('history-list');
    if(!list) return;

    const searchQ = document.getElementById('history-search')?.value.toLowerCase() || '';
    const statusF = document.getElementById('history-status')?.value || '';
    const dateF = document.getElementById('history-date')?.value || '';

    const filtered = store.library.history.filter(h => {
        const matchQuery = h.docNumber.toLowerCase().includes(searchQ) || h.clientInfo.toLowerCase().includes(searchQ);
        const matchStatus = statusF === '' || h.status === statusF;
        const matchDate = dateF === '' || h.date === dateF;
        return matchQuery && matchStatus && matchDate;
    });

    if(filtered.length === 0) {
        list.innerHTML = `<p class="text-sm text-slate-500 text-center py-6">No records found.</p>`;
        return;
    }
    
    list.innerHTML = filtered.map(h => `
        <li class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm transition hover:shadow">
            <div>
                <div class="flex items-center gap-2">
                    <p class="font-bold text-sm text-brand-600">${h.docNumber}</p>
                    <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : h.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">${h.status}</span>
                </div>
                <p class="text-xs text-slate-500 font-medium">${h.clientInfo} • ${h.currency} ${h.total.toFixed(2)} • <span class="font-normal">${h.date}</span></p>
            </div>
            <div class="flex gap-2">
                <button class="btn-load-history px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold rounded-lg shadow-sm transition" data-id="${h.id}">Load</button>
                <button class="btn-del-history px-2 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 text-xs font-semibold rounded-lg shadow-sm transition" data-id="${h.id}">Del</button>
            </div>
        </li>
    `).join('');
}

export function updateDashboard() {
    if(!store.library.history) return;
    
    let totalRev = 0, count = store.library.history.length, paid = 0, unpaid = 0;
    let monthlyData = {};
    let statusData = { 'Paid': 0, 'Pending': 0, 'Unpaid': 0 };

    store.library.history.forEach(h => {
        const status = h.status || 'Pending';
        if(status === 'Paid') { paid++; totalRev += h.total; }
        else unpaid++;
        
        statusData[status] = (statusData[status] || 0) + 1;
        
        const month = new Date(h.date).toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + (status === 'Paid' ? h.total : 0);
    });

    if(document.getElementById('dash-revenue')) document.getElementById('dash-revenue').textContent = formatMoney(totalRev);
    if(document.getElementById('dash-count')) document.getElementById('dash-count').textContent = count;
    if(document.getElementById('dash-paid')) document.getElementById('dash-paid').textContent = paid;
    if(document.getElementById('dash-unpaid')) document.getElementById('dash-unpaid').textContent = unpaid;

    if(typeof Chart !== 'undefined') {
        const ctxRevEl = document.getElementById('revenueChart');
        if(ctxRevEl) {
            const ctxRev = ctxRevEl.getContext('2d');
            if(store.chartsInstance.revenue) store.chartsInstance.revenue.destroy();
            store.chartsInstance.revenue = new Chart(ctxRev, {
                type: 'line',
                data: {
                    labels: Object.keys(monthlyData).reverse(),
                    datasets: [{ label: 'Revenue', data: Object.values(monthlyData).reverse(), borderColor: '#4f46e5', tension: 0.4, fill: true, backgroundColor: 'rgba(79, 70, 229, 0.1)' }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });
        }

        const ctxStatEl = document.getElementById('statusChart');
        if(ctxStatEl) {
            const ctxStat = ctxStatEl.getContext('2d');
            if(store.chartsInstance.status) store.chartsInstance.status.destroy();
            store.chartsInstance.status = new Chart(ctxStat, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(statusData),
                    datasets: [{ data: Object.values(statusData), backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'] }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}

export function renderItemsEditor() {
    const itemsContainer = document.getElementById('items-container');
    if(!itemsContainer) return;
    // تبدیلی 1 اور 2: موبائل زوم کا مسئلہ حل کیا (text-base) اور واٹر مارک کا فکس کیا
    itemsContainer.innerHTML = store.state.items.map(item => {
        const qtyValue = item.qty === 0 ? '' : item.qty;
        const priceValue = item.price === 0 ? '' : item.price;
        return `
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 items-center">
            <input type="text" list="library-products" placeholder="Description" value="${item.desc}" data-id="${item.id}" data-field="desc" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
            <input type="number" min="1" step="1" value="${qtyValue}" placeholder="1" data-id="${item.id}" data-field="qty" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-center dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
            <input type="number" min="0" step="0.01" value="${priceValue}" placeholder="0.00" data-id="${item.id}" data-field="price" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-right dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
            <div class="text-right text-xs font-semibold px-2 item-total text-slate-800 dark:text-slate-100">${formatMoney(item.qty * item.price)}</div>
            <button class="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-rose-50 hover:border-rose-200 text-rose-500 dark:hover:bg-rose-950/30 del-item outline-none shadow-sm transition focus:ring-2 focus:ring-rose-500/20" data-id="${item.id}">
                <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </div>
    `}).join('');
}

export function setupUIListeners() {
    // New Invoice
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.outerHTML = btnReset.outerHTML; 
        document.getElementById('btn-reset').textContent = "New Invoice";
        document.getElementById('btn-reset').className = "px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded font-semibold text-sm transition";
        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Are you sure you want to start a new invoice? Current unsaved changes to items will be cleared.")) {
                
                let maxNum = 0;
                if (store.library.history && store.library.history.length > 0) {
                    store.library.history.forEach(h => {
                        const match = h.docNumber.match(/\d+/);
                        if (match) {
                            const num = parseInt(match[0], 10);
                            if (num > maxNum) maxNum = num;
                        }
                    });
                }
                const nextNum = maxNum > 0 ? maxNum + 1 : 1001;
                const prefix = store.state.docType === 'Invoice' ? 'INV-' : store.state.docType === 'Receipt' ? 'REC-' : 'QTE-';
                
                store.state = { 
                    ...defaultState, 
                    id: crypto.randomUUID(),
                    docNumber: prefix + nextNum.toString().padStart(4, '0'),
                    senderDetails: store.state.senderDetails, 
                    paymentLinks: store.state.paymentLinks,
                    logoDataUrl: store.state.logoDataUrl,
                    sigDataUrl: store.state.sigDataUrl,
                    lang: store.state.lang,
                    items: [{ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 }] 
                };
                
                saveState();
                syncDOMWithState();
                renderItemsEditor();
                renderPreview();
                showToast("Started fresh invoice. Workspace clear.");
            }
        });
    }

    document.getElementById('btn-auto-invoice')?.addEventListener('click', () => {
        let maxNum = 0;
        if (store.library.history && store.library.history.length > 0) {
            store.library.history.forEach(h => {
                const match = h.docNumber.match(/\d+/);
                if (match) {
                    const num = parseInt(match[0], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
        }
        const nextNum = maxNum > 0 ? maxNum + 1 : 1001;
        const prefix = store.state.docType === 'Invoice' ? 'INV-' : store.state.docType === 'Receipt' ? 'REC-' : 'QTE-';
        store.state.docNumber = prefix + nextNum.toString().padStart(4, '0');
        if(document.getElementById('doc-number')) document.getElementById('doc-number').value = store.state.docNumber;
        saveState();
        renderPreview();
        showToast(`Generated: ${store.state.docNumber}`);
    });

    // Profile Saves
    document.getElementById('btn-save-profile')?.addEventListener('click', () => {
        const name = document.getElementById('prof-company-name')?.value.trim();
        const address = document.getElementById('prof-company-address')?.value.trim();
        
        if (!name) return showToast("Company Name is required.");
        
        const paymentLinks = {
            stripe: document.getElementById('prof-stripe')?.value.trim() || '',
            paypal: document.getElementById('prof-paypal')?.value.trim() || '',
            wise: document.getElementById('prof-wise')?.value.trim() || '',
            bank: document.getElementById('prof-bank')?.value.trim() || ''
        };

        const profile = { name, address, paymentLinks };
        localStorage.setItem('invoiceCompanyProfile', JSON.stringify(profile));
        
        store.state.senderDetails = `${name}\n${address}`;
        store.state.paymentLinks = paymentLinks;

        if(document.getElementById('sender-details')) document.getElementById('sender-details').value = store.state.senderDetails;
        
        saveState();
        renderPreview();
        showToast("Company profile saved.");
    });

    document.getElementById('btn-duplicate')?.addEventListener('click', () => {
        if (!store.state.docNumber) return showToast("No active template instance to duplicate.");
        store.state.id = crypto.randomUUID(); 
        store.state.docNumber = store.state.docNumber + "-DUP";
        if(document.getElementById('doc-number')) document.getElementById('doc-number').value = store.state.docNumber;
        saveState();
        renderPreview();
        showToast("Invoice duplicated. ID refreshed.");
    });

    // Clients
    document.getElementById('btn-save-client')?.addEventListener('click', () => {
        if(!store.state.clientDetails.trim()) return showToast("Client details are empty.");
        if(!store.library.clients.includes(store.state.clientDetails)) {
            store.library.clients.push(store.state.clientDetails);
            saveLibrary();
            updateClientDropdown();
            showToast("Client saved to library.");
        } else {
            showToast("Client already in library.");
        }
    });

    document.getElementById('lib-clients')?.addEventListener('change', (e) => {
        if(e.target.value !== "") {
            store.state.clientDetails = store.library.clients[parseInt(e.target.value)];
            if(document.getElementById('client-details')) document.getElementById('client-details').value = store.state.clientDetails;
            saveState();
            renderPreview();
            e.target.value = ""; 
        }
    });

    const clientsModal = document.getElementById('clients-modal');
    document.getElementById('btn-manage-clients')?.addEventListener('click', () => {
        renderClientsDbList();
        clientsModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-clients')?.addEventListener('click', () => clientsModal.classList.add('hidden'));

    document.getElementById('clients-db-list')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-del-client')) {
            const index = parseInt(e.target.dataset.index, 10);
            store.library.clients.splice(index, 1);
            saveLibrary();
            updateClientDropdown();
            renderClientsDbList();
            showToast("Client configuration dropped from records.");
        }
    });

    // Save Cloud Invoice
    document.getElementById('btn-save-invoice')?.addEventListener('click', async () => {
        const validation = validateInvoice();
        if (validation !== true) return showToast(validation);

        if (!store.state.id) store.state.id = crypto.randomUUID();

        const duplicateCheck = store.library.history.find(h => h.docNumber.trim() === store.state.docNumber.trim() && h.id !== store.state.id);
        if(duplicateCheck) {
            return showToast("Error: Invoice Number already exists! Prevented saving duplicate.");
        }

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
        if(existingIdx > -1) store.library.history[existingIdx] = record;
        else store.library.history.unshift(record);
        
        saveLibrary();
        
        if(window.firebaseDb) {
            try {
                await setDoc(doc(window.firebaseDb, "public_invoices", store.state.id), record, {merge:true});
            } catch(e) { console.error("Error making public URL", e); }
        }

        showToast("Invoice saved to Cloud & History.");
    });

    // Navigation Logic
    document.getElementById('nav-editor')?.addEventListener('click', (e) => {
        document.getElementById('view-editor').classList.remove('hidden');
        document.getElementById('view-dashboard').classList.add('hidden');
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600');
        document.getElementById('nav-dashboard').classList.remove('border-b-2', 'border-brand-600', 'text-brand-600');
    });

    document.getElementById('nav-dashboard')?.addEventListener('click', (e) => {
        document.getElementById('view-editor').classList.add('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600');
        document.getElementById('nav-editor').classList.remove('border-b-2', 'border-brand-600', 'text-brand-600');
        updateDashboard();
    });

    // History Modal
    const historyModal = document.getElementById('history-modal');
    document.getElementById('btn-history')?.addEventListener('click', () => {
        renderHistoryList();
        historyModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-history')?.addEventListener('click', () => historyModal.classList.add('hidden'));

    document.getElementById('history-search')?.addEventListener('input', renderHistoryList);
    document.getElementById('history-status')?.addEventListener('change', renderHistoryList);
    document.getElementById('history-date')?.addEventListener('change', renderHistoryList);

    document.getElementById('history-list')?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if(!id) return;
        if(e.target.classList.contains('btn-load-history')) {
            const record = store.library.history.find(h => h.id === id);
            if(record) {
                store.state = { ...defaultState, ...JSON.parse(record.stateSnapshot) };
                saveState();
                syncDOMWithState();
                renderItemsEditor();
                renderPreview();
                historyModal.classList.add('hidden');
                showToast("Invoice loaded.");
            }
        } else if(e.target.classList.contains('btn-del-history')) {
            store.library.history = store.library.history.filter(h => h.id !== id);
            saveLibrary();
            renderHistoryList();
        }
    });

    // Backup and Restore
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
        const payload = JSON.stringify({ state: store.state, library: store.library });
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_backup_${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Backup downloaded!");
    });

    document.getElementById('btn-import-backup')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if(data.state && data.library) {
                    store.state = { ...defaultState, ...data.state };
                    store.library = data.library;
                    saveState();
                    saveLibrary();
                    syncDOMWithState();
                    renderItemsEditor();
                    renderPreview();
                    updateDashboard();
                    showToast("Backup restored successfully.");
                } else {
                    showToast("Invalid backup file format.");
                }
            } catch(err) {
                showToast("Error parsing backup JSON.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Items Editor Listeners
    const itemsContainer = document.getElementById('items-container');
    if(itemsContainer) {
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                const item = store.state.items.find(i => i.id === id);
                if(item) {
                    item[field] = field === 'desc' ? e.target.value : parseFloat(e.target.value) || 0;
                    
                    if(field === 'desc') {
                        const libItem = store.library.products.find(p => p.desc === e.target.value);
                        if(libItem) {
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
            }
        });

        itemsContainer.addEventListener('focusout', (e) => {
            if(e.target.tagName === 'INPUT' && (e.target.dataset.field === 'desc' || e.target.dataset.field === 'price')) {
                const id = e.target.dataset.id;
                const item = store.state.items.find(i => i.id === id);
                if(item && item.desc && item.price > 0) saveProductToLibrary(item.desc, item.price);
            }
        });

        itemsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.del-item');
            if (btn) {
                const id = btn.dataset.id;
                store.state.items = store.state.items.filter(i => i.id !== id);
                if(store.state.items.length === 0) {
                    store.state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 });
                }
                saveState();
                renderItemsEditor(); 
                renderPreview();
            }
        });
    }

    document.getElementById('btn-lang-toggle')?.addEventListener('click', (e) => {
        store.state.lang = store.state.lang === 'en' ? 'ur' : 'en';
        e.target.textContent = store.state.lang.toUpperCase();
        saveState();
        renderPreview();
    });

    ['doc-type', 'currency', 'region', 'doc-template', 'discount-type', 'doc-status'].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('change', e => { 
            const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (id === 'doc-template') store.state.template_id = e.target.value;
            else store.state[key] = e.target.value;
            
            if(id === 'region') {
                const taxContainer = document.getElementById('tax-input-container');
                if(taxContainer) taxContainer.style.display = store.state.region === 'USA' ? 'flex' : 'none';
            }
            
            saveState();
            if(id === 'currency') renderItemsEditor(); 
            renderPreview();
        });
    });

    ['doc-number', 'doc-date', 'doc-due-date', 'sender-details', 'client-details', 'payment-details', 'discount-value', 'tax-rate-manual', 'invoice-notes', 'invoice-terms'].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('input', e => {
            if (id === 'invoice-notes') {
                store.state.notes = e.target.value;
            } else if (id === 'invoice-terms') {
                store.state.terms = e.target.value;
            } else {
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                store.state[key === 'docDate' ? 'date' : key] = e.target.value;
            }
            saveState();
            renderPreview();
        });
    });

    document.getElementById('btn-add-item')?.addEventListener('click', () => {
        store.state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 });
        saveState();
        renderItemsEditor(); 
        renderPreview();
    });

    document.getElementById('btn-dark-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });
}
