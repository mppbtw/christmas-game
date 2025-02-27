//@ts-ignore
import "./style.css"
import {Snow} from "./snow.ts"
import * as PIXI from "pixi.js"
import { Tilemap, HitBox} from "./tilemapParser.ts"
import { Player } from "./player.ts"
import { Keyboard } from "./keyboardHandler.ts"
import { StatsHandler } from "./statsHandler.ts"
import { ResourceOption, ResourcesManager } from "./resources.ts"

document.querySelector<HTMLDivElement>('#stats')!.outerHTML = "<div id='statspanel'></div>";

PIXI.TextureStyle.defaultOptions.scaleMode = "nearest";

const scale_factor = 4;
const tile_unscaled_size = 16;
const map_size = 420;


const app = new PIXI.Application();
//await app.init({width: tile_unscaled_size*map_size, height: tile_unscaled_size*map_size, antialias: false, roundPixels: true, backgroundColor: "blue"});

(async () => {
  await app.init({
    backgroundColor: "blue",
    antialias: false,
    width: tile_unscaled_size*map_size,
    height: tile_unscaled_size*map_size,
    roundPixels: true,
  });
})().then(allTheStuff);




async function allTheStuff() {
  const kbd = new Keyboard();
  let hitboxes_enabled = false;
  kbd.addClickHandler("h", () => {hitboxes_enabled = !hitboxes_enabled});
  kbd.addClickHandler("n", () => {
    tilemap.collisionLayer.noclipEnabled = !tilemap.collisionLayer.noclipEnabled;
    noclipText.visible = !noclipText.visible;
  })

  document.getElementsByTagName("body")[0].style.cursor = "url('assets/pickaxe_2.png'), auto";
  document.getElementsByTagName("body")[0].style.cursor = "url('assets/pickaxe_1.png'), auto";
  document.getElementsByTagName("body")[0].style.cursor = "url('assets/cursor.png'), auto";

  const stats = new StatsHandler(app.renderer);
  kbd.addClickHandler("p", () => {stats.toggle()});

  const world = new PIXI.Container();
  world.width = tile_unscaled_size*map_size;
  world.height = tile_unscaled_size*map_size;
  world.scale = scale_factor;
  app.stage.addChild(world);

  let noclipText = new PIXI.Text({
    text: "Noclip :)",
    style:{
      fontFamily:"courier new",
      fill: 0xffffff,
      fontSize: "50"
    },
  })
  noclipText.visible = false;
  app.stage.addChild(noclipText)

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


  const tilemap = new Tilemap(PIXI.Assets.get("tilemap"), tile_unscaled_size, 100, 25);
  tilemap.position.set(0, 0);
  world.addChild(tilemap);

  const player = new Player(["green_1.png", "green_2.png", "green_3.png"], 12, 16, PIXI.Assets.get("items"));
  player.speed = 1.5;
  const playerSize = 20
  const playerAspectRatio = player.pixelWidth/player.pixelHeight;
  player.width = playerAspectRatio*playerSize;
  player.height = playerSize;
  world.addChild(player);
  player.spawnX = 400;
  player.spawnY = 1300;
  player.x = 400;
  player.y = 1450;
  handleVisualChunks();

  player.inventory.visible = false;
  app.stage.addChild(player.inventory);
  app.stage.addChild(player.handContainer);
  kbd.addClickHandler("e", () => {
    player.inventory.visible = !player.inventory.visible;
    player.craftingMenu.visible = !player.craftingMenu.visible;
  })
  player.craftingMenu.visible = false;
  app.stage.addChild(player.craftingMenu);
  app.stage.addChild(player.msgContainer)

  const itemsJSON = PIXI.Assets.get("items");
  const resourceOptions: ResourceOption[] = [];
  resourceOptions.push({
    width: 30,
    height: 30,
    resourceCount: 1,
    resourceSprite: "stonerock.png",
    resourceName: "stonerock",
    hits: 10,
    resourceItemName: "stone",
    miningSound: "stonehit",
    miningSoundVariants: 3,
    destroySound: "stonedestroy",
    destroySoundVariants: 1,
    needsTool: true,
  });
  resourceOptions.push({
    width: 20,
    height: 20,
    resourceCount: 3,
    resourceSprite: "coolcrate.png",
    resourceName: "stonecrate",
    hits: 2,
    resourceItemName: "stone",
    miningSound: "woodchop",
    miningSoundVariants: 3,
    destroySound: "wooddestroy",
    destroySoundVariants: 1,
    needsTool: false,
  });
  resourceOptions.push({
    width: 40,
    height: 60,
    resourceCount: 2,
    resourceSprite: "smalltree.png",
    resourceName: "smalltree",
    hits: 10,
    resourceItemName: "wood",
    miningSound: "woodchop",
    miningSoundVariants: 3,
    destroySound: "wooddestroy",
    needsTool: true,
    destroySoundVariants: 1,
  });
  resourceOptions.push({
    width: 20,
    height: 20,
    resourceCount: 1,
    resourceSprite: "coolcrate.png",
    resourceName: "axecrate",
    hits: 2,
    resourceItemName: "stoneaxe",
    miningSound: "woodchop",
    miningSoundVariants: 3,
    destroySound: "wooddestroy",
    destroySoundVariants: 1,
    needsTool: false,
  });
  resourceOptions.push({
    width: 40,
    height: 60,
    resourceCount: 2,
    resourceSprite: "smalltree.png",
    resourceName: "spookytree",
    hits: 1,
    resourceItemName: "wood",
    miningSound: "echo",
    miningSoundVariants: 1,
    destroySound: "bat",
    needsTool: false,
    destroySoundVariants: 1,
  });
  let resourceManager = new ResourcesManager(tilemap.resourceLayers,
                                             resourceOptions,
  itemsJSON,
  player.inventory,
  app, 600, (msg: string) => player.showMessage(msg),
    player.hand, tilemap, player);

  world.addChild(resourceManager)
  app.ticker.add(() => resourceManager.miningTick())

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
  app.ticker.add(() => player.updateMessagePosition())
  app.ticker.add(moveCamera);
  app.ticker.add(renderHealthBar);

  function handleVisualChunks() {
    const playerChunkRow = Math.floor((player.y/tile_unscaled_size)/tilemap.baseLayer.chunkSize)
    const playerChunkCol = Math.floor((player.x/tile_unscaled_size)/tilemap.baseLayer.chunkSize)
    if (player.visualChunkLocation[0] != playerChunkRow && player.visualChunkLocation[1] != playerChunkCol && player.spawnY != player.y && player.spawnX != player.x) {
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
}
