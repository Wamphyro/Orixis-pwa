// ========================================
// FACTURES-FOURNISSEURS.OPENAI.SERVICE.JS - 🤖 EXTRACTION IA
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des factures fournisseurs via OpenAI GPT-4
// Adapté pour extraire les données spécifiques aux factures
//
// FONCTIONS PUBLIQUES:
// - analyserDocument(documentUrl, documentType) : Analyser une facture
// - analyserDocumentExistant(factureId) : Analyser une facture existante
// - extractFactureData(images) : Extraire les données via GPT-4
//
// DÉPENDANCES:
// - OpenAI API (GPT-4.1-mini avec vision)
// - Firebase Storage pour récupérer les documents
// ========================================

import { determinerCategorieFournisseur, calculerDateEcheance } from './factures-fournisseurs.data.js';
import { ProgressBar } from '../../src/components/ui/progress-bar/progress-bar.component.js';

// ========================================
// CONFIGURATION
// ========================================

// Configuration de la Cloud Function
const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument';

// ========================================
// SERVICE PRINCIPAL
// ========================================

export class FactureOpenAIService {
    
    /**
     * Analyser une facture fournisseur
     * @param {string} documentUrl - URL du document dans Firebase Storage
     * @param {string} documentType - Type MIME du document
     * @returns {Promise<Object>} Données extraites formatées pour Firestore
     */
    static async analyserDocument(documentUrl, documentType) {
        try {
            console.log('🤖 Début analyse IA de la facture...');
            
            // Convertir le document en image(s) base64
            const images = await this.prepareDocumentImages(documentUrl, documentType);
            
            // Extraire les données via GPT-4
            console.log('🚀 Appel extractFactureData');
            const donneesExtraites = await FactureOpenAIService.extractFactureData(images);
            
            // Formater pour notre structure Firestore
            const donneesFormatees = this.formaterPourFirestore(donneesExtraites);
            
            console.log('✅ Analyse IA terminée avec succès');
            return donneesFormatees;
            
        } catch (error) {
            console.error('❌ Erreur analyse IA:', error);
            throw new Error(`Erreur analyse IA: ${error.message}`);
        }
    }
    
    /**
     * Extraire les données via GPT-4 Vision
     * @param {Array<string>} images - Images en base64
     * @returns {Promise<Object>} Données brutes extraites
     */
    static async extractFactureData(images) {
        try {
            console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
            
            // PROMPT SPÉCIFIQUE POUR FACTURES FOURNISSEURS
            const prompt = `Tu es un expert en traitement de factures fournisseurs.
Tu analyses ${images.length} ${images.length > 1 ? 'pages' : 'image'} d'une facture et tu dois retourner UNIQUEMENT un objet JSON valide, sans aucun texte ni balise.

${images.length > 1 ? 'IMPORTANT : Ces images représentent les pages successives du MÊME document. Tu dois combiner les informations de toutes les pages pour extraire les données complètes de la facture.' : ''}

FORMAT JSON OBLIGATOIRE :
{
    "timestamp_analyse": "yyyy-MM-ddTHH:mm:ss",
    "fournisseur": {
        "nom": "string",
        "adresse": "string",
        "siren": "string",
        "numeroTVA": "string",
        "telephone": "string",
        "email": "string"
    },
    "client": {
        "nom": "string",
        "numeroClient": "string",
        "adresse": "string"
    },
    "facture": {
        "numeroFacture": "string",
        "dateFacture": "yyyy-MM-dd",
        "dateEcheance": "yyyy-MM-dd",
        "periodeDebut": "yyyy-MM-dd",
        "periodeFin": "yyyy-MM-dd",
        "typeFacture": "string"
    },
    "montants": {
        "montantHT": 0.00,
        "tauxTVA": 20,
        "montantTVA": 0.00,
        "montantTTC": 0.00,
        "details": [{
            "description": "string",
            "quantite": 0,
            "prixUnitaire": 0.00,
            "montant": 0.00
        }]
    },
    "informations": {
        "modePaiement": "string",
        "iban": "string",
        "bic": "string",
        "referenceMandat": "string"
    }
}

EXTRACTION DU FOURNISSEUR :
- Nom : Rechercher en haut de la facture (logo, en-tête)
- SIREN/SIRET : Format 9 ou 14 chiffres
- N° TVA : Format FR + 11 caractères
- Exemples : FREE, EDF, ORANGE, ENGIE, etc.

EXTRACTION DU CLIENT :
- C'est NOUS (le destinataire de la facture)
- Chercher "Adressé à", "Client", "Titulaire"
- IMPORTANT : Le numéro client est NOTRE numéro chez le fournisseur

EXTRACTION DES DATES :
- Date facture : "Date de facture", "Émise le", "Date"
- Date échéance : "À payer avant le", "Échéance", "Date limite"
- Si pas d'échéance : ajouter 30 jours à la date facture
- Période : Pour abonnements (télécom, énergie), chercher "Période du X au Y"

EXTRACTION DES MONTANTS :
- Toujours extraire HT, TVA et TTC
- Si seulement TTC visible : calculer HT = TTC / 1.20
- Identifier le taux de TVA (20%, 10%, 5.5%, 2.1%)
- Détails : lignes de facturation si visibles

SPÉCIFICITÉS PAR TYPE :
- TÉLÉCOM (Free, Orange, SFR) : 
  * Numéro de ligne
  * Période d'abonnement
  * Détail consommations
  
- ÉNERGIE (EDF, Engie) :
  * Point de livraison (PDL)
  * Index de consommation
  * Type de contrat
  
- SERVICES/CLOUD :
  * Identifiant compte
  * Période de service
  * Détail des services

INFORMATIONS PAIEMENT :
- Mode : "Prélèvement", "Virement", "Chèque"
- IBAN/BIC si virement demandé
- Référence mandat si prélèvement

IMPORTANT :
- Dates au format ISO (yyyy-MM-dd)
- Montants en décimal (pas de symbole €)
- Textes sans accents dans le JSON
- Si information manquante : null

VALIDATION :
- Le numéro de facture est OBLIGATOIRE
- La date de facture est OBLIGATOIRE
- Le montant TTC est OBLIGATOIRE
- Le nom du fournisseur est OBLIGATOIRE`;
            
            console.log('📤 Envoi à la Cloud Function');
            
            // Préparer le body de la requête
            const requestBody = {
                images: images,
                prompt: prompt,
                type: 'facture'
            };
            
            // Appeler la Cloud Function
            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur Cloud Function');
            }
            
            const result = await response.json();
            
            console.log('✅ Réponse Cloud Function:', result);
            
            // Retourner simplement les données sans ajouter de champs supplémentaires
            return result.data || {};
            
        } catch (error) {
            console.error('❌ Erreur appel Cloud Function:', error);
            throw error;
        }
    }
    
    /**
     * Analyser une facture déjà existante
     * @param {string} factureId - ID de la facture
     * @returns {Promise<Object>} Données mises à jour
     */
    static async analyserDocumentExistant(factureId) {
        try {
            // Récupérer la facture
            const firestoreService = await import('./factures-fournisseurs.firestore.service.js');
            const facture = await firestoreService.getFactureById(factureId);
            
            if (!facture) {
                throw new Error('Facture introuvable');
            }
            
            if (!facture.documents || facture.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // Analyser le premier document
            const document = facture.documents[0];
            const donneesExtraites = await this.analyserDocument(
                document.url,
                document.type
            );
            
            // Mettre à jour la facture
            await firestoreService.ajouterDonneesExtraites(factureId, donneesExtraites);
            
            return {
                factureId,
                donneesExtraites,
                documentAnalyse: document.nom
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse facture existante:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Préparer les images du document
     * @private
     */
    static async prepareDocumentImages(documentUrl, documentType) {
        console.log('📄 Type de document:', documentType);
        
        try {
            // Si c'est une image, traitement normal
            if (documentType.startsWith('image/')) {
                const response = await fetch(documentUrl);
                const blob = await response.blob();
                
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                
                console.log('✅ Image convertie en base64');
                return [base64];
            }
            
            // Si c'est un PDF, utiliser PDF.js
            if (documentType === 'application/pdf') {
                console.log('📑 Conversion PDF vers images avec PDF.js...');
                
                // Afficher un message d'attente
                if (window.config && window.config.notify) {
                    window.config.notify.info('Conversion du PDF en cours...');
                }
                
                // Charger le PDF
                const loadingTask = pdfjsLib.getDocument(documentUrl);
                const pdf = await loadingTask.promise;
                
                console.log(`📄 PDF chargé : ${pdf.numPages} pages`);
                
                const images = [];
                const maxPages = Math.min(pdf.numPages, 5); // Limiter à 5 pages max pour GPT-4
                
                // Créer une progress bar si possible
                let progressBar = null;
                const progressContainer = document.getElementById('pdf-conversion-progress');
                
                if (progressContainer) {
                    progressContainer.style.display = 'block';
                    progressBar = new ProgressBar({
                        container: progressContainer,
                        label: 'Conversion du PDF en images...',
                        sublabel: `0 page sur ${maxPages}`,
                        showPercent: true,
                        animated: true,
                        variant: 'primary'
                    });
                }
                
                // Convertir chaque page
                for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                    console.log(`🔄 Conversion page ${pageNum}/${maxPages}...`);
                    
                    // Mettre à jour la progress bar
                    if (progressBar) {
                        progressBar.setProgress(((pageNum - 1) / maxPages) * 100);
                        progressBar.setSublabel(`Page ${pageNum} sur ${maxPages}`);
                    }
                    
                    const page = await pdf.getPage(pageNum);
                    
                    // Définir l'échelle (2 = 200% pour une meilleure qualité)
                    const scale = 2;
                    const viewport = page.getViewport({ scale });
                    
                    // Créer un canvas
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Render la page PDF dans le canvas
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    
                    await page.render(renderContext).promise;
                    
                    // Convertir le canvas en base64 (JPEG pour réduire la taille)
                    const base64 = await new Promise((resolve) => {
                        canvas.toBlob((blob) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64 = reader.result.split(',')[1];
                                resolve(base64);
                            };
                            reader.readAsDataURL(blob);
                        }, 'image/jpeg', 0.85); // Qualité 85%
                    });
                    
                    images.push(base64);
                    
                    // Nettoyer le canvas
                    canvas.remove();
                    
                    // Mettre à jour la progress bar
                    if (progressBar) {
                        progressBar.setProgress((pageNum / maxPages) * 100);
                    }
                }
                
                // Finaliser la progress bar
                if (progressBar) {
                    progressBar.complete();
                    progressBar.setLabel('Conversion terminée !');
                    
                    // Masquer après 1 seconde
                    setTimeout(() => {
                        progressBar.destroy();
                        if (progressContainer) {
                            progressContainer.style.display = 'none';
                        }
                    }, 1000);
                }
                
                console.log(`✅ PDF converti : ${images.length} images générées`);
                
                if (pdf.numPages > maxPages) {
                    console.warn(`⚠️ PDF tronqué : seulement ${maxPages} pages sur ${pdf.numPages} converties`);
                    if (window.config && window.config.notify) {
                        window.config.notify.warning(`PDF tronqué : ${maxPages} pages analysées sur ${pdf.numPages}`);
                    }
                }
                
                return images;
            }
            
            throw new Error(`Type de document non supporté : ${documentType}`);
            
        } catch (error) {
            console.error('❌ Erreur conversion document:', error);
            
            // Fallback : essayer de traiter comme une image
            if (documentType === 'application/pdf') {
                console.warn('⚠️ Échec PDF.js, tentative de fallback...');
                throw new Error('Impossible de convertir le PDF. Vérifiez qu\'il n\'est pas protégé.');
            }
            
            throw error;
        }
    }
    
    /**
     * Formater les données pour Firestore
     * @private
     */
    static formaterPourFirestore(donneesBrutes) {
        // Déterminer la catégorie du fournisseur
        const nomFournisseur = donneesBrutes.fournisseur?.nom || '';
        const categorie = determinerCategorieFournisseur(nomFournisseur);
        
        // Calculer la date d'échéance si manquante
        let dateEcheance = donneesBrutes.facture?.dateEcheance;
        if (!dateEcheance && donneesBrutes.facture?.dateFacture) {
            const dateFacture = new Date(donneesBrutes.facture.dateFacture);
            dateEcheance = calculerDateEcheance(dateFacture);
        }
        
        return {
            // Fournisseur
            fournisseur: {
                nom: donneesBrutes.fournisseur?.nom || null,
                categorie: categorie,
                numeroClient: donneesBrutes.client?.numeroClient || null,
                siren: this.nettoyerSiren(donneesBrutes.fournisseur?.siren)
            },
            
            // Numéro de facture
            numeroFacture: donneesBrutes.facture?.numeroFacture || null,
            
            // Montants
            montantHT: donneesBrutes.montants?.montantHT || 0,
            montantTVA: donneesBrutes.montants?.montantTVA || 0,
            montantTTC: donneesBrutes.montants?.montantTTC || 0,
            tauxTVA: donneesBrutes.montants?.tauxTVA || 20,
            
            // Dates
            dateFacture: this.parseDate(donneesBrutes.facture?.dateFacture),
            dateEcheance: this.parseDate(dateEcheance),
            
            // Période facturée (pour abonnements)
            periodeDebut: this.parseDate(donneesBrutes.facture?.periodeDebut),
            periodeFin: this.parseDate(donneesBrutes.facture?.periodeFin),
            
            // Informations de paiement
            modePaiement: this.determinerModePaiement(donneesBrutes.informations?.modePaiement),
            
            // Métadonnées
            extractionIA: {
                timestamp: donneesBrutes.timestamp_analyse,
                modele: 'gpt-4o-mini',
                fournisseurDetecte: donneesBrutes.fournisseur?.nom,
                typeFacture: donneesBrutes.facture?.typeFacture,
                // NOUVEAU : Inclure TOUTES les données brutes extraites
                donneesBrutes: donneesBrutes
            }
        };
    }
    
    /**
     * Nettoyer un SIREN/SIRET
     * @private
     */
    static nettoyerSiren(siren) {
        if (!siren) return null;
        const cleaned = String(siren).replace(/\D/g, '');
        return (cleaned.length === 9 || cleaned.length === 14) ? cleaned : null;
    }
    
    /**
     * Déterminer le mode de paiement
     * @private
     */
    static determinerModePaiement(modeBrut) {
        if (!modeBrut) return null;
        
        const mode = modeBrut.toLowerCase();
        
        if (mode.includes('prelevement') || mode.includes('prélèvement')) {
            return 'prelevement';
        } else if (mode.includes('virement')) {
            return 'virement';
        } else if (mode.includes('cheque') || mode.includes('chèque')) {
            return 'cheque';
        } else if (mode.includes('carte') || mode.includes('cb')) {
            return 'cb';
        }
        
        return null;
    }
    
    /**
     * Parser une date
     * @private
     */
    static parseDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    analyserDocument: FactureOpenAIService.analyserDocument.bind(FactureOpenAIService),
    analyserDocumentExistant: FactureOpenAIService.analyserDocumentExistant.bind(FactureOpenAIService),
    extractFactureData: FactureOpenAIService.extractFactureData.bind(FactureOpenAIService)
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création adaptée pour factures
   - Prompt spécifique factures fournisseurs
   - Extraction fournisseur, dates, montants
   - Détection automatique de la catégorie
   - Calcul échéance si manquante
   
   NOTES POUR REPRISES FUTURES:
   - Le prompt est optimisé pour les factures FR
   - Gestion des spécificités par type (télécom, énergie)
   - La catégorie est déterminée automatiquement
   ======================================== */