let incomeCategories = [];
let incomes = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadIncomeCategories(),
            loadIncomes()
        ]);

        displayIncomeCategories();
        setupEventHandlers();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar configuración', 'error');
    }
});

async function loadIncomeCategories() {
    incomeCategories = await api.get('/income-categories');
}

async function loadIncomes() {
    incomes = await api.get('/incomes');
}

function setupEventHandlers() {
    document.getElementById('btnAddCategory')?.addEventListener('click', handleAddCategory);
}

function displayIncomeCategories() {
    const container = document.getElementById('incomeCategoriesList');
    if (!container) return;

    if (incomeCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic; padding: 1rem; text-align: center;">No hay categorías de ingreso definidas. Haz clic en "Agregar Categoría" para crear una.</p>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">';

    incomeCategories.forEach((cat, index) => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : '💰';
        const isInUse = isIncomeCategoryInUse(categoryName);

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.875rem; background: white; transition: box-shadow 0.2s;" onmouseover="this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">${emoji}</span>
                    <h4 style="font-weight: 600; margin: 0; font-size: 1rem; flex: 1;">${categoryName}</h4>
                    ${isInUse ? '<span style="background: #10b981; color: white; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500;">✓</span>' : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-sm btn-primary" onclick="editCategory(${index})">
                        Editar
                    </button>
                    ${!isInUse ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${categoryName}')">
                            Eliminar
                        </button>
                    ` : '<span style="font-size: 0.75rem; color: #6b7280;">En uso</span>'}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function isIncomeCategoryInUse(categoryName) {
    return incomes.some(i => i.category === categoryName);
}

async function handleAddCategory() {
    const categoryName = prompt('Nombre de la nueva categoría de ingreso:');

    if (!categoryName || categoryName.trim() === '') {
        return;
    }

    const trimmedName = categoryName.trim();

    // Check if exists
    const exists = incomeCategories.some(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName === trimmedName;
    });

    if (exists) {
        showAlert('Esta categoría ya existe', 'error');
        return;
    }

    const emoji = prompt('Ingresa un emoji para la categoría (opcional):', '💰');

    const newCategory = {
        name: trimmedName,
        emoji: emoji || '💰'
    };

    incomeCategories.push(newCategory);

    try {
        await api.put('/income-categories', incomeCategories);
        showAlert('Categoría agregada exitosamente', 'success');
        displayIncomeCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        showAlert(`Error al agregar la categoría: ${error.message}`, 'error');
    }
}

async function editCategory(index) {
    const category = incomeCategories[index];
    const catName = typeof category === 'string' ? category : category.name;
    const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '💰';

    const newName = prompt('Nombre de la categoría:', catName);
    if (!newName || newName.trim() === '') {
        return;
    }

    const newEmoji = prompt('Emoji de la categoría:', catEmoji);
    if (!newEmoji || newEmoji.trim() === '') {
        return;
    }

    // Check if name already exists (excluding current)
    const exists = incomeCategories.some((cat, i) => {
        if (i === index) return false;
        const existingName = typeof cat === 'string' ? cat : cat.name;
        return existingName === newName.trim();
    });

    if (exists) {
        showAlert('Ya existe una categoría con ese nombre', 'error');
        return;
    }

    incomeCategories[index] = {
        name: newName.trim(),
        emoji: newEmoji.trim()
    };

    try {
        await api.put('/income-categories', incomeCategories);
        showAlert('Categoría actualizada exitosamente', 'success');
        displayIncomeCategories();
    } catch (error) {
        console.error('Error updating category:', error);
        showAlert(`Error al actualizar la categoría: ${error.message}`, 'error');
    }
}

async function deleteCategory(categoryName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría de ingreso "${categoryName}"?`)) {
        return;
    }

    if (isIncomeCategoryInUse(categoryName)) {
        showAlert('No se puede eliminar una categoría que está en uso', 'error');
        return;
    }

    incomeCategories = incomeCategories.filter(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName !== categoryName;
    });

    try {
        await api.put('/income-categories', incomeCategories);
        showAlert('Categoría eliminada exitosamente', 'success');
        displayIncomeCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert(`Error al eliminar la categoría: ${error.message}`, 'error');
    }
}
