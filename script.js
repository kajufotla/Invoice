<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise SaaS Invoice Generator</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <style>
        /* === THEME & VARIABLES === */ 
        :root {
            --bg-body: #F1F5F9;
            --bg-sidebar: #FFFFFF;
            --bg-card: #FFFFFF;
            --bg-input: #F8FAFC;
            --border-color: #E2E8F0;
            --text-main: #0F172A;
            --text-muted: #64748B;
            --primary: #4F46E5;
            --primary-hover: #4338CA;
            --danger: #EF4444;
            --success: #10B981;
            --warning: #F59E0B;
            
            /* Print Variables */
            --inv-color: #4F46E5;
            --inv-font: 'Inter', sans-serif;
            --radius-sm: 6px;
            --radius-md: 10px;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
            --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        body.dark-mode {
            --bg-body: #0F172A;
            --bg-sidebar: #1E293B;
            --bg-card: #334155;
            --bg-input: #0F172A;
            --border-color: #475569;
            --text-main: #F8FAFC;
            --text-muted: #94A3B8;
        }

        /* === GLOBAL RESET === */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-body); color: var(--text-main); display: flex; flex-direction: column; height: 100vh; overflow: hidden; transition: background-color 0.3s; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        
        /* === GLOBAL TOP NAV (QUICK MODE) === */
        .top-nav-global { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: var(--bg-sidebar); border-bottom: 1px solid var(--border-color); z-index: 20; box-shadow: var(--shadow-sm); }
        .nav-brand { font-weight: 700; font-size: 15px; color: var(--text-main); display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* === LAYOUT === */
        .app-container { display: flex; width: 100%; flex: 1; overflow: hidden; position: relative; }
        
        /* === SIDEBAR (EDITOR) === */
        .sidebar { width: 480px; min-width: 400px; background: var(--bg-sidebar); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; z-index: 10; box-shadow: var(--shadow-sm); transition: transform 0.3s ease, margin-left 0.3s ease; }
        .sidebar.hidden { margin-left: -480px; } 
        .sidebar-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-sidebar); }
        .sidebar-header h1 { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; color: var(--text-main); }
        .mobile-close-btn { display: none; }
        
        /* Tabs */
        .tabs-wrapper { display: flex; overflow-x: auto; border-bottom: 1px solid var(--border-color); background: var(--bg-sidebar); padding: 0 10px; flex-shrink: 0; }
        .tab-btn { padding: 14px 16px; background: none; border: none; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; white-space: nowrap; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn:hover { color: var(--text-main); }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

        /* Content Area */
        .tab-content { flex: 1; overflow-y: auto; padding: 20px; background: var(--bg-body); }
        .tab-pane { display: none; animation: fadeIn 0.2s ease-out; }
        .tab-pane.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        /* Cards & Forms */
        .card { background: var(--bg-card); border-radius: var(--radius-md); padding: 20px; margin-bottom: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .card-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
        .card-footer { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        .form-group { display: flex; flex-direction: column; }
        .form-group.full { grid-column: 1 / -1; }
        .form-group label { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
        .input-control { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 13px; font-family: inherit; background: var(--bg-input); color: var(--text-main); transition: all 0.2s; width: 100%; }
        .input-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); }
        .input-group { display: flex; gap: 8px; }

        /* Buttons */
        .btn { padding: 10px 16px; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; user-select: none; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
        .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-main); }
        .btn-outline:hover { background: var(--bg-input); }
        .btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .btn-danger:hover { background: var(--danger); color: #fff; }
        .btn-sm { padding: 6px 10px; font-size: 12px; }
        .btn-icon { padding: 8px; border-radius: var(--radius-sm); background: transparent; border: 1px solid var(--border-color); cursor: pointer; color: var(--text-muted); }
        .btn-icon:hover { background: var(--bg-input); color: var(--text-main); }

        /* Advanced Items Manager */
        .item-list { display: flex; flex-direction: column; gap: 12px; }
        .item-row { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow 0.2s; }
        .item-row:hover { border-color: #CBD5E1; box-shadow: var(--shadow-sm); }
        .item-row.drag-ghost { opacity: 0.5; background: #F8FAFC; border: 2px dashed var(--primary); }
        .item-main { display: grid; grid-template-columns: 24px 3fr 1fr 1fr auto; gap: 8px; align-items: center; } 
        .drag-handle { cursor: grab; color: #94A3B8; text-align: center; }
        .item-meta { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color); }
        .item-total-display { font-weight: 700; font-size: 13px; text-align: right; padding-right: 8px; color: var(--primary); }

        /* Toast Notifications */
        .toast-container { position: fixed; bottom: 20px; left: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; }
        .toast { background: #1E293B; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); animation: slideIn 0.3s, fadeOut 0.5s 2.5s forwards; }
        @keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { to { opacity: 0; visibility: hidden; } }

        /* === PREVIEW AREA & TOOLBAR === */
        .main-content { flex: 1; display: flex; flex-direction: column; background: #CBD5E1; overflow: hidden; }
        
        /* Top Toolbar */
        .top-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #fff; border-bottom: 1px solid var(--border-color); z-index: 5; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .toolbar-actions { display: flex; gap: 10px; }

        .preview-wrapper { flex: 1; overflow-y: auto; padding: 40px; display: flex; justify-content: center; align-items: flex-start; }
        
        /* A4 Corporate Template */
        .a4-paper {
            width: 210mm; min-height: 297mm; background: #ffffff;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            padding: 20mm; margin: 0 auto; position: relative;
            font-family: var(--inv-font); color: #1E293B; line-height: 1.5;
        }

        /* Header */
        .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
        .logo-container { width: 150px; min-height: 50px; display: flex; align-items: flex-start; margin-bottom: 15px; cursor: pointer; }
        .logo-container img { max-width: 100%; max-height: 90px; object-fit: contain; }
        .logo-placeholder { width: 100%; height: 60px; background: #F1F5F9; border: 1px dashed #94A3B8; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px; font-weight: 600; border-radius: 4px; transition: 0.2s; }
        .logo-placeholder:hover { background: #E2E8F0; border-color: var(--primary); color: var(--primary); }
        
        .company-info h2 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; }
        .company-info p { font-size: 11px; color: #475569; margin: 2px 0; }
        
        .invoice-title-sec { text-align: right; }
        .invoice-title { font-size: 40px; font-weight: 800; color: var(--inv-color); margin: 0; text-transform: uppercase; letter-spacing: -1px; line-height: 1; }
        .invoice-number { font-size: 16px; font-weight: 700; color: #334155; margin-top: 8px; }

        /* Meta Grid */
        .meta-details { display: grid; grid-template-columns: repeat(2, auto); gap: 12px 30px; margin-top: 20px; background: #F8FAFC; padding: 15px; border-radius: 8px; text-align: left; border-left: 4px solid var(--inv-color); }
        .meta-item { display: flex; flex-direction: column; }
        .meta-lbl { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; }
        .meta-val { font-size: 12px; font-weight: 600; color: #0F172A; }

        /* Addresses */
        .address-section { display: flex; justify-content: space-between; margin-bottom: 30px; padding-top: 25px; border-top: 2px solid #E2E8F0; }
        .address-block { width: 45%; }
        .address-lbl { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--inv-color); margin-bottom: 10px; letter-spacing: 0.5px; }
        .address-name { font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
        .address-text { font-size: 11px; color: #475569; }

        /* Table */
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .inv-table th { background: var(--inv-color); color: #fff; padding: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; text-align: left; letter-spacing: 0.5px; }
        .inv-table th.right { text-align: right; }
        .inv-table th.center { text-align: center; }
        .inv-table td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 11px; color: #334155; vertical-align: top; }
        .inv-table td.right { text-align: right; }
        .inv-table td.center { text-align: center; }
        .inv-table tr { page-break-inside: avoid; }
        .td-item-name { font-size: 12px; font-weight: 600; color: #0F172A; display: block; margin-bottom: 2px; }
        .td-item-desc { font-size: 10px; color: #64748B; display: block; }
        .td-item-meta { font-size: 9px; color: #94A3B8; margin-top: 4px; display: block; font-style: italic; }

        /* Summary */
        .summary-wrapper { display: flex; justify-content: space-between; align-items: flex-start; page-break-inside: avoid; margin-bottom: 20px; }
        .notes-area { width: 55%; }
        .info-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
        .info-title { font-size: 10px; font-weight: 700; color: var(--inv-color); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
        .info-content { font-size: 10px; color: #475569; white-space: pre-wrap; line-height: 1.5; }

        .totals-area { width: 40%; margin-left: auto; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 11px; color: #475569; border-bottom: 1px solid #E2E8F0; }
        .total-row:last-child { border-bottom: none; }
        .total-row span:last-child { font-weight: 600; color: #0F172A; font-size: 12px; }
        .grand-total { background: var(--inv-color); color: #fff; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .grand-total span:first-child { font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .grand-total span:last-child { font-size: 18px; font-weight: 800; }
        .words-amt { font-size: 9px; color: #64748B; font-style: italic; text-align: right; margin-top: 6px; }

        /* T&C and Notes Grid */
        .bottom-notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; page-break-inside: avoid; }
        .bottom-notes-grid .info-box { margin-bottom: 0; }

        /* Footer & Signatures */
        .doc-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; page-break-inside: avoid; }
        .verification-zone { display: flex; gap: 15px; align-items: center; }
        .qr-box { width: 70px; height: 70px; }
        
        .signature-zone { display: flex; gap: 30px; align-items: flex-end; }
        .stamp-box img { max-width: 80px; max-height: 80px; opacity: 0.7; mix-blend-mode: multiply; }
        
        /* Updated Signature Box for Landscape/Bigger */
        .sign-box { text-align: center; width: 250px; cursor: pointer; } 
        .sign-img { max-height: 100px; max-width: 100%; margin-bottom: 5px; object-fit: contain; } 
        .sign-line { border-top: 1px dashed #94A3B8; margin-bottom: 5px; padding-top: 10px; color: #94A3B8; font-size: 10px; transition: 0.2s; }
        .sign-box:hover .sign-line { border-top-color: var(--primary); color: var(--primary); }
        .sign-name { font-size: 11px; font-weight: 700; color: #0F172A; }
        .sign-role { font-size: 9px; color: #64748B; }

        .footer-msg { text-align: center; font-size: 9px; color: #94A3B8; margin-top: 30px; }
        .color-strip { position: absolute; bottom: 0; left: 0; right: 0; height: 8px; background: var(--inv-color); }

        /* Save Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.7); display: none; z-index: 9999; justify-content: center; align-items: center; animation: fadeIn 0.2s; }
        .modal-overlay.active { display: flex; }
        .modal-box { background: #fff; padding: 25px; border-radius: var(--radius-md); width: 400px; max-width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; }
        .modal-box h3 { margin-bottom: 15px; color: var(--text-main); }
        .modal-box p { color: var(--text-muted); font-size: 14px; margin-bottom: 10px; }
        .modal-details { background: var(--bg-input); padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left; }

        /* Floating Actions */
        .fab-container { position: fixed; bottom: 30px; right: 40px; display: flex; gap: 12px; z-index: 100; }
        .fab-container .btn { padding: 14px 24px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); border-radius: 30px; }
        
        .mobile-open-btn { display: none; }

        /* Responsive & Print Specifics */
        @media (max-width: 768px) {
            .sidebar { position: fixed; height: 100%; left: 0; top: 0; transform: translateX(0); z-index: 1000; box-shadow: 5px 0 15px rgba(0,0,0,0.1); width: 100%; min-width: unset; }
            .sidebar.hidden { transform: translateX(-100%); margin-left: 0; }
            .mobile-close-btn { display: block; border: none; background: transparent; font-size: 20px; color: var(--text-main); cursor: pointer; }
            
            .mobile-open-btn { display: flex; position: fixed; bottom: 20px; left: 20px; z-index: 99; border-radius: 50px; padding: 14px 24px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
            
            .fab-container { flex-direction: column; right: 20px; bottom: 20px; }
            .top-toolbar .toolbar-actions { display: none; } /* Hide heavy actions on top bar for mobile */
        }

        @media print {
            body { background: #fff; display: block; height: auto; overflow: visible; }
            .sidebar, .fab-container, .toast-container, .top-toolbar, .top-nav-global, .mobile-open-btn { display: none !important; }
            .app-container, .main-content { overflow: visible; display: block; background: #fff; }
            .preview-wrapper { padding: 0; background: #fff; overflow: visible; display: block; }
            .a4-paper { box-shadow: none; margin: 0; padding: 0; width: 100%; min-height: auto; }
            .grand-total { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .color-strip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>

    <div class="top-nav-global">
        <div class="nav-brand"><i class="fa-solid fa-bolt" style="color:var(--warning);"></i> Quick Mode</div>
        <button class="btn btn-primary btn-sm" onclick="showToast('Firebase Login will be integrated soon!', 'primary')"><i class="fa-solid fa-user"></i> Login</button>
    </div>

    <div class="app-container">
        
        <div class="sidebar" id="app-sidebar">
            <div class="sidebar-header">
                <h1><i class="fa-solid fa-file-invoice" style="color:var(--primary);"></i> SaaS Invoice Pro</h1>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-icon" onclick="undo()" title="Undo"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="btn btn-icon" onclick="redo()" title="Redo"><i class="fa-solid fa-rotate-right"></i></button>
                    <button class="btn btn-icon" onclick="toggleDarkMode()" title="Dark Mode"><i class="fa-solid fa-moon"></i></button>
                    <button class="mobile-close-btn" onclick="toggleSidebar()"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>

            <div class="tabs-wrapper">
                <button class="tab-btn active" onclick="switchTab('tab-invoice')">Invoice</button>
                <button class="tab-btn" onclick="switchTab('tab-company')">Company</button>
                <button class="tab-btn" onclick="switchTab('tab-client')">Client</button>
                <button class="tab-btn" onclick="switchTab('tab-items')">Items</button>
                <button class="tab-btn" onclick="switchTab('tab-payment')">Payment</button>
                <button class="tab-btn" onclick="switchTab('tab-notes')">Notes</button>
                <button class="tab-btn" onclick="switchTab('tab-branding')">Branding</button>
            </div>

            <div class="tab-content" id="form-container">
                
                <div id="tab-invoice" class="tab-pane active">
                    <div class="card">
                        <div class="card-header"><span class="card-title">Document Details</span></div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Document Type</label>
                                <select class="input-control" id="f-doc-type" onchange="sync()">
                                    <option value="TAX INVOICE">Tax Invoice</option>
                                    <option value="PROFORMA INVOICE">Proforma Invoice</option>
                                    <option value="RECEIPT">Receipt</option>
                                    <option value="ESTIMATE">Estimate / Quote</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Invoice Number</label>
                                <div class="input-group">
                                    <input type="text" class="input-control" id="f-inv-num" oninput="sync()">
                                    <button class="btn btn-outline btn-icon" onclick="generateInvoiceNumber()" title="Auto Generate"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                                </div>
                            </div>
                            <div class="form-group"><label>Issue Date</label><input type="date" class="input-control" id="f-date" onchange="autoCalcDueDate(); sync()"></div>
                            <div class="form-group"><label>Payment Terms</label>
                                <select class="input-control" id="f-terms" onchange="autoCalcDueDate()">
                                    <option value="0">Due on Receipt</option>
                                    <option value="7">Net 7</option>
                                    <option value="15">Net 15</option>
                                    <option value="30">Net 30</option>
                                    <option value="45">Net 45</option>
                                    <option value="60">Net 60</option>
                                    <option value="custom">Custom Date</option>
                                </select>
                            </div>
                            <div class="form-group"><label>Due Date</label><input type="date" class="input-control" id="f-due" onchange="sync()"></div>
                            <div class="form-group"><label>P.O. Number</label><input type="text" class="input-control" id="f-po" placeholder="Optional" oninput="sync()"></div>
                            <div class="form-group"><label>Reference No.</label><input type="text" class="input-control" id="f-ref" placeholder="Optional" oninput="sync()"></div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header"><span class="card-title">Regional & Totals Config</span></div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Currency</label>
                                <select class="input-control" id="f-currency" onchange="sync()">
                                    <option value="USD|$">USD ($)</option>
                                    <option value="EUR|€">EUR (€)</option>
                                    <option value="GBP|£">GBP (£)</option>
                                    <option value="AUD|A$">AUD (A$)</option>
                                    <option value="CAD|C$">CAD (C$)</option>
                                    <option value="PKR|Rs ">PKR (Rs)</option>
                                    <option value="INR|₹">INR (₹)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Global Tax Label</label>
                                <select class="input-control" id="f-tax-label" onchange="sync()">
                                    <option value="Tax">Tax</option>
                                    <option value="VAT">VAT</option>
                                    <option value="GST">GST</option>
                                    <option value="Sales Tax">Sales Tax</option>
                                </select>
                            </div>
                            <div class="form-group"><label>Global Tax (%)</label><input type="number" class="input-control" id="f-global-tax" value="" placeholder="0" min="0" oninput="sync()"></div>
                            <div class="form-group"><label>Global Discount</label>
                                <div class="input-group">
                                    <select class="input-control" id="f-disc-type" style="width:70px;" onchange="sync()"><option value="fixed">Fixed</option><option value="percent">%</option></select>
                                    <input type="number" class="input-control" id="f-disc-val" value="" placeholder="0" min="0" oninput="sync()">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="tab-company" class="tab-pane">
                    <div class="card">
                        <div class="card-header"><span class="card-title">My Company Profiles</span></div>
                        <div class="input-group" style="margin-bottom:16px;">
                            <select class="input-control" id="db-company" onchange="loadProfile('company')"><option value="">-- Select Saved Profile --</option></select>
                            <button class="btn btn-danger btn-icon" onclick="deleteProfile('company')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="form-grid">
                            <div class="form-group full"><label>Business Name</label><input type="text" class="input-control" id="c-name" oninput="sync()"></div>
                            <div class="form-group full"><label>Address Line 1</label><input type="text" class="input-control" id="c-addr1" oninput="sync()"></div>
                            <div class="form-group full"><label>Address Line 2 (City, Zip, Country)</label><input type="text" class="input-control" id="c-addr2" oninput="sync()"></div>
                            <div class="form-group"><label>Email</label><input type="email" class="input-control" id="c-email" oninput="sync()"></div>
                            <div class="form-group"><label>Phone</label><input type="text" class="input-control" id="c-phone" oninput="sync()"></div>
                            <div class="form-group"><label>Website</label><input type="text" class="input-control" id="c-web" oninput="sync()"></div>
                            <div class="form-group"><label>Tax/VAT Number</label><input type="text" class="input-control" id="c-taxid" oninput="sync()"></div>
                            <div class="form-group"><label>Business Reg. No.</label><input type="text" class="input-control" id="c-reg" oninput="sync()"></div>
                        </div>
                        
                        <div class="card-header" style="margin-top:20px;"><span class="card-title">Quick Uploads</span></div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Company Logo</label>
                            <input type="file" id="up-logo-comp" class="input-control" accept="image/*" onchange="handleImageUpload(this, 'img-logo')">
                        </div>
                        <div class="form-group full">
                            <label>Authorized Signature</label>
                            <input type="file" id="up-sign-comp" class="input-control" accept="image/*" onchange="handleImageUpload(this, 'img-sign')">
                        </div>

                        <div class="card-footer"><button class="btn btn-outline" onclick="saveProfile('company')"><i class="fa-solid fa-cloud-arrow-up"></i> Save Company Profile</button></div>
                    </div>
                </div>

                <div id="tab-client" class="tab-pane">
                    <div class="card">
                        <div class="card-header"><span class="card-title">Client Database</span></div>
                        <div class="input-group" style="margin-bottom:16px;">
                            <select class="input-control" id="db-client" onchange="loadProfile('client')"><option value="">-- Select Saved Client --</option></select>
                            <button class="btn btn-danger btn-icon" onclick="deleteProfile('client')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="form-grid">
                            <div class="form-group full"><label>Client / Company Name</label><input type="text" class="input-control" id="cli-name" oninput="sync()"></div>
                            <div class="form-group full"><label>Address Line 1</label><input type="text" class="input-control" id="cli-addr1" oninput="sync()"></div>
                            <div class="form-group full"><label>Address Line 2 (City, Zip, Country)</label><input type="text" class="input-control" id="cli-addr2" oninput="sync()"></div>
                            <div class="form-group"><label>Contact Person</label><input type="text" class="input-control" id="cli-contact" oninput="sync()"></div>
                            <div class="form-group"><label>Email</label><input type="email" class="input-control" id="cli-email" oninput="sync()"></div>
                            <div class="form-group"><label>Phone</label><input type="text" class="input-control" id="cli-phone" oninput="sync()"></div>
                            <div class="form-group"><label>Tax ID / VAT No</label><input type="text" class="input-control" id="cli-taxid" oninput="sync()"></div>
                        </div>
                        <div class="card-footer"><button class="btn btn-outline" onclick="saveProfile('client')"><i class="fa-solid fa-user-plus"></i> Save Client Profile</button></div>
                    </div>
                </div>

                <div id="tab-items" class="tab-pane">
                    <div class="card">
                        <div class="card-header">
                            <span class="card-title">Line Items</span>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-sm btn-outline" onclick="items.forEach(i=>i.showAdv=!i.showAdv); renderItems();"><i class="fa-solid fa-sliders"></i> Toggle Advanced</button>
                            </div>
                        </div>
                        <div id="items-container" class="item-list"></div>
                        <div style="margin-top: 16px; display:flex; gap:10px;">
                            <button class="btn btn-outline" style="flex:1;" onclick="addItem()"><i class="fa-solid fa-plus"></i> Add Line Item</button>
                            <button class="btn btn-outline" style="flex:1;" onclick="clearItems()"><i class="fa-solid fa-eraser"></i> Clear All</button>
                        </div>
                    </div>
                </div>

                <div id="tab-payment" class="tab-pane">
                    <div class="card">
                        <div class="card-header"><span class="card-title">Payment Configurations</span></div>
                        <div class="input-group" style="margin-bottom:16px;">
                            <select class="input-control" id="db-payment" onchange="loadProfile('payment')"><option value="">-- Load Saved Payment Profile --</option></select>
                            <button class="btn btn-danger btn-icon" onclick="deleteProfile('payment')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Payment Gateway / Method</label>
                            <select class="input-control" id="p-method" onchange="renderPaymentFields()">
                                <option value="bank">Bank Transfer (Wire / ACH)</option>
                                <option value="paypal">PayPal</option>
                                <option value="stripe">Stripe</option>
                                <option value="wise">Wise</option>
                                <option value="payoneer">Payoneer</option>
                                <option value="crypto">Cryptocurrency</option>
                                <option value="easypaisa">EasyPaisa / JazzCash</option>
                                <option value="custom">Custom Instructions</option>
                            </select>
                        </div>

                        <div id="payment-dynamic-fields" class="form-grid"></div>
                        
                        <div class="card-footer"><button class="btn btn-outline" onclick="saveProfile('payment')"><i class="fa-solid fa-credit-card"></i> Save Payment Profile</button></div>
                    </div>
                </div>

                <div id="tab-notes" class="tab-pane">
                    <div class="card">
                        <div class="card-header"><span class="card-title">Document Notes & Terms</span></div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Public Notes (Thank you message)</label>
                            <textarea class="input-control" id="n-public" rows="3" oninput="sync()"></textarea>
                        </div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Terms & Conditions</label>
                            <textarea class="input-control" id="n-terms" rows="4" oninput="sync()"></textarea>
                        </div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Footer Message (Centered at bottom)</label>
                            <input type="text" class="input-control" id="n-footer" oninput="sync()">
                        </div>
                        <div class="form-group full">
                            <label>Internal Memo (Not printed)</label>
                            <textarea class="input-control" id="n-internal" rows="2"></textarea>
                        </div>
                        <div class="card-footer"><button class="btn btn-outline" onclick="saveProfile('notes')"><i class="fa-solid fa-file-lines"></i> Save Notes Profile</button></div>
                    </div>
                </div>

                <div id="tab-branding" class="tab-pane">
                    <div class="card">
                        <div class="card-header"><span class="card-title">Visual Identity</span></div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Brand Color</label>
                                <input type="color" id="b-color" class="input-control" value="#4F46E5" style="height:42px; padding:2px; cursor:pointer;" oninput="applyBranding()">
                            </div>
                            <div class="form-group">
                                <label>Typography</label>
                                <select class="input-control" id="b-font" onchange="applyBranding()">
                                    <option value="'Inter', sans-serif">Inter (Modern & Clean)</option>
                                    <option value="'Roboto', sans-serif">Roboto (Corporate)</option>
                                    <option value="'Open Sans', sans-serif">Open Sans (Classic)</option>
                                    <option value="Times New Roman, serif">Times New Roman (Formal)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header"><span class="card-title">Media Uploads</span></div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Company Logo</label>
                            <input type="file" id="up-logo" class="input-control" accept="image/*" onchange="handleImageUpload(this, 'img-logo')">
                        </div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Authorized Signature</label>
                            <input type="file" id="up-sign" class="input-control" accept="image/*" onchange="handleImageUpload(this, 'img-sign')">
                        </div>
                        <div class="form-group full" style="margin-bottom:16px;">
                            <label>Company Stamp / Seal</label>
                            <input type="file" id="up-stamp" class="input-control" accept="image/*" onchange="handleImageUpload(this, 'img-stamp')">
                        </div>
                        <div class="form-grid">
                            <div class="form-group"><label>Signatory Name</label><input type="text" class="input-control" id="b-sign-name" oninput="sync()"></div>
                            <div class="form-group"><label>Signatory Role</label><input type="text" class="input-control" id="b-sign-role" oninput="sync()"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="main-content">
            <div class="top-toolbar">
                <button class="btn btn-outline" onclick="toggleSidebar()"><i class="fa-solid fa-bars"></i> Edit Panel</button>
                <div class="toolbar-actions">
                    <button class="btn btn-outline" onclick="showHistory()"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
                    <button class="btn btn-outline" onclick="shareInvoice()"><i class="fa-solid fa-share-nodes"></i> Share</button>
                    <button class="btn btn-outline" onclick="mailInvoice()"><i class="fa-solid fa-envelope"></i> Mail</button>
                    <button class="btn btn-primary" onclick="saveInvoiceData()"><i class="fa-solid fa-floppy-disk"></i> Save</button>
                </div>
            </div>

            <div class="preview-wrapper" id="preview-area">
                <div class="a4-paper" id="invoice-render">
                    
                    <div class="doc-header">
                        <div class="left-col">
                            <div class="logo-container" onclick="document.getElementById('up-logo-comp').click()" title="Click to upload logo">
                                <img id="img-logo" src="" style="display:none;">
                                <div class="logo-placeholder" id="logo-placeholder"><i class="fa-solid fa-image" style="margin-right:5px;"></i> UPLOAD LOGO</div>
                            </div>
                            <div class="company-info">
                                <h2 id="out-c-name">Acme Corporation</h2>
                                <p id="out-c-addr1">123 Corporate Blvd, Suite 400</p>
                                <p id="out-c-addr2">New York, NY 10001, USA</p>
                                <p>E: <span id="out-c-email">billing@acme.com</span> | P: <span id="out-c-phone">+1 (555) 123-4567</span></p>
                                <p id="out-c-web">www.acme.com</p>
                                <p id="wrap-c-taxid"><strong>Tax ID:</strong> <span id="out-c-taxid">US-987654321</span></p>
                                <p id="wrap-c-reg"><strong>Reg No:</strong> <span id="out-c-reg"></span></p>
                            </div>
                        </div>
                        <div class="invoice-title-sec">
                            <h1 class="invoice-title" id="out-doc-type">TAX INVOICE</h1>
                            <div class="invoice-number" id="out-inv-num">INV-2026-0001</div>
                            
                            <div class="meta-details">
                                <div class="meta-item"><span class="meta-lbl">Date Issued</span><span class="meta-val" id="out-date">01 Jan 2026</span></div>
                                <div class="meta-item"><span class="meta-lbl">Due Date</span><span class="meta-val" id="out-due">15 Jan 2026</span></div>
                                <div class="meta-item" id="wrap-po"><span class="meta-lbl">P.O. Number</span><span class="meta-val" id="out-po"></span></div>
                                <div class="meta-item" id="wrap-ref"><span class="meta-lbl">Reference No</span><span class="meta-val" id="out-ref"></span></div>
                            </div>
                        </div>
                    </div>

                    <div class="address-section">
                        <div class="address-block">
                            <div class="address-lbl">Billed To</div>
                            <div class="address-name" id="out-cli-name">Globex Inc.</div>
                            <div class="address-text">
                                <p id="out-cli-addr1">456 Global Way</p>
                                <p id="out-cli-addr2">San Francisco, CA 94107</p>
                                <p id="wrap-cli-contact" style="margin-top:4px;">Attn: <strong id="out-cli-contact">John Smith</strong></p>
                                <p id="wrap-cli-email">E: <span id="out-cli-email">accounts@globex.com</span></p>
                                <p id="wrap-cli-phone">P: <span id="out-cli-phone"></span></p>
                                <p id="wrap-cli-taxid" style="margin-top:4px;">Tax ID: <strong id="out-cli-taxid"></strong></p>
                            </div>
                        </div>
                    </div>

                    <table class="inv-table">
                        <thead>
                            <tr>
                                <th style="width:45%;">Description</th>
                                <th class="center" style="width:10%;">Qty</th>
                                <th class="right" style="width:15%;">Price</th>
                                <th class="right" style="width:15%;" id="th-tax">Tax/Disc</th>
                                <th class="right" style="width:15%;">Total</th>
                            </tr>
                        </thead>
                        <tbody id="out-items-body">
                            </tbody>
                    </table>

                    <div class="summary-wrapper">
                        <div class="notes-area">
                            <div class="info-box" id="wrap-pay">
                                <div class="info-title">Payment Details</div>
                                <div class="info-content" id="out-payment"></div>
                            </div>
                        </div>
                        
                        <div class="totals-area">
                            <div class="total-row"><span>Subtotal</span><span id="out-subtotal">$0.00</span></div>
                            <div class="total-row" id="wrap-global-disc" style="color:var(--danger);"><span>Discount</span><span id="out-global-disc">-$0.00</span></div>
                            <div class="total-row" id="wrap-global-tax"><span id="out-tax-label">Tax</span><span id="out-global-tax">$0.00</span></div>
                            
                            <div class="grand-total">
                                <span>Total Due</span>
                                <span id="out-grand">$0.00</span>
                            </div>
                            <div class="words-amt" id="out-words">Zero Only</div>
                        </div>
                    </div>

                    <div class="bottom-notes-grid">
                        <div class="info-box" id="wrap-n-public">
                            <div class="info-title">Notes</div>
                            <div class="info-content" id="out-n-public"></div>
                        </div>
                        <div class="info-box" id="wrap-n-terms">
                            <div class="info-title">Terms & Conditions</div>
                            <div class="info-content" id="out-n-terms"></div>
                        </div>
                    </div>

                    <div class="doc-footer">
                        <div class="verification-zone">
                            <div id="qrcode" class="qr-box"></div>
                            <div style="font-size:8px; font-weight:700; color:#94A3B8; text-transform:uppercase; margin-left:10px;">Scan to Verify Document</div>
                        </div>
                        <div class="signature-zone">
                            <div class="stamp-box" id="wrap-stamp" style="display:none;">
                                <img id="img-stamp" src="">
                                <div style="font-size:9px; color:#64748B; margin-top:4px; text-align:center;">Official Seal</div>
                            </div>
                            <div class="sign-box" onclick="document.getElementById('up-sign-comp').click()" title="Click to upload signature">
                                <img id="img-sign" class="sign-img" src="" style="display:none;">
                                <div class="sign-line" id="sign-placeholder" style="margin-top:40px;">CLICK TO ADD SIGNATURE</div>
                                <div class="sign-name" id="out-sign-name">Authorized Signature</div>
                                <div class="sign-role" id="out-sign-role">Director</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-msg" id="out-n-footer">Thank you for your business.</div>
                    <div class="color-strip"></div>
                </div>
            </div>
        </div>

        <div class="fab-container">
            <button class="btn btn-outline" style="background:#fff;" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>
            <button class="btn btn-primary" onclick="generatePDF()"><i class="fa-solid fa-download"></i> Export PDF</button>
        </div>

        <button class="btn btn-primary mobile-open-btn" onclick="toggleSidebar()"><i class="fa-solid fa-pen"></i> Edit Invoice</button>
        
        <div class="modal-overlay" id="save-modal">
            <div class="modal-box">
                <h3><i class="fa-solid fa-check-circle" style="color:var(--success)"></i> Invoice Saved!</h3>
                <p>Your document has been securely saved to history.</p>
                <div class="modal-details">
                    <div><strong>Invoice No:</strong> <span id="modal-inv-no"></span></div>
                    <div><strong>Client:</strong> <span id="modal-client"></span></div>
                    <div><strong>Total Amount:</strong> <span id="modal-amount"></span></div>
                </div>
                <button class="btn btn-primary" style="width:100%" onclick="document.getElementById('save-modal').classList.remove('active')">Continue Editing</button>
            </div>
        </div>

        <div id="toast-container" class="toast-container"></div>
    </div>

    <script>
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
    </script>
</body>
</html>
