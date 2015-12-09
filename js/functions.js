var map;
var task = 0;
var drawingManager;
var selectedShape;
var data;
var colors = ['#1F5BFF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
var selectedColor;
var colorButtons = {};

//funcion para leer las coordenadas y ponerlas numericas
function getCoord(data){
  var lat = [];
  var lng = [];
  var cont = 0;
  for (var i=0;  i<data.length; i++) {
    lat[i] = parseFloat(data[i].lat);
    lng[i] = parseFloat(data[i].lng);
    cont ++;
  };
  return {lat: lat, lng: lng, cont: cont};
}

//funcion para eliminar los objetos de los poligonos en el 
//arreglo de la variable data
function dataRemove(data, attr, value){
  var i = data.length;
  while(i--){
    if(data[i] && data[i].hasOwnProperty(attr) && (arguments.length > 2 && data[i][attr] === value ) ){ 
      data.splice(i,1);
    }
  }
}

//fucion para actualizar el objeto dentro del array data y 
//los datos en el html
function actShape(shape){
  console.log(shape);
  //Actualizamos si es un circulo
  if(shape.type == google.maps.drawing.OverlayType.CIRCLE){
    google.maps.event.addListener(shape, "mouseout", function(){
      var idcoord = shape.id+'-coord';
      var coord = new Array();
      coord.push('Centro: '+shape.getCenter());
      coord.push(' Radio: '+shape.getRadius());
      document.getElementById(idcoord).innerHTML = coord;
      if(data){
        dataRemove(data, 'id', shape.id);
        data.push(shape);
        console.log('el objeto fue '+shape.id+' actualizado');
      } else {
        console.log('no existe elementos en data');
      }
    });
  }//if(shape.type == google.maps.drawing.OverlayType.CIRCLE)
  //Actualizamos si es un poligono
  if(shape.type == google.maps.drawing.OverlayType.POLYGON || shape.type == google.maps.drawing.OverlayType.POLYLINE){
    google.maps.event.addListener(shape, "mouseout", function(path){
      path = shape.getPath();
      var idcoord = shape.id+'-coord';
      var coord = new Array();
      for(var i = 0; i < path.length; i++) {
        coord[i] = path.getAt(i);
      }
      document.getElementById(idcoord).innerHTML = coord;
      if(data){
        dataRemove(data, 'id', shape.id);
        data.push(shape);
        console.log('el objeto fue '+shape.id+' actualizado');
      } else {
        console.log('no existe elementos en data');
      }
    });
  }//if(shape.type == google.maps.drawing.OverlayType.POLYGON){
  if(shape.type == google.maps.drawing.OverlayType.RECTANGLE){
    google.maps.event.addListener(shape, "mouseout", function(){
      var idcoord = shape.id+'-coord';
      var coord = new Array();
      coord.push(shape.getBounds());
      document.getElementById(idcoord).innerHTML = coord;
      if(data){
        dataRemove(data, 'id', shape.id);
        data.push(shape);
        console.log('el objeto fue '+shape.id+' actualizado');
      } else {
        console.log('no existe elementos en data');
      }
    });
  }
}

//funcion para cambiar el poligono seleccionado cuando se hace click en el
//mapa, otro poligono, etc.
function clearSelection() {
  if (selectedShape) {
    selectedShape.setEditable(false);
    selectedShape.setDraggable(false);
    selectedShape = null;
  }
}

//funcion para seleccionar y hacer editable el poligono en el mapa
function setSelection(shape) {
  clearSelection();
  selectedShape = shape;
  shape.setEditable(true);
  shape.setDraggable(true);
  selectColor(shape.get('fillColor') || shape.get('strokeColor'));
  actShape(selectedShape);
  console.log('el objeto '+selectedShape.id+' esta seleccionado');
}

//funcion que genera dinamicamente el evento por cada elemento cargado en loadMap()
function loadSetSelection(shape){
  google.maps.event.addListener(shape, 'click', function() {
      setSelection(shape);
  });
}

//funcion que elimina el poligono del mapa
function deleteSelectedShape() {
  if(selectedShape){
    if(data){
      dataRemove(data, 'id', selectedShape.id);
      console.log('Objeto '+selectedShape.id+' eliminado');
      console.log(data);
    }
    if(task == 1){
      var parent = document.getElementById('datos-poligonos-new');
      var child = document.getElementById(selectedShape.id);
      parent.removeChild(child);
    }
    if(task == 2){
      var parent = document.getElementById('datos-poligonos-load');
      var child = document.getElementById(selectedShape.id);
      parent.removeChild(child);
    }
    selectedShape.setMap(null);
  }
}

//funcion para seleccionar y predeterminar los colores de los poligonos
function selectColor(color) {
  selectedColor = color;
  for (var i = 0; i < colors.length; ++i) {
    var currColor = colors[i];
    colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
  }
  // Se obtiene las opciones acutal del drawing manager y se reemplaza
  // el stroke o el fill por el color seleccionado.
  var polylineOptions = drawingManager.get('polylineOptions');
  polylineOptions.strokeColor = color;
  drawingManager.set('polylineOptions', polylineOptions);

  var rectangleOptions = drawingManager.get('rectangleOptions');
  rectangleOptions.fillColor = color;
  drawingManager.set('rectangleOptions', rectangleOptions);

  var circleOptions = drawingManager.get('circleOptions');
  circleOptions.fillColor = color;
  drawingManager.set('circleOptions', circleOptions);

  var polygonOptions = drawingManager.get('polygonOptions');
  polygonOptions.fillColor = color;
  drawingManager.set('polygonOptions', polygonOptions);
}

//funcion para poner el color al poligono que se elija de la paleta
//de colores 
function setSelectedShapeColor(color) {
  if (selectedShape) {
    if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
      selectedShape.set('strokeColor', color);
    } else {
      selectedShape.set('fillColor', color);
    }
  }
}

//funcion que construye los botones de colores para el html
function makeColorButton(color) {
  var button = document.createElement('span');
  button.className = 'color-button';
  button.style.backgroundColor = color;
  google.maps.event.addDomListener(button, 'click', function() {
    selectColor(color);
    setSelectedShapeColor(color);
  });
  return button;
}

//Funcion para construir la paleta de colores en el html y
//selecciona el color predeterminador de los poligonos
function buildColorPalette(id) {
    var colorPalette = document.getElementById(id);
    for (var i = 0; i < colors.length; ++i) {
      var currColor = colors[i];
      var colorButton = makeColorButton(currColor);
      colorPalette.appendChild(colorButton);
      colorButtons[currColor] = colorButton;
    }
    selectColor(colors[0]);
}

//funcion para habilitar en el html la seccion de crear un nuevo mapa
function crearMapa(){
  document.getElementById('crear-mapa').style.display = 'none';
  document.getElementById('form-new-mapa').style.display = 'inherit';
  task = 1;
  initialize();
}

//funcion para habilitar en el html la seccion de cargar un mapa
function cargarMapa(){
  document.getElementById('crear-mapa').style.display = 'none';
  document.getElementById('form-load-mapa').style.display = 'inherit';
  task = 2;
  initialize();
}

//funcion ocultar la seccion actual en el html e ir a la posicion inicial
function cancelarMapa(){
  document.getElementById('crear-mapa').style.display = 'inherit';
  document.getElementById('form-new-mapa').style.display = 'none';
  document.getElementById('form-load-mapa').style.display = 'none';
  eliminarInputs();
  task = 0;
  initialize();
}

//funcion para eliminar los elementos hmtl de la seccion de crear un mapa si se cancela
function eliminarInputs(){
  if(task == 1){
    var div =document.getElementById('datos-poligonos-new').getElementsByTagName('div');
    while(div.length){
      div[0].parentNode.removeChild(div[0]);
    }
    var span =document.getElementById('palette-new').getElementsByTagName('span');
    while(span.length){
      span[0].parentNode.removeChild(span[0]);
    }
    data = [];
  }
  if(task == 2){
    var div =document.getElementById('datos-poligonos-load').getElementsByTagName('div');
    while(div.length){
      div[0].parentNode.removeChild(div[0]);
    }
    var span =document.getElementById('palette-load').getElementsByTagName('span');
    while(span.length){
      span[0].parentNode.removeChild(span[0]);
    }
    data = [];
  }
}

//funcion que envia dentro de un array todos los poligonos en objetos creados
function submitForm(){
  if(task == 1){
    if(data.length != 0){
      console.log(data);
      alert('Data enviada');
    } else {
      alert('No existe ningun elemento para enviar');
    }
  }
  if(task == 2){
    if(data.length != 0){
      console.log(data);
      alert('Data enviada');
    } else {
      alert('No existe ningun elemento para enviar');
    }
  }
}

//funcion para obtener posicion mediante html5
function loadGeoLocation(map){
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(position){
      var pos = new google.maps.LatLng(
        position.coords.latitude, 
        position.coords.longitude
      );
      map.setCenter(pos);
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    handleNoGeolocation(false);
  }
}//function loadGeoLocation(map){

//funcion para obtener el centro del mapa
function getMapCenter(map){
  if(task == 1){
    google.maps.event.addListener(map, "dragend", function(){
      var htmlStr = map.getCenter();
      document.getElementById('mapa-centro').value = htmlStr;
    });
    google.maps.event.addListener(map, "dblclick", function(){
      var htmlStr = map.getCenter();
      document.getElementById('mapa-centro').value = htmlStr;
    });
  }
  if(task == 2){
    google.maps.event.addListener(map, "dragend", function(){
      var htmlStr = map.getCenter();
      document.getElementById('mapa-centro-load').value = htmlStr;
    });
    google.maps.event.addListener(map, "dblclick", function(){
      var htmlStr = map.getCenter();
      document.getElementById('mapa-centro-load').value = htmlStr;
    });
  }
}

//funcion de error de la obtencion de la posicion html5
function handleNoGeolocation(errorFlag) {
  if (errorFlag) {
    var content = 'Error: The Geolocation service failed.';
  } else {
    var content = 'Error: Your browser doesn\'t support geolocation.';
  }
  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };
  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}//function handleNoGeolocation(errorFlag)

//funcion para crear un nuevo mapa
function createMapa(map){
  data = [];
  loadGeoLocation(map);
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.POLYGON, 
                    google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.RECTANGLE]
    },
    circleOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    polygonOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    polylineOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    rectangleOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    map: map
  });
  // Clear the current selection when the drawing mode is changed, or when the
  // map is clicked.
  google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
  google.maps.event.addListener(map, 'click', clearSelection);
  google.maps.event.addDomListener(document.getElementById('delete-button-new'), 'click', deleteSelectedShape);
  //Se contruye la paleta de colores y se predetermina o selecciona el color de los
  //poligonos
  buildColorPalette('palette-new');
  //Contador para los poligonos
  var contpol = 0;
  //obtenemos el centro del mapa cada vez que movemos el centro del mismo
  getMapCenter(map);
  //···Agregamos todos los listener necesarios
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
    //···Regresa a el modo de no dibujar despues de dibujar un poligono.
    drawingManager.setDrawingMode(null);
    // Agregamos un evento listener que selecciona una nuevo poligono
    // cuando el usuario lo seleccione.
    var newShape = e.overlay;
    newShape.type = e.type;
    newShape.id = e.type+'-'+contpol;
    google.maps.event.addListener(newShape, 'click', function() {
      setSelection(newShape);
    });
    setSelection(newShape);
    //···Aqui se captura el dom para mostar las coordenadas de los poligonos en el html
    //obtener datos circulo
    if(e.type == google.maps.drawing.OverlayType.CIRCLE){
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del circulo:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Circulo"/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">Centro: '+e.overlay.getCenter()+' Radio: '+e.overlay.getRadius()+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-new').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos poligono
    if(e.type == google.maps.drawing.OverlayType.POLYGON){
      path = e.overlay.getPath();
      var coord = new Array();
      for(var i = 0; i < path.length; i++) {
        coord[i] = path.getAt(i);
      }
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del poligono:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Poligono"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+coord+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-new').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos de linea
    if(e.type == google.maps.drawing.OverlayType.POLYLINE){
      path = e.overlay.getPath();
      var coord = new Array();
      for(var i = 0; i < path.length; i++) {
        coord[i] = path.getAt(i);
      }
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre de la linea:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre de la Linea"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+coord+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-new').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos Rectangulo
    if(e.type == google.maps.drawing.OverlayType.RECTANGLE){
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del rectangulo:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Rectangulo"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+e.overlay.getBounds()+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-new').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
  });
}

//funcion para cargar un mapa
function loadMapa(map) {
  //contador para saber los elementos que hay en el mapa
  var contpol = 0;
  //Variable que va a guardar los poligonos cargados
  var loadShape = [];
  //array con todos los objetos que deseamos cargar en el mapa
  data = [{type: 'mapa', mapaName: 'reparto Valencia', mapaCenter: [{lat: '39.458284025925586', lng: '-0.35743645378419453'}]},
          {type: 'circle', id: 'circle-0', name: 'circulo de prueba', fillColor: '#1F5BFF', center: [{lat: '39.469197510798324', lng: '-0.3840923309326172'}], 
            radius: '461.91458431422524'},
          {type: 'polygon', id: 'polygon-1', name: 'poligono de prueba', fillColor: '#1F5BFF', coords: [{lat: '39.46999260717818', lng: '-0.3801441192626953'},
            {lat: '39.47410046040123', lng: '-0.3744792938232422'},{lat: '39.467872329975165', lng: '-0.3709602355957031'}]},
          {type: 'rectangle', id: 'rectangle-3', name: 'rectangulo de prueba', fillColor: '#4B0082', coords:[{lat: '39.464824318306455', lng: '-0.3802299499511719'},
            {lat: '39.47357042845268', lng: '-0.3561115264892578'}]},
          {type: 'polyline', id: 'polyline-2', name: 'linea de prueba', strokeColor: '#32CD32', coords: [{lat: '39.460782183888576', lng: '-0.391387939453125'},
            {lat: '39.46853492354142', lng: '-0.38555145263671875'}, {lat: '39.45905923556797', lng: '-0.3816032409667969'},
            {lat: '39.460782183888576', lng: '-0.391387939453125'}]}];
  //Drawing Manager
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [google.maps.drawing.OverlayType.CIRCLE, google.maps.drawing.OverlayType.POLYGON, 
                    google.maps.drawing.OverlayType.POLYLINE, google.maps.drawing.OverlayType.RECTANGLE]
    },
    circleOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    polygonOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    polylineOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    rectangleOptions: {
      strokeWeight: 1,
      editable: true,
      draggable: true
    },
    map: map
  });
  //Se contruye la paleta de colores y se predetermina o selecciona el color de los
  //poligonos
  buildColorPalette('palette-load');
  // Clear the current selection when the drawing mode is changed, or when the
  // map is clicked.
  google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
  google.maps.event.addListener(map, 'click', clearSelection);
  google.maps.event.addDomListener(document.getElementById('delete-button-load'), 'click', deleteSelectedShape);
  //1era parte cargamos los elementos desde la variable data
  //Recorremos el array, extraemos y procesamos todo el array data
  for (var i=0; i<data.length; i++) {
    //Extraemos los datos del mapa
    if(data[i].type == 'mapa'){
      var mapaName;
      var mapaCoord;
      var posMapa;
      mapaName = data[i].mapaName;
      mapaCoord = getCoord(data[i].mapaCenter);
      var lat = mapaCoord.lat[0];
      var lng = mapaCoord.lng[0];
      posMapa = new google.maps.LatLng(lat, lng);
      map.setCenter(posMapa);
      document.getElementById('mapa-nombre-load').value = data[i].mapaName;
      document.getElementById('mapa-centro-load').value = posMapa;
    }
    //Extraemos los datos de los circulos
    if(data[i].type == 'circle'){
      var tmp = getCoord(data[i].center);
      var lat = tmp.lat[0];
      var lng = tmp.lng[0];
      var coords = new google.maps.LatLng(lat, lng);
      var radius = parseFloat(data[i].radius);
      var fillColor = data[i].fillColor;
      loadShape[i-1] = new google.maps.Circle({
        center: coords,
        radius: radius,
        draggable: false,
        fillColor: fillColor,
        strokeWeight: 1,
        editable: false,
        map: map
      });
      loadShape[i-1].id = data[i].id;
      loadShape[i-1].type = data[i].type;
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', data[i].id);
      div.innerHTML = '<label for="'+data[i].id+'-name">Nombre del circulo:</label>';
      div.innerHTML += '<input id="'+data[i].id+'-name" name="'+data[i].id+'-name" type="text" class="form-control" placeholder="Nombre del Circulo" value="'+data[i].name+'"/>';
      div.innerHTML += '<label for="'+data[i].id+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+data[i].id+'-coord" name="'+data[i].id+'-coord" class="form-control" rows="3">Centro: '+coords+' Radio: '+radius+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+data[i].id+'-color" value="'+fillColor+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      var tmp2 = data[i].id.split('-');
      if(contpol < parseInt(tmp2[1])){
        contpol = parseInt(tmp2[1]);
      }
      loadSetSelection(loadShape[i-1]);
    }
    //Extraemos los datos de polygonos
    if(data[i].type == 'polygon'){
      var tmp = getCoord(data[i].coords);
      var coords = [];
      for(var j=0; j<tmp.cont; j++){
        coords.push(new google.maps.LatLng(tmp.lat[j], tmp.lng[j]));
      }
      var fillColor = data[i].fillColor;
      loadShape[i-1] = new google.maps.Polygon({
        paths: coords,
        draggable: false,
        fillColor: fillColor,
        strokeWeight: 1,
        editable: false,
        map: map
      });
      loadShape[i-1].id = data[i].id;
      loadShape[i-1].type = data[i].type;
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', data[i].id);
      div.innerHTML = '<label for="'+data[i].id+'-name">Nombre del poligono:</label>';
      div.innerHTML += '<input id="'+data[i].id+'-name" name="'+data[i].id+'-name" type="text" class="form-control" placeholder="Nombre del Poligono" value="'+data[i].name+'"/>';
      div.innerHTML += '<label for="'+data[i].id+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+data[i].id+'-coord" name="'+data[i].id+'-coord" class="form-control" rows="3">'+coords+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+data[i].id+'-color" value="'+fillColor+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      var tmp2 = data[i].id.split('-');
      if(contpol < parseInt(tmp2[1])){
        contpol = parseInt(tmp2[1]);
      }
      loadSetSelection(loadShape[i-1]);
    }
    //Extraemos los datos de Polilineas
    if(data[i].type == 'polyline'){
      var tmp = getCoord(data[i].coords);
      var coords = [];
      for(var j=0; j<tmp.cont; j++){
        coords.push(new google.maps.LatLng(tmp.lat[j], tmp.lng[j]));
      }
      var strokeColor = data[i].strokeColor;
      loadShape[i-1] = new google.maps.Polyline({
        path: coords,
        draggable: false,
        strokeColor: strokeColor,
        strokeWeight: 1,
        editable: false,
        map: map
      });
      loadShape[i-1].id = data[i].id;
      loadShape[i-1].type = data[i].type;
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', data[i].id);
      div.innerHTML = '<label for="'+data[i].id+'-name">Nombre de la linea:</label>';
      div.innerHTML += '<input id="'+data[i].id+'-name" name="'+data[i].id+'-name" type="text" class="form-control" placeholder="Nombre de la Linea" value="'+data[i].name+'"/>';
      div.innerHTML += '<label for="'+data[i].id+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+data[i].id+'-coord" name="'+data[i].id+'-coord" class="form-control" rows="3">'+coords+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+data[i].id+'-color" value="'+strokeColor+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      var tmp2 = data[i].id.split('-');
      if(contpol < parseInt(tmp2[1])){
        contpol = parseInt(tmp2[1]);
      }
      loadSetSelection(loadShape[i-1]);
    }
    //Extraemos los datos de Rectangulos
    if(data[i].type == 'rectangle'){
      var tmp = getCoord(data[i].coords);
      var sw = new google.maps.LatLng(tmp.lat[0], tmp.lng[0]);
      var nw = new google.maps.LatLng(tmp.lat[1], tmp.lng[1]);
      var bounds = new google.maps.LatLngBounds(sw,nw);
      var fillColor = data[i].fillColor;
      loadShape[i-1] = new google.maps.Rectangle({
        bounds: bounds,
        fillColor: fillColor,
        draggable: false,
        editable: false,
        strokeWeight: 1,
        map: map
      });
      loadShape[i-1].id = data[i].id;
      loadShape[i-1].type = data[i].type;
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', data[i].id);
      div.innerHTML = '<label for="'+data[i].id+'-name">Nombre del rectangulo:</label>';
      div.innerHTML += '<input id="'+data[i].id+'-name" name="'+data[i].id+'-name" type="text" class="form-control" placeholder="Nombre del Rectangulo" value="'+data[i].name+'"/>';
      div.innerHTML += '<label for="'+data[i].id+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+data[i].id+'-coord" name="'+data[i].id+'-coord" class="form-control" rows="3">'+bounds+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+data[i].id+'-color" value="'+fillColor+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      var tmp2 = data[i].id.split('-');
      if(contpol < parseInt(tmp2[1])){
        contpol = parseInt(tmp2[1]);
      }
      loadSetSelection(loadShape[i-1]);
    }
  }
  //listener para actualizar las coordenadas del mapa
  getMapCenter(map);
  //Sumamos +1 al contador de los elementos del mapa
  contpol++;
  //2da Parte
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
    //···Regresa a el modo de no dibujar despues de dibujar un poligono.
    drawingManager.setDrawingMode(null);
    // Agregamos un evento listener que selecciona una nuevo poligono
    // cuando el usuario lo seleccione.
    var newShape = e.overlay;
    console.log(newShape);
    newShape.type = e.type;
    newShape.id = e.type+'-'+contpol;
    google.maps.event.addListener(newShape, 'click', function() {
      setSelection(newShape);
    });
    setSelection(newShape);
    //···Aqui se captura el dom para mostar las coordenadas de los poligonos en el html
    //obtener datos circulo
    if(e.type == google.maps.drawing.OverlayType.CIRCLE){
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del circulo:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Circulo"/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">Centro: '+e.overlay.getCenter()+' Radio: '+e.overlay.getRadius()+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos poligono
    if(e.type == google.maps.drawing.OverlayType.POLYGON){
      path = e.overlay.getPath();
      var coord = new Array();
      for(var i = 0; i < path.length; i++) {
        coord[i] = path.getAt(i);
      }
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del poligono:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Poligono"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+coord+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos de linea
    if(e.type == google.maps.drawing.OverlayType.POLYLINE){
      path = e.overlay.getPath();
      var coord = new Array();
      for(var i = 0; i < path.length; i++) {
        coord[i] = path.getAt(i);
      }
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre de la linea:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre de la Linea"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+coord+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
    //obtener datos Rectangulo
    if(e.type == google.maps.drawing.OverlayType.RECTANGLE){
      var div = document.createElement('div');
      div.className = 'form-group';
      div.setAttribute('id', e.type+'-'+contpol);
      div.innerHTML = '<label for="'+e.type+'-'+contpol+'-name">Nombre del rectangulo:</label>';
      div.innerHTML += '<input id="'+e.type+'-'+contpol+'-name" name="'+e.type+'-'+contpol+'-name" type="text" class="form-control" placeholder="Nombre del Rectangulo"/><br/>';
      div.innerHTML += '<label for="'+e.type+'-'+contpol+'-coord">Coordenadas:</label>';
      div.innerHTML += '<textarea id="'+e.type+'-'+contpol+'-coord" name="'+e.type+'-'+contpol+'-coord" class="form-control" rows="3">'+e.overlay.getBounds()+'</textarea>';
      div.innerHTML += '<input type="hidden" name="'+e.type+'-'+contpol+'-color" value="'+e.overlay.get('fillColor')+'"/>';
      document.getElementById('datos-poligonos-load').appendChild(div);
      data.push(newShape);
      contpol ++;
    }
  });
}//function loadMapa(map)

//funcion que inicializa el mapa en la pagina
function initialize() {
  var mapCanvas = document.getElementById('map_canvas');
  var mapOptions = {
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: true,
    zoomControl: true
  }
  map = new google.maps.Map(mapCanvas, mapOptions);
  if(task == 0){
    loadGeoLocation(map);
  }
  //Creacion de un nuevo mapa
  if(task == 1) {
    createMapa(map);
  }//if(task == 1)
  //Modificar un nuevo Mapa
  if(task == 2){
    loadMapa(map);
  }// if(task == 2){
}//function initialize()

//funcion para cargar el script de google mas + apiKey
function loadScript() {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "http://maps.googleapis.com/maps/api/js?v=3.9&key=AIzaSyDNOl2Tj0RXU-EYQ_ZVePb6bFPEAydmurE&sensor=TRUE&libraries=drawing&callback=initialize";
  document.body.appendChild(script);
}//function loadScript()
window.onload = loadScript;