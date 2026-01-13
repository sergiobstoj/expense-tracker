let categories = {};
let config = {};
let expenses = [];
let incomes = [];
let settlements = [];
let charts = {};
let dailyExpensesConfig = {};
let fixedExpensesConfig = {};
let variableExpensesConfig = {};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes(),
            loadSettlements(),
            loadDailyExpensesConfig(),
            loadFixedExpensesConfig(),
            loadVariableExpensesConfig()
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
    try {
        categories = await api.get('/categories');
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = { fijo: [], variable: [], diario: [] };
    }
}

async function loadConfig() {
    try {
        config = await api.get('/config');
    } catch (error) {
        console.error('Error loading config:', error);
        config = { persons: [], splitPercentages: {} };
    }
}

async function loadExpenses() {
    try {
        expenses = await api.get('/expenses');
    } catch (error) {
        console.error('Error loading expenses:', error);
        expenses = [];
    }
}

async function loadIncomes() {
    try {
        incomes = await api.get('/incomes');
    } catch (error) {
        console.error('Error loading incomes:', error);
        incomes = [];
    }
}

async function loadSettlements() {
    try {
        settlements = await api.get('/settlements');
    } catch (error) {
        console.error('Error loading settlements:', error);
        settlements = [];
    }
}

async function loadDailyExpensesConfig() {
    try {
        dailyExpensesConfig = await api.get('/expenses-config/daily');
    } catch (error) {
        console.error('Error loading daily expenses config:', error);
        dailyExpensesConfig = { globalBudget: 0, categories: {} };
    }
}

async function loadFixedExpensesConfig() {
    try {
        fixedExpensesConfig = await api.get('/expenses-config/fixed');
    } catch (error) {
        console.error('Error loading fixed expenses config:', error);
        fixedExpensesConfig = {};
    }
}

async function loadVariableExpensesConfig() {
    try {
        variableExpensesConfig = await api.get('/expenses-config/variable');
    } catch (error) {
        console.error('Error loading variable expenses config:', error);
        variableExpensesConfig = {};
    }
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
    document.getElementById('settlementForm').addEventListener('submit', handleSettlementSubmit);
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
    updateBalance(monthExpenses, selectedMonth);
    updateFixedExpensesSection(monthExpenses, selectedMonth);
    updateVariableExpensesSection(monthExpenses, selectedMonth);
    updateCharts(monthExpenses, monthIncomes);
    displayRecentActivity(monthExpenses, monthIncomes);
    updateDailyBudgetWidget(monthExpenses, selectedMonth);
}

function clearDashboard() {
    document.getElementById('dashIncome').textContent = '€0.00';
    document.getElementById('dashExpenses').textContent = '€0.00';
    document.getElementById('dashBalance').textContent = '€0.00';
    document.getElementById('dashShared').textContent = '€0.00';
    document.getElementById('dashPersonal').textContent = '€0.00';
    document.getElementById('dashSavings').textContent = '0%';
    document.getElementById('dashDailyAvg').textContent = '€0.00';
    document.getElementById('dashDailyAvgInfo').textContent = '';
    document.getElementById('dashProjection').textContent = '€0.00';
    document.getElementById('dashProjectionInfo').textContent = '';
    document.getElementById('dashTopCategory').textContent = '-';
    document.getElementById('dashTopCategoryAmount').textContent = '';
    document.getElementById('balanceContainer').innerHTML = '<p class="text-center">Selecciona un mes</p>';
    document.getElementById('fixedExpensesSection').innerHTML = '<p class="text-center text-muted" style="font-style: italic;">Selecciona un mes para ver los gastos fijos</p>';
    document.getElementById('variableExpensesSection').innerHTML = '<p class="text-center text-muted" style="font-style: italic;">Selecciona un mes para ver los gastos variables</p>';
    document.getElementById('dailyBudgetWidget').innerHTML = '<p class="text-center text-muted" style="font-style: italic;">Selecciona un mes para ver el presupuesto</p>';
    document.getElementById('recentActivityBody').innerHTML = '<tr><td colspan="7" class="text-center">Selecciona un mes</td></tr>';
    document.getElementById('transactionCount').textContent = '';

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

    // Compare with previous month and enhanced metrics
    const selectedMonth = document.getElementById('dashboardMonth').value;
    if (selectedMonth) {
        const previousMonth = getPreviousMonth(selectedMonth);
        const prevMonthExpenses = filterExpensesByMonth(expenses, previousMonth);
        const prevMonthIncomes = filterExpensesByMonth(incomes, previousMonth);

        if (prevMonthExpenses.length > 0 || prevMonthIncomes.length > 0) {
            const prevExpenseTotals = calculateTotals(prevMonthExpenses);
            let prevTotalIncome = 0;
            prevMonthIncomes.forEach(income => {
                prevTotalIncome += parseFloat(income.amount);
            });
            const prevBalance = prevTotalIncome - prevExpenseTotals.total;

            // Calculate trends
            displayTrend('dashIncomeTrend', totalIncome, prevTotalIncome);
            displayTrend('dashExpensesTrend', expenseTotals.total, prevExpenseTotals.total, true); // inverted for expenses
            displayTrend('dashBalanceTrend', balance, prevBalance);
        } else {
            document.getElementById('dashIncomeTrend').textContent = '';
            document.getElementById('dashExpensesTrend').textContent = '';
            document.getElementById('dashBalanceTrend').textContent = '';
        }
    }

    // Enhanced metrics
    if (selectedMonth && monthExpenses.length > 0) {
        // Calculate daily average
        const monthStart = new Date(selectedMonth + '-01');
        const today = new Date();
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

        const now = new Date();
        const isCurrentMonth = monthStart.getMonth() === now.getMonth() && monthStart.getFullYear() === now.getFullYear();
        const daysElapsed = isCurrentMonth ? now.getDate() : monthEnd.getDate();

        const dailyAvg = expenseTotals.total / daysElapsed;
        document.getElementById('dashDailyAvg').textContent = formatCurrency(dailyAvg);
        document.getElementById('dashDailyAvgInfo').textContent = `${daysElapsed} día${daysElapsed !== 1 ? 's' : ''}`;

        // Calculate projection for end of month
        if (isCurrentMonth) {
            const daysInMonth = monthEnd.getDate();
            const daysRemaining = daysInMonth - daysElapsed;
            // Projection = current expenses + (daily avg * days remaining)
            const projection = expenseTotals.total + (dailyAvg * daysRemaining);
            document.getElementById('dashProjection').textContent = formatCurrency(projection);
            document.getElementById('dashProjectionInfo').textContent = `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restantes`;
        } else {
            document.getElementById('dashProjection').textContent = formatCurrency(expenseTotals.total);
            document.getElementById('dashProjectionInfo').textContent = 'Mes cerrado';
        }

        // Find top category
        const categoryTotals = {};
        monthExpenses.forEach(expense => {
            const key = expense.category;
            if (!categoryTotals[key]) {
                categoryTotals[key] = 0;
            }
            categoryTotals[key] += parseFloat(expense.amount);
        });

        if (Object.keys(categoryTotals).length > 0) {
            const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
            document.getElementById('dashTopCategory').textContent = topCategory[0];
            document.getElementById('dashTopCategoryAmount').textContent = formatCurrency(topCategory[1]);
        }
    }
}

function updateBalance(monthExpenses, selectedMonth) {
    const balance = calculateBalance(monthExpenses, config, selectedMonth);
    const container = document.getElementById('balanceContainer');

    const persons = config.persons;
    const percentages = getMonthPercentages(config, selectedMonth);

    // Calculate settlements for this month
    const monthSettlements = (settlements || []).filter(s => s.month === selectedMonth);
    let adjustedBalance = { ...balance };

    // Adjust balance with settlements
    monthSettlements.forEach(settlement => {
        if (adjustedBalance[settlement.from]) {
            adjustedBalance[settlement.from].balance += settlement.amount;
        }
        if (adjustedBalance[settlement.to]) {
            adjustedBalance[settlement.to].balance -= settlement.amount;
        }
    });

    let html = '<div class="balance-grid">';

    persons.forEach(person => {
        const personBalance = adjustedBalance[person];
        const isPositive = personBalance.balance >= 0;

        html += `
            <div class="balance-person-card ${isPositive ? 'positive' : 'negative'}">
                <h3 class="balance-person-name">${person}</h3>
                <div class="balance-row">
                    <span class="text-muted">Porcentaje:</span>
                    <strong>${percentages[person]}%</strong>
                </div>
                <div class="balance-row">
                    <span class="text-muted">Pagó en común:</span>
                    <strong>${formatCurrency(personBalance.paid)}</strong>
                </div>
                <div class="balance-row">
                    <span class="text-muted">Debería pagar:</span>
                    <strong>${formatCurrency(personBalance.shouldPay)}</strong>
                </div>
                <div class="balance-total">
                    <span class="text-muted">Balance:</span>
                    <strong class="balance-amount ${isPositive ? 'text-success' : 'text-danger'}">
                        ${isPositive ? '+' : ''}${formatCurrency(personBalance.balance)}
                    </strong>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Show settlements history if any
    if (monthSettlements.length > 0) {
        html += `
            <div class="settlements-history">
                <strong class="settlements-title">💸 Pagos Registrados:</strong>
                ${monthSettlements.map(s => `
                    <div class="settlement-item">
                        <strong>${s.from}</strong> pagó <strong class="text-success">${formatCurrency(s.amount)}</strong> a <strong>${s.to}</strong>
                        <span class="settlement-detail text-muted">
                            ${formatDate(s.date)}${s.description ? ' - ' + s.description : ''}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const person1 = persons[0];
    const person2 = persons[1];
    const balance1 = adjustedBalance[person1].balance;

    if (Math.abs(balance1) > 0.01) {
        const debtor = balance1 < 0 ? person1 : person2;
        const creditor = balance1 < 0 ? person2 : person1;
        html += `
            <div class="balance-action-box needs-payment">
                <div class="text-center mb-2">
                    <strong class="balance-action-title">💰 Para equilibrar:</strong>
                    <p class="balance-action-text">
                        ${debtor} debe pagar
                        <strong>${formatCurrency(Math.abs(balance1))}</strong>
                        a ${creditor}
                    </p>
                </div>
                <div class="text-center">
                    <button class="btn btn-success" onclick="openSettlementModal('${selectedMonth}', '${debtor}', '${creditor}', ${balance1})">
                        Registrar Pago
                    </button>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="balance-action-box balanced">
                <strong class="balance-action-title">✅ ¡Cuentas equilibradas!</strong>
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
    const countElement = document.getElementById('transactionCount');

    const allActivity = [
        ...monthExpenses.map(e => ({ ...e, activityType: 'expense' })),
        ...monthIncomes.map(i => ({ ...i, activityType: 'income' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)); // Removed slice(0, 10) to show all

    if (allActivity.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay transacciones en este mes</td></tr>';
        countElement.textContent = '0 transacciones';
        return;
    }

    countElement.textContent = `${allActivity.length} transacción${allActivity.length !== 1 ? 'es' : ''}`;

    tbody.innerHTML = allActivity.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>
                <span class="badge ${item.activityType === 'income' ? 'badge-shared' : getTypeBadgeClass(item.type)}">
                    ${item.activityType === 'income' ? 'Ingreso' : getTypeDisplayName(item.type)}
                </span>
            </td>
            <td>${item.category}</td>
            <td>${item.description || '-'}</td>
            <td>
                <strong style="color: ${item.activityType === 'income' ? '#10b981' : '#ef4444'};">
                    ${item.activityType === 'income' ? '+' : '-'}${formatCurrency(item.amount)}
                </strong>
            </td>
            <td>${item.activityType === 'income' ? item.receivedBy : item.paidBy}</td>
            <td>
                ${item.activityType === 'income' ?
                    '<span class="badge badge-shared">Ingreso</span>' :
                    (item.isShared ?
                        '<span class="badge badge-shared">Común</span>' :
                        '<span class="badge badge-personal">Personal</span>')
                }
            </td>
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

// Settlement modal functions
function openSettlementModal(month, from, to, amount) {
    document.getElementById('settlementMonth').value = month;
    document.getElementById('settlementFrom').value = from;
    document.getElementById('settlementTo').value = to;
    document.getElementById('settlementAmount').value = Math.abs(amount).toFixed(2);
    document.getElementById('settlementInfo').textContent = `${from} debe pagar ${formatCurrency(Math.abs(amount))} a ${to}`;
    setTodayAsDefault('settlementDate');

    document.getElementById('settlementModal').classList.add('active');

    setTimeout(() => {
        document.getElementById('settlementAmount').focus();
    }, 100);
}

function closeSettlementModal() {
    document.getElementById('settlementModal').classList.remove('active');
    document.getElementById('settlementForm').reset();
}

async function handleSettlementSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const settlement = {
        month: formData.get('month'),
        from: formData.get('from'),
        to: formData.get('to'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        description: formData.get('description') || ''
    };

    try {
        const newSettlement = await api.post('/settlements', settlement);
        settlements.push(newSettlement);

        showAlert('¡Pago registrado exitosamente!', 'success');
        closeSettlementModal();
        updateDashboard();
    } catch (error) {
        console.error('Error saving settlement:', error);
        showAlert(`Error al registrar el pago: ${error.message}`, 'error');
    }
}

document.getElementById('settlementModal').addEventListener('click', (e) => {
    if (e.target.id === 'settlementModal') {
        closeSettlementModal();
    }
});

// Helper functions for trends
function getPreviousMonth(monthString) {
    const [year, month] = monthString.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${prevYear}-${prevMonth}`;
}

function displayTrend(elementId, current, previous, inverted = false) {
    const element = document.getElementById(elementId);
    if (previous === 0) {
        element.textContent = '';
        return;
    }

    const change = ((current - previous) / previous) * 100;
    const absChange = Math.abs(change);

    // For expenses, lower is better, so we invert the logic
    const isPositive = inverted ? change < 0 : change > 0;
    const arrow = isPositive ? '↑' : '↓';

    if (Math.abs(change) < 0.5) {
        element.textContent = '→ Sin cambios';
    } else {
        element.textContent = `${arrow} ${absChange.toFixed(1)}% vs mes anterior`;
    }
}

// ============================================
// DAILY BUDGET WIDGET
// ============================================

function updateDailyBudgetWidget(monthExpenses, selectedMonth) {
    const container = document.getElementById('dailyBudgetWidget');
    if (!container) return;

    const dailyCategories = categories.diario || [];
    const globalBudget = dailyExpensesConfig.globalBudget || 0;

    // If no budget configured, show message
    if (globalBudget === 0 && dailyCategories.length === 0) {
        container.innerHTML = `
            <p class="text-center text-muted">
                No hay presupuesto configurado.
                <a href="/daily-expenses.html" class="text-primary" style="text-decoration: underline;">Configúralo aquí</a>
            </p>
        `;
        return;
    }

    // Get daily expenses for selected month
    const dailyExpenses = monthExpenses.filter(e => e.type === 'diario');

    // Calculate total spent
    let totalDailySpent = 0;
    dailyExpenses.forEach(expense => {
        totalDailySpent += parseFloat(expense.amount);
    });

    const globalRemaining = globalBudget - totalDailySpent;
    const globalPercentUsed = globalBudget > 0 ? (totalDailySpent / globalBudget) * 100 : 0;

    // Calculate days in month and days remaining
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);
    const currentDayOfMonth = today.getDate();
    const daysRemaining = isCurrentMonth ? daysInMonth - currentDayOfMonth : 0;
    const dailyAllowance = daysRemaining > 0 ? globalRemaining / daysRemaining : 0;

    // Determine status color and class
    const budgetColorClass = globalPercentUsed > 100 ? 'text-danger' : globalPercentUsed > 90 ? 'text-warning' : 'text-success';
    const budgetColor = globalPercentUsed > 100 ? 'var(--danger)' : globalPercentUsed > 90 ? 'var(--warning)' : globalPercentUsed > 75 ? 'var(--warning)' : 'var(--success)';
    const statusText = globalPercentUsed > 100 ? '⚠️ PRESUPUESTO EXCEDIDO' : globalPercentUsed > 90 ? '⚠️ CASI AGOTADO' : globalPercentUsed > 75 ? '⚡ ATENCIÓN' : '✓ BAJO CONTROL';

    let html = `
        <div class="mb-3">
            <div class="budget-widget-header">
                <h3 class="budget-widget-title">Presupuesto Global</h3>
                <span class="${budgetColorClass}" style="font-weight: 600;">${statusText}</span>
            </div>

            <div class="budget-stats-grid">
                <div class="budget-stat-item">
                    <span class="budget-stat-label">Gastado</span>
                    <span class="budget-stat-value">${formatCurrency(totalDailySpent)}</span>
                </div>
                <div class="budget-stat-item">
                    <span class="budget-stat-label">Presupuesto</span>
                    <span class="budget-stat-value">${formatCurrency(globalBudget)}</span>
                </div>
                <div class="budget-stat-item">
                    <span class="budget-stat-label">Restante</span>
                    <span class="budget-stat-value ${budgetColorClass}">${formatCurrency(globalRemaining)}</span>
                </div>
                <div class="budget-stat-item">
                    <span class="budget-stat-label">% Usado</span>
                    <span class="budget-stat-value ${budgetColorClass}">${globalPercentUsed.toFixed(1)}%</span>
                </div>
            </div>

            <div class="budget-progress-bar">
                <div class="budget-progress-fill" style="background: ${budgetColor}; width: ${Math.min(globalPercentUsed, 100)}%;"></div>
                ${globalPercentUsed > 100 ? `<div class="budget-progress-text">EXCEDIDO</div>` : ''}
            </div>

            ${isCurrentMonth && daysRemaining > 0 ? `
                <div class="budget-info-box" style="border-left: 4px solid ${budgetColor};">
                    <strong>Quedan ${daysRemaining} días</strong> en el mes (día ${currentDayOfMonth}/${daysInMonth}).
                    ${dailyAllowance > 0 ? `Puedes gastar <strong>${formatCurrency(dailyAllowance)}/día</strong> para mantenerte dentro del presupuesto.` : '<strong>Has agotado tu presupuesto.</strong>'}
                </div>
            ` : ''}
        </div>
    `;

    // Top 3 categories by spending
    const categoryTotals = {};
    dailyExpenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += parseFloat(expense.amount);
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    if (sortedCategories.length > 0) {
        html += '<div class="budget-top-categories">';
        html += '<h4 class="budget-top-title">Top Categorías</h4>';

        sortedCategories.forEach(([categoryName, spent], index) => {
            const configData = dailyExpensesConfig.categories?.[categoryName] || {};
            const budget = configData.monthlyBudget || 0;
            const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
            const catColorClass = percentUsed > 100 ? 'text-danger' : percentUsed > 90 ? 'text-warning' : 'text-success';

            html += `
                <div class="budget-category-item">
                    <div class="budget-category-left">
                        <span class="budget-category-rank">${index + 1}.</span>
                        <span class="budget-category-name">${categoryName}</span>
                    </div>
                    <div class="budget-category-right">
                        <div class="budget-category-amount">${formatCurrency(spent)}</div>
                        ${budget > 0 ? `<div class="budget-category-percent ${catColorClass}">${percentUsed.toFixed(0)}% de ${formatCurrency(budget)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

// ============================================
// FIXED EXPENSES SECTION
// ============================================

function updateFixedExpensesSection(monthExpenses, selectedMonth) {
    const container = document.getElementById('fixedExpensesSection');
    if (!container) return;

    const fixedCategories = categories.fijo || [];

    if (fixedCategories.length === 0) {
        container.innerHTML = `
            <p class="text-center text-muted">
                No hay categorías de gastos fijos configuradas.
                <a href="/fixed-expenses.html" class="text-primary" style="text-decoration: underline;">Configúralas aquí</a>
            </p>
        `;
        return;
    }

    // Filter fixed expenses for selected month
    const monthFixedExpenses = monthExpenses.filter(e => e.type === 'fijo');

    let html = '<div class="fixed-expenses-grid">';

    fixedCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📋';

        // Get expected config
        const configData = fixedExpensesConfig[categoryName] || {
            defaultAmount: 0,
            paymentDay: 1,
            assignedTo: ''
        };

        // Get actual expenses registered for this category
        const categoryExpenses = monthFixedExpenses.filter(e => e.category === categoryName);
        const totalPaid = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const isPaid = categoryExpenses.length > 0;

        // Get who paid
        const paidByList = [...new Set(categoryExpenses.map(e => e.paidBy))];
        const paidByText = paidByList.length > 0 ? paidByList.join(', ') : '-';

        html += `
            <div class="fixed-expense-card ${isPaid ? 'paid' : 'pending'}">
                <div class="fixed-expense-header">
                    <span class="fixed-expense-title">${emoji} ${categoryName}</span>
                    <span class="fixed-expense-status ${isPaid ? 'status-paid' : 'status-pending'}">
                        ${isPaid ? '✓ Pagado' : '✗ Pendiente'}
                    </span>
                </div>
                <div class="fixed-expense-body">
                    <div class="fixed-expense-row">
                        <span class="text-muted">Esperado:</span>
                        <strong>${formatCurrency(configData.defaultAmount)}</strong>
                    </div>
                    ${isPaid ? `
                        <div class="fixed-expense-row">
                            <span class="text-muted">Pagado:</span>
                            <strong class="text-success">${formatCurrency(totalPaid)}</strong>
                        </div>
                        <div class="fixed-expense-row">
                            <span class="text-muted">Por:</span>
                            <span>${paidByText}</span>
                        </div>
                    ` : `
                        <div class="fixed-expense-row">
                            <span class="text-muted">Día de pago:</span>
                            <span>Día ${configData.paymentDay}</span>
                        </div>
                        ${configData.assignedTo ? `
                            <div class="fixed-expense-row">
                                <span class="text-muted">Responsable:</span>
                                <span>${configData.assignedTo}</span>
                            </div>
                        ` : ''}
                    `}
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Summary
    const totalExpected = fixedCategories.reduce((sum, cat) => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return sum + (fixedExpensesConfig[catName]?.defaultAmount || 0);
    }, 0);
    const totalPaidAll = monthFixedExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const paidCount = fixedCategories.filter(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return monthFixedExpenses.some(e => e.category === catName);
    }).length;

    html += `
        <div class="fixed-expenses-summary">
            <div class="summary-item">
                <span class="text-muted">Progreso:</span>
                <strong>${paidCount}/${fixedCategories.length} pagados</strong>
            </div>
            <div class="summary-item">
                <span class="text-muted">Total esperado:</span>
                <strong>${formatCurrency(totalExpected)}</strong>
            </div>
            <div class="summary-item">
                <span class="text-muted">Total pagado:</span>
                <strong class="${totalPaidAll >= totalExpected ? 'text-success' : ''}">${formatCurrency(totalPaidAll)}</strong>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// ============================================
// VARIABLE EXPENSES SECTION
// ============================================

function updateVariableExpensesSection(monthExpenses, selectedMonth) {
    const container = document.getElementById('variableExpensesSection');
    if (!container) return;

    const variableCategories = categories.variable || [];

    if (variableCategories.length === 0) {
        container.innerHTML = `
            <p class="text-center text-muted">
                No hay categorías de gastos variables configuradas.
                <a href="/variable-expenses.html" class="text-primary" style="text-decoration: underline;">Configúralas aquí</a>
            </p>
        `;
        return;
    }

    // Filter variable expenses for selected month
    const monthVariableExpenses = monthExpenses.filter(e => e.type === 'variable');

    let html = '<div class="variable-expenses-grid">';

    variableCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📊';

        // Get config
        const configData = variableExpensesConfig[categoryName] || {
            estimatedAmount: 0,
            budgetAlert: 0
        };

        // Calculate current month spending
        const currentSpent = monthVariableExpenses
            .filter(e => e.category === categoryName)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        // Find last month with payment for this category
        const lastPaidData = findLastPaidMonthForCategory(categoryName, selectedMonth);

        // Calculate comparison
        let comparisonHtml = '';
        if (lastPaidData) {
            const diff = currentSpent - lastPaidData.amount;
            const percentChange = lastPaidData.amount > 0
                ? ((diff / lastPaidData.amount) * 100).toFixed(1)
                : 0;

            const isIncrease = diff > 0;
            const changeColor = isIncrease ? 'var(--danger)' : 'var(--success)';
            const arrow = isIncrease ? '↑' : '↓';

            comparisonHtml = `
                <div class="variable-expense-comparison" style="color: ${changeColor};">
                    ${arrow} ${isIncrease ? '+' : ''}${percentChange}% / ${isIncrease ? '+' : ''}${formatCurrency(diff)}
                    <span class="comparison-month">vs ${getMonthName(lastPaidData.month)}</span>
                </div>
            `;
        } else if (currentSpent > 0) {
            comparisonHtml = `
                <div class="variable-expense-comparison text-muted">
                    Sin datos previos
                </div>
            `;
        }

        // Status color based on budget
        const percentUsed = configData.estimatedAmount > 0
            ? (currentSpent / configData.estimatedAmount) * 100
            : 0;
        const statusColor = percentUsed > 100 ? 'var(--danger)'
                          : percentUsed > 90 ? 'var(--warning)'
                          : 'var(--success)';

        html += `
            <div class="variable-expense-card">
                <div class="variable-expense-header">
                    <span class="variable-expense-title">${emoji} ${categoryName}</span>
                </div>
                <div class="variable-expense-body">
                    <div class="variable-expense-amount">
                        <span class="amount-label">Este mes:</span>
                        <span class="amount-value">${formatCurrency(currentSpent)}</span>
                    </div>
                    ${configData.estimatedAmount > 0 ? `
                        <div class="variable-expense-budget">
                            <span class="text-muted">Estimado: ${formatCurrency(configData.estimatedAmount)}</span>
                            <span style="color: ${statusColor}; font-weight: 600;">${percentUsed.toFixed(0)}%</span>
                        </div>
                    ` : ''}
                    ${comparisonHtml}
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Summary
    const totalVariableSpent = monthVariableExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalEstimated = variableCategories.reduce((sum, cat) => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return sum + (variableExpensesConfig[catName]?.estimatedAmount || 0);
    }, 0);

    html += `
        <div class="variable-expenses-summary">
            <div class="summary-item">
                <span class="text-muted">Total gastado:</span>
                <strong>${formatCurrency(totalVariableSpent)}</strong>
            </div>
            ${totalEstimated > 0 ? `
                <div class="summary-item">
                    <span class="text-muted">Total estimado:</span>
                    <strong>${formatCurrency(totalEstimated)}</strong>
                </div>
                <div class="summary-item">
                    <span class="text-muted">Diferencia:</span>
                    <strong class="${totalVariableSpent <= totalEstimated ? 'text-success' : 'text-danger'}">
                        ${totalVariableSpent <= totalEstimated ? '-' : '+'}${formatCurrency(Math.abs(totalEstimated - totalVariableSpent))}
                    </strong>
                </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;
}

// Helper function to find last month with payment for a category
function findLastPaidMonthForCategory(categoryName, currentMonth) {
    const allMonths = getUniqueMonths(expenses).sort().reverse();

    for (const month of allMonths) {
        if (month >= currentMonth) continue; // Skip current and future months

        const monthExp = filterExpensesByMonth(expenses, month);
        const categoryExpenses = monthExp.filter(e =>
            e.type === 'variable' && e.category === categoryName
        );

        if (categoryExpenses.length > 0) {
            const totalAmount = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            return { month, amount: totalAmount };
        }
    }

    return null;
}
