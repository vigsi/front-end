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
import Slider from '@material-ui/core/Slider'
import IconButton from '@material-ui/core/IconButton'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import PlayArrowIcon from '@material-ui/icons/PlayArrow'
import StopIcon from '@material-ui/icons/Stop'
import './playback.less'

type PlaybackProps = {
  /**
   * The earliest date time for which there is data
   */
  start: DateTime,
  /**
   * The latest date time for which there is date
   */
  end: DateTime,
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
export const Playback: React.FunctionComponent<PlaybackProps> = ({ start, end, value, onChangeValue, onStartPlayback, onStopPlayback }) => {
    const handleSliderChange = (event: any, newValue: number | number[]) => {
        // It should never be an array since we only have one point
        if (!Array.isArray(newValue)) {
            onChangeValue(fromDiffInHours(start, newValue))
        }
    }

    const valueText = (value: number): string => {
        return fromDiffInHours(start, value).toLocaleString(DateTime.DATETIME_SHORT);
    }

    return (
        <Paper>
            <div id="playback-container">

                <Slider
                    min={0}
                    max={diffInHours(start, end)}
                    value={diffInHours(start, value)}
                    onChange={handleSliderChange}
                    valueLabelFormat={valueText}
                    valueLabelDisplay="on"
                    id="playback-slider"/>
                <div id="playback-controls">
                    <TextField
                        id="date"
                        type="date"
                        defaultValue={start.toISODate()}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <div>
                        <IconButton aria-label="stop" onClick={() => onStopPlayback() }>
                            <StopIcon />
                        </IconButton>
                        <IconButton aria-label="start" onClick={() => onStartPlayback() }>
                            <PlayArrowIcon />
                        </IconButton>
                    </div>

                    <TextField
                        id="date"
                        type="date"
                        defaultValue={end.toISODate()}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </div>
            </div>
        </Paper>
    )
}
