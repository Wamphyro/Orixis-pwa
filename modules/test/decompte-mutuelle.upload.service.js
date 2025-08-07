// ========================================
// DECOMPTE-MUTUELLE.UPLOAD.SERVICE.JS - 📁 SERVICE UPLOAD
// Chemin: modules/test/decompte-mutuelle.upload.service.js
//
// DESCRIPTION:
// Service d'upload des décomptes vers Firebase Storage
// Gère le hash SHA-256, la structure des dossiers et les métadonnées
//
// FONCTIONS PUBLIQUES:
// - uploadDocuments(files) : Upload multiple
// - uploadSingleDocument(file, hash) : Upload unitaire
// - calculateFileHash(file) : Calcul SHA-256
// - deleteDocument(chemin) : Suppression
// ========================================

import { storage } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    STORAGE_BASE_PATH: 'decomptes-mutuelles',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png']
};

// ========================================
// CLASSE DU SERVICE
// ========================================

export class DecompteUploadService {
    
    /**
     * Upload un ou plusieurs documents
     * @param {File[]} files - Fichiers à uploader
     * @returns {Promise<Object>} Résultats de l'upload
     */
    static async uploadDocuments(files) {
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
     * @param {File} file - Fichier à uploader
     * @param {string} hash - Hash SHA-256 du fichier
     * @returns {Promise<Object>} Métadonnées du document
     */
    static async uploadSingleDocument(file, hash) {
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
        
        // Chemin complet : decomptes-mutuelles/SOCIETE/inbox/2025/02/08/DM_SOCIETE_20250208_143029_550e8400.pdf
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
    static async calculateFileHash(file) {
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
     * Supprimer un document de Storage
     * @param {string} chemin - Le chemin du document
     */
    static async deleteDocument(chemin) {
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
    
    /**
     * Obtenir l'URL d'un document existant
     * @param {string} chemin - Le chemin du document
     * @returns {Promise<string>} L'URL de téléchargement
     */
    static async getDocumentUrl(chemin) {
        try {
            const { ref, getDownloadURL } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
            );
            
            const storageRef = ref(storage, chemin);
            return await getDownloadURL(storageRef);
            
        } catch (error) {
            console.error('❌ Erreur récupération URL:', error);
            throw new Error(`Document introuvable: ${chemin}`);
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Valider un fichier avant upload
     * @private
     */
    static validateFile(file) {
        // Vérifier la taille
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            const sizeMB = (CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // Vérifier le type
        if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Type de fichier non autorisé. Utilisez PDF, JPG ou PNG`);
        }
        
        console.log(`✅ Fichier ${file.name} validé (${(file.size / 1024).toFixed(1)} KB)`);
    }
    
    /**
     * Obtenir les infos utilisateur
     * @private
     */
    static getUserInfo() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        // Extraire la société du code magasin si pas définie
        let societe = auth.raisonSociale || auth.societe || '';
        
        if (!societe && auth.magasin) {
            // Déterminer la société selon le préfixe du magasin
            if (auth.magasin.startsWith('9')) {
                societe = 'BA'; // Boucle Auditive
            } else if (auth.magasin.startsWith('8')) {
                societe = 'ORIXIS';
            } else {
                societe = 'XXX';
            }
        }
        
        // Nettoyer le nom de société pour le chemin de fichier
        societe = societe.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
        
        return {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien',
            name: `${auth.collaborateur?.prenom || ''} ${auth.collaborateur?.nom || ''}`.trim() || 'Inconnu',
            magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX',
            societe: societe || 'NON_DEFINI'
        };
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    uploadDocuments: DecompteUploadService.uploadDocuments.bind(DecompteUploadService),
    uploadSingleDocument: DecompteUploadService.uploadSingleDocument.bind(DecompteUploadService),
    calculateFileHash: DecompteUploadService.calculateFileHash.bind(DecompteUploadService),
    deleteDocument: DecompteUploadService.deleteDocument.bind(DecompteUploadService),
    getDocumentUrl: DecompteUploadService.getDocumentUrl.bind(DecompteUploadService)
};

/* ========================================
   HISTORIQUE
   
   [08/02/2025] - Création
   - Service dédié à l'upload Storage
   - Hash SHA-256 pour détection doublons
   - Structure : decomptes-mutuelles/[société]/inbox/[année]/[mois]/[jour]/
   - Nom fichier : DM_[société]_[date]_[heure]_[uuid].pdf
   ======================================== */