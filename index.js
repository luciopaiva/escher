
class Escher {

    constructor () {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);

        this.latticeWidth = 5;
        this.latticeHeight = 5;
        this.depths = Array.from(Array((this.latticeWidth) * (this.latticeHeight)), () => Math.random() * 0.2);
        this.lattice = Array(this.latticeWidth * this.latticeHeight);
        for (let i = 0; i < this.latticeHeight; i++) {
            for (let j = 0; j < this.latticeWidth; j++) {
                this.lattice[i * this.latticeWidth + j] = [
                    (j / (this.latticeWidth - 1)) * 2 - 1,
                    (i / (this.latticeHeight - 1)) * 2 - 1
                ];
            }
        }
        const scale = 0.8;
        this.lattice = this.lattice.map(vertex => vertex.map(coord => coord * scale));
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

        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.latticeHeight - 1; i++) {
            for (let j = 0; j < this.latticeWidth - 1; j++) {
                const index = i * this.latticeWidth + j;
                const depth = this.depths[index];
                const topLeft = [...this.lattice[index], depth];
                const topRight = [...this.lattice[index + 1], depth];
                const bottomRight = [...this.lattice[(i + 1) * this.latticeWidth + j + 1], depth];
                const bottomLeft = [...this.lattice[(i + 1) * this.latticeWidth + j], depth];

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

                // wall
                this.ctx.fillStyle = "#ffe0b3";
                this.ctx.beginPath();
                this.ctx.moveTo(...this.mapCoord(...topLeft));
                this.ctx.lineTo(...this.mapCoord(...topRight));
                this.ctx.lineTo(...this.mapCoord(...bottomRight));
                this.ctx.lineTo(...this.mapCoord(...bottomLeft));
                this.ctx.closePath();
                this.ctx.fill();
            }
        }

        requestAnimationFrame(this.updateFn);
    }
}

new Escher();
