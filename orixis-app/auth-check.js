// auth-check.js - Vérification d'authentification
function checkAuth() {
    const auth = localStorage.getItem('sav_auth');
    if (!auth) return false;
    
    const authData = JSON.parse(auth);
    const now = Date.now();
    
    if (now - authData.timestamp > authData.expiry) {
        localStorage.removeItem('sav_auth');
        return false;
    }
    
    return authData.authenticated;
}

function logout() {
    localStorage.removeItem('sav_auth');
    window.location.href = 'index.html';
}

window.addEventListener('load', () => {
    if (window.location.pathname.includes('index.html')) return;
    if (!checkAuth()) {
        window.location.href = 'index.html';
    }
});
