// ========================================
// TEMPLATE FIRESTORE - UTILISATEURS
// Collection: utilisateurs
// Version 2.0 - Support multi-groupes
// ========================================

export const UTILISATEUR_TEMPLATE = {
    // Identification
    id: null,                       // String - ID unique (souvent = code)
    code: null,                     // String - Code à 4 chiffres pour connexion
    nom: null,                      // String
    prenom: null,                   // String
    
    // Authentification
    lastPasswordChange: null,       // number - Timestamp du dernier changement
    
    // NOUVEAU : Groupes multiples (remplace 'role')
    groupes: [],                    // Array<String> - IDs des groupes ["technicien", "opticien"]
    
    // NOUVEAU : Permissions directes (override)
    permissionsDirectes: {
        pages: {
            // Structure : "page_id": { action: boolean }
            // Exemple : "commandes": { view: true, create: false }
        },
        fonctionnalites: {
            // Structure : "fonctionnalite": boolean
            // Exemple : "voir_statistiques_globales": true
        }
    },
    
    // Magasins et autorisations
    magasinParDefaut: null,         // String - Code magasin par défaut
    autorisations: {},              // Object - { "9XXX": { acces: true, responsable: boolean, permissions: [] }, ... }
    
    // Statut
    actif: true,                    // boolean
    dateCreation: null,             // Timestamp
    dateModification: null,         // Timestamp
    
    // LEGACY - À supprimer après migration
    role: null                      // String - Ancien système, sera converti en groupe
};

// Structure d'une autorisation magasin étendue
export const AUTORISATION_MAGASIN_TEMPLATE = {
    acces: false,                   // boolean - Accès autorisé au magasin
    responsable: false,             // boolean - Est responsable du magasin
    permissions: []                 // Array<String> - Permissions spéciales pour ce magasin
    // Exemples : ["gerer_equipe", "valider_commandes", "modifier_prix"]
};

// Permissions de délégation possibles au niveau magasin
export const PERMISSIONS_DELEGATION_MAGASIN = [
    "gerer_equipe",                // Créer/modifier utilisateurs du magasin
    "valider_commandes",           // Valider les commandes du magasin
    "valider_devis",               // Valider les devis
    "modifier_prix",               // Modifier les prix
    "voir_statistiques",           // Voir les stats du magasin
    "gerer_stock",                 // Gérer le stock du magasin
    "annuler_operations"           // Annuler des opérations
];

export const UTILISATEUR_RULES = {
    required: ['code', 'nom', 'prenom', 'groupes', 'magasinParDefaut', 'autorisations', 'actif'],
    unique: ['id', 'code'],
    indexed: ['actif', 'magasinParDefaut'],
    pattern: {
        code: /^\d{4}$/  // Code à 4 chiffres
    },
    validation: {
        groupes: (value) => Array.isArray(value) && value.length > 0,  // Au moins un groupe
        autorisations: (value) => typeof value === 'object' && Object.keys(value).length > 0  // Au moins un magasin
    }
};

// Helper pour la migration
export const MIGRATION_ROLE_TO_GROUPE = {
    'admin': ['admin_general'],
    'audioprothesiste': ['audioprothesiste'],
    'assistant': ['assistant_administratif'],
    'comptable': ['comptable'],
    'technicien': ['technicien']
};