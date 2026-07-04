// app.js
import { store } from "./invoice-manager.js";
import { renderPreview, setupPreviewAndExportListeners, checkPublicInvoice } from "./preview-manager.js";
import { setupUIListeners } from "./ui-manager.js"; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. چیک کریں کہ کیا یہ کوئی پبلک شیئرڈ لنک (Invoice URL) ہے؟
    const isPublic = await checkPublicInvoice();
    
    if (!isPublic) {
        // 2. اگر یہ پبلک لنک نہیں ہے، تو نارمل ایڈیٹر انٹرفیس لوڈ کریں
        if (typeof setupUIListeners === 'function') setupUIListeners();
        if (typeof setupPreviewAndExportListeners === 'function') setupPreviewAndExportListeners();
        
        // 3. ریئل ٹائم ڈائنامک سنک (Event Delegation)
        document.body.addEventListener('input', (e) => {
            // صرف ان پٹ، ٹیکسٹ ایریا اور سلیکٹ ایلیمنٹس کو ٹارگٹ کریں
            if (e.target.matches('input, textarea, select')) {
                const key = e.target.dataset.stateKey || e.target.id || e.target.name;
                
                if (key) {
                    // اگر ایلیمنٹ کسی ڈائنامک لائن آئٹم (Array) کا حصہ ہے
                    if (e.target.dataset.itemIndex !== undefined) {
                        const index = parseInt(e.target.dataset.itemIndex, 10);
                        const field = e.target.dataset.itemField;
                        
                        if (store.state.items && store.state.items[index]) {
                            store.state.items[index][field] = e.target.value;
                        }
                    } else {
                        // یہ وہ حصہ ہے جسے میں نے آپ کی HTML فائل کے مطابق اپڈیٹ کیا ہے
                        // تاکہ HTML کی ہر ID بالکل درست طریقے سے State میں جائے
                        const specialMaps = {
                            'doc-status': 'status',
                            'doc-type': 'type',
                            'currency': 'currency',
                            'region': 'region',
                            'doc-template': 'template',
                            'prof-company-name': 'companyName',
                            'prof-company-address': 'companyAddress',
                            'doc-number': 'docNumber',
                            'doc-date': 'date',
                            'doc-due-date': 'dueDate',
                            'sender-details': 'sender',
                            'client-details': 'client',
                            'payment-details': 'paymentDetails',
                            'discount-type': 'discountType',
                            'discount-value': 'discountValue',
                            'tax-rate-manual': 'taxRate',
                            'invoice-notes': 'notes',
                            'invoice-terms': 'terms',
                            'prof-company-tax-id': 'companyTaxId',
                            'client-tax-id': 'clientTaxId'
                        };
                        
                        // پہلے میپنگ چیک کریں
                        if (specialMaps[key]) {
                            store.state[specialMaps[key]] = e.target.value;
                        } else {
                            // اگر میپ میں نہیں ہے تو کیمل کیس (CamelCase) کریں
                            let stateKey = key;
                            if (key.includes('-')) {
                                stateKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                            }
                            store.state[stateKey] = e.target.value;
                        }
                    }
                    
                    // کی پریس ہوتے ہی پریویو کو فوراً رینڈر (Update) کریں
                    if (typeof renderPreview === 'function') {
                        renderPreview();
                    }
                }
            }
        });

        // 4. فائل اپلوڈز (Logo اور Signature) کے لیے ڈائنامک لسنرز
        const logoUpload = document.getElementById('logo-upload');
        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 500 * 1024) { 
                        alert("Image is too large. Please upload under 500KB.");
                        e.target.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        store.state.logoDataUrl = event.target.result;
                        if (typeof renderPreview === 'function') renderPreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const sigUpload = document.getElementById('sig-upload');
        if (sigUpload) {
            sigUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 500 * 1024) { 
                        alert("Signature image is too large. Please upload under 500KB.");
                        e.target.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        store.state.sigDataUrl = event.target.result;
                        if (typeof renderPreview === 'function') renderPreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // پیج لوڈ ہونے پر پہلی بار ڈیفالٹ پریویو رینڈر کریں
        if (typeof renderPreview === 'function') {
            renderPreview(); 
        }
    }
});
