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
import { DataSource } from "./DataSource";
// @ts-ignore
import proj4 from "proj4";
import { GeoJsonShape } from "./GeoJson";
import { Coordinate, Region } from "../geom";
import { PlaybackInstant } from "../PlaybackService";

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

/**
 * A data source that directly queries H5 for GHI data.
 */ 
export class H5DataSource implements DataSource {
    url: string = "https://developer.nrel.gov/api/hsds/"
    apiKey: string = "3K3JQbjZmWctY0xmIfSYvYgtIcM3CN0cb1Y2w9bf"
    host: string = "/nrel/wtk-us.h5"
    ghiLink: Link | undefined

    static dataStart: DateTime = DateTime.fromISO("2007-01-01T00:00")
    static nrelProj = new proj4.Proj('+proj=lcc +lat_1=30 +lat_2=60 +lat_0=38.47240422490422 +lon_0=-96.0 +x_0=0 +y_0=0 +ellps=sphere +units=m +no_defs')
    static epsg3857 = new proj4.Proj('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs')

    constructor() {
        // This section does some initial queries against the data soruce to discover what is available
        // and how to query it in the future
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
            })
            .catch(err => {
                console.log(err);
            })
    }

    onTimeChanged(instant: PlaybackInstant) {
        // This doesn't do anything with future data so this function is empty.
    }

    get(timestamp: DateTime): Promise<GeoJsonShape> {
        if (!this.ghiLink) {
            return Promise.reject("Configuration not yet loaded");
        }
        // The coordinate definitions are given at https://github.com/NREL/hsds-examples
        const xDomain = { min: 0, max: 1601 }
        const yDomain = { min: 0, max: 2975 }

        const timeSelect = H5DataSource.selectStringTime(timestamp)
        if (timeSelect === undefined) {
            return Promise.reject("Time too early - such data");
        }

        const ss = `[${timeSelect},${H5DataSource.selectStringGeographic(xDomain, yDomain)}]`;
        const selectString = `value?select=${ss}`;
        const hostString = `&host=${this.host}`;
        const apiString = `&api_key=${this.apiKey}`;
        const selectUrl = `${this.url}/datasets/${this.ghiLink && this.ghiLink.id}/${selectString}${hostString}${apiString}`;
        return fetch(selectUrl)
            .then(resp => resp.json())
            .then(data => {
                // Returns a 2D array of values
                // The first index is related to the i coordinate
                // The second index is related to the j coordinate
                const geojson = Promise.resolve(H5DataSource.mapArrayToGeoJson(xDomain, yDomain, data.value[0]));
                console.log("data fetch completed")
                return geojson;
            })
    }

    static selectStringTime(timestamp: DateTime): string | undefined {
        const diffInHours = Math.round(timestamp.diff(H5DataSource.dataStart).as("hours"));

        if (diffInHours < 0) {
            return;
        }
        console.log(diffInHours)
        // return `${this.t}:${this.t+1}`;
        // TODO this should be the difference in hours starting from '2007-01-01T00:00'
        return `${diffInHours}:${diffInHours+1}`;
    }

    /**
     * Get the part of the select string that specifies the i and j coordinates.
     * @param xDomain The domain that we are requesting in the X direction, expressed as H5 coordinates.
     * @param yDomain The domain that we are requesting in the Y direction, expressed as H5 coordinates.
     * @return A string in the format xmin:xmax:xstep;,min:ymax:ystep
     */
    static selectStringGeographic(xDomain: Domain, yDomain: Domain): string {
        const iSkip = Math.round((xDomain.max - xDomain.min) / 50);
        const jSkip = Math.round((yDomain.max - yDomain.min) / 50);
        const iString = `${xDomain.min}:${xDomain.max}:${iSkip}`;
        const jString = `${yDomain.min}:${yDomain.max}:${jSkip}`;
        return `${iString},${jString}`;
    }

    /**
     * Convert the array of data points from H5 response into 
     * @param xDomain The x domain that was requested.
     * @param yDomain The y domain that was requested.
     * @param data The data for a particular timestamp.
     */
    static mapArrayToGeoJson(xDomain: Domain, yDomain: Domain, data: number[][]): GeoJsonShape {
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

    /**
     * Convert the H5 data, which is indexed with integral values, into decimal degrees
     * (that is, traditional lat and long).
     * @param i The i coordinate value.
     * @param j The j coordinate value.
     */
    static fromH5ToLatLon(i: number, j: number): Coordinate {
        let lat = j * 2000 - 2975465.0557618504
        let lon = i * 2000 - 1601248.319293951

        const coords = proj4(H5DataSource.nrelProj, proj4.WGS84, [lat, lon])
        return new Coordinate(coords[0], coords[1])
    }
}
