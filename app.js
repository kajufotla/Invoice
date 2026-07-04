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
        
        // 3. रियल-टाइम डायनामिक सिंक (बिना किसी फ्रेमवर्क के)
        // यह कोड आपके फॉर्म के हर इनपुट को डिटेक्ट करेगा और टाइप करते ही प्रीव्यू अपडेट करेगा
        const formInputs = document.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const key = e.target.dataset.stateKey || e.target.name || e.target.id;
                
                // स्टेट (Store) को अपडेट करें
                if (key && key in store.state) {
                    store.state[key] = e.target.value;
                }
                
                // बिना पेज रिफ्रेश किए प्रीव्यू को तुरंत रेंडर करें
                renderPreview();
            });
        });

        // पेज लोड होने पर पहली बार डिफ़ॉल्ट प्रीव्यू रेंडर करें
        renderPreview();
    }
});
