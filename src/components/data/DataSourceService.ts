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
    desc: string;
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
        { id: "meashourly", name: "NREL (Hourly)", unit: "W/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/meashourly/", duration: Duration.fromObject({ hours: 1 }), desc: "Measured and modelled data from NREL wind database. Unlike other sets, these are instantaneous values."},
        { id: "measdaily", name: "NREL (Daily)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measdaily2/", duration: Duration.fromObject({ days: 1 }), desc: "Total daily solar energy as calculated by integrating the step-wise hourly measured data function."},
        { id: "measmonthly", name: "NREL (Monthly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measmonthly/", duration: Duration.fromObject({ months: 1 }), desc: "Total monthly solar energy as calculated by integrating the step-wise hour measured data function."},
        { id: "measyearly", name: "NREL (Yearly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/measyearly/", duration: Duration.fromObject({ years: 1 }), desc: "Total yearly solar energy as calculated by integrating the step-wise hour measured data function."},
        { id: "arimadaily", name: "ARIMA (Daily)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/arimadaily/", duration: Duration.fromObject({ days: 1 }), desc: "ARIMA predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly measured data function. Data prior to 2013 is in-sample; data from 2013 is out-of-sample. No data is available for 2007."},
        { id: "arimamonthly", name: "ARIMA (Monthly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/arimamonthly/", duration: Duration.fromObject({ months: 1 }), desc: "ARIMA predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly measured data function. Data prior to 2013 is in-sample; data from 2013 is out-of-sample. No data is available for 2007."},
        { id: "arimayearly", name: "ARIMA (Yearly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/arimayearly/", duration: Duration.fromObject({ years: 1 }), desc: "ARIMA predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly measured data function. Data prior to 2013 is in-sample; data from 2013 is out-of-sample. No data is available for 2007."},
        { id: "nndaily", name: "NN (Daily)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/nndaily/", duration: Duration.fromObject({ days: 1 }), desc: "Neural network predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly predicted data function. Data is only available for 2013."},
        { id: "nnmonthly", name: "NN (Monthly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/nnmonthly/", duration: Duration.fromObject({ months: 1 }), desc: "Neural network predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly predicted data function. Data is only available for 2013."},
        { id: "nnyearly", name: "NN (Yearly)", unit: "kJ/m²", color: "#aa2e25", type: "ss3", url: "https://vigsi-data-store.s3.us-east-2.amazonaws.com/nnyearly/", duration: Duration.fromObject({ years: 1 }), desc: "Neural network predicted data generated from hourly predictions, the aggregated by integrating the step-wise hourly predicted data function. Data is only available for 2013."},
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