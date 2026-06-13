import * as THREE from 'three';

const loader = new THREE.TextureLoader();
export const LeafTextures = {
    'CommonGreen' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/greenleaf.png'),
    'LongGreen' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/longleaf.png'),
    'Maple' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/jmaple.png'),
    'Acer' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/acer_leaf.png'),
    'PalmFrond' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/palm_leaf.png'),
    'PalmNeedle' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/palm_needle.png'),
    'Raffia' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/raffia.png'),
    'BroadLeaf' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/broad_leaf.png'),
    'Ararucaria' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/ararucaria.png'),
}
export const BarkTextures = {
    'Common' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/bark.jpg'),
    'White' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/white_bark.jpg'),
    'Black' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/black_bark.png'),
    'Smooth' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/smooth_bark.png'),
    'Yellow' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/yellow_bark.png'),
    'Mossy1' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/mossy1.jpg'),
    'Mossy2' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/mossy2.jpg'),
    'Mossy3' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/mossy3.jpg'),
    'Mossy4' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/mossy4.jpg'),
    'WhiteMossy' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/white_moss_bark.jpg'),
    'New' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/new_bark.png'),
    'Old' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/old_bark.jpg'),
    'Gray' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/gray_bark.jpg'),
    'Grainy' : await loader.loadAsync(import.meta.env.BASE_URL+'/assets/grainy_bark.jpg'),
}

Object.values(LeafTextures).forEach(tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
});