// ========================================
// COMMANDES.FIRESTORE.SERVICE.JS - 🔥 SERVICE FIRESTORE
// Chemin: modules/commandes/commandes.firestore.service.js
//
// DESCRIPTION:
// Service CRUD pour les commandes dans Firestore
// Gère la création, lecture, mise à jour et suppression
// PAS DE LOGIQUE MÉTIER - Uniquement des opérations Firestore
//
// VERSION: 1.0.0
// DATE: 09/08/2025
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { COMMANDE_TEMPLATE, createNewCommande, createHistoriqueEntry } from './commandes.template.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    COLLECTION_NAME: 'commandes',
    
    // Statuts possibles (pour validation)
    STATUTS: {
        NOUVELLE: 'nouvelle',
        PREPARATION: 'preparation',
        TERMINEE: 'terminee',
        EXPEDIEE: 'expediee',
        RECEPTIONNEE: 'receptionnee',
        LIVREE: 'livree',
        ANNULEE: 'annulee',
        SUPPRIME: 'supprime'
    }
};

// ========================================
// CLASSE DU SERVICE
// ========================================

export class CommandeFirestoreService {
    
    // ========================================
    // MÉTHODES CRUD PRINCIPALES
    // ========================================
    
    /**
     * Créer une nouvelle commande
     * @param {Object} data - Données de la commande
     * @returns {Promise<string>} ID de la commande créée
     */
    static async creerCommande(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Générer le numéro de commande
            const numeroCommande = await this.genererNumeroCommande();
            
            // Récupérer les infos utilisateur
            const userInfo = this.getUserInfo();
            
            console.log('🔍 DEBUG création commande:', { userInfo, data });
            
            // Créer une nouvelle commande basée sur le template
            const commandeData = createNewCommande();
            
            // Remplir les données
            commandeData.numeroCommande = numeroCommande;
            commandeData.statut = CONFIG.STATUTS.NOUVELLE;
            
            // Client - MODIFICATION ICI : UTILISER L'OBJET CLIENT DIRECTEMENT
            if (data.client) {
                // ✅ UTILISER DIRECTEMENT L'OBJET CLIENT PASSÉ
                commandeData.client = {
                    id: data.client.id || data.clientId || '',
                    nom: data.client.nom || '',
                    prenom: data.client.prenom || '',
                    telephone: data.client.telephone || '',
                    email: data.client.email || ''
                };
                commandeData.magasinReference = data.client.magasinReference || userInfo.magasin;
                
                console.log('✅ Client utilisé directement:', commandeData.client);
                
            } else if (data.clientId) {
                // FALLBACK : Si on n'a que l'ID, tenter de récupérer
                console.log('⚠️ Pas d\'objet client, tentative avec ID:', data.clientId);
                const client = await this.getClientInfo(data.clientId);
                
                if (client) {
                    commandeData.client = {
                        id: data.clientId,
                        nom: client.nom || '',
                        prenom: client.prenom || '',
                        telephone: client.telephone || '',
                        email: client.email || ''
                    };
                    commandeData.magasinReference = client.magasinReference || userInfo.magasin;
                } else {
                    // Si on ne trouve pas le client, utiliser des valeurs vides
                    console.warn('⚠️ Client introuvable avec ID:', data.clientId);
                    commandeData.client = {
                        id: data.clientId,
                        nom: '',
                        prenom: '',
                        telephone: '',
                        email: ''
                    };
                    commandeData.magasinReference = userInfo.magasin;
                }
            }
            
            // Produits
            commandeData.produits = data.produits || [];
            commandeData.nombreProduits = commandeData.produits.length;
            
            // Type et urgence
            commandeData.typePreparation = data.typePreparation || 'accessoire';
            commandeData.niveauUrgence = data.niveauUrgence || 'normal';
            
            // Livraison
            commandeData.magasinLivraison = data.magasinLivraison || userInfo.magasin;
            commandeData.dates.livraisonPrevue = data.dateLivraison || null;
            commandeData.commentaires = data.commentaires || '';
            
            // Dates
            commandeData.dates.commande = serverTimestamp();
            
            // Intervenants
            commandeData.intervenants.commandePar = {
                id: userInfo.id,
                nom: userInfo.nom,
                prenom: userInfo.prenom,
                role: userInfo.role
            };
            
            // Historique initial
            commandeData.historique = [
                createHistoriqueEntry(
                    'creation',
                    'Commande créée',
                    commandeData.intervenants.commandePar
                )
            ];
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, CONFIG.COLLECTION_NAME), commandeData);
            
            console.log('✅ Commande créée:', numeroCommande, 'ID:', docRef.id);
            console.log('📋 Avec client:', commandeData.client);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création commande:', error);
            throw new Error(`Erreur lors de la création: ${error.message}`);
        }
    }
    
/**
 * Récupérer les commandes avec filtres
 * @param {Object} filtres - Filtres optionnels
 * @returns {Promise<Array>} Liste des commandes
 */
static async getCommandes(filtres = {}) {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        let q = collection(db, CONFIG.COLLECTION_NAME);
        const constraints = [];
        
        // Construire la requête avec les filtres
        if (filtres.statut) {
            constraints.push(where('statut', '==', filtres.statut));
        }
        
        if (filtres.magasin) {
            constraints.push(where('magasinLivraison', '==', filtres.magasin));
        }
        
        if (filtres.urgence) {
            constraints.push(where('niveauUrgence', '==', filtres.urgence));
        }
        
        if (filtres.clientId) {
            constraints.push(where('client.id', '==', filtres.clientId));
        }
        
        // ⚠️ MODIFICATION ICI - On commente le filtre problématique
        // Pour exclure les commandes supprimées, on filtrera après récupération
        /*
        if (!filtres.includeDeleted) {
            constraints.push(where('statut', '!=', CONFIG.STATUTS.SUPPRIME));
        }
        */
        
        // Tri par défaut : plus récent en premier
        constraints.push(orderBy('dates.commande', 'desc'));
        
        if (filtres.limite) {
            constraints.push(limit(filtres.limite));
        }
        
        // Appliquer les contraintes
        if (constraints.length > 0) {
            q = query(q, ...constraints);
        }
        
        // Exécuter la requête
        const snapshot = await getDocs(q);
        
        const commandes = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // ⚠️ FILTRAGE MANUEL - On exclut les supprimées après récupération
            if (!filtres.includeDeleted && data.statut === CONFIG.STATUTS.SUPPRIME) {
                return; // On skip les commandes supprimées
            }
            
            commandes.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`📊 ${commandes.length} commandes trouvées`);
        return commandes;
        
    } catch (error) {
        console.error('❌ Erreur récupération commandes:', error);
        return [];
    }
}
    
    /**
     * Récupérer une commande par ID
     * @param {string} id - ID de la commande
     * @returns {Promise<Object|null>} La commande ou null
     */
    static async getCommandeById(id) {
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
            
            console.warn(`⚠️ Commande ${id} introuvable`);
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération commande:', error);
            return null;
        }
    }
    
    /**
     * Mettre à jour une commande
     * @param {string} id - ID de la commande
     * @param {Object} updates - Mises à jour
     * @returns {Promise<void>}
     */
    static async updateCommande(id, updates) {
        try {
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
                        'Commande mise à jour',
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
            console.log('✅ Commande mise à jour:', id);
            
        } catch (error) {
            console.error('❌ Erreur mise à jour commande:', error);
            throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }
    }
    
    /**
     * Changer le statut d'une commande
     * @param {string} commandeId - ID de la commande
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} options - Options supplémentaires
     * @returns {Promise<void>}
     */
    static async changerStatut(commandeId, nouveauStatut, options = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Récupérer la commande actuelle
            const commande = await this.getCommandeById(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Préparer les mises à jour
            const userInfo = this.getUserInfo();
            const updates = {
                statut: nouveauStatut,
                historique: arrayUnion(
                    createHistoriqueEntry(
                        `statut_${nouveauStatut}`,
                        `Statut changé en ${nouveauStatut}`,
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
                case CONFIG.STATUTS.PREPARATION:
                    updates['dates.preparationDebut'] = serverTimestamp();
                    updates['intervenants.gerePar'] = userInfo;
                    break;
                    
                case CONFIG.STATUTS.TERMINEE:
                    updates['dates.preparationFin'] = serverTimestamp();
                    break;
                    
                case CONFIG.STATUTS.EXPEDIEE:
                    updates['dates.expeditionValidee'] = serverTimestamp();
                    if (options.numeroSuivi) {
                        updates['expedition.envoi.numeroSuivi'] = options.numeroSuivi;
                        updates['expedition.envoi.transporteur'] = options.transporteur || 'Colissimo';
                        updates['expedition.envoi.dateEnvoi'] = serverTimestamp();
                        updates['expedition.envoi.scanPar'] = userInfo;
                    }
                    break;
                    
                case CONFIG.STATUTS.RECEPTIONNEE:
                    updates['dates.receptionValidee'] = serverTimestamp();
                    updates['expedition.reception.dateReception'] = serverTimestamp();
                    updates['expedition.reception.recuPar'] = userInfo;
                    if (options.numeroSuiviRecu) {
                        updates['expedition.reception.numeroSuiviRecu'] = options.numeroSuiviRecu;
                    }
                    break;
                    
                case CONFIG.STATUTS.LIVREE:
                    updates['dates.livraisonClient'] = serverTimestamp();
                    updates['intervenants.livrePar'] = userInfo;
                    break;
                    
                case CONFIG.STATUTS.ANNULEE:
                    updates.annulation = {
                        date: serverTimestamp(),
                        par: userInfo,
                        motif: options.motif || 'Non spécifié',
                        etapeAuMomentAnnulation: commande.statut
                    };
                    break;
                    
                case CONFIG.STATUTS.SUPPRIME:
                    updates.suppression = {
                        date: serverTimestamp(),
                        par: userInfo,
                        motif: options.motif || 'Suppression manuelle'
                    };
                    break;
            }
            
            // Effectuer la mise à jour
            await updateDoc(doc(db, CONFIG.COLLECTION_NAME, commandeId), updates);
            
            console.log(`✅ Statut changé: ${commande.statut} → ${nouveauStatut}`);
            
        } catch (error) {
            console.error('❌ Erreur changement statut:', error);
            throw new Error(`Erreur lors du changement de statut: ${error.message}`);
        }
    }
    
    /**
     * Supprimer une commande (soft delete)
     * @param {string} commandeId - ID de la commande
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerCommande(commandeId, infos = {}) {
        try {
            await this.changerStatut(commandeId, CONFIG.STATUTS.SUPPRIME, {
                motif: infos.motif || 'Suppression manuelle'
            });
            
            console.log('✅ Commande supprimée (soft delete):', commandeId);
            
        } catch (error) {
            console.error('❌ Erreur suppression commande:', error);
            throw new Error('Impossible de supprimer la commande : ' + error.message);
        }
    }
    
    /**
     * Mettre à jour les numéros de série
     * @param {string} commandeId - ID de la commande
     * @param {Object} numerosSerie - Numéros de série par produit
     * @returns {Promise<void>}
     */
    static async mettreAJourNumerosSerie(commandeId, numerosSerie) {
        try {
            const { doc, updateDoc, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Récupérer la commande actuelle
            const commande = await this.getCommandeById(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Mettre à jour les produits avec les NS
            const produitsMAJ = commande.produits.map((produit, index) => {
                if (numerosSerie[index]) {
                    produit.numeroSerie = numerosSerie[index];
                }
                return produit;
            });
            
            const userInfo = this.getUserInfo();
            const updates = {
                produits: produitsMAJ,
                numerosSerieAssignes: numerosSerie,
                historique: arrayUnion(
                    createHistoriqueEntry(
                        'numeros_serie',
                        'Numéros de série assignés',
                        userInfo
                    )
                )
            };
            
            await updateDoc(doc(db, CONFIG.COLLECTION_NAME, commandeId), updates);
            
            console.log('✅ Numéros de série mis à jour');
            
        } catch (error) {
            console.error('❌ Erreur mise à jour NS:', error);
            throw new Error(`Erreur lors de la mise à jour des NS: ${error.message}`);
        }
    }
    
    /**
     * Obtenir les statistiques
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const commandes = await this.getCommandes({ limite: 1000 });
            
            const stats = {
                total: 0,
                parStatut: {},
                parUrgence: {},
                parMagasin: {}
            };
            
            commandes.forEach(commande => {
                // Exclure les commandes supprimées des stats
                if (commande.statut === CONFIG.STATUTS.SUPPRIME) {
                    return;
                }
                
                stats.total++;
                
                // Par statut
                stats.parStatut[commande.statut] = (stats.parStatut[commande.statut] || 0) + 1;
                
                // Par urgence
                if (commande.niveauUrgence) {
                    stats.parUrgence[commande.niveauUrgence] = (stats.parUrgence[commande.niveauUrgence] || 0) + 1;
                }
                
                // Par magasin
                if (commande.magasinLivraison) {
                    stats.parMagasin[commande.magasinLivraison] = (stats.parMagasin[commande.magasinLivraison] || 0) + 1;
                }
            });
            
            console.log('📈 Statistiques calculées:', stats);
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parUrgence: {},
                parMagasin: {}
            };
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES / HELPERS
    // ========================================
    
    /**
     * Générer un numéro de commande unique
     * Format: CMD-AAAAMMJJ-XXXX
     * @private
     */
    static async genererNumeroCommande() {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const date = new Date();
            const annee = date.getFullYear();
            const mois = String(date.getMonth() + 1).padStart(2, '0');
            const jour = String(date.getDate()).padStart(2, '0');
            const dateStr = `${annee}${mois}${jour}`;
            const prefix = `CMD-${dateStr}`;
            
            // Chercher le dernier numéro du jour
            const q = query(
                collection(db, CONFIG.COLLECTION_NAME),
                where('numeroCommande', '>=', `${prefix}-0000`),
                where('numeroCommande', '<=', `${prefix}-9999`),
                orderBy('numeroCommande', 'desc'),
                limit(1)
            );
            
            const snapshot = await getDocs(q);
            
            let nextNumber = 1;
            if (!snapshot.empty) {
                const lastDoc = snapshot.docs[0].data();
                const lastNumber = parseInt(lastDoc.numeroCommande.split('-')[2]);
                nextNumber = lastNumber + 1;
            }
            
            const numero = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
            console.log('📋 Numéro généré:', numero);
            
            return numero;
            
        } catch (error) {
            console.error('⚠️ Erreur génération numéro, fallback:', error);
            // Fallback avec timestamp
            return `CMD-${Date.now()}`;
        }
    }
    
    /**
     * Obtenir les infos d'un client
     * @private
     */
    static async getClientInfo(clientId) {
        try {
            if (!clientId) {
                console.warn('⚠️ Pas d\'ID client fourni');
                return null;
            }
            
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('🔍 Recherche du client dans Firestore:', clientId);
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            
            if (clientDoc.exists()) {
                const data = clientDoc.data();
                console.log('✅ Client trouvé dans Firestore:', data.nom, data.prenom);
                return { 
                    id: clientDoc.id, 
                    ...data 
                };
            }
            
            console.warn('⚠️ Client introuvable dans Firestore:', clientId);
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération client:', error);
            return null;
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
    creerCommande: CommandeFirestoreService.creerCommande.bind(CommandeFirestoreService),
    getCommandes: CommandeFirestoreService.getCommandes.bind(CommandeFirestoreService),
    getCommandeById: CommandeFirestoreService.getCommandeById.bind(CommandeFirestoreService),
    updateCommande: CommandeFirestoreService.updateCommande.bind(CommandeFirestoreService),
    changerStatut: CommandeFirestoreService.changerStatut.bind(CommandeFirestoreService),
    supprimerCommande: CommandeFirestoreService.supprimerCommande.bind(CommandeFirestoreService),
    mettreAJourNumerosSerie: CommandeFirestoreService.mettreAJourNumerosSerie.bind(CommandeFirestoreService),
    getStatistiques: CommandeFirestoreService.getStatistiques.bind(CommandeFirestoreService),
    STATUTS: CONFIG.STATUTS
};

/* ========================================
   HISTORIQUE
   
   [09/08/2025] - v1.0.0 Création
   - Service dédié au CRUD Firestore
   - Pas de logique métier
   - Utilise le template pour garantir la structure
   - Gestion complète du workflow
   - Historique automatique
   ======================================== */