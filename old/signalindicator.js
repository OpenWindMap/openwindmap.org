(function () {
     
     var SignalIndicator = function (spanId, signalReports, isWidget) {
          
          //var signalSpan = document.getElementById(spanId + "-value");
          var statusSpan = document.getElementById(spanId + "-status");
          var statusLabel = document.createElement("span");
          var statusText = document.createElement("small");
          statusSpan.appendChild(statusLabel);
          statusSpan.appendChild(statusText);
          
          this.draw = function () {
               var lastReport = signalReports.getLast();
               var signal = signalReports.getMax("signal", lastReport.timestamp);
               
               var signalText = signal + " dB";

var signalColor;
               
               //1: 7
               //2: 8 11
               //3: 12 19
               //4: 20 35
               
               if (signal >= 20) {
                    signalColor = "#3c763d";
               } else if (signal >= 12) {
                    signalColor = "#31708f";
               } else if (signal >= 8) {
                    signalColor = "#8a6d3b";
               } else {
                    signalColor = "#a94442";
               }
               
               //signalSpan.innerHTML = signalText;
               //signalSpan.style.color = signalColor;
               
               
               var date = new Date(lastReport.timestamp*1000);
               var day = date.toLocaleDateString();
               var hours = date.getHours();
               var minutes = date.getMinutes();
               if (minutes < 10) minutes = "0" + minutes;
               var time = "at " + hours + ":" + minutes;
 
               var labelClass;
               var lastContactText;
               
               var now = new Date().getTime()/1000;
               if (now - lastReport.timestamp > 60*15) {
                    labelClass = "danger";
                    statusLabel.innerHTML = "Offline";
                    lastContactText = day+" at "+time;
               } else {
                    labelClass = "success";
                    statusLabel.innerHTML = "Online";
                    if (!isWidget) lastContactText = time;
                    
               }
               statusLabel.className = "label label-"+labelClass;
               if (lastContactText) statusText.innerHTML = " Last contact "+lastContactText;
               
          };
          
     };

     window.Pioupiou.SignalIndicator = SignalIndicator;
     
})();
