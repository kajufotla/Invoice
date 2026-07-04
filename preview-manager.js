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
                  
                // Inject floating print button   
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
      
    const logoImg = document.getElementById('prev-logo');  
    if(logoImg) {  
        if (store.state.logoDataUrl) {  
            logoImg.src = store.state.logoDataUrl;  
            logoImg.classList.remove('hidden');  
        } else {  
            logoImg.src = '';  
            logoImg.classList.add('hidden');  
        }  
    }  

    if(document.getElementById('prev-company-name')) {  
        document.getElementById('prev-company-name').textContent = store.state.companyName || '';  
    }  

    const typeKey = store.state.docType ? store.state.docType.toLowerCase() : 'invoice';  
    if(document.getElementById('prev-title')) {
        document.getElementById('prev-title').textContent = langDict[typeKey] || (store.state.docType ? store.state.docType.toUpperCase() : 'INVOICE');  
    }
    if(document.getElementById('prev-number-label')) {
        document.getElementById('prev-number-label').textContent = `# ${store.state.docNumber || ''}`;  
    }
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

        if (companyName) {  
            if (lines.length > 0 && lines[0].trim() === companyName.trim()) {  
                lines.shift();  
            }  
        } else {  
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
      
    let finalPaymentDetails = store.state.paymentDetails || '';  
    if(store.state.paymentLinks) {  
        const pl = store.state.paymentLinks;  
        const linkArr = [];  
        if(pl.stripe) linkArr.push(`Stripe: ${pl.stripe}`);  
        if(pl.paypal) linkArr.push(`PayPal: ${pl.paypal}`);  
        if(pl.wise) linkArr.push(`Wise: ${pl.wise}`);  
        if(pl.bank) linkArr.push(`Bank Transfer:\n${pl.bank}`);  
          
        if(linkArr.length > 0) {  
            finalPaymentDetails += (finalPaymentDetails ? '\n\n' : '') + linkArr.join('\n');  
        }  
    }  
    if(document.getElementById('prev-payment-details')) {
        document.getElementById('prev-payment-details').textContent = finalPaymentDetails;  
    }
      
    const setLbl = (id, text) => { if(document.getElementById(id)) document.getElementById(id).textContent = text; };  
    setLbl('lbl-from', langDict.from || 'From');  
    setLbl('lbl-to', langDict.to || 'To');  
    setLbl('lbl-date', langDict.date || 'Date');  
    setLbl('lbl-due', langDict.due || 'Due Date');  
    setLbl('lbl-desc', langDict.desc || 'Description');  
    setLbl('lbl-qty', langDict.qty || 'Qty');  
    setLbl('lbl-price', langDict.price || 'Price');  
    setLbl('lbl-total', langDict.total || 'Total');  
    setLbl('lbl-subtotal', langDict.subtotal || 'Subtotal');  
    setLbl('lbl-discount', langDict.discount || 'Discount');  
    setLbl('lbl-payment', langDict.payment || 'Payment Details');  
    setLbl('lbl-grandtotal', langDict.gtotal || 'Grand Total');  
      
    const lblPayment = document.getElementById('lbl-payment');  
    if(lblPayment && lblPayment.parentElement) lblPayment.parentElement.style.display = finalPaymentDetails ? 'block' : 'none';  

    const sigContainer = document.getElementById('sig-container');  
    const sigImg = document.getElementById('prev-sig');  
    if(sigContainer && sigImg) {  
        if(store.state.sigDataUrl) {  
            sigImg.src = store.state.sigDataUrl;  
            sigContainer.classList.remove('hidden');  
        } else {  
            sigContainer.classList.add('hidden');  
        }  
    }  

    const badge = document.getElementById('prev-status-badge');  
    if(badge && store.state.status) {  
        badge.textContent = store.state.status;  
        badge.className = `inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md border ${  
            store.state.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :   
            store.state.status === 'Unpaid' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :   
            'bg-amber-50 text-amber-700 border-amber-200/60'  
        }`;  
    }  

    if(document.getElementById('prev-items-body') && store.state.items) {  
        document.getElementById('prev-items-body').innerHTML = store.state.items.filter(i => i.desc || i.price > 0).map(item => `  
            <tr class="avoid-break hover:bg-slate-50/50 transition-colors">  
                <td class="py-4 px-5 text-slate-800 break-words whitespace-pre-wrap">${item.desc || ''}</td>  
                <td class="py-4 px-5 text-center text-slate-500">${item.qty || 0}</td>  
                <td class="py-4 px-5 text-right text-slate-500 whitespace-nowrap">${formatMoney(item.price || 0)}</td>  
                <td class="py-4 px-5 text-right font-medium text-slate-900 whitespace-nowrap">${formatMoney((item.qty || 0) * (item.price || 0))}</td>  
            </tr>  
        `).join('');  
    }  

    calculate();  
    if(document.getElementById('prev-subtotal') && store.calcTotals) {
        document.getElementById('prev-subtotal').textContent = formatMoney(store.calcTotals.subtotal || 0);  
    }
    if(document.getElementById('prev-discount') && store.calcTotals) {
        document.getElementById('prev-discount').textContent = `-${formatMoney(store.calcTotals.discount || 0)}`;  
    }
    if(document.getElementById('prev-discount-row') && store.calcTotals) {
        document.getElementById('prev-discount-row').style.display = (store.calcTotals.discount > 0) ? 'flex' : 'none';  
    }
      
    let taxLabel = store.state.region === 'USA' ? `${langDict.tax || 'Tax'} (${getTaxRate()}%)` : store.state.region === 'UK' ? 'VAT (20%)' : store.state.region === 'CAN' ? 'GST (5%)' : 'GST (10%)';  
    if(document.getElementById('prev-tax-label')) document.getElementById('prev-tax-label').textContent = taxLabel;  
    if(document.getElementById('prev-tax') && store.calcTotals) document.getElementById('prev-tax').textContent = formatMoney(store.calcTotals.tax || 0);  
    if(document.getElementById('prev-total') && store.calcTotals) document.getElementById('prev-total').textContent = formatMoney(store.calcTotals.total || 0);  

    const notesContainer = document.getElementById('prev-notes-terms-container');  
    const notesBox = document.getElementById('prev-notes-box');  
    const notesContent = document.getElementById('prev-notes-content');  
    const termsBox = document.getElementById('prev-terms-box');  
    const termsContent = document.getElementById('prev-terms-content');  

    if(notesContainer) {  
        if ((store.state.notes && store.state.notes.trim()) || (store.state.terms && store.state.terms.trim())) {  
            notesContainer.classList.remove('hidden');  
            if (store.state.notes && store.state.notes.trim()) {  
                if(notesBox) notesBox.classList.remove('hidden');  
                if(notesContent) notesContent.textContent = store.state.notes;  
            } else {  
                if(notesBox) notesBox.classList.add('hidden');  
            }  
            if (store.state.terms && store.state.terms.trim()) {  
                if(termsBox) termsBox.classList.remove('hidden');  
                if(termsContent) termsContent.textContent = store.state.terms;  
            } else {  
                if(termsBox) termsBox.classList.add('hidden');  
            }  
        } else {  
            notesContainer.classList.add('hidden');  
        }  
    }  

    const qrContainer = document.getElementById('qr-code-container');  
    if(qrContainer) {  
        if (store.state.showQR && store.state.uploadedQrDataUrl) {  
            qrContainer.classList.remove('hidden');  
            qrContainer.innerHTML = `<img src="${store.state.uploadedQrDataUrl}" class="rounded-lg border border-slate-200 p-1.5 shadow-sm" style="max-width: 100px; max-height: 100px; object-fit: contain; margin-top: 12px;" />`;  
        } else {  
            qrContainer.classList.add('hidden');  
        }  
    }
}

export function setupPreviewAndExportListeners() {
    // Share feature
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

    document.getElementById('btn-email')?.addEventListener('click', () => {  
        const validation = validateInvoice();  
        if (validation !== true) return showToast(validation);  

        if (!store.state.id) store.state.id = crypto.randomUUID();  

        const shareLink = `${window.location.origin}${window.location.pathname}?invoice=${store.state.id}`;  
        const subject = encodeURIComponent(`Invoice ${store.state.docNumber || ''} from ${store.state.companyName || (store.state.senderDetails ? store.state.senderDetails.split('\n')[0] : '')}`);  
        const body = encodeURIComponent(`Hello,\n\nPlease find the details for invoice ${store.state.docNumber || ''} below.\n\nTotal: ${store.calcTotals ? formatMoney(store.calcTotals.total) : ''}\nDue Date: ${store.state.dueDate || 'N/A'}\n\nView or download your invoice here:\n${shareLink}\n\nThank you for your business!`);  
        window.location.href = `mailto:?subject=${subject}&body=${body}`;  
        showToast("Opening Email client...");  
    });  

    // Print functionality  
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

    // Logo & Signature Uploads  
    document.getElementById('logo-upload')?.addEventListener('change', function(e) {  
        const file = e.target.files[0];  
        if (file) {  
            const reader = new FileReader();  
            reader.onload = function(event) {  
                store.state.logoDataUrl = event.target.result;  
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
                store.state.sigDataUrl = event.target.result;  
                saveState();  
                renderPreview();  
            }  
            reader.readAsDataURL(file);  
        }  
    });  

    // QR Code  
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
                store.state.uploadedQrDataUrl = event.target.result;  
                store.state.showQR = true;   
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
                if (store.state.uploadedQrDataUrl && store.state.showQR) {  
                    store.state.showQR = false;  
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

    // PDF Generation  
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
