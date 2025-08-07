📊 DataGridWidget - Documentation
Widget de tableau de données autonome avec tri, pagination, export, sélection et actions configurables.
🚀 Installation
javascriptimport { DataGridWidget } from '/widgets/data-grid/data-grid.widget.js';
📝 Utilisation basique
javascriptconst grid = new DataGridWidget({
    container: '.table-container',
    columns: [
        { key: 'name', label: 'Nom' },
        { key: 'email', label: 'Email' }
    ],
    data: [
        { name: 'Jean Dupont', email: 'jean@example.com' },
        { name: 'Marie Martin', email: 'marie@example.com' }
    ]
});
⚙️ Configuration complète
Options principales
OptionTypeDéfautDescriptioncontainerstring|ElementnullContainer cible (requis)dataArray[]Données à affichercolumnsArray[]Configuration des colonnesshowWrapperbooleanfalseAfficher un container englobantwrapperStylestring'card'Style du wrapper ('card', 'minimal', 'bordered')wrapperTitlestring''Titre du wrapperwrapperClassstring''Classes CSS additionnelles
Configuration des colonnes
javascriptcolumns: [
    {
        key: 'name',              // Clé dans les données
        label: 'Nom',             // Label affiché
        
        // Tri et resize
        sortable: true,           // Colonne triable
        sortFunction: null,       // Fonction de tri custom
        resizable: true,          // Colonne redimensionnable
        width: 200,               // Largeur initiale (px)
        
        // Alignement
        align: 'left',            // left|center|right
        className: 'custom-class', // Classes CSS
        
        // Formatage
        formatter: (value, row) => {
            return `<strong>${value}</strong>`;
        },
        
        // Export
        exportable: true,         // Inclure dans l'export
        exportLabel: 'Name',      // Label pour l'export
        exportFormatter: null     // Formatter pour l'export
    },
    
    // Colonne d'actions spéciale
    {
        type: 'actions',          // Type spécial
        label: 'Actions',
        align: 'center',          // Center par défaut
        width: 100,
        actions: [
            {
                type: 'view',     // view|edit|delete|custom
                title: 'Voir',    // Tooltip
                size: '',         // btn-sm|btn-lg
                disabled: false,
                onClick: (row, index, button) => {
                    console.log('View:', row);
                }
            }
        ]
    }
]
Types d'actions prédéfinies
TypeIcôneCouleurDescriptionview👁️VertVisualiseredit✏️BleuModifierdelete🗑️RougeSupprimerdownload⬇️GrisTéléchargershare🔗CyanPartagerduplicate📋VioletDupliquerarchive📁OrangeArchiver
Fonctionnalités (features)
javascriptfeatures: {
    sort: true,          // Activer le tri
    resize: true,        // Redimensionnement colonnes
    export: true,        // Boutons d'export
    selection: false,    // Checkboxes de sélection
    pagination: true     // Pagination
}
Pagination
javascriptpagination: {
    enabled: true,                           // Activer/désactiver
    itemsPerPage: 10,                       // Éléments par page
    pageSizeOptions: [10, 20, 50, 100],    // Options de taille
    showFirstLast: true,                    // Boutons première/dernière
    showPageInfo: true,                     // Afficher "X-Y sur Z"
    alwaysShowSizeSelector: true           // Toujours afficher le sélecteur
}
Export
javascriptexport: {
    csv: true,                              // Export CSV
    excel: true,                            // Export Excel
    filename: 'export',                     // Nom du fichier
    onBeforeExport: (data) => {            // Transformation avant export
        return data.map(row => ({
            ...row,
            date: formatDate(row.date)
        }));
    }
}
Styles du tableau
javascriptstyles: {
    useGradientHeader: true,                // Header avec gradient
    striped: true,                          // Lignes alternées
    hover: true,                            // Hover sur lignes
    bordered: false                         // Bordures
}
Messages
javascriptmessages: {
    noData: 'Aucune donnée disponible',
    loading: 'Chargement...',
    itemsPerPage: 'Lignes',
    page: 'Page',
    of: 'sur',
    items: 'éléments',
    selectedItems: 'éléments sélectionnés'
}
Callbacks
javascript{
    onRowClick: (row, index, event) => {
        console.log('Ligne cliquée:', row);
    },
    
    onAction: (type, row, index) => {
        console.log(`Action ${type} sur ligne ${index}`);
    },
    
    onSort: (column, direction) => {
        console.log(`Tri ${column} ${direction}`);
    },
    
    onPageChange: (page) => {
        console.log('Page:', page);
    },
    
    onSelectionChange: (selectedRows) => {
        console.log('Sélection:', selectedRows);
    },
    
    onExport: (format, data) => {
        console.log(`Export ${format}:`, data.length, 'lignes');
    }
}
📌 API Publique
Méthodes principales
javascript// Données
grid.setData(data);                        // Définir les données
grid.refresh();                            // Rafraîchir l'affichage
grid.getState();                          // Obtenir l'état complet

// Pagination
grid.goToPage(2);                         // Aller à une page
grid.changePageSize(50);                  // Changer taille de page

// Tri
grid.sort('name');                        // Trier par colonne

// Sélection
grid.getSelectedRows();                   // Obtenir lignes sélectionnées
grid.clearSelection();                    // Effacer la sélection

// Export
grid.export('csv');                       // Export CSV
grid.export('excel');                     // Export Excel

// Affichage
grid.show();                              // Afficher
grid.hide();                              // Masquer

// Nettoyage
grid.destroy();                           // Destruction complète
Propriétés
javascriptgrid.id           // ID unique du widget
grid.state        // État interne (data, currentPage, sortColumn...)
grid.config       // Configuration
grid.elements     // Références DOM
💡 Exemples complets
Tableau complet avec toutes les fonctionnalités
javascriptconst grid = new DataGridWidget({
    container: '.table-container',
    showWrapper: true,
    wrapperStyle: 'card',
    wrapperTitle: 'Liste des commandes',
    
    columns: [
        { 
            key: 'date', 
            label: 'Date', 
            sortable: true,
            formatter: (v) => new Date(v).toLocaleDateString('fr-FR')
        },
        { 
            key: 'client', 
            label: 'Client', 
            sortable: true,
            resizable: true,
            width: 200 
        },
        { 
            key: 'montant', 
            label: 'Montant', 
            align: 'right',
            sortable: true,
            formatter: (v) => `${v.toFixed(2)} €`,
            sortFunction: (a, b, dir) => {
                return dir === 'asc' ? a - b : b - a;
            }
        },
        { 
            key: 'statut', 
            label: 'Statut',
            align: 'center',
            formatter: (v) => {
                const badges = {
                    'pending': 'badge-warning',
                    'completed': 'badge-success',
                    'cancelled': 'badge-danger'
                };
                return `<span class="badge ${badges[v]}">${v}</span>`;
            }
        },
        { 
            type: 'actions',
            label: 'Actions',
            width: 120,
            actions: [
                { 
                    type: 'view',
                    onClick: (row) => showDetails(row.id)
                },
                { 
                    type: 'edit',
                    onClick: (row) => editOrder(row.id)
                },
                { 
                    type: 'delete',
                    onClick: (row) => {
                        if (confirm('Supprimer ?')) {
                            deleteOrder(row.id);
                        }
                    }
                }
            ]
        }
    ],
    
    data: ordersData,
    
    features: {
        sort: true,
        resize: true,
        export: true,
        selection: true,
        pagination: true
    },
    
    pagination: {
        itemsPerPage: 20,
        pageSizeOptions: [10, 20, 50, 100]
    },
    
    onRowClick: (row) => {
        console.log('Commande sélectionnée:', row);
    }
});
Tableau simple sans pagination
javascriptconst simpleGrid = new DataGridWidget({
    container: '.simple-table',
    columns: [
        { key: 'name', label: 'Nom' },
        { key: 'value', label: 'Valeur', align: 'right' }
    ],
    data: simpleData,
    features: {
        pagination: false,
        sort: false,
        export: false
    }
});
Avec sélection multiple
javascriptconst selectableGrid = new DataGridWidget({
    container: '.selectable-table',
    columns: [...],
    data: [...],
    features: {
        selection: true
    },
    onSelectionChange: (selected) => {
        document.querySelector('.selected-count').textContent = 
            `${selected.length} éléments sélectionnés`;
        
        // Activer/désactiver boutons d'action
        document.querySelector('.btn-delete-selected')
            .disabled = selected.length === 0;
    }
});

// Utilisation
const selected = selectableGrid.getSelectedRows();
Ajout de boutons personnalisés dans le header
javascript// Après création du widget
setTimeout(() => {
    const actionsZone = document.querySelector('.data-grid-export-buttons');
    if (actionsZone) {
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-success btn-sm';
        addButton.innerHTML = '➕ Ajouter';
        addButton.onclick = () => openAddModal();
        actionsZone.appendChild(addButton);
    }
}, 100);
🎨 Personnalisation CSS
Variables CSS
css/* Override dans votre CSS */
:root {
    --grid-header-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --grid-border: #e9ecef;
    --grid-hover: #f8f9fa;
    --grid-selected: rgba(102, 126, 234, 0.1);
}
Classes utilitaires fournies
css.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.font-bold { font-weight: 600; }
.text-muted { color: #6c757d; }
.text-danger { color: #dc3545; }
.text-success { color: #28a745; }
📦 Structure des fichiers
/widgets/data-grid/
├── data-grid.widget.js    # Logique du widget (tout intégré)
├── data-grid.widget.css   # Styles (auto-chargé)
└── README.md              # Cette documentation
⚠️ Notes importantes

CSS autonome : Importe automatiquement buttons.css pour les styles de boutons
Anti-FOUC : Utilise opacity transition pour éviter le flash
Destruction : Toujours appeler destroy() pour éviter les fuites mémoire
Export : Les colonnes d'actions sont automatiquement exclues
Resize : Désactivé sur mobile pour une meilleure UX
Données imbriquées : Utiliser la notation pointée (user.address.city)

🔄 Cycle de vie
new DataGridWidget()
    ↓
loadCSS()
    ↓
init()
    ├── setupContainer()
    ├── initState()
    ├── render()
    ├── attachEvents()
    └── showWithDelay()
    ↓
setData() [si données fournies]
    ↓
[Interactions utilisateur]
    ├── sort()
    ├── goToPage()
    ├── export()
    └── handleActionClick()
    ↓
destroy() [nettoyage]

Version : 1.1.0
Auteur : Assistant Claude
Date : 08/02/2025
Dépendances : buttons.css (auto-importé)