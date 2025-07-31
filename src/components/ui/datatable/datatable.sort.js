// ========================================
// DATATABLE.SORT.JS - Module de tri pour DataTable
// Chemin: src/js/shared/ui/datatable/datatable.sort.js
// ========================================

export class DataTableSort {
    constructor(datatable) {
        this.datatable = datatable;
    }
    
    /**
     * Trier par une colonne
     */
    sort(columnKey) {
        const state = this.datatable.state;
        
        // Inverser la direction si même colonne
        if (state.sortColumn === columnKey) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortColumn = columnKey;
            state.sortDirection = 'asc';
        }
        
        // Trouver la configuration de la colonne
        const column = this.datatable.config.columns.find(col => col.key === columnKey);
        if (!column) return;
        
        // Trier les données
        state.filteredData.sort((a, b) => {
            let valueA = this.datatable.getNestedValue(a, columnKey);
            let valueB = this.datatable.getNestedValue(b, columnKey);
            
            // Fonction de tri personnalisée
            if (column.sortFunction) {
                return column.sortFunction(valueA, valueB, state.sortDirection);
            }
            
            // Tri par défaut
            return this.defaultSort(valueA, valueB, state.sortDirection);
        });
        
        // Mettre à jour l'UI
        this.updateSortUI();
        
        // Rafraîchir le tableau
        this.datatable.refresh();
        
        // Callback
        if (this.datatable.config.onSort) {
            this.datatable.config.onSort(columnKey, state.sortDirection);
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
        const state = this.datatable.state;
        
        // Réinitialiser tous les indicateurs
        this.datatable.elements.thead.querySelectorAll('.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.textContent = '↕️';
        });
        
        // Mettre à jour la colonne active
        const activeHeader = this.datatable.elements.thead.querySelector(`[data-column="${state.sortColumn}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${state.sortDirection}`);
            const icon = activeHeader.querySelector('.sort-icon');
            if (icon) {
                icon.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
            }
        }
    }
}