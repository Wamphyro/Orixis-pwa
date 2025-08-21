// ========================================
// TEMPLATE FIRESTORE - DÉCLARATIONS TVA
// Collection: declarationsTVA
// ========================================

export const DECLARATION_TVA_TEMPLATE = {
    // Identification
    reference: null,                // String - Format: TVA-AAAA-TT ou TVA-AAAA-MM
    
    // Société
    societe: {
        id: null,                   // String - Référence vers societes/xxx
        code: null                  // String - Ex: "AUDIO-LYON"
    },
    
    // Période
    periode: {
        type: 'mensuelle',          // String - mensuelle|trimestrielle
        annee: null,                // String - Ex: "2025"
        mois: null,                 // String - "01" à "12" (si mensuelle)
        trimestre: null             // String - "T1" à "T4" (si trimestrielle)
    },
    
    // Calculs TVA
    calcul: {
        tvaDue: 0,                  // number - TVA à payer
        creditTVA: 0                // number - Crédit de TVA
    },
    
    // Statut
    statut: {
        workflow: 'brouillon'       // String - brouillon|validee|payee
    }
};

export const DECLARATION_TVA_RULES = {
    required: ['reference', 'societe', 'periode', 'calcul', 'statut'],
    unique: ['reference'],
    enum: {
        'periode.type': ['mensuelle', 'trimestrielle'],
        'statut.workflow': ['brouillon', 'validee', 'payee']
    },
    indexed: ['statut.workflow', 'periode.type', 'periode.annee']
};