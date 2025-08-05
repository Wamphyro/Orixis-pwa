// ========================================
// PROGRESS-OVERVIEW.COMPONENT.JS - Vue d'ensemble multi-progressions
// Chemin: src/components/ui/progress-overview/progress-overview.component.js
//
// DESCRIPTION:
// Composant pour afficher plusieurs barres de progression
// avec labels, pourcentages et statuts
// Totalement indépendant, aucune dépendance
//
// API PUBLIQUE:
// - constructor(config)
// - setItems(items)
// - updateItem(id, updates)
// - getValue(id)
// - destroy()
//
// CALLBACKS:
// - onItemClick: (item) => void
// - onChange: (items) => void
//
// EXEMPLE:
// const overview = new ProgressOverview({
//     container: '#overview',
//     title: 'VUE D\'ENSEMBLE DU PARCOURS',
//     items: [
//         { id: 'mdph', label: 'MDPH', value: 75, status: 'EN RETARD', color: 'red' },
//         { id: 'agefiph', label: 'AGEFIPH', value: 35, status: 'EN ATTENTE', color: 'orange' }
//     ]
// });
// ========================================

export class ProgressOverview {
    constructor(config) {
        this.config = {
            container: null,
            title: '',
            showTitle: true,
            items: [],
            animated: true,
            showPercentage: true,
            showStatus: true,
            barHeight: 20,
            // Callbacks
            onItemClick: null,
            onChange: null,
            ...config
        };
        
        this.elements = {};
        this.items = new Map();
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.render();
        this.processItems();
        
        if (this.config.animated) {
            this.animateBars();
        }
    }
    
    loadStyles() {
        if (!document.getElementById('progress-overview-styles')) {
            const link = document.createElement('link');
            link.id = 'progress-overview-styles';
            link.rel = 'stylesheet';
            link.href = '/src/components/ui/progress-overview/progress-overview.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.querySelector(this.config.container);
        if (!container) {
            console.error('ProgressOverview: Container non trouvé');
            return;
        }
        
        // Structure HTML
        container.innerHTML = `
            <div class="progress-overview">
                ${this.config.showTitle && this.config.title ? `
                    <div class="progress-overview-header">
                        <h3 class="progress-overview-title">🎯 ${this.escapeHtml(this.config.title)}</h3>
                        <div class="progress-overview-divider"></div>
                    </div>
                ` : ''}
                <div class="progress-overview-items">
                    ${this.renderItems()}
                </div>
                <div class="progress-overview-separator"></div>
            </div>
        `;
        
        // Références
        this.elements.container = container;
        this.elements.overview = container.querySelector('.progress-overview');
        this.elements.itemsContainer = container.querySelector('.progress-overview-items');
        
        // Attacher les événements
        this.attachEvents();
    }
    
    renderItems() {
        return this.config.items.map(item => this.renderItem(item)).join('');
    }
    
    renderItem(item) {
        const barColor = this.getBarColor(item.color || 'default', item.value);
        const statusClass = this.getStatusClass(item.status);
        
        return `
            <div class="progress-overview-item" data-id="${item.id}">
                <div class="progress-overview-info">
                    <span class="progress-overview-label">${this.escapeHtml(item.label)}</span>
                    <span class="progress-overview-colon">:</span>
                </div>
                <div class="progress-overview-bar-container">
                    <div class="progress-overview-bar" style="height: ${this.config.barHeight}px;">
                        <div class="progress-overview-fill ${barColor}" 
                             data-value="${item.value}"
                             style="width: 0%;">
                        </div>
                    </div>
                </div>
                <div class="progress-overview-details">
                    ${this.config.showPercentage ? `
                        <span class="progress-overview-percentage">${item.value}%</span>
                    ` : ''}
                    ${this.config.showStatus && item.status ? `
                        <span class="progress-overview-status ${statusClass}">
                            (${this.escapeHtml(item.status)})
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // ========================================
    // GESTION DES ITEMS
    // ========================================
    
    processItems() {
        this.items.clear();
        
        this.config.items.forEach(item => {
            this.items.set(item.id, {
                ...item,
                element: this.elements.itemsContainer.querySelector(`[data-id="${item.id}"]`)
            });
        });
    }
    
    // ========================================
    // ANIMATIONS
    // ========================================
    
    animateBars() {
        setTimeout(() => {
            this.items.forEach(item => {
                const fillElement = item.element?.querySelector('.progress-overview-fill');
                if (fillElement) {
                    fillElement.style.width = `${item.value}%`;
                }
            });
        }, 100);
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        this.elements.itemsContainer.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.progress-overview-item');
            if (itemElement) {
                const id = itemElement.dataset.id;
                const item = this.items.get(id);
                if (item && this.config.onItemClick) {
                    this.config.onItemClick(item);
                }
            }
        });
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setItems(items) {
        this.config.items = items;
        this.render();
        this.processItems();
        
        if (this.config.animated) {
            this.animateBars();
        }
        
        if (this.config.onChange) {
            this.config.onChange(items);
        }
    }
    
    updateItem(id, updates) {
        const item = this.items.get(id);
        if (!item) return;
        
        // Mettre à jour les données
        Object.assign(item, updates);
        
        // Mettre à jour dans la config
        const configIndex = this.config.items.findIndex(i => i.id === id);
        if (configIndex !== -1) {
            this.config.items[configIndex] = { ...item };
        }
        
        // Re-render juste cet item
        this.updateItemDisplay(item);
        
        if (this.config.onChange) {
            this.config.onChange(this.config.items);
        }
    }
    
    getValue(id) {
        const item = this.items.get(id);
        return item ? item.value : null;
    }
    
    destroy() {
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        this.elements = {};
        this.items.clear();
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    updateItemDisplay(item) {
        if (!item.element) return;
        
        // Mettre à jour la barre
        const fillElement = item.element.querySelector('.progress-overview-fill');
        if (fillElement) {
            fillElement.style.width = `${item.value}%`;
            fillElement.className = `progress-overview-fill ${this.getBarColor(item.color, item.value)}`;
        }
        
        // Mettre à jour le pourcentage
        if (this.config.showPercentage) {
            const percentElement = item.element.querySelector('.progress-overview-percentage');
            if (percentElement) {
                percentElement.textContent = `${item.value}%`;
            }
        }
        
        // Mettre à jour le statut
        if (this.config.showStatus && item.status) {
            const statusElement = item.element.querySelector('.progress-overview-status');
            if (statusElement) {
                statusElement.textContent = `(${item.status})`;
                statusElement.className = `progress-overview-status ${this.getStatusClass(item.status)}`;
            }
        }
    }
    
    getBarColor(color, value) {
        // Couleurs prédéfinies
        const colorMap = {
            'red': 'bar-red',
            'orange': 'bar-orange',
            'yellow': 'bar-yellow',
            'green': 'bar-green',
            'blue': 'bar-blue',
            'purple': 'bar-purple',
            'gray': 'bar-gray',
            'default': 'bar-default'
        };
        
        // Si couleur auto basée sur la valeur
        if (color === 'auto') {
            if (value >= 80) return 'bar-green';
            if (value >= 60) return 'bar-yellow';
            if (value >= 40) return 'bar-orange';
            return 'bar-red';
        }
        
        return colorMap[color] || 'bar-default';
    }
    
    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('retard') || statusLower.includes('critique')) {
            return 'status-danger';
        }
        if (statusLower.includes('attente') || statusLower.includes('pause')) {
            return 'status-warning';
        }
        if (statusLower.includes('bloqué') || statusLower.includes('blocage')) {
            return 'status-error';
        }
        if (statusLower.includes('terminé') || statusLower.includes('complet')) {
            return 'status-success';
        }
        
        return 'status-default';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date] - Création initiale
   - Composant 100% indépendant
   - Support multi-barres avec statuts
   - Animations optionnelles
   - Couleurs dynamiques
   
   NOTES POUR REPRISES FUTURES:
   - Le composant ne dépend d'aucun autre
   - CSS chargé automatiquement
   - Peut gérer n'importe quel nombre de barres
   ======================================== */