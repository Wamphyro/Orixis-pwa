// ========================================
// DATATABLE.PAGINATION.JS - Module de pagination pour DataTable
// Chemin: src/js/shared/ui/datatable/datatable.pagination.js
// ========================================

export class DataTablePagination {
    constructor(datatable) {
        this.datatable = datatable;
    }
    
    /**
     * Générer l'interface de pagination
     */
    render() {
        const config = this.datatable.config.pagination;
        const state = this.datatable.state;
        
        // Calculer les infos de pagination
        const totalItems = state.filteredData.length;
        const totalPages = Math.ceil(totalItems / config.itemsPerPage);
        const currentPage = state.currentPage;
        
        // Calculer la plage d'éléments affichés
        const start = (currentPage - 1) * config.itemsPerPage + 1;
        const end = Math.min(currentPage * config.itemsPerPage, totalItems);
        
        let html = '<div class="pagination-wrapper">';
        
        // Sélecteur du nombre d'éléments par page
        if (config.pageSizeOptions) {
            html += this.renderPageSizeSelector();
        }
        
        // Informations
        if (config.showPageInfo) {
            html += `
                <div class="pagination-info">
                    ${start}-${end} ${this.datatable.config.messages.of} ${totalItems} ${this.datatable.config.messages.items}
                </div>
            `;
        }
        
        // Boutons de navigation
        html += '<div class="pagination-controls">';
        
        // Première page
        if (config.showFirstLast) {
            html += `
                <button class="pagination-btn pagination-first" 
                        ${currentPage === 1 ? 'disabled' : ''}
                        data-page="1">
                    ⏮️
                </button>
            `;
        }
        
        // Page précédente
        html += `
            <button class="pagination-btn pagination-prev" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    data-page="${currentPage - 1}">
                ← Précédent
            </button>
        `;
        
        // Numéros de pages
        html += this.renderPageNumbers(currentPage, totalPages);
        
        // Page suivante
        html += `
            <button class="pagination-btn pagination-next" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    data-page="${currentPage + 1}">
                Suivant →
            </button>
        `;
        
        // Dernière page
        if (config.showFirstLast) {
            html += `
                <button class="pagination-btn pagination-last" 
                        ${currentPage === totalPages ? 'disabled' : ''}
                        data-page="${totalPages}">
                    ⏭️
                </button>
            `;
        }
        
        html += '</div></div>';
        
        // Mettre à jour le DOM
        const container = this.datatable.elements.paginationContainer;
        if (container) {
            container.innerHTML = html;
            this.attachEvents();
        }
    }
    
    /**
     * Générer le sélecteur de taille de page
     */
    renderPageSizeSelector() {
        const options = this.datatable.config.pagination.pageSizeOptions;
        const current = this.datatable.config.pagination.itemsPerPage;
        
        let html = `
            <div class="pagination-size">
                <label>${this.datatable.config.messages.itemsPerPage}:</label>
                <select class="page-size-select">
        `;
        
        options.forEach(size => {
            html += `<option value="${size}" ${size === current ? 'selected' : ''}>${size}</option>`;
        });
        
        html += '</select></div>';
        
        return html;
    }
    
    /**
     * Générer les numéros de pages
     */
    renderPageNumbers(current, total) {
        if (total <= 1) return '';
        
        let html = '<div class="pagination-numbers">';
        
        // Logique pour afficher les pages
        const maxVisible = 5;
        let start = Math.max(1, current - Math.floor(maxVisible / 2));
        let end = Math.min(total, start + maxVisible - 1);
        
        // Ajuster si on est proche de la fin
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        // Première page + ellipsis si nécessaire
        if (start > 1) {
            html += '<button class="pagination-btn" data-page="1">1</button>';
            if (start > 2) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
        }
        
        // Pages visibles
        for (let i = start; i <= end; i++) {
            html += `
                <button class="pagination-btn ${i === current ? 'active' : ''}" 
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        // Dernière page + ellipsis si nécessaire
        if (end < total) {
            if (end < total - 1) {
                html += '<span class="pagination-ellipsis">...</span>';
            }
            html += `<button class="pagination-btn" data-page="${total}">${total}</button>`;
        }
        
        html += '</div>';
        
        return html;
    }
    
    /**
     * Attacher les événements
     */
    attachEvents() {
        const container = this.datatable.elements.paginationContainer;
        
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
    
    /**
     * Aller à une page
     */
    goToPage(page) {
        const totalPages = Math.ceil(
            this.datatable.state.filteredData.length / 
            this.datatable.config.pagination.itemsPerPage
        );
        
        // Vérifier les limites
        if (page < 1 || page > totalPages) return;
        
        this.datatable.state.currentPage = page;
        this.datatable.refresh();
        
        // Callback
        if (this.datatable.config.onPageChange) {
            this.datatable.config.onPageChange(page);
        }
    }
    
    /**
     * Changer la taille de page
     */
    changePageSize(size) {
        this.datatable.config.pagination.itemsPerPage = size;
        this.datatable.state.currentPage = 1;
        this.datatable.refresh();
    }
}