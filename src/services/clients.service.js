// ========================================
// CLIENTS.SERVICE.JS - Gestion des clients Firebase
// ========================================

import { db } from './firebase.service.js';
import { validerTelephone, validerEmail } from '../data/commandes.data.js';

// Variables locales
let clientsCache = new Map();
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Service de gestion des clients
 */
export class ClientsService {
    
    /**
     * Créer un nouveau client
     * @param {Object} clientData - Données du client
     * @returns {Promise<string>} ID du client créé
     */
    static async creerClient(clientData) {
        try {
            // Validation des données
            if (!clientData.nom || !clientData.prenom) {
                throw new Error('Nom et prénom requis');
            }
            
            if (clientData.telephone && !validerTelephone(clientData.telephone)) {
                throw new Error('Numéro de téléphone invalide');
            }
            
            if (clientData.email && !validerEmail(clientData.email)) {
                throw new Error('Email invalide');
            }
            
            // Import des fonctions Firestore
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Préparer les données
            const nouveauClient = {
                actif: true,
                nom: clientData.nom.toUpperCase(),
                prenom: clientData.prenom.charAt(0).toUpperCase() + clientData.prenom.slice(1).toLowerCase(),
                magasinReference: clientData.magasinReference || this.getMagasinActuel(),
                telephone: clientData.telephone || '',
                email: clientData.email || '',
                equipements: [],
                dateCreation: serverTimestamp(),
                derniereModification: serverTimestamp()
            };
            
            // Créer dans Firebase
            const docRef = await addDoc(collection(db, 'clients'), nouveauClient);
            
            // Ajouter au cache
            clientsCache.set(docRef.id, { id: docRef.id, ...nouveauClient });
            
            console.log('✅ Client créé:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création client:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer un client par son ID
     * @param {string} clientId - ID du client
     * @returns {Promise<Object>} Données du client
     */
    static async getClient(clientId) {
        try {
            // Vérifier le cache
            if (clientsCache.has(clientId)) {
                return clientsCache.get(clientId);
            }
            
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const clientDoc = await getDoc(doc(db, 'clients', clientId));
            
            if (clientDoc.exists()) {
                const clientData = { id: clientDoc.id, ...clientDoc.data() };
                clientsCache.set(clientId, clientData);
                return clientData;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération client:', error);
            return null;
        }
    }
    
    /**
     * Rechercher des clients
     * @param {string} recherche - Terme de recherche
     * @param {number} limite - Nombre max de résultats
     * @returns {Promise<Array>} Liste des clients trouvés
     */
    static async rechercherClients(recherche, limite = 10) {
        try {
            if (!recherche || recherche.length < 2) {
                return [];
            }
            
            const termeRecherche = recherche.toLowerCase();
            
            // Charger tous les clients si cache expiré
            if (Date.now() - lastFetch > CACHE_DURATION) {
                await this.chargerTousLesClients();
            }
            
            // Recherche dans le cache
            const resultats = Array.from(clientsCache.values())
                .filter(client => {
                    const nomComplet = `${client.prenom} ${client.nom}`.toLowerCase();
                    const nomInverse = `${client.nom} ${client.prenom}`.toLowerCase();
                    const telephone = client.telephone?.replace(/\s/g, '') || '';
                    
                    return nomComplet.includes(termeRecherche) ||
                           nomInverse.includes(termeRecherche) ||
                           telephone.includes(termeRecherche.replace(/\s/g, '')) ||
                           client.email?.toLowerCase().includes(termeRecherche);
                })
                .slice(0, limite);
            
            return resultats;
            
        } catch (error) {
            console.error('❌ Erreur recherche clients:', error);
            return [];
        }
    }
    
    /**
     * Charger tous les clients actifs
     * @returns {Promise<Array>} Liste de tous les clients
     */
    static async chargerTousLesClients() {
        try {
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'clients'),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            
            // Vider et remplir le cache
            clientsCache.clear();
            const clients = [];
            
            snapshot.forEach((doc) => {
                const clientData = { id: doc.id, ...doc.data() };
                clientsCache.set(doc.id, clientData);
                clients.push(clientData);
            });
            
            lastFetch = Date.now();
            console.log(`✅ ${clients.length} clients chargés`);
            
            return clients;
            
        } catch (error) {
            console.error('❌ Erreur chargement clients:', error);
            return [];
        }
    }
    
    /**
     * Mettre à jour un client
     * @param {string} clientId - ID du client
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<boolean>} Succès de la mise à jour
     */
    static async mettreAJourClient(clientId, updates) {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Validation si changement de téléphone ou email
            if (updates.telephone !== undefined && !validerTelephone(updates.telephone)) {
                throw new Error('Numéro de téléphone invalide');
            }
            
            if (updates.email !== undefined && !validerEmail(updates.email)) {
                throw new Error('Email invalide');
            }
            
            // Ajouter la date de modification
            updates.derniereModification = serverTimestamp();
            
            // Mettre à jour dans Firebase
            await updateDoc(doc(db, 'clients', clientId), updates);
            
            // Mettre à jour le cache
            if (clientsCache.has(clientId)) {
                const clientActuel = clientsCache.get(clientId);
                clientsCache.set(clientId, { ...clientActuel, ...updates });
            }
            
            console.log('✅ Client mis à jour:', clientId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour client:', error);
            throw error;
        }
    }
    
    /**
     * Ajouter un équipement au client
     * @param {string} clientId - ID du client
     * @param {Object} equipement - Données de l'équipement
     * @returns {Promise<boolean>} Succès de l'ajout
     */
    static async ajouterEquipement(clientId, equipement) {
        try {
            const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Générer un ID unique pour l'équipement
            equipement.id = `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            equipement.dateAjout = new Date();
            equipement.actif = true;
            
            // Ajouter l'équipement
            await updateDoc(doc(db, 'clients', clientId), {
                equipements: arrayUnion(equipement),
                derniereModification: serverTimestamp()
            });
            
            // Mettre à jour le cache
            if (clientsCache.has(clientId)) {
                const client = clientsCache.get(clientId);
                client.equipements = [...(client.equipements || []), equipement];
            }
            
            console.log('✅ Équipement ajouté au client:', clientId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur ajout équipement:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer les clients d'un magasin
     * @param {string} magasinId - ID du magasin
     * @returns {Promise<Array>} Liste des clients du magasin
     */
    static async getClientsByMagasin(magasinId) {
        try {
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'clients'),
                where('magasinReference', '==', magasinId),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            const clients = [];
            
            snapshot.forEach((doc) => {
                clients.push({ id: doc.id, ...doc.data() });
            });
            
            return clients;
            
        } catch (error) {
            console.error('❌ Erreur récupération clients magasin:', error);
            return [];
        }
    }
    
    /**
     * Vérifier si un client existe déjà (doublon)
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Object|null>} Client trouvé ou null
     */
    static async verifierDoublon(criteres) {
        try {
            const { nom, prenom, telephone } = criteres;
            
            if (!nom || !prenom) return null;
            
            // Recherche dans le cache d'abord
            const clientsArray = Array.from(clientsCache.values());
            
            return clientsArray.find(client => 
                client.nom.toLowerCase() === nom.toLowerCase() &&
                client.prenom.toLowerCase() === prenom.toLowerCase() &&
                (!telephone || client.telephone === telephone)
            ) || null;
            
        } catch (error) {
            console.error('❌ Erreur vérification doublon:', error);
            return null;
        }
    }
    
    // Helpers privés
    
    /**
     * Récupérer le magasin actuel depuis le localStorage
     */
    static getMagasinActuel() {
        const auth = localStorage.getItem('sav_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.magasin || 'NON_DEFINI';
        }
        return 'NON_DEFINI';
    }
    
    /**
     * Vider le cache (utile après des modifications importantes)
     */
    static viderCache() {
        clientsCache.clear();
        lastFetch = 0;
    }
}