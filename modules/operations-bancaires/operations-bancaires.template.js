// ========================================
// OPERATIONS-BANCAIRES.TEMPLATE.JS - Template Firestore
// Chemin: modules/operations-bancaires/operations-bancaires.template.js
//
// DESCRIPTION:
// Structure complète d'une opération bancaire
// Aligné sur le modèle des décomptes sécu
//
// VERSION: 2.0.0
// DATE: 03/02/2025
// ========================================

export const OPERATION_BANCAIRE_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    reference: null,              // String - Format: OP-YYYYMM-XXXX
    
    // ========================================
    // OPÉRATION
    // ========================================
    
    date: null,                   // String - Format: YYYY-MM-DD
    dateValeur: null,             // String - Format: YYYY-MM-DD
    libelle: null,                // String - Description
    montant: 0,                   // Number - Positif=crédit, Négatif=débit
    type: null,                   // String - credit|debit
    categorie: null,              // String - salaires|impots|energie|etc
    
    // ========================================
    // COMPTE BANCAIRE
    // ========================================
    
    compte: null,                 // String - Numéro de compte
    banque: null,                 // String - Nom de la banque
    solde: null,                  // Number - Solde après opération
    
    // ========================================
    // RAPPROCHEMENT
    // ========================================
    
    pointee: false,               // Boolean - Opération pointée
    rapprochee: false,            // Boolean - Opération rapprochée
    rapprochement: {
        date: null,               // Date - Date de rapprochement
        reference: null,          // String - Référence document
        document: null            // String - ID du document lié
    },
    
    // ========================================
    // DATES DE WORKFLOW
    // ========================================
    
    dates: {
        creation: null,           // Timestamp - Date de création
        derniereModification: null // Timestamp - Dernière modif
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    
    intervenants: {
        creePar: {
            id: null,             // String - ID utilisateur
            nom: null,            // String - Nom
            prenom: null          // String - Prénom
        },
        modifiePar: null          // Object ou null - Même structure
    },
    
    // ========================================
    // HISTORIQUE
    // ========================================
    
    historique: []                // Array<Object> - Actions effectuées
};

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer une nouvelle opération vide
 */
export function createNewOperation() {
    return JSON.parse(JSON.stringify(OPERATION_BANCAIRE_TEMPLATE));
}

/**
 * Créer une entrée historique
 */
export function createHistoriqueEntry(action, details, utilisateur) {
    return {
        date: new Date(),
        action: action,
        details: details,
        timestamp: Date.now(),
        utilisateur: utilisateur || {
            id: 'system',
            nom: 'SYSTEM',
            prenom: ''
        }
    };
}

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const OPERATION_BANCAIRE_RULES = {
    required: ['date', 'libelle', 'montant', 'type'],
    
    enum: {
        type: ['credit', 'debit'],
        categorie: [
            'salaires',
            'remboursement_secu',
            'remboursement_mutuelle',
            'impots',
            'energie',
            'telecom',
            'assurances',
            'alimentation',
            'carburant',
            'restaurant',
            'ecommerce',
            'credit_immobilier',
            'loyer',
            'sante',
            'retrait_especes',
            'virement',
            'cheque',
            'frais_bancaires',
            'abonnements',
            'epargne',
            'autre'
        ]
    },
    
    validations: {
        reference: /^OP-\d{6}-[A-Z0-9]{4}$/,
        date: /^\d{4}-\d{2}-\d{2}$/,
        montant: /^-?\d+(\.\d{1,2})?$/
    }
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    OPERATION_BANCAIRE_TEMPLATE,
    OPERATION_BANCAIRE_RULES,
    createNewOperation,
    createHistoriqueEntry
};