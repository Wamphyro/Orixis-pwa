// ========================================
// DECOMPTE-MUTUELLE.FIRESTORE.SERVICE.JS - 🔥 SERVICE FIRESTORE
// Chemin: modules/test/decompte-mutuelle.firestore.service.js
//
// DESCRIPTION:
// Service CRUD pour les décomptes mutuelles dans Firestore
// Gère la création, lecture, mise à jour et suppression
//
// VERSION: 2.1.0 - CORRIGÉE
// DATE: 08/02/2025
//
// CORRECTIONS APPORTÉES:
// ✅ Import arrayUnion ajouté dans ajouterDonneesExtraites (ligne 426)
// ✅ Recherche doublons améliorée pour groupes (ligne 569)
// ✅ Suppression de l'appel redondant ajouterHistorique
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { DECOMPTE_TEMPLATE, createNewDecompte, createHistoriqueEntry } from './decompte-mutuelle.template.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    COLLECTION_NAME: 'decomptesMutuelles',
    
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
     * VERSION CORRIGÉE avec import arrayUnion
     * @param {string} decompteId - ID du décompte
     * @param {Object} donnees - Données extraites
     */
    static async ajouterDonneesExtraites(decompteId, donneesExtraites) {
        try {
            // ✅ CORRECTION : Import de arrayUnion ajouté
            const { doc, updateDoc, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const decompteRef = doc(db, 'decomptesMutuelles', decompteId);
            
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
                // ✅ Utilisation correcte de arrayUnion maintenant importé
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
     * Supprimer DÉFINITIVEMENT un décompte
     * @param {string} decompteId - ID du décompte
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerDecompte(decompteId, infos = {}) {
        try {
            const { doc, deleteDoc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Récupérer le décompte pour avoir les chemins des fichiers
            const docRef = doc(db, CONFIG.COLLECTION_NAME, decompteId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error('Décompte introuvable');
            }
            
            const decompteData = docSnap.data();
            console.log('🗑️ Suppression définitive du décompte:', decompteData.numeroDecompte);
            
            // Récupérer les chemins des documents
            const documents = decompteData.documents || [];
            const erreursSuppression = [];
            
            // Supprimer chaque fichier dans Storage
            if (documents.length > 0) {
                console.log(`🗑️ Suppression de ${documents.length} fichier(s) dans Storage...`);
                
                for (const document of documents) {
                    try {
                        if (document.chemin) {
                            // Importer les fonctions Storage
                            const { ref, deleteObject } = await import(
                                'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
                            );
                            const { storage } = await import('../../src/services/firebase.service.js');
                            
                            const storageRef = ref(storage, document.chemin);
                            await deleteObject(storageRef);
                            console.log(`✅ Fichier supprimé: ${document.nom}`);
                        }
                    } catch (error) {
                        console.error(`❌ Erreur suppression fichier ${document.nom}:`, error);
                        erreursSuppression.push(document.nom);
                    }
                }
            }
            
            // Avertir si des fichiers n'ont pas pu être supprimés
            if (erreursSuppression.length > 0) {
                console.warn(`⚠️ ${erreursSuppression.length} fichier(s) non supprimé(s)`);
            }
            
            // Supprimer définitivement le document Firestore
            await deleteDoc(docRef);
            console.log('✅ Document Firestore supprimé définitivement');
            
            // Log pour audit (optionnel)
            console.log('🔍 Audit suppression:', {
                decompteId: decompteId,
                numeroDecompte: decompteData.numeroDecompte,
                suppressionPar: infos.par || 'unknown',
                date: new Date().toISOString(),
                motif: infos.motif || 'Suppression manuelle',
                fichiersSupprimés: documents.length - erreursSuppression.length,
                fichiersEnErreur: erreursSuppression.length
            });
            
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
     * Vérifier si un hash existe déjà
     * @param {string} hash - Hash SHA-256 du document
     * @returns {Promise<Object|null>} Le décompte trouvé ou null
     */
    static async verifierHashExiste(hash) {
        try {
            if (!hash) return null;
            
            const { collection, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('🔍 Vérification du hash:', hash.substring(0, 12) + '...');
            
            // Récupérer tous les décomptes récents
            const snapshot = await getDocs(collection(db, CONFIG.COLLECTION_NAME));
            
            // Parcourir et chercher le hash dans les documents
            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // Vérifier si un des documents a ce hash
                if (data.documents && Array.isArray(data.documents)) {
                    for (const document of data.documents) {
                        if (document.hash === hash) {
                            console.log('⚠️ Doublon trouvé:', doc.id);
                            return {
                                id: doc.id,
                                numeroDecompte: data.numeroDecompte,
                                client: data.client,
                                montantVirement: data.montantVirement,
                                statut: data.statut,
                                dateUpload: document.dateUpload || data.dates?.creation
                            };
                        }
                    }
                }
            }
            
            console.log('✅ Hash non trouvé (pas de doublon)');
            return null;
            
        } catch (error) {
            console.error('❌ Erreur vérification hash:', error);
            return null;
        }
    }

    /**
     * Rechercher les doublons probables avec score
     * VERSION CORRIGÉE : Gestion complète des décomptes groupés
     * @param {Object} donnees - Données à comparer
     * @returns {Promise<Array>} Liste des doublons potentiels avec score
     */
    static async rechercherDoublonsProbables(donnees) {
        try {
            const { collection, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('🔍 Recherche de doublons probables...');
            console.log('🔍 Données recherchées:', donnees);
            
            // Normaliser les données recherchées
            const clientRecherche = donnees.client ? 
                `${donnees.client.prenom || ''} ${donnees.client.nom || ''}`.toUpperCase().trim() : '';
            const montantRecherche = parseFloat(donnees.montantVirement || donnees.montantRemboursementClient || 0);
            const mutuelleRecherche = (donnees.mutuelle || '').toUpperCase().trim();
            const magasinRecherche = (donnees.codeMagasin || '').toUpperCase().trim();
            
            // Récupérer tous les décomptes
            const snapshot = await getDocs(collection(db, CONFIG.COLLECTION_NAME));
            
            const doublonsPotentiels = [];
            
            // ✅ CAS A : On recherche UN SEUL client (décompte individuel)
            if (donnees.client && !donnees.clients) {
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    
                    // Ignorer les décomptes supprimés
                    if (data.statut === 'supprime') continue;
                    
                    let scoreMax = 0;
                    let detailsMax = [];
                    
                    // Vérifier le client principal (décompte unitaire)
                    if (data.client && !data.clients) {
                        const clientExistant = `${data.client.prenom || ''} ${data.client.nom || ''}`.toUpperCase().trim();
                        if (clientExistant === clientRecherche) {
                            let score = 40;
                            let details = [`Client identique: ${data.client.prenom} ${data.client.nom}`];
                            
                            const montantExistant = parseFloat(data.montantRemboursementClient || data.montantVirement || 0);
                            if (montantRecherche > 0 && Math.abs(montantExistant - montantRecherche) < 0.01) {
                                score += 30;
                                details.push('Montant identique');
                            }
                            
                            if (mutuelleRecherche && data.mutuelle) {
                                const mutuelleExistante = (data.mutuelle || '').toUpperCase().trim();
                                if (mutuelleExistante === mutuelleRecherche) {
                                    score += 20;
                                    details.push('Mutuelle identique');
                                }
                            }
                            
                            if (magasinRecherche && data.codeMagasin) {
                                const magasinExistant = (data.codeMagasin || '').toUpperCase().trim();
                                if (magasinExistant === magasinRecherche) {
                                    score += 10;
                                    details.push('Magasin identique');
                                }
                            }
                            
                            scoreMax = Math.min(score, 100);
                            detailsMax = details;
                        }
                    }
                    
                    // Vérifier dans le tableau clients[] (décompte groupé)
                    if (data.clients && Array.isArray(data.clients)) {
                        for (const clientGroupe of data.clients) {
                            const clientExistant = `${clientGroupe.prenom || ''} ${clientGroupe.nom || ''}`.toUpperCase().trim();
                            
                            if (clientExistant === clientRecherche) {
                                let score = 40;
                                let details = [`Client trouvé dans décompte groupé (${data.clients.length} clients)`];
                                
                                const montantClient = parseFloat(
                                    clientGroupe.montantRemboursement || 
                                    clientGroupe.montantRemboursementClient || 
                                    clientGroupe.montant || 
                                    0
                                );
                                
                                if (montantRecherche > 0 && Math.abs(montantClient - montantRecherche) < 0.01) {
                                    score += 30;
                                    details.push('Montant identique');
                                }
                                
                                if (mutuelleRecherche && data.mutuelle) {
                                    const mutuelleExistante = (data.mutuelle || '').toUpperCase().trim();
                                    if (mutuelleExistante === mutuelleRecherche) {
                                        score += 20;
                                        details.push('Mutuelle identique');
                                    }
                                }
                                
                                if (magasinRecherche && data.codeMagasin) {
                                    const magasinExistant = (data.codeMagasin || '').toUpperCase().trim();
                                    if (magasinExistant === magasinRecherche) {
                                        score += 10;
                                        details.push('Magasin identique');
                                    }
                                }
                                
                                scoreMax = Math.min(score, 100);
                                detailsMax = details;
                                break; // Un seul client trouvé suffit
                            }
                        }
                    }
                    
                    // Si score significatif, ajouter aux doublons
                    if (scoreMax >= 40) {
                        doublonsPotentiels.push({
                            id: doc.id,
                            score: scoreMax,
                            details: detailsMax,
                            numeroDecompte: data.numeroDecompte,
                            client: data.client,
                            clients: data.clients,
                            typeDecompte: data.typeDecompte || (data.clients && data.clients.length > 1 ? 'groupe' : 'individuel'),
                            nombreClients: data.nombreClients || data.clients?.length || 1,
                            montantVirement: data.montantVirement,
                            mutuelle: data.mutuelle,
                            codeMagasin: data.codeMagasin,
                            statut: data.statut
                        });
                    }
                }
            }

            // ✅ CAS B : On recherche UN GROUPE de clients
            if (donnees.clients && Array.isArray(donnees.clients)) {
                const clientsRecherches = donnees.clients.map(c => 
                    `${c.prenom || ''} ${c.nom || ''}`.toUpperCase().trim()
                );
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    if (data.statut === 'supprime') continue;
                    
                    let clientsTrouves = 0;
                    let details = [];
                    let clientsCorrespondants = [];
                    
                    // Vérifier contre des décomptes individuels
                    if (data.client && !data.clients) {
                        const clientExistant = `${data.client.prenom || ''} ${data.client.nom || ''}`.toUpperCase().trim();
                        
                        if (clientsRecherches.includes(clientExistant)) {
                            clientsTrouves++;
                            clientsCorrespondants.push(`${data.client.prenom} ${data.client.nom}`);
                        }
                    }
                    
                    // Vérifier contre d'autres groupes
                    if (data.clients && Array.isArray(data.clients)) {
                        for (const clientGroupe of data.clients) {
                            const clientExistant = `${clientGroupe.prenom || ''} ${clientGroupe.nom || ''}`.toUpperCase().trim();
                            
                            if (clientsRecherches.includes(clientExistant)) {
                                clientsTrouves++;
                                clientsCorrespondants.push(`${clientGroupe.prenom} ${clientGroupe.nom}`);
                            }
                        }
                    }
                    
                    // Calculer le score basé sur le % de clients trouvés
                    if (clientsTrouves > 0) {
                        const pourcentage = (clientsTrouves / donnees.clients.length) * 100;
                        let score = Math.round(pourcentage * 0.7); // 70% du score basé sur les clients
                        
                        details.push(`${clientsTrouves}/${donnees.clients.length} client(s) déjà existant(s)`);
                        if (clientsCorrespondants.length > 0) {
                            details.push(`Clients trouvés: ${clientsCorrespondants.join(', ')}`);
                        }
                        
                        // Bonus si même mutuelle
                        if (mutuelleRecherche && data.mutuelle) {
                            const mutuelleExistante = (data.mutuelle || '').toUpperCase().trim();
                            if (mutuelleExistante === mutuelleRecherche) {
                                score += 20;
                                details.push('Même mutuelle');
                            }
                        }
                        
                        // Bonus si même magasin
                        if (magasinRecherche && data.codeMagasin) {
                            const magasinExistant = (data.codeMagasin || '').toUpperCase().trim();
                            if (magasinExistant === magasinRecherche) {
                                score += 10;
                                details.push('Même magasin');
                            }
                        }
                        
                        if (score >= 40) {
                            doublonsPotentiels.push({
                                id: doc.id,
                                score: Math.min(score, 100),
                                details: details,
                                numeroDecompte: data.numeroDecompte,
                                client: data.client,
                                clients: data.clients,
                                typeDecompte: data.typeDecompte || (data.clients ? 'groupe' : 'individuel'),
                                nombreClients: data.nombreClients || data.clients?.length || 1,
                                montantVirement: data.montantVirement,
                                mutuelle: data.mutuelle,
                                codeMagasin: data.codeMagasin,
                                statut: data.statut,
                                clientsTrouves: clientsTrouves,
                                pourcentageCorrespondance: pourcentage
                            });
                        }
                    }
                }
            }
            
            // Trier par score décroissant
            doublonsPotentiels.sort((a, b) => b.score - a.score);
            
            console.log(`📊 ${doublonsPotentiels.length} doublon(s) potentiel(s) trouvé(s)`);
            if (doublonsPotentiels.length > 0) {
                console.log('🔍 Premier doublon:', doublonsPotentiels[0]);
            }
            
            return doublonsPotentiels;
            
        } catch (error) {
            console.error('❌ Erreur recherche doublons:', error);
            return [];
        }
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
    verifierHashExiste: DecompteFirestoreService.verifierHashExiste.bind(DecompteFirestoreService),
    rechercherDoublonsProbables: DecompteFirestoreService.rechercherDoublonsProbables.bind(DecompteFirestoreService),
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
   
   [08/02/2025] - v2.1.0 CORRECTIONS
   ✅ Import arrayUnion ajouté dans ajouterDonneesExtraites
   ✅ Recherche doublons améliorée pour groupes
   ✅ Gestion complète individuel vs groupe
   
   [08/02/2025] - v2.0.0 Création
   - Service dédié au CRUD Firestore
   - Utilise le template pour garantir la structure
   - Gestion complète du workflow
   - Historique automatique
   ======================================== */