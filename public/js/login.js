let config = {};
let selectedUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    const session = getSession();
    if (session && session.user) {
        window.location.href = '/';
        return;
    }

    try {
        config = await api.get('/config');
        displayUserButtons();
        setupPinInput();
        setupEventHandlers();
    } catch (error) {
        console.error('Error loading config:', error);
        showAlert('Error al cargar la configuración', 'error');
    }
});

function displayUserButtons() {
    const container = document.getElementById('userButtons');
    
    container.innerHTML = config.persons.map(person => `
        <button type="button" class="user-btn" data-user="${person}">
            <span class="user-icon">👤</span>
            <span>${person}</span>
        </button>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedUser = btn.dataset.user;
            document.querySelectorAll('.user-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('pin1').focus();
        });
    });
}

function setupPinInput() {
    const inputs = document.querySelectorAll('.pin-digit');
    
    inputs.forEach((input, index) => {
        // Auto-focus next input
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        
        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Only allow numbers
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

function setupEventHandlers() {
    document.getElementById('pinForm').addEventListener('submit', handlePinSubmit);
    document.getElementById('btnMasterPin').addEventListener('click', handleMasterPin);
}

async function handlePinSubmit(e) {
    e.preventDefault();
    
    if (!selectedUser) {
        showAlert('Por favor selecciona un usuario', 'error');
        return;
    }
    
    const pin = getPinValue();
    
    if (pin.length !== 4) {
        showAlert('Ingresa un PIN de 4 dígitos', 'error');
        return;
    }
    
    // Validate PIN
    const userPins = config.userPins || {};
    const storedPin = userPins[selectedUser];
    
    if (!storedPin) {
        // First time setup - save this PIN
        if (!config.userPins) {
            config.userPins = {};
        }
        config.userPins[selectedUser] = pin;
        
        try {
            await api.put('/config', config);
            createSession(selectedUser);
            showAlert('PIN configurado exitosamente', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            console.error('Error saving PIN:', error);
            showAlert('Error al guardar el PIN', 'error');
        }
    } else if (storedPin === pin) {
        // Correct PIN
        createSession(selectedUser);
        window.location.href = '/';
    } else {
        // Wrong PIN
        showAlert('PIN incorrecto', 'error');
        clearPinInputs();
    }
}

async function handleMasterPin() {
    const pin = prompt('Ingresa el PIN Maestro:');
    
    if (!pin) return;
    
    const masterPin = config.masterPin || '0000';
    
    if (pin === masterPin) {
        // Show admin panel
        const user = config.persons[0]; // Default to first user
        createSession(user, true);
        window.location.href = '/settings.html';
    } else {
        showAlert('PIN Maestro incorrecto', 'error');
    }
}

function getPinValue() {
    const pin1 = document.getElementById('pin1').value;
    const pin2 = document.getElementById('pin2').value;
    const pin3 = document.getElementById('pin3').value;
    const pin4 = document.getElementById('pin4').value;
    return pin1 + pin2 + pin3 + pin4;
}

function clearPinInputs() {
    document.querySelectorAll('.pin-digit').forEach(input => {
        input.value = '';
    });
    document.getElementById('pin1').focus();
}

function createSession(user, isMaster = false) {
    const session = {
        user: user,
        isMaster: isMaster,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('expense_tracker_session', JSON.stringify(session));
}

function getSession() {
    const sessionData = localStorage.getItem('expense_tracker_session');
    return sessionData ? JSON.parse(sessionData) : null;
}
