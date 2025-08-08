// ========================================
// DECOMPTE-MUTUELLE.TEMPLATE.JS - Template Firestore pour décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.template.js
//
// DESCRIPTION:
// Définit la structure complète d'un document décompte dans Firestore
// Garantit que tous les champs existent avec les bons types
//
// UTILISATION:
// import { DECOMPTE_TEMPLATE } from './decompte-mutuelle.template.js';
// const nouveauDecompte = JSON.parse(JSON.stringify(DECOMPTE_TEMPLATE));
// ========================================

export const DECOMPTE_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    // Numéro unique du décompte
    numeroDecompte: null,           // String - Format: DEC-AAAAMMJJ-XXXX
    
    // Type de décompte
    typeDecompte: 'individuel',     // String - 'individuel' ou 'groupe'
    
    // ========================================
    // ORGANISATION
    // ========================================
    
    // Société destinataire (professionnel de santé)
    societe: 'ORIXIS SAS',          // String - Nom complet de la société
    
    // Magasin où l'achat a été fait
    codeMagasin: null,              // String - Code magasin (ex: '9PAR')
    
    // Magasin qui a uploadé le document
    magasinUploadeur: null,         // String - Code magasin uploadeur
    
    // Prestataire tiers-payant
    prestataireTP: null,            // String ou null - Réseau de soins (SANTECLAIR, etc.)
    
    // ========================================
    // CLIENT
    // ========================================
    
    // Informations du client (structure complète même si vide)
    client: {
        id: null,                   // String ou null - ID client si existant
        nom: null,                  // String ou null - Nom de famille
        prenom: null,               // String ou null - Prénom
        numeroSecuriteSociale: null // String ou null - NSS (13 ou 15 chiffres)
    },
    
    // ========================================
    // DONNÉES FINANCIÈRES
    // ========================================
    
    // Organisme mutuelle payeur
    mutuelle: null,                 // String ou null - Nom de la mutuelle
    
    // Montant remboursé au client
    montantRemboursementClient: 0,  // number - Montant en euros
    
    // Montant total du virement
    montantVirement: 0,             // number - Montant total en euros
    
    // Nombre de clients dans le décompte
    nombreClients: 1,               // number - 1 pour individuel, >1 pour groupe
    
    // Date du virement bancaire
    dateVirement: null,             // Timestamp ou null - Date du virement effectué
    
    // ========================================
    // DATES DE WORKFLOW
    // ========================================
    
    dates: {
        // Date de création du décompte
        creation: null,             // Timestamp - Toujours rempli
        
        // Date de transmission à l'IA
        transmissionIA: null,       // Timestamp ou null
        
        // Date de fin de traitement
        traitementEffectue: null,   // Timestamp ou null
        
        // Date de passage en manuel
        traitementManuel: null,     // Timestamp ou null
        
        // Date de rapprochement bancaire
        rapprochementBancaire: null // Timestamp ou null
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    
    intervenants: {
        // Créateur du décompte
        creePar: {
            id: null,               // String - ID utilisateur
            nom: null,              // String - Nom
            prenom: null,           // String - Prénom
            role: null              // String - Rôle (technicien, admin, etc.)
        },
        
        // Personne qui a traité
        traitePar: null,            // Object ou null - Même structure que creePar
        
        // Personne qui a rapproché
        rapprochePar: null          // Object ou null - Même structure que creePar
    },
    
    // ========================================
    // DOCUMENTS
    // ========================================
    
    // Documents uploadés (PDF, images)
    documents: [],                  // Array<Object> - Liste des documents
    /* Structure d'un document:
    {
        nom: 'DM_ORIXIS_20250208_143029_550e8400.pdf',
        nomOriginal: 'decompte-janvier.pdf',
        chemin: 'decomptes-mutuelles/ORIXIS/inbox/2025/02/08/...',
        url: 'https://storage.googleapis.com/...',
        taille: 245687,
        type: 'application/pdf',
        hash: 'a3f5b8c9d1e2...',
        dateUpload: Timestamp
    }
    */
    
    // ========================================
    // RÉFÉRENCES
    // ========================================
    
    // ID du virement bancaire
    virementId: null,               // String ou null - Format: VIR-AAAA-MM-XXX
    
    // ========================================
    // WORKFLOW
    // ========================================
    
    // Statut actuel du décompte
    statut: 'nouveau',              // String - nouveau|traitement_ia|traitement_effectue|traitement_manuel|rapprochement_bancaire|supprime
    
    // Motif si traitement manuel
    motifTraitementManuel: null,    // String ou null - Raison du passage en manuel
    
    // ========================================
    // HISTORIQUE
    // ========================================
    
    // Historique complet des actions
    historique: []                  // Array<Object> - Liste des actions
    /* Structure d'une entrée historique:
    {
        date: Timestamp,            // Date de l'action
        action: 'creation',         // Type d'action
        details: 'Description',     // Détails de l'action
        timestamp: 1234567890,      // Timestamp en millisecondes
        utilisateur: {              // Utilisateur qui a fait l'action
            id: 'user-123',
            nom: 'DUPONT',
            prenom: 'Jean',
            role: 'technicien'
        }
    }
    */
};

// ========================================
// TEMPLATE D'UNE ENTRÉE HISTORIQUE
// ========================================

export const HISTORIQUE_ENTRY_TEMPLATE = {
    date: null,                     // Timestamp
    action: null,                   // String - Type d'action
    details: null,                  // String - Description
    timestamp: null,                // number - Millisecondes depuis epoch
    utilisateur: {                  // Object - Utilisateur
        id: null,                   // String
        nom: null,                  // String
        prenom: null,               // String
        role: null                  // String
    }
};

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const DECOMPTE_RULES = {
    // Champs obligatoires
    required: [
        'numeroDecompte',
        'societe',
        'codeMagasin',
        'statut',
        'typeDecompte'
    ],
    
    // Valeurs énumérées
    enum: {
        typeDecompte: ['individuel', 'groupe'],
        statut: [
            'nouveau',
            'traitement_ia',
            'traitement_effectue',
            'traitement_manuel',
            'rapprochement_bancaire',
            'supprime'
        ]
    },
    
    // Validations spécifiques
    validations: {
        numeroDecompte: /^DEC-\d{8}-\d{4}$/,
        numeroSecuriteSociale: /^[12]\d{12}(\d{2})?$/,
        virementId: /^VIR-\d{4}-\d{2}-\d{3}$/
    },
    
    // Limites
    limits: {
        maxDocuments: 10,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxHistoriqueEntries: 100
    }
};

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer un nouveau décompte avec les valeurs par défaut
 * @returns {Object} Nouveau décompte basé sur le template
 */
export function createNewDecompte() {
    return JSON.parse(JSON.stringify(DECOMPTE_TEMPLATE));
}

/**
 * Créer une nouvelle entrée historique
 * @param {string} action - Type d'action
 * @param {string} details - Détails de l'action
 * @param {Object} utilisateur - Utilisateur qui fait l'action
 * @returns {Object} Nouvelle entrée historique
 */
export function createHistoriqueEntry(action, details, utilisateur) {
    return {
        date: new Date(),
        action: action,
        details: details,
        timestamp: Date.now(),
        utilisateur: utilisateur || {
            id: 'unknown',
            nom: 'Système',
            prenom: '',
            role: 'system'
        }
    };
}

/**
 * Valider qu'un objet respecte le template
 * @param {Object} decompte - Décompte à valider
 * @returns {Object} Résultat de validation { valid: boolean, errors: [] }
 */
export function validateDecompte(decompte) {
    const errors = [];
    
    // Vérifier les champs obligatoires
    DECOMPTE_RULES.required.forEach(field => {
        if (!decompte[field]) {
            errors.push(`Champ obligatoire manquant: ${field}`);
        }
    });
    
    // Vérifier les énumérations
    Object.entries(DECOMPTE_RULES.enum).forEach(([field, values]) => {
        if (decompte[field] && !values.includes(decompte[field])) {
            errors.push(`Valeur invalide pour ${field}: ${decompte[field]}`);
        }
    });
    
    // Vérifier les formats avec regex
    Object.entries(DECOMPTE_RULES.validations).forEach(([field, regex]) => {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key], decompte)
            : decompte[field];
            
        if (value && !regex.test(value)) {
            errors.push(`Format invalide pour ${field}: ${value}`);
        }
    });
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    DECOMPTE_TEMPLATE,
    HISTORIQUE_ENTRY_TEMPLATE,
    DECOMPTE_RULES,
    createNewDecompte,
    createHistoriqueEntry,
    validateDecompte
};