// ========================================
// DECOMPTE-MUTUELLE.SERVICE.JS - Service Backend Unifié COMPLET
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.service.js
//
// DESCRIPTION:
// Service COMPLET qui gère TOUT le backend des décomptes mutuelles
// Fusion TOTALE de : upload, firestore, openai, métier, data, helpers
//
// SECTIONS:
// 1. Configuration et constantes métier
// 2. Upload Storage avec hash SHA-256
// 3. CRUD Firestore complet
// 4. Analyse IA avec prompt complet
// 5. Logique métier et workflow
// 6. Helpers et formatters
// 7. Statistiques et recherche
// ========================================

import { db, storage } from '../../src/services/firebase.service.js';
import { DECOMPTE_TEMPLATE } from './decompte-mutuelle.template.js';

// ========================================
// SECTION 1 : CONFIGURATION ET CONSTANTES MÉTIER
// ========================================

const CONFIG = {
    // Collection Firestore
    COLLECTION_NAME: 'decomptesMutuelles',
    
    // Storage
    STORAGE_BASE_PATH: 'decomptes-mutuelles',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
    
    // OpenAI
    CLOUD_FUNCTION_URL: 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument',
    
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // Statuts workflow
    STATUTS: {
        NOUVEAU: 'nouveau',
        TRAITEMENT_IA: 'traitement_ia',
        TRAITEMENT_EFFECTUE: 'traitement_effectue',
        TRAITEMENT_MANUEL: 'traitement_manuel',
        RAPPROCHEMENT_BANCAIRE: 'rapprochement_bancaire',
        SUPPRIME: 'supprime'
    },
    
    // Infos statuts pour UI
    STATUTS_INFO: {
        nouveau: {
            label: 'Nouveau',
            icon: '📋',
            couleur: '#e9ecef',
            suivant: 'traitement_ia',
            description: 'Décompte créé, en attente de traitement'
        },
        traitement_ia: {
            label: 'Traitement IA',
            icon: '🤖',
            couleur: '#cfe2ff',
            suivant: 'traitement_effectue',
            description: 'En cours de traitement par intelligence artificielle'
        },
        traitement_effectue: {
            label: 'Traité',
            icon: '✅',
            couleur: '#d1e7dd',
            suivant: 'rapprochement_bancaire',
            description: 'Traitement terminé, en attente de rapprochement'
        },
        traitement_manuel: {
            label: 'Traitement manuel',
            icon: '✏️',
            couleur: '#fff3cd',
            suivant: 'rapprochement_bancaire',
            description: 'Nécessite une intervention manuelle'
        },
        rapprochement_bancaire: {
            label: 'Rapproché',
            icon: '🔗',
            couleur: '#e7f1ff',
            suivant: null,
            description: 'Rapprochement bancaire effectué'
        },
        supprime: {
            label: 'Supprimé',
            icon: '🗑️',
            couleur: '#f8d7da',
            suivant: null,
            description: 'Décompte supprimé'
        }
    },
    
    // Types de décompte
    TYPES_DECOMPTE: {
        individuel: {
            label: 'Individuel',
            icon: '👤',
            description: 'Décompte pour un seul client'
        },
        groupe: {
            label: 'Groupé',
            icon: '👥',
            description: 'Décompte pour plusieurs clients'
        }
    },
    
    // Messages et textes
    MESSAGES: {
        AUCUN_DECOMPTE: 'Aucun décompte mutuelle pour le moment',
        CHARGEMENT: 'Chargement des décomptes...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des décomptes',
        DECOMPTE_CREE: 'Décompte créé avec succès',
        DECOMPTE_MIS_A_JOUR: 'Décompte mis à jour',
        DECOMPTE_SUPPRIME: 'Décompte supprimé avec succès',
        
        // Confirmations
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer ce décompte ?',
        CONFIRMER_TRANSMISSION: 'Confirmer la transmission à l\'IA pour traitement ?',
        CONFIRMER_VALIDATION: 'Confirmer la validation du traitement ?',
        CONFIRMER_RAPPROCHEMENT: 'Confirmer le rapprochement bancaire ?',
        
        // Erreurs
        ERREUR_NSS_INVALIDE: 'Numéro de sécurité sociale invalide',
        ERREUR_MONTANT_INVALIDE: 'Montant invalide',
        ERREUR_DROITS: 'Vous n\'avez pas les droits pour cette action',
        ERREUR_UPLOAD: 'Erreur lors de l\'upload du fichier',
        ERREUR_FICHIER_TROP_GROS: 'Fichier trop volumineux (max 10MB)',
        ERREUR_TYPE_FICHIER: 'Type de fichier non autorisé. Utilisez PDF, JPG ou PNG'
    },
    
    // Validations (regex métier)
    VALIDATIONS: {
        NSS: /^[12][0-9]{2}(0[1-9]|1[0-2])[0-9]{2}[0-9]{3}[0-9]{3}[0-9]{2}$/,
        MONTANT: /^\d+(\.\d{1,2})?$/,
        VIREMENT_ID: /^VIR-\d{4}-\d{2}-\d{3}$/,
        NUMERO_DECOMPTE: /^DEC-\d{8}-\d{4}$/
    },
    
    // Formats d'affichage
    FORMATS: {
        DATE: {
            jour: 'DD/MM/YYYY',
            mois: 'MM/YYYY',
            complet: 'DD/MM/YYYY à HH:mm'
        },
        NUMERO_DECOMPTE: 'DEC-{YYYYMMDD}-{XXXX}',
        VIREMENT_ID: 'VIR-{YYYY}-{MM}-{XXX}',
        MONTANT: {
            devise: '€',
            decimales: 2
        }
    }
};

// ========================================
// STOCKAGE DES DONNÉES DYNAMIQUES
// ========================================

// Mutuelles extraites des décomptes réels
let mutuellesDynamiques = new Set();

// Réseaux TP extraits des décomptes réels
let reseauxTPDynamiques = new Set();

// ========================================
// CLASSE PRINCIPALE DU SERVICE
// ========================================

class DecompteMutuelleService {
    
    // ========================================
    // SECTION 2 : UPLOAD STORAGE AVEC HASH
    // ========================================
    
    /**
     * Upload un ou plusieurs documents
     * @param {File[]} files - Fichiers à uploader
     * @returns {Promise<Object>} Résultats de l'upload
     */
    async uploadDocuments(files) {
        const resultats = {
            reussis: [],
            erreurs: []
        };
        
        console.log(`📤 Upload de ${files.length} fichier(s)...`);
        
        for (const file of files) {
            try {
                // Validation
                this.validateFile(file);
                
                // Calculer le hash pour détecter les doublons
                const hash = await this.calculateFileHash(file);
                console.log(`📊 Hash calculé pour ${file.name}: ${hash.substring(0, 8)}...`);
                
                // Upload
                const metadata = await this.uploadSingleDocument(file, hash);
                resultats.reussis.push(metadata);
                console.log(`✅ ${file.name} uploadé avec succès`);
                
            } catch (error) {
                console.error(`❌ Erreur upload ${file.name}:`, error);
                resultats.erreurs.push({
                    fichier: file.name,
                    erreur: error.message
                });
            }
        }
        
        if (resultats.erreurs.length > 0) {
            console.warn(`⚠️ ${resultats.erreurs.length} upload(s) échoué(s)`);
        }
        
        return resultats;
    }
    
    /**
     * Upload un seul document
     * @private
     */
    async uploadSingleDocument(file, hash) {
        const { ref, uploadBytes, getDownloadURL } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
        );
        
        // Créer le chemin de stockage
        const userInfo = this.getUserInfo();
        const date = new Date();
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const jour = String(date.getDate()).padStart(2, '0');
        
        // Créer un nom standardisé
        const dateStr = `${annee}${mois}${jour}`;
        const timeStr = date.toTimeString().slice(0,8).replace(/:/g, '');
        const shortUUID = crypto.randomUUID().substring(0, 8);
        const extension = file.name.split('.').pop().toLowerCase();
        const nomFichier = `DM_${userInfo.societe}_${dateStr}_${timeStr}_${shortUUID}.${extension}`;
        
        // Chemin complet
        const chemin = `${CONFIG.STORAGE_BASE_PATH}/${userInfo.societe}/inbox/${annee}/${mois}/${jour}/${nomFichier}`;
        
        console.log(`📁 Chemin Storage: ${chemin}`);
        
        // Créer la référence Storage
        const storageRef = ref(storage, chemin);
        
        // Métadonnées personnalisées
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadePar: userInfo.name,
                magasinUploadeur: userInfo.magasin,
                societeUploadeur: userInfo.societe,
                nomOriginal: file.name,
                hash: hash,
                dateUpload: new Date().toISOString(),
                taille: String(file.size)
            }
        };
        
        // Upload du fichier
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const url = await getDownloadURL(snapshot.ref);
        
        return {
            nom: nomFichier,
            nomOriginal: file.name,
            chemin: chemin,
            url: url,
            taille: file.size,
            type: file.type,
            hash: hash,
            dateUpload: new Date()
        };
    }
    
    /**
     * Calculer le hash SHA-256 d'un fichier
     * @param {File} file - Le fichier
     * @returns {Promise<string>} Le hash en hexadécimal
     */
    async calculateFileHash(file) {
        try {
            // Lire le fichier comme ArrayBuffer
            const buffer = await file.arrayBuffer();
            
            // Calculer le hash SHA-256
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            
            // Convertir en hexadécimal
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            return hashHex;
            
        } catch (error) {
            console.error('❌ Erreur calcul hash:', error);
            // Fallback avec timestamp si erreur
            return 'hash-error-' + Date.now();
        }
    }
    
    /**
     * Valider un fichier avant upload
     * @private
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            throw new Error(CONFIG.MESSAGES.ERREUR_FICHIER_TROP_GROS);
        }
        
        // Vérifier le type
        if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(CONFIG.MESSAGES.ERREUR_TYPE_FICHIER);
        }
        
        console.log(`✅ Fichier ${file.name} validé (${(file.size / 1024).toFixed(1)} KB)`);
    }
    
    /**
     * Supprimer un document de Storage
     * @param {string} chemin - Le chemin du document
     */
    async deleteDocument(chemin) {
        try {
            const { ref, deleteObject } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
            );
            
            const storageRef = ref(storage, chemin);
            await deleteObject(storageRef);
            
            console.log('🗑️ Document supprimé:', chemin);
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Error(`Erreur lors de la suppression: ${error.message}`);
        }
    }
    
    // ========================================
    // SECTION 3 : CRUD FIRESTORE COMPLET
    // ========================================
    
    /**
     * Créer un nouveau décompte
     * @param {Object} data - Données initiales (documents uploadés)
     * @returns {Promise<string>} ID du décompte créé
     */
    async creerDecompte(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Générer le numéro de décompte
            const numeroDecompte = await this.genererNumeroDecompte();
            
            // Récupérer les infos utilisateur
            const userInfo = this.getUserInfo();
            
            console.log('🔍 DEBUG Auth:', userInfo);
            console.log('🔍 DEBUG raisonSociale:', userInfo.societe);
            console.log('🔍 DEBUG magasin:', userInfo.magasin);
            
            // Cloner le template pour garantir la structure
            const decompteData = JSON.parse(JSON.stringify(DECOMPTE_TEMPLATE));
            
            // Remplir les données du template
            decompteData.numeroDecompte = numeroDecompte;
            decompteData.typeDecompte = null; // Sera déterminé par l'IA
            
            // Organisation - Récupérer la raison sociale dynamiquement si nécessaire
            if (userInfo.societe === 'NON_DEFINI' && userInfo.magasin) {
                try {
                    const magasins = await this.chargerMagasins();
                    const magasinUser = magasins.find(m => m['CODE MAGASIN'] === userInfo.magasin);
                    decompteData.societe = magasinUser?.SOCIETE || 'NON DEFINI';
                } catch (error) {
                    decompteData.societe = 'NON DEFINI';
                }
            } else {
                decompteData.societe = userInfo.societe;
            }
            
            decompteData.codeMagasin = userInfo.magasin;
            decompteData.magasinUploadeur = userInfo.magasin;
            
            // Documents uploadés
            decompteData.documents = data.documents || [];
            
            // Dates - utiliser serverTimestamp pour la création
            decompteData.dates.creation = serverTimestamp();
            
            // Intervenants
            decompteData.intervenants.creePar = {
                id: userInfo.id,
                nom: userInfo.nom,
                prenom: userInfo.prenom,
                role: userInfo.role || 'technicien'
            };
            
            // Historique initial
            decompteData.historique = [{
                date: new Date(),
                action: 'creation',
                details: `${data.documents.length} document(s) uploadé(s)`,
                timestamp: Date.now(),
                utilisateur: decompteData.intervenants.creePar
            }];
            
            // Statut initial
            decompteData.statut = CONFIG.STATUTS.NOUVEAU;
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, CONFIG.COLLECTION_NAME), decompteData);
            
            console.log('✅ Décompte créé avec template:', numeroDecompte, 'ID:', docRef.id);
            console.log('📋 Structure complète:', decompteData);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création décompte:', error);
            throw new Error(`Erreur lors de la création: ${error.message}`);
        }
    }
    
    /**
     * Récupérer les décomptes avec filtres
     * @param {Object} filtres - Filtres optionnels
     * @returns {Promise<Array>} Liste des décomptes
     */
    async getDecomptes(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, CONFIG.COLLECTION_NAME);
            const constraints = [];
            
            // Construire la requête avec les filtres
            if (filtres.societe) {
                constraints.push(where('societe', '==', filtres.societe));
            }
            
            if (filtres.statut) {
                constraints.push(where('statut', '==', filtres.statut));
            }
            
            if (filtres.magasin) {
                constraints.push(where('codeMagasin', '==', filtres.magasin));
            }
            
            if (filtres.mutuelle) {
                constraints.push(where('mutuelle', '==', filtres.mutuelle));
            }
            
            // Tri par défaut : plus récent en premier
            constraints.push(orderBy('dates.creation', 'desc'));
            
            if (filtres.limite) {
                constraints.push(limit(filtres.limite));
            }
            
            // Appliquer les contraintes
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            
            // Exécuter la requête
            const snapshot = await getDocs(q);
            
            const decomptes = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                decomptes.push({
                    id: doc.id,
                    ...data
                });
                
                // Mettre à jour les mutuelles et réseaux dynamiques
                if (data.mutuelle) mutuellesDynamiques.add(data.mutuelle);
                if (data.prestataireTP) reseauxTPDynamiques.add(data.prestataireTP);
            });
            
            console.log(`📊 ${decomptes.length} décomptes trouvés`);
            return decomptes;
            
        } catch (error) {
            console.error('❌ Erreur récupération décomptes:', error);
            return [];
        }
    }
    
    /**
     * Récupérer un décompte par ID
     * @param {string} id - ID du décompte
     * @returns {Promise<Object|null>} Le décompte ou null
     */
    async getDecompteById(id) {
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const docRef = doc(db, CONFIG.COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }
            
            console.warn(`⚠️ Décompte ${id} introuvable`);
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération décompte:', error);
            return null;
        }
    }
    
    /**
     * Mettre à jour un décompte
     * @param {string} id - ID du décompte
     * @param {Object} updates - Mises à jour
     * @returns {Promise<void>}
     */
    async updateDecompte(id, updates) {
        const { doc, updateDoc, arrayUnion } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Ajouter à l'historique
        const userInfo = this.getUserInfo();
        const updatesAvecHistorique = {
            ...updates,
            historique: arrayUnion({
                date: new Date(),
                action: 'mise_a_jour',
                details: 'Décompte mis à jour',
                timestamp: Date.now(),
                utilisateur: {
                    id: userInfo.id,
                    nom: userInfo.nom,
                    prenom: userInfo.prenom,
                    role: userInfo.role
                }
            })
        };
        
        await updateDoc(doc(db, CONFIG.COLLECTION_NAME, id), updatesAvecHistorique);
        console.log('✅ Décompte mis à jour:', id);
    }
    
    // ========================================
    // SECTION 4 : ANALYSE IA AVEC PROMPT COMPLET
    // ========================================
    
    /**
     * Analyser un décompte avec l'IA en passant directement le fichier
     * @param {string} decompteId - ID du décompte
     * @param {File} file - Fichier original à analyser
     * @returns {Promise<Object>} Données extraites
     */
    async analyserDecompteIAAvecFichier(decompteId, file) {
        try {
            console.log('🤖 Début analyse IA pour décompte:', decompteId, 'avec fichier:', file.name);
            
            // Récupérer le décompte
            const decompte = await this.getDecompteById(decompteId);
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            // Charger les magasins
            console.log('🏪 Chargement des magasins...');
            const magasins = await this.chargerMagasinsComplet();
            console.log(`📍 ${magasins.length} magasins pour recherche FINESS`);
            
            // Convertir le fichier en base64 directement
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            console.log('✅ Fichier converti en base64, taille:', base64.length);
            
            // Extraire les données via GPT-4
            const donneesExtraites = await this.extractDecompteData([base64], magasins);
            
            // Formater pour notre structure Firestore
            const donneesFormatees = this.formaterDonneesIA(donneesExtraites);
            
            // Mettre à jour le décompte avec les données extraites
            await this.ajouterDonneesExtraites(decompteId, donneesFormatees);
            
            console.log('✅ Analyse IA terminée avec succès');
            
            return {
                decompteId,
                donneesExtraites: donneesFormatees,
                documentAnalyse: file.name
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse IA:', error);
            throw error;
        }
    }
    
    /**
     * Analyser un décompte avec l'IA
     * @param {string} decompteId - ID du décompte
     * @returns {Promise<Object>} Données extraites
     */
    async analyserDecompteIA(decompteId) {
        try {
            console.log('🤖 Début analyse IA pour décompte:', decompteId);
            
            // Récupérer le décompte
            const decompte = await this.getDecompteById(decompteId);
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            if (!decompte.documents || decompte.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // Charger TOUS les magasins depuis Firestore
            console.log('🏪 Chargement COMPLET des magasins depuis Firestore...');
            const magasins = await this.chargerMagasinsComplet();
            
            console.log(`📍 ${magasins.length} magasins pour recherche FINESS`);
            console.log('📍 Exemple magasin:', JSON.stringify(magasins[0], null, 2));
            
            // Analyser le premier document
            const document = decompte.documents[0];
            const donneesExtraites = await this.analyserDocument(
                document.url,
                document.type,
                magasins
            );
            
            // Mettre à jour le décompte avec les données extraites
            await this.ajouterDonneesExtraites(decompteId, donneesExtraites);
            
            console.log('✅ Analyse IA terminée avec succès');
            
            return {
                decompteId,
                donneesExtraites,
                documentAnalyse: document.nom
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse IA:', error);
            throw error;
        }
    }
    
    /**
     * Analyser un document complet
     * @private
     */
    async analyserDocument(documentUrl, documentType, magasinsData) {
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
     * Extraire les données via GPT-4 Vision avec PROMPT COMPLET
     * @param {Array<string>} images - Images en base64
     * @param {Array} magasinsArray - Tableau des magasins
     * @returns {Promise<Object>} Données brutes extraites
     */
    async extractDecompteData(images, magasinsArray = []) {
        try {
            console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
            
            // Préparer la chaîne JSON des magasins
            const magasinsJSON = JSON.stringify(magasinsArray, null, 2);
            
            // PROMPT COMPLET (basé sur decompte-mutuelle.openai.service.js)
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
            const response = await fetch(CONFIG.CLOUD_FUNCTION_URL, {
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
            
            return result.data || {};
            
        } catch (error) {
            console.error('❌ Erreur appel Cloud Function:', error);
            throw error;
        }
    }
    
    /**
     * Préparer les images du document
     * @private
     */
    async prepareDocumentImages(documentUrl, documentType) {
        console.log('📄 Type de document:', documentType);
        
        try {
            // On récupère le fichier comme blob
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
     * Formater les données extraites par l'IA pour Firestore
     * @private
     */
    formaterDonneesIA(donneesBrutes) {
        const premierVirement = donneesBrutes.virements?.[0] || {};
        const premierClient = premierVirement.clients?.[0] || {};
        
        // Calculer le type de décompte
        const nombreClients = premierVirement.nb_clients || 1;
        const typeDecompte = nombreClients > 1 ? 'groupe' : 'individuel';
        
        // Nettoyer le NSS
        const nssClean = this.nettoyerNSS(premierClient.NumeroSecuriteSociale);
        
        return {
            // Client principal
            client: {
                nom: premierClient.ClientNom || null,
                prenom: premierClient.ClientPrenom || null,
                numeroSecuriteSociale: nssClean,
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
            
            // Magasin - Convertir FINESS en code magasin si nécessaire
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
     * Ajouter les données extraites au décompte
     * @private
     */
    async ajouterDonneesExtraites(decompteId, donnees) {
        const { serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        const updates = {
            // Client - structure complète conforme au template
            client: {
                id: donnees.client?.id || null,
                nom: donnees.client?.nom || null,
                prenom: donnees.client?.prenom || null,
                numeroSecuriteSociale: donnees.client?.numeroSecuriteSociale || null
            },
            
            // Données financières
            mutuelle: donnees.mutuelle || null,
            montantRemboursementClient: donnees.montantRemboursementClient || 0,
            montantVirement: donnees.montantVirement || 0,
            nombreClients: donnees.nombreClients || 1,
            
            // Magasin concerné
            codeMagasin: donnees.magasinConcerne || donnees.codeMagasin,
            
            // Prestataire TP
            prestataireTP: donnees.prestataireTP || null,
            
            // Mise à jour des dates
            'dates.transmissionIA': serverTimestamp(),
            'dates.traitementEffectue': serverTimestamp(),
            
            // Type de décompte
            typeDecompte: donnees.typeDecompte || 'individuel',
            
            // Références de virement
            virementId: donnees.virementId || null,
            dateVirement: donnees.dateVirement || null,
            
            // Mise à jour du statut
            statut: CONFIG.STATUTS.TRAITEMENT_EFFECTUE,
            
            // Intervenant qui a traité
            'intervenants.traitePar': {
                id: 'system_ia',
                nom: 'SYSTEM',
                prenom: 'IA',
                role: 'system'
            }
        };
        
        await this.updateDecompte(decompteId, updates);
        console.log('✅ Données IA ajoutées au décompte');
    }
    
    // ========================================
    // SECTION 5 : LOGIQUE MÉTIER ET WORKFLOW
    // ========================================
    
    /**
     * Changer le statut d'un décompte
     * @param {string} decompteId - ID du décompte
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} options - Options (motif, etc.)
     * @returns {Promise<void>}
     */
    async changerStatut(decompteId, nouveauStatut, options = {}) {
        const { serverTimestamp, arrayUnion } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Récupérer le décompte actuel
        const decompte = await this.getDecompteById(decompteId);
        if (!decompte) {
            throw new Error('Décompte introuvable');
        }
        
        // Vérifier que le changement est valide
        const statutActuel = decompte.statut;
        const statutSuivantAttendu = this.getProchainStatut(statutActuel);
        
        // Autoriser le passage vers traitement manuel depuis traitement_ia
        const isPassageManuel = statutActuel === CONFIG.STATUTS.TRAITEMENT_IA && 
                                nouveauStatut === CONFIG.STATUTS.TRAITEMENT_MANUEL;
        
        if (nouveauStatut !== CONFIG.STATUTS.SUPPRIME && 
            nouveauStatut !== statutSuivantAttendu && 
            !isPassageManuel) {
            throw new Error(`Passage de ${statutActuel} à ${nouveauStatut} non autorisé`);
        }
        
        // Préparer les mises à jour
        const userInfo = this.getUserInfo();
        const updates = {
            statut: nouveauStatut,
            historique: arrayUnion({
                date: new Date(),
                action: `statut_${nouveauStatut}`,
                utilisateur: {
                    id: userInfo.id,
                    nom: userInfo.nom,
                    prenom: userInfo.prenom,
                    role: userInfo.role
                },
                details: `Statut changé en ${CONFIG.STATUTS_INFO[nouveauStatut].label}`,
                timestamp: Date.now()
            })
        };
        
        // Mises à jour spécifiques selon le statut
        switch (nouveauStatut) {
            case CONFIG.STATUTS.TRAITEMENT_IA:
                updates['dates.transmissionIA'] = serverTimestamp();
                break;
                
            case CONFIG.STATUTS.TRAITEMENT_EFFECTUE:
                updates['dates.traitementEffectue'] = serverTimestamp();
                updates['intervenants.traitePar'] = userInfo;
                break;
                
            case CONFIG.STATUTS.TRAITEMENT_MANUEL:
                updates['dates.traitementManuel'] = serverTimestamp();
                updates['intervenants.traitePar'] = userInfo;
                if (options.motif) {
                    updates.motifTraitementManuel = options.motif;
                }
                break;
                
            case CONFIG.STATUTS.RAPPROCHEMENT_BANCAIRE:
                updates['dates.rapprochementBancaire'] = serverTimestamp();
                updates['intervenants.rapprochePar'] = userInfo;
                break;
                
            case CONFIG.STATUTS.SUPPRIME:
                updates.suppression = {
                    date: serverTimestamp(),
                    par: userInfo,
                    motif: options.motif || 'Non spécifié'
                };
                break;
        }
        
        // Effectuer la mise à jour
        await this.updateDecompte(decompteId, updates);
        
        console.log(`✅ Statut changé: ${statutActuel} → ${nouveauStatut}`);
    }
    
    /**
     * Supprimer un décompte (soft delete)
     * @param {string} decompteId - ID du décompte
     * @param {Object} infos - Informations de suppression
     * @returns {Promise<void>}
     */
    async supprimerDecompte(decompteId, infos = {}) {
        try {
            await this.changerStatut(decompteId, CONFIG.STATUTS.SUPPRIME, {
                motif: infos.motif || 'Suppression manuelle'
            });
            
            console.log('✅ Décompte supprimé (soft delete):', decompteId);
            
        } catch (error) {
            console.error('❌ Erreur suppression décompte:', error);
            throw new Error('Impossible de supprimer le décompte : ' + error.message);
        }
    }
    
    // ========================================
    // SECTION 6 : HELPERS ET FORMATTERS
    // ========================================
    
    /**
     * Générer un numéro de décompte unique
     * Format: DEC-AAAAMMJJ-XXXX
     */
    async genererNumeroDecompte() {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const date = new Date();
            const annee = date.getFullYear();
            const mois = String(date.getMonth() + 1).padStart(2, '0');
            const jour = String(date.getDate()).padStart(2, '0');
            const dateStr = `${annee}${mois}${jour}`;
            const prefix = `DEC-${dateStr}`;
            
            // Chercher le dernier numéro du jour
            const q = query(
                collection(db, CONFIG.COLLECTION_NAME),
                where('numeroDecompte', '>=', `${prefix}-0000`),
                where('numeroDecompte', '<=', `${prefix}-9999`),
                orderBy('numeroDecompte', 'desc'),
                limit(1)
            );
            
            const snapshot = await getDocs(q);
            
            let nextNumber = 1;
            if (!snapshot.empty) {
                const lastDoc = snapshot.docs[0].data();
                const lastNumber = parseInt(lastDoc.numeroDecompte.split('-')[2]);
                nextNumber = lastNumber + 1;
            }
            
            const numero = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
            console.log('📋 Numéro généré:', numero);
            
            return numero;
            
        } catch (error) {
            console.error('⚠️ Erreur génération numéro, fallback:', error);
            // Fallback avec timestamp
            return `DEC-${Date.now()}`;
        }
    }
    
    /**
     * Générer un ID de virement
     * Format: VIR-AAAA-MM-XXX
     */
    genererVirementId(date = new Date()) {
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const numero = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `VIR-${annee}-${mois}-${numero}`;
    }
    
    /**
     * Formater un NSS
     * Format: 1 85 05 78 006 048 22
     */
    formaterNSS(nss) {
        if (!nss) return '-';
        
        // Retirer tous les espaces existants
        const nssClean = nss.replace(/\s/g, '');
        
        // Formater : 1 85 05 78 006 048 22
        if (nssClean.length === 13) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)}`;
        }
        
        if (nssClean.length === 15) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)} ${nssClean.slice(13)}`;
        }
        
        return nss; // Retourner tel quel si format incorrect
    }
    
    /**
     * Nettoyer un NSS
     * @private
     */
    nettoyerNSS(nss) {
        if (!nss) return null;
        const cleaned = String(nss).replace(/\D/g, '');
        return (cleaned.length === 13 || cleaned.length === 15) ? cleaned : nss;
    }
    
    /**
     * Valider un NSS avec clé de contrôle
     */
    validerNSS(nss) {
        if (!nss) return false;
        
        // Retirer les espaces pour la validation
        const nssClean = nss.replace(/\s/g, '');
        
        // Vérifier le format de base
        if (!CONFIG.VALIDATIONS.NSS.test(nssClean)) {
            return false;
        }
        
        // Si 15 chiffres, vérifier la clé de contrôle
        if (nssClean.length === 15) {
            const numero = nssClean.slice(0, 13);
            const cle = parseInt(nssClean.slice(13));
            const cleCalculee = 97 - (parseInt(numero) % 97);
            
            return cle === cleCalculee;
        }
        
        return true; // 13 chiffres sans clé est valide
    }
    
    /**
     * Formater un montant
     */
    formaterMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant);
    }
    
    /**
     * Formater une date
     */
    formaterDate(timestamp, format = 'complet') {
        if (!timestamp) return '-';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        switch (format) {
            case 'jour':
                return date.toLocaleDateString('fr-FR');
            case 'mois':
                return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
            case 'complet':
            default:
                return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
    }
    
    /**
     * Parser une date
     * @private
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }
    
    /**
     * Obtenir le prochain statut
     */
    getProchainStatut(statutActuel) {
        return CONFIG.STATUTS_INFO[statutActuel]?.suivant || null;
    }
    
    /**
     * Vérifier si un décompte peut être supprimé
     */
    peutEtreSupprime(statut) {
        return statut !== CONFIG.STATUTS.SUPPRIME && 
               statut !== CONFIG.STATUTS.RAPPROCHEMENT_BANCAIRE;
    }
    
    /**
     * Trouver le code magasin à partir du FINESS
     * @private
     */
    findCodeMagasinByFiness(finess) {
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
    
    /**
     * Obtenir la liste des mutuelles
     */
    getListeMutuelles() {
        return Array.from(mutuellesDynamiques).sort();
    }
    
    /**
     * Obtenir la liste des prestataires
     */
    getListePrestataires() {
        return Array.from(reseauxTPDynamiques).sort();
    }
    
    /**
     * Mettre à jour les mutuelles depuis les décomptes
     */
    mettreAJourMutuelles(decomptes) {
        mutuellesDynamiques.clear();
        
        decomptes.forEach(decompte => {
            if (decompte.mutuelle && decompte.mutuelle !== '') {
                mutuellesDynamiques.add(decompte.mutuelle);
            }
        });
        
        console.log('📊 Mutuelles mises à jour:', Array.from(mutuellesDynamiques));
    }
    
    /**
     * Mettre à jour les réseaux TP depuis les décomptes
     */
    mettreAJourReseauxTP(decomptes) {
        reseauxTPDynamiques.clear();
        
        decomptes.forEach(decompte => {
            if (decompte.prestataireTP && decompte.prestataireTP !== '') {
                reseauxTPDynamiques.add(decompte.prestataireTP);
            }
        });
        
        console.log('📊 Réseaux TP mis à jour:', Array.from(reseauxTPDynamiques));
    }
    
    // ========================================
    // SECTION 7 : STATISTIQUES ET RECHERCHE
    // ========================================
    
    /**
     * Obtenir les statistiques
     * @returns {Promise<Object>} Statistiques
     */
    async getStatistiques() {
        const decomptes = await this.getDecomptes({ limite: 1000 });
        
        const stats = {
            total: 0,
            parStatut: {},
            parMutuelle: {},
            montantTotal: 0,
            montantMoyen: 0
        };
        
        decomptes.forEach(decompte => {
            // Exclure les décomptes supprimés des stats
            if (decompte.statut === CONFIG.STATUTS.SUPPRIME) {
                return;
            }
            
            stats.total++;
            
            // Par statut
            stats.parStatut[decompte.statut] = (stats.parStatut[decompte.statut] || 0) + 1;
            
            // Par mutuelle
            if (decompte.mutuelle) {
                stats.parMutuelle[decompte.mutuelle] = (stats.parMutuelle[decompte.mutuelle] || 0) + 1;
            }
            
            // Montants
            stats.montantTotal += decompte.montantVirement || 0;
        });
        
        // Montant moyen
        stats.montantMoyen = stats.total > 0 ? stats.montantTotal / stats.total : 0;
        
        console.log('📈 Statistiques calculées:', stats);
        return stats;
    }
    
    /**
     * Rechercher des décomptes
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Décomptes trouvés
     */
    async rechercherDecomptes(recherche) {
        if (!recherche || recherche.length < 2) {
            return await this.getDecomptes({ limite: 50 });
        }
        
        // Récupérer tous les décomptes récents
        const decomptes = await this.getDecomptes({ limite: 200 });
        
        const termeRecherche = recherche.toLowerCase();
        
        // Filtrer localement
        return decomptes.filter(decompte => {
            const clientNom = `${decompte.client?.prenom || ''} ${decompte.client?.nom || ''}`.toLowerCase();
            const numeroDecompte = decompte.numeroDecompte?.toLowerCase() || '';
            const virementId = decompte.virementId?.toLowerCase() || '';
            const mutuelle = decompte.mutuelle?.toLowerCase() || '';
            const nss = decompte.client?.numeroSecuriteSociale?.replace(/\s/g, '') || '';
            
            return clientNom.includes(termeRecherche) ||
                   numeroDecompte.includes(termeRecherche) ||
                   virementId.includes(termeRecherche) ||
                   mutuelle.includes(termeRecherche) ||
                   nss.includes(termeRecherche.replace(/\s/g, ''));
        });
    }
    
    // ========================================
    // HELPERS PRIVÉS
    // ========================================
    
    /**
     * Obtenir les infos utilisateur
     * @private
     */
    getUserInfo() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        return {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien',
            name: `${auth.collaborateur?.prenom || ''} ${auth.collaborateur?.nom || ''}`.trim() || 'Inconnu',
            magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX',
            societe: auth.raisonSociale || auth.societe || 'NON_DEFINI'
        };
    }
    
    /**
     * Obtenir les magasins autorisés
     */
    getMagasinsAutorises() {
        const auth = localStorage.getItem('sav_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.magasins || [];
        }
        return [];
    }
    
    /**
     * Charger les magasins depuis Firestore
     * @private
     */
    async chargerMagasins() {
        const { chargerMagasins } = await import('../../src/services/firebase.service.js');
        const magasinsData = await chargerMagasins();
        
        if (!magasinsData) return [];
        
        return Object.entries(magasinsData)
            .filter(([id, data]) => data.actif !== false)
            .map(([id, data]) => ({
                FINESS: data.numeroFINESS || '',
                'CODE MAGASIN': data.code || id,
                SOCIETE: data.societe?.raisonSociale || '',
                ADRESSE: `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                VILLE: data.adresse?.ville || ''
            }));
    }
    
    /**
     * Charger TOUS les magasins depuis Firestore (version complète)
     * @private
     */
    async chargerMagasinsComplet() {
        const { collection, getDocs, query, where } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Créer une requête pour récupérer TOUS les magasins actifs
        const magasinsRef = collection(db, 'magasins');
        const q = query(magasinsRef, where('actif', '==', true));
        
        // Récupérer TOUS les documents
        const magasinsSnapshot = await getDocs(q);
        const magasinsArray = [];
        
        console.log(`📊 ${magasinsSnapshot.size} magasins trouvés dans Firestore`);
        
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            
            magasinsArray.push({
                FINESS: data.numeroFINESS || '',
                'CODE MAGASIN': data.code || doc.id,
                SOCIETE: data.societe?.raisonSociale || '',
                ADRESSE: `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                VILLE: data.adresse?.ville || ''
            });
        });
        
        // Stocker en localStorage pour la conversion FINESS → Code
        localStorage.setItem('orixis_magasins', JSON.stringify(
            magasinsArray.reduce((acc, mag) => {
                acc[mag['CODE MAGASIN']] = {
                    numeroFINESS: mag.FINESS,
                    societe: { raisonSociale: mag.SOCIETE },
                    adresse: { ville: mag.VILLE }
                };
                return acc;
            }, {})
        ));
        
        return magasinsArray;
    }
}

// ========================================
// EXPORT DE L'INSTANCE UNIQUE (SINGLETON)
// ========================================

const decompteService = new DecompteMutuelleService();

// Export par défaut de l'instance
export default decompteService;

// Export de la classe pour tests
export { DecompteMutuelleService, CONFIG };

/* ========================================
   SERVICE UNIFIÉ COMPLET - Version 2.0
   
   ✅ TOUT EN UN : Upload, Firestore, IA, Métier, Helpers
   ✅ PROMPT COMPLET pour l'IA (100+ lignes)
   ✅ TOUS LES HELPERS : formatters, validateurs, etc.
   ✅ HASH SHA-256 pour détecter les doublons
   ✅ GESTION DYNAMIQUE des mutuelles/prestataires
   ✅ MESSAGES D'ERREUR détaillés
   ✅ WORKFLOW COMPLET avec transitions de statuts
   
   UTILISATION :
   import decompteService from './decompte-mutuelle.service.js';
   
   // Upload et création
   const resultats = await decompteService.uploadDocuments(files);
   const decompteId = await decompteService.creerDecompte({ documents: resultats.reussis });
   
   // Analyse IA
   await decompteService.analyserDecompteIA(decompteId);
   
   // Récupération
   const decomptes = await decompteService.getDecomptes();
   
   // Formatters
   const nssFormate = decompteService.formaterNSS('1850578006048');
   const montantFormate = decompteService.formaterMontant(150.50);
   
   // Validation
   const isValidNSS = decompteService.validerNSS('1850578006048');
   ======================================== */