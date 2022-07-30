import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { getImageBinary } from "./utils";
import { generateMixMap, MapProperties, MapType } from "./generators";
import { MAP_SIZE, RESOLUTION, SUBDIVISIONS } from "./App";
import { MixMaterial } from "@babylonjs/materials";

type PropsType = {
  gameScene: BABYLON.Scene | null | undefined;
  noiseCanvasRef: React.RefObject<HTMLCanvasElement>;
  mixMapCanvasRef: React.RefObject<HTMLCanvasElement>;
  ground: BABYLON.GroundMesh | undefined;
  mapType: MapType;
};

export const useDrawingOnTerrain = ({
  gameScene,
  noiseCanvasRef,
  mixMapCanvasRef,
  ground,
  mapType,
}: PropsType) => {
  const [noiseLevel, setNoiseLevel] = React.useState<number>(0.5);
  const [brushSize, setBrushSize] = React.useState<number>(10);
  const [brushHidden, setBrushHidden] = React.useState(true);
  const [drawing, setDrawing] = React.useState(false);

  const brushRef = React.useRef<HTMLDivElement>(null);

  const updateTerrain = React.useCallback(
    (binary: Uint8Array) => {
      if (!ground) return;

      const bufferWidth = RESOLUTION.x;
      const bufferHeight = RESOLUTION.y;

      const { heightScale } = MapProperties[mapType];

      const filter = new BABYLON.Color3(0.3, 0.59, 0.11);

      const vertexData = BABYLON.CreateGroundFromHeightMapVertexData({
        width: MAP_SIZE,
        height: MAP_SIZE,
        subdivisions: SUBDIVISIONS,
        maxHeight: 2 * (heightScale || 1),
        minHeight: 0,
        colorFilter: filter,
        buffer: binary,
        bufferWidth: bufferWidth,
        bufferHeight: bufferHeight,
        alphaFilter: 0.0,
      });

      vertexData.applyToMesh(ground, true);

      ground._setReady(true);
    },
    [ground, mapType]
  );

  React.useEffect(() => {
    const color = 255 * noiseLevel;
    const rgb = `rgb(${color}, ${color}, ${color})`;

    if (!brushRef.current) return;
    brushRef.current.style.backgroundColor = rgb;
    brushRef.current.style.width = `${brushSize}px`;
    brushRef.current.style.height = `${brushSize}px`;
  }, [noiseLevel, brushSize]);

  const drawOnTerrain = React.useCallback(
    (x: number, y: number) => {
      const ctx = noiseCanvasRef.current?.getContext("2d");
      const color = 255 * noiseLevel;
      const rgb = `rgb(${color}, ${color}, ${color})`;

      if (!ctx) {
        return;
      }

      const rect = noiseCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const ratioX = x / rect.width;
      const ratioY = y / rect.height;

      const cx = ratioX * RESOLUTION.x;
      const cy = ratioY * RESOLUTION.y;

      const scale = rect.width / RESOLUTION.x;

      ctx.beginPath();
      ctx.arc(cx, cy, brushSize / scale / 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = rgb;
      ctx.fill();
    },
    [noiseCanvasRef, noiseLevel, brushSize]
  );

  React.useEffect(() => {
    if (gameScene) {
      let hasBeenDrawing = false;
      let drawing = false;
      const observer = gameScene.onPointerObservable.add((evt) => {
        if (
          evt.type === BABYLON.PointerEventTypes.POINTERDOWN &&
          evt.event.button === 0
        ) {
          drawing = true;
        }

        if (evt.type === BABYLON.PointerEventTypes.POINTERUP) {
          drawing = false;
          if (
            hasBeenDrawing &&
            noiseCanvasRef.current &&
            mixMapCanvasRef.current
          ) {
            const binary = getImageBinary(noiseCanvasRef.current, RESOLUTION);
            if (!binary) {
              return;
            }

            generateMixMap(
              mixMapCanvasRef.current,
              noiseCanvasRef.current,
              mapType
            );

            const currentMaterial = gameScene.getMaterialByName(
              "terrainMaterial"
            ) as MixMaterial;
            if (currentMaterial) {
              // const mixMapUrl = mixMapCanvasRef.current.toDataURL("image/png");
              currentMaterial.mixTexture1.dispose();
              const rawTexture = BABYLON.RawTexture.CreateRGBATexture(
                getImageBinary(mixMapCanvasRef.current, RESOLUTION),
                RESOLUTION.x,
                RESOLUTION.y,
                gameScene,
                undefined,
                true
              );
              currentMaterial.mixTexture1 = rawTexture;
            }

            updateTerrain(binary);
          }

          hasBeenDrawing = false;
        }

        if (
          evt.type === BABYLON.PointerEventTypes.POINTERMOVE &&
          drawing &&
          noiseCanvasRef.current
        ) {
          hasBeenDrawing = true;
          const position = evt.pickInfo?.pickedPoint;

          if (!position) {
            return;
          }

          let { x, y } = new BABYLON.Vector2(
            position.x / MAP_SIZE + 0.5,
            -position.z / MAP_SIZE + 0.5
          );

          const rect = noiseCanvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          drawOnTerrain(x * rect.width, y * rect.height);
          const binary = getImageBinary(noiseCanvasRef.current, RESOLUTION);
          if (!binary) {
            return;
          }

          updateTerrain(binary);
        }
      });

      return () => {
        gameScene.onPointerObservable.remove(observer);
      };
    }
  }, [
    mapType,
    gameScene,
    noiseCanvasRef,
    drawOnTerrain,
    brushSize,
    updateTerrain,
    mixMapCanvasRef,
  ]);

  const moveBrush = React.useCallback(
    (evt: any) => {
      if (!brushRef.current) return;
      brushRef.current.style.left = `${evt.clientX}px`;
      brushRef.current.style.top = `${evt.clientY}px`;

      if (drawing) {
        const x = evt.clientX;
        const y = evt.clientY;

        drawOnTerrain(x, y);
      }
    },
    [brushRef, drawing, drawOnTerrain]
  );

  return {
    moveBrush,
    noiseLevel,
    setNoiseLevel,
    brushSize,
    setBrushSize,
    brushHidden,
    setBrushHidden,
    drawing,
    setDrawing,
    brushRef,
  };
};
