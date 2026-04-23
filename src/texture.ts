import * as THREE from 'three';

const loader = new THREE.TextureLoader();
export const LeafTextures = {
    'CommonGreen' : loader.load(import.meta.env.BASE_URL+'/assets/greenleaf.png'),
    'MapleRed' : loader.load(import.meta.env.BASE_URL+'/assets/leaf.png'),
}
export const BarkTextures = {
    'CommonBark' : loader.load(import.meta.env.BASE_URL+'/assets/bark.jpg'),
}
