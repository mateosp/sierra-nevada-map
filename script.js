var imageContainerMargin = 70;

var storyFiles = {
  historia1: 'depuracion_adaptado.geojson',
  historia2: 'p2.geojson',
  historia3: 'p2.geojson'
};

var currentStoryKey = 'historia1';
var currentStoryLayer = null;

function initMap() {
  var map = L.map('map', {
    center: [0, 0],
    zoom: 5,
    scrollWheelZoom: false
  });

  var natGeo = L.tileLayer('https://server.arcgisonline.com/arcgis/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);

  var darkAll = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
  });

  var baseMaps = {
    'Claro': natGeo,
    'Oscuro': darkAll
  };

  L.control.layers(baseMaps).addTo(map);

  map.attributionControl.setPrefix('View <a href="http://github.com/jackdougherty/leaflet-storymap" target="_blank">code on GitHub</a>, created with <a href="http://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');

  $('.story-nav-button').on('click', function() {
    var storyKey = $(this).data('story');
    if (storyKey === currentStoryKey) {
      return;
    }

    currentStoryKey = storyKey;
    $('.story-nav-button').removeClass('active');
    $(this).addClass('active');
    loadStory(map, storyFiles[storyKey]);
  });

  loadStory(map, storyFiles[currentStoryKey]);
}

function loadStory(map, geojsonUrl) {
  if (currentStoryLayer) {
    map.removeLayer(currentStoryLayer);
  }

  $('#contents').empty();
  $('#contents').scrollTop(0);

  $.getJSON(geojsonUrl, function(data) {
    var sections = [];

    currentStoryLayer = L.geoJson(data, {
      onEachFeature: function(feature, layer) {
        (function(layer, properties) {
          var numericMarker = L.ExtraMarkers.icon({
            icon: 'fa-number',
            number: properties.id,
            markerColor: 'blue'
          });
          layer.setIcon(numericMarker);

          var containerSource = $('#container-template').html();
          var containerTemplate = Handlebars.compile(containerSource);

          var output = {
            containerId: 'container' + properties.id,
            chapter: properties.chapter,
            imgSrc: properties.image,
            srcHref: properties['source-link'],
            srcText: properties['source-credit'],
            description: properties.description
          };

          var html = containerTemplate(output);
          $('#contents').append(html);

          var i;
          var areaTop = -100;
          var areaBottom = 0;

          for (i = 1; i < properties.id; i++) {
            areaTop += $('#container' + i).height() + imageContainerMargin;
          }

          areaBottom = areaTop + $('#container' + properties.id).height();

          sections.push({
            id: properties.id,
            top: areaTop,
            bottom: areaBottom,
            coords: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
            zoom: properties.zoom
          });

          layer.on('click', function() {
            $('#contents').animate({ scrollTop: areaTop + 'px' });
          });
        })(layer, feature.properties);
      }
    });

    $('#container1').addClass('inFocus');
    $('#contents').append("<div class='space-at-the-bottom'><a href='#space-at-the-top'><i class='fa fa-chevron-up'></i></br><small>Top</small></a></div>");
    currentStoryLayer.addTo(map);
    map.fitBounds(currentStoryLayer.getBounds());

    $('#contents').off('scroll.story').on('scroll.story', function() {
      var scrollTop = $(this).scrollTop();
      var activeSection = null;

      sections.forEach(function(section) {
        if (scrollTop >= section.top && scrollTop < section.bottom) {
          activeSection = section;
        }
      });

      if (activeSection) {
        $('.image-container').removeClass('inFocus').addClass('outFocus');
        $('#container' + activeSection.id).addClass('inFocus').removeClass('outFocus');
        map.flyTo(activeSection.coords, activeSection.zoom);
      }
    });
  });
}

initMap();
