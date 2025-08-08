// ========================================
// DECOMPTE-SECU.UPLOAD.SERVICE.JS - 📁 SERVICE UPLOAD
// Chemin: modules/decompte-secu/decompte-secu.upload.service.js
//
// DESCRIPTION:
// Service d'upload des documents dans Firebase Storage
// Gère les PDF, images et CSV pour décomptes sécu audioprothèse
// Calcul de hash SHA-256 pour détection de doublons
//
// VERSION: 1.0.0
// DATE: 08/01/2025
// ========================================

import { storage } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    basePath: 'decomptes-secu',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xls', '.xlsx']
};

// ========================================
// SERVICE UPLOAD
// ========================================

class DecompteSecuUploadService {
    
    /**
     * Upload de documents multiples
     */
    async uploadDocuments(files) {
        const resultats = {
            reussis: [],
            erreurs: []
        };
        
        for (const file of files) {
            try {
                const metadata = await this.uploadDocument(file);
                resultats.reussis.push(metadata);
            } catch (error) {
                resultats.erreurs.push({
                    fichier: file.name,
                    erreur: error.message
                });
            }
        }
        
        return resultats;
    }
    
    /**
     * Upload d'un document unique
     */
    async uploadDocument(file) {
        try {
            const { ref, uploadBytes, getDownloadURL } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
            );
            
            // Validation
            this.validateFile(file);
            
            // Calculer le hash
            const hash = await this.calculateFileHash(file);
            console.log('🔒 Hash calculé:', hash.substring(0, 8) + '...');
            
            // Créer le chemin de stockage
            const chemin = this.generateStoragePath(file);
            console.log('📂 Chemin Storage:', chemin);
            
            // Récupérer les infos utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // Créer la référence Storage
            const storageRef = ref(storage, chemin);
            
            // Métadonnées
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    uploadePar: auth.collaborateur ? 
                        `${auth.collaborateur.prenom} ${auth.collaborateur.nom}` : 'Inconnu',
                    magasinUploadeur: auth.magasin || 'XXX',
                    nomOriginal: file.name,
                    hash: hash,
                    dateUpload: new Date().toISOString(),
                    taille: String(file.size),
                    typeDocument: 'decompte_secu_audio'
                }
            };
            
            // Upload
            console.log('📤 Upload en cours...');
            const snapshot = await uploadBytes(storageRef, file, metadata);
            console.log('✅ Upload réussi:', snapshot.ref.fullPath);
            
            // Obtenir l'URL
            const url = await getDownloadURL(snapshot.ref);
            
            // Déterminer le format
            let format = 'autre';
            if (file.type === 'application/pdf') {
                format = 'pdf';
            } else if (file.type.startsWith('image/')) {
                format = 'image';
            } else if (file.type.includes('csv') || file.name.endsWith('.csv')) {
                format = 'csv';
            } else if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
                format = 'excel';
            }
            
            // Retourner les métadonnées
            return {
                nom: snapshot.ref.name,
                nomOriginal: file.name,
                chemin: chemin,
                url: url,
                taille: file.size,
                type: file.type,
                hash: hash,
                dateUpload: new Date(),
                format: format
            };
            
        } catch (error) {
            console.error('❌ Erreur upload:', error);
            throw new Error(`Erreur upload ${file.name}: ${error.message}`);
        }
    }
    
    /**
     * Générer le chemin de stockage
     */
    generateStoragePath(file) {
        const date = new Date();
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const jour = String(date.getDate()).padStart(2, '0');
        
        // Récupérer les infos utilisateur
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const societe = 'ORIXIS';
        
        // Créer un nom unique
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = this.getFileExtension(file.name);
        const nomFichier = `DS_${timestamp}_${random}.${extension}`;
        
        // Chemin complet
        return `${CONFIG.basePath}/${societe}/inbox/${annee}/${mois}/${jour}/${nomFichier}`;
    }
    
    /**
     * Valider un fichier
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > CONFIG.maxFileSize) {
            const sizeMB = (CONFIG.maxFileSize / 1024 / 1024).toFixed(0);
            throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
        }
        
        // Vérifier le type
        const extension = '.' + this.getFileExtension(file.name);
        const typeValide = CONFIG.allowedTypes.includes(file.type) || 
                          CONFIG.allowedExtensions.includes(extension.toLowerCase());
        
        if (!typeValide) {
            throw new Error(`Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, CSV`);
        }
    }
    
    /**
     * Obtenir l'extension d'un fichier
     */
    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'bin';
    }
    
    /**
     * Calculer le hash SHA-256 d'un fichier
     */
    async calculateFileHash(file) {
        try {
            // Lire le fichier
            const buffer = await file.arrayBuffer();
            
            // Calculer le hash
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            
            // Convertir en hexadécimal
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            return hashHex;
            
        } catch (error) {
            console.error('⚠️ Erreur calcul hash:', error);
            // Retourner un hash basé sur le nom et la taille
            return `fallback-${file.name}-${file.size}-${Date.now()}`;
        }
    }
    
    /**
     * Supprimer un document
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
            console.error('⚠️ Erreur suppression:', error);
            // Ne pas faire échouer si le fichier n'existe pas
        }
    }
    
    /**
     * Obtenir l'URL d'un document
     */
    async getDocumentUrl(chemin) {
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
    
    /**
     * Vérifier si un fichier existe
     */
    async fileExists(chemin) {
        try {
            await this.getDocumentUrl(chemin);
            return true;
        } catch {
            return false;
        }
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new DecompteSecuUploadService();
export default service;

/* ========================================
   HISTORIQUE
   
   [08/01/2025] - v1.0.0
   - Service upload complet
   - Support PDF, images et CSV
   - Hash SHA-256 pour doublons
   - Structure Storage organisée
   ======================================== */