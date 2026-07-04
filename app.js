import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { defaultState } from "./config-data.js";
import "./firebase-auth.js"; 
import { store, loadAppData } from "./invoice-manager.js";
import { checkPublicInvoice, renderPreview, setupPreviewAndExportListeners, initPreviewManager } from "./preview-manager.js";
import { showToast, syncDOMWithState, updateClientDropdown, updateProductDatalist, updateDashboard, loadCompanyProfile, renderItemsEditor, injectDynamicUIElements, setupUIListeners } from "./ui-manager.js";

document.addEventListener('DOMContentLoaded', async () => {
    // Inject cross-module dependencies
    initPreviewManager(showToast);

    // 1. Public Invoice Link Check
    const isPublicView = await checkPublicInvoice();
    if (isPublicView) return; // Halt further app execution if viewing public link

    // 2. Inject Dynamic DOM Elements (Taxes, Backup, Profile)
    injectDynamicUIElements();

    // 3. Load Data & Initialize State
    loadAppData();

    // 4. Sync UI with Loaded State
    syncDOMWithState();
    updateClientDropdown();
    updateProductDatalist();
    updateDashboard();
    loadCompanyProfile();

    // 5. Render App
    renderItemsEditor();
    renderPreview();

    // 6. Bind Event Listeners
    setupUIListeners();
    setupPreviewAndExportListeners();

    // 7. Cloud Sync on Auth Ready
    window.addEventListener('auth-ready', async () => {
        const uid = window.firebaseAuth.currentUser.uid;
        try {
            const docSnap = await getDoc(doc(window.firebaseDb, "users", uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if(data.state) store.state = { ...defaultState, ...JSON.parse(data.state) };
                if(data.library) store.library = { clients: [], products: [], history: [], ...JSON.parse(data.library) };
                syncDOMWithState();
                updateClientDropdown();
                updateProductDatalist();
                renderItemsEditor();
                renderPreview();
                updateDashboard();
                loadCompanyProfile();
                showToast("Cloud data synced successfully.");
            }
        } catch(e) { console.error("Cloud load error", e); }
    });
});
