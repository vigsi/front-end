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
import { DataSourceService, DataSeriesDefinition, DataSeriesId } from './DataSourceService'
import { Coordinate, Region } from './geom'

import './app.less'

/**
 * Defines the application state. This state is owned by the main application
 * so that it flows down into all of the children. The children update these
 * items through callbacks.
 */
type AppState = {
    /**
     * The current time that has been selected by the user.
     */
    time: DateTime;

    /**
     * The time span for which we have available data.
     */
    availableTimespan: {start: DateTime, end: DateTime} | undefined;

    /**
     * The location on the map that the user has selected so that
     * we can show the x and y graphs at that location.
     */
    target: Coordinate;

    /**
     * The region on the map that we are currently showing.
     */
    region: Region;
    
    /**
     * The selected data series, if any
     */
    selectedSeriesId: DataSeriesId | undefined;

    /**
     * The definition of data series
     */
    seriesDefs: DataSeriesDefinition[];
}

/**
 * The root of the application. For state that is passed in
 * as properties, this owns that root state.
 * We define the properties (first parameter) as empty since
 * we are the root of the application.
 */
export class App extends React.Component<{}, AppState> {
    /**
     * The service that controls automated progression of time.
     */
    playbackService: PlaybackService;

    /**
     * The source of data for our application.
     */
    dataSourceService: DataSourceService;

    constructor(props: {}) {
        super(props)
        // We use a long-lived object as a service that will
        // handle automatically moving time forward to back
        // according to the user's interaction.
        this.playbackService = new PlaybackService(
            (time: DateTime) => { this.setDisplayTime(time)},
            () => this.getDisplayTime()
        );

        // Similar to the playback service, we use this as a long-lived
        // service to fetch and cache the data we want to display.
        this.dataSourceService = new DataSourceService();

        this.state = {
            time: DateTime.local().minus({ years: 100 }),
            availableTimespan: undefined,
            target: new Coordinate(-11718716, 4869217),
            region: new Region(new Coordinate(-13486347, 2817851), new Coordinate(-8594378, 6731427)),
            seriesDefs: []
        };

        // As the data source for the series to that we can populate
        // the controls on our UI
        this.dataSourceService.getDataSeries()
            .then(seriesDefs => {
                let newState = { seriesDefs };
                
                // Since this is the first time we have a data series
                // then select the first item as our initial selection
                if (seriesDefs.length > 0) {
                    newState.selectedSeriesId = seriesDefs[0].id;
                }

                this.setState(newState);
            });

        this.dataSourceService.getDataTimespan()
            .then(availableTimespan => this.setState({ availableTimespan }));
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
        const valueDomain: [number, number] = [0, 20000];
        return (
            <div>
                <Header
                    seriesDefs={this.state.seriesDefs}
                    selectedSeriesId={this.state.selectedSeriesId}
                    onSeriesSelected={(id: DataSeriesId) => {
                        this.setState({ selectedSeriesId: id })
                    }}
                    target={this.state.target}
                    region={this.state.region}
                    time={this.state.time}
                />
    
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
                            <Vertical region={this.state.region} target={this.state.target} valueDomain={valueDomain} seriesDefs={this.state.seriesDefs}/>
                        </div>
                    </div>
                    <div className="main-content__row">
                        <div className="main-content__left">
                            <Horizontal region={this.state.region} target={this.state.target} valueDomain={valueDomain} mapWidth={500} seriesDefs={this.state.seriesDefs}/>
                        </div>
                        <div className="main-content__right">
                            <Legend seriesDefs={this.state.seriesDefs}/>
                        </div>
                    </div>
                </Paper>
    
                <Playback
                    availableTimespan={this.state.availableTimespan}
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
