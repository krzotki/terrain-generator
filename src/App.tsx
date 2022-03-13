import React, { useCallback, useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import SimplexNoise from "simplex-noise";
import { useGameEngine } from "./useGameEngine";
import * as BABYLON from "babylonjs";
import * as Textures from "babylonjs-procedural-textures";
import {
  getImagePixels,
  getTextureByHeight,
  textureSize,
  waterLevel,
} from "./utils";

const resolution = {
  x: 1024,
  y: 1024,
};

const sampling = 1;
const noiseSize = 0.003;

const terrainHeight = 0.5;

const grassTexture = new Image(textureSize, textureSize);
grassTexture.src = "/grass.jpg";

const waterTexture = new Image(textureSize, textureSize);
waterTexture.src = "/water.jpg";

const rocksTexture = new Image(textureSize, textureSize);
rocksTexture.src = "/rocks.jpg";

const dirtTexture = new Image(textureSize, textureSize);
dirtTexture.src = "/dirt.jpg";

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
    getImagePixels(dirtTexture),
    getImagePixels(rocksTexture),
  ];

  const simplex = new SimplexNoise();

  const width = noiseCanvas.width;
  const height = noiseCanvas.height;

  const iterX = width / sampling;
  const iterY = height / sampling;

  for (let x = 0; x < iterX; x++) {
    for (let y = 0; y < iterY; y++) {
      let value = simplex.noise2D(x * noiseSize, y * noiseSize);
      value = Math.sin(value * terrainHeight);
      if (value < waterLevel) value = waterLevel;
      const color = value * 255 + 127;

      noiseCtx.fillStyle = `rgb(${color}, ${color}, ${color})`;
      noiseCtx.fillRect(x * sampling, y * sampling, sampling, sampling);

      let valueForTexture = value;
      if (value > waterLevel) {
        const randAmount = 0.1;
        valueForTexture += -randAmount / 2 + Math.random() * randAmount;
        if (valueForTexture < waterLevel) valueForTexture = waterLevel;
      }

      textureCtx.fillStyle = getTextureByHeight(
        valueForTexture,
        x * sampling,
        y * sampling,
        textures
      );
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
      <canvas ref={babylonCanvasRef} className="babylonCanvas"></canvas>
      <button onClick={generate}>Generate terrain</button>
    </div>
  );
}

export default App;
