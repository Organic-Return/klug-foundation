// Shared Google Maps grayscale style — the map tiles are desaturated
// neutrals so coloured markers (price tags, partner pins) sit cleanly
// on top. Inspired by the audemarspiguet.com/stores look: clean greys,
// hidden POIs, subtle administrative borders, light water.

export const grayscaleMapStyles: google.maps.MapTypeStyle[] = [
  // Base land geometry
  { elementType: 'geometry', stylers: [{ color: '#ececec' }] },

  // Default label colour
  { elementType: 'labels.text.fill', stylers: [{ color: '#6a6a6a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },

  // Country / state borders
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },

  // Open landscape
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#e6e6e6' }] },

  // Hide POIs entirely (parks, businesses, schools, etc.)
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },

  // Roads — white fill with a soft grey stroke
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d6d6d6' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },

  // Hide transit
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  // Water — soft neutral with very subtle blue lift
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d4d8db' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];
