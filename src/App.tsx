import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import SimplexNoise from "simplex-noise";
import { useGameEngine } from "./useGameEngine";
import * as BABYLON from "babylonjs";
import "babylonjs-materials";
import {
  getImagePixels,
  getPixel,
  getTextureByHeight,
  waterLevel,
  textureSize,
  drawPixel,
  getColorByHeight,
  dirtLevel,
} from "./utils";

const resolution = {
  x: 2048,
  y: 2048,
};

const grassTexture = new Image(textureSize, textureSize);
grassTexture.src = "/grass.jpg";

const dryGrassTexture = new Image(textureSize, textureSize);
dryGrassTexture.src = "/grass1.jpg";

const sandTexture = new Image(textureSize, textureSize);
sandTexture.src = "/sand.jpg";

const waterTexture = new Image(textureSize, textureSize);
waterTexture.src = "/water.jpg";

const rocksTexture = new Image(textureSize, textureSize);
rocksTexture.src = "/rocks.jpg";

const dirtTexture = new Image(textureSize, textureSize);
dirtTexture.src = "/dirt.jpg";

const simplex = new SimplexNoise();

const generateNoise = (noiseCanvas: HTMLCanvasElement | null) => {
  if (!noiseCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");

  if (!noiseCtx) {
    return;
  }

  const noiseSize = 0.004;

  const width = noiseCanvas.width;
  const height = noiseCanvas.height;

  const noiseData = noiseCtx.getImageData(0, 0, width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let value = simplex.noise2D(x * noiseSize, y * noiseSize);
      value = (Math.sin(value) + 1) / 2;

      if (value < waterLevel) value = waterLevel;

      const color = value * 255;
      drawPixel(noiseData, x, y, width, [color, color, color]);
    }
  }

  noiseCtx.putImageData(noiseData, 0, 0);
};

const generateSpecular = (
  specularCanvas: HTMLCanvasElement | null,
  noiseCanvas: HTMLCanvasElement | null
) => {
  if (!noiseCanvas || !specularCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");

  const specularCtx = specularCanvas.getContext("2d");
  if (!noiseCtx || !specularCtx) {
    return;
  }

  const width = specularCanvas.width;
  const height = specularCanvas.height;

  const noiseData = noiseCtx.getImageData(0, 0, width, height);
  const specularData = specularCtx.getImageData(0, 0, width, height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = getPixel(noiseData, x, y, width);
      const val = pixel.reduce((prev, curr) => prev + curr, 0) / 3;
      drawPixel(specularData, x, y, width, [200 - val, 200 - val, 200 - val]);
    }
  }

  specularCtx.putImageData(specularData, 0, 0);
};

const generateMixMap = (
  mixMapCanvas: HTMLCanvasElement | null,
  noiseCanvas: HTMLCanvasElement | null
) => {
  if (!noiseCanvas || !mixMapCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");

  const mixMapCtx = mixMapCanvas.getContext("2d");
  if (!noiseCtx || !mixMapCtx) {
    return;
  }

  const width = mixMapCanvas.width;
  const height = mixMapCanvas.height;

  const noiseData = noiseCtx.getImageData(0, 0, width, height);
  const mixMapData = new ImageData(width, height);

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = getPixel(noiseData, x, y, width);
      let val = pixel.reduce((prev, curr) => prev + curr, 0) / 3 / 255;

      // val += Math.random() * 0.05;
      val += simplex.noise2D(x , y ) * 0.05;

      const mixPixel = getColorByHeight(val);
      drawPixel(mixMapData, x, y, width, mixPixel);
    }
  }
  console.log(mixMapData);
  mixMapCtx.putImageData(mixMapData, 0, 0);
};

const generateTexture = (
  noiseCanvas: HTMLCanvasElement | null,
  textureCanvas: HTMLCanvasElement | null
) => {
  if (!noiseCanvas || !textureCanvas) {
    return;
  }

  const noiseCtx = noiseCanvas.getContext("2d");
  const textureCtx = textureCanvas.getContext("2d");
  if (!noiseCtx || !textureCtx) {
    return;
  }

  const textures = [
    getImagePixels(waterTexture),
    getImagePixels(sandTexture),
    getImagePixels(dryGrassTexture),
    getImagePixels(grassTexture),
    getImagePixels(dirtTexture),
    getImagePixels(rocksTexture),
  ];

  const width = noiseCanvas.width;
  const height = noiseCanvas.height;

  const noiseData = noiseCtx.getImageData(0, 0, width, height);
  const textureData = textureCtx.getImageData(0, 0, width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const pixel = getPixel(noiseData, x, y, width);
      let val = pixel.reduce((prev, curr) => prev + curr, 0) / 3 / 255;

      if (val > waterLevel + 0.05) {
        val += Math.random() * 0.05;
        val += simplex.noise2D(x * 0.04, y * 0.04) * 0.05;
      }

      if (val <= waterLevel) val = waterLevel;

      drawPixel(
        textureData,
        x,
        y,
        width,
        getTextureByHeight(val, x, y, textures)
      );
    }
  }

  textureCtx.putImageData(textureData, 0, 0);

  /**
   * @todo blend
   */
};

function App() {
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const textureCanvasRef = useRef<HTMLCanvasElement>(null);
  const specularCanvasRef = useRef<HTMLCanvasElement>(null);
  const mixMapRef = useRef<HTMLCanvasElement>(null);

  const babylonCanvasRef = useRef<HTMLCanvasElement>(null);

  const { gameEngine, gameScene } = useGameEngine(babylonCanvasRef);

  const [ground, setGround] = useState<BABYLON.GroundMesh>();

  getImagePixels(grassTexture);

  const generateTerrain = React.useCallback(() => {
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
        {
          width: 10,
          height: 10,
          subdivisions: 100,
          maxHeight: 1.25,
          minHeight: 0,
        }
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
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={mixMapRef}
      ></canvas>
      <canvas ref={babylonCanvasRef} className="babylonCanvas"></canvas>
      <div className="buttons">
        <button onClick={() => generateNoise(noiseCanvasRef.current)}>
          Generate noise
        </button>
        <button
          onClick={() =>
            generateTexture(noiseCanvasRef.current, textureCanvasRef.current)
          }
        >
          Generate texture
        </button>
        <button
          onClick={() =>
            generateSpecular(specularCanvasRef.current, noiseCanvasRef.current)
          }
        >
          Generate specular
        </button>
        <button onClick={generateTerrain}>Generate terrain</button>
        <button
          onClick={() =>
            generateMixMap(mixMapRef.current, noiseCanvasRef.current)
          }
        >
          Generate mixMap
        </button>
      </div>
    </div>
  );
}

export default App;
