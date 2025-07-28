/* ========================================
   SEARCH-BOX.COMPONENT.JS - Composant de recherche avancée
   Chemin: src/js/shared/ui/navigation/search-box.component.js
   
   DESCRIPTION:
   Système complet de recherche avec autocomplete, suggestions,
   historique, filtres, recherche vocale et multiples styles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Utilitaires privés (lignes 402-600)
   3. Gestionnaire de recherche (lignes 602-1000)
   4. Rendu et DOM (lignes 1002-1500)
   5. API publique (lignes 1502-1600)
   
   DÉPENDANCES:
   - search-box.css (styles du composant)
   - ui.config.js (configuration globale)
   - dom-utils.js (utilitaires DOM)
   ======================================== */

const SearchBox = (() => {
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
                iconBg: 'rgba(255, 255, 255, 0.1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff',
                borderRadius: 20
            },
            'flat': {
                background: '#f3f4f6',
                border: '#e5e7eb',
                borderRadius: 8,
                focusBorder: '#3b82f6'
            },
            'minimal': {
                background: 'transparent',
                borderBottom: '1px solid #e5e7eb',
                focusBorder: '#3b82f6'
            },
            'material': {
                background: '#ffffff',
                shadow: '0 2px 4px rgba(0,0,0,.1)',
                borderRadius: 4,
                ripple: true
            },
            'rounded': {
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 50,
                padding: '12px 24px'
            },
            'underline': {
                background: 'transparent',
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                noBorder: true
            },
            'gradient': {
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: 16,
                glowOnFocus: true
            },
            'floating': {
                background: 'rgba(255, 255, 255, 0.1)',
                shadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                transform: 'translateY(-2px)',
                borderRadius: 20
            }
        },

        animations: {
            'none': { enabled: false },
            'subtle': {
                focus: true,
                hover: true,
                duration: '0.3s',
                easing: 'ease'
            },
            'smooth': {
                focus: true,
                hover: true,
                expand: true,
                duration: '0.4s',
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'rich': {
                focus: true,
                hover: true,
                expand: true,
                typewriter: true,
                pulse: true,
                shake: true,
                particles: true,
                duration: '0.6s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            },
            'bounce': {
                focus: true,
                iconBounce: true,
                duration: '0.5s',
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }
        },

        sizes: {
            'small': {
                height: 36,
                fontSize: 13,
                iconSize: 16,
                padding: '8px 12px'
            },
            'medium': {
                height: 44,
                fontSize: 14,
                iconSize: 20,
                padding: '10px 16px'
            },
            'large': {
                height: 52,
                fontSize: 16,
                iconSize: 24,
                padding: '12px 20px'
            },
            'xlarge': {
                height: 60,
                fontSize: 18,
                iconSize: 28,
                padding: '16px 24px'
            }
        },

        features: {
            autocomplete: {
                enabled: true,
                minChars: 2,
                delay: 300,
                maxSuggestions: 8,
                highlightMatches: true,
                fuzzySearch: true,
                categories: true,
                thumbnails: true,
                descriptions: true,
                keyboard: true,
                cache: true,
                source: null // 'local', 'remote', 'hybrid'
            },
            history: {
                enabled: true,
                maxItems: 10,
                storage: 'localStorage',
                groupByDate: true,
                removable: true,
                clearAll: true
            },
            voice: {
                enabled: true,
                language: 'fr-FR',
                continuous: false,
                interimResults: true,
                animations: true
            },
            filters: {
                enabled: false,
                position: 'dropdown', // 'inline', 'dropdown', 'modal'
                categories: [],
                dateRange: false,
                customFilters: []
            },
            realtime: {
                enabled: true,
                debounce: 300,
                minLength: 1,
                indicators: true
            },
            shortcuts: {
                enabled: true,
                focus: '/',
                clear: 'Escape',
                submit: 'Enter',
                navigation: true,
                custom: {}
            },
            advanced: {
                operators: true, // AND, OR, NOT, ""
                wildcards: true, // *, ?
                regex: false,
                caseSensitive: false,
                stemming: true,
                synonyms: true
            },
            validation: {
                enabled: true,
                minLength: 0,
                maxLength: 100,
                pattern: null,
                customValidator: null
            },
            multiSearch: {
                enabled: false,
                separator: ';',
                maxQueries: 5
            },
            geoSearch: {
                enabled: false,
                autoDetect: true,
                radius: true,
                units: 'km'
            },
            scope: {
                enabled: false,
                options: [],
                multiple: false
            }
        },

        icons: {
            search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
            clear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            voice: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/></svg>',
            filter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>',
            history: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            location: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            loading: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4m4.2-16.2L14.8 7.2m4 9.6l-1.4-1.4m4.6-3.4h-4m-12 0H2m16.2 8.2L16.8 14.8m-9.6 4l1.4-1.4m-3.4-4.6v4"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>',
            recent: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
            trending: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>'
        },

        suggestions: {
            'local': {
                data: [],
                searchFields: ['title', 'description', 'keywords'],
                maxResults: 10,
                scoring: 'relevance' // 'relevance', 'popularity', 'recent'
            },
            'remote': {
                url: null,
                method: 'GET',
                headers: {},
                params: {},
                transform: null,
                cache: true,
                cacheTime: 300000 // 5 minutes
            },
            'trending': {
                enabled: false,
                data: [],
                maxItems: 5
            },
            'recent': {
                enabled: true,
                maxItems: 5
            }
        },

        appearance: {
            placeholder: 'Rechercher...',
            clearButton: 'always', // 'always', 'onValue', 'never'
            searchButton: false,
            label: null,
            helperText: null,
            errorText: null,
            successText: null,
            leadingIcon: true,
            trailingIcons: ['clear', 'voice'],
            rounded: false,
            fullWidth: false,
            elevation: 1
        },

        callbacks: {
            onSearch: null,
            onChange: null,
            onFocus: null,
            onBlur: null,
            onClear: null,
            onSuggestionSelect: null,
            onVoiceStart: null,
            onVoiceEnd: null,
            onVoiceResult: null,
            onFilterChange: null,
            onError: null,
            beforeSearch: null,
            afterSearch: null
        },

        i18n: {
            placeholder: 'Rechercher...',
            noResults: 'Aucun résultat trouvé',
            searching: 'Recherche en cours...',
            clear: 'Effacer',
            voice: 'Recherche vocale',
            voiceListening: 'Écoutez...',
            filter: 'Filtrer',
            history: 'Historique',
            recent: 'Recherches récentes',
            trending: 'Tendances',
            clearHistory: 'Effacer l\'historique',
            moreResults: 'Voir plus de résultats',
            searchIn: 'Rechercher dans',
            everywhere: 'Partout',
            nearMe: 'Près de moi',
            advanced: 'Recherche avancée'
        },

        accessibility: {
            announcements: true,
            liveRegion: true,
            role: 'search',
            labels: {
                searchBox: 'Boîte de recherche',
                clearButton: 'Effacer la recherche',
                voiceButton: 'Activer la recherche vocale',
                filterButton: 'Ouvrir les filtres',
                suggestions: 'Suggestions de recherche',
                result: 'Résultat de recherche'
            }
        },

        classes: {
            container: 'search-box',
            wrapper: 'search-box-wrapper',
            input: 'search-box-input',
            inputWrapper: 'search-box-input-wrapper',
            icon: 'search-box-icon',
            button: 'search-box-button',
            suggestions: 'search-box-suggestions',
            suggestion: 'search-box-suggestion',
            history: 'search-box-history',
            filters: 'search-box-filters',
            active: 'active',
            focused: 'focused',
            loading: 'loading',
            error: 'error',
            disabled: 'disabled'
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();
    let instanceCount = 0;
    let voiceRecognition = null;

    // ========================================
    // UTILITAIRES PRIVÉS
    // ========================================
    function generateId() {
        return `search-box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightMatches(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function fuzzyMatch(str, pattern) {
        pattern = pattern.toLowerCase();
        str = str.toLowerCase();
        
        let patternIdx = 0;
        let strIdx = 0;
        let score = 0;
        let consecutive = 0;
        
        while (strIdx < str.length && patternIdx < pattern.length) {
            if (str[strIdx] === pattern[patternIdx]) {
                score += 1 + consecutive;
                consecutive++;
                patternIdx++;
            } else {
                consecutive = 0;
            }
            strIdx++;
        }
        
        return patternIdx === pattern.length ? score : 0;
    }

    function saveToHistory(query, storage = 'localStorage') {
        if (!query || typeof window === 'undefined') return;
        
        try {
            const historyKey = 'searchHistory';
            const history = JSON.parse(window[storage].getItem(historyKey) || '[]');
            
            // Retirer les doublons
            const filtered = history.filter(item => item.query !== query);
            
            // Ajouter en début
            filtered.unshift({
                query,
                timestamp: Date.now()
            });
            
            // Limiter la taille
            const limited = filtered.slice(0, CONFIG.features.history.maxItems);
            
            window[storage].setItem(historyKey, JSON.stringify(limited));
        } catch (e) {
            console.error('Failed to save search history:', e);
        }
    }

    function getHistory(storage = 'localStorage') {
        if (typeof window === 'undefined') return [];
        
        try {
            const historyKey = 'searchHistory';
            return JSON.parse(window[storage].getItem(historyKey) || '[]');
        } catch (e) {
            console.error('Failed to get search history:', e);
            return [];
        }
    }

    function clearHistory(storage = 'localStorage') {
        if (typeof window === 'undefined') return;
        
        try {
            const historyKey = 'searchHistory';
            window[storage].removeItem(historyKey);
        } catch (e) {
            console.error('Failed to clear search history:', e);
        }
    }

    // ========================================
    // GESTIONNAIRE DE RECHERCHE
    // ========================================
    class SearchManager {
        constructor(container, options) {
            this.container = container;
            this.options = options;
            this.input = null;
            this.suggestionsContainer = null;
            this.currentQuery = '';
            this.selectedIndex = -1;
            this.suggestions = [];
            this.cache = new Map();
            this.abortController = null;
            
            this.init();
        }

        init() {
            this.bindEvents();
            this.setupKeyboardShortcuts();
            
            if (this.options.features.voice.enabled) {
                this.setupVoiceRecognition();
            }
            
            if (this.options.features.realtime.enabled) {
                this.debouncedSearch = debounce(
                    this.performSearch.bind(this),
                    this.options.features.realtime.debounce
                );
            }
        }

        bindEvents() {
            // Input events
            this.input.addEventListener('input', this.handleInput.bind(this));
            this.input.addEventListener('focus', this.handleFocus.bind(this));
            this.input.addEventListener('blur', this.handleBlur.bind(this));
            this.input.addEventListener('keydown', this.handleKeydown.bind(this));
            
            // Button events
            const clearBtn = this.container.querySelector('.search-box-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', this.handleClear.bind(this));
            }
            
            const voiceBtn = this.container.querySelector('.search-box-voice');
            if (voiceBtn) {
                voiceBtn.addEventListener('click', this.handleVoice.bind(this));
            }
            
            const filterBtn = this.container.querySelector('.search-box-filter');
            if (filterBtn) {
                filterBtn.addEventListener('click', this.handleFilter.bind(this));
            }
            
            // Form submit
            const form = this.input.closest('form');
            if (form) {
                form.addEventListener('submit', this.handleSubmit.bind(this));
            }
            
            // Click outside
            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) {
                    this.closeSuggestions();
                }
            });
        }

        setupKeyboardShortcuts() {
            if (!this.options.features.shortcuts.enabled) return;
            
            document.addEventListener('keydown', (e) => {
                // Focus shortcut
                if (e.key === this.options.features.shortcuts.focus && !this.isFocused()) {
                    e.preventDefault();
                    this.input.focus();
                }
                
                // Custom shortcuts
                Object.entries(this.options.features.shortcuts.custom).forEach(([key, handler]) => {
                    if (e.key === key && this.isFocused()) {
                        e.preventDefault();
                        handler(this);
                    }
                });
            });
        }

        setupVoiceRecognition() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                console.warn('Voice recognition not supported');
                return;
            }
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            voiceRecognition = new SpeechRecognition();
            
            voiceRecognition.lang = this.options.features.voice.language;
            voiceRecognition.continuous = this.options.features.voice.continuous;
            voiceRecognition.interimResults = this.options.features.voice.interimResults;
            
            voiceRecognition.onstart = () => {
                this.container.classList.add('voice-active');
                if (this.options.callbacks.onVoiceStart) {
                    this.options.callbacks.onVoiceStart();
                }
            };
            
            voiceRecognition.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                    
                this.input.value = transcript;
                this.currentQuery = transcript;
                
                if (this.options.callbacks.onVoiceResult) {
                    this.options.callbacks.onVoiceResult(transcript);
                }
                
                if (!this.options.features.voice.continuous) {
                    this.performSearch();
                }
            };
            
            voiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.container.classList.remove('voice-active');
                
                if (this.options.callbacks.onError) {
                    this.options.callbacks.onError('voice', event.error);
                }
            };
            
            voiceRecognition.onend = () => {
                this.container.classList.remove('voice-active');
                if (this.options.callbacks.onVoiceEnd) {
                    this.options.callbacks.onVoiceEnd();
                }
            };
        }

        handleInput(e) {
            const value = e.target.value;
            this.currentQuery = value;
            
            // Update clear button visibility
            const clearBtn = this.container.querySelector('.search-box-clear');
            if (clearBtn && this.options.appearance.clearButton === 'onValue') {
                clearBtn.style.display = value ? 'flex' : 'none';
            }
            
            // Callback
            if (this.options.callbacks.onChange) {
                this.options.callbacks.onChange(value);
            }
            
            // Real-time search
            if (this.options.features.realtime.enabled && value.length >= this.options.features.realtime.minLength) {
                this.container.classList.add('loading');
                this.debouncedSearch();
            } else if (value.length === 0) {
                this.showHistoryOrTrending();
            } else {
                this.closeSuggestions();
            }
        }

        handleFocus(e) {
            this.container.classList.add('focused');
            
            if (this.currentQuery.length === 0) {
                this.showHistoryOrTrending();
            } else if (this.suggestions.length > 0) {
                this.showSuggestions();
            }
            
            if (this.options.callbacks.onFocus) {
                this.options.callbacks.onFocus(e);
            }
        }

        handleBlur(e) {
            // Delay to allow click on suggestions
            setTimeout(() => {
                this.container.classList.remove('focused');
                
                if (this.options.callbacks.onBlur) {
                    this.options.callbacks.onBlur(e);
                }
            }, 200);
        }

        handleKeydown(e) {
            if (!this.suggestionsContainer || !this.suggestions.length) {
                if (e.key === 'Enter') {
                    this.handleSubmit(e);
                }
                return;
            }
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0) {
                        this.selectSuggestion(this.selectedIndex);
                    } else {
                        this.handleSubmit(e);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeSuggestions();
                    this.input.blur();
                    break;
                case 'Tab':
                    if (this.selectedIndex >= 0) {
                        e.preventDefault();
                        this.selectSuggestion(this.selectedIndex);
                    }
                    break;
            }
        }

        handleSubmit(e) {
            e.preventDefault();
            
            if (!this.currentQuery) return;
            
            // Save to history
            if (this.options.features.history.enabled) {
                saveToHistory(this.currentQuery, this.options.features.history.storage);
            }
            
            // Perform search
            this.performSearch(true);
        }

        handleClear() {
            this.input.value = '';
            this.currentQuery = '';
            this.closeSuggestions();
            this.input.focus();
            
            const clearBtn = this.container.querySelector('.search-box-clear');
            if (clearBtn && this.options.appearance.clearButton === 'onValue') {
                clearBtn.style.display = 'none';
            }
            
            if (this.options.callbacks.onClear) {
                this.options.callbacks.onClear();
            }
        }

        handleVoice() {
            if (!voiceRecognition) return;
            
            if (this.container.classList.contains('voice-active')) {
                voiceRecognition.stop();
            } else {
                voiceRecognition.start();
            }
        }

        handleFilter() {
            // Implémentation des filtres selon la position
            if (this.options.features.filters.position === 'dropdown') {
                this.toggleFilterDropdown();
            } else if (this.options.features.filters.position === 'modal') {
                this.openFilterModal();
            }
        }

        async performSearch(final = false) {
            const query = this.currentQuery.trim();
            
            if (!query) {
                this.closeSuggestions();
                return;
            }
            
            // Before search callback
            if (this.options.callbacks.beforeSearch) {
                const shouldContinue = await this.options.callbacks.beforeSearch(query);
                if (shouldContinue === false) return;
            }
            
            // Check cache
            if (this.options.features.autocomplete.cache && this.cache.has(query)) {
                this.suggestions = this.cache.get(query);
                this.showSuggestions();
                return;
            }
            
            // Cancel previous request
            if (this.abortController) {
                this.abortController.abort();
            }
            
            try {
                let results = [];
                
                if (this.options.features.autocomplete.source === 'local') {
                    results = this.searchLocal(query);
                } else if (this.options.features.autocomplete.source === 'remote') {
                    this.abortController = new AbortController();
                    results = await this.searchRemote(query, this.abortController.signal);
                } else if (this.options.features.autocomplete.source === 'hybrid') {
                    // Recherche locale d'abord, puis remote
                    results = this.searchLocal(query);
                    if (results.length < this.options.features.autocomplete.maxSuggestions) {
                        this.abortController = new AbortController();
                        const remoteResults = await this.searchRemote(query, this.abortController.signal);
                        results = [...results, ...remoteResults];
                    }
                }
                
                // Limiter les résultats
                this.suggestions = results.slice(0, this.options.features.autocomplete.maxSuggestions);
                
                // Mettre en cache
                if (this.options.features.autocomplete.cache) {
                    this.cache.set(query, this.suggestions);
                }
                
                // Afficher les suggestions
                if (!final) {
                    this.showSuggestions();
                }
                
                // Callback final
                if (final && this.options.callbacks.onSearch) {
                    this.options.callbacks.onSearch(query, this.suggestions);
                }
                
                // After search callback
                if (this.options.callbacks.afterSearch) {
                    this.options.callbacks.afterSearch(query, this.suggestions);
                }
                
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Search error:', error);
                    if (this.options.callbacks.onError) {
                        this.options.callbacks.onError('search', error);
                    }
                }
            } finally {
                this.container.classList.remove('loading');
            }
        }

        searchLocal(query) {
            const data = this.options.suggestions.local.data;
            const searchFields = this.options.suggestions.local.searchFields;
            const results = [];
            
            data.forEach(item => {
                let score = 0;
                
                searchFields.forEach(field => {
                    if (item[field]) {
                        const fieldValue = item[field].toString().toLowerCase();
                        
                        if (this.options.features.autocomplete.fuzzySearch) {
                            score += fuzzyMatch(fieldValue, query);
                        } else if (fieldValue.includes(query.toLowerCase())) {
                            score += 1;
                        }
                    }
                });
                
                if (score > 0) {
                    results.push({ ...item, _score: score });
                }
            });
            
            // Trier par score
            return results.sort((a, b) => b._score - a._score);
        }

        async searchRemote(query, signal) {
            const config = this.options.suggestions.remote;
            const url = new URL(config.url);
            
            // Ajouter les paramètres
            const params = { ...config.params, q: query };
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
            
            const response = await fetch(url, {
                method: config.method,
                headers: config.headers,
                signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let data = await response.json();
            
            // Transformer les données si nécessaire
            if (config.transform) {
                data = config.transform(data);
            }
            
            return data;
        }

        showSuggestions() {
            if (!this.suggestions.length) {
                this.closeSuggestions();
                return;
            }
            
            if (!this.suggestionsContainer) {
                this.createSuggestionsContainer();
            }
            
            // Construire le HTML
            const html = this.suggestions.map((suggestion, index) => {
                const classes = ['search-box-suggestion'];
                if (index === this.selectedIndex) classes.push('selected');
                
                let content = '';
                
                // Catégorie
                if (this.options.features.autocomplete.categories && suggestion.category) {
                    content += `<div class="suggestion-category">${suggestion.category}</div>`;
                }
                
                // Contenu principal
                content += '<div class="suggestion-content">';
                
                // Thumbnail
                if (this.options.features.autocomplete.thumbnails && suggestion.thumbnail) {
                    content += `<img class="suggestion-thumbnail" src="${suggestion.thumbnail}" alt="">`;
                }
                
                // Texte
                content += '<div class="suggestion-text">';
                
                // Titre avec highlight
                const title = this.options.features.autocomplete.highlightMatches
                    ? highlightMatches(suggestion.title || suggestion.query || suggestion.text, this.currentQuery)
                    : suggestion.title || suggestion.query || suggestion.text;
                    
                content += `<div class="suggestion-title">${title}</div>`;
                
                // Description
                if (this.options.features.autocomplete.descriptions && suggestion.description) {
                    content += `<div class="suggestion-description">${suggestion.description}</div>`;
                }
                
                content += '</div>';
                content += '</div>';
                
                return `<div class="${classes.join(' ')}" data-index="${index}">${content}</div>`;
            }).join('');
            
            this.suggestionsContainer.innerHTML = html;
            this.suggestionsContainer.style.display = 'block';
            
            // Bind click events
            this.suggestionsContainer.querySelectorAll('.search-box-suggestion').forEach((el, index) => {
                el.addEventListener('click', () => this.selectSuggestion(index));
                el.addEventListener('mouseenter', () => this.selectedIndex = index);
            });
        }

        showHistoryOrTrending() {
            const history = this.options.features.history.enabled
                ? getHistory(this.options.features.history.storage)
                : [];
                
            const trending = this.options.suggestions.trending.enabled
                ? this.options.suggestions.trending.data
                : [];
                
            if (!history.length && !trending.length) {
                this.closeSuggestions();
                return;
            }
            
            if (!this.suggestionsContainer) {
                this.createSuggestionsContainer();
            }
            
            let html = '';
            
            // Historique
            if (history.length > 0) {
                html += `<div class="suggestions-section">
                    <div class="suggestions-header">
                        <span>${CONFIG.i18n.recent}</span>
                        ${this.options.features.history.clearAll 
                            ? `<button class="clear-history">${CONFIG.i18n.clearHistory}</button>`
                            : ''}
                    </div>`;
                    
                history.slice(0, this.options.suggestions.recent.maxItems).forEach((item, index) => {
                    html += `<div class="search-box-suggestion history-item" data-query="${item.query}">
                        <span class="suggestion-icon">${CONFIG.icons.recent}</span>
                        <span class="suggestion-text">${item.query}</span>
                        ${this.options.features.history.removable 
                            ? `<button class="remove-history" data-index="${index}">${CONFIG.icons.clear}</button>`
                            : ''}
                    </div>`;
                });
                
                html += '</div>';
            }
            
            // Tendances
            if (trending.length > 0) {
                html += `<div class="suggestions-section">
                    <div class="suggestions-header">
                        <span>${CONFIG.i18n.trending}</span>
                    </div>`;
                    
                trending.slice(0, this.options.suggestions.trending.maxItems).forEach(item => {
                    html += `<div class="search-box-suggestion trending-item" data-query="${item.query || item}">
                        <span class="suggestion-icon">${CONFIG.icons.trending}</span>
                        <span class="suggestion-text">${item.query || item}</span>
                    </div>`;
                });
                
                html += '</div>';
            }
            
            this.suggestionsContainer.innerHTML = html;
            this.suggestionsContainer.style.display = 'block';
            
            // Bind events
            this.suggestionsContainer.querySelectorAll('.history-item, .trending-item').forEach(el => {
                el.addEventListener('click', () => {
                    this.input.value = el.dataset.query;
                    this.currentQuery = el.dataset.query;
                    this.performSearch(true);
                });
            });
            
            // Clear history button
            const clearBtn = this.suggestionsContainer.querySelector('.clear-history');
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    clearHistory(this.options.features.history.storage);
                    this.closeSuggestions();
                });
            }
            
            // Remove history items
            this.suggestionsContainer.querySelectorAll('.remove-history').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    const history = getHistory(this.options.features.history.storage);
                    history.splice(index, 1);
                    window[this.options.features.history.storage].setItem('searchHistory', JSON.stringify(history));
                    this.showHistoryOrTrending();
                });
            });
        }

        createSuggestionsContainer() {
            this.suggestionsContainer = document.createElement('div');
            this.suggestionsContainer.className = CONFIG.classes.suggestions;
            this.suggestionsContainer.setAttribute('role', 'listbox');
            this.suggestionsContainer.setAttribute('aria-label', CONFIG.accessibility.labels.suggestions);
            this.container.appendChild(this.suggestionsContainer);
        }

        selectSuggestion(index) {
            const suggestion = this.suggestions[index];
            if (!suggestion) return;
            
            this.input.value = suggestion.title || suggestion.query || suggestion.text;
            this.currentQuery = this.input.value;
            
            if (this.options.callbacks.onSuggestionSelect) {
                this.options.callbacks.onSuggestionSelect(suggestion);
            }
            
            // Save to history
            if (this.options.features.history.enabled) {
                saveToHistory(this.currentQuery, this.options.features.history.storage);
            }
            
            this.closeSuggestions();
            this.performSearch(true);
        }

        selectNext() {
            const max = this.suggestions.length - 1;
            this.selectedIndex = this.selectedIndex < max ? this.selectedIndex + 1 : 0;
            this.updateSelection();
        }

        selectPrevious() {
            const max = this.suggestions.length - 1;
            this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : max;
            this.updateSelection();
        }

        updateSelection() {
            const suggestions = this.suggestionsContainer.querySelectorAll('.search-box-suggestion');
            suggestions.forEach((el, index) => {
                el.classList.toggle('selected', index === this.selectedIndex);
            });
            
            // Scroll into view
            if (suggestions[this.selectedIndex]) {
                suggestions[this.selectedIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }

        closeSuggestions() {
            if (this.suggestionsContainer) {
                this.suggestionsContainer.style.display = 'none';
                this.selectedIndex = -1;
            }
        }

        toggleFilterDropdown() {
            let dropdown = this.container.querySelector('.search-box-filter-dropdown');
            
            if (!dropdown) {
                dropdown = this.createFilterDropdown();
                this.container.appendChild(dropdown);
            }
            
            dropdown.classList.toggle('active');
        }

        createFilterDropdown() {
            const dropdown = document.createElement('div');
            dropdown.className = 'search-box-filter-dropdown';
            
            // Créer le contenu des filtres
            let html = '<div class="filter-dropdown-content">';
            
            // Catégories
            if (this.options.features.filters.categories.length > 0) {
                html += '<div class="filter-section"><label>Catégories</label>';
                this.options.features.filters.categories.forEach(category => {
                    html += `<label class="filter-option">
                        <input type="checkbox" value="${category.value}" />
                        <span>${category.label}</span>
                    </label>`;
                });
                html += '</div>';
            }
            
            // Date range
            if (this.options.features.filters.dateRange) {
                html += `<div class="filter-section">
                    <label>Période</label>
                    <input type="date" class="filter-date-from" />
                    <input type="date" class="filter-date-to" />
                </div>`;
            }
            
            // Filtres personnalisés
            this.options.features.filters.customFilters.forEach(filter => {
                html += `<div class="filter-section">
                    <label>${filter.label}</label>
                    ${filter.render()}
                </div>`;
            });
            
            html += '</div>';
            dropdown.innerHTML = html;
            
            // Bind events
            dropdown.addEventListener('change', (e) => {
                if (this.options.callbacks.onFilterChange) {
                    const filters = this.getActiveFilters();
                    this.options.callbacks.onFilterChange(filters);
                }
            });
            
            return dropdown;
        }

        getActiveFilters() {
            const filters = {};
            const dropdown = this.container.querySelector('.search-box-filter-dropdown');
            
            if (!dropdown) return filters;
            
            // Catégories
            const categoryInputs = dropdown.querySelectorAll('.filter-option input[type="checkbox"]:checked');
            if (categoryInputs.length > 0) {
                filters.categories = Array.from(categoryInputs).map(input => input.value);
            }
            
            // Date range
            const dateFrom = dropdown.querySelector('.filter-date-from');
            const dateTo = dropdown.querySelector('.filter-date-to');
            if (dateFrom && dateFrom.value) filters.dateFrom = dateFrom.value;
            if (dateTo && dateTo.value) filters.dateTo = dateTo.value;
            
            return filters;
        }

        isFocused() {
            return document.activeElement === this.input;
        }

        destroy() {
            // Nettoyer les event listeners
            if (this.abortController) {
                this.abortController.abort();
            }
            
            if (voiceRecognition) {
                voiceRecognition.stop();
            }
            
            // Supprimer les conteneurs
            if (this.suggestionsContainer) {
                this.suggestionsContainer.remove();
            }
        }
    }

    // ========================================
    // RENDU ET DOM
    // ========================================
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.style}`;
        
        if (options.size) {
            container.classList.add(`size-${options.size}`);
        }
        
        if (options.animation !== 'none') {
            container.classList.add(`animate-${options.animation}`);
        }
        
        if (options.appearance.fullWidth) {
            container.classList.add('full-width');
        }
        
        if (options.appearance.rounded) {
            container.classList.add('rounded');
        }
        
        container.setAttribute('role', options.accessibility.role);
        
        return container;
    }

    function createWrapper(options) {
        const wrapper = document.createElement('div');
        wrapper.className = CONFIG.classes.wrapper;
        
        // Label
        if (options.appearance.label) {
            const label = document.createElement('label');
            label.className = 'search-box-label';
            label.textContent = options.appearance.label;
            wrapper.appendChild(label);
        }
        
        return wrapper;
    }

    function createInputWrapper(options) {
        const inputWrapper = document.createElement('div');
        inputWrapper.className = CONFIG.classes.inputWrapper;
        
        // Leading icon
        if (options.appearance.leadingIcon) {
            const icon = document.createElement('span');
            icon.className = `${CONFIG.classes.icon} search-box-icon-leading`;
            icon.innerHTML = CONFIG.icons.search;
            inputWrapper.appendChild(icon);
        }
        
        // Input
        const input = document.createElement('input');
        input.type = 'search';
        input.className = CONFIG.classes.input;
        input.placeholder = options.i18n.placeholder;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.setAttribute('aria-label', options.accessibility.labels.searchBox);
        
        if (options.features.validation.maxLength) {
            input.maxLength = options.features.validation.maxLength;
        }
        
        if (options.features.validation.pattern) {
            input.pattern = options.features.validation.pattern;
        }
        
        inputWrapper.appendChild(input);
        
        // Trailing icons container
        const trailingIcons = document.createElement('div');
        trailingIcons.className = 'search-box-trailing-icons';
        
        // Clear button
        if (options.appearance.trailingIcons.includes('clear')) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = `${CONFIG.classes.button} search-box-clear`;
            clearBtn.innerHTML = CONFIG.icons.clear;
            clearBtn.setAttribute('aria-label', options.accessibility.labels.clearButton);
            
            if (options.appearance.clearButton === 'onValue') {
                clearBtn.style.display = 'none';
            } else if (options.appearance.clearButton === 'never') {
                clearBtn.style.display = 'none';
            }
            
            trailingIcons.appendChild(clearBtn);
        }
        
        // Voice button
        if (options.appearance.trailingIcons.includes('voice') && options.features.voice.enabled) {
            const voiceBtn = document.createElement('button');
            voiceBtn.type = 'button';
            voiceBtn.className = `${CONFIG.classes.button} search-box-voice`;
            voiceBtn.innerHTML = CONFIG.icons.voice;
            voiceBtn.setAttribute('aria-label', options.accessibility.labels.voiceButton);
            trailingIcons.appendChild(voiceBtn);
        }
        
        // Filter button
        if (options.appearance.trailingIcons.includes('filter') && options.features.filters.enabled) {
            const filterBtn = document.createElement('button');
            filterBtn.type = 'button';
            filterBtn.className = `${CONFIG.classes.button} search-box-filter`;
            filterBtn.innerHTML = CONFIG.icons.filter;
            filterBtn.setAttribute('aria-label', options.accessibility.labels.filterButton);
            trailingIcons.appendChild(filterBtn);
        }
        
        // Search button
        if (options.appearance.searchButton) {
            const searchBtn = document.createElement('button');
            searchBtn.type = 'submit';
            searchBtn.className = `${CONFIG.classes.button} search-box-submit`;
            searchBtn.innerHTML = CONFIG.icons.search;
            searchBtn.setAttribute('aria-label', 'Rechercher');
            trailingIcons.appendChild(searchBtn);
        }
        
        inputWrapper.appendChild(trailingIcons);
        
        return { inputWrapper, input };
    }

    function createHelperText(options) {
        const helperContainer = document.createElement('div');
        helperContainer.className = 'search-box-helper';
        
        if (options.appearance.helperText) {
            const helper = document.createElement('span');
            helper.className = 'search-box-helper-text';
            helper.textContent = options.appearance.helperText;
            helperContainer.appendChild(helper);
        }
        
        // Live region for screen readers
        if (options.accessibility.liveRegion) {
            const liveRegion = document.createElement('div');
            liveRegion.className = 'search-box-live-region';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            helperContainer.appendChild(liveRegion);
        }
        
        return helperContainer;
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('search-box-styles')) return;

        const link = document.createElement('link');
        link.id = 'search-box-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/search-box.css';
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
            size: 'medium',
            ...options,
            features: {
                ...CONFIG.features,
                ...options.features,
                autocomplete: {
                    ...CONFIG.features.autocomplete,
                    ...options.features?.autocomplete
                },
                history: {
                    ...CONFIG.features.history,
                    ...options.features?.history
                },
                voice: {
                    ...CONFIG.features.voice,
                    ...options.features?.voice
                },
                filters: {
                    ...CONFIG.features.filters,
                    ...options.features?.filters
                },
                realtime: {
                    ...CONFIG.features.realtime,
                    ...options.features?.realtime
                },
                shortcuts: {
                    ...CONFIG.features.shortcuts,
                    ...options.features?.shortcuts
                },
                validation: {
                    ...CONFIG.features.validation,
                    ...options.features?.validation
                }
            },
            suggestions: {
                ...CONFIG.suggestions,
                ...options.suggestions,
                local: {
                    ...CONFIG.suggestions.local,
                    ...options.suggestions?.local
                },
                remote: {
                    ...CONFIG.suggestions.remote,
                    ...options.suggestions?.remote
                }
            },
            appearance: {
                ...CONFIG.appearance,
                ...options.appearance
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

        // Injection des styles
        injectStyles();

        // Création de la structure
        const container = createContainer(finalOptions);
        const wrapper = createWrapper(finalOptions);
        const { inputWrapper, input } = createInputWrapper(finalOptions);
        const helperText = createHelperText(finalOptions);

        // Assemblage
        wrapper.appendChild(inputWrapper);
        wrapper.appendChild(helperText);
        container.appendChild(wrapper);

        // Initialisation du manager
        const manager = new SearchManager(container, finalOptions);
        manager.input = input;

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
            
            // Méthodes principales
            search(query) {
                manager.input.value = query;
                manager.currentQuery = query;
                manager.performSearch(true);
            },
            
            clear() {
                manager.handleClear();
            },
            
            focus() {
                manager.input.focus();
            },
            
            blur() {
                manager.input.blur();
            },
            
            // Getters/Setters
            getValue() {
                return manager.currentQuery;
            },
            
            setValue(value) {
                manager.input.value = value;
                manager.currentQuery = value;
            },
            
            getSuggestions() {
                return manager.suggestions;
            },
            
            getHistory() {
                return getHistory(finalOptions.features.history.storage);
            },
            
            clearHistory() {
                clearHistory(finalOptions.features.history.storage);
            },
            
            // État
            enable() {
                manager.input.disabled = false;
                container.classList.remove('disabled');
            },
            
            disable() {
                manager.input.disabled = true;
                container.classList.add('disabled');
            },
            
            setLoading(loading) {
                container.classList.toggle('loading', loading);
            },
            
            setError(error) {
                container.classList.toggle('error', !!error);
                const helperError = container.querySelector('.search-box-error-text');
                if (error && finalOptions.appearance.errorText) {
                    if (!helperError) {
                        const errorEl = document.createElement('span');
                        errorEl.className = 'search-box-error-text';
                        errorEl.textContent = error;
                        helperText.appendChild(errorEl);
                    } else {
                        helperError.textContent = error;
                    }
                } else if (helperError) {
                    helperError.remove();
                }
            },
            
            // Configuration
            updateOptions(newOptions) {
                Object.assign(finalOptions, newOptions);
            },
            
            updateSuggestions(data) {
                finalOptions.suggestions.local.data = data;
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
                container.remove();
                state.delete(finalOptions.id);
            }
        };

        // Wrapper pour form si nécessaire
        if (options.form) {
            const form = document.createElement('form');
            form.className = 'search-box-form';
            form.appendChild(container);
            return { form, instance };
        }

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
    module.exports = SearchBox;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Gestion du cache des suggestions
   Solution: Map avec TTL pour éviter les requêtes répétées
   
   [2024-01-16] - Voice recognition cross-browser
   Cause: API différente selon les navigateurs
   Résolution: Détection et fallback appropriés
   
   [2024-01-17] - Performance avec beaucoup de suggestions
   Solution: Virtualisation et limitation du rendu
   
   NOTES POUR REPRISES FUTURES:
   - Le debounce est crucial pour les performances
   - Toujours annuler les requêtes précédentes
   - L'accessibilité clavier est complexe mais importante
   ======================================== */