// preview-manager.js
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
                document.body.style.backgroundColor = '#eef2f3';

                // 100% Exact CSS matched with the image layout
                const styleEl = document.createElement('style');  
                styleEl.innerHTML = `  
                    :root {
                        --primary-color: #3F3DBC;
                        --border-color: #D1D5DB;
                        --box-border: #9389f5;
                        --box-bg: #f9f9ff;
                        --text-color: #1F2937;
                        --green-color: #10B981;
                    }
                    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                    
                    .invoice-container {
                        background: #ffffff; width: 210mm; min-height: 297mm; margin: 20px auto; 
                        padding: 20mm 15mm; box-shadow: 0 0 20px rgba(0,0,0,0.05); position: relative;
                    }
                    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
                    .header-left { display: flex; align-items: flex-start; gap: 15px; }
                    .logo-placeholder { width: 120px; height: 120px; border: 1.5px solid var(--box-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-weight: bold; overflow: hidden; background: #fff; }
                    .logo-placeholder img { width: 100%; height: 100%; object-fit: contain; }
                    .company-details h1 { color: var(--primary-color); font-size: 24px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
                    .company-details p { margin: 2px 0; font-size: 13px; color: #4B5563; }
                    .header-right { text-align: right; }
                    .invoice-title { color: var(--primary-color); font-size: 42px; font-weight: 800; margin: 0; letter-spacing: 1px; line-height: 1; }
                    .invoice-num { font-size: 18px; font-weight: 700; margin: 10px 0 5px 0; color: #1F2937; }
                    .status-badge { display: inline-block; background-color: #E0E7FF; color: var(--primary-color); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
                    .dates-info p { margin: 4px 0; font-size: 13px; font-weight: 600; color: #374151; }
                    .dates-info span { font-weight: 700; color: var(--primary-color); }
                    .divider-line { border-top: 2px solid var(--primary-color); margin: 15px 0 20px 0; }
                    
                    .billing-section { display: flex; justify-content: space-between; margin-bottom: 25px; }
                    .bill-column { width: 48%; }
                    .bill-label { color: var(--primary-color); font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
                    .bill-name { font-size: 15px; font-weight: 700; margin: 0 0 4px 0; text-transform: uppercase; }
                    .bill-address { margin: 2px 0; font-size: 13px; color: #4B5563; line-height: 1.4; white-space: pre-wrap; }
                    
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .items-table th { background-color: var(--primary-color); color: white; padding: 10px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                    .items-table th:nth-child(1) { text-align: left; width: 55%; }
                    .items-table th:nth-child(2) { text-align: center; width: 10%; }
                    .items-table th:nth-child(3) { text-align: right; width: 15%; }
                    .items-table th:nth-child(4) { text-align: right; width: 20%; }
                    .items-table td { padding: 12px; font-size: 13px; border: 1px solid #E5E7EB; color: #374151; }
                    .items-table td:nth-child(1) { font-weight: 600; }
                    .items-table td:nth-child(2) { text-align: center; }
                    .items-table td:nth-child(3) { text-align: right; }
                    .items-table td:nth-child(4) { text-align: right; font-weight: 600; }
                    
                    .bottom-grid { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
                    .bottom-left-blocks { width: 53%; display: flex; flex-direction: column; gap: 15px; }
                    .bottom-right-blocks { width: 44%; display: flex; flex-direction: column; gap: 15px; }
                    .outline-box { border: 1px solid var(--box-border); background-color: var(--box-bg); border-radius: 10px; padding: 15px; }
                    .box-title { color: var(--primary-color); font-size: 12px; font-weight: 700; text-transform: uppercase; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
                    .payment-row { font-size: 12px; margin-bottom: 6px; color: #374151; }
                    .payment-row span { display: inline-block; border-bottom: 1px solid #9CA3AF; min-width: 180px; padding-left: 5px; font-weight: 600; }
                    .notes-list, .terms-list { margin: 0; padding-left: 18px; font-size: 12px; color: #4B5563; }
                    
                    .totals-box { padding: 0; overflow: hidden; border: 1px solid var(--box-border); border-radius: 10px; }
                    .total-row { display: flex; justify-content: space-between; padding: 10px 15px; font-size: 13px; font-weight: 700; border-bottom: 1px solid #E5E7EB; text-transform: uppercase; }
                    .total-row:last-of-type { border-bottom: none; }
                    .total-row.discount-row { color: var(--green-color); }
                    .grand-total-row { background-color: var(--primary-color); color: white; display: flex; justify-content: space-between; padding: 12px 15px; font-size: 15px; font-weight: 700; text-transform: uppercase; }
                    
                    .invoice-footer { margin-top: 35px; }
                    .auth-stamps-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
                    .signature-block { width: 220px; position: relative; }
                    .sig-line { border-top: 1px solid #4B5563; margin-bottom: 6px; }
                    .sig-upload-preview { height: 50px; width: 100%; object-fit: contain; margin-bottom: -5px; }
                    .auth-title { font-size: 11px; font-weight: 700; color: #1F2937; text-transform: uppercase; margin: 0 0 4px 0; }
                    .auth-details p { margin: 2px 0; font-size: 12px; color: #4B5563; }
                    .stamp-circle { width: 90px; height: 90px; border: 1.5px solid var(--box-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; text-align: center; overflow: hidden; background: #fff; margin-right: 40px; }
                    .stamp-circle img { width: 100%; height: 100%; object-fit: contain; }
                    .thanks-msg { text-align: center; font-size: 16px; font-weight: 700; color: #1F2937; margin-bottom: 15px; }
                    .footer-bar { border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; justify-content: center; gap: 30px; font-size: 12px; color: #4B5563; font-weight: 600; }
                    
                    @media print {  
                        body { background: white !important; padding: 0 !important; }  
                        .invoice-container { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 0 !important; }  
                        .no-print { display: none !important; }  
                    }  
                `;  
                document.head.appendChild(styleEl);  

                const previewWrapper = document.createElement('div');
                previewWrapper.id = 'doc-preview';
                document.body.appendChild(previewWrapper);

                store.state = { ...defaultState, ...JSON.parse(publicData.stateSnapshot) };  
                  
                // Exact HTML Structure mirroring your UI request
                previewWrapper.innerHTML = `  
                    <div class="invoice-container">
                        <div class="invoice-header">
                            <div class="header-left">
                                <div class="logo-placeholder">
                                    <span id="logo-txt">LOGO</span>
                                    <img id="logo-img" src="" alt="Logo" style="display:none;">
                                </div>
                                <div class="company-details">
                                    <h1 id="comp-name">COMPANY NAME</h1>
                                    <p id="comp-address">Company Address</p>
                                </div>
                            </div>
                            <div class="header-right">
                                <div class="invoice-title" id="inv-title">INVOICE</div>
                                <div class="invoice-num" id="inv-num"># NUMBER</div>
                                <div class="status-badge" id="inv-status">STATUS</div>
                                <div class="dates-info">
                                    <p>DATE: <span id="inv-date">DATE</span></p>
                                    <p>DUE: <span id="due-date">DUE DATE</span></p>
                                </div>
                            </div>
                        </div>

                        <div class="divider-line"></div>

                        <div class="billing-section">
                            <div class="bill-column">
                                <div class="bill-label">From</div>
                                <div class="bill-name" id="preview-from-title">COMPANY NAME</div>
                                <div class="bill-address" id="from-addr">Address</div>
                            </div>
                            <div class="bill-column">
                                <div class="bill-label">To</div>
                                <div class="bill-name" id="client-name">CLIENT NAME</div>
                                <div class="bill-address" id="client-addr">Address</div>
                            </div>
                        </div>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody id="invoice-items-tbody"></tbody>
                        </table>

                        <div class="bottom-grid">
                            <div class="bottom-left-blocks">
                                <div class="outline-box">
                                    <div class="box-title">💳 Payment Details</div>
                                    <div id="payment-details-content" style="font-size: 13px; color: #4B5563; white-space: pre-wrap;"></div>
                                </div>
                                <div class="outline-box">
                                    <div class="box-title">📝 Notes</div>
                                    <div id="notes-content" style="font-size: 13px; color: #4B5563; white-space: pre-wrap;"></div>
                                </div>
                            </div>
                            <div class="bottom-right-blocks">
                                <div class="totals-box">
                                    <div class="total-row"><span>Subtotal</span><span class="amount-val" id="subtotal-val">0.00</span></div>
                                    <div class="total-row discount-row" id="discount-row" style="display:none;"><span>Discount</span><span class="amount-val" id="discount-val">0.00</span></div>
                                    <div class="total-row"><span>Tax</span><span class="amount-val" id="tax-val">0.00</span></div>
                                    <div class="grand-total-row"><span>Grand Total</span><span id="grand-total-val">0.00</span></div>
                                </div>
                                <div class="outline-box">
                                    <div class="box-title">📋 Terms and Conditions</div>
                                    <div id="terms-content" style="font-size: 13px; color: #4B5563; white-space: pre-wrap;"></div>
                                </div>
                            </div>
                        </div>

                        <div class="invoice-footer">
                            <div class="auth-stamps-section">
                                <div class="signature-block">
                                    <img id="sig-img" class="sig-upload-preview" src="" style="display:none;">
                                    <div class="sig-line"></div>
                                    <div class="auth-title">Authorized Signature</div>
                                    <div class="auth-details">
                                        <p id="sig-comp">COMPANY NAME</p>
                                    </div>
                                </div>
                                <div class="stamp-circle">
                                    <span id="stamp-txt">Stamp</span>
                                    <img id="stamp-img" src="" style="display:none;">
                                </div>
                            </div>
                            <div class="thanks-msg">Thank you for your business!</div>
                        </div>
                    </div>
                `;  
                renderPreview();   
                  
                const floatBtn = document.createElement('button');  
                floatBtn.innerText = 'Print / Save PDF';  
                floatBtn.className = 'no-print fixed bottom-8 right-8 bg-[#3F3DBC] text-white px-8 py-3 rounded-full shadow-lg font-bold cursor-pointer';  
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
    // We target the IDs defined in our exact layout
    try {
        // --- 1. Header & Logos ---
        const logoImg = document.getElementById('logo-img');
        const logoTxt = document.getElementById('logo-txt');
        if(logoImg && logoTxt) {
            if(store.state.logoDataUrl) {
                logoImg.src = store.state.logoDataUrl;
                logoImg.style.display = 'block';
                logoTxt.style.display = 'none';
            } else {
                logoImg.style.display = 'none';
                logoTxt.style.display = 'block';
            }
        }

        const compName = store.state.companyName || 'Hamid Hussain & Co.';
        if(document.getElementById('comp-name')) document.getElementById('comp-name').textContent = compName;
        if(document.getElementById('preview-from-title')) document.getElementById('preview-from-title').textContent = compName;
        if(document.getElementById('sig-comp')) document.getElementById('sig-comp').textContent = compName;

        if(document.getElementById('comp-address')) {
            document.getElementById('comp-address').innerHTML = (store.state.companyAddress || '').replace(/\n/g, '<br>');
        }
        if(document.getElementById('from-addr')) {
            document.getElementById('from-addr').innerHTML = (store.state.senderDetails || '').replace(/\n/g, '<br>');
        }

        if(document.getElementById('inv-title')) document.getElementById('inv-title').textContent = (store.state.docType || 'INVOICE').toUpperCase();
        if(document.getElementById('inv-num')) document.getElementById('inv-num').textContent = `# ${store.state.docNumber || ''}`;
        
        const statusBadge = document.getElementById('inv-status');
        if(statusBadge) {
            statusBadge.textContent = store.state.status || 'PENDING';
            statusBadge.style.display = store.state.status ? 'inline-block' : 'none';
        }

        if(document.getElementById('inv-date')) document.getElementById('inv-date').textContent = store.state.date || '';
        if(document.getElementById('due-date')) document.getElementById('due-date').textContent = store.state.dueDate || '';

        // --- 2. Client Details ---
        if(document.getElementById('client-name')) {
            // Extract first line as name if possible, or just dump details
            let clientLines = (store.state.clientDetails || '').split('\n');
            document.getElementById('client-name').textContent = clientLines[0] || 'CLIENT NAME';
            document.getElementById('client-addr').innerHTML = clientLines.slice(1).join('<br>') || '';
        }

        // --- 3. Items Table ---
        if(document.getElementById('invoice-items-tbody') && store.state.items) {  
            document.getElementById('invoice-items-tbody').innerHTML = store.state.items.filter(i => i.desc || Number(i.price) > 0).map(item => {
                const qty = Number(item.qty) || 0;
                const price = Number(item.price) || 0;
                const total = qty * price;
                return `  
                <tr>  
                    <td>${item.desc || ''}</td>  
                    <td>${qty}</td>  
                    <td>${formatMoney(price)}</td>  
                    <td>${formatMoney(total)}</td>  
                </tr>  
                `;
            }).join('');  
        }

        // --- 4. Calculations ---
        if(typeof calculate === 'function') calculate();  
        if(!store.calcTotals) store.calcTotals = { subtotal: 0, discount: 0, tax: 0, total: 0 };

        if(document.getElementById('subtotal-val')) document.getElementById('subtotal-val').textContent = formatMoney(store.calcTotals.subtotal || 0);
        
        const discRow = document.getElementById('discount-row');
        if(discRow) {
            if((store.calcTotals.discount || 0) > 0) {
                discRow.style.display = 'flex';
                document.getElementById('discount-val').textContent = `-${formatMoney(store.calcTotals.discount)}`;
            } else {
                discRow.style.display = 'none';
            }
        }
        
        if(document.getElementById('tax-val')) document.getElementById('tax-val').textContent = formatMoney(store.calcTotals.tax || 0);
        if(document.getElementById('grand-total-val')) document.getElementById('grand-total-val').textContent = formatMoney(store.calcTotals.total || 0);

        // --- 5. Bottom Blocks (Notes, Terms, Payment) ---
        if(document.getElementById('payment-details-content')) document.getElementById('payment-details-content').textContent = store.state.paymentDetails || '';
        if(document.getElementById('notes-content')) document.getElementById('notes-content').textContent = store.state.notes || '';
        if(document.getElementById('terms-content')) document.getElementById('terms-content').textContent = store.state.terms || '';

        // --- 6. Signatures and Stamps ---
        const sigImg = document.getElementById('sig-img');
        if(sigImg) {
            if(store.state.sigDataUrl) {
                sigImg.src = store.state.sigDataUrl;
                sigImg.style.display = 'block';
            } else {
                sigImg.style.display = 'none';
            }
        }

        // Logic for Stamp if you added stampDataUrl to your state
        const stampImg = document.getElementById('stamp-img');
        const stampTxt = document.getElementById('stamp-txt');
        if(stampImg && stampTxt) {
            if(store.state.stampDataUrl) {
                stampImg.src = store.state.stampDataUrl;
                stampImg.style.display = 'block';
                stampTxt.style.display = 'none';
            } else {
                stampImg.style.display = 'none';
                stampTxt.style.display = 'block';
            }
        }

    } catch(e) { console.warn("Live Preview Update Error:", e); }
}

export function setupPreviewAndExportListeners() {
    ['discount-type', 'discount-value', 'tax-rate-manual'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', () => {
                if(typeof calculate === 'function') calculate();
                renderPreview();
            });
        }
    });

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
                input.dispatchEvent(new Event('input', { bubbles: true })); 
                e.target.value = ''; 
            }
        });

        return { loadOptions };
    };

    const senderDrop = initDropdown('saved-senders-dropdown', 'inv_saved_senders', 'sender-details');
    const clientDrop = initDropdown('saved-clients-dropdown', 'inv_saved_clients', 'client-details');
    const termsDrop = initDropdown('saved-terms-dropdown', 'inv_saved_terms', 'invoice-terms');

    document.getElementById('btn-save-invoice')?.addEventListener('click', () => {
        if(typeof saveState === 'function') saveState(); 

        const saveToDropdown = (key, val) => {
            if(!val || !val.trim()) return;
            let items = JSON.parse(localStorage.getItem(key) || '[]');
            if(!items.includes(val)) {
                items.unshift(val); 
                if(items.length > 10) items.pop(); 
                localStorage.setItem(key, JSON.stringify(items));
            }
        };

        saveToDropdown('inv_saved_senders', document.getElementById('sender-details')?.value);
        saveToDropdown('inv_saved_clients', document.getElementById('client-details')?.value);
        saveToDropdown('inv_saved_terms', document.getElementById('invoice-terms')?.value);

        if(senderDrop) senderDrop.loadOptions();
        if(clientDrop) clientDrop.loadOptions();
        if(termsDrop) termsDrop.loadOptions();

        showToast("Invoice Data Saved Locally!");
    });

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
                    text: `Please find the details for invoice ${store.state.docNumber || ''}. Total: ${store.calcTotals ? formatMoney(store.calcTotals.total) : ''}`,  
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
            showToast("Link copied!");  
        }  
    });  

    const btnPrintMode = document.getElementById('btn-print-mode');  
    if (btnPrintMode) {  
        btnPrintMode.addEventListener('click', () => {  
            window.print();  
        });  
    }  

    const btnPdf = document.getElementById('btn-pdf');  
    if(btnPdf) {  
        btnPdf.addEventListener('click', async () => {  
            const validation = validateInvoice();  
            if (validation !== true) return showToast(validation);  
              
            const element = document.getElementById('doc-preview') || document.querySelector('.invoice-container');  
            if(!element) return;
            
            showToast("Compiling PDF...");  
            await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 50)));  

            const options = {  
                margin: [0, 0, 0, 0],   
                filename: `${store.state.docNumber || 'Invoice'}.pdf`,  
                image: { type: 'jpeg', quality: 1.0 },   
                html2canvas: { scale: 3, useCORS: true, logging: false },  
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
            };  
              
            try {  
                await html2pdf().set(options).from(element).save();  
                showToast("Export completed!");  
            } catch (error) {  
                showToast("Error generating PDF.");  
                console.error(error);  
            }  
        });  
    }
}
