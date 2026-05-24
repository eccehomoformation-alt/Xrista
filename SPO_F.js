// ==========================================
// --- 1. ÉTAT GLOBAL & PERSISTANCE (localStorage) ---
// ==========================================

let utilisateurs = JSON.parse(localStorage.getItem('bdd_utilisateurs')) || [
    { user: "admin", pass: "Ok1234", solde: 20.00, achatsCeMois: 0 },
    { user: "Bryan", pass: "melodie", solde: 20.00, achatsCeMois: 0 }
];

let utilisateurActuel = JSON.parse(localStorage.getItem('session_active')) || null;

let panier = []; 
let videoEnAttente = "";
let prixArticleCourant = 0; 
let nomArticleCourant = "";

// Variable pour se souvenir d'où venait l'utilisateur avant de devoir recharger
let typeAchatEnCours = ""; // "TIENDA", "PANIER" ou "TICKET"

// ==========================================
// --- 2. SÉLECTION ÉLÉMENTS UI ---
// ==========================================
const choix_pistes = document.querySelectorAll(".piste");
const lecteurPrincipal = document.getElementById("main-video");
const modalConnexion = document.getElementById("modal-autorisation");
const modalRegistre = document.getElementById("modal-registre");
const modalRecharge = document.getElementById("modal-recharge");
const modalConfirmation = document.getElementById("modal-confirmation");

const affichage = {
    titulo: document.getElementById("titulo"),
    artista: document.getElementById("artista"),
    genero: document.getElementById("genero"),
    solistas: document.getElementById("solistas"),
    instrumento: document.getElementById("instrumento"), 
    abono: document.getElementById("abono"),
    freemium: document.getElementById("freemium"),
    precio: document.getElementById("precio")
};


// ==========================================
// --- 3. GESTION DES NOTIFICATIONS MODALES ---
// ==========================================
function afficherNotification(titre, message) {
    const notifTitre = document.getElementById('notif-titre');
    const notifMsg = document.getElementById('notif-message');
    const notifModal = document.getElementById('modal-notification');
    
    if(notifTitre && notifMsg && notifModal) {
        notifTitre.textContent = titre;
        notifMsg.innerHTML = message;
        notifModal.style.display = 'flex';
    } else {
        alert(titre + "\n" + message.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''));
    }
}

function fermerNotification() {
    const notifModal = document.getElementById('modal-notification');
    if(notifModal) notifModal.style.display = 'none';
}

// ==========================================
// --- 4. NAVIGATION & SECTIONS ---
// ==========================================
function naviguerVers(idCible) {
    const toutesLesSections = ['section-accueil', 'section-ecouter', 'section-tienda', 'section-ver'];
    toutesLesSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
            const media = section.querySelectorAll('video, audio');
            media.forEach(m => {
                m.pause();         
                m.currentTime = 0; 
            });
        }
    });

    const sectionActive = document.getElementById(idCible);
    if (sectionActive) {
        if (idCible === 'section-ecouter' || idCible === 'section-tienda') {
            sectionActive.style.display = 'grid';
        } else {
            sectionActive.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function afficherTienda() { naviguerVers('section-tienda'); }
function afficherSectionEcouter() { naviguerVers('section-ecouter'); }
function afficherVer() { naviguerVers('section-ver'); }


// =======================================================================
// --- 5. NAVIGATION, SÉCURITÉ & LECTURE MULTIMÉDIA ---
// =======================================================================
function naviguerVers(idCible) {
    const toutesLesSections = ['section-accueil', 'section-ecouter', 'section-tienda', 'section-ver', 'section-historias'];
    toutesLesSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
            const media = section.querySelectorAll('video, audio');
            media.forEach(m => {
                try {
                    m.pause();         
                    m.currentTime = 0; 
                } catch(e) { console.log("Erreur média lors de la navigation :", e); }
            });
        }
    });

    const sectionActive = document.getElementById(idCible);
    if (sectionActive) {
        if (idCible === 'section-ecouter' || idCible === 'section-tienda') {
            sectionActive.style.display = 'grid';
        } else {
            sectionActive.style.display = 'block';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function afficherTienda() { naviguerVers('section-tienda'); }
function afficherSectionEcouter() { naviguerVers('section-ecouter'); }
function afficherVer() { naviguerVers('section-ver'); }


// --- FONCTION DE CLIC SUR LES PISTES (AVEC SÉCURITÉ ABSOLUE) ---
if (typeof choix_pistes !== 'undefined' && choix_pistes) {
    choix_pistes.forEach(piste => {
        piste.addEventListener('click', function() {
            
            // 🔐 ÉTAPE 1 : ON BLOQUE TOUT DE SUITE SI PAS CONNECTÉ
            if (typeof utilisateurActuel === 'undefined' || !utilisateurActuel) {
                console.log("Action refusée : Vous devez vous connecter.");
                
                // On ouvre la fenêtre de connexion
                if (typeof modalConnexion !== 'undefined') {
                    ouvrirModal(modalConnexion);
                } else {
                    const backupModal = document.getElementById('modal-autorisation');
                    if (backupModal && typeof ouvrirModal === 'function') ouvrirModal(backupModal);
                }
                
                return; // ⛔ STOP TOTAL : Le code en dessous est complètement ignoré
            }

            // 🔓 ÉTAPE 2 : ZONE SÉCURISÉE (Uniquement pour les connectés)
            let source = "";
            
            // Détection du fichier Audio ou Vidéo
            const baliseAudio = this.querySelector('audio');
            if (baliseAudio) {
                source = baliseAudio.getAttribute('src');
            } else {
                source = this.getAttribute('src') || this.getAttribute('data-video-src');
            }

            if (!source) {
                console.error("Aucune source trouvée pour cette piste.");
                return;
            }
            
            videoEnAttente = source;

            // Envoi de la jaquette de fond (Poster) au lecteur de gauche
            const baliseImg = this.querySelector('img');
            if (baliseImg && typeof lecteurPrincipal !== 'undefined' && lecteurPrincipal) {
                lecteurPrincipal.setAttribute('poster', baliseImg.src);
            }

            // Mise à jour des informations textuelles à droite
            if (typeof affichage !== 'undefined' && affichage) {
                if(affichage.titulo) affichage.titulo.textContent = this.dataset.titulo || "-";
                if(affichage.artista) affichage.artista.textContent = this.dataset.creator || "-";
                if(affichage.genero) affichage.genero.textContent = this.dataset.genero || "-";
                if(affichage.solistas) affichage.solistas.textContent = this.dataset.solistas || "-";
                if(affichage.instrumento) affichage.instrumento.textContent = this.dataset.instrumentPrincipal || "-";
                if(affichage.abono) affichage.abono.textContent = this.dataset.abono || "-";
                if(affichage.freemium) affichage.freemium.textContent = this.dataset.freemium || "-";
                
                let prixBrut = this.getAttribute("data-compra-por-pista") || "0.00";
                if(affichage.precio) affichage.precio.textContent = prixBrut.replace(',', '.') + " €";
            }

            // Lancement final de la lecture
            lancerLecteur();
        });
    });
}


// --- FONCTION UNIQUE POUR JOUEUR LA MUSIQUE OU VIDÉO ---
function lancerLecteur() {
    if (typeof videoEnAttente !== 'undefined' && videoEnAttente && typeof lecteurPrincipal !== 'undefined' && lecteurPrincipal) {
        try {
            lecteurPrincipal.src = videoEnAttente;
            lecteurPrincipal.load(); 
            lecteurPrincipal.play().catch(error => {
                console.log("Lecture automatique bloquée par le navigateur.");
            });
        } catch (err) {
            console.error("Erreur lors du lancement du lecteur :", err);
        }
    }
}

// ==========================================
// --- 6. AUTHENTIFICATION & SESSIONS ---
// ==========================================
function validerInscription() {
    const userSaisi = document.getElementById("username").value.trim();
    const passSaisi = document.getElementById("password").value.trim();
    const trouve = utilisateurs.find(u => u.user === userSaisi && u.pass === passSaisi);

    if (trouve) {
        utilisateurActuel = trouve;
        if(utilisateurActuel.achatsCeMois === undefined) utilisateurActuel.achatsCeMois = 0;
        sauvegarderEtActualiser();
        fermerModales();
        if (videoEnAttente) lancerVideo();
    } else { 
        afficherNotification("Error", "Identifiants incorrects"); 
    }
}

function finaliserInscription() {
    const prenom = document.getElementById('reg-prenom').value.trim();
    const nom = document.getElementById("reg-nom").value.trim();
    const pass = document.getElementById("reg-pass").value.trim();
    
    if(!prenom || !nom || !pass) {
        afficherNotification("Formulario incompleto", "Por favor, rellene el nombre, apellido y contraseña.");
        return;
    }

    let nouvelUser = { user: prenom, pass: pass, solde: 20.00, nomFamille: nom, achatsCeMois: 0 };
    utilisateurs.push(nouvelUser);
    utilisateurActuel = nouvelUser;
    
    sauvegarderEtActualiser();
    fermerModales();

    afficherNotification(
        "¡Bienvenido/a!", 
        `Hola <strong>${prenom}</strong>,<br><br>Gracias por registrarte. Hemos añadido un regalo de <strong>20.00 €</strong> a tu cuenta para tus compras.`
    );
}

function deconnexion() {
    localStorage.removeItem('session_active');
    utilisateurActuel = null;
    panier = [];
    window.location.reload();
}

// ==========================================
// --- 7. LOGIQUE BONUS DE FIDÉLITÉ ---
// ==========================================
function traiterBonusAchat(montant) {
    let messageBonus = "";
    if (montant >= 50) {
        utilisateurActuel.achatsCeMois = (utilisateurActuel.achatsCeMois || 0) + 1;
        
        let restants = 3 - utilisateurActuel.achatsCeMois;
        if (restants > 0) {
            messageBonus = `<br><br>ℹ️ <em>¡Llevas ${utilisateurActuel.achatsCeMois} compra(s) de más de 50€. Haz ${restants} más este mes para recibir un <strong>bono de 60.00 €</strong>!</em>`;
        } else if (restants === 0) {
            utilisateurActuel.solde += 60.00; 
            utilisateurActuel.achatsCeMois = 0; 
            messageBonus = `<br><br>🎉 <strong>¡ENHORABUENA!</strong> Has realizado 3 compras de más de 50€ este mes. ¡Hemos añadido un <strong>bono de 60.00 €</strong> a tu cuenta!`;
        }
    } else {
        let restants = 3 - (utilisateurActuel.achatsCeMois || 0);
        messageBonus = `<br><br>ℹ️ <em>Recuerda: ¡3 compras al mes de más de 50€ te dan derecho a un <strong>bono de 60.00 € de regalo</strong>! (Llevas ${utilisateurActuel.achatsCeMois || 0})</em>`;
    }
    return messageBonus;
}

// ==========================================
// --- 8. LOGIQUE D'ACHAT : TIENDA ---
// ==========================================
function calculerAchat(element) {
    if (!element) return;
    
    const nom = element.getAttribute('data-nom') || "Produit";
    const prix = parseFloat(element.getAttribute('data-prix')) || 0;
    const envio = parseFloat(element.getAttribute('data-envio')) || 0;
    const temps = element.getAttribute('data-temps') || "--";

    const total = prix + envio;
    prixArticleCourant = total; 
    nomArticleCourant = nom;

    const ids = {
        'nom-selec': nom,
        'temps-selec': temps,
        'frais-selec': envio.toFixed(2) + " €",
        'total-selec': total.toFixed(2) + " €"
    };

    for (let id in ids) {
        const el = document.getElementById(id);
        if (el) el.innerText = ids[id];
    }

    verifierEtAjusterBoutonTienda(total);
}

function verifierEtAjusterBoutonTienda(total) {
    const alerte = document.getElementById("alerte-solde");
    const btnAcheter = document.getElementById("btn-acheter-tienda");

    if (utilisateurActuel) {
        if (total > utilisateurActuel.solde) {
            if (alerte) alerte.style.display = "block";
            if (btnAcheter) {
                btnAcheter.style.opacity = "1";
                btnAcheter.textContent = "Recharger et Acheter";
            }
        } else {
            if (alerte) alerte.style.display = "none";
            if (btnAcheter) {
                btnAcheter.style.opacity = "1";
                btnAcheter.textContent = "Comprar";
            }
        }
    }
}

const btnTienda = document.getElementById('btn-acheter-tienda');
if(btnTienda) {
    btnTienda.addEventListener('click', executerAchatBoutique);
}

function executerAchatBoutique() {
    if (!utilisateurActuel) {
        ouvrirModal(modalConnexion);
        return;
    }

    if (prixArticleCourant === 0) {
        afficherNotification("Tienda", "Por favor, seleccione un produit.");
        return;
    }

    if (utilisateurActuel.solde >= prixArticleCourant) {
        // 1. 🔥 TRÈS IMPORTANT : On sauvegarde le nom et le prix dans des variables temporaires
        // avant que "annulerSelectionTienda" ne les efface !
        let produitAchete = nomArticleCourant || "Article Tienda";
        let prixPaye = prixArticleCourant.toFixed(2);

        // 2. Traitement de l'achat (ton code d'origine)
        utilisateurActuel.solde -= prixArticleCourant;
        let txtBonus = traiterBonusAchat(prixArticleCourant);

        const idx = utilisateurs.findIndex(u => u.user === utilisateurActuel.user);
        if(idx !== -1) utilisateurs[idx] = utilisateurActuel;

        sauvegarderEtActualiser();
        annulerSelectionTienda(false); // (Ici, les variables globales repassent à 0)

        afficherNotification("¡Compra Exitosa!", `Tu compra de <strong>${produitAchete}</strong> ha sido procesada correctamente. Su saldo ha sido actualizado.${txtBonus}`);

        // =======================================================================
        // 🚀 LE CHAINAGE : On lance le formulaire de livraison avec nos variables sauvegardées !
        // =======================================================================
        actionApresAchatTienda(produitAchete, prixPaye);

    } else {
        typeAchatEnCours = "TIENDA";
        ouvrirModal(modalRecharge);
    }
}

function annulerSelectionTienda(notifier = true) {
    prixArticleCourant = 0;
    nomArticleCourant = "";
    if(document.getElementById('nom-selec')) document.getElementById('nom-selec').textContent = "-";
    if(document.getElementById('temps-selec')) document.getElementById('temps-selec').textContent = "--";
    if(document.getElementById('frais-selec')) document.getElementById('frais-selec').textContent = "0.00 €";
    if(document.getElementById('total-selec')) document.getElementById('total-selec').textContent = "0.00 €";
    
    const alerte = document.getElementById("alerte-solde");
    if (alerte) alerte.style.display = "none";
    
    const btnAcheter = document.getElementById("btn-acheter-tienda");
    if (btnAcheter) btnAcheter.textContent = "Comprar";

    if(notifier) afficherNotification("Tienda", "Selección cancelada.");
}

// ==========================================
// --- 9. LOGIQUE D'ACHAT : PANIER MUSIQUE ---
// ==========================================
function ajouterAuPanier() {
    if (!utilisateurActuel) return ouvrirModal(modalConnexion);
    const titre = affichage.titulo.textContent;
    if (titre === "Selecciona una pista" || titre === "-") return;

    if (panier.find(i => i.titre === titre)) return;
    
    let prix = parseFloat(affichage.precio.textContent.replace(' €', ''));
    
    // 🔥 AJOUT : On récupère le lien réel de la musique en cours de lecture
    let urlFichier = typeof videoEnAttente !== 'undefined' ? videoEnAttente : "";

    // On stocke le titre, le prix ET le lien du fichier dans le panier
    panier.push({ titre, prix, urlFichier });

    const btn = document.querySelector(".btn-download");
    if(btn) btn.textContent = `Ajouté (${panier.length})`;
}

function supprimerDuPanier(index) {
    panier.splice(index, 1);
    const btn = document.querySelector(".btn-download");
    if(btn) {
        btn.textContent = panier.length > 0 ? `Ajouté (${panier.length})` : "Ajouter au panier";
    }

    if (panier.length === 0) {
        fermerModales();
    } else {
        ouvrirPanier(); 
    }
}

function viderToutLePanier() {
    panier = [];
    const btn = document.querySelector(".btn-download");
    if(btn) btn.textContent = "Ajouter au panier";
    fermerModales();
}

function ouvrirPanier() {
    if (!utilisateurActuel) return ouvrirModal(modalConnexion);
    if (panier.length === 0) return;

    typeAchatEnCours = "PANIER"; 
    let totalEUR = panier.reduce((s, i) => s + i.prix, 0);
    
    const recap = document.getElementById("recap-achat");
    const alerte = document.getElementById("alerte-solde-musique");
    const btnConfirmer = document.getElementById("btn-confirmer-paiement");
    const btnVersRecharge = document.getElementById("btn-vers-recharge-musique");

    let html = `<h3 style="color:#d4af37">Tu selección</h3>`;
    panier.forEach((i, index) => {
        html += `
        <p style="display:flex; justify-content:space-between; align-items:center;">
            <span>${i.titre}</span> 
            <span>
                ${i.prix.toFixed(2)} € 
                <button onclick="supprimerDuPanier(${index})" style="background:none; border:none; color:#ff4d4d; margin-left:10px; cursor:pointer; font-weight:bold;">❌</button>
            </span>
        </p>`;
    });
    html += `<hr><p style="font-weight:bold; font-size:1.2rem; display:flex; justify-content:space-between"><span>TOTAL</span> <span>${totalEUR.toFixed(2)} €</span></p>`;
    if(recap) recap.innerHTML = html;

    if (utilisateurActuel.solde < totalEUR) {
        if(alerte) alerte.style.display = "block";
        if(btnConfirmer) btnConfirmer.style.display = "none";
        if(btnVersRecharge) {
            btnVersRecharge.style.display = "block";
            btnVersRecharge.onclick = function() {
                fermerModales();
                ouvrirModal(modalRecharge);
            };
        }
    } else {
        if(alerte) alerte.style.display = "none";
        if(btnConfirmer) btnConfirmer.style.display = "block";
    }

    ouvrirModal(modalConfirmation);

    if(btnConfirmer) {
        btnConfirmer.onclick = function() {
            if (utilisateurActuel.solde >= totalEUR) {
                
                // 🔥 1. CRUCIAL : On fait une copie du panier contenant les morceaux achetés
                // avant que la fonction "viderToutLePanier()" ne supprime tout !
                const panierAchete = [...panier];

                // 2. Déduction de l'argent du solde virtuel
                utilisateurActuel.solde -= totalEUR;
                let txtBonus = traiterBonusAchat(totalEUR);

                const idx = utilisateurs.findIndex(u => u.user === utilisateurActuel.user);
                if(idx !== -1) utilisateurs[idx] = utilisateurActuel;

                // 3. On vide le panier et on met à jour la base de données locale
                viderToutLePanier();
                sauvegarderEtActualiser();
                
                afficherNotification("¡Compra exitosa!", `Tu selección musical ha sido adquirida.${txtBonus}`);

                // 🔥 4. FORCE LE TÉLÉCHARGEMENT DIRECT SUR LA MACHINE DE L'UTILISATEUR
                panierAchete.forEach(item => {
                    if (item.urlFichier) {
                        // Création d'un lien HTML invisible temporaire
                        const lienTelechargement = document.createElement('a');
                        lienTelechargement.href = item.urlFichier;
                        
                        // Force le navigateur à enregistrer le fichier au lieu de le lire dans l'onglet
                        lienTelechargement.download = item.titre || "musique.mp3"; 
                        
                        document.body.appendChild(lienTelechargement);
                        lienTelechargement.click(); // Déclenche le téléchargement automatique
                        document.body.removeChild(lienTelechargement); // Nettoie le code HTML
                    } else {
                        console.error(`Impossible de télécharger "${item.titre}" : aucun lien de fichier trouvé.`);
                    }
                });

            } else {
                fermerModales();
                ouvrirModal(modalRecharge);
            }
        };
    }
}
// ==========================================
// --- 10. LOGIQUE D'ACHAT : TICKETS ---
// ==========================================

let prixTicketCourant = 0;
let titreTicketCourant = "";
let villeTicketCourant = ""; // Ajouté pour enrichir le ticket à télécharger

function ouvrirModalEvenement(element) {
    const titre = element.getAttribute('data-titulo') || "-";
    const feat = element.getAttribute('data-featuring') || "-";
    const repo = element.getAttribute('data-repertoire') || "-";
    const prog = element.getAttribute('data-programme') || "-";
    const ville = element.getAttribute('data-ville') || "-";
    const prix = element.getAttribute('data-prix') || "0";
    const img = element.getAttribute('data-img') || "";

    prixTicketCourant = parseFloat(prix) || 0;
    titreTicketCourant = titre;
    villeTicketCourant = ville; // On stocke la ville

    if(document.getElementById('ev-titre')) document.getElementById('ev-titre').innerText = titre;
    if(document.getElementById('ev-feat')) document.getElementById('ev-feat').innerText = feat;
    if(document.getElementById('ev-repo')) document.getElementById('ev-repo').innerText = repo;
    if(document.getElementById('ev-prog')) document.getElementById('ev-prog').innerText = prog;
    if(document.getElementById('ev-ville')) document.getElementById('ev-ville').innerText = ville;
    if(document.getElementById('ev-prix')) document.getElementById('ev-prix').innerText = prixTicketCourant > 0 ? prixTicketCourant.toFixed(2) + " €" : "Gratis";
    
    const afficheImg = document.getElementById('ev-affiche');
    if (afficheImg) afficheImg.src = img;

    const modal = document.getElementById('modal-evenement-detail');
    if(modal) modal.style.display = 'flex';
    afficherCommentaires(); // Pour forcer l'affichage des commentaires à l'ouverture
}

function fermerModalEv() {
    const modal = document.getElementById('modal-evenement-detail');
    if(modal) modal.style.display = 'none';
    // On ne réinitialise pas tout de suite pour permettre au téléchargement de lire les variables
}

// ==========================================
// --- 11. RECHARGE INTELLIGENTE SUITE À ALERTE ---
// ==========================================
function validerRecharge() {
    if (!utilisateurActuel) return;

    // 1. On récupère l'élément input (assure-toi qu'il a bien l'id "montant-recharge" dans ton HTML)
    const inputMontant = document.getElementById("montant-recharge"); 
    
    // 2. On transforme le texte tapé en nombre (Float)
    let montant = parseFloat(inputMontant.value);

    // 3. Sécurité : si le montant est invalide ou vide, on met 0
    if (isNaN(montant) || montant <= 0) {
        alert("Por favor, ingresa un monto válido.");
        return;
    }

    // 4. On ajoute le montant saisi au lieu de 50.00
    utilisateurActuel.solde += montant; 

    // 5. Mise à jour dans la liste des utilisateurs
    const index = utilisateurs.findIndex(u => u.user === utilisateurActuel.user);
    if (index !== -1) utilisateurs[index].solde = utilisateurActuel.solde;

    sauvegarderEtActualiser();
    fermerModales();

    // Réinitialisation de l'input pour la prochaine fois
    inputMontant.value = "";

  
}

// ==========================================
// --- 12. UTILITAIRES DES MODALES & HEADER ---
// ==========================================
function sauvegarderEtActualiser() {
    localStorage.setItem('bdd_utilisateurs', JSON.stringify(utilisateurs));
    localStorage.setItem('session_active', JSON.stringify(utilisateurActuel));
    majInterfaceHeader();
}

function majInterfaceHeader() {
    if (utilisateurActuel) {
        const hSolde = document.getElementById("header-solde");
        const btnReg = document.getElementById("btn-registrar-header");
        const uProfile = document.getElementById("user-profile");
        const uName = document.getElementById("header-username");
        
        if(hSolde) hSolde.textContent = utilisateurActuel.solde.toFixed(2) + " €";
        if(btnReg) btnReg.style.display = "none";
        if(uProfile) uProfile.style.display = "flex";
        if(uName) uName.textContent = utilisateurActuel.user;
    }
}

// Ouvre une modale passée en paramètre
function ouvrirModal(cible) {
    if(!cible) return;
    cible.style.display = "flex";
}

// Ferme toutes les modales du site
function fermerModales() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = "none");
    
    const modalRegistre = document.getElementById('modal-registre');
    if (modalRegistre) modalRegistre.style.display = 'none';
    
    const menu = document.getElementById("user-menu");
    if(menu) menu.style.display = "none";
}

function toggleUserMenu() {
    const menu = document.getElementById("user-menu");
    if (menu) {
        menu.style.display = (menu.style.display === "none" || menu.style.display === "") ? "block" : "none";
    }
}

function ouvrirInscriptionLarge() {
    fermerModales(); 
    const modalRegistre = document.getElementById('modal-registre');
    if (modalRegistre) {
        modalRegistre.style.display = 'flex';
    }
}

function fermerRegistre() {
    const modalRegistre = document.getElementById('modal-registre');
    if (modalRegistre) {
        modalRegistre.style.display = 'none';
    }
}


// ==========================================
// --- 13. LOGIQUE DE LA BARRE DE RECHERCHE UNIVERSELLE ---
// ==========================================
function initialiserRecherche() {
    const barreRecherche = document.getElementById('search-input') || document.querySelector('.search-box input') || document.querySelector('input[type="text"]');
    const boiteSuggestions = document.getElementById('suggestions-box');
    
    const choix_produits = document.querySelectorAll(".producto, [data-nom]");
    const choix_evenements = document.querySelectorAll(".evento, [data-ville]");

    if (!barreRecherche || !boiteSuggestions) return;

    barreRecherche.addEventListener('input', function() {
        const motCle = this.value.toLowerCase().trim();
        boiteSuggestions.innerHTML = ""; 

        if (motCle === "") {
            boiteSuggestions.style.display = "none";
            choix_pistes.forEach(el => el.style.display = "");
            choix_produits.forEach(el => el.style.display = "");
            choix_evenements.forEach(el => el.style.display = "");
            return;
        }

        let suggestionsTrouvees = [];

        choix_pistes.forEach(piste => {
            const titre = piste.dataset.titulo || "";
            const artiste = piste.dataset.creator || "";
            const genero = piste.dataset.genero || "";

            if (titre.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(titre)) suggestionsTrouvees.push(titre);
            if (artiste.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(artiste)) suggestionsTrouvees.push(artiste);
            if (genero.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(genero)) suggestionsTrouvees.push(genero);
        });

        choix_produits.forEach(produit => {
            const nomProduit = produit.getAttribute('data-nom') || "";
            if (nomProduit.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(nomProduit)) {
                suggestionsTrouvees.push(nomProduit);
            }
        });

        choix_evenements.forEach(ev => {
            const titreEv = ev.getAttribute('data-titulo') || "";
            const villeEv = ev.getAttribute('data-ville') || "";
            
            if (titreEv.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(titreEv)) suggestionsTrouvees.push(titreEv);
            if (villeEv.toLowerCase().includes(motCle) && !suggestionsTrouvees.includes(villeEv)) suggestionsTrouvees.push(villeEv);
        });

        if (suggestionsTrouvees.length > 0) {
            boiteSuggestions.style.display = "block";
            
            suggestionsTrouvees.forEach(nom => {
                const elementSuggestion = document.createElement('div');
                elementSuggestion.textContent = nom;
                elementSuggestion.style.padding = "10px";
                elementSuggestion.style.cursor = "pointer";
                elementSuggestion.style.borderBottom = "1px solid #333";

                elementSuggestion.onmouseover = () => elementSuggestion.style.background = "#d4af37";
                elementSuggestion.onmouseout = () => elementSuggestion.style.background = "#222";

                elementSuggestion.addEventListener('click', function() {
                    barreRecherche.value = nom;
                    boiteSuggestions.style.display = "none";
                    filtrerToutLeSite(nom.toLowerCase(), choix_produits, choix_evenements);
                });

                boiteSuggestions.appendChild(elementSuggestion);
            });
        } else {
            boiteSuggestions.style.display = "none";
        }

        filtrerToutLeSite(motCle, choix_produits, choix_evenements);
    });

    document.addEventListener('click', function(e) {
        if (e.target !== barreRecherche) {
            boiteSuggestions.style.display = "none";
        }
    });
}

function filtrerToutLeSite(mot, produits, evenements) {
    choix_pistes.forEach(piste => {
        const titre = (piste.dataset.titulo || "").toLowerCase();
        const artiste = (piste.dataset.creator || "").toLowerCase();
        piste.style.display = (titre.includes(mot) || artiste.includes(mot)) ? "" : "none";
    });

    produits.forEach(produit => {
        const nom = (produit.getAttribute('data-nom') || "").toLowerCase();
        produit.style.display = nom.includes(mot) ? "" : "none";
    });

    evenements.forEach(ev => {
        const titre = (ev.getAttribute('data-titulo') || "").toLowerCase();
        const ville = (ev.getAttribute('data-ville') || "").toLowerCase();
        ev.style.display = (titre.includes(mot) || ville.includes(mot)) ? "" : "none";
    });
}

function ouvrirZoomProduit(srcImage, event) {
    event.stopPropagation(); 
    window.getSelection().removeAllRanges(); 
    
    const modal = document.getElementById('modal-zoom-produit');
    const imgCible = document.getElementById('img-zoom-cible');
    
    imgCible.src = srcImage;
    modal.style.display = 'flex';
}

function fermerZoomProduit() {
    const modal = document.getElementById('modal-zoom-produit');
    modal.style.display = 'none';
}

// --- CORRECTION : FONCTIONS DÉDIÉES AUX 14 JOURS GRATUITS ---
function ouvrirModalInscription() {
    document.getElementById('modal-inscription').style.display = 'flex';
}

function fermerModalInscription() {
    document.getElementById('modal-inscription').style.display = 'none';
}

// Changement de nom ici pour éviter le conflit avec la connexion
function validerEssaiGratuit(event) {
    event.preventDefault(); 
    alert("¡Cuenta creada con éxito! Vos 14 jours gratuits commencent maintenant.");
    fermerModalInscription();
}

// ==========================================
// --- 14. ENVOYER UN APERCU DE L'ACCUEIL VERS ESCUCHAR ---
// ==========================================
function apercuVersLecteur(sourceVideo, titre, artiste) {
    // 1. On stocke la vidéo sélectionnée en mémoire
    videoEnAttente = sourceVideo;

    // 2. On met à jour les textes du lecteur à gauche (si les éléments existent)
    if(affichage.titulo) affichage.titulo.textContent = titre;
    if(affichage.artista) affichage.artista.textContent = artiste;
    if(affichage.genero) affichage.genero.textContent = "Aperçu"; // Optionnel

    // 3. On bascule automatiquement vers la section écouter
    naviguerVers('section-ecouter');

    // 4. On force le lecteur principal à charger et jouer la vidéo immédiatement
    if (lecteurPrincipal) {
        lecteurPrincipal.src = sourceVideo;
        lecteurPrincipal.load();
        
        // Le play() est lancé directement pour que ça démarre sans attendre
        lecteurPrincipal.play().catch(err => {
            console.log("Lecture automatique bloquée, l'utilisateur doit cliquer sur Play :", err);
        });
    }
}

function confirmerAchatTicket() {
    if (!utilisateurActuel) {
        fermerModalEv();
        ouvrirModal(modalConnexion);
        return;
    }

    if (utilisateurActuel.solde >= prixTicketCourant) {
        utilisateurActuel.solde -= prixTicketCourant;
        let txtBonus = traiterBonusAchat(prixTicketCourant);

        const idx = utilisateurs.findIndex(u => u.user === utilisateurActuel.user);
        if(idx !== -1) utilisateurs[idx] = utilisateurActuel;

        sauvegarderEtActualiser();
        fermerModalEv();

        // Sécurité pour l'affichage du prix payé
        const affichagePrix = prixTicketCourant > 0 ? `${prixTicketCourant.toFixed(2)} €` : "Gratis (0.00 €)";
        const refTransaction = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        const nomClient = utilisateurActuel.user;
        const nomEv = titreTicketCourant;
        const villeEv = villeTicketCourant;

        // Préparation des données pour le bouton de téléchargement
        window.ticketDataPourTelechargement = {
            client: nomClient,
            evento: nomEv,
            ciudad: villeEv,
            pago: affichagePrix,
            ref: refTransaction
        };

        // Création du message HTML de la notification avec le bouton de téléchargement inclus
        const ticketInfo = `
        🎫 <strong>TICKET DIGITAL CONFIRMADO</strong><br>
        ----------------------------<br>
        Cliente: ${nomClient}<br>
        Evento: ${nomEv}<br>
        Ciudad: ${villeEv}<br>
        Total Pago: ${affichagePrix}<br>
        Ref: ${refTransaction}<br>
        ----------------------------<br>
        ¡Tu entrada queda guardada! ${txtBonus}<br><br>
        <button onclick="telechargerFichierTicket()" style="background: #d4af37; color: #000; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px; font-weight: bold; width: 100%; display: block; margin-top: 10px;">
            📥 Descargar mi Ticket (.txt)
        </button>
        `;
        
        afficherNotification("Ticket Reservado", ticketInfo);

        // Nettoyage des variables globales de secours
        prixTicketCourant = 0;
        titreTicketCourant = "";
        villeTicketCourant = "";
    } else {
        typeAchatEnCours = "TICKET";
        fermerModalEv();
        ouvrirModal(modalRecharge);
    }
}

// Nouvelle fonction pour télécharger le ticket au format texte (.txt)
function telechargerFichierTicket() {
    const data = window.ticketDataPourTelechargement;
    if (!data) {
        alert("Error: No se encontraron datos del ticket.");
        return;
    }

    const contenuTextuel = `
========================================
       🎫 TICKET DE RESERVACIÓN 🎫
========================================
Fecha de emisión: ${new Date().toLocaleDateString()}
Referencia: ${data.ref}

Detalles del Cliente:
----------------------------------------
Cliente: ${data.client}

Detalles del Evento:
----------------------------------------
Evento: ${data.evento}
Ciudad/Lugar: ${data.ciudad}
Total Pagado: ${data.pago}

----------------------------------------
¡Gracias por tu compra! Presenta este
ticket text o captura de pantalla en la 
entrada del evento.
========================================
    `.trim();

    // Création du Blob pour le téléchargement sécurisé sur mobile/PC
    const blob = new Blob([contenuTextuel], { type: "text/plain;charset=utf-8" });
    const urlFichier = URL.createObjectURL(blob);

    const lienTemporaire = document.createElement("a");
    lienTemporaire.href = urlFichier;
    lienTemporaire.download = `Ticket_${data.evento.replace(/\s+/g, '_')}.txt`;
    
    document.body.appendChild(lienTemporaire);
    lienTemporaire.click();
    
    // Nettoyage de la mémoire du navigateur
    document.body.removeChild(lienTemporaire);
    URL.revokeObjectURL(urlFichier);
}

// ... (Tout ton code actuel reste au-dessus sans y toucher) ...

// --- LA DERNIÈRE FONCTION QUE TU AVAIS DÉJÀ ---
function lancerLecteur() {
    if (typeof videoEnAttente !== 'undefined' && videoEnAttente && typeof lecteurPrincipal !== 'undefined' && lecteurPrincipal) {
        try {
            lecteurPrincipal.src = videoEnAttente;
            lecteurPrincipal.load(); 
            lecteurPrincipal.play().catch(error => {
                console.log("Lecture automatique bloquée par le navigateur.");
            });
        } catch (err) {
            console.error("Erreur lors du lancement du lecteur :", err);
        }
    }
}


window.addEventListener('DOMContentLoaded', () => {
    mettreAJourMenuHaut();
});

function mettreAJourMenuHaut() {
    // Cherche le bouton dans le HTML (id="btn-connexion" ou class="btn-registrarse")
    const boutonConnexion = document.getElementById('btn-connexion') || document.querySelector('.btn-registrarse'); 
    const boutonProfil = document.getElementById('btn-profil'); 

    if (typeof utilisateurActuel !== 'undefined' && utilisateurActuel) {
        console.log("Fix Menu : Utilisateur connecté détecté, modification du bouton haut.");
        if (boutonConnexion) {
            let nomAafficher = utilisateurActuel.prenom || "Mon Compte";
            boutonConnexion.textContent = nomAafficher;
            boutonConnexion.classList.add('connecte'); 
        }
        if (boutonProfil) {
            boutonProfil.style.display = 'block'; 
        }
    } else {
        console.log("Fix Menu : Aucun utilisateur connecté.");
        if (boutonConnexion) {
            boutonConnexion.textContent = "Registrarse";
            boutonConnexion.classList.remove('connecte');
        }
        if (boutonProfil) {
            boutonProfil.style.display = 'none';
        }
    }
}



// =======================================================================
// --- B. PARTIE "TIENDA" : FORMULAIRE DE LIVRAISON & FACTURE AVEC RAPPEL ---
// =======================================================================

// 1. CETTE FONCTION OUVRE LE FORMULAIRE DE LIVRAISON/FACTURATION
function actionApresAchatTienda(nomProduit, prix) {
    console.log(`[TIENDA] Achat validé. Étape 1 : Demande des informations de facturation et livraison.`);
    ouvrirFormulaireLivraisonTienda(nomProduit, prix);
}

// --- SUB-FONCTION 1 : AFFICHAGE DU FORMULAIRE ---
function ouvrirFormulaireLivraisonTienda(nomProduit, prix) {
    const ancienForm = document.getElementById('modal-livraison-tienda');
    if (ancienForm) ancienForm.remove();

    const htmlFormulaire = `
        <div id="modal-livraison-tienda" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#1e1e1e; color:#fff; padding:25px; border-radius:12px; box-shadow:0 0 25px rgba(0,0,0,0.7); z-index:9999; width:360px; font-family:sans-serif; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin-top:0; border-bottom:1px solid #333; padding-bottom:10px; color:#00ff88;">📦 Coordonnées de livraison</h3>
            <p style="font-size:12px; color:#aaa; margin-bottom:20px;">Votre paiement est validé. Veuillez remplir l'adresse pour la livraison et la facture de : <strong>${nomProduit}</strong></p>
            
            <form id="form-livraison" onsubmit="finaliserFactureNumérique(event, '${nomProduit}', '${prix}')">
                
                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px; color:#aaa;">Type d'acheteur</label>
                    <select id="tienda-type-client" onchange="toggleChampEntreprise()" style="width:100%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                        <option value="particulier">Particulier / Individuel</option>
                        <option value="entreprise">Organisation / Entreprise</option>
                    </select>
                </div>

                <div id="bloc-entreprise" style="margin-bottom:15px; display:none;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">Nom de l'entreprise / Organisation *</label>
                    <input type="text" id="tienda-nom-entreprise" style="width:92%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">Nom complet du destinataire *</label>
                    <input type="text" id="tienda-nom" required style="width:92%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">Adresse Email *</label>
                    <input type="email" id="tienda-email" required style="width:92%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                </div>

                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">Adresse postale de livraison *</label>
                    <input type="text" id="tienda-adresse" required style="width:92%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                </div>

                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <div style="width:40%;">
                        <label style="font-size:12px; display:block; margin-bottom:5px;">Code Postal *</label>
                        <input type="text" id="tienda-cp" required style="width:80%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                    </div>
                    <div style="width:60%;">
                        <label style="font-size:12px; display:block; margin-bottom:5px;">Ville *</label>
                        <input type="text" id="tienda-ville" required style="width:88%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;">
                    </div>
                </div>

                <div style="margin-bottom:20px;">
                    <label style="font-size:12px; display:block; margin-bottom:5px;">Pays *</label>
                    <input type="text" id="tienda-pays" required style="width:92%; padding:8px; background:#2a2a2a; color:#fff; border:1px solid #444; border-radius:5px;" value="France">
                </div>

                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="document.getElementById('modal-livraison-tienda').remove()" style="width:40%; background:#444; color:#fff; border:none; padding:10px; border-radius:5px; cursor:pointer;">Annuler</button>
                    <button type="submit" style="width:60%; background:#00ff88; color:#000; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">Générer ma Facture</button>
                </div>
            </form>
        </div>
    `;

    const conteneurForm = document.createElement('div');
    conteneurForm.innerHTML = htmlFormulaire;
    document.body.appendChild(conteneurForm);
}

// --- SUB-FONCTION 2 : GESTION DYNAMIQUE DU CHAMP ENTREPRISE ---
function toggleChampEntreprise() {
    const typeClient = document.getElementById('tienda-type-client').value;
    const blocEntreprise = document.getElementById('bloc-entreprise');
    const champEntreprise = document.getElementById('tienda-nom-entreprise');

    if (typeClient === 'entreprise') {
        blocEntreprise.style.display = 'block';
        champEntreprise.required = true;
    } else {
        blocEntreprise.style.display = 'none';
        champEntreprise.required = false;
        champEntreprise.value = '';
    }
}

// --- SUB-FONCTION 3 : FACTURE FINALE AVEC RAPPEL DE LIVRAISON SITE ---
function finaliserFactureNumérique(event, nomProduit, prix) {
    event.preventDefault();

    const typeClient = document.getElementById('tienda-type-client').value;
    const nomEntreprise = document.getElementById('tienda-nom-entreprise').value;
    const nomAcheteur = document.getElementById('tienda-nom').value;
    const emailAcheteur = document.getElementById('tienda-email').value;
    const adresse = document.getElementById('tienda-adresse').value;
    const cp = document.getElementById('tienda-cp').value;
    const ville = document.getElementById('tienda-ville').value;
    const pays = document.getElementById('tienda-pays').value;

    document.getElementById('modal-livraison-tienda').remove();

    const dateAujourdhui = new Date().toLocaleDateString('fr-FR');
    const numeroFacture = "FAC-" + Math.floor(100000 + Math.random() * 900000);

    let infoClientHTML = `<strong>Client :</strong> ${nomAcheteur}`;
    if (typeClient === 'entreprise' && nomEntreprise) {
        infoClientHTML = `<strong>Entreprise :</strong> ${nomEntreprise}<br><strong>Représenté par :</strong> ${nomAcheteur}`;
    }

    const htmlFacture = `
        <div id="facture-modal" style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; color:#000; padding:30px; border-radius:10px; box-shadow:0 0 30px rgba(0,0,0,0.6); z-index:99999; width:360px; font-family:sans-serif; line-height:1.4;">
            <h2 style="margin-top:0; border-bottom:2px solid #000; padding-bottom:10px; text-align:center; letter-spacing:1px;">🧾 FACTURE</h2>
            
            <table style="width:100%; font-size:12px; margin-bottom:15px;">
                <tr>
                    <td><strong>Facture :</strong> ${numeroFacture}</td>
                    <td style="text-align:right;"><strong>Date :</strong> ${dateAujourdhui}</td>
                </tr>
            </table>

            <div style="background:#f9f9f9; padding:12px; border-radius:5px; font-size:13px; margin-bottom:15px; border-left:4px solid #000;">
                ${infoClientHTML}<br>
                <strong>Email :</strong> ${emailAcheteur}<br>
                <strong>Adresse de Livraison :</strong><br>
                ${adresse}, ${cp} ${ville}, ${pays}
            </div>

            <!-- 🚛 ENCADRÉ DE RAPPEL DE LIVRAISON SÉLECTIONNÉ PAR LE SITE -->
            <div style="background:#fff9e6; color:#7a5300; border: 1px solid #ffe8a1; padding:12px; border-radius:5px; font-size:12px; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
                <span>🚛 <strong>Rappel Livraison :</strong> Ce produit sera expédié et livré selon les délais et la date de livraison officielle indiqués sur le site.</span>
            </div>

            <hr style="border:0; border-top:1px dashed #ccc; margin-bottom:15px;">

            <table style="width:100%; font-size:14px; margin-bottom:20px;">
                <thead>
                    <tr style="border-bottom:1px solid #000;">
                        <th style="text-align:left; padding-bottom:5px;">Produit</th>
                        <th style="text-align:right; padding-bottom:5px;">Prix</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:10px 0;">${nomProduit}</td>
                        <td style="text-align:right; font-weight:bold;">${prix} €</td>
                    </tr>
                </tbody>
            </table>

            <div style="background:#eef9f0; color:#1e4620; padding:12px; text-align:center; font-weight:bold; border-radius:5px; margin-bottom:20px; font-size:15px;">
                Total Payé : ${prix} €
            </div>

            <p style="font-size:11px; color:green; text-align:center; margin-bottom:20px;">✓ Paiement sécurisé validé.</p>
            <button onclick="document.getElementById('facture-modal').remove()" style="width:100%; background:#000; color:#fff; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;">Fermer</button>
        </div>
    `;

    const conteneurFacture = document.createElement('div');
    conteneurFacture.innerHTML = htmlFacture;
    document.body.appendChild(conteneurFacture);
}




