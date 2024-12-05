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

function isLayersData(obj: any): obj is TilemapData {
    return (
        obj &&
        Array.isArray(obj.layers) &&
        obj.layers.every(isLayer)
    );
}

class Tilemap extends CompositeTilemap {

    layers: Layer[]
    tile_unscaled_size: number

    constructor(src: Object, scale: number, tile_unscaled_size: number) {
        super();
        this.tile_unscaled_size = tile_unscaled_size;
        this.scale = scale;
        this.layers = [];
        if (isLayersData(src)) 
            src.layers.forEach(layer => {
                this.layers.push(layer)
            })
        else
            throw "Invalid tilemap JSON data."
    }

    renderLayerById(layerId: number) {
        for (const layer of this.layers) {
            console.log(layer.id);
            console.log(layerId);
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
                console.log("rendering tile ", layer.data[(layer.width*x) + y] + " at " + x + ", " + y)
                this.tile("tile_" + layer.data[(layer.width*y) + x] + ".png", start_x +x*16, start_y + y*16);
            }
        }
    }

};
export {Tilemap}
