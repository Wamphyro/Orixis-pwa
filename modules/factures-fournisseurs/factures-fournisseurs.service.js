// ========================================
// FACTURES-FOURNISSEURS.SERVICE.JS - 🎯 SERVICE MÉTIER PRINCIPAL
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.service.js
//
// DESCRIPTION:
// Service de gestion des factures fournisseurs avec Firebase
// Logique business et workflow des factures
//
// STRUCTURE:
// 1. Imports et configuration
// 2. Méthodes de lecture (getFactures, getFacture)
// 3. Méthodes de statistiques
// 4. Méthodes de changement de statut
// 5. Helpers privés
//
// DÉPENDANCES:
// - Firebase Firestore
// - factures-fournisseurs.data.js (constantes métier)
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { 
    FACTURES_CONFIG, 
    genererNumeroInterne,
    genererReferenceVirement,
    getProchainStatut,
    estEnRetard
} from './factures-fournisseurs.data.js';

/**
 * Service de gestion des factures fournisseurs
 */
export class FacturesFournisseursService {
    
    /**
     * Récupérer les factures selon des critères
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Array>} Liste des factures
     */
// Script complet pour créer 2 factures factices
async function creerFacturesFactices() {
    console.log('🚀 Début création des factures factices...');
    
    try {
        // Import du service Firestore
        const { default: firestoreService } = await import('./factures-fournisseurs.firestore.service.js');
        
        // Facture 1 : FREE (à payer)
        console.log('📄 Création facture FREE...');
        const facture1Id = await firestoreService.creerFacture({
            documents: [{
                nom: 'Facture_Free_Janvier_2025.pdf',
                nomOriginal: 'Facture_Free_Janvier_2025.pdf',
                url: 'https://firebasestorage.googleapis.com/v0/b/orixis-pwa.appspot.com/o/test%2Ffacture-test.pdf?alt=media',
                chemin: 'factures-fournisseurs/test/facture-free.pdf',
                taille: 245789,
                type: 'application/pdf',
                hash: 'hash-free-123456',
                dateUpload: new Date()
            }],
            aPayer: true,
            dejaPayee: false
        });
        
        console.log('✅ Facture FREE créée avec ID:', facture1Id);
        
        // Ajouter les données extraites pour FREE
        await firestoreService.ajouterDonneesExtraites(facture1Id, {
            fournisseur: {
                nom: 'FREE',
                categorie: 'telecom',
                numeroClient: 'CLI-789456123',
                siren: '421938861'
            },
            numeroFacture: 'FCT-FREE-2025-01-15487',
            montantHT: 33.25,
            montantTVA: 6.65,
            montantTTC: 39.90,
            tauxTVA: 20,
            dateFacture: new Date('2025-01-15'),
            dateEcheance: new Date('2025-02-15'),
            periodeDebut: new Date('2025-01-01'),
            periodeFin: new Date('2025-01-31'),
            modePaiement: 'prelevement'
        });
        
        console.log('📊 Données FREE ajoutées');
        
        // Attendre un peu
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Facture 2 : EDF (déjà payée)
        console.log('📄 Création facture EDF...');
        const facture2Id = await firestoreService.creerFacture({
            documents: [{
                nom: 'Facture_EDF_Decembre_2024.pdf',
                nomOriginal: 'Facture_EDF_Decembre_2024.pdf',
                url: 'https://firebasestorage.googleapis.com/v0/b/orixis-pwa.appspot.com/o/test%2Ffacture-test2.pdf?alt=media',
                chemin: 'factures-fournisseurs/test/facture-edf.pdf',
                taille: 325698,
                type: 'application/pdf',
                hash: 'hash-edf-789456',
                dateUpload: new Date()
            }],
            aPayer: false,
            dejaPayee: true
        });
        
        console.log('✅ Facture EDF créée avec ID:', facture2Id);
        
        // Ajouter les données extraites pour EDF
        await firestoreService.ajouterDonneesExtraites(facture2Id, {
            fournisseur: {
                nom: 'EDF',
                categorie: 'energie',
                numeroClient: 'PDL-987654321',
                siren: '552081317'
            },
            numeroFacture: 'EDF-2024-12-789654',
            montantHT: 120.83,
            montantTVA: 24.17,
            montantTTC: 145.00,
            tauxTVA: 20,
            dateFacture: new Date('2024-12-20'),
            dateEcheance: new Date('2025-01-20'),
            periodeDebut: new Date('2024-11-01'),
            periodeFin: new Date('2024-11-30'),
            modePaiement: 'virement',
            referenceVirement: 'VIR-EDF-2024-12-001'
        });
        
        console.log('📊 Données EDF ajoutées');
        
        // Rafraîchir l'affichage
        console.log('🔄 Rafraîchissement de la liste...');
        if (window.chargerDonnees) {
            await window.chargerDonnees();
            console.log('✅ Liste rafraîchie');
        }
        
        console.log('');
        console.log('🎉 SUCCÈS ! 2 factures factices créées :');
        console.log('1️⃣ FREE - 39,90€ - À payer');
        console.log('2️⃣ EDF - 145,00€ - Déjà payée');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création:', error);
        console.error('Détails:', error.message);
    }
}

// Lancer la création
creerFacturesFactices();
    
    /**
     * Récupérer une facture par son ID
     * @param {string} factureId - ID de la facture
     * @returns {Promise<Object>} Données de la facture
     */
    static async getFacture(factureId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const factureDoc = await getDoc(doc(db, 'facturesFournisseurs', factureId));
            
            if (factureDoc.exists()) {
                const facture = { id: factureDoc.id, ...factureDoc.data() };
                
                // Vérifier si en retard
                if (estEnRetard(facture.dateEcheance, facture.statut)) {
                    facture.enRetard = true;
                }
                
                return facture;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération facture:', error);
            return null;
        }
    }
    
    /**
     * Rechercher des factures
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Factures trouvées
     */
    static async rechercherFactures(recherche) {
        try {
            if (!recherche || recherche.length < 2) {
                return await this.getFactures({ limite: 50 });
            }
            
            // Récupérer toutes les factures récentes
            const factures = await this.getFactures({ limite: 200 });
            
            const termeRecherche = recherche.toLowerCase();
            
            // Filtrer localement
            return factures.filter(facture => {
                const fournisseurNom = facture.fournisseur?.nom?.toLowerCase() || '';
                const numeroFacture = facture.numeroFacture?.toLowerCase() || '';
                const numeroInterne = facture.numeroInterne?.toLowerCase() || '';
                const referenceVirement = facture.referenceVirement?.toLowerCase() || '';
                const numeroClient = facture.fournisseur?.numeroClient || '';
                
                return fournisseurNom.includes(termeRecherche) ||
                       numeroFacture.includes(termeRecherche) ||
                       numeroInterne.includes(termeRecherche) ||
                       referenceVirement.includes(termeRecherche) ||
                       numeroClient.includes(termeRecherche);
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche factures:', error);
            return [];
        }
    }
    
    /**
     * Obtenir les statistiques des factures
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const factures = await this.getFactures({ limite: 1000 });
            
            const stats = {
                total: factures.length,
                parStatut: {},
                parFournisseur: {},
                parCategorie: {},
                montantTotal: 0,
                montantAPayer: 0,
                montantPaye: 0,
                nombreEnRetard: 0
            };
            
            // Calculer les statistiques
            factures.forEach(facture => {
                // Par statut
                stats.parStatut[facture.statut] = (stats.parStatut[facture.statut] || 0) + 1;
                
                // Par fournisseur
                const nomFournisseur = facture.fournisseur?.nom || 'Non défini';
                stats.parFournisseur[nomFournisseur] = (stats.parFournisseur[nomFournisseur] || 0) + 1;
                
                // Par catégorie
                const categorie = facture.fournisseur?.categorie || 'autre';
                stats.parCategorie[categorie] = (stats.parCategorie[categorie] || 0) + 1;
                
                // Montants
                const montantTTC = facture.montantTTC || 0;
                stats.montantTotal += montantTTC;
                
                if (facture.statut === 'a_payer' || facture.statut === 'en_retard') {
                    stats.montantAPayer += montantTTC;
                } else if (facture.statut === 'payee' || facture.statut === 'deja_payee' || facture.statut === 'pointee') {
                    stats.montantPaye += montantTTC;
                }
                
                // En retard
                if (facture.enRetard) {
                    stats.nombreEnRetard++;
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                parStatut: {},
                parFournisseur: {},
                parCategorie: {},
                montantTotal: 0,
                montantAPayer: 0,
                montantPaye: 0,
                nombreEnRetard: 0
            };
        }
    }
    
    /**
     * Changer le statut d'une facture
     * @param {string} factureId - ID de la facture
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} donnees - Données additionnelles
     * @returns {Promise<boolean>} Succès du changement
     */
    static async changerStatut(factureId, nouveauStatut, donnees = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer la facture actuelle
            const facture = await this.getFacture(factureId);
            if (!facture) {
                throw new Error('Facture introuvable');
            }
            
            // Vérifier que le changement est valide
            const statutsPossibles = getProchainStatut(facture.statut);
            
            if (!statutsPossibles.includes(nouveauStatut) && nouveauStatut !== 'annulee') {
                throw new Error(`Passage de ${facture.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                statutPaiement: nouveauStatut,
                historique: arrayUnion({
                    date: new Date(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: this.getUtilisateurActuel(),
                    details: `Statut changé en ${FACTURES_CONFIG.STATUTS[nouveauStatut].label}`,
                    timestamp: Date.now()
                })
            };
            
            // Mises à jour spécifiques selon le statut
            switch (nouveauStatut) {
                case 'payee':
                    updates['dates.paiement'] = serverTimestamp();
                    updates.datePaiement = serverTimestamp();
                    updates['intervenants.payePar'] = this.getUtilisateurActuel();
                    updates.aPayer = false;
                    if (donnees.modePaiement) {
                        updates.modePaiement = donnees.modePaiement;
                    }
                    if (donnees.referenceVirement) {
                        updates.referenceVirement = donnees.referenceVirement;
                    }
                    // Passer automatiquement à "à pointer"
                    setTimeout(() => {
                        this.changerStatut(factureId, 'a_pointer');
                    }, 1000);
                    break;
                    
                case 'a_pointer':
                    updates.aPayer = false;
                    break;
                    
                case 'pointee':
                    updates['dates.pointage'] = serverTimestamp();
                    updates['intervenants.pointePar'] = this.getUtilisateurActuel();
                    break;
                    
                case 'en_retard':
                    updates.aPayer = true;
                    break;
                    
                case 'annulee':
                    updates.aPayer = false;
                    updates.suppression = {
                        date: serverTimestamp(),
                        par: this.getUtilisateurActuel(),
                        motif: donnees.motif || 'Non spécifié'
                    };
                    break;
            }
            
            // Effectuer la mise à jour
            await updateDoc(doc(db, 'facturesFournisseurs', factureId), updates);
            
            console.log(`✅ Statut changé: ${facture.statut} → ${nouveauStatut}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur changement statut:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour une facture
     * @param {string} factureId - ID de la facture
     * @param {Object} updates - Mises à jour à appliquer
     * @returns {Promise<boolean>} Succès
     */
    static async mettreAJourFacture(factureId, updates) {
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
                    details: 'Facture mise à jour',
                    timestamp: Date.now()
                })
            };
            
            await updateDoc(doc(db, 'facturesFournisseurs', factureId), updatesAvecHistorique);
            
            console.log('✅ Facture mise à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour facture:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer une facture (soft delete)
     * @param {string} factureId - ID de la facture
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    static async supprimerFacture(factureId, infos = {}) {
        try {
            await this.changerStatut(factureId, 'annulee', {
                motif: infos.motif || 'Suppression manuelle'
            });
            
            console.log('✅ Facture annulée (soft delete):', factureId);
            
        } catch (error) {
            console.error('❌ Erreur suppression facture:', error);
            throw new Error('Impossible de supprimer la facture : ' + error.message);
        }
    }
    
    /**
     * Vérifier et mettre à jour les factures en retard
     * @returns {Promise<number>} Nombre de factures mises à jour
     */
    static async verifierRetards() {
        try {
            const factures = await this.getFactures({ 
                statut: 'a_payer',
                limite: 500 
            });
            
            let compteur = 0;
            const maintenant = new Date();
            
            for (const facture of factures) {
                if (facture.dateEcheance) {
                    const echeance = facture.dateEcheance.toDate ? 
                        facture.dateEcheance.toDate() : 
                        new Date(facture.dateEcheance);
                    
                    if (echeance < maintenant) {
                        await this.changerStatut(facture.id, 'en_retard');
                        compteur++;
                    }
                }
            }
            
            console.log(`✅ ${compteur} facture(s) marquée(s) en retard`);
            return compteur;
            
        } catch (error) {
            console.error('❌ Erreur vérification retards:', error);
            return 0;
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
   - Service adapté depuis decompte-mutuelle
   - Gestion des statuts avec workflow factures
   - Statistiques par statut, fournisseur et catégorie
   - Vérification automatique des retards
   
   NOTES POUR REPRISES FUTURES:
   - Gérer les permissions par magasin
   - Ajouter l'export des données
   - Intégrer avec le module operations-bancaires
   - Ajouter des rappels automatiques pour échéances
   ======================================== */