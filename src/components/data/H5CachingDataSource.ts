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
import { H5DataSource } from "./H5DataSource";
import { GeoJsonShape } from "./GeoJson";
import { PlaybackInstant } from "../PlaybackService";

type DateTimeString = string;

export class H5CachingDataSource implements DataSource {
    private backingSource: H5DataSource = new H5DataSource()

    private dataCache: Map<DateTimeString, Promise<GeoJsonShape>> = new Map()

    onTimeChanged(instant: PlaybackInstant) {
        // We want to load up the next 10 time steps, so check in our data
        // cache for the next 10 time steps. Any one for which we don't yet
        // have the data, we then make a request for the backing source to load
        const currentTime = instant.current;
        let stepSize = instant.stepSize;
        for (let i = 0; i < 10; ++i) {
            const futureTime = currentTime.plus(stepSize);
            const cacheKey = H5CachingDataSource.toCacheKey(futureTime)
            if (!this.dataCache.has(cacheKey)) {
                this.dataCache.set(cacheKey, this.backingSource.get(futureTime));
            }
        }
    }

    /**
     * Retrieve the data for the specified timestamp.
     * @param timestamp The timestamp of interest to fetch.
     */
    get(timestamp: DateTime): Promise<GeoJsonShape> {
        const cacheKey = H5CachingDataSource.toCacheKey(timestamp);
        const futureData = this.dataCache.get(cacheKey);
        return futureData || this.backingSource.get(timestamp);
    }

    /**
     * Convert the timestamp into the key for the map.
     * @param timestamp The timestamp to convert.
     */
    private static toCacheKey(timestamp: DateTime): DateTimeString {
        return timestamp.toUTC().toISO();
    }
}