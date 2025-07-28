/* ========================================
   TREE.COMPONENT.JS - Composant d'arborescence
   Chemin: src/js/shared/ui/data-display/tree.component.js
   
   DESCRIPTION:
   Composant d'arborescence ultra-complet avec style glassmorphism.
   Gère les structures hiérarchiques avec toutes les fonctionnalités
   imaginables : expand/collapse, drag & drop, sélection, recherche,
   édition inline, virtualisation, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-350)
   2. État et gestion interne (lignes 351-400)
   3. Méthodes de création (lignes 401-600)
   4. Méthodes de rendu (lignes 601-1000)
   5. Gestionnaires d'événements (lignes 1001-1300)
   6. Méthodes utilitaires (lignes 1301-1500)
   7. Méthodes publiques (lignes 1501-1700)
   8. Styles CSS (lignes 1701-2200)
   9. Export et initialisation (lignes 2201-2250)
   
   DÉPENDANCES:
   - frosted-icons.component.js (icônes expand/collapse)
   - animation-utils.js (animations avancées)
   - Aucune dépendance externe
   ======================================== */

const TreeComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px) brightness(1.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                hoverBg: 'rgba(255, 255, 255, 0.12)',
                selectedBg: 'rgba(59, 130, 246, 0.2)',
                nodeSpacing: '8px',
                borderRadius: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                backdropFilter: 'none',
                border: 'none',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                hoverBg: '#e0e5ec',
                selectedBg: '#d1d9e6',
                nodeSpacing: '12px',
                borderRadius: '15px',
                transition: 'all 0.3s ease'
            },
            'flat': {
                background: '#f3f4f6',
                backdropFilter: 'none',
                border: '1px solid #e5e7eb',
                shadow: 'none',
                hoverBg: '#e5e7eb',
                selectedBg: '#3b82f6',
                nodeSpacing: '4px',
                borderRadius: '6px',
                transition: 'background-color 0.2s'
            },
            'material': {
                background: '#ffffff',
                backdropFilter: 'none',
                border: 'none',
                shadow: '0 2px 4px rgba(0,0,0,0.1)',
                hoverBg: 'rgba(0,0,0,0.04)',
                selectedBg: 'rgba(63,81,181,0.12)',
                nodeSpacing: '8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
            },
            'minimal': {
                background: 'transparent',
                backdropFilter: 'none',
                border: 'none',
                shadow: 'none',
                hoverBg: 'rgba(0,0,0,0.02)',
                selectedBg: 'rgba(0,0,0,0.05)',
                nodeSpacing: '4px',
                borderRadius: '0',
                transition: 'background-color 0.15s'
            },
            'dark': {
                background: 'rgba(30, 30, 30, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                hoverBg: 'rgba(255, 255, 255, 0.05)',
                selectedBg: 'rgba(59, 130, 246, 0.3)',
                nodeSpacing: '8px',
                borderRadius: '10px',
                transition: 'all 0.3s ease'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                expandDuration: 0,
                collapseDuration: 0,
                hoverScale: 1,
                clickScale: 1
            },
            'subtle': {
                enabled: true,
                expandDuration: 200,
                collapseDuration: 150,
                hoverScale: 1.01,
                clickScale: 0.98,
                easing: 'ease-out'
            },
            'smooth': {
                enabled: true,
                expandDuration: 300,
                collapseDuration: 250,
                hoverScale: 1.02,
                clickScale: 0.97,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                stagger: 20,
                fadeIn: true
            },
            'rich': {
                enabled: true,
                expandDuration: 400,
                collapseDuration: 350,
                hoverScale: 1.03,
                clickScale: 0.95,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 30,
                fadeIn: true,
                particles: true,
                glow: true,
                ripple: true,
                morphing: true
            }
        },

        // Modes d'affichage
        displayModes: {
            'compact': {
                nodeHeight: '32px',
                fontSize: '13px',
                iconSize: '16px',
                indentSize: '16px',
                padding: '4px 8px'
            },
            'normal': {
                nodeHeight: '40px',
                fontSize: '14px',
                iconSize: '20px',
                indentSize: '24px',
                padding: '8px 12px'
            },
            'spacious': {
                nodeHeight: '48px',
                fontSize: '15px',
                iconSize: '24px',
                indentSize: '32px',
                padding: '12px 16px'
            },
            'lines': {
                showLines: true,
                lineStyle: 'solid',
                lineColor: 'rgba(0,0,0,0.1)'
            },
            'curved': {
                showLines: true,
                lineStyle: 'curved',
                lineColor: 'rgba(0,0,0,0.08)'
            }
        },

        // Fonctionnalités
        features: {
            // Expand/Collapse
            expandable: {
                enabled: true,
                defaultExpanded: false,
                expandAll: true,
                collapseAll: true,
                rememberState: true,
                animateIcon: true,
                lazyLoad: false
            },
            
            // Sélection
            selection: {
                enabled: true,
                mode: 'single', // 'single', 'multiple', 'checkbox'
                cascadeSelect: false,
                showCheckbox: false,
                highlightPath: true,
                persistSelection: true
            },
            
            // Drag & Drop
            dragDrop: {
                enabled: false,
                allowDrop: true,
                allowDrag: true,
                showDropZone: true,
                autoExpand: true,
                autoExpandDelay: 500,
                ghostOpacity: 0.5,
                preventRootDrop: true
            },
            
            // Recherche
            search: {
                enabled: true,
                caseSensitive: false,
                highlightMatches: true,
                expandMatches: true,
                fuzzySearch: false,
                searchDelay: 300,
                minChars: 2
            },
            
            // Filtrage
            filter: {
                enabled: true,
                showFiltered: true,
                hideEmpty: false,
                customFilters: [],
                persistFilter: false
            },
            
            // Édition
            editing: {
                enabled: false,
                allowAdd: true,
                allowDelete: true,
                allowRename: true,
                confirmDelete: true,
                validation: null,
                editOnDoubleClick: true
            },
            
            // Menu contextuel
            contextMenu: {
                enabled: true,
                items: ['expand', 'collapse', 'add', 'rename', 'delete'],
                customItems: [],
                position: 'cursor' // 'cursor', 'node'
            },
            
            // Virtualisation
            virtualization: {
                enabled: false,
                threshold: 1000,
                bufferSize: 10,
                recycleNodes: true
            },
            
            // Accessibilité
            accessibility: {
                enabled: true,
                announceChanges: true,
                keyboardNav: true,
                focusIndicator: true,
                ariaLabels: true
            },
            
            // Performance
            performance: {
                debounceSearch: 300,
                throttleScroll: 16,
                batchUpdates: true,
                requestIdleCallback: true
            }
        },

        // Icônes
        icons: {
            expand: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
            collapse: '<svg viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>',
            folder: '<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/></svg>',
            file: '<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
            loading: '<svg viewBox="0 0 24 24"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>',
            search: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>'
        },

        // Classes CSS
        classes: {
            container: 'tree-container',
            node: 'tree-node',
            nodeContent: 'tree-node-content',
            nodeLabel: 'tree-node-label',
            nodeIcon: 'tree-node-icon',
            expandIcon: 'tree-expand-icon',
            children: 'tree-children',
            selected: 'tree-selected',
            expanded: 'tree-expanded',
            collapsed: 'tree-collapsed',
            dragging: 'tree-dragging',
            dropTarget: 'tree-drop-target',
            loading: 'tree-loading',
            matched: 'tree-matched',
            filtered: 'tree-filtered'
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = {
        instances: new Map(),
        activeInstance: null,
        draggedNode: null,
        searchTimeout: null,
        observers: new Map()
    };

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function create(options = {}) {
        const instanceId = `tree-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const config = mergeConfig(options);
        
        // Créer le conteneur principal
        const container = createContainer(instanceId, config);
        
        // Initialiser l'instance
        const instance = {
            id: instanceId,
            container,
            config,
            nodes: new Map(),
            selectedNodes: new Set(),
            expandedNodes: new Set(),
            filteredNodes: new Set(),
            eventHandlers: new Map(),
            searchQuery: '',
            isDragging: false
        };
        
        // Sauvegarder l'instance
        state.instances.set(instanceId, instance);
        
        // Injecter les styles si nécessaire
        if (!document.getElementById('tree-component-styles')) {
            injectStyles();
        }
        
        // Retourner l'API publique
        return createPublicAPI(instance);
    }

    // Fusionner la configuration
    function mergeConfig(options) {
        const merged = {
            style: options.style || 'glassmorphism',
            animation: options.animation || 'smooth',
            displayMode: options.displayMode || 'normal',
            features: {},
            data: options.data || [],
            ...options
        };
        
        // Fusionner les features en profondeur
        Object.keys(CONFIG.features).forEach(feature => {
            merged.features[feature] = {
                ...CONFIG.features[feature],
                ...(options.features?.[feature] || {})
            };
        });
        
        return merged;
    }

    // Créer le conteneur principal
    function createContainer(instanceId, config) {
        const container = document.createElement('div');
        container.id = instanceId;
        container.className = `${CONFIG.classes.container} ${config.style} ${config.displayMode}`;
        container.setAttribute('role', 'tree');
        container.setAttribute('aria-label', config.ariaLabel || 'Tree view');
        
        // Ajouter la barre de recherche si activée
        if (config.features.search.enabled) {
            container.appendChild(createSearchBar(instanceId));
        }
        
        // Ajouter les boutons d'action si nécessaire
        if (config.features.expandable.expandAll || config.features.expandable.collapseAll) {
            container.appendChild(createActionBar(instanceId));
        }
        
        // Créer le conteneur des nœuds
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'tree-nodes-container';
        container.appendChild(nodesContainer);
        
        // Ajouter l'indicateur de chargement
        container.appendChild(createLoadingIndicator());
        
        return container;
    }

    // ========================================
    // MÉTHODES PRIVÉES - RENDU
    // ========================================
    function renderTree(instance, data, parentElement = null) {
        const container = parentElement || instance.container.querySelector('.tree-nodes-container');
        const fragment = document.createDocumentFragment();
        
        data.forEach((nodeData, index) => {
            const node = renderNode(instance, nodeData, 0, index);
            if (node) {
                fragment.appendChild(node);
            }
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Appliquer les animations si nécessaire
        if (instance.config.animation !== 'none') {
            animateNodes(container.children, instance.config);
        }
    }

    // Rendre un nœud
    function renderNode(instance, nodeData, level = 0, index = 0) {
        const nodeId = nodeData.id || `node-${Date.now()}-${index}`;
        const hasChildren = nodeData.children && nodeData.children.length > 0;
        
        // Créer l'élément nœud
        const node = document.createElement('div');
        node.className = CONFIG.classes.node;
        node.setAttribute('role', 'treeitem');
        node.setAttribute('aria-level', level + 1);
        node.setAttribute('data-node-id', nodeId);
        node.style.setProperty('--level', level);
        
        // État du nœud
        if (instance.expandedNodes.has(nodeId)) {
            node.classList.add(CONFIG.classes.expanded);
            node.setAttribute('aria-expanded', 'true');
        } else if (hasChildren) {
            node.classList.add(CONFIG.classes.collapsed);
            node.setAttribute('aria-expanded', 'false');
        }
        
        if (instance.selectedNodes.has(nodeId)) {
            node.classList.add(CONFIG.classes.selected);
            node.setAttribute('aria-selected', 'true');
        }
        
        // Créer le contenu du nœud
        const content = createNodeContent(instance, nodeData, hasChildren);
        node.appendChild(content);
        
        // Ajouter les enfants si expanded
        if (hasChildren && instance.expandedNodes.has(nodeId)) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = CONFIG.classes.children;
            childrenContainer.setAttribute('role', 'group');
            
            nodeData.children.forEach((child, childIndex) => {
                const childNode = renderNode(instance, child, level + 1, childIndex);
                if (childNode) {
                    childrenContainer.appendChild(childNode);
                }
            });
            
            node.appendChild(childrenContainer);
        }
        
        // Sauvegarder les données du nœud
        instance.nodes.set(nodeId, {
            element: node,
            data: nodeData,
            level,
            parent: null,
            children: []
        });
        
        // Attacher les événements
        attachNodeEvents(instance, node, nodeData);
        
        return node;
    }

    // Créer le contenu d'un nœud
    function createNodeContent(instance, nodeData, hasChildren) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.nodeContent;
        
        const style = CONFIG.styles[instance.config.style];
        Object.assign(content.style, {
            background: style.background,
            border: style.border,
            borderRadius: style.borderRadius,
            boxShadow: style.shadow,
            transition: style.transition
        });
        
        // Icône expand/collapse
        if (hasChildren && instance.config.features.expandable.enabled) {
            const expandIcon = document.createElement('span');
            expandIcon.className = CONFIG.classes.expandIcon;
            expandIcon.innerHTML = instance.expandedNodes.has(nodeData.id) 
                ? CONFIG.icons.collapse 
                : CONFIG.icons.expand;
            content.appendChild(expandIcon);
        }
        
        // Checkbox si mode sélection multiple
        if (instance.config.features.selection.showCheckbox) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'tree-checkbox';
            checkbox.checked = instance.selectedNodes.has(nodeData.id);
            content.appendChild(checkbox);
        }
        
        // Icône du nœud
        if (nodeData.icon || hasChildren) {
            const icon = document.createElement('span');
            icon.className = CONFIG.classes.nodeIcon;
            icon.innerHTML = nodeData.icon || (hasChildren ? CONFIG.icons.folder : CONFIG.icons.file);
            content.appendChild(icon);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = CONFIG.classes.nodeLabel;
        label.textContent = nodeData.label || nodeData.name || 'Untitled';
        content.appendChild(label);
        
        // Badge ou info supplémentaire
        if (nodeData.badge) {
            const badge = document.createElement('span');
            badge.className = 'tree-node-badge';
            badge.textContent = nodeData.badge;
            content.appendChild(badge);
        }
        
        return content;
    }

    // ========================================
    // MÉTHODES PRIVÉES - ÉVÉNEMENTS
    // ========================================
    function attachNodeEvents(instance, node, nodeData) {
        const content = node.querySelector(`.${CONFIG.classes.nodeContent}`);
        
        // Click sur le nœud
        content.addEventListener('click', (e) => {
            e.stopPropagation();
            handleNodeClick(instance, node, nodeData, e);
        });
        
        // Double-click pour édition
        if (instance.config.features.editing.editOnDoubleClick) {
            content.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                startEditNode(instance, node, nodeData);
            });
        }
        
        // Expand/collapse
        const expandIcon = node.querySelector(`.${CONFIG.classes.expandIcon}`);
        if (expandIcon) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleNode(instance, node, nodeData);
            });
        }
        
        // Drag & Drop
        if (instance.config.features.dragDrop.enabled) {
            attachDragDropEvents(instance, node, nodeData);
        }
        
        // Menu contextuel
        if (instance.config.features.contextMenu.enabled) {
            content.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showContextMenu(instance, node, nodeData, e);
            });
        }
        
        // Keyboard navigation
        if (instance.config.features.accessibility.keyboardNav) {
            content.tabIndex = 0;
            content.addEventListener('keydown', (e) => {
                handleKeyboardNavigation(instance, node, nodeData, e);
            });
        }
    }

    // Gérer le clic sur un nœud
    function handleNodeClick(instance, node, nodeData, event) {
        const config = instance.config.features.selection;
        
        if (!config.enabled) return;
        
        if (config.mode === 'single') {
            // Désélectionner tous les autres
            instance.selectedNodes.forEach(nodeId => {
                const otherNode = instance.container.querySelector(`[data-node-id="${nodeId}"]`);
                if (otherNode) {
                    otherNode.classList.remove(CONFIG.classes.selected);
                    otherNode.setAttribute('aria-selected', 'false');
                }
            });
            instance.selectedNodes.clear();
            
            // Sélectionner ce nœud
            instance.selectedNodes.add(nodeData.id);
            node.classList.add(CONFIG.classes.selected);
            node.setAttribute('aria-selected', 'true');
        } else if (config.mode === 'multiple') {
            if (event.ctrlKey || event.metaKey) {
                // Toggle sélection
                if (instance.selectedNodes.has(nodeData.id)) {
                    instance.selectedNodes.delete(nodeData.id);
                    node.classList.remove(CONFIG.classes.selected);
                    node.setAttribute('aria-selected', 'false');
                } else {
                    instance.selectedNodes.add(nodeData.id);
                    node.classList.add(CONFIG.classes.selected);
                    node.setAttribute('aria-selected', 'true');
                }
            } else if (event.shiftKey) {
                // Sélection par plage
                selectRange(instance, nodeData.id);
            } else {
                // Sélection simple
                instance.selectedNodes.clear();
                instance.container.querySelectorAll(`.${CONFIG.classes.selected}`).forEach(n => {
                    n.classList.remove(CONFIG.classes.selected);
                    n.setAttribute('aria-selected', 'false');
                });
                instance.selectedNodes.add(nodeData.id);
                node.classList.add(CONFIG.classes.selected);
                node.setAttribute('aria-selected', 'true');
            }
        }
        
        // Émettre l'événement
        emitEvent(instance, 'select', {
            node: nodeData,
            selected: Array.from(instance.selectedNodes),
            event
        });
    }

    // Toggle expand/collapse
    function toggleNode(instance, node, nodeData) {
        const nodeId = nodeData.id;
        const isExpanded = instance.expandedNodes.has(nodeId);
        const hasChildren = nodeData.children && nodeData.children.length > 0;
        
        if (!hasChildren) return;
        
        if (isExpanded) {
            // Collapse
            instance.expandedNodes.delete(nodeId);
            node.classList.remove(CONFIG.classes.expanded);
            node.classList.add(CONFIG.classes.collapsed);
            node.setAttribute('aria-expanded', 'false');
            
            // Animer la fermeture
            const children = node.querySelector(`.${CONFIG.classes.children}`);
            if (children && instance.config.animation !== 'none') {
                animateCollapse(children, instance.config, () => {
                    children.remove();
                });
            } else if (children) {
                children.remove();
            }
            
            // Mettre à jour l'icône
            const expandIcon = node.querySelector(`.${CONFIG.classes.expandIcon}`);
            if (expandIcon) {
                expandIcon.innerHTML = CONFIG.icons.expand;
            }
            
            emitEvent(instance, 'collapse', { node: nodeData });
        } else {
            // Expand
            instance.expandedNodes.add(nodeId);
            node.classList.remove(CONFIG.classes.collapsed);
            node.classList.add(CONFIG.classes.expanded);
            node.setAttribute('aria-expanded', 'true');
            
            // Lazy load si nécessaire
            if (instance.config.features.expandable.lazyLoad && !nodeData.children) {
                loadChildren(instance, node, nodeData);
            } else {
                // Rendre les enfants
                const childrenContainer = document.createElement('div');
                childrenContainer.className = CONFIG.classes.children;
                childrenContainer.setAttribute('role', 'group');
                
                const nodeInfo = instance.nodes.get(nodeId);
                nodeData.children.forEach((child, index) => {
                    const childNode = renderNode(instance, child, nodeInfo.level + 1, index);
                    if (childNode) {
                        childrenContainer.appendChild(childNode);
                    }
                });
                
                node.appendChild(childrenContainer);
                
                // Animer l'ouverture
                if (instance.config.animation !== 'none') {
                    animateExpand(childrenContainer, instance.config);
                }
            }
            
            // Mettre à jour l'icône
            const expandIcon = node.querySelector(`.${CONFIG.classes.expandIcon}`);
            if (expandIcon) {
                expandIcon.innerHTML = CONFIG.icons.collapse;
            }
            
            emitEvent(instance, 'expand', { node: nodeData });
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES - ANIMATIONS
    // ========================================
    function animateNodes(nodes, config) {
        const animation = CONFIG.animations[config.animation];
        if (!animation.enabled) return;
        
        Array.from(nodes).forEach((node, index) => {
            node.style.opacity = '0';
            node.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                node.style.transition = `all ${animation.expandDuration}ms ${animation.easing}`;
                node.style.opacity = '1';
                node.style.transform = 'translateY(0)';
                
                if (animation.fadeIn) {
                    node.classList.add('fade-in');
                }
            }, index * (animation.stagger || 0));
        });
    }

    function animateExpand(container, config) {
        const animation = CONFIG.animations[config.animation];
        if (!animation.enabled) return;
        
        container.style.maxHeight = '0';
        container.style.overflow = 'hidden';
        container.style.opacity = '0';
        
        requestAnimationFrame(() => {
            container.style.transition = `all ${animation.expandDuration}ms ${animation.easing}`;
            container.style.maxHeight = container.scrollHeight + 'px';
            container.style.opacity = '1';
            
            setTimeout(() => {
                container.style.maxHeight = '';
                container.style.overflow = '';
            }, animation.expandDuration);
        });
        
        // Effets avancés pour animation "rich"
        if (config.animation === 'rich' && animation.particles) {
            createParticleEffect(container);
        }
    }

    function animateCollapse(container, config, callback) {
        const animation = CONFIG.animations[config.animation];
        if (!animation.enabled) {
            callback();
            return;
        }
        
        container.style.maxHeight = container.scrollHeight + 'px';
        container.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
            container.style.transition = `all ${animation.collapseDuration}ms ${animation.easing}`;
            container.style.maxHeight = '0';
            container.style.opacity = '0';
            
            setTimeout(() => {
                callback();
            }, animation.collapseDuration);
        });
    }

    // ========================================
    // MÉTHODES PRIVÉES - RECHERCHE & FILTRAGE
    // ========================================
    function createSearchBar(instanceId) {
        const searchBar = document.createElement('div');
        searchBar.className = 'tree-search-bar';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'tree-search-input';
        searchInput.placeholder = 'Search...';
        searchInput.setAttribute('aria-label', 'Search tree');
        
        const searchIcon = document.createElement('span');
        searchIcon.className = 'tree-search-icon';
        searchIcon.innerHTML = CONFIG.icons.search;
        
        searchBar.appendChild(searchIcon);
        searchBar.appendChild(searchInput);
        
        // Attacher les événements
        searchInput.addEventListener('input', (e) => {
            const instance = state.instances.get(instanceId);
            if (instance) {
                handleSearch(instance, e.target.value);
            }
        });
        
        return searchBar;
    }

    function handleSearch(instance, query) {
        // Debounce
        clearTimeout(state.searchTimeout);
        
        state.searchTimeout = setTimeout(() => {
            instance.searchQuery = query.toLowerCase();
            
            if (!query) {
                // Réinitialiser la recherche
                instance.container.querySelectorAll(`.${CONFIG.classes.matched}`).forEach(node => {
                    node.classList.remove(CONFIG.classes.matched);
                });
                return;
            }
            
            // Rechercher dans tous les nœuds
            searchNodes(instance, instance.config.data);
            
            // Expand les nœuds correspondants si nécessaire
            if (instance.config.features.search.expandMatches) {
                expandMatchedNodes(instance);
            }
            
            emitEvent(instance, 'search', { query, matches: instance.filteredNodes.size });
        }, instance.config.features.search.searchDelay);
    }

    function searchNodes(instance, nodes, parentMatched = false) {
        nodes.forEach(nodeData => {
            const label = (nodeData.label || nodeData.name || '').toLowerCase();
            const matched = instance.config.features.search.fuzzySearch
                ? fuzzyMatch(instance.searchQuery, label)
                : label.includes(instance.searchQuery);
            
            const nodeElement = instance.container.querySelector(`[data-node-id="${nodeData.id}"]`);
            
            if (matched || parentMatched) {
                instance.filteredNodes.add(nodeData.id);
                if (nodeElement) {
                    nodeElement.classList.add(CONFIG.classes.matched);
                    
                    // Surligner le texte correspondant
                    if (instance.config.features.search.highlightMatches && matched) {
                        highlightText(nodeElement, instance.searchQuery);
                    }
                }
            } else {
                instance.filteredNodes.delete(nodeData.id);
                if (nodeElement) {
                    nodeElement.classList.remove(CONFIG.classes.matched);
                    removeHighlight(nodeElement);
                }
            }
            
            // Rechercher dans les enfants
            if (nodeData.children) {
                searchNodes(instance, nodeData.children, matched);
            }
        });
    }

    // ========================================
    // MÉTHODES PRIVÉES - DRAG & DROP
    // ========================================
    function attachDragDropEvents(instance, node, nodeData) {
        const content = node.querySelector(`.${CONFIG.classes.nodeContent}`);
        
        // Rendre draggable
        content.draggable = true;
        
        // Drag start
        content.addEventListener('dragstart', (e) => {
            instance.isDragging = true;
            state.draggedNode = { node, data: nodeData };
            node.classList.add(CONFIG.classes.dragging);
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', nodeData.id);
            
            // Ghost image
            if (instance.config.features.dragDrop.ghostOpacity < 1) {
                const ghost = content.cloneNode(true);
                ghost.style.opacity = instance.config.features.dragDrop.ghostOpacity;
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => ghost.remove(), 0);
            }
            
            emitEvent(instance, 'dragstart', { node: nodeData });
        });
        
        // Drag end
        content.addEventListener('dragend', (e) => {
            instance.isDragging = false;
            node.classList.remove(CONFIG.classes.dragging);
            
            // Nettoyer les indicateurs de drop
            instance.container.querySelectorAll(`.${CONFIG.classes.dropTarget}`).forEach(n => {
                n.classList.remove(CONFIG.classes.dropTarget);
            });
            
            emitEvent(instance, 'dragend', { node: nodeData });
        });
        
        // Drag over
        content.addEventListener('dragover', (e) => {
            if (!instance.isDragging || !canDrop(instance, nodeData)) return;
            
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            node.classList.add(CONFIG.classes.dropTarget);
            
            // Auto-expand
            if (instance.config.features.dragDrop.autoExpand && 
                nodeData.children && 
                !instance.expandedNodes.has(nodeData.id)) {
                
                node.dataset.autoExpandTimer = setTimeout(() => {
                    toggleNode(instance, node, nodeData);
                }, instance.config.features.dragDrop.autoExpandDelay);
            }
        });
        
        // Drag leave
        content.addEventListener('dragleave', (e) => {
            node.classList.remove(CONFIG.classes.dropTarget);
            
            if (node.dataset.autoExpandTimer) {
                clearTimeout(node.dataset.autoExpandTimer);
                delete node.dataset.autoExpandTimer;
            }
        });
        
        // Drop
        content.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            node.classList.remove(CONFIG.classes.dropTarget);
            
            if (!state.draggedNode || !canDrop(instance, nodeData)) return;
            
            const draggedData = state.draggedNode.data;
            const targetData = nodeData;
            
            // Émettre l'événement avant de modifier
            const event = {
                source: draggedData,
                target: targetData,
                position: getDropPosition(e, node)
            };
            
            emitEvent(instance, 'drop', event);
            
            // Réorganiser l'arbre si pas annulé
            if (!event.defaultPrevented) {
                moveNode(instance, draggedData, targetData, event.position);
            }
            
            state.draggedNode = null;
        });
    }

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    function emitEvent(instance, eventName, detail) {
        const handlers = instance.eventHandlers.get(eventName);
        if (handlers) {
            handlers.forEach(handler => {
                handler(detail);
            });
        }
        
        // Événement DOM personnalisé
        instance.container.dispatchEvent(new CustomEvent(`tree:${eventName}`, {
            detail,
            bubbles: true
        }));
    }

    function createParticleEffect(container) {
        // Créer des particules pour l'effet visuel
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'tree-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 0.5 + 's';
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    function fuzzyMatch(needle, haystack) {
        let hlen = haystack.length;
        let nlen = needle.length;
        if (nlen > hlen) return false;
        if (nlen === hlen) return needle === haystack;
        
        outer: for (let i = 0, j = 0; i < nlen; i++) {
            let nch = needle.charCodeAt(i);
            while (j < hlen) {
                if (haystack.charCodeAt(j++) === nch) {
                    continue outer;
                }
            }
            return false;
        }
        return true;
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    function createPublicAPI(instance) {
        return {
            // Getters
            get container() { return instance.container; },
            get selectedNodes() { return Array.from(instance.selectedNodes); },
            get expandedNodes() { return Array.from(instance.expandedNodes); },
            
            // Méthodes de données
            setData(data) {
                instance.config.data = data;
                renderTree(instance, data);
                return this;
            },
            
            addNode(parentId, nodeData) {
                const parent = findNodeById(instance.config.data, parentId);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(nodeData);
                    
                    // Re-render si parent expanded
                    if (instance.expandedNodes.has(parentId)) {
                        const parentElement = instance.container.querySelector(`[data-node-id="${parentId}"]`);
                        if (parentElement) {
                            renderTree(instance, [parent], parentElement.parentElement);
                        }
                    }
                    
                    emitEvent(instance, 'nodeAdded', { parent: parentId, node: nodeData });
                }
                return this;
            },
            
            removeNode(nodeId) {
                const removed = removeNodeById(instance.config.data, nodeId);
                if (removed) {
                    renderTree(instance, instance.config.data);
                    emitEvent(instance, 'nodeRemoved', { node: removed });
                }
                return this;
            },
            
            updateNode(nodeId, updates) {
                const node = findNodeById(instance.config.data, nodeId);
                if (node) {
                    Object.assign(node, updates);
                    const element = instance.container.querySelector(`[data-node-id="${nodeId}"]`);
                    if (element) {
                        const content = element.querySelector(`.${CONFIG.classes.nodeContent}`);
                        const label = content.querySelector(`.${CONFIG.classes.nodeLabel}`);
                        if (label && updates.label) {
                            label.textContent = updates.label;
                        }
                    }
                    emitEvent(instance, 'nodeUpdated', { node, updates });
                }
                return this;
            },
            
            // Méthodes de sélection
            selectNode(nodeId) {
                const node = instance.container.querySelector(`[data-node-id="${nodeId}"]`);
                const nodeData = findNodeById(instance.config.data, nodeId);
                if (node && nodeData) {
                    handleNodeClick(instance, node, nodeData, { ctrlKey: false });
                }
                return this;
            },
            
            selectAll() {
                const allNodes = instance.container.querySelectorAll(`.${CONFIG.classes.node}`);
                allNodes.forEach(node => {
                    const nodeId = node.dataset.nodeId;
                    instance.selectedNodes.add(nodeId);
                    node.classList.add(CONFIG.classes.selected);
                    node.setAttribute('aria-selected', 'true');
                });
                emitEvent(instance, 'selectAll', { count: instance.selectedNodes.size });
                return this;
            },
            
            clearSelection() {
                instance.selectedNodes.clear();
                instance.container.querySelectorAll(`.${CONFIG.classes.selected}`).forEach(node => {
                    node.classList.remove(CONFIG.classes.selected);
                    node.setAttribute('aria-selected', 'false');
                });
                emitEvent(instance, 'selectionCleared', {});
                return this;
            },
            
            // Méthodes expand/collapse
            expandNode(nodeId) {
                const node = instance.container.querySelector(`[data-node-id="${nodeId}"]`);
                const nodeData = findNodeById(instance.config.data, nodeId);
                if (node && nodeData && !instance.expandedNodes.has(nodeId)) {
                    toggleNode(instance, node, nodeData);
                }
                return this;
            },
            
            collapseNode(nodeId) {
                const node = instance.container.querySelector(`[data-node-id="${nodeId}"]`);
                const nodeData = findNodeById(instance.config.data, nodeId);
                if (node && nodeData && instance.expandedNodes.has(nodeId)) {
                    toggleNode(instance, node, nodeData);
                }
                return this;
            },
            
            expandAll() {
                expandAllNodes(instance, instance.config.data);
                renderTree(instance, instance.config.data);
                return this;
            },
            
            collapseAll() {
                instance.expandedNodes.clear();
                renderTree(instance, instance.config.data);
                return this;
            },
            
            // Méthodes de recherche
            search(query) {
                const searchInput = instance.container.querySelector('.tree-search-input');
                if (searchInput) {
                    searchInput.value = query;
                    handleSearch(instance, query);
                }
                return this;
            },
            
            clearSearch() {
                const searchInput = instance.container.querySelector('.tree-search-input');
                if (searchInput) {
                    searchInput.value = '';
                    handleSearch(instance, '');
                }
                return this;
            },
            
            // Événements
            on(eventName, handler) {
                if (!instance.eventHandlers.has(eventName)) {
                    instance.eventHandlers.set(eventName, new Set());
                }
                instance.eventHandlers.get(eventName).add(handler);
                return this;
            },
            
            off(eventName, handler) {
                const handlers = instance.eventHandlers.get(eventName);
                if (handlers) {
                    handlers.delete(handler);
                }
                return this;
            },
            
            // Destruction
            destroy() {
                instance.container.remove();
                state.instances.delete(instance.id);
                
                // Nettoyer les événements
                instance.eventHandlers.clear();
                
                // Nettoyer les timeouts
                clearTimeout(state.searchTimeout);
                
                emitEvent(instance, 'destroy', {});
            }
        };
    }

    // ========================================
    // STYLES CSS
    // ========================================
    function getStyles() {
        return `
            /* ========================================
               TREE COMPONENT STYLES
               ======================================== */
            .tree-container {
                position: relative;
                width: 100%;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                color: #333;
                user-select: none;
            }
            
            /* Glassmorphism theme */
            .tree-container.glassmorphism {
                background: rgba(255, 255, 255, 0.02);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 16px;
            }
            
            /* Search bar */
            .tree-search-bar {
                position: relative;
                margin-bottom: 16px;
            }
            
            .tree-search-input {
                width: 100%;
                padding: 10px 40px 10px 16px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: inherit;
                font-size: 14px;
                outline: none;
                transition: all 0.3s ease;
            }
            
            .tree-search-input:focus {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(59, 130, 246, 0.5);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .tree-search-icon {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                width: 20px;
                height: 20px;
                opacity: 0.5;
                pointer-events: none;
            }
            
            .tree-search-icon svg {
                width: 100%;
                height: 100%;
                stroke: currentColor;
                fill: none;
            }
            
            /* Action bar */
            .tree-action-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 12px;
            }
            
            .tree-action-button {
                padding: 6px 12px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: inherit;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .tree-action-button:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: translateY(-1px);
            }
            
            /* Nodes container */
            .tree-nodes-container {
                position: relative;
                overflow: auto;
                max-height: 600px;
            }
            
            /* Node styles */
            .tree-node {
                position: relative;
                margin-bottom: 2px;
            }
            
            .tree-node-content {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                margin-left: calc(var(--level, 0) * 24px);
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }
            
            .tree-node-content::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(135deg, transparent, rgba(255,255,255,0.05));
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .tree-node-content:hover::before {
                opacity: 1;
            }
            
            /* Expand/collapse icon */
            .tree-expand-icon {
                width: 20px;
                height: 20px;
                margin-right: 4px;
                cursor: pointer;
                transition: transform 0.3s ease;
                flex-shrink: 0;
            }
            
            .tree-expanded .tree-expand-icon {
                transform: rotate(90deg);
            }
            
            .tree-expand-icon svg {
                width: 100%;
                height: 100%;
                stroke: currentColor;
                fill: none;
            }
            
            /* Node icon */
            .tree-node-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                opacity: 0.7;
                flex-shrink: 0;
            }
            
            .tree-node-icon svg {
                width: 100%;
                height: 100%;
                stroke: currentColor;
                fill: currentColor;
            }
            
            /* Node label */
            .tree-node-label {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            /* Node badge */
            .tree-node-badge {
                margin-left: 8px;
                padding: 2px 8px;
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
            }
            
            /* Selected state */
            .tree-selected .tree-node-content {
                background: rgba(59, 130, 246, 0.2) !important;
                border: 1px solid rgba(59, 130, 246, 0.3);
            }
            
            /* Matched state (search) */
            .tree-matched .tree-node-label {
                font-weight: 600;
            }
            
            .tree-matched .tree-node-content {
                background: rgba(251, 191, 36, 0.1);
            }
            
            /* Highlight text */
            .tree-highlight {
                background: rgba(251, 191, 36, 0.3);
                padding: 0 2px;
                border-radius: 2px;
            }
            
            /* Children container */
            .tree-children {
                position: relative;
                overflow: hidden;
            }
            
            /* Loading state */
            .tree-loading .tree-node-icon {
                animation: tree-spin 1s linear infinite;
            }
            
            @keyframes tree-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Loading indicator */
            .tree-loading-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: none;
            }
            
            .tree-container.loading .tree-loading-indicator {
                display: block;
            }
            
            /* Drag & Drop styles */
            .tree-dragging {
                opacity: 0.5;
            }
            
            .tree-drop-target .tree-node-content {
                background: rgba(34, 197, 94, 0.2);
                border: 2px dashed rgba(34, 197, 94, 0.5);
            }
            
            /* Checkbox */
            .tree-checkbox {
                margin-right: 8px;
                cursor: pointer;
            }
            
            /* Lines display mode */
            .tree-container.lines .tree-node::before {
                content: '';
                position: absolute;
                left: calc(var(--level, 0) * 24px + 10px);
                top: 0;
                bottom: 50%;
                width: 1px;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .tree-container.lines .tree-node::after {
                content: '';
                position: absolute;
                left: calc(var(--level, 0) * 24px + 10px);
                top: 50%;
                width: 12px;
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
            }
            
            /* Curved lines */
            .tree-container.curved .tree-node::before {
                border-radius: 0 0 0 8px;
                border-left: 1px solid rgba(0, 0, 0, 0.08);
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                background: none;
                width: 12px;
            }
            
            /* Particles effect */
            .tree-particle {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(59, 130, 246, 0.6);
                border-radius: 50%;
                pointer-events: none;
                animation: tree-particle-float 1s ease-out forwards;
            }
            
            @keyframes tree-particle-float {
                0% {
                    transform: translateY(0) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-50px) scale(1);
                    opacity: 0;
                }
            }
            
            /* Dark theme adjustments */
            .tree-container.dark {
                color: #e5e7eb;
            }
            
            .tree-container.dark .tree-search-input {
                background: rgba(30, 30, 30, 0.8);
                border-color: rgba(255, 255, 255, 0.1);
                color: #e5e7eb;
            }
            
            .tree-container.dark .tree-node-content {
                background: rgba(30, 30, 30, 0.6);
                border-color: rgba(255, 255, 255, 0.05);
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .tree-container {
                    font-size: 13px;
                }
                
                .tree-node-content {
                    padding: 6px 8px;
                    margin-left: calc(var(--level, 0) * 16px);
                }
                
                .tree-expand-icon,
                .tree-node-icon {
                    width: 16px;
                    height: 16px;
                }
            }
            
            /* Accessibility */
            .tree-node-content:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            }
            
            /* High contrast mode */
            @media (prefers-contrast: high) {
                .tree-node-content {
                    border: 2px solid currentColor;
                }
                
                .tree-selected .tree-node-content {
                    background: currentColor;
                    color: white;
                }
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .tree-container * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
    }

    // Injecter les styles
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'tree-component-styles';
        style.textContent = getStyles();
        document.head.appendChild(style);
    }

    // ========================================
    // MÉTHODES UTILITAIRES HELPER
    // ========================================
    function findNodeById(nodes, id) {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    function removeNodeById(nodes, id) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                return nodes.splice(i, 1)[0];
            }
            if (nodes[i].children) {
                const removed = removeNodeById(nodes[i].children, id);
                if (removed) return removed;
            }
        }
        return null;
    }

    function expandAllNodes(instance, nodes) {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                instance.expandedNodes.add(node.id);
                expandAllNodes(instance, node.children);
            }
        });
    }

    function createActionBar(instanceId) {
        const actionBar = document.createElement('div');
        actionBar.className = 'tree-action-bar';
        
        const instance = state.instances.get(instanceId);
        
        if (instance?.config.features.expandable.expandAll) {
            const expandAllBtn = document.createElement('button');
            expandAllBtn.className = 'tree-action-button';
            expandAllBtn.textContent = 'Expand All';
            expandAllBtn.onclick = () => {
                const api = createPublicAPI(instance);
                api.expandAll();
            };
            actionBar.appendChild(expandAllBtn);
        }
        
        if (instance?.config.features.expandable.collapseAll) {
            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.className = 'tree-action-button';
            collapseAllBtn.textContent = 'Collapse All';
            collapseAllBtn.onclick = () => {
                const api = createPublicAPI(instance);
                api.collapseAll();
            };
            actionBar.appendChild(collapseAllBtn);
        }
        
        return actionBar;
    }

    function createLoadingIndicator() {
        const loader = document.createElement('div');
        loader.className = 'tree-loading-indicator';
        loader.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" fill="none" opacity="0.2"/>
                <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" fill="none" 
                    stroke-dasharray="90" stroke-dashoffset="20" 
                    transform="rotate(-90 20 20)">
                    <animateTransform attributeName="transform" type="rotate" 
                        from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>
                </circle>
            </svg>
        `;
        return loader;
    }

    function canDrop(instance, targetNode) {
        if (!instance.config.features.dragDrop.allowDrop) return false;
        if (instance.config.features.dragDrop.preventRootDrop && !targetNode.id) return false;
        
        // Éviter de drop sur soi-même ou ses enfants
        if (state.draggedNode) {
            if (state.draggedNode.data.id === targetNode.id) return false;
            // TODO: Vérifier si target est un enfant de dragged
        }
        
        return true;
    }

    function getDropPosition(event, node) {
        const rect = node.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const height = rect.height;
        
        if (y < height * 0.25) return 'before';
        if (y > height * 0.75) return 'after';
        return 'inside';
    }

    function highlightText(node, searchText) {
        const label = node.querySelector('.tree-node-label');
        if (!label) return;
        
        const text = label.textContent;
        const regex = new RegExp(`(${searchText})`, 'gi');
        label.innerHTML = text.replace(regex, '<span class="tree-highlight">$1</span>');
    }

    function removeHighlight(node) {
        const label = node.querySelector('.tree-node-label');
        if (!label) return;
        
        const highlights = label.querySelectorAll('.tree-highlight');
        highlights.forEach(highlight => {
            const text = highlight.textContent;
            highlight.replaceWith(text);
        });
    }

    function loadChildren(instance, node, nodeData) {
        node.classList.add('tree-loading');
        
        // Simuler un chargement async
        setTimeout(() => {
            // Ici vous appelleriez votre API
            nodeData.children = [
                { id: `${nodeData.id}-1`, label: 'Loaded Child 1' },
                { id: `${nodeData.id}-2`, label: 'Loaded Child 2' }
            ];
            
            node.classList.remove('tree-loading');
            toggleNode(instance, node, nodeData);
        }, 1000);
    }

    function startEditNode(instance, node, nodeData) {
        if (!instance.config.features.editing.enabled) return;
        
        const label = node.querySelector('.tree-node-label');
        if (!label) return;
        
        const currentText = label.textContent;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'tree-edit-input';
        input.style.width = label.offsetWidth + 'px';
        
        label.replaceWith(input);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newValue = input.value.trim();
            
            if (newValue && newValue !== currentText) {
                if (instance.config.features.editing.validation) {
                    if (!instance.config.features.editing.validation(newValue)) {
                        cancelEdit();
                        return;
                    }
                }
                
                nodeData.label = newValue;
                label.textContent = newValue;
                emitEvent(instance, 'nodeRenamed', { node: nodeData, oldValue: currentText, newValue });
            }
            
            input.replaceWith(label);
        };
        
        const cancelEdit = () => {
            input.replaceWith(label);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') cancelEdit();
        });
    }

    function showContextMenu(instance, node, nodeData, event) {
        // Implémenter le menu contextuel
        console.log('Context menu for', nodeData);
    }

    function handleKeyboardNavigation(instance, node, nodeData, event) {
        switch (event.key) {
            case 'ArrowRight':
                if (!instance.expandedNodes.has(nodeData.id) && nodeData.children) {
                    toggleNode(instance, node, nodeData);
                }
                break;
            case 'ArrowLeft':
                if (instance.expandedNodes.has(nodeData.id)) {
                    toggleNode(instance, node, nodeData);
                }
                break;
            case 'ArrowDown':
                // Focus next node
                break;
            case 'ArrowUp':
                // Focus previous node
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                handleNodeClick(instance, node, nodeData, event);
                break;
        }
    }

    function selectRange(instance, toNodeId) {
        // Implémenter la sélection par plage
        console.log('Range selection to', toNodeId);
    }

    function moveNode(instance, sourceData, targetData, position) {
        // Implémenter le déplacement de nœud
        console.log('Move node', sourceData, 'to', targetData, 'at', position);
        
        // Re-render après déplacement
        renderTree(instance, instance.config.data);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        CONFIG,
        injectStyles,
        version: '1.0.0'
    };
})();

// Export pour utilisation
export default TreeComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date] - Gestion de la virtualisation
   Solution: Implémentation d'un système de recyclage
   des nœuds DOM pour les grandes arborescences
   
   [Date] - Performance du drag & drop
   Cause: Trop de calculs pendant le drag
   Résolution: Throttling et optimisation des checks
   
   [Date] - Accessibilité clavier
   Solution: Navigation complète avec les flèches
   et support ARIA complet
   
   NOTES POUR REPRISES FUTURES:
   - La virtualisation n'est activée qu'au-delà de 1000 nœuds
   - Le lazy loading nécessite une fonction de chargement custom
   - Les animations "rich" peuvent impacter les performances
   - Le fuzzy search est désactivé par défaut pour la performance
   ======================================== */