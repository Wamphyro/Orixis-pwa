/* ========================================
   BOTTOM-SHEET.COMPONENT.JS - Composant de panneau inférieur
   Chemin: src/js/shared/ui/utilities/bottom-sheet.component.js
   
   DESCRIPTION:
   Composant de panneau glissant depuis le bas avec support tactile,
   snap points, et toutes les variantes de styles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Variables privées (lignes 402-450)
   3. Méthodes de création (lignes 452-900)
   4. Gestion du drag (lignes 902-1300)
   5. Animations et transitions (lignes 1302-1500)
   6. Gestion des événements (lignes 1502-1800)
   7. API publique (lignes 1802-1900)
   
   DÉPENDANCES:
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   - touch-utils.js (gestion tactile)
   ======================================== */

const BottomSheet = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            glassmorphism: {
                background: 'rgba(255, 255, 255, 0.08)',
                blur: 20,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
                borderRadius: '24px 24px 0 0',
                handleColor: 'rgba(255, 255, 255, 0.5)'
            },
            neumorphism: {
                background: '#e0e5ec',
                boxShadow: '-20px -20px 40px #ffffff, 20px 20px 40px #a3b1c6',
                borderRadius: '30px 30px 0 0'
            },
            flat: {
                background: '#ffffff',
                shadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: '16px 16px 0 0'
            },
            minimal: {
                background: '#ffffff',
                borderTop: '1px solid #e5e7eb',
                borderRadius: '0'
            },
            material: {
                background: '#ffffff',
                boxShadow: '0 -3px 5px -1px rgba(0,0,0,.2), 0 -6px 10px 0 rgba(0,0,0,.14)',
                borderRadius: '16px 16px 0 0'
            },
            ios: {
                background: '#f2f2f7',
                borderRadius: '10px 10px 0 0',
                shadow: '0 -0.5px 0 rgba(0, 0, 0, 0.3)'
            },
            android: {
                background: '#ffffff',
                borderRadius: '16px 16px 0 0',
                elevation: 16
            }
        },

        // Hauteurs prédéfinies
        heights: {
            small: {
                min: 200,
                default: 300,
                max: '40vh'
            },
            medium: {
                min: 300,
                default: '50vh',
                max: '70vh'
            },
            large: {
                min: '50vh',
                default: '70vh',
                max: '90vh'
            },
            full: {
                min: '80vh',
                default: '100vh',
                max: '100vh'
            },
            auto: {
                min: 100,
                default: 'auto',
                max: '90vh'
            },
            custom: {
                min: null,
                default: null,
                max: null
            }
        },

        // Points d'ancrage (snap points)
        snapPoints: {
            none: [],
            basic: ['20%', '50%', '90%'],
            thirds: ['33%', '66%', '100%'],
            half: ['50%', '100%'],
            peek: ['100px', '50%', '100%'],
            custom: []
        },

        // Animations
        animations: {
            none: {
                enabled: false
            },
            subtle: {
                enabled: true,
                duration: 200,
                easing: 'ease-out',
                opacity: true
            },
            smooth: {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: true,
                scale: true,
                spring: false
            },
            rich: {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                opacity: true,
                scale: true,
                spring: true,
                bounce: true,
                parallax: true
            },
            elastic: {
                enabled: true,
                duration: 500,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                spring: true,
                overshoot: true
            }
        },

        // Comportement du drag
        drag: {
            enabled: true,
            handle: true,
            threshold: 10,
            resistance: 0.5,
            velocityThreshold: 0.5,
            dampening: 0.8,
            elastic: true,
            momentum: true
        },

        // Fonctionnalités
        features: {
            // Handle de drag
            handle: {
                enabled: true,
                position: 'top', // top, header, custom
                style: 'bar', // bar, dots, chevron, custom
                size: 'normal' // small, normal, large
            },
            // Header
            header: {
                enabled: false,
                title: '',
                subtitle: '',
                actions: [],
                sticky: false,
                collapsible: false
            },
            // Overlay/Backdrop
            overlay: {
                enabled: true,
                color: 'rgba(0, 0, 0, 0.5)',
                blur: false,
                closeOnClick: true
            },
            // Comportement
            behavior: {
                modal: true,
                persistent: false,
                preventScroll: true,
                closeOnEscape: true,
                closeOnSwipeDown: true,
                autoHeight: false,
                scrollLock: true
            },
            // Contenu
            content: {
                scrollable: true,
                padding: true,
                footer: false,
                sections: false
            },
            // Avancé
            advanced: {
                keyboard: true,
                focusTrap: true,
                restoreFocus: true,
                announcements: true,
                gestures: true,
                history: false
            }
        },

        // États
        states: {
            closed: 'is-closed',
            opening: 'is-opening',
            open: 'is-open',
            closing: 'is-closing',
            dragging: 'is-dragging',
            snapping: 'is-snapping',
            minimized: 'is-minimized',
            maximized: 'is-maximized'
        },

        // Classes CSS
        classes: {
            container: 'bottom-sheet',
            overlay: 'bottom-sheet-overlay',
            content: 'bottom-sheet-content',
            handle: 'bottom-sheet-handle',
            header: 'bottom-sheet-header',
            body: 'bottom-sheet-body',
            footer: 'bottom-sheet-footer',
            actions: 'bottom-sheet-actions'
        },

        // Seuils et limites
        thresholds: {
            swipeVelocity: 0.5,
            swipeDistance: 50,
            closeThreshold: 0.2,
            openThreshold: 0.8,
            rubberBand: 0.2
        },

        // Messages
        messages: {
            close: 'Fermer',
            minimize: 'Réduire',
            maximize: 'Agrandir',
            swipeHint: 'Glissez vers le bas pour fermer'
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let instances = new Map();
    let instanceIdCounter = 0;
    let stylesInjected = false;
    let activeInstance = null;

    // État du drag
    const dragState = {
        isDragging: false,
        startY: 0,
        currentY: 0,
        startHeight: 0,
        velocity: 0,
        lastY: 0,
        lastTime: 0
    };

    // Support tactile
    const touchSupport = {
        passive: false,
        touch: 'ontouchstart' in window
    };

    // Test du support passif
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function() { touchSupport.passive = true; }
        });
        window.addEventListener('testPassive', null, opts);
        window.removeEventListener('testPassive', null, opts);
    } catch (e) {}

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function generateId() {
        return `bottom-sheet-${++instanceIdCounter}`;
    }

    function createContainer(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.style} ${options.height}`;
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-modal', 'true');
        container.setAttribute('aria-labelledby', `${options.id}-title`);
        
        if (options.id) {
            container.id = options.id;
        }

        // État initial
        container.classList.add(CONFIG.states.closed);

        return container;
    }

    function createOverlay(options) {
        if (!options.features?.overlay?.enabled) return null;
        
        const overlay = document.createElement('div');
        overlay.className = CONFIG.classes.overlay;
        overlay.setAttribute('aria-hidden', 'true');
        
        const overlayConfig = options.features.overlay;
        
        if (overlayConfig.color) {
            overlay.style.backgroundColor = overlayConfig.color;
        }
        
        if (overlayConfig.blur) {
            overlay.style.backdropFilter = 'blur(10px)';
            overlay.style.webkitBackdropFilter = 'blur(10px)';
        }
        
        return overlay;
    }

    function createContent(options) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.content;
        
        // Style spécifique
        const styleConfig = CONFIG.styles[options.style] || CONFIG.styles.glassmorphism;
        Object.entries(styleConfig).forEach(([property, value]) => {
            if (property !== 'handleColor') {
                const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
                content.style[cssProperty] = value;
            }
        });
        
        // Hauteur
        const heightConfig = CONFIG.heights[options.height] || CONFIG.heights.medium;
        if (heightConfig.default) {
            content.style.height = typeof heightConfig.default === 'number' 
                ? `${heightConfig.default}px` 
                : heightConfig.default;
        }
        
        if (heightConfig.max) {
            content.style.maxHeight = typeof heightConfig.max === 'number'
                ? `${heightConfig.max}px`
                : heightConfig.max;
        }
        
        return content;
    }

    function createHandle(options) {
        if (!options.features?.handle?.enabled) return null;
        
        const handleWrapper = document.createElement('div');
        handleWrapper.className = `${CONFIG.classes.handle}-wrapper`;
        
        const handle = document.createElement('div');
        handle.className = CONFIG.classes.handle;
        handle.setAttribute('role', 'button');
        handle.setAttribute('aria-label', 'Poignée de glissement');
        handle.setAttribute('tabindex', '0');
        
        const handleConfig = options.features.handle;
        
        // Style du handle
        switch (handleConfig.style) {
            case 'bar':
                handle.innerHTML = '<span class="bottom-sheet-handle-bar"></span>';
                break;
            case 'dots':
                handle.innerHTML = `
                    <span class="bottom-sheet-handle-dots">
                        <span></span><span></span><span></span>
                    </span>
                `;
                break;
            case 'chevron':
                handle.innerHTML = `
                    <svg class="bottom-sheet-handle-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 15 12 9 18 15"></polyline>
                    </svg>
                `;
                break;
            default:
                if (handleConfig.customHTML) {
                    handle.innerHTML = handleConfig.customHTML;
                }
        }
        
        handleWrapper.appendChild(handle);
        return handleWrapper;
    }

    function createHeader(options) {
        if (!options.features?.header?.enabled) return null;
        
        const header = document.createElement('header');
        header.className = CONFIG.classes.header;
        
        const headerConfig = options.features.header;
        
        // Titre
        if (headerConfig.title) {
            const title = document.createElement('h2');
            title.className = 'bottom-sheet-header-title';
            title.id = `${options.id}-title`;
            title.textContent = headerConfig.title;
            header.appendChild(title);
        }
        
        // Sous-titre
        if (headerConfig.subtitle) {
            const subtitle = document.createElement('p');
            subtitle.className = 'bottom-sheet-header-subtitle';
            subtitle.textContent = headerConfig.subtitle;
            header.appendChild(subtitle);
        }
        
        // Actions
        if (headerConfig.actions && headerConfig.actions.length > 0) {
            const actions = createHeaderActions(headerConfig.actions, options);
            header.appendChild(actions);
        }
        
        // Sticky
        if (headerConfig.sticky) {
            header.classList.add('is-sticky');
        }
        
        return header;
    }

    function createHeaderActions(actions, options) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = `${CONFIG.classes.actions} header-actions`;
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'bottom-sheet-action';
            button.setAttribute('aria-label', action.label || action.text);
            
            if (action.icon) {
                button.innerHTML = action.icon;
            } else {
                button.textContent = action.text || '';
            }
            
            if (action.className) {
                button.className += ` ${action.className}`;
            }
            
            if (action.onClick) {
                button.addEventListener('click', action.onClick);
            }
            
            actionsContainer.appendChild(button);
        });
        
        // Bouton fermer par défaut
        if (!actions.some(a => a.isClose)) {
            const closeButton = document.createElement('button');
            closeButton.className = 'bottom-sheet-action bottom-sheet-close';
            closeButton.setAttribute('aria-label', CONFIG.messages.close);
            closeButton.innerHTML = getCloseIcon();
            actionsContainer.appendChild(closeButton);
        }
        
        return actionsContainer;
    }

    function createBody(options) {
        const body = document.createElement('div');
        body.className = CONFIG.classes.body;
        
        if (options.features?.content?.scrollable) {
            body.classList.add('is-scrollable');
        }
        
        if (options.features?.content?.padding !== false) {
            body.classList.add('has-padding');
        }
        
        // Contenu initial
        if (options.content) {
            if (typeof options.content === 'string') {
                body.innerHTML = options.content;
            } else if (options.content instanceof Element) {
                body.appendChild(options.content);
            }
        }
        
        return body;
    }

    function createFooter(options) {
        if (!options.features?.content?.footer) return null;
        
        const footer = document.createElement('footer');
        footer.className = CONFIG.classes.footer;
        
        // Actions du footer
        if (options.footerActions) {
            const actions = document.createElement('div');
            actions.className = `${CONFIG.classes.actions} footer-actions`;
            
            options.footerActions.forEach(action => {
                const button = document.createElement('button');
                button.className = `bottom-sheet-button ${action.variant || 'default'}`;
                button.textContent = action.text;
                
                if (action.onClick) {
                    button.addEventListener('click', () => {
                        action.onClick(instances.get(options.id));
                    });
                }
                
                actions.appendChild(button);
            });
            
            footer.appendChild(actions);
        }
        
        return footer;
    }

    // ========================================
    // MÉTHODES PRIVÉES - DRAG & GESTURES
    // ========================================
    function initializeDrag(instance) {
        const { elements, options } = instance;
        
        if (!options.drag?.enabled) return;
        
        // Éléments draggables
        const draggableElements = [];
        
        if (elements.handle) {
            draggableElements.push(elements.handle);
        }
        
        if (options.features?.header?.enabled && !options.features?.header?.sticky) {
            draggableElements.push(elements.header);
        }
        
        // Événements tactiles
        draggableElements.forEach(element => {
            if (touchSupport.touch) {
                element.addEventListener('touchstart', e => handleDragStart(instance, e), 
                    touchSupport.passive ? { passive: true } : false);
            }
            element.addEventListener('mousedown', e => handleDragStart(instance, e));
        });
        
        // Événements globaux
        document.addEventListener('touchmove', e => handleDragMove(instance, e), 
            touchSupport.passive ? { passive: false } : false);
        document.addEventListener('mousemove', e => handleDragMove(instance, e));
        
        document.addEventListener('touchend', e => handleDragEnd(instance, e));
        document.addEventListener('mouseup', e => handleDragEnd(instance, e));
    }

    function handleDragStart(instance, e) {
        const { elements, options } = instance;
        
        // Ignorer si désactivé
        if (!options.drag?.enabled || instance.state.isAnimating) return;
        
        const touch = e.touches ? e.touches[0] : e;
        
        dragState.isDragging = true;
        dragState.startY = touch.clientY;
        dragState.currentY = touch.clientY;
        dragState.lastY = touch.clientY;
        dragState.lastTime = Date.now();
        dragState.velocity = 0;
        
        const rect = elements.content.getBoundingClientRect();
        dragState.startHeight = window.innerHeight - rect.top;
        
        elements.container.classList.add(CONFIG.states.dragging);
        
        // Désactiver les transitions pendant le drag
        elements.content.style.transition = 'none';
        
        // Empêcher la sélection de texte
        e.preventDefault();
    }

    function handleDragMove(instance, e) {
        if (!dragState.isDragging) return;
        
        const { elements, options } = instance;
        const touch = e.touches ? e.touches[0] : e;
        
        const deltaY = touch.clientY - dragState.startY;
        const currentTime = Date.now();
        const deltaTime = currentTime - dragState.lastTime;
        
        // Calculer la vélocité
        if (deltaTime > 0) {
            dragState.velocity = (touch.clientY - dragState.lastY) / deltaTime;
        }
        
        dragState.currentY = touch.clientY;
        dragState.lastY = touch.clientY;
        dragState.lastTime = currentTime;
        
        // Appliquer la résistance élastique
        let translateY = deltaY;
        if (options.drag?.elastic) {
            const resistance = options.drag.resistance || 0.5;
            if (deltaY < 0) {
                // Résistance en haut
                translateY = deltaY * resistance;
            } else if (dragState.startHeight - deltaY < 100) {
                // Résistance en bas
                const overflow = (dragState.startHeight - deltaY) - 100;
                translateY = deltaY - (overflow * (1 - resistance));
            }
        }
        
        // Appliquer la transformation
        elements.content.style.transform = `translateY(${translateY}px)`;
        
        // Mettre à jour l'opacité de l'overlay
        if (elements.overlay) {
            const progress = Math.max(0, Math.min(1, 1 - (translateY / dragState.startHeight)));
            elements.overlay.style.opacity = progress * 0.5;
        }
        
        // Callback
        if (options.onDrag) {
            options.onDrag({
                deltaY: translateY,
                progress: 1 - (translateY / dragState.startHeight),
                velocity: dragState.velocity
            });
        }
        
        e.preventDefault();
    }

    function handleDragEnd(instance, e) {
        if (!dragState.isDragging) return;
        
        const { elements, options } = instance;
        
        dragState.isDragging = false;
        elements.container.classList.remove(CONFIG.states.dragging);
        
        // Réactiver les transitions
        const animConfig = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        elements.content.style.transition = `transform ${animConfig.duration}ms ${animConfig.easing}`;
        
        const deltaY = dragState.currentY - dragState.startY;
        const velocity = Math.abs(dragState.velocity);
        const threshold = CONFIG.thresholds.swipeVelocity;
        
        // Déterminer l'action basée sur la vélocité et la distance
        if (velocity > threshold || deltaY > dragState.startHeight * CONFIG.thresholds.closeThreshold) {
            // Fermer
            if (options.features?.behavior?.closeOnSwipeDown !== false) {
                close(instance);
            } else {
                // Retour à la position d'origine
                snapToPosition(instance, 0);
            }
        } else {
            // Snap au point le plus proche
            const snapPoint = findNearestSnapPoint(instance, dragState.startHeight - deltaY);
            snapToHeight(instance, snapPoint);
        }
        
        // Reset
        dragState.velocity = 0;
        dragState.startY = 0;
        dragState.currentY = 0;
    }

    function findNearestSnapPoint(instance, currentHeight) {
        const { options } = instance;
        const snapPoints = options.snapPoints || CONFIG.snapPoints.none;
        
        if (!snapPoints || snapPoints.length === 0) {
            return currentHeight;
        }
        
        const windowHeight = window.innerHeight;
        const heights = snapPoints.map(point => {
            if (typeof point === 'string' && point.endsWith('%')) {
                return windowHeight * (parseFloat(point) / 100);
            } else if (typeof point === 'string' && point.endsWith('px')) {
                return parseFloat(point);
            } else if (typeof point === 'string' && point.endsWith('vh')) {
                return windowHeight * (parseFloat(point) / 100);
            }
            return point;
        });
        
        // Trouver le point le plus proche
        let nearest = heights[0];
        let minDistance = Math.abs(currentHeight - nearest);
        
        heights.forEach(height => {
            const distance = Math.abs(currentHeight - height);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = height;
            }
        });
        
        return nearest;
    }

    function snapToHeight(instance, height) {
        const { elements } = instance;
        
        instance.state.isSnapping = true;
        elements.container.classList.add(CONFIG.states.snapping);
        
        // Reset transform et ajuster la hauteur
        elements.content.style.transform = '';
        elements.content.style.height = `${height}px`;
        
        setTimeout(() => {
            instance.state.isSnapping = false;
            elements.container.classList.remove(CONFIG.states.snapping);
        }, 300);
        
        // Callback
        if (instance.options.onSnap) {
            instance.options.onSnap(height);
        }
    }

    function snapToPosition(instance, position) {
        const { elements } = instance;
        elements.content.style.transform = `translateY(${position}px)`;
    }

    // ========================================
    // MÉTHODES PRIVÉES - ANIMATIONS
    // ========================================
    function animateOpen(instance) {
        const { elements, options } = instance;
        const animConfig = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        
        instance.state.isAnimating = true;
        elements.container.classList.add(CONFIG.states.opening);
        elements.container.classList.remove(CONFIG.states.closed);
        
        // Afficher l'overlay
        if (elements.overlay) {
            elements.overlay.style.display = 'block';
            requestAnimationFrame(() => {
                elements.overlay.style.opacity = '1';
            });
        }
        
        // Animation du contenu
        requestAnimationFrame(() => {
            elements.content.style.transform = 'translateY(0)';
            
            if (animConfig.scale) {
                elements.content.style.transform += ' scale(1)';
            }
            
            if (animConfig.opacity) {
                elements.content.style.opacity = '1';
            }
        });
        
        // Animation parallaxe
        if (animConfig.parallax && options.features?.advanced?.parallax) {
            animateParallax(instance, 'open');
        }
        
        setTimeout(() => {
            instance.state.isAnimating = false;
            instance.state.isOpen = true;
            elements.container.classList.remove(CONFIG.states.opening);
            elements.container.classList.add(CONFIG.states.open);
            
            // Focus trap
            if (options.features?.advanced?.focusTrap) {
                createFocusTrap(instance);
            }
            
            // Callback
            if (options.onOpen) {
                options.onOpen(instance);
            }
        }, animConfig.duration);
    }

    function animateClose(instance) {
        const { elements, options } = instance;
        const animConfig = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        
        instance.state.isAnimating = true;
        elements.container.classList.add(CONFIG.states.closing);
        elements.container.classList.remove(CONFIG.states.open);
        
        // Animation du contenu
        const contentHeight = elements.content.offsetHeight;
        elements.content.style.transform = `translateY(${contentHeight}px)`;
        
        if (animConfig.scale) {
            elements.content.style.transform += ' scale(0.95)';
        }
        
        if (animConfig.opacity) {
            elements.content.style.opacity = '0';
        }
        
        // Masquer l'overlay
        if (elements.overlay) {
            elements.overlay.style.opacity = '0';
        }
        
        // Animation parallaxe
        if (animConfig.parallax && options.features?.advanced?.parallax) {
            animateParallax(instance, 'close');
        }
        
        setTimeout(() => {
            instance.state.isAnimating = false;
            instance.state.isOpen = false;
            elements.container.classList.remove(CONFIG.states.closing);
            elements.container.classList.add(CONFIG.states.closed);
            
            if (elements.overlay) {
                elements.overlay.style.display = 'none';
            }
            
            // Retirer le focus trap
            if (options.features?.advanced?.focusTrap) {
                removeFocusTrap(instance);
            }
            
            // Restaurer le focus
            if (options.features?.advanced?.restoreFocus && instance.previousFocus) {
                instance.previousFocus.focus();
            }
            
            // Callback
            if (options.onClose) {
                options.onClose(instance);
            }
        }, animConfig.duration);
    }

    function animateParallax(instance, direction) {
        const mainContent = document.querySelector('main') || document.body;
        const scale = direction === 'open' ? 0.95 : 1;
        const translateY = direction === 'open' ? -20 : 0;
        
        mainContent.style.transition = 'transform 0.3s ease-out';
        mainContent.style.transform = `scale(${scale}) translateY(${translateY}px)`;
    }

    // ========================================
    // MÉTHODES PRIVÉES - ÉVÉNEMENTS
    // ========================================
    function attachEvents(instance) {
        const { elements, options } = instance;
        
        // Overlay click
        if (elements.overlay && options.features?.overlay?.closeOnClick) {
            elements.overlay.addEventListener('click', () => {
                if (!options.features?.behavior?.persistent) {
                    close(instance);
                }
            });
        }
        
        // Bouton fermer
        const closeButtons = elements.container.querySelectorAll('.bottom-sheet-close');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => close(instance));
        });
        
        // Handle keyboard
        if (elements.handle) {
            elements.handle.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(instance);
                }
            });
        }
        
        // Escape key
        if (options.features?.behavior?.closeOnEscape) {
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && instance.state.isOpen && !options.features?.behavior?.persistent) {
                    close(instance);
                }
            });
        }
        
        // Resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (instance.state.isOpen) {
                    adjustHeight(instance);
                }
            }, 250);
        });
        
        // Prevent body scroll
        if (options.features?.behavior?.preventScroll) {
            elements.container.addEventListener('touchmove', e => {
                if (instance.state.isOpen && !isScrollable(e.target)) {
                    e.preventDefault();
                }
            }, touchSupport.passive ? { passive: false } : false);
        }
        
        // Initialize drag
        if (options.drag?.enabled) {
            initializeDrag(instance);
        }
    }

    function createFocusTrap(instance) {
        const { elements } = instance;
        const focusableElements = elements.container.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        instance.focusTrap = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        };
        
        elements.container.addEventListener('keydown', instance.focusTrap);
        
        // Focus initial
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    function removeFocusTrap(instance) {
        if (instance.focusTrap) {
            instance.elements.container.removeEventListener('keydown', instance.focusTrap);
            instance.focusTrap = null;
        }
    }

    function isScrollable(element) {
        let el = element;
        while (el && el !== document.body) {
            if (el.classList.contains(CONFIG.classes.body) && el.classList.contains('is-scrollable')) {
                return el.scrollHeight > el.clientHeight;
            }
            el = el.parentElement;
        }
        return false;
    }

    function adjustHeight(instance) {
        const { elements, options } = instance;
        
        if (options.features?.content?.autoHeight) {
            const contentHeight = elements.body.scrollHeight;
            const windowHeight = window.innerHeight;
            const maxHeight = windowHeight * 0.9;
            
            elements.content.style.height = `${Math.min(contentHeight, maxHeight)}px`;
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES - API
    // ========================================
    function open(instance) {
        if (instance.state.isOpen || instance.state.isAnimating) return;
        
        const { options } = instance;
        
        // Sauvegarder le focus actuel
        if (options.features?.advanced?.restoreFocus) {
            instance.previousFocus = document.activeElement;
        }
        
        // Définir comme instance active
        activeInstance = instance;
        
        // Bloquer le scroll du body
        if (options.features?.behavior?.scrollLock) {
            document.body.style.overflow = 'hidden';
        }
        
        // Animation d'ouverture
        animateOpen(instance);
        
        // Annonce pour les lecteurs d'écran
        if (options.features?.advanced?.announcements) {
            announce('Panneau ouvert');
        }
    }

    function close(instance) {
        if (!instance.state.isOpen || instance.state.isAnimating) return;
        
        const { options } = instance;
        
        // Débloquer le scroll du body
        if (options.features?.behavior?.scrollLock) {
            document.body.style.overflow = '';
        }
        
        // Animation de fermeture
        animateClose(instance);
        
        // Retirer l'instance active
        if (activeInstance === instance) {
            activeInstance = null;
        }
        
        // Annonce pour les lecteurs d'écran
        if (options.features?.advanced?.announcements) {
            announce('Panneau fermé');
        }
    }

    function toggle(instance) {
        if (instance.state.isOpen) {
            close(instance);
        } else {
            open(instance);
        }
    }

    function minimize(instance) {
        const { elements, options } = instance;
        
        if (!instance.state.isOpen) return;
        
        const minHeight = CONFIG.heights[options.height]?.min || 100;
        snapToHeight(instance, minHeight);
        
        elements.container.classList.add(CONFIG.states.minimized);
        elements.container.classList.remove(CONFIG.states.maximized);
    }

    function maximize(instance) {
        const { elements } = instance;
        
        if (!instance.state.isOpen) return;
        
        const maxHeight = window.innerHeight * 0.95;
        snapToHeight(instance, maxHeight);
        
        elements.container.classList.add(CONFIG.states.maximized);
        elements.container.classList.remove(CONFIG.states.minimized);
    }

    function setContent(instance, content) {
        const { elements } = instance;
        
        if (typeof content === 'string') {
            elements.body.innerHTML = content;
        } else if (content instanceof Element) {
            elements.body.innerHTML = '';
            elements.body.appendChild(content);
        }
        
        // Ajuster la hauteur si nécessaire
        if (instance.state.isOpen && instance.options.features?.content?.autoHeight) {
            adjustHeight(instance);
        }
    }

    function announce(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    function getCloseIcon() {
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>`;
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (stylesInjected) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/bottom-sheet.css';
        document.head.appendChild(link);
        
        stylesInjected = true;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            // Injection des styles
            if (!stylesInjected) {
                injectStyles();
            }

            // Options par défaut
            const defaultOptions = {
                style: 'glassmorphism',
                height: 'medium',
                animation: 'smooth',
                snapPoints: CONFIG.snapPoints.basic,
                drag: {
                    enabled: true,
                    handle: true
                },
                features: {
                    handle: {
                        enabled: true,
                        style: 'bar'
                    },
                    overlay: {
                        enabled: true,
                        closeOnClick: true
                    },
                    behavior: {
                        modal: true,
                        closeOnEscape: true,
                        closeOnSwipeDown: true
                    }
                }
            };

            // Fusion des options
            options = Object.assign({}, defaultOptions, options);

            // Créer l'instance
            const instance = {
                id: options.id || generateId(),
                options,
                elements: {},
                state: {
                    isOpen: false,
                    isAnimating: false,
                    isSnapping: false
                },
                previousFocus: null
            };

            // Créer les éléments
            instance.elements.container = createContainer(options);
            instance.elements.content = createContent(options);

            // Overlay
            if (options.features?.overlay?.enabled) {
                instance.elements.overlay = createOverlay(options);
                if (instance.elements.overlay) {
                    document.body.appendChild(instance.elements.overlay);
                }
            }

            // Handle
            if (options.features?.handle?.enabled) {
                instance.elements.handle = createHandle(options);
                if (instance.elements.handle) {
                    instance.elements.content.appendChild(instance.elements.handle);
                }
            }

            // Header
            if (options.features?.header?.enabled) {
                instance.elements.header = createHeader(options);
                if (instance.elements.header) {
                    instance.elements.content.appendChild(instance.elements.header);
                }
            }

            // Body
            instance.elements.body = createBody(options);
            instance.elements.content.appendChild(instance.elements.body);

            // Footer
            if (options.features?.content?.footer) {
                instance.elements.footer = createFooter(options);
                if (instance.elements.footer) {
                    instance.elements.content.appendChild(instance.elements.footer);
                }
            }

            // Assembler
            instance.elements.container.appendChild(instance.elements.content);
            document.body.appendChild(instance.elements.container);

            // Attacher les événements
            attachEvents(instance);

            // Stocker l'instance
            instances.set(instance.id, instance);

            // API de l'instance
            instance.open = () => open(instance);
            instance.close = () => close(instance);
            instance.toggle = () => toggle(instance);
            instance.minimize = () => minimize(instance);
            instance.maximize = () => maximize(instance);
            instance.setContent = (content) => setContent(instance, content);
            instance.snapTo = (height) => snapToHeight(instance, height);
            instance.destroy = () => {
                instances.delete(instance.id);
                instance.elements.container.remove();
                if (instance.elements.overlay) {
                    instance.elements.overlay.remove();
                }
            };

            // Auto-open si spécifié
            if (options.autoOpen) {
                setTimeout(() => open(instance), 100);
            }

            // Retourner l'instance
            return instance;
        },

        // Configuration exposée
        CONFIG,
        
        // Méthodes utilitaires
        getInstance(id) {
            return instances.get(id);
        },
        
        getAllInstances() {
            return Array.from(instances.values());
        },
        
        getActiveInstance() {
            return activeInstance;
        },
        
        closeAll() {
            instances.forEach(instance => close(instance));
        },
        
        // Injection manuelle des styles
        injectStyles
    };
})();

// Export pour utilisation
export default BottomSheet;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion du momentum iOS
   Solution: Utilisation de -webkit-overflow-scrolling: touch
   
   [2024-12-XX] - Performance du drag sur Android
   Cause: Trop de repaints avec transform
   Résolution: Utilisation de will-change et GPU acceleration
   
   [2024-12-XX] - Snap points avec contenu dynamique
   Solution: Recalcul des snap points au resize
   
   NOTES POUR REPRISES FUTURES:
   - Le drag nécessite preventDefault sur touchmove
   - Les animations doivent être désactivées pendant le drag
   - Le focus trap est critique pour l'accessibilité
   - iOS a des comportements spécifiques pour le bounce
   ======================================== */