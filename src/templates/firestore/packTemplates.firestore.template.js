// ========================================
// TEMPLATE FIRESTORE - PACK TEMPLATES
// Collection: packTemplates
// ========================================

export const PACK_TEMPLATE_TEMPLATE = {
    // Identification
    nom: null,                      // String
    description: null,              // String
    
    // Classification
    categorie: null,                // String - premiere_paire|reparation|etc
    
    // Contenu
    produits: [],                   // Array<Object> (89% fillRate)
    
    // Affichage
    ordre: 1,                       // number - Ordre d'affichage
    
    // Statut
    actif: true                     // boolean
};

export const PACK_TEMPLATE_RULES = {
    required: ['nom', 'description', 'categorie', 'ordre', 'actif'],
    enum: {
        categorie: ['premiere_paire', 'reparation', 'entretien', 'accessoires']
    }
};