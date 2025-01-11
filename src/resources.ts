import * as PIXI from "pixi.js"
import { Inventory, ItemType } from "./player";

export interface ResourceMapLocation {
    resourceCount: number,
    x: number,
    y: number,
    size: number,
    hits: number,
}

class ResourceMap extends PIXI.Container {
    resourceName: string;
    mapMask: PIXI.Graphics[];
    mapClickStartedTime: number[];
    locations: ResourceMapLocation[];
    currentMiningIndex: number | null;
    resourceItem: ItemType;
    timeOfLastMinecraft: number;
    miningSpeedMillis: number;
    resourceDestination: Inventory;
    sprites: PIXI.Sprite[];
    resourceSprite: string

    constructor(locations: ResourceMapLocation[], resourceName: string, resourceItem: ItemType, resourceDestination: Inventory, resourceSprite: string) {
        super();
        this.timeOfLastMinecraft = Date.now();
        this.resourceSprite = resourceSprite
        this.resourceDestination = resourceDestination;
        this.miningSpeedMillis = 1000;
        this.resourceName = resourceName;
        this.resourceItem = resourceItem;
        this.locations = locations;
        this.mapMask = [];
        this.sprites = [];
        this.mapClickStartedTime = [];
        this.currentMiningIndex = null;
        for (let i=0; i<locations.length; i++) {
            const graphics = new PIXI.Graphics();
            graphics.rect(locations[i].x, locations[i].y, locations[i].size, locations[i].size);

            graphics.onmousedown = () => {
                this.currentMiningIndex = i;
            }
            graphics.onmouseup = () => {
                this.currentMiningIndex = null;
            }
            graphics.onmouseleave = () => {
                this.currentMiningIndex = null;
            }

            graphics.interactive = true;
            graphics.alpha = 0;
            graphics.fill(0);
            this.addChild(graphics);
            this.mapClickStartedTime.push(0);
            this.mapMask.push(graphics);

            const sprite = new PIXI.Sprite(PIXI.textureFrom(this.resourceSprite));
            sprite.x = locations[i].x;
            sprite.y = locations[i].y;
            sprite.width = locations[i].size;
            sprite.height = locations[i].size;
            this.addChild(sprite);
            this.sprites.push(sprite);
        }
    }

    miningTick() {
        if (this.currentMiningIndex == null) {
            this.timeOfLastMinecraft = Date.now();
            return;
        }
        if (Date.now() - this.timeOfLastMinecraft > this.miningSpeedMillis) {
            this.mineResource();
            this.timeOfLastMinecraft = Date.now();
        }
    }

    mineResource() {
        if (this.currentMiningIndex == null) {
            return
        }
        this.locations[this.currentMiningIndex].hits -= 1;
        if (this.locations[this.currentMiningIndex].hits === 0) {
            this.resourceDestination.addItems(this.resourceItem, this.locations[this.currentMiningIndex].resourceCount);
            this.mapMask[this.currentMiningIndex].destroy();
            this.sprites[this.currentMiningIndex].destroy();
            this.currentMiningIndex = null;
        }
    }
}

export {ResourceMap}
