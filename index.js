
const TAU = Math.PI * 2;

class Escher {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.latticeWidth = 30;
        this.latticeHeight = 30;
        this.depths = Array.from(Array((this.latticeWidth) * (this.latticeHeight)), () => Math.random());
        this.lattice = Array(this.latticeWidth * this.latticeHeight);
        for (let i = 0; i < this.latticeHeight; i++) {
            for (let j = 0; j < this.latticeWidth; j++) {
                this.lattice[i * this.latticeWidth + j] = [
                    (j / (this.latticeWidth - 1)) * 2 - 1,
                    (i / (this.latticeHeight - 1)) * 2 - 1
                ];
            }
        }
        this.lattice.forEach(this.scale.bind(this, 0.8));
        console.info(this.lattice);
        this.angle = 35 / 180 * Math.PI;

        this.resize();
        window.addEventListener("resize", this.resize.bind(this));

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
        [x, y, z] = this.rotateY(x, y, z, this.angle);
        [x, y, z] = this.rotateX(x, y, z, this.angle);
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

    update(now) {
        // this.angle = (now / 2000); // * Math.PI;

        for (let i = 0; i < this.depths.length; i++) {
            this.depths[i] += .09;
        }

        this.lattice.forEach(this.scale.bind(this, 1.005));

        this.ctx.clearRect(0, 0, this.width, this.height);

        // tile rendering order is important for things to look right
        for (let i = 0; i < this.latticeHeight - 1; i++) {  // bottom up
            for (let j = this.latticeWidth - 2; j >= 0; j--) {  // right to left
                const index = i * this.latticeWidth + j;
                let depth = Math.cos(this.depths[index] + i * j) + 1;  // 0..2
                depth = depth / 40 + 0.05;

                const bottomLeft = [...this.lattice[index], depth];
                const bottomRight = [...this.lattice[index + 1], depth];
                const topRight = [...this.lattice[index + this.latticeWidth + 1], depth];
                const topLeft = [...this.lattice[index + this.latticeWidth], depth];

                // roof
                const roofLeft = [topLeft[0], topLeft[1], 0];
                const roofRight = [topRight[0], topRight[1], 0];
                this.ctx.fillStyle = "#d65226";
                this.ctx.beginPath();
                this.ctx.moveTo(...this.mapCoord(...roofLeft));
                this.ctx.lineTo(...this.mapCoord(...roofRight));
                this.ctx.lineTo(...this.mapCoord(...topRight));
                this.ctx.lineTo(...this.mapCoord(...topLeft));
                this.ctx.closePath();
                this.ctx.fill();

                // lateral wall
                const floorLeft = [bottomLeft[0], bottomLeft[1], 0];
                this.ctx.fillStyle = "#111111";
                this.ctx.beginPath();
                this.ctx.moveTo(...this.mapCoord(...roofLeft));
                this.ctx.lineTo(...this.mapCoord(...topLeft));
                this.ctx.lineTo(...this.mapCoord(...bottomLeft));
                this.ctx.lineTo(...this.mapCoord(...floorLeft));
                this.ctx.closePath();
                this.ctx.fill();

                // front wall
                this.ctx.fillStyle = "#ffe0b3";
                this.ctx.beginPath();
                this.ctx.moveTo(...this.mapCoord(...bottomLeft));
                this.ctx.lineTo(...this.mapCoord(...bottomRight));
                this.ctx.lineTo(...this.mapCoord(...topRight));
                this.ctx.lineTo(...this.mapCoord(...topLeft));
                this.ctx.closePath();
                this.ctx.fill();
            }
        }

        requestAnimationFrame(this.updateFn);
    }
}

new Escher();
