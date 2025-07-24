// Configuration des collaborateurs
const COLLABORATEURS = {
    "ADMIN": [
        { nom: "Korber", prenom: "Cédric", id: "korber001" },
        { nom: "Boulay", prenom: "Estelle", id: "boulay001" },
        { nom: "Douare", prenom: "Marie-Christine", id: "douare001" }
    ],
    "9AVA": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9BEA": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9BOM": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9CHE": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9DIJ": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9DIT": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9DOL": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9KBO": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9KNE": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9KOV": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9MAR": [
        // Ajoutez les collaborateurs pour ce magasin
    ],
    "9QUE": [
        // Ajoutez les collaborateurs pour ce magasin
    ]
};

// Fonction pour obtenir les collaborateurs d'un magasin
function getCollaborateurs(magasinCode) {
    return COLLABORATEURS[magasinCode] || [];
}

// Fonction pour obtenir un collaborateur par son ID
function getCollaborateurById(magasinCode, collaborateurId) {
    const collaborateurs = getCollaborateurs(magasinCode);
    return collaborateurs.find(c => c.id === collaborateurId) || null;
}
