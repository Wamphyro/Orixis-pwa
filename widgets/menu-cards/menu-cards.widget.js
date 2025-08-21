// ========================================
// MENU-CARDS.WIDGET.JS - Widget de cartes ultra-optionnable
// Chemin: widgets/menu-cards/menu-cards.widget.js
//
// DESCRIPTION:
// Widget de cartes avec layouts flexibles, cartes imbriquées,
// sections personnalisables, drag & drop, et API complète
// ========================================

export class MenuCardsWidget {
    constructor(config = {}) {
        // Configuration par défaut avec toutes les options
        this.config = {
            // Container
            container: config.container || 'body',
            
            // ========== APPARENCE ==========
            theme: config.theme || 'default', // default, gradient, glass, neon, minimal, material
            layout: config.layout || 'grid',  // grid, list, masonry, kanban, timeline
            cardLayout: config.cardLayout || 'vertical', // vertical, horizontal, split, compact, expanded
            
            // Grille responsive
            gridLayout: {
                type: config.gridLayout?.type || 'grid', // grid, flex, masonry
                columns: {
                    xs: config.gridLayout?.columns?.xs || 1,
                    sm: config.gridLayout?.columns?.sm || 2,
                    md: config.gridLayout?.columns?.md || 3,
                    lg: config.gridLayout?.columns?.lg || 4,
                    xl: config.gridLayout?.columns?.xl || 5
                },
                gap: {
                    x: config.gridLayout?.gap?.x || 20,
                    y: config.gridLayout?.gap?.y || 20
                },
                ...config.gridLayout
            },
            
            // ========== WRAPPER ==========
            showWrapper: config.showWrapper !== false,
            wrapperStyle: config.wrapperStyle || 'transparent', // card, glass, transparent, bordered
            wrapperTitle: config.wrapperTitle || '',
            wrapperSubtitle: config.wrapperSubtitle || '',
            wrapperActions: config.wrapperActions || [], // Boutons dans le header du wrapper
            
            // ========== ORGANISATION ==========
            groupBy: config.groupBy || null, // 'category', 'date', 'priority', 'status', fonction
            groupHeaders: config.groupHeaders !== false,
            collapsibleGroups: config.collapsibleGroups || false,
            groupSort: config.groupSort || 'asc',
            
            // ========== ANIMATIONS ==========
            animated: config.animated !== false,
            animationDelay: config.animationDelay || 50,
            animationType: config.animationType || 'fadeInUp', // fadeInUp, slideIn, zoomIn, flip, bounce
            staggerAnimation: config.staggerAnimation !== false,
            
            // ========== CARTES ==========
            cards: config.cards || [],
            /* Format carte étendu:
            {
                // Identité
                id: 'unique-id',
                order: 1,
                level: 0, // Niveau d'imbrication
                parentId: null, // ID du parent si carte imbriquée
                
                // Layout
                layout: 'vertical', // Override du layout global
                size: 'normal', // small, normal, large, xl
                width: null, // Largeur custom
                height: null, // Hauteur custom
                
                // Sections
                header: {
                    icon: '🎯' ou '<svg>...</svg>',
                    iconType: 'emoji' ou 'svg' ou 'image',
                    iconColor: '#667eea',
                    badge: { text: 'NEW', type: 'success', position: 'top-right' },
                    menu: [{ label: 'Option 1', action: 'edit' }],
                    background: 'gradient' ou '#color' ou 'url(...)'
                },
                
                body: {
                    title: 'Titre principal',
                    subtitle: 'Sous-titre',
                    description: 'Description détaillée',
                    tags: [{ text: 'Tag1', color: 'primary' }],
                    content: 'html' ou { type: 'list|table|progress|chart', data: {...} }
                },
                
                stats: {
                    primary: { value: '42', label: 'Total', trend: 'up', color: 'success' },
                    secondary: { value: '12', label: 'En cours' },
                    chart: { type: 'line', data: [1,2,3], sparkline: true },
                    progress: { value: 75, label: 'Progression', color: 'primary' }
                },
                
                footer: {
                    buttons: [
                        { text: 'Action', type: 'primary', onClick: () => {} }
                    ],
                    links: [
                        { text: 'Voir plus', href: '#' }
                    ],
                    meta: 'Mis à jour il y a 2h'
                },
                
                // Cartes imbriquées
                children: [],
                expandable: false,
                defaultExpanded: false,
                maxNestingLevel: 3,
                
                // États
                states: {
                    default: { opacity: 1 },
                    hover: { scale: 1.02, shadow: 'large' },
                    selected: { border: '2px solid #667eea' },
                    loading: { opacity: 0.5, pointer: 'wait' },
                    disabled: { opacity: 0.5, pointer: 'not-allowed' }
                },
                
                // Navigation
                href: '/path/to/page',
                onClick: (card) => {},
                target: '_self',
                
                // Comportement
                disabled: false,
                hidden: false,
                locked: false,
                selectable: true,
                draggable: true,
                editable: false,
                deletable: false,
                
                // Permissions
                permissions: ['module.action'],
                requiresAdmin: false,
                
                // Custom
                className: 'custom-class',
                style: { backgroundColor: '#fff' },
                data: {} // Données custom
            }
            */
            
            // ========== INTERACTIONS ==========
            interactions: {
                draggable: config.interactions?.draggable || false,
                droppable: config.interactions?.droppable || false,
                selectable: config.interactions?.selectable || false,
                multiSelect: config.interactions?.multiSelect || false,
                editable: config.interactions?.editable || false,
                contextMenu: config.interactions?.contextMenu || false,
                keyboard: config.interactions?.keyboard !== false,
                swipeActions: config.interactions?.swipeActions || [],
                longPress: config.interactions?.longPress || false,
                ...config.interactions
            },
            
            // ========== FILTRAGE ET RECHERCHE ==========
            showSearch: config.showSearch || false,
            searchPlaceholder: config.searchPlaceholder || 'Rechercher...',
            searchFields: config.searchFields || ['title', 'description', 'tags'],
            searchDebounce: config.searchDebounce || 300,
            
            showFilters: config.showFilters || false,
            filterCategories: config.filterCategories || [],
            activeFilters: config.activeFilters || [],
            filterLogic: config.filterLogic || 'AND', // AND, OR
            
            // ========== TRI ==========
            sortable: config.sortable || false,
            sortBy: config.sortBy || 'order', // order, title, date, custom
            sortOrder: config.sortOrder || 'asc',
            sortFunction: config.sortFunction || null,
            
            // ========== PAGINATION ==========
            pagination: {
                enabled: config.pagination?.enabled || false,
                itemsPerPage: config.pagination?.itemsPerPage || 12,
                currentPage: config.pagination?.currentPage || 1,
                showInfo: config.pagination?.showInfo !== false,
                showControls: config.pagination?.showControls !== false,
                position: config.pagination?.position || 'bottom', // top, bottom, both
                ...config.pagination
            },
            
            // ========== VIRTUALISATION ==========
            virtualization: {
                enabled: config.virtualization?.enabled || false,
                buffer: config.virtualization?.buffer || 5,
                height: config.virtualization?.height || 400,
                ...config.virtualization
            },
            
            // ========== CALLBACKS ==========
            // Cycle de vie
            onBeforeRender: config.onBeforeRender || null,
            onAfterRender: config.onAfterRender || null,
            onBeforeUpdate: config.onBeforeUpdate || null,
            onAfterUpdate: config.onAfterUpdate || null,
            
            // Interactions
            onCardClick: config.onCardClick || null,
            onCardDoubleClick: config.onCardDoubleClick || null,
            onCardHover: config.onCardHover || null,
            onCardSelect: config.onCardSelect || null,
            onCardExpand: config.onCardExpand || null,
            onCardCollapse: config.onCardCollapse || null,
            onCardEdit: config.onCardEdit || null,
            onCardDelete: config.onCardDelete || null,
            
            // Organisation
            onSearch: config.onSearch || null,
            onFilter: config.onFilter || null,
            onSort: config.onSort || null,
            onGroup: config.onGroup || null,
            onPageChange: config.onPageChange || null,
            
            // Drag & Drop
            onDragStart: config.onDragStart || null,
            onDragEnd: config.onDragEnd || null,
            onDrop: config.onDrop || null,
            onReorder: config.onReorder || null,
            
            // État
            onStateChange: config.onStateChange || null,
            onSelectionChange: config.onSelectionChange || null,
            
            // ========== PERMISSIONS ==========
            checkPermissions: config.checkPermissions !== false,
            userPermissions: config.userPermissions || this.getUserPermissions(),
            
            // ========== OPTIONS AVANCÉES ==========
            lazyLoad: config.lazyLoad || false,
            autoRefresh: config.autoRefresh || false,
            refreshInterval: config.refreshInterval || 30000,
            cache: config.cache !== false,
            cacheTimeout: config.cacheTimeout || 300000,
            
            // Messages
            emptyMessage: config.emptyMessage || 'Aucune carte disponible',
            loadingMessage: config.loadingMessage || 'Chargement...',
            errorMessage: config.errorMessage || 'Erreur de chargement',
            
            // Debug
            debug: config.debug || false
        };
        
        // État interne
        this.state = {
            initialized: false,
            loading: false,
            error: null,
            searchQuery: '',
            activeFilters: [...this.config.activeFilters],
            selectedCards: new Set(),
            expandedCards: new Set(),
            editingCards: new Set(),
            hoveredCard: null,
            focusedCard: null,
            draggedCard: null,
            groups: new Map(),
            visibleCards: [],
            currentPage: this.config.pagination.currentPage,
            totalPages: 1,
            cache: new Map(),
            lastUpdate: Date.now()
        };
        
        // Références DOM
        this.elements = {
            container: null,
            wrapper: null,
            header: null,
            searchBox: null,
            filterBar: null,
            grid: null,
            cards: new Map(),
            groups: new Map(),
            pagination: null
        };
        
        // Timers
        this.timers = {
            search: null,
            refresh: null,
            cache: null
        };
        
        // Initialisation
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        try {
            this.log('🎴 Initialisation MenuCardsWidget', this.config);
            
            // Trouver le container
            this.elements.container = this.getContainer();
            if (!this.elements.container) {
                throw new Error('Container non trouvé');
            }
            
            // Charger les styles
            this.loadStyles();
            
            // Lifecycle: avant rendu
            this.trigger('onBeforeRender');
            
            // Créer la structure
            this.render();
            
            // Initialiser les interactions
            if (this.config.interactions.draggable) {
                this.initDragAndDrop();
            }
            
            if (this.config.interactions.keyboard) {
                this.initKeyboardNavigation();
            }
            
            // Appliquer les filtres initiaux
            this.applyFilters();
            
            // Animations d'entrée
            if (this.config.animated) {
                this.animateCards();
            }
            
            // Auto-refresh
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            // Lifecycle: après rendu
            this.trigger('onAfterRender');
            
            // Marquer comme initialisé
            this.state.initialized = true;
            
            this.log('✅ MenuCardsWidget initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation MenuCardsWidget:', error);
            this.state.error = error.message;
            this.showError();
        }
    }
    
    getContainer() {
        if (typeof this.config.container === 'string') {
            return document.querySelector(this.config.container);
        }
        return this.config.container;
    }
    
    loadStyles() {
        if (document.getElementById('menu-cards-widget-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'menu-cards-widget-styles';
        link.rel = 'stylesheet';
        link.href = '/widgets/menu-cards/menu-cards.widget.css';
        document.head.appendChild(link);
    }
    
    // ========================================
    // PERMISSIONS
    // ========================================
    
    getUserPermissions() {
        try {
            const perms = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
            return {
                autorisations: perms.autorisations || {},
                groupes: perms.groupes || []
            };
        } catch {
            return { autorisations: {}, groupes: [] };
        }
    }
    
    checkCardPermission(card) {
        if (!this.config.checkPermissions) return true;
        
        if (!card.permissions || card.permissions.length === 0) {
            if (card.requiresAdmin) {
                return this.config.userPermissions.groupes.includes('admin_general');
            }
            return true;
        }
        
        return card.permissions.some(perm => {
            const [module, action] = perm.split('.');
            return this.config.userPermissions.autorisations?.[module]?.[action] !== false;
        });
    }
    
    // ========================================
    // RENDU PRINCIPAL
    // ========================================
    
    render() {
        this.elements.container.innerHTML = '';
        
        if (this.config.showWrapper) {
            this.renderWrapper();
        }
        
        if (this.config.showSearch || this.config.showFilters) {
            this.renderHeader();
        }
        
        this.renderGrid();
        
        if (this.config.pagination.enabled) {
            this.renderPagination();
        }
    }
    
    renderWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = `mcw-wrapper mcw-wrapper-${this.config.wrapperStyle}`;
        
        if (this.config.wrapperTitle || this.config.wrapperActions.length > 0) {
            const header = document.createElement('div');
            header.className = 'mcw-wrapper-header';
            
            if (this.config.wrapperTitle) {
                header.innerHTML = `
                    <div class="mcw-wrapper-titles">
                        <h2 class="mcw-wrapper-title">${this.config.wrapperTitle}</h2>
                        ${this.config.wrapperSubtitle ? 
                            `<p class="mcw-wrapper-subtitle">${this.config.wrapperSubtitle}</p>` : ''}
                    </div>
                `;
            }
            
            if (this.config.wrapperActions.length > 0) {
                const actions = document.createElement('div');
                actions.className = 'mcw-wrapper-actions';
                
                this.config.wrapperActions.forEach(action => {
                    const btn = document.createElement('button');
                    btn.className = `mcw-action-btn ${action.class || ''}`;
                    btn.innerHTML = action.icon ? `${action.icon} ${action.text || ''}` : action.text;
                    btn.onclick = action.onClick;
                    actions.appendChild(btn);
                });
                
                header.appendChild(actions);
            }
            
            wrapper.appendChild(header);
        }
        
        this.elements.wrapper = wrapper;
        this.elements.container.appendChild(wrapper);
    }
    
    renderHeader() {
        const header = document.createElement('div');
        header.className = 'mcw-header';
        
        if (this.config.showSearch) {
            const searchBox = document.createElement('div');
            searchBox.className = 'mcw-search';
            searchBox.innerHTML = `
                <input type="text" 
                       class="mcw-search-input" 
                       placeholder="${this.config.searchPlaceholder}">
                <span class="mcw-search-icon">🔍</span>
            `;
            header.appendChild(searchBox);
            this.elements.searchBox = searchBox;
        }
        
        if (this.config.showFilters && this.config.filterCategories.length > 0) {
            const filterBar = document.createElement('div');
            filterBar.className = 'mcw-filters';
            filterBar.innerHTML = `
                <button class="mcw-filter-btn mcw-filter-active" data-filter="all">
                    Tous
                </button>
                ${this.config.filterCategories.map(cat => `
                    <button class="mcw-filter-btn" data-filter="${cat.value}">
                        ${cat.label}
                    </button>
                `).join('')}
            `;
            header.appendChild(filterBar);
            this.elements.filterBar = filterBar;
        }
        
        this.elements.header = header;
        const target = this.elements.wrapper || this.elements.container;
        target.appendChild(header);
        
        this.attachHeaderEvents();
    }
    
    renderGrid() {
        const grid = document.createElement('div');
        grid.className = this.buildGridClasses();
        
        // Appliquer les styles de grille responsive
        this.applyGridStyles(grid);
        
        this.elements.grid = grid;
        const target = this.elements.wrapper || this.elements.container;
        target.appendChild(grid);
        
        this.renderCards();
    }
    
    buildGridClasses() {
        const classes = ['mcw-grid'];
        classes.push(`mcw-layout-${this.config.layout}`);
        classes.push(`mcw-theme-${this.config.theme}`);
        classes.push(`mcw-card-layout-${this.config.cardLayout}`);
        
        if (this.config.interactions.draggable) {
            classes.push('mcw-draggable');
        }
        
        if (this.config.virtualization.enabled) {
            classes.push('mcw-virtualized');
        }
        
        return classes.join(' ');
    }
    
    applyGridStyles(grid) {
        const { type, columns, gap } = this.config.gridLayout;
        
        if (type === 'grid') {
            // Créer les media queries pour les breakpoints
            const style = document.createElement('style');
            style.textContent = `
                .mcw-grid {
                    display: grid;
                    gap: ${gap.y}px ${gap.x}px;
                }
                @media (min-width: 0px) {
                    .mcw-grid { grid-template-columns: repeat(${columns.xs}, 1fr); }
                }
                @media (min-width: 576px) {
                    .mcw-grid { grid-template-columns: repeat(${columns.sm}, 1fr); }
                }
                @media (min-width: 768px) {
                    .mcw-grid { grid-template-columns: repeat(${columns.md}, 1fr); }
                }
                @media (min-width: 992px) {
                    .mcw-grid { grid-template-columns: repeat(${columns.lg}, 1fr); }
                }
                @media (min-width: 1200px) {
                    .mcw-grid { grid-template-columns: repeat(${columns.xl}, 1fr); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // ========================================
    // RENDU DES CARTES
    // ========================================
    
    renderCards() {
        this.elements.grid.innerHTML = '';
        this.elements.cards.clear();
        
        // Filtrer et organiser les cartes
        const cards = this.getOrganizedCards();
        
        if (cards.length === 0) {
            this.showEmptyMessage();
            return;
        }
        
        // Si groupement activé
        if (this.config.groupBy) {
            this.renderGroupedCards(cards);
        } else {
            this.renderFlatCards(cards);
        }
        
        this.state.visibleCards = cards;
    }
    
    getOrganizedCards() {
        let cards = [...this.config.cards];
        
        // Vérifier les permissions
        if (this.config.checkPermissions) {
            cards = cards.filter(card => this.checkCardPermission(card));
        }
        
        // Filtrer par recherche
        if (this.state.searchQuery) {
            cards = this.filterBySearch(cards, this.state.searchQuery);
        }
        
        // Filtrer par catégories
        if (this.state.activeFilters.length > 0 && !this.state.activeFilters.includes('all')) {
            cards = this.filterByCategories(cards, this.state.activeFilters);
        }
        
        // Trier
        if (this.config.sortable) {
            cards = this.sortCards(cards);
        }
        
        // Paginer
        if (this.config.pagination.enabled) {
            cards = this.paginateCards(cards);
        }
        
        return cards;
    }
    
    filterBySearch(cards, query) {
        const q = query.toLowerCase();
        return cards.filter(card => {
            for (const field of this.config.searchFields) {
                const value = this.getNestedValue(card, field);
                if (value && String(value).toLowerCase().includes(q)) {
                    return true;
                }
            }
            return false;
        });
    }
    
    filterByCategories(cards, categories) {
        if (this.config.filterLogic === 'OR') {
            return cards.filter(card => 
                categories.some(cat => card.category === cat)
            );
        } else {
            return cards.filter(card => 
                categories.every(cat => card.category === cat)
            );
        }
    }
    
    sortCards(cards) {
        const { sortBy, sortOrder, sortFunction } = this.config;
        
        if (sortFunction) {
            return cards.sort(sortFunction);
        }
        
        return cards.sort((a, b) => {
            let aVal = this.getNestedValue(a, sortBy);
            let bVal = this.getNestedValue(b, sortBy);
            
            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }
    
    paginateCards(cards) {
        const { itemsPerPage } = this.config.pagination;
        const start = (this.state.currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        
        this.state.totalPages = Math.ceil(cards.length / itemsPerPage);
        
        return cards.slice(start, end);
    }
    
    renderFlatCards(cards) {
        cards.forEach((card, index) => {
            const cardElement = this.createCard(card, index);
            this.elements.grid.appendChild(cardElement);
            this.elements.cards.set(card.id, cardElement);
        });
    }
    
    renderGroupedCards(cards) {
        const groups = this.groupCards(cards);
        
        groups.forEach((groupCards, groupName) => {
            const groupElement = this.createGroup(groupName, groupCards);
            this.elements.grid.appendChild(groupElement);
            this.elements.groups.set(groupName, groupElement);
            
            groupCards.forEach((card, index) => {
                const cardElement = this.createCard(card, index);
                groupElement.querySelector('.mcw-group-content').appendChild(cardElement);
                this.elements.cards.set(card.id, cardElement);
            });
        });
    }
    
    groupCards(cards) {
        const groups = new Map();
        
        cards.forEach(card => {
            let groupKey;
            
            if (typeof this.config.groupBy === 'function') {
                groupKey = this.config.groupBy(card);
            } else {
                groupKey = this.getNestedValue(card, this.config.groupBy) || 'Autres';
            }
            
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(card);
        });
        
        // Trier les groupes
        const sortedGroups = new Map([...groups.entries()].sort((a, b) => {
            if (this.config.groupSort === 'asc') {
                return a[0] > b[0] ? 1 : -1;
            } else {
                return a[0] < b[0] ? 1 : -1;
            }
        }));
        
        this.state.groups = sortedGroups;
        return sortedGroups;
    }
    
    createGroup(name, cards) {
        const group = document.createElement('div');
        group.className = 'mcw-group';
        group.dataset.group = name;
        
        const isCollapsed = this.state.collapsedGroups?.has(name);
        
        group.innerHTML = `
            <div class="mcw-group-header ${this.config.collapsibleGroups ? 'mcw-group-collapsible' : ''}">
                ${this.config.collapsibleGroups ? 
                    `<span class="mcw-group-toggle">${isCollapsed ? '▶' : '▼'}</span>` : ''}
                <h3 class="mcw-group-title">${name}</h3>
                <span class="mcw-group-count">${cards.length}</span>
            </div>
            <div class="mcw-group-content ${isCollapsed ? 'mcw-collapsed' : ''}"></div>
        `;
        
        if (this.config.collapsibleGroups) {
            const header = group.querySelector('.mcw-group-header');
            header.addEventListener('click', () => this.toggleGroup(name));
        }
        
        return group;
    }
    
    // ========================================
    // CRÉATION DE CARTE
    // ========================================
    
    createCard(card, index) {
        const cardEl = document.createElement(card.href && !card.disabled ? 'a' : 'div');
        cardEl.className = this.buildCardClasses(card);
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.index = index;
        
        if (card.href && !card.disabled) {
            cardEl.href = card.href;
            if (card.target) cardEl.target = card.target;
        }
        
        // Appliquer les styles custom
        if (card.style) {
            Object.assign(cardEl.style, card.style);
        }
        
        // Taille custom
        if (card.width) cardEl.style.width = card.width;
        if (card.height) cardEl.style.minHeight = card.height;
        
        // Créer le contenu selon le layout
        const layout = card.layout || this.config.cardLayout;
        
        switch (layout) {
            case 'horizontal':
                cardEl.innerHTML = this.createHorizontalLayout(card);
                break;
            case 'split':
                cardEl.innerHTML = this.createSplitLayout(card);
                break;
            case 'compact':
                cardEl.innerHTML = this.createCompactLayout(card);
                break;
            case 'expanded':
                cardEl.innerHTML = this.createExpandedLayout(card);
                break;
            default:
                cardEl.innerHTML = this.createVerticalLayout(card);
        }
        
        // Ajouter les enfants si expandable
        if (card.expandable && card.children?.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = `mcw-card-children ${card.defaultExpanded ? '' : 'mcw-collapsed'}`;
            
            card.children.forEach((child, childIndex) => {
                const childCard = { ...child, level: (card.level || 0) + 1 };
                const childElement = this.createCard(childCard, childIndex);
                childrenContainer.appendChild(childElement);
            });
            
            cardEl.appendChild(childrenContainer);
        }
        
        // Attacher les événements
        this.attachCardEvents(cardEl, card);
        
        return cardEl;
    }
    
    buildCardClasses(card) {
        const classes = ['mcw-card'];
        
        if (this.config.animated) classes.push('mcw-animated');
        if (card.disabled) classes.push('mcw-card-disabled');
        if (card.locked) classes.push('mcw-card-locked');
        if (card.selectable) classes.push('mcw-card-selectable');
        if (card.draggable && this.config.interactions.draggable) classes.push('mcw-card-draggable');
        if (card.editable && this.config.interactions.editable) classes.push('mcw-card-editable');
        if (card.expandable) classes.push('mcw-card-expandable');
        if (card.size) classes.push(`mcw-card-${card.size}`);
        if (card.level) classes.push(`mcw-card-level-${card.level}`);
        if (card.className) classes.push(card.className);
        
        // État
        if (this.state.selectedCards.has(card.id)) classes.push('mcw-card-selected');
        if (this.state.expandedCards.has(card.id)) classes.push('mcw-card-expanded');
        if (this.state.editingCards.has(card.id)) classes.push('mcw-card-editing');
        
        return classes.join(' ');
    }
    
    // ========================================
    // LAYOUTS DE CARTE
    // ========================================
    
    createVerticalLayout(card) {
        let html = '';
        
        // Header
        if (card.header) {
            html += this.createCardHeader(card.header, card);
        }
        
        // Body
        html += '<div class="mcw-card-body">';
        
        if (card.icon || card.header?.icon) {
            html += this.createCardIcon(card.icon || card.header.icon, card.iconType || card.header?.iconType);
        }
        
        if (card.title || card.body?.title) {
            html += `<h3 class="mcw-card-title">${card.title || card.body.title}</h3>`;
        }
        
        if (card.subtitle || card.body?.subtitle) {
            html += `<p class="mcw-card-subtitle">${card.subtitle || card.body.subtitle}</p>`;
        }
        
        if (card.description || card.body?.description) {
            html += `<p class="mcw-card-description">${card.description || card.body.description}</p>`;
        }
        
        if (card.body?.tags) {
            html += this.createCardTags(card.body.tags);
        }
        
        if (card.body?.content) {
            html += this.createCardContent(card.body.content);
        }
        
        if (card.stats) {
            html += this.createCardStats(card.stats);
        }
        
        html += '</div>';
        
        // Footer
        if (card.footer) {
            html += this.createCardFooter(card.footer);
        }
        
        return html;
    }
    
    createHorizontalLayout(card) {
        let html = '<div class="mcw-card-horizontal">';
        
        // Partie gauche
        html += '<div class="mcw-card-left">';
        if (card.icon || card.header?.icon) {
            html += this.createCardIcon(card.icon || card.header.icon, card.iconType || card.header?.iconType);
        }
        html += '</div>';
        
        // Partie droite
        html += '<div class="mcw-card-right">';
        
        if (card.badge || card.header?.badge) {
            html += this.createCardBadge(card.badge || card.header.badge);
        }
        
        if (card.title || card.body?.title) {
            html += `<h3 class="mcw-card-title">${card.title || card.body.title}</h3>`;
        }
        
        if (card.description || card.body?.description) {
            html += `<p class="mcw-card-description">${card.description || card.body.description}</p>`;
        }
        
        if (card.stats) {
            html += this.createCardStats(card.stats);
        }
        
        html += '</div>';
        html += '</div>';
        
        return html;
    }
    
    createSplitLayout(card) {
        let html = '<div class="mcw-card-split">';
        
        // Partie gauche
        html += '<div class="mcw-card-split-left">';
        
        if (card.left) {
            if (card.left.icon) {
                html += this.createCardIcon(card.left.icon, card.left.iconType);
            }
            if (card.left.title) {
                html += `<h3 class="mcw-card-title">${card.left.title}</h3>`;
            }
            if (card.left.description) {
                html += `<p class="mcw-card-description">${card.left.description}</p>`;
            }
            if (card.left.tags) {
                html += this.createCardTags(card.left.tags);
            }
        }
        
        html += '</div>';
        
        // Partie droite
        html += '<div class="mcw-card-split-right">';
        
        if (card.right) {
            if (card.right.stats) {
                html += this.createCardStats(card.right.stats);
            }
            if (card.right.progress) {
                html += this.createCardProgress(card.right.progress);
            }
            if (card.right.chart) {
                html += this.createCardChart(card.right.chart);
            }
        }
        
        html += '</div>';
        html += '</div>';
        
        // Footer
        if (card.footer) {
            html += this.createCardFooter(card.footer);
        }
        
        return html;
    }
    
    createCompactLayout(card) {
        let html = '<div class="mcw-card-compact">';
        
        if (card.icon || card.header?.icon) {
            html += this.createCardIcon(card.icon || card.header.icon, card.iconType || card.header?.iconType);
        }
        
        html += '<div class="mcw-card-compact-content">';
        
        if (card.title) {
            html += `<span class="mcw-card-title">${card.title}</span>`;
        }
        
        if (card.badge || card.header?.badge) {
            html += this.createCardBadge(card.badge || card.header.badge);
        }
        
        html += '</div>';
        
        if (card.stats?.primary) {
            html += `<div class="mcw-card-compact-value">${card.stats.primary.value}</div>`;
        }
        
        html += '</div>';
        
        return html;
    }
    
    createExpandedLayout(card) {
        let html = '';
        
        // Header avec background
        if (card.header) {
            html += this.createCardHeader(card.header, card);
        }
        
        // Body avec sections
        html += '<div class="mcw-card-expanded-body">';
        
        // Section principale
        html += '<div class="mcw-card-main-section">';
        
        if (card.title || card.body?.title) {
            html += `<h2 class="mcw-card-title-large">${card.title || card.body.title}</h2>`;
        }
        
        if (card.subtitle || card.body?.subtitle) {
            html += `<p class="mcw-card-subtitle">${card.subtitle || card.body.subtitle}</p>`;
        }
        
        if (card.body?.tags) {
            html += this.createCardTags(card.body.tags);
        }
        
        if (card.description || card.body?.description) {
            html += `<div class="mcw-card-description-expanded">${card.description || card.body.description}</div>`;
        }
        
        html += '</div>';
        
        // Section stats
        if (card.stats) {
            html += '<div class="mcw-card-stats-section">';
            html += this.createCardStats(card.stats, true);
            html += '</div>';
        }
        
        // Section contenu custom
        if (card.body?.content) {
            html += '<div class="mcw-card-content-section">';
            html += this.createCardContent(card.body.content);
            html += '</div>';
        }
        
        html += '</div>';
        
        // Footer étendu
        if (card.footer) {
            html += this.createCardFooter(card.footer, true);
        }
        
        return html;
    }
    
    // ========================================
    // COMPOSANTS DE CARTE
    // ========================================
    
    createCardHeader(header, card) {
        let html = '<div class="mcw-card-header"';
        
        if (header.background) {
            if (header.background.startsWith('url')) {
                html += ` style="background-image: ${header.background};"`;
            } else if (header.background.includes('gradient')) {
                html += ` style="background: ${header.background};"`;
            } else {
                html += ` style="background-color: ${header.background};"`;
            }
        }
        
        html += '>';
        
        if (header.badge) {
            html += this.createCardBadge(header.badge);
        }
        
        if (header.menu) {
            html += this.createCardMenu(header.menu, card.id);
        }
        
        if (card.expandable) {
            const isExpanded = this.state.expandedCards.has(card.id) || card.defaultExpanded;
            html += `<button class="mcw-card-expand-btn" data-card-id="${card.id}">
                ${isExpanded ? '▼' : '▶'}
            </button>`;
        }
        
        html += '</div>';
        
        return html;
    }
    
    createCardIcon(icon, type) {
        if (!icon) return '';
        
        const iconType = type || (icon.includes('<svg') ? 'svg' : 'emoji');
        
        if (iconType === 'image') {
            return `<img src="${icon}" alt="" class="mcw-card-icon mcw-icon-image">`;
        } else if (iconType === 'svg') {
            return `<div class="mcw-card-icon mcw-icon-svg">${icon}</div>`;
        } else {
            return `<span class="mcw-card-icon mcw-icon-emoji">${icon}</span>`;
        }
    }
    
    createCardBadge(badge) {
        if (!badge) return '';
        
        const position = badge.position || 'top-right';
        const type = badge.type || 'primary';
        
        return `<span class="mcw-badge mcw-badge-${type} mcw-badge-${position}">
            ${badge.text}
        </span>`;
    }
    
    createCardMenu(menuItems, cardId) {
        let html = `<div class="mcw-card-menu">
            <button class="mcw-card-menu-btn" data-card-id="${cardId}">⋮</button>
            <div class="mcw-card-menu-dropdown">`;
        
        menuItems.forEach(item => {
            if (item.separator) {
                html += '<div class="mcw-menu-separator"></div>';
            } else {
                html += `<a href="#" class="mcw-menu-item" data-action="${item.action}">
                    ${item.icon || ''} ${item.label}
                </a>`;
            }
        });
        
        html += '</div></div>';
        
        return html;
    }
    
    createCardTags(tags) {
        if (!tags || tags.length === 0) return '';
        
        let html = '<div class="mcw-card-tags">';
        
        tags.forEach(tag => {
            const tagText = typeof tag === 'string' ? tag : tag.text;
            const tagColor = typeof tag === 'object' ? tag.color : 'default';
            
            html += `<span class="mcw-tag mcw-tag-${tagColor}">${tagText}</span>`;
        });
        
        html += '</div>';
        
        return html;
    }
    
    createCardStats(stats, expanded = false) {
        let html = `<div class="mcw-card-stats ${expanded ? 'mcw-stats-expanded' : ''}">`;
        
        if (stats.primary) {
            html += `<div class="mcw-stat mcw-stat-primary">
                <span class="mcw-stat-value">${stats.primary.value}</span>
                <span class="mcw-stat-label">${stats.primary.label}</span>
                ${stats.primary.trend ? 
                    `<span class="mcw-stat-trend mcw-trend-${stats.primary.trend}">
                        ${stats.primary.trend === 'up' ? '↑' : '↓'}
                    </span>` : ''}
            </div>`;
        }
        
        if (stats.secondary) {
            html += `<div class="mcw-stat mcw-stat-secondary">
                <span class="mcw-stat-value">${stats.secondary.value}</span>
                <span class="mcw-stat-label">${stats.secondary.label}</span>
            </div>`;
        }
        
        if (stats.progress) {
            html += this.createCardProgress(stats.progress);
        }
        
        if (stats.chart) {
            html += this.createCardChart(stats.chart);
        }
        
        html += '</div>';
        
        return html;
    }
    
    createCardProgress(progress) {
        const color = progress.color || 'primary';
        const value = Math.min(100, Math.max(0, progress.value));
        
        return `<div class="mcw-progress">
            ${progress.label ? `<div class="mcw-progress-label">${progress.label}</div>` : ''}
            <div class="mcw-progress-bar">
                <div class="mcw-progress-fill mcw-progress-${color}" style="width: ${value}%"></div>
            </div>
            ${progress.showValue !== false ? 
                `<div class="mcw-progress-value">${value}%</div>` : ''}
        </div>`;
    }
    
    createCardChart(chart) {
        if (chart.sparkline) {
            return `<div class="mcw-sparkline" data-values="${chart.data.join(',')}"></div>`;
        }
        
        return `<div class="mcw-chart mcw-chart-${chart.type}" 
                     data-chart='${JSON.stringify(chart)}'>
            <!-- Chart will be rendered here -->
        </div>`;
    }
    
    createCardContent(content) {
        if (typeof content === 'string') {
            return `<div class="mcw-card-content">${content}</div>`;
        }
        
        if (content.type === 'list') {
            return this.createCardList(content.data);
        }
        
        if (content.type === 'table') {
            return this.createCardTable(content.data);
        }
        
        if (content.type === 'html') {
            return `<div class="mcw-card-html">${content.data}</div>`;
        }
        
        return '';
    }
    
    createCardList(items) {
        let html = '<ul class="mcw-card-list">';
        
        items.forEach(item => {
            html += `<li class="mcw-list-item">
                ${item.icon ? `<span class="mcw-list-icon">${item.icon}</span>` : ''}
                <span class="mcw-list-text">${item.text || item}</span>
                ${item.value ? `<span class="mcw-list-value">${item.value}</span>` : ''}
            </li>`;
        });
        
        html += '</ul>';
        
        return html;
    }
    
    createCardTable(data) {
        let html = '<table class="mcw-card-table">';
        
        if (data.headers) {
            html += '<thead><tr>';
            data.headers.forEach(header => {
                html += `<th>${header}</th>`;
            });
            html += '</tr></thead>';
        }
        
        html += '<tbody>';
        data.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${cell}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table>';
        
        return html;
    }
    
    createCardFooter(footer, expanded = false) {
        let html = `<div class="mcw-card-footer ${expanded ? 'mcw-footer-expanded' : ''}">`;
        
        if (footer.buttons) {
            html += '<div class="mcw-footer-buttons">';
            footer.buttons.forEach(btn => {
                const btnType = btn.type || 'default';
                html += `<button class="mcw-btn mcw-btn-${btnType}" 
                                 data-action="${btn.action || ''}">
                    ${btn.icon || ''} ${btn.text}
                </button>`;
            });
            html += '</div>';
        }
        
        if (footer.links) {
            html += '<div class="mcw-footer-links">';
            footer.links.forEach(link => {
                html += `<a href="${link.href}" class="mcw-footer-link" 
                            ${link.target ? `target="${link.target}"` : ''}>
                    ${link.text}
                </a>`;
            });
            html += '</div>';
        }
        
        if (footer.meta) {
            html += `<div class="mcw-footer-meta">${footer.meta}</div>`;
        }
        
        html += '</div>';
        
        return html;
    }
    
    // ========================================
    // MESSAGES D'ÉTAT
    // ========================================
    
    showEmptyMessage() {
        this.elements.grid.innerHTML = `
            <div class="mcw-empty">
                <span class="mcw-empty-icon">📭</span>
                <p class="mcw-empty-message">${this.config.emptyMessage}</p>
            </div>
        `;
    }
    
    showError() {
        this.elements.container.innerHTML = `
            <div class="mcw-error">
                <span class="mcw-error-icon">⚠️</span>
                <p class="mcw-error-message">${this.state.error || this.config.errorMessage}</p>
            </div>
        `;
    }
    
    showLoading() {
        this.elements.grid.innerHTML = `
            <div class="mcw-loading">
                <div class="mcw-loading-spinner"></div>
                <p class="mcw-loading-message">${this.config.loadingMessage}</p>
            </div>
        `;
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachHeaderEvents() {
        // Recherche
        if (this.elements.searchBox) {
            const input = this.elements.searchBox.querySelector('.mcw-search-input');
            if (input) {
                input.addEventListener('input', (e) => {
                    clearTimeout(this.timers.search);
                    this.timers.search = setTimeout(() => {
                        this.state.searchQuery = e.target.value;
                        this.applyFilters();
                        this.trigger('onSearch', e.target.value);
                    }, this.config.searchDebounce);
                });
            }
        }
        
        // Filtres
        if (this.elements.filterBar) {
            this.elements.filterBar.querySelectorAll('.mcw-filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filter = e.target.dataset.filter;
                    
                    // Toggle active class
                    this.elements.filterBar.querySelectorAll('.mcw-filter-btn').forEach(b => {
                        b.classList.remove('mcw-filter-active');
                    });
                    e.target.classList.add('mcw-filter-active');
                    
                    // Appliquer le filtre
                    this.state.activeFilters = filter === 'all' ? [] : [filter];
                    this.applyFilters();
                    this.trigger('onFilter', filter);
                });
            });
        }
    }
    
    attachCardEvents(cardEl, card) {
        // Click
        cardEl.addEventListener('click', (e) => {
            // Empêcher si disabled
            if (card.disabled || card.locked) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Gérer les éléments interactifs
            if (e.target.closest('.mcw-card-menu-btn')) {
                e.preventDefault();
                this.toggleCardMenu(card.id);
                return;
            }
            
            if (e.target.closest('.mcw-card-expand-btn')) {
                e.preventDefault();
                this.toggleCardExpansion(card.id);
                return;
            }
            
            if (e.target.closest('.mcw-menu-item')) {
                e.preventDefault();
                const action = e.target.dataset.action;
                this.handleCardAction(card, action);
                return;
            }
            
            if (e.target.closest('.mcw-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.mcw-btn');
                const action = btn.dataset.action;
                if (card.footer?.buttons) {
                    const button = card.footer.buttons.find(b => b.action === action);
                    if (button?.onClick) {
                        button.onClick(card, e);
                    }
                }
                return;
            }
            
            // Selection
            if (this.config.interactions.selectable && (e.ctrlKey || e.metaKey || e.shiftKey)) {
                e.preventDefault();
                this.toggleCardSelection(card.id, e.shiftKey);
                return;
            }
            
            // Callback onClick
            if (card.onClick) {
                e.preventDefault();
                card.onClick(card, e);
            }
            
            this.trigger('onCardClick', card, e);
        });
        
        // Double click
        cardEl.addEventListener('dblclick', (e) => {
            if (card.disabled || card.locked) return;
            
            if (this.config.interactions.editable) {
                this.editCard(card.id);
            }
            
            this.trigger('onCardDoubleClick', card, e);
        });
        
        // Hover
        cardEl.addEventListener('mouseenter', (e) => {
            this.state.hoveredCard = card.id;
            this.trigger('onCardHover', card, 'enter', e);
        });
        
        cardEl.addEventListener('mouseleave', (e) => {
            this.state.hoveredCard = null;
            this.trigger('onCardHover', card, 'leave', e);
        });
        
        // Context menu
        if (this.config.interactions.contextMenu) {
            cardEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(card, e);
            });
        }
        
        // Long press (mobile)
        if (this.config.interactions.longPress) {
            let pressTimer;
            
            cardEl.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.handleLongPress(card, e);
                }, 500);
            });
            
            cardEl.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            
            cardEl.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
            });
        }
    }
    
    // ========================================
    // DRAG & DROP
    // ========================================
    
    initDragAndDrop() {
        this.elements.grid.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.mcw-card-draggable');
            if (!card) return;
            
            const cardId = card.dataset.cardId;
            const cardData = this.config.cards.find(c => c.id === cardId);
            
            if (!cardData || cardData.locked) return;
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', cardId);
            
            card.classList.add('mcw-dragging');
            this.state.draggedCard = cardId;
            
            this.trigger('onDragStart', cardData, e);
        });
        
        this.elements.grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(e.clientY);
            const dragging = this.elements.grid.querySelector('.mcw-dragging');
            
            if (afterElement == null) {
                this.elements.grid.appendChild(dragging);
            } else {
                this.elements.grid.insertBefore(dragging, afterElement);
            }
        });
        
        this.elements.grid.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const cardId = e.dataTransfer.getData('text/plain');
            const card = this.elements.cards.get(cardId);
            
            if (card) {
                card.classList.remove('mcw-dragging');
            }
            
            this.reorderCards();
            this.trigger('onDrop', cardId, e);
        });
        
        this.elements.grid.addEventListener('dragend', (e) => {
            const card = e.target.closest('.mcw-card');
            if (card) {
                card.classList.remove('mcw-dragging');
            }
            
            this.state.draggedCard = null;
            this.trigger('onDragEnd', e);
        });
    }
    
    getDragAfterElement(y) {
        const draggableElements = [...this.elements.grid.querySelectorAll('.mcw-card:not(.mcw-dragging)')];
        
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
    
    reorderCards() {
        const newOrder = [];
        
        this.elements.grid.querySelectorAll('.mcw-card').forEach(card => {
            const cardId = card.dataset.cardId;
            const cardData = this.config.cards.find(c => c.id === cardId);
            if (cardData) {
                newOrder.push(cardData);
            }
        });
        
        this.config.cards = newOrder;
        this.trigger('onReorder', newOrder);
    }
    
    // ========================================
    // NAVIGATION CLAVIER
    // ========================================
    
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.state.initialized) return;
            
            // Navigation avec flèches
            if (e.key.startsWith('Arrow')) {
                this.handleArrowNavigation(e);
            }
            
            // Enter/Space pour activer
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.state.focusedCard) {
                    const card = this.config.cards.find(c => c.id === this.state.focusedCard);
                    if (card) {
                        this.trigger('onCardClick', card, e);
                    }
                }
            }
            
            // Escape pour désélectionner
            if (e.key === 'Escape') {
                this.clearSelection();
                this.state.focusedCard = null;
            }
            
            // Delete pour supprimer
            if (e.key === 'Delete' && this.config.interactions.editable) {
                this.deleteSelectedCards();
            }
        });
    }
    
    handleArrowNavigation(e) {
        const cards = Array.from(this.elements.cards.keys());
        if (cards.length === 0) return;
        
        let currentIndex = cards.indexOf(this.state.focusedCard);
        if (currentIndex === -1) currentIndex = 0;
        
        const columns = this.getGridColumns();
        let newIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowRight':
                newIndex = Math.min(currentIndex + 1, cards.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(currentIndex + columns, cards.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - columns, 0);
                break;
        }
        
        if (newIndex !== currentIndex) {
            e.preventDefault();
            this.focusCard(cards[newIndex]);
        }
    }
    
    getGridColumns() {
        const gridStyle = window.getComputedStyle(this.elements.grid);
        const columns = gridStyle.getPropertyValue('grid-template-columns');
        return columns ? columns.split(' ').length : 1;
    }
    
    // ========================================
    // ANIMATIONS
    // ========================================
    
    animateCards() {
        const cards = this.elements.grid.querySelectorAll('.mcw-card');
        
        cards.forEach((card, index) => {
            card.classList.remove('mcw-animated');
            void card.offsetWidth; // Force reflow
            
            setTimeout(() => {
                card.style.animationDelay = `${index * this.config.animationDelay}ms`;
                card.classList.add('mcw-animated', `mcw-animate-${this.config.animationType}`);
            }, 10);
        });
        
        // Fallback pour s'assurer que les cartes sont visibles
        setTimeout(() => {
            cards.forEach(card => {
                card.style.opacity = '1';
            });
        }, (cards.length * this.config.animationDelay) + 1000);
    }
    
    // ========================================
    // FILTRAGE ET TRI
    // ========================================
    
    applyFilters() {
        this.state.currentPage = 1;
        this.renderCards();
        
        if (this.config.animated && this.config.staggerAnimation) {
            this.animateCards();
        }
    }
    
    search(query) {
        this.state.searchQuery = query;
        this.applyFilters();
    }
    
    filter(categories) {
        this.state.activeFilters = Array.isArray(categories) ? categories : [categories];
        this.applyFilters();
    }
    
    sort(by, order = 'asc') {
        this.config.sortBy = by;
        this.config.sortOrder = order;
        this.applyFilters();
    }
    
    group(by) {
        this.config.groupBy = by;
        this.applyFilters();
    }
    
    // ========================================
    // SÉLECTION
    // ========================================
    
    toggleCardSelection(cardId, multi = false) {
        if (!this.config.interactions.selectable) return;
        
        if (!multi && !this.config.interactions.multiSelect) {
            this.state.selectedCards.clear();
        }
        
        if (this.state.selectedCards.has(cardId)) {
            this.state.selectedCards.delete(cardId);
        } else {
            this.state.selectedCards.add(cardId);
        }
        
        this.updateSelectionUI();
        this.trigger('onCardSelect', cardId);
        this.trigger('onSelectionChange', Array.from(this.state.selectedCards));
    }
    
    selectAll() {
        this.state.visibleCards.forEach(card => {
            this.state.selectedCards.add(card.id);
        });
        this.updateSelectionUI();
        this.trigger('onSelectionChange', Array.from(this.state.selectedCards));
    }
    
    clearSelection() {
        this.state.selectedCards.clear();
        this.updateSelectionUI();
        this.trigger('onSelectionChange', []);
    }
    
    updateSelectionUI() {
        this.elements.cards.forEach((element, cardId) => {
            if (this.state.selectedCards.has(cardId)) {
                element.classList.add('mcw-card-selected');
            } else {
                element.classList.remove('mcw-card-selected');
            }
        });
    }
    
    // ========================================
    // EXPANSION
    // ========================================
    
    toggleCardExpansion(cardId) {
        const card = this.config.cards.find(c => c.id === cardId);
        if (!card || !card.expandable) return;
        
        const element = this.elements.cards.get(cardId);
        if (!element) return;
        
        const childrenContainer = element.querySelector('.mcw-card-children');
        const expandBtn = element.querySelector('.mcw-card-expand-btn');
        
        if (this.state.expandedCards.has(cardId)) {
            this.state.expandedCards.delete(cardId);
            element.classList.remove('mcw-card-expanded');
            if (childrenContainer) childrenContainer.classList.add('mcw-collapsed');
            if (expandBtn) expandBtn.textContent = '▶';
            this.trigger('onCardCollapse', card);
        } else {
            this.state.expandedCards.add(cardId);
            element.classList.add('mcw-card-expanded');
            if (childrenContainer) childrenContainer.classList.remove('mcw-collapsed');
            if (expandBtn) expandBtn.textContent = '▼';
            this.trigger('onCardExpand', card);
        }
    }
    
    expandAll() {
        this.config.cards.forEach(card => {
            if (card.expandable) {
                this.state.expandedCards.add(card.id);
            }
        });
        this.updateExpansionUI();
    }
    
    collapseAll() {
        this.state.expandedCards.clear();
        this.updateExpansionUI();
    }
    
    updateExpansionUI() {
        this.elements.cards.forEach((element, cardId) => {
            const card = this.config.cards.find(c => c.id === cardId);
            if (!card || !card.expandable) return;
            
            const childrenContainer = element.querySelector('.mcw-card-children');
            const expandBtn = element.querySelector('.mcw-card-expand-btn');
            
            if (this.state.expandedCards.has(cardId)) {
                element.classList.add('mcw-card-expanded');
                if (childrenContainer) childrenContainer.classList.remove('mcw-collapsed');
                if (expandBtn) expandBtn.textContent = '▼';
            } else {
                element.classList.remove('mcw-card-expanded');
                if (childrenContainer) childrenContainer.classList.add('mcw-collapsed');
                if (expandBtn) expandBtn.textContent = '▶';
            }
        });
    }
    
    // ========================================
    // GROUPES
    // ========================================
    
    toggleGroup(groupName) {
        if (!this.state.collapsedGroups) {
            this.state.collapsedGroups = new Set();
        }
        
        const groupElement = this.elements.groups.get(groupName);
        if (!groupElement) return;
        
        const content = groupElement.querySelector('.mcw-group-content');
        const toggle = groupElement.querySelector('.mcw-group-toggle');
        
        if (this.state.collapsedGroups.has(groupName)) {
            this.state.collapsedGroups.delete(groupName);
            content.classList.remove('mcw-collapsed');
            if (toggle) toggle.textContent = '▼';
        } else {
            this.state.collapsedGroups.add(groupName);
            content.classList.add('mcw-collapsed');
            if (toggle) toggle.textContent = '▶';
        }
        
        this.trigger('onGroup', groupName, !this.state.collapsedGroups.has(groupName));
    }
    
    // ========================================
    // ÉDITION
    // ========================================
    
    editCard(cardId) {
        if (!this.config.interactions.editable) return;
        
        const card = this.config.cards.find(c => c.id === cardId);
        if (!card || card.locked) return;
        
        this.state.editingCards.add(cardId);
        this.updateEditingUI();
        
        this.trigger('onCardEdit', card);
    }
    
    saveCard(cardId, updates) {
        const cardIndex = this.config.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        this.config.cards[cardIndex] = {
            ...this.config.cards[cardIndex],
            ...updates
        };
        
        this.state.editingCards.delete(cardId);
        this.renderCards();
    }
    
    cancelEdit(cardId) {
        this.state.editingCards.delete(cardId);
        this.updateEditingUI();
    }
    
    updateEditingUI() {
        this.elements.cards.forEach((element, cardId) => {
            if (this.state.editingCards.has(cardId)) {
                element.classList.add('mcw-card-editing');
            } else {
                element.classList.remove('mcw-card-editing');
            }
        });
    }
    
    // ========================================
    // ACTIONS SUR LES CARTES
    // ========================================
    
    handleCardAction(card, action) {
        switch (action) {
            case 'edit':
                this.editCard(card.id);
                break;
            case 'delete':
                this.deleteCard(card.id);
                break;
            case 'duplicate':
                this.duplicateCard(card.id);
                break;
            case 'share':
                this.shareCard(card.id);
                break;
            default:
                this.trigger('onCardAction', card, action);
        }
    }
    
    deleteCard(cardId) {
        if (!this.config.interactions.editable) return;
        
        const card = this.config.cards.find(c => c.id === cardId);
        if (!card || card.locked) return;
        
        const confirmed = confirm(`Supprimer "${card.title || 'cette carte'}" ?`);
        if (!confirmed) return;
        
        this.removeCard(cardId);
        this.trigger('onCardDelete', card);
    }
    
    deleteSelectedCards() {
        if (this.state.selectedCards.size === 0) return;
        
        const confirmed = confirm(`Supprimer ${this.state.selectedCards.size} carte(s) ?`);
        if (!confirmed) return;
        
        this.state.selectedCards.forEach(cardId => {
            this.removeCard(cardId);
        });
        
        this.clearSelection();
    }
    
    duplicateCard(cardId) {
        const card = this.config.cards.find(c => c.id === cardId);
        if (!card) return;
        
        const newCard = {
            ...card,
            id: `${card.id}-copy-${Date.now()}`,
            title: `${card.title || 'Card'} (copie)`
        };
        
        this.addCard(newCard);
    }
    
    shareCard(cardId) {
        const card = this.config.cards.find(c => c.id === cardId);
        if (!card) return;
        
        if (navigator.share) {
            navigator.share({
                title: card.title || 'Card',
                text: card.description || '',
                url: card.href || window.location.href
            });
        }
    }
    
    toggleCardMenu(cardId) {
        const element = this.elements.cards.get(cardId);
        if (!element) return;
        
        const menu = element.querySelector('.mcw-card-menu-dropdown');
        if (menu) {
            menu.classList.toggle('mcw-show');
        }
    }
    
    // ========================================
    // CONTEXT MENU
    // ========================================
    
    showContextMenu(card, event) {
        // Fermer tout menu existant
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'mcw-context-menu';
        menu.style.left = `${event.pageX}px`;
        menu.style.top = `${event.pageY}px`;
        
        const actions = [
            { label: 'Ouvrir', action: 'open', icon: '📂' },
            { label: 'Modifier', action: 'edit', icon: '✏️' },
            { label: 'Dupliquer', action: 'duplicate', icon: '📋' },
            { separator: true },
            { label: 'Partager', action: 'share', icon: '🔗' },
            { separator: true },
            { label: 'Supprimer', action: 'delete', icon: '🗑️', class: 'danger' }
        ];
        
        actions.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'mcw-context-separator';
                menu.appendChild(sep);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = `mcw-context-item ${item.class || ''}`;
                menuItem.innerHTML = `${item.icon} ${item.label}`;
                menuItem.onclick = () => {
                    this.handleCardAction(card, item.action);
                    this.hideContextMenu();
                };
                menu.appendChild(menuItem);
            }
        });
        
        document.body.appendChild(menu);
        
        // Fermer au clic ailleurs
        setTimeout(() => {
            document.addEventListener('click', this.hideContextMenu);
        }, 0);
    }
    
    hideContextMenu() {
        const menu = document.querySelector('.mcw-context-menu');
        if (menu) {
            menu.remove();
        }
        document.removeEventListener('click', this.hideContextMenu);
    }
    
    // ========================================
    // LONG PRESS (MOBILE)
    // ========================================
    
    handleLongPress(card, event) {
        // Vibration feedback si disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Sélectionner la carte
        this.toggleCardSelection(card.id);
        
        // Afficher les actions
        if (this.config.interactions.swipeActions.length > 0) {
            this.showSwipeActions(card, event);
        }
    }
    
    showSwipeActions(card, event) {
        const element = this.elements.cards.get(card.id);
        if (!element) return;
        
        const actions = document.createElement('div');
        actions.className = 'mcw-swipe-actions';
        
        this.config.interactions.swipeActions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `mcw-swipe-btn mcw-swipe-${action.type}`;
            btn.innerHTML = action.icon;
            btn.onclick = () => action.onClick(card);
            actions.appendChild(btn);
        });
        
        element.appendChild(actions);
        
        // Fermer après 3 secondes
        setTimeout(() => {
            actions.remove();
        }, 3000);
    }
    
    // ========================================
    // PAGINATION
    // ========================================
    
    renderPagination() {
        if (!this.config.pagination.enabled) return;
        
        const container = document.createElement('div');
        container.className = `mcw-pagination mcw-pagination-${this.config.pagination.position}`;
        
        const totalPages = this.state.totalPages;
        const currentPage = this.state.currentPage;
        
        let html = '';
        
        if (this.config.pagination.showInfo) {
            html += `<div class="mcw-pagination-info">
                Page ${currentPage} sur ${totalPages}
            </div>`;
        }
        
        if (this.config.pagination.showControls && totalPages > 1) {
            html += '<div class="mcw-pagination-controls">';
            
            // Première page
            html += `<button class="mcw-page-btn" data-page="1" 
                            ${currentPage === 1 ? 'disabled' : ''}>⏮</button>`;
            
            // Page précédente
            html += `<button class="mcw-page-btn" data-page="${currentPage - 1}" 
                            ${currentPage === 1 ? 'disabled' : ''}>◀</button>`;
            
            // Numéros de page
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);
            
            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="mcw-page-btn ${i === currentPage ? 'mcw-page-active' : ''}" 
                                data-page="${i}">${i}</button>`;
            }
            
            // Page suivante
            html += `<button class="mcw-page-btn" data-page="${currentPage + 1}" 
                            ${currentPage === totalPages ? 'disabled' : ''}>▶</button>`;
            
            // Dernière page
            html += `<button class="mcw-page-btn" data-page="${totalPages}" 
                            ${currentPage === totalPages ? 'disabled' : ''}>⏭</button>`;
            
            html += '</div>';
        }
        
        container.innerHTML = html;
        
        // Attacher les événements
        container.querySelectorAll('.mcw-page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.goToPage(page);
            });
        });
        
        this.elements.pagination = container;
        
        const target = this.elements.wrapper || this.elements.container;
        
        if (this.config.pagination.position === 'top') {
            target.insertBefore(container, this.elements.grid);
        } else {
            target.appendChild(container);
        }
    }
    
    goToPage(page) {
        if (page < 1 || page > this.state.totalPages) return;
        
        this.state.currentPage = page;
        this.renderCards();
        
        if (this.elements.pagination) {
            this.elements.pagination.remove();
            this.renderPagination();
        }
        
        this.trigger('onPageChange', page);
    }
    
    // ========================================
    // AUTO REFRESH
    // ========================================
    
    startAutoRefresh() {
        if (!this.config.autoRefresh) return;
        
        this.timers.refresh = setInterval(() => {
            this.refresh();
        }, this.config.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.timers.refresh) {
            clearInterval(this.timers.refresh);
            this.timers.refresh = null;
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    // === Manipulation des cartes ===
    
    addCard(card, position = 'end') {
        if (position === 'start') {
            this.config.cards.unshift(card);
        } else if (typeof position === 'number') {
            this.config.cards.splice(position, 0, card);
        } else {
            this.config.cards.push(card);
        }
        this.applyFilters();
    }
    
    addCards(cards, position = 'end') {
        cards.forEach(card => this.addCard(card, position));
    }
    
    removeCard(cardId) {
        const index = this.config.cards.findIndex(c => c.id === cardId);
        if (index !== -1) {
            this.config.cards.splice(index, 1);
            this.applyFilters();
        }
    }
    
    removeCards(cardIds) {
        cardIds.forEach(id => this.removeCard(id));
    }
    
    updateCard(cardId, updates) {
        const card = this.config.cards.find(c => c.id === cardId);
        if (card) {
            Object.assign(card, updates);
            this.applyFilters();
        }
    }
    
    updateCards(updates) {
        Object.entries(updates).forEach(([cardId, cardUpdates]) => {
            this.updateCard(cardId, cardUpdates);
        });
    }
    
    getCard(cardId) {
        return this.config.cards.find(c => c.id === cardId);
    }
    
    getAllCards() {
        return [...this.config.cards];
    }
    
    // === État et sélection ===
    
    getVisibleCards() {
        return [...this.state.visibleCards];
    }
    
    getSelectedCards() {
        return Array.from(this.state.selectedCards).map(id => 
            this.config.cards.find(c => c.id === id)
        ).filter(Boolean);
    }
    
    getExpandedCards() {
        return Array.from(this.state.expandedCards).map(id => 
            this.config.cards.find(c => c.id === id)
        ).filter(Boolean);
    }
    
    getState() {
        return {
            searchQuery: this.state.searchQuery,
            activeFilters: [...this.state.activeFilters],
            selectedCards: Array.from(this.state.selectedCards),
            expandedCards: Array.from(this.state.expandedCards),
            editingCards: Array.from(this.state.editingCards),
            hoveredCard: this.state.hoveredCard,
            focusedCard: this.state.focusedCard,
            currentPage: this.state.currentPage,
            totalPages: this.state.totalPages
        };
    }
    
    setState(newState) {
        Object.assign(this.state, newState);
        this.applyFilters();
    }
    
    // === Actions ===
    
    selectCard(cardId) {
        this.state.selectedCards.add(cardId);
        this.updateSelectionUI();
    }
    
    deselectCard(cardId) {
        this.state.selectedCards.delete(cardId);
        this.updateSelectionUI();
    }
    
    expandCard(cardId) {
        this.state.expandedCards.add(cardId);
        this.updateExpansionUI();
    }
    
    collapseCard(cardId) {
        this.state.expandedCards.delete(cardId);
        this.updateExpansionUI();
    }
    
    focusCard(cardId) {
        this.state.focusedCard = cardId;
        
        // Retirer le focus précédent
        this.elements.cards.forEach(element => {
            element.classList.remove('mcw-card-focused');
        });
        
        // Ajouter le nouveau focus
        const element = this.elements.cards.get(cardId);
        if (element) {
            element.classList.add('mcw-card-focused');
            element.focus();
        }
    }
    
    // === Filtrage et organisation ===
    
    refresh() {
        this.applyFilters();
    }
    
    reload(newCards) {
        if (newCards) {
            this.config.cards = newCards;
        }
        this.applyFilters();
    }
    
    clearSearch() {
        this.state.searchQuery = '';
        if (this.elements.searchBox) {
            const input = this.elements.searchBox.querySelector('.mcw-search-input');
            if (input) input.value = '';
        }
        this.applyFilters();
    }
    
    resetFilters() {
        this.state.activeFilters = [];
        this.state.searchQuery = '';
        this.clearSearch();
        
        if (this.elements.filterBar) {
            this.elements.filterBar.querySelectorAll('.mcw-filter-btn').forEach(btn => {
                btn.classList.toggle('mcw-filter-active', btn.dataset.filter === 'all');
            });
        }
        
        this.applyFilters();
    }
    
    // === Configuration ===
    
    setConfig(key, value) {
        this.setNestedValue(this.config, key, value);
        this.render();
    }
    
    getConfig(key) {
        return this.getNestedValue(this.config, key);
    }
    
    updateConfig(updates) {
        Object.assign(this.config, updates);
        this.render();
    }
    
    // === Utilitaires ===
    
    showToast(message, type = 'info') {
        if (window.toast) {
            window.toast[type](message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    trigger(eventName, ...args) {
        if (this.config[eventName] && typeof this.config[eventName] === 'function') {
            this.config[eventName](...args);
        }
    }
    
    log(...args) {
        if (this.config.debug) {
            console.log('[MenuCardsWidget]', ...args);
        }
    }
    
    getNestedValue(obj, path) {
        if (!path) return obj;
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
    
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const target = keys.reduce((curr, key) => {
            if (!curr[key]) curr[key] = {};
            return curr[key];
        }, obj);
        target[last] = value;
    }
    
    // === Destruction ===
    
    destroy() {
        // Nettoyer les timers
        Object.values(this.timers).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        
        // Nettoyer les event listeners
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser l'état
        this.state = {
            initialized: false,
            loading: false,
            error: null,
            searchQuery: '',
            activeFilters: [],
            selectedCards: new Set(),
            expandedCards: new Set(),
            editingCards: new Set(),
            hoveredCard: null,
            focusedCard: null,
            draggedCard: null,
            groups: new Map(),
            visibleCards: [],
            currentPage: 1,
            totalPages: 1,
            cache: new Map(),
            lastUpdate: Date.now()
        };
        
        this.log('🗑️ MenuCardsWidget détruit');
    }
}

// Export par défaut
export default MenuCardsWidget;