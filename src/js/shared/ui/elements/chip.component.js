/* ========================================
   CHIP.COMPONENT.JS - Composant Chip complet
   Chemin: src/js/shared/ui/elements/chip.component.js
   
   DESCRIPTION:
   Système de chips/tags ultra-complet avec tous les styles, 
   tailles, types et fonctionnalités possibles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Méthodes de création (lignes 202-400)
   3. Gestion des événements (lignes 402-500)
   4. Méthodes utilitaires (lignes 502-600)
   5. API publique (lignes 602-650)
   
   DÉPENDANCES:
   - chip.css (styles associés)
   - icons.component.js (pour les icônes)
   - animation-utils.js (pour les animations)
   ======================================== */

const ChipComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Tous les styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.1,
                border: true,
                glow: true,
                description: 'Effet verre dépoli moderne'
            },
            'neumorphism': {
                class: 'neumorphism',
                shadow: 'soft',
                description: 'Style relief doux'
            },
            'flat': {
                class: 'flat',
                shadow: 'none',
                description: 'Style plat simple'
            },
            'material': {
                class: 'material',
                ripple: true,
                elevation: 2,
                description: 'Material Design'
            },
            'minimal': {
                class: 'minimal',
                border: 'thin',
                description: 'Style minimaliste'
            },
            'gradient': {
                class: 'gradient',
                gradientAngle: 135,
                description: 'Fond dégradé'
            },
            'outline': {
                class: 'outline',
                filled: false,
                description: 'Contour uniquement'
            }
        },

        // Toutes les tailles
        sizes: {
            'xs': {
                class: 'xs',
                height: 20,
                fontSize: 11,
                padding: '0 6px'
            },
            'small': {
                class: 'small',
                height: 24,
                fontSize: 12,
                padding: '0 8px'
            },
            'medium': {
                class: 'medium',
                height: 32,
                fontSize: 14,
                padding: '0 12px'
            },
            'large': {
                class: 'large',
                height: 40,
                fontSize: 16,
                padding: '0 16px'
            },
            'xl': {
                class: 'xl',
                height: 48,
                fontSize: 18,
                padding: '0 20px'
            }
        },

        // Tous les types/couleurs
        types: {
            'default': { color: '#6b7280', icon: null },
            'primary': { color: '#3b82f6', icon: null },
            'success': { color: '#22c55e', icon: 'check' },
            'warning': { color: '#f59e0b', icon: 'alert-triangle' },
            'error': { color: '#ef4444', icon: 'x-circle' },
            'info': { color: '#0ea5e9', icon: 'info' },
            'purple': { color: '#8b5cf6', icon: null },
            'pink': { color: '#ec4899', icon: null },
            'indigo': { color: '#6366f1', icon: null }
        },

        // Toutes les formes
        shapes: {
            'rounded': { borderRadius: '16px' },
            'pill': { borderRadius: '999px' },
            'square': { borderRadius: '4px' },
            'circle': { borderRadius: '50%', aspectRatio: '1/1' }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                description: 'Aucune animation'
            },
            'subtle': {
                hover: true,
                transition: '0.2s ease',
                scale: 1.02,
                description: 'Animations subtiles'
            },
            'smooth': {
                hover: true,
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                scale: 1.05,
                glow: true,
                description: 'Transitions fluides'
            },
            'rich': {
                hover: true,
                transition: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                scale: 1.08,
                glow: true,
                bounce: true,
                ripple: true,
                particles: true,
                description: 'Animations riches'
            }
        },

        // Toutes les fonctionnalités
        features: {
            'closable': {
                showCloseButton: true,
                closeAnimation: 'fade-scale'
            },
            'clickable': {
                cursor: 'pointer',
                hoverEffect: true
            },
            'selectable': {
                multiSelect: false,
                toggleable: true
            },
            'draggable': {
                reorderable: true,
                ghostEffect: true
            },
            'editable': {
                doubleClickEdit: true,
                maxLength: 50
            },
            'avatar': {
                position: 'left',
                size: 'auto'
            },
            'icon': {
                position: 'left',
                size: 16
            },
            'badge': {
                position: 'right',
                style: 'dot'
            },
            'loading': {
                spinner: true,
                shimmer: true
            },
            'truncate': {
                maxWidth: 200,
                showTooltip: true
            }
        },

        // États
        states: {
            'default': {},
            'hover': { transform: 'scale(1.05)', brightness: 1.1 },
            'active': { transform: 'scale(0.95)' },
            'selected': { outline: '2px solid', outlineOffset: '2px' },
            'disabled': { opacity: 0.5, cursor: 'not-allowed' },
            'loading': { cursor: 'wait' },
            'error': { shake: true }
        },

        // Classes CSS
        classes: {
            container: 'chip-container',
            chip: 'chip',
            content: 'chip-content',
            icon: 'chip-icon',
            avatar: 'chip-avatar',
            label: 'chip-label',
            close: 'chip-close',
            badge: 'chip-badge',
            group: 'chip-group'
        }
    };

    // ========================================
    // GESTION DES STYLES
    // ========================================
    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected || document.querySelector('#chip-styles')) return;

        const link = document.createElement('link');
        link.id = 'chip-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/chip.css';
        document.head.appendChild(link);
        stylesInjected = true;
    }

    // ========================================
    // CRÉATION DU COMPOSANT
    // ========================================
    function create(options = {}) {
        // Options par défaut avec toutes les possibilités
        const settings = {
            label: options.label || 'Chip',
            style: options.style || 'glassmorphism',
            size: options.size || 'medium',
            type: options.type || 'default',
            shape: options.shape || 'rounded',
            animation: options.animation || 'smooth',
            features: { ...options.features },
            icon: options.icon,
            avatar: options.avatar,
            badge: options.badge,
            closable: options.closable || false,
            clickable: options.clickable || false,
            selectable: options.selectable || false,
            selected: options.selected || false,
            disabled: options.disabled || false,
            draggable: options.draggable || false,
            editable: options.editable || false,
            truncate: options.truncate || false,
            maxWidth: options.maxWidth,
            value: options.value || options.label,
            data: options.data || {},
            className: options.className || '',
            id: options.id || `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...options
        };

        // Injection des styles
        injectStyles();

        // Création de l'élément
        const chip = document.createElement('div');
        chip.className = buildClassName(settings);
        chip.id = settings.id;
        chip.setAttribute('role', 'button');
        chip.setAttribute('tabindex', settings.disabled ? '-1' : '0');

        // Attributs ARIA
        if (settings.selectable) {
            chip.setAttribute('aria-pressed', settings.selected);
        }
        if (settings.disabled) {
            chip.setAttribute('aria-disabled', 'true');
        }

        // Données personnalisées
        chip.dataset.value = settings.value;
        Object.entries(settings.data).forEach(([key, value]) => {
            chip.dataset[key] = value;
        });

        // Construction du contenu
        chip.innerHTML = buildContent(settings);

        // Application des styles inline si nécessaire
        if (settings.maxWidth) {
            chip.style.maxWidth = `${settings.maxWidth}px`;
        }

        // Gestion des événements
        attachEventHandlers(chip, settings);

        // Méthodes attachées à l'élément
        chip.chipComponent = {
            getValue: () => chip.dataset.value,
            setValue: (value) => {
                chip.dataset.value = value;
            },
            getLabel: () => chip.querySelector('.chip-label')?.textContent,
            setLabel: (label) => {
                const labelEl = chip.querySelector('.chip-label');
                if (labelEl) labelEl.textContent = label;
            },
            isSelected: () => chip.classList.contains('selected'),
            select: () => selectChip(chip, true),
            deselect: () => selectChip(chip, false),
            toggle: () => toggleChip(chip),
            enable: () => enableChip(chip),
            disable: () => disableChip(chip),
            remove: () => removeChip(chip, settings),
            update: (newOptions) => updateChip(chip, newOptions),
            addBadge: (content) => addBadge(chip, content),
            removeBadge: () => removeBadge(chip),
            startLoading: () => setLoadingState(chip, true),
            stopLoading: () => setLoadingState(chip, false),
            shake: () => shakeChip(chip),
            highlight: () => highlightChip(chip)
        };

        return chip;
    }

    // ========================================
    // CONSTRUCTION DU CONTENU
    // ========================================
    function buildClassName(settings) {
        const classes = [CONFIG.classes.chip];

        // Style
        if (CONFIG.styles[settings.style]) {
            classes.push(CONFIG.styles[settings.style].class);
        }

        // Taille
        if (CONFIG.sizes[settings.size]) {
            classes.push(CONFIG.sizes[settings.size].class);
        }

        // Type
        if (CONFIG.types[settings.type]) {
            classes.push(settings.type);
        }

        // Forme
        if (CONFIG.shapes[settings.shape]) {
            classes.push(settings.shape);
        }

        // Animation
        if (settings.animation !== 'none') {
            classes.push(`animate-${settings.animation}`);
        }

        // États
        if (settings.selected) classes.push('selected');
        if (settings.disabled) classes.push('disabled');
        if (settings.clickable) classes.push('clickable');
        if (settings.closable) classes.push('closable');

        // Classes personnalisées
        if (settings.className) {
            classes.push(...settings.className.split(' '));
        }

        return classes.join(' ');
    }

    function buildContent(settings) {
        const parts = [];

        // Avatar
        if (settings.avatar) {
            parts.push(buildAvatar(settings.avatar));
        }

        // Icône
        if (settings.icon || (CONFIG.types[settings.type]?.icon && !settings.avatar)) {
            parts.push(buildIcon(settings.icon || CONFIG.types[settings.type].icon));
        }

        // Label
        parts.push(`<span class="${CONFIG.classes.label}">${escapeHtml(settings.label)}</span>`);

        // Badge
        if (settings.badge) {
            parts.push(buildBadge(settings.badge));
        }

        // Bouton de fermeture
        if (settings.closable) {
            parts.push(buildCloseButton());
        }

        return parts.join('');
    }

    function buildAvatar(avatar) {
        if (typeof avatar === 'string') {
            // URL de l'image
            return `<img class="${CONFIG.classes.avatar}" src="${avatar}" alt="Avatar">`;
        } else if (avatar.text) {
            // Initiales
            return `<div class="${CONFIG.classes.avatar} avatar-text" style="background-color: ${avatar.color || '#6b7280'}">${avatar.text}</div>`;
        }
        return '';
    }

    function buildIcon(icon) {
        return `<span class="${CONFIG.classes.icon}" data-icon="${icon}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${getIconPath(icon)}
            </svg>
        </span>`;
    }

    function buildBadge(badge) {
        if (typeof badge === 'number') {
            return `<span class="${CONFIG.classes.badge}">${badge}</span>`;
        } else if (badge === true) {
            return `<span class="${CONFIG.classes.badge} badge-dot"></span>`;
        } else if (typeof badge === 'string') {
            return `<span class="${CONFIG.classes.badge}">${escapeHtml(badge)}</span>`;
        }
        return '';
    }

    function buildCloseButton() {
        return `<button class="${CONFIG.classes.close}" aria-label="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>`;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function attachEventHandlers(chip, settings) {
        // Click sur le chip
        if (settings.clickable || settings.selectable) {
            chip.addEventListener('click', (e) => {
                if (e.target.closest(`.${CONFIG.classes.close}`)) return;
                if (settings.disabled) return;

                if (settings.selectable) {
                    toggleChip(chip);
                }

                if (settings.onClick) {
                    settings.onClick(chip.chipComponent);
                }
            });
        }

        // Bouton de fermeture
        if (settings.closable) {
            const closeBtn = chip.querySelector(`.${CONFIG.classes.close}`);
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (settings.onClose) {
                        const result = settings.onClose(chip.chipComponent);
                        if (result === false) return;
                    }
                    removeChip(chip, settings);
                });
            }
        }

        // Double-clic pour édition
        if (settings.editable) {
            chip.addEventListener('dblclick', () => {
                if (settings.disabled) return;
                enableEditMode(chip, settings);
            });
        }

        // Keyboard navigation
        chip.addEventListener('keydown', (e) => {
            if (settings.disabled) return;

            switch (e.key) {
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    chip.click();
                    break;
                case 'Delete':
                case 'Backspace':
                    if (settings.closable) {
                        e.preventDefault();
                        removeChip(chip, settings);
                    }
                    break;
            }
        });

        // Drag & Drop
        if (settings.draggable) {
            enableDragAndDrop(chip, settings);
        }
    }

    // ========================================
    // MÉTHODES DE MANIPULATION
    // ========================================
    function selectChip(chip, selected) {
        chip.classList.toggle('selected', selected);
        chip.setAttribute('aria-pressed', selected);
        
        const event = new CustomEvent('chipselect', {
            detail: { chip: chip.chipComponent, selected }
        });
        chip.dispatchEvent(event);
    }

    function toggleChip(chip) {
        const isSelected = chip.classList.contains('selected');
        selectChip(chip, !isSelected);
    }

    function enableChip(chip) {
        chip.classList.remove('disabled');
        chip.removeAttribute('aria-disabled');
        chip.setAttribute('tabindex', '0');
    }

    function disableChip(chip) {
        chip.classList.add('disabled');
        chip.setAttribute('aria-disabled', 'true');
        chip.setAttribute('tabindex', '-1');
    }

    function removeChip(chip, settings) {
        // Animation de sortie
        if (settings.animation !== 'none') {
            chip.style.animation = 'chipRemove 0.3s ease-out';
            chip.addEventListener('animationend', () => {
                chip.remove();
            }, { once: true });
        } else {
            chip.remove();
        }

        const event = new CustomEvent('chipremove', {
            detail: { chip: chip.chipComponent }
        });
        document.dispatchEvent(event);
    }

    function updateChip(chip, newOptions) {
        // Mise à jour des classes
        if (newOptions.className !== undefined) {
            chip.className = buildClassName({ ...chip.chipComponent.settings, ...newOptions });
        }

        // Mise à jour du contenu
        if (newOptions.label || newOptions.icon || newOptions.avatar || newOptions.badge !== undefined) {
            chip.innerHTML = buildContent({ ...chip.chipComponent.settings, ...newOptions });
        }

        // Mise à jour des données
        if (newOptions.data) {
            Object.entries(newOptions.data).forEach(([key, value]) => {
                chip.dataset[key] = value;
            });
        }
    }

    function setLoadingState(chip, loading) {
        chip.classList.toggle('loading', loading);
        
        if (loading) {
            const label = chip.querySelector(`.${CONFIG.classes.label}`);
            if (label) {
                label.innerHTML = `<span class="chip-spinner"></span> ${label.textContent}`;
            }
        } else {
            const spinner = chip.querySelector('.chip-spinner');
            if (spinner) spinner.remove();
        }
    }

    function shakeChip(chip) {
        chip.style.animation = 'chipShake 0.5s ease-in-out';
        chip.addEventListener('animationend', () => {
            chip.style.animation = '';
        }, { once: true });
    }

    function highlightChip(chip) {
        chip.style.animation = 'chipHighlight 1s ease-in-out';
        chip.addEventListener('animationend', () => {
            chip.style.animation = '';
        }, { once: true });
    }

    // ========================================
    // FONCTIONNALITÉS AVANCÉES
    // ========================================
    function enableEditMode(chip, settings) {
        const label = chip.querySelector(`.${CONFIG.classes.label}`);
        if (!label) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chip-edit-input';
        input.value = label.textContent;
        input.maxLength = settings.maxLength || 50;

        label.replaceWith(input);
        input.focus();
        input.select();

        const saveEdit = () => {
            const newValue = input.value.trim();
            if (newValue) {
                label.textContent = newValue;
                chip.dataset.value = newValue;
                
                if (settings.onEdit) {
                    settings.onEdit(chip.chipComponent, newValue);
                }
            }
            input.replaceWith(label);
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                input.replaceWith(label);
            }
        });
    }

    function enableDragAndDrop(chip, settings) {
        chip.draggable = true;

        chip.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', chip.id);
            chip.classList.add('dragging');
        });

        chip.addEventListener('dragend', () => {
            chip.classList.remove('dragging');
        });

        // Les zones de drop doivent être gérées par le conteneur parent
    }

    // ========================================
    // GROUPES DE CHIPS
    // ========================================
    function createGroup(chips = [], options = {}) {
        const groupSettings = {
            gap: options.gap || 8,
            wrap: options.wrap !== false,
            align: options.align || 'start',
            justify: options.justify || 'start',
            maxSelection: options.maxSelection || null,
            sortable: options.sortable || false,
            className: options.className || '',
            ...options
        };

        const group = document.createElement('div');
        group.className = `${CONFIG.classes.group} ${groupSettings.className}`;
        
        // Styles du groupe
        group.style.gap = `${groupSettings.gap}px`;
        group.style.flexWrap = groupSettings.wrap ? 'wrap' : 'nowrap';
        group.style.alignItems = groupSettings.align;
        group.style.justifyContent = groupSettings.justify;

        // Ajout des chips
        chips.forEach(chipOptions => {
            const chip = create(chipOptions);
            group.appendChild(chip);
        });

        // Gestion de la sélection multiple
        if (groupSettings.maxSelection) {
            group.addEventListener('chipselect', (e) => {
                const selectedChips = group.querySelectorAll('.chip.selected');
                if (selectedChips.length > groupSettings.maxSelection) {
                    // Désélectionner le plus ancien
                    selectedChips[0].chipComponent.deselect();
                }
            });
        }

        // Tri par glisser-déposer
        if (groupSettings.sortable) {
            enableGroupSorting(group);
        }

        // API du groupe
        group.chipGroup = {
            addChip: (chipOptions) => {
                const chip = create(chipOptions);
                group.appendChild(chip);
                return chip;
            },
            removeChip: (chipId) => {
                const chip = group.querySelector(`#${chipId}`);
                if (chip) chip.chipComponent.remove();
            },
            getChips: () => Array.from(group.querySelectorAll('.chip')),
            getSelectedChips: () => Array.from(group.querySelectorAll('.chip.selected')),
            selectAll: () => {
                group.querySelectorAll('.chip').forEach(chip => {
                    chip.chipComponent.select();
                });
            },
            deselectAll: () => {
                group.querySelectorAll('.chip.selected').forEach(chip => {
                    chip.chipComponent.deselect();
                });
            },
            clear: () => {
                group.innerHTML = '';
            }
        };

        return group;
    }

    function enableGroupSorting(group) {
        let draggedChip = null;

        group.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(group, e.clientX);
            if (draggedChip && afterElement == null) {
                group.appendChild(draggedChip);
            } else if (draggedChip) {
                group.insertBefore(draggedChip, afterElement);
            }
        });

        group.addEventListener('drop', (e) => {
            e.preventDefault();
            const chipId = e.dataTransfer.getData('text/plain');
            draggedChip = document.getElementById(chipId);
        });
    }

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.chip:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function getIconPath(iconName) {
        const icons = {
            'check': '<path d="M20 6L9 17l-5-5"/>',
            'x': '<path d="M18 6L6 18M6 6l12 12"/>',
            'x-circle': '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
            'alert-triangle': '<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
            'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
            'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
            'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
            'tag': '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
            'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
            'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
        };
        return icons[iconName] || icons['tag'];
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        createGroup,
        CONFIG,
        injectStyles,
        
        // Méthodes utilitaires exposées
        utils: {
            escapeHtml,
            getIconPath
        }
    };
})();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChipComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Gestion des états multiples
   Solution: Système de classes CSS combinables
   
   [2024-01] - Performance avec beaucoup de chips
   Solution: Délégation d'événements pour les groupes
   
   [2024-01] - Accessibilité keyboard navigation
   Solution: Support complet ARIA et tabindex
   
   NOTES POUR REPRISES FUTURES:
   - Les animations doivent être désactivables
   - Le drag & drop nécessite un conteneur parent
   - Les icônes peuvent être étendues via CONFIG
   ======================================== */