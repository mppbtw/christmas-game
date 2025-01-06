import * as PIXI from "pixi.js"
import { HitBox } from "./tilemapParser"

class Player extends PIXI.AnimatedSprite {
    health: number = 0
    name: string = ""
    visualChunkLocation: number[] = [0, 0]
    speed: number = 1
    pixelWidth: number = 0;
    pixelHeight: number = 0;
    isMoving: boolean = false;
    hitboxSize: number = 12;

    hb: HitBox;

    constructor(sprites: string[], width: number, height: number) {
        let textures: PIXI.Texture[] = []
        sprites.forEach((s) => {
            textures.push(PIXI.textureFrom(s));
        })
        super(textures);
        this.animationSpeed = 0.15;

        const sprite = PIXI.textureFrom(sprites[0]);
        this.pixelWidth = sprite.width;
        this.pixelHeight = sprite.height;
        this.onFrameChange = (() => {
            if (this.currentFrame == 0 && this.isMoving) {
                this.currentFrame = 1;
            }
        })
        this.hb = new HitBox(width/3, height/8, width, height)
    }
}

export {Player}
