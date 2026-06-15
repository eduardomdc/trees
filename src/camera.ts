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
    maxRadius = 100,
    sensitivity = 0.01,
    zoomSpeed = 0.01,
    target = new THREE.Vector3(0, 0, 0),
  } = options ?? {};

  // Owned mutable copy so callers can't accidentally mutate internals
  const _target = target.clone();

  const state: OrbitalCameraState = {
    theta: 0,
    phi: Math.PI/2,
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
      _target.x + state.radius * Math.sin(state.phi) * Math.sin(state.theta),
      _target.y + state.radius * Math.cos(state.phi),
      _target.z + state.radius * Math.sin(state.phi) * Math.cos(state.theta)
    );
    camera.lookAt(_target);
  }

  /** Replace the orbit target. Accepts a Vector3 or plain x/y/z values. */
  function setTarget(target: THREE.Vector3): void;
  function setTarget(x: number, y: number, z: number): void;
  function setTarget(targetOrX: THREE.Vector3 | number, y?: number, z?: number): void {
    if (targetOrX instanceof THREE.Vector3) {
      _target.copy(targetOrX);
    } else {
      _target.set(targetOrX, y!, z!);
    }
  }

  /** Read-only snapshot of the current target. */
  function getTarget(): THREE.Vector3 {
    return _target.clone();
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

  return { camera, updateCamera, setTarget, getTarget, dispose };
}
