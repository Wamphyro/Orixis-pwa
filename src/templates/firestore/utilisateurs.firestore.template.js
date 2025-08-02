// ========================================
// TEMPLATE FIRESTORE - UTILISATEURS
// Collection: utilisateurs
// ========================================

export const UTILISATEUR_TEMPLATE = {
    // Identification
    id: null,                       // String - ID unique (souvent = code)
    code: null,                     // String - Code à 4 chiffres pour connexion
    nom: null,                      // String
    prenom: null,                   // String
    
    // Authentification
    lastPasswordChange: null,       // number - Timestamp du dernier changement
    
    // Rôle et permissions
    role: 'assistant',              // String - admin|audioprothesiste|assistant|etc
    
    // Magasins
    magasinParDefaut: null,         // String - Code magasin par défaut
    autorisations: {},              // Object - { "9XXX": { acces: true }, ... }
    
    // Statut
    actif: true,                    // boolean
    dateCreation: null              // Timestamp
};

// Structure d'une autorisation magasin
export const AUTORISATION_MAGASIN_TEMPLATE = {
    acces: false,                   // boolean - Accès autorisé
    responsable: false              // boolean - Est responsable du magasin (optionnel)
};

export const UTILISATEUR_RULES = {
    required: ['code', 'nom', 'prenom', 'role', 'magasinParDefaut', 'autorisations', 'actif'],
    unique: ['id', 'code'],
    enum: {
        role: ['admin', 'audioprothesiste', 'assistant', 'comptable', 'technicien']
    },
    indexed: ['actif', 'role', 'magasinParDefaut'],
    pattern: {
        code: /^\d{4}$/  // Code à 4 chiffres
    }
};