let incomeCategories = [];
let config = {};
let incomes = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            loadIncomeCategories(),
            loadConfig(),
            loadIncomes()
        ]);

        setTodayAsDefault('date');
        setupFormHandlers();
        displayRecentIncomes();
    } catch (error) {
        console.error('Error initializing:', error);
        showAlert('Error al cargar la aplicación', 'error');
    }
});

async function loadIncomeCategories() {
    incomeCategories = await api.get('/income-categories');
    
    const categorySelect = document.getElementById('category');
    const editCategorySelect = document.getElementById('editCategory');
    const quickButtonsContainer = document.getElementById('quickIncomeCategoryButtons');
    
    // Populate quick buttons (show ALL as buttons - no "Otro")
    if (quickButtonsContainer) {
        quickButtonsContainer.innerHTML = incomeCategories.map(category => {
            const catName = typeof category === 'string' ? category : category.name;
            const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '💰';

            return `
                <button type="button" class="quick-income-btn" data-category="${catName}">
                    ${catEmoji} ${catName}
                </button>
            `;
        }).join('');

        // Add click handlers
        document.querySelectorAll('.quick-income-btn[data-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                categorySelect.value = btn.dataset.category;
                document.querySelectorAll('.quick-income-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Select first category by default
        if (incomeCategories.length > 0) {
            const firstCat = incomeCategories[0];
            const firstName = typeof firstCat === 'string' ? firstCat : firstCat.name;
            categorySelect.value = firstName;
            document.querySelector('.quick-income-btn[data-category]')?.classList.add('active');
        }
    }

    // Hide the select completely since we only use buttons
    categorySelect.style.display = 'none';
    
    categorySelect.innerHTML = '<option value="">Selecciona...</option>';
    editCategorySelect.innerHTML = '';
    
    incomeCategories.forEach(category => {
        const catName = typeof category === 'string' ? category : category.name;
        const catEmoji = typeof category === 'object' && category.emoji ? category.emoji : '💰';
        
        const option1 = document.createElement('option');
        option1.value = catName;
        option1.textContent = `${catEmoji} ${catName}`;
        categorySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = catName;
        option2.textContent = `${catEmoji} ${catName}`;
        editCategorySelect.appendChild(option2);
    });
    
    // Add option to create new category in select
    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ Nueva categoría';
    categorySelect.appendChild(newOption);
    
    categorySelect.addEventListener('change', function(e) {
        if (e.target.value === '__new__') {
            const newCategory = prompt('Nombre de la nueva categoría de ingreso:');
            if (newCategory && newCategory.trim()) {
                const emoji = prompt('Emoji (opcional):', '💰');
                const newCat = {
                    name: newCategory.trim(),
                    emoji: emoji || '💰'
                };
                incomeCategories.push(newCat);
                api.put('/income-categories', incomeCategories);
                loadIncomeCategories();
                setTimeout(() => {
                    categorySelect.value = newCategory.trim();
                }, 100);
            } else {
                categorySelect.value = '';
            }
        }
    }, { once: true });
}

async function loadConfig() {
    config = await api.get('/config');
    
    const receivedBySelect = document.getElementById('receivedBy');
    const editReceivedBySelect = document.getElementById('editReceivedBy');
    const currentUser = getCurrentUser();
    
    receivedBySelect.innerHTML = '<option value="">Selecciona...</option>';
    editReceivedBySelect.innerHTML = '';
    
    config.persons.forEach(person => {
        const option1 = document.createElement('option');
        option1.value = person;
        option1.textContent = person;
        // Select current user by default
        if (person === currentUser) {
            option1.selected = true;
        }
        receivedBySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = person;
        option2.textContent = person;
        editReceivedBySelect.appendChild(option2);
    });
}

async function loadIncomes() {
    incomes = await api.get('/incomes');
}

function setupFormHandlers() {
    document.getElementById('incomeForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('btnReset').addEventListener('click', resetForm);
    document.getElementById('editForm').addEventListener('submit', handleEditFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const income = {
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount')),
        date: formData.get('date'),
        receivedBy: formData.get('receivedBy'),
        description: formData.get('description') || ''
    };
    
    // Check if month is closed
    const config = await api.get('/config');
    const incomeMonth = income.date.substring(0, 7);
    const closedMonths = config.closedMonths || [];
    if (closedMonths.includes(incomeMonth)) {
        showAlert(`No se pueden agregar ingresos en ${getMonthName(incomeMonth)} porque el mes está cerrado`, 'error');
        return;
    }
    
    try {
        const newIncome = await api.post('/incomes', income);
        incomes.push(newIncome);
        
        showAlert('¡Ingreso registrado exitosamente!', 'success');
        resetForm();
        displayRecentIncomes();
    } catch (error) {
        console.error('Error saving income:', error);
        showAlert(`Error al guardar el ingreso: ${error.message}`, 'error');
    }
}

function resetForm() {
    document.getElementById('incomeForm').reset();
    setTodayAsDefault('date');
}

function displayRecentIncomes() {
    const tbody = document.getElementById('recentIncomesBody');
    
    if (incomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay ingresos registrados aún</td></tr>';
        return;
    }
    
    const sortedIncomes = [...incomes].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    const recentIncomes = sortedIncomes.slice(0, 10);
    
    tbody.innerHTML = recentIncomes.map(income => `
        <tr>
            <td>${formatDate(income.date)}</td>
            <td><span class="badge badge-shared">${income.category}</span></td>
            <td><strong style="color: #10b981;">${formatCurrency(income.amount)}</strong></td>
            <td>${income.receivedBy}</td>
            <td>${income.description || '-'}</td>
            <td>
                <div class="flex gap-1">
                    <button class="btn btn-sm btn-primary" onclick="openEditModal('${income.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteIncome('${income.id}')">Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function openEditModal(incomeId) {
    const income = incomes.find(i => i.id === incomeId);
    if (!income) return;
    
    document.getElementById('editId').value = income.id;
    document.getElementById('editCategory').value = income.category;
    document.getElementById('editAmount').value = income.amount;
    document.getElementById('editDate').value = income.date;
    document.getElementById('editReceivedBy').value = income.receivedBy;
    document.getElementById('editDescription').value = income.description || '';
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    document.getElementById('editForm').reset();
}

async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const incomeId = formData.get('editId');
    
    const updatedIncome = {
        category: formData.get('editCategory'),
        amount: parseFloat(formData.get('editAmount')),
        date: formData.get('editDate'),
        receivedBy: formData.get('editReceivedBy'),
        description: formData.get('editDescription') || ''
    };
    
    try {
        await api.put(`/incomes/${incomeId}`, updatedIncome);
        
        const index = incomes.findIndex(i => i.id === incomeId);
        if (index !== -1) {
            incomes[index] = { ...incomes[index], ...updatedIncome };
        }
        
        showAlert('Ingreso actualizado exitosamente', 'success');
        closeEditModal();
        displayRecentIncomes();
    } catch (error) {
        console.error('Error updating income:', error);
        showAlert(`Error al actualizar el ingreso: ${error.message}`, 'error');
    }
}

async function deleteIncome(incomeId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
        return;
    }

    try {
        // Find income to get its month
        const income = incomes.find(i => i.id === incomeId);
        if (!income) {
            showAlert('Ingreso no encontrado', 'error');
            return;
        }
        const month = income.date.substring(0, 7);

        await api.delete(`/incomes/${incomeId}?month=${month}`);
        incomes = incomes.filter(i => i.id !== incomeId);

        showAlert('Ingreso eliminado exitosamente', 'success');
        displayRecentIncomes();
    } catch (error) {
        console.error('Error deleting income:', error);
        showAlert(`Error al eliminar el ingreso: ${error.message}`, 'error');
    }
}

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
