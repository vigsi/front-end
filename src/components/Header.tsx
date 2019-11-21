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
// @ts-ignore
import SunCalc  from 'suncalc'
import Appbar from '@material-ui/core/Appbar'
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { DateTime } from 'luxon'
import { Coordinate, Region } from './geom'
import { DataSeriesDefinition, DataSeriesId } from './data/DataSourceService'
import { PlaybackInstant } from './PlaybackService'
import './header.less'

type HeaderProps = {
  seriesDefs: DataSeriesDefinition[];
  selectedSeriesId: DataSeriesId | undefined;
  onSeriesSelected: (id: DataSeriesId) => void;
  target: Coordinate;
  region: Region;
  time: PlaybackInstant;
  units: string;
}

export const Header: React.FunctionComponent<HeaderProps> = ({ seriesDefs, selectedSeriesId, onSeriesSelected, target, region, time, units }) =>
{
  const menuItems = seriesDefs.map(def => {
    return (<MenuItem value={def.id} key={def.id}>{def.name}</MenuItem>);
  });

  const onSelectChanged = (event: any) => {
    onSeriesSelected(event.target.value);
  }

  let sunSignal;

  if (time.stepSize.hours === 1) {
    const curDate = time.current.toJSDate();
    // The SunCalc library doesn't seem to handle time zones correctly, so we adjust
    // here for the East Coast time zone. Obviously not generally correct, but will
    // work for now.
    curDate.setTime(curDate.getTime() - (4 * 60 * 60 * 1000));
    const eastCoast = SunCalc.getTimes(curDate, 40, -74);
    const westCoast = SunCalc.getTimes(curDate, 40, -120);

    const eastIsSunUp = curDate > eastCoast.sunrise && curDate < eastCoast.sunset;
    const westIsSunUp = curDate > westCoast.sunrise && curDate < westCoast.sunset;

    sunSignal = (
      <span>
      <span>West Coast</span>
      <span>{
        westIsSunUp ? <WbSunnyIcon fontSize="small"></WbSunnyIcon> : <Brightness2Icon fontSize="small"></Brightness2Icon>
      }</span>
      <span>East Coast</span>
      <span>{
        eastIsSunUp ? <WbSunnyIcon fontSize="small"></WbSunnyIcon> : <Brightness2Icon fontSize="small"></Brightness2Icon>
      }</span>
      <span>│</span></span>);
  }
  return (
    <Appbar position="fixed">
      <Toolbar id="header-toolbar">
        <Typography variant="h6" noWrap>
              VIGSI
        </Typography>
        <div className="header-dataseries">
          {selectedSeriesId && (
                <Select
                  value={selectedSeriesId}
                  onChange={onSelectChanged}>
                  {menuItems}
              </Select>
          )}
        </div>
        <Typography className="header-tracker" align="right" style={{ flex: 1 }}>
          <span>{units}</span>
          <span>│</span>
          <span>{target.toLonLat().toString()}</span>
          <span>│</span>

          <span>{time.current.toLocaleString(DateTime.DATETIME_SHORT)} UTC</span>
          <span>│</span>
          <span>{time.stepSize.toString()}</span>
        </Typography>
      </Toolbar>
    </Appbar>);
}
