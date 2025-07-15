import geojsonData from './map.json'
import {useMemo} from "react";

const locations = useMemo(() => geojsonData.features.map((x : any) =>
    (
        {
            label: x.properties.name,
            value: x.id
        }

    )).sort((a, b) => a.label.localeCompare(b.label)));

console.log(locations.filter(item => !item.label || !item.value));

export default locations;
