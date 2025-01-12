import * as PIXI from "pixi.js"
import { Inventory, ItemType } from "./player";
import { Howl } from "howler";
import { ResourceLayer } from "./tilemapParser";

export interface ResourceOption {
    resourceName: string,
    resourceCount: number,
    hits: number,
    width: number,
    height: number,
    resourceSprite: string,
    resourceItemName: string,
    miningSound: string,
    miningSoundVariants: number,
    destroySound: string,
    destroySoundVariants: number,
}

// This class manages every resource in the game all as one, to be nice and tidy in the main file :)
class ResourcesManager extends PIXI.Container {
    maps: ResourceMap[];
    app: PIXI.Application;
    clicking: boolean;
    timeOfLastMinecraft: number;
    miningSpeedMillis: number;

    constructor(resourceLayers: ResourceLayer[], opts: ResourceOption[], itemsData: Object, itemDestination: Inventory, app: PIXI.Application, miningSpeedMillis: number) {
        super();
        this.miningSpeedMillis = miningSpeedMillis;
        this.maps = [];
        this.timeOfLastMinecraft = Date.now();
        this.app = app;
        this.clicking = false;
        this.interactive = true;
        app.canvas.onmousedown = () => {
            for (let i=0; i<this.maps.length; i++) {
                if (this.maps[i].currentMiningIndex != null) {
                    this.maps[i].playMiningSound();
                    document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.maps[i].miningHitSprite + "'), auto";
                    setTimeout(() => {
                        if (document.getElementsByTagName("body")[0].style.cursor == 'url("assets/' + this.maps[i].miningHitSprite + '"), auto') {
                            document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.maps[i].mouseoverSprite + "'), auto";
                        }
                    }, 100);
                    break;
                }
            }
            this.clicking = true;
        };
        app.canvas.onmouseup = () => {this.clicking = false};
        for (let i=0; i<opts.length; i++) {
            const resource = opts[i];
            let locations: ResourceMapLocation[] = [];
            const layer = resourceLayers.find(layer => layer.resourceName == resource.resourceName);
            layer!.locations.forEach(location => {
                locations.push({
                    resourceCount: resource.resourceCount,
                    width: resource.width,
                    height: resource.height,
                    hits: resource.hits,
                    x: location.x,
                    y: location.y
                })
            })
            const map = new ResourceMap(
                locations,
                resource.resourceName,
                //@ts-ignore
                itemsData.items.find(i => i.name === resource.resourceItemName),
                itemDestination,
                resource.resourceSprite,
                this.app,
                "pickaxe_1.png",
                "pickaxe_2.png",
                "cursor.png",
                resource.miningSound,
                resource.miningSoundVariants,
                resource.destroySound,
                resource.destroySoundVariants,
            );
            this.maps.push(map);
            this.addChild(this.maps[i]);
        }
    }

    miningTick() {
        if (!this.clicking) {
            this.timeOfLastMinecraft = Date.now();
            return;
        }
        if (Date.now() - this.timeOfLastMinecraft > this.miningSpeedMillis) {
            for (let i=0; i<this.maps.length; i++) {
                if (this.maps[i].currentMiningIndex != null) {
                    this.maps[i].mineResource();
                    break;
                }
            }
            this.timeOfLastMinecraft = Date.now();
        }
    }
}

export interface ResourceMapLocation {
    resourceCount: number,
    x: number,
    y: number,
    width: number,
    height: number,
    hits: number,
}

class ResourceMap extends PIXI.Container {
    resourceName: string;
    mapMask: PIXI.Graphics[];
    locations: ResourceMapLocation[];
    currentMiningIndex: number | null;
    resourceItem: ItemType;
    timeOfLastMinecraft: number;
    resourceDestination: Inventory;
    sprites: PIXI.Sprite[];
    resourceSprite: string;
    miningHitSprite: string;
    mouseoverSprite: string;
    defaultCursorSprite: string;
    app: PIXI.Application;
    miningSoundVariants: number;
    miningSound: string;
    destroySound: string;
    destroySoundVariants: number;

    constructor(locations: ResourceMapLocation[], resourceName: string, resourceItem: ItemType, resourceDestination: Inventory, resourceSprite: string, app: PIXI.Application, mouseoverSprite: string, miningHitSprite: string, defaultCursorSprite: string, miningSound: string, miningSoundVariants: number, destroySound: string, destroySoundVariants: number) {
        super();
        this.miningSound = miningSound;
        this.destroySound = destroySound;
        this.destroySoundVariants = destroySoundVariants;
        this.miningSoundVariants = miningSoundVariants;
        this.defaultCursorSprite = defaultCursorSprite;
        this.mouseoverSprite = mouseoverSprite;
        this.miningHitSprite = miningHitSprite;
        this.app = app;
        this.timeOfLastMinecraft = Date.now();
        this.resourceSprite = resourceSprite
        this.resourceDestination = resourceDestination;
        this.resourceName = resourceName;
        this.resourceItem = resourceItem;
        this.locations = locations;
        this.mapMask = [];
        this.sprites = [];
        this.currentMiningIndex = null;
        for (let i=0; i<this.locations.length; i++) {
            const graphics = new PIXI.Graphics();
            graphics.rect(locations[i].x, locations[i].y, locations[i].width, locations[i].height);

            graphics.onmouseover = () => {
                document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.mouseoverSprite + "'), auto";
                this.currentMiningIndex = i;
            }
            graphics.onmousedown = () => {
                this.playMiningSound();
                document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.miningHitSprite + "'), auto";
                setTimeout(() => {
                    if (document.getElementsByTagName("body")[0].style.cursor == 'url("assets/' + this.miningHitSprite + '"), auto') {
                        document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.mouseoverSprite + "'), auto";
                    }
                }, 100);
                this.currentMiningIndex = i;
            }
            graphics.onmouseup = () => {
                this.currentMiningIndex = null;
            }
            graphics.onmouseleave = () => {
                this.currentMiningIndex = null;
                document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.defaultCursorSprite + "'), auto";
            }

            graphics.interactive = true;
            graphics.alpha = 0;
            graphics.fill(0);
            this.addChild(graphics);
            this.mapMask.push(graphics);

            const sprite = new PIXI.Sprite(PIXI.textureFrom(this.resourceSprite));
            sprite.x = locations[i].x;
            sprite.y = locations[i].y;
            sprite.width = locations[i].width;
            sprite.height = locations[i].height;
            this.addChild(sprite);
            this.sprites.push(sprite);
        }
    }

    playMiningSound() {
        const sound = new Howl({
            src: ["assets/" + this.miningSound + "_" + (Math.floor(Math.random() * this.miningSoundVariants) + 1).toString() + ".wav"]
        });
        sound.play();
    }

    playDestroySound() {
        const sound = new Howl({
            src: ["assets/" + this.destroySound + "_" + (Math.floor(Math.random() * this.destroySoundVariants) + 1).toString() + ".wav"]
        });
        sound.play();
    }

    mineResource() {
        if (this.currentMiningIndex == null) {
            return
        }

        document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.miningHitSprite + "'), auto";
        setTimeout(() => {
            if (document.getElementsByTagName("body")[0].style.cursor == 'url("assets/' + this.miningHitSprite + '"), auto') {
                document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.mouseoverSprite + "'), auto";
            }
        }, 100);

        this.locations[this.currentMiningIndex].hits -= 1;
        if (this.locations[this.currentMiningIndex].hits === 0) {
            this.resourceDestination.addItems(this.resourceItem, this.locations[this.currentMiningIndex].resourceCount);
            document.getElementsByTagName("body")[0].style.cursor = "url('assets/" + this.defaultCursorSprite + "'), auto";
            this.mapMask[this.currentMiningIndex].destroy();
            this.sprites[this.currentMiningIndex].destroy();
            this.currentMiningIndex = null;
            this.playDestroySound();
            this.playMiningSound();
        } else {
            this.playMiningSound();
        }
    }
}

export {ResourceMap, ResourcesManager}
