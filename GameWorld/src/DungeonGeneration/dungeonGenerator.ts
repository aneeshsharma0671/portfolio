export default class DungeonGenerator {
  public GetDungeon(
    gridSizeX: number,
    gridSizeY: number
  ): {
    partitions: Rect[];
    rooms: Rect[];
    paths: Path[];
  } {
    const partitions: Rect[] = [];
    const rooms: Rect[] = [];

    let root: bspNode | null = new bspNode(0, 0, gridSizeX, gridSizeY);
    this.splitNode(root, 10, 15);

    const createRooms = (node: bspNode | null): void => {
      if (!node) return;

      if (node.left === null && node.right === null) {
        this.createRoom(node);
        partitions.push(node.rect);
        rooms.push(node.room!);
      }

      createRooms(node.left);
      createRooms(node.right);
    };

    createRooms(root);

    const paths: Path[] = [];
    const collectPaths = (node: bspNode | null): void => {
      if (!node || !node.left || !node.right) return;

      const leftCenter = {
        x: node.left.rect.x + Math.floor(node.left.rect.width / 2),
        y: node.left.rect.y + Math.floor(node.left.rect.height / 2),
      };
      const rightCenter = {
        x: node.right.rect.x + Math.floor(node.right.rect.width / 2),
        y: node.right.rect.y + Math.floor(node.right.rect.height / 2),
      };

      paths.push({ pathStart: leftCenter, pathEnd: rightCenter });

      collectPaths(node.left);
      collectPaths(node.right);
    };

    collectPaths(root);

    return { partitions, rooms, paths };
  }

  private splitNode(node: bspNode, minWidth: number, minHeight: number): void {
    if (node.rect.width < minWidth * 2 || node.rect.height < minHeight * 2) {
      return;
    }

    const maxRatio = 1; // Maximum allowed width/height or height/width ratio

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
    // Padding as a random percentage (0% to 25%) of node size, floored
    const paddingPercentX = Math.random() * 0.25;
    const paddingPercentY = Math.random() * 0.25;
    const paddingX = Math.floor(node.rect.width * paddingPercentX);
    const paddingY = Math.floor(node.rect.height * paddingPercentY);

    // Room size is node size minus 2*padding
    let roomWidth = node.rect.width - 2 * paddingX;
    let roomHeight = node.rect.height - 2 * paddingY;

    // Enforce max aspect ratio (e.g., 2:1 or 1:2)
    const maxRatio = 2; // width/height or height/width cannot exceed this
    if (roomWidth / roomHeight > maxRatio) {
      roomWidth = Math.floor(roomHeight * maxRatio);
    } else if (roomHeight / roomWidth > maxRatio) {
      roomHeight = Math.floor(roomWidth * maxRatio);
    }
    // Room position is randomly offset within the allowed padding area
    const maxOffsetX = node.rect.width - roomWidth - paddingX;
    const maxOffsetY = node.rect.height - roomHeight - paddingY;
    const roomX =
      node.rect.x +
      paddingX +
      (maxOffsetX > 0 ? Math.floor(Math.random() * (maxOffsetX + 1)) : 0);
    const roomY =
      node.rect.y +
      paddingY +
      (maxOffsetY > 0 ? Math.floor(Math.random() * (maxOffsetY + 1)) : 0);

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

type Path = {
  pathStart: Vector2;
  pathEnd: Vector2;
};

type Vector2 = {
  x: number;
  y: number;
};
