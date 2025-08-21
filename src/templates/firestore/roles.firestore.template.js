// ========================================
// TEMPLATE FIRESTORE - RÔLES
// Collection: roles
// ========================================

export const ROLE_TEMPLATE = {
    // Identification
    nom: null,                      // String - Nom technique du rôle
    label: null,                    // String - Libellé affiché (avec emoji)
    niveau: 99,                     // number - Niveau hiérarchique (0=admin, 99=basique)
    
    // Permissions
    permissions: {
        // Gestion utilisateurs
        creerUtilisateurs: false,           // boolean
        gererUtilisateurs: false,           // boolean
        supprimerUtilisateurs: false,       // boolean
        
        // Accès
        accesTousLesMagasins: false,        // boolean
        modifierTousLesCodes: false,        // boolean
        
        // Fonctionnalités
        voirStatistiques: false,            // boolean
        gererCommandes: true,               // boolean
        gererClients: true,                 // boolean
        gererInterventions: true,           // boolean
        gererFacturation: false,            // boolean
        gererComptabilite: false,           // boolean
        gererParametres: false              // boolean
    }
};

export const ROLE_RULES = {
    required: ['nom', 'label', 'niveau', 'permissions'],
    unique: ['nom'],
    enum: {
        niveau: [0, 1, 2, 3, 4, 5, 99]
    }
};