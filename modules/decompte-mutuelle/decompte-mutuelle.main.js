// ========================================
// DECOMPTE-MUTUELLE.MAIN.JS - Point d'entrée principal
// Chemin: src/js/pages/decompte-mutuelle/decompte-mutuelle.main.js
// ========================================

import { initFirebase } from '../../src/js/services/firebase.service.js';
import { 
    AppHeader,
    StatsCards,
    modalManager, 
    Dialog, 
    notify 
} from '../../src/components/index.js';

// État global temporaire (en attendant les autres modules)
const state = {
    decomptesData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        organisme: '',
        periode: 'all',
        statut: ''
    }
};

let appHeader = null;
let statsCards = null;

// Vérifier l'authentification
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

// Obtenir les données utilisateur
function getUserData() {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    if (auth && auth.collaborateur) {
        return {
            name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
            store: `Magasin ${auth.magasin || 'NON_DEFINI'}`,
            showLogout: true
        };
    }
    
    return {
        name: 'Utilisateur',
        store: 'Magasin non défini',
        showLogout: true
    };
}

// Initialiser les composants UI
async function initUIComponents() {
    try {
        const userData = getUserData();
        
        // Créer le header
        appHeader = new AppHeader({
            container: 'body',
            title: '💳 Décompte Mutuelle',
            subtitle: 'Gestion des remboursements mutuelles',
            backUrl: 'home.html',
            user: userData,
            onLogout: handleLogout
        });
        
        // Créer les cartes de statistiques
        const cardsConfig = [
            {
                id: 'en-attente',
                label: 'En attente',
                value: 15,
                color: 'warning',
                icon: '⏳'
            },
            {
                id: 'traite',
                label: 'Traités',
                value: 42,
                color: 'success',
                icon: '✅'
            },
            {
                id: 'refuse',
                label: 'Refusés',
                value: 3,
                color: 'danger',
                icon: '❌'
            },
            {
                id: 'expire',
                label: 'Expirés',
                value: 7,
                color: 'secondary',
                icon: '⏰'
            }
        ];
        
        statsCards = new StatsCards({
            container: '.decompte-stats',
            cards: cardsConfig,
            animated: true,
            onClick: (cardId) => {
                console.log(`Filtre par statut: ${cardId}`);
            }
        });
        
        console.log('✅ Composants UI initialisés');
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
    }
}

// Initialiser les filtres (temporaire)
function initFiltres() {
    const filtresContainer = document.querySelector('.decompte-filters');
    if (filtresContainer) {
        filtresContainer.innerHTML = `
            <div class="filters-row">
                <div class="filter-item">
                    <input type="text" placeholder="Rechercher..." class="filter-search">
                </div>
                <div class="filter-item">
                    <select class="filter-select">
                        <option value="">Tous les organismes</option>
                        <option value="harmonie">Harmonie Mutuelle</option>
                        <option value="malakoff">Malakoff Humanis</option>
                        <option value="mgen">MGEN</option>
                    </select>
                </div>
                <div class="filter-item">
                    <select class="filter-select">
                        <option value="all">Toutes les périodes</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois</option>
                    </select>
                </div>
                <button class="btn btn-secondary" onclick="window.resetFiltres()">
                    Réinitialiser
                </button>
            </div>
        `;
    }
}

// Initialiser le tableau (temporaire)
function initTableau() {
    const tableContainer = document.querySelector('.decompte-table-container');
    if (tableContainer) {
        tableContainer.innerHTML = `
            <table class="datatable">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Organisme</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>31/01/2025</td>
                        <td>Jean DUPONT</td>
                        <td>Harmonie Mutuelle</td>
                        <td>250,00 €</td>
                        <td><span class="badge badge-warning">⏳ En attente</span></td>
                        <td>
                            <button class="btn-action" onclick="window.voirDetailDecompte('1')">👁️</button>
                        </td>
                    </tr>
                    <tr>
                        <td>30/01/2025</td>
                        <td>Marie MARTIN</td>
                        <td>MGEN</td>
                        <td>180,00 €</td>
                        <td><span class="badge badge-success">✅ Traité</span></td>
                        <td>
                            <button class="btn-action" onclick="window.voirDetailDecompte('2')">👁️</button>
                        </td>
                    </tr>
                    <tr>
                        <td>29/01/2025</td>
                        <td>Pierre BERNARD</td>
                        <td>Malakoff Humanis</td>
                        <td>320,00 €</td>
                        <td><span class="badge badge-danger">❌ Refusé</span></td>
                        <td>
                            <button class="btn-action" onclick="window.voirDetailDecompte('3')">👁️</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }
}

// Gestion de la déconnexion
async function handleLogout() {
    const confirme = await Dialog.confirm('Voulez-vous vraiment vous déconnecter ?');
    
    if (confirme) {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        notify.success('Déconnexion réussie');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1000);
    }
}

// Fonctions temporaires exposées globalement
window.ouvrirNouvelleSaisie = function() {
    console.log('Ouvrir nouvelle saisie');
    // Pour l'instant, juste afficher le modal
    const modal = document.getElementById('modalNouvelleSaisie');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
};

window.fermerModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};

window.voirDetailDecompte = function(id) {
    console.log('Voir détail décompte:', id);
    // Afficher le modal détail
    const modal = document.getElementById('modalDetailDecompte');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.getElementById('detailNumDecompte').textContent = `#00${id}`;
    }
};

window.changerClient = function() {
    console.log('Changer client');
};

window.calculerMontants = function() {
    const prixVente = parseFloat(document.getElementById('prixVente').value) || 0;
    const remboursementSecu = parseFloat(document.getElementById('remboursementSecu').value) || 0;
    const priseEnCharge = parseFloat(document.getElementById('priseEnCharge').value) || 0;
    
    const resteACharge = prixVente - remboursementSecu;
    const resteFinal = resteACharge - priseEnCharge;
    
    document.getElementById('resteACharge').textContent = resteACharge.toFixed(2) + ' €';
    document.getElementById('resteFinal').textContent = resteFinal.toFixed(2) + ' €';
};

window.gererFichiers = function(files) {
    console.log('Fichiers sélectionnés:', files);
    const liste = document.getElementById('documentsList');
    liste.innerHTML = Array.from(files).map(file => `
        <div class="document-item">
            <span class="document-name">📄 ${file.name}</span>
            <span class="document-size">${(file.size / 1024).toFixed(0)} KB</span>
        </div>
    `).join('');
};

window.validerSaisie = function() {
    notify.success('Décompte enregistré avec succès !');
    window.fermerModal('modalNouvelleSaisie');
};

window.resetFiltres = function() {
    document.querySelector('.filter-search').value = '';
    document.querySelectorAll('.filter-select').forEach(s => s.value = '');
    notify.info('Filtres réinitialisés');
};

// Initialisation au chargement
window.addEventListener('load', async () => {
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    try {
        await initFirebase();
        await initUIComponents();
        
        // Init temporaire en attendant les vrais modules
        initFiltres();
        initTableau();
        
        // Gérer les fermetures de modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    window.fermerModal(modal.id);
                }
            });
        });
        
        // Gérer les clics overlay
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    window.fermerModal(modal.id);
                }
            });
        });
        
        document.body.classList.add('page-loaded');
        console.log('✅ Page décompte mutuelle initialisée');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        notify.error('Erreur lors du chargement de la page');
    }
});