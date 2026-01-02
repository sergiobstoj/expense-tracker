let categories = {};
let config = {};
let expenses = [];
let filteredExpenses = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses()
        ]);

        setupFilters();
        setupEventHandlers();
        applyFilters();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar datos', 'error');
    }
});

async function loadCategories() {
    categories = await api.get('/categories');
}

async function loadConfig() {
    config = await api.get('/config');
    
    // Populate person filter
    const filterPerson = document.getElementById('filterPerson');
    config.persons.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        filterPerson.appendChild(option);
    });
    
    // Populate edit form selects
    const editPaidBy = document.getElementById('editPaidBy');
    config.persons.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        editPaidBy.appendChild(option);
    });
}

async function loadExpenses() {
    expenses = await api.get('/expenses');
    
    // Populate month filter
    const months = getUniqueMonths(expenses);
    const filterMonth = document.getElementById('filterMonth');
    
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = getMonthName(month);
        filterMonth.appendChild(option);
    });
    
    // Set current month as default
    if (months.length > 0) {
        filterMonth.value = months[0];
    }
}

function setupFilters() {
    // Nothing specific needed here for now
}

function setupEventHandlers() {
    document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
    document.getElementById('btnClearFilters').addEventListener('click', clearFilters);
    document.getElementById('btnExportCSV').addEventListener('click', exportFiltered);
    document.getElementById('editType').addEventListener('change', handleEditTypeChange);
    document.getElementById('editForm').addEventListener('submit', handleEditFormSubmit);
}

function applyFilters() {
    const filterMonth = document.getElementById('filterMonth').value;
    const filterType = document.getElementById('filterType').value;
    const filterPerson = document.getElementById('filterPerson').value;
    const filterShared = document.getElementById('filterShared').value;
    
    filteredExpenses = expenses.filter(expense => {
        if (filterMonth && expense.date.substring(0, 7) !== filterMonth) return false;
        if (filterType && expense.type !== filterType) return false;
        if (filterPerson && expense.paidBy !== filterPerson) return false;
        if (filterShared !== '') {
            const isShared = filterShared === 'true';
            if (expense.isShared !== isShared) return false;
        }
        return true;
    });
    
    displayExpenses();
    updateStats();
}

function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterPerson').value = '';
    document.getElementById('filterShared').value = '';
    applyFilters();
}

function displayExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    const resultCount = document.getElementById('resultCount');
    
    if (filteredExpenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron gastos con los filtros aplicados</td></tr>';
        resultCount.textContent = '0 gastos';
        return;
    }
    
    // Sort by date (most recent first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    tbody.innerHTML = sortedExpenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td><span class="badge ${getTypeBadgeClass(expense.type)}">${getTypeDisplayName(expense.type)}</span></td>
            <td>${expense.category}</td>
            <td>${expense.description || '-'}</td>
            <td><strong>${formatCurrency(expense.amount)}</strong></td>
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
    
    resultCount.textContent = `${filteredExpenses.length} gasto${filteredExpenses.length !== 1 ? 's' : ''}`;
}

function updateStats() {
    const totals = calculateTotals(filteredExpenses);
    
    document.getElementById('statTotal').textContent = formatCurrency(totals.total);
    document.getElementById('statCount').textContent = `${filteredExpenses.length} gasto${filteredExpenses.length !== 1 ? 's' : ''}`;
    document.getElementById('statShared').textContent = formatCurrency(totals.shared);
    document.getElementById('statPersonal').textContent = formatCurrency(totals.personal);
}

function exportFiltered() {
    if (filteredExpenses.length === 0) {
        showAlert('No hay gastos para exportar', 'error');
        return;
    }
    
    const filterMonth = document.getElementById('filterMonth').value;
    const filename = filterMonth 
        ? `gastos_${filterMonth}.csv` 
        : 'gastos_todos.csv';
    
    exportToCSV(filteredExpenses, filename);
    showAlert('Gastos exportados exitosamente', 'success');
}

// Edit modal functions
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

async function openEditModal(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    document.getElementById('editId').value = expense.id;
    document.getElementById('editType').value = expense.type;
    
    handleEditTypeChange({ target: { value: expense.type } });
    
    setTimeout(() => {
        document.getElementById('editCategory').value = expense.category;
    }, 50);
    
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editPaidBy').value = expense.paidBy;
    document.getElementById('editIsShared').checked = expense.isShared;
    document.getElementById('editDescription').value = expense.description || '';
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editForm').reset();
}

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
        
        const index = expenses.findIndex(e => e.id === expenseId);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updatedExpense };
        }
        
        showAlert('Gasto actualizado exitosamente', 'success');
        closeEditModal();
        applyFilters();
    } catch (error) {
        console.error('Error updating expense:', error);
        showAlert(`Error al actualizar el gasto: ${error.message}`, 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        return;
    }
    
    try {
        await api.delete(`/expenses/${expenseId}`);
        expenses = expenses.filter(e => e.id !== expenseId);
        
        showAlert('Gasto eliminado exitosamente', 'success');
        applyFilters();
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
