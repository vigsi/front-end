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
import proj4 from 'proj4';

type Link = {
    class: string;
    collection: string;
    href: string;
    id: string;
    target: string;
    title: string;
}

export class H5DataSource implements DataSource {
    url: string = "https://developer.nrel.gov/api/hsds/"
    apiKey: string = "3K3JQbjZmWctY0xmIfSYvYgtIcM3CN0cb1Y2w9bf"
    host: string = "/nrel/wtk-us.h5"
    ghiLink: Link | undefined
    coordLink: Link | undefined

    nrelProj = new proj4.Proj('+proj=lcc +lat_1=30 +lat_2=60 +lat_0=38.47240422490422 +lon_0=-96.0 +x_0=0 +y_0=0 +ellps=sphere +units=m +no_defs')

    constructor() {
        proj4.defs('NREL:01', '+proj=lcc +lat_1=30 +lat_2=60 +lat_0=38.47240422490422 +lon_0=-96.0 +x_0=0 +y_0=0 +ellps=sphere +units=m +no_defs')
        
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

        var coord = this.fromLatLonToH5(0, 0)
        console.log(coord)
        var back = this.fromH5ToLatLon(coord[0], coord[1])
        console.log(back)
    }

    selectStringTime() {
        // return `${this.t}:${this.t+1}`;
        // TODO this should be the difference in hours starting from '2007-01-01T00:00'
        return "0:1";
    }

    selectStringGeographic() {
        //let iString = `${this.istart}:${this.istop}:${this.iskip}`;
        //let jString = `${this.jstart}:${this.jstop}:${this.jskip}`;
        //return `${iString},${jString}`;
        return "0:1000:50,0:500:50"
    }

    onTimeChanged(currentTime: DateTime) {
        // The coordinate definitions are given at https://github.com/NREL/hsds-examples
        const ss = `[${this.selectStringTime()},${this.selectStringGeographic()}]`;
        const selectString = `value?select=${ss}`;
        const hostString = `&host=${this.host}`;
        const apiString = `&api_key=${this.apiKey}`;
        const selectUrl = `${this.url}/datasets/${this.ghiLink && this.ghiLink.id}/${selectString}${hostString}${apiString}`;
        fetch(selectUrl)
            .then(resp => resp.json())
            .then(data => {
                // Returns a 2D array of values
                // The first index is related to the i coordinate
                // The second index is related to the j coordinate
                console.log(data)
            })
            .catch(err => {
                console.log(err)
            })
    }

    private fromLatLonToH5(lat:number, lon:number): number[] {
        const origin = [-2975465.0557618504, -1601248.319293951];
        const coords = proj4(this.nrelProj, [lat, lon]);

        const i = Math.round((coords[1] - origin[1]) / 2000)
        const j = Math.round((coords[0] - origin[0]) / 2000)

        return [i, j]
    }

    private fromH5ToLatLon(i: number, j: number): number[] {
        let lat = j * 2000 - 2975465.0557618504
        let lon = i * 2000 - 1601248.319293951

        const coords = proj4(this.nrelProj, proj4.WGS84, [lat, lon])
        return coords
    }

    /*ijForCoord(lat, long) {
        // [0][0] in lcc projected coordinates
        let origin = [-2975465.0557618504, -1601248.319293951];
        let coords = proj4('NREL:01', [lat, long]);
        let ij = [-1, -1];
        for (let i = 0; i <= 1; i++) {
          ij[1-i] = Math.round((coords[i] - origin[i])/2000);
        }
        return ij;
      }*/

    get(timestamp: DateTime): Promise<any> {
        return Promise.reject("no such data");
    }
}
