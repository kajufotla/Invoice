import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { dict, defaultState } from "./config-data.js";
import { store, calculate, formatMoney, getTaxRate, validateInvoice, saveState } from "./invoice-manager.js";

let showToast = (msg) => alert(msg); // Fallback until initialized

export function initPreviewManager(toastFn) {
    if (toastFn) showToast = toastFn;
}

export async function checkPublicInvoice() {
    const urlParams = new URLSearchParams(window.location.search);
    const publicInvoiceId = urlParams.get('invoice');
    if (publicInvoiceId) {
        try {
            const docRef = doc(window.firebaseDb, "public_invoices", publicInvoiceId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const publicData = docSnap.data();
                document.body.innerHTML = '';
                document.body.className = 'bg-slate-50 flex justify-center py-12 font-sans antialiased text-slate-800';

                // Inject specific print and page-break styles for premium multi-page support  
                const styleEl = document.createElement('style');  
                styleEl.innerHTML = `  
                    @media print {  
                        body { background: white !important; padding: 0 !important; }  
                        #doc-preview { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 10mm !important; max-width: 100% !important; }  
                        .no-print { display: none !important; }  
                        .avoid-break { page-break-inside: avoid; break-inside: avoid; }  
                    }  
                    .avoid-break { page-break-inside: avoid; break-inside: avoid; }  
                `;  
                document.head.appendChild(styleEl);  

                const previewEl = document.createElement('div');  
                previewEl.id = 'doc-preview';  
                previewEl.className = 'a4-document bg-white w-full max-w-[800px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 sm:rounded-lg overflow-hidden';  
                document.body.appendChild(previewEl);  

                // Assign to store for rendering  
                store.state = { ...defaultState, ...JSON.parse(publicData.stateSnapshot) };  
                  
                // Construct premium UI structure (SaaS standard layout)  
                previewEl.innerHTML = `  
                    <div class="px-10 py-12 sm:px-14 sm:py-16">  
                        <div class="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 avoid-break">  
                            <div class="flex flex-col gap-5 max-w-[50%]">  
                                <img id="prev-logo" class="${store.state.logoDataUrl ? '' : 'hidden'} object-contain" src="${store.state.logoDataUrl || ''}" style="max-height: 72px;">  
                                <div id="prev-company-name" class="text-xl font-bold text-slate-900 tracking-tight break-words">${store.state.companyName || ''}</div>  
                            </div>  
                            <div class="text-right flex flex-col gap-2 md:items-end">  
                                <h2 id="prev-title" class="text-3xl font-normal tracking-tight text-slate-400 uppercase mb-1">${store.state.docType ? store.state.docType.toUpperCase() : ''}</h2>  
                                <p class="text-base font-semibold text-slate-800"><span id="prev-number-label"># ${store.state.docNumber || ''}</span></p>  
                                <div id="prev-status-badge" class="mt-1"></div>  
                            </div>  
                        </div>  

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 avoid-break border-t border-slate-100 pt-10">  
                            <div>  
                                <p id="lbl-from" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"></p>  
                                <div id="prev-sender" class="text-sm text-slate-700 leading-relaxed break-words"></div>  
                            </div>  
                            <div class="md:text-right">  
                                <p id="lbl-to" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3"></p>  
                                <div id="prev-client" class="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words">${store.state.clientDetails || ''}</div>  
                                  
                                <div class="inline-flex flex-col gap-2 text-sm mt-6">  
                                    <div class="flex justify-between md:justify-end items-center gap-6">  
                                        <span id="lbl-date" class="text-slate-500 font-medium text-[12px]"></span>  
                                        <span id="prev-date" class="font-semibold text-slate-800 text-right w-24">${store.state.date || ''}</span>  
                                    </div>  
                                    <div class="flex justify-between md:justify-end items-center gap-6">  
                                        <span id="lbl-due" class="text-slate-500 font-medium text-[12px]"></span>  
                                        <span id="prev-due-date" class="font-semibold text-slate-800 text-right w-24">${store.state.dueDate || ''}</span>  
                                    </div>  
                                </div>  
                            </div>  
                        </div>  

                        <div class="mb-12 border border-slate-200 rounded-lg overflow-hidden">  
                            <table class="w-full text-sm text-left">  
                                <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 avoid-break">  
                                    <tr>  
                                        <th id="lbl-desc" class="py-3 px-5 font-semibold text-xs text-slate-500 uppercase tracking-wider"></th>  
                                        <th id="lbl-qty" class="py-3 px-5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-center w-24"></th>  
                                        <th id="lbl-price" class="py-3 px-5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-32"></th>  
                                        <th id="lbl-total" class="py-3 px-5 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right w-32"></th>  
                                    </tr>  
                                </thead>  
                                <tbody id="prev-items-body" class="divide-y divide-slate-100"></tbody>  
                            </table>  
                        </div>  

                        <div class="flex flex-col md:flex-row justify-between items-start gap-12 mb-12 avoid-break">  
                            <div class="w-full md:w-[55%] space-y-8">  
                                <div id="prev-notes-terms-container" class="hidden space-y-6">  
                                    <div id="prev-notes-box" class="hidden">  
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>  
                                        <p id="prev-notes-content" class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed break-words"></p>  
                                    </div>  
                                    <div id="prev-terms-box" class="hidden">  
                                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Terms</p>  
                                        <p id="prev-terms-content" class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed break-words"></p>  
                                    </div>  
                                </div>  
                                  
                                <div>  
                                    <p id="lbl-payment" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"></p>  
                                    <p id="prev-payment-details" class="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed break-words"></p>  
                                    <div id="qr-code-container" class="mt-4"></div>  
                                </div>  
                            </div>  

                            <div class="w-full md:w-[40%] bg-slate-50 rounded-lg p-6 border border-slate-100">  
                                <div class="flex justify-between items-center mb-3 text-sm">  
                                    <span id="lbl-subtotal" class="text-slate-500"></span>  
                                    <span id="prev-subtotal" class="font-medium text-slate-800"></span>  
                                </div>  
                                <div id="prev-discount-row" class="flex justify-between items-center mb-3 text-sm text-emerald-600 hidden">  
                                    <span id="lbl-discount"></span>  
                                    <span id="prev-discount" class="font-medium"></span>  
                                </div>  
                                <div class="flex justify-between items-center mb-5 text-sm">  
                                    <span id="prev-tax-label" class="text-slate-500"></span>  
                                    <span id="prev-tax" class="font-medium text-slate-800"></span>  
                                </div>  
                                <div class="flex justify-between items-center pt-4 border-t border-slate-200">  
                                    <span id="lbl-grandtotal" class="text-sm font-semibold text-slate-900"></span>  
                                    <span id="prev-total" class="font-bold text-xl text-slate-900 tracking-tight"></span>  
                                </div>  
                                </div>  
                            </div>  

                        <div id="sig-container" class="mt-16 flex flex-col items-end hidden avoid-break">  
                            <div class="w-48 text-center">  
                                <img id="prev-sig" class="max-h-16 object-contain mx-auto mb-3">  
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-3">Authorized Signature</p>  
                            </div>  
                        </div>  
                    </div>  
                `;  
                renderPreview();   
                  
                const floatBtn = document.createElement('button');  
                floatBtn.innerText = 'Print / Save PDF';  
                floatBtn.className = 'no-print print:hidden fixed bottom-8 right-8 bg-slate-900 text-white px-8 py-3 rounded-full shadow-lg font-medium tracking-wide hover:bg-slate-800 hover:-translate-y-0.5 transform transition-all duration-200 ring-4 ring-slate-900/10';  
                floatBtn.onclick = () => window.print();  
                document.body.appendChild(floatBtn);  
                  
                return true;   
            }  
        } catch (error) {  
            console.error("Error loading public invoice", error);  
        }  
    }  
    return false;
}

export function renderPreview() {
    const previewEl = document.getElementById('doc-preview');
    if(!previewEl) return;

    const langDict = dict[store.state.lang] || dict['en'];  
    previewEl.setAttribute('dir', langDict.dir || 'ltr');  
      
    // 1. HEADER & LOGO SECTION
    try {
        const logoImg = document.getElementById('prev-logo');  
        if(logoImg) {  
            let logoPlaceholder = document.getElementById('placeholder-logo');

            if (store.state.logoDataUrl) {  
                logoImg.src = store.state.logoDataUrl;  
                logoImg.classList.remove('hidden');  
                if(logoPlaceholder) logoPlaceholder.classList.add('hidden');
            } else {  
                logoImg.src = '';  
                logoImg.classList.add('hidden');  
                if(logoPlaceholder) logoPlaceholder.classList.remove('hidden');
            }  
        }  

        if(document.getElementById('prev-company-name')) {  
            document.getElementById('prev-company-name').textContent = store.state.companyName || '';  
        }  
        
        // NEW: Render Company Tax ID dynamically
        const prevCompTaxId = document.getElementById('prev-company-tax-id');
        if(prevCompTaxId) {
            if(store.state.companyTaxId && store.state.companyTaxId.trim() !== '') {
                prevCompTaxId.textContent = store.state.companyTaxId;
                prevCompTaxId.classList.remove('hidden');
            } else {
                prevCompTaxId.classList.add('hidden');
            }
        }

        const typeKey = store.state.docType ? store.state.docType.toLowerCase() : 'invoice';  
        if(document.getElementById('prev-title')) {
            document.getElementById('prev-title').textContent = langDict[typeKey] || (store.state.docType ? store.state.docType.toUpperCase() : 'INVOICE');  
        }
        if(document.getElementById('prev-number-label')) {
            document.getElementById('prev-number-label').textContent = `# ${store.state.docNumber || ''}`;  
        }
    } catch(e) { console.warn("Header preview error:", e); }

    // 2. DATES & CLIENT SECTION
    try {
        if(document.getElementById('prev-date')) {
            document.getElementById('prev-date').textContent = store.state.date || '';  
        }
          
        const prevDueDate = document.getElementById('prev-due-date');  
        const dueDateLblContainer = document.getElementById('lbl-due')?.parentElement;  
        if (store.state.dueDate) {  
            if(prevDueDate) prevDueDate.textContent = store.state.dueDate;  
            if(dueDateLblContainer) dueDateLblContainer.style.display = '';  
        } else {  
            if(prevDueDate) prevDueDate.textContent = '';  
            if(dueDateLblContainer) dueDateLblContainer.style.display = 'none';  
        }  

        if(document.getElementById('prev-sender')) {  
            const lines = (store.state.senderDetails || '').split('\n');  
            let companyName = store.state.companyName;  

            if (companyName && lines.length > 0 && lines[0].trim() === companyName.trim()) {  
                lines.shift();  
            } else if (!companyName) {  
                companyName = lines.shift() || '';  
            }  

            const addressRemainder = lines.join('<br>');  
            document.getElementById('prev-sender').innerHTML = companyName   
                ? `<strong class="text-[15px] font-bold text-slate-900 block mb-1">${companyName}</strong>${addressRemainder}`   
                : addressRemainder;  
        }  
          
        if(document.getElementById('prev-client')) {
            document.getElementById('prev-client').textContent = store.state.clientDetails || '';  
        }
        
        // NEW: Render Client Tax ID dynamically
        const prevClientTaxId = document.getElementById('prev-client-tax-id');
        if(prevClientTaxId) {
            if(store.state.clientTaxId && store.state.clientTaxId.trim() !== '') {
                prevClientTaxId.textContent = store.state.clientTaxId;
                prevClientTaxId.classList.remove('hidden');
            } else {
                prevClientTaxId.classList.add('hidden');
            }
        }
    } catch(e) { console.warn("Client details preview error:", e); }

    // 3. LABELS & BADGES
    try {
        const setLbl = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };  
        setLbl('lbl-from', langDict.from || 'FROM:');  
        setLbl('lbl-to', langDict.to || 'BILL TO:');  
        setLbl('lbl-date', langDict.date || 'Invoice Date:');  
        setLbl('lbl-due', langDict.due || 'Due Date:');  
        setLbl('lbl-desc', langDict.desc || 'DESCRIPTION');  
        setLbl('lbl-qty', langDict.qty || 'QTY');  
        setLbl('lbl-price', langDict.price || 'UNIT PRICE');  
        setLbl('lbl-total', langDict.total || 'AMOUNT');  
        setLbl('lbl-subtotal', langDict.subtotal || 'SUBTOTAL');  
        setLbl('lbl-discount', langDict.discount || 'DISCOUNT');  
        setLbl('lbl-grandtotal', langDict.gtotal || 'TOTAL');  
    } catch(e) { console.warn("Labels preview error:", e); }

    // 4. ITEMS & AMOUNTS CALCULATIONS
    try {
        if(document.getElementById('prev-items-body') && store.state.items) {  
            document.getElementById('prev-items-body').innerHTML = store.state.items.filter(i => i.desc || Number(i.price) > 0).map(item => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                const total = qty * price;
                
                return `  
                <tr class="avoid-break hover:bg-slate-50/50 transition-colors border-b border-slate-200">  
                    <td class="py-4 px-4 font-bold text-slate-800 break-words whitespace-pre-wrap">${item.desc || ''}</td>  
                    <td class="py-4 px-4 text-center font-medium">${qty}</td>  
                    <td class="py-4 px-4 text-right font-medium whitespace-nowrap">${formatMoney(price)}</td>  
                    <td class="py-4 px-4 text-right font-bold text-slate-900 whitespace-nowrap">${formatMoney(total)}</td>  
                </tr>  
                `;
            }).join('');  
        }  

        if(typeof calculate === 'function') calculate();  
        if(!store.calcTotals) store.calcTotals = { subtotal: 0, discount: 0, tax: 0, total: 0 };

        if(document.getElementById('prev-subtotal')) {
            document.getElementById('prev-subtotal').textContent = formatMoney(store.calcTotals.subtotal || 0);  
        }
        if(document.getElementById('prev-discount')) {
            document.getElementById('prev-discount').textContent = `-${formatMoney(store.calcTotals.discount || 0)}`;  
        }
        if(document.getElementById('prev-discount-row')) {
            document.getElementById('prev-discount-row').style.display = ((store.calcTotals.discount || 0) > 0) ? 'flex' : 'none';  
        }
          
        // NEW: Flexible Tax Label rendering
        let taxLabelName = store.state.taxName || 'TAX';
        let taxLabelText = `${taxLabelName} (${getTaxRate()}%)`; 
        if(document.getElementById('prev-tax-label')) document.getElementById('prev-tax-label').textContent = taxLabelText;  
        if(document.getElementById('prev-tax')) document.getElementById('prev-tax').textContent = formatMoney(store.calcTotals.tax || 0);  
        if(document.getElementById('prev-total-amount')) document.getElementById('prev-total-amount').textContent = formatMoney(store.calcTotals.total || 0);  
        if(document.getElementById('prev-total')) document.getElementById('prev-total').textContent = formatMoney(store.calcTotals.total || 0); // For public view fallback
    } catch(e) { console.warn("Items and amounts calculation error:", e); }

    // 5. FOOTER, NOTES, PAYMENT LINK & SIGNATURE
    try {
        // NEW: Payment Link Toggle Logic
        const linkContainer = document.getElementById('prev-payment-link-container');
        const prevPaymentLink = document.getElementById('prev-payment-link');
        
        if (store.state.paymentLink && store.state.paymentLink.trim() !== '') {
            if(linkContainer) linkContainer.classList.remove('hidden');
            if(prevPaymentLink) {
                prevPaymentLink.href = store.state.paymentLink;
                prevPaymentLink.textContent = store.state.paymentLink;
            }
        } else {
            if(linkContainer) linkContainer.classList.add('hidden');
        }

        const notesContent = document.getElementById('prev-notes-content');  
        const termsContent = document.getElementById('prev-terms-content');  

        if(notesContent) notesContent.textContent = store.state.notes || '';
        if(termsContent) termsContent.textContent = store.state.terms || '';

        const sigImg = document.getElementById('prev-sig');  
        const sigPlaceholder = document.getElementById('prev-sig-placeholder-line');
        if(sigImg) {  
            if(store.state.sigDataUrl) {  
                sigImg.src = store.state.sigDataUrl;  
                sigImg.classList.remove('hidden');  
                if(sigPlaceholder) sigPlaceholder.classList.add('hidden');
            } else {  
                sigImg.src = '';  
                sigImg.classList.add('hidden');  
                if(sigPlaceholder) sigPlaceholder.classList.remove('hidden');
            }  
        }
    } catch(e) { console.warn("Footer preview error:", e); }
}

export function setupPreviewAndExportListeners() {
    
    // --- COMPREHENSIVE LIVE SYNC FOR ALL INPUTS ---
    const syncFieldsMap = {
        'notes': 'invoice-notes',
        'terms': 'invoice-terms',
        'clientDetails': 'client-details',
        'senderDetails': 'sender-details',
        'companyName': 'prof-company-name',
        'docNumber': 'doc-number',
        'companyTaxId': 'prof-company-tax-id', // New
        'clientTaxId': 'client-tax-id', // New
        'paymentLink': 'payment-link-input', // New
        'taxName': 'tax-name-input' // New
    };

    Object.keys(syncFieldsMap).forEach(stateKey => {
        const inputId = syncFieldsMap[stateKey];
        const el = document.getElementById(inputId);
        if(el) {
            el.addEventListener('input', (e) => {
                store.state[stateKey] = e.target.value;
                renderPreview(); // Instantly update preview on typing
            });
        }
    });

    // --- SMART LOCAL STORAGE LOGIC FOR DROPDOWNS (100% Client-Side) ---
    const initDropdown = (dropdownId, storageKey, inputId) => {
        const dropdown = document.getElementById(dropdownId);
        const input = document.getElementById(inputId);
        if(!dropdown || !input) return null;

        const loadOptions = () => {
            const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if(items.length > 0) {
                dropdown.innerHTML = `<option value="">Load Saved...</option>` + items.map(i => `<option value="${i}">${i.substring(0, 25)}...</option>`).join('');
                dropdown.classList.remove('hidden');
            } else {
                dropdown.classList.add('hidden');
            }
        };

        loadOptions();

        dropdown.addEventListener('change', (e) => {
            if(e.target.value) {
                input.value = e.target.value;
                input.dispatchEvent(new Event('input')); // Trigger sync
                e.target.value = ''; 
            }
        });

        return { loadOptions };
    };

    // Initialize Dropdowns
    const senderDrop = initDropdown('saved-senders-dropdown', 'inv_saved_senders', 'sender-details');
    const clientDrop = initDropdown('saved-clients-dropdown', 'inv_saved_clients', 'client-details');
    const termsDrop = initDropdown('saved-terms-dropdown', 'inv_saved_terms', 'invoice-terms');

    // Hook into the Save to Local Button to save preferences offline
    document.getElementById('btn-save-invoice')?.addEventListener('click', () => {
        if(typeof saveState === 'function') saveState(); // Main state save

        const saveToDropdown = (key, val) => {
            if(!val || !val.trim()) return;
            let items = JSON.parse(localStorage.getItem(key) || '[]');
            if(!items.includes(val)) {
                items.unshift(val); 
                if(items.length > 10) items.pop(); // Keep only last 10 entries to avoid bloat
                localStorage.setItem(key, JSON.stringify(items));
            }
        };

        saveToDropdown('inv_saved_senders', document.getElementById('sender-details')?.value);
        saveToDropdown('inv_saved_clients', document.getElementById('client-details')?.value);
        saveToDropdown('inv_saved_terms', document.getElementById('invoice-terms')?.value);

        // Refresh dropdowns dynamically
        if(senderDrop) senderDrop.loadOptions();
        if(clientDrop) clientDrop.loadOptions();
        if(termsDrop) termsDrop.loadOptions();

        showToast("Invoice and Data Saved Locally!");
    });

    // Share feature (Kept unchanged)
    const shareModal = document.getElementById('share-modal');
    document.getElementById('btn-share')?.addEventListener('click', async () => {
        const validation = validateInvoice();
        if (validation !== true) return showToast(validation);

        if (!store.state.id) store.state.id = crypto.randomUUID();  
              
        const shareLink = `${window.location.origin}${window.location.pathname}?invoice=${store.state.id}`;  
        const shareLinkInput = document.getElementById('share-link-input');
        if (shareLinkInput) shareLinkInput.value = shareLink;  

        if (navigator.share) {  
            try {  
                await navigator.share({  
                    title: `Invoice ${store.state.docNumber || ''}`,  
                    text: `Please find the details for invoice ${store.state.docNumber || ''} from ${store.state.companyName || (store.state.senderDetails ? store.state.senderDetails.split('\n')[0] : '')}.\nTotal: ${store.calcTotals ? formatMoney(store.calcTotals.total) : ''}`,  
                    url: shareLink  
                });  
                showToast("Shared successfully.");  
            } catch (err) {  
                if(shareModal) shareModal.classList.remove('hidden');  
            }  
        } else {  
            if(shareModal) shareModal.classList.remove('hidden');  
        }  
    });  

    document.getElementById('btn-close-share')?.addEventListener('click', () => {
        if(shareModal) shareModal.classList.add('hidden');
    });  
    
    document.getElementById('btn-copy-link')?.addEventListener('click', () => {  
        const linkInput = document.getElementById('share-link-input');  
        if(linkInput) {  
            navigator.clipboard.writeText(linkInput.value);  
            showToast("Link copied to clipboard!");  
        }  
    });  

    // Print functionality  
    const btnPrintMode = document.getElementById('btn-print-mode');  
    if (btnPrintMode) {  
        btnPrintMode.addEventListener('click', () => {  
            window.print();  
        });  
    }  

    // Logo Upload Fix (Ensuring correct rendering)
    document.getElementById('logo-upload')?.addEventListener('change', function(e) {  
        const file = e.target.files[0];  
        if (file) {  
            if (file.size > 500 * 1024) { 
                showToast("Image is too large. Please upload under 500KB.");
                e.target.value = '';
                return;
            }
            const reader = new FileReader();  
            reader.onload = function(event) {  
                store.state.logoDataUrl = event.target.result;  
                if(typeof saveState === 'function') saveState();  
                renderPreview();  
            }  
            reader.readAsDataURL(file);  
        }  
    });  

    // Signature Upload Fix (Ensuring correct rendering)
    document.getElementById('sig-upload')?.addEventListener('change', function(e) {  
        const file = e.target.files[0];  
        if (file) {  
            if (file.size > 500 * 1024) { 
                showToast("Signature image is too large. Please upload under 500KB.");
                e.target.value = '';
                return;
            }
            const reader = new FileReader();  
            reader.onload = function(event) {  
                store.state.sigDataUrl = event.target.result;  
                if(typeof saveState === 'function') saveState();  
                renderPreview();  
            }  
            reader.readAsDataURL(file);  
        }  
    });  

    // PDF Generation Fix (Export) 
    const btnPdf = document.getElementById('btn-pdf');  
    if(btnPdf) {  
        btnPdf.addEventListener('click', async () => {  
            const validation = validateInvoice();  
            if (validation !== true) return showToast(validation);  
              
            const element = document.getElementById('doc-preview');  
            if(!element) return;
            
            btnPdf.classList.add('is-loading');  
            showToast("Compiling PDF asynchronously...");  

            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));  

            const originalWidth = element.style.width;  
            element.style.width = '800px'; 

            const options = {  
                margin: [10, 10, 10, 10],   
                filename: `${store.state.docNumber || 'Invoice'}.pdf`,  
                image: { type: 'jpeg', quality: 1.0 },   
                html2canvas: {   
                    scale: 3, 
                    useCORS: true,   
                    letterRendering: true,  
                    width: 800,  
                    windowWidth: 800,  
                    scrollY: 0,  
                    logging: false  
                },  
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },  
                pagebreak: { mode: 'css', avoid: '.avoid-break' } 
            };  
              
            try {  
                await html2pdf().set(options).from(element).save();  
                showToast("Export completed successfully.");  
            } catch (error) {  
                showToast("Error generating PDF.");  
                console.error(error);  
            } finally {  
                element.style.width = originalWidth;  
                btnPdf.classList.remove('is-loading');  
            }  
        });  
    }
}
