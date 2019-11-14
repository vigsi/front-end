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
import { ChartProps } from './shared'
import { VictoryChart, VictoryAxis, VictoryLine, VictoryTheme, VictoryContainer, VictoryLabel } from 'victory'


export default class Vertical extends React.Component<ChartProps> {
    state = {
        count: 0
    };


    render () {
      const ySize = this.props.region.yLength();

      const stepSize = ySize / 3;
      const start = this.props.region.pt1.y;

      const lines = this.props.seriesDefs.map(def => {
        const data = [
          {y: start, value: Math.random() * 20000},
          {y: start + stepSize, value: Math.random() * 20000},
          {y: start + 2 * stepSize, value: Math.random() * 20000},
          {y: start + 3 * stepSize, value: Math.random() * 20000}
        ];

        return (<VictoryLine
            key={def.id}
            horizontal={true}
            data={data}
            // data accessor for x values
            x="y"
            // data accessor for y values
            y="value"
            style={{data: {stroke: def.color}}}
          />);
      });

      return (
        <VictoryChart theme={VictoryTheme.material} height={this.props.mapHeight} width={80} padding={{top: 0, left: 12, bottom: 0, right: 0}}  containerComponent={<VictoryContainer responsive={false}/>}>
          <VictoryAxis domain={this.props.region.yDomain()} orientation="right"/>
          <VictoryAxis dependentAxis={true} domain={[0, 20000]} invertAxis={true} tickLabelComponent={<VictoryLabel dx={-20} angle={90} textAnchor="end" />}/>
          {lines}
      </VictoryChart>);
    }
}