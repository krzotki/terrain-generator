import { FillMode } from "./useDrawingOnTerrain";

type PropsType = {
  brushRef: React.RefObject<HTMLDivElement>;
  brushHidden: boolean;
  noiseLevel: number;
  setNoiseLevel: (level: number) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  fillMode: FillMode;
  setFillMode: (fillMode: FillMode) => void;
  slope: number;
  setSlope: (slope: number) => void;
};

export const DrawOptions = ({
  brushRef,
  brushHidden,
  noiseLevel,
  setNoiseLevel,
  brushSize,
  setBrushSize,
  fillMode,
  setFillMode,
  slope,
  setSlope,
}: PropsType) => {
  return (
    <div className="drawer">
      <div
        ref={brushRef}
        className={`brush ${brushHidden ? "hidden" : ""}`}
      ></div>
      <p>Draw noise</p>
      <div className="d-flex w-100 align-items-center justify-content-center">
        Fill mode:
        <select
          value={fillMode}
          onChange={(evt) => setFillMode(evt.target.value as FillMode)}
        >
          <option value="flat">Flat</option>
          <option value="add">Add</option>
        </select>
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

      {fillMode === "flat" && (
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
      )}

      {fillMode === "add" && (
        <div className="d-flex w-100 align-items-center justify-content-center">
          <label className="m-3 w-50" htmlFor="slope">
            Slope: <strong>{slope}</strong>
          </label>
          <input
            id="slope"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={slope}
            onChange={(evt) => setSlope(Number(evt.target.value))}
          />
        </div>
      )}
    </div>
  );
};
