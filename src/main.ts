import * as THREE from 'three';
import * as T from './penn'
import { TestAspen } from './garden';

const canvas = document.querySelector('#render-canvas');
if (!canvas) {
    throw new Error("Failed to get render canvas");
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
renderer.setSize( window.innerWidth, window.innerHeight );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

camera.position.z = 18;
camera.position.y = 12;

// lights
const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);



// tree
const tree = new T.pennTree(TestAspen);
const tree_points = tree.get_points();
console.log(tree_points);
const level_colors : THREE.LineBasicMaterialParameters[] = [{color: 0xffffff}, {color: 0x0000ff}, {color: 0x00ff00}, {color: 0xff0000}];
const tree_lines : THREE.Line[] = [];

for (let level = 0; level < 4; level++) {
    const line_material = new THREE.LineBasicMaterial(level_colors[level]);
    const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree_points[level]);
    const tree_line = new THREE.LineSegments(tree_line_geom, line_material);
    tree_lines.push(tree_line);
    scene.add(tree_line);
}


function animate() {
    renderer.render( scene, camera );
    for (const line of tree_lines) {
        line.rotation.y += 0.01;
    }
}
renderer.setAnimationLoop( animate );
