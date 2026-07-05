/* ================= SYSTEM CONFIGURATION ================= */
const AppConfig = {
    appName: 'Enterprise Invoice SaaS',
    version: '3.2.0',
    debugMode: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    maxHistoryStates: 100,
    defaultCurrencySym: '$',
    defaultCurrencyCode: 'USD', 
    defaultLocale: 'en-US',
    animationDuration: 150,
    storagePrefix: 'erp_inv_v3_'
};

/* ================= UTILITIES & LOGGING ================= */
const Logger = {
    info: (msg, ...args) => { if (AppConfig.debugMode) console.info(`[INFO] ${msg}`, ...args); },
    warn: (msg, ...args) => { if (AppConfig.debugMode) console.warn(`[WARN] ${msg}`, ...args); },
    error: (msg, ...args) => { console.error(`[ERROR] ${msg}`, ...args); }
};

const Sanitizer = {
    escapeHTML: (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));
    },
    sanitizeObject: (obj) => {
        if (typeof obj !== 'object' || obj === null) return Sanitizer.escapeHTML(obj);
        if (Array.isArray(obj)) return obj.map(Sanitizer.sanitizeObject);
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = typeof value === 'string' ? Sanitizer.escapeHTML(value) : Sanitizer.sanitizeObject(value);
        }
        return sanitized;
    }
};

const Utility = {
    getEl: (id) => document.getElementById(id),
    getVal: (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; },
    generateId: () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    debounce: (func, delay = 300) => {
        let timeoutId;
        return (...args) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func.apply(null, args), delay); };
    },
    throttle: (func, limit = 100) => {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) { func.apply(null, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); }
        };
    },
    formatDate: (dStr, locale = AppConfig.defaultLocale) => {
        if (!dStr) return '';
        try { return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dStr)); }
        catch (e) { return dStr; }
    },
    formatCurrency: (amount, locale = AppConfig.defaultLocale) => {
        return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    },
    numberToWords: (amount) => {
        if (amount === 0) return 'Zero';
        if (amount < 0) return 'Negative ' + Utility.numberToWords(Math.abs(amount));
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
        let word = '', numInt = Math.floor(amount), decimal = Math.round((amount - numInt) * 100);
        if (numInt === 0) word = 'Zero';
        else {
            let scaleIdx = 0;
            while (numInt > 0) {
                let chunk = numInt % 1000;
                if (chunk > 0) {
                    let chunkWord = '';
                    if (chunk > 99) { chunkWord += ones[Math.floor(chunk / 100)] + ' Hundred '; chunk %= 100; }
                    if (chunk > 19) { chunkWord += tens[Math.floor(chunk / 10)] + ' '; chunk %= 10; }
                    if (chunk > 0) chunkWord += ones[chunk] + ' ';
                    word = chunkWord + scales[scaleIdx] + ' ' + word;
                }
                numInt = Math.floor(numInt / 1000);
                scaleIdx++;
            }
        }
        return word.trim() + (decimal > 0 ? ` and ${decimal}/100` : '') + ' Only';
    }
};

/* ================= INTERNATIONALIZATION (i18n) ================= */
const I18nManager = {
    currentLang: 'en',
    dictionaries: { en: { dir: 'ltr', loading: 'Processing request...', saved: 'Saved successfully', validationErr: 'Validation Error:', deleted: 'Item deleted', copied: 'Copied to clipboard!', duplicateSuccess: 'Invoice duplicated' } },
    t: (key) => I18nManager.dictionaries[I18nManager.currentLang][key] || key,
    setLanguage: (lang) => {
        if (!I18nManager.dictionaries[lang]) return;
        I18nManager.currentLang = lang; document.documentElement.lang = lang; document.documentElement.dir = I18nManager.dictionaries[lang].dir;
    }
};

/* ================= ENTERPRISE DOM ENGINE ================= */
const DOM = {
    create: (tag, attributes = {}, children = []) => {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className' && value) el.className = value;
            else if (key === 'dataset' && typeof value === 'object') Object.entries(value).forEach(([dKey, dVal]) => el.dataset[dKey] = dVal);
            else if (key === 'style' && typeof value === 'object') Object.entries(value).forEach(([sKey, sVal]) => el.style[sKey] = sVal);
            else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.substring(2).toLowerCase(), value);
            else if (value !== null && value !== undefined) {
                el.setAttribute(key, value);
                if (['value', 'checked', 'type', 'id', 'src', 'alt', 'placeholder', 'title', 'role', 'aria-label'].includes(key)) el[key] = value;
            }
        }
        children.forEach(child => {
            if (typeof child === 'string' || typeof child === 'number') el.appendChild(document.createTextNode(String(child)));
            else if (child instanceof Node) el.appendChild(child);
        });
        return el;
    },
    clear: (element) => { if (element) while (element.firstChild) element.removeChild(element.firstChild); }
};

/* ================= VALIDATION ENGINE ================= */
const Validator = {
    isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    isURL: (url) => /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/.test(url),
    isPhone: (phone) => /^[\d\s+\-\(\)]+$/.test(phone),
    isNumeric: (val) => !isNaN(parseFloat(val)) && isFinite(val),
    validateItemBounds: (val, fieldName) => { if (parseFloat(val) < 0) throw new Error(`${fieldName} cannot be negative.`); return true; },
    validateDiscount: (discount, subtotal, isPercent) => {
        const d = parseFloat(discount) || 0;
        if (d < 0) throw new Error('Discount cannot be negative.');
        if (isPercent && d > 100) throw new Error('Discount percentage cannot exceed 100%.');
        if (!isPercent && d > subtotal) throw new Error('Fixed discount cannot exceed subtotal.');
        return true;
    }
};
