import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";

const createScene = function (
  engine: BABYLON.Engine,
  canvas: HTMLCanvasElement
) {
  const scene = new BABYLON.Scene(engine);

  const camera = new BABYLON.FreeCamera(
    "Camera",
    new BABYLON.Vector3(0, 5, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.keysUpward.push(69); //increase elevation
  camera.keysDownward.push(81); //decrease elevation
  camera.keysUp.push(87); //forwards
  camera.keysDown.push(83); //backwards
  camera.keysLeft.push(65);
  camera.keysRight.push(68);
  camera.inputs.addMouseWheel();
  camera.inertia = 0.8;

  if(camera.inputs._mouseInput) {
    camera.inputs._mouseInput.buttons = [1,2];
  }

  camera.setTarget(BABYLON.Vector3.Zero());
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
