/* Allgemeinmedizin Volksdorf – kleine Hilfsskripte
   1. Menü auf Handy/Tablet auf- und zuklappen
   2. Aktuelle Hinweise: außerhalb ihres Gültigkeitszeitraums ausblenden
   3. Heutigen Wochentag in den Sprechzeiten markieren + Kurzinfo „Heute“
   4. Karte auf der Anfahrtsseite erst nach Klick laden (Datenschutz)
   Die Seite funktioniert auch ohne Skript vollständig – Hinweise sind
   native <details>, die Karte hat einen OpenStreetMap-Link als Ersatz.   */
(function () {
  "use strict";

  var DESKTOP = 896; // = 56em, siehe style.css

  /* 1. Menü ------------------------------------------------------------ */
  var knopf = document.querySelector(".menue-knopf");
  var navigation = document.getElementById("hauptnavigation");

  if (knopf && navigation) {
    var schliessen = function () {
      navigation.classList.remove("offen");
      document.body.classList.remove("menue-offen");
      knopf.setAttribute("aria-expanded", "false");
    };

    knopf.addEventListener("click", function () {
      var offen = navigation.classList.toggle("offen");
      document.body.classList.toggle("menue-offen", offen);
      knopf.setAttribute("aria-expanded", offen ? "true" : "false");
      if (offen) {
        var erster = navigation.querySelector("a");
        if (erster) { erster.focus(); }
      }
    });

    document.addEventListener("keydown", function (ereignis) {
      if (ereignis.key === "Escape" && navigation.classList.contains("offen")) {
        schliessen();
        knopf.focus();
      }
    });

    document.addEventListener("click", function (ereignis) {
      if (!navigation.classList.contains("offen")) { return; }
      if (navigation.contains(ereignis.target) || knopf.contains(ereignis.target)) { return; }
      schliessen();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= DESKTOP) { schliessen(); }
    });
  }

  /* 2. Hinweise nach Datum ---------------------------------------------
     Der Build entfernt abgelaufene Hinweise und versteckt künftige. Hier wird
     mit dem echten Tagesdatum nachgezogen: künftige erscheinen am Stichtag,
     abgelaufene verschwinden auch ohne neuen Build. */
  var jetzt = new Date();
  var heuteISO = jetzt.getFullYear() + "-" +
    String(jetzt.getMonth() + 1).padStart(2, "0") + "-" +
    String(jetzt.getDate()).padStart(2, "0");
  var hinweise = document.querySelectorAll(".hinweis[data-von], .hinweis[data-bis]");
  hinweise.forEach(function (h) {
    var von = h.getAttribute("data-von");
    var bis = h.getAttribute("data-bis");
    h.hidden = !((!von || von <= heuteISO) && (!bis || bis >= heuteISO));
  });
  var hinweisBereich = document.querySelector(".hinweise");
  if (hinweisBereich) {
    hinweisBereich.hidden = !hinweisBereich.querySelector(".hinweis:not([hidden])");
  }
  var heuteGeschlossen = Array.prototype.some.call(
    document.querySelectorAll(".hinweis[data-geschlossen-von]"),
    function (h) {
      var von = h.getAttribute("data-geschlossen-von");
      var bis = h.getAttribute("data-geschlossen-bis");
      return (!von || von <= heuteISO) && (!bis || bis >= heuteISO);
    }
  );

  /* 3. „heute“ in den Sprechzeiten ------------------------------------- */
  var heute = new Date().getDay(); // 0 = Sonntag … 6 = Samstag
  var zeilen = document.querySelectorAll('.zeiten tr[data-tag="' + heute + '"]');
  zeilen.forEach(function (zeile) { zeile.classList.add("heute"); });

  var heuteFeld = document.querySelector("[data-heute]");
  if (heuteFeld) {
    var zeile = zeilen[0];
    if (zeile && !heuteGeschlossen) {
      var zeiten = Array.prototype.map.call(zeile.querySelectorAll(".zeit"), function (z) {
        return z.textContent.replace(/\s*Uhr\s*$/, "").trim();
      });
      heuteFeld.textContent = zeiten.join(" und ") + " Uhr";
    } else {
      heuteFeld.textContent = "Heute geschlossen";
      var zusatz = document.querySelector("[data-heute-zusatz]");
      if (zusatz) { zusatz.hidden = false; }
    }
  }

  /* 4. Karte nach Klick ------------------------------------------------- */
  var karte = document.getElementById("karte");
  var platzhalter = document.getElementById("karte-platzhalter");
  var ladeKnopf = document.getElementById("karte-laden");

  if (karte && ladeKnopf) {
    ladeKnopf.addEventListener("click", function () {
      if (!window.L) { return; }
      var lat = parseFloat(karte.getAttribute("data-lat"));
      var lon = parseFloat(karte.getAttribute("data-lon"));
      var position = [lat, lon];

      if (platzhalter) { platzhalter.hidden = true; }

      var map = L.map(karte, { scrollWheelZoom: false }).setView(position, 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
      }).addTo(map);

      L.marker(position).addTo(map)
        .bindPopup(karte.getAttribute("data-titel") || "Praxis")
        .openPopup();

      map.on("click", function () { map.scrollWheelZoom.enable(); });
      map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
    });
  }
})();
