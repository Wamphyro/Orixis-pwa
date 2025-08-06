// ========================================
// SUBVENTIONS.DETAIL.JS - Vue détaillée d'un dossier
// Chemin: modules/subventions/orchestrators/subventions.detail.js
//
// DESCRIPTION:
// Orchestrateur pour l'affichage détaillé d'un dossier
// Intègre les 3 composants visuels créés
// ========================================

import config from '../core/subventions.config.js';
// TODO: Créer ces services ou commenter pour l'instant
// import { subventionsFirestore } from '../core/subventions.firestore.js';
// import { subventionsService } from '../core/subventions.service.js';
// import { subventionsUploadService } from '../core/subventions.upload.service.js';

class SubventionsDetail {
    constructor() {
        this.dossierId = null;
        this.dossier = null;
        this.permissions = null;
        this.components = {};
        this.unsubscribe = null;
        this.editMode = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init(dossierId, permissions) {
        try {
            this.dossierId = dossierId;
            this.permissions = permissions;
            
            // Charger le dossier
            await this.loadDossier();
            
            // Rendre la vue
            this.render();
            
            // Initialiser les composants
            this.initComponents();
            
            // Attacher les événements
            this.attachEvents();
            
            // S'abonner aux changements
            this.subscribeToChanges();
            
        } catch (error) {
            console.error('Erreur initialisation détail:', error);
            this.showError(error);
        }
    }
    
    async loadDossier() {
    // TODO: this.dossier = await subventionsFirestore.getDossier(this.dossierId);
    
    // MOCK DATA pour tester
    this.dossier = {
        id: this.dossierId,
        numeroDossier: 'SUB-2024-0001',
        type: 'mdph_agefiph',
        patient: {
            nom: 'MARTIN',
            prenom: 'Jean',
            telephone: '06 12 34 56 78',
            email: 'jean.martin@email.fr',
            dateNaissance: '1985-03-15',
            departement: '75',
            situation: 'salarie'
        },
        workflow: {
            mdph: {
                statut: 'depot',
                progression: 60,
                dates: {
                    creation: new Date('2024-01-15'),
                    documents: new Date('2024-01-20'),
                    formulaire: new Date('2024-01-25'),
                    depot: new Date('2024-01-30'),
                    recepisse: null,
                    accord: null
                }
            },
            agefiph: {
                statut: 'documents',
                progression: 20,
                bloque: false,
                dates: {
                    debut: new Date('2024-01-15'),
                    documents: new Date('2024-01-20')
                }
            }
        },
        montants: {
            appareil: 3500,
            accordeMDPH: 0,
            accordeAGEFIPH: 0,
            mutuelle: 500,
            resteACharge: 3000
        },
        documents: {
            mdph: {},
            agefiph: {}
        },
        acces: {
            code: 'MARTIN-2024-X7B3',
            actif: true,
            derniereConnexion: null
        },
        historique: []
    };
        
        if (!this.dossier) {
            throw new Error('Dossier non trouvé');
        }
        
        // Mettre à jour le breadcrumb
        const breadcrumb = [
            `${this.dossier.patient.nom} ${this.dossier.patient.prenom}`,
            this.dossier.numeroDossier
        ];
        window.subventionsMain?.updateBreadcrumb(breadcrumb);
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.getElementById('subventions-detail-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="detail-dossier">
                <!-- Header avec infos patient et actions -->
                <div class="detail-header">
                    <div class="patient-header">
                        <div class="patient-avatar">
                            ${this.getInitials()}
                        </div>
                        <div class="patient-info">
                            <h2>${this.dossier.patient.nom} ${this.dossier.patient.prenom}</h2>
                            <p class="patient-meta">
                                ${this.dossier.patient.dateNaissance ? `Né(e) le ${this.formatDate(this.dossier.patient.dateNaissance)} • ` : ''}
                                ${this.dossier.patient.telephone || 'Pas de téléphone'} 
                                ${this.dossier.patient.email ? ` • ${this.dossier.patient.email}` : ''}
                            </p>
                            <div class="dossier-meta">
                                <span class="badge badge-primary">${this.dossier.numeroDossier}</span>
                                <span class="badge badge-${this.getTypeClass()}">${this.getTypeLabel()}</span>
                                <span class="badge badge-info">${this.getSituationLabel()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="header-actions">
                        ${this.permissions.canEdit ? `
                            <button class="btn btn-secondary" id="btn-edit">
                                <i class="icon-edit"></i>
                                ${this.editMode ? 'Annuler' : 'Modifier'}
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" id="btn-documents">
                            <i class="icon-folder"></i>
                            Documents
                        </button>
                        <div class="dropdown">
                            <button class="btn btn-ghost" id="btn-more">
                                <i class="icon-more-vertical"></i>
                            </button>
                            <div class="dropdown-menu" id="dropdown-menu">
                                <a href="#" class="dropdown-item" data-action="print">
                                    <i class="icon-printer"></i> Imprimer
                                </a>
                                <a href="#" class="dropdown-item" data-action="export">
                                    <i class="icon-download"></i> Exporter
                                </a>
                                <a href="#" class="dropdown-item" data-action="email">
                                    <i class="icon-mail"></i> Envoyer par email
                                </a>
                                ${this.permissions.canDelete ? `
                                    <hr>
                                    <a href="#" class="dropdown-item text-danger" data-action="delete">
                                        <i class="icon-trash"></i> Supprimer
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Onglets -->
                <div class="detail-tabs">
                    <nav class="tabs-nav">
                        <button class="tab-link active" data-tab="overview">
                            <i class="icon-dashboard"></i>
                            Vue d'ensemble
                        </button>
                        <button class="tab-link" data-tab="documents">
                            <i class="icon-folder"></i>
                            Documents
                            <span class="tab-badge">${this.countDocuments()}</span>
                        </button>
                        <button class="tab-link" data-tab="workflow">
                            <i class="icon-git-branch"></i>
                            Workflow
                        </button>
                        <button class="tab-link" data-tab="history">
                            <i class="icon-clock"></i>
                            Historique
                        </button>
                        <button class="tab-link" data-tab="finances">
                            <i class="icon-euro"></i>
                            Financements
                        </button>
                    </nav>
                </div>
                
                <!-- Contenu des onglets -->
                <div class="detail-content">
                    <!-- Vue d'ensemble -->
                    <div class="tab-content active" id="tab-overview">
                        <!-- Les 3 composants visuels -->
                        <div class="components-grid">
                            <div class="component-card">
                                <div id="progress-timeline-container"></div>
                            </div>
                            
                            <div class="component-card">
                                <div id="progress-overview-container"></div>
                            </div>
                            
                            <div class="component-card" id="delay-tracker-card" style="display: none;">
                                <div id="delay-tracker-container"></div>
                            </div>
                        </div>
                        
                        <!-- Informations rapides -->
                        <div class="quick-info-grid">
                            <div class="info-card">
                                <h4>Montants</h4>
                                <div class="info-content">
                                    <div class="info-item">
                                        <span class="info-label">Appareil :</span>
                                        <span class="info-value">${this.formatMontant(this.dossier.montants.appareil)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">MDPH :</span>
                                        <span class="info-value">${this.formatMontant(this.dossier.montants.accordeMDPH)}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">AGEFIPH :</span>
                                        <span class="info-value">${this.formatMontant(this.dossier.montants.accordeAGEFIPH)}</span>
                                    </div>
                                    <div class="info-item highlight">
                                        <span class="info-label">Reste à charge :</span>
                                        <span class="info-value">${this.formatMontant(this.dossier.montants.resteACharge)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="info-card">
                                <h4>Accès patient</h4>
                                <div class="info-content">
                                    <div class="access-code">
                                        <span class="code-label">Code d'accès :</span>
                                        <span class="code-value">${this.dossier.acces.code}</span>
                                        <button class="btn-copy" data-copy="${this.dossier.acces.code}">
                                            <i class="icon-copy"></i>
                                        </button>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Statut :</span>
                                        <span class="info-value">
                                            ${this.dossier.acces.actif ? 
                                                '<span class="text-success">Actif</span>' : 
                                                '<span class="text-danger">Inactif</span>'
                                            }
                                        </span>
                                    </div>
                                    ${this.dossier.acces.derniereConnexion ? `
                                        <div class="info-item">
                                            <span class="info-label">Dernière connexion :</span>
                                            <span class="info-value">${this.formatDateTime(this.dossier.acces.derniereConnexion)}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="info-card">
                                <h4>Prochaines actions</h4>
                                <div class="info-content">
                                    ${this.getNextActions()}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Documents -->
                    <div class="tab-content" id="tab-documents">
                        <div class="documents-container">
                            <!-- Sera rempli par subventions.documents.js -->
                        </div>
                    </div>
                    
                    <!-- Workflow -->
                    <div class="tab-content" id="tab-workflow">
                        <div class="workflow-container">
                            <!-- Sera rempli par subventions.workflow.js -->
                        </div>
                    </div>
                    
                    <!-- Historique -->
                    <div class="tab-content" id="tab-history">
                        <div class="history-container">
                            ${this.renderHistory()}
                        </div>
                    </div>
                    
                    <!-- Financements -->
                    <div class="tab-content" id="tab-finances">
                        <div class="finances-container">
                            ${this.renderFinances()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // COMPOSANTS VISUELS
    // ========================================
    
    initComponents() {
        // Progress Timeline
        this.components.timeline = config.createProgressTimeline({
            container: '#progress-timeline-container',
            title: 'PROGRESSION GLOBALE',
            items: this.getTimelineItems(),
            onItemClick: (item, index) => {
                console.log('Timeline item clicked:', item);
            }
        });
        
        // Progress Overview
        this.components.overview = config.createProgressOverview({
            container: '#progress-overview-container',
            title: 'VUE D\'ENSEMBLE DU PARCOURS',
            items: this.getOverviewItems(),
            onItemClick: (item) => {
                if (item.id === 'mdph') {
                    this.switchTab('workflow');
                }
            }
        });
        
        // Delay Tracker (si retard)
        if (this.hasDelay()) {
            document.getElementById('delay-tracker-card').style.display = 'block';
            
            this.components.delayTracker = config.createDelayTracker({
                container: '#delay-tracker-container',
                title: this.getDelayTitle(),
                startDate: this.dossier.workflow.mdph.dates.depot,
                warningDays: 60,
                criticalDays: 75,
                onDelayChange: (days, status) => {
                    console.log(`Délai: ${days} jours, statut: ${status}`);
                }
            });
        }
    }
    
    getTimelineItems() {
        const items = [];
        
        // MDPH
        const mdphEtapes = ['nouveau', 'documents', 'formulaire', 'depot', 'recepisse', 'accord'];
        const mdphCurrent = mdphEtapes.indexOf(this.dossier.workflow.mdph.statut);
        
        mdphEtapes.forEach((etape, index) => {
            let status = 'pending';
            if (index < mdphCurrent) status = 'completed';
            if (index === mdphCurrent) status = this.hasDelay() ? 'blocked' : 'current';
            
            items.push({
                label: this.getEtapeLabel('mdph', etape),
                status: status,
                date: this.dossier.workflow.mdph.dates[etape] ? 
                    this.formatDate(this.dossier.workflow.mdph.dates[etape]) : 
                    (status === 'current' ? 'ICI' : '???'),
                icon: this.getEtapeIcon('mdph', etape, status)
            });
        });
        
        // Séparateur AGEFIPH si applicable
        if (this.dossier.type !== 'mdph_seul') {
            const agefiEtapes = ['documents', 'formulaire', 'finalisation', 'soumis', 'decision'];
            const agefiCurrent = agefiEtapes.indexOf(this.dossier.workflow.agefiph.statut);
            
            agefiEtapes.forEach((etape, index) => {
                let status = 'pending';
                if (this.dossier.workflow.agefiph.statut !== 'attente') {
                    if (index < agefiCurrent) status = 'completed';
                    if (index === agefiCurrent) status = 'current';
                }
                
                items.push({
                    label: this.getEtapeLabel('agefiph', etape),
                    status: status,
                    date: this.dossier.workflow.agefiph.dates[etape] ? 
                        this.formatDate(this.dossier.workflow.agefiph.dates[etape]) : 
                        '???',
                    icon: this.getEtapeIcon('agefiph', etape, status)
                });
            });
        }
        
        return items;
    }
    
    getOverviewItems() {
        const items = [
            {
                id: 'mdph',
                label: 'MDPH',
                value: this.dossier.workflow.mdph.progression,
                status: this.getStatutLabel(this.dossier.workflow.mdph.statut),
                color: this.hasDelay() ? 'red' : 'blue'
            }
        ];
        
        if (this.dossier.type !== 'mdph_seul') {
            items.push({
                id: 'agefiph',
                label: 'AGEFIPH',
                value: this.dossier.workflow.agefiph.progression,
                status: this.dossier.workflow.agefiph.bloque ? 'EN ATTENTE' : 
                        this.getStatutLabel(this.dossier.workflow.agefiph.statut),
                color: this.dossier.workflow.agefiph.bloque ? 'orange' : 'green'
            });
            
            items.push({
                id: 'global',
                label: 'GLOBAL',
                value: Math.round((this.dossier.workflow.mdph.progression + 
                                  this.dossier.workflow.agefiph.progression) / 2),
                status: this.hasDelay() ? 'RETARDÉ' : 
                        (this.dossier.workflow.agefiph.bloque ? 'BLOQUÉ' : 'EN COURS'),
                color: 'auto'
            });
        }
        
        return items;
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Boutons header
        document.getElementById('btn-edit')?.addEventListener('click', () => {
            this.toggleEditMode();
        });
        
        document.getElementById('btn-documents')?.addEventListener('click', () => {
            window.location.hash = `#subventions/documents/${this.dossierId}`;
        });
        
        document.getElementById('btn-more')?.addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('dropdown-menu').classList.toggle('show');
        });
        
        // Actions dropdown
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
                document.getElementById('dropdown-menu').classList.remove('show');
            });
        });
        
        // Fermer dropdown au clic extérieur
        document.addEventListener('click', () => {
            document.getElementById('dropdown-menu')?.classList.remove('show');
        });
        
        // Onglets
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Copier code
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.copy;
                this.copyToClipboard(text);
            });
        });
    }
    
    switchTab(tabName) {
        // Mettre à jour les onglets
        document.querySelectorAll('.tab-link').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });
        
        // Charger le contenu si nécessaire
        if (tabName === 'documents' && !this.components.documents) {
            this.loadDocuments();
        } else if (tabName === 'workflow' && !this.components.workflow) {
            this.loadWorkflow();
        }
    }
    
    async loadDocuments() {
        const container = document.querySelector('.documents-container');
        container.innerHTML = '<div class="loading">Chargement des documents...</div>';
        
        // TODO: Charger subventions.documents.js
        setTimeout(() => {
            container.innerHTML = '<p>Interface documents à venir...</p>';
        }, 500);
    }
    
    async loadWorkflow() {
        const container = document.querySelector('.workflow-container');
        container.innerHTML = '<div class="loading">Chargement du workflow...</div>';
        
        // TODO: Charger subventions.workflow.js
        setTimeout(() => {
            container.innerHTML = '<p>Interface workflow à venir...</p>';
        }, 500);
    }
    
    // ========================================
    // ACTIONS
    // ========================================
    
    async handleAction(action) {
        switch (action) {
            case 'print':
                window.print();
                break;
                
            case 'export':
                await this.exportDossier();
                break;
                
            case 'email':
                await this.sendEmail();
                break;
                
            case 'delete':
                await this.deleteDossier();
                break;
        }
    }
    
    async exportDossier() {
        // TODO: Implémenter l'export
        config.notify.info('Export du dossier à venir...');
    }
    
    async sendEmail() {
        // TODO: Implémenter l'envoi email
        config.notify.info('Envoi par email à venir...');
    }
    
    async deleteDossier() {
        const confirme = await config.Dialog.confirm(
            `Êtes-vous sûr de vouloir supprimer le dossier ${this.dossier.numeroDossier} ?`,
            'Supprimer le dossier'
        );
        if (confirme) {
            try {
                // TODO: await subventionsFirestore.deleteDossier(this.dossierId);
                
                config.notify.success('Dossier supprimé');
                window.location.hash = '#subventions/list';
                
            } catch (error) {
                config.notify.error('Erreur lors de la suppression');
            }
        }
    }
    
    toggleEditMode() {
        this.editMode = !this.editMode;
        document.getElementById('btn-edit').innerHTML = `
            <i class="icon-${this.editMode ? 'x' : 'edit'}"></i>
            ${this.editMode ? 'Annuler' : 'Modifier'}
        `;
        
        if (this.editMode) {
            this.enableEditMode();
        } else {
            this.disableEditMode();
        }
    }
    
    enableEditMode() {
        // TODO: Activer le mode édition
        config.notify.info('Mode édition activé');
    }
    
    disableEditMode() {
        // TODO: Désactiver le mode édition
    }
    
    // ========================================
    // TEMPS RÉEL
    // ========================================
    
    subscribeToChanges() {
        // TODO: Implémenter l'abonnement temps réel
        // this.unsubscribe = subventionsFirestore.subscribeToDossier(...)
    }
    
    updateComponents() {
        // Mettre à jour les composants avec les nouvelles données
        if (this.components.timeline) {
            this.components.timeline.setItems(this.getTimelineItems());
        }
        
        if (this.components.overview) {
            this.components.overview.setItems(this.getOverviewItems());
        }
        
        // Mettre à jour les montants
        this.updateFinancialInfo();
    }
    
    updateFinancialInfo() {
        // TODO: Mettre à jour les infos financières
    }
    
    // ========================================
    // RENDU SPÉCIFIQUE
    // ========================================
    
    renderHistory() {
        if (!this.dossier.historique || this.dossier.historique.length === 0) {
            return '<p class="empty-state">Aucun historique</p>';
        }
        
        return `
            <div class="history-timeline">
                ${this.dossier.historique.map(entry => `
                    <div class="history-entry">
                        <div class="history-marker"></div>
                        <div class="history-content">
                            <div class="history-header">
                                <span class="history-action">${entry.action}</span>
                                <span class="history-date">${this.formatDateTime(entry.date)}</span>
                            </div>
                            <div class="history-details">
                                ${entry.details}
                                <span class="history-user">par ${entry.utilisateur}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderFinances() {
        return `
            <div class="finances-grid">
                <div class="finance-card">
                    <h4>Coût total</h4>
                    <div class="amount-large">${this.formatMontant(this.dossier.montants.appareil)}</div>
                </div>
                
                <div class="finance-card">
                    <h4>Financements accordés</h4>
                    <div class="finance-breakdown">
                        <div class="finance-item">
                            <span>MDPH :</span>
                            <span>${this.formatMontant(this.dossier.montants.accordeMDPH)}</span>
                        </div>
                        <div class="finance-item">
                            <span>AGEFIPH :</span>
                            <span>${this.formatMontant(this.dossier.montants.accordeAGEFIPH)}</span>
                        </div>
                        <div class="finance-item">
                            <span>Mutuelle :</span>
                            <span>${this.formatMontant(this.dossier.montants.mutuelle || 0)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="finance-card highlight">
                    <h4>Reste à charge patient</h4>
                    <div class="amount-large text-primary">
                        ${this.formatMontant(this.dossier.montants.resteACharge)}
                    </div>
                </div>
            </div>
            
            <div class="finance-actions">
                <button class="btn btn-secondary">
                    <i class="icon-calculator"></i>
                    Recalculer
                </button>
                <button class="btn btn-primary">
                    <i class="icon-file-text"></i>
                    Générer devis
                </button>
            </div>
        `;
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    hasDelay() {
        // TODO: return subventionsService.hasRetard(this.dossier);
        // Pour l'instant, vérifier si dépôt > 60 jours
        if (this.dossier?.workflow?.mdph?.dates?.depot) {
            const dateDepot = new Date(this.dossier.workflow.mdph.dates.depot);
            const joursEcoules = Math.floor((new Date() - dateDepot) / (1000 * 60 * 60 * 24));
            return joursEcoules > 60;
        }
        return false;
    }
    
    getDelayTitle() {
        if (this.dossier.workflow.mdph.statut === 'depot') {
            return 'FOCUS : RÉCÉPISSÉ MDPH EN RETARD';
        }
        return 'RETARD SUR LE DOSSIER';
    }
    
    getInitials() {
        const nom = this.dossier.patient.nom || '';
        const prenom = this.dossier.patient.prenom || '';
        return (nom.charAt(0) + prenom.charAt(0)).toUpperCase();
    }
    
    getTypeLabel() {
        const labels = {
            'mdph_agefiph': 'MDPH + AGEFIPH',
            'mdph_pch': 'MDPH PCH',
            'mdph_seul': 'MDPH seul'
        };
        return labels[this.dossier.type] || this.dossier.type;
    }
    
    getTypeClass() {
        const classes = {
            'mdph_agefiph': 'primary',
            'mdph_pch': 'info',
            'mdph_seul': 'secondary'
        };
        return classes[this.dossier.type] || 'default';
    }
    
    getSituationLabel() {
        const situation = this.dossier.patient.situation;
        // Utiliser les données de subventions.data.js
        return situation || 'Non renseigné';
    }
    
    getStatutLabel(statut) {
        const labels = {
            'nouveau': 'NOUVEAU',
            'documents': 'DOCUMENTS',
            'formulaire': 'FORMULAIRE',
            'depot': 'DÉPOSÉ',
            'recepisse': 'RÉCÉPISSÉ',
            'accord': 'ACCORD',
            'attente': 'EN ATTENTE',
            'finalisation': 'FINALISATION',
            'soumis': 'SOUMIS',
            'decision': 'DÉCISION'
        };
        return labels[statut] || statut.toUpperCase();
    }
    
    getEtapeLabel(workflow, etape) {
        const labels = {
            mdph: {
                'nouveau': 'Création',
                'documents': 'Documents',
                'formulaire': 'Formulaire',
                'depot': 'Dépôt',
                'recepisse': 'Récépissé',
                'accord': 'Accord'
            },
            agefiph: {
                'documents': 'Docs AGEF',
                'formulaire': 'Form AGEF',
                'finalisation': 'Finalisation',
                'soumis': 'Soumis',
                'decision': 'Décision'
            }
        };
        return labels[workflow]?.[etape] || etape;
    }
    
    getEtapeIcon(workflow, etape, status) {
        if (status === 'completed') return '✅';
        if (status === 'current') return '🔄';
        if (status === 'blocked') return '🔴';
        
        const icons = {
            mdph: {
                'nouveau': '📝',
                'documents': '📄',
                'formulaire': '✍️',
                'depot': '📮',
                'recepisse': '📋',
                'accord': '✅'
            },
            agefiph: {
                'documents': '📄',
                'formulaire': '✍️',
                'finalisation': '📋',
                'soumis': '📮',
                'decision': '✅'
            }
        };
        
        return icons[workflow]?.[etape] || '⏳';
    }
    
    countDocuments() {
        let count = 0;
        
        Object.values(this.dossier.documents.mdph).forEach(doc => {
            if (doc.fichiers && doc.fichiers.length > 0) {
                count += doc.fichiers.length;
            }
        });
        
        Object.values(this.dossier.documents.agefiph).forEach(doc => {
            if (doc.fichiers && doc.fichiers.length > 0) {
                count += doc.fichiers.length;
            }
        });
        
        return count;
    }
    
    getNextActions() {
        const actions = [];
        
        // Analyser le workflow pour déterminer les actions
        if (this.dossier.workflow.mdph.statut === 'nouveau') {
            actions.push('Collecter les documents MDPH');
        }
        
        if (this.dossier.workflow.mdph.statut === 'documents') {
            actions.push('Faire remplir le formulaire MDPH');
        }
        
        if (this.dossier.workflow.mdph.statut === 'depot' && this.hasDelay()) {
            actions.push('Relancer la MDPH');
        }
        
        if (this.dossier.workflow.mdph.statut === 'recepisse' && 
            this.dossier.patient.situation === 'salarie') {
            actions.push('Demander attestation employeur');
        }
        
        if (actions.length === 0) {
            return '<p class="text-muted">Aucune action requise</p>';
        }
        
        return `
            <ul class="actions-list">
                ${actions.map(action => `
                    <li class="action-item">
                        <i class="icon-chevron-right"></i>
                        ${action}
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    }
    
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('fr-FR');
    }
    
    formatMontant(montant) {
        return montant.toLocaleString('fr-FR', { 
            style: 'currency', 
            currency: 'EUR' 
        });
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            config.notify.success('Code copié dans le presse-papier');
        });
    }
    
    showError(error) {
        const container = document.getElementById('subventions-detail-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="icon-alert-circle"></i>
                    <h2>Erreur</h2>
                    <p>${error.message || error}</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#subventions/list'">
                        Retour à la liste
                    </button>
                </div>
            `;
        }
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        // Désinscrire les changements
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        // Détruire les composants
        Object.values(this.components).forEach(component => {
            if (component && component.destroy) {
                component.destroy();
            }
        });
        
        this.components = {};
    }
}

// Export de l'instance
export const subventionsDetail = new SubventionsDetail();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsDetail;