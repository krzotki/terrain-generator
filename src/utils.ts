export const textureSize = 256;

export const waterLevel = -0.25;

export const grassLevel = 0;

export const dirtLevel = 0.2;

export function getPixel(
  imageData: ImageData,
  x: number,
  y: number,
  width: number
) {
  const red = (y * (width * 4) + x * 4) % imageData.data.length;
  const colorIndices = [red, red + 1, red + 2, red + 3];

  const redIndex = colorIndices[0];
  const greenIndex = colorIndices[1];
  const blueIndex = colorIndices[2];
  const alphaIndex = colorIndices[3];

  const redForCoord = imageData.data[redIndex];
  const greenForCoord = imageData.data[greenIndex];
  const blueForCoord = imageData.data[blueIndex];
  const alphaForCoord = imageData.data[alphaIndex];

  return [redForCoord, greenForCoord, blueForCoord, alphaForCoord];
}


export const getTextureByHeight = (
  height: number,
  x: number,
  y: number,
  textures: Array<ImageData | undefined>
) => {
  if (height <= waterLevel) {
    return getColorFromTexture(x * 2, y * 2, textures[0]);
  }
  if (height <= grassLevel) {
    return getColorFromTexture(x * 4, y * 4, textures[1]);
  }

  if(height <= dirtLevel) {
    return getColorFromTexture(x * 2, y * 2, textures[2]);
  }

  return getColorFromTexture(x * 4, y * 4, textures[3]);
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
    return `rgb(0, 0, 0)`;
  }
  const pixel = getPixel(texture, x, y, textureSize);
  return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
};


export const getColorByHeight = (height: number) => {
    if (height <= waterLevel) {
      const blue = height * 100 + 150;
      const green = -Math.pow(height, 2) * 100 + 100;
      return `rgb(0, ${green}, ${blue})`;
    }
    if (height < 0.5) {
      const red = height * 127;
      const green = -height * 127 + 127;
      const blue = -height * 100 + 31;
      return `rgb(${red}, ${green}, ${blue})`;
    }
  
    const red = 31 + height * 63;
    const green = 31 + height * 63;
    const blue = height * 63;
    return `rgb(${red}, ${green}, ${blue})`;
  };