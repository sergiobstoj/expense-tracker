let categories = {};
let config = {};
let expenses = [];
let incomes = [];
let charts = {};
let variableExpensesConfig = {};
let dailyExpensesConfig = {};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes(),
            loadVariableExpensesConfig(),
            loadDailyExpensesConfig()
        ]);

        setupMonthSelector();
        setupEventHandlers();
        
        // Load current month by default
        const monthSelect = document.getElementById('reportMonth');
        if (monthSelect.options.length > 1) {
            monthSelect.selectedIndex = 1; // First real month option
            updateReport();
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

async function loadVariableExpensesConfig() {
    try {
        variableExpensesConfig = await api.get('/expenses-config/variable');
    } catch (error) {
        console.error('Error loading variable expenses config:', error);
        variableExpensesConfig = {};
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
    
    // Combine and deduplicate months
    const allMonths = [...new Set([...expenseMonths, ...incomeMonths])].sort().reverse();
    
    const select = document.getElementById('reportMonth');
    
    select.innerHTML = '<option value="">Selecciona un mes...</option>';
    
    allMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = getMonthName(month);
        select.appendChild(option);
    });
}

function setupEventHandlers() {
    document.getElementById('reportMonth').addEventListener('change', updateReport);
}

function updateReport() {
    const selectedMonth = document.getElementById('reportMonth').value;

    if (!selectedMonth) {
        clearReport();
        return;
    }

    const monthExpenses = filterExpensesByMonth(expenses, selectedMonth);
    const monthIncomes = filterExpensesByMonth(incomes, selectedMonth);

    updateStats(monthExpenses, monthIncomes);
    updateBalance(monthExpenses, selectedMonth);
    updateCharts(monthExpenses, monthIncomes);
    updateCategoriesTable(monthExpenses);
    updateVariableComparison(selectedMonth);
    updateDailyBudgetAnalysis(selectedMonth);
}

function clearReport() {
    document.getElementById('balanceContainer').innerHTML = '<p class="text-center">Selecciona un mes para ver el balance</p>';
    document.getElementById('monthIncome').textContent = '€0.00';
    document.getElementById('monthTotal').textContent = '€0.00';
    document.getElementById('monthBalance').textContent = '€0.00';
    document.getElementById('monthShared').textContent = '€0.00';
    document.getElementById('monthPersonal').textContent = '€0.00';
    document.getElementById('monthCount').textContent = '0';
    document.getElementById('categoriesTableBody').innerHTML = '<tr><td colspan="5" class="text-center">Selecciona un mes</td></tr>';
    document.getElementById('variableComparisonContainer').innerHTML = '<p class="text-center" style="color: #6b7280; font-style: italic;">Selecciona un mes para ver la comparación</p>';
    document.getElementById('dailyBudgetContainer').innerHTML = '<p class="text-center" style="color: #6b7280; font-style: italic;">Selecciona un mes para ver el análisis</p>';

    // Destroy existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
}

function updateStats(monthExpenses, monthIncomes) {
    const expenseTotals = calculateTotals(monthExpenses);
    
    // Calculate income totals
    let totalIncome = 0;
    monthIncomes.forEach(income => {
        totalIncome += parseFloat(income.amount);
    });
    
    const balance = totalIncome - expenseTotals.total;
    
    document.getElementById('monthIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('monthTotal').textContent = formatCurrency(expenseTotals.total);
    document.getElementById('monthBalance').textContent = formatCurrency(balance);
    document.getElementById('monthShared').textContent = formatCurrency(expenseTotals.shared);
    document.getElementById('monthPersonal').textContent = formatCurrency(expenseTotals.personal);
    document.getElementById('monthCount').textContent = monthExpenses.length + monthIncomes.length;
}

function updateBalance(monthExpenses, selectedMonth) {
    const balance = calculateBalance(monthExpenses, config, selectedMonth);
    const container = document.getElementById('balanceContainer');

    const persons = config.persons;
    // Get percentages for the selected month
    const percentages = getMonthPercentages(config, selectedMonth);
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    persons.forEach(person => {
        const personBalance = balance[person];
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
                <div style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">
                    ${isPositive ? 'Le deben' : 'Debe'} ${formatCurrency(Math.abs(personBalance.balance))}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add settlement message
    const person1 = persons[0];
    const person2 = persons[1];
    const balance1 = balance[person1].balance;
    
    if (Math.abs(balance1) > 0.01) {
        html += `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #dbeafe; border-radius: 0.5rem; text-align: center; color: #1f2937;">
                <strong style="font-size: 1.25rem; color: #1f2937;">💰 Para equilibrar:</strong>
                <p style="margin-top: 0.5rem; font-size: 1.125rem; color: #1f2937;">
                    ${balance1 < 0 ? person1 : person2} debe pagar
                    <strong style="color: #1f2937;">${formatCurrency(Math.abs(balance1))}</strong>
                    a ${balance1 < 0 ? person2 : person1}
                </p>
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
    // Destroy existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
    
    const totals = calculateTotals(monthExpenses);
    
    // Calculate income totals
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
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
                        }
                    }
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
                data: [
                    totals.byType.fijo,
                    totals.byType.variable,
                    totals.byType.diario
                ],
                backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Chart 3: By Person (Expenses)
    const ctxPerson = document.getElementById('chartByPerson').getContext('2d');
    const personLabels = Object.keys(totals.byPerson);
    const personData = personLabels.map(person => totals.byPerson[person].total);
    
    charts.byPerson = new Chart(ctxPerson, {
        type: 'bar',
        data: {
            labels: personLabels,
            datasets: [{
                label: 'Total gastado',
                data: personData,
                backgroundColor: ['#3b82f6', '#8b5cf6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Chart 4: Shared vs Personal
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
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Chart 5: Income by Person
    const ctxIncomePerson = document.getElementById('chartIncomeByPerson').getContext('2d');
    const incomePersonLabels = Object.keys(incomeByPerson);
    const incomePersonData = incomePersonLabels.map(person => incomeByPerson[person]);
    
    charts.incomeByPerson = new Chart(ctxIncomePerson, {
        type: 'bar',
        data: {
            labels: incomePersonLabels,
            datasets: [{
                label: 'Ingresos recibidos',
                data: incomePersonData,
                backgroundColor: ['#10b981', '#34d399']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
                        }
                    }
                }
            }
        }
    });
    
    // Chart 6: Daily Trend
    const dailyData = calculateDailyTrend(monthExpenses);
    const ctxTrend = document.getElementById('chartDailyTrend').getContext('2d');
    
    charts.dailyTrend = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: dailyData.labels,
            datasets: [{
                label: 'Gasto acumulado',
                data: dailyData.cumulative,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value;
                        }
                    }
                }
            }
        }
    });
}

function calculateDailyTrend(monthExpenses) {
    // Group expenses by day
    const dailyTotals = {};
    
    monthExpenses.forEach(expense => {
        const day = expense.date;
        if (!dailyTotals[day]) {
            dailyTotals[day] = 0;
        }
        dailyTotals[day] += parseFloat(expense.amount);
    });
    
    // Sort days and calculate cumulative
    const sortedDays = Object.keys(dailyTotals).sort();
    let cumulative = 0;
    const cumulativeData = [];
    
    sortedDays.forEach(day => {
        cumulative += dailyTotals[day];
        cumulativeData.push(cumulative);
    });
    
    return {
        labels: sortedDays.map(day => formatDate(day)),
        cumulative: cumulativeData
    };
}

function updateCategoriesTable(monthExpenses) {
    const tbody = document.getElementById('categoriesTableBody');
    
    // Group by type and category
    const categoryStats = {};
    
    monthExpenses.forEach(expense => {
        const key = `${expense.type}|${expense.category}`;
        if (!categoryStats[key]) {
            categoryStats[key] = {
                type: expense.type,
                category: expense.category,
                count: 0,
                total: 0
            };
        }
        categoryStats[key].count++;
        categoryStats[key].total += parseFloat(expense.amount);
    });
    
    // Convert to array and sort by total
    const statsArray = Object.values(categoryStats).sort((a, b) => b.total - a.total);
    
    tbody.innerHTML = statsArray.map(stat => `
        <tr>
            <td><span class="badge ${getTypeBadgeClass(stat.type)}">${getTypeDisplayName(stat.type)}</span></td>
            <td>${stat.category}</td>
            <td>${stat.count}</td>
            <td><strong>${formatCurrency(stat.total)}</strong></td>
            <td>${formatCurrency(stat.total / stat.count)}</td>
        </tr>
    `).join('');
}

// ============================================
// VARIABLE EXPENSES COMPARISON
// ============================================

function updateVariableComparison(selectedMonth) {
    const container = document.getElementById('variableComparisonContainer');
    if (!container) return;

    // Get previous month
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month-2 because month is 1-indexed
    const previousMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Get variable categories
    const variableCategories = categories.variable || [];
    if (variableCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de gastos variables configuradas</p>';
        return;
    }

    // Calculate totals for current and previous month
    const currentMonthExpenses = filterExpensesByMonth(expenses, selectedMonth);
    const previousMonthExpenses = filterExpensesByMonth(expenses, previousMonth);

    const comparison = {};

    variableCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const configData = variableExpensesConfig[categoryName] || {};

        const currentTotal = currentMonthExpenses
            .filter(e => e.type === 'variable' && e.category === categoryName)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const previousTotal = previousMonthExpenses
            .filter(e => e.type === 'variable' && e.category === categoryName)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const difference = currentTotal - previousTotal;
        const percentChange = previousTotal > 0 ? ((difference / previousTotal) * 100) : 0;

        comparison[categoryName] = {
            current: currentTotal,
            previous: previousTotal,
            difference,
            percentChange,
            estimated: configData.estimatedAmount || 0,
            budgetAlert: configData.budgetAlert || 0
        };
    });

    // Render comparison
    let html = '<div style="display: grid; gap: 1rem;">';

    Object.entries(comparison).forEach(([categoryName, data]) => {
        const isIncrease = data.difference > 0;
        const isOverBudget = data.budgetAlert > 0 && data.current > data.budgetAlert;
        const trendIcon = isIncrease ? '↑' : data.difference < 0 ? '↓' : '→';
        const trendColor = isIncrease ? '#ef4444' : data.difference < 0 ? '#10b981' : '#6b7280';

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; ${isOverBudget ? 'background: #fef2f2;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="font-weight: 600; margin: 0;">${categoryName}</h4>
                    ${isOverBudget ? '<span style="color: #ef4444; font-weight: 600;">⚠️ SOBRE PRESUPUESTO</span>' : ''}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Mes Actual</div>
                        <div style="font-weight: 600; font-size: 1.125rem;">${formatCurrency(data.current)}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Mes Anterior</div>
                        <div style="font-weight: 600; font-size: 1.125rem;">${formatCurrency(data.previous)}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Diferencia</div>
                        <div style="font-weight: 600; font-size: 1.125rem; color: ${trendColor};">
                            ${trendIcon} ${formatCurrency(Math.abs(data.difference))}
                            ${Math.abs(data.percentChange) > 0 ? `(${data.percentChange.toFixed(1)}%)` : ''}
                        </div>
                    </div>
                    ${data.estimated > 0 ? `
                        <div>
                            <div style="color: #6b7280; font-size: 0.875rem;">Estimado</div>
                            <div style="font-weight: 600; font-size: 1.125rem;">${formatCurrency(data.estimated)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// DAILY BUDGET ANALYSIS
// ============================================

function updateDailyBudgetAnalysis(selectedMonth) {
    const container = document.getElementById('dailyBudgetContainer');
    if (!container) return;

    const dailyCategories = categories.diario || [];
    if (dailyCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de gastos diarios configuradas</p>';
        return;
    }

    // Get daily expenses for selected month
    const monthExpenses = filterExpensesByMonth(expenses, selectedMonth);
    const dailyExpenses = monthExpenses.filter(e => e.type === 'diario');

    // Calculate totals by category
    const categoryTotals = {};
    let totalDailySpent = 0;

    dailyCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const spent = dailyExpenses
            .filter(e => e.category === categoryName)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        categoryTotals[categoryName] = spent;
        totalDailySpent += spent;
    });

    const globalBudget = dailyExpensesConfig.globalBudget || 0;
    const globalRemaining = globalBudget - totalDailySpent;
    const globalPercentUsed = globalBudget > 0 ? (totalDailySpent / globalBudget) * 100 : 0;

    // Calculate days in month and days remaining
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);
    const daysRemaining = isCurrentMonth ? daysInMonth - today.getDate() : 0;
    const dailyAllowance = daysRemaining > 0 ? globalRemaining / daysRemaining : 0;

    // Render analysis
    let html = '';

    // Global budget summary
    if (globalBudget > 0) {
        const budgetColor = globalPercentUsed > 100 ? '#ef4444' : globalPercentUsed > 90 ? '#f59e0b' : '#10b981';
        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; ${globalPercentUsed > 100 ? 'background: #fef2f2;' : ''}">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">
                    Presupuesto Global
                    ${globalPercentUsed > 100 ? ' ⚠️ EXCEDIDO' : ''}
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Gastado</div>
                        <div style="font-weight: 600; font-size: 1.25rem;">${formatCurrency(totalDailySpent)}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Presupuesto</div>
                        <div style="font-weight: 600; font-size: 1.25rem;">${formatCurrency(globalBudget)}</div>
                    </div>
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">Restante</div>
                        <div style="font-weight: 600; font-size: 1.25rem; color: ${budgetColor};">
                            ${formatCurrency(globalRemaining)}
                        </div>
                    </div>
                    <div>
                        <div style="color: #6b7280; font-size: 0.875rem;">% Usado</div>
                        <div style="font-weight: 600; font-size: 1.25rem; color: ${budgetColor};">
                            ${globalPercentUsed.toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div style="background: #e5e7eb; border-radius: 0.5rem; height: 20px; overflow: hidden;">
                    <div style="background: ${budgetColor}; height: 100%; width: ${Math.min(globalPercentUsed, 100)}%; transition: width 0.3s;"></div>
                </div>
                ${isCurrentMonth && daysRemaining > 0 ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            Quedan <strong>${daysRemaining} días</strong> en el mes.
                            Puedes gastar <strong>${formatCurrency(dailyAllowance)}/día</strong> para mantenerte dentro del presupuesto.
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Per-category breakdown
    html += '<h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Presupuesto por Categoría</h3>';
    html += '<div style="display: grid; gap: 1rem;">';

    dailyCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const configData = dailyExpensesConfig.categories?.[categoryName] || {};
        const budget = configData.monthlyBudget || 0;
        const spent = categoryTotals[categoryName] || 0;
        const remaining = budget - spent;
        const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
        const budgetColor = percentUsed > 100 ? '#ef4444' : percentUsed > 90 ? '#f59e0b' : '#10b981';

        if (budget > 0 || spent > 0) {
            html += `
                <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; ${percentUsed > 100 ? 'background: #fef2f2;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h4 style="font-weight: 600; margin: 0;">${categoryName}</h4>
                        ${percentUsed > 100 ? '<span style="color: #ef4444; font-size: 0.875rem; font-weight: 600;">EXCEDIDO +${formatCurrency(Math.abs(remaining))}</span>' : ''}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; margin-bottom: 0.5rem;">
                        <div>
                            <div style="color: #6b7280; font-size: 0.875rem;">Gastado</div>
                            <div style="font-weight: 600;">${formatCurrency(spent)}</div>
                        </div>
                        <div>
                            <div style="color: #6b7280; font-size: 0.875rem;">Presupuesto</div>
                            <div style="font-weight: 600;">${formatCurrency(budget)}</div>
                        </div>
                        <div>
                            <div style="color: #6b7280; font-size: 0.875rem;">% Usado</div>
                            <div style="font-weight: 600; color: ${budgetColor};">${percentUsed.toFixed(1)}%</div>
                        </div>
                    </div>
                    ${budget > 0 ? `
                        <div style="background: #e5e7eb; border-radius: 0.5rem; height: 12px; overflow: hidden;">
                            <div style="background: ${budgetColor}; height: 100%; width: ${Math.min(percentUsed, 100)}%; transition: width 0.3s;"></div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    });

    html += '</div>';

    container.innerHTML = html;
}
