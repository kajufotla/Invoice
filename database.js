/* ================= ROBUST STORAGE ENGINE (IndexedDB v3) ================= */
const StorageEngine = {
    dbName: 'HamidHussainEnterpriseDB',
    version: 3, 
    db: null,
    stores: ['invoices', 'customers', 'products', 'payments', 'companies', 'notes', 'trash'],
    
    init: () => new Promise((resolve, reject) => {  
        const req = indexedDB.open(StorageEngine.dbName, StorageEngine.version);  
        req.onupgradeneeded = (e) => {  
            const db = e.target.result;  
            const oldVersion = e.oldVersion;
            
            StorageEngine.stores.forEach(store => {  
                if (!db.objectStoreNames.contains(store)) {  
                    const os = db.createObjectStore(store, { keyPath: 'id' });  
                    if (store === 'invoices' || store === 'trash') {  
                        os.createIndex('status', 'status', { unique: false });  
                        os.createIndex('date', 'date', { unique: false });  
                        os.createIndex('client', 'client', { unique: false });
                        os.createIndex('total', 'total', { unique: false });
                    }
                    if (store === 'customers') os.createIndex('name', 'name', { unique: false });
                    if (store === 'products') os.createIndex('desc', 'desc', { unique: false });
                } else if (store === 'invoices' && oldVersion < 2) {
                    const os = e.target.transaction.objectStore('invoices');
                    if (!os.indexNames.contains('client')) os.createIndex('client', 'client', { unique: false });
                    if (!os.indexNames.contains('total')) os.createIndex('total', 'total', { unique: false });
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
        const cleanData = Sanitizer.sanitizeObject(data); 
        const req = StorageEngine._tx(storeName, 'readwrite').put(cleanData);  
        req.onsuccess = () => resolve(cleanData.id);  
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

    clearStore: (storeName) => new Promise((resolve, reject) => {
        const req = StorageEngine._tx(storeName, 'readwrite').clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    }),

    setKV: (key, value) => localStorage.setItem(AppConfig.storagePrefix + key, JSON.stringify(value)),  
    getKV: (key) => { try { return JSON.parse(localStorage.getItem(AppConfig.storagePrefix + key)); } catch(e){ return null; } }
};

/* ================= STATE MANAGER ================= */
const StateManager = {
    history: [], historyIndex: -1, isUndoing: false,
    currentInvoiceId: null,
    items: [{ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false }],
    currencySym: AppConfig.defaultCurrencySym,
    currencyCode: AppConfig.defaultCurrencyCode,
    uploadedQRImage: null,
    images: { logo: null, sign: null, stamp: null },

    saveState: Utility.debounce(async () => {  
        if (StateManager.isUndoing) return;  
        try {  
            const currentState = { 
                items: JSON.parse(JSON.stringify(StateManager.items)), 
                inputs: {}, 
                customQR: StateManager.uploadedQRImage,
                images: { ...StateManager.images }
            };  
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
            StateManager.images = state.images || { logo: null, sign: null, stamp: null };

            ['logo', 'sign', 'stamp'].forEach(key => {
                const img = Utility.getEl(`img-${key}`); const ph = Utility.getEl(`${key}-placeholder`); const wrap = Utility.getEl(`wrap-${key}`);
                if (img && StateManager.images[key]) {
                    img.src = StateManager.images[key]; img.style.display = 'block';
                    if (ph) ph.style.display = 'none';
                    if (key === 'stamp' && wrap) wrap.style.display = 'block';
                }
            });

            for (let id in state.inputs) {  
                const el = Utility.getEl(id);  
                if (el) { if (el.type === 'checkbox') el.checked = state.inputs[id]; else el.value = state.inputs[id]; }  
            }  
            UIManager.renderItems(); PaymentManager.renderPaymentFields(); InvoiceEngine.sync();  
        } catch (error) { Logger.error('Restore state failed:', error); }  
    },  

    recoverDraft: async () => {  
        const draft = StorageEngine.getKV('autosave_draft');  
        if (draft) { StateManager.restoreState(draft); typeof NotificationManager !== 'undefined' && NotificationManager.show("Working Draft Restored", "info"); }  
    }
};

/* ================= ENTITY MANAGERS ================= */
const EntityManager = {
    saveCustomerProfile: async () => {
        const email = Utility.getVal('cli-email');
        if (email && !Validator.isEmail(email)) return NotificationManager.show('Invalid Email', 'error');
        const id = Utility.getVal('cli-taxid') || Utility.generateId();
        const customer = { id, name: Utility.getVal('cli-name'), email, phone: Utility.getVal('cli-phone'), address1: Utility.getVal('cli-addr1'), address2: Utility.getVal('cli-addr2'), contact: Utility.getVal('cli-contact'), lastUsed: Date.now() };
        if (!customer.name) return NotificationManager.show('Customer Name required', 'error');
        await StorageEngine.put('customers', customer);
        NotificationManager.show('Customer Profile Saved', 'success');
    },
    loadCustomerProfile: async (id) => {
        const customer = await StorageEngine.get('customers', id);
        if (customer) {
            customer.lastUsed = Date.now(); await StorageEngine.put('customers', customer);
            ['cli-name','cli-email','cli-phone','cli-addr1','cli-addr2','cli-contact','cli-taxid'].forEach(key => {
                const el = Utility.getEl(key); if (el) el.value = customer[key.replace('cli-', '')] || '';
            });
            InvoiceEngine.syncDebounced(); NotificationManager.show('Customer Auto-Filled', 'success');
        }
    },
    deleteCustomerProfile: async (id) => { await StorageEngine.delete('customers', id); NotificationManager.show('Customer Deleted', 'success'); },
    
    saveProductToLibrary: async (itemIdx = null) => {  
        let item;
        if (itemIdx !== null && StateManager.items[itemIdx]) item = StateManager.items[itemIdx];
        else item = { desc: Utility.getVal('lib-prod-desc'), price: Utility.getVal('lib-prod-price'), unit: Utility.getVal('lib-prod-unit'), tax: Utility.getVal('lib-prod-tax'), sku: Utility.getVal('lib-prod-sku'), notes: Utility.getVal('lib-prod-notes') };
        
        if (!item.desc) return NotificationManager.show('Item description required.', 'error');  
        const product = { id: item.sku || Utility.generateId(), desc: item.desc, price: item.price, unit: item.unit, tax: item.tax, sku: item.sku, notes: item.notes, lastUsed: Date.now() };  
        await StorageEngine.put('products', product);  
        NotificationManager.show('Product Saved to Library', 'success');  
    },  
    loadProductToItem: async (productId, targetItemIdx) => {
        const product = await StorageEngine.get('products', productId);
        if (product && StateManager.items[targetItemIdx]) {
            product.lastUsed = Date.now(); await StorageEngine.put('products', product);
            const t = StateManager.items[targetItemIdx];
            t.desc = product.desc || ''; t.price = product.price || ''; t.unit = product.unit || ''; t.tax = product.tax || ''; t.sku = product.id || ''; t.notes = product.notes || '';
            UIManager.renderItems(); NotificationManager.show('Product Auto-Filled', 'success');
        }
    },
    deleteProduct: async (id) => { await StorageEngine.delete('products', id); NotificationManager.show('Product Deleted', 'success'); },

    savePaymentMethod: async () => {  
        const method = Utility.getVal('p-method');  
        const id = method + '_' + Date.now();  
        const payload = { id, methodType: method, details: {}, isFavorite: false };  
        const inputs = document.querySelectorAll('#payment-dynamic-fields input, #payment-dynamic-fields textarea');  
        inputs.forEach(inp => payload.details[inp.id] = inp.value);  
        await StorageEngine.put('payments', payload);  
        NotificationManager.show('Payment Template Saved', 'success');  
    },  
    saveNotesTemplate: async () => {  
        const payload = { id: Utility.generateId(), title: prompt('Template Name:'), public: Utility.getVal('n-public'), terms: Utility.getVal('n-terms'), footer: Utility.getVal('n-footer') };  
        if(payload.title) { await StorageEngine.put('notes', payload); NotificationManager.show('Notes Template Saved', 'success'); }  
    },  
    saveCompanyProfile: async () => {  
        const payload = { id: Utility.getVal('c-name') || Utility.generateId(), name: Utility.getVal('c-name'), email: Utility.getVal('c-email'), phone: Utility.getVal('c-phone'), addr1: Utility.getVal('c-addr1'), addr2: Utility.getVal('c-addr2'), web: Utility.getVal('c-web'), taxid: Utility.getVal('c-taxid'), reg: Utility.getVal('c-reg'), isDefault: true };  
        if(payload.name) { await StorageEngine.put('companies', payload); NotificationManager.show('Company Profile Saved', 'success'); }  
    }
};

/* ================= HISTORY MANAGER ================= */
const HistoryManager = {
    invoices: [],
    
    loadHistory: async () => {
        try {
            HistoryManager.invoices = await StorageEngine.getAll('invoices');
            HistoryManager.renderHistoryTable(); 
            HistoryManager.renderDraftsTable();  
            HistoryManager.renderFinalsTable();  
            HistoryManager.renderTrashTable();   
        } catch(e) { Logger.error("Failed to load history", e); }
    },

    _getFilteredData: (q, statusFilter, sortMode, requireStatus = null) => {
        let filtered = HistoryManager.invoices.filter(inv => {
            if (requireStatus === 'Draft' && inv.status !== 'Draft') return false;
            if (requireStatus === 'Final' && inv.status === 'Draft') return false; 
            
            const matchesSearch = !q || (inv.id && inv.id.toLowerCase().includes(q)) || (inv.client && inv.client.toLowerCase().includes(q)) || (inv.company && inv.company.toLowerCase().includes(q)) || (inv.date && inv.date.includes(q)) || (inv.total && inv.total.toString().includes(q));
            const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        filtered.sort((a, b) => {
            if (sortMode === 'newest') return new Date(b.date || 0) - new Date(a.date || 0);
            if (sortMode === 'oldest') return new Date(a.date || 0) - new Date(b.date || 0);
            if (sortMode === 'highest') return b.total - a.total;
            if (sortMode === 'lowest') return a.total - b.total;
            if (sortMode === 'client-asc') return (a.client || '').localeCompare(b.client || '');
            if (sortMode === 'client-desc') return (b.client || '').localeCompare(a.client || '');
            return 0;
        });
        return filtered;
    },

    _renderTable: (containerId, filteredData) => {
        const container = Utility.getEl(containerId);
        if (!container) return; 
        DOM.clear(container);
        const frag = document.createDocumentFragment();

        if (filteredData.length === 0) {
            frag.appendChild(DOM.create('tr', {}, [ DOM.create('td', { colSpan: 8, className: 'text-center' }, ['No records found matching criteria.']) ]));
        } else {
            filteredData.forEach(inv => {
                const tr = DOM.create('tr');
                tr.appendChild(DOM.create('td', { style: { fontWeight: '600' } }, [inv.id]));
                tr.appendChild(DOM.create('td', {}, [inv.client || 'Unknown']));
                tr.appendChild(DOM.create('td', {}, [Utility.formatDate(inv.date)]));
                tr.appendChild(DOM.create('td', {}, [Utility.formatDate(inv.dueDate)]));
                tr.appendChild(DOM.create('td', {}, [`${inv.currency || '$'} ${Utility.formatCurrency(inv.total)}`]));
                
                const statusBadge = DOM.create('span', { className: `badge badge-${inv.status ? inv.status.toLowerCase() : 'draft'}` }, [inv.status || 'Draft']);
                tr.appendChild(DOM.create('td', {}, [statusBadge]));
                
                const actionsTd = DOM.create('td', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } });
                actionsTd.appendChild(DOM.create('button', { className: 'btn btn-sm btn-outline', title: 'Open & Edit', onclick: () => HistoryManager.openInvoice(inv.id) }, ['Open']));
                actionsTd.appendChild(DOM.create('button', { className: 'btn btn-sm btn-outline text-primary', title: 'Duplicate', onclick: () => HistoryManager.duplicateInvoice(inv.id) }, ['Duplicate']));
                actionsTd.appendChild(DOM.create('button', { className: 'btn btn-sm btn-outline text-danger', title: 'Trash', onclick: () => HistoryManager.moveToTrash(inv.id) }, ['Trash']));
                
                tr.appendChild(actionsTd);
                frag.appendChild(tr);
            });
        }
        container.appendChild(frag);
    },

    renderHistoryTable: () => {
        const q = Utility.getVal('history-search').toLowerCase(), statusFilter = Utility.getVal('history-status-filter') || 'All', sortMode = Utility.getVal('history-sort') || 'newest';
        HistoryManager._renderTable('history-table-body', HistoryManager._getFilteredData(q, statusFilter, sortMode));
    },
    renderDraftsTable: () => {
        const q = Utility.getVal('draft-search').toLowerCase(), sortMode = Utility.getVal('draft-sort') || 'newest';
        HistoryManager._renderTable('draft-table-body', HistoryManager._getFilteredData(q, 'Draft', sortMode, 'Draft'));
    },
    renderFinalsTable: () => {
        const q = Utility.getVal('final-search').toLowerCase(), statusFilter = Utility.getVal('final-status-filter') || 'All', sortMode = Utility.getVal('final-sort') || 'newest';
        HistoryManager._renderTable('final-table-body', HistoryManager._getFilteredData(q, statusFilter, sortMode, 'Final'));
    },

    renderTrashTable: async () => {
        const container = Utility.getEl('trash-table-body');
        if (!container) return; 
        DOM.clear(container);
        try {
            const trashData = await StorageEngine.getAll('trash');
            const frag = document.createDocumentFragment();
            if (trashData.length === 0) {
                frag.appendChild(DOM.create('tr', {}, [ DOM.create('td', { colSpan: 8, className: 'text-center' }, ['Trash is empty.']) ]));
            } else {
                trashData.forEach(inv => {
                    const tr = DOM.create('tr');
                    tr.appendChild(DOM.create('td', {}, [inv.id]));
                    tr.appendChild(DOM.create('td', {}, [inv.client || 'Unknown']));
                    tr.appendChild(DOM.create('td', {}, [Utility.formatDate(inv.date)]));
                    tr.appendChild(DOM.create('td', {}, [`${inv.currency || '$'} ${Utility.formatCurrency(inv.total)}`]));
                    
                    const actionsTd = DOM.create('td', { style: { display: 'flex', gap: '4px' } });
                    actionsTd.appendChild(DOM.create('button', { className: 'btn btn-sm btn-outline text-success', title: 'Restore', onclick: () => HistoryManager.restoreFromTrash(inv.id) }, ['Restore']));
                    actionsTd.appendChild(DOM.create('button', { className: 'btn btn-sm btn-danger', title: 'Delete Permanently', onclick: () => HistoryManager.deletePermanently(inv.id) }, ['Perm Delete']));
                    tr.appendChild(actionsTd);
                    frag.appendChild(tr);
                });
            }
            container.appendChild(frag);
        } catch(e) {}
    },

    openInvoice: (id) => {
        const inv = HistoryManager.invoices.find(i => i.id === id);
        if (inv) {
            StateManager.restoreState(inv.state);
            NotificationManager.show(`Loaded Invoice ${id}`, 'success');
            UIManager.switchTab('tab-editor');
        }
    },

    duplicateInvoice: async (id) => {
        const inv = HistoryManager.invoices.find(i => i.id === id);
        if (inv) {
            StateManager.restoreState(inv.state);
            await InvoiceEngine.generateInvoiceNumber(); 
            const dateInput = Utility.getEl('f-date'); if(dateInput) dateInput.valueAsDate = new Date();
            await InvoiceEngine.saveInvoiceAction('Draft'); 
            NotificationManager.show('Invoice Duplicated as Draft', 'success');
            UIManager.switchTab('tab-editor');
        }
    },

    moveToTrash: async (id) => {
        const inv = HistoryManager.invoices.find(i => i.id === id);
        if (inv) {
            await StorageEngine.put('trash', inv);
            await StorageEngine.delete('invoices', id);
            await HistoryManager.loadHistory();
            await DashboardManager.updateDashboard();
            NotificationManager.show('Moved to Recycle Bin', 'warning');
        }
    },

    restoreFromTrash: async (id) => {
        const inv = await StorageEngine.get('trash', id);
        if (inv) {
            await StorageEngine.put('invoices', inv);
            await StorageEngine.delete('trash', id);
            await HistoryManager.loadHistory();
            await DashboardManager.updateDashboard();
            NotificationManager.show('Restored Successfully', 'success');
        }
    },

    deletePermanently: async (id) => {
        if (confirm(`CRITICAL: Are you sure you want to permanently delete invoice ${id}? This cannot be undone.`)) {
            await StorageEngine.delete('trash', id);
            await HistoryManager.loadHistory();
            NotificationManager.show('Invoice Deleted Forever', 'success');
        }
    }
};
