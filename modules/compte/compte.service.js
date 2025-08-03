// ========================================
// COMPTE.SERVICE.JS - Service métier compte
// Chemin: modules/compte/compte.service.js
//
// DESCRIPTION:
// Service de gestion du compte utilisateur
// Récupération des données, calcul permissions, modification PIN
// ========================================

import { db } from '../../src/services/firebase.service.js';

export class CompteService {
    
    /**
     * Récupérer les données complètes d'un utilisateur
     */
    static async getUtilisateurComplet(userId) {
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const userDoc = await getDoc(doc(db, 'utilisateurs', userId));
            
            if (userDoc.exists()) {
                return { id: userDoc.id, ...userDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération utilisateur:', error);
            return null;
        }
    }
    
    /**
     * Récupérer les groupes d'un utilisateur
     */
    static async getGroupesUtilisateur(groupeIds) {
        if (!groupeIds || groupeIds.length === 0) return [];
        
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const groupes = [];
            
            for (const groupeId of groupeIds) {
                const groupeDoc = await getDoc(doc(db, 'groupes', groupeId));
                if (groupeDoc.exists()) {
                    groupes.push({ id: groupeDoc.id, ...groupeDoc.data() });
                }
            }
            
            return groupes;
            
        } catch (error) {
            console.error('❌ Erreur récupération groupes:', error);
            return [];
        }
    }
    
    /**
     * Calculer les permissions effectives d'un utilisateur
     */
    static async calculerPermissions(utilisateur, groupes, magasinActuel) {
        const permissions = {
            pages: {},
            fonctionnalites: {}
        };
        
        // 1. Agréger les permissions des groupes
        for (const groupe of groupes) {
            if (groupe.permissions) {
                // Pages
                if (groupe.permissions.pages) {
                    for (const [page, perms] of Object.entries(groupe.permissions.pages)) {
                        if (!permissions.pages[page]) {
                            permissions.pages[page] = {};
                        }
                        Object.assign(permissions.pages[page], perms);
                    }
                }
                
                // Fonctionnalités
                if (groupe.permissions.fonctionnalites) {
                    Object.assign(permissions.fonctionnalites, groupe.permissions.fonctionnalites);
                }
            }
        }
        
        // 2. Appliquer les permissions directes (override)
        if (utilisateur.permissionsDirectes) {
            if (utilisateur.permissionsDirectes.pages) {
                for (const [page, perms] of Object.entries(utilisateur.permissionsDirectes.pages)) {
                    if (!permissions.pages[page]) {
                        permissions.pages[page] = {};
                    }
                    Object.assign(permissions.pages[page], perms);
                }
            }
            
            if (utilisateur.permissionsDirectes.fonctionnalites) {
                Object.assign(permissions.fonctionnalites, utilisateur.permissionsDirectes.fonctionnalites);
            }
        }
        
        // 3. Appliquer les restrictions du magasin actuel
        if (utilisateur.autorisations?.[magasinActuel]) {
            const autoMagasin = utilisateur.autorisations[magasinActuel];
            permissions.delegation = {
                responsable: autoMagasin.responsable || false,
                permissions: autoMagasin.permissions || []
            };
        }
        
        return permissions;
    }
    
    /**
     * Récupérer les magasins autorisés avec leurs infos
     */
    static async getMagasinsAutorises(utilisateur) {
        if (!utilisateur.autorisations) return [];
        
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const magasins = [];
            
            for (const [codeMagasin, autorisation] of Object.entries(utilisateur.autorisations)) {
                if (autorisation.acces) {
                    // Récupérer les infos du magasin
                    const magasinDoc = await getDoc(doc(db, 'magasins', codeMagasin));
                    
                    const magasinData = magasinDoc.exists() ? magasinDoc.data() : {};
                    
                    magasins.push({
                        code: codeMagasin,
                        nom: magasinData.nom || codeMagasin,
                        societe: magasinData.societe || {},
                        responsable: autorisation.responsable || false,
                        permissions: autorisation.permissions || []
                    });
                }
            }
            
            return magasins;
            
        } catch (error) {
            console.error('❌ Erreur récupération magasins:', error);
            return [];
        }
    }
    
    /**
     * Vérifier un code PIN
     */
    static async verifierPin(userId, pin) {
        try {
            const { verifierCodePinUtilisateur } = await import(
                '../../src/services/firebase.service.js'
            );
            
            return await verifierCodePinUtilisateur(userId, pin);
            
        } catch (error) {
            console.error('❌ Erreur vérification PIN:', error);
            return false;
        }
    }
    
    /**
     * Modifier le code PIN
     */
    static async modifierPin(userId, nouveauPin) {
        try {
            const { doc, updateDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Hash du nouveau PIN
            const encoder = new TextEncoder();
            const data = encoder.encode(nouveauPin);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            // Mettre à jour
            await updateDoc(doc(db, 'utilisateurs', userId), {
                codeHash: hashHex,
                lastPasswordChange: serverTimestamp()
            });
            
            console.log('✅ Code PIN modifié avec succès');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification PIN:', error);
            throw error;
        }
    }
}