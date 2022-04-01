export const textureSize = 1024;

export const waterLevel = 0.2;
export const sandLevel = 0.3;
export const dryGrassLevel = 0.4;
export const grassLevel = 0.6;
export const dirtLevel = 0.85;
export const rocksLevel = 1;

export function getPixel(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  sample = 1
) {
  const sum = [0, 0, 0];

  for (let i = 1; i < 1 + sample; i++) {
    for (let j = 1; j < 1 + sample; j++) {
      const red = (y * i * (width * 4) + x * 4 * j) % imageData.data.length;

      for (let k = 0; k < 3; k++) {
        sum[k] += imageData.data[red + k];
      }
    }
  }

  return sum.map((v) => v / (sample * sample));
}

export function drawPixel(
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  pixel: number[],
  sample = 1
) {
  for (let i = 1; i < 1 + sample; i++) {
    for (let j = 1; j < 1 + sample; j++) {
      const red = (y * i * (width * 4) + x * 4 * j) % imageData.data.length;

      for (let k = 0; k < 3; k++) {
        imageData.data[red + k] = pixel[k];
      }

      imageData.data[red + 3] = 255;
    }
  }
}

export const getTextureByHeight = (
  height: number,
  x: number,
  y: number,
  textures: Array<ImageData | undefined>
) => {
  if (height <= waterLevel) {
    return getColorFromTexture(x, y, textures[0]);
  }
  if (height <= sandLevel) {
    return getColorFromTexture(x, y, textures[1]);
  }
  if (height <= dryGrassLevel) {
    return getColorFromTexture(x, y, textures[2]);
  }
  if (height <= grassLevel) {
    return getColorFromTexture(x, y, textures[3]);
  }
  if (height <= dirtLevel) {
    return getColorFromTexture(x, y, textures[4]);
  }
  if (height <= rocksLevel) {
    return getColorFromTexture(x, y, textures[5]);
  }

  return getColorFromTexture(x, y, textures[5]);
};

export const getImagePixels = (image: CanvasImageSource) => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = textureSize;
  tempCanvas.height = textureSize;

  const ctx = tempCanvas.getContext("2d");
  ctx?.drawImage(image, 0, 0);

  const imageData = ctx?.getImageData(
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  );

  return imageData;
};

export const getColorFromTexture = (
  x: number,
  y: number,
  texture: ImageData | undefined
) => {
  if (!texture) {
    return [0, 0, 0];
  }
  const pixel = getPixel(texture, x, y, textureSize, 4);
  return pixel;
};

export const getColorByHeight = (height: number) => {
  if (height <= waterLevel) {
    return [255, 0, 0];
  }
  if (height <= grassLevel) {
    return [0, 255, 0];
  }

  return [0, 0, 255]
};
