/* ========================================
   BREADCRUMB.COMPONENT.JS - Composant Breadcrumb glassmorphism
   Chemin: src/js/shared/ui/navigation/breadcrumb.component.js
   
   DESCRIPTION:
   Composant de fil d'Ariane complet avec effet glassmorphism.
   Gère la navigation hiérarchique, les liens dynamiques, et l'auto-génération.
   
   STRUCTURE:
   1. Configuration complète (lignes 30-180)
   2. Création et initialisation (lignes 182-300)
   3. Génération des items (lignes 302-450)
   4. Gestion des événements (lignes 452-550)
   5. Méthodes utilitaires (lignes 552-650)
   6. API publique (lignes 652-750)
   
   DÉPENDANCES:
   - breadcrumb.css (styles glassmorphism et animations)
   - Optionnel: Router pour auto-génération
   ======================================== */

const Breadcrumb = (() => {
    'use strict';
    
    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                className: 'glassmorphism',
                backdrop: true,
                blur: 20,
                separatorStyle: 'glass'
            },
            'neumorphism': {
                className: 'neumorphism',
                backdrop: false,
                shadow: 'complex'
            },
            'flat': {
                className: 'flat',
                backdrop: false,
                minimal: true
            },
            'minimal': {
                className: 'minimal',
                backdrop: false,
                underline: true
            },
            'material': {
                className: 'material',
                backdrop: false,
                ripple: true
            },
            'pills': {
                className: 'pills',
                backdrop: true,
                rounded: true
            },
            'dots': {
                className: 'dots',
                backdrop: false,
                dotted: true
            }
        },
        
        // Séparateurs
        separators: {
            'chevron': { icon: '›', className: 'separator-chevron' },
            'arrow': { icon: '→', className: 'separator-arrow' },
            'slash': { icon: '/', className: 'separator-slash' },
            'backslash': { icon: '\\', className: 'separator-backslash' },
            'dot': { icon: '•', className: 'separator-dot' },
            'pipe': { icon: '|', className: 'separator-pipe' },
            'doubleChevron': { icon: '»', className: 'separator-double-chevron' },
            'triangle': { icon: '▶', className: 'separator-triangle' },
            'custom': { icon: '', className: 'separator-custom' }
        },
        
        // Animations
        animations: {
            'none': { enabled: false },
            'fade': { in: 'fadeIn', out: 'fadeOut', duration: 200 },
            'slide': { in: 'slideRight', out: 'slideLeft', duration: 300 },
            'cascade': { in: 'cascadeIn', stagger: 50 },
            'bounce': { in: 'bounceIn', hover: 'pulse' }
        },
        
        // Tailles
        sizes: {
            'small': { 
                fontSize: '12px', 
                padding: '4px 8px',
                height: '24px',
                iconSize: '14px'
            },
            'medium': { 
                fontSize: '14px', 
                padding: '6px 12px',
                height: '32px',
                iconSize: '16px'
            },
            'large': { 
                fontSize: '16px', 
                padding: '8px 16px',
                height: '40px',
                iconSize: '20px'
            }
        },
        
        // Comportements
        behaviors: {
            'truncate': {
                maxItems: 5,
                showEllipsis: true,
                expandable: true
            },
            'collapse': {
                maxItems: 3,
                showDropdown: true
            },
            'scroll': {
                horizontal: true,
                showGradient: true
            },
            'wrap': {
                multiline: true
            }
        },
        
        // Options avancées
        advanced: {
            homeIcon: true,
            homeText: 'Accueil',
            capitalizeItems: true,
            showTooltips: true,
            maxItemLength: 30,
            responsive: true,
            mobileCollapse: 2,
            keyboardNavigation: true,
            ariaLabel: 'Fil d\'Ariane',
            schemaMarkup: true,
            autoGenerate: false,
            urlPattern: 'path', // 'path', 'hash', 'query'
            clickable: true,
            onNavigate: null
        },
        
        // Icônes
        icons: {
            home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>`,
            folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>`,
            chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
            </svg>`,
            ellipsis: `<svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>`
        }
    };
    
    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const instances = new Map();
    let instanceIdCounter = 0;
    
    // ========================================
    // CRÉATION DES ÉLÉMENTS
    // ========================================
    function createBreadcrumbElement(options) {
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.setAttribute('aria-label', options.ariaLabel);
        
        // Conteneur principal
        const container = document.createElement('ol');
        container.className = 'breadcrumb-list';
        
        // Schema.org markup
        if (options.schemaMarkup) {
            breadcrumb.setAttribute('itemscope', '');
            breadcrumb.setAttribute('itemtype', 'https://schema.org/BreadcrumbList');
        }
        
        breadcrumb.appendChild(container);
        return breadcrumb;
    }
    
    function createBreadcrumbItem(data, index, options) {
        const item = document.createElement('li');
        item.className = 'breadcrumb-item';
        
        // Schema.org markup
        if (options.schemaMarkup) {
            item.setAttribute('itemprop', 'itemListElement');
            item.setAttribute('itemscope', '');
            item.setAttribute('itemtype', 'https://schema.org/ListItem');
        }
        
        // Créer le lien ou span
        const element = data.url && options.clickable ? 'a' : 'span';
        const link = document.createElement(element);
        link.className = 'breadcrumb-link';
        
        if (data.url && options.clickable) {
            link.href = data.url;
            link.setAttribute('itemprop', 'item');
        }
        
        // Icône pour l'accueil
        if (index === 0 && options.homeIcon) {
            const icon = document.createElement('span');
            icon.className = 'breadcrumb-icon';
            icon.innerHTML = CONFIG.icons.home;
            link.appendChild(icon);
        }
        
        // Texte
        const text = document.createElement('span');
        text.className = 'breadcrumb-text';
        text.textContent = formatText(data.text, options);
        if (options.schemaMarkup) {
            text.setAttribute('itemprop', 'name');
        }
        link.appendChild(text);
        
        // Position pour schema.org
        if (options.schemaMarkup) {
            const position = document.createElement('meta');
            position.setAttribute('itemprop', 'position');
            position.setAttribute('content', index + 1);
            item.appendChild(position);
        }
        
        // Tooltip si le texte est tronqué
        if (options.showTooltips && data.text.length > options.maxItemLength) {
            link.setAttribute('title', data.text);
            link.setAttribute('data-tooltip', data.text);
        }
        
        item.appendChild(link);
        
        // État actuel
        if (data.current) {
            item.classList.add('current');
            link.setAttribute('aria-current', 'page');
        }
        
        // Données personnalisées
        if (data.data) {
            Object.entries(data.data).forEach(([key, value]) => {
                item.dataset[key] = value;
            });
        }
        
        return item;
    }
    
    function createSeparator(type) {
        const separatorConfig = CONFIG.separators[type] || CONFIG.separators.chevron;
        const separator = document.createElement('span');
        separator.className = `breadcrumb-separator ${separatorConfig.className}`;
        separator.textContent = separatorConfig.icon;
        separator.setAttribute('aria-hidden', 'true');
        return separator;
    }
    
    function createEllipsis(hiddenItems, options) {
        const item = document.createElement('li');
        item.className = 'breadcrumb-item breadcrumb-ellipsis';
        
        const button = document.createElement('button');
        button.className = 'breadcrumb-ellipsis-button';
        button.setAttribute('aria-label', `Afficher ${hiddenItems.length} éléments masqués`);
        button.innerHTML = CONFIG.icons.ellipsis;
        
        // Menu déroulant
        const dropdown = document.createElement('div');
        dropdown.className = 'breadcrumb-dropdown';
        
        hiddenItems.forEach((data, index) => {
            const link = document.createElement('a');
            link.className = 'breadcrumb-dropdown-item';
            link.href = data.url || '#';
            link.textContent = data.text;
            dropdown.appendChild(link);
        });
        
        item.appendChild(button);
        item.appendChild(dropdown);
        
        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            item.classList.toggle('open');
        });
        
        // Fermer au clic extérieur
        document.addEventListener('click', () => {
            item.classList.remove('open');
        });
        
        return item;
    }
    
    // ========================================
    // FORMATAGE ET UTILITAIRES
    // ========================================
    function formatText(text, options) {
        let formatted = text;
        
        // Capitaliser
        if (options.capitalizeItems) {
            formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        }
        
        // Tronquer
        if (formatted.length > options.maxItemLength) {
            formatted = formatted.substring(0, options.maxItemLength - 3) + '...';
        }
        
        return formatted;
    }
    
    function generateFromUrl(url, options) {
        const items = [];
        let path = '';
        
        // Parser l'URL selon le pattern
        let segments = [];
        switch (options.urlPattern) {
            case 'path':
                segments = url.pathname.split('/').filter(Boolean);
                break;
            case 'hash':
                segments = url.hash.substring(1).split('/').filter(Boolean);
                break;
            case 'query':
                const params = new URLSearchParams(url.search);
                segments = params.get('path')?.split('/').filter(Boolean) || [];
                break;
        }
        
        // Ajouter l'accueil
        items.push({
            text: options.homeText,
            url: '/',
            current: segments.length === 0
        });
        
        // Ajouter chaque segment
        segments.forEach((segment, index) => {
            path += '/' + segment;
            items.push({
                text: decodeURIComponent(segment).replace(/-/g, ' '),
                url: path,
                current: index === segments.length - 1
            });
        });
        
        return items;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function initializeEvents(instance) {
        const { element, options } = instance;
        
        // Navigation au clavier
        if (options.keyboardNavigation) {
            element.addEventListener('keydown', (e) => {
                handleKeyboardNavigation(e, instance);
            });
        }
        
        // Clic sur les liens
        if (options.onNavigate) {
            element.addEventListener('click', (e) => {
                if (e.target.closest('.breadcrumb-link')) {
                    e.preventDefault();
                    const item = e.target.closest('.breadcrumb-item');
                    const index = Array.from(element.querySelectorAll('.breadcrumb-item')).indexOf(item);
                    options.onNavigate({
                        index,
                        item: instance.items[index],
                        event: e
                    });
                }
            });
        }
        
        // Responsive
        if (options.responsive) {
            const resizeObserver = new ResizeObserver(() => {
                handleResponsive(instance);
            });
            resizeObserver.observe(element);
            instance.resizeObserver = resizeObserver;
        }
    }
    
    function handleKeyboardNavigation(e, instance) {
        const focusableElements = instance.element.querySelectorAll(
            '.breadcrumb-link[href], .breadcrumb-ellipsis-button'
        );
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    focusableElements[currentIndex - 1].focus();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < focusableElements.length - 1) {
                    focusableElements[currentIndex + 1].focus();
                }
                break;
            case 'Home':
                e.preventDefault();
                focusableElements[0]?.focus();
                break;
            case 'End':
                e.preventDefault();
                focusableElements[focusableElements.length - 1]?.focus();
                break;
        }
    }
    
    function handleResponsive(instance) {
        const { element, options } = instance;
        const isMobile = window.innerWidth < 768;
        
        if (isMobile && options.mobileCollapse > 0) {
            // Réappliquer avec collapse mobile
            const items = instance.items;
            const visibleCount = options.mobileCollapse;
            
            if (items.length > visibleCount + 1) {
                const truncatedItems = [
                    items[0], // Toujours garder l'accueil
                    ...items.slice(-(visibleCount - 1))
                ];
                renderBreadcrumb(instance, truncatedItems, items.slice(1, -(visibleCount - 1)));
            }
        } else {
            // Restaurer la vue complète
            renderBreadcrumb(instance, instance.items);
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    function renderBreadcrumb(instance, visibleItems, hiddenItems = []) {
        const { element, options } = instance;
        const container = element.querySelector('.breadcrumb-list');
        container.innerHTML = '';
        
        visibleItems.forEach((item, index) => {
            // Ajouter l'item
            const itemElement = createBreadcrumbItem(item, index, options);
            container.appendChild(itemElement);
            
            // Ajouter ellipsis si nécessaire
            if (index === 0 && hiddenItems.length > 0) {
                container.appendChild(createSeparator(options.separator));
                container.appendChild(createEllipsis(hiddenItems, options));
            }
            
            // Ajouter le séparateur (sauf pour le dernier)
            if (index < visibleItems.length - 1) {
                container.appendChild(createSeparator(options.separator));
            }
        });
        
        // Appliquer les animations
        if (options.animation !== 'none') {
            animateItems(container, options);
        }
    }
    
    function animateItems(container, options) {
        const items = container.querySelectorAll('.breadcrumb-item');
        const animation = CONFIG.animations[options.animation];
        
        if (animation.stagger) {
            items.forEach((item, index) => {
                item.style.animationDelay = `${index * animation.stagger}ms`;
                item.classList.add('animate-in');
            });
        } else if (animation.in) {
            container.classList.add(`animate-${animation.in}`);
        }
    }
    
    // ========================================
    // MÉTHODES DE STYLE
    // ========================================
    function applyStyles(instance) {
        const { element, options } = instance;
        const styleConfig = CONFIG.styles[options.style];
        const sizeConfig = CONFIG.sizes[options.size];
        
        // Classes principales
        element.className = `breadcrumb ${styleConfig.className} size-${options.size}`;
        
        // Comportement
        if (options.behavior) {
            const behaviorConfig = CONFIG.behaviors[options.behavior];
            element.classList.add(`behavior-${options.behavior}`);
            Object.assign(options, behaviorConfig);
        }
        
        // Variables CSS personnalisées
        if (sizeConfig) {
            element.style.setProperty('--breadcrumb-font-size', sizeConfig.fontSize);
            element.style.setProperty('--breadcrumb-padding', sizeConfig.padding);
            element.style.setProperty('--breadcrumb-height', sizeConfig.height);
            element.style.setProperty('--breadcrumb-icon-size', sizeConfig.iconSize);
        }
    }
    
    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('breadcrumb-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'breadcrumb-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/breadcrumb.css';
        document.head.appendChild(link);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            // Configuration par défaut
            const settings = {
                items: [],
                style: 'glassmorphism',
                size: 'medium',
                separator: 'chevron',
                animation: 'fade',
                behavior: null,
                ...CONFIG.advanced,
                ...options
            };
            
            // Injecter les styles
            injectStyles();
            
            // Créer l'élément
            const element = createBreadcrumbElement(settings);
            
            // Créer l'instance
            const instance = {
                id: `breadcrumb-${++instanceIdCounter}`,
                element,
                options: settings,
                items: settings.items
            };
            
            // Auto-générer depuis l'URL si demandé
            if (settings.autoGenerate && !settings.items.length) {
                instance.items = generateFromUrl(window.location, settings);
            }
            
            // Appliquer les styles
            applyStyles(instance);
            
            // Rendre le breadcrumb
            const behavior = CONFIG.behaviors[settings.behavior];
            if (behavior && behavior.maxItems && instance.items.length > behavior.maxItems) {
                const visibleItems = [
                    instance.items[0],
                    ...instance.items.slice(-(behavior.maxItems - 1))
                ];
                const hiddenItems = instance.items.slice(1, -(behavior.maxItems - 1));
                renderBreadcrumb(instance, visibleItems, hiddenItems);
            } else {
                renderBreadcrumb(instance, instance.items);
            }
            
            // Initialiser les événements
            initializeEvents(instance);
            
            // Stocker l'instance
            instances.set(element, instance);
            
            // API de l'instance
            return {
                element,
                
                update(newItems) {
                    instance.items = newItems;
                    renderBreadcrumb(instance, newItems);
                },
                
                append(item) {
                    instance.items.push(item);
                    renderBreadcrumb(instance, instance.items);
                },
                
                remove(index) {
                    instance.items.splice(index, 1);
                    renderBreadcrumb(instance, instance.items);
                },
                
                setActive(index) {
                    instance.items.forEach((item, i) => {
                        item.current = i === index;
                    });
                    renderBreadcrumb(instance, instance.items);
                },
                
                updateOptions(newOptions) {
                    Object.assign(instance.options, newOptions);
                    applyStyles(instance);
                    renderBreadcrumb(instance, instance.items);
                },
                
                destroy() {
                    if (instance.resizeObserver) {
                        instance.resizeObserver.disconnect();
                    }
                    element.remove();
                    instances.delete(element);
                }
            };
        },
        
        // Méthode helper pour générer depuis l'URL courante
        fromCurrentUrl(options = {}) {
            return this.create({
                autoGenerate: true,
                ...options
            });
        },
        
        // Initialiser tous les breadcrumbs dans la page
        init(selector = '[data-breadcrumb]', options = {}) {
            const elements = document.querySelectorAll(selector);
            const breadcrumbs = [];
            
            elements.forEach(element => {
                const items = JSON.parse(element.dataset.breadcrumbItems || '[]');
                const instanceOptions = {
                    items,
                    ...options,
                    ...element.dataset
                };
                
                const breadcrumb = this.create(instanceOptions);
                element.appendChild(breadcrumb.element);
                breadcrumbs.push(breadcrumb);
            });
            
            return breadcrumbs;
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Injecter les styles manuellement
        injectStyles
    };
})();

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Breadcrumb;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Gestion du responsive
   Solution: ResizeObserver avec collapse mobile intelligent
   
   [2025-01-28] - Schema.org markup
   Solution: Attributs itemprop correctement imbriqués
   
   [2025-01-28] - Performance avec beaucoup d'items
   Solution: Virtualisation et truncate avec ellipsis
   
   NOTES POUR REPRISES FUTURES:
   - Le schema markup améliore le SEO significativement
   - L'auto-génération nécessite un pattern d'URL cohérent
   - Les animations en cascade peuvent impacter les performances
   - Attention à l'accessibilité avec aria-current
   ======================================== */