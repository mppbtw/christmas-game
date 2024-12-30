import { CompositeTilemap } from "@pixi/tilemap";

interface Layer {
    data: number[];
    height: number;
    id: number;
    name: string;
    opacity: number;
    type: string; // Type can be more specific based on known values
    visible: boolean;
    width: number;
    x: number;
    y: number;
}

interface TilemapData {
    layers: Layer[];
}

interface TileObject {
    height: number;
    width: number;
    x: number;
    y: number;
}

/*
function isLayer(obj: any): obj is Layer {
    return (
        Array.isArray(obj.data) &&
        typeof obj.height === 'number' &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.opacity === 'number' &&
        typeof obj.type === 'string' &&
        typeof obj.visible === 'boolean' &&
        typeof obj.width === 'number' &&
        typeof obj.x === 'number' &&
        typeof obj.y === 'number'
    );
}
*/

function isTileObject(obj: any): obj is TileObject {
    return (
        typeof obj === "object" &&
        typeof obj.height === "number" &&
        typeof obj.width === "number" &&
        typeof obj.x === "number" &&
        typeof obj.y === "number"
    );
}

interface ObjectLayer {
    objects: TileObject[];
    id: number;
    name: string;
    opacity: number;
    type: string; // Type can be more specific based on known values
    visible: boolean;
    x: number;
    y: number;
}

function isObjectLayer(obj: any): obj is ObjectLayer {
    return (
        typeof obj === "object" &&
        obj !== null &&
        Array.isArray(obj.objects) &&
        typeof obj.id === "number" &&
        typeof obj.name === "string" &&
        typeof obj.opacity === "number" &&
        typeof obj.type === "string" &&
        typeof obj.visible === "boolean" &&
        typeof obj.x === "number" &&
        typeof obj.y === "number" &&
        obj.objects.every(isTileObject)
    );
}

function isLayersData(obj: any): obj is TilemapData {
    return (
        obj &&
        Array.isArray(obj.layers)
    );
}

class Tilemap extends CompositeTilemap {

    baseLayer: VisualLayer;
    collisionLayer: CollisionLayer;
    tileUnscaledSize: number
    collisionChunkSize: number;
    visualChunkSize: number;

    constructor(src: Object, tileUnscaledSize: number, collisionChunkSize: number, visualChunkSize: number) {
        super();
        this.collisionChunkSize = collisionChunkSize;
        this.visualChunkSize = visualChunkSize;
        this.tileUnscaledSize = tileUnscaledSize;
        if (!isLayersData(src))  {
            throw "Invalid tilemap JSON data."
        }
        const baseLayer = src.layers.find(l => l.name == "Base");
        if (!baseLayer) {
            throw "No baselayer found"
        }

        const collisionLayerData = src.layers.find(l => l.name == "Collision");
        if (!collisionLayerData) {
            throw "No collision layer found";
        }

        if (!isObjectLayer(collisionLayerData)) {
            throw "Collision layer found, but it's not a valid object layer"
        }

        this.collisionLayer = new CollisionLayer(collisionLayerData, collisionChunkSize, this.tileUnscaledSize, baseLayer.width, baseLayer.height);

        if (typeof this.collisionLayer == "undefined") {
            throw "No collision layer found"
        }

        this.baseLayer = new VisualLayer(baseLayer, tileUnscaledSize, visualChunkSize);
    }

    renderVisualChunk(row: number, col: number) {
        const chunk = this.baseLayer.chunks[row][col];
        for (let x = 0; x < this.baseLayer.chunkSize; x++) {
            for (let y = 0; y < this.baseLayer.chunkSize; y++) {
                const tileIndex = y*this.baseLayer.chunkSize + x;
                const start_x = chunk.x*16;
                const start_y = chunk.x*16;
                this.tile("tile_" + chunk.data[tileIndex] + ".png", start_x +x*16, start_y + y*16);
            }
        }
    }
};

class VisualChunk {
    public x: number = 0;
    public y: number = 0;
    public data: number[] = [];
}

class VisualLayer {
    chunks: VisualChunk[][] = [];
    layerWidth: number;
    layerHeight: number;
    tileSize: number;
    chunkSize: number;
    
    constructor(layer: Layer, tileSize: number, chunkSize: number) {
        this.tileSize = tileSize;
        this.layerWidth = layer.width;
        this.layerHeight = layer.height;
        this.chunkSize = chunkSize;
        this.chunks  = []

        for (let row = 0; row < Math.ceil(this.layerHeight/chunkSize); row++) {
            this.chunks.push([]);
            for (let col = 0; col < Math.ceil(this.layerWidth/chunkSize); col++) {
                this.chunks[row].push(new VisualChunk())
                this.chunks[row][col].x = col*chunkSize;
                this.chunks[row][col].y = row*chunkSize;
            }
        }

        for (let i = 0; i < layer.data.length; i++) {
            const tile = layer.data[i];
            const tileRow = Math.floor(i/this.layerWidth);
            const row = Math.floor(tileRow/chunkSize);
            const tileCol  = i - (tileRow*this.layerWidth);
            const col = Math.floor(tileCol/chunkSize);
            this.chunks[row][col].data.push(tile);

        }
    }
}

class HitBox {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

class CollisionChunk {
    boxes: HitBox[] = [];
}

class CollisionLayer {
    chunks: CollisionChunk[][] = []
    collisionChunkSize: number;
    layerWidth: number;
    layerHeight: number;
    tileSize: number

    constructor(layer: ObjectLayer, collisionChunkSize: number, tileSize: number, layerWidth: number, layerHeight: number) {
        this.tileSize = tileSize;
        this.collisionChunkSize = collisionChunkSize;
        this.layerWidth = layerWidth;
        this.layerHeight = layerHeight;

        for (let x = 0; x < Math.floor(layerWidth/collisionChunkSize); x++) {
            this.chunks.push([]);
            for (let y = 0; y < Math.floor(layerHeight/collisionChunkSize); y++) {
                this.chunks[x].push(new CollisionChunk())
            }
        }

        layer.objects.forEach(o => {
            const row = Math.floor(o.y/(this.collisionChunkSize*tileSize)); 
            const col = Math.floor(o.x/(this.collisionChunkSize*tileSize));
            this.chunks[row][col].boxes.push(new HitBox(o.x, o.y, o.width, o.height));
        });
    }

    checkBorderCollision(player: HitBox) {
        return player.x <= 0 || player.y <= 0 || player.x >= this.layerWidth*this.tileSize || player.y >= this.layerHeight*this.tileSize
    }

    checkLeftCollision(player: HitBox, chunkX: number, chunkY: number): boolean {
        // Check that were not on a boundary
        if (this.checkBorderCollision(player)) {
            return true
        }
        const boxes = this.chunks[chunkY][chunkX].boxes;
        return checkLeftCollision(player, boxes);
    }

    checkRightCollision(player: HitBox, chunkX: number, chunkY: number): boolean {
        // Check that were not on a boundary
        if (this.checkBorderCollision(player)) {
            return true
        }
        const boxes = this.chunks[chunkY][chunkX].boxes;
        return checkRightCollision(player, boxes);
    }

    checkUpCollision(player: HitBox, chunkX: number, chunkY: number): boolean {
        // Check that were not on a boundary
        if (this.checkBorderCollision(player)) {
            return true
        }
        const boxes = this.chunks[chunkY][chunkX].boxes;
        return checkUpCollision(player, boxes);
    }

    checkDownCollision(player: HitBox, chunkX: number, chunkY: number): boolean {
        // Check that were not on a boundary
        if (this.checkBorderCollision(player)) {
            return true
        }
        const boxes = this.chunks[chunkY][chunkX].boxes;
        return checkDownCollision(player, boxes);
    }
}

function checkLeftCollision(player: HitBox, boxes: HitBox[]): boolean {
    for (const b of boxes) {
        if (player.x > b.x && player.x <= b.x+b.width && player.y <= b.y+b.height && player.y+player.height >= b.y) {
            return true
        }
    }
    return false
}

function checkRightCollision(player: HitBox, boxes: HitBox[]): boolean {
    for (const b of boxes) {
        if (player.x+player.width >= b.x && player.x <= b.x+b.width && player.y <= b.y+b.height && player.y+player.height >= b.y) {
            return true
        }
    }
    return false
}

function checkUpCollision(player: HitBox, boxes: HitBox[]): boolean {
    for (const b of boxes) {
        if (player.y > b.y && player.y <= b.y+b.height && player.x <= b.x+b.width && player.x+player.width >= b.x) {
            return true
        }
    }
    return false
}

function checkDownCollision(player: HitBox, boxes: HitBox[]): boolean {
    for (const b of boxes) {
        if (player.y+player.height >= b.y && player.y+player.height <= b.y+b.height && player.x <= b.x+b.width && player.x+player.width >= b.x) {
            return true
        }
    }
    return false

}

export {Tilemap, CollisionLayer, HitBox}
