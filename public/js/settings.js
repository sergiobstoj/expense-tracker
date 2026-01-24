let categories = {};
let incomeCategories = [];
let config = {};
let expenses = [];
let incomes = [];
let fixedExpensesConfig = {};
let variableExpensesConfig = {};
let dailyExpensesConfig = {};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Load all data with individual error handling
    await loadCategories().catch(e => console.error('Error loading categories:', e));
    await loadIncomeCategories().catch(e => console.error('Error loading income categories:', e));
    await loadConfig().catch(e => console.error('Error loading config:', e));
    await loadExpenses().catch(e => console.error('Error loading expenses:', e));
    await loadIncomes().catch(e => console.error('Error loading incomes:', e));
    await loadFixedExpensesConfig().catch(e => console.error('Error loading fixed expenses config:', e));
    await loadVariableExpensesConfig().catch(e => console.error('Error loading variable expenses config:', e));
    await loadDailyExpensesConfig().catch(e => console.error('Error loading daily expenses config:', e));

    // Display sections with individual error handling
    try { displayPersonsForm(); } catch(e) { console.error('Error displaying persons form:', e); }
    try { displayCategories(); } catch(e) { console.error('Error displaying categories:', e); }
    try { displayUserPins(); } catch(e) { console.error('Error displaying user pins:', e); }
    try { displayClosedMonths(); } catch(e) { console.error('Error displaying closed months:', e); }
    try { displayMonthlyPercentages(); } catch(e) { console.error('Error displaying monthly percentages:', e); }
    try { setupMonthSelector(); } catch(e) { console.error('Error setting up month selector:', e); }
    try { displayFixedExpensesConfig(); } catch(e) { console.error('Error displaying fixed expenses config:', e); }
    try { displayVariableExpensesConfig(); } catch(e) { console.error('Error displaying variable expenses config:', e); }
    try { displayDailyExpensesConfig(); } catch(e) { console.error('Error displaying daily expenses config:', e); }
    try { displayCategoryTypeChanger(); } catch(e) { console.error('Error displaying category type changer:', e); }
    try { setupEventHandlers(); } catch(e) { console.error('Error setting up event handlers:', e); }
});

async function loadCategories() {
    try {
        categories = await api.get('/categories');
    } catch (e) {
        categories = { fijo: [], variable: [], diario: [] };
    }
}

async function loadIncomeCategories() {
    try {
        incomeCategories = await api.get('/income-categories');
    } catch (e) {
        incomeCategories = [];
    }
}

async function loadConfig() {
    try {
        config = await api.get('/config');
    } catch (e) {
        config = { persons: [], splitPercentages: {}, monthlyPercentages: {} };
    }
}

async function loadExpenses() {
    try {
        expenses = await api.get('/expenses');
    } catch (e) {
        expenses = [];
    }
}

async function loadIncomes() {
    try {
        incomes = await api.get('/incomes');
    } catch (e) {
        incomes = [];
    }
}

function displayPersonsForm() {
    const container = document.getElementById('personsContainer');
    const persons = config.persons;
    const percentages = config.splitPercentages;
    
    let html = '<div style="margin-bottom: 1rem;">';
    html += '<p style="color: #6b7280; margin-bottom: 1rem;">Define los porcentajes de división de gastos comunes. La suma debe ser 100%.</p>';
    html += '</div>';
    
    persons.forEach((person, index) => {
        html += `
            <div class="form-grid" style="margin-bottom: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.375rem;">
                <div class="form-group">
                    <label>Nombre Persona ${index + 1}</label>
                    <input type="text" name="person_${index}" value="${person}" required>
                </div>
                <div class="form-group">
                    <label>Porcentaje (%)</label>
                    <input type="number" name="percentage_${index}" value="${percentages[person] || 50}" min="0" max="100" required>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function displayCategories() {
    displayCategoryList('fijo', 'categoriesFijo');
    displayCategoryList('variable', 'categoriesVariable');
    displayCategoryList('diario', 'categoriesDiario');
}

function displayCategoryList(type, containerId) {
    const container = document.getElementById(containerId);
    const typeCategories = categories[type] || [];
    
    if (typeCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías definidas</p>';
        return;
    }
    
    const html = typeCategories.map((category, index) => {
        // Handle both old string format and new object format
        const catName = typeof category === 'string' ? category : category.name;
        const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '📌';
        const isInUse = isCategoryInUse(type, catName);
        
        return `
            <div class="flex justify-between items-center" style="padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">${catEmoji}</span>
                    <strong>${catName}</strong>
                    ${isInUse ? '<span style="color: #10b981; font-size: 0.875rem; margin-left: 0.5rem;">✓ En uso</span>' : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-primary" onclick="editCategory('${type}', ${index})">
                        Editar
                    </button>
                    ${!isInUse ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory('${type}', '${catName}')">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function isCategoryInUse(type, categoryName) {
    return expenses.some(e => e.type === type && e.category === categoryName);
}

function isIncomeCategoryInUse(categoryName) {
    return incomes.some(i => i.category === categoryName);
}

function displayUserPins() {
    const container = document.getElementById('userPinsContainer');
    const userPins = config.userPins || {};
    
    const html = config.persons.map(person => {
        const hasPin = userPins[person] ? true : false;
        return `
            <div class="flex justify-between items-center" style="padding: 1rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>${person}</strong>
                    <span style="color: #6b7280; font-size: 0.875rem; margin-left: 0.5rem;">
                        ${hasPin ? '✓ PIN configurado' : '⚠ Sin PIN'}
                    </span>
                </div>
                <button class="btn btn-sm btn-primary" onclick="changeUserPin('${person}')">
                    ${hasPin ? 'Cambiar PIN' : 'Configurar PIN'}
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function changeUserPin(person) {
    const currentPin = prompt(`PIN actual de ${person} (dejar vacío si es nuevo):`);
    
    const userPins = config.userPins || {};
    
    // Verify current PIN if exists
    if (userPins[person] && currentPin !== userPins[person]) {
        showAlert('PIN actual incorrecto', 'error');
        return;
    }
    
    const newPin = prompt(`Nuevo PIN para ${person} (4 dígitos):`);
    
    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        showAlert('El PIN debe tener 4 dígitos numéricos', 'error');
        return;
    }
    
    if (!config.userPins) {
        config.userPins = {};
    }
    config.userPins[person] = newPin;
    
    try {
        await api.put('/config', config);
        showAlert(`PIN de ${person} actualizado exitosamente`, 'success');
        displayUserPins();
    } catch (error) {
        console.error('Error updating PIN:', error);
        showAlert(`Error al actualizar el PIN: ${error.message}`, 'error');
    }
}

function setupEventHandlers() {
    // Persons form
    document.getElementById('personsForm')?.addEventListener('submit', handlePersonsFormSubmit);

    // Master PIN form
    document.getElementById('masterPinForm')?.addEventListener('submit', handleMasterPinSubmit);

    // Month closure
    document.getElementById('btnCloseMonth')?.addEventListener('click', handleCloseMonth);

    // Monthly percentages
    document.getElementById('monthToEdit')?.addEventListener('change', handleMonthSelectChange);
    document.getElementById('btnSaveMonthPercentages')?.addEventListener('click', handleSaveMonthPercentages);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Set initial state
        themeToggle.checked = getTheme() === 'dark';

        // Add change listener
        themeToggle.addEventListener('change', (e) => {
            const newTheme = e.target.checked ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Export buttons
    document.getElementById('btnExportAll')?.addEventListener('click', exportAllData);
    document.getElementById('btnExportCSV')?.addEventListener('click', exportCSVData);
    document.getElementById('btnDownloadTemplate')?.addEventListener('click', downloadTemplate);
    document.getElementById('btnImport')?.addEventListener('click', handleImport);
}

function displayClosedMonths() {
    const container = document.getElementById('closedMonthsContainer');
    const closedMonths = config.closedMonths || [];
    
    if (closedMonths.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay meses cerrados</p>';
        return;
    }
    
    const html = closedMonths.map(month => {
        const monthName = getMonthName(month);
        return `
            <div class="flex justify-between items-center" style="padding: 0.75rem; background: #fee2e2; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>🔒 ${monthName}</strong>
                    <span style="color: #6b7280; font-size: 0.875rem; margin-left: 0.5rem;">Cerrado</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="reopenMonth('${month}')">
                    Reabrir
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function handleCloseMonth() {
    const monthInput = document.getElementById('monthToClose');
    const monthToClose = monthInput.value;
    
    if (!monthToClose) {
        showAlert('Selecciona un mes para cerrar', 'error');
        return;
    }
    
    const monthName = getMonthName(monthToClose);
    
    if (!confirm(`¿Estás seguro de que quieres cerrar ${monthName}?\n\nNo se podrán agregar o editar gastos/ingresos en este mes.`)) {
        return;
    }
    
    if (!config.closedMonths) {
        config.closedMonths = [];
    }
    
    if (config.closedMonths.includes(monthToClose)) {
        showAlert('Este mes ya está cerrado', 'error');
        return;
    }
    
    config.closedMonths.push(monthToClose);
    config.closedMonths.sort().reverse();
    
    try {
        await api.put('/config', config);
        showAlert(`Mes ${monthName} cerrado exitosamente`, 'success');
        monthInput.value = '';
        displayClosedMonths();
    } catch (error) {
        console.error('Error closing month:', error);
        showAlert(`Error al cerrar el mes: ${error.message}`, 'error');
    }
}

async function reopenMonth(month) {
    const monthName = getMonthName(month);
    
    if (!confirm(`¿Reabrir ${monthName}?\n\nSe podrán volver a agregar y editar gastos/ingresos en este mes.`)) {
        return;
    }
    
    config.closedMonths = (config.closedMonths || []).filter(m => m !== month);
    
    try {
        await api.put('/config', config);
        showAlert(`Mes ${monthName} reabierto exitosamente`, 'success');
        displayClosedMonths();
    } catch (error) {
        console.error('Error reopening month:', error);
        showAlert(`Error al reabrir el mes: ${error.message}`, 'error');
    }
}

async function handleMasterPinSubmit(e) {
    e.preventDefault();
    
    const currentPin = document.getElementById('currentMasterPin').value;
    const newPin = document.getElementById('newMasterPin').value;
    
    if (!/^\d{4}$/.test(newPin)) {
        showAlert('El PIN debe tener 4 dígitos numéricos', 'error');
        return;
    }
    
    const masterPin = config.masterPin || '0000';
    
    if (currentPin !== masterPin) {
        showAlert('PIN Maestro actual incorrecto', 'error');
        return;
    }
    
    config.masterPin = newPin;
    
    try {
        await api.put('/config', config);
        showAlert('PIN Maestro actualizado exitosamente', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Error updating master PIN:', error);
        showAlert(`Error al actualizar el PIN Maestro: ${error.message}`, 'error');
    }
}

async function handlePersonsFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const persons = [
        formData.get('person_0'),
        formData.get('person_1')
    ];
    
    const percentages = {
        [persons[0]]: parseInt(formData.get('percentage_0')),
        [persons[1]]: parseInt(formData.get('percentage_1'))
    };
    
    // Validate percentages sum to 100
    const total = percentages[persons[0]] + percentages[persons[1]];
    if (total !== 100) {
        showAlert(`Los porcentajes deben sumar 100% (actualmente: ${total}%)`, 'error');
        return;
    }
    
    // Update config
    config.persons = persons;
    config.splitPercentages = percentages;
    
    try {
        await api.put('/config', config);
        showAlert('Configuración actualizada exitosamente', 'success');
    } catch (error) {
        console.error('Error updating config:', error);
        showAlert(`Error al guardar la configuración: ${error.message}`, 'error');
    }
}

async function handleAddCategory(e, type) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newCategoryName = formData.get('newCategory').trim();
    
    if (!newCategoryName) {
        showAlert('Ingresa un nombre para la categoría', 'error');
        return;
    }
    
    // Ask for emoji
    const emoji = prompt('Ingresa un emoji para la categoría (opcional):', '📌');
    
    if (!categories[type]) {
        categories[type] = [];
    }
    
    // Check if category already exists
    const exists = categories[type].some(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName === newCategoryName;
    });
    
    if (exists) {
        showAlert('Esta categoría ya existe', 'error');
        return;
    }
    
    const newCategory = {
        name: newCategoryName,
        emoji: emoji || '📌'
    };
    
    categories[type].push(newCategory);
    
    try {
        await api.put('/categories', categories);
        showAlert('Categoría agregada exitosamente', 'success');
        e.target.reset();
        displayCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        showAlert(`Error al agregar la categoría: ${error.message}`, 'error');
    }
}

async function editCategory(type, index) {
    const category = categories[type][index];
    const catName = typeof category === 'string' ? category : category.name;
    const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '📌';
    
    const newName = prompt('Nombre de la categoría:', catName);
    if (!newName || newName.trim() === '') {
        return;
    }
    
    const newEmoji = prompt('Emoji de la categoría:', catEmoji);
    if (!newEmoji || newEmoji.trim() === '') {
        return;
    }
    
    // Check if name already exists (excluding current)
    const exists = categories[type].some((cat, i) => {
        if (i === index) return false;
        const existingName = typeof cat === 'string' ? cat : cat.name;
        return existingName === newName.trim();
    });
    
    if (exists) {
        showAlert('Ya existe una categoría con ese nombre', 'error');
        return;
    }
    
    categories[type][index] = {
        name: newName.trim(),
        emoji: newEmoji.trim()
    };
    
    try {
        await api.put('/categories', categories);
        showAlert('Categoría actualizada exitosamente', 'success');
        displayCategories();
    } catch (error) {
        console.error('Error updating category:', error);
        showAlert(`Error al actualizar la categoría: ${error.message}`, 'error');
    }
}

async function deleteCategory(type, categoryName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?`)) {
        return;
    }
    
    // Check if in use
    if (isCategoryInUse(type, categoryName)) {
        showAlert('No se puede eliminar una categoría que está en uso', 'error');
        return;
    }
    
    categories[type] = categories[type].filter(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName !== categoryName;
    });
    
    try {
        await api.put('/categories', categories);
        showAlert('Categoría eliminada exitosamente', 'success');
        displayCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert(`Error al eliminar la categoría: ${error.message}`, 'error');
    }
}

function exportAllData() {
    const data = {
        expenses,
        incomes,
        categories,
        incomeCategories,
        config,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gastos_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showAlert('Datos exportados exitosamente', 'success');
}

function exportCSVData() {
    if (expenses.length === 0) {
        showAlert('No hay gastos para exportar', 'error');
        return;
    }
    
    exportToCSV(expenses, `gastos_completo_${new Date().toISOString().split('T')[0]}.csv`);
    showAlert('Gastos exportados exitosamente', 'success');
}

function downloadTemplate() {
    const type = document.getElementById('importType').value;
    
    if (type === 'expenses') {
        const template = [
            ['fecha', 'tipo', 'categoria', 'monto', 'pagado_por', 'es_comun', 'descripcion'],
            ['2024-12-01', 'fijo', 'Arriendo', '850', 'Sergio', 'si', 'Arriendo diciembre'],
            ['2024-12-05', 'variable', 'Supermercado', '120.50', 'Claudia', 'si', 'Compra semanal'],
            ['2024-12-10', 'diario', 'Café', '3.50', 'Sergio', 'no', 'Café del trabajo']
        ];
        
        const csv = template.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plantilla_gastos.csv';
        link.click();
    } else {
        const template = [
            ['fecha', 'categoria', 'monto', 'recibido_por', 'descripcion'],
            ['2024-12-01', 'Salario', '2500', 'Sergio', 'Salario mensual'],
            ['2024-12-15', 'Freelance', '500', 'Claudia', 'Proyecto web']
        ];
        
        const csv = template.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'plantilla_ingresos.csv';
        link.click();
    }
    
    showAlert('Plantilla descargada exitosamente', 'success');
}

async function handleImport() {
    const fileInput = document.getElementById('fileImport');
    const type = document.getElementById('importType').value;
    const resultsDiv = document.getElementById('importResults');

    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert('Por favor selecciona un archivo', 'error');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            let data;

            // Check if it's CSV or Excel
            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                data = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const obj = {};
                    headers.forEach((header, i) => {
                        obj[header] = values[i]?.trim() || '';
                    });
                    return obj;
                });
            } else {
                // Parse Excel
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

                // Normalize headers to lowercase
                data = data.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(key => {
                        normalized[key.toLowerCase().trim()] = row[key];
                    });
                    return normalized;
                });
            }

            // PHASE 1: Validate ALL rows first (atomic validation)
            const validatedRecords = [];
            const errors = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];

                try {
                    if (type === 'expenses') {
                        const expense = {
                            type: row.tipo || row.type,
                            category: row.categoria || row.category,
                            amount: parseFloat(row.monto || row.amount),
                            date: row.fecha || row.date,
                            paidBy: row.pagado_por || row.paid_by || row.paidby,
                            isShared: (row.es_comun || row.is_shared || row.isshared || '').toLowerCase() === 'si' ||
                                     (row.es_comun || row.is_shared || row.isshared || '').toLowerCase() === 'yes' ||
                                     (row.es_comun || row.is_shared || row.isshared || '').toLowerCase() === 'true',
                            description: row.descripcion || row.description || ''
                        };

                        // Validate required fields
                        if (!expense.type || !expense.category || !expense.amount || !expense.date || !expense.paidBy) {
                            throw new Error('Faltan campos requeridos');
                        }

                        // Validate amount is a valid number
                        if (isNaN(expense.amount) || expense.amount <= 0) {
                            throw new Error('Monto inválido');
                        }

                        // Validate date format (YYYY-MM-DD)
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
                            throw new Error('Formato de fecha inválido (debe ser YYYY-MM-DD)');
                        }

                        validatedRecords.push({ type: 'expense', data: expense });
                    } else {
                        const income = {
                            category: row.categoria || row.category,
                            amount: parseFloat(row.monto || row.amount),
                            date: row.fecha || row.date,
                            receivedBy: row.recibido_por || row.received_by || row.receivedby,
                            description: row.descripcion || row.description || ''
                        };

                        // Validate required fields
                        if (!income.category || !income.amount || !income.date || !income.receivedBy) {
                            throw new Error('Faltan campos requeridos');
                        }

                        // Validate amount is a valid number
                        if (isNaN(income.amount) || income.amount <= 0) {
                            throw new Error('Monto inválido');
                        }

                        // Validate date format (YYYY-MM-DD)
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(income.date)) {
                            throw new Error('Formato de fecha inválido (debe ser YYYY-MM-DD)');
                        }

                        validatedRecords.push({ type: 'income', data: income });
                    }
                } catch (error) {
                    errors.push(`Fila ${i + 2}: ${error.message}`);
                }
            }

            // If there are ANY errors, abort the entire import
            if (errors.length > 0) {
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; background: #fee2e2; border-radius: 0.375rem;">
                        <strong>❌ Importación cancelada</strong><br>
                        Se encontraron ${errors.length} error(es). No se importó ningún registro.<br><br>
                        <strong>Errores encontrados:</strong><br>
                        ${errors.join('<br>')}
                    </div>
                `;
                showAlert('Importación cancelada: se encontraron errores en el archivo', 'error');
                fileInput.value = '';
                return;
            }

            // PHASE 2: All rows are valid, now import them
            let successCount = 0;
            const importErrors = [];

            for (let i = 0; i < validatedRecords.length; i++) {
                const record = validatedRecords[i];
                try {
                    if (record.type === 'expense') {
                        await api.post('/expenses', record.data);
                    } else {
                        await api.post('/incomes', record.data);
                    }
                    successCount++;
                } catch (error) {
                    importErrors.push(`Registro ${i + 1}: ${error.message}`);
                }
            }

            // Show results
            resultsDiv.style.display = 'block';
            if (importErrors.length === 0) {
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; background: #d1fae5; border-radius: 0.375rem;">
                        <strong>✅ Importación exitosa</strong><br>
                        ${successCount} registro(s) importado(s) correctamente.
                    </div>
                `;
                showAlert(`Importación exitosa: ${successCount} registros importados`, 'success');
            } else {
                resultsDiv.innerHTML = `
                    <div style="padding: 1rem; background: #fef3c7; border-radius: 0.375rem;">
                        <strong>⚠️ Importación parcial</strong><br>
                        ${successCount} de ${validatedRecords.length} registros importados.<br><br>
                        <strong>Errores:</strong><br>
                        ${importErrors.join('<br>')}
                    </div>
                `;
                showAlert(`Importación parcial: ${successCount}/${validatedRecords.length} registros`, 'error');
            }

            // Reload data
            await loadExpenses();
            await loadIncomes();

            // Clear file input
            fileInput.value = '';

        } catch (error) {
            console.error('Error importing file:', error);
            showAlert(`Error al importar archivo: ${error.message}`, 'error');
        }
    };

    // Read file
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

// Monthly Percentages Management
function displayMonthlyPercentages() {
    const container = document.getElementById('monthlyPercentagesContainer');
    const monthlyPercentages = config.monthlyPercentages || {};

    if (Object.keys(monthlyPercentages).length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay porcentajes mensuales configurados</p>';
        return;
    }

    // Sort months in reverse chronological order
    const sortedMonths = Object.keys(monthlyPercentages).sort().reverse();

    const html = sortedMonths.map(month => {
        const percentages = monthlyPercentages[month];
        const monthName = getMonthName(month);

        const percentageDisplay = Object.entries(percentages)
            .map(([person, pct]) => `${person}: ${pct}%`)
            .join(' / ');

        return `
            <div class="flex justify-between items-center" style="padding: 0.75rem; background: #f0f9ff; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <div>
                    <strong>${monthName}</strong>
                    <span style="color: #6b7280; font-size: 0.875rem; margin-left: 0.5rem;">
                        ${percentageDisplay}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function setupMonthSelector() {
    const select = document.getElementById('monthToEdit');
    const monthlyPercentages = config.monthlyPercentages || {};

    // Get all months
    const allMonths = Object.keys(monthlyPercentages).sort().reverse();

    select.innerHTML = '<option value="">Selecciona un mes...</option>';

    allMonths.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = getMonthName(month);
        select.appendChild(option);
    });
}

function handleMonthSelectChange(e) {
    const selectedMonth = e.target.value;
    const formDiv = document.getElementById('monthPercentagesForm');
    const inputsDiv = document.getElementById('monthPercentagesInputs');

    if (!selectedMonth) {
        formDiv.style.display = 'none';
        return;
    }

    // Get percentages for this month
    const monthlyPercentages = config.monthlyPercentages || {};
    const percentages = monthlyPercentages[selectedMonth] || config.splitPercentages;

    // Generate form inputs
    let html = '<div class="form-grid" style="margin-bottom: 1rem;">';

    config.persons.forEach(person => {
        html += `
            <div class="form-group">
                <label>${person} (%)</label>
                <input type="number"
                       class="month-percentage-input"
                       data-person="${person}"
                       value="${percentages[person] || 50}"
                       min="0"
                       max="100"
                       required>
            </div>
        `;
    });

    html += '</div>';
    html += `<p style="color: #6b7280; font-size: 0.875rem;">La suma debe ser 100%</p>`;

    inputsDiv.innerHTML = html;
    formDiv.style.display = 'block';
}

async function handleSaveMonthPercentages() {
    const selectedMonth = document.getElementById('monthToEdit').value;

    if (!selectedMonth) {
        showAlert('Selecciona un mes', 'error');
        return;
    }

    // Get percentages from inputs
    const inputs = document.querySelectorAll('.month-percentage-input');
    const newPercentages = {};
    let total = 0;

    inputs.forEach(input => {
        const person = input.dataset.person;
        const value = parseInt(input.value);
        newPercentages[person] = value;
        total += value;
    });

    // Validate total is 100
    if (Math.abs(total - 100) > 0.01) {
        showAlert(`Los porcentajes deben sumar 100% (actualmente: ${total}%)`, 'error');
        return;
    }

    // Update config
    if (!config.monthlyPercentages) {
        config.monthlyPercentages = {};
    }

    config.monthlyPercentages[selectedMonth] = newPercentages;

    try {
        await api.put('/config', config);
        showAlert(`Porcentajes del mes ${getMonthName(selectedMonth)} actualizados exitosamente`, 'success');
        displayMonthlyPercentages();

        // Reload config to get updated data
        await loadConfig();
    } catch (error) {
        console.error('Error updating monthly percentages:', error);
        showAlert(`Error al actualizar porcentajes: ${error.message}`, 'error');
    }
}

// ============================================
// EXPENSES CONFIGURATION (FIXED, VARIABLE, DAILY)
// ============================================

async function loadFixedExpensesConfig() {
    try {
        fixedExpensesConfig = await api.get('/expenses-config/fixed');
    } catch (e) {
        fixedExpensesConfig = {};
    }
}

async function loadVariableExpensesConfig() {
    try {
        variableExpensesConfig = await api.get('/expenses-config/variable');
    } catch (e) {
        variableExpensesConfig = {};
    }
}

async function loadDailyExpensesConfig() {
    try {
        dailyExpensesConfig = await api.get('/expenses-config/daily');
    } catch (e) {
        dailyExpensesConfig = { globalBudget: 0, categories: {} };
    }
}

function displayFixedExpensesConfig() {
    const container = document.getElementById('fixedExpensesConfig');
    if (!container) return;

    const fixedCategories = categories.fijo || [];

    if (fixedCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de gastos fijos configuradas</p>';
        return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';

    fixedCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const configData = fixedExpensesConfig[categoryName] || {
            defaultAmount: 0,
            paymentDay: 1,
            assignedTo: '',
            description: ''
        };

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
                <h4 style="font-weight: 600; margin-bottom: 0.75rem;">${categoryName}</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Monto Esperado</label>
                        <input type="number" class="fixed-amount" data-category="${categoryName}"
                               value="${configData.defaultAmount}" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Día de Pago (1-31)</label>
                        <input type="number" class="fixed-day" data-category="${categoryName}"
                               value="${configData.paymentDay}" min="1" max="31" placeholder="1">
                    </div>
                    <div class="form-group">
                        <label>Responsable</label>
                        <select class="fixed-assigned" data-category="${categoryName}">
                            <option value="">No asignado</option>
                            ${config.persons?.map(p => `<option value="${p}" ${configData.assignedTo === p ? 'selected' : ''}>${p}</option>`).join('') || ''}
                        </select>
                    </div>
                </div>
                <div class="form-group mt-2">
                    <label>Descripción</label>
                    <input type="text" class="fixed-desc" data-category="${categoryName}"
                           value="${configData.description}" placeholder="Opcional">
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<button id="btnSaveFixedConfig" class="btn btn-primary mt-3">Guardar Configuración de Gastos Fijos</button>';

    container.innerHTML = html;

    document.getElementById('btnSaveFixedConfig')?.addEventListener('click', saveFixedExpensesConfig);
}

async function saveFixedExpensesConfig() {
    const newConfig = {};

    document.querySelectorAll('.fixed-amount').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].defaultAmount = parseFloat(input.value) || 0;
    });

    document.querySelectorAll('.fixed-day').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].paymentDay = parseInt(input.value) || 1;
    });

    document.querySelectorAll('.fixed-assigned').forEach(select => {
        const category = select.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].assignedTo = select.value;
    });

    document.querySelectorAll('.fixed-desc').forEach(input => {
        const category = input.dataset.category;
        if (!newConfig[category]) newConfig[category] = {};
        newConfig[category].description = input.value;
    });

    try {
        await api.put('/expenses-config/fixed', newConfig);
        fixedExpensesConfig = newConfig;
        showAlert('Configuración de gastos fijos guardada exitosamente', 'success');
    } catch (error) {
        console.error('Error saving fixed expenses config:', error);
        showAlert(`Error al guardar configuración: ${error.message}`, 'error');
    }
}

function displayVariableExpensesConfig() {
    const container = document.getElementById('variableExpensesConfig');
    if (!container) return;

    const variableCategories = categories.variable || [];

    if (variableCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de gastos variables configuradas</p>';
        return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';

    variableCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const configData = variableExpensesConfig[categoryName] || {
            estimatedAmount: 0,
            budgetAlert: 0,
            assignedTo: '',
            description: ''
        };

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
                <h4 style="font-weight: 600; margin-bottom: 0.75rem;">${categoryName}</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Monto Estimado Mensual</label>
                        <input type="number" class="variable-amount" data-category="${categoryName}"
                               value="${configData.estimatedAmount}" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Alerta de Presupuesto</label>
                        <input type="number" class="variable-alert" data-category="${categoryName}"
                               value="${configData.budgetAlert}" min="0" step="0.01" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>Responsable</label>
                        <select class="variable-assigned" data-category="${categoryName}">
                            <option value="">No asignado</option>
                            <option value="Ambos" ${configData.assignedTo === 'Ambos' ? 'selected' : ''}>Ambos</option>
                            ${config.persons?.map(p => `<option value="${p}" ${configData.assignedTo === p ? 'selected' : ''}>${p}</option>`).join('') || ''}
                        </select>
                    </div>
                </div>
                <div class="form-group mt-2">
                    <label>Descripción</label>
                    <input type="text" class="variable-desc" data-category="${categoryName}"
                           value="${configData.description}" placeholder="Opcional">
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<button id="btnSaveVariableConfig" class="btn btn-primary mt-3">Guardar Configuración de Gastos Variables</button>';

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
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de gastos diarios configuradas</p>';
        return;
    }

    let html = '<div style="display: grid; gap: 1rem;">';

    dailyCategories.forEach(cat => {
        const categoryName = typeof cat === 'string' ? cat : cat.name;
        const configData = dailyExpensesConfig.categories?.[categoryName] || {
            monthlyBudget: 0,
            trackingEnabled: true
        };

        html += `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
                <div class="form-grid">
                    <div class="form-group">
                        <label style="font-weight: 600;">${categoryName}</label>
                        <input type="number" class="daily-budget" data-category="${categoryName}"
                               value="${configData.monthlyBudget}" min="0" step="0.01" placeholder="Presupuesto mensual">
                    </div>
                    <div class="form-group" style="display: flex; align-items: center;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" class="daily-tracking" data-category="${categoryName}"
                                   ${configData.trackingEnabled ? 'checked' : ''} style="margin-right: 0.5rem;">
                            <span>Seguimiento activo</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    html += '<button id="btnSaveDailyConfig" class="btn btn-primary mt-3">Guardar Configuración de Gastos Diarios</button>';

    container.innerHTML = html;

    document.getElementById('btnSaveDailyConfig')?.addEventListener('click', saveDailyExpensesConfig);
    document.getElementById('btnSaveGlobalBudget')?.addEventListener('click', saveGlobalBudget);
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

// ============================================
// CHANGE CATEGORY TYPE
// ============================================

// Store category type mapping for the changer
let categoryTypeMap = {};

function displayCategoryTypeChanger() {
    const selectCategory = document.getElementById('categoryToChange');
    const currentType = document.getElementById('currentType');
    const newType = document.getElementById('newType');
    const migrationOptions = document.getElementById('migrationOptions');
    const btnChange = document.getElementById('btnChangeCategoryType');

    if (!selectCategory || !currentType || !newType || !btnChange) return;

    // Build category type mapping
    categoryTypeMap = {};
    let html = '<option value="">Selecciona una categoría...</option>';

    ['fijo', 'variable', 'diario'].forEach(type => {
        const cats = categories[type] || [];
        cats.forEach(cat => {
            const categoryName = typeof cat === 'string' ? cat : cat.name;
            categoryTypeMap[categoryName] = type;
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
            html += `<option value="${categoryName}">${categoryName} (${typeLabel})</option>`;
        });
    });

    selectCategory.innerHTML = html;

    // Remove old event listeners by cloning
    const newSelectCategory = selectCategory.cloneNode(true);
    selectCategory.parentNode.replaceChild(newSelectCategory, selectCategory);

    const newNewType = newType.cloneNode(true);
    newType.parentNode.replaceChild(newNewType, newType);

    const newBtnChange = btnChange.cloneNode(true);
    btnChange.parentNode.replaceChild(newBtnChange, btnChange);

    // Add fresh event handlers
    document.getElementById('categoryToChange').addEventListener('change', handleCategorySelect);
    document.getElementById('newType').addEventListener('change', handleNewTypeSelect);
    document.getElementById('btnChangeCategoryType').addEventListener('click', changeCategoryType);
}

function handleCategorySelect(e) {
    const categoryName = e.target.value;
    const currentType = document.getElementById('currentType');
    const newType = document.getElementById('newType');
    const migrationOptions = document.getElementById('migrationOptions');
    const btnChange = document.getElementById('btnChangeCategoryType');

    if (categoryName && categoryTypeMap[categoryName]) {
        const type = categoryTypeMap[categoryName];
        currentType.value = type.charAt(0).toUpperCase() + type.slice(1);
        newType.value = '';
        migrationOptions.style.display = 'none';
        btnChange.disabled = true;
    } else {
        currentType.value = '';
        newType.value = '';
        migrationOptions.style.display = 'none';
        btnChange.disabled = true;
    }
}

function handleNewTypeSelect() {
    const selectCategory = document.getElementById('categoryToChange');
    const currentType = document.getElementById('currentType');
    const newType = document.getElementById('newType');
    const migrationOptions = document.getElementById('migrationOptions');
    const btnChange = document.getElementById('btnChangeCategoryType');

    if (selectCategory.value && newType.value && currentType.value.toLowerCase() !== newType.value) {
        migrationOptions.style.display = 'block';
        btnChange.disabled = false;
    } else {
        migrationOptions.style.display = 'none';
        btnChange.disabled = true;
    }
}

async function changeCategoryType() {
    const selectCategory = document.getElementById('categoryToChange');
    const currentTypeInput = document.getElementById('currentType');
    const newTypeInput = document.getElementById('newType');
    const migrateCheckbox = document.getElementById('migrateHistorical');

    if (!selectCategory || !currentTypeInput || !newTypeInput) return;

    const categoryName = selectCategory.value;
    const currentType = currentTypeInput.value.toLowerCase();
    const newType = newTypeInput.value;
    const migrateHistorical = migrateCheckbox?.checked || false;

    if (!categoryName || !newType || currentType === newType) {
        showAlert('Por favor selecciona una categoría y un nuevo tipo válido', 'error');
        return;
    }

    if (!confirm(`¿Estás seguro de cambiar "${categoryName}" de ${currentType} a ${newType}?${migrateHistorical ? '\n\nSe migrarán todos los gastos históricos.' : '\n\nSolo los gastos futuros usarán el nuevo tipo.'}`)) {
        return;
    }

    try {
        // Remove from current type
        const currentCats = categories[currentType] || [];
        const category = currentCats.find(c => (typeof c === 'string' ? c : c.name) === categoryName);
        categories[currentType] = currentCats.filter(c => (typeof c === 'string' ? c : c.name) !== categoryName);

        // Add to new type
        if (!categories[newType]) categories[newType] = [];
        categories[newType].push(category);

        // Save categories
        await api.put('/categories', categories);

        // Migrate historical expenses if requested
        if (migrateHistorical) {
            const updatedExpenses = expenses.map(expense => {
                if (expense.category === categoryName && expense.type === currentType) {
                    return { ...expense, type: newType };
                }
                return expense;
            });

            // Update each expense
            for (const expense of updatedExpenses) {
                if (expense.category === categoryName && expense.type === newType) {
                    await api.put(`/expenses/${expense.id}`, expense);
                }
            }

            await loadExpenses();
        }

        // Reload and display
        await loadCategories();
        displayCategories();
        displayCategoryTypeChanger();
        displayFixedExpensesConfig();
        displayVariableExpensesConfig();
        displayDailyExpensesConfig();

        showAlert(`Categoría "${categoryName}" movida de ${currentType} a ${newType} exitosamente${migrateHistorical ? ' (con migración de gastos históricos)' : ''}`, 'success');

        // Reset form
        selectCategory.value = '';
        currentTypeInput.value = '';
        newTypeInput.value = '';
        document.getElementById('migrationOptions').style.display = 'none';
        document.getElementById('btnChangeCategoryType').disabled = true;

    } catch (error) {
        console.error('Error changing category type:', error);
        showAlert(`Error al cambiar tipo de categoría: ${error.message}`, 'error');
    }
}
