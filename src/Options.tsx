import React from "react";
import { Button } from "./Button";
import {
  blurMixMap,
  generateMixMap,
  generateNoise,
  MapEnum,
  MapType,
} from "./generators";

type PropsType = {
  setMapType: (type: MapType) => void;
  noiseCanvasRef: React.RefObject<HTMLCanvasElement>;
  mixMapCanvasRef: React.RefObject<HTMLCanvasElement>;
  mapType: MapType;
  generateTerrain: () => void;
  loadImage: (evt: any) => void;
  clearNoise: () => void;
};

export default function Options({
  setMapType,
  noiseCanvasRef,
  mapType,
  mixMapCanvasRef,
  generateTerrain,
  loadImage,
  clearNoise
}: PropsType) {
  return (
    <div className="buttons">
      <select onChange={(ev) => setMapType(ev.target.value as MapType)}>
        {Object.keys(MapEnum).map((t) => (
          <option value={t} key={t}>
            {t}
          </option>
        ))}
      </select>
      <Button onClick={() => generateNoise(noiseCanvasRef.current, mapType)}>
        Generate noise
      </Button>
      <Button
        onClick={() =>
          generateMixMap(
            mixMapCanvasRef.current,
            noiseCanvasRef.current,
            mapType
          )
        }
      >
        Generate mixMap
      </Button>
      <Button onClick={() => blurMixMap(mixMapCanvasRef.current)}>
        Blur mixMap
      </Button>
      <Button onClick={generateTerrain}>Generate terrain</Button>
      <div className="load-file">
        <label htmlFor="loadFile">Load noise</label>
        <input id="loadFile" type="file" onChange={loadImage} />
      </div>
      <Button onClick={clearNoise}>Clear noise</Button>
    </div>
  );
}
