/* ================= GLOBAL PROXY BINDINGS (MOVED TO TOP FOR IMMEDIATE REGISTRATION) ================= */
window.toggleSidebar = () => UIManager.toggleSidebar();
window.switchTab = (tabId, event) => UIManager.switchTab(tabId, event);
window.toggleDarkMode = () => UIManager.toggleDarkMode();
window.showToast = (msg, type) => NotificationManager.show(msg, type);
window.setLanguage = (lang) => { if(typeof I18nManager !== 'undefined') I18nManager.setLanguage(lang); };
window.saveDraft = () => UIManager.saveDraft();
window.saveFinal = () => UIManager.saveFinal();
window.markPaid = () => UIManager.markPaid();
window.mailInvoice = () => ExportManager.mailInvoice();
window.shareInvoice = () => ExportManager.shareInvoice();
window.saveState = () => { if(typeof StateManager !== 'undefined') StateManager.saveState(); };
window.undo = () => { if(typeof StateManager !== 'undefined') StateManager.undo(); };
window.redo = () => { if(typeof StateManager !== 'undefined') StateManager.redo(); };
window.restoreState = (s) => { if(typeof StateManager !== 'undefined') StateManager.restoreState(s); };
window.autoCalcDueDate = () => InvoiceEngine.autoCalcDueDate();
window.generateInvoiceNumber = () => InvoiceEngine.generateInvoiceNumber();
window.formatDate = (d) => Utility.formatDate(d);
window.numberToWords = (n) => Utility.numberToWords(n);
window.setupDragAndDrop = () => UIManager.setupDragAndDrop();
window.renderItems = () => UIManager.renderItems();
window.addItem = () => InvoiceEngine.addItem();
window.deleteItem = (idx) => InvoiceEngine.deleteItem(idx);
window.clearItems = () => InvoiceEngine.clearItems();
window.updateItem = (idx, field, val) => InvoiceEngine.updateItem(idx, field, val);
window.renderPaymentFields = () => PaymentManager.renderPaymentFields();
window.sync = () => InvoiceEngine.sync();
window.generateCodes = () => PaymentManager.renderQRCode();
window.handleQRUpload = (input) => PaymentManager.handleQRUpload(input);
window.applyBranding = () => UIManager.applyBranding();
window.handleImageUpload = (input, imgId) => UIManager.handleImageUpload(input, imgId);
window.generatePDF = () => ExportManager.generatePDF();
window.printInvoice = () => PrintManager.printInvoice();
window.exportCSV = () => ExportManager.exportCSV();
window.exportFullDatabase = () => ExportManager.exportFullDatabase();
window.importFullDatabase = (e) => ExportManager.importFullDatabase(e);
window.loadHistory = () => { if(typeof HistoryManager !== 'undefined') HistoryManager.loadHistory(); };
window.openInvoice = (id) => { if(typeof HistoryManager !== 'undefined') HistoryManager.openInvoice(id); };
window.moveToTrash = (id) => { if(typeof HistoryManager !== 'undefined') HistoryManager.moveToTrash(id); };
window.restoreFromTrash = (id) => { if(typeof HistoryManager !== 'undefined') HistoryManager.restoreFromTrash(id); };
window.deletePermanently = (id) => { if(typeof HistoryManager !== 'undefined') HistoryManager.deletePermanently(id); };
window.duplicateInvoice = (id) => { if(typeof HistoryManager !== 'undefined') HistoryManager.duplicateInvoice(id); };
window.saveCustomerProfile = () => { if(typeof EntityManager !== 'undefined') EntityManager.saveCustomerProfile(); };
window.loadCustomerProfile = () => { if(typeof EntityManager !== 'undefined') EntityManager.loadCustomerProfile(); };
window.deleteCustomerProfile = () => { if(typeof EntityManager !== 'undefined') EntityManager.deleteCustomerProfile(); };
window.saveCompanyProfile = () => { if(typeof EntityManager !== 'undefined') EntityManager.saveCompanyProfile(); };
window.saveNotesTemplate = () => { if(typeof EntityManager !== 'undefined') EntityManager.saveNotesTemplate(); };
window.savePaymentMethod = () => { if(typeof EntityManager !== 'undefined') EntityManager.savePaymentMethod(); };
window.saveProductToLibrary = (idx) => { if(typeof EntityManager !== 'undefined') EntityManager.saveProductToLibrary(idx); };
window.loadProductToItem = () => { if(typeof EntityManager !== 'undefined') EntityManager.loadProductToItem(); };
window.deleteProduct = () => { if(typeof EntityManager !== 'undefined') EntityManager.deleteProduct(); };

/* ================= SAFE LOGGER FALLBACK ================= */
const SafeLogger = {
    info: (msg, data) => { if(typeof Logger !== 'undefined') Logger.info(msg, data); else console.log('INFO:', msg, data || ''); },
    warn: (msg, data) => { if(typeof Logger !== 'undefined') Logger.warn(msg, data); else console.warn('WARN:', msg, data || ''); },
    error: (msg, data) => { if(typeof Logger !== 'undefined') Logger.error(msg, data); else console.error('ERROR:', msg, data || ''); }
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
        let container = typeof Utility !== 'undefined' ? Utility.getEl('toast-container') : document.getElementById('toast-container');
        
        if (!container) { 
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed'; container.style.bottom = '20px'; container.style.right = '20px';
            container.style.zIndex = '9999'; container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.gap = '10px';
            document.body.appendChild(container);
        }

        let iconClass = type === 'success' ? 'fa-check-circle text-success' : type === 'error' ? 'fa-circle-xmark text-danger' : type === 'warning' ? 'fa-triangle-exclamation text-warning' : 'fa-info-circle text-primary';  
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.backgroundColor = '#fff'; toast.style.padding = '12px 20px'; toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; toast.style.display = 'flex'; toast.style.alignItems = 'center';
        toast.style.fontWeight = '500'; toast.style.minWidth = '250px'; toast.style.transition = 'opacity 0.3s ease';
        toast.setAttribute('role', 'alert'); toast.setAttribute('aria-live', 'assertive');
        
        toast.innerHTML = `<i class="fa-solid ${iconClass}" style="color: var(--${type}); margin-right: 8px;"></i> ${msg}`;
          
        container.appendChild(toast);  
        setTimeout(() => {  
            toast.style.opacity = '0';  
            setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); NotificationManager.processQueue(); }, 300);  
        }, 3000);  
    }
};

/* ================= INVOICE ENGINE ================= */
const InvoiceEngine = {
    autoCalcDueDate: () => {
        if (typeof Utility === 'undefined') return;
        const terms = Utility.getVal('f-terms'), dateInput = Utility.getEl('f-date'), dueInput = Utility.getEl('f-due');
        if (terms !== 'custom' && dateInput && dueInput && dateInput.value) {
            let d = new Date(dateInput.value); d.setDate(d.getDate() + parseInt(terms)); dueInput.valueAsDate = d;
        }
        InvoiceEngine.syncDebounced();
    },

    generateInvoiceNumber: async () => {  
        const date = new Date(), year = date.getFullYear();  
        let seq = (typeof StorageEngine !== 'undefined' ? StorageEngine.getKV('invoice_sequence') : 1) || 1;  
        const invInput = typeof Utility !== 'undefined' ? Utility.getEl('f-inv-num') : document.getElementById('f-inv-num');  
        if (invInput) invInput.value = `INV-${year}-${String(seq).padStart(6, '0')}`;  
        if (typeof StorageEngine !== 'undefined') StorageEngine.setKV('invoice_sequence', seq + 1);  
        InvoiceEngine.syncDebounced();  
    },  

    addItem: () => {  
        if (!window._fallbackItems) window._fallbackItems = [];
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        
        items.push({ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false });  
        UIManager.renderItems(); 
        if (typeof StateManager !== 'undefined') StateManager.saveState();  
    },  

    deleteItem: (idx) => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (!items || items.length === 0) return;
        
        if (items.length === 1 && !confirm("This is the last item. Delete?")) return;  
        else if (items.length > 1 && typeof I18nManager !== 'undefined' && !confirm(I18nManager.t('deleted'))) return;  
        
        items.splice(idx, 1);  
        if (items.length === 0) InvoiceEngine.addItem();  
        else UIManager.renderItems();  
        
        if (typeof StateManager !== 'undefined') StateManager.saveState();  
    },  

    clearItems: () => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if(confirm("Clear all items?")) { 
            if (typeof StateManager !== 'undefined' && StateManager.items) StateManager.items = [];
            else window._fallbackItems = [];
            InvoiceEngine.addItem(); 
        }  
    },  

    updateItem: (idx, field, val) => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (!items || !items[idx]) return;
        
        try {  
            if (['qty', 'price', 'tax', 'disc'].includes(field) && val !== '' && typeof Validator !== 'undefined') Validator.validateItemBounds(val, field.toUpperCase());  
            items[idx][field] = val;  
            InvoiceEngine.syncDebounced();  
        } catch (e) { 
            const errLabel = typeof I18nManager !== 'undefined' ? I18nManager.t('validationErr') : 'Validation Error';
            NotificationManager.show(`${errLabel} ${e.message}`, 'error'); 
            UIManager.renderItems(); 
        }  
    },  

    saveInvoiceAction: async (status) => {  
        if (typeof StorageEngine === 'undefined') return;
        UIManager.setLoadingState(true, `Saving Invoice as ${status}...`);  
        try {  
            let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
            let cCode = typeof StateManager !== 'undefined' ? StateManager.currencyCode : 'USD';
            let img = typeof StateManager !== 'undefined' ? StateManager.images : {};
            let upQR = typeof StateManager !== 'undefined' ? StateManager.uploadedQRImage : null;

            const invNum = Utility.getVal('f-inv-num') || Utility.generateId();
            const invoiceData = {  
                id: invNum,  
                date: Utility.getVal('f-date'),
                dueDate: Utility.getVal('f-due'),
                client: Utility.getVal('cli-name'),
                company: Utility.getVal('c-name'),
                total: parseFloat(Utility.getEl('out-grand')?.textContent.replace(/[^0-9.-]+/g,"")) || 0,
                currency: cCode,
                status: status,
                lastModified: Date.now(),
                state: { items: items, customQR: upQR, inputs: {}, images: img }  
            };  
            document.querySelectorAll('input, select, textarea').forEach(el => { if (el.id && el.type !== 'file') invoiceData.state.inputs[el.id] = el.type === 'checkbox' ? el.checked : el.value; });  
            
            await StorageEngine.put('invoices', invoiceData);  
            if (typeof HistoryManager !== 'undefined') await HistoryManager.loadHistory();
            if (typeof DashboardManager !== 'undefined') await DashboardManager.updateDashboard(); 
            NotificationManager.show(`Invoice ${status} Saved Successfully`, 'success');  
        } catch (e) { SafeLogger.error(e); NotificationManager.show('Failed to save invoice', 'error'); }  
        finally { UIManager.setLoadingState(false); }  
    },  

    sync: () => {  
        try {  
            if (typeof Utility === 'undefined') return;
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
            const defCode = typeof AppConfig !== 'undefined' ? AppConfig.defaultCurrencyCode : 'USD';
            const defSym = typeof AppConfig !== 'undefined' ? AppConfig.defaultCurrencySym : '$';
            if (typeof StateManager !== 'undefined') {
                StateManager.currencyCode = currParts[0] || defCode;  
                StateManager.currencySym = currParts[1] || defSym;  
            }

            if (Utility.getEl('out-date')) Utility.getEl('out-date').textContent = Utility.formatDate(Utility.getVal('f-date'));  
            if (Utility.getEl('out-due')) Utility.getEl('out-due').textContent = Utility.formatDate(Utility.getVal('f-due'));  

            // --- Notes & Terms ---
            const nPublicEl = document.getElementById('n-public');
            const nPublic = nPublicEl ? nPublicEl.value : '';  
            const outNPublic = document.getElementById('out-n-public');
            if (outNPublic) outNPublic.innerHTML = nPublic ? nPublic.replace(/\n/g, '<br>') : '';  
            const wrapNPublic = document.getElementById('wrap-n-public');
            if (wrapNPublic) wrapNPublic.style.display = nPublic ? 'block' : 'none';  
              
            const nTermsEl = document.getElementById('n-terms');
            const nTerms = nTermsEl ? nTermsEl.value : '';  
            const outNTerms = document.getElementById('out-n-terms');
            if (outNTerms) outNTerms.innerHTML = nTerms ? nTerms.replace(/\n/g, '<br>') : '';  
            const wrapNTerms = document.getElementById('wrap-n-terms');
            if (wrapNTerms) wrapNTerms.style.display = nTerms ? 'block' : 'none';  
            
            const nFooterEl = document.getElementById('n-footer');
            const nFooter = nFooterEl ? nFooterEl.value : '';
            const outNFooter = document.getElementById('out-n-footer');
            if (outNFooter) outNFooter.innerHTML = nFooter ? nFooter.replace(/\n/g, '<br>') : '';

            // --- UPGRADED: Dynamic Payment Sync ---
            const outPayment = document.getElementById('out-payment');
            const wrapPay = document.getElementById('wrap-pay');  
            if (outPayment) {  
                outPayment.innerHTML = ''; // Clear existing
                const pMethod = Utility.getVal('p-method');
                let hasData = false;  
                
                const addLine = (label, valStr) => {  
                    if (!valStr || valStr.trim() === '') return; 
                    hasData = true;  
                    outPayment.innerHTML += `<div><strong>${label}:</strong> ${valStr}</div>`;
                };  

                if (pMethod === 'bank') { 
                    addLine('Bank', Utility.getVal('p-bank')); 
                    addLine('Account Name', Utility.getVal('p-accname'));
                    addLine('Account Number', Utility.getVal('p-accno')); 
                    addLine('IBAN', Utility.getVal('p-iban')); 
                    addLine('SWIFT', Utility.getVal('p-swift')); 
                }  
                else if (pMethod === 'paypal') addLine('PayPal', Utility.getVal('p-paypal'));  
                else if (pMethod === 'stripe') addLine('Pay Online', Utility.getVal('p-stripe'));  
                else if (pMethod === 'wise') addLine('Wise Account', Utility.getVal('p-wise'));  
                else if (pMethod === 'payoneer') addLine('Payoneer', Utility.getVal('p-payoneer'));  
                else if (pMethod === 'crypto') { addLine('Coin', `${Utility.getVal('p-coin')} (${Utility.getVal('p-net')})`); addLine('Wallet', Utility.getVal('p-wallet')); }  
                else if (pMethod === 'easypaisa') { addLine('Mobile Money', `${Utility.getVal('p-mobi-name')} - ${Utility.getVal('p-mobi-no')}`); }  
                else { 
                    const customText = Utility.getVal('p-custom'); 
                    if (customText) { 
                        hasData = true; 
                        outPayment.innerHTML += customText.replace(/\n/g, '<br>'); 
                    } 
                }  
                
                if (wrapPay) wrapPay.style.display = hasData ? 'block' : 'none';  
            }  

            // --- UPGRADED: Dynamic Items Sync ---
            let tbody = Utility.getEl('out-items-body'), subtotal = 0;  
            if(tbody) tbody.innerHTML = ''; // Clear native
            
            let currentItems = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : (window._fallbackItems || []);
            let cSym = typeof StateManager !== 'undefined' ? StateManager.currencySym : (currParts[1] || '$');
            let cCode = typeof StateManager !== 'undefined' ? StateManager.currencyCode : (currParts[0] || 'USD');

            let hasItemTaxDisc = currentItems.some(i => (Number(i.tax) || 0) > 0 || (Number(i.disc) || 0) > 0);  
            if (Utility.getEl('th-tax')) Utility.getEl('th-tax').style.display = hasItemTaxDisc ? 'table-cell' : 'none';  

            let tbHtml = '';
            currentItems.forEach(it => {  
                let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0;  
                let baseTotal = q * p, finalTotal = baseTotal - d + ((baseTotal - d) * (t / 100));  
                subtotal += finalTotal;  
                  
                if (it.desc || finalTotal > 0) {  
                    tbHtml += `<tr class="keep-together">`;
                    tbHtml += `<td style="padding:10px; border-bottom:1px solid #E2E8F0;">
                        <span class="td-item-name">${it.desc || '<span style="color:#94A3B8; font-style:italic;">Empty Description</span>'}</span>
                        ${it.notes ? `<span style="display:block; font-size:11px; color:#64748b;">${it.notes}</span>` : ''}
                        ${it.sku || it.unit ? `<span style="display:block; font-size:11px; color:#94a3b8;">SKU: ${it.sku||'N/A'} | Unit: ${it.unit||'N/A'}</span>` : ''}
                    </td>`;
                    tbHtml += `<td class="center" style="padding:10px; border-bottom:1px solid #E2E8F0;">${q}</td>`;
                    tbHtml += `<td class="right" style="padding:10px; border-bottom:1px solid #E2E8F0;">${cSym}${Utility.formatCurrency(p)}</td>`;
                    
                    if (hasItemTaxDisc) {  
                        tbHtml += `<td class="right" style="padding:10px; border-bottom:1px solid #E2E8F0; color:#64748B;">`;
                        if (d > 0) tbHtml += `-${cSym}${d} `;
                        if (t > 0) tbHtml += `+${t}%`;
                        tbHtml += `</td>`;
                    }  
                    tbHtml += `<td class="right" style="padding:10px; border-bottom:1px solid #E2E8F0; font-weight:600;">${cSym}${Utility.formatCurrency(finalTotal)}</td>`;
                    tbHtml += `</tr>`;
                }  
            });  
            if (tbody) tbody.innerHTML = tbHtml;

            let gDiscType = Utility.getVal('f-disc-type'), gDiscVal = Number(Utility.getVal('f-disc-val')) || 0, gTax = Number(Utility.getVal('f-global-tax')) || 0;  
            if (typeof Validator !== 'undefined') {
                try { Validator.validateDiscount(gDiscVal, subtotal, gDiscType === 'percent'); } catch(e) { gDiscVal = 0; Utility.getEl('f-disc-val').value = '0'; NotificationManager.show(e.message, 'warning'); }  
            }

            let discAmt = gDiscType === 'percent' ? subtotal * (gDiscVal/100) : gDiscVal, afterDisc = subtotal - discAmt, taxAmt = afterDisc * (gTax/100), grandTotal = afterDisc + taxAmt;  

            if (Utility.getEl('out-subtotal')) Utility.getEl('out-subtotal').textContent = `${cSym}${Utility.formatCurrency(subtotal)}`;  
            if (Utility.getEl('wrap-global-disc')) Utility.getEl('wrap-global-disc').style.display = discAmt > 0 ? 'flex' : 'none';  
            if (Utility.getEl('out-global-disc')) Utility.getEl('out-global-disc').textContent = `-${cSym}${Utility.formatCurrency(discAmt)}`;  
            if (Utility.getEl('wrap-global-tax')) Utility.getEl('wrap-global-tax').style.display = taxAmt > 0 ? 'flex' : 'none';  
            if (Utility.getEl('out-global-tax')) Utility.getEl('out-global-tax').textContent = `${cSym}${Utility.formatCurrency(taxAmt)}`;  
            if (Utility.getEl('out-grand')) Utility.getEl('out-grand').textContent = `${cSym}${Utility.formatCurrency(grandTotal)}`;  
            if (Utility.getEl('out-words')) Utility.getEl('out-words').textContent = Utility.numberToWords(grandTotal) + ` ${cCode}`;  

            if (typeof PaymentManager !== 'undefined') PaymentManager.renderQRCode(); 
            if (typeof StateManager !== 'undefined') StateManager.saveState();  
        } catch (error) { SafeLogger.error('Sync failed:', error); }  
    }
};

InvoiceEngine.syncDebounced = typeof Utility !== 'undefined' && Utility.debounce ? Utility.debounce(InvoiceEngine.sync, 150) : () => { setTimeout(InvoiceEngine.sync, 150); };

/* ================= DASHBOARD & ANALYTICS MANAGER ================= */
const DashboardManager = {
    updateDashboard: async () => {
        if (typeof StorageEngine === 'undefined') return;
        try {
            const invoices = await StorageEngine.getAll('invoices');
            let totalRev = 0, paidRev = 0, pendingRev = 0, overdueRev = 0, monthlyRev = 0;
            let countTotal = invoices.length, countDraft = 0, countPaid = 0, countPending = 0, countOverdue = 0;

            const now = new Date();
            const currentMonth = now.getMonth(), currentYear = now.getFullYear();
            
            invoices.forEach(inv => {
                const amount = parseFloat(inv.total) || 0;
                const invDate = new Date(inv.date);
                if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear) { monthlyRev += amount; }
                if (inv.status === 'Draft') { countDraft++; }
                else {
                    totalRev += amount;
                    if (inv.status === 'Paid') { paidRev += amount; countPaid++; }
                    else {
                        const dueDate = new Date(inv.dueDate);
                        if (dueDate < now) { overdueRev += amount; countOverdue++; }
                        else { pendingRev += amount; countPending++; }
                    }
                }
            });

            const bind = (id, val) => { const el = Utility.getEl(id); if (el) el.textContent = val; };
            bind('dash-total-rev', Utility.formatCurrency(totalRev)); bind('dash-monthly-rev', Utility.formatCurrency(monthlyRev));
            bind('dash-paid-rev', Utility.formatCurrency(paidRev)); bind('dash-pending-rev', Utility.formatCurrency(pendingRev));
            bind('dash-overdue-rev', Utility.formatCurrency(overdueRev)); bind('dash-count-total', countTotal);
            bind('dash-count-draft', countDraft); bind('dash-count-paid', countPaid);
            bind('dash-count-pending', countPending); bind('dash-count-overdue', countOverdue);
        } catch(e) { SafeLogger.warn("Dashboard update skipped", e); }
    }
};

/* ================= UI MANAGER ================= */
const UIManager = {
    toggleSidebar: () => { const s = document.getElementById('app-sidebar'); if (s) s.classList.toggle('hidden'); },
    switchTab: (tabId, event) => {
        document.querySelectorAll('.tab-pane, .tab-btn').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(tabId); if (target) target.classList.add('active');
        if (event && event.target) event.target.classList.add('active');
        const s = document.getElementById('app-sidebar'); if (s) s.classList.remove('hidden');
    },
    toggleDarkMode: async () => { 
        const isDark = document.body.classList.toggle('dark-mode'); 
        if (typeof StorageEngine !== 'undefined') await StorageEngine.setKV('theme_dark', isDark); 
    },
    loadThemePersistence: async () => {
        if (typeof StorageEngine === 'undefined') return;
        if (StorageEngine.getKV('theme_dark')) document.body.classList.add('dark-mode');
        const branding = StorageEngine.getKV('theme_branding');
        if (branding) {
            if (branding.color) { document.documentElement.style.setProperty('--inv-color', branding.color); const c = document.getElementById('b-color'); if(c) c.value = branding.color; }
            if (branding.font) { document.documentElement.style.setProperty('--inv-font', branding.font); const f = document.getElementById('b-font'); if(f) f.value = branding.font; }
        }
    },
    setupDragAndDrop: () => {
        const container = document.getElementById('items-container');
        if (!container || typeof Sortable === 'undefined') return;
        const animDuration = typeof AppConfig !== 'undefined' ? AppConfig.animationDuration : 200;
        new Sortable(container, { handle: '.drag-handle', animation: animDuration, ghostClass: 'drag-ghost', delay: 150, delayOnTouchOnly: true, onEnd: function (evt) {
            let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
            if (items) {
                const moved = items.splice(evt.oldIndex, 1)[0]; items.splice(evt.newIndex, 0, moved); UIManager.renderItems(); 
                if (typeof StateManager !== 'undefined') StateManager.saveState();
            }
        }});
    },

    // --- UPGRADED: Fully Native Dynamic Items Rendering ---
    renderItems: () => {
        const cont = document.getElementById('items-container'); if (!cont) return;
        cont.innerHTML = ''; // Clear container
        
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : (window._fallbackItems || []);
        let cSym = typeof StateManager !== 'undefined' ? StateManager.currencySym : '$';

        items.forEach((it, idx) => {  
            let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0, total = (q * p) - d + ((q * p - d) * (t/100));  
            
            const row = document.createElement('div');
            row.className = 'item-row form-grid';
            row.style.background = 'var(--bg-light)';
            row.style.padding = '16px';
            row.style.borderRadius = '8px';
            row.style.border = '1px solid var(--border-color)';
            row.style.marginBottom = '12px';
            row.style.position = 'relative';

            let html = `
                <div class="drag-handle" style="position:absolute; left:8px; top:16px; cursor:grab;" title="Drag to reorder"><i class="fa-solid fa-grip-vertical text-muted"></i></div>
                <button class="btn btn-icon btn-danger" style="position:absolute; top:8px; right:8px; height:30px; width:30px; padding:0;" onclick="window.deleteItem(${idx})" title="Delete Item"><i class="fa-solid fa-trash"></i></button>
                
                <div style="margin-left:20px; display:flex; flex-direction:column; gap:10px; width:100%;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <div class="form-group" style="flex:2; min-width:200px;">
                            <label>Description</label>
                            <input type="text" class="input-control" placeholder="Item Name / Description" value="${it.desc}" oninput="window.updateItem(${idx}, 'desc', this.value)">
                        </div>
                        <div class="form-group" style="flex:1; min-width:80px;">
                            <label>Qty</label>
                            <input type="number" class="input-control" placeholder="Qty" value="${it.qty}" oninput="window.updateItem(${idx}, 'qty', this.value)">
                        </div>
                        <div class="form-group" style="flex:1; min-width:100px;">
                            <label>Price</label>
                            <input type="number" class="input-control" placeholder="Price" value="${it.price}" oninput="window.updateItem(${idx}, 'price', this.value)">
                        </div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <button class="btn btn-sm btn-outline" onclick="
                            let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
                            if (items && items[${idx}]) { items[${idx}].showAdv = !items[${idx}].showAdv; window.renderItems(); }
                        "><i class="fa-solid fa-sliders"></i> ${it.showAdv ? 'Hide Details' : 'More Details'}</button>
                        <span style="font-weight:bold;">Line Total: ${cSym}${typeof Utility !== 'undefined' ? Utility.formatCurrency(total) : total.toFixed(2)}</span>
                    </div>
                </div>
            `;

            if (it.showAdv) {
                html += `
                <div class="form-grid" style="margin-top:10px; padding:10px; background-color:rgba(0,0,0,0.03); border-radius:4px; margin-left:20px; width:calc(100% - 20px);">
                    <div class="form-group full"><label>Notes</label><input type="text" class="input-control input-sm" placeholder="Additional notes..." value="${it.notes||''}" oninput="window.updateItem(${idx}, 'notes', this.value)"></div>
                    <div class="form-group"><label>SKU</label><input type="text" class="input-control input-sm" placeholder="e.g. PRD-01" value="${it.sku||''}" oninput="window.updateItem(${idx}, 'sku', this.value)"></div>
                    <div class="form-group"><label>Unit Type</label><input type="text" class="input-control input-sm" placeholder="hrs, pcs" value="${it.unit||''}" oninput="window.updateItem(${idx}, 'unit', this.value)"></div>
                    <div class="form-group"><label>Discount (${cSym})</label><input type="number" class="input-control input-sm" placeholder="0" value="${it.disc}" oninput="window.updateItem(${idx}, 'disc', this.value)"></div>
                    <div class="form-group"><label>Tax (%)</label><input type="number" class="input-control input-sm" placeholder="0" value="${it.tax}" oninput="window.updateItem(${idx}, 'tax', this.value)"></div>
                </div>`;
            }

            row.innerHTML = html;
            cont.appendChild(row);
        });  
        
        InvoiceEngine.syncDebounced();  
    },  

    saveDraft: () => InvoiceEngine.saveInvoiceAction('Draft'),
    saveFinal: () => InvoiceEngine.saveInvoiceAction('Final'),
    markPaid: () => InvoiceEngine.saveInvoiceAction('Paid'),
      
    applyBranding: async () => {  
        const c = typeof Utility !== 'undefined' ? Utility.getVal('b-color') : document.getElementById('b-color').value;  
        const f = typeof Utility !== 'undefined' ? Utility.getVal('b-font') : document.getElementById('b-font').value;  
        if (c) document.documentElement.style.setProperty('--inv-color', c);  
        if (f) document.documentElement.style.setProperty('--inv-font', f);  
        if (typeof StorageEngine !== 'undefined') await StorageEngine.setKV('theme_branding', { color: c, font: f }); 
        if (typeof StateManager !== 'undefined') StateManager.saveState();  
    },  

    handleImageUpload: (input, imgId) => {  
        if (input.files && input.files[0]) {  
            const reader = new FileReader();  
            reader.onload = function(e) {  
                const key = imgId.replace('img-', '');
                if (typeof StateManager !== 'undefined') StateManager.images[key] = e.target.result;
                const img = document.getElementById(imgId);  
                if (img) {  
                    img.src = e.target.result; img.style.display = 'block';  
                    if (imgId === 'img-logo' && document.getElementById('logo-placeholder')) document.getElementById('logo-placeholder').style.display = 'none';  
                    if (imgId === 'img-sign' && document.getElementById('sign-placeholder')) document.getElementById('sign-placeholder').style.display = 'none';  
                    if (imgId === 'img-stamp' && document.getElementById('wrap-stamp')) document.getElementById('wrap-stamp').style.display = 'block';  
                    if (typeof StateManager !== 'undefined') StateManager.saveState();  
                }  
            };  
            reader.onerror = () => NotificationManager.show('Failed to load image.', 'error');  
            reader.readAsDataURL(input.files[0]);  
        }  
    },  

    setLoadingState: (isLoading, text = 'Loading...') => {  
        let overlay = document.getElementById('enterprise-loading-overlay');  
        if (isLoading) {  
            if (!overlay) {  
                overlay = document.createElement('div');
                overlay.id = 'enterprise-loading-overlay';
                overlay.setAttribute('role', 'alert');
                overlay.setAttribute('aria-busy', 'true');
                overlay.style.position = 'fixed'; overlay.style.top = '0'; overlay.style.left = '0';
                overlay.style.width = '100vw'; overlay.style.height = '100vh';
                overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; overlay.style.zIndex = '9999';
                overlay.style.display = 'flex'; overlay.style.flexDirection = 'column'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
                overlay.style.color = 'white'; overlay.style.fontFamily = 'inherit';
                
                overlay.innerHTML = `
                    <div class="spinner" style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                    <div style="margin-top: 15px; font-weight: 500;">${text}</div>
                    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                `;
                document.body.appendChild(overlay);  
            }  
            document.body.style.overflow = 'hidden'; document.querySelectorAll('button').forEach(b => b.disabled = true);  
        } else {  
              if (overlay) overlay.remove();
            document.body.style.overflow = ''; document.querySelectorAll('button').forEach(b => b.disabled = false);  
        }  
    }
};

/* ================= PAYMENT MANAGER ================= */
const PaymentManager = {
    // --- UPGRADED: Dynamic Payment Fields Based on Dropdown Selection ---
    renderPaymentFields: () => {
        const methodEl = document.getElementById('p-method');
        const method = methodEl ? methodEl.value : 'bank';
        const container = document.getElementById('payment-dynamic-fields');
        if (!container) return; 
        
        container.innerHTML = ''; 
        let html = '';
        
        const createInput = (label, id, type = 'text', full = false, placeholder = '') => {
            return `
                <div class="form-group${full ? ' full' : ''}">
                    <label>${label}</label>
                    ${type === 'textarea' 
                        ? `<textarea class="input-control" id="${id}" rows="3" placeholder="${placeholder}" oninput="window.sync()"></textarea>` 
                        : `<input type="${type}" class="input-control" id="${id}" placeholder="${placeholder}" oninput="window.sync()">`
                    }
                </div>
            `;
        };

        if (method === 'bank') { 
            html += createInput('Bank Name', 'p-bank', 'text', true); 
            html += createInput('Account Name', 'p-accname'); 
            html += createInput('Account Number', 'p-accno'); 
            html += createInput('Routing / IBAN', 'p-iban'); 
            html += createInput('SWIFT / BIC', 'p-swift'); 
        }  
        else if (method === 'paypal') html += createInput('PayPal Email / Link', 'p-paypal', 'text', true, 'paypal.me/username');  
        else if (method === 'stripe') html += createInput('Stripe Payment Link', 'p-stripe', 'text', true, 'https://buy.stripe.com/...');  
        else if (method === 'wise') html += createInput('Wise Account Email', 'p-wise', 'email', true);  
        else if (method === 'payoneer') html += createInput('Payoneer Email', 'p-payoneer', 'email', true);  
        else if (method === 'crypto') { 
            html += createInput('Cryptocurrency', 'p-coin', 'text', false, 'e.g. USDT'); 
            html += createInput('Network', 'p-net', 'text', false, 'e.g. TRC20'); 
            html += createInput('Wallet Address', 'p-wallet', 'text', true); 
        }  
        else if (method === 'easypaisa') { 
            html += createInput('Account Title', 'p-mobi-name'); 
            html += createInput('Mobile Number', 'p-mobi-no'); 
        }  
        else if (method === 'custom') {
            html += createInput('Custom Instructions', 'p-custom', 'textarea', true);  
        }

        if(method && typeof EntityManager !== 'undefined') {  
            html += `
                <div class="form-group full" style="margin-top:10px;">
                    <button class="btn btn-outline" onclick="window.savePaymentMethod()"><i class="fa-solid fa-save"></i> Save this Payment Template</button>
                </div>
            `;
        }  

        container.innerHTML = html;
        InvoiceEngine.syncDebounced();  
    },  
    handleQRUpload: (input) => {  
        if (input.files && input.files[0] && typeof StateManager !== 'undefined') {  
            const reader = new FileReader();  
            reader.onload = function(e) { StateManager.uploadedQRImage = e.target.result; PaymentManager.renderQRCode(); StateManager.saveState(); };  
            reader.readAsDataURL(input.files[0]);  
        }  
    },  
    renderQRCode: () => {  
        const qrContainer = document.getElementById('qrcode'); if (!qrContainer || typeof StateManager === 'undefined') return; 
        while(qrContainer.firstChild) qrContainer.removeChild(qrContainer.firstChild);
        if (StateManager.uploadedQRImage) {
            const img = document.createElement('img');
            img.src = StateManager.uploadedQRImage;
            img.alt = 'Payment QR';
            img.style.maxWidth = '100%'; img.style.maxHeight = '100%'; img.style.objectFit = 'contain'; img.style.borderRadius = '4px';
            qrContainer.appendChild(img);
        }
    }
};

/* ================= ENTERPRISE PRINT ENGINE (FIXED A4 & FOOTER ISSUE) ================= */
const PrintManager = {
    printInvoice: () => {
        const style = document.createElement('style');
        style.id = 'enterprise-print-engine';
        style.innerHTML = `
            @media print {
                body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body * { visibility: hidden; }
                #invoice-render, #invoice-render * { visibility: visible; }
                #invoice-render { 
                    position: absolute; left: 0; top: 0; 
                    width: 210mm; min-height: 297mm; 
                    box-sizing: border-box; margin: 0; padding: 10mm; 
                    box-shadow: none; border: none; 
                    display: flex; flex-direction: column; 
                }
                .no-print { display: none !important; }
                @page { size: A4; margin: 0; }
                .items-container { flex-grow: 1; } 
                table { page-break-inside: auto; width: 100%; table-layout: fixed; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
                .keep-together { page-break-inside: avoid; }
            }
        `;
        document.head.appendChild(style);
        setTimeout(() => { window.print(); document.head.removeChild(style); }, 300); 
    }
};

/* ================= ENTERPRISE EXPORT / BACKUP ENGINE ================= */
const ExportManager = {
    generatePDF: async () => {
        const element = document.getElementById('invoice-render'); if (!element) return NotificationManager.show('Render area not found.', 'error');
        const invNum = typeof Utility !== 'undefined' ? Utility.getVal('f-inv-num') : 'Invoice', client = typeof Utility !== 'undefined' ? Utility.getVal('cli-name') : 'Client';
        UIManager.setLoadingState(true, 'Rendering Enterprise A4 PDF...');
        try {
            if (typeof window.html2pdf !== 'undefined') {
                const opt = { 
                    margin: 5, 
                    filename: `${invNum}_${client}.pdf`.replace(/[^a-z0-9_-]/gi, '_'), 
                    image: { type: 'jpeg', quality: 1.0 }, 
                    html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 800 }, 
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, 
                    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr, .keep-together' } 
                };
                await html2pdf().set(opt).from(element).save();
                NotificationManager.show('PDF exported perfectly.', 'success');
            } else {
                NotificationManager.show('Offline Mode: Using Native Browser PDF Engine', 'info');
                PrintManager.printInvoice(); 
            }
        } catch (error) { SafeLogger.error(error); NotificationManager.show('Failed to generate PDF.', 'error'); }
        finally { UIManager.setLoadingState(false); }
    },

    exportFullDatabase: async () => {  
        if (typeof StorageEngine === 'undefined') return;
        UIManager.setLoadingState(true, 'Generating Complete System Backup...');
        try {
            const ver = typeof AppConfig !== 'undefined' ? AppConfig.version : '1.0.0';
            const data = { 
                version: ver, 
                timestamp: new Date().toISOString(), 
                database: {
                    invoices: await StorageEngine.getAll('invoices'),
                    customers: await StorageEngine.getAll('customers'),
                    products: await StorageEngine.getAll('products'),
                    payments: await StorageEngine.getAll('payments'),
                    companies: await StorageEngine.getAll('companies'),
                    notes: await StorageEngine.getAll('notes')
                }
            };  
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });  
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Enterprise_SaaS_Backup_${Date.now()}.json`;  
            link.click(); URL.revokeObjectURL(link.href);  
            NotificationManager.show('Complete Backup Exported', 'success');  
        } catch (error) { SafeLogger.error(error); NotificationManager.show('Backup failed.', 'error'); }
        finally { UIManager.setLoadingState(false); }
    },  

    importFullDatabase: async (event) => {
        if (typeof StorageEngine === 'undefined') return;
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            UIManager.setLoadingState(true, 'Restoring System Data...');
            try {
                const data = JSON.parse(e.target.result);
                if (!data.version || !data.database) throw new Error("Invalid SaaS Backup Format");
                
                if (confirm('Warning: This will overwrite current database records with the backup. Continue?')) {
                    const db = data.database;
                    for (const store of ['invoices', 'customers', 'products', 'payments', 'companies', 'notes']) {
                        if (db[store] && Array.isArray(db[store])) {
                            await StorageEngine.clearStore(store); 
                            for (const item of db[store]) { await StorageEngine.put(store, item); }
                        }
                    }
                    if (typeof HistoryManager !== 'undefined') await HistoryManager.loadHistory();
                    if (typeof DashboardManager !== 'undefined') await DashboardManager.updateDashboard();
                    NotificationManager.show('System Fully Restored', 'success');
                }
            } catch (err) { SafeLogger.error(err); NotificationManager.show('Backup validation failed.', 'error'); }
            finally { UIManager.setLoadingState(false); event.target.value = ''; }
        };
        reader.readAsText(file);
    },

    exportCSV: () => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (!items) return;
        let csvContent = "data:text/csv;charset=utf-8,Description,Notes,SKU,Unit,Qty,Price,Tax,Discount,Total\n";  
        items.forEach(it => {  
            let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0, total = (q * p) - d + ((q * p - d) * (t/100));  
            let row = [ `"${it.desc}"`, `"${it.notes}"`, `"${it.sku}"`, `"${it.unit}"`, q, p, t, d, total ].join(",");  
            csvContent += row + "\n";  
        });  
        const encodedUri = encodeURI(csvContent); const link = document.createElement("a");  
        link.setAttribute("href", encodedUri); link.setAttribute("download", `Invoice_${typeof Utility !== 'undefined' ? Utility.getVal('f-inv-num') : 'Export'}_Items.csv`);  
        document.body.appendChild(link); link.click(); document.body.removeChild(link);  
        NotificationManager.show('CSV Exported', 'success');  
    },  

    mailInvoice: () => {  
        const email = typeof Utility !== 'undefined' ? Utility.getVal('cli-email') : '';  
        if (email && typeof Validator !== 'undefined' && !Validator.isEmail(email)) return NotificationManager.show("Invalid client email address.", "warning");  
        const invNum = typeof Utility !== 'undefined' ? Utility.getVal('f-inv-num') : 'Invoice', total = document.getElementById('out-grand')?.textContent || '0.00';  
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`New Invoice: ${invNum}`)}&body=${encodeURIComponent(`Hello,\n\nPlease find attached details for invoice ${invNum}. Total due: ${total}.\n\nThank you.`)}`;  
        NotificationManager.show("Opening Mail Client...", "success");  
    },  

    shareInvoice: async () => {  
        const shareData = `Invoice ${typeof Utility !== 'undefined' ? Utility.getVal('f-inv-num') : ''} - Total: ${document.getElementById('out-grand')?.textContent}`;  
        const copyLabel = typeof I18nManager !== 'undefined' ? I18nManager.t('copied') : 'Copied to clipboard';
        try {  
            if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(shareData); NotificationManager.show(copyLabel, "success"); }   
            else throw new Error("Clipboard API not supported");  
        } catch (err) {  
            const textArea = document.createElement("textarea"); textArea.value = shareData; document.body.appendChild(textArea); textArea.focus(); textArea.select();  
            try { document.execCommand('copy'); NotificationManager.show(copyLabel, "success"); } catch (e) { NotificationManager.show('Failed to copy', "error"); }  
            document.body.removeChild(textArea);  
        }  
    }
};

/* ================= KEYBOARD ACCESSIBILITY ================= */
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 's': e.preventDefault(); UIManager.saveDraft(); break;
            case 'z': e.preventDefault(); if (typeof StateManager !== 'undefined') { if (e.shiftKey) StateManager.redo(); else StateManager.undo(); } break;
            case 'y': e.preventDefault(); if (typeof StateManager !== 'undefined') StateManager.redo(); break;
            case 'p': e.preventDefault(); ExportManager.generatePDF(); break;
        }
    }
});

/* ================= INITIALIZATION BOOTSTRAP ================= */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const appName = typeof AppConfig !== 'undefined' ? AppConfig.appName : 'SaaS Invoice Pro';
        const appVer = typeof AppConfig !== 'undefined' ? AppConfig.version : '1.0.0';
        const debugMode = typeof AppConfig !== 'undefined' ? AppConfig.debugMode : false;

        SafeLogger.info(`${appName} Boot Sequence v${appVer}`);
        UIManager.setLoadingState(true, 'Initializing Enterprise Architecture...');

        if ('serviceWorker' in navigator && !debugMode) {
            navigator.serviceWorker.register('/sw.js').then(reg => SafeLogger.info('Service Worker Registered')).catch(err => SafeLogger.warn('Service Worker Failed', err));
        }

        if (typeof StorageEngine !== 'undefined') await StorageEngine.init();  
        const dateEl = document.getElementById('f-date'); if (dateEl) dateEl.valueAsDate = new Date();  
        
        await UIManager.loadThemePersistence();  
        InvoiceEngine.autoCalcDueDate();  
        await InvoiceEngine.generateInvoiceNumber();  

        const docType = document.getElementById('f-doc-type'); if (docType) docType.value = "TAX INVOICE";  
        const nPublic = document.getElementById('n-public'); if (nPublic) nPublic.value = "Thank you for your business. We appreciate your prompt payment.";  
        const nTerms = document.getElementById('n-terms'); if (nTerms) nTerms.value = "1. Please quote invoice number when remitting funds.\n2. Late payments are subject to a 2% monthly fee.";  

        UIManager.setupDragAndDrop();  
        PaymentManager.renderPaymentFields();  
        UIManager.renderItems();  
        InvoiceEngine.sync();   
          
        if (typeof HistoryManager !== 'undefined') await HistoryManager.loadHistory();
        if (typeof DashboardManager !== 'undefined') await DashboardManager.updateDashboard();
        if (typeof StateManager !== 'undefined') await StateManager.recoverDraft();  
        if (typeof StateManager !== 'undefined') StateManager.saveState();  

        const bindFilter = (id, func) => { const el = document.getElementById(id); if (el) el.addEventListener('input', func); };
        
        if (typeof HistoryManager !== 'undefined') {
            bindFilter('history-search', HistoryManager.renderHistoryTable);
            bindFilter('history-status-filter', HistoryManager.renderHistoryTable);
            bindFilter('history-sort', HistoryManager.renderHistoryTable);
            bindFilter('draft-search', HistoryManager.renderDraftsTable);
            bindFilter('draft-sort', HistoryManager.renderDraftsTable);
            bindFilter('final-search', HistoryManager.renderFinalsTable);
            bindFilter('final-status-filter', HistoryManager.renderFinalsTable);
            bindFilter('final-sort', HistoryManager.renderFinalsTable);
        }

        // ================= DIRECT EVENT BINDINGS FOR DYNAMIC UI FIXES =================
        const btnAddItem = document.getElementById('add-item-btn');
        if (btnAddItem) {
            btnAddItem.addEventListener('click', (e) => { e.preventDefault(); window.addItem(); });
        } else {
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent.includes('Add Line Item')) {
                    btn.addEventListener('click', (e) => { e.preventDefault(); window.addItem(); });
                }
            });
        }

        const btnClearAll = document.getElementById('clear-items-btn');
        if (btnClearAll) {
            btnClearAll.addEventListener('click', (e) => { e.preventDefault(); window.clearItems(); });
        } else {
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent.includes('Clear All')) {
                    btn.addEventListener('click', (e) => { e.preventDefault(); window.clearItems(); });
                }
            });
        }

        const pMethodDropdown = document.getElementById('p-method');
        if (pMethodDropdown) {
            pMethodDropdown.addEventListener('change', () => { window.renderPaymentFields(); });
        } else {
            document.querySelectorAll('select').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    if (e.target.value === 'stripe' || e.target.value === 'bank' || e.target.value === 'paypal' || e.target.value === 'crypto') {
                        window.renderPaymentFields();
                    }
                });
            });
        }
        // ======================================================================
          
        UIManager.setLoadingState(false);  
    } catch (error) {  
        UIManager.setLoadingState(false);  
        SafeLogger.error('Critical failure during initialization sequence:', error);  
        if (typeof NotificationManager !== 'undefined') NotificationManager.show('System Boot Failure. Check console.', 'error');  
    }
});
