(function () {
     
     var WindRose = function (canvasId, duration, windReports) {
          
          var canvas = document.getElementById(canvasId);
          var ctx = canvas.getContext("2d");
          
          var w, h, l, m, maxRadius;
          
          var startTime, stopTime;
          
          var maxSpeed;
          var speedToPixels;
          var margin = 20;
          
          var computeGeometry = function () {
               
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
                    maxSpeed = Math.ceil(windReports.getMax("moy", startTime)/9.26)*9.26;
                    if (maxSpeed < 9.26) maxSpeed = 9.26;
               } else {
                    maxSpeed = Math.ceil(windReports.getMax("moy", startTime)/10)*10;
                    if (maxSpeed < 10) maxSpeed = 10;
               }
               
               maxRadius = l/2-margin;
               speedToPixels = maxRadius / maxSpeed;
          };
                    
          var drawBackground = function () {
               
               ctx.setTransform(1, 0, 0, 1, 0, 0);
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               ctx.translate(w/2, h/2);
               
               
               ctx.strokeStyle="#ddd";
               ctx.fillStyle = "white";
               ctx.lineWidth=1;
               
               for (var i=0; i<8; i++) {
                    var angle = Math.PI/8*i+Math.PI/16;
                    var xStart = Math.round(maxRadius*Math.cos(angle));
                    var yStart = Math.round(maxRadius*Math.sin(angle));
                    var xStop = Math.round(maxRadius*Math.cos(angle+Math.PI));
                    var yStop = Math.round(maxRadius*Math.sin(angle+Math.PI));
                    ctx.beginPath();
                    ctx.moveTo(xStart, yStart);
                    ctx.lineTo(xStop, yStop);
                    ctx.stroke();
               }
               
               ctx.beginPath();
               ctx.arc(0, 0, 8, 0, 2*Math.PI);
               ctx.stroke();
               ctx.fill();
               
               ctx.font = "12px sans-serif";
               ctx.textAlign = "center";
               ctx.textBaseline="middle";
               ctx.fillStyle = "#ccc";
               
               
               var nCircles;
               if (Pioupiou.unit == "noeuds") {
                    nCircles = maxSpeed/9.26+1;
               } else {
                    nCircles = maxSpeed/10+1;
               }
                    
               for (var i=0; i<nCircles; i++) {
                    var radius = maxRadius/(nCircles-1)*i;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, 2*Math.PI);
                    ctx.stroke();
               }
               
               
               ctx.font = "16px sans-serif";
               ctx.fillStyle = "#888";
               ctx.textAlign = "center";
               ctx.textBaseline = "top"; 
               ctx.fillText("N", 0, -m);
               ctx.textBaseline = "bottom"; 
               ctx.fillText("S", 0, m);
               ctx.textBaseline = "middle"; 
               ctx.textAlign = "start";
               ctx.fillText("W", -m, 0);
               ctx.textAlign = "end";
               ctx.fillText("E", m, 0);
          };
          
          var drawPoints = function () {
               windReports.process(startTime, true, function(report) {
                    
                    var angle = Math.PI/8*report.dir - Math.PI/2;
                    var angleStart = angle - Math.PI/16;
                    var angleStop = angle + Math.PI/16;

                    var radius = speedToPixels * report.moy;
                    var radiusUp = radius + 5;
                    var radiusDown = radius - 5;
                    
                    var alpha = (3.40-Math.log((stopTime - report.timestamp)/240+1))/3.4;
                    // TODO: algo adaptatif en fonction du nombre
                    if (alpha < 0) {
                         alpha = 0;
                    } else if (alpha > 1) {
                         alpha = 1;
                    }
                    
                    ctx.fillStyle = "rgba(217, 83, 71, "+alpha+")";
                    
                    if (radiusDown < 0) {
                         
                         ctx.beginPath();
                         ctx.arc(0, 0, 5, 0, 2*Math.PI);
                         ctx.fill();
                         
                         return;
                    }
                    
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, radiusUp, angleStart, angleStop);
                    ctx.arc(0, 0, radiusDown, angleStop, angleStart, true);
                    ctx.lineTo(0+radiusUp*Math.cos(angleStart), 0+radiusUp*Math.sin(angleStart));
                    ctx.fill();
                    
               });
          };
          
          this.draw = function () {
               computeGeometry();
               drawBackground();
               drawPoints();
          };
          
     };

     window.Pioupiou.WindRose = WindRose;
     
})();
