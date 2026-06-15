import * as THREE from 'three';
import * as T from './penn.ts';
import * as Tex from './texture.ts';
import {presets} from './garden.ts';
import {createOrbitalCamera} from './camera.ts';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as GUI from 'lil-gui'; 

export const canvas = document.querySelector('#render-canvas') as HTMLCanvasElement;
if (!canvas) {
    throw new Error("Failed to get render canvas");
}
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const { camera, updateCamera, setTarget} = createOrbitalCamera(canvas, {initialRadius: 15, sensitivity: 0.008, target: new THREE.Vector3(0,10,0),});

const directionalLight = new THREE.DirectionalLight( 0xffffff, 5 );
directionalLight.castShadow = true;
directionalLight.position.set(5, 5, 3);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.001;
directionalLight.shadow.normalBias = 0.05;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add( directionalLight );
//const light = new THREE.AmbientLight( 0xcad8db, 1.2); // soft white light
//scene.add( light );

const loader = new THREE.TextureLoader();

const jungle_tex = loader.load(import.meta.env.BASE_URL+'/assets/sky.jpg');
jungle_tex.mapping = THREE.EquirectangularReflectionMapping
scene.background = jungle_tex;
scene.environment = jungle_tex;
scene.environmentIntensity = 0.4;

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
        SpaceColonyParam: {...p.SpaceColonyParam },
        RootParams: {...p.RootParams },
    };
}
var tree_params : T.TreeParams = cloneTreeParams(presets["Quaking Aspen"]);
var tree = new T.Tree(tree_params, seed.Seed);

const trunk_mat = new THREE.MeshStandardMaterial({
    map: Tex.BarkTextures[tree_params.TextureParam.BarkTexture]
});

const leaf_mat = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    map: Tex.LeafTextures[tree_params.TextureParam.LeafTexture],
    transparent: true,
    alphaTest: 0.5
});

var tree_mesh = new THREE.Mesh();
var roots_mesh = new THREE.Mesh();
var tree_leaves = new THREE.Mesh();

const attractors_mat = new THREE.PointsMaterial({color: 0xff0000, size:0.2});
const root_attractors_mat = new THREE.PointsMaterial({color: 0x00ff00, size:0.2});

var attractors_cloud = new THREE.Points();
var root_attractors_cloud = new THREE.Points();

// GUI
const gui = new GUI.GUI();

function applyPreset(preset: T.TreeParams, input: T.TreeParams) {
    preset.SpaceColony = input.SpaceColony;
    preset.GenerateRoots = input.GenerateRoots;
    preset.Shape = input.Shape;
    preset.Scale = input.Scale;
    preset.ScaleV = input.ScaleV;
    preset.Levels = input.Levels;
    preset.RatioPower = input.RatioPower;

    preset.Scale0 = input.Scale0;
    preset.ScaleV0 = input.ScaleV0;

    preset.AttractionUp = input.AttractionUp;
    preset.TrunkAttractionUp = input.TrunkAttractionUp;

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
        dst.CurveRes = src.CurveRes;
        dst.Curve = src.Curve;
        dst.CurveV = src.CurveV;
        dst.Gnarly = src.Gnarly;
    }

    preset.LeavesParam.DownAngle = input.LeavesParam.DownAngle;
    preset.LeavesParam.DownAngleV = input.LeavesParam.DownAngleV;
    preset.LeavesParam.Rotate = input.LeavesParam.Rotate;
    preset.LeavesParam.RotateV = input.LeavesParam.RotateV;
    preset.LeavesParam.Amount = input.LeavesParam.Amount;
    preset.LeavesParam.LeafScale = input.LeavesParam.LeafScale;
    preset.LeavesParam.LeafScaleX = input.LeavesParam.LeafScaleX;

    preset.SpaceColonyParam.max_iterations = input.SpaceColonyParam.max_iterations;
    preset.SpaceColonyParam.relative_branch_length = input.SpaceColonyParam.relative_branch_length;
    preset.SpaceColonyParam.attraction_range = input.SpaceColonyParam.attraction_range;
    preset.SpaceColonyParam.kill_range_relative = input.SpaceColonyParam.kill_range_relative;
    preset.SpaceColonyParam.branch_randomness = input.SpaceColonyParam.branch_randomness;
    preset.SpaceColonyParam.inverse_growth_factor = input.SpaceColonyParam.inverse_growth_factor;
    preset.SpaceColonyParam.branch_thickness = input.SpaceColonyParam.branch_thickness;
    preset.SpaceColonyParam.attractors = input.SpaceColonyParam.attractors;
    preset.SpaceColonyParam.attractors_radius = input.SpaceColonyParam.attractors_radius;
    preset.SpaceColonyParam.attractors_height = input.SpaceColonyParam.attractors_height;
    preset.SpaceColonyParam.attractors_tall = input.SpaceColonyParam.attractors_tall;
    preset.SpaceColonyParam.attractors_shape_mod = input.SpaceColonyParam.attractors_shape_mod;
    preset.SpaceColonyParam.attractors_noise = input.SpaceColonyParam.attractors_noise;
    preset.SpaceColonyParam.attraction_up = input.SpaceColonyParam.attraction_up;
    preset.SpaceColonyParam.attraction_decay = input.SpaceColonyParam.attraction_decay;
    preset.SpaceColonyParam.see_attraction_cloud = input.SpaceColonyParam.see_attraction_cloud;
    preset.SpaceColonyParam.leaf_start = input.SpaceColonyParam.leaf_start;
    preset.SpaceColonyParam.leaves_per_branch = input.SpaceColonyParam.leaves_per_branch;
    preset.SpaceColonyParam.is_root = input.SpaceColonyParam.is_root;

    preset.RootParams.max_iterations = input.RootParams.max_iterations;
    preset.RootParams.relative_branch_length = input.RootParams.relative_branch_length;
    preset.RootParams.attraction_range = input.RootParams.attraction_range;
    preset.RootParams.kill_range_relative = input.RootParams.kill_range_relative;
    preset.RootParams.branch_randomness = input.RootParams.branch_randomness;
    preset.RootParams.inverse_growth_factor = input.RootParams.inverse_growth_factor;
    preset.RootParams.branch_thickness = input.RootParams.branch_thickness;
    preset.RootParams.attractors = input.RootParams.attractors;
    preset.RootParams.attractors_radius = input.RootParams.attractors_radius;
    preset.RootParams.attractors_height = input.RootParams.attractors_height;
    preset.RootParams.attractors_tall = input.RootParams.attractors_tall;
    preset.RootParams.attractors_shape_mod = input.RootParams.attractors_shape_mod;
    preset.RootParams.attractors_noise = input.RootParams.attractors_noise;
    preset.RootParams.attraction_up = input.RootParams.attraction_up;
    preset.RootParams.attraction_decay = input.RootParams.attraction_decay;
    preset.RootParams.see_attraction_cloud = input.RootParams.see_attraction_cloud;
    preset.RootParams.leaf_start = input.RootParams.leaf_start;
    preset.RootParams.leaves_per_branch = input.RootParams.leaves_per_branch;
    preset.RootParams.is_root = input.RootParams.is_root;
    preset.RootParams.root_start = input.RootParams.root_start;

    preset.TextureParam.LeafTexture = input.TextureParam.LeafTexture
    preset.TextureParam.BarkTexture = input.TextureParam.BarkTexture
    preset.TextureParam.LeafHue = input.TextureParam.LeafHue
    preset.TextureParam.BarkHue = input.TextureParam.BarkHue
    preset.TextureParam.BarkBrightness = input.TextureParam.BarkBrightness
    preset.TextureParam.LeafBrightness = input.TextureParam.LeafBrightness
}

// Load controls
const loadControls = {
    Preset : "Quaking Aspen",
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
    },
    DownloadModel : function download() {
        const asset_scene = new THREE.Scene()
        asset_scene.add(tree_mesh.clone())
        asset_scene.add(tree_leaves.clone())
        downloadGLTF(asset_scene, "my_tree.glb")
    }
}
function downloadGLTF(scene: THREE.Scene, filename = "scene.gltf") {
    const exporter = new GLTFExporter();

    exporter.parse(
        scene,
        (result) => {
            let output: Blob;

            if (result instanceof ArrayBuffer) {
                // .glb binary format
                output = new Blob([result], {
                    type: "application/octet-stream",
                });
            } else {
                // .gltf text format
                const json = JSON.stringify(result, null, 2);

                output = new Blob([json], {
                    type: "text/plain",
                });
            }

            const url = URL.createObjectURL(output);

            const link = document.createElement("a");
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        },
        (error) => {
            console.error("GLTF export error:", error);
        },
        {
            binary: filename.endsWith(".glb"), // export GLB if filename ends with .glb
        }
    );
}
const load_controls = gui.addFolder('Load');
load_controls.add( loadControls, 'Preset', Object.keys(presets)).onChange((_ : any) => {
    applyPreset(tree_params, presets[loadControls.Preset])
    update_display_and_rebuild_tree()
})
load_controls.add( loadControls, 'Download').name("Save Tree Configuration")
load_controls.add( loadControls, 'Load').name("Load Tree Configuration")
load_controls.add( loadControls, 'DownloadModel').name("Download Tree Model")
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
    sc_folder.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    root_folder.controllers.forEach( (value : GUI.Controller) => {
        value.updateDisplay(); 
    })
    
    rebuild_tree()
}

// Tree controls

const tree_controls = gui.addFolder('Tree');

tree_controls.add(seed, 'Seed', 0, 10000);
tree_controls.add(tree_params, 'SpaceColony').name("Use Space Colonization");

const parametric_controls = tree_controls.addFolder('Parametric Controls');

parametric_controls.add(tree_params, 'Shape', {
    Conical : 0,
    Spherical : 1,
    Hemispherical : 2,
    Cylindrical : 3,
    TaperedCylindrical : 4,
    Flame : 5,
    InverseConical : 6,
    TendFlame : 7,});
parametric_controls.add(tree_params, 'Scale', 0, 100);
parametric_controls.add(tree_params, 'ScaleV', 0, 20);

parametric_controls.add(tree_params, 'Levels', 1, 4, 1);

parametric_controls.add(tree_params, 'RatioPower', 0, 5).name("Ratio Power");

parametric_controls.add(tree_params, 'AttractionUp', -10, 10).name("Attraction Up");

const trunk_controls = tree_controls.addFolder('Trunk Options');

trunk_controls.add(tree_params, 'Scale0', 0, 1).name("Radius");
trunk_controls.add(tree_params, 'ScaleV0', 0, 1).name("RadiusV");
const trunk_level = tree_params.LevelParam[0];
trunk_controls.add(trunk_level, 'BaseSize', 0, 1).name("Base Size");
trunk_controls.add(trunk_level, 'Length', 0, 2);
trunk_controls.add(trunk_level, 'LengthV', 0, 1);
trunk_controls.add(trunk_level, 'CurveRes', 1, 30, 1).name("Cuve Res");
trunk_controls.add(trunk_level, 'Curve', -180, 180);
trunk_controls.add(trunk_level, 'CurveV', 0, 180);
trunk_controls.add(trunk_level, 'Gnarly', 0, 20).name("Gnarlyness");
trunk_controls.add(tree_params, 'TrunkAttractionUp', -10, 10).name("Trunk Attraction Up");

const levels_folder = tree_controls.addFolder('Branches');

tree_params.LevelParam.forEach((level, i) => {
    if (i == 0) {return}
    const f = levels_folder.addFolder(`Level ${i}`);
    f.close();

    f.add(level, 'BaseSize', 0, 1).name("Base Size");
    f.add(level, 'DownAngle', 0, 180).name("Down Angle");
    f.add(level, 'DownAngleV', -90, 90).name("Down AngleV");
    f.add(level, 'Rotate', 0, 360);
    f.add(level, 'RotateV', 0, 360);

    f.add(level, 'Branches', 0, 100, 1);

    f.add(level, 'Length', 0, 2);
    f.add(level, 'LengthV', 0, 2);

    f.add(level, 'CurveRes', 1, 30, 1).name("Curve Res");
    f.add(level, 'Curve', -180, 180);
    f.add(level, 'CurveV', 0, 180);
    f.add(level, 'Gnarly', 0, 20);
});

const sc_params = tree_params.SpaceColonyParam;
// Space colony controls
const sc_folder = tree_controls.addFolder('Space Colony');
sc_folder.add(sc_params, 'see_attraction_cloud').name("See Attraction Cloud")
sc_folder.add(sc_params, 'max_iterations', 1, 500, 1).name("Max Iterations")
sc_folder.add(sc_params, 'relative_branch_length', 0.1, 0.99).name("Branch Length")
sc_folder.add(sc_params, 'attraction_range', 0.1, 10).name("Attraction Range")
sc_folder.add(sc_params, 'kill_range_relative', 0.01, 0.99).name("Kill Range")
sc_folder.add(sc_params, 'branch_randomness', 0, 10).name("Branch Gnarlyness")
sc_folder.add(sc_params, 'inverse_growth_factor', 0.01, 5).name("Ratio Power")
sc_folder.add(sc_params, 'branch_thickness', 0.001, 0.1).name("Branch Radius")
sc_folder.add(sc_params, 'attractors', 1, 8000, 1).name("Attractors")
sc_folder.add(sc_params, 'attractors_radius', 0.1, 15).name("Attractors Radius")
sc_folder.add(sc_params, 'attractors_height', 0, 40).name("Attractors Height")
sc_folder.add(sc_params, 'attractors_tall', 0.01, 10).name("Attractors Tallness")
sc_folder.add(sc_params, 'attractors_shape_mod', -1, 1).name("Attractors Shape Mod")
sc_folder.add(sc_params, 'attractors_noise', 0, 10).name("Attractors Noise")
sc_folder.add(sc_params, 'attraction_up', -1, 1).name("Attraction Up")
sc_folder.add(sc_params, 'attraction_decay', 0, 1).name("Attraction Up Decay")
sc_folder.hide();


const leaves_sc_params : GUI.Controller[] = []
const leaves_penn_params : GUI.Controller[] = []

const leaves_folder = tree_controls.addFolder('Leaves');
const leaves_param = tree_params.LeavesParam;
leaves_penn_params.push(leaves_folder.add(leaves_param, 'Amount', 0, 100))
leaves_sc_params.push(leaves_folder.add(sc_params, 'leaves_per_branch', 0, 10, 1).name("Amount"))
leaves_sc_params.push(leaves_folder.add(sc_params, 'leaf_start', 0, 1).name("Leaf Start"))
leaves_folder.add(leaves_param, 'DownAngle', 0, 180).name("Down Angle");
leaves_folder.add(leaves_param, 'DownAngleV', -90, 90).name("Down AngleV");
leaves_penn_params.push(leaves_folder.add(leaves_param, 'Rotate', 0, 360))
leaves_penn_params.push(leaves_folder.add(leaves_param, 'RotateV', 0, 360))
leaves_folder.add(leaves_param, 'LeafScale', 0, 10).name("Leaf Scale");
leaves_folder.add(leaves_param, 'LeafScaleX', 0, 2).name("Leaf Width");

tree_controls.add(tree_params, 'GenerateRoots').name("(experimental) Generate Root Geometry");
// Root generation colony controls
const root_folder = tree_controls.addFolder('Root Generation');
const root_params = tree.params.RootParams
root_folder.add(root_params, 'see_attraction_cloud').name("See Attraction Cloud")
root_folder.add(root_params, 'root_start', 0, 5).name("Root Start")
root_folder.add(root_params, 'max_iterations', 1, 500, 1).name("Max Iterations")
root_folder.add(root_params, 'relative_branch_length', 0.1, 0.99).name("Branch Length")
root_folder.add(root_params, 'attraction_range', 0.1, 10).name("Attraction Range")
root_folder.add(root_params, 'kill_range_relative', 0.01, 0.99).name("Kill Range")
root_folder.add(root_params, 'branch_randomness', 0.01, 10).name("Branch Gnarlyness")
root_folder.add(root_params, 'inverse_growth_factor', 0.01, 5).name("Ratio Power")
root_folder.add(root_params, 'branch_thickness', 0.001, 0.1).name("Branch Radius")
root_folder.add(root_params, 'attractors', 1, 8000, 1).name("Attractors")
root_folder.add(root_params, 'attractors_radius', 0.1, 15).name("Attractors Radius")
root_folder.add(root_params, 'attractors_height', -10, 0).name("Attractors Height")
root_folder.add(root_params, 'attractors_tall', 0.01, 10).name("Attractors Tallness")
root_folder.add(root_params, 'attractors_shape_mod', -1, 1).name("Attractors Shape Mod")
root_folder.add(root_params, 'attractors_noise', 0, 10).name("Attractors Noise")
root_folder.add(root_params, 'attraction_up', -1, 1).name("Attraction Up")
root_folder.add(root_params, 'attraction_decay', 0, 1).name("Attraction Up Decay")
root_folder.hide();

tree_controls.onChange(
    _ => {
        rebuild_tree()
    }
);

// Texture controls
const texture_folder = tree_controls.addFolder('Textures');
const texture_params = tree_params.TextureParam;
texture_folder.add(texture_params, 'LeafTexture', Object.keys(Tex.LeafTextures)).name("Leaf Texture");
texture_folder.add(texture_params, 'LeafHue', 0, 360).name("Leaf Hue");
texture_folder.add(texture_params, 'LeafBrightness', 0, 2).name("Leaf Brightness");
texture_folder.add(texture_params, 'BarkTexture', Object.keys(Tex.BarkTextures)).name("Bark Texture");
texture_folder.add(texture_params, 'BarkHue', 0, 360).name("Bark Hue");
texture_folder.add(texture_params, 'BarkBrightness', 0, 2).name("Bark Brightness");

function shiftHue(image: HTMLImageElement, degrees: number, brightness: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i+1] / 255;
    const b = data[i+2] / 255;

    // RGB -> HSL
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    const d = max - min;

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1));
        switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    // apply hue shift
    h = (h + degrees) % 360;
    if (h < 0) h += 360;

    // HSL -> RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r2 = 0, g2 = 0, b2 = 0;

    if (h < 60)      { r2 = c; g2 = x; b2 = 0; }
    else if (h < 120){ r2 = x; g2 = c; b2 = 0; }
    else if (h < 180){ r2 = 0; g2 = c; b2 = x; }
    else if (h < 240){ r2 = 0; g2 = x; b2 = c; }
    else if (h < 300){ r2 = x; g2 = 0; b2 = c; }
    else             { r2 = c; g2 = 0; b2 = x; }

    data[i]   = Math.min(255, (r2 + m) * 255 * brightness);
    data[i+1] = Math.min(255, (g2 + m) * 255 * brightness);
    data[i+2] = Math.min(255, (b2 + m) * 255 * brightness);
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}


function rebuild_tree () {
    tree = new T.Tree(tree_params, seed.Seed);
    const leaf_tex_hued = shiftHue(Tex.LeafTextures[tree_params.TextureParam.LeafTexture].image, tree_params.TextureParam.LeafHue, tree_params.TextureParam.LeafBrightness)
    const bark_tex_hued = shiftHue(Tex.BarkTextures[tree_params.TextureParam.BarkTexture].image, tree_params.TextureParam.BarkHue, tree_params.TextureParam.BarkBrightness)
    leaf_mat.map = leaf_tex_hued
    trunk_mat.map = bark_tex_hued
    
    scene.remove(tree_mesh);
    tree_mesh.geometry.dispose()
    tree_mesh = tree.build_tree_geometry(trunk_mat)
    scene.add(tree_mesh)
   
    if (roots_mesh.geometry) {
        scene.remove(roots_mesh)
        roots_mesh.geometry.dispose()
    }
    if (tree.params.GenerateRoots) {
        roots_mesh = tree.build_root_geometry(trunk_mat)
        scene.add(roots_mesh)
    }
    
    scene.remove(tree_leaves);
    tree_leaves.geometry.dispose()
    tree_leaves = tree.build_leaves(leaf_mat);
    scene.add(tree_leaves);

    scene.remove(attractors_cloud);
    attractors_cloud.geometry.dispose()
    if (tree.params.SpaceColonyParam.see_attraction_cloud) {
        attractors_cloud = tree.space_colonizer.create_attractors_point_cloud(attractors_mat);
        scene.add(attractors_cloud);
    }
    scene.remove(root_attractors_cloud)
    root_attractors_cloud.geometry.dispose()
    if (tree.params.GenerateRoots && tree.params.RootParams.see_attraction_cloud) {
        root_attractors_cloud = tree.root_sc.create_attractors_point_cloud(root_attractors_mat)
        scene.add(root_attractors_cloud)
    }

    if (tree.params.SpaceColony) {
        parametric_controls.hide()
        trunk_controls.hide()
        levels_folder.hide()
        leaves_sc_params.forEach((controller : GUI.Controller) => controller.show())
        leaves_penn_params.forEach((controller : GUI.Controller) => controller.hide())
        sc_folder.show()
    } else {
        parametric_controls.show()
        trunk_controls.show()
        levels_folder.show()
        leaves_sc_params.forEach((controller : GUI.Controller) => controller.hide())
        leaves_penn_params.forEach((controller : GUI.Controller) => controller.show())
        sc_folder.hide()
    }

    if (tree.params.GenerateRoots) {
        root_folder.show()
    } else {
        root_folder.hide()
    }

    if (tree.params.SpaceColony) {
        setTarget(new THREE.Vector3(0, tree.params.SpaceColonyParam.attractors_height,0))
    } else {
        setTarget(new THREE.Vector3(0,tree.processed_params.length_trunk/2,0))
    }
}

function animate() {
    updateCamera();
    renderer.render( scene, camera );
}

rebuild_tree();
renderer.setAnimationLoop( animate );
