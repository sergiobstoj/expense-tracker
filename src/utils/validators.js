/**
 * Validation utilities for input data
 */

function validateExpense(expense) {
    const errors = [];

    // Required fields
    if (!expense.type) {
        errors.push('El campo "type" es requerido');
    } else if (!['fijo', 'variable', 'diario'].includes(expense.type)) {
        errors.push('El campo "type" debe ser: fijo, variable o diario');
    }

    if (!expense.category || typeof expense.category !== 'string') {
        errors.push('El campo "category" es requerido');
    }

    if (expense.amount === undefined || expense.amount === null) {
        errors.push('El campo "amount" es requerido');
    } else if (typeof expense.amount !== 'number' || expense.amount <= 0) {
        errors.push('El campo "amount" debe ser un número mayor a 0');
    }

    if (!expense.date) {
        errors.push('El campo "date" es requerido');
    } else if (isNaN(new Date(expense.date).getTime())) {
        errors.push('El campo "date" debe ser una fecha válida (YYYY-MM-DD)');
    }

    if (!expense.paidBy || typeof expense.paidBy !== 'string') {
        errors.push('El campo "paidBy" es requerido');
    }

    if (typeof expense.isShared !== 'boolean') {
        errors.push('El campo "isShared" debe ser booleano');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validateIncome(income) {
    const errors = [];

    if (!income.category || typeof income.category !== 'string') {
        errors.push('El campo "category" es requerido');
    }

    if (income.amount === undefined || income.amount === null) {
        errors.push('El campo "amount" es requerido');
    } else if (typeof income.amount !== 'number' || income.amount <= 0) {
        errors.push('El campo "amount" debe ser un número mayor a 0');
    }

    if (!income.date) {
        errors.push('El campo "date" es requerido');
    } else if (isNaN(new Date(income.date).getTime())) {
        errors.push('El campo "date" debe ser una fecha válida (YYYY-MM-DD)');
    }

    if (!income.receivedBy || typeof income.receivedBy !== 'string') {
        errors.push('El campo "receivedBy" es requerido');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function validateConfig(config) {
    const errors = [];

    if (!Array.isArray(config.persons) || config.persons.length < 2) {
        errors.push('Debe haber al menos 2 personas');
    }

    if (!config.splitPercentages || typeof config.splitPercentages !== 'object') {
        errors.push('Los porcentajes de división son requeridos');
    } else {
        const total = Object.values(config.splitPercentages).reduce((sum, val) => sum + val, 0);
        if (Math.abs(total - 100) > 0.01) {
            errors.push(`Los porcentajes deben sumar 100% (actualmente: ${total}%)`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateExpense,
    validateIncome,
    validateConfig
};
