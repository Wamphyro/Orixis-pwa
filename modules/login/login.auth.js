// ========================================
// LOGIN.AUTH.JS - Logique d'authentification
// Chemin: modules/login/login.auth.js
//
// DESCRIPTION:
// Gère la vérification des codes PIN et l'authentification
// ========================================

import { 
    verifierCodePinUtilisateur, 
    getUtilisateurDetails 
} from '../../src/services/firebase.service.js';
import config from './login.config.js';

// ========================================
// VÉRIFICATION AUTH EXISTANTE
// ========================================

export function checkExistingAuth() {
    const auth = localStorage.getItem('sav_auth');
    if (!auth) return false;
    
    try {
        const authData = JSON.parse(auth);
        const now = Date.now();
        
        // Vérifier l'expiration
        if (now - authData.timestamp > authData.expiry) {
            localStorage.removeItem('sav_auth');
            localStorage.removeItem('sav_user_permissions');
            return false;
        }
        
        return authData.authenticated === true;
    } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        return false;
    }
}

// ========================================
// AUTHENTIFICATION
// ========================================

export async function authenticateUser(userId, pin) {
    try {
        console.log('🔐 Vérification du code PIN...');
        
        // Vérifier le code PIN
        const isValid = await verifierCodePinUtilisateur(userId, pin);
        
        console.log('🔐 Résultat vérification:', isValid);
        
        return isValid;
    } catch (error) {
        console.error('❌ Erreur vérification PIN:', error);
        throw error;
    }
}

// ========================================
// SAUVEGARDE AUTHENTIFICATION
// ========================================

export function saveAuthentication(userData, remember = false) {
    try {
        // Calculer l'expiration
        const expiry = remember 
            ? config.LOGIN_CONFIG.rememberDays * 24 * 60 * 60 * 1000 
            : 24 * 60 * 60 * 1000; // 24h par défaut
        
        // Déterminer le magasin
        const magasin = userData.magasinParDefaut || 
                       (userData.magasins && userData.magasins[0]) || 
                       'NON_DEFINI';
        
        // Créer l'objet auth
        const authData = {
            authenticated: true,
            timestamp: Date.now(),
            expiry: expiry,
            magasin: magasin,
            magasins: userData.magasins || [],
            collaborateur: {
                id: userData.id,
                prenom: userData.prenom,
                nom: userData.nom,
                role: userData.role || 'technicien',
                magasin: magasin
            }
        };
        
        // Sauvegarder
        localStorage.setItem('sav_auth', JSON.stringify(authData));
        
        // Sauvegarder les permissions si disponibles
        if (userData.permissions || userData.autorisations) {
            const permissions = {
                id: userData.id,
                nom: userData.nom,
                prenom: userData.prenom,
                role: userData.role || 'technicien',
                pagesInterdites: userData.pagesInterdites || [],
                autorisations: userData.autorisations || {}
            };
            localStorage.setItem('sav_user_permissions', JSON.stringify(permissions));
        }
        
        console.log('✅ Authentification sauvegardée:', authData);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde auth:', error);
        throw error;
    }
}

// ========================================
// DÉCONNEXION
// ========================================

export function logout() {
    localStorage.removeItem('sav_auth');
    localStorage.removeItem('sav_user_permissions');
    window.location.href = '/';
}