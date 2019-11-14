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
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
  } from 'recharts'

interface Props {
    direction: "horizontal" | "vertical"
}

export default class MiniChart extends React.Component<Props> {
    state = {
        count: 0
    };


    render () {
        const data = [
            {
              name: 0, uv: 4000, pv: 2400, amt: 2400,
            },
            {
              name: 1, uv: 3000, pv: 1398, amt: 2210,
            },
            {
              name: 2, uv: 2000, pv: 9800, amt: 2290,
            },
            {
              name: 3, uv: 2780, pv: 3908, amt: 2000,
            },
            {
              name: 4, uv: 1890, pv: 4800, amt: 2181,
            },
            {
              name: 5, uv: 2390, pv: 3800, amt: 2500,
            },
            {
              name: 9, uv: 3490, pv: 4300, amt: 2100,
            },
          ];

        let width = 150
        let height = 800
        if (this.props.direction === "vertical") {
            width = 800
            height = 150
        }

        return (
            <LineChart
                width={width}
                height={height}
                layout={this.props.direction}
                data={data}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" type="number"/>
                <YAxis dataKey="uv" type="category" />
                <Tooltip />
                <Line dataKey="pv" stroke="#8884d8" />
                <Line dataKey="uv" stroke="#82ca9d" />
            </LineChart>
        );
    }
}