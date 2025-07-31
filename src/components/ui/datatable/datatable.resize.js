// ========================================
// DATATABLE.RESIZE.JS - Module de redimensionnement pour DataTable
// Chemin: src/js/shared/ui/datatable/datatable.resize.js
// ========================================

export class DataTableResize {
    constructor(datatable) {
        this.datatable = datatable;
        this.isResizing = false;
        this.currentColumn = null;
        this.startX = 0;
        this.startWidth = 0;
        
        this.init();
    }
    
    /**
     * Initialiser le redimensionnement
     */
    init() {
        // Attacher les événements aux poignées
        this.datatable.elements.thead.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startResize(e));
        });
        
        // Événements globaux
        document.addEventListener('mousemove', (e) => this.doResize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }
    
    /**
     * Commencer le redimensionnement
     */
    startResize(e) {
        e.preventDefault();
        
        this.isResizing = true;
        this.currentColumn = e.target.closest('th');
        this.startX = e.pageX;
        this.startWidth = this.currentColumn.offsetWidth;
        
        // Ajouter la classe de redimensionnement
        document.body.classList.add('datatable-resizing');
        this.currentColumn.classList.add('resizing');
    }
    
    /**
     * Effectuer le redimensionnement
     */
    doResize(e) {
        if (!this.isResizing) return;
        
        const diff = e.pageX - this.startX;
        const newWidth = Math.max(50, this.startWidth + diff); // Min 50px
        
        this.currentColumn.style.width = newWidth + 'px';
        
        // Sauvegarder la largeur
        const columnIndex = this.currentColumn.dataset.index;
        this.datatable.config.columns[columnIndex].width = newWidth;
    }
    
    /**
     * Arrêter le redimensionnement
     */
    stopResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        document.body.classList.remove('datatable-resizing');
        
        if (this.currentColumn) {
            this.currentColumn.classList.remove('resizing');
        }
        
        this.currentColumn = null;
    }
    
    /**
     * Détruire le module
     */
    destroy() {
        // Les événements sur document seront nettoyés automatiquement
        // quand la page sera déchargée
    }
}