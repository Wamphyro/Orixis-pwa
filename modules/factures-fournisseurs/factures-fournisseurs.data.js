// ========================================
// FACTURES-FOURNISSEURS.DATA.JS - Données métier UNIQUEMENT
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.data.js
//
// DESCRIPTION:
// Contient UNIQUEMENT les constantes et données de référence métier
// PAS de configuration UI, PAS de fonctions de génération pour l'UI
// Données pures du domaine métier des factures fournisseurs
//
// STRUCTURE:
// - Constantes métier (statuts, catégories, modes paiement)
// - Validations métier (montants, références)
// - Fonctions helpers métier pures
// - Messages et textes métier
// ========================================

export const FACTURES_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    DELAI_PAIEMENT_DEFAUT: 30, // jours par défaut pour échéance
    
    // ========================================
    // STATUTS DE FACTURE (données métier)
    // ========================================
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

    // ========================================
    // CATÉGORIES DE FOURNISSEURS (données métier)
    // ========================================
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

    // ========================================
    // MODES DE PAIEMENT (données métier)
    // ========================================
    MODES_PAIEMENT: {
        virement: {
            label: 'Virement',
            icon: '🏦',
            description: 'Virement bancaire'
        },
        prelevement: {
            label: 'Prélèvement',
            icon: '🔄',
            description: 'Prélèvement automatique'
        },
        cheque: {
            label: 'Chèque',
            icon: '📄',
            description: 'Paiement par chèque'
        },
        cb: {
            label: 'Carte bancaire',
            icon: '💳',
            description: 'Paiement par CB'
        },
        especes: {
            label: 'Espèces',
            icon: '💵',
            description: 'Paiement en espèces'
        }
    },
    
    // ========================================
    // MESSAGES ET TEXTES
    // ========================================
    MESSAGES: {
        AUCUNE_FACTURE: 'Aucune facture fournisseur pour le moment',
        CHARGEMENT: 'Chargement des factures...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des factures',
        FACTURE_CREEE: 'Facture créée avec succès',
        FACTURE_MISE_A_JOUR: 'Facture mise à jour',
        FACTURE_SUPPRIMEE: 'Facture supprimée avec succès',
        
        // Confirmations
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer cette facture ?',
        CONFIRMER_PAIEMENT: 'Confirmer le paiement de cette facture ?',
        CONFIRMER_POINTAGE: 'Confirmer le rapprochement bancaire ?',
        CONFIRMER_ANNULATION: 'Confirmer l\'annulation de cette facture ?',
        
        // Erreurs
        ERREUR_MONTANT_INVALIDE: 'Montant invalide',
        ERREUR_DATE_INVALIDE: 'Date invalide',
        ERREUR_DROITS: 'Vous n\'avez pas les droits pour cette action'
    },
    
    // ========================================
    // VALIDATIONS (regex métier)
    // ========================================
    VALIDATIONS: {
        MONTANT: /^\d+(\.\d{1,2})?$/,
        NUMERO_FACTURE: /^[A-Za-z0-9\-\_\/]+$/,
        REFERENCE_VIREMENT: /^[A-Z0-9\-]+$/,
        SIREN: /^\d{9}$/,
        NUMERO_INTERNE: /^FF-\d{8}-\d{4}$/
    },
    
    // ========================================
    // FORMATS D'AFFICHAGE (données métier)
    // ========================================
    FORMATS: {
        DATE: {
            jour: 'DD/MM/YYYY',
            mois: 'MM/YYYY',
            complet: 'DD/MM/YYYY à HH:mm'
        },
        NUMERO_INTERNE: 'FF-{YYYYMMDD}-{XXXX}', // XXXX = numéro séquentiel
        REFERENCE_VIREMENT: 'VIR-FF-{YYYY}-{MM}-{XXX}', // XXX = numéro de virement
        MONTANT: {
            devise: '€',
            decimales: 2
        }
    },

    // ========================================
    // TAUX TVA STANDARDS
    // ========================================
    TAUX_TVA: {
        normal: 20,
        intermediaire: 10,
        reduit: 5.5,
        super_reduit: 2.1
    }
};

// ========================================
// DONNÉES DYNAMIQUES (mises à jour depuis Firestore)
// ========================================

// Stockage des fournisseurs extraits des factures réelles
let fournisseursDynamiques = new Set();

// Fonction pour mettre à jour les fournisseurs depuis les factures
export function mettreAJourFournisseurs(factures) {
    fournisseursDynamiques.clear();
    
    console.log('🔍 DEBUG - mettreAJourFournisseurs appelé avec', factures.length, 'factures');
    
    factures.forEach(facture => {
        if (facture.fournisseur?.nom) {
            console.log('🔍 DEBUG - Ajout fournisseur:', facture.fournisseur.nom);
            fournisseursDynamiques.add(facture.fournisseur.nom);
        }
    });
    
    console.log('🔍 DEBUG - Fournisseurs finaux:', Array.from(fournisseursDynamiques));
}

// ========================================
// FONCTIONS HELPERS MÉTIER (pas UI)
// ========================================

// Fonction helper pour générer un numéro interne
export function genererNumeroInterne() {
    const date = new Date();
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `FF-${annee}${mois}${jour}-${sequence}`;
}

// Fonction helper pour générer une référence de virement
export function genererReferenceVirement(date = new Date()) {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `VIR-FF-${annee}-${mois}-${numero}`;
}

// Fonction helper pour calculer la date d'échéance
export function calculerDateEcheance(dateFacture, delaiPaiement = FACTURES_CONFIG.DELAI_PAIEMENT_DEFAUT) {
    const date = new Date(dateFacture);
    date.setDate(date.getDate() + delaiPaiement);
    return date;
}

// Fonction helper pour calculer le montant HT depuis TTC
export function calculerMontantHT(montantTTC, tauxTVA = 20) {
    return montantTTC / (1 + tauxTVA / 100);
}

// Fonction helper pour calculer la TVA
export function calculerMontantTVA(montantHT, tauxTVA = 20) {
    return montantHT * (tauxTVA / 100);
}

// Fonction helper pour formater un montant
export function formaterMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

// Fonction helper pour formater une date
export function formaterDate(timestamp, format = 'complet') {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    switch (format) {
        case 'jour':
            return date.toLocaleDateString('fr-FR');
        case 'mois':
            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
        case 'complet':
        default:
            return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Fonction helper pour obtenir le prochain statut possible
export function getProchainStatut(statutActuel) {
    return FACTURES_CONFIG.STATUTS[statutActuel]?.suivant || [];
}

// Fonction helper pour vérifier si une facture peut être supprimée
export function peutEtreSupprimee(statut) {
    return !['pointee', 'annulee'].includes(statut);
}

// Fonction helper pour vérifier si une facture est en retard
export function estEnRetard(dateEcheance, statut) {
    if (!dateEcheance || statut !== 'a_payer') return false;
    
    const echeance = dateEcheance.toDate ? dateEcheance.toDate() : new Date(dateEcheance);
    return echeance < new Date();
}

// Fonction helper pour obtenir la liste des fournisseurs
export function getListeFournisseurs() {
    return Array.from(fournisseursDynamiques).sort();
}

// Fonction helper pour déterminer la catégorie d'un fournisseur
export function determinerCategorieFournisseur(nomFournisseur) {
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

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Adaptation depuis decompte-mutuelle.data.js
   - Statuts adaptés au workflow factures
   - Ajout catégories fournisseurs
   - Helpers pour calculs TVA
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier contient UNIQUEMENT les données métier
   - Toute config UI est dans les orchestrateurs
   - Les fonctions de génération UI sont dans les orchestrateurs
   ======================================== */