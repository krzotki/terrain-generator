import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import SimplexNoise from "simplex-noise";
import { useGameEngine } from "./useGameEngine";
import * as BABYLON from "babylonjs";
import * as Textures from "babylonjs-procedural-textures";

const resolution = {
  x: 1024,
  y: 1024,
};

const textureSize = 256;

const sampling = 1;
const noiseSize = 0.003;

const terrainHeight = 0.75;

const grassTexture = new Image(textureSize, textureSize);
grassTexture.src = "/grass.jpg";

const waterTexture = new Image(textureSize, textureSize);
waterTexture.src = "/water.jpg";

const rocksTexture = new Image(textureSize, textureSize);
rocksTexture.src = "/rocks.jpg";

const tempCanvas = document.createElement("canvas");
tempCanvas.width = textureSize;
tempCanvas.height = textureSize;

const getImagePixels = (image: CanvasImageSource) => {
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

function getPixel(imageData: ImageData, x: number, y: number, width: number) {
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

const getColorByHeight = (height: number) => {
  if (height < 0) {
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

const getTextureByHeight = (height: number, x: number, y: number, textures: Array<ImageData | undefined>) => {
  if (height <= 0) {
    return getColorFromTexture(x * 2, y * 2, textures[0]);
  }
  if (height < 0.5) {
    return getColorFromTexture(x * 4, y * 4, textures[1]);
  }

  return getColorFromTexture(x * 4, y * 4, textures[2]);
};

const getColorFromTexture = (
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

const generateTerrain = (
  noiseCanvas: HTMLCanvasElement | null,
  textureCanvas: HTMLCanvasElement | null,
  specularCanvas: HTMLCanvasElement | null
) => {
  if (!noiseCanvas || !textureCanvas || !specularCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");
  const textureCtx = textureCanvas.getContext("2d");
  const specularCtx = specularCanvas.getContext("2d");
  if (!noiseCtx || !textureCtx || !specularCtx) {
    return;
  }

  const textures = [
    getImagePixels(waterTexture),
    getImagePixels(grassTexture),
    getImagePixels(rocksTexture)
  ];
  
  const simplex = new SimplexNoise();

  const width = noiseCanvas.width;
  const height = noiseCanvas.height;

  const iterX = width / sampling;
  const iterY = height / sampling;

  for (let x = 0; x < iterX; x++) {
    for (let y = 0; y < iterY; y++) {
      let value =
        simplex.noise2D(x * noiseSize, y * noiseSize) * terrainHeight + 0.1;
      if(value < 0) value = 0;
      const color = value * 255 + 127;

      noiseCtx.fillStyle = `rgb(${color}, ${color}, ${color})`;
      noiseCtx.fillRect(x * sampling, y * sampling, sampling, sampling);

      textureCtx.fillStyle = getTextureByHeight(value, x * sampling, y * sampling, textures);
      textureCtx.fillRect(x * sampling, y * sampling, sampling, sampling);

      specularCtx.fillStyle = `rgb(${200 - color}, ${200 - color}, ${
        200 - color
      })`;
      specularCtx.fillRect(x * sampling, y * sampling, sampling, sampling);
    }
  }
};

function App() {
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement>(null);
  const specularCanvasRef = useRef<HTMLCanvasElement>(null);

  const babylonCanvasRef = useRef<HTMLCanvasElement>(null);

  const { gameEngine, gameScene } = useGameEngine(babylonCanvasRef);

  const [ground, setGround] = useState<BABYLON.GroundMesh>();

  getImagePixels(grassTexture);

  const generate = React.useCallback(() => {
    generateTerrain(
      noiseCanvasRef.current,
      textureCanvasRef.current,
      specularCanvasRef.current
    );

    if (
      noiseCanvasRef.current &&
      textureCanvasRef.current &&
      specularCanvasRef.current &&
      gameScene
    ) {
      const heightUrl = noiseCanvasRef.current.toDataURL("image/png");
      const textureUrl = textureCanvasRef.current.toDataURL("image/png");
      const specularUrl = specularCanvasRef.current.toDataURL("image/png");
      if (ground) {
        ground.dispose();
      }

      const newGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
        "gdhm",
        heightUrl,
        { width: 10, height: 10, subdivisions: 100, maxHeight: 1, minHeight:0 }
      );

      let groundMaterial = new BABYLON.StandardMaterial("ground", gameScene);
      groundMaterial.diffuseTexture = new BABYLON.Texture(
        textureUrl,
        gameScene
      );

        // groundMaterial.diffuseTexture = new Textures.GrassProceduralTexture('grass', 1024, gameScene);

      groundMaterial.specularTexture = new BABYLON.Texture(
        specularUrl,
        gameScene
      );

      newGround.material = groundMaterial;
      newGround.scaling = new BABYLON.Vector3(2, 2, 2);
      setGround(newGround);
    }
  }, [noiseCanvasRef, textureCanvasRef, specularCanvasRef, gameScene, ground]);

  return (
    <div className="App">
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={noiseCanvasRef}
      ></canvas>
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={textureCanvasRef}
      ></canvas>
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={specularCanvasRef}
      ></canvas>
      <canvas ref={babylonCanvasRef} className="babylonCanvas"></canvas>
      <button onClick={generate}>Generate terrain</button>
    </div>
  );
}

export default App;
