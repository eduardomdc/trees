import * as THREE from 'three';
import * as T from './penn.ts';
import * as Tex from './texture.ts';
import {QuakingAspen, Acer} from './garden.ts';
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

const { camera, updateCamera, setTarget} = createOrbitalCamera(canvas, {initialRadius: 15, sensitivity: 0.008, target: new THREE.Vector3(0,10,0),});

const directionalLight = new THREE.DirectionalLight( 0xf7e8ca, 5 );
directionalLight.castShadow = true;
directionalLight.position.set(-5, 12, 0);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add( directionalLight );
//const light = new THREE.AmbientLight( 0xcad8db, 1.2); // soft white light
//scene.add( light );

const loader = new THREE.TextureLoader();

const jungle_tex = loader.load(import.meta.env.BASE_URL+'/assets/jungle.jpg');
jungle_tex.mapping = THREE.EquirectangularReflectionMapping
scene.background = jungle_tex;
scene.environment = jungle_tex;

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
var tree_params : T.TreeParams = cloneTreeParams(QuakingAspen);
var tree = new T.Tree(tree_params, seed.Seed);

const trunk_mat = new THREE.MeshStandardMaterial({map: Tex.BarkTextures[tree_params.TextureParam.BarkTexture]});
var tree_mesh = tree.build_tree_geometry(trunk_mat);
scene.add(tree_mesh);

var roots_mesh : THREE.Mesh = tree.build_root_geometry(trunk_mat);
scene.add(roots_mesh)

// leaves
const leaf_mat = new THREE.MeshStandardMaterial({side : THREE.DoubleSide, map: Tex.LeafTextures[tree_params.TextureParam.LeafTexture], transparent: true, alphaTest:0.5});
var tree_leaves = tree.build_leaves(leaf_mat);
scene.add(tree_leaves);

// Space Colony


var attractors_cloud = tree.space_colonizer.create_attractors_point_cloud(); 
scene.add(attractors_cloud)

// GUI
const gui = new GUI.GUI();

function applyPreset(preset: T.TreeParams, input: T.TreeParams) {
    preset.SpaceColony = input.SpaceColony;
    preset.GenerateRoots = input.GenerateRoots;
    preset.Shape = input.Shape;
    preset.Scale = input.Scale;
    preset.ScaleV = input.ScaleV;
    preset.ZScale = input.ZScale;
    preset.ZScaleV = input.ZScaleV;
    preset.Levels = input.Levels;
    preset.RatioPower = input.RatioPower;

    preset.Scale0 = input.Scale0;
    preset.ScaleV0 = input.ScaleV0;

    preset.AttractionUp = input.AttractionUp;

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
    preset.LeavesParam.PhototropicBend = input.LeavesParam.PhototropicBend;

    preset.SpaceColonyParam.max_iterations = input.SpaceColonyParam.max_iterations;
    preset.SpaceColonyParam.branch_length = input.SpaceColonyParam.branch_length;
    preset.SpaceColonyParam.attraction_range = input.SpaceColonyParam.attraction_range;
    preset.SpaceColonyParam.kill_range_relative = input.SpaceColonyParam.kill_range_relative;
    preset.SpaceColonyParam.branch_randomness = input.SpaceColonyParam.branch_randomness;
    preset.SpaceColonyParam.branch_spread = input.SpaceColonyParam.branch_spread;
    preset.SpaceColonyParam.inverse_growth_factor = input.SpaceColonyParam.inverse_growth_factor;
    preset.SpaceColonyParam.branch_thickness = input.SpaceColonyParam.branch_thickness;
    preset.SpaceColonyParam.attractors = input.SpaceColonyParam.attractors;
    preset.SpaceColonyParam.attractors_radius = input.SpaceColonyParam.attractors_radius;
    preset.SpaceColonyParam.attractors_height = input.SpaceColonyParam.attractors_height;
    preset.SpaceColonyParam.attractors_tall = input.SpaceColonyParam.attractors_tall;
    preset.SpaceColonyParam.attractors_shape_mod = input.SpaceColonyParam.attractors_shape_mod;
    preset.SpaceColonyParam.attractors_noise = input.SpaceColonyParam.attractors_noise;
    preset.SpaceColonyParam.attraction_up = input.SpaceColonyParam.attraction_up;
    preset.SpaceColonyParam.see_attraction_cloud = input.SpaceColonyParam.see_attraction_cloud;
    preset.SpaceColonyParam.leaf_start = input.SpaceColonyParam.leaf_start;
    preset.SpaceColonyParam.leaves_per_branch = input.SpaceColonyParam.leaves_per_branch;
    preset.SpaceColonyParam.is_root = input.SpaceColonyParam.is_root;

    preset.RootParams.max_iterations = input.RootParams.max_iterations;
    preset.RootParams.branch_length = input.RootParams.branch_length;
    preset.RootParams.attraction_range = input.RootParams.attraction_range;
    preset.RootParams.kill_range_relative = input.RootParams.kill_range_relative;
    preset.RootParams.branch_randomness = input.RootParams.branch_randomness;
    preset.RootParams.branch_spread = input.RootParams.branch_spread;
    preset.RootParams.inverse_growth_factor = input.RootParams.inverse_growth_factor;
    preset.RootParams.branch_thickness = input.RootParams.branch_thickness;
    preset.RootParams.attractors = input.RootParams.attractors;
    preset.RootParams.attractors_radius = input.RootParams.attractors_radius;
    preset.RootParams.attractors_height = input.RootParams.attractors_height;
    preset.RootParams.attractors_tall = input.RootParams.attractors_tall;
    preset.RootParams.attractors_shape_mod = input.RootParams.attractors_shape_mod;
    preset.RootParams.attractors_noise = input.RootParams.attractors_noise;
    preset.RootParams.attraction_up = input.RootParams.attraction_up;
    preset.RootParams.see_attraction_cloud = input.RootParams.see_attraction_cloud;
    preset.RootParams.leaf_start = input.RootParams.leaf_start;
    preset.RootParams.leaves_per_branch = input.RootParams.leaves_per_branch;
    preset.RootParams.is_root = input.RootParams.is_root;

    preset.TextureParam.LeafTexture = input.TextureParam.LeafTexture
    preset.TextureParam.BarkTexture = input.TextureParam.BarkTexture
    preset.TextureParam.LeafHue = input.TextureParam.LeafHue
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
load_controls.add( loadControls, 'Preset', {QuakingAspen, Acer}).onChange((_ : any) => {
    applyPreset(tree_params, loadControls.Preset)
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

tree_controls.add(seed, 'Seed', 0, 1000);
tree_controls.add(tree_params, 'SpaceColony').name("Use Space Colonization");
tree_controls.add(tree_params, 'GenerateRoots').name("Generate Root Geometry");

const parametric_controls = tree_controls.addFolder('Parametric Controls');

parametric_controls.add(tree_params, 'Shape', {
    Conical : 0,
    Spherical : 1,
    Hemispherical : 2,
    Cylindrical : 3,
    TaperedCylindrical : 4,
    Flame : 5,
    InverseConical : 6,
    TendFlame : 7,
    Envelope : 8,});
parametric_controls.add(tree_params, 'Scale', 0, 100);
parametric_controls.add(tree_params, 'ScaleV', 0, 20);
parametric_controls.add(tree_params, 'ZScale', 0, 5);
parametric_controls.add(tree_params, 'ZScaleV', 0, 5);

parametric_controls.add(tree_params, 'Levels', 1, 4, 1);

parametric_controls.add(tree_params, 'RatioPower', 0, 5);

parametric_controls.add(tree_params, 'AttractionUp', -5, 5);

const trunk_controls = tree_controls.addFolder('Trunk Options');

trunk_controls.add(tree_params, 'Scale0', 0, 1).name("Radius");
trunk_controls.add(tree_params, 'ScaleV0', 0, 1).name("RadiusV");
const trunk_level = tree_params.LevelParam[0];
trunk_controls.add(trunk_level, 'BaseSize', 0, 1);
trunk_controls.add(trunk_level, 'Length', 0, 2);
trunk_controls.add(trunk_level, 'LengthV', 0, 1);
trunk_controls.add(trunk_level, 'CurveRes', 1, 30, 1);
trunk_controls.add(trunk_level, 'Curve', -180, 180);
trunk_controls.add(trunk_level, 'CurveV', 0, 180);
trunk_controls.add(trunk_level, 'Gnarly', 0, 10);

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

    f.add(level, 'CurveRes', 1, 30, 1);
    f.add(level, 'Curve', -180, 180);
    f.add(level, 'CurveV', 0, 180);
    f.add(level, 'Gnarly', 0, 10);
});

const sc_params = tree_params.SpaceColonyParam;
// Space colony controls
const sc_folder = tree_controls.addFolder('Space Colony');
sc_folder.add(sc_params, 'see_attraction_cloud')
sc_folder.add(sc_params, 'max_iterations', 1, 500, 1)
sc_folder.add(sc_params, 'branch_length', 0.1, 3)
sc_folder.add(sc_params, 'attraction_range', 0.1, 10)
sc_folder.add(sc_params, 'kill_range_relative', 0.8, 0.99)
sc_folder.add(sc_params, 'branch_randomness', 0.01, 10)
sc_folder.add(sc_params, 'branch_spread', 0, 10)
sc_folder.add(sc_params, 'inverse_growth_factor', 0.01, 5)
sc_folder.add(sc_params, 'branch_thickness', 0.001, 0.1)
sc_folder.add(sc_params, 'attractors', 1, 8000, 1)
sc_folder.add(sc_params, 'attractors_radius', 0.1, 15)
sc_folder.add(sc_params, 'attractors_height', 0, 40)
sc_folder.add(sc_params, 'attractors_tall', 0.01, 10)
sc_folder.add(sc_params, 'attractors_shape_mod', -1, 1)
sc_folder.add(sc_params, 'attractors_noise', 0, 10)
sc_folder.add(sc_params, 'attraction_up', -1, 1)
sc_folder.hide();

// Root generation colony controls
const root_folder = tree_controls.addFolder('Root Generation');
const root_params = tree.params.RootParams
root_folder.add(root_params, 'see_attraction_cloud')
root_folder.add(root_params, 'max_iterations', 1, 500, 1)
root_folder.add(root_params, 'branch_length', 0.1, 3)
root_folder.add(root_params, 'attraction_range', 0.1, 10)
root_folder.add(root_params, 'kill_range_relative', 0.8, 0.99)
root_folder.add(root_params, 'branch_randomness', 0.01, 10)
root_folder.add(root_params, 'branch_spread', 0, 10)
root_folder.add(root_params, 'inverse_growth_factor', 0.01, 5)
root_folder.add(root_params, 'branch_thickness', 0.001, 0.1)
root_folder.add(root_params, 'attractors', 1, 8000, 1)
root_folder.add(root_params, 'attractors_radius', 0.1, 15)
root_folder.add(root_params, 'attractors_height', -10, 0)
root_folder.add(root_params, 'attractors_tall', 0.01, 10)
root_folder.add(root_params, 'attractors_shape_mod', -1, 1)
root_folder.add(root_params, 'attractors_noise', 0, 10)
root_folder.add(root_params, 'attraction_up', -1, 1)
root_folder.add(root_params, 'root_start', 0, 5)
root_folder.hide();

const leaves_sc_params : GUI.Controller[] = []
const leaves_penn_params : GUI.Controller[] = []

const leaves_folder = tree_controls.addFolder('Leaves');
const leaves_param = tree_params.LeavesParam;
leaves_penn_params.push(leaves_folder.add(leaves_param, 'Amount', 0, 100))
leaves_sc_params.push(leaves_folder.add(sc_params, 'leaves_per_branch', 0, 10, 1).name("Amount"))
leaves_sc_params.push(leaves_folder.add(sc_params, 'leaf_start', 0, 1).name("Leaf Start"))
leaves_folder.add(leaves_param, 'DownAngle', 0, 180);
leaves_folder.add(leaves_param, 'DownAngleV', -90, 90);
leaves_penn_params.push(leaves_folder.add(leaves_param, 'Rotate', 0, 360))
leaves_penn_params.push(leaves_folder.add(leaves_param, 'RotateV', 0, 360))
leaves_folder.add(leaves_param, 'LeafScale', 0, 10);
leaves_folder.add(leaves_param, 'LeafScaleX', 0, 2);
leaves_folder.add(leaves_param, 'PhototropicBend', 0, 1);



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
texture_folder.add(texture_params, 'LeafHue', 0, 360);

function shiftHue(image: HTMLImageElement, degrees: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get 2D context from canvas');

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.filter = `hue-rotate(${degrees}deg)`;
  ctx.drawImage(image, 0, 0);

  return new THREE.CanvasTexture(canvas);
}

function rebuild_tree () {
    tree = new T.Tree(tree_params, seed.Seed);
    trunk_mat.map = Tex.BarkTextures[tree_params.TextureParam.BarkTexture]
    //const leaf_tex_hued = shiftHue(Tex.LeafTextures[tree_params.TextureParam.LeafTexture].image, tree_params.TextureParam.LeafHue)
    //leaf_mat.map = leaf_tex_hued
    leaf_mat.map = Tex.LeafTextures[tree_params.TextureParam.LeafTexture]
    
    scene.remove(tree_mesh);
    disposeMesh(tree_mesh)
    tree_mesh = tree.build_tree_geometry(trunk_mat)
    scene.add(tree_mesh)
   
    if (roots_mesh.geometry) {
        scene.remove(roots_mesh)
        disposeMesh(roots_mesh)
    }
    if (tree.params.GenerateRoots) {
        roots_mesh = tree.build_root_geometry(trunk_mat)
        scene.add(roots_mesh)
    }
    
    scene.remove(tree_leaves);
    disposeMesh(tree_leaves)
    tree_leaves = tree.build_leaves(leaf_mat);
    scene.add(tree_leaves);

    scene.remove(attractors_cloud);
    const mats = Array.isArray(attractors_cloud.material) ? attractors_cloud.material : [attractors_cloud.material];
    mats.forEach(m => {
      (Object.values(m) as any[]).forEach(v => v?.isTexture && v.dispose());
      m.dispose();
    });
    attractors_cloud.geometry.dispose()
    if (tree.params.SpaceColonyParam.see_attraction_cloud) {
        attractors_cloud = tree.space_colonizer.create_attractors_point_cloud();
        scene.add(attractors_cloud);
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
renderer.setAnimationLoop( animate );

// Mesh (dispose geometry + material)
function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  mats.forEach(m => {
    (Object.values(m) as any[]).forEach(v => v?.isTexture && v.dispose());
    m.dispose();
  });
}
