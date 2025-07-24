// src/js/services/auth.service.js
import { APP_CONFIG, getStorageKey } from '../config/app.config.js';

class AuthService {
    constructor() {
        this.attempts = 0;
        this.maxAttempts = APP_CONFIG.validation.maxLoginAttempts;
        this.lockoutDuration = APP_CONFIG.validation.lockoutDuration;
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     * @returns {boolean}
     */
    isAuthenticated() {
        const authKey = getStorageKey('auth');
        const auth = localStorage.getItem(authKey);
        
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            // Vérifier l'expiration
            if (now - authData.timestamp > authData.expiry) {
                this.logout();
                return false;
            }
            
            return authData.authenticated === true;
        } catch (error) {
            console.error('Erreur parsing auth:', error);
            return false;
        }
    }

    /**
     * Obtient les informations de l'utilisateur connecté
     * @returns {Object|null}
     */
    getCurrentUser() {
        const authKey = getStorageKey('auth');
        const auth = localStorage.getItem(authKey);
        
        if (!auth) return null;
        
        try {
            const authData = JSON.parse(auth);
            return {
                magasin: authData.magasin,
                timestamp: authData.timestamp,
                expiry: authData.expiry
            };
        } catch (error) {
            console.error('Erreur parsing user:', error);
            return null;
        }
    }

    /**
     * Connexion avec code magasin et PIN
     * @param {string} storeCode - Code du magasin
     * @param {string} pin - Code PIN à 4 chiffres
     * @param {boolean} remember - Se souvenir de la connexion
     * @returns {Object} Résultat de la connexion
     */
    login(storeCode, pin, remember = false) {
        // Vérifier le lockout
        if (this.isLockedOut()) {
            return {
                success: false,
                error: 'Trop de tentatives. Veuillez attendre.',
                locked: true
            };
        }

        // Vérifier le format du PIN
        if (!pin || pin.length !== APP_CONFIG.validation.pinLength) {
            return {
                success: false,
                error: 'Code PIN invalide (4 chiffres requis)'
            };
        }

        // Vérifier le magasin
        const store = APP_CONFIG.stores[storeCode];
        if (!store) {
            return {
                success: false,
                error: 'Magasin non trouvé'
            };
        }

        // Vérifier le code PIN
        if (store.code !== pin) {
            this.attempts++;
            this.setLockout();
            
            const remaining = this.maxAttempts - this.attempts;
            return {
                success: false,
                error: `Code incorrect. ${remaining} tentatives restantes.`,
                attemptsRemaining: remaining
            };
        }

        // Connexion réussie
        this.resetAttempts();
        
        const expiry = remember 
            ? APP_CONFIG.storage.authExpiry.remember 
            : APP_CONFIG.storage.authExpiry.default;

        const authData = {
            authenticated: true,
            magasin: storeCode,
            timestamp: Date.now(),
            expiry: expiry
        };

        const authKey = getStorageKey('auth');
        localStorage.setItem(authKey, JSON.stringify(authData));

        return {
            success: true,
            user: {
                magasin: storeCode
            }
        };
    }

    /**
     * Déconnexion
     */
    logout() {
        const authKey = getStorageKey('auth');
        localStorage.removeItem(authKey);
        
        // Optionnel : nettoyer d'autres données
        const interventionKey = getStorageKey('intervention');
        localStorage.removeItem(interventionKey);
    }

    /**
     * Vérifie si l'utilisateur est en lockout
     * @returns {boolean}
     */
    isLockedOut() {
        const lockoutKey = getStorageKey('lockout');
        const lockout = localStorage.getItem(lockoutKey);
        
        if (!lockout) return false;
        
        const lockoutTime = parseInt(lockout);
        const now = Date.now();
        
        if (now - lockoutTime < this.lockoutDuration) {
            return true;
        }
        
        // Le lockout a expiré
        localStorage.removeItem(lockoutKey);
        this.resetAttempts();
        return false;
    }

    /**
     * Définit le lockout après trop de tentatives
     */
    setLockout() {
        if (this.attempts >= this.maxAttempts) {
            const lockoutKey = getStorageKey('lockout');
            localStorage.setItem(lockoutKey, Date.now().toString());
        }
    }

    /**
     * Réinitialise le compteur de tentatives
     */
    resetAttempts() {
        this.attempts = 0;
        const lockoutKey = getStorageKey('lockout');
        localStorage.removeItem(lockoutKey);
    }

    /**
     * Vérifie l'authentification et redirige si nécessaire
     * @param {string} currentPage - Page actuelle
     */
    checkAuthAndRedirect(currentPage = null) {
        // Ne pas vérifier sur la page de login
        if (currentPage === 'index.html' || window.location.pathname.includes('index.html')) {
            return;
        }

        if (!this.isAuthenticated()) {
            window.location.href = APP_CONFIG.urls.login;
        }
    }

    /**
     * Obtient le temps restant de lockout en secondes
     * @returns {number}
     */
    getLockoutRemaining() {
        const lockoutKey = getStorageKey('lockout');
        const lockout = localStorage.getItem(lockoutKey);
        
        if (!lockout) return 0;
        
        const lockoutTime = parseInt(lockout);
        const now = Date.now();
        const remaining = this.lockoutDuration - (now - lockoutTime);
        
        return Math.max(0, Math.ceil(remaining / 1000));
    }
}

// Export singleton
export const authService = new AuthService();

// Export de la classe pour les tests
export default AuthService;