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

import { toStringHDMS } from 'ol/coordinate'
import { toLonLat } from 'ol/proj'

export class Coordinate {
    constructor(public x: number, public y: number) {}

    static fromLatLon(latLon: number[]) {
        return new Coordinate(latLon[1], latLon[0])
    }

    toString(): string {
        return `(${this.x.toFixed()}, ${this.y.toFixed()})`
    }

    toLonLat(): Coordinate {
        const coord = toLonLat([this.x, this.y]);
        return new Coordinate(coord[0], coord[1]);
    }

    toHDMSString(): string {
        return toStringHDMS(this.toArray());
    }
    toArray(): number[] {
        return [this.x, this.y];
    }
}

export class Region {
    constructor(public pt1: Coordinate, public pt2: Coordinate) {}

    toString(): string {
        return `[${this.pt1.toString()}, ${this.pt2.toString()}]`;
    }

    toHDMSString(): string {
        return `[${this.pt1.toHDMSString()}; ${this.pt2.toHDMSString()}]`;
    }

    toLonLat(): Region {
        return new Region(this.pt1.toLonLat(), this.pt2.toLonLat());
    }

    yLength(): number {
        return this.pt2.y - this.pt1.y;
    }

    yDomain(): [number, number] {
        return [this.pt1.y, this.pt2.y];
    }

    xLength(): number {
        return this.pt2.x - this.pt1.x;
    }

    xDomain(): [number, number] {
        return [this.pt1.x, this.pt2.x];
    }

    toClosedPolygon(): number[][] {
        const minX = Math.min(this.pt1.x, this.pt2.x)
        const minY = Math.min(this.pt1.y, this.pt2.y)
        const maxX = Math.max(this.pt1.x, this.pt2.x)
        const maxY = Math.max(this.pt1.y, this.pt2.y)
        return [[minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY], [minX, maxY]]
    }
}

export function rotatePoints(points: number[][], center: number[], angle: number): number[][]  {
    const s = Math.sin(angle)
    const c = Math.cos(angle)
    for (let point of points) {
        point[0] -= center[0]
        point[1] -= center[1]

        let xnew = point[0] * c - point[1] * s;
        let ynew = point[0] * s + point[1] * c;

        point[0] = xnew + center[0]
        point[1] = ynew + center[1]
    }

    return points;
}
