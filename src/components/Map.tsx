/*
 * Copyright 2019 Alex Niu, Garret Fick, Jitendra Rathour, Zhimen Shen
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
import { Map, View } from 'ol'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Stamen from 'ol/source/Stamen'
import {Modify} from 'ol/interaction'
import {Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import 'ol/ol.css'
import {Coordinate} from './geom'
import './map.less'

type MapProps = {
    target: Point | undefined;
    onTargetMoved: (coord: Coordinate) => void;
}

type MapState = {
    map: Map;
}

export default class App extends React.Component<MapProps, MapState> {
    constructor(props: MapProps) {
        super(props)
    }

    render() {
        // We return a single div that will contain the map. It has
        // not content until the component is mounted and we make sure
        // that it always exists.
        return (
            <div ref="mapContainer" id="mapContainer"></div>
        );
    }

    componentDidMount() {
        const backgroundLayer = new TileLayer({
            source: new Stamen({
                layer: 'toner'
            })
          });

        const markerPoint = new Point([-11718716, 4869217]);
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

        const map = new Map({
            target: this.refs.mapContainer,
            layers: [backgroundLayer, markerLayer],
            view: new View({
                center: [-11718716.28195593, 4869217.172379018], //Boulder, CO
                zoom: 3,
            })
          });

        const modify = new Modify({source: markerSource});
        modify.on('modifyend', (evt: ModifyEvent) => {
            // We only care if the modify event is for our marker
            if (evt.features.getLength() != 1) {
                return;
            }
            
            const feature = evt.features.getArray()[0];
            if (feature.getGeometry() == markerPoint) {
                const coord = new Coordinate(markerPoint.getCoordinates()[0], markerPoint.getCoordinates()[1]);
                this.props.onTargetMoved(coord);
            }
        })
        map.addInteraction(modify);
    
        // save map and layer references to local state
        this.setState({ 
          map: map
        });
    

    }

    componentDidUpdate(prevProps: MapProps, prevState: MapState) {
        /*this.state.featuresLayer.setSource(
          new ol.source.Vector({
            features: this.props.routes
          })
        );*/
    }
    
    /*handleMapClick(event) {

        // create WKT writer
        var wktWriter = new ol.format.WKT();

        // derive map coordinate (references map from Wrapper Component state)
        var clickedCoordinate = this.state.map.getCoordinateFromPixel(event.pixel);

        // create Point geometry from clicked coordinate
        var clickedPointGeom = new ol.geom.Point( clickedCoordinate );

        // write Point geometry to WKT with wktWriter
        var clickedPointWkt = wktWriter.writeGeometry( clickedPointGeom );

    }*/
}