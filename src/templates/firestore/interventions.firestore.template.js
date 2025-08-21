// ========================================
// TEMPLATE FIRESTORE - INTERVENTIONS
// Collection: interventions
// ========================================

export const INTERVENTION_TEMPLATE = {
    // Identification
    id: null,                       // String - Même que numeroIntervention
    numeroIntervention: null,       // String - Format: INT-9XXX-AAAAMMJJ-XXXX
    
    // Magasin
    magasin: null,                  // String - Code magasin
    
    // Client
    client: {
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        telephone: null             // String
    },
    
    // Intervenant
    intervenant: {
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
    },
    
    // Appareil
    appareil: {
        marque: null,               // String
        modele: null,               // String
        type: null,                 // String - BTE|RIC|CIC|ITC
        numeroSerie: ''             // String
    },
    
    // Intervention
    problemes: [],                  // Array<String>
    actions: [],                    // Array<String>
    observations: '',               // String - Texte long
    resultat: null,                 // String - Résolu|Partiel|Non résolu
    
    // Dates
    dates: {
        creation: null,             // Timestamp
        intervention: null,         // Timestamp
        cloture: null,              // Timestamp ou null
        signatureClient: null,      // Timestamp ou null
        signatureIntervenant: null  // Timestamp ou null
    },
    
    // Statut
    statut: 'planifiee',            // String
    
    // Signatures (optionnel - 50% fillRate)
    signatures: null,               // Object ou null
    
    // Escalade SAV (optionnel - 50% fillRate)
    escaladeSAV: null               // Object ou null
};

export const INTERVENTION_RULES = {
    required: ['numeroIntervention', 'magasin', 'client', 'intervenant', 'statut'],
    enum: {
        statut: ['planifiee', 'en_cours', 'terminee', 'annulee'],
        resultat: ['Résolu', 'Partiel', 'Non résolu'],
        'appareil.type': ['BTE', 'RIC', 'CIC', 'ITC', 'ITE']
    }
};