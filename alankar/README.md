# 🪔 Alankar Pooja Stores

**Offline Sales Management System** for Hyderabad-based pooja items shop.
Built with Electron.js + SQLite. Runs 100% offline on Windows.

**Version 1.1 — GST-compliant receipts and reports**

---

## ✨ What's new in v1.1

- 🧾 **"TAX INVOICE" receipts** matching GST law format
- 🆔 **Cashier name** printed on every bill
- 🏢 **Buyer GSTIN field** for B2B sales (temples, hostels, hotels, etc.)
- 📑 **HSN code + GST% printed under each item** on the receipt
- 📊 **GST Breakup table** at bottom of every bill (taxable + CGST + SGST per rate slab)
- 🧮 **GST Returns Report** with Output GST − Input GST = Net Position (Payable/Refundable)
- 📥 **Supplier GSTIN tracking** on stock entries for Input Tax Credit (ITC)
- 🔢 **Sequential bill numbers** — `BILL-000001`, `BILL-000002` (cleaner format)

---

## ✨ Features

| Module | What it does |
|---|---|
| 📊 **Dashboard** | Today's sales, monthly revenue, pending credit, low stock alerts, payment mix, top products |
| 🧾 **Billing** | Quick item add, barcode scan, 4 payment modes (Cash / UPI / Card / Credit), auto GST split, thermal-printer-ready receipts |
| 📦 **Products** | Catalog with categories, HSN, GST rate, barcodes. **Quick-add stock from product row.** CSV export. |
| 📥 **Stock Entry** | Goods received tracking, supplier name, invoice no., cost price updates |
| ⌶ **Barcodes** | Generate, print labels (with MRP), scan & lookup |
| ⏳ **Credit Ledger** | Track customer dues, record payments, outstanding totals |
| 📋 **GST Reports** | Monthly summary by rate slab (0/5/12/18/28%), CGST/SGST split, GSTR-ready printout |
| 📈 **Sales Report** | Filter by date range + payment mode, reprint any old bill |
| 📅 **Monthly Report** | Daily breakdown, payment mix, top products |
| 👥 **Customers** | Auto-tracked status (New → Regular → Loyal), purchase history, credit balance |
| ⚙️ **Settings** | Store name, GSTIN, address, phone, bill footer — all editable. **Database backup.** |

---

## 🚀 Setup on Shop PC (Windows)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version, ~30MB).
Install with defaults.

### Step 2 — Extract this folder
Unzip anywhere (e.g. `C:\AlankarPoojaStores\`).

### Step 3 — Install dependencies
Open Command Prompt in that folder and run:
```
npm install
```
Wait 2-5 minutes (one-time only).

### Step 4 — Run the app
```
npm start
```

### Optional — Build a `.exe` installer
```
npm run build-win
```
Find the installer in the `dist/` folder. Double-click to install with desktop shortcut.

---

## 💾 Where's my data stored?

**Windows:** `C:\Users\<your-username>\AppData\Roaming\alankar-pooja-stores\alankar.db`

**Settings → Backup Database Now** copies this file to any location you choose.
**Always keep a backup on a USB drive or cloud folder.**

---

## 🖨️ Printing Receipts

The app opens the system print dialog when you generate a bill.
For thermal printers (80mm), select your thermal printer in the dialog.
For A4 printers, the bill template auto-fits the page.

---

## 🆕 v1.0.8 - TSPL Direct Printing + GST Inclusive Pricing

**3 major improvements:**

1. **TSPL Direct Label Printing** — labels now print using TSC's native language (bypasses HTML/Windows print issues entirely). Pixel-perfect labels, fast, scannable.
2. **GST Inclusive Pricing Mode** — product price IS the final MRP. Customer pays exactly that amount. GST reverse-calculated for tax reports.
3. **Visual Printer Picker** — Click "Detect Printers" in Settings to see all connected printers as visual cards. Assign one as Bill Printer, one as Label Printer. Bills then print silently (no confusing dialog).

## 🏷️ TSC TE244 Label Printer Setup

The app now supports **TSC TE244 barcode label printer** for product labels.

### Quick setup:

1. **Install TSC driver** — Download from https://www.tscprinters.com → "TE244" → Driver. Install. Connect printer via USB.
2. **Open app → Settings → TSC Label Printer Settings**
3. Default values: 38mm × 25mm × 2-up × 2mm gaps (matches standard Indian retail labels)
4. Click **"🖨 Print Test Label"** → 4 test labels print
5. Check alignment — if labels drift, adjust width/height by ±0.5mm and re-test

### Print labels for a product:

- **Quick:** Products page → click 🏷️ icon next to product → enter quantity → Print
- **Multi-step:** Barcodes page → select product → "Print to TSC TE244 (Multiple Labels)"

When the print dialog opens, **select the TSC TE244 printer** (not your default A4/thermal printer).

### Tips for clean scannable labels:
- Set TSC darkness to **8-12** (out of 15) for crisp black bars
- Use the **A4 fallback mode** if you don't have the TSC ready (prints on regular paper sheets)
- Each TSC label costs ~₹0.10–0.15 depending on roll quality

---

## 🆘 Common Issues

**"Cannot find module 'better-sqlite3'"** → Run `npm install` again.

**"Database Error: ERR_DLOPEN_FAILED" / "NODE_MODULE_VERSION mismatch"** → Native module compiled for wrong Node version. Run:
```
npx electron-rebuild
```
Then `npm start` again.

**App won't open** → Try `npm start` from Command Prompt to see error messages.

**Data missing after reinstall** → Restore your `alankar.db` backup to the AppData folder above.

**Want to test without installing?** → Open `index.html` directly in Chrome/Edge — it runs in **Demo Mode** with sample data (data won't persist).

---

## 📞 Support

For bugs or feature requests, contact the developer.

---

**Version 1.0.0** · Offline-first · Local SQLite · No internet required.
