// ========================================
// SEARCH-DROPDOWN.COMPONENT.JS - Composant de recherche avec dropdown
// ========================================
// Chemin: src/js/shared/ui/search-dropdown.component.js
//
// DESCRIPTION:
// Composant générique de recherche avec résultats en dropdown.
// Réutilisable pour clients, produits, ou toute autre recherche.
//
// MODIFICATIONS:
// [28/01/2025] - Ajout de protections contre les éléments null
//
// UTILISATION:
// const searchClient = new SearchDropdown({
//     container: '#clientSearchContainer',
//     placeholder: 'Rechercher un client...',
//     onSearch: async (query) => { return results; },
//     onSelect: (item) => { console.log('Sélectionné:', item); }
// });
// ========================================

export class SearchDropdown {
    constructor(options = {}) {
        this.options = {
            container: null,
            placeholder: 'Rechercher...',
            minLength: 2,
            debounceTime: 300,
            maxResults: 10,
            noResultsText: 'Aucun résultat trouvé',
            loadingText: 'Recherche en cours...',
            
            // Callbacks
            onSearch: null,        // Fonction de recherche (doit retourner une promesse)
            onSelect: null,        // Fonction appelée lors de la sélection
            renderItem: null,      // Fonction pour personnaliser l'affichage d'un item
            getValue: null,        // Fonction pour obtenir la valeur affichée d'un item
            
            // Options d'affichage
            showClearButton: true,
            autoFocus: false,
            closeOnSelect: true,
            closeOnClickOutside: true,
            
            ...options
        };
        
        this.container = null;
        this.input = null;
        this.resultsContainer = null;
        this.clearButton = null;
        this.selectedItem = null;
        this.searchTimeout = null;
        this.isLoading = false;
        this.results = [];
        
        if (this.options.container) {
            this.init();
        }
    }
    
    init() {
        // Trouver ou créer le conteneur
        this.container = typeof this.options.container === 'string'
            ? document.querySelector(this.options.container)
            : this.options.container;
            
        if (!this.container) {
            console.error('SearchDropdown: Conteneur non trouvé');
            return;
        }
        
        // Charger les styles
        this.loadStyles();
        
        // Créer la structure HTML
        this.createElements();
        
        // Attacher les événements
        this.attachEvents();
        
        // Auto-focus si demandé
        if (this.options.autoFocus) {
            setTimeout(() => this.input.focus(), 100);
        }
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('search-dropdown-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'search-dropdown-styles';
        link.rel = 'stylesheet';
        link.href = '../src/css/shared/ui/search-dropdown.css';
        document.head.appendChild(link);
        
        console.log('✅ SearchDropdown styles chargés');
    }
    
    createElements() {
        // Nettoyer le conteneur
        this.container.innerHTML = '';
        this.container.className = 'search-dropdown-container';
        
        // Créer le wrapper de l'input
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'search-dropdown-input-wrapper';
        
        // Créer l'input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'search-dropdown-input';
        this.input.placeholder = this.options.placeholder;
        
        inputWrapper.appendChild(this.input);
        
        // Créer le bouton clear si activé
        if (this.options.showClearButton) {
            this.clearButton = document.createElement('button');
            this.clearButton.className = 'search-dropdown-clear';
            this.clearButton.innerHTML = '×';
            this.clearButton.style.display = 'none';
            this.clearButton.type = 'button';
            inputWrapper.appendChild(this.clearButton);
        }
        
        // Créer le conteneur de résultats
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'search-dropdown-results';
        
        // Ajouter au conteneur principal
        this.container.appendChild(inputWrapper);
        this.container.appendChild(this.resultsContainer);
    }
    
    attachEvents() {
        // Input events
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        
        // Clear button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', this.clear.bind(this));
        }
        
        // Click outside
        if (this.options.closeOnClickOutside) {
            document.addEventListener('click', this.handleClickOutside.bind(this));
        }
    }
    
    handleInput(e) {
        const query = e.target.value.trim();
        
        // Afficher/masquer le bouton clear
        if (this.clearButton) {
            this.clearButton.style.display = query ? 'block' : 'none';
        }
        
        // Annuler la recherche précédente
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Si la query est trop courte
        if (query.length < this.options.minLength) {
            this.hideResults();
            return;
        }
        
        // Debounce la recherche
        this.searchTimeout = setTimeout(() => {
            this.search(query);
        }, this.options.debounceTime);
    }
    
    handleKeydown(e) {
        const items = this.resultsContainer.querySelectorAll('.search-dropdown-item');
        const activeItem = this.resultsContainer.querySelector('.search-dropdown-item.active');
        let currentIndex = Array.from(items).indexOf(activeItem);
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    this.highlightItem(items[currentIndex + 1]);
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    this.highlightItem(items[currentIndex - 1]);
                }
                break;
                
            case 'Enter':
                e.preventDefault();
                if (activeItem) {
                    const index = activeItem.dataset.index;
                    this.selectItem(this.results[index]);
                }
                break;
                
            case 'Escape':
                this.hideResults();
                break;
        }
    }
    
    handleFocus() {
        // Si on a déjà des résultats, les réafficher
        if (this.results.length > 0 && this.input.value.length >= this.options.minLength) {
            this.showResults();
        }
    }
    
    handleClickOutside(e) {
        // Vérifier que container et resultsContainer existent
        if (this.container && this.resultsContainer && !this.container.contains(e.target)) {
            this.hideResults();
        }
    }
    
    async search(query) {
        if (!this.options.onSearch) {
            console.error('SearchDropdown: Aucune fonction de recherche définie');
            return;
        }
        
        // Afficher le loading
        this.showLoading();
        
        try {
            // Appeler la fonction de recherche
            const results = await this.options.onSearch(query);
            
            // Limiter le nombre de résultats
            this.results = results.slice(0, this.options.maxResults);
            
            // Afficher les résultats
            this.displayResults();
            
        } catch (error) {
            console.error('SearchDropdown: Erreur lors de la recherche', error);
            this.showError('Erreur lors de la recherche');
        }
    }
    
    showLoading() {
        this.isLoading = true;
        this.resultsContainer.innerHTML = `
            <div class="search-dropdown-loading">
                ${this.options.loadingText}
            </div>
        `;
        this.showResults();
    }
    
    showError(message) {
        this.resultsContainer.innerHTML = `
            <div class="search-dropdown-error">
                ${message}
            </div>
        `;
        this.showResults();
    }
    
    displayResults() {
        this.isLoading = false;
        
        if (this.results.length === 0) {
            this.resultsContainer.innerHTML = `
                <div class="search-dropdown-no-results">
                    ${this.options.noResultsText}
                </div>
            `;
        } else {
            this.resultsContainer.innerHTML = this.results
                .map((item, index) => this.renderResultItem(item, index))
                .join('');
                
            // Attacher les événements aux items
            const items = this.resultsContainer.querySelectorAll('.search-dropdown-item');
            items.forEach((itemEl, index) => {
                itemEl.addEventListener('click', () => this.selectItem(this.results[index]));
                itemEl.addEventListener('mouseenter', () => this.highlightItem(itemEl));
            });
        }
        
        this.showResults();
    }
    
    renderResultItem(item, index) {
        // Si une fonction de rendu personnalisée est fournie
        if (this.options.renderItem) {
            const customHtml = this.options.renderItem(item);
            return `<div class="search-dropdown-item" data-index="${index}">${customHtml}</div>`;
        }
        
        // Rendu par défaut
        const value = this.getItemValue(item);
        return `
            <div class="search-dropdown-item" data-index="${index}">
                ${this.escapeHtml(value)}
            </div>
        `;
    }
    
    getItemValue(item) {
        if (this.options.getValue) {
            return this.options.getValue(item);
        }
        
        // Tentatives par défaut
        return item.label || item.name || item.nom || item.title || item.toString();
    }
    
    highlightItem(itemEl) {
        // Retirer la classe active de tous les items
        this.resultsContainer.querySelectorAll('.search-dropdown-item').forEach(el => {
            el.classList.remove('active');
        });
        
        // Ajouter la classe active à l'item courant
        if (itemEl) {
            itemEl.classList.add('active');
        }
    }
    
    selectItem(item) {
        this.selectedItem = item;
        
        // Mettre à jour l'input avec la valeur
        this.input.value = this.getItemValue(item);
        
        // Appeler le callback
        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
        
        // Fermer les résultats si demandé
        if (this.options.closeOnSelect) {
            this.hideResults();
        }
        
        // Déclencher un événement personnalisé
        this.container.dispatchEvent(new CustomEvent('select', {
            detail: { item }
        }));
    }
    
    showResults() {
        if (this.resultsContainer) {
            this.resultsContainer.classList.add('active');
        }
    }
    
    hideResults() {
        if (this.resultsContainer) {
            this.resultsContainer.classList.remove('active');
        }
    }
    
    clear() {
        this.input.value = '';
        this.selectedItem = null;
        this.results = [];
        this.hideResults();
        
        if (this.clearButton) {
            this.clearButton.style.display = 'none';
        }
        
        // Focus sur l'input
        this.input.focus();
        
        // Déclencher un événement
        this.container.dispatchEvent(new Event('clear'));
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Obtenir la valeur actuelle
     */
    getValue() {
        return this.input.value;
    }
    
    /**
     * Définir la valeur
     */
    setValue(value) {
        this.input.value = value;
        if (this.clearButton) {
            this.clearButton.style.display = value ? 'block' : 'none';
        }
    }
    
    /**
     * Obtenir l'item sélectionné
     */
    getSelectedItem() {
        return this.selectedItem;
    }
    
    /**
     * Définir l'item sélectionné
     */
    setSelectedItem(item) {
        this.selectedItem = item;
        if (item) {
            this.setValue(this.getItemValue(item));
        }
    }
    
    /**
     * Activer/désactiver
     */
    setEnabled(enabled) {
        this.input.disabled = !enabled;
        if (this.clearButton) {
            this.clearButton.disabled = !enabled;
        }
    }
    
    /**
     * Focus
     */
    focus() {
        this.input.focus();
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Retirer les événements
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (this.options.closeOnClickOutside) {
            document.removeEventListener('click', this.handleClickOutside.bind(this));
        }
        
        // Nettoyer le DOM seulement si le container existe
        if (this.container) {
            this.container.innerHTML = '';
            this.container.className = '';
        }
        
        // Nettoyer les références
        this.input = null;
        this.resultsContainer = null;
        this.clearButton = null;
        this.results = [];
        this.selectedItem = null;
    }
    
    // ========================================
    // HELPERS
    // ========================================
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default SearchDropdown;

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Protection contre les éléments null
// - Ajout de vérifications dans handleClickOutside
// - Protection dans showResults/hideResults
// - Protection dans destroy
//
// NOTES POUR REPRISES FUTURES:
// - Toujours vérifier l'existence des éléments DOM
// - Le composant peut être détruit avant que tous les events soient terminés
// ========================================