/* ========================================
   PRINT.WIDGET.JS - Widget d'impression universel
   Chemin: /widgets/print/print.widget.js
   
   DESCRIPTION:
   Widget réutilisable pour générer des aperçus d'impression
   et imprimer des documents (commandes, factures, devis, etc.)
   
   UTILISATION:
   const printer = new PrintWidget({
       title: 'Commande #123',
       template: 'commande',
       data: commandeData
   });
   printer.preview();
   
   VERSION: 1.0.0
   ======================================== */

export class PrintWidget {
    constructor(config = {}) {
        this.config = {
            // Document
            title: config.title || 'Document',
            template: config.template || 'default',
            data: config.data || {},
            
            // Format
            format: config.format || 'A4',
            orientation: config.orientation || 'portrait',
            margins: config.margins || '15mm',
            
            // Société
            companyName: config.companyName || 'Orixis Audio',
            companyLogo: config.companyLogo || true,
            companyAddress: config.companyAddress || '',
            
            // Couleurs
            colors: {
                primary: config.colors?.primary || '#667eea',
                secondary: config.colors?.secondary || '#764ba2',
                success: config.colors?.success || '#28a745',
                danger: config.colors?.danger || '#dc3545',
                warning: config.colors?.warning || '#ffc107',
                ...config.colors
            },
            
            // Options
            showPreview: config.showPreview !== false,
            autoOpen: config.autoOpen !== false,
            
            // Callbacks
            onBeforePrint: config.onBeforePrint || null,
            onAfterPrint: config.onAfterPrint || null,
            onClose: config.onClose || null
        };
        
        this.id = 'print-widget-' + Date.now();
        this.previewWindow = null;
        this.modalElement = null;
        
        this.loadCSS();
    }
    
    /**
     * Charge le CSS du widget
     */
    loadCSS() {
        const cssId = 'print-widget-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/print/print.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }
    
    /**
     * Ouvre l'aperçu dans une modal
     */
    preview() {
        if (this.config.showPreview) {
            this.createPreviewModal();
        } else {
            this.print();
        }
    }
    
    /**
     * Crée la modal d'aperçu
     */
    createPreviewModal() {
        // Créer le HTML du document
        const documentHTML = this.generateHTML();
        
        // Créer la modal
        const modalHTML = `
            <div id="${this.id}" class="print-preview-modal active">
                <div class="print-preview-container">
                    <div class="print-preview-header">
                        <h3>📄 Aperçu avant impression</h3>
                        <button class="btn-close-preview" aria-label="Fermer">×</button>
                    </div>
                    <div class="print-preview-body">
                        <iframe id="${this.id}-frame" class="print-preview-frame"></iframe>
                    </div>
                    <div class="print-preview-footer">
                        <button class="btn btn-secondary btn-close-modal">Fermer</button>
                        <button class="btn btn-primary btn-print">
                            🖨️ Imprimer
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById(this.id);
        
        // Charger le contenu dans l'iframe
        const iframe = document.getElementById(`${this.id}-frame`);
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(documentHTML);
        iframeDoc.close();
        
        // Attacher les événements
        this.attachModalEvents();
    }
    
    /**
     * Attache les événements de la modal
     */
    attachModalEvents() {
        // Fermeture
        this.modalElement.querySelector('.btn-close-preview').addEventListener('click', () => {
            this.closePreview();
        });
        
        this.modalElement.querySelector('.btn-close-modal').addEventListener('click', () => {
            this.closePreview();
        });
        
        // Impression
        this.modalElement.querySelector('.btn-print').addEventListener('click', () => {
            this.printFromPreview();
        });
        
        // Fermeture par overlay
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.closePreview();
            }
        });
        
        // Fermeture par Escape
        document.addEventListener('keydown', this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePreview();
            }
        });
    }
    
    /**
     * Imprime depuis l'aperçu
     */
    printFromPreview() {
        const iframe = document.getElementById(`${this.id}-frame`);
        if (iframe && iframe.contentWindow) {
            if (this.config.onBeforePrint) {
                this.config.onBeforePrint();
            }
            
            iframe.contentWindow.print();
            
            if (this.config.onAfterPrint) {
                this.config.onAfterPrint();
            }
        }
    }
    
    /**
     * Ferme l'aperçu
     */
    closePreview() {
        if (this.modalElement) {
            this.modalElement.classList.remove('active');
            setTimeout(() => {
                this.modalElement.remove();
                this.modalElement = null;
            }, 300);
        }
        
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        if (this.config.onClose) {
            this.config.onClose();
        }
    }
    
    /**
     * Impression directe (nouvelle fenêtre)
     */
    print() {
        const html = this.generateHTML();
        const printWindow = window.open('', '_blank', 'width=900,height=1000');
        
        if (!printWindow) {
            console.error('Impossible d\'ouvrir la fenêtre d\'impression');
            return;
        }
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        printWindow.onload = () => {
            if (this.config.onBeforePrint) {
                this.config.onBeforePrint();
            }
            
            setTimeout(() => {
                printWindow.print();
                
                if (this.config.onAfterPrint) {
                    this.config.onAfterPrint();
                }
            }, 250);
        };
    }
    
    /**
     * Génère le HTML du document
     */
    generateHTML() {
        // Sélectionner le template
        const templateContent = this.getTemplateContent();
        
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <style>
        ${this.getBaseStyles()}
        ${this.getPrintStyles()}
        ${this.getTemplateStyles()}
    </style>
</head>
<body>
    <div class="print-document">
        ${templateContent}
    </div>
</body>
</html>`;
    }
    
    /**
     * Styles de base
     */
    getBaseStyles() {
        return `
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
            
            .print-document {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: ${this.config.margins};
                background: white;
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }
            
            /* Header */
            .doc-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 10px;
                border-bottom: 2px solid ${this.config.colors.primary};
                margin-bottom: 15px;
            }
            
            .company-section {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .company-logo {
                width: 40px;
                height: 40px;
            }
            
            .company-name {
                font-size: 18px;
                font-weight: 700;
                color: ${this.config.colors.primary};
            }
            
            .doc-info {
                text-align: right;
            }
            
            .doc-number {
                font-size: 16px;
                font-weight: 600;
                color: #2c3e50;
            }
            
            .doc-date {
                font-size: 11px;
                color: #6c757d;
                margin-top: 2px;
            }
            
            /* Sections */
            .info-card {
                background: #f8f9fa;
                border-left: 3px solid ${this.config.colors.primary};
                border-radius: 8px;
                padding: 12px 15px;
                margin-bottom: 15px;
            }
            
            .card-title {
                font-size: 13px;
                font-weight: 600;
                color: ${this.config.colors.primary};
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
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
            
            /* Footer */
            .doc-footer {
                margin-top: 30px;
                padding-top: 10px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                font-size: 10px;
                color: #6c757d;
            }
        `;
    }
    
    /**
     * Styles d'impression
     */
    getPrintStyles() {
        return `
            @media print {
                body {
                    background: white;
                }
                
                .print-document {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-shadow: none;
                }
                
                .info-card {
                    break-inside: avoid;
                }
                
                @page {
                    size: ${this.config.format} ${this.config.orientation};
                    margin: ${this.config.margins};
                }
            }
            
            @media screen {
                body {
                    padding: 20px 0;
                }
            }
        `;
    }
    
    /**
     * Styles spécifiques au template
     */
    getTemplateStyles() {
        // Styles additionnels selon le template
        if (this.config.template === 'commande') {
            return this.getCommandeStyles();
        }
        return '';
    }
    
    /**
     * Styles pour le template commande
     */
    getCommandeStyles() {
        return `
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
                background: ${this.config.colors.primary};
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 11px;
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
            
            .badge-normal {
                background: #d4edda;
                color: #155724;
            }
        `;
    }
    
    /**
     * Contenu du template
     */
    getTemplateContent() {
        switch (this.config.template) {
            case 'commande':
                return this.getCommandeTemplate();
            default:
                return this.getDefaultTemplate();
        }
    }
    
    /**
     * Template par défaut
     */
    getDefaultTemplate() {
        return `
            <header class="doc-header">
                <div class="company-section">
                    ${this.getLogo()}
                    <div class="company-name">${this.config.companyName}</div>
                </div>
                <div class="doc-info">
                    <div class="doc-number">${this.config.title}</div>
                    <div class="doc-date">${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
            </header>
            
            <div class="info-card">
                <h3 class="card-title">Document</h3>
                <pre>${JSON.stringify(this.config.data, null, 2)}</pre>
            </div>
            
            <footer class="doc-footer">
                Document généré le ${new Date().toLocaleString('fr-FR')} - ${this.config.companyName}
            </footer>
        `;
    }
    
    /**
     * Template commande
     */
    getCommandeTemplate() {
        const data = this.config.data;
        const urgenceLabel = data.urgenceLabel || data.niveauUrgence || 'normal';
        const typeLabel = data.typeLabel || data.typePreparation || '-';
        
        return `
            <header class="doc-header">
                <div class="company-section">
                    ${this.getLogo()}
                    <div class="company-name">${this.config.companyName}</div>
                </div>
                <div class="doc-info">
                    <div class="doc-number">${data.numeroCommande}</div>
                    <div class="doc-date">Créée le ${this.formatDate(data.dates?.commande)}</div>
                </div>
            </header>
            
            <h1 style="text-align: center; font-size: 20px; margin: 20px 0; color: #495057;">
                FICHE DE COMMANDE
            </h1>
            
            <div class="info-grid">
                <!-- Client -->
                <div class="info-card">
                    <h3 class="card-title">👤 Client</h3>
                    <div class="info-item">
                        <span class="info-label">Nom :</span>
                        <span class="info-value">${data.client?.prenom || ''} ${data.client?.nom || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tél :</span>
                        <span class="info-value">${data.client?.telephone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email :</span>
                        <span class="info-value">${data.client?.email || '-'}</span>
                    </div>
                </div>
                
                <!-- Livraison -->
                <div class="info-card">
                    <h3 class="card-title">🚚 Livraison</h3>
                    <div class="info-item">
                        <span class="info-label">Date prévue :</span>
                        <span class="info-value">${this.formatDate(data.dates?.livraisonPrevue)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Magasin :</span>
                        <span class="info-value">${data.magasinLivraison || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type :</span>
                        <span class="info-value">${typeLabel}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Urgence :</span>
                        <span class="info-value">
                            <span class="badge badge-${data.niveauUrgence}">
                                ${urgenceLabel}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Produits -->
            <div class="info-card">
                <h3 class="card-title">📦 Produits commandés (${data.produits?.length || 0})</h3>
                <div class="product-list">
                    ${(data.produits || []).map(produit => `
                        <div class="product-item">
                            <div class="product-main">
                                <div class="product-qty">${produit.quantite || 1}</div>
                                <div>
                                    <div class="product-name">
                                        ${produit.designation}
                                        ${produit.cote ? `- ${produit.cote.toUpperCase()}` : ''}
                                    </div>
                                    <div class="product-ref">
                                        Réf: ${produit.reference} 
                                        ${produit.numeroSerie ? `| N°: ${produit.numeroSerie}` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${data.commentaires ? `
                <div class="info-card">
                    <h3 class="card-title">💬 Commentaires</h3>
                    <p style="font-style: italic; color: #495057;">${data.commentaires}</p>
                </div>
            ` : ''}
            
            ${data.expedition?.envoi?.numeroSuivi ? `
                <div class="info-card">
                    <h3 class="card-title">🚚 Expédition</h3>
                    <div class="info-item">
                        <span class="info-label">Transporteur :</span>
                        <span class="info-value">${data.expedition.envoi.transporteur}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">N° suivi :</span>
                        <span class="info-value" style="font-family: monospace;">
                            ${data.expedition.envoi.numeroSuivi}
                        </span>
                    </div>
                </div>
            ` : ''}
            
            <footer class="doc-footer">
                Document généré le ${new Date().toLocaleString('fr-FR')} - ${this.config.companyName}
            </footer>
        `;
    }
    
    /**
     * Génère le logo SVG
     */
    getLogo() {
        if (!this.config.companyLogo) return '';
        
        return `
            <svg class="company-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${this.config.colors.primary};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${this.config.colors.secondary};stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#logoGrad)" opacity="0.1"/>
                <path d="M 20 50 Q 30 30, 40 50 T 60 50 T 80 50" 
                      stroke="url(#logoGrad)" stroke-width="4" fill="none" stroke-linecap="round"/>
                <circle cx="30" cy="35" r="3" fill="url(#logoGrad)"/>
                <circle cx="50" cy="50" r="4" fill="url(#logoGrad)"/>
                <circle cx="70" cy="35" r="3" fill="url(#logoGrad)"/>
            </svg>
        `;
    }
    
    /**
     * Formate une date
     */
    formatDate(dateValue) {
        if (!dateValue) return '-';
        
        let date;
        if (dateValue.toDate) {
            date = dateValue.toDate();
        } else if (dateValue.seconds) {
            date = new Date(dateValue.seconds * 1000);
        } else {
            date = new Date(dateValue);
        }
        
        return date.toLocaleDateString('fr-FR');
    }
}

export default PrintWidget;