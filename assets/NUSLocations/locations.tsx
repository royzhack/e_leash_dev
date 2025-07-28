import geojsonData from './map.json';

const locations = geojsonData.features
    .map((x) => ({
        label: x.properties.name,
        value: x.id
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

console.log(locations.filter(item => !item.label || !item.value));

export default locations;
