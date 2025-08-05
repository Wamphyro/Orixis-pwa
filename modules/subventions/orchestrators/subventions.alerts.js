// ========================================
// SUBVENTIONS.ALERTS.JS - Dashboard alertes et rappels
// Chemin: modules/subventions/subventions.alerts.js
//
// DESCRIPTION:
// Orchestrateur pour le dashboard des alertes
// Vue d'ensemble de tous les dossiers nécessitant une action
// ========================================

import { subventionsConfig } from '../core/subventions.config.js';
import { subventionsService } from '../core/subventions.service.js';
import { subventionsFirestore } from '../core/subventions.firestore.js';

class SubventionsAlerts {
    constructor() {
        this.permissions = null;
        this.dossiers = [];
        this.alertes = [];
        this.filters = {
            niveau: 'all',
            type: 'all',
            technicien: 'all',
            periode: 'today'
        };
        this.refreshInterval = null;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init(permissions) {
        try {
            this.permissions = permissions;
            
            // Charger les données
            await this.loadData();
            
            // Rendre la vue
            this.render();
            
            // Attacher les événements
            this.attachEvents();
            
            // Auto-refresh toutes les 5 minutes
            this.startAutoRefresh();
            
        } catch (error) {
            console.error('Erreur initialisation alertes:', error);
            this.showError(error);
        }
    }
    
    async loadData() {
        // Charger tous les dossiers actifs
        this.dossiers = await subventionsFirestore.getDossiers({
            orderBy: ['dates.modification', 'desc']
        });
        
        // Calculer toutes les alertes
        this.alertes = await subventionsService.calculateAlertes(this.dossiers);
        
        // Grouper par type et niveau
        this.groupedAlertes = this.groupAlertes(this.alertes);
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.getElementById('subventions-alerts-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="alerts-dashboard">
                <!-- Header avec stats -->
                <div class="alerts-header">
                    <div class="header-content">
                        <h2>Centre d'alertes et de rappels</h2>
                        <p class="subtitle">
                            ${this.alertes.length} alerte${this.alertes.length > 1 ? 's' : ''} 
                            nécessitant votre attention
                        </p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-secondary" id="btn-refresh">
                            <i class="icon-refresh-cw"></i>
                            Actualiser
                        </button>
                        <button class="btn btn-primary" id="btn-export-alerts">
                            <i class="icon-download"></i>
                            Exporter
                        </button>
                    </div>
                </div>
                
                <!-- Statistiques rapides -->
                <div class="alerts-stats">
                    ${this.renderStats()}
                </div>
                
                <!-- Filtres -->
                <div class="alerts-filters">
                    <div class="filter-group">
                        <label>Niveau</label>
                        <select id="filter-niveau" class="form-select">
                            <option value="all">Tous</option>
                            <option value="urgent">Urgent</option>
                            <option value="warning">Attention</option>
                            <option value="info">Information</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Type</label>
                        <select id="filter-type" class="form-select">
                            <option value="all">Tous</option>
                            <option value="document_manquant">Documents manquants</option>
                            <option value="retard_mdph">Retards MDPH</option>
                            <option value="attestation">Attestations</option>
                            <option value="recepisse">Récépissés</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Technicien</label>
                        <select id="filter-technicien" class="form-select">
                            <option value="all">Tous</option>
                            ${this.getTechniciensOptions()}
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Période</label>
                        <select id="filter-periode" class="form-select">
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                            <option value="all">Toutes</option>
                        </select>
                    </div>
                </div>
                
                <!-- Groupes d'alertes -->
                <div class="alerts-groups">
                    ${this.renderAlertGroups()}
                </div>
                
                <!-- Timeline des prochains jours -->
                <div class="alerts-timeline">
                    <h3>📅 Prochains jours</h3>
                    ${this.renderUpcomingTimeline()}
                </div>
            </div>
        `;
    }
    
    renderStats() {
        const stats = {
            urgent: this.alertes.filter(a => a.niveau === 'urgent').length,
            warning: this.alertes.filter(a => a.niveau === 'warning').length,
            info: this.alertes.filter(a => a.niveau === 'info').length,
            retards: this.alertes.filter(a => a.type.includes('retard')).length
        };
        
        return `
            <div class="stat-card urgent">
                <div class="stat-icon">🔴</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.urgent}</div>
                    <div class="stat-label">Urgentes</div>
                </div>
            </div>
            
            <div class="stat-card warning">
                <div class="stat-icon">🟡</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.warning}</div>
                    <div class="stat-label">Attention</div>
                </div>
            </div>
            
            <div class="stat-card info">
                <div class="stat-icon">🔵</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.info}</div>
                    <div class="stat-label">Information</div>
                </div>
            </div>
            
            <div class="stat-card retard">
                <div class="stat-icon">⏰</div>
                <div class="stat-content">
                    <div class="stat-value">${stats.retards}</div>
                    <div class="stat-label">Retards</div>
                </div>
            </div>
        `;
    }
    
    renderAlertGroups() {
        const filteredAlertes = this.getFilteredAlertes();
        
        if (filteredAlertes.length === 0) {
            return `
                <div class="empty-state">
                    <i class="icon-check-circle"></i>
                    <h3>Aucune alerte</h3>
                    <p>Tous les dossiers sont à jour</p>
                </div>
            `;
        }
        
        // Grouper par niveau
        const groups = {
            urgent: filteredAlertes.filter(a => a.niveau === 'urgent'),
            warning: filteredAlertes.filter(a => a.niveau === 'warning'),
            info: filteredAlertes.filter(a => a.niveau === 'info')
        };
        
        let html = '';
        
        // Alertes urgentes
        if (groups.urgent.length > 0) {
            html += `
                <div class="alert-group urgent">
                    <h3 class="group-title">
                        <span class="group-icon">🔴</span>
                        Urgent (${groups.urgent.length})
                    </h3>
                    <div class="alerts-list">
                        ${groups.urgent.map(alerte => this.renderAlertCard(alerte)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Alertes attention
        if (groups.warning.length > 0) {
            html += `
                <div class="alert-group warning">
                    <h3 class="group-title">
                        <span class="group-icon">🟡</span>
                        À surveiller (${groups.warning.length})
                    </h3>
                    <div class="alerts-list">
                        ${groups.warning.map(alerte => this.renderAlertCard(alerte)).join('')}
                    </div>
                </div>
            `;
        }
        
        // Alertes info
        if (groups.info.length > 0) {
            html += `
                <div class="alert-group info">
                    <h3 class="group-title">
                        <span class="group-icon">🔵</span>
                        Information (${groups.info.length})
                    </h3>
                    <div class="alerts-list">
                        ${groups.info.map(alerte => this.renderAlertCard(alerte)).join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    renderAlertCard(alerte) {
        const dossier = this.dossiers.find(d => d.id === alerte.dossierId);
        if (!dossier) return '';
        
        return `
            <div class="alert-card ${alerte.niveau}" data-dossier-id="${alerte.dossierId}">
                <div class="alert-header">
                    <div class="alert-patient">
                        <strong>${alerte.patient}</strong>
                        <span class="dossier-numero">${dossier.numeroDossier}</span>
                    </div>
                    <div class="alert-meta">
                        <span class="alert-type">${this.getTypeLabel(alerte.type)}</span>
                        ${alerte.joursRetard ? 
                            `<span class="alert-delay">${alerte.joursRetard}j de retard</span>` : 
                            ''
                        }
                    </div>
                </div>
                
                <div class="alert-content">
                    <p class="alert-message">${alerte.message}</p>
                    
                    <div class="alert-details">
                        <span class="detail-item">
                            <i class="icon-user"></i>
                            ${dossier.organisation.technicien.nom}
                        </span>
                        <span class="detail-item">
                            <i class="icon-calendar"></i>
                            ${this.formatDate(alerte.date)}
                        </span>
                    </div>
                </div>
                
                <div class="alert-actions">
                    <button class="btn btn-sm btn-secondary" 
                            onclick="window.location.hash='#subventions/detail/${alerte.dossierId}'">
                        <i class="icon-eye"></i>
                        Voir le dossier
                    </button>
                    ${alerte.action ? `
                        <button class="btn btn-sm btn-primary btn-action" 
                                data-action="${alerte.action}"
                                data-dossier-id="${alerte.dossierId}">
                            <i class="icon-zap"></i>
                            ${alerte.actionLabel}
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-ghost btn-dismiss" 
                            data-alerte-id="${alerte.id}">
                        <i class="icon-x"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderUpcomingTimeline() {
        const upcoming = this.getUpcomingEvents();
        
        if (upcoming.length === 0) {
            return '<p class="text-muted">Aucun événement prévu dans les prochains jours</p>';
        }
        
        // Grouper par jour
        const byDay = {};
        upcoming.forEach(event => {
            const day = event.date.toDateString();
            if (!byDay[day]) {
                byDay[day] = [];
            }
            byDay[day].push(event);
        });
        
        return Object.entries(byDay).map(([day, events]) => `
            <div class="timeline-day">
                <h4 class="day-title">${this.formatDayTitle(new Date(day))}</h4>
                <div class="day-events">
                    ${events.map(event => `
                        <div class="timeline-event">
                            <span class="event-time">${this.formatTime(event.date)}</span>
                            <span class="event-type">${this.getEventIcon(event.type)}</span>
                            <span class="event-patient">${event.patient}</span>
                            <span class="event-message">${event.message}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    // ========================================
    // FILTRAGE ET TRI
    // ========================================
    
    getFilteredAlertes() {
        let filtered = [...this.alertes];
        
        // Filtre niveau
        if (this.filters.niveau !== 'all') {
            filtered = filtered.filter(a => a.niveau === this.filters.niveau);
        }
        
        // Filtre type
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(a => a.type === this.filters.type);
        }
        
        // Filtre technicien
        if (this.filters.technicien !== 'all') {
            const dossierIds = this.dossiers
                .filter(d => d.organisation.technicien.id === this.filters.technicien)
                .map(d => d.id);
            filtered = filtered.filter(a => dossierIds.includes(a.dossierId));
        }
        
        // Filtre période
        if (this.filters.periode !== 'all') {
            const now = new Date();
            let startDate = new Date();
            
            switch (this.filters.periode) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }
            
            filtered = filtered.filter(a => new Date(a.date) >= startDate);
        }
        
        return filtered;
    }
    
    groupAlertes(alertes) {
        const groups = {};
        
        alertes.forEach(alerte => {
            const key = `${alerte.niveau}-${alerte.type}`;
            if (!groups[key]) {
                groups[key] = {
                    niveau: alerte.niveau,
                    type: alerte.type,
                    alertes: []
                };
            }
            groups[key].alertes.push(alerte);
        });
        
        return groups;
    }
    
    getUpcomingEvents() {
        const events = [];
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        // Extraire les événements futurs des alertes
        this.alertes.forEach(alerte => {
            if (alerte.datePrevu && new Date(alerte.datePrevu) > now && new Date(alerte.datePrevu) < nextWeek) {
                events.push({
                    date: new Date(alerte.datePrevu),
                    type: alerte.type,
                    patient: alerte.patient,
                    message: alerte.message,
                    dossierId: alerte.dossierId
                });
            }
        });
        
        // Trier par date
        events.sort((a, b) => a.date - b.date);
        
        return events;
    }
    
    // ========================================
    // ACTIONS
    // ========================================
    
    async handleAlertAction(action, dossierId) {
        const dossier = this.dossiers.find(d => d.id === dossierId);
        if (!dossier) return;
        
        switch (action) {
            case 'call':
                this.callPatient(dossier);
                break;
                
            case 'email':
                this.emailPatient(dossier);
                break;
                
            case 'requestAttestation':
                await this.requestAttestation(dossier);
                break;
                
            case 'relancer':
                await this.relancer(dossier);
                break;
                
            default:
                console.warn('Action non gérée:', action);
        }
    }
    
    callPatient(dossier) {
        const modal = subventionsConfig.factories.Modal({
            title: 'Appeler le patient',
            content: `
                <div class="call-info">
                    <p><strong>Patient :</strong> ${dossier.patient.nom} ${dossier.patient.prenom}</p>
                    <p><strong>Téléphone :</strong> ${dossier.patient.telephone || 'Non renseigné'}</p>
                    
                    <div class="form-group">
                        <label>Notes d'appel</label>
                        <textarea id="call-notes" 
                                  class="form-textarea" 
                                  rows="4"
                                  placeholder="Résumé de l'appel..."></textarea>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Annuler',
                    variant: 'secondary',
                    onClick: (modal) => modal.close()
                },
                {
                    text: 'Enregistrer l\'appel',
                    variant: 'primary',
                    onClick: async (modal) => {
                        const notes = document.getElementById('call-notes').value;
                        await this.saveCallLog(dossier.id, notes);
                        modal.close();
                    }
                }
            ]
        });
        modal.open();
    }
    
    emailPatient(dossier) {
        // Rediriger vers l'interface d'email
        sessionStorage.setItem('email-context', JSON.stringify({
            patientId: dossier.patient.id,
            dossierId: dossier.id,
            template: 'rappel'
        }));
        
        // TODO: Ouvrir interface email
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Interface email à venir...'
        });
        toast.show();
    }
    
    async requestAttestation(dossier) {
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Demande d\'attestation en cours...',
            duration: 0
        });
        toast.show();
        
        try {
            // TODO: Générer et envoyer la demande
            await subventionsFirestore.updateDossier(dossier.id, {
                'documents.agefiph.attestation_employeur.dateDemandePrevu': new Date(),
                addToHistory: {
                    action: 'attestation_demandee',
                    utilisateur: this.permissions.userName,
                    details: 'Demande d\'attestation employeur envoyée suite à alerte'
                }
            });
            
            toast.hide();
            
            const successToast = subventionsConfig.factories.Toast({
                type: 'success',
                message: 'Demande d\'attestation envoyée'
            });
            successToast.show();
            
            // Rafraîchir les alertes
            await this.refresh();
            
        } catch (error) {
            toast.hide();
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de l\'envoi'
            });
            errorToast.show();
        }
    }
    
    async relancer(dossier) {
        // TODO: Interface de relance
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Relance enregistrée'
        });
        toast.show();
    }
    
    async saveCallLog(dossierId, notes) {
        await subventionsFirestore.updateDossier(dossierId, {
            addToHistory: {
                action: 'appel_patient',
                utilisateur: this.permissions.userName,
                details: `Appel patient. ${notes || 'Pas de notes'}`
            }
        });
        
        const toast = subventionsConfig.factories.Toast({
            type: 'success',
            message: 'Appel enregistré'
        });
        toast.show();
    }
    
    async dismissAlert(alerteId) {
        // TODO: Marquer l'alerte comme traitée
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Alerte masquée'
        });
        toast.show();
        
        // Retirer de la liste
        this.alertes = this.alertes.filter(a => a.id !== alerteId);
        this.render();
        this.attachEvents();
    }
    
    // ========================================
    // EXPORT
    // ========================================
    
    async exportAlerts() {
        try {
            const data = this.getFilteredAlertes().map(alerte => {
                const dossier = this.dossiers.find(d => d.id === alerte.dossierId);
                return {
                    'Niveau': alerte.niveau,
                    'Type': this.getTypeLabel(alerte.type),
                    'Patient': alerte.patient,
                    'Dossier': dossier?.numeroDossier || '',
                    'Message': alerte.message,
                    'Date': this.formatDate(alerte.date),
                    'Technicien': dossier?.organisation.technicien.nom || ''
                };
            });
            
            // TODO: Implémenter l'export Excel
            console.log('Export data:', data);
            
            const toast = subventionsConfig.factories.Toast({
                type: 'success',
                message: 'Export généré'
            });
            toast.show();
            
        } catch (error) {
            const toast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de l\'export'
            });
            toast.show();
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Boutons header
        document.getElementById('btn-refresh')?.addEventListener('click', () => {
            this.refresh();
        });
        
        document.getElementById('btn-export-alerts')?.addEventListener('click', () => {
            this.exportAlerts();
        });
        
        // Filtres
        document.getElementById('filter-niveau')?.addEventListener('change', (e) => {
            this.filters.niveau = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filter-type')?.addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filter-technicien')?.addEventListener('change', (e) => {
            this.filters.technicien = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filter-periode')?.addEventListener('change', (e) => {
            this.filters.periode = e.target.value;
            this.applyFilters();
        });
        
        // Actions sur les alertes
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const dossierId = e.currentTarget.dataset.dossierId;
                this.handleAlertAction(action, dossierId);
            });
        });
        
        // Masquer alerte
        document.querySelectorAll('.btn-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const alerteId = e.currentTarget.dataset.alerteId;
                this.dismissAlert(alerteId);
            });
        });
        
        // Clic sur carte alerte
        document.querySelectorAll('.alert-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const dossierId = card.dataset.dossierId;
                    window.location.hash = `#subventions/detail/${dossierId}`;
                }
            });
        });
    }
    
    applyFilters() {
        this.render();
        this.attachEvents();
    }
    
    // ========================================
    // REFRESH
    // ========================================
    
    async refresh() {
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Actualisation...',
            duration: 0
        });
        toast.show();
        
        try {
            await this.loadData();
            this.render();
            this.attachEvents();
            
            toast.hide();
            
            const successToast = subventionsConfig.factories.Toast({
                type: 'success',
                message: 'Alertes actualisées'
            });
            successToast.show();
            
        } catch (error) {
            toast.hide();
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de l\'actualisation'
            });
            errorToast.show();
        }
    }
    
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    getTechniciensOptions() {
        const techniciens = [...new Set(this.dossiers.map(d => 
            JSON.stringify({
                id: d.organisation.technicien.id,
                nom: d.organisation.technicien.nom
            })
        ))].map(t => JSON.parse(t));
        
        return techniciens.map(t => 
            `<option value="${t.id}">${t.nom}</option>`
        ).join('');
    }
    
    getTypeLabel(type) {
        const labels = {
            'document_manquant': 'Documents',
            'retard_mdph': 'Retard MDPH',
            'retard_critique': 'Retard critique',
            'attestation_requise': 'Attestation',
            'attestation_expire': 'Expiration',
            'recepisse_proche': 'Récépissé',
            'relance': 'Relance',
            'delai_mdph': 'Délai MDPH'
        };
        
        return labels[type] || type;
    }
    
    getEventIcon(type) {
        const icons = {
            'document_manquant': '📄',
            'retard_mdph': '⚠️',
            'attestation_requise': '📧',
            'recepisse_proche': '📮',
            'relance': '☎️',
            'default': '📌'
        };
        
        return icons[type] || icons.default;
    }
    
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    }
    
    formatTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    formatDayTitle(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Aujourd\'hui';
        }
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Demain';
        }
        
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }
    
    showError(error) {
        const container = document.getElementById('subventions-alerts-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="icon-alert-circle"></i>
                    <h2>Erreur</h2>
                    <p>${error.message || error}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Rafraîchir
                    </button>
                </div>
            `;
        }
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export de l'instance
export const subventionsAlerts = new SubventionsAlerts();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsAlerts;