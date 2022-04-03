import SimplexNoise from "simplex-noise";
import { drawPixel, getColorByHeight, getPixel } from "./utils";

export enum MapEnum {
  GREEN_HILLS = "GREEN_HILLS",
  DESERT = "DESERT",
  CAVE = "CAVE",
  SWAMP = "SWAMP",
}

export type MapType = keyof typeof MapEnum;

export type TextureType = {
  name: TerrainTexture;
  uv?: number;
};

type TerrainTexture = typeof availableTextures[number];

const availableTextures = [
  "dirt",
  "grass",
  "grass1",
  "rocks",
  "sand",
  "water",
  "desert_sand",
  "dry_ground",
  "cave_rock",
  "cave_floor",
  "cave_ceiling",
  "swamp",
  "mossy_grass",
  "moss",
] as const;

export const MapProperties: {
  [key in MapType]: {
    textures: [TextureType, TextureType, TextureType, TextureType];
    levels: [number, number, number];
    noiseSize: number;
    minLevel: number;
    mixAmount?: number;
    heightScale?: number;
    noiseSampling?: number;
    noiseFunc: (val: number) => number;
  };
} = {
  GREEN_HILLS: {
    levels: [0.25, 0.7, 0.9],
    minLevel: 0.0,
    mixAmount: 0.2,
    noiseSize: 0.007,
    heightScale: 2,
    noiseFunc: (value) => {
      value = (Math.sin(value) + 1) / 2;
      if (value > 0.5) {
        value += Math.exp(value / 5) - 1;
      }
      return value;
    },
    textures: [
      {
        name: "sand",
      },
      {
        name: "grass",
      },
      {
        name: "dirt",
      },
      {
        name: "rocks",
      },
    ],
  },
  DESERT: {
    levels: [0.25, 0.6, 0.8],
    minLevel: 0.2,
    noiseSize: 0.006,
    mixAmount: 0.2,
    heightScale: 1.25,
    noiseFunc: (value) => {
      value = (Math.sin(value) + 1) / 2;
      return value;
    },
    textures: [
      {
        name: "dry_ground",
        uv: 25,
      },
      {
        name: "desert_sand",
        uv: 50,
      },
      {
        name: "sand",
        uv: 25,
      },
      {
        name: "sand",
        uv: 25,
      },
    ],
  },
  CAVE: {
    levels: [0.3, 0.6, 0.7],
    minLevel: 0.1,
    noiseSize: 0.02,
    mixAmount: 0.2,
    heightScale: 2,
    noiseSampling: 2,
    noiseFunc: (value) => {
      value = (Math.sin(value) + 0.9) / 2;
      if (value >= 0.65) {
        value = value * 1.25;
      }
      return value;
    },
    textures: [
      {
        name: "cave_floor",
        uv: 25,
      },
      {
        name: "cave_rock",
        uv: 50,
      },
      {
        name: "cave_rock",
        uv: 25,
      },
      {
        name: "cave_ceiling",
        uv: 25,
      },
    ],
  },
  SWAMP: {
    levels: [0.25, 0.6, 0.75],
    minLevel: 0.0,
    mixAmount: 0.2,
    noiseSize: 0.006,
    heightScale: 1.25,
    noiseFunc: (value) => {
      value = (Math.sin(value) + 1) / 2;
      return value;
    },
    textures: [
      {
        name: "swamp",
        uv: 25,
      },
      {
        name: "mossy_grass",
        uv: 50,
      },
      {
        name: "mossy_grass",
        uv: 25,
      },
      {
        name: "moss",
        uv: 25,
      },
    ],
  },
};

export const generateNoise = (
  noiseCanvas: HTMLCanvasElement | null,
  mapType: MapType
) => {
  if (!noiseCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");

  if (!noiseCtx) {
    return;
  }

  const simplex = new SimplexNoise();

  const { noiseSize, minLevel, noiseSampling, noiseFunc } =
    MapProperties[mapType];

  const width = noiseCanvas.width;
  const height = noiseCanvas.height;

  const sampling = noiseSampling || 1;

  const addBorder = (x: number, y: number, value: number) => {
    if (x < width * 0.1) {
      const ratio = x / (width * 0.1);
      value = 1 / Math.exp(ratio * 4) + value;
    } else if (x > width * 0.9) {
      const dist = width - width * 0.9;
      const ratio = (width - x) / dist;
      value = 1 / Math.exp(ratio * 4) + value;
    }

    if (y < height * 0.1) {
      const ratio = y / (height * 0.1);
      value = 1 / Math.exp(ratio * 4) + value;
    } else if (y > height * 0.9) {
      const dist = height - height * 0.9;
      const ratio = (height - y) / dist;
      value = 1 / Math.exp(ratio * 4) + value;
    }

    return value;
  };

  if (sampling === 1) {
    const noiseData = noiseCtx.getImageData(0, 0, width, height);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let value = simplex.noise2D(x * noiseSize, y * noiseSize);
        value = noiseFunc(value);

        value = addBorder(x, y, value);

        if (value < minLevel) value = minLevel;
        
        const color = value * 255;

        drawPixel(noiseData, x, y, width, [color, color, color]);
      }
    }

    noiseCtx.putImageData(noiseData, 0, 0);

    return;
  }

  for (let x = 0; x < width / sampling; x++) {
    for (let y = 0; y < height / sampling; y++) {
      let value = simplex.noise2D(x * noiseSize, y * noiseSize);

      value = noiseFunc(value);
      value = addBorder(x, y, value);

      if (value < minLevel) value = minLevel;

      const color = value * 255;
      noiseCtx.fillStyle = `rgb(${color}, ${color}, ${color})`;
      noiseCtx.fillRect(x * sampling, y * sampling, sampling, sampling);
    }
  }
};

export const generateMixMap = (
  mixMapCanvas: HTMLCanvasElement | null,
  noiseCanvas: HTMLCanvasElement | null,
  mapType: MapType
) => {
  if (!noiseCanvas || !mixMapCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");

  const mixMapCtx = mixMapCanvas.getContext("2d");
  if (!noiseCtx || !mixMapCtx) {
    return;
  }

  const { levels, mixAmount } = MapProperties[mapType];

  const simplex = new SimplexNoise();

  const width = mixMapCanvas.width;
  const height = mixMapCanvas.height;

  const noiseData = noiseCtx.getImageData(0, 0, width, height);
  const mixMapData = new ImageData(width, height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = getPixel(noiseData, x, y, width);
      let val = pixel.reduce((prev, curr) => prev + curr, 0) / 3 / 255;

      // val += Math.random() * 0.05;
      val += simplex.noise2D(x, y) * (mixAmount || 0.05);

      const mixPixel = getColorByHeight(val, levels);
      drawPixel(mixMapData, x, y, width, mixPixel);
    }
  }
  mixMapCtx.putImageData(mixMapData, 0, 0);
};

export const blurMixMap = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return;

  const url = canvas.toDataURL("image/png");
  const image = new Image();
  image.onload = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.filter = "blur(2px)";
    ctx.drawImage(image, 0, 0);
  };
  image.src = url;
};
