import * as THREE from 'three';
import * as T from './penn.ts';
import * as Tex from './texture.ts';
import {QuakingAspen, Acer} from './garden.ts';
import {createOrbitalCamera} from './camera.ts';
// import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as GUI from 'lil-gui'; 

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
function cloneTreeParams(p: T.TreeParams): T.TreeParams {
    return {
        ...p,
        MeshQuality: [...p.MeshQuality],
        LevelParam: p.LevelParam.map(l => ({ ...l })),
        LeavesParam: { ...p.LeavesParam },
        TextureParam: {...p.TextureParam },
    };
}
var tree_params : T.TreeParams = cloneTreeParams(QuakingAspen);
var tree = new T.pennTree(tree_params, seed.Seed);

const basic_mesh_mat : THREE.Material = new THREE.MeshStandardMaterial({map: Tex.BarkTextures[tree_params.TextureParam.BarkTexture]});
var tree_mesh = tree.build_tree_geometry(basic_mesh_mat);
scene.add(tree_mesh);

// leaves
const basic_leaf_mat = new THREE.MeshStandardMaterial({side : THREE.DoubleSide, map: Tex.LeafTextures[tree_params.TextureParam.LeafTexture], transparent: true, alphaTest:0.5});
var tree_leaves = tree.build_leaves(basic_leaf_mat);
scene.add(tree_leaves);

// GUI
const gui = new GUI.GUI();



function applyPreset(preset: T.TreeParams, input: T.TreeParams) {
    preset.Shape = input.Shape;
    preset.Scale = input.Scale;
    preset.ScaleV = input.ScaleV;
    preset.ZScale = input.ZScale;
    preset.ZScaleV = input.ZScaleV;
    preset.Levels = input.Levels;
    preset.Ratio = input.Ratio;
    preset.RatioPower = input.RatioPower;
    preset.Flare = input.Flare;

    preset.Scale0 = input.Scale0;
    preset.ScaleV0 = input.ScaleV0;
    preset.BaseSplits0 = input.BaseSplits0;

    preset.AttractionUp = input.AttractionUp;
    preset.PruneRation = input.PruneRation;
    preset.PruneWidth = input.PruneWidth;
    preset.PruneWidthPeak = input.PruneWidthPeak;
    preset.PrunePowerLow = input.PrunePowerLow;
    preset.PrunePowerHigh = input.PrunePowerHigh;

    preset.MeshQuality.length = input.MeshQuality.length;
    for (let i = 0; i < input.MeshQuality.length; i++) {
        preset.MeshQuality[i] = input.MeshQuality[i];
    }

    preset.LevelParam.length = input.LevelParam.length;

    for (let i = 0; i < input.LevelParam.length; i++) {
        const src = input.LevelParam[i];

        if (!preset.LevelParam[i]) {
            preset.LevelParam[i] = {} as T.LevelParam;
        }

        const dst = preset.LevelParam[i];

        dst.BaseSize = src.BaseSize;
        dst.DownAngle = src.DownAngle;
        dst.DownAngleV = src.DownAngleV;
        dst.Rotate = src.Rotate;
        dst.RotateV = src.RotateV;
        dst.Branches = src.Branches;
        dst.Length = src.Length;
        dst.LengthV = src.LengthV;
        dst.Taper = src.Taper;
        dst.SplitsAmount = src.SplitsAmount;
        dst.SegSplits = src.SegSplits;
        dst.SplitAngle = src.SplitAngle;
        dst.SplitAngleV = src.SplitAngleV;
        dst.SplitRotationV = src.SplitRotationV;
        dst.CurveRes = src.CurveRes;
        dst.Curve = src.Curve;
        dst.CurveBack = src.CurveBack;
        dst.CurveV = src.CurveV;
    }

    preset.LeavesParam.DownAngle = input.LeavesParam.DownAngle;
    preset.LeavesParam.DownAngleV = input.LeavesParam.DownAngleV;
    preset.LeavesParam.Rotate = input.LeavesParam.Rotate;
    preset.LeavesParam.RotateV = input.LeavesParam.RotateV;
    preset.LeavesParam.Amount = input.LeavesParam.Amount;
    preset.LeavesParam.LeafScale = input.LeavesParam.LeafScale;
    preset.LeavesParam.LeafScaleX = input.LeavesParam.LeafScaleX;

    preset.TextureParam.LeafTexture = input.TextureParam.LeafTexture
    preset.TextureParam.BarkTexture = input.TextureParam.BarkTexture
}


// Load controls
const loadControls = {
    Preset : QuakingAspen,
    Download : function downloadAsJSON() {
          const json = JSON.stringify(tree_params, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "my_tree.json";
          a.click();
          URL.revokeObjectURL(url);
    },
    Load : () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = () => {
            try {
              const loaded = JSON.parse(reader.result as string) as T.TreeParams;
              applyPreset(tree_params, loaded)
              update_display_and_rebuild_tree()
            } catch {
              console.error("Invalid JSON file");
            }
          };
          reader.readAsText(file);
        };

        input.click();
  }
}

const load_controls = gui.addFolder('Load');
load_controls.add( loadControls, 'Preset', {QuakingAspen, Acer}).onChange((_ : any) => {
    applyPreset(tree_params, loadControls.Preset)
    update_display_and_rebuild_tree()
})
load_controls.add( loadControls, 'Download').name("Save Tree Configuration")
load_controls.add( loadControls, 'Load').name("Load Tree Configuration")
function update_display_and_rebuild_tree () {
    tree_controls.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    trunk_controls.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    leaves_folder.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    texture_folder.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    levels_folder.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    levels_folder.folders.forEach( (folder) => {
        folder.controllers.forEach( (controller) => {
            controller.updateDisplay();
        })
    })
    rebuild_tree()
}

// Tree controls

const tree_controls = gui.addFolder('Tree');

tree_controls.add(seed, 'Seed', 0, 1000);
tree_controls.add(tree_params, 'Shape', {
    Conical : 0,
    Spherical : 1,
    Hemispherical : 2,
    Cylindrical : 3,
    TaperedCylindrical : 4,
    Flame : 5,
    InverseConical : 6,
    TendFlame : 7,
    Envelope : 8,});
tree_controls.add(tree_params, 'Scale', 0, 100);
tree_controls.add(tree_params, 'ScaleV', 0, 20);
tree_controls.add(tree_params, 'ZScale', 0, 5);
tree_controls.add(tree_params, 'ZScaleV', 0, 5);

tree_controls.add(tree_params, 'Levels', 1, 4, 1);

tree_controls.add(tree_params, 'Ratio', 0, 0.1);
tree_controls.add(tree_params, 'RatioPower', 0, 5);
tree_controls.add(tree_params, 'Flare', 0, 2);

tree_controls.add(tree_params, 'AttractionUp', -5, 5);

const trunk_controls = tree_controls.addFolder('Trunk Options');

trunk_controls.add(tree_params, 'Scale0', 0, 5);
trunk_controls.add(tree_params, 'ScaleV0', 0, 5);
trunk_controls.add(tree_params, 'BaseSplits0', 0, 10);
const trunk_level = tree_params.LevelParam[0];
trunk_controls.add(trunk_level, 'BaseSize', 0, 1);
trunk_controls.add(trunk_level, 'Length', 0, 2);
trunk_controls.add(trunk_level, 'LengthV', 0, 2);
trunk_controls.add(trunk_level, 'Taper', 0, 2);
trunk_controls.add(trunk_level, 'SplitsAmount', 0, 10);
trunk_controls.add(trunk_level, 'SegSplits', 0, 10);
trunk_controls.add(trunk_level, 'SplitAngle', 0, 180);
trunk_controls.add(trunk_level, 'SplitAngleV', 0, 180);
trunk_controls.add(trunk_level, 'SplitRotationV', 0, 360);
trunk_controls.add(trunk_level, 'CurveRes', 1, 30, 1);
trunk_controls.add(trunk_level, 'Curve', -180, 180);
trunk_controls.add(trunk_level, 'CurveBack', -180, 180);
trunk_controls.add(trunk_level, 'CurveV', 0, 180);

const levels_folder = tree_controls.addFolder('Branches');

tree_params.LevelParam.forEach((level, i) => {
    if (i == 0) {return}
    const f = levels_folder.addFolder(`Level ${i}`);
    f.close();

    f.add(level, 'BaseSize', 0, 1);
    f.add(level, 'DownAngle', 0, 180);
    f.add(level, 'DownAngleV', -90, 90);
    f.add(level, 'Rotate', 0, 360);
    f.add(level, 'RotateV', 0, 360);

    f.add(level, 'Branches', 0, 100, 1);

    f.add(level, 'Length', 0, 2);
    f.add(level, 'LengthV', 0, 2);

    f.add(level, 'Taper', 0, 2);

    f.add(level, 'SplitsAmount', 0, 10);
    f.add(level, 'SegSplits', 0, 10, 1);
    f.add(level, 'SplitAngle', 0, 180);
    f.add(level, 'SplitAngleV', 0, 180);
    f.add(level, 'SplitRotationV', 0, 360);

    f.add(level, 'CurveRes', 1, 30, 1);
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
        rebuild_tree()
    }
);

// Texture controls
const texture_folder = tree_controls.addFolder('Textures');
const texture_params = tree_params.TextureParam;
texture_folder.add(texture_params, 'LeafTexture', Object.keys(Tex.LeafTextures));
texture_folder.add(texture_params, 'BarkTexture', Object.keys(Tex.BarkTextures));


function rebuild_tree () {
    tree = new T.pennTree(tree_params, seed.Seed);
    const trunk_mat = new THREE.MeshStandardMaterial({map: Tex.BarkTextures[tree_params.TextureParam.BarkTexture]});
    const leaf_mat = new THREE.MeshStandardMaterial({side : THREE.DoubleSide, map: Tex.LeafTextures[tree_params.TextureParam.LeafTexture], transparent: true, alphaTest:0.5});
    
    scene.remove(tree_mesh);
    tree_mesh.geometry.dispose()
    tree_mesh = tree.build_tree_geometry(trunk_mat)
    scene.add(tree_mesh)
    
    scene.remove(tree_leaves);
    tree_leaves.geometry.dispose();
    tree_leaves = tree.build_leaves(leaf_mat);
    scene.add(tree_leaves);
}

function animate() {
    updateCamera();
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
