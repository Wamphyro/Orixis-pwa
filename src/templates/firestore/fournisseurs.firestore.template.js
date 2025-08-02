// ========================================
// TEMPLATE FIRESTORE - FOURNISSEURS
// Collection: fournisseurs
// ========================================

export const FOURNISSEUR_TEMPLATE = {
    // Identification
    identification: {
        raisonSociale: null,        // String
        enseigne: null,             // String
        formeJuridique: null,       // String - SA|SARL|SAS|etc
        siret: null,                // String (90% fillRate)
        numeroTVA: null,            // String
        numeroClient: null          // String (20% fillRate) - Notre n° chez eux
    },
    
    // Catégorisation
    categorisation: {
        categorie: null,            // String - medical|assurance|service|etc
        type: null,                 // String - bien|service
        sousCategorie: null,        // String (90% fillRate)
        importance: 'standard',     // String - standard|critique
        marquesDistribuees: []      // Array<String> (50% fillRate)
    },
    
    // Comptabilité
    comptabilite: {
        compteFournisseur: null,    // String - Ex: "401XXX"
        compteAchat: null           // String
    },
    
    // Statut
    statut: {
        actif: true,                // boolean
        dateCreation: null,         // Timestamp
        dateModification: null      // Timestamp
    },
    
    // Contacts (20% fillRate)
    contacts: null,                 // Object ou null
    
    // Conditions commerciales (20% fillRate)
    conditions: null,               // Object ou null
    
    // Paiement (20% fillRate)
    paiement: null                  // Object ou null
};

export const FOURNISSEUR_RULES = {
    required: ['identification.raisonSociale', 'identification.numeroTVA', 'categorisation', 'statut.actif'],
    unique: ['identification.siret', 'identification.numeroTVA'],
    enum: {
        'categorisation.categorie': ['medical', 'assurance', 'service', 'informatique', 'fourniture'],
        'categorisation.type': ['bien', 'service'],
        'categorisation.importance': ['standard', 'critique', 'strategique']
    }
};