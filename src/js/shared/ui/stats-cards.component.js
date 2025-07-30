// ========================================
// STATS-CARDS.COMPONENT.JS - Composant de cartes statistiques réutilisable
// Chemin: src/js/shared/ui/stats-cards.component.js
//
// DESCRIPTION:
// Composant indépendant pour afficher des cartes de statistiques
// Utilisable dans n'importe quel contexte avec différentes configurations
//
// API PUBLIQUE:
// - constructor(config)
// - updateCard(cardId, value)
// - updateAll(values)
// - setEnabled(cardId, enabled)
// - show()
// - hide()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onClick: (cardId, cardData) => void
// - onHover: (cardId, cardData) => void
// - onUpdate: (cardId, oldValue, newValue) => void
//
// EXEMPLE:
// const stats = new StatsCards({
//     container: '.stats-container',
//     cards: [
//         { id: 'total', label: 'Total', value: 0, color: 'primary' }
//     ],
//     onClick: (cardId) => console.log('Clicked:', cardId)
// });
// ========================================

import { generateId } from '../index.js';

export class StatsCards {
    constructor(config) {
        this.id = generateId('stats');
        
        // Configuration par défaut
        this.config = {
            container: null,
            cards: [],
            animated: true,        // Animation des nombres
            clickable: true,       // Cartes cliquables
            hoverable: true,       // Effet au survol
            numberFormat: 'default', // Format des nombres
            onClick: null,         // Callback au clic
            onHover: null,         // Callback au survol
            onUpdate: null,        // Callback à la mise à jour
            theme: 'default',      // Thème visuel
            ...config
        };
        
        // État interne
        this.state = {
            values: {},
            enabled: {},
            loaded: false
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            wrapper: null,
            cards: {}
        };
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Charger les styles en premier
        this.loadStyles().then(() => {
            // Une fois le CSS chargé, continuer
            this.setupContainer();
            this.initState();
            this.render();
            this.attachEvents();
            this.showWithDelay();
            
            console.log('✅ StatsCards initialisé');
        });
    }
    
    loadStyles() {
        return new Promise((resolve) => {
            const styleId = 'stats-cards-styles';
            
            if (!document.getElementById(styleId)) {
                const link = document.createElement('link');
                link.id = styleId;
                link.rel = 'stylesheet';
                link.href = '../src/css/shared/ui/stats-cards.css';
                
                // Attendre que le CSS soit chargé
                link.onload = () => {
                    console.log('📦 CSS StatsCards chargé');
                    resolve();
                };
                
                link.onerror = () => {
                    console.warn('⚠️ Erreur chargement CSS StatsCards');
                    resolve(); // Continuer même en cas d'erreur
                };
                
                document.head.appendChild(link);
            } else {
                // CSS déjà chargé
                resolve();
            }
        });
    }
    
    setupContainer() {
        // Vérifier le container
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            console.error('StatsCards: Container non trouvé');
            return;
        }
    }
    
    initState() {
        // Initialiser les valeurs et états
        this.config.cards.forEach(card => {
            this.state.values[card.id] = card.value !== undefined ? card.value : 0;
            this.state.enabled[card.id] = card.enabled !== false;
        });
    }
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    render() {
        // Créer le wrapper
        const wrapper = document.createElement('div');
        wrapper.className = `stats-cards-wrapper theme-${this.config.theme}`;
        wrapper.id = this.id;
        
        // 🆕 PAS de style inline opacity - Laisser le CSS gérer
        // Le CSS définit opacity: 0 par défaut, puis .loaded met opacity: 1
        
        // Créer chaque carte
        this.config.cards.forEach(cardConfig => {
            const card = this.createCard(cardConfig);
            if (card) {
                wrapper.appendChild(card);
                this.elements.cards[cardConfig.id] = card;
            }
        });
        
        // Sauvegarder la référence au wrapper
        this.elements.wrapper = wrapper;
        
        // Vider et remplir le container
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(wrapper);
    }
    
    createCard(config) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.dataset.cardId = config.id;
        
        // Ajouter les classes selon la config
        if (config.color) {
            card.classList.add(`stat-card-${config.color}`);
        }
        
        if (this.config.clickable && config.clickable !== false) {
            card.classList.add('clickable');
        }
        
        if (this.config.hoverable && config.hoverable !== false) {
            card.classList.add('hoverable');
        }
        
        if (!this.state.enabled[config.id]) {
            card.classList.add('disabled');
        }
        
        // Valeur d'affichage
        const displayValue = config.value !== undefined ? config.value : '-';
        
        // Icône optionnelle
        const iconHtml = config.icon ? `<div class="stat-icon">${config.icon}</div>` : '';
        
        // Structure interne
        card.innerHTML = `
            ${iconHtml}
            <div class="stat-content">
                <div class="stat-number" data-value="${config.value || 0}">
                    ${this.formatNumber(displayValue)}
                </div>
                <div class="stat-label">${config.label}</div>
                ${config.sublabel ? `<div class="stat-sublabel">${config.sublabel}</div>` : ''}
            </div>
            ${config.trend ? this.createTrend(config.trend) : ''}
        `;
        
        return card;
    }
    
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
    
    formatNumber(value) {
        // Gérer les valeurs non numériques
        if (value === '-' || value === null || value === undefined) {
            return '-';
        }
        
        // Formatage selon le type
        switch (this.config.numberFormat) {
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
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        Object.entries(this.elements.cards).forEach(([cardId, cardElement]) => {
            const config = this.config.cards.find(c => c.id === cardId);
            
            // Événement click
            if (this.config.clickable && config.clickable !== false) {
                cardElement.addEventListener('click', () => {
                    this.handleCardClick(cardId);
                });
            }
            
            // Événement hover
            if (this.config.hoverable && config.hoverable !== false && this.config.onHover) {
                cardElement.addEventListener('mouseenter', () => {
                    this.handleCardHover(cardId);
                });
            }
        });
    }
    
    handleCardClick(cardId) {
        // Vérifier si la carte est activée
        if (!this.state.enabled[cardId]) return;
        
        // Animation de clic
        const card = this.elements.cards[cardId];
        card.classList.add('clicked');
        setTimeout(() => card.classList.remove('clicked'), 300);
        
        // Callback
        if (this.config.onClick) {
            const cardData = this.getCardData(cardId);
            this.config.onClick(cardId, cardData);
        }
    }
    
    handleCardHover(cardId) {
        if (!this.state.enabled[cardId]) return;
        
        if (this.config.onHover) {
            const cardData = this.getCardData(cardId);
            this.config.onHover(cardId, cardData);
        }
    }
    
    // ========================================
    // AFFICHAGE ET MASQUAGE
    // ========================================
    
    /**
     * 🆕 Affiche le composant avec délai pour éviter le FOUC
     */
    showWithDelay() {
        // Attendre un court délai pour s'assurer que tout est en place
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le composant immédiatement
     */
    show() {
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.add('loaded');
            this.state.loaded = true;
            console.log('📦 StatsCards affiché');
        }
    }
    
    /**
     * Masque le composant
     */
    hide() {
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.remove('loaded');
            this.state.loaded = false;
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Met à jour la valeur d'une carte
     * @param {string} cardId - ID de la carte
     * @param {number} value - Nouvelle valeur
     * @param {boolean} animate - Animer la transition
     */
    updateCard(cardId, value, animate = true) {
        if (!this.elements.cards[cardId]) {
            console.warn(`StatsCards: Carte "${cardId}" non trouvée`);
            return;
        }
        
        const oldValue = this.state.values[cardId];
        this.state.values[cardId] = value;
        
        // Mettre à jour le DOM
        const numberElement = this.elements.cards[cardId].querySelector('.stat-number');
        if (numberElement) {
            if (this.config.animated && animate && this.state.loaded) {
                this.animateNumber(numberElement, oldValue, value);
            } else {
                numberElement.textContent = this.formatNumber(value);
                numberElement.dataset.value = value;
            }
        }
        
        // Callback
        if (this.config.onUpdate) {
            this.config.onUpdate(cardId, oldValue, value);
        }
    }
    
    /**
     * Met à jour plusieurs cartes en une fois
     * @param {Object} values - Objet {cardId: value}
     * @param {boolean} animate - Animer les transitions
     */
    updateAll(values, animate = true) {
        Object.entries(values).forEach(([cardId, value]) => {
            this.updateCard(cardId, value, animate);
        });
    }
    
    /**
     * Active/désactive une carte
     * @param {string} cardId - ID de la carte
     * @param {boolean} enabled - État activé/désactivé
     */
    setEnabled(cardId, enabled) {
        if (!this.elements.cards[cardId]) return;
        
        this.state.enabled[cardId] = enabled;
        
        const card = this.elements.cards[cardId];
        if (enabled) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
        }
    }
    
    /**
     * Récupère les données d'une carte
     * @param {string} cardId - ID de la carte
     * @returns {Object} Données de la carte
     */
    getCardData(cardId) {
        const config = this.config.cards.find(c => c.id === cardId);
        return {
            ...config,
            value: this.state.values[cardId],
            enabled: this.state.enabled[cardId]
        };
    }
    
    /**
     * Retourne l'état du composant
     * @returns {Object} État actuel
     */
    getState() {
        return {
            loaded: this.state.loaded,
            values: { ...this.state.values },
            enabled: { ...this.state.enabled }
        };
    }
    
    /**
     * Détruit le composant
     */
    destroy() {
        // Vider le container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser
        this.state = { values: {}, enabled: {}, loaded: false };
        this.elements = { container: null, wrapper: null, cards: {} };
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    animateNumber(element, from, to) {
        // Validation des paramètres
        if (typeof from !== 'number') from = 0;
        if (typeof to !== 'number') to = 0;
        
        const duration = 1000; // 1 seconde
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
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [29/01/2025] - Création initiale
   - Composant créé en suivant le pattern IoC
   - Animation des nombres optionnelle
   - Support de différents formats de nombres
   
   [30/01/2025] - Correction FOUC v1
   - Tentative avec opacité inline
   - Conflit entre style inline et classe CSS
   
   [30/01/2025] - Correction FOUC v2
   - Suppression des styles inline opacity
   - Chargement CSS en Promise
   - Référence directe au wrapper
   - Méthodes show/hide améliorées
   - État loaded dans le state
   
   NOTES POUR REPRISES FUTURES:
   - Le CSS gère complètement l'opacité (.loaded)
   - Pas de style inline opacity pour éviter les conflits
   - Le chargement CSS est asynchrone avec Promise
   - L'état loaded est centralisé dans this.state
   ======================================== */