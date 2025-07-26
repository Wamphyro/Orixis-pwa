// Remplacez UNIQUEMENT la fonction afficherCommandes() dans votre commandes.list.js par celle-ci :

function afficherCommandes() {
    const tbody = document.getElementById('commandesTableBody');
    tbody.innerHTML = '';
    
    // Filtrer les commandes
    let commandesFiltrees = filtrerCommandesLocalement();
    
    // Pagination
    const totalPages = Math.ceil(commandesFiltrees.length / state.itemsPerPage);
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const commandesPage = commandesFiltrees.slice(start, end);
    
    if (commandesPage.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="9">Aucune commande trouvée</td></tr>';
        return;
    }
    
    // Afficher les commandes
    commandesPage.forEach(commande => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${commande.numeroCommande}</strong></td>
            <td>${formatDate(commande.dates.commande)}</td>
            <td>${commande.client.prenom} ${commande.client.nom}</td>
            <td>${afficherProduits(commande.produits)}</td>
            <td>${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation}</td>
            <td>${afficherUrgence(commande.niveauUrgence)}</td>
            <td>${afficherStatut(commande.statut)}</td>
            <td>${formatDate(commande.dates.livraisonPrevue)}</td>
            <td class="table-actions">
                <button class="btn-action btn-voir-detail" data-id="${commande.id}">👁️</button>
                ${peutModifierStatut(commande) ? `<button class="btn-action btn-modifier-statut" data-id="${commande.id}">✏️</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // IMPORTANT : Attacher les événements après avoir créé le HTML
    attacherEvenementsBoutons();
    
    // Mettre à jour la pagination
    updatePagination(totalPages);
}

// Ajouter cette nouvelle fonction après afficherCommandes()
function attacherEvenementsBoutons() {
    // Boutons voir détail
    document.querySelectorAll('.btn-voir-detail').forEach(btn => {
        btn.addEventListener('click', function() {
            const commandeId = this.getAttribute('data-id');
            console.log('Clic sur voir détail:', commandeId);
            if (window.voirDetailCommande) {
                window.voirDetailCommande(commandeId);
            }
        });
    });
    
    // Boutons modifier statut
    document.querySelectorAll('.btn-modifier-statut').forEach(btn => {
        btn.addEventListener('click', function() {
            const commandeId = this.getAttribute('data-id');
            if (window.changerStatutCommande) {
                window.changerStatutCommande(commandeId);
            }
        });
    });
}