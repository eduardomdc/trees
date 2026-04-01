import * as THREE from 'three';
import * as T from './penn.ts'
import {QuakingAspen} from './garden.ts';
import {createOrbitalCamera} from './camera.ts';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import GUI from 'lil-gui'; 

export const canvas = document.querySelector('#render-canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error("Failed to get render canvas");
}
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );

const { camera, updateCamera, dispose } = createOrbitalCamera(canvas, {initialRadius: 15, sensitivity: 0.008, target: new THREE.Vector3(0,10,0),});

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );
const light = new THREE.AmbientLight( 0xaaaaff); // soft white light
scene.add( light );
//scene.background = new THREE.Color(0x9090ff);

const loader = new THREE.TextureLoader();
// tree
var seed = {Seed : 0};
var tree_params = QuakingAspen;
var tree = new T.pennTree(tree_params, seed.Seed);

const bark_tex = loader.load(import.meta.env.BASE_URL+'/assets/bark.jpg');
const basic_mesh_mat : THREE.Material = new THREE.MeshStandardMaterial({map: bark_tex});
var tree_mesh = tree.build_tree_geometry(basic_mesh_mat);
scene.add(tree_mesh);

// leaves
const leaf_tex = loader.load(import.meta.env.BASE_URL+'/assets/leaf.png');
const basic_leaf_mat = new THREE.MeshPhongMaterial({side : THREE.DoubleSide, map: leaf_tex, transparent: true, alphaTest:0.75});
var tree_leaves = tree.build_leaves(basic_leaf_mat);
scene.add(tree_leaves);

const ambient = new THREE.AmbientLight(0x2a4a3a, 0.4);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff4cc, 1.2);
sun.position.set(30, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 200;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.bias = -0.001;
scene.add(sun);

const skyFill = new THREE.DirectionalLight(0x8ab4d4, 0.3);
skyFill.position.set(-20, 40, -10);
scene.add(skyFill);

// scene.fog = new THREE.Fog(0x4a6741, 30, 120);

// GUI
const gui = new GUI();
const camera_controls = gui.addFolder('Camera');
camera_controls.add( camera.position, 'z', 0, 40);
camera_controls.add( camera.position, 'y', 0, 40);
camera_controls.add( camera.position, 'x', -20, 20);

const tree_controls = gui.addFolder('Tree');

tree_controls.add(seed, 'Seed', 0, 1000);
tree_controls.add(tree_params, 'Shape', 0, 10, 1);
tree_controls.add(tree_params, 'BaseSize', 0, 1);
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

tree_controls.add(tree_params, 'AttractionUp', -5, 5);

tree_controls.add(tree_params, 'Leaves', 0, 100);
tree_controls.add(tree_params, 'LeafScale', 0, 1);
tree_controls.add(tree_params, 'LeafScaleX', 0, 6); 

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
        //for (let level = 0; level < 4; level++) {
        //    const line = tree_lines[level]
        //    scene.remove(line);
        //}
        //tree_points = tree.get_points();
        
        tree = new T.pennTree(tree_params, seed.Seed);
        
        scene.remove(tree_mesh);
        tree_mesh.geometry.dispose()
        tree_mesh = tree.build_tree_geometry(basic_mesh_mat)
        scene.add(tree_mesh)
        
        scene.remove(tree_leaves);
        tree_leaves.geometry.dispose();
        tree_leaves = tree.build_leaves(basic_leaf_mat);
        scene.add(tree_leaves);
        
        //tree_lines = [];
        //for (let level = 0; level < 4; level++) {
        //    const line_material = new THREE.LineBasicMaterial(level_colors[level]);
        //    const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree_points[level]);
        //    const tree_line = new THREE.LineSegments(tree_line_geom, line_material);
        //    tree_lines.push(tree_line);
        //    scene.add(tree_line);
        //}
        
    }
);

function animate() {
    updateCamera();
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
