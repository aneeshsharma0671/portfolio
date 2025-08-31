import { Scene } from "phaser";
export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  screenWidth: number;
  screenHeight: number;

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
    this.screenWidth = this.cameras.main.width;
    this.screenHeight = this.cameras.main.height;


    this.createWatchScreen();

    const seatLayout : {title : string, layoutStartX: number, layoutStartY:number,seatInfo : {type : SeatType, XPos : number, YPos:number}[][]}[] = [];

    const layoutCount = 3;
    for (let i = 0; i < layoutCount; i++) {
      const layoutStartX = 0;
      const gridHeight = 4;
      const gridWidth = 10;
      const gridGap = 20;
      const layoutStartY = 50 + i * (gridHeight * (15 + gridGap));

      const seatInfo : {type : SeatType, XPos : number, YPos:number}[][] = []; 

      for (let row = 0; row < gridHeight; row++) {
        const seatRow : {type : SeatType, XPos : number, YPos:number}[] = [];
        for (let col = 0; col < gridWidth; col++) {
          let seatType = SeatType.Available;
          if (col > 3 && col < 6) {
            seatType = SeatType.Stairs;
          }
          seatRow.push({type: seatType, XPos:  layoutStartX + (col * gridGap), YPos: layoutStartY + (row * gridGap)});
        }
        seatInfo.push(seatRow);
      }
      const layout = {title: `Layout ${i+1}`, layoutStartX: layoutStartX, layoutStartY: layoutStartY, seatInfo: seatInfo};
      seatLayout.push(layout);
    }

    console.log(seatLayout);
    seatLayout.forEach(layout => {
      this.add.text(layout.layoutStartX, layout.layoutStartY, layout.title, { fontSize: '20px', color: '#ffffff' });
      // Add Debug rectangle for layout area
      const layoutWidth = 10 * 20;
      const layoutHeight = 4 * 20;
      const layoutRect = this.add.rectangle(layout.layoutStartX + layoutWidth / 2 - 10, layout.layoutStartY + layoutHeight / 2 - 10, layoutWidth, layoutHeight);
      layoutRect.setStrokeStyle(2, 0xffffff);
      layout.seatInfo.forEach(row => {
        row.forEach(seatData => {
          const seat = new Seat(this, seatData.XPos + layout.layoutStartX, seatData.YPos + layout.layoutStartY, seatData.type);
          seat.render();
        });
      });
    });

    this.createWatchScreen();

  }

  createWatchScreen() {
    const screenPosX = this.screenWidth / 2;
    const screenPosY = this.screenHeight;
    const screen = this.add.rectangle(screenPosX, screenPosY, this.screenWidth * 0.5, 20, 0xffffff);
    screen.setStrokeStyle(4, 0xffffff);
    screen.setOrigin(0.5, 1);
  }

}

enum SeatType {
  Selectd,
  Available,
  Stairs
}
class Seat {
  xPos: number;
  yPos: number;
  scene: Phaser.Scene;
  type: SeatType;

  seatobject: Phaser.GameObjects.Rectangle;

  constructor(scene : Phaser.Scene, public x: number, public y: number , seatType: SeatType) {
    this.scene = scene;
    this.xPos = x;
    this.yPos = y;
    this.type = seatType;
  }

  render(addEventListener = true) {

    const myType = this.type;

    let seatColor = 0x00ff00;
    if (myType === SeatType.Selectd) {
      seatColor = 0xff00ff;
    } else if (myType === SeatType.Available) {
      seatColor = 0x00ffff;
    }
    else if (myType === SeatType.Stairs) {
      seatColor = 0xffff00;
    }

    this.seatobject = this.scene.add.rectangle(this.xPos, this.yPos, 15, 15, seatColor);
    this.seatobject.setOrigin(0, 0);
    this.seatobject.setStrokeStyle(2, seatColor);

    if(addEventListener && myType !== SeatType.Stairs) {
      this.seatobject.on('pointerdown', () => {
        console.log(`Seat at (${this.xPos}, ${this.yPos}) clicked.`);
        this.toggleSelect();
      });
      this.seatobject.setInteractive();
    }
  }
  
  toggleSelect() {
    if(this.type === SeatType.Available) {
      this.type = SeatType.Selectd;
    } else if(this.type === SeatType.Selectd) {
      this.type = SeatType.Available;
    }
    this.render(false);
  }

}
