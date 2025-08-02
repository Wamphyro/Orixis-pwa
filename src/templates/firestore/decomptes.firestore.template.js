// ========================================
// TEMPLATE FIRESTORE - DÉCOMPTES MUTUELLES
// Collection: decomptes_mutuelles
// ========================================

export const DECOMPTE_TEMPLATE = {
    // Identification
    numeroDecompte: null,           // String - Format: DEC-AAAAMMJJ-XXXX
    typeDecompte: 'individuel',     // String - individuel|collectif
    
    // Organisation
    societe: 'ORIXIS SAS',          // String - Nom complet de la société
    codeMagasin: null,              // String - Magasin où l'achat a été fait
    magasinUploadeur: null,         // String - Qui a uploadé
    prestataireTP: null,            // String ou null - Tiers payant
    
    // Client (structure complète même si vide)
    client: {
        id: null,                   // String ou null
        nom: null,                  // String ou null
        prenom: null,               // String ou null
        numeroSecuriteSociale: null // String ou null
    },
    
    // Données financières
    mutuelle: null,                 // String ou null
    montantRemboursementClient: 0,  // number
    montantVirement: 0,             // number
    nombreClients: 1,               // number (1 pour individuel)
    dateVirement: null,             // Timestamp ou null - Date du virement effectué
    
    // Dates
    dates: {
        creation: null,             // Timestamp
        transmissionIA: null,       // Timestamp ou null
        traitementEffectue: null,   // Timestamp ou null
        traitementManuel: null,     // Timestamp ou null
        rapprochementBancaire: null // Timestamp ou null
    },
    
    // Intervenants
    intervenants: {
        creePar: {
            id: null,               // String
            nom: null,              // String
            prenom: null,           // String
            role: null              // String
        },
        traitePar: null,            // Object ou null
        rapprochePar: null          // Object ou null
    },
    
    // Documents uploadés
    documents: [],                  // Array<Object>
    
    // Références
    virementId: null,               // String ou null - Format: VIR-AAAA-MM-XXX
    
    // Workflow
    statut: 'nouveau',              // String
    
    // Historique (version complexe comme les anciens)
    historique: []                  // Array<Object>
};

// Structure d'une entrée historique
export const HISTORIQUE_ENTRY_TEMPLATE = {
    date: null,                     // Timestamp
    action: null,                   // String
    details: null,                  // String
    timestamp: null,                // number (milliseconds)
    utilisateur: {                  // Object
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        role: null                  // String
    }
};

export const DECOMPTE_RULES = {
    required: ['numeroDecompte', 'societe', 'codeMagasin', 'statut', 'typeDecompte'],
    enum: {
        typeDecompte: ['individuel', 'collectif'],
        statut: ['nouveau', 'en_cours_traitement', 'traitement_effectue', 'traitement_manuel', 'valide', 'erreur']
    }
};