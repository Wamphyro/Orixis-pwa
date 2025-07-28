/* ========================================
   RADIO-GROUP.COMPONENT.JS - Système de groupes radio modulaire complet
   Chemin: src/js/shared/ui/data-entry/radio-group.component.js
   
   DESCRIPTION:
   Composant de groupe de boutons radio ultra-flexible avec toutes les variantes.
   Supporte tous les styles visuels, animations, layouts et validations.
   Conçu pour une intégration facile dans tout formulaire moderne.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-500)
   2. Méthodes de création (lignes 501-1000)
   3. Méthodes de validation (lignes 1001-1200)
   4. Gestionnaires d'événements (lignes 1201-1400)
   5. API publique (lignes 1401-1500)
   
   DÉPENDANCES:
   - Aucune dépendance externe requise
   - Peut utiliser frosted-icons.component.js si disponible
   - Compatible avec glass-form-fields.js
   ======================================== */

const RadioGroupComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                },
                radio: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    checkedBackground: 'rgba(59, 130, 246, 0.3)',
                    checkedBorder: 'rgba(59, 130, 246, 0.8)',
                    focus: '0 0 0 4px rgba(59, 130, 246, 0.2)'
                },
                className: 'radio-glassmorphism'
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    padding: '24px'
                },
                radio: {
                    background: '#e0e5ec',
                    boxShadow: 'inset 2px 2px 5px #b8b9be, inset -3px -3px 7px #ffffff',
                    checkedShadow: 'inset 1px 1px 3px #b8b9be, inset -1px -1px 3px #ffffff'
                },
                className: 'radio-neumorphism'
            },
            'flat': {
                container: {
                    background: 'transparent',
                    padding: '16px'
                },
                radio: {
                    background: '#ffffff',
                    border: '2px solid #d1d5db',
                    checkedBackground: '#3b82f6',
                    checkedBorder: '#3b82f6'
                },
                className: 'radio-flat'
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    padding: '16px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                },
                radio: {
                    border: '2px solid #9e9e9e',
                    checkedBorder: '#2196f3',
                    rippleEffect: true
                },
                className: 'radio-material'
            },
            'outlined': {
                container: {
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '16px',
                    background: 'transparent'
                },
                radio: {
                    border: '2px solid #6b7280',
                    checkedBorder: '#3b82f6'
                },
                className: 'radio-outlined'
            },
            'modern': {
                container: {
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    borderRadius: '16px',
                    padding: '20px'
                },
                radio: {
                    background: '#ffffff',
                    border: '2px solid transparent',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    checkedBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                },
                className: 'radio-modern'
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    padding: '12px'
                },
                radio: {
                    border: '1px solid #d1d5db',
                    size: '16px',
                    checkedBackground: '#000000'
                },
                className: 'radio-minimal'
            },
            'pill': {
                container: {
                    background: '#f3f4f6',
                    borderRadius: '9999px',
                    padding: '4px',
                    display: 'inline-flex'
                },
                radio: {
                    hideInput: true,
                    pillStyle: true,
                    selectedBackground: '#ffffff',
                    selectedShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                },
                className: 'radio-pill'
            },
            'card': {
                container: {
                    display: 'grid',
                    gap: '12px'
                },
                radio: {
                    cardStyle: true,
                    padding: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    checkedBorder: '#3b82f6',
                    checkedBackground: 'rgba(59, 130, 246, 0.05)'
                },
                className: 'radio-card'
            },
            'toggle': {
                container: {
                    background: 'transparent'
                },
                radio: {
                    toggleStyle: true,
                    width: '48px',
                    height: '24px',
                    borderRadius: '12px',
                    background: '#d1d5db',
                    checkedBackground: '#3b82f6'
                },
                className: 'radio-toggle'
            }
        },

        // Layouts disponibles
        layouts: {
            'vertical': {
                direction: 'column',
                gap: '12px',
                className: 'layout-vertical'
            },
            'horizontal': {
                direction: 'row',
                gap: '16px',
                wrap: true,
                className: 'layout-horizontal'
            },
            'grid': {
                display: 'grid',
                columns: 2,
                gap: '16px',
                className: 'layout-grid'
            },
            'inline': {
                display: 'inline-flex',
                gap: '12px',
                className: 'layout-inline'
            },
            'masonry': {
                columns: 'auto',
                gap: '12px',
                className: 'layout-masonry'
            },
            'compact': {
                direction: 'row',
                gap: '8px',
                className: 'layout-compact'
            },
            'spaced': {
                direction: 'column',
                gap: '24px',
                className: 'layout-spaced'
            },
            'responsive': {
                direction: 'row',
                breakpoint: 768,
                mobileDirection: 'column',
                className: 'layout-responsive'
            }
        },

        // Tailles disponibles
        sizes: {
            'xs': {
                radio: '14px',
                font: '0.75rem',
                padding: '4px',
                className: 'size-xs'
            },
            'sm': {
                radio: '16px',
                font: '0.875rem',
                padding: '6px',
                className: 'size-sm'
            },
            'md': {
                radio: '20px',
                font: '1rem',
                padding: '8px',
                className: 'size-md'
            },
            'lg': {
                radio: '24px',
                font: '1.125rem',
                padding: '10px',
                className: 'size-lg'
            },
            'xl': {
                radio: '28px',
                font: '1.25rem',
                padding: '12px',
                className: 'size-xl'
            }
        },

        // Animations disponibles
        animations: {
            'none': {
                enabled: false,
                className: 'animation-none'
            },
            'subtle': {
                enabled: true,
                duration: 200,
                scale: 1.05,
                className: 'animation-subtle'
            },
            'smooth': {
                enabled: true,
                duration: 300,
                scale: 1.1,
                rotate: 180,
                className: 'animation-smooth'
            },
            'bounce': {
                enabled: true,
                duration: 400,
                keyframes: 'bounceIn',
                className: 'animation-bounce'
            },
            'pulse': {
                enabled: true,
                duration: 600,
                keyframes: 'pulse',
                className: 'animation-pulse'
            },
            'shake': {
                enabled: true,
                duration: 500,
                keyframes: 'shake',
                onError: true,
                className: 'animation-shake'
            },
            'glow': {
                enabled: true,
                duration: 400,
                glowColor: 'currentColor',
                glowSize: '10px',
                className: 'animation-glow'
            },
            'ripple': {
                enabled: true,
                duration: 600,
                rippleColor: 'rgba(0, 0, 0, 0.1)',
                className: 'animation-ripple'
            }
        },

        // Variantes de label
        labelVariants: {
            'default': {
                position: 'right',
                gap: '8px',
                className: 'label-default'
            },
            'left': {
                position: 'left',
                gap: '8px',
                className: 'label-left'
            },
            'top': {
                position: 'top',
                gap: '4px',
                className: 'label-top'
            },
            'bottom': {
                position: 'bottom',
                gap: '4px',
                className: 'label-bottom'
            },
            'inside': {
                position: 'inside',
                overlay: true,
                className: 'label-inside'
            },
            'floating': {
                position: 'floating',
                animated: true,
                className: 'label-floating'
            },
            'hidden': {
                position: 'hidden',
                srOnly: true,
                className: 'label-hidden'
            }
        },

        // Features disponibles
        features: {
            'validation': {
                enabled: false,
                rules: [],
                showErrors: true,
                validateOnChange: true,
                validateOnBlur: true
            },
            'required': {
                enabled: false,
                message: 'Ce champ est requis',
                indicator: '*'
            },
            'disabled': {
                enabled: false,
                opacity: 0.5,
                cursor: 'not-allowed',
                items: [] // Items spécifiques à désactiver
            },
            'readonly': {
                enabled: false,
                appearance: 'normal', // normal, muted
                preventChange: true
            },
            'conditional': {
                enabled: false,
                rules: [], // Règles pour afficher/masquer des options
                dependencies: [] // Dépendances vers d'autres champs
            },
            'icons': {
                enabled: false,
                position: 'left', // left, right
                custom: {} // Icônes personnalisées par valeur
            },
            'descriptions': {
                enabled: false,
                position: 'below', // below, tooltip
                custom: {} // Descriptions par valeur
            },
            'colors': {
                enabled: false,
                custom: {} // Couleurs personnalisées par valeur
            },
            'images': {
                enabled: false,
                size: '40px',
                position: 'left',
                custom: {} // Images par valeur
            },
            'keyboard': {
                enabled: true,
                arrows: true, // Navigation avec flèches
                wrap: true, // Boucler en fin de liste
                homeEnd: true // Home/End pour premier/dernier
            },
            'search': {
                enabled: false,
                placeholder: 'Rechercher...',
                minChars: 1,
                highlight: true
            },
            'count': {
                enabled: false,
                position: 'top', // top, bottom
                format: '{current}/{total}'
            },
            'grouping': {
                enabled: false,
                groups: [], // Groupes d'options
                collapsible: false
            },
            'tooltip': {
                enabled: false,
                trigger: 'hover', // hover, focus
                delay: 300,
                custom: {} // Tooltips par valeur
            },
            'analytics': {
                enabled: false,
                trackChanges: true,
                trackTime: true,
                callback: null
            },
            'persistence': {
                enabled: false,
                key: null,
                storage: 'local' // local, session
            }
        },

        // États de validation
        validationStates: {
            'valid': {
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                iconColor: '#10b981',
                className: 'validation-valid'
            },
            'invalid': {
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                iconColor: '#ef4444',
                className: 'validation-invalid'
            },
            'warning': {
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                iconColor: '#f59e0b',
                className: 'validation-warning'
            },
            'pending': {
                borderColor: '#6b7280',
                backgroundColor: 'rgba(107, 114, 128, 0.05)',
                iconColor: '#6b7280',
                className: 'validation-pending'
            }
        },

        // Thèmes de couleur
        colorThemes: {
            'default': { primary: '#3b82f6', secondary: '#e5e7eb' },
            'success': { primary: '#10b981', secondary: '#d1fae5' },
            'danger': { primary: '#ef4444', secondary: '#fee2e2' },
            'warning': { primary: '#f59e0b', secondary: '#fef3c7' },
            'info': { primary: '#3b82f6', secondary: '#dbeafe' },
            'purple': { primary: '#8b5cf6', secondary: '#ede9fe' },
            'pink': { primary: '#ec4899', secondary: '#fce7f3' },
            'dark': { primary: '#1f2937', secondary: '#374151' }
        },

        // Présets d'options communes
        presets: {
            'yesNo': [
                { value: 'yes', label: 'Oui' },
                { value: 'no', label: 'Non' }
            ],
            'satisfaction': [
                { value: '5', label: 'Très satisfait', icon: '😄' },
                { value: '4', label: 'Satisfait', icon: '🙂' },
                { value: '3', label: 'Neutre', icon: '😐' },
                { value: '2', label: 'Insatisfait', icon: '😕' },
                { value: '1', label: 'Très insatisfait', icon: '😞' }
            ],
            'frequency': [
                { value: 'always', label: 'Toujours' },
                { value: 'often', label: 'Souvent' },
                { value: 'sometimes', label: 'Parfois' },
                { value: 'rarely', label: 'Rarement' },
                { value: 'never', label: 'Jamais' }
            ],
            'agreement': [
                { value: 'strongly-agree', label: 'Tout à fait d\'accord' },
                { value: 'agree', label: 'D\'accord' },
                { value: 'neutral', label: 'Neutre' },
                { value: 'disagree', label: 'Pas d\'accord' },
                { value: 'strongly-disagree', label: 'Pas du tout d\'accord' }
            ],
            'priority': [
                { value: 'high', label: 'Haute', color: '#ef4444' },
                { value: 'medium', label: 'Moyenne', color: '#f59e0b' },
                { value: 'low', label: 'Basse', color: '#10b981' }
            ],
            'size': [
                { value: 'xs', label: 'XS' },
                { value: 's', label: 'S' },
                { value: 'm', label: 'M' },
                { value: 'l', label: 'L' },
                { value: 'xl', label: 'XL' }
            ]
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    
    /**
     * Crée le conteneur principal
     */
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = 'ui-radio-group';
        
        // Ajouter les classes selon les options
        if (options.style && CONFIG.styles[options.style]) {
            container.classList.add(CONFIG.styles[options.style].className);
        }
        
        if (options.layout && CONFIG.layouts[options.layout]) {
            container.classList.add(CONFIG.layouts[options.layout].className);
        }
        
        if (options.size && CONFIG.sizes[options.size]) {
            container.classList.add(CONFIG.sizes[options.size].className);
        }
        
        if (options.animation && CONFIG.animations[options.animation]) {
            container.classList.add(CONFIG.animations[options.animation].className);
        }
        
        if (options.className) {
            container.classList.add(...options.className.split(' '));
        }
        
        // Attributs ARIA
        container.setAttribute('role', 'radiogroup');
        if (options.label) {
            container.setAttribute('aria-label', options.label);
        }
        
        // ID unique pour le groupe
        const groupId = options.id || generateId();
        container.id = groupId;
        
        // Styles inline si nécessaire
        if (options.style && CONFIG.styles[options.style].container) {
            applyStyles(container, CONFIG.styles[options.style].container);
        }
        
        return container;
    }
    
    /**
     * Crée le label du groupe
     */
    function createGroupLabel(label, options = {}) {
        const labelElement = document.createElement('div');
        labelElement.className = 'ui-radio-group-label';
        
        if (typeof label === 'string') {
            labelElement.textContent = label;
        } else if (label instanceof HTMLElement) {
            labelElement.appendChild(label);
        }
        
        if (options.required?.enabled) {
            const indicator = document.createElement('span');
            indicator.className = 'required-indicator';
            indicator.textContent = options.required.indicator || '*';
            indicator.setAttribute('aria-label', 'requis');
            labelElement.appendChild(indicator);
        }
        
        if (options.description) {
            const desc = document.createElement('p');
            desc.className = 'ui-radio-group-description';
            desc.textContent = options.description;
            labelElement.appendChild(desc);
        }
        
        return labelElement;
    }
    
    /**
     * Crée un bouton radio individuel
     */
    function createRadioItem(option, groupName, options = {}) {
        const itemContainer = document.createElement('label');
        itemContainer.className = 'ui-radio-item';
        
        // Appliquer le style card si nécessaire
        if (options.style === 'card' || options.style === 'pill') {
            itemContainer.classList.add(`ui-radio-item-${options.style}`);
        }
        
        // Input radio
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = groupName;
        input.value = option.value;
        input.className = 'ui-radio-input';
        
        if (option.id) {
            input.id = option.id;
        }
        
        if (option.checked || option.value === options.value) {
            input.checked = true;
        }
        
        if (option.disabled || options.disabled?.enabled) {
            input.disabled = true;
            itemContainer.classList.add('disabled');
        }
        
        if (options.readonly?.enabled) {
            input.readOnly = true;
            itemContainer.classList.add('readonly');
        }
        
        // Attributs ARIA
        if (option.ariaLabel) {
            input.setAttribute('aria-label', option.ariaLabel);
        }
        
        if (option.ariaDescribedBy) {
            input.setAttribute('aria-describedby', option.ariaDescribedBy);
        }
        
        // Indicateur visuel personnalisé
        const customRadio = document.createElement('span');
        customRadio.className = 'ui-radio-custom';
        
        // Appliquer les styles du thème
        if (options.style && CONFIG.styles[options.style].radio) {
            applyStyles(customRadio, CONFIG.styles[options.style].radio);
        }
        
        // Conteneur pour le contenu
        const contentContainer = document.createElement('span');
        contentContainer.className = 'ui-radio-content';
        
        // Image si activée
        if (options.features?.images?.enabled && option.image) {
            const img = document.createElement('img');
            img.src = option.image;
            img.alt = option.label || '';
            img.className = 'ui-radio-image';
            img.style.width = options.features.images.size;
            img.style.height = options.features.images.size;
            contentContainer.appendChild(img);
        }
        
        // Icône si activée
        if (options.features?.icons?.enabled && option.icon) {
            const icon = document.createElement('span');
            icon.className = 'ui-radio-icon';
            icon.innerHTML = option.icon;
            contentContainer.appendChild(icon);
        }
        
        // Label
        const labelText = document.createElement('span');
        labelText.className = 'ui-radio-label';
        labelText.textContent = option.label;
        contentContainer.appendChild(labelText);
        
        // Description si activée
        if (options.features?.descriptions?.enabled && option.description) {
            const desc = document.createElement('span');
            desc.className = 'ui-radio-description';
            desc.textContent = option.description;
            contentContainer.appendChild(desc);
        }
        
        // Badge ou indicateur supplémentaire
        if (option.badge) {
            const badge = document.createElement('span');
            badge.className = 'ui-radio-badge';
            badge.textContent = option.badge;
            if (option.badgeColor) {
                badge.style.backgroundColor = option.badgeColor;
            }
            contentContainer.appendChild(badge);
        }
        
        // Assemblage selon la position du label
        const labelPosition = options.labelVariant || 'default';
        if (labelPosition === 'left') {
            itemContainer.appendChild(contentContainer);
            itemContainer.appendChild(input);
            itemContainer.appendChild(customRadio);
        } else {
            itemContainer.appendChild(input);
            itemContainer.appendChild(customRadio);
            itemContainer.appendChild(contentContainer);
        }
        
        // Couleur personnalisée
        if (options.features?.colors?.enabled && option.color) {
            customRadio.style.setProperty('--radio-color', option.color);
        }
        
        // Tooltip si activé
        if (options.features?.tooltip?.enabled && option.tooltip) {
            addTooltip(itemContainer, option.tooltip, options.features.tooltip);
        }
        
        // Animation ripple pour Material Design
        if (options.animation === 'ripple' || options.style === 'material') {
            addRippleEffect(itemContainer);
        }
        
        return itemContainer;
    }
    
    /**
     * Crée la zone de recherche
     */
    function createSearchBox(options) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'ui-radio-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'ui-radio-search-input';
        searchInput.placeholder = options.placeholder || 'Rechercher...';
        
        const searchIcon = document.createElement('span');
        searchIcon.className = 'ui-radio-search-icon';
        searchIcon.innerHTML = '🔍';
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        
        return { container: searchContainer, input: searchInput };
    }
    
    /**
     * Crée un groupe d'options
     */
    function createOptionGroup(group, groupName, options) {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'ui-radio-option-group';
        
        const groupHeader = document.createElement('div');
        groupHeader.className = 'ui-radio-group-header';
        groupHeader.textContent = group.label;
        
        if (options.features?.grouping?.collapsible) {
            groupHeader.classList.add('collapsible');
            groupHeader.addEventListener('click', () => {
                groupContainer.classList.toggle('collapsed');
            });
        }
        
        const groupContent = document.createElement('div');
        groupContent.className = 'ui-radio-group-content';
        
        group.options.forEach(option => {
            const item = createRadioItem(option, groupName, options);
            groupContent.appendChild(item);
        });
        
        groupContainer.appendChild(groupHeader);
        groupContainer.appendChild(groupContent);
        
        return groupContainer;
    }
    
    /**
     * Crée la zone de validation
     */
    function createValidationMessage() {
        const messageContainer = document.createElement('div');
        messageContainer.className = 'ui-radio-validation-message';
        messageContainer.style.display = 'none';
        
        const icon = document.createElement('span');
        icon.className = 'validation-icon';
        
        const text = document.createElement('span');
        text.className = 'validation-text';
        
        messageContainer.appendChild(icon);
        messageContainer.appendChild(text);
        
        return messageContainer;
    }
    
    /**
     * Crée le compteur d'options
     */
    function createCounter(current, total, format) {
        const counter = document.createElement('div');
        counter.className = 'ui-radio-counter';
        
        const text = format
            .replace('{current}', current)
            .replace('{total}', total);
        
        counter.textContent = text;
        return counter;
    }
    
    // ========================================
    // MÉTHODES PRIVÉES - FEATURES
    // ========================================
    
    /**
     * Ajoute l'effet ripple
     */
    function addRippleEffect(element) {
        element.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }
    
    /**
     * Ajoute un tooltip
     */
    function addTooltip(element, content, options) {
        const tooltip = document.createElement('div');
        tooltip.className = 'ui-radio-tooltip';
        tooltip.textContent = content;
        
        element.style.position = 'relative';
        element.appendChild(tooltip);
        
        const showTooltip = () => {
            setTimeout(() => {
                tooltip.classList.add('visible');
            }, options.delay || 300);
        };
        
        const hideTooltip = () => {
            tooltip.classList.remove('visible');
        };
        
        if (options.trigger === 'hover') {
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        } else if (options.trigger === 'focus') {
            const input = element.querySelector('input');
            input.addEventListener('focus', showTooltip);
            input.addEventListener('blur', hideTooltip);
        }
    }
    
    /**
     * Applique la logique conditionnelle
     */
    function applyConditionalLogic(radioGroup, rules) {
        rules.forEach(rule => {
            const triggerInputs = radioGroup.querySelectorAll(`input[value="${rule.when.value}"]`);
            
            triggerInputs.forEach(input => {
                const checkCondition = () => {
                    if (input.checked) {
                        executeConditionalAction(radioGroup, rule.then);
                    } else if (rule.else) {
                        executeConditionalAction(radioGroup, rule.else);
                    }
                };
                
                input.addEventListener('change', checkCondition);
                checkCondition(); // Vérifier l'état initial
            });
        });
    }
    
    /**
     * Exécute une action conditionnelle
     */
    function executeConditionalAction(radioGroup, action) {
        if (action.show) {
            action.show.forEach(value => {
                const item = radioGroup.querySelector(`input[value="${value}"]`)?.closest('.ui-radio-item');
                if (item) item.style.display = '';
            });
        }
        
        if (action.hide) {
            action.hide.forEach(value => {
                const item = radioGroup.querySelector(`input[value="${value}"]`)?.closest('.ui-radio-item');
                if (item) item.style.display = 'none';
            });
        }
        
        if (action.enable) {
            action.enable.forEach(value => {
                const input = radioGroup.querySelector(`input[value="${value}"]`);
                if (input) {
                    input.disabled = false;
                    input.closest('.ui-radio-item').classList.remove('disabled');
                }
            });
        }
        
        if (action.disable) {
            action.disable.forEach(value => {
                const input = radioGroup.querySelector(`input[value="${value}"]`);
                if (input) {
                    input.disabled = true;
                    input.closest('.ui-radio-item').classList.add('disabled');
                }
            });
        }
    }
    
    /**
     * Configure la navigation au clavier
     */
    function setupKeyboardNavigation(radioGroup, options) {
        const inputs = Array.from(radioGroup.querySelectorAll('input[type="radio"]:not(:disabled)'));
        
        radioGroup.addEventListener('keydown', (e) => {
            const currentInput = document.activeElement;
            const currentIndex = inputs.indexOf(currentInput);
            
            if (currentIndex === -1) return;
            
            let newIndex = currentIndex;
            
            switch (e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    newIndex = currentIndex + 1;
                    if (newIndex >= inputs.length) {
                        newIndex = options.wrap ? 0 : inputs.length - 1;
                    }
                    break;
                    
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    newIndex = currentIndex - 1;
                    if (newIndex < 0) {
                        newIndex = options.wrap ? inputs.length - 1 : 0;
                    }
                    break;
                    
                case 'Home':
                    if (options.homeEnd) {
                        e.preventDefault();
                        newIndex = 0;
                    }
                    break;
                    
                case 'End':
                    if (options.homeEnd) {
                        e.preventDefault();
                        newIndex = inputs.length - 1;
                    }
                    break;
                    
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    currentInput.checked = true;
                    currentInput.dispatchEvent(new Event('change', { bubbles: true }));
                    return;
            }
            
            if (newIndex !== currentIndex) {
                inputs[newIndex].focus();
                inputs[newIndex].checked = true;
                inputs[newIndex].dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }
    
    /**
     * Configure la recherche
     */
    function setupSearch(radioGroup, searchInput, options) {
        const items = radioGroup.querySelectorAll('.ui-radio-item');
        
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm.length < (options.minChars || 1)) {
                items.forEach(item => {
                    item.style.display = '';
                    if (options.highlight) {
                        removeHighlight(item);
                    }
                });
                return;
            }
            
            items.forEach(item => {
                const label = item.querySelector('.ui-radio-label').textContent.toLowerCase();
                const matches = label.includes(searchTerm);
                
                item.style.display = matches ? '' : 'none';
                
                if (matches && options.highlight) {
                    highlightText(item.querySelector('.ui-radio-label'), searchTerm);
                } else if (options.highlight) {
                    removeHighlight(item);
                }
            });
        });
    }
    
    /**
     * Surligne le texte trouvé
     */
    function highlightText(element, searchTerm) {
        const text = element.textContent;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        element.innerHTML = text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Retire le surlignage
     */
    function removeHighlight(element) {
        const label = element.querySelector('.ui-radio-label');
        label.innerHTML = label.textContent;
    }
    
    /**
     * Configure la persistance
     */
    function setupPersistence(radioGroup, options) {
        const storageKey = options.key || `radio-group-${radioGroup.id}`;
        const storage = options.storage === 'session' ? sessionStorage : localStorage;
        
        // Restaurer la valeur sauvegardée
        const savedValue = storage.getItem(storageKey);
        if (savedValue) {
            const input = radioGroup.querySelector(`input[value="${savedValue}"]`);
            if (input) {
                input.checked = true;
            }
        }
        
        // Sauvegarder les changements
        radioGroup.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                storage.setItem(storageKey, e.target.value);
            }
        });
    }
    
    /**
     * Configure l'analytique
     */
    function setupAnalytics(radioGroup, options) {
        const analytics = {
            changes: [],
            startTime: Date.now(),
            currentValue: null
        };
        
        radioGroup.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                const change = {
                    from: analytics.currentValue,
                    to: e.target.value,
                    timestamp: Date.now(),
                    duration: Date.now() - analytics.startTime
                };
                
                analytics.changes.push(change);
                analytics.currentValue = e.target.value;
                
                if (options.callback) {
                    options.callback(change, analytics);
                }
            }
        });
        
        // Exposer les analytics
        radioGroup.analytics = analytics;
    }
    
    // ========================================
    // MÉTHODES PRIVÉES - VALIDATION
    // ========================================
    
    /**
     * Valide le groupe radio
     */
    function validate(radioGroup, options) {
        const validationMessage = radioGroup.querySelector('.ui-radio-validation-message');
        const selectedInput = radioGroup.querySelector('input[type="radio"]:checked');
        
        let isValid = true;
        let message = '';
        let state = 'valid';
        
        // Validation required
        if (options.features?.required?.enabled && !selectedInput) {
            isValid = false;
            message = options.features.required.message || 'Ce champ est requis';
            state = 'invalid';
        }
        
        // Validations personnalisées
        if (isValid && options.features?.validation?.rules) {
            for (const rule of options.features.validation.rules) {
                const result = rule.validator(selectedInput?.value, radioGroup);
                if (!result.valid) {
                    isValid = false;
                    message = result.message || 'Valeur invalide';
                    state = result.state || 'invalid';
                    break;
                }
            }
        }
        
        // Afficher le résultat
        updateValidationState(radioGroup, validationMessage, isValid, message, state);
        
        return { isValid, message, state };
    }
    
    /**
     * Met à jour l'état de validation
     */
    function updateValidationState(radioGroup, messageElement, isValid, message, state) {
        // Retirer toutes les classes de validation
        Object.keys(CONFIG.validationStates).forEach(key => {
            radioGroup.classList.remove(CONFIG.validationStates[key].className);
        });
        
        if (!isValid && messageElement) {
            radioGroup.classList.add(CONFIG.validationStates[state].className);
            messageElement.style.display = 'flex';
            messageElement.querySelector('.validation-text').textContent = message;
            messageElement.className = `ui-radio-validation-message ${state}`;
        } else if (messageElement) {
            messageElement.style.display = 'none';
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    
    /**
     * Applique des styles à un élément
     */
    function applyStyles(element, styles) {
        Object.entries(styles).forEach(([property, value]) => {
            if (property === 'className') {
                element.classList.add(value);
            } else {
                element.style[property] = value;
            }
        });
    }
    
    /**
     * Génère un ID unique
     */
    function generateId() {
        return 'radio-group-' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Merge les options avec les valeurs par défaut
     */
    function mergeOptions(defaults, options) {
        const merged = { ...defaults };
        
        for (const key in options) {
            if (options[key] !== undefined) {
                if (typeof options[key] === 'object' && !Array.isArray(options[key]) && options[key] !== null) {
                    merged[key] = mergeOptions(defaults[key] || {}, options[key]);
                } else {
                    merged[key] = options[key];
                }
            }
        }
        
        return merged;
    }
    
    /**
     * Injecte les styles CSS nécessaires
     */
    function injectStyles() {
        if (document.getElementById('ui-radio-group-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ui-radio-group-styles';
        styles.textContent = `
            /* Styles de base */
            .ui-radio-group {
                position: relative;
            }
            
            .ui-radio-item {
                display: flex;
                align-items: center;
                cursor: pointer;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .ui-radio-input {
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .ui-radio-custom {
                position: relative;
                display: inline-block;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid #d1d5db;
                background: white;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .ui-radio-custom::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #3b82f6;
                transition: transform 0.3s ease;
            }
            
            .ui-radio-input:checked + .ui-radio-custom {
                border-color: #3b82f6;
            }
            
            .ui-radio-input:checked + .ui-radio-custom::after {
                transform: translate(-50%, -50%) scale(1);
            }
            
            .ui-radio-input:focus + .ui-radio-custom {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            }
            
            .ui-radio-content {
                margin-left: 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .ui-radio-label {
                font-size: 1rem;
                color: #1f2937;
            }
            
            .ui-radio-description {
                font-size: 0.875rem;
                color: #6b7280;
            }
            
            /* Disabled state */
            .ui-radio-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .ui-radio-item.disabled .ui-radio-custom,
            .ui-radio-item.disabled .ui-radio-label {
                cursor: not-allowed;
            }
            
            /* Layouts */
            .layout-vertical {
                display: flex;
                flex-direction: column;
            }
            
            .layout-horizontal {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
            }
            
            .layout-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
            }
            
            /* Styles spéciaux */
            .radio-glassmorphism .ui-radio-custom {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .radio-glassmorphism .ui-radio-input:checked + .ui-radio-custom {
                background: rgba(59, 130, 246, 0.2);
                border-color: rgba(59, 130, 246, 0.6);
            }
            
            /* Style pill */
            .radio-pill .ui-radio-item {
                padding: 8px 16px;
                border-radius: 9999px;
                background: transparent;
                transition: all 0.3s ease;
            }
            
            .radio-pill .ui-radio-input:checked ~ .ui-radio-content {
                color: #3b82f6;
            }
            
            .radio-pill .ui-radio-custom {
                display: none;
            }
            
            .radio-pill .ui-radio-input:checked + * + .ui-radio-content {
                background: #3b82f6;
                color: white;
            }
            
            /* Style card */
            .ui-radio-item-card {
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                transition: all 0.3s ease;
            }
            
            .ui-radio-item-card:hover {
                border-color: #d1d5db;
                background: #f9fafb;
            }
            
            .ui-radio-input:checked ~ .ui-radio-item-card {
                border-color: #3b82f6;
                background: rgba(59, 130, 246, 0.05);
            }
            
            /* Animations */
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            /* Ripple effect */
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.1);
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            /* Validation states */
            .validation-invalid .ui-radio-custom {
                border-color: #ef4444;
            }
            
            .validation-valid .ui-radio-custom {
                border-color: #10b981;
            }
            
            .ui-radio-validation-message {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 8px;
                font-size: 0.875rem;
            }
            
            .ui-radio-validation-message.invalid {
                color: #ef4444;
            }
            
            .ui-radio-validation-message.valid {
                color: #10b981;
            }
            
            /* Tooltip */
            .ui-radio-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%) translateY(-8px);
                background: #1f2937;
                color: white;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 0.875rem;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .ui-radio-tooltip.visible {
                opacity: 1;
                visibility: visible;
            }
            
            /* Search */
            .ui-radio-search {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
            }
            
            .ui-radio-search-input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 1rem;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .layout-responsive {
                    flex-direction: column;
                }
                
                .layout-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Crée un nouveau groupe radio
         * @param {Object} options - Options de configuration
         * @returns {HTMLElement} - L'élément groupe radio créé
         */
        create(options = {}) {
            // Injecter les styles si nécessaire
            injectStyles();
            
            // Options par défaut
            const defaults = {
                name: 'radio-group-' + Date.now(),
                style: 'flat',
                layout: 'vertical',
                size: 'md',
                animation: 'subtle',
                labelVariant: 'default',
                features: {},
                options: []
            };
            
            // Fusionner les options
            const finalOptions = mergeOptions(defaults, options);
            
            // Utiliser un preset si spécifié
            if (finalOptions.preset && CONFIG.presets[finalOptions.preset]) {
                finalOptions.options = CONFIG.presets[finalOptions.preset];
            }
            
            // Créer le conteneur principal
            const container = createContainer(finalOptions);
            
            // Ajouter le label du groupe si fourni
            if (finalOptions.label) {
                const groupLabel = createGroupLabel(finalOptions.label, finalOptions);
                container.appendChild(groupLabel);
            }
            
            // Ajouter la recherche si activée
            let searchInput;
            if (finalOptions.features?.search?.enabled) {
                const search = createSearchBox(finalOptions.features.search);
                container.appendChild(search.container);
                searchInput = search.input;
            }
            
            // Ajouter le compteur si activé
            if (finalOptions.features?.count?.enabled) {
                const counter = createCounter(
                    finalOptions.value ? 1 : 0,
                    finalOptions.options.length,
                    finalOptions.features.count.format || '{current}/{total}'
                );
                if (finalOptions.features.count.position === 'top') {
                    container.insertBefore(counter, container.firstChild);
                } else {
                    container.appendChild(counter);
                }
            }
            
            // Conteneur pour les options
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'ui-radio-options';
            
            // Ajouter les options ou les groupes
            if (finalOptions.features?.grouping?.enabled && finalOptions.features.grouping.groups) {
                finalOptions.features.grouping.groups.forEach(group => {
                    const groupElement = createOptionGroup(group, finalOptions.name, finalOptions);
                    optionsContainer.appendChild(groupElement);
                });
            } else {
                finalOptions.options.forEach(option => {
                    const radioItem = createRadioItem(option, finalOptions.name, finalOptions);
                    optionsContainer.appendChild(radioItem);
                });
            }
            
            container.appendChild(optionsContainer);
            
            // Ajouter la zone de validation
            if (finalOptions.features?.validation?.enabled || finalOptions.features?.required?.enabled) {
                const validationMessage = createValidationMessage();
                container.appendChild(validationMessage);
            }
            
            // Configurer les features
            
            // Navigation clavier
            if (finalOptions.features?.keyboard?.enabled) {
                setupKeyboardNavigation(container, finalOptions.features.keyboard);
            }
            
            // Recherche
            if (searchInput) {
                setupSearch(optionsContainer, searchInput, finalOptions.features.search);
            }
            
            // Logique conditionnelle
            if (finalOptions.features?.conditional?.enabled && finalOptions.features.conditional.rules) {
                applyConditionalLogic(container, finalOptions.features.conditional.rules);
            }
            
            // Persistance
            if (finalOptions.features?.persistence?.enabled) {
                setupPersistence(container, finalOptions.features.persistence);
            }
            
            // Analytics
            if (finalOptions.features?.analytics?.enabled) {
                setupAnalytics(container, finalOptions.features.analytics);
            }
            
            // Validation en temps réel
            if (finalOptions.features?.validation?.validateOnChange) {
                container.addEventListener('change', () => {
                    validate(container, finalOptions);
                });
            }
            
            // Événements personnalisés
            if (finalOptions.onChange) {
                container.addEventListener('change', (e) => {
                    if (e.target.type === 'radio') {
                        finalOptions.onChange(e.target.value, e.target);
                    }
                });
            }
            
            // API exposée sur l'élément
            container.radioGroup = {
                getValue: () => container.querySelector('input[type="radio"]:checked')?.value,
                setValue: (value) => {
                    const input = container.querySelector(`input[value="${value}"]`);
                    if (input) {
                        input.checked = true;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                },
                validate: () => validate(container, finalOptions),
                reset: () => {
                    const inputs = container.querySelectorAll('input[type="radio"]');
                    inputs.forEach(input => input.checked = false);
                    if (finalOptions.features?.validation?.enabled) {
                        updateValidationState(container, container.querySelector('.ui-radio-validation-message'), true, '', 'valid');
                    }
                },
                disable: () => {
                    container.querySelectorAll('input[type="radio"]').forEach(input => {
                        input.disabled = true;
                    });
                    container.classList.add('disabled');
                },
                enable: () => {
                    container.querySelectorAll('input[type="radio"]').forEach(input => {
                        input.disabled = false;
                    });
                    container.classList.remove('disabled');
                },
                getAnalytics: () => container.analytics
            };
            
            return container;
        },
        
        /**
         * Crée plusieurs groupes radio
         * @param {Array} groups - Tableau de configurations
         * @returns {Array} - Tableau des groupes créés
         */
        createMultiple(groups) {
            return groups.map(groupOptions => this.create(groupOptions));
        },
        
        /**
         * Obtient la configuration
         */
        getConfig() {
            return CONFIG;
        },
        
        /**
         * Ajoute un style personnalisé
         */
        addCustomStyle(name, styleConfig) {
            CONFIG.styles[name] = styleConfig;
        },
        
        /**
         * Ajoute un preset personnalisé
         */
        addCustomPreset(name, options) {
            CONFIG.presets[name] = options;
        },
        
        /**
         * Ajoute une règle de validation personnalisée
         */
        addValidator(name, validator) {
            CONFIG.validators = CONFIG.validators || {};
            CONFIG.validators[name] = validator;
        },
        
        /**
         * Version du composant
         */
        version: '1.0.0'
    };
})();

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RadioGroupComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Structure complexe des options
   Solution: Organisation hiérarchique claire avec options/features/styles
   
   [2024-01-15] - Gestion de l'accessibilité
   Solution: Attributs ARIA complets et navigation clavier native
   
   [2024-01-15] - Styles multiples simultanés
   Solution: Classes CSS modulaires et styles inline conditionnels
   
   [2024-01-15] - Performance avec beaucoup d'options
   Solution: Event delegation et optimisation des listeners
   
   NOTES POUR REPRISES FUTURES:
   - Les styles sont cumulatifs (style + layout + size + animation)
   - L'API exposée sur l'élément permet un contrôle total
   - Les features peuvent être activées indépendamment
   - La validation est extensible avec des règles personnalisées
   ======================================== */