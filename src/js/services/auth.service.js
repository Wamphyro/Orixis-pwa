import { APP_CONFIG, getMagasinInfo } from '../config/app.config.js';
import { StorageService } from './storage.service.js';

export class AuthService {
    /**
     * Connexion d'un utilisateur
     * @param {string} magasinCode - Code du magasin
     * @param {string} pin - Code PIN à 4 chiffres
     * @param {boolean} remember - Se souvenir de la connexion
     * @returns {object} { success: boolean, message: string }
     */
    static login(magasinCode, pin, remember = false) {
        const magasin = getMagasinInfo(magasinCode);
        
        if (!magasin) {
            return { success: false, message: 'Magasin invalide' };
        }
        
        if (magasin.code !== pin) {
            return { success: false, message: 'Code incorrect' };
        }
        
        // Connexion réussie
        const sessionDuration = remember 
            ? APP_CONFIG.session.rememberDuration 
            : APP_CONFIG.session.defaultDuration;
        
        const authData = {
            authenticated: true,
            magasin: magasinCode,
            timestamp: Date.now(),
            expiry: sessionDuration
        };
        
        StorageService.save(APP_CONFIG.storageKeys.auth, authData);
        
        return { success: true, message: 'Connexion réussie' };
    }
    
    /**
     * Déconnexion
     */
    static logout() {
        StorageService.remove(APP_CONFIG.storageKeys.auth);
        window.location.href = '/index.html';
    }
    
    /**
     * Vérification de l'authentification
     * @returns {boolean}
     */
    static isAuthenticated() {
        const authData = StorageService.get(APP_CONFIG.storageKeys.auth);
        
        if (!authData) {
            return false;
        }
        
        const now = Date.now();
        
        // Vérifier l'expiration
        if (now - authData.timestamp > authData.expiry) {
            StorageService.remove(APP_CONFIG.storageKeys.auth);
            return false;
        }
        
        return authData.authenticated === true;
    }
    
    /**
     * Obtenir les informations de l'utilisateur connecté
     * @returns {object|null}
     */
    static getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }
        
        const authData = StorageService.get(APP_CONFIG.storageKeys.auth);
        return {
            magasin: authData.magasin,
            connectedSince: new Date(authData.timestamp)
        };
    }
    
    /**
     * Vérifier l'authentification et rediriger si nécessaire
     */
    static checkAuthAndRedirect() {
        const currentPath = window.location.pathname;
        const isIndexPage = currentPath === '/' || currentPath.includes('index.html');
        
        if (!isIndexPage && !this.isAuthenticated()) {
            window.location.href = '/index.html';
        }
    }
}