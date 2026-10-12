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


  L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors | <a href="//openstreetmap.fr">OSM FR</a>'
  }).addTo(map);

  $.getJSON("//api.openwindmap.org/v1/live/all", function(stations) {
    var now, timeout;
    now = (new Date).getTime();
    timeout = 45;
    return stations.data.forEach(function(s) {
      var delay, title;
      delay = Math.round((now - new Date(s.measurements.date).getTime()) / 60000);
      if (delay > timeout) {
        return;
      }
      if (s.location.date === null) {
        return;
      }

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
 
      title = s.id + '\n';
      title += s.meta.name + '\n';
      title += 'delay + ' minute(s) ago\n';
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
    return $('.map-message.alert-info').hide();
  }).fail(function() {
    return $('.map-message.alert-danger').show();
  });

}).call(this);

