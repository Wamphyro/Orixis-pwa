// ========================================
// COMMANDES.LIST.JS - Gestion de la liste et des filtres (MODIFIÉ)
// Chemin: src/js/pages/commandes/commandes.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des commandes avec un tableau simplifié
// Modifié le 28/07/2025 : Retrait du bouton suppression
//
// STRUCTURE:
// 1. Initialisation du module (lignes 20-25)
// 2. Chargement des données (lignes 27-55)
// 3. Affichage avec tableau simplifié (lignes 57-140)
// 4. Filtres (lignes 142-230)
// 5. Pagination (lignes 232-265)
// 6. Fonctions utilitaires (lignes 267-275)
//
// DÉPENDANCES:
// - CommandesService: Service d'accès aux données
// - COMMANDES_CONFIG: Configuration des statuts et types
// - formatDate: Utilitaire de formatage
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
// AFFICHAGE (MODIFIÉ - Sans bouton suppression)
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
    
    // ========================================
    // TABLEAU SIMPLIFIÉ - Sans bouton suppression
    // Colonnes : N° Commande, Date, Client, Type, Urgence, Statut, Actions
    // ========================================
    if (commandesPage.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="7">Aucune commande trouvée</td></tr>';
        return;
    }
    
    // Afficher les commandes
    commandesPage.forEach(commande => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${commande.numeroCommande}</strong></td>
            <td>${formatDate(commande.dates.commande)}</td>
            <td>${commande.client.prenom} ${commande.client.nom}</td>
            <td>${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation}</td>
            <td>${afficherUrgence(commande.niveauUrgence)}</td>
            <td>${afficherStatut(commande.statut)}</td>
            <td class="table-actions">
                <button class="btn-action" onclick="voirDetailCommande('${commande.id}')">👁️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mettre à jour la pagination
    updatePagination(totalPages);
}

// ========================================
// FONCTION peutSupprimer() - DÉSACTIVÉE
// Conservée mais commentée au cas où on voudrait la réactiver
// Suppression de la fonctionnalité demandée le 28/07/2025
// ========================================
/*
function peutSupprimer(commande) {
    // Ne peut pas supprimer si déjà supprimée ou livrée
    return commande.statut !== 'supprime' && commande.statut !== 'livree';
}
*/

// ========================================
// NOTE: La fonction afficherProduits() n'est plus utilisée
// mais est conservée au cas où on voudrait la réactiver
// ========================================
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
    return commande.statut !== 'livree' && commande.statut !== 'annulee' && commande.statut !== 'supprime';
}

// ========================================
// FILTRES (Conserve l'exclusion des commandes supprimées)
// ========================================

function filtrerCommandesLocalement() {
    return state.commandesData.filter(commande => {
        // ========================================
        // Exclure systématiquement les commandes supprimées
        // (au cas où il y en aurait déjà en base)
        // ========================================
        if (commande.statut === 'supprime') {
            return false;
        }
        
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

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-07-26] - Simplification du tableau
   Modification: Suppression des colonnes Produits et Livraison
   Raison: Rendre le tableau plus lisible et moins chargé
   Impact: Les infos restent accessibles via le détail
   
   [27/07/2025] - Ajout de la suppression sécurisée
   Modification: Remplacement du bouton ✏️ par 🗑️
   Raison: Permettre la suppression (soft delete) des commandes
   Impact: Les commandes supprimées sont filtrées et n'apparaissent plus
   
   [28/07/2025] - Retrait de la fonctionnalité de suppression
   Modification: Suppression du bouton 🗑️ et désactivation de peutSupprimer()
   Raison: Demande utilisateur - simplification de l'interface
   Impact: Plus de suppression possible depuis le tableau
   
   NOTES POUR REPRISES FUTURES:
   - La fonction afficherProduits() est conservée mais non utilisée
   - Le colspan reste à 7 colonnes
   - Les commandes supprimées restent filtrées (au cas où)
   - La fonction peutSupprimer() est commentée mais conservée
   - La suppression reste possible via l'API si besoin
   ======================================== */