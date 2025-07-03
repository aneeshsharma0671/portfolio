import { Scene } from "phaser";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;

  constructor() {
    super("Game");
  }

  preload() {
    // Load assets for the game scene
    this.load.image("tiles", "assets/tilemap.png");
    this.load.tilemapCSV("map", "assets/Tile.csv");
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(512, 384, "background");
    this.background.setAlpha(0.5);

    const map = this.make.tilemap({
      key: "map",
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset = map.addTilesetImage("tiles");
    const layer = map.createLayer(0, tileset!, 0, 0); // layer index, tileset, x, y
    layer!.skipCull = true;

    this.input.once("pointerdown", () => {
      this.scene.start("GameOver");
    });
  }
}
