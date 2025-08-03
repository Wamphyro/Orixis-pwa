// ========================================
// DECOMPTE-SECU.SERVICE.JS - 🎯 SERVICE MÉTIER PRINCIPAL
// 
// RÔLE : Logique business et workflow des décomptes sécu
// - Gestion des statuts et transitions
// - Calcul des remboursements et participations
// - Statistiques par caisse/régime/type d'acte
// - Orchestration des opérations métier
// ========================================

// ========================================
// DECOMPTE-SECU.SERVICE.JS - Gestion des décomptes Firebase
// Chemin: modules/decompte-secu/decompte-secu.service.js
//
// DESCRIPTION:
// Service de gestion des décomptes sécurité sociale avec Firebase
// CRUD + logique métier spécifique (taux, participations, etc.)
//
// STRUCTURE:
// 1. Imports et configuration
// 2. Méthodes de lecture (getDecomptes, getDecompte)
// 3. Méthodes de statistiques
// 4. Méthodes de calcul des remboursements
// 5. Méthodes de changement de statut
// 6. Helpers privés
//
// DÉPENDANCES:
// - Firebase Firestore
// - decompte-secu.data.js (constantes métier)
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { 
    DECOMPTES_SECU_CONFIG, 
    genererNumeroDecompte,
    genererPaiementId,
    getProchainStatut,
    calculerMontantRembourse,
    calculerParticipations,
    determinerTauxRemboursement
} from './decompte-secu.data.js';

/**
 * Service de gestion des décomptes sécurité sociale
 */
export class DecomptesSecuService {
    
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
            
            // Filtrer par caisse primaire
            if (criteres.caissePrimaire) {
                constraints.push(where('caissePrimaire', '==', criteres.caissePrimaire));
            }
            
            // Filtrer par régime
            if (criteres.regime) {
                constraints.push(where('regime', '==', criteres.regime));
            }
            
            // Filtrer par magasin
            if (criteres.magasin) {
                constraints.push(where('codeMagasin', '==', criteres.magasin));
            }
            
            // Filtrer par type d'acte principal
            if (criteres.typeActePrincipal) {
                constraints.push(where('typeActePrincipal', '==', criteres.typeActePrincipal));
            }
            
            // Tri par date de paiement décroissant
            constraints.push(orderBy('datePaiement', 'desc'));
            
            // Limite si spécifiée
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            const q = query(collection(db, 'decomptes_secu'), ...constraints);
            const snapshot = await getDocs(q);
            
            const decomptes = [];
            snapshot.forEach((doc) => {
                decomptes.push({ id: doc.id, ...doc.data() });
            });
            
            return decomptes;
            
        } catch (error) {
            console.error('❌ Erreur récupération décomptes sécu:', error);
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
            
            const decompteDoc = await getDoc(doc(db, 'decomptes_secu', decompteId));
            
            if (decompteDoc.exists()) {
                return { id: decompteDoc.id, ...decompteDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération décompte sécu:', error);
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
                const beneficiaireNom = `${decompte.beneficiaire.prenom} ${decompte.beneficiaire.nom}`.toLowerCase();
                const numeroDecompte = decompte.numeroDecompte?.toLowerCase() || '';
                const numeroFeuilleSoins = decompte.numeroFeuilleSoins?.toLowerCase() || '';
                const caisse = decompte.caissePrimaire?.toLowerCase() || '';
                const nss = decompte.beneficiaire.numeroSecuriteSociale?.replace(/\s/g, '') || '';
                
                return beneficiaireNom.includes(termeRecherche) ||
                       numeroDecompte.includes(termeRecherche) ||
                       numeroFeuilleSoins.includes(termeRecherche) ||
                       caisse.includes(termeRecherche) ||
                       nss.includes(termeRecherche.replace(/\s/g, ''));
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche décomptes sécu:', error);
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
                parCaisse: {},
                parRegime: {},
                parTypeActe: {},
                montantTotalFacture: 0,
                montantTotalRembourse: 0,
                montantTotalParticipations: 0,
                tauxMoyenRemboursement: 0
            };
            
            // Calculer les statistiques
            let totalTauxPondere = 0;
            let nbDecomptesValides = 0;
            
            decomptes.forEach(decompte => {
                // Exclure les décomptes supprimés des stats
                if (decompte.statut === 'supprime') {
                    return;
                }
                
                // Par statut
                stats.parStatut[decompte.statut] = (stats.parStatut[decompte.statut] || 0) + 1;
                
                // Par caisse
                if (decompte.caissePrimaire) {
                    stats.parCaisse[decompte.caissePrimaire] = (stats.parCaisse[decompte.caissePrimaire] || 0) + 1;
                }
                
                // Par régime
                if (decompte.regime) {
                    stats.parRegime[decompte.regime] = (stats.parRegime[decompte.regime] || 0) + 1;
                }
                
                // Par type d'acte principal
                if (decompte.typeActePrincipal) {
                    stats.parTypeActe[decompte.typeActePrincipal] = (stats.parTypeActe[decompte.typeActePrincipal] || 0) + 1;
                }
                
                // Montants
                const montantFacture = decompte.montantTotalFacture || 0;
                const montantRembourse = decompte.montantTotalRembourse || 0;
                const montantParticipations = decompte.montantTotalParticipations || 0;
                
                stats.montantTotalFacture += montantFacture;
                stats.montantTotalRembourse += montantRembourse;
                stats.montantTotalParticipations += montantParticipations;
                
                // Calcul du taux moyen pondéré
                if (montantFacture > 0) {
                    const taux = (montantRembourse / montantFacture) * 100;
                    totalTauxPondere += taux * montantFacture;
                    nbDecomptesValides++;
                }
            });
            
            // Taux moyen de remboursement
            if (stats.montantTotalFacture > 0) {
                stats.tauxMoyenRemboursement = totalTauxPondere / stats.montantTotalFacture;
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parCaisse: {},
                parRegime: {},
                parTypeActe: {},
                montantTotalFacture: 0,
                montantTotalRembourse: 0,
                montantTotalParticipations: 0,
                tauxMoyenRemboursement: 0
            };
        }
    }
    
    /**
     * Calculer les remboursements d'un décompte
     * @param {Object} decompte - Le décompte
     * @returns {Object} Calculs détaillés
     */
    static calculerRemboursements(decompte) {
        let montantTotalFacture = 0;
        let montantTotalBase = 0;
        let montantTotalRembourse = 0;
        let montantTotalParticipations = 0;
        let montantTotalRembourseFinal = 0;
        
        const actesCalcules = [];
        
        // Calculer pour chaque acte
        decompte.actesMedicaux?.forEach(acte => {
            const montantFacture = acte.montantFacture || 0;
            const baseRemboursement = acte.baseRemboursement || montantFacture;
            const tauxRemboursement = acte.tauxRemboursement || 70;
            
            // Calculer le remboursement brut
            const calcul = calculerMontantRembourse(montantFacture, baseRemboursement, tauxRemboursement);
            
            // Calculer les participations
            const participations = calculerParticipations(acte.typeActe, calcul.montantRembourse);
            
            // Ajouter aux totaux
            montantTotalFacture += montantFacture;
            montantTotalBase += calcul.baseEffective;
            montantTotalRembourse += calcul.montantRembourse;
            montantTotalParticipations += participations.participations.total;
            montantTotalRembourseFinal += participations.remboursementFinal;
            
            // Stocker le calcul détaillé
            actesCalcules.push({
                ...acte,
                baseEffective: calcul.baseEffective,
                montantRembourseBrut: calcul.montantRembourse,
                participations: participations.participations,
                montantRembourseFinal: participations.remboursementFinal
            });
        });
        
        // Calculer le taux moyen
        const tauxMoyenRemboursement = montantTotalFacture > 0 
            ? (montantTotalRembourseFinal / montantTotalFacture) * 100 
            : 0;
        
        return {
            actesMedicaux: actesCalcules,
            montantTotalFacture,
            montantTotalBase,
            montantTotalRembourse,
            montantTotalParticipations,
            montantTotalRembourseFinal,
            tauxMoyenRemboursement: Math.round(tauxMoyenRemboursement * 100) / 100
        };
    }
    
    /**
     * Vérifier et corriger les taux de remboursement
     * @param {Object} decompte - Le décompte
     * @returns {Object} Décompte avec taux corrigés
     */
    static async verifierTauxRemboursement(decompte) {
        const actesVerifies = [];
        let corrections = 0;
        
        decompte.actesMedicaux?.forEach(acte => {
            // Déterminer le taux théorique
            const tauxTheorique = determinerTauxRemboursement(
                acte.typeActe,
                {
                    ald: decompte.contexteMedical?.ald,
                    maternite: decompte.contexteMedical?.maternite
                }
            );
            
            // Vérifier si le taux actuel est correct
            const tauxActuel = acte.tauxRemboursement || 70;
            const tauxCorrige = tauxTheorique;
            
            if (tauxActuel !== tauxCorrige) {
                corrections++;
            }
            
            actesVerifies.push({
                ...acte,
                tauxRemboursement: tauxCorrige,
                tauxAvantCorrection: tauxActuel !== tauxCorrige ? tauxActuel : undefined
            });
        });
        
        return {
            actesMedicaux: actesVerifies,
            correctionsEffectuees: corrections
        };
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
            
            // Autoriser le passage vers rejet depuis n'importe quel statut sauf paiement
            const isPassageRejet = nouveauStatut === 'rejet' && decompte.statut !== 'paiement_effectue';
            
            if (nouveauStatut !== 'supprime' && 
                nouveauStatut !== statutSuivantAttendu && 
                !isPassageRejet) {
                throw new Error(`Passage de ${decompte.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                historique: arrayUnion({
                    date: new Date(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Statut changé en ${DECOMPTES_SECU_CONFIG.STATUTS[nouveauStatut].label}`,
                    timestamp: Date.now()
                })
            };
            
            // Mises à jour spécifiques selon le statut
            switch (nouveauStatut) {
                case 'traitement_ia':
                    updates['dates.transmissionIA'] = serverTimestamp();
                    break;
                    
                case 'controle_taux':
                    updates['dates.controleTaux'] = serverTimestamp();
                    // Recalculer les remboursements avec les taux vérifiés
                    if (donnees.tauxVerifies) {
                        const calculs = this.calculerRemboursements({
                            ...decompte,
                            actesMedicaux: donnees.tauxVerifies
                        });
                        updates.montantTotalRembourse = calculs.montantTotalRembourseFinal;
                        updates.montantTotalParticipations = calculs.montantTotalParticipations;
                        updates.tauxMoyenRemboursement = calculs.tauxMoyenRemboursement;
                    }
                    break;
                    
                case 'traitement_effectue':
                    updates['dates.traitementEffectue'] = serverTimestamp();
                    updates['intervenants.traitePar'] = this.getUtilisateurActuel();
                    break;
                    
                case 'paiement_effectue':
                    updates['dates.paiementEffectue'] = serverTimestamp();
                    updates['intervenants.payePar'] = this.getUtilisateurActuel();
                    updates.paiementId = genererPaiementId();
                    updates.datePaiement = serverTimestamp();
                    break;
                    
                case 'rejet':
                    updates['dates.rejet'] = serverTimestamp();
                    updates['intervenants.rejetePar'] = this.getUtilisateurActuel();
                    if (donnees.motif) {
                        updates.motifRejet = donnees.motif;
                    }
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
            await updateDoc(doc(db, 'decomptes_secu', decompteId), updates);
            
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
            
            // Si on met à jour les actes médicaux, recalculer les totaux
            if (updates.actesMedicaux) {
                const calculs = this.calculerRemboursements({ actesMedicaux: updates.actesMedicaux });
                updatesAvecHistorique.montantTotalFacture = calculs.montantTotalFacture;
                updatesAvecHistorique.montantTotalBase = calculs.montantTotalBase;
                updatesAvecHistorique.montantTotalRembourse = calculs.montantTotalRembourse;
                updatesAvecHistorique.montantTotalParticipations = calculs.montantTotalParticipations;
                updatesAvecHistorique.montantTotalRembourseFinal = calculs.montantTotalRembourseFinal;
                updatesAvecHistorique.tauxMoyenRemboursement = calculs.tauxMoyenRemboursement;
            }
            
            await updateDoc(doc(db, 'decomptes_secu', decompteId), updatesAvecHistorique);
            
            console.log('✅ Décompte sécu mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour décompte sécu:', error);
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
            
            console.log('✅ Décompte sécu supprimé (soft delete):', decompteId);
            
        } catch (error) {
            console.error('❌ Erreur suppression décompte sécu:', error);
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
   
   [03/02/2025] - Création initiale
   - Service adapté pour sécurité sociale
   - Gestion des taux et participations
   - Calculs de remboursement avec franchises
   - Vérification automatique des taux
   - Statistiques par caisse/régime/type d'acte
   
   NOTES POUR REPRISES FUTURES:
   - Les calculs respectent les règles CPAM
   - Les participations sont calculées selon le type d'acte
   - Le workflow inclut un contrôle des taux
   - Les statistiques incluent le taux moyen de remboursement
   ======================================== */