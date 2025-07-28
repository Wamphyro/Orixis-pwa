/* ========================================
   POPOVER.COMPONENT.JS - Système de popovers glassmorphism
   Chemin: src/js/shared/ui/elements/popover.component.js
   
   DESCRIPTION:
   Composant popover complet avec toutes les options possibles.
   Supporte tous les styles, positions, triggers et animations.
   Intègre le positionnement automatique et la gestion des débordements.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Gestionnaire d'instances (lignes 202-250)
   3. Méthodes de création (lignes 252-500)
   4. Gestion du positionnement (lignes 502-700)
   5. Gestion des événements (lignes 702-900)
   6. Méthodes utilitaires (lignes 902-1100)
   7. API publique (lignes 1102-1150)
   
   DÉPENDANCES:
   - popover.css (tous les styles)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const Popover = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                backdrop: true,
                blur: 20,
                opacity: 0.08,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            },
            'material': {
                class: 'material',
                elevation: 8,
                radius: 4
            },
            'neumorphism': {
                class: 'neumorphism',
                lightShadow: '#ffffff',
                darkShadow: '#a3b1c6'
            },
            'flat': {
                class: 'flat',
                background: '#ffffff',
                border: '#e5e7eb'
            },
            'minimal': {
                class: 'minimal',
                padding: 'compact'
            },
            'bordered': {
                class: 'bordered',
                borderWidth: 2
            },
            'gradient': {
                class: 'gradient',
                from: '#667eea',
                to: '#764ba2'
            },
            'dark': {
                class: 'dark',
                background: 'rgba(0, 0, 0, 0.9)'
            }
        },

        // Positions possibles
        positions: {
            'top': { main: 'top', cross: 'center' },
            'top-start': { main: 'top', cross: 'start' },
            'top-end': { main: 'top', cross: 'end' },
            'bottom': { main: 'bottom', cross: 'center' },
            'bottom-start': { main: 'bottom', cross: 'start' },
            'bottom-end': { main: 'bottom', cross: 'end' },
            'left': { main: 'left', cross: 'center' },
            'left-start': { main: 'left', cross: 'start' },
            'left-end': { main: 'left', cross: 'end' },
            'right': { main: 'right', cross: 'center' },
            'right-start': { main: 'right', cross: 'start' },
            'right-end': { main: 'right', cross: 'end' },
            'auto': { main: 'auto', cross: 'auto' },
            'auto-start': { main: 'auto', cross: 'start' },
            'auto-end': { main: 'auto', cross: 'end' }
        },

        // Déclencheurs
        triggers: {
            'hover': {
                showEvents: ['mouseenter', 'focus'],
                hideEvents: ['mouseleave', 'blur'],
                delay: { show: 200, hide: 100 }
            },
            'click': {
                showEvents: ['click'],
                hideEvents: ['click'],
                toggle: true
            },
            'focus': {
                showEvents: ['focus'],
                hideEvents: ['blur'],
                delay: { show: 0, hide: 0 }
            },
            'manual': {
                showEvents: [],
                hideEvents: []
            },
            'contextmenu': {
                showEvents: ['contextmenu'],
                hideEvents: ['click', 'contextmenu'],
                preventDefault: true
            },
            'hover-click': {
                showEvents: ['mouseenter', 'click'],
                hideEvents: ['mouseleave'],
                persist: true
            }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'fade': {
                keyframes: {
                    in: [
                        { opacity: 0 },
                        { opacity: 1 }
                    ],
                    out: [
                        { opacity: 1 },
                        { opacity: 0 }
                    ]
                },
                duration: 200
            },
            'scale': {
                keyframes: {
                    in: [
                        { opacity: 0, transform: 'scale(0.8)' },
                        { opacity: 1, transform: 'scale(1)' }
                    ],
                    out: [
                        { opacity: 1, transform: 'scale(1)' },
                        { opacity: 0, transform: 'scale(0.8)' }
                    ]
                },
                duration: 250,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'slide': {
                keyframes: {
                    in: [
                        { opacity: 0, transform: 'translateY(-10px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    out: [
                        { opacity: 1, transform: 'translateY(0)' },
                        { opacity: 0, transform: 'translateY(-10px)' }
                    ]
                },
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'bounce': {
                keyframes: {
                    in: [
                        { opacity: 0, transform: 'scale(0.5) translateY(-20px)' },
                        { opacity: 0.8, transform: 'scale(1.1) translateY(5px)' },
                        { opacity: 1, transform: 'scale(1) translateY(0)' }
                    ]
                },
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            'reveal': {
                keyframes: {
                    in: [
                        { opacity: 0, clipPath: 'circle(0% at 50% 50%)' },
                        { opacity: 1, clipPath: 'circle(100% at 50% 50%)' }
                    ]
                },
                duration: 400
            },
            'swing': {
                keyframes: {
                    in: [
                        { opacity: 0, transform: 'rotate(-5deg) scale(0.9)' },
                        { opacity: 1, transform: 'rotate(0deg) scale(1)' }
                    ]
                },
                duration: 500,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }
        },

        // Tailles prédéfinies
        sizes: {
            'auto': { width: 'auto', maxWidth: '320px' },
            'small': { width: '200px' },
            'medium': { width: '300px' },
            'large': { width: '400px' },
            'xlarge': { width: '500px' },
            'content': { width: 'max-content', maxWidth: '90vw' }
        },

        // Options par défaut
        defaults: {
            style: 'glassmorphism',
            position: 'top',
            trigger: 'hover',
            animation: 'scale',
            size: 'auto',
            offset: 8,
            arrow: true,
            interactive: true,
            appendTo: 'body',
            zIndex: 9999,
            closeOnClickOutside: true,
            closeOnScroll: false,
            autoHide: true,
            hideDelay: 3000,
            maxWidth: 320,
            boundary: 'viewport',
            flip: true,
            preventOverflow: true,
            gpuAcceleration: true
        }
    };

    // ========================================
    // GESTIONNAIRE D'INSTANCES
    // ========================================
    const instances = new Map();
    let instanceId = 0;

    // Stockage des timeouts
    const timeouts = new WeakMap();

    // État global
    let stylesInjected = false;

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Injection des styles CSS
     */
    function injectStyles() {
        if (stylesInjected) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/popover.css';
        document.head.appendChild(link);

        stylesInjected = true;
    }

    /**
     * Génération d'ID unique
     */
    function generateId() {
        return `popover-${Date.now()}-${++instanceId}`;
    }

    /**
     * Création de la structure HTML
     */
    function createPopoverElement(options) {
        const { style, arrow, content, title, className } = options;
        const popover = document.createElement('div');
        const id = generateId();

        popover.id = id;
        popover.className = `popover ${CONFIG.styles[style].class}`;
        popover.setAttribute('role', 'tooltip');
        popover.setAttribute('aria-hidden', 'true');

        // Classes additionnelles
        if (className) {
            popover.classList.add(...className.split(' '));
        }

        // Structure interne
        const inner = document.createElement('div');
        inner.className = 'popover-inner';

        // Titre optionnel
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'popover-title';
            titleEl.textContent = title;
            inner.appendChild(titleEl);
        }

        // Contenu
        const contentEl = document.createElement('div');
        contentEl.className = 'popover-content';
        
        if (typeof content === 'string') {
            contentEl.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentEl.appendChild(content);
        } else if (typeof content === 'function') {
            contentEl.appendChild(content());
        }

        inner.appendChild(contentEl);
        popover.appendChild(inner);

        // Flèche
        if (arrow) {
            const arrowEl = document.createElement('div');
            arrowEl.className = 'popover-arrow';
            arrowEl.innerHTML = '<div class="popover-arrow-inner"></div>';
            popover.appendChild(arrowEl);
        }

        return popover;
    }

    /**
     * Calcul de la position
     */
    function calculatePosition(trigger, popover, options) {
        const { position, offset, boundary, flip, preventOverflow } = options;
        const triggerRect = trigger.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();
        
        // Limites
        const viewport = {
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight
        };

        if (boundary === 'scrollParent') {
            const scrollParent = getScrollParent(trigger);
            const scrollRect = scrollParent.getBoundingClientRect();
            Object.assign(viewport, {
                top: Math.max(0, scrollRect.top),
                left: Math.max(0, scrollRect.left),
                right: Math.min(window.innerWidth, scrollRect.right),
                bottom: Math.min(window.innerHeight, scrollRect.bottom)
            });
        }

        // Position de base
        let top = 0;
        let left = 0;
        let actualPosition = position;

        // Calcul selon la position
        const positions = position === 'auto' ? 
            ['top', 'right', 'bottom', 'left'] : 
            [position];

        for (const pos of positions) {
            const coords = getPositionCoords(triggerRect, popoverRect, pos, offset);
            
            if (preventOverflow) {
                const overflow = checkOverflow(coords, popoverRect, viewport);
                
                if (!overflow || position !== 'auto') {
                    top = coords.top;
                    left = coords.left;
                    actualPosition = pos;
                    break;
                }
            } else {
                top = coords.top;
                left = coords.left;
                actualPosition = pos;
                break;
            }
        }

        // Retournement si nécessaire
        if (flip && preventOverflow) {
            const overflow = checkOverflow({ top, left }, popoverRect, viewport);
            
            if (overflow) {
                const flippedPos = getFlippedPosition(actualPosition);
                const flippedCoords = getPositionCoords(triggerRect, popoverRect, flippedPos, offset);
                const flippedOverflow = checkOverflow(flippedCoords, popoverRect, viewport);
                
                if (!flippedOverflow) {
                    top = flippedCoords.top;
                    left = flippedCoords.left;
                    actualPosition = flippedPos;
                }
            }
        }

        // Contraindre aux limites
        if (preventOverflow) {
            top = Math.max(viewport.top, Math.min(top, viewport.bottom - popoverRect.height));
            left = Math.max(viewport.left, Math.min(left, viewport.right - popoverRect.width));
        }

        return { top, left, position: actualPosition };
    }

    /**
     * Obtenir les coordonnées pour une position
     */
    function getPositionCoords(triggerRect, popoverRect, position, offset) {
        const coords = { top: 0, left: 0 };

        switch (position) {
            case 'top':
                coords.top = triggerRect.top - popoverRect.height - offset;
                coords.left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
                break;
            case 'top-start':
                coords.top = triggerRect.top - popoverRect.height - offset;
                coords.left = triggerRect.left;
                break;
            case 'top-end':
                coords.top = triggerRect.top - popoverRect.height - offset;
                coords.left = triggerRect.right - popoverRect.width;
                break;
            case 'bottom':
                coords.top = triggerRect.bottom + offset;
                coords.left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
                break;
            case 'bottom-start':
                coords.top = triggerRect.bottom + offset;
                coords.left = triggerRect.left;
                break;
            case 'bottom-end':
                coords.top = triggerRect.bottom + offset;
                coords.left = triggerRect.right - popoverRect.width;
                break;
            case 'left':
                coords.top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
                coords.left = triggerRect.left - popoverRect.width - offset;
                break;
            case 'left-start':
                coords.top = triggerRect.top;
                coords.left = triggerRect.left - popoverRect.width - offset;
                break;
            case 'left-end':
                coords.top = triggerRect.bottom - popoverRect.height;
                coords.left = triggerRect.left - popoverRect.width - offset;
                break;
            case 'right':
                coords.top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
                coords.left = triggerRect.right + offset;
                break;
            case 'right-start':
                coords.top = triggerRect.top;
                coords.left = triggerRect.right + offset;
                break;
            case 'right-end':
                coords.top = triggerRect.bottom - popoverRect.height;
                coords.left = triggerRect.right + offset;
                break;
        }

        // Ajout du scroll
        coords.top += window.pageYOffset;
        coords.left += window.pageXOffset;

        return coords;
    }

    /**
     * Vérifier le débordement
     */
    function checkOverflow(coords, rect, viewport) {
        return coords.top < viewport.top ||
               coords.left < viewport.left ||
               coords.top + rect.height > viewport.bottom ||
               coords.left + rect.width > viewport.right;
    }

    /**
     * Obtenir la position opposée
     */
    function getFlippedPosition(position) {
        const flips = {
            'top': 'bottom',
            'top-start': 'bottom-start',
            'top-end': 'bottom-end',
            'bottom': 'top',
            'bottom-start': 'top-start',
            'bottom-end': 'top-end',
            'left': 'right',
            'left-start': 'right-start',
            'left-end': 'right-end',
            'right': 'left',
            'right-start': 'left-start',
            'right-end': 'left-end'
        };
        return flips[position] || position;
    }

    /**
     * Obtenir le parent scrollable
     */
    function getScrollParent(element) {
        let parent = element.parentElement;
        
        while (parent) {
            const overflow = getComputedStyle(parent).overflow;
            if (overflow !== 'visible') {
                return parent;
            }
            parent = parent.parentElement;
        }
        
        return document.documentElement;
    }

    /**
     * Mise à jour de la position de la flèche
     */
    function updateArrowPosition(popover, position) {
        const arrow = popover.querySelector('.popover-arrow');
        if (!arrow) return;

        // Réinitialiser les classes
        arrow.className = 'popover-arrow';

        // Ajouter la classe de position
        const mainPosition = position.split('-')[0];
        arrow.classList.add(`arrow-${mainPosition}`);
    }

    /**
     * Afficher le popover
     */
    function show(instance) {
        const { trigger, popover, options } = instance;
        
        // Annuler le timeout de masquage
        const hideTimeout = timeouts.get(instance);
        if (hideTimeout) {
            clearTimeout(hideTimeout.hide);
        }

        // Si déjà visible
        if (instance.visible) return;

        // Événement before show
        const beforeShowEvent = new CustomEvent('popover:beforeshow', {
            detail: { instance },
            cancelable: true
        });
        
        if (!trigger.dispatchEvent(beforeShowEvent)) return;

        // Ajouter au DOM si nécessaire
        if (!popover.parentElement) {
            const container = document.querySelector(options.appendTo) || document.body;
            container.appendChild(popover);
        }

        // Forcer le reflow
        popover.offsetHeight;

        // Calculer la position
        const positionData = calculatePosition(trigger, popover, options);
        
        // Appliquer la position
        Object.assign(popover.style, {
            position: options.gpuAcceleration ? 'fixed' : 'absolute',
            top: `${positionData.top}px`,
            left: `${positionData.left}px`,
            zIndex: options.zIndex,
            willChange: 'transform, opacity'
        });

        // Mettre à jour la flèche
        updateArrowPosition(popover, positionData.position);

        // Mettre à jour l'accessibilité
        popover.setAttribute('aria-hidden', 'false');
        trigger.setAttribute('aria-describedby', popover.id);

        // Animation d'entrée
        const animation = CONFIG.animations[options.animation];
        
        if (animation && animation.enabled !== false) {
            popover.animate(animation.keyframes.in, {
                duration: animation.duration,
                easing: animation.easing || 'ease-out',
                fill: 'forwards'
            }).onfinish = () => {
                popover.classList.add('is-visible');
                instance.visible = true;

                // Événement after show
                trigger.dispatchEvent(new CustomEvent('popover:show', {
                    detail: { instance }
                }));

                // Auto-hide
                if (options.autoHide && options.hideDelay > 0) {
                    const timeout = setTimeout(() => hide(instance), options.hideDelay);
                    timeouts.set(instance, { ...timeouts.get(instance), hide: timeout });
                }
            };
        } else {
            popover.classList.add('is-visible');
            instance.visible = true;

            trigger.dispatchEvent(new CustomEvent('popover:show', {
                detail: { instance }
            }));

            if (options.autoHide && options.hideDelay > 0) {
                const timeout = setTimeout(() => hide(instance), options.hideDelay);
                timeouts.set(instance, { ...timeouts.get(instance), hide: timeout });
            }
        }

        // Ajouter les écouteurs globaux
        if (options.closeOnClickOutside) {
            setTimeout(() => {
                document.addEventListener('click', instance.handleClickOutside);
            }, 0);
        }

        if (options.closeOnScroll) {
            window.addEventListener('scroll', instance.handleScroll, true);
        }

        // Gestion du redimensionnement
        window.addEventListener('resize', instance.handleResize);
    }

    /**
     * Masquer le popover
     */
    function hide(instance) {
        const { trigger, popover, options } = instance;
        
        // Si déjà caché
        if (!instance.visible) return;

        // Événement before hide
        const beforeHideEvent = new CustomEvent('popover:beforehide', {
            detail: { instance },
            cancelable: true
        });
        
        if (!trigger.dispatchEvent(beforeHideEvent)) return;

        // Animation de sortie
        const animation = CONFIG.animations[options.animation];
        
        if (animation && animation.enabled !== false && animation.keyframes.out) {
            popover.animate(animation.keyframes.out, {
                duration: animation.duration,
                easing: animation.easing || 'ease-in',
                fill: 'forwards'
            }).onfinish = () => {
                finishHiding();
            };
        } else {
            finishHiding();
        }

        function finishHiding() {
            popover.classList.remove('is-visible');
            popover.setAttribute('aria-hidden', 'true');
            trigger.removeAttribute('aria-describedby');
            
            instance.visible = false;

            // Retirer du DOM si configuré
            if (options.appendTo !== 'body' && popover.parentElement) {
                popover.remove();
            }

            // Événement after hide
            trigger.dispatchEvent(new CustomEvent('popover:hide', {
                detail: { instance }
            }));

            // Retirer les écouteurs globaux
            document.removeEventListener('click', instance.handleClickOutside);
            window.removeEventListener('scroll', instance.handleScroll, true);
            window.removeEventListener('resize', instance.handleResize);
        }
    }

    /**
     * Basculer la visibilité
     */
    function toggle(instance) {
        instance.visible ? hide(instance) : show(instance);
    }

    /**
     * Gestionnaires d'événements
     */
    function setupEventHandlers(instance) {
        const { trigger, options } = instance;
        const triggerConfig = CONFIG.triggers[options.trigger];

        // Gestionnaire de clic extérieur
        instance.handleClickOutside = (e) => {
            if (!instance.popover.contains(e.target) && 
                !trigger.contains(e.target) &&
                instance.visible) {
                hide(instance);
            }
        };

        // Gestionnaire de scroll
        instance.handleScroll = () => {
            if (instance.visible) {
                if (options.closeOnScroll) {
                    hide(instance);
                } else {
                    // Recalculer la position
                    const positionData = calculatePosition(trigger, instance.popover, options);
                    Object.assign(instance.popover.style, {
                        top: `${positionData.top}px`,
                        left: `${positionData.left}px`
                    });
                }
            }
        };

        // Gestionnaire de redimensionnement
        instance.handleResize = debounce(() => {
            if (instance.visible) {
                const positionData = calculatePosition(trigger, instance.popover, options);
                Object.assign(instance.popover.style, {
                    top: `${positionData.top}px`,
                    left: `${positionData.left}px`
                });
                updateArrowPosition(instance.popover, positionData.position);
            }
        }, 100);

        // Événements de déclenchement
        triggerConfig.showEvents.forEach(event => {
            trigger.addEventListener(event, (e) => {
                if (triggerConfig.preventDefault) {
                    e.preventDefault();
                }

                if (triggerConfig.toggle && instance.visible) {
                    hide(instance);
                } else {
                    // Délai d'affichage
                    if (triggerConfig.delay?.show > 0) {
                        const timeout = setTimeout(() => show(instance), triggerConfig.delay.show);
                        timeouts.set(instance, { ...timeouts.get(instance), show: timeout });
                    } else {
                        show(instance);
                    }
                }
            });
        });

        triggerConfig.hideEvents.forEach(event => {
            trigger.addEventListener(event, () => {
                if (!triggerConfig.persist || !instance.popover.matches(':hover')) {
                    // Délai de masquage
                    if (triggerConfig.delay?.hide > 0) {
                        const timeout = setTimeout(() => hide(instance), triggerConfig.delay.hide);
                        timeouts.set(instance, { ...timeouts.get(instance), hide: timeout });
                    } else {
                        hide(instance);
                    }
                }
            });
        });

        // Gestion du survol sur le popover (si interactif)
        if (options.interactive && triggerConfig.hideEvents.includes('mouseleave')) {
            instance.popover.addEventListener('mouseenter', () => {
                const hideTimeout = timeouts.get(instance);
                if (hideTimeout?.hide) {
                    clearTimeout(hideTimeout.hide);
                }
            });

            instance.popover.addEventListener('mouseleave', () => {
                if (triggerConfig.delay?.hide > 0) {
                    const timeout = setTimeout(() => hide(instance), triggerConfig.delay.hide);
                    timeouts.set(instance, { ...timeouts.get(instance), hide: timeout });
                } else {
                    hide(instance);
                }
            });
        }
    }

    /**
     * Debounce utility
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Créer un popover
         */
        create(trigger, options = {}) {
            // Injection des styles
            injectStyles();

            // Élément déclencheur
            const triggerEl = typeof trigger === 'string' ? 
                document.querySelector(trigger) : trigger;
            
            if (!triggerEl) {
                console.error('Popover: trigger element not found');
                return null;
            }

            // Fusion des options
            const mergedOptions = { ...CONFIG.defaults, ...options };

            // Création du popover
            const popover = createPopoverElement(mergedOptions);

            // Instance
            const instance = {
                id: popover.id,
                trigger: triggerEl,
                popover,
                options: mergedOptions,
                visible: false,
                show() { show(this); },
                hide() { hide(this); },
                toggle() { toggle(this); },
                destroy() { this.destroy(); },
                update(newOptions) {
                    Object.assign(this.options, newOptions);
                    if (this.visible) {
                        const positionData = calculatePosition(this.trigger, this.popover, this.options);
                        Object.assign(this.popover.style, {
                            top: `${positionData.top}px`,
                            left: `${positionData.left}px`
                        });
                    }
                },
                setContent(content) {
                    const contentEl = this.popover.querySelector('.popover-content');
                    if (typeof content === 'string') {
                        contentEl.innerHTML = content;
                    } else if (content instanceof HTMLElement) {
                        contentEl.innerHTML = '';
                        contentEl.appendChild(content);
                    }
                }
            };

            // Configuration des événements
            setupEventHandlers(instance);

            // Stocker l'instance
            instances.set(triggerEl, instance);

            // Destruction
            instance.destroy = function() {
                hide(this);
                this.popover.remove();
                instances.delete(triggerEl);
                
                // Nettoyer les timeouts
                const timeout = timeouts.get(this);
                if (timeout) {
                    clearTimeout(timeout.show);
                    clearTimeout(timeout.hide);
                    timeouts.delete(this);
                }
            };

            return instance;
        },

        /**
         * Créer plusieurs popovers
         */
        createMultiple(selector, options = {}) {
            const elements = document.querySelectorAll(selector);
            return Array.from(elements).map(el => this.create(el, options));
        },

        /**
         * Obtenir une instance
         */
        getInstance(trigger) {
            const triggerEl = typeof trigger === 'string' ? 
                document.querySelector(trigger) : trigger;
            return instances.get(triggerEl);
        },

        /**
         * Obtenir toutes les instances
         */
        getAllInstances() {
            return Array.from(instances.values());
        },

        /**
         * Détruire une instance
         */
        destroy(trigger) {
            const instance = this.getInstance(trigger);
            if (instance) {
                instance.destroy();
            }
        },

        /**
         * Détruire toutes les instances
         */
        destroyAll() {
            instances.forEach(instance => instance.destroy());
        },

        /**
         * Afficher tous les popovers
         */
        showAll() {
            instances.forEach(instance => instance.show());
        },

        /**
         * Masquer tous les popovers
         */
        hideAll() {
            instances.forEach(instance => instance.hide());
        },

        /**
         * Configuration globale
         */
        setDefaults(options) {
            Object.assign(CONFIG.defaults, options);
        },

        /**
         * Obtenir la configuration
         */
        getConfig() {
            return { ...CONFIG };
        },

        /**
         * Injection manuelle des styles
         */
        injectStyles,

        /**
         * Version
         */
        version: '1.0.0'
    };
})();

// Export pour utilisation
export default Popover;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Positionnement dynamique
   Solution: Système de calcul avec détection de débordement
   
   [2024-01] - Gestion des z-index
   Cause: Conflits avec modales
   Résolution: z-index configurable
   
   [2024-01] - Performance animations
   Solution: Utilisation de transform et opacity uniquement
   
   NOTES POUR REPRISES FUTURES:
   - Le positionnement auto nécessite plusieurs passes
   - Les animations peuvent être désactivées pour l'accessibilité
   - Le système de flèches s'adapte à la position
   - Attention aux fuites mémoire avec les timeouts
   ======================================== */