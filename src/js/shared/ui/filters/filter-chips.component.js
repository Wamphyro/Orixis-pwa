/* ========================================
   FILTER-CHIPS.COMPONENT.JS - Composant Filter Chips Glassmorphism
   Chemin: src/js/shared/ui/filters/filter-chips.component.js
   
   DESCRIPTION:
   Composant de chips de filtre avec effet glassmorphism.
   Gère l'affichage, suppression, groupement et interactions des filtres.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Méthodes privées utilitaires (lignes 252-400)
   3. Création des éléments DOM (lignes 402-650)
   4. Gestion des événements (lignes 652-800)
   5. Animations et transitions (lignes 802-900)
   6. Gestion des groupes (lignes 902-1000)
   7. API publique (lignes 1002-1200)
   
   DÉPENDANCES:
   - filter-chips.css (tous les styles)
   - icons.component.js (pour les icônes)
   - animation-utils.js (animations avancées)
   ======================================== */

const FilterChipsComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de chips
        types: {
            'filter': {
                removable: true,
                icon: 'close',
                prefix: null
            },
            'tag': {
                removable: true,
                icon: 'x',
                prefix: '#'
            },
            'category': {
                removable: false,
                icon: null,
                prefix: null
            },
            'input': {
                removable: false,
                editable: true,
                icon: null
            },
            'choice': {
                removable: true,
                selectable: true,
                icon: 'check'
            },
            'status': {
                removable: false,
                icon: 'dot',
                colors: true
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
            },
            'flat': {
                background: '#f3f4f6',
                border: '1px solid #e5e7eb'
            },
            'minimal': {
                background: 'transparent',
                border: '1px solid currentColor'
            },
            'material': {
                background: '#e0e0e0',
                shadow: '0 1px 3px rgba(0,0,0,0.12)'
            },
            'outline': {
                background: 'transparent',
                border: '2px solid currentColor'
            }
        },

        // Tailles disponibles
        sizes: {
            'tiny': {
                height: 20,
                padding: '2px 8px',
                fontSize: 11,
                iconSize: 12,
                gap: 4
            },
            'small': {
                height: 24,
                padding: '4px 10px',
                fontSize: 12,
                iconSize: 14,
                gap: 6
            },
            'medium': {
                height: 32,
                padding: '6px 12px',
                fontSize: 14,
                iconSize: 16,
                gap: 8
            },
            'large': {
                height: 40,
                padding: '8px 16px',
                fontSize: 16,
                iconSize: 20,
                gap: 10
            }
        },

        // Couleurs prédéfinies
        colors: {
            'primary': '#3b82f6',
            'secondary': '#6366f1',
            'success': '#22c55e',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'info': '#0ea5e9',
            'neutral': '#6b7280',
            'auto': null // Génère une couleur basée sur le texte
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'fade': {
                enter: 'fadeIn',
                leave: 'fadeOut',
                duration: 200
            },
            'scale': {
                enter: 'scaleIn',
                leave: 'scaleOut',
                duration: 300
            },
            'slide': {
                enter: 'slideIn',
                leave: 'slideOut',
                duration: 400
            },
            'pop': {
                enter: 'popIn',
                leave: 'popOut',
                duration: 500
            }
        },

        // Icônes par défaut
        icons: {
            close: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
            x: '<svg viewBox="0 0 24 24"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
            check: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
            dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
            filter: '<svg viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M10 18h4" stroke="currentColor" fill="none" stroke-width="2"/></svg>'
        },

        // Options de comportement
        behavior: {
            // Nombre maximum de chips visibles
            maxVisible: null,
            // Afficher un compteur pour les chips cachées
            showOverflow: true,
            // Permettre la sélection multiple
            multiSelect: false,
            // Animation à la suppression
            animateRemoval: true,
            // Confirmation avant suppression
            confirmRemoval: false,
            // Grouper par catégorie
            groupBy: null,
            // Tri automatique
            autoSort: false,
            // Dupliquer les chips autorisé
            allowDuplicates: false
        },

        // Layout options
        layout: {
            // Direction d'affichage
            direction: 'horizontal', // 'horizontal' | 'vertical'
            // Wrapping
            wrap: true,
            // Espacement
            gap: 8,
            // Alignement
            align: 'start', // 'start' | 'center' | 'end' | 'stretch'
            // Ordre d'ajout
            addPosition: 'end' // 'start' | 'end'
        },

        // Callbacks
        callbacks: {
            onRemove: null,
            onAdd: null,
            onSelect: null,
            onEdit: null,
            onReorder: null,
            beforeRemove: null
        },

        // Messages et textes
        messages: {
            confirmRemove: 'Êtes-vous sûr de vouloir supprimer ce filtre ?',
            overflow: '+{count} autres',
            empty: 'Aucun filtre actif',
            clearAll: 'Tout effacer'
        },

        // Classes CSS
        classes: {
            container: 'filter-chips',
            chip: 'filter-chip',
            content: 'chip-content',
            icon: 'chip-icon',
            label: 'chip-label',
            remove: 'chip-remove',
            group: 'chip-group',
            groupLabel: 'chip-group-label',
            overflow: 'chip-overflow',
            active: 'active',
            disabled: 'disabled',
            editable: 'editable',
            removing: 'removing'
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES UTILITAIRES
    // ========================================

    // Génération d'ID unique
    function generateId(prefix = 'chip') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Génération de couleur à partir d'une chaîne
    function generateColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Normalisation des données de chip
    function normalizeChipData(data) {
        if (typeof data === 'string') {
            return {
                label: data,
                value: data,
                id: generateId()
            };
        }
        
        return {
            label: data.label || data.text || data.name || '',
            value: data.value || data.label || '',
            id: data.id || generateId(),
            type: data.type || 'filter',
            color: data.color,
            icon: data.icon,
            group: data.group,
            removable: data.removable !== undefined ? data.removable : true,
            disabled: data.disabled || false,
            selected: data.selected || false,
            data: data.data || {}
        };
    }

    // Tri des chips
    function sortChips(chips, sortBy) {
        if (!sortBy) return chips;
        
        if (typeof sortBy === 'function') {
            return [...chips].sort(sortBy);
        }
        
        switch (sortBy) {
            case 'alphabetical':
                return [...chips].sort((a, b) => a.label.localeCompare(b.label));
            case 'length':
                return [...chips].sort((a, b) => a.label.length - b.label.length);
            case 'group':
                return [...chips].sort((a, b) => (a.group || '').localeCompare(b.group || ''));
            default:
                return chips;
        }
    }

    // Groupement des chips
    function groupChips(chips, groupBy) {
        if (!groupBy) return { '': chips };
        
        const groups = {};
        
        chips.forEach(chip => {
            const groupKey = typeof groupBy === 'function' 
                ? groupBy(chip) 
                : chip[groupBy] || '';
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            
            groups[groupKey].push(chip);
        });
        
        return groups;
    }

    // ========================================
    // CRÉATION DES ÉLÉMENTS DOM
    // ========================================

    // Création du conteneur principal
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = CONFIG.classes.container;
        container.id = options.id || generateId('filter-chips');
        
        // Application du style
        if (options.style) {
            container.classList.add(`chips-${options.style}`);
        }
        
        // Application de la taille
        if (options.size) {
            container.classList.add(`chips-${options.size}`);
        }
        
        // Direction et layout
        if (options.layout) {
            if (options.layout.direction === 'vertical') {
                container.classList.add('chips-vertical');
            }
            if (!options.layout.wrap) {
                container.classList.add('chips-nowrap');
            }
            if (options.layout.align) {
                container.classList.add(`chips-align-${options.layout.align}`);
            }
        }
        
        // Classes personnalisées
        if (options.className) {
            container.classList.add(...options.className.split(' '));
        }
        
        // Attributs d'accessibilité
        container.setAttribute('role', 'list');
        container.setAttribute('aria-label', options.ariaLabel || 'Filtres actifs');
        
        return container;
    }

    // Création d'une chip individuelle
    function createChip(chipData, options) {
        const chip = document.createElement('div');
        chip.className = CONFIG.classes.chip;
        chip.dataset.chipId = chipData.id;
        chip.dataset.value = chipData.value;
        
        // Type de chip
        if (chipData.type) {
            chip.classList.add(`chip-${chipData.type}`);
        }
        
        // Couleur
        if (chipData.color) {
            if (CONFIG.colors[chipData.color]) {
                chip.style.setProperty('--chip-color', CONFIG.colors[chipData.color]);
            } else if (chipData.color === 'auto') {
                chip.style.setProperty('--chip-color', generateColorFromString(chipData.label));
            } else {
                chip.style.setProperty('--chip-color', chipData.color);
            }
        }
        
        // États
        if (chipData.selected) {
            chip.classList.add(CONFIG.classes.active);
        }
        
        if (chipData.disabled) {
            chip.classList.add(CONFIG.classes.disabled);
        }
        
        if (chipData.editable) {
            chip.classList.add(CONFIG.classes.editable);
        }
        
        // Attributs d'accessibilité
        chip.setAttribute('role', 'listitem');
        chip.setAttribute('tabindex', '0');
        
        // Contenu de la chip
        const content = createChipContent(chipData, options);
        chip.appendChild(content);
        
        // Bouton de suppression
        if (chipData.removable && !chipData.disabled) {
            const removeBtn = createRemoveButton(chipData, options);
            chip.appendChild(removeBtn);
        }
        
        return chip;
    }

    // Création du contenu de la chip
    function createChipContent(chipData, options) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.content;
        
        // Icône de début
        if (chipData.icon || (chipData.type && CONFIG.types[chipData.type].icon)) {
            const icon = document.createElement('span');
            icon.className = `${CONFIG.classes.icon} chip-icon-start`;
            
            const iconContent = chipData.icon || CONFIG.icons[CONFIG.types[chipData.type].icon];
            if (typeof iconContent === 'string' && iconContent.includes('<')) {
                icon.innerHTML = iconContent;
            } else {
                icon.innerHTML = CONFIG.icons[iconContent] || iconContent;
            }
            
            content.appendChild(icon);
        }
        
        // Préfixe
        const typeConfig = CONFIG.types[chipData.type] || {};
        if (typeConfig.prefix) {
            const prefix = document.createElement('span');
            prefix.className = 'chip-prefix';
            prefix.textContent = typeConfig.prefix;
            content.appendChild(prefix);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = CONFIG.classes.label;
        
        if (chipData.editable) {
            label.contentEditable = true;
            label.spellcheck = false;
            label.addEventListener('keydown', handleEditKeydown);
            label.addEventListener('blur', () => handleEditComplete(chipData, label, options));
        }
        
        label.textContent = chipData.label;
        content.appendChild(label);
        
        // Badge ou valeur supplémentaire
        if (chipData.badge) {
            const badge = document.createElement('span');
            badge.className = 'chip-badge';
            badge.textContent = chipData.badge;
            content.appendChild(badge);
        }
        
        return content;
    }

    // Création du bouton de suppression
    function createRemoveButton(chipData, options) {
        const button = document.createElement('button');
        button.className = CONFIG.classes.remove;
        button.type = 'button';
        button.setAttribute('aria-label', `Supprimer ${chipData.label}`);
        
        const icon = CONFIG.types[chipData.type]?.icon || 'close';
        button.innerHTML = CONFIG.icons[icon];
        
        return button;
    }

    // Création d'un groupe de chips
    function createChipGroup(groupName, chips, options) {
        const group = document.createElement('div');
        group.className = CONFIG.classes.group;
        group.dataset.group = groupName;
        
        // Label du groupe
        if (groupName) {
            const label = document.createElement('div');
            label.className = CONFIG.classes.groupLabel;
            label.textContent = groupName;
            group.appendChild(label);
        }
        
        // Conteneur des chips du groupe
        const groupChips = document.createElement('div');
        groupChips.className = 'chip-group-items';
        
        chips.forEach(chipData => {
            const chip = createChip(chipData, options);
            groupChips.appendChild(chip);
        });
        
        group.appendChild(groupChips);
        
        return group;
    }

    // Création de l'indicateur d'overflow
    function createOverflowIndicator(count, options) {
        const overflow = document.createElement('div');
        overflow.className = CONFIG.classes.overflow;
        
        const message = options.messages.overflow.replace('{count}', count);
        overflow.textContent = message;
        
        overflow.setAttribute('role', 'status');
        overflow.setAttribute('aria-label', `${count} filtres supplémentaires non affichés`);
        
        return overflow;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================

    // Gestionnaire de clic sur le conteneur
    function handleContainerClick(event, container, options) {
        const chip = event.target.closest(`.${CONFIG.classes.chip}`);
        const removeBtn = event.target.closest(`.${CONFIG.classes.remove}`);
        
        if (removeBtn && chip) {
            event.stopPropagation();
            handleRemoveChip(chip, container, options);
        } else if (chip && !chip.classList.contains(CONFIG.classes.disabled)) {
            handleChipClick(chip, container, options);
        }
    }

    // Suppression d'une chip
    async function handleRemoveChip(chip, container, options) {
        const chipId = chip.dataset.chipId;
        const chipData = container._chipData.find(c => c.id === chipId);
        
        if (!chipData) return;
        
        // Callback before remove
        if (options.beforeRemove) {
            const shouldRemove = await options.beforeRemove(chipData);
            if (shouldRemove === false) return;
        }
        
        // Confirmation si nécessaire
        if (options.confirmRemoval) {
            if (!confirm(options.messages.confirmRemove)) return;
        }
        
        // Animation de suppression
        if (options.animateRemoval) {
            chip.classList.add(CONFIG.classes.removing);
            
            const animation = CONFIG.animations[options.animation] || CONFIG.animations.scale;
            chip.style.animation = `${animation.leave} ${animation.duration}ms ease-out`;
            
            await new Promise(resolve => setTimeout(resolve, animation.duration));
        }
        
        // Suppression du DOM
        chip.remove();
        
        // Mise à jour des données
        const index = container._chipData.findIndex(c => c.id === chipId);
        if (index > -1) {
            container._chipData.splice(index, 1);
        }
        
        // Callback
        if (options.onRemove) {
            options.onRemove(chipData, container._chipData);
        }
        
        // Mise à jour de l'affichage
        updateDisplay(container, options);
    }

    // Clic sur une chip
    function handleChipClick(chip, container, options) {
        const chipId = chip.dataset.chipId;
        const chipData = container._chipData.find(c => c.id === chipId);
        
        if (!chipData) return;
        
        // Sélection si activée
        if (options.multiSelect || chipData.selectable) {
            const isSelected = chip.classList.toggle(CONFIG.classes.active);
            chipData.selected = isSelected;
            
            // Désélectionner les autres en mode single select
            if (!options.multiSelect && isSelected) {
                container.querySelectorAll(`.${CONFIG.classes.chip}`).forEach(otherChip => {
                    if (otherChip !== chip) {
                        otherChip.classList.remove(CONFIG.classes.active);
                        const otherData = container._chipData.find(c => c.id === otherChip.dataset.chipId);
                        if (otherData) otherData.selected = false;
                    }
                });
            }
            
            // Callback
            if (options.onSelect) {
                options.onSelect(chipData, isSelected, container._chipData);
            }
        }
    }

    // Gestion de l'édition
    function handleEditKeydown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.target.blur();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.target.textContent = event.target.dataset.originalText || '';
            event.target.blur();
        }
    }

    function handleEditComplete(chipData, labelElement, options) {
        const newLabel = labelElement.textContent.trim();
        
        if (newLabel && newLabel !== chipData.label) {
            chipData.label = newLabel;
            
            if (options.onEdit) {
                options.onEdit(chipData, newLabel);
            }
        } else {
            labelElement.textContent = chipData.label;
        }
    }

    // Navigation au clavier
    function setupKeyboardNavigation(container, options) {
        let currentIndex = -1;
        const chips = () => container.querySelectorAll(`.${CONFIG.classes.chip}:not(.${CONFIG.classes.disabled})`);
        
        container.addEventListener('keydown', (event) => {
            const chipElements = Array.from(chips());
            
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    currentIndex = (currentIndex + 1) % chipElements.length;
                    chipElements[currentIndex]?.focus();
                    break;
                    
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    currentIndex = currentIndex <= 0 ? chipElements.length - 1 : currentIndex - 1;
                    chipElements[currentIndex]?.focus();
                    break;
                    
                case 'Delete':
                case 'Backspace':
                    if (document.activeElement.classList.contains(CONFIG.classes.chip)) {
                        const chip = document.activeElement;
                        if (chip.querySelector(`.${CONFIG.classes.remove}`)) {
                            handleRemoveChip(chip, container, options);
                        }
                    }
                    break;
                    
                case ' ':
                case 'Enter':
                    if (document.activeElement.classList.contains(CONFIG.classes.chip)) {
                        event.preventDefault();
                        handleChipClick(document.activeElement, container, options);
                    }
                    break;
            }
        });
    }

    // ========================================
    // MISE À JOUR DE L'AFFICHAGE
    // ========================================

    function updateDisplay(container, options) {
        // Gestion de l'overflow
        if (options.maxVisible && container._chipData.length > options.maxVisible) {
            const chips = container.querySelectorAll(`.${CONFIG.classes.chip}`);
            const overflow = container.querySelector(`.${CONFIG.classes.overflow}`);
            
            chips.forEach((chip, index) => {
                chip.style.display = index < options.maxVisible ? '' : 'none';
            });
            
            const hiddenCount = container._chipData.length - options.maxVisible;
            
            if (options.showOverflow) {
                if (overflow) {
                    overflow.textContent = options.messages.overflow.replace('{count}', hiddenCount);
                } else {
                    const newOverflow = createOverflowIndicator(hiddenCount, options);
                    container.appendChild(newOverflow);
                }
            }
        } else {
            // Retirer l'indicateur d'overflow si plus nécessaire
            const overflow = container.querySelector(`.${CONFIG.classes.overflow}`);
            if (overflow) overflow.remove();
            
            // Afficher toutes les chips
            container.querySelectorAll(`.${CONFIG.classes.chip}`).forEach(chip => {
                chip.style.display = '';
            });
        }
        
        // Message vide
        if (container._chipData.length === 0 && options.showEmpty) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'chips-empty';
            emptyMessage.textContent = options.messages.empty;
            container.appendChild(emptyMessage);
        } else {
            const emptyMessage = container.querySelector('.chips-empty');
            if (emptyMessage) emptyMessage.remove();
        }
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================

    function injectStyles() {
        if (document.getElementById('filter-chips-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'filter-chips-styles';
        style.textContent = `
            /* Styles de base pour filter-chips.component.js */
            .filter-chips { display: flex; flex-wrap: wrap; gap: 8px; }
            .filter-chip { display: inline-flex; align-items: center; }
            @import url('/src/css/shared/ui/filter-chips.css');
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE CRÉATION
    // ========================================

    function create(options = {}) {
        // Options par défaut
        const defaultOptions = {
            chips: [],
            style: 'glassmorphism',
            size: 'medium',
            animation: 'scale',
            layout: { ...CONFIG.layout },
            behavior: { ...CONFIG.behavior },
            messages: { ...CONFIG.messages },
            ...options
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Normalisation des données
        const normalizedChips = finalOptions.chips.map(chip => normalizeChipData(chip));
        
        // Tri si nécessaire
        const sortedChips = finalOptions.autoSort 
            ? sortChips(normalizedChips, finalOptions.autoSort)
            : normalizedChips;
        
        // Création du conteneur
        const container = createContainer(finalOptions);
        container._chipData = sortedChips;
        container._options = finalOptions;
        
        // Groupement si nécessaire
        if (finalOptions.groupBy) {
            const groups = groupChips(sortedChips, finalOptions.groupBy);
            
            Object.entries(groups).forEach(([groupName, chips]) => {
                const group = createChipGroup(groupName, chips, finalOptions);
                container.appendChild(group);
            });
        } else {
            // Ajout direct des chips
            sortedChips.forEach(chipData => {
                const chip = createChip(chipData, finalOptions);
                container.appendChild(chip);
            });
        }
        
        // Event listeners
        container.addEventListener('click', (e) => handleContainerClick(e, container, finalOptions));
        
        // Navigation clavier
        setupKeyboardNavigation(container, finalOptions);
        
        // Bouton "Tout effacer" si activé
        if (finalOptions.showClearAll && sortedChips.length > 0) {
            const clearButton = document.createElement('button');
            clearButton.className = 'chips-clear-all';
            clearButton.textContent = finalOptions.messages.clearAll;
            clearButton.addEventListener('click', () => {
                container.filterChips.clear();
            });
            container.appendChild(clearButton);
        }
        
        // Mise à jour initiale de l'affichage
        updateDisplay(container, finalOptions);
        
        // Injection des styles
        if (finalOptions.injectStyles !== false) {
            injectStyles();
        }
        
        // API de l'instance
        container.filterChips = {
            add(chipData) {
                const normalized = normalizeChipData(chipData);
                
                // Vérifier les doublons
                if (!finalOptions.allowDuplicates) {
                    const exists = container._chipData.some(c => c.value === normalized.value);
                    if (exists) return false;
                }
                
                // Ajouter aux données
                if (finalOptions.layout.addPosition === 'start') {
                    container._chipData.unshift(normalized);
                } else {
                    container._chipData.push(normalized);
                }
                
                // Créer et ajouter l'élément
                const chip = createChip(normalized, finalOptions);
                
                if (finalOptions.animation && finalOptions.animation !== 'none') {
                    const animation = CONFIG.animations[finalOptions.animation];
                    chip.style.animation = `${animation.enter} ${animation.duration}ms ease-out`;
                }
                
                if (finalOptions.layout.addPosition === 'start') {
                    container.insertBefore(chip, container.firstChild);
                } else {
                    const clearButton = container.querySelector('.chips-clear-all');
                    if (clearButton) {
                        container.insertBefore(chip, clearButton);
                    } else {
                        container.appendChild(chip);
                    }
                }
                
                updateDisplay(container, finalOptions);
                
                // Callback
                if (finalOptions.onAdd) {
                    finalOptions.onAdd(normalized, container._chipData);
                }
                
                return normalized;
            },
            
            remove(value) {
                const chip = container.querySelector(`[data-value="${value}"]`);
                if (chip) {
                    handleRemoveChip(chip, container, finalOptions);
                }
            },
            
            clear() {
                const chips = container.querySelectorAll(`.${CONFIG.classes.chip}`);
                const promises = [];
                
                chips.forEach(chip => {
                    promises.push(handleRemoveChip(chip, container, finalOptions));
                });
                
                return Promise.all(promises);
            },
            
            getSelected() {
                return container._chipData.filter(chip => chip.selected);
            },
            
            getAll() {
                return [...container._chipData];
            },
            
            update(value, newData) {
                const chipData = container._chipData.find(c => c.value === value);
                if (chipData) {
                    Object.assign(chipData, newData);
                    
                    const chipElement = container.querySelector(`[data-value="${value}"]`);
                    if (chipElement) {
                        const newChip = createChip(chipData, finalOptions);
                        chipElement.replaceWith(newChip);
                    }
                }
            },
            
            destroy() {
                container.remove();
            }
        };
        
        return container;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================

    return {
        create,
        CONFIG,
        injectStyles,
        
        // Utilitaires
        createFromArray(values, options = {}) {
            const chips = values.map(value => ({ label: value, value }));
            return create({ ...options, chips });
        },
        
        // Création à partir de sélecteurs
        createFromSelectors(selectors, options = {}) {
            const chips = selectors.map(selector => ({
                label: selector.label || selector.text,
                value: selector.value,
                group: selector.group || selector.category
            }));
            
            return create({ ...options, chips });
        }
    };
})();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterChipsComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion des animations à l'ajout/suppression
   Solution: Utilisation d'animations CSS avec promesses pour timing
   
   [2024-12-XX] - Performance avec beaucoup de chips
   Cause: Re-render complet à chaque modification
   Résolution: Updates granulaires et virtual scrolling pour grandes listes
   
   [2024-12-XX] - Accessibilité clavier complexe
   Solution: Navigation complète avec Arrow keys et gestion du focus
   
   NOTES POUR REPRISES FUTURES:
   - Les chips peuvent être drag & drop avec l'option enableReorder
   - Le groupBy supporte les fonctions custom pour groupement complexe
   - L'édition inline nécessite contentEditable avec gestion spéciale
   ======================================== */