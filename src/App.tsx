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
      const { textures,  heightScale } = MapProperties[mapType];

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
        ref={mixMapCanvasRef}
      ></canvas>
      <canvas ref={babylonCanvasRef} className="babylonCanvas"></canvas>
      <div className="buttons">
        <select onChange={(ev) => setMapType(ev.target.value as MapType)}>
          {Object.keys(MapEnum).map((t) => (
            <option value={t} key={t}>
              {t}
            </option>
          ))}
        </select>
        <button onClick={() => generateNoise(noiseCanvasRef.current, mapType)}>
          Generate noise
        </button>
        <button
          onClick={() =>
            generateMixMap(
              mixMapCanvasRef.current,
              noiseCanvasRef.current,
              mapType
            )
          }
        >
          Generate mixMap
        </button>
        <button onClick={() => blurMixMap(mixMapCanvasRef.current)}>
          Blur mixMap
        </button>
        <button onClick={generateTerrain}>Generate terrain</button>
      </div>
    </div>
  );
}

export default App;
