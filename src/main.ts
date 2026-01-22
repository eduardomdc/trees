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

camera.position.z = 14;
camera.position.y = 3;

// lights
const color = 0xFFFFFF;
const intensity = 3;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);



// tree
const line_material = new THREE.LineBasicMaterial({color: 0x00ff00});
// const tree : Tree = new Tree(generate_branch(0, 11));
// const tree_points =  tree.get_world_points();
// const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree_points);
// const tree_line = new THREE.Line(tree_line_geom, line_material);
const tree = new T.pennTree(TestAspen);
const tree_line_geom = new THREE.BufferGeometry().setFromPoints(tree.get_points());
const tree_line = new THREE.Line(tree_line_geom, line_material);
scene.add(tree_line);
console.log(tree.get_points())

function animate() {
    renderer.render( scene, camera );
    tree_line.rotation.y += 0.01;
}
renderer.setAnimationLoop( animate );
