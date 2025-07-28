/* ========================================
   PAGINATION.COMPONENT.JS - Composant de pagination ultra-flexible
   Chemin: src/js/shared/ui/navigation/pagination.component.js
   
   DESCRIPTION:
   Composant de pagination complet avec support glassmorphism.
   Gère la navigation entre pages avec plusieurs modes d'affichage,
   animations riches, et fonctionnalités avancées.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-400)
   2. Méthodes privées (lignes 401-1100)
   3. Gestionnaires d'événements (lignes 1101-1300)
   4. API publique (lignes 1301-1500)
   
   DÉPENDANCES:
   - ui.config.js (configuration globale)
   - animation-utils.js (animations)
   - dom-utils.js (manipulation DOM)
   ======================================== */

const PaginationComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    padding: '16px 24px'
                },
                button: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    },
                    active: {
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.2)'
                    }
                }
            },
            'frosted': {
                container: {
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(30px) saturate(1.5) brightness(1.2)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    padding: '20px 28px'
                },
                button: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '14px',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.12)',
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'translateY(-3px) scale(1.05)',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)'
                    },
                    active: {
                        background: 'rgba(255, 255, 255, 0.18)',
                        borderColor: 'rgba(255, 255, 255, 0.35)',
                        boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.25)'
                    }
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    boxShadow: '20px 20px 60px #bec3c9, -20px -20px 60px #ffffff',
                    padding: '20px'
                },
                button: {
                    background: '#e0e5ec',
                    borderRadius: '12px',
                    boxShadow: '5px 5px 15px #bec3c9, -5px -5px 15px #ffffff',
                    hover: {
                        boxShadow: '3px 3px 8px #bec3c9, -3px -3px 8px #ffffff',
                        transform: 'scale(0.98)'
                    },
                    active: {
                        boxShadow: 'inset 3px 3px 8px #bec3c9, inset -3px -3px 8px #ffffff'
                    }
                }
            },
            'flat': {
                container: {
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #dee2e6',
                    padding: '16px'
                },
                button: {
                    background: '#ffffff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    hover: {
                        background: '#e9ecef',
                        borderColor: '#adb5bd'
                    },
                    active: {
                        background: '#0d6efd',
                        color: '#ffffff',
                        borderColor: '#0d6efd'
                    }
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '16px'
                },
                button: {
                    background: 'transparent',
                    borderRadius: '50%',
                    minWidth: '40px',
                    height: '40px',
                    hover: {
                        background: 'rgba(0,0,0,0.04)'
                    },
                    active: {
                        background: '#1976d2',
                        color: '#ffffff'
                    }
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    padding: '12px 0'
                },
                button: {
                    background: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '4px',
                    hover: {
                        background: 'rgba(0,0,0,0.05)'
                    },
                    active: {
                        borderColor: '#000000',
                        fontWeight: 'bold'
                    }
                }
            }
        },

        // Types de pagination
        types: {
            'simple': {
                showNumbers: false,
                showFirstLast: false,
                showInfo: false,
                showSizeChanger: false,
                showQuickJumper: false
            },
            'standard': {
                showNumbers: true,
                showFirstLast: false,
                showInfo: false,
                showSizeChanger: false,
                showQuickJumper: false,
                maxButtons: 7
            },
            'advanced': {
                showNumbers: true,
                showFirstLast: true,
                showInfo: true,
                showSizeChanger: true,
                showQuickJumper: true,
                maxButtons: 9
            },
            'dots': {
                showNumbers: true,
                showFirstLast: true,
                showInfo: false,
                showSizeChanger: false,
                showQuickJumper: false,
                showEllipsis: true,
                maxButtons: 7
            },
            'minimal': {
                showNumbers: false,
                showFirstLast: false,
                showInfo: true,
                showSizeChanger: false,
                showQuickJumper: false
            },
            'mobile': {
                showNumbers: false,
                showFirstLast: false,
                showInfo: true,
                showSizeChanger: false,
                showQuickJumper: false,
                compact: true
            }
        },

        // Niveaux d'animation
        animations: {
            'none': { enabled: false },
            'subtle': {
                enabled: true,
                duration: '0.2s',
                easing: 'ease-out',
                types: ['fade', 'scale']
            },
            'smooth': {
                enabled: true,
                duration: '0.3s',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                types: ['fade', 'slide', 'scale'],
                numberTransition: true
            },
            'rich': {
                enabled: true,
                duration: '0.4s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                types: ['fade', 'slide', 'scale', 'rotate', 'blur'],
                numberTransition: true,
                particleEffects: true,
                morphing: true,
                ripple: true
            }
        },

        // Positions disponibles
        positions: {
            'left': { justifyContent: 'flex-start' },
            'center': { justifyContent: 'center' },
            'right': { justifyContent: 'flex-end' },
            'space-between': { justifyContent: 'space-between' },
            'space-around': { justifyContent: 'space-around' }
        },

        // Tailles
        sizes: {
            'small': {
                fontSize: '12px',
                buttonSize: '32px',
                padding: '12px 16px',
                gap: '8px'
            },
            'medium': {
                fontSize: '14px',
                buttonSize: '40px',
                padding: '16px 24px',
                gap: '12px'
            },
            'large': {
                fontSize: '16px',
                buttonSize: '48px',
                padding: '20px 32px',
                gap: '16px'
            }
        },

        // Options de taille de page
        pageSizeOptions: [10, 20, 30, 50, 100],

        // Textes et labels (i18n ready)
        labels: {
            first: '⟨⟨',
            previous: '⟨',
            next: '⟩',
            last: '⟩⟩',
            page: 'Page',
            of: 'sur',
            items: 'éléments',
            show: 'Afficher',
            perPage: 'par page',
            jump: 'Aller à',
            total: 'Total',
            showing: 'Affichage',
            to: 'à',
            noData: 'Aucune donnée'
        },

        // Icônes SVG
        icons: {
            first: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"/></svg>',
            previous: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
            next: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
            last: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"/></svg>',
            ellipsis: '<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'
        },

        // Fonctionnalités
        features: {
            // Navigation au clavier
            keyboard: {
                enabled: true,
                shortcuts: {
                    'ArrowLeft': 'previous',
                    'ArrowRight': 'next',
                    'Home': 'first',
                    'End': 'last',
                    'PageUp': 'previousGroup',
                    'PageDown': 'nextGroup'
                }
            },

            // Touch/Swipe sur mobile
            touch: {
                enabled: true,
                swipeThreshold: 50
            },

            // URL sync
            urlSync: {
                enabled: false,
                param: 'page'
            },

            // Cache
            cache: {
                enabled: false,
                duration: 300000 // 5 minutes
            },

            // Analytics
            analytics: {
                enabled: false,
                trackClicks: true,
                trackChanges: true
            },

            // Accessibility
            accessibility: {
                announceChanges: true,
                focusTrap: false,
                skipLinks: true
            }
        },

        // Callbacks
        callbacks: {
            onPageChange: null,
            onPageSizeChange: null,
            onJump: null,
            onFirst: null,
            onLast: null,
            onPrevious: null,
            onNext: null,
            onRender: null,
            onError: null
        },

        // Classes CSS
        classes: {
            container: 'ui-pagination',
            wrapper: 'ui-pagination-wrapper',
            button: 'ui-pagination-button',
            active: 'ui-pagination-active',
            disabled: 'ui-pagination-disabled',
            ellipsis: 'ui-pagination-ellipsis',
            info: 'ui-pagination-info',
            sizeChanger: 'ui-pagination-size-changer',
            jumper: 'ui-pagination-jumper'
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = {
        instances: new Map(),
        idCounter: 0,
        touchStart: null,
        keyboardListeners: new Map()
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    // Génération d'ID unique
    function generateId() {
        return `pagination-${++state.idCounter}`;
    }

    // Fusion des options
    function mergeOptions(defaults, custom) {
        const merged = { ...defaults };
        
        for (const key in custom) {
            if (custom.hasOwnProperty(key)) {
                if (typeof custom[key] === 'object' && !Array.isArray(custom[key]) && custom[key] !== null) {
                    merged[key] = mergeOptions(defaults[key] || {}, custom[key]);
                } else {
                    merged[key] = custom[key];
                }
            }
        }
        
        return merged;
    }

    // Calcul des pages à afficher
    function calculatePageRange(currentPage, totalPages, maxButtons, showEllipsis) {
        const pages = [];
        const halfButtons = Math.floor(maxButtons / 2);
        
        if (totalPages <= maxButtons) {
            // Toutes les pages tiennent
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (showEllipsis) {
            // Avec ellipses
            pages.push(1);
            
            let start = Math.max(2, currentPage - halfButtons + 2);
            let end = Math.min(totalPages - 1, currentPage + halfButtons - 2);
            
            if (currentPage <= halfButtons) {
                end = maxButtons - 2;
            } else if (currentPage >= totalPages - halfButtons + 1) {
                start = totalPages - maxButtons + 3;
            }
            
            if (start > 2) pages.push('...');
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            if (end < totalPages - 1) pages.push('...');
            
            pages.push(totalPages);
        } else {
            // Sans ellipses
            let start = Math.max(1, currentPage - halfButtons);
            let end = Math.min(totalPages, currentPage + halfButtons);
            
            if (currentPage <= halfButtons) {
                end = maxButtons;
            } else if (currentPage >= totalPages - halfButtons) {
                start = totalPages - maxButtons + 1;
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    }

    // Création du conteneur principal
    function createContainer(options) {
        const container = document.createElement('nav');
        container.className = `${options.classes.container} ${options.size || 'medium'} ${options.type || 'standard'}`;
        container.id = options.id || generateId();
        container.setAttribute('role', 'navigation');
        container.setAttribute('aria-label', 'Pagination');
        
        // Application du style
        const style = CONFIG.styles[options.style];
        if (style && style.container) {
            Object.assign(container.style, style.container);
        }
        
        // Position
        if (options.position && CONFIG.positions[options.position]) {
            Object.assign(container.style, CONFIG.positions[options.position]);
        }
        
        // Structure interne
        const wrapper = document.createElement('div');
        wrapper.className = options.classes.wrapper;
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = CONFIG.sizes[options.size || 'medium'].gap;
        
        container.appendChild(wrapper);
        
        return container;
    }

    // Création d'un bouton
    function createButton(text, ariaLabel, disabled, isActive, options) {
        const button = document.createElement('button');
        button.className = options.classes.button;
        button.setAttribute('type', 'button');
        button.setAttribute('aria-label', ariaLabel);
        
        if (disabled) {
            button.disabled = true;
            button.classList.add(options.classes.disabled);
            button.setAttribute('aria-disabled', 'true');
        }
        
        if (isActive) {
            button.classList.add(options.classes.active);
            button.setAttribute('aria-current', 'page');
        }
        
        // Style du bouton
        const style = CONFIG.styles[options.style];
        if (style && style.button) {
            Object.assign(button.style, style.button);
            
            // Dimensions
            const size = CONFIG.sizes[options.size || 'medium'];
            button.style.minWidth = size.buttonSize;
            button.style.height = size.buttonSize;
            button.style.fontSize = size.fontSize;
        }
        
        // Contenu
        button.innerHTML = text;
        
        // Animations au survol
        if (options.animation !== 'none' && !disabled && !isActive) {
            setupButtonAnimations(button, options);
        }
        
        return button;
    }

    // Configuration des animations de bouton
    function setupButtonAnimations(button, options) {
        const style = CONFIG.styles[options.style];
        const animation = CONFIG.animations[options.animation];
        
        if (!style || !style.button || !animation || !animation.enabled) return;
        
        // Transition
        button.style.transition = `all ${animation.duration} ${animation.easing}`;
        
        // Hover
        button.addEventListener('mouseenter', () => {
            if (style.button.hover) {
                Object.assign(button.style, style.button.hover);
            }
            
            // Effet ripple pour animations riches
            if (options.animation === 'rich' && animation.ripple) {
                createRippleEffect(button);
            }
        });
        
        button.addEventListener('mouseleave', () => {
            // Reset des styles hover
            Object.assign(button.style, style.button);
        });
        
        // Active
        button.addEventListener('mousedown', () => {
            if (style.button.active) {
                Object.assign(button.style, style.button.active);
            }
        });
        
        button.addEventListener('mouseup', () => {
            setTimeout(() => {
                Object.assign(button.style, style.button.hover || style.button);
            }, 100);
        });
    }

    // Effet ripple
    function createRippleEffect(button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            width: 0;
            height: 0;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        // Animation
        ripple.animate([
            { width: '0', height: '0', opacity: 1 },
            { width: `${rect.width * 2}px`, height: `${rect.width * 2}px`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'ease-out'
        }).onfinish = () => ripple.remove();
    }

    // Rendu de la pagination
    function render(container, options) {
        const wrapper = container.querySelector(`.${options.classes.wrapper}`);
        wrapper.innerHTML = '';
        
        const {
            currentPage,
            totalPages,
            pageSize,
            totalItems,
            type = 'standard'
        } = options;
        
        const typeConfig = CONFIG.types[type];
        
        // Info gauche
        if (typeConfig.showInfo && options.position !== 'center') {
            wrapper.appendChild(createInfo(currentPage, pageSize, totalItems, options));
        }
        
        // Groupe de navigation
        const navGroup = document.createElement('div');
        navGroup.className = 'pagination-nav-group';
        navGroup.style.display = 'flex';
        navGroup.style.alignItems = 'center';
        navGroup.style.gap = CONFIG.sizes[options.size || 'medium'].gap;
        
        // Première page
        if (typeConfig.showFirstLast) {
            const firstBtn = createButton(
                options.labels.first || CONFIG.labels.first,
                'Première page',
                currentPage === 1,
                false,
                options
            );
            firstBtn.dataset.page = '1';
            navGroup.appendChild(firstBtn);
        }
        
        // Page précédente
        const prevBtn = createButton(
            options.icons?.previous || CONFIG.icons.previous,
            'Page précédente',
            currentPage === 1,
            false,
            options
        );
        prevBtn.dataset.page = currentPage - 1;
        navGroup.appendChild(prevBtn);
        
        // Numéros de page
        if (typeConfig.showNumbers) {
            const pages = calculatePageRange(
                currentPage,
                totalPages,
                typeConfig.maxButtons || 7,
                typeConfig.showEllipsis
            );
            
            pages.forEach(page => {
                if (page === '...') {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = options.classes.ellipsis;
                    ellipsis.innerHTML = CONFIG.icons.ellipsis;
                    ellipsis.style.padding = '0 8px';
                    ellipsis.style.opacity = '0.5';
                    navGroup.appendChild(ellipsis);
                } else {
                    const pageBtn = createButton(
                        page.toString(),
                        `Page ${page}`,
                        false,
                        page === currentPage,
                        options
                    );
                    pageBtn.dataset.page = page;
                    
                    // Animation de transition des nombres
                    if (options.animation === 'smooth' || options.animation === 'rich') {
                        animateNumberChange(pageBtn, page, currentPage);
                    }
                    
                    navGroup.appendChild(pageBtn);
                }
            });
        }
        
        // Page suivante
        const nextBtn = createButton(
            options.icons?.next || CONFIG.icons.next,
            'Page suivante',
            currentPage === totalPages,
            false,
            options
        );
        nextBtn.dataset.page = currentPage + 1;
        navGroup.appendChild(nextBtn);
        
        // Dernière page
        if (typeConfig.showFirstLast) {
            const lastBtn = createButton(
                options.labels.last || CONFIG.labels.last,
                'Dernière page',
                currentPage === totalPages,
                false,
                options
            );
            lastBtn.dataset.page = totalPages;
            navGroup.appendChild(lastBtn);
        }
        
        wrapper.appendChild(navGroup);
        
        // Info centre
        if (typeConfig.showInfo && options.position === 'center') {
            wrapper.appendChild(createInfo(currentPage, pageSize, totalItems, options));
        }
        
        // Sélecteur de taille
        if (typeConfig.showSizeChanger) {
            wrapper.appendChild(createSizeChanger(pageSize, options));
        }
        
        // Quick jumper
        if (typeConfig.showQuickJumper) {
            wrapper.appendChild(createQuickJumper(currentPage, totalPages, options));
        }
        
        // Configuration des événements
        setupEventHandlers(container, options);
        
        // Callback de rendu
        if (options.callbacks.onRender) {
            options.callbacks.onRender(container);
        }
    }

    // Création du bloc d'info
    function createInfo(currentPage, pageSize, totalItems, options) {
        const info = document.createElement('div');
        info.className = options.classes.info;
        info.style.fontSize = CONFIG.sizes[options.size || 'medium'].fontSize;
        info.style.opacity = '0.8';
        info.style.whiteSpace = 'nowrap';
        
        const start = (currentPage - 1) * pageSize + 1;
        const end = Math.min(currentPage * pageSize, totalItems);
        
        info.textContent = `${start}-${end} ${CONFIG.labels.of} ${totalItems} ${CONFIG.labels.items}`;
        
        return info;
    }

    // Création du sélecteur de taille
    function createSizeChanger(currentSize, options) {
        const container = document.createElement('div');
        container.className = options.classes.sizeChanger;
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        const label = document.createElement('span');
        label.textContent = CONFIG.labels.show;
        label.style.fontSize = CONFIG.sizes[options.size || 'medium'].fontSize;
        label.style.opacity = '0.8';
        
        const select = document.createElement('select');
        select.className = 'size-select';
        select.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 4px 8px;
            color: inherit;
            font-size: ${CONFIG.sizes[options.size || 'medium'].fontSize};
            cursor: pointer;
        `;
        
        const pageSizes = options.pageSizeOptions || CONFIG.pageSizeOptions;
        pageSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            option.selected = size === currentSize;
            select.appendChild(option);
        });
        
        const suffix = document.createElement('span');
        suffix.textContent = CONFIG.labels.perPage;
        suffix.style.fontSize = CONFIG.sizes[options.size || 'medium'].fontSize;
        suffix.style.opacity = '0.8';
        
        container.appendChild(label);
        container.appendChild(select);
        container.appendChild(suffix);
        
        return container;
    }

    // Création du quick jumper
    function createQuickJumper(currentPage, totalPages, options) {
        const container = document.createElement('div');
        container.className = options.classes.jumper;
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        const label = document.createElement('span');
        label.textContent = CONFIG.labels.jump;
        label.style.fontSize = CONFIG.sizes[options.size || 'medium'].fontSize;
        label.style.opacity = '0.8';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'jump-input';
        input.min = '1';
        input.max = totalPages.toString();
        input.value = currentPage;
        input.style.cssText = `
            width: 60px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 4px 8px;
            color: inherit;
            font-size: ${CONFIG.sizes[options.size || 'medium'].fontSize};
            text-align: center;
        `;
        
        const button = createButton(
            'OK',
            'Aller à la page',
            false,
            false,
            options
        );
        button.style.minWidth = 'auto';
        button.style.padding = '0 12px';
        
        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(button);
        
        return container;
    }

    // Animation de changement de nombre
    function animateNumberChange(button, newNumber, oldNumber) {
        if (newNumber === oldNumber) return;
        
        const direction = newNumber > oldNumber ? 1 : -1;
        const diff = Math.abs(newNumber - oldNumber);
        
        if (diff === 1) {
            // Animation de glissement pour pages adjacentes
            button.style.transform = `translateY(${direction * 20}px)`;
            button.style.opacity = '0';
            
            setTimeout(() => {
                button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                button.style.transform = 'translateY(0)';
                button.style.opacity = '1';
            }, 50);
        } else {
            // Animation de fade pour sauts
            button.style.opacity = '0';
            button.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                button.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                button.style.opacity = '1';
                button.style.transform = 'scale(1)';
            }, 50);
        }
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    // Configuration des événements
    function setupEventHandlers(container, options) {
        const wrapper = container.querySelector(`.${options.classes.wrapper}`);
        
        // Clics sur les boutons
        wrapper.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.disabled) return;
            
            const page = parseInt(button.dataset.page);
            if (!isNaN(page) && page !== options.currentPage) {
                changePage(container, page, options);
            }
        });
        
        // Sélecteur de taille
        const sizeSelect = wrapper.querySelector('.size-select');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                const newSize = parseInt(e.target.value);
                if (options.callbacks.onPageSizeChange) {
                    options.callbacks.onPageSizeChange(newSize);
                }
                
                // Recalcul de la page courante
                const newTotalPages = Math.ceil(options.totalItems / newSize);
                const newCurrentPage = Math.min(options.currentPage, newTotalPages);
                
                options.pageSize = newSize;
                options.totalPages = newTotalPages;
                options.currentPage = newCurrentPage;
                
                render(container, options);
            });
        }
        
        // Quick jumper
        const jumpInput = wrapper.querySelector('.jump-input');
        const jumpButton = wrapper.querySelector(`.${options.classes.jumper} button`);
        
        if (jumpInput && jumpButton) {
            const jump = () => {
                const page = parseInt(jumpInput.value);
                if (!isNaN(page) && page >= 1 && page <= options.totalPages && page !== options.currentPage) {
                    if (options.callbacks.onJump) {
                        options.callbacks.onJump(page);
                    }
                    changePage(container, page, options);
                }
            };
            
            jumpButton.addEventListener('click', jump);
            jumpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') jump();
            });
        }
        
        // Navigation au clavier
        if (options.features.keyboard.enabled) {
            setupKeyboardNavigation(container, options);
        }
        
        // Touch/Swipe
        if (options.features.touch.enabled && 'ontouchstart' in window) {
            setupTouchNavigation(container, options);
        }
    }

    // Changement de page
    function changePage(container, newPage, options) {
        const oldPage = options.currentPage;
        options.currentPage = newPage;
        
        // Animation de transition
        if (options.animation !== 'none') {
            const wrapper = container.querySelector(`.${options.classes.wrapper}`);
            wrapper.style.opacity = '0.5';
            wrapper.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                render(container, options);
                wrapper.style.transition = 'all 0.3s';
                wrapper.style.opacity = '1';
                wrapper.style.transform = 'scale(1)';
            }, 150);
        } else {
            render(container, options);
        }
        
        // Callback
        if (options.callbacks.onPageChange) {
            options.callbacks.onPageChange(newPage, oldPage);
        }
        
        // URL sync
        if (options.features.urlSync.enabled) {
            updateURL(newPage, options.features.urlSync.param);
        }
        
        // Annonce pour accessibilité
        if (options.features.accessibility.announceChanges) {
            announcePageChange(newPage, options.totalPages);
        }
        
        // Particules pour animation riche
        if (options.animation === 'rich') {
            createPageChangeParticles(container);
        }
    }

    // Navigation au clavier
    function setupKeyboardNavigation(container, options) {
        const handler = (e) => {
            const shortcuts = options.features.keyboard.shortcuts;
            const action = shortcuts[e.key];
            
            if (!action) return;
            
            let newPage = options.currentPage;
            
            switch (action) {
                case 'previous':
                    newPage = Math.max(1, options.currentPage - 1);
                    break;
                case 'next':
                    newPage = Math.min(options.totalPages, options.currentPage + 1);
                    break;
                case 'first':
                    newPage = 1;
                    break;
                case 'last':
                    newPage = options.totalPages;
                    break;
                case 'previousGroup':
                    newPage = Math.max(1, options.currentPage - 10);
                    break;
                case 'nextGroup':
                    newPage = Math.min(options.totalPages, options.currentPage + 10);
                    break;
            }
            
            if (newPage !== options.currentPage) {
                e.preventDefault();
                changePage(container, newPage, options);
            }
        };
        
        container.addEventListener('keydown', handler);
        state.keyboardListeners.set(container.id, handler);
    }

    // Navigation tactile
    function setupTouchNavigation(container, options) {
        let touchStartX = null;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            if (touchStartX === null) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            const threshold = options.features.touch.swipeThreshold;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && options.currentPage > 1) {
                    // Swipe droite = page précédente
                    changePage(container, options.currentPage - 1, options);
                } else if (diff < 0 && options.currentPage < options.totalPages) {
                    // Swipe gauche = page suivante
                    changePage(container, options.currentPage + 1, options);
                }
            }
            
            touchStartX = null;
        });
    }

    // Mise à jour de l'URL
    function updateURL(page, param) {
        if (!window.history || !window.history.pushState) return;
        
        const url = new URL(window.location);
        url.searchParams.set(param, page);
        window.history.pushState({ page }, '', url);
    }

    // Annonce pour accessibilité
    function announcePageChange(currentPage, totalPages) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `Page ${currentPage} sur ${totalPages}`;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    // Particules pour changement de page
    function createPageChangeParticles(container) {
        const rect = container.getBoundingClientRect();
        const particles = 15;
        
        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.className = 'page-particle';
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (i / particles) * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'cubic-bezier(0, .9, .57, 1)'
            }).onfinish = () => particle.remove();
        }
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    
    // Injection des styles
    function injectStyles() {
        if (document.getElementById('ui-pagination-styles')) return;
        
        const styles = `
            /* Styles importés depuis pagination.component.css */
            /* Voir le fichier CSS séparé pour tous les styles */
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ui-pagination-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Création d'une pagination
        create(options = {}) {
            // Options par défaut
            const defaults = {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                pageSize: 10,
                style: 'glassmorphism',
                type: 'standard',
                size: 'medium',
                position: 'center',
                animation: 'smooth',
                ...CONFIG
            };
            
            // Fusion des options
            const finalOptions = mergeOptions(defaults, options);
            
            // Validation
            if (finalOptions.currentPage < 1) finalOptions.currentPage = 1;
            if (finalOptions.currentPage > finalOptions.totalPages) {
                finalOptions.currentPage = finalOptions.totalPages;
            }
            
            // Injection des styles si nécessaire
            this.injectStyles();
            
            // Création du conteneur
            const container = createContainer(finalOptions);
            
            // Rendu initial
            render(container, finalOptions);
            
            // Stockage de l'instance
            const instance = {
                container,
                options: finalOptions
            };
            state.instances.set(container.id, instance);
            
            // API de l'instance
            return {
                element: container,
                
                // Obtenir la page courante
                getCurrentPage() {
                    return finalOptions.currentPage;
                },
                
                // Aller à une page
                goToPage(page) {
                    page = Math.max(1, Math.min(page, finalOptions.totalPages));
                    if (page !== finalOptions.currentPage) {
                        changePage(container, page, finalOptions);
                    }
                },
                
                // Page précédente
                previous() {
                    if (finalOptions.currentPage > 1) {
                        this.goToPage(finalOptions.currentPage - 1);
                    }
                },
                
                // Page suivante
                next() {
                    if (finalOptions.currentPage < finalOptions.totalPages) {
                        this.goToPage(finalOptions.currentPage + 1);
                    }
                },
                
                // Première page
                first() {
                    this.goToPage(1);
                },
                
                // Dernière page
                last() {
                    this.goToPage(finalOptions.totalPages);
                },
                
                // Mise à jour des options
                update(newOptions) {
                    Object.assign(finalOptions, newOptions);
                    
                    // Recalcul si nécessaire
                    if (newOptions.totalItems !== undefined || newOptions.pageSize !== undefined) {
                        finalOptions.totalPages = Math.ceil(
                            finalOptions.totalItems / finalOptions.pageSize
                        );
                    }
                    
                    // Validation de la page courante
                    if (finalOptions.currentPage > finalOptions.totalPages) {
                        finalOptions.currentPage = finalOptions.totalPages;
                    }
                    
                    render(container, finalOptions);
                },
                
                // Changement de taille de page
                setPageSize(size) {
                    this.update({ pageSize: size });
                },
                
                // Rafraîchissement
                refresh() {
                    render(container, finalOptions);
                },
                
                // Activation/désactivation
                enable() {
                    container.style.pointerEvents = 'auto';
                    container.style.opacity = '1';
                },
                
                disable() {
                    container.style.pointerEvents = 'none';
                    container.style.opacity = '0.5';
                },
                
                // Destruction
                destroy() {
                    // Suppression des listeners
                    const keyboardHandler = state.keyboardListeners.get(container.id);
                    if (keyboardHandler) {
                        container.removeEventListener('keydown', keyboardHandler);
                        state.keyboardListeners.delete(container.id);
                    }
                    
                    // Suppression du DOM
                    container.remove();
                    
                    // Suppression de l'instance
                    state.instances.delete(container.id);
                }
            };
        },
        
        // Configuration globale
        CONFIG,
        
        // Injection des styles
        injectStyles,
        
        // Obtenir toutes les instances
        getInstances() {
            return Array.from(state.instances.values());
        },
        
        // Utilitaires
        utils: {
            calculatePageRange,
            mergeOptions
        }
    };
})();

// Export pour utilisation
export default PaginationComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-18] - Gestion des ellipses dynamiques
   Solution: Algorithme adaptatif selon position
   
   [2024-01-19] - Performance avec beaucoup de pages
   Solution: Limitation du nombre de boutons affichés
   
   [2024-01-20] - Accessibilité ARIA
   Solution: Attributs aria-label et annonces
   
   NOTES POUR REPRISES FUTURES:
   - Le calcul des pages avec ellipses est complexe
   - Les animations peuvent être lourdes sur mobile
   - L'URL sync nécessite History API
   - Touch events nécessitent passive: true
   ======================================== */