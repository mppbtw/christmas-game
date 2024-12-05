import "./style.css"
import * as PIXI from "pixi.js"
import { Tilemap } from "./tilemapParser.ts"

document.querySelector<HTMLDivElement>('#app')!.innerHTML = "<div></div>"

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 3;
const tile_unscaled_size = 16;
const map_size = 100;

const app = new PIXI.Application();
await app.init({width: tile_unscaled_size*map_size*scale_factor, height: tile_unscaled_size*map_size*scale_factor, antialias: false, roundPixels: false});

document.body.appendChild(app.canvas);

app.ticker.maxFPS = 60;

window.addEventListener("resize", function() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});

PIXI.Assets.add({alias: "atlas", src: "assets/atlas.json"});
PIXI.Assets.add({alias: "tilemap", src: "assets/tilemap.json"});
await PIXI.Assets.load(["atlas"])
await PIXI.Assets.load(["tilemap"])

const tilemap = new Tilemap(PIXI.Assets.get("tilemap"), scale_factor, tile_unscaled_size);
tilemap.registerAsChild(app);
tilemap.renderLayerById(1);

const mid = PIXI.Sprite.from(PIXI.Assets.get("red.png"));
mid.scale = scale_factor;
mid.anchor.set(0.5);
mid.x = app.canvas.width/2;
mid.y = app.canvas.height/2;
app.stage.addChild(mid);

const player = PIXI.Sprite.from(PIXI.Assets.get("green.png"));
player.scale = scale_factor;
player.x = app.canvas.width / 2;
player.y = app.canvas.height / 2;
app.stage.addChild(player);
