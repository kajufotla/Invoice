// /assets/script.js

document.addEventListener("DOMContentLoaded", () => {
    // Check if we are on a generator page
    const bodyMode = document.body.getAttribute("data-mode");
    if (!bodyMode) return; // Exit if on homepage

    initApp(bodyMode);
    
    // Bind inputs to live update
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });
});

let currentMode = 'invoice';

function initApp(mode) {
    currentMode = mode;
    document.getElementById('docDate').valueAsDate = new Date();
    
    // Set UI labels based on mode
    const docTypeEl = document.getElementById('out-doc-type');
    const docIdEl = document.getElementById('out-doc-id');
    const toLabelEl = document.getElementById('to-label');
    const totalLabelEl = document.getElementById('total-label');
    const footerEl = document.getElementById('out-footer');

    if (mode === 'invoice') {
        docTypeEl.innerText = 'INVOICE';
        docIdEl.innerText = 'INV-' + Math.floor(Math.random()*9000 + 1000);
        toLabelEl.innerText = 'Bill To';
        totalLabelEl.innerText = 'Total Due';
        footerEl.innerText = 'Please pay within 15 days. Thank you for your business.';
    } else if (mode === 'receipt') {
        docTypeEl.innerText = 'RECEIPT';
        docIdEl.innerText = 'REC-' + Math.floor(Math.random()*9000 + 1000);
        toLabelEl.innerText = 'Received From';
        totalLabelEl.innerText = 'Total Paid';
        footerEl.innerText = 'Payment received in full. Thank you for your business.';
    } else if (mode === 'quote') {
        docTypeEl.innerText = 'QUOTE';
        docIdEl.innerText = 'QTE-' + Math.floor(Math.random()*9000 + 1000);
        toLabelEl.innerText = 'Quote For';
        totalLabelEl.innerText = 'Estimated Total';
        footerEl.innerText = 'This quote is valid for 30 days. Subject to standard terms.';
    }

    updatePreview();
}

function formatMoney(amount, currency) {
    return currency + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updatePreview() {
    const bName = document.getElementById('businessName').value || 'Your Business';
    const cName = document.getElementById('clientName').value || 'Client Name';
    const dDate = document.getElementById('docDate').value;
    const desc = document.getElementById('itemDesc').value || 'Item Description';
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const tax = parseFloat(document.getElementById('taxRate').value) || 0;
    const curr = document.getElementById('currency').value;

    const taxAmount = amount * (tax / 100);
    const total = amount + taxAmount;

    document.getElementById('out-business').innerText = bName;
    document.getElementById('out-client').innerText = cName;
    
    if(dDate) {
        const dateObj = new Date(dDate);
        document.getElementById('out-date').innerText = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    document.getElementById('out-desc').innerText = desc;
    document.getElementById('out-amount-row').innerText = formatMoney(amount, curr);
    document.getElementById('out-subtotal').innerText = formatMoney(amount, curr);
    
    const taxRow = document.getElementById('tax-row');
    if(tax > 0) {
        taxRow.style.display = 'flex';
        document.getElementById('out-tax-rate').innerText = tax;
        document.getElementById('out-tax-amount').innerText = formatMoney(taxAmount, curr);
    } else {
        taxRow.style.display = 'none';
    }

    document.getElementById('out-total').innerText = formatMoney(total, curr);
}

function triggerPrint() {
    window.print();
}

function copyDetails() {
    const type = document.getElementById('out-doc-type').innerText;
    const id = document.getElementById('out-doc-id').innerText;
    const date = document.getElementById('out-date').innerText;
    const bName = document.getElementById('out-business').innerText;
    const cName = document.getElementById('out-client').innerText;
    const desc = document.getElementById('out-desc').innerText;
    const total = document.getElementById('out-total').innerText;

    const textToCopy = `
${type} ${id}
Date: ${date}

From: ${bName}
To: ${cName}

Item: ${desc}
Total Amount: ${total}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    });
}
