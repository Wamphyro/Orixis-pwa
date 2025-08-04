// ========================================
// COMMANDES.PRINT.JS - Module d'impression des commandes
// Chemin: modules/commandes/commandes.print.js
//
// DESCRIPTION:
// Génère et affiche une fiche de commande au format HTML
// Design moderne optimisé pour l'impression A4
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
    <link rel="stylesheet" href="./commandes.print.css">
    <style>
        /* Styles inline pour l'impression immédiate */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #2c3e50;
            background: #f5f5f5;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .print-container {
            max-width: 210mm;
            margin: 20px auto;
            padding: 20mm;
            background: white;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            min-height: 297mm;
        }
        
        /* Bouton imprimer flottant */
        .print-button {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        }
        
        .print-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
        
        /* En-tête moderne */
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
            margin-bottom: 30px;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo-section svg {
            width: 50px;
            height: 50px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: -0.5px;
        }
        
        .order-number {
            text-align: right;
        }
        
        .order-number .label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .order-number .value {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
            margin-top: 5px;
        }
        
        /* Titre principal */
        .print-title {
            text-align: center;
            font-size: 28px;
            font-weight: 300;
            color: #495057;
            margin: 40px 0;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        /* Cards modernes */
        .info-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
        }
        
        .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: #667eea;
        }
        
        .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-icon {
            font-size: 18px;
            color: #6c757d;
        }
        
        .info-content {
            flex: 1;
        }
        
        .info-label {
            font-size: 11px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        .info-value {
            font-size: 15px;
            font-weight: 500;
            color: #2c3e50;
        }
        
        /* Cards produits */
        .products-grid {
            display: grid;
            gap: 15px;
            margin-top: 15px;
        }
        
        .product-card {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease;
        }
        
        .product-card:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .product-info {
            flex: 1;
        }
        
        .product-name {
            font-weight: 600;
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        .product-details {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }
        
        .product-detail {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .product-detail-icon {
            font-size: 16px;
        }
        
        .product-ref {
            background: #e9ecef;
            padding: 4px 10px;
            border-radius: 5px;
            font-size: 12px;
            color: #495057;
            font-weight: 500;
            display: inline-block;
        }
        
        .serial-badge {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 6px 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .serial-missing {
            background: #fff3e0;
            color: #f57c00;
        }
        
        .product-quantity {
            background: #667eea;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 18px;
            flex-shrink: 0;
        }
        
        /* Footer */
        .print-footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        
        /* Badges modernes */
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            background: #e9ecef;
            color: #495057;
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
        
        /* Print specific */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                background: white;
            }
            
            .print-container {
                padding: 15mm;
                margin: 0;
                box-shadow: none;
            }
            
            .print-button {
                display: none !important;
            }
            
            .info-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .product-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        🖨️ Imprimer cette page
    </button>
    
    <div class="print-container">
        <!-- En-tête avec logo -->
        <header class="print-header">
            <div class="logo-section">
                ${logoSVG}
                <div class="company-name">Orixis Audio</div>
            </div>
            <div class="order-number">
                <div class="label">Commande</div>
                <div class="value">${commande.numeroCommande}</div>
            </div>
        </header>
        
        <h1 class="print-title">Fiche de Commande</h1>
        
        <!-- Informations client -->
        <div class="info-card">
            <h2 class="card-title">Informations Client</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-icon">👤</span>
                    <div class="info-content">
                        <div class="info-label">Nom complet</div>
                        <div class="info-value">${commande.client.prenom} ${commande.client.nom}</div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">📱</span>
                    <div class="info-content">
                        <div class="info-label">Téléphone</div>
                        <div class="info-value">${commande.client.telephone || '-'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">✉️</span>
                    <div class="info-content">
                        <div class="info-label">Email</div>
                        <div class="info-value">${commande.client.email || '-'}</div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">🏪</span>
                    <div class="info-content">
                        <div class="info-label">Magasin référence</div>
                        <div class="info-value">${commande.magasinReference}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Produits commandés en cards -->
        <div class="info-card">
            <h2 class="card-title">Produits Commandés</h2>
            <div class="products-grid">
                ${commande.produits.map(produit => `
                    <div class="product-card">
                        <div class="product-info">
                            <div class="product-name">
                                ${produit.designation}
                                ${produit.cote ? `<span style="font-weight: normal; color: #6c757d;"> - ${capitalize(produit.cote)}</span>` : ''}
                            </div>
                            <span class="product-ref">Réf: ${produit.reference}</span>
                            <div class="product-details">
                                ${produit.numeroSerie 
                                    ? `<span class="serial-badge">
                                        <span>✓</span>
                                        N° ${produit.numeroSerie}
                                       </span>`
                                    : produit.type === 'appareil_auditif' || produit.necessiteCote
                                        ? '<span class="serial-badge serial-missing">⚠️ N° série à saisir</span>'
                                        : ''
                                }
                            </div>
                        </div>
                        <div class="product-quantity">
                            ${produit.quantite}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Informations de livraison -->
        <div class="info-card">
            <h2 class="card-title">Informations de Livraison</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-icon">📅</span>
                    <div class="info-content">
                        <div class="info-label">Date prévue</div>
                        <div class="info-value">${dateLivraison}</div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">📍</span>
                    <div class="info-content">
                        <div class="info-label">Magasin de livraison</div>
                        <div class="info-value">${commande.magasinLivraison}</div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">⚡</span>
                    <div class="info-content">
                        <div class="info-label">Niveau d'urgence</div>
                        <div class="info-value">
                            <span class="badge badge-${commande.niveauUrgence}">
                                ${urgenceConfig.icon} ${urgenceConfig.label}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-icon">📦</span>
                    <div class="info-content">
                        <div class="info-label">Type de préparation</div>
                        <div class="info-value">${typeConfig.label}</div>
                    </div>
                </div>
            </div>
            ${commande.commentaires ? `
                <div style="margin-top: 20px;">
                    <div class="info-label">Commentaires</div>
                    <div style="margin-top: 5px; padding: 10px; background: white; border-radius: 6px;">
                        ${commande.commentaires}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <!-- Informations d'expédition si applicable -->
        ${commande.expedition?.envoi?.numeroSuivi ? `
            <div class="info-card">
                <h2 class="card-title">Informations d'Expédition</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-icon">🚚</span>
                        <div class="info-content">
                            <div class="info-label">Transporteur</div>
                            <div class="info-value">${commande.expedition.envoi.transporteur}</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📮</span>
                        <div class="info-content">
                            <div class="info-label">Numéro de suivi</div>
                            <div class="info-value">
                                <span class="serial-badge">${commande.expedition.envoi.numeroSuivi}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Footer -->
        <footer class="print-footer">
            <p>Document généré le ${dateImpression}</p>
            <p>Orixis Audio - Solution de gestion SAV</p>
            <p class="no-print" style="margin-top: 10px;">
                <em>Ce document est généré automatiquement et reflète l'état actuel de la commande.</em>
            </p>
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
            <!-- Cercle de fond -->
            <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" opacity="0.1"/>
            
            <!-- Onde sonore stylisée -->
            <path d="M 20 50 Q 30 30, 40 50 T 60 50 T 80 50" 
                  stroke="url(#logoGradient)" 
                  stroke-width="4" 
                  fill="none" 
                  stroke-linecap="round"/>
            
            <!-- Points d'amplitude -->
            <circle cx="30" cy="35" r="3" fill="url(#logoGradient)"/>
            <circle cx="50" cy="50" r="4" fill="url(#logoGradient)"/>
            <circle cx="70" cy="35" r="3" fill="url(#logoGradient)"/>
            
            <!-- Icône oreille simplifiée -->
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
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========================================
// EXPORT GLOBAL
// ========================================

window.imprimerCommande = imprimerCommande;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [04/02/2025] - Création du module d'impression
   Solution: Module autonome avec génération HTML complète
   Impact: Aperçu avant impression avec design moderne
   
   NOTES POUR REPRISES FUTURES:
   - Pas d'impression automatique
   - Cards modernes pour les produits
   - Bouton imprimer flottant
   - Timeline supprimée
   ======================================== */