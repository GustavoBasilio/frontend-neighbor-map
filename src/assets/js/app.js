//Global variables
var map,
    places,
    infoWindow;

//Location Class
function Location(lat, lng) {
    this.position = {lat: lat, lng: lng};
}

//Create the html for the infobox
function createInfobox(title,subtitle,image) {
    var dom = document.createElement('div'),
        titleDom = document.createElement('h2'),
        subtitleDom = document.createElement('h3'),
        imageDom = document.createElement('img');
    imageDom.src = image;
    titleDom.innerHTML = title;
    subtitleDom.innerHTML = subtitle;
    dom.classList = "info-window";
    dom.appendChild(titleDom);
    dom.appendChild(subtitleDom);
    dom.appendChild(imageDom);
    return dom.outerHTML;
}

function MapViewModel() {
    var self = this;
    //View variables
    self.markers = [];
    self.resultsList = ko.observableArray(self.markers);
    self.query = ko.observable();
    self.menuStatus = ko.observable(false);
    self.menuCompute = ko.computed(function() {
        return self.menuStatus() ? "menu-open" : "";
    })
    //Filter the comments
    self.resultsListFilter = ko.computed(function () {
        var filter = self.query(),
            arr = [];
        if (filter) {
            ko.utils.arrayForEach(self.resultsList(), function (item) {
                if (item.name.toLowerCase().indexOf(filter) >= 0) {
                    item.marker.setVisible(true);
                    item.marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){ item.marker.setAnimation(null); }, 750);
                    arr.push(item);
                } else {
                    item.marker.setVisible(false);
                }
            });
        } else {
            arr = self.resultsList();
        }
        return arr;
    });

    //Get user location
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            self.center = position;
        });
        if(!self.center)
            self.center = new Location(-23.5489, -46.6388);
    } else
        self.center = new Location(-23.5489, -46.6388);

    //Map options
    var myStyle = [
        {
            elementType: 'geometry', stylers: [{color: '#cccccc'}]
        },
        {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#555555'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#555555'}]
            },
        {
            featureType: "administrative",
            elementType: "labels",
            stylers: [
            { visibility: "off" }
            ]
        },{
            featureType: "poi",
            elementType: "labels",
            stylers: [
            { visibility: "off" }
            ]
        },{
            featureType: "water",
            elementType: "labels",
            stylers: [
            { visibility: "off" }
            ]
        }
     ];
    var mapOptions = {
        zoom: 16,
        center: self.center.position
    };

   
   //Initiate the map object
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    map.set('styles', myStyle);
    places = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow({
		maxWidth: 240
	});

    //Create the user position marker 
    self.marker = new google.maps.Marker({
            position: self.center.position,
            map: map,
            animation: google.maps.Animation.DROP,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        });

    //Toggle the menu
    self.menuToggle = function() {
        var status = self.menuStatus();
        self.menuStatus(!status);
    };

    //Get nearby locations
    self.getLocations = function(position) {
        places.nearbySearch({
            location: position.position,
            radius: 500
        },function(response,status) {
            self.markers = [];
            response.map(function(place) {
                var position = place.geometry.location.lat()+','+place.geometry.location.lng();
                self.markers.push({
                    marker: new google.maps.Marker({
                        position: new Location(place.geometry.location.lat(),place.geometry.location.lng()).position,
                        map: map,
                        title: place.name,
                        animation: google.maps.Animation.DROP,
                        icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                    }),
                    position: position,
                    name: place.name,
                    address: place.vicinity,
                    status: 1
                });
            });
            self.markers.forEach(function(marker){
                marker.marker.addListener('click', function() {
                    self.onpenInfoWIndow(marker);
                });
            });
            self.resultsList(self.markers);
        });
    };
    self.getLocations(self.center);
    //Open infowindow
    self.onpenInfoWIndow = function(marker) {
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/search",
            method: "get",
            dataType: "jsonp",
            data: {
                "client_id": "1JXUG0BCBAIWUM0WDDAVQT3CY0PVH4FSXRC0LJL5OVKOIZZ2",
                "client_secret": "5B4NN4OWKVET0Y0EJWEWKLWRPZISLSQKJZXXHCYOKQNTP442",
                "limit": 1,
                "query": marker.name,
                "ll": marker.position,
                "v": '20170704',
                "m":'foursquare'
            }
        }).done(function(data) {
            $.ajax({
                url: "https://api.foursquare.com/v2/venues/"+data.response.venues[0].id+"/photos",
                method: "get",
                dataType: "jsonp",
                data: {
                    "client_id": "1JXUG0BCBAIWUM0WDDAVQT3CY0PVH4FSXRC0LJL5OVKOIZZ2",
                    "client_secret": "5B4NN4OWKVET0Y0EJWEWKLWRPZISLSQKJZXXHCYOKQNTP442",
                    "VENUE_ID": data.response.venues[0].id,
                    "limit": 1,
                    "v": '20170704',
                    "m":'foursquare'
                }
            }).done(function(photos) {
                var photo = photos.response.photos.items[0];
                var image = photo.prefix+'200x80'+photo.suffix;
                marker.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.marker.setAnimation(null); }, 750);
                infoWindow.setContent(createInfobox(marker.name, marker.address, image));
                infoWindow.open(map, marker.marker);
            });
        });
    };
}

//Google maps callback
function initMap() {
    if ( typeof google != 'object' || typeof google.maps != 'object') {
		$('#error-message').html('<h2>ERROR: could not load Google Maps API.</h2><h5>Do you have an Internet connection?</h5>');
        $('#error-message').fadeIn();
		$('#map-container').hide();
	}
    ko.applyBindings(new MapViewModel());   
}

function asyncLoadError(package) {
		$('#error-message').html('<h2>ERROR: could not load '+package+'.</h2>');
        $('#error-message').show();
		$('#map').hide();
}