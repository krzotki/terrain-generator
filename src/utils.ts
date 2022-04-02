
export function getPixel(
  imageData: ImageData,
  x: number,
  y: number,
  width: number
) {
  const red = (y * (width * 4) + x * 4) % imageData.data.length;

  return [
    imageData.data[red],
    imageData.data[red + 1],
    imageData.data[red + 2],
  ];
}

export const drawPixel = (
  imageData: ImageData,
  x: number,
  y: number,
  width: number,
  pixel: number[]
) => {
  const red = (y * (width * 4) + x * 4) % imageData.data.length;

  for (let k = 0; k < 3; k++) {
    imageData.data[red + k] = pixel[k];
  }

  imageData.data[red + 3] = pixel[3] !== undefined ? pixel[3] : 255;
};

export const getImagePixels = (image: ImageBitmap) => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;

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

export const getColorByHeight = (
  height: number,
  levels: [number, number, number]
) => {
  if (height <= levels[0]) {
    return [255, 0, 0, 255];
  }
  if (height <= levels[1]) {
    return [0, 255, 0, 255];
  }
  if (height <= levels[2]) {
    return [0, 0, 255, 255];
  }

  return [0, 0, 0, 0];
};
