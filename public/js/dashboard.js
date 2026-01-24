// Dashboard State
let expenses = [];
let incomes = [];
let settlements = [];
let categories = {};
let incomeCategories = [];
let fixedExpensesConfig = {};
let config = {};
let currentMonth = '';
let availableMonths = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadInitialData();
        setupEventListeners();
        await loadMonthData();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Error al cargar el dashboard', 'error');
    }
});

async function loadInitialData() {
    // Load each piece of data with individual error handling
    try {
        categories = await api.get('/categories');
    } catch (error) {
        console.error('Error loading categories:', error);
        categories = { fijo: [], variable: [], diario: [] };
    }

    try {
        incomeCategories = await api.get('/income-categories');
    } catch (error) {
        console.error('Error loading income categories:', error);
        incomeCategories = [];
    }

    try {
        fixedExpensesConfig = await api.get('/expenses-config/fixed');
    } catch (error) {
        console.error('Error loading fixed expenses config:', error);
        fixedExpensesConfig = {};
    }

    try {
        config = await api.get('/config');
    } catch (error) {
        console.error('Error loading config:', error);
        config = { persons: [], splitPercentages: {}, closedMonths: [] };
    }

    try {
        availableMonths = await api.get('/months');
    } catch (error) {
        console.error('Error loading months:', error);
        availableMonths = [];
    }

    // Set current month
    const today = new Date();
    currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Ensure current month is in available months
    if (!availableMonths.includes(currentMonth)) {
        availableMonths.unshift(currentMonth);
    }

    updateMonthLabel();
}

function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => navigateMonth(1));

    // Quick expense
    document.getElementById('btnQuickExpense')?.addEventListener('click', openQuickExpense);
    document.getElementById('navAddExpense')?.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickExpense();
    });
    document.getElementById('quickExpenseForm')?.addEventListener('submit', handleQuickExpense);

    // Type selector buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => selectType(btn.dataset.type));
    });

    // Quick income
    document.getElementById('btnQuickIncome')?.addEventListener('click', openQuickIncome);
    document.getElementById('navAddIncome')?.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickIncome();
    });
    document.getElementById('quickIncomeForm')?.addEventListener('submit', handleQuickIncome);

    // Settlement
    document.getElementById('settlementForm')?.addEventListener('submit', handleSettlement);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function navigateMonth(direction) {
    const currentIndex = availableMonths.indexOf(currentMonth);
    const newIndex = currentIndex - direction; // Reverse because months are sorted desc

    if (newIndex >= 0 && newIndex < availableMonths.length) {
        currentMonth = availableMonths[newIndex];
    } else if (direction === -1) {
        // Allow navigating to future month
        const [year, month] = currentMonth.split('-').map(Number);
        const newDate = new Date(year, month, 1);
        currentMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
        if (!availableMonths.includes(currentMonth)) {
            availableMonths.unshift(currentMonth);
        }
    }

    updateMonthLabel();
    loadMonthData();
}

function updateMonthLabel() {
    const [year, month] = currentMonth.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('currentMonthLabel').textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
}

async function loadMonthData() {
    try {
        [expenses, incomes, settlements] = await Promise.all([
            api.get(`/expenses?month=${currentMonth}`).catch(() => []),
            api.get(`/incomes?month=${currentMonth}`).catch(() => []),
            api.get(`/settlements?month=${currentMonth}`).catch(() => [])
        ]);
    } catch (error) {
        console.error('Error loading month data:', error);
        expenses = [];
        incomes = [];
        settlements = [];
    }

    updateStats();
    displayFixedExpensesChecklist();
    displayCategoriesSummary();
    displaySettlements();
    displayRecentTransactions();
}

function updateStats() {
    const totalIncome = incomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const balance = totalIncome - totalExpenses;

    document.getElementById('dashIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('dashExpenses').textContent = formatCurrency(totalExpenses);

    const balanceEl = document.getElementById('dashBalance');
    balanceEl.textContent = formatCurrency(balance);
    balanceEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
}

function displayCategoriesSummary() {
    const container = document.getElementById('categoriesSummary');
    if (!container) return;

    // Group expenses by category
    const byCategory = {};
    let totalExpenses = 0;

    expenses.forEach(e => {
        const cat = e.category || 'Sin categoría';
        byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.amount || 0);
        totalExpenses += parseFloat(e.amount || 0);
    });

    // Sort by amount and take top 6
    const sorted = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>No hay gastos este mes</p>
            </div>
        `;
        return;
    }

    const maxAmount = sorted[0][1];

    let html = '';
    sorted.forEach(([category, amount]) => {
        const emoji = getCategoryEmoji(category);
        const percent = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : 0;
        const barWidth = maxAmount > 0 ? ((amount / maxAmount) * 100).toFixed(0) : 0;

        html += `
            <div class="category-bar">
                <div class="category-bar-info">
                    <span class="category-bar-emoji">${emoji}</span>
                    <span class="category-bar-name">${category}</span>
                </div>
                <span class="category-bar-amount">${formatCurrency(amount)}</span>
                <span class="category-bar-percent">${percent}%</span>
                <div class="category-bar-visual">
                    <div class="category-bar-fill" style="width: ${barWidth}%"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function getCategoryEmoji(categoryName) {
    // Search in all category types
    for (const type of ['fijo', 'variable', 'diario']) {
        const cats = categories[type] || [];
        const found = cats.find(c => {
            const name = typeof c === 'string' ? c : c.name;
            return name === categoryName;
        });
        if (found && typeof found === 'object' && found.emoji) {
            return found.emoji;
        }
    }
    return '📌';
}

function displaySettlements() {
    const container = document.getElementById('settlementsSection');
    if (!container) return;

    // Calculate balance between persons
    const balance = calculateBalance();

    if (!balance || balance.amount === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <p>Todo equilibrado</p>
            </div>
        `;
        return;
    }

    const { debtor, creditor, amount } = balance;

    container.innerHTML = `
        <div class="settlement-card">
            <div class="settlement-amount">${formatCurrency(amount)}</div>
            <div class="settlement-description">
                <strong>${debtor}</strong> debe pagar a <strong>${creditor}</strong>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openSettlementModal('${debtor}', '${creditor}', ${amount})">
                Registrar Pago
            </button>
        </div>
    `;
}

function calculateBalance() {
    const persons = config.persons || [];
    if (persons.length < 2) return null;

    const percentages = config.monthlyPercentages?.[currentMonth] || config.splitPercentages || {};

    // Calculate what each person should pay for shared expenses
    const sharedExpenses = expenses.filter(e => e.isShared);
    const totalShared = sharedExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Calculate what each person actually paid
    const paidBy = {};
    persons.forEach(p => paidBy[p] = 0);

    sharedExpenses.forEach(e => {
        if (paidBy[e.paidBy] !== undefined) {
            paidBy[e.paidBy] += parseFloat(e.amount || 0);
        }
    });

    // Calculate what each should pay based on percentages
    const shouldPay = {};
    persons.forEach(p => {
        shouldPay[p] = totalShared * ((percentages[p] || 50) / 100);
    });

    // Calculate balance (positive = overpaid, negative = underpaid)
    const balances = {};
    persons.forEach(p => {
        balances[p] = paidBy[p] - shouldPay[p];
    });

    // Apply existing settlements
    (settlements || []).forEach(s => {
        if (balances[s.from] !== undefined) balances[s.from] += parseFloat(s.amount || 0);
        if (balances[s.to] !== undefined) balances[s.to] -= parseFloat(s.amount || 0);
    });

    // Find who owes whom
    const sortedPersons = persons.sort((a, b) => balances[a] - balances[b]);
    const debtor = sortedPersons[0];
    const creditor = sortedPersons[sortedPersons.length - 1];
    const amount = Math.abs(balances[debtor]);

    if (amount < 0.01) return null;

    return { debtor, creditor, amount: Math.round(amount * 100) / 100 };
}

function displayRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    // Combine and sort transactions
    const allTransactions = [
        ...expenses.map(e => ({ ...e, transactionType: 'expense' })),
        ...incomes.map(i => ({ ...i, transactionType: 'income' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    if (allTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>No hay movimientos este mes</p>
            </div>
        `;
        return;
    }

    let html = '<ul class="transaction-list">';

    allTransactions.forEach(t => {
        const isExpense = t.transactionType === 'expense';
        const emoji = isExpense ? getCategoryEmoji(t.category) : '💰';
        const amountClass = isExpense ? 'negative' : 'positive';
        const amountPrefix = isExpense ? '-' : '+';

        html += `
            <li class="transaction-item">
                <div class="transaction-icon ${t.transactionType}">${emoji}</div>
                <div class="transaction-details">
                    <div class="transaction-category">${t.category || 'Sin categoría'}</div>
                    <div class="transaction-date">${formatDateShort(t.date)}</div>
                </div>
                <div class="transaction-amount ${amountClass}">${amountPrefix}${formatCurrency(t.amount)}</div>
            </li>
        `;
    });

    html += '</ul>';
    container.innerHTML = html;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Quick Expense Modal
function openQuickExpense() {
    const modal = document.getElementById('quickExpenseModal');
    const dateInput = document.getElementById('qDate');

    // Set today's date
    dateInput.value = new Date().toISOString().split('T')[0];

    // Reset form values
    document.getElementById('qType').value = 'diario';
    document.getElementById('qCategory').value = '';
    document.getElementById('qPaidBy').value = '';

    // Setup persons buttons
    setupPersonsButtons();

    // Reset type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'diario');
    });

    // Update categories for default type
    updateCategoryButtons('diario');

    modal.classList.add('active');
    document.getElementById('qAmount').focus();
}

function closeQuickExpense() {
    document.getElementById('quickExpenseModal').classList.remove('active');
    document.getElementById('quickExpenseForm').reset();
}

function setupPersonsButtons() {
    const container = document.getElementById('personSelector');
    if (!container) return;

    const persons = config.persons || [];
    container.innerHTML = persons.map(person =>
        `<button type="button" class="person-btn" data-person="${person}">${person}</button>`
    ).join('');

    // Add click handlers
    container.querySelectorAll('.person-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPerson(btn.dataset.person));
    });
}

function selectPerson(person) {
    document.getElementById('qPaidBy').value = person;
    document.querySelectorAll('.person-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.person === person);
    });
}

function selectType(type) {
    document.getElementById('qType').value = type;
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    updateCategoryButtons(type);
}

function updateCategoryButtons(type) {
    const container = document.getElementById('categorySelector');
    if (!container) return;

    const cats = categories[type] || [];

    if (cats.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías configuradas</p>';
        return;
    }

    container.innerHTML = cats.map(cat => {
        const name = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📌';
        return `<button type="button" class="category-btn" data-category="${name}">
            <span class="emoji">${emoji}</span>
            <span>${name}</span>
        </button>`;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.dataset.category));
    });

    // Clear current selection
    document.getElementById('qCategory').value = '';
}

function selectCategory(category) {
    document.getElementById('qCategory').value = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
}

async function handleQuickExpense(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Validate required selections
    const category = formData.get('category');
    const paidBy = formData.get('paidBy');

    if (!category) {
        showAlert('Selecciona una categoría', 'error');
        return;
    }

    if (!paidBy) {
        showAlert('Selecciona quién pagó', 'error');
        return;
    }

    const expense = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        paidBy: paidBy,
        category: category,
        isShared: formData.get('isShared') === 'on',
        description: formData.get('description') || ''
    };

    // Validate closed month
    const closedMonths = config.closedMonths || [];
    const expenseMonth = expense.date.substring(0, 7);
    if (closedMonths.includes(expenseMonth)) {
        showAlert('No puedes agregar gastos en un mes cerrado', 'error');
        return;
    }

    try {
        await api.post('/expenses', expense);
        showAlert('Gasto guardado', 'success');
        closeQuickExpense();

        // Reload if expense is in current month
        if (expenseMonth === currentMonth) {
            await loadMonthData();
        }
    } catch (error) {
        console.error('Error saving expense:', error);
        showAlert('Error al guardar el gasto', 'error');
    }
}

// Settlement Modal
function openSettlementModal(from, to, amount) {
    const modal = document.getElementById('settlementModal');

    document.getElementById('settlementMonth').value = currentMonth;
    document.getElementById('settlementFrom').value = from;
    document.getElementById('settlementTo').value = to;
    document.getElementById('settlementAmount').value = amount;
    document.getElementById('settlementDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('settlementInfo').innerHTML = `
        <strong>${from}</strong> paga <strong>${formatCurrency(amount)}</strong> a <strong>${to}</strong>
    `;

    modal.classList.add('active');
}

function closeSettlementModal() {
    document.getElementById('settlementModal').classList.remove('active');
    document.getElementById('settlementForm').reset();
}

async function handleSettlement(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const settlement = {
        month: formData.get('month'),
        from: formData.get('from'),
        to: formData.get('to'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date')
    };

    try {
        await api.post('/settlements', settlement);
        showAlert('Pago registrado', 'success');
        closeSettlementModal();
        await loadMonthData();
    } catch (error) {
        console.error('Error saving settlement:', error);
        showAlert('Error al registrar el pago', 'error');
    }
}

// ============================================
// FIXED EXPENSES CHECKLIST
// ============================================

function displayFixedExpensesChecklist() {
    const container = document.getElementById('fixedExpensesChecklist');
    if (!container) return;

    const fixedCategories = categories.fijo || [];

    if (fixedCategories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No hay gastos fijos configurados</p>
            </div>
        `;
        return;
    }

    // Get fixed expenses for current month
    const fixedExpenses = expenses.filter(e => e.type === 'fijo');

    let totalExpected = 0;
    let totalPaid = 0;
    let html = '<ul class="fixed-checklist">';

    fixedCategories.forEach(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        const catEmoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📌';
        const configData = fixedExpensesConfig[catName] || {};
        const expectedAmount = configData.defaultAmount || 0;

        // Find if this category has been paid this month
        const paidExpense = fixedExpenses.find(e => e.category === catName);
        const isPaid = !!paidExpense;
        const paidAmount = paidExpense ? parseFloat(paidExpense.amount) : 0;

        totalExpected += expectedAmount;
        if (isPaid) totalPaid += paidAmount;

        html += `
            <li class="fixed-item ${isPaid ? 'paid' : 'pending'}">
                <div class="fixed-item-left">
                    <span class="fixed-check">${isPaid ? '✓' : '○'}</span>
                    <span class="fixed-emoji">${catEmoji}</span>
                    <span class="fixed-name">${catName}</span>
                </div>
                <div class="fixed-item-right">
                    ${isPaid
                        ? `<span class="fixed-amount paid">${formatCurrency(paidAmount)}</span>`
                        : expectedAmount > 0
                            ? `<span class="fixed-amount expected">${formatCurrency(expectedAmount)}</span>`
                            : '<span class="fixed-amount">-</span>'
                    }
                </div>
            </li>
        `;
    });

    html += '</ul>';

    // Add summary
    const pendingAmount = totalExpected - totalPaid;
    html += `
        <div class="fixed-summary">
            <div class="fixed-summary-row">
                <span>Pagado</span>
                <span class="text-success">${formatCurrency(totalPaid)}</span>
            </div>
            ${pendingAmount > 0 ? `
            <div class="fixed-summary-row">
                <span>Pendiente</span>
                <span class="text-warning">${formatCurrency(pendingAmount)}</span>
            </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;
}

// ============================================
// QUICK INCOME MODAL
// ============================================

function openQuickIncome() {
    const modal = document.getElementById('quickIncomeModal');
    const dateInput = document.getElementById('iDate');

    // Set today's date
    dateInput.value = new Date().toISOString().split('T')[0];

    // Reset form values
    document.getElementById('iCategory').value = '';
    document.getElementById('iReceivedBy').value = '';

    // Setup income category buttons
    setupIncomeCategoryButtons();

    // Setup persons buttons for income
    setupIncomePersonsButtons();

    modal.classList.add('active');
    document.getElementById('iAmount').focus();
}

function closeQuickIncome() {
    document.getElementById('quickIncomeModal').classList.remove('active');
    document.getElementById('quickIncomeForm').reset();
}

function setupIncomeCategoryButtons() {
    const container = document.getElementById('incomeCategorySelector');
    if (!container) return;

    if (incomeCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de ingresos</p>';
        return;
    }

    container.innerHTML = incomeCategories.map(cat => {
        const name = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '💰';
        return `<button type="button" class="category-btn income-cat-btn" data-category="${name}">
            <span class="emoji">${emoji}</span>
            <span>${name}</span>
        </button>`;
    }).join('');

    // Add click handlers
    container.querySelectorAll('.income-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => selectIncomeCategory(btn.dataset.category));
    });
}

function selectIncomeCategory(category) {
    document.getElementById('iCategory').value = category;
    document.querySelectorAll('.income-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
}

function setupIncomePersonsButtons() {
    const container = document.getElementById('incomePersonSelector');
    if (!container) return;

    const persons = config.persons || [];
    container.innerHTML = persons.map(person =>
        `<button type="button" class="person-btn income-person-btn" data-person="${person}">${person}</button>`
    ).join('');

    // Add click handlers
    container.querySelectorAll('.income-person-btn').forEach(btn => {
        btn.addEventListener('click', () => selectIncomePerson(btn.dataset.person));
    });
}

function selectIncomePerson(person) {
    document.getElementById('iReceivedBy').value = person;
    document.querySelectorAll('.income-person-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.person === person);
    });
}

async function handleQuickIncome(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Validate required selections
    const category = formData.get('category');
    const receivedBy = formData.get('receivedBy');

    if (!category) {
        showAlert('Selecciona una categoría', 'error');
        return;
    }

    if (!receivedBy) {
        showAlert('Selecciona quién recibió el ingreso', 'error');
        return;
    }

    const income = {
        category: category,
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        receivedBy: receivedBy,
        description: formData.get('description') || ''
    };

    // Validate closed month
    const closedMonths = config.closedMonths || [];
    const incomeMonth = income.date.substring(0, 7);
    if (closedMonths.includes(incomeMonth)) {
        showAlert('No puedes agregar ingresos en un mes cerrado', 'error');
        return;
    }

    try {
        await api.post('/incomes', income);
        showAlert('Ingreso guardado', 'success');
        closeQuickIncome();

        // Reload if income is in current month
        if (incomeMonth === currentMonth) {
            await loadMonthData();
        }
    } catch (error) {
        console.error('Error saving income:', error);
        showAlert('Error al guardar el ingreso', 'error');
    }
}
