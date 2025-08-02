// ========================================
// TEMPLATE FIRESTORE - SOCIÉTÉS
// Collection: societes
// ========================================

export const SOCIETE_TEMPLATE = {
    // Identification
    code: null,                     // String - Code unique (ex: "BA", "AUDIO-PARIS")
    
    identification: {
        raisonSociale: null,        // String
        nomCommercial: null,        // String
        formeJuridique: null,       // String - SARL|SAS|SA|EURL|etc
        siren: null,                // String - 9 chiffres
        siret: null,                // String - 14 chiffres
        numeroTVA: null,            // String - Format: FRXXXXXXXXXX
        naf: null,                  // String - Code APE/NAF
        dateCreation: null          // Timestamp
    },
    
    // Siège social
    siegeSocial: {
        rue: null,                  // String
        codePostal: null,           // String
        ville: null,                // String
        pays: 'FR'                  // String - Code pays ISO
    },
    
    // Organisation
    organisation: {
        dirigeant: null,            // String - Nom du dirigeant
        magasins: []                // Array<String> - Codes des magasins
    },
    
    // Comptabilité
    comptabilite: {
        exerciceEnCours: null,      // String - Année en cours
        regimeTVA: 'reel_normal'    // String - reel_normal|reel_simplifie|franchise
    },
    
    // Statut
    statut: {
        actif: true,                // boolean
        dateCreation: null,         // Timestamp
        dateDerniereModification: null // Timestamp
    }
};

export const SOCIETE_RULES = {
    required: ['code', 'identification', 'siegeSocial', 'organisation', 'comptabilite', 'statut'],
    unique: ['code', 'identification.siren', 'identification.siret', 'identification.numeroTVA'],
    enum: {
        'identification.formeJuridique': ['SARL', 'SAS', 'SA', 'EURL', 'SASU', 'SNC'],
        'comptabilite.regimeTVA': ['reel_normal', 'reel_simplifie', 'franchise'],
        'siegeSocial.pays': ['FR', 'BE', 'CH', 'LU']
    },
    indexed: ['statut.actif', 'organisation.magasins']
};