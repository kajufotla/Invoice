import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { defaultState } from "./config-data.js";

// Centralized Mutable Data Store
export const store = {
    state: { ...defaultState },
    library: { clients: [], products: [], history: [] },
    calcTotals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
    chartsInstance: { revenue: null, status: null }
};

export function formatMoney(amount, currencyCode) {
    // Falls back to store.state.currency if no specific code is passed
    const currency = currencyCode || store.state.currency || 'USD';
    const locales = { 'USD': 'en-US', 'GBP': 'en-GB', 'CAD': 'en-CA', 'AUD': 'en-AU', 'EUR': 'en-IE', 'PKR': 'en-PK' };
    
    return new Intl.NumberFormat(locales[currency] || 'en-US', {
        style: 'currency', 
        currency: currency
    }).format(amount);
}

export function getTaxRate() {
    // Syncing with the new state keys used in the updated UI
    switch(store.state.region) {
        case 'UK': return 20; 
        case 'CAN': return 5; 
        case 'AUS': return 10;
        case 'USA': 
        default: 
            return parseFloat(store.state['tax-rate-manual']) || parseFloat(store.state.taxRateManual) || 0;
    }
}

export function calculate() {
    // Ensure items array exists to prevent reduce errors
    if (!store.state.items) store.state.items = [];
    
    let sub = store.state.items.reduce((acc, item) => acc + ((item.qty || 0) * (item.price || 0)), 0); 
    let dVal = parseFloat(store.state.discountValue) || 0;
    let disc = store.state.discountType === 'percent' ? sub * (dVal / 100) : dVal;
    
    let afterDisc = Math.max(0, sub - disc);
    let tax = afterDisc * (getTaxRate() / 100);
    
    store.calcTotals = { 
        subtotal: sub, 
        discount: disc, 
        tax: tax, 
        total: afterDisc + tax 
    };
}

export function validateInvoice() {
    // Updated to match the new state keys used in preview-manager.js and HTML
    const companyName = store.state['prof-company-name'] || store.state.companyName;
    const senderDetails = store.state['sender-details'] || store.state.senderDetails;
    
    if (!companyName && (!senderDetails || !senderDetails.trim())) {
        return "Validation Error: Company Name or Sender Details are required.";
    }
    
    const clientDetails = store.state['client-details'] || store.state.clientDetails;
    if (!clientDetails || !clientDetails.trim()) {
        return "Validation Error: Client Information is required.";
    }
    
    const docNumber = store.state['doc-number'] || store.state.docNumber;
    if (!docNumber || !docNumber.trim()) {
        return "Validation Error: Invoice Number is required.";
    }
    
    const hasValidItem = store.state.items && store.state.items.some(i => i.desc && i.desc.trim() !== '');
    if (!hasValidItem || store.state.items.length === 0) {
        return "Validation Error: At least one item with a description is required.";
    }
    return true; // Returns true if valid
}

export async function syncCloud() {
    if(window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
        const uid = window.firebaseAuth.currentUser.uid;
        try {
            await setDoc(doc(window.firebaseDb, "users", uid), { 
                library: JSON.stringify(store.library), 
                state: JSON.stringify(store.state), 
                lastSync: new Date().toISOString() 
            }, { merge: true });
        } catch(e) { 
            console.error("Cloud sync error", e); 
        }
    }
}

export function saveState() { 
    localStorage.setItem('invoiceStatePro', JSON.stringify(store.state)); 
    syncCloud();
}

export function saveLibrary() { 
    localStorage.setItem('invoiceLibraryPro', JSON.stringify(store.library)); 
    syncCloud();
}

export function loadAppData() {
    const savedState = localStorage.getItem('invoiceStatePro');
    const savedLib = localStorage.getItem('invoiceLibraryPro');
    
    if (savedState) {
        try { store.state = { ...defaultState, ...JSON.parse(savedState) }; } catch(e){}
    }
    if (savedLib) {
        try { store.library = { clients: [], products: [], history: [], ...JSON.parse(savedLib) }; } catch(e){}
    }
    
    // Ensure state id is ready
    if(!store.state.id) store.state.id = crypto.randomUUID();
    
    // Ensure items array exists on load
    if(!store.state.items) store.state.items = [];
}

export function saveProductToLibrary(desc, price) {
    if(!desc || !desc.trim()) return;
    const existing = store.library.products.find(p => p.desc === desc);
    if(existing) { 
        existing.price = price; 
    } else { 
        store.library.products.push({desc, price}); 
    }
    saveLibrary();
}
