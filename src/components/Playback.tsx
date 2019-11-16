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
import Slider from '@material-ui/core/Slider'
import IconButton from '@material-ui/core/IconButton'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import SkipNext from '@material-ui/icons/SkipNext'
import SkipPrevious from '@material-ui/icons/SkipPrevious'
import StopIcon from '@material-ui/icons/Stop'
import './playback.less'
import { interfaceDeclaration } from '@babel/types'

type PlaybackState = {
    selectedInterval: Interval
}

type PlaybackProps = {
  /**
   * The time span for which we have data
   */
  availableInterval: Interval
  /**
   * The currently selected date time in the range
   */
  value: DateTime,
  /**
   * Callback handler for when the current date time changes
   */
  onChangeValue: (value: DateTime) => void,
  /**
   * Callback handler to start playback
   */
  onStartPlayback: () => void,
  /**
   * Callback handler to start playback
   */
  onStopPlayback: () => void,
}

const diffInHours = (start: DateTime, end: DateTime): number => {
    return end.diff(start, 'hours').toObject().hours || 0
}

const fromDiffInHours = (start: DateTime, diffHours: number): DateTime => {
    return start.plus({ hours: diffHours })
}

/**
 * A component that defines the set of controls for controlling time.
 * @param param0 The props for the component.
 */
export class Playback extends React.Component<PlaybackProps, PlaybackState> {
    constructor(props: PlaybackProps) {
        super(props);

        this.state = {
            // We initially allow the entire interval as our selected interval
            selectedInterval: props.availableInterval
        };
    }

    onShowMinimumDate() {
        this.setState({
            selectedInterval: Interval.fromDateTimes(this.props.availableInterval.start, this.state.selectedInterval.end)
        });
    }

    onMiniumDateChanged(evt: any) {
        const date = DateTime.fromISO(evt.target.value);
        this.setState({
            selectedInterval: Interval.fromDateTimes(date, this.state.selectedInterval.end)
        })
    }

    onShowMaximumDate() {
        this.setState({
            selectedInterval: Interval.fromDateTimes(this.state.selectedInterval.start, this.props.availableInterval.end)
        });
    }

    render() {
        const { availableInterval, value, onChangeValue, onStopPlayback, onStartPlayback } = this.props;
        const handleSliderChange = (event: any, newValue: number | number[]) => {
            // It should never be an array since we only have one point
            if (!Array.isArray(newValue)) {
                onChangeValue(fromDiffInHours(availableInterval.start, newValue))
            }
        }
    
        return (
            <Paper>
                <div id="playback-container">
                    <Slider
                        min={0}
                        max={diffInHours(this.state.selectedInterval.start, this.state.selectedInterval.end)}
                        value={diffInHours(this.state.selectedInterval.start, value)}
                        onChange={handleSliderChange}
                        id="playback-slider"/>
                    <div id="playback-controls">
                        <div>
                            <Tooltip title="Set to earliest time">
                                <IconButton aria-label="set to earliest time" onClick={() => this.onShowMinimumDate() }>
                                    <SkipPrevious />
                                </IconButton>
                            </Tooltip>
                            <TextField
                                id="date"
                                type="date"
                                value={this.state.selectedInterval.start.toISODate() || ""}
                                onChange={ (evt) => this.onMiniumDateChanged(evt) }
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </div>
                        <div>
                            <Tooltip title="Stop automatic time progression">
                                <IconButton aria-label="stop" onClick={() => onStopPlayback() }>
                                    <StopIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Start automatic time progression">
                                <IconButton aria-label="start" onClick={() => onStartPlayback() }>
                                    <PlayArrowIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
    
                        <div>
                            <TextField
                                id="date"
                                type="date"
                                value={this.state.selectedInterval.end.toISODate() || ""}
                                onChange={() => {}}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />                        
                            <Tooltip title="Set to latest time">
                                <IconButton aria-label="set to latest time"  onClick={() => this.onShowMaximumDate() }>
                                    <SkipNext />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </Paper>
        );
    }
}
