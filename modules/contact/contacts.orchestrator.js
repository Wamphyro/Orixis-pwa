// ========================================
// CONTACTS.ORCHESTRATOR.JS - ORCHESTRATEUR CENTRALISÉ
// Chemin: modules/contacts/contacts.orchestrator.js
// VERSION: 2.0.0
// ========================================

// Import des widgets centralisés
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import { ContactModalWidget } from '../../widgets/contact-modal/contact-modal.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ========================================
// DONNÉES DES CONTACTS
// ========================================
const CONTACTS_DATA = [
    {
        id: 'estelle-boulay',
        nom: 'Estelle Boulay',
        role: 'Assistante SAV Audio',
        email: 'boulay@BROKERAUDIOLOGIE88.onmicrosoft.com',
        telephone: '+33759578076',
        telephoneFormat: '07 59 57 80 76',
        avatar: '👩‍🦰',
        departement: 'SAV Audio',
        statut: 'disponible',
        specialites: ['Appareils auditifs', 'Support technique', 'Escalade niveau 2'],
        horaires: 'Lun-Ven: 9h-17h'
    },
    {
        id: 'marie-christine-douare',
        nom: 'Marie Christine Douare',
        role: 'Assistante SAV Audio',
        email: 'douare@BROKERAUDIOLOGIE88.onmicrosoft.com',
        telephone: '+33661761692',
        telephoneFormat: '06 61 76 16 92',
        avatar: '👩🏻‍🦱',
        departement: 'SAV Audio',
        statut: 'disponible',
        specialites: ['Maintenance', 'Formation', 'Support administratif'],
        horaires: 'Lun-Ven: 8h30-16h30'
    }
];

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================
class ContactsOrchestrator {
    constructor() {
        this.widgets = {};
        this.data = [];
        this.filteredData = [];
        this.currentFilters = {
            search: '',
            departement: '',
            statut: ''
        };
    }

    // ========================================
    // INITIALISATION
    // ========================================
    async init() {
        try {
            console.log('🚀 Initialisation Contacts Orchestrator...');
            
            // Vérifier authentification
            if (!this.checkAuth()) {
                window.location.href = '../../index.html';
                return;
            }

            // Charger les données
            await this.loadData();
            
            // Créer tous les widgets
            this.createHeader();
            this.createStats();
            this.createFilters();
            this.createGrid();
            
            // Initialiser les événements
            this.initEvents();
            
            // Appliquer les filtres initiaux
            this.applyFilters();
            
            toast.success('✅ Contacts chargés avec succès');
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            toast.error('Erreur lors du chargement');
        }
    }

    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) return false;
        
        const authData = JSON.parse(auth);
        const now = Date.now();
        
        if (now - authData.timestamp > authData.expiry) {
            localStorage.removeItem('sav_auth');
            return false;
        }
        
        return authData.authenticated;
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    async loadData() {
        // Simuler un chargement async
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Charger les données
        this.data = [...CONTACTS_DATA];
        this.filteredData = [...this.data];
        
        console.log(`📊 ${this.data.length} contacts chargés`);
    }

    // ========================================
    // CRÉATION DES WIDGETS
    // ========================================
    createHeader() {
        this.widgets.header = new HeaderWidget({
            // Style
            pageBackground: 'colorful',
            theme: 'gradient',
            
            // Contenu
            title: '📞 Contacts SAV Audio',
            subtitle: 'Assistance technique et support',
            centerTitle: true,
            
            // Navigation
            showBack: true,
            backText: 'Retour',
            onBack: () => window.location.href = '../home/home.html',
            
            // Recherche
            showSearch: true,
            searchPlaceholder: 'Rechercher un contact...',
            onSearch: (query) => {
                this.currentFilters.search = query;
                this.applyFilters();
            },
            
            // Actions rapides
            showQuickActions: true,
            quickActions: [
                {
                    id: 'add',
                    title: 'Nouveau contact',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
                    onClick: () => this.addContact()
                },
                {
                    id: 'export',
                    title: 'Exporter',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
                    onClick: () => this.exportContacts()
                },
                {
                    id: 'refresh',
                    title: 'Actualiser',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M21 10l-7.5-7.5"/></svg>',
                    onClick: () => location.reload()
                }
            ],
            
            // Indicateurs
            showIndicators: true,
            indicators: [
                { id: 'status', text: 'Connecté', type: 'success', animated: true },
                { id: 'count', text: `${this.data.length} contacts`, type: 'info' }
            ],
            
            // Breadcrumbs
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: '../home/home.html' },
                { text: 'Support' },
                { text: 'Contacts SAV' }
            ],
            
            // User
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
    }

    createStats() {
        this.widgets.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            size: 'md',
            cards: [
                { 
                    id: 'total', 
                    label: 'Total contacts', 
                    icon: '👥', 
                    value: this.data.length, 
                    color: 'primary' 
                },
                { 
                    id: 'disponibles', 
                    label: 'Disponibles', 
                    icon: '🟢', 
                    value: this.data.filter(c => c.statut === 'disponible').length, 
                    color: 'success' 
                },
                { 
                    id: 'sav', 
                    label: 'SAV Audio', 
                    icon: '🎧', 
                    value: this.data.filter(c => c.departement === 'SAV Audio').length, 
                    color: 'info' 
                },
                { 
                    id: 'urgence', 
                    label: 'Urgence', 
                    icon: '🚨', 
                    value: '24/7', 
                    color: 'danger' 
                }
            ],
            onSelect: (ids) => {
                console.log('Stats sélectionnées:', ids);
            }
        });
    }

    createFilters() {
        // Extraire les spécialités uniques
        const specialites = new Set();
        this.data.forEach(c => c.specialites.forEach(s => specialites.add(s)));

        this.widgets.filters = new SearchFiltersWidget({
            container: '.filters-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: 'Filtres',
            filters: [
                {
                    type: 'select',
                    key: 'departement',
                    label: 'Département',
                    options: [
                        { value: '', label: 'Tous' },
                        { value: 'SAV Audio', label: 'SAV Audio' }
                    ]
                },
                {
                    type: 'select',
                    key: 'statut',
                    label: 'Statut',
                    options: [
                        { value: '', label: 'Tous' },
                        { value: 'disponible', label: '🟢 Disponible' },
                        { value: 'occupe', label: '🔴 Occupé' },
                        { value: 'absent', label: '⚫ Absent' }
                    ]
                },
                {
                    type: 'select',
                    key: 'specialite',
                    label: 'Spécialité',
                    options: [
                        { value: '', label: 'Toutes' },
                        ...Array.from(specialites).map(s => ({ value: s, label: s }))
                    ]
                }
            ],
            onFilter: (values) => {
                Object.assign(this.currentFilters, values);
                this.applyFilters();
            }
        });
    }

    createGrid() {
        this.widgets.grid = new DataGridWidget({
            container: '.grid-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: '',
            columns: [
                {
                    key: 'avatar',
                    label: '',
                    width: 50,
                    formatter: (v) => `<span style="font-size: 28px;">${v}</span>`
                },
                {
                    key: 'nom',
                    label: 'Nom',
                    sortable: true,
                    width: 200,
                    formatter: (v, row) => `
                        <div>
                            <strong style="color: #2c3e50;">${v}</strong>
                            <br>
                            <small style="color: #7f8c8d;">${row.role}</small>
                        </div>
                    `
                },
                {
                    key: 'departement',
                    label: 'Département',
                    width: 120
                },
                {
                    key: 'email',
                    label: 'Email',
                    width: 280,
                    formatter: (v) => `<a href="mailto:${v}" style="color: #667eea;">${v}</a>`
                },
                {
                    key: 'telephoneFormat',
                    label: 'Téléphone',
                    width: 140,
                    formatter: (v, row) => `
                        <a href="tel:${row.telephone}" style="color: #667eea;">
                            ${v}
                        </a>
                    `
                },
                {
                    key: 'horaires',
                    label: 'Horaires',
                    width: 130
                },
                {
                    key: 'statut',
                    label: 'Statut',
                    width: 100,
                    formatter: (v) => {
                        const statuts = {
                            disponible: '<span class="badge badge-success">🟢 Disponible</span>',
                            occupe: '<span class="badge badge-danger">🔴 Occupé</span>',
                            absent: '<span class="badge badge-secondary">⚫ Absent</span>'
                        };
                        return statuts[v] || v;
                    }
                },
                {
                    type: 'actions',
                    label: 'Actions',
                    width: 150,
                    actions: [
                        {
                            type: 'custom',
                            icon: '📧',
                            title: 'Email',
                            onClick: (row) => this.sendEmail(row)
                        },
                        {
                            type: 'custom',
                            icon: '📞',
                            title: 'Appeler',
                            onClick: (row) => this.call(row)
                        },
                        {
                            type: 'custom',
                            icon: '💬',
                            title: 'Teams',
                            onClick: (row) => this.openTeams(row)
                        },
                        {
                            type: 'view',
                            title: 'Détails',
                            onClick: (row) => this.showDetails(row)
                        }
                    ]
                }
            ],
            data: [],
            features: {
                sort: true,
                export: true,
                pagination: true
            },
            pagination: {
                itemsPerPage: 10,
                pageSizeOptions: [10, 20, 50]
            }
        });
    }

    // ========================================
    // FILTRAGE
    // ========================================
    applyFilters() {
        this.filteredData = this.data.filter(contact => {
            // Recherche
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const searchIn = [
                    contact.nom,
                    contact.role,
                    contact.email,
                    contact.telephoneFormat,
                    contact.departement,
                    ...contact.specialites
                ].join(' ').toLowerCase();
                
                if (!searchIn.includes(search)) return false;
            }
            
            // Département
            if (this.currentFilters.departement && 
                contact.departement !== this.currentFilters.departement) {
                return false;
            }
            
            // Statut
            if (this.currentFilters.statut && 
                contact.statut !== this.currentFilters.statut) {
                return false;
            }
            
            // Spécialité
            if (this.currentFilters.specialite && 
                !contact.specialites.includes(this.currentFilters.specialite)) {
                return false;
            }
            
            return true;
        });
        
        // Mettre à jour le grid
        if (this.widgets.grid) {
            this.widgets.grid.setData(this.filteredData);
        }
        
        // Mettre à jour le compteur
        if (this.widgets.header) {
            this.widgets.header.updateIndicator('count', `${this.filteredData.length} contacts`);
        }
    }

    // ========================================
    // ACTIONS
    // ========================================
    sendEmail(contact) {
        // Ouvrir le modal d'email existant
        const modal = new ContactModalWidget({
            name: contact.nom,
            email: contact.email,
            avatar: contact.avatar
        });
        modal.open();
    }

    call(contact) {
        // Copier le numéro
        navigator.clipboard.writeText(contact.telephone);
        toast.success(`📞 Numéro copié: ${contact.telephoneFormat}`);
        
        // Sur mobile, ouvrir l'app téléphone
        if (/Android|iPhone/i.test(navigator.userAgent)) {
            window.location.href = `tel:${contact.telephone}`;
        }
    }

    openTeams(contact) {
        const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=${contact.email}`;
        window.open(teamsUrl, '_blank');
        toast.info('💬 Ouverture de Teams...');
    }

    showDetails(contact) {
        const viewer = new DetailViewerWidget({
            title: contact.nom,
            subtitle: contact.role,
            data: contact,
            sections: [
                {
                    id: 'general',
                    title: '👤 Informations',
                    fields: [
                        { label: 'Nom', value: contact.nom, bold: true },
                        { label: 'Rôle', value: contact.role },
                        { label: 'Département', value: contact.departement },
                        { label: 'Horaires', value: contact.horaires }
                    ]
                },
                {
                    id: 'contact',
                    title: '📞 Contact',
                    fields: [
                        { label: 'Email', value: contact.email },
                        { label: 'Téléphone', value: contact.telephoneFormat }
                    ]
                },
                {
                    id: 'specialites',
                    title: '🎯 Spécialités',
                    fields: [
                        { 
                            label: 'Domaines', 
                            value: contact.specialites.join(', ')
                        }
                    ]
                }
            ],
            actions: [
                {
                    label: '📧 Email',
                    class: 'btn btn-glass-blue btn-lg',
                    onClick: () => {
                        this.sendEmail(contact);
                        return false;
                    }
                },
                {
                    label: '📞 Appeler',
                    class: 'btn btn-glass-green btn-lg',
                    onClick: () => {
                        this.call(contact);
                        return false;
                    }
                }
            ]
        });
    }

    addContact() {
        toast.info('📝 Fonctionnalité d\'ajout à venir');
    }

    exportContacts() {
        if (this.widgets.grid) {
            this.widgets.grid.export('excel');
            toast.success('📊 Export réussi');
        }
    }

    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    initEvents() {
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('.search-input')?.focus();
            }
        });
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================
const orchestrator = new ContactsOrchestrator();
export default orchestrator;