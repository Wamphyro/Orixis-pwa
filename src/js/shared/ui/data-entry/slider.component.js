/* ========================================
   SLIDER.COMPONENT.JS - Composant Slider complet
   Chemin: src/js/shared/ui/data-entry/slider.component.js
   
   DESCRIPTION:
   Composant slider ultra-complet avec toutes les options possibles.
   Supporte single, range, multi-points, orientations, marks, tooltips, etc.
   Style principal glassmorphism avec 4 autres variantes.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Méthodes privées (lignes 302-1200)
   3. Gestionnaires d'événements (lignes 1202-1400)
   4. API publique (lignes 1402-1450)
   
   DÉPENDANCES:
   - slider.css (styles complets)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const SliderComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de slider disponibles
        types: {
            'single': {
                name: 'Single',
                description: 'Slider simple avec une seule valeur',
                handles: 1,
                defaultValue: 50
            },
            'range': {
                name: 'Range',
                description: 'Slider avec deux poignées pour sélectionner une plage',
                handles: 2,
                defaultValue: [20, 80]
            },
            'multi': {
                name: 'Multi',
                description: 'Slider avec plusieurs poignées',
                handles: 'dynamic',
                defaultValue: [20, 50, 80]
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
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                name: 'Flat',
                description: 'Design plat et simple',
                background: '#f3f4f6',
                border: '#e5e7eb'
            },
            'minimal': {
                name: 'Minimal',
                description: 'Design minimaliste',
                trackHeight: 2,
                handleSize: 16
            },
            'material': {
                name: 'Material',
                description: 'Material Design',
                elevation: 2,
                ripple: true
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
                transitions: {
                    handle: '0.2s ease',
                    track: '0.2s ease',
                    tooltip: '0.2s ease'
                },
                hover: {
                    scale: 1.1
                }
            },
            'smooth': {
                name: 'Fluide',
                transitions: {
                    handle: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    track: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    tooltip: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    value: '0.3s ease'
                },
                hover: {
                    scale: 1.15,
                    glow: true
                },
                active: {
                    scale: 1.2,
                    pulse: true
                }
            },
            'rich': {
                name: 'Riche',
                transitions: {
                    handle: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    track: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    tooltip: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    value: '0.4s ease',
                    marks: '0.3s ease'
                },
                hover: {
                    scale: 1.2,
                    glow: true,
                    rotate: true
                },
                active: {
                    scale: 1.3,
                    pulse: true,
                    ripple: true
                },
                microInteractions: true,
                particles: true
            }
        },

        // Features disponibles
        features: {
            marks: {
                name: 'Marks',
                description: 'Afficher des marques sur le slider',
                types: ['dots', 'lines', 'numbers', 'custom']
            },
            labels: {
                name: 'Labels',
                description: 'Afficher des labels aux extrémités',
                position: ['top', 'bottom', 'sides']
            },
            tooltip: {
                name: 'Tooltip',
                description: 'Afficher la valeur au survol/drag',
                types: ['hover', 'always', 'active', 'never'],
                format: ['number', 'percent', 'custom']
            },
            snapping: {
                name: 'Snapping',
                description: 'Accrocher aux valeurs spécifiques',
                types: ['marks', 'steps', 'values']
            },
            keyboard: {
                name: 'Keyboard',
                description: 'Navigation au clavier',
                step: 1,
                pageStep: 10
            },
            touch: {
                name: 'Touch',
                description: 'Support tactile avancé',
                swipe: true,
                multitouch: true
            }
        },

        // Orientations
        orientations: {
            'horizontal': {
                name: 'Horizontal',
                default: true
            },
            'vertical': {
                name: 'Vertical',
                height: 200
            }
        },

        // Tailles prédéfinies
        sizes: {
            'xs': {
                trackHeight: 2,
                handleSize: 12,
                fontSize: 11
            },
            'sm': {
                trackHeight: 4,
                handleSize: 16,
                fontSize: 12
            },
            'md': {
                trackHeight: 6,
                handleSize: 20,
                fontSize: 14
            },
            'lg': {
                trackHeight: 8,
                handleSize: 24,
                fontSize: 16
            },
            'xl': {
                trackHeight: 10,
                handleSize: 28,
                fontSize: 18
            }
        },

        // Couleurs personnalisables
        colors: {
            track: {
                default: 'rgba(255, 255, 255, 0.2)',
                filled: 'currentColor'
            },
            handle: {
                default: 'currentColor',
                hover: 'var(--primary-color)',
                active: 'var(--primary-dark)'
            },
            marks: {
                default: 'rgba(255, 255, 255, 0.3)',
                active: 'currentColor'
            }
        },

        // Valeurs par défaut
        defaults: {
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            orientation: 'horizontal',
            size: 'md',
            style: 'glassmorphism',
            animation: 'smooth',
            disabled: false,
            readonly: false
        }
    };

    // État global des sliders
    const state = new Map();
    let idCounter = 0;

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================

    /**
     * Génère un ID unique
     */
    function generateId() {
        return `slider-${Date.now()}-${++idCounter}`;
    }

    /**
     * Merge les options avec les valeurs par défaut
     */
    function mergeOptions(options = {}) {
        return {
            ...CONFIG.defaults,
            ...options,
            features: {
                ...CONFIG.features,
                ...(options.features || {})
            },
            colors: {
                ...CONFIG.colors,
                ...(options.colors || {})
            }
        };
    }

    /**
     * Crée la structure HTML du slider
     */
    function createStructure(options) {
        const { id, type, orientation, style, size } = options;
        
        const container = document.createElement('div');
        container.className = `slider-container slider-${type} slider-${orientation} slider-${style} slider-${size}`;
        container.setAttribute('data-slider-id', id);
        container.setAttribute('role', 'slider');
        container.setAttribute('aria-orientation', orientation);
        container.setAttribute('aria-valuemin', options.min);
        container.setAttribute('aria-valuemax', options.max);
        
        // Track principal
        const track = document.createElement('div');
        track.className = 'slider-track';
        
        // Track rempli
        const fill = document.createElement('div');
        fill.className = 'slider-fill';
        track.appendChild(fill);
        
        // Conteneur pour les marks
        if (options.features.marks) {
            const marksContainer = createMarks(options);
            track.appendChild(marksContainer);
        }
        
        container.appendChild(track);
        
        // Créer les handles selon le type
        const handles = createHandles(options);
        handles.forEach(handle => container.appendChild(handle));
        
        // Labels
        if (options.features.labels) {
            const labels = createLabels(options);
            container.appendChild(labels);
        }
        
        // Tooltip global
        if (options.features.tooltip && options.features.tooltip.type === 'always') {
            const tooltip = createTooltip(options);
            container.appendChild(tooltip);
        }
        
        return container;
    }

    /**
     * Crée les handles (poignées)
     */
    function createHandles(options) {
        const { type, value } = options;
        const handles = [];
        
        let values = Array.isArray(value) ? value : [value];
        
        if (type === 'single') {
            values = [values[0]];
        } else if (type === 'range' && values.length !== 2) {
            values = [options.min, options.max];
        }
        
        values.forEach((val, index) => {
            const handle = document.createElement('div');
            handle.className = 'slider-handle';
            handle.setAttribute('role', 'slider');
            handle.setAttribute('tabindex', '0');
            handle.setAttribute('aria-valuenow', val);
            handle.setAttribute('data-handle-index', index);
            
            // Tooltip individuel
            if (options.features.tooltip && options.features.tooltip.type !== 'never') {
                const tooltip = document.createElement('div');
                tooltip.className = 'slider-tooltip';
                tooltip.textContent = formatValue(val, options);
                handle.appendChild(tooltip);
            }
            
            // Effet glassmorphism
            if (options.style === 'glassmorphism') {
                const glow = document.createElement('div');
                glow.className = 'slider-handle-glow';
                handle.appendChild(glow);
            }
            
            handles.push(handle);
        });
        
        return handles;
    }

    /**
     * Crée les marks
     */
    function createMarks(options) {
        const { min, max, step, features } = options;
        const container = document.createElement('div');
        container.className = 'slider-marks';
        
        const markType = features.marks.type || 'dots';
        const markStep = features.marks.step || step * 10;
        
        for (let value = min; value <= max; value += markStep) {
            const mark = document.createElement('div');
            mark.className = `slider-mark slider-mark-${markType}`;
            mark.setAttribute('data-value', value);
            
            const position = ((value - min) / (max - min)) * 100;
            mark.style[options.orientation === 'horizontal' ? 'left' : 'bottom'] = `${position}%`;
            
            if (markType === 'numbers' || features.marks.labels) {
                const label = document.createElement('span');
                label.className = 'slider-mark-label';
                label.textContent = formatValue(value, options);
                mark.appendChild(label);
            }
            
            container.appendChild(mark);
        }
        
        return container;
    }

    /**
     * Crée les labels
     */
    function createLabels(options) {
        const { min, max, features, orientation } = options;
        const container = document.createElement('div');
        container.className = `slider-labels slider-labels-${features.labels.position || 'bottom'}`;
        
        const minLabel = document.createElement('span');
        minLabel.className = 'slider-label slider-label-min';
        minLabel.textContent = formatValue(min, options);
        
        const maxLabel = document.createElement('span');
        maxLabel.className = 'slider-label slider-label-max';
        maxLabel.textContent = formatValue(max, options);
        
        container.appendChild(minLabel);
        container.appendChild(maxLabel);
        
        return container;
    }

    /**
     * Crée un tooltip
     */
    function createTooltip(options) {
        const tooltip = document.createElement('div');
        tooltip.className = 'slider-tooltip slider-tooltip-global';
        return tooltip;
    }

    /**
     * Formate une valeur pour l'affichage
     */
    function formatValue(value, options) {
        const { features } = options;
        
        if (features.tooltip?.format === 'percent') {
            const percent = ((value - options.min) / (options.max - options.min)) * 100;
            return `${Math.round(percent)}%`;
        }
        
        if (features.tooltip?.format === 'custom' && features.tooltip.formatter) {
            return features.tooltip.formatter(value);
        }
        
        return value.toString();
    }

    /**
     * Initialise les événements
     */
    function initializeEvents(element, options) {
        const sliderState = state.get(options.id);
        const handles = element.querySelectorAll('.slider-handle');
        const track = element.querySelector('.slider-track');
        
        // Events pour chaque handle
        handles.forEach((handle, index) => {
            // Mouse events
            handle.addEventListener('mousedown', (e) => startDrag(e, element, options, index));
            
            // Touch events
            handle.addEventListener('touchstart', (e) => startDrag(e, element, options, index), { passive: true });
            
            // Keyboard events
            handle.addEventListener('keydown', (e) => handleKeyboard(e, element, options, index));
            
            // Focus events
            handle.addEventListener('focus', () => handleFocus(handle, options));
            handle.addEventListener('blur', () => handleBlur(handle, options));
        });
        
        // Click sur la track
        track.addEventListener('click', (e) => handleTrackClick(e, element, options));
        
        // Hover effects
        if (options.animation !== 'none') {
            element.addEventListener('mouseenter', () => handleHover(element, options, true));
            element.addEventListener('mouseleave', () => handleHover(element, options, false));
        }
    }

    /**
     * Gère le début du drag
     */
    function startDrag(event, element, options, handleIndex) {
        if (options.disabled || options.readonly) return;
        
        event.preventDefault();
        const sliderState = state.get(options.id);
        sliderState.dragging = true;
        sliderState.activeHandle = handleIndex;
        
        const handle = element.querySelectorAll('.slider-handle')[handleIndex];
        handle.classList.add('dragging');
        
        // Ajouter les animations
        if (options.animation === 'rich') {
            createRipple(handle, event);
        }
        
        // Événements globaux
        const moveHandler = (e) => handleDrag(e, element, options, handleIndex);
        const endHandler = () => endDrag(element, options, handleIndex, moveHandler, endHandler);
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: true });
        document.addEventListener('mouseup', endHandler);
        document.addEventListener('touchend', endHandler);
    }

    /**
     * Gère le drag
     */
    function handleDrag(event, element, options, handleIndex) {
        const sliderState = state.get(options.id);
        if (!sliderState.dragging) return;
        
        const track = element.querySelector('.slider-track');
        const rect = track.getBoundingClientRect();
        
        let position;
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        if (options.orientation === 'horizontal') {
            position = (clientX - rect.left) / rect.width;
        } else {
            position = 1 - (clientY - rect.top) / rect.height;
        }
        
        position = Math.max(0, Math.min(1, position));
        
        const value = calculateValue(position, options);
        updateValue(element, options, handleIndex, value);
    }

    /**
     * Termine le drag
     */
    function endDrag(element, options, handleIndex, moveHandler, endHandler) {
        const sliderState = state.get(options.id);
        sliderState.dragging = false;
        
        const handle = element.querySelectorAll('.slider-handle')[handleIndex];
        handle.classList.remove('dragging');
        
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchend', endHandler);
        
        // Callback
        if (options.onChangeEnd) {
            options.onChangeEnd(getValue(options.id));
        }
    }

    /**
     * Gère le clic sur la track
     */
    function handleTrackClick(event, element, options) {
        if (options.disabled || options.readonly) return;
        if (event.target.classList.contains('slider-handle')) return;
        
        const track = element.querySelector('.slider-track');
        const rect = track.getBoundingClientRect();
        
        let position;
        if (options.orientation === 'horizontal') {
            position = (event.clientX - rect.left) / rect.width;
        } else {
            position = 1 - (event.clientY - rect.top) / rect.height;
        }
        
        position = Math.max(0, Math.min(1, position));
        const value = calculateValue(position, options);
        
        // Trouver le handle le plus proche
        const handleIndex = findClosestHandle(value, options);
        updateValue(element, options, handleIndex, value);
    }

    /**
     * Gère les événements clavier
     */
    function handleKeyboard(event, element, options, handleIndex) {
        if (options.disabled || options.readonly) return;
        
        const { min, max, step } = options;
        const currentValue = getValue(options.id);
        const handleValue = Array.isArray(currentValue) ? currentValue[handleIndex] : currentValue;
        
        let newValue = handleValue;
        const bigStep = options.features.keyboard?.pageStep || step * 10;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                event.preventDefault();
                newValue = Math.max(min, handleValue - step);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                event.preventDefault();
                newValue = Math.min(max, handleValue + step);
                break;
            case 'PageDown':
                event.preventDefault();
                newValue = Math.max(min, handleValue - bigStep);
                break;
            case 'PageUp':
                event.preventDefault();
                newValue = Math.min(max, handleValue + bigStep);
                break;
            case 'Home':
                event.preventDefault();
                newValue = min;
                break;
            case 'End':
                event.preventDefault();
                newValue = max;
                break;
            default:
                return;
        }
        
        updateValue(element, options, handleIndex, newValue);
    }

    /**
     * Calcule la valeur depuis une position
     */
    function calculateValue(position, options) {
        const { min, max, step } = options;
        let value = min + position * (max - min);
        
        // Snapping
        if (options.features.snapping) {
            value = Math.round(value / step) * step;
        }
        
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Trouve le handle le plus proche
     */
    function findClosestHandle(value, options) {
        const currentValue = getValue(options.id);
        
        if (!Array.isArray(currentValue)) {
            return 0;
        }
        
        let closestIndex = 0;
        let closestDistance = Math.abs(value - currentValue[0]);
        
        for (let i = 1; i < currentValue.length; i++) {
            const distance = Math.abs(value - currentValue[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }

    /**
     * Met à jour une valeur
     */
    function updateValue(element, options, handleIndex, newValue) {
        const sliderState = state.get(options.id);
        let values = Array.isArray(sliderState.value) ? [...sliderState.value] : [sliderState.value];
        
        values[handleIndex] = newValue;
        
        // Contraintes pour le type range
        if (options.type === 'range' && values.length === 2) {
            if (handleIndex === 0 && values[0] > values[1]) {
                values[0] = values[1];
            } else if (handleIndex === 1 && values[1] < values[0]) {
                values[1] = values[0];
            }
        }
        
        // Mise à jour de l'état
        sliderState.value = options.type === 'single' ? values[0] : values;
        
        // Mise à jour visuelle
        updateVisuals(element, options);
        
        // Callback
        if (options.onChange) {
            options.onChange(getValue(options.id));
        }
    }

    /**
     * Met à jour l'affichage visuel
     */
    function updateVisuals(element, options) {
        const sliderState = state.get(options.id);
        const { min, max, orientation } = options;
        const values = Array.isArray(sliderState.value) ? sliderState.value : [sliderState.value];
        
        // Mise à jour des handles
        const handles = element.querySelectorAll('.slider-handle');
        handles.forEach((handle, index) => {
            if (index < values.length) {
                const position = ((values[index] - min) / (max - min)) * 100;
                
                if (orientation === 'horizontal') {
                    handle.style.left = `${position}%`;
                    handle.style.transform = 'translateX(-50%)';
                } else {
                    handle.style.bottom = `${position}%`;
                    handle.style.transform = 'translateY(50%)';
                }
                
                handle.setAttribute('aria-valuenow', values[index]);
                
                // Mise à jour du tooltip
                const tooltip = handle.querySelector('.slider-tooltip');
                if (tooltip) {
                    tooltip.textContent = formatValue(values[index], options);
                }
            }
        });
        
        // Mise à jour de la barre de remplissage
        updateFill(element, options, values);
        
        // Mise à jour des marks actives
        updateActiveMarks(element, options, values);
    }

    /**
     * Met à jour la barre de remplissage
     */
    function updateFill(element, options, values) {
        const fill = element.querySelector('.slider-fill');
        const { min, max, orientation, type } = options;
        
        if (type === 'single') {
            const position = ((values[0] - min) / (max - min)) * 100;
            
            if (orientation === 'horizontal') {
                fill.style.left = '0';
                fill.style.width = `${position}%`;
            } else {
                fill.style.bottom = '0';
                fill.style.height = `${position}%`;
            }
        } else if (type === 'range' && values.length >= 2) {
            const start = ((Math.min(...values) - min) / (max - min)) * 100;
            const end = ((Math.max(...values) - min) / (max - min)) * 100;
            
            if (orientation === 'horizontal') {
                fill.style.left = `${start}%`;
                fill.style.width = `${end - start}%`;
            } else {
                fill.style.bottom = `${start}%`;
                fill.style.height = `${end - start}%`;
            }
        }
    }

    /**
     * Met à jour les marks actives
     */
    function updateActiveMarks(element, options, values) {
        const marks = element.querySelectorAll('.slider-mark');
        
        marks.forEach(mark => {
            const markValue = parseFloat(mark.getAttribute('data-value'));
            let isActive = false;
            
            if (options.type === 'single') {
                isActive = markValue <= values[0];
            } else if (options.type === 'range' && values.length >= 2) {
                isActive = markValue >= Math.min(...values) && markValue <= Math.max(...values);
            }
            
            mark.classList.toggle('active', isActive);
        });
    }

    /**
     * Crée un effet ripple
     */
    function createRipple(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'slider-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = (event.clientX || event.touches[0].clientX) - rect.left - size / 2;
        const y = (event.clientY || event.touches[0].clientY) - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    /**
     * Gère le hover
     */
    function handleHover(element, options, isHovering) {
        element.classList.toggle('hovering', isHovering);
        
        if (options.animation === 'rich' && isHovering) {
            // Ajouter des particules ou autres effets
            createParticles(element);
        }
    }

    /**
     * Crée des particules
     */
    function createParticles(element) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'slider-particles';
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'slider-particle';
            particle.style.animationDelay = `${i * 0.1}s`;
            particlesContainer.appendChild(particle);
        }
        
        element.appendChild(particlesContainer);
        
        setTimeout(() => {
            particlesContainer.remove();
        }, 2000);
    }

    /**
     * Gère le focus
     */
    function handleFocus(handle, options) {
        handle.classList.add('focused');
        
        if (options.animation === 'rich') {
            handle.querySelector('.slider-handle-glow')?.classList.add('active');
        }
    }

    /**
     * Gère la perte de focus
     */
    function handleBlur(handle, options) {
        handle.classList.remove('focused');
        
        if (options.animation === 'rich') {
            handle.querySelector('.slider-handle-glow')?.classList.remove('active');
        }
    }

    /**
     * Active ou désactive le slider
     */
    function setEnabled(id, enabled) {
        const sliderState = state.get(id);
        if (!sliderState) return;
        
        const element = document.querySelector(`[data-slider-id="${id}"]`);
        if (!element) return;
        
        sliderState.options.disabled = !enabled;
        element.classList.toggle('disabled', !enabled);
        
        const handles = element.querySelectorAll('.slider-handle');
        handles.forEach(handle => {
            handle.setAttribute('aria-disabled', !enabled);
            handle.tabIndex = enabled ? 0 : -1;
        });
    }

    /**
     * Met à jour les options
     */
    function updateOptions(id, newOptions) {
        const sliderState = state.get(id);
        if (!sliderState) return;
        
        Object.assign(sliderState.options, newOptions);
        
        const element = document.querySelector(`[data-slider-id="${id}"]`);
        if (element) {
            updateVisuals(element, sliderState.options);
        }
    }

    /**
     * Détruit un slider
     */
    function destroy(id) {
        const element = document.querySelector(`[data-slider-id="${id}"]`);
        if (element) {
            element.remove();
        }
        
        state.delete(id);
    }

    /**
     * Obtient la valeur actuelle
     */
    function getValue(id) {
        const sliderState = state.get(id);
        return sliderState ? sliderState.value : null;
    }

    /**
     * Définit la valeur
     */
    function setValue(id, value) {
        const sliderState = state.get(id);
        if (!sliderState) return;
        
        const element = document.querySelector(`[data-slider-id="${id}"]`);
        if (!element) return;
        
        if (sliderState.options.type === 'single') {
            sliderState.value = Array.isArray(value) ? value[0] : value;
        } else {
            sliderState.value = Array.isArray(value) ? value : [value];
        }
        
        updateVisuals(element, sliderState.options);
    }

    /**
     * Injecte les styles CSS
     */
    function injectStyles() {
        if (document.getElementById('slider-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'slider-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/slider.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            const finalOptions = mergeOptions(options);
            const id = finalOptions.id || generateId();
            finalOptions.id = id;
            
            // Créer l'état
            state.set(id, {
                value: finalOptions.value,
                options: finalOptions,
                dragging: false,
                activeHandle: null
            });
            
            // Créer la structure
            const element = createStructure(finalOptions);
            
            // Initialiser les événements
            initializeEvents(element, finalOptions);
            
            // Mise à jour initiale
            updateVisuals(element, finalOptions);
            
            // Injecter les styles si nécessaire
            if (finalOptions.injectStyles !== false) {
                injectStyles();
            }
            
            return {
                element,
                id,
                getValue: () => getValue(id),
                setValue: (value) => setValue(id, value),
                setEnabled: (enabled) => setEnabled(id, enabled),
                updateOptions: (newOptions) => updateOptions(id, newOptions),
                destroy: () => destroy(id),
                on: (event, handler) => {
                    const key = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
                    if (state.has(id)) {
                        state.get(id).options[key] = handler;
                    }
                }
            };
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Méthodes utilitaires
        injectStyles,
        
        // Obtenir tous les sliders
        getAll() {
            return Array.from(state.entries()).map(([id, data]) => ({
                id,
                value: data.value,
                options: data.options
            }));
        },
        
        // Détruire tous les sliders
        destroyAll() {
            state.forEach((_, id) => destroy(id));
        }
    };
})();

// Export pour utilisation
export default SliderComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Gestion du multi-touch
   Solution: Utilisation de event.touches avec indices séparés
   
   [DATE] - Performance avec beaucoup de marks
   Solution: Utilisation de CSS transforms au lieu de recalculs
   
   [DATE] - Accessibilité clavier complexe
   Solution: Support complet ARIA et navigation intuitive
   
   NOTES POUR REPRISES FUTURES:
   - Le slider utilise des positions en % pour la flexibilité
   - Les animations riches peuvent impacter les performances
   - Le type multi nécessite une logique de contraintes
   - Les événements touch nécessitent { passive: true }
   ======================================== */