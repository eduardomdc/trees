import * as THREE from 'three';

interface OrbitalCameraState {
  theta: number;
  phi: number;
  radius: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

export function createOrbitalCamera(
  canvas: HTMLCanvasElement,
  options?: {
    initialRadius?: number;
    minRadius?: number;
    maxRadius?: number;
    sensitivity?: number;
    zoomSpeed?: number;
    target?: THREE.Vector3;
  }
) {
  const {
    initialRadius = 5,
    minRadius = 1.5,
    maxRadius = 20,
    sensitivity = 0.01,
    zoomSpeed = 0.01,
    target = new THREE.Vector3(0, 0, 0),
  } = options ?? {};

  const state: OrbitalCameraState = {
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: initialRadius,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  };

  const camera = new THREE.PerspectiveCamera(
    60,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );

  function updateCamera(): void {
    camera.position.set(
      target.x + state.radius * Math.sin(state.phi) * Math.sin(state.theta),
      target.y + state.radius * Math.cos(state.phi),
      target.z + state.radius * Math.sin(state.phi) * Math.cos(state.theta)
    );
    camera.lookAt(target);
  }

  function onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      state.isDragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    }
  }

  function onMouseUp(): void {
    state.isDragging = false;
  }

  function onMouseMove(e: MouseEvent): void {
    if (!state.isDragging) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.theta -= dx * sensitivity;
    state.phi = Math.max(0.1, Math.min(Math.PI - 0.1, state.phi + dy * sensitivity));
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    state.radius = Math.max(minRadius, Math.min(maxRadius, state.radius + e.deltaY * zoomSpeed));
  }

  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function dispose(): void {
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('wheel', onWheel);
  }

  return { camera, updateCamera, dispose };
}
