// ========================================
// COMMANDES.SERVICE.JS - Gestion des commandes Firebase + ÉDITION
// Chemin: src/js/services/commandes.service.js
//
// DESCRIPTION:
// Service de gestion des commandes avec Firebase + nouvelles méthodes d'édition
// Modifié le 29/07/2025 : Ajout des méthodes d'édition avec icônes stylo
//
// STRUCTURE:
// 1. Imports et configuration (lignes 15-25)
// 2. Méthodes CRUD principales (lignes 30-200)
// 3. Gestion des statuts (lignes 202-450)
// 4. Méthode de suppression (lignes 452-500)
// 5. NOUVELLES MÉTHODES D'ÉDITION (lignes 502-800)
// 6. Statistiques et helpers (lignes 802-950)
// ========================================

import { db } from './firebase.service.js';
import { ClientsService } from './clients.service.js';
import { ProduitsService } from './produits.service.js';
import { 
    COMMANDES_CONFIG, 
    genererNumeroCommande, 
    getProchainStatut,
    peutEtreAnnulee,
    calculerDelaiLivraison 
} from '../data/commandes.data.js';

/**
 * Service de gestion des commandes
 */
export class CommandesService {
    
    /**
     * Créer une nouvelle commande
     * @param {Object} commandeData - Données de la commande
     * @returns {Promise<string>} ID de la commande créée
     */
    static async creerCommande(commandeData) {
        try {
            // Validation des données essentielles
            if (!commandeData.clientId) {
                throw new Error('Client requis');
            }
            
            if (!commandeData.produits || commandeData.produits.length === 0) {
                throw new Error('Au moins un produit requis');
            }
            
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer les infos du client
            const client = await ClientsService.getClient(commandeData.clientId);
            if (!client) {
                throw new Error('Client introuvable');
            }
            
            // Calculer le prix total
            let prixTotal = 0;
            for (const produit of commandeData.produits) {
                prixTotal += (produit.prixUnitaire || 0) * (produit.quantite || 1);
            }
            
            // Calculer la date de livraison prévue
            const dateLivraisonPrevue = commandeData.dateLivraison || 
                                       calculerDelaiLivraison(commandeData.urgence || 'normal');
            
            // Préparer les données de la commande
            const nouvelleCommande = {
                // Identifiant
                numeroCommande: genererNumeroCommande(),
                
                // Statut initial
                statut: 'nouvelle',
                
                // Client
                client: {
                    id: client.id,
                    nom: client.nom,
                    prenom: client.prenom,
                    telephone: client.telephone || '',
                    email: client.email || ''
                },
                
                // Type et urgence
                typePreparation: commandeData.typePreparation || 'livraison_accessoire',
                niveauUrgence: commandeData.urgence || 'normal',
                
                // Magasins
                magasinReference: client.magasinReference,
                magasinLivraison: commandeData.magasinLivraison || client.magasinReference,
                
                // Produits
                produits: commandeData.produits.map(p => ({
                    id: p.id,
                    reference: p.reference,
                    designation: p.designation,
                    type: p.type || 'consommable',
                    quantite: p.quantite || 1,
                    cote: p.cote || null,
                    numeroSerie: null,
                    prixUnitaire: p.prixUnitaire || 0,
                    necessiteCote: p.necessiteCote || false
                })),
                
                // Prix
                prixTotal: prixTotal,
                
                // Dates
                dates: {
                    commande: serverTimestamp(),
                    livraisonPrevue: dateLivraisonPrevue,
                    preparationDebut: null,
                    preparationFin: null,
                    expeditionValidee: null,
                    receptionValidee: null,
                    livraisonClient: null,
                    patientPrevenu: null
                },
                
                // Statuts
                patientPrevenu: false,
                
                // Intervenants
                intervenants: {
                    commandePar: this.getUtilisateurActuel(),
                    gerePar: null,
                    livrePar: null
                },
                
                // Expédition (si nécessaire)
                expedition: {
                    necessiteExpedition: commandeData.magasinLivraison !== client.magasinReference,
                    envoi: {
                        transporteur: null,
                        numeroSuivi: null,
                        dateEnvoi: null,
                        scanPar: null
                    },
                    reception: {
                        numeroSuiviRecu: null,
                        dateReception: null,
                        recuPar: null,
                        colisConforme: null,
                        commentaires: null
                    }
                },
                
                // Numéros de série (à remplir lors de la préparation)
                numerosSerieAssignes: {
                    droit: null,
                    gauche: null,
                    accessoires: []
                },
                
                // Commentaires
                commentaires: commandeData.commentaires || '',
                
                // Historique (ici on peut utiliser serverTimestamp car pas dans arrayUnion)
                historique: [{
                    date: new Date(),
                    action: 'creation',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Commande créée',
                    timestamp: Date.now()
                }]
            };
            
            // Créer dans Firebase
            const docRef = await addDoc(collection(db, 'commandes'), nouvelleCommande);
            
            console.log('✅ Commande créée:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création commande:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer une commande par son ID
     * @param {string} commandeId - ID de la commande
     * @returns {Promise<Object>} Données de la commande
     */
    static async getCommande(commandeId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const commandeDoc = await getDoc(doc(db, 'commandes', commandeId));
            
            if (commandeDoc.exists()) {
                return { id: commandeDoc.id, ...commandeDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération commande:', error);
            return null;
        }
    }
    
    /**
     * Récupérer les commandes selon des critères
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Array>} Liste des commandes
     */
    static async getCommandes(criteres = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit, or } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let constraints = [];
            
            // Filtrer par magasins autorisés
            const magasinsAutorises = this.getMagasinsAutorises();
            if (magasinsAutorises.length > 0) {
                constraints.push(
                    or(
                        where('magasinReference', 'in', magasinsAutorises),
                        where('magasinLivraison', 'in', magasinsAutorises)
                    )
                );
            }
            
            // Autres filtres
            if (criteres.statut) {
                constraints.push(where('statut', '==', criteres.statut));
            }
            
            if (criteres.urgence) {
                constraints.push(where('niveauUrgence', '==', criteres.urgence));
            }
            
            if (criteres.clientId) {
                constraints.push(where('client.id', '==', criteres.clientId));
            }
            
            // Tri et limite
            constraints.push(orderBy('dates.commande', 'desc'));
            
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            const q = query(collection(db, 'commandes'), ...constraints);
            const snapshot = await getDocs(q);
            
            const commandes = [];
            snapshot.forEach((doc) => {
                commandes.push({ id: doc.id, ...doc.data() });
            });
            
            return commandes;
            
        } catch (error) {
            console.error('❌ Erreur récupération commandes:', error);
            return [];
        }
    }
    
    /**
     * Rechercher des commandes
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Commandes trouvées
     */
    static async rechercherCommandes(recherche) {
        try {
            if (!recherche || recherche.length < 2) {
                return await this.getCommandes({ limite: 50 });
            }
            
            // Récupérer toutes les commandes récentes
            const commandes = await this.getCommandes({ limite: 200 });
            
            const termeRecherche = recherche.toLowerCase();
            
            // Filtrer localement
            return commandes.filter(commande => {
                const clientNom = `${commande.client.prenom} ${commande.client.nom}`.toLowerCase();
                const numero = commande.numeroCommande?.toLowerCase() || '';
                const produits = commande.produits.map(p => p.designation.toLowerCase()).join(' ');
                
                return clientNom.includes(termeRecherche) ||
                       numero.includes(termeRecherche) ||
                       produits.includes(termeRecherche) ||
                       commande.expedition?.envoi?.numeroSuivi?.includes(termeRecherche);
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche commandes:', error);
            return [];
        }
    }
    
    /**
     * Changer le statut d'une commande
     * @param {string} commandeId - ID de la commande
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} donnees - Données additionnelles
     * @returns {Promise<boolean>} Succès du changement
     */
    static async changerStatut(commandeId, nouveauStatut, donnees = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer la commande actuelle
            const commande = await this.getCommande(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Vérifier que le changement est valide
            const statutSuivantAttendu = getProchainStatut(commande.statut);

            // Autoriser la livraison directe (terminee → livree)
            const isLivraisonDirecte = commande.statut === 'terminee' && nouveauStatut === 'livree';

            if (nouveauStatut !== 'annulee' && 
                nouveauStatut !== statutSuivantAttendu && 
                !isLivraisonDirecte) {
                throw new Error(`Passage de ${commande.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                // CORRECTION : Utiliser new Date() au lieu de serverTimestamp() dans arrayUnion
                historique: arrayUnion({
                    date: new Date(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Statut changé en ${COMMANDES_CONFIG.STATUTS[nouveauStatut].label}`,
                    timestamp: Date.now()
                })
            };
            
            // Mises à jour spécifiques selon le statut
            switch (nouveauStatut) {
                case 'preparation':
                    updates['dates.preparationDebut'] = serverTimestamp();
                    updates['intervenants.gerePar'] = this.getUtilisateurActuel();
                    break;
                    
                case 'terminee':
                    updates['dates.preparationFin'] = serverTimestamp();
                    // Vérifier les numéros de série si nécessaire
                    if (donnees.numerosSerieAssignes) {
                        updates.numerosSerieAssignes = donnees.numerosSerieAssignes;
                    }
                    // Vérifier que les NS sont saisis pour les appareils auditifs
                    const appareilsSansNS = commande.produits.filter(p => 
                        (p.type === 'appareil_auditif' || p.necessiteCote) && !p.numeroSerie
                    );
                    if (appareilsSansNS.length > 0) {
                        throw new Error('Les numéros de série sont obligatoires pour tous les appareils auditifs');
                    }
                    break;
                    
                case 'expediee':
                    updates['dates.expeditionValidee'] = serverTimestamp();
                    if (donnees.numeroSuivi) {
                        updates['expedition.envoi.numeroSuivi'] = donnees.numeroSuivi;
                        updates['expedition.envoi.dateEnvoi'] = serverTimestamp();
                        updates['expedition.envoi.scanPar'] = this.getUtilisateurActuel();
                        updates['expedition.envoi.transporteur'] = donnees.transporteur || 'Colissimo';
                    } else {
                        throw new Error('Le numéro de suivi est obligatoire pour l\'expédition');
                    }
                    break;
                    
                case 'receptionnee':
                    // Vérifier d'abord que les numéros correspondent
                    const envoi = commande.expedition?.envoi;
                    if (!envoi || !envoi.numeroSuivi) {
                        throw new Error('Aucune expédition trouvée pour cette commande');
                    }
                    
                    if (!donnees.numeroSuiviRecu) {
                        throw new Error('Le numéro de suivi reçu est obligatoire');
                    }
                    
                    // BLOQUER si les numéros ne correspondent pas
                    if (envoi.numeroSuivi !== donnees.numeroSuiviRecu) {
                        throw new Error(`Les numéros de suivi ne correspondent pas.\n\nEnvoyé : ${envoi.numeroSuivi}\nReçu : ${donnees.numeroSuiviRecu}`);
                    }
                    
                    // Si tout est OK, continuer avec la mise à jour
                    updates['dates.receptionValidee'] = serverTimestamp();
                    updates['expedition.reception.dateReception'] = serverTimestamp();
                    updates['expedition.reception.recuPar'] = this.getUtilisateurActuel();
                    updates['expedition.reception.numeroSuiviRecu'] = donnees.numeroSuiviRecu;
                    updates['expedition.reception.colisConforme'] = donnees.colisConforme !== false;
                    updates['expedition.reception.commentaires'] = donnees.commentairesReception || '';
                    break;
                    
                case 'livree':
                    updates['dates.livraisonClient'] = serverTimestamp();
                    updates['intervenants.livrePar'] = this.getUtilisateurActuel();
                    // Créer les équipements chez le client
                    if (commande.numerosSerieAssignes) {
                        await this.creerEquipementsClient(commande);
                    }
                    break;
                    
                case 'annulee':
                    if (!peutEtreAnnulee(commande.statut)) {
                        throw new Error('Cette commande ne peut plus être annulée');
                    }
                    updates.annulation = {
                        date: serverTimestamp(),
                        par: this.getUtilisateurActuel(),
                        motif: donnees.motif || 'Non spécifié',
                        etapeAuMomentAnnulation: commande.statut
                    };
                    break;
            }
            
            // Effectuer la mise à jour
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log(`✅ Statut changé: ${commande.statut} → ${nouveauStatut}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur changement statut:', error);
            throw error;
        }
    }
    
    /**
     * Supprime une commande (soft delete)
     * Change le statut en "supprime" et enregistre les informations
     * @param {string} commandeId - ID de la commande
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerCommande(commandeId, infos = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer la commande pour vérifier qu'elle existe
            const commande = await this.getCommande(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Vérifier que la commande peut être supprimée
            if (commande.statut === 'supprime') {
                throw new Error('Cette commande est déjà supprimée');
            }
            
            if (commande.statut === 'livree') {
                throw new Error('Impossible de supprimer une commande livrée');
            }
            
            // Récupérer les infos utilisateur
            const utilisateur = this.getUtilisateurActuel();
            
            // Préparer les données de suppression
            const updateData = {
                statut: 'supprime',
                suppression: {
                    date: serverTimestamp(),
                    utilisateur: utilisateur,
                    motif: infos.motif || 'Suppression manuelle',
                    numeroCommandeValide: infos.numeroCommandeValide || '',
                    timestamp: Date.now(),
                    statutAvantSuppression: commande.statut
                },
                // Ajouter à l'historique (sans serverTimestamp dans arrayUnion)
                historique: arrayUnion({
                    date: new Date(),  // Utiliser Date normale au lieu de serverTimestamp
                    action: 'suppression',
                    utilisateur: utilisateur,
                    details: `Commande supprimée (motif: ${infos.motif || 'Suppression manuelle'})`,
                    timestamp: Date.now()
                })
            };
            
            // Effectuer la mise à jour
            const commandeRef = doc(db, 'commandes', commandeId);
            await updateDoc(commandeRef, updateData);
            
            console.log('✅ Commande supprimée (soft delete):', commandeId);
            
        } catch (error) {
            console.error('❌ Erreur suppression commande:', error);
            throw new Error('Impossible de supprimer la commande : ' + error.message);
        }
    }
    
    /**
     * Mettre à jour les numéros de série
     * @param {string} commandeId - ID de la commande
     * @param {Object} numerosSerie - Numéros de série
     * @returns {Promise<boolean>} Succès de la mise à jour
     */
    static async mettreAJourNumerosSerie(commandeId, numerosSerie) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const updates = {
                numerosSerieAssignes: numerosSerie,
                // CORRECTION : Utiliser new Date() au lieu de serverTimestamp()
                historique: arrayUnion({
                    date: new Date(),
                    action: 'numeros_serie',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Numéros de série assignés',
                    timestamp: Date.now()
                })
            };
            
            // Mettre à jour les produits avec les NS
            const commande = await this.getCommande(commandeId);
            if (commande) {
                const produitsMAJ = commande.produits.map(p => {
                    if (p.cote === 'droit' && numerosSerie.droit) {
                        p.numeroSerie = numerosSerie.droit;
                    } else if (p.cote === 'gauche' && numerosSerie.gauche) {
                        p.numeroSerie = numerosSerie.gauche;
                    }
                    return p;
                });
                updates.produits = produitsMAJ;
            }
            
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log('✅ Numéros de série mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour NS:', error);
            throw error;
        }
    }
    
    /**
     * Marquer le patient comme prévenu
     * @param {string} commandeId - ID de la commande
     * @returns {Promise<boolean>} Succès
     */
    static async marquerPatientPrevenu(commandeId) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await updateDoc(doc(db, 'commandes', commandeId), {
                patientPrevenu: true,
                'dates.patientPrevenu': serverTimestamp(),
                // CORRECTION : Utiliser new Date() au lieu de serverTimestamp()
                historique: arrayUnion({
                    date: new Date(),
                    action: 'patient_prevenu',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Patient prévenu de la disponibilité',
                    timestamp: Date.now()
                })
            });
            
            console.log('✅ Patient marqué comme prévenu');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur marquage patient:', error);
            throw error;
        }
    }

    // ========================================
    // NOUVELLES MÉTHODES D'ÉDITION AVEC ICÔNES STYLO
    // Ajoutées le 29/07/2025
    // ========================================

    /**
     * Modifier les informations client d'une commande
     * @param {string} commandeId - ID de la commande
     * @param {Object} donneesClient - Nouvelles données client
     * @returns {Promise<boolean>} Succès de la modification
     */
    static async modifierClient(commandeId, donneesClient) {
        try {
            const { doc, updateDoc, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Valider les données
            if (!donneesClient.nom || !donneesClient.prenom) {
                throw new Error('Nom et prénom obligatoires');
            }
            
            if (donneesClient.telephone && !/^[0-9\s\-\+\.]{10,}$/.test(donneesClient.telephone)) {
                throw new Error('Format de téléphone invalide');
            }
            
            if (donneesClient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donneesClient.email)) {
                throw new Error('Format d\'email invalide');
            }
            
            // Préparer les mises à jour
            const updates = {
                'client.nom': donneesClient.nom.trim(),
                'client.prenom': donneesClient.prenom.trim(),
                'client.telephone': donneesClient.telephone?.trim() || '',
                'client.email': donneesClient.email?.trim() || '',
                historique: arrayUnion({
                    date: new Date(),
                    action: 'modification_client',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Informations client modifiées',
                    timestamp: Date.now()
                })
            };
            
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log('✅ Informations client modifiées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification client:', error);
            throw error;
        }
    }

    /**
     * Modifier les informations de livraison d'une commande
     * @param {string} commandeId - ID de la commande
     * @param {Object} donneesLivraison - Nouvelles données de livraison
     * @returns {Promise<boolean>} Succès de la modification
     */
    static async modifierLivraison(commandeId, donneesLivraison) {
        try {
            const { doc, updateDoc, arrayUnion, Timestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Valider les données
            if (!donneesLivraison.magasinLivraison) {
                throw new Error('Magasin de livraison obligatoire');
            }
            
            if (!['normal', 'urgent', 'tres_urgent'].includes(donneesLivraison.niveauUrgence)) {
                throw new Error('Niveau d\'urgence invalide');
            }
            
            // Convertir la date si nécessaire
            let dateLivraison = donneesLivraison.dateLivraisonPrevue;
            if (typeof dateLivraison === 'string') {
                dateLivraison = Timestamp.fromDate(new Date(dateLivraison));
            }
            
            // Préparer les mises à jour
            const updates = {
                magasinLivraison: donneesLivraison.magasinLivraison,
                niveauUrgence: donneesLivraison.niveauUrgence,
                'dates.livraisonPrevue': dateLivraison,
                commentaires: donneesLivraison.commentaires?.trim() || '',
                historique: arrayUnion({
                    date: new Date(),
                    action: 'modification_livraison',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Informations de livraison modifiées',
                    timestamp: Date.now()
                })
            };
            
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log('✅ Informations de livraison modifiées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification livraison:', error);
            throw error;
        }
    }

    /**
     * Modifier un produit spécifique dans une commande
     * @param {string} commandeId - ID de la commande
     * @param {number} produitIndex - Index du produit dans le tableau
     * @param {Object} donneesProduit - Nouvelles données du produit
     * @returns {Promise<boolean>} Succès de la modification
     */
    static async modifierProduit(commandeId, produitIndex, donneesProduit) {
        try {
            const { doc, getDoc, updateDoc, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer la commande actuelle
            const commande = await this.getCommande(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Valider l'index
            if (produitIndex < 0 || produitIndex >= commande.produits.length) {
                throw new Error('Index de produit invalide');
            }
            
            // Valider les données
            if (donneesProduit.quantite && donneesProduit.quantite < 1) {
                throw new Error('La quantité doit être supérieure à 0');
            }
            
            // Modifier le produit
            const produitsModifies = [...commande.produits];
            const produitOriginal = produitsModifies[produitIndex];
            
            // Mettre à jour les champs modifiables
            if (donneesProduit.quantite !== undefined) {
                produitsModifies[produitIndex].quantite = parseInt(donneesProduit.quantite);
            }
            
            if (donneesProduit.numeroSerie !== undefined) {
                produitsModifies[produitIndex].numeroSerie = donneesProduit.numeroSerie?.trim() || null;
            }
            
            // Recalculer le prix total si la quantité a changé
            let nouveauPrixTotal = commande.prixTotal;
            if (donneesProduit.quantite !== undefined) {
                const differentQuantite = donneesProduit.quantite - produitOriginal.quantite;
                nouveauPrixTotal += differentQuantite * (produitOriginal.prixUnitaire || 0);
            }
            
            // Préparer les mises à jour
            const updates = {
                produits: produitsModifies,
                prixTotal: nouveauPrixTotal,
                historique: arrayUnion({
                    date: new Date(),
                    action: 'modification_produit',
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Produit modifié: ${produitOriginal.designation}`,
                    timestamp: Date.now()
                })
            };
            
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log('✅ Produit modifié');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification produit:', error);
            throw error;
        }
    }

    /**
     * Modifier les informations d'expédition d'une commande
     * @param {string} commandeId - ID de la commande
     * @param {Object} donneesExpedition - Nouvelles données d'expédition
     * @returns {Promise<boolean>} Succès de la modification
     */
    static async modifierExpedition(commandeId, donneesExpedition) {
        try {
            const { doc, updateDoc, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer la commande pour vérifier l'état
            const commande = await this.getCommande(commandeId);
            if (!commande) {
                throw new Error('Commande introuvable');
            }
            
            // Vérifier que la commande est dans un état modifiable
            if (!['expediee', 'receptionnee'].includes(commande.statut)) {
                throw new Error('L\'expédition ne peut être modifiée que pour les commandes expédiées ou réceptionnées');
            }
            
            // Préparer les mises à jour
            const updates = {
                historique: arrayUnion({
                    date: new Date(),
                    action: 'modification_expedition',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Informations d\'expédition modifiées',
                    timestamp: Date.now()
                })
            };
            
            // Modifier les informations d'envoi si fournies
            if (donneesExpedition.transporteur) {
                updates['expedition.envoi.transporteur'] = donneesExpedition.transporteur;
            }
            
            if (donneesExpedition.numeroSuivi) {
                updates['expedition.envoi.numeroSuivi'] = donneesExpedition.numeroSuivi.trim();
            }
            
            // Modifier les informations de réception si fournies
            if (donneesExpedition.numeroSuiviRecu) {
                updates['expedition.reception.numeroSuiviRecu'] = donneesExpedition.numeroSuiviRecu.trim();
            }
            
            if (donneesExpedition.colisConforme !== undefined) {
                updates['expedition.reception.colisConforme'] = donneesExpedition.colisConforme;
            }
            
            if (donneesExpedition.commentairesReception) {
                updates['expedition.reception.commentaires'] = donneesExpedition.commentairesReception.trim();
            }
            
            await updateDoc(doc(db, 'commandes', commandeId), updates);
            
            console.log('✅ Informations d\'expédition modifiées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur modification expédition:', error);
            throw error;
        }
    }

    /**
 * Remplacer tous les produits d'une commande
 * @param {string} commandeId - ID de la commande
 * @param {Array} nouveauxProduits - Nouveaux produits
 * @returns {Promise<boolean>} Succès de la modification
 */
static async remplacerProduits(commandeId, nouveauxProduits) {
    try {
        const { doc, updateDoc, arrayUnion } = 
            await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Validation
        if (!nouveauxProduits || nouveauxProduits.length === 0) {
            throw new Error('Au moins un produit est obligatoire');
        }
        
        // Vérifier que la commande peut être modifiée
        const commande = await this.getCommande(commandeId);
        if (!commande) {
            throw new Error('Commande introuvable');
        }
        
        if (!['nouvelle', 'preparation'].includes(commande.statut)) {
            throw new Error('Modification impossible : préparation déjà validée');
        }
        
        // Nettoyer les produits (supprimer les prix)
        const produitsNettoyes = nouveauxProduits.map(p => ({
            id: p.id,
            reference: p.reference,
            designation: p.designation,
            type: p.type || 'consommable',
            quantite: p.quantite || 1,
            cote: p.cote || null,
            numeroSerie: p.numeroSerie || null,
            necessiteCote: p.necessiteCote || false
            // PLUS DE prixUnitaire
        }));
        
        // Préparer les mises à jour
        const updates = {
            produits: produitsNettoyes,
            // PLUS DE prixTotal
            historique: arrayUnion({
                date: new Date(),
                action: 'modification_produits',
                utilisateur: this.getUtilisateurActuel(),
                details: 'Liste des produits modifiée',
                timestamp: Date.now()
            })
        };
        
        await updateDoc(doc(db, 'commandes', commandeId), updates);
        
        console.log('✅ Produits remplacés avec succès');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur remplacement produits:', error);
        throw error;
    }
}

    /**
     * Obtenir les statistiques des commandes
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const commandes = await this.getCommandes({ limite: 1000 });
            
            const stats = {
                total: commandes.length,
                parStatut: {},
                parUrgence: {},
                retards: 0
            };
            
            const maintenant = new Date();
            
            // Compter par statut et urgence (en excluant les supprimées)
            commandes.forEach(commande => {
                // Exclure les commandes supprimées des stats
                if (commande.statut === 'supprime') {
                    return;
                }
                
                // Par statut
                stats.parStatut[commande.statut] = (stats.parStatut[commande.statut] || 0) + 1;
                
                // Par urgence
                stats.parUrgence[commande.niveauUrgence] = (stats.parUrgence[commande.niveauUrgence] || 0) + 1;
                
                // Retards
                if (commande.statut !== 'livree' && commande.statut !== 'annulee') {
                    const dateLivraison = commande.dates.livraisonPrevue?.toDate ? 
                        commande.dates.livraisonPrevue.toDate() : 
                        new Date(commande.dates.livraisonPrevue);
                    
                    if (dateLivraison < maintenant) {
                        stats.retards++;
                    }
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parUrgence: {},
                retards: 0
            };
        }
    }
    
    // Méthodes privées
    
    /**
     * Créer les équipements chez le client après livraison
     */
    static async creerEquipementsClient(commande) {
        try {
            const equipements = [];
            
            // Préparer les équipements depuis la commande
            commande.produits.forEach(produit => {
                if (produit.numeroSerie) {
                    equipements.push({
                        type: produit.type,
                        produitId: produit.id,
                        designation: produit.designation,
                        cote: produit.cote || null,
                        numeroSerie: produit.numeroSerie,
                        dateAchat: new Date(),
                        garantieJusquau: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 ans
                        commandeId: commande.id
                    });
                }
            });
            
            // Ajouter les équipements au client
            for (const equipement of equipements) {
                await ClientsService.ajouterEquipement(commande.client.id, equipement);
            }
            
            console.log(`✅ ${equipements.length} équipements créés chez le client`);
            
        } catch (error) {
            console.error('❌ Erreur création équipements:', error);
        }
    }
    
    /**
     * Récupérer l'utilisateur actuel
     */
    static getUtilisateurActuel() {
        const auth = localStorage.getItem('sav_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.collaborateur || { id: 'unknown', prenom: 'Inconnu', nom: '' };
        }
        return { id: 'unknown', prenom: 'Inconnu', nom: '' };
    }
    
    /**
     * Récupérer les magasins autorisés
     */
    static getMagasinsAutorises() {
        const auth = localStorage.getItem('sav_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.magasins || [];
        }
        return [];
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [27/07/2025] - Ajout de la méthode supprimerCommande
   Fonctionnalité: Suppression sécurisée avec validation nom/prénom
   Solution: Soft delete avec statut "supprime"
   Impact: Les commandes supprimées restent en base mais sont filtrées
   
   [27/07/2025] - Correction serverTimestamp dans arrayUnion
   Problème: Firebase n'accepte pas serverTimestamp() dans arrayUnion()
   Solution: Utiliser new Date() à la place avec timestamp Unix
   Impact: Toutes les méthodes utilisant l'historique corrigées
   
   [27/07/2025] - Validation NS obligatoire
   Problème: On pouvait terminer sans NS pour les appareils auditifs
   Solution: Vérification dans case 'terminee'
   Impact: Bloque le passage au statut terminé si NS manquants
   
   [29/07/2025] - Ajout des méthodes d'édition avec icônes stylo
   Fonctionnalité: Édition inline des informations de commande
   Solution: 4 nouvelles méthodes spécialisées (client, livraison, produit, expédition)
   Impact: Permet la modification directe depuis le modal détail
   
   NOTES POUR REPRISES FUTURES:
   - La suppression est un soft delete (statut "supprime")
   - Les commandes supprimées sont exclues des statistiques
   - La validation nom/prénom se fait côté UI (detail.js)
   - Impossible de supprimer une commande livrée
   - Ne jamais utiliser serverTimestamp() dans arrayUnion()
   - Les NS sont obligatoires pour terminer la préparation
   - Les méthodes d'édition incluent validation + historique automatique
   - L'édition d'expédition n'est possible que pour commandes expédiées/réceptionnées
   ======================================== */