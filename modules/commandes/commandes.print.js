// ========================================
// COMMANDES.PRINT.JS - Module d'impression des commandes
// Chemin: modules/commandes/commandes.print.js
//
// DESCRIPTION:
// Génère et imprime une fiche de commande au format HTML
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
        
        // Ouvrir la fenêtre d'impression
        openPrintWindow(printHTML);
        
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
    const statutConfig = COMMANDES_CONFIG.STATUTS[commande.statut];
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
            background: white;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            min-height: 297mm;
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
        
        /* Liste des produits */
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .products-table th {
            background: #e9ecef;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #495057;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .products-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .product-name {
            font-weight: 500;
            color: #2c3e50;
            font-size: 15px;
        }
        
        .product-ref {
            font-size: 12px;
            color: #6c757d;
            margin-top: 3px;
        }
        
        .serial-number {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            display: inline-block;
        }
        
        .serial-missing {
            background: #fff3e0;
            color: #f57c00;
        }
        
        /* Timeline statut */
        .status-timeline {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
            position: relative;
        }
        
        .status-timeline::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 30px;
            right: 30px;
            height: 2px;
            background: #e9ecef;
            z-index: 0;
        }
        
        .status-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            position: relative;
            z-index: 1;
            background: white;
            padding: 0 10px;
        }
        
        .status-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #e9ecef;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .status-item.active .status-icon {
            background: #667eea;
        }
        
        .status-item.completed .status-icon {
            background: #28a745;
        }
        
        .status-label {
            font-size: 11px;
            color: #6c757d;
            text-align: center;
            max-width: 80px;
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
        
        .badge-normal {
            background: #d4edda;
            color: #155724;
        }
        
        /* Print specific */
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .print-container {
                padding: 15mm;
            }
            
            .no-print {
                display: none !important;
            }
            
            .info-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .status-timeline {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
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
        
        <!-- Produits commandés -->
        <div class="info-card">
            <h2 class="card-title">Produits Commandés</h2>
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Produit</th>
                        <th>Côté</th>
                        <th>Quantité</th>
                        <th>Numéro de série</th>
                    </tr>
                </thead>
                <tbody>
                    ${commande.produits.map(produit => `
                        <tr>
                            <td>
                                <div class="product-name">${produit.designation}</div>
                                <div class="product-ref">Réf: ${produit.reference}</div>
                            </td>
                            <td>${produit.cote ? capitalize(produit.cote) : '-'}</td>
                            <td>${produit.quantite}</td>
                            <td>
                                ${produit.numeroSerie 
                                    ? `<span class="serial-number">${produit.numeroSerie}</span>`
                                    : '<span class="serial-number serial-missing">Non saisi</span>'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
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
        
        <!-- Timeline du statut -->
        <div class="info-card">
            <h2 class="card-title">Statut de la Commande</h2>
            <div class="status-timeline">
                ${generateStatusTimeline(commande)}
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <span class="info-label">Statut actuel</span>
                <div style="font-size: 18px; font-weight: 600; color: #667eea; margin-top: 5px;">
                    ${statutConfig.icon} ${statutConfig.label}
                </div>
            </div>
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
                                <span class="serial-number">${commande.expedition.envoi.numeroSuivi}</span>
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
    
    <script>
        // Auto-print après chargement
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.print();
            }, 500);
        });
    </script>
</body>
</html>
    `;
}

// ========================================
// GÉNÉRATION DES ÉLÉMENTS
// ========================================

function generateStatusTimeline(commande) {
    const statuts = ['nouvelle', 'preparation', 'terminee', 'expediee', 'receptionnee', 'livree'];
    const currentIndex = statuts.indexOf(commande.statut);
    
    return statuts.map((statut, index) => {
        const config = COMMANDES_CONFIG.STATUTS[statut];
        let className = 'status-item';
        
        if (index < currentIndex) className += ' completed';
        else if (index === currentIndex) className += ' active';
        
        return `
            <div class="${className}">
                <div class="status-icon">${config.icon}</div>
                <div class="status-label">${config.label}</div>
            </div>
        `;
    }).join('');
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
// OUVERTURE FENÊTRE D'IMPRESSION
// ========================================

function openPrintWindow(html) {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    if (!printWindow) {
        config.notify.error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez les bloqueurs de popup.');
        return;
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Fermer la fenêtre après impression ou annulation
    printWindow.onafterprint = () => {
        printWindow.close();
    };
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
   Impact: Impression moderne et professionnelle
   
   NOTES POUR REPRISES FUTURES:
   - Logo SVG intégré pour éviter les dépendances
   - Styles inline pour impression immédiate
   - Timeline visuelle du statut
   - Format A4 avec marges appropriées
   ======================================== */