// config-data.js
export const firebaseConfig = {
    apiKey: "AIzaSyBURDkNr9TMqzrf0BRx0J4VJVJe_rEJZus",
    authDomain: "invoice-57140.firebaseapp.com",
    projectId: "invoice-57140",
    storageBucket: "invoice-57140.firebasestorage.app",
    messagingSenderId: "138676617410",
    appId: "1:138676617410:web:c9a794133716a3f1e7bb5b",
    measurementId: "G-C4TSL5SZBK"
};

export const dict = {
    en: { dir: 'ltr', invoice: "INVOICE", receipt: "RECEIPT", quote: "QUOTE", from: "From", to: "To", desc: "Description", qty: "Qty", price: "Unit Price", total: "Total", subtotal: "Subtotal", tax: "Tax", discount: "Discount", payment: "Payment Details", due: "Due:", date: "Date:", gtotal: "Total" },
    ur: { dir: 'rtl', invoice: "رسید", receipt: "وصولی", quote: "تخمینہ", from: "کی طرف سے", to: "کے نام", desc: "تفصیل", qty: "تعداد", price: "قیمت", total: "کل", subtotal: "میزان", tax: "ٹیکس", discount: "رعایت", payment: "ادائیگی کی تفصیلات", due: "آخری تاریخ:", date: "تاریخ:", gtotal: "کل رقم" }
};

export const defaultState = {
    id: null,
    docType: 'Invoice', currency: 'USD', region: 'USA',
    docNumber: 'INV-1001', date: new Date().toISOString().split('T')[0], dueDate: '',
    senderDetails: 'My Company LLC\nNew York, NY 10001',
    clientDetails: 'Acme Corp\nSan Francisco, CA 94105',
    paymentDetails: '',
    items: [{ id: crypto.randomUUID(), desc: 'Web Development Services', qty: 1, price: 1500.00 }],
    discountType: 'fixed', discountValue: 0, taxRateManual: 0, status: 'Pending', template_id: 'classic',
    logoDataUrl: null, sigDataUrl: null, uploadedQrDataUrl: null, showQR: false, lang: 'en',
    notes: '', terms: '', paymentLinks: { stripe: '', paypal: '', wise: '', bank: '' }
};
