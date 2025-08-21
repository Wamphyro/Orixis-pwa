// ========================================
// COMMANDES.TEMPLATE.JS - Template Firestore pour commandes
// Chemin: modules/commandes/commandes.template.js
//
// DESCRIPTION:
// Définit la structure complète d'un document commande dans Firestore
// Garantit que tous les champs existent avec les bons types
//
// VERSION: 1.0.0
// DATE: 09/08/2025
// ========================================

// ========================================
// TEMPLATE PRINCIPAL
// ========================================

export const COMMANDE_TEMPLATE = {
    // ========================================
    // IDENTIFICATION
    // ========================================
    
    // Numéro unique de la commande
    numeroCommande: null,           // String - Format: CMD-AAAAMMJJ-XXXX
    
    // Statut actuel de la commande
    statut: 'nouvelle',             // String - nouvelle|preparation|terminee|expediee|receptionnee|livree|annulee|supprime
    
    // ========================================
    // CLIENT
    // ========================================
    
    client: {
        id: null,                   // String - ID du client dans Firestore
        nom: null,                  // String - Nom de famille
        prenom: null,               // String - Prénom
        telephone: null,            // String - Téléphone
        email: null                 // String - Email
    },
    
    // ========================================
    // PRODUITS
    // ========================================
    
    produits: [],                   // Array<Object> - Liste des produits commandés
    /* Structure d'un produit:
    {
        id: 'prod-123',             // ID du produit
        reference: 'REF-001',       // Référence produit
        designation: 'Appareil X',  // Nom du produit
        type: 'appareil_auditif',   // Type de produit
        marque: 'Marque',           // Marque
        quantite: 1,                // Quantité commandée
        cote: 'droit',              // Côté si applicable (droit/gauche)
        numeroSerie: null,          // Numéro de série assigné
        necessiteCote: false        // Si le produit nécessite un côté
    }
    */
    
    nombreProduits: 0,              // number - Nombre total de produits
    
    // ========================================
    // PRÉPARATION ET LIVRAISON
    // ========================================
    
    // Type de préparation
    typePreparation: 'accessoire',  // String - premiere_paire|deuxieme_paire|accessoire
    
    // Niveau d'urgence
    niveauUrgence: 'normal',        // String - normal|urgent|tres_urgent
    
    // Magasins
    magasinReference: null,         // String - Magasin de référence du client
    magasinLivraison: null,         // String - Magasin où livrer la commande
    
    // Commentaires
    commentaires: '',               // String - Instructions particulières
    
    // ========================================
    // DATES
    // ========================================
    
    dates: {
        commande: null,             // Timestamp - Date de création
        livraisonPrevue: null,      // Timestamp - Date de livraison souhaitée
        preparationDebut: null,     // Timestamp - Début de préparation
        preparationFin: null,       // Timestamp - Fin de préparation
        expeditionValidee: null,    // Timestamp - Date d'expédition
        receptionValidee: null,     // Timestamp - Date de réception
        livraisonClient: null,      // Timestamp - Date de livraison au client
        patientPrevenu: null        // Timestamp - Date où le patient a été prévenu
    },
    
    // ========================================
    // INTERVENANTS
    // ========================================
    
    intervenants: {
        // Personne qui a créé la commande
        commandePar: {
            id: null,               // String - ID utilisateur
            nom: null,              // String - Nom
            prenom: null,           // String - Prénom
            role: null              // String - Rôle
        },
        
        // Personne qui gère la préparation
        gerePar: null,              // Object ou null - Même structure
        
        // Personne qui a livré au client
        livrePar: null              // Object ou null - Même structure
    },
    
    // ========================================
    // EXPÉDITION
    // ========================================
    
    expedition: {
        // Indique si l'expédition est nécessaire
        necessiteExpedition: false,  // boolean
        
        // Informations d'envoi
        envoi: {
            transporteur: null,      // String - Nom du transporteur
            numeroSuivi: null,       // String - Numéro de suivi
            dateEnvoi: null,         // Timestamp - Date d'envoi
            scanPar: null            // Object - Utilisateur qui a scanné
        },
        
        // Informations de réception
        reception: {
            numeroSuiviRecu: null,   // String - Numéro scanné à réception
            dateReception: null,     // Timestamp - Date de réception
            recuPar: null,           // Object - Utilisateur qui a réceptionné
            colisConforme: null,     // boolean - Colis conforme ?
            commentaires: null       // String - Commentaires réception
        }
    },
    
    // ========================================
    // NUMÉROS DE SÉRIE
    // ========================================
    
    numerosSerieAssignes: {},        // Object - NS assignés par index produit
    /* Structure:
    {
        "0": "NS-12345",            // NS du produit à l'index 0
        "1": "NS-67890",            // NS du produit à l'index 1
        ...
    }
    */
    
    // ========================================
    // STATUTS ET FLAGS
    // ========================================
    
    patientPrevenu: false,          // boolean - Le patient a été prévenu
    
    // ========================================
    // ANNULATION
    // ========================================
    
    annulation: null,               // Object ou null
    /* Structure si annulée:
    {
        date: Timestamp,            // Date d'annulation
        par: Object,                // Utilisateur qui a annulé
        motif: String,              // Motif d'annulation
        etapeAuMomentAnnulation: String // Statut au moment de l'annulation
    }
    */
    
    // ========================================
    // SUPPRESSION (SOFT DELETE)
    // ========================================
    
    suppression: null,              // Object ou null
    /* Structure si supprimée:
    {
        date: Timestamp,            // Date de suppression
        par: Object,                // Utilisateur qui a supprimé
        motif: String               // Motif de suppression
    }
    */
    
    // ========================================
    // HISTORIQUE
    // ========================================
    
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
// TEMPLATE D'UN PRODUIT
// ========================================

export const PRODUIT_TEMPLATE = {
    id: null,                       // String - ID du produit
    reference: null,                // String - Référence
    designation: null,              // String - Désignation
    type: 'consommable',            // String - Type de produit
    marque: null,                   // String - Marque
    quantite: 1,                    // number - Quantité
    cote: null,                     // String ou null - droit|gauche
    numeroSerie: null,              // String ou null - Numéro de série
    necessiteCote: false            // boolean - Nécessite un côté
};

// ========================================
// RÈGLES DE VALIDATION
// ========================================

export const COMMANDE_RULES = {
    // Champs obligatoires
    required: [
        'numeroCommande',
        'statut',
        'client.id',
        'client.nom',
        'client.prenom',
        'typePreparation',
        'niveauUrgence',
        'magasinLivraison'
    ],
    
    // Valeurs énumérées
    enum: {
        statut: [
            'nouvelle',
            'preparation',
            'terminee',
            'expediee',
            'receptionnee',
            'livree',
            'annulee',
            'supprime'
        ],
        typePreparation: [
            'premiere_paire',
            'deuxieme_paire',
            'accessoire'
        ],
        niveauUrgence: [
            'normal',
            'urgent',
            'tres_urgent'
        ],
        cote: [
            'droit',
            'gauche'
        ]
    },
    
    // Validations spécifiques
    validations: {
        numeroCommande: /^CMD-\d{8}-\d{4}$/,
        telephone: /^[0-9\s\-\+\.]{10,}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // Limites
    limits: {
        maxProduits: 50,
        maxCommentaires: 1000,
        maxHistoriqueEntries: 200
    }
};

// ========================================
// HELPERS DE CRÉATION
// ========================================

/**
 * Créer une nouvelle commande avec les valeurs par défaut
 * @returns {Object} Nouvelle commande basée sur le template
 */
export function createNewCommande() {
    return JSON.parse(JSON.stringify(COMMANDE_TEMPLATE));
}

/**
 * Créer un nouveau produit avec les valeurs par défaut
 * @param {Object} data - Données du produit
 * @returns {Object} Nouveau produit basé sur le template
 */
export function createProduit(data = {}) {
    const produit = JSON.parse(JSON.stringify(PRODUIT_TEMPLATE));
    return Object.assign(produit, data);
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
 * @param {Object} commande - Commande à valider
 * @returns {Object} Résultat de validation { valid: boolean, errors: [] }
 */
export function validateCommande(commande) {
    const errors = [];
    
    // Vérifier les champs obligatoires
    COMMANDE_RULES.required.forEach(field => {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key], commande)
            : commande[field];
            
        if (!value) {
            errors.push(`Champ obligatoire manquant: ${field}`);
        }
    });
    
    // Vérifier les énumérations
    Object.entries(COMMANDE_RULES.enum).forEach(([field, values]) => {
        const value = commande[field];
        if (value && !values.includes(value)) {
            errors.push(`Valeur invalide pour ${field}: ${value}`);
        }
    });
    
    // Vérifier les formats avec regex
    Object.entries(COMMANDE_RULES.validations).forEach(([field, regex]) => {
        const value = field.includes('.') 
            ? field.split('.').reduce((obj, key) => obj?.[key], commande)
            : commande[field];
            
        if (value && !regex.test(value)) {
            errors.push(`Format invalide pour ${field}: ${value}`);
        }
    });
    
    // Vérifier les limites
    if (commande.produits && commande.produits.length > COMMANDE_RULES.limits.maxProduits) {
        errors.push(`Trop de produits: ${commande.produits.length} (max: ${COMMANDE_RULES.limits.maxProduits})`);
    }
    
    if (commande.commentaires && commande.commentaires.length > COMMANDE_RULES.limits.maxCommentaires) {
        errors.push(`Commentaires trop longs: ${commande.commentaires.length} caractères (max: ${COMMANDE_RULES.limits.maxCommentaires})`);
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Calculer le statut suivant dans le workflow
 * @param {string} statutActuel - Statut actuel
 * @returns {string|null} Statut suivant ou null
 */
export function getProchainStatut(statutActuel) {
    const workflow = {
        'nouvelle': 'preparation',
        'preparation': 'terminee',
        'terminee': 'expediee',
        'expediee': 'receptionnee',
        'receptionnee': 'livree',
        'livree': null,
        'annulee': null,
        'supprime': null
    };
    
    return workflow[statutActuel] || null;
}

/**
 * Vérifier si une commande peut être annulée
 * @param {string} statut - Statut actuel
 * @returns {boolean} Peut être annulée
 */
export function peutEtreAnnulee(statut) {
    return !['livree', 'annulee', 'supprime'].includes(statut);
}

/**
 * Vérifier si une commande peut être supprimée
 * @param {string} statut - Statut actuel
 * @returns {boolean} Peut être supprimée
 */
export function peutEtreSupprimee(statut) {
    return !['livree', 'supprime'].includes(statut);
}

/**
 * Calculer la date de livraison prévue selon l'urgence
 * @param {string} urgence - Niveau d'urgence
 * @returns {Date} Date de livraison calculée
 */
export function calculerDateLivraison(urgence = 'normal') {
    const date = new Date();
    
    const delais = {
        'normal': 5,        // 5 jours ouvrés
        'urgent': 2,        // 2 jours ouvrés
        'tres_urgent': 1    // 1 jour ouvré
    };
    
    const joursAjouter = delais[urgence] || 5;
    
    // Ajouter les jours en tenant compte des weekends
    let joursOuvres = 0;
    while (joursOuvres < joursAjouter) {
        date.setDate(date.getDate() + 1);
        const jourSemaine = date.getDay();
        if (jourSemaine !== 0 && jourSemaine !== 6) { // Pas dimanche (0) ni samedi (6)
            joursOuvres++;
        }
    }
    
    return date;
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    COMMANDE_TEMPLATE,
    HISTORIQUE_ENTRY_TEMPLATE,
    PRODUIT_TEMPLATE,
    COMMANDE_RULES,
    createNewCommande,
    createProduit,
    createHistoriqueEntry,
    validateCommande,
    getProchainStatut,
    peutEtreAnnulee,
    peutEtreSupprimee,
    calculerDateLivraison
};

/* ========================================
   HISTORIQUE
   
   [09/08/2025] - v1.0.0 Création
   - Template pour garantir la structure
   - Règles de validation
   - Helpers de création
   - Fonctions utilitaires métier
   ======================================== */