import * as PIXI from "pixi.js"

class Player extends PIXI.Sprite {
    health: number = 0
    name: string = ""
    speed: number = 1
    pixelWidth: number = 0;
    pixelHeight: number = 0;

    constructor(src: string) {
        super(PIXI.Assets.get(src));

        const sprite = PIXI.textureFrom(src);
        this.pixelWidth = sprite.width;
        this.pixelHeight = sprite.height;
    }
}

export {Player}
