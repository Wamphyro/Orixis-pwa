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
        
        // ========================================
        // NOUVEAU : Charger le référentiel des magasins
        // ========================================
        let referentielMagasins = null;
        try {
            // Import Firestore si pas déjà fait
            const { getDoc, doc, getDocs, collection } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            const { db } = await import('../../src/services/firebase.service.js');
            
            // Charger la société BA
            const societeDoc = await getDoc(doc(db, 'societes', 'BA'));
            if (societeDoc.exists()) {
                const societeData = societeDoc.data();
                
                // Charger tous les magasins
                const magasinsIds = societeData.organisation?.magasins || [];
                const magasinsPromises = magasinsIds.map(id => 
                    getDoc(doc(db, 'magasins', id))
                );
                const magasinsDocs = await Promise.all(magasinsPromises);
                
                // Construire le référentiel compact
                referentielMagasins = {
                    societe: societeData.identification?.raisonSociale || 'BROKER AUDIOLOGIE',
                    siren: societeData.identification?.siren || '818247579',
                    numeroTVA: societeData.identification?.numeroTVA || 'FR27818247579',
                    magasins: magasinsDocs
                        .filter(doc => doc.exists())
                        .map(doc => {
                            const data = doc.data();
                            return {
                                code: doc.id,
                                siret: data.identification?.siret || '',
                                adresse: data.adresse?.rue || '',
                                ville: `${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim()
                            };
                        })
                };
                
                console.log('✅ Référentiel magasins chargé:', referentielMagasins.magasins.length, 'magasins');
            }
        } catch (error) {
            console.warn('⚠️ Impossible de charger le référentiel magasins:', error);
            // Continuer sans référentiel
        }
        
        // ========================================
        // PROMPT ENRICHI AVEC RÉFÉRENTIEL
        // ========================================
        const prompt = `Tu es un expert en traitement de factures fournisseurs et en comptabilité française.
Tu analyses ${images.length} ${images.length > 1 ? 'pages' : 'image'} d'une facture et tu dois retourner UNIQUEMENT un objet JSON valide, sans aucun texte ni balise.

${images.length > 1 ? 'IMPORTANT : Ces images représentent les pages successives du MÊME document. Tu dois combiner les informations de toutes les pages pour extraire les données complètes de la facture.' : ''}

${referentielMagasins ? `
=== RÉFÉRENTIEL DE NOS SOCIÉTÉS ET MAGASINS ===
IMPORTANT : Voici la liste EXACTE de nos établissements. Tu DOIS matcher le client avec ces données :

Société principale : ${referentielMagasins.societe}
SIREN : ${referentielMagasins.siren}
TVA Intra : ${referentielMagasins.numeroTVA}

Établissements :
${referentielMagasins.magasins.map(m => `
- Code: ${m.code}
  SIRET: ${m.siret}
  Adresse: ${m.adresse}
  Ville: ${m.ville}
`).join('')}

=== RÈGLES DE MATCHING CLIENT (OBLIGATOIRE) ===
1. PRIORITÉ 1 : Cherche le SIRET sur la facture → compare avec la liste ci-dessus
2. PRIORITÉ 2 : Si pas de SIRET, cherche l'adresse + ville
3. PRIORITÉ 3 : Si pas trouvé, cherche juste la ville

IMPORTANT :
- Le nom du client DOIT TOUJOURS être : "${referentielMagasins.societe}"
- Ne PAS inclure "Ste", "SARL", "ALAIN AFFLELOU", "ACO", "ACOUSTICIEN", etc.
- Si match trouvé, retourner le code magasin correspondant

Exemple :
- Si tu vois : "Ste BROKER AUDIOLOGIE ALAIN AFFLELOU ACO"
- Tu retournes : "BROKER AUDIOLOGIE" (exactement comme dans le référentiel)
` : ''}

FORMAT JSON OBLIGATOIRE :
{
    "timestamp_analyse": "yyyy-MM-ddTHH:mm:ss",
    
    "identifiants": {
        "numeroFacture": "string",
        "numeroCommande": "string",
        "numeroClient": "string",
        "numeroTVAIntra": "string",
        "siret": "string",
        "siren": "string",
        "naf": "string"
    },
    
    "fournisseur": {
        "nom": "string",
        "adresse": "string",
        "siren": "string",
        "numeroTVA": "string",
        "telephone": "string",
        "email": "string",
        "paysDomiciliation": "string",
        "compteFournisseur": "string",
        "banque": {
            "nom": "string",
            "iban": "string",
            "bic": "string"
        }
    },
    
    "client": {
        "nom": "string",
        "numeroClient": "string",
        "adresse": "string",
        "numeroTVA": "string",
        "codeMagasin": "string"
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
        "tauxTVA": 0,
        "montantTVA": 0.00,
        "montantTTC": 0.00,
        "montantNet": 0.00,
        "fraisPort": 0.00,
        "remise": 0.00
    },
    
    "tva": {
        "regime": "string",
        "exoneration": false,
        "motifExoneration": "string",
        "autoliquidation": false,
        "tauxApplique": 0,
        "ventilationTVA": []
    },
    
    "informations": {
        "modePaiement": "string",
        "conditionsPaiement": "string",
        "iban": "string",
        "bic": "string",
        "referenceMandat": "string",
        "escompte": null
    },
    
    "documentsLies": {
        "bonCommande": "string",
        "bonLivraison": "string",
        "avoir": null,
        "facturePrecedente": null,
        "contrat": null
    },
    
    "comptabilite": {
        "categorieDetectee": "string",
        "compteComptable": "string",
        "libelleCompte": "string",
        "justification": "string",
        "motsClesDetectes": [],
        "fiabilite": 0
    },
    
    "lignesDetail": []
}

RÈGLES D'EXTRACTION DÉTAILLÉES :

=== IDENTIFICATION ===
- numeroFacture : Numéro de la facture du fournisseur
- numeroCommande : N° de commande ou bon de commande
- numeroClient : NOTRE numéro client chez le fournisseur
- numeroTVAIntra : Format FR + 11 caractères ou autre pays UE
- siret : 14 chiffres si société française
- siren : 9 premiers chiffres du SIRET
- naf : Code APE/NAF si présent

=== FOURNISSEUR ===
- nom : Raison sociale complète en haut de facture
- adresse : Adresse complète du siège
- paysDomiciliation : Code ISO 2 lettres (DE pour Allemagne, FR pour France, etc.)
- compteFournisseur : Suggérer "401" + 3 premières lettres du nom en majuscules
- banque : Extraire IBAN, BIC et nom de la banque si présents

=== CLIENT (NOUS) ===
${referentielMagasins ? `
- nom : DOIT ÊTRE EXACTEMENT "${referentielMagasins.societe}" (rien d'autre)
- codeMagasin : Le code du magasin trouvé par matching (ex: "9DIJ")
` : '- nom : Notre raison sociale (destinataire de la facture)'}
- numeroClient : Notre numéro client chez le fournisseur
- adresse : Notre adresse sur la facture
- numeroTVA : Notre numéro TVA si présent

=== TVA - TRÈS IMPORTANT ===
- regime : Déterminer si "NATIONAL", "INTRACOMMUNAUTAIRE" ou "EXPORT"
- Si mention "Exemption d'impôt" ou "livraison intracommunautaire" : 
  * exoneration = true
  * tauxApplique = 0
  * motifExoneration = texte exact de la mention
  * autoliquidation = true si intracommunautaire
- Si montant HT = montant TTC : tauxApplique = 0
- Si plusieurs taux de TVA, détailler dans ventilationTVA
- Identifier le taux réel appliqué (0%, 2.1%, 5.5%, 10%, 20%)

=== ANALYSE INTELLIGENTE DU COMPTE COMPTABLE ===

ÉTAPE 1 - Détecter les mots-clés dans la facture (nom fournisseur, articles, descriptions) :

FOURNITURES BUREAU → 6064 :
- Mots-clés : cartouche, toner, encre, papier, stylo, agrafe, fourniture, bureau, administratif, classeur, ramette

INFORMATIQUE → 6183 ou 2183 (si > 500€ HT) :
- Mots-clés : ordinateur, PC, mac, écran, moniteur, clavier, souris, câble, USB, disque, SSD, mémoire, RAM, serveur, switch, routeur

LOGICIELS → 6265 :
- Mots-clés : licence, logiciel, software, abonnement, cloud, SaaS, Microsoft, Office, Adobe, antivirus

TÉLÉCOM → 6262 :
- Mots-clés : téléphone, mobile, forfait, internet, fibre, ADSL, data, SMS, Orange, SFR, Free, Bouygues

ÉNERGIE → 6061 :
- Mots-clés : électricité, gaz, EDF, Engie, Total, kWh, m3, compteur, énergie, chauffage

EAU → 6061 :
- Mots-clés : eau, SAUR, Veolia, Suez, m3, consommation eau, assainissement

CARBURANT → 6221 :
- Mots-clés : essence, gasoil, diesel, SP95, SP98, E85, carburant, Total, Shell, Esso, BP

ENTRETIEN/MAINTENANCE → 6155/6156 :
- Mots-clés : réparation, maintenance, entretien, SAV, dépannage, intervention, pièce détachée

LOCATION → 6132/6135 :
- Mots-clés : location, loyer, bail, leasing, crédit-bail, mensualité

ASSURANCE → 616 :
- Mots-clés : assurance, prime, cotisation, mutuelle, prévoyance, AXA, Allianz, MAIF, Generali

HONORAIRES → 6226 :
- Mots-clés : honoraire, conseil, avocat, expert, comptable, commissaire, notaire, huissier

FORMATION → 6228 :
- Mots-clés : formation, stage, cours, séminaire, conférence, apprentissage, e-learning

TRANSPORT/LIVRAISON → 6241 :
- Mots-clés : transport, livraison, coursier, Chronopost, UPS, DHL, FedEx, Colissimo, fret

PUBLICITÉ → 6231/6236 :
- Mots-clés : publicité, pub, annonce, Google Ads, Facebook, flyer, prospectus, catalogue, PLV

VOYAGE/DÉPLACEMENT → 6251/6256 :
- Mots-clés : hôtel, train, avion, taxi, Uber, péage, parking, restaurant, SNCF, Air France

SERVICES BANCAIRES → 627 :
- Mots-clés : frais bancaire, commission, virement, terminal, TPE, monétique

ALARME/SÉCURITÉ → 6156 :
- Mots-clés : alarme, télésurveillance, sécurité, surveillance, Verisure, ADT, gardiennage

ÉTAPE 2 - Déterminer le compte comptable selon le Plan Comptable Général français :

CLASSE 6 - COMPTES DE CHARGES :
- 6061 : Fournitures non stockables (eau, gaz, électricité)
- 6063 : Fournitures d'entretien et petit équipement (< 500€)
- 6064 : Fournitures administratives
- 6068 : Autres matières et fournitures
- 6122 : Crédit-bail mobilier
- 6132 : Locations immobilières
- 6135 : Locations mobilières
- 6155 : Entretien et réparations sur biens mobiliers
- 6156 : Maintenance
- 616  : Primes d'assurances
- 6181 : Documentation générale
- 6183 : Documentation technique (manuels, docs informatiques)
- 6211 : Personnel intérimaire
- 6221 : Carburants
- 6226 : Honoraires
- 6228 : Divers (formations, recrutement)
- 6231 : Annonces et insertions publicitaires
- 6234 : Cadeaux à la clientèle (< 73€ TTC/an/personne)
- 6236 : Catalogues et imprimés publicitaires
- 6241 : Transports sur achats
- 6251 : Voyages et déplacements
- 6256 : Missions
- 6257 : Réceptions
- 6261 : Liaisons informatiques ou spécialisées
- 6262 : Télécommunications (téléphone, internet)
- 6265 : Logiciels (abonnements, licences)
- 627  : Services bancaires et assimilés
- 6285 : Cotisations professionnelles
- 6378 : Autres taxes

CLASSE 2 - IMMOBILISATIONS (si montant > 500€ HT) :
- 2183 : Matériel informatique
- 2184 : Mobilier
- 2154 : Matériel industriel

ÉTAPE 3 - Retourner l'analyse :
"comptabilite": {
    "categorieDetectee": "[NOM_CATEGORIE]",
    "compteComptable": "[NUMERO_COMPTE]",
    "libelleCompte": "[LIBELLE_OFFICIEL]",
    "justification": "Détection de [éléments détectés] indiquant [type d'achat]",
    "motsClesDetectes": ["mot1", "mot2", "mot3"],
    "fiabilite": [0-100]  // Score de confiance
}

Exemples concrets :
- Facture Orange avec "forfait mobile" → 6262 "Télécommunications"
- Facture Prindo avec "cartouche toner" → 6064 "Fournitures administratives"
- Facture EDF avec "électricité kWh" → 6061 "Fournitures non stockables"
- Facture Dell avec "ordinateur portable 1500€" → 2183 "Matériel informatique"
- Facture Verisure avec "télésurveillance" → 6156 "Maintenance"

=== MONTANTS ===
- Toujours extraire HT, TVA et TTC
- Si seulement TTC visible et TVA > 0 : calculer HT = TTC / (1 + tauxTVA/100)
- Si pas de TVA : montantHT = montantTTC et montantTVA = 0
- fraisPort : Extraire les frais de livraison séparément
- remise : Si remise appliquée

=== DATES ===
- Format ISO obligatoire (yyyy-MM-dd)
- Date facture : "Date de facture", "Émise le", "Date"
- Date échéance : "À payer avant le", "Échéance", "Due date"
- Si pas d'échéance : ajouter 30 jours à la date facture
- Période : Pour abonnements, chercher "Période du X au Y"

=== PAIEMENT ===
- modePaiement : Détecter automatiquement :
  * "virement" si IBAN fourni pour paiement
  * "carte" si mention "carte de crédit sera débitée"
  * "prélèvement" si mention "prélèvement automatique" ou "SEPA"
  * "chèque" si mention "chèque à l'ordre de"
- conditionsPaiement : "30 jours", "À réception", "45 jours fin de mois", etc.

=== DOCUMENTS LIÉS ===
- bonCommande : N° de commande, "Order", "Commande n°"
- bonLivraison : "BL", "Delivery note"

IMPORTANT :
- Dates au format ISO (yyyy-MM-dd)
- Montants en décimal sans symbole €
- Si information manquante : null
- Toujours analyser et proposer un compte comptable`;
        
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
    console.log('🔄 Formatage des données extraites:', donneesBrutes);
    
    // Déterminer la catégorie du fournisseur
    const nomFournisseur = donneesBrutes.fournisseur?.nom || '';
    const categorie = determinerCategorieFournisseur(nomFournisseur);
    
    // Déterminer le régime TVA et le taux réel
    let tauxTVA = donneesBrutes.tva?.tauxApplique || donneesBrutes.montants?.tauxTVA || 0;
    let regime = donneesBrutes.tva?.regime || 'NATIONAL';
    let exoneration = donneesBrutes.tva?.exoneration || false;
    
    // Si livraison intracommunautaire ou export, TVA = 0
    if (regime === 'INTRACOMMUNAUTAIRE' || regime === 'EXPORT' || exoneration) {
        tauxTVA = 0;
    }
    
    // Recalculer les montants si nécessaire
    let montantTTC = donneesBrutes.montants?.montantTTC || 0;
    let montantHT = donneesBrutes.montants?.montantHT || montantTTC;
    let montantTVA = donneesBrutes.montants?.montantTVA || 0;
    
    // Si pas de TVA, HT = TTC
    if (tauxTVA === 0) {
        montantHT = montantTTC;
        montantTVA = 0;
    } else if (montantHT === 0 && montantTTC > 0) {
        // Calculer HT depuis TTC
        montantHT = montantTTC / (1 + tauxTVA / 100);
        montantTVA = montantTTC - montantHT;
    }
    
    // Déterminer le mode de paiement
    let modePaiement = null;
    if (donneesBrutes.informations?.modePaiement) {
        const mode = donneesBrutes.informations.modePaiement.toLowerCase();
        if (mode.includes('carte') || mode.includes('credit')) {
            modePaiement = 'cb';
        } else if (mode.includes('virement')) {
            modePaiement = 'virement';
        } else if (mode.includes('prelevement')) {
            modePaiement = 'prelevement';
        }
    }
    
    return {
        // ========== IDENTIFIANTS ==========
        identifiants: {
            numeroFacture: donneesBrutes.facture?.numeroFacture || donneesBrutes.identifiants?.numeroFacture || null,
            numeroCommande: donneesBrutes.identifiants?.numeroCommande || donneesBrutes.documentsLies?.bonCommande || null,
            numeroClient: donneesBrutes.client?.numeroClient || donneesBrutes.identifiants?.numeroClient || null,
            numeroTVAIntra: donneesBrutes.identifiants?.numeroTVAIntra || donneesBrutes.client?.numeroTVA || null,
            siret: donneesBrutes.identifiants?.siret || null,
            siren: donneesBrutes.identifiants?.siren || null,
            naf: donneesBrutes.identifiants?.naf || null
        },
        
        // ========== FOURNISSEUR ENRICHI ==========
        fournisseur: {
            nom: donneesBrutes.fournisseur?.nom || null,
            categorie: categorie,
            numeroClient: donneesBrutes.client?.numeroClient || null,
            siren: donneesBrutes.fournisseur?.siren || null,
            numeroTVA: donneesBrutes.fournisseur?.numeroTVA || null,
            adresse: donneesBrutes.fournisseur?.adresse || null,
            telephone: donneesBrutes.fournisseur?.telephone || null,
            email: donneesBrutes.fournisseur?.email || null,
            paysDomiciliation: donneesBrutes.fournisseur?.paysDomiciliation || detecterPays(donneesBrutes.fournisseur?.adresse),
            compteFournisseur: donneesBrutes.fournisseur?.compteFournisseur || genererCompteFournisseur(donneesBrutes.fournisseur?.nom),
            banque: donneesBrutes.fournisseur?.banque || {
                nom: null,
                iban: null,
                bic: null
            }
        },
        
        // ========== CLIENT ==========
        client: {
            nom: donneesBrutes.client?.nom || null,
            numeroClient: donneesBrutes.client?.numeroClient || null,
            adresse: donneesBrutes.client?.adresse || null,
            numeroTVA: donneesBrutes.client?.numeroTVA || null,
            pointLivraison: donneesBrutes.client?.pointLivraison || null
        },
        
        // ========== TVA DÉTAILLÉE ==========
        tva: {
            regime: regime,
            exoneration: exoneration,
            motifExoneration: donneesBrutes.tva?.motifExoneration || null,
            autoliquidation: donneesBrutes.tva?.autoliquidation || (regime === 'INTRACOMMUNAUTAIRE'),
            tauxApplique: tauxTVA,
            ventilationTVA: donneesBrutes.tva?.ventilationTVA || []
        },
        
        // ========== COMPTABILITÉ ==========
        comptabilite: {
            categorieDetectee: donneesBrutes.comptabilite?.categorieDetectee || null,
            compteComptable: donneesBrutes.comptabilite?.compteComptable || null,
            libelleCompte: donneesBrutes.comptabilite?.libelleCompte || null,
            justification: donneesBrutes.comptabilite?.justification || null,
            motsClesDetectes: donneesBrutes.comptabilite?.motsClesDetectes || [],
            fiabilite: donneesBrutes.comptabilite?.fiabilite || 0,
            journalComptable: 'HA',
            exerciceComptable: new Date().getFullYear().toString()
        },
        
        // ========== PAIEMENT ==========
        paiement: {
            modePaiement: modePaiement,
            conditionsPaiement: donneesBrutes.informations?.conditionsPaiement || '30 jours',
            iban: donneesBrutes.informations?.iban || null,
            bic: donneesBrutes.informations?.bic || null,
            referenceMandat: donneesBrutes.informations?.referenceMandat || null,
            escompte: donneesBrutes.informations?.escompte || null
        },
        
        // ========== DOCUMENTS LIÉS ==========
        documentsLies: {
            bonCommande: donneesBrutes.documentsLies?.bonCommande || donneesBrutes.identifiants?.numeroCommande || null,
            bonLivraison: donneesBrutes.documentsLies?.bonLivraison || null,
            avoir: donneesBrutes.documentsLies?.avoir || null,
            facturePrecedente: donneesBrutes.documentsLies?.facturePrecedente || null,
            contrat: donneesBrutes.documentsLies?.contrat || null
        },
        
        // ========== LIGNES DÉTAIL ==========
        lignesDetail: donneesBrutes.lignesDetail || [],
        
        // ========== MONTANTS (compatibilité ancienne) ==========
        montantHT: montantHT,
        montantTVA: montantTVA,
        montantTTC: montantTTC,
        tauxTVA: tauxTVA,
        
        // ========== MONTANTS STRUCTURÉS ==========
        montants: {
            montantHT: montantHT,
            montantTVA: montantTVA,
            montantTTC: montantTTC,
            montantNet: montantTTC,
            fraisPort: donneesBrutes.montants?.fraisPort || 0,
            remise: donneesBrutes.montants?.remise || 0
        },
        
        // ========== DATES ==========
        dateFacture: parseDate(donneesBrutes.facture?.dateFacture),
        dateEcheance: parseDate(donneesBrutes.facture?.dateEcheance || calculerEcheance(donneesBrutes.facture?.dateFacture)),
        periodeDebut: parseDate(donneesBrutes.facture?.periodeDebut),
        periodeFin: parseDate(donneesBrutes.facture?.periodeFin),
        
        // ========== NUMÉRO FACTURE ==========
        numeroFacture: donneesBrutes.facture?.numeroFacture || donneesBrutes.identifiants?.numeroFacture || null,
        
        // ========== MODE PAIEMENT (compatibilité) ==========
        modePaiement: modePaiement,
        
        // ========== MÉTADONNÉES EXTRACTION ==========
        extractionIA: {
            timestamp: donneesBrutes.timestamp_analyse,
            modele: 'gpt-4.1-mini',
            donneesBrutes: donneesBrutes,
            fournisseurDetecte: donneesBrutes.fournisseur?.nom
        }
    };
}

// ========================================
// HELPERS
// ========================================

/**
 * Déterminer la catégorie d'un fournisseur
 */
function determinerCategorieFournisseur(nomFournisseur) {
    const nom = nomFournisseur.toUpperCase();
    
    // Télécom
    if (nom.includes('FREE') || nom.includes('ORANGE') || nom.includes('SFR') || nom.includes('BOUYGUES')) {
        return 'telecom';
    }
    
    // Énergie
    if (nom.includes('EDF') || nom.includes('ENGIE') || nom.includes('TOTAL')) {
        return 'energie';
    }
    
    // Informatique
    if (nom.includes('MICROSOFT') || nom.includes('ADOBE') || nom.includes('OVH') || nom.includes('GOOGLE')) {
        return 'informatique';
    }
    
    // Par défaut
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

/**
 * Détecter le pays depuis l'adresse
 */
function detecterPays(adresse) {
    if (!adresse) return null;
    const addr = adresse.toUpperCase();
    if (addr.includes('FRANCE')) return 'FR';
    if (addr.includes('GERMANY') || addr.includes('DEUTSCHLAND')) return 'DE';
    if (addr.includes('SPAIN') || addr.includes('ESPAÑA')) return 'ES';
    if (addr.includes('ITALY') || addr.includes('ITALIA')) return 'IT';
    if (addr.includes('UNITED KINGDOM') || addr.includes('UK')) return 'GB';
    return null;
}

/**
 * Générer un compte fournisseur
 */
function genererCompteFournisseur(nomFournisseur) {
    if (!nomFournisseur) return null;
    const prefix = nomFournisseur.replace(/[^A-Z]/gi, '').substring(0, 3).toUpperCase();
    return `401${prefix}`;
}

/**
 * Calculer la date d'échéance
 */
function calculerEcheance(dateFacture, delai = 30) {
    if (!dateFacture) return null;
    const date = new Date(dateFacture);
    date.setDate(date.getDate() + delai);
    return date.toISOString().split('T')[0];
}

// ========================================
// EXPORT
// ========================================

export default {
    analyserDocument,
    analyserAvecFichier,
    extractFactureData
};