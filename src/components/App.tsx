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
import Paper from '@material-ui/core/Paper'

import { Header } from './Header'
import { Playback } from './Playback'
import Vertical from './charts/Vertical'
import Horizontal from './charts/Horizontal'
import Map from './Map'
import { Legend } from './Legend'
import { PlaybackService } from './PlaybackService'
import { Coordinate, Region } from './geom'


import './app.less'

/**
 * Defines the application state.
 */
type AppState = {
    /**
     * The current time that has been selected by the user.
     */
    time: DateTime;

    target: Coordinate;

    region: Region;
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
    theme: any

    constructor(props: {}) {
        super(props)

        this.start = DateTime.local().minus({ years: 100 });
        this.end = DateTime.local();
        // We use a long-lived object as a service that will
        // handle automatically moving time forward to back
        // according to the user's interaction.
        this.playbackService = new PlaybackService(
            (time: DateTime) => { this.setDisplayTime(time)},
            () => this.getDisplayTime()
        );

        this.state = {
            time: DateTime.local().minus({ years: 100 }),
            target: new Coordinate(-11718716, 4869217),
            region: new Region(new Coordinate(-13486347, 2817851), new Coordinate(-8594378, 6731427))
        };
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
        const items = [{name: 'a', color: 'red'}, {name: 'b', color: 'blue'}]
        const valueDomain = [0, 20000];
        return (
            <div>
                <Header title="VIGSI" seriesInfos={["name"]}/>
    
                <Paper id="main-content">
                    <div className="main-content__row">
                        <div className="main-content__left">
                            <Map
                                target={this.state.target}
                                extent={this.state.region}
                                onTargetChanged={(target: Coordinate) => {
                                    this.setState({ target });
                                }}
                                onExtentChanged={(region: Region) => {
                                    this.setState({ region })
                                }}
                            />
                        </div>
                        <div className="main-content__right">
                            <Vertical region={this.state.region} target={this.state.target} valueDomain={valueDomain}/>
                        </div>
                    </div>
                    <div className="main-content__row">
                        <div className="main-content__left">
                            <Horizontal region={this.state.region} target={this.state.target} valueDomain={valueDomain} mapWidth={500}/>
                        </div>
                        <div className="main-content__right">
                            <Legend seriesItems={items}/>
                        </div>
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

                <div>
                    <p>Target <span>{this.state.target && this.state.target.toString()}</span></p>
                    <p>Region <span>{this.state.region && this.state.region.toString()}</span></p>
                </div>
            </div>
        )
    }
}
