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
        
        // 3. रियल-टाइम डायनामिक सिंक (Event Delegation के साथ - इंटरनेशनल स्टैंडर्ड)
        // यह पैरेंट कंटेनर पर नजर रखता है ताकि बाद में जुड़ने वाली 'Line Items' भी तुरंत सिंक हों
        document.body.addEventListener('input', (e) => {
            // केवल इनपुट, टेक्स्टएरिया और सिलेक्ट एलिमेंट्स को टारगेट करें
            if (e.target.matches('input, textarea, select')) {
                const key = e.target.dataset.stateKey || e.target.name || e.target.id;
                
                if (key) {
                    // अगर एलिमेंट किसी डायनामिक लाइन आइटम (Array) का हिस्सा है
                    if (e.target.dataset.itemIndex !== undefined) {
                        const index = parseInt(e.target.dataset.itemIndex, 10);
                        const field = e.target.dataset.itemField;
                        
                        if (store.state.items && store.state.items[index]) {
                            store.state.items[index][field] = e.target.value;
                        }
                    } else {
                        // नॉर्मल ग्लोबल स्टेट फील्ड्स के लिए (जैसे Company Name, Dates, Notes आदि)
                        if (key in store.state) {
                            store.state[key] = e.target.value;
                        }
                    }
                    
                    // बिना पेज रिफ्रेश किए प्रीव्यू को तुरंत रेंडर और री-कैलकुलेट करें
                    renderPreview();
                }
            }
        });

        // 4. फाइल अपलोड्स (Logo और Signature) के लिए डायनामिक चेंज लिसनर्स
        const logoUpload = document.getElementById('logo-upload');
        if (logoUpload) {
            logoUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        store.state.logoUrl = event.target.result; // Base64 स्ट्रिंग स्टेट में सेव करें
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
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        store.state.signatureUrl = event.target.result; // Base64 स्ट्रिंग स्टेट में सेव करें
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
