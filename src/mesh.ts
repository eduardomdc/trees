import * as THREE from 'three';
import * as T from './penn.ts'

type Geometry = {
    vertex : Array<number>;
};

function push_vertex (array : Array<number>, vert : THREE.Vector3) {
    array.push(vert.x);
    array.push(vert.y);
    array.push(vert.z);
}

export function build_tree_geometry (root_segment : T.Segment) : THREE.BufferGeometry {
    const my_geometry : Geometry = {vertex : new Array<number>};
    build_segment_geometry(root_segment, my_geometry);
    const buffer_geometry = new THREE.BufferGeometry();
    buffer_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(my_geometry.vertex), 3));
    return buffer_geometry
}

function build_segment_geometry (segment : T.Segment, geometry : Geometry) {
    // base of the segment
    const base = segment.position.clone();
    // tip of the segment (along local +Y)
    const tip = new THREE.Vector3(0, segment.stem.per_segment_length, 0).applyQuaternion(segment.rotation).add(base);
    // check if segment is the first in the branch
    //if (segment.segment_number == 0) { // first segment in branch
        // make the base vertices instead of connecting from parent branch
    //} else {

    //}
    const radial = new THREE.Vector3(1, 0, 0).applyQuaternion(segment.rotation).add(base); // radial vector from base along segment length (local X)
    push_vertex(geometry.vertex, radial); 
    push_vertex(geometry.vertex, base); 
    push_vertex(geometry.vertex, tip); 
    for (const child of segment.children) {
        build_segment_geometry(child, geometry);
    }
}
