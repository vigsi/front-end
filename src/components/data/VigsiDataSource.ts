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
import { GeoJsonShape } from "./GeoJson";
import { PlaybackInstant } from "../PlaybackService";

type UrlInfo = {
    url: string,
    retrieved: DateTime,
};

export class VigsiDataSource implements DataSource {
    // I would like the key to be not a string, but unfortunately that's not possible.
    // Even worse is I cannot make it a type alias.
    urls: Map<string, UrlInfo>

    data: Map<string, Promise<GeoJsonShape>>

    constructor(private host: string, private dataId: string) {
        this.urls = new Map()
        this.data = new Map()
    }

    onTimeChanged(instant: PlaybackInstant) {
        // Define the time range that we want to query for
        const startTime = instant.current.toISO();
        const endTime = instant.current.plus({ days: 2 }).toISO();

        const now = DateTime.local()

        fetch(this.host + '/api/' + this.dataId + '/' + startTime + '&' + endTime)
            .then(resp => resp.json())
            .then(urlDescriptions => {
                // Add the items to the store
                urlDescriptions.forEach((url:any) => {
                    const time: string = DateTime.fromISO(url.time).toUTC().toISO();
                    const urlAddress: string = url.url;
                    this.urls.set(time, {
                        url: urlAddress,
                        retrieved: now
                    });

                    if (!this.data.get(time)) {
                        const futureData: Promise<any> = fetch(urlAddress)
                            .then(resp => {
                                if (!resp.ok) {
                                    throw Error(resp.statusText)
                                }
                                return resp;
                            })
                            .then(resp => resp.text())
                            .then(text => console.log(text))
                            .catch(err => {
                                console.log(err)
                            })
                        this.data.set(time, futureData)
                    }
                })
            })
            .catch(err => {
                console.log(err)
            });
    }

    get(timestamp: DateTime): Promise<GeoJsonShape> {
        const str = timestamp.toUTC().toISO();
        const retriever = this.data.get(str);

        if (!retriever) {
            return Promise.reject("data is not available");
        }
        return retriever;
    }
}
