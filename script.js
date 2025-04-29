// DOM Elements
const categorySelect = document.getElementById('category-select');
const amountInput = document.getElementById('amount-input');
const dateInput = document.getElementById('date-input');
const addButton = document.getElementById('add-btn');
const expenseTableBody = document.getElementById('expense-table-body');
const totalAmountCell = document.getElementById('total-amount');
const editModal = document.getElementById('edit-modal');
const editCategorySelect = document.getElementById('edit-category-select');
const editAmountInput = document.getElementById('edit-amount-input');
const editDateInput = document.getElementById('edit-date-input');
const editExpenseId = document.getElementById('edit-expense-id');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Initialize date input with today's date
dateInput.valueAsDate = new Date();

// Check for authentication
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'homepage.html';
}

// Add expense handler
addButton.addEventListener('click', async () => {
    const category = categorySelect.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if (!amount || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ category, amount, date })
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'homepage.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to add expense');

        // Clear inputs
        amountInput.value = '';
        dateInput.valueAsDate = new Date();

        // Refresh expenses list
        loadExpenses();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to add expense. Please try again.');
    }
});

// Load and display expenses
async function loadExpenses() {
    try {
        const response = await fetch('http://localhost:3000/api/expenses', {
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'homepage.html';
            return;
        }

        const expenses = await response.json();

        // Clear current table
        expenseTableBody.innerHTML = '';

        // Calculate total
        let total = 0;

        // Add each expense to table
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.category}</td>
                <td>NRs ${expense.amount.toFixed(2)}</td>
                <td>${expense.date}</td>
                <td>
                    <button onclick="editExpense('${expense.id}', '${expense.category}', ${expense.amount}, '${expense.date}')" class="edit-btn">
                        Edit
                    </button>
                </td>
                <td>
                    <button onclick="deleteExpense('${expense.id}')" class="delete-btn">
                        Delete
                    </button>
                </td>
            `;
            expenseTableBody.appendChild(row);
            total += parseFloat(expense.amount);
        });

        // Update total
        totalAmountCell.textContent = `NRs ${total.toFixed(2)}`;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load expenses. Please refresh the page.');
    }
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/expenses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'homepage.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to delete expense');

        // Refresh expenses list
        loadExpenses();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete expense. Please try again.');
    }
}

// Edit expense handler
function editExpense(id, category, amount, date) {
    editExpenseId.value = id;
    editCategorySelect.value = category;
    editAmountInput.value = amount;
    editDateInput.value = date;
    editModal.style.display = 'block';
}

// Save edit handler
saveEditBtn.addEventListener('click', async () => {
    const id = editExpenseId.value;
    const category = editCategorySelect.value;
    const amount = parseFloat(editAmountInput.value);
    const date = editDateInput.value;

    if (!amount || isNaN(amount)) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ category, amount, date })
        });

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'homepage.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to update expense');

        // Close modal and refresh expenses list
        editModal.style.display = 'none';
        loadExpenses();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update expense. Please try again.');
    }
});

// Cancel edit handler
cancelEditBtn.addEventListener('click', () => {
    editModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.style.display = 'none';
    }
});

// Load expenses when page loads
loadExpenses();
