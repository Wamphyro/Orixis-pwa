// ========================================
// FACTURES-FOURNISSEURS.SERVICE.JS - 🎯 SERVICE MÉTIER PRINCIPAL
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.service.js
//
// DESCRIPTION:
// Service de gestion des factures fournisseurs
// Logique métier et workflow des factures
// Intègre les constantes de l'ancien data.js
//
// STRUCTURE:
// 1. Configuration et constantes
// 2. Méthodes de lecture
// 3. Méthodes de changement de statut
// 4. Méthodes de statistiques
// 5. Helpers et formatters
// ========================================

import { db } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION ET CONSTANTES (ancien data.js)
// ========================================

export const FACTURES_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300,
    DELAI_PAIEMENT_DEFAUT: 30,
    
    // Comptes PCG avec libellés utilisateurs
    COMPTES_PCG: {
        // CLASSE 60 - Achats
        '6061': { libelle: '⚡ Électricité, Gaz, Eau', classe: '60' },
        '6063': { libelle: '🔧 Petit équipement', classe: '60' },
        '6064': { libelle: '📎 Fournitures bureau', classe: '60' },
        '6068': { libelle: '📦 Autres fournitures', classe: '60' },
        
        // CLASSE 61 - Services extérieurs
        '6132': { libelle: '🏢 Locations immobilières', classe: '61' },
        '6135': { libelle: '🚗 Locations mobilières', classe: '61' },
        '6155': { libelle: '🔨 Entretien/Réparations', classe: '61' },
        '6156': { libelle: '🛠️ Maintenance', classe: '61' },
        '616':  { libelle: '🛡️ Assurances', classe: '61' },
        
        // CLASSE 62 - Autres services
        '6221': { libelle: '⛽ Carburants', classe: '62' },
        '6226': { libelle: '⚖️ Honoraires', classe: '62' },
        '6228': { libelle: '🎓 Formation', classe: '62' },
        '6241': { libelle: '🚚 Transport/Livraison', classe: '62' },
        '6251': { libelle: '✈️ Voyages et déplacements', classe: '62' },
        '6256': { libelle: '🍽️ Missions/Réceptions', classe: '62' },
        '6262': { libelle: '📱 Télécommunications', classe: '62' },
        '6265': { libelle: '💿 Logiciels/Abonnements', classe: '62' },
        '627':  { libelle: '🏦 Services bancaires', classe: '62' },
        
        // CLASSE 21 - Immobilisations
        '2183': { libelle: '💻 Matériel informatique (immo)', classe: '21' },
        '2184': { libelle: '🪑 Mobilier (immo)', classe: '21' }
    },
    
    // Statuts de facture
    STATUTS: {
        nouvelle: {
            label: 'Nouvelle',
            icon: '📄',
            couleur: '#e0e0e0',
            suivant: ['a_payer', 'deja_payee'],
            description: 'Facture uploadée, en attente d\'analyse'
        },
        a_payer: {
            label: 'À payer',
            icon: '💳',
            couleur: '#ff9800',
            suivant: ['payee', 'en_retard'],
            description: 'En attente de paiement'
        },
        deja_payee: {
            label: 'Déjà payée',
            icon: '✅',
            couleur: '#4caf50',
            suivant: ['a_pointer'],
            description: 'Payée avant réception de la facture'
        },
        payee: {
            label: 'Payée',
            icon: '💰',
            couleur: '#2196f3',
            suivant: ['a_pointer'],
            description: 'Paiement effectué'
        },
        a_pointer: {
            label: 'À pointer',
            icon: '🔍',
            couleur: '#9c27b0',
            suivant: ['pointee'],
            description: 'En attente de rapprochement bancaire'
        },
        pointee: {
            label: 'Pointée',
            icon: '✓✓',
            couleur: '#00796b',
            suivant: null,
            description: 'Rapprochement bancaire effectué'
        },
        en_retard: {
            label: 'En retard',
            icon: '⚠️',
            couleur: '#f44336',
            suivant: ['payee'],
            description: 'Échéance dépassée'
        },
        annulee: {
            label: 'Annulée',
            icon: '🚫',
            couleur: '#9e9e9e',
            suivant: null,
            description: 'Facture annulée'
        }
    },
    
    // Catégories de fournisseurs
    CATEGORIES_FOURNISSEURS: {
        telecom: {
            label: 'Télécom',
            icon: '📱',
            description: 'Opérateurs téléphoniques et internet',
            exemples: ['Free', 'Orange', 'SFR', 'Bouygues']
        },
        energie: {
            label: 'Énergie',
            icon: '⚡',
            description: 'Électricité, gaz, eau',
            exemples: ['EDF', 'Engie', 'Total Énergies']
        },
        services: {
            label: 'Services',
            icon: '💼',
            description: 'Services professionnels',
            exemples: ['Comptable', 'Avocat', 'Assurance']
        },
        informatique: {
            label: 'Informatique',
            icon: '💻',
            description: 'Logiciels, cloud, matériel',
            exemples: ['Microsoft', 'Adobe', 'OVH']
        },
        fournitures: {
            label: 'Fournitures',
            icon: '📦',
            description: 'Fournitures de bureau et consommables',
            exemples: ['Bureau Vallée', 'Amazon Business']
        },
        autre: {
            label: 'Autre',
            icon: '📋',
            description: 'Autres types de fournisseurs',
            exemples: []
        }
    },
    
    // Modes de paiement
    MODES_PAIEMENT: {
        virement: { label: 'Virement', icon: '🏦' },
        prelevement: { label: 'Prélèvement', icon: '🔄' },
        cheque: { label: 'Chèque', icon: '📄' },
        cb: { label: 'Carte bancaire', icon: '💳' },
        especes: { label: 'Espèces', icon: '💵' }
    }
};

// ========================================
// CLASSE SERVICE
// ========================================

export class FacturesFournisseursService {
    
    /**
     * Récupérer les factures selon des critères
     */
    static async getFactures(criteres = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let constraints = [];
            
            // Filtrer par statut
            if (criteres.statut) {
                constraints.push(where('statut', '==', criteres.statut));
            }
            
            // Filtrer par fournisseur
            if (criteres.fournisseur) {
                constraints.push(where('fournisseur.nom', '==', criteres.fournisseur));
            }
            
            // Filtrer par magasin
            if (criteres.magasin) {
                constraints.push(where('codeMagasin', '==', criteres.magasin));
            }
            
            // Filtrer par à payer
            if (criteres.aPayer === true) {
                constraints.push(where('aPayer', '==', true));
            }
            
            // Filtrer par catégorie
            if (criteres.categorie) {
                constraints.push(where('fournisseur.categorie', '==', criteres.categorie));
            }
            
            // Limite si spécifiée
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            // Créer la requête
            const q = constraints.length > 0 
                ? query(collection(db, 'facturesFournisseurs'), ...constraints)
                : query(collection(db, 'facturesFournisseurs'));
                
            const snapshot = await getDocs(q);
            
            const factures = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Exclure manuellement les factures annulées si pas spécifié
                if (!criteres.inclureAnnulees && data.statut === 'annulee') {
                    return;
                }
                factures.push({ id: doc.id, ...data });
            });
            
            // Tri manuel en JavaScript (date décroissante)
            factures.sort((a, b) => {
                const dateA = a.dateFacture?.toDate ? a.dateFacture.toDate() : new Date(a.dateFacture || 0);
                const dateB = b.dateFacture?.toDate ? b.dateFacture.toDate() : new Date(b.dateFacture || 0);
                return dateB - dateA;
            });
            
            // Post-traitement : vérifier les retards
            const facturesAvecRetard = factures.map(facture => {
                if (this.estEnRetard(facture.dateEcheance, facture.statut)) {
                    facture.enRetard = true;
                }
                return facture;
            });
            
            return facturesAvecRetard;
            
        } catch (error) {
            console.error('❌ Erreur récupération factures:', error);
            return [];
        }
    }
    
    /**
     * Récupérer une facture par son ID
     */
    static async getFacture(factureId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const factureDoc = await getDoc(doc(db, 'facturesFournisseurs', factureId));
            
            if (factureDoc.exists()) {
                const facture = { id: factureDoc.id, ...factureDoc.data() };
                
                // Vérifier si en retard
                if (this.estEnRetard(facture.dateEcheance, facture.statut)) {
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
     * Obtenir les statistiques des factures
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
                if (facture.enRetard || facture.statut === 'en_retard') {
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
            const statutsPossibles = this.getProchainStatut(facture.statut);
            
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
     * Supprimer une facture (soft delete)
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
    
    // ========================================
    // HELPERS (ancien data.js)
    // ========================================
    
    /**
     * Générer un numéro interne
     */
    static genererNumeroInterne() {
        const date = new Date();
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const jour = String(date.getDate()).padStart(2, '0');
        const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `FF-${annee}${mois}${jour}-${sequence}`;
    }
    
    /**
     * Générer une référence de virement
     */
    static genererReferenceVirement(date = new Date()) {
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `VIR-FF-${annee}-${mois}-${numero}`;
    }
    
    /**
     * Calculer la date d'échéance
     */
    static calculerDateEcheance(dateFacture, delaiPaiement = FACTURES_CONFIG.DELAI_PAIEMENT_DEFAUT) {
        const date = new Date(dateFacture);
        date.setDate(date.getDate() + delaiPaiement);
        return date;
    }
    
    /**
     * Calculer le montant HT depuis TTC
     */
    static calculerMontantHT(montantTTC, tauxTVA = 20) {
        return montantTTC / (1 + tauxTVA / 100);
    }
    
    /**
     * Calculer la TVA
     */
    static calculerMontantTVA(montantHT, tauxTVA = 20) {
        return montantHT * (tauxTVA / 100);
    }
    
    /**
     * Déterminer la catégorie d'un fournisseur
     */
    static determinerCategorieFournisseur(nomFournisseur) {
        const nom = nomFournisseur.toUpperCase();
        
        // Télécom
        if (nom.includes('FREE') || nom.includes('ORANGE') || nom.includes('SFR') || nom.includes('BOUYGUES')) {
            return 'telecom';
        }
        
        // Énergie
        if (nom.includes('EDF') || nom.includes('ENGIE') || nom.includes('TOTAL')) {
            return 'energie';
        }
        
        // Informatique
        if (nom.includes('MICROSOFT') || nom.includes('ADOBE') || nom.includes('OVH') || nom.includes('GOOGLE')) {
            return 'informatique';
        }
        
        // Par défaut
        return 'autre';
    }
    
    /**
     * Obtenir le prochain statut possible
     */
    static getProchainStatut(statutActuel) {
        return FACTURES_CONFIG.STATUTS[statutActuel]?.suivant || [];
    }
    
    /**
     * Vérifier si une facture est en retard
     */
    static estEnRetard(dateEcheance, statut) {
        if (!dateEcheance || statut !== 'a_payer') return false;
        
        const echeance = dateEcheance.toDate ? dateEcheance.toDate() : new Date(dateEcheance);
        return echeance < new Date();
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
}

// Export par défaut
export default FacturesFournisseursService;