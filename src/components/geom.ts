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

import { toStringHDMS } from 'ol/coordinate'
export class Coordinate {
    constructor(public x: number, public y: number) {}

    toString(): string {
        return `(${this.x.toFixed()}, ${this.y.toFixed()})`
    }

    toHDMSString(): string {
        return toStringHDMS(this.toArray())
    }

    toArray(): number[] {
        return [this.x, this.y];
    }
}

export class Region {
    constructor(public pt1: Coordinate, public pt2: Coordinate) {}

    toString(): string {
        return `[${this.pt1.toString()}, ${this.pt2.toString()}]`
    }

    toHDMSString(): string {
        return `[${this.pt1.toHDMSString()}; ${this.pt2.toHDMSString()}]`
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
}
