let categories = {};
let incomeCategories = [];
let config = {};
let expenses = [];
let incomes = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadCategories(),
            loadIncomeCategories(),
            loadConfig(),
            loadExpenses(),
            loadIncomes()
        ]);

        displayPersonsForm();
        displayCategories();
        displayIncomeCategories();
        displayUserPins();
        displayClosedMonths();
        setupEventHandlers();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar configuración', 'error');
    }
});

async function loadCategories() {
    categories = await api.get('/categories');
}

async function loadIncomeCategories() {
    incomeCategories = await api.get('/income-categories');
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

function displayIncomeCategories() {
    const container = document.getElementById('incomeCategories');
    
    if (incomeCategories.length === 0) {
        container.innerHTML = '<p style="color: #6b7280; font-style: italic;">No hay categorías de ingreso definidas</p>';
        return;
    }
    
    const html = incomeCategories.map((category, index) => {
        // Handle both string and object format
        const catName = typeof category === 'string' ? category : category.name;
        const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '💰';
        const isInUse = isIncomeCategoryInUse(catName);
        
        return `
            <div class="flex justify-between items-center" style="padding: 0.75rem; background: #f0fdf4; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">${catEmoji}</span>
                    <strong>${catName}</strong>
                    ${isInUse ? '<span style="color: #10b981; font-size: 0.875rem; margin-left: 0.5rem;">✓ En uso</span>' : ''}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-sm btn-success" onclick="editIncomeCategory(${index})">
                        Editar
                    </button>
                    ${!isInUse ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteIncomeCategory('${catName}')">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
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
    document.getElementById('personsForm').addEventListener('submit', handlePersonsFormSubmit);
    
    // Master PIN form
    document.getElementById('masterPinForm').addEventListener('submit', handleMasterPinSubmit);
    
    // Month closure
    document.getElementById('btnCloseMonth').addEventListener('click', handleCloseMonth);
    
    // Category forms
    document.getElementById('addCategoryFijo').addEventListener('submit', (e) => handleAddCategory(e, 'fijo'));
    document.getElementById('addCategoryVariable').addEventListener('submit', (e) => handleAddCategory(e, 'variable'));
    document.getElementById('addCategoryDiario').addEventListener('submit', (e) => handleAddCategory(e, 'diario'));
    
    // Income category form
    document.getElementById('addIncomeCategory').addEventListener('submit', handleAddIncomeCategory);
    
    // Export buttons
    document.getElementById('btnExportAll').addEventListener('click', exportAllData);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSVData);
    document.getElementById('btnDownloadTemplate').addEventListener('click', downloadTemplate);
    document.getElementById('btnImport').addEventListener('click', handleImport);
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

async function handleAddIncomeCategory(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newCategoryName = formData.get('newCategory').trim();
    
    if (!newCategoryName) {
        showAlert('Ingresa un nombre para la categoría', 'error');
        return;
    }
    
    // Ask for emoji
    const emoji = prompt('Ingresa un emoji para la categoría (opcional):', '💰');
    
    // Check if exists
    const exists = incomeCategories.some(cat => {
        const catName = typeof cat === 'string' ? cat : cat.name;
        return catName === newCategoryName;
    });
    
    if (exists) {
        showAlert('Esta categoría ya existe', 'error');
        return;
    }
    
    const newCategory = {
        name: newCategoryName,
        emoji: emoji || '💰'
    };
    
    incomeCategories.push(newCategory);
    
    try {
        await api.put('/income-categories', incomeCategories);
        showAlert('Categoría de ingreso agregada exitosamente', 'success');
        e.target.reset();
        displayIncomeCategories();
    } catch (error) {
        console.error('Error adding income category:', error);
        showAlert(`Error al agregar la categoría: ${error.message}`, 'error');
    }
}

async function editIncomeCategory(index) {
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
        showAlert('Categoría de ingreso actualizada exitosamente', 'success');
        displayIncomeCategories();
    } catch (error) {
        console.error('Error updating income category:', error);
        showAlert(`Error al actualizar la categoría: ${error.message}`, 'error');
    }
}

async function deleteIncomeCategory(categoryName) {
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
        showAlert('Categoría de ingreso eliminada exitosamente', 'success');
        displayIncomeCategories();
    } catch (error) {
        console.error('Error deleting income category:', error);
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
            
            // Process data
            let successCount = 0;
            let errorCount = 0;
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
                        
                        // Validate
                        if (!expense.type || !expense.category || !expense.amount || !expense.date || !expense.paidBy) {
                            throw new Error('Faltan campos requeridos');
                        }
                        
                        await api.post('/expenses', expense);
                        successCount++;
                    } else {
                        const income = {
                            category: row.categoria || row.category,
                            amount: parseFloat(row.monto || row.amount),
                            date: row.fecha || row.date,
                            receivedBy: row.recibido_por || row.received_by || row.receivedby,
                            description: row.descripcion || row.description || ''
                        };
                        
                        // Validate
                        if (!income.category || !income.amount || !income.date || !income.receivedBy) {
                            throw new Error('Faltan campos requeridos');
                        }
                        
                        await api.post('/incomes', income);
                        successCount++;
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`Fila ${i + 2}: ${error.message}`);
                }
            }
            
            // Show results
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = `
                <div style="padding: 1rem; background: ${errorCount === 0 ? '#d1fae5' : '#fef3c7'}; border-radius: 0.375rem;">
                    <strong>Resultado de importación:</strong><br>
                    ✅ ${successCount} registros importados exitosamente<br>
                    ${errorCount > 0 ? `❌ ${errorCount} registros con errores` : ''}
                    ${errors.length > 0 ? `<br><br><strong>Errores:</strong><br>${errors.slice(0, 5).join('<br>')}${errors.length > 5 ? '<br>...' : ''}` : ''}
                </div>
            `;
            
            showAlert(`Importación completada: ${successCount} registros importados`, successCount > 0 ? 'success' : 'error');
            
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
