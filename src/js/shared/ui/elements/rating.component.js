/* ========================================
   RATING.COMPONENT.JS - Composant de notation complet
   Chemin: src/js/shared/ui/elements/rating.component.js
   
   DESCRIPTION:
   Système de notation ultra-complet avec support glassmorphism.
   Gère étoiles, cœurs, pouces, smileys et icônes personnalisées.
   Supporte demi-valeurs, animations riches et accessibilité.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Méthodes privées (lignes 302-800)
   3. Gestionnaire d'événements (lignes 802-1000)
   4. API publique (lignes 1002-1100)
   5. Auto-initialisation (lignes 1102-1150)
   
   DÉPENDANCES:
   - rating.component.css (styles glassmorphism)
   - icons.component.js (optionnel pour icônes custom)
   ======================================== */

const RatingComponent = (() => {
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
                reflectionEffect: true
            },
            'neumorphism': {
                insetShadow: true,
                softEdges: true,
                depth: 'medium'
            },
            'flat': {
                borderWidth: 1,
                simpleShadow: true
            },
            'minimal': {
                noBorder: true,
                noBackground: true,
                hoverOnly: true
            },
            'material': {
                elevation: 2,
                rippleEffect: true
            }
        },

        // Types d'icônes disponibles
        icons: {
            'star': {
                filled: '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>',
                half: '<svg viewBox="0 0 24 24"><defs><linearGradient id="half"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path fill="url(#half)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/><path fill="none" stroke="currentColor" stroke-width="1" d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24z"/></svg>'
            },
            'heart': {
                filled: '<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>',
                half: '<svg viewBox="0 0 24 24"><defs><linearGradient id="halfHeart"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path fill="url(#halfHeart)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
            },
            'thumb': {
                filled: '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2zm-4 0l-3.02 7.05c-.09.23-.14.47-.14.73H9V9.41L13.17 5l.61.66-.92 4.34H19v2z"/></svg>',
                half: null // Pas de demi-pouce
            },
            'smiley': {
                1: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7z"/></svg>',
                2: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 6.5c2.03 0 3.8-1.11 4.75-2.75.19-.33-.05-.75-.44-.75H7.69c-.38 0-.63.42-.44.75.95 1.64 2.72 2.75 4.75 2.75z"/></svg>',
                3: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-4c-1.48 0-2.75-.81-3.45-2H6.88c.8 2.05 2.79 3.5 5.12 3.5s4.32-1.45 5.12-3.5h-1.67c-.69 1.19-1.97 2-3.45 2z"/></svg>',
                4: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-4c-1.48 0-2.75-.81-3.45-2H15.45c-.7 1.19-1.97 2-3.45 2z"/></svg>',
                5: '<svg viewBox="0 0 24 24"><circle cx="15.5" cy="9.5" r="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-2.5c2.03 0 3.8-1.11 4.75-2.75.19-.33-.05-.75-.44-.75H7.69c-.38 0-.63.42-.44.75.95 1.64 2.72 2.75 4.75 2.75z"/></svg>'
            },
            'fire': {
                filled: '<svg viewBox="0 0 24 24"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-.5-.04-1-.13-1.65zM12 20c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8.82 1.77 2.61 2.89 3.5 3.72l2.08 1.95c.41.38.41 1.02 0 1.41-.11.11-.24.17-.38.22-.55.2-.94.65-1.06 1.23-.16.71-.69 1.27-1.39 1.27z"/></svg>',
                half: null
            },
            'diamond': {
                filled: '<svg viewBox="0 0 24 24"><path d="M19 3H5L2 9l10 12L22 9l-3-6zM9.62 8l1.5-3h1.76l1.5 3H9.62zm1.11 1l2.77 5.53L11.22 9h2.51zm4.89 0h2.51l-2.28 5.53L13.61 9zm4.29-1h-3.41l-1.5-3h2.61L19.91 8zM4.09 8L5.5 5h2.61l-1.5 3H4.09zm1.54 1L10 18.06 5.88 9h-.25zm8.37 9.06L18.37 9h-.25L14 18.06z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M19 3H5L2 9l10 12L22 9l-3-6zm-7 16.68L5.44 9h2.38l3.11 7.83.96-2.36L10.23 9h3.54l-1.65 4.11.96 2.36L16.19 9h2.37L12 19.68zM4.44 8l1.2-3h2.97l-1.38 3H4.44zm3.85 0l1.38-3h4.66l1.38 3H8.29zm8.48 0l1.38-3h2.97l-1.2 3h-3.15z"/></svg>',
                half: null
            },
            'lightning': {
                filled: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
                empty: '<svg viewBox="0 0 24 24"><path d="M7 2v11h3v9l7-12h-4l4-8H7zm2 2h5.03L11 8.76 13.08 9H17l-4.32 7.45L12 13.05V11H9V4z"/></svg>',
                half: null
            }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                iconSize: 16,
                gap: 4,
                fontSize: 12
            },
            'medium': {
                iconSize: 24,
                gap: 6,
                fontSize: 14
            },
            'large': {
                iconSize: 32,
                gap: 8,
                fontSize: 16
            },
            'compact': {
                iconSize: 20,
                gap: 2,
                fontSize: 13
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                hover: true,
                transition: '0.2s ease',
                scale: 1.1
            },
            'smooth': {
                hover: true,
                active: true,
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                scale: 1.2,
                rotate: true
            },
            'rich': {
                hover: true,
                active: true,
                transition: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                scale: 1.3,
                rotate: true,
                bounce: true,
                particles: true,
                glow: true,
                wave: true
            }
        },

        // Couleurs par défaut
        colors: {
            default: {
                empty: '#cbd5e1',
                filled: '#fbbf24',
                hover: '#f59e0b',
                disabled: '#94a3b8'
            },
            gold: {
                empty: '#d4d4d8',
                filled: '#fbbf24',
                hover: '#f59e0b'
            },
            red: {
                empty: '#fecaca',
                filled: '#ef4444',
                hover: '#dc2626'
            },
            green: {
                empty: '#bbf7d0',
                filled: '#22c55e',
                hover: '#16a34a'
            },
            blue: {
                empty: '#bfdbfe',
                filled: '#3b82f6',
                hover: '#2563eb'
            },
            purple: {
                empty: '#ddd6fe',
                filled: '#8b5cf6',
                hover: '#7c3aed'
            }
        },

        // Labels par défaut
        labels: {
            'star': ['Terrible', 'Mauvais', 'Moyen', 'Bon', 'Excellent'],
            'heart': ['Pas aimé', 'Peu aimé', 'Aimé', 'Beaucoup aimé', 'Adoré'],
            'thumb': ['Non', 'Oui'],
            'smiley': ['Très mécontent', 'Mécontent', 'Neutre', 'Content', 'Très content'],
            'fire': ['Froid', 'Tiède', 'Chaud', 'Très chaud', 'Brûlant'],
            'diamond': ['Basique', 'Standard', 'Premium', 'Luxe', 'Exclusif'],
            'lightning': ['Très lent', 'Lent', 'Normal', 'Rapide', 'Ultra rapide']
        },

        // Options par défaut
        defaults: {
            style: 'glassmorphism',
            size: 'medium',
            animation: 'smooth',
            icon: 'star',
            count: 5,
            value: 0,
            allowHalf: false,
            readonly: false,
            disabled: false,
            showLabels: false,
            showValue: false,
            clearable: true,
            colorScheme: 'default',
            direction: 'ltr',
            orientation: 'horizontal'
        }
    };

    // ========================================
    // CACHE ET ÉTAT
    // ========================================
    const instances = new Map();
    let instanceId = 0;
    let stylesInjected = false;

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    function generateId() {
        return `rating-${Date.now()}-${instanceId++}`;
    }

    function mergeOptions(defaults, options) {
        return { ...defaults, ...options };
    }

    function createIcon(iconType, state, iconData) {
        const iconHTML = iconData[state];
        if (!iconHTML) return '';
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = iconHTML;
        return wrapper.firstChild;
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

    function createRatingHTML(options) {
        const {
            id,
            style,
            size,
            icon,
            count,
            value,
            allowHalf,
            readonly,
            disabled,
            showLabels,
            showValue,
            colorScheme,
            direction,
            orientation,
            labels
        } = options;

        // Conteneur principal
        const container = createElement('div', `rating rating-${style} rating-${size}`, {
            id,
            data: {
                value,
                icon,
                style,
                size,
                readonly: readonly.toString(),
                disabled: disabled.toString()
            },
            tabIndex: readonly || disabled ? -1 : 0,
            role: 'slider',
            'aria-label': 'Rating',
            'aria-valuemin': 0,
            'aria-valuemax': count,
            'aria-valuenow': value,
            'aria-readonly': readonly,
            'aria-disabled': disabled
        });

        if (orientation === 'vertical') {
            container.classList.add('rating-vertical');
        }

        if (direction === 'rtl') {
            container.classList.add('rating-rtl');
        }

        if (colorScheme !== 'default') {
            container.classList.add(`rating-${colorScheme}`);
        }

        // Label avant
        if (showLabels && labels && labels.before) {
            const labelBefore = createElement('span', 'rating-label rating-label-before');
            labelBefore.textContent = labels.before;
            container.appendChild(labelBefore);
        }

        // Conteneur des icônes
        const iconsContainer = createElement('div', 'rating-icons');
        
        // Créer les icônes
        for (let i = 1; i <= count; i++) {
            const iconContainer = createElement('button', 'rating-icon', {
                type: 'button',
                'aria-label': `Rate ${i} out of ${count}`,
                data: { value: i },
                disabled: readonly || disabled
            });

            // Icône vide (background)
            const emptyIcon = createIcon(icon, 'empty', CONFIG.icons[icon]);
            if (emptyIcon) {
                emptyIcon.classList.add('rating-icon-empty');
                iconContainer.appendChild(emptyIcon);
            }

            // Icône remplie
            const filledIcon = createIcon(icon, 'filled', CONFIG.icons[icon]);
            if (filledIcon) {
                filledIcon.classList.add('rating-icon-filled');
                iconContainer.appendChild(filledIcon);
            }

            // Icône demi (si supportée)
            if (allowHalf && CONFIG.icons[icon].half) {
                const halfIcon = createIcon(icon, 'half', CONFIG.icons[icon]);
                if (halfIcon) {
                    halfIcon.classList.add('rating-icon-half');
                    iconContainer.appendChild(halfIcon);
                }
            }

            // État initial
            updateIconState(iconContainer, i, value, allowHalf);

            iconsContainer.appendChild(iconContainer);
        }

        container.appendChild(iconsContainer);

        // Label après avec valeur
        if (showLabels || showValue) {
            const labelAfter = createElement('span', 'rating-label rating-label-after');
            
            if (showValue) {
                const valueSpan = createElement('span', 'rating-value');
                valueSpan.textContent = value.toFixed(allowHalf ? 1 : 0);
                labelAfter.appendChild(valueSpan);
                
                if (showLabels && labels && labels[Math.ceil(value)]) {
                    labelAfter.appendChild(document.createTextNode(' - '));
                }
            }
            
            if (showLabels && labels && labels[Math.ceil(value)]) {
                const textSpan = createElement('span', 'rating-text');
                textSpan.textContent = labels[Math.ceil(value)];
                labelAfter.appendChild(textSpan);
            }
            
            container.appendChild(labelAfter);
        }

        // Bouton clear (si activé)
        if (options.clearable && !readonly && !disabled) {
            const clearButton = createElement('button', 'rating-clear', {
                type: 'button',
                'aria-label': 'Clear rating',
                title: 'Clear rating'
            });
            clearButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
            container.appendChild(clearButton);
        }

        return container;
    }

    function updateIconState(iconElement, iconValue, currentValue, allowHalf) {
        iconElement.classList.remove('filled', 'half', 'empty');
        
        if (iconValue <= currentValue) {
            iconElement.classList.add('filled');
        } else if (allowHalf && iconValue - 0.5 <= currentValue) {
            iconElement.classList.add('half');
        } else {
            iconElement.classList.add('empty');
        }
    }

    function updateRating(element, newValue, options) {
        const icons = element.querySelectorAll('.rating-icon');
        const { allowHalf, count, labels, showValue, showLabels } = options;
        
        // Limiter la valeur
        newValue = Math.max(0, Math.min(count, newValue));
        
        // Mettre à jour les icônes
        icons.forEach((icon, index) => {
            updateIconState(icon, index + 1, newValue, allowHalf);
        });
        
        // Mettre à jour les attributs
        element.dataset.value = newValue;
        element.setAttribute('aria-valuenow', newValue);
        
        // Mettre à jour les labels
        if (showValue || showLabels) {
            const valueElement = element.querySelector('.rating-value');
            const textElement = element.querySelector('.rating-text');
            
            if (valueElement) {
                valueElement.textContent = newValue.toFixed(allowHalf ? 1 : 0);
            }
            
            if (textElement && labels) {
                const label = labels[Math.ceil(newValue)] || '';
                textElement.textContent = label;
            }
        }
        
        // Sauvegarder la nouvelle valeur
        const instance = instances.get(element.id);
        if (instance) {
            instance.value = newValue;
        }
    }

    // ========================================
    // GESTIONNAIRE D'ÉVÉNEMENTS
    // ========================================
    
    function attachEvents(element, options) {
        const { readonly, disabled, allowHalf, animation, onChange, onHover } = options;
        
        if (readonly || disabled) return;
        
        const icons = element.querySelectorAll('.rating-icon');
        const clearButton = element.querySelector('.rating-clear');
        
        // Hover preview
        icons.forEach((icon, index) => {
            icon.addEventListener('mouseenter', (e) => {
                if (animation !== 'none') {
                    const value = allowHalf && e.offsetX < icon.offsetWidth / 2 
                        ? index + 0.5 
                        : index + 1;
                    
                    // Preview temporaire
                    icons.forEach((i, idx) => {
                        updateIconState(i, idx + 1, value, allowHalf);
                        i.classList.add('preview');
                    });
                    
                    if (onHover) {
                        onHover(value);
                    }
                }
            });
            
            icon.addEventListener('mousemove', (e) => {
                if (allowHalf && animation !== 'none') {
                    const value = e.offsetX < icon.offsetWidth / 2 
                        ? index + 0.5 
                        : index + 1;
                    
                    icons.forEach((i, idx) => {
                        updateIconState(i, idx + 1, value, allowHalf);
                    });
                }
            });
        });
        
        // Reset au leave
        element.addEventListener('mouseleave', () => {
            const currentValue = parseFloat(element.dataset.value);
            icons.forEach((icon, index) => {
                icon.classList.remove('preview');
                updateIconState(icon, index + 1, currentValue, allowHalf);
            });
        });
        
        // Click pour définir la valeur
        icons.forEach((icon, index) => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                const value = allowHalf && e.offsetX < icon.offsetWidth / 2 
                    ? index + 0.5 
                    : index + 1;
                
                updateRating(element, value, options);
                
                // Animation de confirmation
                if (animation === 'rich') {
                    icon.classList.add('clicked');
                    createParticles(icon, value);
                    setTimeout(() => icon.classList.remove('clicked'), 600);
                }
                
                if (onChange) {
                    onChange(value);
                }
            });
        });
        
        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                updateRating(element, 0, options);
                if (onChange) {
                    onChange(0);
                }
            });
        }
        
        // Keyboard navigation
        element.addEventListener('keydown', (e) => {
            const currentValue = parseFloat(element.dataset.value);
            let newValue = currentValue;
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowDown':
                    e.preventDefault();
                    newValue = Math.max(0, currentValue - (allowHalf ? 0.5 : 1));
                    break;
                case 'ArrowRight':
                case 'ArrowUp':
                    e.preventDefault();
                    newValue = Math.min(options.count, currentValue + (allowHalf ? 0.5 : 1));
                    break;
                case 'Home':
                    e.preventDefault();
                    newValue = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    newValue = options.count;
                    break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    e.preventDefault();
                    const num = parseInt(e.key);
                    if (num <= options.count) {
                        newValue = num;
                    }
                    break;
            }
            
            if (newValue !== currentValue) {
                updateRating(element, newValue, options);
                if (onChange) {
                    onChange(newValue);
                }
            }
        });
    }

    // ========================================
    // EFFETS SPÉCIAUX
    // ========================================
    
    function createParticles(element, value) {
        const rect = element.getBoundingClientRect();
        const particleCount = Math.ceil(value) * 2;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = createElement('div', 'rating-particle');
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 50 + Math.random() * 50;
            
            particle.style.setProperty('--x', `${Math.cos(angle) * velocity}px`);
            particle.style.setProperty('--y', `${Math.sin(angle) * velocity}px`);
            particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
            
            document.body.appendChild(particle);
            
            particle.addEventListener('animationend', () => {
                particle.remove();
            });
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
            const finalOptions = mergeOptions(CONFIG.defaults, options);
            
            // Ajouter les labels par défaut si non fournis
            if (!finalOptions.labels && CONFIG.labels[finalOptions.icon]) {
                finalOptions.labels = CONFIG.labels[finalOptions.icon];
            }
            
            // Générer l'ID si non fourni
            if (!finalOptions.id) {
                finalOptions.id = generateId();
            }
            
            // Créer l'élément
            const element = createRatingHTML(finalOptions);
            
            // Attacher les événements
            attachEvents(element, finalOptions);
            
            // Sauvegarder l'instance
            instances.set(finalOptions.id, {
                element,
                options: finalOptions,
                value: finalOptions.value
            });
            
            // Injecter les styles si nécessaire
            if (!stylesInjected) {
                this.injectStyles();
            }
            
            return element;
        },
        
        // Mettre à jour une instance
        update(elementOrId, newValue) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            const instance = instances.get(element.id);
            if (instance) {
                updateRating(element, newValue, instance.options);
            }
        },
        
        // Obtenir la valeur
        getValue(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            return parseFloat(element.dataset.value) || 0;
        },
        
        // Activer/Désactiver
        enable(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            element.removeAttribute('data-disabled');
            element.removeAttribute('aria-disabled');
            element.querySelectorAll('button').forEach(btn => {
                btn.disabled = false;
            });
        },
        
        disable(elementOrId) {
            const element = typeof elementOrId === 'string' 
                ? document.getElementById(elementOrId)
                : elementOrId;
                
            element.dataset.disabled = 'true';
            element.setAttribute('aria-disabled', 'true');
            element.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
            });
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
            link.href = '/src/css/shared/ui/rating.component.css';
            document.head.appendChild(link);
            
            stylesInjected = true;
        }
    };
})();

// Auto-initialisation
document.addEventListener('DOMContentLoaded', () => {
    const autoRatings = document.querySelectorAll('[data-rating-auto]');
    autoRatings.forEach(element => {
        const options = {
            value: parseFloat(element.dataset.ratingValue) || 0,
            count: parseInt(element.dataset.ratingCount) || 5,
            icon: element.dataset.ratingIcon || 'star',
            readonly: element.dataset.ratingReadonly === 'true',
            allowHalf: element.dataset.ratingHalf === 'true',
            size: element.dataset.ratingSize || 'medium',
            style: element.dataset.ratingStyle || 'glassmorphism'
        };
        
        const rating = RatingComponent.create(options);
        element.replaceWith(rating);
    });
});

// Export
export default RatingComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion des demi-étoiles
   Solution: SVG avec gradient pour remplissage partiel
   
   [2024-01-16] - Performance avec beaucoup d'icônes
   Cause: Re-render complet à chaque hover
   Résolution: Mise à jour ciblée des classes CSS
   
   [2024-01-17] - Accessibilité clavier
   Solution: Navigation complète avec touches fléchées
   et support des lecteurs d'écran
   
   NOTES POUR REPRISES FUTURES:
   - Les particules nécessitent position:fixed sur body
   - Le blur glassmorphism peut impacter les perfs
   - Prévoir fallback pour navigateurs sans backdrop-filter
   ======================================== */