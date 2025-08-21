// ========================================
// TEMPLATE FIRESTORE - PAGES
// Collection: pages
// ========================================

export const PAGE_TEMPLATE = {
    // Identification
    id: null,                       // String - Identifiant unique (ex: "interventions")
    nom: null,                      // String - Nom complet de la page
    module: null,                   // String - Nom du module/dossier
    description: null,              // String - Description de la fonctionnalité
    
    // Configuration de la carte Home
    homeCard: {
        titre: null,                // String - Titre de la carte
        sousTitre: null,           // String - Sous-titre/description courte
        icon: "📄",                // String - Emoji ou classe d'icône
        couleur: "#6B7280",        // String - Couleur de la carte
        ordre: 99,                 // number - Ordre d'affichage
        statsKey: null,            // String - Clé pour afficher une stat (optionnel)
        action: {
            label: "Accéder",      // String - Label du bouton
            url: null              // String - URL relative du module
        }
    },
    
    // Actions disponibles sur cette page
    actions: [
        "view",                    // Voir/consulter
        "create",                  // Créer
        "edit",                    // Modifier
        "delete",                  // Supprimer
        "export",                  // Exporter
        "import",                  // Importer
        "validate",                // Valider
        "print"                    // Imprimer
    ],
    
    // Fonctionnalités spécifiques (optionnel)
    fonctionnalites: [],           // Array - Liste de fonctionnalités particulières
    // Exemple : ["modifier_prix", "annuler_commande", "envoyer_email"]
    
    // Métadonnées
    actif: true,                   // boolean - Page active ou non
    dateCreation: null,            // Timestamp
    dateModification: null         // Timestamp
};

// Pages initiales du système
export const PAGES_INITIALES = [
    {
        id: "interventions",
        nom: "Gestion des Interventions",
        module: "intervention",
        description: "Créer et gérer les interventions SAV",
        homeCard: {
            titre: "Interventions",
            sousTitre: "Gérer les réparations",
            icon: "🔧",
            couleur: "#3B82F6",
            ordre: 1,
            statsKey: "interventions_count",
            action: {
                label: "Accéder",
                url: "../intervention/intervention.html"
            }
        },
        actions: ["view", "create", "edit", "delete", "export", "print"]
    },
    {
        id: "commandes",
        nom: "Gestion des Commandes",
        module: "commandes",
        description: "Gérer les commandes fournisseurs et stock",
        homeCard: {
            titre: "Commandes",
            sousTitre: "Commandes fournisseurs",
            icon: "📦",
            couleur: "#10B981",
            ordre: 2,
            statsKey: "commandes_count",
            action: {
                label: "Accéder",
                url: "../commandes/commandes.html"
            }
        },
        actions: ["view", "create", "edit", "delete", "export", "import", "validate", "print"],
        fonctionnalites: ["modifier_prix", "valider_commande", "annuler_commande"]
    },
    {
        id: "decompte-secu",
        nom: "Décomptes Sécurité Sociale",
        module: "decompte-secu",
        description: "Gérer les décomptes de sécurité sociale",
        homeCard: {
            titre: "Décomptes Sécu",
            sousTitre: "Sécurité sociale",
            icon: "🏥",
            couleur: "#F59E0B",
            ordre: 3,
            statsKey: "decomptes_secu_count",
            action: {
                label: "Accéder",
                url: "../decompte-secu/decompte-secu.html"
            }
        },
        actions: ["view", "create", "edit", "delete", "export", "print"]
    },
    {
        id: "decompte-mutuelle",
        nom: "Décomptes Mutuelle",
        module: "decompte-mutuelle",
        description: "Gérer les décomptes de mutuelle",
        homeCard: {
            titre: "Décomptes Mutuelle",
            sousTitre: "Mutuelles",
            icon: "💊",
            couleur: "#8B5CF6",
            ordre: 4,
            statsKey: "decomptes_mutuelle_count",
            action: {
                label: "Accéder",
                url: "../decompte-mutuelle/decompte-mutuelle.html"
            }
        },
        actions: ["view", "create", "edit", "delete", "export", "print"]
    },
    {
        id: "operations-bancaires",
        nom: "Opérations Bancaires",
        module: "operations-bancaires",
        description: "Gérer les opérations bancaires et rapprochements",
        homeCard: {
            titre: "Opérations Bancaires",
            sousTitre: "Gestion financière",
            icon: "💰",
            couleur: "#6366F1",
            ordre: 5,
            statsKey: "operations_count",
            action: {
                label: "Accéder",
                url: "../operations-bancaires/operations-bancaires.html"
            }
        },
        actions: ["view", "create", "edit", "delete", "export", "import", "print"],
        fonctionnalites: ["rapprochement_bancaire", "import_releves"]
    }
];

export const PAGE_RULES = {
    required: ['id', 'nom', 'module', 'homeCard', 'actions', 'actif'],
    unique: ['id'],
    indexed: ['actif', 'module']
};