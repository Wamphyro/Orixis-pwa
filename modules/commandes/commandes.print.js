// ========================================
// COMMANDES.PRINT.JS - Module d'impression des commandes
// Chemin: modules/commandes/commandes.print.js
//
// DESCRIPTION:
// Génère et affiche une fiche de commande au format HTML
// Design moderne optimisé pour tenir sur une page A4
//
// API PUBLIQUE:
// - imprimerCommande(commandeId)
// - generatePrintHTML(commande)
//
// DÉPENDANCES:
// - CommandesService (récupération des données)
// - COMMANDES_CONFIG (configuration métier)
// ========================================

import { CommandesService } from './commandes.service.js';
import { COMMANDES_CONFIG } from './commandes.data.js';
import config from './commandes.config.js';

// ========================================
// FONCTION PRINCIPALE
// ========================================

export async function imprimerCommande(commandeId) {
    try {
        // Récupérer les données de la commande
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) {
            config.notify.error('Commande introuvable');
            return;
        }
        
        // Générer le HTML
        const printHTML = generatePrintHTML(commande);
        
        // Ouvrir la fenêtre d'aperçu
        openPrintPreview(printHTML);
        
    } catch (error) {
        console.error('Erreur impression:', error);
        config.notify.error('Erreur lors de la génération de l\'impression');
    }
}

// ========================================
// GÉNÉRATION DU HTML
// ========================================

export function generatePrintHTML(commande) {
    const logoSVG = createModernLogo();
    const dateImpression = new Date().toLocaleString('fr-FR');
    const dateLivraison = formatDate(commande.dates.livraisonPrevue);
    const urgenceConfig = COMMANDES_CONFIG.NIVEAUX_URGENCE[commande.niveauUrgence];
    const typeConfig = COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation];
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande ${commande.numeroCommande}</title>
    <style>
        /* Reset et base */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #2c3e50;
            background: #f5f5f5;
            font-size: 12px;
            line-height: 1.4;
        }
        
        /* Container optimisé pour A4 */
        .print-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 10mm 15mm;
            background: white;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            position: relative;
        }
        
        /* Bouton imprimer */
        .print-button {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        /* En-tête compact */
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
            margin-bottom: 15px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .logo-section svg {
            width: 40px;
            height: 40px;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: 700;
            color: #667eea;
        }
        
        .order-info {
            text-align: right;
        }
        
        .order-number {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .order-date {
            font-size: 11px;
            color: #6c757d;
            margin-top: 2px;
        }
        
        /* Titre compact */
        .print-title {
            text-align: center;
            font-size: 20px;
            font-weight: 600;
            color: #495057;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        /* Layout 2 colonnes pour client et livraison */
        .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        /* Cards compactes */
        .info-card {
            background: #f8f9fa;
            border-left: 3px solid #667eea;
            border-radius: 8px;
            padding: 12px 15px;
        }
        
        .info-card.full-width {
            grid-column: 1 / -1;
        }
        
        .card-title {
            font-size: 13px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        /* Infos compactes */
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 11px;
        }
        
        .info-label {
            color: #6c757d;
            font-weight: 500;
        }
        
        .info-value {
            color: #2c3e50;
            font-weight: 600;
            text-align: right;
        }
        
        /* Section produits compacte */
        .products-section {
            margin: 15px 0;
            background: #f8f9fa;
            border-radius: 8px;
            padding: 12px 15px;
            border-left: 3px solid #667eea;
        }
        
        .products-title {
            font-size: 13px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        /* Liste produits super compacte */
        .product-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .product-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 8px 10px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        
        .product-main {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .product-qty {
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 11px;
            flex-shrink: 0;
        }
        
        .product-details {
            flex: 1;
        }
        
        .product-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 12px;
        }
        
        .product-ref {
            font-size: 10px;
            color: #6c757d;
        }
        
        .product-serial {
            font-size: 10px;
            color: #28a745;
            font-family: monospace;
        }
        
        .serial-missing {
            color: #dc3545;
            font-style: italic;
        }
        
        /* Badges compacts */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
        }
        
        .badge-urgent {
            background: #fff3cd;
            color: #856404;
        }
        
        .badge-tres_urgent {
            background: #f8d7da;
            color: #721c24;
        }
        
        .badge-normal {
            background: #d4edda;
            color: #155724;
        }
        
        /* Section expédition si présente */
        .shipping-info {
            margin-top: 15px;
            padding: 10px;
            background: #e3f2fd;
            border-radius: 6px;
            border-left: 3px solid #2196f3;
        }
        
        .shipping-info h4 {
            font-size: 12px;
            color: #1976d2;
            margin-bottom: 5px;
        }
        
        .shipping-details {
            display: flex;
            gap: 20px;
            font-size: 11px;
        }
        
        /* Footer compact */
        .print-footer {
            position: absolute;
            bottom: 10mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 10px;
            color: #6c757d;
            padding-top: 10px;
            border-top: 1px solid #e9ecef;
        }
        
        /* Commentaires */
        .comments-box {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 8px;
            margin-top: 8px;
            font-size: 11px;
            font-style: italic;
            color: #495057;
        }
        
        /* Print specific */
        @media print {
            body {
                background: white;
            }
            
            .print-container {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 10mm 15mm;
                box-shadow: none;
            }
            
            .print-button {
                display: none !important;
            }
            
            .info-card,
            .product-item,
            .products-section {
                break-inside: avoid;
            }
        }
        
        @media screen {
            body {
                padding: 20px 0;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">
        🖨️ Imprimer
    </button>
    
    <div class="print-container">
        <!-- En-tête -->
        <header class="print-header">
            <div class="logo-section">
                ${logoSVG}
                <div class="company-name">Orixis Audio</div>
            </div>
            <div class="order-info">
                <div class="order-number">${commande.numeroCommande}</div>
                <div class="order-date">Créée le ${formatDate(commande.dates.commande)}</div>
            </div>
        </header>
        
        <h1 class="print-title">Fiche de Commande</h1>
        
        <!-- Client et Livraison côte à côte -->
        <div class="info-row">
            <!-- Client -->
            <div class="info-card">
                <h3 class="card-title">Client</h3>
                <div class="info-item">
                    <span class="info-label">Nom :</span>
                    <span class="info-value">${commande.client.prenom} ${commande.client.nom}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tél :</span>
                    <span class="info-value">${commande.client.telephone || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email :</span>
                    <span class="info-value">${commande.client.email || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Magasin :</span>
                    <span class="info-value">${commande.magasinReference}</span>
                </div>
            </div>
            
            <!-- Livraison -->
            <div class="info-card">
                <h3 class="card-title">Livraison</h3>
                <div class="info-item">
                    <span class="info-label">Date prévue :</span>
                    <span class="info-value">${dateLivraison}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Magasin :</span>
                    <span class="info-value">${commande.magasinLivraison}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Type :</span>
                    <span class="info-value">${typeConfig.label}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Urgence :</span>
                    <span class="info-value">
                        <span class="badge badge-${commande.niveauUrgence}">
                            ${urgenceConfig.icon} ${urgenceConfig.label}
                        </span>
                    </span>
                </div>
            </div>
        </div>
        
        <!-- Produits -->
        <div class="products-section">
            <h3 class="products-title">Produits commandés (${commande.produits.length})</h3>
            <div class="product-list">
                ${commande.produits.map(produit => `
                    <div class="product-item">
                        <div class="product-main">
                            <div class="product-qty">${produit.quantite}</div>
                            <div class="product-details">
                                <div class="product-name">
                                    ${produit.designation}
                                    ${produit.cote ? `- ${capitalize(produit.cote)}` : ''}
                                </div>
                                <div class="product-ref">Réf: ${produit.reference}</div>
                                ${produit.numeroSerie 
                                    ? `<div class="product-serial">N° série: ${produit.numeroSerie}</div>`
                                    : produit.type === 'appareil_auditif' || produit.necessiteCote
                                        ? '<div class="product-serial serial-missing">N° série à saisir</div>'
                                        : ''
                                }
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Commentaires si présents -->
        ${commande.commentaires ? `
            <div class="info-card full-width" style="margin-top: 15px;">
                <h3 class="card-title">Commentaires</h3>
                <div class="comments-box">
                    ${commande.commentaires}
                </div>
            </div>
        ` : ''}
        
        <!-- Expédition si présente -->
        ${commande.expedition?.envoi?.numeroSuivi ? `
            <div class="shipping-info">
                <h4>Informations d'expédition</h4>
                <div class="shipping-details">
                    <span><strong>Transporteur :</strong> ${commande.expedition.envoi.transporteur}</span>
                    <span><strong>N° suivi :</strong> ${commande.expedition.envoi.numeroSuivi}</span>
                </div>
            </div>
        ` : ''}
        
        <!-- Footer -->
        <footer class="print-footer">
            <p>Document généré le ${dateImpression} - Orixis Audio</p>
        </footer>
    </div>
</body>
</html>
    `;
}

// ========================================
// CRÉATION DU LOGO SVG
// ========================================

function createModernLogo() {
    return `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1"/>
            <path d="M 20 50 Q 30 30, 40 50 T 60 50 T 80 50" 
                  stroke="url(#logoGradient)" 
                  stroke-width="4" 
                  fill="none" 
                  stroke-linecap="round"/>
            <circle cx="30" cy="35" r="3" fill="url(#logoGradient)"/>
            <circle cx="50" cy="50" r="4" fill="url(#logoGradient)"/>
            <circle cx="70" cy="35" r="3" fill="url(#logoGradient)"/>
            <path d="M 45 45 C 45 35, 55 35, 55 45 C 55 55, 45 55, 45 45 
                     M 55 45 C 58 45, 58 50, 55 50" 
                  stroke="url(#logoGradient)" 
                  stroke-width="2.5" 
                  fill="none" 
                  stroke-linecap="round"/>
        </svg>
    `;
}

// ========================================
// OUVERTURE FENÊTRE D'APERÇU
// ========================================

function openPrintPreview(html) {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    
    if (!printWindow) {
        config.notify.error('Impossible d\'ouvrir la fenêtre d\'aperçu. Vérifiez les bloqueurs de popup.');
        return;
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// EXPORT GLOBAL
// ========================================

window.imprimerCommande = imprimerCommande;