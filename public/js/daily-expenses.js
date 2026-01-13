let categories = {};
let dailyExpensesConfig = {};
let expenses = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadDailyExpensesConfig(),
            loadExpenses()
        ]);

        displayCategories();
        displayDailyExpensesConfig();
        setupEventHandlers();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar configuración', 'error');
    }
});

async function loadCategories() {
    categories = await api.get('/categories');
}

async function loadDailyExpensesConfig() {
    dailyExpensesConfig = await api.get('/expenses-config/daily');
}

async function loadExpenses() {
    expenses = await api.get('/expenses');
}

function setupEventHandlers() {
    document.getElementById('btnAddCategory')?.addEventListener('click', handleAddCategory);
    document.getElementById('btnSaveGlobalBudget')?.addEventListener('click', saveGlobalBudget);
}

// ============================================
// CATEGORY MANAGEMENT
// ============================================

function displayCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;

    const dailyCategories = categories.diario || [];

    if (dailyCategories.length === 0) {
        container.innerHTML = '<p class="text-muted" style="font-style: italic; padding: 1rem; text-align: center;">No hay categorías de gastos diarios definidas. Haz clic en "Agregar Categoría" para crear una.</p>';
        return;
    }

    let html = '<div class="category-grid">';

    dailyCategories.forEach((cat, index) => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '💸';
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
    return expenses.some(e => e.type === 'diario' && e.category === categoryName);
}

async function handleAddCategory() {
    const categoryName = prompt('Nombre de la nueva categoría de gasto diario:');

    if (!categoryName || categoryName.trim() === '') {
        return;
    }

    const trimmedName = categoryName.trim();

    // Check if exists
    const dailyCategories = categories.diario || [];
    const exists = dailyCategories.some(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName === trimmedName;
    });

    if (exists) {
        showAlert('Esta categoría ya existe', 'error');
        return;
    }

    const emoji = prompt('Ingresa un emoji para la categoría (opcional):', '💸');

    const newCategory = {
        name: trimmedName,
        emoji: emoji || '💸'
    };

    if (!categories.diario) {
        categories.diario = [];
    }

    categories.diario.push(newCategory);

    try {
        await api.put('/categories', categories);
        showAlert('Categoría agregada exitosamente', 'success');
        displayCategories();
        displayDailyExpensesConfig();
    } catch (error) {
        console.error('Error adding category:', error);
        showAlert(`Error al agregar la categoría: ${error.message}`, 'error');
    }
}

async function editCategory(index) {
    const category = categories.diario[index];
    const catName = typeof category === 'string' ? category : category.name;
    const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '💸';

    const newName = prompt('Nombre de la categoría:', catName);
    if (!newName || newName.trim() === '') {
        return;
    }

    const newEmoji = prompt('Emoji de la categoría:', catEmoji);
    if (!newEmoji || newEmoji.trim() === '') {
        return;
    }

    // Check if name already exists (excluding current)
    const exists = categories.diario.some((cat, i) => {
        if (i === index) return false;
        const existingName = typeof cat === 'string' ? cat : cat.name;
        return existingName === newName.trim();
    });

    if (exists) {
        showAlert('Ya existe una categoría con ese nombre', 'error');
        return;
    }

    categories.diario[index] = {
        name: newName.trim(),
        emoji: newEmoji.trim()
    };

    try {
        await api.put('/categories', categories);
        showAlert('Categoría actualizada exitosamente', 'success');
        displayCategories();
        displayDailyExpensesConfig();
    } catch (error) {
        console.error('Error updating category:', error);
        showAlert(`Error al actualizar la categoría: ${error.message}`, 'error');
    }
}

async function deleteCategory(categoryName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría de gasto diario "${categoryName}"?`)) {
        return;
    }

    if (isCategoryInUse(categoryName)) {
        showAlert('No se puede eliminar una categoría que está en uso', 'error');
        return;
    }

    categories.diario = categories.diario.filter(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName !== categoryName;
    });

    try {
        await api.put('/categories', categories);
        showAlert('Categoría eliminada exitosamente', 'success');
        displayCategories();
        displayDailyExpensesConfig();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert(`Error al eliminar la categoría: ${error.message}`, 'error');
    }
}

// ============================================
// EXPENSE CONFIGURATION
// ============================================

function displayDailyExpensesConfig() {
    // Global budget
    const globalInput = document.getElementById('globalDailyBudget');
    if (globalInput) {
        globalInput.value = dailyExpensesConfig.globalBudget || 0;
    }

    // Category budgets
    const container = document.getElementById('dailyExpensesConfig');
    if (!container) return;

    const dailyCategories = categories.diario || [];

    if (dailyCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic; padding: 1rem; text-align: center;">No hay categorías de gastos diarios configuradas. Agrega categorías en la sección superior.</p>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">';

    dailyCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '💸';
        const configData = dailyExpensesConfig.categories?.[categoryName] || {
            monthlyBudget: 0,
            trackingEnabled: true
        };

        const hasConfig = configData.monthlyBudget > 0;

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.875rem; background: white; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">${emoji}</span>
                    <h4 style="font-weight: 600; margin: 0; font-size: 1rem; flex: 1;">${categoryName}</h4>
                    ${hasConfig ? '<span style="background: #10b981; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">✓</span>' : ''}
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Presupuesto Mensual</label>
                        <input type="number" class="daily-budget" data-category="${categoryName}"
                               value="${configData.monthlyBudget}" min="0" step="0.01" placeholder="0.00"
                               style="width: 100%; padding: 0.375rem 0.5rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; font-size: 0.875rem;">
                    </div>
                    <div style="display: flex; align-items: center; padding: 0.375rem; background: #f9fafb; border-radius: 0.375rem;">
                        <label style="display: flex; align-items: center; cursor: pointer; margin: 0; gap: 0.5rem;">
                            <input type="checkbox" class="daily-tracking" data-category="${categoryName}"
                                   ${configData.trackingEnabled ? 'checked' : ''} style="width: 16px; height: 16px;">
                            <span style="font-size: 0.875rem; color: #374151;">Seguimiento activo</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<div style="margin-top: 1.5rem; display: flex; justify-content: center;"><button id="btnSaveDailyConfig" class="btn btn-primary" style="padding: 0.75rem 2rem;">💾 Guardar Configuración</button></div>';

    container.innerHTML = html;

    document.getElementById('btnSaveDailyConfig')?.addEventListener('click', saveDailyExpensesConfig);
}

async function saveGlobalBudget() {
    const globalInput = document.getElementById('globalDailyBudget');
    if (!globalInput) return;

    dailyExpensesConfig.globalBudget = parseFloat(globalInput.value) || 0;

    try {
        await api.put('/expenses-config/daily', dailyExpensesConfig);
        showAlert('Presupuesto global guardado exitosamente', 'success');
    } catch (error) {
        console.error('Error saving global budget:', error);
        showAlert(`Error al guardar presupuesto global: ${error.message}`, 'error');
    }
}

async function saveDailyExpensesConfig() {
    if (!dailyExpensesConfig.categories) {
        dailyExpensesConfig.categories = {};
    }

    document.querySelectorAll('.daily-budget').forEach(input => {
        const category = input.dataset.category;
        if (!dailyExpensesConfig.categories[category]) {
            dailyExpensesConfig.categories[category] = {};
        }
        dailyExpensesConfig.categories[category].monthlyBudget = parseFloat(input.value) || 0;
    });

    document.querySelectorAll('.daily-tracking').forEach(checkbox => {
        const category = checkbox.dataset.category;
        if (!dailyExpensesConfig.categories[category]) {
            dailyExpensesConfig.categories[category] = {};
        }
        dailyExpensesConfig.categories[category].trackingEnabled = checkbox.checked;
    });

    try {
        await api.put('/expenses-config/daily', dailyExpensesConfig);
        showAlert('Configuración de gastos diarios guardada exitosamente', 'success');
    } catch (error) {
        console.error('Error saving daily expenses config:', error);
        showAlert(`Error al guardar configuración: ${error.message}`, 'error');
    }
}
