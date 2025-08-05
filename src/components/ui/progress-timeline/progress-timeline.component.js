// ========================================
// PROGRESS-TIMELINE.COMPONENT.JS - Timeline de progression horizontale
// Chemin: src/components/ui/progress-timeline/progress-timeline.component.js
//
// DESCRIPTION:
// Composant de timeline horizontale pour afficher une progression
// avec des étapes, statuts et dates
// Totalement indépendant, aucune dépendance
//
// API PUBLIQUE:
// - constructor(config)
// - setItems(items)
// - setCurrentIndex(index)
// - updateItem(index, updates)
// - destroy()
//
// CALLBACKS:
// - onItemClick: (item, index) => void
// - onProgressChange: (progress) => void
//
// EXEMPLE:
// const timeline = new ProgressTimeline({
//     container: '#timeline',
//     title: 'PROGRESSION GLOBALE',
//     items: [
//         { label: 'Créé', status: 'completed', date: '15/12', icon: '✅' },
//         { label: 'BLOQUÉ', status: 'current', date: 'ICI', icon: '🔴' }
//     ]
// });
// ========================================

export class ProgressTimeline {
    constructor(config) {
        this.config = {
            container: null,
            title: 'PROGRESSION',
            items: [],
            showDates: true,
            showConnectors: true,
            animated: true,
            // Callbacks
            onItemClick: null,
            onProgressChange: null,
            ...config
        };
        
        this.elements = {};
        this.currentIndex = -1;
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.render();
        this.findCurrentIndex();
        if (this.config.animated) {
            this.animateProgress();
        }
    }
    
    loadStyles() {
        if (!document.getElementById('progress-timeline-styles')) {
            const link = document.createElement('link');
            link.id = 'progress-timeline-styles';
            link.rel = 'stylesheet';
            link.href = '/src/components/ui/progress-timeline/progress-timeline.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.querySelector(this.config.container);
        if (!container) {
            console.error('ProgressTimeline: Container non trouvé');
            return;
        }
        
        // Structure HTML
        container.innerHTML = `
            <div class="progress-timeline">
                <div class="progress-timeline-header">
                    <h3 class="progress-timeline-title">📊 ${this.escapeHtml(this.config.title)}</h3>
                    <div class="progress-timeline-line"></div>
                </div>
                <div class="progress-timeline-track">
                    <div class="progress-timeline-items">
                        ${this.renderItems()}
                    </div>
                    ${this.config.showConnectors ? this.renderConnectors() : ''}
                </div>
            </div>
        `;
        
        // Références
        this.elements.container = container;
        this.elements.timeline = container.querySelector('.progress-timeline');
        this.elements.items = container.querySelectorAll('.progress-timeline-item');
        this.elements.connectors = container.querySelectorAll('.progress-timeline-connector');
        
        // Événements
        this.attachEvents();
    }
    
    renderItems() {
        return this.config.items.map((item, index) => `
            <div class="progress-timeline-item ${item.status || ''}" 
                 data-index="${index}">
                <div class="progress-timeline-milestone">
                    <span class="progress-timeline-icon">${item.icon || this.getDefaultIcon(item.status)}</span>
                </div>
                <div class="progress-timeline-content">
                    <div class="progress-timeline-label">${this.escapeHtml(item.label)}</div>
                    ${this.config.showDates && item.date ? 
                        `<div class="progress-timeline-date">${this.escapeHtml(item.date)}</div>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    renderConnectors() {
        const connectorsHtml = [];
        for (let i = 0; i < this.config.items.length - 1; i++) {
            const item = this.config.items[i];
            const nextItem = this.config.items[i + 1];
            const connectorClass = this.getConnectorClass(item, nextItem, i);
            
            connectorsHtml.push(`
                <div class="progress-timeline-connector ${connectorClass}" 
                     data-from="${i}" 
                     data-to="${i + 1}">
                </div>
            `);
        }
        
        return `<div class="progress-timeline-connectors">${connectorsHtml.join('')}</div>`;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        this.elements.items.forEach((item, index) => {
            item.addEventListener('click', () => this.handleItemClick(index));
        });
    }
    
    handleItemClick(index) {
        const item = this.config.items[index];
        if (this.config.onItemClick) {
            this.config.onItemClick(item, index);
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setItems(items) {
        this.config.items = items;
        this.render();
        this.findCurrentIndex();
        
        if (this.config.onProgressChange) {
            this.config.onProgressChange(this.getProgress());
        }
    }
    
    setCurrentIndex(index) {
        if (index < 0 || index >= this.config.items.length) return;
        
        // Mettre à jour les statuts
        this.config.items.forEach((item, i) => {
            if (i < index) {
                item.status = 'completed';
            } else if (i === index) {
                item.status = 'current';
            } else {
                item.status = 'pending';
            }
        });
        
        this.currentIndex = index;
        this.render();
        
        if (this.config.onProgressChange) {
            this.config.onProgressChange(this.getProgress());
        }
    }
    
    updateItem(index, updates) {
        if (index < 0 || index >= this.config.items.length) return;
        
        this.config.items[index] = {
            ...this.config.items[index],
            ...updates
        };
        
        this.render();
    }
    
    destroy() {
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        this.elements = {};
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    findCurrentIndex() {
        this.currentIndex = this.config.items.findIndex(item => 
            item.status === 'current' || item.status === 'blocked'
        );
        
        if (this.currentIndex === -1) {
            // Si pas de current, trouver le dernier completed
            for (let i = this.config.items.length - 1; i >= 0; i--) {
                if (this.config.items[i].status === 'completed') {
                    this.currentIndex = i;
                    break;
                }
            }
        }
    }
    
    getProgress() {
        if (this.config.items.length === 0) return 0;
        
        const completedCount = this.config.items.filter(item => 
            item.status === 'completed'
        ).length;
        
        return Math.round((completedCount / this.config.items.length) * 100);
    }
    
    getDefaultIcon(status) {
        const icons = {
            completed: '✅',
            current: '🔄',
            blocked: '🔴',
            pending: '⏳',
            error: '❌'
        };
        
        return icons[status] || '○';
    }
    
    getConnectorClass(item, nextItem, index) {
        if (item.status === 'completed' && 
            (nextItem.status === 'completed' || nextItem.status === 'current')) {
            return 'completed';
        }
        
        if (item.status === 'current' || item.status === 'blocked') {
            return 'active';
        }
        
        return 'pending';
    }
    
    animateProgress() {
        setTimeout(() => {
            this.elements.timeline?.classList.add('animated');
        }, 100);
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
   - Support des statuts multiples
   - Animation optionnelle
   
   NOTES POUR REPRISES FUTURES:
   - Le composant ne dépend d'aucun autre
   - CSS chargé automatiquement
   - Peut être utilisé dans n'importe quel contexte
   ======================================== */