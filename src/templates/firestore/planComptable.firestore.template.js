// ========================================
// TEMPLATE FIRESTORE - PLAN COMPTABLE
// Collection: planComptable
// ========================================

export const PLAN_COMPTABLE_TEMPLATE = {
    // Identification
    numero: null,                   // String - Numéro de compte (ex: "101000")
    libelle: null,                  // String - Libellé du compte
    
    // Classification
    classification: {
        classe: null,               // String - "1" à "7"
        type: null                  // String - capitaux|immobilisations|stocks|tiers|financier|charges|produits
    },
    
    // Paramètres
    parametres: {
        actif: true,                // boolean
        collectif: false,           // boolean - Compte collectif (clients/fournisseurs)
        lettrable: false,           // boolean - Permet le lettrage
        sensNormal: null            // String - debit|credit
    }
};

export const PLAN_COMPTABLE_RULES = {
    required: ['numero', 'libelle', 'classification', 'parametres'],
    unique: ['numero'],
    enum: {
        'classification.classe': ['1', '2', '3', '4', '5', '6', '7'],
        'classification.type': ['capitaux', 'immobilisations', 'stocks', 'tiers', 'financier', 'charges', 'produits'],
        'parametres.sensNormal': ['debit', 'credit']
    },
    indexed: ['parametres.actif', 'classification.type', 'classification.classe']
};