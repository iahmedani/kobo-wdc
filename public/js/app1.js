// adding functionality to jquery for serializing form;
(function($) {
    $.fn.serializeFormJSON = function() {
      var o = {};
      var a = this.serializeArray();
      $.each(a, function() {
        if (o[this.name]) {
          if (!o[this.name].push) {
            o[this.name] = [o[this.name]];
          }
          o[this.name].push(this.value || "");
        } else {
          o[this.name] = this.value || "";
        }
      });
      return o;
    };
  })(jQuery);
  
  var token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

  function getDataForSchema(_userInputs) {
    return new Promise(function(resolve, reject) {
        $.ajax({
            url: 'add',
            // crossDomain: false,
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                'CSRF-Token': token 
            },
    
            data : JSON.stringify({
                url:_userInputs.url,
                auth: _userInputs.auth,
                type: _userInputs.type
            }),
      })
        .done(function(data) {
          //(data);
          resolve(data);
        })
        .fail(function(e) {
          //(e);
          reject(e);
        });
    });
  }
  
  function _formatData (data, cb){
      var x = [];
      for (var i = 0; i<data.length; i++){
          var y =  _.mapKeys(data[i], function(value, key) {
  
  
              return key.replace(/\W/g,'_')
              // if(key.indexOf('/') == -1){
              //     return key
              // }else{
  
              // }
            });
            if(y._geolocation){
                y._geolocation = {                
                    "type": "Point",
                    "coordinates": [ (y._geolocation[0] == null) ? 0 : y._geolocation[0], (y._geolocation[1] == null) ? 0 : y._geolocation[1]]
                  
                }
              }
            console.log(y._geolocation);
            x.push(y);
      }
      cb(null, x);
  }
  
  function _formatDataPromise (data){
      return new Promise(function(resolve, reject){
          _formatData(data, function(err, newData){
              if(err){
                  reject()
              }else{
                  resolve(newData)
              }
          })
      })
  }
  
  
  function getAllKeys(dataArray, cb) {
    var x = [];
    for (var i=0; i<dataArray.length; i++){      
        for (key in dataArray[i]) {
          x.push(key);
        }
    }
    cb(null,x);
  }
  
  function getAllKeysPromise (data){
      return new Promise(function(resolve, reject){
          getAllKeys(data, function(error, data){
              if(error){
                  reject(error)
              }else{
                  
                  resolve(data)
              }
          })
  
      })
  }
  
  function myUnique(data, cb) {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
  
    var unique = data.filter(onlyUnique);
    cb(null, unique);
  }
  function myUnique1(data, cb) {
    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }
  
    var unique = data.filter(onlyUnique);
    return unique;
  }
  
  function myUniquePromise(data){
      return new Promise(function(resolve, reject){
          myUnique(data, function(err, data){
              if(err){
                  reject()
              }else{
                  //(data)
                  resolve(data)
              }
          })
      })
  }
  
  function myType(_var){
      // console.log(_var)
      const schemaMap = {
        number  : tableau.dataTypeEnum.float,
        string  : tableau.dataTypeEnum.string,
        boolean : tableau.dataTypeEnum.bool,
        datetime: tableau.dataTypeEnum.datetime
      };
    
      var g = isNaN(Number(_var)) ? _var : Number(_var)
      if( new Date(_var) != 'Invalid Date' && typeof g != 'number'){
          var x ='datetime'
      }else{
          var x = typeof g;
      }
      
    
      // //( schemaMap.string)
      return schemaMap[x] ? schemaMap[x] : tableau.dataTypeEnum.string
  }
  
  function getTypeOf(uniqueVar, data, cb){
      var cols = [];
      var yy = [];
      for (var i = 0; i < data.length; i++){
          for(var j = 0; j< uniqueVar.length; j++){
              if(data[i][uniqueVar[j]] ){ 
                  // //(uniqueVar[j])
                  // //(yy.filter(function(el){el == uniqueVar[j]}).length)  
                  
                  
                  if(yy.indexOf(uniqueVar[j]) == -1){                   
                      cols.push({
                          id:uniqueVar[j].replace(/\W/g,'_'),
                          dataType: (uniqueVar[j]== '_geolocation')? tableau.dataTypeEnum.geometry : myType(data[i][uniqueVar[j]])
                      })
                      yy.push(uniqueVar[j])
                  } else{
                      continue;
                  }
              }
          }
      }
      cb(null, cols)
    
  }
  
  function getTypeOfPromise(uniqueVar, data){
      return new Promise(function(resolve, reject){
          getTypeOf(uniqueVar, data, function(err, data){
              if(err){
                  reject()
              }else {
                  resolve(data)
              }
          })
      })
  }
  
  
  (function() {
    // Create the connector object
    var myConnector = tableau.makeConnector();
  
    // Define the schema
    myConnector.getSchema = function(schemaCallback) {
      var _userInputs = JSON.parse(tableau.connectionData);
      //("Get Schema Called");
      //(_userInputs);
  
      getDataForSchema(_userInputs)
          .then(function(data){
              // //(data)
              return getAllKeysPromise(data)
                      .then(function(keys){
                          return {
                              data: data,
                              keys:keys
                          }
                      })
          })
          .then(function(kays_data){
              //(kays_data)
             return myUniquePromise(kays_data.keys)
                  .then(function(uniqueVar){
                      //(kays_data, uniqueVar)
  
                      return {
                          uniqueVar:uniqueVar,
                          data:kays_data.data
                      }
                  })
          })
          .then(function(data){
              //(data)
              return getTypeOfPromise(data.uniqueVar, data.data)
          })
          .then(function(cols){
              //(cols)
              var tableSchema = {
                  id: "kobo",
                  alias:
                    "My Kobo Connector Data",
                  columns: cols
                };
                schemaCallback([tableSchema]);
          })
          .catch(function(e){
              //(e)
          })
  
      // var cols = [
      //   {
      //     id: "id",
      //     dataType: tableau.dataTypeEnum.string
      //   },
      //   {
      //     id: "mag",
      //     alias: "magnitude",
      //     dataType: tableau.dataTypeEnum.float
      //   },
      //   {
      //     id: "title",
      //     alias: "title",
      //     dataType: tableau.dataTypeEnum.string
      //   },
      //   {
      //     id: "lat",
      //     alias: "latitude",
      //     dataType: tableau.dataTypeEnum.float
      //   },
      //   {
      //     id: "lon",
      //     alias: "longitude",
      //     dataType: tableau.dataTypeEnum.float
      //   }
      // ];
  
      // var tableSchema = {
      //   id: "earthquakeFeed",
      //   alias:
      //     "Earthquakes with magnitude greater than 4.5 in the last seven days",
      //   columns: cols
      // };
  
      // schemaCallback([tableSchema]);
    };
  
    // Download the data
    myConnector.getData = function(table, doneCallback) {
      var _userInputs = JSON.parse(tableau.connectionData);
  
      //("getData Called");
      //(_userInputs);
      getDataForSchema(_userInputs)
      .then(function(result){
          return _formatDataPromise(result)
          // tableData =[];
          // for (var i =0; i<result.length; i++){
          //     var x =  _.mapKeys(result[i], function(value, key) {
          //         return key.replace(/\//ig,'_');
          //       });
          //       table.push(x)
          // }
  
          
      })
      .then(function(result){
          table.appendRows(result)
          doneCallback()
      })
      .catch(function(e){
          //(e)
      })
  
      // // //(JSON.parse(tableau.connectionData));
      // $.getJSON(
      //   "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson",
      //   function(resp) {
      //     var feat = resp.features,
      //       tableData = [];
  
      //     // Iterate over the JSON object
      //     for (var i = 0, len = feat.length; i < len; i++) {
      //       tableData.push({
      //         id: feat[i].id,
      //         mag: feat[i].properties.mag,
      //         title: feat[i].properties.title,
      //         lon: feat[i].geometry.coordinates[0],
      //         lat: feat[i].geometry.coordinates[1]
      //       });
      //     }
  
      //     table.appendRows(tableData);
      //     doneCallback();
      //   }
      // );
    };
  
    tableau.registerConnector(myConnector);
  
    // Create event listeners for when the user submits the form
    $(document).ready(function() {
      $("#koboForm").on("submit", function(e) {
        // //('Connection iniate buttion click')
        e.preventDefault();
        var formData = $("#koboForm").serializeFormJSON();
        //(formData)
        tableau.connectionData = JSON.stringify(formData);
        tableau.connectionName = "Kobo Form"; // This will be the data source name in Tableau
        tableau.submit(); // This sends the connector object to Tableau
      });
    });
  })();
  