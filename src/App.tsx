import React, { useRef, useState } from "react";
import "./App.css";
import { useGameEngine } from "./useGameEngine";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { MixMaterial } from "@babylonjs/materials";
import {
  blurMixMap,
  generateMixMap,
  generateNoise,
  MapEnum,
  MapProperties,
  MapType,
} from "./generators";
import Options from "./Options";

const resolution = {
  x: 1024,
  y: 1024,
};

function App() {
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const mixMapCanvasRef = useRef<HTMLCanvasElement>(null);

  const babylonCanvasRef = useRef<HTMLCanvasElement>(null);

  const { gameEngine, gameScene } = useGameEngine(babylonCanvasRef);

  const [mapType, setMapType] = useState<MapType>("GREEN_HILLS");

  const [ground, setGround] = useState<BABYLON.GroundMesh>();

  const generateTerrain = React.useCallback(() => {
    if (noiseCanvasRef.current && mixMapCanvasRef.current && gameScene) {
      const heightUrl = noiseCanvasRef.current.toDataURL("image/png");
      const mixMapUrl = mixMapCanvasRef.current.toDataURL("image/png");

      if (ground) {
        ground.dispose();
      }
      const { textures, heightScale } = MapProperties[mapType];

      const newGround = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
        "gdhm",
        heightUrl,
        {
          width: 50,
          height: 50,
          subdivisions: 100,
          maxHeight: 2 * (heightScale || 1),
          minHeight: 0,
        }
      );

      console.log("GENERATE TERRAIN FOR ", mapType);

      const terrainMaterial = new MixMaterial("terrainMaterial", gameScene);
      terrainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      terrainMaterial.specularPower = 64;
      terrainMaterial.mixTexture1 = new BABYLON.Texture(mixMapUrl, gameScene);

      terrainMaterial.diffuseTexture1 = new BABYLON.Texture(
        `textures/${textures[0].name}.jpg`,
        gameScene
      );
      terrainMaterial.diffuseTexture2 = new BABYLON.Texture(
        `textures/${textures[1].name}.jpg`,
        gameScene
      );
      terrainMaterial.diffuseTexture3 = new BABYLON.Texture(
        `textures/${textures[2].name}.jpg`,
        gameScene
      );
      terrainMaterial.diffuseTexture4 = new BABYLON.Texture(
        `textures/${textures[3].name}.jpg`,
        gameScene
      );

      terrainMaterial.diffuseTexture1.uScale =
        terrainMaterial.diffuseTexture1.vScale = textures[0].uv || 50;

      terrainMaterial.diffuseTexture2.uScale =
        terrainMaterial.diffuseTexture2.vScale = textures[1].uv || 50;

      terrainMaterial.diffuseTexture3.uScale =
        terrainMaterial.diffuseTexture3.vScale = textures[2].uv || 50;

      terrainMaterial.diffuseTexture4.uScale =
        terrainMaterial.diffuseTexture4.vScale = textures[3].uv || 50;

      newGround.material = terrainMaterial;
      setGround(newGround);
    }
  }, [noiseCanvasRef, mixMapCanvasRef, gameScene, ground, mapType]);

  const loadImage = React.useCallback((evt: any) => {
    if (!evt || !evt.target) return;
    const image = new Image();
    image.onload = () => {
      const ctx = noiseCanvasRef.current?.getContext("2d");
      ctx?.drawImage(image, 0, 0);
    };
    image.src = URL.createObjectURL(evt.target.files[0]);
  }, [noiseCanvasRef])

  const [noiseLevel, setNoiseLevel] = React.useState<number>(0.5);
  const [brushSize, setBrushSize] = React.useState<number>(10);
  const [brushHidden, setBrushHidden] = React.useState(true);
  const [drawing, setDrawing] = React.useState(false);

  const brushRef = React.useRef<HTMLDivElement>(null);

 
  React.useEffect(() => {
    const color = 255 * noiseLevel;
    const rgb = `rgb(${color}, ${color}, ${color})`;

    if(!brushRef.current) return;
    brushRef.current.style.backgroundColor = rgb;
    brushRef.current.style.width = `${brushSize}px`;
    brushRef.current.style.height = `${brushSize}px`;
  }, [noiseLevel, brushSize])

  const moveBrush = React.useCallback((evt: any) => {
    if (!brushRef.current) return;
    brushRef.current.style.left = `${evt.clientX}px`;
    brushRef.current.style.top = `${evt.clientY}px`;

    if (drawing) {
      const ctx = noiseCanvasRef.current?.getContext("2d");
      const rect = noiseCanvasRef.current?.getBoundingClientRect();
      if (!ctx || !rect) return;

      const x = evt.clientX;
      const y = evt.clientY;

      const ratioX = x / rect.width;
      const ratioY = y / rect.height;

      const cx = ratioX * resolution.x;
      const cy = ratioY * resolution.y;

      const scale = rect.width / resolution.x;

      const color = 255 * noiseLevel;
      const rgb = `rgb(${color}, ${color}, ${color})`;

      ctx.beginPath();
      ctx.arc(cx, cy, brushSize / scale / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = rgb;
      ctx.fill();
    }
  }, [brushRef, drawing, noiseLevel, brushSize])

  const clearNoise = React.useCallback(() => {
    const canvas = noiseCanvasRef.current;
    if(!canvas) return;
    const {width, height} = canvas;
    canvas.getContext('2d')?.clearRect(0, 0, width, height);
  }, [noiseCanvasRef])

  return (
    <div className="App">
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={noiseCanvasRef}
        onMouseEnter={() => setBrushHidden(false)}
        onMouseLeave={() => {
          setBrushHidden(true);
          setDrawing(false);
        }}
        onMouseMove={(evt) => moveBrush(evt)}
        onMouseDown={(evt) => {
          if(evt.button === 0) setDrawing(true)
        }}
        onMouseUp={() => setDrawing(false)}
      ></canvas>
      <canvas
        width={resolution.x}
        height={resolution.y}
        ref={mixMapCanvasRef}
      ></canvas>
      <div className="drawer">
        <div
          ref={brushRef}
          className={`brush ${brushHidden ? "hidden" : ""}`}
        ></div>
        <p>Draw noise</p>
        <div className="d-flex w-100 align-items-center justify-content-center">
          <label className="m-3 w-50" htmlFor="noiseLevel">
            Noise level: <strong>{noiseLevel}</strong>
          </label>
          <input
            id="noiseLevel"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={noiseLevel}
            onChange={(evt) => setNoiseLevel(Number(evt.target.value))}
          />
        </div>
        <div className="d-flex w-100 align-items-center justify-content-center">
          <label className="m-3 w-50" htmlFor="brushSize">
            Brush size: <strong>{brushSize}</strong>
          </label>
          <input
            id="brushSize"
            type="range"
            min={1}
            max={50}
            step={1}
            value={brushSize}
            onChange={(evt) => setBrushSize(Number(evt.target.value))}
          />
        </div>
      </div>
      <canvas ref={babylonCanvasRef} className="babylonCanvas"></canvas>
      <Options
        generateTerrain={generateTerrain}
        loadImage={loadImage}
        mapType={mapType}
        mixMapCanvasRef={mixMapCanvasRef}
        noiseCanvasRef={noiseCanvasRef}
        setMapType={setMapType}
        clearNoise={clearNoise}
      />
    </div>
  );
}

export default App;
