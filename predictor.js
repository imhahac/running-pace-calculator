/*
*	Constructeur d'un objet Predictor
*	km : kilomètres (number)
*	m : mètres (number)
*	hh : heures (number)
*	mn : minutes (number)
*	ss : secondes (number)
*/
function Predictor(km, m, hh, mn, ss) {
	// Propriétés
	this.km = parseInt(km);
	this.metres = parseInt(m);
	this.heures = parseInt(hh);
	this.minutes = parseInt(mn);
	this.secondes = parseInt(ss);
	this.distance = (this.km * 1000) + this.metres;
	this.duree = (this.heures * 3600) + (this.minutes * 60) + this.secondes;
	// Méthodes
	this.allure = function() {
		// Secondes pour parcourir 1 km
		var ss1km = this.duree * 1000 / this.distance;
		var mn = parseInt(ss1km / 60);
		var ss = parseInt(ss1km % 60).toString().replace(/^(\d)$/,'0$1');
		return ''.concat(mn, '\'', ss, '"');
	}
	this.vitesse = function() {
		// Formule : mètres par heure en sortie
		var formule = this.distance * 3600 / this.duree;
		// Conversion en km/h, format avec 2 décimales
		return (formule / 1000).toFixed(2);
	}
	this.printDist = function() {
		var km = (this.km > 0) ? ''.concat(this.km, ' km ') : '';
		var m = (this.metres > 0 && this.km == 0)
			? ''.concat(this.metres, ' m')
			: (this.metres > 0)
				? this.metres
				: '';
		return ''.concat(km, m);
	}
}
// Prototypage d'un objet de type String
String.prototype.temps = function () {
	var hh = Math.floor(this / 3600);
	var mn = Math.floor((this - (hh * 3600)) / 60);
	var ss = Math.floor(this - (hh * 3600) - (mn * 60));

	if (mn < 10) { mn = ''.concat('0', mn); }
	if (ss < 10) { ss = ''.concat('0', ss); }

	hh = (hh == 0) ? '' : ''.concat(hh, 'h');
	mn = (hh == 0 && mn == '00') ? '' : ''.concat(mn, '\'');
	ss = ''.concat(ss, '\"');

	return ''.concat(hh, mn, ss);
}
/*
*	Affichage de l'allure, de la vitesse et des temps de passage
*/
function pace() {
	// Récupérations des valeurs
	var km = (document.getElementById('km').value > 0) ? document.getElementById('km').value : 0;
	var m = (document.getElementById('m').value) ? document.getElementById('m').value : 0;
	var hh = (document.getElementById('h').value > 0) ? document.getElementById('h').value : 0;
	var mn = (document.getElementById('mn').value > 0) ? document.getElementById('mn').value : 0;
	var ss = (document.getElementById('s').value > 0) ? document.getElementById('s').value : 0;
	// Nouvel objet Predictor
	var predictor = new Predictor(km, m, hh, mn, ss);
	// Lorsque la distance et la durée sont tous deux supérieurs à 0
	if (predictor.distance > 0 && predictor.duree > 0) {
		// Affichage de la vitesse et de l'allure dans la zone "Calculateur d'allure"
		$('#vitesse').text(predictor.vitesse().concat(' km/h'));
		$('#allure').text(predictor.allure().concat(' / km'));
		/*
		*	Création du tableau de données
		*/
		// Élément racine table
		var table = document.createElement('table');
		table.setAttribute('class', 'table table-sm table-bordered table-striped table-hover col');
		// Élément head
		var thead = document.createElement('thead');
		thead.setAttribute('class', 'table-dark');
		// 1e ligne d'en-tête
		var tr = document.createElement('tr');
		var thKm = document.createElement('th');
		var txtKm = document.createTextNode('Km');
		thKm.setAttribute('class', 'text-center');
		thKm.setAttribute('scope', 'col');
		thKm.append(txtKm);
		var thTps = document.createElement('th');
		var txtTps = document.createTextNode('Temps de passage');
		thTps.setAttribute('class', 'text-center');
		thTps.setAttribute('scope', 'col');
		thTps.append(txtTps);
		// Assemblage de l'en-tête
		tr.append(thKm);
		tr.append(thTps);
		thead.append(tr);
		table.append(thead);
		// Corps du tableau
		var tbody = document.createElement('tbody');
		var i = 1;
		while (i <= predictor.km + 1) {
			if (i == predictor.km + 1) {
				var txtKm = document.createTextNode(predictor.printDist());
				var txtTps = document.createTextNode(predictor.duree.toString().temps());
			} else {
				var temps = ((i * 3600) / predictor.vitesse());
				var txtKm = document.createTextNode('km ' + i);
				var txtTps = document.createTextNode(temps.toString().temps());
			}
			var tr = document.createElement('tr');
			var tdKm = document.createElement('td');
			tdKm.setAttribute('class', 'text-center');
			tdKm.append(txtKm);
			var tdTps = document.createElement('td');
			tdTps.setAttribute('class', 'text-center');
			tdTps.append(txtTps);
			if (i * 1000 != predictor.distance) {
				tr.append(tdKm);
				tr.append(tdTps);
			}
			tbody.append(tr);
			i++;
		}
		table.append(tbody);
		$('#splits').html(table);
	}
}
/*
*	Procédure principale
*/
/*
*	Remplissage automatique de la distance
*	et calcul de l'allure
*/
$('#300m').click(function() {
	$('#km').val(null);
	$('#m').val(300);
	pace();
});
$('#400m').click(function() {
	$('#km').val(null);
	$('#m').val(400);
	pace();
});
$('#800m').click(function() {
	$('#km').val(null);
	$('#m').val(800);
	pace();
});
$('#10km').click(function() {
	$('#km').val(10);
	$('#m').val(null);
	pace();
});
$('#20km').click(function() {
	$('#km').val(20);
	$('#m').val(null);
	pace();
});
$('#semi').click(function() {
	$('#km').val(21);
	$('#m').val(095);
	pace();
});
$('#marathon').click(function() {
	$('#km').val(42);
	$('#m').val(195);
	pace();
});
$('#50km').click(function() {
	$('#km').val(50);
	$('#m').val(null);
	pace();
});
$('#100km').click(function() {
	$('#km').val(100);
	$('#m').val(null);
	pace();
});

// Déclenchement de la fonction pace au clic ou au relâchement d'une touche du clavier
$('input').click(pace).keyup(pace);
