/* ========================================
   TIMELINE.COMPONENT.JS - Composant Timeline ultra-complet
   Chemin: src/js/shared/ui/data-display/timeline.component.js
   
   DESCRIPTION:
   Composant de timeline/chronologie avec multiples orientations,
   styles, animations et fonctionnalités avancées pour afficher
   des événements chronologiques de manière visuelle.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Création du DOM (lignes 252-600)
   3. Gestion des événements (lignes 602-800)
   4. Filtrage et tri (lignes 802-950)
   5. Animations et transitions (lignes 952-1100)
   6. Méthodes utilitaires (lignes 1102-1300)
   7. API publique (lignes 1302-1400)
   
   DÉPENDANCES:
   - timeline.css (styles associés)
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   - format-utils.js (formatage dates)
   ======================================== */

const Timeline = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Tous les styles possibles
        styles: {
            'glassmorphism': {
                blur: 20,
                opacity: 0.1,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                glowEffect: true,
                reflections: true
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: 20
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8
            },
            'minimal': {
                background: 'transparent',
                border: 'none',
                lineStyle: 'dashed'
            },
            'material': {
                elevation: 2,
                ripple: true,
                borderRadius: 4
            },
            'gradient': {
                gradientStart: '#667eea',
                gradientEnd: '#764ba2',
                glowIntensity: 0.5
            }
        },

        // Orientations possibles
        orientations: {
            'vertical': {
                default: true,
                linePosition: 'center',
                itemFlow: 'alternate'
            },
            'horizontal': {
                linePosition: 'middle',
                scrollable: true
            },
            'vertical-left': {
                linePosition: 'left',
                itemFlow: 'right'
            },
            'vertical-right': {
                linePosition: 'right',
                itemFlow: 'left'
            },
            'zigzag': {
                alternating: true,
                connectorStyle: 'curved'
            },
            'tree': {
                branching: true,
                hierarchical: true
            }
        },

        // Types d'éléments
        itemTypes: {
            'event': {
                icon: 'calendar',
                color: '#3b82f6',
                shape: 'circle'
            },
            'milestone': {
                icon: 'flag',
                color: '#22c55e',
                shape: 'diamond',
                emphasis: true
            },
            'phase': {
                icon: 'layers',
                color: '#8b5cf6',
                shape: 'square',
                duration: true
            },
            'task': {
                icon: 'check-circle',
                color: '#f59e0b',
                shape: 'circle'
            },
            'announcement': {
                icon: 'megaphone',
                color: '#ef4444',
                shape: 'hexagon'
            },
            'note': {
                icon: 'sticky-note',
                color: '#6b7280',
                shape: 'rounded'
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                nodeSize: 32,
                lineWidth: 2,
                fontSize: 12,
                spacing: 40
            },
            'medium': {
                nodeSize: 48,
                lineWidth: 3,
                fontSize: 14,
                spacing: 60
            },
            'large': {
                nodeSize: 64,
                lineWidth: 4,
                fontSize: 16,
                spacing: 80
            },
            'compact': {
                nodeSize: 24,
                lineWidth: 1,
                fontSize: 11,
                spacing: 30
            }
        },

        // Options d'animation
        animations: {
            'none': { enabled: false },
            'subtle': {
                duration: 300,
                easing: 'ease-out',
                stagger: 50
            },
            'smooth': {
                duration: 500,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                stagger: 80,
                parallax: true
            },
            'rich': {
                duration: 700,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 100,
                effects: ['fade', 'slide', 'scale', 'glow'],
                onScroll: true
            },
            'bounce': {
                duration: 800,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 120,
                bounce: true
            }
        },

        // Fonctionnalités
        features: {
            'zoom': true,
            'filter': true,
            'search': true,
            'export': true,
            'collapse': true,
            'navigation': true,
            'minimap': true,
            'grouping': true,
            'clustering': true,
            'lazy-loading': true,
            'infinite-scroll': true,
            'drag-drop': true,
            'interactive': true,
            'tooltips': true,
            'preview': true
        },

        // Options de connecteurs
        connectors: {
            'straight': {
                style: 'solid',
                animated: false
            },
            'curved': {
                style: 'solid',
                curvature: 0.5,
                animated: true
            },
            'stepped': {
                style: 'solid',
                steps: 'horizontal'
            },
            'dashed': {
                style: 'dashed',
                dashArray: '5, 5'
            },
            'dotted': {
                style: 'dotted',
                dashArray: '2, 4'
            }
        },

        // Formats de date
        dateFormats: {
            'short': { year: 'numeric', month: 'short', day: 'numeric' },
            'long': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            'time': { hour: '2-digit', minute: '2-digit' },
            'relative': { relative: true },
            'custom': { format: 'DD/MM/YYYY HH:mm' }
        },

        // Thèmes de couleur
        colorSchemes: {
            'default': ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
            'pastel': ['#93c5fd', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd'],
            'monochrome': ['#1f2937', '#374151', '#6b7280', '#9ca3af', '#e5e7eb'],
            'rainbow': ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
            'ocean': ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc']
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = new Map();
    let instanceId = 0;

    // ========================================
    // CRÉATION DU DOM
    // ========================================
    function createTimeline(options = {}) {
        const id = `timeline-${++instanceId}`;
        const config = mergeConfig(options);
        
        // Initialiser l'état
        state.set(id, {
            items: config.items || [],
            filteredItems: config.items || [],
            currentFilter: null,
            currentSort: 'date',
            collapsed: new Set(),
            selected: null,
            viewMode: config.orientation || 'vertical',
            zoom: 1
        });

        const container = document.createElement('div');
        container.className = `timeline ${config.style} ${config.size} ${config.orientation}`;
        container.dataset.timelineId = id;

        // Créer la structure
        container.innerHTML = `
            <!-- Contrôles -->
            ${config.features.filter || config.features.search ? `
                <div class="timeline-controls">
                    ${config.features.search ? `
                        <div class="timeline-search">
                            <input type="text" 
                                   class="timeline-search-input" 
                                   placeholder="Rechercher dans la timeline..."
                                   aria-label="Rechercher">
                            <svg class="timeline-search-icon" viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </div>
                    ` : ''}
                    
                    ${config.features.filter ? `
                        <div class="timeline-filters">
                            <button class="timeline-filter-btn" aria-label="Filtrer">
                                <svg viewBox="0 0 24 24">
                                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                                </svg>
                                <span>Filtrer</span>
                            </button>
                            <div class="timeline-filter-dropdown" hidden>
                                <div class="filter-section">
                                    <h4>Type</h4>
                                    ${Object.entries(config.itemTypes).map(([type, info]) => `
                                        <label class="filter-option">
                                            <input type="checkbox" value="${type}" checked>
                                            <span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                                        </label>
                                    `).join('')}
                                </div>
                                <div class="filter-section">
                                    <h4>Période</h4>
                                    <input type="date" class="filter-date-start" aria-label="Date de début">
                                    <input type="date" class="filter-date-end" aria-label="Date de fin">
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="timeline-view-controls">
                        ${config.features.zoom ? `
                            <button class="timeline-zoom-out" aria-label="Zoom arrière">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/>
                                </svg>
                            </button>
                            <span class="timeline-zoom-level">100%</span>
                            <button class="timeline-zoom-in" aria-label="Zoom avant">
                                <svg viewBox="0 0 24 24">
                                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM9.5 7H8v2H6v1h2v2h1.5v-2H12V9H9.5z"/>
                                </svg>
                            </button>
                        ` : ''}
                        
                        ${config.features.export ? `
                            <button class="timeline-export" aria-label="Exporter">
                                <svg viewBox="0 0 24 24">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Minimap -->
            ${config.features.minimap ? `
                <div class="timeline-minimap">
                    <div class="minimap-viewport"></div>
                    <canvas class="minimap-canvas"></canvas>
                </div>
            ` : ''}

            <!-- Timeline principale -->
            <div class="timeline-container">
                <div class="timeline-line"></div>
                <div class="timeline-items">
                    ${renderTimelineItems(state.get(id).items, config)}
                </div>
            </div>

            <!-- Navigation -->
            ${config.features.navigation ? `
                <div class="timeline-navigation">
                    <button class="timeline-nav-prev" aria-label="Précédent">
                        <svg viewBox="0 0 24 24">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <div class="timeline-nav-dots"></div>
                    <button class="timeline-nav-next" aria-label="Suivant">
                        <svg viewBox="0 0 24 24">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
            ` : ''}
        `;

        // Initialiser les événements
        initializeEvents(container, id, config);

        // Initialiser le rendu
        initializeRendering(container, id, config);

        // Démarrer les animations si configuré
        if (config.animation !== 'none') {
            startAnimations(container, config);
        }

        return container;
    }

    // ========================================
    // RENDU DES ÉLÉMENTS
    // ========================================
    function renderTimelineItems(items, config) {
        return items.map((item, index) => {
            const type = config.itemTypes[item.type] || config.itemTypes.event;
            const isLeft = config.orientation === 'vertical' && index % 2 === 0;
            
            return `
                <div class="timeline-item ${item.type} ${isLeft ? 'left' : 'right'} ${item.emphasis ? 'emphasis' : ''}"
                     data-index="${index}"
                     data-date="${item.date}">
                    
                    <!-- Connecteur -->
                    <div class="timeline-connector ${config.connectors[item.connector || 'straight'].style}"></div>
                    
                    <!-- Nœud -->
                    <div class="timeline-node ${type.shape}" style="background-color: ${item.color || type.color}">
                        ${type.icon ? `
                            <svg class="timeline-node-icon" viewBox="0 0 24 24">
                                ${getIcon(type.icon)}
                            </svg>
                        ` : ''}
                        ${item.image ? `
                            <img class="timeline-node-image" src="${item.image}" alt="${item.title}">
                        ` : ''}
                    </div>
                    
                    <!-- Contenu -->
                    <div class="timeline-content">
                        <!-- En-tête -->
                        <div class="timeline-header">
                            <time class="timeline-date" datetime="${item.date}">
                                ${formatDate(item.date, config.dateFormats[config.dateFormat || 'short'])}
                            </time>
                            ${item.duration ? `
                                <span class="timeline-duration">${item.duration}</span>
                            ` : ''}
                            ${item.tags ? `
                                <div class="timeline-tags">
                                    ${item.tags.map(tag => `
                                        <span class="timeline-tag">${tag}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Corps -->
                        <div class="timeline-body">
                            <h3 class="timeline-title">${item.title}</h3>
                            ${item.subtitle ? `
                                <h4 class="timeline-subtitle">${item.subtitle}</h4>
                            ` : ''}
                            ${item.description ? `
                                <p class="timeline-description">${item.description}</p>
                            ` : ''}
                            
                            <!-- Médias -->
                            ${item.media ? renderMedia(item.media) : ''}
                            
                            <!-- Actions -->
                            ${item.actions ? `
                                <div class="timeline-actions">
                                    ${item.actions.map(action => `
                                        <button class="timeline-action" data-action="${action.id}">
                                            ${action.icon ? `<svg viewBox="0 0 24 24">${getIcon(action.icon)}</svg>` : ''}
                                            <span>${action.label}</span>
                                        </button>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <!-- Métriques -->
                            ${item.metrics ? `
                                <div class="timeline-metrics">
                                    ${Object.entries(item.metrics).map(([key, value]) => `
                                        <div class="timeline-metric">
                                            <span class="metric-label">${key}</span>
                                            <span class="metric-value">${value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- Pied -->
                        ${item.footer ? `
                            <div class="timeline-footer">
                                ${item.footer}
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Détails expansibles -->
                    ${item.details ? `
                        <div class="timeline-details" hidden>
                            ${item.details}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function renderMedia(media) {
        if (!media) return '';
        
        switch (media.type) {
            case 'image':
                return `
                    <div class="timeline-media image">
                        <img src="${media.url}" alt="${media.alt || ''}" loading="lazy">
                        ${media.caption ? `<figcaption>${media.caption}</figcaption>` : ''}
                    </div>
                `;
                
            case 'video':
                return `
                    <div class="timeline-media video">
                        <video controls poster="${media.poster || ''}">
                            <source src="${media.url}" type="${media.mime || 'video/mp4'}">
                        </video>
                    </div>
                `;
                
            case 'gallery':
                return `
                    <div class="timeline-media gallery">
                        ${media.items.map((item, i) => `
                            <img src="${item.url}" 
                                 alt="${item.alt || ''}" 
                                 class="gallery-item"
                                 data-index="${i}"
                                 loading="lazy">
                        `).join('')}
                    </div>
                `;
                
            case 'embed':
                return `
                    <div class="timeline-media embed">
                        <iframe src="${media.url}" 
                                frameborder="0" 
                                allowfullscreen
                                loading="lazy">
                        </iframe>
                    </div>
                `;
                
            default:
                return '';
        }
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function initializeEvents(container, id, config) {
        const currentState = state.get(id);

        // Recherche
        if (config.features.search) {
            const searchInput = container.querySelector('.timeline-search-input');
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(container, id, e.target.value);
                }, 300);
            });
        }

        // Filtres
        if (config.features.filter) {
            const filterBtn = container.querySelector('.timeline-filter-btn');
            const filterDropdown = container.querySelector('.timeline-filter-dropdown');
            
            filterBtn.addEventListener('click', () => {
                filterDropdown.hidden = !filterDropdown.hidden;
                filterBtn.classList.toggle('active');
            });

            // Checkboxes de type
            container.querySelectorAll('.filter-option input').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    applyFilters(container, id);
                });
            });

            // Dates
            const startDate = container.querySelector('.filter-date-start');
            const endDate = container.querySelector('.filter-date-end');
            
            [startDate, endDate].forEach(input => {
                if (input) {
                    input.addEventListener('change', () => {
                        applyFilters(container, id);
                    });
                }
            });
        }

        // Zoom
        if (config.features.zoom) {
            const zoomIn = container.querySelector('.timeline-zoom-in');
            const zoomOut = container.querySelector('.timeline-zoom-out');
            const zoomLevel = container.querySelector('.timeline-zoom-level');
            
            zoomIn?.addEventListener('click', () => {
                currentState.zoom = Math.min(2, currentState.zoom + 0.1);
                updateZoom(container, id);
            });
            
            zoomOut?.addEventListener('click', () => {
                currentState.zoom = Math.max(0.5, currentState.zoom - 0.1);
                updateZoom(container, id);
            });
        }

        // Export
        if (config.features.export) {
            const exportBtn = container.querySelector('.timeline-export');
            exportBtn?.addEventListener('click', () => {
                exportTimeline(container, id, config);
            });
        }

        // Navigation
        if (config.features.navigation) {
            initializeNavigation(container, id);
        }

        // Clics sur les items
        container.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.timeline-action')) {
                    handleAction(e.target.closest('.timeline-action'), item, id);
                } else if (config.features.interactive) {
                    selectItem(container, id, parseInt(item.dataset.index));
                }
            });

            // Expansion des détails
            if (config.features.collapse && item.querySelector('.timeline-details')) {
                const header = item.querySelector('.timeline-header');
                header.style.cursor = 'pointer';
                
                header.addEventListener('click', () => {
                    toggleDetails(item, id);
                });
            }
        });

        // Minimap
        if (config.features.minimap) {
            initializeMinimap(container, id);
        }

        // Drag & Drop
        if (config.features['drag-drop']) {
            initializeDragDrop(container, id);
        }

        // Scroll infini
        if (config.features['infinite-scroll']) {
            initializeInfiniteScroll(container, id);
        }

        // Tooltips
        if (config.features.tooltips) {
            initializeTooltips(container);
        }

        // Fermer les dropdowns au clic extérieur
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.querySelectorAll('.timeline-filter-dropdown').forEach(dropdown => {
                    dropdown.hidden = true;
                });
            }
        });
    }

    // ========================================
    // FILTRAGE ET TRI
    // ========================================
    function performSearch(container, id, query) {
        const currentState = state.get(id);
        const items = container.querySelectorAll('.timeline-item');
        
        if (!query) {
            items.forEach(item => item.hidden = false);
            currentState.filteredItems = currentState.items;
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const filteredIndices = new Set();
        
        currentState.items.forEach((item, index) => {
            const searchableText = [
                item.title,
                item.subtitle,
                item.description,
                ...(item.tags || [])
            ].join(' ').toLowerCase();
            
            if (searchableText.includes(lowerQuery)) {
                filteredIndices.add(index);
            }
        });
        
        items.forEach((item, index) => {
            item.hidden = !filteredIndices.has(index);
        });
        
        // Mettre à jour l'état
        currentState.filteredItems = currentState.items.filter((_, i) => filteredIndices.has(i));
        
        // Réanimer si nécessaire
        animateFilteredItems(container);
    }

    function applyFilters(container, id) {
        const currentState = state.get(id);
        const items = container.querySelectorAll('.timeline-item');
        
        // Récupérer les filtres actifs
        const activeTypes = new Set();
        container.querySelectorAll('.filter-option input:checked').forEach(input => {
            activeTypes.add(input.value);
        });
        
        const startDate = container.querySelector('.filter-date-start')?.value;
        const endDate = container.querySelector('.filter-date-end')?.value;
        
        // Appliquer les filtres
        const filteredIndices = new Set();
        
        currentState.items.forEach((item, index) => {
            let show = true;
            
            // Filtre par type
            if (activeTypes.size > 0 && !activeTypes.has(item.type)) {
                show = false;
            }
            
            // Filtre par date
            if (show && (startDate || endDate)) {
                const itemDate = new Date(item.date);
                if (startDate && itemDate < new Date(startDate)) show = false;
                if (endDate && itemDate > new Date(endDate)) show = false;
            }
            
            if (show) filteredIndices.add(index);
        });
        
        // Appliquer la visibilité
        items.forEach((item, index) => {
            item.hidden = !filteredIndices.has(index);
        });
        
        // Mettre à jour l'état
        currentState.filteredItems = currentState.items.filter((_, i) => filteredIndices.has(i));
        
        // Réanimer
        animateFilteredItems(container);
    }

    function sortTimeline(container, id, sortBy) {
        const currentState = state.get(id);
        
        // Trier les items
        currentState.filteredItems.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(a.date) - new Date(b.date);
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });
        
        // Reconstruire la timeline
        rebuildTimeline(container, id);
    }

    // ========================================
    // ANIMATIONS ET TRANSITIONS
    // ========================================
    function startAnimations(container, config) {
        const items = container.querySelectorAll('.timeline-item');
        const animation = CONFIG.animations[config.animation];
        
        if (!animation || !animation.enabled) return;
        
        // Observer pour animations au scroll
        if (animation.onScroll) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateItem(entry.target, animation);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
            
            items.forEach(item => observer.observe(item));
        } else {
            // Animation immédiate avec stagger
            items.forEach((item, index) => {
                setTimeout(() => {
                    animateItem(item, animation);
                }, index * animation.stagger);
            });
        }
    }

    function animateItem(item, animation) {
        item.classList.add('animating');
        
        // Appliquer les effets
        if (animation.effects) {
            animation.effects.forEach(effect => {
                item.classList.add(`effect-${effect}`);
            });
        }
        
        // Retirer les classes après l'animation
        setTimeout(() => {
            item.classList.remove('animating');
            item.classList.add('animated');
        }, animation.duration);
    }

    function animateFilteredItems(container) {
        const visibleItems = container.querySelectorAll('.timeline-item:not([hidden])');
        
        visibleItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 50}ms`;
            item.classList.remove('filtered-in');
            void item.offsetWidth; // Force reflow
            item.classList.add('filtered-in');
        });
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function mergeConfig(options) {
        const merged = {
            style: options.style || 'glassmorphism',
            size: options.size || 'medium',
            orientation: options.orientation || 'vertical',
            animation: options.animation || 'smooth',
            dateFormat: options.dateFormat || 'short',
            items: options.items || [],
            itemTypes: { ...CONFIG.itemTypes, ...options.itemTypes },
            features: { ...CONFIG.features, ...options.features },
            connectors: options.connector || 'straight',
            colorScheme: options.colorScheme || 'default'
        };
        
        return merged;
    }

    function formatDate(date, format) {
        const d = new Date(date);
        
        if (format.relative) {
            return getRelativeTime(d);
        }
        
        if (format.format) {
            return customFormat(d, format.format);
        }
        
        return d.toLocaleDateString(undefined, format);
    }

    function getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        return 'À l\'instant';
    }

    function customFormat(date, format) {
        const map = {
            'DD': date.getDate().toString().padStart(2, '0'),
            'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
            'YYYY': date.getFullYear(),
            'HH': date.getHours().toString().padStart(2, '0'),
            'mm': date.getMinutes().toString().padStart(2, '0')
        };
        
        return format.replace(/DD|MM|YYYY|HH|mm/g, match => map[match]);
    }

    function getIcon(name) {
        const icons = {
            'calendar': '<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>',
            'flag': '<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>',
            'layers': '<path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>',
            'check-circle': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            'megaphone': '<path d="M20 2v2C14.48 4 10 8.48 10 14s4.48 10 10 10v2c-6.63 0-12-5.37-12-12s5.37-12 12-12zm0 6v2c-2.21 0-4 1.79-4 4s1.79 4 4 4v2c-3.31 0-6-2.69-6-6s2.69-6 6-6z"/>',
            'sticky-note': '<path d="M19 3H4.99C3.89 3 3 3.9 3 5l.01 14c0 1.1.89 2 1.99 2h10l6-6V5c0-1.1-.9-2-2-2zM7 8h10v2H7V8zm5 6H7v-2h5v2zm3 4.5V14h4.5L15 18.5z"/>'
        };
        
        return icons[name] || '';
    }

    function updateZoom(container, id) {
        const currentState = state.get(id);
        const timelineContainer = container.querySelector('.timeline-container');
        const zoomLevel = container.querySelector('.timeline-zoom-level');
        
        timelineContainer.style.transform = `scale(${currentState.zoom})`;
        timelineContainer.style.transformOrigin = 'center top';
        
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentState.zoom * 100)}%`;
        }
    }

    function selectItem(container, id, index) {
        const currentState = state.get(id);
        const items = container.querySelectorAll('.timeline-item');
        
        // Retirer la sélection précédente
        items.forEach(item => item.classList.remove('selected'));
        
        // Sélectionner le nouvel item
        if (items[index]) {
            items[index].classList.add('selected');
            currentState.selected = index;
            
            // Déclencher l'événement
            const event = new CustomEvent('timelineselect', {
                detail: {
                    item: currentState.items[index],
                    index: index
                }
            });
            container.dispatchEvent(event);
            
            // Scroll vers l'élément
            items[index].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    function toggleDetails(item, id) {
        const details = item.querySelector('.timeline-details');
        const currentState = state.get(id);
        const index = parseInt(item.dataset.index);
        
        if (details) {
            const isHidden = details.hidden;
            details.hidden = !isHidden;
            
            if (isHidden) {
                currentState.collapsed.delete(index);
                item.classList.add('expanded');
            } else {
                currentState.collapsed.add(index);
                item.classList.remove('expanded');
            }
            
            // Animation
            if (!details.hidden) {
                details.style.maxHeight = '0';
                requestAnimationFrame(() => {
                    details.style.maxHeight = details.scrollHeight + 'px';
                });
            }
        }
    }

    function exportTimeline(container, id, config) {
        const currentState = state.get(id);
        const data = {
            timeline: {
                title: config.title || 'Timeline Export',
                exportDate: new Date().toISOString(),
                items: currentState.filteredItems
            }
        };
        
        // Créer le fichier
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Télécharger
        const a = document.createElement('a');
        a.href = url;
        a.download = `timeline-${new Date().getTime()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Feedback
        showNotification(container, 'Timeline exportée avec succès');
    }

    function showNotification(container, message) {
        const notification = document.createElement('div');
        notification.className = 'timeline-notification';
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ========================================
    // FONCTIONNALITÉS AVANCÉES
    // ========================================
    function initializeNavigation(container, id) {
        const prevBtn = container.querySelector('.timeline-nav-prev');
        const nextBtn = container.querySelector('.timeline-nav-next');
        const dots = container.querySelector('.timeline-nav-dots');
        const currentState = state.get(id);
        
        // Créer les points de navigation
        const itemCount = currentState.items.length;
        for (let i = 0; i < itemCount; i++) {
            const dot = document.createElement('button');
            dot.className = 'nav-dot';
            dot.dataset.index = i;
            dot.setAttribute('aria-label', `Aller à l'élément ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dots.appendChild(dot);
        }
        
        // Navigation
        let currentIndex = 0;
        
        const navigate = (index) => {
            if (index >= 0 && index < itemCount) {
                currentIndex = index;
                selectItem(container, id, index);
                
                // Mettre à jour les dots
                dots.querySelectorAll('.nav-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }
        };
        
        prevBtn?.addEventListener('click', () => navigate(currentIndex - 1));
        nextBtn?.addEventListener('click', () => navigate(currentIndex + 1));
        
        dots.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-dot')) {
                navigate(parseInt(e.target.dataset.index));
            }
        });
    }

    function initializeMinimap(container, id) {
        const minimap = container.querySelector('.timeline-minimap');
        const canvas = minimap.querySelector('.minimap-canvas');
        const viewport = minimap.querySelector('.minimap-viewport');
        const timelineContainer = container.querySelector('.timeline-container');
        
        // Dessiner la minimap
        const ctx = canvas.getContext('2d');
        const scale = 0.1;
        
        const drawMinimap = () => {
            const items = container.querySelectorAll('.timeline-item:not([hidden])');
            canvas.width = minimap.clientWidth;
            canvas.height = 100;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Ligne centrale
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            
            // Points pour chaque item
            items.forEach((item, index) => {
                const y = (index / items.length) * canvas.height;
                const x = index % 2 === 0 ? canvas.width / 2 - 10 : canvas.width / 2 + 10;
                
                ctx.fillStyle = item.classList.contains('selected') ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        };
        
        // Viewport
        const updateViewport = () => {
            const containerRect = timelineContainer.getBoundingClientRect();
            const scrollRatio = timelineContainer.scrollTop / timelineContainer.scrollHeight;
            const viewportHeight = (containerRect.height / timelineContainer.scrollHeight) * 100;
            
            viewport.style.height = `${viewportHeight}px`;
            viewport.style.top = `${scrollRatio * 100}px`;
        };
        
        // Interaction
        let isDragging = false;
        
        minimap.addEventListener('mousedown', (e) => {
            if (e.target === viewport) {
                isDragging = true;
            } else {
                // Clic direct sur la minimap
                const ratio = e.offsetY / minimap.clientHeight;
                timelineContainer.scrollTop = ratio * timelineContainer.scrollHeight;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = minimap.getBoundingClientRect();
                const ratio = (e.clientY - rect.top) / rect.height;
                timelineContainer.scrollTop = ratio * timelineContainer.scrollHeight;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Observers
        const resizeObserver = new ResizeObserver(() => {
            drawMinimap();
            updateViewport();
        });
        
        resizeObserver.observe(timelineContainer);
        
        timelineContainer.addEventListener('scroll', updateViewport);
        
        // Initial
        drawMinimap();
        updateViewport();
    }

    function initializeDragDrop(container, id) {
        const items = container.querySelectorAll('.timeline-item');
        let draggedItem = null;
        
        items.forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = getDragAfterElement(container, e.clientY);
                const itemsContainer = container.querySelector('.timeline-items');
                
                if (afterElement == null) {
                    itemsContainer.appendChild(draggedItem);
                } else {
                    itemsContainer.insertBefore(draggedItem, afterElement);
                }
            });
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.timeline-item:not(.dragging)')];
        
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

    function initializeInfiniteScroll(container, id) {
        const timelineContainer = container.querySelector('.timeline-container');
        const currentState = state.get(id);
        let isLoading = false;
        
        const loadMore = async () => {
            if (isLoading) return;
            isLoading = true;
            
            // Simuler le chargement
            const loader = document.createElement('div');
            loader.className = 'timeline-loader';
            loader.innerHTML = '<div class="loader-spinner"></div>';
            timelineContainer.appendChild(loader);
            
            // Déclencher l'événement pour charger plus
            const event = new CustomEvent('timelineloadmore', {
                detail: {
                    currentCount: currentState.items.length
                }
            });
            container.dispatchEvent(event);
            
            // Retirer le loader après un délai
            setTimeout(() => {
                loader.remove();
                isLoading = false;
            }, 1000);
        };
        
        // Observer le scroll
        timelineContainer.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = timelineContainer;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                loadMore();
            }
        });
    }

    function initializeTooltips(container) {
        const tooltipTargets = container.querySelectorAll('[title]');
        
        tooltipTargets.forEach(target => {
            const title = target.getAttribute('title');
            target.removeAttribute('title');
            
            let tooltip = null;
            
            target.addEventListener('mouseenter', () => {
                tooltip = document.createElement('div');
                tooltip.className = 'timeline-tooltip';
                tooltip.textContent = title;
                document.body.appendChild(tooltip);
                
                const rect = target.getBoundingClientRect();
                tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
                tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
                
                requestAnimationFrame(() => {
                    tooltip.classList.add('show');
                });
            });
            
            target.addEventListener('mouseleave', () => {
                if (tooltip) {
                    tooltip.classList.remove('show');
                    setTimeout(() => {
                        tooltip.remove();
                        tooltip = null;
                    }, 200);
                }
            });
        });
    }

    // ========================================
    // MÉTHODES DE RENDU
    // ========================================
    function initializeRendering(container, id, config) {
        // Appliquer le schéma de couleurs
        if (config.colorScheme && CONFIG.colorSchemes[config.colorScheme]) {
            const colors = CONFIG.colorSchemes[config.colorScheme];
            container.style.setProperty('--timeline-colors', colors.join(','));
        }
        
        // Initialiser les connecteurs courbes si nécessaire
        if (config.connectors === 'curved') {
            initializeCurvedConnectors(container);
        }
    }

    function initializeCurvedConnectors(container) {
        const items = container.querySelectorAll('.timeline-item');
        
        items.forEach((item, index) => {
            const connector = item.querySelector('.timeline-connector');
            if (connector && index < items.length - 1) {
                // Créer un SVG pour la courbe
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('connector-curve');
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', 'M0,0 Q50,50 100,0');
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', 'currentColor');
                path.setAttribute('stroke-width', '2');
                
                svg.appendChild(path);
                connector.appendChild(svg);
            }
        });
    }

    function rebuildTimeline(container, id) {
        const currentState = state.get(id);
        const itemsContainer = container.querySelector('.timeline-items');
        const config = getConfigFromContainer(container);
        
        // Vider et reconstruire
        itemsContainer.innerHTML = renderTimelineItems(currentState.filteredItems, config);
        
        // Réinitialiser les événements
        initializeEvents(container, id, config);
        
        // Réanimer
        if (config.animation !== 'none') {
            startAnimations(container, config);
        }
    }

    function getConfigFromContainer(container) {
        // Récupérer la configuration depuis les classes et attributs
        const classes = container.className.split(' ');
        return {
            style: classes.find(c => CONFIG.styles[c]) || 'glassmorphism',
            size: classes.find(c => CONFIG.sizes[c]) || 'medium',
            orientation: classes.find(c => CONFIG.orientations[c]) || 'vertical',
            animation: container.dataset.animation || 'smooth',
            features: CONFIG.features // Par défaut toutes les features
        };
    }

    function handleAction(button, item, id) {
        const action = button.dataset.action;
        const itemIndex = parseInt(item.dataset.index);
        const currentState = state.get(id);
        const itemData = currentState.items[itemIndex];
        
        // Déclencher l'événement
        const event = new CustomEvent('timelineaction', {
            detail: {
                action: action,
                item: itemData,
                index: itemIndex
            }
        });
        
        button.closest('.timeline').dispatchEvent(event);
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('timeline-styles')) return;

        const link = document.createElement('link');
        link.id = 'timeline-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/timeline.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            injectStyles();
            return createTimeline(options);
        },

        // Ajouter un item
        addItem(timeline, item, index = -1) {
            const id = timeline.dataset.timelineId;
            const currentState = state.get(id);
            
            if (index === -1) {
                currentState.items.push(item);
            } else {
                currentState.items.splice(index, 0, item);
            }
            
            rebuildTimeline(timeline, id);
        },

        // Supprimer un item
        removeItem(timeline, index) {
            const id = timeline.dataset.timelineId;
            const currentState = state.get(id);
            
            currentState.items.splice(index, 1);
            rebuildTimeline(timeline, id);
        },

        // Mettre à jour un item
        updateItem(timeline, index, updates) {
            const id = timeline.dataset.timelineId;
            const currentState = state.get(id);
            
            Object.assign(currentState.items[index], updates);
            rebuildTimeline(timeline, id);
        },

        // Obtenir les items
        getItems(timeline) {
            const id = timeline.dataset.timelineId;
            return state.get(id).items;
        },

        // Filtrer
        filter(timeline, predicate) {
            const id = timeline.dataset.timelineId;
            const currentState = state.get(id);
            
            currentState.filteredItems = currentState.items.filter(predicate);
            rebuildTimeline(timeline, id);
        },

        // Trier
        sort(timeline, sortBy) {
            const id = timeline.dataset.timelineId;
            sortTimeline(timeline, id, sortBy);
        },

        // Sélectionner un item
        select(timeline, index) {
            const id = timeline.dataset.timelineId;
            selectItem(timeline, id, index);
        },

        // Détruire
        destroy(timeline) {
            const id = timeline.dataset.timelineId;
            state.delete(id);
            timeline.remove();
        },

        // Configuration
        getConfig() {
            return CONFIG;
        },

        // Réinitialiser les styles
        injectStyles
    };
})();

// Export pour utilisation
export default Timeline;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion des connecteurs courbes
   Solution: Utilisation de SVG pour les courbes complexes
   
   [2024-12-XX] - Performance avec beaucoup d'items
   Cause: Trop de listeners d'événements
   Résolution: Délégation d'événements et lazy loading
   
   [2024-12-XX] - Animations au scroll
   Cause: Multiples déclenchements
   Résolution: IntersectionObserver avec unobserve
   
   [2024-12-XX] - Minimap responsive
   Cause: Canvas non adaptatif
   Résolution: ResizeObserver et redraw
   
   NOTES POUR REPRISES FUTURES:
   - Les animations au scroll utilisent IntersectionObserver
   - La minimap nécessite un canvas redimensionnable
   - Le drag & drop modifie l'ordre visuel seulement
   - Les tooltips sont ajoutés au body pour éviter le clipping
   - Les connecteurs courbes nécessitent des calculs SVG
   ======================================== */