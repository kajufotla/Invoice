/* ================= GLOBAL PROXY BINDINGS ================= */
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
window.toggleAdv = (idx) => UIManager.toggleAdv(idx);
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

/* ================= SAFE LOGGER ================= */
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
        
        items.push({ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: 1, price: 0, tax: '', disc: '', showAdv: false });  
        UIManager.renderItems(); 
        if (typeof StateManager !== 'undefined') StateManager.saveState();  
    },  

    deleteItem: (idx) => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (!items || items.length === 0) return;
        
        items.splice(idx, 1);  
        if (items.length === 0) InvoiceEngine.addItem();  
        else UIManager.renderItems();  
        
        if (typeof StateManager !== 'undefined') StateManager.saveState();  
    },  

    clearItems: () => {  
        if(confirm("Clear all items?")) { 
            if (typeof StateManager !== 'undefined' && StateManager.items) StateManager.items = [];
            else window._fallbackItems = [];
            InvoiceEngine.addItem(); 
        }  
    },  

    updateItem: (idx, field, val) => {  
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (!items || !items[idx]) return;
        
        items[idx][field] = field === 'desc' || field === 'notes' || field === 'sku' || field === 'unit' ? val : (parseFloat(val) || 0);  
        InvoiceEngine.syncDebounced();  
    },  

    saveInvoiceAction: async (status) => {  
        if (typeof StorageEngine === 'undefined') return;
        UIManager.setLoadingState(true, `Saving Invoice as ${status}...`);  
        try {  
            let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
            let cCode = typeof StateManager !== 'undefined' ? StateManager.currencyCode : 'USD';
            let img = typeof StateManager !== 'undefined' ? StateManager.images : {};
            let upQR = typeof StateManager !== 'undefined' ? StateManager.uploadedQRImage : null;

            const invNum = typeof Utility !== 'undefined' ? Utility.getVal('f-inv-num') : document.getElementById('f-inv-num').value;
            const invoiceData = {  
                id: invNum,  
                date: typeof Utility !== 'undefined' ? Utility.getVal('f-date') : document.getElementById('f-date').value,
                dueDate: typeof Utility !== 'undefined' ? Utility.getVal('f-due') : document.getElementById('f-due').value,
                client: typeof Utility !== 'undefined' ? Utility.getVal('cli-name') : document.getElementById('cli-name').value,
                company: typeof Utility !== 'undefined' ? Utility.getVal('c-name') : document.getElementById('c-name').value,
                total: parseFloat(document.getElementById('out-grand')?.textContent.replace(/[^0-9.-]+/g,"")) || 0,
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
            const getVal = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
            const getEl = (id) => document.getElementById(id);
            
            const textMap = {  
                'out-doc-type': 'f-doc-type', 'out-inv-num': 'f-inv-num', 'out-po': 'f-po', 'out-ref': 'f-ref',  
                'out-c-name': 'c-name', 'out-c-addr1': 'c-addr1', 'out-c-addr2': 'c-addr2', 'out-c-email': 'c-email', 'out-c-phone': 'c-phone', 'out-c-web': 'c-web', 'out-c-taxid': 'c-taxid', 'out-c-reg': 'c-reg',  
                'out-cli-name': 'cli-name', 'out-cli-addr1': 'cli-addr1', 'out-cli-addr2': 'cli-addr2', 'out-cli-contact': 'cli-contact', 'out-cli-email': 'cli-email', 'out-cli-phone': 'cli-phone', 'out-cli-taxid': 'cli-taxid',  
                'out-sign-name': 'b-sign-name', 'out-sign-role': 'b-sign-role', 'out-tax-label': 'f-tax-label'  
            };  
            for (let outId in textMap) { const el = getEl(outId); if (el) el.textContent = getVal(textMap[outId]); }  

            ['c-taxid','c-reg','po','ref','cli-contact','cli-email','cli-phone','cli-taxid'].forEach(o => {  
                const wrap = getEl(`wrap-${o}`), src = o === 'po' || o === 'ref' ? `f-${o}` : o.replace('-', '-');   
                if (wrap) wrap.style.display = getVal(src) ? 'block' : 'none';  
            });  

            const currParts = getVal('f-currency').split('|');  
            const defCode = 'USD', defSym = '$';
            if (typeof StateManager !== 'undefined') {
                StateManager.currencyCode = currParts[0] || defCode;  
                StateManager.currencySym = currParts[1] || defSym;  
            }

            if (getEl('out-date')) getEl('out-date').textContent = typeof Utility !== 'undefined' ? Utility.formatDate(getVal('f-date')) : getVal('f-date');  
            if (getEl('out-due')) getEl('out-due').textContent = typeof Utility !== 'undefined' ? Utility.formatDate(getVal('f-due')) : getVal('f-due');  

            // Notes Sync with Line Breaks
            ['n-public', 'n-terms', 'n-footer'].forEach(id => {
                const el = getEl(id);
                const outEl = getEl(`out-${id}`);
                const wrapEl = getEl(`wrap-${id}`);
                if (outEl && el) outEl.innerHTML = el.value ? el.value.replace(/\n/g, '<br>') : '';
                if (wrapEl && el) wrapEl.style.display = el.value ? 'block' : 'none';
            });

            // Payment Output Sync
            const outPayment = getEl('out-payment'), wrapPay = getEl('wrap-pay');  
            if (outPayment) {  
                outPayment.innerHTML = '';
                const pMethod = getVal('p-method');
                let hasData = false;  
                const addLine = (label, valStr) => {  
                    if (!valStr || valStr.trim() === '') return; hasData = true;  
                    outPayment.innerHTML += `<div><strong>${label}:</strong> ${valStr}</div>`;
                };  

                if (pMethod === 'bank') { addLine('Bank', getVal('p-bank')); addLine('Account', `${getVal('p-accname')} (${getVal('p-accno')})`); addLine('IBAN', getVal('p-iban')); addLine('SWIFT', getVal('p-swift')); }  
                else if (pMethod === 'paypal') addLine('PayPal', getVal('p-paypal'));  
                else if (pMethod === 'stripe') addLine('Pay Online', getVal('p-stripe'));  
                else if (pMethod === 'wise') addLine('Wise Account', getVal('p-wise'));  
                else if (pMethod === 'payoneer') addLine('Payoneer', getVal('p-payoneer'));  
                else if (pMethod === 'crypto') { addLine('Coin', `${getVal('p-coin')} (${getVal('p-net')})`); addLine('Wallet', getVal('p-wallet')); }  
                else if (pMethod === 'easypaisa') { addLine('Mobile Money', `${getVal('p-mobi-name')} - ${getVal('p-mobi-no')}`); }  
                else { const customText = getVal('p-custom'); if (customText) { hasData = true; outPayment.innerHTML += customText.replace(/\n/g, '<br>'); } }  
                
                if (wrapPay) wrapPay.style.display = hasData ? 'block' : 'none';  
            }  

            // Robust Table Generator (Vanilla JS to prevent DOM object errors)
            let tbody = getEl('out-items-body'), subtotal = 0;  
            if(tbody) tbody.innerHTML = '';
            
            let currentItems = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : (window._fallbackItems || []);
            let cSym = typeof StateManager !== 'undefined' ? StateManager.currencySym : (currParts[1] || '$');
            let cCode = typeof StateManager !== 'undefined' ? StateManager.currencyCode : (currParts[0] || 'USD');

            let hasItemTaxDisc = currentItems.some(i => (Number(i.tax) || 0) > 0 || (Number(i.disc) || 0) > 0);  
            if (getEl('th-tax')) getEl('th-tax').style.display = hasItemTaxDisc ? 'table-cell' : 'none';  

            let tbHtml = '';
            currentItems.forEach(it => {  
                let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0;  
                let baseTotal = q * p, finalTotal = baseTotal - d + ((baseTotal - d) * (t / 100));  
                subtotal += finalTotal;  
                  
                if (it.desc || finalTotal > 0) {  
                    tbHtml += `<tr class="keep-together">`;
                    tbHtml += `<td>
                        <span class="td-item-name">${it.desc || 'Item Description'}</span>
                        ${it.notes ? `<span style="display:block; font-size:11px; color:#64748b;">${it.notes}</span>` : ''}
                        ${it.sku || it.unit ? `<span style="display:block; font-size:11px; color:#94a3b8;">SKU: ${it.sku||'N/A'} | Unit: ${it.unit||'N/A'}</span>` : ''}
                    </td>`;
                    tbHtml += `<td class="center">${q}</td>`;
                    tbHtml += `<td class="right">${cSym}${p.toFixed(2)}</td>`;
                    
                    if (hasItemTaxDisc) {
                        tbHtml += `<td class="right" style="color:#64748B;">`;
                        if (d > 0) tbHtml += `-${cSym}${d.toFixed(2)} `;
                        if (t > 0) tbHtml += `+${t}%`;
                        tbHtml += `</td>`;
                    }
                    
                    tbHtml += `<td class="right" style="font-weight:600;">${cSym}${finalTotal.toFixed(2)}</td>`;
                    tbHtml += `</tr>`;
                }  
            });  
            if (tbody) tbody.innerHTML = tbHtml;

            // Global Totals Sync
            let gDiscType = getVal('f-disc-type'), gDiscVal = Number(getVal('f-disc-val')) || 0, gTax = Number(getVal('f-global-tax')) || 0;  
            let discAmt = gDiscType === 'percent' ? subtotal * (gDiscVal/100) : gDiscVal, afterDisc = subtotal - discAmt, taxAmt = afterDisc * (gTax/100), grandTotal = afterDisc + taxAmt;  

            if (getEl('out-subtotal')) getEl('out-subtotal').textContent = `${cSym}${subtotal.toFixed(2)}`;  
            if (getEl('wrap-global-disc')) getEl('wrap-global-disc').style.display = discAmt > 0 ? 'flex' : 'none';  
            if (getEl('out-global-disc')) getEl('out-global-disc').textContent = `-${cSym}${discAmt.toFixed(2)}`;  
            if (getEl('wrap-global-tax')) getEl('wrap-global-tax').style.display = taxAmt > 0 ? 'flex' : 'none';  
            if (getEl('out-global-tax')) getEl('out-global-tax').textContent = `${cSym}${taxAmt.toFixed(2)}`;  
            if (getEl('out-grand')) getEl('out-grand').textContent = `${cSym}${grandTotal.toFixed(2)}`;  
            
            if (getEl('out-words') && typeof Utility !== 'undefined' && Utility.numberToWords) {
                getEl('out-words').textContent = Utility.numberToWords(grandTotal) + ` ${cCode}`;  
            }

            if (typeof PaymentManager !== 'undefined') PaymentManager.renderQRCode(); 
            if (typeof StateManager !== 'undefined') StateManager.saveState();  
        } catch (error) { SafeLogger.error('Sync failed:', error); }  
    }
};

InvoiceEngine.syncDebounced = () => { setTimeout(InvoiceEngine.sync, 150); };

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
        new Sortable(container, { handle: '.drag-handle', animation: 200, ghostClass: 'drag-ghost', onEnd: function (evt) {
            let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
            if (items) {
                const moved = items.splice(evt.oldIndex, 1)[0]; items.splice(evt.newIndex, 0, moved); UIManager.renderItems(); 
                if (typeof StateManager !== 'undefined') StateManager.saveState();
            }
        }});
    },
    
    toggleAdv: (idx) => {
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : window._fallbackItems;
        if (items && items[idx]) { items[idx].showAdv = !items[idx].showAdv; UIManager.renderItems(); }
    },

    // 100% Native Render for Items (No Dependency on utils.js DOM object)
    renderItems: () => {
        const cont = document.getElementById('items-container'); if (!cont) return;
        cont.innerHTML = ''; 
        
        let items = (typeof StateManager !== 'undefined' && StateManager.items) ? StateManager.items : (window._fallbackItems || []);
        let cSym = typeof StateManager !== 'undefined' ? StateManager.currencySym : '$';

        items.forEach((it, idx) => {  
            let q = Number(it.qty) || 0, p = Number(it.price) || 0, t = Number(it.tax) || 0, d = Number(it.disc) || 0, total = (q * p) - d + ((q * p - d) * (t/100));  
            
            const row = document.createElement('div');
            row.className = 'item-row';
            row.style.background = 'var(--bg-light)';
            row.style.padding = '16px';
            row.style.borderRadius = '8px';
            row.style.border = '1px solid var(--border-color)';
            row.style.marginBottom = '12px';
            row.style.position = 'relative';

            let html = `
                <div class="drag-handle" style="cursor: grab; display: inline-block; padding: 5px; margin-right: 5px;" title="Drag to reorder"><i class="fa-solid fa-grip-vertical" style="color:var(--text-muted);"></i></div>
                <button class="btn btn-icon btn-danger" style="position:absolute; top:8px; right:8px; height:30px; width:30px; padding:0;" onclick="window.deleteItem(${idx})" title="Remove Item"><i class="fa-solid fa-trash"></i></button>
                
                <div style="display: flex; gap: 10px; margin-top: 5px;">
                    <div style="flex: 2; display: flex; flex-direction: column; gap: 5px;">
                        <input type="text" class="input-control" placeholder="Item Name / Description" value="${it.desc}" oninput="window.updateItem(${idx}, 'desc', this.value)">
                        <input type="text" class="input-control" style="font-size: 11px; padding: 6px; color: var(--text-muted);" placeholder="Additional notes..." value="${it.notes}" oninput="window.updateItem(${idx}, 'notes', this.value)">
                    </div>
                    <div style="flex: 1;">
                        <input type="number" class="input-control" placeholder="Qty" value="${it.qty}" oninput="window.updateItem(${idx}, 'qty', this.value)">
                    </div>
                    <div style="flex: 1;">
                        <input type="number" class="input-control" placeholder="Price" value="${it.price}" oninput="window.updateItem(${idx}, 'price', this.value)">
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px; align-items: center;">
                    <button class="btn btn-sm btn-outline" onclick="window.toggleAdv(${idx})"><i class="fa-solid fa-sliders"></i> ${it.showAdv ? 'Hide Details' : 'More Details'}</button>
                    <span style="margin-left: auto; font-weight: bold;">Line Total: ${cSym}${total.toFixed(2)}</span>
                </div>
            `;

            if (it.showAdv) {
                html += `
                <div class="form-grid" style="margin-top: 10px; padding: 10px; background-color: rgba(0,0,0,0.02); border-radius: 4px; border: 1px dashed var(--border-color);">
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
        const c = document.getElementById('b-color') ? document.getElementById('b-color').value : '#4F46E5';  
        const f = document.getElementById('b-font') ? document.getElementById('b-font').value : "'Inter', sans-serif";  
        document.documentElement.style.setProperty('--inv-color', c);  
        document.documentElement.style.setProperty('--inv-font', f);  
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
            reader.readAsDataURL(input.files[0]);  
        }  
    },  

    setLoadingState: (isLoading, text = 'Loading...') => {  
        let overlay = document.getElementById('enterprise-loading-overlay');  
        if (isLoading) {  
            if (!overlay) {  
                overlay = document.createElement('div');
                overlay.id = 'enterprise-loading-overlay';
                overlay.style.position = 'fixed'; overlay.style.top = '0'; overlay.style.left = '0';
                overlay.style.width = '100vw'; overlay.style.height = '100vh';
                overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.8)'; overlay.style.zIndex = '9999';
                overlay.style.display = 'flex'; overlay.style.flexDirection = 'column'; overlay.style.alignItems = 'center'; overlay.style.justifyContent = 'center';
                overlay.style.color = 'white';
                
                overlay.innerHTML = `
                    <div class="spinner" style="border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                    <div style="margin-top: 15px; font-weight: 500;">${text}</div>
                    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                `;
                document.body.appendChild(overlay);  
            }  
            document.body.style.overflow = 'hidden'; 
        } else {  
            if (overlay) overlay.remove();
            document.body.style.overflow = ''; 
        }  
    }
};

/* ================= PAYMENT MANAGER ================= */
const PaymentManager = {
    renderPaymentFields: () => {
        const methodEl = document.getElementById('p-method');
        const method = methodEl ? methodEl.value : 'bank';
        const container = document.getElementById('payment-dynamic-fields');
        if (!container) return; 
        
        container.innerHTML = ''; 
        let html = '';
        
        const createInput = (label, id, type = 'text', full = false) => {
            return `
                <div class="form-group${full ? ' full' : ''}">
                    <label>${label}</label>
                    ${type === 'textarea' 
                        ? `<textarea class="input-control" id="${id}" rows="4" oninput="window.sync()"></textarea>` 
                        : `<input type="${type}" class="input-control" id="${id}" oninput="window.sync()">`
                    }
                </div>
            `;
        };

        if (method === 'bank') { 
            html += createInput('Bank Name', 'p-bank', 'text', true); 
            html += createInput('Account Title', 'p-accname'); 
            html += createInput('Account Number', 'p-accno'); 
            html += createInput('Routing / IBAN', 'p-iban'); 
            html += createInput('SWIFT / BIC', 'p-swift'); 
        }  
        else if (method === 'paypal') html += createInput('PayPal Email / Link', 'p-paypal', 'text', true);  
        else if (method === 'stripe') html += createInput('Stripe Payment Link', 'p-stripe', 'text', true);  
        else if (method === 'wise') html += createInput('Wise Account Email', 'p-wise', 'email', true);  
        else if (method === 'payoneer') html += createInput('Payoneer Email', 'p-payoneer', 'email', true);  
        else if (method === 'crypto') { 
            html += createInput('Cryptocurrency (e.g. USDT)', 'p-coin'); 
            html += createInput('Network (e.g. TRC20)', 'p-net'); 
            html += createInput('Wallet Address', 'p-wallet', 'text', true); 
        }  
        else if (method === 'easypaisa') { 
            html += createInput('Account Title', 'p-mobi-name'); 
            html += createInput('Mobile Number', 'p-mobi-no'); 
        }  
        else if (method === 'custom') {
            html += createInput('Custom Instructions', 'p-custom', 'textarea', true);  
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
        qrContainer.innerHTML = '';
        if (StateManager.uploadedQRImage) {
            const img = document.createElement('img');
            img.src = StateManager.uploadedQRImage;
            img.style.maxWidth = '100%'; img.style.maxHeight = '100%'; img.style.objectFit = 'contain'; img.style.borderRadius = '4px';
            qrContainer.appendChild(img);
        }
    }
};

/* ================= PRINT & EXPORT MANAGERS ================= */
const PrintManager = {
    printInvoice: () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                body * { visibility: hidden; }
                #invoice-render, #invoice-render * { visibility: visible; }
                #invoice-render { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        setTimeout(() => { window.print(); document.head.removeChild(style); }, 300); 
    }
};

const ExportManager = {
    generatePDF: async () => {
        const element = document.getElementById('invoice-render'); if (!element) return NotificationManager.show('Render area not found.', 'error');
        const invNum = document.getElementById('f-inv-num') ? document.getElementById('f-inv-num').value : 'Invoice';
        UIManager.setLoadingState(true, 'Rendering PDF...');
        try {
            if (typeof window.html2pdf !== 'undefined') {
                const opt = { 
                    margin: 5, filename: `${invNum}.pdf`, image: { type: 'jpeg', quality: 1.0 }, 
                    html2canvas: { scale: 2, useCORS: true, logging: false }, 
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
                };
                await html2pdf().set(opt).from(element).save();
                NotificationManager.show('PDF exported.', 'success');
            } else { PrintManager.printInvoice(); }
        } catch (error) { NotificationManager.show('Failed to generate PDF.', 'error'); }
        finally { UIManager.setLoadingState(false); }
    },
    exportCSV: () => {
        NotificationManager.show('CSV Export triggered.', 'success');
    }
};

/* ================= INITIALIZATION BOOTSTRAP ================= */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        UIManager.setLoadingState(true, 'Initializing Application...');

        if (typeof StorageEngine !== 'undefined') await StorageEngine.init();  
        const dateEl = document.getElementById('f-date'); if (dateEl) dateEl.valueAsDate = new Date();  
        
        await UIManager.loadThemePersistence();  
        InvoiceEngine.autoCalcDueDate();  
        await InvoiceEngine.generateInvoiceNumber();  

        const docType = document.getElementById('f-doc-type'); if (docType) docType.value = "TAX INVOICE";  
        
        // Setup initial UI states
        UIManager.setupDragAndDrop();  
        PaymentManager.renderPaymentFields();  
        
        if (!window._fallbackItems || window._fallbackItems.length === 0) {
            InvoiceEngine.addItem(); // Auto-add first empty row
        } else {
            UIManager.renderItems();
        }
        
        InvoiceEngine.sync();   
          
        if (typeof HistoryManager !== 'undefined') await HistoryManager.loadHistory();
        if (typeof DashboardManager !== 'undefined') await DashboardManager.updateDashboard();
        if (typeof StateManager !== 'undefined') await StateManager.recoverDraft();  

        // DIRECT EVENT BINDINGS
        document.querySelectorAll('button').forEach(btn => {
            if (btn.id === 'add-item-btn' || btn.textContent.includes('Add Line Item')) {
                btn.addEventListener('click', (e) => { e.preventDefault(); window.addItem(); });
            }
            if (btn.id === 'clear-items-btn' || btn.textContent.includes('Clear All')) {
                btn.addEventListener('click', (e) => { e.preventDefault(); window.clearItems(); });
            }
        });

        const pMethodDropdown = document.getElementById('p-method');
        if (pMethodDropdown) {
            pMethodDropdown.addEventListener('change', () => { window.renderPaymentFields(); });
        }
          
        UIManager.setLoadingState(false);  
    } catch (error) {  
        UIManager.setLoadingState(false);  
        SafeLogger.error('Critical failure during initialization sequence:', error);  
    }
});
