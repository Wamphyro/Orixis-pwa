/* ========================================
   CACHE.UTILS.JS - Service de cache multi-niveaux
   Chemin: src/utils/data/cache.utils.js
   
   DESCRIPTION:
   Service de cache centralisé avec support mémoire, localStorage
   et sessionStorage. Gère les TTL (Time To Live), l'invalidation
   automatique, les stratégies de cache et la compression des données.
   Optimise les performances en évitant les requêtes répétitives.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. CLASSE CACHE MÉMOIRE
   3. CLASSE CACHE LOCALSTORAGE
   4. CLASSE CACHE SESSIONSTORAGE
   5. CLASSE CACHE UNIFIÉ
   6. STRATÉGIES DE CACHE
   7. UTILITAIRES DE COMPRESSION
   8. GESTIONNAIRE DE CACHE GLOBAL
   9. HELPERS PRIVÉS
   10. EXPORT
   
   UTILISATION:
   import cache from '/Orixis-pwa/src/utils/data/cache.utils.js';
   
   // Cache simple avec TTL
   await cache.get('magasins', fetchMagasins, { ttl: 3600000 });
   
   // Cache manuel
   cache.set('user', userData, { ttl: 1800000 });
   const user = cache.get('user');
   
   // Invalidation
   cache.invalidate('magasins');
   cache.clear();
   
   API PUBLIQUE:
   - get(key, fetcher, options) - Récupère ou charge avec cache
   - set(key, value, options) - Stocke dans le cache
   - has(key) - Vérifie si la clé existe et est valide
   - invalidate(key) - Invalide une entrée
   - clear(pattern) - Nettoie le cache (avec pattern optionnel)
   - getStats() - Statistiques du cache
   - preload(keys) - Précharge des données
   
   DÉPENDANCES:
   - Pas de dépendances externes
   - Compatible avec tous les navigateurs modernes
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale avec support multi-niveaux
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

// ========================================
// 1. IMPORTS ET CONFIGURATION
// ========================================

/**
 * Configuration par défaut du cache
 * @private
 */
const CONFIG = {
    // TTL par défaut (5 minutes)
    DEFAULT_TTL: 5 * 60 * 1000,
    
    // TTL maximum (24 heures)
    MAX_TTL: 24 * 60 * 60 * 1000,
    
    // Taille max d'une entrée (5MB)
    MAX_ENTRY_SIZE: 5 * 1024 * 1024,
    
    // Taille max totale localStorage (10MB)
    MAX_STORAGE_SIZE: 10 * 1024 * 1024,
    
    // Préfixe pour les clés
    KEY_PREFIX: 'cache_',
    
    // Préfixe pour les métadonnées
    META_PREFIX: 'meta_',
    
    // Intervalle de nettoyage automatique (10 minutes)
    CLEANUP_INTERVAL: 10 * 60 * 1000,
    
    // Compression activée par défaut
    ENABLE_COMPRESSION: true,
    
    // Niveau de cache par défaut
    DEFAULT_LEVEL: 'memory',
    
    // Debug mode
    DEBUG: localStorage.getItem('DEBUG_CACHE') === 'true'
};

/**
 * Types de cache disponibles
 * @private
 */
const CACHE_LEVELS = {
    MEMORY: 'memory',
    SESSION: 'session',
    LOCAL: 'local',
    ALL: 'all'
};

/**
 * Stratégies de cache
 * @private
 */
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',        // Cache d'abord, réseau si échec
    NETWORK_FIRST: 'network-first',    // Réseau d'abord, cache si échec
    CACHE_ONLY: 'cache-only',          // Cache uniquement
    NETWORK_ONLY: 'network-only',      // Réseau uniquement
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate' // Cache puis MAJ en arrière-plan
};

// ========================================
// 2. CLASSE CACHE MÉMOIRE
// ========================================

/**
 * Cache en mémoire (Map)
 * Le plus rapide mais perdu au rechargement
 */
class MemoryCache {
    constructor() {
        this.store = new Map();
        this.metadata = new Map();
        this.hits = 0;
        this.misses = 0;
    }
    
    /**
     * Stocker une valeur
     * 
     * @param {string} key - Clé
     * @param {any} value - Valeur
     * @param {Object} options - Options (ttl, tags)
     */
    set(key, value, options = {}) {
        const ttl = options.ttl || CONFIG.DEFAULT_TTL;
        const expires = Date.now() + ttl;
        
        this.store.set(key, value);
        this.metadata.set(key, {
            expires,
            created: Date.now(),
            accessed: Date.now(),
            accessCount: 0,
            size: this.getSize(value),
            tags: options.tags || []
        });
        
        if (CONFIG.DEBUG) {
            console.log(`💾 MemoryCache.set: ${key} (TTL: ${ttl}ms)`);
        }
    }
    
    /**
     * Récupérer une valeur
     * 
     * @param {string} key - Clé
     * @returns {any|null} Valeur ou null si expirée/inexistante
     */
    get(key) {
        const meta = this.metadata.get(key);
        
        // Vérifier existence
        if (!this.store.has(key) || !meta) {
            this.misses++;
            return null;
        }
        
        // Vérifier expiration
        if (Date.now() > meta.expires) {
            this.delete(key);
            this.misses++;
            return null;
        }
        
        // Mettre à jour les stats
        meta.accessed = Date.now();
        meta.accessCount++;
        this.hits++;
        
        return this.store.get(key);
    }
    
    /**
     * Vérifier si une clé existe et est valide
     * 
     * @param {string} key - Clé
     * @returns {boolean} true si existe et non expirée
     */
    has(key) {
        const meta = this.metadata.get(key);
        
        if (!this.store.has(key) || !meta) {
            return false;
        }
        
        if (Date.now() > meta.expires) {
            this.delete(key);
            return false;
        }
        
        return true;
    }
    
    /**
     * Supprimer une entrée
     * 
     * @param {string} key - Clé
     */
    delete(key) {
        this.store.delete(key);
        this.metadata.delete(key);
        
        if (CONFIG.DEBUG) {
            console.log(`🗑️ MemoryCache.delete: ${key}`);
        }
    }
    
    /**
     * Nettoyer tout ou par pattern
     * 
     * @param {string|RegExp} [pattern] - Pattern de clés à supprimer
     */
    clear(pattern) {
        if (!pattern) {
            this.store.clear();
            this.metadata.clear();
            this.hits = 0;
            this.misses = 0;
            return;
        }
        
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        
        for (const key of this.store.keys()) {
            if (regex.test(key)) {
                this.delete(key);
            }
        }
    }
    
    /**
     * Nettoyer les entrées expirées
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        
        for (const [key, meta] of this.metadata.entries()) {
            if (now > meta.expires) {
                this.delete(key);
                cleaned++;
            }
        }
        
        if (CONFIG.DEBUG && cleaned > 0) {
            console.log(`🧹 MemoryCache.cleanup: ${cleaned} entrées supprimées`);
        }
        
        return cleaned;
    }
    
    /**
     * Obtenir les statistiques
     * 
     * @returns {Object} Statistiques du cache
     */
    getStats() {
        const totalSize = Array.from(this.metadata.values())
            .reduce((sum, meta) => sum + (meta.size || 0), 0);
        
        return {
            type: 'memory',
            entries: this.store.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            totalSize: totalSize,
            formattedSize: this.formatSize(totalSize)
        };
    }
    
    /**
     * Calculer la taille approximative d'une valeur
     * 
     * @private
     * @param {any} value - Valeur
     * @returns {number} Taille en octets
     */
    getSize(value) {
        try {
            return JSON.stringify(value).length * 2; // Approximation UTF-16
        } catch {
            return 0;
        }
    }
    
    /**
     * Formater une taille
     * 
     * @private
     * @param {number} bytes - Taille en octets
     * @returns {string} Taille formatée
     */
    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

// ========================================
// 3. CLASSE CACHE LOCALSTORAGE
// ========================================

/**
 * Cache persistant avec localStorage
 * Survit au rechargement mais limité en taille
 */
class LocalStorageCache {
    constructor() {
        this.prefix = CONFIG.KEY_PREFIX;
        this.hits = 0;
        this.misses = 0;
        this.setupCleanup();
    }
    
    /**
     * Configurer le nettoyage automatique
     * 
     * @private
     */
    setupCleanup() {
        // Nettoyer au démarrage
        this.cleanup();
        
        // Nettoyer périodiquement
        if (CONFIG.CLEANUP_INTERVAL > 0) {
            setInterval(() => this.cleanup(), CONFIG.CLEANUP_INTERVAL);
        }
    }
    
    /**
     * Stocker une valeur
     * 
     * @param {string} key - Clé
     * @param {any} value - Valeur
     * @param {Object} options - Options
     */
    set(key, value, options = {}) {
        try {
            const ttl = Math.min(options.ttl || CONFIG.DEFAULT_TTL, CONFIG.MAX_TTL);
            const expires = Date.now() + ttl;
            
            // Préparer les données
            const data = {
                value: value,
                expires: expires,
                created: Date.now(),
                compressed: false
            };
            
            // Essayer la compression si activée et données grandes
            let serialized = JSON.stringify(data);
            
            if (CONFIG.ENABLE_COMPRESSION && serialized.length > 1024) {
                const compressed = this.compress(serialized);
                if (compressed.length < serialized.length) {
                    data.value = compressed;
                    data.compressed = true;
                    serialized = JSON.stringify(data);
                }
            }
            
            // Vérifier la taille
            if (serialized.length > CONFIG.MAX_ENTRY_SIZE) {
                throw new Error(`Entrée trop grande: ${serialized.length} octets`);
            }
            
            // Stocker
            localStorage.setItem(this.prefix + key, serialized);
            
            if (CONFIG.DEBUG) {
                console.log(`💾 LocalStorage.set: ${key} (TTL: ${ttl}ms, Size: ${serialized.length})`);
            }
            
        } catch (error) {
            // Gérer quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ LocalStorage plein, nettoyage...');
                this.cleanup();
                // Réessayer une fois
                try {
                    localStorage.setItem(this.prefix + key, JSON.stringify({
                        value: value,
                        expires: Date.now() + (options.ttl || CONFIG.DEFAULT_TTL),
                        created: Date.now()
                    }));
                } catch {
                    console.error('❌ Impossible de stocker dans localStorage');
                }
            } else {
                console.error('❌ Erreur LocalStorage.set:', error);
            }
        }
    }
    
    /**
     * Récupérer une valeur
     * 
     * @param {string} key - Clé
     * @returns {any|null} Valeur ou null
     */
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            
            if (!item) {
                this.misses++;
                return null;
            }
            
            const data = JSON.parse(item);
            
            // Vérifier expiration
            if (Date.now() > data.expires) {
                this.delete(key);
                this.misses++;
                return null;
            }
            
            this.hits++;
            
            // Décompresser si nécessaire
            if (data.compressed) {
                return JSON.parse(this.decompress(data.value));
            }
            
            return data.value;
            
        } catch (error) {
            console.error('❌ Erreur LocalStorage.get:', error);
            this.misses++;
            return null;
        }
    }
    
    /**
     * Vérifier si une clé existe
     * 
     * @param {string} key - Clé
     * @returns {boolean} true si existe et valide
     */
    has(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return false;
            
            const data = JSON.parse(item);
            
            if (Date.now() > data.expires) {
                this.delete(key);
                return false;
            }
            
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Supprimer une entrée
     * 
     * @param {string} key - Clé
     */
    delete(key) {
        localStorage.removeItem(this.prefix + key);
        
        if (CONFIG.DEBUG) {
            console.log(`🗑️ LocalStorage.delete: ${key}`);
        }
    }
    
    /**
     * Nettoyer tout ou par pattern
     * 
     * @param {string|RegExp} [pattern] - Pattern
     */
    clear(pattern) {
        const keysToDelete = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key?.startsWith(this.prefix)) {
                const actualKey = key.substring(this.prefix.length);
                
                if (!pattern) {
                    keysToDelete.push(key);
                } else {
                    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
                    if (regex.test(actualKey)) {
                        keysToDelete.push(key);
                    }
                }
            }
        }
        
        keysToDelete.forEach(key => localStorage.removeItem(key));
        
        if (!pattern) {
            this.hits = 0;
            this.misses = 0;
        }
    }
    
    /**
     * Nettoyer les entrées expirées
     * 
     * @returns {number} Nombre d'entrées supprimées
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        const keysToDelete = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key?.startsWith(this.prefix)) {
                try {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const data = JSON.parse(item);
                        if (now > data.expires) {
                            keysToDelete.push(key);
                            cleaned++;
                        }
                    }
                } catch {
                    // Supprimer les entrées corrompues
                    keysToDelete.push(key);
                    cleaned++;
                }
            }
        }
        
        keysToDelete.forEach(key => localStorage.removeItem(key));
        
        if (CONFIG.DEBUG && cleaned > 0) {
            console.log(`🧹 LocalStorage.cleanup: ${cleaned} entrées supprimées`);
        }
        
        return cleaned;
    }
    
    /**
     * Obtenir les statistiques
     * 
     * @returns {Object} Stats
     */
    getStats() {
        let entries = 0;
        let totalSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                entries++;
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += item.length * 2; // UTF-16
                }
            }
        }
        
        return {
            type: 'localStorage',
            entries: entries,
            hits: this.hits,
            misses: this.misses,
            hitRate: this.hits / (this.hits + this.misses) || 0,
            totalSize: totalSize,
            formattedSize: this.formatSize(totalSize),
            usage: `${((totalSize / CONFIG.MAX_STORAGE_SIZE) * 100).toFixed(2)}%`
        };
    }
    
    /**
     * Compression simple (Base64 + compression native si disponible)
     * 
     * @private
     * @param {string} str - String à compresser
     * @returns {string} String compressée
     */
    compress(str) {
        // Compression basique avec btoa
        // Pour une vraie compression, utiliser une lib comme lz-string
        try {
            return btoa(encodeURIComponent(str));
        } catch {
            return str;
        }
    }
    
    /**
     * Décompression
     * 
     * @private
     * @param {string} str - String compressée
     * @returns {string} String décompressée
     */
    decompress(str) {
        try {
            return decodeURIComponent(atob(str));
        } catch {
            return str;
        }
    }
    
    /**
     * Formater une taille
     * 
     * @private
     */
    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

// ========================================
// 4. CLASSE CACHE SESSIONSTORAGE
// ========================================

/**
 * Cache de session (perdu à la fermeture du navigateur)
 */
class SessionStorageCache extends LocalStorageCache {
    constructor() {
        super();
        this.prefix = CONFIG.KEY_PREFIX + 'session_';
    }
    
    /**
     * Override : utiliser sessionStorage au lieu de localStorage
     */
    set(key, value, options = {}) {
        try {
            const ttl = options.ttl || CONFIG.DEFAULT_TTL;
            const expires = Date.now() + ttl;
            
            const data = {
                value: value,
                expires: expires,
                created: Date.now()
            };
            
            sessionStorage.setItem(this.prefix + key, JSON.stringify(data));
            
            if (CONFIG.DEBUG) {
                console.log(`💾 SessionStorage.set: ${key}`);
            }
            
        } catch (error) {
            console.error('❌ Erreur SessionStorage.set:', error);
        }
    }
    
    /**
     * Override : utiliser sessionStorage
     */
    get(key) {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            
            if (!item) {
                this.misses++;
                return null;
            }
            
            const data = JSON.parse(item);
            
            if (Date.now() > data.expires) {
                this.delete(key);
                this.misses++;
                return null;
            }
            
            this.hits++;
            return data.value;
            
        } catch (error) {
            console.error('❌ Erreur SessionStorage.get:', error);
            this.misses++;
            return null;
        }
    }
    
    /**
     * Override : utiliser sessionStorage
     */
    delete(key) {
        sessionStorage.removeItem(this.prefix + key);
    }
    
    /**
     * Override : nettoyer sessionStorage
     */
    clear(pattern) {
        const keysToDelete = [];
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            
            if (key?.startsWith(this.prefix)) {
                const actualKey = key.substring(this.prefix.length);
                
                if (!pattern) {
                    keysToDelete.push(key);
                } else {
                    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
                    if (regex.test(actualKey)) {
                        keysToDelete.push(key);
                    }
                }
            }
        }
        
        keysToDelete.forEach(key => sessionStorage.removeItem(key));
    }
    
    /**
     * Override : nettoyer les expirés dans sessionStorage
     */
    cleanup() {
        let cleaned = 0;
        const now = Date.now();
        const keysToDelete = [];
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            
            if (key?.startsWith(this.prefix)) {
                try {
                    const item = sessionStorage.getItem(key);
                    if (item) {
                        const data = JSON.parse(item);
                        if (now > data.expires) {
                            keysToDelete.push(key);
                            cleaned++;
                        }
                    }
                } catch {
                    keysToDelete.push(key);
                    cleaned++;
                }
            }
        }
        
        keysToDelete.forEach(key => sessionStorage.removeItem(key));
        
        return cleaned;
    }
}

// ========================================
// 5. CLASSE CACHE UNIFIÉ
// ========================================

/**
 * Cache unifié qui combine tous les niveaux
 */
class UnifiedCache {
    constructor() {
        this.memory = new MemoryCache();
        this.local = new LocalStorageCache();
        this.session = new SessionStorageCache();
        
        // Stats globales
        this.requests = 0;
        this.cacheHits = 0;
        
        console.log('🚀 Cache unifié initialisé');
    }
    
    /**
     * Récupérer une valeur avec fetcher optionnel
     * 
     * @param {string} key - Clé
     * @param {Function} [fetcher] - Fonction pour charger si absent
     * @param {Object} [options] - Options
     * @returns {Promise<any>} Valeur
     * 
     * @example
     * // Avec fetcher automatique
     * const data = await cache.get('users', () => fetchUsers(), { ttl: 3600000 });
     * 
     * // Sans fetcher
     * const data = cache.get('users');
     */
    async get(key, fetcher, options = {}) {
        this.requests++;
        
        const level = options.level || CONFIG.DEFAULT_LEVEL;
        const strategy = options.strategy || CACHE_STRATEGIES.CACHE_FIRST;
        
        // Si pas de fetcher, recherche simple
        if (!fetcher) {
            return this.getFromCache(key, level);
        }
        
        // Appliquer la stratégie
        switch (strategy) {
            case CACHE_STRATEGIES.CACHE_FIRST:
                return await this.cacheFirst(key, fetcher, options);
                
            case CACHE_STRATEGIES.NETWORK_FIRST:
                return await this.networkFirst(key, fetcher, options);
                
            case CACHE_STRATEGIES.CACHE_ONLY:
                return this.getFromCache(key, level);
                
            case CACHE_STRATEGIES.NETWORK_ONLY:
                const data = await fetcher();
                this.setInCache(key, data, level, options);
                return data;
                
            case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
                return await this.staleWhileRevalidate(key, fetcher, options);
                
            default:
                return await this.cacheFirst(key, fetcher, options);
        }
    }
    
    /**
     * Stocker une valeur
     * 
     * @param {string} key - Clé
     * @param {any} value - Valeur
     * @param {Object} [options] - Options
     */
    set(key, value, options = {}) {
        const level = options.level || CONFIG.DEFAULT_LEVEL;
        this.setInCache(key, value, level, options);
    }
    
    /**
     * Vérifier si une clé existe
     * 
     * @param {string} key - Clé
     * @param {string} [level] - Niveau de cache
     * @returns {boolean} true si existe
     */
    has(key, level = CONFIG.DEFAULT_LEVEL) {
        switch (level) {
            case CACHE_LEVELS.MEMORY:
                return this.memory.has(key);
            case CACHE_LEVELS.LOCAL:
                return this.local.has(key);
            case CACHE_LEVELS.SESSION:
                return this.session.has(key);
            case CACHE_LEVELS.ALL:
                return this.memory.has(key) || this.local.has(key) || this.session.has(key);
            default:
                return this.memory.has(key);
        }
    }
    
    /**
     * Invalider une entrée
     * 
     * @param {string} key - Clé
     * @param {string} [level] - Niveau
     */
    invalidate(key, level = CACHE_LEVELS.ALL) {
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.MEMORY) {
            this.memory.delete(key);
        }
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.LOCAL) {
            this.local.delete(key);
        }
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.SESSION) {
            this.session.delete(key);
        }
        
        console.log(`♻️ Cache invalidé: ${key} (${level})`);
    }
    
    /**
     * Nettoyer le cache
     * 
     * @param {string|RegExp} [pattern] - Pattern de clés
     * @param {string} [level] - Niveau
     */
    clear(pattern, level = CACHE_LEVELS.ALL) {
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.MEMORY) {
            this.memory.clear(pattern);
        }
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.LOCAL) {
            this.local.clear(pattern);
        }
        if (level === CACHE_LEVELS.ALL || level === CACHE_LEVELS.SESSION) {
            this.session.clear(pattern);
        }
        
        console.log(`🧹 Cache nettoyé${pattern ? ` (pattern: ${pattern})` : ''}`);
    }
    
    /**
     * Nettoyer les entrées expirées
     * 
     * @returns {Object} Résultat du nettoyage
     */
    cleanup() {
        const result = {
            memory: this.memory.cleanup(),
            local: this.local.cleanup(),
            session: this.session.cleanup(),
            total: 0
        };
        
        result.total = result.memory + result.local + result.session;
        
        if (result.total > 0) {
            console.log(`🧹 Nettoyage: ${result.total} entrées supprimées`);
        }
        
        return result;
    }
    
    /**
     * Précharger des données
     * 
     * @param {Array<{key: string, fetcher: Function, options: Object}>} items
     * @returns {Promise<void>}
     * 
     * @example
     * await cache.preload([
     *     { key: 'users', fetcher: fetchUsers, options: { ttl: 3600000 }},
     *     { key: 'config', fetcher: fetchConfig, options: { level: 'local' }}
     * ]);
     */
    async preload(items) {
        console.log(`⏳ Préchargement de ${items.length} éléments...`);
        
        const promises = items.map(item => 
            this.get(item.key, item.fetcher, item.options)
        );
        
        await Promise.all(promises);
        
        console.log(`✅ Préchargement terminé`);
    }
    
    /**
     * Obtenir les statistiques
     * 
     * @returns {Object} Statistiques complètes
     */
    getStats() {
        const memoryStats = this.memory.getStats();
        const localStats = this.local.getStats();
        const sessionStats = this.session.getStats();
        
        return {
            global: {
                requests: this.requests,
                hits: this.cacheHits,
                hitRate: this.cacheHits / this.requests || 0
            },
            memory: memoryStats,
            localStorage: localStats,
            sessionStorage: sessionStats,
            summary: {
                totalEntries: memoryStats.entries + localStats.entries + sessionStats.entries,
                totalSize: memoryStats.totalSize + localStats.totalSize,
                formattedSize: this.formatSize(memoryStats.totalSize + localStats.totalSize)
            }
        };
    }
    
    // ========================================
    // 6. STRATÉGIES DE CACHE
    // ========================================
    
    /**
     * Stratégie Cache First
     * Cache d'abord, réseau si manquant
     * 
     * @private
     */
    async cacheFirst(key, fetcher, options) {
        // Chercher dans le cache
        const cached = this.getFromCache(key, options.level || CONFIG.DEFAULT_LEVEL);
        
        if (cached !== null) {
            this.cacheHits++;
            if (CONFIG.DEBUG) {
                console.log(`✅ Cache hit: ${key}`);
            }
            return cached;
        }
        
        // Charger depuis le réseau
        if (CONFIG.DEBUG) {
            console.log(`⚠️ Cache miss: ${key}, chargement...`);
        }
        
        try {
            const data = await fetcher();
            this.setInCache(key, data, options.level || CONFIG.DEFAULT_LEVEL, options);
            return data;
        } catch (error) {
            console.error(`❌ Erreur fetcher pour ${key}:`, error);
            throw error;
        }
    }
    
    /**
     * Stratégie Network First
     * Réseau d'abord, cache si échec
     * 
     * @private
     */
    async networkFirst(key, fetcher, options) {
        try {
            // Essayer le réseau
            const data = await fetcher();
            this.setInCache(key, data, options.level || CONFIG.DEFAULT_LEVEL, options);
            return data;
        } catch (error) {
            // Fallback sur le cache
            console.warn(`⚠️ Réseau échoué pour ${key}, utilisation du cache`);
            const cached = this.getFromCache(key, options.level || CONFIG.DEFAULT_LEVEL);
            
            if (cached !== null) {
                this.cacheHits++;
                return cached;
            }
            
            throw error;
        }
    }
    
    /**
     * Stratégie Stale While Revalidate
     * Retourne le cache immédiatement et met à jour en arrière-plan
     * 
     * @private
     */
    async staleWhileRevalidate(key, fetcher, options) {
        const cached = this.getFromCache(key, options.level || CONFIG.DEFAULT_LEVEL);
        
        // Si on a du cache, le retourner immédiatement
        if (cached !== null) {
            this.cacheHits++;
            
            // Mettre à jour en arrière-plan
            fetcher().then(data => {
                this.setInCache(key, data, options.level || CONFIG.DEFAULT_LEVEL, options);
                if (CONFIG.DEBUG) {
                    console.log(`♻️ Cache mis à jour en arrière-plan: ${key}`);
                }
            }).catch(error => {
                console.error(`❌ Erreur MAJ arrière-plan ${key}:`, error);
            });
            
            return cached;
        }
        
        // Pas de cache, charger normalement
        const data = await fetcher();
        this.setInCache(key, data, options.level || CONFIG.DEFAULT_LEVEL, options);
        return data;
    }
    
    // ========================================
    // 7. UTILITAIRES
    // ========================================
    
    /**
     * Récupérer depuis le bon niveau de cache
     * 
     * @private
     */
    getFromCache(key, level) {
        switch (level) {
            case CACHE_LEVELS.MEMORY:
                return this.memory.get(key);
                
            case CACHE_LEVELS.LOCAL:
                return this.local.get(key);
                
            case CACHE_LEVELS.SESSION:
                return this.session.get(key);
                
            case CACHE_LEVELS.ALL:
                // Chercher dans l'ordre : memory > session > local
                let value = this.memory.get(key);
                if (value !== null) return value;
                
                value = this.session.get(key);
                if (value !== null) return value;
                
                return this.local.get(key);
                
            default:
                return this.memory.get(key);
        }
    }
    
    /**
     * Stocker dans le bon niveau de cache
     * 
     * @private
     */
    setInCache(key, value, level, options) {
        switch (level) {
            case CACHE_LEVELS.MEMORY:
                this.memory.set(key, value, options);
                break;
                
            case CACHE_LEVELS.LOCAL:
                this.local.set(key, value, options);
                break;
                
            case CACHE_LEVELS.SESSION:
                this.session.set(key, value, options);
                break;
                
            case CACHE_LEVELS.ALL:
                // Stocker dans tous les niveaux
                this.memory.set(key, value, options);
                this.session.set(key, value, options);
                this.local.set(key, value, options);
                break;
                
            default:
                this.memory.set(key, value, options);
        }
    }
    
    /**
     * Formater une taille
     * 
     * @private
     */
    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

// ========================================
// 8. GESTIONNAIRE DE CACHE GLOBAL
// ========================================

/**
 * Instance singleton du cache
 * @type {UnifiedCache}
 */
let cacheInstance = null;

/**
 * Obtenir l'instance du cache
 * 
 * @returns {UnifiedCache} Instance du cache
 */
function getCacheInstance() {
    if (!cacheInstance) {
        cacheInstance = new UnifiedCache();
    }
    return cacheInstance;
}

// ========================================
// 9. HELPERS
// ========================================

/**
 * Helper pour créer une clé de cache avec namespace
 * 
 * @param {string} namespace - Namespace
 * @param {...any} parts - Parties de la clé
 * @returns {string} Clé formatée
 * 
 * @example
 * createCacheKey('users', 'list', 'page', 1)  // 'users:list:page:1'
 */
export function createCacheKey(namespace, ...parts) {
    return [namespace, ...parts].filter(Boolean).join(':');
}

/**
 * Helper pour créer un TTL basé sur l'heure
 * 
 * @param {number} hours - Heures
 * @param {number} [minutes=0] - Minutes
 * @returns {number} TTL en millisecondes
 * 
 * @example
 * createTTL(1, 30)  // 5400000 (1h30 en ms)
 */
export function createTTL(hours, minutes = 0) {
    return (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Décorateur pour mettre en cache une fonction
 * 
 * @param {Function} fn - Fonction à décorer
 * @param {Object} options - Options de cache
 * @returns {Function} Fonction décorée
 * 
 * @example
 * const fetchUsersCached = withCache(fetchUsers, { 
 *     ttl: 3600000, 
 *     keyGenerator: (args) => `users:${args[0]}` 
 * });
 */
export function withCache(fn, options = {}) {
    const cache = getCacheInstance();
    
    return async function(...args) {
        const key = options.keyGenerator 
            ? options.keyGenerator(args)
            : `fn:${fn.name}:${JSON.stringify(args)}`;
        
        return cache.get(key, () => fn(...args), options);
    };
}

// ========================================
// 10. EXPORT
// ========================================

/**
 * Export de l'instance singleton et des helpers
 */
const cache = getCacheInstance();

export default {
    // Méthodes principales
    get: cache.get.bind(cache),
    set: cache.set.bind(cache),
    has: cache.has.bind(cache),
    invalidate: cache.invalidate.bind(cache),
    clear: cache.clear.bind(cache),
    cleanup: cache.cleanup.bind(cache),
    preload: cache.preload.bind(cache),
    getStats: cache.getStats.bind(cache),
    
    // Helpers
    createCacheKey,
    createTTL,
    withCache,
    
    // Constantes exportées
    STRATEGIES: CACHE_STRATEGIES,
    LEVELS: CACHE_LEVELS,
    CONFIG
};

// Auto-cleanup au démarrage
cache.cleanup();

/* ========================================
   FIN DU FICHIER
   ======================================== */