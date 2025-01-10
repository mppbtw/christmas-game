import "./style.css"
import {Snow} from "./snow.ts"
import * as PIXI from "pixi.js"
import { Tilemap, HitBox} from "./tilemapParser.ts"
import { Player } from "./player.ts"
import { Keyboard } from "./keyboardHandler.ts"
import { StatsHandler } from "./statsHandler.ts"


document.querySelector<HTMLDivElement>('#app')!.outerHTML = "<div id='statspanel'></div>";

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 4;
const tile_unscaled_size = 16;
const map_size = 420;

const kbd = new Keyboard();
let hitboxes_enabled = false;
kbd.addClickHandler("h", () => {hitboxes_enabled = !hitboxes_enabled});

const app = new PIXI.Application();
await app.init({width: tile_unscaled_size*map_size, height: tile_unscaled_size*map_size, antialias: false, roundPixels: true, backgroundColor: "blue"});

const defaultIcon = "url('assets/cursor.png'),auto"

app.renderer.events.cursorStyles.default = defaultIcon

const stats = new StatsHandler(app.renderer);
kbd.addClickHandler("p", () => {stats.toggle()});

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
PIXI.Assets.add({alias: "items", src: "assets/items.json"});
await PIXI.Assets.load(["atlas"])
await PIXI.Assets.load(["items"])
await PIXI.Assets.load(["tilemap"])


const tilemap = new Tilemap(PIXI.Assets.get("tilemap"), tile_unscaled_size, 4, 25);
tilemap.position.set(0, 0);
world.addChild(tilemap);

const player = new Player(["green_1.png", "green_2.png", "green_3.png"], 12, 16, PIXI.Assets.get("items"));
player.x = 100;
player.y = 100;
player.speed = 1;
const playerSize = 20
const playerAspectRatio = player.pixelWidth/player.pixelHeight;
player.width = playerAspectRatio*playerSize;
player.height = playerSize;
world.addChild(player);
handleVisualChunks();

app.stage.addChild(player.inventory);
app.stage.addChild(player.handContainer);
kbd.addClickHandler("e", () => {
  player.inventory.visible = !player.inventory.visible;
})

const healthBar = new PIXI.Graphics();
healthBar.alpha = 1;
app.stage.addChild(healthBar);

const snowTexture = PIXI.Texture.from("snow.png");
const snow = new Snow(snowTexture,10, window.innerWidth, window.innerHeight);
app.stage.addChild(snow);

const hbs = new PIXI.Graphics();
hbs.alpha = 0.5;
world.addChild(hbs);

app.ticker.add(() => snow.updateSnow());
app.ticker.add(() => kbd.pressedKeys.forEach(handleKey));
app.ticker.add(() => {if (!kbd.isWasdPressed()) {player.gotoAndStop(0); player.isMoving = false}});
app.ticker.add(() => {if (player.isMoving) {handleVisualChunks()}});
app.ticker.add(renderHitboxes);
app.ticker.add(moveCamera);
app.ticker.add(renderHealthBar);

function handleVisualChunks() {
  const playerChunkRow = Math.floor((player.y/tile_unscaled_size)/tilemap.baseLayer.chunkSize)
  const playerChunkCol = Math.floor((player.x/tile_unscaled_size)/tilemap.baseLayer.chunkSize)
  if (player.visualChunkLocation[0] != playerChunkRow && player.visualChunkLocation[1] != playerChunkCol) {
    return
  }
  player.visualChunkLocation = [playerChunkRow, playerChunkCol];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      try {
        tilemap.renderVisualChunk(i+playerChunkRow, j+playerChunkCol);
      } catch (e) {}
    }
  }
}

function renderHealthBar() {
  if (player.health != 100) {
    healthBar.clear();
    const width = 80
    healthBar.rect(window.innerWidth/2-(width/2), (window.innerHeight/2)+player.height*2, width, 10).fill(0xd12121);
    healthBar.rect(window.innerWidth/2-(width/2), (window.innerHeight/2)+player.height*2, width*(player.health/100), 10).fill(0x5cd121);
  }
}

function renderHitboxes() {
  if (hitboxes_enabled) {
    hbs.clear();
    hbs.rect(player.x+player.hb.x, player.y+player.hb.y, player.hb.width, player.hb.height);

    for (let i = 0; i < Math.floor(tilemap.baseLayer.layerWidth/tilemap.collisionChunkSize); i++) {
      for (let j = 0; j < Math.floor(tilemap.baseLayer.layerHeight/tilemap.collisionChunkSize); j++) {
        if (tilemap.collisionLayer.chunks[j] && tilemap.collisionLayer.chunks[j][i]) { 
          tilemap.collisionLayer.chunks[j][i].boxes.forEach(b => {
            hbs.rect(b.x, b.y, b.width, b.height);
          })
        }
      }
    }

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
  const playerHB = new HitBox(player.x+player.hb.x, player.y+player.hb.y, player.hb.width, player.hb.height)
  if (key == "w") {
    if (!tilemap.collisionLayer.checkUpCollision(playerHB, player.speed)) {
      player.y -= player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "s") {
    if (!tilemap.collisionLayer.checkDownCollision(playerHB, player.speed)) {
      player.y += player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "d") {
    if (!tilemap.collisionLayer.checkRightCollision(playerHB, player.speed)) {
      player.x += player.speed;
      if (!player.isMoving) {
        player.isMoving = true;
      }
    }
  }
  if (key == "a") {
    if (!tilemap.collisionLayer.checkLeftCollision(playerHB, player.speed)) {
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
