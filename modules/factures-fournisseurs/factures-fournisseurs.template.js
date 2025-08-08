// ========================================
// FACTURES-FOURNISSEURS.FIRESTORE.TEMPLATE.JS - TEMPLATE FIRESTORE
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.firestore.template.js
//
// DESCRIPTION:
// Template de structure pour les factures fournisseurs
// Définit la structure exacte d'un document Firestore
// ========================================

export const FACTURE_FOURNISSEUR_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    numeroFacture: null,           // String - Numéro du fournisseur
    numeroInterne: null,           // String - Format: FF-AAAAMMJJ-XXXX
    
    // ========================================
    // FOURNISSEUR
    // ========================================
    fournisseur: {
        nom: null,                 // String - Nom du fournisseur
        categorie: null,           // String - telecom|energie|services|etc
        numeroClient: null,        // String - Notre numéro chez eux
        siren: null                // String - SIREN du fournisseur
    },
    
    // ========================================
    // MONTANTS
    // ========================================
    montantHT: 0,                  // number - Montant HT
    montantTVA: 0,                 // number - Montant TVA
    montantTTC: 0,                 // number - Montant TTC
    tauxTVA: 20,                   // number - Taux de TVA
    
    // ========================================
    // DATES
    // ========================================
    dateFacture: null,             // Timestamp - Date de la facture
    dateEcheance: null,            // Timestamp - Date d'échéance
    dateReception: null,           // Timestamp - Date de réception/upload
    
    // Période facturée (pour abonnements)
    periodeDebut: null,            // Timestamp ou null
    periodeFin: null,              // Timestamp ou null
    
    // ========================================
    // PAIEMENT
    // ========================================
    aPayer: false,                 // boolean - Sélectionné à l'upload
    statutPaiement: 'nouvelle',    // String - nouvelle|a_payer|payee|etc
    datePaiement: null,            // Timestamp ou null
    modePaiement: null,            // String ou null
    referenceVirement: null,       // String ou null
    
    // ========================================
    // ORGANISATION
    // ========================================
    societe: null,                 // String - Notre société
    codeMagasin: null,             // String - Magasin concerné
    magasinUploadeur: null,        // String - Qui a uploadé
    
    // ========================================
    // DOCUMENTS
    // ========================================
    documents: [],                 // Array<Object> - PDFs uploadés
    // Structure d'un document:
    // {
    //     nom: String,
    //     nomOriginal: String,
    //     chemin: String,
    //     url: String,
    //     taille: Number,
    //     type: String,
    //     hash: String,
    //     dateUpload: Timestamp
    // }
    
    // ========================================
    // WORKFLOW
    // ========================================
    statut: 'nouvelle',            // String - Statut global
    
    // ========================================
    // DATES DU WORKFLOW
    // ========================================
    dates: {
        creation: null,            // Timestamp
        analyse: null,             // Timestamp - Analyse IA
        verification: null,        // Timestamp - Vérification
        paiement: null,            // Timestamp - Paiement
        pointage: null             // Timestamp - Rapprochement
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    intervenants: {
        creePar: {
            id: null,              // String
            nom: null,             // String
            prenom: null,          // String
            role: null             // String
        },
        verifiePar: null,          // Object ou null
        payePar: null,             // Object ou null
        pointePar: null            // Object ou null
    },
    
    // ========================================
    // HISTORIQUE
    // ========================================
    historique: [],                // Array<Object>
    // Structure d'une entrée historique:
    // {
    //     date: Timestamp,
    //     action: String,
    //     details: String,
    //     timestamp: Number,
    //     utilisateur: {
    //         id: String,
    //         nom: String,
    //         prenom: String,
    //         role: String
    //     }
    // }
    
    // ========================================
    // DONNÉES BRUTES IA
    // ========================================
    iaData: {
        reponseGPT: null,          // Object - Réponse JSON complète de GPT
        dateAnalyse: null,         // Timestamp - Date de l'analyse
        modeleIA: null,            // String - Modèle utilisé (gpt-4o-mini)
        erreurIA: null             // String - Erreur si échec
    }
};

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const FACTURE_FOURNISSEUR_RULES = {
    required: ['numeroInterne', 'documents', 'statut'],
    unique: ['numeroInterne'],
    enum: {
        statut: ['nouvelle', 'a_payer', 'deja_payee', 'payee', 'a_pointer', 'pointee', 'en_retard', 'annulee'],
        statutPaiement: ['nouvelle', 'a_payer', 'deja_payee', 'payee', 'a_pointer', 'pointee', 'en_retard', 'annulee'],
        modePaiement: ['virement', 'prelevement', 'cheque', 'cb', 'especes'],
        'fournisseur.categorie': ['telecom', 'energie', 'services', 'informatique', 'fournitures', 'autre']
    },
    validation: {
        montantTTC: 'montantTTC >= 0',
        tauxTVA: 'tauxTVA >= 0 && tauxTVA <= 100',
        numeroInterne: '/^FF-\\d{8}-\\d{4}$/'
    }
};

// ========================================
// INDEX FIRESTORE RECOMMANDÉS
// ========================================

export const FACTURE_FOURNISSEUR_INDEXES = [
    {
        fields: ['statut', 'dateFacture'],
        name: 'idx_statut_date',
        description: 'Pour filtrer par statut et trier par date'
    },
    {
        fields: ['fournisseur.nom', 'dateFacture'],
        name: 'idx_fournisseur_date',
        description: 'Pour filtrer par fournisseur et trier par date'
    },
    {
        fields: ['codeMagasin', 'statut'],
        name: 'idx_magasin_statut',
        description: 'Pour filtrer par magasin et statut'
    },
    {
        fields: ['numeroInterne'],
        name: 'idx_numero_interne',
        unique: true,
        description: 'Index unique sur le numéro interne'
    },
    {
        fields: ['aPayer', 'dateEcheance'],
        name: 'idx_a_payer_echeance',
        description: 'Pour trouver les factures à payer par échéance'
    }
];

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer une nouvelle facture avec le template
 */
export function createNewFacture(overrides = {}) {
    return {
        ...JSON.parse(JSON.stringify(FACTURE_FOURNISSEUR_TEMPLATE)),
        ...overrides
    };
}

/**
 * Valider une facture contre les règles
 */
export function validateFacture(facture) {
    const errors = [];
    
    // Vérifier les champs requis
    for (const field of FACTURE_FOURNISSEUR_RULES.required) {
        if (!facture[field]) {
            errors.push(`Le champ ${field} est requis`);
        }
    }
    
    // Vérifier les énumérations
    for (const [field, values] of Object.entries(FACTURE_FOURNISSEUR_RULES.enum)) {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key], facture)
            : facture[field];
            
        if (value && !values.includes(value)) {
            errors.push(`${field} doit être parmi: ${values.join(', ')}`);
        }
    }
    
    // Vérifier le format du numéro interne
    if (facture.numeroInterne && !/^FF-\d{8}-\d{4}$/.test(facture.numeroInterne)) {
        errors.push('Format de numeroInterne invalide (FF-AAAAMMJJ-XXXX)');
    }
    
    // Vérifier les montants
    if (facture.montantTTC < 0) {
        errors.push('Le montant TTC ne peut pas être négatif');
    }
    
    if (facture.tauxTVA < 0 || facture.tauxTVA > 100) {
        errors.push('Le taux de TVA doit être entre 0 et 100');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    FACTURE_FOURNISSEUR_TEMPLATE,
    FACTURE_FOURNISSEUR_RULES,
    FACTURE_FOURNISSEUR_INDEXES,
    createNewFacture,
    validateFacture
};