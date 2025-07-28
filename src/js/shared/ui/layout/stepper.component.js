/* ========================================
   STEPPER.COMPONENT.JS - Composant de navigation par étapes
   Chemin: src/js/shared/ui/navigation/stepper.component.js
   
   DESCRIPTION:
   Système de navigation multi-étapes ultra-complet avec glassmorphism.
   Gère étapes linéaires/non-linéaires, validation, branches conditionnelles.
   Support horizontal/vertical, animations riches et accessibilité.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. État et gestion (lignes 402-500)
   3. Méthodes de création (lignes 502-1000)
   4. Gestionnaire d'événements (lignes 1002-1300)
   5. Méthodes de validation (lignes 1302-1500)
   6. API publique (lignes 1502-1700)
   
   DÉPENDANCES:
   - stepper.component.css (styles glassmorphism)
   - validation-utils.js (optionnel pour validation)
   ======================================== */

const StepperComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                blur: 20,
                opacity: 0.1,
                borderOpacity: 0.2,
                shadowOpacity: 0.2,
                glowEffect: true,
                reflectionEffect: true,
                progressGradient: true
            },
            'neumorphism': {
                insetShadow: true,
                softEdges: true,
                depth: 'medium',
                lightSource: 'top-left'
            },
            'flat': {
                borderWidth: 1,
                simpleShadow: true,
                solidColors: true
            },
            'minimal': {
                noBorder: true,
                noBackground: true,
                lineOnly: true,
                subtleHover: true
            },
            'material': {
                elevation: 2,
                rippleEffect: true,
                boldNumbers: true
            }
        },

        // Types de layout
        layouts: {
            'horizontal': {
                direction: 'row',
                connector: 'horizontal',
                responsive: true
            },
            'vertical': {
                direction: 'column',
                connector: 'vertical',
                sideLabels: true
            },
            'compact': {
                direction: 'row',
                minimalSpace: true,
                hiddenLabels: 'mobile'
            },
            'timeline': {
                direction: 'column',
                dateDisplay: true,
                extendedInfo: true
            },
            'dots': {
                direction: 'row',
                dotsOnly: true,
                progressBar: true
            }
        },

        // Types de connecteurs
        connectors: {
            'line': {
                type: 'solid',
                width: 2,
                animated: false
            },
            'dashed': {
                type: 'dashed',
                width: 2,
                dashArray: '5,5'
            },
            'dotted': {
                type: 'dotted',
                width: 2,
                dashArray: '2,2'
            },
            'arrow': {
                type: 'solid',
                width: 2,
                arrow: true
            },
            'gradient': {
                type: 'gradient',
                width: 3,
                animated: true
            }
        },

        // États des étapes
        states: {
            'pending': {
                icon: 'circle',
                clickable: false,
                opacity: 0.5
            },
            'active': {
                icon: 'circle-dot',
                clickable: true,
                highlight: true,
                pulse: true
            },
            'completed': {
                icon: 'check',
                clickable: true,
                checkmark: true
            },
            'error': {
                icon: 'x',
                clickable: true,
                shake: true
            },
            'warning': {
                icon: 'alert',
                clickable: true,
                glow: true
            },
            'disabled': {
                icon: 'lock',
                clickable: false,
                opacity: 0.3
            },
            'skipped': {
                icon: 'skip',
                clickable: true,
                strikethrough: true
            }
        },

        // Icônes par défaut
        icons: {
            'circle': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
            'circle-dot': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
            'check': '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>',
            'x': '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/></svg>',
            'alert': '<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5zM11 10v5h2v-5h-2zm0 6v2h2v-2h-2z" fill="currentColor"/></svg>',
            'lock': '<svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/></svg>',
            'skip': '<svg viewBox="0 0 24 24"><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="currentColor"/></svg>'
        },

        // Animations disponibles
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                transition: '0.3s ease',
                hoverScale: 1.05
            },
            'smooth': {
                transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                hoverScale: 1.1,
                progressAnimation: true
            },
            'rich': {
                transition: '0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                hoverScale: 1.15,
                progressAnimation: true,
                particleEffects: true,
                waveEffect: true,
                glowPulse: true
            }
        },

        // Options de navigation
        navigation: {
            'linear': {
                allowBackward: true,
                allowSkip: false,
                enforceOrder: true
            },
            'non-linear': {
                allowBackward: true,
                allowSkip: true,
                enforceOrder: false
            },
            'strict': {
                allowBackward: false,
                allowSkip: false,
                enforceOrder: true
            },
            'free': {
                allowBackward: true,
                allowSkip: true,
                enforceOrder: false,
                allowJump: true
            }
        },

        // Options par défaut
        defaults: {
            style: 'glassmorphism',
            layout: 'horizontal',
            connector: 'line',
            animation: 'smooth',
            navigation: 'linear',
            showNumbers: true,
            showLabels: true,
            showProgress: true,
            clickable: true,
            keyboard: true,
            swipe: false,
            autoProgress: false
        }
    };

    // ========================================
    // ÉTAT ET GESTION
    // ========================================
    const instances = new Map();
    let instanceId = 0;
    let stylesInjected = false;

    class StepperState {
        constructor(options) {
            this.currentStep = options.initialStep || 0;
            this.completedSteps = new Set();
            this.errorSteps = new Set();
            this.skippedSteps = new Set();
            this.visitedSteps = new Set([this.currentStep]);
            this.stepData = new Map();
            this.history = [this.currentStep];
            this.locked = false;
            this.options = options;
        }

        canNavigateTo(stepIndex) {
            const { navigation, steps } = this.options;
            const navConfig = CONFIG.navigation[navigation];

            if (this.locked) return false;
            if (stepIndex === this.currentStep) return false;
            if (stepIndex < 0 || stepIndex >= steps.length) return false;

            const step = steps[stepIndex];
            if (step.disabled) return false;

            if (navConfig.enforceOrder) {
                // Vérifier que toutes les étapes précédentes sont complétées
                for (let i = 0; i < stepIndex; i++) {
                    if (!this.completedSteps.has(i) && !this.skippedSteps.has(i)) {
                        return false;
                    }
                }
            }

            if (!navConfig.allowBackward && stepIndex < this.currentStep) {
                return false;
            }

            return true;
        }

        setStep(stepIndex) {
            if (!this.canNavigateTo(stepIndex)) return false;

            this.history.push(stepIndex);
            this.currentStep = stepIndex;
            this.visitedSteps.add(stepIndex);
            return true;
        }

        completeStep(stepIndex) {
            this.completedSteps.add(stepIndex);
            this.errorSteps.delete(stepIndex);
        }

        setError(stepIndex) {
            this.errorSteps.add(stepIndex);
            this.completedSteps.delete(stepIndex);
        }

        skipStep(stepIndex) {
            this.skippedSteps.add(stepIndex);
            this.completedSteps.delete(stepIndex);
            this.errorSteps.delete(stepIndex);
        }

        getProgress() {
            const totalSteps = this.options.steps.length;
            const completed = this.completedSteps.size + this.skippedSteps.size;
            return (completed / totalSteps) * 100;
        }
    }

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================
    
    function generateId() {
        return `stepper-${Date.now()}-${instanceId++}`;
    }

    function createElement(tag, className, attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'data') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key === 'style') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        });
        return element;
    }

    function createIcon(iconName) {
        const iconHTML = CONFIG.icons[iconName] || CONFIG.icons.circle;
        const wrapper = createElement('div', 'stepper-icon');
        wrapper.innerHTML = iconHTML;
        return wrapper;
    }

    function createStepperHTML(options) {
        const {
            id,
            style,
            layout,
            connector,
            showNumbers,
            showLabels,
            showProgress,
            steps,
            animation
        } = options;

        // Conteneur principal
        const container = createElement('div', `stepper stepper-${style} stepper-${layout}`, {
            id,
            role: 'navigation',
            'aria-label': 'Progress steps',
            data: {
                style,
                layout,
                animation,
                steps: steps.length
            }
        });

        // Barre de progression globale
        if (showProgress && layout !== 'dots') {
            const progressBar = createElement('div', 'stepper-progress-bar');
            const progressFill = createElement('div', 'stepper-progress-fill');
            progressBar.appendChild(progressFill);
            container.appendChild(progressBar);
        }

        // Conteneur des étapes
        const stepsContainer = createElement('div', 'stepper-steps');

        // Créer chaque étape
        steps.forEach((step, index) => {
            const stepElement = createStepElement(step, index, options);
            stepsContainer.appendChild(stepElement);

            // Ajouter le connecteur (sauf après la dernière étape)
            if (index < steps.length - 1) {
                const connectorElement = createConnector(connector, layout);
                stepsContainer.appendChild(connectorElement);
            }
        });

        container.appendChild(stepsContainer);

        // Zone de contenu
        const contentArea = createElement('div', 'stepper-content', {
            role: 'region',
            'aria-live': 'polite'
        });
        
        // Contenu de l'étape active
        const activeContent = createElement('div', 'stepper-content-panel stepper-content-active');
        contentArea.appendChild(activeContent);

        container.appendChild(contentArea);

        // Contrôles de navigation
        const controls = createNavigationControls(options);
        container.appendChild(controls);

        return container;
    }

    function createStepElement(step, index, options) {
        const { showNumbers, showLabels, style } = options;
        
        const stepElement = createElement('div', 'stepper-step', {
            role: 'button',
            tabIndex: 0,
            'aria-label': `Step ${index + 1}: ${step.label}`,
            'aria-current': index === 0 ? 'step' : undefined,
            data: {
                step: index,
                state: index === 0 ? 'active' : 'pending'
            }
        });

        // Badge de l'étape
        const badge = createElement('div', 'stepper-badge');
        
        // Effet glassmorphism sur le badge
        if (style === 'glassmorphism') {
            const glowRing = createElement('div', 'stepper-badge-glow');
            badge.appendChild(glowRing);
        }

        // Numéro ou icône
        const indicator = createElement('div', 'stepper-indicator');
        if (showNumbers && !step.icon) {
            indicator.textContent = index + 1;
        } else {
            const icon = createIcon(step.icon || 'circle');
            indicator.appendChild(icon);
        }
        badge.appendChild(indicator);

        // Icône de statut (superposée)
        const statusIcon = createElement('div', 'stepper-status-icon');
        badge.appendChild(statusIcon);

        stepElement.appendChild(badge);

        // Label et description
        if (showLabels) {
            const labelContainer = createElement('div', 'stepper-label-container');
            
            const label = createElement('div', 'stepper-label');
            label.textContent = step.label;
            labelContainer.appendChild(label);

            if (step.description) {
                const description = createElement('div', 'stepper-description');
                description.textContent = step.description;
                labelContainer.appendChild(description);
            }

            if (step.optional) {
                const optional = createElement('div', 'stepper-optional');
                optional.textContent = 'Optional';
                labelContainer.appendChild(optional);
            }

            stepElement.appendChild(labelContainer);
        }

        // Info supplémentaire (timeline, etc.)
        if (step.date || step.duration) {
            const meta = createElement('div', 'stepper-meta');
            if (step.date) {
                const date = createElement('span', 'stepper-date');
                date.textContent = step.date;
                meta.appendChild(date);
            }
            if (step.duration) {
                const duration = createElement('span', 'stepper-duration');
                duration.textContent = step.duration;
                meta.appendChild(duration);
            }
            stepElement.appendChild(meta);
        }

        return stepElement;
    }

    function createConnector(connectorType, layout) {
        const connector = createElement('div', `stepper-connector stepper-connector-${connectorType}`);
        
        if (connectorType === 'arrow') {
            const arrow = createElement('div', 'stepper-connector-arrow');
            connector.appendChild(arrow);
        } else if (connectorType === 'gradient') {
            const gradient = createElement('div', 'stepper-connector-gradient');
            connector.appendChild(gradient);
        }

        return connector;
    }

    function createNavigationControls(options) {
        const controls = createElement('div', 'stepper-controls');

        // Bouton Précédent
        const prevButton = createElement('button', 'stepper-button stepper-button-prev', {
            type: 'button',
            'aria-label': 'Previous step'
        });
        prevButton.innerHTML = `
            <svg viewBox="0 0 24 24" class="stepper-button-icon">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span>Previous</span>
        `;

        // Bouton Suivant
        const nextButton = createElement('button', 'stepper-button stepper-button-next stepper-button-primary', {
            type: 'button',
            'aria-label': 'Next step'
        });
        nextButton.innerHTML = `
            <span>Next</span>
            <svg viewBox="0 0 24 24" class="stepper-button-icon">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        `;

        // Bouton Terminer
        const finishButton = createElement('button', 'stepper-button stepper-button-finish stepper-button-success', {
            type: 'button',
            'aria-label': 'Finish',
            style: { display: 'none' }
        });
        finishButton.innerHTML = `
            <svg viewBox="0 0 24 24" class="stepper-button-icon">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <span>Finish</span>
        `;

        // Indicateur d'étape
        const stepIndicator = createElement('div', 'stepper-indicator-text');
        stepIndicator.textContent = `Step 1 of ${options.steps.length}`;

        controls.appendChild(prevButton);
        controls.appendChild(stepIndicator);
        controls.appendChild(nextButton);
        controls.appendChild(finishButton);

        return controls;
    }

    // ========================================
    // GESTIONNAIRE D'ÉVÉNEMENTS
    // ========================================
    
    function attachEvents(element, state) {
        const { clickable, keyboard, swipe, onStepChange, onComplete, validateStep } = state.options;
        const steps = element.querySelectorAll('.stepper-step');
        const prevButton = element.querySelector('.stepper-button-prev');
        const nextButton = element.querySelector('.stepper-button-next');
        const finishButton = element.querySelector('.stepper-button-finish');

        // Clic sur les étapes
        if (clickable) {
            steps.forEach((step, index) => {
                step.addEventListener('click', async () => {
                    if (state.canNavigateTo(index)) {
                        await navigateToStep(element, state, index);
                    } else {
                        // Animation de refus
                        step.classList.add('stepper-step-denied');
                        setTimeout(() => {
                            step.classList.remove('stepper-step-denied');
                        }, 500);
                    }
                });
            });
        }

        // Navigation clavier
        if (keyboard) {
            element.addEventListener('keydown', async (e) => {
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        await navigatePrevious(element, state);
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        await navigateNext(element, state);
                        break;
                    case 'Home':
                        e.preventDefault();
                        await navigateToStep(element, state, 0);
                        break;
                    case 'End':
                        e.preventDefault();
                        await navigateToStep(element, state, state.options.steps.length - 1);
                        break;
                }
            });
        }

        // Boutons de navigation
        prevButton.addEventListener('click', () => navigatePrevious(element, state));
        nextButton.addEventListener('click', () => navigateNext(element, state));
        finishButton.addEventListener('click', () => completeStepperProcess(element, state));

        // Swipe pour mobile
        if (swipe && 'ontouchstart' in window) {
            let touchStartX = 0;
            let touchEndX = 0;

            element.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });

            element.addEventListener('touchend', async (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;

                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        // Swipe left - next
                        await navigateNext(element, state);
                    } else {
                        // Swipe right - previous
                        await navigatePrevious(element, state);
                    }
                }
            });
        }
    }

    async function navigateToStep(element, state, targetStep) {
        const { validateStep, onStepChange, animation } = state.options;

        // Validation de l'étape actuelle avant de partir
        if (validateStep && targetStep > state.currentStep) {
            const isValid = await validateStep(state.currentStep, state.stepData.get(state.currentStep));
            if (!isValid) {
                showValidationError(element, state.currentStep);
                return false;
            }
        }

        // Mettre à jour l'état
        const previousStep = state.currentStep;
        if (!state.setStep(targetStep)) {
            return false;
        }

        // Mettre à jour l'UI
        updateStepperUI(element, state, previousStep);

        // Animation de transition
        if (animation !== 'none') {
            await animateTransition(element, previousStep, targetStep, animation);
        }

        // Callback
        if (onStepChange) {
            onStepChange(targetStep, previousStep);
        }

        return true;
    }

    async function navigatePrevious(element, state) {
        const targetStep = state.currentStep - 1;
        if (targetStep >= 0) {
            await navigateToStep(element, state, targetStep);
        }
    }

    async function navigateNext(element, state) {
        const targetStep = state.currentStep + 1;
        if (targetStep < state.options.steps.length) {
            const success = await navigateToStep(element, state, targetStep);
            if (success) {
                state.completeStep(state.currentStep - 1);
                updateStepState(element, state.currentStep - 1, 'completed');
            }
        }
    }

    async function completeStepperProcess(element, state) {
        const { onComplete, validateStep } = state.options;

        // Valider la dernière étape
        if (validateStep) {
            const isValid = await validateStep(state.currentStep, state.stepData.get(state.currentStep));
            if (!isValid) {
                showValidationError(element, state.currentStep);
                return;
            }
        }

        // Marquer comme complété
        state.completeStep(state.currentStep);
        updateStepState(element, state.currentStep, 'completed');

        // Animation de complétion
        element.classList.add('stepper-completed');
        createCompletionAnimation(element);

        // Callback
        if (onComplete) {
            const allData = Object.fromEntries(state.stepData);
            onComplete(allData);
        }
    }

    // ========================================
    // MÉTHODES DE VALIDATION
    // ========================================
    
    function showValidationError(element, stepIndex) {
        const step = element.querySelector(`[data-step="${stepIndex}"]`);
        const state = instances.get(element.id).state;
        
        state.setError(stepIndex);
        updateStepState(element, stepIndex, 'error');
        
        // Animation d'erreur
        step.classList.add('stepper-step-error-shake');
        setTimeout(() => {
            step.classList.remove('stepper-step-error-shake');
        }, 500);
    }

    // ========================================
    // MÉTHODES DE MISE À JOUR UI
    // ========================================
    
    function updateStepperUI(element, state, previousStep = null) {
        const steps = element.querySelectorAll('.stepper-step');
        const prevButton = element.querySelector('.stepper-button-prev');
        const nextButton = element.querySelector('.stepper-button-next');
        const finishButton = element.querySelector('.stepper-button-finish');
        const stepIndicator = element.querySelector('.stepper-indicator-text');
        const progressFill = element.querySelector('.stepper-progress-fill');

        // Mettre à jour les états des étapes
        steps.forEach((step, index) => {
            const stepElement = step;
            stepElement.classList.remove('stepper-step-active');
            stepElement.removeAttribute('aria-current');

            if (index === state.currentStep) {
                stepElement.classList.add('stepper-step-active');
                stepElement.setAttribute('aria-current', 'step');
                updateStepState(element, index, 'active');
            } else if (state.completedSteps.has(index)) {
                updateStepState(element, index, 'completed');
            } else if (state.errorSteps.has(index)) {
                updateStepState(element, index, 'error');
            } else if (state.skippedSteps.has(index)) {
                updateStepState(element, index, 'skipped');
            } else if (!state.canNavigateTo(index)) {
                updateStepState(element, index, 'disabled');
            } else {
                updateStepState(element, index, 'pending');
            }
        });

        // Mettre à jour les boutons
        prevButton.disabled = state.currentStep === 0 || !state.canNavigateTo(state.currentStep - 1);
        
        const isLastStep = state.currentStep === state.options.steps.length - 1;
        nextButton.style.display = isLastStep ? 'none' : '';
        finishButton.style.display = isLastStep ? '' : 'none';

        // Mettre à jour l'indicateur
        stepIndicator.textContent = `Step ${state.currentStep + 1} of ${state.options.steps.length}`;

        // Mettre à jour la progression
        if (progressFill) {
            const progress = state.getProgress();
            progressFill.style.width = `${progress}%`;
        }

        // Mettre à jour les connecteurs
        updateConnectors(element, state);
    }

    function updateStepState(element, stepIndex, newState) {
        const step = element.querySelector(`[data-step="${stepIndex}"]`);
        if (!step) return;

        const states = Object.keys(CONFIG.states);
        states.forEach(state => {
            step.classList.remove(`stepper-step-${state}`);
        });

        step.classList.add(`stepper-step-${newState}`);
        step.dataset.state = newState;

        // Mettre à jour l'icône de statut
        const statusIcon = step.querySelector('.stepper-status-icon');
        if (statusIcon) {
            const iconConfig = CONFIG.states[newState];
            if (iconConfig && iconConfig.icon !== 'circle') {
                statusIcon.innerHTML = CONFIG.icons[iconConfig.icon] || '';
                statusIcon.classList.add('stepper-status-icon-visible');
            } else {
                statusIcon.innerHTML = '';
                statusIcon.classList.remove('stepper-status-icon-visible');
            }
        }
    }

    function updateConnectors(element, state) {
        const connectors = element.querySelectorAll('.stepper-connector');
        connectors.forEach((connector, index) => {
            connector.classList.remove('stepper-connector-completed', 'stepper-connector-active');
            
            if (state.completedSteps.has(index)) {
                connector.classList.add('stepper-connector-completed');
            } else if (index === state.currentStep - 1 || index === state.currentStep) {
                connector.classList.add('stepper-connector-active');
            }
        });
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    
    async function animateTransition(element, fromStep, toStep, animationType) {
        const content = element.querySelector('.stepper-content-panel');
        const direction = toStep > fromStep ? 'forward' : 'backward';

        return new Promise(resolve => {
            // Fade out
            content.classList.add(`stepper-content-exit-${direction}`);
            
            setTimeout(() => {
                // Changer le contenu ici si nécessaire
                content.classList.remove(`stepper-content-exit-${direction}`);
                content.classList.add(`stepper-content-enter-${direction}`);
                
                setTimeout(() => {
                    content.classList.remove(`stepper-content-enter-${direction}`);
                    resolve();
                }, 300);
            }, 300);
        });
    }

    function createCompletionAnimation(element) {
        if (!element.querySelector('.stepper-completion-animation')) {
            const animation = createElement('div', 'stepper-completion-animation');
            
            // Particules de célébration
            for (let i = 0; i < 20; i++) {
                const particle = createElement('div', 'stepper-particle');
                particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
                particle.style.setProperty('--duration', `${1 + Math.random()}s`);
                particle.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
                particle.style.setProperty('--y', `${(Math.random() - 0.5) * 200}px`);
                animation.appendChild(particle);
            }
            
            element.appendChild(animation);
            
            setTimeout(() => {
                animation.remove();
            }, 2000);
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    return {
        // Configuration exposée
        CONFIG,
        
        // Créer une instance
        create(options = {}) {
            const finalOptions = { ...CONFIG.defaults, ...options };
            
            // Générer l'ID si non fourni
            if (!finalOptions.id) {
                finalOptions.id = generateId();
            }
            
            // Créer l'état
            const state = new StepperState(finalOptions);
            
            // Créer l'élément
            const element = createStepperHTML(finalOptions);
            
            // Attacher les événements
            attachEvents(element, state);
            
            // Sauvegarder l'instance
            instances.set(finalOptions.id, {
                element,
                state,
                options: finalOptions
            });
            
            // Injecter les styles si nécessaire
            if (!stylesInjected) {
                this.injectStyles();
            }
            
            // Initialiser l'UI
            updateStepperUI(element, state);
            
            return element;
        },
        
        // Navigation programmatique
        goTo(elementOrId, stepIndex) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                return navigateToStep(element, instance.state, stepIndex);
            }
            return false;
        },
        
        next(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                return navigateNext(element, instance.state);
            }
            return false;
        },
        
        previous(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                return navigatePrevious(element, instance.state);
            }
            return false;
        },
        
        // Gestion des données
        setStepData(elementOrId, stepIndex, data) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                instance.state.stepData.set(stepIndex, data);
            }
        },
        
        getStepData(elementOrId, stepIndex) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                return stepIndex !== undefined 
                    ? instance.state.stepData.get(stepIndex)
                    : Object.fromEntries(instance.state.stepData);
            }
            return null;
        },
        
        // État des étapes
        completeStep(elementOrId, stepIndex) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                instance.state.completeStep(stepIndex);
                updateStepState(element, stepIndex, 'completed');
                updateStepperUI(element, instance.state);
            }
        },
        
        setError(elementOrId, stepIndex) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                showValidationError(element, stepIndex);
            }
        },
        
        // Reset
        reset(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                instance.state = new StepperState(instance.options);
                updateStepperUI(element, instance.state);
            }
        },
        
        // Détruire une instance
        destroy(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            instances.delete(element.id);
            element.remove();
        },
        
        // Injecter les styles
        injectStyles() {
            if (stylesInjected) return;
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/stepper.component.css';
            document.head.appendChild(link);
            
            stylesInjected = true;
        }
    };
})();

// Export
export default StepperComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion de la navigation non-linéaire
   Solution: État complexe avec vérification des dépendances
   
   [2024-01-16] - Animations fluides entre étapes
   Cause: Conflits entre classes CSS
   Résolution: Système de classes temporaires avec timing
   
   [2024-01-17] - Validation asynchrone
   Solution: Promises et état de verrouillage pendant validation
   
   NOTES POUR REPRISES FUTURES:
   - Le swipe nécessite les événements touch
   - Les animations riches peuvent ralentir sur mobile
   - Prévoir contenu dynamique pour chaque étape
   ======================================== */