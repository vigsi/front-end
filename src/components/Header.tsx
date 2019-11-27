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

import * as React from 'react';
// @ts-ignore
import SunCalc  from 'suncalc';
import Appbar from '@material-ui/core/Appbar';
import WbSunnyIcon from '@material-ui/icons/WbSunny';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import { DateTime } from 'luxon';
import { Coordinate, Region } from './geom';
import { DataSeriesDefinition, DataSeriesId } from './data/DataSourceService';
import { PlaybackInstant } from './PlaybackService';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import './header.less';

type HeaderProps = {
  seriesDefs: DataSeriesDefinition[];
  selectedSeriesId: DataSeriesId | undefined;
  onSeriesSelected: (id: DataSeriesId) => void;
  target: Coordinate;
  region: Region;
  time: PlaybackInstant;
}

export const Header: React.FunctionComponent<HeaderProps> = ({ seriesDefs, selectedSeriesId, onSeriesSelected, target, region, time }) =>
{
  const [open, setOpen] = React.useState(false);

  const menuItems = seriesDefs.map(def => {
    return (<MenuItem value={def.id} key={def.id}>{def.name}</MenuItem>);
  });

  const onSelectChanged = (event: any) => {
    onSeriesSelected(event.target.value);
  }

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  let sunSignal = undefined;
  if (time.stepSize.hours === 1) {
    const curDate = time.current.toJSDate();
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

  const selectedDef = seriesDefs.find(def => def.id == selectedSeriesId);
  const unit = selectedDef && selectedDef.unit;
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
        <Tooltip title="Show information about the selected data set">
            <IconButton aria-label="Show information about the selected data set" onClick={handleClickOpen}>
                <InfoIcon />
            </IconButton>
        </Tooltip>
        <Typography className="header-tracker" align="right" style={{ flex: 1 }}>
          <span>{sunSignal}</span>
          <span>{unit}</span>
          <span>│</span>
          <span>{target.toLonLat().toString()}</span>
          <span>│</span>

          <span>{time.current.toLocaleString(DateTime.DATETIME_SHORT)} UTC</span>
          <span>│</span>
          <span>{time.stepSize.toString()}</span>
        </Typography>
      </Toolbar>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{selectedDef && selectedDef.name}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            { selectedDef && selectedDef.desc }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Appbar>);
}
