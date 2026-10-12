(function () {

     var Reports = function () {

          var data = [];

          var needCleanup = false;

          var cleanup = function () {
               data.sort(function (a, b) {
                    if (a.timestamp < b.timestamp) return 1;
                         if (a.timestamp > b.timestamp) return -1;
                         return 0;
               });
               needCleanup = false;
          };

          this.add = function (report) {
               needCleanup = true;
               data.push(report);
          }

          this.get = function () {
               if (needCleanup) cleanup();
               return data;
          };

          this.getLast = function () {
               if (needCleanup) cleanup();
               return data[0];
          };

          this.getFirst = function () {
               if (needCleanup) cleanup();
               return data[data.length-1];
          };

          this.getMax = function (varName, startTime) {
               if (needCleanup) cleanup();
               var max = -99999;
               for (var i=0; i<data.length; i++) {
                    var val = parseFloat(data[i][varName]);
                    if (data[i].timestamp < startTime) break;
                    if (val > max) max = val;
               }
               return max;
          };

          this.getMin = function (varName, startTime) {
               if (needCleanup) cleanup();
               var min = 999999;
               for (var i=0; i<data.length; i++) {
                    var val = parseFloat(data[i][varName]);
                    if (data[i].timestamp < startTime) break;
                    if (val < min) min = val;
               }
               return min;
          };

          this.process = function (startTime, forward, callback) {
               if (needCleanup) cleanup();
               if (forward) {
                    for (var i=0; i<data.length; i++) {
                         if (data[i].timestamp < startTime) break;
                         callback(data[i]);
                    }
               } else {
                    for (var i=data.length-1; i>=0; i--) {
                         if (data[i].timestamp < startTime) continue;
                         callback(data[i]);
                    }
               }
          };
     };

     window.Pioupiou.Reports = Reports;

})();
