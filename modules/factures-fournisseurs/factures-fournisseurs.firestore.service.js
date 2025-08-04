// ========================================
// FACTURES-FOURNISSEURS.FIRESTORE.SERVICE.JS - 🗄️ ACCÈS BASE DE DONNÉES
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.firestore.service.js
//
// DESCRIPTION:
// Service de gestion des factures fournisseurs dans Firestore
// Création, lecture, mise à jour des enregistrements
//
// FONCTIONS PUBLIQUES:
// - creerFacture(data) : Créer une nouvelle facture
// - getFactures(filtres) : Récupérer les factures avec filtres
// - getFactureById(id) : Récupérer une facture par ID
// - updateStatut(id, statut) : Mettre à jour le statut
// - ajouterDonneesExtraites(id, donnees) : Ajouter les données IA
// - genererNumeroInterne() : Générer un numéro unique
//
// STRUCTURE COLLECTION:
// Collection: facturesFournisseurs (camelCase)
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { FACTURE_FOURNISSEUR_TEMPLATE } from '../../src/templates/index.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'facturesFournisseurs'; // camelCase comme demandé
const STATUTS = {
    NOUVELLE: 'nouvelle',
    A_PAYER: 'a_payer',
    DEJA_PAYEE: 'deja_payee',
    PAYEE: 'payee',
    A_POINTER: 'a_pointer',
    POINTEE: 'pointee',
    EN_RETARD: 'en_retard',
    ANNULEE: 'annulee'
};

// ========================================
// TEMPLATE FIRESTORE LOCAL
// ========================================

// Template de la structure d'une facture fournisseur
const TEMPLATE_FACTURE = {
    // Identification
    numeroFacture: null,           // String - Numéro du fournisseur
    numeroInterne: null,           // String - Format: FF-AAAAMMJJ-XXXX
    
    // Fournisseur
    fournisseur: {
        nom: null,                 // String - Nom du fournisseur
        categorie: null,           // String - telecom|energie|services|etc
        numeroClient: null,        // String - Notre numéro chez eux
        siren: null                // String - SIREN du fournisseur
    },
    
    // Montants
    montantHT: 0,                  // number - Montant HT
    montantTVA: 0,                 // number - Montant TVA
    montantTTC: 0,                 // number - Montant TTC
    tauxTVA: 20,                   // number - Taux de TVA
    
    // Dates
    dateFacture: null,             // Timestamp - Date de la facture
    dateEcheance: null,            // Timestamp - Date d'échéance
    dateReception: null,           // Timestamp - Date de réception/upload
    
    // Période facturée (pour abonnements)
    periodeDebut: null,            // Timestamp ou null
    periodeFin: null,              // Timestamp ou null
    
    // Paiement
    aPayer: false,                 // boolean - Sélectionné à l'upload
    statutPaiement: 'nouvelle',    // String - nouvelle|a_payer|payee|etc
    datePaiement: null,            // Timestamp ou null
    modePaiement: null,            // String ou null
    referenceVirement: null,       // String ou null
    
    // Organisation
    societe: null,                 // String - Notre société
    codeMagasin: null,             // String - Magasin concerné
    magasinUploadeur: null,        // String - Qui a uploadé
    
    // Documents
    documents: [],                 // Array<Object> - PDFs uploadés
    
    // Workflow
    statut: 'nouvelle',            // String - Statut global
    
    // Dates du workflow
    dates: {
        creation: null,            // Timestamp
        analyse: null,             // Timestamp - Analyse IA
        verification: null,        // Timestamp - Vérification
        paiement: null,            // Timestamp - Paiement
        pointage: null             // Timestamp - Rapprochement
    },
    
    // Intervenants
    intervenants: {
        creePar: {
            id: null,              // String
            nom: null,             // String
            prenom: null,          // String
            role: null             // String
        },
        verifiePar: null,          // Object ou null
        payePar: null,             // Object ou null
        pointePar: null            // Object ou null
    },
    
    // Historique
    historique: []                 // Array<Object>
};

// ========================================
// CRÉATION
// ========================================

/**
 * Créer une nouvelle facture
 * @param {Object} data - Données de la facture
 * @returns {Promise<string>} ID de la facture créée
 */
export async function creerFacture(data) {
    try {
        const { collection, addDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Générer le numéro interne
        const numeroInterne = await genererNumeroInterne();
        
        // Récupérer les infos utilisateur
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        // DEBUG
        console.log('🔍 DEBUG Auth:', auth);
        console.log('🔍 DEBUG data reçue:', data);
        console.log('🔍 DEBUG aPayer:', data.aPayer);
        
        // Cloner le template pour garantir la structure
        const factureData = JSON.parse(JSON.stringify(TEMPLATE_FACTURE));
        
        // Remplir les données du template
        // Identification
        factureData.numeroInterne = numeroInterne;
        
        // Organisation
        if (!auth.raisonSociale && auth.magasin) {
            try {
                const { chargerMagasins } = await import('../../src/services/firebase.service.js');
                const magasins = await chargerMagasins();
                const magasinUser = Object.values(magasins).find(m => m.code === auth.magasin);
                factureData.societe = magasinUser?.societe?.raisonSociale || 'NON DEFINI';
            } catch (error) {
                factureData.societe = 'NON DEFINI';
            }
        } else {
            factureData.societe = auth.raisonSociale || 'NON DEFINI';
        }
        factureData.codeMagasin = auth.magasin || 'XXX';
        factureData.magasinUploadeur = auth.magasin || 'XXX';
        
        // Documents uploadés
        factureData.documents = data.documents || [];
        
        // Flag à payer (IMPORTANT)
        factureData.aPayer = data.aPayer === true;
        
        // Statut initial selon sélection
        if (data.dejaPayee === true) {
            factureData.statut = STATUTS.DEJA_PAYEE;
            factureData.statutPaiement = STATUTS.DEJA_PAYEE;
            factureData.aPayer = false;
        } else if (data.aPayer === true) {
            factureData.statut = STATUTS.A_PAYER;
            factureData.statutPaiement = STATUTS.A_PAYER;
        } else {
            factureData.statut = STATUTS.NOUVELLE;
            factureData.statutPaiement = STATUTS.NOUVELLE;
        }
        
        // Dates - utiliser serverTimestamp pour la création
        factureData.dates.creation = serverTimestamp();
        factureData.dateReception = serverTimestamp();
        
        // Intervenants
        factureData.intervenants.creePar = {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien'
        };
        
        // Historique initial
        factureData.historique = [{
            date: new Date(),
            action: 'creation',
            details: `${data.documents.length} document(s) uploadé(s)${factureData.aPayer ? ' - Marquée à payer' : ''}`,
            timestamp: Date.now(),
            utilisateur: {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            }
        }];
        
        // Créer dans Firestore
        const docRef = await addDoc(collection(db, COLLECTION_NAME), factureData);
        
        console.log('✅ Facture créée:', numeroInterne, 'ID:', docRef.id);
        console.log('📋 Structure complète:', factureData);
        
        return docRef.id;
        
    } catch (error) {
        console.error('❌ Erreur création facture:', error);
        throw new Error(`Erreur lors de la création: ${error.message}`);
    }
}

// ========================================
// LECTURE
// ========================================

/**
 * Récupérer les factures avec filtres
 * @param {Object} filtres - Filtres à appliquer
 * @returns {Promise<Array>} Liste des factures
 */
export async function getFactures(filtres = {}) {
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
        
        if (filtres.fournisseur) {
            constraints.push(where('fournisseur.nom', '==', filtres.fournisseur));
        }
        
        if (filtres.aPayer === true) {
            constraints.push(where('aPayer', '==', true));
        }
        
        // Tri par défaut : date de facture décroissante
        constraints.push(orderBy('dateFacture', 'desc'));
        
        if (filtres.limite) {
            constraints.push(limit(filtres.limite));
        }
        
        // Appliquer les contraintes
        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }
        
        // Exécuter la requête
        const snapshot = await getDocs(q);
        
        const factures = [];
        snapshot.forEach((doc) => {
            factures.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`📊 ${factures.length} factures trouvées`);
        return factures;
        
    } catch (error) {
        console.error('❌ Erreur récupération factures:', error);
        return [];
    }
}

/**
 * Récupérer une facture par ID
 * @param {string} id - ID de la facture
 * @returns {Promise<Object|null>} La facture ou null
 */
export async function getFactureById(id) {
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
        console.error('❌ Erreur récupération facture:', error);
        return null;
    }
}

// ========================================
// MISE À JOUR
// ========================================

/**
 * Mettre à jour le statut d'une facture
 * @param {string} id - ID de la facture
 * @param {string} nouveauStatut - Nouveau statut
 * @param {Object} options - Options supplémentaires
 */
export async function updateStatut(id, nouveauStatut, options = {}) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        const updates = {
            statut: nouveauStatut,
            statutPaiement: nouveauStatut,
            historique: await ajouterHistorique(id, {
                action: 'changement_statut',
                details: `Statut changé en: ${nouveauStatut}`
            })
        };
        
        // Mises à jour spécifiques selon le statut
        switch (nouveauStatut) {
            case STATUTS.PAYEE:
                updates['dates.paiement'] = serverTimestamp();
                updates.datePaiement = serverTimestamp();
                updates['intervenants.payePar'] = {
                    id: auth.collaborateur?.id || 'unknown',
                    nom: auth.collaborateur?.nom || 'Inconnu',
                    prenom: auth.collaborateur?.prenom || '',
                    role: auth.collaborateur?.role || 'technicien'
                };
                updates.aPayer = false;
                if (options.modePaiement) {
                    updates.modePaiement = options.modePaiement;
                }
                if (options.referenceVirement) {
                    updates.referenceVirement = options.referenceVirement;
                }
                break;
                
            case STATUTS.A_POINTER:
                updates.aPayer = false;
                break;
                
            case STATUTS.POINTEE:
                updates['dates.pointage'] = serverTimestamp();
                updates['intervenants.pointePar'] = {
                    id: auth.collaborateur?.id || 'unknown',
                    nom: auth.collaborateur?.nom || 'Inconnu',
                    prenom: auth.collaborateur?.prenom || '',
                    role: auth.collaborateur?.role || 'technicien'
                };
                break;
                
            case STATUTS.EN_RETARD:
                updates.aPayer = true;
                break;
        }
        
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        
        console.log('✅ Statut mis à jour:', nouveauStatut);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        throw error;
    }
}

/**
 * Ajouter les données extraites par l'IA
 * @param {string} id - ID de la facture
 * @param {Object} donnees - Données extraites
 */
export async function ajouterDonneesExtraites(id, donnees) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const updates = {
            // Fournisseur
            fournisseur: {
                nom: donnees.fournisseur?.nom || null,
                categorie: donnees.fournisseur?.categorie || 'autre',
                numeroClient: donnees.fournisseur?.numeroClient || null,
                siren: donnees.fournisseur?.siren || null
            },
            
            // Numéro de facture
            numeroFacture: donnees.numeroFacture || null,
            
            // Montants
            montantHT: donnees.montantHT || 0,
            montantTVA: donnees.montantTVA || 0,
            montantTTC: donnees.montantTTC || 0,
            tauxTVA: donnees.tauxTVA || 20,
            
            // Dates
            dateFacture: donnees.dateFacture || null,
            dateEcheance: donnees.dateEcheance || null,
            
            // Période facturée
            periodeDebut: donnees.periodeDebut || null,
            periodeFin: donnees.periodeFin || null,
            
            // Mise à jour des dates
            'dates.analyse': serverTimestamp(),
            
            // Ajouter à l'historique
            historique: await ajouterHistorique(id, {
                action: 'extraction_ia',
                details: 'Données extraites avec succès',
                donnees: donnees
            })
        };
        
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        
        console.log('✅ Données extraites ajoutées');
        
    } catch (error) {
        console.error('❌ Erreur ajout données:', error);
        throw error;
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Générer un numéro interne unique
 * Format: FF-AAAAMMJJ-XXXX
 */
async function genererNumeroInterne() {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const date = new Date();
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const jour = String(date.getDate()).padStart(2, '0');
        const prefix = `FF-${annee}${mois}${jour}`;
        
        // Chercher le dernier numéro du jour
        const q = query(
            collection(db, COLLECTION_NAME),
            where('numeroInterne', '>=', `${prefix}-0000`),
            where('numeroInterne', '<=', `${prefix}-9999`),
            orderBy('numeroInterne', 'desc'),
            limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        let nextNumber = 1;
        if (!snapshot.empty) {
            const lastDoc = snapshot.docs[0].data();
            const lastNumber = parseInt(lastDoc.numeroInterne.split('-')[2]);
            nextNumber = lastNumber + 1;
        }
        
        return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
        
    } catch (error) {
        console.error('⚠️ Erreur génération numéro, fallback:', error);
        // Fallback avec timestamp
        return `FF-${Date.now()}`;
    }
}

/**
 * Ajouter une entrée à l'historique
 */
async function ajouterHistorique(id, nouvelleEntree) {
    try {
        const facture = await getFactureById(id);
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        const historique = facture?.historique || [];
        
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
// VÉRIFICATION DES RETARDS
// ========================================

/**
 * Vérifier et mettre à jour les factures en retard
 */
export async function verifierFacturesEnRetard() {
    try {
        const { collection, query, where, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Récupérer les factures à payer
        const q = query(
            collection(db, COLLECTION_NAME),
            where('statut', '==', STATUTS.A_PAYER)
        );
        
        const snapshot = await getDocs(q);
        const aujourd = new Date();
        let compteur = 0;
        
        for (const docSnap of snapshot.docs) {
            const facture = docSnap.data();
            if (facture.dateEcheance) {
                const echeance = facture.dateEcheance.toDate();
                if (echeance < aujourd) {
                    await updateStatut(docSnap.id, STATUTS.EN_RETARD);
                    compteur++;
                }
            }
        }
        
        console.log(`✅ ${compteur} facture(s) marquée(s) en retard`);
        
    } catch (error) {
        console.error('❌ Erreur vérification retards:', error);
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    creerFacture,
    getFactures,
    getFactureById,
    updateStatut,
    ajouterDonneesExtraites,
    verifierFacturesEnRetard,
    STATUTS
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Adaptation depuis decompte-mutuelle
   - Collection facturesFournisseurs (camelCase)
   - Gestion du flag aPayer
   - Statuts adaptés au workflow factures
   
   NOTES POUR REPRISES FUTURES:
   - Le numéro est généré automatiquement (FF-AAAAMMJJ-XXXX)
   - L'historique trace toutes les actions
   - Les données IA sont ajoutées après analyse
   ======================================== */