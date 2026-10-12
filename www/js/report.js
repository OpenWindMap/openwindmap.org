(function() {
  var Chart, Color, Cookie, Error, Id, Live, Loading, Location, Meta, Signal, State, Tools, Unit;

  Tools = {
    addZero: function(i) {
      if (i < 10) {
        return '0' + i;
      } else {
        return i;
      }
    }
  };

  Cookie = {
    _prefix: "pioupiou_",
    write: function(name, value, days) {
      var date, expires;
      name = this._prefix + name;
      expires = '';
      if (days) {
        date = new Date;
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toGMTString();
      }
      return document.cookie = name + '=' + value + expires + '; path=/';
    },
    read: function(name) {
      var c, ca, i, nameEQ;
      name = this._prefix + name;
      nameEQ = name + '=';
      ca = document.cookie.split(';');
      i = 0;
      while (i < ca.length) {
        c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return c.substring(nameEQ.length, c.length);
        }
        i++;
      }
    }
  };

  Unit = {
    _currentUnit: "kmh",
    _subscribers: {},
    _notify: function() {
      var callback, id, ref, results;
      ref = this._subscribers;
      results = [];
      for (id in ref) {
        callback = ref[id];
        results.push(callback());
      }
      return results;
    },
    draw: function() {
      return $(".unit").text(Lang.units[this._currentUnit]);
    },
    set: function(newUnit) {
      this._currentUnit = newUnit;
      return this._notify();
    },
    get: function() {
      return this._currentUnit;
    },
    "switch": function() {
      if (this._currentUnit === "kmh") {
        this.set("knots");
      } else if (this._currentUnit === "knots") {
        this.set("ms");
      } else {
        this.set("kmh");
      }
      this.draw();
      return this.save();
    },
    init: function() {
      var cookieUnit;
      cookieUnit = Cookie.read("unit");
      if (cookieUnit === "kmh" || cookieUnit === "knots" || cookieUnit === "ms") {
        this.set(cookieUnit);
      }
      this.draw();
      this.save();
      return $(".unit").click(function() {
        return Unit["switch"]();
      });
    },
    save: function() {
      return Cookie.write("unit", this._currentUnit, 120);
    },
    convert: function(value) {
      if (this._currentUnit === "kmh") {
        return Math.round(value);
      } else if (this._currentUnit === "knots") {
        return Math.round(value * 0.54);
      } else {
        return Math.round(value / 3.6);
      }
    },
    subscribe: function(id, callback) {
      return this._subscribers[id] = callback;
    }
  };

  Color = {
    _palette: ["rgba(255,255,255,255)", "rgba(0,255,255,255)", "rgba(3,230,175,255)", "rgba(5,204,95,255)", "rgba(8,179,15,255)", "rgba(88,204,10,255)", "rgba(168,228,5,255)", "rgba(248,253,0,255)", "rgba(255,228,0,255)", "rgba(255,198,0,255)", "rgba(255,168,0,255)", "rgba(255,115,0,255)", "rgba(255,60,0,255)", "rgba(255,5,0,255)", "rgba(204,0,41,255)", "rgba(148,0,87,255)"],
    get: function(speed) {
      var i;
      i = Math.floor(speed / 5);
      if (i > 15) {
        i = 15;
      }
      return this._palette[i];
    }
  };

  Signal = {
    _snr: null,
    set: function(status) {
      this._snr = status.snr;
      return this.draw();
    },
    draw: function() {
      var signal, signalClass;
      if (this._snr === null) {
        $('.status .signal').hide();
        return;
      }
      signal = Math.round(this._snr);
      signalClass = 'label-success';
      if (signal < 8) {
        signalClass = "label-danger";
      } else if (signal < 13) {
        signalClass = "label-warning";
      }
      $('.status .signal').removeClass('label-success label-danger label-warning').addClass(signalClass).show();
      return $('.status .signal .value').text(signal + "dB");
    }
  };

  State = {
    TIMEOUT: 25 * 60 * 1000,
    _date: null,
    _state: null,
    set: function(status) {
      this._date = status.date;
      this._state = status.state;
      return this.draw();
    },
    draw: function() {
      var dataIsFresh, hours, lastContact, lastContactText, minutes, now;
      if (this._date === null || this._state === null) {
        $('.state.label-success').hide();
        $('.state.label-danger').hide();
        return;
      }
      lastContact = new Date(this._date);
      now = new Date().getTime();
      hours = Tools.addZero(lastContact.getHours());
      minutes = Tools.addZero(lastContact.getMinutes());
      dataIsFresh = now - lastContact.getTime() < this.TIMEOUT;
      lastContactText = '';
      if (dataIsFresh) {
        lastContactText = hours + ':' + minutes;
      } else {
        lastContactText = lastContact.toLocaleDateString() + ' ' + hours + ':' + minutes;
      }
      if (dataIsFresh && this._state === 'on') {
        $('.state.label-success').show();
        $('.state.label-danger').hide();
      } else {
        $('.state.label-success').hide();
        $('.state.label-danger').show();
      }
      return $('.last-contact').text(lastContactText);
    }
  };

  Loading = {
    set: function() {
      return $('.report-message.alert-info').show();
    },
    clear: function() {
      return $('.report-message.alert-info').hide();
    }
  };

  Error = {
    set: function() {
      return $('.report-message.alert-danger').show();
    },
    clear: function() {
      return $('.report-message.alert-danger').hide();
    }
  };

  Id = {
    _id: null,
    init: function() {
      var result;
      result = /.*\/([0-9]+)$/.exec(location.pathname);
      this._id = 1;
      if ((result != null) && (result[1] != null)) {
        this._id = result[1];
      }
      return this.draw();
    },
    draw: function() {
      return $('.pioupiou-id').text(this._id);
    },
    get: function() {
      return this._id;
    }
  };

  Meta = {
    set: function(meta) {
      return this.draw(meta);
    },
    draw: function(meta) {
      var desc;
      $('.name').text(meta.name);
      if (meta.description === null) {
        desc = Lang.noDescription;
      } else {
        desc = meta.description;
      }
      return $('.description').text(desc);
    }
  };

  Location = {
    _latitude: null,
    _longitude: null,
    _map: false,
    _marker: null,
    set: function(location) {
      this._latitude = location.latitude;
      this._longitude = location.longitude;
      return this.draw();
    },
    drawLocationText: function(isUnknown) {
      var text;
      text = "";
      if (isUnknown) {
        text = Lang.unknownLocation;
      } else {
        text = this._latitude + ", " + this._longitude;
      }
      return $('.details .location').text(text);
    },
    drawLocationMap: function(isUnknown) {
      if (isUnknown) {
        $('#map').hide();
        return;
      }
      $('#map').show();
      if (!this._map) {
        this._map = L.map('map', {
          zoomControl: false
        }).setView([this._latitude, this._longitude], 12);
        L.tileLayer('//pioupiou.fr/tiles/{z}/{x}/{y}.png', {
          attribution: '<a href="http://osm.org/copyright">OSM</a>'
        }).addTo(this._map);
        return this._marker = L.windMarker([this._latitude, this._longitude], {
          heading: 0,
          speed: 0
        }).addTo(this._map);
      } else {
        this._marker.setLatLng([this._latitude, this._longitude]);
        return this._map.panTo([this._latitude, this._longitude]);
      }
    },
    draw: function() {
      var isUnknown;
      isUnknown = this._latitude === null || this._longitude === null;
      this.drawLocationText(isUnknown);
      return this.drawLocationMap(isUnknown);
    }
  };

  Live = {
    HEADING: [Lang.north, Lang.north + Lang.north + Lang.east, Lang.north + Lang.east, Lang.east + Lang.north + Lang.east, Lang.east, Lang.east + Lang.south + Lang.east, Lang.south + Lang.east, Lang.south + Lang.south + Lang.east, Lang.south, Lang.south + Lang.south + Lang.east, Lang.south + Lang.east, Lang.west + Lang.south + Lang.west, Lang.west, Lang.west + Lang.north + Lang.west, Lang.north + Lang.west, Lang.north + Lang.north + Lang.west],
    _wind_speed_min: null,
    _wind_speed_avg: null,
    _wind_speed_max: null,
    _wind_heading: null,
    _date: null,
    _ui: {
      min: '.min',
      avg: '.avg',
      max: '.max',
      heading: {
        text: '.heading .text',
        degrees: '.heading .degrees'
      }
    },
    _getHeadingText: function() {
      if (this._wind_heading != null) {
        return this.HEADING[Math.floor((this._wind_heading / 360) * 16)];
      }
      return "--";
    },
    set: function(measurements) {
      this._wind_speed_min = measurements.wind_speed_min;
      this._wind_speed_avg = measurements.wind_speed_avg;
      this._wind_speed_max = measurements.wind_speed_max;
      this._wind_heading = measurements.wind_heading;
      this._date = measurements.date;
      return this.draw();
    },
    _drawLiveSpeed: function(uiParent) {
      $(this._ui.min, uiParent).text(Unit.convert(this._wind_speed_min)).css("color", Color.get(this._wind_speed_min));
      $(this._ui.avg, uiParent).text(Unit.convert(this._wind_speed_avg)).css("color", Color.get(this._wind_speed_avg));
      $(this._ui.max, uiParent).text(Unit.convert(this._wind_speed_max)).css("color", Color.get(this._wind_speed_max));
      return Unit.subscribe('live-wind', (function(_this) {
        return function() {
          return _this.draw();
        };
      })(this));
    },
    _drawLiveHeading: function(uiParent) {
      $(this._ui.heading.text, uiParent).text(this._getHeadingText());
      return $(this._ui.heading.degrees, uiParent).text(this._wind_heading + "°");
    },
    draw: function() {
      this._drawLiveSpeed('.live');
      return this._drawLiveHeading('.live');
    }
  };

  Chart = {
    _period: 6 * 3600 * 1000,
    _data: [],
    _dataMaxSpeed: null,
    _mCanvas: null,
    _oCanvas: null,
    _mCtx: null,
    _oCtx: null,
    _w: null,
    _h: null,
    _startTime: null,
    _stopTime: null,
    _speedToPixel: null,
    _timeToPixels: null,
    _maxSpeed: 70,
    _pxRatio: window.devicePixelRatio || 1,
    _marginBottom: null,
    _mouseover: false,
    init: function(data) {
      var start;
      this._mCanvas = $(".chart .main")[0];
      this._oCanvas = $(".chart .overlay")[0];
      this._mCtx = this._mCanvas.getContext("2d");
      this._oCtx = this._oCanvas.getContext("2d");
      this._marginBottom = 30 * this._pxRatio;
      start = new Date(new Date().getTime() - this._period).toISOString();
      return $.getJSON('//api.openwindmap.org/v1/archive/' + Id.get() + '?start=' + start + '&stop=now', function(s) {
        Chart.set(s.data);
        setInterval(function() {
          if (!Chart._mouseover) {
            return Chart.draw();
          }
        }, 1000);
        window.onmouseup = function() {
          return Chart.clearOverlay();
        };
        $(".chart")[0].ontouchend = function() {
          return Chart.clearOverlay();
        };
        window.onmousemove = function(e) {
          if (Chart._mouseover) {
            return Chart.drawOverlay(e.pageX);
          }
        };
        $(".chart")[0].onmousedown = function(e) {
          return Chart.drawOverlay(e.pageX);
        };
        $(".chart")[0].ontouchstart = function(e) {
          return Chart.drawOverlay(e.touches[0].pageX);
        };
        $(".chart")[0].ontouchmove = function(e) {
          var x;
          x = e.touches[0].pageX;
          Chart.drawOverlay(x);
          console.log(Math.abs(Chart._touchstart - x) * Chart._pxRatio);
          if (Chart._noScroll || Math.abs(Chart._touchstart - x) * Chart._pxRatio > 30) {
            Chart._noScroll = true;
            return e.preventDefault();
          }
        };
        return $(".chart").resize(function() {
          Chart.clearOverlay();
          return Chart.draw();
        });
      });
    },
    _computeGeometry: function() {
      var maxSpeed;
      maxSpeed = this._maxSpeed;
      if (this._dataMaxSpeed > this._maxSpeed) {
        maxSpeed = this._dataMaxSpeed;
      }
      this._w = this._mCanvas.width = this._oCanvas.width = this._mCanvas.clientWidth * this._pxRatio;
      this._h = this._mCanvas.height = this._oCanvas.height = this._mCanvas.clientHeight * this._pxRatio;
      this._stopTime = new Date().getTime();
      this._startTime = this._stopTime - this._period;
      this._speedToPixels = (this._h - this._marginBottom) / maxSpeed;
      return this._timeToPixels = this._w / this._period;
    },
    _time2x: function(time) {
      return (time.getTime() - this._startTime) * this._timeToPixels;
    },
    _x2time: function(x) {
      return x / this._timeToPixels + this._startTime;
    },
    _speed2y: function(speed) {
      return this._h - this._marginBottom - speed * this._speedToPixels;
    },
    drawOverlay: function(mouseX) {
      var i, j, p, pa, pai, pb, pbi, ref, time, x;
      if (!this._mouseover) {
        this._mouseover = true;
        this._touchstart = mouseX;
      }
      time = this._x2time(mouseX * this._pxRatio);
      pbi = 0;
      pai = 0;
      for (i = j = 0, ref = this._data.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        if (this._data[i].date > time) {
          pai = i;
          break;
        }
        pbi = i;
      }
      pb = this._data[pbi];
      pa = this._data[pai];
      if (Math.abs(this._data[pbi] - time) < Math.abs(this._data[pai] - time)) {
        p = pb;
      } else {
        p = pa;
      }
      x = this._time2x(p.date);
      this._oCtx.clearRect(0, 0, this._w, this._h);
      this._oCtx.lineWidth = 2 * this._pxRatio;
      this._oCtx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this._oCtx.beginPath();
      this._oCtx.moveTo(x, 0);
      this._oCtx.lineTo(x, this._h - this._marginBottom);
      this._oCtx.stroke();
      this._oCtx.beginPath();
      this._oCtx.arc(this._time2x(p.date), this._speed2y(p.avg), 4 * this._pxRatio, 0, 2 * Math.PI, false);
      this._oCtx.fillStyle = "rgba(255, 255, 255, 0.5)";
      return this._oCtx.fill();
    },
    clearOverlay: function() {
      this._mouseover = false;
      this._touchstart = null;
      this._noScroll = false;
      return this._oCtx.clearRect(0, 0, this._w, this._h);
    },
    _drawPoints: function() {
      var d, d0, d1, i, j, k, l, lastX, len, m, ref, ref1, ref2, ref3, results, start, x, y;
      this._mCtx.clearRect(0, 0, this._w, this._h);
      this._mCtx.fillStyle = "rgba(66, 139, 202, 0.5)";
      this._mCtx.beginPath();
      start = true;
      ref = this._data;
      for (j = 0, len = ref.length; j < len; j++) {
        d = ref[j];
        if (start) {
          this._mCtx.moveTo(this._time2x(d.date), this._speed2y(d.max));
          start = false;
        } else {
          this._mCtx.lineTo(this._time2x(d.date), this._speed2y(d.max));
        }
      }
      for (i = k = ref1 = this._data.length - 1; k >= 0; i = k += -1) {
        d = this._data[i];
        this._mCtx.lineTo(this._time2x(d.date), this._speed2y(d.min));
      }
      this._mCtx.fill();
      for (i = l = 1, ref2 = this._data.length; 1 <= ref2 ? l < ref2 : l > ref2; i = 1 <= ref2 ? ++l : --l) {
        d0 = this._data[i - 1];
        d1 = this._data[i];
        this._mCtx.lineWidth = 2 * this._pxRatio;
        this._mCtx.beginPath();
        this._mCtx.strokeStyle = Color.get((d0.avg + d1.avg) / 2);
        this._mCtx.moveTo(this._time2x(d0.date), this._speed2y(d0.avg));
        this._mCtx.lineTo(this._time2x(d1.date), this._speed2y(d1.avg));
        this._mCtx.stroke();
      }
      y = this._h - 10 * this._pxRatio;
      lastX = this._w + 10 * this._pxRatio;
      results = [];
      for (i = m = ref3 = this._data.length - 1; m >= 0; i = m += -1) {
        d = this._data[i];
        x = this._time2x(d.date);
        if (lastX - x >= 30 * this._pxRatio) {
          lastX = x;
          results.push(this._drawArrow(this._mCtx, x, this._h - 10 * this._pxRatio, d.heading, Color.get(d.avg)));
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    _drawArrow: function(ctx, x, y, heading, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((heading + 180) / 180 * Math.PI);
      ctx.beginPath();
      ctx.moveTo(0 * this._pxRatio, -9 * this._pxRatio);
      ctx.lineTo(5 * this._pxRatio, 9 * this._pxRatio);
      ctx.lineTo(0 * this._pxRatio, 5 * this._pxRatio);
      ctx.lineTo(-5 * this._pxRatio, 9 * this._pxRatio);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      return ctx.restore();
    },
    draw: function() {
      Chart._computeGeometry();
      return Chart._drawPoints();
    },
    set: function(data) {
      var d, j, k, len, len1, maxSpeed, ref;
      if ((data != null) && data.length) {
        for (j = 0, len = data.length; j < len; j++) {
          d = data[j];
          this._data.push({
            lat: d[1],
            lon: d[2],
            avg: d[4],
            min: d[3],
            max: d[5],
            heading: d[6],
            date: new Date(d[0])
          });
        }
        maxSpeed = -1;
        ref = this._data;
        for (k = 0, len1 = ref.length; k < len1; k++) {
          d = ref[k];
          if (d.max > maxSpeed) {
            maxSpeed = d.max;
          }
        }
        this._dataMaxSpeed = maxSpeed;
        return this.draw();
      }
    }
  };

  Unit.init();

  Id.init();

  Chart.init();

  Meta.set({
    name: "Pioupiou " + Id.get()
  });

  $.getJSON('//api.openwindmap.org/v1/live-with-meta/' + Id.get(), function(s) {
    Meta.set(s.data.meta);
    Signal.set(s.data.status);
    State.set(s.data.status);
    Location.set(s.data.location);
    return Live.set(s.data.measurements);
  }).always(function() {
    return Loading.clear();
  }).fail(function() {
    return Error.set();
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,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Q0FBQyxJQUFJLENBQUMsWUFBaEI7RUFMMkQsQ0FBN0QsQ0FNQSxDQUFDLE1BTkQsQ0FNUSxTQUFBO1dBQ04sT0FBTyxDQUFDLEtBQVIsQ0FBQTtFQURNLENBTlIsQ0FRQSxDQUFDLElBUkQsQ0FRTSxTQUFBO1dBQ0osS0FBSyxDQUFDLEdBQU4sQ0FBQTtFQURJLENBUk47QUF4ZUEiLCJmaWxlIjoicmVwb3J0LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiVG9vbHMgPVxuICBhZGRaZXJvOiAoaSkgLT5cbiAgICBpZiBpIDwgMTBcbiAgICAgICcwJyArIGlcbiAgICBlbHNlXG4gICAgICBpXG5cbkNvb2tpZSA9XG4gIF9wcmVmaXg6IFwicGlvdXBpb3VfXCJcbiAgd3JpdGU6IChuYW1lLCB2YWx1ZSwgZGF5cykgLT5cbiAgICBuYW1lICAgID0gQF9wcmVmaXggKyBuYW1lXG4gICAgZXhwaXJlcyA9ICcnXG4gICAgaWYgZGF5c1xuICAgICAgZGF0ZSA9IG5ldyBEYXRlXG4gICAgICBkYXRlLnNldFRpbWUgZGF0ZS5nZXRUaW1lKCkgKyBkYXlzICogMjQgKiA2MCAqIDYwICogMTAwMFxuICAgICAgZXhwaXJlcyA9ICc7IGV4cGlyZXM9JyArIGRhdGUudG9HTVRTdHJpbmcoKVxuICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyAnPScgKyB2YWx1ZSArIGV4cGlyZXMgKyAnOyBwYXRoPS8nXG4gIHJlYWQ6IChuYW1lKSAtPlxuICAgIG5hbWUgICA9IEBfcHJlZml4ICsgbmFtZVxuICAgIG5hbWVFUSA9IG5hbWUgKyAnPSdcbiAgICBjYSA9IGRvY3VtZW50LmNvb2tpZS5zcGxpdCgnOycpXG4gICAgaSA9IDBcbiAgICB3aGlsZSBpIDwgY2EubGVuZ3RoXG4gICAgICBjID0gY2FbaV1cbiAgICAgIHdoaWxlIGMuY2hhckF0KDApID09ICcgJ1xuICAgICAgICBjID0gYy5zdWJzdHJpbmcoMSwgYy5sZW5ndGgpXG4gICAgICBpZiBjLmluZGV4T2YobmFtZUVRKSA9PSAwXG4gICAgICAgIHJldHVybiBjLnN1YnN0cmluZyhuYW1lRVEubGVuZ3RoLCBjLmxlbmd0aClcbiAgICAgIGkrK1xuXG5Vbml0ID1cbiAgX2N1cnJlbnRVbml0OiBcImttaFwiXG4gIF9zdWJzY3JpYmVyczoge31cbiAgX25vdGlmeTogLT5cbiAgICBmb3IgaWQsIGNhbGxiYWNrIG9mIEBfc3Vic2NyaWJlcnNcbiAgICAgIGNhbGxiYWNrKClcbiAgZHJhdzogKCkgLT5cbiAgICAgICQoXCIudW5pdFwiKS50ZXh0KExhbmcudW5pdHNbQF9jdXJyZW50VW5pdF0pXG4gIHNldDogKG5ld1VuaXQpIC0+XG4gICAgQF9jdXJyZW50VW5pdCA9IG5ld1VuaXRcbiAgICBAX25vdGlmeSgpXG4gIGdldDogLT5cbiAgICBAX2N1cnJlbnRVbml0XG4gIHN3aXRjaDogKCkgLT5cbiAgICBpZiBAX2N1cnJlbnRVbml0ID09IFwia21oXCJcbiAgICAgIEBzZXQgXCJrbm90c1wiXG4gICAgZWxzZVxuICAgICAgQHNldCBcImttaFwiXG4gICAgQGRyYXcoKVxuICAgIEBzYXZlKClcbiAgaW5pdDogKCkgLT5cbiAgICBjb29raWVVbml0ID0gQ29va2llLnJlYWQgXCJ1bml0XCJcbiAgICBpZiBjb29raWVVbml0IGlzIFwia21oXCIgb3IgY29va2llVW5pdCBpcyBcImtub3RzXCJcbiAgICAgIEBzZXQgY29va2llVW5pdFxuICAgIEBkcmF3KClcbiAgICBAc2F2ZSgpXG4gICAgJChcIi51bml0XCIpLmNsaWNrICgpIC0+XG4gICAgICBVbml0LnN3aXRjaCgpXG4gIHNhdmU6ICgpIC0+XG4gICAgQ29va2llLndyaXRlIFwidW5pdFwiLCBAX2N1cnJlbnRVbml0LCAxMjBcbiAgY29udmVydDogKHZhbHVlKSAtPlxuICAgIGlmIEBfY3VycmVudFVuaXQgaXMgXCJrbWhcIlxuICAgICAgTWF0aC5yb3VuZCB2YWx1ZVxuICAgIGVsc2VcbiAgICAgIE1hdGgucm91bmQodmFsdWUgKiAwLjU0KVxuICBzdWJzY3JpYmU6IChpZCwgY2FsbGJhY2spIC0+XG4gICAgQF9zdWJzY3JpYmVyc1tpZF0gPSBjYWxsYmFja1xuXG5Db2xvciA9XG4gIF9wYWxldHRlOiBbXG4gICAgXCJyZ2JhKDI1NSwyNTUsMjU1LDI1NSlcIlxuICAgIFwicmdiYSgwLDI1NSwyNTUsMjU1KVwiXG4gICAgXCJyZ2JhKDMsMjMwLDE3NSwyNTUpXCJcbiAgICBcInJnYmEoNSwyMDQsOTUsMjU1KVwiXG4gICAgXCJyZ2JhKDgsMTc5LDE1LDI1NSlcIlxuICAgIFwicmdiYSg4OCwyMDQsMTAsMjU1KVwiXG4gICAgXCJyZ2JhKDE2OCwyMjgsNSwyNTUpXCJcbiAgICBcInJnYmEoMjQ4LDI1MywwLDI1NSlcIlxuICAgIFwicmdiYSgyNTUsMjI4LDAsMjU1KVwiXG4gICAgXCJyZ2JhKDI1NSwxOTgsMCwyNTUpXCJcbiAgICBcInJnYmEoMjU1LDE2OCwwLDI1NSlcIlxuICAgIFwicmdiYSgyNTUsMTE1LDAsMjU1KVwiXG4gICAgXCJyZ2JhKDI1NSw2MCwwLDI1NSlcIlxuICAgIFwicmdiYSgyNTUsNSwwLDI1NSlcIlxuICAgIFwicmdiYSgyMDQsMCw0MSwyNTUpXCJcbiAgICBcInJnYmEoMTQ4LDAsODcsMjU1KVwiXG4gIF1cbiAgZ2V0OiAoc3BlZWQpLT5cbiAgICBpID0gTWF0aC5mbG9vciBzcGVlZCAvIDVcbiAgICBpID0gMTUgaWYgaSA+IDE1XG4gICAgcmV0dXJuIEBfcGFsZXR0ZVtpXVxuXG5TaWduYWwgPVxuICBfc25yOiBudWxsXG4gIHNldDogKHN0YXR1cykgLT5cbiAgICBAX3NuciA9IHN0YXR1cy5zbnJcbiAgICBAZHJhdygpXG4gIGRyYXc6ICgpIC0+XG4gICAgaWYgQF9zbnIgaXMgbnVsbFxuICAgICAgJCgnLnN0YXR1cyAuc2lnbmFsJykuaGlkZSgpXG4gICAgICByZXR1cm5cbiAgICAjIDE6IDdcbiAgICAjIDI6IDggMTFcbiAgICAjIDM6IDEyIDE5XG4gICAgIyA0OiAyMCAzNVxuICAgIHNpZ25hbCA9IE1hdGgucm91bmQoQF9zbnIpXG4gICAgc2lnbmFsQ2xhc3MgPSAnbGFiZWwtc3VjY2VzcydcbiAgICBpZiBzaWduYWwgPCA4XG4gICAgICBzaWduYWxDbGFzcyA9IFwibGFiZWwtZGFuZ2VyXCJcbiAgICBlbHNlIGlmIHNpZ25hbCA8IDEzXG4gICAgICBzaWduYWxDbGFzcyA9IFwibGFiZWwtd2FybmluZ1wiXG5cbiAgICAkKCcuc3RhdHVzIC5zaWduYWwnKVxuICAgIC5yZW1vdmVDbGFzcygnbGFiZWwtc3VjY2VzcyBsYWJlbC1kYW5nZXIgbGFiZWwtd2FybmluZycpXG4gICAgLmFkZENsYXNzKHNpZ25hbENsYXNzKVxuICAgIC5zaG93KClcblxuICAgICQoJy5zdGF0dXMgLnNpZ25hbCAudmFsdWUnKVxuICAgIC50ZXh0KHNpZ25hbCtcImRCXCIpXG5cblN0YXRlID1cbiAgVElNRU9VVDogMjUqNjAqMTAwMFxuICBfZGF0ZTogbnVsbFxuICBfc3RhdGU6IG51bGxcbiAgc2V0OiAoc3RhdHVzKSAtPlxuICAgIEBfZGF0ZSA9IHN0YXR1cy5kYXRlXG4gICAgQF9zdGF0ZSA9IHN0YXR1cy5zdGF0ZVxuICAgIEBkcmF3KClcbiAgZHJhdzogKCkgLT5cbiAgICBpZiBAX2RhdGUgaXMgbnVsbCBvciBAX3N0YXRlIGlzIG51bGxcbiAgICAgICQoJy5zdGF0ZS5sYWJlbC1zdWNjZXNzJykuaGlkZSgpXG4gICAgICAkKCcuc3RhdGUubGFiZWwtZGFuZ2VyJykuaGlkZSgpXG4gICAgICByZXR1cm5cblxuICAgIGxhc3RDb250YWN0ID0gbmV3IERhdGUoQF9kYXRlKVxuICAgIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG5cbiAgICBob3VycyA9IFRvb2xzLmFkZFplcm8gbGFzdENvbnRhY3QuZ2V0SG91cnMoKVxuICAgIG1pbnV0ZXMgPSBUb29scy5hZGRaZXJvIGxhc3RDb250YWN0LmdldE1pbnV0ZXMoKVxuXG4gICAgZGF0YUlzRnJlc2ggPSBub3cgLSBsYXN0Q29udGFjdC5nZXRUaW1lKCkgPCBAVElNRU9VVFxuICAgIGxhc3RDb250YWN0VGV4dCA9ICcnXG5cbiAgICBpZiBkYXRhSXNGcmVzaFxuICAgICAgbGFzdENvbnRhY3RUZXh0ID0gaG91cnMrJzonK21pbnV0ZXNcbiAgICBlbHNlXG4gICAgICBsYXN0Q29udGFjdFRleHQgPSBsYXN0Q29udGFjdC50b0xvY2FsZURhdGVTdHJpbmcoKSsnICcrIGhvdXJzKyc6JyttaW51dGVzXG5cbiAgICBpZiBkYXRhSXNGcmVzaCBhbmQgQF9zdGF0ZSA9PSAnb24nXG4gICAgICAkKCcuc3RhdGUubGFiZWwtc3VjY2VzcycpLnNob3coKVxuICAgICAgJCgnLnN0YXRlLmxhYmVsLWRhbmdlcicpLmhpZGUoKVxuICAgIGVsc2VcbiAgICAgICQoJy5zdGF0ZS5sYWJlbC1zdWNjZXNzJykuaGlkZSgpXG4gICAgICAkKCcuc3RhdGUubGFiZWwtZGFuZ2VyJykuc2hvdygpXG5cbiAgICAkKCcubGFzdC1jb250YWN0JykudGV4dChsYXN0Q29udGFjdFRleHQpXG5cbkxvYWRpbmcgPVxuICBzZXQ6ICgpIC0+XG4gICAgJCgnLnJlcG9ydC1tZXNzYWdlLmFsZXJ0LWluZm8nKS5zaG93KClcbiAgY2xlYXI6ICgpIC0+XG4gICAgJCgnLnJlcG9ydC1tZXNzYWdlLmFsZXJ0LWluZm8nKS5oaWRlKClcblxuRXJyb3IgPVxuICBzZXQ6ICgpIC0+XG4gICAgJCgnLnJlcG9ydC1tZXNzYWdlLmFsZXJ0LWRhbmdlcicpLnNob3coKVxuICBjbGVhcjogKCkgLT5cbiAgICAkKCcucmVwb3J0LW1lc3NhZ2UuYWxlcnQtZGFuZ2VyJykuaGlkZSgpXG5cbklkID1cbiAgX2lkOiBudWxsXG4gIGluaXQ6ICgpIC0+XG4gICAgcmVzdWx0ID0gLy4qXFwvKFswLTldKykkLy5leGVjKGxvY2F0aW9uLnBhdGhuYW1lKVxuICAgIEBfaWQgPSAxXG4gICAgaWYgcmVzdWx0PyBhbmQgcmVzdWx0WzFdP1xuICAgICAgQF9pZCA9IHJlc3VsdFsxXVxuICAgIEBkcmF3KClcbiAgZHJhdzogKCkgLT5cbiAgICAkKCcucGlvdXBpb3UtaWQnKS50ZXh0IEBfaWRcbiAgZ2V0OiAoKS0+XG4gICAgQF9pZFxuXG5NZXRhID1cbiAgc2V0OiAobWV0YSkgLT5cbiAgICBAZHJhdyhtZXRhKVxuICBkcmF3OiAobWV0YSkgLT5cbiAgICAkKCcubmFtZScpLnRleHQgbWV0YS5uYW1lXG4gICAgaWYgbWV0YS5kZXNjcmlwdGlvbiBpcyBudWxsXG4gICAgICBkZXNjID0gTGFuZy5ub0Rlc2NyaXB0aW9uXG4gICAgZWxzZVxuICAgICAgZGVzYyA9IG1ldGEuZGVzY3JpcHRpb25cbiAgICAkKCcuZGVzY3JpcHRpb24nKS50ZXh0IGRlc2NcblxuTG9jYXRpb24gPVxuICBfbGF0aXR1ZGU6IG51bGxcbiAgX2xvbmdpdHVkZTogbnVsbFxuICBfbWFwOiBmYWxzZVxuICBfbWFya2VyOiBudWxsXG4gIHNldDogKGxvY2F0aW9uKSAtPlxuICAgIEBfbGF0aXR1ZGUgPSBsb2NhdGlvbi5sYXRpdHVkZVxuICAgIEBfbG9uZ2l0dWRlID0gbG9jYXRpb24ubG9uZ2l0dWRlXG4gICAgQGRyYXcoKVxuICBkcmF3TG9jYXRpb25UZXh0OiAoaXNVbmtub3duKSAtPlxuICAgIHRleHQgPSBcIlwiXG4gICAgaWYgaXNVbmtub3duXG4gICAgICB0ZXh0ID0gTGFuZy51bmtub3duTG9jYXRpb25cbiAgICBlbHNlXG4gICAgICB0ZXh0ID0gQF9sYXRpdHVkZStcIiwgXCIrQF9sb25naXR1ZGVcbiAgICAkKCcuZGV0YWlscyAubG9jYXRpb24nKS50ZXh0IHRleHRcbiAgZHJhd0xvY2F0aW9uTWFwOiAoaXNVbmtub3duKSAtPlxuICAgIGlmIGlzVW5rbm93blxuICAgICAgJCgnI21hcCcpLmhpZGUoKVxuICAgICAgcmV0dXJuXG4gICAgJCgnI21hcCcpLnNob3coKVxuICAgIHVubGVzcyBAX21hcFxuICAgICAgQF9tYXAgPSBMLm1hcCgnbWFwJywge3pvb21Db250cm9sOmZhbHNlfSkuc2V0VmlldyBbQF9sYXRpdHVkZSwgQF9sb25naXR1ZGVdLCAxMlxuICAgICAgTC50aWxlTGF5ZXIgJy8vcGlvdXBpb3UuZnIvdGlsZXMve3p9L3t4fS97eX0ucG5nJyxcbiAgICAgIGF0dHJpYnV0aW9uOiAnPGEgaHJlZj1cImh0dHA6Ly9vc20ub3JnL2NvcHlyaWdodFwiPk9TTTwvYT4nXG4gICAgICAuYWRkVG8oQF9tYXApXG4gICAgICBAX21hcmtlciA9IEwud2luZE1hcmtlcihcbiAgICAgICAgW1xuICAgICAgICAgIEBfbGF0aXR1ZGVcbiAgICAgICAgICBAX2xvbmdpdHVkZVxuICAgICAgICBdLFxuICAgICAgICBoZWFkaW5nOiAwXG4gICAgICAgIHNwZWVkOiAwXG4gICAgICApXG4gICAgICAuYWRkVG8gQF9tYXBcbiAgICBlbHNlXG4gICAgICBAX21hcmtlci5zZXRMYXRMbmcgW0BfbGF0aXR1ZGUsIEBfbG9uZ2l0dWRlXVxuICAgICAgQF9tYXAucGFuVG8gW0BfbGF0aXR1ZGUsIEBfbG9uZ2l0dWRlXVxuICBkcmF3OiAoKSAtPlxuICAgIGlzVW5rbm93biA9IEBfbGF0aXR1ZGUgaXMgbnVsbCBvciBAX2xvbmdpdHVkZSBpcyBudWxsXG4gICAgQGRyYXdMb2NhdGlvblRleHQgaXNVbmtub3duXG4gICAgQGRyYXdMb2NhdGlvbk1hcCBpc1Vua25vd25cblxuTGl2ZSA9XG4gIEhFQURJTkc6IFtcbiAgICBMYW5nLm5vcnRoXG4gICAgTGFuZy5ub3J0aCArIExhbmcubm9ydGggKyBMYW5nLmVhc3RcbiAgICBMYW5nLm5vcnRoICsgTGFuZy5lYXN0XG4gICAgTGFuZy5lYXN0ICArIExhbmcubm9ydGggKyBMYW5nLmVhc3RcbiAgICBMYW5nLmVhc3RcbiAgICBMYW5nLmVhc3QgICsgTGFuZy5zb3V0aCArIExhbmcuZWFzdFxuICAgIExhbmcuc291dGggKyBMYW5nLmVhc3RcbiAgICBMYW5nLnNvdXRoICsgTGFuZy5zb3V0aCArIExhbmcuZWFzdFxuICAgIExhbmcuc291dGhcbiAgICBMYW5nLnNvdXRoICsgTGFuZy5zb3V0aCArIExhbmcuZWFzdFxuICAgIExhbmcuc291dGggKyBMYW5nLmVhc3RcbiAgICBMYW5nLndlc3QgICsgTGFuZy5zb3V0aCArIExhbmcud2VzdFxuICAgIExhbmcud2VzdFxuICAgIExhbmcud2VzdCAgKyBMYW5nLm5vcnRoICsgTGFuZy53ZXN0XG4gICAgTGFuZy5ub3J0aCArIExhbmcud2VzdFxuICAgIExhbmcubm9ydGggKyBMYW5nLm5vcnRoICsgTGFuZy53ZXN0XG4gIF1cbiAgX3dpbmRfc3BlZWRfbWluOiBudWxsXG4gIF93aW5kX3NwZWVkX2F2ZzogbnVsbFxuICBfd2luZF9zcGVlZF9tYXg6IG51bGxcbiAgX3dpbmRfaGVhZGluZzogICBudWxsXG4gIF9kYXRlOiAgICAgICAgICAgbnVsbFxuICBfdWk6XG4gICAgbWluOiAgICAgICAgICAgJy5taW4nXG4gICAgYXZnOiAgICAgICAgICAgJy5hdmcnXG4gICAgbWF4OiAgICAgICAgICAgJy5tYXgnXG4gICAgaGVhZGluZzpcbiAgICAgIHRleHQ6ICcuaGVhZGluZyAudGV4dCdcbiAgICAgIGRlZ3JlZXM6ICcuaGVhZGluZyAuZGVncmVlcydcblxuICBfZ2V0SGVhZGluZ1RleHQ6IC0+XG4gICAgaWYgQF93aW5kX2hlYWRpbmc/XG4gICAgICByZXR1cm4gQEhFQURJTkdbTWF0aC5mbG9vcigoQF93aW5kX2hlYWRpbmcgLyAzNjApICogMTYpXVxuICAgIHJldHVybiBcIi0tXCJcbiAgc2V0OiAobWVhc3VyZW1lbnRzKSAtPlxuICAgIEBfd2luZF9zcGVlZF9taW4gPSBtZWFzdXJlbWVudHMud2luZF9zcGVlZF9taW5cbiAgICBAX3dpbmRfc3BlZWRfYXZnID0gbWVhc3VyZW1lbnRzLndpbmRfc3BlZWRfYXZnXG4gICAgQF93aW5kX3NwZWVkX21heCA9IG1lYXN1cmVtZW50cy53aW5kX3NwZWVkX21heFxuICAgIEBfd2luZF9oZWFkaW5nICAgPSBtZWFzdXJlbWVudHMud2luZF9oZWFkaW5nXG4gICAgQF9kYXRlICAgICAgICAgICA9IG1lYXN1cmVtZW50cy5kYXRlXG4gICAgQGRyYXcoKVxuICBfZHJhd0xpdmVTcGVlZDogKHVpUGFyZW50KSAtPlxuICAgICQoQF91aS5taW4sIHVpUGFyZW50KS50ZXh0KFVuaXQuY29udmVydChAX3dpbmRfc3BlZWRfbWluKSlcbiAgICAuY3NzKFwiY29sb3JcIiwgQ29sb3IuZ2V0KEBfd2luZF9zcGVlZF9taW4pKVxuICAgICQoQF91aS5hdmcsIHVpUGFyZW50KS50ZXh0KFVuaXQuY29udmVydChAX3dpbmRfc3BlZWRfYXZnKSlcbiAgICAuY3NzKFwiY29sb3JcIiwgQ29sb3IuZ2V0KEBfd2luZF9zcGVlZF9hdmcpKVxuICAgICQoQF91aS5tYXgsIHVpUGFyZW50KS50ZXh0KFVuaXQuY29udmVydChAX3dpbmRfc3BlZWRfbWF4KSlcbiAgICAuY3NzKFwiY29sb3JcIiwgQ29sb3IuZ2V0KEBfd2luZF9zcGVlZF9tYXgpKVxuICAgIFVuaXQuc3Vic2NyaWJlKCdsaXZlLXdpbmQnLCA9PiBAZHJhdygpKVxuICBfZHJhd0xpdmVIZWFkaW5nOiAodWlQYXJlbnQpIC0+XG4gICAgJChAX3VpLmhlYWRpbmcudGV4dCwgdWlQYXJlbnQpLnRleHQgQF9nZXRIZWFkaW5nVGV4dCgpXG4gICAgJChAX3VpLmhlYWRpbmcuZGVncmVlcywgdWlQYXJlbnQpLnRleHQgQF93aW5kX2hlYWRpbmcgKyBcIsKwXCJcbiAgZHJhdzogKCkgLT5cbiAgICBAX2RyYXdMaXZlU3BlZWQgICAgICcubGl2ZSdcbiAgICBAX2RyYXdMaXZlSGVhZGluZyAnLmxpdmUnXG5cbkNoYXJ0ID1cbiAgX3BlcmlvZDogNiozNjAwKjEwMDBcbiAgX2RhdGE6IFtdXG4gIF9kYXRhTWF4U3BlZWQ6IG51bGxcbiAgX21DYW52YXM6IG51bGxcbiAgX29DYW52YXM6IG51bGxcbiAgX21DdHg6IG51bGxcbiAgX29DdHg6IG51bGxcbiAgX3c6IG51bGxcbiAgX2g6IG51bGxcbiAgX3N0YXJ0VGltZTogbnVsbFxuICBfc3RvcFRpbWU6IG51bGxcbiAgX3NwZWVkVG9QaXhlbDogbnVsbFxuICBfdGltZVRvUGl4ZWxzOiBudWxsXG4gIF9tYXhTcGVlZDogNzBcbiAgX3B4UmF0aW86IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDFcbiAgX21hcmdpbkJvdHRvbTogbnVsbFxuICBfbW91c2VvdmVyOiBmYWxzZVxuXG4gIGluaXQ6IChkYXRhKS0+XG4gICAgQF9tQ2FudmFzID0gJChcIi5jaGFydCAubWFpblwiKVswXVxuICAgIEBfb0NhbnZhcyA9ICQoXCIuY2hhcnQgLm92ZXJsYXlcIilbMF1cbiAgICBAX21DdHggPSBAX21DYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpXG4gICAgQF9vQ3R4ID0gQF9vQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKVxuICAgIEBfbWFyZ2luQm90dG9tID0gIDMwKkBfcHhSYXRpb1xuICAgIHN0YXJ0ID0gbmV3IERhdGUobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBAX3BlcmlvZCkudG9JU09TdHJpbmcoKVxuICAgICQuZ2V0SlNPTiAnLy9hcGkucGlvdXBpb3UuZnIvdjEvYXJjaGl2ZS8nICsgSWQuZ2V0KCkgKyAnP3N0YXJ0PScrc3RhcnQrJyZzdG9wPW5vdycsIChzKSAtPlxuICAgICAgQ2hhcnQuc2V0IHMuZGF0YVxuICAgICAgc2V0SW50ZXJ2YWwgKCktPlxuICAgICAgICB1bmxlc3MgQ2hhcnQuX21vdXNlb3ZlclxuICAgICAgICAgIENoYXJ0LmRyYXcoKVxuICAgICAgLCAxMDAwXG5cbiAgICAgICMkKFwiLmNoYXJ0XCIpWzBdLm9ubW91c2VvdXQgPSAoKS0+XG4gICAgICAjICBDaGFydC5jbGVhck92ZXJsYXkoKVxuICAgICAgd2luZG93Lm9ubW91c2V1cCA9ICgpLT5cbiAgICAgICAgQ2hhcnQuY2xlYXJPdmVybGF5KClcbiAgICAgICQoXCIuY2hhcnRcIilbMF0ub250b3VjaGVuZCA9ICgpLT5cbiAgICAgICAgQ2hhcnQuY2xlYXJPdmVybGF5KClcbiAgICAgIHdpbmRvdy5vbm1vdXNlbW92ZSA9IChlKS0+XG4gICAgICAgIGlmIENoYXJ0Ll9tb3VzZW92ZXJcbiAgICAgICAgICBDaGFydC5kcmF3T3ZlcmxheSBlLnBhZ2VYXG4gICAgICAkKFwiLmNoYXJ0XCIpWzBdLm9ubW91c2Vkb3duID0gKGUpLT5cbiAgICAgICAgQ2hhcnQuZHJhd092ZXJsYXkgZS5wYWdlWFxuICAgICAgJChcIi5jaGFydFwiKVswXS5vbnRvdWNoc3RhcnQgPSAoZSktPlxuICAgICAgICBDaGFydC5kcmF3T3ZlcmxheSBlLnRvdWNoZXNbMF0ucGFnZVhcbiAgICAgICQoXCIuY2hhcnRcIilbMF0ub250b3VjaG1vdmUgPSAoZSktPlxuICAgICAgICB4ID0gZS50b3VjaGVzWzBdLnBhZ2VYXG4gICAgICAgIENoYXJ0LmRyYXdPdmVybGF5IHhcbiAgICAgICAgY29uc29sZS5sb2cgTWF0aC5hYnMoQ2hhcnQuX3RvdWNoc3RhcnQgLSB4KSpDaGFydC5fcHhSYXRpb1xuICAgICAgICBpZiBDaGFydC5fbm9TY3JvbGwgfHwgTWF0aC5hYnMoQ2hhcnQuX3RvdWNoc3RhcnQgLSB4KSpDaGFydC5fcHhSYXRpbyA+IDMwXG4gICAgICAgICAgQ2hhcnQuX25vU2Nyb2xsID0gdHJ1ZVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgJChcIi5jaGFydFwiKS5yZXNpemUgKCktPlxuICAgICAgICBDaGFydC5jbGVhck92ZXJsYXkoKVxuICAgICAgICBDaGFydC5kcmF3KClcblxuICBfY29tcHV0ZUdlb21ldHJ5OiAoKS0+XG4gICAgbWF4U3BlZWQgPSBAX21heFNwZWVkXG4gICAgaWYgQF9kYXRhTWF4U3BlZWQgPiBAX21heFNwZWVkXG4gICAgICBtYXhTcGVlZCA9IEBfZGF0YU1heFNwZWVkXG4gICAgQF93ID0gQF9tQ2FudmFzLndpZHRoID0gQF9vQ2FudmFzLndpZHRoID0gQF9tQ2FudmFzLmNsaWVudFdpZHRoICogQF9weFJhdGlvXG4gICAgQF9oID0gQF9tQ2FudmFzLmhlaWdodCA9IEBfb0NhbnZhcy5oZWlnaHQgPSBAX21DYW52YXMuY2xpZW50SGVpZ2h0ICogQF9weFJhdGlvXG4gICAgQF9zdG9wVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgQF9zdGFydFRpbWUgPSBAX3N0b3BUaW1lIC0gQF9wZXJpb2RcbiAgICBAX3NwZWVkVG9QaXhlbHMgPSAoQF9oIC0gQF9tYXJnaW5Cb3R0b20pIC8gbWF4U3BlZWRcbiAgICBAX3RpbWVUb1BpeGVscyA9IEBfdyAvIEBfcGVyaW9kXG4gIF90aW1lMng6ICh0aW1lKS0+XG4gICAgcmV0dXJuICh0aW1lLmdldFRpbWUoKSAtIEBfc3RhcnRUaW1lKSAqIEBfdGltZVRvUGl4ZWxzICBcbiAgX3gydGltZTogKHgpLT5cbiAgICByZXR1cm4geCAvIEBfdGltZVRvUGl4ZWxzICsgQF9zdGFydFRpbWVcbiAgX3NwZWVkMnk6IChzcGVlZCktPlxuICAgIHJldHVybiBAX2ggLSBAX21hcmdpbkJvdHRvbSAtIHNwZWVkICogQF9zcGVlZFRvUGl4ZWxzXG4gIFxuICBkcmF3T3ZlcmxheTogKG1vdXNlWCktPlxuICAgIHVubGVzcyBAX21vdXNlb3ZlclxuICAgICAgQF9tb3VzZW92ZXIgPSB0cnVlXG4gICAgICBAX3RvdWNoc3RhcnQgPSBtb3VzZVhcblxuICAgIHRpbWUgPSBAX3gydGltZShtb3VzZVgqQF9weFJhdGlvKVxuICAgIHBiaSA9IDBcbiAgICBwYWkgPSAwXG4gICAgZm9yIGkgaW4gWzAuLi5AX2RhdGEubGVuZ3RoXVxuICAgICAgaWYgQF9kYXRhW2ldLmRhdGUgPiB0aW1lXG4gICAgICAgIHBhaSA9IGlcbiAgICAgICAgYnJlYWtcbiAgICAgIHBiaSA9IGlcblxuICAgIHBiID0gQF9kYXRhW3BiaV1cbiAgICBwYSA9IEBfZGF0YVtwYWldXG5cbiAgICBpZiBNYXRoLmFicyhAX2RhdGFbcGJpXS10aW1lKSA8IE1hdGguYWJzKEBfZGF0YVtwYWldLXRpbWUpXG4gICAgICBwID0gcGJcbiAgICBlbHNlXG4gICAgICBwID0gcGFcblxuICAgIHggPSBAX3RpbWUyeChwLmRhdGUpXG5cbiAgICBAX29DdHguY2xlYXJSZWN0IDAsIDAsIEBfdywgQF9oXG4gICAgQF9vQ3R4LmxpbmVXaWR0aD0yKkBfcHhSYXRpb1xuICAgIEBfb0N0eC5zdHJva2VTdHlsZT1cInJnYmEoMjU1LCAyNTUsIDI1NSwgMC41KVwiXG5cbiAgICBAX29DdHguYmVnaW5QYXRoKClcbiAgICBAX29DdHgubW92ZVRvIHgsIDBcbiAgICBAX29DdHgubGluZVRvIHgsIEBfaCAtIEBfbWFyZ2luQm90dG9tXG4gICAgQF9vQ3R4LnN0cm9rZSgpXG5cbiAgICBAX29DdHguYmVnaW5QYXRoKClcbiAgICBAX29DdHguYXJjIEBfdGltZTJ4KHAuZGF0ZSksIEBfc3BlZWQyeShwLmF2ZyksIDQqQF9weFJhdGlvLCAwLCAyICogTWF0aC5QSSwgZmFsc2VcbiAgICBAX29DdHguZmlsbFN0eWxlID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuNSlcIlxuICAgIEBfb0N0eC5maWxsKClcblxuXG5cbiAgY2xlYXJPdmVybGF5OiAoKS0+XG4gICAgQF9tb3VzZW92ZXIgPSBmYWxzZVxuICAgIEBfdG91Y2hzdGFydCA9IG51bGxcbiAgICBAX25vU2Nyb2xsID0gZmFsc2VcbiAgICBAX29DdHguY2xlYXJSZWN0IDAsIDAsIEBfdywgQF9oXG4gIF9kcmF3UG9pbnRzOiAoKS0+XG4gICAgQF9tQ3R4LmNsZWFyUmVjdCAwLCAwLCBAX3csIEBfaFxuICAgIEBfbUN0eC5maWxsU3R5bGU9XCJyZ2JhKDY2LCAxMzksIDIwMiwgMC41KVwiXG4gICAgQF9tQ3R4LmJlZ2luUGF0aCgpXG4gICAgc3RhcnQgPSB0cnVlXG4gICAgZm9yIGQgaW4gQF9kYXRhXG4gICAgICBpZiBzdGFydFxuICAgICAgICBAX21DdHgubW92ZVRvIEBfdGltZTJ4KGQuZGF0ZSksIEBfc3BlZWQyeShkLm1heClcbiAgICAgICAgc3RhcnQgPSBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBAX21DdHgubGluZVRvIEBfdGltZTJ4KGQuZGF0ZSksIEBfc3BlZWQyeShkLm1heClcbiAgICBmb3IgaSBpbiBbQF9kYXRhLmxlbmd0aCAtIDEuLjBdIGJ5IC0xXG4gICAgICBkID0gQF9kYXRhW2ldXG4gICAgICBAX21DdHgubGluZVRvIEBfdGltZTJ4KGQuZGF0ZSksIEBfc3BlZWQyeShkLm1pbilcbiAgICBAX21DdHguZmlsbCgpXG5cbiAgICBmb3IgaSBpbiBbMS4uLkBfZGF0YS5sZW5ndGhdXG4gICAgICBkMCA9IEBfZGF0YVtpLTFdXG4gICAgICBkMSA9IEBfZGF0YVtpXVxuICAgICAgQF9tQ3R4LmxpbmVXaWR0aD0yKkBfcHhSYXRpb1xuICAgICAgQF9tQ3R4LmJlZ2luUGF0aCgpXG4gICAgICBAX21DdHguc3Ryb2tlU3R5bGU9Q29sb3IuZ2V0IChkMC5hdmcgKyBkMS5hdmcpLzJcbiAgICAgIEBfbUN0eC5tb3ZlVG8gQF90aW1lMngoZDAuZGF0ZSksIEBfc3BlZWQyeShkMC5hdmcpXG4gICAgICBAX21DdHgubGluZVRvIEBfdGltZTJ4KGQxLmRhdGUpLCBAX3NwZWVkMnkoZDEuYXZnKVxuICAgICAgQF9tQ3R4LnN0cm9rZSgpXG5cbiAgICB5ID0gQF9oIC0gMTAqQF9weFJhdGlvXG4gICAgbGFzdFggPSBAX3cgKyAxMCpAX3B4UmF0aW9cbiAgICBmb3IgaSBpbiBbQF9kYXRhLmxlbmd0aCAtIDEuLjBdIGJ5IC0xXG4gICAgICBkID0gQF9kYXRhW2ldXG4gICAgICB4ID0gQF90aW1lMngoZC5kYXRlKVxuICAgICAgaWYgbGFzdFggLSB4ID49IDMwKkBfcHhSYXRpb1xuICAgICAgICBsYXN0WCA9IHhcbiAgICAgICAgI0BfZHJhd0Fycm93IEBfbUN0eCwgeCwgQF9zcGVlZDJ5KGQubWluKStAX21hcmdpbkJvdHRvbS0xMCwgZC5oZWFkaW5nLCBDb2xvci5nZXQoZC5hdmcpXG4gICAgICAgIEBfZHJhd0Fycm93IEBfbUN0eCwgeCwgQF9oLTEwKkBfcHhSYXRpbywgZC5oZWFkaW5nLCBDb2xvci5nZXQoZC5hdmcpXG4gIF9kcmF3QXJyb3c6IChjdHgsIHgsIHksIGhlYWRpbmcsIGNvbG9yKS0+XG4gICAgY3R4LnNhdmUoKVxuICAgIGN0eC50cmFuc2xhdGUoeCwgeSlcbiAgICBjdHgucm90YXRlKChoZWFkaW5nKzE4MCkvMTgwKk1hdGguUEkpXG4gICAgY3R4LmJlZ2luUGF0aCgpXG4gICAgY3R4Lm1vdmVUbygwKkBfcHhSYXRpbywgLTkqQF9weFJhdGlvKVxuICAgIGN0eC5saW5lVG8oNSpAX3B4UmF0aW8sIDkqQF9weFJhdGlvKVxuICAgIGN0eC5saW5lVG8oMCpAX3B4UmF0aW8sIDUqQF9weFJhdGlvKVxuICAgIGN0eC5saW5lVG8oLTUqQF9weFJhdGlvLCA5KkBfcHhSYXRpbylcbiAgICBjdHguY2xvc2VQYXRoKClcbiAgICBjdHguZmlsbFN0eWxlID0gY29sb3JcbiAgICBjdHguZmlsbCgpXG4gICAgY3R4LnJlc3RvcmUoKVxuICBkcmF3OiAoKS0+XG4gICAgQ2hhcnQuX2NvbXB1dGVHZW9tZXRyeSgpXG4gICAgQ2hhcnQuX2RyYXdQb2ludHMoKVxuICBzZXQ6IChkYXRhKSAtPlxuICAgIGlmIGRhdGE/IGFuZCBkYXRhLmxlbmd0aFxuICAgICAgZm9yIGQgaW4gZGF0YVxuICAgICAgICBAX2RhdGEucHVzaCB7XG4gICAgICAgICAgbGF0OiBkWzFdXG4gICAgICAgICAgbG9uOiBkWzJdXG4gICAgICAgICAgYXZnOiBkWzRdXG4gICAgICAgICAgbWluOiBkWzNdXG4gICAgICAgICAgbWF4OiBkWzVdXG4gICAgICAgICAgaGVhZGluZzogZFs2XVxuICAgICAgICAgIGRhdGU6ICBuZXcgRGF0ZShkWzBdKVxuICAgICAgICB9XG4gICAgICBtYXhTcGVlZCA9IC0xXG4gICAgICBmb3IgZCBpbiBAX2RhdGFcbiAgICAgICAgbWF4U3BlZWQgPSBkLm1heCBpZiBkLm1heCA+IG1heFNwZWVkXG4gICAgICBAX2RhdGFNYXhTcGVlZCA9IG1heFNwZWVkXG4gICAgICBAZHJhdygpXG5cblxuXG5Vbml0LmluaXQoKVxuSWQuaW5pdCgpXG5DaGFydC5pbml0KClcbk1ldGEuc2V0IHtuYW1lOiBcIlBpb3VwaW91IFwiICsgSWQuZ2V0KCl9XG4kLmdldEpTT04gJy8vYXBpLnBpb3VwaW91LmZyL3YxL2xpdmUtd2l0aC1tZXRhLycgKyBJZC5nZXQoKSwgKHMpIC0+XG4gIE1ldGEuc2V0IHMuZGF0YS5tZXRhXG4gIFNpZ25hbC5zZXQgcy5kYXRhLnN0YXR1c1xuICBTdGF0ZS5zZXQgcy5kYXRhLnN0YXR1c1xuICBMb2NhdGlvbi5zZXQgcy5kYXRhLmxvY2F0aW9uXG4gIExpdmUuc2V0IHMuZGF0YS5tZWFzdXJlbWVudHNcbi5hbHdheXMgKCkgLT5cbiAgTG9hZGluZy5jbGVhcigpXG4uZmFpbCAoKSAtPlxuICBFcnJvci5zZXQoKVxuXG4iXX0=
