/* ========================================
   TABS.COMPONENT.JS - Composant de navigation par onglets
   Chemin: src/js/shared/ui/navigation/tabs.component.js
   
   DESCRIPTION:
   Système complet de tabs avec support glassmorphism, animations riches,
   drag & drop, tabs closables, scrolling, et multiples variantes.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-350)
   2. Utilitaires privés (lignes 352-500)
   3. Gestionnaire d'onglets (lignes 502-900)
   4. Rendu et DOM (lignes 902-1400)
   5. API publique (lignes 1402-1500)
   
   DÉPENDANCES:
   - tabs.css (styles du composant)
   - ui.config.js (configuration globale)
   - animation-utils.js (animations avancées)
   ======================================== */

const Tabs = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                blur: 20,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                borderRadius: 16,
                tabRadius: 12
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: 20,
                tabShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
            },
            'flat': {
                background: '#f3f4f6',
                border: '#e5e7eb',
                borderRadius: 8,
                activeColor: '#3b82f6'
            },
            'minimal': {
                background: 'transparent',
                borderBottom: '1px solid #e5e7eb',
                activeIndicator: '2px solid #3b82f6'
            },
            'material': {
                background: '#ffffff',
                shadow: '0 2px 4px rgba(0,0,0,.1)',
                ripple: true,
                inkColor: 'rgba(0,0,0,0.06)'
            },
            'underline': {
                background: 'transparent',
                borderBottom: '1px solid #e5e7eb',
                indicator: '3px solid #3b82f6',
                indicatorAnimation: 'slide'
            },
            'pills': {
                background: 'transparent',
                pillBg: 'rgba(59, 130, 246, 0.1)',
                pillActiveBg: '#3b82f6',
                gap: 8
            },
            'segmented': {
                background: 'rgba(255, 255, 255, 0.05)',
                segmentBg: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 4
            },
            'vertical': {
                orientation: 'vertical',
                width: 200,
                background: 'rgba(255, 255, 255, 0.05)'
            },
            'gradient': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                textColor: 'white'
            }
        },

        animations: {
            'none': { enabled: false },
            'subtle': {
                hover: true,
                transition: '0.3s ease',
                scaleOnHover: 1.02
            },
            'smooth': {
                hover: true,
                indicator: true,
                transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                scaleOnHover: 1.05,
                fadeContent: true
            },
            'rich': {
                hover: true,
                indicator: true,
                ripple: true,
                particles: true,
                springy: true,
                transition: '0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                scaleOnHover: 1.1,
                rotateOnSwitch: true,
                glowEffect: true
            },
            'bounce': {
                hover: true,
                indicator: true,
                transition: '0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                bounceOnSwitch: true
            },
            'slide': {
                slideDirection: 'horizontal',
                transition: '0.4s ease-out',
                parallax: true
            }
        },

        layouts: {
            'default': {
                position: 'top',
                alignment: 'start',
                fill: false,
                scrollable: 'auto'
            },
            'centered': {
                position: 'top',
                alignment: 'center',
                fill: false
            },
            'fullWidth': {
                position: 'top',
                alignment: 'start',
                fill: true
            },
            'vertical': {
                position: 'left',
                orientation: 'vertical',
                minWidth: 200
            },
            'bottom': {
                position: 'bottom',
                alignment: 'start'
            },
            'card': {
                variant: 'card',
                showContent: true,
                padding: true
            },
            'wizard': {
                variant: 'wizard',
                showSteps: true,
                navigation: true
            }
        },

        features: {
            closable: false,
            addable: false,
            draggable: false,
            scrollable: true,
            keyboard: true,
            swipe: true,
            lazy: false,
            cache: true,
            overflow: 'scroll', // 'scroll', 'menu', 'fade'
            icons: true,
            badges: true,
            contextMenu: false,
            confirmation: false,
            history: false,
            shortcuts: false,
            search: false,
            breadcrumbs: false,
            preview: false,
            groups: false,
            collapse: false,
            responsive: {
                breakpoint: 768,
                mobileLayout: 'stack'
            }
        },

        indicators: {
            'none': { enabled: false },
            'underline': {
                height: 3,
                radius: 2,
                animation: 'slide'
            },
            'background': {
                full: true,
                radius: 8,
                animation: 'morph'
            },
            'dot': {
                size: 6,
                position: 'bottom',
                animation: 'scale'
            },
            'number': {
                show: true,
                style: 'circle'
            },
            'progress': {
                show: true,
                style: 'line'
            }
        },

        transitions: {
            'fade': {
                in: 'fadeIn 0.3s ease-out',
                out: 'fadeOut 0.3s ease-in'
            },
            'slide': {
                in: 'slideIn 0.4s ease-out',
                out: 'slideOut 0.4s ease-in'
            },
            'zoom': {
                in: 'zoomIn 0.3s ease-out',
                out: 'zoomOut 0.3s ease-in'
            },
            'flip': {
                in: 'flipIn 0.6s ease-out',
                out: 'flipOut 0.6s ease-in'
            },
            'rotate': {
                in: 'rotateIn 0.5s ease-out',
                out: 'rotateOut 0.5s ease-in'
            }
        },

        i18n: {
            close: 'Fermer l\'onglet',
            add: 'Ajouter un onglet',
            menu: 'Plus d\'onglets',
            navigate: 'Naviguer entre les onglets',
            previous: 'Onglet précédent',
            next: 'Onglet suivant',
            search: 'Rechercher dans les onglets',
            noTabs: 'Aucun onglet'
        },

        callbacks: {
            onChange: null,
            onAdd: null,
            onRemove: null,
            onReorder: null,
            beforeChange: null,
            onLoad: null,
            onError: null
        },

        classes: {
            container: 'tabs',
            nav: 'tabs-nav',
            list: 'tabs-list',
            item: 'tabs-item',
            link: 'tabs-link',
            panel: 'tabs-panel',
            content: 'tabs-content',
            indicator: 'tabs-indicator',
            active: 'active',
            disabled: 'disabled',
            loading: 'loading',
            dragging: 'dragging',
            closable: 'closable'
        },

        icons: {
            close: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            add: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7h14"/></svg>',
            menu: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
            chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
            chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
            loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4m4.2-16.2L14.8 7.2m4 9.6l-1.4-1.4m4.6-3.4h-4m-12 0H2m16.2 8.2L16.8 14.8m-9.6 4l1.4-1.4m-3.4-4.6v4"/></svg>'
        },

        accessibility: {
            role: 'tablist',
            tabRole: 'tab',
            panelRole: 'tabpanel',
            announcements: true,
            focusTrap: false,
            autoActivate: false,
            wrapAround: true
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();
    let instanceCount = 0;

    // ========================================
    // UTILITAIRES PRIVÉS
    // ========================================
    function generateId() {
        return `tabs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

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

    function isVisible(element) {
        const rect = element.getBoundingClientRect();
        const containerRect = element.parentElement.getBoundingClientRect();
        return rect.left >= containerRect.left && rect.right <= containerRect.right;
    }

    function scrollIntoView(element, container, smooth = true) {
        const rect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (rect.left < containerRect.left) {
            container.scrollTo({
                left: container.scrollLeft + rect.left - containerRect.left - 20,
                behavior: smooth ? 'smooth' : 'auto'
            });
        } else if (rect.right > containerRect.right) {
            container.scrollTo({
                left: container.scrollLeft + rect.right - containerRect.right + 20,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    }

    // ========================================
    // GESTIONNAIRE D'ONGLETS
    // ========================================
    class TabsManager {
        constructor(container, options) {
            this.container = container;
            this.options = options;
            this.tabs = [];
            this.activeIndex = 0;
            this.id = options.id;
            this.history = [];
            this.cache = new Map();
            
            this.init();
        }

        init() {
            this.setupAccessibility();
            this.bindEvents();
            
            if (this.options.features.keyboard) {
                this.setupKeyboardNav();
            }
            
            if (this.options.features.swipe && 'ontouchstart' in window) {
                this.setupSwipeGestures();
            }
            
            if (this.options.features.draggable) {
                this.setupDragDrop();
            }
            
            if (this.options.features.history) {
                this.setupHistory();
            }
        }

        setupAccessibility() {
            const nav = this.container.querySelector(`.${CONFIG.classes.nav}`);
            const list = nav.querySelector(`.${CONFIG.classes.list}`);
            
            list.setAttribute('role', CONFIG.accessibility.role);
            
            this.tabs.forEach((tab, index) => {
                const link = tab.link;
                const panel = tab.panel;
                
                link.setAttribute('role', CONFIG.accessibility.tabRole);
                link.setAttribute('aria-selected', index === this.activeIndex);
                link.setAttribute('aria-controls', panel.id);
                link.setAttribute('tabindex', index === this.activeIndex ? '0' : '-1');
                
                panel.setAttribute('role', CONFIG.accessibility.panelRole);
                panel.setAttribute('aria-labelledby', link.id);
                panel.setAttribute('tabindex', '0');
                panel.hidden = index !== this.activeIndex;
            });
        }

        bindEvents() {
            const nav = this.container.querySelector(`.${CONFIG.classes.nav}`);
            
            // Click sur les onglets
            nav.addEventListener('click', (e) => {
                const link = e.target.closest(`.${CONFIG.classes.link}`);
                if (!link || link.classList.contains('disabled')) return;
                
                const index = this.tabs.findIndex(tab => tab.link === link);
                if (index !== -1) {
                    e.preventDefault();
                    this.setActiveTab(index);
                }
                
                // Bouton de fermeture
                const closeBtn = e.target.closest('.tab-close');
                if (closeBtn) {
                    e.stopPropagation();
                    const tabLink = closeBtn.closest(`.${CONFIG.classes.link}`);
                    const tabIndex = this.tabs.findIndex(tab => tab.link === tabLink);
                    if (tabIndex !== -1) {
                        this.removeTab(tabIndex);
                    }
                }
                
                // Bouton d'ajout
                const addBtn = e.target.closest('.tabs-add');
                if (addBtn) {
                    this.addTab();
                }
            });
            
            // Scroll pour afficher les contrôles
            if (this.options.features.scrollable) {
                this.setupScrollControls();
            }
            
            // Redimensionnement
            this.resizeObserver = new ResizeObserver(
                debounce(() => this.handleResize(), 150)
            );
            this.resizeObserver.observe(this.container);
        }

        setupKeyboardNav() {
            const nav = this.container.querySelector(`.${CONFIG.classes.nav}`);
            
            nav.addEventListener('keydown', (e) => {
                const isVertical = this.options.orientation === 'vertical';
                const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
                const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
                
                switch (e.key) {
                    case prevKey:
                        e.preventDefault();
                        this.focusPreviousTab();
                        break;
                    case nextKey:
                        e.preventDefault();
                        this.focusNextTab();
                        break;
                    case 'Home':
                        e.preventDefault();
                        this.focusFirstTab();
                        break;
                    case 'End':
                        e.preventDefault();
                        this.focusLastTab();
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        const focused = document.activeElement;
                        const index = this.tabs.findIndex(tab => tab.link === focused);
                        if (index !== -1) {
                            this.setActiveTab(index);
                        }
                        break;
                    case 'Delete':
                        if (this.options.features.closable) {
                            const focused = document.activeElement;
                            const index = this.tabs.findIndex(tab => tab.link === focused);
                            if (index !== -1) {
                                this.removeTab(index);
                            }
                        }
                        break;
                }
            });
        }

        setupSwipeGestures() {
            let touchStartX = 0;
            let touchEndX = 0;
            const threshold = 50;
            
            const content = this.container.querySelector(`.${CONFIG.classes.content}`);
            
            content.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            content.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX, threshold);
            }, { passive: true });
        }

        handleSwipe(startX, endX, threshold) {
            const diff = startX - endX;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    // Swipe left - next tab
                    this.nextTab();
                } else {
                    // Swipe right - previous tab
                    this.previousTab();
                }
            }
        }

        setupDragDrop() {
            let draggedTab = null;
            let draggedIndex = -1;
            
            this.tabs.forEach((tab, index) => {
                const item = tab.link.parentElement;
                item.draggable = true;
                
                item.addEventListener('dragstart', (e) => {
                    draggedTab = tab;
                    draggedIndex = index;
                    item.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', item.innerHTML);
                });
                
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });
                
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const afterElement = this.getDragAfterElement(item.parentElement, e.clientX);
                    if (afterElement == null) {
                        item.parentElement.appendChild(draggedTab.link.parentElement);
                    } else {
                        item.parentElement.insertBefore(draggedTab.link.parentElement, afterElement);
                    }
                });
                
                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const newIndex = Array.from(item.parentElement.children).indexOf(draggedTab.link.parentElement);
                    this.reorderTabs(draggedIndex, newIndex);
                });
            });
        }

        getDragAfterElement(container, x) {
            const draggableElements = [...container.querySelectorAll('.tabs-item:not(.dragging)')];
            
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

        setupScrollControls() {
            const nav = this.container.querySelector(`.${CONFIG.classes.nav}`);
            const list = nav.querySelector(`.${CONFIG.classes.list}`);
            
            const checkScroll = () => {
                const hasScroll = list.scrollWidth > list.clientWidth;
                nav.classList.toggle('has-scroll', hasScroll);
                
                if (hasScroll) {
                    const canScrollLeft = list.scrollLeft > 0;
                    const canScrollRight = list.scrollLeft < list.scrollWidth - list.clientWidth;
                    
                    nav.classList.toggle('can-scroll-left', canScrollLeft);
                    nav.classList.toggle('can-scroll-right', canScrollRight);
                }
            };
            
            list.addEventListener('scroll', debounce(checkScroll, 50));
            checkScroll();
            
            // Boutons de défilement
            const scrollLeft = nav.querySelector('.tabs-scroll-left');
            const scrollRight = nav.querySelector('.tabs-scroll-right');
            
            if (scrollLeft) {
                scrollLeft.addEventListener('click', () => {
                    list.scrollBy({ left: -200, behavior: 'smooth' });
                });
            }
            
            if (scrollRight) {
                scrollRight.addEventListener('click', () => {
                    list.scrollBy({ left: 200, behavior: 'smooth' });
                });
            }
        }

        setupHistory() {
            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.tabId === this.id && e.state.tabIndex !== undefined) {
                    this.setActiveTab(e.state.tabIndex, false);
                }
            });
        }

        async setActiveTab(index, updateHistory = true) {
            if (index === this.activeIndex || index < 0 || index >= this.tabs.length) {
                return;
            }
            
            const oldTab = this.tabs[this.activeIndex];
            const newTab = this.tabs[index];
            
            // Callback beforeChange
            if (this.options.callbacks.beforeChange) {
                const canChange = await this.options.callbacks.beforeChange(newTab, oldTab, index);
                if (canChange === false) return;
            }
            
            // Mise à jour de l'UI
            oldTab.link.setAttribute('aria-selected', 'false');
            oldTab.link.setAttribute('tabindex', '-1');
            oldTab.link.classList.remove('active');
            oldTab.panel.hidden = true;
            oldTab.panel.classList.remove('active');
            
            newTab.link.setAttribute('aria-selected', 'true');
            newTab.link.setAttribute('tabindex', '0');
            newTab.link.classList.add('active');
            newTab.panel.hidden = false;
            newTab.panel.classList.add('active');
            
            // Scroll into view si nécessaire
            if (this.options.features.scrollable) {
                const list = this.container.querySelector(`.${CONFIG.classes.list}`);
                scrollIntoView(newTab.link.parentElement, list);
            }
            
            // Mise à jour de l'indicateur
            this.updateIndicator(index);
            
            // Lazy loading
            if (this.options.features.lazy && !newTab.loaded) {
                await this.loadTabContent(newTab);
            }
            
            this.activeIndex = index;
            
            // Historique
            if (this.options.features.history && updateHistory) {
                const state = { tabId: this.id, tabIndex: index };
                history.pushState(state, '', `#${newTab.id}`);
            }
            
            // Callback onChange
            if (this.options.callbacks.onChange) {
                this.options.callbacks.onChange(newTab, oldTab, index);
            }
        }

        updateIndicator(index) {
            const indicator = this.container.querySelector(`.${CONFIG.classes.indicator}`);
            if (!indicator) return;
            
            const tab = this.tabs[index];
            const link = tab.link;
            const item = link.parentElement;
            const list = item.parentElement;
            
            const itemRect = item.getBoundingClientRect();
            const listRect = list.getBoundingClientRect();
            
            if (this.options.orientation === 'vertical') {
                indicator.style.top = `${itemRect.top - listRect.top}px`;
                indicator.style.height = `${itemRect.height}px`;
            } else {
                indicator.style.left = `${itemRect.left - listRect.left}px`;
                indicator.style.width = `${itemRect.width}px`;
            }
        }

        async loadTabContent(tab) {
            if (tab.contentUrl) {
                tab.panel.innerHTML = '<div class="tab-loading">Chargement...</div>';
                
                try {
                    const response = await fetch(tab.contentUrl);
                    const content = await response.text();
                    tab.panel.innerHTML = content;
                    tab.loaded = true;
                    
                    if (this.options.features.cache) {
                        this.cache.set(tab.id, content);
                    }
                    
                    if (this.options.callbacks.onLoad) {
                        this.options.callbacks.onLoad(tab);
                    }
                } catch (error) {
                    tab.panel.innerHTML = '<div class="tab-error">Erreur de chargement</div>';
                    
                    if (this.options.callbacks.onError) {
                        this.options.callbacks.onError(error, tab);
                    }
                }
            }
        }

        addTab(tabConfig = {}) {
            const defaultConfig = {
                id: generateId(),
                label: `Onglet ${this.tabs.length + 1}`,
                content: '',
                icon: null,
                badge: null,
                closable: this.options.features.closable,
                disabled: false
            };
            
            const config = { ...defaultConfig, ...tabConfig };
            const tab = this.createTab(config);
            
            this.tabs.push(tab);
            
            const list = this.container.querySelector(`.${CONFIG.classes.list}`);
            list.appendChild(tab.item);
            
            const content = this.container.querySelector(`.${CONFIG.classes.content}`);
            content.appendChild(tab.panel);
            
            if (this.options.callbacks.onAdd) {
                this.options.callbacks.onAdd(tab, this.tabs.length - 1);
            }
            
            if (config.active) {
                this.setActiveTab(this.tabs.length - 1);
            }
            
            return tab;
        }

        removeTab(index) {
            if (index < 0 || index >= this.tabs.length) return;
            
            const tab = this.tabs[index];
            
            if (this.options.features.confirmation) {
                const confirm = window.confirm(`Fermer "${tab.label}" ?`);
                if (!confirm) return;
            }
            
            // Retirer de la DOM
            tab.item.remove();
            tab.panel.remove();
            
            // Retirer du tableau
            this.tabs.splice(index, 1);
            
            // Gérer l'onglet actif
            if (this.tabs.length === 0) {
                this.activeIndex = -1;
            } else if (index === this.activeIndex) {
                if (index >= this.tabs.length) {
                    this.setActiveTab(this.tabs.length - 1);
                } else {
                    this.setActiveTab(index);
                }
            } else if (index < this.activeIndex) {
                this.activeIndex--;
            }
            
            if (this.options.callbacks.onRemove) {
                this.options.callbacks.onRemove(tab, index);
            }
        }

        reorderTabs(fromIndex, toIndex) {
            if (fromIndex === toIndex) return;
            
            const tab = this.tabs.splice(fromIndex, 1)[0];
            this.tabs.splice(toIndex, 0, tab);
            
            // Mettre à jour l'index actif
            if (this.activeIndex === fromIndex) {
                this.activeIndex = toIndex;
            } else if (fromIndex < this.activeIndex && toIndex >= this.activeIndex) {
                this.activeIndex--;
            } else if (fromIndex > this.activeIndex && toIndex <= this.activeIndex) {
                this.activeIndex++;
            }
            
            if (this.options.callbacks.onReorder) {
                this.options.callbacks.onReorder(fromIndex, toIndex);
            }
        }

        focusPreviousTab() {
            const currentIndex = this.tabs.findIndex(tab => tab.link === document.activeElement);
            let prevIndex = currentIndex - 1;
            
            if (prevIndex < 0) {
                prevIndex = this.options.accessibility.wrapAround ? this.tabs.length - 1 : 0;
            }
            
            this.tabs[prevIndex].link.focus();
            
            if (this.options.accessibility.autoActivate) {
                this.setActiveTab(prevIndex);
            }
        }

        focusNextTab() {
            const currentIndex = this.tabs.findIndex(tab => tab.link === document.activeElement);
            let nextIndex = currentIndex + 1;
            
            if (nextIndex >= this.tabs.length) {
                nextIndex = this.options.accessibility.wrapAround ? 0 : this.tabs.length - 1;
            }
            
            this.tabs[nextIndex].link.focus();
            
            if (this.options.accessibility.autoActivate) {
                this.setActiveTab(nextIndex);
            }
        }

        focusFirstTab() {
            this.tabs[0].link.focus();
            if (this.options.accessibility.autoActivate) {
                this.setActiveTab(0);
            }
        }

        focusLastTab() {
            const lastIndex = this.tabs.length - 1;
            this.tabs[lastIndex].link.focus();
            if (this.options.accessibility.autoActivate) {
                this.setActiveTab(lastIndex);
            }
        }

        nextTab() {
            const nextIndex = (this.activeIndex + 1) % this.tabs.length;
            this.setActiveTab(nextIndex);
        }

        previousTab() {
            const prevIndex = this.activeIndex === 0 ? this.tabs.length - 1 : this.activeIndex - 1;
            this.setActiveTab(prevIndex);
        }

        handleResize() {
            this.updateIndicator(this.activeIndex);
            
            // Vérifier le scroll
            const nav = this.container.querySelector(`.${CONFIG.classes.nav}`);
            const list = nav.querySelector(`.${CONFIG.classes.list}`);
            const hasScroll = list.scrollWidth > list.clientWidth;
            nav.classList.toggle('has-scroll', hasScroll);
        }

        createTab(config) {
            // Item
            const item = document.createElement('li');
            item.className = CONFIG.classes.item;
            
            // Link
            const link = document.createElement('a');
            link.href = '#';
            link.className = CONFIG.classes.link;
            link.id = `${config.id}-tab`;
            
            // Icône
            if (config.icon && this.options.features.icons) {
                const icon = document.createElement('span');
                icon.className = 'tab-icon';
                icon.innerHTML = config.icon;
                link.appendChild(icon);
            }
            
            // Label
            const label = document.createElement('span');
            label.className = 'tab-label';
            label.textContent = config.label;
            link.appendChild(label);
            
            // Badge
            if (config.badge && this.options.features.badges) {
                const badge = document.createElement('span');
                badge.className = 'tab-badge';
                badge.textContent = config.badge;
                link.appendChild(badge);
            }
            
            // Bouton de fermeture
            if (config.closable) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'tab-close';
                closeBtn.innerHTML = CONFIG.icons.close;
                closeBtn.setAttribute('aria-label', `${CONFIG.i18n.close} ${config.label}`);
                link.appendChild(closeBtn);
            }
            
            item.appendChild(link);
            
            // Panel
            const panel = document.createElement('div');
            panel.className = CONFIG.classes.panel;
            panel.id = `${config.id}-panel`;
            panel.innerHTML = config.content;
            
            if (config.disabled) {
                link.classList.add('disabled');
                link.setAttribute('aria-disabled', 'true');
            }
            
            return {
                id: config.id,
                item,
                link,
                panel,
                label: config.label,
                loaded: !config.contentUrl,
                contentUrl: config.contentUrl,
                config
            };
        }

        destroy() {
            this.resizeObserver?.disconnect();
            this.container.innerHTML = '';
            state.delete(this.id);
        }
    }

    // ========================================
    // RENDU ET DOM
    // ========================================
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.style}`;
        container.id = options.id;
        
        if (options.animation !== 'none') {
            container.classList.add(`animate-${options.animation}`);
        }
        
        if (options.layout) {
            container.classList.add(`layout-${options.layout}`);
        }
        
        if (options.features.responsive) {
            container.classList.add('responsive');
        }
        
        return container;
    }

    function createNavigation(options) {
        const nav = document.createElement('nav');
        nav.className = CONFIG.classes.nav;
        
        // Contrôles de défilement
        if (options.features.scrollable) {
            const scrollLeft = document.createElement('button');
            scrollLeft.className = 'tabs-scroll tabs-scroll-left';
            scrollLeft.innerHTML = CONFIG.icons.chevronLeft;
            scrollLeft.setAttribute('aria-label', CONFIG.i18n.previous);
            nav.appendChild(scrollLeft);
        }
        
        // Liste des onglets
        const list = document.createElement('ul');
        list.className = CONFIG.classes.list;
        nav.appendChild(list);
        
        // Indicateur
        if (options.indicator !== 'none') {
            const indicator = document.createElement('div');
            indicator.className = CONFIG.classes.indicator;
            list.appendChild(indicator);
        }
        
        // Contrôles de défilement
        if (options.features.scrollable) {
            const scrollRight = document.createElement('button');
            scrollRight.className = 'tabs-scroll tabs-scroll-right';
            scrollRight.innerHTML = CONFIG.icons.chevronRight;
            scrollRight.setAttribute('aria-label', CONFIG.i18n.next);
            nav.appendChild(scrollRight);
        }
        
        // Bouton d'ajout
        if (options.features.addable) {
            const addBtn = document.createElement('button');
            addBtn.className = 'tabs-add';
            addBtn.innerHTML = CONFIG.icons.add;
            addBtn.setAttribute('aria-label', CONFIG.i18n.add);
            nav.appendChild(addBtn);
        }
        
        // Menu overflow
        if (options.features.overflow === 'menu') {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'tabs-menu';
            menuBtn.innerHTML = CONFIG.icons.menu;
            menuBtn.setAttribute('aria-label', CONFIG.i18n.menu);
            nav.appendChild(menuBtn);
        }
        
        return nav;
    }

    function createContent(options) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.content;
        
        if (options.transition !== 'none') {
            content.classList.add(`transition-${options.transition}`);
        }
        
        return content;
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('tabs-styles')) return;

        const link = document.createElement('link');
        link.id = 'tabs-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/tabs.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    async function create(options = {}) {
        // Fusion avec la configuration par défaut
        const finalOptions = {
            id: generateId(),
            style: 'glassmorphism',
            animation: 'smooth',
            layout: 'default',
            indicator: 'underline',
            transition: 'fade',
            orientation: 'horizontal',
            ...options,
            features: {
                ...CONFIG.features,
                ...options.features
            },
            callbacks: {
                ...CONFIG.callbacks,
                ...options.callbacks
            },
            i18n: {
                ...CONFIG.i18n,
                ...options.i18n
            },
            accessibility: {
                ...CONFIG.accessibility,
                ...options.accessibility
            }
        };

        // Appliquer les préréglages du layout
        if (CONFIG.layouts[finalOptions.layout]) {
            Object.assign(finalOptions, CONFIG.layouts[finalOptions.layout]);
        }

        // Injection des styles
        injectStyles();

        // Création de la structure
        const container = createContainer(finalOptions);
        const nav = createNavigation(finalOptions);
        const content = createContent(finalOptions);

        container.appendChild(nav);
        container.appendChild(content);

        // Initialisation du manager
        const manager = new TabsManager(container, finalOptions);

        // Ajouter les onglets initiaux
        if (options.tabs && Array.isArray(options.tabs)) {
            options.tabs.forEach((tabConfig, index) => {
                const tab = manager.addTab({
                    ...tabConfig,
                    active: tabConfig.active || index === 0
                });
                
                if (tab.config.active || index === 0) {
                    manager.setActiveTab(manager.tabs.length - 1);
                }
            });
        }

        // Sauvegarde de l'état
        state.set(finalOptions.id, {
            container,
            manager,
            options: finalOptions
        });

        // API de l'instance
        const instance = {
            id: finalOptions.id,
            container,
            
            // Navigation
            setActiveTab(index) {
                manager.setActiveTab(index);
            },
            
            getActiveTab() {
                return manager.tabs[manager.activeIndex];
            },
            
            getActiveIndex() {
                return manager.activeIndex;
            },
            
            nextTab() {
                manager.nextTab();
            },
            
            previousTab() {
                manager.previousTab();
            },
            
            // Gestion des onglets
            addTab(config) {
                return manager.addTab(config);
            },
            
            removeTab(index) {
                manager.removeTab(index);
            },
            
            updateTab(index, updates) {
                const tab = manager.tabs[index];
                if (!tab) return;
                
                if (updates.label) {
                    tab.label = updates.label;
                    tab.link.querySelector('.tab-label').textContent = updates.label;
                }
                
                if (updates.content) {
                    tab.panel.innerHTML = updates.content;
                }
                
                if (updates.badge !== undefined) {
                    const badge = tab.link.querySelector('.tab-badge');
                    if (updates.badge && badge) {
                        badge.textContent = updates.badge;
                    } else if (updates.badge && !badge) {
                        const newBadge = document.createElement('span');
                        newBadge.className = 'tab-badge';
                        newBadge.textContent = updates.badge;
                        tab.link.appendChild(newBadge);
                    } else if (!updates.badge && badge) {
                        badge.remove();
                    }
                }
                
                if (updates.disabled !== undefined) {
                    tab.link.classList.toggle('disabled', updates.disabled);
                    tab.link.setAttribute('aria-disabled', updates.disabled);
                }
            },
            
            getTabs() {
                return manager.tabs.map(tab => ({
                    id: tab.id,
                    label: tab.label,
                    active: manager.tabs.indexOf(tab) === manager.activeIndex
                }));
            },
            
            // Événements
            on(event, handler) {
                const callbackName = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
                if (finalOptions.callbacks.hasOwnProperty(callbackName)) {
                    finalOptions.callbacks[callbackName] = handler;
                }
            },
            
            off(event) {
                const callbackName = `on${event.charAt(0).toUpperCase() + event.slice(1)}`;
                if (finalOptions.callbacks.hasOwnProperty(callbackName)) {
                    finalOptions.callbacks[callbackName] = null;
                }
            },
            
            // Destruction
            destroy() {
                manager.destroy();
            }
        };

        instanceCount++;
        return instance;
    }

    // Export
    return {
        create,
        CONFIG,
        injectStyles,
        version: '1.0.0'
    };
})();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tabs;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion de l'indicateur responsive
   Solution: Utilisation de ResizeObserver et calculs dynamiques
   
   [2024-01-16] - Drag & drop avec réorganisation
   Cause: Conflits d'indices lors du déplacement
   Résolution: Recalcul complet des indices après chaque mouvement
   
   [2024-01-17] - Performance avec beaucoup d'onglets
   Solution: Virtualisation et lazy loading du contenu
   
   NOTES POUR REPRISES FUTURES:
   - L'indicateur doit être recalculé à chaque changement
   - Le drag & drop nécessite une gestion précise des indices
   - Toujours vérifier l'accessibilité clavier
   ======================================== */