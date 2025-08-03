// ========================================
// DECOMPTE-MUTUELLE.FIRESTORE.SERVICE.JS - Gestion Firestore des décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.firestore.service.js
//
// DESCRIPTION:
// Service de gestion des décomptes mutuelles dans Firestore
// Création, lecture, mise à jour des enregistrements
//
// FONCTIONS PUBLIQUES:
// - creerDecompte(data) : Créer un nouveau décompte
// - getDecomptes(filtres) : Récupérer les décomptes avec filtres
// - getDecompteById(id) : Récupérer un décompte par ID
// - updateStatut(id, statut) : Mettre à jour le statut
// - ajouterDonneesExtraites(id, donnees) : Ajouter les données IA
// - genererNumeroDecompte() : Générer un numéro unique
//
// STRUCTURE COLLECTION:
// Collection: decomptes_mutuelles
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { DECOMPTE_TEMPLATE } from '../../src/templates/index.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'decomptes_mutuelles';
const STATUTS = {
    NOUVEAU: 'nouveau',
    EN_COURS: 'en_cours_traitement',
    TRAITE: 'traitement_effectue',
    VALIDE: 'valide',
    ERREUR: 'erreur_traitement'
};

// ========================================
// CRÉATION
// ========================================

/**
 * Créer un nouveau décompte
 * @param {Object} data - Données du décompte
 * @returns {Promise<string>} ID du décompte créé
 */
export async function creerDecompte(data) {
    try {
        const { collection, addDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Générer le numéro de décompte
        const numeroDecompte = await genererNumeroDecompte();
        
        // Récupérer les infos utilisateur
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        // DEBUG - À ENLEVER APRÈS
        console.log('🔍 DEBUG Auth:', auth);
        console.log('🔍 DEBUG raisonSociale dans auth:', auth.raisonSociale);
        console.log('🔍 DEBUG magasin:', auth.magasin);
        
        // Cloner le template pour garantir la structure
        const decompteData = JSON.parse(JSON.stringify(DECOMPTE_TEMPLATE));
        
        // Remplir les données du template
        // Identification
        decompteData.numeroDecompte = numeroDecompte;
        decompteData.typeDecompte = null;  // Sera déterminé par l'IA
        
        // Organisation - Récupérer la raison sociale dynamiquement
        if (!auth.raisonSociale && auth.magasin) {
            // Ancienne connexion, on charge la raison sociale
            try {
                const { chargerMagasins } = await import('../../src/services/firebase.service.js');
                const magasins = await chargerMagasins();
                const magasinUser = Object.values(magasins).find(m => m.code === auth.magasin);
                decompteData.societe = magasinUser?.societe?.raisonSociale || 'NON DEFINI';
            } catch (error) {
                decompteData.societe = 'NON DEFINI';
            }
        } else {
            // Nouvelle connexion avec raisonSociale
            decompteData.societe = auth.raisonSociale || 'NON DEFINI';
        }
        decompteData.codeMagasin = auth.magasin || 'XXX';
        decompteData.magasinUploadeur = auth.magasin || 'XXX';
        
        // Documents uploadés
        decompteData.documents = data.documents || [];
        
        // Dates - utiliser serverTimestamp pour la création
        decompteData.dates.creation = serverTimestamp();
        
        // Intervenants
        decompteData.intervenants.creePar = {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien'
        };
        
        // Historique initial (version complexe comme les anciens)
        decompteData.historique = [{
            date: new Date(),
            action: 'creation',
            details: `${data.documents.length} document(s) uploadé(s)`,
            timestamp: Date.now(),
            utilisateur: {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            }
        }];
        
        // Statut initial
        decompteData.statut = STATUTS.NOUVEAU;
        
        // Créer dans Firestore
        const docRef = await addDoc(collection(db, COLLECTION_NAME), decompteData);
        
        console.log('✅ Décompte créé avec template:', numeroDecompte, 'ID:', docRef.id);
        console.log('📋 Structure complète:', decompteData);
        
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Erreur création décompte:', error);
        throw new Error(`Erreur lors de la création: ${error.message}`);
    }
}

// ========================================
// LECTURE
// ========================================

/**
 * Récupérer les décomptes avec filtres
 * @param {Object} filtres - Filtres à appliquer
 * @returns {Promise<Array>} Liste des décomptes
 */
export async function getDecomptes(filtres = {}) {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        let q = collection(db, COLLECTION_NAME);
        
        // Construire la requête avec les filtres
        const constraints = [];
        
        if (filtres.societe) {
            constraints.push(where('societe', '==', filtres.societe));
        }
        
        if (filtres.statut) {
            constraints.push(where('statut', '==', filtres.statut));
        }
        
        if (filtres.magasin) {
            constraints.push(where('codeMagasin', '==', filtres.magasin));
        }
        
        if (filtres.mutuelle) {
            constraints.push(where('mutuelle', '==', filtres.mutuelle));
        }
        
        // Tri par défaut : plus récent en premier
        constraints.push(orderBy('dates.creation', 'desc'));
        
        if (filtres.limite) {
            constraints.push(limit(filtres.limite));
        }
        
        // Appliquer les contraintes
        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }
        
        // Exécuter la requête
        const snapshot = await getDocs(q);
        
        const decomptes = [];
        snapshot.forEach((doc) => {
            decomptes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📊 ${decomptes.length} décomptes trouvés`);
        return decomptes;
        
    } catch (error) {
        console.error('❌ Erreur récupération décomptes:', error);
        return [];
    }
}

/**
 * Récupérer un décompte par ID
 * @param {string} id - ID du décompte
 * @returns {Promise<Object|null>} Le décompte ou null
 */
export async function getDecompteById(id) {
    try {
        const { doc, getDoc } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Erreur récupération décompte:', error);
        return null;
    }
}

// ========================================
// MISE À JOUR
// ========================================

/**
 * Mettre à jour le statut d'un décompte
 * @param {string} id - ID du décompte
 * @param {string} nouveauStatut - Nouveau statut
 */
export async function updateStatut(id, nouveauStatut) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        const updates = {
            statut: nouveauStatut,
            'dates.transmissionIA': nouveauStatut === STATUTS.EN_COURS ? serverTimestamp() : null,
            'dates.traitementEffectue': nouveauStatut === STATUTS.TRAITE ? serverTimestamp() : null,
            historique: await ajouterHistorique(id, {
                action: 'changement_statut',
                details: `Statut changé en: ${nouveauStatut}`
            })
        };
        
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        
        console.log('✅ Statut mis à jour:', nouveauStatut);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        throw error;
    }
}

/**
 * Ajouter les données extraites par l'IA
 * @param {string} id - ID du décompte
 * @param {Object} donnees - Données extraites
 */
export async function ajouterDonneesExtraites(id, donnees) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const updates = {
            // Client - structure complète conforme au template
            client: {
                id: donnees.client?.id || null,
                nom: donnees.client?.nom || null,
                prenom: donnees.client?.prenom || null,
                numeroSecuriteSociale: donnees.client?.numeroSecuriteSociale || null
            },
            
            // Données financières
            mutuelle: donnees.mutuelle || null,
            montantRemboursementClient: donnees.montantRemboursementClient || 0,
            montantVirement: donnees.montantVirement || 0,
            nombreClients: donnees.nombreClients || 1,
            
            // Magasin concerné (déterminé par l'IA)
            codeMagasin: donnees.magasinConcerne || donnees.codeMagasin,
            
            // Prestataire TP si identifié
            prestataireTP: donnees.prestataireTP || null,
            
            // Mise à jour des dates
            'dates.transmissionIA': serverTimestamp(),
            'dates.traitementEffectue': serverTimestamp(),
            
            // Type de décompte (important de l'ajouter ici)
            typeDecompte: donnees.typeDecompte || 'individuel',
            
            // Références de virement
            virementId: donnees.virementId || null,
            dateVirement: donnees.dateVirement || null,
            
            // Mise à jour du statut
            statut: STATUTS.TRAITE,
            
            // Intervenant qui a traité
            'intervenants.traitePar': {
                id: 'system_ia',
                nom: 'SYSTEM',
                prenom: 'IA',
                role: 'system'
            },
            
            // Ajouter à l'historique
            historique: await ajouterHistorique(id, {
                action: 'extraction_ia',
                details: 'Données extraites avec succès',
                donnees: donnees
            })
        };
        
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        
        console.log('✅ Données extraites ajoutées avec template');
        
    } catch (error) {
        console.error('❌ Erreur ajout données:', error);
        throw error;
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Générer un numéro de décompte unique
 * Format: DEC-AAAAMMJJ-XXXX
 */
async function genererNumeroDecompte() {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const prefix = `DEC-${dateStr}`;
        
        // Chercher le dernier numéro du jour
        const q = query(
            collection(db, COLLECTION_NAME),
            where('numeroDecompte', '>=', `${prefix}-0000`),
            where('numeroDecompte', '<=', `${prefix}-9999`),
            orderBy('numeroDecompte', 'desc'),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        let nextNumber = 1;
        if (!snapshot.empty) {
            const lastDoc = snapshot.docs[0].data();
            const lastNumber = parseInt(lastDoc.numeroDecompte.split('-')[2]);
            nextNumber = lastNumber + 1;
        }
        
        return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
        
    } catch (error) {
        console.error('⚠️ Erreur génération numéro, fallback:', error);
        // Fallback avec timestamp
        return `DEC-${Date.now()}`;
    }
}

/**
 * Ajouter une entrée à l'historique
 */
async function ajouterHistorique(id, nouvelleEntree) {
    try {
        const { serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const decompte = await getDecompteById(id);
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        const historique = decompte?.historique || [];
        
        // Format complexe comme les anciens décomptes
        historique.push({
            date: new Date(),  // Date normale (sera convertie en Timestamp)
            action: nouvelleEntree.action,
            details: nouvelleEntree.details,
            timestamp: Date.now(),  // Milliseconds pour compatibilité
            utilisateur: {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            }
        });
        
        return historique;
        
    } catch (error) {
        console.error('⚠️ Erreur ajout historique:', error);
        return [];
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    creerDecompte,
    getDecomptes,
    getDecompteById,
    updateStatut,
    ajouterDonneesExtraites,
    STATUTS
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Service complet CRUD Firestore
   - Génération numéro séquentiel
   - Gestion historique et statuts
   
   NOTES POUR REPRISES FUTURES:
   - Le numéro est généré automatiquement
   - L'historique trace toutes les actions
   - Les données IA sont ajoutées plus tard
   ======================================== */