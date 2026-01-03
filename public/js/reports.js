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
