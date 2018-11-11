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
const CENTER_INDEX = 4;
const MAX_RECURSION_LEVEL = 2;

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
    constructor (x, y, z, finalY, size) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.finalY = finalY;
        this.size = size;
        this.isDone = false;
        this.houses = [];

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
        if (this.y < this.finalY) {
            this.y += this.size / 64;

            const h = this.size / 2;
            this.frontWall[0][1] = this.y + h;
            this.frontWall[1][1] = this.y + h;
            this.frontWall[2][1] = this.y - h;
            this.frontWall[3][1] = this.y - h;

            this.roof[0][1] = this.y + h;
            this.roof[1][1] = this.y + h;
            this.roof[2][1] = this.y + h;
            this.roof[3][1] = this.y + h;

            this.lateralWall[0][1] = this.y + h;
            this.lateralWall[1][1] = this.y + h;
            this.lateralWall[2][1] = this.y - h;
            this.lateralWall[3][1] = this.y - h;
        } else {
            this.isDone = true;
        }

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

    static makePyramid(latticeSize, houseSize) {
        const half = houseSize / 2;

        /** @type {House[]} */
        const houses = Array(latticeSize * (latticeSize + 1) / 2);  // sum of the first n natural numbers

        let i = 0;
        let z = half;
        for (let row = 0; row < latticeSize; row++) {
            let x = -half;
            let y = half + houseSize * (latticeSize - row - 1);
            for (let col = 0; col < latticeSize - row; col++) {
                houses[i++] = new House(x, half, z, y, houseSize);
                x -= houseSize;
                y -= houseSize;
            }
            z += houseSize;
        }

        return houses;
    }
}

class Escher {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.latticeSize = SIDE_IN_HOUSES;  // how many houses per side
        this.houseSize = 1 / (this.latticeSize - 1);  // divide space from -1 to +1 into latticeSize slots

        /** @type {House[]} */
        this.houses = House.makePyramid(this.latticeSize, this.houseSize);
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

        this.projectionAngleX = 35.3 / 180 * Math.PI;
        this.projectionAngleY = 45 / 180 * Math.PI;

        this.center = [0, 0, 0];

        this.resize();
        window.addEventListener("resize", this.resize.bind(this));

        this.zoomFactor = 1 / 4;
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
     * @param {Number} level
     */
    drawHouses(offset, level) {
        const scaleFactor = level > 0 ? this.houseSize / (level * 1.5) : 1;
        const scale = this.zoomFactor * this.halfHeight * scaleFactor;

        // offset[0] -= this.houseSize;
        // offset[1] -= this.houseSize / 1024;
        // offset[2] += this.houseSize;

        // offset[0] *= this.houseSize;
        // offset[1] *= this.houseSize;
        // offset[2] *= this.houseSize;

        for (let i = 0; i < this.houses.length; i++) {
            const house = this.houses[i];
            // smallerScale && house.update();

            this.ctx.fillStyle = "#d65226";
            this.drawPolygon(this.project(offset, scale, house.roof));
            this.ctx.fillStyle = "#111111";
            this.drawPolygon(this.project(offset, scale, house.lateralWall));
            this.ctx.fillStyle = "#ffe0b3";
            this.drawPolygon(this.project(offset, scale, house.frontWall));

            if (level < MAX_RECURSION_LEVEL && i === CENTER_INDEX && house.isDone) {
                // const offset = [house.x, house.y, house.z];
                this.drawHouses(offset, level + 1);
            }

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

            this.zoomFactor *= 1.005;
            document.title = this.zoomFactor.toFixed(2);
            // const biggerScale = this.zoomFactor * this.halfHeight;
            // const smallerScale = biggerScale * this.houseSize / 2.325;  // ToDo find out where does this constant come from!

            this.houses.forEach(house => house.update());
            this.drawHouses(this.center, 0);
        }

        requestAnimationFrame(this.updateFn);
    }
}

new Escher();
