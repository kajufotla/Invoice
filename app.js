// app.js
import { store } from "./invoice-manager.js";
import { renderPreview, setupPreviewAndExportListeners, checkPublicInvoice } from "./preview-manager.js";
import { setupUIListeners } from "./ui-manager.js"; 

document.addEventListener('DOMContentLoaded', async () => {
    // 1. चेक करें कि क्या यह कोई पब्लिक शेयर्ड लिंक (Invoice URL) है?
    const isPublic = await checkPublicInvoice();
    
    if (!isPublic) {
        // 2. अगर यह पब्लिक लिंक नहीं है, तो नॉर्मल एडिटर इंटरफेस लोड करें
        setupUIListeners();
        setupPreviewAndExportListeners();
        
        // 3. रियल-टाइम डायनामिक सिंक (Event Delegation - इंटरनेशनल स्टैंडर्ड)
        document.body.addEventListener('input', (e) => {
            // केवल इनपुट, टेक्स्टएरिया और सिलेक्ट एलिमेंट्स को टारगेट करें
            if (e.target.matches('input, textarea, select')) {
                // या तो dataset.stateKey देखें, या फिर id/name से मैप करें
                const key = e.target.dataset.stateKey || e.target.id || e.target.name;
                
                if (key) {
                    // अगर एलिमेंट किसी डायनामिक लाइन आइटम (Array) का हिस्सा है
                    if (e.target.dataset.itemIndex !== undefined) {
                        const index = parseInt(e.target.dataset.itemIndex, 10);
                        const field = e.target.dataset.itemField;
                        
                        if (store.state.items && store.state.items[index]) {
                            store.state.items[index][field] = e.target.value;
                        }
                    } else {
                        // नॉर्मल ग्लोबल स्टेट फील्ड्स के लिए (जैसे docNumber, companyName आदि)
                        // 'syncFieldsMap' की मैपिंग को भी सपोर्ट करने के लिए बैकअप चेक
                        let stateKey = key;
                        
                        // अगर HTML ID 'doc-number' जैसी है, तो उसे 'docNumber' में बदलें (CamelCase)
                        if (key.includes('-')) {
                            stateKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                        }
                        
                        // कुछ विशेष फील्ड्स जो आईडी मैपिंग से अलग हो सकती हैं
                        const specialMaps = {
                            'doc-type': 'docType',
                            'doc-status': 'status',
                            'prof-company-name': 'companyName',
                            'prof-company-address': 'companyAddress',
                            'invoice-notes': 'notes',
                            'invoice-terms': 'terms',
                            'prof-company-tax-id': 'companyTaxId',
                            'client-tax-id': 'clientTaxId',
                            'payment-link-input': 'paymentLink',
                            'tax-name-input': 'taxName'
                        };
                        
                        if (specialMaps[key]) {
                            stateKey = specialMaps[key];
                        }

                        store.state[stateKey] = e.target.value;
                    }
                    
                    // बिना पेज रिफ्रेश किए प्रीव्यू को तुरंत रेंडर और री-कैलकुलेट करें
                    renderPreview();
                }
            }
        });

        // 4. फाइल अपलोड्स (Logo और Signature) के लिए डायनामिक चेंज लिसनर्स
        // नोट: स्टेट के वेरिएबल्स को 'preview-manager.js' के साथ मैच कर दिया गया है
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
                        store.state.logoDataUrl = event.target.result; // 'logoDataUrl' से मैच किया
                        renderPreview();
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
                        store.state.sigDataUrl = event.target.result; // 'sigDataUrl' से मैच किया
                        renderPreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // पेज लोड होने पर पहली बार डिफ़ॉल्ट प्रीव्यू रेंडर करें
        renderPreview(); 
    }
});
