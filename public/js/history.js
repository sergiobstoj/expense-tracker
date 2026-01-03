let categories = {};
let config = {};
let expenses = [];
let incomes = [];
let filteredTransactions = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes()
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
}

async function loadIncomes() {
    incomes = await api.get('/incomes');
}

function setupFilters() {
    // Populate month filter with expenses and incomes
    const expenseMonths = getUniqueMonths(expenses);
    const incomeMonths = getUniqueMonths(incomes);
    const months = [...new Set([...expenseMonths, ...incomeMonths])].sort().reverse();
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

function setupEventHandlers() {
    document.getElementById('btnApplyFilters').addEventListener('click', applyFilters);
    document.getElementById('btnClearFilters').addEventListener('click', clearFilters);
    document.getElementById('btnExportCSV').addEventListener('click', exportFiltered);
    document.getElementById('editType').addEventListener('change', handleEditTypeChange);
    document.getElementById('editForm').addEventListener('submit', handleEditFormSubmit);
}

function applyFilters() {
    const filterTransactionType = document.getElementById('filterTransactionType').value;
    const filterMonth = document.getElementById('filterMonth').value;
    const filterType = document.getElementById('filterType').value;
    const filterPerson = document.getElementById('filterPerson').value;
    const filterShared = document.getElementById('filterShared').value;
    const filterDescription = document.getElementById('filterDescription').value.toLowerCase();
    const filterMinAmount = parseFloat(document.getElementById('filterMinAmount').value) || 0;
    const filterMaxAmount = parseFloat(document.getElementById('filterMaxAmount').value) || Infinity;

    let filteredExpenses = [];
    let filteredIncomes = [];

    // Only filter expenses if we're showing them (all or expense only)
    if (filterTransactionType === '' || filterTransactionType === 'expense') {
        filteredExpenses = expenses.filter(expense => {
            if (filterMonth && expense.date.substring(0, 7) !== filterMonth) return false;
            if (filterType && expense.type !== filterType) return false;
            if (filterPerson && expense.paidBy !== filterPerson) return false;
            if (filterShared !== '') {
                const isShared = filterShared === 'true';
                if (expense.isShared !== isShared) return false;
            }

            // Filter by description (case insensitive)
            if (filterDescription && !expense.description.toLowerCase().includes(filterDescription)) {
                return false;
            }

            // Filter by amount range
            const amount = parseFloat(expense.amount);
            if (amount < filterMinAmount || amount > filterMaxAmount) {
                return false;
            }

            return true;
        });
    }

    // Only filter incomes if we're showing them (all or income only)
    if (filterTransactionType === '' || filterTransactionType === 'income') {
        filteredIncomes = incomes.filter(income => {
            if (filterMonth && income.date.substring(0, 7) !== filterMonth) return false;
            if (filterPerson && income.receivedBy !== filterPerson) return false;

            // Filter by description (case insensitive)
            if (filterDescription && !income.description.toLowerCase().includes(filterDescription)) {
                return false;
            }

            // Filter by amount range
            const amount = parseFloat(income.amount);
            if (amount < filterMinAmount || amount > filterMaxAmount) {
                return false;
            }

            return true;
        });
    }

    // Combine and mark type
    filteredTransactions = [
        ...filteredExpenses.map(e => ({ ...e, transactionType: 'expense' })),
        ...filteredIncomes.map(i => ({ ...i, transactionType: 'income' }))
    ];

    displayExpenses();
    updateStats();
}

function clearFilters() {
    document.getElementById('filterTransactionType').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterPerson').value = '';
    document.getElementById('filterShared').value = '';
    document.getElementById('filterDescription').value = '';
    document.getElementById('filterMinAmount').value = '';
    document.getElementById('filterMaxAmount').value = '';
    applyFilters();
}

function displayExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    const resultCount = document.getElementById('resultCount');

    if (filteredTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron transacciones con los filtros aplicados</td></tr>';
        resultCount.textContent = '0 transacciones';
        return;
    }

    // Sort by date (most recent first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    const expenseCount = filteredTransactions.filter(t => t.transactionType === 'expense').length;
    const incomeCount = filteredTransactions.filter(t => t.transactionType === 'income').length;
    resultCount.textContent = `${filteredTransactions.length} transacciones (${expenseCount} gastos, ${incomeCount} ingresos)`;

    tbody.innerHTML = sortedTransactions.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>
                <span class="badge ${item.transactionType === 'income' ? 'badge-shared' : getTypeBadgeClass(item.type)}">
                    ${item.transactionType === 'income' ? 'Ingreso' : getTypeDisplayName(item.type)}
                </span>
            </td>
            <td>${item.category}</td>
            <td>${item.description || '-'}</td>
            <td>
                <strong style="color: ${item.transactionType === 'income' ? '#10b981' : '#ef4444'};">
                    ${item.transactionType === 'income' ? '+' : ''}${formatCurrency(item.amount)}
                </strong>
            </td>
            <td>${item.transactionType === 'income' ? item.receivedBy : item.paidBy}</td>
            <td>
                ${item.transactionType === 'income' ?
                    '<span class="badge badge-shared">Ingreso</span>' :
                    `<span class="badge ${item.isShared ? 'badge-shared' : 'badge-personal'}">
                        ${item.isShared ? 'Común' : 'Personal'}
                    </span>`
                }
            </td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-primary" onclick="${item.transactionType === 'income' ? 'openEditIncomeModal' : 'openEditModal'}('${item.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="${item.transactionType === 'income' ? 'deleteIncome' : 'deleteExpense'}('${item.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const filteredExpenses = filteredTransactions.filter(t => t.transactionType === 'expense');
    const filteredIncomes = filteredTransactions.filter(t => t.transactionType === 'income');

    const expenseTotals = calculateTotals(filteredExpenses);

    let totalIncome = 0;
    filteredIncomes.forEach(income => {
        totalIncome += parseFloat(income.amount);
    });

    const balance = totalIncome - expenseTotals.total;

    document.getElementById('statIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('statTotal').textContent = formatCurrency(expenseTotals.total);
    document.getElementById('statBalance').textContent = formatCurrency(balance);
    document.getElementById('statBalance').style.color = balance >= 0 ? '#10b981' : '#ef4444';
    document.getElementById('statCount').textContent = filteredTransactions.length;
    document.getElementById('statBreakdown').textContent = `${filteredIncomes.length} ingresos, ${filteredExpenses.length} gastos`;
}

function exportFiltered() {
    if (filteredTransactions.length === 0) {
        showAlert('No hay transacciones para exportar', 'error');
        return;
    }

    const filterMonth = document.getElementById('filterMonth').value;
    const filename = filterMonth
        ? `transacciones_${filterMonth}.csv`
        : 'transacciones_todas.csv';

    // Separate expenses and incomes for export
    const filteredExpenses = filteredTransactions.filter(t => t.transactionType === 'expense');
    const filteredIncomes = filteredTransactions.filter(t => t.transactionType === 'income');

    // Export both if we have them
    if (filteredExpenses.length > 0) {
        exportToCSV(filteredExpenses, filename.replace('transacciones', 'gastos'));
    }
    if (filteredIncomes.length > 0) {
        const incomeFilename = filename.replace('transacciones', 'ingresos');
        // Export incomes (assuming exportToCSV can handle income structure)
        exportToCSV(filteredIncomes, incomeFilename);
    }

    showAlert('Transacciones exportadas exitosamente', 'success');
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

async function deleteIncome(incomeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
        return;
    }

    try {
        await api.delete(`/incomes/${incomeId}`);
        incomes = incomes.filter(i => i.id !== incomeId);

        showAlert('Ingreso eliminado exitosamente', 'success');
        applyFilters();
    } catch (error) {
        console.error('Error deleting income:', error);
        showAlert(`Error al eliminar el ingreso: ${error.message}`, 'error');
    }
}

// Income edit modal functions
async function openEditIncomeModal(incomeId) {
    const income = incomes.find(i => i.id === incomeId);
    if (!income) return;

    document.getElementById('editIncomeId').value = income.id;
    document.getElementById('editIncomeCategory').value = income.category;
    document.getElementById('editIncomeAmount').value = income.amount;
    document.getElementById('editIncomeDate').value = income.date;
    document.getElementById('editIncomeReceivedBy').value = income.receivedBy;
    document.getElementById('editIncomeDescription').value = income.description || '';

    document.getElementById('editIncomeModal').classList.add('active');
}

function closeEditIncomeModal() {
    document.getElementById('editIncomeModal').classList.remove('active');
    document.getElementById('editIncomeForm').reset();
}

async function handleEditIncomeFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const incomeId = formData.get('editIncomeId');

    const updatedIncome = {
        category: formData.get('editIncomeCategory'),
        amount: parseFloat(formData.get('editIncomeAmount')),
        date: formData.get('editIncomeDate'),
        receivedBy: formData.get('editIncomeReceivedBy'),
        description: formData.get('editIncomeDescription') || ''
    };

    try {
        await api.put(`/incomes/${incomeId}`, updatedIncome);

        const index = incomes.findIndex(i => i.id === incomeId);
        if (index !== -1) {
            incomes[index] = { ...incomes[index], ...updatedIncome };
        }

        showAlert('Ingreso actualizado exitosamente', 'success');
        closeEditIncomeModal();
        applyFilters();
    } catch (error) {
        console.error('Error updating income:', error);
        showAlert(`Error al actualizar el ingreso: ${error.message}`, 'error');
    }
}

// Close modals when clicking outside
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const editIncomeModal = document.getElementById('editIncomeModal');
    if (editIncomeModal) {
        editIncomeModal.addEventListener('click', (e) => {
            if (e.target.id === 'editIncomeModal') {
                closeEditIncomeModal();
            }
        });
    }

    const editIncomeForm = document.getElementById('editIncomeForm');
    if (editIncomeForm) {
        editIncomeForm.addEventListener('submit', handleEditIncomeFormSubmit);
    }
});
