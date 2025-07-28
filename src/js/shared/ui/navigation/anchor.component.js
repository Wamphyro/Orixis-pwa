/* ========================================
   ANCHOR.COMPONENT.JS - Système de navigation par ancres
   Chemin: src/js/shared/ui/navigation/anchor.component.js
   
   DESCRIPTION:
   Système complet de navigation par ancres avec scroll spy,
   génération automatique de table des matières, indicateurs de progression
   et multiples styles d'affichage avec effet glassmorphism.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-250)
   2. Gestion du scroll et intersection (lignes 252-450)
   3. Création de la navigation (lignes 452-750)
   4. Génération automatique (lignes 752-950)
   5. Animations et interactions (lignes 952-1200)
   6. API publique (lignes 1202-1400)
   
   DÉPENDANCES:
   - anchor.css (styles associés)
   - Aucune dépendance externe
   ======================================== */

const Anchor = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'style-glassmorphism',
                blur: 20,
                opacity: 0.08
            },
            'neumorphism': {
                class: 'style-neumorphism'
            },
            'flat': {
                class: 'style-flat'
            },
            'minimal': {
                class: 'style-minimal'
            },
            'material': {
                class: 'style-material'
            },
            'outline': {
                class: 'style-outline'
            },
            'gradient': {
                class: 'style-gradient'
            }
        },
        
        // Types d'affichage
        types: {
            'sidebar': {
                class: 'type-sidebar',
                position: 'fixed',
                showProgress: true,
                showNumbers: true
            },
            'floating': {
                class: 'type-floating',
                position: 'fixed',
                collapsible: true,
                showTooltips: true
            },
            'inline': {
                class: 'type-inline',
                position: 'relative',
                expandable: true
            },
            'dots': {
                class: 'type-dots',
                position: 'fixed',
                minimal: true,
                showTooltips: true
            },
            'progress': {
                class: 'type-progress',
                position: 'fixed',
                progressOnly: true
            },
            'timeline': {
                class: 'type-timeline',
                position: 'fixed',
                showDates: true,
                vertical: true
            },
            'breadcrumb': {
                class: 'type-breadcrumb',
                position: 'sticky',
                horizontal: true,
                compact: true
            },
            'tabs': {
                class: 'type-tabs',
                position: 'sticky',
                horizontal: true,
                showIcons: true
            }
        },
        
        // Positions disponibles
        positions: {
            'left': {
                class: 'position-left',
                offset: { left: 20, top: '50%' }
            },
            'right': {
                class: 'position-right',
                offset: { right: 20, top: '50%' }
            },
            'top': {
                class: 'position-top',
                offset: { top: 20, left: '50%' }
            },
            'bottom': {
                class: 'position-bottom',
                offset: { bottom: 20, left: '50%' }
            },
            'top-left': {
                class: 'position-top-left',
                offset: { top: 20, left: 20 }
            },
            'top-right': {
                class: 'position-top-right',
                offset: { top: 20, right: 20 }
            },
            'bottom-left': {
                class: 'position-bottom-left',
                offset: { bottom: 20, left: 20 }
            },
            'bottom-right': {
                class: 'position-bottom-right',
                offset: { bottom: 20, right: 20 }
            }
        },
        
        // Animations
        animations: {
            'none': {
                duration: 0
            },
            'fade': {
                duration: 300,
                easing: 'ease-out'
            },
            'slide': {
                duration: 350,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'bounce': {
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            'scale': {
                duration: 400,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }
        },
        
        // Options de scroll
        scrollOptions: {
            smooth: {
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            },
            instant: {
                behavior: 'instant',
                block: 'start',
                inline: 'nearest'
            },
            center: {
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            }
        },
        
        // Configuration Intersection Observer
        observerOptions: {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        },
        
        // Icônes prédéfinies
        icons: {
            arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
            chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
            dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>',
            hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
            bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
            pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
        },
        
        // Options par défaut
        defaults: {
            type: 'sidebar',
            style: 'glassmorphism',
            position: 'right',
            animation: 'fade',
            icon: 'arrow',
            offset: 100,
            scrollBehavior: 'smooth',
            autoGenerate: true,
            selector: 'h2, h3',
            showProgress: true,
            showNumbers: false,
            showTooltips: true,
            highlightActive: true,
            collapsible: false,
            collapsed: false,
            hideOnScroll: false,
            updateUrl: true,
            sticky: false,
            maxDepth: 3,
            minItems: 2,
            rtl: false
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = {
        instances: new Map(),
        activeInstance: null,
        observers: new Map(),
        scrollHandlers: new Map(),
        resizeHandlers: new Map(),
        idCounter: 0
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    function generateId() {
        return `anchor-nav-${++state.idCounter}`;
    }

    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/[\s\W-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    function getScrollProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const trackLength = documentHeight - windowHeight;
        
        return Math.min(scrollTop / trackLength, 1);
    }

    // ========================================
    // GÉNÉRATION AUTOMATIQUE DES ANCRES
    // ========================================
    function generateAnchors(container, options) {
        const elements = container.querySelectorAll(options.selector);
        const anchors = [];
        
        elements.forEach((element, index) => {
            // Générer un ID si nécessaire
            if (!element.id) {
                element.id = slugify(element.textContent) || `section-${index + 1}`;
            }
            
            // Déterminer le niveau (h1=1, h2=2, etc.)
            const level = parseInt(element.tagName.charAt(1)) || 1;
            
            // Ignorer si dépasse la profondeur max
            if (level > options.maxDepth) return;
            
            // Créer l'objet ancre
            const anchor = {
                id: element.id,
                text: element.textContent.trim(),
                level: level,
                element: element,
                offset: element.offsetTop,
                icon: options.icons && options.icons[index] || null,
                number: index + 1
            };
            
            // Ajouter des métadonnées si disponibles
            if (element.dataset.anchorTitle) {
                anchor.title = element.dataset.anchorTitle;
            }
            
            if (element.dataset.anchorIcon) {
                anchor.icon = element.dataset.anchorIcon;
            }
            
            if (element.dataset.anchorDate) {
                anchor.date = element.dataset.anchorDate;
            }
            
            anchors.push(anchor);
        });
        
        return anchors;
    }

    // ========================================
    // CRÉATION DE LA NAVIGATION
    // ========================================
    function createAnchorNav(options) {
        const nav = document.createElement('nav');
        const id = generateId();
        
        // Classes
        const classes = [
            'anchor-nav',
            CONFIG.types[options.type].class,
            CONFIG.styles[options.style].class,
            CONFIG.positions[options.position].class
        ];
        
        if (options.className) {
            classes.push(options.className);
        }
        
        if (options.collapsed) {
            classes.push('collapsed');
        }
        
        if (options.rtl) {
            classes.push('rtl');
        }
        
        nav.className = classes.join(' ');
        nav.id = id;
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', options.ariaLabel || 'Navigation par ancres');
        
        // Structure interne
        let html = '<div class="anchor-nav-container">';
        
        // Header (pour types avec header)
        if (options.title || options.collapsible) {
            html += '<div class="anchor-nav-header">';
            
            if (options.title) {
                html += `<h3 class="anchor-nav-title">${options.title}</h3>`;
            }
            
            if (options.collapsible) {
                html += `
                    <button class="anchor-nav-toggle" aria-label="Réduire/Agrandir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                `;
            }
            
            html += '</div>';
        }
        
        // Progress bar (si activée)
        if (options.showProgress && !CONFIG.types[options.type].progressOnly) {
            html += `
                <div class="anchor-nav-progress">
                    <div class="anchor-nav-progress-bar"></div>
                </div>
            `;
        }
        
        // Liste des ancres
        html += '<div class="anchor-nav-list">';
        
        // Contenu sera ajouté dynamiquement
        
        html += '</div>'; // anchor-nav-list
        
        // Footer (optionnel)
        if (options.footer) {
            html += `<div class="anchor-nav-footer">${options.footer}</div>`;
        }
        
        html += '</div>'; // anchor-nav-container
        
        // Progress uniquement (type progress)
        if (CONFIG.types[options.type].progressOnly) {
            html = `
                <div class="anchor-nav-container">
                    <div class="anchor-progress-track">
                        <div class="anchor-progress-fill"></div>
                        <div class="anchor-progress-tooltip">0%</div>
                    </div>
                </div>
            `;
        }
        
        nav.innerHTML = html;
        
        return { nav, id };
    }

    // ========================================
    // CRÉATION DES ITEMS
    // ========================================
    function createAnchorItems(anchors, options) {
        const fragment = document.createDocumentFragment();
        
        anchors.forEach((anchor, index) => {
            const item = createAnchorItem(anchor, index, options);
            fragment.appendChild(item);
        });
        
        return fragment;
    }

    function createAnchorItem(anchor, index, options) {
        const item = document.createElement('div');
        item.className = `anchor-nav-item level-${anchor.level}`;
        item.dataset.target = anchor.id;
        
        // Lien
        const link = document.createElement('a');
        link.href = `#${anchor.id}`;
        link.className = 'anchor-nav-link';
        link.setAttribute('aria-label', anchor.title || anchor.text);
        
        // Contenu du lien selon le type
        let linkContent = '';
        
        // Numéro
        if (options.showNumbers) {
            linkContent += `<span class="anchor-nav-number">${anchor.number}</span>`;
        }
        
        // Icône
        if (anchor.icon || options.icon) {
            const iconHtml = CONFIG.icons[anchor.icon] || CONFIG.icons[options.icon] || anchor.icon;
            linkContent += `<span class="anchor-nav-icon">${iconHtml}</span>`;
        }
        
        // Texte
        if (!CONFIG.types[options.type].minimal) {
            linkContent += `<span class="anchor-nav-text">${anchor.text}</span>`;
        }
        
        // Date (pour timeline)
        if (anchor.date && CONFIG.types[options.type].showDates) {
            linkContent += `<span class="anchor-nav-date">${anchor.date}</span>`;
        }
        
        // Progress indicator
        if (options.showProgress && CONFIG.types[options.type].showProgress) {
            linkContent += '<span class="anchor-nav-progress-indicator"></span>';
        }
        
        link.innerHTML = linkContent;
        item.appendChild(link);
        
        // Tooltip
        if (options.showTooltips && CONFIG.types[options.type].showTooltips) {
            const tooltip = document.createElement('div');
            tooltip.className = 'anchor-nav-tooltip';
            tooltip.textContent = anchor.title || anchor.text;
            item.appendChild(tooltip);
        }
        
        // Sub-items (pour navigation hiérarchique)
        if (anchor.children && anchor.children.length > 0) {
            const subList = document.createElement('div');
            subList.className = 'anchor-nav-sublist';
            
            anchor.children.forEach((child, childIndex) => {
                const subItem = createAnchorItem(child, childIndex, options);
                subList.appendChild(subItem);
            });
            
            item.appendChild(subList);
            item.classList.add('has-children');
        }
        
        return item;
    }

    // ========================================
    // GESTION DU SCROLL SPY
    // ========================================
    function setupScrollSpy(instance) {
        const { container, options, anchors } = instance;
        
        // Intersection Observer pour détecter la section visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const id = entry.target.id;
                const navItem = container.querySelector(`[data-target="${id}"]`);
                
                if (entry.isIntersecting) {
                    // Marquer comme actif
                    setActiveAnchor(instance, id);
                }
            });
        }, CONFIG.observerOptions);
        
        // Observer toutes les sections
        anchors.forEach(anchor => {
            if (anchor.element) {
                observer.observe(anchor.element);
            }
        });
        
        state.observers.set(instance.id, observer);
        
        // Scroll handler pour progress et hide on scroll
        const scrollHandler = throttle(() => {
            handleScroll(instance);
        }, 100);
        
        window.addEventListener('scroll', scrollHandler);
        state.scrollHandlers.set(instance.id, scrollHandler);
        
        // Initial check
        handleScroll(instance);
    }

    function handleScroll(instance) {
        const { container, options } = instance;
        
        // Update progress
        if (options.showProgress) {
            updateProgress(instance);
        }
        
        // Hide on scroll
        if (options.hideOnScroll) {
            handleHideOnScroll(instance);
        }
    }

    function setActiveAnchor(instance, anchorId) {
        const { container, options } = instance;
        
        // Retirer l'ancienne classe active
        container.querySelectorAll('.anchor-nav-item.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // Ajouter la nouvelle classe active
        const activeItem = container.querySelector(`[data-target="${anchorId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            
            // Mettre à jour l'URL si activé
            if (options.updateUrl) {
                history.replaceState(null, null, `#${anchorId}`);
            }
            
            // Faire défiler la navigation si nécessaire
            ensureVisible(activeItem, container);
        }
        
        // Émettre un événement
        container.dispatchEvent(new CustomEvent('anchorChange', {
            detail: { anchorId, instance: instance.id }
        }));
    }

    function ensureVisible(item, container) {
        const list = container.querySelector('.anchor-nav-list');
        if (!list) return;
        
        const itemRect = item.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        
        if (itemRect.top < listRect.top || itemRect.bottom > listRect.bottom) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // ========================================
    // GESTION DE LA PROGRESSION
    // ========================================
    function updateProgress(instance) {
        const { container, options } = instance;
        const progress = getScrollProgress();
        
        // Progress bar générale
        const progressBar = container.querySelector('.anchor-nav-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
        
        // Progress fill (type progress)
        const progressFill = container.querySelector('.anchor-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${progress * 100}%`;
            
            const tooltip = container.querySelector('.anchor-progress-tooltip');
            if (tooltip) {
                tooltip.textContent = `${Math.round(progress * 100)}%`;
                tooltip.style.left = `${progress * 100}%`;
            }
        }
        
        // Progress par section
        if (options.showProgress && CONFIG.types[options.type].showProgress) {
            updateSectionProgress(instance);
        }
    }

    function updateSectionProgress(instance) {
        const { anchors, container } = instance;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        
        anchors.forEach((anchor, index) => {
            const element = anchor.element;
            if (!element) return;
            
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top + scrollTop;
            const elementHeight = rect.height;
            
            // Calculer la progression de cette section
            let sectionProgress = 0;
            if (scrollTop >= elementTop - windowHeight && scrollTop <= elementTop + elementHeight) {
                const relativeScroll = scrollTop - (elementTop - windowHeight);
                const totalDistance = elementHeight + windowHeight;
                sectionProgress = Math.min(Math.max(relativeScroll / totalDistance, 0), 1);
            } else if (scrollTop > elementTop + elementHeight) {
                sectionProgress = 1;
            }
            
            // Mettre à jour l'indicateur
            const navItem = container.querySelector(`[data-target="${anchor.id}"]`);
            if (navItem) {
                const indicator = navItem.querySelector('.anchor-nav-progress-indicator');
                if (indicator) {
                    indicator.style.setProperty('--progress', sectionProgress);
                }
            }
        });
    }

    // ========================================
    // HIDE ON SCROLL
    // ========================================
    let lastScrollTop = 0;
    let hideTimeout = null;

    function handleHideOnScroll(instance) {
        const { container } = instance;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        clearTimeout(hideTimeout);
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            container.classList.add('hidden');
        } else {
            // Scrolling up
            container.classList.remove('hidden');
        }
        
        // Auto-hide après un délai
        hideTimeout = setTimeout(() => {
            if (scrollTop > 100) {
                container.classList.add('hidden');
            }
        }, 3000);
        
        lastScrollTop = scrollTop;
    }

    // ========================================
    // INTERACTIONS
    // ========================================
    function attachEventHandlers(instance) {
        const { container, options } = instance;
        
        // Click sur les liens
        container.addEventListener('click', (e) => {
            const link = e.target.closest('.anchor-nav-link');
            if (!link) return;
            
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToAnchor(targetId, options);
        });
        
        // Toggle collapse
        const toggleBtn = container.querySelector('.anchor-nav-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                toggleCollapse(instance);
            });
        }
        
        // Hover effects
        if (options.showTooltips) {
            container.querySelectorAll('.anchor-nav-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    showTooltip(item);
                });
                
                item.addEventListener('mouseleave', () => {
                    hideTooltip(item);
                });
            });
        }
        
        // Keyboard navigation
        container.addEventListener('keydown', (e) => {
            handleKeyboardNavigation(e, instance);
        });
        
        // Resize handler
        const resizeHandler = throttle(() => {
            updateAnchorsOffset(instance);
        }, 300);
        
        window.addEventListener('resize', resizeHandler);
        state.resizeHandlers.set(instance.id, resizeHandler);
    }

    function scrollToAnchor(anchorId, options) {
        const element = document.getElementById(anchorId);
        if (!element) return;
        
        const offset = options.offset || 0;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const targetPosition = elementTop - offset;
        
        // Utiliser la méthode native si supportée
        if ('scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetPosition,
                ...CONFIG.scrollOptions[options.scrollBehavior]
            });
        } else {
            // Fallback avec animation manuelle
            smoothScrollTo(targetPosition, 500);
        }
    }

    function smoothScrollTo(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        
        function animation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }

    function toggleCollapse(instance) {
        const { container } = instance;
        container.classList.toggle('collapsed');
        
        const isCollapsed = container.classList.contains('collapsed');
        localStorage.setItem(`anchor-nav-collapsed-${instance.id}`, isCollapsed);
    }

    function showTooltip(item) {
        const tooltip = item.querySelector('.anchor-nav-tooltip');
        if (tooltip) {
            tooltip.classList.add('visible');
        }
    }

    function hideTooltip(item) {
        const tooltip = item.querySelector('.anchor-nav-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    function handleKeyboardNavigation(e, instance) {
        const { container } = instance;
        const items = Array.from(container.querySelectorAll('.anchor-nav-item'));
        const activeItem = container.querySelector('.anchor-nav-item.active');
        const currentIndex = items.indexOf(activeItem);
        
        let newIndex = -1;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                break;
                
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
                
            case 'End':
                e.preventDefault();
                newIndex = items.length - 1;
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (activeItem) {
                    const link = activeItem.querySelector('.anchor-nav-link');
                    if (link) link.click();
                }
                break;
        }
        
        if (newIndex >= 0 && items[newIndex]) {
            const targetId = items[newIndex].dataset.target;
            setActiveAnchor(instance, targetId);
            scrollToAnchor(targetId, instance.options);
        }
    }

    function updateAnchorsOffset(instance) {
        const { anchors } = instance;
        
        anchors.forEach(anchor => {
            if (anchor.element) {
                anchor.offset = anchor.element.offsetTop;
            }
        });
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Création
        create(options = {}) {
            // Fusionner avec les défauts
            const opts = { ...CONFIG.defaults, ...options };
            
            // Container cible
            const targetContainer = opts.container ? 
                (typeof opts.container === 'string' ? 
                    document.querySelector(opts.container) : opts.container) :
                document.body;
            
            // Générer les ancres si nécessaire
            let anchors = opts.anchors || [];
            if (opts.autoGenerate && anchors.length === 0) {
                anchors = generateAnchors(targetContainer, opts);
            }
            
            // Ne pas créer si pas assez d'items
            if (anchors.length < opts.minItems) {
                return null;
            }
            
            // Créer la navigation
            const { nav, id } = createAnchorNav(opts);
            
            // Ajouter les items
            const list = nav.querySelector('.anchor-nav-list');
            if (list) {
                const items = createAnchorItems(anchors, opts);
                list.appendChild(items);
            }
            
            // Créer l'instance
            const instance = {
                id,
                container: nav,
                options: opts,
                anchors,
                targetContainer
            };
            
            // Attacher les événements
            attachEventHandlers(instance);
            
            // Setup scroll spy
            if (opts.highlightActive) {
                setupScrollSpy(instance);
            }
            
            // Restaurer l'état collapsed
            const savedCollapsed = localStorage.getItem(`anchor-nav-collapsed-${id}`);
            if (savedCollapsed === 'true') {
                nav.classList.add('collapsed');
            }
            
            // Stocker l'instance
            state.instances.set(id, instance);
            state.activeInstance = id;
            
            // Animation d'entrée
            requestAnimationFrame(() => {
                nav.classList.add('visible');
            });
            
            return {
                id,
                container: nav,
                render: (target) => this.render(id, target),
                update: () => this.update(id),
                destroy: () => this.destroy(id),
                scrollTo: (anchorId) => this.scrollTo(id, anchorId),
                setActive: (anchorId) => this.setActive(id, anchorId),
                addAnchor: (anchor) => this.addAnchor(id, anchor),
                removeAnchor: (anchorId) => this.removeAnchor(id, anchorId),
                on: (event, handler) => this.on(id, event, handler)
            };
        },
        
        // Rendu
        render(id, target) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            const targetElement = typeof target === 'string' ? 
                document.querySelector(target) : target;
                
            if (targetElement) {
                targetElement.appendChild(instance.container);
            }
        },
        
        // Mise à jour
        update(id) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            // Régénérer les ancres
            if (instance.options.autoGenerate) {
                const newAnchors = generateAnchors(instance.targetContainer, instance.options);
                instance.anchors = newAnchors;
                
                // Recréer les items
                const list = instance.container.querySelector('.anchor-nav-list');
                if (list) {
                    list.innerHTML = '';
                    const items = createAnchorItems(newAnchors, instance.options);
                    list.appendChild(items);
                }
                
                // Réinitialiser l'observer
                if (instance.options.highlightActive) {
                    const oldObserver = state.observers.get(id);
                    if (oldObserver) {
                        oldObserver.disconnect();
                    }
                    setupScrollSpy(instance);
                }
            }
            
            // Mettre à jour les offsets
            updateAnchorsOffset(instance);
        },
        
        // Navigation
        scrollTo(id, anchorId) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            scrollToAnchor(anchorId, instance.options);
        },
        
        setActive(id, anchorId) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            setActiveAnchor(instance, anchorId);
        },
        
        // Gestion des ancres
        addAnchor(id, anchor) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            instance.anchors.push(anchor);
            
            const list = instance.container.querySelector('.anchor-nav-list');
            if (list) {
                const item = createAnchorItem(anchor, instance.anchors.length - 1, instance.options);
                list.appendChild(item);
            }
        },
        
        removeAnchor(id, anchorId) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            instance.anchors = instance.anchors.filter(a => a.id !== anchorId);
            
            const item = instance.container.querySelector(`[data-target="${anchorId}"]`);
            if (item) {
                item.remove();
            }
        },
        
        // Événements
        on(id, event, handler) {
            const instance = state.instances.get(id);
            if (instance) {
                instance.container.addEventListener(event, handler);
            }
        },
        
        // Destruction
        destroy(id) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            // Nettoyer les observers
            const observer = state.observers.get(id);
            if (observer) {
                observer.disconnect();
                state.observers.delete(id);
            }
            
            // Nettoyer les event listeners
            const scrollHandler = state.scrollHandlers.get(id);
            if (scrollHandler) {
                window.removeEventListener('scroll', scrollHandler);
                state.scrollHandlers.delete(id);
            }
            
            const resizeHandler = state.resizeHandlers.get(id);
            if (resizeHandler) {
                window.removeEventListener('resize', resizeHandler);
                state.resizeHandlers.delete(id);
            }
            
            // Supprimer du DOM
            instance.container.remove();
            
            // Nettoyer l'état
            state.instances.delete(id);
            
            if (state.activeInstance === id) {
                state.activeInstance = null;
            }
        },
        
        // Configuration
        setDefaults(defaults) {
            Object.assign(CONFIG.defaults, defaults);
        },
        
        getConfig() {
            return { ...CONFIG };
        },
        
        // Injection des styles
        injectStyles() {
            if (document.getElementById('anchor-styles')) return;
            
            const link = document.createElement('link');
            link.id = 'anchor-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/anchor.css';
            document.head.appendChild(link);
        }
    };
})();

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Anchor;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Performance scroll spy avec beaucoup d'ancres
   Solution: Throttle + Intersection Observer
   
   [2024-01] - Calcul de progression complexe
   Cause: Sections de hauteurs variables
   Résolution: Calcul relatif par section
   
   [2024-01] - Navigation clavier incomplète
   Solution: Support complet Arrow/Home/End/Enter
   
   NOTES POUR REPRISES FUTURES:
   - L'Intersection Observer gère le scroll spy
   - Les offsets sont mis à jour au resize
   - Le système supporte la génération automatique
   - Les états sont persistés dans localStorage
   ======================================== */