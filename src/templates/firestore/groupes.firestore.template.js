// ========================================
// TEMPLATE FIRESTORE - GROUPES
// Collection: groupes
// ========================================

export const GROUPE_TEMPLATE = {
    // Identification
    id: null,                       // String - Identifiant unique (ex: "technicien")
    nom: null,                      // String - Nom affiché
    description: null,              // String - Description du groupe
    icon: "👥",                     // String - Emoji ou icône
    couleur: "#6B7280",            // String - Couleur hexadécimale pour badges
    
    // Permissions sur les pages/modules
    permissions: {
        pages: {
            // Structure par défaut pour chaque page
            // "page_id": { view: true, create: true, edit: true, delete: true, export: true, import: false, validate: false, print: true }
            
            "interventions": {
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
                import: false,
                validate: false,
                print: true
            },
            "commandes": {
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
                import: true,
                validate: true,
                print: true
            },
            "decompte-secu": {
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
                import: false,
                validate: false,
                print: true
            },
            "decompte-mutuelle": {
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
                import: false,
                validate: false,
                print: true
            },
            "operations-bancaires": {
                view: true,
                create: true,
                edit: true,
                delete: true,
                export: true,
                import: true,
                validate: false,
                print: true
            }
        },
        
        // Fonctionnalités globales
        fonctionnalites: {
            // Gestion utilisateurs
            voir_tous_utilisateurs: true,
            creer_utilisateurs: true,
            modifier_utilisateurs: true,
            supprimer_utilisateurs: true,
            modifier_tous_codes_pin: true,
            
            // Gestion magasins
            acces_tous_magasins: true,
            gerer_parametres_magasins: true,
            
            // Statistiques et rapports
            voir_statistiques_globales: true,
            voir_statistiques_magasin: true,
            exporter_donnees_globales: true,
            
            // Paramètres système
            gerer_parametres_systeme: true,
            gerer_categories_produits: true,
            gerer_templates_documents: true
        }
    },
    
    // Métadonnées
    ordre: 1,                       // number - Ordre d'affichage
    actif: true,                    // boolean - Groupe actif ou non
    dateCreation: null,             // Timestamp
    dateModification: null          // Timestamp
};

// Groupes prédéfinis pour l'initialisation
export const GROUPES_INITIAUX = [
    {
        id: "admin_general",
        nom: "Administrateur Général",
        description: "Accès complet à toutes les fonctionnalités",
        icon: "👑",
        couleur: "#DC2626",
        ordre: 0
        // permissions: toutes à true
    },
    {
        id: "responsable_magasin",
        nom: "Responsable Magasin",
        description: "Gestion complète d'un magasin et de son équipe",
        icon: "🏪",
        couleur: "#F59E0B",
        ordre: 1
        // permissions: toutes à true pour l'instant
    },
    {
        id: "audioprothesiste",
        nom: "Audioprothésiste",
        description: "Gestion des interventions et clients",
        icon: "👂",
        couleur: "#3B82F6",
        ordre: 2
    },
    {
        id: "technicien",
        nom: "Technicien",
        description: "Interventions et support technique",
        icon: "🔧",
        couleur: "#10B981",
        ordre: 3
    },
    {
        id: "assistant_administratif",
        nom: "Assistant Administratif",
        description: "Gestion administrative et décomptes",
        icon: "📋",
        couleur: "#8B5CF6",
        ordre: 4
    },
    {
        id: "comptable",
        nom: "Comptable",
        description: "Gestion comptable et financière",
        icon: "💰",
        couleur: "#6366F1",
        ordre: 5
    },
    {
        id: "opticien",
        nom: "Opticien",
        description: "Gestion des clients et interventions optique",
        icon: "👓",
        couleur: "#06B6D4",
        ordre: 6
    }
];

export const GROUPE_RULES = {
    required: ['id', 'nom', 'permissions', 'actif'],
    unique: ['id'],
    indexed: ['actif', 'ordre']
};