// ========================================
// TEMPLATE FIRESTORE - EXERCICES COMPTABLES
// Collection: exercicesComptables
// ========================================

export const EXERCICE_COMPTABLE_TEMPLATE = {
    // Identification
    annee: null,                    // String - Ex: "2025"
    
    // Société
    societe: {
        id: null,                   // String - Référence vers societes/xxx
        code: null                  // String - Ex: "AUDIO-PARIS"
    },
    
    // Statut
    statut: {
        etat: 'ouvert'              // String - ouvert|cloture
    }
};

export const EXERCICE_COMPTABLE_RULES = {
    required: ['annee', 'societe', 'statut'],
    unique: ['annee', 'societe.id'],
    enum: {
        'statut.etat': ['ouvert', 'cloture']
    },
    indexed: ['statut.etat', 'annee']
};