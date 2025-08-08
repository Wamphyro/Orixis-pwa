// ========================================
// FACTURES-FOURNISSEURS.FIRESTORE.SERVICE.JS - 🗄️ ACCÈS BASE DE DONNÉES
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.firestore.service.js
//
// DESCRIPTION:
// Service de gestion des factures fournisseurs dans Firestore
// Création, lecture, mise à jour des enregistrements
// Adapté à l'architecture decompte-mutuelle
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { FACTURE_FOURNISSEUR_TEMPLATE } from './factures-fournisseurs.template.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'facturesFournisseurs';
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
// CRÉATION
// ========================================

/**
 * Créer une nouvelle facture
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
        
        // Cloner le template
        const factureData = JSON.parse(JSON.stringify(FACTURE_FOURNISSEUR_TEMPLATE));
        
        // Identification
        factureData.numeroInterne = numeroInterne;
        
        // Organisation
        factureData.societe = auth.raisonSociale || 'ORIXIS SAS';
        factureData.codeMagasin = auth.magasin || 'XXX';
        factureData.magasinUploadeur = auth.magasin || 'XXX';
        
        // Documents
        factureData.documents = data.documents || [];
        
        // Statuts
        factureData.aPayer = data.aPayer === true;
        
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
        
        // Dates
        factureData.dates.creation = serverTimestamp();
        factureData.dateReception = serverTimestamp();
        
        // Intervenants
        factureData.intervenants.creePar = {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien'
        };
        
        // Historique
        factureData.historique = [{
            date: new Date(),
            action: 'creation',
            details: `${data.documents.length} document(s) uploadé(s)`,
            timestamp: Date.now(),
            utilisateur: factureData.intervenants.creePar
        }];
        
        // Création dans Firestore
        const docRef = await addDoc(collection(db, COLLECTION_NAME), factureData);
        
        console.log('✅ Facture créée:', numeroInterne, 'ID:', docRef.id);
        
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
 */
export async function getFactures(filtres = {}) {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        let q = collection(db, COLLECTION_NAME);
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
        
        if (filtres.limite) {
            constraints.push(limit(filtres.limite));
        }
        
        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }
        
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
 * Ajouter les données extraites par l'IA
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
            
            // Stocker les données brutes IA
            iaData: {
                reponseGPT: donnees,
                dateAnalyse: serverTimestamp(),
                modeleIA: donnees.modeleIA || 'gpt-4o-mini',
                erreurIA: null
            },
            
            // Ajouter à l'historique
            historique: await ajouterHistorique(id, {
                action: 'extraction_ia',
                details: 'Données extraites avec succès'
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
// HELPERS
// ========================================

/**
 * Générer un numéro interne unique
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

/**
 * Charger les magasins (helper pour l'analyse)
 */
export async function chargerMagasins() {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const snapshot = await getDocs(collection(db, 'magasins'));
        const magasins = [];
        
        snapshot.forEach(doc => {
            magasins.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return magasins;
        
    } catch (error) {
        console.error('⚠️ Erreur chargement magasins:', error);
        return [];
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    creerFacture,
    getFactures,
    getFactureById,
    ajouterDonneesExtraites,
    chargerMagasins,
    STATUTS
};