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

import { DateTime, Duration } from 'luxon';

export enum PlaybackMode {
    /**
     * Do not automatically advance time.
     */
    Stopped,
    /**
     * Automatically advance time.
     */
    Play,
}

/**
 * This class is owned by the main application context and
 * is responsible for advancing time according to the current
 * settings.
 */
export class PlaybackService {
    /**
     * The interval we are using to 
     */
    stepSize: Duration;

    /**
     * The interval, if we have one so that we can cancel it.
     */
    interval: number | undefined;

    /**
     * Initialize a new instance of this service with the handler for when the
     * value automatically changes.
     * @param onValueChanged Callback handler for updating the value by this class.
     * @param onGetValue Callback handler to get the current value.
     */
    constructor(private onValueChanged: (value: DateTime) => void, private onGetValue: () => DateTime) {
        this.stepSize = Duration.fromObject({hours: 1});
        this.interval = undefined
    }

    start() {
        this.interval = window.setInterval(() => {
            this.onValueChanged(this.onGetValue().plus(this.stepSize))
        }, 2000)
    }

    stop() {
        window.clearInterval(this.interval)
        this.interval = undefined
    }
}