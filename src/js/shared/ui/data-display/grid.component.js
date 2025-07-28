/* ========================================
   GRID.COMPONENT.JS - Grille de données flexible
   Chemin: src/js/shared/ui/data-display/grid.component.js
   
   DESCRIPTION:
   Composant de grille ultra-flexible avec support glassmorphism.
   Gère l'affichage en grille avec filtrage, tri, drag & drop,
   virtualisation, masonry, et animations riches.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-350)
   2. Méthodes privées (lignes 351-1200)
   3. Gestionnaires d'événements (lignes 1201-1400)
   4. API publique (lignes 1401-1500)
   
   DÉPENDANCES:
   - ui.config.js (configuration globale)
   - animation-utils.js (animations)
   - dom-utils.js (manipulation DOM)
   ======================================== */

const GridComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    padding: '24px'
                },
                item: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                    }
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    boxShadow: '20px 20px 60px #bec3c9, -20px -20px 60px #ffffff',
                    padding: '24px'
                },
                item: {
                    background: '#e0e5ec',
                    borderRadius: '16px',
                    boxShadow: '8px 8px 20px #bec3c9, -8px -8px 20px #ffffff',
                    hover: {
                        boxShadow: '4px 4px 10px #bec3c9, -4px -4px 10px #ffffff',
                        transform: 'scale(0.98)'
                    }
                }
            },
            'flat': {
                container: {
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #dee2e6',
                    padding: '20px'
                },
                item: {
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    hover: {
                        background: '#f8f9fa',
                        borderColor: '#adb5bd'
                    }
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05)',
                    padding: '16px'
                },
                item: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    hover: {
                        boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
                        transform: 'translateY(-2px)'
                    }
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    padding: '16px'
                },
                item: {
                    background: '#ffffff',
                    border: '1px solid #f0f0f0',
                    borderRadius: '4px',
                    hover: {
                        borderColor: '#000000',
                        transform: 'scale(1.01)'
                    }
                }
            },
            'frosted': {
                container: {
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(30px) saturate(1.5) brightness(1.2)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    padding: '28px'
                },
                item: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '18px',
                    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.12)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }
                }
            }
        },

        // Niveaux d'animation
        animations: {
            'none': { enabled: false },
            'subtle': {
                enabled: true,
                duration: '0.2s',
                easing: 'ease-out',
                types: ['fade', 'scale']
            },
            'smooth': {
                enabled: true,
                duration: '0.3s',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                types: ['fade', 'slide', 'scale', 'rotate'],
                stagger: 50
            },
            'rich': {
                enabled: true,
                duration: '0.5s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                types: ['fade', 'slide', 'scale', 'rotate', 'flip', 'blur'],
                stagger: 80,
                parallax: true,
                particles: true,
                morphing: true
            }
        },

        // Types de layout
        layouts: {
            'grid': {
                display: 'grid',
                columns: 'auto-fit',
                minItemWidth: '250px',
                gap: '20px',
                autoRows: 'auto'
            },
            'masonry': {
                columns: 'auto',
                columnGap: '20px',
                breakpoints: {
                    320: 1,
                    768: 2,
                    1024: 3,
                    1440: 4
                }
            },
            'flex': {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                justifyContent: 'flex-start'
            },
            'cards': {
                display: 'grid',
                columns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
                autoRows: '1fr'
            },
            'tiles': {
                display: 'grid',
                columns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
                aspectRatio: '1'
            },
            'list': {
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }
        },

        // Fonctionnalités
        features: {
            // Filtrage
            filter: {
                enabled: false,
                types: ['text', 'select', 'range', 'date', 'custom'],
                position: 'top',
                animated: true,
                persist: true
            },

            // Tri
            sort: {
                enabled: false,
                fields: [],
                multi: false,
                indicators: true,
                animations: true
            },

            // Drag & Drop
            dragDrop: {
                enabled: false,
                handle: '.drag-handle',
                animation: 'smooth',
                ghostClass: 'grid-item-ghost',
                chosenClass: 'grid-item-chosen',
                dragClass: 'grid-item-drag',
                reorder: true,
                groups: []
            },

            // Virtualisation
            virtualization: {
                enabled: false,
                threshold: 100,
                buffer: 5,
                dynamic: true
            },

            // Pagination
            pagination: {
                enabled: false,
                pageSize: 20,
                position: 'bottom',
                showInfo: true,
                showSizeChanger: true,
                showQuickJumper: true
            },

            // Sélection
            selection: {
                enabled: false,
                type: 'checkbox', // checkbox, radio, click
                multi: true,
                keyboard: true,
                persist: false
            },

            // Lazy loading
            lazyLoad: {
                enabled: false,
                threshold: '200px',
                placeholder: 'blur',
                animation: 'fade'
            },

            // Zoom
            zoom: {
                enabled: false,
                minScale: 0.5,
                maxScale: 3,
                step: 0.1,
                controls: true,
                wheel: true,
                pinch: true
            },

            // Actions sur les items
            itemActions: {
                enabled: false,
                actions: ['view', 'edit', 'delete', 'share'],
                position: 'top-right',
                showOnHover: true
            },

            // Groupement
            grouping: {
                enabled: false,
                fields: [],
                collapsible: true,
                showCount: true
            },

            // Export
            export: {
                enabled: false,
                formats: ['json', 'csv', 'excel', 'pdf'],
                filename: 'grid-export'
            },

            // Recherche
            search: {
                enabled: false,
                placeholder: 'Rechercher...',
                fields: 'all',
                highlight: true,
                fuzzy: false
            },

            // Infinite scroll
            infiniteScroll: {
                enabled: false,
                threshold: 100,
                loader: true
            },

            // Responsive
            responsive: {
                enabled: true,
                breakpoints: {
                    xs: 0,
                    sm: 576,
                    md: 768,
                    lg: 992,
                    xl: 1200,
                    xxl: 1400
                }
            }
        },

        // Callbacks
        callbacks: {
            onItemClick: null,
            onItemHover: null,
            onSort: null,
            onFilter: null,
            onDragStart: null,
            onDragEnd: null,
            onSelectionChange: null,
            onPageChange: null,
            onZoom: null,
            onGroupToggle: null,
            onExport: null,
            onSearch: null,
            onLoadMore: null,
            onError: null
        },

        // Templates
        templates: {
            item: null,
            empty: '<div class="grid-empty">Aucun élément à afficher</div>',
            loading: '<div class="grid-loading">Chargement...</div>',
            error: '<div class="grid-error">Une erreur est survenue</div>'
        },

        // Classes CSS
        classes: {
            container: 'ui-grid',
            wrapper: 'ui-grid-wrapper',
            item: 'ui-grid-item',
            header: 'ui-grid-header',
            footer: 'ui-grid-footer',
            filters: 'ui-grid-filters',
            loading: 'ui-grid-loading',
            empty: 'ui-grid-empty'
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = {
        instances: new Map(),
        idCounter: 0,
        observers: new Map(),
        animations: new Map(),
        virtualScroll: new Map()
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    // Génération d'ID unique
    function generateId() {
        return `grid-${++state.idCounter}`;
    }

    // Fusion des options
    function mergeOptions(defaults, custom) {
        const merged = { ...defaults };
        
        for (const key in custom) {
            if (custom.hasOwnProperty(key)) {
                if (typeof custom[key] === 'object' && !Array.isArray(custom[key]) && custom[key] !== null) {
                    merged[key] = mergeOptions(defaults[key] || {}, custom[key]);
                } else {
                    merged[key] = custom[key];
                }
            }
        }
        
        return merged;
    }

    // Création du conteneur principal
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = options.classes.container;
        container.id = options.id || generateId();
        
        // Application du style choisi
        const style = CONFIG.styles[options.style];
        if (style && style.container) {
            Object.assign(container.style, style.container);
        }
        
        // Structure interne
        container.innerHTML = `
            <div class="${options.classes.wrapper}">
                ${options.features.filter.enabled ? createFilters(options) : ''}
                ${options.features.search.enabled ? createSearchBox(options) : ''}
                <div class="grid-content" role="grid"></div>
                ${options.features.pagination.enabled ? createPagination(options) : ''}
            </div>
        `;
        
        return container;
    }

    // Création des filtres
    function createFilters(options) {
        return `
            <div class="${options.classes.filters}">
                <div class="filter-wrapper">
                    <!-- Filtres dynamiques injectés ici -->
                </div>
            </div>
        `;
    }

    // Création de la boîte de recherche
    function createSearchBox(options) {
        return `
            <div class="grid-search">
                <input type="search" 
                       placeholder="${options.features.search.placeholder}"
                       class="grid-search-input">
                <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </div>
        `;
    }

    // Création de la pagination
    function createPagination(options) {
        return `
            <div class="grid-pagination">
                <button class="pagination-prev" disabled>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </button>
                <div class="pagination-info">
                    <span class="current-page">1</span> / <span class="total-pages">1</span>
                </div>
                <button class="pagination-next">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    // Rendu des items
    function renderItems(container, items, options) {
        const content = container.querySelector('.grid-content');
        const style = CONFIG.styles[options.style];
        
        // Nettoyage
        content.innerHTML = '';
        
        // Application du layout
        applyLayout(content, options.layout);
        
        // Rendu de chaque item
        items.forEach((item, index) => {
            const element = createItem(item, index, options);
            
            // Animation d'entrée
            if (options.animation !== 'none') {
                animateItemEntry(element, index, options);
            }
            
            content.appendChild(element);
        });
        
        // Virtualisation si activée
        if (options.features.virtualization.enabled) {
            setupVirtualization(container, options);
        }
        
        // Lazy loading des images
        if (options.features.lazyLoad.enabled) {
            setupLazyLoading(container, options);
        }
    }

    // Création d'un item
    function createItem(data, index, options) {
        const item = document.createElement('div');
        item.className = `${options.classes.item} grid-item-${index}`;
        item.dataset.index = index;
        
        // Style de l'item
        const style = CONFIG.styles[options.style];
        if (style && style.item) {
            Object.assign(item.style, style.item);
        }
        
        // Contenu via template ou par défaut
        if (options.templates.item) {
            if (typeof options.templates.item === 'function') {
                item.innerHTML = options.templates.item(data, index);
            } else {
                item.innerHTML = options.templates.item;
            }
        } else {
            item.innerHTML = createDefaultItemContent(data);
        }
        
        // Actions si activées
        if (options.features.itemActions.enabled) {
            item.appendChild(createItemActions(options.features.itemActions));
        }
        
        // Drag handle si drag & drop activé
        if (options.features.dragDrop.enabled) {
            item.innerHTML = `<div class="drag-handle">⋮⋮</div>` + item.innerHTML;
        }
        
        return item;
    }

    // Contenu par défaut d'un item
    function createDefaultItemContent(data) {
        if (typeof data === 'string') {
            return `<div class="grid-item-content">${data}</div>`;
        }
        
        if (data.image) {
            return `
                <div class="grid-item-media">
                    <img src="${data.image}" alt="${data.title || ''}" loading="lazy">
                </div>
                <div class="grid-item-content">
                    ${data.title ? `<h3>${data.title}</h3>` : ''}
                    ${data.description ? `<p>${data.description}</p>` : ''}
                </div>
            `;
        }
        
        return `<div class="grid-item-content">${JSON.stringify(data)}</div>`;
    }

    // Création des actions d'item
    function createItemActions(config) {
        const actions = document.createElement('div');
        actions.className = 'grid-item-actions';
        actions.style.position = 'absolute';
        
        const positions = config.position.split('-');
        positions.forEach(pos => {
            actions.style[pos] = '8px';
        });
        
        config.actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `action-${action}`;
            btn.innerHTML = getActionIcon(action);
            actions.appendChild(btn);
        });
        
        if (config.showOnHover) {
            actions.style.opacity = '0';
            actions.style.transition = 'opacity 0.3s';
        }
        
        return actions;
    }

    // Icônes d'actions
    function getActionIcon(action) {
        const icons = {
            view: '<svg width="20" height="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>',
            edit: '<svg width="20" height="20"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
            delete: '<svg width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
            share: '<svg width="20" height="20"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>'
        };
        
        return icons[action] || '';
    }

    // Application du layout
    function applyLayout(content, layoutType) {
        const layout = CONFIG.layouts[layoutType];
        
        if (!layout) return;
        
        if (layout.display) {
            content.style.display = layout.display;
        }
        
        if (layoutType === 'grid' || layoutType === 'cards' || layoutType === 'tiles') {
            content.style.gridTemplateColumns = layout.columns.includes('repeat') 
                ? layout.columns 
                : `repeat(${layout.columns}, minmax(${layout.minItemWidth || '200px'}, 1fr))`;
            content.style.gap = layout.gap;
            
            if (layout.autoRows) {
                content.style.gridAutoRows = layout.autoRows;
            }
            
            if (layout.aspectRatio) {
                content.style.aspectRatio = layout.aspectRatio;
            }
        } else if (layoutType === 'flex' || layoutType === 'list') {
            Object.assign(content.style, layout);
        } else if (layoutType === 'masonry') {
            setupMasonry(content, layout);
        }
    }

    // Configuration du masonry
    function setupMasonry(content, config) {
        content.style.columnGap = config.columnGap;
        
        // Responsive columns
        const updateColumns = () => {
            const width = window.innerWidth;
            let columns = 1;
            
            for (const [breakpoint, cols] of Object.entries(config.breakpoints)) {
                if (width >= parseInt(breakpoint)) {
                    columns = cols;
                }
            }
            
            content.style.columnCount = columns;
        };
        
        updateColumns();
        window.addEventListener('resize', updateColumns);
    }

    // Animation d'entrée des items
    function animateItemEntry(element, index, options) {
        const animation = CONFIG.animations[options.animation];
        
        if (!animation || !animation.enabled) return;
        
        // État initial
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        // Délai progressif
        const delay = animation.stagger ? index * animation.stagger : 0;
        
        setTimeout(() => {
            element.style.transition = `all ${animation.duration} ${animation.easing}`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // Animations riches
            if (options.animation === 'rich') {
                addRichAnimations(element, animation);
            }
        }, delay);
    }

    // Animations riches
    function addRichAnimations(element, config) {
        // Effet de parallaxe
        if (config.parallax) {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                element.style.transform = `
                    perspective(1000px)
                    rotateX(${y * 10}deg)
                    rotateY(${x * 10}deg)
                    translateZ(10px)
                `;
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0)';
            });
        }
        
        // Particules
        if (config.particles) {
            element.addEventListener('mouseenter', () => {
                createParticles(element);
            });
        }
    }

    // Création de particules
    function createParticles(element) {
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * rect.width}px;
                top: ${Math.random() * rect.height}px;
            `;
            
            element.appendChild(particle);
            
            // Animation
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${(Math.random() - 0.5) * 100}px, ${-50 - Math.random() * 50}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            }).onfinish = () => particle.remove();
        }
    }

    // Virtualisation
    function setupVirtualization(container, options) {
        const content = container.querySelector('.grid-content');
        const config = options.features.virtualization;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.visibility = 'visible';
                } else {
                    entry.target.style.visibility = 'hidden';
                }
            });
        }, {
            rootMargin: `${config.buffer * 100}px`
        });
        
        content.querySelectorAll(`.${options.classes.item}`).forEach(item => {
            observer.observe(item);
        });
        
        state.observers.set(container.id, observer);
    }

    // Lazy loading
    function setupLazyLoading(container, options) {
        const images = container.querySelectorAll('img[loading="lazy"]');
        const config = options.features.lazyLoad;
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Placeholder blur
                    if (config.placeholder === 'blur') {
                        img.style.filter = 'blur(10px)';
                        img.style.transition = 'filter 0.3s';
                    }
                    
                    // Chargement
                    img.src = img.dataset.src || img.src;
                    
                    img.onload = () => {
                        if (config.placeholder === 'blur') {
                            img.style.filter = 'none';
                        }
                        
                        if (config.animation === 'fade') {
                            img.style.animation = 'fadeIn 0.3s';
                        }
                        
                        imageObserver.unobserve(img);
                    };
                }
            });
        }, {
            rootMargin: config.threshold
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    // Configuration des événements
    function setupEventHandlers(container, options) {
        const content = container.querySelector('.grid-content');
        
        // Click sur les items
        content.addEventListener('click', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (item && options.callbacks.onItemClick) {
                const index = parseInt(item.dataset.index);
                options.callbacks.onItemClick(options.data[index], index, item);
            }
        });
        
        // Hover sur les items
        if (options.callbacks.onItemHover) {
            content.addEventListener('mouseenter', (e) => {
                const item = e.target.closest(`.${options.classes.item}`);
                if (item) {
                    const index = parseInt(item.dataset.index);
                    options.callbacks.onItemHover(options.data[index], index, item);
                }
            }, true);
        }
        
        // Recherche
        if (options.features.search.enabled) {
            const searchInput = container.querySelector('.grid-search-input');
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(container, e.target.value, options);
                }, 300);
            });
        }
        
        // Pagination
        if (options.features.pagination.enabled) {
            setupPaginationHandlers(container, options);
        }
        
        // Drag & Drop
        if (options.features.dragDrop.enabled) {
            setupDragDrop(container, options);
        }
        
        // Sélection
        if (options.features.selection.enabled) {
            setupSelection(container, options);
        }
        
        // Actions des items
        if (options.features.itemActions.enabled) {
            setupItemActions(container, options);
        }
    }

    // Recherche
    function performSearch(container, query, options) {
        const items = Array.from(container.querySelectorAll(`.${options.classes.item}`));
        const config = options.features.search;
        
        items.forEach((item, index) => {
            const data = options.data[index];
            let text = '';
            
            if (config.fields === 'all') {
                text = JSON.stringify(data).toLowerCase();
            } else {
                config.fields.forEach(field => {
                    text += (data[field] || '').toString().toLowerCase() + ' ';
                });
            }
            
            const matches = config.fuzzy 
                ? fuzzySearch(query.toLowerCase(), text)
                : text.includes(query.toLowerCase());
            
            if (matches) {
                item.style.display = '';
                
                if (config.highlight) {
                    highlightText(item, query);
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        if (options.callbacks.onSearch) {
            options.callbacks.onSearch(query);
        }
    }

    // Recherche floue
    function fuzzySearch(needle, haystack) {
        const hlen = haystack.length;
        const nlen = needle.length;
        
        if (nlen > hlen) return false;
        if (nlen === hlen) return needle === haystack;
        
        outer: for (let i = 0, j = 0; i < nlen; i++) {
            const nch = needle.charCodeAt(i);
            
            while (j < hlen) {
                if (haystack.charCodeAt(j++) === nch) {
                    continue outer;
                }
            }
            return false;
        }
        return true;
    }

    // Surlignage du texte
    function highlightText(element, query) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = new RegExp(`(${query})`, 'gi');
            
            if (regex.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(regex, '<mark>$1</mark>');
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
    }

    // Configuration de la pagination
    function setupPaginationHandlers(container, options) {
        const prevBtn = container.querySelector('.pagination-prev');
        const nextBtn = container.querySelector('.pagination-next');
        const currentPage = container.querySelector('.current-page');
        const totalPages = container.querySelector('.total-pages');
        
        const config = options.features.pagination;
        let page = 1;
        const total = Math.ceil(options.data.length / config.pageSize);
        
        totalPages.textContent = total;
        
        const updatePage = (newPage) => {
            page = Math.max(1, Math.min(newPage, total));
            currentPage.textContent = page;
            
            prevBtn.disabled = page === 1;
            nextBtn.disabled = page === total;
            
            // Rendu des items de la page
            const start = (page - 1) * config.pageSize;
            const end = start + config.pageSize;
            const pageData = options.data.slice(start, end);
            
            renderItems(container, pageData, { ...options, data: pageData });
            
            if (options.callbacks.onPageChange) {
                options.callbacks.onPageChange(page, config.pageSize);
            }
        };
        
        prevBtn.addEventListener('click', () => updatePage(page - 1));
        nextBtn.addEventListener('click', () => updatePage(page + 1));
        
        // Initialisation
        updatePage(1);
    }

    // Configuration du drag & drop
    function setupDragDrop(container, options) {
        const config = options.features.dragDrop;
        let draggedElement = null;
        
        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (!item) return;
            
            draggedElement = item;
            item.classList.add(config.dragClass);
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', item.innerHTML);
            
            if (options.callbacks.onDragStart) {
                const index = parseInt(item.dataset.index);
                options.callbacks.onDragStart(options.data[index], index, item);
            }
        });
        
        container.addEventListener('dragover', (e) => {
            if (e.preventDefault) {
                e.preventDefault();
            }
            
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(container, e.clientY);
            const content = container.querySelector('.grid-content');
            
            if (afterElement == null) {
                content.appendChild(draggedElement);
            } else {
                content.insertBefore(draggedElement, afterElement);
            }
            
            return false;
        });
        
        container.addEventListener('dragend', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (!item) return;
            
            item.classList.remove(config.dragClass);
            
            if (options.callbacks.onDragEnd) {
                const newIndex = Array.from(container.querySelectorAll(`.${options.classes.item}`)).indexOf(item);
                options.callbacks.onDragEnd(options.data[parseInt(item.dataset.index)], newIndex, item);
            }
            
            draggedElement = null;
        });
    }

    // Obtenir l'élément après lequel insérer
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(`.${CONFIG.classes.item}:not(.dragging)`)];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Configuration de la sélection
    function setupSelection(container, options) {
        const config = options.features.selection;
        const selected = new Set();
        
        container.addEventListener('click', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (!item) return;
            
            const index = parseInt(item.dataset.index);
            
            if (config.type === 'click') {
                if (config.multi) {
                    if (selected.has(index)) {
                        selected.delete(index);
                        item.classList.remove('selected');
                    } else {
                        selected.add(index);
                        item.classList.add('selected');
                    }
                } else {
                    // Désélectionner tout
                    container.querySelectorAll('.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    selected.clear();
                    
                    selected.add(index);
                    item.classList.add('selected');
                }
                
                if (options.callbacks.onSelectionChange) {
                    options.callbacks.onSelectionChange(Array.from(selected));
                }
            }
        });
        
        // Sélection au clavier
        if (config.keyboard) {
            container.addEventListener('keydown', (e) => {
                if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    
                    container.querySelectorAll(`.${options.classes.item}`).forEach((item, index) => {
                        item.classList.add('selected');
                        selected.add(index);
                    });
                    
                    if (options.callbacks.onSelectionChange) {
                        options.callbacks.onSelectionChange(Array.from(selected));
                    }
                }
            });
        }
    }

    // Configuration des actions d'items
    function setupItemActions(container, options) {
        const config = options.features.itemActions;
        
        container.addEventListener('mouseenter', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (!item) return;
            
            const actions = item.querySelector('.grid-item-actions');
            if (actions && config.showOnHover) {
                actions.style.opacity = '1';
            }
        }, true);
        
        container.addEventListener('mouseleave', (e) => {
            const item = e.target.closest(`.${options.classes.item}`);
            if (!item) return;
            
            const actions = item.querySelector('.grid-item-actions');
            if (actions && config.showOnHover) {
                actions.style.opacity = '0';
            }
        }, true);
        
        // Gestion des clics sur les actions
        container.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[class^="action-"]');
            if (!actionBtn) return;
            
            e.stopPropagation();
            
            const action = actionBtn.className.replace('action-', '');
            const item = actionBtn.closest(`.${options.classes.item}`);
            const index = parseInt(item.dataset.index);
            
            if (options.callbacks[`on${action.charAt(0).toUpperCase() + action.slice(1)}`]) {
                options.callbacks[`on${action.charAt(0).toUpperCase() + action.slice(1)}`](
                    options.data[index],
                    index,
                    item
                );
            }
        });
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    
    // Injection des styles
    function injectStyles() {
        if (document.getElementById('ui-grid-styles')) return;
        
        const styles = `
            /* Styles de base de la grille */
            .ui-grid {
                position: relative;
                width: 100%;
            }
            
            .ui-grid-wrapper {
                position: relative;
            }
            
            .grid-content {
                position: relative;
                min-height: 200px;
            }
            
            .ui-grid-item {
                position: relative;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .ui-grid-item.selected {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }
            
            .ui-grid-item:hover .grid-item-actions {
                opacity: 1 !important;
            }
            
            /* Recherche */
            .grid-search {
                position: relative;
                margin-bottom: 20px;
            }
            
            .grid-search-input {
                width: 100%;
                padding: 12px 40px 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                color: inherit;
                font-size: 14px;
                transition: all 0.3s;
            }
            
            .grid-search-input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .search-icon {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0.5;
                pointer-events: none;
            }
            
            /* Pagination */
            .grid-pagination {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-top: 24px;
                padding: 16px;
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border-radius: 12px;
            }
            
            .grid-pagination button {
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .grid-pagination button:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            
            .grid-pagination button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .pagination-info {
                font-size: 14px;
                opacity: 0.8;
            }
            
            /* Actions */
            .grid-item-actions {
                display: flex;
                gap: 8px;
                transition: opacity 0.3s;
            }
            
            .grid-item-actions button {
                width: 32px;
                height: 32px;
                padding: 0;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .grid-item-actions button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }
            
            .grid-item-actions svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
            
            /* Drag & Drop */
            .drag-handle {
                position: absolute;
                top: 8px;
                left: 8px;
                cursor: move;
                opacity: 0.5;
                transition: opacity 0.3s;
            }
            
            .ui-grid-item:hover .drag-handle {
                opacity: 1;
            }
            
            .ui-grid-item.grid-item-drag {
                opacity: 0.5;
            }
            
            /* États vides et chargement */
            .grid-empty, .grid-loading, .grid-error {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                font-size: 16px;
                opacity: 0.6;
            }
            
            /* Surlignage de recherche */
            mark {
                background: rgba(255, 235, 59, 0.5);
                padding: 0 2px;
                border-radius: 2px;
            }
            
            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Particules */
            .particle {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .grid-content {
                    gap: 12px !important;
                }
                
                .ui-grid-item {
                    min-width: 100%;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ui-grid-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Création d'une grille
        create(options = {}) {
            // Fusion avec la configuration par défaut
            const finalOptions = mergeOptions({
                style: 'glassmorphism',
                layout: 'grid',
                animation: 'smooth',
                data: [],
                ...CONFIG
            }, options);
            
            // Injection des styles si nécessaire
            this.injectStyles();
            
            // Création du conteneur
            const container = createContainer(finalOptions);
            
            // Rendu des items
            if (finalOptions.data && finalOptions.data.length > 0) {
                renderItems(container, finalOptions.data, finalOptions);
            }
            
            // Configuration des événements
            setupEventHandlers(container, finalOptions);
            
            // Stockage de l'instance
            state.instances.set(container.id, {
                container,
                options: finalOptions
            });
            
            // API de l'instance
            return {
                element: container,
                
                // Mise à jour des données
                update(newData) {
                    finalOptions.data = newData;
                    renderItems(container, newData, finalOptions);
                },
                
                // Ajout d'items
                append(items) {
                    const newItems = Array.isArray(items) ? items : [items];
                    finalOptions.data.push(...newItems);
                    renderItems(container, finalOptions.data, finalOptions);
                },
                
                // Suppression d'items
                remove(index) {
                    finalOptions.data.splice(index, 1);
                    renderItems(container, finalOptions.data, finalOptions);
                },
                
                // Filtrage
                filter(predicate) {
                    const filtered = finalOptions.data.filter(predicate);
                    renderItems(container, filtered, finalOptions);
                },
                
                // Tri
                sort(field, order = 'asc') {
                    finalOptions.data.sort((a, b) => {
                        const aVal = a[field];
                        const bVal = b[field];
                        
                        if (order === 'asc') {
                            return aVal > bVal ? 1 : -1;
                        } else {
                            return aVal < bVal ? 1 : -1;
                        }
                    });
                    
                    renderItems(container, finalOptions.data, finalOptions);
                },
                
                // Recherche
                search(query) {
                    performSearch(container, query, finalOptions);
                },
                
                // Export
                export(format = 'json') {
                    const exporters = {
                        json: () => JSON.stringify(finalOptions.data, null, 2),
                        csv: () => {
                            const headers = Object.keys(finalOptions.data[0] || {});
                            const rows = finalOptions.data.map(item => 
                                headers.map(h => item[h]).join(',')
                            );
                            return [headers.join(','), ...rows].join('\n');
                        }
                    };
                    
                    const content = exporters[format] ? exporters[format]() : '';
                    const blob = new Blob([content], { type: `text/${format}` });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${finalOptions.features.export.filename}.${format}`;
                    a.click();
                    URL.revokeObjectURL(url);
                },
                
                // Destruction
                destroy() {
                    // Nettoyage des observers
                    const observer = state.observers.get(container.id);
                    if (observer) {
                        observer.disconnect();
                        state.observers.delete(container.id);
                    }
                    
                    // Suppression du DOM
                    container.remove();
                    
                    // Suppression de l'instance
                    state.instances.delete(container.id);
                }
            };
        },
        
        // Configuration globale
        CONFIG,
        
        // Injection des styles
        injectStyles,
        
        // Utilitaires
        utils: {
            mergeOptions,
            generateId
        }
    };
})();

// Export pour utilisation
export default GridComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion du masonry responsive
   Solution: Utilisation de CSS columns avec breakpoints
   
   [2024-01-16] - Performance avec beaucoup d'items
   Solution: Implémentation de la virtualisation
   
   [2024-01-17] - Conflits de z-index avec les particules
   Solution: z-index: 1000 sur les particules
   
   NOTES POUR REPRISES FUTURES:
   - La virtualisation nécessite IntersectionObserver
   - Les animations riches peuvent impacter les performances
   - Le drag & drop utilise l'API HTML5 native
   - Le masonry CSS a des limitations vs librairie JS
   ======================================== */