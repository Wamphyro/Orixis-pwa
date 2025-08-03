// ========================================
// DECOMPTE-SECU.FIRESTORE.SERVICE.JS - 🗄️ ACCÈS BASE DE DONNÉES
// 
// RÔLE : Communication directe avec Firestore
// - CRUD des documents décomptes sécu
// - Génération des identifiants
// - Gestion de l'historique
// - Structure adaptée sécurité sociale
// ========================================

// ========================================
// DECOMPTE-SECU.FIRESTORE.SERVICE.JS - Gestion Firestore des décomptes
// Chemin: modules/decompte-secu/decompte-secu.firestore.service.js
//
// DESCRIPTION:
// Service de gestion des décomptes sécurité sociale dans Firestore
// Création, lecture, mise à jour des enregistrements
//
// FONCTIONS PUBLIQUES:
// - creerDecompteSecu(data) : Créer un nouveau décompte
// - getDecomptes(filtres) : Récupérer les décomptes avec filtres
// - getDecompteById(id) : Récupérer un décompte par ID
// - updateStatut(id, statut) : Mettre à jour le statut
// - ajouterDonneesExtraites(id, donnees) : Ajouter les données IA
// - genererNumeroDecompte() : Générer un numéro unique
//
// STRUCTURE COLLECTION:
// Collection: decomptes_secu
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { DECOMPTE_SECU_TEMPLATE } from '../../src/templates/index.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'decomptes_secu';
const STATUTS = {
    NOUVEAU: 'nouveau',
    TRAITEMENT_IA: 'traitement_ia',
    CONTROLE_TAUX: 'controle_taux',
    TRAITE: 'traitement_effectue',
    PAIEMENT: 'paiement_effectue',
    REJET: 'rejet',
    SUPPRIME: 'supprime'
};

// ========================================
// CRÉATION
// ========================================

/**
 * Créer un nouveau décompte sécurité sociale
 * @param {Object} data - Données du décompte
 * @returns {Promise<string>} ID du décompte créé
 */
export async function creerDecompteSecu(data) {
    try {
        const { collection, addDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Générer le numéro de décompte
        const numeroDecompte = await genererNumeroDecompte();
        
        // Récupérer les infos utilisateur
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        // DEBUG
        console.log('🔍 DEBUG Auth:', auth);
        console.log('🔍 DEBUG raisonSociale dans auth:', auth.raisonSociale);
        console.log('🔍 DEBUG magasin:', auth.magasin);
        
        // Cloner le template pour garantir la structure
        const decompteData = JSON.parse(JSON.stringify(DECOMPTE_SECU_TEMPLATE));
        
        // Remplir les données du template
        // Identification
        decompteData.numeroDecompte = numeroDecompte;
        
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
        
        // Historique initial
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
        
        console.log('✅ Décompte sécu créé avec template:', numeroDecompte, 'ID:', docRef.id);
        console.log('📋 Structure complète:', decompteData);
        
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Erreur création décompte sécu:', error);
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
        
        if (filtres.caissePrimaire) {
            constraints.push(where('caissePrimaire', '==', filtres.caissePrimaire));
        }
        
        if (filtres.regime) {
            constraints.push(where('regime', '==', filtres.regime));
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
        
        console.log(`📊 ${decomptes.length} décomptes sécu trouvés`);
        return decomptes;
        
    } catch (error) {
        console.error('❌ Erreur récupération décomptes sécu:', error);
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
            'dates.transmissionIA': nouveauStatut === STATUTS.TRAITEMENT_IA ? serverTimestamp() : null,
            'dates.controleTaux': nouveauStatut === STATUTS.CONTROLE_TAUX ? serverTimestamp() : null,
            'dates.traitementEffectue': nouveauStatut === STATUTS.TRAITE ? serverTimestamp() : null,
            'dates.paiementEffectue': nouveauStatut === STATUTS.PAIEMENT ? serverTimestamp() : null,
            'dates.rejet': nouveauStatut === STATUTS.REJET ? serverTimestamp() : null,
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
            // Bénéficiaire - structure complète conforme au template
            beneficiaire: {
                id: donnees.beneficiaire?.id || null,
                nom: donnees.beneficiaire?.nom || null,
                prenom: donnees.beneficiaire?.prenom || null,
                numeroSecuriteSociale: donnees.beneficiaire?.numeroSecuriteSociale || null,
                numeroAffiliation: donnees.beneficiaire?.numeroAffiliation || null
            },
            
            // Données caisse et régime
            caissePrimaire: donnees.caissePrimaire || null,
            regime: donnees.regime || 'general',
            
            // Actes médicaux
            actesMedicaux: donnees.actesMedicaux || [],
            typeActePrincipal: donnees.typeActePrincipal || null,
            
            // Montants calculés
            montantTotalFacture: donnees.montantTotalFacture || 0,
            montantTotalBase: donnees.montantTotalBase || 0,
            montantTotalRembourse: donnees.montantTotalRembourse || 0,
            montantTotalParticipations: donnees.montantTotalParticipations || 0,
            montantTotalRembourseFinal: donnees.montantTotalRembourseFinal || 0,
            tauxMoyenRemboursement: donnees.tauxMoyenRemboursement || 0,
            
            // Contexte médical
            contexteMedical: {
                ald: donnees.contexteMedical?.ald || false,
                maternite: donnees.contexteMedical?.maternite || false,
                accidentTravail: donnees.contexteMedical?.accidentTravail || false,
                invalidite: donnees.contexteMedical?.invalidite || false
            },
            
            // Magasin concerné (déterminé par l'IA)
            codeMagasin: donnees.magasinConcerne || donnees.codeMagasin,
            
            // Références
            numeroFeuilleSoins: donnees.numeroFeuilleSoins || null,
            numeroAffiliation: donnees.numeroAffiliation || null,
            
            // Dates des soins
            datesSoins: donnees.datesSoins || [],
            
            // Mise à jour des dates
            'dates.transmissionIA': serverTimestamp(),
            
            // Mise à jour du statut
            statut: STATUTS.TRAITEMENT_IA,
            
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
        
        console.log('✅ Données sécu extraites ajoutées avec template');
        
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
 * Format: SECU-AAAAMMJJ-XXXX
 */
async function genererNumeroDecompte() {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const prefix = `SECU-${dateStr}`;
        
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
        return `SECU-${Date.now()}`;
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
            date: new Date(),
            action: nouvelleEntree.action,
            details: nouvelleEntree.details,
            timestamp: Date.now(),
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
// TEMPLATE STRUCTURE (pour référence)
// ========================================

export const DECOMPTE_SECU_STRUCTURE = {
    // Identification
    numeroDecompte: 'SECU-YYYYMMDD-XXXX',
    numeroFeuilleSoins: 'String ou null',
    
    // Organisation
    societe: 'ORIXIS SAS',
    codeMagasin: 'Code magasin',
    magasinUploadeur: 'Qui a uploadé',
    
    // Bénéficiaire
    beneficiaire: {
        id: 'String ou null',
        nom: 'String ou null',
        prenom: 'String ou null',
        numeroSecuriteSociale: '13 ou 15 chiffres',
        numeroAffiliation: 'String ou null'
    },
    
    // Caisse et régime
    caissePrimaire: 'CPAM PARIS',
    regime: 'general|rsi|msa|special',
    
    // Actes médicaux
    actesMedicaux: [{
        typeActe: 'consultation|pharmacie|analyses|etc',
        code: 'Code CCAM ou autre',
        libelle: 'Description',
        montantFacture: 0,
        baseRemboursement: 0,
        tauxRemboursement: 70,
        dateActe: 'Date'
    }],
    
    // Montants calculés
    montantTotalFacture: 0,
    montantTotalBase: 0,
    montantTotalRembourse: 0,
    montantTotalParticipations: 0,
    montantTotalRembourseFinal: 0,
    tauxMoyenRemboursement: 0,
    
    // Contexte médical
    contexteMedical: {
        ald: false,
        maternite: false,
        accidentTravail: false,
        invalidite: false
    },
    
    // Dates
    dates: {
        creation: 'Timestamp',
        transmissionIA: 'Timestamp ou null',
        controleTaux: 'Timestamp ou null',
        traitementEffectue: 'Timestamp ou null',
        paiementEffectue: 'Timestamp ou null',
        rejet: 'Timestamp ou null'
    },
    
    // Workflow
    statut: 'nouveau|traitement_ia|controle_taux|traitement_effectue|paiement_effectue|rejet|supprime',
    
    // Documents et historique
    documents: [],
    historique: []
};

// ========================================
// EXPORT
// ========================================

export default {
    creerDecompteSecu,
    getDecomptes,
    getDecompteById,
    updateStatut,
    ajouterDonneesExtraites,
    STATUTS
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Service complet CRUD Firestore sécu
   - Structure adaptée sécurité sociale
   - Gestion du contexte médical (ALD, etc.)
   - Statuts spécifiques avec controle_taux
   
   NOTES POUR REPRISES FUTURES:
   - Collection: decomptes_secu
   - Le numéro est SECU-YYYYMMDD-XXXX
   - Structure avec actes médicaux détaillés
   - Calculs de remboursements stockés
   ======================================== */