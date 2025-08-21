/* ========================================
   DATA-GRID.WIDGET.JS - Widget de tableau de données
   Chemin: /widgets/data-grid/data-grid.widget.js
   
   DESCRIPTION:
   Widget autonome de tableau avec tri, pagination, export et sélection.
   Intègre tous les modules en un seul fichier. 100% indépendant.
   
   STRUCTURE DU FICHIER:
   1. CONSTRUCTOR ET CONFIGURATION
   2. INITIALISATION
   3. RENDU PRINCIPAL
   4. MODULE TRI INTÉGRÉ
   5. MODULE PAGINATION INTÉGRÉ
   6. MODULE EXPORT INTÉGRÉ
   7. MODULE RESIZE INTÉGRÉ
   8. GESTION ÉVÉNEMENTS
   9. API PUBLIQUE
   10. DESTRUCTION
   
   UTILISATION:
   import { DataGridWidget } from '/widgets/data-grid/data-grid.widget.js';
   const grid = new DataGridWidget({
       container: '.table',
       showWrapper: true,
       data: [...],
       columns: [...],
       onRowClick: (row) => {...}
   });
   
   API PUBLIQUE:
   - setData(data) - Définir les données
   - refresh() - Rafraîchir l'affichage
   - getSelectedRows() - Obtenir lignes sélectionnées
   - clearSelection() - Effacer la sélection
   - sort(column) - Trier par colonne
   - goToPage(page) - Aller à une page
   - export(format) - Exporter CSV/Excel
   - destroy() - Détruire le widget
   
   OPTIONS:
   - container: string|Element - Container cible
   - showWrapper: boolean (défaut: false) - Container englobant
   - wrapperStyle: 'card'|'minimal'|'bordered' (défaut: 'card')
   - wrapperTitle: string (défaut: '') - Titre du wrapper
   - data: Array - Données à afficher
   - columns: Array - Configuration des colonnes
   - features: Object - Activer/désactiver fonctionnalités
   - pagination: Object - Configuration pagination
   - export: Object - Configuration export
   - styles: Object - Styles du tableau
   - onRowClick: Function - Callback clic ligne
   - onSort: Function - Callback tri
   - onPageChange: Function - Callback changement page
   - onSelectionChange: Function - Callback sélection
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale unifiée
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class DataGridWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec défauts
        this.config = {
            // Container
            container: config.container || null,
            
            // Options wrapper englobant
            showWrapper: config.showWrapper || false,
            wrapperStyle: config.wrapperStyle || 'card',
            wrapperTitle: config.wrapperTitle || '',
            wrapperClass: config.wrapperClass || '',
            
            // Données et colonnes
            data: config.data || [],
            columns: config.columns || [],
            
            // Fonctionnalités
            features: {
                sort: config.features?.sort !== false,
                resize: config.features?.resize !== false,
                export: config.features?.export !== false,
                selection: config.features?.selection || false,
                pagination: config.features?.pagination !== false,
                ...config.features
            },
            
            // Pagination
            pagination: {
                enabled: config.pagination?.enabled !== false,
                itemsPerPage: config.pagination?.itemsPerPage || 10,
                pageSizeOptions: config.pagination?.pageSizeOptions || [10, 20, 50, 100],
                showFirstLast: config.pagination?.showFirstLast !== false,
                showPageInfo: config.pagination?.showPageInfo !== false,
                alwaysShowSizeSelector: config.pagination?.alwaysShowSizeSelector !== false,  // Toujours afficher
                ...config.pagination
            },
            
            // Export
            export: {
                csv: config.export?.csv !== false,
                excel: config.export?.excel !== false,
                filename: config.export?.filename || 'export',
                onBeforeExport: config.export?.onBeforeExport || null,
                ...config.export
            },
            
            // Styles
            styles: {
                useGradientHeader: config.styles?.useGradientHeader !== false,
                striped: config.styles?.striped !== false,
                hover: config.styles?.hover !== false,
                bordered: config.styles?.bordered !== false,
                ...config.styles
            },
            
            // Messages
            messages: {
                noData: 'Aucune donnée disponible',
                loading: 'Chargement...',
                itemsPerPage: 'Lignes',  // Plus court
                page: 'Page',
                of: 'sur',
                items: 'éléments',
                selectedItems: 'éléments sélectionnés',
                ...config.messages
            },
            
            // Callbacks
            onRowClick: config.onRowClick || null,
            onSort: config.onSort || null,
            onPageChange: config.onPageChange || null,
            onExport: config.onExport || null,
            onSelectionChange: config.onSelectionChange || null,
            
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc',
            selectedRows: new Set(),
            loading: false,
            loaded: false,
            columnWidths: {},
            resizing: {
                active: false,
                column: null,
                startX: 0,
                startWidth: 0
            }
        };
        
        // 4. Références DOM
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            table: null,
            thead: null,
            tbody: null,
            selectAllCheckbox: null,
            exportButtons: null,
            paginationContainer: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'grid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser
        this.init();
    }
    
    // ========================================
    // SECTION 1 : INITIALISATION
    // ========================================
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
            // Charger les styles communs (buttons, badges, modal)
            import('/src/utils/widget-styles-loader.js').then(module => {
                module.loadWidgetStyles();
            });
            
            // Charger le CSS spécifique du widget
            const cssId = 'data-grid-widget-css';
            const existing = document.getElementById(cssId);
            if (existing) existing.remove();
            
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/data-grid/data-grid.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
            
            console.log('✅ CSS DataGridWidget chargé');
        }
    
    /**
     * Initialisation asynchrone
     */
    async init() {
        try {
            this.setupContainer();
            this.initState();
            this.render();
            this.attachEvents();
            if (this.config.data.length > 0) {
                this.setData(this.config.data);
            }
            this.showWithDelay(); // Anti-FOUC
            
            console.log('✅ DataGridWidget initialisé:', this.id);
        } catch (error) {
            console.error('❌ Erreur init DataGridWidget:', error);
        }
    }
    
    /**
     * Configure le container
     */
    setupContainer() {
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            throw new Error('DataGridWidget: Container non trouvé');
        }
    }
    
    /**
     * Initialise l'état avec les colonnes
     */
    initState() {
        // Initialiser les largeurs de colonnes
        this.config.columns.forEach((col, index) => {
            if (col.width) {
                this.state.columnWidths[index] = col.width;
            }
        });
    }
    
    // ========================================
    // SECTION 2 : RENDU PRINCIPAL
    // ========================================
    
    /**
     * Génère et affiche le HTML
     */
    render() {
        if (this.config.showWrapper) {
            this.renderWithWrapper();
        } else {
            this.renderWithoutWrapper();
        }
    }
    
    /**
     * Rendu avec wrapper englobant
     */
    renderWithWrapper() {
        // Créer le container englobant
        const container = document.createElement('div');
        container.className = this.buildContainerClasses();
        container.id = `${this.id}-container`;
        
        // Ajouter le titre seulement si fourni et non vide
        if (this.config.wrapperTitle && this.config.wrapperTitle.trim() !== '') {
            const title = document.createElement('div');
            title.className = 'data-grid-container-title';
            title.textContent = this.config.wrapperTitle;
            container.appendChild(title);
        }
        
        // Créer le wrapper de la grille
        const wrapper = this.createGridWrapper();
        container.appendChild(wrapper);
        
        // Sauvegarder les références
        this.elements.mainContainer = container;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(container);
        
        // Récupérer les références après injection
        this.updateElementReferences();
    }
    
    /**
     * Rendu sans wrapper
     */
    renderWithoutWrapper() {
        const wrapper = this.createGridWrapper();
        
        // Sauvegarder les références
        this.elements.mainContainer = wrapper;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(wrapper);
        
        // Récupérer les références après injection
        this.updateElementReferences();
    }
    
    /**
     * Crée le wrapper de la grille
     */
    createGridWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = this.buildWrapperClasses();
        wrapper.id = this.id;
        
        let html = '';
        
        // Boutons d'export
        if (this.config.features.export) {
            html += this.renderExportButtons();
        }
        
        // Table
        html += `
            <div class="data-grid-table-container">
                <table class="${this.getTableClasses()}">
                    <thead>${this.renderHeader()}</thead>
                    <tbody>${this.renderNoData()}</tbody>
                </table>
            </div>
        `;
        
        // Pagination
        if (this.config.features.pagination) {
            html += '<div class="data-grid-pagination"></div>';
        }
        
        wrapper.innerHTML = html;
        return wrapper;
    }
    
    /**
     * Met à jour les références aux éléments DOM
     */
    updateElementReferences() {
        this.elements.table = this.elements.wrapper.querySelector('table');
        this.elements.thead = this.elements.table.querySelector('thead');
        this.elements.tbody = this.elements.table.querySelector('tbody');
        
        if (this.config.features.selection) {
            this.elements.selectAllCheckbox = this.elements.thead.querySelector('.select-all-checkbox');
        }
        
        if (this.config.features.pagination) {
            this.elements.paginationContainer = this.elements.wrapper.querySelector('.data-grid-pagination');
        }
    }
    
    /**
     * Construit les classes du container englobant
     */
    buildContainerClasses() {
        const classes = ['data-grid-container'];
        classes.push(`wrapper-${this.config.wrapperStyle}`);
        if (this.config.wrapperClass) {
            classes.push(this.config.wrapperClass);
        }
        return classes.join(' ');
    }
    
    /**
     * Construit les classes du wrapper
     */
    buildWrapperClasses() {
        const classes = ['data-grid-wrapper'];
        if (!this.config.animated) {
            classes.push('no-animation');
        }
        return classes.join(' ');
    }
    
    /**
     * Obtient les classes de la table
     */
    getTableClasses() {
        const classes = ['data-grid-table'];
        if (this.config.styles.striped) classes.push('table-striped');
        if (this.config.styles.hover) classes.push('table-hover');
        if (this.config.styles.bordered) classes.push('table-bordered');
        if (this.config.styles.useGradientHeader) classes.push('gradient-header');
        return classes.join(' ');
    }
    
    /**
     * Rendu des boutons d'export
     */
        renderExportButtons() {
            // Zone d'actions vide - l'orchestrateur ajoutera ses boutons
            return `<div class="data-grid-export-buttons"></div>`;
        }
    
    
/**
     * Rendu du header
     */
    renderHeader() {
        let html = '<tr>';
        
        // Checkbox de sélection globale
        if (this.config.features.selection) {
            html += `
                <th class="col-select">
                    <input type="checkbox" class="select-all-checkbox">
                </th>
            `;
        }
        
        // Colonnes
        this.config.columns.forEach((column, index) => {
            // Colonne d'actions - pas de tri ni resize
            if (column.type === 'actions') {
                // NOUVEAU : Largeur auto basée sur le nombre d'actions
                let autoWidth = column.width;
                if (!autoWidth && column.actions) {
                    // 50px pour 1 bouton, +35px par bouton supplémentaire
                    autoWidth = 50 + ((column.actions.length - 1) * 35);
                }
                const width = autoWidth ? `style="width: ${autoWidth}px; max-width: ${autoWidth}px;"` : '';
                
                const align = column.align || 'center';
                const alignClass = `text-${align}`;
                const className = column.className || '';
                
                html += `
                    <th class="data-grid-header ${alignClass} ${className}" 
                        data-column="${column.key || 'actions'}" 
                        data-index="${index}"
                        ${width}>
                        <div class="grid-header-inner">
                            <span>${column.label || 'Actions'}</span>
                        </div>
                    </th>
                `;
            }
            // Colonnes normales
            else {
                const sortable = this.config.features.sort && column.sortable !== false;
                const resizable = this.config.features.resize && column.resizable !== false;
                const width = this.state.columnWidths[index] ? `style="width: ${this.state.columnWidths[index]}px"` : '';
                const align = column.align ? `text-${column.align}` : '';
                const className = column.className || '';
                
                html += `
                    <th class="data-grid-header ${sortable ? 'sortable' : ''} ${align} ${className}" 
                        data-column="${column.key}" 
                        data-index="${index}"
                        ${width}>
                        <div class="grid-header-inner">
                            <span>${column.label}</span>
                            ${sortable ? '<span class="sort-icon">↕️</span>' : ''}
                        </div>
                        ${resizable ? '<div class="resize-handle"></div>' : ''}
                    </th>
                `;
            }
        });
        
        html += '</tr>';
        return html;
    }
    
    /**
     * Rendu sans données
     */
    renderNoData() {
        const colspan = this.config.columns.length + (this.config.features.selection ? 1 : 0);
        return `
            <tr class="no-data">
                <td colspan="${colspan}">
                    ${this.state.loading ? this.config.messages.loading : this.config.messages.noData}
                </td>
            </tr>
        `;
    }
    
    /**
     * Rendu du body
     */
    renderBody() {
        const pageData = this.getPageData();
        
        if (pageData.length === 0) {
            this.elements.tbody.innerHTML = this.renderNoData();
            return;
        }
        
        let html = '';
        
        pageData.forEach((row, index) => {
            html += '<tr data-index="' + index + '">';
            
            // Checkbox de sélection
            if (this.config.features.selection) {
                const globalIndex = this.getGlobalIndex(index);
                const checked = this.state.selectedRows.has(globalIndex) ? 'checked' : '';
                html += `
                    <td class="col-select">
                        <input type="checkbox" class="row-select" ${checked}>
                    </td>
                `;
            }
            
            // Colonnes de données
            this.config.columns.forEach((column, colIndex) => {
                // Colonne d'actions spéciale
                if (column.type === 'actions' && column.actions) {
                    const align = column.align || 'center';  // Center par défaut pour actions
                    const alignClass = `text-${align}`;
                    const className = `col-actions ${alignClass} ${column.className || ''}`.trim();
                    html += `<td class="${className}" data-row-index="${index}">`;
                    
                    // Si plusieurs actions, les grouper
                    if (column.actions.length > 1) {
                        html += '<div class="btn-action-group">';
                    }
                    
                    // Générer chaque bouton d'action
                    column.actions.forEach((action, actionIndex) => {
                        const btnClass = this.getActionButtonClass(action.type);
                        const btnSize = action.size || '';
                        const btnTitle = action.title || this.getActionTitle(action.type);
                        const disabled = action.disabled ? 'disabled' : '';
                        
                        html += `
                            <button class="btn ${btnClass} ${btnSize}" 
                                    data-action="${action.type}"
                                    data-action-index="${actionIndex}"
                                    data-row-index="${index}"
                                    data-column-index="${colIndex}"
                                    title="${btnTitle}"
                                    ${disabled}>
                            </button>
                        `;
                    });
                    
                    if (column.actions.length > 1) {
                        html += '</div>';
                    }
                    
                    html += '</td>';
                } 
                // Colonne normale
                else {
                    const value = this.getNestedValue(row, column.key);
                    const formatted = column.formatter ? column.formatter(value, row) : value;
                    const align = column.align ? `text-${column.align}` : '';
                    const className = `${column.className || ''} ${align}`.trim();
                    html += `<td class="${className}">${formatted || ''}</td>`;
                }
            });
            
            html += '</tr>';
        });
        
        this.elements.tbody.innerHTML = html;
    }
    
    // ========================================
    // SECTION 3 : MODULE TRI INTÉGRÉ
    // ========================================
    
    /**
     * Trier par une colonne
     */
    sort(columnKey) {
        if (!this.config.features.sort) return;
        
        // Inverser la direction si même colonne
        if (this.state.sortColumn === columnKey) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortColumn = columnKey;
            this.state.sortDirection = 'asc';
        }
        
        // Trouver la configuration de la colonne
        const column = this.config.columns.find(col => col.key === columnKey);
        if (!column) return;
        
        // Trier les données
        this.state.filteredData.sort((a, b) => {
            let valueA = this.getNestedValue(a, columnKey);
            let valueB = this.getNestedValue(b, columnKey);
            
            // Fonction de tri personnalisée
            if (column.sortFunction) {
                return column.sortFunction(valueA, valueB, this.state.sortDirection);
            }
            
            // Tri par défaut
            return this.defaultSort(valueA, valueB, this.state.sortDirection);
        });
        
        // Mettre à jour l'UI
        this.updateSortUI();
        
        // Rafraîchir
        this.refresh();
        
        // Callback
        if (this.config.onSort) {
            this.config.onSort(columnKey, this.state.sortDirection);
        }
    }
    
    /**
     * Tri par défaut
     */
    defaultSort(a, b, direction) {
        // Gérer les valeurs nulles
        if (a === null || a === undefined) a = '';
        if (b === null || b === undefined) b = '';
        
        // Tri numérique
        if (typeof a === 'number' && typeof b === 'number') {
            return direction === 'asc' ? a - b : b - a;
        }
        
        // Tri date
        if (a instanceof Date && b instanceof Date) {
            return direction === 'asc' ? a - b : b - a;
        }
        
        // Tri chaîne
        const strA = String(a).toLowerCase();
        const strB = String(b).toLowerCase();
        
        if (direction === 'asc') {
            return strA.localeCompare(strB, 'fr');
        } else {
            return strB.localeCompare(strA, 'fr');
        }
    }
    
    /**
     * Mettre à jour l'interface de tri
     */
    updateSortUI() {
        // Réinitialiser tous les indicateurs
        this.elements.thead.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.textContent = '↕️';
        });
        
        // Mettre à jour la colonne active
        const activeHeader = this.elements.thead.querySelector(`[data-column="${this.state.sortColumn}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${this.state.sortDirection}`);
            const icon = activeHeader.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = this.state.sortDirection === 'asc' ? '↑' : '↓';
            }
        }
    }
    
    // ========================================
    // SECTION 4 : MODULE PAGINATION INTÉGRÉ
    // ========================================
    
    /**
     * Rendu de la pagination
     */
    renderPagination() {
        if (!this.config.features.pagination || !this.elements.paginationContainer) return;
        
        const totalItems = this.state.filteredData.length;
        const totalPages = Math.ceil(totalItems / this.config.pagination.itemsPerPage);
        const currentPage = this.state.currentPage;
        
        // Calculer la plage d'éléments affichés
        const start = (currentPage - 1) * this.config.pagination.itemsPerPage + 1;
        const end = Math.min(currentPage * this.config.pagination.itemsPerPage, totalItems);
        
        let html = '<div class="pagination-wrapper">';
        
        // Sélecteur du nombre d'éléments par page - TOUJOURS affiché
        if (this.config.pagination.pageSizeOptions && this.config.pagination.pageSizeOptions.length > 0) {
            html += `
                <div class="pagination-size">
                    <label>${this.config.messages.itemsPerPage}:</label>
                    <select class="page-size-select">
                        ${this.config.pagination.pageSizeOptions.map(size => 
                            `<option value="${size}" ${size === this.config.pagination.itemsPerPage ? 'selected' : ''}>${size}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }
        
        // Informations
        if (this.config.pagination.showPageInfo && totalItems > 0) {
            html += `
                <div class="pagination-info">
                    ${start}-${end} ${this.config.messages.of} ${totalItems} ${this.config.messages.items}
                </div>
            `;
        }
        
        // Contrôles de pagination
        html += '<div class="pagination-controls">';
        
        // Première page
        if (this.config.pagination.showFirstLast) {
            html += `
                <button class="btn btn-sm btn-outline" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        data-page="1">
                    ⏮️
                </button>
            `;
        }
        
        // Page précédente
        html += `
            <button class="btn btn-sm btn-outline" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    data-page="${currentPage - 1}">
                ← Précédent
            </button>
        `;
        
        // Numéros de pages
        html += this.renderPageNumbers(currentPage, totalPages);
        
        // Page suivante
        html += `
            <button class="btn btn-sm btn-outline" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    data-page="${currentPage + 1}">
                Suivant →
            </button>
        `;
        
        // Dernière page
        if (this.config.pagination.showFirstLast) {
            html += `
                <button class="btn btn-sm btn-outline" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        data-page="${totalPages}">
                    ⏭️
                </button>
            `;
        }
        
        html += '</div></div>';
        
        this.elements.paginationContainer.innerHTML = html;
        
        // Attacher les événements de pagination
        this.attachPaginationEvents();
    }
    
    /**
     * Rendu des numéros de pages
     */
    renderPageNumbers(current, total) {
        if (total <= 1) return '';
        
        let html = '<div class="pagination-numbers">';
        
        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        if (start > 1) {
            html += '<button class="btn btn-sm btn-outline" data-page="1">1</button>';
            if (start > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        for (let i = start; i <= end; i++) {
            const activeClass = i === current ? 'btn-primary' : 'btn-outline';
            html += `
                <button class="btn btn-sm ${activeClass}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        if (end < total) {
            if (end < total - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `<button class="btn btn-sm btn-outline" data-page="${total}">${total}</button>`;
        }
        
        html += '</div>';
        return html;
    }
    
    /**
     * Aller à une page
     */
    goToPage(page) {
        const totalPages = Math.ceil(
            this.state.filteredData.length / 
            this.config.pagination.itemsPerPage
        );
        
        if (page < 1 || page > totalPages) return;
        
        this.state.currentPage = page;
        this.refresh();
        
        if (this.config.onPageChange) {
            this.config.onPageChange(page);
        }
    }
    
    /**
     * Changer la taille de page
     */
    changePageSize(size) {
        this.config.pagination.itemsPerPage = size;
        this.state.currentPage = 1;
        this.refresh();
    }
    
    // ========================================
    // SECTION 5 : MODULE EXPORT INTÉGRÉ
    // ========================================
    
    /**
     * Exporter les données
     */
    export(format) {
        if (!this.config.features.export) return;
        
        // Récupérer les données à exporter
        let dataToExport;
        
        if (this.state.selectedRows.size > 0) {
            dataToExport = this.getSelectedRows();
        } else {
            dataToExport = this.state.filteredData;
        }
        
        // Transformer les données
        if (this.config.export.onBeforeExport) {
            dataToExport = this.config.export.onBeforeExport(dataToExport);
        } else {
            dataToExport = this.transformDataForExport(dataToExport);
        }
        
        // Exporter selon le format
        if (format === 'csv') {
            this.exportCSV(dataToExport);
        } else if (format === 'excel') {
            this.exportExcel(dataToExport);
        }
        
        if (this.config.onExport) {
            this.config.onExport(format, dataToExport);
        }
    }
    
    /**
     * Transformer les données pour l'export
     */
    transformDataForExport(data) {
        return data.map(row => {
            const exportRow = {};
            
            this.config.columns.forEach(column => {
                if (column.exportable === false) return;
                
                const value = this.getNestedValue(row, column.key);
                const label = column.exportLabel || column.label;
                
                if (column.exportFormatter) {
                    exportRow[label] = column.exportFormatter(value, row);
                } else if (column.formatter) {
                    const formatted = column.formatter(value, row);
                    exportRow[label] = this.stripHtml(String(formatted));
                } else {
                    exportRow[label] = value;
                }
            });
            
            return exportRow;
        });
    }
    
    /**
     * Retirer le HTML
     */
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    /**
     * Export CSV
     */
    exportCSV(data) {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        let csv = headers.map(h => this.escapeCSV(h)).join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(h => this.escapeCSV(row[h]));
            csv += values.join(',') + '\n';
        });
        
        this.download(csv, 'text/csv', '.csv');
    }
    
    /**
     * Échapper CSV
     */
    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
    
    /**
     * Export Excel
     */
    exportExcel(data) {
        if (data.length === 0) return;
        
        let html = '<table border="1"><thead><tr>';
        Object.keys(data[0]).forEach(key => {
            html += `<th>${this.escapeHtml(key)}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        data.forEach(row => {
            html += '<tr>';
            Object.values(row).forEach(value => {
                html += `<td>${this.escapeHtml(value)}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        
        const template = `
            <html xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head>
                <meta charset="utf-8">
                <xml>
                    <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
                        <x:Name>Export</x:Name>
                        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
                </xml>
            </head>
            <body>${html}</body>
            </html>
        `;
        
        this.download(template, 'application/vnd.ms-excel', '.xls');
    }
    
    /**
     * Échapper HTML
     */
    escapeHtml(value) {
        if (value === null || value === undefined) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(value).replace(/[&<>"']/g, m => map[m]);
    }
    
    /**
     * Télécharger fichier
     */
    download(content, mimeType, extension) {
        const filename = this.config.export.filename + '_' + 
                        new Date().toISOString().split('T')[0] + extension;
        
        const blob = new Blob(['\ufeff' + content], { type: mimeType + ';charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    // ========================================
    // SECTION 6 : MODULE RESIZE INTÉGRÉ
    // ========================================
    
    /**
     * Initialiser le resize
     */
    initResize() {
        if (!this.config.features.resize) return;
        
        this.elements.thead.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e));
        });
    }
    
    /**
     * Commencer le resize
     */
    startResize(e) {
        e.preventDefault();
        
        const column = e.target.closest('th');
        const columnIndex = parseInt(column.dataset.index);
        
        this.state.resizing = {
            active: true,
            column: column,
            columnIndex: columnIndex,
            startX: e.pageX,
            startWidth: column.offsetWidth
        };
        
        document.body.classList.add('grid-resizing');
        column.classList.add('resizing');
    }
    
    /**
     * Resize en cours
     */
    doResize(e) {
        if (!this.state.resizing.active) return;
        
        const diff = e.pageX - this.state.resizing.startX;
        const newWidth = Math.max(50, this.state.resizing.startWidth + diff);
        
        this.state.resizing.column.style.width = newWidth + 'px';
        this.state.columnWidths[this.state.resizing.columnIndex] = newWidth;
    }
    
    /**
     * Arrêter le resize
     */
    stopResize() {
        if (!this.state.resizing.active) return;
        
        this.state.resizing.active = false;
        document.body.classList.remove('grid-resizing');
        
        if (this.state.resizing.column) {
            this.state.resizing.column.classList.remove('resizing');
        }
        
        this.state.resizing = {
            active: false,
            column: null,
            startX: 0,
            startWidth: 0
        };
    }
    
    // ========================================
    // SECTION 7 : GESTION DES ÉVÉNEMENTS
    // ========================================
    
    /**
     * Attache les événements globaux
     */
    attachEvents() {
        // Sélection globale
        if (this.config.features.selection && this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.addEventListener('change', () => this.toggleSelectAll());
        }
        
        // Tri
        if (this.config.features.sort) {
            this.elements.thead.querySelectorAll('.sortable').forEach(th => {
                th.addEventListener('click', (e) => {
                    if (!e.target.closest('.resize-handle')) {
                        const column = th.dataset.column;
                        this.sort(column);
                    }
                });
            });
        }
        
        // Export
        if (this.config.features.export) {
            this.elements.wrapper.querySelectorAll('[data-export]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const format = btn.dataset.export;
                    this.export(format);
                });
            });
        }
        
        // Click sur les lignes
        this.elements.tbody.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            if (tr && !tr.classList.contains('no-data')) {
                const index = parseInt(tr.dataset.index);
                const rowData = this.getRowData(index);
                
                // Checkbox de sélection
                if (e.target.type === 'checkbox' && e.target.classList.contains('row-select')) {
                    this.toggleRowSelection(index);
                }
                // Bouton d'action - NOUVEAU
                else if (e.target.matches('[data-action]')) {
                    e.stopPropagation(); // Empêcher le déclenchement du onRowClick
                    this.handleActionClick(e.target, rowData);
                }
                // Callback row click
                else if (this.config.onRowClick) {
                    // Ne pas déclencher si on clique dans la colonne actions
                    if (!e.target.closest('.col-actions')) {
                        this.config.onRowClick(rowData, index, e);
                    }
                }
            }
        });
        
        // Resize
        if (this.config.features.resize) {
            this.initResize();
            document.addEventListener('mousemove', (e) => this.doResize(e));
            document.addEventListener('mouseup', () => this.stopResize());
        }
    }
    
    /**
     * Attache les événements de pagination
     */
    attachPaginationEvents() {
        const container = this.elements.paginationContainer;
        if (!container) return;
        
        // Boutons de pagination
        container.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.goToPage(page);
            });
        });
        
        // Sélecteur de taille
        const sizeSelect = container.querySelector('.page-size-select');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', () => {
                this.changePageSize(parseInt(sizeSelect.value));
            });
        }
    }
    
    // ========================================
    // SECTION 8 : GESTION DES DONNÉES
    // ========================================
    
    /**
     * Définir les données
     */
    setData(data) {
        this.state.data = data;
        this.state.filteredData = data;
        this.state.currentPage = 1;
        this.state.selectedRows.clear();
        this.refresh();
    }
    
    /**
     * Obtenir les données d'une ligne
     */
    getRowData(index) {
        const pageData = this.getPageData();
        return pageData[index];
    }
    
    /**
     * Obtenir les données de la page courante
     */
    getPageData() {
        if (!this.config.features.pagination) {
            return this.state.filteredData;
        }
        
        const start = (this.state.currentPage - 1) * this.config.pagination.itemsPerPage;
        const end = start + this.config.pagination.itemsPerPage;
        
        return this.state.filteredData.slice(start, end);
    }
    
/**
     * Obtenir une valeur imbriquée
     */
    getNestedValue(obj, path) {
        if (!path) return null;
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
    
    /**
     * Obtenir la classe CSS du bouton selon le type d'action
     */
    getActionButtonClass(type) {
        const actionClasses = {
            'view': 'btn-view-icon',
            'edit': 'btn-edit-icon',
            'delete': 'btn-delete-icon',
            'download': 'btn-download-icon',
            'share': 'btn-share-icon',
            'duplicate': 'btn-duplicate-icon',
            'archive': 'btn-archive-icon'
        };
        return actionClasses[type] || 'btn-action-round';
    }
    
    /**
     * Obtenir le titre par défaut selon le type d'action
     */
    getActionTitle(type) {
        const actionTitles = {
            'view': 'Voir',
            'edit': 'Modifier',
            'delete': 'Supprimer',
            'download': 'Télécharger',
            'share': 'Partager',
            'duplicate': 'Dupliquer',
            'archive': 'Archiver'
        };
        return actionTitles[type] || 'Action';
    }
    
    /**
     * Obtenir l'index global
     */
    getGlobalIndex(pageIndex) {
        //... (suite du code)
    }
    
    /**
     * Obtenir l'index global
     */
    getGlobalIndex(pageIndex) {
        if (!this.config.features.pagination) {
            return pageIndex;
        }
        
        const start = (this.state.currentPage - 1) * this.config.pagination.itemsPerPage;
        return start + pageIndex;
    }
    
    // ========================================
    // SECTION 9 : GESTION DE LA SÉLECTION
    // ========================================
    
    /**
     * Toggle sélection globale
     */
    toggleSelectAll() {
        const checked = this.elements.selectAllCheckbox.checked;
        const pageData = this.getPageData();
        
        pageData.forEach((_, index) => {
            const globalIndex = this.getGlobalIndex(index);
            if (checked) {
                this.state.selectedRows.add(globalIndex);
            } else {
                this.state.selectedRows.delete(globalIndex);
            }
        });
        
        this.updateSelectionUI();
        this.triggerSelectionChange();
    }
    
    /**
     * Toggle sélection d'une ligne
     */
    toggleRowSelection(index) {
        const globalIndex = this.getGlobalIndex(index);
        
        if (this.state.selectedRows.has(globalIndex)) {
            this.state.selectedRows.delete(globalIndex);
        } else {
            this.state.selectedRows.add(globalIndex);
        }
        
        this.updateSelectionUI();
        this.triggerSelectionChange();
    }
    
    /**
     * Mettre à jour l'UI de sélection
     */
    updateSelectionUI() {
        if (!this.config.features.selection) return;
        
        // Mettre à jour les checkboxes
        const checkboxes = this.elements.tbody.querySelectorAll('.row-select');
        checkboxes.forEach((cb, index) => {
            const globalIndex = this.getGlobalIndex(index);
            cb.checked = this.state.selectedRows.has(globalIndex);
        });
        
        // Mettre à jour le select all
        if (this.elements.selectAllCheckbox) {
            const pageData = this.getPageData();
            const pageSelected = pageData.filter((_, index) => {
                const globalIndex = this.getGlobalIndex(index);
                return this.state.selectedRows.has(globalIndex);
            }).length;
            
            this.elements.selectAllCheckbox.checked = pageSelected === pageData.length && pageData.length > 0;
            this.elements.selectAllCheckbox.indeterminate = pageSelected > 0 && pageSelected < pageData.length;
        }
    }
    
    /**
     * Déclencher le callback de sélection
     */
    triggerSelectionChange() {
        if (this.config.onSelectionChange) {
            const selectedData = Array.from(this.state.selectedRows).map(index => 
                this.state.filteredData[index]
            );
            this.config.onSelectionChange(selectedData);
        }
    }

        /**
     * Gérer le clic sur un bouton d'action
     */
    handleActionClick(button, rowData) {
        const actionType = button.dataset.action;
        const actionIndex = parseInt(button.dataset.actionIndex);
        const rowIndex = parseInt(button.dataset.rowIndex);
        const columnIndex = parseInt(button.dataset.columnIndex);
        
        // Trouver la colonne d'actions par son index
        const actionColumn = this.config.columns[columnIndex];
        if (!actionColumn || !actionColumn.actions) return;
        
        // Trouver l'action correspondante
        const action = actionColumn.actions[actionIndex];
        if (!action) return;
        
        // Exécuter le callback de l'action
        if (action.onClick && typeof action.onClick === 'function') {
            action.onClick(rowData, rowIndex, button);
        }
        
        // Callback global optionnel
        if (this.config.onAction) {
            this.config.onAction(actionType, rowData, rowIndex);
        }
    }
    
    // ========================================
    // SECTION 10 : API PUBLIQUE
    // ========================================
    
    /**
     * Rafraîchir l'affichage
     */
    refresh() {
        this.renderBody();
        if (this.config.features.pagination) {
            this.renderPagination();
        }
        this.updateSelectionUI();
    }
    
    /**
     * Obtenir les lignes sélectionnées
     */
    getSelection() {
        return Array.from(this.state.selectedRows).map(index => 
            this.state.filteredData[index]
        );
    }
    
    /**
     * Alias pour compatibilité
     * @deprecated Utiliser getSelection() à la place
     */
    getSelectedRows() {
        console.warn('getSelectedRows() est déprécié, utiliser getSelection()');
        return this.getSelection();
    }
    
    /**
     * Effacer la sélection
     */
    clearSelection() {
        this.state.selectedRows.clear();
        this.updateSelectionUI();
        this.triggerSelectionChange();
    }
    
    /**
     * Obtenir l'état complet
     */
    getState() {
        return {
            loaded: this.state.loaded,
            data: [...this.state.data],
            filteredData: [...this.state.filteredData],
            currentPage: this.state.currentPage,
            sortColumn: this.state.sortColumn,
            sortDirection: this.state.sortDirection,
            selectedRows: Array.from(this.state.selectedRows)
        };
    }
    
    // ========================================
    // SECTION 11 : AFFICHAGE (ANTI-FOUC)
    // ========================================
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget
     */
    show() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Masque le widget
     */
    hide() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.remove('loaded');
        }
        this.state.loaded = false;
    }
    
    // ========================================
    // SECTION 12 : DESTRUCTION
    // ========================================
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy() {
        // Nettoyer les event listeners resize
        if (this.config.features.resize) {
            document.removeEventListener('mousemove', this.doResize);
            document.removeEventListener('mouseup', this.stopResize);
        }
        
        // Vider container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser état
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc',
            selectedRows: new Set(),
            loading: false,
            loaded: false,
            columnWidths: {},
            resizing: {
                active: false,
                column: null,
                startX: 0,
                startWidth: 0
            }
        };
        
        // Réinitialiser éléments
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            table: null,
            thead: null,
            tbody: null,
            selectAllCheckbox: null,
            exportButtons: null,
            paginationContainer: null
        };
        
        console.log('🗑️ DataGridWidget détruit:', this.id);
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default DataGridWidget;