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
import { PlaybackInstant } from "../PlaybackService";
import { GeoJsonShape } from "./GeoJson";

export class SimpleUrlDataSource implements DataSource {
    constructor(private urlPrefix: string) {}

    onTimeChanged(timestamp: PlaybackInstant) {
                // This doesn't do anything with future data so this function is empty.
    }

    get(timestamp: DateTime): Promise<GeoJsonShape> {
        const url = this.urlPrefix + timestamp.toUTC().toISO().replace(/:/g, "")
        return fetch(url)
            .then(resp => resp.json())
            .then(features => {
                return {
                    'type': 'FeatureCollection',
                    'crs': {
                        'type': 'name',
                        'properties': {
                          'name': 'EPSG:4326'
                        }
                      },
                    'features': features,
                    'properties': {
                        'instant': timestamp.toISO(),
                        'source': 's3'
                    }
                }
            });
    }
}