/* ========================================
   BUSINESS.CONSTANTS.JS - Constantes métier centralisées
   Chemin: src/constants/business.constants.js
   
   DESCRIPTION:
   Centralise toutes les valeurs "en dur" de l'application pour
   éviter les strings/nombres magiques, prévenir les bugs de typos,
   et faciliter la maintenance. Basé sur l'analyse des modules
   orchestrator, workflow, firestore, openai et upload services.
   
   STRUCTURE DU FICHIER:
   1. STATUTS WORKFLOW
   2. COLLECTIONS FIRESTORE
   3. TYPES DE DÉCOMPTES
   4. MUTUELLES ET RÉSEAUX
   5. CODES SOCIÉTÉ ET MAGASINS
   6. SEUILS ET SCORES
   7. LIMITES ET CONTRAINTES
   8. MESSAGES UTILISATEUR
   9. CONFIGURATION API
   10. FORMATS ET PATTERNS
   11. STORAGE KEYS
   12. EXPORT CENTRALISÉ
   
   UTILISATION:
   import { STATUTS, COLLECTIONS, SEUILS } from '/src/constants/business.constants.js';
   
   if (decompte.statut === STATUTS.NOUVEAU) { }
   collection(db, COLLECTIONS.DECOMPTES_MUTUELLES);
   if (score >= SEUILS.DOUBLON.PROBABLE) { }
   
   ÉVOLUTION:
   Ce fichier contient les constantes extraites des 5 fichiers fournis.
   À enrichir au fur et à mesure avec les constantes d'autres modules.
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale basée sur 5 modules
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. STATUTS WORKFLOW
// ========================================

/**
 * Statuts du workflow de traitement des décomptes
 * @enum {string}
 */
export const STATUTS = {
    // Statuts principaux
    NOUVEAU: 'nouveau',
    EN_COURS: 'en_cours',
    TRAITEMENT_IA: 'traitement_ia',
    VERIFIE: 'verifie',
    COMPLETE: 'complete',
    ERREUR: 'erreur',
    
    // Sous-statuts
    EN_ATTENTE: 'en_attente',
    VALIDATION_REQUISE: 'validation_requise',
    ARCHIVE: 'archive',
    ANNULE: 'annule'
};

/**
 * Statuts de virements
 * @enum {string}
 */
export const STATUTS_VIREMENT = {
    GENERE: 'genere',
    VALIDE: 'valide',
    ENVOYE: 'envoye',
    CONFIRME: 'confirme',
    ERREUR: 'erreur',
    ANNULE: 'annule'
};

/**
 * Transitions autorisées entre statuts
 * @type {Object<string, string[]>}
 */
export const TRANSITIONS_STATUTS = {
    [STATUTS.NOUVEAU]: [STATUTS.EN_COURS, STATUTS.TRAITEMENT_IA],
    [STATUTS.EN_COURS]: [STATUTS.TRAITEMENT_IA, STATUTS.VERIFIE, STATUTS.ERREUR],
    [STATUTS.TRAITEMENT_IA]: [STATUTS.VERIFIE, STATUTS.ERREUR],
    [STATUTS.VERIFIE]: [STATUTS.COMPLETE, STATUTS.VALIDATION_REQUISE],
    [STATUTS.VALIDATION_REQUISE]: [STATUTS.COMPLETE, STATUTS.ERREUR],
    [STATUTS.ERREUR]: [STATUTS.EN_COURS, STATUTS.ANNULE]
};

// ========================================
// 2. COLLECTIONS FIRESTORE
// ========================================

/**
 * Noms des collections Firestore
 * @enum {string}
 */
export const COLLECTIONS = {
    // Collections principales
    DECOMPTES_MUTUELLES: 'decomptesMutuelles',
    VIREMENTS: 'virements',
    LOGS: 'logs',
    MAGASINS: 'magasins',
    
    // Collections à ajouter selon vos besoins
    MUTUELLES: 'mutuelles',
    CLIENTS: 'clients',
    FACTURES: 'factures',
    UTILISATEURS: 'users',
    CONFIGURATIONS: 'configurations',
    ARCHIVES: 'archives'
};

/**
 * Sous-collections Firestore
 * @enum {string}
 */
export const SOUS_COLLECTIONS = {
    HISTORIQUE: 'historique',
    DOUBLONS: 'doublons',
    DOCUMENTS: 'documents',
    COMMENTAIRES: 'commentaires',
    VERSIONS: 'versions'
};

// ========================================
// 3. TYPES DE DÉCOMPTES
// ========================================

/**
 * Types de décomptes
 * @enum {string}
 */
export const TYPES_DECOMPTE = {
    INDIVIDUEL: 'individuel',
    GROUPE: 'groupe',
    ENTREPRISE: 'entreprise',
    FAMILLE: 'famille',
    COMPLEMENTAIRE: 'complementaire'
};

/**
 * Types de documents
 * @enum {string}
 */
export const TYPES_DOCUMENT = {
    DECOMPTE: 'decompte',
    FACTURE: 'facture',
    BORDEREAU: 'bordereau',
    RELEVE: 'releve',
    ATTESTATION: 'attestation',
    PRESCRIPTION: 'prescription'
};

// ========================================
// 4. MUTUELLES ET RÉSEAUX
// ========================================

/**
 * Mutuelles partenaires
 * Configuration complète avec codes et formats
 * @type {Object}
 */
export const MUTUELLES = {
    SANTECLAIR: {
        code: 'SANTECLAIR',
        nom: 'Santéclair',
        prefixe: 'SC',
        formatNumero: /^SC\d{10}$/,
        actif: true
    },
    VIAMEDIS: {
        code: 'VIAMEDIS',
        nom: 'Viamédis',
        prefixe: 'VM',
        formatNumero: /^VM\d{10}$/,
        actif: true
    },
    SWISS_LIFE: {
        code: 'SWISS_LIFE',
        nom: 'Swiss Life',
        prefixe: 'SL',
        formatNumero: /^SL\d{10}$/,
        actif: true
    },
    ALLIANZ: {
        code: 'ALLIANZ',
        nom: 'Allianz',
        prefixe: 'AZ',
        formatNumero: /^AZ\d{10}$/,
        actif: true
    },
    ALPTIS: {
        code: 'ALPTIS',
        nom: 'Alptis',
        prefixe: 'AP',
        formatNumero: /^AP\d{10}$/,
        actif: true
    },
    // Ajouter d'autres mutuelles selon besoins
};

/**
 * Liste simple des codes mutuelles pour validation
 * @type {string[]}
 */
export const CODES_MUTUELLES = Object.keys(MUTUELLES);

/**
 * Réseaux de soins
 * @enum {string}
 */
export const RESEAUX_SOINS = {
    ITELIS: 'ITELIS',
    CARTE_BLANCHE: 'CARTE_BLANCHE',
    KALIXIA: 'KALIXIA',
    SANTE_CLAIR: 'SANTE_CLAIR',
    DIRECT_MUTUELLE: 'DIRECT_MUTUELLE'
};

// ========================================
// 5. CODES SOCIÉTÉ ET MAGASINS
// ========================================

/**
 * Configuration des sociétés et leurs préfixes magasins
 * @type {Object}
 */
export const CODES_SOCIETE = {
    BA: {
        code: 'BA',
        nom: 'BA',
        prefixe: '9',
        prefixePattern: /^9/,
        magasins: ['9PAR', '9LYO', '9MAR', '9BOR', '9TOU', '9NAN', '9LIL']
    },
    ORIXIS: {
        code: 'ORIXIS',
        nom: 'Orixis',
        prefixe: '8',
        prefixePattern: /^8/,
        magasins: ['8PAR', '8LYO', '8MAR']
    },
    SEPHIRA: {
        code: 'SEPHIRA',
        nom: 'Sephira',
        prefixe: '7',
        prefixePattern: /^7/,
        magasins: ['7PAR', '7LYO']
    }
};

/**
 * Map rapide préfixe -> société
 * @type {Object<string, string>}
 */
export const PREFIXE_TO_SOCIETE = {
    '9': 'BA',
    '8': 'ORIXIS',
    '7': 'SEPHIRA'
};

/**
 * Codes régions pour les magasins
 * @enum {string}
 */
export const CODES_REGION = {
    PAR: 'Paris',
    LYO: 'Lyon',
    MAR: 'Marseille',
    BOR: 'Bordeaux',
    TOU: 'Toulouse',
    NAN: 'Nantes',
    LIL: 'Lille',
    STR: 'Strasbourg',
    REN: 'Rennes',
    NIC: 'Nice'
};

// ========================================
// 6. SEUILS ET SCORES
// ========================================

/**
 * Seuils de détection des doublons
 * @type {Object}
 */
export const SEUILS = {
    DOUBLON: {
        CERTAIN: 80,      // >= 80% = doublon certain
        PROBABLE: 60,     // >= 60% = doublon probable
        POSSIBLE: 40,     // >= 40% = doublon possible
        MIN: 40           // < 40% = pas un doublon
    },
    
    MONTANT: {
        MIN_VIREMENT: 0.01,      // Montant minimum pour un virement
        MAX_VIREMENT: 100000,    // Montant maximum pour un virement
        ALERTE_ELEVE: 5000,      // Montant déclenchant une alerte
        VALIDATION_REQUISE: 10000 // Montant nécessitant validation
    },
    
    CONFIANCE_IA: {
        TRES_HAUTE: 0.95,    // >= 95% de confiance
        HAUTE: 0.85,         // >= 85% de confiance
        MOYENNE: 0.70,       // >= 70% de confiance
        BASSE: 0.50,         // >= 50% de confiance
        TRES_BASSE: 0        // < 50% de confiance
    }
};

/**
 * Scores et poids pour les calculs
 * @type {Object}
 */
export const SCORES = {
    POIDS_NSS: 0.4,          // Poids du NSS dans le calcul de doublon
    POIDS_MONTANT: 0.3,      // Poids du montant
    POIDS_DATE: 0.2,         // Poids de la date
    POIDS_MUTUELLE: 0.1,     // Poids de la mutuelle
    
    BONUS_EXACT: 20,         // Bonus si correspondance exacte
    MALUS_DIFFERENT: -10     // Malus si très différent
};

// ========================================
// 7. LIMITES ET CONTRAINTES
// ========================================

/**
 * Limites de l'application
 * @type {Object}
 */
export const LIMITES = {
    FICHIER: {
        TAILLE_MAX: 10 * 1024 * 1024,        // 10 MB
        TAILLE_MAX_TOTAL: 50 * 1024 * 1024,  // 50 MB total
        NOMBRE_MAX: 100,                      // 100 fichiers max
        NOMBRE_MAX_BATCH: 10                  // 10 fichiers par batch
    },
    
    PAGINATION: {
        ITEMS_PAR_PAGE: 20,
        MAX_ITEMS_PAR_PAGE: 100,
        ITEMS_PAR_PAGE_MOBILE: 10
    },
    
    API: {
        TIMEOUT: 30000,                    // 30 secondes
        MAX_RETRIES: 3,                    // 3 essais max
        TOKENS_MAX: 4000,                  // Limite OpenAI
        RATE_LIMIT: 60                     // 60 requêtes/minute
    },
    
    CACHE: {
        TTL_DEFAULT: 5 * 60 * 1000,        // 5 minutes
        TTL_MAGASINS: 60 * 60 * 1000,      // 1 heure
        TTL_MUTUELLES: 24 * 60 * 60 * 1000 // 24 heures
    }
};

/**
 * Extensions de fichiers autorisées
 * @type {Object}
 */
export const EXTENSIONS_AUTORISEES = {
    IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENTS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    ARCHIVES: ['.zip', '.rar', '.7z'],
    TOUS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
};

/**
 * Types MIME autorisés
 * @type {string[]}
 */
export const MIME_TYPES_AUTORISES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// ========================================
// 8. MESSAGES UTILISATEUR
// ========================================

/**
 * Messages utilisateur standardisés
 * @type {Object}
 */
export const MESSAGES = {
    SUCCES: {
        DECOMPTE_TRAITE: 'Décompte traité avec succès',
        VIREMENT_GENERE: 'Virement généré avec succès',
        FICHIER_UPLOAD: 'Fichier téléchargé avec succès',
        DONNEES_SAUVEGARDEES: 'Données sauvegardées',
        OPERATION_TERMINEE: 'Opération terminée avec succès'
    },
    
    ERREUR: {
        DECOMPTE_INVALIDE: 'Décompte invalide ou incomplet',
        NSS_INVALIDE: 'Numéro de sécurité sociale invalide',
        MONTANT_INVALIDE: 'Montant invalide',
        FICHIER_TROP_GROS: 'Fichier trop volumineux (max 10 MB)',
        FICHIER_TYPE_INVALIDE: 'Type de fichier non autorisé',
        RESEAU_ERREUR: 'Erreur réseau, veuillez réessayer',
        PERMISSION_REFUSEE: 'Permission refusée',
        SESSION_EXPIREE: 'Session expirée, veuillez vous reconnecter',
        CHAMP_REQUIS: 'Ce champ est obligatoire',
        FORMAT_INVALIDE: 'Format invalide'
    },
    
    AVERTISSEMENT: {
        DOUBLON_DETECTE: 'Attention : doublon potentiel détecté',
        MONTANT_ELEVE: 'Montant élevé détecté, vérification requise',
        DONNEES_INCOMPLETES: 'Données incomplètes',
        VERSION_OBSOLETE: 'Une nouvelle version est disponible'
    },
    
    INFO: {
        TRAITEMENT_EN_COURS: 'Traitement en cours...',
        CHARGEMENT: 'Chargement...',
        VEUILLEZ_PATIENTER: 'Veuillez patienter',
        AUCUN_RESULTAT: 'Aucun résultat trouvé',
        AIDE_DISPONIBLE: 'Cliquez ici pour obtenir de l\'aide'
    },
    
    CONFIRMATION: {
        SUPPRIMER: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
        ANNULER: 'Êtes-vous sûr de vouloir annuler ?',
        VALIDER: 'Confirmer cette action ?',
        QUITTER: 'Des modifications non sauvegardées seront perdues. Continuer ?'
    }
};

// ========================================
// 9. CONFIGURATION API
// ========================================

/**
 * Configuration OpenAI
 * @type {Object}
 */
export const CONFIG_OPENAI = {
    MODEL: 'gpt-4-vision-preview',
    MODEL_FALLBACK: 'gpt-3.5-turbo',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.1,
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
    
    PROMPTS: {
        SYSTEM_ROLE: 'assistant',
        MAX_LENGTH: 2000
    }
};

/**
 * Endpoints API (si vous avez un backend)
 * @type {Object}
 */
export const API_ENDPOINTS = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY: '/auth/verify'
    },
    
    DECOMPTES: {
        LIST: '/api/decomptes',
        GET: '/api/decomptes/:id',
        CREATE: '/api/decomptes',
        UPDATE: '/api/decomptes/:id',
        DELETE: '/api/decomptes/:id'
    },
    
    VIREMENTS: {
        GENERATE: '/api/virements/generate',
        VALIDATE: '/api/virements/validate',
        EXPORT: '/api/virements/export'
    }
};

// ========================================
// 10. FORMATS ET PATTERNS
// ========================================

/**
 * Formats de dates
 * @type {Object}
 */
export const FORMATS_DATE = {
    DATE_FR: 'DD/MM/YYYY',
    DATE_US: 'YYYY-MM-DD',
    DATETIME_FR: 'DD/MM/YYYY HH:mm',
    DATETIME_ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    TIME: 'HH:mm',
    MONTH_YEAR: 'MM/YYYY'
};

/**
 * Patterns de validation (regex)
 * @type {Object}
 */
export const PATTERNS = {
    NSS: /^[12]\d{12}(\d{2})?$/,
    SIRET: /^\d{14}$/,
    SIREN: /^\d{9}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    TELEPHONE: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    CODE_POSTAL: /^\d{5}$/,
    IBAN_FR: /^FR\d{2}\s?\d{5}\s?\d{5}\s?\d{11}\s?\d{2}$/,
    MONTANT: /^\d+(?:\.\d{1,2})?$/,
    
    // Patterns métier
    NUMERO_DECOMPTE: /^DEC-\d{8}-\d{4}$/,
    NUMERO_VIREMENT: /^VIR-\d{4}-\d{2}-\d{3}$/,
    CODE_MAGASIN: /^[789][A-Z]{3}$/
};

/**
 * Formats d'affichage
 * @type {Object}
 */
export const FORMATS_AFFICHAGE = {
    MONTANT: {
        locale: 'fr-FR',
        options: { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    },
    
    POURCENTAGE: {
        locale: 'fr-FR',
        options: {
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    },
    
    NOMBRE: {
        locale: 'fr-FR',
        options: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    }
};

// ========================================
// 11. STORAGE KEYS
// ========================================

/**
 * Clés localStorage/sessionStorage
 * @type {Object}
 */
export const STORAGE_KEYS = {
    // Auth
    USER_TOKEN: 'userToken',
    USER_DATA: 'userData',
    REFRESH_TOKEN: 'refreshToken',
    
    // Preferences
    USER_PREFERENCES: 'userPreferences',
    THEME: 'theme',
    LANGUAGE: 'language',
    
    // Cache
    LAST_SYNC: 'lastSync',
    CACHED_MAGASINS: 'cachedMagasins',
    CACHED_MUTUELLES: 'cachedMutuelles',
    
    // Session
    CURRENT_TAB: 'currentTab',
    FILTERS: 'filters',
    SORT_ORDER: 'sortOrder',
    PAGE_SIZE: 'pageSize',
    
    // Formulaires
    DRAFT_DECOMPTE: 'draftDecompte',
    FORM_DATA: 'formData'
};

/**
 * Durées d'expiration pour le storage
 * @type {Object}
 */
export const STORAGE_EXPIRY = {
    TOKEN: 24 * 60 * 60 * 1000,      // 24 heures
    CACHE: 60 * 60 * 1000,            // 1 heure
    DRAFT: 7 * 24 * 60 * 60 * 1000,  // 7 jours
    PREFERENCES: null                  // Jamais
};

// ========================================
// 12. EXPORT CENTRALISÉ
// ========================================

/**
 * Export groupé par catégorie pour faciliter les imports
 */
export const WORKFLOW = {
    STATUTS,
    STATUTS_VIREMENT,
    TRANSITIONS_STATUTS
};

export const DATABASE = {
    COLLECTIONS,
    SOUS_COLLECTIONS
};

export const BUSINESS = {
    TYPES_DECOMPTE,
    TYPES_DOCUMENT,
    MUTUELLES,
    CODES_MUTUELLES,
    RESEAUX_SOINS,
    CODES_SOCIETE,
    PREFIXE_TO_SOCIETE,
    CODES_REGION
};

export const VALIDATION = {
    SEUILS,
    SCORES,
    LIMITES,
    EXTENSIONS_AUTORISEES,
    MIME_TYPES_AUTORISES,
    PATTERNS
};

export const UI = {
    MESSAGES,
    FORMATS_DATE,
    FORMATS_AFFICHAGE
};

export const CONFIG = {
    CONFIG_OPENAI,
    API_ENDPOINTS,
    STORAGE_KEYS,
    STORAGE_EXPIRY
};

/**
 * Export par défaut - tout accessible depuis un objet
 */
export default {
    // Workflow
    STATUTS,
    STATUTS_VIREMENT,
    TRANSITIONS_STATUTS,
    
    // Database
    COLLECTIONS,
    SOUS_COLLECTIONS,
    
    // Business
    TYPES_DECOMPTE,
    TYPES_DOCUMENT,
    MUTUELLES,
    CODES_MUTUELLES,
    RESEAUX_SOINS,
    CODES_SOCIETE,
    PREFIXE_TO_SOCIETE,
    CODES_REGION,
    
    // Validation
    SEUILS,
    SCORES,
    LIMITES,
    EXTENSIONS_AUTORISEES,
    MIME_TYPES_AUTORISES,
    PATTERNS,
    
    // UI
    MESSAGES,
    FORMATS_DATE,
    FORMATS_AFFICHAGE,
    
    // Config
    CONFIG_OPENAI,
    API_ENDPOINTS,
    STORAGE_KEYS,
    STORAGE_EXPIRY,
    
    // Exports groupés
    WORKFLOW,
    DATABASE,
    BUSINESS,
    VALIDATION,
    UI,
    CONFIG
};

/* ========================================
   GUIDE D'UTILISATION
   ========================================
   
   1. IMPORT SIMPLE:
   import { STATUTS, COLLECTIONS } from '@/constants/business.constants.js';
   
   2. IMPORT GROUPÉ:
   import { WORKFLOW, DATABASE } from '@/constants/business.constants.js';
   const statut = WORKFLOW.STATUTS.NOUVEAU;
   
   3. IMPORT COMPLET:
   import CONSTANTS from '@/constants/business.constants.js';
   const statut = CONSTANTS.STATUTS.NOUVEAU;
   
   4. AJOUT DE NOUVELLES CONSTANTES:
   - Ajouter dans la section appropriée
   - Documenter avec JSDoc
   - Exporter dans la section export
   - Mettre à jour ce guide si nécessaire
   
   5. CONVENTIONS:
   - MAJUSCULES pour les constantes
   - Underscore pour séparer les mots
   - Commentaires JSDoc pour la documentation
   - Grouper par catégorie logique
   
   ======================================== */

/* ========================================
   FIN DU FICHIER
   ======================================== */