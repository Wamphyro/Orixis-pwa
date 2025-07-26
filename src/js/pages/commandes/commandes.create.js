// ========================================
// COMMANDES.CREATE.JS - Gestion de la création de commandes (CORRIGÉ)
// ========================================

import { db } from '../../services/firebase.service.js';
import { ClientsService } from '../../services/clients.service.js';
import { ProduitsService } from '../../services/produits.service.js';
import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { Dialog, notify } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { ouvrirModal, afficherSucces, afficherErreur } from './commandes.main.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

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
let produitEnCoursSelection = null;

// Exposer l'état pour le module principal
window.commandeCreateState = { nouvelleCommande };

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationCommande() {
    // Exposer les fonctions nécessaires
    window.resetNouvelleCommande = resetNouvelleCommande;
    window.setDateLivraisonDefaut = setDateLivraisonDefaut;
    
    console.log('Module création commande initialisé');
}

// ========================================
// NOUVELLE COMMANDE
// ========================================

export function ouvrirNouvelleCommande() {
    resetNouvelleCommande();
    afficherEtape(1);
    ouvrirModal('modalNouvelleCommande');
}

function resetNouvelleCommande() {
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
    
    // Mettre à jour la référence globale
    window.commandeCreateState.nouvelleCommande = nouvelleCommande;
    
    // Réinitialiser l'affichage
    afficherEtape(1);
    
    // Réinitialiser la recherche client
    const clientSearch = document.getElementById('clientSearch');
    if (clientSearch) {
        clientSearch.value = '';
        clientSearch.style.display = 'block';
    }
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    // IMPORTANT: Réinitialiser la recherche produit et le panier
    const productSearch = document.getElementById('productSearch');
    if (productSearch) {
        productSearch.value = '';
    }
    const productSearchResults = document.getElementById('productSearchResults');
    if (productSearchResults) {
        productSearchResults.innerHTML = '';
        productSearchResults.classList.remove('active');
    }
    const tempCartItems = document.getElementById('tempCartItems');
    if (tempCartItems) {
        tempCartItems.innerHTML = '<p>Aucun produit sélectionné</p>';
    }
}

function afficherEtape(etape) {
    // Mettre à jour l'étape actuelle
    etapeActuelle = etape;
    
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
    
    // Plus besoin de data-step avec le CSS simplifié
    
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

export function etapePrecedente() {
    if (etapeActuelle > 1) {
        etapeActuelle--;
        afficherEtape(etapeActuelle);
    }
}

export async function etapeSuivante() {
    if (!await validerEtape(etapeActuelle)) {
        return;
    }
    
    if (etapeActuelle < 4) {
        etapeActuelle++;
        afficherEtape(etapeActuelle);
    }
}

async function validerEtape(etape) {
    switch (etape) {
        case 1:
            if (!nouvelleCommande.clientId) {
                await Dialog.alert('Veuillez sélectionner un client', 'Attention');
                return false;
            }
            break;
        case 2:
            if (nouvelleCommande.produits.length === 0) {
                await Dialog.alert('Veuillez ajouter au moins un produit', 'Attention');
                return false;
            }
            break;
        case 3:
            if (!nouvelleCommande.magasinLivraison) {
                await Dialog.alert('Veuillez sélectionner un magasin de livraison', 'Attention');
                return false;
            }
            break;
    }
    return true;
}

// ========================================
// GESTION DES CLIENTS
// ========================================

export async function rechercherClient() {
    const recherche = document.getElementById('clientSearch').value;
    const resultsDiv = document.getElementById('clientSearchResults');
    
    if (recherche.length < 2) {
        resultsDiv.classList.remove('active');
        resultsDiv.innerHTML = '';
        return;
    }
    
    try {
        resultsDiv.innerHTML = '<div class="search-result-item">Recherche en cours...</div>';
        resultsDiv.classList.add('active');
        
        const clients = await ClientsService.rechercherClients(recherche);
        
        if (clients.length > 0) {
            resultsDiv.innerHTML = clients.map(client => `
                <div class="search-result-item" onclick="selectionnerClient('${client.id}')">
                    <strong>${client.prenom} ${client.nom}</strong>
                    <br>
                    <small>
                        ${client.telephone || ''} 
                        ${client.email ? '- ' + client.email : ''}
                        ${client.magasinReference ? '- Magasin: ' + client.magasinReference : ''}
                    </small>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = '<div class="search-result-item">Aucun client trouvé</div>';
        }
        resultsDiv.classList.add('active');
    } catch (error) {
        console.error('Erreur recherche client:', error);
        resultsDiv.innerHTML = '<div class="search-result-item">Erreur lors de la recherche</div>';
    }
}

export async function selectionnerClient(clientId) {
    try {
        const client = await ClientsService.getClient(clientId);
        if (client) {
            nouvelleCommande.clientId = clientId;
            nouvelleCommande.client = client;
            
            document.getElementById('clientSearch').style.display = 'none';
            document.getElementById('clientSelected').style.display = 'block';
            document.getElementById('selectedClientName').textContent = `${client.prenom} ${client.nom}`;
            
            let infoText = '';
            if (client.telephone) infoText += client.telephone;
            if (client.email) infoText += (infoText ? ' - ' : '') + client.email;
            if (client.magasinReference) {
                infoText += (infoText ? ' - ' : '') + `Magasin: ${client.magasinReference}`;
            }
            document.getElementById('selectedClientInfo').textContent = infoText;
            
            document.getElementById('clientSearchResults').classList.remove('active');
            document.getElementById('clientSearchResults').innerHTML = '';
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
        notify.error('Erreur lors de la sélection du client');
    }
}

export function changerClient() {
    nouvelleCommande.clientId = null;
    nouvelleCommande.client = null;
    document.getElementById('clientSearch').style.display = 'block';
    document.getElementById('clientSearch').value = '';
    document.getElementById('clientSelected').style.display = 'none';
    document.getElementById('clientSearchResults').innerHTML = '';
    document.getElementById('clientSearchResults').classList.remove('active');
}

export function ouvrirNouveauClient() {
    // Marquer qu'on veut passer d'une modal à l'autre sans confirmation
    window.skipConfirmation = true;
    
    // Fermer la modal actuelle
    window.fermerModal('modalNouvelleCommande');
    
    // Charger les magasins et ouvrir la modal nouveau client
    chargerMagasinsPourNouveauClient();
    
    // Attendre un peu avant d'ouvrir la nouvelle modal
    setTimeout(() => {
        ouvrirModal('modalNouveauClient');
    }, 300);
}

async function chargerMagasinsPourNouveauClient() {
    try {
        const select = document.getElementById('newClientMagasin');
        select.innerHTML = '';
        
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    id: doc.id,
                    code: data.code || doc.id,
                    nom: data.nom || data.code || doc.id
                });
            }
        });
        
        magasins.sort((a, b) => a.code.localeCompare(b.code));
        
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin.code;
            option.textContent = magasin.nom;
            if (magasin.code === auth.magasin || magasin.id === auth.magasin) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('newClientMagasin');
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
    }
}

export async function creerNouveauClient() {
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
        await selectionnerClient(clientId);
        
        window.fermerModal('modalNouveauClient');
        ouvrirModal('modalNouvelleCommande');
        
        form.reset();
        
    } catch (error) {
        console.error('Erreur création client:', error);
        await Dialog.error('Erreur lors de la création du client: ' + error.message);
    }
}

// ========================================
// GESTION DES PRODUITS
// ========================================

async function chargerPackTemplates() {
    try {
        const select = document.getElementById('packTemplate');
        select.innerHTML = '<option value="">-- Commande personnalisée --</option>';
        
        const { collection, getDocs, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const q = query(
            collection(db, 'packTemplates'),
            where('actif', '==', true),
            orderBy('ordre', 'asc')
        );
        
        const snapshot = await getDocs(q);
        
        snapshot.forEach((doc) => {
            const pack = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = pack.nom;
            option.dataset.description = pack.description || '';
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur chargement packs:', error);
    }
}

export async function appliquerPack() {
    const packId = document.getElementById('packTemplate').value;
    if (!packId) return;
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const packDoc = await getDoc(doc(db, 'packTemplates', packId));
        if (!packDoc.exists()) return;
        
        const pack = packDoc.data();
        
        // Vider le panier actuel
        nouvelleCommande.produits = [];
        
        // Traiter chaque produit du pack
        for (const produitPack of pack.produits) {
            if (produitPack.reference) {
                // Si on a une référence directe, chercher le produit
                const produits = await ProduitsService.rechercherProduits(produitPack.reference);
                if (produits.length > 0) {
                    const produit = produits[0];
                    
                    if (produit.necessiteCote && produitPack.cote === 'both') {
                        // Ajouter les deux côtés
                        nouvelleCommande.produits.push({
                            ...produit,
                            cote: 'droit',
                            quantite: produitPack.quantite || 1
                        });
                        nouvelleCommande.produits.push({
                            ...produit,
                            cote: 'gauche',
                            quantite: produitPack.quantite || 1
                        });
                    } else {
                        nouvelleCommande.produits.push({
                            ...produit,
                            quantite: produitPack.quantite || 1
                        });
                    }
                }
            } else if (produitPack.categorie) {
                // Si on a une catégorie, chercher un produit de cette catégorie
                const { collection, getDocs, query, where, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                let q = query(
                    collection(db, 'produits'),
                    where('actif', '==', true),
                    where('categorie', '==', produitPack.categorie),
                    limit(1)
                );
                
                // Si on a un type spécifique
                if (produitPack.type) {
                    q = query(
                        collection(db, 'produits'),
                        where('actif', '==', true),
                        where('type', '==', produitPack.type),
                        where('categorie', '==', produitPack.categorie),
                        limit(1)
                    );
                }
                
                const snapshot = await getDocs(q);
                
                if (!snapshot.empty) {
                    const produitDoc = snapshot.docs[0];
                    const produit = { id: produitDoc.id, ...produitDoc.data() };
                    
                    if (produit.necessiteCote && produitPack.cote === 'both') {
                        // Pour les appareils auditifs, demander la sélection
                        produitEnCoursSelection = produit;
                        produitEnCoursSelection.quantiteFromPack = produitPack.quantite || 1;
                        
                        // Afficher le sélecteur de côté
                        afficherSelecteurCotePourPack(produit);
                    } else {
                        nouvelleCommande.produits.push({
                            ...produit,
                            quantite: produitPack.quantite || 1
                        });
                    }
                }
            }
        }
        
        // Rafraîchir l'affichage
        afficherPanierTemporaire();
        
        notify.success(`Pack "${pack.nom}" appliqué avec succès`);
        
    } catch (error) {
        console.error('Erreur application pack:', error);
        notify.error('Erreur lors de l\'application du pack');
    }
}

function afficherSelecteurCotePourPack(produit) {
    const selectorHtml = `
        <div id="coteSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
             z-index: 10000; min-width: 400px;">
            <h3 style="margin-bottom: 20px; text-align: center; color: #2c3e50;">
                Sélectionner les appareils pour le pack<br><strong>${produit.designation}</strong>
            </h3>
            <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                <button onclick="selectionnerCotePack('both')" style="background: white; border: 3px solid #9C27B0; 
                        border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                        display: flex; flex-direction: column; align-items: center; gap: 10px;"
                        onmouseover="this.style.background='#F3E5F5'" onmouseout="this.style.background='white'">
                    <span style="font-size: 40px;">👂👂</span>
                    <span style="color: #9C27B0; font-weight: bold;">Les deux côtés</span>
                </button>
            </div>
            <button onclick="annulerSelectionCote()" style="background: #f8f9fa; border: 2px solid #e9ecef; 
                    border-radius: 10px; padding: 10px 20px; cursor: pointer; width: 100%; 
                    color: #6c757d; font-weight: 500;">
                Annuler le pack
            </button>
        </div>
        <div id="coteSelectorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
             background: rgba(0,0,0,0.5); z-index: 9999;" onclick="annulerSelectionCote()"></div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', selectorHtml);
}

window.selectionnerCotePack = function(cote) {
    if (!produitEnCoursSelection) return;
    
    if (cote === 'both') {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'droit',
            quantite: produitEnCoursSelection.quantiteFromPack || 1
        });
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'gauche',
            quantite: produitEnCoursSelection.quantiteFromPack || 1
        });
    }
    
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    
    produitEnCoursSelection = null;
    
    afficherPanierTemporaire();
};

export async function rechercherProduit() {
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

export async function ajouterProduit(produitId) {
    try {
        const produit = await ProduitsService.getProduit(produitId);
        if (!produit) return;
        
        if (produit.necessiteCote) {
            produitEnCoursSelection = produit;
            
            const selectorHtml = `
                <div id="coteSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
                     z-index: 10000; min-width: 400px;">
                    <h3 style="margin-bottom: 20px; text-align: center; color: #2c3e50;">
                        Sélectionner le côté pour<br><strong>${produit.designation}</strong>
                    </h3>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                        <button onclick="selectionnerCote('gauche')" style="background: white; border: 3px solid #2196F3; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#E3F2FD'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #2196F3; font-weight: bold;">Gauche</span>
                        </button>
                        <button onclick="selectionnerCote('droit')" style="background: white; border: 3px solid #F44336; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#FFEBEE'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #F44336; font-weight: bold;">Droit</span>
                        </button>
                        <button onclick="selectionnerCote('both')" style="background: white; border: 3px solid #9C27B0; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#F3E5F5'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂👂</span>
                            <span style="color: #9C27B0; font-weight: bold;">Les deux</span>
                        </button>
                    </div>
                    <button onclick="annulerSelectionCote()" style="background: #f8f9fa; border: 2px solid #e9ecef; 
                            border-radius: 10px; padding: 10px 20px; cursor: pointer; width: 100%; 
                            color: #6c757d; font-weight: 500;">
                        Annuler
                    </button>
                </div>
                <div id="coteSelectorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 9999;" onclick="annulerSelectionCote()"></div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', selectorHtml);
            
        } else {
            nouvelleCommande.produits.push({
                ...produit,
                quantite: 1
            });
            
            afficherPanierTemporaire();
            
            document.getElementById('productSearchResults').classList.remove('active');
            document.getElementById('productSearch').value = '';
        }
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
}

export function selectionnerCote(cote) {
    if (!produitEnCoursSelection) return;
    
    if (cote === 'both') {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'droit',
            quantite: 1
        });
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'gauche',
            quantite: 1
        });
    } else {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: cote,
            quantite: 1
        });
    }
    
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    
    produitEnCoursSelection = null;
    
    afficherPanierTemporaire();
    
    document.getElementById('productSearchResults').classList.remove('active');
    document.getElementById('productSearch').value = '';
}

export function annulerSelectionCote() {
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    produitEnCoursSelection = null;
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
                    ${produit.cote ? `Côté: ${produit.cote}` : ''}
                </div>
            </div>
            <div class="temp-cart-item-actions">
                <button class="btn-action" onclick="window.retirerProduit(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

export function retirerProduit(index) {
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
        
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    id: doc.id,
                    code: data.code || doc.id,
                    nom: data.nom || data.code || doc.id
                });
            }
        });
        
        if (nouvelleCommande.client && nouvelleCommande.client.magasinReference) {
            const magasinClient = nouvelleCommande.client.magasinReference;
            const existeDeja = magasins.some(m => m.code === magasinClient || m.id === magasinClient);
            
            if (!existeDeja) {
                magasins.push({
                    id: magasinClient,
                    code: magasinClient,
                    nom: magasinClient + ' (Référence client)'
                });
            }
        }
        
        magasins.sort((a, b) => a.code.localeCompare(b.code));
        
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin.code;
            option.textContent = magasin.nom;
            
            if (nouvelleCommande.client && 
                (magasin.code === nouvelleCommande.client.magasinReference || 
                 magasin.id === nouvelleCommande.client.magasinReference)) {
                option.selected = true;
            } else if (!nouvelleCommande.client && magasin.code === auth.magasin) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        if (!select.value && magasins.length > 0) {
            select.value = magasins[0].code;
        }
        
        nouvelleCommande.magasinLivraison = select.value;
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('magasinLivraison');
        let magasins = auth.magasins || [auth.magasin];
        
        if (nouvelleCommande.client && nouvelleCommande.client.magasinReference) {
            const magasinClient = nouvelleCommande.client.magasinReference;
            if (!magasins.includes(magasinClient)) {
                magasins.push(magasinClient);
            }
        }
        
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin;
            option.textContent = magasin;
            
            if (nouvelleCommande.client && magasin === nouvelleCommande.client.magasinReference) {
                option.selected = true;
            } else if (!nouvelleCommande.client && magasin === auth.magasin) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        nouvelleCommande.magasinLivraison = select.value;
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
    
    dateInput.value = date.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
}

// ========================================
// RÉCAPITULATIF ET VALIDATION
// ========================================

function afficherRecapitulatif() {
    const recapClient = document.getElementById('recapClient');
    if (nouvelleCommande.client) {
        recapClient.innerHTML = `
            <p><strong>${nouvelleCommande.client.prenom} ${nouvelleCommande.client.nom}</strong></p>
            <p>${nouvelleCommande.client.telephone || ''}</p>
            <p>${nouvelleCommande.client.email || ''}</p>
            <p><strong>Magasin de référence :</strong> ${nouvelleCommande.client.magasinReference}</p>
        `;
    }
    
    const recapProduits = document.getElementById('recapProduits');
    recapProduits.innerHTML = nouvelleCommande.produits.map(produit => `
        <div style="margin-bottom: 10px;">
            <strong>${produit.designation}</strong>
            ${produit.cote ? `(${produit.cote})` : ''}
            <br>
            Quantité: ${produit.quantite || 1}
        </div>
    `).join('');
    
    const recapLivraison = document.getElementById('recapLivraison');
    const typePrep = document.getElementById('typePreparation').value;
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    const magasinLivraison = document.getElementById('magasinLivraison').value;
    const dateLivraison = document.getElementById('dateLivraison').value;
    
    recapLivraison.innerHTML = `
        <p><strong>Type:</strong> ${COMMANDES_CONFIG.TYPES_PREPARATION[typePrep]?.label}</p>
        <p><strong>Urgence:</strong> ${COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence]?.label}</p>
        <p><strong>Magasin de livraison:</strong> ${magasinLivraison}</p>
        <p><strong>Date prévue:</strong> ${new Date(dateLivraison).toLocaleDateString('fr-FR')}</p>
    `;
}

export async function validerCommande() {
    nouvelleCommande.typePreparation = document.getElementById('typePreparation').value;
    nouvelleCommande.urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    nouvelleCommande.magasinLivraison = document.getElementById('magasinLivraison').value;
    nouvelleCommande.dateLivraison = new Date(document.getElementById('dateLivraison').value);
    nouvelleCommande.commentaires = document.getElementById('commentaires').value;
    
    try {
        const commandeId = await CommandesService.creerCommande(nouvelleCommande);
        
        window.fermerModal('modalNouvelleCommande');
        
        await chargerDonnees();
        
        afficherSucces('Commande créée avec succès !');
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        afficherErreur('Erreur lors de la création de la commande: ' + error.message);
    }
}