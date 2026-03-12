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

function append_to_geometry (geometry : Geometry, append : Geometry) {
    geometry.vertex.push(...append.vertex)
}

export function build_tree_geometry (root_segment : T.Segment) : THREE.BufferGeometry {
    const my_geometry : Geometry = {vertex : []};
    build_segment_geometry(root_segment, my_geometry);
    console.log("Built tree geometry!", my_geometry.vertex.length/3, " Vertices")
    const buffer_geometry = new THREE.BufferGeometry();
    buffer_geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(my_geometry.vertex), 3));
    console.log(buffer_geometry);
    return buffer_geometry
}

function build_segment_geometry (segment : T.Segment, geometry : Geometry) {
    // base of the segment
    const base = segment.position.clone();
    // tip of the segment (along local +Y)
    const tip = new THREE.Vector3(0, segment.stem.per_segment_length, 0).applyQuaternion(segment.rotation).add(base);
    //push_vertex(geometry.vertex, base)
    //push_vertex(geometry.vertex, tip)
    //push_vertex(geometry.vertex, new THREE.Vector3(0,0,10))
    // check if segment is the first in the branch
    if (segment.segment_number == 0) { // first segment in branch
        // make the base vertices instead of connecting from parent branch
        const seg_geometry = cylinder_geometry(segment.position, segment.rotation, segment.stem.radius, tip, segment.rotation, segment.stem.radius, 6)
        append_to_geometry(geometry, seg_geometry)
    } else {
        const seg_geometry = cylinder_geometry(segment.position, segment.rotation, segment.stem.radius, tip, segment.rotation, segment.stem.radius, 6)
        append_to_geometry(geometry, seg_geometry)
    }
    for (const child of segment.children) {
        build_segment_geometry(child, geometry);
    }
}

// builds cyllinder mesh from a to b
function cylinder_geometry (position_base : THREE.Vector3, orientation_base : THREE.Quaternion, radius_base : number, position_tip : THREE.Vector3, orientation_tip : THREE.Quaternion, radius_tip : number, radial_sections : number) : Geometry {
    const geometry : Geometry= {vertex:[]}
    const base_points = circle_points(position_base, orientation_base, radius_base, radial_sections)
    const tip_points = circle_points(position_tip, orientation_tip, radius_tip, radial_sections)
    for (let i = 0; i < base_points.length; i += 1) {
        const idx = i % base_points.length
        const idx_n = (i+1) % base_points.length
        // base to tip triangle
        push_vertex(geometry.vertex, base_points[idx]); 
        push_vertex(geometry.vertex, base_points[idx_n]); 
        push_vertex(geometry.vertex, tip_points[idx]);
        // tip to base triangle
        push_vertex(geometry.vertex, tip_points[idx_n]); 
        push_vertex(geometry.vertex, tip_points[idx]); 
        push_vertex(geometry.vertex, base_points[idx_n]);
    }
    return geometry
}

function circle_points (position : THREE.Vector3, orientation : THREE.Quaternion, radius : number, sections : number) : Array<THREE.Vector3> {
    const angle = 2*Math.PI/sections;
    const points = new Array<THREE.Vector3>
    const radial = new THREE.Vector3(radius, 0, 0).applyQuaternion(orientation)// radial vector from base along segment length (local X)
    for (let i = 0; i < sections; i += 1) {
        const rotated_radial = radial.clone().applyAxisAngle(new THREE.Vector3(0,1,0).applyQuaternion(orientation), i*angle);
        const vertex = rotated_radial.clone().add(position)
        points.push(vertex)
    }
    return points
}
