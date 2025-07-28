/* ========================================
   SKELETON.COMPONENT.JS - Composant de chargement skeleton
   Chemin: src/js/shared/ui/elements/skeleton.component.js
   
   DESCRIPTION:
   Composant pour afficher des squelettes de chargement avec effet glassmorphism.
   Supporte plusieurs types (texte, avatar, image, carte, tableau, etc.),
   animations variées et personnalisation complète.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-150)
   2. Méthodes de création des éléments (lignes 152-400)
   3. Méthodes de création par type (lignes 402-800)
   4. Utilitaires et helpers (lignes 802-900)
   5. API publique (lignes 902-950)
   
   DÉPENDANCES:
   - skeleton.css (styles glassmorphism et animations)
   - ui.config.js (configuration globale)
   ======================================== */

const SkeletonComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Types de skeleton disponibles
        types: {
            'text': {
                defaultLines: 3,
                lineHeight: 16,
                gap: 8,
                lastLineWidth: '70%'
            },
            'paragraph': {
                defaultLines: 5,
                lineHeight: 20,
                gap: 12,
                lastLineWidth: '60%'
            },
            'heading': {
                height: 32,
                width: '60%',
                rounded: true
            },
            'avatar': {
                size: 48,
                shape: 'circle' // circle, square, rounded
            },
            'image': {
                width: '100%',
                aspectRatio: '16/9',
                rounded: true
            },
            'thumbnail': {
                size: 80,
                rounded: true
            },
            'button': {
                height: 40,
                width: 120,
                rounded: true
            },
            'input': {
                height: 48,
                width: '100%',
                rounded: true
            },
            'card': {
                padding: 20,
                elements: ['avatar', 'title', 'text', 'actions']
            },
            'list-item': {
                padding: 16,
                elements: ['thumbnail', 'content', 'action']
            },
            'table-row': {
                columns: 4,
                height: 56,
                gap: 16
            },
            'chart': {
                height: 300,
                bars: 6,
                showAxis: true
            },
            'media': {
                imageHeight: 200,
                contentGap: 16
            },
            'profile': {
                avatarSize: 120,
                centered: true
            },
            'form': {
                fields: 3,
                fieldGap: 24,
                labelWidth: '30%'
            },
            'navigation': {
                items: 5,
                height: 48,
                gap: 8
            },
            'badge': {
                width: 80,
                height: 24,
                rounded: 'full'
            },
            'custom': {
                // Configuration personnalisée
            }
        },

        // Styles disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                shimmer: true
            },
            'neumorphism': {
                background: '#e0e5ec',
                boxShadow: 'inset 2px 2px 5px #a3b1c6, inset -3px -3px 7px #ffffff',
                shimmer: false
            },
            'flat': {
                background: '#f3f4f6',
                border: 'none',
                shimmer: true
            },
            'minimal': {
                background: 'currentColor',
                opacity: 0.1,
                shimmer: false
            }
        },

        // Animations disponibles
        animations: {
            'none': { enabled: false },
            'pulse': {
                keyframes: 'skeletonPulse',
                duration: '1.5s',
                timing: 'ease-in-out',
                iteration: 'infinite'
            },
            'wave': {
                keyframes: 'skeletonWave',
                duration: '1.8s',
                timing: 'linear',
                iteration: 'infinite'
            },
            'shimmer': {
                keyframes: 'skeletonShimmer',
                duration: '2s',
                timing: 'linear',
                iteration: 'infinite'
            },
            'glow': {
                keyframes: 'skeletonGlow',
                duration: '2s',
                timing: 'ease-in-out',
                iteration: 'infinite'
            }
        },

        // Tailles prédéfinies
        sizes: {
            'xs': 0.75,
            'sm': 0.875,
            'md': 1,
            'lg': 1.125,
            'xl': 1.25
        },

        // Classes CSS
        classes: {
            container: 'skeleton-container',
            element: 'skeleton',
            shimmer: 'skeleton-shimmer',
            animated: 'skeleton-animated'
        }
    };

    // ========================================
    // MÉTHODES DE CRÉATION DES ÉLÉMENTS
    // ========================================
    
    // Créer l'élément de base skeleton
    function createSkeletonElement(options = {}) {
        const {
            tag = 'div',
            className = '',
            width = '100%',
            height = 20,
            rounded = false,
            style = 'glassmorphism',
            animation = 'shimmer'
        } = options;

        const element = document.createElement(tag);
        element.className = `${CONFIG.classes.element} ${className}`;
        
        // Appliquer le style
        if (CONFIG.styles[style]) {
            element.classList.add(`skeleton-${style}`);
        }

        // Appliquer l'animation
        if (animation !== 'none' && CONFIG.animations[animation]) {
            element.classList.add(CONFIG.classes.animated);
            element.classList.add(`skeleton-animate-${animation}`);
        }

        // Dimensions
        if (typeof width === 'number') {
            element.style.width = `${width}px`;
        } else {
            element.style.width = width;
        }

        if (typeof height === 'number') {
            element.style.height = `${height}px`;
        } else {
            element.style.height = height;
        }

        // Bordures arrondies
        if (rounded === true) {
            element.classList.add('skeleton-rounded');
        } else if (rounded === 'full') {
            element.classList.add('skeleton-rounded-full');
        } else if (typeof rounded === 'number') {
            element.style.borderRadius = `${rounded}px`;
        }

        return element;
    }

    // Créer un conteneur de skeleton
    function createContainer(options = {}) {
        const {
            className = '',
            gap = 16,
            direction = 'column',
            align = 'stretch'
        } = options;

        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${className}`;
        
        container.style.display = 'flex';
        container.style.flexDirection = direction;
        container.style.gap = `${gap}px`;
        container.style.alignItems = align;

        return container;
    }

    // ========================================
    // MÉTHODES DE CRÉATION PAR TYPE
    // ========================================

    // Skeleton de texte
    function createTextSkeleton(options = {}) {
        const config = { ...CONFIG.types.text, ...options };
        const container = createContainer({ gap: config.gap });

        for (let i = 0; i < config.defaultLines; i++) {
            const isLastLine = i === config.defaultLines - 1;
            const line = createSkeletonElement({
                ...options,
                width: isLastLine ? config.lastLineWidth : '100%',
                height: config.lineHeight,
                rounded: true
            });
            container.appendChild(line);
        }

        return container;
    }

    // Skeleton d'avatar
    function createAvatarSkeleton(options = {}) {
        const config = { ...CONFIG.types.avatar, ...options };
        const avatar = createSkeletonElement({
            ...options,
            width: config.size,
            height: config.size,
            rounded: config.shape === 'circle' ? 'full' : config.shape === 'rounded'
        });

        if (config.withName) {
            const container = createContainer({ 
                direction: 'row', 
                gap: 12,
                align: 'center' 
            });
            container.appendChild(avatar);
            
            const nameContainer = createContainer({ gap: 6 });
            nameContainer.appendChild(createSkeletonElement({
                ...options,
                width: 120,
                height: 16,
                rounded: true
            }));
            nameContainer.appendChild(createSkeletonElement({
                ...options,
                width: 80,
                height: 12,
                rounded: true
            }));
            
            container.appendChild(nameContainer);
            return container;
        }

        return avatar;
    }

    // Skeleton de carte
    function createCardSkeleton(options = {}) {
        const config = { ...CONFIG.types.card, ...options };
        const card = createContainer({ 
            className: 'skeleton-card',
            gap: 16 
        });
        
        card.style.padding = `${config.padding}px`;
        card.classList.add(`skeleton-${options.style || 'glassmorphism'}`);

        // Header avec avatar
        if (config.elements.includes('avatar')) {
            const header = createContainer({ 
                direction: 'row', 
                gap: 12,
                align: 'flex-start' 
            });
            
            header.appendChild(createAvatarSkeleton({ 
                ...options,
                size: 48 
            }));
            
            const headerContent = createContainer({ gap: 8 });
            headerContent.style.flex = '1';
            headerContent.appendChild(createSkeletonElement({
                ...options,
                width: '60%',
                height: 18,
                rounded: true
            }));
            headerContent.appendChild(createSkeletonElement({
                ...options,
                width: '40%',
                height: 14,
                rounded: true
            }));
            
            header.appendChild(headerContent);
            card.appendChild(header);
        }

        // Image
        if (config.elements.includes('image')) {
            card.appendChild(createSkeletonElement({
                ...options,
                width: '100%',
                height: 200,
                rounded: true
            }));
        }

        // Titre
        if (config.elements.includes('title')) {
            card.appendChild(createSkeletonElement({
                ...options,
                width: '70%',
                height: 24,
                rounded: true
            }));
        }

        // Texte
        if (config.elements.includes('text')) {
            card.appendChild(createTextSkeleton({
                ...options,
                defaultLines: 3
            }));
        }

        // Actions
        if (config.elements.includes('actions')) {
            const actions = createContainer({ 
                direction: 'row', 
                gap: 8,
                align: 'center' 
            });
            
            for (let i = 0; i < 3; i++) {
                actions.appendChild(createSkeletonElement({
                    ...options,
                    width: 32,
                    height: 32,
                    rounded: 'full'
                }));
            }
            
            card.appendChild(actions);
        }

        return card;
    }

    // Skeleton de ligne de tableau
    function createTableRowSkeleton(options = {}) {
        const config = { ...CONFIG.types['table-row'], ...options };
        const row = createContainer({ 
            direction: 'row', 
            gap: config.gap,
            align: 'center'
        });
        
        row.style.height = `${config.height}px`;
        row.style.padding = '0 16px';

        for (let i = 0; i < config.columns; i++) {
            const cell = createSkeletonElement({
                ...options,
                width: i === 0 ? '150px' : '100%',
                height: 16,
                rounded: true
            });
            row.appendChild(cell);
        }

        return row;
    }

    // Skeleton de graphique
    function createChartSkeleton(options = {}) {
        const config = { ...CONFIG.types.chart, ...options };
        const chart = createContainer({ 
            className: 'skeleton-chart',
            gap: 0 
        });
        
        chart.style.height = `${config.height}px`;
        chart.style.position = 'relative';

        // Axes
        if (config.showAxis) {
            // Axe Y
            const yAxis = createSkeletonElement({
                ...options,
                width: 1,
                height: '100%',
                className: 'skeleton-chart-axis-y'
            });
            yAxis.style.position = 'absolute';
            yAxis.style.left = '40px';
            yAxis.style.top = '0';
            chart.appendChild(yAxis);

            // Axe X
            const xAxis = createSkeletonElement({
                ...options,
                width: 'calc(100% - 40px)',
                height: 1,
                className: 'skeleton-chart-axis-x'
            });
            xAxis.style.position = 'absolute';
            xAxis.style.bottom = '40px';
            xAxis.style.left = '40px';
            chart.appendChild(xAxis);
        }

        // Barres
        const barsContainer = createContainer({ 
            direction: 'row', 
            gap: 8,
            align: 'flex-end'
        });
        barsContainer.style.height = '100%';
        barsContainer.style.padding = '0 50px 50px 50px';

        for (let i = 0; i < config.bars; i++) {
            const height = Math.random() * 60 + 20; // 20% à 80%
            const bar = createSkeletonElement({
                ...options,
                width: '100%',
                height: `${height}%`,
                rounded: true
            });
            barsContainer.appendChild(bar);
        }

        chart.appendChild(barsContainer);
        return chart;
    }

    // Skeleton de liste
    function createListSkeleton(options = {}) {
        const { items = 5, ...rest } = options;
        const list = createContainer({ gap: 8 });

        for (let i = 0; i < items; i++) {
            const listItem = createContainer({ 
                direction: 'row', 
                gap: 12,
                align: 'center',
                className: 'skeleton-list-item'
            });
            
            listItem.style.padding = '16px';
            listItem.classList.add(`skeleton-${rest.style || 'glassmorphism'}`);

            // Thumbnail
            listItem.appendChild(createSkeletonElement({
                ...rest,
                width: 48,
                height: 48,
                rounded: true
            }));

            // Content
            const content = createContainer({ gap: 6 });
            content.style.flex = '1';
            content.appendChild(createSkeletonElement({
                ...rest,
                width: '70%',
                height: 16,
                rounded: true
            }));
            content.appendChild(createSkeletonElement({
                ...rest,
                width: '50%',
                height: 12,
                rounded: true
            }));
            listItem.appendChild(content);

            // Action
            listItem.appendChild(createSkeletonElement({
                ...rest,
                width: 24,
                height: 24,
                rounded: 'full'
            }));

            list.appendChild(listItem);
        }

        return list;
    }

    // Skeleton de formulaire
    function createFormSkeleton(options = {}) {
        const config = { ...CONFIG.types.form, ...options };
        const form = createContainer({ gap: config.fieldGap });

        for (let i = 0; i < config.fields; i++) {
            const field = createContainer({ gap: 8 });
            
            // Label
            field.appendChild(createSkeletonElement({
                ...options,
                width: config.labelWidth,
                height: 14,
                rounded: true
            }));
            
            // Input
            field.appendChild(createSkeletonElement({
                ...options,
                width: '100%',
                height: 48,
                rounded: true
            }));
            
            form.appendChild(field);
        }

        // Submit button
        const buttonContainer = createContainer({ 
            direction: 'row',
            align: 'center'
        });
        buttonContainer.style.marginTop = '8px';
        buttonContainer.appendChild(createSkeletonElement({
            ...options,
            width: 120,
            height: 44,
            rounded: true
        }));
        
        form.appendChild(buttonContainer);
        return form;
    }

    // ========================================
    // UTILITAIRES ET HELPERS
    // ========================================

    // Créer plusieurs skeletons
    function createMultiple(type, count, options = {}) {
        const container = createContainer({ 
            gap: options.gap || 16 
        });

        for (let i = 0; i < count; i++) {
            const skeleton = create(type, options);
            container.appendChild(skeleton);
        }

        return container;
    }

    // Remplacer un élément par un skeleton
    function replace(element, type = 'text', options = {}) {
        const skeleton = create(type, {
            ...options,
            width: options.width || element.offsetWidth,
            height: options.height || element.offsetHeight
        });

        // Sauvegarder l'élément original
        skeleton.dataset.originalDisplay = element.style.display;
        element.style.display = 'none';
        element.parentNode.insertBefore(skeleton, element);

        return skeleton;
    }

    // Restaurer l'élément original
    function restore(skeleton) {
        const nextElement = skeleton.nextElementSibling;
        if (nextElement && skeleton.dataset.originalDisplay !== undefined) {
            nextElement.style.display = skeleton.dataset.originalDisplay;
            skeleton.remove();
        }
    }

    // Injecter les styles
    function injectStyles() {
        if (document.getElementById('skeleton-styles')) return;

        const link = document.createElement('link');
        link.id = 'skeleton-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/skeleton.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    // Méthode principale de création
    function create(type, options = {}) {
        // Auto-injection des styles au premier appel
        if (!document.getElementById('skeleton-styles')) {
            injectStyles();
        }

        // Appliquer la taille globale si spécifiée
        if (options.size && CONFIG.sizes[options.size]) {
            const scale = CONFIG.sizes[options.size];
            // Appliquer le scale aux dimensions numériques
            ['width', 'height', 'gap', 'padding'].forEach(prop => {
                if (typeof options[prop] === 'number') {
                    options[prop] = options[prop] * scale;
                }
            });
        }

        // Créer selon le type
        switch (type) {
            case 'text':
                return createTextSkeleton(options);
            case 'paragraph':
                return createTextSkeleton({ 
                    ...CONFIG.types.paragraph, 
                    ...options 
                });
            case 'heading':
                return createSkeletonElement({ 
                    ...CONFIG.types.heading, 
                    ...options 
                });
            case 'avatar':
                return createAvatarSkeleton(options);
            case 'image':
                return createSkeletonElement({ 
                    ...CONFIG.types.image, 
                    ...options 
                });
            case 'card':
                return createCardSkeleton(options);
            case 'table-row':
                return createTableRowSkeleton(options);
            case 'chart':
                return createChartSkeleton(options);
            case 'list':
                return createListSkeleton(options);
            case 'form':
                return createFormSkeleton(options);
            case 'button':
                return createSkeletonElement({ 
                    ...CONFIG.types.button, 
                    ...options 
                });
            case 'badge':
                return createSkeletonElement({ 
                    ...CONFIG.types.badge, 
                    ...options 
                });
            case 'custom':
                return createSkeletonElement(options);
            default:
                console.warn(`Type de skeleton inconnu: ${type}`);
                return createSkeletonElement(options);
        }
    }

    // Export de l'API publique
    return {
        create,
        createMultiple,
        replace,
        restore,
        injectStyles,
        CONFIG,
        // Méthodes spécifiques exposées
        createContainer,
        createSkeletonElement
    };
})();

// Export pour utilisation
export default SkeletonComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Animation shimmer sur glassmorphism
   Solution: Utiliser un pseudo-element avec gradient animé
   
   [2024-01-15] - Performance avec beaucoup de skeletons
   Cause: Trop d'animations individuelles
   Résolution: Utiliser une seule animation sur le conteneur
   
   NOTES POUR REPRISES FUTURES:
   - Les animations peuvent être désactivées globalement
   - Le style glassmorphism nécessite backdrop-filter
   - Prévoir un fallback pour les navigateurs non compatibles
   ======================================== */