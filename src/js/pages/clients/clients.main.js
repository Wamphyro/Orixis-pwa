/* ========================================
   CLIENTS.MAIN.JS - Point d'entrée page clients
   Chemin: src/js/pages/clients/clients.main.js
   
   DESCRIPTION:
   Coordonne tous les modules de la page clients et gère
   l'initialisation générale.
   
   STRUCTURE:
   1. Imports et configuration (lignes 20-50)
   2. Initialisation (lignes 51-150)
   3. Gestion des modales (lignes 151-250)
   4. Event handlers globaux (lignes 251-350)
   
   DÉPENDANCES:
   - clients.list.js (gestion tableau)
   - clients.filters.js (gestion filtres)
   - clients.stats.js (statistiques)
   - services/clients.service.js (API)
   ======================================== */

// ========================================
// IMPORTS
// ========================================
import { ClientsService } from '../../services/clients.service.js';
import { initClientsTable } from './clients.list.js';
import { initClientsFilters } from './clients.filters.js';
import { updateClientsStats } from './clients.stats.js';
import { db } from '../../services/firebase.service.js';

// ========================================
// VARIABLES GLOBALES
// ========================================
let allClients = [];
let filteredClients = [];
let isLoading = false;
let currentFilters = {
    search: '',
    magasin: '',
    statut: '',
    dateDebut: null,
    dateFin: null
};

// ========================================
// INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation page clients...');
    
    try {
        // Vérifier l'authentification
        if (!checkAuth()) {
            window.location.href = '../index.html';
            return;
        }
        
        // Afficher le nom d'utilisateur
        displayUserInfo();
        
        // Charger les magasins pour les selects
        await loadMagasins();
        
        // Initialiser les composants
        initClientsFilters(handleFiltersChange);
        initClientsTable(handleTableActions);
        
        // Charger les clients
        await loadClients();
        
        // Event listeners pour les modales
        setupModalListeners();
        
        console.log('✅ Page clients initialisée');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showError('Erreur lors du chargement de la page');
    }
});

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================
async function loadClients() {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);
    
    try {
        // Charger tous les clients
        allClients = await ClientsService.chargerTousLesClients();
        console.log(`📊 ${allClients.length} clients chargés`);
        
        // Appliquer les filtres
        applyFilters();
        
        // Mettre à jour les stats
        updateClientsStats(allClients, filteredClients);
        
    } catch (error) {
        console.error('❌ Erreur chargement clients:', error);
        showError('Impossible de charger les clients');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// ========================================
// GESTION DES FILTRES
// ========================================
function handleFiltersChange(filters) {
    console.log('🔍 Changement de filtres:', filters);
    currentFilters = { ...currentFilters, ...filters };
    applyFilters();
}

function applyFilters() {
    filteredClients = allClients.filter(client => {
        // Filtre recherche
        if (currentFilters.search) {
            const search = currentFilters.search.toLowerCase();
            const nomComplet = `${client.prenom} ${client.nom}`.toLowerCase();
            const match = nomComplet.includes(search) ||
                         client.telephone?.includes(search) ||
                         client.email?.toLowerCase().includes(search);
            if (!match) return false;
        }
        
        // Filtre magasin
        if (currentFilters.magasin && currentFilters.magasin !== 'tous') {
            if (client.magasinReference !== currentFilters.magasin) return false;
        }
        
        // Filtre statut
        if (currentFilters.statut && currentFilters.statut !== 'tous') {
            const isActive = client.actif !== false;
            if (currentFilters.statut === 'actif' && !isActive) return false;
            if (currentFilters.statut === 'inactif' && isActive) return false;
        }
        
        // Filtre date
        if (currentFilters.dateDebut || currentFilters.dateFin) {
            const dateCreation = client.dateCreation?.toDate ? client.dateCreation.toDate() : new Date(client.dateCreation);
            if (currentFilters.dateDebut && dateCreation < new Date(currentFilters.dateDebut)) return false;
            if (currentFilters.dateFin && dateCreation > new Date(currentFilters.dateFin)) return false;
        }
        
        return true;
    });
    
    console.log(`✅ ${filteredClients.length} clients après filtrage`);
    
    // Mettre à jour le tableau
    updateTable();
    
    // Mettre à jour les stats
    updateClientsStats(allClients, filteredClients);
}

// ========================================
// ACTIONS DU TABLEAU
// ========================================
function handleTableActions(action, clientId) {
    console.log('🎯 Action tableau:', action, clientId);
    
    switch (action) {
        case 'detail':
            afficherDetailClient(clientId);
            break;
        case 'edit':
            // TODO: Implémenter l'édition
            break;
        case 'delete':
            // TODO: Implémenter la suppression
            break;
    }
}

// ========================================
// GESTION DES MODALES
// ========================================
window.ouvrirNouveauClient = function() {
    const modal = document.getElementById('modalNouveauClient');
    modal.style.display = 'flex';
    document.getElementById('formNouveauClient').reset();
}

window.fermerModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

window.creerNouveauClient = async function() {
    const form = document.getElementById('formNouveauClient');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const clientData = {
        nom: document.getElementById('newClientNom').value,
        prenom: document.getElementById('newClientPrenom').value,
        telephone: document.getElementById('newClientTel').value,
        email: document.getElementById('newClientEmail').value || null,
        magasinReference: document.getElementById('newClientMagasin').value
    };
    
    try {
        showLoading(true);
        
        // Vérifier les doublons
        const doublon = await ClientsService.verifierDoublon({
            nom: clientData.nom,
            prenom: clientData.prenom,
            telephone: clientData.telephone
        });
        
        if (doublon) {
            if (!confirm(`Un client ${doublon.prenom} ${doublon.nom} existe déjà. Créer quand même ?`)) {
                return;
            }
        }
        
        // Créer le client
        const clientId = await ClientsService.creerClient(clientData);
        console.log('✅ Client créé:', clientId);
        
        // Recharger la liste
        await loadClients();
        
        // Fermer la modale
        fermerModal('modalNouveauClient');
        
        showSuccess('Client créé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur création client:', error);
        showError('Erreur lors de la création du client');
    } finally {
        showLoading(false);
    }
}

function afficherDetailClient(clientId) {
    // Pour l'instant, juste ouvrir la modale placeholder
    const modal = document.getElementById('modalDetailClient');
    modal.style.display = 'flex';
}

// ========================================
// EXPORT DE DONNÉES
// ========================================
window.exporterClients = function() {
    const data = filteredClients.map(client => ({
        Nom: client.nom,
        Prénom: client.prenom,
        Téléphone: client.telephone || '',
        Email: client.email || '',
        Magasin: client.magasinReference,
        Statut: client.actif !== false ? 'Actif' : 'Inactif',
        'Date création': new Date(client.dateCreation?.toDate ? client.dateCreation.toDate() : client.dateCreation).toLocaleDateString('fr-FR')
    }));
    
    downloadCSV(data, 'clients_export.csv');
}

// ========================================
// UTILITAIRES
// ========================================
function checkAuth() {
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

function displayUserInfo() {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    const userName = document.getElementById('userName');
    if (userName && auth.nom) {
        userName.textContent = `${auth.prenom || ''} ${auth.nom}`;
    }
}

async function loadMagasins() {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const snapshot = await getDocs(collection(db, 'magasins'));
        
        const select = document.getElementById('newClientMagasin');
        select.innerHTML = '';
        
        snapshot.forEach(doc => {
            const magasin = doc.data();
            if (magasin.actif !== false) {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = magasin.nom;
                select.appendChild(option);
            }
        });
        
        // Sélectionner le magasin actuel par défaut
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        if (auth.magasin) {
            select.value = auth.magasin;
        }
        
    } catch (error) {
        console.error('❌ Erreur chargement magasins:', error);
    }
}

function setupModalListeners() {
    // Fermer les modales au clic sur le fond ou la croix
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.style.display = 'none';
            }
        });
    });
}

function showLoading(show) {
    const container = document.getElementById('clientsTableContainer');
    if (show) {
        container.innerHTML = '<div class="clients-loading">Chargement des clients...</div>';
    }
}

function showError(message) {
    // TODO: Implémenter un système de notification plus élégant
    alert('❌ ' + message);
}

function showSuccess(message) {
    // TODO: Implémenter un système de notification plus élégant
    alert('✅ ' + message);
}

function updateTable() {
    // Cette fonction sera appelée depuis clients.list.js
    if (window.updateClientsTable) {
        window.updateClientsTable(filteredClients);
    }
}

function downloadCSV(data, filename) {
    if (!data || !data.length) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
            const value = row[header] || '';
            // Échapper les guillemets et entourer de guillemets si nécessaire
            return value.toString().includes(',') ? `"${value.toString().replace(/"/g, '""')}"` : value;
        }).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// ========================================
// DÉCONNEXION
// ========================================
window.logout = function() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        window.location.href = '../index.html';
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-28] - Synchronisation filtres/tableau
   Solution: Fonction centrale applyFilters()
   
   [2024-01-28] - Performance avec beaucoup de clients
   Solution: Filtrage côté client, pas de rechargement
   
   NOTES POUR REPRISES FUTURES:
   - Le système de notification est basique (alert)
   - La pagination est gérée dans clients.list.js
   - Les filtres sont dans clients.filters.js
   ======================================== */