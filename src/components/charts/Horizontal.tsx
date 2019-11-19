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
import { toLonLat } from 'ol/proj'
import { ChartProps } from './shared'
import { VictoryChart, VictoryAxis, VictoryLine, VictoryTheme, VictoryContainer, VictoryLabel } from 'victory'
import { GeoJsonShape } from '../data/GeoJson'
import { Coordinate } from '../geom'
import './chart.less'

type DataSet = {
  id: string,
  data: {},
}

const mapDataForTarget = (id: string, data: GeoJsonShape, target: Coordinate): DataSet => {
  const pos = toLonLat([target.x, target.y]);
  const posY = pos[1]

  const items = []
  for (let i = 0; i < data.features.length; ++i) {
    const coordList = data.features[i].geometry.coordinates[0];
    const minY = Math.min(coordList[0][1], coordList[1][1]);
    const maxY = Math.max(coordList[0][1], coordList[1][1]);
    if (posY >= minY && posY < maxY) {
      items.push({
        x: coordList[0][0],
        ghi: data.features[i].properties.ghi,
        energy: data.features[i].properties.energy,
      })
    }
  }

  items.sort((el1, el2) => {
    return el1.x - el2.x
  });

  return {
    id,
    data: items
  }
}

export default class Horizontal extends React.Component<ChartProps> {
    state = {
        count: 0
    };

    filteredData: DataSet[] = []

    render () {
      const xDomain = this.props.region.toLonLat().xDomain()
      const lines = this.filteredData.map(def => {
        return (<VictoryLine
          key={def.id}
          data={def.data}
          // data accessor for x values
          x="x"
          // data accessor for y values
          y="ghi"
          style={{data: {stroke: "#aa2e25"}}}
        />);
      });

      return (
        <div id="horizontal-chart">
          <VictoryChart theme={VictoryTheme.material} height={80} width={this.props.mapWidth} padding={{top: 12, left: 0, bottom: 0, right: 0}} containerComponent={<VictoryContainer responsive={false}/>}>
            <VictoryAxis domain={xDomain} tickValues={[]} label="radiation"/>
            <VictoryAxis dependentAxis={true} domain={this.props.valueDomain} tickLabelComponent={<VictoryLabel dx={-20} textAnchor="end" style={{ fill: "white" }}/>}/>
            {lines}
          </VictoryChart>
        </div>);
    }

    componentDidUpdate(prevProps: ChartProps) {
      if (this.props.data && (prevProps.data !== this.props.data || prevProps.target !== this.props.target)) {
        this.filteredData = []
        this.filteredData.push(mapDataForTarget("NREL", this.props.data, this.props.target))
      }
    }
}
