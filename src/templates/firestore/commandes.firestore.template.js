// ========================================
// TEMPLATE FIRESTORE - COMMANDES
// Collection: commandes
// ========================================

export const COMMANDE_TEMPLATE = {
    // Identification
    numeroCommande: null,           // String - Format: CMD-AAAAMMJJ-XXXX
    
    // Type et urgence
    typePreparation: 'livraison_premiere_paire',  // String
    niveauUrgence: 'normal',        // String - normal|urgent|tres_urgent
    
    // Magasins
    magasinReference: null,         // String - Magasin de référence
    magasinLivraison: null,         // String - Magasin de livraison
    
    // Client
    client: {
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        email: null,                // String
        telephone: null             // String
    },
    
    // Produits et prix
    produits: [],                   // Array<Object>
    prixTotal: 0,                   // number
    
    // Numéros de série
    numerosSerieAssignes: {
        droit: null,                // String ou null
        gauche: null,               // String ou null
        accessoires: []             // Array<String>
    },
    
    // Dates
    dates: {
        commande: null,             // Timestamp
        preparationDebut: null,     // Timestamp
        preparationFin: null,       // Timestamp ou null
        expeditionValidee: null,    // Timestamp ou null
        receptionValidee: null,     // Timestamp ou null
        livraisonPrevue: null,      // Timestamp
        livraisonClient: null,      // Timestamp ou null
        patientPrevenu: null        // Timestamp ou null
    },
    
    // Intervenants
    intervenants: {
        commandePar: {
            id: null,               // String
            nom: null,              // String
            prenom: null,           // String
            role: null              // String
        },
        gerePar: {
            id: null,               // String
            nom: null,              // String
            prenom: null,           // String
            role: null              // String
        },
        livrePar: null              // Object ou null - Même structure
    },
    
    // Expédition
    expedition: {
        necessiteExpedition: false, // boolean
        envoi: {
            dateEnvoi: null,        // Timestamp ou null
            transporteur: null,     // String ou null
            numeroSuivi: null,      // String ou null
            scanPar: null           // Object ou null
        },
        reception: {
            dateReception: null,    // Timestamp ou null
            numeroSuiviRecu: null,  // String ou null
            colisConforme: null,    // boolean ou null
            commentaires: null,     // String ou null
            recuPar: null           // Object ou null
        }
    },
    
    // Statut et divers
    statut: 'nouvelle',             // String
    patientPrevenu: false,          // boolean
    commentaires: '',               // String
    
    // Historique
    historique: [],                 // Array<Object>
    
    // Annulation (optionnel)
    annulation: null                // Object ou null
};

export const COMMANDE_RULES = {
    required: ['numeroCommande', 'client', 'magasinReference', 'statut'],
    enum: {
        statut: ['nouvelle', 'en_preparation', 'preparee', 'expediee', 'livree', 'annulee'],
        niveauUrgence: ['normal', 'urgent', 'tres_urgent'],
        typePreparation: ['livraison_premiere_paire', 'reparation', 'accessoires', 'autre']
    }
};