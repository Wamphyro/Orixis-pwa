// ========================================
// DECOMPTE-MUTUELLE.OPENAI.SERVICE.JS - 🤖 SERVICE ANALYSE IA
// Chemin: modules/test/decompte-mutuelle.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des décomptes mutuelles via OpenAI GPT-4
// Conversion PDF → Images avec PDF.js
// Extraction des données structurées
//
// FONCTIONS PUBLIQUES:
// - analyserDocument(documentUrl, documentType, magasins) : Analyser un document
// - extractDecompteData(images, magasins) : Extraire via GPT-4
// - prepareDocumentImages(documentUrl, documentType) : Convertir en images
// ========================================

import { ProgressBar } from '../../src/components/ui/progress-bar/progress-bar.component.js';

// ========================================
// CONFIGURATION
// ========================================

const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument';

// ========================================
// CLASSE DU SERVICE
// ========================================

export class DecompteOpenAIService {
    
    /**
     * Analyser un document complet
     * @param {string} documentUrl - URL du document dans Firebase Storage
     * @param {string} documentType - Type MIME du document
     * @param {Array} magasinsData - Données des magasins pour FINESS
     * @returns {Promise<Object>} Données extraites formatées
     */
    static async analyserDocument(documentUrl, documentType, magasinsData = []) {
        try {
            console.log('🤖 Début analyse document...');
            
            // Préparer le tableau des magasins au format attendu
            let magasinsArray = [];
            
            if (!Array.isArray(magasinsData) && typeof magasinsData === 'object') {
                magasinsArray = Object.entries(magasinsData).map(([code, data]) => ({
                    "FINESS": data.numeroFINESS || data.finess || data.FINESS || '',
                    "CODE MAGASIN": code,
                    "SOCIETE": data.societe?.raisonSociale || data.societe || data.nom || '',
                    "ADRESSE": `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                    "VILLE": data.adresse?.ville || data.ville || ''
                }));
            } else if (Array.isArray(magasinsData)) {
                magasinsArray = magasinsData;
            }
            
            // Convertir le document en image(s) base64
            const images = await this.prepareDocumentImages(documentUrl, documentType);
            
            // Extraire les données via GPT-4
            const donneesExtraites = await this.extractDecompteData(images, magasinsArray);
            
            // Formater pour notre structure Firestore
            const donneesFormatees = this.formaterDonneesIA(donneesExtraites);
            
            return donneesFormatees;
            
        } catch (error) {
            console.error('❌ Erreur analyse document:', error);
            throw new Error(`Erreur analyse: ${error.message}`);
        }
    }
    
    /**
     * Analyser avec un fichier direct (sans URL)
     * @param {File} file - Fichier à analyser
     * @param {Array} magasinsData - Données des magasins
     * @returns {Promise<Object>} Données extraites
     */
    static async analyserAvecFichier(file, magasinsData = []) {
        try {
            console.log('🤖 Analyse directe du fichier:', file.name);
            
            // Préparer les magasins
            let magasinsArray = Array.isArray(magasinsData) ? magasinsData : [];
            
            // Convertir le fichier
            const images = await this.convertirFichierEnImages(file);
            
            // Extraire les données
            const donneesExtraites = await this.extractDecompteData(images, magasinsArray);
            
            // Formater
            return this.formaterDonneesIA(donneesExtraites);
            
        } catch (error) {
            console.error('❌ Erreur analyse fichier:', error);
            throw error;
        }
    }
    
    /**
     * Préparer les images du document (avec conversion PDF si nécessaire)
     * @param {string} documentUrl - URL du document
     * @param {string} documentType - Type MIME
     * @returns {Promise<Array<string>>} Images en base64
     */
    static async prepareDocumentImages(documentUrl, documentType) {
        console.log('📄 Type de document:', documentType);
        console.log('🔗 URL document:', documentUrl);
        
        try {
            // Si c'est une image, traitement normal
            if (documentType.startsWith('image/')) {
                const response = await fetch(documentUrl);
                if (!response.ok) {
                    throw new Error(`Erreur téléchargement: ${response.status}`);
                }
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
                
                // Vérifier que PDF.js est chargé
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF.js non chargé. Ajoutez <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script> dans votre HTML');
                }
                
                // Afficher un message d'attente
                if (window.config && window.config.notify) {
                    window.config.notify.info('Conversion du PDF en cours...');
                }
                
                // Télécharger le PDF d'abord pour éviter CORS
                console.log('📥 Téléchargement du PDF...');
                const response = await fetch(documentUrl);
                if (!response.ok) {
                    throw new Error(`Erreur téléchargement PDF: ${response.status}`);
                }
                
                const pdfBlob = await response.blob();
                const pdfArrayBuffer = await pdfBlob.arrayBuffer();
                
                // Charger le PDF depuis l'ArrayBuffer
                console.log('📖 Chargement du PDF depuis ArrayBuffer...');
                const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
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
            throw error;
        }
    }
    
    /**
     * Convertir un fichier File en images (pour analyse directe)
     * @param {File} file - Fichier à convertir
     * @returns {Promise<Array<string>>} Images en base64
     */
    static async convertirFichierEnImages(file) {
        console.log('📄 Conversion fichier:', file.name, file.type);
        
        // Si c'est une image
        if (file.type.startsWith('image/')) {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            return [base64];
        }
        
        // Si c'est un PDF
        if (file.type === 'application/pdf') {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js non chargé');
            }
            
            // Créer une URL temporaire pour le fichier
            const fileUrl = URL.createObjectURL(file);
            
            try {
                // Utiliser la méthode existante
                const images = await this.prepareDocumentImages(fileUrl, file.type);
                return images;
            } finally {
                // Nettoyer l'URL temporaire
                URL.revokeObjectURL(fileUrl);
            }
        }
        
        throw new Error(`Type de fichier non supporté: ${file.type}`);
    }
    
    /**
     * Extraire les données via GPT-4 Vision
     * @param {Array<string>} images - Images en base64
     * @param {Array} magasinsArray - Tableau des magasins
     * @returns {Promise<Object>} Données brutes extraites
     */
    static async extractDecompteData(images, magasinsArray = []) {
        try {
            console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
            
            // Préparer la chaîne JSON des magasins
            const magasinsJSON = JSON.stringify(magasinsArray, null, 2);
            
            // PROMPT COMPLET pour décomptes mutuelles
            const prompt = `Tu es un expert en traitement des relevés de remboursement des réseaux de soins et mutuelles.
Tu analyses ${images.length} image(s) d'un document PDF et tu dois retourner UNIQUEMENT un objet JSON valide, sans aucun texte ni balise.

FORMAT JSON OBLIGATOIRE :
{
  "timestamp_analyse": "yyyy-MM-ddTHH:mm:ss",
  "societe": "string",
  "centre": "string",
  "periode": "yyyy-MM",
  "MoisLettre": "string",
  "Annee": 0,
  "organisme_mutuelle": "string",
  "reseau_soins": "string",
  "virements": [{
    "DateVirement": "yyyy-MM-dd",
    "MoisLettre": "string",
    "Annee": 0,
    "MontantVirementGlobal": 0.0,
    "VirementLibelle": "string",
    "nb_clients": 0,
    "clients": [{
      "ClientNom": "string",
      "ClientPrenom": "string",
      "NumeroSecuriteSociale": "string",
      "NumeroAdherent": "string",
      "Montant": 0.0,
      "typeVirement": "string"
    }]
  }]
}

EXTRACTION DU FINESS ET RECHERCHE SOCIÉTÉ :
1. Chercher "Votre numéro AM :", "N° AM", "Numéro AMC" ou "FINESS"
2. Si trouvé, extraire le nombre (exactement 9 chiffres)
3. Supprimer tous les zéros initiaux de ce nombre
4. Rechercher ce FINESS dans la colonne "FINESS" du tableau fourni
5. Si trouvé par FINESS : centre = "CODE MAGASIN", societe = "SOCIETE"

SI AUCUN FINESS TROUVÉ, RECHERCHE ALTERNATIVE :
Étape A - Recherche par VILLE :
- Identifier l'adresse complète du destinataire dans le document
- Extraire la VILLE (généralement après le code postal)
- Rechercher cette ville EXACTE dans la colonne "VILLE" du tableau
- Si correspondance : centre = "CODE MAGASIN", societe = "SOCIETE"

Étape B - Recherche par NOM de société :
- Extraire le nom complet du destinataire/professionnel de santé
- Rechercher une correspondance partielle dans la colonne "SOCIETE" du tableau
- Accepter les correspondances même partielles (au moins 2 mots en commun)
- Si correspondance : centre = "CODE MAGASIN", societe = "SOCIETE"

Étape C - Recherche par CODE POSTAL :
- Extraire le code postal du destinataire (5 chiffres)
- Rechercher dans la colonne "ADRESSE" du tableau
- Si correspondance unique : centre = "CODE MAGASIN", societe = "SOCIETE"

RÉSULTAT FINAL :
- Si trouvé par une méthode : utiliser les valeurs trouvées
- Si aucune correspondance : centre = "INCONNU", societe = nom extrait du document

RÈGLES DE RECHERCHE :
- La recherche est insensible à la casse (majuscules/minuscules)
- Ignorer les accents lors de la comparaison
- Pour les villes composées, essayer avec et sans tirets
- Le destinataire est toujours le professionnel de santé, PAS la mutuelle

EXTRACTION DES MONTANTS - INSTRUCTIONS CRITIQUES :
- Lire TRÈS ATTENTIVEMENT chaque montant caractère par caractère
- Les montants sont généralement dans des colonnes "Montant dû", "Montant", "Montant remboursé"
- Format français : utilise la virgule comme séparateur décimal (1100,00 €)
- TOUJOURS vérifier deux fois chaque montant extrait
- Si le document contient un tableau, lire ligne par ligne avec précision
- NE PAS confondre les montants avec :
  * Les références de facture
  * Les numéros de sécurité sociale
  * Les dates
  * Les numéros de compte

VALIDATION OBLIGATOIRE :
1. Extraire d'abord le montant total du virement
2. Extraire ensuite chaque montant individuel
3. Vérifier que la somme des montants individuels = montant total
4. Si incohérence, relire CHAQUE ligne du tableau plus attentivement
5. En cas de doute sur un caractère, zoomer/analyser plus précisément

LECTURE DES TABLEAUX :
- Identifier clairement les colonnes et leurs en-têtes
- Lire horizontalement, ligne par ligne
- Ne pas sauter de lignes
- Faire attention aux alignements de colonnes

EXTRACTION DE LA MUTUELLE :
- Chercher "AMC :", "Mutuelle :", "Assurance :", "Organisme complémentaire"
- Si non trouvé, chercher dans l'en-tête du document
- La mutuelle PEUT être la même entité que le réseau de soins
- NE PAS prendre le destinataire (professionnel de santé)
- organisme_mutuelle NE PEUT PAS être égal à societe (le destinataire)
- En MAJUSCULES
- Si aucune mutuelle distincte n'est mentionnée, la mutuelle est le réseau de soins

EXTRACTION DU RÉSEAU DE SOINS :
- Chercher dans l'EN-TÊTE du document (partie haute)
- C'est l'organisme qui EXPÉDIE le document (logo, raison sociale)
- JAMAIS le destinataire
- Exemples : "ABEILLE", "ALMERYS", "HARMONIE", "SANTECLAIR"
- IGNORER les noms de magasins/professionnels
- reseau_soins NE PEUT JAMAIS être un nom de magasin
- En MAJUSCULES

EXTRACTION DES VIREMENTS :
- Chercher les dates de virement/paiement
- VirementLibelle : numéro ou référence du virement
- MontantVirementGlobal : montant total du virement
- nb_clients : nombre de bénéficiaires uniques

EXTRACTION DES BÉNÉFICIAIRES :
Pour chaque bénéficiaire visible dans le document :
- ClientNom : nom en MAJUSCULES
- ClientPrenom : prénom en MAJUSCULES
- NumeroSecuriteSociale : numéro de sécurité sociale (13 ou 15 chiffres)
  Chercher : "N° SS", "NSS", "N° Sécu", "Sécurité Sociale", "N° Assuré"
  Format : 1 ou 2 + 12 ou 14 chiffres (ex: 1 85 05 78 006 048)
- NumeroAdherent : numéro d'adhérent mutuelle si présent
  Chercher : "N° Adhérent", "Adhérent", "N° Mutuelle"
  Peut être vide si non trouvé
- Montant : montant remboursé pour ce bénéficiaire
- typeVirement : "Individuel" si 1 client, "Groupé" si plusieurs

IMPORTANT pour les documents multi-pages :
- Parcourir TOUTES les pages pour extraire TOUS les bénéficiaires
- Ne pas dupliquer les informations si elles apparaissent sur plusieurs pages
- Consolider les données de toutes les pages en un seul JSON

DATES ET PÉRIODES :
- timestamp_analyse : moment actuel (format ISO)
- periode : mois des prestations (format yyyy-MM)
- MoisLettre : mois en MAJUSCULES (JANVIER, FÉVRIER...)
- Annee : année de la période

Tableau des magasins pour la recherche FINESS :
${magasinsJSON}

VALIDATION NSS :
- Le NSS doit avoir 13 chiffres (ou 15 avec la clé)
- Commence par 1 (homme) ou 2 (femme)
- Format : [1-2] AA MM DD DDD CCC [CC]
- Si le NSS trouvé n'a pas le bon format, chercher ailleurs
- Ne PAS confondre avec le numéro d'adhérent

RAPPELS CRITIQUES :
- RÉSEAU DE SOINS = EXPÉDITEUR du document (en-tête)
- SOCIÉTÉ = DESTINATAIRE (professionnel qui reçoit)
- MUTUELLE = organisme complémentaire payeur
- Ne JAMAIS confondre ces trois entités
- periode basée sur les dates de soins/prestations
- Analyser TOUTES les pages fournies`;
            
            console.log('🤖 Prompt préparé, longueur:', prompt.length, 'caractères');
            
            // Préparer le body de la requête
            const requestBody = {
                images: images,
                prompt: prompt,
                type: 'mutuelle'
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
            console.log('✅ Réponse Cloud Function reçue');
            
            console.log('🔍 DEBUG - Réponse IA complète:', JSON.stringify(result.data, null, 2));

            if (result.data && result.data.virements) {
                result.data.virements.forEach((v, i) => {
                    console.log(`💰 Virement ${i+1}:`, {
                        montantTotal: v.MontantVirementGlobal,
                        nbClients: v.clients?.length,
                        clients: v.clients?.map(c => ({
                            nom: c.ClientNom,
                            prenom: c.ClientPrenom,
                            montant: c.Montant
                        }))
                    });
                    
                    // Vérifier la somme
                    if (v.clients && v.clients.length > 0) {
                        const sommeClients = v.clients.reduce((sum, c) => sum + (c.Montant || 0), 0);
                        console.log(`📊 Somme des montants clients: ${sommeClients}€`);
                        console.log(`📊 Montant virement déclaré: ${v.MontantVirementGlobal}€`);
                        if (Math.abs(sommeClients - v.MontantVirementGlobal) > 0.01) {
                            console.error(`❌ INCOHÉRENCE: Somme (${sommeClients}) ≠ Total (${v.MontantVirementGlobal})`);
                        }
                    }
                });
            }

            return result.data || {};
            
        } catch (error) {
            console.error('❌ Erreur appel Cloud Function:', error);
            throw error;
        }
    }
    
    /**
     * Formater les données extraites par l'IA pour Firestore
     * @param {Object} donneesBrutes - Données brutes de l'IA
     * @returns {Object} Données formatées
     */
 static formaterDonneesIA(donneesBrutes) {
    const premierVirement = donneesBrutes.virements?.[0] || {};
    const clientsExtraits = premierVirement.clients || [];
    
    // Calculer le type de décompte
    const nombreClients = clientsExtraits.length || 1;
    const typeDecompte = nombreClients > 1 ? 'groupe' : 'individuel';
    
    // Formater TOUS les clients
    const clientsFormated = clientsExtraits.map(c => ({
        nom: c.ClientNom || null,
        prenom: c.ClientPrenom || null,
        numeroSecuriteSociale: this.nettoyerNSS(c.NumeroSecuriteSociale),
        numeroAdherent: c.NumeroAdherent || null,
        montantRemboursement: c.Montant || 0,
        typeVirement: c.typeVirement || 'individuel'
    }));
    
    // Client principal pour compatibilité
    const premierClient = clientsFormated[0] || {};
    
    return {
        // Client principal (pour compatibilité)
        client: premierClient,
        
        // TOUS les clients pour décompte groupé
        clients: clientsFormated,
        
        // Mutuelle et prestataire
        mutuelle: donneesBrutes.organisme_mutuelle || null,
        prestataireTP: donneesBrutes.prestataireTP || donneesBrutes.reseau_soins || null,
        
        // Montants
        montantRemboursementClient: premierClient.montantRemboursement || 0,
        montantVirement: premierVirement.MontantVirementGlobal || 0,
        
        // Type et nombre
        typeDecompte: typeDecompte,
        nombreClients: nombreClients,
        
        // Références
        virementId: premierVirement.VirementLibelle || null,
        dateVirement: this.parseDate(premierVirement.DateVirement),
        
        // Magasin
        codeMagasin: donneesBrutes.centre !== 'INCONNU' ? 
            donneesBrutes.centre : null,
        
        // Métadonnées
        extractionIA: {
            timestamp: donneesBrutes.timestamp_analyse,
            modele: 'gpt-4.1-mini',
            societeDetectee: donneesBrutes.societe,
            periode: donneesBrutes.periode,
            donneesBrutes: premierVirement // Garder les données brutes pour debug
        }
    };
}
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Nettoyer un NSS
     * @private
     */
    static nettoyerNSS(nss) {
        if (!nss) return null;
        const cleaned = String(nss).replace(/\D/g, '');
        return (cleaned.length === 13 || cleaned.length === 15) ? cleaned : nss;
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
    
    /**
     * Trouver le code magasin à partir du FINESS
     * @private
     */
    static findCodeMagasinByFiness(finess) {
        // Récupérer les magasins depuis le localStorage
        const magasinsStored = localStorage.getItem('orixis_magasins');
        if (!magasinsStored) return finess;
        
        try {
            const magasins = JSON.parse(magasinsStored);
            // Chercher le magasin par FINESS
            for (const [code, data] of Object.entries(magasins)) {
                if (data.numeroFINESS === finess) {
                    console.log(`✅ FINESS ${finess} → Code magasin ${code}`);
                    return code;
                }
            }
        } catch (error) {
            console.error('❌ Erreur recherche code magasin:', error);
        }
        
        console.warn(`⚠️ Code magasin non trouvé pour FINESS ${finess}`);
        return finess;
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    analyserDocument: DecompteOpenAIService.analyserDocument.bind(DecompteOpenAIService),
    analyserAvecFichier: DecompteOpenAIService.analyserAvecFichier.bind(DecompteOpenAIService),
    extractDecompteData: DecompteOpenAIService.extractDecompteData.bind(DecompteOpenAIService),
    prepareDocumentImages: DecompteOpenAIService.prepareDocumentImages.bind(DecompteOpenAIService),
    convertirFichierEnImages: DecompteOpenAIService.convertirFichierEnImages.bind(DecompteOpenAIService)
};

/* ========================================
   HISTORIQUE
   
   [08/02/2025] - Création
   - Service dédié à l'analyse IA
   - Conversion PDF → Images avec PDF.js
   - Support images et PDF
   - Analyse directe de fichier File
   - Prompt optimisé pour décomptes mutuelles
   ======================================== */