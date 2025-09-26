// --- Global State & Initialization ---
const STORAGE_KEY = 'simpleInventory';
let inventory = [];

// Get references to key elements
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-btn');
const inventoryTableBody = document.querySelector('#inventory-table tbody');
const addItemForm = document.getElementById('add-item-form');

// NEW: Edit Modal Elements
const editModal = document.getElementById('edit-modal');
const editItemForm = document.getElementById('edit-item-form');
const cancelEditBtn = document.getElementById('cancel-edit');


// --- Data Management Functions ---

/** Loads inventory from localStorage or initializes with sample data. */
function loadInventory() {
    const storedInventory = localStorage.getItem(STORAGE_KEY);
    if (storedInventory) {
        inventory = JSON.parse(storedInventory);
    } else {
        // Sample Data for first-time use
        inventory = [
            { id: Date.now() + 1, name: 'T-Shirt - Red', quantity: 25, price: 15.99 },
            { id: Date.now() + 2, name: 'Coffee Mug - Logo', quantity: 5, price: 8.50 },
            { id: Date.now() + 3, name: 'Sticker Pack', quantity: 150, price: 2.00 }
        ];
        saveInventory();
    }
}

/** Saves the current inventory array to localStorage. */
function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

/** Adds a new item to the inventory array. */
function addItem(name, quantity, price) {
    const newItem = {
        id: Date.now(),
        name: name,
        quantity: parseInt(quantity),
        price: parseFloat(price).toFixed(2)
    };
    inventory.push(newItem);
    saveInventory();
}

/** Removes an item by its ID. */
function removeItem(id) {
    inventory = inventory.filter(item => item.id !== id);
    saveInventory();
    renderDashboard(); // Re-render the dashboard immediately
}

/** Updates an item's quantity and price by its ID. */
function editItem(id, newQuantity, newPrice) {
    const itemIndex = inventory.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        inventory[itemIndex].quantity = parseInt(newQuantity);
        inventory[itemIndex].price = parseFloat(newPrice).toFixed(2);
        saveInventory();
    }
}


// --- Rendering Functions ---

/** Renders the inventory table and updates dashboard summary cards. */
function renderDashboard() {
    inventoryTableBody.innerHTML = '';
    
    let totalItems = 0;
    let totalValue = 0;
    
    inventory.forEach(item => {
        totalItems += item.quantity;
        totalValue += item.quantity * item.price;
        
        // Create Table Row
        const row = inventoryTableBody.insertRow();
        row.insertCell().textContent = item.name;
        
        // Quantity Cell (with low stock highlight)
        const qtyCell = row.insertCell();
        qtyCell.textContent = item.quantity;
        if (item.quantity < 5) {
            qtyCell.style.fontWeight = 'bold';
            qtyCell.style.color = 'var(--danger-color)'; // Apply CSS variable for color
        }

        row.insertCell().textContent = `$${parseFloat(item.price).toFixed(2)}`;
        
        // Action Cell
        const actionCell = row.insertCell();
        
        // 1. Edit Button
        const editButton = document.createElement('button');
        editButton.className = 'primary-btn';
        editButton.textContent = 'Edit';
        editButton.onclick = () => showEditModal(item.id); 
        actionCell.appendChild(editButton);

        // 2. Remove Button
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeItem(item.id);
        actionCell.appendChild(removeButton);
    });

    // Update Summary Cards
    document.getElementById('total-items').textContent = totalItems.toLocaleString();
    document.getElementById('unique-products').textContent = inventory.length;
    document.getElementById('total-value').textContent = `$${totalValue.toFixed(2).toLocaleString()}`;
    
    // Call stats update after dashboard data is ready
    updateStats();
}

/** Updates the 'Stats & Analytics' page with calculated data. */
function updateStats() {
    if (inventory.length === 0) {
        document.getElementById('stats-content').innerHTML = "<p>No inventory data to analyze yet. Add some items!</p>";
        document.getElementById('distribution-chart').textContent = '';
        return;
    }

    // 1. Top Stocked Item
    const topItem = inventory.reduce((max, item) => (item.quantity > max.quantity ? item : max), { quantity: -1 });
    
    // 2. Lowest Stocked Item (Quantity < 5)
    const lowStockItems = inventory.filter(item => item.quantity < 5).map(item => `${item.name} (${item.quantity})`);
    
    // 3. Average Unit Price
    const sumPrices = inventory.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const avgPrice = sumPrices / inventory.length;

    // Update DOM elements
    document.getElementById('top-item-name').textContent = topItem ? topItem.name : 'N/A';
    document.getElementById('top-item-qty').textContent = topItem ? topItem.quantity : '0';
    document.getElementById('low-item-name').textContent = lowStockItems.length > 0 ? lowStockItems.join(', ') : 'None';
    document.getElementById('avg-price').textContent = `$${avgPrice.toFixed(2)}`;
    
    // Low Stock Warning Visibility
    const warningEl = document.querySelector('.low-stock-warning');
    if (lowStockItems.length > 0) {
        warningEl.classList.remove('hidden');
    } else {
        warningEl.classList.add('hidden');
    }
    
    // 4. Distribution Chart (Simple Text-Based Bar Chart)
    generateDistributionChart();
}

/** Generates a simple text-based bar chart for quantity distribution. */
function generateDistributionChart() {
    let chartOutput = 'Product Quantity Distribution:\n';
    
    // Sort by quantity for better visualization
    const sortedInventory = [...inventory].sort((a, b) => b.quantity - a.quantity);
    const maxQty = sortedInventory.length > 0 ? sortedInventory[0].quantity : 0;
    const chartWidth = 30; // Max characters for the bar
    
    sortedInventory.slice(0, 10).forEach(item => { // Show top 10 items
        if (maxQty === 0) return;
        const barLength = Math.round((item.quantity / maxQty) * chartWidth);
        const bar = '█'.repeat(barLength); // Use a block character for the bar
        const paddedName = item.name.padEnd(20, ' ');
        chartOutput += `${paddedName} | ${bar} ${item.quantity}\n`;
    });
    
    document.getElementById('distribution-chart').textContent = chartOutput;
}


// --- Modal Control Functions ---

/** Opens the edit modal and populates it with the item's current data. */
function showEditModal(id) {
    const itemToEdit = inventory.find(item => item.id === id);
    if (!itemToEdit) return;

    // Populate the modal fields
    document.getElementById('edit-product-name-title').textContent = itemToEdit.name;
    document.getElementById('edit-item-id').value = itemToEdit.id;
    document.getElementById('edit-quantity').value = itemToEdit.quantity;
    document.getElementById('edit-price').value = parseFloat(itemToEdit.price).toFixed(2);

    editModal.classList.remove('hidden');
}

/** Closes the edit modal. */
function hideEditModal() {
    editModal.classList.add('hidden');
}


// --- Navigation and Event Listeners ---

/** Handles navigation between pages (sections). */
function navigateTo(targetPageId) {
    // Hide all pages
    pages.forEach(page => page.classList.add('hidden'));
    
    // Show the target page
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update active button state (now using <a> tags, but the class logic is the same)
    navButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-page="${targetPageId}"]`).classList.add('active');

    // Run specific rendering logic for the page being shown
    if (targetPageId === 'dashboard' || targetPageId === 'stats') {
        renderDashboard(); 
        if (targetPageId === 'stats') {
            updateStats();
        }
    }
}

// Attach navigation listeners to buttons (now <a> tags)
navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // Prevent default link jump behavior, allowing JS to handle navigation
        e.preventDefault(); 
        navigateTo(e.target.dataset.page);
    });
});

// Handle the Add Inventory form submission
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value.trim();
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;

    if (name && quantity && price) {
        addItem(name, quantity, price);
        
        // Show success message and clear form
        const statusEl = document.getElementById('add-status');
        statusEl.textContent = `✅ Successfully added "${name}" to stock!`;
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
        
        addItemForm.reset();
        
        // Navigate back to the dashboard after adding
        navigateTo('dashboard');
    }
});

// Handle the Edit Modal form submission
editItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-item-id').value);
    const newQuantity = document.getElementById('edit-quantity').value;
    const newPrice = document.getElementById('edit-price').value;

    editItem(id, newQuantity, newPrice);
    
    hideEditModal();
    renderDashboard(); // Re-render the table with the new data
});

// Handle the Cancel button click
cancelEditBtn.addEventListener('click', hideEditModal);


// --- Initial Load ---

// Load data and set up the initial view when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    // Default to the dashboard view
    navigateTo('dashboard'); 
});