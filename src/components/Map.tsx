/*
 * Copyright 2019 Alex Niu, Garret Fick, Jitendra Rathour, Zhimin Shen
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import * as React from 'react'
import Typography from '@material-ui/core/Typography'
// @ts-ignore
import { Map, View } from 'ol'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Modify } from 'ol/interaction'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import 'ol/ol.css'
import { Coordinate, Region } from './geom'
import * as d3ScaleChromatic from 'd3-scale-chromatic'
import './map.less'
import MapNorthAmerica from './map-na.json'

type MapProps = {
    target: Coordinate;
    extent: Region;
    onTargetChanged: (coord: Coordinate) => void;
    onExtentChanged: (region: Region) => void;
    width: number;
    height: number;
    data: any;
    valueDomain: [number, number],
    units: string,
}

type MapState = {
    map: Map;
}

const colorFromValue = (value: number) => {
    return d3ScaleChromatic.interpolateGreys(1 - value);
}

const createStyle = (feature: any) => {
    const values = feature.values_;
    
    let divisor = 1;
    if (values.ghi) {
        divisor = 1100
    } else if (values.energy) {
        divisor = 3600000
    }
    // The largest value for GHI is about 1100. So we define that as our maximum
    return new Style({
        fill: new Fill({
          color: colorFromValue(feature.values_.ghi / divisor)
        }),
        stroke: new Stroke({
            width: 0.1,
            color: "white"
        })
    })
}

const borderStyle = new Style({
    stroke: new Stroke({
        width: 1,
        color: "#3f51b5"
    })
})


export default class App extends React.Component<MapProps, MapState> {
    dataLayer: VectorLayer
    timestamp: string

    constructor(props: MapProps) {
        super(props)

        // @ts-ignore
        this.dataLayer = new VectorLayer({
            source: new VectorSource({ features: [] }),
            style: createStyle
        });
    }

    render() {
        // body margin: 20 on right and left = 40 px
        // right chart width = 80px
        // total is width - 120 px

        const mapWidth = this.props.width;
        const mapHeight = this.props.height;
        if (this.state && this.state.map) {
            const curSize = this.state.map.getSize();
            if (! curSize || curSize[0] !== mapWidth || curSize[1] !== mapHeight) {
                this.state.map.setSize([mapWidth, mapHeight]);
            }
            
        }

        const minValue = this.props.valueDomain[0];
        const maxValue = this.props.valueDomain[1];
        const step = (maxValue - minValue) / 5
        const steps = [
            minValue,
            (minValue + step),
            (minValue + step * 2),
            (minValue + step * 3),
            (minValue + step * 4),
            maxValue
        ]

        const scale = steps.map(v => {
            return (
                <div key={"cc" + v} className={"map-legend__item"}>
                    <div key={"c" + v} style={{ backgroundColor: colorFromValue(v/maxValue) }}></div>
                    <Typography key={"t" + v} variant="body2">{v}</Typography>
                </div>);
        })
        
        return (
            <div>
                <div id="map-legend">
                    {scale}
                    {this.timestamp}
                </div>
                <div ref="mapContainer" id="map-container" style={{ width: mapWidth, height: mapHeight}} />
            </div>
        );
    }

    componentDidMount() {
        const backgroundSource = new VectorSource({
            features: (new GeoJSON()).readFeatures(MapNorthAmerica, {
                dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            })
        })
        const backgroundLayer = new VectorLayer({
            source: backgroundSource,
            style: () => borderStyle,
        });

        const markerPoint = new Point(this.props.target.toArray());
        const markerSource = new VectorSource({
            features: [
                new Feature({
                    geometry: markerPoint,
                    i: 0,
                    size: 20
                })
            ]
        });
        const markerLayer = new VectorLayer({
            source: markerSource,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                  }),
                  stroke: new Stroke({
                    color: '#ffcc33',
                    width: 2
                  }),
                  image: new CircleStyle({
                    radius: 5,
                    fill: new Fill({
                      color: '#ffcc33'
                    })
                  })
            })
        })

        const view = new View({
            // Set the initial location to Boulder, CO
            center: [-11718716.28195593, 4869217.172379018],
            zoom: 4,
        });
        view.on('change', (evt: Event) => {
            const extent = view.calculateExtent();
            const coord1 = new Coordinate(extent[0], extent[1]);
            const coord2 = new Coordinate(extent[2], extent[3]);
            this.props.onExtentChanged(new Region(coord1, coord2));
        })

        const map = new Map({
            view,
            // @ts-ignore
            target: this.refs.mapContainer,
            layers: [this.dataLayer, backgroundLayer, markerLayer],
            controls: [],
            interactions: []
        });

        const modify = new Modify({source: markerSource});
        modify.on('modifyend', (evt: any) => {
            // We only care if the modify event is for our marker
            if (evt.features.getLength() !== 1) {
                return;
            }
            
            const feature = evt.features.getArray()[0];
            if (feature.getGeometry() === markerPoint) {
                const coord = new Coordinate(markerPoint.getCoordinates()[0], markerPoint.getCoordinates()[1]);
                this.props.onTargetChanged(coord);
            }
        })
        map.addInteraction(modify);
    
        // save map and layer references to local state
        this.setState({ 
          map
        });
    }

    componentDidUpdate(prevProps: MapProps) {
        if (prevProps.data !== this.props.data && this.props.data) {
            const vectorSource = new VectorSource({
                features: (new GeoJSON()).readFeatures(this.props.data, {
                    dataProjection: 'EPSG:4326',
                  featureProjection: 'EPSG:3857'
                })
            });

            this.dataLayer.setSource(vectorSource);
            this.timestamp = this.props.data.properties.instant;
        }
    }
}