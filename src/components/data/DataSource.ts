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
import { GeoJsonShape } from "./GeoJson";
import { PlaybackInstant } from "../PlaybackService";

/**
 * Defines a data source for the application. This is an abstract
 * concept of some capability to get data that we will display.
 * 
 * The primary means to get data is the get function that returns a promise
 * to return the data in the future. To enable caching implementation
 * received notifications of when the time changed and the time step
 * size so that it can try to get data in advance.
 */
export interface DataSource {
    /**
     * Notifies the source of a time change. This source normally would
     * use this to fetch future data so that it is available when needed.
     * @param instant Information about the current time and the rate of
     * progression of time.
     */
    onTimeChanged(instant: PlaybackInstant): void;

    /**
     * Get the data for the particular timestamp.
     * @param timestamp The timestamp to get data for.
     */
    get(timestamp: DateTime): Promise<GeoJsonShape>;
}
