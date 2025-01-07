import * as PIXI from "pixi.js"

class ParticleMotionData {
    speedCoeff: number
    sinCounter: number
    sinCounterIncrease: number

    rotation: number
    rotationSpeed: number

    constructor() {

        const max = 1;
        const min = 0.5;
        this.speedCoeff = Math.random() * (max - min + max) + min;
        this.sinCounterIncrease = Math.random()*0.1
        this.sinCounter = 0;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() * 0.1) + 0.1

    }

    update() {
        this.sinCounter += this.sinCounterIncrease;
        this.rotation += this.rotationSpeed;
    }

    getNextXMovement(x: number): number {
        return x + this.speedCoeff*Math.sin(this.sinCounter)*3
    }

    getNextYMovement(y: number): number {
        return y + this.speedCoeff+2;
    }
}

class Snow extends PIXI.Container {
    public snowflakeRate: number = 0;
    timeSinceLastFlake: number = Date.now();
    snowTexture: PIXI.Texture
    pixelWidth: number = 0;
    particleContainer: PIXI.ParticleContainer;
    particleMotionDats: ParticleMotionData[] = [];
    pixelHeight: number = 0;
    windSpeed: number = 10;
    windDirection: boolean = false;
    flakeSpawnCounter = 0;

    constructor(texture: PIXI.Texture, snowflakeRate: number, width: number, height: number) {
        super();
        this.pixelWidth = width;
        this.pixelHeight = height;
        this.particleContainer = new PIXI.ParticleContainer({
            width: width,
            height: height,
        });

        this.addChild(this.particleContainer);
        this.snowflakeRate = snowflakeRate;
        this.snowTexture = texture;
    }

    updateSnow() {
        let toSpawn = Math.floor(this.flakeSpawnCounter/(1/this.snowflakeRate));

        for (let j = 0; j < toSpawn; j++) {
            this.flakeSpawnCounter = 0;
            const snowflake = new PIXI.Particle(this.snowTexture);
            if (this.windSpeed >= 1) {
                if (this.windDirection) {
                    const max = (this.pixelWidth*this.windSpeed)
                    const min = -this.pixelWidth*this.windSpeed*0.5
                    snowflake.x = Math.random() * (max - min + max) + min;
                } else {
                    const max = (this.pixelWidth*this.windSpeed) + this.pixelWidth*this.windSpeed*0.5;
                    const min = 0
                    snowflake.x = Math.random() * (max - min + max) + min;
                }
            } else {
                snowflake.x = (Math.random() * this.pixelWidth*1.2) - (0.2*this.pixelWidth);
            }
            snowflake.y = -100
            const max = 0.2;
            const min = 0.1;

            const sizeCoeff = Math.random() * (max - min + max) + min;
            snowflake.alpha = 1-(sizeCoeff*2);
            snowflake.scaleX = sizeCoeff
            snowflake.scaleY = sizeCoeff
            snowflake.anchorX = 0.5;
            snowflake.anchorY = 0.5;
            this.particleContainer.addParticle(snowflake);

            this.particleMotionDats.push(new ParticleMotionData())
        }

        for (let i = 0; i < this.particleContainer.particleChildren.length; i++) {
            this.particleMotionDats[i].update();
            const p = this.particleContainer.particleChildren[i];
            p.x = this.particleMotionDats[i].getNextXMovement(p.x);

            if (this.windDirection) {
                p.x += this.windSpeed;
                p.rotation = this.particleMotionDats[i].rotation;
            } else {
                p.x -= this.windSpeed;
                p.rotation = -this.particleMotionDats[i].rotation;
            }
            p.y = this.particleMotionDats[i].getNextYMovement(p.y);


            if (p.y > window.innerHeight+50) {
                this.particleContainer.particleChildren.splice(i, 1);
                this.particleMotionDats.splice(i, 1);
            }
        }
        this.particleContainer.update();
        this.flakeSpawnCounter++;
    }
}

export { Snow }
