/* ================= STATE MANAGEMENT ================= */
let stateHistory = [];
let historyIndex = -1;
let isUndoing = false;

let items = [
    { id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false }
];

let currencySym = '$';
let currencyCode = 'USD';

/* ================= INITIALIZATION ================= */
document.addEventListener('DOMContentLoaded', () => {
    // Set Dates
    document.getElementById('f-date').valueAsDate = new Date();
    autoCalcDueDate();
    generateInvoiceNumber();

    // Default defaults
    document.getElementById('f-doc-type').value = "TAX INVOICE";
    document.getElementById('n-public').value = "Thank you for your business. We appreciate your prompt payment.";
    document.getElementById('n-terms').value = "1. Please quote invoice number when remitting funds.\n2. Late payments are subject to a 2% monthly fee.";

    setupDragAndDrop();
    loadDatabases();
    renderPaymentFields();
    renderItems();
    sync(); // Initial render
    saveState();
});

/* ================= UI INTERACTION ================= */
function toggleSidebar() {
    document.getElementById('app-sidebar').classList.toggle('hidden');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    document.getElementById('app-sidebar').classList.remove('hidden');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function showToast(msg, type='success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${type==='success'?'fa-check-circle text-success':'fa-info-circle text-primary'}" style="color:var(--${type})"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* ================= TOP TOOLBAR ACTIONS ================= */
function saveInvoiceData() {
    document.getElementById('modal-inv-no').innerText = document.getElementById('f-inv-num').value || 'N/A';
    document.getElementById('modal-client').innerText = document.getElementById('cli-name').value || 'Unknown Client';
    document.getElementById('modal-amount').innerText = document.getElementById('out-grand').innerText;
    document.getElementById('save-modal').classList.add('active');
}

function mailInvoice() { 
    const email = document.getElementById('cli-email').value || '';
    const invNum = document.getElementById('f-inv-num').value || 'Invoice';
    const total = document.getElementById('out-grand').innerText || '0.00';
    const subject = encodeURIComponent(`New Invoice: ${invNum}`);
    const body = encodeURIComponent(`Hello,\n\nPlease find the details for invoice ${invNum} attached. The total amount due is ${total}.\n\nThank you.`);
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    showToast("Opening Mail Client...", "success"); 
}

function shareInvoice() { showToast("Share link copied to clipboard!", "success"); }
function showHistory() { 
    // Display save modal as placeholder for History action
    document.getElementById('modal-inv-no').innerText = document.getElementById('f-inv-num').value || 'N/A';
    document.getElementById('modal-client').innerText = "Load from History";
    document.getElementById('modal-amount').innerText = "Various";
    document.getElementById('save-modal').classList.add('active');
    showToast("History panel activated", "primary"); 
}

/* ================= HISTORY (UNDO/REDO) ================= */
function saveState() {
    if(isUndoing) return;
    const currentState = {
        items: JSON.parse(JSON.stringify(items)),
        inputs: {}
    };
    document.querySelectorAll('input, select, textarea').forEach(el => {
        if(el.id && el.type !== 'file') currentState.inputs[el.id] = el.value;
    });
    
    stateHistory = stateHistory.slice(0, historyIndex + 1);
    stateHistory.push(currentState);
    if(stateHistory.length > 30) stateHistory.shift();
    else historyIndex++;
}

function undo() {
    if (historyIndex > 0) {
        isUndoing = true;
        historyIndex--;
        restoreState(stateHistory[historyIndex]);
        isUndoing = false;
        showToast("Undo successful", "primary");
    }
}

function redo() {
    if (historyIndex < stateHistory.length - 1) {
        isUndoing = true;
        historyIndex++;
        restoreState(stateHistory[historyIndex]);
        isUndoing = false;
        showToast("Redo successful", "primary");
    }
}

function restoreState(state) {
    items = JSON.parse(JSON.stringify(state.items));
    for(let id in state.inputs) {
        let el = document.getElementById(id);
        if(el) el.value = state.inputs[id];
    }
    renderItems();
    sync();
}

/* ================= CORE LOGIC & SYNC ================= */
function autoCalcDueDate() {
    const terms = document.getElementById('f-terms').value;
    if(terms !== 'custom') {
        let d = new Date(document.getElementById('f-date').value);
        d.setDate(d.getDate() + parseInt(terms));
        document.getElementById('f-due').valueAsDate = d;
    }
    sync();
}

function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const ran = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('f-inv-num').value = `INV-${year}-${ran}`;
    sync();
}

function formatDate(dStr) {
    if(!dStr) return '';
    return new Date(dStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function numberToWords(amount) {
    if(amount === 0) return 'Zero';
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    
    let str = '';
    let numStr = Math.floor(amount).toString();
    if (numStr.length > 9) return 'Amount exceeds limit';
    
    let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    
    let decimal = Math.round((amount - Math.floor(amount)) * 100);
    if(decimal > 0) {
        str = str.trim() + ' and ' + decimal + '/100';
    }
    return str.trim() + ' Only';
}

/* ================= ITEMS MANAGEMENT ================= */
function setupDragAndDrop() {
    new Sortable(document.getElementById('items-container'), {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'drag-ghost',
        onEnd: function (evt) {
            const moved = items.splice(evt.oldIndex, 1)[0];
            items.splice(evt.newIndex, 0, moved);
            renderItems();
            saveState();
        }
    });
}

function renderItems() {
    const cont = document.getElementById('items-container');
    cont.innerHTML = '';
    items.forEach((it, idx) => {
        let q = Number(it.qty) || 0;
        let p = Number(it.price) || 0;
        let t = Number(it.tax) || 0;
        let d = Number(it.disc) || 0;
        const total = (q * p) - d + ((q * p - d) * (t/100));
        
        cont.innerHTML += `
            <div class="item-row" data-id="${it.id}">
                <div class="item-main">
                    <div class="drag-handle" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></div>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <input type="text" class="input-control" placeholder="Item Name / Description" value="${it.desc}" oninput="updateItem(${idx}, 'desc', this.value)">
                        <input type="text" class="input-control" style="font-size:11px; padding:6px; color:var(--text-muted);" placeholder="Additional notes (optional)..." value="${it.notes}" oninput="updateItem(${idx}, 'notes', this.value)">
                    </div>
                    <input type="number" class="input-control" placeholder="Qty" value="${it.qty !== '' ? it.qty : ''}" oninput="updateItem(${idx}, 'qty', this.value)">
                    <input type="number" class="input-control" placeholder="Price" value="${it.price !== '' ? it.price : ''}" oninput="updateItem(${idx}, 'price', this.value)">
                    <div style="display:flex; gap:4px;">
                        <button class="btn btn-icon" onclick="items[${idx}].showAdv=!items[${idx}].showAdv; renderItems();" title="Edit Advanced (Tax/Discount)"><i class="fa-solid fa-sliders"></i></button>
                        <button class="btn btn-icon btn-danger" onclick="deleteItem(${idx})" title="Delete Item"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                ${it.showAdv ? `
                <div class="item-meta">
                    <div class="form-group"><label>SKU</label><input type="text" class="input-control input-sm" value="${it.sku||''}" oninput="updateItem(${idx}, 'sku', this.value)"></div>
                    <div class="form-group"><label>Unit</label><input type="text" class="input-control input-sm" placeholder="hrs, pcs, kg" value="${it.unit||''}" oninput="updateItem(${idx}, 'unit', this.value)"></div>
                    <div class="form-group"><label>Discount ($)</label><input type="number" class="input-control input-sm" placeholder="0" value="${it.disc !== '' ? it.disc : ''}" oninput="updateItem(${idx}, 'disc', this.value)"></div>
                    <div class="form-group"><label>Tax (%)</label><input type="number" class="input-control input-sm" placeholder="0" value="${it.tax !== '' ? it.tax : ''}" oninput="updateItem(${idx}, 'tax', this.value)"></div>
                </div>
                <div class="item-total-display">Line Total: ${currencySym}${total.toFixed(2)}</div>
                ` : ''}
            </div>
        `;
    });
    sync();
}

function addItem() { items.push({ id: Date.now(), desc: '', notes: '', sku: '', unit: '', qty: '', price: '', tax: '', disc: '', showAdv: false }); renderItems(); saveState(); }
function deleteItem(idx) { items.splice(idx, 1); renderItems(); saveState(); }
function clearItems() { if(confirm("Clear all items?")) { items = []; renderItems(); saveState(); } }
function updateItem(idx, field, val) { items[idx][field] = val; sync(); }

/* ================= PAYMENT GATEWAYS ================= */
const payFields = {
    bank: `<div class="form-group full"><label>Bank Name</label><input type="text" class="input-control" id="p-bank" oninput="sync()"></div>
           <div class="form-group"><label>Account Name</label><input type="text" class="input-control" id="p-accname" oninput="sync()"></div>
           <div class="form-group"><label>Account Number</label><input type="text" class="input-control" id="p-accno" oninput="sync()"></div>
           <div class="form-group"><label>Routing / IBAN</label><input type="text" class="input-control" id="p-iban" oninput="sync()"></div>
           <div class="form-group"><label>SWIFT / BIC</label><input type="text" class="input-control" id="p-swift" oninput="sync()"></div>`,
    paypal: `<div class="form-group full"><label>PayPal Email / Link</label><input type="text" class="input-control" id="p-paypal" placeholder="paypal.me/username" oninput="sync()"></div>`,
    stripe: `<div class="form-group full"><label>Stripe Payment Link</label><input type="text" class="input-control" id="p-stripe" placeholder="https://buy.stripe.com/..." oninput="sync()"></div>`,
    wise: `<div class="form-group full"><label>Wise Account Email</label><input type="email" class="input-control" id="p-wise" oninput="sync()"></div>`,
    payoneer: `<div class="form-group full"><label>Payoneer Email</label><input type="email" class="input-control" id="p-payoneer" oninput="sync()"></div>`,
    crypto: `<div class="form-group"><label>Cryptocurrency (e.g. USDT, BTC)</label><input type="text" class="input-control" id="p-coin" oninput="sync()"></div>
             <div class="form-group"><label>Network (e.g. TRC20, ERC20)</label><input type="text" class="input-control" id="p-net" oninput="sync()"></div>
             <div class="form-group full"><label>Wallet Address</label><input type="text" class="input-control" id="p-wallet" oninput="sync()"></div>`,
    easypaisa: `<div class="form-group"><label>Account Title</label><input type="text" class="input-control" id="p-mobi-name" oninput="sync()"></div>
                <div class="form-group"><label>Mobile Number</label><input type="text" class="input-control" id="p-mobi-no" oninput="sync()"></div>`,
    custom: `<div class="form-group full"><label>Custom Payment Instructions</label><textarea class="input-control" id="p-custom" rows="4" oninput="sync()"></textarea></div>`
};

function renderPaymentFields() {
    const method = document.getElementById('p-method').value;
    document.getElementById('payment-dynamic-fields').innerHTML = payFields[method];
    sync();
}

/* ================= MAIN SYNC (DOM to PREVIEW) ================= */
let qrInst = null;

function sync() {
    const textMap = {
        'out-doc-type': 'f-doc-type', 'out-inv-num': 'f-inv-num', 'out-po': 'f-po', 'out-ref': 'f-ref',
        'out-c-name': 'c-name', 'out-c-addr1': 'c-addr1', 'out-c-addr2': 'c-addr2', 'out-c-email': 'c-email', 'out-c-phone': 'c-phone', 'out-c-web': 'c-web', 'out-c-taxid': 'c-taxid', 'out-c-reg': 'c-reg',
        'out-cli-name': 'cli-name', 'out-cli-addr1': 'cli-addr1', 'out-cli-addr2': 'cli-addr2', 'out-cli-contact': 'cli-contact', 'out-cli-email': 'cli-email', 'out-cli-phone': 'cli-phone', 'out-cli-taxid': 'cli-taxid',
        'out-sign-name': 'b-sign-name', 'out-sign-role': 'b-sign-role',
        'out-tax-label': 'f-tax-label'
    };
    
    for(let outId in textMap) {
        const el = document.getElementById(outId);
        const val = document.getElementById(textMap[outId])?.value.trim();
        if(el) el.innerText = val || '';
    }

    const opts = ['c-taxid','c-reg','po','ref','cli-contact','cli-email','cli-phone','cli-taxid'];
    opts.forEach(o => {
        const wrap = document.getElementById(`wrap-${o}`);
        if(wrap) wrap.style.display = document.getElementById(o === 'po'||o==='ref' ? `f-${o}` : o.replace('-','-')).value ? 'block' : 'none';
    });

    const currParts = document.getElementById('f-currency').value.split('|');
    currencyCode = currParts[0];
    currencySym = currParts[1];

    document.getElementById('out-date').innerText = formatDate(document.getElementById('f-date').value);
    document.getElementById('out-due').innerText = formatDate(document.getElementById('f-due').value);

    document.getElementById('out-n-public').innerText = document.getElementById('n-public').value;
    document.getElementById('wrap-n-public').style.display = document.getElementById('n-public').value ? 'block' : 'none';
    
    document.getElementById('out-n-terms').innerText = document.getElementById('n-terms').value;
    document.getElementById('wrap-n-terms').style.display = document.getElementById('n-terms').value ? 'block' : 'none';
    
    document.getElementById('out-n-footer').innerText = document.getElementById('n-footer').value;

    const pMethod = document.getElementById('p-method').value;
    let pStr = '';
    if(pMethod === 'bank') pStr = `<strong>Bank:</strong> ${document.getElementById('p-bank')?.value}<br><strong>Account:</strong> ${document.getElementById('p-accname')?.value} (${document.getElementById('p-accno')?.value})<br><strong>IBAN:</strong> ${document.getElementById('p-iban')?.value} | <strong>SWIFT:</strong> ${document.getElementById('p-swift')?.value}`;
    else if(pMethod === 'paypal') pStr = `<strong>PayPal:</strong> ${document.getElementById('p-paypal')?.value}`;
    else if(pMethod === 'stripe') pStr = `<strong>Pay Online:</strong> ${document.getElementById('p-stripe')?.value}`;
    else if(pMethod === 'wise') pStr = `<strong>Wise Account:</strong> ${document.getElementById('p-wise')?.value}`;
    else if(pMethod === 'payoneer') pStr = `<strong>Payoneer:</strong> ${document.getElementById('p-payoneer')?.value}`;
    else if(pMethod === 'crypto') pStr = `<strong>Coin:</strong> ${document.getElementById('p-coin')?.value} (${document.getElementById('p-net')?.value})<br><strong>Wallet:</strong> ${document.getElementById('p-wallet')?.value}`;
    else if(pMethod === 'easypaisa') pStr = `<strong>Mobile Money:</strong> ${document.getElementById('p-mobi-name')?.value} - ${document.getElementById('p-mobi-no')?.value}`;
    else pStr = document.getElementById('p-custom')?.value.replace(/\n/g, '<br>');
    
    document.getElementById('out-payment').innerHTML = pStr;
    document.getElementById('wrap-pay').style.display = pStr.trim().replace(/<br>|<strong>|<\/strong>/g,'') ? 'block' : 'none';

    let tbody = document.getElementById('out-items-body');
    tbody.innerHTML = '';
    let subtotal = 0;
    let hasItemTaxDisc = items.some(i => (Number(i.tax) || 0) > 0 || (Number(i.disc) || 0) > 0);
    
    document.getElementById('th-tax').style.display = hasItemTaxDisc ? 'table-cell' : 'none';

    items.forEach(it => {
        let q = Number(it.qty) || 0;
        let p = Number(it.price) || 0;
        let t = Number(it.tax) || 0;
        let d = Number(it.disc) || 0;

        let baseTotal = q * p;
        let finalTotal = baseTotal - d + ((baseTotal - d) * (t/100));
        subtotal += finalTotal;
        
        if(it.desc || finalTotal > 0) {
            tbody.innerHTML += `
                <tr>
                    <td>
                        <span class="td-item-name">${it.desc}</span>
                        ${it.notes ? `<span class="td-item-desc">${it.notes}</span>` : ''}
                        ${it.sku || it.unit ? `<span class="td-item-meta">SKU: ${it.sku||'N/A'} | Unit: ${it.unit||'N/A'}</span>` : ''}
                    </td>
                    <td class="center">${q}</td>
                    <td class="right">${currencySym}${p.toFixed(2)}</td>
                    ${hasItemTaxDisc ? `<td class="right" style="color:#64748B;">${d>0?`-${currencySym}${d}`:''}${t>0?` +${t}%`:''}</td>` : ''}
                    <td class="right" style="font-weight:600;">${currencySym}${finalTotal.toFixed(2)}</td>
                </tr>
            `;
        }
    });

    let gDiscType = document.getElementById('f-disc-type').value;
    let gDiscVal = Number(document.getElementById('f-disc-val').value) || 0;
    let gTax = Number(document.getElementById('f-global-tax').value) || 0;

    let discAmt = gDiscType === 'percent' ? subtotal * (gDiscVal/100) : gDiscVal;
    let afterDisc = subtotal - discAmt;
    let taxAmt = afterDisc * (gTax/100);
    let grandTotal = afterDisc + taxAmt;

    document.getElementById('out-subtotal').innerText = `${currencySym}${subtotal.toFixed(2)}`;
    
    document.getElementById('wrap-global-disc').style.display = discAmt > 0 ? 'flex' : 'none';
    document.getElementById('out-global-disc').innerText = `-${currencySym}${discAmt.toFixed(2)}`;
    
    document.getElementById('wrap-global-tax').style.display = taxAmt > 0 ? 'flex' : 'none';
    document.getElementById('out-global-tax').innerText = `${currencySym}${taxAmt.toFixed(2)}`;
    
    document.getElementById('out-grand').innerText = `${currencySym}${grandTotal.toFixed(2)}`;
    document.getElementById('out-words').innerText = numberToWords(grandTotal) + ` ${currencyCode}`;

    generateCodes(document.getElementById('f-inv-num').value, grandTotal.toFixed(2));
}

function generateCodes(invNum, amt) {
    const dataStr = `INV:${invNum}|AMT:${amt}|CUR:${currencyCode}`;
    document.getElementById('qrcode').innerHTML = '';
    qrInst = new QRCode(document.getElementById('qrcode'), { text: dataStr, width: 70, height: 70, colorDark: "#0F172A", colorLight: "#ffffff" });
}

/* ================= BRANDING & IMAGES ================= */
function applyBranding() {
    const c = document.getElementById('b-color').value;
    const f = document.getElementById('b-font').value;
    document.documentElement.style.setProperty('--inv-color', c);
    document.documentElement.style.setProperty('--inv-font', f);
    saveState();
}

function handleImageUpload(input, imgId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById(imgId);
            img.src = e.target.result;
            img.style.display = 'block';
            if(imgId === 'img-logo') document.getElementById('logo-placeholder').style.display = 'none';
            if(imgId === 'img-sign') document.getElementById('sign-placeholder').style.display = 'none';
            if(imgId === 'img-stamp') document.getElementById('wrap-stamp').style.display = 'block';
            saveState();
        }
        reader.readAsDataURL(input.files[0]);
    }
}

/* ================= DATABASES (LOCAL STORAGE) ================= */
const dbConfigs = {
    company: ['c-name','c-addr1','c-addr2','c-email','c-phone','c-web','c-taxid','c-reg'],
    client: ['cli-name','cli-addr1','cli-addr2','cli-contact','cli-email','cli-phone','cli-taxid'],
    notes: ['n-public','n-terms','n-footer','n-internal'],
    payment: ['p-method', 'p-bank', 'p-accname', 'p-accno', 'p-iban', 'p-swift', 'p-paypal', 'p-stripe', 'p-wise', 'p-payoneer', 'p-coin', 'p-net', 'p-wallet', 'p-mobi-name', 'p-mobi-no', 'p-custom']
};

function getDB(type) { return JSON.parse(localStorage.getItem(`erp_inv_${type}`) || '{}'); }
function setDB(type, data) { localStorage.setItem(`erp_inv_${type}`, JSON.stringify(data)); loadDatabases(); }

function saveProfile(type) {
    const name = prompt(`Enter a memorable name for this ${type} profile (e.g., Default US):`);
    if(!name) return;
    let data = {};
    dbConfigs[type].forEach(id => {
        let el = document.getElementById(id);
        if(el) data[id] = el.value;
    });
    let db = getDB(type);
    db[name] = data;
    setDB(type, db);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} profile saved!`);
}

function loadProfile(type) {
    const name = document.getElementById(`db-${type}`).value;
    if(!name) return;
    let profile = getDB(type)[name];
    if(profile) {
        for(let id in profile) {
            let el = document.getElementById(id);
            if(el) el.value = profile[id];
        }
        if(type === 'payment') renderPaymentFields();
        sync();
        saveState();
        showToast(`Profile loaded successfully`);
    }
}

function deleteProfile(type) {
    const name = document.getElementById(`db-${type}`).value;
    if(!name) { showToast(`Please select a profile to delete`, 'warning'); return; }
    if(confirm(`Are you sure you want to delete the profile "${name}"?`)) {
        let db = getDB(type);
        delete db[name];
        setDB(type, db);
        document.getElementById(`db-${type}`).value = '';
        showToast(`Profile deleted`);
    }
}

function loadDatabases() {
    Object.keys(dbConfigs).forEach(type => {
        let sel = document.getElementById(`db-${type}`);
        if(sel) {
            let prevVal = sel.value;
            sel.innerHTML = `<option value="">-- Select Saved Profile --</option>`;
            let db = getDB(type);
            for(let key in db) sel.innerHTML += `<option value="${key}">${key}</option>`;
            sel.value = prevVal;
        }
    });
}

/* ================= EXPORT ================= */
function generatePDF() {
    const element = document.getElementById('invoice-render');
    const invNum = document.getElementById('f-inv-num').value || 'Invoice';
    const client = document.getElementById('cli-name').value || 'Client';
    
    showToast('Generating high-resolution PDF...', 'primary');
    
    const opt = {
        margin:       0,
        filename:     `${invNum}_${client}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 3, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF downloaded successfully!');
    });
}
