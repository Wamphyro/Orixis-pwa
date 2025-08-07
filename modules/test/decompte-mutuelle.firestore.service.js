// ========================================
// DECOMPTE-MUTUELLE.FIRESTORE.SERVICE.JS - 🔥 SERVICE FIRESTORE
// Chemin: modules/test/decompte-mutuelle.firestore.service.js
//
// DESCRIPTION:
// Service CRUD pour les décomptes mutuelles dans Firestore
// Gère la création, lecture, mise à jour et suppression
//
// FONCTIONS PUBLIQUES:
// - creerDecompte(data) : Créer un nouveau décompte
// - getDecomptes(filtres) : Récupérer les décomptes
// - getDecompteById(id) : Récupérer un décompte
// - updateDecompte(id, updates) : Mettre à jour
// - changerStatut(id, statut, options) : Changer le statut
// - supprimerDecompte(id, infos) : Soft delete
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { DECOMPTE_TEMPLATE, createNewDecompte, createHistoriqueEntry } from './decompte-mutuelle.template.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    COLLECTION_NAME: 'decomptes_mutuelles',
    
    // Statuts workflow
    STATUTS: {
        NOUVEAU: 'nouveau',
        TRAITEMENT_IA: 'traitement_ia',
        TRAITEMENT_EFFECTUE: 'traitement_effectue',
        TRAITEMENT_MANUEL: 'traitement_manuel',
        RAPPROCHEMENT_BANCAIRE: 'rapprochement_bancaire',
        SUPPRIME: 'supprime'
    },
    
    // Infos statuts pour UI
    STATUTS_INFO: {
        nouveau: {
            label: 'Nouveau',
            suivant: 'traitement_ia'
        },
        traitement_ia: {
            label: 'Traitement IA',
            suivant: 'traitement_effectue'
        },
        traitement_effectue: {
            label: 'Traité',
            suivant: 'rapprochement_bancaire'
        },
        traitement_manuel: {
            label: 'Traitement manuel',
            suivant: 'rapprochement_bancaire'
        },
        rapprochement_bancaire: {
            label: 'Rapproché',
            suivant: null
        },
        supprime: {
            label: 'Supprimé',
            suivant: null
        }
    }
};

// ========================================
// CLASSE DU SERVICE
// ========================================

export class DecompteFirestoreService {
    
    /**
     * Créer un nouveau décompte
     * @param {Object} data - Données initiales (documents uploadés)
     * @returns {Promise<string>} ID du décompte créé
     */
    static async creerDecompte(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Générer le numéro de décompte
            const numeroDecompte = await this.genererNumeroDecompte();
            
            // Récupérer les infos utilisateur
            const userInfo = this.getUserInfo();
            
            console.log('🔍 DEBUG création décompte:', { userInfo, data });
            
            // Cloner le template pour garantir la structure
            const decompteData = createNewDecompte();
            
            // Remplir les données du template
            decompteData.numeroDecompte = numeroDecompte;
            decompteData.typeDecompte = 'individuel'; // Par défaut, sera déterminé par l'IA
            
            // Organisation
            decompteData.societe = userInfo.societe || 'NON_DEFINI';
            decompteData.codeMagasin = userInfo.magasin;
            decompteData.magasinUploadeur = userInfo.magasin;
            
            // Documents uploadés
            decompteData.documents = data.documents || [];
            
            // Dates - utiliser serverTimestamp pour la création
            decompteData.dates.creation = serverTimestamp();
            
            // Intervenants
            decompteData.intervenants.creePar = {
                id: userInfo.id,
                nom: userInfo.nom,
                prenom: userInfo.prenom,
                role: userInfo.role || 'technicien'
            };
            
            // Historique initial
            decompteData.historique = [
                createHistoriqueEntry(
                    'creation',
                    `${data.documents.length} document(s) uploadé(s)`,
                    decompteData.intervenants.creePar
                )
            ];
            
            // Statut initial
            decompteData.statut = CONFIG.STATUTS.NOUVEAU;
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, CONFIG.COLLECTION_NAME), decompteData);
            
            console.log('✅ Décompte créé:', numeroDecompte, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création décompte:', error);
            throw new Error(`Erreur lors de la création: ${error.message}`);
        }
    }
    
    /**
     * Récupérer les décomptes avec filtres
     * @param {Object} filtres - Filtres optionnels
     * @returns {Promise<Array>} Liste des décomptes
     */
    static async getDecomptes(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, CONFIG.COLLECTION_NAME);
            const constraints = [];
            
            // Construire la requête avec les filtres
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
                const data = doc.data();
                decomptes.push({
                    id: doc.id,
                    ...data
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
    static async getDecompteById(id) {
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const docRef = doc(db, CONFIG.COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }
            
            console.warn(`⚠️ Décompte ${id} introuvable`);
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération décompte:', error);
            return null;
        }
    }
    
    /**
     * Mettre à jour un décompte
     * @param {string} id - ID du décompte
     * @param {Object} updates - Mises à jour
     * @returns {Promise<void>}
     */
    static async updateDecompte(id, updates) {
        const { doc, updateDoc, arrayUnion } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Ajouter à l'historique
        const userInfo = this.getUserInfo();
        const updatesAvecHistorique = {
            ...updates,
            historique: arrayUnion(
                createHistoriqueEntry(
                    'mise_a_jour',
                    'Décompte mis à jour',
                    {
                        id: userInfo.id,
                        nom: userInfo.nom,
                        prenom: userInfo.prenom,
                        role: userInfo.role
                    }
                )
            )
        };
        
        await updateDoc(doc(db, CONFIG.COLLECTION_NAME, id), updatesAvecHistorique);
        console.log('✅ Décompte mis à jour:', id);
    }
    
/**
 * Ajouter les données extraites par l'IA
 * @param {string} decompteId - ID du décompte
 * @param {Object} donnees - Données extraites
 */
static async ajouterDonneesExtraites(decompteId, donneesExtraites) {
    try {
        // ✅ IMPORTER doc, updateDoc ET arrayUnion
        const { doc, updateDoc, arrayUnion } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const decompteRef = doc(db, 'decomptes_mutuelles', decompteId);
        
        // Préparer les données à mettre à jour
        const updateData = {
            ...donneesExtraites,
            statut: 'traitement_effectue',
            'dates.traitementEffectue': new Date(),
            'dates.transmissionIA': new Date(),
            'intervenants.traitePar': {
                id: 'system_ia',
                nom: 'SYSTEM',
                prenom: 'IA',
                role: 'system'
            },
            // ✅ AJOUTER L'HISTORIQUE DIRECTEMENT ICI
            historique: arrayUnion({
                action: 'extraction_ia',
                date: new Date(),
                details: 'Données extraites par IA',
                timestamp: Date.now(),
                utilisateur: {
                    id: 'system_ia',
                    nom: 'SYSTEM',
                    prenom: 'IA',
                    role: 'system'
                }
            })
        };
        
        // SI c'est un décompte groupé, s'assurer que les clients sont au niveau racine
        if (donneesExtraites.typeDecompte === 'groupe' && donneesExtraites.extractionIA?.donneesBrutes?.clients) {
            updateData.clients = donneesExtraites.extractionIA.donneesBrutes.clients.map(c => ({
                nom: c.ClientNom || null,
                prenom: c.ClientPrenom || null,
                numeroSecuriteSociale: c.NumeroSecuriteSociale || null,
                numeroAdherent: c.NumeroAdherent || null,
                montantRemboursement: c.Montant || 0
            }));
        }
        
        await updateDoc(decompteRef, updateData);
        
        // ❌ LIGNE SUPPRIMÉE : await this.ajouterHistorique(...)
        
        console.log('✅ Données extraites ajoutées au décompte');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur ajout données extraites:', error);
        throw error;
    }
}
    
    /**
     * Changer le statut d'un décompte
     * @param {string} decompteId - ID du décompte
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} options - Options (motif, etc.)
     * @returns {Promise<void>}
     */
    static async changerStatut(decompteId, nouveauStatut, options = {}) {
        const { serverTimestamp, arrayUnion } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Récupérer le décompte actuel
        const decompte = await this.getDecompteById(decompteId);
        if (!decompte) {
            throw new Error('Décompte introuvable');
        }
        
        // Vérifier que le changement est valide
        const statutActuel = decompte.statut;
        const statutSuivantAttendu = CONFIG.STATUTS_INFO[statutActuel]?.suivant;
        
        // Autoriser le passage vers traitement manuel depuis traitement_ia
        const isPassageManuel = statutActuel === CONFIG.STATUTS.TRAITEMENT_IA && 
                                nouveauStatut === CONFIG.STATUTS.TRAITEMENT_MANUEL;
        
        if (nouveauStatut !== CONFIG.STATUTS.SUPPRIME && 
            nouveauStatut !== statutSuivantAttendu && 
            !isPassageManuel) {
            throw new Error(`Passage de ${statutActuel} à ${nouveauStatut} non autorisé`);
        }
        
        // Préparer les mises à jour
        const userInfo = this.getUserInfo();
        const updates = {
            statut: nouveauStatut,
            historique: arrayUnion(
                createHistoriqueEntry(
                    `statut_${nouveauStatut}`,
                    `Statut changé en ${CONFIG.STATUTS_INFO[nouveauStatut].label}`,
                    {
                        id: userInfo.id,
                        nom: userInfo.nom,
                        prenom: userInfo.prenom,
                        role: userInfo.role
                    }
                )
            )
        };
        
        // Mises à jour spécifiques selon le statut
        switch (nouveauStatut) {
            case CONFIG.STATUTS.TRAITEMENT_IA:
                updates['dates.transmissionIA'] = serverTimestamp();
                break;
                
            case CONFIG.STATUTS.TRAITEMENT_EFFECTUE:
                updates['dates.traitementEffectue'] = serverTimestamp();
                updates['intervenants.traitePar'] = userInfo;
                break;
                
            case CONFIG.STATUTS.TRAITEMENT_MANUEL:
                updates['dates.traitementManuel'] = serverTimestamp();
                updates['intervenants.traitePar'] = userInfo;
                if (options.motif) {
                    updates.motifTraitementManuel = options.motif;
                }
                break;
                
            case CONFIG.STATUTS.RAPPROCHEMENT_BANCAIRE:
                updates['dates.rapprochementBancaire'] = serverTimestamp();
                updates['intervenants.rapprochePar'] = userInfo;
                break;
                
            case CONFIG.STATUTS.SUPPRIME:
                updates.suppression = {
                    date: serverTimestamp(),
                    par: userInfo,
                    motif: options.motif || 'Non spécifié'
                };
                break;
        }
        
        // Effectuer la mise à jour
        await this.updateDecompte(decompteId, updates);
        
        console.log(`✅ Statut changé: ${statutActuel} → ${nouveauStatut}`);
    }
    
    /**
     * Supprimer un décompte (soft delete)
     * @param {string} decompteId - ID du décompte
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerDecompte(decompteId, infos = {}) {
        try {
            await this.changerStatut(decompteId, CONFIG.STATUTS.SUPPRIME, {
                motif: infos.motif || 'Suppression manuelle'
            });
            
            console.log('✅ Décompte supprimé (soft delete):', decompteId);
            
        } catch (error) {
            console.error('❌ Erreur suppression décompte:', error);
            throw new Error('Impossible de supprimer le décompte : ' + error.message);
        }
    }
    
    /**
     * Obtenir les statistiques
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        const decomptes = await this.getDecomptes({ limite: 1000 });
        
        const stats = {
            total: 0,
            parStatut: {},
            parMutuelle: {},
            montantTotal: 0,
            montantMoyen: 0
        };
        
        decomptes.forEach(decompte => {
            // Exclure les décomptes supprimés des stats
            if (decompte.statut === CONFIG.STATUTS.SUPPRIME) {
                return;
            }
            
            stats.total++;
            
            // Par statut
            stats.parStatut[decompte.statut] = (stats.parStatut[decompte.statut] || 0) + 1;
            
            // Par mutuelle
            if (decompte.mutuelle) {
                stats.parMutuelle[decompte.mutuelle] = (stats.parMutuelle[decompte.mutuelle] || 0) + 1;
            }
            
            // Montants
            stats.montantTotal += decompte.montantVirement || 0;
        });
        
        // Montant moyen
        stats.montantMoyen = stats.total > 0 ? stats.montantTotal / stats.total : 0;
        
        console.log('📈 Statistiques calculées:', stats);
        return stats;
    }
    
    /**
     * Charger les magasins depuis Firestore
     * @returns {Promise<Array>} Liste des magasins
     */
    static async chargerMagasins() {
        const { collection, getDocs, query, where } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Créer une requête pour récupérer TOUS les magasins actifs
        const magasinsRef = collection(db, 'magasins');
        const q = query(magasinsRef, where('actif', '==', true));
        
        // Récupérer TOUS les documents
        const magasinsSnapshot = await getDocs(q);
        const magasinsArray = [];
        
        console.log(`📊 ${magasinsSnapshot.size} magasins trouvés dans Firestore`);
        
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            
            magasinsArray.push({
                FINESS: data.numeroFINESS || '',
                'CODE MAGASIN': data.code || doc.id,
                SOCIETE: data.societe?.raisonSociale || '',
                ADRESSE: `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                VILLE: data.adresse?.ville || ''
            });
        });
        
        // Stocker en localStorage pour utilisation ultérieure
        localStorage.setItem('orixis_magasins', JSON.stringify(
            magasinsArray.reduce((acc, mag) => {
                acc[mag['CODE MAGASIN']] = {
                    numeroFINESS: mag.FINESS,
                    societe: { raisonSociale: mag.SOCIETE },
                    adresse: { ville: mag.VILLE }
                };
                return acc;
            }, {})
        ));
        
        return magasinsArray;
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Générer un numéro de décompte unique
     * Format: DEC-AAAAMMJJ-XXXX
     */
    static async genererNumeroDecompte() {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const date = new Date();
            const annee = date.getFullYear();
            const mois = String(date.getMonth() + 1).padStart(2, '0');
            const jour = String(date.getDate()).padStart(2, '0');
            const dateStr = `${annee}${mois}${jour}`;
            const prefix = `DEC-${dateStr}`;
            
            // Chercher le dernier numéro du jour
            const q = query(
                collection(db, CONFIG.COLLECTION_NAME),
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
            
            const numero = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
            console.log('📋 Numéro généré:', numero);
            
            return numero;
            
        } catch (error) {
            console.error('⚠️ Erreur génération numéro, fallback:', error);
            // Fallback avec timestamp
            return `DEC-${Date.now()}`;
        }
    }
    
    /**
     * Obtenir les infos utilisateur
     * @private
     */
    static getUserInfo() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        return {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien',
            name: `${auth.collaborateur?.prenom || ''} ${auth.collaborateur?.nom || ''}`.trim() || 'Inconnu',
            magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX',
            societe: auth.raisonSociale || auth.societe || 'NON_DEFINI'
        };
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    creerDecompte: DecompteFirestoreService.creerDecompte.bind(DecompteFirestoreService),
    getDecomptes: DecompteFirestoreService.getDecomptes.bind(DecompteFirestoreService),
    getDecompteById: DecompteFirestoreService.getDecompteById.bind(DecompteFirestoreService),
    updateDecompte: DecompteFirestoreService.updateDecompte.bind(DecompteFirestoreService),
    ajouterDonneesExtraites: DecompteFirestoreService.ajouterDonneesExtraites.bind(DecompteFirestoreService),
    changerStatut: DecompteFirestoreService.changerStatut.bind(DecompteFirestoreService),
    supprimerDecompte: DecompteFirestoreService.supprimerDecompte.bind(DecompteFirestoreService),
    getStatistiques: DecompteFirestoreService.getStatistiques.bind(DecompteFirestoreService),
    chargerMagasins: DecompteFirestoreService.chargerMagasins.bind(DecompteFirestoreService),
    STATUTS: CONFIG.STATUTS,
    STATUTS_INFO: CONFIG.STATUTS_INFO
};

/* ========================================
   HISTORIQUE
   
   [08/02/2025] - Création
   - Service dédié au CRUD Firestore
   - Utilise le template pour garantir la structure
   - Gestion complète du workflow
   - Historique automatique
   ======================================== */