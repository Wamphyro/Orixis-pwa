// ========================================
// TEMPLATE FIRESTORE - FACTURES FOURNISSEURS
// Collection: facturesFournisseurs
// ========================================

export const FACTURE_FOURNISSEUR_TEMPLATE = {
    // Identification
    numeroFacture: null,           // String - Numéro du fournisseur
    numeroInterne: null,           // String - Format: FF-AAAAMMJJ-XXXX
    
    // Fournisseur
    fournisseur: {
        nom: null,                 // String - Nom du fournisseur
        categorie: null,           // String - telecom|energie|services|etc
        numeroClient: null,        // String - Notre numéro chez eux
        siren: null                // String - SIREN du fournisseur
    },
    
    // Montants
    montantHT: 0,                  // number - Montant HT
    montantTVA: 0,                 // number - Montant TVA
    montantTTC: 0,                 // number - Montant TTC
    tauxTVA: 20,                   // number - Taux de TVA
    
    // Dates
    dateFacture: null,             // Timestamp - Date de la facture
    dateEcheance: null,            // Timestamp - Date d'échéance
    dateReception: null,           // Timestamp - Date de réception/upload
    
    // Période facturée (pour abonnements)
    periodeDebut: null,            // Timestamp ou null
    periodeFin: null,              // Timestamp ou null
    
    // Paiement
    aPayer: false,                 // boolean - Sélectionné à l'upload
    statutPaiement: 'nouvelle',    // String - nouvelle|a_payer|payee|etc
    datePaiement: null,            // Timestamp ou null
    modePaiement: null,            // String ou null
    referenceVirement: null,       // String ou null
    
    // Organisation
    societe: null,                 // String - Notre société
    codeMagasin: null,             // String - Magasin concerné
    magasinUploadeur: null,        // String - Qui a uploadé
    
    // Documents
    documents: [],                 // Array<Object> - PDFs uploadés
    
    // Workflow
    statut: 'nouvelle',            // String - Statut global
    
    // Dates du workflow
    dates: {
        creation: null,            // Timestamp
        analyse: null,             // Timestamp - Analyse IA
        verification: null,        // Timestamp - Vérification
        paiement: null,            // Timestamp - Paiement
        pointage: null             // Timestamp - Rapprochement
    },
    
    // Intervenants
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
    
    // Historique
    historique: [],                // Array<Object>
    
    // Données brutes IA (pour debug/inspection)
    iaData: {
        reponseGPT: null,          // Object - Réponse JSON complète de GPT
        dateAnalyse: null,         // Timestamp - Date de l'analyse
        modeleIA: null,            // String - Modèle utilisé (gpt-4.1-mini)
        erreurIA: null             // String - Erreur si échec
    }
};

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

export const FACTURE_FOURNISSEUR_INDEXES = [
    {
        fields: ['statut', 'dateFacture'],
        name: 'idx_statut_date'
    },
    {
        fields: ['fournisseur.nom', 'dateFacture'],
        name: 'idx_fournisseur_date'
    },
    {
        fields: ['codeMagasin', 'statut'],
        name: 'idx_magasin_statut'
    },
    {
        fields: ['numeroInterne'],
        name: 'idx_numero_interne',
        unique: true
    }
];