/* =========================================================
   HÉLIXSTRAT — scripts du site
   ========================================================= */

/* ---------- 1. Page d'accès ----------
   Le code n'est pas écrit en clair : on compare son "empreinte" (SHA-256).
   Pour changer de code, il faut recalculer cette empreinte.
   ⚠ C'est une protection légère (avant-première), pas une vraie sécurité :
   le contenu du site reste présent dans le code de la page. */
(function () {
  const EMPREINTE_CODE = "7cbf73a0980fc9c9b6120d45ff8e6777d9b6a8c57ef533ab92eabaa6cbdb7680";
  const CLE_SESSION = "helixstrat-acces";

  const acces = document.getElementById("acces");
  const site = document.getElementById("site");
  const form = document.getElementById("acces-form");
  const champ = document.getElementById("acces-code");
  const erreur = document.getElementById("acces-erreur");

  function ouvrirSite() {
    acces.hidden = true;
    site.hidden = false;
    window.scrollTo(0, 0);
  }

  // Déjà entré pendant cette session (onglet) ? On ne redemande pas le code.
  try {
    if (sessionStorage.getItem(CLE_SESSION) === "ok") {
      ouvrirSite();
      return;
    }
  } catch (e) { /* stockage indisponible : on redemandera le code */ }

  champ.focus();

  async function empreinte(texte) {
    const octets = new TextEncoder().encode(texte);
    const hash = await crypto.subtle.digest("SHA-256", octets);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  form.addEventListener("submit", async function (evt) {
    evt.preventDefault();
    const saisie = champ.value.trim().toLowerCase();

    if (!saisie) {
      erreur.textContent = "Merci de saisir le code.";
      champ.setAttribute("aria-invalid", "true");
      return;
    }

    if ((await empreinte(saisie)) === EMPREINTE_CODE) {
      try { sessionStorage.setItem(CLE_SESSION, "ok"); } catch (e) {}
      ouvrirSite();
    } else {
      erreur.textContent = "Code incorrect. Veuillez réessayer.";
      champ.setAttribute("aria-invalid", "true");
      champ.select();
      form.classList.remove("secousse");
      void form.offsetWidth; // relance l'animation
      form.classList.add("secousse");
    }
  });

  champ.addEventListener("input", function () {
    erreur.textContent = "";
    champ.removeAttribute("aria-invalid");
  });
})();

/* ---------- 2. Les récits : « Lire la suite » ----------
   Un seul récit ouvert à la fois. Cliquer à nouveau referme. */
(function () {
  const boutons = document.querySelectorAll(".recit__bouton");

  function fermerTout() {
    boutons.forEach(function (b) {
      b.setAttribute("aria-expanded", "false");
      b.textContent = "Lire la suite";
      b.closest(".recit").classList.remove("est-ouvert");
      document.getElementById(b.getAttribute("aria-controls")).hidden = true;
    });
  }

  // Fait défiler doucement pour que le texte ouvert soit visible
  function rendreVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight * 0.75) {
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "start" });
    }
  }

  boutons.forEach(function (bouton) {
    const suite = document.getElementById(bouton.getAttribute("aria-controls"));

    bouton.addEventListener("click", function () {
      const dejaOuvert = bouton.getAttribute("aria-expanded") === "true";
      fermerTout();
      if (dejaOuvert) return;

      bouton.setAttribute("aria-expanded", "true");
      bouton.textContent = "Refermer";
      bouton.closest(".recit").classList.add("est-ouvert");
      suite.hidden = false;
      rendreVisible(suite);
    });

    // Bouton « Refermer » en bas du texte : referme et revient à la vignette
    suite.querySelector(".recit__fermer").addEventListener("click", function () {
      fermerTout();
      const vignette = bouton.closest(".recit");
      if (vignette.getBoundingClientRect().top < 0) {
        vignette.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      bouton.focus({ preventScroll: true });
    });
  });
})();
