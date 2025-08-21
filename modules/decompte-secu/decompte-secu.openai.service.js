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
// LIGNE 58 : console.log('✅ Analyse IA terminée');

// 🔍 AJOUTEZ CE BLOC DE DEBUG ICI (ligne 59+)
console.log('🔍 === DEBUG ANALYSE IA ===');
console.log('📤 Données reçues de GPT:', JSON.stringify(resultat, null, 2));

// Vérifier spécifiquement les appareils
if (resultat.virements) {
    resultat.virements.forEach((vir, idx) => {
        console.log(`\n📊 VIREMENT ${idx + 1}:`);
        vir.beneficiaires?.forEach(b => {
            console.log(`  👤 ${b.prenom} ${b.nom}: ${b.montantRemboursement}€`);
            console.log(`     Appareils:`, b.appareils);
        });
    });
}
console.log('🔍 === FIN DEBUG IA ===\n');

return resultat;  // Cette ligne existe déjà
            
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
 * Générer le prompt pour l'IA - VERSION MULTI-VIREMENTS
 */
generatePrompt(magasins, fileType) {
    const magasinsJSON = JSON.stringify(
        magasins.map(m => ({
            code: m.code,
            finess: m.finess,
            nom: m.nom,
            societe: m.societe
        })),
        null,
        2
    );
    
    const formatInfo = fileType === 'text/csv' ? 
        'un fichier CSV de décompte CPAM' : 
        'un document PDF de décompte CPAM';
    
    return `Tu es un expert en analyse de décomptes CPAM pour audioprothèse.
Tu analyses ${formatInfo} qui contient PLUSIEURS VIREMENTS BANCAIRES à des dates différentes.

⚠️ STRUCTURE CRITIQUE - MULTI-VIREMENTS:
Un décompte CPAM contient généralement PLUSIEURS virements bancaires distincts.
Chaque virement a sa propre date, référence et liste de bénéficiaires.
NE PAS fusionner tous les virements en un seul !

FORMAT JSON OBLIGATOIRE:
{
    "informationsGenerales": {
        "caissePrimaire": "string",        // Ex: "CAMIEG", "CPAM PARIS"
        "numeroFINESS": "string",          // 9 chiffres trouvés sur le document
        "codeMagasin": "string ou null",   // Via mapping FINESS
        "societe": "string ou null",       // Société correspondante
        "periodeTraitement": "YYYY-MM",    // Période du décompte
        "numeroDecompte": "string"         // Si présent sur le document
    },
    
    "virements": [                         // ⚠️ TABLEAU de virements
        {
            "dateVirement": "YYYY-MM-DD",  // Date de CE virement
            "numeroVirement": "string",     // Référence de CE virement
            "montantVirement": number,      // Montant de CE virement
            "nombreBeneficiaires": number,  // Nombre de patients dans CE virement
            "beneficiaires": [
                {
                    "nom": "string",
                    "prenom": "string",
                    "numeroSecuriteSociale": "string",
                    "dateNaissance": "YYYY-MM-DD",
                    "montantRemboursement": number,  // Total pour ce patient
                    "nombreAppareils": number,       // 1 ou 2
                    "appareils": [
                        {
                            "oreille": "droite" ou "gauche" ou "bilateral",
                            "dateFacture": "YYYY-MM-DD",
                            "numeroFacture": "string",
                            "codeActe": "string",    // Ex: "P1D", "P2G"
                            "montantBase": number,   // Prix de base
                            "montantRembourse": number  // Remboursement
                        }
                    ]
                }
            ]
        }
    ],
    
    "totaux": {
        "nombreTotalVirements": number,     // Nombre de virements distincts
        "montantTotalVirements": number,    // Somme de tous les virements
        "nombreTotalBeneficiaires": number, // Total patients uniques
        "nombreTotalAppareils": number      // Total appareils
    }
}

IDENTIFICATION DES VIREMENTS MULTIPLES:

Pour un CSV, les indices de virements distincts:
1. Changement de DATE DE PAIEMENT/VIREMENT
2. Lignes contenant "VIREMENT", "PAIEMENT", "TOTAL VIREMENT"
3. Références différentes (numéros de virement)
4. Séparations visuelles (lignes vides, tirets)
5. Sous-totaux intermédiaires

⚠️ EXTRACTION CRITIQUE DES MONTANTS PAR APPAREIL:

RÈGLES IMPORTANTES POUR LES MONTANTS:
1. Le montant total par patient est souvent divisé en 2 appareils (droite + gauche)
2. Les montants standards CPAM pour l'audioprothèse sont:
   - 199,71€ par appareil (classe I)
   - 240,00€ par appareil (certains tarifs)
   - 480,00€ pour 2 appareils (2 x 240€)
3. Les codes d'actes contiennent souvent l'indication de l'oreille:
   - P1D, P2D, etc. = Droite
   - P1G, P2G, etc. = Gauche
   - Ou "D" pour droite, "G" pour gauche

LOGIQUE D'EXTRACTION DES MONTANTS:
- Si tu trouves un montant total pour un patient SANS détail par appareil:
  * Et qu'il y a 2 codes (comme P1D et P1G) → divise le montant par 2
  * Exemple: 480€ total avec P1D et P1G → 240€ pour droite, 240€ pour gauche
- Si un seul montant global et 2 appareils mentionnés → divise par 2
- Si tu ne trouves pas les montants détaillés, CALCULE-LES en divisant équitablement

EXEMPLE CONCRET pour un patient:
Si tu vois dans le CSV:
- Patient: Bernadette LAMALLE  
- Montant total: 480,00€
- Codes: P2D et P2G
- Pas de montant détaillé par code

Tu DOIS retourner:
"beneficiaires": [{
    "nom": "LAMALLE",
    "prenom": "Bernadette",
    "numeroSecuriteSociale": "2381021253001",
    "montantRemboursement": 480.00,
    "nombreAppareils": 2,
    "appareils": [
        {
            "oreille": "droite",
            "codeActe": "P2D",
            "montantRembourse": 240.00  // ← CALCULÉ: 480 / 2
        },
        {
            "oreille": "gauche",
            "codeActe": "P2G",
            "montantRembourse": 240.00  // ← CALCULÉ: 480 / 2
        }
    ]
}]

RÈGLES D'EXTRACTION:

1. VIREMENTS:
   - Identifier CHAQUE virement distinct
   - Chercher les dates de paiement différentes
   - Ne PAS additionner les virements ensemble
   - Chaque virement a ses propres bénéficiaires

2. BÉNÉFICIAIRES ET APPAREILS:
   - Un patient peut apparaître dans UN SEUL virement
   - NSS format: [1-2] AA MM DD DDD CCC [CC] (13 ou 15 chiffres)
   - TOUJOURS calculer les montants par appareil si non détaillés
   - Si 2 appareils et 1 montant total → diviser par 2
   - Identifier l'oreille par le code (D=droite, G=gauche)

3. RECHERCHE MAGASIN ET SOCIÉTÉ:
   Chercher le FINESS (9 chiffres) et le comparer avec:
${magasinsJSON}
   
   Si trouvé:
   - codeMagasin = le code correspondant
   - societe = la société correspondante ⚠️ OBLIGATOIRE
   
   Si non trouvé:
   - codeMagasin = null
   - societe = null

4. TOTAUX:
   - nombreTotalVirements = nombre de virements distincts
   - montantTotalVirements = somme de TOUS les virements
   - nombreTotalBeneficiaires = patients uniques (sans doublons)
   - nombreTotalAppareils = somme de tous les appareils (compter vraiment les appareils)

VALIDATION FINALE:
- Vérifier que chaque appareil a un montantRembourse (jamais 0 si le patient a un remboursement)
- Si montantTotalVirements = 2880€, tu dois avoir PLUSIEURS virements qui totalisent 2880€
- Ne JAMAIS retourner un seul virement avec le montant total
- Vérifier que la somme des virements = montant total

RETOURNE UNIQUEMENT LE JSON VALIDE, sans commentaire ni explication.`;
}
    
    /**
     * Formater la réponse de l'IA - VERSION MULTI-VIREMENTS
     */
    formatIAResponse(data) {
        // Gérer l'ancienne et la nouvelle structure
        let formatted;
        
        // Si nouvelle structure avec virements multiples
        if (data.virements && Array.isArray(data.virements)) {
            formatted = {
                // Infos générales
                caissePrimaire: data.informationsGenerales?.caissePrimaire || null,
                numeroFINESS: data.informationsGenerales?.numeroFINESS || null,
                codeMagasin: data.informationsGenerales?.codeMagasin || null,
                societe: data.informationsGenerales?.societe || null,
                periodeTraitement: data.informationsGenerales?.periodeTraitement || null,
                
                // Virements
                virements: data.virements.map(v => ({
                    dateVirement: v.dateVirement,
                    numeroVirement: v.numeroVirement,
                    montantVirement: v.montantVirement,
                    nombreBeneficiaires: v.nombreBeneficiaires,
                    beneficiaires: this.formatBeneficiaires(v.beneficiaires || [])
                })),
                
                // Totaux
                totaux: data.totaux || {
                    nombreTotalVirements: data.virements.length,
                    montantTotalVirements: data.virements.reduce((sum, v) => sum + v.montantVirement, 0),
                    nombreTotalBeneficiaires: 0,
                    nombreTotalAppareils: 0
                }
            };
        } 
        // Ancienne structure (compatibilité)
        else {
            formatted = {
                caissePrimaire: data.caissePrimaire || null,
                numeroFINESS: data.finessDetecte || null,
                codeMagasin: data.codeMagasin || null,
                societe: data.societe || null,
                
                // Convertir en tableau de virements
                virements: [{
                    dateVirement: data.dateVirement || null,
                    numeroVirement: data.numeroVirement || null,
                    montantVirement: data.montantVirement || 0,
                    nombreBeneficiaires: data.beneficiaires?.length || 0,
                    beneficiaires: this.formatBeneficiaires(data.beneficiaires || [])
                }],
                
                totaux: {
                    nombreTotalVirements: 1,
                    montantTotalVirements: data.montantVirement || 0,
                    nombreTotalBeneficiaires: data.beneficiaires?.length || 0,
                    nombreTotalAppareils: 0
                }
            };
        }
        
        console.log('📊 Données formatées:', {
            virements: formatted.virements.length,
            montantTotal: formatted.totaux.montantTotalVirements,
            beneficiairesTotal: formatted.totaux.nombreTotalBeneficiaires,
            caisse: formatted.caissePrimaire,
            magasin: formatted.codeMagasin,
            societe: formatted.societe
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
                nombreAppareils: b.appareils?.length || b.nombreAppareils || 0,  // ⚡ AJOUT
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
                montantRembourse: a.montantRembourse || a.montant || 0,  // ⚡ IMPORTANT
                // Ajouter les autres champs si présents
                dateFacture: a.dateFacture || null,
                numeroFacture: a.numeroFacture || null,
                montantBase: a.montantBase || null
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