// ========================================
// DECOMPTE-SECU.FIRESTORE.SERVICE.JS - 🗄️ SERVICE FIRESTORE
// Chemin: modules/decompte-secu/decompte-secu.firestore.service.js
//
// DESCRIPTION:
// Service CRUD Firestore pour décomptes sécurité sociale audioprothèse
// Gère la création, lecture, mise à jour et suppression dans Firestore
// Inclut la détection intelligente de doublons
//
// VERSION: 1.0.0
// DATE: 08/01/2025
// ========================================

import { db } from '../../src/services/firebase.service.js';
import template from './decompte-secu.template.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'decomptesSecu';
const BATCH_SIZE = 500; // Limite Firestore pour batch operations

// ========================================
// SERVICE FIRESTORE
// ========================================

class DecompteSecuFirestoreService {
    constructor() {
        this.cache = {
            magasins: null,
            lastUpdate: null
        };
    }
    
    // ========================================
    // CRÉATION
    // ========================================
    
    /**
     * Créer un nouveau décompte
     */
    async creerDecompte(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('📝 Création décompte sécu...');
            
            // Créer le template de base
            const decompte = template.creerNouveauDecompte();
            
            // Générer le numéro de décompte
            decompte.numeroDecompte = await this.genererNumeroDecompte();
            
            // Récupérer les infos utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // Infos organisation
            decompte.societe = 'ORIXIS SAS';
            decompte.magasinUploadeur = auth.magasin || 'XXX';
            
            // Documents uploadés
            if (data.documents) {
                decompte.documents = data.documents;
                // Ajouter les hashes pour détection de doublons
                decompte.documentHashes = data.documents.map(d => d.hash).filter(Boolean);
            }
            
            // Dates
            decompte.dates.creation = serverTimestamp();
            
            // Intervenants
            decompte.intervenants.creePar = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            };
            
            // Historique initial
            decompte.historique = [
                template.creerEntreeHistorique(
                    'creation',
                    `${data.documents?.length || 0} document(s) uploadé(s)`,
                    decompte.intervenants.creePar
                )
            ];
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, COLLECTION_NAME), decompte);
            
            console.log('✅ Décompte créé:', decompte.numeroDecompte, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création décompte:', error);
            throw new Error(`Erreur création: ${error.message}`);
        }
    }
    
    /**
     * Générer un numéro unique
     */
    async genererNumeroDecompte() {
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
            // Fallback avec timestamp
            return `SECU-${Date.now()}`;
        }
    }
    
    // ========================================
    // LECTURE
    // ========================================
    
    /**
     * Récupérer les décomptes avec filtres
     */
    async getDecomptes(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, COLLECTION_NAME);
            const constraints = [];
            
            // Filtre par statut
            if (filtres.statut) {
                constraints.push(where('statut', '==', filtres.statut));
            }
            
            // Filtre par caisse
            if (filtres.caissePrimaire) {
                constraints.push(where('caissePrimaire', '==', filtres.caissePrimaire));
            }
            
            // Filtre par magasin
            if (filtres.codeMagasin) {
                constraints.push(where('codeMagasin', '==', filtres.codeMagasin));
            }
            
            // Tri par défaut : date virement décroissante
            constraints.push(orderBy('dateVirement', 'desc'));
            
            // Limite
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
     */
    async getDecompteById(id) {
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
    
    /**
     * Récupérer les statistiques
     */
    async getStatistiques() {
        try {
            const decomptes = await this.getDecomptes({ limite: 1000 });
            
            const stats = {
                total: decomptes.length,
                parStatut: {},
                parCaisse: {},
                montantTotal: 0,
                nombreBeneficiairesTotal: 0
            };
            
            decomptes.forEach(decompte => {
                // Par statut
                if (decompte.statut !== 'supprime') {
                    stats.parStatut[decompte.statut] = (stats.parStatut[decompte.statut] || 0) + 1;
                }
                
                // Par caisse
                if (decompte.caissePrimaire) {
                    stats.parCaisse[decompte.caissePrimaire] = (stats.parCaisse[decompte.caissePrimaire] || 0) + 1;
                }
                
                // Montants
                stats.montantTotal += decompte.montantVirement || 0;
                stats.nombreBeneficiairesTotal += decompte.nombreBeneficiaires || 0;
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parCaisse: {},
                montantTotal: 0,
                nombreBeneficiairesTotal: 0
            };
        }
    }
    
    // ========================================
    // MISE À JOUR
    // ========================================
    
    /**
     * Ajouter les données extraites par l'IA
     */
    async ajouterDonneesExtraites(decompteId, donnees) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('🤖 Ajout données IA pour:', decompteId);
            
            const updates = {
                // Données du virement
                montantVirement: donnees.montantVirement || 0,
                dateVirement: donnees.dateVirement ? new Date(donnees.dateVirement) : null,
                numeroVirement: donnees.numeroVirement || null,
                
                // Bénéficiaires
                beneficiaires: donnees.beneficiaires || [],
                nombreBeneficiaires: donnees.beneficiaires?.length || 0,
                
                // Organisation
                codeMagasin: donnees.codeMagasin || null,
                caissePrimaire: donnees.caissePrimaire || null,
                
                // Métadonnées IA
                extractionIA: {
                    timestamp: serverTimestamp(),
                    modele: 'gpt-4.1-mini',
                    montantVirement: donnees.montantVirement,
                    dateVirement: donnees.dateVirement,
                    numeroVirement: donnees.numeroVirement,
                    caissePrimaire: donnees.caissePrimaire,
                    beneficiaires: donnees.beneficiaires,
                    finessDetecte: donnees.finessDetecte,
                    codeMagasinDetecte: donnees.codeMagasin,
                    societeDetectee: donnees.societe,
                    formatSource: donnees.formatSource || 'pdf'
                },
                
                // Mise à jour du statut
                statut: 'traitement_effectue',
                'dates.transmissionIA': serverTimestamp(),
                'dates.traitementEffectue': serverTimestamp(),
                
                // Historique
                historique: arrayUnion(
                    template.creerEntreeHistorique(
                        'extraction_ia',
                        `Extraction réussie: ${donnees.beneficiaires?.length || 0} bénéficiaire(s), montant ${donnees.montantVirement}€`,
                        { id: 'system_ia', nom: 'SYSTEM', prenom: 'IA', role: 'system' }
                    )
                )
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, decompteId), updates);
            
            console.log('✅ Données IA ajoutées');
            
        } catch (error) {
            console.error('❌ Erreur ajout données IA:', error);
            throw error;
        }
    }
    
    /**
     * Marquer comme rapproché
     */
    async marquerRapproche(decompteId, donneesRapprochement) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            };
            
            const updates = {
                statut: 'rapprochement_bancaire',
                'dates.rapprochementBancaire': serverTimestamp(),
                'intervenants.rapprochePar': utilisateur,
                
                rapprochement: {
                    effectue: true,
                    dateRapprochement: serverTimestamp(),
                    libelleCompteBancaire: donneesRapprochement.libelle || null,
                    dateCompteBancaire: donneesRapprochement.date || null,
                    montantBancaire: donneesRapprochement.montant || null
                },
                
                historique: arrayUnion(
                    template.creerEntreeHistorique(
                        'rapprochement_bancaire',
                        `Virement rapproché avec le compte bancaire`,
                        utilisateur
                    )
                )
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, decompteId), updates);
            
            console.log('✅ Décompte rapproché');
            
        } catch (error) {
            console.error('❌ Erreur rapprochement:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer un décompte (soft delete)
     */
    async supprimerDecompte(decompteId, infos = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            };
            
            const updates = {
                statut: 'supprime',
                
                suppression: {
                    date: serverTimestamp(),
                    par: utilisateur,
                    motif: infos.motif || 'Suppression manuelle'
                },
                
                historique: arrayUnion(
                    template.creerEntreeHistorique(
                        'suppression',
                        infos.motif || 'Suppression manuelle',
                        utilisateur
                    )
                )
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, decompteId), updates);
            
            console.log('✅ Décompte supprimé (soft delete)');
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw error;
        }
    }
    
    // ========================================
    // DÉTECTION DE DOUBLONS
    // ========================================
    
    /**
     * Vérifier si un hash existe déjà
     */
        async verifierHashExiste(hash) {
        try {
            const { collection, query, where, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Requête SIMPLE sans filtre composite
            const q = query(
                collection(db, COLLECTION_NAME),
                where('documentHashes', 'array-contains', hash)
            );
            
            const snapshot = await getDocs(q);
            
            // Filtrer manuellement les supprimés
            for (const doc of snapshot.docs) {
                const data = doc.data();
                if (data.statut !== 'supprime') {
                    return {
                        existe: true,
                        numeroDecompte: data.numeroDecompte,
                        dateCreation: data.dates?.creation
                    };
                }
            }
            
            return { existe: false };
            
        } catch (error) {
            console.error('⚠️ Erreur vérification hash:', error);
            return { existe: false };
        }
    }
    
    /**
     * Rechercher des doublons probables (intelligent)
     */
    async rechercherDoublonsProbables(donnees, excludeId = null) {
        try {
            const { collection, query, where, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Récupérer les décomptes récents (30 derniers jours)
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 30);
            
            const q = query(
                collection(db, COLLECTION_NAME),
                where('statut', '!=', 'supprime'),
                where('dateVirement', '>=', dateLimit)
            );
            
            const snapshot = await getDocs(q);
            const candidats = [];
            
            snapshot.forEach((doc) => {
                if (doc.id === excludeId) return;
                
                const decompte = doc.data();
                let score = 0;
                const details = [];
                
                // 40 points : Montant identique (tolérance 1 centime)
                if (Math.abs((decompte.montantVirement || 0) - (donnees.montantVirement || 0)) < 0.01) {
                    score += 40;
                    details.push('Montant identique');
                }
                
                // 30 points : Date proche (±3 jours)
                if (donnees.dateVirement && decompte.dateVirement) {
                    const date1 = new Date(donnees.dateVirement);
                    const date2 = decompte.dateVirement.toDate ? decompte.dateVirement.toDate() : new Date(decompte.dateVirement);
                    const diffDays = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays <= 3) {
                        score += 30;
                        details.push(`Date proche (${Math.round(diffDays)} jour(s))`);
                    }
                }
                
                // 30 points : Au moins un bénéficiaire en commun
                if (donnees.beneficiaires && decompte.beneficiaires) {
                    const beneficiairesCommuns = donnees.beneficiaires.filter(b1 => {
                        const nom1 = `${b1.prenom || ''} ${b1.nom || ''}`.toUpperCase().trim();
                        return decompte.beneficiaires.some(b2 => {
                            const nom2 = `${b2.prenom || ''} ${b2.nom || ''}`.toUpperCase().trim();
                            return nom1 === nom2 && nom1 !== '';
                        });
                    });
                    
                    if (beneficiairesCommuns.length > 0) {
                        score += 30;
                        details.push(`${beneficiairesCommuns.length} bénéficiaire(s) en commun`);
                    }
                }
                
                // Ajouter comme candidat si score significatif
                if (score >= 40) {
                    candidats.push({
                        id: doc.id,
                        ...decompte,
                        score: score,
                        details: details
                    });
                }
            });
            
            // Trier par score décroissant
            candidats.sort((a, b) => b.score - a.score);
            
            console.log(`🔍 ${candidats.length} doublon(s) potentiel(s) trouvé(s)`);
            
            return candidats;
            
        } catch (error) {
            console.error('⚠️ Erreur recherche doublons:', error);
            return [];
        }
    }
    
    // ========================================
    // CHARGEMENT DES MAGASINS
    // ========================================
    
    /**
     * Charger la liste des magasins
     */
    /**
     * Charger la liste des magasins
     */
    /**
     * Charger la liste des magasins
     */
    /**
     * Charger la liste des magasins
     */
    async chargerMagasins() {
        try {
            // Utiliser le cache si récent (5 minutes)
            if (this.cache.magasins && this.cache.lastUpdate) {
                const age = Date.now() - this.cache.lastUpdate;
                if (age < 5 * 60 * 1000) {
                    console.log('📦 Utilisation du cache magasins');
                    return this.cache.magasins;
                }
            }
            
            const { collection, query, where, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('🏪 Chargement des magasins depuis Firestore...');
            
            const q = query(
                collection(db, 'magasins'),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            const magasins = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Récupérer la RAISON SOCIALE de la société
                let societe = '';
                if (data.societe && typeof data.societe === 'object') {
                    societe = data.societe.raisonSociale || '';  // ← On prend raisonSociale !
                }
                
                magasins.push({
                    id: doc.id,
                    code: data.code,
                    nom: data.nom,
                    finess: data.numeroFINESS || data.finess || '',
                    societe: societe,  // ← La raison sociale (BROKER AUDIOLOGIE, etc.)
                    adresse: {
                        rue: data.adresse?.rue || '',
                        codePostal: data.adresse?.codePostal || '',
                        ville: data.adresse?.ville || ''
                    }
                });
            });
            
            // Mettre en cache
            this.cache.magasins = magasins;
            this.cache.lastUpdate = Date.now();
            
            console.log(`✅ ${magasins.length} magasins chargés`);
            console.log('🏢 Sociétés présentes:', [...new Set(magasins.map(m => m.societe).filter(Boolean))]);
            
            return magasins;
            
        } catch (error) {
            console.error('❌ Erreur chargement magasins:', error);
            return [];
        }
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new DecompteSecuFirestoreService();
export default service;

/* ========================================
   HISTORIQUE
   
   [08/01/2025] - v1.0.0
   - Service CRUD complet
   - Détection intelligente de doublons
   - Rapprochement bancaire
   - Cache magasins optimisé
   ======================================== */