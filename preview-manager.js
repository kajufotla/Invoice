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
                document.body.className = 'bg-slate-100 flex justify-center py-10';
                
                const previewEl = document.createElement('div');
                previewEl.id = 'doc-preview';
                previewEl.className = 'a4-document bg-white text-slate-900 shadow-xl';
                document.body.appendChild(previewEl);

                // Assign to store for rendering
                store.state = { ...defaultState, ...JSON.parse(publicData.stateSnapshot) };
                
                // Construct structure
                previewEl.innerHTML = `
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <img id="prev-logo" class="${store.state.logoDataUrl ? '' : 'hidden'}" src="${store.state.logoDataUrl || ''}" style="max-height: 80px; margin-bottom: 15px;">
                            <div id="prev-company-name" class="text-xl font-bold text-slate-800 tracking-tight mb-2">${store.state.companyName || ''}</div>
                            <h2 id="prev-title" class="text-3xl font-light tracking-wide text-brand-600 mb-1">${store.state.docType.toUpperCase()}</h2>
                            <p id="prev-number-label" class="text-sm font-bold text-slate-700"># ${store.state.docNumber}</p>
                            <span id="prev-status-badge"></span>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-slate-700 mb-1"><span id="lbl-date" class="text-slate-500 font-normal mr-2"></span><span id="prev-date">${store.state.date}</span></p>
                            <p class="text-sm font-semibold text-slate-700"><span id="lbl-due" class="text-slate-500 font-normal mr-2"></span><span id="prev-due-date">${store.state.dueDate}</span></p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p id="lbl-from" class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"></p>
                            <div id="prev-sender" class="text-sm text-slate-600 leading-relaxed"></div>
                        </div>
                        <div class="text-right">
                            <p id="lbl-to" class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"></p>
                            <div id="prev-client" class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">${store.state.clientDetails}</div>
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
                renderPreview(); 
                
                // Inject floating print button
                const floatBtn = document.createElement('button');
                floatBtn.innerText = 'Print / Save PDF';
                floatBtn.className = 'fixed bottom-6 right-6 bg-brand-600 text-white px-6 py-3 rounded-full shadow-lg font-bold hover:bg-brand-700 transition';
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
    previewEl.className = `a4-document bg-white text-slate-900 p-[20mm] min-h-[297mm] transition-all template-${store.state.template_id}`;
    
    const langDict = dict[store.state.lang] || dict['en'];
    previewEl.setAttribute('dir', langDict.dir);
    
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

    const typeKey = store.state.docType.toLowerCase();
    if(document.getElementById('prev-title')) document.getElementById('prev-title').textContent = langDict[typeKey] || store.state.docType.toUpperCase();
    if(document.getElementById('prev-number-label')) document.getElementById('prev-number-label').textContent = `# ${store.state.docNumber}`;
    if(document.getElementById('prev-date')) document.getElementById('prev-date').textContent = store.state.date;
    
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
        const firstLine = lines.shift() || '';
        const companyName = store.state.companyName || firstLine;
        const remainder = lines.join('<br>');
        document.getElementById('prev-sender').innerHTML = `<strong style="font-size: 1.1em; display: block; margin-bottom: 4px;">${companyName}</strong>${remainder}`;
    }
    
    if(document.getElementById('prev-client')) document.getElementById('prev-client').textContent = store.state.clientDetails;
    
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
        if(store.state.sigDataUrl) {
            sigImg.src = store.state.sigDataUrl;
            sigContainer.classList.remove('hidden');
        } else {
            sigContainer.classList.add('hidden');
        }
    }

    const badge = document.getElementById('prev-status-badge');
    if(badge) {
        badge.textContent = store.state.status;
        badge.className = `inline-block mt-2 px-2 py-0.5 text-xs font-bold uppercase rounded ${store.state.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : store.state.status === 'Unpaid' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`;
    }

    if(document.getElementById('prev-items-body')) {
        document.getElementById('prev-items-body').innerHTML = store.state.items.filter(i => i.desc || i.price > 0).map(item => `
            <tr class="border-b border-slate-100">
                <td class="py-2.5 font-medium text-slate-700">${item.desc}</td>
                <td class="py-2.5 text-center text-slate-500">${item.qty}</td>
                <td class="py-2.5 text-end text-slate-500">${formatMoney(item.price)}</td>
                <td class="py-2.5 text-end font-semibold text-slate-800">${formatMoney(item.qty * item.price)}</td>
            </tr>
        `).join('');
    }

    calculate();
    if(document.getElementById('prev-subtotal')) document.getElementById('prev-subtotal').textContent = formatMoney(store.calcTotals.subtotal);
    if(document.getElementById('prev-discount')) document.getElementById('prev-discount').textContent = `-${formatMoney(store.calcTotals.discount)}`;
    if(document.getElementById('prev-discount-row')) document.getElementById('prev-discount-row').style.display = store.calcTotals.discount > 0 ? 'flex' : 'none';
    
    let taxLabel = store.state.region === 'USA' ? `${langDict.tax} (${getTaxRate()}%)` : store.state.region === 'UK' ? 'VAT (20%)' : store.state.region === 'CAN' ? 'GST (5%)' : 'GST (10%)';
    if(document.getElementById('prev-tax-label')) document.getElementById('prev-tax-label').textContent = taxLabel;
    if(document.getElementById('prev-tax')) document.getElementById('prev-tax').textContent = formatMoney(store.calcTotals.tax);
    if(document.getElementById('prev-total')) document.getElementById('prev-total').textContent = formatMoney(store.calcTotals.total);

    const notesContainer = document.getElementById('prev-notes-terms-container');
    const notesBox = document.getElementById('prev-notes-box');
    const notesContent = document.getElementById('prev-notes-content');
    const termsBox = document.getElementById('prev-terms-box');
    const termsContent = document.getElementById('prev-terms-content');

    if(notesContainer) {
        if ((store.state.notes && store.state.notes.trim()) || (store.state.terms && store.state.terms.trim())) {
            notesContainer.classList.remove('hidden');
            if (store.state.notes && store.state.notes.trim()) {
                notesBox.classList.remove('hidden');
                notesContent.textContent = store.state.notes;
            } else {
                notesBox.classList.add('hidden');
            }
            if (store.state.terms && store.state.terms.trim()) {
                termsBox.classList.remove('hidden');
                termsContent.textContent = store.state.terms;
            } else {
                termsBox.classList.add('hidden');
            }
        } else {
            notesContainer.classList.add('hidden');
        }
    }

    const qrContainer = document.getElementById('qr-code-container');
    if(qrContainer) {
        if (store.state.showQR && store.state.uploadedQrDataUrl) {
            qrContainer.classList.remove('hidden');
            qrContainer.innerHTML = `<img src="${store.state.uploadedQrDataUrl}" style="max-width: 100px; max-height: 100px; object-fit: contain; margin-top: 10px;" />`;
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
        document.getElementById('share-link-input').value = shareLink;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice ${store.state.docNumber}`,
                    text: `Please find the details for invoice ${store.state.docNumber} from ${store.state.companyName || store.state.senderDetails.split('\n')[0]}.\nTotal: ${formatMoney(store.calcTotals.total)}`,
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
        const validation = validateInvoice();
        if (validation !== true) return showToast(validation);

        if (!store.state.id) store.state.id = crypto.randomUUID();

        const shareLink = `${window.location.origin}${window.location.pathname}?invoice=${store.state.id}`;
        const subject = encodeURIComponent(`Invoice ${store.state.docNumber} from ${store.state.companyName || store.state.senderDetails.split('\n')[0]}`);
        const body = encodeURIComponent(`Hello,\n\nPlease find the details for invoice ${store.state.docNumber} below.\n\nTotal: ${formatMoney(store.calcTotals.total)}\nDue Date: ${store.state.dueDate || 'N/A'}\n\nView or download your invoice here:\n${shareLink}\n\nThank you for your business!`);
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
            btnPdf.classList.add('is-loading');
            showToast("Compiling PDF asynchronously...");

            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));

            // تبدیلی 3: پی ڈی ایف کے کٹنے کے مسئلے کا حل
            const originalWidth = element.style.width;
            element.style.width = '800px';

            const options = {
                margin: [10, 10, 10, 10], 
                filename: `${store.state.docNumber || 'Invoice'}.pdf`,
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
}
