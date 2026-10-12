(function () {

     var WindPlot = function (canvasId, duration, reports) {

          var canvas = document.getElementById(canvasId);
          var ctx = canvas.getContext("2d");

          var w, h, l, m;

          var startTime, stopTime;

          var maxTime;

          var marginLeft = 25;
          var marginBottom = 20;
          var marginTop = 10;

          var colorAxis = "#ccc";

          var maxSpeed;
          var scaleSpeed;

          var speedToPixels;

          var periodTick = 240;
          var timeToPixels;

          var computeGeometry = function () {

               if (Pioupiou.unit == "noeuds" || Pioupiou.unit == "ms") {
                    scaleSpeed = 2.5;
               } else {
                    scaleSpeed = 5;
               }

               w = canvas.width = canvas.clientWidth;
               h = canvas.height = canvas.clientHeight;

               if (w > h) {
                    l = h;
               } else {
                    l = w;
               }

               m = l/2;

               stopTime = Math.floor(new Date().getTime()/1000);
               startTime = stopTime - duration;



               if (Pioupiou.unit == "noeuds") {
                    maxSpeed = Math.ceil(windReports.getMax("max", startTime)/9.26)*9.26;
                    if (maxSpeed < 18.52) maxSpeed = 18.52;
               } else {
                    maxSpeed = Math.ceil(windReports.getMax("max", startTime)/10)*10;
                    if (maxSpeed < 20) maxSpeed = 20;
               }


               speedToPixels = (h - marginBottom - marginTop) /  maxSpeed;
               timeToPixels = (w - marginLeft) /  duration;

          };

          var getY = function (speed) {
               //if (Pioupiou.unit == "noeuds") speed /= 1.852;
               return h - marginBottom - speed * speedToPixels;
          };

          var getX = function (time) {
               return marginLeft + (time - startTime) * timeToPixels;
          };

          var drawBackground = function () {

               // AXES
               ctx.strokeStyle = colorAxis;
               ctx.lineWidth = 1;

               ctx.beginPath();
               ctx.moveTo(getX(startTime), getY(0)-0.5);
               ctx.lineTo(getX(stopTime), getY(0)-0.5);
               ctx.stroke();

               ctx.beginPath();
               ctx.moveTo(getX(startTime)-0.5, getY(maxSpeed));
               ctx.lineTo(getX(startTime)-0.5, getY(0));
               ctx.stroke();


               // TICKS

               ctx.textAlign = "start";
               ctx.textBaseline = "top";

               var i=0;

               var gridStartTime = new Date(startTime*1000)
               gridStartTime.setMinutes(0);
               gridStartTime.setSeconds(0);
               gridStartTime.setMilliseconds(0)
               gridStartTime = gridStartTime.valueOf()/1000;
               var gridStopTime = new Date(stopTime*1000);
               gridStopTime.setMinutes(59);
               gridStopTime.setSeconds(59);
               gridStopTime.setMilliseconds(999);
               gridStopTime = gridStopTime.valueOf()/1000;

               var isLong = (stopTime - startTime > 3*3600); 

               for (var time = gridStartTime; time < gridStopTime; time += isLong ? 3600 : 60)
               {
                    var x = Math.round(getX(time))-0.5;
                    if (time < startTime) {
                      //nop
                    } else if (i % (isLong ? 3 : 10) == 0) {
                         var date = new Date(time*1000);

                         var hours = date.getHours();
                         var minutes = date.getMinutes();
                         if (minutes < 10) minutes = "0" + minutes;
                         
                         if (!isLong) {
                           ctx.fillText(hours + ":" + minutes, x+0.5, Math.round(getY(0))+9);
                         } else {
                           ctx.fillText(hours + 'h', x+0.5, Math.round(getY(0))+9);
                         }
                         ctx.beginPath();
                         ctx.moveTo(x, getY(maxSpeed));
                         ctx.lineTo(x, getY(0)+8);
                         ctx.stroke();
                    } else {
                         ctx.beginPath();
                         ctx.moveTo(x, getY(0));
                         ctx.lineTo(x, getY(0)+4);
                         ctx.stroke();
                    }
                    i++;
               };

               ctx.beginPath();
               ctx.moveTo(w, getY(maxSpeed));
               ctx.lineTo(w, getY(0));
               ctx.stroke();

               // ECHELLE VENT

               var nScales;

               if (Pioupiou.unit == "noeuds") {
                    nScales = maxSpeed / 1.852 / scaleSpeed + 1;
               } else if (Pioupiou.unit == "ms") {
                    nScales = maxSpeed / 3.6 / scaleSpeed + 1;
               } else {
                    nScales = maxSpeed / scaleSpeed + 1;
               }

               ctx.textAlign = "end";
               ctx.textBaseline = "middle";

               for (var i=0; i<nScales; i++) {
                    var speed = i * scaleSpeed;
                    var y;
                    if (Pioupiou.unit == "noeuds") {
                         y = Math.round(getY(speed * 1.852))-0.5;
                    }else if (Pioupiou.unit == "ms") {
                         y = Math.round(getY(speed * 3.6))-0.5;
                    } else {
                         y = Math.round(getY(speed))-0.5;
                    }
                    var x0 = getX(startTime);
                    if (i % 2 == 0) {
                         ctx.beginPath();
                         ctx.moveTo(x0-8, y);
                         ctx.lineTo(getX(stopTime), y);
                         ctx.stroke();
                         ctx.fillText(speed, x0-10, y);
                    } else {
                         ctx.beginPath();
                         ctx.moveTo(x0-4, y);
                         ctx.lineTo(x0, y);
                         ctx.stroke();
                    }
               }

          };

          var drawPoints = function () {

               ctx.fillStyle="rgba(66, 139, 202, 0.5)";
               ctx.beginPath();

               var start = true;
               windReports.process(startTime, true, function (report) {
                    if (start) {
                         ctx.moveTo(getX(report.timestamp), getY(report.max));
                         start = false;
                    } else {
                         ctx.lineTo(getX(report.timestamp), getY(report.max));
                    }
               });

               windReports.process(startTime, false, function (report) {
                         ctx.lineTo(getX(report.timestamp), getY(report.min));
               });
               ctx.fill();

               ctx.strokeStyle="#31708f";
               ctx.lineWidth="2";
               ctx.beginPath();
               start = true;
               windReports.process(startTime, true, function (report) {
                    if (start) {
                         ctx.moveTo(getX(report.timestamp), getY(report.moy));
                         start = false;
                    } else {
                         ctx.lineTo(getX(report.timestamp), getY(report.moy));
                    }
               });
               ctx.stroke();
          };

          this.draw = function () {
               computeGeometry();
               drawBackground();
               drawPoints();
          };

     };

     window.Pioupiou.WindPlot = WindPlot;

})();
