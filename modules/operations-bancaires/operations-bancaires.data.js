// ========================================
// OPERATIONS-BANCAIRES.DATA.JS - Données métier UNIQUEMENT
// Chemin: modules/operations-bancaires/operations-bancaires.data.js
//
// DESCRIPTION:
// Contient UNIQUEMENT les constantes et données de référence métier
// PAS de configuration UI, PAS de fonctions de génération pour l'UI
// Données pures du domaine métier des opérations bancaires
//
// STRUCTURE:
// - Constantes métier (types, catégories, banques)
// - Validations métier (montants, dates)
// - Fonctions helpers métier pures
// - Messages et textes métier
// ========================================

export const OPERATIONS_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 50,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // ========================================
    // TYPES D'OPÉRATION (données métier)
    // ========================================
    TYPES_OPERATION: {
        credit: {
            label: 'Crédit',
            icon: '➕',
            couleur: '#d1e7dd',
            signe: 1
        },
        debit: {
            label: 'Débit',
            icon: '➖',
            couleur: '#f8d7da',
            signe: -1
        }
    },

    // ========================================
    // STATUTS D'OPÉRATION (données métier)
    // ========================================
    STATUTS_OPERATION: {
        active: {
            label: 'Active',
            couleur: '#4caf50',
            icon: '🟢',
            description: 'Opération standard non traitée'
        },
        pointee: {
            label: 'Pointée',
            couleur: '#2196f3',
            icon: '✓',
            description: 'Opération vérifiée et pointée'
        },
        rapprochee: {
            label: 'Rapprochée',
            couleur: '#9c27b0',
            icon: '🔗',
            description: 'Opération rapprochée avec un document'
        }
    },

    // ========================================
    // CATÉGORIES D'OPÉRATION (données métier)
    // ========================================
    CATEGORIES: {
        salaires: {
            label: 'Salaires',
            icon: '💰',
            couleur: '#d1e7dd'
        },
        remboursement_secu: {
            label: 'Remboursement Sécu',
            icon: '🏥',
            couleur: '#cfe2ff'
        },
        remboursement_mutuelle: {
            label: 'Remboursement Mutuelle',
            icon: '💊',
            couleur: '#e7f1ff'
        },
        impots: {
            label: 'Impôts',
            icon: '🏛️',
            couleur: '#f8d7da'
        },
        energie: {
            label: 'Énergie',
            icon: '⚡',
            couleur: '#fff3cd'
        },
        telecom: {
            label: 'Télécom',
            icon: '📱',
            couleur: '#e9ecef'
        },
        assurances: {
            label: 'Assurances',
            icon: '🛡️',
            couleur: '#f5e6ff'
        },
        alimentation: {
            label: 'Alimentation',
            icon: '🛒',
            couleur: '#ffe6e6'
        },
        carburant: {
            label: 'Carburant',
            icon: '⛽',
            couleur: '#fff0e6'
        },
        restaurant: {
            label: 'Restaurant',
            icon: '🍴',
            couleur: '#ffe6f0'
        },
        ecommerce: {
            label: 'E-commerce',
            icon: '🛍️',
            couleur: '#e6f0ff'
        },
        credit_immobilier: {
            label: 'Crédit immobilier',
            icon: '🏠',
            couleur: '#ffe6e6'
        },
        loyer: {
            label: 'Loyer',
            icon: '🏘️',
            couleur: '#f0e6ff'
        },
        sante: {
            label: 'Santé',
            icon: '⚕️',
            couleur: '#e6fff0'
        },
        retrait_especes: {
            label: 'Retrait espèces',
            icon: '💵',
            couleur: '#f0f0f0'
        },
        virement: {
            label: 'Virement',
            icon: '↔️',
            couleur: '#e6e6ff'
        },
        cheque: {
            label: 'Chèque',
            icon: '📄',
            couleur: '#f0f0e6'
        },
        frais_bancaires: {
            label: 'Frais bancaires',
            icon: '🏦',
            couleur: '#ffe6e6'
        },
        abonnements: {
            label: 'Abonnements',
            icon: '📺',
            couleur: '#e6ffe6'
        },
        autre: {
            label: 'Autre',
            icon: '📌',
            couleur: '#f8f9fa'
        }
    },

    // ========================================
    // BANQUES SUPPORTÉES
    // ========================================
    BANQUES: {
        credit_mutuel: 'Crédit Mutuel',
        credit_agricole: 'Crédit Agricole',
        bnp_paribas: 'BNP Paribas',
        societe_generale: 'Société Générale',
        cic: 'CIC',
        caisse_epargne: 'Caisse d\'Épargne',
        lcl: 'LCL',
        la_banque_postale: 'La Banque Postale',
        autre: 'Autre'
    },
    
    // ========================================
    // MESSAGES ET TEXTES
    // ========================================
    MESSAGES: {
        AUCUNE_OPERATION: 'Aucune opération bancaire pour le moment',
        CHARGEMENT: 'Chargement des opérations...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des opérations',
        OPERATIONS_IMPORTEES: 'Opérations importées avec succès',
        OPERATION_MODIFIEE: 'Opération mise à jour',
        OPERATION_SUPPRIMEE: 'Opération supprimée avec succès',
        
        // Import
        IMPORT_EN_COURS: 'Import en cours...',
        IMPORT_TERMINE: 'Import terminé',
        IMPORT_ERREUR: 'Erreur lors de l\'import',
        
        // Confirmations
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer cette opération ?',
        CONFIRMER_IMPORT: 'Confirmer l\'import du fichier ?',
        
        // Erreurs
        ERREUR_FORMAT_CSV: 'Format de fichier non reconnu',
        ERREUR_MONTANT_INVALIDE: 'Montant invalide',
        ERREUR_DATE_INVALIDE: 'Date invalide'
    },
    
    // ========================================
    // VALIDATIONS (regex métier)
    // ========================================
    VALIDATIONS: {
        MONTANT: /^-?\d+(\.\d{1,2})?$/,
        IBAN: /^[A-Z]{2}\d{2}[A-Z0-9]+$/,
        BIC: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
        RIB: /^(\d{5})\s*(\d{5})\s*(\d{11})\s*(\d{2})$/
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
        MONTANT: {
            devise: '€',
            decimales: 2
        }
    }
};

// ========================================
// DONNÉES DYNAMIQUES (mises à jour depuis les imports)
// ========================================

// Stockage des catégories personnalisées
let categoriesPersonnalisees = new Set();

// Stockage des comptes bancaires
let comptesBancaires = new Map();

// Fonction pour ajouter un compte
export function ajouterCompteBancaire(numero, infos) {
    comptesBancaires.set(numero, {
        numero,
        masque: infos.maskedNumber || '•••••••' + numero.slice(-4),
        nom: infos.accountName || `Compte ${numero.slice(-4)}`,
        banque: infos.bank || 'Banque inconnue',
        rib: infos.rib || null
    });
}

// Fonction pour obtenir les comptes
export function getComptesBancaires() {
    return Array.from(comptesBancaires.values());
}

// ========================================
// FONCTIONS HELPERS MÉTIER (pas UI)
// ========================================

// Fonction helper pour formater un montant
export function formaterMontant(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

// Fonction helper pour formater une date
export function formaterDate(dateStr, format = 'jour') {
    if (!dateStr) return '-';
    
    const date = new Date(dateStr);
    
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

// Fonction helper pour calculer la balance
export function calculerBalance(operations) {
    return operations.reduce((balance, op) => {
        return balance + (op.montant || 0);
    }, 0);
}

// Fonction helper pour obtenir les statistiques par catégorie
export function getStatistiquesParCategorie(operations) {
    const stats = {};
    
    operations.forEach(op => {
        const cat = op.categorie || 'autre';
        if (!stats[cat]) {
            stats[cat] = {
                nombre: 0,
                montantTotal: 0,
                montantCredits: 0,
                montantDebits: 0
            };
        }
        
        stats[cat].nombre++;
        stats[cat].montantTotal += op.montant;
        
        if (op.montant > 0) {
            stats[cat].montantCredits += op.montant;
        } else {
            stats[cat].montantDebits += Math.abs(op.montant);
        }
    });
    
    return stats;
}

// Fonction helper pour déterminer le statut d'une opération
export function determinerStatutOperation(operation) {
    if (operation.rapprochee) {
        return 'rapprochee';
    }
    if (operation.pointee) {
        return 'pointee';
    }
    return 'active';
}

// Fonction helper pour détecter la catégorie depuis le libellé
export function detecterCategorie(libelle) {
    if (!libelle) return 'autre';
    
    const libelleUpper = libelle.toUpperCase();
    
    // Règles de détection (même logique que dans import.service)
    const rules = [
        { pattern: /SALAIRE|PAIE|VIREMENT\s+EMPLOYEUR/, categorie: 'salaires' },
        { pattern: /CPAM|SECU|SECURITE\s+SOCIALE|REMBT\s+SS/, categorie: 'remboursement_secu' },
        { pattern: /MUTUELLE|MMA|ALMERYS|VIAMEDIS|HARMONIE/, categorie: 'remboursement_mutuelle' },
        { pattern: /IMPOT|IMPOTS|DGFIP|TRESOR\s+PUBLIC/, categorie: 'impots' },
        { pattern: /EDF|GDF|ENGIE|GAZ|ELECTRICITE/, categorie: 'energie' },
        { pattern: /ORANGE|SFR|BOUYGUES|FREE|TELEPHONE/, categorie: 'telecom' },
        { pattern: /ASSURANCE|MAIF|MACIF|AXA/, categorie: 'assurances' },
        { pattern: /CARREFOUR|LECLERC|AUCHAN|LIDL/, categorie: 'alimentation' },
        { pattern: /ESSENCE|CARBURANT|TOTAL|SHELL/, categorie: 'carburant' },
        { pattern: /RESTAURANT|RESTO|BRASSERIE/, categorie: 'restaurant' },
        { pattern: /AMAZON|FNAC|CDISCOUNT/, categorie: 'ecommerce' },
        { pattern: /CREDIT\s+IMMOBILIER|PRET\s+HABITAT/, categorie: 'credit_immobilier' },
        { pattern: /LOYER|LOCATION|BAIL/, categorie: 'loyer' },
        { pattern: /PHARMACIE|DOCTEUR|MEDECIN/, categorie: 'sante' },
        { pattern: /RETRAIT|DAB|DISTRIBUTEUR/, categorie: 'retrait_especes' },
        { pattern: /VIREMENT|VIR\s+/, categorie: 'virement' },
        { pattern: /CHEQUE|CHQ/, categorie: 'cheque' },
        { pattern: /FRAIS|COMMISSION|AGIOS/, categorie: 'frais_bancaires' },
        { pattern: /NETFLIX|SPOTIFY|DEEZER/, categorie: 'abonnements' }
    ];
    
    for (const rule of rules) {
        if (rule.pattern.test(libelleUpper)) {
            return rule.categorie;
        }
    }
    
    return 'autre';
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création basée sur decompte-mutuelle
   - Adaptation pour les opérations bancaires
   - Types crédit/débit au lieu de statuts
   - Catégories d'opérations
   - Support multi-banques
   
   NOTES POUR REPRISES FUTURES:
   - Les catégories peuvent être étendues
   - Les patterns de détection sont dans detecterCategorie()
   - Les comptes sont stockés dynamiquement lors de l'import
   ======================================== */