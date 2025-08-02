// ========================================
// TEMPLATE FIRESTORE - PARAMÈTRES COMMANDES
// Collection: parametresCommandes (Document unique)
// ========================================

export const PARAMETRES_COMMANDES_TEMPLATE = {
    // Délais
    delais: {
        normal: {
            jours: 5,               // number
            description: 'Livraison standard',
            modifiable: true        // boolean
        },
        urgent: {
            jours: 2,               // number
            description: 'Livraison express',
            modifiable: true        // boolean
        },
        tres_urgent: {
            jours: 1,               // number
            description: 'Livraison prioritaire',
            modifiable: false       // boolean
        }
    },
    
    // Limites
    limites: {
        maxCommandesParJour: 100,   // number
        maxProduitsParCommande: 50, // number
        montantMaxCommande: 10000   // number
    },
    
    // Stocks
    stocks: {
        gestionActive: true,        // boolean
        alerteSeuilBas: true,       // boolean
        commandeAutomatique: false  // boolean
    },
    
    // Transporteurs
    transporteurs: {
        defaut: 'Colissimo',        // String
        actifs: []                  // Array<String>
    },
    
    // Notifications
    notifications: {
        email: {
            actif: true,            // boolean
            destinataires: [],      // Array<Email>
            evenements: []          // Array<String>
        },
        sms: {
            actif: false            // boolean
        }
    }
};

export const PARAMETRES_COMMANDES_RULES = {
    singleton: true,  // Un seul document dans la collection
    required: ['delais', 'limites', 'stocks', 'transporteurs', 'notifications']
};