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
// @ts-ignore
import { Map, View } from 'ol'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Stamen from 'ol/source/Stamen'
import {Modify} from 'ol/interaction'
import {Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import 'ol/ol.css'
import {Coordinate, Region} from './geom'
import * as d3ScaleChromatic from 'd3-scale-chromatic';
import './map.less'

type MapProps = {
    target: Coordinate;
    extent: Region;
    onTargetChanged: (coord: Coordinate) => void;
    onExtentChanged: (region: Region) => void;
    width: number;
    height: number;
    data: any;
}

type MapState = {
    map: Map;
}

const createStyle = (feature: any) => {
    const color = d3ScaleChromatic.interpolateBlues(feature.values_.ghi / 300);
    new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 255)'
        })
    })
}

const style = 

export default class App extends React.Component<MapProps, MapState> {
    dataLayer: VectorLayer

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
        
        return (
            <div ref="mapContainer" id="mapContainer" style={{ width: mapWidth, height: mapHeight}} />
        );
    }

    componentDidMount() {
        const backgroundLayer = new TileLayer({
            source: new Stamen({
                layer: 'toner'
            }),
            opacity: 0.3
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
                    radius: 7,
                    fill: new Fill({
                      color: '#ffcc33'
                    })
                  })
            })
        })

        const view = new View({
            // Set the initial location to Boulder, CO
            center: [-11718716.28195593, 4869217.172379018],
            zoom: 3,
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
            layers: [this.dataLayer, backgroundLayer, markerLayer]
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
            })

            this.dataLayer.setSource(vectorSource)

            // @ts-ignore
            /*const newLayer = new HeatmapLayer({
                source: vectorSource,
                blur: 5,
                radius: 10,
                weight: (feature: any) => {
                    return feature.values_.ghi / 300;
                }
            });
            
            if (this.dataLayer) {
                this.state.map.removeLayer(this.dataLayer)
            }
            
            this.state.map.addLayer(newLayer)
            this.dataLayer = newLayer*/
        }
    }
}