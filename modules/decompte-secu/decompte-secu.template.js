// ========================================
// DECOMPTE-SECU.TEMPLATE.JS - Template Firestore
// Chemin: modules/decompte-secu/decompte-secu.template.js
//
// DESCRIPTION:
// Structure complète d'un décompte CPAM audioprothèse
// Support multi-virements avec rapprochement individuel
//
// VERSION: 3.0.0 - RAPPROCHEMENT PAR VIREMENT
// DATE: 08/01/2025
// ========================================

export const DECOMPTE_SECU_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    numeroDecompte: null,              // String - Format: SECU-AAAAMMJJ-XXXX
    typeDecompte: 'multi-virements',   // String - 'unique' ou 'multi-virements'
    
    // ========================================
    // ORGANISATION
    // ========================================
    
    societe: null,                     // String - Société détectée via FINESS
    codeMagasin: null,                 // String - Code magasin (ex: '9CHE')
    numeroFINESS: null,                // String - FINESS du professionnel (9 chiffres)
    
    // ========================================
    // CAISSE ET PÉRIODE
    // ========================================
    
    caissePrimaire: null,              // String - Ex: "CAMIEG", "CPAM PARIS"
    periodeTraitement: null,           // String - Format: YYYY-MM
    numeroDecompteOriginal: null,      // String - Numéro sur le document si présent
    
    // ========================================
    // VIREMENTS AVEC RAPPROCHEMENT INDIVIDUEL
    // ========================================
    
    virements: [],                     // Array<Object> - Liste des virements
    /* Structure d'un virement avec rapprochement:
    {
        id: 'vir-001',                // String - ID unique du virement
        dateVirement: Date,           // Date - Date du virement
        numeroVirement: 'REF123',     // String - Référence bancaire
        montantVirement: 1500.00,     // Number - Montant en euros
        nombreBeneficiaires: 2,       // Number - Nombre de patients
        
        // ⚡ RAPPROCHEMENT INDIVIDUEL
        rapprochement: {
            statut: 'en_attente',    // 'en_attente' | 'rapproche' | 'ecart'
            dateRapprochement: null,  // Date - Quand rapproché
            montantBancaire: null,    // Number - Montant sur relevé bancaire
            ecart: null,              // Number - Différence (bancaire - virement)
            rapprochePar: null,       // String - "Prénom NOM" de l'utilisateur
            commentaire: null         // String - Note si écart ou précision
        },
        
        beneficiaires: [              // Array - Liste des bénéficiaires
            {
                nom: 'DUPONT',
                prenom: 'Jean',
                numeroSecuriteSociale: '1850578006048',
                dateNaissance: Date,
                montantRemboursement: 480.00,
                nombreAppareils: 2,
                appareils: [
                    {
                        oreille: 'droite',
                        dateFacture: Date,
                        numeroFacture: 'FAC-001',
                        codeActe: 'P1D',
                        montantBase: 950.00,
                        montantRembourse: 240.00
                    },
                    {
                        oreille: 'gauche',
                        dateFacture: Date,
                        numeroFacture: 'FAC-002',
                        codeActe: 'P1G',
                        montantBase: 950.00,
                        montantRembourse: 240.00
                    }
                ]
            }
        ]
    }
    */
    
    // ========================================
    // TOTAUX GLOBAUX
    // ========================================
    
    totaux: {
        nombreTotalVirements: 0,       // Number - Nombre de virements
        montantTotalVirements: 0,      // Number - Somme de tous les virements
        nombreTotalBeneficiaires: 0,   // Number - Total patients uniques
        nombreTotalAppareils: 0,       // Number - Total appareils
        
        // Rapprochement global
        nombreVirementsRapproches: 0, // Number - Combien sont rapprochés
        montantTotalRapproche: 0,     // Number - Total des montants rapprochés
        ecartTotal: 0,                // Number - Somme des écarts
        
        // Détails par type
        montantParCaisse: {},          // Object - Montants par caisse si multiple
        montantParMois: {}             // Object - Montants par mois
    },
    
    // ========================================
    // DATES DE WORKFLOW
    // ========================================
    
    dates: {
        creation: null,                // Timestamp - Date de création
        transmissionIA: null,          // Timestamp - Envoi à l'IA
        traitementEffectue: null,      // Timestamp - Traitement terminé
        rapprochementComplet: null,    // Timestamp - TOUS les virements rapprochés
        derniereModification: null     // Timestamp - Dernière modif
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    
    intervenants: {
        creePar: {
            id: null,                  // String - ID utilisateur
            nom: null,                 // String - Nom
            prenom: null,              // String - Prénom
            role: null                 // String - Rôle
        },
        traitePar: null,               // Object ou null - Même structure
        derniereModificationPar: null  // Object ou null - Dernier à modifier
    },
    
    // ========================================
    // DOCUMENTS
    // ========================================
    
    documents: [],                     // Array<Object> - Documents uploadés
    documentHashes: [],                // Array<String> - Hashes pour détection doublons
    /* Structure d'un document:
    {
        nom: 'DS_1754679116964_n0s6gx.csv',
        nomOriginal: '2024-12-09 - CAMIEG.csv',
        chemin: 'decomptes-secu/ORIXIS/inbox/2025/01/08/...',
        url: 'https://storage.googleapis.com/...',
        taille: 3952,
        type: 'text/csv',
        hash: 'd55d52f3...',
        dateUpload: Date
    }
    */
    
    // ========================================
    // WORKFLOW
    // ========================================
    
    statut: 'nouveau',                // String - Statut global
    // Valeurs possibles:
    // - nouveau : Créé mais pas analysé
    // - traitement_ia : En cours d'analyse IA
    // - traitement_effectue : Analysé, en attente rapprochement
    // - rapprochement_partiel : Certains virements rapprochés
    // - rapprochement_complet : TOUS les virements rapprochés
    // - supprime : Soft delete
    
    // ========================================
    // EXTRACTION IA
    // ========================================
    
    extractionIA: {
        timestamp: null,               // Timestamp - Date d'extraction
        modele: 'gpt-4o-mini',        // String - Modèle utilisé
        version: '3.0',               // String - Version du prompt
        success: false,               // Boolean - Succès de l'extraction
        
        // Données brutes de l'IA (pour debug)
        donneesBrutes: null,          // Object - Réponse complète de l'IA
        
        // Statistiques d'extraction
        stats: {
            virementsDetectes: 0,
            beneficiairesDetectes: 0,
            appareilsDetectes: 0,
            montantTotalDetecte: 0
        },
        
        // Erreurs éventuelles
        erreurs: []                   // Array<String> - Erreurs d'extraction
    },
    
    // ========================================
    // HISTORIQUE
    // ========================================
    
    historique: []                    // Array<Object> - Actions effectuées
    /* Structure d'une entrée:
    {
        date: Date,
        action: 'creation' | 'extraction_ia' | 'rapprochement_virement' | 'modification' | 'suppression',
        details: 'Description de l'action',
        timestamp: 1234567890,
        virementId: 'vir-001',      // Si l'action concerne un virement spécifique
        utilisateur: {
            id: 'user-123',
            nom: 'DUPONT',
            prenom: 'Jean',
            role: 'technicien'
        }
    }
    */
};

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer un nouveau décompte vide
 */
export function createNewDecompteSecu() {
    return JSON.parse(JSON.stringify(DECOMPTE_SECU_TEMPLATE));
}

/**
 * Créer une entrée historique
 */
export function createHistoriqueEntry(action, details, utilisateur, virementId = null) {
    return {
        date: new Date(),
        action: action,
        details: details,
        timestamp: Date.now(),
        virementId: virementId,
        utilisateur: utilisateur || {
            id: 'system',
            nom: 'SYSTEM',
            prenom: '',
            role: 'system'
        }
    };
}

/**
 * Créer un virement vide avec structure de rapprochement
 */
export function createVirement() {
    return {
        id: `vir-${Date.now()}`,
        dateVirement: null,
        numeroVirement: null,
        montantVirement: 0,
        nombreBeneficiaires: 0,
        
        // Structure de rapprochement par défaut
        rapprochement: {
            statut: 'en_attente',
            dateRapprochement: null,
            montantBancaire: null,
            ecart: null,
            rapprochePar: null,
            commentaire: null
        },
        
        beneficiaires: []
    };
}

/**
 * Créer un bénéficiaire vide
 */
export function createBeneficiaire() {
    return {
        nom: null,
        prenom: null,
        numeroSecuriteSociale: null,
        dateNaissance: null,
        montantRemboursement: 0,
        nombreAppareils: 0,
        appareils: []
    };
}

/**
 * Créer un appareil vide
 */
export function createAppareil() {
    return {
        oreille: null,
        dateFacture: null,
        numeroFacture: null,
        codeActe: null,
        montantBase: 0,
        montantRembourse: 0
    };
}

/**
 * Créer une structure de rapprochement vide
 */
export function createRapprochement() {
    return {
        statut: 'en_attente',
        dateRapprochement: null,
        montantBancaire: null,
        ecart: null,
        rapprochePar: null,
        commentaire: null
    };
}

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const DECOMPTE_SECU_RULES = {
    // Champs obligatoires
    required: [
        'numeroDecompte',
        'statut',
        'typeDecompte'
    ],
    
    // Valeurs énumérées
    enum: {
        typeDecompte: ['unique', 'multi-virements'],
        statut: [
            'nouveau',
            'traitement_ia',
            'traitement_effectue',
            'rapprochement_partiel',
            'rapprochement_complet',
            'supprime'
        ],
        statutRapprochement: [
            'en_attente',
            'rapproche',
            'ecart'
        ],
        oreille: ['droite', 'gauche', 'bilateral']
    },
    
    // Validations regex
    validations: {
        numeroDecompte: /^SECU-\d{8}-\d{4}$/,
        numeroSecuriteSociale: /^[12]\d{12}(\d{2})?$/,
        numeroFINESS: /^\d{9}$/,
        codeMagasin: /^[89][A-Z]{3}$/
    },
    
    // Limites
    limits: {
        maxVirements: 50,
        maxBeneficiairesParVirement: 100,
        maxAppareilsParBeneficiaire: 2,
        maxDocuments: 10,
        maxFileSize: 10 * 1024 * 1024,  // 10MB
        ecartMaxAcceptable: 1.00        // Écart max en euros sans commentaire
    }
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    DECOMPTE_SECU_TEMPLATE,
    DECOMPTE_SECU_RULES,
    createNewDecompteSecu,
    createHistoriqueEntry,
    createVirement,
    createBeneficiaire,
    createAppareil,
    createRapprochement
};