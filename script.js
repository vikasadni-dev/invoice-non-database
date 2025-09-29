        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        
        // DOM Elements
        const itemNameInput = document.getElementById('itemName');
        const itemQuantityInput = document.getElementById('itemQuantity');
        const itemPriceInput = document.getElementById('itemPrice');
        const addItemBtn = document.getElementById('addItemBtn');
        const invoiceItems = document.getElementById('invoiceItems');
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');
        const generatePdfBtn = document.getElementById('generatePdfBtn');
        const printBtn = document.getElementById('printBtn');
        const saveCloudBtn = document.getElementById('saveCloudBtn');
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

        // Dark mode toggle
        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });

        // Check for saved theme preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark');
        }

        // Event Listeners
        addItemBtn.addEventListener('click', addItem);
        generatePdfBtn.addEventListener('click', generatePdf);
        printBtn.addEventListener('click', printInvoice);
        saveCloudBtn.addEventListener('click', saveToCloud);
        customerNameInput.addEventListener('input', updateCustomerName);

        // Functions
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
                        <td colspan="5" class="py-4 text-center text-gray-500">No items added yet</td>
                    </tr>
                `;
                return;
            }

            invoiceItems.innerHTML = '';
            items.forEach((item, index) => {
                const row = document.createElement('tr');
                row.className = 'receipt-item hover:bg-gray-50';
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

            // Add event listeners to remove buttons
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
            const tax = subtotal * 0.1;
            const total = subtotal + tax;

            subtotalElement.textContent = formatCurrency(subtotal);
            taxElement.textContent = formatCurrency(tax);
            totalElement.textContent = formatCurrency(total);
        }

        function formatCurrency(amount) {
            return 'Rp ' + amount.toLocaleString('id-ID');
        }

        function generatePdf() {
            if (items.length === 0) {
                alert('Please add at least one item to generate the invoice');
                return;
            }

            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('INVOICE', 105, 20, { align: 'center' });
            
            // Add invoice info
            doc.setFontSize(10);
            doc.text(`Invoice No: INV-${invoiceNumber.textContent}`, 15, 30);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
            
            doc.text(`From: ${document.getElementById('businessName').value || 'Toko Vika Sadni'}`, 180, 30, { align: 'right' });
            doc.text(`To: ${customerNameInput.value || 'Customer Name'}`, 180, 35, { align: 'right' });
            
            // Prepare data for the table
            const columns = ["No", "Item", "Qty", "Price", "Total"];
            const rows = items.map((item, index) => [
                index + 1,
                item.name,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.total)
            ]);
            
            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.1;
            const total = subtotal + tax;
            
            // Add summary rows
            rows.push(["", "", "", "Subtotal:", formatCurrency(subtotal)]);
            rows.push(["", "", "", "Tax (10%):", formatCurrency(tax)]);
            rows.push(["", "", "", "Total:", formatCurrency(total)]);
            
            // Add the table
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
                footStyles: { fontStyle: 'bold' },
                didDrawPage: function (data) {
                    // Add footer with watermark
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.text("powered by Vika Sadni", 105, doc.internal.pageSize.height - 10, { align: 'center' });
                    doc.setTextColor(0, 0, 0);
                    doc.text("Thank you for your business!", 105, doc.internal.pageSize.height - 20, { align: 'center' });
                }
            });
            
            // Save the PDF
            doc.save(`invoice-${invoiceCounter}.pdf`);
        }

        function printInvoice() {
            window.print();
        }

        function saveToCloud() {
            if (items.length === 0) {
                alert('Please add at least one item to save the invoice');
                return;
            }

            const customerName = customerNameInput.value || 'Customer Name';
            const date = new Date().toLocaleDateString();
            const total = items.reduce((sum, item) => sum + item.total, 0) * 1.1; // Include tax
            
            const invoiceData = {
                id: Date.now(),
                number: invoiceCounter,
                customerName,
                date,
                total,
                items: [...items]
            };
            
            // Save to localStorage (simulating cloud save)
            const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
            saved.push(invoiceData);
            localStorage.setItem('savedInvoices', JSON.stringify(saved));
            
            // Increment invoice counter
            invoiceCounter++;
            localStorage.setItem('invoiceCounter', invoiceCounter);
            updateInvoiceDate();
            
            // Clear current invoice
            items = [];
            renderItems();
            calculateTotals();
            customerNameInput.value = '';
            displayCustomerName.textContent = 'Customer Name';
            
            // Refresh saved invoices list
            loadSavedInvoices();
            
            alert('Invoice saved successfully!');
        }

        function loadSavedInvoices() {
            const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
            
            if (saved.length === 0) {
                savedInvoices.innerHTML = '<div class="text-center text-gray-500 py-4">No saved invoices yet</div>';
                return;
            }
            
            savedInvoices.innerHTML = '';
            
            saved.reverse().forEach(invoice => {
                const element = document.createElement('div');
                element.className = 'border rounded p-4 hover:bg-gray-50 transition duration-200';
                element.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="font-semibold">INV-${String(invoice.number).padStart(3, '0')}</h3>
                            <p class="text-sm text-gray-600">${invoice.customerName}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-semibold">${formatCurrency(invoice.total)}</p>
                            <p class="text-sm text-gray-600">${invoice.date}</p>
                        </div>
                    </div>
                    <div class="mt-2 flex gap-2">
                        <button data-id="${invoice.id}" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition duration-200 view-btn">View</button>
                        <button data-id="${invoice.id}" class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition duration-200 download-btn">PDF</button>
                        <button data-id="${invoice.id}" class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition duration-200 delete-btn">Delete</button>
                    </div>
                `;
                savedInvoices.appendChild(element);
            });
            
            // Add event listeners
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    viewSavedInvoice(id);
                });
            });
            
            document.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    downloadSavedInvoice(id);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    deleteSavedInvoice(id);
                });
            });
        }

        function viewSavedInvoice(id) {
            const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
            const invoice = saved.find(i => i.id === id);
            
            if (!invoice) {
                alert('Invoice not found');
                return;
            }
            
            // Set current invoice to this saved one
            items = invoice.items;
            customerNameInput.value = invoice.customerName;
            displayCustomerName.textContent = invoice.customerName;
            
            renderItems();
            calculateTotals();
            
            // Scroll to top
            window.scrollTo(0, 0);
        }

        function downloadSavedInvoice(id) {
            const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
            const invoice = saved.find(i => i.id === id);
            
            if (!invoice) {
                alert('Invoice not found');
                return;
            }
            
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('INVOICE', 105, 20, { align: 'center' });
            
            // Add invoice info
            doc.setFontSize(10);
            doc.text(`Invoice No: INV-${String(invoice.number).padStart(3, '0')}`, 15, 30);
            doc.text(`Date: ${invoice.date}`, 15, 35);
            
            doc.text(`From: Your Business Name`, 180, 30, { align: 'right' });
            doc.text(`To: ${invoice.customerName}`, 180, 35, { align: 'right' });
            
            // Prepare data for the table
            const columns = ["No", "Item", "Qty", "Price", "Total"];
            const rows = invoice.items.map((item, index) => [
                index + 1,
                item.name,
                item.quantity,
                formatCurrency(item.price),
                formatCurrency(item.total)
            ]);
            
            // Add summary rows
            const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.1;
            const total = subtotal + tax;
            
            rows.push(["", "", "", "Subtotal:", formatCurrency(subtotal)]);
            rows.push(["", "", "", "Tax (10%):", formatCurrency(tax)]);
            rows.push(["", "", "", "Total:", formatCurrency(total)]);
            
            // Add the table
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
                footStyles: { fontStyle: 'bold' }
            });
            
            // Save the PDF
            doc.save(`invoice-${invoice.number}.pdf`);
        }

        function deleteSavedInvoice(id) {
            if (!confirm('Are you sure you want to delete this invoice?')) {
                return;
            }
            
            let saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
            saved = saved.filter(i => i.id !== id);
            localStorage.setItem('savedInvoices', JSON.stringify(saved));
            
            loadSavedInvoices();
            alert('Invoice deleted successfully');
        }
