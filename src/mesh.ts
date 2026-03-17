import * as THREE from 'three';
import * as T from './penn.ts'

type Geometry = {
    vertex : Array<number>;
    normal : Array<number>;
    index : Array<number>;
};

export function build_tree_geometry (tree : T.pennTree, root_segment : T.Segment) : THREE.BufferGeometry {
    const my_geometry : Geometry = {vertex : [], normal : [], index : []};
    build_segment_geometry(tree, root_segment, my_geometry);
    console.log("Built tree geometry!", my_geometry.vertex.length/3, " Vertices")
    const buffer_geometry = new THREE.BufferGeometry();
    const vertex_buffer = new Float32Array(my_geometry.vertex);
    buffer_geometry.setAttribute('position', new THREE.BufferAttribute(vertex_buffer, 3));
    const normal_buffer = new Float32Array(my_geometry.normal);
    buffer_geometry.setAttribute('normal', new THREE.BufferAttribute(normal_buffer, 3)); 
    buffer_geometry.setIndex(my_geometry.index);
    return buffer_geometry
}

function build_segment_geometry (tree : T.pennTree, segment : T.Segment, geometry : Geometry) {
    // check if segment is the first in the branch
    if (segment.segment_number == 0) { // first segment in branch
        // make the base vertices instead of connecting from parent branch
        const base_vert_offset = geometry.vertex.length/3;
        const points_normals = circle_points_normals(segment.position, segment.rotation, segment.stem.radius, 6)
        geometry.vertex.push(...points_normals[0])
        geometry.normal.push(...points_normals[1])
        segment.vertex_idx = base_vert_offset
    } else {
        if (segment.parent != null) {
            segment.vertex_idx = connect_cylinder_geometry(geometry, segment.position, segment.rotation, segment.stem.radius, 6, segment.parent.vertex_idx)
        }
    }
    
    if (segment.segment_number == tree.params.LevelParam[segment.stem.level].CurveRes-1 ) {
        console.log('make ti')
        const tip = new THREE.Vector3(0, segment.stem.per_segment_length, 0).applyQuaternion(segment.rotation).add(segment.position);
        connect_circle_to_point_geometry(geometry, tip, new THREE.Vector3(0, 1, 0).applyQuaternion(segment.rotation), 6, segment.vertex_idx)
    }
    
    for (const child of segment.children) {
        build_segment_geometry(tree, child, geometry);
    }
}

// builds cyllinder mesh from a to b
// returns vertex offsets of each base tip segment
/*
function cylinder_geometry (geometry : Geometry, position_base : THREE.Vector3, orientation_base : THREE.Quaternion, radius_base : number, position_tip : THREE.Vector3, orientation_tip : THREE.Quaternion, radius_tip : number, radial_sections : number) : Array<number> {
    const base_vert_offset = geometry.vertex.length/3;
    const tip_vert_offset = base_vert_offset+radial_sections;
    const base_points = circle_points(position_base, orientation_base, radius_base, radial_sections)
    const tip_points = circle_points(position_tip, orientation_tip, radius_tip, radial_sections)
    geometry.vertex.push(...base_points);
    geometry.vertex.push(...tip_points);
    for (let i = 0; i < radial_sections; i += 1) {
        const idx = i;
        const idx_n = (i+1) % radial_sections;
        // base to tip triangle
        geometry.index.push(idx + base_vert_offset);
        geometry.index.push(idx_n + base_vert_offset);
        geometry.index.push(idx + tip_vert_offset);
        // tip to base triangle
        geometry.index.push(idx_n + base_vert_offset);
        geometry.index.push(idx_n + tip_vert_offset);
        geometry.index.push(idx + tip_vert_offset);
    }
    return [base_vert_offset, tip_vert_offset];
}
*/
// builds cyllinder mesh from connecting existing circle vertices to new circle vertices
// returns idx vertex offset of new circle
function connect_cylinder_geometry (geometry : Geometry, position_tip : THREE.Vector3, orientation_tip : THREE.Quaternion, radius_tip : number, radial_sections : number, base_vert_offset : number) : number {
    const tip_vert_offset = geometry.vertex.length/3;
    const tip_points_normals = circle_points_normals(position_tip, orientation_tip, radius_tip, radial_sections)
    geometry.vertex.push(...tip_points_normals[0]);
    geometry.normal.push(...tip_points_normals[1]);
    for (let i = 0; i < radial_sections; i += 1) {
        const idx = i;
        const idx_n = (i+1) % radial_sections;
        // base to tip triangle
        geometry.index.push(idx + base_vert_offset);
        geometry.index.push(idx_n + base_vert_offset);
        geometry.index.push(idx + tip_vert_offset);
        // tip to base triangle
        geometry.index.push(idx_n + base_vert_offset);
        geometry.index.push(idx_n + tip_vert_offset);
        geometry.index.push(idx + tip_vert_offset);
    }
    return tip_vert_offset;
}

// pushes a single vertex to be the tip of a cone
function connect_circle_to_point_geometry (geometry : Geometry, position_tip : THREE.Vector3, normal_tip : THREE.Vector3, vert_count : number, vert_offset : number) {
    const tip_offset = geometry.vertex.length/3;
    geometry.vertex.push(...position_tip);
    geometry.normal.push(...normal_tip);
    for (let i = 0; i < vert_count; i += 1) {
        const idx = i;
        const idx_n = (i+1) % vert_count;
        // base to tip triangle
        geometry.index.push(idx + vert_offset);
        geometry.index.push(idx_n + vert_offset);
        geometry.index.push(tip_offset);
    }
}

function circle_points_normals (position : THREE.Vector3, orientation : THREE.Quaternion, radius : number, sections : number) : [Array<number>,Array<number>] {
    const angle = 2*Math.PI/sections;
    const points = new Array<number>
    const normals = new Array<number>
    const radial = new THREE.Vector3(1, 0, 0).applyQuaternion(orientation)// radial vector from base along segment length (local X)
    for (let i = 0; i < sections; i += 1) {
        const rotated_radial = radial.clone().applyAxisAngle(new THREE.Vector3(0,1,0).applyQuaternion(orientation), i*angle);
        const vertex = rotated_radial.clone().multiplyScalar(radius).add(position)
        points.push(...vertex)
        normals.push(...rotated_radial)
    }
    return [points,normals]
}
