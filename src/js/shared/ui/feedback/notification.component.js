/* ========================================
   NOTIFICATION.COMPONENT.JS - Système de notifications complet
   Chemin: src/js/shared/ui/feedback/notification.component.js
   
   DESCRIPTION:
   Système de notifications ultra-complet avec toutes les options possibles.
   Supporte multiple positions, stacking, animations riches, actions, etc.
   Style principal glassmorphism avec 4 autres variantes.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Gestion des conteneurs (lignes 402-600)
   3. Méthodes de création (lignes 602-1200)
   4. Animations et interactions (lignes 1202-1500)
   5. API publique (lignes 1502-1600)
   
   DÉPENDANCES:
   - notification.css (styles complets)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const NotificationComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de notifications
        types: {
            'info': {
                name: 'Information',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>`,
                color: '#3b82f6',
                defaultDuration: 5000
            },
            'success': {
                name: 'Succès',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>`,
                color: '#22c55e',
                defaultDuration: 4000
            },
            'warning': {
                name: 'Avertissement',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>`,
                color: '#f59e0b',
                defaultDuration: 6000
            },
            'error': {
                name: 'Erreur',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>`,
                color: '#ef4444',
                defaultDuration: 0 // Pas d'auto-dismiss par défaut
            },
            'loading': {
                name: 'Chargement',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notification-spinner">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>`,
                color: '#6366f1',
                defaultDuration: 0
            },
            'custom': {
                name: 'Personnalisé',
                icon: null,
                color: 'currentColor',
                defaultDuration: 5000
            }
        },

        // Positions disponibles
        positions: {
            'top': {
                name: 'Haut centre',
                className: 'notification-container-top',
                animation: 'slideDown'
            },
            'top-left': {
                name: 'Haut gauche',
                className: 'notification-container-top-left',
                animation: 'slideRight'
            },
            'top-right': {
                name: 'Haut droite',
                className: 'notification-container-top-right',
                animation: 'slideLeft'
            },
            'bottom': {
                name: 'Bas centre',
                className: 'notification-container-bottom',
                animation: 'slideUp'
            },
            'bottom-left': {
                name: 'Bas gauche',
                className: 'notification-container-bottom-left',
                animation: 'slideRight'
            },
            'bottom-right': {
                name: 'Bas droite',
                className: 'notification-container-bottom-right',
                animation: 'slideLeft'
            },
            'center': {
                name: 'Centre',
                className: 'notification-container-center',
                animation: 'zoomIn'
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                name: 'Glassmorphism',
                description: 'Effet verre dépoli moderne',
                blur: 20,
                opacity: 0.1,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                name: 'Neumorphism',
                description: 'Style avec ombres douces',
                background: '#e0e5ec',
                shadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff'
            },
            'flat': {
                name: 'Flat',
                description: 'Design plat moderne',
                background: '#ffffff',
                border: '1px solid #e5e7eb'
            },
            'minimal': {
                name: 'Minimal',
                description: 'Design minimaliste',
                borderLeft: '4px solid currentColor',
                padding: 'compact'
            },
            'material': {
                name: 'Material',
                description: 'Material Design',
                elevation: 2,
                borderRadius: '4px'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                name: 'Aucune',
                enabled: false
            },
            'subtle': {
                name: 'Subtile',
                duration: 300,
                easing: 'ease',
                effects: ['fade', 'slide']
            },
            'smooth': {
                name: 'Fluide',
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slide', 'scale'],
                hover: {
                    scale: 1.02,
                    shadow: true
                }
            },
            'rich': {
                name: 'Riche',
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'slide', 'scale', 'rotate'],
                hover: {
                    scale: 1.05,
                    shadow: true,
                    glow: true
                },
                microInteractions: true,
                particles: true,
                blur: true
            }
        },

        // Features disponibles
        features: {
            closable: {
                name: 'Fermable',
                description: 'Bouton de fermeture',
                default: true
            },
            progress: {
                name: 'Barre de progression',
                description: 'Affiche le temps restant',
                default: false
            },
            actions: {
                name: 'Actions',
                description: 'Boutons d\'action',
                max: 3
            },
            avatar: {
                name: 'Avatar',
                description: 'Image ou icône personnalisée',
                size: 40
            },
            sound: {
                name: 'Son',
                description: 'Jouer un son à l\'apparition',
                sounds: {
                    'info': '/sounds/info.mp3',
                    'success': '/sounds/success.mp3',
                    'warning': '/sounds/warning.mp3',
                    'error': '/sounds/error.mp3'
                }
            },
            vibration: {
                name: 'Vibration',
                description: 'Vibration sur mobile',
                pattern: [100, 50, 100]
            },
            grouping: {
                name: 'Groupement',
                description: 'Grouper les notifications similaires',
                maxGroup: 3
            },
            persistence: {
                name: 'Persistance',
                description: 'Sauvegarder dans localStorage',
                key: 'notifications-history'
            }
        },

        // Tailles
        sizes: {
            'compact': {
                padding: '12px 16px',
                fontSize: '13px',
                iconSize: '16px',
                maxWidth: '280px'
            },
            'normal': {
                padding: '16px 20px',
                fontSize: '14px',
                iconSize: '20px',
                maxWidth: '380px'
            },
            'large': {
                padding: '20px 24px',
                fontSize: '16px',
                iconSize: '24px',
                maxWidth: '480px'
            },
            'full': {
                padding: '24px 32px',
                fontSize: '16px',
                iconSize: '28px',
                maxWidth: '100%'
            }
        },

        // Configuration par défaut
        defaults: {
            type: 'info',
            position: 'top-right',
            style: 'glassmorphism',
            animation: 'smooth',
            size: 'normal',
            duration: 5000,
            closable: true,
            pauseOnHover: true,
            stacking: true,
            maxStack: 5,
            stackSpacing: 8,
            offset: { x: 20, y: 20 }
        }
    };

    // État global
    const state = {
        containers: new Map(),
        notifications: new Map(),
        queue: [],
        soundEnabled: true,
        idCounter: 0
    };

    // ========================================
    // GESTION DES CONTENEURS
    // ========================================

    /**
     * Obtient ou crée un conteneur pour une position
     */
    function getContainer(position) {
        if (state.containers.has(position)) {
            return state.containers.get(position);
        }

        const container = document.createElement('div');
        container.className = `notification-container ${CONFIG.positions[position].className}`;
        container.setAttribute('data-position', position);
        container.style.zIndex = '9999';
        
        document.body.appendChild(container);
        state.containers.set(position, container);
        
        return container;
    }

    /**
     * Nettoie les conteneurs vides
     */
    function cleanupContainers() {
        state.containers.forEach((container, position) => {
            if (container.children.length === 0) {
                container.remove();
                state.containers.delete(position);
            }
        });
    }

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================

    /**
     * Génère un ID unique
     */
    function generateId() {
        return `notification-${Date.now()}-${++state.idCounter}`;
    }

    /**
     * Merge les options avec les valeurs par défaut
     */
    function mergeOptions(options = {}) {
        const defaults = { ...CONFIG.defaults };
        const typeDefaults = CONFIG.types[options.type || defaults.type];
        
        return {
            ...defaults,
            duration: typeDefaults.defaultDuration,
            ...options,
            id: options.id || generateId()
        };
    }

    /**
     * Crée la structure HTML de la notification
     */
    function createNotification(options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${options.type} notification-${options.style} notification-${options.size}`;
        notification.setAttribute('data-notification-id', options.id);
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', options.type === 'error' ? 'assertive' : 'polite');
        
        // Structure interne
        const structure = createStructure(options);
        notification.innerHTML = structure;
        
        // Appliquer les styles personnalisés
        if (options.customStyle) {
            Object.assign(notification.style, options.customStyle);
        }
        
        // Animations d'entrée
        if (options.animation !== 'none') {
            notification.style.opacity = '0';
            notification.classList.add(`animation-${options.animation}`);
        }
        
        return notification;
    }

    /**
     * Crée la structure interne
     */
    function createStructure(options) {
        const parts = [];
        
        // Conteneur principal avec effet glassmorphism
        parts.push('<div class="notification-content">');
        
        // Avatar ou icône
        if (options.avatar) {
            parts.push(`
                <div class="notification-avatar">
                    ${typeof options.avatar === 'string' 
                        ? `<img src="${options.avatar}" alt="Avatar">` 
                        : options.avatar}
                </div>
            `);
        } else if (CONFIG.types[options.type].icon) {
            parts.push(`
                <div class="notification-icon notification-icon-${options.type}">
                    ${CONFIG.types[options.type].icon}
                </div>
            `);
        }
        
        // Corps du message
        parts.push('<div class="notification-body">');
        
        // Titre
        if (options.title) {
            parts.push(`<div class="notification-title">${options.title}</div>`);
        }
        
        // Message
        parts.push(`<div class="notification-message">${options.message}</div>`);
        
        // Timestamp
        if (options.timestamp !== false) {
            const time = options.timestamp === true ? new Date().toLocaleTimeString() : options.timestamp;
            parts.push(`<div class="notification-timestamp">${time}</div>`);
        }
        
        // Actions
        if (options.actions && options.actions.length > 0) {
            parts.push('<div class="notification-actions">');
            options.actions.forEach((action, index) => {
                parts.push(`
                    <button class="notification-action" data-action-index="${index}">
                        ${action.label}
                    </button>
                `);
            });
            parts.push('</div>');
        }
        
        parts.push('</div>'); // Fin notification-body
        
        // Bouton de fermeture
        if (options.closable) {
            parts.push(`
                <button class="notification-close" aria-label="Fermer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `);
        }
        
        parts.push('</div>'); // Fin notification-content
        
        // Barre de progression
        if (options.progress && options.duration > 0) {
            parts.push(`
                <div class="notification-progress">
                    <div class="notification-progress-bar" style="animation-duration: ${options.duration}ms"></div>
                </div>
            `);
        }
        
        // Effet de brillance pour glassmorphism
        if (options.style === 'glassmorphism') {
            parts.push('<div class="notification-glow"></div>');
        }
        
        return parts.join('');
    }

    /**
     * Initialise les événements
     */
    function initializeEvents(notification, options) {
        const notificationState = state.notifications.get(options.id);
        
        // Bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => dismiss(options.id));
        }
        
        // Actions
        const actionBtns = notification.querySelectorAll('.notification-action');
        actionBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const action = options.actions[index];
                if (action.handler) {
                    action.handler();
                }
                if (action.dismiss !== false) {
                    dismiss(options.id);
                }
            });
        });
        
        // Pause on hover
        if (options.pauseOnHover && options.duration > 0) {
            notification.addEventListener('mouseenter', () => pauseTimer(options.id));
            notification.addEventListener('mouseleave', () => resumeTimer(options.id));
        }
        
        // Swipe to dismiss sur mobile
        if ('ontouchstart' in window && options.swipeToDismiss !== false) {
            initializeSwipe(notification, options);
        }
        
        // Click to dismiss
        if (options.clickToDismiss) {
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-action, .notification-close')) {
                    dismiss(options.id);
                }
            });
        }
    }

    /**
     * Initialise le swipe sur mobile
     */
    function initializeSwipe(notification, options) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        notification.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            notification.style.transition = 'none';
        });
        
        notification.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            if (Math.abs(deltaX) > 10) {
                e.preventDefault();
                notification.style.transform = `translateX(${deltaX}px)`;
                notification.style.opacity = 1 - Math.abs(deltaX) / 200;
            }
        });
        
        notification.addEventListener('touchend', () => {
            if (!isDragging) return;
            
            isDragging = false;
            notification.style.transition = '';
            
            const deltaX = currentX - startX;
            if (Math.abs(deltaX) > 100) {
                dismiss(options.id, deltaX > 0 ? 'right' : 'left');
            } else {
                notification.style.transform = '';
                notification.style.opacity = '';
            }
        });
    }

    /**
     * Affiche la notification
     */
    function show(notification, options) {
        const container = getContainer(options.position);
        
        // Gestion du stacking
        if (options.stacking) {
            const existingNotifications = container.querySelectorAll('.notification');
            if (existingNotifications.length >= options.maxStack) {
                // Retirer la plus ancienne
                const oldest = existingNotifications[0];
                const oldestId = oldest.getAttribute('data-notification-id');
                dismiss(oldestId, 'stack');
            }
        }
        
        // Ajouter au conteneur
        if (options.position.includes('bottom')) {
            container.insertBefore(notification, container.firstChild);
        } else {
            container.appendChild(notification);
        }
        
        // Forcer le reflow pour l'animation
        notification.offsetHeight;
        
        // Animation d'entrée
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.classList.add('show');
            
            if (options.animation === 'rich') {
                createEntranceEffects(notification, options);
            }
        });
        
        // Son
        if (options.sound && state.soundEnabled) {
            playSound(options.type);
        }
        
        // Vibration
        if (options.vibration && 'vibrate' in navigator) {
            navigator.vibrate(CONFIG.features.vibration.pattern);
        }
        
        // Auto-dismiss
        if (options.duration > 0) {
            const timer = setTimeout(() => dismiss(options.id), options.duration);
            state.notifications.get(options.id).timer = timer;
        }
        
        // Callback
        if (options.onShow) {
            options.onShow(notification);
        }
    }

    /**
     * Crée les effets d'entrée riches
     */
    function createEntranceEffects(notification, options) {
        // Particules
        if (options.animation === 'rich' && CONFIG.animations.rich.particles) {
            const particles = document.createElement('div');
            particles.className = 'notification-particles';
            
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'notification-particle';
                particle.style.setProperty('--delay', `${i * 0.1}s`);
                particle.style.setProperty('--angle', `${i * 45}deg`);
                particles.appendChild(particle);
            }
            
            notification.appendChild(particles);
            
            setTimeout(() => particles.remove(), 2000);
        }
        
        // Effet de vague
        const ripple = document.createElement('div');
        ripple.className = 'notification-ripple';
        notification.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 1000);
    }

    /**
     * Ferme une notification
     */
    function dismiss(id, direction = 'default') {
        const notificationData = state.notifications.get(id);
        if (!notificationData) return;
        
        const notification = document.querySelector(`[data-notification-id="${id}"]`);
        if (!notification) return;
        
        // Clear timer
        if (notificationData.timer) {
            clearTimeout(notificationData.timer);
        }
        
        // Animation de sortie
        notification.classList.add('dismiss', `dismiss-${direction}`);
        notification.style.opacity = '0';
        
        // Callback before dismiss
        if (notificationData.options.onDismiss) {
            notificationData.options.onDismiss(notification);
        }
        
        // Retirer après l'animation
        const animationDuration = CONFIG.animations[notificationData.options.animation].duration || 300;
        setTimeout(() => {
            notification.remove();
            state.notifications.delete(id);
            cleanupContainers();
            
            // Process queue
            processQueue();
        }, animationDuration);
    }

    /**
     * Met en pause le timer
     */
    function pauseTimer(id) {
        const notificationData = state.notifications.get(id);
        if (!notificationData || !notificationData.timer) return;
        
        clearTimeout(notificationData.timer);
        notificationData.pausedAt = Date.now();
        
        const progressBar = document.querySelector(`[data-notification-id="${id}"] .notification-progress-bar`);
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }

    /**
     * Reprend le timer
     */
    function resumeTimer(id) {
        const notificationData = state.notifications.get(id);
        if (!notificationData || !notificationData.pausedAt) return;
        
        const remaining = notificationData.options.duration - (notificationData.pausedAt - notificationData.startedAt);
        
        if (remaining > 0) {
            notificationData.timer = setTimeout(() => dismiss(id), remaining);
            notificationData.startedAt = Date.now() - (notificationData.options.duration - remaining);
            delete notificationData.pausedAt;
            
            const progressBar = document.querySelector(`[data-notification-id="${id}"] .notification-progress-bar`);
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
        }
    }

    /**
     * Joue un son
     */
    function playSound(type) {
        const soundUrl = CONFIG.features.sound.sounds[type];
        if (!soundUrl) return;
        
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        audio.play().catch(() => {
            // Silently fail if autoplay is blocked
        });
    }

    /**
     * Traite la file d'attente
     */
    function processQueue() {
        if (state.queue.length === 0) return;
        
        const next = state.queue.shift();
        create(next);
    }

    /**
     * Met à jour une notification existante
     */
    function update(id, updates) {
        const notificationData = state.notifications.get(id);
        if (!notificationData) return;
        
        const notification = document.querySelector(`[data-notification-id="${id}"]`);
        if (!notification) return;
        
        // Mettre à jour le contenu
        if (updates.title !== undefined) {
            const titleEl = notification.querySelector('.notification-title');
            if (titleEl) titleEl.textContent = updates.title;
        }
        
        if (updates.message !== undefined) {
            const messageEl = notification.querySelector('.notification-message');
            if (messageEl) messageEl.textContent = updates.message;
        }
        
        if (updates.type !== undefined) {
            notification.className = notification.className.replace(/notification-\w+/, `notification-${updates.type}`);
        }
        
        // Mettre à jour les options
        Object.assign(notificationData.options, updates);
    }

    /**
     * Injecte les styles CSS
     */
    function injectStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'notification-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/notification.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Crée et affiche une notification
         */
        create(options = {}) {
            const finalOptions = mergeOptions(options);
            
            // Vérifier la file d'attente
            if (options.queue && state.notifications.size > 0) {
                state.queue.push(finalOptions);
                return { id: finalOptions.id };
            }
            
            // Créer la notification
            const notification = createNotification(finalOptions);
            
            // Stocker l'état
            state.notifications.set(finalOptions.id, {
                element: notification,
                options: finalOptions,
                startedAt: Date.now()
            });
            
            // Initialiser les événements
            initializeEvents(notification, finalOptions);
            
            // Afficher
            show(notification, finalOptions);
            
            // Injecter les styles si nécessaire
            if (finalOptions.injectStyles !== false) {
                injectStyles();
            }
            
            return {
                id: finalOptions.id,
                dismiss: () => dismiss(finalOptions.id),
                update: (updates) => update(finalOptions.id, updates),
                pause: () => pauseTimer(finalOptions.id),
                resume: () => resumeTimer(finalOptions.id)
            };
        },
        
        /**
         * Méthodes raccourcies par type
         */
        info(message, options = {}) {
            return this.create({ ...options, message, type: 'info' });
        },
        
        success(message, options = {}) {
            return this.create({ ...options, message, type: 'success' });
        },
        
        warning(message, options = {}) {
            return this.create({ ...options, message, type: 'warning' });
        },
        
        error(message, options = {}) {
            return this.create({ ...options, message, type: 'error' });
        },
        
        loading(message, options = {}) {
            return this.create({ ...options, message, type: 'loading', duration: 0 });
        },
        
        /**
         * Notification avec promesse
         */
        async promise(promise, options = {}) {
            const { pending = 'Chargement...', success = 'Succès!', error = 'Erreur!' } = options;
            
            const notification = this.loading(pending, options);
            
            try {
                const result = await promise;
                notification.update({ type: 'success', message: success });
                setTimeout(() => notification.dismiss(), 2000);
                return result;
            } catch (err) {
                notification.update({ type: 'error', message: error, duration: 0 });
                throw err;
            }
        },
        
        /**
         * Ferme toutes les notifications
         */
        dismissAll() {
            state.notifications.forEach((_, id) => dismiss(id));
        },
        
        /**
         * Ferme les notifications d'une position
         */
        dismissByPosition(position) {
            state.notifications.forEach((data, id) => {
                if (data.options.position === position) {
                    dismiss(id);
                }
            });
        },
        
        /**
         * Configure les options globales
         */
        setDefaults(options) {
            Object.assign(CONFIG.defaults, options);
        },
        
        /**
         * Active/désactive le son
         */
        setSound(enabled) {
            state.soundEnabled = enabled;
        },
        
        /**
         * Obtient toutes les notifications actives
         */
        getAll() {
            return Array.from(state.notifications.entries()).map(([id, data]) => ({
                id,
                ...data.options
            }));
        },
        
        /**
         * Exposer la configuration
         */
        CONFIG,
        
        /**
         * Injection manuelle des styles
         */
        injectStyles
    };
})();

// Export pour utilisation
export default NotificationComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Gestion du z-index avec multiple positions
   Solution: Conteneurs séparés par position avec z-index élevé
   
   [DATE] - Performance avec beaucoup de notifications
   Solution: Limite de stack et nettoyage automatique
   
   [DATE] - Animations fluides sur mobile
   Solution: Transform au lieu de position pour les animations
   
   NOTES POUR REPRISES FUTURES:
   - Les notifications utilisent des conteneurs par position
   - Le stacking est géré automatiquement
   - Les timers peuvent être mis en pause
   - Le swipe to dismiss nécessite preventDefault
   ======================================== */