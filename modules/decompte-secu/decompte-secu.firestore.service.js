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
            const decompte = template.createNewDecompteSecu();
            
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
                template.createHistoriqueEntry(
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
        
        // Filtre par statut SPÉCIFIQUE
        if (filtres.statut) {
            constraints.push(where('statut', '==', filtres.statut));
        }
        // ⚠️ PAS de filtre != 'supprime' ici (cause le problème d'index)
        
        // Filtre par caisse
        if (filtres.caissePrimaire) {
            constraints.push(where('caissePrimaire', '==', filtres.caissePrimaire));
        }
        
        // Filtre par magasin
        if (filtres.codeMagasin) {
            constraints.push(where('codeMagasin', '==', filtres.codeMagasin));
        }
        
        // Tri simple
        constraints.push(orderBy('dates.creation', 'desc'));
        
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
            const data = doc.data();
            // ✅ FILTRAGE CÔTÉ CLIENT pour exclure les supprimés
            if (data.statut !== 'supprime') {
                decomptes.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`📊 ${decomptes.length} décomptes trouvés (${snapshot.size} total)`);
        return decomptes;
        
    } catch (error) {
        console.error('❌ Erreur récupération décomptes:', error);
        
        // ⚠️ FALLBACK : Si erreur, essayer sans orderBy
        try {
            const { collection, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const snapshot = await getDocs(collection(db, COLLECTION_NAME));
            const decomptes = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.statut !== 'supprime') {
                    decomptes.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            // Tri manuel côté client
            decomptes.sort((a, b) => {
                const dateA = a.dates?.creation?.toMillis?.() || 0;
                const dateB = b.dates?.creation?.toMillis?.() || 0;
                return dateB - dateA;
            });
            
            // Limite manuelle
            const limited = filtres.limite ? decomptes.slice(0, filtres.limite) : decomptes;
            
            console.log(`📊 ${limited.length} décomptes trouvés (fallback)`);
            return limited;
            
        } catch (fallbackError) {
            console.error('❌ Erreur fallback:', fallbackError);
            return [];
        }
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
        
        // Préparer les virements avec structure de rapprochement
        let virementsFormates = [];
        
        // Si nouvelle structure avec virements multiples
        if (donnees.virements && Array.isArray(donnees.virements)) {
            virementsFormates = donnees.virements.map((vir, index) => ({
                id: `vir-${String(index + 1).padStart(3, '0')}`,
                dateVirement: vir.dateVirement,
                numeroVirement: vir.numeroVirement || `Vir. ${index + 1}`,
                montantVirement: vir.montantVirement || 0,
                nombreBeneficiaires: vir.nombreBeneficiaires || vir.beneficiaires?.length || 0,
                beneficiaires: vir.beneficiaires || [],
                
                // ⚡ AJOUT : Structure de rapprochement
                rapprochement: {
                    statut: 'en_attente',
                    dateRapprochement: null,
                    montantBancaire: null,
                    ecart: null,
                    rapprochePar: null,
                    commentaire: null
                }
            }));
        }
        // Compatibilité ancienne structure
        else {
            virementsFormates = [{
                id: 'vir-001',
                dateVirement: donnees.dateVirement,
                numeroVirement: donnees.numeroVirement || 'Vir. 1',
                montantVirement: donnees.montantVirement || 0,
                nombreBeneficiaires: donnees.beneficiaires?.length || 0,
                beneficiaires: donnees.beneficiaires || [],
                
                // ⚡ AJOUT : Structure de rapprochement
                rapprochement: {
                    statut: 'en_attente',
                    dateRapprochement: null,
                    montantBancaire: null,
                    ecart: null,
                    rapprochePar: null,
                    commentaire: null
                }
            }];
        }
        
        const updates = {
            // Infos générales
            caissePrimaire: donnees.caissePrimaire || donnees.informationsGenerales?.caissePrimaire || null,
            numeroFINESS: donnees.informationsGenerales?.numeroFINESS || null,
            codeMagasin: donnees.codeMagasin || donnees.informationsGenerales?.codeMagasin || null,
            societe: donnees.societe || donnees.informationsGenerales?.societe || null,
            
            // Virements avec rapprochement
            virements: virementsFormates,
            
            // Totaux
            totaux: donnees.totaux || {
                nombreTotalVirements: virementsFormates.length,
                montantTotalVirements: virementsFormates.reduce((sum, v) => sum + v.montantVirement, 0),
                nombreTotalBeneficiaires: donnees.totaux?.nombreTotalBeneficiaires || 0,
                nombreTotalAppareils: donnees.totaux?.nombreTotalAppareils || 0
            },
            
            // Métadonnées IA
            extractionIA: {
                timestamp: serverTimestamp(),
                modele: 'gpt-4o-mini',
                success: true,
                donneesBrutes: donnees
            },
            
            // Mise à jour du statut
            statut: 'traitement_effectue',
            'dates.transmissionIA': serverTimestamp(),
            'dates.traitementEffectue': serverTimestamp(),
            
            // Historique
            historique: arrayUnion(
                template.createHistoriqueEntry(
                    'extraction_ia',
                    `Extraction réussie: ${virementsFormates.length} virement(s), montant total ${donnees.totaux?.montantTotalVirements || donnees.montantVirement || 0}€`,
                    { id: 'system_ia', nom: 'SYSTEM', prenom: 'IA', role: 'system' }
                )
            )
        };
        
        await updateDoc(doc(db, COLLECTION_NAME, decompteId), updates);
        
        console.log('✅ Données IA ajoutées avec structure de rapprochement');
        
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
                    template.createHistoriqueEntry(
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
     * Rapprocher UN SEUL virement spécifique
     */
    async rapprocherVirement(decompteId, virementId, donneesRapprochement) {
        try {
            const { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log(`💳 Rapprochement du virement ${virementId} dans ${decompteId}`);
            
            // Récupérer le document actuel
            const docRef = doc(db, COLLECTION_NAME, decompteId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error('Décompte introuvable');
            }
            
            const decompte = docSnap.data();
            const virementIndex = decompte.virements.findIndex(v => v.id === virementId);
            
            if (virementIndex === -1) {
                throw new Error('Virement introuvable');
            }
            
            // Récupérer l'utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || '',
                role: auth.collaborateur?.role || 'technicien'
            };
            
            // Calculer l'écart
            const montantVirement = decompte.virements[virementIndex].montantVirement;
            const montantBancaire = donneesRapprochement.montant || montantVirement;
            const ecart = montantBancaire - montantVirement;
            
            // Mise à jour du virement spécifique
            const updates = {
                [`virements.${virementIndex}.rapprochement`]: {
                    statut: 'rapproche',
                    dateRapprochement: serverTimestamp(),
                    montantBancaire: montantBancaire,
                    ecart: ecart,
                    rapprochePar: `${utilisateur.prenom} ${utilisateur.nom}`,
                    commentaire: donneesRapprochement.commentaire || null
                },
                
                // Historique
                historique: arrayUnion(
                    template.createHistoriqueEntry(
                        'rapprochement_virement',
                        `Virement ${decompte.virements[virementIndex].numeroVirement} rapproché (${montantVirement}€)`,
                        utilisateur
                    )
                )
            };
            
            // Vérifier si TOUS les virements sont rapprochés
            const tousRapproches = decompte.virements.every((v, i) => 
                i === virementIndex || v.rapprochement?.statut === 'rapproche'
            );
            
            if (tousRapproches) {
                updates.statut = 'rapprochement_bancaire';
                updates['dates.rapprochementBancaire'] = serverTimestamp();
            }
            
            await updateDoc(docRef, updates);
            
            console.log(`✅ Virement ${virementId} rapproché`);
            
            return {
                success: true,
                ecart: ecart,
                tousRapproches: tousRapproches
            };
            
        } catch (error) {
            console.error('❌ Erreur rapprochement virement:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer COMPLÈTEMENT un décompte (Storage + Firestore)
     */
    async supprimerDecompte(id, options = {}) {
        try {
            const { doc, getDoc, deleteDoc, serverTimestamp, updateDoc, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const { ref, deleteObject, getStorage } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
            );
            
            console.log('🗑️ Suppression COMPLÈTE décompte:', id);
            
            // 1. Récupérer le document pour avoir les URLs des fichiers
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                console.warn('Document introuvable');
                return false;
            }
            
            const data = docSnap.data();
            const storage = getStorage();
            
            // 2. Supprimer les fichiers du Storage
            if (data.documents && data.documents.length > 0) {
                console.log(`🗑️ Suppression de ${data.documents.length} fichier(s) Storage...`);
                
                for (const document of data.documents) {
                    try {
                        if (document.chemin) {
                            // Créer la référence depuis le chemin
                            const fileRef = ref(storage, document.chemin);
                            await deleteObject(fileRef);
                            console.log(`✅ Fichier supprimé: ${document.chemin}`);
                        }
                    } catch (error) {
                        console.error(`⚠️ Erreur suppression fichier ${document.nom}:`, error);
                        // Continuer même si un fichier échoue
                    }
                }
            }
            
            // 3. Supprimer DÉFINITIVEMENT le document Firestore
            if (options.doublonDetecte) {
                // Si doublon → Suppression DÉFINITIVE
                console.log('🔴 Suppression définitive (doublon)');
                await deleteDoc(docRef);
            } else {
                // Sinon → Soft delete (garde l'historique)
                console.log('🟡 Soft delete (suppression manuelle)');
                
                const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
                const utilisateur = {
                    id: auth.collaborateur?.id || 'unknown',
                    nom: auth.collaborateur?.nom || 'Inconnu',
                    prenom: auth.collaborateur?.prenom || '',
                    role: auth.collaborateur?.role || 'technicien'
                };
                
                await updateDoc(docRef, {
                    statut: 'supprime',
                    'dates.suppression': serverTimestamp(),
                    'intervenants.supprimePar': utilisateur,
                    historique: arrayUnion(
                        template.createHistoriqueEntry(
                            'suppression',
                            options.motif || 'Suppression manuelle',
                            utilisateur
                        )
                    )
                });
            }
            
            console.log('✅ Décompte supprimé complètement');
            return true;
            
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
 * Rechercher des doublons probables par comparaison de virements
 */
async rechercherDoublonsProbables(criteres) {
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        console.log('🔍 Recherche de doublons avec critères:', criteres);
        
        // Récupérer TOUS les décomptes
        const snapshot = await getDocs(collection(db, COLLECTION_NAME));
        
        const doublons = [];
        
        // Préparer les virements à comparer (depuis les critères)
        let virementsAChercher = [];
        
        // Si on a des virements dans les critères
        if (criteres.virements && Array.isArray(criteres.virements)) {
            virementsAChercher = criteres.virements.map(v => ({
                montant: v.montantVirement,
                date: v.dateVirement ? new Date(v.dateVirement).toDateString() : null,
                nbBenef: v.nombreBeneficiaires || v.beneficiaires?.length || 0
            }));
        }
        // Sinon, compatibilité ancienne structure
        else if (criteres.montantVirement) {
            virementsAChercher = [{
                montant: criteres.montantVirement,
                date: criteres.dateVirement ? new Date(criteres.dateVirement).toDateString() : null,
                nbBenef: criteres.beneficiaires?.length || 0
            }];
        }
        
        console.log('📊 Virements à chercher:', virementsAChercher);
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Ignorer les supprimés
            if (data.statut === 'supprime') return;
            
            // Préparer les virements du décompte existant
            let virementsExistants = [];
            
            if (data.virements && Array.isArray(data.virements)) {
                virementsExistants = data.virements.map(v => ({
                    montant: v.montantVirement,
                    date: v.dateVirement ? new Date(v.dateVirement.toDate ? v.dateVirement.toDate() : v.dateVirement).toDateString() : null,
                    nbBenef: v.nombreBeneficiaires || v.beneficiaires?.length || 0
                }));
            }
            
            // Si pas de virements à comparer, skip
            if (virementsAChercher.length === 0 || virementsExistants.length === 0) {
                return;
            }
            
            // COMPARAISON VIREMENT PAR VIREMENT
            let correspondances = 0;
            let scoreTotal = 0;
            
            // Pour chaque virement à chercher
            virementsAChercher.forEach(virementCherche => {
                // Chercher une correspondance dans les virements existants
                const correspondanceTrouvee = virementsExistants.some(virementExistant => {
                    // Vérifier montant (exact)
                    const memeMontant = Math.abs(virementExistant.montant - virementCherche.montant) < 0.01;
                    
                    // Vérifier date (même jour)
                    const memeDate = virementExistant.date === virementCherche.date;
                    
                    // Vérifier nombre de bénéficiaires
                    const memeNbBenef = virementExistant.nbBenef === virementCherche.nbBenef;
                    
                    // Les 3 critères doivent matcher
                    return memeMontant && memeDate && memeNbBenef;
                });
                
                if (correspondanceTrouvee) {
                    correspondances++;
                }
            });
            
            // Calculer le score de certitude
            if (correspondances > 0) {
                // Score basé sur le pourcentage de virements qui correspondent
                const pourcentageCorrespondance = (correspondances / virementsAChercher.length) * 100;
                
                // Si TOUS les virements correspondent = 100% de certitude
                if (correspondances === virementsAChercher.length && 
                    virementsAChercher.length === virementsExistants.length) {
                    scoreTotal = 100; // Doublon certain
                } else if (correspondances === virementsAChercher.length) {
                    scoreTotal = 90; // Tous nos virements sont trouvés (mais il peut y en avoir d'autres)
                } else {
                    scoreTotal = Math.round(pourcentageCorrespondance * 0.8); // Score partiel
                }
                
                // Bonus si même caisse
                if (criteres.caissePrimaire && criteres.caissePrimaire === data.caissePrimaire) {
                    scoreTotal = Math.min(100, scoreTotal + 10);
                }
                
                // Ajouter comme doublon potentiel si score >= 60
                if (scoreTotal >= 60) {
                    doublons.push({
                        id: doc.id,
                        numeroDecompte: data.numeroDecompte,
                        montantVirement: data.totaux?.montantTotalVirements || 0,
                        dateVirement: data.virements?.[0]?.dateVirement,
                        nombreBeneficiaires: data.totaux?.nombreTotalBeneficiaires || 0,
                        caissePrimaire: data.caissePrimaire,
                        score: scoreTotal,
                        correspondances: correspondances,
                        totalVirements: virementsExistants.length,
                        details: `${correspondances}/${virementsAChercher.length} virements identiques`
                    });
                    
                    console.log(`⚠️ Doublon potentiel détecté: ${data.numeroDecompte} (score: ${scoreTotal}%)`);
                    console.log(`   → ${correspondances}/${virementsAChercher.length} virements correspondent`);
                }
            }
        });
        
        // Trier par score décroissant
        doublons.sort((a, b) => b.score - a.score);
        
        console.log(`🔍 ${doublons.length} doublons potentiels trouvés`);
        return doublons;
        
    } catch (error) {
        console.error('❌ Erreur recherche doublons:', error);
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