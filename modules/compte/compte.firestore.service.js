// ========================================
// COMPTE.FIRESTORE.SERVICE.JS - 🗄️ SERVICE FIRESTORE
// Chemin: modules/compte/compte.firestore.service.js
//
// DESCRIPTION:
// Service de gestion des données Firestore pour le module compte
// Gère les utilisateurs, groupes et magasins
// Implémente un cache intelligent avec TTL
//
// FONCTIONNALITÉS:
// - CRUD Utilisateur avec cache
// - Gestion des groupes
// - Gestion des magasins
// - Mise à jour du PIN
// - Historique et statistiques
// - Cache avec expiration (TTL 5 minutes)
//
// VERSION: 2.0.0
// DATE: 09/01/2025
// ========================================

import { db } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    // Collections Firestore
    collections: {
        utilisateurs: 'utilisateurs',
        groupes: 'groupes',
        magasins: 'magasins'
    },
    
    // Configuration du cache
    cache: {
        timeout: 5 * 60 * 1000,  // 5 minutes en millisecondes
        maxSize: 100,            // Nombre max d'entrées en cache
        enabled: true             // Activer/désactiver le cache
    },
    
    // Configuration des requêtes
    query: {
        batchSize: 10,           // Taille des batch pour requêtes multiples
        maxRetries: 3,           // Nombre max de tentatives
        retryDelay: 1000         // Délai entre tentatives (ms)
    }
};

// ========================================
// CLASSE SERVICE FIRESTORE
// ========================================

class CompteFirestoreService {
    constructor() {
        console.log('🗄️ Initialisation du service Firestore Compte');
        
        // ========================================
        // SYSTÈME DE CACHE
        // ========================================
        
        this.cache = new Map();           // Map pour stocker les données
        this.cacheTimestamps = new Map(); // Map pour stocker les timestamps
        this.cacheTimeout = CONFIG.cache.timeout;
        this.cacheEnabled = CONFIG.cache.enabled;
        
        // ========================================
        // STATISTIQUES
        // ========================================
        
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            firestoreReads: 0,
            firestoreWrites: 0,
            errors: 0
        };
        
        console.log('✅ Service Firestore initialisé avec cache de', this.cacheTimeout / 1000, 'secondes');
    }
    
    // ========================================
    // GESTION DU CACHE
    // ========================================
    
    /**
     * Récupérer une donnée du cache
     * @param {string} key - Clé de cache
     * @returns {any|null} Donnée ou null si expirée/absente
     */
    getCached(key) {
        if (!this.cacheEnabled) return null;
        
        const timestamp = this.cacheTimestamps.get(key);
        if (!timestamp) {
            this.stats.cacheMisses++;
            console.log(`📊 Cache MISS pour: ${key}`);
            return null;
        }
        
        // Vérifier l'expiration
        const age = Date.now() - timestamp;
        if (age > this.cacheTimeout) {
            console.log(`⏰ Cache expiré pour: ${key} (âge: ${age / 1000}s)`);
            this.cache.delete(key);
            this.cacheTimestamps.delete(key);
            this.stats.cacheMisses++;
            return null;
        }
        
        this.stats.cacheHits++;
        console.log(`✅ Cache HIT pour: ${key} (âge: ${age / 1000}s)`);
        return this.cache.get(key);
    }
    
    /**
     * Stocker une donnée en cache
     * @param {string} key - Clé de cache
     * @param {any} value - Donnée à stocker
     */
    setCached(key, value) {
        if (!this.cacheEnabled) return;
        
        // Vérifier la taille du cache
        if (this.cache.size >= CONFIG.cache.maxSize) {
            // Supprimer les entrées les plus anciennes
            this.cleanCache();
        }
        
        this.cache.set(key, value);
        this.cacheTimestamps.set(key, Date.now());
        console.log(`💾 Mis en cache: ${key}`);
    }
    
    /**
     * Nettoyer le cache (supprimer les entrées expirées)
     */
    cleanCache() {
        console.log('🧹 Nettoyage du cache...');
        
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, timestamp] of this.cacheTimestamps.entries()) {
            if (now - timestamp > this.cacheTimeout) {
                this.cache.delete(key);
                this.cacheTimestamps.delete(key);
                cleaned++;
            }
        }
        
        console.log(`✅ ${cleaned} entrées supprimées du cache`);
    }
    
    /**
     * Vider le cache complètement ou par pattern
     * @param {string|null} pattern - Pattern de clé (optionnel)
     */
    clearCache(pattern = null) {
        if (!pattern) {
            // Vider tout le cache
            const size = this.cache.size;
            this.cache.clear();
            this.cacheTimestamps.clear();
            console.log(`🗑️ Cache vidé complètement (${size} entrées)`);
        } else {
            // Vider par pattern
            let cleared = 0;
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                    this.cacheTimestamps.delete(key);
                    cleared++;
                }
            }
            console.log(`🗑️ ${cleared} entrées supprimées pour pattern: ${pattern}`);
        }
    }
    
    /**
     * Afficher les statistiques du cache
     */
    showCacheStats() {
        const hitRate = this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100;
        
        console.log('📊 === STATISTIQUES CACHE ===');
        console.log(`- Taille actuelle: ${this.cache.size} entrées`);
        console.log(`- Cache hits: ${this.stats.cacheHits}`);
        console.log(`- Cache misses: ${this.stats.cacheMisses}`);
        console.log(`- Taux de hit: ${hitRate.toFixed(2)}%`);
        console.log(`- Lectures Firestore: ${this.stats.firestoreReads}`);
        console.log(`- Écritures Firestore: ${this.stats.firestoreWrites}`);
        console.log(`- Erreurs: ${this.stats.errors}`);
    }
    
    // ========================================
    // CRUD UTILISATEUR
    // ========================================
    
    /**
     * Récupérer un utilisateur par ID
     * @param {string} userId - ID de l'utilisateur
     * @returns {Object|null} Utilisateur ou null
     */
    async getUser(userId) {
        try {
            console.log(`👤 Récupération utilisateur: ${userId}`);
            
            // ----------------------------------------
            // CHECK CACHE
            // ----------------------------------------
            const cacheKey = `user_${userId}`;
            const cached = this.getCached(cacheKey);
            if (cached) {
                return cached;
            }
            
            // ----------------------------------------
            // REQUÊTE FIRESTORE
            // ----------------------------------------
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            this.stats.firestoreReads++;
            const userDoc = await getDoc(doc(db, CONFIG.collections.utilisateurs, userId));
            
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() };
                
                // Mettre en cache
                this.setCached(cacheKey, userData);
                
                console.log('✅ Utilisateur trouvé:', userData.nom);
                return userData;
            }
            
            console.warn('⚠️ Utilisateur non trouvé:', userId);
            return null;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur récupération utilisateur:', error);
            return null;
        }
    }
    
    /**
     * Mettre à jour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} updates - Champs à mettre à jour
     * @returns {boolean} Succès
     */
    async updateUser(userId, updates) {
        try {
            console.log(`📝 Mise à jour utilisateur: ${userId}`);
            console.log('  Updates:', Object.keys(updates));
            
            const { doc, updateDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Ajouter la date de modification
            updates['dates.derniereModification'] = serverTimestamp();
            
            // Mise à jour Firestore
            this.stats.firestoreWrites++;
            await updateDoc(doc(db, CONFIG.collections.utilisateurs, userId), updates);
            
            // Invalider le cache
            this.clearCache(`user_${userId}`);
            
            console.log('✅ Utilisateur mis à jour');
            return true;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur mise à jour utilisateur:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour le code PIN d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} hashPin - Hash SHA-256 du nouveau PIN
     * @returns {boolean} Succès
     */
    async updateUserPin(userId, hashPin) {
        try {
            console.log(`🔐 Mise à jour PIN utilisateur: ${userId}`);
            
            const { doc, updateDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Mise à jour spécifique du PIN
            const updates = {
                codeHash: hashPin,
                'dates.dernierChangementPin': serverTimestamp(),
                'dates.derniereModification': serverTimestamp()
            };
            
            this.stats.firestoreWrites++;
            await updateDoc(doc(db, CONFIG.collections.utilisateurs, userId), updates);
            
            // Invalider le cache utilisateur
            this.clearCache(`user_${userId}`);
            
            // Log l'action dans l'historique
            await this.logAction(userId, 'modification_pin', 'Code PIN modifié');
            
            console.log('✅ PIN mis à jour avec succès');
            return true;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur mise à jour PIN:', error);
            throw error;
        }
    }
    
    // ========================================
    // GESTION DES GROUPES
    // ========================================
    
    /**
     * Récupérer plusieurs groupes par IDs
     * @param {Array<string>} groupeIds - IDs des groupes
     * @returns {Array<Object>} Groupes trouvés
     */
    async getGroupes(groupeIds) {
        if (!groupeIds || groupeIds.length === 0) {
            console.log('ℹ️ Aucun groupe à récupérer');
            return [];
        }
        
        try {
            console.log(`👥 Récupération de ${groupeIds.length} groupe(s)...`);
            
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const groupes = [];
            
            // ----------------------------------------
            // RÉCUPÉRATION AVEC CACHE
            // ----------------------------------------
            for (const groupeId of groupeIds) {
                const cacheKey = `groupe_${groupeId}`;
                const cached = this.getCached(cacheKey);
                
                if (cached) {
                    groupes.push(cached);
                } else {
                    // Requête Firestore
                    this.stats.firestoreReads++;
                    const groupeDoc = await getDoc(doc(db, CONFIG.collections.groupes, groupeId));
                    
                    if (groupeDoc.exists()) {
                        const groupeData = { id: groupeDoc.id, ...groupeDoc.data() };
                        
                        // Mettre en cache
                        this.setCached(cacheKey, groupeData);
                        
                        groupes.push(groupeData);
                        console.log(`  ✅ Groupe trouvé: ${groupeData.nom}`);
                    } else {
                        console.warn(`  ⚠️ Groupe non trouvé: ${groupeId}`);
                    }
                }
            }
            
            console.log(`✅ ${groupes.length}/${groupeIds.length} groupes récupérés`);
            return groupes;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur récupération groupes:', error);
            return [];
        }
    }
    
    /**
     * Récupérer tous les groupes actifs
     * @returns {Array<Object>} Tous les groupes
     */
    async getAllGroupes() {
        try {
            console.log('👥 Récupération de tous les groupes...');
            
            // ----------------------------------------
            // CHECK CACHE GLOBAL
            // ----------------------------------------
            const cacheKey = 'all_groupes';
            const cached = this.getCached(cacheKey);
            if (cached) {
                return cached;
            }
            
            // ----------------------------------------
            // REQUÊTE FIRESTORE
            // ----------------------------------------
            const { collection, query, where, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Requête avec filtre actif
            const q = query(
                collection(db, CONFIG.collections.groupes),
                where('metadata.actif', '==', true)
            );
            
            this.stats.firestoreReads++;
            const snapshot = await getDocs(q);
            
            const groupes = [];
            snapshot.forEach(doc => {
                groupes.push({ id: doc.id, ...doc.data() });
            });
            
            // Mettre en cache
            this.setCached(cacheKey, groupes);
            
            console.log(`✅ ${groupes.length} groupes récupérés`);
            return groupes;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur récupération tous les groupes:', error);
            return [];
        }
    }
    
    // ========================================
    // GESTION DES MAGASINS
    // ========================================
    
    /**
     * Récupérer les informations de plusieurs magasins
     * @param {Array<string>} codes - Codes des magasins
     * @returns {Array<Object>} Magasins trouvés
     */
    async getMagasinsInfo(codes) {
        if (!codes || codes.length === 0) {
            console.log('ℹ️ Aucun magasin à récupérer');
            return [];
        }
        
        try {
            console.log(`🏪 Récupération de ${codes.length} magasin(s)...`);
            
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const magasins = [];
            
            // ----------------------------------------
            // RÉCUPÉRATION PAR BATCH AVEC CACHE
            // ----------------------------------------
            for (const code of codes) {
                const cacheKey = `magasin_${code}`;
                const cached = this.getCached(cacheKey);
                
                if (cached) {
                    magasins.push(cached);
                } else {
                    try {
                        // Requête Firestore
                        this.stats.firestoreReads++;
                        const magasinDoc = await getDoc(doc(db, CONFIG.collections.magasins, code));
                        
                        if (magasinDoc.exists()) {
                            const magasinData = { 
                                code: magasinDoc.id, 
                                ...magasinDoc.data() 
                            };
                            
                            // Mettre en cache
                            this.setCached(cacheKey, magasinData);
                            
                            magasins.push(magasinData);
                            console.log(`  ✅ Magasin trouvé: ${code} - ${magasinData.nom}`);
                        } else {
                            // Si le magasin n'existe pas, créer une entrée minimale
                            console.warn(`  ⚠️ Magasin non trouvé en BDD: ${code}`);
                            const magasinMinimal = {
                                code: code,
                                nom: code,
                                societe: {},
                                metadata: { actif: true }
                            };
                            magasins.push(magasinMinimal);
                        }
                    } catch (error) {
                        console.error(`  ❌ Erreur pour magasin ${code}:`, error);
                        // Continuer avec les autres magasins
                    }
                }
            }
            
            console.log(`✅ ${magasins.length}/${codes.length} magasins récupérés`);
            return magasins;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur récupération magasins:', error);
            return [];
        }
    }
    
    /**
     * Récupérer tous les magasins actifs
     * @returns {Array<Object>} Tous les magasins
     */
    async getAllMagasins() {
        try {
            console.log('🏪 Récupération de tous les magasins...');
            
            // ----------------------------------------
            // CHECK CACHE GLOBAL
            // ----------------------------------------
            const cacheKey = 'all_magasins';
            const cached = this.getCached(cacheKey);
            if (cached) {
                return cached;
            }
            
            // ----------------------------------------
            // REQUÊTE FIRESTORE
            // ----------------------------------------
            const { collection, query, where, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Requête avec filtre actif
            const q = query(
                collection(db, CONFIG.collections.magasins),
                where('metadata.actif', '==', true)
            );
            
            this.stats.firestoreReads++;
            const snapshot = await getDocs(q);
            
            const magasins = [];
            snapshot.forEach(doc => {
                magasins.push({ 
                    code: doc.id, 
                    ...doc.data() 
                });
            });
            
            // Mettre en cache
            this.setCached(cacheKey, magasins);
            
            console.log(`✅ ${magasins.length} magasins récupérés`);
            return magasins;
            
        } catch (error) {
            this.stats.errors++;
            console.error('❌ Erreur récupération tous les magasins:', error);
            return [];
        }
    }
    
    // ========================================
    // HISTORIQUE ET LOGS
    // ========================================
    
    /**
     * Enregistrer une action dans l'historique utilisateur
     * @param {string} userId - ID utilisateur
     * @param {string} action - Type d'action
     * @param {string} details - Détails de l'action
     * @param {Object} metadata - Métadonnées additionnelles
     */
    async logAction(userId, action, details = '', metadata = {}) {
        try {
            console.log(`📝 Log action: ${action} pour utilisateur ${userId}`);
            
            const { doc, updateDoc, arrayUnion, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Créer l'entrée historique
            const entry = {
                date: serverTimestamp(),
                action: action,
                details: details,
                timestamp: Date.now(),
                ...metadata
            };
            
            // Ajouter à l'historique (append)
            this.stats.firestoreWrites++;
            await updateDoc(doc(db, CONFIG.collections.utilisateurs, userId), {
                historique: arrayUnion(entry)
            });
            
            console.log('✅ Action enregistrée dans l\'historique');
            
        } catch (error) {
            // Ne pas faire échouer l'opération principale si le log échoue
            console.error('⚠️ Erreur log action (non bloquant):', error);
        }
    }
    
    // ========================================
    // STATISTIQUES UTILISATEUR
    // ========================================
    
    /**
     * Mettre à jour les statistiques d'un utilisateur
     * @param {string} userId - ID utilisateur
     * @param {Object} stats - Statistiques à mettre à jour
     */
    async updateUserStats(userId, stats) {
        try {
            console.log(`📊 Mise à jour stats utilisateur: ${userId}`);
            
            const { doc, updateDoc, serverTimestamp, increment } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const updates = {};
            
            // ----------------------------------------
            // CONSTRUCTION DES UPDATES
            // ----------------------------------------
            
            // Dernière connexion
            if (stats.connexion) {
                updates['dates.derniereConnexion'] = serverTimestamp();
                updates['stats.nombreConnexions'] = increment(1);
            }
            
            // Actions effectuées
            if (stats.action) {
                updates[`stats.actionsEffectuees.${stats.action}`] = increment(1);
            }
            
            // Temps de session
            if (stats.tempsSession) {
                updates['stats.tempsTotal'] = increment(stats.tempsSession);
            }
            
            // ----------------------------------------
            // APPLICATION DES UPDATES
            // ----------------------------------------
            
            if (Object.keys(updates).length > 0) {
                this.stats.firestoreWrites++;
                await updateDoc(doc(db, CONFIG.collections.utilisateurs, userId), updates);
                console.log('✅ Statistiques mises à jour');
            }
            
        } catch (error) {
            // Ne pas faire échouer l'opération principale
            console.error('⚠️ Erreur mise à jour stats (non bloquant):', error);
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Vérifier la connexion à Firestore
     * @returns {boolean} Connexion OK
     */
    async checkConnection() {
        try {
            console.log('🔍 Test de connexion Firestore...');
            
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Tester avec une collection système
            await getDoc(doc(db, '_test_', 'ping'));
            
            console.log('✅ Connexion Firestore OK');
            return true;
            
        } catch (error) {
            console.error('❌ Connexion Firestore KO:', error);
            return false;
        }
    }
    
    /**
     * Obtenir les métriques du service
     * @returns {Object} Métriques
     */
    getMetrics() {
        return {
            cache: {
                size: this.cache.size,
                timeout: this.cacheTimeout,
                enabled: this.cacheEnabled
            },
            stats: { ...this.stats },
            performance: {
                hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100,
                errorRate: this.stats.errors / this.stats.firestoreReads * 100
            }
        };
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new CompteFirestoreService();

// Export par défaut
export default service;

// Export nommé pour tests
export { CompteFirestoreService, CONFIG };

/* ========================================
   HISTORIQUE
   
   [09/01/2025] - v2.0.0
   - Service Firestore complet avec cache
   - Gestion utilisateurs, groupes, magasins
   - Cache intelligent avec TTL
   - Statistiques et métriques
   - Gestion des erreurs robuste
   ======================================== */