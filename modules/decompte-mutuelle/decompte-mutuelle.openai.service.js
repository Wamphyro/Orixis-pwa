// ========================================
// DECOMPTE-MUTUELLE.OPENAI.SERVICE.JS - Service d'analyse IA des décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des documents décomptes mutuelles via OpenAI GPT-4.1-mini
// Adapté du service TypeScript existant pour le module décomptes
//
// FONCTIONS PUBLIQUES:
// - analyserDocument(documentUrl, documentType) : Analyser un document
// - analyserDocumentExistant(decompteId) : Analyser un décompte existant
// - extractDecompteData(images) : Extraire les données via GPT-4
//
// DÉPENDANCES:
// - OpenAI API (GPT-4.1-mini avec vision)
// - Firebase Storage pour récupérer les documents
// ========================================

// ========================================
// CONFIGURATION
// ========================================

// Configuration de la Cloud Function
const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument';


// ========================================
// SERVICE PRINCIPAL
// ========================================

export class DecompteOpenAIService {
    
    /**
     * Analyser un document décompte complet
     * @param {string} documentUrl - URL du document dans Firebase Storage
     * @param {string} documentType - Type MIME du document
     * @param {Array} magasinsData - Données des magasins pour FINESS
     * @returns {Promise<Object>} Données extraites formatées pour Firestore
     */
    static async analyserDocument(documentUrl, documentType, magasinsData = []) {
        try {
            console.log('🤖 Début analyse IA du document décompte...');
            
            // Préparer le tableau des magasins au format attendu par le prompt
            let magasinsArray = [];
            
            // Si magasinsData est un objet (format Firebase)
            if (!Array.isArray(magasinsData) && typeof magasinsData === 'object') {
                console.log('🔍 Transformation des magasins Firebase vers format FINESS...');
                
                // Vérifier la structure d'un magasin exemple
                const exempleMagasin = Object.values(magasinsData)[0];
                console.log('📊 Structure d\'un magasin:', {
                    aNumeroFINESS: !!exempleMagasin?.numeroFINESS,
                    aFiness: !!exempleMagasin?.finess,
                    aFINESS: !!exempleMagasin?.FINESS,
                    aSociete: !!exempleMagasin?.societe,
                    aRaisonSociale: !!exempleMagasin?.societe?.raisonSociale,
                    aNom: !!exempleMagasin?.nom,
                    aAdresse: !!exempleMagasin?.adresse
                });
                
                magasinsArray = Object.entries(magasinsData).map(([code, data]) => {
                    // Debug détaillé pour comprendre le problème
                    console.log(`🔍 Traitement magasin ${code}:`, {
                        data_numeroFINESS: data.numeroFINESS,
                        data_societe: data.societe,
                        data_societe_raisonSociale: data.societe?.raisonSociale,
                        data_adresse: data.adresse
                    });
                    
                    // Extraction sécurisée des données
                    const finess = data.numeroFINESS || data.finess || data.FINESS || '';
                    const societe = data.societe?.raisonSociale || data.raisonSociale || data.societe || data.nom || '';
                    const rue = data.adresse?.rue || data.rue || '';
                    const codePostal = data.adresse?.codePostal || data.codePostal || '';
                    const ville = data.adresse?.ville || data.ville || '';
                    const adresse = `${rue} ${codePostal} ${ville}`.trim();
                    
                    const magasinFormatte = {
                        "FINESS": finess,
                        "CODE MAGASIN": code,
                        "SOCIETE": societe,
                        "ADRESSE": adresse,
                        "VILLE": ville
                    };
                    
                    console.log(`✅ Magasin ${code} formatté:`, magasinFormatte);
                    
                    // Log si données manquantes pour debug
                    if (!finess) {
                        console.warn(`⚠️ FINESS manquant pour ${code}`);
                    }
                    
                    return magasinFormatte;
                });
                console.log('✅ Magasins transformés:', JSON.stringify(magasinsArray.slice(0, 2), null, 2));
            } 
            // Si c'est déjà un tableau
            else if (Array.isArray(magasinsData)) {
                magasinsArray = magasinsData.map(data => ({
                    "FINESS": data.numeroFINESS || data.finess || data.FINESS || '',
                    "CODE MAGASIN": data.code || '',
                    "SOCIETE": data.societe?.raisonSociale || data.societe || data.nom || '',
                    "ADRESSE": `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                    "VILLE": data.adresse?.ville || data.ville || ''
                }));
            }
            
            console.log(`📍 ${magasinsArray.length} magasins pour recherche FINESS`);
            console.log('📍 Exemple magasin:', JSON.stringify(magasinsArray[0], null, 2)); // Pour debug
            console.log('📍 Tous les magasins:', JSON.stringify(magasinsArray.slice(0, 3), null, 2)); // Debug premiers magasins
            
            // Convertir le document en image(s) base64
            const images = await this.prepareDocumentImages(documentUrl, documentType);
            
            // Extraire les données via GPT-4
            console.log('🚀 Appel extractDecompteData avec', magasinsArray.length, 'magasins');
            const donneesExtraites = await DecompteOpenAIService.extractDecompteData(images, magasinsArray);
            
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
     * @param {Array} magasinsArray - Tableau des magasins
     * @returns {Promise<Object>} Données brutes extraites
     */
static async extractDecompteData(images, magasinsArray = []) {
        try {
            console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
            
            // Préparer la chaîne JSON des magasins
            const magasinsJSON = JSON.stringify(magasinsArray, null, 2);
            console.log('📋 Magasins qui seront envoyés dans le prompt:', magasinsJSON);
            
            // VOTRE PROMPT COMPLET
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
    2. Extraire le nombre qui suit (exactement 9 chiffres)
    3. Supprimer tous les zéros initiaux
    4. Rechercher ce FINESS dans le tableau fourni
    5. Si trouvé : centre = "CODE MAGASIN", societe = "SOCIETE"
    6. Si non trouvé, chercher l'ADRESSE du destinataire et chercher une correspondance
    7. Si trouvé par adresse : centre = "CODE MAGASIN", societe = "SOCIETE"
    8. Sinon : centre = "INCONNU", societe = ""

    EXTRACTION DE LA MUTUELLE :
    - Chercher "AMC :", "Mutuelle :", "Assurance :", "Organisme complémentaire"
    - Si non trouvé, chercher dans l'en-tête du document
    - NE PAS confondre avec le réseau de soins
    - NE PAS prendre le destinataire (professionnel de santé)
    - organisme_mutuelle NE PEUT PAS être égal à societe
    - En MAJUSCULES

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
            
            // LOG DU PROMPT POUR DEBUG
            console.log('🤖 ===== PROMPT ENVOYÉ À GPT =====');
            console.log(prompt);
            console.log('🤖 ===== FIN DU PROMPT =====');
            
            // Log aussi la taille des images
            console.log(`📸 Envoi de ${images.length} image(s)`);
            images.forEach((img, index) => {
                console.log(`📸 Image ${index + 1}: ${img.length} caractères base64`);
            });
            
            // Préparer le body de la requête
            const requestBody = {
                images: images,
                prompt: prompt,
                type: 'mutuelle'
            };
            
            console.log('📤 Requête Cloud Function:', {
                url: CLOUD_FUNCTION_URL,
                bodySize: JSON.stringify(requestBody).length,
                promptLength: prompt.length,
                imagesCount: images.length
            });
            
            // Appeler la Cloud Function avec votre prompt
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
            
            // Retourner les données extraites
            return result.data || {};
            
        } catch (error) {
            console.error('❌ Erreur appel Cloud Function:', error);
            throw error;
        }
    }
    
    /**
     * Analyser un décompte déjà existant
     * @param {string} decompteId - ID du décompte
     * @returns {Promise<Object>} Données mises à jour
     */
    static async analyserDocumentExistant(decompteId) {
        try {
            // Récupérer le décompte
            const firestoreService = await import('./decompte-mutuelle.firestore.service.js');
            const decompte = await firestoreService.getDecompteById(decompteId);
            
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            if (!decompte.documents || decompte.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // NE PAS utiliser chargerMagasins() qui retourne une version simplifiée
            // Charger DIRECTEMENT depuis Firestore pour avoir TOUTES les données
            console.log('🏪 Chargement COMPLET des magasins depuis Firestore...');
            
            const { collection, getDocs, query, where } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            const { db } = await import('../../src/services/firebase.service.js');
            
            // Créer une requête pour récupérer TOUS les magasins actifs
            const magasinsRef = collection(db, 'magasins');
            const q = query(magasinsRef, where('actif', '==', true));
            
            // Récupérer TOUS les documents
            const magasinsSnapshot = await getDocs(q);
            const magasinsData = {};
            
            console.log(`📊 ${magasinsSnapshot.size} magasins trouvés dans Firestore`);
            
            magasinsSnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`📄 Magasin ${doc.id}:`, {
                    code: data.code,
                    numeroFINESS: data.numeroFINESS,
                    societe: data.societe,
                    adresse: data.adresse,
                    'keys': Object.keys(data).join(', ')
                });
                
                // Stocker par code pour faciliter l'accès
                if (data.code) {
                    magasinsData[data.code] = {
                        ...data,
                        id: doc.id
                    };
                }
            });
            
            console.log('🏪 Magasins chargés:', Object.keys(magasinsData).length);
            const exempleMagasin = Object.values(magasinsData)[0];
            if (exempleMagasin) {
                console.log('🏪 Structure complète d\'un magasin:', JSON.stringify(exempleMagasin, null, 2));
                console.log('🏪 Vérification champs importants:', {
                    numeroFINESS: exempleMagasin.numeroFINESS,
                    societe: exempleMagasin.societe,
                    adresse: exempleMagasin.adresse
                });
            }
            
            // Stocker les magasins en localStorage pour la conversion FINESS → Code
            localStorage.setItem('orixis_magasins', JSON.stringify(magasinsData));
            
            // Analyser le premier document
            const document = decompte.documents[0];
            const donneesExtraites = await this.analyserDocument(
                document.url,
                document.type,
                magasinsData  // Passer directement magasinsData, pas magasinsArray
            );
            
            // Mettre à jour le décompte
            await firestoreService.ajouterDonneesExtraites(decompteId, donneesExtraites);
            
            return {
                decompteId,
                donneesExtraites,
                documentAnalyse: document.nom
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse décompte existant:', error);
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
    
    // HACK TEMPORAIRE : On envoie le PDF tel quel à OpenAI
    // GPT-4 Vision peut parfois lire des PDF simples
    if (documentType === 'application/pdf') {
        console.warn('⚠️ Envoi PDF direct à OpenAI - fonctionnalité expérimentale');
    }
    
    try {
        // On récupère le fichier comme blob peu importe le type
        const response = await fetch(documentUrl);
        const blob = await response.blob();
        
        // Convertir en base64
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
        
        console.log('✅ Document converti en base64, taille:', base64.length);
        return [base64];
        
    } catch (error) {
        console.error('❌ Erreur conversion:', error);
        throw new Error('Impossible de lire le document');
    }
}
    
    /**
     * Récupérer une image et la convertir en base64
     * @private
     */
    static async fetchImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw new Error('Impossible de récupérer l\'image');
        }
    }

    
    /**
     * Formater les données pour Firestore
     * @private
     */
    static formaterPourFirestore(donneesBrutes) {
    // Pour l'instant, on travaille avec les données de test de la Cloud Function
    if (donneesBrutes.client) {
        // Données déjà au bon format depuis la Cloud Function
        return donneesBrutes;
    }
    
    // Fallback pour l'ancien format (sera utile quand on ajoutera le vrai OpenAI)
    const premierVirement = donneesBrutes.virements?.[0] || {};
    const premierClient = premierVirement.clients?.[0] || {};
    
    // Calculer le type de décompte
    const nombreClients = premierVirement.nb_clients || 1;
    const typeDecompte = nombreClients > 1 ? 'groupe' : 'individuel';
    
    return {
        // Client principal
        client: {
            nom: premierClient.ClientNom || null,
            prenom: premierClient.ClientPrenom || null,
            numeroSecuriteSociale: this.nettoyerNSS(premierClient.NumeroSecuriteSociale),
            numeroAdherent: premierClient.NumeroAdherent || null
        },
        
        // Mutuelle et prestataire
        mutuelle: donneesBrutes.organisme_mutuelle || null,
        prestataireTP: donneesBrutes.prestataireTP || donneesBrutes.reseau_soins || null,
        
        // Montants
        montantRemboursementClient: premierClient.Montant || 0,
        montantVirement: premierVirement.MontantVirementGlobal || 0,
        
        // Type et nombre
        typeDecompte: typeDecompte,
        nombreClients: nombreClients,
        
        // Références
        virementId: premierVirement.VirementLibelle || null,
        dateVirement: this.parseDate(premierVirement.DateVirement),
        
        // Magasin - Convertir FINESS en code magasin
        codeMagasin: donneesBrutes.centre !== 'INCONNU' ? 
            this.findCodeMagasinByFiness(donneesBrutes.centre) : 
            null,
        
        // Tous les clients (pour référence)
        clientsDetails: premierVirement.clients || [],
        
        // Métadonnées
        extractionIA: {
            timestamp: donneesBrutes.timestamp_analyse,
            modele: 'gpt-4.1-mini',
            societeDetectee: donneesBrutes.societe,
            periode: donneesBrutes.periode
        }
    };
}
    
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
     * Trouver le code magasin à partir du FINESS
     * @private
     */
    static findCodeMagasinByFiness(finess) {
        // Récupérer les magasins depuis le localStorage ou une variable globale
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
        return finess; // Retourner le FINESS si pas trouvé
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
    // initializeService supprimé car plus utilisé
    analyserDocument: DecompteOpenAIService.analyserDocument.bind(DecompteOpenAIService),
    analyserDocumentExistant: DecompteOpenAIService.analyserDocumentExistant.bind(DecompteOpenAIService),
    extractDecompteData: DecompteOpenAIService.extractDecompteData.bind(DecompteOpenAIService)
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création basée sur le service TypeScript
   - Adaptation du service existant en JavaScript
   - Utilisation de gpt-4.1-mini au lieu de gpt-4-vision
   - Gestion du FINESS et recherche magasins
   
   NOTES POUR REPRISES FUTURES:
   - La clé API doit être initialisée avant utilisation
   - Conversion PDF → Images à implémenter
   - Le prompt est optimisé pour les décomptes mutuelles FR
   ======================================== */