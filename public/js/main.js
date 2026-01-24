let categories = {};
let config = {};
let expenses = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load initial data
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses()
        ]);

        // Set today's date as default
        setTodayAsDefault('date');

        // Setup form handlers
        setupFormHandlers();
        
        // Load recent expenses
        displayRecentExpenses();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar la aplicación', 'error');
    }
});

// Load categories from API
async function loadCategories() {
    categories = await api.get('/categories');
}

// Load config from API
async function loadConfig() {
    config = await api.get('/config');
    
    // Populate "Pagado por" select
    const paidBySelect = document.getElementById('paidBy');
    const editPaidBySelect = document.getElementById('editPaidBy');
    
    paidBySelect.innerHTML = '<option value="">Selecciona...</option>';
    editPaidBySelect.innerHTML = '';
    
    config.persons.forEach(person => {
        const option1 = document.createElement('option');
        option1.value = person;
        option1.textContent = person;
        paidBySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = person;
        option2.textContent = person;
        editPaidBySelect.appendChild(option2);
    });
}

// Load expenses from API
async function loadExpenses() {
    expenses = await api.get('/expenses');
}

// Setup form event handlers
function setupFormHandlers() {
    // Main form submission
    document.getElementById('expenseForm').addEventListener('submit', handleFormSubmit);
    
    // Reset button
    document.getElementById('btnReset').addEventListener('click', resetForm);
    
    // Type select change - update categories
    document.getElementById('type').addEventListener('change', handleTypeChange);
    
    // Edit form type change
    document.getElementById('editType').addEventListener('change', handleEditTypeChange);
    
    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', handleEditFormSubmit);
}

// Handle type change - update category dropdown
function handleTypeChange(e) {
    const type = e.target.value;
    const categorySelect = document.getElementById('category');
    
    if (!type) {
        categorySelect.disabled = true;
        categorySelect.innerHTML = '<option value="">Primero selecciona un tipo</option>';
        return;
    }
    
    categorySelect.disabled = false;
    categorySelect.innerHTML = '<option value="">Selecciona una categoría...</option>';
    
    const typeCategories = categories[type] || [];
    typeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
    
    // Add option to create new category
    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ Nueva categoría';
    categorySelect.appendChild(newOption);
    
    // Handle new category creation
    categorySelect.addEventListener('change', function(e) {
        if (e.target.value === '__new__') {
            const newCategory = prompt('Nombre de la nueva categoría:');
            if (newCategory && newCategory.trim()) {
                if (!categories[type]) {
                    categories[type] = [];
                }
                categories[type].push(newCategory.trim());
                api.put('/categories', categories);
                handleTypeChange({ target: { value: type } });
                categorySelect.value = newCategory.trim();
            } else {
                categorySelect.value = '';
            }
        }
    }, { once: true });
}

// Handle edit type change
function handleEditTypeChange(e) {
    const type = e.target.value;
    const categorySelect = document.getElementById('editCategory');
    
    categorySelect.innerHTML = '<option value="">Selecciona una categoría...</option>';
    
    const typeCategories = categories[type] || [];
    typeCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expense = {
        type: formData.get('type'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        paidBy: formData.get('paidBy'),
        isShared: formData.get('isShared') === 'on',
        description: formData.get('description') || ''
    };
    
    try {
        const newExpense = await api.post('/expenses', expense);
        expenses.push(newExpense);
        
        showAlert('¡Gasto registrado exitosamente!', 'success');
        resetForm();
        displayRecentExpenses();
    } catch (error) {
        console.error('Error saving expense:', error);
        showAlert(`Error al guardar el gasto: ${error.message}`, 'error');
    }
}

// Reset form
function resetForm() {
    document.getElementById('expenseForm').reset();
    document.getElementById('category').disabled = true;
    document.getElementById('category').innerHTML = '<option value="">Primero selecciona un tipo</option>';
    setTodayAsDefault('date');
}

// Display recent expenses (last 10)
function displayRecentExpenses() {
    const tbody = document.getElementById('recentExpensesBody');
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay gastos registrados aún</td></tr>';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedExpenses = [...expenses].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    const recentExpenses = sortedExpenses.slice(0, 10);
    
    tbody.innerHTML = recentExpenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge ${getTypeBadgeClass(expense.type)}">${getTypeDisplayName(expense.type)}</span></td>
            <td>${expense.category}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${expense.paidBy}</td>
            <td>
                <span class="badge ${expense.isShared ? 'badge-shared' : 'badge-personal'}">
                    ${expense.isShared ? 'Común' : 'Personal'}
                </span>
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-primary" onclick="openEditModal('${expense.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Open edit modal
async function openEditModal(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Fill form
    document.getElementById('editId').value = expense.id;
    document.getElementById('editType').value = expense.type;
    
    // Trigger type change to load categories
    handleEditTypeChange({ target: { value: expense.type } });
    
    // Wait a bit for categories to load, then set category
    setTimeout(() => {
        document.getElementById('editCategory').value = expense.category;
    }, 50);
    
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editPaidBy').value = expense.paidBy;
    document.getElementById('editIsShared').checked = expense.isShared;
    document.getElementById('editDescription').value = expense.description || '';
    
    // Show modal
    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editForm').reset();
}

// Handle edit form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseId = formData.get('editId');
    
    const updatedExpense = {
        type: formData.get('editType'),
        category: formData.get('editCategory'),
        amount: parseFloat(formData.get('editAmount')),
        date: formData.get('editDate'),
        paidBy: formData.get('editPaidBy'),
        isShared: formData.get('editIsShared') === 'on',
        description: formData.get('editDescription') || ''
    };
    
    try {
        await api.put(`/expenses/${expenseId}`, updatedExpense);
        
        // Update local expenses array
        const index = expenses.findIndex(e => e.id === expenseId);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updatedExpense };
        }
        
        showAlert('Gasto actualizado exitosamente', 'success');
        closeEditModal();
        displayRecentExpenses();
    } catch (error) {
        console.error('Error updating expense:', error);
        showAlert(`Error al actualizar el gasto: ${error.message}`, 'error');
    }
}

// Delete expense
async function deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        return;
    }

    try {
        // Find expense to get its month
        const expense = expenses.find(e => e.id === expenseId);
        if (!expense) {
            showAlert('Gasto no encontrado', 'error');
            return;
        }
        const month = expense.date.substring(0, 7);

        await api.delete(`/expenses/${expenseId}?month=${month}`);

        // Remove from local array
        expenses = expenses.filter(e => e.id !== expenseId);

        showAlert('Gasto eliminado exitosamente', 'success');
        displayRecentExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showAlert(`Error al eliminar el gasto: ${error.message}`, 'error');
    }
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
