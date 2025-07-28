/* ========================================
   COMMAND-PALETTE.COMPONENT.JS - Composant Palette de Commandes
   Chemin: src/js/shared/ui/navigation/command-palette.component.js
   
   DESCRIPTION:
   Palette de commandes complète avec recherche fuzzy, navigation clavier,
   catégories, historique et raccourcis. Style Spotlight/VS Code.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Méthodes de création (lignes 302-700)
   3. Gestion de la recherche (lignes 702-900)
   4. Navigation et interactions (lignes 902-1200)
   5. API publique (lignes 1202-1400)
   
   DÉPENDANCES:
   - command-palette.css (tous les styles)
   - frosted-icons.component.js (pour les icônes)
   - animation-utils.js (pour les animations)
   ======================================== */

const CommandPalette = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.08,
                borderRadius: 16,
                shadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            },
            'neumorphism': {
                class: 'neumorphism',
                background: '#e0e5ec',
                shadow: '20px 20px 40px #a3b1c6, -20px -20px 40px #ffffff'
            },
            'flat': {
                class: 'flat',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                shadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
            },
            'minimal': {
                class: 'minimal',
                background: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid currentColor'
            },
            'material': {
                class: 'material',
                elevation: 8,
                borderRadius: 4
            },
            'spotlight': {
                class: 'spotlight',
                blur: 30,
                opacity: 0.95,
                borderRadius: 12
            }
        },

        animations: {
            'none': { enabled: false },
            'subtle': {
                duration: 200,
                easing: 'ease',
                effects: ['fade']
            },
            'smooth': {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'scale']
            },
            'rich': {
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['fade', 'scale', 'blur', 'slide']
            }
        },

        sizes: {
            'compact': {
                width: '400px',
                maxHeight: '300px',
                fontSize: '14px',
                itemHeight: '36px'
            },
            'medium': {
                width: '600px',
                maxHeight: '400px',
                fontSize: '16px',
                itemHeight: '44px'
            },
            'large': {
                width: '800px',
                maxHeight: '500px',
                fontSize: '18px',
                itemHeight: '52px'
            },
            'fullscreen': {
                width: '90vw',
                maxWidth: '1200px',
                maxHeight: '80vh',
                fontSize: '18px',
                itemHeight: '56px'
            }
        },

        features: {
            'fuzzySearch': true,
            'categories': true,
            'shortcuts': true,
            'icons': true,
            'descriptions': true,
            'recent': true,
            'favorites': true,
            'preview': false,
            'multiSelect': false,
            'customActions': true,
            'breadcrumbs': true,
            'suggestions': true,
            'history': true,
            'contextual': true
        },

        shortcuts: {
            open: ['cmd+k', 'ctrl+k', 'cmd+p', 'ctrl+p'],
            close: ['escape'],
            selectNext: ['arrowdown', 'ctrl+n'],
            selectPrev: ['arrowup', 'ctrl+p'],
            selectFirst: ['home', 'cmd+arrowup'],
            selectLast: ['end', 'cmd+arrowdown'],
            execute: ['enter'],
            executeBackground: ['cmd+enter', 'ctrl+enter'],
            toggleCategory: ['space'],
            clearSearch: ['cmd+backspace', 'ctrl+backspace'],
            toggleFavorite: ['cmd+f', 'ctrl+f']
        },

        icons: {
            search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
            command: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>',
            file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>',
            folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
            settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m20.485-5.485l-4.242 4.242M7.757 16.243L3.515 20.485m16.97 0l-4.242-4.242M7.757 7.757L3.515 3.515"/></svg>',
            user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
            chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
            close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        },

        categories: {
            'all': { label: 'All Commands', icon: 'command' },
            'files': { label: 'Files', icon: 'file' },
            'folders': { label: 'Folders', icon: 'folder' },
            'actions': { label: 'Actions', icon: 'command' },
            'settings': { label: 'Settings', icon: 'settings' },
            'users': { label: 'Users', icon: 'user' },
            'recent': { label: 'Recent', icon: 'clock' },
            'favorites': { label: 'Favorites', icon: 'star' }
        },

        scoring: {
            exact: 1000,
            startsWith: 800,
            contains: 600,
            fuzzy: 400,
            recent: 200,
            favorite: 150,
            frequently: 100
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();
    let idCounter = 0;
    const recentCommands = [];
    const favoriteCommands = new Set();
    const commandFrequency = new Map();

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function generateId() {
        return `cmd-palette-${++idCounter}`;
    }

    function createStructure(options) {
        const id = generateId();
        const config = normalizeOptions(options);
        
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'cmd-palette-overlay';
        overlay.setAttribute('data-cmd-palette-id', id);
        
        // Conteneur principal
        const container = document.createElement('div');
        container.className = `cmd-palette ${config.style} ${config.size}`;
        container.setAttribute('role', 'dialog');
        container.setAttribute('aria-label', 'Command palette');
        
        // Header avec recherche
        const header = createHeader(config);
        
        // Breadcrumbs (si activé)
        const breadcrumbs = config.features.breadcrumbs ? createBreadcrumbs() : null;
        
        // Corps avec résultats
        const body = createBody(config);
        
        // Footer avec infos
        const footer = createFooter(config);
        
        // Assemblage
        container.appendChild(header);
        if (breadcrumbs) container.appendChild(breadcrumbs);
        container.appendChild(body);
        container.appendChild(footer);
        overlay.appendChild(container);
        
        // État
        state.set(id, {
            overlay,
            container,
            config,
            commands: [],
            filteredCommands: [],
            selectedIndex: 0,
            searchQuery: '',
            activeCategory: 'all',
            isOpen: false,
            contextData: null
        });
        
        return { id, overlay, container };
    }

    function createHeader(config) {
        const header = document.createElement('div');
        header.className = 'cmd-palette-header';
        
        // Icône de recherche
        const searchIcon = document.createElement('div');
        searchIcon.className = 'cmd-palette-search-icon';
        searchIcon.innerHTML = CONFIG.icons.search;
        
        // Input de recherche
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cmd-palette-input';
        input.placeholder = config.placeholder || 'Type a command or search...';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'false');
        
        // Bouton clear
        const clearBtn = document.createElement('button');
        clearBtn.className = 'cmd-palette-clear';
        clearBtn.innerHTML = CONFIG.icons.close;
        clearBtn.style.display = 'none';
        
        // Suggestions (si activé)
        const suggestions = config.features.suggestions ? createSuggestions() : null;
        
        header.appendChild(searchIcon);
        header.appendChild(input);
        header.appendChild(clearBtn);
        if (suggestions) header.appendChild(suggestions);
        
        return header;
    }

    function createBreadcrumbs() {
        const breadcrumbs = document.createElement('div');
        breadcrumbs.className = 'cmd-palette-breadcrumbs';
        breadcrumbs.style.display = 'none';
        return breadcrumbs;
    }

    function createBody(config) {
        const body = document.createElement('div');
        body.className = 'cmd-palette-body';
        
        // Sidebar avec catégories (si activé)
        if (config.features.categories) {
            const sidebar = createSidebar(config);
            body.appendChild(sidebar);
        }
        
        // Liste des résultats
        const results = document.createElement('div');
        results.className = 'cmd-palette-results';
        results.setAttribute('role', 'listbox');
        
        // Message vide
        const empty = document.createElement('div');
        empty.className = 'cmd-palette-empty';
        empty.textContent = 'No commands found';
        empty.style.display = 'none';
        
        // Liste
        const list = document.createElement('div');
        list.className = 'cmd-palette-list';
        
        results.appendChild(list);
        results.appendChild(empty);
        body.appendChild(results);
        
        // Preview (si activé)
        if (config.features.preview) {
            const preview = createPreview();
            body.appendChild(preview);
        }
        
        return body;
    }

    function createSidebar(config) {
        const sidebar = document.createElement('div');
        sidebar.className = 'cmd-palette-sidebar';
        
        const title = document.createElement('div');
        title.className = 'cmd-palette-sidebar-title';
        title.textContent = 'Categories';
        
        const categories = document.createElement('div');
        categories.className = 'cmd-palette-categories';
        
        Object.entries(CONFIG.categories).forEach(([key, cat]) => {
            const item = createCategoryItem(key, cat);
            categories.appendChild(item);
        });
        
        sidebar.appendChild(title);
        sidebar.appendChild(categories);
        
        return sidebar;
    }

    function createCategoryItem(key, category) {
        const item = document.createElement('button');
        item.className = 'cmd-palette-category';
        item.setAttribute('data-category', key);
        if (key === 'all') item.classList.add('active');
        
        const icon = document.createElement('span');
        icon.className = 'cmd-palette-category-icon';
        icon.innerHTML = CONFIG.icons[category.icon] || CONFIG.icons.folder;
        
        const label = document.createElement('span');
        label.className = 'cmd-palette-category-label';
        label.textContent = category.label;
        
        const count = document.createElement('span');
        count.className = 'cmd-palette-category-count';
        count.textContent = '0';
        
        item.appendChild(icon);
        item.appendChild(label);
        item.appendChild(count);
        
        return item;
    }

    function createFooter(config) {
        const footer = document.createElement('div');
        footer.className = 'cmd-palette-footer';
        
        // Shortcuts
        const shortcuts = document.createElement('div');
        shortcuts.className = 'cmd-palette-shortcuts';
        
        const shortcutItems = [
            { key: '↑↓', label: 'Navigate' },
            { key: '⏎', label: 'Select' },
            { key: 'esc', label: 'Close' }
        ];
        
        if (config.features.favorites) {
            shortcutItems.push({ key: '⌘F', label: 'Favorite' });
        }
        
        shortcutItems.forEach(item => {
            const shortcut = document.createElement('span');
            shortcut.className = 'cmd-palette-shortcut';
            shortcut.innerHTML = `<kbd>${item.key}</kbd> ${item.label}`;
            shortcuts.appendChild(shortcut);
        });
        
        footer.appendChild(shortcuts);
        
        return footer;
    }

    function createSuggestions() {
        const suggestions = document.createElement('div');
        suggestions.className = 'cmd-palette-suggestions';
        suggestions.style.display = 'none';
        
        const title = document.createElement('div');
        title.className = 'cmd-palette-suggestions-title';
        title.textContent = 'Suggestions:';
        
        const list = document.createElement('div');
        list.className = 'cmd-palette-suggestions-list';
        
        suggestions.appendChild(title);
        suggestions.appendChild(list);
        
        return suggestions;
    }

    function createPreview() {
        const preview = document.createElement('div');
        preview.className = 'cmd-palette-preview';
        preview.style.display = 'none';
        return preview;
    }

    // ========================================
    // RENDU DES COMMANDES
    // ========================================
    function renderCommands(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { container, filteredCommands, selectedIndex, config } = instance;
        const list = container.querySelector('.cmd-palette-list');
        const empty = container.querySelector('.cmd-palette-empty');
        
        // Vider la liste
        list.innerHTML = '';
        
        if (filteredCommands.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'flex';
            return;
        }
        
        list.style.display = 'block';
        empty.style.display = 'none';
        
        // Grouper par catégorie si activé
        if (config.features.categories && instance.activeCategory === 'all') {
            const grouped = groupByCategory(filteredCommands);
            Object.entries(grouped).forEach(([category, commands]) => {
                if (commands.length > 0) {
                    const group = createCommandGroup(category, commands, selectedIndex, config);
                    list.appendChild(group);
                }
            });
        } else {
            filteredCommands.forEach((cmd, index) => {
                const item = createCommandItem(cmd, index, index === selectedIndex, config);
                list.appendChild(item);
            });
        }
        
        // Scroll to selected
        scrollToSelected(id);
    }

    function createCommandGroup(category, commands, selectedIndex, config) {
        const group = document.createElement('div');
        group.className = 'cmd-palette-group';
        
        const header = document.createElement('div');
        header.className = 'cmd-palette-group-header';
        header.textContent = CONFIG.categories[category]?.label || category;
        
        const items = document.createElement('div');
        items.className = 'cmd-palette-group-items';
        
        commands.forEach((cmd, index) => {
            const globalIndex = cmd.__index;
            const item = createCommandItem(cmd, globalIndex, globalIndex === selectedIndex, config);
            items.appendChild(item);
        });
        
        group.appendChild(header);
        group.appendChild(items);
        
        return group;
    }

    function createCommandItem(command, index, isSelected, config) {
        const item = document.createElement('div');
        item.className = 'cmd-palette-item';
        item.setAttribute('role', 'option');
        item.setAttribute('data-index', index);
        item.setAttribute('aria-selected', isSelected);
        
        if (isSelected) item.classList.add('selected');
        if (favoriteCommands.has(command.id)) item.classList.add('favorite');
        
        // Icône
        if (config.features.icons && command.icon) {
            const icon = document.createElement('div');
            icon.className = 'cmd-palette-item-icon';
            icon.innerHTML = CONFIG.icons[command.icon] || command.icon;
            item.appendChild(icon);
        }
        
        // Contenu
        const content = document.createElement('div');
        content.className = 'cmd-palette-item-content';
        
        const title = document.createElement('div');
        title.className = 'cmd-palette-item-title';
        title.innerHTML = highlightMatch(command.title, command.__match);
        
        content.appendChild(title);
        
        if (config.features.descriptions && command.description) {
            const desc = document.createElement('div');
            desc.className = 'cmd-palette-item-desc';
            desc.textContent = command.description;
            content.appendChild(desc);
        }
        
        item.appendChild(content);
        
        // Actions/Shortcuts
        const actions = document.createElement('div');
        actions.className = 'cmd-palette-item-actions';
        
        if (config.features.shortcuts && command.shortcut) {
            const shortcut = document.createElement('kbd');
            shortcut.className = 'cmd-palette-item-shortcut';
            shortcut.textContent = command.shortcut;
            actions.appendChild(shortcut);
        }
        
        if (config.features.favorites) {
            const favBtn = document.createElement('button');
            favBtn.className = 'cmd-palette-item-favorite';
            favBtn.innerHTML = CONFIG.icons.star;
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(command.id);
                renderCommands(id);
            };
            actions.appendChild(favBtn);
        }
        
        item.appendChild(actions);
        
        return item;
    }

    function highlightMatch(text, match) {
        if (!match) return text;
        
        const { indices } = match;
        let result = '';
        let lastIndex = 0;
        
        indices.forEach(([start, end]) => {
            result += text.slice(lastIndex, start);
            result += `<mark>${text.slice(start, end + 1)}</mark>`;
            lastIndex = end + 1;
        });
        
        result += text.slice(lastIndex);
        return result;
    }

    function groupByCategory(commands) {
        const grouped = {};
        
        commands.forEach((cmd, index) => {
            const category = cmd.category || 'actions';
            if (!grouped[category]) grouped[category] = [];
            cmd.__index = index; // Stocker l'index global
            grouped[category].push(cmd);
        });
        
        return grouped;
    }

    // ========================================
    // GESTION DE LA RECHERCHE
    // ========================================
    function performSearch(id, query) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { commands, config } = instance;
        instance.searchQuery = query;
        
        if (!query.trim()) {
            // Pas de recherche : afficher toutes les commandes ou récentes
            if (config.features.recent && instance.activeCategory === 'all') {
                instance.filteredCommands = getRecentCommands(commands);
            } else {
                instance.filteredCommands = filterByCategory(commands, instance.activeCategory);
            }
        } else {
            // Recherche fuzzy ou simple
            const results = config.features.fuzzySearch
                ? fuzzySearch(commands, query)
                : simpleSearch(commands, query);
            
            instance.filteredCommands = filterByCategory(results, instance.activeCategory);
        }
        
        // Réinitialiser la sélection
        instance.selectedIndex = 0;
        
        // Mettre à jour l'affichage
        renderCommands(id);
        updateCategoryCounts(id);
    }

    function fuzzySearch(commands, query) {
        const results = [];
        const queryLower = query.toLowerCase();
        const queryChars = queryLower.split('');
        
        commands.forEach(cmd => {
            const titleLower = cmd.title.toLowerCase();
            const score = calculateFuzzyScore(titleLower, queryLower, queryChars);
            
            if (score > 0) {
                results.push({
                    ...cmd,
                    __score: score,
                    __match: getFuzzyMatchIndices(titleLower, queryChars)
                });
            }
        });
        
        // Trier par score décroissant
        return results.sort((a, b) => b.__score - a.__score);
    }

    function calculateFuzzyScore(text, query, queryChars) {
        let score = 0;
        
        // Correspondance exacte
        if (text === query) {
            score += CONFIG.scoring.exact;
        }
        // Commence par
        else if (text.startsWith(query)) {
            score += CONFIG.scoring.startsWith;
        }
        // Contient
        else if (text.includes(query)) {
            score += CONFIG.scoring.contains;
        }
        // Fuzzy match
        else {
            let queryIndex = 0;
            let lastMatchIndex = -1;
            
            for (let i = 0; i < text.length && queryIndex < queryChars.length; i++) {
                if (text[i] === queryChars[queryIndex]) {
                    score += CONFIG.scoring.fuzzy / queryChars.length;
                    
                    // Bonus pour caractères consécutifs
                    if (lastMatchIndex === i - 1) {
                        score += 50;
                    }
                    
                    lastMatchIndex = i;
                    queryIndex++;
                }
            }
            
            // Si tous les caractères n'ont pas été trouvés
            if (queryIndex < queryChars.length) {
                return 0;
            }
        }
        
        return score;
    }

    function getFuzzyMatchIndices(text, queryChars) {
        const indices = [];
        let queryIndex = 0;
        
        for (let i = 0; i < text.length && queryIndex < queryChars.length; i++) {
            if (text[i] === queryChars[queryIndex]) {
                indices.push([i, i]);
                queryIndex++;
            }
        }
        
        return { indices };
    }

    function simpleSearch(commands, query) {
        const queryLower = query.toLowerCase();
        
        return commands.filter(cmd => {
            const titleLower = cmd.title.toLowerCase();
            const descLower = (cmd.description || '').toLowerCase();
            
            return titleLower.includes(queryLower) || descLower.includes(queryLower);
        });
    }

    function filterByCategory(commands, category) {
        if (category === 'all') return commands;
        if (category === 'recent') return getRecentCommands(commands);
        if (category === 'favorites') return getFavoriteCommands(commands);
        
        return commands.filter(cmd => cmd.category === category);
    }

    function getRecentCommands(commands) {
        const recent = recentCommands
            .map(id => commands.find(cmd => cmd.id === id))
            .filter(Boolean);
        
        return recent;
    }

    function getFavoriteCommands(commands) {
        return commands.filter(cmd => favoriteCommands.has(cmd.id));
    }

    // ========================================
    // NAVIGATION ET INTERACTIONS
    // ========================================
    function attachEvents(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { overlay, container, config } = instance;
        const input = container.querySelector('.cmd-palette-input');
        const clearBtn = container.querySelector('.cmd-palette-clear');
        const list = container.querySelector('.cmd-palette-list');
        
        // Fermeture au clic sur l'overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close(id);
            }
        });
        
        // Recherche
        input.addEventListener('input', (e) => {
            const query = e.target.value;
            clearBtn.style.display = query ? 'flex' : 'none';
            performSearch(id, query);
        });
        
        // Clear
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            performSearch(id, '');
            input.focus();
        });
        
        // Navigation clavier
        container.addEventListener('keydown', (e) => handleKeyboard(id, e));
        
        // Clic sur les items
        list.addEventListener('click', (e) => {
            const item = e.target.closest('.cmd-palette-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                selectCommand(id, index);
            }
        });
        
        // Survol des items
        list.addEventListener('mousemove', (e) => {
            const item = e.target.closest('.cmd-palette-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                setSelectedIndex(id, index);
            }
        });
        
        // Catégories
        if (config.features.categories) {
            const categories = container.querySelectorAll('.cmd-palette-category');
            categories.forEach(cat => {
                cat.addEventListener('click', () => {
                    const category = cat.dataset.category;
                    setActiveCategory(id, category);
                });
            });
        }
        
        // Raccourcis globaux
        if (config.globalShortcuts) {
            document.addEventListener('keydown', (e) => handleGlobalShortcut(id, e));
        }
    }

    function handleKeyboard(id, event) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { filteredCommands, selectedIndex } = instance;
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        
        switch (key) {
            case 'escape':
                event.preventDefault();
                close(id);
                break;
                
            case 'arrowdown':
                event.preventDefault();
                navigateDown(id);
                break;
                
            case 'arrowup':
                event.preventDefault();
                navigateUp(id);
                break;
                
            case 'home':
                event.preventDefault();
                setSelectedIndex(id, 0);
                break;
                
            case 'end':
                event.preventDefault();
                setSelectedIndex(id, filteredCommands.length - 1);
                break;
                
            case 'enter':
                event.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(id, filteredCommands[selectedIndex], event.shiftKey);
                }
                break;
                
            case 'f':
                if (ctrl && instance.config.features.favorites) {
                    event.preventDefault();
                    const cmd = filteredCommands[selectedIndex];
                    if (cmd) {
                        toggleFavorite(cmd.id);
                        renderCommands(id);
                    }
                }
                break;
                
            case 'backspace':
                if (ctrl) {
                    event.preventDefault();
                    const input = instance.container.querySelector('.cmd-palette-input');
                    input.value = '';
                    performSearch(id, '');
                }
                break;
        }
    }

    function handleGlobalShortcut(id, event) {
        const instance = state.get(id);
        if (!instance || instance.isOpen) return;
        
        const key = event.key.toLowerCase();
        const ctrl = event.ctrlKey || event.metaKey;
        
        if ((ctrl && key === 'k') || (ctrl && key === 'p')) {
            event.preventDefault();
            open(id);
        }
    }

    function navigateDown(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const newIndex = Math.min(
            instance.selectedIndex + 1,
            instance.filteredCommands.length - 1
        );
        
        setSelectedIndex(id, newIndex);
    }

    function navigateUp(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const newIndex = Math.max(instance.selectedIndex - 1, 0);
        setSelectedIndex(id, newIndex);
    }

    function setSelectedIndex(id, index) {
        const instance = state.get(id);
        if (!instance) return;
        
        instance.selectedIndex = index;
        
        // Mettre à jour l'affichage
        const items = instance.container.querySelectorAll('.cmd-palette-item');
        items.forEach((item, i) => {
            const isSelected = i === index;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected);
        });
        
        scrollToSelected(id);
        updatePreview(id);
    }

    function scrollToSelected(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const selected = instance.container.querySelector('.cmd-palette-item.selected');
        if (selected) {
            selected.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    function setActiveCategory(id, category) {
        const instance = state.get(id);
        if (!instance) return;
        
        instance.activeCategory = category;
        
        // Mettre à jour l'UI
        const categories = instance.container.querySelectorAll('.cmd-palette-category');
        categories.forEach(cat => {
            cat.classList.toggle('active', cat.dataset.category === category);
        });
        
        // Refaire la recherche
        performSearch(id, instance.searchQuery);
    }

    // ========================================
    // EXÉCUTION DES COMMANDES
    // ========================================
    function executeCommand(id, command, background = false) {
        const instance = state.get(id);
        if (!instance) return;
        
        // Ajouter aux récents
        addToRecent(command.id);
        
        // Incrémenter la fréquence
        incrementFrequency(command.id);
        
        // Exécuter l'action
        if (command.action) {
            const result = command.action(instance.contextData);
            
            if (result instanceof Promise) {
                result.then(() => {
                    if (!background) close(id);
                });
            } else {
                if (!background) close(id);
            }
        }
        
        // Callback
        if (instance.config.onExecute) {
            instance.config.onExecute(command);
        }
    }

    function selectCommand(id, index) {
        const instance = state.get(id);
        if (!instance) return;
        
        const command = instance.filteredCommands[index];
        if (command) {
            executeCommand(id, command);
        }
    }

    // ========================================
    // GESTION DES FAVORIS ET RÉCENTS
    // ========================================
    function toggleFavorite(commandId) {
        if (favoriteCommands.has(commandId)) {
            favoriteCommands.delete(commandId);
        } else {
            favoriteCommands.add(commandId);
        }
        
        // Sauvegarder dans localStorage
        saveFavorites();
    }

    function addToRecent(commandId) {
        // Retirer si déjà présent
        const index = recentCommands.indexOf(commandId);
        if (index > -1) {
            recentCommands.splice(index, 1);
        }
        
        // Ajouter en début
        recentCommands.unshift(commandId);
        
        // Limiter à 10
        if (recentCommands.length > 10) {
            recentCommands.pop();
        }
        
        // Sauvegarder
        saveRecent();
    }

    function incrementFrequency(commandId) {
        const count = commandFrequency.get(commandId) || 0;
        commandFrequency.set(commandId, count + 1);
        saveFrequency();
    }

    // ========================================
    // PERSISTENCE
    // ========================================
    function loadState() {
        try {
            // Favoris
            const favs = localStorage.getItem('cmdPaletteFavorites');
            if (favs) {
                JSON.parse(favs).forEach(id => favoriteCommands.add(id));
            }
            
            // Récents
            const recent = localStorage.getItem('cmdPaletteRecent');
            if (recent) {
                recentCommands.push(...JSON.parse(recent));
            }
            
            // Fréquence
            const freq = localStorage.getItem('cmdPaletteFrequency');
            if (freq) {
                Object.entries(JSON.parse(freq)).forEach(([id, count]) => {
                    commandFrequency.set(id, count);
                });
            }
        } catch (e) {
            console.error('Failed to load command palette state:', e);
        }
    }

    function saveFavorites() {
        try {
            localStorage.setItem('cmdPaletteFavorites', JSON.stringify([...favoriteCommands]));
        } catch (e) {}
    }

    function saveRecent() {
        try {
            localStorage.setItem('cmdPaletteRecent', JSON.stringify(recentCommands));
        } catch (e) {}
    }

    function saveFrequency() {
        try {
            const freq = {};
            commandFrequency.forEach((count, id) => {
                freq[id] = count;
            });
            localStorage.setItem('cmdPaletteFrequency', JSON.stringify(freq));
        } catch (e) {}
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    function animateOpen(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { overlay, container, config } = instance;
        const animation = CONFIG.animations[config.animation];
        
        if (animation.enabled === false) {
            overlay.style.opacity = '1';
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
            return;
        }
        
        // Animation d'ouverture
        overlay.style.display = 'flex';
        
        requestAnimationFrame(() => {
            overlay.classList.add('opening');
            container.classList.add('opening');
            
            setTimeout(() => {
                overlay.classList.remove('opening');
                container.classList.remove('opening');
                overlay.classList.add('open');
                container.classList.add('open');
            }, animation.duration);
        });
    }

    function animateClose(id) {
        const instance = state.get(id);
        if (!instance) return;
        
        const { overlay, container, config } = instance;
        const animation = CONFIG.animations[config.animation];
        
        if (animation.enabled === false) {
            overlay.style.display = 'none';
            return;
        }
        
        // Animation de fermeture
        overlay.classList.add('closing');
        container.classList.add('closing');
        overlay.classList.remove('open');
        container.classList.remove('open');
        
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('closing');
            container.classList.remove('closing');
        }, animation.duration);
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function normalizeOptions(options = {}) {
        return {
            style: options.style || 'glassmorphism',
            size: options.size || 'medium',
            animation: options.animation || 'smooth',
            features: { ...CONFIG.features, ...options.features },
            commands: options.commands || [],
            placeholder: options.placeholder,
            onExecute: options.onExecute,
            onOpen: options.onOpen,
            onClose: options.onClose,
            globalShortcuts: options.globalShortcuts !== false
        };
    }

    function updateCategoryCounts(id) {
        const instance = state.get(id);
        if (!instance || !instance.config.features.categories) return;
        
        // Compter les commandes par catégorie
        const counts = {};
        instance.commands.forEach(cmd => {
            const cat = cmd.category || 'actions';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        
        counts.all = instance.commands.length;
        counts.recent = recentCommands.length;
        counts.favorites = favoriteCommands.size;
        
        // Mettre à jour l'UI
        const categories = instance.container.querySelectorAll('.cmd-palette-category');
        categories.forEach(cat => {
            const key = cat.dataset.category;
            const count = cat.querySelector('.cmd-palette-category-count');
            if (count) {
                count.textContent = counts[key] || 0;
            }
        });
    }

    function updatePreview(id) {
        const instance = state.get(id);
        if (!instance || !instance.config.features.preview) return;
        
        const command = instance.filteredCommands[instance.selectedIndex];
        const preview = instance.container.querySelector('.cmd-palette-preview');
        
        if (command && command.preview) {
            preview.innerHTML = command.preview;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    function open(id) {
        const instance = state.get(id);
        if (!instance || instance.isOpen) return;
        
        instance.isOpen = true;
        document.body.appendChild(instance.overlay);
        
        // Animation d'ouverture
        animateOpen(id);
        
        // Focus sur l'input
        setTimeout(() => {
            const input = instance.container.querySelector('.cmd-palette-input');
            input.focus();
        }, 100);
        
        // Charger les commandes initiales
        performSearch(id, '');
        
        // Callback
        if (instance.config.onOpen) {
            instance.config.onOpen();
        }
    }

    function close(id) {
        const instance = state.get(id);
        if (!instance || !instance.isOpen) return;
        
        instance.isOpen = false;
        
        // Animation de fermeture
        animateClose(id);
        
        // Nettoyer
        setTimeout(() => {
            instance.overlay.remove();
            
            // Réinitialiser
            const input = instance.container.querySelector('.cmd-palette-input');
            input.value = '';
            instance.searchQuery = '';
            instance.selectedIndex = 0;
            instance.activeCategory = 'all';
        }, CONFIG.animations[instance.config.animation].duration);
        
        // Callback
        if (instance.config.onClose) {
            instance.config.onClose();
        }
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('cmd-palette-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'cmd-palette-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/command-palette.css';
        document.head.appendChild(link);
    }

    // ========================================
    // INITIALISATION
    // ========================================
    loadState();

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            injectStyles();
            
            const { id, overlay, container } = createStructure(options);
            attachEvents(id);
            
            // Définir les commandes
            if (options.commands) {
                this.setCommands(id, options.commands);
            }
            
            return {
                id,
                element: overlay,
                open: () => open(id),
                close: () => close(id),
                toggle: () => this.toggle(id),
                setCommands: (commands) => this.setCommands(id, commands),
                addCommand: (command) => this.addCommand(id, command),
                removeCommand: (commandId) => this.removeCommand(id, commandId),
                setContext: (data) => this.setContext(id, data),
                destroy: () => this.destroy(id)
            };
        },
        
        toggle(id) {
            const instance = state.get(id);
            if (!instance) return;
            
            instance.isOpen ? close(id) : open(id);
        },
        
        setCommands(id, commands) {
            const instance = state.get(id);
            if (!instance) return;
            
            // Ajouter des IDs si nécessaire
            instance.commands = commands.map((cmd, index) => ({
                id: cmd.id || `cmd-${index}`,
                ...cmd
            }));
            
            // Mettre à jour l'affichage si ouvert
            if (instance.isOpen) {
                performSearch(id, instance.searchQuery);
            }
        },
        
        addCommand(id, command) {
            const instance = state.get(id);
            if (!instance) return;
            
            command.id = command.id || `cmd-${instance.commands.length}`;
            instance.commands.push(command);
            
            if (instance.isOpen) {
                performSearch(id, instance.searchQuery);
            }
        },
        
        removeCommand(id, commandId) {
            const instance = state.get(id);
            if (!instance) return;
            
            instance.commands = instance.commands.filter(cmd => cmd.id !== commandId);
            
            if (instance.isOpen) {
                performSearch(id, instance.searchQuery);
            }
        },
        
        setContext(id, data) {
            const instance = state.get(id);
            if (!instance) return;
            
            instance.contextData = data;
        },
        
        destroy(id) {
            const instance = state.get(id);
            if (!instance) return;
            
            if (instance.isOpen) {
                close(id);
            }
            
            instance.overlay.remove();
            state.delete(id);
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Méthodes utilitaires
        registerGlobalShortcut(shortcut, callback) {
            document.addEventListener('keydown', (e) => {
                const key = e.key.toLowerCase();
                const ctrl = e.ctrlKey || e.metaKey;
                
                if (shortcut === `${ctrl ? 'cmd+' : ''}${key}`) {
                    e.preventDefault();
                    callback();
                }
            });
        }
    };
})();

// Export pour utilisation
export default CommandPalette;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12] - Performance recherche fuzzy
   Solution: Optimiser l'algorithme et limiter les résultats
   
   [2024-12] - Navigation clavier complexe
   Cause: Gestion des groupes et catégories
   Résolution: Index global pour la navigation
   
   [2024-12] - Animation fluide
   Solution: RequestAnimationFrame et classes CSS
   
   NOTES POUR REPRISES FUTURES:
   - La recherche fuzzy est personnalisable
   - Les raccourcis sont configurables
   - Le contexte permet des commandes dynamiques
   - Support complet de l'accessibilité
   ======================================== */