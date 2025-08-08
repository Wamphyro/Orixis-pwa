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
            // ✅ IDENTIFIANTS COMPLETS
            identifiants: donnees.identifiants || {},
            
            // ✅ FOURNISSEUR COMPLET
            fournisseur: donnees.fournisseur ? {
                ...donnees.fournisseur,
                nom: donnees.fournisseur.nom?.toUpperCase() || null
            } : {},
            
            // ✅ CLIENT
            client: donnees.client || {},
            
            // ✅ TVA DÉTAILLÉE
            tva: donnees.tva || {},
            
            // ✅ COMPTABILITÉ
            comptabilite: donnees.comptabilite || {},
            
            // ✅ PAIEMENT
            paiement: donnees.paiement || {},
            
            // ✅ DOCUMENTS LIÉS
            documentsLies: donnees.documentsLies || {},
            
            // ✅ LIGNES DÉTAIL
            lignesDetail: donnees.lignesDetail || [],
            
            // ✅ MONTANTS (compatibilité)
            numeroFacture: donnees.numeroFacture?.toUpperCase() || null,
            montantHT: donnees.montantHT,
            montantTVA: donnees.montantTVA,
            montantTTC: donnees.montantTTC,
            tauxTVA: donnees.tauxTVA,
            
            // ✅ MONTANTS STRUCTURÉS
            montants: donnees.montants || {},
            
            // ✅ DATES
            dateFacture: donnees.dateFacture,
            dateEcheance: donnees.dateEcheance,
            periodeDebut: donnees.periodeDebut,
            periodeFin: donnees.periodeFin,
            
            // ✅ MODE PAIEMENT
            modePaiement: donnees.modePaiement,
            
            // Dates système
            'dates.analyse': serverTimestamp(),
            
            // ✅ DONNÉES IA COMPLÈTES
            iaData: {
                reponseGPT: donnees,
                dateAnalyse: serverTimestamp(),
                modeleIA: donnees.extractionIA?.modele || 'gpt-4o-mini',
                erreurIA: null,
                donneesExtraites: donnees
            },
            
            // Historique
            historique: await ajouterHistorique(id, {
                action: 'extraction_ia',
                details: 'Données extraites avec succès'
            })
        };
        
        await updateDoc(doc(db, COLLECTION_NAME, id), updates);
        
        console.log('✅ Données extraites ajoutées (COMPLÈTES)');
        
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

/**
 * Vérifier si un hash de document existe déjà
 */
export async function verifierHashExiste(hash) {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        console.log('🔍 Vérification du hash:', hash.substring(0, 12) + '...');
        
        // Récupérer toutes les factures
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        
        // Parcourir toutes les factures
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Vérifier si la facture a des documents
            if (data.documents && Array.isArray(data.documents)) {
                // Parcourir tous les documents de la facture
                for (const document of data.documents) {
                    if (document.hash === hash) {
                        console.log('⚠️ Doublon trouvé:', doc.id);
                        return {
                            id: doc.id,
                            numeroFacture: data.numeroFacture || data.numeroInterne,
                            dateUpload: data.dates?.creation,
                            fournisseur: data.fournisseur?.nom,
                            statut: data.statut
                        };
                    }
                }
            }
        }
        
        console.log('✅ Pas de doublon trouvé');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur vérification hash:', error);
        return null;
    }
}

/**
 * Vérifier si un numéro de facture existe déjà
 */
export async function verifierNumeroFactureExiste(numeroFacture) {
    try {
        if (!numeroFacture) return null;
        
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Normaliser en majuscules pour la comparaison
        const numeroRecherche = numeroFacture.toUpperCase().trim();
        
        console.log('🔍 Vérification du numéro facture:', numeroRecherche);
        
        // Récupérer toutes les factures
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        
        // Parcourir et comparer sans tenir compte de la casse
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Vérifier le numéro de facture (insensible à la casse)
            const numeroExistant = (data.numeroFacture || '').toUpperCase().trim();
            
            if (numeroExistant && numeroExistant === numeroRecherche) {
                console.log('⚠️ Numéro facture trouvé:', doc.id);
                return {
                    id: doc.id,
                    numeroFacture: data.numeroFacture,
                    dateFacture: data.dateFacture,
                    fournisseur: data.fournisseur?.nom,
                    montantTTC: data.montantTTC,
                    statut: data.statut
                };
            }
        }
        
        console.log('✅ Numéro facture non trouvé');
        return null;
        
    } catch (error) {
        console.error('❌ Erreur vérification numéro facture:', error);
        return null;
    }
}

/**
 * Rechercher les doublons potentiels avec score de probabilité
 */
export async function rechercherDoublonsProbables(donnees) {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        console.log('🔍 Recherche de doublons probables...');
        
        // Normaliser les données de recherche
        const numeroRecherche = (donnees.numeroFacture || '').toUpperCase().trim();
        const montantRecherche = parseFloat(donnees.montantTTC || 0);
        const fournisseurRecherche = (donnees.fournisseur || '').toUpperCase().trim();
        
        // Date de recherche (tolérance +/- 3 jours)
        let dateRecherche = null;
        if (donnees.dateFacture) {
            dateRecherche = donnees.dateFacture.toDate ? 
                donnees.dateFacture.toDate() : 
                new Date(donnees.dateFacture);
        }
        
        // Récupérer toutes les factures
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        
        const doublonsPotentiels = [];
        
        // Analyser chaque facture
        for (const doc of snapshot.docs) {
            const data = doc.data();
            let score = 0;
            const details = [];
            
            // 1️⃣ NUMÉRO FACTURE (40 points)
            if (numeroRecherche && data.numeroFacture) {
                const numeroExistant = (data.numeroFacture || '').toUpperCase().trim();
                if (numeroExistant === numeroRecherche) {
                    score += 40;
                    details.push('N° facture identique');
                }
            }
            
            // 2️⃣ MONTANT TTC (30 points)
            if (montantRecherche > 0 && data.montantTTC) {
                const montantExistant = parseFloat(data.montantTTC || 0);
                // Tolérance de 0.01€ pour les arrondis
                if (Math.abs(montantExistant - montantRecherche) < 0.01) {
                    score += 30;
                    details.push('Montant identique');
                }
            }
            
            // 3️⃣ DATE FACTURE (20 points)
            if (dateRecherche && data.dateFacture) {
                const dateExistante = data.dateFacture.toDate ? 
                    data.dateFacture.toDate() : 
                    new Date(data.dateFacture);
                
                // Tolérance : même jour
                const diffJours = Math.abs(dateRecherche - dateExistante) / (1000 * 60 * 60 * 24);
                if (diffJours < 1) {
                    score += 20;
                    details.push('Date identique');
                } else if (diffJours < 3) {
                    score += 10;
                    details.push('Date proche (±3j)');
                }
            }
            
            // 4️⃣ FOURNISSEUR (10 points)
            if (fournisseurRecherche && data.fournisseur?.nom) {
                const fournisseurExistant = (data.fournisseur.nom || '').toUpperCase().trim();
                if (fournisseurExistant === fournisseurRecherche) {
                    score += 10;
                    details.push('Fournisseur identique');
                }
            }
            
            // Si score significatif, ajouter aux doublons potentiels
            if (score >= 40) {
                doublonsPotentiels.push({
                    id: doc.id,
                    score: score,
                    details: details,
                    numeroFacture: data.numeroFacture,
                    dateFacture: data.dateFacture,
                    montantTTC: data.montantTTC,
                    fournisseur: data.fournisseur?.nom,
                    statut: data.statut
                });
            }
        }
        
        // Trier par score décroissant
        doublonsPotentiels.sort((a, b) => b.score - a.score);
        
        console.log(`📊 ${doublonsPotentiels.length} doublon(s) potentiel(s) trouvé(s)`);
        
        return doublonsPotentiels;
        
    } catch (error) {
        console.error('❌ Erreur recherche doublons:', error);
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
    verifierHashExiste,
    verifierNumeroFactureExiste,
    rechercherDoublonsProbables,
    STATUTS
};