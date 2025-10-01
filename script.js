const { jsPDF } = window.jspdf;

// DOM Elements
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemPriceInput = document.getElementById('itemPrice');
const addItemBtn = document.getElementById('addItemBtn');
const invoiceItems = document.getElementById('invoiceItems');
const subtotalElement = document.getElementById('subtotal');
const adminFeeInput = document.getElementById('adminFee');
const adminFeeDisplay = document.getElementById('adminFeeDisplay');
const totalElement = document.getElementById('total');
const generatePdfBtn = document.getElementById('generatePdfBtn');
const printBtn = document.getElementById('printBtn');
const saveCloudBtn = document.getElementById('saveCloudBtn');
const generateJpgBtn = document.getElementById('generateJpgBtn');
const receiptContent = document.getElementById('receiptContent');
const customerNameInput = document.getElementById('customerName');
const displayCustomerName = document.getElementById('displayCustomerName');
const invoiceDate = document.getElementById('invoiceDate');
const invoiceNumber = document.getElementById('invoiceNumber');
const savedInvoices = document.getElementById('savedInvoices');

// Variables
let items = [];
let invoiceCounter = localStorage.getItem('invoiceCounter') || 1;

// Init
updateInvoiceDate();
loadSavedInvoices();

// ---------------- DARK MODE ----------------
const themeToggle = document.getElementById('themeToggle');
const lightIcon = themeToggle.querySelector('.light-icon');
const darkIcon = themeToggle.querySelector('.dark-icon');

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    lightIcon.classList.add('hidden');
    darkIcon.classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
  }
  localStorage.setItem('darkMode', isDark);
}

themeToggle.addEventListener('click', () => {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
});
applyTheme(localStorage.getItem('darkMode') === 'true');

// ---------------- EVENT LISTENERS ----------------
addItemBtn.addEventListener('click', addItem);
generatePdfBtn.addEventListener('click', generatePdf);
printBtn.addEventListener('click', printInvoice);
saveCloudBtn.addEventListener('click', saveToCloud);
customerNameInput.addEventListener('input', updateCustomerName);
adminFeeInput.addEventListener('input', calculateTotals);
generateJpgBtn.addEventListener('click', generateJpg);

// ---------------- FUNCTIONS ----------------
function updateInvoiceDate() {
  const now = new Date();
  invoiceDate.textContent = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  invoiceNumber.textContent = String(invoiceCounter).padStart(3, '0');
}

function updateCustomerName() {
  displayCustomerName.textContent = customerNameInput.value || 'Customer Name';
}

function addItem() {
  const name = itemNameInput.value.trim();
  const quantity = parseInt(itemQuantityInput.value) || 1;
  const price = parseInt(itemPriceInput.value) || 0;

  if (!name) { alert('Please enter an item name'); return; }
  if (price <= 0) { alert('Please enter a valid price'); return; }

  const item = { id: Date.now(), name, quantity, price, total: quantity * price };
  items.push(item);
  renderItems();
  calculateTotals();

  itemNameInput.value = '';
  itemQuantityInput.value = '1';
  itemPriceInput.value = '';
  itemNameInput.focus();
}

function renderItems() {
  if (items.length === 0) {
    invoiceItems.innerHTML = `
      <tr><td colspan="5" class="py-4 text-center text-gray-500 dark:text-gray-400">No items added yet</td></tr>`;
    return;
  }
  invoiceItems.innerHTML = '';
  items.forEach((item, index) => {
    const row = document.createElement('tr');
    row.className = 'receipt-item hover:bg-gray-50 dark:hover:bg-gray-700';
    row.innerHTML = `
      <td class="py-2 px-4 border">${index + 1}</td>
      <td class="py-2 px-4 border">${item.name}</td>
      <td class="py-2 px-4 border text-right">${item.quantity}</td>
      <td class="py-2 px-4 border text-right">${formatCurrency(item.price)}</td>
      <td class="py-2 px-4 border text-right">${formatCurrency(item.total)}</td>`;
    invoiceItems.appendChild(row);
  });
}

function calculateTotals() {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const adminFee = parseInt(adminFeeInput.value) || 0;
  const total = subtotal + adminFee;
  subtotalElement.textContent = formatCurrency(subtotal);
  adminFeeDisplay.textContent = formatCurrency(adminFee);
  totalElement.textContent = formatCurrency(total);
}

function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// ---------------- EXPORT PNG ----------------
function generateJpg() {
  if (items.length === 0) {
    alert('Please add at least one item to generate the invoice image');
    return;
  }
  const wasDark = document.documentElement.classList.contains('dark');
  applyTheme(false); // force light mode

  const fullWidth = receiptContent.scrollWidth;
  const fullHeight = receiptContent.scrollHeight;

  html2canvas(receiptContent, {
    scale: 4,
    width: fullWidth,
    height: fullHeight,
    windowWidth: fullWidth,
    windowHeight: fullHeight,
    backgroundColor: "#ffffff",
    useCORS: true
  }).then(canvas => {
    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${invoiceNumber.textContent}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 'image/png', 1.0);
    applyTheme(wasDark); // kembalikan tema
  }).catch(err => {
    console.error("Error:", err);
    alert("Gagal generate PNG");
    applyTheme(wasDark);
  });
}

// ---------------- EXPORT PDF ----------------
function generatePdf() {
  if (items.length === 0) { alert('Please add at least one item'); return; }
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Invoice No: INV-${invoiceNumber.textContent}`, 15, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
  doc.text(`From: ${document.getElementById('businessName').value}`, 180, 30, { align: 'right' });
  doc.text(`To: ${customerNameInput.value || 'Customer Name'}`, 180, 35, { align: 'right' });

  const columns = ["No", "Item", "Qty", "Price", "Total"];
  const rows = items.map((item, i) => [i+1, item.name, item.quantity, formatCurrency(item.price), formatCurrency(item.total)]);
  const subtotal = items.reduce((s, i) => s+i.total, 0);
  const adminFee = parseInt(adminFeeInput.value) || 0;
  const total = subtotal + adminFee;
  rows.push(["", "", "", "Subtotal:", formatCurrency(subtotal)]);
  rows.push(["", "", "", "Biaya Admin:", formatCurrency(adminFee)]);
  rows.push(["", "", "", "Total:", formatCurrency(total)]);

  doc.autoTable({ startY: 45, head:[columns], body:rows, styles:{fontSize:10} });
  doc.save(`invoice-${invoiceCounter}.pdf`);
}

function printInvoice() { window.print(); }

function saveToCloud() {
  if (items.length === 0) { alert('Please add item'); return; }
  const customerName = customerNameInput.value || 'Customer Name';
  const date = new Date().toLocaleDateString();
  const subtotal = items.reduce((s, i) => s+i.total, 0);
  const adminFee = parseInt(adminFeeInput.value) || 0;
  const total = subtotal + adminFee;
  const invoiceData = { id: Date.now(), number: invoiceCounter, customerName, date, total, items:[...items], adminFee };
  const saved = JSON.parse(localStorage.getItem('savedInvoices')||'[]');
  saved.push(invoiceData);
  localStorage.setItem('savedInvoices', JSON.stringify(saved));
  invoiceCounter++;
  localStorage.setItem('invoiceCounter', invoiceCounter);
  updateInvoiceDate();
  items=[]; renderItems(); adminFeeInput.value=''; calculateTotals(); customerNameInput.value=''; displayCustomerName.textContent='Customer Name';
  loadSavedInvoices();
}

function loadSavedInvoices() {
  const saved = JSON.parse(localStorage.getItem('savedInvoices')||'[]');
  if (saved.length===0) { savedInvoices.innerHTML='<div class="text-center text-gray-500 dark:text-gray-400 py-4">No saved invoices yet</div>'; return; }
  savedInvoices.innerHTML='';
  saved.reverse().forEach(inv=>{
    const el=document.createElement('div');
    el.className='border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200';
    el.innerHTML=`<div class="flex justify-between"><div><h3 class="font-semibold">INV-${String(inv.number).padStart(3,'0')}</h3><p class="text-sm text-gray-600 dark:text-gray-300">${inv.customerName}</p></div><div class="text-right"><p class="font-semibold">${formatCurrency(inv.total)}</p><p class="text-sm text-gray-600 dark:text-gray-300">${inv.date}</p></div></div>`;
    savedInvoices.appendChild(el);
  });
}
