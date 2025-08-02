// ========================================
// TEMPLATE FIRESTORE - MAGASINS
// Collection: magasins
// ========================================

export const MAGASIN_TEMPLATE = {
    // Identification
    code: null,                     // String - Format: 9XXX
    nom: null,                      // String
    numeroFINESS: null,             // String
    
    // Société
    societe: {
        id: null,                   // String - Référence: societes/xxx
        code: null,                 // String - Ex: "BA"
        raisonSociale: null         // String (optionnel - 10% fillRate)
    },
    
    // Coordonnées
    adresse: {
        rue: '',                    // String
        codePostal: '',             // String
        ville: ''                   // String
    },
    
    contact: {
        email: null,                // String
        telephone: null             // String
    },
    
    // Données bancaires
    compteBancaire: {
        iban: null,                 // String
        bic: null,                  // String
        banque: null,               // String
        libelle: null,              // String
        actif: true                 // boolean
    },
    
    // Comptabilité
    comptabilite: {
        compteVente: null,          // String
        journalVente: null,         // String
        centreProfit: null,         // String
        codeAnalytique: null        // String
    },
    
    // Statut et métadonnées
    actif: true,                    // boolean
    dateCreation: null,             // Timestamp
    
    metadata: {                     // Object (optionnel - 90% fillRate)
        derniereModification: null  // Timestamp
    }
};

export const MAGASIN_RULES = {
    required: ['code', 'nom', 'societe', 'actif'],
    unique: ['code'],
    pattern: {
        code: /^9[A-Z]{3}$/         // Format: 9XXX
    }
};