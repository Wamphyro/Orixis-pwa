/* ========================================
   SNACKBAR.COMPONENT.JS - Système de notifications Snackbar
   Chemin: src/js/shared/ui/feedback/snackbar.component.js
   
   DESCRIPTION:
   Composant de notification temporaire avec style glassmorphism.
   Affiche des messages courts avec options d'action, apparaissant
   généralement en bas de l'écran avec animations fluides.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Gestion du DOM et des styles (lignes 251-450)
   3. Système de queue (lignes 451-550)
   4. Animations (lignes 551-650)
   5. API publique (lignes 651-750)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - ui.config.js (configuration globale si disponible)
   - CSS intégré ou snackbar.component.css
   ======================================== */

const SnackbarComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                color: '#ffffff',
                actionColor: 'rgba(255, 255, 255, 0.9)',
                iconFilter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
            },
            'neumorphism': {
                background: '#e0e5ec',
                backdropFilter: 'none',
                border: 'none',
                boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                color: '#2d3748',
                actionColor: '#4a5568',
                iconFilter: 'none'
            },
            'flat': {
                background: '#323232',
                backdropFilter: 'none',
                border: 'none',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                color: '#ffffff',
                actionColor: '#ffd600',
                iconFilter: 'none'
            },
            'material': {
                background: '#323232',
                backdropFilter: 'none',
                border: 'none',
                boxShadow: '0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14)',
                color: '#ffffff',
                actionColor: '#ff4081',
                iconFilter: 'none'
            },
            'minimal': {
                background: 'rgba(0, 0, 0, 0.87)',
                backdropFilter: 'none',
                border: 'none',
                boxShadow: 'none',
                color: '#ffffff',
                actionColor: '#ffffff',
                iconFilter: 'none'
            }
        },

        // Types de messages avec couleurs
        types: {
            'info': {
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
                color: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            },
            'success': {
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
                color: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)'
            },
            'warning': {
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01"/></svg>',
                color: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)'
            },
            'error': {
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6m0-6l6 6"/></svg>',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)'
            },
            'custom': {
                icon: '',
                color: '#6b7280',
                backgroundColor: 'rgba(107, 114, 128, 0.1)'
            }
        },

        // Positions disponibles
        positions: {
            'bottom-left': { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
            'bottom-center': { bottom: '20px', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' },
            'bottom-right': { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
            'top-left': { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
            'top-center': { top: '20px', left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' },
            'top-right': { top: '20px', right: '20px', left: 'auto', bottom: 'auto' }
        },

        // Animations disponibles
        animations: {
            'none': {
                in: { opacity: '1' },
                out: { opacity: '0' },
                duration: 0
            },
            'fade': {
                in: { opacity: '1' },
                out: { opacity: '0' },
                duration: 300
            },
            'slide': {
                in: { transform: 'translateY(0)', opacity: '1' },
                out: { transform: 'translateY(100%)', opacity: '0' },
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'scale': {
                in: { transform: 'scale(1)', opacity: '1' },
                out: { transform: 'scale(0.8)', opacity: '0' },
                duration: 250,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            },
            'bounce': {
                in: { transform: 'translateY(0) scale(1)', opacity: '1' },
                out: { transform: 'translateY(100%) scale(0.9)', opacity: '0' },
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            'elastic': {
                in: { transform: 'translateX(0) scaleX(1)', opacity: '1' },
                out: { transform: 'translateX(-100%) scaleX(0.5)', opacity: '0' },
                duration: 500,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            'zoom': {
                in: { transform: 'scale(1) translateY(0)', opacity: '1' },
                out: { transform: 'scale(0) translateY(20px)', opacity: '0' },
                duration: 300,
                easing: 'ease-out'
            }
        },

        // Fonctionnalités disponibles
        features: {
            'autoDismiss': {
                enabled: true,
                duration: 4000,
                showProgress: true,
                pauseOnHover: true
            },
            'swipeToDismiss': {
                enabled: true,
                threshold: 100,
                velocity: 0.4
            },
            'actions': {
                maxActions: 2,
                style: 'text', // 'text', 'outlined', 'contained'
                uppercase: true
            },
            'queue': {
                enabled: true,
                maxVisible: 3,
                spacing: 10,
                order: 'fifo' // 'fifo', 'lifo', 'replace'
            },
            'accessibility': {
                role: 'alert',
                ariaLive: 'polite',
                announceDelay: 100
            },
            'responsive': {
                mobileFullWidth: true,
                breakpoint: 768,
                mobilePosition: 'bottom-center'
            }
        },

        // Configurations par défaut
        defaults: {
            style: 'glassmorphism',
            type: 'info',
            position: 'bottom-center',
            animation: 'slide',
            duration: 4000,
            showIcon: true,
            dismissible: true,
            persistent: false,
            className: '',
            zIndex: 9999
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let container = null;
    let styleSheet = null;
    let queue = [];
    let activeSnackbars = new Map();
    let instanceIdCounter = 0;

    // ========================================
    // GESTION DU DOM ET DES STYLES
    // ========================================
    function ensureContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'snackbar-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
        return container;
    }

    function injectStyles() {
        if (styleSheet) return;

        const styles = `
            /* ========================================
               SNACKBAR STYLES
               ======================================== */
            .snackbar-container {
                position: fixed;
                pointer-events: none;
                z-index: ${CONFIG.defaults.zIndex};
            }

            .snackbar {
                display: flex;
                align-items: center;
                min-height: 48px;
                padding: 14px 24px;
                margin: 8px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                pointer-events: all;
                position: relative;
                max-width: 568px;
                word-break: break-word;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Glassmorphism style */
            .snackbar.glassmorphism {
                background: ${CONFIG.styles.glassmorphism.background};
                backdrop-filter: ${CONFIG.styles.glassmorphism.backdropFilter};
                -webkit-backdrop-filter: ${CONFIG.styles.glassmorphism.backdropFilter};
                border: ${CONFIG.styles.glassmorphism.border};
                box-shadow: ${CONFIG.styles.glassmorphism.boxShadow};
                color: ${CONFIG.styles.glassmorphism.color};
            }

            /* Icon styles */
            .snackbar-icon {
                flex-shrink: 0;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .snackbar-icon svg {
                width: 20px;
                height: 20px;
            }

            /* Content */
            .snackbar-content {
                flex: 1;
                margin-right: 12px;
            }

            /* Actions */
            .snackbar-actions {
                display: flex;
                gap: 8px;
                margin-left: auto;
                flex-shrink: 0;
            }

            .snackbar-action {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                font-weight: 500;
                padding: 8px 16px;
                text-transform: uppercase;
                border-radius: 4px;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }

            .snackbar.glassmorphism .snackbar-action {
                color: ${CONFIG.styles.glassmorphism.actionColor};
                background: rgba(255, 255, 255, 0.1);
            }

            .snackbar-action:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            .snackbar-action:active {
                transform: scale(0.95);
            }

            /* Close button */
            .snackbar-close {
                position: absolute;
                top: 8px;
                right: 8px;
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .snackbar-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            /* Progress bar */
            .snackbar-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 8px 8px;
                transition: width linear;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .snackbar {
                    margin: 0;
                    max-width: 100%;
                    border-radius: 0;
                }
                
                .snackbar-container[data-position*="bottom"] .snackbar {
                    border-radius: 8px 8px 0 0;
                }
                
                .snackbar-container[data-position*="top"] .snackbar {
                    border-radius: 0 0 8px 8px;
                }
            }

            /* Type colors */
            .snackbar.info .snackbar-icon { color: ${CONFIG.types.info.color}; }
            .snackbar.success .snackbar-icon { color: ${CONFIG.types.success.color}; }
            .snackbar.warning .snackbar-icon { color: ${CONFIG.types.warning.color}; }
            .snackbar.error .snackbar-icon { color: ${CONFIG.types.error.color}; }

            /* Queue stacking */
            .snackbar[data-queue-index="1"] { transform: translateY(-60px) scale(0.95); }
            .snackbar[data-queue-index="2"] { transform: translateY(-120px) scale(0.9); }

            /* Swipe to dismiss */
            .snackbar.swiping {
                transition: none;
                opacity: var(--swipe-opacity);
                transform: translateX(var(--swipe-x));
            }

            /* Additional styles for other themes */
            .snackbar.neumorphism {
                background: ${CONFIG.styles.neumorphism.background};
                box-shadow: ${CONFIG.styles.neumorphism.boxShadow};
                color: ${CONFIG.styles.neumorphism.color};
            }

            .snackbar.flat {
                background: ${CONFIG.styles.flat.background};
                box-shadow: ${CONFIG.styles.flat.boxShadow};
                color: ${CONFIG.styles.flat.color};
            }

            .snackbar.material {
                background: ${CONFIG.styles.material.background};
                box-shadow: ${CONFIG.styles.material.boxShadow};
                color: ${CONFIG.styles.material.color};
                border-radius: 4px;
            }

            .snackbar.minimal {
                background: ${CONFIG.styles.minimal.background};
                color: ${CONFIG.styles.minimal.color};
                border-radius: 4px;
            }
        `;

        styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // CRÉATION DU SNACKBAR
    // ========================================
    function createSnackbarElement(options) {
        const config = { ...CONFIG.defaults, ...options };
        const id = `snackbar-${++instanceIdCounter}`;
        
        const snackbar = document.createElement('div');
        snackbar.className = `snackbar ${config.style} ${config.type} ${config.className}`;
        snackbar.id = id;
        snackbar.setAttribute('role', CONFIG.features.accessibility.role);
        
        // Icône
        if (config.showIcon && CONFIG.types[config.type].icon) {
            const iconWrapper = document.createElement('div');
            iconWrapper.className = 'snackbar-icon';
            iconWrapper.innerHTML = CONFIG.types[config.type].icon;
            snackbar.appendChild(iconWrapper);
        }

        // Contenu
        const content = document.createElement('div');
        content.className = 'snackbar-content';
        content.textContent = config.message || '';
        snackbar.appendChild(content);

        // Actions
        if (config.actions && config.actions.length > 0) {
            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'snackbar-actions';
            
            config.actions.slice(0, CONFIG.features.actions.maxActions).forEach(action => {
                const button = document.createElement('button');
                button.className = 'snackbar-action';
                button.textContent = action.text;
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (action.handler) {
                        action.handler(e, { dismiss: () => dismiss(id) });
                    }
                });
                actionsWrapper.appendChild(button);
            });
            
            snackbar.appendChild(actionsWrapper);
        }

        // Bouton de fermeture
        if (config.dismissible && !config.persistent) {
            const closeButton = document.createElement('button');
            closeButton.className = 'snackbar-close';
            closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            closeButton.addEventListener('click', () => dismiss(id));
            snackbar.appendChild(closeButton);
        }

        // Barre de progression
        if (config.showProgress && !config.persistent) {
            const progress = document.createElement('div');
            progress.className = 'snackbar-progress';
            snackbar.appendChild(progress);
        }

        return { element: snackbar, id, config };
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    function animateIn(element, animation, position) {
        const animConfig = CONFIG.animations[animation];
        
        // Position initiale
        if (animation === 'slide') {
            const isBottom = position.includes('bottom');
            element.style.transform = `translateY(${isBottom ? '100%' : '-100%'})`;
        } else if (animation === 'scale') {
            element.style.transform = 'scale(0.8)';
        }
        
        element.style.opacity = '0';
        
        // Force reflow
        element.offsetHeight;
        
        // Animation
        Object.assign(element.style, {
            transition: `all ${animConfig.duration}ms ${animConfig.easing || 'ease'}`,
            ...animConfig.in
        });
    }

    function animateOut(element, animation) {
        return new Promise(resolve => {
            const animConfig = CONFIG.animations[animation];
            
            Object.assign(element.style, animConfig.out);
            
            setTimeout(resolve, animConfig.duration);
        });
    }

    // ========================================
    // GESTION DE LA QUEUE
    // ========================================
    function processQueue() {
        if (!CONFIG.features.queue.enabled) return;
        
        const maxVisible = CONFIG.features.queue.maxVisible;
        const visible = Array.from(activeSnackbars.values()).filter(s => !s.removing);
        
        visible.forEach((snackbar, index) => {
            if (index < maxVisible) {
                snackbar.element.style.display = 'flex';
                snackbar.element.setAttribute('data-queue-index', index);
            } else {
                snackbar.element.style.display = 'none';
            }
        });
    }

    // ========================================
    // FONCTIONS DE GESTION
    // ========================================
    function show(options) {
        injectStyles();
        ensureContainer();
        
        const { element, id, config } = createSnackbarElement(options);
        
        // Positionnement
        const position = config.position;
        Object.assign(container.style, CONFIG.positions[position]);
        container.setAttribute('data-position', position);
        
        // Ajout au DOM
        if (position.includes('top')) {
            container.appendChild(element);
        } else {
            container.insertBefore(element, container.firstChild);
        }
        
        // Stockage
        activeSnackbars.set(id, {
            element,
            config,
            removing: false,
            timeoutId: null
        });
        
        // Animation d'entrée
        animateIn(element, config.animation, position);
        
        // Auto-dismiss
        if (!config.persistent && CONFIG.features.autoDismiss.enabled) {
            const duration = config.duration || CONFIG.features.autoDismiss.duration;
            
            if (config.showProgress) {
                const progress = element.querySelector('.snackbar-progress');
                progress.style.transition = `width ${duration}ms linear`;
                setTimeout(() => progress.style.width = '100%', 10);
            }
            
            const timeoutId = setTimeout(() => dismiss(id), duration);
            activeSnackbars.get(id).timeoutId = timeoutId;
            
            // Pause on hover
            if (CONFIG.features.autoDismiss.pauseOnHover) {
                element.addEventListener('mouseenter', () => {
                    clearTimeout(timeoutId);
                    if (config.showProgress) {
                        const progress = element.querySelector('.snackbar-progress');
                        progress.style.transition = 'none';
                    }
                });
                
                element.addEventListener('mouseleave', () => {
                    const newTimeoutId = setTimeout(() => dismiss(id), 2000);
                    activeSnackbars.get(id).timeoutId = newTimeoutId;
                });
            }
        }
        
        // Swipe to dismiss
        if (CONFIG.features.swipeToDismiss.enabled) {
            setupSwipeGesture(element, id);
        }
        
        processQueue();
        
        return {
            id,
            dismiss: () => dismiss(id),
            update: (newOptions) => update(id, newOptions)
        };
    }

    function dismiss(id) {
        const snackbar = activeSnackbars.get(id);
        if (!snackbar || snackbar.removing) return;
        
        snackbar.removing = true;
        clearTimeout(snackbar.timeoutId);
        
        animateOut(snackbar.element, snackbar.config.animation).then(() => {
            snackbar.element.remove();
            activeSnackbars.delete(id);
            processQueue();
            
            // Nettoyer le container si vide
            if (activeSnackbars.size === 0 && container) {
                container.remove();
                container = null;
            }
        });
    }

    function update(id, newOptions) {
        const snackbar = activeSnackbars.get(id);
        if (!snackbar) return;
        
        const content = snackbar.element.querySelector('.snackbar-content');
        if (newOptions.message) {
            content.textContent = newOptions.message;
        }
        
        if (newOptions.type && newOptions.type !== snackbar.config.type) {
            snackbar.element.classList.remove(snackbar.config.type);
            snackbar.element.classList.add(newOptions.type);
            snackbar.config.type = newOptions.type;
        }
    }

    function dismissAll() {
        activeSnackbars.forEach((_, id) => dismiss(id));
    }

    // ========================================
    // GESTION DES GESTES TACTILES
    // ========================================
    function setupSwipeGesture(element, id) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        const handleStart = (e) => {
            isDragging = true;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            element.classList.add('swiping');
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const deltaX = currentX - startX;
            const opacity = Math.max(0, 1 - Math.abs(deltaX) / CONFIG.features.swipeToDismiss.threshold);
            
            element.style.setProperty('--swipe-x', `${deltaX}px`);
            element.style.setProperty('--swipe-opacity', opacity);
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            element.classList.remove('swiping');
            
            const deltaX = Math.abs(currentX - startX);
            
            if (deltaX > CONFIG.features.swipeToDismiss.threshold) {
                dismiss(id);
            } else {
                element.style.removeProperty('--swipe-x');
                element.style.removeProperty('--swipe-opacity');
            }
        };
        
        // Touch events
        element.addEventListener('touchstart', handleStart, { passive: true });
        element.addEventListener('touchmove', handleMove, { passive: true });
        element.addEventListener('touchend', handleEnd);
        
        // Mouse events
        element.addEventListener('mousedown', handleStart);
        element.addEventListener('mousemove', handleMove);
        element.addEventListener('mouseup', handleEnd);
        element.addEventListener('mouseleave', handleEnd);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Configuration exposée
        CONFIG,
        
        // Méthodes principales
        show,
        dismiss,
        dismissAll,
        update,
        
        // Méthodes utilitaires
        create: show, // Alias pour cohérence avec autres composants
        
        // Méthodes de convenance par type
        info: (message, options = {}) => show({ ...options, message, type: 'info' }),
        success: (message, options = {}) => show({ ...options, message, type: 'success' }),
        warning: (message, options = {}) => show({ ...options, message, type: 'warning' }),
        error: (message, options = {}) => show({ ...options, message, type: 'error' }),
        
        // Gestion des styles
        injectStyles,
        
        // Utilitaires
        getActive: () => Array.from(activeSnackbars.keys()),
        clearQueue: () => queue = []
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnackbarComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date création] - Architecture modulaire
   Solution: Pattern IIFE avec CONFIG complète
   
   [Date création] - Gestion de la queue
   Cause: Plusieurs snackbars simultanés
   Résolution: Map pour stocker les instances actives
   
   [Date création] - Animations fluides
   Cause: Transitions CSS vs JavaScript
   Résolution: Combinaison CSS transitions + JS orchestration
   
   NOTES POUR REPRISES FUTURES:
   - Les styles sont injectés dynamiquement
   - Le container est créé à la demande
   - Chaque snackbar a un ID unique
   - Support touch/mouse pour swipe
   - Auto-cleanup du container si vide
   ======================================== */