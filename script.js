// lokacija (lng + lat)
let pos;
// mapa (google.maps.Map objekat)
let map;
// boundary
let bounds;
// window sa informacijama
let infoWindow;
let currentInfoWindow;
let service;
let infoPane;
// Kriterijum pretrage mesta
let criteria;

function initMap() {
    bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow;
    currentInfoWindow = infoWindow;
    infoPane = document.getElementById('panel');
    const value = document.getElementById("criteria").value;
    criteria = value;

    // HTML5 geolocation
    if (navigator.geolocation) {
        // Uzmi trenutnu lokaciju (lat + lng)
        navigator.geolocation.getCurrentPosition(position => {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // Kreiraj mapu
            map = new google.maps.Map(document.getElementById('map-container'), {
                center: pos,
                zoom: 15
            });
            bounds.extend(pos);

            // Postavi info window na sredinu (tacno na lokaciju)
            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            infoWindow.open(map);
            map.setCenter(pos);

            getNearbyPlaces(pos, value);
        }, () => {
            // Browser podrzava geolokaciju ali je korisnik onemogucio pristup
            initDefaultMap(true);
        });
    } else {
        initDefaultMap(false);
    }
}

function initDefaultMap(browserHasGeolocation) {
    // Default lokacija ako korisnik nije dozvolio pristup lokaciji
    // = Beograd
    pos = { 
        lat: 44.787197, 
        lng: 20.457273
    };
    const map_container = document.getElementById("map-container");
    map = new google.maps.Map(map_container, {
        center: pos,
        zoom: 15
    })

    getNearbyPlaces(pos, criteria);

    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
    'Geolocation permissions denied. Using default location.' :
    'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
    currentInfoWindow = infoWindow;
}

function getNearbyPlaces(position, criteria) {
    const request = {
        location: position,
        rankBy: google.maps.places.RankBy.DISTANCE,
        keyword: criteria
    };
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, nearbyCallback);
}

function nearbyCallback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        createMarkers(results);
    }
}

function createMarkers(places) {
    places.forEach(place => {
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
        });

        google.maps.event.addListener(marker, 'click', () => {
            const request = {
                placeId: place.place_id,
                fields: ['name', 'formatted_address', 'geometry', 'rating','website', 'photos']
            }

            service.getDetails(request, (placeResult, status) => {
                showDetails(placeResult, marker, status);
            });
        });

        bounds.extend(place.geometry.location);
    });

    map.fitBounds(bounds);
}   

function showDetails(placeResult, marker, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        const placeInfowindow = new google.maps.InfoWindow();
        placeInfowindow.setContent('<div><strong>' + placeResult.name + '</strong><br>' + 'Rating: ' + placeResult.rating + '</div>');
        placeInfowindow.open(marker.map, marker);
        currentInfoWindow.close();
        currentInfoWindow = placeInfowindow;
        showPanel(placeResult);
    } else {
        console.log('showDetails failed: ' + status);
    }
}

function showPanel(placeResult) {
    // Ako je panel vec otvoren, zatvoriti ga prvo
    if (infoPane.classList.contains("open")) {
        infoPane.classList.remove("open");
    }

    // Brisanje detalja o prethodnom mestu
    while (infoPane.lastChild) {
        infoPane.removeChild(infoPane.lastChild);
    }

    // Dodavanje slike mesta na vrhu (ako postoji slika)
    if (placeResult.photos != null) {
        let firstPhoto = placeResult.photos[0];
        let photo = document.createElement('img');
        photo.classList.add('hero');
        photo.src = firstPhoto.getUrl();
        infoPane.appendChild(photo);
    }

    // Dodavanje naziva mesta kao h1 elementa (sa klasom 'place')
    let name = document.createElement('h1');
    name.classList.add('place');
    name.textContent = placeResult.name;
    infoPane.appendChild(name);

    // Dodavanje rating-a mesta kao p elementa (sa klasom 'details')
    if (placeResult.rating != null) {
        let rating = document.createElement('p');
        rating.classList.add('details');
        rating.textContent = `Rating: ${placeResult.rating} \u272e`;
        infoPane.appendChild(rating);
    }

    // Dodavanje adrese mesta kao p elementa (sa klasom 'details')
    let address = document.createElement('p');
    address.classList.add('details');
    address.textContent = placeResult.formatted_address;
    infoPane.appendChild(address);

    if (placeResult.website) {
        let websitePara = document.createElement('p');
        let websiteLink = document.createElement('a');
        let websiteUrl = document.createTextNode(placeResult.website);
        websiteLink.appendChild(websiteUrl);
        websiteLink.title = placeResult.website;
        websiteLink.href = placeResult.website;
        websitePara.appendChild(websiteLink);
        infoPane.appendChild(websitePara);
    }

    const closeButton = document.createElement('button');
    closeButton.innerHTML = "Close";
    closeButton.classList.add('panel-button');
    closeButton.addEventListener('click', () => {
        if (infoPane.classList.contains("open")) {
            console.log("removing open class from infoPane");
            infoPane.classList.remove("open");
        }
    })
    infoPane.appendChild(closeButton);


    // Otvaranje (dodavanjem klase 'open' koja postavlja width na 250px)
    infoPane.classList.add("open");
}