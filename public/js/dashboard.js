let categories = {};
let config = {};
let expenses = [];
let incomes = [];
let charts = {};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes()
        ]);

        setupMonthSelector();
        setupEventHandlers();
        
        // Load current month by default
        const monthSelect = document.getElementById('dashboardMonth');
        if (monthSelect.options.length > 1) {
            monthSelect.selectedIndex = 1;
            updateDashboard();
        }
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
}

async function loadExpenses() {
    expenses = await api.get('/expenses');
}

async function loadIncomes() {
    incomes = await api.get('/incomes');
}

function setupMonthSelector() {
    const expenseMonths = getUniqueMonths(expenses);
    const incomeMonths = getUniqueMonths(incomes);
    const allMonths = [...new Set([...expenseMonths, ...incomeMonths])].sort().reverse();
    
    const select = document.getElementById('dashboardMonth');
    select.innerHTML = '<option value="">Selecciona un mes...</option>';
    
    allMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = getMonthName(month);
        select.appendChild(option);
    });
}

function setupEventHandlers() {
    document.getElementById('dashboardMonth').addEventListener('change', updateDashboard);
    document.getElementById('btnQuickExpense').addEventListener('click', openQuickExpense);
    document.getElementById('navAddExpense').addEventListener('click', (e) => {
        e.preventDefault();
        openQuickExpense();
    });
    document.getElementById('quickExpenseForm').addEventListener('submit', handleQuickExpenseSubmit);
    document.getElementById('qType').addEventListener('change', handleQuickTypeChange);
}

function updateDashboard() {
    const selectedMonth = document.getElementById('dashboardMonth').value;
    
    if (!selectedMonth) {
        clearDashboard();
        return;
    }
    
    const monthExpenses = filterExpensesByMonth(expenses, selectedMonth);
    const monthIncomes = filterExpensesByMonth(incomes, selectedMonth);
    
    updateStats(monthExpenses, monthIncomes);
    updateBalance(monthExpenses);
    updateCharts(monthExpenses, monthIncomes);
    displayRecentActivity(monthExpenses, monthIncomes);
}

function clearDashboard() {
    document.getElementById('dashIncome').textContent = '€0.00';
    document.getElementById('dashExpenses').textContent = '€0.00';
    document.getElementById('dashBalance').textContent = '€0.00';
    document.getElementById('dashShared').textContent = '€0.00';
    document.getElementById('dashPersonal').textContent = '€0.00';
    document.getElementById('dashSavings').textContent = '0%';
    document.getElementById('balanceContainer').innerHTML = '<p class="text-center">Selecciona un mes</p>';
    document.getElementById('recentActivityBody').innerHTML = '<tr><td colspan="5" class="text-center">Selecciona un mes</td></tr>';
    
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
}

function updateStats(monthExpenses, monthIncomes) {
    const expenseTotals = calculateTotals(monthExpenses);
    
    let totalIncome = 0;
    monthIncomes.forEach(income => {
        totalIncome += parseFloat(income.amount);
    });
    
    const balance = totalIncome - expenseTotals.total;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
    
    document.getElementById('dashIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('dashExpenses').textContent = formatCurrency(expenseTotals.total);
    document.getElementById('dashBalance').textContent = formatCurrency(balance);
    document.getElementById('dashShared').textContent = formatCurrency(expenseTotals.shared);
    document.getElementById('dashPersonal').textContent = formatCurrency(expenseTotals.personal);
    document.getElementById('dashSavings').textContent = savingsRate + '%';
}

function updateBalance(monthExpenses) {
    const balance = calculateBalance(monthExpenses, config);
    const container = document.getElementById('balanceContainer');
    
    const persons = config.persons;
    const percentages = config.splitPercentages;
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    persons.forEach(person => {
        const personBalance = balance[person];
        const isPositive = personBalance.balance >= 0;
        
        html += `
            <div style="padding: 1.5rem; background: ${isPositive ? '#d1fae5' : '#fee2e2'}; border-radius: 0.5rem;">
                <h3 style="margin-bottom: 1rem; font-size: 1.25rem;">${person}</h3>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Porcentaje:</span>
                    <strong>${percentages[person]}%</strong>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Pagó en común:</span>
                    <strong>${formatCurrency(personBalance.paid)}</strong>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Debería pagar:</span>
                    <strong>${formatCurrency(personBalance.shouldPay)}</strong>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid rgba(0,0,0,0.1);">
                    <span style="color: #6b7280;">Balance:</span>
                    <strong style="font-size: 1.5rem; color: ${isPositive ? '#059669' : '#dc2626'};">
                        ${isPositive ? '+' : ''}${formatCurrency(personBalance.balance)}
                    </strong>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    const person1 = persons[0];
    const person2 = persons[1];
    const balance1 = balance[person1].balance;
    
    if (Math.abs(balance1) > 0.01) {
        html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #dbeafe; border-radius: 0.5rem; text-align: center;">
                <strong style="font-size: 1.25rem;">💰 Para equilibrar:</strong>
                <p style="margin-top: 0.5rem; font-size: 1.125rem;">
                    ${balance1 < 0 ? person1 : person2} debe pagar 
                    <strong>${formatCurrency(Math.abs(balance1))}</strong>
                    a ${balance1 < 0 ? person2 : person1}
                </p>
            </div>
        `;
    } else {
        html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #d1fae5; border-radius: 0.5rem; text-align: center;">
                <strong style="font-size: 1.25rem;">✅ ¡Cuentas equilibradas!</strong>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function updateCharts(monthExpenses, monthIncomes) {
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    const totals = calculateTotals(monthExpenses);
    
    let totalIncome = 0;
    const incomeByPerson = {};
    monthIncomes.forEach(income => {
        totalIncome += parseFloat(income.amount);
        if (!incomeByPerson[income.receivedBy]) {
            incomeByPerson[income.receivedBy] = 0;
        }
        incomeByPerson[income.receivedBy] += parseFloat(income.amount);
    });
    
    // Chart 1: Income vs Expenses
    const ctxIncomeExpenses = document.getElementById('chartIncomeExpenses').getContext('2d');
    charts.incomeExpenses = new Chart(ctxIncomeExpenses, {
        type: 'bar',
        data: {
            labels: ['Ingresos', 'Gastos', 'Balance'],
            datasets: [{
                label: 'Monto (€)',
                data: [totalIncome, totals.total, totalIncome - totals.total],
                backgroundColor: ['#10b981', '#ef4444', totalIncome - totals.total >= 0 ? '#3b82f6' : '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '€' + value }
                }
            }
        }
    });
    
    // Chart 2: By Type
    const ctxType = document.getElementById('chartByType').getContext('2d');
    charts.byType = new Chart(ctxType, {
        type: 'doughnut',
        data: {
            labels: ['Fijo', 'Variable', 'Diario'],
            datasets: [{
                data: [totals.byType.fijo, totals.byType.variable, totals.byType.diario],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
    
    // Chart 3: Shared vs Personal
    const ctxShared = document.getElementById('chartSharedPersonal').getContext('2d');
    charts.sharedPersonal = new Chart(ctxShared, {
        type: 'pie',
        data: {
            labels: ['Común', 'Personal'],
            datasets: [{
                data: [totals.shared, totals.personal],
                backgroundColor: ['#6366f1', '#ec4899']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
    
    // Chart 4: Income by Person
    const ctxIncomePerson = document.getElementById('chartIncomeByPerson').getContext('2d');
    const incomePersonLabels = Object.keys(incomeByPerson);
    const incomePersonData = incomePersonLabels.map(person => incomeByPerson[person]);
    
    charts.incomeByPerson = new Chart(ctxIncomePerson, {
        type: 'bar',
        data: {
            labels: incomePersonLabels,
            datasets: [{
                label: 'Ingresos',
                data: incomePersonData,
                backgroundColor: ['#10b981', '#34d399']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '€' + value }
                }
            }
        }
    });
}

function displayRecentActivity(monthExpenses, monthIncomes) {
    const tbody = document.getElementById('recentActivityBody');
    
    const allActivity = [
        ...monthExpenses.map(e => ({ ...e, activityType: 'expense' })),
        ...monthIncomes.map(i => ({ ...i, activityType: 'income' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    
    if (allActivity.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay actividad en este mes</td></tr>';
        return;
    }
    
    tbody.innerHTML = allActivity.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>
                <span class="badge ${item.activityType === 'income' ? 'badge-shared' : getTypeBadgeClass(item.type)}">
                    ${item.activityType === 'income' ? 'Ingreso' : getTypeDisplayName(item.type)}
                </span>
            </td>
            <td>${item.category}</td>
            <td>
                <strong style="color: ${item.activityType === 'income' ? '#10b981' : '#ef4444'};">
                    ${item.activityType === 'income' ? '+' : '-'}${formatCurrency(item.amount)}
                </strong>
            </td>
            <td>${item.activityType === 'income' ? item.receivedBy : item.paidBy}</td>
        </tr>
    `).join('');
}

// Quick expense modal
function openQuickExpense() {
    document.getElementById('quickExpenseModal').classList.add('active');
    setTodayAsDefault('qDate');
    
    const paidBySelect = document.getElementById('qPaidBy');
    const currentUser = getCurrentUser();
    
    paidBySelect.innerHTML = '<option value="">Selecciona...</option>';
    config.persons.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        // Select current user by default
        if (person === currentUser) {
            option.selected = true;
        }
        paidBySelect.appendChild(option);
    });
    
    // Trigger type change to show quick buttons for "fijo" (default)
    document.getElementById('qType').value = 'fijo';
    handleQuickTypeChange({ target: { value: 'fijo' } });
    
    // Focus on amount field
    setTimeout(() => {
        document.getElementById('qAmount').focus();
    }, 100);
}

function closeQuickExpense() {
    document.getElementById('quickExpenseModal').classList.remove('active');
    document.getElementById('quickExpenseForm').reset();
}

function handleQuickTypeChange(e) {
    const type = e.target.value;
    const categorySelect = document.getElementById('qCategory');
    const quickCategoriesDiv = document.getElementById('quickCategories');
    
    if (!type) {
        categorySelect.disabled = true;
        categorySelect.innerHTML = '<option value="">Primero selecciona un tipo</option>';
        if (quickCategoriesDiv) quickCategoriesDiv.style.display = 'none';
        return;
    }
    
    const typeCategories = categories[type] || [];

    // Show ALL categories as buttons
    if (quickCategoriesDiv) {
        quickCategoriesDiv.style.display = 'block';
        const quickButtonsContainer = document.getElementById('quickCategoryButtons');

        // Show ALL categories as quick buttons
        quickButtonsContainer.innerHTML = typeCategories.map(cat => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const catEmoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '';
            return `
                <button type="button" class="quick-category-btn" data-category="${catName}">
                    ${catEmoji} ${catName}
                </button>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.quick-category-btn[data-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                categorySelect.value = btn.dataset.category;
                document.querySelectorAll('.quick-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Hide the select since we only use buttons
        categorySelect.style.display = 'none';
    }
    
    // Populate select with all categories
    categorySelect.disabled = false;
    categorySelect.innerHTML = '<option value="">Selecciona...</option>';
    
    typeCategories.forEach(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        const catEmoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '';
        const option = document.createElement('option');
        option.value = catName;
        option.textContent = `${catEmoji} ${catName}`;
        categorySelect.appendChild(option);
    });
}

async function handleQuickExpenseSubmit(e) {
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
    
    // Check if month is closed
    const expenseMonth = expense.date.substring(0, 7);
    const closedMonths = config.closedMonths || [];
    if (closedMonths.includes(expenseMonth)) {
        showAlert(`No se pueden agregar gastos en ${getMonthName(expenseMonth)} porque el mes está cerrado`, 'error');
        return;
    }
    
    try {
        const newExpense = await api.post('/expenses', expense);
        expenses.push(newExpense);
        
        showAlert('¡Gasto registrado exitosamente!', 'success');
        closeQuickExpense();
        updateDashboard();
    } catch (error) {
        console.error('Error saving expense:', error);
        showAlert(`Error al guardar el gasto: ${error.message}`, 'error');
    }
}

document.getElementById('quickExpenseModal').addEventListener('click', (e) => {
    if (e.target.id === 'quickExpenseModal') {
        closeQuickExpense();
    }
});
