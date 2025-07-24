// Service de gestion du localStorage
export class StorageService {
    /**
     * Sauvegarde des données dans le localStorage
     * @param {string} key - Clé de stockage
     * @param {any} data - Données à sauvegarder
     */
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }
    
    /**
     * Récupération des données du localStorage
     * @param {string} key - Clé de stockage
     * @returns {any} Données récupérées ou null
     */
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération:', error);
            return null;
        }
    }
    
    /**
     * Suppression d'une clé du localStorage
     * @param {string} key - Clé à supprimer
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return false;
        }
    }
    
    /**
     * Vérification de l'existence d'une clé
     * @param {string} key - Clé à vérifier
     * @returns {boolean}
     */
    static exists(key) {
        return localStorage.getItem(key) !== null;
    }
    
    /**
     * Effacer tout le localStorage (utiliser avec précaution)
     */
    static clear() {
        localStorage.clear();
    }
    
    /**
     * Obtenir toutes les clés du localStorage
     * @returns {string[]}
     */
    static getAllKeys() {
        return Object.keys(localStorage);
    }
}