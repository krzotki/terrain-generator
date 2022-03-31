import React from "react";
import * as BABYLON from "babylonjs";

const createScene = function (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
) {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.ArcRotateCamera(
    "Camera",
    -Math.PI / 2,
    Math.PI / 4,
    10,
    BABYLON.Vector3.Zero(),
    scene
  );

  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  return {
    scene,
    camera,
  };
};

export const useGameEngine = (
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const [gameEngine, setGameEngine] = React.useState<BABYLON.Engine>();

  const [gameScene, setGameScene] = React.useState<BABYLON.Scene>();

  const [camera, setCamera] = React.useState<BABYLON.Camera>();

  React.useEffect(() => {
    if (canvasRef.current === null) {
      return;
    }

    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    setGameEngine(engine);

    const { scene, camera } = createScene(engine, canvas);
    setGameScene(scene);
    setCamera(camera);

    engine.runRenderLoop(function () {
      scene.render();
    });

    window.addEventListener("resize", function () {
      console.log("RESIZE");
      engine.resize();
    });

  }, [canvasRef]);

  return { gameEngine, gameScene, camera };
};
