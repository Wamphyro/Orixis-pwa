/* ========================================
   WORKFLOW-STATUS.WIDGET.JS - Widget de suivi workflow MDPH/AGEFIPH
   Chemin: /widgets/workflow-status/workflow-status.widget.js
   
   DESCRIPTION:
   Widget NEUTRE pour afficher le statut d'un workflow à double parcours.
   Ne connaît RIEN du métier, utilise des callbacks pour tout.
   
   COMPOSANTS:
   1. Timeline horizontale (2 workflows parallèles)
   2. Barres de progression (2 barres synchronisées)
   3. Tracker de délais (compte à rebours)
   
   UTILISATION:
   const workflow = new WorkflowStatusWidget({
       container: '#workflow-container',
       mode: 'full', // 'timeline' | 'progress' | 'delays' | 'full'
       onStepClick: (workflow, step) => { orchestrateur gère },
       onDelayAlert: (delay) => { orchestrateur gère }
   });
   ======================================== */

export class WorkflowStatusWidget {
    constructor(config = {}) {
        // 1. Charger CSS
        this.loadCSS();
        
        // 2. Configuration NEUTRE
        this.config = {
            container: config.container || null,
            mode: config.mode || 'full', // 'timeline', 'progress', 'delays', 'full'
            
            // Options d'affichage
            display: {
                showTimeline: config.display?.showTimeline !== false,
                showProgress: config.display?.showProgress !== false,
                showDelays: config.display?.showDelays !== false,
                animated: config.display?.animated !== false,
                compact: config.display?.compact || false,
                ...config.display
            },
            
            // Configuration timeline
            timeline: {
                workflow1Label: config.timeline?.workflow1Label || 'Workflow 1',
                workflow2Label: config.timeline?.workflow2Label || 'Workflow 2',
                showConnections: config.timeline?.showConnections !== false,
                showPercentages: config.timeline?.showPercentages !== false,
                ...config.timeline
            },
            
            // Configuration progress
            progress: {
                showLabels: config.progress?.showLabels !== false,
                showPercentages: config.progress?.showPercentages !== false,
                animateOnChange: config.progress?.animateOnChange !== false,
                colors: {
                    workflow1: config.progress?.colors?.workflow1 || '#667eea',
                    workflow2: config.progress?.colors?.workflow2 || '#48bb78',
                    ...config.progress?.colors
                },
                ...config.progress
            },
            
            // Configuration delays
            delays: {
                showDepartment: config.delays?.showDepartment !== false,
                showDaysRemaining: config.delays?.showDaysRemaining !== false,
                alertThresholds: config.delays?.alertThresholds || [
                    { days: 15, level: 'warning' },
                    { days: 0, level: 'danger' },
                    { days: -15, level: 'critical' }
                ],
                ...config.delays
            },
            
            // Messages personnalisables
            messages: {
                noData: 'Aucune donnée',
                stepBlocked: 'Étape bloquée',
                stepCompleted: 'Terminé',
                stepInProgress: 'En cours',
                stepPending: 'En attente',
                daysRemaining: 'jours restants',
                daysOverdue: 'jours de retard',
                ...config.messages
            },
            
            // CALLBACKS - L'orchestrateur gère TOUT
            onStepClick: config.onStepClick || null,
            onStepHover: config.onStepHover || null,
            onProgressClick: config.onProgressClick || null,
            onDelayAlert: config.onDelayAlert || null,
            onDelayClick: config.onDelayClick || null,
            onStatusChange: config.onStatusChange || null,
            
            ...config
        };
        
        // 3. État interne NEUTRE
        this.state = {
            workflow1: {
                steps: [],
                currentStep: 0,
                progress: 0,
                status: 'pending'
            },
            workflow2: {
                steps: [],
                currentStep: 0,
                progress: 0,
                status: 'pending',
                blocked: false
            },
            delays: {
                department: null,
                startDate: null,
                deadline: null,
                daysRemaining: null,
                alertLevel: null
            },
            loaded: false
        };
        
        // 4. Références DOM
        this.elements = {
            container: null,
            timeline: null,
            progress: null,
            delays: null
        };
        
        // 5. ID unique
        this.id = 'workflow-status-' + Date.now();
        
        // 6. Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    loadCSS() {
        const cssId = 'workflow-status-widget-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/workflow-status/workflow-status.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }
    
    init() {
        this.setupContainer();
        this.render();
        this.attachEvents();
    }
    
    setupContainer() {
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            throw new Error('WorkflowStatusWidget: Container non trouvé');
        }
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const html = `
            <div class="workflow-status-widget ${this.config.display.compact ? 'compact' : ''}" id="${this.id}">
                ${this.shouldShowTimeline() ? this.renderTimeline() : ''}
                ${this.shouldShowProgress() ? this.renderProgress() : ''}
                ${this.shouldShowDelays() ? this.renderDelays() : ''}
            </div>
        `;
        
        this.elements.container.innerHTML = html;
        this.updateElementReferences();
    }
    
    renderTimeline() {
        return `
            <div class="workflow-timeline-section">
                <div class="workflow-timeline workflow-1" data-workflow="1">
                    <div class="timeline-label">${this.config.timeline.workflow1Label}</div>
                    <div class="timeline-steps" id="${this.id}-timeline-1"></div>
                </div>
                ${this.config.timeline.showConnections ? '<div class="timeline-connection"></div>' : ''}
                <div class="workflow-timeline workflow-2" data-workflow="2">
                    <div class="timeline-label">${this.config.timeline.workflow2Label}</div>
                    <div class="timeline-steps" id="${this.id}-timeline-2"></div>
                </div>
            </div>
        `;
    }
    
    renderProgress() {
        return `
            <div class="workflow-progress-section">
                <div class="progress-bar-container" data-workflow="1">
                    ${this.config.progress.showLabels ? `<span class="progress-label">${this.config.timeline.workflow1Label}</span>` : ''}
                    <div class="progress-bar">
                        <div class="progress-fill workflow-1-fill" style="width: 0%">
                            ${this.config.progress.showPercentages ? '<span class="progress-text">0%</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="progress-bar-container" data-workflow="2">
                    ${this.config.progress.showLabels ? `<span class="progress-label">${this.config.timeline.workflow2Label}</span>` : ''}
                    <div class="progress-bar">
                        <div class="progress-fill workflow-2-fill" style="width: 0%">
                            ${this.config.progress.showPercentages ? '<span class="progress-text">0%</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderDelays() {
        return `
            <div class="workflow-delays-section">
                <div class="delay-tracker-empty">
                    ${this.config.messages.noData}
                </div>
            </div>
        `;
    }
    
    // ========================================
    // API PUBLIQUE (utilisée par l'orchestrateur)
    // ========================================
    
    /**
     * Définir les étapes du workflow 1
     * @param {Array} steps - [{id, label, status, icon}]
     */
    setWorkflow1Steps(steps) {
        this.state.workflow1.steps = steps;
        this.updateTimeline(1);
        
        if (this.config.onStatusChange) {
            this.config.onStatusChange('workflow1', this.state.workflow1);
        }
    }
    
    /**
     * Définir les étapes du workflow 2
     * @param {Array} steps - [{id, label, status, icon}]
     */
    setWorkflow2Steps(steps) {
        this.state.workflow2.steps = steps;
        this.updateTimeline(2);
        
        if (this.config.onStatusChange) {
            this.config.onStatusChange('workflow2', this.state.workflow2);
        }
    }
    
    /**
     * Mettre à jour la progression
     * @param {number} workflow - 1 ou 2
     * @param {number} percentage - 0-100
     */
    setProgress(workflow, percentage) {
        const key = `workflow${workflow}`;
        this.state[key].progress = percentage;
        this.updateProgressBar(workflow, percentage);
    }
    
    /**
     * Définir les informations de délai
     * @param {Object} delayInfo - {department, startDate, deadline, maxDays}
     */
    setDelayInfo(delayInfo) {
        // Calculer les jours restants
        const today = new Date();
        const deadline = new Date(delayInfo.deadline);
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        
        // Déterminer le niveau d'alerte
        let alertLevel = 'normal';
        for (const threshold of this.config.delays.alertThresholds) {
            if (daysRemaining <= threshold.days) {
                alertLevel = threshold.level;
            }
        }
        
        this.state.delays = {
            department: delayInfo.department,
            departmentName: delayInfo.departmentName,
            startDate: delayInfo.startDate,
            deadline: delayInfo.deadline,
            maxDays: delayInfo.maxDays,
            daysRemaining: daysRemaining,
            alertLevel: alertLevel
        };
        
        this.updateDelayTracker();
        
        // Callback si alerte
        if (alertLevel !== 'normal' && this.config.onDelayAlert) {
            this.config.onDelayAlert(this.state.delays);
        }
    }
    
    /**
     * Marquer workflow 2 comme bloqué
     * @param {boolean} blocked
     * @param {string} reason
     */
    setWorkflow2Blocked(blocked, reason = '') {
        this.state.workflow2.blocked = blocked;
        this.state.workflow2.blockReason = reason;
        this.updateTimeline(2);
    }
    
    /**
     * Rafraîchir tout l'affichage
     */
    refresh() {
        this.updateTimeline(1);
        this.updateTimeline(2);
        this.updateProgressBar(1, this.state.workflow1.progress);
        this.updateProgressBar(2, this.state.workflow2.progress);
        this.updateDelayTracker();
    }
    
    /**
     * Réinitialiser l'état
     */
    reset() {
        this.state = {
            workflow1: { steps: [], currentStep: 0, progress: 0, status: 'pending' },
            workflow2: { steps: [], currentStep: 0, progress: 0, status: 'pending', blocked: false },
            delays: { department: null, startDate: null, deadline: null, daysRemaining: null, alertLevel: null }
        };
        this.render();
    }
    
    // ========================================
    // MÉTHODES INTERNES DE MISE À JOUR
    // ========================================
    
    updateTimeline(workflowNum) {
        const container = document.getElementById(`${this.id}-timeline-${workflowNum}`);
        if (!container) return;
        
        const workflow = this.state[`workflow${workflowNum}`];
        let html = '';
        
        workflow.steps.forEach((step, index) => {
            const statusClass = this.getStepStatusClass(step.status);
            const isBlocked = workflowNum === 2 && this.state.workflow2.blocked && index > 0;
            
            html += `
                <div class="timeline-step ${statusClass} ${isBlocked ? 'blocked' : ''}" 
                     data-step-id="${step.id}"
                     data-step-index="${index}">
                    <div class="step-icon">${step.icon || '○'}</div>
                    <div class="step-label">${step.label}</div>
                    ${step.date ? `<div class="step-date">${step.date}</div>` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    updateProgressBar(workflowNum, percentage) {
        const fill = this.elements.container.querySelector(`.workflow-${workflowNum}-fill`);
        if (!fill) return;
        
        fill.style.width = `${percentage}%`;
        
        if (this.config.progress.showPercentages) {
            const text = fill.querySelector('.progress-text');
            if (text) text.textContent = `${percentage}%`;
        }
        
        // Animation
        if (this.config.progress.animateOnChange) {
            fill.style.transition = 'width 0.5s ease';
        }
    }
    
    updateDelayTracker() {
        const container = this.elements.container.querySelector('.workflow-delays-section');
        if (!container) return;
        
        const delays = this.state.delays;
        
        if (!delays.deadline) {
            container.innerHTML = `<div class="delay-tracker-empty">${this.config.messages.noData}</div>`;
            return;
        }
        
        const alertClass = `alert-${delays.alertLevel}`;
        const daysText = delays.daysRemaining >= 0 
            ? `${delays.daysRemaining} ${this.config.messages.daysRemaining}`
            : `${Math.abs(delays.daysRemaining)} ${this.config.messages.daysOverdue}`;
        
        container.innerHTML = `
            <div class="delay-tracker ${alertClass}">
                ${this.config.delays.showDepartment ? `
                    <div class="delay-department">
                        <span class="department-code">${delays.department}</span>
                        <span class="department-name">${delays.departmentName}</span>
                    </div>
                ` : ''}
                <div class="delay-counter">
                    <div class="delay-days">${daysText}</div>
                    <div class="delay-max">Délai max: ${delays.maxDays} jours</div>
                </div>
                <div class="delay-dates">
                    <span>Dépôt: ${new Date(delays.startDate).toLocaleDateString('fr-FR')}</span>
                    <span>Échéance: ${new Date(delays.deadline).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Click sur une étape de timeline
        this.elements.container.addEventListener('click', (e) => {
            const step = e.target.closest('.timeline-step');
            if (step && this.config.onStepClick) {
                const workflowEl = step.closest('[data-workflow]');
                const workflow = parseInt(workflowEl.dataset.workflow);
                const stepId = step.dataset.stepId;
                const stepIndex = parseInt(step.dataset.stepIndex);
                
                this.config.onStepClick(workflow, stepId, stepIndex, step);
            }
            
            // Click sur progress bar
            const progressBar = e.target.closest('.progress-bar-container');
            if (progressBar && this.config.onProgressClick) {
                const workflow = parseInt(progressBar.dataset.workflow);
                this.config.onProgressClick(workflow, this.state[`workflow${workflow}`]);
            }
            
            // Click sur delay tracker
            const delayTracker = e.target.closest('.delay-tracker');
            if (delayTracker && this.config.onDelayClick) {
                this.config.onDelayClick(this.state.delays);
            }
        });
        
        // Hover sur une étape
        if (this.config.onStepHover) {
            this.elements.container.addEventListener('mouseenter', (e) => {
                const step = e.target.closest('.timeline-step');
                if (step) {
                    const workflowEl = step.closest('[data-workflow]');
                    const workflow = parseInt(workflowEl.dataset.workflow);
                    const stepId = step.dataset.stepId;
                    
                    this.config.onStepHover(workflow, stepId, true);
                }
            }, true);
            
            this.elements.container.addEventListener('mouseleave', (e) => {
                const step = e.target.closest('.timeline-step');
                if (step) {
                    const workflowEl = step.closest('[data-workflow]');
                    const workflow = parseInt(workflowEl.dataset.workflow);
                    const stepId = step.dataset.stepId;
                    
                    this.config.onStepHover(workflow, stepId, false);
                }
            }, true);
        }
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    shouldShowTimeline() {
        return this.config.display.showTimeline && 
               (this.config.mode === 'full' || this.config.mode === 'timeline');
    }
    
    shouldShowProgress() {
        return this.config.display.showProgress && 
               (this.config.mode === 'full' || this.config.mode === 'progress');
    }
    
    shouldShowDelays() {
        return this.config.display.showDelays && 
               (this.config.mode === 'full' || this.config.mode === 'delays');
    }
    
    getStepStatusClass(status) {
        const statusClasses = {
            'completed': 'step-completed',
            'current': 'step-current',
            'pending': 'step-pending',
            'blocked': 'step-blocked',
            'error': 'step-error'
        };
        return statusClasses[status] || 'step-pending';
    }
    
    updateElementReferences() {
        const widget = document.getElementById(this.id);
        this.elements.timeline = widget.querySelector('.workflow-timeline-section');
        this.elements.progress = widget.querySelector('.workflow-progress-section');
        this.elements.delays = widget.querySelector('.workflow-delays-section');
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    destroy() {
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        this.state = null;
        this.elements = null;
        this.config = null;
        
        console.log('🗑️ WorkflowStatusWidget détruit:', this.id);
    }
}

export default WorkflowStatusWidget;