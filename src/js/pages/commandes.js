// ========================================
// COMMANDES.JS - Logique principale de la page
// ========================================

import { initFirebase, db } from '../services/firebase.service.js';
import { ClientsService } from '../services/clients.service.js';
import { ProduitsService } from '../services/produits.service.js';
import { CommandesService } from '../services/commandes.service.js';
import { COMMANDES_CONFIG, formaterDate, formaterPrix } from '../data/commandes.data.js';

// Variables globales
let commandesData = [];
let currentPage = 1;
let itemsPerPage = 20;
let filtres = {
    recherche: '',
    statut: '',
    periode: 'all',
    urgence: ''
};

// Variables pour la nouvelle commande
let etapeActuelle = 1;
let nouvelleCommande = {
    clientId: null,
    client: null,
    produits: [],
    typePreparation: 'livraison_accessoire',
    urgence: 'normal',
    magasinLivraison: null,
    dateLivraison: null,
    commentaires: ''
};

// ========================================
// INITIALISATION
// ========================================

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

// Initialisation au chargement
window.addEventListener('load', async () => {
    if (!checkAuth()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Afficher les infos utilisateur
    afficherInfosUtilisateur();
    
    // Initialiser Firebase
    await initFirebase();
    
    // Charger les données initiales
    await chargerDonnees();
    
    // Initialiser les événements
    initEventListeners();
});

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherInfosUtilisateur() {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    if (auth && auth.collaborateur) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`;
        }
    }
}

async function chargerDonnees() {
    try {
        // Charger les commandes
        commandesData = await CommandesService.getCommandes();
        
        // Charger les statistiques
        const stats = await CommandesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les commandes
        afficherCommandes();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        afficherErreur('Erreur lors du chargement des données');
    }
}

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
    const totalPages = Math.ceil(commandesFiltrees.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
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
            <td>${formaterDate(commande.dates.commande, 'jour')}</td>
            <td>${commande.client.prenom} ${commande.client.nom}</td>
            <td>${afficherProduits(commande.produits)}</td>
            <td>${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation}</td>
            <td>${afficherUrgence(commande.niveauUrgence)}</td>
            <td>${afficherStatut(commande.statut)}</td>
            <td>${formaterDate(commande.dates.livraisonPrevue, 'jour')}</td>
            <td class="table-actions">
                <button class="btn-action" onclick="window.voirDetailCommande('${commande.id}')">👁️</button>
                ${peutModifierStatut(commande) ? `<button class="btn-action" onclick="window.changerStatutCommande('${commande.id}')">✏️</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mettre à jour la pagination
    updatePagination(totalPages);
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
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer toutes les fonctions nécessaires sur window
window.ouvrirNouvelleCommande = ouvrirNouvelleCommande;
window.filtrerCommandes = filtrerCommandes;
window.resetFiltres = resetFiltres;
window.pagePrecedente = pagePrecedente;
window.pageSuivante = pageSuivante;
window.rechercherClient = rechercherClient;
window.selectionnerClient = selectionnerClient;
window.changerClient = changerClient;
window.ouvrirNouveauClient = ouvrirNouveauClient;
window.creerNouveauClient = creerNouveauClient;
window.appliquerPack = appliquerPack;
window.rechercherProduit = rechercherProduit;
window.ajouterProduit = ajouterProduit;
window.retirerProduit = retirerProduit;
window.etapePrecedente = etapePrecedente;
window.etapeSuivante = etapeSuivante;
window.validerCommande = validerCommande;
window.voirDetailCommande = voirDetailCommande;
window.changerStatutCommande = changerStatutCommande;
window.fermerModal = fermerModal;
window.logout = logout;

function filtrerCommandesLocalement() {
    return commandesData.filter(commande => {
        // Filtre recherche
        if (filtres.recherche) {
            const recherche = filtres.recherche.toLowerCase();
            const clientNom = `${commande.client.prenom} ${commande.client.nom}`.toLowerCase();
            const numero = commande.numeroCommande?.toLowerCase() || '';
            
            if (!clientNom.includes(recherche) && !numero.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre statut
        if (filtres.statut && commande.statut !== filtres.statut) {
            return false;
        }
        
        // Filtre urgence
        if (filtres.urgence && commande.niveauUrgence !== filtres.urgence) {
            return false;
        }
        
        // Filtre période
        if (filtres.periode !== 'all') {
            const dateCommande = commande.dates.commande?.toDate ? 
                commande.dates.commande.toDate() : 
                new Date(commande.dates.commande);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (filtres.periode) {
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

function filtrerCommandes() {
    // Récupérer les valeurs des filtres
    filtres.recherche = document.getElementById('searchInput').value;
    filtres.statut = document.getElementById('filterStatut').value;
    filtres.periode = document.getElementById('filterPeriode').value;
    filtres.urgence = document.getElementById('filterUrgence').value;
    
    // Réinitialiser la page
    currentPage = 1;
    
    // Réafficher
    afficherCommandes();
}

function resetFiltres() {
    // Réinitialiser les filtres
    filtres = {
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
    currentPage = 1;
    afficherCommandes();
}

// ========================================
// PAGINATION
// ========================================

function updatePagination(totalPages) {
    document.getElementById('pageActuelle').textContent = currentPage;
    document.getElementById('pageTotal').textContent = totalPages;
    
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage === totalPages;
}

function pagePrecedente() {
    if (currentPage > 1) {
        currentPage--;
        afficherCommandes();
    }
}

function pageSuivante() {
    const totalPages = Math.ceil(filtrerCommandesLocalement().length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        afficherCommandes();
    }
}

// ========================================
// NOUVELLE COMMANDE
// ========================================

function ouvrirNouvelleCommande() {
    // Réinitialiser
    etapeActuelle = 1;
    nouvelleCommande = {
        clientId: null,
        client: null,
        produits: [],
        typePreparation: 'livraison_accessoire',
        urgence: 'normal',
        magasinLivraison: null,
        dateLivraison: null,
        commentaires: ''
    };
    
    // Afficher la modal
    afficherEtape(1);
    ouvrirModal('modalNouvelleCommande');
}

function afficherEtape(etape) {
    // Masquer toutes les étapes
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`stepContent${i}`).classList.add('hidden');
        document.getElementById(`step${i}`).classList.remove('active', 'completed');
    }
    
    // Afficher l'étape actuelle
    document.getElementById(`stepContent${etape}`).classList.remove('hidden');
    document.getElementById(`step${etape}`).classList.add('active');
    
    // Marquer les étapes précédentes comme complétées
    for (let i = 1; i < etape; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Gérer les boutons
    document.getElementById('btnPrevStep').disabled = etape === 1;
    document.getElementById('btnNextStep').style.display = etape < 4 ? 'block' : 'none';
    document.getElementById('btnValiderCommande').classList.toggle('hidden', etape !== 4);
    
    // Actions spécifiques par étape
    switch (etape) {
        case 2:
            chargerPackTemplates();
            break;
        case 3:
            chargerMagasins();
            setDateLivraisonDefaut();
            break;
        case 4:
            afficherRecapitulatif();
            break;
    }
}

function etapePrecedente() {
    if (etapeActuelle > 1) {
        etapeActuelle--;
        afficherEtape(etapeActuelle);
    }
}

function etapeSuivante() {
    // Valider l'étape actuelle
    if (!validerEtape(etapeActuelle)) {
        return;
    }
    
    if (etapeActuelle < 4) {
        etapeActuelle++;
        afficherEtape(etapeActuelle);
    }
}

function validerEtape(etape) {
    switch (etape) {
        case 1:
            if (!nouvelleCommande.clientId) {
                alert('Veuillez sélectionner un client');
                return false;
            }
            break;
        case 2:
            if (nouvelleCommande.produits.length === 0) {
                alert('Veuillez ajouter au moins un produit');
                return false;
            }
            break;
        case 3:
            if (!nouvelleCommande.magasinLivraison) {
                alert('Veuillez sélectionner un magasin de livraison');
                return false;
            }
            break;
    }
    return true;
}

// ========================================
// RECHERCHE CLIENT
// ========================================

async function rechercherClient() {
    const recherche = document.getElementById('clientSearch').value;
    const resultsDiv = document.getElementById('clientSearchResults');
    
    if (recherche.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        const clients = await ClientsService.rechercherClients(recherche);
        
        if (clients.length > 0) {
            resultsDiv.innerHTML = clients.map(client => `
                <div class="search-result-item" onclick="selectionnerClient('${client.id}')">
                    <strong>${client.prenom} ${client.nom}</strong>
                    <br>
                    <small>${client.telephone || ''} - ${client.email || ''}</small>
                </div>
            `).join('');
            resultsDiv.classList.add('active');
        } else {
            resultsDiv.innerHTML = '<div class="search-result-item">Aucun client trouvé</div>';
            resultsDiv.classList.add('active');
        }
    } catch (error) {
        console.error('Erreur recherche client:', error);
    }
}

async function selectionnerClient(clientId) {
    try {
        const client = await ClientsService.getClient(clientId);
        if (client) {
            nouvelleCommande.clientId = clientId;
            nouvelleCommande.client = client;
            
            // Afficher le client sélectionné
            document.getElementById('clientSearch').style.display = 'none';
            document.getElementById('clientSelected').style.display = 'block';
            document.getElementById('selectedClientName').textContent = `${client.prenom} ${client.nom}`;
            document.getElementById('selectedClientInfo').textContent = `${client.telephone || ''} - ${client.email || ''}`;
            
            // Masquer les résultats
            document.getElementById('clientSearchResults').classList.remove('active');
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
    }
}

function changerClient() {
    nouvelleCommande.clientId = null;
    nouvelleCommande.client = null;
    document.getElementById('clientSearch').style.display = 'block';
    document.getElementById('clientSearch').value = '';
    document.getElementById('clientSelected').style.display = 'none';
}

function ouvrirNouveauClient() {
    // Fermer la modal actuelle et ouvrir celle du nouveau client
    fermerModal('modalNouvelleCommande');
    chargerMagasinsPourNouveauClient();
    ouvrirModal('modalNouveauClient');
}

// ========================================
// CRÉATION CLIENT
// ========================================

async function chargerMagasinsPourNouveauClient() {
    try {
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('newClientMagasin');
        select.innerHTML = '';
        
        // Ajouter les magasins autorisés
        const magasins = auth.magasins || [auth.magasin];
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin;
            option.textContent = magasin;
            if (magasin === auth.magasin) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
    }
}

async function creerNouveauClient() {
    const form = document.getElementById('formNouveauClient');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const clientData = {
        nom: document.getElementById('newClientNom').value,
        prenom: document.getElementById('newClientPrenom').value,
        telephone: document.getElementById('newClientTel').value,
        email: document.getElementById('newClientEmail').value,
        magasinReference: document.getElementById('newClientMagasin').value
    };
    
    try {
        const clientId = await ClientsService.creerClient(clientData);
        
        // Sélectionner automatiquement le nouveau client
        await selectionnerClient(clientId);
        
        // Fermer la modal et rouvrir celle de commande
        fermerModal('modalNouveauClient');
        ouvrirModal('modalNouvelleCommande');
        
        // Réinitialiser le formulaire
        form.reset();
        
    } catch (error) {
        console.error('Erreur création client:', error);
        alert('Erreur lors de la création du client');
    }
}

// ========================================
// GESTION DES PRODUITS
// ========================================

async function chargerPackTemplates() {
    // TODO: Charger les packs depuis Firebase
    // Pour l'instant, on laisse vide
}

async function appliquerPack() {
    const packId = document.getElementById('packTemplate').value;
    if (!packId) return;
    
    // TODO: Appliquer le pack sélectionné
    alert('Fonctionnalité en cours de développement');
}

async function rechercherProduit() {
    const recherche = document.getElementById('productSearch').value;
    const resultsDiv = document.getElementById('productSearchResults');
    
    if (recherche.length < 2) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        const produits = await ProduitsService.rechercherProduits(recherche);
        
        if (produits.length > 0) {
            resultsDiv.innerHTML = produits.map(produit => `
                <div class="product-card" onclick="ajouterProduit('${produit.id}')">
                    <div class="product-card-header">
                        <div>
                            <div class="product-name">${produit.designation}</div>
                            <div class="product-reference">${produit.reference}</div>
                        </div>
                        <div class="product-price">${formaterPrix(produit.prix)}</div>
                    </div>
                    <div class="product-info">
                        ${produit.marque} - ${produit.categorie}
                    </div>
                </div>
            `).join('');
            resultsDiv.classList.add('active');
        } else {
            resultsDiv.innerHTML = '<div class="search-result-item">Aucun produit trouvé</div>';
            resultsDiv.classList.add('active');
        }
    } catch (error) {
        console.error('Erreur recherche produit:', error);
    }
}

async function ajouterProduit(produitId) {
    try {
        const produit = await ProduitsService.getProduit(produitId);
        if (!produit) return;
        
        // Si appareil auditif, demander le côté
        if (produit.necessiteCote) {
            // TODO: Implémenter la sélection du côté
            const cote = prompt('Quel côté ? (droit/gauche/both)');
            if (!cote) return;
            
            if (cote === 'both') {
                // Ajouter les deux côtés
                nouvelleCommande.produits.push({
                    ...produit,
                    cote: 'droit',
                    quantite: 1
                });
                nouvelleCommande.produits.push({
                    ...produit,
                    cote: 'gauche',
                    quantite: 1
                });
            } else {
                nouvelleCommande.produits.push({
                    ...produit,
                    cote: cote,
                    quantite: 1
                });
            }
        } else {
            // Produit normal
            nouvelleCommande.produits.push({
                ...produit,
                quantite: 1
            });
        }
        
        // Mettre à jour l'affichage
        afficherPanierTemporaire();
        
        // Masquer les résultats
        document.getElementById('productSearchResults').classList.remove('active');
        document.getElementById('productSearch').value = '';
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
}

function afficherPanierTemporaire() {
    const container = document.getElementById('tempCartItems');
    
    if (nouvelleCommande.produits.length === 0) {
        container.innerHTML = '<p>Aucun produit sélectionné</p>';
        return;
    }
    
    container.innerHTML = nouvelleCommande.produits.map((produit, index) => `
        <div class="temp-cart-item">
            <div class="temp-cart-item-info">
                <div class="temp-cart-item-name">${produit.designation}</div>
                <div class="temp-cart-item-details">
                    ${produit.cote ? `Côté: ${produit.cote} - ` : ''}
                    ${formaterPrix(produit.prix)}
                </div>
            </div>
            <div class="temp-cart-item-actions">
                <button class="btn-action" onclick="window.retirerProduit(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function retirerProduit(index) {
    nouvelleCommande.produits.splice(index, 1);
    afficherPanierTemporaire();
}

// ========================================
// INFORMATIONS DE LIVRAISON
// ========================================

async function chargerMagasins() {
    try {
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('magasinLivraison');
        select.innerHTML = '';
        
        // Ajouter les magasins
        const magasins = auth.magasins || [auth.magasin];
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin;
            option.textContent = magasin;
            if (magasin === auth.magasin) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        nouvelleCommande.magasinLivraison = select.value;
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
    }
}

function setDateLivraisonDefaut() {
    const dateInput = document.getElementById('dateLivraison');
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    
    const date = new Date();
    switch (urgence) {
        case 'tres_urgent':
            date.setDate(date.getDate() + 1);
            break;
        case 'urgent':
            date.setDate(date.getDate() + 2);
            break;
        default:
            date.setDate(date.getDate() + 5);
    }
    
    // Format YYYY-MM-DD pour l'input date
    dateInput.value = date.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
}

// ========================================
// RÉCAPITULATIF ET VALIDATION
// ========================================

function afficherRecapitulatif() {
    // Client
    const recapClient = document.getElementById('recapClient');
    if (nouvelleCommande.client) {
        recapClient.innerHTML = `
            <p><strong>${nouvelleCommande.client.prenom} ${nouvelleCommande.client.nom}</strong></p>
            <p>${nouvelleCommande.client.telephone || ''}</p>
            <p>${nouvelleCommande.client.email || ''}</p>
        `;
    }
    
    // Produits
    const recapProduits = document.getElementById('recapProduits');
    let total = 0;
    recapProduits.innerHTML = nouvelleCommande.produits.map(produit => {
        const sousTotal = produit.prix * (produit.quantite || 1);
        total += sousTotal;
        return `
            <div style="margin-bottom: 10px;">
                <strong>${produit.designation}</strong>
                ${produit.cote ? `(${produit.cote})` : ''}
                <br>
                ${produit.quantite || 1} x ${formaterPrix(produit.prix)} = ${formaterPrix(sousTotal)}
            </div>
        `;
    }).join('');
    
    // Livraison
    const recapLivraison = document.getElementById('recapLivraison');
    const typePrep = document.getElementById('typePreparation').value;
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    const magasinLivraison = document.getElementById('magasinLivraison').value;
    const dateLivraison = document.getElementById('dateLivraison').value;
    
    recapLivraison.innerHTML = `
        <p><strong>Type:</strong> ${COMMANDES_CONFIG.TYPES_PREPARATION[typePrep]?.label}</p>
        <p><strong>Urgence:</strong> ${COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence]?.label}</p>
        <p><strong>Magasin:</strong> ${magasinLivraison}</p>
        <p><strong>Date prévue:</strong> ${new Date(dateLivraison).toLocaleDateString('fr-FR')}</p>
    `;
    
    // Total
    document.getElementById('recapTotal').textContent = formaterPrix(total);
}

async function validerCommande() {
    // Récupérer les dernières valeurs
    nouvelleCommande.typePreparation = document.getElementById('typePreparation').value;
    nouvelleCommande.urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    nouvelleCommande.magasinLivraison = document.getElementById('magasinLivraison').value;
    nouvelleCommande.dateLivraison = new Date(document.getElementById('dateLivraison').value);
    nouvelleCommande.commentaires = document.getElementById('commentaires').value;
    
    try {
        // Créer la commande
        const commandeId = await CommandesService.creerCommande(nouvelleCommande);
        
        // Fermer la modal
        fermerModal('modalNouvelleCommande');
        
        // Recharger les données
        await chargerDonnees();
        
        // Message de succès
        afficherSucces('Commande créée avec succès !');
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        afficherErreur('Erreur lors de la création de la commande');
    }
}

// ========================================
// DÉTAIL ET MODIFICATION COMMANDE
// ========================================

async function voirDetailCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        // TODO: Afficher les détails dans la modal
        alert('Détail de la commande ' + commande.numeroCommande);
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
    }
}

async function changerStatutCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        const prochainStatut = COMMANDES_CONFIG.STATUTS[commande.statut]?.suivant;
        if (!prochainStatut) return;
        
        if (confirm(`Passer la commande au statut "${COMMANDES_CONFIG.STATUTS[prochainStatut].label}" ?`)) {
            await CommandesService.changerStatut(commandeId, prochainStatut);
            await chargerDonnees();
            afficherSucces('Statut mis à jour');
        }
        
    } catch (error) {
        console.error('Erreur changement statut:', error);
        afficherErreur('Erreur lors du changement de statut');
    }
}

// ========================================
// UTILITAIRES
// ========================================

function ouvrirModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function fermerModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function afficherSucces(message) {
    // TODO: Implémenter un système de notification
    alert('✅ ' + message);
}

function afficherErreur(message) {
    // TODO: Implémenter un système de notification
    alert('❌ ' + message);
}

// Déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        window.location.href = '../index.html';
    }
}

// Event listeners
function initEventListeners() {
    // Écouter les changements d'urgence pour mettre à jour la date
    const urgenceInputs = document.querySelectorAll('input[name="urgence"]');
    urgenceInputs.forEach(input => {
        input.addEventListener('change', setDateLivraisonDefaut);
    });
    
    // Fermer les modals en cliquant sur le fond
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fermerModal(modal.id);
            }
        });
    });
    
    // Fermer les résultats de recherche en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.client-search') && !e.target.closest('.product-search')) {
            document.querySelectorAll('.search-results').forEach(results => {
                results.classList.remove('active');
            });
        }
    });
}