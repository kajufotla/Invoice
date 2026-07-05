// Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your provided Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBURDkNr9TMqzrf0BRx0J4VJVJe_rEJZus",
    authDomain: "invoice-57140.firebaseapp.com",
    projectId: "invoice-57140",
    storageBucket: "invoice-57140.firebasestorage.app",
    messagingSenderId: "138676617410",
    appId: "1:138676617410:web:c9a794133716a3f1e7bb5b",
    measurementId: "G-C4TSL5SZBK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// UI Elements
const authContainer = document.getElementById('auth-container');
const appLayout = document.getElementById('app-layout');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnAuthAction = document.getElementById('btn-auth-action');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const btnForgotPass = document.getElementById('btn-forgot-password');
const btnLogout = document.getElementById('btn-logout');

const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const repassInput = document.getElementById('auth-re-password');
const repassContainer = document.getElementById('re-password-container');
const toastEl = document.getElementById('toast');

window.firebaseDb = db;
window.firebaseAuth = auth;

let isSignUp = false;

function showAuthToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toastEl.classList.add('translate-y-24', 'opacity-0'), 3000);
}

// Toggle Login/Signup
btnToggleAuth.addEventListener('click', () => {
    isSignUp = !isSignUp;
    if(isSignUp) {
        repassContainer.classList.remove('hidden');
        btnAuthAction.textContent = 'Sign Up';
        btnToggleAuth.textContent = 'Already have an account? Login';
    } else {
        repassContainer.classList.add('hidden');
        btnAuthAction.textContent = 'Login';
        btnToggleAuth.textContent = 'Create an account';
    }
});

// Email Auth (Login & Register)
btnAuthAction.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passInput.value;
    
    if(!email || !password) return showAuthToast("Please enter email and password.");

    if(isSignUp) {
        const repass = repassInput.value;
        if(password !== repass) return showAuthToast("Passwords do not match!");
        
        btnAuthAction.textContent = 'Loading...';
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => showAuthToast("Account created successfully!"))
            .catch(err => {
                showAuthToast(err.message);
                btnAuthAction.textContent = 'Sign Up';
            });
    } else {
        btnAuthAction.textContent = 'Loading...';
        signInWithEmailAndPassword(auth, email, password)
            .then(() => showAuthToast("Logged in successfully!"))
            .catch(err => {
                showAuthToast("Login failed: " + err.message);
                btnAuthAction.textContent = 'Login';
            });
    }
});

// Google Auth
btnGoogleLogin.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .then(() => showAuthToast("Logged in with Google!"))
        .catch(err => showAuthToast("Google Login failed: " + err.message));
});

// Forgot Password
btnForgotPass.addEventListener('click', () => {
    const email = emailInput.value;
    if(!email) return showAuthToast("Please enter your email first to reset password.");
    sendPasswordResetEmail(auth, email)
        .then(() => showAuthToast("Password reset email sent!"))
        .catch(err => showAuthToast(err.message));
});

// Logout
if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            showAuthToast("Logged out successfully.");
        }).catch((error) => {
            showAuthToast("Error logging out.");
        });
    });
}

// Auth State Listener (Hides App/Shows Form based on login state)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authContainer.classList.add('hidden');
        appLayout.classList.remove('hidden');
        btnAuthAction.textContent = isSignUp ? 'Sign Up' : 'Login';
        window.dispatchEvent(new Event('auth-ready'));
    } else {
        authContainer.classList.remove('hidden');
        appLayout.classList.add('hidden');
        emailInput.value = '';
        passInput.value = '';
        repassInput.value = '';
    }
});

// Application Business Logic
document.addEventListener('DOMContentLoaded', () => {
    const toastEl = document.getElementById('toast');
    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.remove('translate-y-24', 'opacity-0');
        setTimeout(() => toastEl.classList.add('translate-y-24', 'opacity-0'), 3000);
    }

    const dict = {
        en: { dir: 'ltr', invoice: "INVOICE", receipt: "RECEIPT", quote: "QUOTE", from: "From", to: "To", desc: "Description", qty: "Qty", price: "Unit Price", total: "Total", subtotal: "Subtotal", tax: "Tax", discount: "Discount", payment: "Payment Details", due: "Due:", date: "Date:", gtotal: "Total" },
        ur: { dir: 'rtl', invoice: "رسید", receipt: "وصولی", quote: "تخمینہ", from: "کی طرف سے", to: "کے نام", desc: "تفصیل", qty: "تعداد", price: "قیمت", total: "کل", subtotal: "میزان", tax: "ٹیکس", discount: "رعایت", payment: "ادائیگی کی تفصیلات", due: "آخری تاریخ:", date: "تاریخ:", gtotal: "کل رقم" }
    };

    let defaultState = {
        docType: 'Invoice', currency: 'USD', region: 'USA',
        docNumber: 'INV-0001', date: new Date().toISOString().split('T')[0], dueDate: '',
        senderDetails: 'My Company LLC\nNew York, NY 10001',
        clientDetails: 'Acme Corp\nSan Francisco, CA 94105',
        paymentDetails: '',
        items: [{ id: crypto.randomUUID(), desc: 'Web Development Services', qty: 1, price: 1500.00 }],
        discountType: 'fixed', discountValue: 0, taxRateManual: 0, status: 'Pending', template_id: 'classic',
        logoDataUrl: null, sigDataUrl: null, generateQR: false, lang: 'en',
        notes: '', terms: ''
    };

    let state = { ...defaultState };
    let library = { clients: [], products: [], history: [] };
    let qrCodeObj = null;
    let chartsInstance = { revenue: null, status: null };

    async function loadAppData() {
        const savedState = localStorage.getItem('invoiceStatePro');
        const savedLib = localStorage.getItem('invoiceLibraryPro');
        if (savedState) {
            try { state = { ...state, ...JSON.parse(savedState) }; } catch(e){}
        }
        if (savedLib) {
            try { library = { ...library, ...JSON.parse(savedLib) }; } catch(e){}
        }
        syncDOMWithState();
        updateClientDropdown();
        updateProductDatalist();
        updateDashboard();
        loadCompanyProfile();
    }

    async function syncCloud() {
        if(window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseDb) {
            const uid = window.firebaseAuth.currentUser.uid;
            const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            try {
                await setDoc(doc(window.firebaseDb, "users", uid), { library: JSON.stringify(library), state: JSON.stringify(state) }, { merge: true });
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
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        try {
            const docSnap = await getDoc(doc(window.firebaseDb, "users", uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(data.state) state = { ...state, ...JSON.parse(data.state) };
                if(data.library) library = { ...library, ...JSON.parse(data.library) };
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
        document.getElementById('doc-type').value = state.docType;
        document.getElementById('currency').value = state.currency;
        document.getElementById('region').value = state.region;
        document.getElementById('doc-number').value = state.docNumber;
        document.getElementById('doc-date').value = state.date;
        document.getElementById('doc-due-date').value = state.dueDate;
        document.getElementById('sender-details').value = state.senderDetails;
        document.getElementById('client-details').value = state.clientDetails;
        document.getElementById('payment-details').value = state.paymentDetails;
        document.getElementById('discount-type').value = state.discountType;
        document.getElementById('discount-value').value = state.discountValue;
        document.getElementById('tax-rate-manual').value = state.taxRateManual;
        document.getElementById('doc-status').value = state.status;
        document.getElementById('doc-template').value = state.template_id;
        document.getElementById('toggle-qr').checked = state.generateQR;
        document.getElementById('tax-input-container').style.display = state.region === 'USA' ? 'flex' : 'none';
        
        document.getElementById('invoice-notes').value = state.notes || '';
        document.getElementById('invoice-terms').value = state.terms || '';
        
        document.getElementById('btn-lang-toggle').textContent = state.lang.toUpperCase();
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

    // Auto Invoice Number Generation
    document.getElementById('btn-auto-invoice').addEventListener('click', () => {
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
        document.getElementById('doc-number').value = state.docNumber;
        saveState();
        renderPreview();
        showToast(`Generated: ${state.docNumber}`);
    });

    // Company Profile Operations
    document.getElementById('btn-save-profile').addEventListener('click', () => {
        const name = document.getElementById('prof-company-name').value.trim();
        const address = document.getElementById('prof-company-address').value.trim();
        if (!name) return showToast("Company Name is required.");
        const profile = { name, address };
        localStorage.setItem('invoiceCompanyProfile', JSON.stringify(profile));
        state.senderDetails = `${name}\n${address}`;
        document.getElementById('sender-details').value = state.senderDetails;
        saveState();
        renderPreview();
        showToast("Company profile saved locally.");
    });

    function loadCompanyProfile() {
        const profileStr = localStorage.getItem('invoiceCompanyProfile');
        if (profileStr) {
            try {
                const profile = JSON.parse(profileStr);
                document.getElementById('prof-company-name').value = profile.name || '';
                document.getElementById('prof-company-address').value = profile.address || '';
            } catch(e){}
        }
    }

    // Duplicate Invoice Operations
    document.getElementById('btn-duplicate').addEventListener('click', () => {
        if (!state.docNumber) return showToast("No active template instance to duplicate.");
        state.docNumber = state.docNumber + "-DUP";
        document.getElementById('doc-number').value = state.docNumber;
        saveState();
        renderPreview();
        showToast("Invoice duplicated as variant.");
    });

    // Print Friendly View Framework Toggles
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

    document.getElementById('btn-save-client').addEventListener('click', () => {
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

    document.getElementById('lib-clients').addEventListener('change', (e) => {
        if(e.target.value !== "") {
            state.clientDetails = library.clients[parseInt(e.target.value)];
            document.getElementById('client-details').value = state.clientDetails;
            saveState();
            renderPreview();
            e.target.value = ""; 
        }
    });

    function updateClientDropdown() {
        const select = document.getElementById('lib-clients');
        select.innerHTML = '<option value="">Load...</option>' + library.clients.map((c, i) => {
            const shortName = c.split('\n')[0].substring(0, 20);
            return `<option value="${i}">${shortName}</option>`;
        }).join('');
    }

    // Advanced Client Database Panel Management
    const clientsModal = document.getElementById('clients-modal');
    document.getElementById('btn-manage-clients').addEventListener('click', () => {
        renderClientsDbList();
        clientsModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-clients').addEventListener('click', () => clientsModal.classList.add('hidden'));

    function renderClientsDbList() {
        const container = document.getElementById('clients-db-list');
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

    document.getElementById('clients-db-list').addEventListener('click', (e) => {
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
        document.getElementById('library-products').innerHTML = library.products.map(p => `<option value="${p.desc}">`).join('');
    }

    document.getElementById('btn-save-invoice').addEventListener('click', () => {
        const record = {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            docNumber: state.docNumber,
            clientInfo: state.clientDetails.split('\n')[0],
            total: calcTotals.total,
            currency: state.currency,
            status: state.status,
            stateSnapshot: JSON.stringify(state)
        };
        
        const existingIdx = library.history.findIndex(h => h.docNumber === state.docNumber);
        if(existingIdx > -1) library.history[existingIdx] = record;
        else library.history.unshift(record);
        
        saveLibrary();
        showToast("Invoice saved to Cloud & History.");
    });

    // Navigation Logic
    document.getElementById('nav-editor').addEventListener('click', (e) => {
        document.getElementById('view-editor').classList.remove('hidden');
        document.getElementById('view-dashboard').classList.add('hidden');
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600');
        document.getElementById('nav-dashboard').classList.remove('border-b-2', 'border-brand-600', 'text-brand-600');
    });

    document.getElementById('nav-dashboard').addEventListener('click', (e) => {
        document.getElementById('view-editor').classList.add('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');
        e.target.classList.add('border-b-2', 'border-brand-600', 'text-brand-600');
        document.getElementById('nav-editor').classList.remove('border-b-2', 'border-brand-600', 'text-brand-600');
        updateDashboard();
    });

    // Features Logic (Share, Email)
    const shareModal = document.getElementById('share-modal');
    document.getElementById('btn-share').addEventListener('click', () => shareModal.classList.remove('hidden'));
    document.getElementById('btn-close-share').addEventListener('click', () => shareModal.classList.add('hidden'));
    document.getElementById('btn-copy-link').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('share-link-input').value);
        showToast("Link copied to clipboard!");
    });

    document.getElementById('btn-email').addEventListener('click', () => {
        const subject = encodeURIComponent(`Invoice ${state.docNumber} from ${state.senderDetails.split('\n')[0]}`);
        const body = encodeURIComponent(`Please find the details for invoice ${state.docNumber} attached.\nTotal: ${formatMoney(calcTotals.total)}\nDue Date: ${state.dueDate}\n\nThank you for your business!`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    });

    const historyModal = document.getElementById('history-modal');
    document.getElementById('btn-history').addEventListener('click', () => {
        renderHistoryList();
        historyModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-history').addEventListener('click', () => historyModal.classList.add('hidden'));

    function renderHistoryList() {
        const list = document.getElementById('history-list');
        if(library.history.length === 0) {
            list.innerHTML = `<p class="text-sm text-slate-500 text-center py-6">No saved invoices yet.</p>`;
            return;
        }
        list.innerHTML = library.history.map(h => `
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

    document.getElementById('history-list').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if(!id) return;
        if(e.target.classList.contains('btn-load-history')) {
            const record = library.history.find(h => h.id === id);
            if(record) {
                state = JSON.parse(record.stateSnapshot);
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

    // Items Editor Listeners
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

    function renderItemsEditor() {
        itemsContainer.innerHTML = state.items.map(item => `
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-2 items-center">
                <input type="text" list="library-products" placeholder="Description" value="${item.desc}" data-id="${item.id}" data-field="desc" class="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <input type="number" min="1" step="1" value="${item.qty}" data-id="${item.id}" data-field="qty" class="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded text-center dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <input type="number" min="0" step="0.01" value="${item.price}" data-id="${item.id}" data-field="price" class="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded text-right dark:bg-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition hover:border-slate-400 dark:hover:border-slate-500">
                <div class="text-right text-xs font-semibold px-2 item-total text-slate-800 dark:text-slate-100">${formatMoney(item.qty * item.price)}</div>
                <button class="p-1.5 border border-slate-200 dark:border-slate-700 rounded hover:bg-rose-50 hover:border-rose-200 text-rose-500 dark:hover:bg-rose-950/30 del-item outline-none shadow-sm transition focus:ring-2 focus:ring-rose-500/20" data-id="${item.id}">
                    <svg class="w-3.5 h-3.5 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `).join('');
    }

    function renderPreview() {
        const previewEl = document.getElementById('doc-preview');
        previewEl.className = `a4-document bg-white text-slate-900 p-[20mm] min-h-[297mm] transition-all template-${state.template_id}`;
        
        const langDict = dict[state.lang];
        previewEl.setAttribute('dir', langDict.dir);
        
        const logoImg = document.getElementById('prev-logo');
        if (state.logoDataUrl) {
            logoImg.src = state.logoDataUrl;
            logoImg.classList.remove('hidden');
        } else {
            logoImg.src = '';
            logoImg.classList.add('hidden');
        }

        const typeKey = state.docType.toLowerCase();
        document.getElementById('prev-title').textContent = langDict[typeKey] || state.docType.toUpperCase();
        document.getElementById('prev-number-label').textContent = `# ${state.docNumber}`;
        document.getElementById('prev-date').textContent = state.date;
        document.getElementById('prev-due-date').textContent = state.dueDate;
        document.getElementById('prev-sender').textContent = state.senderDetails;
        document.getElementById('prev-client').textContent = state.clientDetails;
        document.getElementById('prev-payment-details').textContent = state.paymentDetails;
        
        document.getElementById('lbl-from').textContent = langDict.from;
        document.getElementById('lbl-to').textContent = langDict.to;
        document.getElementById('lbl-date').textContent = langDict.date;
        document.getElementById('lbl-due').textContent = langDict.due;
        document.getElementById('lbl-desc').textContent = langDict.desc;
        document.getElementById('lbl-qty').textContent = langDict.qty;
        document.getElementById('lbl-price').textContent = langDict.price;
        document.getElementById('lbl-total').textContent = langDict.total;
        document.getElementById('lbl-subtotal').textContent = langDict.subtotal;
        document.getElementById('lbl-discount').textContent = langDict.discount;
        document.getElementById('lbl-payment').textContent = langDict.payment;
        document.getElementById('lbl-grandtotal').textContent = langDict.gtotal;
        
        document.getElementById('lbl-payment').parentElement.style.display = state.paymentDetails ? 'block' : 'none';

        const sigContainer = document.getElementById('sig-container');
        const sigImg = document.getElementById('prev-sig');
        if(state.sigDataUrl) {
            sigImg.src = state.sigDataUrl;
            sigContainer.classList.remove('hidden');
        } else {
            sigContainer.classList.add('hidden');
        }

        const badge = document.getElementById('prev-status-badge');
        badge.textContent = state.status;
        badge.className = `inline-block mt-2 px-2 py-0.5 text-xs font-bold uppercase rounded ${state.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : state.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`;

        document.getElementById('prev-items-body').innerHTML = state.items.filter(i => i.desc || i.price > 0).map(item => `
            <tr class="border-b border-slate-100">
                <td class="py-2.5 font-medium text-slate-700">${item.desc}</td>
                <td class="py-2.5 text-center text-slate-500">${item.qty}</td>
                <td class="py-2.5 text-end text-slate-500">${formatMoney(item.price)}</td>
                <td class="py-2.5 text-end font-semibold text-slate-800">${formatMoney(item.qty * item.price)}</td>
            </tr>
        `).join('');

        calculate();
        document.getElementById('prev-subtotal').textContent = formatMoney(calcTotals.subtotal);
        document.getElementById('prev-discount').textContent = `-${formatMoney(calcTotals.discount)}`;
        document.getElementById('prev-discount-row').style.display = calcTotals.discount > 0 ? 'flex' : 'none';
        
        let taxLabel = state.region === 'USA' ? `${langDict.tax} (${getTaxRate()}%)` : state.region === 'UK' ? 'VAT (20%)' : state.region === 'CAN' ? 'GST (5%)' : 'GST (10%)';
        document.getElementById('prev-tax-label').textContent = taxLabel;
        document.getElementById('prev-tax').textContent = formatMoney(calcTotals.tax);
        document.getElementById('prev-total').textContent = formatMoney(calcTotals.total);

        // Render Notes & Terms dynamically into preview block matching values
        const notesContainer = document.getElementById('prev-notes-terms-container');
        const notesBox = document.getElementById('prev-notes-box');
        const notesContent = document.getElementById('prev-notes-content');
        const termsBox = document.getElementById('prev-terms-box');
        const termsContent = document.getElementById('prev-terms-content');

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

        // Update QR Code
        const qrContainer = document.getElementById('qr-code-container');
        if (state.generateQR && typeof QRCode !== 'undefined') {
            qrContainer.classList.remove('hidden');
            qrContainer.innerHTML = '';
            const paymentStr = `Pay Invoice ${state.docNumber} - Total: ${calcTotals.total} ${state.currency}`;
            new QRCode(qrContainer, { text: paymentStr, width: 80, height: 80, colorDark: "#0f172a", colorLight: "#ffffff" });
        } else {
            qrContainer.classList.add('hidden');
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

        document.getElementById('dash-revenue').textContent = formatMoney(totalRev);
        document.getElementById('dash-count').textContent = count;
        document.getElementById('dash-paid').textContent = paid;
        document.getElementById('dash-unpaid').textContent = unpaid;

        // Charts Logic
        if(typeof Chart !== 'undefined') {
            const ctxRev = document.getElementById('revenueChart').getContext('2d');
            if(chartsInstance.revenue) chartsInstance.revenue.destroy();
            chartsInstance.revenue = new Chart(ctxRev, {
                type: 'line',
                data: {
                    labels: Object.keys(monthlyData).reverse(),
                    datasets: [{ label: 'Revenue', data: Object.values(monthlyData).reverse(), borderColor: '#4f46e5', tension: 0.4, fill: true, backgroundColor: 'rgba(79, 70, 229, 0.1)' }]
                },
                options: { responsive: true, plugins: { legend: { display: false } } }
            });

            const ctxStat = document.getElementById('statusChart').getContext('2d');
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

    document.getElementById('btn-lang-toggle').addEventListener('click', (e) => {
        state.lang = state.lang === 'en' ? 'ur' : 'en';
        e.target.textContent = state.lang.toUpperCase();
        saveState();
        renderPreview();
    });

    document.getElementById('logo-upload').addEventListener('change', function(e) {
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

    document.getElementById('sig-upload').addEventListener('change', function(e) {
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

    document.getElementById('toggle-qr').addEventListener('change', e => {
        state.generateQR = e.target.checked;
        saveState();
        renderPreview();
    });

    ['doc-type', 'currency', 'region', 'doc-template', 'discount-type', 'doc-status'].forEach(id => {
        document.getElementById(id).addEventListener('change', e => { 
            const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (id === 'doc-template') state.template_id = e.target.value;
            else state[key] = e.target.value;
            
            if(id === 'region') document.getElementById('tax-input-container').style.display = state.region === 'USA' ? 'flex' : 'none';
            
            saveState();
            if(id === 'currency') renderItemsEditor(); 
            renderPreview();
        });
    });

    ['doc-number', 'doc-date', 'doc-due-date', 'sender-details', 'client-details', 'payment-details', 'discount-value', 'tax-rate-manual', 'invoice-notes', 'invoice-terms'].forEach(id => {
        document.getElementById(id).addEventListener('input', e => {
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

    document.getElementById('btn-add-item').addEventListener('click', () => {
        state.items.push({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 });
        saveState();
        renderItemsEditor(); 
        renderPreview();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if(confirm("Are you sure you want to clear current input data? (Library and history are kept)")) {
            localStorage.removeItem('invoiceStatePro');
            state = { ...defaultState, items: [{ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 }], lang: state.lang };
            syncDOMWithState();
            renderItemsEditor();
            renderPreview();
            showToast("Workspace cleared.");
        }
    });

    const btnPdf = document.getElementById('btn-pdf');
    btnPdf.addEventListener('click', async () => {
        const element = document.getElementById('doc-preview');
        btnPdf.classList.add('is-loading');
        showToast("Compiling PDF asynchronously...");

        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

        const options = {
            margin: 0,
            filename: `${state.docNumber || 'Invoice'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        try {
            await html2pdf().set(options).from(element).save();
            showToast("Export completed successfully.");
        } catch (error) {
            showToast("Error generating PDF.");
            console.error(error);
        } finally {
            btnPdf.classList.remove('is-loading');
        }
    });

    document.getElementById('btn-dark-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
    });

    renderItemsEditor();
    renderPreview();
});
