export default class DungeonGenerator {
  public GetDungeon(gridSizeX: number, gridSizeY: number): number[][] {
    const finalData: number[][] = [];
    for (let i = 0; i < gridSizeY; i++) {
      finalData.push(new Array(gridSizeX).fill(0));
    }

    let root: bspNode | null = new bspNode(0, 0, gridSizeX, gridSizeY);
    this.splitNode(root, 15, 15);

    let fillValue = 10;
    // traverse the BSP tree and fill the finalData array
    const fillNode = (node: bspNode | null): void => {
      if (!node) return;

      if (node.left === null && node.right === null) {
        this.createRoom(node);
        const roomRect = node.room!;
        fillValue++;
        for (let y = roomRect.y; y < roomRect.y + roomRect.height; y++) {
          for (let x = roomRect.x; x < roomRect.x + roomRect.width; x++) {
            if (x >= 0 && x < gridSizeX && y >= 0 && y < gridSizeY) {
              finalData[y][x] = fillValue;
            }
          }
        }
      }

      fillNode(node.left);
      fillNode(node.right);
    };

    fillNode(root);

    return finalData;
  }

  private splitNode(node: bspNode, minWidth: number, minHeight: number): void {
    if (node.rect.width < minWidth * 2 || node.rect.height < minHeight * 2) {
      return;
    }

    const maxRatio = 2; // Maximum allowed width/height or height/width ratio

    // Decide split direction based on current node's aspect ratio
    let splitVertically: boolean;
    if (node.rect.width / node.rect.height > maxRatio) {
      splitVertically = true;
    } else if (node.rect.height / node.rect.width > maxRatio) {
      splitVertically = false;
    } else {
      splitVertically = Math.random() < 0.5;
    }

    if (splitVertically) {
      // Calculate valid split range to keep both sides within the ratio
      const minSplit = Math.max(
        minWidth,
        Math.ceil(node.rect.width / (maxRatio + 1))
      );
      const maxSplit = Math.min(
        node.rect.width - minWidth,
        Math.floor((node.rect.width * maxRatio) / (1 + maxRatio))
      );
      if (maxSplit < minSplit) return; // Can't split without violating ratio

      const splitX =
        Math.floor(Math.random() * (maxSplit - minSplit + 1)) + minSplit;
      node.left = new bspNode(
        node.rect.x,
        node.rect.y,
        splitX,
        node.rect.height
      );
      node.right = new bspNode(
        node.rect.x + splitX,
        node.rect.y,
        node.rect.width - splitX,
        node.rect.height
      );
    } else {
      // Calculate valid split range to keep both sides within the ratio
      const minSplit = Math.max(
        minHeight,
        Math.ceil(node.rect.height / (maxRatio + 1))
      );
      const maxSplit = Math.min(
        node.rect.height - minHeight,
        Math.floor((node.rect.height * maxRatio) / (1 + maxRatio))
      );
      if (maxSplit < minSplit) return; // Can't split without violating ratio

      const splitY =
        Math.floor(Math.random() * (maxSplit - minSplit + 1)) + minSplit;
      node.left = new bspNode(
        node.rect.x,
        node.rect.y,
        node.rect.width,
        splitY
      );
      node.right = new bspNode(
        node.rect.x,
        node.rect.y + splitY,
        node.rect.width,
        node.rect.height - splitY
      );
    }

    this.splitNode(node.left, minWidth, minHeight);
    this.splitNode(node.right, minWidth, minHeight);
  }

  private createRoom(node: bspNode): void {
    const minRoomSize = 10;

    // Calculate max possible padding (up to 25% of node size, floored)
    const maxPaddingX = Math.floor(node.rect.width * 0.25);
    const maxPaddingY = Math.floor(node.rect.height * 0.25);

    // Random padding between 0 and maxPadding
    const paddingX = Math.floor(Math.random() * (maxPaddingX + 1));
    const paddingY = Math.floor(Math.random() * (maxPaddingY + 1));

    const maxRoomWidth = Math.max(minRoomSize, node.rect.width - 2 * paddingX);
    const maxRoomHeight = Math.max(
      minRoomSize,
      node.rect.height - 2 * paddingY
    );

    const roomWidth =
      Math.floor(Math.random() * (maxRoomWidth - minRoomSize + 1)) +
      minRoomSize;
    const roomHeight =
      Math.floor(Math.random() * (maxRoomHeight - minRoomSize + 1)) +
      minRoomSize;

    const roomX =
      node.rect.x +
      paddingX +
      Math.floor(Math.random() * (maxRoomWidth - roomWidth + 1));
    const roomY =
      node.rect.y +
      paddingY +
      Math.floor(Math.random() * (maxRoomHeight - roomHeight + 1));

    node.room = new Rect(roomX, roomY, roomWidth, roomHeight);
  }
}

class bspNode {
  public left: bspNode | null = null;
  public right: bspNode | null = null;
  public rect: Rect;
  public room: Rect | null = null;

  constructor(x: number, y: number, width: number, height: number) {
    this.rect = new Rect(x, y, width, height);
  }
}

class Rect {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}
