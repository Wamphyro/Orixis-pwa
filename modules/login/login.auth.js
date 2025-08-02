// ========================================
// LOGIN.AUTH.JS - Logique d'authentification
// Chemin: modules/login/login.auth.js
// ========================================

import { 
    verifierCodePinUtilisateur, 
    getUtilisateurDetails,
    db 
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
            clearAuth();
            return false;
        }
        
        return authData.authenticated === true;
    } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        clearAuth();
        return false;
    }
}

// ========================================
// AUTHENTIFICATION
// ========================================

export async function authenticateUser(userId, pin) {
    try {
        console.log('🔐 Vérification du code PIN...');
        return await verifierCodePinUtilisateur(userId, pin);
    } catch (error) {
        console.error('❌ Erreur vérification PIN:', error);
        throw error;
    }
}

// ========================================
// SAUVEGARDE AUTHENTIFICATION
// ========================================

export async function saveAuthentication(userData, remember = false) {
    try {
        const expiry = remember 
            ? config.LOGIN_CONFIG.rememberDays * 24 * 60 * 60 * 1000 
            : 24 * 60 * 60 * 1000;
        
        const magasin = userData.magasinParDefaut || 
                       userData.magasins?.[0] || 
                       'NON_DEFINI';
        
        // Récupérer la société et la raison sociale depuis le magasin
        let societe = 'XXX'; // Code par défaut
        let raisonSociale = 'BROKER AUDIOLOGIE'; // Raison sociale par défaut
        
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const magasinDoc = await getDoc(doc(db, 'magasins', magasin));
            if (magasinDoc.exists()) {
                const magasinData = magasinDoc.data();
                societe = magasinData.societe?.code || 'XXX';
                raisonSociale = magasinData.societe?.raisonSociale || 'BROKER AUDIOLOGIE';
            }
        } catch (error) {
            console.warn('⚠️ Impossible de récupérer la société:', error);
        }
        
        const authData = {
            authenticated: true,
            timestamp: Date.now(),
            expiry: expiry,
            magasin: magasin,
            magasins: userData.magasins || [],
            societe: societe,  // Code société
            raisonSociale: raisonSociale,  // Nom complet société
            collaborateur: {
                id: userData.id,
                prenom: userData.prenom,
                nom: userData.nom,
                role: userData.role || 'technicien',
                magasin: magasin
            }
        };
        
        localStorage.setItem('sav_auth', JSON.stringify(authData));
        
        // Permissions
        if (userData.permissions || userData.autorisations) {
            localStorage.setItem('sav_user_permissions', JSON.stringify({
                id: userData.id,
                nom: userData.nom,
                prenom: userData.prenom,
                role: userData.role || 'technicien',
                pagesInterdites: userData.pagesInterdites || [],
                autorisations: userData.autorisations || {}
            }));
        }
        
        console.log('✅ Authentification sauvegardée');
    } catch (error) {
        console.error('❌ Erreur sauvegarde auth:', error);
        throw error;
    }
}

// ========================================
// NETTOYAGE
// ========================================

export function clearAuth() {
    localStorage.removeItem('sav_auth');
    localStorage.removeItem('sav_user_permissions');
}