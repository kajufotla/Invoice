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
        let container = Utility.getEl('toast-container');
        
        if (!container) { 
            container = DOM.create('div', { id: 'toast-container', style: { position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999', display: 'flex', flexDirection: 'column', gap: '10px' } });
            document.body.appendChild(container);
        }

        let iconClass = type === 'success' ? 'fa-check-circle text-success' : type === 'error' ? 'fa-circle-xmark text-danger' : type === 'warning' ? 'fa-triangle-exclamation text-warning' : 'fa-info-circle text-primary';  
        const icon = DOM.create('i', { className: `fa-solid ${iconClass}`, style: { color: `var(--${type})`, marginRight: '8px' } });  
        const toast = DOM.create('div', { className: `toast toast-${type}`, style: { backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', fontWeight: '500', minWidth: '250px', transition: 'opacity 0.3s ease' }, role: 'alert', 'aria-live': 'assertive' }, [icon, document.createTextNode(msg)]);  
          
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

    saveInvoiceAction: async (status) => {  
        UIManager.setLoadingState(true, `Saving Invoice as ${status}...`);  
        try {  
            const invNum = Utility.getVal('f-inv-num') || Utility.generateId();
            const invoiceData = {  
                id: invNum,  
                date: Utility.getVal('f-date'),
                dueDate: Utility.getVal('f-due'),
                client: Utility.getVal('cli-name'),
                company: Utility.getVal('c-name'),
                total: parseFloat(Utility.getEl('out-grand')?.textContent.replace(/[^0-9.-]+/g,"")) || 0,
                currency: StateManager.currencyCode,
                status: status,
                lastModified: Date.now(),
                state: { items: StateManager.items, customQR: StateManager.uploadedQRImage, inputs: {}, images: StateManager.images }  
            };  
            document.querySelectorAll('input, select, textarea').forEach(el => { if (el.id && el.type !== 'file') invoiceData.state.inputs[el.id] = el.type === 'checkbox' ? el.checked : el.value; });  
            
            await StorageEngine.put('invoices', invoiceData);  
            await HistoryManager.loadHistory();
            await DashboardManager.updateDashboard(); 
            NotificationManager.show(`Invoice ${status} Saved Successfully`, 'success');  
        } catch (e) { Logger.error(e); NotificationManager.show('Failed to save invoice', 'error'); }  
        finally { UIManager.setLoadingState(false); }  
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

            const outPayment = Utility.getEl('out-payment'), wrapPay = Utility.getEl('wrap-pay');  
            if (outPayment) {  
                DOM.clear(outPayment);  
                const pMethod = Utility.getVal('p-method'), frag = document.createDocumentFragment();  
                let hasData = false;  
                const addLine = (label, valStr) => {  
                    if (!valStr || valStr.trim() === '') return; hasData = true;  
                    frag.appendChild(DOM.create('strong', {}, [label + ': '])); frag.appendChild(document.createTextNode(valStr)); frag.appendChild(DOM.create('br'));  
                };  

                if (pMethod === 'bank') { addLine('Bank', Utility.getVal('p-bank')); addLine('Account', `${Utility.getVal('p-accname')} (${Utility.getVal('p-accno')})`); addLine('IBAN', Utility.getVal('p-iban')); addLine('SWIFT', Utility.getVal('p-swift')); }  
                else if (pMethod === 'paypal') addLine('PayPal', Utility.getVal('p-paypal'));  
                else if (pMethod === 'stripe') addLine('Pay Online', Utility.getVal('p-stripe'));  
                else if (pMethod === 'wise') addLine('Wise Account', Utility.getVal('p-wise'));  
                else if (pMethod === 'payoneer') addLine('Payoneer', Utility.getVal('p-payoneer'));  
                else if (pMethod === 'crypto') { addLine('Coin', `${Utility.getVal('p-coin')} (${Utility.getVal('p-net')})`); addLine('Wallet', Utility.getVal('p-wallet')); }  
                else if (pMethod === 'easypaisa') { addLine('Mobile Money', `${Utility.getVal('p-mobi-name')} - ${Utility.getVal('p-mobi-no')}`); }  
                else { const customText = Utility.getVal('p-custom'); if (customText) { hasData = true; customText.split('\n').forEach(line => { frag.appendChild(document.createTextNode(line)); frag.appendChild(DOM.create('br')); }); } }  
                outPayment.appendChild(frag); if (wrapPay) wrapPay.style.display = hasData ? 'block' : 'none';  
            }  

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
                    const tr = DOM.create('tr', { className: 'keep-together' });  
                    const tdDetails = DOM.create('td');  
                    tdDetails.appendChild(DOM.create('span', { className: 'td-item-name' }, [it.desc]));  
                    if (it.notes) tdDetails.appendChild(DOM.create('span', { className: 'td-item-desc', style: { display: 'block', fontSize: '11px', color: '#64748b' } }, [it.notes]));  
                    if (it.sku || it.unit) tdDetails.appendChild(DOM.create('span', { className: 'td-item-meta', style: { display: 'block', fontSize: '11px', color: '#94a3b8' } }, [`SKU: ${it.sku||'N/A'} | Unit: ${it.unit||'N/A'}`]));  
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

            let gDiscType = Utility.getVal('f-disc-type'), gDiscVal = Number(Utility.getVal('f-disc-val')) || 0, gTax = Number(Utility.getVal('f-global-tax')) || 0;  
            try { Validator.validateDiscount(gDiscVal, subtotal, gDiscType === 'percent'); } catch(e) { gDiscVal = 0; Utility.getEl('f-disc-val').value = '0'; NotificationManager.show(e.message, 'warning'); }  

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

/* ================= DASHBOARD & ANALYTICS MANAGER ================= */
const DashboardManager = {
    updateDashboard: async () => {
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
        } catch(e) { Logger.warn("Dashboard update skipped", e); }
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
            const textCol = DOM.create('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1' } }, [  
                DOM.create('input', { type: 'text', className: 'input-control', placeholder: 'Item Name / Description', value: it.desc, oninput: (e) => InvoiceEngine.updateItem(idx, 'desc', e.target.value) }),  
                DOM.create('input', { type: 'text', className: 'input-control', style: { fontSize: '11px', padding: '6px', color: 'var(--text-muted)' }, placeholder: 'Additional notes...', value: it.notes, oninput: (e) => InvoiceEngine.updateItem(idx, 'notes', e.target.value) })  
            ]);  
            const qtyInput = DOM.create('input', { type: 'number', className: 'input-control', style: { width: '80px' }, placeholder: 'Qty', value: it.qty, oninput: (e) => InvoiceEngine.updateItem(idx, 'qty', e.target.value) });  
            const priceInput = DOM.create('input', { type: 'number', className: 'input-control', style: { width: '100px' }, placeholder: 'Price', value: it.price, oninput: (e) => InvoiceEngine.updateItem(idx, 'price', e.target.value) });  
              
            const btnAdv = DOM.create('button', { className: 'btn btn-icon', title: 'Edit Advanced', 'aria-label': 'Toggle Advanced', onclick: () => { StateManager.items[idx].showAdv = !it.showAdv; UIManager.renderItems(); } }, [DOM.create('i', { className: 'fa-solid fa-sliders' })]);  
            const btnLib = DOM.create('button', { className: 'btn btn-icon text-primary', title: 'Save to Product Library', onclick: () => EntityManager.saveProductToLibrary(idx) }, [DOM.create('i', { className: 'fa-solid fa-bookmark' })]);  
            const btnDel = DOM.create('button', { className: 'btn btn-icon btn-danger', title: 'Delete Item', onclick: () => InvoiceEngine.deleteItem(idx) }, [DOM.create('i', { className: 'fa-solid fa-trash' })]);  
            const btnGroup = DOM.create('div', { style: { display: 'flex', gap: '4px' } }, [btnAdv, btnLib, btnDel]);  

            row.appendChild(DOM.create('div', { className: 'item-main', style: { display: 'flex', gap: '10px', alignItems: 'flex-start' } }, [dragHandle, textCol, qtyInput, priceInput, btnGroup]));  

            if (it.showAdv) {  
                const metaGroup = DOM.create('div', { className: 'item-meta', style: { display: 'flex', gap: '10px', marginTop: '10px', padding: '10px', backgroundColor: 'var(--bg-light)' } });  
                const createFormGroup = (l, t, ph, val, field) => DOM.create('div', { className: 'form-group' }, [DOM.create('label', {}, [l]), DOM.create('input', { type: t, className: 'input-control input-sm', placeholder: ph, value: val, oninput: (e) => InvoiceEngine.updateItem(idx, field, e.target.value) })]);  
                metaGroup.appendChild(createFormGroup('SKU', 'text', '', it.sku||'', 'sku')); 
                metaGroup.appendChild(createFormGroup('Unit', 'text', 'hrs, pcs', it.unit||'', 'unit')); 
                metaGroup.appendChild(createFormGroup(`Disc (${StateManager.currencySym})`, 'number', '0', it.disc, 'disc')); 
                metaGroup.appendChild(createFormGroup('Tax (%)', 'number', '0', it.tax, 'tax'));  
                
                row.appendChild(metaGroup); 
                row.appendChild(DOM.create('div', { className: 'item-total-display', style: { textAlign: 'right', fontWeight: 'bold', marginTop: '5px' } }, [`Line Total: ${StateManager.currencySym}${Utility.formatCurrency(total)}`]));  
            }  
            frag.appendChild(row);  
        });  
        cont.appendChild(frag); InvoiceEngine.syncDebounced();  
    },  

    saveDraft: () => InvoiceEngine.saveInvoiceAction('Draft'),
    saveFinal: () => InvoiceEngine.saveInvoiceAction('Final'),
    markPaid: () => InvoiceEngine.saveInvoiceAction('Paid'),
      
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
                const key = imgId.replace('img-', '');
                StateManager.images[key] = e.target.result;
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
              if (overlay) overlay.remove();
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

        if(method) {  
            const saveBtn = DOM.create('button', { className: 'btn btn-outline', style: { marginTop: '10px' }, onclick: EntityManager.savePaymentMethod }, [DOM.create('i', { className: 'fa-solid fa-save' }), ' Save this Payment Template']);  
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
                    width: 210mm; min-height: 297mm; /* Force A4 dimensions */
                    box-sizing: border-box; margin: 0; padding: 10mm; 
                    box-shadow: none; border: none; 
                    display: flex; flex-direction: column; /* Allows footer to be pushed down */
                }
                .no-print { display: none !important; }
                @page { size: A4; margin: 0; }
                .items-container { flex-grow: 1; } /* Pushes the signature/footer to bottom */
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

/* ================= ENTERPRISE EXPORT / BACKUP ENGINE (FIXED PDF CUTTING OFF) ================= */
const ExportManager = {
    generatePDF: async () => {
        const element = Utility.getEl('invoice-render'); if (!element) return NotificationManager.show('Render area not found.', 'error');
        const invNum = Utility.getVal('f-inv-num') || 'Invoice', client = Utility.getVal('cli-name') || 'Client';
        UIManager.setLoadingState(true, 'Rendering Enterprise A4 PDF...');
        try {
            if (typeof window.html2pdf !== 'undefined') {
                const opt = { 
                    margin: 5, // mm margin for safety
                    filename: `${invNum}_${client}.pdf`.replace(/[^a-z0-9_-]/gi, '_'), 
                    image: { type: 'jpeg', quality: 1.0 }, 
                    html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 800 }, // windowWidth 800px stops it from cutting off on wide screens
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, 
                    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr, .keep-together' } 
                };
                await html2pdf().set(opt).from(element).save();
                NotificationManager.show('PDF exported perfectly.', 'success');
            } else {
                NotificationManager.show('Offline Mode: Using Native Browser PDF Engine', 'info');
                PrintManager.printInvoice(); 
            }
        } catch (error) { Logger.error(error); NotificationManager.show('Failed to generate PDF.', 'error'); }
        finally { UIManager.setLoadingState(false); }
    },

    exportFullDatabase: async () => {  
        UIManager.setLoadingState(true, 'Generating Complete System Backup...');
        try {
            const data = { 
                version: AppConfig.version, 
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
        } catch (error) { Logger.error(error); NotificationManager.show('Backup failed.', 'error'); }
        finally { UIManager.setLoadingState(false); }
    },  

    importFullDatabase: async (event) => {
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
                    await HistoryManager.loadHistory();
                    await DashboardManager.updateDashboard();
                    NotificationManager.show('System Fully Restored', 'success');
                }
            } catch (err) { Logger.error(err); NotificationManager.show('Backup validation failed.', 'error'); }
            finally { UIManager.setLoadingState(false); event.target.value = ''; }
        };
        reader.readAsText(file);
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
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`New Invoice: ${invNum}`)}&body=${encodeURIComponent(`Hello,\n\nPlease find attached details for invoice ${invNum}. Total due: ${total}.\n\nThank you.`)}`;  
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
            case 's': e.preventDefault(); UIManager.saveDraft(); break;
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

        if ('serviceWorker' in navigator && !AppConfig.debugMode) {
            navigator.serviceWorker.register('/sw.js').then(reg => Logger.info('Service Worker Registered')).catch(err => Logger.warn('Service Worker Failed', err));
        }

        await StorageEngine.init();  
        const dateEl = Utility.getEl('f-date'); if (dateEl) dateEl.valueAsDate = new Date();  
        
        await UIManager.loadThemePersistence();  
        InvoiceEngine.autoCalcDueDate();  
        await InvoiceEngine.generateInvoiceNumber();  

        const docType = Utility.getEl('f-doc-type'); if (docType) docType.value = "TAX INVOICE";  
        const nPublic = Utility.getEl('n-public'); if (nPublic) nPublic.value = "Thank you for your business. We appreciate your prompt payment.";  
        const nTerms = Utility.getEl('n-terms'); if (nTerms) nTerms.value = "1. Please quote invoice number when remitting funds.\n2. Late payments are subject to a 2% monthly fee.";  

        UIManager.setupDragAndDrop();  
        PaymentManager.renderPaymentFields();  
        UIManager.renderItems();  
        InvoiceEngine.sync();   
          
        await HistoryManager.loadHistory();
        await DashboardManager.updateDashboard();
        await StateManager.recoverDraft();  
        StateManager.saveState();  

        const bindFilter = (id, func) => { const el = Utility.getEl(id); if (el) el.addEventListener('input', func); };
        
        bindFilter('history-search', HistoryManager.renderHistoryTable);
        bindFilter('history-status-filter', HistoryManager.renderHistoryTable);
        bindFilter('history-sort', HistoryManager.renderHistoryTable);
        bindFilter('draft-search', HistoryManager.renderDraftsTable);
        bindFilter('draft-sort', HistoryManager.renderDraftsTable);
        bindFilter('final-search', HistoryManager.renderFinalsTable);
        bindFilter('final-status-filter', HistoryManager.renderFinalsTable);
        bindFilter('final-sort', HistoryManager.renderFinalsTable);
          
        UIManager.setLoadingState(false);  
    } catch (error) {  
        UIManager.setLoadingState(false);  
        Logger.error('Critical failure during initialization sequence:', error);  
        if (typeof NotificationManager !== 'undefined') NotificationManager.show('System Boot Failure. Check console.', 'error');  
    }
});

/* ================= GLOBAL PROXY BINDINGS (FIXED: ALL BUTTONS WILL WORK NOW) ================= */
window.toggleSidebar = UIManager.toggleSidebar;
window.switchTab = UIManager.switchTab;
window.toggleDarkMode = UIManager.toggleDarkMode;
window.showToast = NotificationManager.show;
window.setLanguage = I18nManager.setLanguage;
window.saveDraft = UIManager.saveDraft;
window.saveFinal = UIManager.saveFinal;
window.markPaid = UIManager.markPaid;
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
window.printInvoice = PrintManager.printInvoice;
window.exportCSV = ExportManager.exportCSV;
window.exportFullDatabase = ExportManager.exportFullDatabase;
window.importFullDatabase = ExportManager.importFullDatabase;
window.loadHistory = HistoryManager.loadHistory;
window.openInvoice = HistoryManager.openInvoice;
window.moveToTrash = HistoryManager.moveToTrash;
window.restoreFromTrash = HistoryManager.restoreFromTrash;
window.deletePermanently = HistoryManager.deletePermanently;
window.duplicateInvoice = HistoryManager.duplicateInvoice;
window.saveCustomerProfile = EntityManager.saveCustomerProfile;
window.loadCustomerProfile = EntityManager.loadCustomerProfile;
window.deleteCustomerProfile = EntityManager.deleteCustomerProfile;
window.saveCompanyProfile = EntityManager.saveCompanyProfile;
window.saveNotesTemplate = EntityManager.saveNotesTemplate;
window.savePaymentMethod = EntityManager.savePaymentMethod;
window.saveProductToLibrary = EntityManager.saveProductToLibrary;
window.loadProductToItem = EntityManager.loadProductToItem;
window.deleteProduct = EntityManager.deleteProduct;
