let categories = {};
let config = {};
let expenses = [];
let incomes = [];
let settlements = [];
let charts = {};
let dailyExpensesConfig = {};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes(),
            loadSettlements(),
            loadDailyExpensesConfig()
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
    document.getElementById('dailyBudgetWidget').innerHTML = '<p class="text-center" style="color: #6b7280; font-style: italic;">Selecciona un mes para ver el presupuesto</p>';
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

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';

    persons.forEach(person => {
        const personBalance = adjustedBalance[person];
        const isPositive = personBalance.balance >= 0;

        html += `
            <div style="padding: 1.5rem; background: ${isPositive ? '#d1fae5' : '#fee2e2'}; border-radius: 0.5rem; color: #1f2937;">
                <h3 style="margin-bottom: 1rem; font-size: 1.25rem; color: #1f2937;">${person}</h3>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Porcentaje:</span>
                    <strong style="color: #1f2937;">${percentages[person]}%</strong>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Pagó en común:</span>
                    <strong style="color: #1f2937;">${formatCurrency(personBalance.paid)}</strong>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span style="color: #6b7280;">Debería pagar:</span>
                    <strong style="color: #1f2937;">${formatCurrency(personBalance.shouldPay)}</strong>
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

    // Show settlements history if any
    if (monthSettlements.length > 0) {
        html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #f0fdf4; border-radius: 0.5rem; border: 2px solid #10b981; color: #1f2937;">
                <strong style="font-size: 1.125rem; display: block; margin-bottom: 1rem; color: #1f2937;">💸 Pagos Registrados:</strong>
                ${monthSettlements.map(s => `
                    <div style="padding: 0.75rem; background: white; border-radius: 0.375rem; margin-bottom: 0.5rem; color: #1f2937;">
                        <strong style="color: #1f2937;">${s.from}</strong> pagó <strong style="color: #1f2937;">${formatCurrency(s.amount)}</strong> a <strong style="color: #1f2937;">${s.to}</strong>
                        <span style="color: #6b7280; font-size: 0.875rem; display: block; margin-top: 0.25rem;">
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
            <div style="margin-top: 2rem; padding: 1.5rem; background: #dbeafe; border-radius: 0.5rem; color: #1f2937;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <strong style="font-size: 1.25rem; color: #1f2937;">💰 Para equilibrar:</strong>
                    <p style="margin-top: 0.5rem; font-size: 1.125rem; color: #1f2937;">
                        ${debtor} debe pagar
                        <strong style="color: #1f2937;">${formatCurrency(Math.abs(balance1))}</strong>
                        a ${creditor}
                    </p>
                </div>
                <div style="text-align: center;">
                    <button class="btn btn-success" onclick="openSettlementModal('${selectedMonth}', '${debtor}', '${creditor}', ${balance1})">
                        Registrar Pago
                    </button>
                </div>
            </div>
        `;
    } else {
        html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #d1fae5; border-radius: 0.5rem; text-align: center; color: #1f2937;">
                <strong style="font-size: 1.25rem; color: #1f2937;">✅ ¡Cuentas equilibradas!</strong>
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
            <p class="text-center" style="color: #6b7280;">
                No hay presupuesto configurado.
                <a href="/settings.html" style="color: #3b82f6; text-decoration: underline;">Configúralo aquí</a>
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

    // Determine status color
    const budgetColor = globalPercentUsed > 100 ? '#ef4444' : globalPercentUsed > 90 ? '#f59e0b' : globalPercentUsed > 75 ? '#eab308' : '#10b981';
    const statusText = globalPercentUsed > 100 ? '⚠️ PRESUPUESTO EXCEDIDO' : globalPercentUsed > 90 ? '⚠️ CASI AGOTADO' : globalPercentUsed > 75 ? '⚡ ATENCIÓN' : '✓ BAJO CONTROL';

    let html = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">Presupuesto Global</h3>
                <span style="color: ${budgetColor}; font-weight: 600;">${statusText}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <div style="color: #6b7280; font-size: 0.875rem;">Gastado</div>
                    <div style="font-weight: 600; font-size: 1.125rem;">${formatCurrency(totalDailySpent)}</div>
                </div>
                <div>
                    <div style="color: #6b7280; font-size: 0.875rem;">Presupuesto</div>
                    <div style="font-weight: 600; font-size: 1.125rem;">${formatCurrency(globalBudget)}</div>
                </div>
                <div>
                    <div style="color: #6b7280; font-size: 0.875rem;">Restante</div>
                    <div style="font-weight: 600; font-size: 1.125rem; color: ${budgetColor};">
                        ${formatCurrency(globalRemaining)}
                    </div>
                </div>
                <div>
                    <div style="color: #6b7280; font-size: 0.875rem;">% Usado</div>
                    <div style="font-weight: 600; font-size: 1.125rem; color: ${budgetColor};">
                        ${globalPercentUsed.toFixed(1)}%
                    </div>
                </div>
            </div>

            <div style="background: #e5e7eb; border-radius: 0.5rem; height: 24px; overflow: hidden; position: relative;">
                <div style="background: ${budgetColor}; height: 100%; width: ${Math.min(globalPercentUsed, 100)}%; transition: width 0.3s;"></div>
                ${globalPercentUsed > 100 ? `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600;">EXCEDIDO</div>` : ''}
            </div>

            ${isCurrentMonth && daysRemaining > 0 ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem; border-left: 4px solid ${budgetColor};">
                    <div style="font-size: 0.875rem; color: #374151;">
                        <strong>Quedan ${daysRemaining} días</strong> en el mes (día ${currentDayOfMonth}/${daysInMonth}).
                        ${dailyAllowance > 0 ? `Puedes gastar <strong>${formatCurrency(dailyAllowance)}/día</strong> para mantenerte dentro del presupuesto.` : '<strong>Has agotado tu presupuesto.</strong>'}
                    </div>
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
        html += '<h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem;">Top Categorías</h4>';
        html += '<div style="display: grid; gap: 0.75rem;">';

        sortedCategories.forEach(([categoryName, spent], index) => {
            const configData = dailyExpensesConfig.categories?.[categoryName] || {};
            const budget = configData.monthlyBudget || 0;
            const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
            const catColor = percentUsed > 100 ? '#ef4444' : percentUsed > 90 ? '#f59e0b' : '#10b981';

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f9fafb; border-radius: 0.375rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-weight: 600; color: #6b7280; font-size: 0.875rem;">${index + 1}.</span>
                        <span style="font-weight: 600;">${categoryName}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600;">${formatCurrency(spent)}</div>
                        ${budget > 0 ? `<div style="font-size: 0.75rem; color: ${catColor};">${percentUsed.toFixed(0)}% de ${formatCurrency(budget)}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}
