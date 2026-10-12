(function() {
  var map, resize, savePosition;

  resize = function() {
    var newHeight;
    newHeight = $(window).height() - $('nav').height();
    return $('#map').height(newHeight);
  };

  resize();

  $(window).resize(resize);
  setTimeout(function(){document.location.reload();}, 60*1000);

  map = L.map('map')

  savePosition = function () {
    try {
      localStorage.setItem('map-lat', map.getCenter().lat);
      localStorage.setItem('map-lon', map.getCenter().lng);
      localStorage.setItem('map-zoom', map.getZoom());
    } catch (e) {
      console.error(e);
    }
  }

  map.on('moveend', savePosition);
  map.on('zoomend', savePosition);

  var latlon = [46, 2];
  var zoom = 7;
  var unit = 'kmh';

  try {
    console.log(Number.isFinite(localStorage.getItem('map-lat')))
    if (
      Number.isFinite(parseFloat(localStorage.getItem('map-lat'))) &&
      Number.isFinite(parseFloat(localStorage.getItem('map-lon'))) &&
      Number.isFinite(parseInt(localStorage.getItem('map-zoom')))
    ) {
      latlon = [localStorage.getItem('map-lat'), localStorage.getItem('map-lon')];
      zoom = localStorage.getItem('map-zoom');
      console.log('read last position from localStorage');
    }
    unit = localStorage.getItem('unit') || 'kmh';
    console.log(unit)
  } catch (e) {
    console.error(e);
  }

  map.setView(latlon, zoom);


  var offlineIcon = L.icon({
    iconUrl: '/img/circle.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
  var expiryIcon = L.icon({
    iconUrl: '/img/circle3.png',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
  
  // test damien ralentissement voir pas d'affichage de certaines tuiles avec .base-layers.meteo-parapente.com
  const urlParams = new URLSearchParams(window.location.search);
  //console.log(urlParams);
  
  if (urlParams.get('map')=='mp') {
  L.tileLayer('https://{s}.base-layers.meteo-parapente.com/osm-shaded/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors | <a href="https://meteo-parapente.com">Meteo-Parapente.com</a>'
  }).addTo(map);
  } else if (urlParams.get('map')=='osm') {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  }
  else{
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  }
  var count1 = 0;
  var count2 = 0;
  var count3 = 0;

  $.getJSON("//api.pioupiou.fr/v1/live/all", function(stations) {
    var now, timeout;
    now = (new Date).getTime();
    timeout = 45;
    return stations.data.forEach(function(s) {
      count1++;
      //if (count1==1) console.log(s);
      if (document.location.hash === '#windbird' && s.id < 1300) return
      count2++;
      var delay, title;
      var showOffline = true;
      if (s.location.date === null) {
        return;
      }
      delay = Math.round((now - new Date(s.measurements.date).getTime()) / 60000);
      if (delay > timeout) {
        if (showOffline) {
          return L.marker([s.location.latitude, s.location.longitude], {
            icon: offlineIcon,
            title: `${s.meta.name} (${s.id})\nHors ligne !`
            //title: `${s.meta.name} (${s.id})\nHors ligne...`
          }).on('contextmenu', function() {
            return window.open('./' + s.id);
          }).on('click', function() {
            return document.location = './' + s.id;
          }).addTo(map);
        }
        return;
      }
      // 2026-01-19 : ajout damien rond orangé si abo expiré pour ne pas montrer nord 0km/h
      if (s.measurements.wind_heading === null) {
        return L.marker([s.location.latitude, s.location.longitude], {
          icon: expiryIcon,
          title: `${s.meta.name} (${s.id})\nAbonnement Expiré !`
        }).on('contextmenu', function() {
          return window.open('./' + s.id);
        }).on('click', function() {
          return document.location = './' + s.id;
        }).addTo(map);
      }
      // fin ajout

      count3++;

      function speedToText(speed) {
        if (unit == 'noeuds') {
          speed = Math.round(speed/1.852*10) / 10;
          return speed + ' kn';
        } else if (unit == 'ms') {
          speed = Math.round(speed/3.6*10) / 10;
          return speed + ' m/s';
        } else {
          // km/h
          return speed + ' km/h';
        }
      }
 
      title = s.meta.name + ' [' + s.id +  ']\n';
      title += delay + 'm ago\n';
      title += 'min ' + speedToText(s.measurements.wind_speed_min) + '\n';
      title += 'AVG ' + speedToText(s.measurements.wind_speed_avg) + '\n';
      title += 'max ' + speedToText(s.measurements.wind_speed_max) + '\n';
      return L.windMarker([s.location.latitude, s.location.longitude], {
        heading: s.measurements.wind_heading,
        speed: s.measurements.wind_speed_max,
        title: title
      }).on('contextmenu', function() {
        return window.open('./' + s.id);
      }).on('click', function() {
        return document.location = './' + s.id;
      }).addTo(map);
    });

  }).always(function() {
    console.log('count', count1, count2, count3)
    return $('.map-message.alert-info').hide();
  }).fail(function() {
    return $('.map-message.alert-danger').show();
  });

}).call(this);



function searchByNumber () {
  var number = prompt("Enter the number of the station\nEntrez le numéro de la station");
  number = parseInt(number.replace(/[a-zA-Z]+/, ''), 10);
  if (isNaN(number)) return alert("Bad number\nMauvais numéro");
  if (number >= 1300) {
    document.location = '/windbird-' + number;
  } else if (number >= 1200) {
    document.location = '/owm-' + number;
  } else if (number >= 1000) {
    document.location = '/pioupiou-' + number;
  } else if (number >= 900) {
    document.location = '/owm-' + number;
  } else if (number >= 800) {
    document.location = '/owm-' + number;
  } else {
    document.location = '/pioupiou-' + number;
  }
}
