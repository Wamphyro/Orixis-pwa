/* ========================================
   TOAST.COMPONENT.JS - Système de notifications toast
   Chemin: src/js/shared/ui/feedback/toast.component.js
   
   DESCRIPTION:
   Système complet de notifications toast avec effet glassmorphism.
   Gère une file d'attente de toasts avec animations, positions multiples,
   et options de personnalisation avancées.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-150)
   2. Gestionnaire de file d'attente (lignes 152-250)
   3. Création et rendu (lignes 252-450)
   4. Gestion des animations (lignes 452-550)
   5. API publique (lignes 552-650)
   
   DÉPENDANCES:
   - toast.css (styles associés)
   - Aucune dépendance externe
   ======================================== */

const Toast = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Conteneur global
        containerId: 'toast-container',
        
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.1
            },
            'neumorphism': {
                class: 'neumorphism'
            },
            'flat': {
                class: 'flat'
            },
            'minimal': {
                class: 'minimal'
            },
            'material': {
                class: 'material'
            }
        },
        
        // Types de toasts
        types: {
            'info': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
                defaultDuration: 4000
            },
            'success': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                defaultDuration: 3000
            },
            'warning': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                defaultDuration: 5000
            },
            'error': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                defaultDuration: 6000
            },
            'loading': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
                defaultDuration: null // Infini
            }
        },
        
        // Positions
        positions: {
            'top': { class: 'position-top' },
            'top-left': { class: 'position-top-left' },
            'top-right': { class: 'position-top-right' },
            'bottom': { class: 'position-bottom' },
            'bottom-left': { class: 'position-bottom-left' },
            'bottom-right': { class: 'position-bottom-right' }
        },
        
        // Animations
        animations: {
            'slide': {
                in: 'animate-slide-in',
                out: 'animate-slide-out'
            },
            'fade': {
                in: 'animate-fade-in',
                out: 'animate-fade-out'
            },
            'bounce': {
                in: 'animate-bounce-in',
                out: 'animate-bounce-out'
            },
            'zoom': {
                in: 'animate-zoom-in',
                out: 'animate-zoom-out'
            },
            'flip': {
                in: 'animate-flip-in',
                out: 'animate-flip-out'
            }
        },
        
        // Tailles
        sizes: {
            'small': { class: 'small' },
            'medium': { class: 'medium' },
            'large': { class: 'large' },
            'compact': { class: 'compact' }
        },
        
        // Options par défaut
        defaults: {
            type: 'info',
            style: 'glassmorphism',
            position: 'top-right',
            animation: 'slide',
            size: 'medium',
            duration: 4000,
            pauseOnHover: true,
            closeButton: true,
            progressBar: true,
            stackable: true,
            maxStack: 5,
            newestOnTop: true,
            offset: 16,
            rtl: false,
            escapeHtml: true
        }
    };

    // ========================================
    // GESTIONNAIRE D'ÉTAT
    // ========================================
    const state = {
        toasts: new Map(),
        containers: new Map(),
        activeCount: 0,
        idCounter: 0
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    function generateId() {
        return `toast-${++state.idCounter}-${Date.now()}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getContainer(position) {
        if (!state.containers.has(position)) {
            const container = document.createElement('div');
            container.className = `toast-container ${CONFIG.positions[position].class}`;
            container.setAttribute('role', 'region');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-label', 'Notifications');
            document.body.appendChild(container);
            state.containers.set(position, container);
        }
        return state.containers.get(position);
    }

    // ========================================
    // CRÉATION DU TOAST
    // ========================================
    function createToastElement(options) {
        const toast = document.createElement('div');
        const id = generateId();
        
        // Classes
        const classes = [
            'toast',
            CONFIG.styles[options.style].class,
            CONFIG.types[options.type].class || options.type,
            CONFIG.sizes[options.size].class,
            CONFIG.animations[options.animation].in
        ];
        
        if (options.className) {
            classes.push(options.className);
        }
        
        if (options.rtl) {
            classes.push('rtl');
        }
        
        toast.className = classes.join(' ');
        toast.id = id;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        // Structure interne
        let html = '<div class="toast-inner">';
        
        // Icône
        if (options.icon !== false) {
            const icon = options.icon || CONFIG.types[options.type].icon;
            html += `<div class="toast-icon">${icon}</div>`;
        }
        
        // Contenu
        html += '<div class="toast-content">';
        
        if (options.title) {
            const title = options.escapeHtml ? escapeHtml(options.title) : options.title;
            html += `<div class="toast-title">${title}</div>`;
        }
        
        if (options.message) {
            const message = options.escapeHtml ? escapeHtml(options.message) : options.message;
            html += `<div class="toast-message">${message}</div>`;
        }
        
        // Actions personnalisées
        if (options.actions && options.actions.length > 0) {
            html += '<div class="toast-actions">';
            options.actions.forEach((action, index) => {
                const actionId = `${id}-action-${index}`;
                html += `<button class="toast-action" id="${actionId}">${action.label}</button>`;
            });
            html += '</div>';
        }
        
        html += '</div>'; // toast-content
        
        // Bouton de fermeture
        if (options.closeButton) {
            html += `
                <button class="toast-close" aria-label="Fermer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
        }
        
        html += '</div>'; // toast-inner
        
        // Barre de progression
        if (options.progressBar && options.duration) {
            html += `
                <div class="toast-progress">
                    <div class="toast-progress-bar" style="animation-duration: ${options.duration}ms"></div>
                </div>
            `;
        }
        
        toast.innerHTML = html;
        
        // Attacher les gestionnaires d'événements
        attachEventHandlers(toast, options, id);
        
        return { element: toast, id };
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    function attachEventHandlers(toast, options, id) {
        let timeoutId;
        let remainingTime = options.duration;
        let startTime;
        
        // Fonction de fermeture
        const close = () => {
            removeToast(id, options);
        };
        
        // Auto-fermeture
        const startTimer = () => {
            if (options.duration) {
                startTime = Date.now();
                timeoutId = setTimeout(close, remainingTime);
            }
        };
        
        const pauseTimer = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                remainingTime -= Date.now() - startTime;
                
                // Pause animation progress bar
                const progressBar = toast.querySelector('.toast-progress-bar');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
            }
        };
        
        const resumeTimer = () => {
            if (options.duration && remainingTime > 0) {
                startTimer();
                
                // Resume animation progress bar
                const progressBar = toast.querySelector('.toast-progress-bar');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
            }
        };
        
        // Pause on hover
        if (options.pauseOnHover) {
            toast.addEventListener('mouseenter', pauseTimer);
            toast.addEventListener('mouseleave', resumeTimer);
            toast.addEventListener('focusin', pauseTimer);
            toast.addEventListener('focusout', resumeTimer);
        }
        
        // Bouton de fermeture
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }
        
        // Actions personnalisées
        if (options.actions) {
            options.actions.forEach((action, index) => {
                const btn = toast.querySelector(`#${id}-action-${index}`);
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        if (action.handler) {
                            action.handler(e, { close, toast, id });
                        }
                        if (action.closeOnClick !== false) {
                            close();
                        }
                    });
                }
            });
        }
        
        // Click to close
        if (options.clickToClose) {
            toast.addEventListener('click', (e) => {
                if (!e.target.closest('.toast-action') && !e.target.closest('.toast-close')) {
                    close();
                }
            });
        }
        
        // Swipe to dismiss (pour mobile)
        if (options.swipeToDismiss && 'ontouchstart' in window) {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            toast.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            });
            
            toast.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
                const diffX = currentX - startX;
                toast.style.transform = `translateX(${diffX}px)`;
                toast.style.opacity = 1 - Math.abs(diffX) / 200;
            });
            
            toast.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                const diffX = currentX - startX;
                
                if (Math.abs(diffX) > 100) {
                    toast.style.transform = `translateX(${diffX > 0 ? '100%' : '-100%'})`;
                    close();
                } else {
                    toast.style.transform = '';
                    toast.style.opacity = '';
                }
            });
        }
        
        // Démarrer le timer
        startTimer();
        
        // Stocker les références
        state.toasts.set(id, {
            element: toast,
            options,
            timeoutId,
            close
        });
    }

    // ========================================
    // AFFICHAGE ET SUPPRESSION
    // ========================================
    function showToast(options) {
        // Fusionner avec les options par défaut
        const opts = { ...CONFIG.defaults, ...options };
        
        // Créer l'élément
        const { element, id } = createToastElement(opts);
        
        // Obtenir le conteneur
        const container = getContainer(opts.position);
        
        // Gestion du stack
        if (opts.stackable) {
            const existingToasts = container.querySelectorAll('.toast');
            if (existingToasts.length >= opts.maxStack) {
                // Supprimer les plus anciens
                const toRemove = existingToasts.length - opts.maxStack + 1;
                for (let i = 0; i < toRemove; i++) {
                    const oldToast = opts.newestOnTop ? 
                        existingToasts[existingToasts.length - 1 - i] : 
                        existingToasts[i];
                    const oldId = oldToast.id;
                    if (state.toasts.has(oldId)) {
                        removeToast(oldId, state.toasts.get(oldId).options);
                    }
                }
            }
        } else {
            // Supprimer tous les toasts existants
            container.querySelectorAll('.toast').forEach(toast => {
                const toastId = toast.id;
                if (state.toasts.has(toastId)) {
                    removeToast(toastId, state.toasts.get(toastId).options);
                }
            });
        }
        
        // Ajouter au conteneur
        if (opts.newestOnTop) {
            container.insertBefore(element, container.firstChild);
        } else {
            container.appendChild(element);
        }
        
        // Forcer le reflow pour l'animation
        element.offsetHeight;
        
        // Ajouter la classe visible
        requestAnimationFrame(() => {
            element.classList.add('visible');
        });
        
        // Callback onShow
        if (opts.onShow) {
            opts.onShow(element, id);
        }
        
        state.activeCount++;
        
        return id;
    }

    function removeToast(id, options) {
        const toastData = state.toasts.get(id);
        if (!toastData) return;
        
        const { element, timeoutId } = toastData;
        
        // Clear timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // Animation de sortie
        element.classList.remove(CONFIG.animations[options.animation].in);
        element.classList.add(CONFIG.animations[options.animation].out);
        
        // Callback onHide
        if (options.onHide) {
            options.onHide(element, id);
        }
        
        // Supprimer après l'animation
        element.addEventListener('animationend', () => {
            element.remove();
            state.toasts.delete(id);
            state.activeCount--;
            
            // Nettoyer le conteneur si vide
            const container = element.parentElement;
            if (container && container.children.length === 0) {
                container.remove();
                // Trouver et supprimer de la map
                for (const [pos, cont] of state.containers.entries()) {
                    if (cont === container) {
                        state.containers.delete(pos);
                        break;
                    }
                }
            }
            
            // Callback onRemove
            if (options.onRemove) {
                options.onRemove(id);
            }
        }, { once: true });
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function clearAll() {
        state.toasts.forEach((toastData, id) => {
            removeToast(id, toastData.options);
        });
    }

    function clearByType(type) {
        state.toasts.forEach((toastData, id) => {
            if (toastData.options.type === type) {
                removeToast(id, toastData.options);
            }
        });
    }

    function update(id, updates) {
        const toastData = state.toasts.get(id);
        if (!toastData) return;
        
        const { element } = toastData;
        
        // Mettre à jour le titre
        if (updates.title !== undefined) {
            const titleEl = element.querySelector('.toast-title');
            if (titleEl) {
                titleEl.textContent = updates.title;
            }
        }
        
        // Mettre à jour le message
        if (updates.message !== undefined) {
            const messageEl = element.querySelector('.toast-message');
            if (messageEl) {
                messageEl.textContent = updates.message;
            }
        }
        
        // Mettre à jour le type
        if (updates.type !== undefined) {
            // Supprimer l'ancienne classe
            Object.keys(CONFIG.types).forEach(t => {
                element.classList.remove(t);
            });
            // Ajouter la nouvelle
            element.classList.add(updates.type);
            
            // Mettre à jour l'icône si nécessaire
            if (updates.icon !== false) {
                const iconEl = element.querySelector('.toast-icon');
                if (iconEl) {
                    iconEl.innerHTML = updates.icon || CONFIG.types[updates.type].icon;
                }
            }
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Méthodes principales
        show(options = {}) {
            if (typeof options === 'string') {
                options = { message: options };
            }
            return showToast(options);
        },
        
        // Méthodes raccourcies par type
        info(message, options = {}) {
            return showToast({ ...options, message, type: 'info' });
        },
        
        success(message, options = {}) {
            return showToast({ ...options, message, type: 'success' });
        },
        
        warning(message, options = {}) {
            return showToast({ ...options, message, type: 'warning' });
        },
        
        error(message, options = {}) {
            return showToast({ ...options, message, type: 'error' });
        },
        
        loading(message, options = {}) {
            return showToast({ ...options, message, type: 'loading', duration: null });
        },
        
        // Promesse toast
        promise(promise, messages, options = {}) {
            const id = this.loading(messages.loading || 'Chargement...', options);
            
            return promise
                .then(result => {
                    this.update(id, {
                        type: 'success',
                        message: messages.success || 'Succès!',
                        duration: CONFIG.defaults.duration
                    });
                    return result;
                })
                .catch(error => {
                    this.update(id, {
                        type: 'error',
                        message: messages.error || 'Erreur!',
                        duration: CONFIG.defaults.duration * 1.5
                    });
                    throw error;
                });
        },
        
        // Gestion
        remove(id) {
            const toastData = state.toasts.get(id);
            if (toastData) {
                removeToast(id, toastData.options);
            }
        },
        
        update,
        clear: clearAll,
        clearByType,
        
        // Configuration
        setDefaults(defaults) {
            Object.assign(CONFIG.defaults, defaults);
        },
        
        getConfig() {
            return { ...CONFIG };
        },
        
        // État
        getActiveToasts() {
            return Array.from(state.toasts.entries()).map(([id, data]) => ({
                id,
                options: data.options
            }));
        },
        
        getActiveCount() {
            return state.activeCount;
        },
        
        // Injection des styles (pour lazy loading)
        injectStyles() {
            if (document.getElementById('toast-styles')) return;
            
            const link = document.createElement('link');
            link.id = 'toast-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/toast.css';
            document.head.appendChild(link);
        }
    };
})();

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Gestion du z-index
   Solution: Utilisation d'un conteneur par position
   
   [2024-01] - Animation de sortie coupée
   Cause: Suppression trop rapide du DOM
   Résolution: Attendre animationend
   
   [2024-01] - Performance avec beaucoup de toasts
   Solution: Limite maxStack et suppression automatique
   
   NOTES POUR REPRISES FUTURES:
   - Le système de file d'attente gère automatiquement le stack
   - Les animations sont gérées par CSS pour la performance
   - Le pauseOnHover fonctionne aussi avec le focus (accessibilité)
   - Support du swipe to dismiss sur mobile
   ======================================== */