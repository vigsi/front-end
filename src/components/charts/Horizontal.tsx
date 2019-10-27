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
import { ChartProps } from './shared'
import { VictoryChart, VictoryAxis, VictoryLine, VictoryTheme, VictoryContainer, VictoryLabel } from 'victory'
import './chart.less'

export default class Horizontal extends React.Component<ChartProps> {
    state = {
        count: 0
    };


    render () {
      const xSize = this.props.region.xLength();

      const stepSize = xSize / 3;
      const start = this.props.region.pt1.x;

      const lines = this.props.seriesDefs.map(def => {
        const data = [
          {x: start, value: Math.random() * 20000},
          {x: start + stepSize, value: Math.random() * 20000},
          {x: start + 2 * stepSize, value: Math.random() * 20000},
          {x: start + 3 * stepSize, value: Math.random() * 20000}
        ];

        return (<VictoryLine
            data={data}
            // data accessor for x values
            x="x"
            // data accessor for y values
            y="value"
            style={{data: {stroke: def.color}}}
          />);
      });

      return (
        <div id="horizontal-chart">
          <VictoryChart theme={VictoryTheme.material} height={80} width={this.props.mapWidth} padding={{top: 12, left: 0, bottom: 0, right: 0}} containerComponent={<VictoryContainer responsive={false}/>}>
            <VictoryAxis domain={this.props.region.xDomain()} tickValues={[]} label="radiation"/>
            <VictoryAxis dependentAxis={true} domain={this.props.valueDomain} tickLabelComponent={<VictoryLabel dx={-20} textAnchor="end" />}/>
            {lines}
          </VictoryChart>
        </div>);
    );
  }
}