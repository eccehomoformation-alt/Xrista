// --- 1. ÉTAT GLOBAL ---
let utilisateurs = JSON.parse(localStorage.getItem('bdd_utilisateurs')) || [
    { user: "admin", pass: "Ok1234", solde: 20.00, photo: null },
    { user: "Bryan", pass: "melodie", solde: 20.00, photo: null }
];

let utilisateurActuel = JSON.parse(localStorage.getItem('session_active')) || null;
let panier = []; 
let videoEnAttente = "";

// --- 2. SÉLECTION ÉLÉMENTS ---
const choix_pistes = document.querySelectorAll(".piste, #droite img, #droite video");
const lecteurPrincipal = document.getElementById("main-video");
const modalConnexion = document.getElementById("modal-autorisation");

// --- 3. CLIC SUR UNE PISTE (SÉCURITÉ ÉCOUTE) ---
choix_pistes.forEach(piste => {
    piste.addEventListener('click', function() {
        // 1. On prépare la vidéo et les infos
        videoEnAttente = this.tagName === "VIDEO" ? this.src : this.getAttribute("data-video-src");
        
        document.getElementById("titulo").textContent = this.dataset.titulo || "Séléction";
        document.getElementById("artista").textContent = this.dataset.creator || "-";
        
        let prixBrut = this.getAttribute("data-compra-por-pista") || "0.00";
        document.getElementById("precio").textContent = prixBrut.replace(',', '.') + " €";

        // 2. CONDITION OBLIGATOIRE : Être connecté pour écouter
        if (!utilisateurActuel) {
            alert("STOP ! Vous devez être connecté pour écouter cette piste.");
            ouvrirModal(modalConnexion);
        } else {
            lancerVideo();
        }
    });
});

// --- 4. PANIER (BOUTON TÉLÉCHARGER) ---
function ajouterAuPanier() {
    if (!utilisateurActuel) {
        ouvrirModal(modalConnexion);
        return;
    }

    const titre = document.getElementById("titulo").textContent;
    const prixStr = document.getElementById("precio").textContent.replace(" €", "").replace(",", ".");
    const prix = parseFloat(prixStr);

    if (titre === "Selecciona una pista") return;

    // --- ANTI-DOUBLON ---
    const dejaPresent = panier.find(item => item.titre === titre);
    if (dejaPresent) {
        alert("Attention : Cette piste est déjà dans votre panier !");
        return;
    }

    // Ajout
    panier.push({ titre: titre, prix: prix });

    // --- INTERFACE : BOUTON DEVIENT ROUGE ---
    const btnDownload = document.querySelector(".btn-download");
    btnDownload.textContent = `Ajouté (${panier.length})`;
    btnDownload.style.backgroundColor = "red";
    btnDownload.style.color = "white";
}

// --- 5. ACHETER (RÉSUMÉ ET VÉRIFICATION SOLDE) ---
function ouvrirPanier() { // Lié à ton bouton "Comprar ahora"
    if (!utilisateurActuel) {
        ouvrirModal(modalConnexion);
        return;
    }

    if (panier.length === 0) {
        alert("Votre panier est vide !");
        return;
    }

    let total = panier.reduce((sum, item) => sum + item.prix, 0);
    let listeTitres = panier.map(i => `- ${i.titre} (${i.prix.toFixed(2)}€)`).join("\n");

    // --- RÉSUMÉ AVANT ACHAT ---
    let confirmation = confirm(
        `RÉSUMÉ DE VOTRE COMMANDE :\n\n${listeTitres}\n\n` +
        `TOTAL À PAYER : ${total.toFixed(2)}€\n` +
        `VOTRE SOLDE : ${utilisateurActuel.solde.toFixed(2)}€\n\n` +
        `Voulez-vous confirmer l'achat ?`
    );

    if (confirmation) {
        if (utilisateurActuel.solde >= total) {
            // SOLDE OK
            utilisateurActuel.solde -= total;
            panier = []; // Vide le panier
            
            // Remet le bouton à la normale
            const btnDownload = document.querySelector(".btn-download");
            btnDownload.textContent = "Ajouter au panier";
            btnDownload.style.backgroundColor = ""; 

            alert("Achat réussi ! Nouveau solde : " + utilisateurActuel.solde.toFixed(2) + "€");
            sauvegarderDonnees();
            majInterfaceHeader();
        } else {
            // SOLDE INSUFFISANT -> RECHARGE
            let recharger = confirm("Solde insuffisant ! Voulez-vous recharger votre compte ?");
            if (recharger) {
                ouvrirRecharge();
            }
        }
    }
}

// --- 6. FONCTION RECHARGE ---
function ouvrirRecharge() {
    let montant = prompt("Montant à recharger (€) :");
    montant = parseFloat(montant);
    if (!isNaN(montant) && montant > 0) {
        utilisateurActuel.solde += montant;
        sauvegarderDonnees();
        majInterfaceHeader();
        alert("Compte crédité !");
    }
}

// --- 7. TECHNIQUES (CONNEXION, SAVE, MODAL) ---
function validerInscription() {
    const userSaisi = document.getElementById("username").value;
    const passSaisi = document.getElementById("password").value;
    const trouve = utilisateurs.find(u => u.user === userSaisi && u.pass === passSaisi);

    if (trouve) {
        utilisateurActuel = trouve;
        sauvegarderDonnees();
        majInterfaceHeader();
        fermerModales();
        if (videoEnAttente) lancerVideo();
    } else { alert("Erreur d'identifiants"); }
}

function lancerVideo() {
    if (videoEnAttente) {
        lecteurPrincipal.src = videoEnAttente;
        lecteurPrincipal.play();
    }
}

function sauvegarderDonnees() {
    localStorage.setItem('bdd_utilisateurs', JSON.stringify(utilisateurs));
    localStorage.setItem('session_active', JSON.stringify(utilisateurActuel));
}

function majInterfaceHeader() {
    if (utilisateurActuel) {
        document.getElementById("header-solde").textContent = utilisateurActuel.solde.toFixed(2) + " €";
        document.getElementById("btn-registrar-header").style.display = "none";
        document.getElementById("user-profile").style.display = "flex";
    }
}

function ouvrirModal(cible) {
    cible.style.display = "flex";
    setTimeout(() => cible.classList.add("show"), 10);
}

function fermerModales() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.remove("show");
        setTimeout(() => m.style.display = "none", 300);
    });
}

window.onload = majInterfaceHeader;