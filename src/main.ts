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
renderer.shadowMap.enabled = true;

const { camera, updateCamera} = createOrbitalCamera(canvas, {initialRadius: 15, sensitivity: 0.008, target: new THREE.Vector3(0,10,0),});

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2 );
directionalLight.castShadow = true;
directionalLight.position.set(5, 12, 0);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add( directionalLight );
const light = new THREE.AmbientLight( 0xaaaaff, 1); // soft white light
scene.add( light );
//scene.background = new THREE.Color(0x9090ff);

const loader = new THREE.TextureLoader();
const bark_tex = loader.load(import.meta.env.BASE_URL+'/assets/bark.jpg');
const leaf_tex = loader.load(import.meta.env.BASE_URL+'/assets/greenleaf.png');
const ground_tex = loader.load(import.meta.env.BASE_URL+'/assets/ground.jpg');
ground_tex.wrapS = THREE.RepeatWrapping;
ground_tex.wrapT = THREE.RepeatWrapping;
ground_tex.repeat.set(1,1);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(50,50), new THREE.MeshStandardMaterial({map:ground_tex}) );
ground.rotateX(-Math.PI/2);
ground.receiveShadow = true;
scene.add(ground);

// tree
var seed = {Seed : 0};
var tree_params = QuakingAspen;
var tree = new T.pennTree(tree_params, seed.Seed);

const basic_mesh_mat : THREE.Material = new THREE.MeshStandardMaterial({map: bark_tex});
var tree_mesh = tree.build_tree_geometry(basic_mesh_mat);
scene.add(tree_mesh);

// leaves
const basic_leaf_mat = new THREE.MeshStandardMaterial({side : THREE.DoubleSide, map: leaf_tex, transparent: true, alphaTest:0.5});
var tree_leaves = tree.build_leaves(basic_leaf_mat);
scene.add(tree_leaves);

// GUI
const gui = new GUI();

const tree_controls = gui.addFolder('Tree');

tree_controls.add(seed, 'Seed', 0, 1000);
tree_controls.add(tree_params, 'Shape', 0, 10, 1);
tree_controls.add(tree_params, 'BaseSize', 0, 1);
tree_controls.add(tree_params, 'Scale', 0, 100);
tree_controls.add(tree_params, 'ScaleV', 0, 20);
tree_controls.add(tree_params, 'ZScale', 0, 5);
tree_controls.add(tree_params, 'ZScaleV', 0, 5);

tree_controls.add(tree_params, 'Levels', 1, 4, 1);

tree_controls.add(tree_params, 'Ratio', 0, 0.1);
tree_controls.add(tree_params, 'RatioPower', 0, 5);
tree_controls.add(tree_params, 'Lobes', 0, 10, 1);
tree_controls.add(tree_params, 'LobeDepth', 0, 0.5);
tree_controls.add(tree_params, 'Flare', 0, 2);

tree_controls.add(tree_params, 'Scale0', 0, 5);
tree_controls.add(tree_params, 'ScaleV0', 0, 5);
tree_controls.add(tree_params, 'BaseSplits0', 0, 10, 1);

tree_controls.add(tree_params, 'AttractionUp', -5, 5);

const trunk_controls = tree_controls.addFolder('Trunk');

trunk_controls.add(tree_params, 'Scale0', 0, 5);
trunk_controls.add(tree_params, 'ScaleV0', 0, 5);
trunk_controls.add(tree_params, 'BaseSplits0', 0, 10, 1);

const levels_folder = tree_controls.addFolder('Levels');

tree_params.LevelParam.forEach((level, i) => {
  const f = levels_folder.addFolder(`Level ${i}`);
  f.close();

  f.add(level, 'DownAngle', 0, 180);
  f.add(level, 'DownAngleV', -90, 90);
  f.add(level, 'Rotate', 0, 360);
  f.add(level, 'RotateV', 0, 360);

  f.add(level, 'Branches', 0, 100, 1);

  f.add(level, 'Length', 0, 2);
  f.add(level, 'LengthV', 0, 2);

  f.add(level, 'Taper', 0, 2);

  f.add(level, 'SegSplits', 0, 10, 1);
  f.add(level, 'SplitAngle', 0, 180);
  f.add(level, 'SplitAngleV', 0, 180);
  f.add(level, 'SplitRotationV', 0, 360);

  f.add(level, 'CurveRes', 1, 10, 1);
  f.add(level, 'Curve', -180, 180);
  f.add(level, 'CurveBack', -180, 180);
  f.add(level, 'CurveV', 0, 180);
});

const leaves_folder = tree_controls.addFolder('Leaves');
const leaves_param = tree_params.LeavesParam;
leaves_folder.add(leaves_param, 'Amount', 0, 100);
leaves_folder.add(leaves_param, 'DownAngle', 0, 180);
leaves_folder.add(leaves_param, 'DownAngleV', -90, 90);
leaves_folder.add(leaves_param, 'Rotate', 0, 360);
leaves_folder.add(leaves_param, 'RotateV', 0, 360);
leaves_folder.add(leaves_param, 'LeafScale', 0, 2);
leaves_folder.add(leaves_param, 'LeafScaleX', 0, 2);

tree_controls.onChange(
    _ => {
        tree = new T.pennTree(tree_params, seed.Seed);
        
        scene.remove(tree_mesh);
        tree_mesh.geometry.dispose()
        tree_mesh = tree.build_tree_geometry(basic_mesh_mat)
        scene.add(tree_mesh)
        
        scene.remove(tree_leaves);
        tree_leaves.geometry.dispose();
        tree_leaves = tree.build_leaves(basic_leaf_mat);
        scene.add(tree_leaves);
    }
);

function animate() {
    updateCamera();
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
