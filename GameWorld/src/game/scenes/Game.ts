import { Scene } from "phaser";
import DungeonGenerator from "../../DungeonGeneration/dungeonGenerator";

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

    const gridSizeX = 128;
    const gridSizeY = 64;
    const dungeonGenerator = new DungeonGenerator();
    const dungeon = dungeonGenerator.GetDungeon(gridSizeX, gridSizeY);

    // Build gridData here
    const gridData: number[][] = [];
    for (let i = 0; i < gridSizeY; i++) {
      gridData.push(new Array(gridSizeX).fill(-1)); // -1 = wall, 0 = floor
    }

    // Carve out rooms
    dungeon.rooms.forEach((room) => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < gridSizeX && y >= 0 && y < gridSizeY) {
            gridData[y][x] = 0;
          }
        }
      }
    });

    // Carve out paths
    const pathWidth = 3;
    const halfWidth = Math.floor(pathWidth / 2);
    dungeon.paths.forEach((path) => {
      const { pathStart, pathEnd } = path;
      // Horizontal segment
      for (
        let x = Math.min(pathStart.x, pathEnd.x);
        x <= Math.max(pathStart.x, pathEnd.x);
        x++
      ) {
        for (let dy = -halfWidth; dy <= halfWidth; dy++) {
          const y = pathStart.y + dy;
          if (x >= 0 && x < gridSizeX && y >= 0 && y < gridSizeY) {
            gridData[y][x] = 0;
          }
        }
      }
      // Vertical segment
      for (
        let y = Math.min(pathStart.y, pathEnd.y);
        y <= Math.max(pathStart.y, pathEnd.y);
        y++
      ) {
        for (let dx = -halfWidth; dx <= halfWidth; dx++) {
          const x = pathEnd.x + dx;
          if (x >= 0 && x < gridSizeX && y >= 0 && y < gridSizeY) {
            gridData[y][x] = 0;
          }
        }
      }
    });

    const map = this.make.tilemap({
      key: "map",
      tileWidth: 16,
      tileHeight: 16,
      width: gridSizeX,
      height: gridSizeY,
      data: gridData,
    });
    const tileset = map.addTilesetImage("tiles");
    const layer = map.createLayer(0, tileset!, 0, 0); // layer index, tileset, x, y
    layer!.setScale(0.5); // Scale the layer to make it larger
    layer!.skipCull = true;
    layer?.setVisible(true);

    // if (dungeon.partitions) {
    //   const graphics = this.add.graphics();
    //   graphics.lineStyle(2, 0xff0000, 1);

    //   dungeon.partitions.forEach(
    //     (partition: {
    //       x: number;
    //       y: number;
    //       width: number;
    //       height: number;
    //     }) => {
    //       graphics.strokeRect(
    //         partition.x * 8, // adjust scale if needed
    //         partition.y * 8,
    //         partition.width * 8,
    //         partition.height * 8
    //       );
    //     }
    //   );
    //   graphics.setScrollFactor(0);
    // }

    // if (dungeon.rooms) {
    //   const graphics = this.add.graphics();
    //   graphics.lineStyle(2, 0x0000ff, 1);

    //   if (dungeon.paths) {
    //     console.log("Paths found:", dungeon.paths);
    //     dungeon.paths.forEach((path) => {
    //       graphics.lineStyle(20, 0x0000ff, 1); // yellow color for
    //       graphics.moveTo(path.pathStart.x * 8, path.pathStart.y * 8);
    //       graphics.lineTo(path.pathEnd.x * 8, path.pathEnd.y * 8).setDepth(0);
    //       graphics.strokePath();
    //     });
    //   }

    //   dungeon.rooms.forEach(
    //     (room: { x: number; y: number; width: number; height: number }) => {
    //       graphics.lineStyle(2, 0x0000ff, 1); // blue color for rooms
    //       graphics.strokeRect(
    //         room.x * 8, // adjust scale if needed
    //         room.y * 8,
    //         room.width * 8,
    //         room.height * 8
    //       );
    //       graphics.fillStyle(0x0000ff, 1); // blue fill with 20% opacity
    //       graphics
    //         .fillRect(room.x * 8, room.y * 8, room.width * 8, room.height * 8)
    //         .setDepth(10);
    //     }
    //   );

    //   graphics.setScrollFactor(0);
    // }

    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
