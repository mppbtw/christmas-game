import * as PIXI from "pixi.js"
import { HitBox } from "./tilemapParser"

export interface ItemType {
    name: string,
    fancyname: string
    stack: number,
    sprite: string,
    placeable: boolean,
    crafteable: boolean,
    recipe: [],
}
function isItemType(obj: any): obj is ItemType {
    return (
        typeof obj.name === "string" &&
        typeof obj.fancyname === "string" &&
        typeof obj.sprite === "string" &&
        typeof obj.stack === "number" &&
        typeof obj.placeable === "boolean" &&
        typeof obj.crafteable === "boolean" &&
        Array.isArray(obj.recipe)
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
    craftingMenu: CraftingMenu;

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
        this.inventory = new Inventory(3, 8, items, this.hand);
        this.inventory.setSlot(0, 0, items[0], 50);
        this.inventory.setSlot(0, 1, items[1], 1);
        this.inventory.setSlot(0, 2, items[2], 50);
        this.inventory.onHandPickup = () => this.renderHand(this);
        this.inventory.onInventoryUpdate = () => {
            this.craftingMenu.inventoryCountMap = this.inventory.getItemCount();
            this.craftingMenu.updateRecipeGrid();
            this.craftingMenu.recipeGrid.renderAll();
        }
        this.craftingMenu = new CraftingMenu(items, this.inventory.getItemCount(), this.handleCraftRequest, this);

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

    handleCraftRequest(req: CraftRequest, p: Player) {
        for (let key of req.ingredients.keys()) {
            p.inventory.removeItems(key, req.ingredients.get(key)!);
        }
        p.inventory.addItems(req.result, 1);
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

class CraftRequest {
    ingredients: Map<string, number>;
    result: ItemType;
    constructor(ingredients: Map<string, number>, result: ItemType) {
        this.ingredients = ingredients;
        this.result = result;
    }
}

class CraftingMenu extends PIXI.Container {
    recipeGrid: InventoryGrid;
    inventoryCountMap: Map<string, number>;
    items: ItemType[];
    handleCraftRequest: Function;
    player: Player

    constructor(items: ItemType[], inventoryItemCount: Map<string, number>, handleCraftRequest: Function, player: Player) {
        super();
        this.items = items;
        this.player = player;
        this.handleCraftRequest = handleCraftRequest;
        this.recipeGrid = new InventoryGrid(6, 6, this);
        this.inventoryCountMap = inventoryItemCount;
        this.recipeGrid.x = window.innerWidth-(
            2*(this.recipeGrid.gridMargin+this.recipeGrid.windowMargin)+
                (this.recipeGrid.cols*(this.recipeGrid.slotWidth+this.recipeGrid.slotGap)
                )
        );
        this.addChild(this.recipeGrid)

        this.updateRecipeGrid();
        this.recipeGrid.renderAll();
    }

    handleClick(row: number, col: number) {
        if (this.recipeGrid.slots[row][col].crafteableNumber === 0 || typeof this.recipeGrid.slots[row][col].crafteableNumber === "undefined") {
            return
        }
        const slot = this.recipeGrid.slots[row][col];

        const ingredients = new Map<string, number>();
        for (let i =0; i < slot.item!.recipe!.length; i++) {
            const recipe: String = slot.item!.recipe![i];
            const item = recipe.split("x")[0];
            const neededCount = Number.parseInt(recipe.split("x")[1]);
            ingredients.set(item, neededCount)
        }
        this.handleCraftRequest(new CraftRequest(ingredients, slot.item!), this.player)
    }

    updateRecipeGrid() {
        let count = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].crafteable) {

                this.items[i].recipe
                const row = Math.floor(count/this.recipeGrid.cols);
                const col = count % this.recipeGrid.cols;

                this.recipeGrid.slots[row][col].sprite?.destroy();
                this.recipeGrid.slots[row][col].text?.destroy();

                this.recipeGrid.slots[row][col].sprite = new PIXI.Sprite(PIXI.textureFrom(this.items[i].sprite));
                this.recipeGrid.slots[row][col].crafteableNumber = this.calculateNumberCrafteable(this.items[i].recipe!);
                this.recipeGrid.slots[row][col].text = new PIXI.Text({
                    text: this.recipeGrid.slots[row][col].crafteableNumber.toString(),
                    style: this.recipeGrid.textStyle,
                })
                if (this.recipeGrid.slots[row][col].text.text === "0") {
                    this.recipeGrid.slots[row][col].sprite.tint = 0x000000

                }
                this.recipeGrid.slots[row][col].count= 1;
                this.recipeGrid.slots[row][col].item = this.items[i];
            }
        }
    }

    calculateNumberCrafteable(recipe: String[]): number {
        let componentItem: String[] = [];
        let componentCount: number[] = [];
        let componentCrafteableNumber: number[] = [];

        for (let i = 0; i < recipe.length; i++) {
            const component = recipe[i];
            const item = component.split("x")[0];
            const neededCount = Number.parseInt(component.split("x")[1]);
            componentItem.push(item);
            if (this.inventoryCountMap.has(item)) {
                componentCount.push(this.inventoryCountMap.get(item)!)
                const crafteableNumber  = Math.floor(componentCount[i]/neededCount);
                if (Number.isNaN(crafteableNumber)) {
                    componentCrafteableNumber.push(0);
                } else {
                    componentCrafteableNumber.push(Math.floor(componentCount[i]/neededCount))
                }
            } else {
                componentCrafteableNumber.push(0)
            }
        }
        return componentCrafteableNumber.reduce((a, b) => Math.min(a, b));
    }

}

class Inventory extends PIXI.Container {
    grid: InventoryGrid;
    playerHand: InventorySlot;
    items: ItemType[];
    onHandPickup: Function | undefined
    onInventoryUpdate: Function | undefined

    constructor(rows: number, cols: number, items: ItemType[], playerHand: InventorySlot) {
        super();
        this.grid = new InventoryGrid(rows, cols, this);
        this.addChild(this.grid);
        this.items = items;
        this.grid.renderAll();
        this.playerHand = playerHand;
    }

    addItems(item: ItemType, count: number) {
        let addedSoFar = 0;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (slot.item?.name == item.name) {
                    if (slot.count !== slot.item!.stack) {
                        if (slot.count + (count-addedSoFar)  <= slot.item!.stack) {
                            this.setSlot(row, col, slot.item, slot.count + (count-addedSoFar))
                            return
                        }
                        addedSoFar += count - slot.count;
                        this.setSlot(row, col, slot.item, slot.item!.stack);
                    }
                }
                if (slot.count === 0) {
                    if (count-addedSoFar  <= item.stack) {
                        this.setSlot(row, col, item, slot.count + (count-addedSoFar))
                        return
                    }
                    addedSoFar += count - slot.count;
                    this.setSlot(row, col, item, item.stack);
                }
            }
        }
    }

    removeItems(item: string, count: number) {
        let gottenSoFar = 0;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (slot.item?.name == item) {
                    if (slot.count == count-gottenSoFar) {
                        this.emptySlot(row, col);
                        return;
                    }
                    if (slot.count > count-gottenSoFar) {
                        this.setSlot(row, col, slot.item!, slot.count - count);
                        return
                    }
                    if (slot.count < count-gottenSoFar) {
                        gottenSoFar += slot.count;
                        this.emptySlot(row, col);
                    }
                }
            }
        }
    }


    getItemCount(): Map<string, number> {
        let map = new Map<string, number>();
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (slot.count !== 0) {
                    if (map.has(slot.item!.name)) {
                        map.set(slot.item!.name, map.get(slot.item!.name)!+slot.count);
                    } else {
                        map.set(slot.item!.name, slot.count);
                    }
                }
            }
        }
        return map
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
        if (typeof this.onInventoryUpdate !== "undefined") {
            this.onInventoryUpdate();
        }
        this.grid.renderAll();
    }

    setSlot(row: number, col: number, item: ItemType, count: number) {
        const slot = this.grid.slots[row][col];
        slot.item = item;
        const spriteFile = slot.item!.sprite;

        slot.text?.destroy();
        slot.sprite?.destroy();

        slot.sprite = new PIXI.Sprite(PIXI.textureFrom(spriteFile));
        slot.count = count;

        slot.text = new PIXI.Text({
            text: slot.count.toString(),
            style: this.grid.textStyle,
        })
        if (typeof this.onInventoryUpdate !== "undefined") {
            this.onInventoryUpdate();
        }
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
    inv: any;

    constructor(rows: number, cols: number, inv: any) {
        super();
        this.inv = inv;
        this.slotWidth = 70;
        this.slots = [];
        this.borderThickness = 8
        this.slotGap = 15;
        this.slotBorderThickness = 4
        this.windowMargin = 100;
        this.gridMargin = 10;
        this.rows = rows;
        this.cols = cols;

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
    crafteableNumber: number | undefined;
}

export {Player, Inventory, InventorySlot}
