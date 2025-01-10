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
    health: number = 100;
    name: string = "";
    visualChunkLocation: number[] = [0, 0];
    speed: number = 1;
    pixelWidth: number = 0;
    pixelHeight: number = 0;
    isMoving: boolean = false;
    hitboxSize: number = 12;
    hb: HitBox;
    inventory: Inventory;
    hand: InventorySlot;
    handContainer: PIXI.Container;

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

        this.hand = new InventorySlot();
        this.handContainer = new PIXI.Container();
        this.inventory = new Inventory(items, this.hand);
        this.inventory.setSlot(0, 0, items[0], 100);
        this.inventory.onHandPickup = () => this.renderHand(this);

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

    renderHand(p: Player) {
        if (p.hand.count !== 0) {
            const handWidth = p.inventory.grid.slotWidth;
            const handMargin = 10;
            const handXOffset = 40;
            p.hand.sprite!.x = handMargin+handXOffset;
            p.hand.sprite!.y = handMargin;
            p.hand.text!.x = handWidth+handXOffset-p.hand.text!.width;
            p.hand.text!.y = handMargin+handWidth-p.hand.text!.height;
            p.handContainer.addChild(p.hand.sprite!);
            p.handContainer.addChild(p.hand.text!);
        }
    }
}

class Inventory extends PIXI.Container {
    grid: InventoryGrid;
    playerHand: InventorySlot;
    items: ItemType[];
    onHandPickup: Function | undefined

    constructor(items: ItemType[], playerHand: InventorySlot) {
        super();
        this.grid = new InventoryGrid(this);
        this.addChild(this.grid);
        this.items = items;
        this.grid.renderAll();
        this.playerHand = playerHand;
    }

    handleClick(row: number, col: number) {
        const slot = this.grid.slots[row][col];
        if (this.playerHand.count === 0) {
            if (slot.count !== 0) {
                this.playerHand.count = slot.count;
                this.playerHand.item = slot.item;
                this.playerHand.sprite = new PIXI.Sprite(PIXI.textureFrom(slot.item!.sprite))
                this.playerHand.text = new PIXI.Text({text: this.playerHand.count.toString(), style:this.grid.textStyle});
                this.emptySlot(row, col);
                if (typeof this.onHandPickup != "undefined") {
                    this.onHandPickup();
                }
            }
        } else if (slot.count === 0) {
            this.setSlot(row, col, this.playerHand.item!, this.playerHand.count)
            this.playerHand.count = 0;
            this.playerHand.item = null;
            this.playerHand.sprite!.destroy();
            this.playerHand.sprite = null;
            this.playerHand.text!.destroy();
            this.playerHand.text = null;
        }
        this.grid.renderSlot(row, col);
    }

    emptySlot(row: number, col: number) {
        const slot = this.grid.slots[row][col];
        slot.count = 0;
        slot.item = null;
        slot.sprite!.destroy();
        slot.sprite = null;
        slot.text!.destroy();
        slot.text = null;
        this.grid.renderAll();
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
        this.grid.renderSlot(row, col);
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
    slotLayer: PIXI.Container;
    inv: Inventory;

    constructor(inv: Inventory) {
        super();
        this.inv = inv;
        this.slotWidth = 70;
        this.slots = [];
        this.cols = 8;
        this.rows = 3;
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
        this.slotLayer = new PIXI.Container();
        this.addChild(this.slotLayer);
    }

    renderAll() {
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
                const graphic = new PIXI.Graphics();
                const x = this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap);
                const y = this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap);
                const width = this.slotWidth;
                graphic.roundRect(
                    x,
                    y,
                    width,
                    width,
                    10,
                )
                graphic.fill(0x494949)
                graphic.visible = true;
                graphic.interactive = true;
                graphic.onmouseover = function() {
                    this.alpha = 0.5;
                    this.roundRect(
                        x,
                        y,
                        width,
                        width,
                        10
                    )
                    this.fill(0xffffff);
                }
                
                graphic.onmouseleave = function() {

                    this.clear();
                    graphic.roundRect(
                        x,
                        y,
                        width,
                        width,
                        10,
                    )
                    this.alpha = 1;
                    this.fill(0x494949)
                }

                graphic.onmousedown = () => {this.inv.handleClick(row, col)};
                this.slotLayer.addChild(graphic);
            }
        }

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
            slot.sprite!.x = this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap);
            slot.sprite!.y = this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap);
            this.addChild(slot.sprite!)

            // Then show the text
            this.addChild(slot.text!);
            slot.text!.x = this.windowMargin+this.gridMargin+col*(this.slotWidth+this.slotGap)+(this.slotWidth-slot.text!.width);
            slot.text!.y = this.windowMargin+this.gridMargin+row*(this.slotWidth+this.slotGap)+(this.slotWidth-slot.text!.height);
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
