// Initialize jsPDF
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

// Initialize
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

// Listener toggle
themeToggle.addEventListener('click', () => {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
});

// Set awal sesuai localStorage
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
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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

  if (!name) {
    alert('Please enter an item name');
    return;
  }

  if (price <= 0) {
    alert('Please enter a valid price');
    return;
  }

  const item = {
    id: Date.now(),
    name,
    quantity,
    price,
    total: quantity * price
  };

  items.push(item);
  renderItems();
  calculateTotals();

  // Reset inputs
  itemNameInput.value = '';
  itemQuantityInput.value = '1';
  itemPriceInput.value = '';
  itemNameInput.focus();
}

function renderItems() {
  if (items.length === 0) {
    invoiceItems.innerHTML = `
      <tr>
        <td colspan="5" class="py-4 text-center text-gray-500 dark:text-gray-400">No items added yet</td>
      </tr>
    `;
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
      <td class="py-2 px-4 border text-right">
        <div class="flex items-center justify-end gap-2">
          ${formatCurrency(item.total)}
          <button data-id="${item.id}" class="remove-item text-red-500 opacity-0 hover:text-red-700 transition-opacity duration-200">
            ×
          </button>
        </div>
      </td>
    `;
    invoiceItems.appendChild(row);
  });

  // Event listener tombol hapus
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'));
      removeItem(id);
    });
  });
}

function removeItem(id) {
  items = items.filter(item => item.id !== id);
  renderItems();
  calculateTotals();
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

  const targetElement = receiptContent;
  const originalStyle = {
    padding: targetElement.style.padding,
    margin: targetElement.style.margin,
  };
  const wasDark = document.documentElement.classList.contains('dark');

  // force light mode sementara
  applyTheme(false);

  targetElement.style.padding = '20px';
  targetElement.style.margin = '0 auto';

  html2canvas(targetElement, {
    scale: 5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false
  }).then(canvas => {
    targetElement.style.padding = originalStyle.padding;
    targetElement.style.margin = originalStyle.margin;

    canvas.toBlob(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `invoice-${invoiceNumber.textContent}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }, 'image/png', 1.0);

    // balikin tema sebelumnya
    applyTheme(wasDark);
  }).catch(error => {
    console.error('Error generating image:', error);
    alert('Failed to generate image. Check console for details.');
    targetElement.style.padding = originalStyle.padding;
    targetElement.style.margin = originalStyle.margin;
    applyTheme(wasDark);
  });
}

// ---------------- EXPORT PDF ----------------
function generatePdf() {
  if (items.length === 0) {
    alert('Please add at least one item to generate the invoice');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('INVOICE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Invoice No: INV-${invoiceNumber.textContent}`, 15, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);

  doc.text(`From: ${document.getElementById('businessName').value || 'Toko Vika Sadni'}`, 180, 30, { align: 'right' });
  doc.text(`To: ${customerNameInput.value || 'Customer Name'}`, 180, 35, { align: 'right' });

  const columns = ["No", "Item", "Qty", "Price", "Total"];
  const rows = items.map((item, index) => [
    index + 1,
    item.name,
    item.quantity,
    formatCurrency(item.price),
    formatCurrency(item.total)
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const adminFee = parseInt(adminFeeInput.value) || 0;
  const total = subtotal + adminFee;

  rows.push(["", "", "", "Subtotal:", formatCurrency(subtotal)]);
  rows.push(["", "", "", "Biaya Admin:", formatCurrency(adminFee)]);
  rows.push(["", "", "", "Total:", formatCurrency(total)]);

  doc.autoTable({
    startY: 45,
    head: [columns],
    body: rows,
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    didDrawPage: function () {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("powered by Vika Sadni", 105, doc.internal.pageSize.height - 10, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.text("Thank you for your business!", 105, doc.internal.pageSize.height - 20, { align: 'center' });
    }
  });

  doc.save(`invoice-${invoiceCounter}.pdf`);
}

// ---------------- PRINT ----------------
function printInvoice() {
  window.print();
}

// ---------------- SAVE TO CLOUD ----------------
function saveToCloud() {
  if (items.length === 0) {
    alert('Please add at least one item to save the invoice');
    return;
  }

  const customerName = customerNameInput.value || 'Customer Name';
  const date = new Date().toLocaleDateString();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const adminFee = parseInt(adminFeeInput.value) || 0;
  const total = subtotal + adminFee;

  const invoiceData = {
    id: Date.now(),
    number: invoiceCounter,
    customerName,
    date,
    total,
    items: [...items],
    adminFee: adminFee
  };

  const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
  saved.push(invoiceData);
  localStorage.setItem('savedInvoices', JSON.stringify(saved));

  invoiceCounter++;
  localStorage.setItem('invoiceCounter', invoiceCounter);
  updateInvoiceDate();

  items = [];
  renderItems();
  adminFeeInput.value = '';
  calculateTotals();
  customerNameInput.value = '';
  displayCustomerName.textContent = 'Customer Name';

  loadSavedInvoices();
  alert('Invoice saved successfully!');
}

function loadSavedInvoices() {
  const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');

  if (saved.length === 0) {
    savedInvoices.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">No saved invoices yet</div>';
    return;
  }

  savedInvoices.innerHTML = '';
  saved.reverse().forEach(invoice => {
    const element = document.createElement('div');
    element.className = 'border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200';
    element.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <h3 class="font-semibold">INV-${String(invoice.number).padStart(3, '0')}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300">${invoice.customerName}</p>
        </div>
        <div class="text-right">
          <p class="font-semibold">${formatCurrency(invoice.total)}</p>
          <p class="text-sm text-gray-600 dark:text-gray-300">${invoice.date}</p>
        </div>
      </div>
    `;
    savedInvoices.appendChild(element);
  });
}
