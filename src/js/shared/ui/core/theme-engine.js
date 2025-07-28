/* ========================================
   THEME-ENGINE.JS - Moteur de thèmes dynamique
   Chemin: src/js/shared/ui/core/theme-engine.js
   
   DESCRIPTION:
   Moteur de gestion des thèmes pour l'ensemble du système UI.
   Gère les transitions entre thèmes, les préférences utilisateur,
   les variables CSS dynamiques, et l'adaptation aux préférences système.
   
   STRUCTURE:
   1. Configuration des thèmes (lignes 20-300)
   2. Variables CSS dynamiques (lignes 305-450)
   3. Gestion des préférences (lignes 455-550)
   4. Application des thèmes (lignes 555-700)
   5. Transitions fluides (lignes 705-850)
   6. Détection système (lignes 855-950)
   7. API publique (lignes 955-1100)
   
   DÉPENDANCES:
   - ui-manager.js (événements et utilitaires)
   - Fichiers CSS des thèmes dans /src/css/shared/themes/
   ======================================== */

const ThemeEngine = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION DES THÈMES
    // ========================================
    const THEMES = {
        glassmorphism: {
            name: 'Glassmorphism',
            description: 'Effet verre dépoli moderne avec transparence',
            className: 'theme-glassmorphism',
            cssFile: '/src/css/shared/themes/glassmorphism.css',
            
            // Variables CSS spécifiques
            variables: {
                // Couleurs principales
                '--ui-primary': '#3b82f6',
                '--ui-primary-rgb': '59, 130, 246',
                '--ui-secondary': '#8b5cf6',
                '--ui-secondary-rgb': '139, 92, 246',
                '--ui-accent': '#06b6d4',
                '--ui-accent-rgb': '6, 182, 212',
                
                // Surfaces
                '--ui-surface': 'rgba(255, 255, 255, 0.1)',
                '--ui-surface-hover': 'rgba(255, 255, 255, 0.15)',
                '--ui-surface-active': 'rgba(255, 255, 255, 0.2)',
                '--ui-backdrop-blur': '20px',
                '--ui-backdrop-saturate': '180%',
                
                // Bordures
                '--ui-border': 'rgba(255, 255, 255, 0.2)',
                '--ui-border-width': '1px',
                '--ui-border-radius': '12px',
                '--ui-border-radius-sm': '8px',
                '--ui-border-radius-lg': '16px',
                
                // Ombres
                '--ui-shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
                '--ui-shadow': '0 8px 32px rgba(0, 0, 0, 0.1)',
                '--ui-shadow-lg': '0 16px 48px rgba(0, 0, 0, 0.15)',
                '--ui-shadow-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                
                // Texte
                '--ui-text': '#1f2937',
                '--ui-text-secondary': '#6b7280',
                '--ui-text-inverse': '#ffffff',
                '--ui-text-on-primary': '#ffffff',
                
                // États
                '--ui-success': '#22c55e',
                '--ui-warning': '#f59e0b',
                '--ui-error': '#ef4444',
                '--ui-info': '#3b82f6',
                
                // Overlays
                '--ui-overlay': 'rgba(0, 0, 0, 0.5)',
                '--ui-overlay-blur': '4px',
                
                // Animations
                '--ui-transition-fast': '150ms',
                '--ui-transition-normal': '300ms',
                '--ui-transition-slow': '500ms',
                '--ui-easing': 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            
            // Propriétés spécifiques
            features: {
                blur: true,
                transparency: true,
                gradients: true,
                animations: 'smooth'
            }
        },
        
        neumorphism: {
            name: 'Neumorphism',
            description: 'Design soft UI avec ombres douces',
            className: 'theme-neumorphism',
            cssFile: '/src/css/shared/themes/neumorphism.css',
            
            variables: {
                // Couleurs
                '--ui-primary': '#6366f1',
                '--ui-primary-rgb': '99, 102, 241',
                '--ui-bg': '#e0e5ec',
                '--ui-bg-rgb': '224, 229, 236',
                
                // Surfaces
                '--ui-surface': '#e0e5ec',
                '--ui-surface-hover': '#d1d5db',
                '--ui-surface-active': '#c7cbd2',
                
                // Ombres neumorphiques
                '--ui-shadow-neu-light': '9px 9px 16px #a3b1c6',
                '--ui-shadow-neu-dark': '-9px -9px 16px #ffffff',
                '--ui-shadow-neu-inset-light': 'inset 5px 5px 10px #a3b1c6',
                '--ui-shadow-neu-inset-dark': 'inset -5px -5px 10px #ffffff',
                
                // Bordures
                '--ui-border': 'transparent',
                '--ui-border-radius': '20px',
                '--ui-border-radius-sm': '12px',
                '--ui-border-radius-lg': '28px',
                
                // Texte
                '--ui-text': '#4b5563',
                '--ui-text-secondary': '#9ca3af',
                
                // États
                '--ui-success': '#10b981',
                '--ui-warning': '#f59e0b',
                '--ui-error': '#ef4444',
                '--ui-info': '#6366f1'
            },
            
            features: {
                blur: false,
                transparency: false,
                gradients: false,
                animations: 'subtle'
            }
        },
        
        material: {
            name: 'Material Design',
            description: 'Design Google Material avec élévations',
            className: 'theme-material',
            cssFile: '/src/css/shared/themes/material.css',
            
            variables: {
                // Couleurs Material
                '--ui-primary': '#1976d2',
                '--ui-primary-light': '#42a5f5',
                '--ui-primary-dark': '#1565c0',
                '--ui-secondary': '#dc004e',
                '--ui-secondary-light': '#f73378',
                '--ui-secondary-dark': '#9a0036',
                
                // Surfaces
                '--ui-surface': '#ffffff',
                '--ui-surface-variant': '#f5f5f5',
                '--ui-background': '#fafafa',
                
                // Élévations Material
                '--ui-elevation-0': 'none',
                '--ui-elevation-1': '0 2px 4px rgba(0,0,0,0.1)',
                '--ui-elevation-2': '0 4px 8px rgba(0,0,0,0.12)',
                '--ui-elevation-3': '0 6px 12px rgba(0,0,0,0.14)',
                '--ui-elevation-4': '0 8px 16px rgba(0,0,0,0.16)',
                '--ui-elevation-5': '0 10px 20px rgba(0,0,0,0.18)',
                
                // Bordures
                '--ui-border': '#e0e0e0',
                '--ui-border-radius': '4px',
                '--ui-border-radius-sm': '2px',
                '--ui-border-radius-lg': '8px',
                
                // Typographie Material
                '--ui-font-family': 'Roboto, system-ui, sans-serif',
                '--ui-font-weight-light': '300',
                '--ui-font-weight-regular': '400',
                '--ui-font-weight-medium': '500',
                '--ui-font-weight-bold': '700',
                
                // Ripple effect
                '--ui-ripple-color': 'rgba(0, 0, 0, 0.12)',
                '--ui-ripple-duration': '600ms'
            },
            
            features: {
                blur: false,
                transparency: false,
                gradients: false,
                animations: 'rich',
                ripple: true,
                elevation: true
            }
        },
        
        minimal: {
            name: 'Minimal',
            description: 'Design épuré et minimaliste',
            className: 'theme-minimal',
            cssFile: '/src/css/shared/themes/minimal.css',
            
            variables: {
                // Palette minimale
                '--ui-primary': '#000000',
                '--ui-secondary': '#666666',
                '--ui-accent': '#0066cc',
                
                // Surfaces
                '--ui-surface': '#ffffff',
                '--ui-surface-hover': '#f9f9f9',
                '--ui-background': '#ffffff',
                
                // Bordures fines
                '--ui-border': '#e5e5e5',
                '--ui-border-width': '1px',
                '--ui-border-radius': '0',
                '--ui-border-radius-sm': '0',
                '--ui-border-radius-lg': '0',
                
                // Ombres minimales
                '--ui-shadow': 'none',
                '--ui-shadow-hover': '0 1px 3px rgba(0,0,0,0.1)',
                
                // Typographie
                '--ui-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                '--ui-text': '#000000',
                '--ui-text-secondary': '#666666',
                '--ui-text-muted': '#999999',
                
                // États
                '--ui-success': '#0d7c0d',
                '--ui-warning': '#cc6600',
                '--ui-error': '#cc0000',
                '--ui-info': '#0066cc'
            },
            
            features: {
                blur: false,
                transparency: false,
                gradients: false,
                animations: 'none'
            }
        },
        
        dark: {
            name: 'Dark Mode',
            description: 'Thème sombre pour réduire la fatigue oculaire',
            className: 'theme-dark',
            cssFile: '/src/css/shared/themes/dark-mode.css',
            
            variables: {
                // Couleurs sombres
                '--ui-primary': '#60a5fa',
                '--ui-primary-rgb': '96, 165, 250',
                '--ui-secondary': '#a78bfa',
                '--ui-accent': '#34d399',
                
                // Surfaces sombres
                '--ui-surface': '#1f2937',
                '--ui-surface-hover': '#374151',
                '--ui-surface-active': '#4b5563',
                '--ui-background': '#111827',
                
                // Glassmorphism sombre
                '--ui-surface-glass': 'rgba(31, 41, 55, 0.8)',
                '--ui-backdrop-blur': '16px',
                
                // Bordures
                '--ui-border': 'rgba(75, 85, 99, 0.5)',
                '--ui-border-radius': '12px',
                
                // Ombres
                '--ui-shadow': '0 10px 40px rgba(0, 0, 0, 0.3)',
                '--ui-shadow-lg': '0 20px 60px rgba(0, 0, 0, 0.4)',
                
                // Texte
                '--ui-text': '#f3f4f6',
                '--ui-text-secondary': '#d1d5db',
                '--ui-text-muted': '#9ca3af',
                
                // États
                '--ui-success': '#34d399',
                '--ui-warning': '#fbbf24',
                '--ui-error': '#f87171',
                '--ui-info': '#60a5fa'
            },
            
            features: {
                blur: true,
                transparency: true,
                gradients: true,
                animations: 'smooth',
                darkMode: true
            }
        }
    };

    // ========================================
    // VARIABLES GLOBALES
    // ========================================
    let currentTheme = null;
    let themeStyleElement = null;
    let customVariables = {};
    let mediaQueryList = null;
    let transitionTimeout = null;

    // ========================================
    // GESTION DES PRÉFÉRENCES
    // ========================================
    const Preferences = {
        STORAGE_KEY: 'ui-theme-preferences',
        
        save(theme, options = {}) {
            const preferences = {
                theme: theme.name,
                timestamp: Date.now(),
                auto: options.auto || false,
                customVariables: customVariables,
                ...options
            };
            
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
            } catch (e) {
                console.warn('[ThemeEngine] Failed to save preferences:', e);
            }
        },
        
        load() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                console.warn('[ThemeEngine] Failed to load preferences:', e);
                return null;
            }
        },
        
        clear() {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
            } catch (e) {
                console.warn('[ThemeEngine] Failed to clear preferences:', e);
            }
        }
    };

    // ========================================
    // APPLICATION DES THÈMES
    // ========================================
    const applyTheme = async (themeName, options = {}) => {
        const theme = THEMES[themeName];
        if (!theme) {
            throw new Error(`Theme "${themeName}" not found`);
        }
        
        // Préparer la transition
        if (options.transition !== false && currentTheme) {
            prepareTransition(options.transitionDuration);
        }
        
        try {
            // Charger le fichier CSS du thème
            await loadThemeCSS(theme);
            
            // Appliquer les classes
            updateBodyClasses(theme);
            
            // Appliquer les variables CSS
            applyVariables(theme.variables);
            
            // Appliquer les variables custom
            if (Object.keys(customVariables).length > 0) {
                applyVariables(customVariables);
            }
            
            // Mettre à jour l'état
            currentTheme = theme;
            
            // Sauvegarder les préférences
            if (options.save !== false) {
                Preferences.save(theme, options);
            }
            
            // Émettre l'événement
            emitThemeChange(theme, options);
            
            return theme;
        } catch (error) {
            console.error('[ThemeEngine] Failed to apply theme:', error);
            throw error;
        }
    };

    // ========================================
    // CHARGEMENT DES CSS
    // ========================================
    const loadThemeCSS = async (theme) => {
        const linkId = `theme-css-${theme.className}`;
        let linkElement = document.getElementById(linkId);
        
        // Désactiver les autres thèmes
        document.querySelectorAll('link[id^="theme-css-"]').forEach(link => {
            if (link.id !== linkId) {
                link.disabled = true;
            }
        });
        
        if (linkElement) {
            linkElement.disabled = false;
            return;
        }
        
        // Créer et charger le nouveau lien
        return new Promise((resolve, reject) => {
            linkElement = document.createElement('link');
            linkElement.id = linkId;
            linkElement.rel = 'stylesheet';
            linkElement.href = theme.cssFile;
            
            linkElement.onload = () => resolve();
            linkElement.onerror = () => reject(new Error(`Failed to load ${theme.cssFile}`));
            
            document.head.appendChild(linkElement);
        });
    };

    // ========================================
    // MISE À JOUR DES CLASSES
    // ========================================
    const updateBodyClasses = (theme) => {
        const body = document.body;
        
        // Retirer toutes les classes de thème
        Object.values(THEMES).forEach(t => {
            body.classList.remove(t.className);
        });
        
        // Ajouter la nouvelle classe
        body.classList.add(theme.className);
        
        // Ajouter les classes de features
        Object.entries(theme.features).forEach(([feature, value]) => {
            const featureClass = `theme-feature-${feature}`;
            if (value === true) {
                body.classList.add(featureClass);
            } else if (value && typeof value === 'string') {
                body.classList.add(`${featureClass}-${value}`);
            } else {
                body.classList.remove(featureClass);
            }
        });
    };

    // ========================================
    // APPLICATION DES VARIABLES CSS
    // ========================================
    const applyVariables = (variables) => {
        const root = document.documentElement;
        
        Object.entries(variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    };

    // ========================================
    // TRANSITIONS FLUIDES
    // ========================================
    const prepareTransition = (duration = 300) => {
        const transitionStyles = `
            * {
                transition: 
                    background-color ${duration}ms ease-in-out,
                    border-color ${duration}ms ease-in-out,
                    color ${duration}ms ease-in-out,
                    fill ${duration}ms ease-in-out,
                    stroke ${duration}ms ease-in-out,
                    opacity ${duration}ms ease-in-out,
                    box-shadow ${duration}ms ease-in-out,
                    transform ${duration}ms ease-in-out !important;
            }
        `;
        
        // Injecter les styles de transition
        if (!themeStyleElement) {
            themeStyleElement = document.createElement('style');
            themeStyleElement.id = 'theme-transition-styles';
            document.head.appendChild(themeStyleElement);
        }
        
        themeStyleElement.textContent = transitionStyles;
        
        // Retirer les styles après la transition
        clearTimeout(transitionTimeout);
        transitionTimeout = setTimeout(() => {
            if (themeStyleElement) {
                themeStyleElement.textContent = '';
            }
        }, duration + 100);
    };

    // ========================================
    // DÉTECTION DES PRÉFÉRENCES SYSTÈME
    // ========================================
    const detectSystemPreference = () => {
        if (!window.matchMedia) return 'light';
        
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        return {
            colorScheme: isDark ? 'dark' : 'light',
            contrast: isHighContrast ? 'high' : 'normal',
            motion: isReducedMotion ? 'reduced' : 'normal'
        };
    };

    const watchSystemPreferences = () => {
        if (!window.matchMedia) return;
        
        // Observer les changements de color-scheme
        mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQueryList.addEventListener('change', (e) => {
            const preferences = Preferences.load();
            if (preferences?.auto) {
                applyTheme(e.matches ? 'dark' : 'glassmorphism', {
                    auto: true,
                    reason: 'system-change'
                });
            }
        });
        
        // Observer reduced motion
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
            if (e.matches && currentTheme) {
                // Désactiver les animations
                document.body.classList.add('reduce-motion');
            } else {
                document.body.classList.remove('reduce-motion');
            }
        });
    };

    // ========================================
    // ÉMISSION DES ÉVÉNEMENTS
    // ========================================
    const emitThemeChange = (theme, options) => {
        const event = new CustomEvent('theme:changed', {
            detail: {
                theme: theme.name,
                previousTheme: currentTheme?.name,
                options,
                timestamp: Date.now()
            },
            bubbles: true,
            cancelable: false
        });
        
        document.dispatchEvent(event);
        
        // Émettre aussi via UIManager si disponible
        if (window.UIManager?.emit) {
            window.UIManager.emit('ui:theme:changed', event.detail);
        }
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    const utils = {
        // Obtenir une variable CSS
        getVariable(name) {
            const computed = getComputedStyle(document.documentElement);
            return computed.getPropertyValue(name).trim();
        },
        
        // Définir une variable CSS custom
        setVariable(name, value) {
            customVariables[name] = value;
            document.documentElement.style.setProperty(name, value);
        },
        
        // Obtenir toutes les variables du thème actuel
        getCurrentVariables() {
            if (!currentTheme) return {};
            return { ...currentTheme.variables, ...customVariables };
        },
        
        // Créer une palette de couleurs
        generateColorPalette(baseColor, name = 'custom') {
            // Utilise une bibliothèque de manipulation de couleurs si disponible
            // Sinon, génère des variantes simples
            const palette = {
                [`--ui-${name}-50`]: lighten(baseColor, 0.9),
                [`--ui-${name}-100`]: lighten(baseColor, 0.8),
                [`--ui-${name}-200`]: lighten(baseColor, 0.6),
                [`--ui-${name}-300`]: lighten(baseColor, 0.4),
                [`--ui-${name}-400`]: lighten(baseColor, 0.2),
                [`--ui-${name}-500`]: baseColor,
                [`--ui-${name}-600`]: darken(baseColor, 0.2),
                [`--ui-${name}-700`]: darken(baseColor, 0.4),
                [`--ui-${name}-800`]: darken(baseColor, 0.6),
                [`--ui-${name}-900`]: darken(baseColor, 0.8)
            };
            
            return palette;
        },
        
        // Contraste de couleur
        getContrastColor(backgroundColor) {
            // Calcul simple du contraste
            const rgb = backgroundColor.match(/\d+/g);
            if (!rgb || rgb.length < 3) return '#000000';
            
            const brightness = (parseInt(rgb[0]) * 299 + 
                              parseInt(rgb[1]) * 587 + 
                              parseInt(rgb[2]) * 114) / 1000;
            
            return brightness > 128 ? '#000000' : '#ffffff';
        }
    };

    // Fonctions helper pour lighten/darken
    const lighten = (color, amount) => {
        // Implémentation simplifiée
        return color; // TODO: Implémenter la logique réelle
    };
    
    const darken = (color, amount) => {
        // Implémentation simplifiée
        return color; // TODO: Implémenter la logique réelle
    };

    // ========================================
    // INITIALISATION
    // ========================================
    const init = async () => {
        console.log('[ThemeEngine] Initializing...');
        
        try {
            // Charger les préférences
            const preferences = Preferences.load();
            
            // Détecter les préférences système
            const systemPrefs = detectSystemPreference();
            
            // Déterminer le thème à appliquer
            let themeToApply = 'glassmorphism'; // Défaut
            
            if (preferences?.theme && THEMES[preferences.theme]) {
                themeToApply = preferences.theme;
            } else if (systemPrefs.colorScheme === 'dark') {
                themeToApply = 'dark';
            }
            
            // Appliquer le thème
            await applyTheme(themeToApply, {
                save: false,
                transition: false,
                initial: true
            });
            
            // Observer les changements système
            watchSystemPreferences();
            
            console.log('[ThemeEngine] Ready with theme:', themeToApply);
        } catch (error) {
            console.error('[ThemeEngine] Initialization failed:', error);
            // Fallback au thème par défaut
            await applyTheme('glassmorphism', { 
                save: false, 
                transition: false 
            });
        }
    };

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Thèmes disponibles
        themes: THEMES,
        
        // Thème actuel
        get current() {
            return currentTheme;
        },
        
        // Appliquer un thème
        apply: applyTheme,
        
        // Changer de thème avec transition
        async switch(themeName, options = {}) {
            return applyTheme(themeName, { 
                transition: true, 
                ...options 
            });
        },
        
        // Basculer entre clair/sombre
        async toggle() {
            const isDark = currentTheme?.features?.darkMode;
            const newTheme = isDark ? 'glassmorphism' : 'dark';
            return this.switch(newTheme);
        },
        
        // Auto-détection
        async auto() {
            const systemPrefs = detectSystemPreference();
            const theme = systemPrefs.colorScheme === 'dark' ? 'dark' : 'glassmorphism';
            return this.apply(theme, { auto: true });
        },
        
        // Variables CSS
        setVariable: utils.setVariable,
        getVariable: utils.getVariable,
        getCurrentVariables: utils.getCurrentVariables,
        
        // Palettes de couleurs
        generatePalette: utils.generateColorPalette,
        getContrastColor: utils.getContrastColor,
        
        // Préférences
        preferences: {
            save: () => Preferences.save(currentTheme),
            load: Preferences.load,
            clear: Preferences.clear
        },
        
        // Utilitaires
        utils,
        
        // Initialisation
        init
    };
})();

// Export pour utilisation
export default ThemeEngine;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Transitions entre thèmes
   Solution: Styles temporaires avec timeout
   
   [DATE] - Conflits de spécificité CSS
   Cause: Variables CSS vs classes
   Résolution: Priorité aux variables CSS custom
   
   [DATE] - Performance au changement
   Cause: Reflow/repaint excessifs
   Résolution: Batch des changements CSS
   
   NOTES POUR REPRISES FUTURES:
   - Les fichiers CSS des thèmes doivent exister
   - Les transitions peuvent causer des scintillements
   - Le localStorage peut ne pas être disponible
   - Les préférences système peuvent changer dynamiquement
   ======================================== */