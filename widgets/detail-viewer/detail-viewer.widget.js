/* ========================================
   DETAIL-VIEWER.WIDGET.JS - Widget de visualisation détaillée
   Chemin: /widgets/detail-viewer/detail-viewer.widget.js
   
   DESCRIPTION:
   Widget modal complet pour afficher le détail d'un élément.
   Inclut une timeline optionnelle et des sections configurables.
   100% autonome avec son propre CSS.
   
   STRUCTURE DU FICHIER:
   1. CONFIGURATION ET ÉTAT
   2. INITIALISATION
   3. RENDU DU MODAL
   4. TIMELINE INTÉGRÉE
   5. SECTIONS DYNAMIQUES
   6. INTERACTIONS
   7. API PUBLIQUE
   8. DESTRUCTION
   
   UTILISATION:
   import { DetailViewerWidget } from '/widgets/detail-viewer/detail-viewer.widget.js';
   const viewer = new DetailViewerWidget({
       title: 'Facture #123',
       data: factureData,
       timeline: { enabled: true, items: [...] },
       sections: [...],
       actions: [...]
   });
   
   API PUBLIQUE:
   - open() - Ouvrir le modal
   - close() - Fermer le modal
   - update(data) - Mettre à jour les données
   - refresh() - Rafraîchir l'affichage
   - destroy() - Détruire le widget
   
   OPTIONS:
   - title: string - Titre du modal
   - subtitle: string - Sous-titre optionnel
   - data: object - Données à afficher
   - timeline: object - Configuration timeline
   - sections: array - Sections à afficher
   - actions: array - Boutons d'action
   - theme: string - Thème visuel
   - size: string - Taille du modal
   - buttonClasses: object - Classes CSS externes pour boutons
   - onOpen: function - Callback ouverture
   - onClose: function - Callback fermeture
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class DetailViewerWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Apparence
            title: config.title || 'Détail',
            subtitle: config.subtitle || null,
            theme: config.theme || 'default', // 'default' | 'minimal' | 'dark'
            size: config.size || 'large', // 'small' | 'medium' | 'large' | 'xlarge'
            
            // Données
            data: config.data || {},
            
            // Timeline intégrée (optionnelle)
            timeline: {
                enabled: config.timeline?.enabled ?? false,
                items: config.timeline?.items || [],
                theme: config.timeline?.theme || 'default', // 'default' | 'minimal' | 'colorful'
                size: config.timeline?.size || 'medium', // 'small' | 'medium' | 'large'
                orientation: config.timeline?.orientation || 'horizontal', // 'horizontal' | 'vertical'
                animated: config.timeline?.animated ?? true,
                showDates: config.timeline?.showDates ?? true,
                showLabels: config.timeline?.showLabels ?? true,
                pulse: config.timeline?.pulse ?? true,
                ...config.timeline
            },
            
            // Sections configurables
            sections: config.sections || [],
            
            // Actions footer
            actions: config.actions || [],
            
            // Classes CSS externes pour les boutons
            buttonClasses: config.buttonClasses || {
                primary: 'btn btn-primary',
                secondary: 'btn btn-secondary',
                success: 'btn btn-success',
                danger: 'btn btn-danger',
                warning: 'btn btn-warning',
                info: 'btn btn-info',
                close: 'btn-close'
            },
            
            // Comportement
            closeOnOverlay: config.closeOnOverlay !== false,
            closeOnEscape: config.closeOnEscape !== false,
            animated: config.animated !== false,
            
            // Callbacks
            onOpen: config.onOpen || null,
            onClose: config.onClose || null,
            onAction: config.onAction || null,
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            isOpen: false,
            loaded: false,
            currentData: this.config.data
        };
        
        // 4. Références DOM
        this.elements = {
            overlay: null,
            modal: null,
            body: null,
            timelineContainer: null,
            sectionsContainer: null,
            actionsContainer: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'detail-viewer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser
        this.init();
    }
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        // Charger les styles communs (buttons, badges, modal)
        import('/src/utils/widget-styles-loader.js').then(module => {
            module.loadWidgetStyles();
        });
        
        // Charger le CSS spécifique du widget
        const cssId = 'detail-viewer-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/detail-viewer/detail-viewer.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
    }
    /**
     * Initialisation
     */
    async init() {
        try {
            this.render();
            this.attachEvents();
            this.showWithDelay();
            
            // Auto-open si configuré
            if (this.config.autoOpen !== false) {
                this.open();
            }
        } catch (error) {
            console.error('❌ Erreur init DetailViewerWidget:', error);
        }
    }
    
    /**
     * Rendu du modal complet
     */
    render() {
        // Créer l'overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = `modal-overlay modal-theme-${this.config.theme}`;
        this.elements.overlay.id = `${this.id}-overlay`;

        // Créer le modal
        this.elements.modal = document.createElement('div');
        this.elements.modal.className = `modal-container modal-${this.config.size}`;
        
        // Structure du modal
        this.elements.modal.innerHTML = `
        <!-- Header -->
        <div class="modal-header">
            <div class="modal-header-content">
                <h2 class="modal-title">${this.escapeHtml(this.config.title)}</h2>
                ${this.config.subtitle ? `
                    <p class="modal-subtitle">${this.escapeHtml(this.config.subtitle)}</p>
                ` : ''}
            </div>
            <button class="modal-close" aria-label="Fermer">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Body -->
            <div class="modal-body">
                <!-- Timeline (si activée) -->
                ${this.config.timeline.enabled ? `
                    <div class="detail-viewer-timeline-zone">
                        ${this.renderTimeline()}
                    </div>
                ` : ''}
                
                <!-- Sections -->
                <div class="detail-viewer-sections">
                    ${this.renderSections()}
                </div>
            </div>

            <!-- Footer (si actions) -->
            ${this.config.actions.length > 0 ? `
                <div class="modal-footer">
                    ${this.renderActions()}
                </div>
            ` : ''}
        `;
        
        // Ajouter au DOM
        this.elements.overlay.appendChild(this.elements.modal);
        document.body.appendChild(this.elements.overlay);
        
        // Stocker les références
        this.elements.body = this.elements.modal.querySelector('.detail-viewer-body');
        this.elements.timelineContainer = this.elements.modal.querySelector('.detail-viewer-timeline-zone');
        this.elements.sectionsContainer = this.elements.modal.querySelector('.detail-viewer-sections');
        this.elements.actionsContainer = this.elements.modal.querySelector('.detail-viewer-footer');
    
    }
    
    /**
     * Rendu de la timeline intégrée
     */
    renderTimeline() {
        if (!this.config.timeline.enabled || !this.config.timeline.items.length) {
            return '';
        }
        
        const { theme, size, orientation, animated, showDates, showLabels, pulse } = this.config.timeline;
        
        // Classes de la timeline
        const timelineClasses = [
            'detail-timeline',
            `timeline-${orientation}`,
            `timeline-${theme}`,
            `timeline-${size}`,
            animated && 'timeline-animated',
            pulse && 'timeline-pulse'
        ].filter(Boolean).join(' ');
        
        // Calculer la progression pour le connector
        const items = this.config.timeline.items;
        const completedCount = items.filter(item => item.status === 'completed').length;
        const activeIndex = items.findIndex(item => item.status === 'active' || item.status === 'current');
        const progress = activeIndex >= 0 ? 
            ((completedCount + 0.5) / items.length) * 100 : 
            (completedCount / items.length) * 100;
        
        return `
            <div class="${timelineClasses}" style="--progress: ${progress}%;">
                <div class="timeline-connector"></div>
                <div class="timeline-items">
                    ${items.map((item, index) => this.renderTimelineItem(item, index)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu d'un item de timeline
     */
    renderTimelineItem(item, index) {
        const { showDates, showLabels } = this.config.timeline;
        
        // Classes de l'item
        const itemClasses = [
            'timeline-item',
            `timeline-item-${item.status || 'pending'}`,
            item.disabled && 'timeline-item-disabled'
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${itemClasses}" data-index="${index}">
                <div class="timeline-icon-wrapper">
                    <div class="timeline-icon">
                        ${item.icon || this.getDefaultTimelineIcon(item.status)}
                    </div>
                    ${(item.status === 'active' || item.status === 'current') ? 
                        '<div class="icon-pulse"></div>' : ''
                    }
                </div>
                <div class="timeline-content">
                    ${showLabels && item.label ? `
                        <div class="timeline-label">${this.escapeHtml(item.label)}</div>
                    ` : ''}
                    ${showDates && item.date ? `
                        <div class="timeline-date">${item.date}</div>
                    ` : ''}
                    ${item.description ? `
                        <div class="timeline-description">${this.escapeHtml(item.description)}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Icône par défaut selon le statut
     */
    getDefaultTimelineIcon(status) {
        const icons = {
            completed: '✓',
            active: '●',
            current: '●',
            pending: '○',
            disabled: '×',
            error: '!',
            warning: '⚠'
        };
        return icons[status] || '○';
    }
    
    /**
     * Rendu des sections
     */
    renderSections() {
        if (!this.config.sections || this.config.sections.length === 0) {
            return '<div class="detail-viewer-empty">Aucune donnée à afficher</div>';
        }
        
        return this.config.sections
            .filter(section => section.enabled !== false)
            .map(section => this.renderSection(section))
            .join('');
    }
    
    /**
     * Rendu d'une section
     */
    renderSection(section) {
        // Gestion du type 'list' pour les cards
        if (section.type === 'list' && section.items) {
            const sectionClasses = [
                'detail-viewer-section',
                section.className,
                section.collapsible && 'section-collapsible',
                section.collapsed && 'section-collapsed'
            ].filter(Boolean).join(' ');
            
            return `
                <div class="${sectionClasses}" data-section-id="${section.id}">
                    ${section.title ? `
                        <div class="section-header" ${section.collapsible ? 
                            `data-section-toggle="${section.id}"` : ''
                        }>
                            <h3 class="section-title">
                                ${section.icon ? `<span class="section-icon">${section.icon}</span>` : ''}
                                ${this.escapeHtml(section.title)}
                            </h3>
                        </div>
                    ` : ''}
                    
                    <div class="section-content">
                        <div class="section-cards-list" style="display: flex; flex-direction: column; gap: 12px;">
                            ${section.items.map(item => `
                                <div class="card-item" style="
                                    padding: 15px;
                                    background: ${item.highlight === 'success' ? '#f1f8e9' : 
                                                item.highlight === 'warning' ? '#fff3e0' : 
                                                '#f5f5f5'};
                                    border: 2px solid ${item.highlight === 'success' ? '#8bc34a' : 
                                                        item.highlight === 'warning' ? '#ff9800' : 
                                                        '#e0e0e0'};
                                    border-radius: 8px;
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: start;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: #2c3e50; font-size: 15px; margin-bottom: 8px;">
                                                ${item.title || ''}
                                                ${item.badges?.map(badge => `
                                                    <span style="
                                                        background: ${badge.color === 'warning' ? '#ff9800' : 
                                                                    badge.color === 'success' ? '#4caf50' : 
                                                                    badge.color === 'info' ? '#2196f3' : '#666'};
                                                        color: white;
                                                        padding: 2px 8px;
                                                        border-radius: 4px;
                                                        font-size: 12px;
                                                        margin-left: 8px;
                                                    ">${badge.text}</span>
                                                `).join('') || ''}
                                            </div>
                                            
                                            ${item.subtitle ? `
                                                <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
                                                    ${item.subtitle}
                                                </div>
                                            ` : ''}
                                            
                                            ${item.fields ? `
                                                <div style="display: grid; gap: 5px; font-size: 13px;">
                                                    ${item.fields.map(field => `
                                                        <div>
                                                            <span style="color: #999;">${field.label}:</span>
                                                            <strong>${field.value}</strong>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            ` : ''}
                                            
                                            ${item.statusBox ? `
                                                <div style="
                                                    margin-top: 10px;
                                                    padding: 10px;
                                                    background: ${item.statusBox.type === 'success' ? '#e8f5e9' : '#fff8e1'};
                                                    border-radius: 6px;
                                                    border-left: 4px solid ${item.statusBox.type === 'success' ? '#4caf50' : '#ff9800'};
                                                ">
                                                    <div style="display: flex; align-items: center; gap: 10px;">
                                                        <span style="font-size: 18px;">${item.statusBox.icon}</span>
                                                        <div>
                                                            <div style="font-size: 12px; color: #666;">
                                                                ${item.statusBox.label}
                                                            </div>
                                                            <div style="
                                                                font-family: monospace;
                                                                font-size: 14px;
                                                                font-weight: 600;
                                                                color: ${item.statusBox.type === 'success' ? '#2e7d32' : '#e65100'};
                                                            ">
                                                                ${item.statusBox.value}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                        
                                        ${item.sideContent ? `
                                            <div style="min-width: 60px; text-align: center;">
                                                ${item.sideContent}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Gestion du type 'custom' (pour l'historique)
        if (section.type === 'custom' && section.customContent) {
            const sectionClasses = [
                'detail-viewer-section',
                section.className,
                section.collapsible && 'section-collapsible',
                section.collapsed && 'section-collapsed'
            ].filter(Boolean).join(' ');
            
            return `
                <div class="${sectionClasses}" data-section-id="${section.id}">
                    ${section.title ? `
                        <div class="section-header" ${section.collapsible ? 
                            `data-section-toggle="${section.id}"` : ''
                        }>
                            <h3 class="section-title">
                                ${section.icon ? `<span class="section-icon">${section.icon}</span>` : ''}
                                ${this.escapeHtml(section.title)}
                            </h3>
                        </div>
                    ` : ''}
                    <div class="section-content">
                        ${section.customContent}
                    </div>
                </div>
            `;
        }
        
        // Gestion des sections normales avec fields (Client, Livraison, etc.)
        const visibleFields = (section.fields || []).filter(field => field.visible !== false);
        
        if (visibleFields.length === 0 && !section.customContent) {
            return '';
        }
        
        // Classes de la section
        const sectionClasses = [
            'detail-viewer-section',
            section.className,
            section.collapsible && 'section-collapsible',
            section.collapsed && 'section-collapsed'
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${sectionClasses}" data-section-id="${section.id}">
                ${section.title ? `
                    <div class="section-header" ${section.collapsible ? 
                        `data-section-toggle="${section.id}"` : ''
                    }>
                        <h3 class="section-title">
                            ${section.icon ? `<span class="section-icon">${section.icon}</span>` : ''}
                            ${this.escapeHtml(section.title)}
                        </h3>
                    </div>
                ` : ''}
                
                <div class="section-content">
                    ${section.customContent || ''}
                    ${visibleFields.length > 0 ? this.renderSectionFields(visibleFields, section) : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Rendu des champs d'une section
     */
    renderSectionFields(fields, section) {
        // Mode d'affichage
        const layout = section.layout || 'grid'; // 'grid' | 'list' | 'table'
        
        if (layout === 'table' && fields.length > 0) {
            return `
                <table class="section-table">
                    <tbody>
                        ${fields.map(field => `
                            <tr>
                                <td class="field-label">${this.escapeHtml(field.label)}</td>
                                <td class="field-value ${field.bold ? 'value-bold' : ''} ${field.className || ''}">
                                    ${this.getFieldValue(field)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        return `
            <div class="section-fields ${layout === 'list' ? 'fields-list' : 'fields-grid'}">
                ${fields.map(field => `
                    <div class="field-item ${field.className || ''}" ${field.fullWidth ? 'style="grid-column: 1 / -1;"' : ''}>
                        <span class="field-label">${this.escapeHtml(field.label)}</span>
                        <span class="field-value ${field.bold ? 'value-bold' : ''}">
                            ${this.getFieldValue(field)}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Obtenir la valeur d'un champ
     */
    getFieldValue(field) {
        // Valeur brute
        let value = field.value;
        
        // Si c'est une clé, extraire de data
        if (field.key && this.state.currentData) {
            value = this.getNestedValue(this.state.currentData, field.key);
        }
        
        // Valeur par défaut
        if (value === undefined || value === null || value === '') {
            return field.defaultValue || '-';
        }
        
        // Formatter si nécessaire
        if (field.formatter) {
            value = this.formatValue(value, field.formatter, field.formatterOptions);
        }
        
        // Si c'est du HTML, ne pas échapper
        if (field.html) {
            return value;
        }
        
        return this.escapeHtml(String(value));
    }
    
    /**
     * Extraire une valeur imbriquée
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    /**
     * Formater une valeur
     */
    formatValue(value, formatter, options = {}) {
        if (typeof formatter === 'function') {
            return formatter(value, options);
        }
        
        switch (formatter) {
            case 'currency':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: options.currency || 'EUR'
                }).format(value);
                
            case 'number':
                return new Intl.NumberFormat('fr-FR', options).format(value);
                
            case 'percent':
                return new Intl.NumberFormat('fr-FR', {
                    style: 'percent',
                    minimumFractionDigits: options.decimals || 0
                }).format(value / 100);
                
            case 'date':
                if (!value) return '-';
                const date = value instanceof Date ? value : new Date(value);
                return date.toLocaleDateString('fr-FR', options);
                
            case 'datetime':
                if (!value) return '-';
                const datetime = value instanceof Date ? value : new Date(value);
                return datetime.toLocaleString('fr-FR', options);
                
            case 'boolean':
                return value ? (options.trueText || 'Oui') : (options.falseText || 'Non');
                
            case 'badge':
                const badgeClass = options.class || 'badge-default';
                const badgeIcon = options.icon || '';
                return `<span class="badge ${badgeClass}">${badgeIcon} ${this.escapeHtml(String(value))}</span>`;
                
            default:
                return String(value);
        }
    }
    
    /**
     * Rendu des actions
     */
    renderActions() {
        if (!this.config.actions || this.config.actions.length === 0) {
            return '';
        }
        
        return this.config.actions.map((action, index) => {
            // Classes du bouton
            const btnClass = action.class || 
                            this.config.buttonClasses[action.style || 'secondary'] || 
                            this.config.buttonClasses.secondary;
            
            // Attributs
            const disabled = action.disabled ? 'disabled' : '';
            const dataAttrs = Object.entries(action.data || {})
                .map(([key, val]) => `data-${key}="${val}"`)
                .join(' ');
            
            return `
                <button class="${btnClass}" 
                        data-action-index="${index}"
                        ${disabled}
                        ${dataAttrs}>
                    ${action.icon ? `<span class="action-icon">${action.icon}</span>` : ''}
                    ${this.escapeHtml(action.label)}
                </button>
            `;
        }).join('');
    }
    
    /**
     * Gestion d'une action
     */
    handleAction(index) {
        const action = this.config.actions[index];
        if (!action) return;
        
        // Callback spécifique de l'action
        if (action.onClick) {
            action.onClick(this.state.currentData, this);
        }
        
        // Callback global
        if (this.config.onAction) {
            this.config.onAction(action, this.state.currentData, this);
        }
        
        // Ne fermer QUE si explicitement demandé
        if (action.closeOnClick === true) {
            this.close();
        }
    }
    
    /**
     * Basculer une section collapsible
     */
    toggleSection(sectionId) {
        const sectionEl = this.elements.modal.querySelector(`[data-section-id="${sectionId}"]`);
        if (sectionEl) {
            sectionEl.classList.toggle('section-collapsed');
        }
    }
    
    /**
     * Attache les événements
     */
    attachEvents() {
        // Fermeture par croix
        const closeBtn = this.elements.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Fermeture par overlay
        if (this.config.closeOnOverlay) {
            this.elements.overlay.addEventListener('click', (e) => {
                if (e.target === this.elements.overlay) {
                    this.close();
                }
            });
        }
        
        // Toggle sections collapsibles (délégation d'événements)
        this.elements.modal.addEventListener('click', (e) => {
            // Gestion des sections collapsibles
            const toggleTarget = e.target.closest('[data-section-toggle]');
            if (toggleTarget) {
                const sectionId = toggleTarget.dataset.sectionToggle;
                this.toggleSection(sectionId);
            }
            
            // Gestion des boutons d'action
            const actionBtn = e.target.closest('[data-action-index]');
            if (actionBtn) {
                const index = parseInt(actionBtn.dataset.actionIndex);
                this.handleAction(index);
            }
        });
        
        // Fermeture par Escape
        if (this.config.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.state.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('keydown', this.escapeHandler);
        }
    }
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget (transition opacity)
     */
    show() {
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Ouvre le modal
     */
    open() {
        if (this.state.isOpen) return;
        
        this.state.isOpen = true;
        if (this.elements.overlay) {
            this.elements.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // Callback
        if (this.config.onOpen) {
            this.config.onOpen(this.state.currentData, this);
        }
        
        // Scroll au top
        setTimeout(() => {
            if (this.elements.body) {
                this.elements.body.scrollTop = 0;
            }
        }, 100);
    }
    
    /**
     * Ferme le modal
     */
    close() {
        if (!this.state.isOpen) return;
        
        this.state.isOpen = false;
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Callback
        if (this.config.onClose) {
            this.config.onClose(this.state.currentData, this);
        }
        
        // Détruire après animation si configuré
        if (this.config.destroyOnClose) {
            setTimeout(() => this.destroy(), 300);
        }
    }
    
    /**
     * Met à jour les données
     */
    setData(newData) {
        this.state.currentData = { ...this.state.currentData, ...newData };
        this.refresh();
    }
    
    /**
     * Met à jour le contenu du modal sans le fermer ni le détruire
     * @param {object} newData - Nouvelles données à afficher
     */
    updateContent(newData) {
        // 1. Mettre à jour les données internes
        this.state.currentData = { ...this.state.currentData, ...newData };
        
        // 2. Mettre à jour la configuration si nécessaire
        if (newData) {
            // Mettre à jour le sous-titre si fourni
            if (newData.client) {
                this.config.subtitle = `${newData.client.prenom} ${newData.client.nom}`;
            }
        }
        
        // 3. Re-générer uniquement le contenu interne
        try {
            // Mettre à jour le sous-titre dans le header
            const subtitleEl = this.elements.modal.querySelector('.modal-subtitle');
            if (subtitleEl && this.config.subtitle) {
                subtitleEl.textContent = this.config.subtitle;
            }
            
            // Mettre à jour la timeline si elle existe
            if (this.config.timeline.enabled && this.elements.timelineContainer) {
                const timelineZone = this.elements.modal.querySelector('.detail-viewer-timeline-zone');
                if (timelineZone) {
                    timelineZone.innerHTML = this.renderTimeline();
                }
            }
            
            // Mettre à jour les sections
            const sectionsContainer = this.elements.modal.querySelector('.detail-viewer-sections');
            if (sectionsContainer) {
                sectionsContainer.innerHTML = this.renderSections();
            }
            
            // Mettre à jour les actions dans le footer
            const footerEl = this.elements.modal.querySelector('.modal-footer');
            if (footerEl && this.config.actions) {
                footerEl.innerHTML = this.renderActions();
            }
            
            // 4. Ré-attacher les événements sur les nouvelles sections/actions
            // (nécessaire car on a remplacé le HTML)
            this.reattachSectionEvents();
            
            console.log('✅ Contenu du modal mis à jour sans fermeture');
            
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du contenu:', error);
            // En cas d'erreur, fallback sur refresh complet
            this.refresh();
        }
    }

    /**
     * Ré-attache les événements après mise à jour du contenu
     * (nécessaire car innerHTML détruit les listeners)
     */
    reattachSectionEvents() {
        // Ré-attacher les événements de toggle pour les sections collapsibles
        const toggleButtons = this.elements.modal.querySelectorAll('[data-section-toggle]');
        toggleButtons.forEach(btn => {
            // Retirer l'ancien listener s'il existe
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Utiliser la délégation d'événements qui est déjà en place
        // (elle gère automatiquement les nouveaux éléments)
    }
    
    /**
     * Alias pour compatibilité
     * @deprecated Utiliser setData() à la place
     */
    update(newData) {
        console.warn('update() est déprécié, utiliser setData()');
        return this.setData(newData);
    }
    
    /**
     * Rafraîchit l'affichage
     */
    refresh() {
        // Sauvegarder l'état
        const wasOpen = this.state.isOpen;
        const scrollPos = this.elements.body ? this.elements.body.scrollTop : 0;
        
        // Re-render
        this.destroy(false); // Sans nettoyer les handlers
        this.render();
        this.attachEvents();
        
        // Restaurer l'état
        if (wasOpen) {
            this.open();
            if (this.elements.body) {
                this.elements.body.scrollTop = scrollPos;
            }
        }
    }
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy(cleanHandlers = true) {
        // Retirer les event listeners
        if (cleanHandlers && this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Retirer du DOM
        if (this.elements.overlay && this.elements.overlay.parentNode) {
            this.elements.overlay.parentNode.removeChild(this.elements.overlay);
        }
        
        // Réinitialiser état
        this.state = {
            isOpen: false,
            loaded: false,
            currentData: {}
        };
        
        // Réinitialiser éléments
        this.elements = {
            overlay: null,
            modal: null,
            body: null,
            timelineContainer: null,
            sectionsContainer: null,
            actionsContainer: null
        };
        
        console.log('🗑️ DetailViewerWidget détruit:', this.id);
    }
    
    /**
     * Helpers
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default DetailViewerWidget;