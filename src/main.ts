import "./style.css"
import * as PIXI from "pixi.js"
import { Tilemap } from "./tilemapParser.ts"
import { Player } from "./player.ts"
import { Keyboard } from "./keyboardHandler.ts"

document.querySelector<HTMLDivElement>('#app')!.innerHTML = "<div></div>"

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 3;
const tile_unscaled_size = 16;
const map_size = 5;

const kbd = new Keyboard();

const app = new PIXI.Application();
await app.init({width: tile_unscaled_size*map_size*scale_factor, height: tile_unscaled_size*map_size*scale_factor, antialias: false, roundPixels: false, backgroundColor: "blue"});

document.body.appendChild(app.canvas);

app.ticker.maxFPS = 60;

app.renderer.resize(window.innerWidth, window.innerHeight);
window.addEventListener("resize", function() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});

PIXI.Assets.add({alias: "atlas", src: "assets/atlas.json"});
PIXI.Assets.add({alias: "tilemap", src: "assets/tilemap.json"});
await PIXI.Assets.load(["atlas"])
await PIXI.Assets.load(["tilemap"])

const tilemap = new Tilemap(PIXI.Assets.get("tilemap"), scale_factor, tile_unscaled_size);
tilemap.position.set(20, 10);
tilemap.scale = scale_factor;
tilemap.worldTransform
tilemap.renderLayerById(1);
app.stage.addChild(tilemap);

const mid = PIXI.Sprite.from(PIXI.Assets.get("red.png"));
mid.scale = scale_factor;
mid.anchor.set(0.5);
mid.x = app.canvas.width/2;
mid.y = app.canvas.height/2;
app.stage.addChild(mid);

const player = new Player("green.png");
player.name = "Geoff Rungleman";
player.health = 100;
player.anchor.set(0.5);
player.x = app.canvas.width/2;
player.y = app.canvas.height/2;
const playerAspectRatio = player.pixelWidth/player.pixelHeight;
player.width = playerAspectRatio*scale_factor*40;
player.height = scale_factor*40;
app.stage.addChild(player);

app.ticker.add(() => kbd.pressedKeys.forEach(handleKey))
app.ticker.add(handleCameraFollow)

function handleKey(key: string) {
  if (key == "w") {
    player.y -= player.speed*scale_factor;
  }
  if (key == "s") {
    player.y += player.speed*scale_factor;
  }
  if (key == "d") {
    player.x += player.speed*scale_factor;
  }
  if (key == "a") {
    player.x -= player.speed*scale_factor;
  }
}

function handleCameraFollow() {
  app.stage.pivot.x = player.x - window.innerWidth/2;
  app.stage.pivot.y = player.y - window.innerHeight/2;
}
