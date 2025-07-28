/* ========================================
   SPEED-DIAL.COMPONENT.JS - Système de Speed Dial complet
   Chemin: src/js/shared/ui/navigation/speed-dial.component.js
   
   DESCRIPTION:
   Composant Speed Dial (FAB multi-actions) ultra-complet.
   Bouton d'action flottant qui révèle plusieurs actions secondaires.
   Style principal glassmorphism avec animations riches.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Gestion de l'état (lignes 402-500)
   3. Création et structure (lignes 502-1000)
   4. Interactions et événements (lignes 1002-1400)
   5. Animations et effets (lignes 1402-1600)
   6. API publique (lignes 1602-1700)
   
   DÉPENDANCES:
   - speed-dial.css (styles complets)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const SpeedDialComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Directions d'ouverture
        directions: {
            'up': {
                name: 'Vers le haut',
                angle: -90,
                transform: (index, total) => ({
                    x: 0,
                    y: -(index + 1) * 60
                })
            },
            'down': {
                name: 'Vers le bas',
                angle: 90,
                transform: (index, total) => ({
                    x: 0,
                    y: (index + 1) * 60
                })
            },
            'left': {
                name: 'Vers la gauche',
                angle: 180,
                transform: (index, total) => ({
                    x: -(index + 1) * 60,
                    y: 0
                })
            },
            'right': {
                name: 'Vers la droite',
                angle: 0,
                transform: (index, total) => ({
                    x: (index + 1) * 60,
                    y: 0
                })
            },
            'radial': {
                name: 'Radial',
                angle: 0,
                transform: (index, total) => {
                    const angle = (index * (Math.PI * 2)) / total - Math.PI / 2;
                    const radius = 80;
                    return {
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    };
                }
            },
            'arc': {
                name: 'Arc de cercle',
                angle: 0,
                startAngle: -90,
                endAngle: 90,
                transform: (index, total) => {
                    const startAngle = -90 * (Math.PI / 180);
                    const endAngle = 0;
                    const angleStep = (endAngle - startAngle) / (total - 1 || 1);
                    const angle = startAngle + (index * angleStep);
                    const radius = 80;
                    return {
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    };
                }
            },
            'quarter-circle': {
                name: 'Quart de cercle',
                angle: 0,
                transform: (index, total) => {
                    const angleStep = 90 / (total - 1 || 1);
                    const angle = (index * angleStep - 90) * (Math.PI / 180);
                    const radius = 80;
                    return {
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    };
                }
            }
        },

        // Positions du FAB principal
        positions: {
            'bottom-right': {
                bottom: 24,
                right: 24
            },
            'bottom-left': {
                bottom: 24,
                left: 24
            },
            'top-right': {
                top: 24,
                right: 24
            },
            'top-left': {
                top: 24,
                left: 24
            },
            'bottom-center': {
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)'
            },
            'top-center': {
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)'
            },
            'center': {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }
        },

        // Types de déclenchement
        triggers: {
            'click': {
                name: 'Clic',
                events: ['click'],
                toggle: true
            },
            'hover': {
                name: 'Survol',
                events: ['mouseenter', 'mouseleave'],
                toggle: false
            },
            'both': {
                name: 'Clic et survol',
                events: ['click', 'mouseenter', 'mouseleave'],
                toggle: true
            },
            'long-press': {
                name: 'Appui long',
                events: ['mousedown', 'touchstart'],
                delay: 500,
                toggle: false
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                name: 'Glassmorphism',
                blur: 20,
                opacity: 0.1,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                name: 'Neumorphism',
                background: '#e0e5ec',
                shadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff'
            },
            'flat': {
                name: 'Flat',
                background: '#3b82f6',
                shadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            },
            'minimal': {
                name: 'Minimal',
                background: 'transparent',
                border: '2px solid currentColor'
            },
            'material': {
                name: 'Material',
                elevation: 3,
                ripple: true
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                name: 'Aucune',
                duration: 0
            },
            'subtle': {
                name: 'Subtile',
                duration: 200,
                easing: 'ease',
                stagger: 30
            },
            'smooth': {
                name: 'Fluide',
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                stagger: 50,
                scale: true
            },
            'bouncy': {
                name: 'Rebond',
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 60,
                scale: true,
                rotate: true
            },
            'rich': {
                name: 'Riche',
                duration: 500,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 80,
                scale: true,
                rotate: true,
                blur: true,
                particles: true,
                trail: true
            }
        },

        // Tailles
        sizes: {
            'mini': {
                main: 40,
                action: 32,
                icon: 16,
                spacing: 48
            },
            'small': {
                main: 48,
                action: 40,
                icon: 20,
                spacing: 56
            },
            'medium': {
                main: 56,
                action: 48,
                icon: 24,
                spacing: 64
            },
            'large': {
                main: 64,
                action: 56,
                icon: 28,
                spacing: 72
            }
        },

        // Features disponibles
        features: {
            backdrop: {
                name: 'Backdrop',
                description: 'Fond sombre derrière les actions',
                blur: true,
                closeOnClick: true
            },
            labels: {
                name: 'Labels',
                description: 'Afficher les labels des actions',
                position: 'left', // left, right, top, bottom
                alwaysVisible: false
            },
            tooltips: {
                name: 'Tooltips',
                description: 'Bulles d\'aide au survol',
                delay: 500
            },
            counter: {
                name: 'Compteur',
                description: 'Badge avec nombre',
                position: 'top-right'
            },
            pulse: {
                name: 'Pulsation',
                description: 'Animation de pulsation',
                color: 'currentColor',
                duration: 2000
            },
            keyboard: {
                name: 'Navigation clavier',
                description: 'Support des raccourcis clavier',
                openKey: 'Space',
                navigateKeys: ['ArrowUp', 'ArrowDown']
            }
        },

        // Configuration par défaut
        defaults: {
            direction: 'up',
            position: 'bottom-right',
            trigger: 'click',
            style: 'glassmorphism',
            animation: 'smooth',
            size: 'medium',
            mainIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>`,
            closeIcon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`,
            rotateMainIcon: true,
            autoClose: true,
            mobileDirection: 'up'
        }
    };

    // État global
    const state = new Map();
    let idCounter = 0;

    // ========================================
    // GESTION DE L'ÉTAT
    // ========================================

    /**
     * Génère un ID unique
     */
    function generateId() {
        return `speed-dial-${Date.now()}-${++idCounter}`;
    }

    /**
     * Merge les options
     */
    function mergeOptions(options = {}) {
        return {
            ...CONFIG.defaults,
            ...options,
            features: {
                ...CONFIG.features,
                ...(options.features || {})
            }
        };
    }

    // ========================================
    // CRÉATION ET STRUCTURE
    // ========================================

    /**
     * Crée la structure du speed dial
     */
    function createStructure(options) {
        const container = document.createElement('div');
        container.className = `speed-dial speed-dial-${options.direction} speed-dial-${options.style} speed-dial-${options.size}`;
        container.setAttribute('data-speed-dial-id', options.id);
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', options.ariaLabel || 'Speed dial actions');
        
        // Appliquer la position
        const position = CONFIG.positions[options.position];
        Object.assign(container.style, position);
        
        // Bouton principal
        const mainButton = createMainButton(options);
        container.appendChild(mainButton);
        
        // Conteneur des actions
        const actionsContainer = createActionsContainer(options);
        container.appendChild(actionsContainer);
        
        // Effet glassmorphism
        if (options.style === 'glassmorphism') {
            const glow = document.createElement('div');
            glow.className = 'speed-dial-glow';
            container.appendChild(glow);
        }
        
        return container;
    }

    /**
     * Crée le bouton principal
     */
    function createMainButton(options) {
        const button = document.createElement('button');
        button.className = 'speed-dial-main';
        button.setAttribute('aria-label', options.mainLabel || 'Open speed dial');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-haspopup', 'true');
        
        // Icône
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'speed-dial-main-icon';
        iconWrapper.innerHTML = options.mainIcon;
        
        // Icône de fermeture
        if (options.closeIcon && options.rotateMainIcon) {
            const closeIcon = document.createElement('div');
            closeIcon.className = 'speed-dial-close-icon';
            closeIcon.innerHTML = options.closeIcon;
            iconWrapper.appendChild(closeIcon);
        }
        
        button.appendChild(iconWrapper);
        
        // Compteur
        if (options.counter) {
            const counter = document.createElement('span');
            counter.className = 'speed-dial-counter';
            counter.textContent = options.counter;
            button.appendChild(counter);
        }
        
        // Pulsation
        if (options.features.pulse) {
            const pulse = document.createElement('div');
            pulse.className = 'speed-dial-pulse';
            button.appendChild(pulse);
        }
        
        return button;
    }

    /**
     * Crée le conteneur des actions
     */
    function createActionsContainer(options) {
        const container = document.createElement('div');
        container.className = 'speed-dial-actions';
        container.setAttribute('role', 'menu');
        
        if (options.actions && options.actions.length > 0) {
            options.actions.forEach((action, index) => {
                const actionElement = createAction(action, index, options);
                container.appendChild(actionElement);
            });
        }
        
        return container;
    }

    /**
     * Crée une action
     */
    function createAction(action, index, options) {
        const element = document.createElement('div');
        element.className = 'speed-dial-action-wrapper';
        
        // Bouton d'action
        const button = document.createElement('button');
        button.className = `speed-dial-action ${action.className || ''}`;
        button.setAttribute('role', 'menuitem');
        button.setAttribute('aria-label', action.label || action.name);
        button.setAttribute('data-action-index', index);
        button.setAttribute('tabindex', '-1');
        
        if (action.disabled) {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
        }
        
        // Icône
        if (action.icon) {
            const icon = document.createElement('div');
            icon.className = 'speed-dial-action-icon';
            icon.innerHTML = action.icon;
            button.appendChild(icon);
        }
        
        // Style personnalisé
        if (action.color) {
            button.style.setProperty('--action-color', action.color);
        }
        
        element.appendChild(button);
        
        // Label
        if (options.features.labels && action.label) {
            const label = document.createElement('span');
            label.className = `speed-dial-label speed-dial-label-${options.features.labels.position || 'left'}`;
            label.textContent = action.label;
            element.appendChild(label);
        }
        
        // Tooltip
        if (options.features.tooltips && action.tooltip) {
            button.setAttribute('data-tooltip', action.tooltip);
        }
        
        // Badge
        if (action.badge) {
            const badge = document.createElement('span');
            badge.className = `speed-dial-action-badge ${action.badge.type || ''}`;
            badge.textContent = action.badge.text;
            button.appendChild(badge);
        }
        
        return element;
    }

    /**
     * Crée le backdrop
     */
    function createBackdrop(options) {
        const backdrop = document.createElement('div');
        backdrop.className = 'speed-dial-backdrop';
        backdrop.setAttribute('data-speed-dial-id', options.id);
        
        if (options.features.backdrop?.blur) {
            backdrop.classList.add('backdrop-blur');
        }
        
        return backdrop;
    }

    // ========================================
    // INTERACTIONS ET ÉVÉNEMENTS
    // ========================================

    /**
     * Initialise les événements
     */
    function initializeEvents(container, options) {
        const speedDialState = state.get(options.id);
        const mainButton = container.querySelector('.speed-dial-main');
        const actions = container.querySelectorAll('.speed-dial-action');
        
        // Trigger principal
        const trigger = CONFIG.triggers[options.trigger];
        
        if (trigger.events.includes('click')) {
            mainButton.addEventListener('click', () => toggle(options.id));
        }
        
        if (trigger.events.includes('mouseenter')) {
            container.addEventListener('mouseenter', () => open(options.id));
        }
        
        if (trigger.events.includes('mouseleave')) {
            container.addEventListener('mouseleave', () => {
                if (!speedDialState.pinned) {
                    close(options.id);
                }
            });
        }
        
        if (trigger.events.includes('mousedown') || trigger.events.includes('touchstart')) {
            let pressTimer;
            
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    open(options.id);
                    speedDialState.longPressed = true;
                }, trigger.delay || 500);
            };
            
            const endPress = () => {
                clearTimeout(pressTimer);
                if (speedDialState.longPressed && options.trigger === 'long-press') {
                    setTimeout(() => close(options.id), 100);
                    speedDialState.longPressed = false;
                }
            };
            
            mainButton.addEventListener('mousedown', startPress);
            mainButton.addEventListener('touchstart', startPress, { passive: true });
            mainButton.addEventListener('mouseup', endPress);
            mainButton.addEventListener('touchend', endPress);
            mainButton.addEventListener('mouseleave', endPress);
        }
        
        // Actions
        actions.forEach((action, index) => {
            action.addEventListener('click', (e) => {
                handleActionClick(e, index, options);
            });
            
            // Hover effect
            if (options.animation !== 'none') {
                action.addEventListener('mouseenter', (e) => {
                    if (options.animation === 'rich') {
                        createRipple(e.currentTarget, e);
                    }
                });
            }
        });
        
        // Keyboard navigation
        if (options.features.keyboard) {
            initializeKeyboard(container, options);
        }
        
        // Touch/Swipe support
        if ('ontouchstart' in window) {
            initializeTouch(container, options);
        }
        
        // Backdrop click
        if (options.features.backdrop?.closeOnClick) {
            const backdrop = document.querySelector(`[data-speed-dial-id="${options.id}"].speed-dial-backdrop`);
            if (backdrop) {
                backdrop.addEventListener('click', () => close(options.id));
            }
        }
        
        // Auto close on outside click
        if (options.autoClose) {
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target) && speedDialState.open) {
                    close(options.id);
                }
            });
        }
        
        // Responsive direction
        if (options.mobileDirection && options.mobileDirection !== options.direction) {
            const mediaQuery = window.matchMedia('(max-width: 768px)');
            
            const handleMediaChange = (e) => {
                if (e.matches) {
                    container.classList.remove(`speed-dial-${options.direction}`);
                    container.classList.add(`speed-dial-${options.mobileDirection}`);
                    speedDialState.currentDirection = options.mobileDirection;
                } else {
                    container.classList.remove(`speed-dial-${options.mobileDirection}`);
                    container.classList.add(`speed-dial-${options.direction}`);
                    speedDialState.currentDirection = options.direction;
                }
                
                if (speedDialState.open) {
                    updatePositions(container, options);
                }
            };
            
            mediaQuery.addEventListener('change', handleMediaChange);
            handleMediaChange(mediaQuery);
        }
    }

    /**
     * Gère le clic sur une action
     */
    function handleActionClick(event, index, options) {
        const action = options.actions[index];
        
        if (action.handler) {
            action.handler(event, action);
        }
        
        if (options.autoClose && !action.keepOpen) {
            close(options.id);
        }
        
        // Callback global
        if (options.onActionClick) {
            options.onActionClick(action, index);
        }
    }

    /**
     * Initialise la navigation clavier
     */
    function initializeKeyboard(container, options) {
        const mainButton = container.querySelector('.speed-dial-main');
        const actions = container.querySelectorAll('.speed-dial-action');
        let focusedIndex = -1;
        
        // Open with keyboard
        mainButton.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggle(options.id);
            }
        });
        
        // Navigation in menu
        container.addEventListener('keydown', (e) => {
            const speedDialState = state.get(options.id);
            if (!speedDialState.open) return;
            
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    focusedIndex = (focusedIndex + 1) % actions.length;
                    actions[focusedIndex].focus();
                    break;
                    
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    focusedIndex = focusedIndex <= 0 ? actions.length - 1 : focusedIndex - 1;
                    actions[focusedIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    focusedIndex = 0;
                    actions[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    focusedIndex = actions.length - 1;
                    actions[focusedIndex].focus();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    close(options.id);
                    mainButton.focus();
                    break;
            }
        });
    }

    /**
     * Initialise les interactions tactiles
     */
    function initializeTouch(container, options) {
        let touchStartY = 0;
        let touchStartX = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // Swipe up to open (if direction is up)
            if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -50) {
                const speedDialState = state.get(options.id);
                if (!speedDialState.open && options.direction === 'up') {
                    open(options.id);
                }
            }
            // Add more swipe directions as needed
        }, { passive: true });
    }

    // ========================================
    // ANIMATIONS ET EFFETS
    // ========================================

    /**
     * Anime l'ouverture
     */
    function animateOpen(container, options) {
        const speedDialState = state.get(options.id);
        const animation = CONFIG.animations[options.animation];
        const direction = CONFIG.directions[speedDialState.currentDirection || options.direction];
        const actions = container.querySelectorAll('.speed-dial-action-wrapper');
        
        // Reset positions
        actions.forEach(action => {
            action.style.transform = 'translate(0, 0) scale(0)';
            action.style.opacity = '0';
        });
        
        // Force reflow
        container.offsetHeight;
        
        // Animate each action
        actions.forEach((action, index) => {
            const transform = direction.transform(index, actions.length);
            const delay = animation.stagger ? index * animation.stagger : 0;
            
            action.style.transition = `all ${animation.duration}ms ${animation.easing} ${delay}ms`;
            action.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(1)`;
            action.style.opacity = '1';
            
            // Rich animations
            if (options.animation === 'rich') {
                // Trail effect
                if (animation.trail) {
                    createTrail(action, transform, delay);
                }
                
                // Blur effect
                if (animation.blur) {
                    action.style.filter = 'blur(2px)';
                    setTimeout(() => {
                        action.style.filter = 'none';
                    }, delay + animation.duration / 2);
                }
            }
        });
        
        // Particles
        if (options.animation === 'rich' && animation.particles) {
            createParticles(container);
        }
        
        // Rotate main button
        if (options.rotateMainIcon) {
            const mainIcon = container.querySelector('.speed-dial-main-icon');
            mainIcon.style.transform = 'rotate(45deg)';
        }
    }

    /**
     * Anime la fermeture
     */
    function animateClose(container, options) {
        const animation = CONFIG.animations[options.animation];
        const actions = container.querySelectorAll('.speed-dial-action-wrapper');
        
        actions.forEach((action, index) => {
            const delay = animation.stagger ? (actions.length - index - 1) * animation.stagger : 0;
            
            action.style.transition = `all ${animation.duration}ms ${animation.easing} ${delay}ms`;
            action.style.transform = 'translate(0, 0) scale(0)';
            action.style.opacity = '0';
        });
        
        // Rotate main button back
        if (options.rotateMainIcon) {
            const mainIcon = container.querySelector('.speed-dial-main-icon');
            mainIcon.style.transform = 'rotate(0deg)';
        }
    }

    /**
     * Crée un effet de traînée
     */
    function createTrail(element, transform, delay) {
        const trail = document.createElement('div');
        trail.className = 'speed-dial-trail';
        trail.style.width = element.offsetWidth + 'px';
        trail.style.height = element.offsetHeight + 'px';
        
        element.parentElement.appendChild(trail);
        
        setTimeout(() => {
            trail.style.transform = `translate(${transform.x}px, ${transform.y}px)`;
            trail.style.opacity = '0';
        }, delay);
        
        setTimeout(() => trail.remove(), 1000);
    }

    /**
     * Crée des particules
     */
    function createParticles(container) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'speed-dial-particles';
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'speed-dial-particle';
            particle.style.setProperty('--angle', `${i * 30}deg`);
            particle.style.setProperty('--delay', `${i * 50}ms`);
            particlesContainer.appendChild(particle);
        }
        
        container.appendChild(particlesContainer);
        setTimeout(() => particlesContainer.remove(), 2000);
    }

    /**
     * Crée un effet ripple
     */
    function createRipple(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'speed-dial-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    /**
     * Met à jour les positions
     */
    function updatePositions(container, options) {
        const speedDialState = state.get(options.id);
        if (!speedDialState.open) return;
        
        const direction = CONFIG.directions[speedDialState.currentDirection || options.direction];
        const actions = container.querySelectorAll('.speed-dial-action-wrapper');
        
        actions.forEach((action, index) => {
            const transform = direction.transform(index, actions.length);
            action.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(1)`;
        });
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================

    /**
     * Ouvre le speed dial
     */
    function open(id) {
        const speedDialState = state.get(id);
        if (!speedDialState || speedDialState.open) return;
        
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (!container) return;
        
        speedDialState.open = true;
        container.classList.add('open');
        
        const mainButton = container.querySelector('.speed-dial-main');
        mainButton.setAttribute('aria-expanded', 'true');
        
        // Backdrop
        if (speedDialState.options.features.backdrop) {
            const backdrop = document.querySelector(`[data-speed-dial-id="${id}"].speed-dial-backdrop`);
            if (backdrop) {
                backdrop.classList.add('visible');
            }
        }
        
        // Animation
        animateOpen(container, speedDialState.options);
        
        // Focus first action
        if (speedDialState.options.features.keyboard) {
            setTimeout(() => {
                const firstAction = container.querySelector('.speed-dial-action:not([disabled])');
                if (firstAction) {
                    firstAction.setAttribute('tabindex', '0');
                }
            }, 100);
        }
        
        // Callback
        if (speedDialState.options.onOpen) {
            speedDialState.options.onOpen();
        }
    }

    /**
     * Ferme le speed dial
     */
    function close(id) {
        const speedDialState = state.get(id);
        if (!speedDialState || !speedDialState.open) return;
        
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (!container) return;
        
        speedDialState.open = false;
        container.classList.remove('open');
        
        const mainButton = container.querySelector('.speed-dial-main');
        mainButton.setAttribute('aria-expanded', 'false');
        
        // Backdrop
        const backdrop = document.querySelector(`[data-speed-dial-id="${id}"].speed-dial-backdrop`);
        if (backdrop) {
            backdrop.classList.remove('visible');
        }
        
        // Animation
        animateClose(container, speedDialState.options);
        
        // Reset tabindex
        const actions = container.querySelectorAll('.speed-dial-action');
        actions.forEach(action => {
            action.setAttribute('tabindex', '-1');
        });
        
        // Callback
        if (speedDialState.options.onClose) {
            speedDialState.options.onClose();
        }
    }

    /**
     * Toggle le speed dial
     */
    function toggle(id) {
        const speedDialState = state.get(id);
        if (!speedDialState) return;
        
        if (speedDialState.open) {
            close(id);
        } else {
            open(id);
        }
    }

    /**
     * Met à jour les actions
     */
    function updateActions(id, actions) {
        const speedDialState = state.get(id);
        if (!speedDialState) return;
        
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (!container) return;
        
        // Mettre à jour les options
        speedDialState.options.actions = actions;
        
        // Recréer le conteneur d'actions
        const actionsContainer = container.querySelector('.speed-dial-actions');
        actionsContainer.innerHTML = '';
        
        actions.forEach((action, index) => {
            const actionElement = createAction(action, index, speedDialState.options);
            actionsContainer.appendChild(actionElement);
        });
        
        // Réinitialiser les événements
        const newActions = actionsContainer.querySelectorAll('.speed-dial-action');
        newActions.forEach((action, index) => {
            action.addEventListener('click', (e) => {
                handleActionClick(e, index, speedDialState.options);
            });
        });
    }

    /**
     * Met à jour le compteur
     */
    function updateCounter(id, count) {
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (!container) return;
        
        let counter = container.querySelector('.speed-dial-counter');
        
        if (count && count > 0) {
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'speed-dial-counter';
                container.querySelector('.speed-dial-main').appendChild(counter);
            }
            counter.textContent = count > 99 ? '99+' : count;
        } else if (counter) {
            counter.remove();
        }
    }

    /**
     * Active/désactive une action
     */
    function setActionEnabled(id, actionIndex, enabled) {
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (!container) return;
        
        const action = container.querySelector(`[data-action-index="${actionIndex}"]`);
        if (!action) return;
        
        action.disabled = !enabled;
        action.setAttribute('aria-disabled', !enabled);
    }

    /**
     * Détruit le speed dial
     */
    function destroy(id) {
        const speedDialState = state.get(id);
        if (!speedDialState) return;
        
        // Fermer d'abord
        close(id);
        
        // Retirer les éléments
        const container = document.querySelector(`[data-speed-dial-id="${id}"]`);
        if (container) container.remove();
        
        const backdrop = document.querySelector(`[data-speed-dial-id="${id}"].speed-dial-backdrop`);
        if (backdrop) backdrop.remove();
        
        // Nettoyer l'état
        state.delete(id);
    }

    /**
     * Injecte les styles CSS
     */
    function injectStyles() {
        if (document.getElementById('speed-dial-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'speed-dial-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/speed-dial.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Crée un speed dial
         */
        create(options = {}) {
            const finalOptions = mergeOptions(options);
            const id = finalOptions.id || generateId();
            finalOptions.id = id;
            
            // Créer l'état
            state.set(id, {
                id,
                options: finalOptions,
                open: false,
                pinned: false,
                currentDirection: finalOptions.direction
            });
            
            // Créer la structure
            const container = createStructure(finalOptions);
            
            // Créer le backdrop si nécessaire
            if (finalOptions.features.backdrop) {
                const backdrop = createBackdrop(finalOptions);
                document.body.appendChild(backdrop);
            }
            
            // Ajouter au DOM
            document.body.appendChild(container);
            
            // Initialiser les événements
            initializeEvents(container, finalOptions);
            
            // Injecter les styles
            if (finalOptions.injectStyles !== false) {
                injectStyles();
            }
            
            // API
            return {
                id,
                open: () => open(id),
                close: () => close(id),
                toggle: () => toggle(id),
                updateActions: (actions) => updateActions(id, actions),
                updateCounter: (count) => updateCounter(id, count),
                setActionEnabled: (actionIndex, enabled) => setActionEnabled(id, actionIndex, enabled),
                destroy: () => destroy(id),
                element: container
            };
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Méthodes utilitaires
        injectStyles,
        
        // Obtenir tous les speed dials
        getAll() {
            return Array.from(state.entries()).map(([id, data]) => ({
                id,
                ...data
            }));
        },
        
        // Fermer tous les speed dials
        closeAll() {
            state.forEach((_, id) => close(id));
        }
    };
})();

// Export pour utilisation
export default SpeedDialComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Calcul des positions radiales
   Solution: Utilisation de fonctions trigonométriques avec angles en radians
   
   [DATE] - Gestion des z-index avec backdrop
   Solution: Z-index élevés et structure DOM appropriée
   
   [DATE] - Performance avec animations riches
   Solution: Utilisation de transform et opacity uniquement
   
   NOTES POUR REPRISES FUTURES:
   - Les positions sont calculées dynamiquement
   - Les animations utilisent CSS transforms
   - Le backdrop est optionnel et séparé
   - Support complet du clavier et accessibilité
   ======================================== */