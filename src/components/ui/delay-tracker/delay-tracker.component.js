// ========================================
// DELAY-TRACKER.COMPONENT.JS - Suivi visuel de délai/retard
// Chemin: src/components/ui/delay-tracker/delay-tracker.component.js
//
// DESCRIPTION:
// Composant pour afficher visuellement le temps écoulé entre deux dates
// avec timeline, marqueurs et alertes de retard
// Totalement indépendant, aucune dépendance
//
// API PUBLIQUE:
// - constructor(config)
// - updateDates(startDate, currentDate, endDate)
// - setStatus(status)
// - reset()
// - destroy()
//
// CALLBACKS:
// - onDelayChange: (days, status) => void
// - onMarkerClick: (marker) => void
//
// EXEMPLE:
// const tracker = new DelayTracker({
//     container: '#tracker',
//     title: 'RÉCÉPISSÉ MDPH EN RETARD',
//     startDate: '2024-01-25',
//     endDate: null,
//     warningDays: 60,
//     criticalDays: 75
// });
// ========================================

export class DelayTracker {
    constructor(config) {
        this.config = {
            container: null,
            title: '',
            startDate: null,
            endDate: null,
            currentDate: new Date(),
            startLabel: 'Début',
            currentLabel: 'Aujourd\'hui',
            endLabel: 'Fin',
            warningDays: 30,
            criticalDays: 60,
            showAlert: true,
            animated: true,
            // Callbacks
            onDelayChange: null,
            onMarkerClick: null,
            ...config
        };
        
        this.elements = {};
        this.state = {
            daysElapsed: 0,
            status: 'normal' // normal, warning, critical
        };
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.calculateDelay();
        this.render();
        
        if (this.config.animated) {
            this.animateTimeline();
        }
    }
    
    loadStyles() {
        if (!document.getElementById('delay-tracker-styles')) {
            const link = document.createElement('link');
            link.id = 'delay-tracker-styles';
            link.rel = 'stylesheet';
            link.href = '/src/components/ui/delay-tracker/delay-tracker.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // CALCULS
    // ========================================
    
    calculateDelay() {
        if (!this.config.startDate) return;
        
        const start = this.parseDate(this.config.startDate);
        const current = this.parseDate(this.config.currentDate);
        
        // Calculer les jours écoulés
        const diffTime = current - start;
        this.state.daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Déterminer le statut
        if (this.state.daysElapsed >= this.config.criticalDays) {
            this.state.status = 'critical';
        } else if (this.state.daysElapsed >= this.config.warningDays) {
            this.state.status = 'warning';
        } else {
            this.state.status = 'normal';
        }
        
        // Callback
        if (this.config.onDelayChange) {
            this.config.onDelayChange(this.state.daysElapsed, this.state.status);
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.querySelector(this.config.container);
        if (!container) {
            console.error('DelayTracker: Container non trouvé');
            return;
        }
        
        const alertClass = this.state.status === 'critical' ? 'alert-critical' : 
                          this.state.status === 'warning' ? 'alert-warning' : '';
        
        // Structure HTML
        container.innerHTML = `
            <div class="delay-tracker ${alertClass}">
                ${this.config.title ? `
                    <div class="delay-tracker-header">
                        <h4 class="delay-tracker-title">
                            ${this.config.showAlert && this.state.status === 'critical' ? '🚨' : ''}
                            ${this.escapeHtml(this.config.title)}
                        </h4>
                    </div>
                ` : ''}
                
                <div class="delay-tracker-timeline-container">
                    <div class="delay-tracker-labels">
                        <div class="delay-tracker-label start">
                            ${this.escapeHtml(this.config.startLabel)}
                        </div>
                        <div class="delay-tracker-label current">
                            ${this.escapeHtml(this.config.currentLabel)}
                        </div>
                    </div>
                    
                    <div class="delay-tracker-timeline">
                        <div class="delay-tracker-line">
                            <div class="delay-tracker-progress" style="width: 0%;"></div>
                        </div>
                        
                        <div class="delay-tracker-markers">
                            <div class="delay-tracker-marker start" data-type="start">
                                <div class="marker-icon">[■]</div>
                            </div>
                            
                            <div class="delay-tracker-marker current ${this.state.status}" 
                                 data-type="current"
                                 style="left: 0%;">
                                <div class="marker-icon">[!]</div>
                            </div>
                            
                            ${this.config.endDate ? `
                                <div class="delay-tracker-marker end" data-type="end">
                                    <div class="marker-icon">[●]</div>
                                </div>
                            ` : `
                                <div class="delay-tracker-marker unknown" data-type="unknown">
                                    <div class="marker-icon">🚨</div>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="delay-tracker-dates">
                        <div class="delay-tracker-date start">
                            ${this.formatDate(this.config.startDate)}
                        </div>
                        <div class="delay-tracker-date current">
                            ${this.formatDate(this.config.currentDate)}
                        </div>
                    </div>
                    
                    <div class="delay-tracker-duration">
                        <span class="duration-line">└──── </span>
                        <span class="duration-text">${this.state.daysElapsed} JOURS ÉCOULÉS</span>
                        <span class="duration-line"> ────┘</span>
                    </div>
                </div>
                
                ${this.renderStatusZones()}
            </div>
        `;
        
        // Références
        this.elements.container = container;
        this.elements.tracker = container.querySelector('.delay-tracker');
        this.elements.progress = container.querySelector('.delay-tracker-progress');
        this.elements.currentMarker = container.querySelector('.delay-tracker-marker.current');
        this.elements.markers = container.querySelectorAll('.delay-tracker-marker');
        
        // Attacher les événements
        this.attachEvents();
        
        // Positionner le marqueur actuel
        this.updateCurrentMarkerPosition();
    }
    
    renderStatusZones() {
        if (!this.config.showAlert) return '';
        
        return `
            <div class="delay-tracker-zones">
                <div class="delay-tracker-zone-labels">
                    <span class="zone-label normal">🟢 Normal</span>
                    <span class="zone-label warning">🟡 Attention</span>
                    <span class="zone-label critical">🔴 CRITIQUE</span>
                </div>
                <div class="delay-tracker-zone-bar">
                    <div class="zone normal" style="width: ${this.getZoneWidth('normal')}%"></div>
                    <div class="zone warning" style="width: ${this.getZoneWidth('warning')}%"></div>
                    <div class="zone critical" style="width: ${this.getZoneWidth('critical')}%"></div>
                </div>
                <div class="delay-tracker-zone-markers">
                    <span class="zone-marker" style="left: ${this.getZoneWidth('normal')}%">
                        ${this.config.warningDays}j
                    </span>
                    <span class="zone-marker" style="left: ${this.getZoneWidth('normal') + this.getZoneWidth('warning')}%">
                        ${this.config.criticalDays}j
                    </span>
                    ${this.state.daysElapsed > this.config.criticalDays ? `
                        <span class="zone-marker current" style="left: ${this.getCurrentPosition()}%">
                            ▲<br>ICI (${this.state.daysElapsed}j)
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // ========================================
    // POSITIONNEMENT
    // ========================================
    
    updateCurrentMarkerPosition() {
        if (!this.elements.currentMarker || !this.elements.progress) return;
        
        const position = this.getCurrentPosition();
        this.elements.currentMarker.style.left = `${position}%`;
        this.elements.progress.style.width = `${position}%`;
    }
    
    getCurrentPosition() {
        // Si on a une date de fin, calculer la position relative
        if (this.config.endDate) {
            const start = this.parseDate(this.config.startDate);
            const current = this.parseDate(this.config.currentDate);
            const end = this.parseDate(this.config.endDate);
            
            const totalDuration = end - start;
            const elapsedDuration = current - start;
            
            return Math.min(100, (elapsedDuration / totalDuration) * 100);
        }
        
        // Sinon, position basée sur les zones de criticité
        const maxDays = this.config.criticalDays * 1.5;
        return Math.min(100, (this.state.daysElapsed / maxDays) * 100);
    }
    
    getZoneWidth(zone) {
        const maxDays = this.config.criticalDays * 1.5;
        
        if (zone === 'normal') {
            return (this.config.warningDays / maxDays) * 100;
        } else if (zone === 'warning') {
            return ((this.config.criticalDays - this.config.warningDays) / maxDays) * 100;
        } else {
            return 100 - this.getZoneWidth('normal') - this.getZoneWidth('warning');
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        this.elements.markers.forEach(marker => {
            marker.addEventListener('click', (e) => {
                const type = marker.dataset.type;
                if (this.config.onMarkerClick) {
                    this.config.onMarkerClick({
                        type,
                        date: this.getMarkerDate(type),
                        label: this.getMarkerLabel(type)
                    });
                }
            });
        });
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    updateDates(startDate, currentDate, endDate = null) {
        this.config.startDate = startDate;
        this.config.currentDate = currentDate || new Date();
        this.config.endDate = endDate;
        
        this.calculateDelay();
        this.render();
    }
    
    setStatus(status) {
        this.state.status = status;
        this.render();
    }
    
    reset() {
        this.state = {
            daysElapsed: 0,
            status: 'normal'
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
    // MÉTHODES UTILITAIRES
    // ========================================
    
    parseDate(date) {
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return new Date();
    }
    
    formatDate(date) {
        const d = this.parseDate(date);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit'
        });
    }
    
    getMarkerDate(type) {
        switch(type) {
            case 'start': return this.config.startDate;
            case 'current': return this.config.currentDate;
            case 'end': return this.config.endDate;
            default: return null;
        }
    }
    
    getMarkerLabel(type) {
        switch(type) {
            case 'start': return this.config.startLabel;
            case 'current': return this.config.currentLabel;
            case 'end': return this.config.endLabel;
            default: return 'Inconnu';
        }
    }
    
    animateTimeline() {
        setTimeout(() => {
            this.elements.tracker?.classList.add('animated');
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
   - Gestion des délais et retards
   - Zones de criticité configurables
   - Animation de la timeline
   
   NOTES POUR REPRISES FUTURES:
   - Le composant ne dépend d'aucun autre
   - CSS chargé automatiquement
   - Calculs de délais automatiques
   ======================================== */