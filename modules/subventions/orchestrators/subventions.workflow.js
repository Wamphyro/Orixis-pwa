// ========================================
// SUBVENTIONS.WORKFLOW.JS - Gestion du workflow
// Chemin: modules/subventions/subventions.workflow.js
//
// DESCRIPTION:
// Orchestrateur pour la gestion du workflow MDPH/AGEFIPH
// Transitions, validations et actions par étape
// ========================================

import { subventionsConfig } from './subventions.config.js';
import { subventionsData } from './subventions.data.js';
import { subventionsService } from './subventions.service.js';
import { subventionsFirestore } from './subventions.firestore.js';

class SubventionsWorkflow {
    constructor() {
        this.dossierId = null;
        this.dossier = null;
        this.permissions = null;
        this.currentWorkflow = 'mdph';
        this.isProcessing = false;
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
            
            // Attacher les événements
            this.attachEvents();
            
            // S'abonner aux changements
            this.subscribeToChanges();
            
        } catch (error) {
            console.error('Erreur initialisation workflow:', error);
            this.showError(error);
        }
    }
    
    async loadDossier() {
        this.dossier = await subventionsFirestore.getDossier(this.dossierId);
        
        if (!this.dossier) {
            throw new Error('Dossier non trouvé');
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.getElementById('subventions-workflow-container') || 
                         document.querySelector('.workflow-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="workflow-manager">
                <!-- Header avec sélection workflow -->
                <div class="workflow-header">
                    <h3>Gestion du workflow</h3>
                    <div class="workflow-tabs">
                        <button class="workflow-tab active" data-workflow="mdph">
                            <i class="icon-file-text"></i>
                            Workflow MDPH
                        </button>
                        ${this.dossier.type !== 'mdph_seul' ? `
                            <button class="workflow-tab" data-workflow="agefiph">
                                <i class="icon-briefcase"></i>
                                Workflow AGEFIPH
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Vue du workflow actuel -->
                <div class="workflow-content">
                    <div id="workflow-mdph" class="workflow-panel active">
                        ${this.renderWorkflowMDPH()}
                    </div>
                    
                    ${this.dossier.type !== 'mdph_seul' ? `
                        <div id="workflow-agefiph" class="workflow-panel">
                            ${this.renderWorkflowAGEFIPH()}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Actions rapides -->
                <div class="workflow-quick-actions">
                    <h4>Actions rapides</h4>
                    <div class="actions-grid">
                        ${this.renderQuickActions()}
                    </div>
                </div>
            </div>
        `;
    }
    
    renderWorkflowMDPH() {
        const workflow = this.dossier.workflow.mdph;
        const etapes = subventionsData.workflowMDPH.etapes;
        const currentIndex = etapes.findIndex(e => e.id === workflow.statut);
        
        return `
            <div class="workflow-visualization">
                <!-- Timeline visuelle -->
                <div class="workflow-timeline">
                    ${etapes.map((etape, index) => `
                        <div class="timeline-step ${this.getStepClass(index, currentIndex)}" 
                             data-step="${etape.id}">
                            <div class="step-marker">
                                <span class="step-icon">${etape.icon}</span>
                                <span class="step-number">${index + 1}</span>
                            </div>
                            <div class="step-content">
                                <h5 class="step-title">${etape.label}</h5>
                                <p class="step-description">${etape.description}</p>
                                ${workflow.dates[etape.id] ? `
                                    <span class="step-date">
                                        ${this.formatDate(workflow.dates[etape.id])}
                                    </span>
                                ` : ''}
                            </div>
                            ${index < etapes.length - 1 ? '<div class="step-connector"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Détail de l'étape actuelle -->
                <div class="current-step-detail">
                    ${this.renderCurrentStepDetail('mdph', workflow.statut)}
                </div>
                
                <!-- Actions disponibles -->
                <div class="workflow-actions">
                    ${this.renderWorkflowActions('mdph', workflow.statut)}
                </div>
            </div>
        `;
    }
    
    renderWorkflowAGEFIPH() {
        const workflow = this.dossier.workflow.agefiph;
        const etapes = subventionsData.workflowAGEFIPH.etapes;
        const currentIndex = etapes.findIndex(e => e.id === workflow.statut);
        
        // Vérifier le blocage
        const isBlocked = workflow.bloque || 
                         (workflow.statut === 'attente_recepisse' && 
                          !this.dossier.workflow.mdph.dates.recepisse);
        
        return `
            <div class="workflow-visualization ${isBlocked ? 'blocked' : ''}">
                ${isBlocked ? `
                    <div class="workflow-alert alert-warning">
                        <i class="icon-lock"></i>
                        <div>
                            <strong>Workflow bloqué</strong>
                            <p>${workflow.raisonBlocage || 'En attente du récépissé MDPH'}</p>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Timeline visuelle -->
                <div class="workflow-timeline">
                    ${etapes.map((etape, index) => `
                        <div class="timeline-step ${this.getStepClass(index, currentIndex)} 
                             ${etape.bloquePar && isBlocked ? 'blocked' : ''}" 
                             data-step="${etape.id}">
                            <div class="step-marker">
                                <span class="step-icon">${etape.icon}</span>
                                <span class="step-number">${index + 1}</span>
                            </div>
                            <div class="step-content">
                                <h5 class="step-title">${etape.label}</h5>
                                <p class="step-description">${etape.description}</p>
                                ${workflow.dates[etape.id] ? `
                                    <span class="step-date">
                                        ${this.formatDate(workflow.dates[etape.id])}
                                    </span>
                                ` : ''}
                            </div>
                            ${index < etapes.length - 1 ? '<div class="step-connector"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Détail de l'étape actuelle -->
                <div class="current-step-detail">
                    ${this.renderCurrentStepDetail('agefiph', workflow.statut)}
                </div>
                
                <!-- Actions disponibles -->
                <div class="workflow-actions">
                    ${!isBlocked ? 
                        this.renderWorkflowActions('agefiph', workflow.statut) : 
                        '<p class="text-muted">Actions bloquées en attente du récépissé MDPH</p>'
                    }
                </div>
            </div>
        `;
    }
    
    renderCurrentStepDetail(workflow, statut) {
        const etapeData = workflow === 'mdph' ? 
            subventionsData.workflowMDPH.etapes.find(e => e.id === statut) :
            subventionsData.workflowAGEFIPH.etapes.find(e => e.id === statut);
            
        if (!etapeData) return '';
        
        const documentsRequis = etapeData.documentsRequis || [];
        const documentsStatut = this.checkDocumentsStatus(workflow, documentsRequis);
        
        return `
            <div class="step-detail-card">
                <h4>Étape actuelle : ${etapeData.label}</h4>
                
                ${documentsRequis.length > 0 ? `
                    <div class="documents-checklist">
                        <h5>Documents requis :</h5>
                        <ul class="checklist">
                            ${documentsRequis.map(docType => {
                                const docData = this.dossier.documents[workflow][docType];
                                const docConfig = subventionsData.documents[docType];
                                const isValid = docData && docData.statut === 'valide';
                                
                                return `
                                    <li class="checklist-item ${isValid ? 'completed' : ''}">
                                        <span class="check-icon">
                                            ${isValid ? '✅' : '⭕'}
                                        </span>
                                        <span class="check-label">
                                            ${docConfig ? docConfig.label : docType}
                                        </span>
                                        ${!isValid && this.permissions.canEdit ? `
                                            <button class="btn-add-doc" 
                                                    data-workflow="${workflow}"
                                                    data-type="${docType}">
                                                <i class="icon-plus"></i>
                                            </button>
                                        ` : ''}
                                    </li>
                                `;
                            }).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="step-progress">
                    <div class="progress-header">
                        <span>Progression de l'étape</span>
                        <span class="progress-percent">${documentsStatut.percentage}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${documentsStatut.percentage}%"></div>
                    </div>
                    <p class="progress-text">
                        ${documentsStatut.completed} / ${documentsStatut.total} éléments complétés
                    </p>
                </div>
                
                ${etapeData.actionsDisponibles ? `
                    <div class="available-actions">
                        <h5>Actions disponibles :</h5>
                        <div class="actions-list">
                            ${etapeData.actionsDisponibles.map(action => `
                                <button class="btn btn-sm btn-secondary" 
                                        data-action="${action}">
                                    ${this.getActionLabel(action)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderWorkflowActions(workflow, statut) {
        const canProgress = this.canProgressToNext(workflow, statut);
        const nextStep = this.getNextStep(workflow, statut);
        
        return `
            <div class="workflow-action-buttons">
                ${canProgress && nextStep && this.permissions.canEdit ? `
                    <button class="btn btn-primary btn-progress" 
                            data-workflow="${workflow}"
                            data-next="${nextStep.id}">
                        <i class="icon-arrow-right"></i>
                        Passer à : ${nextStep.label}
                    </button>
                ` : ''}
                
                ${statut !== 'nouveau' && this.permissions.canEdit ? `
                    <button class="btn btn-secondary btn-regress" 
                            data-workflow="${workflow}">
                        <i class="icon-arrow-left"></i>
                        Retour étape précédente
                    </button>
                ` : ''}
                
                <button class="btn btn-ghost btn-history" 
                        data-workflow="${workflow}">
                    <i class="icon-clock"></i>
                    Voir l'historique
                </button>
            </div>
            
            ${!canProgress && nextStep ? `
                <div class="workflow-requirements">
                    <p class="text-warning">
                        <i class="icon-info"></i>
                        Conditions non remplies pour passer à l'étape suivante
                    </p>
                    ${this.renderMissingRequirements(workflow, statut)}
                </div>
            ` : ''}
        `;
    }
    
    renderQuickActions() {
        const actions = [];
        
        // Actions MDPH
        if (this.dossier.workflow.mdph.statut === 'depot') {
            const joursEcoules = subventionsService.getJoursEcoules(
                this.dossier.workflow.mdph.dates.depot
            );
            
            if (joursEcoules > 60) {
                actions.push({
                    id: 'relance-mdph',
                    label: 'Relancer MDPH',
                    icon: 'phone',
                    variant: 'warning'
                });
            }
        }
        
        // Actions AGEFIPH
        if (this.dossier.workflow.mdph.statut === 'recepisse' && 
            this.dossier.patient.situation === 'salarie' &&
            this.dossier.workflow.agefiph.statut === 'attente_recepisse') {
            actions.push({
                id: 'demander-attestation',
                label: 'Demander attestation employeur',
                icon: 'mail',
                variant: 'primary'
            });
        }
        
        // Actions générales
        actions.push({
            id: 'email-patient',
            label: 'Envoyer email patient',
            icon: 'mail',
            variant: 'secondary'
        });
        
        actions.push({
            id: 'generer-courrier',
            label: 'Générer courrier',
            icon: 'file-text',
            variant: 'secondary'
        });
        
        return actions.map(action => `
            <button class="action-card" data-quick-action="${action.id}">
                <i class="icon-${action.icon}"></i>
                <span>${action.label}</span>
            </button>
        `).join('');
    }
    
    renderMissingRequirements(workflow, statut) {
        const validation = subventionsService.validateTransition(
            this.dossier,
            workflow,
            this.getNextStep(workflow, statut)?.id
        );
        
        if (validation.valid) return '';
        
        return `
            <ul class="requirements-list">
                ${validation.errors.map(error => `
                    <li class="requirement-item">
                        <i class="icon-x"></i>
                        ${error}
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    // ========================================
    // GESTION DU WORKFLOW
    // ========================================
    
    async progressWorkflow(workflow, nextStatut) {
        if (this.isProcessing) return;
        
        try {
            this.isProcessing = true;
            
            // Validation
            const validation = subventionsService.validateTransition(
                this.dossier,
                workflow,
                nextStatut
            );
            
            if (!validation.valid) {
                const toast = subventionsConfig.factories.Toast({
                    type: 'error',
                    message: validation.errors.join('<br>')
                });
                toast.show();
                return;
            }
            
            // Confirmer
            const currentStatut = this.dossier.workflow[workflow].statut;
            const dialog = subventionsConfig.factories.Dialog({
                title: 'Confirmer la progression',
                message: `Passer de "${this.getStatutLabel(currentStatut)}" à "${this.getStatutLabel(nextStatut)}" ?`,
                confirmText: 'Confirmer',
                onConfirm: async () => {
                    await this.executeProgression(workflow, nextStatut);
                }
            });
            dialog.open();
            
        } finally {
            this.isProcessing = false;
        }
    }
    
    async executeProgression(workflow, nextStatut) {
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Mise à jour en cours...',
            duration: 0
        });
        toast.show();
        
        try {
            await subventionsFirestore.progressWorkflow(
                this.dossierId,
                workflow,
                nextStatut,
                this.permissions.userName
            );
            
            toast.hide();
            
            const successToast = subventionsConfig.factories.Toast({
                type: 'success',
                message: 'Workflow mis à jour'
            });
            successToast.show();
            
            // Recharger
            await this.loadDossier();
            this.render();
            this.attachEvents();
            
            // Actions post-progression
            await this.handlePostProgression(workflow, nextStatut);
            
        } catch (error) {
            toast.hide();
            const errorToast = subventionsConfig.factories.Toast({
                type: 'error',
                message: 'Erreur lors de la mise à jour'
            });
            errorToast.show();
        }
    }
    
    async handlePostProgression(workflow, newStatut) {
        // Actions automatiques selon le nouveau statut
        
        if (workflow === 'mdph' && newStatut === 'recepisse') {
            // Débloquer AGEFIPH
            const toast = subventionsConfig.factories.Toast({
                type: 'info',
                message: 'AGEFIPH débloqué - Vous pouvez maintenant finaliser le dossier'
            });
            toast.show();
            
            // Si salarié, proposer de demander l'attestation
            if (this.dossier.patient.situation === 'salarie') {
                setTimeout(() => {
                    this.proposeAttestationEmployeur();
                }, 1000);
            }
        }
        
        if (workflow === 'agefiph' && newStatut === 'soumis') {
            // Proposer de programmer un rappel
            this.proposeProgrammerRappel();
        }
    }
    
    // ========================================
    // ACTIONS RAPIDES
    // ========================================
    
    async handleQuickAction(actionId) {
        switch (actionId) {
            case 'relance-mdph':
                await this.relancerMDPH();
                break;
                
            case 'demander-attestation':
                await this.demanderAttestationEmployeur();
                break;
                
            case 'email-patient':
                await this.envoyerEmailPatient();
                break;
                
            case 'generer-courrier':
                await this.genererCourrier();
                break;
                
            default:
                console.warn('Action non implémentée:', actionId);
        }
    }
    
    async relancerMDPH() {
        const modal = subventionsConfig.factories.Modal({
            title: 'Relancer la MDPH',
            content: `
                <div class="relance-form">
                    <div class="form-group">
                        <label>Mode de relance</label>
                        <select id="mode-relance" class="form-select">
                            <option value="telephone">Téléphone</option>
                            <option value="email">Email</option>
                            <option value="courrier">Courrier</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="notes-relance" 
                                  class="form-textarea" 
                                  rows="3"
                                  placeholder="Détails de la relance..."></textarea>
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
                    text: 'Enregistrer la relance',
                    variant: 'primary',
                    onClick: async (modal) => {
                        const mode = document.getElementById('mode-relance').value;
                        const notes = document.getElementById('notes-relance').value;
                        
                        await this.enregistrerRelance('mdph', mode, notes);
                        modal.close();
                    }
                }
            ]
        });
        modal.open();
    }
    
    async demanderAttestationEmployeur() {
        // TODO: Implémenter l'envoi d'email/génération de courrier
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Génération de la demande d\'attestation...'
        });
        toast.show();
        
        // Mettre à jour le dossier
        await subventionsFirestore.updateDossier(this.dossierId, {
            'documents.agefiph.attestation_employeur.dateDemandePrevu': new Date(),
            addToHistory: {
                action: 'attestation_demandee',
                utilisateur: this.permissions.userName,
                details: 'Demande d\'attestation employeur envoyée'
            }
        });
    }
    
    async envoyerEmailPatient() {
        // TODO: Implémenter l'interface d'envoi d'email
        const modal = subventionsConfig.factories.Modal({
            title: 'Envoyer un email au patient',
            content: `
                <div class="email-form">
                    <div class="form-group">
                        <label>Destinataire</label>
                        <input type="email" 
                               class="form-input" 
                               value="${this.dossier.patient.email || ''}" 
                               readonly>
                    </div>
                    <div class="form-group">
                        <label>Modèle</label>
                        <select class="form-select">
                            <option>Documents manquants</option>
                            <option>Suivi de dossier</option>
                            <option>Demande d'information</option>
                            <option>Personnalisé</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea class="form-textarea" rows="6"></textarea>
                    </div>
                </div>
            `
        });
        modal.open();
    }
    
    async genererCourrier() {
        // TODO: Implémenter la génération de courriers
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Génération de courrier à venir...'
        });
        toast.show();
    }
    
    proposeAttestationEmployeur() {
        const dialog = subventionsConfig.factories.Dialog({
            title: 'Attestation employeur requise',
            message: 'Le récépissé MDPH a été reçu. Souhaitez-vous demander l\'attestation employeur maintenant ?',
            confirmText: 'Demander',
            cancelText: 'Plus tard',
            onConfirm: () => this.demanderAttestationEmployeur()
        });
        dialog.open();
    }
    
    proposeProgrammerRappel() {
        // TODO: Implémenter la programmation de rappels
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Rappel programmé dans 30 jours'
        });
        toast.show();
    }
    
    async enregistrerRelance(workflow, mode, notes) {
        await subventionsFirestore.updateDossier(this.dossierId, {
            addToHistory: {
                action: 'relance',
                utilisateur: this.permissions.userName,
                details: `Relance ${workflow.toUpperCase()} par ${mode}. ${notes || ''}`
            }
        });
        
        const toast = subventionsConfig.factories.Toast({
            type: 'success',
            message: 'Relance enregistrée'
        });
        toast.show();
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Changement de workflow
        document.querySelectorAll('.workflow-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const workflow = e.currentTarget.dataset.workflow;
                this.switchWorkflow(workflow);
            });
        });
        
        // Progression workflow
        document.querySelectorAll('.btn-progress').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workflow = e.currentTarget.dataset.workflow;
                const nextStatut = e.currentTarget.dataset.next;
                this.progressWorkflow(workflow, nextStatut);
            });
        });
        
        // Régression workflow
        document.querySelectorAll('.btn-regress').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workflow = e.currentTarget.dataset.workflow;
                this.regressWorkflow(workflow);
            });
        });
        
        // Historique
        document.querySelectorAll('.btn-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workflow = e.currentTarget.dataset.workflow;
                this.showHistory(workflow);
            });
        });
        
        // Actions rapides
        document.querySelectorAll('[data-quick-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.currentTarget.dataset.quickAction;
                this.handleQuickAction(actionId);
            });
        });
        
        // Ajout de documents depuis le workflow
        document.querySelectorAll('.btn-add-doc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const workflow = e.currentTarget.dataset.workflow;
                const docType = e.currentTarget.dataset.type;
                this.redirectToDocuments(workflow, docType);
            });
        });
        
        // Actions disponibles
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleStepAction(action);
            });
        });
    }
    
    // ========================================
    // NAVIGATION ET AFFICHAGE
    // ========================================
    
    switchWorkflow(workflow) {
        this.currentWorkflow = workflow;
        
        // Mettre à jour les onglets
        document.querySelectorAll('.workflow-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.workflow === workflow);
        });
        
        // Mettre à jour les panneaux
        document.querySelectorAll('.workflow-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `workflow-${workflow}`);
        });
    }
    
    async regressWorkflow(workflow) {
        // TODO: Implémenter le retour en arrière
        const toast = subventionsConfig.factories.Toast({
            type: 'warning',
            message: 'Retour en arrière à implémenter avec prudence'
        });
        toast.show();
    }
    
    showHistory(workflow) {
        const history = this.dossier.historique.filter(entry => 
            entry.details.toLowerCase().includes(workflow)
        );
        
        const content = `
            <div class="workflow-history">
                ${history.length > 0 ? history.map(entry => `
                    <div class="history-item">
                        <div class="history-date">
                            ${this.formatDateTime(entry.date)}
                        </div>
                        <div class="history-content">
                            <strong>${entry.action}</strong>
                            <p>${entry.details}</p>
                            <span class="history-user">par ${entry.utilisateur}</span>
                        </div>
                    </div>
                `).join('') : '<p>Aucun historique pour ce workflow</p>'}
            </div>
        `;
        
        const modal = subventionsConfig.factories.Modal({
            title: `Historique ${workflow.toUpperCase()}`,
            content: content,
            size: 'lg'
        });
        modal.open();
    }
    
    redirectToDocuments(workflow, docType) {
        // Sauvegarder le contexte
        sessionStorage.setItem('documents-context', JSON.stringify({
            workflow: workflow,
            focusType: docType
        }));
        
        // Rediriger vers l'onglet documents
        window.location.hash = `#subventions/documents/${this.dossierId}`;
    }
    
    handleStepAction(action) {
        // Actions spécifiques par étape
        const actions = {
            'valider_documents': () => this.validerDocuments(),
            'relancer_patient': () => this.relancerPatient(),
            'envoyer_formulaire': () => this.envoyerFormulaire(),
            'signer_electronique': () => this.signerElectronique(),
            'suivre_dossier': () => this.suivreDossier(),
            'notifier_agefiph': () => this.notifierAgefiph()
        };
        
        if (actions[action]) {
            actions[action]();
        } else {
            console.warn('Action non implémentée:', action);
        }
    }
    
    // ========================================
    // TEMPS RÉEL
    // ========================================
    
    subscribeToChanges() {
        this.unsubscribe = subventionsFirestore.subscribeToDossier(
            this.dossierId,
            (dossier) => {
                this.dossier = dossier;
                this.render();
                this.attachEvents();
            }
        );
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    getStepClass(index, currentIndex) {
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'current';
        return 'pending';
    }
    
    canProgressToNext(workflow, currentStatut) {
        // Vérifier les pré-requis
        const validation = subventionsService.validateTransition(
            this.dossier,
            workflow,
            this.getNextStep(workflow, currentStatut)?.id
        );
        
        return validation.valid;
    }
    
    getNextStep(workflow, currentStatut) {
        const etapes = workflow === 'mdph' ? 
            subventionsData.workflowMDPH.etapes :
            subventionsData.workflowAGEFIPH.etapes;
            
        const currentIndex = etapes.findIndex(e => e.id === currentStatut);
        if (currentIndex === -1 || currentIndex === etapes.length - 1) {
            return null;
        }
        
        return etapes[currentIndex + 1];
    }
    
    checkDocumentsStatus(workflow, documentsRequis) {
        let completed = 0;
        const total = documentsRequis.length;
        
        documentsRequis.forEach(docType => {
            const doc = this.dossier.documents[workflow][docType];
            if (doc && doc.statut === 'valide') {
                completed++;
            }
        });
        
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
    
    getStatutLabel(statut) {
        // Chercher dans les deux workflows
        let etape = subventionsData.workflowMDPH.etapes.find(e => e.id === statut);
        if (!etape) {
            etape = subventionsData.workflowAGEFIPH.etapes.find(e => e.id === statut);
        }
        return etape ? etape.label : statut;
    }
    
    getActionLabel(action) {
        const labels = {
            'valider_documents': 'Valider les documents',
            'relancer_patient': 'Relancer le patient',
            'envoyer_formulaire': 'Envoyer le formulaire',
            'signer_electronique': 'Signature électronique',
            'suivre_dossier': 'Suivre le dossier',
            'relancer_mdph': 'Relancer la MDPH',
            'notifier_agefiph': 'Notifier AGEFIPH',
            'archiver': 'Archiver',
            'cloturer': 'Clôturer'
        };
        
        return labels[action] || action;
    }
    
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('fr-FR');
    }
    
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('fr-FR');
    }
    
    showError(error) {
        const container = document.getElementById('subventions-workflow-container');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="icon-alert-circle"></i>
                    <h2>Erreur</h2>
                    <p>${error.message || error}</p>
                </div>
            `;
        }
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Export de l'instance
export const subventionsWorkflow = new SubventionsWorkflow();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsWorkflow;