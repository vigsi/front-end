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

import * as React from 'react'
import { DateTime } from 'luxon'
import { Header } from './Header'
import { Playback } from './Playback'
import MiniChart from './MiniChart'
import { PlaybackService } from './PlaybackService'
import Paper from '@material-ui/core/Paper'

import './app.less'

/**
 * Defines the application state.
 */
type AppState = {
    /**
     * The current time that has been selected by the user.
     */
    time: DateTime
}

/**
 * The root of the application. For state that is passed in
 * as properties, this owns that root state.
 * We define the properties (first parameter) as empty since
 * we are the root of the application.
 */
export class App extends React.Component<{}, AppState> {
    start: DateTime
    end: DateTime
    playbackService: PlaybackService

    constructor(props: {}) {
        super(props)

        this.start = DateTime.local().minus({ years: 100 });
        this.end = DateTime.local();
        this.playbackService = new PlaybackService(
            (time: DateTime) => { this.setDisplayTime(time)},
            () => this.getDisplayTime()
        )

        this.state = {
            time: DateTime.local().minus({ years: 100 })
        }
    }

    /**
     * Updates the user selected time in the state.
     */
    setDisplayTime(value: DateTime) {
        this.setState({
            time: value
        });
    }

    /**
     * Gets the user selected time from the state.
     * We use this to ensure that all components have a consistent
     * view of the current time.
     */
    getDisplayTime(): DateTime {
        return this.state.time;
    }

    render() {
        return (
            <div>
                <Header title="VIGSI" />
    
                <Paper>
                    <div className="grid-wrapper">
                        <div id="item1">
                            {this.state.time.toISO()}
                        </div>
                        <div id="item2">
                            <MiniChart direction="vertical" />
                        </div>
                        <div id="item3">
                            <MiniChart direction="horizontal" />
                        </div>
                        <div id="item3">Legend</div>
                    </div>
                </Paper>
    
                <Playback
                    start={this.start}
                    end={this.end}
                    value={this.state.time}
                    onChangeValue={(time: DateTime) => this.setDisplayTime(time)}
                    onStartPlayback={() => {
                        this.playbackService.start()
                    }}
                    onStopPlayback={() => {
                        this.playbackService.stop()
                    }}
                />
            </div>
        )
    }
}
