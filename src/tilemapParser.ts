import { CompositeTilemap } from "@pixi/tilemap";
import { Point } from "pixi.js";

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
    id: any;
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

function chunkOf(x: number, y: number, chunkSize: number, tileSize: number): number[] {
    const col = Math.floor(Math.floor(x/tileSize)/chunkSize);
    const row = Math.floor(Math.floor((y)/tileSize)/chunkSize);
    return [row, col];
} 

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

class ResourceLayer {
    locations: Point[];
    resourceName: string;
    ids: any[];
    
    constructor(locations: Point[], resourceName: string, ids: any[]) {
        this.resourceName = resourceName;
        this.ids = ids;
        this.locations = locations;
    }
}

class Tilemap extends CompositeTilemap {

    baseLayer: VisualLayer;
    collisionLayer: CollisionLayer;
    tileUnscaledSize: number
    collisionChunkSize: number;
    visualChunkSize: number;
    resourceLayers: ResourceLayer[];

    removeHbById(id: any) {
        this.collisionLayer.chunks.forEach(chunkRow => {
            chunkRow.forEach(chunk => {
                for (let i=0; i<chunk.ids.length; i++) {
                    if (chunk.ids[i] == id) {
                        chunk.ids.splice(i, 1);
                        chunk.boxes.splice(i, 1);
                    }
                }
            })
        })
    }

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



        this.baseLayer = new VisualLayer(baseLayer, tileUnscaledSize, visualChunkSize);

        // Find the resource layers
        this.resourceLayers = [];
        const collisionLayerData = src.layers.find(l => l.name == "Collision");
        if (!collisionLayerData) {
            throw "No collision layer found";
        }
        if (!isObjectLayer(collisionLayerData)) {
            throw "Collision layer found, but it's not a valid object layer"
        }

        const resourceLayers = src.layers.filter(l => l.name.startsWith("resource:"))
        for (let i=0; i<resourceLayers.length; i++) {
            const layer = new ResourceLayer([], resourceLayers[i].name.split(":")[1]!, []);
            //@ts-ignore
            resourceLayers[i].objects.forEach(o => {
                layer.locations.push(new Point(Math.floor(o.x), Math.floor(o.y)));
                layer.ids.push(o.id);
                //@ts-ignore
                collisionLayerData.objects.push({x:o.x, y: o.y, width: o.width, height:o.height, id: o.id});
            })
            this.resourceLayers.push(layer)
        }


        

        this.collisionLayer = new CollisionLayer(collisionLayerData, collisionChunkSize, this.tileUnscaledSize, baseLayer.width, baseLayer.height);

        if (typeof this.collisionLayer == "undefined") {
            throw "No collision layer found"
        }
    }

    renderVisualChunk(row: number, col: number) {
        const chunk = this.baseLayer.chunks[row][col];
        if (chunk.showing) {
            return;
        }
        for (let x = 0; x < this.baseLayer.chunkSize; x++) {
            for (let y = 0; y < this.baseLayer.chunkSize; y++) {
                const tileIndex = y*this.baseLayer.chunkSize + x;
                const start_x = chunk.x*16;
                const start_y = chunk.y*16;
                chunk.showing = true;
                if (typeof(chunk.data[tileIndex]) != "undefined") {
                    this.tile("tile_" + chunk.data[tileIndex] + ".png", start_x +x*16, start_y + y*16);
                }
            }
        }
    }
};

class VisualChunk {
    public x: number = 0;
    public y: number = 0;
    public data: number[] = [];
    public showing: boolean = false;
}

class VisualLayer {
    public chunks: VisualChunk[][] = [];
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
    ids: any[] = [];
}

class CollisionLayer {
    chunks: CollisionChunk[][] = []
    collisionChunkSize: number;
    layerWidth: number;
    layerHeight: number;
    tileSize: number;
    noclipEnabled: boolean;

    constructor(layer: ObjectLayer, collisionChunkSize: number, tileSize: number, layerWidth: number, layerHeight: number) {
        this.noclipEnabled = false;
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
            this.chunks[row][col].ids.push(o.id);
        });
    }

    checkBorderCollision(player: HitBox) {
        return player.x < 0 || player.y < 0 || player.x+player.width > this.layerWidth*this.tileSize || player.y+player.height > this.layerHeight*this.tileSize
    }

    getPotentialBoxes(hb: HitBox): HitBox[] {
        if (this.noclipEnabled) {
            return [];
        }

        const topLeft = chunkOf(hb.x, hb.y, this.collisionChunkSize, this.tileSize);
        const topRight = chunkOf(hb.x+hb.width, hb.y, this.collisionChunkSize, this.tileSize);
        const bottomLeft = chunkOf(hb.x, hb.y+hb.height, this.collisionChunkSize, this.tileSize);
        const bottomRight = chunkOf(hb.x+hb.width, hb.y+hb.height, this.collisionChunkSize, this.tileSize);

        let checkedChunks = [];
        let boxes: HitBox[] = [];
        checkedChunks.push(topLeft)

        {
            boxes = boxes.concat(this.chunks[topRight[0]][topRight[1]].boxes);
        }
        {
            boxes = boxes.concat(this.chunks[topLeft[0]][topLeft[1]].boxes);
        }
        {
            boxes = boxes.concat(this.chunks[bottomLeft[0]][bottomLeft[1]].boxes);
        }
        {
            boxes = boxes.concat(this.chunks[bottomRight[0]][bottomRight[1]].boxes);
        }
        let total = 0;
        this.chunks.forEach(c => c.forEach(b => total += b.boxes.length))
        return boxes
    }

    //constructor(x: number, y: number, width: number, height: number) {
    checkLeftCollision(player: HitBox, speed: number): boolean {
        const newHB = new HitBox(player.x-speed, player.y, player.width, player.height);
        // Check that were not on a boundary
        if (this.checkBorderCollision(newHB)) {
            return true
        }

        const boxes = this.getPotentialBoxes(newHB)
        return checkLeftCollision(newHB, boxes);
    }

    checkRightCollision(player: HitBox, speed: number): boolean {
        const newHB = new HitBox(player.x+speed, player.y, player.width, player.height);
        // Check that were not on a boundary
        if (this.checkBorderCollision(newHB)) {
            return true
        }
        const boxes = this.getPotentialBoxes(newHB)
        return checkRightCollision(newHB, boxes);
    }

    checkUpCollision(player: HitBox, speed: number): boolean {
        // Check that were not on a boundary
        const newHB = new HitBox(player.x, player.y-speed, player.width, player.height);
        if (this.checkBorderCollision(newHB)) {
            return true
        }
        const boxes = this.getPotentialBoxes(newHB)
        return checkUpCollision(newHB, boxes);
    }

    checkDownCollision(player: HitBox, speed: number): boolean {
        // Check that were not on a boundary
        const newHB = new HitBox(player.x, player.y+speed, player.width, player.height);
        if (this.checkBorderCollision(newHB)) {
            return true
        }
        const boxes = this.getPotentialBoxes(newHB)
        return checkDownCollision(newHB, boxes);
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

export {Tilemap, CollisionLayer, HitBox, ResourceLayer}
