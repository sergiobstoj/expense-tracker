// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Utility functions for API calls
const api = {
    async get(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.details || errorData.error || 'Error fetching data';
            console.error('❌ API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        return response.json();
    },

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.details || errorData.error || 'Error saving data';
            console.error('❌ API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        return response.json();
    },

    async put(endpoint, data) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.details || errorData.error || 'Error updating data';
            console.error('❌ API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        return response.json();
    },

    async delete(endpoint) {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.details || errorData.error || 'Error deleting data';
            console.error('❌ API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        return response.json();
    }
};

// Format currency
function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    } catch (error) {
        // Fallback if Intl is not available
        return '€' + parseFloat(amount).toFixed(2);
    }
}

// Format date
function formatDate(dateString) {
    try {
        // Handle both YYYY-MM-DD and DD-MM-YYYY formats
        let date;
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts[0].length === 4) {
                // YYYY-MM-DD format (standard)
                date = new Date(dateString + 'T00:00:00');
            } else {
                // DD-MM-YYYY format
                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
            }
        } else {
            date = new Date(dateString);
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return dateString;
        }
        
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        // Fallback if Intl is not available
        try {
            let date;
            if (dateString.includes('-')) {
                const parts = dateString.split('-');
                if (parts[0].length === 4) {
                    date = new Date(dateString + 'T00:00:00');
                } else {
                    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
                }
            } else {
                date = new Date(dateString);
            }
            
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    }
}

// Get month name
function getMonthName(monthString) {
    try {
        const [year, month] = monthString.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.error('Invalid month string:', monthString);
            return monthString;
        }
        
        return new Intl.DateTimeFormat('es-ES', {
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('Error formatting month:', error, monthString);
        // Fallback if Intl is not available
        try {
            const [year, month] = monthString.split('-');
            const monthNames = [
                'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ];
            const monthIndex = parseInt(month) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                return `${monthNames[monthIndex]} ${year}`;
            }
            return monthString;
        } catch (e) {
            return monthString;
        }
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Get type badge class
function getTypeBadgeClass(type) {
    const classes = {
        'fijo': 'badge-fijo',
        'variable': 'badge-variable',
        'diario': 'badge-diario'
    };
    return classes[type] || '';
}

// Get type display name
function getTypeDisplayName(type) {
    const names = {
        'fijo': 'Fijo',
        'variable': 'Variable',
        'diario': 'Diario'
    };
    return names[type] || type;
}

// Filter expenses by month
function filterExpensesByMonth(expenses, monthString) {
    return expenses.filter(expense => {
        const expenseMonth = expense.date.substring(0, 7);
        return expenseMonth === monthString;
    });
}

// Calculate totals
function calculateTotals(expenses) {
    const totals = {
        total: 0,
        shared: 0,
        personal: 0,
        byPerson: {},
        byType: {
            fijo: 0,
            variable: 0,
            diario: 0
        }
    };

    expenses.forEach(expense => {
        const amount = parseFloat(expense.amount);
        totals.total += amount;

        if (expense.isShared) {
            totals.shared += amount;
        } else {
            totals.personal += amount;
        }

        // By person
        if (!totals.byPerson[expense.paidBy]) {
            totals.byPerson[expense.paidBy] = {
                total: 0,
                shared: 0,
                personal: 0
            };
        }
        totals.byPerson[expense.paidBy].total += amount;
        if (expense.isShared) {
            totals.byPerson[expense.paidBy].shared += amount;
        } else {
            totals.byPerson[expense.paidBy].personal += amount;
        }

        // By type
        if (totals.byType[expense.type] !== undefined) {
            totals.byType[expense.type] += amount;
        }
    });

    return totals;
}

// Calculate balance (who owes whom)
function calculateBalance(expenses, config) {
    const totals = calculateTotals(expenses);
    const persons = config.persons;
    const percentages = config.splitPercentages;

    const balance = {};
    persons.forEach(person => {
        balance[person] = {
            paid: totals.byPerson[person]?.shared || 0,
            shouldPay: 0,
            balance: 0
        };
    });

    // Calculate what each person should pay
    const totalShared = totals.shared;
    persons.forEach(person => {
        const percentage = percentages[person] || 0;
        balance[person].shouldPay = (totalShared * percentage) / 100;
        balance[person].balance = balance[person].paid - balance[person].shouldPay;
    });

    return balance;
}

// Get all unique months from expenses
function getUniqueMonths(expenses) {
    const months = new Set();
    expenses.forEach(expense => {
        months.add(expense.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
}

// Export to CSV
function exportToCSV(expenses, filename = 'gastos.csv') {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Pagado por', 'Común', 'Descripción'];
    const rows = expenses.map(e => [
        e.date,
        getTypeDisplayName(e.type),
        e.category,
        e.amount,
        e.paidBy,
        e.isShared ? 'Sí' : 'No',
        e.description || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Set today's date as default
function setTodayAsDefault(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        const today = new Date().toISOString().split('T')[0];
        input.value = today;
    }
}
