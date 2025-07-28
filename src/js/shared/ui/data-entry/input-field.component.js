/* ========================================
   INPUT-FIELD.COMPONENT.JS - Système d'inputs ultra-complet
   Chemin: src/js/shared/ui/data-entry/input-field.component.js
   
   DESCRIPTION:
   Composant input avec TOUTES les options possibles : types (text, number, 
   email, password, tel, date, time, color, file, etc.), styles (glassmorphism,
   neumorphism, flat, material), validations, masques, autocomplétion, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-400)
   2. Classe InputField principale (lignes 402-1500)
   3. Validateurs intégrés (lignes 1502-1700)
   4. Gestionnaire de masques (lignes 1702-1900)
   5. Helpers et présets (lignes 1902-2100)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Compatible avec tous les navigateurs modernes
   ======================================== */

const InputField = (() => {
    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types d'input disponibles
        types: {
            'text': {
                element: 'input',
                attributes: { type: 'text' },
                features: ['placeholder', 'maxlength', 'pattern', 'autocomplete']
            },
            'password': {
                element: 'input',
                attributes: { type: 'password' },
                features: ['placeholder', 'maxlength', 'pattern', 'showToggle', 'strength']
            },
            'email': {
                element: 'input',
                attributes: { type: 'email' },
                features: ['placeholder', 'multiple', 'autocomplete', 'validation']
            },
            'number': {
                element: 'input',
                attributes: { type: 'number' },
                features: ['placeholder', 'min', 'max', 'step', 'arrows']
            },
            'tel': {
                element: 'input',
                attributes: { type: 'tel' },
                features: ['placeholder', 'pattern', 'mask', 'countryCode']
            },
            'url': {
                element: 'input',
                attributes: { type: 'url' },
                features: ['placeholder', 'pattern', 'validation']
            },
            'search': {
                element: 'input',
                attributes: { type: 'search' },
                features: ['placeholder', 'autocomplete', 'suggestions', 'clearButton']
            },
            'date': {
                element: 'input',
                attributes: { type: 'date' },
                features: ['min', 'max', 'calendar']
            },
            'time': {
                element: 'input',
                attributes: { type: 'time' },
                features: ['min', 'max', 'step', 'picker']
            },
            'datetime': {
                element: 'input',
                attributes: { type: 'datetime-local' },
                features: ['min', 'max', 'calendar', 'picker']
            },
            'month': {
                element: 'input',
                attributes: { type: 'month' },
                features: ['min', 'max']
            },
            'week': {
                element: 'input',
                attributes: { type: 'week' },
                features: ['min', 'max']
            },
            'color': {
                element: 'input',
                attributes: { type: 'color' },
                features: ['palette', 'eyedropper', 'preview']
            },
            'range': {
                element: 'input',
                attributes: { type: 'range' },
                features: ['min', 'max', 'step', 'ticks', 'tooltip']
            },
            'file': {
                element: 'input',
                attributes: { type: 'file' },
                features: ['multiple', 'accept', 'preview', 'dragDrop']
            },
            'textarea': {
                element: 'textarea',
                attributes: {},
                features: ['placeholder', 'maxlength', 'rows', 'autoResize', 'counter']
            },
            'select': {
                element: 'select',
                attributes: {},
                features: ['multiple', 'search', 'groups', 'icons']
            },
            'chips': {
                element: 'div',
                attributes: { contenteditable: 'true' },
                features: ['tags', 'autocomplete', 'validation', 'removable']
            },
            'otp': {
                element: 'div',
                attributes: {},
                features: ['length', 'numeric', 'autoNext', 'paste']
            },
            'pin': {
                element: 'div',
                attributes: {},
                features: ['length', 'hidden', 'numeric', 'biometric']
            },
            'currency': {
                element: 'input',
                attributes: { type: 'text' },
                features: ['symbol', 'format', 'conversion', 'calculator']
            },
            'percentage': {
                element: 'input',
                attributes: { type: 'number' },
                features: ['min', 'max', 'step', 'suffix']
            },
            'rating': {
                element: 'div',
                attributes: {},
                features: ['stars', 'hearts', 'custom', 'half']
            },
            'slider': {
                element: 'div',
                attributes: {},
                features: ['min', 'max', 'step', 'dual', 'marks']
            },
            'switch': {
                element: 'div',
                attributes: {},
                features: ['label', 'icons', 'color']
            },
            'richtext': {
                element: 'div',
                attributes: { contenteditable: 'true' },
                features: ['toolbar', 'formatting', 'media', 'mentions']
            },
            'code': {
                element: 'textarea',
                attributes: {},
                features: ['syntax', 'theme', 'lineNumbers', 'autoComplete']
            },
            'json': {
                element: 'textarea',
                attributes: {},
                features: ['validation', 'formatting', 'schema', 'preview']
            }
        },

        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    webkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'inherit',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                },
                label: {
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '16px',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease',
                    background: 'transparent'
                },
                focus: {
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.1)'
                },
                error: {
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)'
                },
                success: {
                    borderColor: 'rgba(34, 197, 94, 0.5)',
                    boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1)'
                }
            },
            'glassmorphism-dark': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(20px)',
                    webkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                },
                label: {
                    color: 'rgba(255, 255, 255, 0.6)'
                },
                focus: {
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                }
            },
            'neumorphism': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 20px',
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: '15px',
                    boxShadow: 'inset 6px 6px 12px #b8b9be, inset -6px -6px 12px #ffffff',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                },
                label: {
                    position: 'absolute',
                    left: '20px',
                    top: '-10px',
                    background: '#e0e5ec',
                    padding: '0 8px',
                    fontSize: '14px',
                    color: '#666'
                },
                focus: {
                    boxShadow: 'inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #ffffff'
                }
            },
            'flat': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 16px',
                    background: '#f3f4f6',
                    border: '2px solid transparent',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                },
                label: {
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151'
                },
                focus: {
                    borderColor: '#3b82f6',
                    background: '#ffffff'
                }
            },
            'material': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px',
                    paddingTop: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '2px solid #e0e0e0',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                },
                label: {
                    position: 'absolute',
                    left: '0',
                    top: '32px',
                    fontSize: '16px',
                    color: '#9e9e9e',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease'
                },
                focus: {
                    borderBottomColor: '#2196f3'
                }
            },
            'minimal': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '8px 0',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '16px',
                    outline: 'none'
                },
                label: {
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280'
                }
            },
            'rounded': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 20px',
                    background: '#f9fafb',
                    border: '2px solid #e5e7eb',
                    borderRadius: '50px',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                },
                focus: {
                    borderColor: '#3b82f6',
                    background: '#ffffff'
                }
            },
            'gradient': {
                wrapper: {
                    position: 'relative',
                    marginBottom: '20px'
                },
                input: {
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid transparent',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    position: 'relative'
                },
                focus: {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)'
                }
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                enabled: true,
                duration: 200,
                easing: 'ease',
                effects: ['focus', 'hover']
            },
            'smooth': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['focus', 'hover', 'label', 'validation']
            },
            'bouncy': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['focus', 'hover', 'label', 'validation', 'shake']
            },
            'rich': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['focus', 'hover', 'label', 'validation', 'ripple', 'glow', 'particles']
            }
        },

        // Fonctionnalités disponibles
        features: {
            'validation': {
                realtime: false,
                debounce: 300,
                showIcon: true,
                showMessage: true,
                validators: ['required', 'email', 'pattern', 'custom']
            },
            'mask': {
                phone: '(999) 999-9999',
                date: '99/99/9999',
                time: '99:99',
                creditCard: '9999 9999 9999 9999',
                custom: null
            },
            'autoComplete': {
                enabled: false,
                source: [],
                minChars: 2,
                delay: 300,
                limit: 10
            },
            'counter': {
                enabled: false,
                position: 'bottom-right',
                format: '{current}/{max}'
            },
            'prefix': {
                enabled: false,
                content: '',
                icon: null
            },
            'suffix': {
                enabled: false,
                content: '',
                icon: null
            },
            'floating': {
                enabled: true,
                animated: true
            },
            'clearable': {
                enabled: true,
                showOnHover: true
            },
            'copyable': {
                enabled: false,
                tooltip: 'Copier'
            },
            'voice': {
                enabled: false,
                language: 'fr-FR'
            },
            'tooltip': {
                enabled: false,
                content: '',
                position: 'top'
            },
            'contextMenu': {
                enabled: false,
                items: []
            }
        },

        // Icônes intégrées
        icons: {
            'eye': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
            'eyeOff': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
            'check': '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            'x': '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            'alert': '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
            'search': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
            'calendar': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
            'clock': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            'mic': '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
            'copy': '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
        },

        // Patterns de validation prédéfinis
        patterns: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\s\-\+\(\)]+$/,
            url: /^https?:\/\/.+\..+$/,
            alphanumeric: /^[a-zA-Z0-9]+$/,
            letters: /^[a-zA-Z]+$/,
            numbers: /^\d+$/,
            creditCard: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
            postalCode: /^\d{5}(-\d{4})?$/,
            strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        },

        // Messages d'erreur par défaut
        errorMessages: {
            required: 'Ce champ est requis',
            email: 'Email invalide',
            url: 'URL invalide',
            pattern: 'Format invalide',
            minLength: 'Trop court (min: {min})',
            maxLength: 'Trop long (max: {max})',
            min: 'Valeur trop petite (min: {min})',
            max: 'Valeur trop grande (max: {max})',
            phone: 'Numéro de téléphone invalide',
            creditCard: 'Numéro de carte invalide',
            passwordStrength: 'Mot de passe trop faible'
        },

        // Thèmes de syntaxe pour l'éditeur de code
        codeThemes: {
            'monokai': {
                background: '#272822',
                color: '#f8f8f2',
                keyword: '#f92672',
                string: '#e6db74',
                number: '#ae81ff',
                comment: '#75715e'
            },
            'github': {
                background: '#ffffff',
                color: '#24292e',
                keyword: '#d73a49',
                string: '#032f62',
                number: '#005cc5',
                comment: '#6a737d'
            }
        }
    };

    // ========================================
    // CLASSE INPUTFIELD PRINCIPALE
    // ========================================
    class InputField {
        constructor(options = {}) {
            this.options = this.mergeOptions({
                type: 'text',
                name: '',
                id: `input-${Date.now()}`,
                label: '',
                placeholder: '',
                value: '',
                style: 'glassmorphism',
                animation: 'smooth',
                size: 'md',
                required: false,
                disabled: false,
                readonly: false,
                autofocus: false,
                features: {},
                validation: {},
                callbacks: {
                    onChange: null,
                    onFocus: null,
                    onBlur: null,
                    onInput: null,
                    onValidate: null,
                    onClear: null,
                    onEnter: null
                },
                customClass: '',
                customStyles: {},
                icon: null,
                helpText: '',
                errorText: ''
            }, options);

            this.value = this.options.value;
            this.isValid = true;
            this.isDirty = false;
            this.isTouched = false;
            this.errors = [];

            this.init();
        }

        mergeOptions(defaults, options) {
            const merged = { ...defaults };
            
            for (const key in options) {
                if (options.hasOwnProperty(key)) {
                    if (typeof options[key] === 'object' && !Array.isArray(options[key]) && options[key] !== null) {
                        merged[key] = this.mergeOptions(defaults[key] || {}, options[key]);
                    } else {
                        merged[key] = options[key];
                    }
                }
            }
            
            return merged;
        }

        init() {
            this.injectStyles();
            this.createElement();
            this.attachEvents();
            this.initFeatures();
            
            if (this.options.autofocus) {
                setTimeout(() => this.focus(), 100);
            }
        }

        injectStyles() {
            if (document.getElementById('input-field-styles')) return;

            const styleContent = `
                /* Base input field styles */
                .input-field-wrapper {
                    position: relative;
                    margin-bottom: 20px;
                }

                .input-field {
                    transition: all 0.3s ease;
                }

                .input-field::-webkit-input-placeholder {
                    color: rgba(0, 0, 0, 0.4);
                }

                .input-field::-moz-placeholder {
                    color: rgba(0, 0, 0, 0.4);
                }

                .input-field:-ms-input-placeholder {
                    color: rgba(0, 0, 0, 0.4);
                }

                .input-field::placeholder {
                    color: rgba(0, 0, 0, 0.4);
                }

                /* Label flottant */
                .input-label-floating {
                    position: absolute;
                    pointer-events: none;
                    transition: all 0.3s ease;
                }

                .input-label-floating.active {
                    top: -10px;
                    left: 12px;
                    font-size: 12px;
                    padding: 0 4px;
                    background: inherit;
                }

                /* États */
                .input-field-wrapper.focused .input-field {
                    outline: none;
                }

                .input-field-wrapper.error .input-field {
                    animation: shake 0.5s ease;
                }

                .input-field-wrapper.success .input-field {
                    border-color: #22c55e;
                }

                .input-field-wrapper.disabled {
                    opacity: 0.6;
                    pointer-events: none;
                }

                /* Icons */
                .input-icon-left,
                .input-icon-right {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 100%;
                    pointer-events: none;
                    z-index: 1;
                }

                .input-icon-left {
                    left: 0;
                }

                .input-icon-right {
                    right: 0;
                }

                .input-icon-right.clickable {
                    pointer-events: auto;
                    cursor: pointer;
                }

                .input-with-icon-left {
                    padding-left: 40px !important;
                }

                .input-with-icon-right {
                    padding-right: 40px !important;
                }

                /* Messages */
                .input-help-text,
                .input-error-text {
                    font-size: 12px;
                    margin-top: 4px;
                    display: block;
                }

                .input-help-text {
                    color: #6b7280;
                }

                .input-error-text {
                    color: #ef4444;
                }

                /* Counter */
                .input-counter {
                    position: absolute;
                    bottom: -20px;
                    right: 0;
                    font-size: 12px;
                    color: #6b7280;
                }

                /* Clear button */
                .input-clear-button {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.2s ease;
                }

                .input-field-wrapper:hover .input-clear-button.show,
                .input-clear-button.show {
                    opacity: 1;
                }

                .input-clear-button:hover {
                    background: rgba(0, 0, 0, 0.2);
                }

                /* Autocomplete dropdown */
                .input-autocomplete-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-top: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .input-autocomplete-dropdown.show {
                    display: block;
                }

                .input-autocomplete-item {
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .input-autocomplete-item:hover,
                .input-autocomplete-item.selected {
                    background: #f3f4f6;
                }

                .input-autocomplete-item.highlighted {
                    background: #e0e7ff;
                }

                /* Progress bar for password strength */
                .input-password-strength {
                    height: 4px;
                    background: #e5e7eb;
                    border-radius: 2px;
                    margin-top: 8px;
                    overflow: hidden;
                }

                .input-password-strength-bar {
                    height: 100%;
                    transition: all 0.3s ease;
                    border-radius: 2px;
                }

                .input-password-strength-bar.weak {
                    width: 33%;
                    background: #ef4444;
                }

                .input-password-strength-bar.medium {
                    width: 66%;
                    background: #f59e0b;
                }

                .input-password-strength-bar.strong {
                    width: 100%;
                    background: #22c55e;
                }

                /* Animations */
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }

                @keyframes ripple {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(4);
                        opacity: 0;
                    }
                }

                /* Ripple effect */
                .input-ripple {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(59, 130, 246, 0.3);
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                }

                /* Floating particles */
                .input-particles {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                }

                .input-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(59, 130, 246, 0.6);
                    border-radius: 50%;
                    animation: float-particle 3s ease-in-out infinite;
                }

                @keyframes float-particle {
                    0% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-100px) translateX(50px);
                        opacity: 0;
                    }
                }

                /* Voice input indicator */
                .input-voice-indicator {
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #ef4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
                    }
                }

                /* OTP/PIN input styles */
                .input-otp-container {
                    display: flex;
                    gap: 10px;
                }

                .input-otp-digit {
                    width: 50px;
                    height: 50px;
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                }

                /* Rich text toolbar */
                .input-richtext-toolbar {
                    display: flex;
                    gap: 4px;
                    padding: 8px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                    border-radius: 8px 8px 0 0;
                }

                .input-richtext-button {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }

                .input-richtext-button:hover {
                    background: #e5e7eb;
                }

                .input-richtext-button.active {
                    background: #3b82f6;
                    color: white;
                }

                /* Chips input */
                .input-chips-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 8px;
                    min-height: 48px;
                }

                .input-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 12px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 16px;
                    font-size: 14px;
                }

                .input-chip-remove {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    margin-left: 4px;
                }

                .input-chip-remove:hover {
                    background: rgba(0, 0, 0, 0.2);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .input-field-wrapper {
                        margin-bottom: 16px;
                    }

                    .input-field {
                        font-size: 16px; /* Prevent zoom on iOS */
                    }
                }

                /* Accessibility */
                .input-field:focus-visible {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }

                /* High contrast mode */
                @media (prefers-contrast: high) {
                    .input-field {
                        border-width: 2px;
                    }
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .input-field,
                    .input-label-floating,
                    .input-clear-button {
                        transition: none !important;
                        animation: none !important;
                    }
                }
            `;

            const style = document.createElement('style');
            style.id = 'input-field-styles';
            style.textContent = styleContent;
            document.head.appendChild(style);
        }

        createElement() {
            // Créer le wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = `input-field-wrapper ${this.options.customClass}`;
            
            // Appliquer les styles du wrapper
            const wrapperStyle = CONFIG.styles[this.options.style]?.wrapper || {};
            Object.assign(this.wrapper.style, wrapperStyle, this.options.customStyles.wrapper);

            // Créer le label si nécessaire
            if (this.options.label) {
                this.createLabel();
            }

            // Créer l'input selon le type
            this.createInput();

            // Ajouter les icônes
            if (this.options.icon || this.options.features.prefix?.icon) {
                this.createIconLeft();
            }

            // Ajouter les fonctionnalités
            this.createFeatures();

            // Ajouter les messages
            if (this.options.helpText) {
                this.createHelpText();
            }

            this.createErrorText();
        }

        createLabel() {
            this.label = document.createElement('label');
            this.label.className = 'input-label';
            this.label.textContent = this.options.label;
            this.label.htmlFor = this.options.id;

            // Appliquer le style du label
            const labelStyle = CONFIG.styles[this.options.style]?.label || {};
            Object.assign(this.label.style, labelStyle, this.options.customStyles.label);

            // Label flottant pour certains styles
            if (['glassmorphism', 'material'].includes(this.options.style)) {
                this.label.classList.add('input-label-floating');
                if (this.options.value) {
                    this.label.classList.add('active');
                }
            } else {
                this.wrapper.appendChild(this.label);
            }
        }

        createInput() {
            const typeConfig = CONFIG.types[this.options.type] || CONFIG.types.text;
            
            // Créer l'élément approprié
            this.input = document.createElement(typeConfig.element);
            this.input.className = 'input-field';
            this.input.id = this.options.id;
            this.input.name = this.options.name || this.options.id;
            
            // Appliquer les attributs
            Object.assign(this.input, typeConfig.attributes);
            
            if (this.options.placeholder) {
                this.input.placeholder = this.options.placeholder;
            }
            
            if (this.options.value) {
                this.input.value = this.options.value;
            }
            
            if (this.options.required) {
                this.input.required = true;
            }
            
            if (this.options.disabled) {
                this.input.disabled = true;
                this.wrapper.classList.add('disabled');
            }
            
            if (this.options.readonly) {
                this.input.readOnly = true;
            }

            // Appliquer le style de l'input
            const inputStyle = CONFIG.styles[this.options.style]?.input || {};
            Object.assign(this.input.style, inputStyle, this.options.customStyles.input);

            // Cas spéciaux selon le type
            this.handleSpecialTypes();

            this.wrapper.appendChild(this.input);

            // Ajouter le label flottant après l'input si nécessaire
            if (this.label && this.label.classList.contains('input-label-floating')) {
                this.wrapper.appendChild(this.label);
            }
        }

        handleSpecialTypes() {
            switch (this.options.type) {
                case 'password':
                    if (this.options.features.showToggle !== false) {
                        this.createPasswordToggle();
                    }
                    if (this.options.features.strength !== false) {
                        this.createPasswordStrength();
                    }
                    break;
                    
                case 'search':
                    this.createSearchIcon();
                    if (this.options.features.clearButton !== false) {
                        this.options.features.clearable = { enabled: true };
                    }
                    break;
                    
                case 'date':
                case 'time':
                case 'datetime':
                    this.createDateTimeIcon();
                    break;
                    
                case 'file':
                    this.createFileInput();
                    break;
                    
                case 'textarea':
                    if (this.options.features.autoResize) {
                        this.enableAutoResize();
                    }
                    if (this.options.features.counter) {
                        this.options.features.counter = { enabled: true };
                    }
                    break;
                    
                case 'select':
                    this.createSelect();
                    break;
                    
                case 'chips':
                    this.createChipsInput();
                    break;
                    
                case 'otp':
                case 'pin':
                    this.createOTPInput();
                    break;
                    
                case 'rating':
                    this.createRatingInput();
                    break;
                    
                case 'range':
                case 'slider':
                    this.createSliderInput();
                    break;
                    
                case 'switch':
                    this.createSwitchInput();
                    break;
                    
                case 'richtext':
                    this.createRichTextEditor();
                    break;
                    
                case 'code':
                case 'json':
                    this.createCodeEditor();
                    break;
            }
        }

        createPasswordToggle() {
            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'input-icon-right clickable';
            toggleButton.innerHTML = CONFIG.icons.eyeOff;
            toggleButton.setAttribute('aria-label', 'Afficher/Masquer le mot de passe');
            
            toggleButton.addEventListener('click', () => {
                const isPassword = this.input.type === 'password';
                this.input.type = isPassword ? 'text' : 'password';
                toggleButton.innerHTML = isPassword ? CONFIG.icons.eye : CONFIG.icons.eyeOff;
            });
            
            this.wrapper.appendChild(toggleButton);
            this.input.classList.add('input-with-icon-right');
        }

        createPasswordStrength() {
            const strengthContainer = document.createElement('div');
            strengthContainer.className = 'input-password-strength';
            
            const strengthBar = document.createElement('div');
            strengthBar.className = 'input-password-strength-bar';
            
            strengthContainer.appendChild(strengthBar);
            this.wrapper.appendChild(strengthContainer);
            
            this.strengthBar = strengthBar;
        }

        createSearchIcon() {
            const icon = document.createElement('div');
            icon.className = 'input-icon-left';
            icon.innerHTML = CONFIG.icons.search;
            this.wrapper.appendChild(icon);
            this.input.classList.add('input-with-icon-left');
        }

        createDateTimeIcon() {
            const icon = document.createElement('div');
            icon.className = 'input-icon-right';
            icon.innerHTML = this.options.type === 'time' ? CONFIG.icons.clock : CONFIG.icons.calendar;
            this.wrapper.appendChild(icon);
            this.input.classList.add('input-with-icon-right');
        }

        createFileInput() {
            // Style personnalisé pour file input
            this.input.style.display = 'none';
            
            const fileButton = document.createElement('div');
            fileButton.className = 'input-file-button';
            fileButton.innerHTML = `
                <span>Choisir un fichier</span>
                <small>Aucun fichier sélectionné</small>
            `;
            
            Object.assign(fileButton.style, {
                ...CONFIG.styles[this.options.style]?.input,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            });
            
            fileButton.addEventListener('click', () => this.input.click());
            
            this.input.addEventListener('change', (e) => {
                const files = e.target.files;
                const small = fileButton.querySelector('small');
                if (files.length > 0) {
                    small.textContent = files.length > 1 
                        ? `${files.length} fichiers sélectionnés`
                        : files[0].name;
                } else {
                    small.textContent = 'Aucun fichier sélectionné';
                }
            });
            
            this.wrapper.appendChild(fileButton);
            
            // Drag & Drop si activé
            if (this.options.features.dragDrop) {
                this.enableDragDrop(fileButton);
            }
        }

        enableDragDrop(element) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                element.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                element.addEventListener(eventName, () => {
                    element.classList.add('drag-over');
                });
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                element.addEventListener(eventName, () => {
                    element.classList.remove('drag-over');
                });
            });
            
            element.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                this.input.files = files;
                this.input.dispatchEvent(new Event('change'));
            });
        }

        createChipsInput() {
            this.input.style.display = 'none';
            
            const container = document.createElement('div');
            container.className = 'input-chips-container';
            Object.assign(container.style, CONFIG.styles[this.options.style]?.input);
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = this.options.placeholder || 'Ajouter...';
            input.style.cssText = 'border: none; outline: none; background: transparent; flex: 1; min-width: 100px;';
            
            this.chips = [];
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const value = input.value.trim();
                    if (value) {
                        this.addChip(value);
                        input.value = '';
                    }
                } else if (e.key === 'Backspace' && !input.value && this.chips.length > 0) {
                    this.removeChip(this.chips.length - 1);
                }
            });
            
            container.appendChild(input);
            this.wrapper.appendChild(container);
            
            this.chipsContainer = container;
            this.chipsInput = input;
        }

        addChip(value) {
            if (this.chips.includes(value)) return;
            
            this.chips.push(value);
            
            const chip = document.createElement('div');
            chip.className = 'input-chip';
            chip.innerHTML = `
                <span>${value}</span>
                <span class="input-chip-remove">${CONFIG.icons.x}</span>
            `;
            
            chip.querySelector('.input-chip-remove').addEventListener('click', () => {
                const index = this.chips.indexOf(value);
                if (index > -1) {
                    this.removeChip(index);
                }
            });
            
            this.chipsContainer.insertBefore(chip, this.chipsInput);
            this.updateChipsValue();
        }

        removeChip(index) {
            this.chips.splice(index, 1);
            this.chipsContainer.children[index].remove();
            this.updateChipsValue();
        }

        updateChipsValue() {
            this.input.value = this.chips.join(',');
            this.value = this.chips;
            
            if (this.options.callbacks.onChange) {
                this.options.callbacks.onChange(this.value, this);
            }
        }

        createOTPInput() {
            this.input.style.display = 'none';
            
            const container = document.createElement('div');
            container.className = 'input-otp-container';
            
            const length = this.options.features.length || 6;
            this.otpInputs = [];
            
            for (let i = 0; i < length; i++) {
                const input = document.createElement('input');
                input.type = this.options.type === 'pin' ? 'password' : 'text';
                input.className = 'input-field input-otp-digit';
                input.maxLength = 1;
                input.pattern = this.options.features.numeric ? '[0-9]' : '[0-9A-Za-z]';
                
                Object.assign(input.style, CONFIG.styles[this.options.style]?.input);
                
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (value && i < length - 1) {
                        this.otpInputs[i + 1].focus();
                    }
                    this.updateOTPValue();
                });
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && i > 0) {
                        this.otpInputs[i - 1].focus();
                    }
                });
                
                if (this.options.features.paste) {
                    input.addEventListener('paste', (e) => {
                        e.preventDefault();
                        const paste = e.clipboardData.getData('text');
                        const chars = paste.split('').slice(0, length);
                        
                        chars.forEach((char, index) => {
                            if (this.otpInputs[index]) {
                                this.otpInputs[index].value = char;
                            }
                        });
                        
                        this.updateOTPValue();
                        
                        const nextEmpty = this.otpInputs.findIndex(inp => !inp.value);
                        if (nextEmpty !== -1) {
                            this.otpInputs[nextEmpty].focus();
                        } else {
                            this.otpInputs[length - 1].focus();
                        }
                    });
                }
                
                container.appendChild(input);
                this.otpInputs.push(input);
            }
            
            this.wrapper.appendChild(container);
        }

        updateOTPValue() {
            const value = this.otpInputs.map(input => input.value).join('');
            this.input.value = value;
            this.value = value;
            
            if (this.options.callbacks.onChange) {
                this.options.callbacks.onChange(this.value, this);
            }
            
            if (value.length === this.otpInputs.length && this.options.features.autoSubmit) {
                if (this.options.callbacks.onComplete) {
                    this.options.callbacks.onComplete(value, this);
                }
            }
        }

        createRatingInput() {
            this.input.style.display = 'none';
            
            const container = document.createElement('div');
            container.className = 'input-rating-container';
            container.style.cssText = 'display: flex; gap: 4px;';
            
            const max = this.options.features.max || 5;
            const icon = this.options.features.icon || '★';
            
            this.ratingStars = [];
            
            for (let i = 1; i <= max; i++) {
                const star = document.createElement('span');
                star.className = 'input-rating-star';
                star.innerHTML = icon;
                star.style.cssText = 'font-size: 24px; cursor: pointer; color: #e5e7eb; transition: all 0.2s ease;';
                
                star.addEventListener('click', () => {
                    this.setRating(i);
                });
                
                star.addEventListener('mouseenter', () => {
                    this.highlightRating(i);
                });
                
                container.appendChild(star);
                this.ratingStars.push(star);
            }
            
            container.addEventListener('mouseleave', () => {
                this.highlightRating(this.value || 0);
            });
            
            this.wrapper.appendChild(container);
            
            if (this.options.value) {
                this.setRating(this.options.value);
            }
        }

        setRating(value) {
            this.value = value;
            this.input.value = value;
            this.highlightRating(value);
            
            if (this.options.callbacks.onChange) {
                this.options.callbacks.onChange(this.value, this);
            }
        }

        highlightRating(value) {
            this.ratingStars.forEach((star, index) => {
                if (index < value) {
                    star.style.color = '#fbbf24';
                } else {
                    star.style.color = '#e5e7eb';
                }
            });
        }

        createSliderInput() {
            const container = document.createElement('div');
            container.className = 'input-slider-container';
            
            const min = this.options.features.min || 0;
            const max = this.options.features.max || 100;
            const step = this.options.features.step || 1;
            
            // Pour range natif
            if (this.options.type === 'range') {
                this.input.min = min;
                this.input.max = max;
                this.input.step = step;
                
                if (this.options.features.tooltip) {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'input-slider-tooltip';
                    tooltip.style.cssText = 'position: absolute; top: -30px; background: #333; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
                    
                    this.input.addEventListener('input', () => {
                        tooltip.textContent = this.input.value;
                        const percent = ((this.input.value - min) / (max - min)) * 100;
                        tooltip.style.left = `${percent}%`;
                    });
                    
                    container.style.position = 'relative';
                    container.appendChild(tooltip);
                }
            }
            
            // Pour slider custom
            if (this.options.type === 'slider') {
                // Implémentation d'un slider custom plus avancé
                // (Code simplifié pour la démonstration)
            }
        }

        createSwitchInput() {
            this.input.type = 'checkbox';
            this.input.style.display = 'none';
            
            const switchElement = document.createElement('label');
            switchElement.className = 'input-switch';
            switchElement.htmlFor = this.options.id;
            switchElement.style.cssText = `
                display: inline-flex;
                align-items: center;
                cursor: pointer;
                user-select: none;
            `;
            
            const track = document.createElement('div');
            track.style.cssText = `
                width: 48px;
                height: 24px;
                background: #e5e7eb;
                border-radius: 12px;
                position: relative;
                transition: all 0.3s ease;
            `;
            
            const thumb = document.createElement('div');
            thumb.style.cssText = `
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 2px;
                left: 2px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            `;
            
            track.appendChild(thumb);
            switchElement.appendChild(track);
            
            if (this.options.features.label) {
                const label = document.createElement('span');
                label.textContent = this.options.features.label;
                label.style.marginLeft = '8px';
                switchElement.appendChild(label);
            }
            
            this.input.addEventListener('change', () => {
                if (this.input.checked) {
                    track.style.background = '#3b82f6';
                    thumb.style.left = '26px';
                } else {
                    track.style.background = '#e5e7eb';
                    thumb.style.left = '2px';
                }
            });
            
            this.wrapper.appendChild(switchElement);
            
            if (this.options.value) {
                this.input.checked = true;
                this.input.dispatchEvent(new Event('change'));
            }
        }

        createRichTextEditor() {
            const toolbar = document.createElement('div');
            toolbar.className = 'input-richtext-toolbar';
            
            const buttons = [
                { command: 'bold', icon: 'B' },
                { command: 'italic', icon: 'I' },
                { command: 'underline', icon: 'U' },
                { command: 'insertOrderedList', icon: '1.' },
                { command: 'insertUnorderedList', icon: '•' },
                { command: 'createLink', icon: '🔗' }
            ];
            
            buttons.forEach(({ command, icon }) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'input-richtext-button';
                button.innerHTML = icon;
                button.addEventListener('click', () => {
                    if (command === 'createLink') {
                        const url = prompt('URL:');
                        if (url) document.execCommand(command, false, url);
                    } else {
                        document.execCommand(command, false, null);
                    }
                    this.input.focus();
                });
                toolbar.appendChild(button);
            });
            
            this.wrapper.insertBefore(toolbar, this.input);
            
            this.input.addEventListener('input', () => {
                this.value = this.input.innerHTML;
                if (this.options.callbacks.onChange) {
                    this.options.callbacks.onChange(this.value, this);
                }
            });
        }

        createCodeEditor() {
            // Ajout de fonctionnalités basiques pour l'éditeur de code
            this.input.style.fontFamily = 'monospace';
            this.input.style.tabSize = '2';
            this.input.spellcheck = false;
            
            if (this.options.features.lineNumbers) {
                const lineNumbers = document.createElement('div');
                lineNumbers.className = 'input-code-line-numbers';
                lineNumbers.style.cssText = `
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 40px;
                    padding: 12px 8px;
                    text-align: right;
                    color: #6b7280;
                    font-family: monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    user-select: none;
                `;
                
                const updateLineNumbers = () => {
                    const lines = this.input.value.split('\n').length;
                    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
                };
                
                this.input.addEventListener('input', updateLineNumbers);
                this.input.addEventListener('scroll', () => {
                    lineNumbers.scrollTop = this.input.scrollTop;
                });
                
                this.input.style.paddingLeft = '50px';
                this.wrapper.style.position = 'relative';
                this.wrapper.appendChild(lineNumbers);
                
                updateLineNumbers();
            }
            
            // Tab support
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.input.selectionStart;
                    const end = this.input.selectionEnd;
                    this.input.value = this.input.value.substring(0, start) + '  ' + this.input.value.substring(end);
                    this.input.selectionStart = this.input.selectionEnd = start + 2;
                }
            });
        }

        createIconLeft() {
            const icon = document.createElement('div');
            icon.className = 'input-icon-left';
            icon.innerHTML = this.options.icon || this.options.features.prefix?.icon || '';
            this.wrapper.appendChild(icon);
            this.input.classList.add('input-with-icon-left');
        }

        createFeatures() {
            // Clear button
            if (this.options.features.clearable?.enabled) {
                this.createClearButton();
            }
            
            // Counter
            if (this.options.features.counter?.enabled) {
                this.createCounter();
            }
            
            // Voice input
            if (this.options.features.voice?.enabled) {
                this.createVoiceInput();
            }
            
            // Copier
            if (this.options.features.copyable?.enabled) {
                this.createCopyButton();
            }
            
            // Autocomplétion
            if (this.options.features.autoComplete?.enabled) {
                this.createAutoComplete();
            }
        }

        createClearButton() {
            const clearButton = document.createElement('div');
            clearButton.className = 'input-clear-button';
            clearButton.innerHTML = CONFIG.icons.x;
            
            clearButton.addEventListener('click', () => {
                this.clear();
            });
            
            this.wrapper.appendChild(clearButton);
            this.clearButton = clearButton;
            
            // Afficher/masquer selon la valeur
            this.updateClearButton();
        }

        updateClearButton() {
            if (this.clearButton) {
                if (this.input.value && !this.options.disabled && !this.options.readonly) {
                    this.clearButton.classList.add('show');
                } else {
                    this.clearButton.classList.remove('show');
                }
            }
        }

        createCounter() {
            const counter = document.createElement('div');
            counter.className = 'input-counter';
            this.wrapper.appendChild(counter);
            this.counter = counter;
            this.updateCounter();
        }

        updateCounter() {
            if (this.counter && this.input.maxLength > 0) {
                const current = this.input.value.length;
                const max = this.input.maxLength;
                const format = this.options.features.counter.format || '{current}/{max}';
                this.counter.textContent = format
                    .replace('{current}', current)
                    .replace('{max}', max);
            }
        }

        createVoiceInput() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                return;
            }
            
            const voiceButton = document.createElement('button');
            voiceButton.type = 'button';
            voiceButton.className = 'input-icon-right clickable';
            voiceButton.innerHTML = CONFIG.icons.mic;
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = this.options.features.voice.language || 'fr-FR';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            let isListening = false;
            
            voiceButton.addEventListener('click', () => {
                if (isListening) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
            
            recognition.onstart = () => {
                isListening = true;
                voiceButton.classList.add('listening');
                voiceButton.innerHTML = '<div class="input-voice-indicator">' + CONFIG.icons.mic + '</div>';
            };
            
            recognition.onend = () => {
                isListening = false;
                voiceButton.classList.remove('listening');
                voiceButton.innerHTML = CONFIG.icons.mic;
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.value = transcript;
                this.input.dispatchEvent(new Event('input'));
            };
            
            this.wrapper.appendChild(voiceButton);
            this.input.classList.add('input-with-icon-right');
        }

        createCopyButton() {
            const copyButton = document.createElement('button');
            copyButton.type = 'button';
            copyButton.className = 'input-icon-right clickable';
            copyButton.innerHTML = CONFIG.icons.copy;
            copyButton.title = this.options.features.copyable.tooltip || 'Copier';
            
            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(this.input.value);
                    
                    // Feedback visuel
                    copyButton.innerHTML = CONFIG.icons.check;
                    setTimeout(() => {
                        copyButton.innerHTML = CONFIG.icons.copy;
                    }, 2000);
                } catch (err) {
                    console.error('Erreur lors de la copie:', err);
                }
            });
            
            this.wrapper.appendChild(copyButton);
            this.input.classList.add('input-with-icon-right');
        }

        createAutoComplete() {
            const dropdown = document.createElement('div');
            dropdown.className = 'input-autocomplete-dropdown';
            this.wrapper.appendChild(dropdown);
            this.autocompleteDropdown = dropdown;
            
            let selectedIndex = -1;
            
            this.input.addEventListener('input', debounce(() => {
                this.updateAutoComplete();
            }, this.options.features.autoComplete.delay || 300));
            
            this.input.addEventListener('keydown', (e) => {
                const items = dropdown.querySelectorAll('.input-autocomplete-item');
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                    this.highlightAutoCompleteItem(selectedIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    this.highlightAutoCompleteItem(selectedIndex);
                } else if (e.key === 'Enter' && selectedIndex >= 0) {
                    e.preventDefault();
                    items[selectedIndex].click();
                } else if (e.key === 'Escape') {
                    this.hideAutoComplete();
                }
            });
            
            // Fermer au clic externe
            document.addEventListener('click', (e) => {
                if (!this.wrapper.contains(e.target)) {
                    this.hideAutoComplete();
                }
            });
        }

        async updateAutoComplete() {
            const value = this.input.value;
            const minChars = this.options.features.autoComplete.minChars || 2;
            
            if (value.length < minChars) {
                this.hideAutoComplete();
                return;
            }
            
            let suggestions = [];
            const source = this.options.features.autoComplete.source;
            
            if (typeof source === 'function') {
                suggestions = await source(value);
            } else if (Array.isArray(source)) {
                suggestions = source.filter(item => 
                    item.toLowerCase().includes(value.toLowerCase())
                );
            }
            
            const limit = this.options.features.autoComplete.limit || 10;
            suggestions = suggestions.slice(0, limit);
            
            if (suggestions.length > 0) {
                this.showAutoComplete(suggestions);
            } else {
                this.hideAutoComplete();
            }
        }

        showAutoComplete(suggestions) {
            this.autocompleteDropdown.innerHTML = '';
            
            suggestions.forEach((suggestion, index) => {
                const item = document.createElement('div');
                item.className = 'input-autocomplete-item';
                item.textContent = suggestion;
                
                item.addEventListener('click', () => {
                    this.input.value = suggestion;
                    this.value = suggestion;
                    this.hideAutoComplete();
                    this.input.dispatchEvent(new Event('input'));
                });
                
                item.addEventListener('mouseenter', () => {
                    this.highlightAutoCompleteItem(index);
                });
                
                this.autocompleteDropdown.appendChild(item);
            });
            
            this.autocompleteDropdown.classList.add('show');
        }

        hideAutoComplete() {
            this.autocompleteDropdown.classList.remove('show');
        }

        highlightAutoCompleteItem(index) {
            const items = this.autocompleteDropdown.querySelectorAll('.input-autocomplete-item');
            items.forEach((item, i) => {
                if (i === index) {
                    item.classList.add('highlighted');
                } else {
                    item.classList.remove('highlighted');
                }
            });
        }

        createHelpText() {
            const helpText = document.createElement('small');
            helpText.className = 'input-help-text';
            helpText.textContent = this.options.helpText;
            this.wrapper.appendChild(helpText);
        }

        createErrorText() {
            const errorText = document.createElement('small');
            errorText.className = 'input-error-text';
            errorText.style.display = 'none';
            this.wrapper.appendChild(errorText);
            this.errorText = errorText;
        }

        attachEvents() {
            // Focus
            this.input.addEventListener('focus', (e) => {
                this.wrapper.classList.add('focused');
                this.isTouched = true;
                
                // Animation du label flottant
                if (this.label && this.label.classList.contains('input-label-floating')) {
                    this.label.classList.add('active');
                }
                
                // Effet ripple si activé
                if (CONFIG.animations[this.options.animation]?.effects?.includes('ripple')) {
                    this.createRipple(e);
                }
                
                if (this.options.callbacks.onFocus) {
                    this.options.callbacks.onFocus(e, this);
                }
            });
            
            // Blur
            this.input.addEventListener('blur', (e) => {
                this.wrapper.classList.remove('focused');
                
                // Animation du label flottant
                if (this.label && this.label.classList.contains('input-label-floating') && !this.input.value) {
                    this.label.classList.remove('active');
                }
                
                // Validation sur blur si activé
                if (this.options.validation && this.isTouched) {
                    this.validate();
                }
                
                if (this.options.callbacks.onBlur) {
                    this.options.callbacks.onBlur(e, this);
                }
            });
            
            // Input
            this.input.addEventListener('input', (e) => {
                this.value = this.input.value;
                this.isDirty = true;
                
                // Mise à jour du bouton clear
                this.updateClearButton();
                
                // Mise à jour du compteur
                this.updateCounter();
                
                // Validation en temps réel si activée
                if (this.options.validation?.realtime && this.isDirty) {
                    if (this.options.features.validation?.debounce) {
                        debounce(() => this.validate(), this.options.features.validation.debounce)();
                    } else {
                        this.validate();
                    }
                }
                
                // Mise à jour de la force du mot de passe
                if (this.options.type === 'password' && this.strengthBar) {
                    this.updatePasswordStrength();
                }
                
                if (this.options.callbacks.onInput) {
                    this.options.callbacks.onInput(e, this);
                }
                
                if (this.options.callbacks.onChange) {
                    this.options.callbacks.onChange(this.value, this);
                }
            });
            
            // Enter
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.options.callbacks.onEnter) {
                    this.options.callbacks.onEnter(this.value, this);
                }
            });
        }

        initFeatures() {
            // Masque
            if (this.options.features.mask && CONFIG.features.mask[this.options.type]) {
                this.applyMask(CONFIG.features.mask[this.options.type]);
            }
            
            // Focus automatique avec animation
            if (this.options.autofocus && CONFIG.animations[this.options.animation]?.enabled) {
                setTimeout(() => {
                    this.input.classList.add('autofocus-animation');
                }, 100);
            }
        }

        createRipple(event) {
            const ripple = document.createElement('div');
            ripple.className = 'input-ripple';
            
            const rect = this.wrapper.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.wrapper.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        }

        applyMask(mask) {
            let previousValue = '';
            
            this.input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                let maskedValue = '';
                let valueIndex = 0;
                
                for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
                    if (mask[i] === '9') {
                        maskedValue += value[valueIndex];
                        valueIndex++;
                    } else {
                        maskedValue += mask[i];
                    }
                }
                
                e.target.value = maskedValue;
                
                if (maskedValue.length < previousValue.length) {
                    e.target.value = maskedValue.slice(0, -1);
                }
                
                previousValue = e.target.value;
            });
        }

        updatePasswordStrength() {
            const password = this.input.value;
            let strength = 0;
            
            // Critères de force
            if (password.length >= 8) strength++;
            if (password.length >= 12) strength++;
            if (/[a-z]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            // Mise à jour de la barre
            this.strengthBar.className = 'input-password-strength-bar';
            
            if (strength <= 2) {
                this.strengthBar.classList.add('weak');
            } else if (strength <= 4) {
                this.strengthBar.classList.add('medium');
            } else {
                this.strengthBar.classList.add('strong');
            }
        }

        enableAutoResize() {
            this.input.style.resize = 'none';
            this.input.style.overflow = 'hidden';
            
            const resize = () => {
                this.input.style.height = 'auto';
                this.input.style.height = this.input.scrollHeight + 'px';
            };
            
            this.input.addEventListener('input', resize);
            resize();
        }

        // ========================================
        // MÉTHODES DE VALIDATION
        // ========================================
        validate() {
            this.errors = [];
            this.isValid = true;
            
            const value = this.input.value;
            const validation = this.options.validation || {};
            
            // Required
            if (this.options.required && !value) {
                this.addError(CONFIG.errorMessages.required);
            }
            
            // Email
            if (this.options.type === 'email' && value && !CONFIG.patterns.email.test(value)) {
                this.addError(CONFIG.errorMessages.email);
            }
            
            // URL
            if (this.options.type === 'url' && value && !CONFIG.patterns.url.test(value)) {
                this.addError(CONFIG.errorMessages.url);
            }
            
            // Pattern personnalisé
            if (validation.pattern && value && !new RegExp(validation.pattern).test(value)) {
                this.addError(validation.patternMessage || CONFIG.errorMessages.pattern);
            }
            
            // Min/Max length
            if (validation.minLength && value.length < validation.minLength) {
                this.addError(CONFIG.errorMessages.minLength.replace('{min}', validation.minLength));
            }
            
            if (validation.maxLength && value.length > validation.maxLength) {
                this.addError(CONFIG.errorMessages.maxLength.replace('{max}', validation.maxLength));
            }
            
            // Min/Max pour nombres
            if (this.options.type === 'number' && value) {
                const num = parseFloat(value);
                if (validation.min !== undefined && num < validation.min) {
                    this.addError(CONFIG.errorMessages.min.replace('{min}', validation.min));
                }
                if (validation.max !== undefined && num > validation.max) {
                    this.addError(CONFIG.errorMessages.max.replace('{max}', validation.max));
                }
            }
            
            // Validation personnalisée
            if (validation.custom && typeof validation.custom === 'function') {
                const customError = validation.custom(value, this);
                if (customError) {
                    this.addError(customError);
                }
            }
            
            // Mise à jour de l'UI
            this.updateValidationUI();
            
            // Callback
            if (this.options.callbacks.onValidate) {
                this.options.callbacks.onValidate(this.isValid, this.errors, this);
            }
            
            return this.isValid;
        }

        addError(message) {
            this.errors.push(message);
            this.isValid = false;
        }

        updateValidationUI() {
            this.wrapper.classList.remove('error', 'success');
            
            if (!this.isValid) {
                this.wrapper.classList.add('error');
                this.showError(this.errors[0]);
                
                // Animation shake si activée
                if (CONFIG.animations[this.options.animation]?.effects?.includes('shake')) {
                    this.wrapper.style.animation = 'shake 0.5s ease';
                    setTimeout(() => {
                        this.wrapper.style.animation = '';
                    }, 500);
                }
            } else if (this.isDirty && this.value) {
                this.wrapper.classList.add('success');
                this.hideError();
            } else {
                this.hideError();
            }
        }

        showError(message) {
            if (this.errorText) {
                this.errorText.textContent = message;
                this.errorText.style.display = 'block';
            }
        }

        hideError() {
            if (this.errorText) {
                this.errorText.style.display = 'none';
            }
        }

        // ========================================
        // API PUBLIQUE
        // ========================================
        getValue() {
            return this.value;
        }

        setValue(value) {
            this.value = value;
            this.input.value = value;
            
            // Mettre à jour les éléments dépendants
            if (this.label && this.label.classList.contains('input-label-floating') && value) {
                this.label.classList.add('active');
            }
            
            this.updateClearButton();
            this.updateCounter();
            
            if (this.options.type === 'chips' && Array.isArray(value)) {
                this.chips = [];
                this.chipsContainer.querySelectorAll('.input-chip').forEach(chip => chip.remove());
                value.forEach(v => this.addChip(v));
            }
            
            return this;
        }

        clear() {
            this.setValue('');
            this.isDirty = false;
            this.hideError();
            
            if (this.options.callbacks.onClear) {
                this.options.callbacks.onClear(this);
            }
            
            this.input.focus();
        }

        focus() {
            this.input.focus();
            return this;
        }

        blur() {
            this.input.blur();
            return this;
        }

        enable() {
            this.options.disabled = false;
            this.input.disabled = false;
            this.wrapper.classList.remove('disabled');
            return this;
        }

        disable() {
            this.options.disabled = true;
            this.input.disabled = true;
            this.wrapper.classList.add('disabled');
            return this;
        }

        setReadOnly(readonly) {
            this.options.readonly = readonly;
            this.input.readOnly = readonly;
            return this;
        }

        reset() {
            this.setValue(this.options.value || '');
            this.isDirty = false;
            this.isTouched = false;
            this.errors = [];
            this.isValid = true;
            this.hideError();
            this.wrapper.classList.remove('error', 'success');
            return this;
        }

        destroy() {
            // Nettoyer les event listeners et le DOM
            this.wrapper.remove();
        }

        getElement() {
            return this.wrapper;
        }

        getInputElement() {
            return this.input;
        }

        isValidField() {
            return this.validate();
        }

        getErrors() {
            return this.errors;
        }

        setError(message) {
            this.isValid = false;
            this.errors = [message];
            this.updateValidationUI();
            return this;
        }

        clearError() {
            this.isValid = true;
            this.errors = [];
            this.updateValidationUI();
            return this;
        }
    }

    // ========================================
    // HELPERS
    // ========================================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ========================================
    // GESTIONNAIRE D'INPUTS
    // ========================================
    class InputFieldManager {
        constructor() {
            this.fields = new Map();
        }

        create(options) {
            const field = new InputField(options);
            this.fields.set(field.options.id, field);
            return field;
        }

        get(id) {
            return this.fields.get(id);
        }

        getAll() {
            return Array.from(this.fields.values());
        }

        validateAll() {
            let isValid = true;
            this.fields.forEach(field => {
                if (!field.validate()) {
                    isValid = false;
                }
            });
            return isValid;
        }

        getValues() {
            const values = {};
            this.fields.forEach((field, id) => {
                values[field.options.name || id] = field.getValue();
            });
            return values;
        }

        setValues(values) {
            Object.entries(values).forEach(([name, value]) => {
                const field = Array.from(this.fields.values()).find(f => f.options.name === name);
                if (field) {
                    field.setValue(value);
                }
            });
        }

        resetAll() {
            this.fields.forEach(field => field.reset());
        }

        destroy(id) {
            const field = this.fields.get(id);
            if (field) {
                field.destroy();
                this.fields.delete(id);
            }
        }

        destroyAll() {
            this.fields.forEach(field => field.destroy());
            this.fields.clear();
        }
    }

    // Instance globale
    const inputFieldManager = new InputFieldManager();

    // ========================================
    // PRESETS
    // ========================================
    const Presets = {
        // Email avec validation
        email: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'email',
                label: options.label || 'Email',
                placeholder: options.placeholder || 'exemple@email.com',
                icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
                validation: {
                    ...options.validation,
                    pattern: CONFIG.patterns.email.source
                }
            });
        },

        // Mot de passe avec indicateur de force
        password: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'password',
                label: options.label || 'Mot de passe',
                placeholder: options.placeholder || '••••••••',
                features: {
                    showToggle: true,
                    strength: true,
                    ...options.features
                }
            });
        },

        // Recherche avec autocomplétion
        search: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'search',
                placeholder: options.placeholder || 'Rechercher...',
                features: {
                    clearButton: true,
                    autoComplete: {
                        enabled: true,
                        ...options.features?.autoComplete
                    },
                    ...options.features
                }
            });
        },

        // Téléphone avec masque
        phone: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'tel',
                label: options.label || 'Téléphone',
                placeholder: options.placeholder || '(123) 456-7890',
                features: {
                    mask: '(999) 999-9999',
                    ...options.features
                }
            });
        },

        // Carte de crédit
        creditCard: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'text',
                label: options.label || 'Numéro de carte',
                placeholder: options.placeholder || '1234 5678 9012 3456',
                features: {
                    mask: '9999 9999 9999 9999',
                    ...options.features
                },
                validation: {
                    pattern: CONFIG.patterns.creditCard.source,
                    ...options.validation
                }
            });
        },

        // Tags/Chips
        tags: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'chips',
                label: options.label || 'Tags',
                placeholder: options.placeholder || 'Ajouter un tag...'
            });
        },

        // Code PIN
        pin: (options = {}) => {
            return inputFieldManager.create({
                ...options,
                type: 'pin',
                label: options.label || 'Code PIN',
                features: {
                    length: options.length || 4,
                    numeric: true,
                    hidden: true,
                    ...options.features
                }
            });
        },

        // Formulaire complet
        form: (fields, options = {}) => {
            const form = document.createElement('form');
            form.className = options.className || 'input-form';
            
            const fieldInstances = fields.map(fieldConfig => {
                const field = inputFieldManager.create(fieldConfig);
                form.appendChild(field.getElement());
                return field;
            });
            
            if (options.submitButton) {
                const button = document.createElement('button');
                button.type = 'submit';
                button.className = 'input-form-submit';
                button.textContent = options.submitText || 'Valider';
                Object.assign(button.style, {
                    ...CONFIG.styles[options.style || 'glassmorphism']?.input,
                    cursor: 'pointer',
                    marginTop: '20px'
                });
                form.appendChild(button);
            }
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                if (inputFieldManager.validateAll()) {
                    const values = inputFieldManager.getValues();
                    if (options.onSubmit) {
                        options.onSubmit(values, fieldInstances);
                    }
                }
            });
            
            return { form, fields: fieldInstances };
        }
    };

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Créer un input custom
        create: (options) => inputFieldManager.create(options),
        
        // Presets
        email: Presets.email,
        password: Presets.password,
        search: Presets.search,
        phone: Presets.phone,
        creditCard: Presets.creditCard,
        tags: Presets.tags,
        pin: Presets.pin,
        form: Presets.form,
        
        // Gestionnaire
        manager: inputFieldManager,
        
        // Configuration
        CONFIG,
        
        // Validateurs
        validators: {
            email: (value) => CONFIG.patterns.email.test(value),
            url: (value) => CONFIG.patterns.url.test(value),
            phone: (value) => CONFIG.patterns.phone.test(value),
            creditCard: (value) => CONFIG.patterns.creditCard.test(value),
            strongPassword: (value) => CONFIG.patterns.strongPassword.test(value)
        },
        
        // Utilitaires
        injectStyles: () => {
            const field = new InputField({ autoOpen: false });
            field.injectStyles();
        }
    };
})();

// Export par défaut
export default InputField;

// Exports nommés pour plus de flexibilité
export const { create, email, password, search, phone, creditCard, tags, pin, form, manager, CONFIG, validators } = InputField;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-XX-XX] - Gestion des masques de saisie
   Solution: Fonction custom avec regex et formatage dynamique
   
   [2024-XX-XX] - Performance avec autocomplétion
   Solution: Debounce et limite du nombre de suggestions
   
   [2024-XX-XX] - Accessibilité des inputs custom
   Solution: ARIA labels, rôles et navigation clavier
   
   NOTES POUR REPRISES FUTURES:
   - Les inputs de type date/time natifs varient selon les navigateurs
   - Le speech recognition n'est pas supporté partout
   - Les masques peuvent interférer avec les gestionnaires de mots de passe
   - Tester l'autocomplétion avec de grandes listes
   ======================================== */