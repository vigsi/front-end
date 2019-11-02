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

import { DateTime, Interval } from "luxon";
import { Observable } from "rxjs";
import { DataCache } from './DataCache';

export type DataSeriesId = string;

/**
 * The definition of a data series. This defines what we know about
 * data series.
 */
export type DataSeriesDefinition = {
    id: DataSeriesId;
    name: string;
    color: string;
}

/**
 * The data source service is responsible for fetching and caching data
 * from the backend. We do this outside of the application state so that
 * receipt of data does not result in a call to rendering (or even a
 * diff of the virtual DOM).
 * 
 * This contains all of the information about the available series.
 */
export class DataSourceService {

    private dataCaches: Map<DataSeriesId, DataCache>;

    constructor(private host: string, private timeObservable: Observable<DateTime>) {
        this.dataCaches = new Map();
        timeObservable.subscribe((time) => this.updateCache(time));
    }

    /**
     * Get a list of the available data series that we can display.
     */
    getDataSeries() : Promise<DataSeriesDefinition[]> {
        const sources = [
            { id: "meas", name: "Measured", color: "#aa2e25" },
            { id: "arima", name: "ARIMA", color: "#1769aa" },
            { id: "nn", name: "Neural Net", color: "#00695f" },
        ];

        // Only populate the data caches once
        if (this.dataCaches.size === 0) {
            sources.forEach(source => {
                this.dataCaches.set(source.id, new DataCache(this.host, source.id))
                
            });
        }

        return Promise.resolve(sources);
    }

    /**
     * Gets the total data time range that is available.
     */
    getDataInterval() : Promise<Interval> {
        const now = DateTime.utc().set({ minute: 0, second: 0, millisecond: 0 });
        const start = now.minus({ years: 100 })
        DateTime.utc().set({minute: 0, second: 0, millisecond: 0});
        return Promise.resolve(
            Interval.fromDateTimes(
                start,
                now
            )
        );
    }

    get(id: DataSeriesId, timestamp: DateTime): Promise<any> {
        const cache = this.dataCaches.get(id);
        return cache && cache.get(timestamp) || Promise.reject("No such data series id");
    }

    private updateCache(currentTime: DateTime) {
        this.dataCaches.forEach(cache => cache.onTimeChanged(currentTime));
    }
}