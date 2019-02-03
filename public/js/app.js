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
      method:'POST',
      headers: {
        "Content-Type": "application/json",
        'CSRF-Token': token
      },
      data: JSON.stringify({
        url:_userInputs.url,
        auth:_userInputs.auth,
        type:_userInputs.type
      })
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

function _formatData(data, cb) {
  var x = [];
  for (var i = 0; i < data.length; i++) {
    var y = _.mapKeys(data[i], function(value, key) {
      return key.replace(/\W/g, "_");
    });
    if (y._geolocation) {
      y._geolocation = {
        type: "Point",
        coordinates: [
          y._geolocation[1] == null ? 0 : y._geolocation[1],
          y._geolocation[0] == null ? 0 : y._geolocation[0]
        ]
      };
    }
    console.log(y._geolocation);
    x.push(y);
  }
  cb(null, x);
}

function _formatDataPromise(data) {
  return new Promise(function(resolve, reject) {
    _formatData(data, function(err, newData) {
      if (err) {
        reject();
      } else {
        resolve(newData);
      }
    });
  });
}

function getAllKeys(dataArray, cb) {
  var x = [];
  for (var i = 0; i < dataArray.length; i++) {
    for (key in dataArray[i]) {
      x.push(key);
    }
  }
  cb(null, x);
}

function getAllKeysPromise(data) {
  return new Promise(function(resolve, reject) {
    getAllKeys(data, function(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
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

function myUniquePromise(data) {
  return new Promise(function(resolve, reject) {
    myUnique(data, function(err, data) {
      if (err) {
        reject();
      } else {
        //(data)
        resolve(data);
      }
    });
  });
}

function myType(_var) {
  const schemaMap = {
    number: tableau.dataTypeEnum.float,
    string: tableau.dataTypeEnum.string,
    boolean: tableau.dataTypeEnum.bool,
    datetime: tableau.dataTypeEnum.datetime,
  
  };

  var g = isNaN(Number(_var)) ? _var : Number(_var);
  if (new Date(_var) != "Invalid Date" && typeof g != "number") {
    var x = "datetime";
  }else  {
    var x = (typeof _var != 'object')? typeof g : typeof _var;
  }
  return schemaMap[x] ? schemaMap[x] : tableau.dataTypeEnum.string;
}

function getTypeOf(uniqueVar, data, cb) {
  var cols = [];
  var yy = [];
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < uniqueVar.length; j++) {
      if (data[i][uniqueVar[j]]) {
       
        if (yy.indexOf(uniqueVar[j]) == -1) {
          cols.push({
            id: uniqueVar[j].replace(/\W/g, "_"),
            dataType:
              uniqueVar[j] == "_geolocation"
                ? tableau.dataTypeEnum.geometry
                : myType(data[i][uniqueVar[j]])
          });
          yy.push(uniqueVar[j]);
        } else {
          continue;
        }
      }
    }
  }
  cb(null, cols);
}

function getTypeOfPromise(uniqueVar, data) {
  return new Promise(function(resolve, reject) {
    getTypeOf(uniqueVar, data, function(err, data) {
      if (err) {
        reject();
      } else {
        resolve(data);
      }
    });
  });
}

(function() {
  var myConnector = tableau.makeConnector();
  var _myData = [];
  myConnector.getSchema = function(schemaCallback) {
    var _userInputs = JSON.parse(tableau.connectionData);

    getDataForSchema(_userInputs)
      .then(function(data) {
        return getAllKeysPromise(data).then(function(keys) {
          _myData = data;
          return {
            data: data,
            keys: keys
          };
        });
      })
      .then(function(kays_data) {
        return myUniquePromise(kays_data.keys).then(function(uniqueVar) {

          return {
            uniqueVar: uniqueVar,
            data: kays_data.data
          };
        });
      })
      .then(function(data) {
        //(data)
        return getTypeOfPromise(data.uniqueVar, data.data);
      })
      .then(function(cols) {
        //(cols)
        var tableSchema = {
          id: "kobo",
          alias: "My Kobo Connector Data",
          columns: cols
        };
        schemaCallback([tableSchema]);
      })
      .catch(function(e) {
        console.log(e)
      });
  };

  // Download the data
  myConnector.getData = function(table, doneCallback) {
    var _userInputs = JSON.parse(tableau.connectionData);

    _formatDataPromise(_myData)
      .then(function(result) {
        table.appendRows(result);
        doneCallback();
      })
      .catch(function(e) {
        //(e)
      });

  };

  tableau.registerConnector(myConnector);

  // Create event listeners for when the user submits the form
  $(document).ready(function() {
    $("#koboForm").on("submit", function(e) {
      // //('Connection iniate buttion click')
      e.preventDefault();
      var formData = $("#koboForm").serializeFormJSON();
      //(formData)
      getDataForSchema(formData).then(function(a){console.log(a)}).catch(function(e){console.log(e)})
      tableau.connectionData = JSON.stringify(formData);
      tableau.connectionName = "Kobo Form"; // This will be the data source name in Tableau
      tableau.submit(); // This sends the connector object to Tableau
    });
  });
})();