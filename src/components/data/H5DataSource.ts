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

import { DateTime } from "luxon";
import { DataSource } from './DataSource';
// @ts-ignore
import proj4 from 'proj4';
import { GeoJsonShape } from "./GeoJson";
import { Coordinate, Region, rotatePoints } from "../geom";

type Link = {
    class: string;
    collection: string;
    href: string;
    id: string;
    target: string;
    title: string;
}

type Domain = {
    min: number;
    max: number;
}

export class H5DataSource implements DataSource {
    url: string = "https://developer.nrel.gov/api/hsds/"
    apiKey: string = "3K3JQbjZmWctY0xmIfSYvYgtIcM3CN0cb1Y2w9bf"
    host: string = "/nrel/wtk-us.h5"
    ghiLink: Link | undefined
    coordLink: Link | undefined
    dataCache: Promise<GeoJsonShape> = Promise.reject("Data not yet loaded")

    static nrelProj = new proj4.Proj('+proj=lcc +lat_1=30 +lat_2=60 +lat_0=38.47240422490422 +lon_0=-96.0 +x_0=0 +y_0=0 +ellps=sphere +units=m +no_defs')
    static epsg3857 = new proj4.Proj('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs')

    constructor() {
        const rootGroupFetch = fetch(`${this.url}/?host=${this.host}&api_key=${this.apiKey}`)
            .then(resp => resp.json())
            .then(data => {
                let rootGroupUrl = data.hrefs.find((item: any) => item.rel == "root").href || "";
                rootGroupUrl += `&api_key=${this.apiKey}`;
                return fetch(rootGroupUrl);
            })
            .catch(err => {
                console.log(err)
            })

        const rootLinksFetch = rootGroupFetch.then(resp => resp && resp.json())
            .then(rootGroupData => {
                let rootLinkUrl = rootGroupData.hrefs.find((item: any) => item.rel == "links").href || "";
                rootLinkUrl += `&api_key=${this.apiKey}`;
                return fetch(rootLinkUrl);
            })
            .catch(err => {
                console.log(err);
            })

        rootLinksFetch.then(resp => resp && resp.json())
            .then(linksData => {
                this.ghiLink = (linksData.links.find((link: any) => link.title == "GHI") || {});
                this.coordLink = (linksData.links.find((link: any) => link.title == "coordinates") || {});
            })
            .catch(err => {
                console.log(err);
            })

        //var coord = this.fromLatLonToH5(0, 0)
        //console.log(coord)
        //var back = this.fromH5ToLatLon(coord[0], coord[1])
        //console.log(back)
    }

    selectStringTime() {
        // return `${this.t}:${this.t+1}`;
        // TODO this should be the difference in hours starting from '2007-01-01T00:00'
        return "0:1";
    }

    selectStringGeographic(xDomain: Domain, yDomain: Domain) {
        const iSkip = Math.round((xDomain.max - xDomain.min) / 50);
        const jSkip = Math.round((yDomain.max - yDomain.min) / 50);
        const iString = `${xDomain.min}:${xDomain.max}:${iSkip}`;
        const jString = `${yDomain.min}:${yDomain.max}:${jSkip}`;
        return `${iString},${jString}`;
    }

    onTimeChanged(currentTime: DateTime) {
        // The coordinate definitions are given at https://github.com/NREL/hsds-examples
        const xDomain = { min: 0, max: 1601 }
        const yDomain = { min: 0, max: 2975 }

        const ss = `[${this.selectStringTime()},${this.selectStringGeographic(xDomain, yDomain)}]`;
        const selectString = `value?select=${ss}`;
        const hostString = `&host=${this.host}`;
        const apiString = `&api_key=${this.apiKey}`;
        const selectUrl = `${this.url}/datasets/${this.ghiLink && this.ghiLink.id}/${selectString}${hostString}${apiString}`;
        fetch(selectUrl)
            .then(resp => resp.json())
            .then(data => {
                this.dataCache = 
                    Promise.resolve(H5DataSource.mapArrayToGeoJson(xDomain, yDomain, data.value[0]));
                // Returns a 2D array of values
                // The first index is related to the i coordinate
                // The second index is related to the j coordinate
            })
            .catch(err => {
                console.log(err)
            })
    }

    static mapArrayToGeoJson(xDomain: Domain, yDomain: Domain, data: number[][]) {
        // Just keeping for good measure so I don't forget
        // const h5Coords = H5DataSource.fromLatLonToH5(-120, 33)
        // const lonLat = H5DataSource.fromH5ToLatLon(696, 375)

        const xLen = data.length;
        const yLen = data[0].length;
        const xStep = (xDomain.max - xDomain.min) / xLen;
        const yStep = (yDomain.max - yDomain.min) / yLen;
           
        let features = []
        for (let xi = 0; xi < xLen; xi += 1) {
            const xMin = xDomain.min + xi * xStep
            const xMax = xDomain.min + (xi + 1) * xStep
            for (let yi = 0; yi < yLen; yi += 1) {
                const pt1 = H5DataSource.fromH5ToLatLon(xMin, yDomain.min + yi * yStep);
                const pt2 = H5DataSource.fromH5ToLatLon(xMax, yDomain.min + (yi + 1) * yStep);
                pt2.x += 0.4 * (pt2.x - pt1.x)
                const region = new Region(pt1, pt2);
                features.push(
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [region.toClosedPolygon()]
                        },
                        "properties": {
                            "ghi": data[xi][yi]
                        }
                    }
                );
            }
        }

        return {
            'type': 'FeatureCollection',
            'crs': {
                'type': 'name',
                'properties': {
                  'name': 'EPSG:4326'
                }
              },
            'features': features,
        }
    }

    static fromLatLonToH5(lon:number, lat:number): number[] {
        const origin = [-2975465.0557618504, -1601248.319293951];
        const coords = proj4(H5DataSource.nrelProj, [lon, lat]);

        const i = Math.round((coords[1] - origin[1]) / 2000)
        const j = Math.round((coords[0] - origin[0]) / 2000)

        return [i, j]
    }

    static fromH5ToLatLon(i: number, j: number): Coordinate {
        let lat = j * 2000 - 2975465.0557618504
        let lon = i * 2000 - 1601248.319293951

        const coords = proj4(H5DataSource.nrelProj, proj4.WGS84, [lat, lon])
        return new Coordinate(coords[0], coords[1])
    }

    get(timestamp: DateTime): Promise<GeoJsonShape> {
        return this.dataCache
    }
}
