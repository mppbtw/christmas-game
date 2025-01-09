import sharp from "sharp";
import * as fs from "fs";
import spritesheet from "@pencil.js/spritesheet";

//
// First, take all of the tile assets from the tilesheet png and break them down into individual PNGs
//

const devAssetsPath = "dev_assets/";
const tileAtlas = "tileset.png";
const tilesOutputDir = "assets/";
const tileSize = 16
const spritesOutputDir = "assets/";

const img = sharp(devAssetsPath + tileAtlas);
const meta = await img.metadata();

for (const file of await fs.promises.readdir(tilesOutputDir)) {
    await fs.promises.unlink(tilesOutputDir + file);
}

let counter = 0;
let promises = [];

for (let row = 0; row < Math.floor(meta.width/tileSize); row++) {
    for (let col = 0; col < Math.floor(meta.height/tileSize); col++) {
        const img = sharp(devAssetsPath + tileAtlas);
        counter++;
        const x = col * tileSize;
        const y = row * tileSize;

        const outputFileName = "tile_" + counter + ".png";

        const region = {left: x, top: y, width: tileSize, height: tileSize};
        console.log("Extracting the following region from " + devAssetsPath + tileAtlas + ":");
        console.log(region);
        promises.push(img.extract(region).toFile(tilesOutputDir + outputFileName));
    }
}
await Promise.all(promises);

//
// Then, copy all of the other sprite files as needed
//

const files = (fs.readdirSync(devAssetsPath)).filter((f) => (f !== tileAtlas) && f.endsWith(".png"));

files.forEach(f => console.log(f));
files.forEach((f) => promises.push(fs.promises.copyFile(devAssetsPath + f, spritesOutputDir + f)));
await Promise.all(promises);

//
// Now, we can merge them all into an atlas sheet
//

const sprites = fs.readdirSync(spritesOutputDir).filter((f) => f !== "atlas.png" && f.endsWith("png"));
const { json, image } = await spritesheet(sprites.map((f) => spritesOutputDir + f), {outputFormat: "png", outputName: "atlas.png", margin: 0, crop: false});

// Write the files (for example)
fs.writeFileSync(spritesOutputDir + "atlas.png", image);
fs.writeFileSync(spritesOutputDir + "atlas.json", JSON.stringify(json).replaceAll("assets/", ""));

//
// Copy over a stripped version of the tilemap JSON that Tiled exports to
//

let tm = JSON.parse(fs.readFileSync(devAssetsPath + "tilemap.json"));
tm = tm.layers;
fs.writeFileSync(spritesOutputDir + "tilemap.json", "{\"layers\":" + JSON.stringify(tm)+"}\n");

//
// Copy over the items.json data
//
fs.copyFileSync(devAssetsPath + "items.json", spritesOutputDir + "items.json")
