(function () {
     
     var WindSpeed = function (elemId, windReports) {
          
          var textMin = document.getElementById(elemId + "-min");
          var textMoy = document.getElementById(elemId + "-moy");
          var textMax = document.getElementById(elemId + "-max");
          var textTime = document.getElementById(elemId + "-time");
          
          this.draw = function () {
               
               var report = windReports.getLast();
               
               var now = new Date().getTime()/1000;
               
               if (now - report.timestamp > 3600) {
                    textMin.innerHTML = "--";
                    textMoy.innerHTML = "--";
                    textMax.innerHTML = "--";
                    textTime.innerHTML = "more than one hour ago!";
                    return;
               }
               
               if (Pioupiou.unit == "kmh") {
                    textMin.innerHTML = "min " + report.min + " <small>km/h</small>";
                    textMoy.innerHTML = report.moy + " <small>km/h</small>";
                    textMax.innerHTML = "max " + report.max + " <small>km/h</small>";
               } else if (Pioupiou.unit == "ms") {
                    var min = Math.round(report.min/3.6*10)/10;
                    var moy = Math.round(report.moy/3.6*10)/10;
                    var max = Math.round(report.max/3.6*10)/10;
                    textMin.innerHTML = "min " + min + " <small>m/s</small>";
                    textMoy.innerHTML = moy + " <small>m/s</small>";
                    textMax.innerHTML = "max " + max + " <small>m/s</small>";
               } else {
                    var min = Math.round(report.min/1.852*10)/10;
                    var moy = Math.round(report.moy/1.852*10)/10;
                    var max = Math.round(report.max/1.852*10)/10;
                    textMin.innerHTML = "min " + min + " <small>kt</small>";
                    textMoy.innerHTML = moy + " <small>kt</small>";
                    textMax.innerHTML = "max " + max + " <small>kt</small>";
               }
               var date = new Date(report.timestamp*1000);
               var hours = date.getHours();
               var minutes = date.getMinutes();
               if (minutes < 10) minutes = "0" + minutes;

               textTime.innerHTML = "at "+hours+":"+minutes;
          
               
          };
          
     };

     window.Pioupiou.WindSpeed = WindSpeed;
     
})();
