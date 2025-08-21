// ========================================
// TEMPLATE FIRESTORE - PRODUITS
// Collection: produits
// ========================================

export const PRODUIT_TEMPLATE = {
    // Identification
    reference: null,                // String - Référence interne
    codeProduit: null,              // String - Code fournisseur
    designation: null,              // String - Nom du produit
    
    // Classification
    type: 'accessoire',             // String - accessoire|appareil_auditif
    categorie: null,                // String - chargeur|pile|embout|etc
    marque: null,                   // String
    
    // Données commerciales
    prix: 0,                        // number
    fournisseur: null,              // String
    
    // Gestion stock
    gestionStock: {
        actif: true,                // boolean
        quantiteDisponible: 0,      // number
        seuilAlerte: 5              // number
    },
    
    // Options
    gestionNumeroSerie: false,      // boolean
    necessiteCote: false,           // boolean - Nécessite côté D/G
    
    // Statut
    actif: true                     // boolean
};

export const PRODUIT_RULES = {
    required: ['reference', 'codeProduit', 'designation', 'type', 'prix'],
    unique: ['reference', 'codeProduit'],
    enum: {
        type: ['accessoire', 'appareil_auditif', 'service'],
        categorie: ['chargeur', 'pile', 'embout', 'dome', 'filtre', 'spray', 'autre']
    }
};