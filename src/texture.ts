import * as THREE from 'three';

const loader = new THREE.TextureLoader();
export const LeafTextures = {
    'CommonGreen' : loader.load(import.meta.env.BASE_URL+'/assets/greenleaf.png'),
    'LongGreen' : loader.load(import.meta.env.BASE_URL+'/assets/longleaf.png'),
    'MapleRed' : loader.load(import.meta.env.BASE_URL+'/assets/leaf.png'),
    'PalmFrond' : loader.load(import.meta.env.BASE_URL+'/assets/palm_leaf.png'),
    'PalmNeedle' : loader.load(import.meta.env.BASE_URL+'/assets/palm_needle.png'),
    'Raffia' : loader.load(import.meta.env.BASE_URL+'/assets/raffia.png'),
}
export const BarkTextures = {
    'Common' : loader.load(import.meta.env.BASE_URL+'/assets/bark.jpg'),
    'White' : loader.load(import.meta.env.BASE_URL+'/assets/white_bark.jpg'),
    'Black' : loader.load(import.meta.env.BASE_URL+'/assets/black_bark.png'),
    'Smooth' : loader.load(import.meta.env.BASE_URL+'/assets/smooth_bark.png'),
    'Yellow' : loader.load(import.meta.env.BASE_URL+'/assets/yellow_bark.png'),
    'Mossy1' : loader.load(import.meta.env.BASE_URL+'/assets/mossy1.jpg'),
    'Mossy2' : loader.load(import.meta.env.BASE_URL+'/assets/mossy2.jpg'),
    'Mossy3' : loader.load(import.meta.env.BASE_URL+'/assets/mossy3.jpg'),
    'Mossy4' : loader.load(import.meta.env.BASE_URL+'/assets/mossy4.jpg'),
    'WhiteMossy' : loader.load(import.meta.env.BASE_URL+'/assets/white_moss_bark.jpg'),
    'New' : loader.load(import.meta.env.BASE_URL+'/assets/new_bark.png'),
    'Old' : loader.load(import.meta.env.BASE_URL+'/assets/old_bark.jpg'),
    'Gray' : loader.load(import.meta.env.BASE_URL+'/assets/gray_bark.jpg'),
    'Grainy' : loader.load(import.meta.env.BASE_URL+'/assets/grainy_bark.jpg'),
}

Object.values(LeafTextures).forEach(tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
});