let categories = {};
let config = {};
let variableExpensesConfig = {};
let expenses = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadConfig(),
            loadVariableExpensesConfig(),
            loadExpenses()
        ]);

        displayCategories();
        displayVariableExpensesConfig();
        setupEventHandlers();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar configuración', 'error');
    }
});

async function loadCategories() {
    categories = await api.get('/categories');
}

async function loadConfig() {
    config = await api.get('/config');
}

async function loadVariableExpensesConfig() {
    variableExpensesConfig = await api.get('/expenses-config/variable');
}

async function loadExpenses() {
    expenses = await api.get('/expenses');
}

function setupEventHandlers() {
    document.getElementById('btnAddCategory')?.addEventListener('click', handleAddCategory);
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

function displayCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;

    const variableCategories = categories.variable || [];

    if (variableCategories.length === 0) {
        container.innerHTML = '<p class="text-muted" style="font-style: italic; padding: 1rem; text-align: center;">No hay categorías de gastos variables definidas. Haz clic en "Agregar Categoría" para crear una.</p>';
        return;
    }

    let html = '<div class="category-grid">';

    variableCategories.forEach((cat, index) => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📊';
        const isInUse = isCategoryInUse(categoryName);

        html += `
            <div class="category-card">
                <div class="category-card-header">
                    <span class="category-emoji">${emoji}</span>
                    <h4 class="category-name">${categoryName}</h4>
                    ${isInUse ? '<span class="category-badge">✓</span>' : ''}
                </div>
                <div class="category-card-actions">
                    <button class="btn btn-sm btn-primary" onclick="editCategory(${index})">
                        Editar
                    </button>
                    ${!isInUse ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${categoryName}')">
                            Eliminar
                        </button>
                    ` : '<span class="in-use-text">En uso</span>'}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function isCategoryInUse(categoryName) {
    return expenses.some(e => e.type === 'variable' && e.category === categoryName);
}

async function handleAddCategory() {
    const categoryName = prompt('Nombre de la nueva categoría de gasto variable:');

    if (!categoryName || categoryName.trim() === '') {
        return;
    }

    const trimmedName = categoryName.trim();

    // Check if exists
    const variableCategories = categories.variable || [];
    const exists = variableCategories.some(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName === trimmedName;
    });

    if (exists) {
        showAlert('Esta categoría ya existe', 'error');
        return;
    }

    const emoji = prompt('Ingresa un emoji para la categoría (opcional):', '📊');

    const newCategory = {
        name: trimmedName,
        emoji: emoji || '📊'
    };

    if (!categories.variable) {
        categories.variable = [];
    }

    categories.variable.push(newCategory);

    try {
        await api.put('/categories', categories);
        showAlert('Categoría agregada exitosamente', 'success');
        displayCategories();
        displayVariableExpensesConfig();
    } catch (error) {
        console.error('Error adding category:', error);
        showAlert(`Error al agregar la categoría: ${error.message}`, 'error');
    }
}

async function editCategory(index) {
    const category = categories.variable[index];
    const catName = typeof category === 'string' ? category : category.name;
    const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '📊';

    const newName = prompt('Nombre de la categoría:', catName);
    if (!newName || newName.trim() === '') {
        return;
    }

    const newEmoji = prompt('Emoji de la categoría:', catEmoji);
    if (!newEmoji || newEmoji.trim() === '') {
        return;
    }

    // Check if name already exists (excluding current)
    const exists = categories.variable.some((cat, i) => {
        if (i === index) return false;
        const existingName = typeof cat === 'string' ? cat : cat.name;
        return existingName === newName.trim();
    });

    if (exists) {
        showAlert('Ya existe una categoría con ese nombre', 'error');
        return;
    }

    categories.variable[index] = {
        name: newName.trim(),
        emoji: newEmoji.trim()
    };

    try {
        await api.put('/categories', categories);
        showAlert('Categoría actualizada exitosamente', 'success');
        displayCategories();
        displayVariableExpensesConfig();
    } catch (error) {
        console.error('Error updating category:', error);
        showAlert(`Error al actualizar la categoría: ${error.message}`, 'error');
    }
}

async function deleteCategory(categoryName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría de gasto variable "${categoryName}"?`)) {
        return;
    }

    if (isCategoryInUse(categoryName)) {
        showAlert('No se puede eliminar una categoría que está en uso', 'error');
        return;
    }

    categories.variable = categories.variable.filter(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName !== categoryName;
    });

    try {
        await api.put('/categories', categories);
        showAlert('Categoría eliminada exitosamente', 'success');
        displayCategories();
        displayVariableExpensesConfig();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert(`Error al eliminar la categoría: ${error.message}`, 'error');
    }
}

// ============================================
// EXPENSE CONFIGURATION
// ============================================

function displayVariableExpensesConfig() {
    const container = document.getElementById('variableExpensesConfig');
    if (!container) return;

    const variableCategories = categories.variable || [];

    if (variableCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic; padding: 1rem; text-align: center;">No hay categorías de gastos variables configuradas. Agrega categorías en la sección superior.</p>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem;">';

    variableCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '📊';
        const configData = variableExpensesConfig[categoryName] || {
            estimatedAmount: 0,
            budgetAlert: 0,
            assignedTo: '',
            description: ''
        };

        const hasConfig = configData.estimatedAmount > 0 || configData.budgetAlert > 0 || configData.assignedTo;

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.875rem; background: white; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">${emoji}</span>
                    <h4 style="font-weight: 600; margin: 0; font-size: 1rem; flex: 1;">${categoryName}</h4>
                    ${hasConfig ? '<span style="background: #10b981; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">✓</span>' : ''}
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Estimado</label>
                            <input type="number" class="variable-amount" data-category="${categoryName}"
                                   value="${configData.estimatedAmount}" min="0" step="0.01" placeholder="0.00"
                                   style="width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Alerta</label>
                            <input type="number" class="variable-alert" data-category="${categoryName}"
                                   value="${configData.budgetAlert}" min="0" step="0.01" placeholder="0.00"
                                   style="width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
                        </div>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Responsable</label>
                        <select class="variable-assigned" data-category="${categoryName}"
                                style="width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
                            <option value="">No asignado</option>
                            <option value="Ambos" ${configData.assignedTo === 'Ambos' ? 'selected' : ''}>Ambos</option>
                            ${config.persons?.map(p => `<option value="${p}" ${configData.assignedTo === p ? 'selected' : ''}>${p}</option>`).join('') || ''}
                        </select>
                    </div>
                    ${configData.description || configData.estimatedAmount > 0 ? `
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Nota</label>
                        <input type="text" class="variable-desc" data-category="${categoryName}"
                               value="${configData.description}" placeholder="Descripción..."
                               style="width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div style="margin-top: 1.5rem; display: flex; justify-content: center;"><button id="btnSaveVariableConfig" class="btn btn-primary" style="padding: 0.75rem 2rem;">💾 Guardar Configuración</button></div>';

    container.innerHTML = html;

    document.getElementById('btnSaveVariableConfig')?.addEventListener('click', saveVariableExpensesConfig);
}

async function saveVariableExpensesConfig() {
    const newConfig = {};

    document.querySelectorAll('.variable-amount').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].estimatedAmount = parseFloat(input.value) || 0;
    });

    document.querySelectorAll('.variable-alert').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].budgetAlert = parseFloat(input.value) || 0;
    });

    document.querySelectorAll('.variable-assigned').forEach(select => {
        const category = select.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].assignedTo = select.value;
    });

    document.querySelectorAll('.variable-desc').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].description = input.value;
    });

    try {
        await api.put('/expenses-config/variable', newConfig);
        variableExpensesConfig = newConfig;
        showAlert('Configuración de gastos variables guardada exitosamente', 'success');
    } catch (error) {
        console.error('Error saving variable expenses config:', error);
        showAlert(`Error al guardar configuración: ${error.message}`, 'error');
    }
}
