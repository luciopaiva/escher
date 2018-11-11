/*
 * This demo is inspired by Escher's Metamorphosis II, specifically by the part the blocks that become the city of
 * Atrani. I chose colors similar to what Escher used in the final print.
 */

const TAU = Math.PI * 2;
const MIN_GROWTH_SPEED_IN_RADIANS_PER_SEC = TAU / 8;
const MAX_GROWTH_SPEED_IN_RADIANS_PER_SEC = TAU / 4;
const MIN_GROWTH_SPEED_IN_RADIANS_PER_FRAME = MIN_GROWTH_SPEED_IN_RADIANS_PER_SEC / 60;
const MAX_GROWTH_SPEED_IN_RADIANS_PER_FRAME = MAX_GROWTH_SPEED_IN_RADIANS_PER_SEC / 60;
const SIDE_IN_HOUSES = 3;

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * A house is a block centered around 0,0 on the x,y plane whose depth (z) varies according to a certain random speed.
 * The block is actually made of only 3 faces, the only ones that the camera will actually see:
 * - the roof, red-ish color
 * - the front wall, beige
 * - the lateral wall, dark
 */
class House {
    constructor (x, y, z, size) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.maxDepth = size / 2;
        // this is the current angle of the sinusoidal function (start with 180deg so that it grows from z=0)
        this.depthAngle = Math.PI;
        // this is the speed with which the angle varies - it's different from house to house to give a chaotic effect
        this.dz = 0;  // randomInRange(MIN_GROWTH_SPEED_IN_RADIANS_PER_FRAME, MAX_GROWTH_SPEED_IN_RADIANS_PER_FRAME);

        const h = size / 2;
        this.frontWall = [
            [x - h, y + h, z + h],
            [x + h, y + h, z + h],
            [x + h, y - h, z + h],
            [x - h, y - h, z + h]
        ];
        this.roof = [
            [x - h, y + h, z - h],
            [x + h, y + h, z - h],
            [x + h, y + h, z + h],
            [x - h, y + h, z + h]
        ];
        this.lateralWall = [
            [x - h, y + h, z - h],
            [x - h, y + h, z + h],
            [x - h, y - h, z + h],
            [x - h, y - h, z - h]
        ];
    }
    update() {
        // // this.depthAngle += this.dz;
        // // this.z = (Math.cos(this.depthAngle) + 1) * this.maxDepth;
        //
        // // update z on all points that depend on it
        // this.frontWall[0][2] = this.z;
        // this.frontWall[1][2] = this.z;
        // this.frontWall[2][2] = this.z;
        // this.frontWall[3][2] = this.z;
        // this.roof[2][2] = this.z;
        // this.roof[3][2] = this.z;
        // this.lateralWall[1][2] = this.z;
        // this.lateralWall[2][2] = this.z;
    }
}

class Escher {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.latticeSize = SIDE_IN_HOUSES;  // how many houses per side
        this.houseSize = 2 / (this.latticeSize - 1);  // divide space from -1 to +1 into latticeSize slots
        const half = this.houseSize / 2;

        /** @type {House[]} */
        this.houses = Array(this.latticeSize * (this.latticeSize + 1) / 2);  // sum of the first n natural numbers

        let i = 0;
        let z = half;
        for (let row = 0; row < this.latticeSize; row++) {
            let x = -half;
            let y = half + this.houseSize * (this.latticeSize - row - 1);
            for (let col = 0; col < this.latticeSize - row; col++) {
                this.houses[i++] = new House(x, y, z, this.houseSize);
                x -= this.houseSize;
                y -= this.houseSize;
            }
            z += this.houseSize;
        }
        console.info(this.houses);

        // // bottom up, right to left (so rendering order looks right - might need to change if viewing angle changes)
        // let i = 0;
        // let y = -1;
        // for (let row = 0; row < this.latticeSize; row++) {
        //     let x = 1;
        //     for (let column = 0; column < this.latticeSize; column++) {
        //         this.houses[i++] = new House(x, y, this.houseSize);
        //         x -= this.houseSize;
        //     }
        //     y += this.houseSize;
        // }
        // console.info(this.houses);

        this.projectionAngleX = 30 / 180 * Math.PI;
        this.projectionAngleY = 45 / 180 * Math.PI;

        this.center = [0, 0, 0];

        this.resize();
        window.addEventListener("resize", this.resize.bind(this));

        this.biggerScale = this.halfHeight / 4;
        this.isRunning = true;

        window.addEventListener("keypress", this.keypress.bind(this));

        this.updateFn = this.update.bind(this);
        this.update(performance.now());
    }

    keypress(event) {
        switch (event.key) {
            case " ": this.isRunning = !this.isRunning;
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.halfWidth = this.width / 2;
        this.height = window.innerHeight;
        this.halfHeight = this.height / 2;
        this.aspectRatio = this.width / this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
    }

    mapCoord(x = 0, y = 0, z = 0) {
        [x, y, z] = this.rotateY(x, y, z, this.projectionAngleY);
        [x, y, z] = this.rotateX(x, y, z, this.projectionAngleX);
        // x /= z + 2;
        // y /= z + 2;
        return [this.halfWidth + x * this.halfWidth / this.aspectRatio, this.halfHeight - y * this.halfHeight];
    }

    scale(scale, point) {
        point[0] *= scale;
        point[1] *= scale;
    }

    rotateX(x, y, z, theta) {
        return [
            x,
            y * Math.cos(theta) - z * Math.sin(theta),
            y * Math.sin(theta) + z * Math.cos(theta)
        ];
    }

    rotateY(x, y, z, theta) {
        return [
            z * Math.sin(theta) + x * Math.cos(theta),
            y,
            z * Math.cos(theta) - x * Math.sin(theta)
        ];
    }

    drawPolygon(points) {
        this.ctx.beginPath();
        this.ctx.moveTo(...points[0]);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(...points[i]);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    projectPoint(offset, scale, x = 0, y = 0, z = 0) {
        x += offset[0];
        y += offset[1];
        z += offset[2];
        [x, y, z] = this.rotateY(x, y, z, this.projectionAngleY);
        [x, y, z] = this.rotateX(x, y, z, this.projectionAngleX);
        // x /= z + 2;
        // y /= z + 2;
        return [this.halfWidth + x * scale, this.halfHeight - y * scale];
    }

    project(offset, scale, points) {
        return points.map(point => this.projectPoint(offset, scale, ...point));
    }

    /**
     * @param {[Number,Number,Number]} offset
     * @param {Number} scale
     * @param {Number} [smallerScale]
     */
    drawHouses(offset, scale, smallerScale) {
        const centerHouseIndex = Math.floor(this.houses.length / 2);
        for (let i = 0; i < this.houses.length; i++) {
            const house = this.houses[i];
            smallerScale && house.update();

            this.ctx.fillStyle = "#d65226";
            this.drawPolygon(this.project(offset, scale, house.roof));
            this.ctx.fillStyle = "#111111";
            this.drawPolygon(this.project(offset, scale, house.lateralWall));
            this.ctx.fillStyle = "#ffe0b3";
            this.drawPolygon(this.project(offset, scale, house.frontWall));

            // if (smallerScale && i === centerHouseIndex) {
            //     // you could remove the second condition to draw smaller houses everywhere
            //     const scaleDelta = scale / smallerScale;
            //     const offset = [house.x * scaleDelta, house.y * scaleDelta, house.z * scaleDelta];
            //     this.drawHouses(offset, smallerScale, null);
            // }
        }
    }

    update(now) {
        if (this.isRunning) {
            this.ctx.clearRect(0, 0, this.width, this.height);
            // this.ctx.setTransform(
            //     scale, 0, 0,
            //     -scale, this.halfWidth, this.halfHeight);

            // this.biggerScale *= 1.005;
            const smallerScale = this.biggerScale * this.houseSize / 2.325;  // ToDo find out where does this constant come from!

            this.drawHouses(this.center, this.biggerScale, smallerScale);
        }

        requestAnimationFrame(this.updateFn);
    }
}

new Escher();
