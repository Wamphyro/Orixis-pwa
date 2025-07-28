/* ========================================
   CLIENTS.LIST.JS - Gestion du tableau clients
   Chemin: src/js/pages/clients/clients.list.js
   
   DESCRIPTION:
   Gère l'affichage et les interactions du tableau des clients
   en utilisant le composant Table avec glassmorphism.
   
   STRUCTURE:
   1. Import et configuration (lignes 20-60)
   2. Initialisation du tableau (lignes 61-150)
   3. Mise à jour des données (lignes 151-200)
   4. Formatters de cellules (lignes 201-300)
   5. Gestion des actions (lignes 301-400)
   
   DÉPENDANCES:
   - table.component.js (composant table)
   - pagination.component.js (pagination)
   ======================================== */

// ========================================
// IMPORTS
// ========================================
import TableComponent from '../../shared/ui/data-display/table.component.js';
import PaginationComponent from '../../shared/ui/navigation/pagination.component.js';

// ========================================
// VARIABLES
// ========================================
let tableInstance = null;
let paginationInstance = null;
let actionCallback = null;
let currentPage = 1;
let pageSize = 20;

// ========================================
// INITIALISATION
// ========================================
export function initClientsTable(onAction) {
    console.log('📊 Initialisation du tableau clients...');
    
    actionCallback = onAction;
    
    const container = document.getElementById('clientsTableContainer');
    if (!container) {
        console.error('❌ Container clientsTableContainer introuvable');
        return;
    }
    
    // Configuration des colonnes
    const columns = [
        {
            key: 'nom',
            label: 'Nom',
            type: 'text',
            sortable: true,
            searchable: true,
            width: '150px',
            render: (value, row) => {
                return `<strong>${value}</strong>`;
            }
        },
        {
            key: 'prenom',
            label: 'Prénom',
            type: 'text',
            sortable: true,
            searchable: true,
            width: '150px'
        },
        {
            key: 'telephone',
            label: 'Téléphone',
            type: 'phone',
            sortable: true,
            searchable: true,
            width: '130px',
            render: formatPhone
        },
        {
            key: 'email',
            label: 'Email',
            type: 'email',
            sortable: true,
            searchable: true,
            render: (value) => {
                if (!value) return '<span style="opacity: 0.5">-</span>';
                return `<a href="mailto:${value}" class="table-email">${value}</a>`;
            }
        },
        {
            key: 'magasinReference',
            label: 'Magasin',
            type: 'text',
            sortable: true,
            searchable: true,
            width: '120px',
            render: (value) => {
                return `<span class="badge-magasin">${value}</span>`;
            }
        },
        {
            key: 'actif',
            label: 'Statut',
            type: 'status',
            sortable: true,
            width: '100px',
            render: formatStatus
        },
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions',
            width: '100px',
            sticky: 'right',
            actions: [
                {
                    icon: '👁️',
                    text: 'Détails',
                    tooltip: 'Voir les détails',
                    handler: (row) => handleAction('detail', row),
                    className: 'btn-detail'
                }
            ]
        }
    ];
    
    // Créer le tableau
    tableInstance = TableComponent.create({
        columns,
        data: [],
        style: 'glassmorphism',
        animation: 'smooth',
        type: 'standard',
        features: {
            sort: {
                enabled: true,
                multi: false,
                defaultDirection: 'asc'
            },
            search: {
                enabled: false // Géré par nos filtres custom
            },
            pagination: {
                enabled: false // On utilise notre propre pagination
            },
            selection: {
                enabled: false
            },
            rows: {
                hover: true,
                striped: false,
                height: 'comfortable'
            }
        },
        onRowClick: (row) => {
            handleAction('detail', row);
        }
    });
    
    // Ajouter le tableau au container
    container.innerHTML = '';
    container.appendChild(tableInstance.element);
    
    // Ajouter la pagination
    createPagination(container);
    
    console.log('✅ Tableau clients initialisé');
}

// ========================================
// MISE À JOUR DES DONNÉES
// ========================================
window.updateClientsTable = function(clients) {
    if (!tableInstance) {
        console.error('❌ Instance du tableau non initialisée');
        return;
    }
    
    console.log(`🔄 Mise à jour du tableau avec ${clients.length} clients`);
    
    // Paginer les données
    const totalPages = Math.ceil(clients.length / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = clients.slice(start, end);
    
    // Mettre à jour le tableau
    tableInstance.update({
        data: paginatedData,
        totalItems: clients.length
    });
    
    // Mettre à jour la pagination
    if (paginationInstance) {
        paginationInstance.update({
            currentPage,
            totalPages,
            totalItems: clients.length
        });
    }
    
    // Si aucun client
    if (clients.length === 0) {
        showEmptyState();
    }
}

// ========================================
// FORMATTERS
// ========================================
function formatPhone(value) {
    if (!value) return '<span style="opacity: 0.5">-</span>';
    
    // Formater le numéro de téléphone
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
        const formatted = cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        return `<a href="tel:${value}" class="table-phone">${formatted}</a>`;
    }
    
    return `<a href="tel:${value}" class="table-phone">${value}</a>`;
}

function formatStatus(value, row) {
    const isActive = value !== false;
    const statusClass = isActive ? 'active' : 'inactive';
    const statusText = isActive ? 'Actif' : 'Inactif';
    
    return `<span class="client-status ${statusClass}">${statusText}</span>`;
}

// ========================================
// PAGINATION
// ========================================
function createPagination(container) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'clients-pagination';
    paginationContainer.style.marginTop = '24px';
    
    paginationInstance = PaginationComponent.create({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: pageSize,
        style: 'glassmorphism',
        type: 'advanced',
        size: 'medium',
        position: 'center',
        animation: 'smooth',
        pageSizeOptions: [10, 20, 50, 100],
        callbacks: {
            onPageChange: (newPage) => {
                currentPage = newPage;
                updateTable();
            },
            onPageSizeChange: (newSize) => {
                pageSize = newSize;
                currentPage = 1;
                updateTable();
            }
        }
    });
    
    paginationContainer.appendChild(paginationInstance.element);
    container.appendChild(paginationContainer);
}

function updateTable() {
    // Cette fonction sera appelée depuis main
    if (window.filteredClients) {
        window.updateClientsTable(window.filteredClients);
    }
}

// ========================================
// GESTION DES ACTIONS
// ========================================
function handleAction(action, row) {
    console.log('🎯 Action tableau:', action, row);
    
    if (actionCallback) {
        actionCallback(action, row.id);
    }
}

// ========================================
// EMPTY STATE
// ========================================
function showEmptyState() {
    const container = document.getElementById('clientsTableContainer');
    
    container.innerHTML = `
        <div class="clients-empty">
            <div class="clients-empty-icon">👥</div>
            <div class="clients-empty-text">Aucun client trouvé</div>
            <p style="opacity: 0.7">Commencez par créer un nouveau client</p>
            <button class="btn btn-primary" onclick="ouvrirNouveauClient()">
                ➕ Nouveau client
            </button>
        </div>
    `;
}

// ========================================
// EXPORT
// ========================================
export function getSelectedClients() {
    if (!tableInstance) return [];
    return tableInstance.getSelectedData();
}

export function refreshTable() {
    if (tableInstance) {
        tableInstance.refresh();
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-28] - Pagination custom avec TableComponent
   Solution: Désactiver pagination interne, créer externe
   
   [2024-01-28] - Actions dans le tableau
   Solution: Callback pattern pour remonter les events
   
   NOTES POUR REPRISES FUTURES:
   - La pagination est externe au composant Table
   - Les actions utilisent un système de callback
   - Le formatage des téléphones est basique
   ======================================== */