/* ========================================
   AUTH.UTILS.JS - Service d'authentification centralisé
   Chemin: src/utils/business/auth.utils.js
   
   DESCRIPTION:
   Service centralisé pour la gestion de l'authentification
   et des informations utilisateur. Remplace les getUserInfo()
   dupliqués dans firestore.service.js et upload.service.js.
   Gère également les rôles, permissions et informations magasin.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. FONCTIONS PRINCIPALES
   3. GETTERS SPÉCIFIQUES
   4. VÉRIFICATIONS ET PERMISSIONS
   5. ACTIONS UTILISATEUR
   6. HELPERS PRIVÉS
   7. EXPORT
   
   UTILISATION:
   import { getUserInfo, isAuthenticated } from '/Orixis-pwa/src/utils/business/auth.utils.js';
   const user = getUserInfo();
   if (isAuthenticated()) { ... }
   
   API PUBLIQUE:
   - getUserInfo() - Récupère toutes les infos utilisateur formatées
   - isAuthenticated() - Vérifie si l'utilisateur est connecté
   - getMagasinInfo() - Récupère les infos détaillées du magasin
   - getAuthToken() - Récupère le token d'authentification
   - hasRole(role) - Vérifie si l'utilisateur a un rôle spécifique
   - isAdmin() - Vérifie si l'utilisateur est administrateur
   - logout() - Déconnexion complète avec nettoyage
   - getUserForHistory() - Format utilisateur pour historique Firestore
   
   DÉPENDANCES:
   - localStorage : sav_auth, orixis_magasins
   - sessionStorage : nettoyé lors du logout
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale, centralisation depuis services
   
   AUTEUR: Assistant Claude (basé sur code existant)
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Clés localStorage utilisées
 * @private
 */
const STORAGE_KEYS = {
    AUTH: 'sav_auth',
    MAGASINS: 'orixis_magasins',
    DEBUG: 'DEBUG_MODE'
};

/**
 * Mapping des préfixes magasin vers sociétés
 * @private
 */
const SOCIETE_MAPPING = {
    '9': 'BA',      // Boucle Auditive
    '8': 'ORIXIS',  // ORIXIS
    '7': 'AUTRE'    // Autres
};

/**
 * Valeurs par défaut
 * @private
 */
const DEFAULTS = {
    USER_ID: 'unknown',
    USER_NAME: 'Inconnu',
    USER_ROLE: 'technicien',
    MAGASIN: 'XXX',
    SOCIETE: 'NON_DEFINI'
};

// ========================================
// 2. FONCTIONS PRINCIPALES
// ========================================

/**
 * Récupérer les informations complètes de l'utilisateur connecté
 * Centralise la logique dupliquée dans firestore.service et upload.service
 * 
 * @returns {Object} Informations utilisateur formatées
 * @returns {string} .id - Identifiant utilisateur
 * @returns {string} .nom - Nom de famille
 * @returns {string} .prenom - Prénom
 * @returns {string} .name - Nom complet formaté
 * @returns {string} .role - Rôle de l'utilisateur
 * @returns {string} .magasin - Code magasin
 * @returns {string} .societe - Société normalisée
 * @returns {string|null} .email - Email si disponible
 * 
 * @example
 * const user = getUserInfo();
 * console.log(user.name); // "Jean DUPONT"
 * console.log(user.magasin); // "9PAR"
 */
export function getUserInfo() {
    try {
        const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
        
        // Extraction des données avec fallbacks
        const collaborateur = auth.collaborateur || {};
        const prenom = collaborateur.prenom || '';
        const nom = collaborateur.nom || DEFAULTS.USER_NAME;
        
        return {
            // === IDENTITÉ ===
            id: collaborateur.id || DEFAULTS.USER_ID,
            nom: nom,
            prenom: prenom,
            name: formatUserName(prenom, nom),
            role: collaborateur.role || DEFAULTS.USER_ROLE,
            
            // === ORGANISATION ===
            magasin: auth.magasin || collaborateur.magasin || DEFAULTS.MAGASIN,
            societe: getSocieteFromAuth(auth),
            
            // === CONTACT ===
            email: collaborateur.email || auth.email || null
        };
    } catch (error) {
        console.error('❌ Erreur getUserInfo:', error);
        return getDefaultUser();
    }
}

/**
 * Vérifier si l'utilisateur est authentifié
 * 
 * @returns {boolean} true si connecté, false sinon
 * 
 * @example
 * if (!isAuthenticated()) {
 *     window.location.href = '/login.html';
 * }
 */
export function isAuthenticated() {
    try {
        const auth = localStorage.getItem(STORAGE_KEYS.AUTH);
        return !!auth && auth !== '{}';
    } catch (error) {
        console.error('❌ Erreur isAuthenticated:', error);
        return false;
    }
}

// ========================================
// 3. GETTERS SPÉCIFIQUES
// ========================================

/**
 * Récupérer les informations détaillées du magasin actuel
 * Combine les infos auth avec le référentiel magasins
 * 
 * @returns {Object} Informations magasin
 * @returns {string} .code - Code magasin
 * @returns {string} .societe - Société du magasin
 * @returns {string|null} .finess - Numéro FINESS
 * @returns {Object|null} .adresse - Adresse complète
 * @returns {string|null} .ville - Ville du magasin
 * 
 * @example
 * const magasin = getMagasinInfo();
 * console.log(magasin.finess); // "750000000"
 */
export function getMagasinInfo() {
    const user = getUserInfo();
    
    // Tentative de récupération depuis le référentiel
    try {
        const magasinsStored = localStorage.getItem(STORAGE_KEYS.MAGASINS);
        if (!magasinsStored) {
            return getDefaultMagasinInfo(user);
        }
        
        const magasins = JSON.parse(magasinsStored);
        const magasinData = magasins[user.magasin];
        
        if (!magasinData) {
            return getDefaultMagasinInfo(user);
        }
        
        return {
            code: user.magasin,
            societe: user.societe,
            finess: magasinData.numeroFINESS || magasinData.finess || null,
            adresse: magasinData.adresse || null,
            ville: magasinData.adresse?.ville || null,
            // Ajout d'infos supplémentaires si disponibles
            raisonSociale: magasinData.societe?.raisonSociale || user.societe,
            actif: magasinData.actif !== false
        };
        
    } catch (error) {
        console.error('❌ Erreur getMagasinInfo:', error);
        return getDefaultMagasinInfo(user);
    }
}

/**
 * Récupérer le token d'authentification
 * 
 * @returns {string|null} Token JWT ou null si non disponible
 * 
 * @example
 * const token = getAuthToken();
 * fetch('/api/data', {
 *     headers: { 'Authorization': `Bearer ${token}` }
 * });
 */
export function getAuthToken() {
    try {
        const auth = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTH) || '{}');
        return auth.token || auth.accessToken || auth.jwt || null;
    } catch (error) {
        console.error('❌ Erreur getAuthToken:', error);
        return null;
    }
}

// ========================================
// 4. VÉRIFICATIONS ET PERMISSIONS
// ========================================

/**
 * Vérifier si l'utilisateur possède un rôle spécifique
 * 
 * @param {string} role - Rôle à vérifier
 * @returns {boolean} true si l'utilisateur a ce rôle
 * 
 * @example
 * if (hasRole('manager')) {
 *     showManagerPanel();
 * }
 */
export function hasRole(role) {
    if (!role) return false;
    
    try {
        const user = getUserInfo();
        return user.role === role;
    } catch (error) {
        console.error('❌ Erreur hasRole:', error);
        return false;
    }
}

/**
 * Vérifier si l'utilisateur est administrateur
 * 
 * @returns {boolean} true si admin ou administrateur
 * 
 * @example
 * if (isAdmin()) {
 *     showAdminMenu();
 * }
 */
export function isAdmin() {
    return hasRole('admin') || hasRole('administrateur');
}

/**
 * Vérifier si l'utilisateur est manager
 * 
 * @returns {boolean} true si manager ou responsable
 */
export function isManager() {
    return hasRole('manager') || hasRole('responsable') || isAdmin();
}

/**
 * Vérifier si l'utilisateur appartient à une société spécifique
 * 
 * @param {string} societe - Code société à vérifier
 * @returns {boolean} true si l'utilisateur appartient à cette société
 * 
 * @example
 * if (belongsToSociete('ORIXIS')) {
 *     showOrixisFeatures();
 * }
 */
export function belongsToSociete(societe) {
    if (!societe) return false;
    
    try {
        const user = getUserInfo();
        return user.societe === normaliserSociete(societe);
    } catch (error) {
        console.error('❌ Erreur belongsToSociete:', error);
        return false;
    }
}

// ========================================
// 5. ACTIONS UTILISATEUR
// ========================================

/**
 * Déconnexion complète de l'utilisateur
 * Nettoie localStorage, sessionStorage et redirige
 * 
 * @param {string} [redirectUrl='/index.html'] - URL de redirection après déconnexion
 * 
 * @example
 * logout(); // Déconnexion et redirection vers /index.html
 * logout('/login.html'); // Déconnexion et redirection custom
 */
export function logout(redirectUrl = '/index.html') {
    try {
        console.log('🔐 Déconnexion utilisateur...');
        
        // Nettoyage localStorage (garder certaines clés si nécessaire)
        const keysToKeep = ['theme', 'language']; // Exemple de clés à conserver
        const dataToKeep = {};
        
        keysToKeep.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) dataToKeep[key] = value;
        });
        
        // Supprimer les données sensibles
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.MAGASINS);
        
        // Restaurer les données à conserver
        Object.entries(dataToKeep).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
        
        // Nettoyer sessionStorage complètement
        sessionStorage.clear();
        
        // Redirection
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
        
        console.log('✅ Déconnexion effectuée');
        
    } catch (error) {
        console.error('❌ Erreur logout:', error);
        // Forcer la redirection même en cas d'erreur
        window.location.href = redirectUrl;
    }
}

/**
 * Formater les informations utilisateur pour l'historique Firestore
 * Format standardisé pour les champs historique
 * 
 * @returns {Object} Utilisateur formaté pour historique
 * 
 * @example
 * const historique = {
 *     action: 'modification',
 *     date: new Date(),
 *     utilisateur: getUserForHistory()
 * };
 */
export function getUserForHistory() {
    const user = getUserInfo();
    
    return {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        // Timestamp pour traçabilité
        timestamp: Date.now()
    };
}

// ========================================
// 6. HELPERS PRIVÉS
// ========================================

/**
 * Déterminer la société depuis les données d'authentification
 * Logique centralisée avec ordre de priorité
 * 
 * @private
 * @param {Object} auth - Objet auth depuis localStorage
 * @returns {string} Code société normalisé
 */
function getSocieteFromAuth(auth) {
    // Priorité 1 : Raison sociale explicite
    if (auth.raisonSociale) {
        return normaliserSociete(auth.raisonSociale);
    }
    
    // Priorité 2 : Société explicite
    if (auth.societe) {
        return normaliserSociete(auth.societe);
    }
    
    // Priorité 3 : Déduction depuis le code magasin
    const magasin = auth.magasin || auth.collaborateur?.magasin || '';
    
    if (magasin) {
        const prefix = magasin.charAt(0);
        if (SOCIETE_MAPPING[prefix]) {
            return SOCIETE_MAPPING[prefix];
        }
    }
    
    // Défaut
    return DEFAULTS.SOCIETE;
}

/**
 * Normaliser un nom de société pour utilisation dans les chemins
 * Retire caractères spéciaux, remplace espaces, met en majuscules
 * 
 * @private
 * @param {string} societe - Nom de société à normaliser
 * @returns {string} Société normalisée
 * 
 * @example
 * normaliserSociete("ORIXIS S.A.S") // "ORIXIS_S_A_S"
 * normaliserSociete("Boucle Auditive") // "BOUCLE_AUDITIVE"
 */
function normaliserSociete(societe) {
    if (!societe || typeof societe !== 'string') {
        return DEFAULTS.SOCIETE;
    }
    
    return societe
        .trim()
        .replace(/[^A-Za-z0-9\s]/g, '')  // Retirer caractères spéciaux
        .replace(/\s+/g, '_')             // Espaces → underscores
        .replace(/_+/g, '_')              // Multiples underscores → un seul
        .toUpperCase()                    // Majuscules
        .substring(0, 50);                // Limiter la longueur
}

/**
 * Formater le nom complet de l'utilisateur
 * 
 * @private
 * @param {string} prenom - Prénom
 * @param {string} nom - Nom
 * @returns {string} Nom complet formaté
 */
function formatUserName(prenom, nom) {
    const prenomFormate = (prenom || '').trim();
    const nomFormate = (nom || DEFAULTS.USER_NAME).trim();
    
    if (prenomFormate && nomFormate !== DEFAULTS.USER_NAME) {
        return `${prenomFormate} ${nomFormate}`;
    }
    
    return nomFormate;
}

/**
 * Retourner un utilisateur par défaut en cas d'erreur
 * 
 * @private
 * @returns {Object} Utilisateur avec valeurs par défaut
 */
function getDefaultUser() {
    return {
        id: DEFAULTS.USER_ID,
        nom: DEFAULTS.USER_NAME,
        prenom: '',
        name: DEFAULTS.USER_NAME,
        role: DEFAULTS.USER_ROLE,
        magasin: DEFAULTS.MAGASIN,
        societe: DEFAULTS.SOCIETE,
        email: null
    };
}

/**
 * Retourner des infos magasin par défaut
 * 
 * @private
 * @param {Object} user - Utilisateur actuel
 * @returns {Object} Infos magasin par défaut
 */
function getDefaultMagasinInfo(user) {
    return {
        code: user.magasin,
        societe: user.societe,
        finess: null,
        adresse: null,
        ville: null,
        raisonSociale: user.societe,
        actif: true
    };
}

// ========================================
// 7. EXPORT
// ========================================

/**
 * Export par défaut pour import simplifié
 * Permet : import auth from './auth.utils.js';
 */
export default {
    // Fonctions principales
    getUserInfo,
    isAuthenticated,
    
    // Getters
    getMagasinInfo,
    getAuthToken,
    
    // Vérifications
    hasRole,
    isAdmin,
    isManager,
    belongsToSociete,
    
    // Actions
    logout,
    getUserForHistory,
    
    // Constantes exportées pour tests
    STORAGE_KEYS,
    DEFAULTS
};

/* ========================================
   FIN DU FICHIER
   ======================================== */