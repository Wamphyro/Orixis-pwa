// ========================================
// TEMPLATE FIRESTORE - OPÉRATIONS BANCAIRES
// Collection: operationsBancaires
// ========================================

export const OPERATION_BANCAIRE_TEMPLATE = {
    // Identification
    reference: null,                // String - Format: OP-AAAA-MM-XXXX
    
    // Compte bancaire
    compteBancaire: {
        iban: null,                 // String
        type: 'principal',          // String - principal|magasin
        societe: {
            id: null,               // String - Référence vers societes/xxx
            code: null              // String - Ex: "AUDIO-PARIS"
        }
    },
    
    // Détails de l'opération
    operation: {
        dateOperation: null,        // Timestamp
        dateValeur: null,           // Timestamp
        libelle: null,              // String - Description
        montant: 0,                 // number - Positif=crédit, Négatif=débit
        type: null                  // String - virement|prelevement|carte|cheque|autre
    },
    
    // Soldes
    soldes: {
        avant: 0,                   // number - Solde avant opération
        apres: 0                    // number - Solde après opération
    },
    
    // Rapprochement
    rapprochement: {
        statut: 'non_rapproche'     // String - non_rapproche|rapproche|ecart
    },
    
    // Métadonnées
    metadata: {
        dateImport: null            // Timestamp - Date d'import
    }
};

export const OPERATION_BANCAIRE_RULES = {
    required: ['reference', 'compteBancaire', 'operation', 'soldes', 'rapprochement'],
    unique: ['reference'],
    enum: {
        'compteBancaire.type': ['principal', 'magasin'],
        'operation.type': ['virement', 'prelevement', 'carte', 'cheque', 'autre'],
        'rapprochement.statut': ['non_rapproche', 'rapproche', 'ecart']
    },
    indexed: ['operation.dateOperation', 'operation.dateValeur', 'operation.type', 'rapprochement.statut']
};