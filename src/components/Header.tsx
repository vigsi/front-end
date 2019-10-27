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
import Appbar from '@material-ui/core/Appbar'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import './header.less'

type HeaderProps = {
  title: string,
  seriesInfos: string[]
  onSeriesSelected: (id: string) => void
}

export const Header: React.FunctionComponent<HeaderProps> = ({ title, seriesInfos, onSeriesSelected }) =>
{
  const menuItems = seriesInfos.map(info => {
    return (<MenuItem value={info} key={info}>{info}</MenuItem>);
  });

  return (
    <Appbar position="fixed">
      <Toolbar id="header-toolbar">
        <Typography variant="h6" noWrap>
              VIGSI
        </Typography>
        <div className="header-dataseries">
          <Select
            value={"name"}>
            {menuItems}
          </Select>
        </div>
      </Toolbar>
    </Appbar>);
}
