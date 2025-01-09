import * as PIXI from "pixi.js"
import { HitBox } from "./tilemapParser"

interface ItemType {
    name: string,
    fancyname: string
    stack: number,
    sprite: string,
    placeable: boolean,
    crafteable: boolean,
    recipe: string,
}
function isItemType(obj: any): obj is ItemType {
    return (
        typeof obj.name === "string" &&
        typeof obj.fancyname === "string" &&
        typeof obj.sprite === "string" &&
        typeof obj.recipe === "string" &&
        typeof obj.stack === "number" &&
        typeof obj.placeable === "boolean" &&
        typeof obj.crafteable === "boolean"
    )

}

class Player extends PIXI.AnimatedSprite {
    health: number = 100
    name: string = ""
    visualChunkLocation: number[] = [0, 0]
    speed: number = 1
    pixelWidth: number = 0;
    pixelHeight: number = 0;
    isMoving: boolean = false;
    hitboxSize: number = 12;
    hb: HitBox;
    inventory: Inventory

    constructor(sprites: string[], width: number, height: number, itemsData: Object) {
        let textures: PIXI.Texture[] = []
        sprites.forEach((s) => {
            textures.push(PIXI.textureFrom(s));
        })
        super(textures);
        this.animationSpeed = 0.15;

        let items: ItemType[] = [];
        // @ts-ignore
        itemsData.items.forEach(i => {
            if (isItemType(i)) {
                items.push(i);
            } else {
                throw "invalid item type data please thank you merry crimbo";
            }
        })

        this.inventory = new Inventory(items);

        this.inventory.setSlot(0, 0, items[0], 100);

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

class Inventory extends PIXI.Container {
    grid: InventoryGrid;
    items: ItemType[];

    constructor(items: ItemType[]) {
        super();
        this.grid = new InventoryGrid();
        this.addChild(this.grid);
        this.items = items;
    }

    show() {
        this.grid.show();
    }

    setSlot(row: number, col: number, item: ItemType, count: number) {
        const slot = this.grid.slots[row][col];
        slot.item = item;
        const spriteFile = slot.item!.sprite;
        slot.sprite = new PIXI.Sprite(PIXI.textureFrom(spriteFile));
        slot.count = count;
        slot.text = new PIXI.Text({
            text: slot.count.toString(),
            style: this.grid.textStyle,
        })
    }
}


class InventoryGrid extends PIXI.Container {
    slots: InventorySlot[][];
    textStyle: PIXI.TextStyle;
    grid: PIXI.Graphics;
    slotWidth: number;
    windowMargin: number;
    gridMargin: number;
    rows: number;
    cols: number;
    borderThickness: number;
    slotGap: number;
    slotBorderThickness: number;

    constructor() {
        super();
        this.slotWidth = 70;
        this.slots = [];
        this.cols = 8;
        this.rows = 6;
        this.borderThickness = 8
        this.slotGap = 15;
        this.slotBorderThickness = 4
        this.windowMargin = 100;
        this.gridMargin = 10;

        this.textStyle = new PIXI.TextStyle({
            fontSize: "20px",
            fill: "#ffff",
            fontFamily: "courier new",
        });
        for (let i=0; i < this.rows; i++) {
            this.slots.push([])
            for (let j=0; j < this.cols; j++) {
                // @ts-ignore
                this.slots[i].push(new InventorySlot());
            }
        }

        this.grid = new PIXI.Graphics();
        this.addChild(this.grid);
    }

    show() {
        const width = (this.gridMargin*2) + (this.cols-1)*(this.slotWidth+this.slotGap)+this.slotWidth;
        const height = (this.gridMargin*2) + (this.rows-1)*(this.slotWidth+this.slotGap) + this.slotWidth;

        // this ones just for the border
        this.grid.roundRect(this.windowMargin-this.borderThickness, this.windowMargin-this.borderThickness, width+this.borderThickness*2, height+this.borderThickness*2, 10);
        this.grid.fill(0x191919);
        this.grid.roundRect(this.windowMargin, this.windowMargin, width, height, 10);
        this.grid.fill(0x404040);

        // First do a background for border
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid.roundRect(
                    this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap)-this.slotBorderThickness,
                    this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap)-this.slotBorderThickness,
                    this.slotWidth+this.slotBorderThickness*2,
                    this.slotWidth+this.slotBorderThickness*2,
                    10,
                )
            }
        }
        this.grid.fill(0x252525);

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid.roundRect(
                    this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap),
                    this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap),
                    this.slotWidth,
                    this.slotWidth,
                    10,
                )
            }
        }
        this.grid.fill(0x454545);

        // Now to render in all of the icons for the stuff in the slots
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.renderSlot(row, col);
            }
        }
    }

    renderSlot(row: number, col: number) {
        if (this.slots[row][col].item != null) {

            // First render the icon
            const slot = this.slots[row][col];
            slot.sprite!.y = this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap);
            slot.sprite!.x = this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap);
            this.addChild(slot.sprite!)

            // Then show the text
            this.addChild(slot.text!);
            slot.text!.y = this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap)+(this.slotWidth-slot.text!.height);
            slot.text!.x = this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap)+(this.slotWidth-slot.text!.width);
        }
    }
}

class InventorySlot {
    item: ItemType | null = null;
    count: number = 0;
    sprite: PIXI.Sprite | null = null;
    text: PIXI.Text | null = null;
}

export {Player}
