// ========================================
// FACTURES-FOURNISSEURS.OPENAI.SERVICE.JS - 🤖 EXTRACTION IA
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des factures fournisseurs via OpenAI GPT-4
// Adapté pour extraire les données spécifiques aux factures
// Architecture identique à decompte-mutuelle
// ========================================

import { ProgressBar } from '../../src/components/ui/progress-bar/progress-bar.component.js';

// ========================================
// CONFIGURATION
// ========================================

// Configuration de la Cloud Function
const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument';

// ========================================
// SERVICE PRINCIPAL
// ========================================

/**
 * Analyser une facture fournisseur
 */
export async function analyserDocument(documentUrl, documentType) {
    try {
        console.log('🤖 Début analyse IA de la facture...');
        
        // Convertir le document en image(s) base64
        const images = await prepareDocumentImages(documentUrl, documentType);
        
        // Extraire les données via GPT-4
        console.log('🚀 Appel extraction IA...');
        const donneesExtraites = await extractFactureData(images);
        
        // Formater pour notre structure Firestore
        const donneesFormatees = formaterPourFirestore(donneesExtraites);
        
        console.log('✅ Analyse IA terminée avec succès');
        return donneesFormatees;
        
    } catch (error) {
        console.error('❌ Erreur analyse IA:', error);
        throw new Error(`Erreur analyse IA: ${error.message}`);
    }
}

/**
 * Analyser directement avec un fichier (sans URL)
 */
export async function analyserAvecFichier(file, magasins = []) {
    try {
        console.log('🤖 Analyse directe du fichier:', file.name);
        
        // Convertir le fichier en base64
        const base64 = await fileToBase64(file);
        
        // Si c'est un PDF, le convertir en images
        let images = [];
        if (file.type === 'application/pdf') {
            images = await convertPdfToImages(file);
        } else {
            images = [base64];
        }
        
        // Extraire les données
        const donneesExtraites = await extractFactureData(images);
        
        // Formater pour Firestore
        return formaterPourFirestore(donneesExtraites);
        
    } catch (error) {
        console.error('❌ Erreur analyse fichier:', error);
        throw error;
    }
}

/**
 * Extraire les données via GPT-4 Vision
 */
async function extractFactureData(images) {
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
        "montantTTC": 0.00
    },
    "informations": {
        "modePaiement": "string",
        "iban": "string",
        "bic": "string",
        "referenceMandat": "string"
    }
}

RÈGLES D'EXTRACTION :

FOURNISSEUR :
- Nom : En haut de la facture (logo, en-tête)
- SIREN/SIRET : Format 9 ou 14 chiffres
- N° TVA : Format FR + 11 caractères

CLIENT :
- C'est NOUS (le destinataire de la facture)
- Le numéro client est NOTRE numéro chez le fournisseur

DATES :
- Date facture : "Date de facture", "Émise le"
- Date échéance : "À payer avant le", "Échéance"
- Si pas d'échéance : ajouter 30 jours à la date facture
- Période : Pour abonnements, chercher "Période du X au Y"

MONTANTS :
- Toujours extraire HT, TVA et TTC
- Si seulement TTC visible : calculer HT = TTC / 1.20
- Identifier le taux de TVA (20%, 10%, 5.5%, 2.1%)

IMPORTANT :
- Dates au format ISO (yyyy-MM-dd)
- Montants en décimal (pas de symbole €)
- Si information manquante : null`;
        
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
        
        return result.data || {};
        
    } catch (error) {
        console.error('❌ Erreur appel Cloud Function:', error);
        throw error;
    }
}

// ========================================
// MÉTHODES UTILITAIRES
// ========================================

/**
 * Préparer les images du document
 */
async function prepareDocumentImages(documentUrl, documentType) {
    console.log('📄 Type de document:', documentType);
    
    try {
        // Si c'est une image
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
        
        // Si c'est un PDF
        if (documentType === 'application/pdf') {
            console.log('📑 Conversion PDF vers images...');
            
            // Charger le PDF
            const loadingTask = pdfjsLib.getDocument(documentUrl);
            const pdf = await loadingTask.promise;
            
            console.log(`📄 PDF chargé : ${pdf.numPages} pages`);
            
            const images = [];
            const maxPages = Math.min(pdf.numPages, 5); // Limiter à 5 pages
            
            // Convertir chaque page
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                console.log(`🔄 Conversion page ${pageNum}/${maxPages}...`);
                
                const page = await pdf.getPage(pageNum);
                
                // Définir l'échelle
                const scale = 2;
                const viewport = page.getViewport({ scale });
                
                // Créer un canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render la page
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Convertir en base64
                const base64 = await new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64 = reader.result.split(',')[1];
                            resolve(base64);
                        };
                        reader.readAsDataURL(blob);
                    }, 'image/jpeg', 0.85);
                });
                
                images.push(base64);
                
                // Nettoyer
                canvas.remove();
            }
            
            console.log(`✅ PDF converti : ${images.length} images`);
            
            return images;
        }
        
        throw new Error(`Type de document non supporté : ${documentType}`);
        
    } catch (error) {
        console.error('❌ Erreur conversion document:', error);
        throw error;
    }
}

/**
 * Convertir un fichier en base64
 */
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Convertir un PDF en images
 */
async function convertPdfToImages(file) {
    try {
        // Créer une URL temporaire pour le fichier
        const fileUrl = URL.createObjectURL(file);
        
        // Charger le PDF
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        
        const images = [];
        const maxPages = Math.min(pdf.numPages, 5);
        
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            const scale = 2;
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const base64 = await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64 = reader.result.split(',')[1];
                        resolve(base64);
                    };
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', 0.85);
            });
            
            images.push(base64);
            canvas.remove();
        }
        
        // Libérer l'URL
        URL.revokeObjectURL(fileUrl);
        
        return images;
        
    } catch (error) {
        console.error('❌ Erreur conversion PDF:', error);
        throw error;
    }
}

/**
 * Formater les données pour Firestore
 */
function formaterPourFirestore(donneesBrutes) {
    // Déterminer la catégorie du fournisseur
    const nomFournisseur = donneesBrutes.fournisseur?.nom || '';
    const categorie = determinerCategorieFournisseur(nomFournisseur);
    
    // Calculer la date d'échéance si manquante
    let dateEcheance = donneesBrutes.facture?.dateEcheance;
    if (!dateEcheance && donneesBrutes.facture?.dateFacture) {
        const dateFacture = new Date(donneesBrutes.facture.dateFacture);
        dateFacture.setDate(dateFacture.getDate() + 30);
        dateEcheance = dateFacture.toISOString().split('T')[0];
    }
    
    return {
        // Fournisseur
        fournisseur: {
            nom: donneesBrutes.fournisseur?.nom || null,
            categorie: categorie,
            numeroClient: donneesBrutes.client?.numeroClient || null,
            siren: nettoyerSiren(donneesBrutes.fournisseur?.siren)
        },
        
        // Numéro de facture
        numeroFacture: donneesBrutes.facture?.numeroFacture || null,
        
        // Montants
        montantHT: donneesBrutes.montants?.montantHT || 0,
        montantTVA: donneesBrutes.montants?.montantTVA || 0,
        montantTTC: donneesBrutes.montants?.montantTTC || 0,
        tauxTVA: donneesBrutes.montants?.tauxTVA || 20,
        
        // Dates
        dateFacture: parseDate(donneesBrutes.facture?.dateFacture),
        dateEcheance: parseDate(dateEcheance),
        
        // Période facturée
        periodeDebut: parseDate(donneesBrutes.facture?.periodeDebut),
        periodeFin: parseDate(donneesBrutes.facture?.periodeFin),
        
        // Mode de paiement
        modePaiement: determinerModePaiement(donneesBrutes.informations?.modePaiement),
        
        // Métadonnées
        extractionIA: {
            timestamp: donneesBrutes.timestamp_analyse,
            modele: 'gpt-4.1-mini',
            fournisseurDetecte: donneesBrutes.fournisseur?.nom,
            donneesBrutes: donneesBrutes
        }
    };
}

/**
 * Déterminer la catégorie d'un fournisseur
 */
function determinerCategorieFournisseur(nomFournisseur) {
    const nom = nomFournisseur.toUpperCase();
    
    if (nom.includes('FREE') || nom.includes('ORANGE') || nom.includes('SFR') || nom.includes('BOUYGUES')) {
        return 'telecom';
    }
    
    if (nom.includes('EDF') || nom.includes('ENGIE') || nom.includes('TOTAL')) {
        return 'energie';
    }
    
    if (nom.includes('MICROSOFT') || nom.includes('ADOBE') || nom.includes('OVH') || nom.includes('GOOGLE')) {
        return 'informatique';
    }
    
    return 'autre';
}

/**
 * Nettoyer un SIREN/SIRET
 */
function nettoyerSiren(siren) {
    if (!siren) return null;
    const cleaned = String(siren).replace(/\D/g, '');
    return (cleaned.length === 9 || cleaned.length === 14) ? cleaned : null;
}

/**
 * Déterminer le mode de paiement
 */
function determinerModePaiement(modeBrut) {
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
 */
function parseDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

// ========================================
// EXPORT
// ========================================

export default {
    analyserDocument,
    analyserAvecFichier,
    extractFactureData
};