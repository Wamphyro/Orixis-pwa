// Fonction universelle pour enregistrer le service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Déterminer le bon chemin selon la page
        let swPath = './sw.js';
        
        // Si on est dans le dossier pages/
        if (window.location.pathname.includes('/pages/')) {
            swPath = '../sw.js';
        }
        
        navigator.serviceWorker.register(swPath)
            .then(registration => {
                console.log('✅ Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.warn('⚠️ Service Worker non enregistré:', error);
                // Pas grave, l'app fonctionne quand même
            });
    }
}

// Enregistrer au chargement
window.addEventListener('load', registerServiceWorker);
