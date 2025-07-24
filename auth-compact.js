// Fichier de compatibilité temporaire pour la migration
// À supprimer une fois tous les fichiers migrés

import { AuthService } from './src/js/services/auth.service.js';
import { APP_CONFIG } from './src/js/config/app.config.js';

// Rendre les anciennes fonctions disponibles globalement
window.checkAuth = () => AuthService.isAuthenticated();
window.logout = () => AuthService.logout();

// Rendre MAGASINS disponible globalement (pour l'ancien code)
window.MAGASINS = APP_CONFIG.magasins;

// Vérifier l'authentification au chargement
window.addEventListener('load', () => {
    AuthService.checkAuthAndRedirect();
});