/* ========================================
   UI-MANAGER.JS - Gestionnaire central du système UI
   Chemin: src/js/shared/ui/core/ui-manager.js
   
   DESCRIPTION:
   Gestionnaire central qui orchestre tous les composants UI,
   gère le lazy loading, le cache, les événements globaux,
   et la configuration du système.
   
   STRUCTURE:
   1. Configuration globale (lignes 20-120)
   2. Système de cache (lignes 125-200)
   3. Lazy loading (lignes 205-280)
   4. Event bus (lignes 285-380)
   5. Gestion z-index (lignes 385-450)
   6. Utilitaires (lignes 455-550)
   7. API publique (lignes 555-650)
   
   DÉPENDANCES:
   - theme-engine.js (gestion des thèmes)
   - animation-engine.js (gestion des animations)
   - Tous les composants UI du système
   ======================================== */

const UIManager = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION GLOBALE
    // ========================================
    const CONFIG = {
        // Préfixes et namespaces
        namespace: 'orixis-ui',
        cssPrefix: 'ui-',
        dataPrefix: 'data-ui-',
        
        // Chemins de base
        paths: {
            components: '/src/js/shared/ui/',
            styles: '/src/css/shared/ui/',
            themes: '/src/css/shared/themes/',
            utils: '/src/js/shared/utils/'
        },
        
        // Configuration du cache
        cache: {
            enabled: true,
            maxSize: 50, // Nombre max de composants en cache
            ttl: 3600000, // Time to live: 1 heure
            storage: 'memory', // 'memory' | 'sessionStorage' | 'localStorage'
            preload: ['button', 'modal', 'notification'] // Composants à précharger
        },
        
        // Configuration du lazy loading
        lazyLoading: {
            enabled: true,
            threshold: 0.1, // Intersection observer threshold
            rootMargin: '50px',
            preloadOnHover: true,
            timeout: 10000 // Timeout de chargement
        },
        
        // Gestion des z-index globaux
        zIndex: {
            base: 1,
            dropdown: 1000,
            sticky: 1020,
            fixed: 1030,
            modalBackdrop: 1040,
            modal: 1050,
            popover: 1060,
            tooltip: 1070,
            notification: 1080,
            maximum: 9999
        },
        
        // Configuration des événements
        events: {
            namespace: '.ui-manager',
            debounceDelay: 150,
            throttleDelay: 100,
            customEvents: {
                'ui:ready': 'UIReady',
                'ui:component:loaded': 'UIComponentLoaded',
                'ui:component:error': 'UIComponentError',
                'ui:theme:changed': 'UIThemeChanged',
                'ui:animation:complete': 'UIAnimationComplete'
            }
        },
        
        // Performance
        performance: {
            monitoring: true,
            slowThreshold: 300, // ms
            logSlowComponents: true,
            metrics: {
                loadTime: [],
                renderTime: [],
                interactionTime: []
            }
        },
        
        // Debug et développement
        debug: {
            enabled: false,
            logLevel: 'warn', // 'error' | 'warn' | 'info' | 'debug'
            showPerformance: false,
            showCache: false,
            visualDebug: false // Affiche les bordures des composants
        }
    };

    // ========================================
    // SYSTÈME DE CACHE
    // ========================================
    const Cache = {
        store: new Map(),
        timestamps: new Map(),
        
        set(key, value) {
            if (!CONFIG.cache.enabled) return;
            
            // Vérifier la taille du cache
            if (this.store.size >= CONFIG.cache.maxSize) {
                this.evictOldest();
            }
            
            this.store.set(key, value);
            this.timestamps.set(key, Date.now());
            
            if (CONFIG.debug.showCache) {
                console.debug(`[UIManager] Cache set: ${key}`);
            }
        },
        
        get(key) {
            if (!CONFIG.cache.enabled) return null;
            
            const timestamp = this.timestamps.get(key);
            if (timestamp && (Date.now() - timestamp) > CONFIG.cache.ttl) {
                this.delete(key);
                return null;
            }
            
            return this.store.get(key) || null;
        },
        
        delete(key) {
            this.store.delete(key);
            this.timestamps.delete(key);
        },
        
        clear() {
            this.store.clear();
            this.timestamps.clear();
        },
        
        evictOldest() {
            let oldestKey = null;
            let oldestTime = Date.now();
            
            for (const [key, time] of this.timestamps) {
                if (time < oldestTime) {
                    oldestTime = time;
                    oldestKey = key;
                }
            }
            
            if (oldestKey) {
                this.delete(oldestKey);
            }
        },
        
        getStats() {
            return {
                size: this.store.size,
                maxSize: CONFIG.cache.maxSize,
                entries: Array.from(this.store.keys())
            };
        }
    };

    // ========================================
    // SYSTÈME DE LAZY LOADING
    // ========================================
    const LazyLoader = {
        loading: new Map(),
        loaded: new Set(),
        observers: new Map(),
        
        async load(componentName, options = {}) {
            const startTime = performance.now();
            
            // Vérifier le cache
            const cached = Cache.get(componentName);
            if (cached) {
                this.trackPerformance('cache', componentName, startTime);
                return cached;
            }
            
            // Vérifier si déjà en cours de chargement
            if (this.loading.has(componentName)) {
                return this.loading.get(componentName);
            }
            
            // Créer la promesse de chargement
            const loadPromise = this.loadComponent(componentName, options);
            this.loading.set(componentName, loadPromise);
            
            try {
                const component = await loadPromise;
                this.loaded.add(componentName);
                Cache.set(componentName, component);
                this.loading.delete(componentName);
                
                this.trackPerformance('load', componentName, startTime);
                EventBus.emit('ui:component:loaded', { componentName, component });
                
                return component;
            } catch (error) {
                this.loading.delete(componentName);
                EventBus.emit('ui:component:error', { componentName, error });
                throw error;
            }
        },
        
        async loadComponent(componentName, options) {
            const timeout = options.timeout || CONFIG.lazyLoading.timeout;
            const componentPath = this.getComponentPath(componentName);
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Timeout loading ${componentName}`)), timeout);
            });
            
            const loadPromise = import(componentPath).then(module => {
                return module.default || module[this.getComponentClass(componentName)];
            });
            
            return Promise.race([loadPromise, timeoutPromise]);
        },
        
        getComponentPath(componentName) {
            const categoryMap = {
                // Core
                'button': 'core/button.component.js',
                'card': 'core/card.component.js',
                'fab': 'core/fab.component.js',
                
                // Feedback
                'modal': 'feedback/modal.component.js',
                'notification': 'feedback/notification.component.js',
                'dialog': 'feedback/dialog.component.js',
                'toast': 'feedback/toast.component.js',
                'alert': 'feedback/alert.component.js',
                'snackbar': 'feedback/snackbar.component.js',
                'progress': 'feedback/progress.component.js',
                
                // Data Display
                'table': 'data-display/table.component.js',
                'list': 'data-display/list.component.js',
                'grid': 'data-display/grid.component.js',
                'timeline': 'data-display/timeline.component.js',
                
                // Data Entry
                'form': 'data-entry/form-builder.component.js',
                'input': 'data-entry/input-field.component.js',
                'select': 'data-entry/select-field.component.js',
                'checkbox': 'data-entry/checkbox-group.component.js',
                
                // Layout
                'sidebar': 'layout/sidebar.component.js',
                'header': 'layout/header.component.js',
                'tabs': 'layout/tabs.component.js',
                
                // Navigation
                'menu': 'navigation/menu.component.js',
                'pagination': 'navigation/pagination.component.js',
                'breadcrumb': 'navigation/breadcrumb.component.js'
            };
            
            return CONFIG.paths.components + (categoryMap[componentName] || `${componentName}.component.js`);
        },
        
        getComponentClass(componentName) {
            return componentName.charAt(0).toUpperCase() + componentName.slice(1) + 'Component';
        },
        
        preload(components) {
            return Promise.all(
                components.map(name => this.load(name).catch(err => {
                    console.warn(`Failed to preload ${name}:`, err);
                }))
            );
        },
        
        trackPerformance(type, componentName, startTime) {
            if (!CONFIG.performance.monitoring) return;
            
            const duration = performance.now() - startTime;
            CONFIG.performance.metrics.loadTime.push({
                type,
                component: componentName,
                duration,
                timestamp: Date.now()
            });
            
            if (duration > CONFIG.performance.slowThreshold && CONFIG.performance.logSlowComponents) {
                console.warn(`[UIManager] Slow ${type} for ${componentName}: ${duration.toFixed(2)}ms`);
            }
        }
    };

    // ========================================
    // EVENT BUS
    // ========================================
    const EventBus = {
        events: new Map(),
        
        on(event, handler, options = {}) {
            if (!this.events.has(event)) {
                this.events.set(event, new Set());
            }
            
            const wrappedHandler = {
                handler,
                once: options.once || false,
                id: options.id || this.generateId()
            };
            
            this.events.get(event).add(wrappedHandler);
            
            return wrappedHandler.id;
        },
        
        off(event, handlerId) {
            if (!this.events.has(event)) return;
            
            const handlers = this.events.get(event);
            for (const wrapper of handlers) {
                if (wrapper.id === handlerId || wrapper.handler === handlerId) {
                    handlers.delete(wrapper);
                }
            }
        },
        
        emit(event, data = {}) {
            // Émettre l'événement personnalisé
            if (CONFIG.events.customEvents[event]) {
                const customEvent = new CustomEvent(CONFIG.events.customEvents[event], {
                    detail: data,
                    bubbles: true,
                    cancelable: true
                });
                document.dispatchEvent(customEvent);
            }
            
            // Émettre via le bus interne
            if (!this.events.has(event)) return;
            
            const handlers = this.events.get(event);
            for (const wrapper of handlers) {
                try {
                    wrapper.handler(data);
                    
                    if (wrapper.once) {
                        handlers.delete(wrapper);
                    }
                } catch (error) {
                    console.error(`[UIManager] Error in event handler for ${event}:`, error);
                }
            }
        },
        
        once(event, handler) {
            return this.on(event, handler, { once: true });
        },
        
        clear(event) {
            if (event) {
                this.events.delete(event);
            } else {
                this.events.clear();
            }
        },
        
        generateId() {
            return `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    };

    // ========================================
    // GESTION DES Z-INDEX
    // ========================================
    const ZIndexManager = {
        stack: [],
        reserved: new Map(),
        
        get(type) {
            return CONFIG.zIndex[type] || CONFIG.zIndex.base;
        },
        
        reserve(id, type) {
            const zIndex = this.get(type);
            const stackIndex = this.stack.filter(item => item.type === type).length;
            const finalZIndex = zIndex + stackIndex;
            
            this.stack.push({ id, type, zIndex: finalZIndex });
            this.reserved.set(id, finalZIndex);
            
            return finalZIndex;
        },
        
        release(id) {
            this.stack = this.stack.filter(item => item.id !== id);
            this.reserved.delete(id);
        },
        
        getHighest(type) {
            const items = this.stack.filter(item => item.type === type);
            return items.length > 0 
                ? Math.max(...items.map(item => item.zIndex))
                : this.get(type);
        },
        
        bringToFront(id) {
            const item = this.stack.find(item => item.id === id);
            if (!item) return;
            
            const newZIndex = this.getHighest(item.type) + 1;
            item.zIndex = newZIndex;
            this.reserved.set(id, newZIndex);
            
            return newZIndex;
        },
        
        getStack() {
            return [...this.stack];
        }
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    const Utils = {
        generateId(prefix = 'ui') {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
        
        debounce(func, delay = CONFIG.events.debounceDelay) {
            let timeoutId;
            return function debounced(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        },
        
        throttle(func, delay = CONFIG.events.throttleDelay) {
            let lastCall = 0;
            return function throttled(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    return func.apply(this, args);
                }
            };
        },
        
        waitForElement(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                
                const observer = new MutationObserver((mutations, obs) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        obs.disconnect();
                        resolve(element);
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found`));
                }, timeout);
            });
        },
        
        injectStyles(styles, id) {
            const styleId = id || this.generateId('style');
            let styleElement = document.getElementById(styleId);
            
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = styles;
            return styleElement;
        },
        
        loadCSS(href, id) {
            return new Promise((resolve, reject) => {
                const linkId = id || this.generateId('link');
                let linkElement = document.getElementById(linkId);
                
                if (linkElement) {
                    resolve(linkElement);
                    return;
                }
                
                linkElement = document.createElement('link');
                linkElement.id = linkId;
                linkElement.rel = 'stylesheet';
                linkElement.href = href;
                
                linkElement.onload = () => resolve(linkElement);
                linkElement.onerror = () => reject(new Error(`Failed to load ${href}`));
                
                document.head.appendChild(linkElement);
            });
        },
        
        measurePerformance(name, func) {
            const startMark = `${name}_start`;
            const endMark = `${name}_end`;
            const measureName = `${name}_duration`;
            
            performance.mark(startMark);
            const result = func();
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);
            
            const measure = performance.getEntriesByName(measureName)[0];
            const duration = measure.duration;
            
            if (CONFIG.debug.showPerformance) {
                console.debug(`[UIManager] ${name}: ${duration.toFixed(2)}ms`);
            }
            
            return result;
        }
    };

    // ========================================
    // INITIALISATION
    // ========================================
    const init = async () => {
        console.log('[UIManager] Initializing...');
        
        try {
            // Charger les moteurs principaux
            const [ThemeEngine, AnimationEngine] = await Promise.all([
                LazyLoader.load('theme-engine'),
                LazyLoader.load('animation-engine')
            ]);
            
            // Initialiser les moteurs
            if (ThemeEngine?.init) await ThemeEngine.init();
            if (AnimationEngine?.init) await AnimationEngine.init();
            
            // Précharger les composants essentiels
            if (CONFIG.cache.preload.length > 0) {
                await LazyLoader.preload(CONFIG.cache.preload);
            }
            
            // Activer le mode debug si nécessaire
            if (CONFIG.debug.visualDebug) {
                enableVisualDebug();
            }
            
            // Émettre l'événement ready
            EventBus.emit('ui:ready', {
                version: '1.0.0',
                components: LazyLoader.loaded.size,
                cache: Cache.getStats()
            });
            
            console.log('[UIManager] Ready!');
        } catch (error) {
            console.error('[UIManager] Initialization failed:', error);
            throw error;
        }
    };

    // ========================================
    // MODE DEBUG VISUEL
    // ========================================
    const enableVisualDebug = () => {
        const debugStyles = `
            [data-ui-component] {
                outline: 2px dashed rgba(255, 0, 0, 0.5) !important;
                position: relative !important;
            }
            
            [data-ui-component]::before {
                content: attr(data-ui-component) !important;
                position: absolute !important;
                top: -20px !important;
                left: 0 !important;
                background: red !important;
                color: white !important;
                padding: 2px 6px !important;
                font-size: 10px !important;
                font-family: monospace !important;
                z-index: 10000 !important;
                pointer-events: none !important;
            }
        `;
        
        Utils.injectStyles(debugStyles, 'ui-debug-styles');
    };

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration
        config: CONFIG,
        setConfig(newConfig) {
            Object.assign(CONFIG, newConfig);
        },
        
        // Composants
        async load(componentName, options) {
            return LazyLoader.load(componentName, options);
        },
        
        async create(componentName, options = {}) {
            const Component = await this.load(componentName);
            if (Component?.create) {
                return Component.create(options);
            }
            throw new Error(`Component ${componentName} does not have a create method`);
        },
        
        // Cache
        cache: {
            get: key => Cache.get(key),
            set: (key, value) => Cache.set(key, value),
            clear: () => Cache.clear(),
            stats: () => Cache.getStats()
        },
        
        // Événements
        on: (event, handler, options) => EventBus.on(event, handler, options),
        off: (event, handlerId) => EventBus.off(event, handlerId),
        emit: (event, data) => EventBus.emit(event, data),
        once: (event, handler) => EventBus.once(event, handler),
        
        // Z-Index
        zIndex: {
            get: type => ZIndexManager.get(type),
            reserve: (id, type) => ZIndexManager.reserve(id, type),
            release: id => ZIndexManager.release(id),
            bringToFront: id => ZIndexManager.bringToFront(id)
        },
        
        // Utilitaires
        utils: {
            generateId: Utils.generateId,
            debounce: Utils.debounce,
            throttle: Utils.throttle,
            waitForElement: Utils.waitForElement,
            injectStyles: Utils.injectStyles,
            loadCSS: Utils.loadCSS,
            measurePerformance: Utils.measurePerformance
        },
        
        // Debug
        debug: {
            enable: () => { CONFIG.debug.enabled = true; },
            disable: () => { CONFIG.debug.enabled = false; },
            showCache: () => console.table(Cache.getStats()),
            showZIndex: () => console.table(ZIndexManager.getStack()),
            showPerformance: () => console.table(CONFIG.performance.metrics),
            enableVisualDebug
        },
        
        // Initialisation
        init
    };
})();

// Auto-initialisation si le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UIManager.init);
} else {
    UIManager.init();
}

// Export pour utilisation
export default UIManager;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Architecture du lazy loading
   Solution: Map pour gérer les chargements concurrents
   
   [DATE] - Gestion des z-index dynamiques
   Cause: Conflits entre modales et tooltips
   Résolution: Stack avec réservation d'ID
   
   [DATE] - Performance du cache
   Cause: Pas d'éviction automatique
   Résolution: LRU avec TTL configurable
   
   NOTES POUR REPRISES FUTURES:
   - Le UIManager doit être initialisé avant tout autre composant
   - Les événements custom sont dispatchés sur document
   - Le cache peut être désactivé via config
   - Les chemins des composants sont hardcodés dans getComponentPath()
   ======================================== */