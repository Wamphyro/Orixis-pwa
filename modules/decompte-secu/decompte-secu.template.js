// ========================================
// DECOMPTE-SECU.TEMPLATE.JS - 📋 TEMPLATE FIRESTORE
// Chemin: modules/decompte-secu/decompte-secu.template.js
//
// DESCRIPTION:
// Template Firestore pour décomptes sécurité sociale audioprothèse
// Structure adaptée pour les virements CPAM avec multiples bénéficiaires
// Garantit la cohérence des données dans Firestore
//
// VERSION: 1.0.0
// DATE: 08/01/2025
// ========================================

// ========================================
// TEMPLATE PRINCIPAL - DÉCOMPTE SÉCU AUDIO
// ========================================

export const DECOMPTE_SECU_TEMPLATE = {
    // ========== IDENTIFICATION ==========
    numeroDecompte: null,           // String - Format: SECU-YYYYMMDD-XXXX
    typeDecompte: 'virement',       // String - Toujours 'virement' pour sécu
    
    // ========== VIREMENT (élément principal) ==========
    montantVirement: 0,             // number - Montant total du virement
    dateVirement: null,             // Timestamp - Date du virement sur le décompte
    numeroVirement: null,           // String - Référence du virement
    
    // ========== BÉNÉFICIAIRES ==========
    beneficiaires: [],              // Array<Beneficiaire> - Liste des patients
    nombreBeneficiaires: 0,         // number - Nombre de patients dans le virement
    
    // ========== ORGANISATION ==========
    societe: null,                   // String - Société détectée via FINESS → magasin
    codeMagasin: null,              // String - Code magasin détecté via FINESS
    magasinUploadeur: null,         // String - Magasin de l'utilisateur qui upload
    
    // ========== CAISSE ==========
    caissePrimaire: null,           // String - Ex: "CAMIEG", "CPAM PARIS"
    regime: 'general',              // String - general|rsi|msa|special
    
    // ========== RAPPROCHEMENT BANCAIRE ==========
    rapprochement: {
        effectue: false,            // boolean - Virement rapproché ?
        dateRapprochement: null,    // Timestamp - Date du rapprochement
        libelleCompteBancaire: null, // String - Libellé sur le relevé bancaire
        dateCompteBancaire: null,   // Timestamp - Date réelle du virement bancaire
        montantBancaire: null       // number - Montant vu sur le compte (peut différer)
    },
    
    // ========== DOCUMENTS ==========
    documents: [],                  // Array<Document> - Documents uploadés
    
    // ========== DATES SYSTÈME ==========
    dates: {
        creation: null,             // Timestamp - Date de création
        transmissionIA: null,       // Timestamp - Date d'analyse IA
        traitementEffectue: null,   // Timestamp - Date de validation
        rapprochementBancaire: null // Timestamp - Date de rapprochement
    },
    
    // ========== WORKFLOW ==========
    statut: 'nouveau',              // String - nouveau|traitement_ia|traitement_effectue|rapprochement_bancaire|supprime
    
    // ========== INTERVENANTS ==========
    intervenants: {
        creePar: {
            id: null,               // String - ID utilisateur
            nom: null,              // String
            prenom: null,           // String
            role: null              // String - technicien|admin
        },
        traitePar: null,            // Object ou null - Qui a traité
        rapprochePar: null          // Object ou null - Qui a rapproché
    },
    
    // ========== SUPPRESSION ==========
    suppression: null,              // Object ou null - {date, par, motif}
    
    // ========== HISTORIQUE ==========
    historique: [],                 // Array<HistoriqueEntry> - Traçabilité complète
    
    // ========== MÉTADONNÉES IA ==========
    extractionIA: null,             // Object ou null - Résultats de l'analyse IA
    
    // ========== HASH POUR DOUBLONS ==========
    documentHashes: []              // Array<String> - Hash SHA-256 des documents
};

// ========================================
// TEMPLATE BÉNÉFICIAIRE
// ========================================

export const BENEFICIAIRE_TEMPLATE = {
    nom: null,                      // String - Nom du patient
    prenom: null,                   // String - Prénom du patient
    numeroSecuriteSociale: null,    // String - NSS (13 ou 15 chiffres)
    
    // Montants
    montantRemboursement: 0,        // number - Montant total pour ce patient
    
    // Appareils auditifs
    appareils: [],                  // Array<Appareil> - Liste des appareils
    
    // Informations complémentaires
    dateNaissance: null,            // String ou null - Si disponible
    numeroAffiliation: null         // String ou null - Si différent du NSS
};

// ========================================
// TEMPLATE APPAREIL AUDITIF
// ========================================

export const APPAREIL_TEMPLATE = {
    oreille: null,                  // String - 'droite' ou 'gauche'
    codeActe: null,                 // String - Code CCAM (ex: CDQP010)
    libelle: null,                  // String - Description de l'acte
    montant: 0,                     // number - Montant remboursé pour cet appareil
    dateActe: null,                 // Timestamp - Date de l'appareillage
    
    // Informations techniques (si disponibles)
    marque: null,                   // String ou null
    modele: null,                   // String ou null
    numeroSerie: null               // String ou null
};

// ========================================
// TEMPLATE DOCUMENT
// ========================================

export const DOCUMENT_TEMPLATE = {
    nom: null,                      // String - Nom du fichier dans Storage
    nomOriginal: null,              // String - Nom original du fichier
    chemin: null,                   // String - Chemin complet dans Storage
    url: null,                      // String - URL de téléchargement
    taille: 0,                      // number - Taille en octets
    type: null,                     // String - Type MIME
    hash: null,                     // String - Hash SHA-256
    dateUpload: null,               // Timestamp
    
    // Métadonnées
    format: null,                   // String - 'pdf', 'csv', 'image'
    nombrePages: null               // number ou null - Pour les PDF
};

// ========================================
// TEMPLATE HISTORIQUE
// ========================================

export const HISTORIQUE_ENTRY_TEMPLATE = {
    date: null,                     // Timestamp
    action: null,                   // String - Type d'action
    details: null,                  // String - Description
    timestamp: null,                // number - Timestamp en millisecondes
    utilisateur: {
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        role: null                  // String
    },
    donnees: null                   // Object ou null - Données additionnelles
};

// ========================================
// TEMPLATE EXTRACTION IA
// ========================================

export const EXTRACTION_IA_TEMPLATE = {
    timestamp: null,                // Timestamp - Date de l'analyse
    modele: 'gpt-4o-mini',         // String - Modèle utilisé
    
    // Données extraites
    montantVirement: 0,             // number
    dateVirement: null,             // String - Format YYYY-MM-DD
    numeroVirement: null,           // String
    caissePrimaire: null,           // String
    
    // Bénéficiaires extraits
    beneficiaires: [],              // Array - Données brutes extraites
    
    // Détection magasin
    finessDetecte: null,            // String - FINESS trouvé
    codeMagasinDetecte: null,       // String - Code magasin correspondant
    societeDetectee: null,          // String - Société correspondante
    
    // Statistiques
    tempsAnalyse: 0,                // number - Durée en ms
    confiance: 0,                   // number - Score de confiance 0-100
    
    // Format source
    formatSource: null              // String - 'pdf', 'csv', 'image'
};

// ========================================
// CONSTANTES MÉTIER
// ========================================

export const CONSTANTES_SECU_AUDIO = {
    // Codes CCAM audioprothèse
    CODES_CCAM: {
        CDQP010: 'Appareillage stéréophonique de surdité par prothèse auditive',
        CDQP011: 'Appareillage monophonique de surdité par prothèse auditive',
        CDQP012: 'Réglage de prothèse auditive',
        CDQP013: 'Contrôle de prothèse auditive'
    },
    
    // Montants de remboursement standards
    MONTANTS_STANDARDS: {
        appareil_standard: 199.71,   // Montant de base par appareil
        appareil_classe1: 240.00,    // Classe 1 (100% Santé)
        appareil_classe2: 199.71     // Classe 2
    },
    
    // Taux de remboursement
    TAUX: {
        adulte: 60,                  // 60% du tarif de base
        enfant: 60,                  // 60% aussi mais base différente
        ald: 100,                    // 100% si ALD
        cmu: 100                     // 100% si CMU
    },
    
    // Oreilles
    OREILLES: ['droite', 'gauche'],
    
    // Régimes
    REGIMES: ['general', 'rsi', 'msa', 'special'],
    
    // Statuts workflow
    STATUTS: [
        'nouveau',
        'traitement_ia',
        'traitement_effectue',
        'rapprochement_bancaire',
        'supprime'
    ]
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Créer un nouveau décompte avec les valeurs par défaut
 */
export function creerNouveauDecompte() {
    return JSON.parse(JSON.stringify(DECOMPTE_SECU_TEMPLATE));
}

/**
 * Créer un nouveau bénéficiaire
 */
export function creerNouveauBeneficiaire() {
    return JSON.parse(JSON.stringify(BENEFICIAIRE_TEMPLATE));
}

/**
 * Créer un nouvel appareil
 */
export function creerNouvelAppareil(oreille = null) {
    const appareil = JSON.parse(JSON.stringify(APPAREIL_TEMPLATE));
    if (oreille) appareil.oreille = oreille;
    return appareil;
}

/**
 * Créer une nouvelle entrée historique
 */
export function creerEntreeHistorique(action, details, utilisateur) {
    return {
        ...HISTORIQUE_ENTRY_TEMPLATE,
        date: new Date(),
        action: action,
        details: details,
        timestamp: Date.now(),
        utilisateur: utilisateur || {
            id: 'system',
            nom: 'SYSTEM',
            prenom: '',
            role: 'system'
        }
    };
}

/**
 * Valider la structure d'un décompte
 */
export function validerDecompte(decompte) {
    const erreurs = [];
    
    // Vérifications obligatoires
    if (!decompte.numeroDecompte) {
        erreurs.push('Numéro de décompte manquant');
    }
    
    if (typeof decompte.montantVirement !== 'number' || decompte.montantVirement < 0) {
        erreurs.push('Montant virement invalide');
    }
    
    if (!decompte.dateVirement) {
        erreurs.push('Date virement manquante');
    }
    
    if (!Array.isArray(decompte.beneficiaires)) {
        erreurs.push('Liste bénéficiaires invalide');
    }
    
    // Vérifier chaque bénéficiaire
    decompte.beneficiaires.forEach((b, index) => {
        if (!b.nom && !b.prenom) {
            erreurs.push(`Bénéficiaire ${index + 1}: nom et prénom manquants`);
        }
        
        if (typeof b.montantRemboursement !== 'number' || b.montantRemboursement < 0) {
            erreurs.push(`Bénéficiaire ${index + 1}: montant invalide`);
        }
    });
    
    // Vérifier la cohérence des montants
    const totalBeneficiaires = decompte.beneficiaires.reduce(
        (sum, b) => sum + (b.montantRemboursement || 0), 
        0
    );
    
    if (Math.abs(totalBeneficiaires - decompte.montantVirement) > 0.01) {
        erreurs.push(`Incohérence montants: virement=${decompte.montantVirement}, total bénéficiaires=${totalBeneficiaires}`);
    }
    
    return {
        valide: erreurs.length === 0,
        erreurs: erreurs
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    DECOMPTE_SECU_TEMPLATE,
    BENEFICIAIRE_TEMPLATE,
    APPAREIL_TEMPLATE,
    DOCUMENT_TEMPLATE,
    HISTORIQUE_ENTRY_TEMPLATE,
    EXTRACTION_IA_TEMPLATE,
    CONSTANTES_SECU_AUDIO,
    
    // Fonctions
    creerNouveauDecompte,
    creerNouveauBeneficiaire,
    creerNouvelAppareil,
    creerEntreeHistorique,
    validerDecompte
};

/* ========================================
   HISTORIQUE
   
   [08/01/2025] - v1.0.0
   - Création template adapté audioprothèse
   - Structure virement avec multiples bénéficiaires
   - Gestion des appareils par oreille
   - Rapprochement bancaire intégré
   ======================================== */