/* ========================================
   DIVIDER.COMPONENT.JS - Système de séparateurs glassmorphism
   Chemin: src/js/shared/ui/elements/divider.component.js
   
   DESCRIPTION:
   Composant divider complet pour séparer visuellement le contenu.
   Supporte tous les styles, orientations, contenus et animations.
   Permet de créer des séparations élégantes avec effets visuels.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Méthodes de création (lignes 202-400)
   3. Générateurs de styles (lignes 402-600)
   4. Animations et effets (lignes 602-700)
   5. Méthodes utilitaires (lignes 702-800)
   6. API publique (lignes 802-900)
   
   DÉPENDANCES:
   - divider.css (tous les styles)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const Divider = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.1,
                gradient: true,
                shine: true,
                animated: true
            },
            'solid': {
                class: 'solid',
                thickness: 1,
                color: 'currentColor'
            },
            'dashed': {
                class: 'dashed',
                pattern: '8 4',
                thickness: 1
            },
            'dotted': {
                class: 'dotted',
                pattern: '2 4',
                thickness: 2
            },
            'double': {
                class: 'double',
                spacing: 3,
                thickness: 1
            },
            'gradient': {
                class: 'gradient',
                from: 'transparent',
                via: 'currentColor',
                to: 'transparent'
            },
            'wave': {
                class: 'wave',
                amplitude: 10,
                frequency: 20
            },
            'zigzag': {
                class: 'zigzag',
                size: 8,
                angle: 45
            },
            'fade': {
                class: 'fade',
                startOpacity: 0,
                endOpacity: 0
            },
            'glow': {
                class: 'glow',
                color: 'currentColor',
                blur: 10,
                intensity: 0.5
            },
            'rainbow': {
                class: 'rainbow',
                animated: true,
                speed: 3
            },
            'minimal': {
                class: 'minimal',
                opacity: 0.2
            },
            'ornamental': {
                class: 'ornamental',
                pattern: 'floral'
            },
            'neon': {
                class: 'neon',
                color: '#00ff00',
                glow: true
            },
            'ascii': {
                class: 'ascii',
                character: '─',
                spacing: 0
            },
            'custom': {
                class: 'custom',
                svg: true
            }
        },

        // Orientations
        orientations: {
            'horizontal': { class: 'horizontal', dimension: 'width' },
            'vertical': { class: 'vertical', dimension: 'height' }
        },

        // Alignements (pour le contenu)
        alignments: {
            'start': { class: 'align-start' },
            'center': { class: 'align-center' },
            'end': { class: 'align-end' }
        },

        // Tailles
        sizes: {
            'thin': { thickness: 1, spacing: 16 },
            'medium': { thickness: 2, spacing: 24 },
            'thick': { thickness: 4, spacing: 32 },
            'bold': { thickness: 8, spacing: 40 },
            'custom': { thickness: null, spacing: null }
        },

        // Espacements
        spacing: {
            'none': 0,
            'small': 16,
            'medium': 24,
            'large': 32,
            'xlarge': 48
        },

        // Contenus possibles
        content: {
            'text': {
                type: 'text',
                padding: '0 16px',
                background: true
            },
            'icon': {
                type: 'icon',
                size: 24,
                padding: '0 12px',
                background: true
            },
            'badge': {
                type: 'badge',
                padding: '4px 12px',
                rounded: true
            },
            'chip': {
                type: 'chip',
                interactive: true
            },
            'button': {
                type: 'button',
                size: 'small'
            },
            'custom': {
                type: 'custom'
            }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'pulse': {
                keyframes: 'dividerPulse',
                duration: 2000,
                easing: 'ease-in-out',
                iteration: 'infinite'
            },
            'slide': {
                keyframes: 'dividerSlide',
                duration: 3000,
                easing: 'linear',
                iteration: 'infinite'
            },
            'glow-pulse': {
                keyframes: 'dividerGlowPulse',
                duration: 2500,
                easing: 'ease-in-out',
                iteration: 'infinite'
            },
            'wave-motion': {
                keyframes: 'dividerWaveMotion',
                duration: 4000,
                easing: 'ease-in-out',
                iteration: 'infinite'
            },
            'rainbow-shift': {
                keyframes: 'dividerRainbowShift',
                duration: 5000,
                easing: 'linear',
                iteration: 'infinite'
            },
            'dash-march': {
                keyframes: 'dividerDashMarch',
                duration: 1000,
                easing: 'linear',
                iteration: 'infinite'
            }
        },

        // Options par défaut
        defaults: {
            style: 'glassmorphism',
            orientation: 'horizontal',
            alignment: 'center',
            size: 'medium',
            spacing: 'medium',
            animation: 'none',
            responsive: true,
            fullWidth: true,
            content: null,
            contentPosition: 'center',
            role: 'separator',
            ariaLabel: null
        }
    };

    // État global
    let stylesInjected = false;
    let instanceId = 0;

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
        link.href = '/src/css/shared/ui/divider.css';
        document.head.appendChild(link);

        stylesInjected = true;
    }

    /**
     * Génération d'ID unique
     */
    function generateId() {
        return `divider-${Date.now()}-${++instanceId}`;
    }

    /**
     * Création de l'élément divider
     */
    function createDividerElement(options) {
        const {
            style,
            orientation,
            alignment,
            size,
            spacing,
            animation,
            content,
            contentPosition,
            className,
            role,
            ariaLabel,
            fullWidth
        } = options;

        // Conteneur principal
        const container = document.createElement('div');
        container.className = 'divider-container';
        container.id = generateId();

        // Classes
        container.classList.add(
            `divider-${orientation}`,
            `divider-${size}`,
            `divider-spacing-${spacing}`
        );

        if (fullWidth) container.classList.add('divider-full-width');
        if (className) container.classList.add(...className.split(' '));

        // Accessibilité
        container.setAttribute('role', role);
        if (ariaLabel) container.setAttribute('aria-label', ariaLabel);

        // Structure selon le contenu
        if (content) {
            // Divider avec contenu
            container.classList.add('divider-with-content', `content-${contentPosition}`);
            
            // Ligne avant
            const lineBefore = createLineElement(style, animation, 'before');
            container.appendChild(lineBefore);

            // Contenu
            const contentEl = createContentElement(content, options);
            container.appendChild(contentEl);

            // Ligne après
            const lineAfter = createLineElement(style, animation, 'after');
            container.appendChild(lineAfter);
        } else {
            // Divider simple
            const line = createLineElement(style, animation);
            container.appendChild(line);
        }

        return container;
    }

    /**
     * Création de l'élément ligne
     */
    function createLineElement(style, animation, position = '') {
        const line = document.createElement('div');
        line.className = `divider-line ${CONFIG.styles[style].class}`;
        
        if (position) line.classList.add(`line-${position}`);
        if (animation !== 'none') {
            line.classList.add('animated', `animation-${animation}`);
        }

        // Éléments spéciaux selon le style
        const styleConfig = CONFIG.styles[style];

        // Glassmorphism - ajouter les effets
        if (style === 'glassmorphism') {
            // Effet de brillance
            const shine = document.createElement('div');
            shine.className = 'divider-shine';
            line.appendChild(shine);

            // Particules optionnelles
            if (styleConfig.animated) {
                for (let i = 0; i < 3; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'divider-particle';
                    particle.style.animationDelay = `${i * 0.3}s`;
                    line.appendChild(particle);
                }
            }
        }

        // Wave - créer le pattern SVG
        if (style === 'wave') {
            const svg = createWavePattern(styleConfig);
            line.appendChild(svg);
        }

        // Zigzag - créer le pattern SVG
        if (style === 'zigzag') {
            const svg = createZigzagPattern(styleConfig);
            line.appendChild(svg);
        }

        // Ornamental - ajouter les décorations
        if (style === 'ornamental') {
            const ornament = createOrnament(styleConfig.pattern);
            line.appendChild(ornament);
        }

        // ASCII - répéter le caractère
        if (style === 'ascii') {
            line.setAttribute('data-char', styleConfig.character);
        }

        return line;
    }

    /**
     * Création de l'élément contenu
     */
    function createContentElement(content, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'divider-content';

        if (typeof content === 'string') {
            // Texte simple
            const span = document.createElement('span');
            span.className = 'divider-text';
            span.textContent = content;
            wrapper.appendChild(span);
        } else if (content.type === 'icon') {
            // Icône
            const icon = document.createElement('i');
            icon.className = `divider-icon ${content.class || ''}`;
            if (content.svg) {
                icon.innerHTML = content.svg;
            }
            wrapper.appendChild(icon);
        } else if (content.type === 'badge') {
            // Badge
            const badge = document.createElement('span');
            badge.className = 'divider-badge';
            badge.textContent = content.text;
            if (content.color) badge.style.backgroundColor = content.color;
            wrapper.appendChild(badge);
        } else if (content.type === 'chip') {
            // Chip
            const chip = document.createElement('button');
            chip.className = 'divider-chip';
            chip.textContent = content.text;
            if (content.onClick) chip.addEventListener('click', content.onClick);
            wrapper.appendChild(chip);
        } else if (content.type === 'button') {
            // Bouton
            const button = document.createElement('button');
            button.className = 'divider-button';
            button.textContent = content.text;
            if (content.onClick) button.addEventListener('click', content.onClick);
            wrapper.appendChild(button);
        } else if (content.type === 'custom' && content.element) {
            // Élément personnalisé
            wrapper.appendChild(content.element);
        }

        // Style glassmorphism pour le contenu
        if (options.style === 'glassmorphism') {
            wrapper.classList.add('glassmorphism');
        }

        return wrapper;
    }

    /**
     * Création du pattern wave SVG
     */
    function createWavePattern(config) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'divider-pattern');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', `0 0 100 ${config.amplitude * 2}`);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = generateWavePath(100, config.amplitude, config.frequency);
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');

        svg.appendChild(path);
        return svg;
    }

    /**
     * Génération du chemin wave
     */
    function generateWavePath(width, amplitude, frequency) {
        let path = `M 0 ${amplitude}`;
        const step = width / frequency;
        
        for (let i = 0; i <= frequency; i++) {
            const x = i * step;
            const y = amplitude + amplitude * Math.sin((i / frequency) * Math.PI * 2);
            path += ` L ${x} ${y}`;
        }
        
        return path;
    }

    /**
     * Création du pattern zigzag SVG
     */
    function createZigzagPattern(config) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'divider-pattern');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('viewBox', `0 0 ${config.size * 2} ${config.size}`);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M 0 ${config.size} L ${config.size} 0 L ${config.size * 2} ${config.size}`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linejoin', 'miter');

        svg.appendChild(path);
        return svg;
    }

    /**
     * Création d'ornements
     */
    function createOrnament(pattern) {
        const ornament = document.createElement('div');
        ornament.className = `divider-ornament pattern-${pattern}`;

        // Patterns prédéfinis
        const patterns = {
            'floral': '❦',
            'star': '✦',
            'diamond': '◆',
            'heart': '♥',
            'arrow': '➤',
            'circle': '●',
            'square': '■',
            'triangle': '▲'
        };

        ornament.textContent = patterns[pattern] || patterns.floral;
        return ornament;
    }

    /**
     * Application des animations personnalisées
     */
    function applyCustomAnimation(element, animation) {
        const animConfig = CONFIG.animations[animation];
        if (!animConfig || animConfig.enabled === false) return;

        element.style.animation = `${animConfig.keyframes} ${animConfig.duration}ms ${animConfig.easing} ${animConfig.iteration}`;
    }

    /**
     * Mise à jour dynamique
     */
    function updateDivider(element, updates) {
        // Mise à jour du style
        if (updates.style) {
            const line = element.querySelector('.divider-line');
            if (line) {
                line.className = `divider-line ${CONFIG.styles[updates.style].class}`;
                if (updates.animation && updates.animation !== 'none') {
                    line.classList.add('animated', `animation-${updates.animation}`);
                }
            }
        }

        // Mise à jour du contenu
        if (updates.content !== undefined) {
            const contentEl = element.querySelector('.divider-content');
            if (contentEl && typeof updates.content === 'string') {
                const textEl = contentEl.querySelector('.divider-text');
                if (textEl) textEl.textContent = updates.content;
            }
        }

        // Mise à jour de la taille
        if (updates.size) {
            element.classList.remove('divider-thin', 'divider-medium', 'divider-thick', 'divider-bold');
            element.classList.add(`divider-${updates.size}`);
        }

        // Mise à jour de l'espacement
        if (updates.spacing) {
            element.classList.remove('divider-spacing-none', 'divider-spacing-small', 
                                   'divider-spacing-medium', 'divider-spacing-large', 
                                   'divider-spacing-xlarge');
            element.classList.add(`divider-spacing-${updates.spacing}`);
        }
    }

    /**
     * Responsive handler
     */
    function handleResponsive(element, options) {
        if (!options.responsive) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                
                // Ajuster automatiquement pour les petits écrans
                if (width < 480) {
                    element.classList.add('divider-responsive-mobile');
                } else {
                    element.classList.remove('divider-responsive-mobile');
                }
            }
        });

        resizeObserver.observe(element.parentElement || document.body);
        
        // Stocker l'observer pour le cleanup
        element._resizeObserver = resizeObserver;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Créer un divider
         */
        create(options = {}) {
            // Injection des styles
            injectStyles();

            // Fusion des options
            const mergedOptions = { ...CONFIG.defaults, ...options };

            // Création de l'élément
            const divider = createDividerElement(mergedOptions);

            // Gestion responsive
            if (mergedOptions.responsive) {
                requestAnimationFrame(() => handleResponsive(divider, mergedOptions));
            }

            // API de l'instance
            divider.update = (updates) => updateDivider(divider, updates);
            divider.destroy = () => {
                if (divider._resizeObserver) {
                    divider._resizeObserver.disconnect();
                }
                divider.remove();
            };

            return divider;
        },

        /**
         * Créer un divider avec titre
         */
        createWithTitle(title, options = {}) {
            return this.create({
                ...options,
                content: title
            });
        },

        /**
         * Créer un divider avec icône
         */
        createWithIcon(iconConfig, options = {}) {
            return this.create({
                ...options,
                content: {
                    type: 'icon',
                    ...iconConfig
                }
            });
        },

        /**
         * Créer un divider vertical
         */
        createVertical(options = {}) {
            return this.create({
                ...options,
                orientation: 'vertical'
            });
        },

        /**
         * Créer un groupe de dividers
         */
        createGroup(count = 3, options = {}) {
            const group = document.createElement('div');
            group.className = 'divider-group';
            
            for (let i = 0; i < count; i++) {
                const divider = this.create({
                    ...options,
                    spacing: i === count - 1 ? 'none' : options.spacing
                });
                group.appendChild(divider);
            }
            
            return group;
        },

        /**
         * Créer un divider animé
         */
        createAnimated(animation = 'pulse', options = {}) {
            return this.create({
                ...options,
                animation
            });
        },

        /**
         * Préréglages de styles
         */
        presets: {
            section: () => this.create({ style: 'glassmorphism', spacing: 'large' }),
            card: () => this.create({ style: 'minimal', size: 'thin', spacing: 'medium' }),
            menu: () => this.create({ style: 'solid', size: 'thin', spacing: 'small' }),
            footer: () => this.create({ style: 'gradient', spacing: 'xlarge' }),
            hero: () => this.create({ style: 'wave', animation: 'wave-motion', spacing: 'xlarge' }),
            sidebar: () => this.createVertical({ style: 'fade', fullWidth: false })
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
export default Divider;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Alignement vertical
   Solution: Flexbox avec height 100% pour vertical
   
   [2024-01] - Performance animations
   Cause: Trop d'éléments animés
   Résolution: Utilisation de transform et GPU
   
   [2024-01] - Responsive design
   Solution: ResizeObserver pour adaptation dynamique
   
   NOTES POUR REPRISES FUTURES:
   - Les patterns SVG doivent être optimisés
   - Les animations peuvent impacter les performances
   - Le mode vertical nécessite un conteneur avec hauteur
   - Attention aux conflits avec flexbox/grid parents
   ======================================== */