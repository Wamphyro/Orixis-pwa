// ========================================
// DECOMPTE-SECU.OPENAI.SERVICE.JS - 🤖 SERVICE IA
// Chemin: modules/decompte-secu/decompte-secu.openai.service.js
//
// DESCRIPTION:
// Service d'analyse IA des décomptes CPAM audioprothèse
// Support PDF (via images) et CSV (texte direct)
// Extraction des virements et bénéficiaires
// Détection du magasin via FINESS
//
// VERSION: 1.0.0
// DATE: 08/01/2025
// ========================================

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    cloudFunctionUrl: 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument',
    maxPagesPerRequest: 10,
    imageQuality: 0.8,
    maxImageSize: 1920
};

// ========================================
// SERVICE OPENAI
// ========================================

class DecompteSecuOpenAIService {
    
    /**
     * Analyser un fichier avec l'IA
     */
    async analyserAvecFichier(file, magasins = []) {
        try {
            console.log('🤖 Début analyse IA:', file.name);
            
            let contenuPourIA;
            
            // Déterminer le type de fichier
            if (file.type === 'application/pdf') {
                console.log('📄 Conversion PDF en images...');
                contenuPourIA = await this.convertPDFToImages(file);
            } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                console.log('📊 Lecture du CSV...');
                contenuPourIA = await this.readCSV(file);
            } else if (file.type.startsWith('image/')) {
                console.log('🖼️ Conversion image...');
                contenuPourIA = await this.convertImageToBase64(file);
            } else {
                throw new Error(`Type de fichier non supporté: ${file.type}`);
            }
            
            // Appeler l'IA
            const resultat = await this.callOpenAI(contenuPourIA, magasins, file.type);
            
            console.log('✅ Analyse IA terminée');
            return resultat;
            
        } catch (error) {
            console.error('❌ Erreur analyse IA:', error);
            throw error;
        }
    }
    
    /**
     * Convertir un PDF en images
     */
    async convertPDFToImages(file) {
        try {
            // Utiliser PDF.js (déjà chargé dans le HTML)
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            console.log(`📄 PDF avec ${pdf.numPages} page(s)`);
            
            const images = [];
            const maxPages = Math.min(pdf.numPages, CONFIG.maxPagesPerRequest);
            
            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });
                
                // Créer un canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Dessiner la page
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // Convertir en base64
                const base64 = canvas.toDataURL('image/jpeg', CONFIG.imageQuality)
                    .replace(/^data:image\/jpeg;base64,/, '');
                
                images.push(base64);
                
                console.log(`✅ Page ${i}/${maxPages} convertie`);
            }
            
            return images;
            
        } catch (error) {
            console.error('❌ Erreur conversion PDF:', error);
            throw new Error('Impossible de convertir le PDF');
        }
    }
    
    /**
     * Lire un fichier CSV
     */
    async readCSV(file) {
        try {
            const text = await file.text();
            
            // Parser avec Papa Parse (déjà chargé dans le HTML)
            const result = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                delimitersToGuess: [',', ';', '\t', '|']
            });
            
            if (result.errors && result.errors.length > 0) {
                console.warn('⚠️ Erreurs parsing CSV:', result.errors);
            }
            
            console.log(`📊 CSV parsé: ${result.data.length} lignes`);
            
            // Retourner le texte brut pour l'IA
            return text;
            
        } catch (error) {
            console.error('❌ Erreur lecture CSV:', error);
            throw new Error('Impossible de lire le fichier CSV');
        }
    }
    
    /**
     * Convertir une image en base64
     */
    async convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve([base64]); // Retourner comme tableau pour cohérence
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Appeler l'API OpenAI via Cloud Function
     */
    async callOpenAI(contenu, magasins, fileType) {
        try {
            // Préparer le prompt
            const prompt = this.generatePrompt(magasins, fileType);
            
            // Préparer le body selon le type de contenu
            let requestBody;
            
            if (Array.isArray(contenu)) {
                // Images (PDF ou image)
                requestBody = {
                    images: contenu,
                    prompt: prompt,
                    type: 'secu'
                };
            } else {
                // Texte (CSV)
                requestBody = {
                    text: contenu,
                    prompt: prompt,
                    type: 'secu_csv'
                };
            }
            
            console.log('📤 Appel Cloud Function...');
            
            const response = await fetch(CONFIG.cloudFunctionUrl, {
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
            console.log('✅ Réponse IA reçue');
            
            // Formater les données
            return this.formatIAResponse(result.data || {});
            
        } catch (error) {
            console.error('❌ Erreur appel IA:', error);
            throw error;
        }
    }
    
    /**
     * Générer le prompt pour l'IA
     */
    generatePrompt(magasins, fileType) {
        // Préparer la liste ENRICHIE des magasins pour la détection FINESS
        const magasinsJSON = JSON.stringify(
            magasins.map(m => ({
                code: m.code,
                finess: m.finess,
                nom: m.nom,
                societe: m.societe  // Important pour le mapping
            })),
            null,
            2
        );
        
        const formatInfo = fileType === 'text/csv' ? 
            'un fichier CSV de décompte CPAM' : 
            'un document PDF de décompte CPAM';
        
        return `Tu es un expert en analyse de décomptes CPAM pour audioprothèse.
Tu analyses ${formatInfo} et tu dois extraire TOUTES les informations.

CONTEXTE IMPORTANT:
- Ce sont des remboursements d'appareils auditifs
- Un virement peut contenir plusieurs patients
- Chaque patient peut avoir 1 ou 2 appareils (oreille droite et/ou gauche)
- Les montants standards sont souvent autour de 199,71€ par appareil

EXTRACTION OBLIGATOIRE:
{
    "montantVirement": number, // Montant total du virement
    "dateVirement": "YYYY-MM-DD", // Date du virement
    "numeroVirement": "string", // Référence du virement
    "caissePrimaire": "string", // Ex: "CAMIEG", "CPAM PARIS"
    "beneficiaires": [
        {
            "nom": "string",
            "prenom": "string",
            "numeroSecuriteSociale": "string", // Si disponible
            "montantRemboursement": number, // Total pour ce patient
            "appareils": [
                {
                    "oreille": "droite" ou "gauche",
                    "codeActe": "string", // Code CCAM si disponible
                    "montant": number
                }
            ]
        }
    ],
    "finessDetecte": "string", // FINESS du professionnel trouvé sur le document
    "codeMagasin": "string", // Code magasin correspondant au FINESS
    "societe": "string" // ⚠️ IMPORTANT: Société correspondante au magasin
}

RECHERCHE DU MAGASIN ET SOCIÉTÉ:
⚠️ TRÈS IMPORTANT - Tu dois OBLIGATOIREMENT:
1. Chercher le numéro FINESS (9 chiffres) sur le document
2. Le comparer avec cette liste de magasins:
${magasinsJSON}
3. Si le FINESS est trouvé dans la liste:
   - finessDetecte = le FINESS trouvé sur le document
   - codeMagasin = le "code" correspondant dans la liste
   - societe = la "societe" correspondante dans la liste ⚠️ NE PAS OUBLIER
4. Si le FINESS n'est PAS trouvé dans la liste:
   - finessDetecte = le FINESS trouvé sur le document (s'il existe)
   - codeMagasin = null
   - societe = null

EXEMPLE:
Si tu trouves FINESS "130044759" sur le document et qu'il correspond à:
{ "code": "9MAR", "finess": "130044759", "nom": "Marseille", "societe": "BA" }
Tu dois retourner:
"finessDetecte": "130044759",
"codeMagasin": "9MAR",
"societe": "BA"

RÈGLES IMPORTANTES:
- TOUJOURS extraire TOUS les bénéficiaires
- Calculer le montant total du virement
- Identifier chaque appareil (droite/gauche)
- Le NSS a 13 ou 15 chiffres
- Les dates au format YYYY-MM-DD
- La société doit venir du mapping, PAS du document

Pour un CSV:
- Les colonnes peuvent varier
- Chercher les montants, noms, prénoms
- Regrouper par patient si nécessaire

RETOURNE UNIQUEMENT LE JSON, sans commentaire.`;
    }
    
    /**
     * Formater la réponse de l'IA
     */
    formatIAResponse(data) {
        // S'assurer que les données sont complètes
        const formatted = {
            montantVirement: data.montantVirement || 0,
            dateVirement: data.dateVirement || null,
            numeroVirement: data.numeroVirement || null,
            caissePrimaire: data.caissePrimaire || null,
            
            beneficiaires: this.formatBeneficiaires(data.beneficiaires || []),
            
            // Détection magasin ET société
            finessDetecte: data.finessDetecte || null,
            codeMagasin: data.codeMagasin || null,
            societe: data.societe || null,  // PAS de valeur par défaut !
            
            // Format source
            formatSource: data.formatSource || 'pdf'
        };
        
        // Vérifier la cohérence des montants
        const totalBeneficiaires = formatted.beneficiaires.reduce(
            (sum, b) => sum + (b.montantRemboursement || 0),
            0
        );
        
        // Si pas de montant virement, utiliser le total des bénéficiaires
        if (!formatted.montantVirement && totalBeneficiaires > 0) {
            formatted.montantVirement = totalBeneficiaires;
        }
        
        console.log('📊 Données formatées:', {
            montant: formatted.montantVirement,
            beneficiaires: formatted.beneficiaires.length,
            caisse: formatted.caissePrimaire,
            magasin: formatted.codeMagasin,
            societe: formatted.societe  // Ajouter dans le log
        });
        
        return formatted;
    }
    
    /**
     * Formater les bénéficiaires
     */
    formatBeneficiaires(beneficiaires) {
        if (!Array.isArray(beneficiaires)) {
            return [];
        }
        
        return beneficiaires.map(b => ({
            nom: (b.nom || '').toUpperCase(),
            prenom: this.capitalizeFirstLetter(b.prenom || ''),
            numeroSecuriteSociale: this.cleanNSS(b.numeroSecuriteSociale),
            montantRemboursement: b.montantRemboursement || 0,
            appareils: this.formatAppareils(b.appareils || [])
        }));
    }
    
    /**
     * Formater les appareils
     */
    formatAppareils(appareils) {
        if (!Array.isArray(appareils)) {
            return [];
        }
        
        return appareils.map(a => ({
            oreille: (a.oreille || '').toLowerCase(),
            codeActe: a.codeActe || null,
            montant: a.montant || 0
        }));
    }
    
    /**
     * Nettoyer un NSS
     */
    cleanNSS(nss) {
        if (!nss) return null;
        
        // Enlever tous les caractères non numériques
        const cleaned = String(nss).replace(/\D/g, '');
        
        // Vérifier la longueur (13 ou 15 chiffres)
        if (cleaned.length === 13 || cleaned.length === 15) {
            return cleaned;
        }
        
        return nss; // Retourner l'original si format incorrect
    }
    
    /**
     * Capitaliser la première lettre
     */
    capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new DecompteSecuOpenAIService();
export default service;

/* ========================================
   HISTORIQUE
   
   [08/01/2025] - v1.0.0
   - Service IA complet
   - Support PDF et CSV
   - Extraction virements et bénéficiaires
   - Détection FINESS → magasin
   ======================================== */