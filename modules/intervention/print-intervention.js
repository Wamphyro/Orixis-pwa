// ========================================
// PRINT-INTERVENTION.JS - Impression des fiches d'intervention
// Chemin: modules/intervention/print-intervention.js
// ========================================

import PrintWidget from '../../widgets/print/print.widget.js';
import { InterventionService } from '../../src/services/intervention.service.js';
import { INTERVENTION_CONFIG } from '../../src/data/intervention.data.js';

/**
 * Classe pour gérer l'impression des interventions SAV
 */
export class InterventionPrinter {
    constructor() {
        this.intervention = null;
        this.printer = null;
    }
    
    /**
     * Charge et imprime une intervention
     */
    async printIntervention(interventionId) {
        try {
            // Charger l'intervention depuis Firebase
            this.intervention = await InterventionService.getIntervention(interventionId);
            
            if (!this.intervention) {
                throw new Error('Intervention introuvable');
            }
            
            // Créer le widget d'impression
            this.printer = new PrintWidget({
                title: `Fiche Intervention ${this.intervention.numeroIntervention}`,
                template: 'intervention',
                data: this.intervention,
                companyName: 'SAV Audio Orixis',
                colors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444'
                },
                onBeforePrint: () => console.log('Impression intervention...'),
                onAfterPrint: () => console.log('Impression terminée')
            });
            
            // Ajouter notre template personnalisé
            this.printer.getTemplateContent = () => this.getInterventionTemplate();
            this.printer.getTemplateStyles = () => this.getInterventionStyles();
            
            // Ouvrir l'aperçu
            this.printer.preview();
            
        } catch (error) {
            console.error('Erreur impression intervention:', error);
            alert('Erreur lors de l\'impression : ' + error.message);
        }
    }
    
    /**
     * Génère le template HTML de l'intervention
     */
    getInterventionTemplate() {
        const data = this.intervention;
        
        return `
            <!-- EN-TÊTE -->
            <header class="doc-header">
                <div class="company-section">
                    ${this.getLogo()}
                    <div>
                        <div class="company-name">SAV Audio</div>
                        <div class="company-subtitle">Service Après-Vente</div>
                    </div>
                </div>
                <div class="doc-info">
                    <div class="doc-number">${data.numeroIntervention}</div>
                    <div class="doc-date">
                        ${this.formatDateTime(data.dates?.intervention)}
                    </div>
                    <div class="doc-status status-${data.statut}">
                        ${INTERVENTION_CONFIG.STATUTS[data.statut]?.icon} 
                        ${INTERVENTION_CONFIG.STATUTS[data.statut]?.label}
                    </div>
                </div>
            </header>
            
            <h1 class="doc-title">
                📋 FICHE D'INTERVENTION SAV
            </h1>
            
            <div class="info-grid">
                <!-- CLIENT -->
                <div class="info-card">
                    <h3 class="card-title">👤 Client</h3>
                    <div class="info-item">
                        <span class="info-label">Nom :</span>
                        <span class="info-value">${data.client?.prenom || ''} ${data.client?.nom || ''}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Téléphone :</span>
                        <span class="info-value">${data.client?.telephone || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email :</span>
                        <span class="info-value">${data.client?.email || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Magasin :</span>
                        <span class="info-value">${data.magasin || '-'}</span>
                    </div>
                </div>
                
                <!-- APPAREIL -->
                <div class="info-card">
                    <h3 class="card-title">🎧 Appareil</h3>
                    <div class="info-item">
                        <span class="info-label">Type :</span>
                        <span class="info-value">
                            ${INTERVENTION_CONFIG.TYPES_APPAREILS[data.appareil?.type]?.icon || ''} 
                            ${INTERVENTION_CONFIG.TYPES_APPAREILS[data.appareil?.type]?.label || data.appareil?.type}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Marque :</span>
                        <span class="info-value">${data.appareil?.marque || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Modèle :</span>
                        <span class="info-value">${data.appareil?.modele || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">N° Série :</span>
                        <span class="info-value" style="font-family: monospace;">
                            ${data.appareil?.numeroSerie || '-'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- DIAGNOSTIC -->
            <div class="info-card">
                <h3 class="card-title">🔍 Diagnostic</h3>
                
                <div class="diagnostic-section">
                    <h4 class="section-subtitle">Problèmes identifiés :</h4>
                    <div class="items-list">
                        ${(data.problemes || []).map(p => {
                            const config = this.findConfigItem(INTERVENTION_CONFIG.PROBLEMES, p);
                            return `
                                <div class="item-badge">
                                    ${config?.icon || '•'} ${config?.label || p}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="diagnostic-section">
                    <h4 class="section-subtitle">Actions réalisées :</h4>
                    <div class="items-list">
                        ${(data.actions || []).length > 0 ? 
                            data.actions.map(a => {
                                const config = this.findConfigItem(INTERVENTION_CONFIG.ACTIONS, a);
                                return `
                                    <div class="item-badge action">
                                        ${config?.icon || '✓'} ${config?.label || a}
                                    </div>
                                `;
                            }).join('') :
                            '<span class="text-muted">Aucune action enregistrée</span>'
                        }
                    </div>
                </div>
            </div>
            
            <!-- RÉSULTAT -->
            <div class="info-card">
                <h3 class="card-title">📊 Résultat de l'intervention</h3>
                <div class="result-section">
                    <div class="result-badge result-${(data.resultat || '').toLowerCase()}">
                        ${INTERVENTION_CONFIG.RESULTATS[data.resultat]?.icon || ''} 
                        ${INTERVENTION_CONFIG.RESULTATS[data.resultat]?.label || data.resultat || 'Non défini'}
                    </div>
                    ${data.observations ? `
                        <div class="observations">
                            <strong>Observations :</strong>
                            <p>${data.observations}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- SIGNATURES (si terminée) -->
            ${data.statut === 'terminee' && data.signatures ? `
                <div class="info-card signatures-card">
                    <h3 class="card-title">✍️ Signatures</h3>
                    <div class="signatures-grid">
                        <div class="signature-box">
                            <div class="signature-label">Client</div>
                            ${data.signatures.client ? 
                                `<img src="${data.signatures.client}" class="signature-img" alt="Signature client">` :
                                `<div class="signature-placeholder">Non signé</div>`
                            }
                            ${data.dates?.signatureClient ? 
                                `<div class="signature-date">${this.formatDateTime(data.dates.signatureClient)}</div>` : ''
                            }
                        </div>
                        <div class="signature-box">
                            <div class="signature-label">Intervenant</div>
                            ${data.signatures.intervenant ? 
                                `<img src="${data.signatures.intervenant}" class="signature-img" alt="Signature intervenant">` :
                                `<div class="signature-placeholder">Non signé</div>`
                            }
                            ${data.intervenant ? 
                                `<div class="signature-name">${data.intervenant.prenom} ${data.intervenant.nom}</div>` : ''
                            }
                            ${data.dates?.signatureIntervenant ? 
                                `<div class="signature-date">${this.formatDateTime(data.dates.signatureIntervenant)}</div>` : ''
                            }
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- INFORMATIONS COMPLÉMENTAIRES -->
            ${data.savEnvoye ? `
                <div class="info-card alert-card">
                    <div class="alert alert-warning">
                        🔧 Escalade SAV envoyée le ${this.formatDateTime(data.dateSavEnvoye)}
                    </div>
                </div>
            ` : ''}
            
            <!-- PIED DE PAGE -->
            <footer class="doc-footer">
                <div class="footer-info">
                    Document généré le ${new Date().toLocaleString('fr-FR')} - SAV Audio Orixis
                </div>
                <div class="footer-legal">
                    En signant ce document, le client reconnaît avoir pris connaissance des conditions de SAV
                </div>
            </footer>
        `;
    }
    
    /**
     * Styles spécifiques pour l'intervention
     */
    getInterventionStyles() {
        return `
            .doc-title {
                text-align: center;
                font-size: 22px;
                margin: 25px 0;
                color: #2c3e50;
                font-weight: 700;
            }
            
            .company-subtitle {
                font-size: 11px;
                color: #6c757d;
                margin-top: 2px;
            }
            
            .doc-status {
                margin-top: 5px;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                display: inline-block;
            }
            
            .status-nouvelle { background: #e3f2fd; color: #1976d2; }
            .status-en_cours { background: #fff3e0; color: #f57c00; }
            .status-terminee { background: #e8f5e9; color: #388e3c; }
            .status-annulee { background: #ffebee; color: #c62828; }
            
            .section-subtitle {
                font-size: 12px;
                color: #495057;
                margin: 12px 0 8px 0;
                font-weight: 600;
            }
            
            .items-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 12px;
            }
            
            .item-badge {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 4px 10px;
                border-radius: 16px;
                font-size: 11px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .item-badge.action {
                background: #e8f5e9;
                border-color: #81c784;
                color: #2e7d32;
            }
            
            .result-section {
                padding: 10px;
            }
            
            .result-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .result-résolu { background: #d4edda; color: #155724; }
            .result-partiel { background: #fff3cd; color: #856404; }
            .result-sav { background: #f8d7da; color: #721c24; }
            .result-ok { background: #d1ecf1; color: #0c5460; }
            
            .observations {
                margin-top: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
                font-size: 11px;
            }
            
            .observations p {
                margin: 5px 0 0 0;
                font-style: italic;
                color: #495057;
            }
            
            .signatures-card {
                margin-top: 20px;
                page-break-inside: avoid;
            }
            
            .signatures-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 15px;
            }
            
            .signature-box {
                text-align: center;
                padding: 10px;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                background: white;
            }
            
            .signature-label {
                font-size: 12px;
                font-weight: 600;
                color: #495057;
                margin-bottom: 10px;
                text-transform: uppercase;
            }
            
            .signature-img {
                max-width: 150px;
                max-height: 60px;
                margin: 10px auto;
                border: 1px solid #dee2e6;
                padding: 5px;
                border-radius: 4px;
            }
            
            .signature-placeholder {
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px dashed #dee2e6;
                border-radius: 4px;
                color: #adb5bd;
                font-size: 11px;
                margin: 10px 0;
            }
            
            .signature-name {
                font-size: 11px;
                font-weight: 600;
                color: #2c3e50;
                margin-top: 5px;
            }
            
            .signature-date {
                font-size: 10px;
                color: #6c757d;
                margin-top: 3px;
            }
            
            .alert-card {
                margin-top: 15px;
            }
            
            .alert {
                padding: 10px 15px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .alert-warning {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .footer-legal {
                font-size: 9px;
                color: #adb5bd;
                margin-top: 5px;
                font-style: italic;
            }
            
            .text-muted {
                color: #6c757d;
                font-style: italic;
                font-size: 11px;
            }
            
            @media print {
                .doc-title {
                    font-size: 18px;
                    margin: 15px 0;
                }
                
                .info-card {
                    page-break-inside: avoid;
                }
                
                .signatures-card {
                    page-break-before: auto;
                }
            }
        `;
    }
    
    /**
     * Génère le logo SVG
     */
    getLogo() {
        return `
            <svg class="company-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="interventionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="url(#interventionGrad)" opacity="0.1"/>
                <path d="M35 50 L45 40 L55 50 L65 35" 
                      stroke="url(#interventionGrad)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="35" cy="50" r="3" fill="url(#interventionGrad)"/>
                <circle cx="45" cy="40" r="3" fill="url(#interventionGrad)"/>
                <circle cx="55" cy="50" r="3" fill="url(#interventionGrad)"/>
                <circle cx="65" cy="35" r="3" fill="url(#interventionGrad)"/>
                <path d="M30 60 L70 60" stroke="url(#interventionGrad)" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }
    
    /**
     * Formate une date avec heure
     */
    formatDateTime(dateValue) {
        if (!dateValue) return '-';
        
        let date;
        if (dateValue.toDate) {
            date = dateValue.toDate();
        } else if (dateValue.seconds) {
            date = new Date(dateValue.seconds * 1000);
        } else {
            date = new Date(dateValue);
        }
        
        return date.toLocaleDateString('fr-FR') + ' à ' + 
               date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    
    /**
     * Trouve la configuration d'un item
     */
    findConfigItem(config, label) {
        return Object.values(config).find(item => 
            item.label === label || item.label.includes(label)
        );
    }
}

// Export global pour utilisation directe
window.InterventionPrinter = InterventionPrinter;

// Fonction globale pour l'impression
window.printIntervention = async function(interventionId) {
    const printer = new InterventionPrinter();
    await printer.printIntervention(interventionId);
};

export default InterventionPrinter;