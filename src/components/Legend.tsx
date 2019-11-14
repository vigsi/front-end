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
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon'
import './legend.less'
import { DataSeriesDefinition } from './data/DataSourceService'

type LegendProps = {
    seriesDefs: DataSeriesDefinition[]
}

function HomeIcon(props: SvgIconProps) {
    return (
      <SvgIcon {...props}>
        <rect width="12" height="12" transform="translate(3, 7)"/>
      </SvgIcon>
    );
  }

export const Legend: React.FunctionComponent<LegendProps> = ({ seriesDefs }) => {
    const listItems = seriesDefs.map(def => {
        return (
            <ListItem key={def.id}>
                <ListItemIcon>
                    <HomeIcon style={{color: def.color}}/>
                </ListItemIcon>
                <ListItemText>{def.name}</ListItemText>
            </ListItem>
        );
    })
    return (<List component="ul" id="legend">{listItems}</List>)
}