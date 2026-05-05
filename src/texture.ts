import * as THREE from 'three';

const loader = new THREE.TextureLoader();
export const LeafTextures = {
    'CommonGreen' : loader.load(import.meta.env.BASE_URL+'/assets/greenleaf.png'),
    'MapleRed' : loader.load(import.meta.env.BASE_URL+'/assets/leaf.png'),
}
export const BarkTextures = {
    'CommonBark' : loader.load(import.meta.env.BASE_URL+'/assets/bark.jpg'),
    'WhiteBark' : loader.load(import.meta.env.BASE_URL+'/assets/white_bark.jpg'),
    'BlackBark' : loader.load(import.meta.env.BASE_URL+'/assets/black_bark.png'),
    'SmoothBark' : loader.load(import.meta.env.BASE_URL+'/assets/smooth_bark.png'),
    'YellowBark' : loader.load(import.meta.env.BASE_URL+'/assets/yellow_bark.png'),
}
