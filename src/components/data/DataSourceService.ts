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

import { DateTime, Interval, Duration } from "luxon";
import { Observable } from "rxjs";
import { DataSource } from './DataSource';
import { H5DataSource } from "./H5DataSource";
import { CachingDataSource } from "./CachingDataSource";
import { VigsiDataSource } from "./VigsiDataSource";
import { GeoJsonShape } from "./GeoJson";
import { PlaybackInstant } from "../PlaybackService";
import { SimpleUrlDataSource } from "./SimpleUrlDataSource";

export type DataSeriesId = string;

/**
 * The definition of a data series. This defines what we know about
 * data series.
 */
export type DataSeriesDefinition = {
    id: DataSeriesId;
    name: string;
    color: string;
    url: string;
    type: string;
    duration: Duration;
    unit: string;
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

    private dataSources: Map<DataSeriesId, DataSource>;

    sources = [
        //{ id: "meas", name: "Measured", color: "#aa2e25", type: "vigsi" },
        //{ id: "arima", name: "ARIMA", color: "#1769aa", type: "vigsi" },
        //{ id: "nn", name: "Neural Net", color: "#00695f", type: "vigsi" },
        { id: "measdaily", name: "NREL (Daily)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measdaily2/", duration: Duration.fromObject({ days: 1 })},
        { id: "measmonthly", name: "NREL (Monthly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measmonthly/", duration: Duration.fromObject({ months: 1 })},
        { id: "measyearly", name: "NREL (Yearly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measyearly/", duration: Duration.fromObject({ years: 1 })},
        //{ id: "h5", name: "NREL", units: "W/m²", color: "#aa2e25", type: "h5", url: "", duration: Duration.fromObject({ hours: 1 })},
    ];

    constructor(private host: string, private timeObservable: Observable<PlaybackInstant>) {
        this.dataSources = new Map();
        timeObservable.subscribe((time) => this.updateCache(time));
    }

    getDataSeriesById(id: string): DataSeriesDefinition {
        return this.sources.filter(source => source.id == id)[0]
    }

    /**
     * Get a list of the available data series that we can display.
     */
    getDataSeries() : Promise<DataSeriesDefinition[]> {
        // Only populate the data caches once
        if (this.dataSources.size === 0) {
            this.sources.forEach(source => {
                let backend;
                if (source.type == "h5") {
                    backend = new CachingDataSource(new H5DataSource())
                } else if (source.type == "ss3") {
                    backend = new CachingDataSource(new SimpleUrlDataSource(source.url, source.duration))
                } else {
                    backend = new VigsiDataSource(this.host, source.id)
                }

                this.dataSources.set(source.id, backend);
            });
        }

        return Promise.resolve(this.sources);
    }

    /**
     * Gets the total data time range that is available.
     */
    getDataInterval() : Promise<Interval> {
        const end = DateTime.fromObject({ 
           year : 2013,
           month: 12,
           day: 31,
           zone: "UTC"
        });
        const start = DateTime.fromObject({
            year: 2007,
            month: 1,
            day: 1,
            zone: "UTC"
        });
        return Promise.resolve(
            Interval.fromDateTimes(
                start,
                end
            )
        );
    }

    get(id: DataSeriesId, timestamp: DateTime): Promise<GeoJsonShape> {
        const cache = this.dataSources.get(id);
        return cache && cache.get(timestamp) || Promise.reject("No data source with ID: " + id);
    }

    private updateCache(instant: PlaybackInstant) {
        this.dataSources.forEach(source => source.onTimeChanged(instant));
    }
}