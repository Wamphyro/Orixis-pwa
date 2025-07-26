// ========================================
// COMMANDES.LIST.JS - Gestion de la liste et des filtres (VERSION CORRIGÉE)
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { formatDate as formatDateUtil, formatMoney } from '../../shared/index.js';
import { state } from './commandes.main.js';

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    // Initialisation spécifique au module liste
    console.log('Module liste commandes initialisé');
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        // Charger les commandes
        state.commandesData = await CommandesService.getCommandes();
        
        // Si pas de commandes, initialiser un tableau vide
        if (!state.commandesData) {
            state.commandesData = [];
        }
        
        // Charger les statistiques
        const stats = await CommandesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les commandes
        afficherCommandes();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        // En cas d'erreur, initialiser avec des données vides
        state.commandesData = [];
        afficherStatistiques({
            parStatut: {},
            parUrgence: {},
            retards: 0
        });
        afficherCommandes();
    }
}

// ========================================
// AFFICHAGE
// ========================================

function afficherStatistiques(stats) {
    document.getElementById('statNouvelles').textContent = stats.parStatut.nouvelle || 0;
    document.getElementById('statPreparation').textContent = stats.parStatut.preparation || 0;
    document.getElementById('statExpediees').textContent = stats.parStatut.expediee || 0;
    document.getElementById('statLivrees').textContent = stats.parStatut.livree || 0;
}

function afficherCommandes() {
    const tbody = document.getElementById('commandesTableBody');
    tbody.innerHTML = '';
    
    // Filtrer les commandes
    let commandesFiltrees = filtrerCommandesLocalement();
    
    // Pagination
    const totalPages = Math.ceil(commandesFiltrees.length / state.itemsPerPage);
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const commandesPage = commandesFiltrees.slice(start, end);
    
    if (commandesPage.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="9">Aucune commande trouvée</td></tr>';
        return;
    }
    
    // Afficher les commandes
    commandesPage.forEach(commande => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${commande.numeroCommande}</strong></td>
            <td>${formatDate(commande.dates.commande)}</td>
            <td>${commande.client.prenom} ${commande.client.nom}</td>
            <td>${afficherProduits(commande.produits)}</td>
            <td>${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation}</td>
            <td>${afficherUrgence(commande.niveauUrgence)}</td>
            <td>${afficherStatut(commande.statut)}</td>
            <td>${formatDate(commande.dates.livraisonPrevue)}</td>
            <td class="table-actions">
                <button class="btn-action btn-voir-detail" data-id="${commande.id}">👁️</button>
                ${peutModifierStatut(commande) ? `<button class="btn-action btn-modifier-statut" data-id="${commande.id}">✏️</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Attacher les événements aux boutons après création
    attacherEvenementsBoutonsCommandes();
    
    // Mettre à jour la pagination
    updatePagination(totalPages);
}

// NOUVELLE FONCTION : Attacher les événements aux boutons
function attacherEvenementsBoutonsCommandes() {
    // Boutons voir détail
    document.querySelectorAll('.btn-voir-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            const commandeId = this.getAttribute('data-id');
            console.log('Clic sur voir détail:', commandeId);
            // Appel direct de la fonction
            if (window.voirDetailCommande) {
                window.voirDetailCommande(commandeId);
            } else {
                console.error('voirDetailCommande non trouvée');
            }
        });
    });
    
    // Boutons modifier statut
    document.querySelectorAll('.btn-modifier-statut').forEach(btn => {
        btn.addEventListener('click', function() {
            const commandeId = this.getAttribute('data-id');
            if (window.changerStatutCommande) {
                window.changerStatutCommande(commandeId);
            }
        });
    });
}

function afficherProduits(produits) {
    if (!produits || produits.length === 0) return '-';
    const summary = produits.slice(0, 2).map(p => p.designation).join(', ');
    return produits.length > 2 ? `${summary}... (+${produits.length - 2})` : summary;
}

function afficherUrgence(urgence) {
    const config = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    if (!config) return urgence;
    return `<span class="urgence-badge ${urgence}">${config.icon} ${config.label}</span>`;
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    return `<span class="status-badge status-${statut}">${config.icon} ${config.label}</span>`;
}

function peutModifierStatut(commande) {
    return commande.statut !== 'livree' && commande.statut !== 'annulee';
}

// ========================================
// FILTRES
// ========================================

function filtrerCommandesLocalement() {
    return state.commandesData.filter(commande => {
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const clientNom = `${commande.client.prenom} ${commande.client.nom}`.toLowerCase();
            const numero = commande.numeroCommande?.toLowerCase() || '';
            
            if (!clientNom.includes(recherche) && !numero.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre statut
        if (state.filtres.statut && commande.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre urgence
        if (state.filtres.urgence && commande.niveauUrgence !== state.filtres.urgence) {
            return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            const dateCommande = commande.dates.commande?.toDate ? 
                commande.dates.commande.toDate() : 
                new Date(commande.dates.commande);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateCommande < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateCommande < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (dateCommande < debut) return false;
                    break;
            }
        }
        
        return true;
    });
}

export function filtrerCommandes() {
    // Récupérer les valeurs des filtres
    state.filtres.recherche = document.getElementById('searchInput').value;
    state.filtres.statut = document.getElementById('filterStatut').value;
    state.filtres.periode = document.getElementById('filterPeriode').value;
    state.filtres.urgence = document.getElementById('filterUrgence').value;
    
    // Réinitialiser la page
    state.currentPage = 1;
    
    // Réafficher
    afficherCommandes();
}

export function resetFiltres() {
    // Réinitialiser les filtres
    state.filtres = {
        recherche: '',
        statut: '',
        periode: 'all',
        urgence: ''
    };
    
    // Réinitialiser les inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatut').value = '';
    document.getElementById('filterPeriode').value = 'all';
    document.getElementById('filterUrgence').value = '';
    
    // Réafficher
    state.currentPage = 1;
    afficherCommandes();
}

// ========================================
// PAGINATION
// ========================================

function updatePagination(totalPages) {
    document.getElementById('pageActuelle').textContent = state.currentPage;
    document.getElementById('pageTotal').textContent = totalPages;
    
    document.getElementById('btnPrev').disabled = state.currentPage === 1;
    document.getElementById('btnNext').disabled = state.currentPage === totalPages;
}

export function pagePrecedente() {
    if (state.currentPage > 1) {
        state.currentPage--;
        afficherCommandes();
    }
}

export function pageSuivante() {
    const commandesFiltrees = filtrerCommandesLocalement();
    const totalPages = Math.ceil(commandesFiltrees.length / state.itemsPerPage);
    if (state.currentPage < totalPages) {
        state.currentPage++;
        afficherCommandes();
    }
}

// ========================================
// FONCTION UTILITAIRE LOCALE
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDateUtil(date, 'DD/MM/YYYY');
}