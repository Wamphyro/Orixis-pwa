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
            enabled: {}
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            cards: {}
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
            console.error('StatsCards: Container non trouvé');
            return;
        }
        
        // Initialiser l'état
        this.initState();
        
        // Créer le DOM
        this.render();
        
        // Attacher les événements
        this.attachEvents();
        
        // 🆕 ANTI-FOUC : Marquer comme chargé après un court délai
        setTimeout(() => {
            const wrapper = this.elements.container.querySelector('.stats-cards-wrapper');
            if (wrapper) {
                wrapper.classList.add('loaded');
            }
        }, 150); // Délai pour s'assurer que le CSS est chargé
        
        console.log('✅ StatsCards initialisé');
    }
    
    loadStyles() {
        const styleId = 'stats-cards-styles';
        
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = '../src/css/shared/ui/stats-cards.css';
            document.head.appendChild(link);
            
            // 🆕 ANTI-FOUC : Attendre que le CSS soit chargé
            link.onload = () => {
                console.log('📦 CSS StatsCards chargé');
            };
        }
    }
    
    initState() {
        // Initialiser les valeurs et états
        this.config.cards.forEach(card => {
            this.state.values[card.id] = card.value || 0;
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
        
        // 🆕 ANTI-FOUC : Ajouter les styles inline initiaux
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'opacity 0.3s ease';
        
        // Créer chaque carte
        this.config.cards.forEach(cardConfig => {
            const card = this.createCard(cardConfig);
            if (card) {
                wrapper.appendChild(card);
                this.elements.cards[cardConfig.id] = card;
            }
        });
        
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
        
        // 🆕 AMÉLIORATION : Valeur d'affichage par défaut
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
        // 🆕 AMÉLIORATION : Gérer les valeurs non numériques
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
            if (this.config.animated && animate) {
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
     * 🆕 NOUVELLE MÉTHODE : Afficher le composant une fois chargé
     */
    show() {
        const wrapper = this.elements.container.querySelector('.stats-cards-wrapper');
        if (wrapper) {
            wrapper.style.opacity = '1';
            wrapper.classList.add('loaded');
        }
    }
    
    /**
     * 🆕 NOUVELLE MÉTHODE : Masquer le composant
     */
    hide() {
        const wrapper = this.elements.container.querySelector('.stats-cards-wrapper');
        if (wrapper) {
            wrapper.style.opacity = '0';
            wrapper.classList.remove('loaded');
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
     * Détruit le composant
     */
    destroy() {
        // Vider le container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser
        this.state = { values: {}, enabled: {} };
        this.elements = { container: null, cards: {} };
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    animateNumber(element, from, to) {
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
   
   [30/01/2025] - Correction FOUC
   - Ajout de l'opacité initiale à 0
   - Délai avant affichage (150ms)
   - Méthodes show()/hide() ajoutées
   - Gestion des valeurs '-' par défaut
   
   NOTES POUR REPRISES FUTURES:
   - Le composant charge automatiquement son CSS
   - Les callbacks sont optionnels
   - L'animation peut être désactivée globalement ou par mise à jour
   - Anti-FOUC intégré avec transition d'opacité
   ======================================== */