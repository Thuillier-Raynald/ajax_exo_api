var API = {};	// objet utilisé pour la lisibilité du code : accueille les fonctions qui requêtent l'API REST restcountries.eu
var GUI = {};	// idem ; pour tout ce qui impacte directement l'interface graphique (comportement, données affichées, etc...)

/*
 * récupère la liste des pays, filtrée si besoin sur le nom
 */
API.chargerPays = function(filtreNom, callback) {
	let url = 'https://restcountries.eu/rest/v2/all';	// url par défaut pour récupérer tous les pays
	let fields = 'name;capital;region;population;area;translations;borders;alpha3Code'; // permet de spécifier la liste des champs que l'on récupère pour chaque pays (évitera de récupérer des données inutiles)
	
	// si filtreNom est fourni l'url change
	if (filtreNom) { 
		url = 'https://restcountries.eu/rest/v2/name/' + encodeURI(filtreNom);
	}
	
	let data = {fields: fields};
	
	$.ajax({
		method: 'GET',
		url: url,
		data: data,
		success: callback, // en cas de succès, on exécutera la fonction callback
		error: GUI.afficherErreur
	});
}

/*
 * récupère la liste des pays en se basant sur le code à 3 lettres de chaque pays (propriété alpha3Code)
 */
API.chargerListeByCode = function(filtreCode, callback) {
	let url = 'https://restcountries.eu/rest/v2/alpha';
	let fields = 'name;capital;region;population;area;translations;flag';
	let data = { codes: filtreCode }
	
	$.ajax({
		method: 'GET',
		url: url,
		data: data,
		success: callback,
		error: function() {
			callback([]); // on appelle la fonction callback avec une liste vide : []
		}
	});
}

GUI.pays = []; 		// liste des pays, à afficher
GUI.langue = 'en'; 	// langue des pays, par défaut anglais

/*
 * fonction appellée lors du chargement de la page ;elle se charge d'initialiser la liste des pays, et les événements associés aux différents éléments
 */
GUI.init = function() {
	API.chargerPays('', GUI.assignerPaysEtAfficherTableau);

	// gestion du changement de langue
	$('#select_langue').change(function() {
		GUI.langue = $(this).val();
		GUI.afficherTableau();
	});
	
	// gestion du filtre
	$("#filtre").on('input', function() {
		// $(this) fait référence à l'input text
		API.chargerPays($(this).val(), GUI.assignerPaysEtAfficherTableau);
	});
	
	$("#btn_retour").click( function() {
		$(".ifListe").show();
		$(".ifVoisins").hide();
	});
}

/*
 * se charge de mettre la liste des pays dans GUI.pays, et de l'afficher
 */ 
GUI.assignerPaysEtAfficherTableau = function(pays) {
	GUI.pays = pays;
	GUI.afficherTableau();
}

/*
 * affihe la liste des pays dans le tableau
 */
GUI.afficherTableau = function() {
	$(".ifListe").show(); // rend visible la div contenant la liste des pays
	$(".ifVoisins").hide(); // masque la div contenant les pays voisins
	
	let tbody = $("#table_pays > tbody");
	tbody.empty();
	
	// pour chaque pays, on ajoute une ligne au tableau, que l'on insère dans le <tbody>
	GUI.pays.forEach(function(p) {
		$('<tr>').append($('<td>').text(GUI.langue==='en' ? p.name : p.translations[GUI.langue]))
					.append($('<td>').text(p.capital))
					.append($('<td>').text(p.region))
					.append($('<td>').text(p.population))
					.append($('<td>').text(p.area))
					.css('cursor', 'pointer')
					.click( () => { GUI.onClickPays(p) ; } )
					.appendTo(tbody);
	});
}

// permet d'afficher un message dans la <table> en cas d'erreur
GUI.afficherErreur = function(jqXHR) {
	let msg = "Une erreur non-gérée s'est produite";
	if (jqXHR.status === 404) {
		msg = 'Aucun résultat !'
	}
	
	let tbody = $("#table_pays > tbody");
	tbody.empty();
	$('<tr>').append( $('<td>').attr('colspan', 5).text(msg) )
				.appendTo(tbody);
}

// fonction qui se déclenche quand on clique sur une ligne de la liste des pays
GUI.onClickPays = function(pays) {
	$(".ifListe").hide();	// on masque la liste
	$(".ifVoisins").show(); // on montre la div contenant les voisins d'un pays
	
	$("#spanPays").text(pays.name); // on met à jour le titre à afficher
	
	let tbody = $('#table_voisins > tbody');
	tbody.empty();
	
	// met un message 'Chargement' le temps que le traitement des voisins s'effectue
	$('<tr>').append( $('<td>').attr('colspan', 6).text('Chargement...') )
					.appendTo(tbody);
	
	// on construit le filtre qui permettra d'obtenir les détails des pays voisins (le filtre est une liste de code sur 3 lettres séparés par des ';' ex : FRA;COL			
	let filtre = '';
	if (pays.borders.length > 0) {
		pays.borders.forEach(function(code) {
			filtre += code + ';'
		});
	}
	
	if (filtre !== '') {
		API.chargerListeByCode(filtre, GUI.afficherVoisin);
	} else {
		GUI.afficherVoisin([])
	}
}

/*
 * se charge d'appeler d'afficher la liste des pays voisins
 */
GUI.afficherVoisin = function(voisins) {
	let tbody = $('#table_voisins > tbody');
	tbody.empty();
	
	if (voisins.length == 0) {
		$('<tr>').append( $('<td>').attr('colspan', 6).text('Aucun voisin !') )
					.appendTo(tbody);
	} else {
		for (let p of voisins) {
			let img = $('<img>').attr('src', p.flag)
								.css('height', '20px'); 
			
			$('<tr>').append(img)
				.append($('<td>').text(GUI.langue==='en' ? p.name : p.translations[GUI.langue]))
				.append($('<td>').text(p.capital))
				.append($('<td>').text(p.region))
				.append($('<td>').text(p.population))
				.append($('<td>').text(p.area))
				.appendTo(tbody);
		}
	}
};
