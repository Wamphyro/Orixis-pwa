// ========================================
// SEARCH-DROPDOWN.COMPONENT.JS - Composant de recherche avec dropdown
// Chemin: src/components/ui/search-dropdown/search-dropdown.component.js
//
// DESCRIPTION:
// Composant générique de recherche avec résultats en dropdown
// Réutilisable pour clients, produits, ou toute autre recherche
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(options)
// - getValue()
// - setValue(value)
// - getSelectedItem()
// - setSelectedItem(item)
// - setEnabled(enabled)
// - clear()
// - focus()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onSearch: (query) => Promise<results>
// - onSelect: (item) => void
// - renderItem: (item) => string
// - getValue: (item) => string
//
// EXEMPLE:
// const searchClient = new SearchDropdown({
//     container: '#clientSearchContainer',
//     placeholder: 'Rechercher un client...',
//     onSearch: async (query) => { return results; },
//     onSelect: (item) => { console.log('Sélectionné:', item); }
// });
// ========================================

export class SearchDropdown {
    constructor(options = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'search-dropdown-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
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
        this.isMobile = window.innerWidth <= 768;
        
        if (this.options.container) {
            this.init();
        }
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
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
        
        console.log('✅ SearchDropdown initialisé:', this.id);
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
        link.href = '../../src/components/ui/search-dropdown/search-dropdown.css';
        document.head.appendChild(link);
        
        console.log('📦 SearchDropdown styles chargés');
    }
    
    createElements() {
        // Nettoyer le conteneur
        this.container.innerHTML = '';
        this.container.className = 'search-dropdown-container';
        this.container.id = this.id;
        
        // Créer le wrapper de l'input
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'search-dropdown-input-wrapper';
        
        // Créer l'input
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'search-dropdown-input';
        this.input.placeholder = this.options.placeholder;
        
        // Sur mobile, augmenter la taille de police pour éviter le zoom
        if (this.isMobile) {
            this.input.style.fontSize = '16px';
        }
        
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
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
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
            // Pour mobile, ajouter aussi touchstart
            if (this.isMobile) {
                document.addEventListener('touchstart', this.handleClickOutside.bind(this));
            }
        }
        
        // Détecter le changement d'orientation mobile
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            if (this.resultsContainer.classList.contains('active')) {
                this.adjustResultsPosition();
            }
        });
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
                    // Sur mobile, scroller vers l'élément
                    if (this.isMobile && items[currentIndex + 1]) {
                        items[currentIndex + 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    this.highlightItem(items[currentIndex - 1]);
                    // Sur mobile, scroller vers l'élément
                    if (this.isMobile && items[currentIndex - 1]) {
                        items[currentIndex - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
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
                // Sur mobile, fermer aussi le clavier
                if (this.isMobile) {
                    this.input.blur();
                }
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
    
    // ========================================
    // MÉTHODES DE RECHERCHE ET AFFICHAGE
    // ========================================
    
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
                
                // Sur mobile, ajouter touch events
                if (this.isMobile) {
                    itemEl.addEventListener('touchstart', (e) => {
                        e.preventDefault(); // Éviter le delay de 300ms
                        this.highlightItem(itemEl);
                    });
                    itemEl.addEventListener('touchend', (e) => {
                        e.preventDefault();
                        this.selectItem(this.results[index]);
                    });
                }
            });
        }
        
        this.showResults();
        
        // Sur mobile, scroll automatique vers les résultats
        if (this.isMobile && this.results.length > 0) {
            setTimeout(() => {
                this.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
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
        
        // Sur mobile, fermer le clavier
        if (this.isMobile) {
            this.input.blur();
        }
        
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
    
    // Méthode pour ajuster la position des résultats
    adjustResultsPosition() {
        if (!this.input || !this.resultsContainer) return;
        
        const inputRect = this.input.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        
        // Reset les styles
        this.resultsContainer.style.position = '';
        this.resultsContainer.style.top = '';
        this.resultsContainer.style.bottom = '';
        this.resultsContainer.style.left = '';
        this.resultsContainer.style.right = '';
        this.resultsContainer.style.width = '';
        this.resultsContainer.style.maxHeight = '';
        
        if (this.isMobile) {
            // Sur mobile, position fixe
            this.resultsContainer.style.position = 'fixed';
            this.resultsContainer.style.left = `${inputRect.left}px`;
            this.resultsContainer.style.width = `${inputRect.width}px`;
            this.resultsContainer.style.zIndex = '9999';
            
            // Décider si afficher en haut ou en bas
            if (spaceBelow > 200 || spaceBelow > spaceAbove) {
                // Afficher en bas
                this.resultsContainer.style.top = `${inputRect.bottom + 5}px`;
                this.resultsContainer.style.maxHeight = `${Math.min(spaceBelow - 20, 300)}px`;
            } else {
                // Afficher en haut
                this.resultsContainer.style.bottom = `${viewportHeight - inputRect.top + 5}px`;
                this.resultsContainer.style.maxHeight = `${Math.min(spaceAbove - 20, 300)}px`;
            }
        }
    }
    
    showResults() {
        if (this.resultsContainer) {
            this.resultsContainer.classList.add('active');
            
            // Ajuster la position sur mobile
            if (this.isMobile) {
                this.adjustResultsPosition();
                
                // Empêcher le scroll du body quand les résultats sont ouverts
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    hideResults() {
        if (this.resultsContainer) {
            this.resultsContainer.classList.remove('active');
            
            // Restaurer le scroll du body sur mobile
            if (this.isMobile) {
                document.body.style.overflow = '';
            }
        }
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
     * Effacer
     */
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
            if (this.isMobile) {
                document.removeEventListener('touchstart', this.handleClickOutside.bind(this));
            }
        }
        
        window.removeEventListener('resize', this.adjustResultsPosition);
        
        // Restaurer le scroll du body si nécessaire
        if (this.isMobile) {
            document.body.style.overflow = '';
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
        
        console.log('🧹 SearchDropdown détruit:', this.id);
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