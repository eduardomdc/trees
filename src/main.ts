import * as THREE from 'three';
import * as T from './penn.ts'
import { QuakingAspen } from './garden.ts';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import GUI from 'lil-gui'; 

const canvas = document.querySelector('#render-canvas');
if (!canvas) {
    throw new Error("Failed to get render canvas");
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );

camera.position.z = 27;
camera.position.y = 8;

// tree
var seed = {Seed : 0};
var tree_params = QuakingAspen;
var tree = new T.pennTree(tree_params, seed.Seed);
var tree_points = tree.get_points();
console.log(tree_points);
const level_colors : THREE.LineBasicMaterialParameters[] = [{color: 0xffffff}, {color: 0x00ff00}, {color: 0x0000ff}, {color: 0xff0000}];
var tree_lines : THREE.Line[] = [];

for (let level = 0; level < 4; level++) {
    const line_material = new THREE.LineBasicMaterial(level_colors[level]);
    const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree_points[level]);
    const tree_line = new THREE.LineSegments(tree_line_geom, line_material);
    tree_lines.push(tree_line);
    scene.add(tree_line);
}

// GUI
const gui = new GUI();
const camera_controls = gui.addFolder('Camera');
camera_controls.add( camera.position, 'z', 0, 40);
camera_controls.add( camera.position, 'y', 0, 40);
camera_controls.add( camera.position, 'x', -20, 20);

const tree_controls = gui.addFolder('Tree');

tree_controls.add(seed, 'Seed', 0, 1000);
tree_controls.add(tree_params, 'Shape', 0, 10, 1);
tree_controls.add(tree_params, 'BaseSize', 0, 2);
tree_controls.add(tree_params, 'Scale', 0, 100);
tree_controls.add(tree_params, 'ScaleV', 0, 20);
tree_controls.add(tree_params, 'ZScale', 0, 5);
tree_controls.add(tree_params, 'ZScaleV', 0, 5);

tree_controls.add(tree_params, 'Levels', 0, 4, 1);

tree_controls.add(tree_params, 'Ratio', 0, 0.1);
tree_controls.add(tree_params, 'RatioPower', 0, 5);
tree_controls.add(tree_params, 'Lobes', 0, 10, 1);
tree_controls.add(tree_params, 'LobeDepth', 0, 0.5);
tree_controls.add(tree_params, 'Flare', 0, 2);

tree_controls.add(tree_params, 'Scale0', 0, 5);
tree_controls.add(tree_params, 'ScaleV0', 0, 5);
tree_controls.add(tree_params, 'BaseSplits0', 0, 10, 1);

const trunk_controls = tree_controls.addFolder('Trunk');

trunk_controls.add(tree_params, 'Scale0', 0, 5);
trunk_controls.add(tree_params, 'ScaleV0', 0, 5);
trunk_controls.add(tree_params, 'BaseSplits0', 0, 10, 1);

const levels_folder = tree_controls.addFolder('Levels');

tree_params.LevelParam.forEach((level, i) => {
  const f = levels_folder.addFolder(`Level ${i}`);

  f.add(level, 'DownAngle', -180, 180);
  f.add(level, 'DownAngleV', -180, 180);
  f.add(level, 'Rotate', 0, 360);
  f.add(level, 'RotateV', 0, 360);

  f.add(level, 'Branches', 0, 100, 1);

  f.add(level, 'Length', 0, 2);
  f.add(level, 'LengthV', 0, 2);

  f.add(level, 'Taper', 0, 2);

  f.add(level, 'SegSplits', 0, 10, 1);
  f.add(level, 'SplitAngle', 0, 180);
  f.add(level, 'SplitAngleV', 0, 180);

  f.add(level, 'CurveRes', 1, 10, 1);
  f.add(level, 'Curve', -180, 180);
  f.add(level, 'CurveBack', -180, 180);
  f.add(level, 'CurveV', 0, 180);
});


tree_controls.onChange(
    _ => {
        for (let level = 0; level < 4; level++) {
            const line = tree_lines[level]
            scene.remove(line);
        }
        tree = new T.pennTree(tree_params, seed.Seed);
        tree_points = tree.get_points();
        tree_lines = [];

        for (let level = 0; level < 4; level++) {
            const line_material = new THREE.LineBasicMaterial(level_colors[level]);
            const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree_points[level]);
            const tree_line = new THREE.LineSegments(tree_line_geom, line_material);
            tree_lines.push(tree_line);
            scene.add(tree_line);
        }
    }
);

function animate() {
    renderer.render( scene, camera );
    for (const line of tree_lines) {
        line.rotation.y += 0.01;
    }
}
renderer.setAnimationLoop( animate );
