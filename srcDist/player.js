import * as PIXI from "pixi.js";
import { HitBox } from "./tilemapParser";
function isItemType(obj) {
    return (typeof obj.name === "string" &&
        typeof obj.fancyname === "string" &&
        typeof obj.sprite === "string" &&
        typeof obj.stack === "number" &&
        typeof obj.placeable === "boolean" &&
        typeof obj.crafteable === "boolean" &&
        Array.isArray(obj.recipe));
}
class Player extends PIXI.AnimatedSprite {
    constructor(sprites, width, height, itemsData) {
        let textures = [];
        sprites.forEach((s) => {
            textures.push(PIXI.textureFrom(s));
        });
        super(textures);
        this.health = 100;
        this.name = "";
        this.visualChunkLocation = [0, 0];
        this.speed = 1;
        this.pixelWidth = 0;
        this.pixelHeight = 0;
        this.isMoving = false;
        this.hitboxSize = 12;
        this.spawnX = 0;
        this.spawnY = 0;
        this.animationSpeed = 0.15;
        this.msgContainer = new PIXI.Container();
        //@ts-ignore
        this.msgTextStyle = {
            fill: 0xFFFFFF,
            fontFamily: "courier new",
            fontSize: 40,
        };
        this.msgTexts = [];
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        this.showMessage("Welcome Back!");
        let items = [];
        // @ts-ignore
        itemsData.items.forEach(i => {
            if (isItemType(i)) {
                items.push(i);
            }
            else {
                throw "invalid item type data please thank you merry crimbo";
            }
        });
        this.hand = new InventorySlot();
        this.handContainer = new PIXI.Container();
        this.inventory = new Inventory(3, 8, items, this.hand);
        this.inventory.onHandPickup = () => this.renderHand(this);
        this.inventory.onInventoryUpdate = () => {
            this.craftingMenu.inventoryCountMap = this.inventory.getItemCount();
            this.craftingMenu.updateRecipeGrid();
            this.craftingMenu.recipeGrid.renderAll();
        };
        this.craftingMenu = new CraftingMenu(items, this.inventory.getItemCount(), this.handleCraftRequest, this);
        const sprite = PIXI.textureFrom(sprites[0]);
        this.pixelWidth = sprite.width;
        this.pixelHeight = sprite.height;
        this.onFrameChange = (() => {
            if (this.currentFrame == 0 && this.isMoving) {
                this.currentFrame = 1;
            }
        });
        this.hb = new HitBox(width / 3, height / 8, width, height);
    }
    handleCraftRequest(req, p) {
        for (let key of req.ingredients.keys()) {
            p.inventory.removeItems(key, req.ingredients.get(key));
        }
        p.inventory.addItems(req.result, 1);
    }
    showMessage(text) {
        const t = new PIXI.Text({
            text: text,
            style: this.msgTextStyle
        });
        t.y = window.innerHeight / 2 - this.height - t.height;
        t.x = ((this.width - t.width) / 2 + window.innerWidth / 2) - this.width / 2;
        this.msgContainer.addChild(t);
        this.msgTexts.push(t);
    }
    updateMessagePosition() {
        for (let i = 0; i < this.msgTexts.length; i++) {
            const t = this.msgTexts[i];
            t.y -= 1;
            t.alpha -= 0.01;
            if (t.y <= -150) {
                this.msgTexts.splice(i, 1);
                t.destroy();
            }
        }
    }
    renderHand(p) {
        if (p.hand.count !== 0) {
            const handWidth = p.inventory.grid.slotWidth;
            const handMargin = 10;
            const handXOffset = 40;
            p.hand.sprite.x = handMargin + handXOffset;
            p.hand.sprite.y = handMargin;
            p.hand.text.x = handWidth + handXOffset - p.hand.text.width;
            p.hand.text.y = handMargin + handWidth - p.hand.text.height;
            p.handContainer.addChild(p.hand.sprite);
            p.handContainer.addChild(p.hand.text);
        }
    }
}
class CraftRequest {
    constructor(ingredients, result) {
        this.ingredients = ingredients;
        this.result = result;
    }
}
class CraftingMenu extends PIXI.Container {
    constructor(items, inventoryItemCount, handleCraftRequest, player) {
        super();
        this.items = items;
        this.player = player;
        this.handleCraftRequest = handleCraftRequest;
        this.recipeGrid = new InventoryGrid(6, 6, this);
        this.inventoryCountMap = inventoryItemCount;
        this.recipeGrid.x = window.innerWidth - (2 * (this.recipeGrid.gridMargin + this.recipeGrid.windowMargin) +
            (this.recipeGrid.cols * (this.recipeGrid.slotWidth + this.recipeGrid.slotGap)));
        this.addChild(this.recipeGrid);
        this.updateRecipeGrid();
        this.recipeGrid.renderAll();
    }
    handleClick(row, col) {
        if (this.recipeGrid.slots[row][col].crafteableNumber === 0 || typeof this.recipeGrid.slots[row][col].crafteableNumber === "undefined") {
            return;
        }
        const slot = this.recipeGrid.slots[row][col];
        const ingredients = new Map();
        for (let i = 0; i < slot.item.recipe.length; i++) {
            const recipe = slot.item.recipe[i];
            const item = recipe.split("x")[0];
            const neededCount = Number.parseInt(recipe.split("x")[1]);
            ingredients.set(item, neededCount);
        }
        this.handleCraftRequest(new CraftRequest(ingredients, slot.item), this.player);
    }
    updateRecipeGrid() {
        var _a, _b;
        let count = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].crafteable) {
                this.items[i].recipe;
                const row = Math.floor(count / this.recipeGrid.cols);
                const col = count % this.recipeGrid.cols;
                (_a = this.recipeGrid.slots[row][col].sprite) === null || _a === void 0 ? void 0 : _a.destroy();
                (_b = this.recipeGrid.slots[row][col].text) === null || _b === void 0 ? void 0 : _b.destroy();
                this.recipeGrid.slots[row][col].sprite = new PIXI.Sprite(PIXI.textureFrom(this.items[i].sprite));
                this.recipeGrid.slots[row][col].crafteableNumber = this.calculateNumberCrafteable(this.items[i].recipe);
                this.recipeGrid.slots[row][col].text = new PIXI.Text({
                    text: this.recipeGrid.slots[row][col].crafteableNumber.toString(),
                    style: this.recipeGrid.textStyle,
                });
                if (this.recipeGrid.slots[row][col].text.text === "0") {
                    this.recipeGrid.slots[row][col].sprite.tint = 0x000000;
                }
                this.recipeGrid.slots[row][col].count = 1;
                this.recipeGrid.slots[row][col].item = this.items[i];
            }
        }
    }
    calculateNumberCrafteable(recipe) {
        let componentItem = [];
        let componentCount = [];
        let componentCrafteableNumber = [];
        for (let i = 0; i < recipe.length; i++) {
            const component = recipe[i];
            const item = component.split("x")[0];
            const neededCount = Number.parseInt(component.split("x")[1]);
            componentItem.push(item);
            if (this.inventoryCountMap.has(item)) {
                componentCount.push(this.inventoryCountMap.get(item));
                const crafteableNumber = Math.floor(componentCount[i] / neededCount);
                if (Number.isNaN(crafteableNumber)) {
                    componentCrafteableNumber.push(0);
                }
                else {
                    componentCrafteableNumber.push(Math.floor(componentCount[i] / neededCount));
                }
            }
            else {
                componentCrafteableNumber.push(0);
            }
        }
        return componentCrafteableNumber.reduce((a, b) => Math.min(a, b));
    }
}
class Inventory extends PIXI.Container {
    constructor(rows, cols, items, playerHand) {
        super();
        this.grid = new InventoryGrid(rows, cols, this);
        this.addChild(this.grid);
        this.items = items;
        this.grid.renderAll();
        this.playerHand = playerHand;
    }
    canFitItems(item, count) {
        var _a;
        let addedSoFar = 0;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (((_a = slot.item) === null || _a === void 0 ? void 0 : _a.name) == item.name) {
                    if (slot.count !== slot.item.stack) {
                        if (slot.count + (count - addedSoFar) <= slot.item.stack) {
                            return true;
                        }
                        addedSoFar += count - slot.count;
                    }
                }
                if (slot.count === 0) {
                    if (count - addedSoFar <= item.stack) {
                        return true;
                    }
                    addedSoFar += count - slot.count;
                }
            }
        }
        return false;
    }
    addItems(item, count) {
        var _a;
        let addedSoFar = 0;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (((_a = slot.item) === null || _a === void 0 ? void 0 : _a.name) == item.name) {
                    if (slot.count !== slot.item.stack) {
                        if (slot.count + (count - addedSoFar) <= slot.item.stack) {
                            this.setSlot(row, col, slot.item, slot.count + (count - addedSoFar));
                            return;
                        }
                        addedSoFar += count - slot.count;
                        this.setSlot(row, col, slot.item, slot.item.stack);
                    }
                }
                if (slot.count === 0) {
                    if (count - addedSoFar <= item.stack) {
                        this.setSlot(row, col, item, slot.count + (count - addedSoFar));
                        return;
                    }
                    addedSoFar += count - slot.count;
                    this.setSlot(row, col, item, item.stack);
                }
            }
        }
    }
    removeItems(item, count) {
        var _a;
        let gottenSoFar = 0;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (((_a = slot.item) === null || _a === void 0 ? void 0 : _a.name) == item) {
                    if (slot.count == count - gottenSoFar) {
                        this.emptySlot(row, col);
                        return;
                    }
                    if (slot.count > count - gottenSoFar) {
                        this.setSlot(row, col, slot.item, slot.count - count);
                        return;
                    }
                    if (slot.count < count - gottenSoFar) {
                        gottenSoFar += slot.count;
                        this.emptySlot(row, col);
                    }
                }
            }
        }
    }
    getItemCount() {
        let map = new Map();
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const slot = this.grid.slots[row][col];
                if (slot.count !== 0) {
                    if (map.has(slot.item.name)) {
                        map.set(slot.item.name, map.get(slot.item.name) + slot.count);
                    }
                    else {
                        map.set(slot.item.name, slot.count);
                    }
                }
            }
        }
        return map;
    }
    handleClick(row, col) {
        const slot = this.grid.slots[row][col];
        if (this.playerHand.count === 0) {
            if (slot.count !== 0) {
                this.playerHand.count = slot.count;
                this.playerHand.item = slot.item;
                this.playerHand.sprite = new PIXI.Sprite(PIXI.textureFrom(slot.item.sprite));
                this.playerHand.text = new PIXI.Text({ text: this.playerHand.count.toString(), style: this.grid.textStyle });
                this.emptySlot(row, col);
                if (typeof this.onHandPickup != "undefined") {
                    this.onHandPickup();
                }
            }
        }
        else if (slot.count === 0) {
            this.setSlot(row, col, this.playerHand.item, this.playerHand.count);
            this.playerHand.count = 0;
            this.playerHand.item = null;
            this.playerHand.sprite.destroy();
            this.playerHand.sprite = null;
            this.playerHand.text.destroy();
            this.playerHand.text = null;
        }
        this.grid.renderSlot(row, col);
    }
    emptySlot(row, col) {
        const slot = this.grid.slots[row][col];
        slot.count = 0;
        slot.item = null;
        slot.sprite.destroy();
        slot.sprite = null;
        slot.text.destroy();
        slot.text = null;
        if (typeof this.onInventoryUpdate !== "undefined") {
            this.onInventoryUpdate();
        }
        this.grid.renderAll();
    }
    setSlot(row, col, item, count) {
        var _a, _b;
        const slot = this.grid.slots[row][col];
        slot.item = item;
        const spriteFile = slot.item.sprite;
        (_a = slot.text) === null || _a === void 0 ? void 0 : _a.destroy();
        (_b = slot.sprite) === null || _b === void 0 ? void 0 : _b.destroy();
        slot.sprite = new PIXI.Sprite(PIXI.textureFrom(spriteFile));
        slot.count = count;
        slot.text = new PIXI.Text({
            text: slot.count.toString(),
            style: this.grid.textStyle,
        });
        if (typeof this.onInventoryUpdate !== "undefined") {
            this.onInventoryUpdate();
        }
        this.grid.renderSlot(row, col);
    }
}
class InventoryGrid extends PIXI.Container {
    constructor(rows, cols, inv) {
        super();
        this.inv = inv;
        this.slotWidth = 70;
        this.slots = [];
        this.borderThickness = 8;
        this.slotGap = 15;
        this.slotBorderThickness = 4;
        this.windowMargin = 100;
        this.gridMargin = 10;
        this.rows = rows;
        this.cols = cols;
        this.textStyle = new PIXI.TextStyle({
            fontSize: "20px",
            fill: "#ffff",
            fontFamily: "courier new",
        });
        for (let i = 0; i < this.rows; i++) {
            this.slots.push([]);
            for (let j = 0; j < this.cols; j++) {
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
        const width = (this.gridMargin * 2) + (this.cols - 1) * (this.slotWidth + this.slotGap) + this.slotWidth;
        const height = (this.gridMargin * 2) + (this.rows - 1) * (this.slotWidth + this.slotGap) + this.slotWidth;
        // this ones just for the border
        this.grid.roundRect(this.windowMargin - this.borderThickness, this.windowMargin - this.borderThickness, width + this.borderThickness * 2, height + this.borderThickness * 2, 10);
        this.grid.fill(0x191919);
        this.grid.roundRect(this.windowMargin, this.windowMargin, width, height, 10);
        this.grid.fill(0x404040);
        // First do a background for border
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid.roundRect(this.windowMargin + this.gridMargin + col * (this.slotWidth + this.slotGap) - this.slotBorderThickness, this.windowMargin + this.gridMargin + row * (this.slotWidth + this.slotGap) - this.slotBorderThickness, this.slotWidth + this.slotBorderThickness * 2, this.slotWidth + this.slotBorderThickness * 2, 10);
            }
        }
        this.grid.fill(0x252525);
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const graphic = new PIXI.Graphics();
                const x = this.windowMargin + this.gridMargin + col * (this.slotWidth + this.slotGap);
                const y = this.windowMargin + this.gridMargin + row * (this.slotWidth + this.slotGap);
                const width = this.slotWidth;
                graphic.roundRect(x, y, width, width, 10);
                graphic.fill(0x494949);
                graphic.visible = true;
                graphic.interactive = true;
                graphic.onmouseover = function () {
                    this.alpha = 0.5;
                    this.roundRect(x, y, width, width, 10);
                    this.fill(0xffffff);
                };
                graphic.onmouseleave = function () {
                    this.clear();
                    graphic.roundRect(x, y, width, width, 10);
                    this.alpha = 1;
                    this.fill(0x494949);
                };
                graphic.onmousedown = () => { this.inv.handleClick(row, col); };
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
    renderSlot(row, col) {
        if (this.slots[row][col].item != null) {
            // First render the icon
            const slot = this.slots[row][col];
            slot.sprite.x = this.windowMargin + this.gridMargin + col * (this.slotWidth + this.slotGap);
            slot.sprite.y = this.windowMargin + this.gridMargin + row * (this.slotWidth + this.slotGap);
            this.addChild(slot.sprite);
            // Then show the text
            this.addChild(slot.text);
            slot.text.x = this.windowMargin + this.gridMargin + col * (this.slotWidth + this.slotGap) + (this.slotWidth - slot.text.width);
            slot.text.y = this.windowMargin + this.gridMargin + row * (this.slotWidth + this.slotGap) + (this.slotWidth - slot.text.height);
        }
    }
}
class InventorySlot {
    constructor() {
        this.item = null;
        this.count = 0;
        this.sprite = null;
        this.text = null;
    }
}
export { Player, Inventory, InventorySlot };
