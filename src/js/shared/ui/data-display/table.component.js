/**
 * 📊 ULTIMATE TABLE COMPONENT
 * Version: 1.0.0
 * 
 * Le composant table le plus complet jamais créé !
 * Contient TOUTES les fonctionnalités possibles pour l'affichage de données.
 * 
 * @example Simple
 * const table = await UI.Table({
 *     columns: [
 *         { key: 'id', label: 'ID' },
 *         { key: 'name', label: 'Nom' }
 *     ],
 *     data: [...]
 * });
 * 
 * @example Complexe
 * const table = await UI.Table({
 *     columns: [...],
 *     data: [...],
 *     features: {
 *         sort: { multi: true },
 *         search: { debounce: 300 },
 *         filter: { advanced: true },
 *         pagination: { pageSize: 50 },
 *         export: { formats: ['excel', 'pdf'] },
 *         selection: { multi: true },
 *         edit: { inline: true, validation: true }
 *     },
 *     style: 'glassmorphism',
 *     animation: 'rich'
 * });
 */

const TableComponent = (() => {
    'use strict';

    // 🎨 CONFIGURATION COMPLÈTE - TOUTES LES OPTIONS POSSIBLES
    const CONFIG = {
        // Styles de table
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                },
                header: {
                    background: 'rgba(249, 250, 251, 0.05)',
                    borderBottom: '1px solid rgba(229, 231, 235, 0.2)'
                },
                row: {
                    borderBottom: '1px solid rgba(229, 231, 235, 0.1)',
                    hover: 'rgba(59, 130, 246, 0.05)'
                },
                cell: {
                    padding: '16px',
                    color: '#1f2937'
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    boxShadow: '20px 20px 60px #bec3c9, -20px -20px 60px #ffffff'
                },
                header: {
                    background: '#e0e5ec',
                    boxShadow: 'inset 2px 2px 5px #bec3c9, inset -2px -2px 5px #ffffff'
                },
                row: {
                    background: '#e0e5ec',
                    hover: '#d6dae1'
                },
                cell: {
                    padding: '20px',
                    color: '#4a5568'
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)'
                },
                header: {
                    background: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: '500'
                },
                row: {
                    borderBottom: '1px solid #e0e0e0',
                    hover: '#f5f5f5',
                    transition: 'background-color 0.2s'
                },
                cell: {
                    padding: '16px',
                    color: '#212121'
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    border: 'none'
                },
                header: {
                    borderBottom: '2px solid #e5e7eb',
                    fontWeight: '600'
                },
                row: {
                    borderBottom: '1px solid #f3f4f6',
                    hover: '#f9fafb'
                },
                cell: {
                    padding: '12px 16px',
                    color: '#374151'
                }
            },
            'dark': {
                container: {
                    background: 'rgba(31, 41, 55, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '12px'
                },
                header: {
                    background: 'rgba(17, 24, 39, 0.5)',
                    borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
                    color: '#e5e7eb'
                },
                row: {
                    borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
                    hover: 'rgba(55, 65, 81, 0.5)',
                    color: '#d1d5db'
                },
                cell: {
                    padding: '16px',
                    color: '#d1d5db'
                }
            },
            'striped': {
                container: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                },
                header: {
                    background: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                },
                row: {
                    'nth-child(even)': '#f9fafb',
                    hover: '#f3f4f6'
                },
                cell: {
                    padding: '14px',
                    color: '#1f2937'
                }
            },
            'bordered': {
                container: {
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px'
                },
                header: {
                    background: '#f9fafb',
                    borderBottom: '2px solid #e5e7eb'
                },
                row: {
                    borderBottom: '1px solid #e5e7eb'
                },
                cell: {
                    padding: '12px',
                    borderRight: '1px solid #e5e7eb',
                    color: '#374151'
                }
            },
            'compact': {
                container: {
                    background: '#ffffff',
                    fontSize: '14px'
                },
                header: {
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    padding: '8px 12px'
                },
                row: {
                    borderBottom: '1px solid #f3f4f6',
                    hover: '#f9fafb'
                },
                cell: {
                    padding: '8px 12px',
                    color: '#4b5563'
                }
            }
        },

        // Types de colonnes
        columnTypes: {
            'text': {
                align: 'left',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'text'
            },
            'number': {
                align: 'right',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'range',
                format: 'number'
            },
            'currency': {
                align: 'right',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'range',
                format: 'currency',
                prefix: '€',
                decimals: 2
            },
            'percentage': {
                align: 'right',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'range',
                format: 'percentage',
                suffix: '%',
                decimals: 1
            },
            'date': {
                align: 'center',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'dateRange',
                format: 'date',
                dateFormat: 'DD/MM/YYYY'
            },
            'datetime': {
                align: 'center',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'dateRange',
                format: 'datetime',
                dateFormat: 'DD/MM/YYYY HH:mm'
            },
            'boolean': {
                align: 'center',
                sortable: true,
                searchable: false,
                editable: true,
                filter: 'boolean',
                format: 'boolean',
                trueText: '✓',
                falseText: '✗'
            },
            'select': {
                align: 'left',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'select',
                options: []
            },
            'multiselect': {
                align: 'left',
                sortable: false,
                searchable: true,
                editable: true,
                filter: 'multiselect',
                options: []
            },
            'tags': {
                align: 'left',
                sortable: false,
                searchable: true,
                editable: true,
                filter: 'tags',
                separator: ','
            },
            'status': {
                align: 'center',
                sortable: true,
                searchable: true,
                editable: false,
                filter: 'select',
                render: 'badge'
            },
            'progress': {
                align: 'center',
                sortable: true,
                searchable: false,
                editable: true,
                filter: 'range',
                render: 'progress',
                min: 0,
                max: 100
            },
            'rating': {
                align: 'center',
                sortable: true,
                searchable: false,
                editable: true,
                filter: 'range',
                render: 'rating',
                max: 5
            },
            'image': {
                align: 'center',
                sortable: false,
                searchable: false,
                editable: false,
                filter: false,
                render: 'image',
                width: 40,
                height: 40
            },
            'avatar': {
                align: 'center',
                sortable: false,
                searchable: false,
                editable: false,
                filter: false,
                render: 'avatar',
                size: 40
            },
            'link': {
                align: 'left',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'text',
                render: 'link'
            },
            'email': {
                align: 'left',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'text',
                render: 'email'
            },
            'phone': {
                align: 'left',
                sortable: true,
                searchable: true,
                editable: true,
                filter: 'text',
                render: 'phone'
            },
            'color': {
                align: 'center',
                sortable: true,
                searchable: false,
                editable: true,
                filter: false,
                render: 'color'
            },
            'json': {
                align: 'left',
                sortable: false,
                searchable: true,
                editable: true,
                filter: false,
                render: 'json'
            },
            'html': {
                align: 'left',
                sortable: false,
                searchable: true,
                editable: false,
                filter: false,
                render: 'html'
            },
            'actions': {
                align: 'center',
                sortable: false,
                searchable: false,
                editable: false,
                filter: false,
                sticky: 'right',
                width: 'auto'
            }
        },

        // Animations
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                row: {
                    hover: { duration: '0.2s', ease: 'ease' },
                    add: { animation: 'fadeIn 0.3s ease' },
                    remove: { animation: 'fadeOut 0.3s ease' }
                },
                sort: { duration: '0.3s', ease: 'ease' }
            },
            'smooth': {
                row: {
                    hover: { duration: '0.3s', ease: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                    add: { animation: 'slideIn 0.4s ease' },
                    remove: { animation: 'slideOut 0.4s ease' },
                    update: { animation: 'pulse 0.3s ease' }
                },
                sort: { 
                    duration: '0.4s', 
                    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    stagger: 20
                },
                filter: { animation: 'filterTransition 0.3s ease' },
                pagination: { animation: 'pageTransition 0.3s ease' }
            },
            'rich': {
                row: {
                    hover: { 
                        duration: '0.4s', 
                        ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        scale: 1.01,
                        shadow: '0 4px 20px rgba(0,0,0,0.1)'
                    },
                    add: { 
                        animation: 'bounceIn 0.6s ease',
                        stagger: 50
                    },
                    remove: { 
                        animation: 'bounceOut 0.6s ease',
                        stagger: 50
                    },
                    update: { 
                        animation: 'shake 0.4s ease',
                        highlight: true
                    },
                    reorder: {
                        animation: 'flip 0.5s ease'
                    }
                },
                sort: { 
                    duration: '0.5s', 
                    ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    stagger: 30,
                    shuffle: true
                },
                filter: { 
                    animation: 'morphFilter 0.4s ease',
                    particles: true
                },
                pagination: { 
                    animation: 'slidePageTransition 0.4s ease',
                    direction: 'auto'
                },
                loading: {
                    skeleton: true,
                    shimmer: true
                },
                scroll: {
                    parallax: true,
                    fade: true
                }
            },
            'playful': {
                row: {
                    hover: { 
                        duration: '0.3s',
                        rotate: 'random(-2, 2)',
                        scale: 1.02,
                        wiggle: true
                    },
                    add: { 
                        animation: 'rollIn 0.8s ease',
                        sound: true
                    },
                    remove: { 
                        animation: 'rollOut 0.8s ease',
                        particles: true
                    },
                    update: { 
                        animation: 'jello 0.6s ease',
                        confetti: true
                    }
                },
                sort: { 
                    animation: 'shuffle 0.6s ease',
                    sound: true,
                    visual: 'cards'
                },
                cells: {
                    edit: { animation: 'editPop 0.3s ease' },
                    click: { animation: 'cellBounce 0.3s ease' }
                }
            }
        },

        // Fonctionnalités
        features: {
            // Tri
            sort: {
                enabled: true,
                multi: false,
                remote: false,
                resetButton: true,
                indicators: {
                    asc: '↑',
                    desc: '↓',
                    none: '↕'
                },
                defaultDirection: 'asc',
                caseSensitive: false,
                locale: 'fr-FR',
                customComparators: {}
            },

            // Recherche
            search: {
                enabled: true,
                placeholder: 'Rechercher...',
                debounce: 300,
                minLength: 1,
                caseSensitive: false,
                highlight: true,
                fuzzy: false,
                regex: false,
                global: true,
                perColumn: false,
                remote: false,
                customFilters: {}
            },

            // Filtres
            filter: {
                enabled: true,
                advanced: false,
                panel: 'dropdown',
                position: 'top',
                chips: true,
                presets: [],
                customOperators: {
                    text: ['contains', 'equals', 'startsWith', 'endsWith', 'notContains'],
                    number: ['=', '!=', '>', '<', '>=', '<=', 'between'],
                    date: ['=', '!=', '>', '<', '>=', '<=', 'between', 'today', 'yesterday', 'thisWeek', 'thisMonth'],
                    select: ['is', 'isNot', 'isAnyOf', 'isNoneOf']
                }
            },

            // Pagination
            pagination: {
                enabled: true,
                pageSize: 20,
                pageSizeOptions: [10, 20, 50, 100, 500],
                position: 'bottom',
                style: 'numbers', // numbers, simple, load-more, infinite
                showInfo: true,
                showGoTo: true,
                maxButtons: 7,
                remote: false,
                totalCount: null
            },

            // Sélection
            selection: {
                enabled: false,
                multi: true,
                checkbox: true,
                clickToSelect: false,
                selectAll: true,
                persistOnPage: true,
                selectedClass: 'selected',
                actions: [],
                keyboard: true // Ctrl/Shift selection
            },

            // Édition
            edit: {
                enabled: false,
                inline: true,
                popup: false,
                validation: true,
                confirmSave: false,
                cancelOnEsc: true,
                saveOnEnter: true,
                remote: false,
                batch: false,
                history: true,
                maxHistory: 50
            },

            // Export
            export: {
                enabled: false,
                formats: ['excel', 'csv', 'pdf', 'json', 'xml', 'print'],
                filename: 'table-export',
                excel: {
                    includeHeaders: true,
                    includeFilters: true,
                    styling: true,
                    autoWidth: true,
                    freezeHeaders: true
                },
                csv: {
                    separator: ',',
                    quotes: '"',
                    encoding: 'utf-8',
                    bom: true
                },
                pdf: {
                    orientation: 'landscape',
                    pageSize: 'A4',
                    margins: { top: 20, right: 20, bottom: 20, left: 20 },
                    logo: null,
                    watermark: null
                }
            },

            // Colonnes
            columns: {
                resize: true,
                reorder: true,
                hide: true,
                freeze: true,
                menu: true,
                minWidth: 50,
                maxWidth: 500
            },

            // Lignes
            rows: {
                hover: true,
                striped: false,
                border: true,
                height: 'auto', // auto, compact, normal, comfortable
                expand: false,
                drag: false,
                contextMenu: false,
                multiLine: true,
                virtualization: false,
                virtualHeight: 50,
                lazyLoad: false
            },

            // Grouping
            grouping: {
                enabled: false,
                collapsible: true,
                showCount: true,
                aggregations: ['sum', 'avg', 'min', 'max', 'count'],
                customAggregations: {}
            },

            // Sous-tableaux
            subTable: {
                enabled: false,
                lazy: true,
                accordion: true,
                indent: 20
            },

            // État
            state: {
                save: false,
                storage: 'localStorage',
                key: 'table-state',
                restore: ['sort', 'filter', 'pagination', 'columns']
            },

            // Responsive
            responsive: {
                enabled: true,
                breakpoints: {
                    xs: 0,
                    sm: 640,
                    md: 768,
                    lg: 1024,
                    xl: 1280
                },
                priority: true,
                stackAt: 'sm',
                hideColumns: true,
                cardView: false
            }
        },

        // Templates de rendu
        renderers: {
            badge: (value, row, column) => {
                const badge = document.createElement('span');
                badge.className = `table-badge ${column.badgeClass || value}`;
                badge.textContent = column.badgeText?.[value] || value;
                badge.style.background = column.badgeColors?.[value] || 'rgba(107, 114, 128, 0.1)';
                return badge;
            },
            
            progress: (value, row, column) => {
                const container = document.createElement('div');
                container.className = 'table-progress';
                container.innerHTML = `
                    <div class="progress-bar" style="width: ${value}%">
                        <span class="progress-text">${value}%</span>
                    </div>
                `;
                return container;
            },
            
            rating: (value, row, column) => {
                const container = document.createElement('div');
                container.className = 'table-rating';
                const max = column.max || 5;
                for (let i = 1; i <= max; i++) {
                    const star = document.createElement('span');
                    star.className = 'star';
                    star.textContent = i <= value ? '★' : '☆';
                    container.appendChild(star);
                }
                return container;
            },
            
            image: (value, row, column) => {
                if (!value) return '';
                const img = document.createElement('img');
                img.src = value;
                img.className = 'table-image';
                img.width = column.width || 40;
                img.height = column.height || 40;
                img.loading = 'lazy';
                return img;
            },
            
            avatar: (value, row, column) => {
                const avatar = document.createElement('div');
                avatar.className = 'table-avatar';
                if (value?.image) {
                    avatar.innerHTML = `<img src="${value.image}" alt="${value.name || ''}">`;
                } else {
                    const initials = (value?.name || value || '??').split(' ')
                        .map(n => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase();
                    avatar.textContent = initials;
                    avatar.style.background = stringToColor(value?.name || value);
                }
                return avatar;
            },
            
            link: (value, row, column) => {
                const link = document.createElement('a');
                link.href = column.href?.(value, row) || value;
                link.textContent = column.linkText?.(value, row) || value;
                link.target = column.target || '_blank';
                link.className = 'table-link';
                return link;
            },
            
            email: (value) => {
                const link = document.createElement('a');
                link.href = `mailto:${value}`;
                link.textContent = value;
                link.className = 'table-email';
                return link;
            },
            
            phone: (value) => {
                const link = document.createElement('a');
                link.href = `tel:${value}`;
                link.textContent = value;
                link.className = 'table-phone';
                return link;
            },
            
            color: (value) => {
                const container = document.createElement('div');
                container.className = 'table-color';
                container.innerHTML = `
                    <span class="color-swatch" style="background: ${value}"></span>
                    <span class="color-text">${value}</span>
                `;
                return container;
            },
            
            json: (value) => {
                const pre = document.createElement('pre');
                pre.className = 'table-json';
                pre.textContent = JSON.stringify(value, null, 2);
                return pre;
            },
            
            html: (value) => {
                const div = document.createElement('div');
                div.className = 'table-html';
                div.innerHTML = value;
                return div;
            },
            
            currency: (value, row, column) => {
                const formatter = new Intl.NumberFormat(column.locale || 'fr-FR', {
                    style: 'currency',
                    currency: column.currency || 'EUR',
                    minimumFractionDigits: column.decimals ?? 2
                });
                return formatter.format(value);
            },
            
            number: (value, row, column) => {
                const formatter = new Intl.NumberFormat(column.locale || 'fr-FR', {
                    minimumFractionDigits: column.decimals ?? 0,
                    maximumFractionDigits: column.decimals ?? 2
                });
                return formatter.format(value);
            },
            
            percentage: (value, row, column) => {
                return `${parseFloat(value).toFixed(column.decimals ?? 1)}%`;
            },
            
            date: (value, row, column) => {
                if (!value) return '';
                const date = new Date(value);
                return date.toLocaleDateString(column.locale || 'fr-FR', 
                    column.dateOptions || { day: '2-digit', month: '2-digit', year: 'numeric' }
                );
            },
            
            datetime: (value, row, column) => {
                if (!value) return '';
                const date = new Date(value);
                return date.toLocaleString(column.locale || 'fr-FR',
                    column.dateOptions || { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }
                );
            },
            
            boolean: (value, row, column) => {
                const icon = value ? (column.trueText || '✓') : (column.falseText || '✗');
                const className = value ? 'true' : 'false';
                return `<span class="table-boolean ${className}">${icon}</span>`;
            },
            
            actions: (value, row, column, table) => {
                const container = document.createElement('div');
                container.className = 'table-actions';
                
                (column.actions || []).forEach(action => {
                    const btn = document.createElement('button');
                    btn.className = `action-btn ${action.className || ''}`;
                    btn.innerHTML = action.icon || action.text;
                    btn.title = action.tooltip || action.text;
                    
                    if (action.disabled?.(row)) {
                        btn.disabled = true;
                    }
                    
                    if (action.hidden?.(row)) {
                        btn.style.display = 'none';
                    }
                    
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        action.handler(row, table);
                    });
                    
                    container.appendChild(btn);
                });
                
                return container;
            }
        },

        // Icônes
        icons: {
            sort: {
                asc: '↑',
                desc: '↓',
                none: '↕'
            },
            pagination: {
                first: '⟨⟨',
                prev: '⟨',
                next: '⟩',
                last: '⟩⟩'
            },
            actions: {
                view: '👁️',
                edit: '✏️',
                delete: '🗑️',
                download: '⬇️',
                duplicate: '📋',
                archive: '📦',
                restore: '♻️',
                share: '🔗',
                print: '🖨️',
                favorite: '⭐',
                lock: '🔒',
                unlock: '🔓'
            },
            expand: {
                collapsed: '▶',
                expanded: '▼'
            },
            selection: {
                checked: '☑',
                unchecked: '☐',
                indeterminate: '⊟'
            },
            menu: {
                columns: '⚙️',
                filter: '🔽',
                export: '📤',
                settings: '⚙️'
            }
        },

        // Messages
        messages: {
            noData: 'Aucune donnée à afficher',
            loading: 'Chargement...',
            error: 'Erreur lors du chargement des données',
            search: 'Rechercher...',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'éléments',
            first: 'Première',
            last: 'Dernière',
            previous: 'Précédente',
            next: 'Suivante',
            sortAsc: 'Tri croissant',
            sortDesc: 'Tri décroissant',
            columns: 'Colonnes',
            filters: 'Filtres',
            clearFilters: 'Effacer les filtres',
            export: 'Exporter',
            selectAll: 'Tout sélectionner',
            deselectAll: 'Tout désélectionner',
            selectedItems: 'éléments sélectionnés',
            expandRow: 'Développer la ligne',
            collapseRow: 'Réduire la ligne',
            actions: 'Actions',
            edit: 'Modifier',
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            confirmDelete: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
            view: 'Voir',
            refresh: 'Actualiser',
            reset: 'Réinitialiser'
        },

        // CSS à injecter
        styles: `
            /* Container principal */
            .ui-table-container {
                position: relative;
                width: 100%;
                overflow: hidden;
            }
            
            /* Wrapper avec overflow */
            .ui-table-wrapper {
                width: 100%;
                overflow: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Table de base */
            .ui-table {
                width: 100%;
                border-collapse: collapse;
                border-spacing: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* Header */
            .ui-table thead th {
                position: sticky;
                top: 0;
                z-index: 10;
                text-align: left;
                font-weight: 600;
                white-space: nowrap;
                user-select: none;
            }
            
            /* Cellules triables */
            .ui-table th.sortable {
                cursor: pointer;
                position: relative;
                padding-right: 28px;
            }
            
            .ui-table th.sortable:hover {
                background: rgba(0, 0, 0, 0.02);
            }
            
            /* Indicateur de tri */
            .sort-indicator {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0.5;
                transition: all 0.2s ease;
            }
            
            .sort-indicator.active {
                opacity: 1;
                color: #3b82f6;
            }
            
            /* Lignes */
            .ui-table tbody tr {
                transition: all 0.2s ease;
            }
            
            .ui-table tbody tr:hover {
                position: relative;
                z-index: 1;
            }
            
            /* Cellules */
            .ui-table td {
                vertical-align: middle;
            }
            
            /* Sélection */
            .ui-table tr.selected {
                background: rgba(59, 130, 246, 0.1) !important;
            }
            
            .selection-checkbox {
                width: 20px;
                height: 20px;
                cursor: pointer;
            }
            
            /* Loading state */
            .ui-table.loading tbody {
                opacity: 0.5;
                pointer-events: none;
            }
            
            .table-loader {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 100;
            }
            
            /* Empty state */
            .table-empty {
                padding: 60px 20px;
                text-align: center;
                color: #6b7280;
            }
            
            .table-empty-icon {
                font-size: 48px;
                opacity: 0.3;
                margin-bottom: 16px;
            }
            
            /* Toolbar */
            .table-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                gap: 16px;
                flex-wrap: wrap;
            }
            
            .toolbar-left,
            .toolbar-right {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            /* Search box */
            .table-search {
                position: relative;
                min-width: 200px;
            }
            
            .table-search input {
                width: 100%;
                padding: 8px 12px 8px 36px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
                outline: none;
                transition: all 0.2s ease;
            }
            
            .table-search input:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .table-search-icon {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                opacity: 0.5;
            }
            
            /* Filter chips */
            .filter-chips {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .filter-chip {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 12px;
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 16px;
                font-size: 14px;
                color: #3b82f6;
            }
            
            .filter-chip-remove {
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .filter-chip-remove:hover {
                opacity: 1;
            }
            
            /* Pagination */
            .table-pagination {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px;
                border-top: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            .pagination-info {
                color: #6b7280;
                font-size: 14px;
            }
            
            .pagination-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .pagination-button {
                padding: 6px 12px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                background: rgba(255, 255, 255, 0.8);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
                font-size: 14px;
            }
            
            .pagination-button:hover:not(:disabled) {
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.2);
            }
            
            .pagination-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .pagination-button.active {
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
                font-weight: 600;
            }
            
            /* Page size selector */
            .page-size-selector {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .page-size-selector select {
                padding: 6px 12px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
                outline: none;
            }
            
            /* Column resize handle */
            .column-resize-handle {
                position: absolute;
                right: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                cursor: col-resize;
                user-select: none;
            }
            
            .column-resize-handle:hover,
            .column-resize-handle.resizing {
                background: #3b82f6;
            }
            
            /* Expand/collapse */
            .expand-toggle {
                cursor: pointer;
                padding: 4px;
                transition: transform 0.2s ease;
            }
            
            .expand-toggle.expanded {
                transform: rotate(90deg);
            }
            
            /* Sub-table */
            .sub-table-row td {
                padding: 0 !important;
            }
            
            .sub-table-content {
                padding: 16px 16px 16px 48px;
                background: rgba(0, 0, 0, 0.02);
            }
            
            /* Actions menu */
            .table-actions {
                display: flex;
                gap: 8px;
            }
            
            .action-btn {
                padding: 4px 8px;
                border: none;
                background: transparent;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s ease;
                font-size: 16px;
            }
            
            .action-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            
            /* Export menu */
            .export-menu {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 4px;
                background: white;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 100;
                min-width: 150px;
            }
            
            .export-menu-item {
                padding: 10px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }
            
            .export-menu-item:last-child {
                border-bottom: none;
            }
            
            .export-menu-item:hover {
                background: rgba(59, 130, 246, 0.05);
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .ui-table-container {
                    margin: -16px;
                }
                
                .table-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .toolbar-left,
                .toolbar-right {
                    width: 100%;
                    justify-content: space-between;
                }
                
                .table-search {
                    width: 100%;
                }
                
                .table-pagination {
                    flex-direction: column;
                    gap: 12px;
                }
            }
            
            /* Card view pour mobile */
            @media (max-width: 640px) {
                .ui-table.card-view thead {
                    display: none;
                }
                
                .ui-table.card-view tbody tr {
                    display: block;
                    margin-bottom: 16px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    padding: 16px;
                }
                
                .ui-table.card-view tbody td {
                    display: block;
                    text-align: right;
                    padding: 8px 0;
                    border: none;
                    position: relative;
                    padding-left: 50%;
                }
                
                .ui-table.card-view tbody td:before {
                    content: attr(data-label);
                    position: absolute;
                    left: 0;
                    width: 45%;
                    text-align: left;
                    font-weight: 600;
                    color: #6b7280;
                }
            }
            
            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideOut {
                from { 
                    opacity: 1;
                    transform: translateY(0);
                }
                to { 
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
            
            @keyframes bounceIn {
                0% {
                    opacity: 0;
                    transform: scale(0.3);
                }
                50% {
                    transform: scale(1.05);
                }
                70% {
                    transform: scale(0.9);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes bounceOut {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.3);
                }
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                20%, 40%, 60%, 80% { transform: translateX(2px); }
            }
            
            @keyframes jello {
                0%, 100% { transform: skewX(0deg); }
                30% { transform: skewX(-12.5deg); }
                40% { transform: skewX(6.25deg); }
                50% { transform: skewX(-3.125deg); }
                65% { transform: skewX(1.5625deg); }
                75% { transform: skewX(-0.78125deg); }
            }
            
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            /* Loading skeleton */
            .skeleton-loader {
                background: linear-gradient(
                    90deg,
                    rgba(0, 0, 0, 0.05) 25%,
                    rgba(0, 0, 0, 0.1) 50%,
                    rgba(0, 0, 0, 0.05) 75%
                );
                background-size: 1000px 100%;
                animation: shimmer 2s infinite;
            }
            
            /* Badges */
            .table-badge {
                display: inline-flex;
                align-items: center;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                backdrop-filter: blur(10px);
            }
            
            /* Progress bars */
            .table-progress {
                width: 100%;
                height: 20px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                transition: width 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .progress-text {
                color: white;
                font-size: 11px;
                font-weight: 600;
            }
            
            /* Rating */
            .table-rating {
                display: flex;
                gap: 2px;
            }
            
            .table-rating .star {
                color: #fbbf24;
                font-size: 16px;
                transition: all 0.2s ease;
            }
            
            .table-rating.editable .star {
                cursor: pointer;
            }
            
            .table-rating.editable .star:hover {
                transform: scale(1.2);
            }
            
            /* Images & Avatars */
            .table-image {
                border-radius: 8px;
                object-fit: cover;
            }
            
            .table-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                color: white;
                font-size: 14px;
                overflow: hidden;
            }
            
            .table-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            /* Links */
            .table-link,
            .table-email,
            .table-phone {
                color: #3b82f6;
                text-decoration: none;
                transition: all 0.2s ease;
            }
            
            .table-link:hover,
            .table-email:hover,
            .table-phone:hover {
                text-decoration: underline;
                color: #2563eb;
            }
            
            /* Color display */
            .table-color {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .color-swatch {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                border: 1px solid rgba(0, 0, 0, 0.1);
            }
            
            /* JSON display */
            .table-json {
                max-width: 300px;
                max-height: 100px;
                overflow: auto;
                background: rgba(0, 0, 0, 0.05);
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                font-family: monospace;
            }
            
            /* Edit mode */
            .cell-editor {
                position: absolute;
                z-index: 100;
                padding: 0;
                margin: 0;
                border: 2px solid #3b82f6;
                border-radius: 4px;
                background: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .cell-editor input,
            .cell-editor select,
            .cell-editor textarea {
                width: 100%;
                border: none;
                outline: none;
                padding: 8px;
                font-size: inherit;
                font-family: inherit;
            }
            
            /* Context menu */
            .table-context-menu {
                position: fixed;
                background: white;
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                min-width: 160px;
                padding: 4px 0;
            }
            
            .context-menu-item {
                padding: 8px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.2s ease;
            }
            
            .context-menu-item:hover {
                background: rgba(59, 130, 246, 0.05);
            }
            
            .context-menu-separator {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 4px 0;
            }
        `
    };

    // 🔧 MÉTHODES PRIVÉES
    let stylesInjected = false;
    let tableInstances = new Map();
    let instanceCounter = 0;

    /**
 * Convertir une chaîne en couleur
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
}

    /**
     * Classe Table
     */
    class UITable {
        constructor(options) {
            this.id = `ui-table-${++instanceCounter}`;
            this.options = this.mergeOptions(options);
            this.data = [];
            this.filteredData = [];
            this.displayData = [];
            this.sortConfig = { key: null, direction: null, multi: [] };
            this.filterConfig = {};
            this.searchTerm = '';
            this.currentPage = 1;
            this.selectedRows = new Set();
            this.columnWidths = new Map();
            this.history = [];
            this.historyIndex = -1;
            
            this.init();
        }

        /**
         * Fusionner les options avec les valeurs par défaut
         */
        mergeOptions(options) {
            const defaults = {
                columns: [],
                data: [],
                style: 'glassmorphism',
                animation: 'smooth',
                features: {},
                height: null,
                width: null,
                className: '',
                id: '',
                remote: false,
                api: null,
                onRowClick: null,
                onCellClick: null,
                onSelectionChange: null,
                onDataChange: null,
                onSort: null,
                onFilter: null,
                onPageChange: null,
                messages: CONFIG.messages
            };

            // Fusionner les features en profondeur
            const features = {};
            Object.keys(CONFIG.features).forEach(key => {
                features[key] = {
                    ...CONFIG.features[key],
                    ...(options.features?.[key] || {})
                };
            });

            return {
                ...defaults,
                ...options,
                features
            };
        }

        /**
         * Initialiser la table
         */
        async init() {
            // Injecter les styles si nécessaire
            if (!stylesInjected) {
                this.injectStyles();
            }

            // Créer la structure DOM
            this.createDOM();

            // Charger les données
            if (this.options.data.length > 0) {
                await this.setData(this.options.data);
            } else if (this.options.remote && this.options.api) {
                await this.loadRemoteData();
            }

            // Initialiser les fonctionnalités
            this.initFeatures();

            // Appliquer les animations
            this.applyAnimations();

            // Sauvegarder l'instance
            tableInstances.set(this.id, this);
        }

        /**
         * Créer la structure DOM
         */
        createDOM() {
            // Container principal
            this.container = document.createElement('div');
            this.container.className = `ui-table-container ${this.options.style} ${this.options.className}`;
            this.container.id = this.options.id || this.id;

            // Appliquer les styles du thème
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            this.applyStyles(this.container, styleConfig.container);

            // Toolbar
            if (this.shouldShowToolbar()) {
                this.toolbar = this.createToolbar();
                this.container.appendChild(this.toolbar);
            }

            // Wrapper pour la table
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'ui-table-wrapper';
            if (this.options.height) {
                this.wrapper.style.maxHeight = this.options.height;
                this.wrapper.style.overflowY = 'auto';
            }

            // Table
            this.table = document.createElement('table');
            this.table.className = 'ui-table';
            
            // Header
            this.thead = document.createElement('thead');
            this.createHeader();
            this.table.appendChild(this.thead);

            // Body
            this.tbody = document.createElement('tbody');
            this.table.appendChild(this.tbody);

            // Footer (pour les agrégations)
            if (this.options.features.grouping?.enabled) {
                this.tfoot = document.createElement('tfoot');
                this.table.appendChild(this.tfoot);
            }

            this.wrapper.appendChild(this.table);
            this.container.appendChild(this.wrapper);

            // Pagination
            if (this.options.features.pagination?.enabled) {
                this.pagination = this.createPagination();
                this.container.appendChild(this.pagination);
            }

            // Loader
            this.loader = document.createElement('div');
            this.loader.className = 'table-loader';
            this.loader.innerHTML = '<div class="spinner"></div>';
            this.loader.style.display = 'none';
            this.container.appendChild(this.loader);

            // Context menu
            if (this.options.features.rows?.contextMenu) {
                this.contextMenu = this.createContextMenu();
                document.body.appendChild(this.contextMenu);
            }
        }

        /**
         * Créer le header
         */
        createHeader() {
            const tr = document.createElement('tr');

            // Checkbox pour sélection
            if (this.options.features.selection?.enabled && this.options.features.selection?.checkbox) {
                const th = document.createElement('th');
                th.style.width = '40px';
                
                if (this.options.features.selection?.selectAll) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'selection-checkbox select-all';
                    checkbox.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
                    th.appendChild(checkbox);
                }
                
                tr.appendChild(th);
            }

            // Colonnes expand
            if (this.options.features.rows?.expand || this.options.features.subTable?.enabled) {
                const th = document.createElement('th');
                th.style.width = '40px';
                tr.appendChild(th);
            }

            // Colonnes de données
            this.options.columns.forEach((column, index) => {
                const th = document.createElement('th');
                th.dataset.key = column.key;
                
                // Contenu de l'en-tête
                const content = document.createElement('div');
                content.style.display = 'flex';
                content.style.alignItems = 'center';
                content.style.gap = '8px';
                
                // Texte
                const text = document.createElement('span');
                text.textContent = column.label || column.key;
                content.appendChild(text);

                // Indicateur de tri
                if (column.sortable !== false && this.options.features.sort?.enabled) {
                    th.classList.add('sortable');
                    
                    const sortIcon = document.createElement('span');
                    sortIcon.className = 'sort-indicator';
                    sortIcon.textContent = CONFIG.icons.sort.none;
                    content.appendChild(sortIcon);
                    
                    th.addEventListener('click', () => this.sort(column.key));
                }

                th.appendChild(content);

                // Redimensionnement des colonnes
                if (this.options.features.columns?.resize) {
                    const resizeHandle = document.createElement('div');
                    resizeHandle.className = 'column-resize-handle';
                    resizeHandle.addEventListener('mousedown', (e) => this.startResize(e, column, th));
                    th.appendChild(resizeHandle);
                }

                // Appliquer les styles
                const typeConfig = CONFIG.columnTypes[column.type] || CONFIG.columnTypes.text;
                if (typeConfig.align) th.style.textAlign = typeConfig.align;
                if (column.width) th.style.width = column.width;
                if (column.minWidth) th.style.minWidth = column.minWidth;
                if (column.maxWidth) th.style.maxWidth = column.maxWidth;

                tr.appendChild(th);
            });

            // Colonnes sticky pour actions
            const stickyColumns = this.options.columns.filter(col => col.sticky);
            if (stickyColumns.length > 0) {
                // Implémenter le sticky positioning
            }

            // Appliquer les styles du header
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            this.applyStyles(tr, styleConfig.header);

            this.thead.appendChild(tr);
        }

        /**
         * Créer la toolbar
         */
        createToolbar() {
            const toolbar = document.createElement('div');
            toolbar.className = 'table-toolbar';

            const left = document.createElement('div');
            left.className = 'toolbar-left';

            const right = document.createElement('div');
            right.className = 'toolbar-right';

            // Recherche
            if (this.options.features.search?.enabled) {
                const search = this.createSearchBox();
                left.appendChild(search);
            }

            // Filtres
            if (this.options.features.filter?.enabled) {
                const filterBtn = document.createElement('button');
                filterBtn.className = 'toolbar-button filter-button';
                filterBtn.innerHTML = `${CONFIG.icons.menu.filter} Filtres`;
                filterBtn.addEventListener('click', () => this.toggleFilterPanel());
                left.appendChild(filterBtn);

                // Chips de filtres
                if (this.options.features.filter?.chips) {
                    this.filterChips = document.createElement('div');
                    this.filterChips.className = 'filter-chips';
                    left.appendChild(this.filterChips);
                }
            }

            // Actions de sélection
            if (this.options.features.selection?.enabled) {
                this.selectionInfo = document.createElement('div');
                this.selectionInfo.className = 'selection-info';
                this.selectionInfo.style.display = 'none';
                left.appendChild(this.selectionInfo);
            }

            // Colonnes
            if (this.options.features.columns?.menu) {
                const columnsBtn = document.createElement('button');
                columnsBtn.className = 'toolbar-button columns-button';
                columnsBtn.innerHTML = `${CONFIG.icons.menu.columns} Colonnes`;
                columnsBtn.addEventListener('click', () => this.toggleColumnsMenu());
                right.appendChild(columnsBtn);
            }

            // Export
            if (this.options.features.export?.enabled) {
                const exportBtn = document.createElement('button');
                exportBtn.className = 'toolbar-button export-button';
                exportBtn.innerHTML = `${CONFIG.icons.menu.export} Exporter`;
                exportBtn.addEventListener('click', () => this.toggleExportMenu());
                right.appendChild(exportBtn);

                // Menu d'export
                this.exportMenu = this.createExportMenu();
                exportBtn.appendChild(this.exportMenu);
            }

            // Refresh
            if (this.options.remote) {
                const refreshBtn = document.createElement('button');
                refreshBtn.className = 'toolbar-button refresh-button';
                refreshBtn.innerHTML = '🔄';
                refreshBtn.title = 'Actualiser';
                refreshBtn.addEventListener('click', () => this.refresh());
                right.appendChild(refreshBtn);
            }

            toolbar.appendChild(left);
            toolbar.appendChild(right);

            return toolbar;
        }

        /**
         * Créer la boîte de recherche
         */
        createSearchBox() {
            const container = document.createElement('div');
            container.className = 'table-search';

            const icon = document.createElement('span');
            icon.className = 'table-search-icon';
            icon.textContent = '🔍';
            container.appendChild(icon);

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = this.options.features.search?.placeholder || CONFIG.messages.search;
            
            // Debounce de la recherche
            let debounceTimer;
            input.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.search(e.target.value);
                }, this.options.features.search?.debounce || 300);
            });

            container.appendChild(input);
            return container;
        }

        /**
         * Créer le menu d'export
         */
        createExportMenu() {
            const menu = document.createElement('div');
            menu.className = 'export-menu';
            menu.style.display = 'none';

            const formats = this.options.features.export?.formats || ['excel', 'csv', 'pdf'];
            
            formats.forEach(format => {
                const item = document.createElement('div');
                item.className = 'export-menu-item';
                item.textContent = format.toUpperCase();
                item.addEventListener('click', () => {
                    this.export(format);
                    menu.style.display = 'none';
                });
                menu.appendChild(item);
            });

            return menu;
        }

        /**
         * Créer la pagination
         */
        createPagination() {
            const container = document.createElement('div');
            container.className = 'table-pagination';

            // Info
            const info = document.createElement('div');
            info.className = 'pagination-info';
            container.appendChild(info);

            // Contrôles
            const controls = document.createElement('div');
            controls.className = 'pagination-controls';

            // Page size selector
            if (this.options.features.pagination?.pageSizeOptions) {
                const pageSize = document.createElement('div');
                pageSize.className = 'page-size-selector';
                
                const label = document.createElement('span');
                label.textContent = CONFIG.messages.itemsPerPage;
                pageSize.appendChild(label);

                const select = document.createElement('select');
                this.options.features.pagination.pageSizeOptions.forEach(size => {
                    const option = document.createElement('option');
                    option.value = size;
                    option.textContent = size;
                    if (size === this.options.features.pagination.pageSize) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
                
                select.addEventListener('change', (e) => {
                    this.options.features.pagination.pageSize = parseInt(e.target.value);
                    this.currentPage = 1;
                    this.render();
                });
                
                pageSize.appendChild(select);
                controls.appendChild(pageSize);
            }

            // Boutons de navigation
            const style = this.options.features.pagination?.style || 'numbers';
            
            if (style === 'numbers' || style === 'simple') {
                // First
                const first = document.createElement('button');
                first.className = 'pagination-button';
                first.textContent = CONFIG.icons.pagination.first;
                first.title = CONFIG.messages.first;
                first.addEventListener('click', () => this.goToPage(1));
                controls.appendChild(first);

                // Previous
                const prev = document.createElement('button');
                prev.className = 'pagination-button';
                prev.textContent = CONFIG.icons.pagination.prev;
                prev.title = CONFIG.messages.previous;
                prev.addEventListener('click', () => this.goToPage(this.currentPage - 1));
                controls.appendChild(prev);

                // Page numbers
                if (style === 'numbers') {
                    this.pageNumbersContainer = document.createElement('div');
                    this.pageNumbersContainer.className = 'page-numbers';
                    this.pageNumbersContainer.style.display = 'inline-flex';
                    this.pageNumbersContainer.style.gap = '4px';
                    controls.appendChild(this.pageNumbersContainer);
                }

                // Next
                const next = document.createElement('button');
                next.className = 'pagination-button';
                next.textContent = CONFIG.icons.pagination.next;
                next.title = CONFIG.messages.next;
                next.addEventListener('click', () => this.goToPage(this.currentPage + 1));
                controls.appendChild(next);

                // Last
                const last = document.createElement('button');
                last.className = 'pagination-button';
                last.textContent = CONFIG.icons.pagination.last;
                last.title = CONFIG.messages.last;
                last.addEventListener('click', () => this.goToPage(this.getTotalPages()));
                controls.appendChild(last);
            } else if (style === 'load-more') {
                const loadMore = document.createElement('button');
                loadMore.className = 'pagination-button load-more';
                loadMore.textContent = 'Charger plus';
                loadMore.addEventListener('click', () => this.loadMore());
                controls.appendChild(loadMore);
            }

            // Go to page
            if (this.options.features.pagination?.showGoTo) {
                const goTo = document.createElement('div');
                goTo.className = 'go-to-page';
                goTo.style.display = 'inline-flex';
                goTo.style.alignItems = 'center';
                goTo.style.gap = '8px';
                goTo.style.marginLeft = '16px';
                
                const label = document.createElement('span');
                label.textContent = 'Page';
                goTo.appendChild(label);

                const input = document.createElement('input');
                input.type = 'number';
                input.min = 1;
                input.max = this.getTotalPages();
                input.value = this.currentPage;
                input.style.width = '60px';
                input.addEventListener('change', (e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= this.getTotalPages()) {
                        this.goToPage(page);
                    }
                });
                goTo.appendChild(input);

                controls.appendChild(goTo);
            }

            container.appendChild(controls);
            return container;
        }

        /**
         * Créer le menu contextuel
         */
        createContextMenu() {
            const menu = document.createElement('div');
            menu.className = 'table-context-menu';
            menu.style.display = 'none';

            const items = [
                { text: 'Voir', icon: CONFIG.icons.actions.view, action: 'view' },
                { text: 'Modifier', icon: CONFIG.icons.actions.edit, action: 'edit' },
                { text: 'Dupliquer', icon: CONFIG.icons.actions.duplicate, action: 'duplicate' },
                { separator: true },
                { text: 'Supprimer', icon: CONFIG.icons.actions.delete, action: 'delete', danger: true }
            ];

            items.forEach(item => {
                if (item.separator) {
                    const separator = document.createElement('div');
                    separator.className = 'context-menu-separator';
                    menu.appendChild(separator);
                } else {
                    const menuItem = document.createElement('div');
                    menuItem.className = 'context-menu-item';
                    if (item.danger) menuItem.classList.add('danger');
                    
                    menuItem.innerHTML = `
                        <span class="menu-icon">${item.icon}</span>
                        <span class="menu-text">${item.text}</span>
                    `;
                    
                    menuItem.addEventListener('click', () => {
                        this.handleContextAction(item.action);
                        menu.style.display = 'none';
                    });
                    
                    menu.appendChild(menuItem);
                }
            });

            // Fermer au clic externe
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    menu.style.display = 'none';
                }
            });

            return menu;
        }

        /**
         * Afficher la toolbar
         */
        shouldShowToolbar() {
            return this.options.features.search?.enabled ||
                   this.options.features.filter?.enabled ||
                   this.options.features.export?.enabled ||
                   this.options.features.columns?.menu ||
                   this.options.remote;
        }

        /**
         * Appliquer les styles
         */
        applyStyles(element, styles) {
            if (!styles) return;
            
            Object.entries(styles).forEach(([prop, value]) => {
                if (prop === 'backdropFilter') {
                    element.style.backdropFilter = value;
                    element.style.webkitBackdropFilter = value;
                } else if (prop === 'nth-child(even)') {
                    // Géré dans le CSS
                } else {
                    element.style[prop] = value;
                }
            });
        }

        /**
         * Charger les données
         */
        async setData(data) {
            this.data = Array.isArray(data) ? data : [];
            this.filteredData = [...this.data];
            this.applyFilters();
            this.render();
        }

        /**
         * Charger les données distantes
         */
        async loadRemoteData() {
            try {
                this.showLoader(true);
                
                const params = {
                    page: this.currentPage,
                    pageSize: this.options.features.pagination?.pageSize,
                    sort: this.sortConfig,
                    filters: this.filterConfig,
                    search: this.searchTerm
                };
                
                const response = await this.options.api.fetch(params);
                
                this.data = response.data || [];
                this.options.features.pagination.totalCount = response.total || this.data.length;
                
                this.filteredData = [...this.data];
                this.render();
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
                this.showError();
            } finally {
                this.showLoader(false);
            }
        }

        /**
         * Rendre la table
         */
        render() {
            // Effacer le body
            this.tbody.innerHTML = '';

            // Calculer les données à afficher
            this.calculateDisplayData();

            // Vérifier si aucune donnée
            if (this.displayData.length === 0) {
                this.showEmptyState();
                this.updatePagination();
                return;
            }

            // Rendre les lignes
            const fragment = document.createDocumentFragment();
            
            this.displayData.forEach((row, index) => {
                const tr = this.createRow(row, index);
                fragment.appendChild(tr);

                // Sous-table ou ligne expandable
                if (this.options.features.rows?.expand || this.options.features.subTable?.enabled) {
                    const expandRow = this.createExpandRow(row, index);
                    if (expandRow) fragment.appendChild(expandRow);
                }
            });

            this.tbody.appendChild(fragment);

            // Mettre à jour la pagination
            this.updatePagination();

            // Mettre à jour les infos de sélection
            this.updateSelectionInfo();

            // Appliquer les animations
            if (this.options.animation !== 'none') {
                this.animateRows();
            }

            // Callback
            if (this.options.onDataChange) {
                this.options.onDataChange(this.displayData);
            }
        }

        /**
         * Créer une ligne
         */
        createRow(rowData, index) {
            const tr = document.createElement('tr');
            tr.dataset.index = index;
            tr.dataset.id = rowData.id || index;

            // Classes
            if (this.selectedRows.has(rowData.id || index)) {
                tr.classList.add('selected');
            }

            // Styles du thème
            const styleConfig = CONFIG.styles[this.options.style] || CONFIG.styles.glassmorphism;
            if (styleConfig.row) {
                this.applyStyles(tr, styleConfig.row);
                if (styleConfig.row.hover) {
                    tr.addEventListener('mouseenter', () => {
                        tr.style.background = styleConfig.row.hover;
                    });
                    tr.addEventListener('mouseleave', () => {
                        tr.style.background = '';
                    });
                }
            }

            // Checkbox de sélection
            if (this.options.features.selection?.enabled && this.options.features.selection?.checkbox) {
                const td = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'selection-checkbox';
                checkbox.checked = this.selectedRows.has(rowData.id || index);
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    this.toggleRowSelection(rowData.id || index, e.target.checked);
                });
                td.appendChild(checkbox);
                tr.appendChild(td);
            }

            // Expand toggle
            if (this.options.features.rows?.expand || this.options.features.subTable?.enabled) {
                const td = document.createElement('td');
                const toggle = document.createElement('span');
                toggle.className = 'expand-toggle';
                toggle.textContent = CONFIG.icons.expand.collapsed;
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleExpand(index);
                });
                td.appendChild(toggle);
                tr.appendChild(td);
            }

            // Cellules de données
            this.options.columns.forEach(column => {
                const td = document.createElement('td');
                td.dataset.key = column.key;
                
                // Valeur
                const value = this.getCellValue(rowData, column.key);
                
                // Rendu personnalisé
                if (column.render) {
                    if (typeof column.render === 'function') {
                        const rendered = column.render(value, rowData, column, this);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else {
                            td.appendChild(rendered);
                        }
                    } else if (CONFIG.renderers[column.render]) {
                        const rendered = CONFIG.renderers[column.render](value, rowData, column, this);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else {
                            td.appendChild(rendered);
                        }
                    }
                } else {
                    // Rendu par défaut selon le type
                    const typeConfig = CONFIG.columnTypes[column.type] || CONFIG.columnTypes.text;
                    if (typeConfig.format && CONFIG.renderers[typeConfig.format]) {
                        const rendered = CONFIG.renderers[typeConfig.format](value, rowData, column, this);
                        if (typeof rendered === 'string') {
                            td.innerHTML = rendered;
                        } else {
                            td.appendChild(rendered);
                        }
                    } else {
                        td.textContent = value ?? '';
                    }
                }

                // Alignement
                const typeConfig = CONFIG.columnTypes[column.type] || CONFIG.columnTypes.text;
                if (typeConfig.align) td.style.textAlign = typeConfig.align;

                // Édition inline
                if (this.options.features.edit?.enabled && 
                    this.options.features.edit?.inline && 
                    column.editable !== false) {
                    td.addEventListener('dblclick', () => this.editCell(td, rowData, column));
                }

                // Styles de cellule
                if (styleConfig.cell) {
                    this.applyStyles(td, styleConfig.cell);
                }

                // Attribut pour responsive
                td.setAttribute('data-label', column.label || column.key);

                tr.appendChild(td);
            });

            // Événements de ligne
            if (this.options.onRowClick) {
                tr.addEventListener('click', (e) => {
                    if (!e.target.closest('.selection-checkbox, .expand-toggle, .action-btn')) {
                        this.options.onRowClick(rowData, index, e);
                    }
                });
            }

            // Sélection au clic
            if (this.options.features.selection?.enabled && 
                this.options.features.selection?.clickToSelect) {
                tr.addEventListener('click', (e) => {
                    if (!e.target.closest('.selection-checkbox, .expand-toggle, .action-btn')) {
                        this.toggleRowSelection(rowData.id || index);
                    }
                });
            }

            // Menu contextuel
            if (this.options.features.rows?.contextMenu) {
                tr.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.showContextMenu(e, rowData, index);
                });
            }

            // Drag & drop
            if (this.options.features.rows?.drag) {
                tr.draggable = true;
                tr.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
                tr.addEventListener('dragover', (e) => this.handleDragOver(e));
                tr.addEventListener('drop', (e) => this.handleDrop(e, index));
                tr.addEventListener('dragend', (e) => this.handleDragEnd(e));
            }

            return tr;
        }

        /**
         * Créer une ligne expandable
         */
        createExpandRow(rowData, index) {
            if (!this.expandedRows?.has(index)) return null;

            const tr = document.createElement('tr');
            tr.className = 'sub-table-row';
            
            const td = document.createElement('td');
            td.colSpan = this.options.columns.length + 
                        (this.options.features.selection?.checkbox ? 1 : 0) +
                        (this.options.features.rows?.expand ? 1 : 0);
            
            const content = document.createElement('div');
            content.className = 'sub-table-content';
            
            // Contenu personnalisé ou sous-table
            if (this.options.features.subTable?.enabled && this.options.features.subTable?.render) {
                const subContent = this.options.features.subTable.render(rowData, index);
                if (typeof subContent === 'string') {
                    content.innerHTML = subContent;
                } else {
                    content.appendChild(subContent);
                }
            } else if (this.options.features.rows?.expandRender) {
                const expandContent = this.options.features.rows.expandRender(rowData, index);
                if (typeof expandContent === 'string') {
                    content.innerHTML = expandContent;
                } else {
                    content.appendChild(expandContent);
                }
            } else {
                // Affichage par défaut : toutes les données en détail
                content.innerHTML = `<pre>${JSON.stringify(rowData, null, 2)}</pre>`;
            }
            
            td.appendChild(content);
            tr.appendChild(td);
            
            return tr;
        }

        /**
         * Obtenir la valeur d'une cellule
         */
        getCellValue(row, key) {
            // Support des clés imbriquées (ex: "user.name")
            return key.split('.').reduce((obj, k) => obj?.[k], row);
        }

        /**
         * Calculer les données à afficher
         */
        calculateDisplayData() {
            let data = this.filteredData;

            // Pagination
            if (this.options.features.pagination?.enabled && !this.options.remote) {
                const pageSize = this.options.features.pagination.pageSize;
                const start = (this.currentPage - 1) * pageSize;
                const end = start + pageSize;
                data = data.slice(start, end);
            }

            this.displayData = data;
        }

        /**
         * Trier les données
         */
        sort(key) {
            const column = this.options.columns.find(col => col.key === key);
            if (!column || column.sortable === false) return;

            // Déterminer la direction
            let direction = 'asc';
            if (this.sortConfig.key === key) {
                if (this.sortConfig.direction === 'asc') {
                    direction = 'desc';
                } else if (this.sortConfig.direction === 'desc') {
                    direction = null; // Retirer le tri
                }
            }

            // Multi-tri
            if (this.options.features.sort?.multi && event?.shiftKey) {
                // Gérer le multi-tri
                const existing = this.sortConfig.multi.findIndex(s => s.key === key);
                if (existing >= 0) {
                    if (direction === null) {
                        this.sortConfig.multi.splice(existing, 1);
                    } else {
                        this.sortConfig.multi[existing].direction = direction;
                    }
                } else if (direction !== null) {
                    this.sortConfig.multi.push({ key, direction });
                }
            } else {
                this.sortConfig = { key, direction, multi: [] };
            }

            // Appliquer le tri
            if (this.options.remote) {
                this.loadRemoteData();
            } else {
                this.applySorting();
                this.render();
            }

            // Mettre à jour les indicateurs
            this.updateSortIndicators();

            // Callback
            if (this.options.onSort) {
                this.options.onSort(this.sortConfig);
            }
        }

        /**
         * Appliquer le tri
         */
        applySorting() {
            if (!this.sortConfig.key && this.sortConfig.multi.length === 0) {
                this.filteredData = [...this.data];
                return;
            }

            const compareFn = (a, b) => {
                // Tri simple
                if (this.sortConfig.key && this.sortConfig.direction) {
                    const result = this.compareValues(
                        this.getCellValue(a, this.sortConfig.key),
                        this.getCellValue(b, this.sortConfig.key),
                        this.sortConfig.direction
                    );
                    if (result !== 0) return result;
                }

                // Multi-tri
                for (const sort of this.sortConfig.multi) {
                    const result = this.compareValues(
                        this.getCellValue(a, sort.key),
                        this.getCellValue(b, sort.key),
                        sort.direction
                    );
                    if (result !== 0) return result;
                }

                return 0;
            };

            this.filteredData.sort(compareFn);
        }

        /**
         * Comparer deux valeurs
         */
        compareValues(a, b, direction) {
            // Gérer les valeurs nulles
            if (a === null || a === undefined) return direction === 'asc' ? -1 : 1;
            if (b === null || b === undefined) return direction === 'asc' ? 1 : -1;

            // Comparaison
            let result = 0;
            if (typeof a === 'string' && typeof b === 'string') {
                result = a.localeCompare(b, this.options.features.sort?.locale || 'fr-FR', {
                    numeric: true,
                    sensitivity: this.options.features.sort?.caseSensitive ? 'case' : 'base'
                });
            } else if (a instanceof Date && b instanceof Date) {
                result = a.getTime() - b.getTime();
            } else {
                result = a < b ? -1 : (a > b ? 1 : 0);
            }

            return direction === 'asc' ? result : -result;
        }

        /**
         * Mettre à jour les indicateurs de tri
         */
        updateSortIndicators() {
            this.thead.querySelectorAll('.sort-indicator').forEach(indicator => {
                const th = indicator.closest('th');
                const key = th.dataset.key;
                
                indicator.classList.remove('active');
                
                if (this.sortConfig.key === key && this.sortConfig.direction) {
                    indicator.classList.add('active');
                    indicator.textContent = CONFIG.icons.sort[this.sortConfig.direction];
                } else {
                    const multiSort = this.sortConfig.multi.find(s => s.key === key);
                    if (multiSort) {
                        indicator.classList.add('active');
                        indicator.textContent = CONFIG.icons.sort[multiSort.direction];
                    } else {
                        indicator.textContent = CONFIG.icons.sort.none;
                    }
                }
            });
        }

        /**
         * Rechercher dans les données
         */
        search(term) {
            this.searchTerm = term.toLowerCase();
            
            if (this.options.remote) {
                this.currentPage = 1;
                this.loadRemoteData();
            } else {
                this.applyFilters();
                this.currentPage = 1;
                this.render();
            }

            // Surligner les résultats
            if (this.options.features.search?.highlight && term) {
                this.highlightSearchResults();
            }
        }

        /**
         * Appliquer tous les filtres
         */
        applyFilters() {
            this.filteredData = this.data.filter(row => {
                // Filtre de recherche
                if (this.searchTerm && !this.matchesSearch(row)) {
                    return false;
                }

                // Filtres personnalisés
                for (const [key, filter] of Object.entries(this.filterConfig)) {
                    if (!this.matchesFilter(row, key, filter)) {
                        return false;
                    }
                }

                return true;
            });

            // Réappliquer le tri
            if (this.sortConfig.key || this.sortConfig.multi.length > 0) {
                this.applySorting();
            }
        }

        /**
         * Vérifier si une ligne correspond à la recherche
         */
        matchesSearch(row) {
            const searchableColumns = this.options.columns.filter(col => {
                const typeConfig = CONFIG.columnTypes[col.type] || CONFIG.columnTypes.text;
                return col.searchable !== false && typeConfig.searchable !== false;
            });

            return searchableColumns.some(col => {
                const value = this.getCellValue(row, col.key);
                if (value === null || value === undefined) return false;
                
                const stringValue = String(value).toLowerCase();
                
                if (this.options.features.search?.fuzzy) {
                    return this.fuzzyMatch(this.searchTerm, stringValue);
                } else if (this.options.features.search?.regex) {
                    try {
                        const regex = new RegExp(this.searchTerm, 'i');
                        return regex.test(stringValue);
                    } catch (e) {
                        return stringValue.includes(this.searchTerm);
                    }
                } else {
                    return stringValue.includes(this.searchTerm);
                }
            });
        }

        /**
         * Recherche floue
         */
        fuzzyMatch(pattern, str) {
            pattern = pattern.toLowerCase();
            str = str.toLowerCase();
            
            let patternIdx = 0;
            let strIdx = 0;
            let matchedChars = 0;
            
            while (patternIdx < pattern.length && strIdx < str.length) {
                if (pattern[patternIdx] === str[strIdx]) {
                    matchedChars++;
                    patternIdx++;
                }
                strIdx++;
            }
            
            return matchedChars === pattern.length;
        }

        /**
         * Vérifier si une ligne correspond à un filtre
         */
        matchesFilter(row, key, filter) {
            const value = this.getCellValue(row, key);
            const { operator, value: filterValue } = filter;

            switch (operator) {
                case 'equals':
                case '=':
                    return value === filterValue;
                    
                case 'notEquals':
                case '!=':
                    return value !== filterValue;
                    
                case 'contains':
                    return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
                    
                case 'notContains':
                    return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
                    
                case 'startsWith':
                    return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
                    
                case 'endsWith':
                    return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
                    
                case '>':
                    return value > filterValue;
                    
                case '<':
                    return value < filterValue;
                    
                case '>=':
                    return value >= filterValue;
                    
                case '<=':
                    return value <= filterValue;
                    
                case 'between':
                    return value >= filterValue.min && value <= filterValue.max;
                    
                case 'is':
                    return value === filterValue;
                    
                case 'isNot':
                    return value !== filterValue;
                    
                case 'isAnyOf':
                    return Array.isArray(filterValue) && filterValue.includes(value);
                    
                case 'isNoneOf':
                    return Array.isArray(filterValue) && !filterValue.includes(value);
                    
                case 'isEmpty':
                    return !value || value === '';
                    
                case 'isNotEmpty':
                    return value && value !== '';
                    
                default:
                    return true;
            }
        }

        /**
         * Aller à une page
         */
        goToPage(page) {
            const totalPages = this.getTotalPages();
            if (page < 1 || page > totalPages) return;
            
            this.currentPage = page;
            
            if (this.options.remote) {
                this.loadRemoteData();
            } else {
                this.render();
            }
            
            if (this.options.onPageChange) {
                this.options.onPageChange(page);
            }
        }

        /**
         * Obtenir le nombre total de pages
         */
        getTotalPages() {
            const total = this.options.remote 
                ? (this.options.features.pagination?.totalCount || 0)
                : this.filteredData.length;
                
            const pageSize = this.options.features.pagination?.pageSize || 20;
            return Math.ceil(total / pageSize);
        }

        /**
         * Mettre à jour la pagination
         */
        updatePagination() {
            if (!this.pagination) return;
            
            const total = this.options.remote 
                ? (this.options.features.pagination?.totalCount || 0)
                : this.filteredData.length;
                
            const pageSize = this.options.features.pagination?.pageSize || 20;
            const totalPages = this.getTotalPages();
            const start = (this.currentPage - 1) * pageSize + 1;
            const end = Math.min(this.currentPage * pageSize, total);
            
            // Info
            const info = this.pagination.querySelector('.pagination-info');
            if (info) {
                info.textContent = total > 0
                    ? `${start}-${end} ${CONFIG.messages.of} ${total} ${CONFIG.messages.items}`
                    : CONFIG.messages.noData;
            }
            
            // Boutons
            const buttons = this.pagination.querySelectorAll('.pagination-button');
            buttons.forEach(btn => {
                const text = btn.textContent;
                if (text === CONFIG.icons.pagination.first || text === CONFIG.icons.pagination.prev) {
                    btn.disabled = this.currentPage === 1;
                } else if (text === CONFIG.icons.pagination.next || text === CONFIG.icons.pagination.last) {
                    btn.disabled = this.currentPage === totalPages;
                }
            });
            
            // Numéros de page
            if (this.pageNumbersContainer) {
                this.pageNumbersContainer.innerHTML = '';
                
                const maxButtons = this.options.features.pagination?.maxButtons || 7;
                const halfButtons = Math.floor(maxButtons / 2);
                
                let startPage = Math.max(1, this.currentPage - halfButtons);
                let endPage = Math.min(totalPages, startPage + maxButtons - 1);
                
                if (endPage - startPage < maxButtons - 1) {
                    startPage = Math.max(1, endPage - maxButtons + 1);
                }
                
                // Points de suspension début
                if (startPage > 1) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.padding = '0 8px';
                    this.pageNumbersContainer.appendChild(dots);
                }
                
                // Numéros
                for (let i = startPage; i <= endPage; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'pagination-button';
                    btn.textContent = i;
                    
                    if (i === this.currentPage) {
                        btn.classList.add('active');
                    }
                    
                    btn.addEventListener('click', () => this.goToPage(i));
                    this.pageNumbersContainer.appendChild(btn);
                }
                
                // Points de suspension fin
                if (endPage < totalPages) {
                    const dots = document.createElement('span');
                    dots.textContent = '...';
                    dots.style.padding = '0 8px';
                    this.pageNumbersContainer.appendChild(dots);
                }
            }
            
            // Go to input
            const goToInput = this.pagination.querySelector('input[type="number"]');
            if (goToInput) {
                goToInput.max = totalPages;
                goToInput.value = this.currentPage;
            }
        }

        /**
         * Sélectionner/désélectionner une ligne
         */
        toggleRowSelection(id, selected) {
            if (selected === undefined) {
                selected = !this.selectedRows.has(id);
            }
            
            if (selected) {
                if (!this.options.features.selection?.multi) {
                    this.selectedRows.clear();
                }
                this.selectedRows.add(id);
            } else {
                this.selectedRows.delete(id);
            }
            
            // Mettre à jour l'affichage
            const tr = this.tbody.querySelector(`tr[data-id="${id}"]`);
            if (tr) {
                tr.classList.toggle('selected', selected);
                const checkbox = tr.querySelector('.selection-checkbox');
                if (checkbox) checkbox.checked = selected;
            }
            
            this.updateSelectionInfo();
            
            if (this.options.onSelectionChange) {
                this.options.onSelectionChange(Array.from(this.selectedRows));
            }
        }

        /**
         * Sélectionner/désélectionner tout
         */
        toggleSelectAll(selected) {
            if (selected) {
                this.displayData.forEach(row => {
                    this.selectedRows.add(row.id || this.displayData.indexOf(row));
                });
            } else {
                this.selectedRows.clear();
            }
            
            // Mettre à jour les checkboxes
            this.tbody.querySelectorAll('.selection-checkbox').forEach(checkbox => {
                checkbox.checked = selected;
            });
            
            // Mettre à jour les lignes
            this.tbody.querySelectorAll('tr').forEach(tr => {
                tr.classList.toggle('selected', selected);
            });
            
            this.updateSelectionInfo();
            
            if (this.options.onSelectionChange) {
                this.options.onSelectionChange(Array.from(this.selectedRows));
            }
        }

        /**
         * Mettre à jour les infos de sélection
         */
        updateSelectionInfo() {
            if (!this.selectionInfo) return;
            
            const count = this.selectedRows.size;
            if (count > 0) {
                this.selectionInfo.style.display = 'flex';
                this.selectionInfo.innerHTML = `
                    <span>${count} ${CONFIG.messages.selectedItems}</span>
                    ${this.options.features.selection?.actions?.map(action => 
                        `<button class="selection-action" data-action="${action.key}">${action.label}</button>`
                    ).join('') || ''}
                `;
                
                // Attacher les événements aux actions
                this.selectionInfo.querySelectorAll('.selection-action').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = this.options.features.selection.actions.find(
                            a => a.key === btn.dataset.action
                        );
                        if (action?.handler) {
                            action.handler(Array.from(this.selectedRows));
                        }
                    });
                });
            } else {
                this.selectionInfo.style.display = 'none';
            }
            
            // Mettre à jour le checkbox "select all"
            const selectAll = this.thead.querySelector('.select-all');
            if (selectAll) {
                const totalRows = this.displayData.length;
                if (count === 0) {
                    selectAll.checked = false;
                    selectAll.indeterminate = false;
                } else if (count === totalRows) {
                    selectAll.checked = true;
                    selectAll.indeterminate = false;
                } else {
                    selectAll.checked = false;
                    selectAll.indeterminate = true;
                }
            }
        }

        /**
         * Éditer une cellule
         */
        editCell(td, rowData, column) {
            if (td.querySelector('.cell-editor')) return;
            
            const value = this.getCellValue(rowData, column.key);
            const originalValue = value;
            
            // Créer l'éditeur
            const editor = document.createElement('div');
            editor.className = 'cell-editor';
            
            let input;
            const typeConfig = CONFIG.columnTypes[column.type] || CONFIG.columnTypes.text;
            
            switch (column.type) {
                case 'select':
                    input = document.createElement('select');
                    (column.options || typeConfig.options || []).forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.value || opt;
                        option.textContent = opt.label || opt;
                        option.selected = (opt.value || opt) === value;
                        input.appendChild(option);
                    });
                    break;
                    
                case 'boolean':
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = value;
                    break;
                    
                case 'date':
                    input = document.createElement('input');
                    input.type = 'date';
                    input.value = value ? new Date(value).toISOString().split('T')[0] : '';
                    break;
                    
                case 'number':
                case 'currency':
                case 'percentage':
                    input = document.createElement('input');
                    input.type = 'number';
                    input.value = value;
                    if (column.min !== undefined) input.min = column.min;
                    if (column.max !== undefined) input.max = column.max;
                    if (column.step !== undefined) input.step = column.step;
                    break;
                    
                default:
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = value || '';
            }
            
            editor.appendChild(input);
            
            // Positionner l'éditeur
            const rect = td.getBoundingClientRect();
            editor.style.position = 'fixed';
            editor.style.left = rect.left + 'px';
            editor.style.top = rect.top + 'px';
            editor.style.width = rect.width + 'px';
            editor.style.height = rect.height + 'px';
            
            document.body.appendChild(editor);
            input.focus();
            input.select();
            
            // Gérer la sauvegarde
            const save = async () => {
                const newValue = column.type === 'boolean' ? input.checked : input.value;
                
                // Validation
                if (this.options.features.edit?.validation && column.validation) {
                    const isValid = await this.validateValue(newValue, column.validation);
                    if (!isValid) {
                        input.classList.add('error');
                        return;
                    }
                }
                
                // Mettre à jour les données
                this.setCellValue(rowData, column.key, newValue);
                
                // Sauvegarder à distance si nécessaire
                if (this.options.features.edit?.remote && this.options.api?.update) {
                    try {
                        await this.options.api.update(rowData.id, { [column.key]: newValue });
                    } catch (error) {
                        console.error('Erreur lors de la sauvegarde:', error);
                        this.setCellValue(rowData, column.key, originalValue);
                        this.showError('Erreur lors de la sauvegarde');
                        return;
                    }
                }
                
                // Ajouter à l'historique
                if (this.options.features.edit?.history) {
                    this.addToHistory({
                        type: 'edit',
                        rowId: rowData.id,
                        column: column.key,
                        oldValue: originalValue,
                        newValue: newValue
                    });
                }
                
                // Rerender la cellule
                this.renderCell(td, rowData, column);
                editor.remove();
                
                // Callback
                if (this.options.onDataChange) {
                    this.options.onDataChange(this.data);
                }
            };
            
            const cancel = () => {
                editor.remove();
            };
            
            // Événements
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.options.features.edit?.saveOnEnter) {
                    save();
                } else if (e.key === 'Escape' && this.options.features.edit?.cancelOnEsc) {
                    cancel();
                }
            });
            
            input.addEventListener('blur', () => {
                if (this.options.features.edit?.confirmSave) {
                    if (confirm('Sauvegarder les modifications ?')) {
                        save();
                    } else {
                        cancel();
                    }
                } else {
                    save();
                }
            });
        }

        /**
         * Définir la valeur d'une cellule
         */
        setCellValue(row, key, value) {
            const keys = key.split('.');
            let obj = row;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!obj[keys[i]]) obj[keys[i]] = {};
                obj = obj[keys[i]];
            }
            
            obj[keys[keys.length - 1]] = value;
        }

        /**
         * Rerender une cellule
         */
        renderCell(td, rowData, column) {
            td.innerHTML = '';
            
            const value = this.getCellValue(rowData, column.key);
            
            // Même logique que createRow pour le rendu
            if (column.render) {
                if (typeof column.render === 'function') {
                    const rendered = column.render(value, rowData, column, this);
                    if (typeof rendered === 'string') {
                        td.innerHTML = rendered;
                    } else {
                        td.appendChild(rendered);
                    }
                } else if (CONFIG.renderers[column.render]) {
                    const rendered = CONFIG.renderers[column.render](value, rowData, column, this);
                    if (typeof rendered === 'string') {
                        td.innerHTML = rendered;
                    } else {
                        td.appendChild(rendered);
                    }
                }
            } else {
                const typeConfig = CONFIG.columnTypes[column.type] || CONFIG.columnTypes.text;
                if (typeConfig.format && CONFIG.renderers[typeConfig.format]) {
                    const rendered = CONFIG.renderers[typeConfig.format](value, rowData, column, this);
                    if (typeof rendered === 'string') {
                        td.innerHTML = rendered;
                    } else {
                        td.appendChild(rendered);
                    }
                } else {
                    td.textContent = value ?? '';
                }
            }
        }

        /**
         * Exporter les données
         */
        async export(format) {
            const data = this.selectedRows.size > 0 
                ? this.data.filter(row => this.selectedRows.has(row.id))
                : this.filteredData;
                
            switch (format) {
                case 'excel':
                    await this.exportExcel(data);
                    break;
                case 'csv':
                    this.exportCSV(data);
                    break;
                case 'pdf':
                    await this.exportPDF(data);
                    break;
                case 'json':
                    this.exportJSON(data);
                    break;
                case 'xml':
                    this.exportXML(data);
                    break;
                case 'print':
                    this.print();
                    break;
            }
        }

        /**
         * Exporter en Excel
         */
        async exportExcel(data) {
            // Nécessite une bibliothèque comme SheetJS
            console.log('Export Excel non implémenté - nécessite SheetJS');
        }

        /**
         * Exporter en CSV
         */
        exportCSV(data) {
            const config = this.options.features.export?.csv || {};
            const separator = config.separator || ',';
            const quotes = config.quotes || '"';
            
            // En-têtes
            const headers = this.options.columns
                .filter(col => col.exportable !== false)
                .map(col => quotes + (col.label || col.key) + quotes);
                
            // Lignes
            const rows = data.map(row => {
                return this.options.columns
                    .filter(col => col.exportable !== false)
                    .map(col => {
                        let value = this.getCellValue(row, col.key);
                        if (value === null || value === undefined) value = '';
                        
                        // Formater selon le type
                        const typeConfig = CONFIG.columnTypes[col.type];
                        if (typeConfig?.format && CONFIG.renderers[typeConfig.format]) {
                            const rendered = CONFIG.renderers[typeConfig.format](value, row, col, this);
                            if (typeof rendered === 'string') {
                                value = rendered;
                            }
                        }
                        
                        // Échapper les quotes
                        value = String(value).replace(new RegExp(quotes, 'g'), quotes + quotes);
                        
                        return quotes + value + quotes;
                    })
                    .join(separator);
            });
            
            // Créer le contenu
            let content = headers.join(separator) + '\n' + rows.join('\n');
            
            // Ajouter BOM pour Excel
            if (config.bom) {
                content = '\ufeff' + content;
            }
            
            // Télécharger
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.options.features.export?.filename || 'export'}.csv`;
            link.click();
        }

        /**
         * Exporter en PDF
         */
        async exportPDF(data) {
            // Nécessite une bibliothèque comme jsPDF
            console.log('Export PDF non implémenté - nécessite jsPDF');
        }

        /**
         * Exporter en JSON
         */
        exportJSON(data) {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.options.features.export?.filename || 'export'}.json`;
            link.click();
        }

        /**
         * Exporter en XML
         */
        exportXML(data) {
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
            
            data.forEach(row => {
                xml += '  <row>\n';
                this.options.columns.forEach(col => {
                    const value = this.getCellValue(row, col.key);
                    xml += `    <${col.key}>${this.escapeXML(value)}</${col.key}>\n`;
                });
                xml += '  </row>\n';
            });
            
            xml += '</data>';
            
            const blob = new Blob([xml], { type: 'application/xml' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.options.features.export?.filename || 'export'}.xml`;
            link.click();
        }

        /**
         * Échapper XML
         */
        escapeXML(str) {
            if (str === null || str === undefined) return '';
            
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }

        /**
         * Imprimer
         */
        print() {
            window.print();
        }

        /**
         * Afficher l'état vide
         */
        showEmptyState() {
            this.tbody.innerHTML = '';
            
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.options.columns.length + 
                        (this.options.features.selection?.checkbox ? 1 : 0) +
                        (this.options.features.rows?.expand ? 1 : 0);
            
            td.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">📊</div>
                    <div class="table-empty-text">${this.options.messages.noData}</div>
                </div>
            `;
            
            tr.appendChild(td);
            this.tbody.appendChild(tr);
        }

        /**
         * Afficher/cacher le loader
         */
        showLoader(show) {
            if (this.loader) {
                this.loader.style.display = show ? 'flex' : 'none';
            }
            
            if (show) {
                this.table.classList.add('loading');
            } else {
                this.table.classList.remove('loading');
            }
        }

        /**
         * Initialiser les fonctionnalités
         */
        initFeatures() {
            // State management
            if (this.options.features.state?.save) {
                this.loadState();
                
                // Sauvegarder l'état lors des changements
                ['sort', 'filter', 'page', 'columns'].forEach(event => {
                    this.on(event, () => this.saveState());
                });
            }
            
            // Responsive
            if (this.options.features.responsive?.enabled) {
                this.handleResponsive();
                window.addEventListener('resize', () => this.handleResponsive());
            }
            
            // Virtualisation
            if (this.options.features.rows?.virtualization) {
                this.initVirtualization();
            }
            
            // Keyboard navigation
            if (this.options.features.selection?.keyboard) {
                this.initKeyboardNavigation();
            }
        }

        /**
         * Gérer le responsive
         */
        handleResponsive() {
            const width = window.innerWidth;
            const breakpoints = this.options.features.responsive?.breakpoints || CONFIG.features.responsive.breakpoints;
            
            // Déterminer le breakpoint actuel
            let currentBreakpoint = 'xl';
            for (const [bp, minWidth] of Object.entries(breakpoints).reverse()) {
                if (width >= minWidth) {
                    currentBreakpoint = bp;
                    break;
                }
            }
            
            // Card view pour mobile
            if (currentBreakpoint === 'xs' && this.options.features.responsive?.cardView !== false) {
                this.table.classList.add('card-view');
            } else {
                this.table.classList.remove('card-view');
            }
            
            // Masquer des colonnes selon la priorité
            if (this.options.features.responsive?.hideColumns) {
                this.options.columns.forEach((col, index) => {
                    const priority = col.priority || 0;
                    const hideAt = col.hideAt || 'xs';
                    
                    const shouldHide = this.shouldHideColumn(currentBreakpoint, hideAt);
                    
                    // Masquer/afficher la colonne
                    const cells = this.container.querySelectorAll(
                        `th:nth-child(${index + 1}), td:nth-child(${index + 1})`
                    );
                    cells.forEach(cell => {
                        cell.style.display = shouldHide ? 'none' : '';
                    });
                });
            }
        }

        /**
         * Déterminer si une colonne doit être cachée
         */
        shouldHideColumn(currentBreakpoint, hideAt) {
            const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
            const currentIndex = breakpoints.indexOf(currentBreakpoint);
            const hideIndex = breakpoints.indexOf(hideAt);
            return currentIndex <= hideIndex;
        }

        /**
         * Animer les lignes
         */
        animateRows() {
            const animConfig = CONFIG.animations[this.options.animation];
            if (!animConfig || !animConfig.row) return;
            
            const rows = this.tbody.querySelectorAll('tr');
            
            rows.forEach((row, index) => {
                if (animConfig.row.add) {
                    row.style.animation = animConfig.row.add.animation;
                    
                    if (animConfig.row.add.stagger) {
                        row.style.animationDelay = `${index * animConfig.row.add.stagger}ms`;
                    }
                }
            });
        }

        /**
         * Injecter les styles CSS
         */
        injectStyles() {
            if (stylesInjected) return;
            
            const style = document.createElement('style');
            style.id = 'ui-table-styles';
            style.textContent = CONFIG.styles;
            document.head.appendChild(style);
            
            stylesInjected = true;
        }

        /**
         * Nettoyer les ressources
         */
        destroy() {
            // Retirer les event listeners
            if (this.contextMenu) {
                this.contextMenu.remove();
            }
            
            // Retirer l'instance
            tableInstances.delete(this.id);
            
            // Retirer le DOM
            if (this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }

        /**
         * Obtenir l'élément DOM
         */
        getElement() {
            return this.container;
        }

        /**
         * Rafraîchir les données
         */
        async refresh() {
            if (this.options.remote) {
                await this.loadRemoteData();
            } else {
                this.render();
            }
        }

        /**
         * Ajouter une ligne
         */
        addRow(rowData, position = 'end') {
            if (position === 'start') {
                this.data.unshift(rowData);
            } else {
                this.data.push(rowData);
            }
            
            this.applyFilters();
            this.render();
            
            // Animation
            if (this.options.animation !== 'none') {
                const newRow = position === 'start' 
                    ? this.tbody.querySelector('tr:first-child')
                    : this.tbody.querySelector('tr:last-child');
                    
                if (newRow && CONFIG.animations[this.options.animation]?.row?.add) {
                    newRow.style.animation = CONFIG.animations[this.options.animation].row.add.animation;
                }
            }
        }

        /**
         * Supprimer une ligne
         */
        removeRow(id) {
            const index = this.data.findIndex(row => row.id === id);
            if (index === -1) return;
            
            // Animation de suppression
            if (this.options.animation !== 'none') {
                const row = this.tbody.querySelector(`tr[data-id="${id}"]`);
                if (row && CONFIG.animations[this.options.animation]?.row?.remove) {
                    row.style.animation = CONFIG.animations[this.options.animation].row.remove.animation;
                    row.addEventListener('animationend', () => {
                        this.data.splice(index, 1);
                        this.applyFilters();
                        this.render();
                    });
                    return;
                }
            }
            
            this.data.splice(index, 1);
            this.applyFilters();
            this.render();
        }

        /**
         * Mettre à jour une ligne
         */
        updateRow(id, updates) {
            const row = this.data.find(row => row.id === id);
            if (!row) return;
            
            Object.assign(row, updates);
            this.applyFilters();
            this.render();
            
            // Animation de mise à jour
            if (this.options.animation !== 'none') {
                const tr = this.tbody.querySelector(`tr[data-id="${id}"]`);
                if (tr && CONFIG.animations[this.options.animation]?.row?.update) {
                    tr.style.animation = CONFIG.animations[this.options.animation].row.update.animation;
                }
            }
        }

        /**
         * Obtenir les données filtrées
         */
        getFilteredData() {
            return this.filteredData;
        }

        /**
         * Obtenir les données sélectionnées
         */
        getSelectedData() {
            return this.data.filter(row => this.selectedRows.has(row.id));
        }

        /**
         * Réinitialiser les filtres
         */
        resetFilters() {
            this.filterConfig = {};
            this.searchTerm = '';
            this.applyFilters();
            this.render();
        }

        /**
         * Réinitialiser le tri
         */
        resetSort() {
            this.sortConfig = { key: null, direction: null, multi: [] };
            this.applyFilters();
            this.render();
            this.updateSortIndicators();
        }
    }

    // ========================================
    // FONCTION DE CRÉATION
    // ========================================
    
    /**
     * Créer une instance de table
     */
    function create(options) {
        return new UITable(options);
    }

    // ========================================
    // EXPORT DU MODULE
    // ========================================
    
    return {
        create,
        instances: tableInstances,
        config: CONFIG,
        version: '1.0.0'
    };
})();

// Export pour utilisation
export default TableComponent;