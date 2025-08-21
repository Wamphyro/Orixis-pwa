/* ========================================
   STATS-CARDS.WIDGET.JS - Widget de cartes statistiques
   Chemin: /widgets/stats-cards/stats-cards.widget.js
   
   DESCRIPTION:
   Widget réutilisable pour afficher des cartes de statistiques.
   Gère la sélection multiple, animations, formatage et tailles.
   Peut afficher un wrapper/container englobant optionnel.
   100% autonome, charge son CSS automatiquement.
   
   UTILISATION:
   import { StatsCardsWidget } from '/Orixis-pwa/widgets/stats-cards/stats-cards.widget.js';
   const stats = new StatsCardsWidget({
       container: '.stats',
       showWrapper: true,        // Active le container englobant
       cards: [...],
       onSelect: (ids) => {...}
   });
   
   API PUBLIQUE:
   - updateCard(id, value, animate)
   - updateAll(values, animate)
   - select(id) / deselect(id) / toggleSelect(id)
   - selectAll() / deselectAll() / getSelected()
   - setSize(size) / setColumns(columns)
   - refresh() / destroy()
   
   OPTIONS:
   - size: 'sm' | 'md' | 'lg' (défaut: 'md')
   - columns: 'auto' | 2 | 3 | 4 | 6 (défaut: 'auto')
   - animated: boolean (défaut: true)
   - format: 'number' | 'currency' | 'percent' | 'compact' (défaut: 'number')
   - selectionMode: 'none' | 'single' | 'multiple' (défaut: 'single')
   - showWrapper: boolean (défaut: false) - Affiche un container englobant
   - wrapperStyle: 'card' | 'minimal' | 'bordered' (défaut: 'card')
   - wrapperTitle: string (défaut: '') - Titre optionnel du wrapper
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale
   - 08/02/2025 : Ajout option showWrapper pour container englobant
   
   AUTEUR: Assistant Claude & [Ton nom]
   VERSION: 1.1.0
   ======================================== */

export class StatsCardsWidget {
    constructor(config = {}) {
        // Charger le CSS automatiquement
        this.loadCSS();
        
        // Configuration avec défauts
        this.config = {
            // Container
            container: config.container || null,
            
            // Apparence
            size: config.size || 'md',                    // 'xs' | 'sm' | 'md' | 'lg'
            columns: config.columns || 'auto',            // 'auto' | 2 | 3 | 4 | 6 | 13
            theme: config.theme || 'default',             // Pour compatibilité
            
            // Options du wrapper englobant
            showWrapper: config.showWrapper || false,     // Afficher un container englobant
            wrapperStyle: config.wrapperStyle || 'card',  // 'card' | 'minimal' | 'bordered'
            wrapperTitle: config.wrapperTitle || '',      // Titre optionnel du wrapper
            wrapperClass: config.wrapperClass || '',      // Classes CSS additionnelles
            
            // Options d'adaptation
            forceOneLine: config.forceOneLine || false,   // Force sur une ligne
            compact: config.compact || false,             // Mode ultra compact
            autoFit: config.autoFit || false,             // ⚠️ NOUVEAU : Adaptation automatique
            
            // Comportement
            animated: config.animated !== false,          // Animation des nombres
            format: config.format || 'number',            // Format des nombres
            selectionMode: config.selectionMode || 'single', // 'none' | 'single' | 'multiple'
            
            // Données
            cards: config.cards || [],
            
            // Callbacks
            onSelect: config.onSelect || null,            // (selectedIds) => void
            onClick: config.onClick || null,              // Compatibilité ancienne
            onUpdate: config.onUpdate || null,            // (id, oldValue, newValue) => void
        };
        
        // État interne
        this.state = {
            values: {},
            selected: [],
            enabled: {},
            loaded: false
        };
        
        // Références DOM
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            cards: {}
        };
        
        // ID unique pour le widget
        this.id = 'stats-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // SECTION 1 : INITIALISATION
    // ========================================
    
    /**
     * Charge le CSS automatiquement
     */
    loadCSS() {
        const cssId = 'stats-cards-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/stats-cards/stats-cards.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
        
        console.log('✅ CSS StatsCardsWidget chargé');
    }
    
    /**
     * Initialise le widget
     */
    async init() {
        try {
            this.setupContainer();
            this.initState();
            this.render();
            this.attachEvents();
            this.showWithDelay();
            
            console.log('✅ StatsCardsWidget initialisé:', this.id);
        } catch (error) {
            console.error('❌ Erreur init StatsCardsWidget:', error);
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
            throw new Error('StatsCardsWidget: Container non trouvé');
        }
    }
    
    /**
     * Initialise l'état avec les données de config
     */
    initState() {
        this.config.cards.forEach(card => {
            this.state.values[card.id] = card.value !== undefined ? card.value : 0;
            this.state.enabled[card.id] = card.enabled !== false;
        });
        
        // Initialiser la sélection si des cartes sont pré-sélectionnées
        if (this.config.selected) {
            this.state.selected = Array.isArray(this.config.selected) 
                ? [...this.config.selected] 
                : [this.config.selected];
        }
    }
    
    // ========================================
    // SECTION 2 : RENDU
    // ========================================
    
    /**
     * Génère et affiche le HTML
     * MODIFIÉ : Gère maintenant le wrapper optionnel
     */
    render() {
        // ========================================
        // NOUVEAU : Créer le wrapper si demandé
        // ========================================
        if (this.config.showWrapper) {
            this.renderWithWrapper();
        } else {
            this.renderWithoutWrapper();
        }
    }
    
    /**
     * NOUVEAU : Rendu avec wrapper englobant
     */
    renderWithWrapper() {
        // Créer le container englobant
        const container = document.createElement('div');
        container.className = this.buildContainerClasses();
        container.id = `${this.id}-container`;
        
        // Ajouter le titre si fourni
        if (this.config.wrapperTitle) {
            const title = document.createElement('div');
            title.className = 'stats-cards-container-title';
            title.textContent = this.config.wrapperTitle;
            container.appendChild(title);
        }
        
        // Créer le wrapper des cartes
        const wrapper = document.createElement('div');
        wrapper.className = this.buildWrapperClasses();
        wrapper.id = this.id;
        
        // Créer chaque carte
        this.config.cards.forEach(cardConfig => {
            const card = this.createCard(cardConfig);
            if (card) {
                wrapper.appendChild(card);
                this.elements.cards[cardConfig.id] = card;
            }
        });
        
        // Assembler
        container.appendChild(wrapper);
        
        // Sauvegarder les références
        this.elements.mainContainer = container;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(container);
    }
    
    /**
     * Rendu sans wrapper (comportement original)
     */
    renderWithoutWrapper() {
        // Créer le wrapper des cartes
        const wrapper = document.createElement('div');
        wrapper.className = this.buildWrapperClasses();
        wrapper.id = this.id;
        
        // Créer chaque carte
        this.config.cards.forEach(cardConfig => {
            const card = this.createCard(cardConfig);
            if (card) {
                wrapper.appendChild(card);
                this.elements.cards[cardConfig.id] = card;
            }
        });
        
        // Sauvegarder les références
        this.elements.mainContainer = wrapper;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(wrapper);
    }
    
    /**
     * NOUVEAU : Construit les classes du container englobant
     */
    buildContainerClasses() {
        const classes = ['stats-cards-container'];
        
        // Style du wrapper
        classes.push(`wrapper-${this.config.wrapperStyle}`);
        
        // Classes additionnelles
        if (this.config.wrapperClass) {
            classes.push(this.config.wrapperClass);
        }
        
        return classes.join(' ');
    }
    
    /**
     * Construit les classes du wrapper
     */
    buildWrapperClasses() {
        const classes = ['stats-cards-wrapper'];
        
        // Taille (avec support de 'xs')
        if (this.config.size === 'xs') {
            classes.push('size-sm'); // Utiliser sm comme base
            classes.push('size-xs'); // Ajouter une classe custom
        } else {
            classes.push(`size-${this.config.size}`);
        }
        
        // ⚠️ NOUVEAU : Mode auto-fit (prioritaire)
        if (this.config.autoFit) {
            classes.push('auto-fit');
            // Si autoFit est activé, on ignore forceOneLine et columns
        } else {
            // Forcer sur une ligne
            if (this.config.forceOneLine || this.config.columns === 13) {
                classes.push('force-one-line');
            }
            
            // Colonnes (avec support de 13)
            if (this.config.columns && this.config.columns !== 'auto') {
                if (this.config.columns === 13) {
                    classes.push('cols-13');
                } else {
                    classes.push(`cols-${this.config.columns}`);
                }
            }
        }
        
        // Mode compact
        if (this.config.compact) {
            classes.push('compact-mode');
        }
        
        // Thème (compatibilité)
        if (this.config.theme !== 'default') {
            classes.push(`theme-${this.config.theme}`);
        }
        
        // Mode sélection
        classes.push(`selection-${this.config.selectionMode}`);
        
        // Animations
        if (!this.config.animated) {
            classes.push('no-animation');
        }
        
        return classes.join(' ');
    }
    
    /**
     * Crée une carte
     */
    createCard(config) {
        const card = document.createElement('div');
        card.className = this.buildCardClasses(config);
        card.dataset.cardId = config.id;
        
        // Structure HTML
        const displayValue = this.formatNumber(config.value !== undefined ? config.value : 0);
        
        card.innerHTML = `
            ${config.icon ? `<div class="stat-icon">${config.icon}</div>` : ''}
            <div class="stat-content">
                <div class="stat-number" data-value="${config.value || 0}">
                    ${displayValue}
                </div>
                <div class="stat-label">${config.label}</div>
                ${config.sublabel ? `<div class="stat-sublabel">${config.sublabel}</div>` : ''}
            </div>
            ${config.trend ? this.createTrend(config.trend) : ''}
        `;
        
        // Marquer comme sélectionnée si nécessaire
        if (this.state.selected.includes(config.id)) {
            card.classList.add('selected');
        }
        
        return card;
    }
    
    /**
     * Construit les classes d'une carte
     */
    buildCardClasses(config) {
        const classes = ['stat-card'];
        
        // Couleur
        if (config.color) {
            classes.push(`stat-card-${config.color}`);
        }
        
        // Cliquable selon le mode de sélection
        if (this.config.selectionMode !== 'none') {
            classes.push('clickable');
        }
        
        // Hoverable
        if (config.hoverable !== false) {
            classes.push('hoverable');
        }
        
        // Désactivée
        if (!this.state.enabled[config.id]) {
            classes.push('disabled');
        }
        
        return classes.join(' ');
    }
    
    /**
     * Crée l'élément trend
     */
    createTrend(trend) {
        const direction = trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral';
        const icon = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
        const color = direction === 'up' ? 'success' : direction === 'down' ? 'danger' : 'neutral';
        
        return `
            <div class="stat-trend trend-${color}">
                <span class="trend-icon">${icon}</span>
                <span class="trend-value">${Math.abs(trend.value)}${trend.suffix || '%'}</span>
                ${trend.label ? `<span class="trend-label">${trend.label}</span>` : ''}
            </div>
        `;
    }
    
    // ========================================
    // SECTION 3 : FORMATAGE
    // ========================================
    
    /**
     * Formate un nombre selon la config
     */
    formatNumber(value) {
        if (value === '-' || value === null || value === undefined) {
            return '-';
        }
        
        switch (this.config.format) {
            case 'currency':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(value);
                
            case 'percent':
                return `${value}%`;
                
            case 'compact':
                return new Intl.NumberFormat('fr-FR', {
                    notation: 'compact',
                    maximumFractionDigits: 1
                }).format(value);
                
            default:
                return new Intl.NumberFormat('fr-FR').format(value);
        }
    }
    
    // ========================================
    // SECTION 4 : ÉVÉNEMENTS
    // ========================================
    
    /**
     * Attache les événements
     */
    attachEvents() {
        Object.entries(this.elements.cards).forEach(([cardId, cardElement]) => {
            cardElement.addEventListener('click', (e) => {
                this.handleCardClick(cardId, e);
            });
        });
    }
    
    /**
     * Gère le clic sur une carte
     */
    handleCardClick(cardId, event) {
        // Vérifier si la carte est activée
        if (!this.state.enabled[cardId]) return;
        
        // Animation de clic
        const card = this.elements.cards[cardId];
        card.classList.add('clicked');
        setTimeout(() => card.classList.remove('clicked'), 300);
        
        // Gérer la sélection selon le mode
        if (this.config.selectionMode !== 'none') {
            this.handleSelection(cardId);
        }
        
        // Callback onClick pour compatibilité
        if (this.config.onClick) {
            this.config.onClick(cardId, this.getCardData(cardId));
        }
    }
    
    /**
     * Gère la sélection d'une carte
     */
    handleSelection(cardId) {
        switch (this.config.selectionMode) {
            case 'single':
                // Désélectionner tout et sélectionner celle-ci
                this.state.selected = [cardId];
                // Mettre à jour le DOM
                Object.entries(this.elements.cards).forEach(([id, el]) => {
                    if (id === cardId) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
                break;
                
            case 'multiple':
                // Toggle la sélection
                this.toggleSelect(cardId);
                break;
        }
        
        // Callback onSelect
        if (this.config.onSelect) {
            this.config.onSelect([...this.state.selected]);
        }
    }
    
    // ========================================
    // SECTION 5 : API SÉLECTION
    // ========================================
    
    /**
     * Sélectionne une carte
     */
    select(cardId) {
        if (!this.state.selected.includes(cardId)) {
            this.state.selected.push(cardId);
            if (this.elements.cards[cardId]) {
                this.elements.cards[cardId].classList.add('selected');
            }
            
            // Mode single : désélectionner les autres
            if (this.config.selectionMode === 'single' && this.state.selected.length > 1) {
                const others = this.state.selected.filter(id => id !== cardId);
                others.forEach(id => this.deselect(id));
            }
        }
    }
    
    /**
     * Désélectionne une carte
     */
    deselect(cardId) {
        const index = this.state.selected.indexOf(cardId);
        if (index > -1) {
            this.state.selected.splice(index, 1);
            if (this.elements.cards[cardId]) {
                this.elements.cards[cardId].classList.remove('selected');
            }
        }
    }
    
    /**
     * Toggle la sélection d'une carte
     */
    toggleSelect(cardId) {
        if (this.state.selected.includes(cardId)) {
            this.deselect(cardId);
        } else {
            this.select(cardId);
        }
    }
    
    /**
     * Sélectionne toutes les cartes
     */
    selectAll() {
        if (this.config.selectionMode !== 'multiple') return;
        
        this.state.selected = Object.keys(this.state.values);
        Object.values(this.elements.cards).forEach(card => {
            card.classList.add('selected');
        });
        
        if (this.config.onSelect) {
            this.config.onSelect([...this.state.selected]);
        }
    }
    
    /**
     * Désélectionne toutes les cartes
     */
    deselectAll() {
        this.state.selected = [];
        Object.values(this.elements.cards).forEach(card => {
            card.classList.remove('selected');
        });
        
        if (this.config.onSelect) {
            this.config.onSelect([]);
        }
    }
    
    /**
     * Retourne les IDs sélectionnés (API unifiée)
     */
    getSelection() {
        return [...this.state.selected];
    }
    
    /**
     * Alias pour compatibilité
     * @deprecated Utiliser getSelection() à la place
     */
    getSelected() {
        console.warn('getSelected() est déprécié, utiliser getSelection()');
        return this.getSelection();
    }
    
    // ========================================
    // SECTION 6 : API MISE À JOUR
    // ========================================
    
    /**
     * Met à jour une carte
     */
    updateCard(cardId, value, animate = true) {
        if (!this.elements.cards[cardId]) {
            console.warn(`StatsCardsWidget: Carte "${cardId}" non trouvée`);
            return;
        }
        
        const oldValue = this.state.values[cardId];
        this.state.values[cardId] = value;
        
        const numberElement = this.elements.cards[cardId].querySelector('.stat-number');
        if (numberElement) {
            if (this.config.animated && animate && this.state.loaded) {
                this.animateNumber(numberElement, oldValue, value);
            } else {
                numberElement.textContent = this.formatNumber(value);
                numberElement.dataset.value = value;
            }
        }
        
        if (this.config.onUpdate) {
            this.config.onUpdate(cardId, oldValue, value);
        }
    }
    
    /**
     * Met à jour une ou plusieurs cartes (API unifiée)
     */
    update(cardIdOrValues, value, animate = true) {
        // Si c'est un objet, mise à jour multiple
        if (typeof cardIdOrValues === 'object' && !Array.isArray(cardIdOrValues)) {
            this.updateAll(cardIdOrValues, value); // value devient animate dans ce cas
        } else {
            // Mise à jour simple
            this.updateCard(cardIdOrValues, value, animate);
        }
    }
    
    /**
     * Met à jour plusieurs cartes
     */
    updateAll(values, animate = true) {
        Object.entries(values).forEach(([cardId, value]) => {
            this.updateCard(cardId, value, animate);
        });
    }
    
    /**
     * Anime un nombre
     */
    animateNumber(element, from, to) {
        if (typeof from !== 'number') from = 0;
        if (typeof to !== 'number') to = 0;
        
        const duration = 1000;
        const steps = 30;
        const stepDuration = duration / steps;
        const increment = (to - from) / steps;
        
        let current = from;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            current += increment;
            
            if (step >= steps) {
                current = to;
                clearInterval(timer);
            }
            
            element.textContent = this.formatNumber(Math.round(current));
            element.dataset.value = current;
        }, stepDuration);
    }
    
    // ========================================
    // SECTION 7 : API CONFIGURATION
    // ========================================
    
    /**
     * Change la taille des cartes
     */
    setSize(size) {
        if (!['sm', 'md', 'lg'].includes(size)) return;
        
        this.config.size = size;
        if (this.elements.wrapper) {
            // Retirer l'ancienne classe
            this.elements.wrapper.classList.remove('size-sm', 'size-md', 'size-lg');
            // Ajouter la nouvelle
            this.elements.wrapper.classList.add(`size-${size}`);
        }
    }
    
    /**
     * Change le nombre de colonnes
     */
    setColumns(columns) {
        if (!['auto', 2, 3, 4, 6].includes(columns)) return;
        
        this.config.columns = columns;
        if (this.elements.wrapper) {
            // Retirer les anciennes classes
            this.elements.wrapper.classList.remove('cols-2', 'cols-3', 'cols-4', 'cols-6');
            // Ajouter la nouvelle si pas auto
            if (columns !== 'auto') {
                this.elements.wrapper.classList.add(`cols-${columns}`);
            }
        }
    }
    
    /**
     * Active/désactive une carte
     */
    setEnabled(cardId, enabled) {
        if (!this.elements.cards[cardId]) return;
        
        this.state.enabled[cardId] = enabled;
        
        const card = this.elements.cards[cardId];
        if (enabled) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
            // Désélectionner si désactivée
            this.deselect(cardId);
        }
    }
    
    // ========================================
    // SECTION 8 : API DONNÉES
    // ========================================
    
    /**
     * Récupère les données d'une carte
     */
    getCardData(cardId) {
        const config = this.config.cards.find(c => c.id === cardId);
        return {
            ...config,
            value: this.state.values[cardId],
            enabled: this.state.enabled[cardId],
            selected: this.state.selected.includes(cardId)
        };
    }
    
    /**
     * Récupère l'état complet
     */
    getState() {
        return {
            loaded: this.state.loaded,
            values: { ...this.state.values },
            enabled: { ...this.state.enabled },
            selected: [...this.state.selected]
        };
    }
    
    // ========================================
    // SECTION 9 : AFFICHAGE
    // ========================================
    
    /**
     * Affiche avec délai (anti-FOUC)
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget
     * MODIFIÉ : Gère le mainContainer au lieu du wrapper
     */
    show() {
        // Appliquer loaded sur le bon élément selon la config
        if (this.config.showWrapper && this.elements.mainContainer) {
            this.elements.mainContainer.classList.add('loaded');
        }
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Masque le widget
     * MODIFIÉ : Gère le mainContainer au lieu du wrapper
     */
    hide() {
        if (this.config.showWrapper && this.elements.mainContainer) {
            this.elements.mainContainer.classList.remove('loaded');
        }
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.remove('loaded');
        }
        this.state.loaded = false;
    }
    
    /**
     * Rafraîchit l'affichage
     */
    refresh() {
        this.render();
        this.attachEvents();
        if (this.state.loaded) {
            this.show();
        }
    }
    
    // ========================================
    // SECTION 10 : DESTRUCTION
    // ========================================
    
    /**
     * Détruit le widget
     */
    destroy() {
        // Vider le container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser
        this.state = {
            values: {},
            selected: [],
            enabled: {},
            loaded: false
        };
        
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            cards: {}
        };
        
        console.log('🗑️ StatsCardsWidget détruit:', this.id);
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default StatsCardsWidget;