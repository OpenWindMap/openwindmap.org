(function () {
     
     var WindArrow = function (elemId, windReports) {
          
          var text = document.getElementById(elemId + "-text");
          var canvas = document.getElementById(elemId + "-canvas");
          var ctx = canvas.getContext("2d");
          
          var dirText = [
               "North",
               "North North East",
               "North East",
               "East North East",
               "East",
               "East South East",
               "South East",
               "South South East",
               "South",
               "South South West",
               "South West",
               "West South West",
               "West",
               "West North West",
               "North West",
               "North North West",
               "North"
          ];
          
          this.draw = function () {
          
               var l = canvas.width;
               var u = l/8;
               
               ctx.setTransform(1, 0, 0, 1, 0, 0);
               ctx.clearRect(0, 0, canvas.width, canvas.height);
               
               var report = windReports.getLast();
               
               var now = new Date().getTime()/1000;
               if (now - report.timestamp > 3600) {
                    text.innerHTML = "--";
                    return;
               }
               
               
               text.innerHTML = dirText[report.dir];
               

               
               ctx.fillStyle="black";
               ctx.beginPath();
               ctx.translate(l/2, l/2);
               ctx.rotate(report.dir*22.5*Math.PI/180);
               ctx.moveTo(0, 4*u);
               ctx.lineTo(2*u, 1*u);
               ctx.lineTo(0.5*u, 1.5*u);
               ctx.lineTo(1*u, -4*u);
               ctx.lineTo(0, -2.5*u);
               ctx.lineTo(-1*u, -4*u);
               ctx.lineTo(-0.5*u, 1.5*u);
               ctx.lineTo(-2*u, 1*u);
               ctx.lineTo(0, 4*u);
               ctx.fill();
               
          };
          
     };

     window.Pioupiou.WindArrow = WindArrow;
     
})();
