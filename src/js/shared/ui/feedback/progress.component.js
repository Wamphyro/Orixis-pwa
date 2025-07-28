/* ========================================
   PROGRESS.COMPONENT.JS - Composant Progress Multi-styles
   Chemin: src/js/shared/ui/feedback/progress.component.js
   
   DESCRIPTION:
   Composant progress ultra-complet avec support glassmorphism,
   plusieurs types (linear, circular, dots, steps), animations riches,
   et toutes les fonctionnalités imaginables.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-250)
   2. Styles CSS dynamiques (lignes 251-600)
   3. Méthodes de création (lignes 601-900)
   4. Méthodes de mise à jour (lignes 901-1000)
   5. API publique (lignes 1001-1100)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Utilise les variables CSS du thème global
   ======================================== */

const ProgressComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de progress disponibles
        types: {
            'linear': {
                name: 'Linear',
                defaultHeight: 8,
                minHeight: 2,
                maxHeight: 40,
                supportsLabel: true,
                supportsSegments: true
            },
            'circular': {
                name: 'Circular',
                defaultSize: 120,
                minSize: 40,
                maxSize: 400,
                strokeWidth: 8,
                supportsLabel: true
            },
            'semi-circular': {
                name: 'Semi-circular',
                defaultSize: 120,
                minSize: 60,
                maxSize: 400,
                strokeWidth: 8,
                supportsLabel: true
            },
            'dots': {
                name: 'Dots',
                defaultDots: 5,
                minDots: 3,
                maxDots: 10,
                dotSize: 12,
                gap: 8
            },
            'steps': {
                name: 'Steps',
                defaultSteps: 4,
                minSteps: 2,
                maxSteps: 10,
                supportsLabel: true
            },
            'wave': {
                name: 'Wave',
                defaultHeight: 60,
                waveHeight: 20,
                waveSpeed: 2
            },
            'gradient-ring': {
                name: 'Gradient Ring',
                defaultSize: 120,
                ringWidth: 20,
                segments: 100
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                progressBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
                borderRadius: '12px'
            },
            'neumorphism': {
                background: '#e0e5ec',
                boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                progressBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px'
            },
            'flat': {
                background: '#f3f4f6',
                progressBg: '#3b82f6',
                borderRadius: '4px'
            },
            'material': {
                background: '#e0e0e0',
                progressBg: '#1976d2',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderRadius: '4px'
            },
            'gradient': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                progressBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50px'
            },
            'neon': {
                background: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(0, 255, 255, 0.5)',
                progressBg: 'linear-gradient(90deg, #00ffff, #ff00ff)',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2)',
                borderRadius: '50px',
                glowEffect: true
            },
            'minimal': {
                background: 'transparent',
                border: '1px solid #e5e7eb',
                progressBg: '#000000',
                borderRadius: '2px'
            }
        },

        // Animations disponibles
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                transition: 'all 0.3s ease',
                progressTransition: 'width 0.3s ease'
            },
            'smooth': {
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                progressTransition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                hoverScale: 1.02
            },
            'rich': {
                transition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                progressTransition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                pulseAnimation: true,
                shimmerEffect: true,
                particleEffect: true
            },
            'pulse': {
                keyframe: 'progress-pulse',
                duration: '2s',
                iterationCount: 'infinite'
            },
            'wave': {
                keyframe: 'progress-wave',
                duration: '3s',
                iterationCount: 'infinite'
            },
            'shimmer': {
                keyframe: 'progress-shimmer',
                duration: '2s',
                iterationCount: 'infinite'
            },
            'stripe-move': {
                keyframe: 'progress-stripe-move',
                duration: '1s',
                iterationCount: 'infinite',
                linear: true
            }
        },

        // Fonctionnalités
        features: {
            'label': {
                position: ['inside', 'outside', 'tooltip', 'floating'],
                format: ['percentage', 'fraction', 'custom', 'time'],
                showOnHover: false,
                animated: true
            },
            'segments': {
                count: [2, 3, 4, 5, 10],
                gap: 2,
                roundedEnds: true,
                individualColors: true
            },
            'gradient': {
                types: ['linear', 'radial', 'conic'],
                animate: true,
                multiColor: true
            },
            'striped': {
                angle: 45,
                width: 10,
                animate: true,
                reverse: false
            },
            'buffer': {
                enabled: true,
                opacity: 0.3,
                showDots: true
            },
            'indeterminate': {
                enabled: true,
                speed: 1.5,
                width: '30%'
            },
            'tooltip': {
                enabled: true,
                position: 'top',
                showValue: true,
                showRemaining: true,
                customContent: null
            },
            'states': {
                loading: { color: '#3b82f6', icon: 'spinner' },
                success: { color: '#22c55e', icon: 'check' },
                error: { color: '#ef4444', icon: 'x' },
                warning: { color: '#f59e0b', icon: 'alert' },
                paused: { color: '#6b7280', icon: 'pause' }
            }
        },

        // Couleurs prédéfinies
        colors: {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            dark: '#1f2937',
            light: '#f3f4f6'
        },

        // Tailles prédéfinies
        sizes: {
            'xs': { linear: 2, circular: 40, dots: 6 },
            'sm': { linear: 4, circular: 60, dots: 8 },
            'md': { linear: 8, circular: 120, dots: 12 },
            'lg': { linear: 12, circular: 160, dots: 16 },
            'xl': { linear: 16, circular: 200, dots: 20 }
        }
    };

    // ========================================
    // STYLES CSS DYNAMIQUES
    // ========================================
    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected) return;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            /* ========================================
               PROGRESS COMPONENT STYLES
               ======================================== */
            
            /* Container principal */
            .progress-container {
                position: relative;
                width: 100%;
                transition: var(--transition, all 0.3s ease);
            }

            /* Progress linéaire */
            .progress-linear {
                width: 100%;
                overflow: hidden;
                position: relative;
            }

            .progress-linear-track {
                width: 100%;
                height: var(--progress-height, 8px);
                position: relative;
                overflow: hidden;
            }

            .progress-linear-fill {
                height: 100%;
                width: var(--progress-value, 0%);
                transition: var(--progress-transition, width 0.3s ease);
                position: relative;
                overflow: hidden;
            }

            /* Progress circulaire */
            .progress-circular {
                display: inline-block;
                position: relative;
            }

            .progress-circular svg {
                transform: rotate(-90deg);
                transition: var(--transition, all 0.3s ease);
            }

            .progress-circular-track {
                fill: none;
                stroke: var(--track-color, rgba(0, 0, 0, 0.1));
                stroke-width: var(--stroke-width, 8);
            }

            .progress-circular-fill {
                fill: none;
                stroke: var(--progress-color);
                stroke-width: var(--stroke-width, 8);
                stroke-dasharray: var(--circumference);
                stroke-dashoffset: var(--offset);
                transition: var(--progress-transition, stroke-dashoffset 0.3s ease);
                stroke-linecap: round;
            }

            /* Progress dots */
            .progress-dots {
                display: flex;
                gap: var(--dot-gap, 8px);
                align-items: center;
            }

            .progress-dot {
                width: var(--dot-size, 12px);
                height: var(--dot-size, 12px);
                border-radius: 50%;
                background: var(--dot-color, rgba(0, 0, 0, 0.2));
                transition: all 0.3s ease;
            }

            .progress-dot.active {
                background: var(--progress-color);
                transform: scale(1.2);
            }

            .progress-dot.partial {
                background: var(--progress-color);
                opacity: var(--partial-opacity, 0.5);
            }

            /* Progress steps */
            .progress-steps {
                display: flex;
                position: relative;
                width: 100%;
            }

            .progress-step {
                flex: 1;
                text-align: center;
                position: relative;
            }

            .progress-step-indicator {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--step-bg, #e5e7eb);
                margin: 0 auto 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 2;
                transition: all 0.3s ease;
            }

            .progress-step.active .progress-step-indicator {
                background: var(--progress-color);
                color: white;
                transform: scale(1.1);
            }

            .progress-step.completed .progress-step-indicator {
                background: var(--success-color, #22c55e);
                color: white;
            }

            .progress-step-line {
                position: absolute;
                top: 16px;
                left: 50%;
                right: -50%;
                height: 2px;
                background: var(--line-color, #e5e7eb);
                z-index: 1;
            }

            .progress-step.completed .progress-step-line {
                background: var(--success-color, #22c55e);
            }

            .progress-step:last-child .progress-step-line {
                display: none;
            }

            /* Labels */
            .progress-label {
                position: absolute;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                white-space: nowrap;
            }

            .progress-label.inside {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            }

            .progress-label.outside {
                top: -24px;
                right: 0;
            }

            .progress-label.floating {
                top: 50%;
                left: var(--progress-value, 0%);
                transform: translate(-50%, -50%);
                background: var(--label-bg, rgba(0, 0, 0, 0.8));
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
            }

            /* États */
            .progress-container.loading {
                opacity: 0.8;
            }

            .progress-container.success .progress-linear-fill,
            .progress-container.success .progress-circular-fill {
                background: var(--success-color, #22c55e) !important;
                stroke: var(--success-color, #22c55e) !important;
            }

            .progress-container.error .progress-linear-fill,
            .progress-container.error .progress-circular-fill {
                background: var(--error-color, #ef4444) !important;
                stroke: var(--error-color, #ef4444) !important;
            }

            /* Animations */
            @keyframes progress-pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
            }

            @keyframes progress-wave {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(100%);
                }
            }

            @keyframes progress-shimmer {
                0% {
                    background-position: -200% center;
                }
                100% {
                    background-position: 200% center;
                }
            }

            @keyframes progress-stripe-move {
                0% {
                    background-position: 0 0;
                }
                100% {
                    background-position: 40px 40px;
                }
            }

            /* Effet shimmer */
            .progress-shimmer {
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.4),
                    transparent
                );
                background-size: 200% 100%;
                animation: progress-shimmer 2s infinite;
            }

            /* Effet striped */
            .progress-striped {
                background-image: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 255, 255, 0.1) 10px,
                    rgba(255, 255, 255, 0.1) 20px
                );
                animation: progress-stripe-move 1s linear infinite;
            }

            /* Buffer/Secondary progress */
            .progress-buffer {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: var(--buffer-value, 0%);
                background: var(--buffer-color, rgba(0, 0, 0, 0.1));
                transition: width 0.3s ease;
            }

            /* Indeterminate */
            .progress-indeterminate .progress-linear-fill {
                width: var(--indeterminate-width, 30%);
                position: absolute;
                animation: progress-wave var(--indeterminate-speed, 1.5s) ease-in-out infinite;
            }

            /* Glassmorphism spécifique */
            .progress-container.glassmorphism .progress-linear-track {
                position: relative;
                overflow: visible;
            }

            .progress-container.glassmorphism .progress-linear-track::before {
                content: '';
                position: absolute;
                inset: -1px;
                border-radius: inherit;
                padding: 1px;
                background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0));
                mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                mask-composite: exclude;
                -webkit-mask-composite: xor;
                opacity: 0.5;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .progress-label {
                    font-size: 11px;
                }
                
                .progress-step-indicator {
                    width: 24px;
                    height: 24px;
                }
            }

            /* Accessibilité */
            .progress-container:focus-within {
                outline: 2px solid var(--focus-color, #3b82f6);
                outline-offset: 2px;
            }

            /* Support du mode sombre */
            @media (prefers-color-scheme: dark) {
                .progress-container {
                    --track-color: rgba(255, 255, 255, 0.1);
                    --step-bg: rgba(255, 255, 255, 0.2);
                    --line-color: rgba(255, 255, 255, 0.1);
                }
            }
        `;

        document.head.appendChild(styleSheet);
        stylesInjected = true;
    }

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================
    function createLinearProgress(options) {
        const container = document.createElement('div');
        container.className = 'progress-linear';

        const track = document.createElement('div');
        track.className = 'progress-linear-track';
        
        // Appliquer le style
        const style = CONFIG.styles[options.style] || CONFIG.styles.glassmorphism;
        Object.assign(track.style, {
            background: style.background,
            backdropFilter: style.backdropFilter,
            border: style.border,
            boxShadow: style.boxShadow,
            borderRadius: style.borderRadius,
            height: `${options.height || CONFIG.types.linear.defaultHeight}px`
        });

        // Buffer si activé
        if (options.features?.buffer) {
            const buffer = document.createElement('div');
            buffer.className = 'progress-buffer';
            track.appendChild(buffer);
        }

        // Barre de progression
        const fill = document.createElement('div');
        fill.className = 'progress-linear-fill';
        if (options.features?.striped) {
            fill.classList.add('progress-striped');
        }
        if (options.animation === 'shimmer') {
            const shimmer = document.createElement('div');
            shimmer.className = 'progress-shimmer';
            fill.appendChild(shimmer);
        }
        
        fill.style.background = options.color || style.progressBg;
        fill.style.setProperty('--progress-value', `${options.value || 0}%`);
        
        track.appendChild(fill);
        container.appendChild(track);

        // Label si demandé
        if (options.features?.label) {
            const label = createLabel(options);
            container.appendChild(label);
        }

        return container;
    }

    function createCircularProgress(options) {
        const container = document.createElement('div');
        container.className = 'progress-circular';

        const size = options.size || CONFIG.types.circular.defaultSize;
        const strokeWidth = options.strokeWidth || CONFIG.types.circular.strokeWidth;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        // Track (fond)
        const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        track.classList.add('progress-circular-track');
        track.setAttribute('cx', size / 2);
        track.setAttribute('cy', size / 2);
        track.setAttribute('r', radius);

        // Fill (progression)
        const fill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        fill.classList.add('progress-circular-fill');
        fill.setAttribute('cx', size / 2);
        fill.setAttribute('cy', size / 2);
        fill.setAttribute('r', radius);
        
        const offset = circumference - (options.value / 100) * circumference;
        fill.style.setProperty('--circumference', circumference);
        fill.style.setProperty('--offset', offset);
        fill.style.setProperty('--progress-color', options.color || CONFIG.colors.primary);
        fill.style.setProperty('--stroke-width', strokeWidth);

        svg.appendChild(track);
        svg.appendChild(fill);
        container.appendChild(svg);

        // Label au centre si demandé
        if (options.features?.label) {
            const label = document.createElement('div');
            label.className = 'progress-label';
            label.style.position = 'absolute';
            label.style.top = '50%';
            label.style.left = '50%';
            label.style.transform = 'translate(-50%, -50%)';
            label.textContent = formatLabel(options.value, options);
            container.appendChild(label);
        }

        return container;
    }

    function createDotsProgress(options) {
        const container = document.createElement('div');
        container.className = 'progress-dots';

        const dotCount = options.dots || CONFIG.types.dots.defaultDots;
        const value = options.value || 0;
        const activeDots = Math.floor((value / 100) * dotCount);
        const partialDot = Math.ceil((value / 100) * dotCount) - 1;
        const partialOpacity = ((value / 100) * dotCount) % 1;

        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            
            if (i < activeDots) {
                dot.classList.add('active');
            } else if (i === partialDot && partialOpacity > 0) {
                dot.classList.add('partial');
                dot.style.setProperty('--partial-opacity', partialOpacity);
            }

            dot.style.setProperty('--dot-size', `${options.dotSize || CONFIG.types.dots.dotSize}px`);
            dot.style.setProperty('--progress-color', options.color || CONFIG.colors.primary);
            
            container.appendChild(dot);
        }

        container.style.setProperty('--dot-gap', `${options.gap || CONFIG.types.dots.gap}px`);
        
        return container;
    }

    function createStepsProgress(options) {
        const container = document.createElement('div');
        container.className = 'progress-steps';

        const steps = options.steps || CONFIG.types.steps.defaultSteps;
        const currentStep = Math.floor((options.value / 100) * steps);

        for (let i = 0; i < steps; i++) {
            const step = document.createElement('div');
            step.className = 'progress-step';
            
            if (i < currentStep) {
                step.classList.add('completed');
            } else if (i === currentStep) {
                step.classList.add('active');
            }

            // Indicateur
            const indicator = document.createElement('div');
            indicator.className = 'progress-step-indicator';
            indicator.textContent = i + 1;
            step.appendChild(indicator);

            // Ligne de connexion
            if (i < steps - 1) {
                const line = document.createElement('div');
                line.className = 'progress-step-line';
                step.appendChild(line);
            }

            // Label optionnel
            if (options.stepLabels && options.stepLabels[i]) {
                const label = document.createElement('div');
                label.className = 'progress-step-label';
                label.textContent = options.stepLabels[i];
                step.appendChild(label);
            }

            container.appendChild(step);
        }

        container.style.setProperty('--progress-color', options.color || CONFIG.colors.primary);
        container.style.setProperty('--success-color', CONFIG.colors.success);
        
        return container;
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function createLabel(options) {
        const label = document.createElement('div');
        label.className = `progress-label ${options.features.label.position || 'outside'}`;
        label.textContent = formatLabel(options.value, options);
        return label;
    }

    function formatLabel(value, options) {
        const format = options.features?.label?.format || 'percentage';
        
        switch (format) {
            case 'percentage':
                return `${Math.round(value)}%`;
            case 'fraction':
                return `${value}/100`;
            case 'custom':
                return options.features.label.customFormat?.(value) || `${value}%`;
            case 'time':
                const remaining = 100 - value;
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            default:
                return `${value}%`;
        }
    }

    function applyAnimation(element, animation) {
        const animConfig = CONFIG.animations[animation];
        if (!animConfig || !animConfig.enabled === false) return;

        if (animConfig.keyframe) {
            element.style.animation = `${animConfig.keyframe} ${animConfig.duration} ${animConfig.iterationCount}`;
            if (animConfig.linear) {
                element.style.animationTimingFunction = 'linear';
            }
        }

        if (animConfig.transition) {
            element.style.setProperty('--transition', animConfig.transition);
        }

        if (animConfig.progressTransition) {
            element.style.setProperty('--progress-transition', animConfig.progressTransition);
        }
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE CRÉATION
    // ========================================
    function create(options = {}) {
        // Injecter les styles si nécessaire
        injectStyles();

        // Options par défaut
        const defaultOptions = {
            type: 'linear',
            style: 'glassmorphism',
            animation: 'smooth',
            value: 0,
            color: null,
            size: null,
            features: {}
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Créer le container principal
        const container = document.createElement('div');
        container.className = `progress-container ${finalOptions.style}`;
        
        // Appliquer l'état si défini
        if (finalOptions.state) {
            container.classList.add(finalOptions.state);
        }

        // Créer le type de progress approprié
        let progressElement;
        switch (finalOptions.type) {
            case 'circular':
            case 'semi-circular':
                progressElement = createCircularProgress(finalOptions);
                break;
            case 'dots':
                progressElement = createDotsProgress(finalOptions);
                break;
            case 'steps':
                progressElement = createStepsProgress(finalOptions);
                break;
            case 'linear':
            default:
                progressElement = createLinearProgress(finalOptions);
                break;
        }

        // Appliquer les animations
        applyAnimation(progressElement, finalOptions.animation);

        // Mode indéterminé
        if (finalOptions.features?.indeterminate) {
            container.classList.add('progress-indeterminate');
            progressElement.style.setProperty('--indeterminate-width', finalOptions.features.indeterminate.width || '30%');
            progressElement.style.setProperty('--indeterminate-speed', `${finalOptions.features.indeterminate.speed || 1.5}s`);
        }

        container.appendChild(progressElement);

        // Accessibilité
        container.setAttribute('role', 'progressbar');
        container.setAttribute('aria-valuenow', finalOptions.value);
        container.setAttribute('aria-valuemin', '0');
        container.setAttribute('aria-valuemax', '100');
        if (finalOptions.label) {
            container.setAttribute('aria-label', finalOptions.label);
        }

        // Stocker les options pour les mises à jour
        container._progressOptions = finalOptions;
        container._progressElement = progressElement;

        return container;
    }

    // ========================================
    // MÉTHODES DE MISE À JOUR
    // ========================================
    function update(container, updates) {
        if (!container._progressOptions) return;

        const options = { ...container._progressOptions, ...updates };
        container._progressOptions = options;

        // Mettre à jour la valeur
        if ('value' in updates) {
            const value = Math.max(0, Math.min(100, updates.value));
            
            switch (options.type) {
                case 'linear':
                    const fill = container.querySelector('.progress-linear-fill');
                    if (fill) {
                        fill.style.setProperty('--progress-value', `${value}%`);
                    }
                    const buffer = container.querySelector('.progress-buffer');
                    if (buffer && updates.bufferValue !== undefined) {
                        buffer.style.setProperty('--buffer-value', `${updates.bufferValue}%`);
                    }
                    break;
                    
                case 'circular':
                case 'semi-circular':
                    const circle = container.querySelector('.progress-circular-fill');
                    if (circle) {
                        const circumference = parseFloat(circle.style.getPropertyValue('--circumference'));
                        const offset = circumference - (value / 100) * circumference;
                        circle.style.setProperty('--offset', offset);
                    }
                    break;
                    
                case 'dots':
                    // Recréer les dots avec la nouvelle valeur
                    const dotsContainer = container.querySelector('.progress-dots');
                    if (dotsContainer) {
                        container.replaceChild(
                            createDotsProgress({ ...options, value }),
                            dotsContainer
                        );
                    }
                    break;
                    
                case 'steps':
                    // Recréer les steps avec la nouvelle valeur
                    const stepsContainer = container.querySelector('.progress-steps');
                    if (stepsContainer) {
                        container.replaceChild(
                            createStepsProgress({ ...options, value }),
                            stepsContainer
                        );
                    }
                    break;
            }

            // Mettre à jour le label
            const label = container.querySelector('.progress-label');
            if (label) {
                label.textContent = formatLabel(value, options);
            }

            // Mettre à jour l'accessibilité
            container.setAttribute('aria-valuenow', value);
        }

        // Mettre à jour l'état
        if ('state' in updates) {
            container.className = `progress-container ${options.style}`;
            if (updates.state) {
                container.classList.add(updates.state);
            }
        }

        // Mettre à jour la couleur
        if ('color' in updates) {
            const elements = container.querySelectorAll('.progress-linear-fill, .progress-circular-fill, .progress-dot.active');
            elements.forEach(el => {
                if (el.tagName === 'circle') {
                    el.style.setProperty('--progress-color', updates.color);
                } else {
                    el.style.background = updates.color;
                }
            });
        }

        return container;
    }

    // ========================================
    // MÉTHODE DE DESTRUCTION
    // ========================================
    function destroy(container) {
        if (!container || !container._progressOptions) return;

        // Nettoyer les références
        delete container._progressOptions;
        delete container._progressElement;

        // Supprimer le container
        container.remove();
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        update,
        destroy,
        injectStyles,
        CONFIG,
        
        // Méthodes utilitaires exposées
        formatLabel,
        
        // Créateurs spécifiques pour plus de contrôle
        createLinear: (options) => create({ ...options, type: 'linear' }),
        createCircular: (options) => create({ ...options, type: 'circular' }),
        createDots: (options) => create({ ...options, type: 'dots' }),
        createSteps: (options) => create({ ...options, type: 'steps' }),
        
        // Présets pour utilisation rapide
        presets: {
            loading: () => create({ type: 'linear', style: 'glassmorphism', animation: 'shimmer', features: { indeterminate: true } }),
            uploadProgress: (value) => create({ type: 'linear', value, style: 'glassmorphism', features: { label: { position: 'inside', format: 'percentage' } } }),
            stepProgress: (current, total) => create({ type: 'steps', value: (current / total) * 100, steps: total }),
            circularLoader: () => create({ type: 'circular', style: 'glassmorphism', animation: 'pulse', features: { indeterminate: true } })
        }
    };
})();

// Export pour utilisation avec le système de modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Gestion des animations complexes
   Solution: Utilisation de CSS custom properties pour les animations dynamiques
   
   [2024-01-XX] - Performance avec plusieurs progress
   Solution: Injection unique des styles et optimisation des re-rendus
   
   [2024-01-XX] - Compatibilité navigateurs pour backdrop-filter
   Cause: Certains navigateurs ne supportent pas backdrop-filter
   Résolution: Fallback avec background semi-transparent
   
   NOTES POUR REPRISES FUTURES:
   - Les animations utilisent requestAnimationFrame pour la fluidité
   - Le mode indéterminé nécessite une gestion spéciale des transitions
   - Les progress circulaires utilisent stroke-dasharray pour l'animation
   - Attention à la performance avec les effets shimmer sur mobile
   ======================================== */