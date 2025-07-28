const TableComponent = (() => {
    'use strict';

    class UITable {
        constructor(options) {
            this.options = {
                columns: [],
                data: [],
                style: 'glassmorphism',
                features: {
                    search: true,
                    pagination: true,
                    sort: true,
                    pageSize: 20
                },
                ...options
            };
            
            this.currentPage = 1;
            this.searchTerm = '';
            this.sortColumn = null;
            this.sortDirection = 'asc';
            this.filteredData = [...this.options.data];
            
            this.init();
        }

        init() {
            this.createDOM();
            this.attachEvents();
            this.render();
        }

        createDOM() {
            // Container principal avec style
            this.container = document.createElement('div');
            this.container.className = `ui-table-container ${this.options.style}`;
            
            // Toolbar
            if (this.options.features.search) {
                this.toolbar = document.createElement('div');
                this.toolbar.className = 'table-toolbar';
                
                const toolbarLeft = document.createElement('div');
                toolbarLeft.className = 'toolbar-left';
                
                // Search box
                const searchContainer = document.createElement('div');
                searchContainer.className = 'table-search';
                searchContainer.innerHTML = `
                    <span class="table-search-icon">🔍</span>
                    <input type="text" placeholder="Rechercher...">
                `;
                this.searchInput = searchContainer.querySelector('input');
                
                toolbarLeft.appendChild(searchContainer);
                this.toolbar.appendChild(toolbarLeft);
                this.container.appendChild(this.toolbar);
            }
            
            // Wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'ui-table-wrapper';
            
            // Table
            this.table = document.createElement('table');
            this.table.className = 'ui-table';
            
            // Header
            this.thead = document.createElement('thead');
            this.createHeader();
            this.table.appendChild(this.thead);
            
            // Body
            this.tbody = document.createElement('tbody');
            this.table.appendChild(this.tbody);
            
            this.wrapper.appendChild(this.table);
            this.container.appendChild(this.wrapper);
            
            // Pagination
            if (this.options.features.pagination) {
                this.pagination = document.createElement('div');
                this.pagination.className = 'table-pagination';
                this.pagination.innerHTML = `
                    <div class="pagination-info"></div>
                    <div class="pagination-controls">
                        <button class="pagination-button" data-action="first">⟨⟨</button>
                        <button class="pagination-button" data-action="prev">⟨</button>
                        <div class="page-numbers"></div>
                        <button class="pagination-button" data-action="next">⟩</button>
                        <button class="pagination-button" data-action="last">⟩⟩</button>
                    </div>
                `;
                this.container.appendChild(this.pagination);
            }
        }

        createHeader() {
            const tr = document.createElement('tr');
            
            this.options.columns.forEach(column => {
                const th = document.createElement('th');
                th.dataset.key = column.key;
                
                if (column.sortable !== false && this.options.features.sort) {
                    th.className = 'sortable';
                    th.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>${column.label || column.key}</span>
                            <span class="sort-indicator">↕</span>
                        </div>
                    `;
                } else {
                    th.textContent = column.label || column.key;
                }
                
                // Alignement selon le type
                if (column.type === 'number' || column.type === 'currency') {
                    th.style.textAlign = 'right';
                } else if (column.type === 'actions') {
                    th.style.textAlign = 'center';
                }
                
                tr.appendChild(th);
            });
            
            this.thead.appendChild(tr);
        }

        attachEvents() {
            // Recherche
            if (this.searchInput) {
                let debounceTimer;
                this.searchInput.addEventListener('input', (e) => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        this.searchTerm = e.target.value.toLowerCase();
                        this.filterData();
                        this.currentPage = 1;
                        this.render();
                    }, 300);
                });
            }
            
            // Tri
            if (this.options.features.sort) {
                this.thead.addEventListener('click', (e) => {
                    const th = e.target.closest('th.sortable');
                    if (th) {
                        const key = th.dataset.key;
                        if (this.sortColumn === key) {
                            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                        } else {
                            this.sortColumn = key;
                            this.sortDirection = 'asc';
                        }
                        this.sortData();
                        this.render();
                        this.updateSortIndicators();
                    }
                });
            }
            
            // Pagination
            if (this.pagination) {
                this.pagination.addEventListener('click', (e) => {
                    const btn = e.target.closest('.pagination-button');
                    if (btn && !btn.disabled) {
                        const action = btn.dataset.action;
                        const totalPages = this.getTotalPages();
                        
                        if (action === 'first') this.currentPage = 1;
                        else if (action === 'prev') this.currentPage = Math.max(1, this.currentPage - 1);
                        else if (action === 'next') this.currentPage = Math.min(totalPages, this.currentPage + 1);
                        else if (action === 'last') this.currentPage = totalPages;
                        else if (btn.dataset.page) this.currentPage = parseInt(btn.dataset.page);
                        
                        this.render();
                    }
                });
            }
        }

        filterData() {
            if (!this.searchTerm) {
                this.filteredData = [...this.options.data];
                return;
            }
            
            this.filteredData = this.options.data.filter(row => {
                return this.options.columns.some(col => {
                    const value = this.getCellValue(row, col.key);
                    return String(value).toLowerCase().includes(this.searchTerm);
                });
            });
        }

        sortData() {
            if (!this.sortColumn) return;
            
            this.filteredData.sort((a, b) => {
                const aVal = this.getCellValue(a, this.sortColumn);
                const bVal = this.getCellValue(b, this.sortColumn);
                
                let result = 0;
                if (aVal < bVal) result = -1;
                else if (aVal > bVal) result = 1;
                
                return this.sortDirection === 'asc' ? result : -result;
            });
        }

        getCellValue(row, key) {
            return key.split('.').reduce((obj, k) => obj?.[k], row);
        }

        render() {
            // Vider le tbody
            this.tbody.innerHTML = '';
            
            // Calculer les données à afficher
            const pageSize = this.options.features.pageSize || 20;
            const start = (this.currentPage - 1) * pageSize;
            const end = start + pageSize;
            const pageData = this.filteredData.slice(start, end);
            
            // Afficher "Aucune donnée" si vide
            if (pageData.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = this.options.columns.length;
                td.innerHTML = `
                    <div class="table-empty">
                        <div class="table-empty-icon">📊</div>
                        <div class="table-empty-text">Aucune donnée à afficher</div>
                    </div>
                `;
                tr.appendChild(td);
                this.tbody.appendChild(tr);
                this.updatePagination();
                return;
            }
            
            // Créer les lignes
            pageData.forEach((row, index) => {
                const tr = document.createElement('tr');
                
                // Event click sur la ligne
                if (this.options.onRowClick) {
                    tr.style.cursor = 'pointer';
                    tr.addEventListener('click', (e) => {
                        if (!e.target.closest('.action-btn')) {
                            this.options.onRowClick(row);
                        }
                    });
                }
                
                // Cellules
                this.options.columns.forEach(column => {
                    const td = document.createElement('td');
                    td.setAttribute('data-label', column.label || column.key);
                    
                    const value = this.getCellValue(row, column.key);
                    
                    // Rendu personnalisé
                    if (column.render) {
                        const rendered = column.render(value, row);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else if (rendered) {
                            td.appendChild(rendered);
                        }
                    } else {
                        // Rendu par défaut selon le type
                        switch (column.type) {
                            case 'currency':
                                td.textContent = new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR'
                                }).format(value || 0);
                                break;
                            case 'date':
                                td.textContent = value ? new Date(value).toLocaleDateString('fr-FR') : '';
                                break;
                            case 'boolean':
                                td.innerHTML = `<span class="table-boolean ${value ? 'true' : 'false'}">${value ? '✓' : '✗'}</span>`;
                                break;
                            default:
                                td.textContent = value || '';
                        }
                    }
                    
                    // Alignement
                    if (column.type === 'number' || column.type === 'currency') {
                        td.style.textAlign = 'right';
                    } else if (column.type === 'actions') {
                        td.style.textAlign = 'center';
                    }
                    
                    tr.appendChild(td);
                });
                
                this.tbody.appendChild(tr);
            });
            
            // Mettre à jour la pagination
            this.updatePagination();
        }

        updateSortIndicators() {
            this.thead.querySelectorAll('.sort-indicator').forEach(indicator => {
                const th = indicator.closest('th');
                const key = th.dataset.key;
                
                indicator.classList.remove('active');
                if (key === this.sortColumn) {
                    indicator.classList.add('active');
                    indicator.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
                } else {
                    indicator.textContent = '↕';
                }
            });
        }

        updatePagination() {
            if (!this.pagination) return;
            
            const total = this.filteredData.length;
            const pageSize = this.options.features.pageSize || 20;
            const totalPages = this.getTotalPages();
            const start = (this.currentPage - 1) * pageSize + 1;
            const end = Math.min(this.currentPage * pageSize, total);
            
            // Info
            const info = this.pagination.querySelector('.pagination-info');
            info.textContent = total > 0 
                ? `${start}-${end} sur ${total} éléments`
                : 'Aucun élément';
            
            // Boutons
            const buttons = this.pagination.querySelectorAll('.pagination-button');
            buttons.forEach(btn => {
                const action = btn.dataset.action;
                if (action === 'first' || action === 'prev') {
                    btn.disabled = this.currentPage === 1;
                } else if (action === 'next' || action === 'last') {
                    btn.disabled = this.currentPage === totalPages || totalPages === 0;
                }
            });
            
            // Numéros de page
            const pageNumbers = this.pagination.querySelector('.page-numbers');
            pageNumbers.innerHTML = '';
            
            if (totalPages <= 7) {
                // Afficher toutes les pages
                for (let i = 1; i <= totalPages; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'pagination-button';
                    btn.textContent = i;
                    btn.dataset.page = i;
                    if (i === this.currentPage) btn.classList.add('active');
                    pageNumbers.appendChild(btn);
                }
            } else {
                // Afficher avec ellipses
                const pages = [];
                if (this.currentPage <= 4) {
                    pages.push(1, 2, 3, 4, 5, '...', totalPages);
                } else if (this.currentPage >= totalPages - 3) {
                    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                } else {
                    pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages);
                }
                
                pages.forEach(page => {
                    if (page === '...') {
                        const span = document.createElement('span');
                        span.textContent = '...';
                        span.style.padding = '0 8px';
                        pageNumbers.appendChild(span);
                    } else {
                        const btn = document.createElement('button');
                        btn.className = 'pagination-button';
                        btn.textContent = page;
                        btn.dataset.page = page;
                        if (page === this.currentPage) btn.classList.add('active');
                        pageNumbers.appendChild(btn);
                    }
                });
            }
        }

        getTotalPages() {
            const pageSize = this.options.features.pageSize || 20;
            return Math.ceil(this.filteredData.length / pageSize);
        }

        // API publique
        getElement() {
            return this.container;
        }

        setData(data) {
            this.options.data = data;
            this.filteredData = [...data];
            this.filterData();
            this.sortData();
            this.render();
        }

        refresh() {
            this.render();
        }
    }

    // Fonction de création
    function create(options) {
        return new UITable(options);
    }

    return { create };
})();

export default TableComponent;