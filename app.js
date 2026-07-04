// app.js

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { dict, defaultState } from "./config-data.js"; 
import "./firebase-auth.js"; // اس سے آپ کا لاگ ان/سائن اپ سسٹم خود بخود ایکٹو ہو جائے گا

// Application Business Logic
document.addEventListener('DOMContentLoaded', async () => {
    const toastElApp = document.getElementById('toast');
    function showToast(msg) {
        if(!toastElApp) return alert(msg); 
        toastElApp.textContent = msg;
        toastElApp.classList.remove('translate-y-24', 'opacity-0');
        setTimeout(() => toastElApp.classList.add('translate-y-24', 'opacity-0'), 3000);
    }

    // Public Invoice Link Check
    const urlParams = new URLSearchParams(window.location.search);
    const publicInvoiceId = urlParams.get('invoice');
    if (publicInvoiceId) {
        try {
            const docRef = doc(window.firebaseDb, "public_invoices", publicInvoiceId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const publicData = docSnap.data();
                document.body.innerHTML = '';
                document.body.className = 'bg-slate-100 flex justify-center py-10';
                
                const previewEl = document.createElement('div');
                previewEl.id = 'doc-preview';
                previewEl.className = 'a4-document bg-white text-slate-900 shadow-xl';
                document.body.appendChild(previewEl);

                // Temporary assignment for rendering
                state = { ...defaultState, ...JSON.parse(publicData.stateSnapshot) };
                
                // Construct structure
                previewEl.innerHTML = `
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <img id="prev-logo" class="${state.logoDataUrl ? '' : 'hidden'}" src="${state.logoDataUrl || ''}" style="max-height: 80px; margin-bottom: 15px;">
                            <h2 id="prev-title" class="text-3xl font-light tracking-wide text-brand-600 mb-1">${state.docType.toUpperCase()}</h2>
                            <p id="prev-number-label" class="text-sm font-bold text-slate-700"># ${state.docNumber}</p>
                            <span id="prev-status-badge"></span>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-slate-700 mb-1"><span id="lbl-date" class="text-slate-500 font-normal mr-2"></span><span id="prev-date">${state.date}</span></p>
                            <p class="text-sm font-semibold text-slate-700"><span id="lbl-due" class="text-slate-500 font-normal mr-2"></span><span id="prev-due-date">${state.dueDate}</span></p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p id="lbl-from" class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"></p>
                            <div id="prev-sender" class="text-sm text-slate-600 leading-relaxed"></div>
                        </div>
                        <div class="text-right">
                            <p id="lbl-to" class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"></p>
                            <div id="prev-client" class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">${state.clientDetails}</div>
                        </div>
                    </div>
                    <table class="w-full mb-8 text-sm">
                        <thead>
                            <tr class="border-b-2 border-brand-600">
                                <th id="lbl-desc" class="py-2 text-left font-bold text-slate-700"></th>
                                <th id="lbl-qty" class="py-2 text-center font-bold text-slate-700 w-24"></th>
                                <th id="lbl-price" class="py-2 text-right font-bold text-slate-700 w-32"></th>
                                <th id="lbl-total" class="py-2 text-right font-bold text-slate-700 w-32"></th>
                            </tr>
                        </thead>
                        <tbody id="prev-items-body"></tbody>
                    </table>
                    <div class="flex justify-between items-start mb-8">
                        <div class="w-1/2 pr-8">
                            <div id="prev-notes-terms-container" class="hidden">
                                <div id="prev-notes-box" class="mb-4">
                                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                                    <p id="prev-notes-content" class="text-xs text-slate-600 whitespace-pre-wrap"></p>
                                </div>
                                <div id="prev-terms-box">
                                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Terms</p>
                                    <p id="prev-terms-content" class="text-xs text-slate-600 whitespace-pre-wrap"></p>
                                </div>
                            </div>
                            <div class="mt-6">
                                <p id="lbl-payment" class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1"></p>
                                <p id="prev-payment-details" class="text-xs text-slate-600 whitespace-pre-wrap"></p>
                                <div id="qr-code-container" class="mt-3"></div>
                            </div>
                        </div>
                        <div class="w-1/2 max-w-sm ml-auto">
                            <div class="bg-slate-50 rounded-lg p-4">
                                <div class="flex justify-between items-center mb-2 text-sm">
                                    <span id="lbl-subtotal" class="text-slate-500"></span>
                                    <span id="prev-subtotal" class="font-semibold text-slate-700"></span>
                                </div>
                                <div id="prev-discount-row" class="flex justify-between items-center mb-2 text-sm text-emerald-600 hidden">
                                    <span id="lbl-discount"></span>
                                    <span id="prev-discount"></span>
                                </div>
                                <div class="flex justify-between items-center mb-4 text-sm">
                                    <span id="prev-tax-label" class="text-slate-500"></span>
                                    <span id="prev-tax" class="font-semibold text-slate-700"></span>
                                </div>
                                <div class="flex justify-between items-center pt-3 border-t border-slate-200">
                                    <span id="lbl-grandtotal" class="font-bold text-slate-800"></span>
                                    <span id="prev-total" class="font-black text-xl text-brand-600"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="sig-container" class="mt-16 border-t border-slate-200 pt-8 inline-block hidden">
                        <img id="prev-sig" style="max-height: 60px; margin-bottom: 5px;">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Authorized Signature</p>
                    </div>
                `;
                renderPreview(); // Will hook into the newly created DOM structure
                
                // Inject floating print button for public viewer
                const floatBtn = document.createElement('button');
                floatBtn.innerText = 'Print / Save PDF';
                floatBtn.className = 'fixed bottom-6 right-6 bg-brand-600 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-brand-700 transition';
                floatBtn.onclick = () => window.print();
                document.body.appendChild(floatBtn);
                
                return; // Stop further execution of app
            }
        } catch (error) {
            console.error("Error loading public invoice", error);
        }
    }

    let state = { ...defaultState };
    let library = { clients: [], products: [], history: [] };
    let chartsInstance = { revenue: null, status: null };

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
        document.getElementById('history-search').addEventListener('input', renderHistoryList);
        document.getElementById('history-status').addEventListener('change', renderHistoryList);
        document.getElementById('history-date').addEventListener('change', renderHistoryList);
    }

    // Validation Function
    function validateInvoice() {
        if (!state.senderDetails || !state.senderDetails.trim()) {
            showToast("Validation Error: Company Name / Sender Details are required.");
            return false;
        }
        if (!state.clientDetails || !state.clientDetails.trim()) {
            showToast("Validation Error: Client Information is required.");
            return false;
        }
        if (!state.docNumber || !state.docNumber.trim()) {
            showToast("Validation Error: Invoice Number is required.");
            return false;
        }
        const hasValidItem = state.items.some(i => i.desc && i.desc.trim() !== '');
        if (!hasValidItem || state.items.length === 0) {
            showToast("Validation Error: At least one item with a description is required.");
            return false;
        }
        return true;
    }

    function loadAppData() {
        const savedState = localStorage.getItem('invoiceStatePro');
        const savedLib = localStorage.getItem('invoiceLibraryPro');
        if (savedState) {
            try { state = { ...defaultState, ...JSON.parse(savedState) }; } catch(e){}
        }
        if (savedLib) {
            try { library = { clients: [], products: [], history: [], ...JSON.parse(savedLib) }; } catch(e){}
        }
        
        // Ensure state id is ready
        if(!state.id) state.id = crypto.randomUUID();

        syncDOMWithState();
        updateClientDropdown();
        updateProductDatalist();
        updateDashboard();
        loadCompanyProfile();
    }

    async function syncCloud() {
        if(window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
            const uid = window.firebaseAuth.currentUser.uid;
            try {
                await setDoc(doc(window.firebaseDb, "users", uid), { library: JSON.stringify(library), state: JSON.stringify(state), lastSync: new Date().toISOString() }, { merge: true });
            } catch(e) { console.error("Cloud sync error", e); }
        }
    }

    function saveState() { 
        localStorage.setItem('invoiceStatePro', JSON.stringify(state)); 
        syncCloud();
    }
    function saveLibrary() { 
        localStorage.setItem('invoiceLibraryPro', JSON.stringify(library)); 
        syncCloud();
        updateDashboard();
    }

    window.addEventListener('auth-ready', async () => {
        const uid = window.firebaseAuth.currentUser.uid;
        try {
            const docSnap = await getDoc(doc(window.firebaseDb, "users", uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(data.state) state = { ...defaultState, ...JSON.parse(data.state) };
                if(data.library) library = { clients: [], products: [], history: [], ...JSON.parse(data.library) };
                syncDOMWithState();
                updateClientDropdown();
                updateProductDatalist();
                renderItemsEditor();
                renderPreview();
                updateDashboard();
                loadCompanyProfile();
                showToast("Cloud data synced successfully.");
            }
        } catch(e) { console.error("Cloud load error", e); }
    });

    function syncDOMWithState() {
        const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).value = val; };
        
        setVal('doc-type', state.docType);
        setVal('currency', state.currency);
        setVal('region', state.region);
        setVal('doc-number', state.docNumber);
        setVal('doc-date', state.date);
        setVal('doc-due-date', state.dueDate);
        setVal('sender-details', state.senderDetails);
        setVal('client-details', state.clientDetails);
        setVal('payment-details', state.paymentDetails);
        setVal('discount-type', state.discountType);
        setVal('discount-value', state.discountValue);
        setVal('tax-rate-manual', state.taxRateManual);
        setVal('doc-status', state.status);
        setVal('doc-template', state.template_id);
        setVal('invoice-notes', state.notes || '');
        setVal('invoice-terms', state.terms || '');
        
        const toggleQr = document.getElementById('toggle-qr');
        if (toggleQr && toggleQr.type === 'checkbox') toggleQr.checked = state.showQR;

        const taxContainer = document.getElementById('tax-input-container');
        if(taxContainer) taxContainer.style.display = state.region === 'USA' ? 'flex' : 'none';
        
        const langBtn = document.getElementById('btn-lang-toggle');
        if(langBtn) langBtn.textContent = state.lang.toUpperCase();
    }

    loadAppData();

    let calcTotals = { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const itemsContainer = document.getElementById('items-container');

    function formatMoney(amount) {
        const locales = { 'USD': 'en-US', 'GBP': 'en-GB', 'CAD': 'en-CA', 'AUD': 'en-AU', 'EUR': 'en-IE', 'PKR': 'en-PK' };
        return new Intl.NumberFormat(locales[state.currency] || 'en-US', {
            style: 'currency', currency: state.currency
        }).format(amount);
    }

    function getTaxRate() {
        switch(state.region) {
            case 'UK': return 20; case 'CAN': return 5; case 'AUS': return 10;
            case 'USA': return parseFloat(state.taxRateManual) || 0; default: return 0;
        }
    }

    function calculate() {
        let sub = state.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
        let dVal = parseFloat(state.discountValue) || 0;
        let disc = state.discountType === 'percent' ? sub * (dVal / 100) : dVal;
        let afterDisc = Math.max(0, sub - disc);
        let tax = afterDisc * (getTaxRate() / 100);
        calcTotals = { subtotal: sub, discount: disc, tax: tax, total: afterDisc + tax };
    }

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.outerHTML = btnReset.outerHTML; 
        document.getElementById('btn-reset').textContent = "New Invoice";
        document.getElementById('btn-reset').className = "px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded font-semibold text-sm transition";
        document.getElementById('btn-reset').addEventListener('click', () => {
            if(confirm("Are you sure you want to start a new invoice? Current unsaved changes to items will be cleared.")) {
                
                let maxNum = 0;
                if (library.history && library.history.length > 0) {
                    library.history.forEach(h => {
                        const match = h.docNumber.match(/\d+/);
                        if (match) {
                            const num = parseInt(match[0], 10);
                            if (num > maxNum) maxNum = num;
                        }
                    });
                }
                const nextNum = maxNum > 0 ? maxNum + 1 : 1001;
                const prefix = state.docType === 'Invoice' ? 'INV-' : state.docType === 'Receipt' ? 'REC-' : 'QTE-';
                
                state = { 
                    ...defaultState, 
                    id: crypto.randomUUID(),
                    docNumber: prefix + nextNum.toString().padStart(4, '0'),
                    senderDetails: state.senderDetails, 
                    paymentLinks: state.paymentLinks,
                    logoDataUrl: state.logoDataUrl,
                    sigDataUrl: state.sigDataUrl,
                    lang: state.lang,
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
        if (library.history && library.history.length > 0) {
            library.history.forEach(h => {
                const match = h.docNumber.match(/\d+/);
                if (match) {
                    const num = parseInt(match[0], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
        }
        const nextNum = maxNum > 0 ? maxNum + 1 : 1001;
        const prefix = state.docType === 'Invoice' ? 'INV-' : state.docType === 'Receipt' ? 'REC-' : 'QTE-';
        state.docNumber = prefix + nextNum.toString().padStart(4, '0');
        if(document.getElementById('doc-number')) document.getElementById('doc-number').value = state.docNumber;
        saveState();
        renderPreview();
        showToast(`Generated: ${state.docNumber}`);
    });

    // Company Profile Operations
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
        
        state.senderDetails = `${name}\n${address}`;
        state.paymentLinks = paymentLinks;

        if(document.getElementById('sender-details')) document.getElementById('sender-details').value = state.senderDetails;
        
        saveState();
        renderPreview();
        showToast("Company profile saved.");
    });

    function loadCompanyProfile() {
        const profileStr = localStorage.getItem('invoiceCompanyProfile');
        if (profileStr) {
            try {
                const profile = JSON.parse(profileStr);
                if(document.getElementById('prof-company-name')) document.getElementById('prof-company-name').value = profile.name || '';
                if(document.getElementById('prof-company-address')) document.getElementById('prof-company-address').value = profile.address || '';
                
                if(profile.paymentLinks) {
                    state.paymentLinks = profile.paymentLinks;
                    if(document.getElementById('prof-stripe')) document.getElementById('prof-stripe').value = profile.paymentLinks.stripe || '';
                    if(document.getElementById('prof-paypal')) document.getElementById('prof-paypal').value = profile.paymentLinks.paypal || '';
                    if(document.getElementById('prof-wise')) document.getElementById('prof-wise').value = profile.paymentLinks.wise || '';
                    if(document.getElementById('prof-bank')) document.getElementById('prof-bank').value = profile.paymentLinks.bank || '';
                }
            } catch(e){}
        }
    }

    document.getElementById('btn-duplicate')?.addEventListener('click', () => {
        if (!state.docNumber) return showToast("No active template instance to duplicate.");
        state.id = crypto.randomUUID(); 
        state.docNumber = state.docNumber + "-DUP";
        if(document.getElementById('doc-number')) document.getElementById('doc-number').value = state.docNumber;
        saveState();
        renderPreview();
        showToast("Invoice duplicated. ID refreshed.");
    });

    const btnPrintMode = document.getElementById('btn-print-mode');
    const btnExitPrint = document.getElementById('btn-exit-print-preview');
    if (btnPrintMode) {
        btnPrintMode.addEventListener('click', () => {
            document.body.classList.add('print-preview-active');
            if (btnExitPrint) btnExitPrint.classList.remove('hidden');
            window.print();
        });
    }
    if (btnExitPrint) {
        btnExitPrint.addEventListener('click', () => {
            document.body.classList.remove('print-preview-active');
            btnExitPrint.classList.add('hidden');
        });
    }

    document.getElementById('btn-save-client')?.addEventListener('click', () => {
        if(!state.clientDetails.trim()) return showToast("Client details are empty.");
        if(!library.clients.includes(state.clientDetails)) {
            library.clients.push(state.clientDetails);
            saveLibrary();
            updateClientDropdown();
            showToast("Client saved to library.");
        } else {
            showToast("Client already in library.");
        }
    });

    document.getElementById('lib-clients')?.addEventListener('change', (e) => {
        if(e.target.value !== "") {
            state.clientDetails = library.clients[parseInt(e.target.value)];
            if(document.getElementById('client-details')) document.getElementById('client-details').value = state.clientDetails;
            saveState();
            renderPreview();
            e.target.value = ""; 
        }
    });

    function updateClientDropdown() {
        const select = document.getElementById('lib-clients');
        if(!select) return;
        select.innerHTML = '<option value="">Load...</option>' + library.clients.map((c, i) => {
            const shortName = c.split('\n')[0].substring(0, 20);
            return `<option value="${i}">${shortName}</option>`;
        }).join('');
    }

    const clientsModal = document.getElementById('clients-modal');
    document.getElementById('btn-manage-clients')?.addEventListener('click', () => {
        renderClientsDbList();
        clientsModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-clients')?.addEventListener('click', () => clientsModal.classList.add('hidden'));

    function renderClientsDbList() {
        const container = document.getElementById('clients-db-list');
        if(!container) return;
        if (!library.clients || library.clients.length === 0) {
            container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">No database client profiles stored.</p>`;
            return;
        }
        container.innerHTML = library.clients.map((c, i) => `
            <li class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <p class="text-xs font-mono font-medium truncate max-w-[300px] text-slate-700 dark:text-slate-300">${c.split('\n')[0]}</p>
                <button class="btn-del-client text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-1 rounded font-bold transition" data-index="${i}">Delete</button>
            </li>
        `).join('');
    }

    document.getElementById('clients-db-list')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-del-client')) {
            const index = parseInt(e.target.dataset.index, 10);
            library.clients.splice(index, 1);
            saveLibrary();
            updateClientDropdown();
            renderClientsDbList();
            showToast("Client configuration dropped from records.");
        }
    });

    function saveProductToLibrary(desc, price) {
        if(!desc.trim()) return;
        const existing = library.products.find(p => p.desc === desc);
        if(existing) { existing.price = price; } 
        else { library.products.push({desc, price}); }
        saveLibrary();
        updateProductDatalist();
    }

    function updateProductDatalist() {
        const dp = document.getElementById('library-products');
        if(dp) dp.innerHTML = library.products.map(p => `<option value="${p.desc}">`).join('');
    }

    document.getElementById('btn-save-invoice')?.addEventListener('click', async () => {
        if (!validateInvoice()) return;

        if (!state.id) state.id = crypto.randomUUID();

        const duplicateCheck = library.history.find(h => h.docNumber.trim() === state.docNumber.trim() && h.id !== state.id);
        if(duplicateCheck) {
            return showToast("Error: Invoice Number already exists! Prevented saving duplicate.");
        }

        const record = {
            id: state.id,
            date: state.date,
            docNumber: state.docNumber,
            clientInfo: state.clientDetails.split('\n')[0],
            total: calcTotals.total,
            currency: state.currency,
            status: state.status,
            stateSnapshot: JSON.stringify(state)
        };
        
        const existingIdx = library.history.findIndex(h => h.id === state.id);
        if(existingIdx > -1) library.history[existingIdx] = record;
        else library.history.unshift(record);
        
        saveLibrary();
        
        if(window.firebaseDb) {
            try {
                await setDoc(doc(window.firebaseDb, "public_invoices", state.id), record, {merge:true});
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

    // Share & Email Features
    const shareModal = document.getElementById('share-modal');
    document.getElementById('btn-share')?.addEventListener('click', async () => {
        if (!validateInvoice()) return;
        if (!state.id) state.id = crypto.randomUUID();
        
        const shareLink = `${window.location.origin}${window.location.pathname}?invoice=${state.id}`;
        document.getElementById('share-link-input').value = shareLink;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice ${state.docNumber}`,
                    text: `Please find the details for invoice ${state.docNumber} from ${state.senderDetails.split('\n')[0]}.\nTotal: ${formatMoney(calcTotals.total)}`,
                    url: shareLink
                });
                showToast("Shared successfully.");
            } catch (err) {
                shareModal.classList.remove('hidden');
            }
        } else {
            shareModal.classList.remove('hidden');
        }
    });

    document.getElementById('btn-close-share')?.addEventListener('click', () => shareModal.classList.add('hidden'));
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
        const linkInput = document.getElementById('share-link-input');
        if(linkInput) {
            navigator.clipboard.writeText(linkInput.value);
            showToast("Link copied to clipboard!");
        }
    });

    document.getElementById('btn-email')?.addEventListener('click', () => {
        if (!validateInvoice()) return;
        if (!state.id) state.id = crypto.randomUUID();

        const shareLink = `${window.location.origin}${window.location.pathname}?invoice=${state.id}`;
        const subject = encodeURIComponent(`Invoice ${state.docNumber} from ${state.senderDetails.split('\n')[0]}`);
        const body = encodeURIComponent(`Hello,\n\nPlease find the details for invoice ${state.docNumber} below.\n\nTotal: ${formatMoney(calcTotals.total)}\nDue Date: ${state.dueDate || 'N/A'}\n\nView or download your invoice here:\n${shareLink}\n\nThank you for your business!`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        showToast("Opening Email client...");
    });

    const historyModal = document.getElementById('history-modal');
    document.getElementById('btn-history')?.addEventListener('click', () => {
        renderHistoryList();
        historyModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-history')?.addEventListener('click', () => historyModal.classList.add('hidden'));

    function renderHistoryList() {
        const list = document.getElementById('history-list');
        if(!list) return;

        const searchQ = document.getElementById('history-search')?.value.toLowerCase() || '';
        const statusF = document.getElementById('history-status')?.value || '';
        const dateF = document.getElementById('history-date')?.value || '';

        const filtered = library.history.filter(h => {
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

    document.getElementById('history-list')?.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if(!id) return;
        if(e.target.classList.contains('btn-load-history')) {
            const record = library.history.find(h => h.id === id);
            if(record) {
                state = { ...defaultState, ...JSON.parse(record.stateSnapshot) };
                saveState();
                syncDOMWithState();
                renderItemsEditor();
                renderPreview();
                historyModal.classList.add('hidden');
                showToast("Invoice loaded.");
            }
        } else if(e.target.classList.contains('btn-del-history')) {
            library.history = library.history.filter(h => h.id !== id);
            saveLibrary();
            renderHistoryList();
        }
    });

    // Backup and Restore
    document.getElementById('btn-export-backup')?.addEventListener('click', () => {
        const payload = JSON.stringify({ state, library });
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
                    state = { ...defaultState, ...data.state };
                    library = data.library;
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
    if(itemsContainer) {
        itemsContainer.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                const item = state.items.find(i => i.id === id);
                if(item) {
                    item[field] = field === 'desc' ? e.target.value : parseFloat(e.target.value) || 0;
                    
                    if(field === 'desc') {
                        const libItem = library.products.find(p => p.desc === e.target.value);
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
                const item = state.items.find(i => i.id === id);
                if(item && item.desc && item.price > 0) saveProductToLibrary(item.desc, item.price);
            }
        });

        itemsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.del-item');
            if (btn) {
                const id = btn.dataset.id;
                state.items = state.items.filter(i => i.id !== id);
                if(state.items.length === 0) {
                    state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 });
                }
                saveState();
                renderItemsEditor(); 
                renderPreview();
            }
        });
    }

    function renderItemsEditor() {
        if(!itemsContainer) return;
        // تبدیلی 1 اور 2: موبائل زوم کا مسئلہ حل کیا (text-base) اور واٹر مارک کا فکس کیا
        itemsContainer.innerHTML = state.items.map(item => {
            const qtyValue = item.qty === 0 ? '' : item.qty;
            const priceValue = item.price === 0 ? '' : item.price;
            return \`
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 items-center">
                <input type="text" list="library-products" placeholder="Description" value="\${item.desc}" data-id="\${item.id}" data-field="desc" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <input type="number" min="1" step="1" value="\${qtyValue}" placeholder="1" data-id="\${item.id}" data-field="qty" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-center dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <input type="number" min="0" step="0.01" value="\${priceValue}" placeholder="0.00" data-id="\${item.id}" data-field="price" class="w-full px-2 py-1.5 text-base border border-slate-300 dark:border-slate-600 rounded text-right dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <div class="text-right text-xs font-semibold px-2 item-total text-slate-800 dark:text-slate-100">\${formatMoney(item.qty * item.price)}</div>
                <button class="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-rose-50 hover:border-rose-200 text-rose-500 dark:hover:bg-rose-950/30 del-item outline-none shadow-sm transition focus:ring-2 focus:ring-rose-500/20" data-id="\${item.id}">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        \`}).join('');
    }

    function renderPreview() {
        const previewEl = document.getElementById('doc-preview');
        if(!previewEl) return;
        previewEl.className = \`a4-document bg-white text-slate-900 p-[20mm] min-h-[297mm] transition-all template-\${state.template_id}\`;
        
        const langDict = dict[state.lang] || dict['en'];
        previewEl.setAttribute('dir', langDict.dir);
        
        const logoImg = document.getElementById('prev-logo');
        if(logoImg) {
            if (state.logoDataUrl) {
                logoImg.src = state.logoDataUrl;
                logoImg.classList.remove('hidden');
            } else {
                logoImg.src = '';
                logoImg.classList.add('hidden');
            }
        }

        const typeKey = state.docType.toLowerCase();
        if(document.getElementById('prev-title')) document.getElementById('prev-title').textContent = langDict[typeKey] || state.docType.toUpperCase();
        if(document.getElementById('prev-number-label')) document.getElementById('prev-number-label').textContent = \`# \${state.docNumber}\`;
        if(document.getElementById('prev-date')) document.getElementById('prev-date').textContent = state.date;
        
        const prevDueDate = document.getElementById('prev-due-date');
        const dueDateLblContainer = document.getElementById('lbl-due')?.parentElement;
        if (state.dueDate) {
            if(prevDueDate) prevDueDate.textContent = state.dueDate;
            if(dueDateLblContainer) dueDateLblContainer.style.display = '';
        } else {
            if(prevDueDate) prevDueDate.textContent = '';
            if(dueDateLblContainer) dueDateLblContainer.style.display = 'none';
        }

        if(document.getElementById('prev-sender')) {
            const lines = (state.senderDetails || '').split('\\n');
            const companyName = lines.shift() || '';
            const remainder = lines.join('<br>');
            document.getElementById('prev-sender').innerHTML = \`<strong style="font-size: 1.1em; display: block; margin-bottom: 4px;">\${companyName}</strong>\${remainder}\`;
        }
        
        if(document.getElementById('prev-client')) document.getElementById('prev-client').textContent = state.clientDetails;
        
        let finalPaymentDetails = state.paymentDetails || '';
        if(state.paymentLinks) {
            const pl = state.paymentLinks;
            const linkArr = [];
            if(pl.stripe) linkArr.push(\`Stripe: \${pl.stripe}\`);
            if(pl.paypal) linkArr.push(\`PayPal: \${pl.paypal}\`);
            if(pl.wise) linkArr.push(\`Wise: \${pl.wise}\`);
            if(pl.bank) linkArr.push(\`Bank Transfer:\\n\${pl.bank}\`);
            
            if(linkArr.length > 0) {
                finalPaymentDetails += (finalPaymentDetails ? '\\n\\n' : '') + linkArr.join('\\n');
            }
        }
        if(document.getElementById('prev-payment-details')) document.getElementById('prev-payment-details').textContent = finalPaymentDetails;
        
        const setLbl = (id, text) => { if(document.getElementById(id)) document.getElementById(id).textContent = text; };
        setLbl('lbl-from', langDict.from);
        setLbl('lbl-to', langDict.to);
        setLbl('lbl-date', langDict.date);
        setLbl('lbl-due', langDict.due);
        setLbl('lbl-desc', langDict.desc);
        setLbl('lbl-qty', langDict.qty);
        setLbl('lbl-price', langDict.price);
        setLbl('lbl-total', langDict.total);
        setLbl('lbl-subtotal', langDict.subtotal);
        setLbl('lbl-discount', langDict.discount);
        setLbl('lbl-payment', langDict.payment);
        setLbl('lbl-grandtotal', langDict.gtotal);
        
        const lblPayment = document.getElementById('lbl-payment');
        if(lblPayment && lblPayment.parentElement) lblPayment.parentElement.style.display = finalPaymentDetails ? 'block' : 'none';

        const sigContainer = document.getElementById('sig-container');
        const sigImg = document.getElementById('prev-sig');
        if(sigContainer && sigImg) {
            if(state.sigDataUrl) {
                sigImg.src = state.sigDataUrl;
                sigContainer.classList.remove('hidden');
            } else {
                sigContainer.classList.add('hidden');
            }
        }

        const badge = document.getElementById('prev-status-badge');
        if(badge) {
            badge.textContent = state.status;
            badge.className = \`inline-block mt-2 px-2 py-0.5 text-xs font-bold uppercase rounded \${state.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : state.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}\`;
        }

        if(document.getElementById('prev-items-body')) {
            document.getElementById('prev-items-body').innerHTML = state.items.filter(i => i.desc || i.price > 0).map(item => \`
                <tr class="border-b border-slate-100">
                    <td class="py-2.5 font-medium text-slate-700">\${item.desc}</td>
                    <td class="py-2.5 text-center text-slate-500">\${item.qty}</td>
                    <td class="py-2.5 text-end text-slate-500">\${formatMoney(item.price)}</td>
                    <td class="py-2.5 text-end font-semibold text-slate-800">\${formatMoney(item.qty * item.price)}</td>
                </tr>
            \`).join('');
        }

        calculate();
        if(document.getElementById('prev-subtotal')) document.getElementById('prev-subtotal').textContent = formatMoney(calcTotals.subtotal);
        if(document.getElementById('prev-discount')) document.getElementById('prev-discount').textContent = \`-\${formatMoney(calcTotals.discount)}\`;
        if(document.getElementById('prev-discount-row')) document.getElementById('prev-discount-row').style.display = calcTotals.discount > 0 ? 'flex' : 'none';
        
        let taxLabel = state.region === 'USA' ? \`\${langDict.tax} (\${getTaxRate()}%)\` : state.region === 'UK' ? 'VAT (20%)' : state.region === 'CAN' ? 'GST (5%)' : 'GST (10%)';
        if(document.getElementById('prev-tax-label')) document.getElementById('prev-tax-label').textContent = taxLabel;
        if(document.getElementById('prev-tax')) document.getElementById('prev-tax').textContent = formatMoney(calcTotals.tax);
        if(document.getElementById('prev-total')) document.getElementById('prev-total').textContent = formatMoney(calcTotals.total);

        const notesContainer = document.getElementById('prev-notes-terms-container');
        const notesBox = document.getElementById('prev-notes-box');
        const notesContent = document.getElementById('prev-notes-content');
        const termsBox = document.getElementById('prev-terms-box');
        const termsContent = document.getElementById('prev-terms-content');

        if(notesContainer) {
            if ((state.notes && state.notes.trim()) || (state.terms && state.terms.trim())) {
                notesContainer.classList.remove('hidden');
                if (state.notes && state.notes.trim()) {
                    notesBox.classList.remove('hidden');
                    notesContent.textContent = state.notes;
                } else {
                    notesBox.classList.add('hidden');
                }
                if (state.terms && state.terms.trim()) {
                    termsBox.classList.remove('hidden');
                    termsContent.textContent = state.terms;
                } else {
                    termsBox.classList.add('hidden');
                }
            } else {
                notesContainer.classList.add('hidden');
            }
        }

        const qrContainer = document.getElementById('qr-code-container');
        if(qrContainer) {
            if (state.showQR && state.uploadedQrDataUrl) {
                qrContainer.classList.remove('hidden');
                qrContainer.innerHTML = \`<img src="\${state.uploadedQrDataUrl}" style="max-width: 100px; max-height: 100px; object-fit: contain; margin-top: 10px;" />\`;
            } else {
                qrContainer.classList.add('hidden');
            }
        }
    }

    function updateDashboard() {
        if(!library.history) return;
        
        let totalRev = 0, count = library.history.length, paid = 0, unpaid = 0;
        let monthlyData = {};
        let statusData = { 'Paid': 0, 'Pending': 0, 'Unpaid': 0 };

        library.history.forEach(h => {
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
                if(chartsInstance.revenue) chartsInstance.revenue.destroy();
                chartsInstance.revenue = new Chart(ctxRev, {
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
                if(chartsInstance.status) chartsInstance.status.destroy();
                chartsInstance.status = new Chart(ctxStat, {
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

    document.getElementById('btn-lang-toggle')?.addEventListener('click', (e) => {
        state.lang = state.lang === 'en' ? 'ur' : 'en';
        e.target.textContent = state.lang.toUpperCase();
        saveState();
        renderPreview();
    });

    document.getElementById('logo-upload')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                state.logoDataUrl = event.target.result;
                saveState();
                renderPreview();
            }
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('sig-upload')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                state.sigDataUrl = event.target.result;
                saveState();
                renderPreview();
            }
            reader.readAsDataURL(file);
        }
    });

    let qrUploadInput = document.getElementById('qr-upload-input-dynamic');
    if (!qrUploadInput) {
        qrUploadInput = document.createElement('input');
        qrUploadInput.type = 'file';
        qrUploadInput.accept = 'image/*';
        qrUploadInput.id = 'qr-upload-input-dynamic';
        qrUploadInput.style.display = 'none';
        document.body.appendChild(qrUploadInput);
    }
    
    qrUploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                state.uploadedQrDataUrl = event.target.result;
                state.showQR = true; 
                const toggle = document.getElementById('toggle-qr');
                if (toggle && toggle.type === 'checkbox') toggle.checked = true;
                saveState();
                renderPreview();
            }
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });

    const toggleQrElement = document.getElementById('toggle-qr');
    if (toggleQrElement) {
        toggleQrElement.addEventListener('click', e => {
            if (toggleQrElement.type === 'checkbox') {
                e.preventDefault(); 
                if (state.uploadedQrDataUrl && state.showQR) {
                    state.showQR = false;
                    toggleQrElement.checked = false;
                    saveState();
                    renderPreview();
                } else {
                    qrUploadInput.click();
                }
            } else {
                qrUploadInput.click();
            }
        });
    }

    ['doc-type', 'currency', 'region', 'doc-template', 'discount-type', 'doc-status'].forEach(id => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('change', e => { 
            const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (id === 'doc-template') state.template_id = e.target.value;
            else state[key] = e.target.value;
            
            if(id === 'region') {
                const taxContainer = document.getElementById('tax-input-container');
                if(taxContainer) taxContainer.style.display = state.region === 'USA' ? 'flex' : 'none';
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
                state.notes = e.target.value;
            } else if (id === 'invoice-terms') {
                state.terms = e.target.value;
            } else {
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                state[key === 'docDate' ? 'date' : key] = e.target.value;
            }
            saveState();
            renderPreview();
        });
    });

    document.getElementById('btn-add-item')?.addEventListener('click', () => {
        state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 });
        saveState();
        renderItemsEditor(); 
        renderPreview();
    });

    const btnPdf = document.getElementById('btn-pdf');
    if(btnPdf) {
        btnPdf.addEventListener('click', async () => {
            if (!validateInvoice()) return;
            
            const element = document.getElementById('doc-preview');
            btnPdf.classList.add('is-loading');
            showToast("Compiling PDF asynchronously...");

            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

            // تبدیلی 3: پی ڈی ایف کے کٹنے کے مسئلے کا حل
            const originalWidth = element.style.width;
            element.style.width = '800px';

            const options = {
                margin: [10, 10, 10, 10], 
                filename: \`\${state.docNumber || 'Invoice'}.pdf\`,
                image: { type: 'jpeg', quality: 1.0 }, 
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    letterRendering: true,
                    width: 800, // سائیڈوں سے کٹنے سے بچانے کے لیے
                    windowWidth: 800,
                    scrollY: 0
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
            };
            
            try {
                await html2pdf().set(options).from(element).save();
                showToast("Export completed successfully.");
            } catch (error) {
                showToast("Error generating PDF.");
                console.error(error);
            } finally {
                element.style.width = originalWidth; // پی ڈی ایف بننے کے بعد اسکرین واپس نارمل
                btnPdf.classList.remove('is-loading');
            }
        });
    }

    document.getElementById('btn-dark-toggle')?.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });

    renderItemsEditor();
    renderPreview();
});
