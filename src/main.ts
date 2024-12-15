import "./style.css"
import {Snow} from "./snow.ts"
import * as PIXI from "pixi.js"
import { Tilemap, HitBox} from "./tilemapParser.ts"
import { Player } from "./player.ts"
import { Keyboard } from "./keyboardHandler.ts"

document.querySelector<HTMLDivElement>('#app')!.innerHTML = "<div></div>"

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 3;
const tile_unscaled_size = 16;
const map_size = 420;


const kbd = new Keyboard();
let hitboxes_enabled = false;
kbd.addClickHandler("h", () => {hitboxes_enabled = !hitboxes_enabled});

const app = new PIXI.Application();
await app.init({width: tile_unscaled_size*map_size, height: tile_unscaled_size*map_size, antialias: false, roundPixels: true, backgroundColor: "blue"});

const world = new PIXI.Container();
world.width = tile_unscaled_size*map_size;
world.height = tile_unscaled_size*map_size;
world.scale = scale_factor;
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

const tilemap = new Tilemap(PIXI.Assets.get("tilemap"), tile_unscaled_size, 4);
tilemap.position.set(0, 0);
world.addChild(tilemap);

const player = new Player(["green_1.png", "green_2.png", "green_3.png"]);
player.x = 100;
player.y = 100;
player.speed = 1;
const playerSize = 20
const playerAspectRatio = player.pixelWidth/player.pixelHeight;
player.width = playerAspectRatio*playerSize;
player.height = playerSize;
world.addChild(player);

const snowTexture = PIXI.Texture.from("snow.png");
const snow = new Snow(snowTexture,10, window.innerWidth, window.innerHeight);
app.stage.addChild(snow);

const hbs = new PIXI.Graphics();
world.addChild(hbs);

app.ticker.add(() => snow.updateSnow());
app.ticker.add(() => kbd.pressedKeys.forEach(handleKey));
app.ticker.add(() => {if (!kbd.isWasdPressed()) {player.gotoAndStop(0); player.isMoving = false}});
app.ticker.add(renderHitboxes);
app.ticker.add(moveCamera);

function renderHitboxes() {
  if (hitboxes_enabled) {
    hbs.clear();
    hbs.rect(player.x, player.y, player.width, player.height);

    const playerChunkX = Math.floor(Math.floor(player.x/tile_unscaled_size)/tilemap.chunkSize);
    const playerChunkY = Math.floor(Math.floor(player.y/tile_unscaled_size)/tilemap.chunkSize);
    if (tilemap.collisionLayer.chunks[playerChunkY] && tilemap.collisionLayer.chunks[playerChunkY][playerChunkX]) { 
      tilemap.collisionLayer.chunks[playerChunkY][playerChunkX].boxes.forEach(b => {
        hbs.rect(b.x, b.y, b.width, b.height);
      })
    }

    hbs.alpha = 0.5;
    hbs.fill(0);


  } else {
    hbs.clear();
  }
}

function moveCamera() {
  world.position.set(app.renderer.screen.width/2, app.renderer.screen.height/2);
  world.pivot.x = player.position.x+(player.width/2);
  world.pivot.y = player.position.y+(player.height/2);
}

function handleKey(key: string) {
  const playerChunkX = Math.floor(Math.floor(player.x/tile_unscaled_size)/tilemap.chunkSize);
  const playerChunkY = Math.floor(Math.floor(player.y/tile_unscaled_size)/tilemap.chunkSize);
  if (key == "w") {
    const newHB = new HitBox(player.x, player.y-player.speed, player.width, player.height);
    if (!tilemap.collisionLayer.checkUpCollision(newHB, playerChunkX, playerChunkY)) {
      player.y -= player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "s") {
    const newHB = new HitBox(player.x, player.y+player.speed, player.width, player.height);
    if (!tilemap.collisionLayer.checkDownCollision(newHB, playerChunkX, playerChunkY)) {
      player.y += player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "d") {
    const newHB = new HitBox(player.x+player.speed, player.y, player.width, player.height);
    if (!tilemap.collisionLayer.checkRightCollision(newHB, playerChunkX, playerChunkY)) {
      player.x += player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "a") {
    const newHB = new HitBox(player.x-player.speed, player.y, player.width, player.height);
    if (!tilemap.collisionLayer.checkLeftCollision(newHB, playerChunkX, playerChunkY)) {
      player.x -= player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }

  if (player.isMoving) {
    player.play();
    if (player.currentFrame == 0) {
      player.currentFrame = 1
    }
  } else {
    player.gotoAndStop(0)
  }
}
