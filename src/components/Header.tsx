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
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import { DateTime } from 'luxon'
import { Coordinate, Region } from './geom'
import { DataSeriesDefinition, DataSeriesId } from './data/DataSourceService'
import './header.less'

type HeaderProps = {
  seriesDefs: DataSeriesDefinition[];
  selectedSeriesId: DataSeriesId | undefined;
  onSeriesSelected: (id: DataSeriesId) => void;
  target: Coordinate;
  region: Region;
  time: DateTime;

}

export const Header: React.FunctionComponent<HeaderProps> = ({ seriesDefs, selectedSeriesId, onSeriesSelected, target, region, time }) =>
{
  const menuItems = seriesDefs.map(def => {
    return (<MenuItem value={def.id} key={def.id}>{def.name}</MenuItem>);
  });

  const onSelectChanged = (event: any) => {
    onSeriesSelected(event.target.value);
  }

  const curDate = new Date(time.toMillis());
  const eastCoast = SunCalc.getPosition(curDate, 40, 74).altitude;
  const westCoast = SunCalc.getPosition(curDate, 40, 122).altitude;

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
          <span>{target.toString()}</span>
          <span>in</span>
          <span>{eastCoast}</span>
          <span>{time.toLocaleString(DateTime.DATETIME_SHORT)} UTC</span>
        </Typography>
      </Toolbar>
    </Appbar>);
}
