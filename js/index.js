var MDiMapGeocoder = require('mdimapgeocoder')
  , proj4 = require('proj4')

$(document).ready(function() {
  var geocoder = new MDiMapGeocoder()

  //$('#addressInput').val('1101 Camden Ave, Salisbury MD 21801')

  var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
  }).setView([38.9, -77.3], 7)

  L.tileLayer('http://{s}.tiles.mapbox.com/v3/esrgc.map-0y6ifl91/{z}/{x}/{y}.png', {
      attribution: false,
      maxZoom: 18
  }).addTo(map)

  L.tileLayer('http://{s}.tiles.mapbox.com/v3/esrgc.mdbdry/{z}/{x}/{y}.png', {
      attribution: false,
      maxZoom: 12
  }).addTo(map)

  map.on('click', function(e) {
    var coordinates = {
      x: e.latlng.lng,
      y: e.latlng.lat
    }
    $('.results').append('<br><span>Getting elevation...<br>')
    $('.results').append('<span>Location = ' + Math.round(coordinates.x * 100) / 100 + ', ' + Math.round(coordinates.y * 100) / 100  + '<br>')
    getElevationFromCoordinates(coordinates, true)
  })

  $('.getLocation').click(function() {
    var btn = $(this)
    btn.button('loading')
    $('.results').append('<br><span>Getting your location...<br>')
    navigator.geolocation.getCurrentPosition(function(position) {
      btn.button('reset')
      var coordinates = {x: position.coords.longitude, y: position.coords.latitude}
      $('.results').append('<span>Getting elevation...<br>')
      $('.results').append('<span>Location = ' + Math.round(coordinates.x * 100) / 100 + ', ' + Math.round(coordinates.y * 100) / 100  + '<br>')
      getElevationFromCoordinates(coordinates, false)
    })
  })

  $('#addressForm').submit(function(e) {
    e.preventDefault()
    var btn = $('#addressForm button')
    btn.button('loading')
    var address = $('#addressInput').val()
    $('.results').append('<br><span>Getting location of address...')
    geocoder.search(address, function(err, res) {
      btn.button('reset')
      if(err) {
      } else {
        if(res.candidates.length > 0) {
          $('.results').append('<br>')
          $('.results').append('<span>Getting elevation...<br>')
          $('.results').append('<span>Location = ' + address + '<br>')
          var coordinates = res.candidates[0].location
          getElevationFromCoordinates(coordinates, false)
        } else {
          $('.results').append('<br>')
          $('.results').append('<span>Address not found.<br>')
        }
      }
    })
    return false
  })

  function addMarker(coordinates, clicked) {
    var marker = L.marker([coordinates.y, coordinates.x])
    marker.addTo(map)
    if(clicked) {
      map.setView([coordinates.y, coordinates.x])
    } else {
      map.setView([coordinates.y, coordinates.x], 17)
    }
    return marker
  }

  function getElevationFromCoordinates(coordinates, clicked) {
    var marker = addMarker(coordinates, clicked)
    var id_url = 'http://lidar.salisbury.edu/ArcGIS/rest/services/DEM_m/MD_statewide_dem_m/ImageServer/identify'
    var stateplane = '+proj=lcc +lat_1=39.45 +lat_2=38.3 +lat_0=37.66666666666666 +lon_0=-77 +x_0=400000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs'
    var coords = proj4(stateplane,[coordinates.x, coordinates.y])

    var data = {
      f: 'json',
      geometryType: 'esriGeometryPoint',
      geometry: coords[0] + ',' + coords[1],
      returnGeometry: false,
      returnCatalogItems: false
    }
    $.ajax({
      url: id_url,
      type: "GET",
      data: data,
      dataType: 'json'
    })
    .done(function(res) {
      handleResponse(res, marker)
    })
    .fail(function(res){
      
    })
  }

  function handleResponse(res, marker) {
    $('.results').append(formatResponse(res) + '<br>')
    marker.bindPopup(formatResponse(res)).openPopup()
  }

  function formatResponse(res) {
    if(res.value === 'NoData') {
      return 'No Data at this location'
    } else {
      var meters = Math.round(res.value * 100) / 100
      var feet = Math.round((res.value*  3.28084) * 100) / 100
      var display = '<span class="elevation">Elevation = '
      display += meters + ' meters/'
      display += feet + ' feet'
      display += '</span>'
      return display
    }
  }

})

