import "./style.css"
import * as PIXI from "pixi.js"
import { Tilemap } from "./tilemapParser.ts"
import { Player } from "./player.ts"
import { Keyboard } from "./keyboardHandler.ts"

document.querySelector<HTMLDivElement>('#app')!.innerHTML = "<div></div>"

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 3;
const tile_unscaled_size = 16;
const map_size = 100;

const kbd = new Keyboard();

const app = new PIXI.Application();
await app.init({width: tile_unscaled_size*map_size, height: tile_unscaled_size*map_size, antialias: false, roundPixels: true, backgroundColor: "blue"});

const world = new PIXI.Container();
world.width = tile_unscaled_size*map_size;
world.width = tile_unscaled_size*map_size;
app.stage.addChild(world);

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
tilemap.position.set(0, 0);
tilemap.renderLayerById(1);
world.addChild(tilemap);

const mid = PIXI.Sprite.from(PIXI.Assets.get("red.png"));
mid.scale = scale_factor;
mid.anchor.set(0.5);
mid.x = app.canvas.width/2;
mid.y = app.canvas.height/2;
world.addChild(mid);


const player = new Player("green.png");
player.anchor.set(0.5);
player.x = window.innerWidth/2;
player.y = window.innerHeight/2;
player.speed = 2;
const playerSize = 20
const playerAspectRatio = player.pixelWidth/player.pixelHeight;
player.width = playerAspectRatio*scale_factor*playerSize;
player.height = scale_factor*playerSize;
app.stage.addChild(player);

app.ticker.add(() => kbd.pressedKeys.forEach(handleKey))
app.ticker.add(() => handleEnemyMovement(mid))


function handleEnemyMovement(enemy: PIXI.Sprite) {
  if (player.x > enemy.x + world.x) 
    enemy.position.x += 1;
  if (player.x < enemy.x + world.x)
    enemy.x -= 1;
  if (player.y > enemy.y + world.y) 
    enemy.position.y += 1;
  if (player.y < enemy.y + world.y)
    enemy.y -= 1;
}

function handleKey(key: string) {
  if (key == "w") {
    world.y += player.speed*scale_factor;
  }
  if (key == "s") {
    world.y -= player.speed*scale_factor;
  }
  if (key == "d") {
    world.x -= player.speed*scale_factor;
  }
  if (key == "a") {
    world.x += player.speed*scale_factor;
  }
}
