/*
 * This demo is inspired by Escher's Metamorphosis II, specifically by the part the blocks that become the city of
 * Atrani. I chose colors similar to what Escher used in the final print.
 */

const TAU = Math.PI * 2;
const MIN_GROWTH_SPEED_IN_RADIANS_PER_SEC = TAU / 8;
const MAX_GROWTH_SPEED_IN_RADIANS_PER_SEC = TAU / 4;
const MIN_GROWTH_SPEED_IN_RADIANS_PER_FRAME = MIN_GROWTH_SPEED_IN_RADIANS_PER_SEC / 60;
const MAX_GROWTH_SPEED_IN_RADIANS_PER_FRAME = MAX_GROWTH_SPEED_IN_RADIANS_PER_SEC / 60;
const SIDE_IN_HOUSES = 7;

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
    constructor (x, y, size) {
        this.x = x;
        this.y = y;
        this.maxDepth = size / 2;
        // Houses always start with depth zero. Depth varies according to a sinusoidal function, where -1 means z=0 and
        // +1 means maximum house depth
        this.z = 0;
        // this is the current angle of the sinusoidal function (start with 180deg so that it grows from z=0)
        this.depthAngle = Math.PI;
        // this is the speed with which the angle varies - it's different from house to house to give a chaotic effect
        this.dz = randomInRange(MIN_GROWTH_SPEED_IN_RADIANS_PER_FRAME, MAX_GROWTH_SPEED_IN_RADIANS_PER_FRAME);

        const h = size / 2;
        this.frontWall = [
            [x - h, y + h, this.z],
            [x + h, y + h, this.z],
            [x + h, y - h, this.z],
            [x - h, y - h, this.z]
        ];
        this.roof = [
            [x - h, y + h, 0],
            [x + h, y + h, 0],
            [x + h, y + h, this.z],
            [x - h, y + h, this.z]
        ];
        this.lateralWall = [
            [x - h, y + h, 0],
            [x - h, y + h, this.z],
            [x - h, y - h, this.z],
            [x - h, y - h, 0]
        ];
    }
    update() {
        this.depthAngle += this.dz;
        this.z = (Math.cos(this.depthAngle) + 1) * this.maxDepth;

        // update z on all points that depend on it
        this.frontWall[0][2] = this.z;
        this.frontWall[1][2] = this.z;
        this.frontWall[2][2] = this.z;
        this.frontWall[3][2] = this.z;
        this.roof[2][2] = this.z;
        this.roof[3][2] = this.z;
        this.lateralWall[1][2] = this.z;
        this.lateralWall[2][2] = this.z;
    }
}

class Escher {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.latticeSize = SIDE_IN_HOUSES;  // how many houses per side
        this.houseSize = 2 / (this.latticeSize - 1);  // divide space from -1 to +1 into latticeSize slots

        /** @type {House[]} */
        this.houses = Array(this.latticeSize ** 2);

        // bottom up, right to left (so rendering order looks right - might need to change if viewing angle changes)
        let i = 0;
        let y = -1;
        for (let row = 0; row < this.latticeSize; row++) {
            let x = 1;
            for (let column = 0; column < this.latticeSize; column++) {
                this.houses[i++] = new House(x, y, this.houseSize);
                x -= this.houseSize;
            }
            y += this.houseSize;
        }
        console.info(this.houses);

        this.projectionAngleX = 30 / 180 * Math.PI;
        this.projectionAngleY = 45 / 180 * Math.PI;

        this.center = [0, 0, 0];

        this.resize();
        window.addEventListener("resize", this.resize.bind(this));

        this.biggerScale = this.halfHeight;

        this.updateFn = this.update.bind(this);
        this.update(performance.now());
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

            if (smallerScale && i === centerHouseIndex) {
                // you could remove the second condition to draw smaller houses everywhere
                const scaleDelta = scale / smallerScale;
                const offset = [house.x * scaleDelta, house.y * scaleDelta, house.z * scaleDelta];
                this.drawHouses(offset, smallerScale, null);
            }
        }
    }

    update(now) {
        // ToDo increment scale
        // this.lattice.forEach(this.scale.bind(this, 1.005));

        this.ctx.clearRect(0, 0, this.width, this.height);
        // this.ctx.setTransform(
        //     scale, 0, 0,
        //     -scale, this.halfWidth, this.halfHeight);

        this.biggerScale *= 1.005;
        const smallerScale = this.biggerScale * this.houseSize / 2.325;  // ToDo find out where does this constant come from!

        this.drawHouses(this.center, this.biggerScale, smallerScale);

        requestAnimationFrame(this.updateFn);
    }
}

new Escher();
