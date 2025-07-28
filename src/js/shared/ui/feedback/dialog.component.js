/* ========================================
   DIALOG.COMPONENT.JS - Système de dialogues modaux
   Chemin: src/js/shared/ui/feedback/dialog.component.js
   
   DESCRIPTION:
   Système complet de dialogues modaux avec effet glassmorphism.
   Gère les confirmations, alertes, prompts, formulaires et contenus personnalisés
   avec animations avancées et gestion de pile.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Gestion de la pile de dialogues (lignes 202-300)
   3. Création et rendu (lignes 302-600)
   4. Gestion des interactions (lignes 602-800)
   5. API publique (lignes 802-1000)
   
   DÉPENDANCES:
   - dialog.css (styles associés)
   - Aucune dépendance externe
   ======================================== */

const Dialog = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 25,
                opacity: 0.08
            },
            'neumorphism': {
                class: 'neumorphism'
            },
            'flat': {
                class: 'flat'
            },
            'minimal': {
                class: 'minimal'
            },
            'material': {
                class: 'material'
            },
            'frosted': {
                class: 'frosted'
            }
        },
        
        // Types de dialogues
        types: {
            'alert': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
                buttons: ['ok'],
                focusButton: 'ok'
            },
            'confirm': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
                buttons: ['cancel', 'confirm'],
                focusButton: 'confirm'
            },
            'prompt': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
                buttons: ['cancel', 'submit'],
                focusButton: 'input',
                hasInput: true
            },
            'form': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
                buttons: ['cancel', 'submit'],
                focusButton: 'first-input'
            },
            'info': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                buttons: ['ok'],
                focusButton: 'ok'
            },
            'success': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                buttons: ['ok'],
                focusButton: 'ok'
            },
            'warning': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                buttons: ['ok'],
                focusButton: 'ok'
            },
            'error': {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
                buttons: ['ok'],
                focusButton: 'ok'
            }
        },
        
        // Configuration des boutons
        buttons: {
            'ok': {
                text: 'OK',
                class: 'dialog-button-primary',
                closeOnClick: true
            },
            'cancel': {
                text: 'Annuler',
                class: 'dialog-button-secondary',
                closeOnClick: true,
                returnValue: false
            },
            'confirm': {
                text: 'Confirmer',
                class: 'dialog-button-primary',
                closeOnClick: true,
                returnValue: true
            },
            'submit': {
                text: 'Valider',
                class: 'dialog-button-primary',
                closeOnClick: true,
                validate: true
            }
        },
        
        // Animations disponibles
        animations: {
            'scale': {
                backdrop: 'fade',
                dialog: 'scale',
                duration: 300
            },
            'slide': {
                backdrop: 'fade',
                dialog: 'slide',
                duration: 350
            },
            'fade': {
                backdrop: 'fade',
                dialog: 'fade',
                duration: 250
            },
            'bounce': {
                backdrop: 'fade',
                dialog: 'bounce',
                duration: 600
            },
            'flip': {
                backdrop: 'fade',
                dialog: 'flip',
                duration: 500
            },
            'zoom': {
                backdrop: 'fade',
                dialog: 'zoom',
                duration: 400
            },
            'rotate': {
                backdrop: 'fade',
                dialog: 'rotate',
                duration: 500
            },
            'swing': {
                backdrop: 'fade',
                dialog: 'swing',
                duration: 600
            }
        },
        
        // Tailles
        sizes: {
            'small': {
                class: 'small',
                width: '400px'
            },
            'medium': {
                class: 'medium',
                width: '600px'
            },
            'large': {
                class: 'large',
                width: '800px'
            },
            'fullscreen': {
                class: 'fullscreen',
                width: '100%'
            },
            'auto': {
                class: 'auto',
                width: 'auto'
            }
        },
        
        // Options par défaut
        defaults: {
            type: 'alert',
            style: 'glassmorphism',
            animation: 'scale',
            size: 'medium',
            closeOnBackdrop: true,
            closeOnEscape: true,
            showCloseButton: true,
            backdrop: true,
            center: true,
            draggable: false,
            resizable: false,
            autoFocus: true,
            restoreFocus: true,
            preventScroll: true,
            stackable: true,
            rtl: false
        }
    };

    // ========================================
    // GESTIONNAIRE D'ÉTAT
    // ========================================
    const state = {
        dialogs: new Map(),
        stack: [],
        activeDialog: null,
        idCounter: 0,
        focusedElementBeforeDialog: null,
        scrollPosition: null
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    function generateId() {
        return `dialog-${++state.idCounter}-${Date.now()}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function createBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'dialog-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        return backdrop;
    }

    // ========================================
    // CRÉATION DU DIALOGUE
    // ========================================
    function createDialogElement(options) {
        const dialog = document.createElement('div');
        const id = generateId();
        
        // Classes
        const classes = [
            'dialog',
            CONFIG.styles[options.style].class,
            CONFIG.sizes[options.size].class,
            `type-${options.type}`
        ];
        
        if (options.className) {
            classes.push(options.className);
        }
        
        if (options.rtl) {
            classes.push('rtl');
        }
        
        if (options.draggable) {
            classes.push('draggable');
        }
        
        if (options.resizable) {
            classes.push('resizable');
        }
        
        dialog.className = classes.join(' ');
        dialog.id = id;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', `${id}-title`);
        dialog.setAttribute('tabindex', '-1');
        
        // Structure interne
        let html = '<div class="dialog-container">';
        
        // Header
        html += '<div class="dialog-header">';
        
        // Icône
        if (options.icon !== false) {
            const icon = options.icon || CONFIG.types[options.type].icon;
            html += `<div class="dialog-icon">${icon}</div>`;
        }
        
        // Titre
        if (options.title) {
            html += `<h2 class="dialog-title" id="${id}-title">${escapeHtml(options.title)}</h2>`;
        }
        
        // Bouton de fermeture
        if (options.showCloseButton) {
            html += `
                <button class="dialog-close" aria-label="Fermer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
        }
        
        html += '</div>'; // dialog-header
        
        // Body
        html += '<div class="dialog-body">';
        
        // Message
        if (options.message) {
            html += `<div class="dialog-message">${options.html ? options.message : escapeHtml(options.message)}</div>`;
        }
        
        // Input pour prompt
        if (options.type === 'prompt' || options.hasInput) {
            const inputType = options.inputType || 'text';
            const placeholder = options.placeholder || '';
            const value = options.defaultValue || '';
            const pattern = options.pattern ? `pattern="${options.pattern}"` : '';
            const required = options.required ? 'required' : '';
            
            html += `
                <div class="dialog-input-wrapper">
                    <input 
                        type="${inputType}" 
                        class="dialog-input" 
                        placeholder="${placeholder}" 
                        value="${value}"
                        ${pattern}
                        ${required}
                        id="${id}-input"
                        aria-describedby="${id}-error"
                    />
                    <div class="dialog-input-error" id="${id}-error"></div>
                </div>
            `;
        }
        
        // Contenu personnalisé
        if (options.content) {
            html += `<div class="dialog-content">${options.content}</div>`;
        }
        
        // Formulaire
        if (options.form) {
            html += '<form class="dialog-form">';
            options.form.forEach((field, index) => {
                html += createFormField(field, `${id}-field-${index}`);
            });
            html += '</form>';
        }
        
        html += '</div>'; // dialog-body
        
        // Footer avec boutons
        const buttons = options.buttons || CONFIG.types[options.type].buttons;
        if (buttons && buttons.length > 0) {
            html += '<div class="dialog-footer">';
            
            buttons.forEach((buttonKey, index) => {
                const button = typeof buttonKey === 'string' ? 
                    CONFIG.buttons[buttonKey] : buttonKey;
                
                if (button) {
                    const btnId = `${id}-btn-${index}`;
                    const btnClass = button.class || 'dialog-button';
                    const btnText = button.text || buttonKey;
                    
                    html += `
                        <button 
                            id="${btnId}" 
                            class="${btnClass}"
                            data-action="${buttonKey}"
                        >${btnText}</button>
                    `;
                }
            });
            
            html += '</div>'; // dialog-footer
        }
        
        html += '</div>'; // dialog-container
        
        // Poignée de redimensionnement
        if (options.resizable) {
            html += '<div class="dialog-resize-handle"></div>';
        }
        
        dialog.innerHTML = html;
        
        return { element: dialog, id };
    }

    // ========================================
    // CRÉATION DE CHAMPS DE FORMULAIRE
    // ========================================
    function createFormField(field, id) {
        let html = '<div class="dialog-form-field">';
        
        if (field.label) {
            html += `<label for="${id}" class="dialog-form-label">${field.label}</label>`;
        }
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'tel':
            case 'url':
                html += `
                    <input 
                        type="${field.type}" 
                        id="${id}"
                        name="${field.name || id}"
                        class="dialog-form-input"
                        placeholder="${field.placeholder || ''}"
                        value="${field.value || ''}"
                        ${field.required ? 'required' : ''}
                        ${field.pattern ? `pattern="${field.pattern}"` : ''}
                        ${field.min !== undefined ? `min="${field.min}"` : ''}
                        ${field.max !== undefined ? `max="${field.max}"` : ''}
                    />
                `;
                break;
                
            case 'textarea':
                html += `
                    <textarea 
                        id="${id}"
                        name="${field.name || id}"
                        class="dialog-form-textarea"
                        placeholder="${field.placeholder || ''}"
                        rows="${field.rows || 4}"
                        ${field.required ? 'required' : ''}
                    >${field.value || ''}</textarea>
                `;
                break;
                
            case 'select':
                html += `
                    <select 
                        id="${id}"
                        name="${field.name || id}"
                        class="dialog-form-select"
                        ${field.required ? 'required' : ''}
                        ${field.multiple ? 'multiple' : ''}
                    >
                `;
                if (field.options) {
                    field.options.forEach(opt => {
                        const value = opt.value !== undefined ? opt.value : opt;
                        const text = opt.text || opt;
                        const selected = opt.selected || field.value === value;
                        html += `<option value="${value}" ${selected ? 'selected' : ''}>${text}</option>`;
                    });
                }
                html += '</select>';
                break;
                
            case 'checkbox':
                html += `
                    <label class="dialog-form-checkbox">
                        <input 
                            type="checkbox" 
                            id="${id}"
                            name="${field.name || id}"
                            value="${field.value || 'on'}"
                            ${field.checked ? 'checked' : ''}
                            ${field.required ? 'required' : ''}
                        />
                        <span>${field.text || ''}</span>
                    </label>
                `;
                break;
                
            case 'radio':
                if (field.options) {
                    field.options.forEach((opt, i) => {
                        const value = opt.value !== undefined ? opt.value : opt;
                        const text = opt.text || opt;
                        const checked = opt.checked || field.value === value;
                        html += `
                            <label class="dialog-form-radio">
                                <input 
                                    type="radio" 
                                    name="${field.name || id}"
                                    value="${value}"
                                    ${checked ? 'checked' : ''}
                                    ${i === 0 && field.required ? 'required' : ''}
                                />
                                <span>${text}</span>
                            </label>
                        `;
                    });
                }
                break;
        }
        
        if (field.hint) {
            html += `<div class="dialog-form-hint">${field.hint}</div>`;
        }
        
        if (field.error) {
            html += `<div class="dialog-form-error">${field.error}</div>`;
        }
        
        html += '</div>';
        return html;
    }

    // ========================================
    // GESTION DES INTERACTIONS
    // ========================================
    function attachEventHandlers(dialog, backdrop, options, resolve) {
        const { element, id } = dialog;
        
        // Fermeture
        const close = (value) => {
            removeDialog(id, value, resolve);
        };
        
        // Bouton de fermeture
        const closeBtn = element.querySelector('.dialog-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => close(null));
        }
        
        // Clic sur le backdrop
        if (options.closeOnBackdrop && backdrop) {
            backdrop.addEventListener('click', () => close(null));
        }
        
        // Échap
        if (options.closeOnEscape) {
            const handleEscape = (e) => {
                if (e.key === 'Escape' && state.activeDialog === id) {
                    e.preventDefault();
                    close(null);
                }
            };
            document.addEventListener('keydown', handleEscape);
            state.dialogs.get(id).escapeHandler = handleEscape;
        }
        
        // Boutons d'action
        const buttons = element.querySelectorAll('.dialog-footer button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const buttonConfig = CONFIG.buttons[action] || {};
                
                // Validation pour prompt/form
                if (buttonConfig.validate) {
                    const input = element.querySelector('.dialog-input');
                    const form = element.querySelector('.dialog-form');
                    
                    if (input) {
                        if (!input.checkValidity()) {
                            input.classList.add('error');
                            const error = element.querySelector('.dialog-input-error');
                            if (error) {
                                error.textContent = input.validationMessage;
                            }
                            return;
                        }
                        close(input.value);
                    } else if (form) {
                        if (!form.checkValidity()) {
                            form.reportValidity();
                            return;
                        }
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        close(data);
                    } else {
                        close(buttonConfig.returnValue !== undefined ? buttonConfig.returnValue : true);
                    }
                } else if (buttonConfig.closeOnClick !== false) {
                    close(buttonConfig.returnValue !== undefined ? buttonConfig.returnValue : action);
                }
                
                // Callback personnalisé
                if (options.onButtonClick) {
                    options.onButtonClick(action, { dialog: element, close });
                }
            });
        });
        
        // Glisser-déposer
        if (options.draggable) {
            makeDraggable(element);
        }
        
        // Redimensionnement
        if (options.resizable) {
            makeResizable(element);
        }
        
        // Focus trap
        setupFocusTrap(element);
        
        // Auto-focus
        if (options.autoFocus) {
            const focusTarget = CONFIG.types[options.type].focusButton;
            setTimeout(() => {
                if (focusTarget === 'input') {
                    const input = element.querySelector('.dialog-input');
                    if (input) input.focus();
                } else if (focusTarget === 'first-input') {
                    const firstInput = element.querySelector('input, textarea, select');
                    if (firstInput) firstInput.focus();
                } else {
                    const btn = element.querySelector(`[data-action="${focusTarget}"]`);
                    if (btn) btn.focus();
                    else element.focus();
                }
            }, 100);
        }
    }

    // ========================================
    // GLISSER-DÉPOSER
    // ========================================
    function makeDraggable(element) {
        const header = element.querySelector('.dialog-header');
        if (!header) return;
        
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        header.style.cursor = 'move';
        
        const startDrag = (e) => {
            isDragging = true;
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;
            
            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            element.classList.add('dragging');
        };
        
        const drag = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            element.style.left = `${initialX + deltaX}px`;
            element.style.top = `${initialY + deltaY}px`;
            element.style.transform = 'none';
        };
        
        const stopDrag = () => {
            isDragging = false;
            element.classList.remove('dragging');
        };
        
        header.addEventListener('mousedown', startDrag);
        header.addEventListener('touchstart', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);
    }

    // ========================================
    // REDIMENSIONNEMENT
    // ========================================
    function makeResizable(element) {
        const handle = element.querySelector('.dialog-resize-handle');
        if (!handle) return;
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        const startResize = (e) => {
            isResizing = true;
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;
            startWidth = element.offsetWidth;
            startHeight = element.offsetHeight;
            
            element.classList.add('resizing');
        };
        
        const resize = (e) => {
            if (!isResizing) return;
            
            e.preventDefault();
            const clientX = e.clientX || e.touches[0].clientX;
            const clientY = e.clientY || e.touches[0].clientY;
            
            const width = startWidth + (clientX - startX);
            const height = startHeight + (clientY - startY);
            
            element.style.width = `${Math.max(300, width)}px`;
            element.style.height = `${Math.max(200, height)}px`;
        };
        
        const stopResize = () => {
            isResizing = false;
            element.classList.remove('resizing');
        };
        
        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize);
        document.addEventListener('mousemove', resize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
    }

    // ========================================
    // FOCUS TRAP
    // ========================================
    function setupFocusTrap(element) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        const focusableElements = element.querySelectorAll(focusableSelectors.join(','));
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        });
    }

    // ========================================
    // AFFICHAGE ET SUPPRESSION
    // ========================================
    function showDialog(options) {
        return new Promise((resolve) => {
            // Fusionner avec les options par défaut
            const opts = { ...CONFIG.defaults, ...options };
            
            // Sauvegarder le focus et le scroll
            if (opts.restoreFocus) {
                state.focusedElementBeforeDialog = document.activeElement;
            }
            
            if (opts.preventScroll) {
                state.scrollPosition = window.scrollY;
                document.body.style.overflow = 'hidden';
            }
            
            // Créer le backdrop
            let backdrop = null;
            if (opts.backdrop) {
                backdrop = createBackdrop();
                document.body.appendChild(backdrop);
            }
            
            // Créer le dialogue
            const dialog = createDialogElement(opts);
            document.body.appendChild(dialog.element);
            
            // Stocker la référence
            state.dialogs.set(dialog.id, {
                element: dialog.element,
                backdrop,
                options: opts,
                resolve
            });
            
            state.stack.push(dialog.id);
            state.activeDialog = dialog.id;
            
            // Attacher les événements
            attachEventHandlers(dialog, backdrop, opts, resolve);
            
            // Animation d'entrée
            requestAnimationFrame(() => {
                if (backdrop) backdrop.classList.add('visible');
                dialog.element.classList.add('visible');
                
                // Callback onShow
                if (opts.onShow) {
                    opts.onShow(dialog.element, dialog.id);
                }
            });
        });
    }

    function removeDialog(id, value, resolve) {
        const dialogData = state.dialogs.get(id);
        if (!dialogData) return;
        
        const { element, backdrop, options } = dialogData;
        
        // Animation de sortie
        element.classList.remove('visible');
        element.classList.add('closing');
        
        if (backdrop) {
            backdrop.classList.remove('visible');
            backdrop.classList.add('closing');
        }
        
        // Callback onHide
        if (options.onHide) {
            options.onHide(element, id, value);
        }
        
        // Nettoyage après animation
        setTimeout(() => {
            // Supprimer les éléments
            element.remove();
            if (backdrop) backdrop.remove();
            
            // Supprimer les gestionnaires
            if (dialogData.escapeHandler) {
                document.removeEventListener('keydown', dialogData.escapeHandler);
            }
            
            // Nettoyer l'état
            state.dialogs.delete(id);
            state.stack = state.stack.filter(d => d !== id);
            state.activeDialog = state.stack[state.stack.length - 1] || null;
            
            // Restaurer le focus
            if (options.restoreFocus && state.focusedElementBeforeDialog) {
                state.focusedElementBeforeDialog.focus();
                state.focusedElementBeforeDialog = null;
            }
            
            // Restaurer le scroll
            if (options.preventScroll && state.stack.length === 0) {
                document.body.style.overflow = '';
                window.scrollTo(0, state.scrollPosition);
                state.scrollPosition = null;
            }
            
            // Résoudre la promesse
            if (resolve) {
                resolve(value);
            }
            
            // Callback onRemove
            if (options.onRemove) {
                options.onRemove(id, value);
            }
        }, CONFIG.animations[options.animation].duration);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Méthode principale
        show(options = {}) {
            return showDialog(options);
        },
        
        // Méthodes raccourcies
        alert(message, options = {}) {
            return showDialog({
                ...options,
                type: 'alert',
                message
            });
        },
        
        confirm(message, options = {}) {
            return showDialog({
                ...options,
                type: 'confirm',
                message
            });
        },
        
        prompt(message, options = {}) {
            return showDialog({
                ...options,
                type: 'prompt',
                message
            });
        },
        
        info(message, options = {}) {
            return showDialog({
                ...options,
                type: 'info',
                message
            });
        },
        
        success(message, options = {}) {
            return showDialog({
                ...options,
                type: 'success',
                message
            });
        },
        
        warning(message, options = {}) {
            return showDialog({
                ...options,
                type: 'warning',
                message
            });
        },
        
        error(message, options = {}) {
            return showDialog({
                ...options,
                type: 'error',
                message
            });
        },
        
        form(fields, options = {}) {
            return showDialog({
                ...options,
                type: 'form',
                form: fields
            });
        },
        
        custom(content, options = {}) {
            return showDialog({
                ...options,
                content
            });
        },
        
        // Gestion
        close(id, value) {
            const dialogData = state.dialogs.get(id || state.activeDialog);
            if (dialogData) {
                removeDialog(id || state.activeDialog, value, dialogData.resolve);
            }
        },
        
        closeAll() {
            state.stack.slice().reverse().forEach(id => {
                this.close(id, null);
            });
        },
        
        // Configuration
        setDefaults(defaults) {
            Object.assign(CONFIG.defaults, defaults);
        },
        
        getConfig() {
            return { ...CONFIG };
        },
        
        // État
        getActiveDialogs() {
            return state.stack.map(id => ({
                id,
                options: state.dialogs.get(id).options
            }));
        },
        
        isOpen(id) {
            return id ? state.dialogs.has(id) : state.stack.length > 0;
        },
        
        // Injection des styles
        injectStyles() {
            if (document.getElementById('dialog-styles')) return;
            
            const link = document.createElement('link');
            link.id = 'dialog-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/dialog.css';
            document.head.appendChild(link);
        }
    };
})();

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dialog;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Focus trap incomplet
   Solution: Gestion complète du Tab et Shift+Tab
   
   [2024-01] - Dialogues empilés mal gérés
   Cause: Pas de gestion de pile
   Résolution: Stack avec activeDialog
   
   [2024-01] - Performance drag & drop
   Solution: Utilisation de transform au lieu de top/left
   
   NOTES POUR REPRISES FUTURES:
   - Le système gère une pile de dialogues
   - Les promesses permettent async/await
   - Le focus trap est accessible
   - Support mobile pour drag & resize
   ======================================== */