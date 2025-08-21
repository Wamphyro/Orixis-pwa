// ========================================
// DATATABLE.COMPONENT.JS - Composant tableau réutilisable
// Chemin: src/components/ui/datatable/datatable.component.js
//
// DESCRIPTION:
// Tableau de données avancé avec tri, pagination, export et sélection
// Composant 100% autonome - aucune dépendance
//
// MODIFIÉ le 01/02/2025:
// - Injection des modules via config
// - Injection des classes CSS via config
// - 100% indépendant
// ========================================

export class DataTable {
    constructor(config) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'datatable-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            container: null,
            columns: [],
            data: [],
            
            // 🔑 INJECTION DES MODULES (IoC)
            modules: {
                SortClass: null,
                ExportClass: null,
                PaginationClass: null,
                ResizeClass: null
            },
            
            // 🔑 INJECTION DES CLASSES CSS (IoC)
            buttonClasses: {
                export: 'btn btn-export',      // Classes par défaut
                action: 'btn-action',          // Classes par défaut
                pagination: 'pagination-btn'    // Classes par défaut
            },
            
            // Features
            features: {
                sort: true,
                resize: true,
                export: true,
                selection: false,
                pagination: true
            },
            
            // Pagination
            pagination: {
                enabled: true,
                itemsPerPage: 20,
                pageSizeOptions: [10, 20, 50, 100],
                showFirstLast: true,
                showPageInfo: true
            },
            
            // Export
            export: {
                csv: true,
                excel: true,
                filename: 'export',
                onBeforeExport: null
            },
            
            // Styles
            styles: {
                useGradientHeader: true,
                striped: true,
                hover: true,
                bordered: true,
                containerClass: 'datatable-container'
            },
            
            // Messages
            messages: {
                noData: 'Aucune donnée disponible',
                loading: 'Chargement...',
                itemsPerPage: 'Éléments par page',
                page: 'Page',
                of: 'sur',
                items: 'éléments',
                selectedItems: 'éléments sélectionnés'
            },
            
            // Callbacks
            onRowClick: null,
            onSort: null,
            onPageChange: null,
            onExport: null,
            onSelectionChange: null,
            
            ...config
        };
        
        // Fusionner les classes CSS si fournies partiellement
        if (config.buttonClasses) {
            this.config.buttonClasses = {
                ...this.config.buttonClasses,
                ...config.buttonClasses
            };
        }
        
        // État interne
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc',
            selectedRows: new Set(),
            loading: false
        };
        
        // Modules (instances)
        this.modules = {
            sort: null,
            export: null,
            pagination: null,
            resize: null
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            table: null,
            thead: null,
            tbody: null,
            selectAllCheckbox: null,
            exportButtons: null,
            paginationContainer: null
        };
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Charger les styles
        this.loadStyles();
        
        // Vérifier le container
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            console.error('DataTable: Container non trouvé');
            return;
        }
        
        // Créer la structure AVANT d'initialiser les modules
        this.render();
        
        // 🔑 INITIALISER LES MODULES INJECTÉS
        this.initModules();
        
        // Charger les données si fournies
        if (this.config.data && this.config.data.length > 0) {
            this.setData(this.config.data);
        }
        
        console.log('✅ DataTable initialisé:', this.id);
    }

    /**
     * Charger les styles du composant
     */
    loadStyles() {
        const styleId = 'datatable-styles';
        
        if (!document.getElementById(styleId)) {
            // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
            const componentUrl = new URL(import.meta.url).href;
            const cssUrl = componentUrl.replace('.js', '.css');
            
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            
            console.log('📦 DataTable styles chargés depuis:', cssUrl);
        }
    }
    
    /**
     * Initialiser les modules injectés
     */
    initModules() {
        // Sort
        if (this.config.features.sort && this.config.modules.SortClass) {
            this.modules.sort = new this.config.modules.SortClass(this);
        }
        
        // Export
        if (this.config.features.export && this.config.modules.ExportClass) {
            this.modules.export = new this.config.modules.ExportClass(this);
        }
        
        // Pagination
        if (this.config.features.pagination && this.config.modules.PaginationClass) {
            this.modules.pagination = new this.config.modules.PaginationClass(this);
        }
        
        // Resize
        if (this.config.features.resize && this.config.modules.ResizeClass) {
            this.modules.resize = new this.config.modules.ResizeClass(this);
        }
        
        console.log('📦 Modules DataTable initialisés:', Object.keys(this.modules).filter(m => this.modules[m]));
    }
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    render() {
        const html = `
            <div class="datatable-wrapper" id="${this.id}">
                ${this.config.features.export ? this.renderExportButtons() : ''}
                
                <div class="${this.config.styles.containerClass}">
                    <table class="datatable ${this.getTableClasses()}">
                        <thead>
                            ${this.renderHeader()}
                        </thead>
                        <tbody>
                            ${this.renderNoData()}
                        </tbody>
                    </table>
                </div>
                
                ${this.config.features.pagination ? '<div class="datatable-pagination"></div>' : ''}
            </div>
        `;
        
        this.elements.container.innerHTML = html;
        
        // Récupérer les références
        this.elements.table = this.elements.container.querySelector('.datatable');
        this.elements.thead = this.elements.table.querySelector('thead');
        this.elements.tbody = this.elements.table.querySelector('tbody');
        
        if (this.config.features.pagination) {
            this.elements.paginationContainer = this.elements.container.querySelector('.datatable-pagination');
        }
        
        // Attacher les événements
        this.attachEvents();
    }
    
    getTableClasses() {
        const classes = ['datatable-table'];
        
        if (this.config.styles.striped) classes.push('datatable-striped');
        if (this.config.styles.hover) classes.push('datatable-hover');
        if (this.config.styles.bordered) classes.push('datatable-bordered');
        if (this.config.styles.useGradientHeader) classes.push('datatable-gradient-header');
        
        return classes.join(' ');
    }
    
    renderExportButtons() {
        const buttons = [];
        
        // 🔑 UTILISER LES CLASSES INJECTÉES
        const btnClass = this.config.buttonClasses.export;
        
        if (this.config.export.csv) {
            buttons.push(`<button class="${btnClass}" data-export="csv">📄 Export CSV</button>`);
        }
        
        if (this.config.export.excel) {
            buttons.push(`<button class="${btnClass}" data-export="excel">📊 Export Excel</button>`);
        }
        
        return `<div class="datatable-export-buttons">${buttons.join('')}</div>`;
    }
    
    renderHeader() {
        let html = '<tr>';
        
        // Checkbox de sélection globale
        if (this.config.features.selection) {
            html += `
                <th class="datatable-select-all" style="width: 40px;">
                    <input type="checkbox" class="select-all-checkbox">
                </th>
            `;
        }
        
        // Colonnes
        this.config.columns.forEach((column, index) => {
            const sortable = this.config.features.sort && column.sortable !== false;
            const resizable = this.config.features.resize && column.resizable !== false;
            const width = column.width ? `style="width: ${column.width}px"` : '';
            
            html += `
                <th class="datatable-header ${sortable ? 'sortable' : ''}" 
                    data-column="${column.key}" 
                    data-index="${index}"
                    ${width}>
                    <div class="header-content">
                        <span>${column.label}</span>
                        ${sortable ? '<span class="sort-icon">↕️</span>' : ''}
                    </div>
                    ${resizable ? '<div class="resize-handle"></div>' : ''}
                </th>
            `;
        });
        
        html += '</tr>';
        return html;
    }
    
    renderNoData() {
        const colspan = this.config.columns.length + (this.config.features.selection ? 1 : 0);
        return `
            <tr class="no-data">
                <td colspan="${colspan}" class="text-center">
                    ${this.state.loading ? this.config.messages.loading : this.config.messages.noData}
                </td>
            </tr>
        `;
    }
    
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
                    <td class="datatable-select">
                        <input type="checkbox" class="row-select" ${checked}>
                    </td>
                `;
            }
            
            // Colonnes de données
            this.config.columns.forEach(column => {
                const value = this.getNestedValue(row, column.key);
                const formatted = column.formatter ? column.formatter(value, row) : value;
                const className = column.className || '';
                
                // 🔑 Si c'est la colonne actions, utiliser la classe injectée
                if (column.key === 'actions' && formatted.includes('btn-action')) {
                    html += `<td class="${className}">${formatted.replace('btn-action', this.config.buttonClasses.action)}</td>`;
                } else {
                    html += `<td class="${className}">${formatted || ''}</td>`;
                }
            });
            
            html += '</tr>';
        });
        
        this.elements.tbody.innerHTML = html;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Sélection globale
        if (this.config.features.selection) {
            this.elements.selectAllCheckbox = this.elements.thead.querySelector('.select-all-checkbox');
            this.elements.selectAllCheckbox.addEventListener('change', () => this.toggleSelectAll());
        }
        
        // Tri
        if (this.config.features.sort) {
            this.elements.thead.querySelectorAll('.sortable').forEach(th => {
                th.addEventListener('click', (e) => {
                    // Ignorer si c'est le resize handle
                    if (!e.target.closest('.resize-handle')) {
                        const column = th.dataset.column;
                        this.sort(column);
                    }
                });
            });
        }
        
        // Export
        if (this.config.features.export) {
            this.elements.container.querySelectorAll('[data-export]').forEach(btn => {
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
                // Callback row click
                else if (this.config.onRowClick) {
                    this.config.onRowClick(rowData, index, e);
                }
            }
        });
    }
    
    // ========================================
    // MÉTHODES DE DONNÉES
    // ========================================
    
    setData(data) {
        this.state.data = data;
        this.state.filteredData = data;
        this.state.currentPage = 1;
        this.state.selectedRows.clear();
        
        this.refresh();
    }
    
    getRowData(index) {
        const pageData = this.getPageData();
        return pageData[index];
    }
    
    getPageData() {
        if (!this.config.features.pagination) {
            return this.state.filteredData;
        }
        
        const start = (this.state.currentPage - 1) * this.config.pagination.itemsPerPage;
        const end = start + this.config.pagination.itemsPerPage;
        
        return this.state.filteredData.slice(start, end);
    }
    
    refresh() {
        this.renderBody();
        
        if (this.config.features.pagination && this.modules.pagination) {
            this.modules.pagination.render();
        }
        
        this.updateSelectionUI();
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
    
    getGlobalIndex(pageIndex) {
        if (!this.config.features.pagination) {
            return pageIndex;
        }
        
        const start = (this.state.currentPage - 1) * this.config.pagination.itemsPerPage;
        return start + pageIndex;
    }
    
    // ========================================
    // GESTION DE LA SÉLECTION
    // ========================================
    
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
    
    updateSelectionUI() {
        if (!this.config.features.selection) return;
        
        // Mettre à jour les checkboxes
        const checkboxes = this.elements.tbody.querySelectorAll('.row-select');
        checkboxes.forEach((cb, index) => {
            const globalIndex = this.getGlobalIndex(index);
            cb.checked = this.state.selectedRows.has(globalIndex);
        });
        
        // Mettre à jour le select all
        const pageData = this.getPageData();
        const pageSelected = pageData.filter((_, index) => {
            const globalIndex = this.getGlobalIndex(index);
            return this.state.selectedRows.has(globalIndex);
        }).length;
        
        this.elements.selectAllCheckbox.checked = pageSelected === pageData.length && pageData.length > 0;
        this.elements.selectAllCheckbox.indeterminate = pageSelected > 0 && pageSelected < pageData.length;
    }
    
    triggerSelectionChange() {
        if (this.config.onSelectionChange) {
            const selectedData = Array.from(this.state.selectedRows).map(index => 
                this.state.filteredData[index]
            );
            this.config.onSelectionChange(selectedData);
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Trier les données
     */
    sort(column) {
        if (this.modules.sort) {
            this.modules.sort.sort(column);
        }
    }
    
    /**
     * Exporter les données
     */
    export(format) {
        if (this.modules.export) {
            this.modules.export.export(format);
        }
    }
    
    /**
     * Aller à une page
     */
    goToPage(page) {
        if (this.modules.pagination) {
            this.modules.pagination.goToPage(page);
        }
    }
    
    /**
     * Obtenir les lignes sélectionnées
     */
    getSelectedRows() {
        return Array.from(this.state.selectedRows).map(index => 
            this.state.filteredData[index]
        );
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
     * Mettre à jour la configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.render();
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Nettoyer les modules
        Object.values(this.modules).forEach(module => {
            if (module && module.destroy) {
                module.destroy();
            }
        });
        
        // Vider le container
        this.elements.container.innerHTML = '';
        
        // Réinitialiser l'état
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc',
            selectedRows: new Set()
        };
        
        console.log('🧹 DataTable détruit:', this.id);
    }
}

export default DataTable;