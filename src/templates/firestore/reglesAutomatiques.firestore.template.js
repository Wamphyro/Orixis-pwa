// ========================================
// TEMPLATE FIRESTORE - RÈGLES AUTOMATIQUES
// Collection: reglesAutomatiques
// ========================================

export const REGLE_AUTOMATIQUE_TEMPLATE = {
    // Identification
    nom: null,                      // String
    description: null,              // String
    
    // Conditions (83% fillRate)
    conditions: {},                 // Object - Conditions variables
    
    // Actions (83% fillRate)
    actions: [],                    // Array<Object> - Actions à effectuer
    
    // Statut
    actif: true                     // boolean
};

export const REGLE_AUTOMATIQUE_RULES = {
    required: ['nom', 'description', 'actif'],
    conditionsExamples: {
        marque: 'String',
        type: 'String',
        categorie: 'String',
        suffixe: 'String'
    }
};