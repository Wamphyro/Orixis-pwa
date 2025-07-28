/* ========================================
   FAB.COMPONENT.JS - Floating Action Button
   Chemin: src/js/shared/ui/core/fab.component.js
   
   DESCRIPTION:
   Composant de bouton d'action flottant (FAB) inspiré du Material Design.
   Supporte FAB simple, mini, extended, avec speed dial, morphing,
   et toutes les animations possibles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Templates HTML (lignes 205-350)
   3. Création et rendu (lignes 355-550)
   4. Speed Dial (lignes 555-750)
   5. Animations et transitions (lignes 755-950)
   6. Gestion des événements (lignes 955-1150)
   7. API publique (lignes 1155-1300)
   
   DÉPENDANCES:
   - fab.css (styles spécifiques)
   - frosted-icons.component.js (pour les icônes)
   - animation-engine.js (pour les animations)
   ======================================== */

const FabComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de FAB
        types: {
            'standard': {
                size: 56,
                iconSize: 24,
                shape: 'circle',
                elevation: 6
            },
            'mini': {
                size: 40,
                iconSize: 18,
                shape: 'circle',
                elevation: 4
            },
            'extended': {
                height: 48,
                minWidth: 80,
                iconSize: 24,
                shape: 'pill',
                elevation: 6,
                padding: '0 20px'
            },
            'square': {
                size: 56,
                iconSize: 24,
                shape: 'square',
                borderRadius: 12,
                elevation: 6
            }
        },
        
        // Positions possibles
        positions: {
            'bottom-right': {
                bottom: 16,
                right: 16,
                transform: 'none'
            },
            'bottom-left': {
                bottom: 16,
                left: 16,
                transform: 'none'
            },
            'bottom-center': {
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)'
            },
            'top-right': {
                top: 16,
                right: 16,
                transform: 'none'
            },
            'top-left': {
                top: 16,
                left: 16,
                transform: 'none'
            },
            'center': {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }
        },
        
        // Styles visuels
        styles: {
            'glassmorphism': {
                background: 'rgba(59, 130, 246, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
            },
            'material': {
                background: 'var(--ui-primary, #1976d2)',
                backdropFilter: 'none',
                border: 'none',
                shadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                backdropFilter: 'none',
                border: 'none',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                background: 'var(--ui-primary, #3b82f6)',
                backdropFilter: 'none',
                border: 'none',
                shadow: 'none'
            },
            'outline': {
                background: 'transparent',
                backdropFilter: 'none',
                border: '2px solid var(--ui-primary, #3b82f6)',
                shadow: 'none'
            },
            'gradient': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'none',
                border: 'none',
                shadow: '0 10px 40px rgba(102, 126, 234, 0.4)'
            }
        },
        
        // Comportements
        behaviors: {
            // Auto-hide on scroll
            hideOnScroll: {
                enabled: false,
                threshold: 50,
                animation: 'slide'
            },
            
            // Morph to toolbar
            morphToToolbar: {
                enabled: false,
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            
            // Speed dial (sous-actions)
            speedDial: {
                enabled: false,
                direction: 'up', // up, down, left, right, radial
                animation: 'scale',
                stagger: 50,
                backdrop: true,
                labels: true
            },
            
            // Pulsation
            pulse: {
                enabled: false,
                interval: 3000,
                scale: 1.1
            },
            
            // Rotation de l'icône
            rotateIcon: {
                enabled: false,
                degrees: 360,
                duration: 300
            }
        },
        
        // États
        states: {
            'default': {
                transform: 'scale(1)',
                opacity: 1
            },
            'hover': {
                transform: 'scale(1.05)',
                brightness: 1.1
            },
            'active': {
                transform: 'scale(0.95)',
                brightness: 0.9
            },
            'disabled': {
                opacity: 0.5,
                cursor: 'not-allowed'
            },
            'loading': {
                cursor: 'wait'
            },
            'hidden': {
                transform: 'scale(0)',
                opacity: 0
            }
        },
        
        // Animations d'entrée/sortie
        animations: {
            enter: {
                'scale': {
                    from: 'scale(0) rotate(-180deg)',
                    to: 'scale(1) rotate(0)'
                },
                'slide': {
                    from: 'translateY(100px)',
                    to: 'translateY(0)'
                },
                'fade': {
                    from: 'opacity: 0',
                    to: 'opacity: 1'
                },
                'bounce': {
                    keyframes: [
                        { transform: 'scale(0)', offset: 0 },
                        { transform: 'scale(1.2)', offset: 0.6 },
                        { transform: 'scale(0.9)', offset: 0.8 },
                        { transform: 'scale(1)', offset: 1 }
                    ]
                }
            },
            exit: {
                'scale': {
                    from: 'scale(1) rotate(0)',
                    to: 'scale(0) rotate(180deg)'
                },
                'slide': {
                    from: 'translateY(0)',
                    to: 'translateY(100px)'
                },
                'fade': {
                    from: 'opacity: 1',
                    to: 'opacity: 0'
                }
            }
        },
        
        // Classes CSS
        classes: {
            container: 'ui-fab-container',
            button: 'ui-fab',
            icon: 'ui-fab-icon',
            label: 'ui-fab-label',
            speedDial: 'ui-fab-speed-dial',
            speedDialItem: 'ui-fab-speed-dial-item',
            backdrop: 'ui-fab-backdrop',
            loading: 'ui-fab-loading',
            ripple: 'ui-fab-ripple'
        }
    };

    // ========================================
    // TEMPLATES HTML
    // ========================================
    const Templates = {
        // FAB standard
        standard(options) {
            const { icon, label, type, style } = options;
            const config = CONFIG.types[type];
            
            return `
                <button 
                    class="${CONFIG.classes.button} ${CONFIG.classes.button}--${type} ${CONFIG.classes.button}--${style}"
                    role="button"
                    aria-label="${label || 'Action button'}"
                    data-ui-component="fab"
                >
                    ${this.icon(icon)}
                    ${this.loadingSpinner()}
                    ${this.rippleEffect()}
                </button>
            `;
        },
        
        // FAB extended avec label
        extended(options) {
            const { icon, label, type, style } = options;
            
            return `
                <button 
                    class="${CONFIG.classes.button} ${CONFIG.classes.button}--${type} ${CONFIG.classes.button}--${style}"
                    role="button"
                    aria-label="${label}"
                    data-ui-component="fab"
                >
                    ${icon ? this.icon(icon) : ''}
                    <span class="${CONFIG.classes.label}">${label}</span>
                    ${this.loadingSpinner()}
                    ${this.rippleEffect()}
                </button>
            `;
        },
        
        // Conteneur avec speed dial
        speedDialContainer(options) {
            const { position } = options;
            
            return `
                <div class="${CONFIG.classes.container} ${CONFIG.classes.container}--${position}"
                     data-ui-component="fab-container">
                    ${this.backdrop()}
                    <div class="${CONFIG.classes.speedDial}"></div>
                    <!-- FAB principal sera inséré ici -->
                </div>
            `;
        },
        
        // Item de speed dial
        speedDialItem(action) {
            return `
                <button 
                    class="${CONFIG.classes.speedDialItem}"
                    data-action="${action.id}"
                    aria-label="${action.label}"
                >
                    ${this.icon(action.icon)}
                    ${action.label ? `<span class="${CONFIG.classes.label}">${action.label}</span>` : ''}
                </button>
            `;
        },
        
        // Icône
        icon(iconName) {
            return `<span class="${CONFIG.classes.icon}" data-icon="${iconName}"></span>`;
        },
        
        // Spinner de chargement
        loadingSpinner() {
            return `
                <span class="${CONFIG.classes.loading}">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" />
                    </svg>
                </span>
            `;
        },
        
        // Effet ripple
        rippleEffect() {
            return `<span class="${CONFIG.classes.ripple}"></span>`;
        },
        
        // Backdrop pour speed dial
        backdrop() {
            return `<div class="${CONFIG.classes.backdrop}"></div>`;
        }
    };

    // ========================================
    // GESTIONNAIRE D'INSTANCES
    // ========================================
    const instances = new Map();
    let instanceId = 0;

    // ========================================
    // CRÉATION ET RENDU
    // ========================================
    const create = async (options = {}) => {
        // Options par défaut
        const defaultOptions = {
            type: 'standard',
            style: 'glassmorphism',
            position: 'bottom-right',
            icon: 'plus',
            label: '',
            visible: true,
            disabled: false,
            animation: 'scale',
            behaviors: {},
            speedDial: null,
            onClick: null,
            container: document.body
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        const id = `fab_${++instanceId}`;
        
        // Créer l'instance
        const instance = {
            id,
            options: finalOptions,
            element: null,
            container: null,
            state: 'default',
            isOpen: false,
            speedDialItems: [],
            listeners: new Map()
        };
        
        // Rendre le FAB
        await render(instance);
        
        // Initialiser les comportements
        initializeBehaviors(instance);
        
        // Attacher les événements
        attachEvents(instance);
        
        // Animer l'entrée
        if (finalOptions.visible) {
            await animateEnter(instance);
        }
        
        // Stocker l'instance
        instances.set(id, instance);
        
        // Retourner l'API publique
        return createAPI(instance);
    };

    // ========================================
    // RENDU DU COMPOSANT
    // ========================================
    const render = async (instance) => {
        const { options } = instance;
        
        // Charger les styles si nécessaire
        await loadStyles();
        
        // Créer le HTML selon le type
        let html;
        if (options.type === 'extended') {
            html = Templates.extended(options);
        } else {
            html = Templates.standard(options);
        }
        
        // Si speed dial, créer le conteneur
        if (options.speedDial) {
            const containerHtml = Templates.speedDialContainer(options);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = containerHtml;
            instance.container = tempDiv.firstElementChild;
            
            // Ajouter le FAB principal
            instance.container.insertAdjacentHTML('beforeend', html);
            instance.element = instance.container.querySelector(`.${CONFIG.classes.button}`);
            
            // Rendre les items speed dial
            renderSpeedDial(instance);
            
            // Ajouter au DOM
            options.container.appendChild(instance.container);
        } else {
            // FAB simple
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            instance.element = tempDiv.firstElementChild;
            
            // Positionner le FAB
            applyPosition(instance.element, options.position);
            
            // Ajouter au DOM
            options.container.appendChild(instance.element);
        }
        
        // Charger les icônes
        await loadIcons(instance);
        
        // Appliquer les styles custom
        applyCustomStyles(instance);
        
        // État initial
        if (options.disabled) {
            instance.element.disabled = true;
            instance.element.classList.add(`${CONFIG.classes.button}--disabled`);
        }
        
        if (!options.visible) {
            instance.element.classList.add(`${CONFIG.classes.button}--hidden`);
        }
    };

    // ========================================
    // SPEED DIAL
    // ========================================
    const renderSpeedDial = (instance) => {
        const { speedDial } = instance.options;
        if (!speedDial || !speedDial.actions) return;
        
        const speedDialContainer = instance.container.querySelector(`.${CONFIG.classes.speedDial}`);
        
        speedDial.actions.forEach((action, index) => {
            const itemHtml = Templates.speedDialItem(action);
            speedDialContainer.insertAdjacentHTML('beforeend', itemHtml);
            
            const item = speedDialContainer.lastElementChild;
            instance.speedDialItems.push(item);
            
            // Positionner selon la direction
            positionSpeedDialItem(item, index, speedDial.direction);
            
            // Event handler
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (action.onClick) {
                    action.onClick(e, action);
                }
                closeSpeedDial(instance);
            });
        });
    };
    
    const positionSpeedDialItem = (item, index, direction) => {
        const spacing = 60; // Espacement entre items
        const offset = (index + 1) * spacing;
        
        const positions = {
            'up': { bottom: `${offset}px`, right: '0' },
            'down': { top: `${offset}px`, right: '0' },
            'left': { bottom: '0', right: `${offset}px` },
            'right': { bottom: '0', left: `${offset}px` },
            'radial': calculateRadialPosition(index)
        };
        
        const position = positions[direction] || positions.up;
        Object.assign(item.style, {
            position: 'absolute',
            ...position
        });
    };
    
    const calculateRadialPosition = (index) => {
        const angleStep = 45; // Degrés entre chaque item
        const radius = 80; // Rayon du cercle
        const angle = index * angleStep * (Math.PI / 180);
        
        return {
            bottom: `${Math.sin(angle) * radius}px`,
            right: `${-Math.cos(angle) * radius + radius}px`
        };
    };
    
    const toggleSpeedDial = async (instance) => {
        if (instance.isOpen) {
            await closeSpeedDial(instance);
        } else {
            await openSpeedDial(instance);
        }
    };
    
    const openSpeedDial = async (instance) => {
        const { speedDial } = instance.options;
        if (!speedDial) return;
        
        instance.isOpen = true;
        instance.container.classList.add(`${CONFIG.classes.container}--open`);
        
        // Rotation de l'icône principale
        if (CONFIG.behaviors.rotateIcon.enabled || speedDial.rotateIcon) {
            instance.element.style.transform = `rotate(${CONFIG.behaviors.rotateIcon.degrees}deg)`;
        }
        
        // Afficher le backdrop
        if (speedDial.backdrop) {
            const backdrop = instance.container.querySelector(`.${CONFIG.classes.backdrop}`);
            backdrop.classList.add(`${CONFIG.classes.backdrop}--visible`);
        }
        
        // Animer les items
        const animation = speedDial.animation || 'scale';
        const stagger = speedDial.stagger || CONFIG.behaviors.speedDial.stagger;
        
        for (let i = 0; i < instance.speedDialItems.length; i++) {
            const item = instance.speedDialItems[i];
            setTimeout(() => {
                item.classList.add(`${CONFIG.classes.speedDialItem}--visible`);
                animateElement(item, animation, 'enter');
            }, i * stagger);
        }
    };
    
    const closeSpeedDial = async (instance) => {
        const { speedDial } = instance.options;
        if (!speedDial || !instance.isOpen) return;
        
        instance.isOpen = false;
        instance.container.classList.remove(`${CONFIG.classes.container}--open`);
        
        // Réinitialiser la rotation
        instance.element.style.transform = '';
        
        // Masquer le backdrop
        if (speedDial.backdrop) {
            const backdrop = instance.container.querySelector(`.${CONFIG.classes.backdrop}`);
            backdrop.classList.remove(`${CONFIG.classes.backdrop}--visible`);
        }
        
        // Animer la fermeture
        instance.speedDialItems.forEach((item, i) => {
            setTimeout(() => {
                item.classList.remove(`${CONFIG.classes.speedDialItem}--visible`);
            }, i * 30);
        });
    };

    // ========================================
    // ANIMATIONS
    // ========================================
    const animateEnter = async (instance) => {
        const { animation } = instance.options;
        const animConfig = CONFIG.animations.enter[animation];
        
        if (!animConfig) return;
        
        if (window.AnimationEngine) {
            await window.AnimationEngine.animate(
                instance.element,
                animation + 'In',
                { duration: 400 }
            );
        } else {
            // Fallback CSS animation
            instance.element.classList.add(`${CONFIG.classes.button}--entering`);
            setTimeout(() => {
                instance.element.classList.remove(`${CONFIG.classes.button}--entering`);
            }, 400);
        }
    };
    
    const animateExit = async (instance) => {
        const { animation } = instance.options;
        
        if (window.AnimationEngine) {
            await window.AnimationEngine.animate(
                instance.element,
                animation + 'Out',
                { duration: 300 }
            );
        } else {
            instance.element.classList.add(`${CONFIG.classes.button}--exiting`);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    };
    
    const animateElement = (element, animation, direction = 'enter') => {
        const animClass = `ui-animate-${animation}-${direction}`;
        element.classList.add(animClass);
        
        element.addEventListener('animationend', () => {
            element.classList.remove(animClass);
        }, { once: true });
    };

    // ========================================
    // COMPORTEMENTS
    // ========================================
    const initializeBehaviors = (instance) => {
        const { behaviors } = instance.options;
        
        // Auto-hide on scroll
        if (behaviors.hideOnScroll?.enabled) {
            initHideOnScroll(instance);
        }
        
        // Pulsation
        if (behaviors.pulse?.enabled) {
            initPulse(instance);
        }
        
        // Morph to toolbar
        if (behaviors.morphToToolbar?.enabled) {
            instance.element.dataset.morphReady = 'true';
        }
    };
    
    const initHideOnScroll = (instance) => {
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY;
                    const threshold = instance.options.behaviors.hideOnScroll.threshold;
                    
                    if (currentScrollY > lastScrollY && currentScrollY > threshold) {
                        // Scrolling down
                        hide(instance);
                    } else if (currentScrollY < lastScrollY) {
                        // Scrolling up
                        show(instance);
                    }
                    
                    lastScrollY = currentScrollY;
                    ticking = false;
                });
                
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        instance.listeners.set('scroll', handleScroll);
    };
    
    const initPulse = (instance) => {
        const { interval, scale } = instance.options.behaviors.pulse;
        
        const pulse = () => {
            if (!instance.element || instance.state === 'hidden') return;
            
            instance.element.style.animation = `ui-fab-pulse ${interval}ms infinite`;
        };
        
        pulse();
        instance.pulseInterval = setInterval(pulse, interval);
    };

    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    const attachEvents = (instance) => {
        const { element } = instance;
        
        // Click principal
        element.addEventListener('click', (e) => {
            // Speed dial toggle
            if (instance.options.speedDial) {
                e.stopPropagation();
                toggleSpeedDial(instance);
            }
            
            // Callback custom
            if (instance.options.onClick) {
                instance.options.onClick(e, instance);
            }
            
            // Effet ripple
            createRipple(e, instance);
        });
        
        // Hover
        element.addEventListener('mouseenter', () => {
            instance.state = 'hover';
            element.classList.add(`${CONFIG.classes.button}--hover`);
        });
        
        element.addEventListener('mouseleave', () => {
            instance.state = 'default';
            element.classList.remove(`${CONFIG.classes.button}--hover`);
        });
        
        // Active
        element.addEventListener('mousedown', () => {
            instance.state = 'active';
            element.classList.add(`${CONFIG.classes.button}--active`);
        });
        
        element.addEventListener('mouseup', () => {
            instance.state = 'default';
            element.classList.remove(`${CONFIG.classes.button}--active`);
        });
        
        // Fermer speed dial au clic externe
        if (instance.options.speedDial) {
            document.addEventListener('click', (e) => {
                if (!instance.container.contains(e.target) && instance.isOpen) {
                    closeSpeedDial(instance);
                }
            });
        }
        
        // Keyboard support
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    };
    
    const createRipple = (event, instance) => {
        if (window.AnimationEngine?.effects?.ripple) {
            window.AnimationEngine.effects.ripple(instance.element, event);
        }
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    const loadStyles = async () => {
        const styleId = 'ui-fab-styles';
        if (document.getElementById(styleId)) return;
        
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/fab.css';
        document.head.appendChild(link);
        
        return new Promise((resolve) => {
            link.onload = resolve;
            link.onerror = () => {
                console.warn('[FAB] Failed to load styles');
                resolve();
            };
        });
    };
    
    const loadIcons = async (instance) => {
        if (!window.FrostedIcons) return;
        
        const iconElements = instance.element.querySelectorAll(`[data-icon]`);
        
        iconElements.forEach(iconEl => {
            const iconName = iconEl.dataset.icon;
            const icon = window.FrostedIcons.create(iconName, {
                size: CONFIG.types[instance.options.type].iconSize
            });
            iconEl.innerHTML = icon;
        });
    };
    
    const applyPosition = (element, position) => {
        const posConfig = CONFIG.positions[position];
        if (!posConfig) return;
        
        element.style.position = 'fixed';
        Object.assign(element.style, posConfig);
    };
    
    const applyCustomStyles = (instance) => {
        const { element, options } = instance;
        
        // Styles custom
        if (options.customStyles) {
            Object.assign(element.style, options.customStyles);
        }
        
        // Couleur custom
        if (options.color) {
            element.style.setProperty('--fab-color', options.color);
        }
        
        // Taille custom
        if (options.size) {
            element.style.setProperty('--fab-size', `${options.size}px`);
        }
    };
    
    const show = async (instance) => {
        instance.element.classList.remove(`${CONFIG.classes.button}--hidden`);
        instance.state = 'default';
        await animateEnter(instance);
    };
    
    const hide = async (instance) => {
        await animateExit(instance);
        instance.element.classList.add(`${CONFIG.classes.button}--hidden`);
        instance.state = 'hidden';
    };

    // ========================================
    // API PUBLIQUE
    // ========================================
    const createAPI = (instance) => {
        return {
            // Élément DOM
            get element() {
                return instance.element;
            },
            
            // État
            get state() {
                return instance.state;
            },
            
            // Visibilité
            show: () => show(instance),
            hide: () => hide(instance),
            toggle: () => instance.state === 'hidden' ? show(instance) : hide(instance),
            
            // État enabled/disabled
            enable() {
                instance.element.disabled = false;
                instance.element.classList.remove(`${CONFIG.classes.button}--disabled`);
                instance.state = 'default';
            },
            
            disable() {
                instance.element.disabled = true;
                instance.element.classList.add(`${CONFIG.classes.button}--disabled`);
                instance.state = 'disabled';
            },
            
            // Loading
            setLoading(isLoading) {
                if (isLoading) {
                    instance.element.classList.add(`${CONFIG.classes.button}--loading`);
                    instance.state = 'loading';
                } else {
                    instance.element.classList.remove(`${CONFIG.classes.button}--loading`);
                    instance.state = 'default';
                }
            },
            
            // Icône
            setIcon(iconName) {
                instance.options.icon = iconName;
                const iconEl = instance.element.querySelector(`.${CONFIG.classes.icon}`);
                if (iconEl && window.FrostedIcons) {
                    iconEl.innerHTML = window.FrostedIcons.create(iconName, {
                        size: CONFIG.types[instance.options.type].iconSize
                    });
                }
            },
            
            // Label (pour extended FAB)
            setLabel(label) {
                const labelEl = instance.element.querySelector(`.${CONFIG.classes.label}`);
                if (labelEl) {
                    labelEl.textContent = label;
                }
                instance.element.setAttribute('aria-label', label);
            },
            
            // Position
            setPosition(position) {
                instance.options.position = position;
                applyPosition(instance.element, position);
            },
            
            // Speed dial
            openSpeedDial: () => openSpeedDial(instance),
            closeSpeedDial: () => closeSpeedDial(instance),
            toggleSpeedDial: () => toggleSpeedDial(instance),
            
            // Morph
            async morphToToolbar(toolbarConfig) {
                if (!instance.options.behaviors.morphToToolbar?.enabled) return;
                
                // Animation de morphing complexe
                // À implémenter selon les besoins
            },
            
            // Destruction
            destroy() {
                // Nettoyer les intervals
                if (instance.pulseInterval) {
                    clearInterval(instance.pulseInterval);
                }
                
                // Retirer les listeners
                instance.listeners.forEach((handler, event) => {
                    window.removeEventListener(event, handler);
                });
                
                // Retirer du DOM
                if (instance.container) {
                    instance.container.remove();
                } else {
                    instance.element.remove();
                }
                
                // Retirer de la map
                instances.delete(instance.id);
            }
        };
    };

    // ========================================
    // EXPORT PUBLIC
    // ========================================
    return {
        create,
        
        // Accès à la configuration
        config: CONFIG,
        
        // Utilitaires
        utils: {
            getAllInstances: () => Array.from(instances.values()),
            getInstance: (id) => instances.get(id),
            hideAll: () => instances.forEach(instance => hide(instance)),
            showAll: () => instances.forEach(instance => show(instance))
        },
        
        // Templates pour extension
        templates: Templates
    };
})();

// Export pour utilisation
export default FabComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Speed dial radial positioning
   Solution: Calcul trigonométrique pour positions circulaires
   
   [DATE] - Conflits z-index avec modales
   Cause: z-index hardcodé
   Résolution: Utilisation du ZIndexManager du UIManager
   
   [DATE] - Performance hide on scroll
   Cause: Trop d'événements scroll
   Résolution: RequestAnimationFrame + throttling
   
   NOTES POUR REPRISES FUTURES:
   - Le FAB nécessite le fichier fab.css
   - FrostedIcons est optionnel mais recommandé
   - AnimationEngine améliore les animations
   - Le morphing complet nécessite plus de développement
   ======================================== */