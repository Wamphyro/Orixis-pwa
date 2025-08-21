// ========================================
// FACTURES-FOURNISSEURS.TEMPLATE.JS - TEMPLATE FIRESTORE
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.template.js
//
// DESCRIPTION:
// Template enrichi avec données comptables complètes
// Aligné avec le prompt d'extraction IA
// ========================================

export const FACTURE_FOURNISSEUR_TEMPLATE = {
    // ========================================
    // IDENTIFICATION COMPLÈTE
    // ========================================
    numeroFacture: null,           // String - Numéro du fournisseur
    numeroInterne: null,           // String - Format: FF-AAAAMMJJ-XXXX
    referenceInterne: null,        // String - Référence optionnelle
    
    identifiants: {
        numeroFacture: null,       // String - N° facture fournisseur
        numeroCommande: null,      // String - N° commande/BC
        numeroClient: null,        // String - Notre n° client chez eux
        numeroTVAIntra: null,      // String - N° TVA intracommunautaire
        siret: null,               // String - SIRET (14 chiffres)
        siren: null,               // String - SIREN (9 chiffres)
        naf: null                  // String - Code NAF/APE
    },
    
    // ========================================
    // FOURNISSEUR ENRICHI
    // ========================================
    fournisseur: {
        nom: null,                 // String - Raison sociale
        categorie: null,           // String - telecom|energie|services|etc
        numeroClient: null,        // String - Notre n° chez eux
        siren: null,               // String - SIREN fournisseur
        numeroTVA: null,           // String - N° TVA fournisseur
        adresse: null,             // String - Adresse complète
        telephone: null,           // String - Téléphone
        email: null,               // String - Email
        paysDomiciliation: null,   // String - Code ISO pays (FR, DE, etc)
        compteFournisseur: null,   // String - Compte auxiliaire (401XXX)
        banque: {
            nom: null,             // String - Nom banque
            iban: null,            // String - IBAN
            bic: null              // String - BIC/SWIFT
        }
    },
    
    // ========================================
    // CLIENT (nous)
    // ========================================
    client: {
        nom: null,                 // String - Notre raison sociale
        numeroClient: null,        // String - Notre n° client
        adresse: null,             // String - Notre adresse
        numeroTVA: null,           // String - Notre TVA intra
        pointLivraison: null       // String - PDL pour énergie
    },
    
    // ========================================
    // MONTANTS DÉTAILLÉS
    // ========================================
    montantHT: 0,                  // Number - Montant hors taxes
    montantTVA: 0,                 // Number - Montant TVA
    montantTTC: 0,                 // Number - Montant TTC
    tauxTVA: 0,                    // Number - Taux appliqué (0 si exonéré)
    
    montants: {
        montantHT: 0,              // Number
        montantTVA: 0,             // Number
        montantTTC: 0,             // Number
        montantNet: 0,             // Number - Net à payer
        fraisPort: 0,              // Number - Frais de port
        remise: 0,                 // Number - Remise appliquée
        acompte: 0,                // Number - Acompte versé
        soldeRestant: 0            // Number - Reste à payer
    },
    
    // ========================================
    // TVA AVANCÉE
    // ========================================
    tva: {
        regime: null,              // String - NATIONAL|INTRACOMMUNAUTAIRE|EXPORT
        exoneration: false,        // Boolean - Exonéré ou non
        motifExoneration: null,    // String - Raison exonération
        autoliquidation: false,    // Boolean - TVA auto-liquidée
        tauxApplique: 0,           // Number - Taux effectif
        ventilationTVA: []         // Array - Si plusieurs taux
        // Structure ventilation:
        // {
        //     base: 100,
        //     taux: 20,
        //     montant: 20
        // }
    },
    
    // ========================================
    // DATES
    // ========================================
    dateFacture: null,             // Timestamp - Date facture
    dateEcheance: null,            // Timestamp - Date échéance
    dateReception: null,           // Timestamp - Date réception
    datePaiement: null,            // Timestamp - Date paiement effectif
    
    // Période facturée
    periodeDebut: null,            // Timestamp
    periodeFin: null,              // Timestamp
    
    // ========================================
    // PAIEMENT
    // ========================================
    paiement: {
        modePaiement: null,        // String - virement|prelevement|cheque|cb
        conditionsPaiement: null,  // String - "30 jours", "À réception"
        referenceVirement: null,   // String - Référence virement
        iban: null,                // String - IBAN pour paiement
        bic: null,                 // String - BIC pour paiement
        referenceMandat: null,     // String - Mandat prélèvement
        escompte: null,            // Object - {taux, dateLimit, montant}
        penalitesRetard: null      // Object - {taux, montantForfaitaire}
    },
    
    // ========================================
    // COMPTABILITÉ
    // ========================================
    comptabilite: {
        categorieDetectee: null,   // String - Catégorie identifiée
        compteComptable: null,     // String - Compte PCG (6xxx ou 2xxx)
        libelleCompte: null,       // String - Libellé officiel
        justification: null,       // String - Explication de l'affectation
        motsClesDetectes: [],      // Array<String> - Mots-clés trouvés
        fiabilite: 0,              // Number - Score confiance (0-100)
        
        // Données comptables supplémentaires
        journalComptable: 'HA',   // String - Journal d'achat
        codeAnalytique: null,      // String - Centre analytique
        codeBudgetaire: null,      // String - Ligne budgétaire
        typeDepense: null,         // String - FONCTIONNEMENT|INVESTISSEMENT
        affectation: null,         // String - Service/département
        exerciceComptable: null    // String - Année d'exercice
    },
    
    // ========================================
    // DOCUMENTS LIÉS
    // ========================================
    documentsLies: {
        bonCommande: null,         // String - N° BC
        bonLivraison: null,        // String - N° BL
        avoir: null,               // String - N° avoir si lié
        facturePrecedente: null,   // String - Si récurrent
        contrat: null,             // String - N° contrat
        devis: null                // String - N° devis
    },
    
    // ========================================
    // LIGNES DE DÉTAIL
    // ========================================
    lignesDetail: [],              // Array<Object>
    // Structure ligne:
    // {
    //     reference: String,      // Référence article
    //     designation: String,    // Description
    //     codeEAN: String,       // Code barre
    //     codeTarifaire: String, // Code douanier
    //     quantite: Number,
    //     prixUnitaireHT: Number,
    //     remise: Number,
    //     montantHT: Number,
    //     tauxTVA: Number,
    //     montantTVA: Number,
    //     montantTTC: Number,
    //     compteComptable: String
    // }
    
    // ========================================
    // STATUT ET WORKFLOW
    // ========================================
    statut: 'nouvelle',            // String - Statut actuel
    statutPaiement: 'nouvelle',    // String - Statut paiement
    aPayer: false,                 // Boolean
    enRetard: false,               // Boolean
    
    // ========================================
    // ORGANISATION
    // ========================================
    societe: null,                 // String - Notre société
    codeMagasin: null,             // String - Code magasin
    magasinUploadeur: null,        // String - Qui a uploadé
    service: null,                 // String - Service concerné
    
    // ========================================
    // DOCUMENTS UPLOADÉS
    // ========================================
    documents: [],                 // Array<Object> - Fichiers
    // Structure document:
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
    // DATES WORKFLOW
    // ========================================
    dates: {
        creation: null,            // Timestamp
        analyse: null,             // Timestamp - Analyse IA
        verification: null,        // Timestamp
        validation: null,          // Timestamp
        paiement: null,            // Timestamp
        pointage: null,            // Timestamp
        annulation: null           // Timestamp
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    intervenants: {
        creePar: {
            id: null,
            nom: null,
            prenom: null,
            role: null,
            magasin: null
        },
        verifiePar: null,
        valideePar: null,
        payePar: null,
        pointePar: null,
        annuleePar: null
    },
    
    // ========================================
    // HISTORIQUE
    // ========================================
    historique: [],
    // Structure entrée:
    // {
    //     date: Timestamp,
    //     action: String,
    //     details: String,
    //     timestamp: Number,
    //     utilisateur: Object,
    //     donnees: Object
    // }
    
    // ========================================
    // ANALYSE IA
    // ========================================
    iaData: {
        reponseGPT: null,          // Object - JSON complet GPT
        dateAnalyse: null,         // Timestamp
        modeleIA: 'gpt-4o-mini',   // String
        erreurIA: null,            // String - Si échec
        confidence: null,          // Number - Score global
        donneesExtraites: null,    // Object - Données structurées
        promptUtilise: null        // String - Version du prompt
    },
    
    // ========================================
    // MÉTADONNÉES
    // ========================================
    metadata: {
        version: '2.0',            // String - Version template
        source: 'manual',          // String - manual|api|import|email
        tags: [],                  // Array<String>
        notes: null,               // String - Notes libres
        custom: {},                // Object - Champs perso
        
        // Conformité
        mentionsObligatoires: {
            dateFacture: false,
            numeroFacture: false,
            identiteFournisseur: false,
            identiteClient: false,
            montants: false,
            tva: false
        },
        scoreConformite: 0         // Number - % conformité
    },
    
    // ========================================
    // FLAGS
    // ========================================
    flags: {
        urgent: false,             // Boolean
        litige: false,             // Boolean
        recurrence: false,         // Boolean - Facture récurrente
        archive: false,            // Boolean
        verifie: false,            // Boolean
        complet: false,            // Boolean - Infos complètes
        exportCompta: false        // Boolean - Exporté en compta
    }
};

// ========================================
// RÈGLES DE VALIDATION ENRICHIES
// ========================================

export const FACTURE_FOURNISSEUR_RULES = {
    required: [
        'numeroInterne',
        'documents',
        'statut',
        'societe',
        'codeMagasin'
    ],
    
    unique: ['numeroInterne'],
    
    enum: {
        statut: [
            'nouvelle',
            'a_payer',
            'deja_payee',
            'payee',
            'a_pointer',
            'pointee',
            'en_retard',
            'annulee'
        ],
        'paiement.modePaiement': [
            'virement',
            'prelevement',
            'cheque',
            'cb',
            'especes',
            null
        ],
        'tva.regime': [
            'NATIONAL',
            'INTRACOMMUNAUTAIRE',
            'EXPORT',
            null
        ],
        'comptabilite.typeDepense': [
            'FONCTIONNEMENT',
            'INVESTISSEMENT',
            null
        ],
        'fournisseur.categorie': [
            'telecom',
            'energie',
            'services',
            'informatique',
            'fournitures',
            'eau',
            'carburant',
            'location',
            'assurance',
            'honoraires',
            'transport',
            'autre',
            null
        ]
    },
    
    validation: {
        montantTTC: 'montantTTC >= 0',
        montantHT: 'montantHT >= 0',
        tauxTVA: 'tauxTVA >= 0 && tauxTVA <= 100',
        numeroInterne: '/^FF-\\d{8}-\\d{4}$/',
        'comptabilite.fiabilite': 'fiabilite >= 0 && fiabilite <= 100'
    }
};

// ========================================
// EXPORT
// ========================================

export default {
    FACTURE_FOURNISSEUR_TEMPLATE,
    FACTURE_FOURNISSEUR_RULES
};