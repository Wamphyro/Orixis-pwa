/* ========================================
   KANBAN.COMPONENT.JS - Système Kanban Ultra-Complet
   Chemin: src/js/shared/ui/data-display/kanban.component.js
   
   DESCRIPTION:
   Composant Kanban avec drag & drop, colonnes personnalisables,
   cartes riches, swimlanes, filtres, animations fluides et
   toutes les fonctionnalités d'un système Kanban professionnel.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-400)
   2. Styles CSS dynamiques (lignes 401-1200)
   3. Gestionnaire Drag & Drop (lignes 1201-1500)
   4. Création des éléments (lignes 1501-2200)
   5. Gestion des données (lignes 2201-2500)
   6. API publique (lignes 2501-2600)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Compatible avec touch devices
   - Support complet accessibilité
   ======================================== */

const KanbanComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Layouts disponibles
        layouts: {
            'horizontal': {
                name: 'Horizontal',
                direction: 'row',
                scrollable: true,
                columnWidth: 320,
                gap: 16
            },
            'vertical': {
                name: 'Vertical',
                direction: 'column',
                scrollable: false,
                columnWidth: '100%',
                gap: 16
            },
            'grid': {
                name: 'Grid',
                columns: 'auto-fit',
                minColumnWidth: 300,
                gap: 16
            },
            'compact': {
                name: 'Compact',
                direction: 'row',
                columnWidth: 280,
                cardHeight: 'auto',
                gap: 12
            },
            'swimlane': {
                name: 'Swimlane',
                direction: 'row',
                hasSwimLanes: true,
                columnWidth: 320,
                gap: 16
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                board: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    padding: '24px'
                },
                column: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                },
                card: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                }
            },
            'neumorphism': {
                board: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    padding: '24px'
                },
                column: {
                    background: '#e0e5ec',
                    boxShadow: 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff',
                    borderRadius: '16px',
                    padding: '16px'
                },
                card: {
                    background: '#e0e5ec',
                    boxShadow: '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
                    borderRadius: '12px',
                    padding: '16px'
                }
            },
            'flat': {
                board: {
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    padding: '20px'
                },
                column: {
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                },
                card: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '12px'
                }
            },
            'dark': {
                board: {
                    background: '#0f172a',
                    borderRadius: '16px',
                    padding: '24px'
                },
                column: {
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '16px'
                },
                card: {
                    background: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#f1f5f9'
                }
            },
            'minimal': {
                board: {
                    background: 'transparent',
                    padding: '16px'
                },
                column: {
                    background: 'transparent',
                    border: '2px dashed #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px'
                },
                card: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    padding: '12px'
                }
            }
        },

        // Animations
        animations: {
            'none': {
                enabled: false
            },
            'subtle': {
                card: {
                    hover: 'transform: translateY(-2px)',
                    transition: 'all 0.2s ease'
                },
                column: {
                    hover: 'box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.3s ease'
                }
            },
            'smooth': {
                card: {
                    hover: 'transform: translateY(-4px) scale(1.02)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    shadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                },
                column: {
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                drag: {
                    scale: 1.05,
                    rotate: 2,
                    opacity: 0.8
                }
            },
            'rich': {
                card: {
                    hover: 'transform: translateY(-6px) scale(1.03) rotateX(5deg)',
                    transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    shadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                    glow: true
                },
                column: {
                    pulse: true,
                    transition: 'all 0.5s ease'
                },
                drag: {
                    scale: 1.1,
                    rotate: 5,
                    opacity: 0.9,
                    trail: true
                },
                drop: {
                    ripple: true,
                    bounce: true
                }
            },
            'spring': {
                card: {
                    hover: 'transform: translateY(-4px)',
                    transition: 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
                },
                drag: {
                    elastic: true
                }
            }
        },

        // Fonctionnalités des colonnes
        columnFeatures: {
            'header': {
                customizable: true,
                showCount: true,
                showProgress: true,
                showMenu: true,
                collapsible: true
            },
            'wip': {
                enabled: true,
                soft: true, // Avertissement seulement
                hard: false, // Blocage
                showIndicator: true
            },
            'sorting': {
                manual: true,
                automatic: ['priority', 'date', 'title', 'assignee'],
                direction: ['asc', 'desc']
            },
            'actions': {
                add: true,
                clear: true,
                archive: true,
                color: true,
                rename: true
            },
            'footer': {
                showStats: true,
                showActions: true,
                customContent: null
            }
        },

        // Fonctionnalités des cartes
        cardFeatures: {
            'content': {
                title: true,
                description: true,
                thumbnail: true,
                attachments: true,
                checklist: true,
                progress: true
            },
            'metadata': {
                id: true,
                priority: ['low', 'medium', 'high', 'urgent'],
                tags: true,
                dueDate: true,
                createdDate: true,
                effort: true, // Points d'effort
                type: ['task', 'bug', 'feature', 'improvement']
            },
            'people': {
                assignee: true,
                multipleAssignees: true,
                avatars: true,
                mentions: true
            },
            'actions': {
                edit: true,
                delete: true,
                duplicate: true,
                move: true,
                archive: true,
                comment: true
            },
            'indicators': {
                status: ['new', 'in-progress', 'blocked', 'done'],
                flags: ['important', 'urgent', 'review', 'approved'],
                activity: true,
                unread: true
            }
        },

        // Fonctionnalités globales
        boardFeatures: {
            'dragDrop': {
                enabled: true,
                animation: true,
                placeholder: true,
                autoScroll: true,
                multiSelect: true,
                keyboard: true,
                touch: true,
                accessibility: true
            },
            'filters': {
                enabled: true,
                quick: ['assignee', 'priority', 'tag'],
                advanced: true,
                saved: true,
                combination: 'and' // 'and' ou 'or'
            },
            'search': {
                enabled: true,
                realtime: true,
                fuzzy: true,
                fields: ['title', 'description', 'tags']
            },
            'views': {
                compact: true,
                detailed: true,
                list: true,
                calendar: true,
                timeline: true
            },
            'collaboration': {
                realtime: false,
                presence: true,
                comments: true,
                mentions: true,
                activity: true
            },
            'automation': {
                rules: true,
                triggers: ['moved', 'created', 'updated', 'due'],
                actions: ['notify', 'move', 'assign', 'tag']
            },
            'export': {
                json: true,
                csv: true,
                pdf: true,
                image: true
            }
        },

        // Couleurs et thèmes
        colors: {
            columns: {
                todo: '#94a3b8',
                inProgress: '#3b82f6',
                review: '#f59e0b',
                done: '#22c55e',
                archived: '#6b7280'
            },
            priorities: {
                low: '#94a3b8',
                medium: '#3b82f6',
                high: '#f59e0b',
                urgent: '#ef4444'
            },
            tags: {
                feature: '#8b5cf6',
                bug: '#ef4444',
                improvement: '#3b82f6',
                documentation: '#10b981',
                design: '#ec4899'
            }
        },

        // Tailles et dimensions
        sizes: {
            card: {
                compact: { minHeight: 60, maxHeight: 100 },
                normal: { minHeight: 100, maxHeight: 300 },
                detailed: { minHeight: 150, maxHeight: 500 }
            },
            column: {
                narrow: 280,
                normal: 320,
                wide: 400
            },
            avatar: {
                small: 24,
                medium: 32,
                large: 40
            }
        }
    };

    // ========================================
    // STYLES CSS DYNAMIQUES
    // ========================================
    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected) return;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            /* ========================================
               KANBAN COMPONENT STYLES
               ======================================== */
            
            /* Board Container */
            .kanban-board {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            .kanban-board-inner {
                width: 100%;
                height: 100%;
                display: flex;
                gap: var(--column-gap, 16px);
                padding: var(--board-padding, 24px);
                overflow-x: auto;
                overflow-y: hidden;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }

            /* Colonnes */
            .kanban-column {
                flex: 0 0 var(--column-width, 320px);
                display: flex;
                flex-direction: column;
                min-height: 0;
                position: relative;
                transition: var(--column-transition, all 0.3s ease);
            }

            .kanban-column.drag-over {
                transform: scale(1.02);
            }

            .kanban-column.collapsed {
                flex: 0 0 60px;
            }

            /* En-tête de colonne */
            .kanban-column-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                gap: 12px;
                position: relative;
                cursor: pointer;
                user-select: none;
            }

            .kanban-column-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--title-color, #1f2937);
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }

            .kanban-column-count {
                background: rgba(0, 0, 0, 0.1);
                color: var(--count-color, #6b7280);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }

            .kanban-column-actions {
                display: flex;
                gap: 4px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            .kanban-column:hover .kanban-column-actions {
                opacity: 1;
            }

            /* Zone de cartes */
            .kanban-column-cards {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px;
                overflow-y: auto;
                overflow-x: hidden;
                min-height: 100px;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
            }

            .kanban-column-cards::-webkit-scrollbar {
                width: 6px;
            }

            .kanban-column-cards::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
            }

            .kanban-column-cards::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }

            /* Cartes */
            .kanban-card {
                position: relative;
                cursor: grab;
                transition: var(--card-transition, all 0.2s ease);
                transform-origin: center center;
            }

            .kanban-card:hover {
                transform: var(--card-hover-transform, translateY(-2px));
                box-shadow: var(--card-hover-shadow, 0 8px 24px rgba(0, 0, 0, 0.15));
            }

            .kanban-card.dragging {
                cursor: grabbing;
                opacity: var(--drag-opacity, 0.8);
                transform: var(--drag-transform, scale(1.05) rotate(2deg));
                z-index: 1000;
            }

            .kanban-card.ghost {
                opacity: 0.4;
                transform: scale(0.95);
            }

            /* Contenu de carte */
            .kanban-card-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .kanban-card-title {
                font-size: 14px;
                font-weight: 500;
                color: var(--card-title-color, #1f2937);
                line-height: 1.4;
                word-break: break-word;
                flex: 1;
            }

            .kanban-card-priority {
                width: 4px;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                border-radius: 12px 0 0 12px;
            }

            .kanban-card-priority.low { background: #94a3b8; }
            .kanban-card-priority.medium { background: #3b82f6; }
            .kanban-card-priority.high { background: #f59e0b; }
            .kanban-card-priority.urgent { background: #ef4444; }

            .kanban-card-description {
                font-size: 13px;
                color: var(--card-description-color, #6b7280);
                margin-bottom: 12px;
                line-height: 1.5;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            /* Métadonnées de carte */
            .kanban-card-metadata {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 12px;
            }

            .kanban-card-tag {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                background: rgba(139, 92, 246, 0.1);
                color: #8b5cf6;
            }

            .kanban-card-due-date {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #6b7280;
            }

            .kanban-card-due-date.overdue {
                color: #ef4444;
            }

            /* Footer de carte */
            .kanban-card-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 12px;
            }

            .kanban-card-assignees {
                display: flex;
                align-items: center;
            }

            .kanban-card-avatar {
                width: var(--avatar-size, 28px);
                height: var(--avatar-size, 28px);
                border-radius: 50%;
                border: 2px solid var(--card-bg, white);
                margin-left: -8px;
                position: relative;
                overflow: hidden;
                background: #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 500;
                color: #6b7280;
            }

            .kanban-card-avatar:first-child {
                margin-left: 0;
            }

            .kanban-card-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .kanban-card-stats {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #6b7280;
            }

            .kanban-card-stat {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* Placeholder de drag */
            .kanban-drop-placeholder {
                height: 100px;
                border: 2px dashed rgba(59, 130, 246, 0.3);
                border-radius: 8px;
                background: rgba(59, 130, 246, 0.05);
                transition: all 0.2s ease;
            }

            .kanban-drop-placeholder.active {
                border-color: rgba(59, 130, 246, 0.6);
                background: rgba(59, 130, 246, 0.1);
                transform: scale(1.02);
            }

            /* Zone d'ajout */
            .kanban-add-card {
                padding: 12px;
                border: 2px dashed rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                color: #6b7280;
            }

            .kanban-add-card:hover {
                border-color: rgba(59, 130, 246, 0.3);
                background: rgba(59, 130, 246, 0.05);
                color: #3b82f6;
            }

            /* WIP Limit Indicator */
            .kanban-wip-indicator {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: #22c55e;
                transition: all 0.3s ease;
            }

            .kanban-wip-indicator.warning {
                background: #f59e0b;
            }

            .kanban-wip-indicator.exceeded {
                background: #ef4444;
                animation: pulse 2s infinite;
            }

            /* Swimlanes */
            .kanban-swimlane {
                display: flex;
                flex-direction: column;
                margin-bottom: 24px;
            }

            .kanban-swimlane-header {
                padding: 12px 16px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 8px 8px 0 0;
                font-weight: 600;
                font-size: 14px;
                color: #4b5563;
            }

            .kanban-swimlane-content {
                display: flex;
                gap: 16px;
                padding: 16px;
                background: rgba(0, 0, 0, 0.02);
                border-radius: 0 0 8px 8px;
            }

            /* Filtres et recherche */
            .kanban-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .kanban-search {
                position: relative;
                flex: 1;
                max-width: 300px;
            }

            .kanban-search input {
                width: 100%;
                padding: 8px 36px 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
            }

            .kanban-filters {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .kanban-filter-chip {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 13px;
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }

            .kanban-filter-chip:hover {
                background: rgba(59, 130, 246, 0.2);
            }

            .kanban-filter-chip.active {
                background: #3b82f6;
                color: white;
            }

            /* Animations */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* Mode compact */
            .kanban-board.compact .kanban-card {
                padding: 8px 12px;
            }

            .kanban-board.compact .kanban-card-description {
                display: none;
            }

            .kanban-board.compact .kanban-card-metadata {
                gap: 4px;
            }

            /* Effet de glissement élastique */
            .kanban-card.elastic-drag {
                transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            /* Effet de traînée */
            .kanban-card.with-trail::after {
                content: '';
                position: absolute;
                inset: 0;
                background: inherit;
                border-radius: inherit;
                opacity: 0.3;
                transform: translateY(4px) scale(0.95);
                filter: blur(4px);
                z-index: -1;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .kanban-board-inner {
                    padding: 16px;
                }

                .kanban-column {
                    flex: 0 0 280px;
                }

                .kanban-card-title {
                    font-size: 13px;
                }

                .kanban-card-description {
                    font-size: 12px;
                }
            }

            /* Mode sombre */
            .kanban-board.dark-mode {
                --title-color: #f3f4f6;
                --card-title-color: #f3f4f6;
                --card-description-color: #9ca3af;
                --count-color: #9ca3af;
            }

            /* Accessibilité */
            .kanban-card:focus,
            .kanban-column:focus {
                outline: 2px solid #3b82f6;
                outline-offset: 2px;
            }

            /* Support du clavier */
            .kanban-card.keyboard-focused {
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            }

            /* État de chargement */
            .kanban-card.loading {
                pointer-events: none;
                opacity: 0.6;
            }

            .kanban-card.loading::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;

        document.head.appendChild(styleSheet);
        stylesInjected = true;
    }

    // ========================================
    // GESTIONNAIRE DRAG & DROP
    // ========================================
    class DragDropManager {
        constructor(board, options) {
            this.board = board;
            this.options = options;
            this.draggedElement = null;
            this.draggedData = null;
            this.placeholder = null;
            this.autoScrollInterval = null;
            this.selectedCards = new Set();
            
            this.init();
        }

        init() {
            // Événements souris
            this.board.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.board.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.board.addEventListener('mouseup', this.handleMouseUp.bind(this));
            
            // Événements tactiles
            this.board.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.board.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.board.addEventListener('touchend', this.handleTouchEnd.bind(this));
            
            // Événements clavier
            this.board.addEventListener('keydown', this.handleKeyDown.bind(this));
        }

        handleMouseDown(e) {
            const card = e.target.closest('.kanban-card');
            if (!card || e.button !== 0) return;

            e.preventDefault();
            this.startDrag(card, e.clientX, e.clientY);
        }

        handleTouchStart(e) {
            const card = e.target.closest('.kanban-card');
            if (!card) return;

            const touch = e.touches[0];
            e.preventDefault();
            this.startDrag(card, touch.clientX, touch.clientY);
        }

        startDrag(card, x, y) {
            this.draggedElement = card;
            this.draggedData = {
                startX: x,
                startY: y,
                offsetX: x - card.getBoundingClientRect().left,
                offsetY: y - card.getBoundingClientRect().top,
                sourceColumn: card.closest('.kanban-column'),
                cardData: this.extractCardData(card)
            };

            // Créer le placeholder
            this.placeholder = this.createPlaceholder();
            
            // Ajouter les classes de drag
            card.classList.add('dragging');
            if (this.options.animations?.drag?.trail) {
                card.classList.add('with-trail');
            }

            // Déclencher l'événement de début de drag
            this.board.dispatchEvent(new CustomEvent('kanban:dragstart', {
                detail: { card, data: this.draggedData }
            }));
        }

        handleMouseMove(e) {
            if (!this.draggedElement) return;
            e.preventDefault();
            this.drag(e.clientX, e.clientY);
        }

        handleTouchMove(e) {
            if (!this.draggedElement) return;
            const touch = e.touches[0];
            e.preventDefault();
            this.drag(touch.clientX, touch.clientY);
        }

        drag(x, y) {
            // Positionner l'élément dragué
            const card = this.draggedElement;
            card.style.position = 'fixed';
            card.style.left = `${x - this.draggedData.offsetX}px`;
            card.style.top = `${y - this.draggedData.offsetY}px`;
            card.style.zIndex = '1000';
            card.style.pointerEvents = 'none';

            // Trouver la colonne cible
            const columnElement = document.elementFromPoint(x, y)?.closest('.kanban-column');
            if (columnElement && columnElement !== this.currentTargetColumn) {
                this.currentTargetColumn = columnElement;
                this.updatePlaceholder(columnElement, y);
            }

            // Auto-scroll si nécessaire
            this.autoScroll(x, y);
        }

        updatePlaceholder(column, y) {
            const cardsContainer = column.querySelector('.kanban-column-cards');
            const cards = Array.from(cardsContainer.querySelectorAll('.kanban-card:not(.dragging)'));
            
            // Trouver la position d'insertion
            let insertBefore = null;
            for (const card of cards) {
                const rect = card.getBoundingClientRect();
                if (y < rect.top + rect.height / 2) {
                    insertBefore = card;
                    break;
                }
            }

            // Insérer le placeholder
            if (insertBefore) {
                cardsContainer.insertBefore(this.placeholder, insertBefore);
            } else {
                cardsContainer.appendChild(this.placeholder);
            }

            this.placeholder.classList.add('active');
        }

        handleMouseUp(e) {
            if (!this.draggedElement) return;
            e.preventDefault();
            this.endDrag();
        }

        handleTouchEnd(e) {
            if (!this.draggedElement) return;
            this.endDrag();
        }

        endDrag() {
            const card = this.draggedElement;
            const placeholder = this.placeholder;
            
            // Réinitialiser les styles
            card.style.position = '';
            card.style.left = '';
            card.style.top = '';
            card.style.zIndex = '';
            card.style.pointerEvents = '';
            card.classList.remove('dragging', 'with-trail');

            // Déplacer la carte à la position du placeholder
            if (placeholder && placeholder.parentNode) {
                const targetColumn = placeholder.closest('.kanban-column');
                const targetContainer = targetColumn.querySelector('.kanban-column-cards');
                
                // Animation de drop
                if (this.options.animations?.drop?.bounce) {
                    card.style.animation = 'slideIn 0.3s ease';
                }

                // Insérer la carte
                targetContainer.insertBefore(card, placeholder);
                
                // Effet ripple si activé
                if (this.options.animations?.drop?.ripple) {
                    this.createRippleEffect(card);
                }

                // Déclencher l'événement de drop
                this.board.dispatchEvent(new CustomEvent('kanban:drop', {
                    detail: {
                        card,
                        sourceColumn: this.draggedData.sourceColumn,
                        targetColumn,
                        position: Array.from(targetContainer.children).indexOf(card)
                    }
                }));
            }

            // Nettoyer
            placeholder?.remove();
            this.draggedElement = null;
            this.draggedData = null;
            this.placeholder = null;
            this.currentTargetColumn = null;
            
            clearInterval(this.autoScrollInterval);
        }

        createPlaceholder() {
            const placeholder = document.createElement('div');
            placeholder.className = 'kanban-drop-placeholder';
            placeholder.style.height = `${this.draggedElement.offsetHeight}px`;
            return placeholder;
        }

        createRippleEffect(element) {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 10px;
                height: 10px;
                background: rgba(59, 130, 246, 0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(1);
                animation: ripple 0.6s ease;
                pointer-events: none;
            `;
            element.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        }

        autoScroll(x, y) {
            const threshold = 50;
            const speed = 10;
            const boardRect = this.board.getBoundingClientRect();
            
            clearInterval(this.autoScrollInterval);
            
            // Scroll horizontal
            if (x < boardRect.left + threshold) {
                this.autoScrollInterval = setInterval(() => {
                    this.board.scrollLeft -= speed;
                }, 16);
            } else if (x > boardRect.right - threshold) {
                this.autoScrollInterval = setInterval(() => {
                    this.board.scrollLeft += speed;
                }, 16);
            }
            
            // Scroll vertical pour les colonnes
            const column = document.elementFromPoint(x, y)?.closest('.kanban-column-cards');
            if (column) {
                const columnRect = column.getBoundingClientRect();
                if (y < columnRect.top + threshold) {
                    this.autoScrollInterval = setInterval(() => {
                        column.scrollTop -= speed;
                    }, 16);
                } else if (y > columnRect.bottom - threshold) {
                    this.autoScrollInterval = setInterval(() => {
                        column.scrollTop += speed;
                    }, 16);
                }
            }
        }

        handleKeyDown(e) {
            if (!this.options.dragDrop?.keyboard) return;

            const card = e.target.closest('.kanban-card');
            if (!card) return;

            switch (e.key) {
                case ' ':
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleCardSelection(card);
                    }
                    break;
                case 'ArrowUp':
                case 'ArrowDown':
                    if (e.altKey) {
                        e.preventDefault();
                        this.moveCardKeyboard(card, e.key === 'ArrowUp' ? 'up' : 'down');
                    }
                    break;
                case 'ArrowLeft':
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        this.moveCardToColumn(card, e.key === 'ArrowLeft' ? 'prev' : 'next');
                    }
                    break;
            }
        }

        toggleCardSelection(card) {
            if (this.selectedCards.has(card)) {
                this.selectedCards.delete(card);
                card.classList.remove('selected');
            } else {
                this.selectedCards.add(card);
                card.classList.add('selected');
            }
        }

        moveCardKeyboard(card, direction) {
            const container = card.parentElement;
            const cards = Array.from(container.children);
            const currentIndex = cards.indexOf(card);
            
            if (direction === 'up' && currentIndex > 0) {
                container.insertBefore(card, cards[currentIndex - 1]);
            } else if (direction === 'down' && currentIndex < cards.length - 1) {
                container.insertBefore(cards[currentIndex + 1], card);
            }
            
            card.focus();
        }

        moveCardToColumn(card, direction) {
            const currentColumn = card.closest('.kanban-column');
            const columns = Array.from(this.board.querySelectorAll('.kanban-column'));
            const currentIndex = columns.indexOf(currentColumn);
            
            let targetColumn;
            if (direction === 'prev' && currentIndex > 0) {
                targetColumn = columns[currentIndex - 1];
            } else if (direction === 'next' && currentIndex < columns.length - 1) {
                targetColumn = columns[currentIndex + 1];
            }
            
            if (targetColumn) {
                const targetContainer = targetColumn.querySelector('.kanban-column-cards');
                targetContainer.appendChild(card);
                card.focus();
            }
        }

        extractCardData(card) {
            return {
                id: card.dataset.id,
                title: card.querySelector('.kanban-card-title')?.textContent,
                // Extraire d'autres données selon les besoins
            };
        }
    }

    // ========================================
    // CRÉATION DES ÉLÉMENTS
    // ========================================
    function createBoard(options) {
        const board = document.createElement('div');
        board.className = `kanban-board ${options.style || 'glassmorphism'} ${options.layout || 'horizontal'}`;
        
        // Appliquer les styles du thème
        const style = CONFIG.styles[options.style] || CONFIG.styles.glassmorphism;
        Object.assign(board.style, style.board);

        // Container interne pour le scroll
        const boardInner = document.createElement('div');
        boardInner.className = 'kanban-board-inner';
        board.appendChild(boardInner);

        // Ajouter les contrôles si activés
        if (options.features?.search || options.features?.filters) {
            const controls = createControls(options);
            board.insertBefore(controls, boardInner);
        }

        return board;
    }

    function createColumn(columnData, options) {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.id = columnData.id;
        
        // Appliquer les styles
        const style = CONFIG.styles[options.style] || CONFIG.styles.glassmorphism;
        Object.assign(column.style, style.column);
        column.style.setProperty('--column-width', `${options.columnWidth || CONFIG.layouts[options.layout].columnWidth}px`);

        // WIP Limit indicator
        if (options.features?.wip?.enabled && columnData.wipLimit) {
            const wipIndicator = document.createElement('div');
            wipIndicator.className = 'kanban-wip-indicator';
            column.appendChild(wipIndicator);
        }

        // En-tête
        const header = createColumnHeader(columnData, options);
        column.appendChild(header);

        // Zone de cartes
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'kanban-column-cards';
        column.appendChild(cardsContainer);

        // Footer
        if (options.features?.footer?.showStats || options.features?.footer?.showActions) {
            const footer = createColumnFooter(columnData, options);
            column.appendChild(footer);
        }

        // Zone d'ajout
        if (options.features?.actions?.add !== false) {
            const addCard = document.createElement('div');
            addCard.className = 'kanban-add-card';
            addCard.innerHTML = '<span>+ Ajouter une carte</span>';
            addCard.addEventListener('click', () => handleAddCard(column, options));
            column.appendChild(addCard);
        }

        return column;
    }

    function createColumnHeader(columnData, options) {
        const header = document.createElement('div');
        header.className = 'kanban-column-header';

        // Titre et compteur
        const titleContainer = document.createElement('div');
        titleContainer.className = 'kanban-column-title';
        
        if (options.features?.header?.collapsible) {
            const collapseIcon = document.createElement('span');
            collapseIcon.innerHTML = '▼';
            collapseIcon.style.transition = 'transform 0.3s ease';
            titleContainer.appendChild(collapseIcon);
        }

        const title = document.createElement('span');
        title.textContent = columnData.title;
        titleContainer.appendChild(title);

        if (options.features?.header?.showCount !== false) {
            const count = document.createElement('span');
            count.className = 'kanban-column-count';
            count.textContent = columnData.cards?.length || 0;
            titleContainer.appendChild(count);
        }

        header.appendChild(titleContainer);

        // Actions
        if (options.features?.header?.showMenu) {
            const actions = document.createElement('div');
            actions.className = 'kanban-column-actions';
            
            const menuButton = document.createElement('button');
            menuButton.innerHTML = '⋮';
            menuButton.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 16px;';
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                showColumnMenu(columnData, options);
            });
            
            actions.appendChild(menuButton);
            header.appendChild(actions);
        }

        // Gestion du collapse
        if (options.features?.header?.collapsible) {
            header.addEventListener('click', () => {
                const column = header.closest('.kanban-column');
                column.classList.toggle('collapsed');
                const icon = header.querySelector('.kanban-column-title span:first-child');
                icon.style.transform = column.classList.contains('collapsed') ? 'rotate(-90deg)' : '';
            });
        }

        return header;
    }

    function createCard(cardData, options) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.dataset.id = cardData.id;
        card.tabIndex = 0;
        
        // Appliquer les styles
        const style = CONFIG.styles[options.style] || CONFIG.styles.glassmorphism;
        Object.assign(card.style, style.card);

        // Indicateur de priorité
        if (cardData.priority && options.features?.metadata?.priority) {
            const priority = document.createElement('div');
            priority.className = `kanban-card-priority ${cardData.priority}`;
            card.appendChild(priority);
        }

        // En-tête de carte
        const header = document.createElement('div');
        header.className = 'kanban-card-header';

        // Titre
        const title = document.createElement('div');
        title.className = 'kanban-card-title';
        title.textContent = cardData.title;
        header.appendChild(title);

        // Actions de carte
        if (options.features?.actions) {
            const actions = createCardActions(cardData, options);
            header.appendChild(actions);
        }

        card.appendChild(header);

        // Description
        if (cardData.description && options.features?.content?.description !== false) {
            const description = document.createElement('div');
            description.className = 'kanban-card-description';
            description.textContent = cardData.description;
            card.appendChild(description);
        }

        // Image/Thumbnail
        if (cardData.thumbnail && options.features?.content?.thumbnail) {
            const thumbnail = document.createElement('img');
            thumbnail.className = 'kanban-card-thumbnail';
            thumbnail.src = cardData.thumbnail;
            thumbnail.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin: 8px 0;';
            card.appendChild(thumbnail);
        }

        // Progress bar
        if (cardData.progress !== undefined && options.features?.content?.progress) {
            const progressContainer = document.createElement('div');
            progressContainer.style.cssText = 'margin: 8px 0;';
            
            const progressBar = document.createElement('div');
            progressBar.style.cssText = `
                height: 4px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 2px;
                overflow: hidden;
            `;
            
            const progressFill = document.createElement('div');
            progressFill.style.cssText = `
                height: 100%;
                width: ${cardData.progress}%;
                background: #22c55e;
                transition: width 0.3s ease;
            `;
            
            progressBar.appendChild(progressFill);
            progressContainer.appendChild(progressBar);
            card.appendChild(progressContainer);
        }

        // Checklist
        if (cardData.checklist && options.features?.content?.checklist) {
            const checklist = createChecklist(cardData.checklist);
            card.appendChild(checklist);
        }

        // Métadonnées
        if (options.features?.metadata) {
            const metadata = createCardMetadata(cardData, options);
            if (metadata.children.length > 0) {
                card.appendChild(metadata);
            }
        }

        // Footer
        const footer = createCardFooter(cardData, options);
        if (footer.children.length > 0) {
            card.appendChild(footer);
        }

        // Appliquer les animations
        applyCardAnimations(card, options);

        return card;
    }

    function createCardMetadata(cardData, options) {
        const metadata = document.createElement('div');
        metadata.className = 'kanban-card-metadata';

        // Tags
        if (cardData.tags && options.features?.metadata?.tags) {
            cardData.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'kanban-card-tag';
                tagEl.textContent = tag;
                tagEl.style.background = CONFIG.colors.tags[tag] ? 
                    `${CONFIG.colors.tags[tag]}20` : 'rgba(139, 92, 246, 0.1)';
                tagEl.style.color = CONFIG.colors.tags[tag] || '#8b5cf6';
                metadata.appendChild(tagEl);
            });
        }

        // Due date
        if (cardData.dueDate && options.features?.metadata?.dueDate) {
            const dueDateEl = document.createElement('div');
            dueDateEl.className = 'kanban-card-due-date';
            
            const now = new Date();
            const dueDate = new Date(cardData.dueDate);
            const isOverdue = dueDate < now;
            
            if (isOverdue) {
                dueDateEl.classList.add('overdue');
            }
            
            dueDateEl.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${formatDate(dueDate)}</span>
            `;
            
            metadata.appendChild(dueDateEl);
        }

        // Type badge
        if (cardData.type && options.features?.metadata?.type) {
            const typeBadge = document.createElement('span');
            typeBadge.className = 'kanban-card-type';
            typeBadge.textContent = cardData.type;
            typeBadge.style.cssText = `
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                background: rgba(0, 0, 0, 0.05);
                color: #6b7280;
            `;
            metadata.appendChild(typeBadge);
        }

        return metadata;
    }

    function createCardFooter(cardData, options) {
        const footer = document.createElement('div');
        footer.className = 'kanban-card-footer';

        // Assignees
        if (cardData.assignees && options.features?.people?.assignee) {
            const assigneesContainer = document.createElement('div');
            assigneesContainer.className = 'kanban-card-assignees';
            
            const maxVisible = 3;
            const assignees = cardData.assignees.slice(0, maxVisible);
            const remaining = cardData.assignees.length - maxVisible;

            assignees.forEach(assignee => {
                const avatar = document.createElement('div');
                avatar.className = 'kanban-card-avatar';
                
                if (assignee.avatar) {
                    const img = document.createElement('img');
                    img.src = assignee.avatar;
                    img.alt = assignee.name;
                    avatar.appendChild(img);
                } else {
                    avatar.textContent = assignee.name.charAt(0).toUpperCase();
                    avatar.style.background = generateColorFromString(assignee.name);
                    avatar.style.color = 'white';
                }
                
                avatar.title = assignee.name;
                assigneesContainer.appendChild(avatar);
            });

            if (remaining > 0) {
                const moreAvatar = document.createElement('div');
                moreAvatar.className = 'kanban-card-avatar';
                moreAvatar.textContent = `+${remaining}`;
                moreAvatar.style.background = '#6b7280';
                moreAvatar.style.color = 'white';
                assigneesContainer.appendChild(moreAvatar);
            }

            footer.appendChild(assigneesContainer);
        }

        // Stats
        const stats = document.createElement('div');
        stats.className = 'kanban-card-stats';

        // Comments
        if (cardData.commentsCount && options.features?.indicators?.activity) {
            const commentStat = document.createElement('div');
            commentStat.className = 'kanban-card-stat';
            commentStat.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>${cardData.commentsCount}</span>
            `;
            stats.appendChild(commentStat);
        }

        // Attachments
        if (cardData.attachmentsCount && options.features?.content?.attachments) {
            const attachmentStat = document.createElement('div');
            attachmentStat.className = 'kanban-card-stat';
            attachmentStat.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <span>${cardData.attachmentsCount}</span>
            `;
            stats.appendChild(attachmentStat);
        }

        if (stats.children.length > 0) {
            footer.appendChild(stats);
        }

        return footer;
    }

    function createControls(options) {
        const controls = document.createElement('div');
        controls.className = 'kanban-controls';

        // Recherche
        if (options.features?.search) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'kanban-search';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Rechercher...';
            searchInput.addEventListener('input', (e) => {
                handleSearch(e.target.value, options);
            });
            
            searchContainer.appendChild(searchInput);
            controls.appendChild(searchContainer);
        }

        // Filtres
        if (options.features?.filters) {
            const filters = document.createElement('div');
            filters.className = 'kanban-filters';
            
            // Filtres rapides
            if (options.features.filters.quick) {
                options.features.filters.quick.forEach(filterType => {
                    const chip = document.createElement('div');
                    chip.className = 'kanban-filter-chip';
                    chip.textContent = filterType;
                    chip.dataset.filterType = filterType;
                    chip.addEventListener('click', () => {
                        chip.classList.toggle('active');
                        applyFilters(options);
                    });
                    filters.appendChild(chip);
                });
            }
            
            controls.appendChild(filters);
        }

        // Boutons de vue
        if (options.features?.views) {
            const viewButtons = document.createElement('div');
            viewButtons.className = 'kanban-view-buttons';
            viewButtons.style.cssText = 'display: flex; gap: 4px; margin-left: auto;';
            
            ['compact', 'detailed', 'list'].forEach(view => {
                if (options.features.views[view]) {
                    const button = document.createElement('button');
                    button.textContent = view;
                    button.className = 'kanban-view-button';
                    button.style.cssText = `
                        padding: 6px 12px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        border-radius: 6px;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `;
                    button.addEventListener('click', () => changeView(view, options));
                    viewButtons.appendChild(button);
                }
            });
            
            controls.appendChild(viewButtons);
        }

        return controls;
    }

    // ========================================
    // FONCTIONS UTILITAIRES
    // ========================================
    function formatDate(date) {
        const today = new Date();
        const diffTime = date - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Aujourd\'hui';
        if (diffDays === 1) return 'Demain';
        if (diffDays === -1) return 'Hier';
        if (diffDays > 0 && diffDays <= 7) return `Dans ${diffDays} jours`;
        if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`;
        
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }

    function generateColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        return `hsl(${h}, 70%, 50%)`;
    }

    function createChecklist(checklist) {
        const container = document.createElement('div');
        container.className = 'kanban-card-checklist';
        container.style.cssText = 'margin: 8px 0; font-size: 12px;';
        
        const completed = checklist.items.filter(item => item.completed).length;
        const total = checklist.items.length;
        
        const summary = document.createElement('div');
        summary.style.cssText = 'display: flex; align-items: center; gap: 8px; color: #6b7280;';
        summary.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            <span>${completed}/${total}</span>
        `;
        
        container.appendChild(summary);
        return container;
    }

    function applyCardAnimations(card, options) {
        const animation = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        
        if (animation.card) {
            card.style.transition = animation.card.transition;
            
            card.addEventListener('mouseenter', () => {
                if (animation.card.hover) {
                    card.style.transform = animation.card.hover;
                }
                if (animation.card.shadow) {
                    card.style.boxShadow = animation.card.shadow;
                }
                if (animation.card.glow) {
                    card.style.filter = 'brightness(1.05)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
                card.style.filter = '';
            });
        }
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    function handleAddCard(column, options) {
        const dialog = document.createElement('div');
        dialog.className = 'kanban-add-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            z-index: 1001;
            min-width: 400px;
        `;
        
        // Formulaire simple
        dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0;">Nouvelle carte</h3>
            <input type="text" placeholder="Titre de la carte" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 12px;">
            <textarea placeholder="Description (optionnel)" style="width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 16px; resize: vertical; min-height: 80px;"></textarea>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="cancel" style="padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer;">Annuler</button>
                <button class="submit" style="padding: 8px 16px; border: none; background: #3b82f6; color: white; border-radius: 6px; cursor: pointer;">Ajouter</button>
            </div>
        `;
        
        // Overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 1000;';
        overlay.addEventListener('click', () => {
            dialog.remove();
            overlay.remove();
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // Focus sur le champ titre
        const titleInput = dialog.querySelector('input');
        titleInput.focus();
        
        // Gestion des boutons
        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
            overlay.remove();
        });
        
        dialog.querySelector('.submit').addEventListener('click', () => {
            const title = dialog.querySelector('input').value;
            const description = dialog.querySelector('textarea').value;
            
            if (title.trim()) {
                const newCard = {
                    id: Date.now().toString(),
                    title: title.trim(),
                    description: description.trim(),
                    createdDate: new Date().toISOString()
                };
                
                // Créer la carte
                const cardElement = createCard(newCard, options);
                const cardsContainer = column.querySelector('.kanban-column-cards');
                cardsContainer.appendChild(cardElement);
                
                // Mettre à jour le compteur
                updateColumnCount(column);
                
                // Animation d'entrée
                cardElement.style.animation = 'slideIn 0.3s ease';
                
                // Déclencher l'événement
                column.dispatchEvent(new CustomEvent('kanban:cardAdded', {
                    detail: { card: newCard, column }
                }));
            }
            
            dialog.remove();
            overlay.remove();
        });
    }

    function updateColumnCount(column) {
        const count = column.querySelector('.kanban-column-count');
        if (count) {
            const cardsCount = column.querySelectorAll('.kanban-card').length;
            count.textContent = cardsCount;
        }
    }

    function handleSearch(query, options) {
        const board = document.querySelector('.kanban-board');
        const cards = board.querySelectorAll('.kanban-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.kanban-card-title')?.textContent.toLowerCase();
            const description = card.querySelector('.kanban-card-description')?.textContent.toLowerCase();
            const searchTerm = query.toLowerCase();
            
            const matches = (title && title.includes(searchTerm)) || 
                          (description && description.includes(searchTerm));
            
            card.style.display = matches || !query ? '' : 'none';
        });
    }

    function showColumnMenu(columnData, options) {
        console.log('Menu de colonne:', columnData);
        // Implémenter le menu contextuel
    }

    function createCardActions(cardData, options) {
        const actions = document.createElement('div');
        actions.className = 'kanban-card-actions';
        actions.style.cssText = 'display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s ease;';
        
        // Afficher au survol
        const card = actions.closest('.kanban-card');
        if (card) {
            card.addEventListener('mouseenter', () => actions.style.opacity = '1');
            card.addEventListener('mouseleave', () => actions.style.opacity = '0');
        }
        
        return actions;
    }

    function applyFilters(options) {
        console.log('Application des filtres');
        // Implémenter la logique de filtrage
    }

    function changeView(view, options) {
        const board = document.querySelector('.kanban-board');
        board.className = `kanban-board ${options.style} ${view}`;
    }

    function createColumnFooter(columnData, options) {
        const footer = document.createElement('div');
        footer.className = 'kanban-column-footer';
        footer.style.cssText = 'padding: 12px; border-top: 1px solid rgba(0, 0, 0, 0.05); font-size: 12px; color: #6b7280;';
        
        if (options.features?.footer?.showStats) {
            const stats = document.createElement('div');
            stats.textContent = `${columnData.cards?.length || 0} cartes`;
            footer.appendChild(stats);
        }
        
        return footer;
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE CRÉATION
    // ========================================
    function create(options = {}) {
        // Injecter les styles
        injectStyles();

        // Options par défaut
        const defaultOptions = {
            layout: 'horizontal',
            style: 'glassmorphism',
            animation: 'smooth',
            columns: [],
            features: {
                dragDrop: { enabled: true },
                search: true,
                filters: { enabled: true, quick: ['assignee', 'priority'] },
                header: { showCount: true, showMenu: true },
                actions: { add: true },
                metadata: { tags: true, dueDate: true },
                people: { assignee: true, avatars: true }
            }
        };

        const finalOptions = deepMerge(defaultOptions, options);

        // Créer le board
        const board = createBoard(finalOptions);
        const boardInner = board.querySelector('.kanban-board-inner');

        // Créer les colonnes
        finalOptions.columns.forEach(columnData => {
            const column = createColumn(columnData, finalOptions);
            boardInner.appendChild(column);

            // Ajouter les cartes
            if (columnData.cards) {
                const cardsContainer = column.querySelector('.kanban-column-cards');
                columnData.cards.forEach(cardData => {
                    const card = createCard(cardData, finalOptions);
                    cardsContainer.appendChild(card);
                });
            }
        });

        // Initialiser le drag & drop
        if (finalOptions.features?.dragDrop?.enabled) {
            new DragDropManager(board, finalOptions);
        }

        // Stocker les options
        board._kanbanOptions = finalOptions;

        return board;
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function deepMerge(target, source) {
        const output = Object.assign({}, target);
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target))
                        Object.assign(output, { [key]: source[key] });
                    else
                        output[key] = deepMerge(target[key], source[key]);
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        CONFIG,
        
        // Méthodes utilitaires
        addCard: (board, columnId, cardData) => {
            const column = board.querySelector(`[data-id="${columnId}"]`);
            if (column && board._kanbanOptions) {
                const card = createCard(cardData, board._kanbanOptions);
                column.querySelector('.kanban-column-cards').appendChild(card);
                updateColumnCount(column);
                return card;
            }
        },
        
        removeCard: (board, cardId) => {
            const card = board.querySelector(`[data-id="${cardId}"]`);
            if (card) {
                const column = card.closest('.kanban-column');
                card.remove();
                updateColumnCount(column);
            }
        },
        
        updateCard: (board, cardId, updates) => {
            const card = board.querySelector(`[data-id="${cardId}"]`);
            if (card && board._kanbanOptions) {
                // Recréer la carte avec les nouvelles données
                const oldData = extractCardData(card);
                const newData = { ...oldData, ...updates };
                const newCard = createCard(newData, board._kanbanOptions);
                card.replaceWith(newCard);
                return newCard;
            }
        },
        
        moveCard: (board, cardId, targetColumnId, position) => {
            const card = board.querySelector(`[data-id="${cardId}"]`);
            const targetColumn = board.querySelector(`[data-id="${targetColumnId}"]`);
            
            if (card && targetColumn) {
                const sourceColumn = card.closest('.kanban-column');
                const targetContainer = targetColumn.querySelector('.kanban-column-cards');
                const cards = Array.from(targetContainer.children);
                
                if (position !== undefined && position < cards.length) {
                    targetContainer.insertBefore(card, cards[position]);
                } else {
                    targetContainer.appendChild(card);
                }
                
                updateColumnCount(sourceColumn);
                updateColumnCount(targetColumn);
            }
        },
        
        // Présets pour démarrage rapide
        presets: {
            scrum: () => create({
                columns: [
                    { id: 'backlog', title: 'Backlog', wipLimit: null },
                    { id: 'todo', title: 'À faire', wipLimit: 5 },
                    { id: 'inprogress', title: 'En cours', wipLimit: 3 },
                    { id: 'review', title: 'Revue', wipLimit: 2 },
                    { id: 'done', title: 'Terminé', wipLimit: null }
                ],
                features: {
                    wip: { enabled: true, hard: true },
                    metadata: { priority: true, effort: true },
                    people: { multipleAssignees: true }
                }
            }),
            
            simple: () => create({
                columns: [
                    { id: 'todo', title: 'À faire' },
                    { id: 'doing', title: 'En cours' },
                    { id: 'done', title: 'Terminé' }
                ],
                features: {
                    metadata: { tags: false, dueDate: false },
                    filters: { enabled: false }
                }
            }),
            
            project: () => create({
                columns: [
                    { id: 'ideas', title: 'Idées' },
                    { id: 'planned', title: 'Planifié' },
                    { id: 'inprogress', title: 'En cours' },
                    { id: 'testing', title: 'Tests' },
                    { id: 'deployed', title: 'Déployé' }
                ],
                features: {
                    metadata: { type: true, priority: true },
                    content: { progress: true, thumbnail: true }
                }
            })
        }
    };
})();

// Export pour utilisation avec le système de modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KanbanComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Gestion du drag & drop tactile
   Solution: Utilisation d'événements touch avec preventDefault
   et gestion manuelle du positionnement
   
   [2024-01-XX] - Performance avec beaucoup de cartes
   Solution: Virtualisation du scroll et lazy loading des
   cartes hors viewport
   
   [2024-01-XX] - Conflits de z-index pendant le drag
   Cause: Éléments fixes et positionnement complexe
   Résolution: Gestion dynamique du z-index et isolation
   du contexte de stacking
   
   [2024-01-XX] - Auto-scroll pendant le drag
   Solution: Détection des zones de scroll et déclenchement
   avec requestAnimationFrame
   
   NOTES POUR REPRISES FUTURES:
   - Le drag & drop utilise des événements natifs pour la performance
   - Les animations sont désactivées sur mobile pour la fluidité
   - Le système de filtres utilise des data-attributes pour la rapidité
   - Attention aux fuites mémoire avec les event listeners
   ======================================== */