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

interface TileObject {
    height: number;
    width: number;
    x: number;
    y: number;
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

class Tilemap extends CompositeTilemap {

    layers: Layer[]
    public collisionLayer: CollisionLayer | undefined
    tile_unscaled_size: number

    constructor(src: Object, tile_unscaled_size: number) {
        super();
        this.tile_unscaled_size = tile_unscaled_size;
        this.layers = [];
        if (isLayersData(src)) 
            src.layers.forEach(layer => {
                this.layers.push(layer)
            })
        else {
            throw "Invalid tilemap JSON data."
        }
    }

    loadCollisionLayer(layerName: string) {
        for (const layer of this.layers) {
            if (layer.name == layerName) {
                if (isObjectLayer(layer)) {
                    this.collisionLayer = new CollisionLayer(layer);
                }
            }
        }
    }

    renderLayerById(layerId: number) {
        for (const layer of this.layers) {
            if (layer.id === layerId)
                this.renderLayer(layer)
                return
        }
        throw "No such layer Id"
    }

    private renderLayer(layer: Layer) {
        const start_x = this.position.x;
        const start_y = this.position.y;
        for (let x = 0; x < layer.width; x++) {
            for (let y = 0; y < layer.height; y++) {
                this.tile("tile_" + layer.data[(layer.width*y) + x] + ".png", start_x +x*16, start_y + y*16);
            }
        }
    }

};

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

class CollisionLayer {

    boxes: HitBox[] = []
    constructor(layer: ObjectLayer) {
        for (var i = 0; i < layer.objects.length; i++) {
            const obj = layer.objects[i];
            this.boxes.push(new HitBox(obj.x, obj.y, obj.width, obj.height))
        }
    }

    checkRightCollision(player: HitBox): boolean {
        for (const b of this.boxes) {
            if (player.x+player.width >= b.x && player.x <= b.x+b.width && player.y <= b.y+b.height && player.y+player.height >= b.y) {
                return true
            }
        }
        return false
    }

    checkLeftCollison(player: HitBox): boolean {
        for (const b of this.boxes) {
            if (player.x > b.x && player.x <= b.x+b.width && player.y <= b.y+b.height && player.y+player.height >= b.y) {
                return true
            }
        }
        return false
    }

    checkUpCollision(player: HitBox): boolean {
        for (const b of this.boxes) {
            if (player.y > b.y && player.y <= b.y+b.height && player.x <= b.x+b.width && player.x+player.width >= b.x) {
                return true
            }
        }
        return false
    }

    checkDownCollision(player: HitBox): boolean {
        for (const b of this.boxes) {
            if (player.y+player.height >= b.y && player.y+player.height <= b.y+b.height && player.x <= b.x+b.width && player.x+player.width >= b.x) {
                return true
            }
        }
        return false

    }
}

export {Tilemap, CollisionLayer, HitBox}



