// ========================================
// COMMANDES.LIST.JS - Gestion de la liste et des filtres (AVEC BADGES MODERNES)
// Chemin: src/js/pages/commandes/commandes.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des commandes avec badges glassmorphism
// Modifié le 29/07/2025 : Intégration StatusBadgeComponent
//
// STRUCTURE:
// 1. Imports et configuration badges (lignes 20-80)
// 2. Initialisation du module (lignes 82-90)
// 3. Chargement des données (lignes 92-120)
// 4. Affichage avec badges modernes (lignes 122-230)
// 5. Filtres (lignes 232-320)
// 6. Pagination (lignes 322-355)
// 7. Fonctions utilitaires (lignes 357-365)
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { formatDate as formatDateUtil, formatMoney } from '../../shared/index.js';
import { state } from './commandes.main.js';
import { StatusBadgeComponent } from '../../shared/ui/elements/status-badge.component.js';

// ========================================
// CONFIGURATION DES BADGES
// ========================================

// Configuration des badges pour les statuts
const BADGES_STATUTS = {
    'nouvelle': { 
        icon: 'sparkles',           // Étincelles
        color: '#a855f7',           // Violet
        label: 'Nouvelle'
    },
    'preparation': { 
        icon: 'loader',             // Loader qui tourne
        color: '#3b82f6',           // Bleu
        label: 'En préparation',
        animation: 'spin'           // Animation rotation continue
    },
    'terminee': { 
        icon: 'check-circle',       // Check dans un cercle
        color: '#10b981',           // Vert émeraude
        label: 'Terminée'
    },
    'expediee': { 
        icon: 'truck',              // Camion
        color: '#6366f1',           // Indigo
        label: 'Expédiée'
    },
    'receptionnee': { 
        icon: 'package-check',      // Colis avec check
        color: '#0ea5e9',           // Bleu ciel
        label: 'Réceptionnée'
    },
    'livree': { 
        icon: 'check-double',       // Double check
        color: '#22c55e',           // Vert
        label: 'Livrée'
    },
    'annulee': { 
        icon: 'x-octagon',          // X dans octogone
        color: '#ef4444',           // Rouge
        label: 'Annulée'
    },
    'supprime': { 
        icon: 'trash-2',            // Poubelle
        color: '#dc3545',           // Rouge sombre
        label: 'Supprimée',
        special: true               // Pour appliquer des styles spéciaux
    }
};

// Configuration des badges pour les urgences
const BADGES_URGENCES = {
    'normal': { 
        icon: 'clock',              // Horloge
        color: '#22c55e',           // Vert
        label: 'Normal'
    },
    'urgent': { 
        icon: 'alert-triangle',     // Triangle d'alerte
        color: '#f59e0b',           // Orange
        label: 'Urgent',
        pulse: true                 // Animation pulse
    },
    'tres_urgent': { 
        icon: 'flame',              // Flamme
        color: '#ef4444',           // Rouge
        label: 'Très urgent',
        animation: 'flame'          // Animation flamme
    }
};

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    // Initialisation spécifique au module liste
    console.log('Module liste commandes initialisé avec badges modernes');
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
// AFFICHAGE AVEC BADGES MODERNES
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
    
    // Tableau sans bouton suppression
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
// FONCTIONS D'AFFICHAGE DES BADGES
// ========================================

/**
 * Afficher un badge de statut avec le composant StatusBadgeComponent
 */
function afficherStatut(statut) {
    const config = BADGES_STATUTS[statut];
    
    if (!config) {
        // Si statut inconnu, afficher un badge par défaut
        return `<span class="status-badge">${statut}</span>`;
    }
    
    // Créer le badge avec le composant
    const badge = StatusBadgeComponent.create({
        status: statut,
        customIcon: config.icon,
        customColor: config.color,
        text: config.label,
        style: 'glassmorphism',
        size: 'small',
        showText: true,
        showPulse: config.pulse || false,
        animation: config.animation || 'subtle'
    });
    
    // Cas spécial pour "supprimé" - ajouter le style barré
    if (config.special && statut === 'supprime') {
        badge.style.textDecoration = 'line-through';
        badge.style.opacity = '0.8';
    }
    
    return badge.outerHTML;
}

/**
 * Afficher un badge d'urgence avec le composant StatusBadgeComponent
 */
function afficherUrgence(urgence) {
    const config = BADGES_URGENCES[urgence];
    
    if (!config) {
        // Si urgence inconnue, afficher un badge par défaut
        return `<span class="urgence-badge">${urgence}</span>`;
    }
    
    // Créer le badge avec le composant
    const badge = StatusBadgeComponent.create({
        status: urgence,
        customIcon: config.icon,
        customColor: config.color,
        text: config.label,
        style: 'glassmorphism',
        size: 'small',
        showText: true,
        showPulse: config.pulse || false,
        animation: config.animation || 'subtle'
    });
    
    return badge.outerHTML;
}

/**
 * Vérifier si on peut modifier le statut d'une commande
 */
function peutModifierStatut(commande) {
    return commande.statut !== 'livree' && 
           commande.statut !== 'annulee' && 
           commande.statut !== 'supprime';
}

/**
 * Afficher les produits (fonction conservée mais non utilisée)
 */
function afficherProduits(produits) {
    if (!produits || produits.length === 0) return '-';
    const summary = produits.slice(0, 2).map(p => p.designation).join(', ');
    return produits.length > 2 ? `${summary}... (+${produits.length - 2})` : summary;
}

// ========================================
// FILTRES
// ========================================

function filtrerCommandesLocalement() {
    return state.commandesData.filter(commande => {
        // Exclure systématiquement les commandes supprimées
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
   
   [29/07/2025] - Intégration StatusBadgeComponent
   Modification: Remplacement des badges HTML par le composant moderne
   Raison: Uniformisation avec le nouveau système UI glassmorphism
   Impact: Badges animés avec icônes (loader qui tourne, flamme animée)
   
   NOTES POUR REPRISES FUTURES:
   - Les badges utilisent des icônes Lucide via StatusBadgeComponent
   - Animation 'spin' pour "En préparation" (loader qui tourne)
   - Animation 'flame' pour "Très urgent" (flamme animée)
   - Pulse sur "Urgent" pour attirer l'attention
   - Style barré + opacité pour "Supprimé"
   ======================================== */