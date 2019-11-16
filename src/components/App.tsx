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

import * as React from 'react'
import { DateTime, Interval } from 'luxon'
import { BehaviorSubject } from 'rxjs'
import Paper from '@material-ui/core/Paper'

import { Header } from './Header'
import { Playback } from './Playback'
import Vertical from './charts/Vertical'
import Horizontal from './charts/Horizontal'
import Map from './Map'
import { Legend } from './Legend'
import { PlaybackService } from './PlaybackService'
import { DataSourceService, DataSeriesDefinition, DataSeriesId } from './data/DataSourceService'
import { Coordinate, Region } from './geom'

import './app.less'
import { GeoJsonShape } from './data/GeoJson'

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
    availableTimespan: Interval;

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

    /**
     * The width of our window.
     */
    width: number;

    /**
     * The height of our window.
     */
    height: number;

    data: GeoJsonShape | undefined;
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

    /**
     * A subject for listening changes to the current time.
     */
    timeSubject: BehaviorSubject<DateTime>;

    /**
     * The setTimeout ID that we use as a part of throttling the rate of change
     * for window resizing. We use that so that we can fill the screen but don't update
     * too fast for every pixel change.
     */
    resizeTimeoutId : number | null;

    constructor(props: {}) {
        super(props);

        this.resizeTimeoutId = null;

        const time = DateTime.local();
        this.timeSubject = new BehaviorSubject<DateTime>(time);

        // We use a long-lived object as a service that will
        // handle automatically moving time forward to back
        // according to the user's interaction.
        this.playbackService = new PlaybackService(
            (time: DateTime) => {
                this.setDisplayTime(time)
            },
            () => this.getDisplayTime()
        );

        // Similar to the playback service, we use this as a long-lived
        // service to fetch and cache the data we want to display.
        this.dataSourceService = new DataSourceService('//localhost:8080', this.timeSubject);

        const initialTime = DateTime.utc().set({minute: 0, second: 0, millisecond: 0});

        this.state = {
            // Undefined are annoying so to avoid that, just initialize to now. We'll
            // update shortly
            time,
            availableTimespan: Interval.fromDateTimes(initialTime, initialTime),
            target: new Coordinate(-11718716, 4869217),
            region: new Region(new Coordinate(-13486347, 2817851), new Coordinate(-8594378, 6731427)),
            seriesDefs: [],
            selectedSeriesId: undefined,
            width: 1000,
            height: 1000,
            data: undefined
        };

        // As the data source for the series to that we can populate
        // the controls on our UI
        this.dataSourceService.getDataSeries()
            .then(seriesDefs => {
                let newState:any = { seriesDefs };
                
                // Since this is the first time we have a data series
                // then select the first item as our initial selection
                if (seriesDefs.length > 0) {
                    newState = { ...newState, selectedSeriesId: seriesDefs[0].id };
                }

                this.setState(newState);
            });

        this.dataSourceService.getDataInterval()
            .then(availableTimespan => {
                this.setState({
                    availableTimespan,
                    // Once we have an available timespan, set the initial time
                    // to the beginning
                    time: availableTimespan.start
                })
            });
    }

    /**
     * Updates the user selected time in the state.
     */
    setDisplayTime(value: DateTime) {
        this.timeSubject.next(value);
        this.setState({
            time: value
        });

        // Fetch the data for the time time frame
        if (this.state.selectedSeriesId) {
            this.dataSourceService.get(this.state.selectedSeriesId, this.state.time)
                .then(data => {
                    this.setState({
                        data
                    })
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }

    /**
     * Gets the user selected time from the state.
     * We use this to ensure that all components have a consistent
     * view of the current time.
     */
    getDisplayTime(): DateTime {
        return this.state.time;
    }

     /**
     * CCalculate the desired size of the map component. We want the graph to
     * fill as much space as possible but have no scroll bars. 
     */
    updateMapDimensions() {
        if (this.resizeTimeoutId !== null) {
            window.clearTimeout(this.resizeTimeoutId);
            this.resizeTimeoutId = null;
        }

        this.resizeTimeoutId = window.setTimeout(() => {
            this.setState({ width: window.innerWidth, height: window.innerHeight });
        }, 50);
    }

    /**
     * Handle the event that the component mounted.
     */
    componentDidMount() {
        this.updateMapDimensions();
        window.addEventListener("resize", this.updateMapDimensions.bind(this));
    }

    /**
     * Handle the event that the component will unmount.
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateMapDimensions.bind(this));
    }

    render() {
        const valueDomain: [number, number] = [0, 20000];

        const mapWidth = Math.max(100, this.state.width - 140);
        const mapHeight = Math.max(100, this.state.height - 220);

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
                                width={mapWidth}
                                height={mapHeight}
                                data={this.state.data}
                            />
                        </div>
                        <div className="main-content__right">
                            <Vertical region={this.state.region} target={this.state.target} valueDomain={valueDomain} seriesDefs={this.state.seriesDefs} mapWidth={mapWidth} mapHeight={mapHeight}/>
                        </div>
                    </div>
                    <div className="main-content__row">
                        <div className="main-content__left">
                            <Horizontal region={this.state.region} target={this.state.target} valueDomain={valueDomain} seriesDefs={this.state.seriesDefs} mapWidth={mapWidth} mapHeight={mapHeight}/>
                        </div>
                        <div className="main-content__right">
                            <Legend seriesDefs={this.state.seriesDefs}/>
                        </div>
                    </div>
                </Paper>
    
                <Playback
                    availableInterval={this.state.availableTimespan}
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
