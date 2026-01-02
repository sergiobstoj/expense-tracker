// Authentication utilities
function getSession() {
    const sessionData = localStorage.getItem('expense_tracker_session');
    return sessionData ? JSON.parse(sessionData) : null;
}

function requireAuth() {
    const session = getSession();
    if (!session || !session.user) {
        window.location.href = '/login.html';
        return null;
    }
    return session;
}

function logout() {
    localStorage.removeItem('expense_tracker_session');
    window.location.href = '/login.html';
}

function getCurrentUser() {
    const session = getSession();
    return session ? session.user : null;
}

function isMasterSession() {
    const session = getSession();
    return session && session.isMaster === true;
}

// Check auth on page load
if (window.location.pathname !== '/login.html') {
    document.addEventListener('DOMContentLoaded', () => {
        const session = requireAuth();
        if (session) {
            // Add logout button to navbar if not exists
            addLogoutButton(session);
        }
    });
}

function addLogoutButton(session) {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('logoutBtn')) {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" id="logoutBtn" style="color: #ef4444;">
                ${session.user} | Salir
            </a>
        `;
        navLinks.appendChild(li);
        
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Cerrar sesión?')) {
                logout();
            }
        });
    }
}
