// ========================================
// SUBVENTIONS.LIST.JS - Orchestrateur liste des dossiers
// Chemin: modules/subventions/subventions.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des dossiers avec :
// - Widget d'alertes du jour
// - Timeline hebdomadaire
// - Tableau avec double suivi MDPH/AGEFIPH
// - Interactions et filtres
//
// STRUCTURE:
// - initList()
// - renderAlertsWidget()
// - renderWeeklyTimeline()
// - renderDossiersTable()
// - handleTableInteractions()
// ========================================

import { DataTable } from '../../../src/components/index.js';
import { subventionsFirestore } from '../core/subventions.firestore.js';
import { subventionsService } from '../core/subventions.service.js';
import { subventionsConfig } from '../core/subventions.config.js';
// Import direct du service clients
import { ClientsService } from '../../../src/services/clients.service.js';

class SubventionsCreate {
    constructor() {
        this.dossiers = [];
        this.alertes = [];
        this.timelineEvents = [];
        this.filters = {
            search: '',
            status: 'all',
            technicien: 'all',
            periode: 'all'
        };
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        // Charger les données
        await this.loadData();
        
        // Rendre les composants
        this.renderPage();
        
        // Attacher les événements
        this.attachEvents();
        
        // Rafraîchir toutes les 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshAlertes();
        }, 5 * 60 * 1000);
    }
    
    async loadData() {
        try {
            // Charger les dossiers
            this.dossiers = await subventionsFirestore.getDossiers({
                orderBy: ['dates.modification', 'desc']
            });
            
            // Calculer les alertes
            this.alertes = await subventionsService.calculateAlertes(this.dossiers);
            
            // Calculer la timeline
            this.timelineEvents = await subventionsService.getWeeklyEvents(this.dossiers);
            
        } catch (error) {
            console.error('Erreur chargement données:', error);
        }
    }
    
    // ========================================
    // RENDU DE LA PAGE
    // ========================================
    
    renderPage() {
        const container = document.getElementById('subventions-list-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="subventions-list-page">
                <!-- Header avec actions -->
                <div class="page-header">
                    <h1>📋 Dossiers de Subvention</h1>
                    <div class="header-actions">
                        <button class="btn btn-success" id="btn-nouveau-dossier">
                            <i class="icon-plus"></i> Nouveau dossier
                        </button>
                        <button class="btn btn-ghost" id="btn-export">
                            <i class="icon-download"></i> Exporter
                        </button>
                    </div>
                </div>
                
                <!-- Widgets du haut -->
                <div class="top-widgets">
                    <div id="alerts-widget" class="widget"></div>
                    <div id="timeline-widget" class="widget"></div>
                </div>
                
                <!-- Filtres -->
                <div class="filters-section">
                    <div class="search-box">
                        <input type="text" 
                               id="search-input" 
                               placeholder="Rechercher un patient, n° dossier..."
                               class="form-input">
                    </div>
                    <div class="filters">
                        <select id="filter-status" class="form-select">
                            <option value="all">Tous les statuts</option>
                            <option value="en_cours">En cours</option>
                            <option value="attente">En attente</option>
                            <option value="retard">En retard</option>
                            <option value="termine">Terminé</option>
                        </select>
                        <select id="filter-technicien" class="form-select">
                            <option value="all">Tous les techniciens</option>
                            ${this.getTechniciensOptions()}
                        </select>
                        <select id="filter-periode" class="form-select">
                            <option value="all">Toute période</option>
                            <option value="today">Aujourd'hui</option>
                            <option value="week">Cette semaine</option>
                            <option value="month">Ce mois</option>
                        </select>
                    </div>
                </div>
                
                <!-- Tableau principal -->
                <div id="table-container" class="table-section"></div>
            </div>
        `;
        
        // Rendre chaque composant
        this.renderAlertsWidget();
        this.renderWeeklyTimeline();
        this.renderDossiersTable();
    }
    
    // ========================================
    // WIDGET ALERTES
    // ========================================
    
    renderAlertsWidget() {
        const container = document.getElementById('alerts-widget');
        if (!container) return;
        
        // Séparer les alertes par priorité
        const urgent = this.alertes.filter(a => a.niveau === 'urgent');
        const aVenir = this.alertes.filter(a => a.niveau === 'warning');
        
        container.innerHTML = `
            <div class="alerts-widget">
                <div class="alerts-header">
                    <h3>⏰ ALERTES DU JOUR</h3>
                    <div class="alerts-line"></div>
                </div>
                
                ${urgent.length > 0 ? `
                    <div class="alerts-section urgent">
                        <h4>🔴 URGENT (${urgent.length})</h4>
                        <ul class="alerts-list">
                            ${urgent.map(alerte => `
                                <li class="alert-item" data-dossier-id="${alerte.dossierId}">
                                    <span class="alert-patient">${alerte.patient}</span> : 
                                    <span class="alert-message">${alerte.message}</span>
                                    <button class="alert-action" data-action="${alerte.action}">
                                        ${alerte.actionLabel || '→'}
                                    </button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${aVenir.length > 0 ? `
                    <div class="alerts-section warning">
                        <h4>🟡 À VENIR (${aVenir.length})</h4>
                        <ul class="alerts-list">
                            ${aVenir.map(alerte => `
                                <li class="alert-item" data-dossier-id="${alerte.dossierId}">
                                    <span class="alert-patient">${alerte.patient}</span> : 
                                    <span class="alert-message">${alerte.message}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${urgent.length === 0 && aVenir.length === 0 ? `
                    <div class="no-alerts">
                        <p>✅ Aucune alerte pour aujourd'hui</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Attacher les événements des alertes
        container.querySelectorAll('.alert-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('alert-action')) {
                    const dossierId = item.dataset.dossierId;
                    this.openDossier(dossierId);
                }
            });
        });
        
        container.querySelectorAll('.alert-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const dossierId = btn.closest('.alert-item').dataset.dossierId;
                this.handleAlertAction(action, dossierId);
            });
        });
    }
    
    // ========================================
    // TIMELINE HEBDOMADAIRE
    // ========================================
    
    renderWeeklyTimeline() {
        const container = document.getElementById('timeline-widget');
        if (!container) return;
        
        const days = this.getWeekDays();
        
        container.innerHTML = `
            <div class="weekly-timeline">
                <div class="timeline-header">
                    <h3>📅 TIMELINE CETTE SEMAINE</h3>
                    <div class="timeline-line"></div>
                </div>
                
                <div class="timeline-grid">
                    <div class="timeline-days">
                        ${days.map(day => `
                            <div class="timeline-day ${day.isToday ? 'today' : ''}">
                                <div class="day-name">${day.name}</div>
                                <div class="day-number">${day.isToday ? '[' + day.number + ']' : day.number}</div>
                                <div class="day-events">
                                    ${this.getEventsForDay(day.date).map(event => `
                                        <div class="event-icon" 
                                             title="${event.title}"
                                             data-dossier-id="${event.dossierId}">
                                            ${event.icon}
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="day-label">
                                    ${day.isToday ? 'TODAY' : this.getEventLabelForDay(day.date)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // Événements timeline
        container.querySelectorAll('.event-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const dossierId = icon.dataset.dossierId;
                this.openDossier(dossierId);
            });
        });
    }
    
    // ========================================
    // TABLEAU PRINCIPAL
    // ========================================
    
    renderDossiersTable() {
        const container = document.getElementById('table-container');
        if (!container) return;
        
        // Configuration du tableau
        const tableConfig = {
            data: this.getFilteredDossiers(),
            columns: [
                {
                    key: 'patient',
                    label: 'Patient',
                    sortable: true,
                    render: (row) => `
                        <div class="patient-cell">
                            <div class="patient-name">${row.patient.nom} ${row.patient.prenom}</div>
                            <div class="patient-info">${row.patient.telephone}</div>
                        </div>
                    `
                },
                {
                    key: 'numeroDossier',
                    label: 'N° Dossier',
                    sortable: true,
                    width: '120px'
                },
                {
                    key: 'statut',
                    label: 'Statut Global',
                    width: '300px',
                    render: (row) => this.renderStatutGlobal(row)
                },
                {
                    key: 'technicien',
                    label: 'Technicien',
                    sortable: true,
                    width: '150px',
                    render: (row) => row.organisation.technicien.nom
                },
                {
                    key: 'montant',
                    label: 'Montant',
                    sortable: true,
                    width: '100px',
                    render: (row) => `${(row.montants.appareil / 100).toFixed(0)}€`
                },
                {
                    key: 'actions',
                    label: '',
                    width: '80px',
                    render: (row) => `
                        <div class="table-actions">
                            <button class="btn-icon" data-action="view" data-id="${row.id}">
                                <i class="icon-eye"></i>
                            </button>
                            <button class="btn-icon" data-action="edit" data-id="${row.id}">
                                <i class="icon-edit"></i>
                            </button>
                        </div>
                    `
                }
            ],
            striped: true,
            hover: true,
            emptyText: 'Aucun dossier trouvé',
            onRowClick: (row) => this.openDossier(row.id)
        };
        
        // Créer le tableau
        this.table = new DataTable(tableConfig);
        container.appendChild(this.table.getElement());
        
        // Attacher les événements des actions
        this.attachTableEvents();
    }
    
    renderStatutGlobal(dossier) {
        const mdph = dossier.workflow.mdph;
        const agefiph = dossier.workflow.agefiph;
        
        // Calculer les classes et icônes
        const mdphClass = this.getStatutClass(mdph.statut);
        const agefiClass = this.getStatutClass(agefiph.statut);
        const globalProgress = Math.round((mdph.progression + agefiph.progression) / 2);
        
        return `
            <div class="statut-global-cell">
                <div class="statut-header">
                    <div class="statut-mdph ${mdphClass}">
                        MDPH: ${this.getStatutLabel(mdph.statut)}
                    </div>
                    <div class="statut-separator">|</div>
                    <div class="statut-agefiph ${agefiClass}">
                        AGEF: ${this.getStatutLabel(agefiph.statut)}
                    </div>
                </div>
                <div class="statut-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-dual">
                            <div class="progress-fill mdph" 
                                 style="width: ${mdph.progression}%"
                                 title="MDPH: ${mdph.progression}%">
                            </div>
                            <div class="progress-fill agefiph" 
                                 style="width: ${agefiph.progression}%"
                                 title="AGEFIPH: ${agefiph.progression}%">
                            </div>
                        </div>
                    </div>
                    <span class="progress-text">${globalProgress}%</span>
                </div>
                ${this.hasAlert(dossier) ? '<span class="status-alert">⚠️</span>' : ''}
            </div>
        `;
    }
    
    // ========================================
    // INTERACTIONS
    // ========================================
    
    attachEvents() {
        // Nouveau dossier
        document.getElementById('btn-nouveau-dossier')?.addEventListener('click', () => {
            window.subventionsCreate.openCreateModal();
        });
        
        // Export
        document.getElementById('btn-export')?.addEventListener('click', () => {
            this.exportDossiers();
        });
        
        // Filtres
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
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
    }
    
    attachTableEvents() {
        // Actions dans le tableau
        document.querySelectorAll('.table-actions button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                
                if (action === 'view') {
                    this.openDossier(id);
                } else if (action === 'edit') {
                    this.editDossier(id);
                }
            });
        });
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    getFilteredDossiers() {
        let filtered = [...this.dossiers];
        
        // Recherche
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(d => 
                d.patient.nom.toLowerCase().includes(search) ||
                d.patient.prenom.toLowerCase().includes(search) ||
                d.numeroDossier.toLowerCase().includes(search)
            );
        }
        
        // Statut
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(d => {
                if (this.filters.status === 'retard') {
                    return this.hasRetard(d);
                }
                return this.getGlobalStatus(d) === this.filters.status;
            });
        }
        
        // Technicien
        if (this.filters.technicien !== 'all') {
            filtered = filtered.filter(d => 
                d.organisation.technicien.id === this.filters.technicien
            );
        }
        
        // Période
        if (this.filters.periode !== 'all') {
            filtered = filtered.filter(d => 
                this.isInPeriod(d, this.filters.periode)
            );
        }
        
        return filtered;
    }
    
    applyFilters() {
        this.renderDossiersTable();
    }
    
    getWeekDays() {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            
            days.push({
                name: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i],
                number: date.getDate(),
                date: date,
                isToday: date.toDateString() === today.toDateString()
            });
        }
        
        return days;
    }
    
    getEventsForDay(date) {
        return this.timelineEvents.filter(event => 
            event.date.toDateString() === date.toDateString()
        );
    }
    
    getEventLabelForDay(date) {
        const events = this.getEventsForDay(date);
        if (events.length === 0) return '';
        
        // Prendre l'événement le plus important
        const mainEvent = events.find(e => e.priority === 'high') || events[0];
        return mainEvent.shortLabel || '';
    }
    
    getStatutClass(statut) {
        const classes = {
            'nouveau': 'status-new',
            'documents': 'status-docs',
            'formulaire': 'status-form',
            'depot': 'status-submitted',
            'recepisse': 'status-receipt',
            'accord': 'status-approved',
            'attente': 'status-waiting',
            'finalisation': 'status-finalizing',
            'soumis': 'status-sent',
            'decision': 'status-decision'
        };
        
        return classes[statut] || 'status-default';
    }
    
    getStatutLabel(statut) {
        const labels = {
            'nouveau': '📝',
            'documents': '📄',
            'formulaire': '✍️',
            'depot': '📮',
            'recepisse': '📋',
            'accord': '✅',
            'attente': '⏸️',
            'finalisation': '📋',
            'soumis': '📮',
            'decision': '✅'
        };
        
        return labels[statut] || statut;
    }
    
    hasAlert(dossier) {
        return this.alertes.some(a => a.dossierId === dossier.id);
    }
    
    hasRetard(dossier) {
        // Logique pour déterminer si le dossier est en retard
        const delaisDepartement = subventionsService.getDelaisDepartement(
            dossier.patient.adresse.departement
        );
        
        if (dossier.workflow.mdph.dates.depot) {
            const joursEcoules = subventionsService.getJoursEcoules(
                dossier.workflow.mdph.dates.depot
            );
            return joursEcoules > delaisDepartement.delai;
        }
        
        return false;
    }
    
    openDossier(dossierId) {
        window.location.hash = `#subventions/detail/${dossierId}`;
    }
    
    editDossier(dossierId) {
        window.location.hash = `#subventions/edit/${dossierId}`;
    }
    
    handleAlertAction(action, dossierId) {
        switch(action) {
            case 'call':
                this.openCallModal(dossierId);
                break;
            case 'email':
                this.openEmailModal(dossierId);
                break;
            case 'requestAttestation':
                this.requestAttestation(dossierId);
                break;
            default:
                this.openDossier(dossierId);
        }
    }
    
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
    
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.table) {
            this.table.destroy();
        }
    }
}

// Export de l'instance
export const subventionsList = new SubventionsList();
export const subventionsCreate = new SubventionsCreate();