// ========================================
// DECOMPTE-MUTUELLE.SERVICE.JS - 🎯 SERVICE MÉTIER PRINCIPAL
// 
// RÔLE : Logique business et workflow des décomptes
// - Gestion des statuts et transitions
// - Calcul des statistiques
// - Orchestration des opérations métier
// ========================================

// ========================================
// DECOMPTE-MUTUELLE.SERVICE.JS - Gestion des décomptes Firebase
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.service.js
//
// DESCRIPTION:
// Service de gestion des décomptes mutuelles avec Firebase
// CRUD basique pour l'instant (Create, Read, Update, Delete)
//
// STRUCTURE:
// 1. Imports et configuration
// 2. Méthodes de lecture (getDecomptes, getDecompte)
// 3. Méthodes de statistiques
// 4. Méthodes de changement de statut
// 5. Helpers privés
//
// DÉPENDANCES:
// - Firebase Firestore
// - decompte-mutuelle.data.js (constantes métier)
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { 
    DECOMPTES_CONFIG, 
    genererNumeroDecompte,
    genererVirementId,
    getProchainStatut
} from './decompte-mutuelle.data.js';

/**
 * Service de gestion des décomptes mutuelles
 */
export class DecomptesMutuellesService {
    
    /**
     * Récupérer les décomptes selon des critères
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Array>} Liste des décomptes
     */
    static async getDecomptes(criteres = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let constraints = [];
            
            // Filtrer par statut
            if (criteres.statut) {
                constraints.push(where('statut', '==', criteres.statut));
            }
            
            // Filtrer par mutuelle
            if (criteres.mutuelle) {
                constraints.push(where('mutuelle', '==', criteres.mutuelle));
            }
            
            // Filtrer par magasin
            if (criteres.magasin) {
                constraints.push(where('codeMagasin', '==', criteres.magasin));
            }
            
            // Filtrer par type de décompte
            if (criteres.typeDecompte) {
                constraints.push(where('typeDecompte', '==', criteres.typeDecompte));
            }
            
            // Tri par date de virement décroissant
            constraints.push(orderBy('dateVirement', 'desc'));
            
            // Limite si spécifiée
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            const q = query(collection(db, 'decomptes_mutuelles'), ...constraints);
            const snapshot = await getDocs(q);
            
            const decomptes = [];
            snapshot.forEach((doc) => {
                decomptes.push({ id: doc.id, ...doc.data() });
            });
            
            return decomptes;
            
        } catch (error) {
            console.error('❌ Erreur récupération décomptes:', error);
            return [];
        }
    }
    
    /**
     * Récupérer un décompte par son ID
     * @param {string} decompteId - ID du décompte
     * @returns {Promise<Object>} Données du décompte
     */
    static async getDecompte(decompteId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const decompteDoc = await getDoc(doc(db, 'decomptes_mutuelles', decompteId));
            
            if (decompteDoc.exists()) {
                return { id: decompteDoc.id, ...decompteDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération décompte:', error);
            return null;
        }
    }
    
    /**
     * Rechercher des décomptes
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Décomptes trouvés
     */
    static async rechercherDecomptes(recherche) {
        try {
            if (!recherche || recherche.length < 2) {
                return await this.getDecomptes({ limite: 50 });
            }
            
            // Récupérer tous les décomptes récents
            const decomptes = await this.getDecomptes({ limite: 200 });
            
            const termeRecherche = recherche.toLowerCase();
            
            // Filtrer localement
            return decomptes.filter(decompte => {
                const clientNom = `${decompte.client.prenom} ${decompte.client.nom}`.toLowerCase();
                const numeroDecompte = decompte.numeroDecompte?.toLowerCase() || '';
                const virementId = decompte.virementId?.toLowerCase() || '';
                const mutuelle = decompte.mutuelle?.toLowerCase() || '';
                const nss = decompte.client.numeroSecuriteSociale?.replace(/\s/g, '') || '';
                
                return clientNom.includes(termeRecherche) ||
                       numeroDecompte.includes(termeRecherche) ||
                       virementId.includes(termeRecherche) ||
                       mutuelle.includes(termeRecherche) ||
                       nss.includes(termeRecherche.replace(/\s/g, ''));
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche décomptes:', error);
            return [];
        }
    }
    
    /**
     * Obtenir les statistiques des décomptes
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const decomptes = await this.getDecomptes({ limite: 1000 });
            
            const stats = {
                total: decomptes.length,
                parStatut: {},
                parMutuelle: {},
                montantTotal: 0,
                montantMoyen: 0
            };
            
            // Calculer les statistiques
            decomptes.forEach(decompte => {
                // Exclure les décomptes supprimés des stats
                if (decompte.statut === 'supprime') {
                    return;
                }
                
                // Par statut
                stats.parStatut[decompte.statut] = (stats.parStatut[decompte.statut] || 0) + 1;
                
                // Par mutuelle
                stats.parMutuelle[decompte.mutuelle] = (stats.parMutuelle[decompte.mutuelle] || 0) + 1;
                
                // Montants
                stats.montantTotal += decompte.montantVirement || 0;
            });
            
            // Montant moyen
            const decomptesNonSupprimes = decomptes.filter(d => d.statut !== 'supprime').length;
            stats.montantMoyen = decomptesNonSupprimes > 0 ? 
                stats.montantTotal / decomptesNonSupprimes : 0;
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parMutuelle: {},
                montantTotal: 0,
                montantMoyen: 0
            };
        }
    }
    
    /**
     * Changer le statut d'un décompte
     * @param {string} decompteId - ID du décompte
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} donnees - Données additionnelles
     * @returns {Promise<boolean>} Succès du changement
     */
    static async changerStatut(decompteId, nouveauStatut, donnees = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer le décompte actuel
            const decompte = await this.getDecompte(decompteId);
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            // Vérifier que le changement est valide
            const statutSuivantAttendu = getProchainStatut(decompte.statut);
            
            // Autoriser le passage vers traitement manuel depuis traitement_ia
            const isPassageManuel = decompte.statut === 'traitement_ia' && nouveauStatut === 'traitement_manuel';
            
            if (nouveauStatut !== 'supprime' && 
                nouveauStatut !== statutSuivantAttendu && 
                !isPassageManuel) {
                throw new Error(`Passage de ${decompte.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                historique: arrayUnion({
                    date: new Date(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Statut changé en ${DECOMPTES_CONFIG.STATUTS[nouveauStatut].label}`,
                    timestamp: Date.now()
                })
            };
            
            // Mises à jour spécifiques selon le statut
            switch (nouveauStatut) {
                case 'traitement_ia':
                    updates['dates.transmissionIA'] = serverTimestamp();
                    break;
                    
                case 'traitement_effectue':
                    updates['dates.traitementEffectue'] = serverTimestamp();
                    updates['intervenants.traitePar'] = this.getUtilisateurActuel();
                    break;
                    
                case 'traitement_manuel':
                    updates['dates.traitementManuel'] = serverTimestamp();
                    updates['intervenants.traitePar'] = this.getUtilisateurActuel();
                    if (donnees.motif) {
                        updates.motifTraitementManuel = donnees.motif;
                    }
                    break;
                    
                case 'rapprochement_bancaire':
                    updates['dates.rapprochementBancaire'] = serverTimestamp();
                    updates['intervenants.rapprochePar'] = this.getUtilisateurActuel();
                    break;
                    
                case 'supprime':
                    updates.suppression = {
                        date: serverTimestamp(),
                        par: this.getUtilisateurActuel(),
                        motif: donnees.motif || 'Non spécifié'
                    };
                    break;
            }
            
            // Effectuer la mise à jour
            await updateDoc(doc(db, 'decomptes_mutuelles', decompteId), updates);
            
            console.log(`✅ Statut changé: ${decompte.statut} → ${nouveauStatut}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur changement statut:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour un décompte
     * @param {string} decompteId - ID du décompte
     * @param {Object} updates - Mises à jour à appliquer
     * @returns {Promise<boolean>} Succès
     */
    static async mettreAJourDecompte(decompteId, updates) {
        try {
            const { doc, updateDoc, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Ajouter à l'historique
            const updatesAvecHistorique = {
                ...updates,
                historique: arrayUnion({
                    date: new Date(),
                    action: 'mise_a_jour',
                    utilisateur: this.getUtilisateurActuel(),
                    details: 'Décompte mis à jour',
                    timestamp: Date.now()
                })
            };
            
            await updateDoc(doc(db, 'decomptes_mutuelles', decompteId), updatesAvecHistorique);
            
            console.log('✅ Décompte mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour décompte:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer un décompte (soft delete)
     * @param {string} decompteId - ID du décompte
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerDecompte(decompteId, infos = {}) {
        try {
            await this.changerStatut(decompteId, 'supprime', {
                motif: infos.motif || 'Suppression manuelle'
            });
            
            console.log('✅ Décompte supprimé (soft delete):', decompteId);
            
        } catch (error) {
            console.error('❌ Erreur suppression décompte:', error);
            throw new Error('Impossible de supprimer le décompte : ' + error.message);
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
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
   
   [02/02/2025] - Création initiale
   - Service basique CRUD
   - Gestion des statuts avec workflow
   - Statistiques par statut et mutuelle
   - Soft delete avec statut "supprime"
   
   NOTES POUR REPRISES FUTURES:
   - Ajouter la création de décompte quand nécessaire
   - Gérer les permissions par magasin
   - Ajouter l'export des données
   - Intégrer avec l'API mutuelle si disponible
   ======================================== */