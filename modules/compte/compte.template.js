// ========================================
// COMPTE.TEMPLATE.JS - 📋 STRUCTURE DE DONNÉES NORMALISÉE
// Chemin: modules/compte/compte.template.js
//
// DESCRIPTION:
// Templates de données pour le module compte utilisateur
// Définit la structure complète des objets utilisés
// Fournit des helpers de création et validation
//
// CONTENU:
// - Template Utilisateur Compte
// - Template Groupe
// - Template Magasin
// - Helpers de création
// - Règles de validation
//
// VERSION: 2.0.0
// DATE: 09/01/2025
// ========================================

// ========================================
// TEMPLATE UTILISATEUR COMPTE
// Structure complète d'un utilisateur
// ========================================

export const USER_ACCOUNT_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    id: null,                          // String - ID Firestore unique
    nom: null,                         // String - Nom de famille
    prenom: null,                      // String - Prénom
    codeHash: null,                    // String - Hash SHA-256 du code PIN (4 chiffres)
    
    // ========================================
    // ORGANISATION
    // ========================================
    
    groupes: [],                       // Array<String> - IDs des groupes assignés
    magasinPrincipal: null,           // String - Code du magasin principal (ex: '9CHE')
    
    autorisations: {},                 // Object<codeMagasin, autorisation>
    /* Structure d'une autorisation magasin:
    {
        acces: true,                  // Boolean - Accès autorisé au magasin
        responsable: false,           // Boolean - Est responsable du magasin
        permissions: []               // Array<String> - Permissions spéciales pour ce magasin
    }
    
    Exemple:
    autorisations: {
        '9CHE': {
            acces: true,
            responsable: true,
            permissions: ['gestion_stock', 'validation_commandes']
        },
        '8MON': {
            acces: true,
            responsable: false,
            permissions: []
        }
    }
    */
    
    // ========================================
    // PERMISSIONS DIRECTES
    // Permissions attribuées directement à l'utilisateur
    // (override les permissions des groupes)
    // ========================================
    
    permissionsDirectes: {
        pages: {},                     // Object<page, permissions>
        /* Structure permissions page:
        {
            view: true,                // Boolean - Peut voir la page
            create: false,             // Boolean - Peut créer
            edit: false,               // Boolean - Peut modifier
            delete: false,             // Boolean - Peut supprimer
            export: false              // Boolean - Peut exporter
        }
        */
        
        fonctionnalites: {}           // Object<fonctionnalite, Boolean>
        /* Exemples de fonctionnalités:
        {
            voir_tous_utilisateurs: false,
            creer_utilisateurs: false,
            modifier_utilisateurs: false,
            supprimer_utilisateurs: false,
            modifier_tous_codes_pin: false,
            acces_tous_magasins: false,
            gerer_parametres_magasins: false,
            voir_statistiques_globales: false,
            voir_statistiques_magasin: true,
            exporter_donnees_globales: false,
            gerer_parametres_systeme: false
        }
        */
    },
    
    // ========================================
    // PERMISSIONS CALCULÉES (Runtime)
    // Calculées par l'orchestrateur
    // Fusion: Groupes + Direct + Magasin
    // ========================================
    
    permissionsEffectives: {
        pages: {},                     // Permissions finales pour les pages
        fonctionnalites: {},          // Permissions finales pour les fonctionnalités
        delegation: {                  // Permissions du magasin actuel
            responsable: false,        // Boolean - Est responsable du magasin actuel
            permissions: []            // Array<String> - Permissions spéciales magasin
        }
    },
    
    // ========================================
    // PRÉFÉRENCES UTILISATEUR
    // ========================================
    
    preferences: {
        theme: 'auto',                // 'light' | 'dark' | 'auto'
        langue: 'fr',                 // Code langue ISO (fr, en, es...)
        
        notifications: {
            email: true,               // Boolean - Notifications par email
            push: true,                // Boolean - Notifications push
            sms: false                 // Boolean - Notifications SMS
        },
        
        affichage: {
            itemsParPage: 20,          // Number - Éléments par page dans les tableaux
            triParDefaut: 'date_desc', // String - Tri par défaut
            afficherAide: true         // Boolean - Afficher les bulles d'aide
        }
    },
    
    // ========================================
    // HISTORIQUE
    // ========================================
    
    historique: [],                   // Array<Object> - Actions effectuées
    /* Structure d'une entrée historique:
    {
        date: Date,                   // Date de l'action
        action: String,               // Type d'action
        details: String,              // Description détaillée
        timestamp: Number,            // Timestamp Unix
        ip: String,                   // Adresse IP (optionnel)
        device: String,               // Type d'appareil (optionnel)
        magasin: String               // Magasin actif lors de l'action
    }
    
    Types d'actions:
    - 'connexion': Connexion réussie
    - 'deconnexion': Déconnexion
    - 'modification_pin': Changement de code PIN
    - 'changement_magasin': Basculement de magasin
    - 'modification_permissions': Changement de permissions
    - 'modification_profil': Mise à jour du profil
    */
    
    // ========================================
    // STATISTIQUES
    // ========================================
    
    stats: {
        nombreConnexions: 0,          // Number - Nombre total de connexions
        derniereConnexion: null,      // Date - Dernière connexion
        dernierChangementPin: null,   // Date - Dernier changement de PIN
        tempsTotal: 0,                // Number - Temps total en secondes
        
        actionsEffectuees: {}         // Object - Compteurs par type d'action
        /* Exemple:
        {
            interventions_creees: 42,
            commandes_validees: 15,
            decomptes_traites: 128
        }
        */
    },
    
    // ========================================
    // MÉTADONNÉES
    // ========================================
    
    dates: {
        creation: null,                // Timestamp - Date de création du compte
        derniereConnexion: null,      // Timestamp - Dernière connexion
        dernierChangementPin: null,   // Timestamp - Dernier changement de PIN
        derniereModification: null,   // Timestamp - Dernière modification
        derniereSync: null            // Timestamp - Dernière synchronisation
    },
    
    metadata: {
        version: '2.0',               // String - Version du template
        creePar: null,                // String - ID utilisateur créateur
        modifiePar: null,             // String - ID dernier modificateur
        actif: true,                  // Boolean - Compte actif
        verrouille: false,            // Boolean - Compte verrouillé
        raisonVerrouillage: null,     // String - Raison si verrouillé
        tentativesConnexion: 0,       // Number - Tentatives de connexion échouées
        tags: []                      // Array<String> - Tags personnalisés
    }
};

// ========================================
// TEMPLATE GROUPE
// Structure d'un groupe d'utilisateurs
// ========================================

export const GROUP_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    id: null,                         // String - ID Firestore unique
    nom: null,                        // String - Nom du groupe (ex: 'Techniciens')
    description: null,                // String - Description détaillée
    icon: '👥',                      // String - Emoji ou icône
    couleur: '#667eea',              // String - Couleur hexadécimale
    
    // ========================================
    // PERMISSIONS DU GROUPE
    // ========================================
    
    permissions: {
        pages: {},                     // Object - Mêmes structures que USER
        fonctionnalites: {}           // Object - Mêmes structures que USER
    },
    
    // ========================================
    // MEMBRES
    // ========================================
    
    membres: [],                      // Array<String> - IDs des utilisateurs membres
    responsables: [],                 // Array<String> - IDs des responsables du groupe
    
    // ========================================
    // CONFIGURATION
    // ========================================
    
    config: {
        priorite: 0,                  // Number - Priorité (0 = plus haute)
        heritage: true,               // Boolean - Hérite des permissions parent
        parent: null,                 // String - ID du groupe parent
        enfants: []                   // Array<String> - IDs des groupes enfants
    },
    
    // ========================================
    // MÉTADONNÉES
    // ========================================
    
    metadata: {
        dateCreation: null,           // Timestamp
        creePar: null,                // String - ID créateur
        derniereModification: null,   // Timestamp
        modifiePar: null,             // String - ID modificateur
        actif: true                   // Boolean - Groupe actif
    }
};

// ========================================
// TEMPLATE MAGASIN
// Structure d'un magasin
// ========================================

export const MAGASIN_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    code: null,                       // String - Code unique (ex: '9CHE', '8MON')
    nom: null,                        // String - Nom complet
    
    // ========================================
    // SOCIÉTÉ
    // ========================================
    
    societe: {
        id: null,                     // String - ID société
        raisonSociale: null,         // String - Raison sociale
        siret: null,                  // String - SIRET
        tva: null                     // String - Numéro TVA
    },
    
    // ========================================
    // LOCALISATION
    // ========================================
    
    adresse: {
        rue: null,                    // String
        complement: null,             // String - Complément d'adresse
        codePostal: null,            // String
        ville: null,                  // String
        pays: 'France',               // String
        coordonnees: {
            latitude: null,           // Number
            longitude: null           // Number
        }
    },
    
    // ========================================
    // CONTACT
    // ========================================
    
    contact: {
        telephone: null,              // String
        fax: null,                    // String
        email: null,                  // String
        siteWeb: null,               // String - URL
        responsable: null,           // String - Nom du responsable
        emailResponsable: null       // String - Email du responsable
    },
    
    // ========================================
    // HORAIRES
    // ========================================
    
    horaires: {
        lundi: { ouverture: '09:00', fermeture: '18:00', ferme: false },
        mardi: { ouverture: '09:00', fermeture: '18:00', ferme: false },
        mercredi: { ouverture: '09:00', fermeture: '18:00', ferme: false },
        jeudi: { ouverture: '09:00', fermeture: '18:00', ferme: false },
        vendredi: { ouverture: '09:00', fermeture: '18:00', ferme: false },
        samedi: { ouverture: '09:00', fermeture: '12:00', ferme: false },
        dimanche: { ouverture: null, fermeture: null, ferme: true }
    },
    
    // ========================================
    // IDENTIFIANTS OFFICIELS
    // ========================================
    
    numeroFINESS: null,              // String - Numéro FINESS (9 chiffres)
    numeroAPE: null,                 // String - Code APE
    
    // ========================================
    // PARAMÈTRES
    // ========================================
    
    parametres: {
        typeActivite: [],            // Array<String> - Types d'activité
        /* Exemples:
        ['audioprothese', 'optique', 'dentaire']
        */
        
        services: [],                // Array<String> - Services proposés
        /* Exemples:
        ['vente', 'reparation', 'entretien', 'conseil']
        */
        
        equipements: [],             // Array<String> - Équipements disponibles
        /* Exemples:
        ['cabine_audiometrie', 'salle_essai', 'atelier']
        */
        
        certifications: []           // Array<String> - Certifications
    },
    
    // ========================================
    // STATISTIQUES
    // ========================================
    
    stats: {
        nombreEmployes: 0,           // Number
        nombreClients: 0,            // Number
        chiffreAffaireMois: 0,      // Number - CA du mois en cours
        chiffreAffaireAnnee: 0      // Number - CA de l'année
    },
    
    // ========================================
    // MÉTADONNÉES
    // ========================================
    
    metadata: {
        actif: true,                 // Boolean - Magasin actif
        dateCreation: null,          // Timestamp
        derniereModification: null,  // Timestamp
        synchronise: true,           // Boolean - Synchronisé avec système central
        tags: []                     // Array<String> - Tags personnalisés
    }
};

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer un nouvel utilisateur avec structure complète
 * @returns {Object} Nouvel utilisateur vide
 */
export function createNewUser() {
    return JSON.parse(JSON.stringify(USER_ACCOUNT_TEMPLATE));
}

/**
 * Créer un nouveau groupe avec structure complète
 * @returns {Object} Nouveau groupe vide
 */
export function createNewGroup() {
    return JSON.parse(JSON.stringify(GROUP_TEMPLATE));
}

/**
 * Créer un nouveau magasin avec structure complète
 * @returns {Object} Nouveau magasin vide
 */
export function createNewMagasin() {
    return JSON.parse(JSON.stringify(MAGASIN_TEMPLATE));
}

/**
 * Créer une entrée historique
 * @param {string} action - Type d'action
 * @param {string} details - Description détaillée
 * @param {Object} metadata - Métadonnées additionnelles
 * @returns {Object} Entrée historique
 */
export function createHistoryEntry(action, details, metadata = {}) {
    return {
        date: new Date(),
        action: action,
        details: details,
        timestamp: Date.now(),
        ...metadata
    };
}

/**
 * Créer une structure de permissions vide
 * @returns {Object} Permissions vides
 */
export function createPermissions() {
    return {
        pages: {
            interventions: { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            commandes: { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            'decompte-secu': { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            'decompte-mutuelle': { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            'operations-bancaires': { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            clients: { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            planning: { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            },
            statistiques: { 
                view: false, 
                create: false, 
                edit: false, 
                delete: false,
                export: false
            }
        },
        fonctionnalites: {
            voir_tous_utilisateurs: false,
            creer_utilisateurs: false,
            modifier_utilisateurs: false,
            supprimer_utilisateurs: false,
            modifier_tous_codes_pin: false,
            acces_tous_magasins: false,
            gerer_parametres_magasins: false,
            voir_statistiques_globales: false,
            voir_statistiques_magasin: false,
            exporter_donnees_globales: false,
            gerer_parametres_systeme: false
        }
    };
}

/**
 * Créer une autorisation magasin
 * @param {boolean} acces - Accès autorisé
 * @param {boolean} responsable - Est responsable
 * @param {Array} permissions - Permissions spéciales
 * @returns {Object} Autorisation
 */
export function createAutorisation(acces = false, responsable = false, permissions = []) {
    return {
        acces: acces,
        responsable: responsable,
        permissions: permissions
    };
}

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const VALIDATION_RULES = {
    // ----------------------------------------
    // VALIDATION UTILISATEUR
    // ----------------------------------------
    user: {
        required: ['id', 'nom', 'prenom', 'codeHash'],
        pinLength: 4,
        pinPattern: /^\d{4}$/,
        nomMaxLength: 50,
        nomMinLength: 2,
        prenomMaxLength: 50,
        prenomMinLength: 2,
        codeHashPattern: /^[a-f0-9]{64}$/ // SHA-256
    },
    
    // ----------------------------------------
    // VALIDATION GROUPE
    // ----------------------------------------
    groupe: {
        required: ['id', 'nom'],
        nomMaxLength: 50,
        nomMinLength: 3,
        descriptionMaxLength: 200,
        couleurPattern: /^#[0-9A-Fa-f]{6}$/
    },
    
    // ----------------------------------------
    // VALIDATION MAGASIN
    // ----------------------------------------
    magasin: {
        required: ['code', 'nom'],
        codePattern: /^[89][A-Z]{3}$/,  // Format: 8XXX ou 9XXX
        codePostalPattern: /^\d{5}$/,
        siretPattern: /^\d{14}$/,
        finessPattern: /^\d{9}$/,
        emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        telephonePattern: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
    },
    
    // ----------------------------------------
    // LIMITES
    // ----------------------------------------
    limits: {
        maxGroupesParUtilisateur: 10,
        maxMagasinsParUtilisateur: 50,
        maxHistoriqueEntries: 1000,
        maxPermissionsSpeciales: 20,
        maxTentativesConnexion: 5
    }
};

// ========================================
// FONCTIONS DE VALIDATION
// ========================================

/**
 * Valider un utilisateur
 * @param {Object} user - Utilisateur à valider
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateUser(user) {
    const errors = [];
    const rules = VALIDATION_RULES.user;
    
    // Champs requis
    rules.required.forEach(field => {
        if (!user[field]) {
            errors.push(`Le champ ${field} est requis`);
        }
    });
    
    // Longueur nom
    if (user.nom && user.nom.length > rules.nomMaxLength) {
        errors.push(`Le nom ne doit pas dépasser ${rules.nomMaxLength} caractères`);
    }
    
    // Longueur prénom
    if (user.prenom && user.prenom.length > rules.prenomMaxLength) {
        errors.push(`Le prénom ne doit pas dépasser ${rules.prenomMaxLength} caractères`);
    }
    
    // Format hash
    if (user.codeHash && !rules.codeHashPattern.test(user.codeHash)) {
        errors.push('Le hash du code PIN est invalide');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Valider un groupe
 * @param {Object} groupe - Groupe à valider
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateGroupe(groupe) {
    const errors = [];
    const rules = VALIDATION_RULES.groupe;
    
    // Champs requis
    rules.required.forEach(field => {
        if (!groupe[field]) {
            errors.push(`Le champ ${field} est requis`);
        }
    });
    
    // Couleur
    if (groupe.couleur && !rules.couleurPattern.test(groupe.couleur)) {
        errors.push('La couleur doit être au format hexadécimal (#RRGGBB)');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Valider un magasin
 * @param {Object} magasin - Magasin à valider
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateMagasin(magasin) {
    const errors = [];
    const rules = VALIDATION_RULES.magasin;
    
    // Champs requis
    rules.required.forEach(field => {
        if (!magasin[field]) {
            errors.push(`Le champ ${field} est requis`);
        }
    });
    
    // Code magasin
    if (magasin.code && !rules.codePattern.test(magasin.code)) {
        errors.push('Le code magasin doit être au format 8XXX ou 9XXX');
    }
    
    // Code postal
    if (magasin.adresse?.codePostal && !rules.codePostalPattern.test(magasin.adresse.codePostal)) {
        errors.push('Le code postal doit contenir 5 chiffres');
    }
    
    // Email
    if (magasin.contact?.email && !rules.emailPattern.test(magasin.contact.email)) {
        errors.push('L\'email est invalide');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Templates
    USER_ACCOUNT_TEMPLATE,
    GROUP_TEMPLATE,
    MAGASIN_TEMPLATE,
    
    // Règles de validation
    VALIDATION_RULES,
    
    // Helpers de création
    createNewUser,
    createNewGroup,
    createNewMagasin,
    createHistoryEntry,
    createPermissions,
    createAutorisation,
    
    // Fonctions de validation
    validateUser,
    validateGroupe,
    validateMagasin
};

/* ========================================
   HISTORIQUE
   
   [09/01/2025] - v2.0.0
   - Structure complète normalisée
   - Templates pour User, Groupe, Magasin
   - Helpers de création
   - Règles et fonctions de validation
   - Documentation détaillée
   ======================================== */