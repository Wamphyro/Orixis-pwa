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

// ========================================
// AUTHENTIFICATION
// ========================================

export async function authenticateUser(userId, pin) {
    try {
        // Vérifier le code PIN
        const isValid = await verifierCodePinUtilisateur(userId, pin);
        
        if (isValid) {
            // Récupérer les détails complets
            const userData = await getUtilisateurDetails(userId);
            
            return {
                success: true,
                userData: userData
            };
        } else {
            return {
                success: false,
                error: 'invalid_pin'
            };
        }
    } catch (error) {
        console.error('❌ Erreur vérification PIN:', error);
        throw error;
    }
}