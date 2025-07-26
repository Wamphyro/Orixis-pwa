// ========================================
// COMMANDES.SERVICE.JS - Gestion des commandes Firebase
// Chemin: src/js/services/commandes.service.js
//
// DESCRIPTION:
// Service de gestion des commandes avec Firebase
// Modifié le 27/07/2025 : Ajout de la méthode supprimerCommande
//
// STRUCTURE:
// 1. Imports et configuration (lignes 15-25)
// 2. Méthodes CRUD principales (lignes 30-200)
// 3. Gestion des statuts (lignes 202-400)
// 4. Méthode de suppression (lignes 402-450)
// 5. Statistiques et helpers (lignes 452-600)
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
                    prixUnitaire: p.prixUnitaire || 0
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
                
                // Historique
                historique: [{
                    date: serverTimestamp(),
                    action: 'creation',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Commande créée'
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
            if (nouveauStatut !== 'annulee' && nouveauStatut !== statutSuivantAttendu) {
                throw new Error(`Passage de ${commande.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                historique: arrayUnion({
                    date: serverTimestamp(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Statut changé en ${COMMANDES_CONFIG.STATUTS[nouveauStatut].label}`
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
                    break;
                    
                case 'expediee':
                    updates['dates.expeditionValidee'] = serverTimestamp();
                    if (donnees.numeroSuivi) {
                        updates['expedition.envoi.numeroSuivi'] = donnees.numeroSuivi;
                        updates['expedition.envoi.dateEnvoi'] = serverTimestamp();
                        updates['expedition.envoi.scanPar'] = this.getUtilisateurActuel();
                        updates['expedition.envoi.transporteur'] = donnees.transporteur || 'Colissimo';
                    }
                    break;
                    
                case 'receptionnee':
                    updates['dates.receptionValidee'] = serverTimestamp();
                    updates['expedition.reception.dateReception'] = serverTimestamp();
                    updates['expedition.reception.recuPar'] = this.getUtilisateurActuel();
                    updates['expedition.reception.numeroSuiviRecu'] = donnees.numeroSuiviRecu || '';
                    updates['expedition.reception.colisConforme'] = donnees.colisConforme !== false;
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
    
    // ========================================
    // NOUVELLE MÉTHODE : SUPPRESSION SÉCURISÉE
    // Ajoutée le 27/07/2025
    // ========================================
    
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
                historique: arrayUnion({
                    date: serverTimestamp(),
                    action: 'numeros_serie',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Numéros de série assignés'
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
                historique: arrayUnion({
                    date: serverTimestamp(),
                    action: 'patient_prevenu',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Patient prévenu de la disponibilité'
                })
            });
            
            console.log('✅ Patient marqué comme prévenu');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur marquage patient:', error);
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
   
   NOTES POUR REPRISES FUTURES:
   - La suppression est un soft delete (statut "supprime")
   - Les commandes supprimées sont exclues des statistiques
   - La validation nom/prénom se fait côté UI (detail.js)
   - Impossible de supprimer une commande livrée
   ======================================== */