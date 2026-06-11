import * as THREE from 'three';
import * as T from './penn.ts'
import * as S from './space-colonization.ts';

type Geometry = {
    vertex : Array<number>;
    normal : Array<number>;
    uv     : Array<number>;
    index : Array<number>;
};

const leafGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array([
  -0.5, 0.0, 0,  //  bottom left
   0.5, 0.0, 0,  //  bottom right
   0.5, 1.0, 0,  //  top right
  -0.5, 1.0, 0,  //  top left
]);
const indices = [
  0, 1, 2,
  0, 2, 3,
];
const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1,
]);
const normals = new Float32Array([
  0, 0, 1,  // bottom left  - front face
  0, 0, 1,  // bottom right - front face
  0, 0, 1,  // top right    - front face
  0, 0, 1,  // top left     - front face
]);
leafGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
leafGeometry.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
leafGeometry.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
leafGeometry.setIndex(indices);

export function build_tree_geometry (tree : T.Tree, roots : boolean = false) : THREE.BufferGeometry {
    const my_geometry : Geometry = {vertex : [], normal : [], uv : [], index : []};
    
    if (!roots) {
        if (tree.params.SpaceColony) {
            build_space_colony_geometry(tree, tree.space_colonizer.first_branch, my_geometry);
        } else {
            if (tree.root != null) {build_segment_geometry(tree, tree.root, my_geometry);}
        }
    } else {
        if (tree.params.GenerateRoots) { build_space_colony_geometry(tree, tree.root_sc.first_branch, my_geometry) }
    }

    console.log("Built tree geometry!", my_geometry.vertex.length/3, " Vertices")
    const buffer_geometry = new THREE.BufferGeometry();
    
    const vertex_buffer = new Float32Array(my_geometry.vertex);
    buffer_geometry.setAttribute('position', new THREE.BufferAttribute(vertex_buffer, 3));
    
    const normal_buffer = new Float32Array(my_geometry.normal);
    buffer_geometry.setAttribute('normal', new THREE.BufferAttribute(normal_buffer, 3)); 
    
    const uv_buffer = new Float32Array(my_geometry.uv);
    buffer_geometry.setAttribute('uv', new THREE.BufferAttribute(uv_buffer, 2));
    
    buffer_geometry.setIndex(my_geometry.index);

    return buffer_geometry
}

export function build_leaves_mesh (tree : T.Tree, material : THREE.Material) : THREE.InstancedMesh {
    const count = tree.leaves.length;
    const mesh = new THREE.InstancedMesh(leafGeometry, material, count);
    let index = 0;
    for (const leaf of tree.leaves) {
        mesh.setMatrixAt(index, leaf);
        index+=1;
    }
    return mesh;
}

function build_segment_geometry (tree : T.Tree, segment : T.Segment, geometry : Geometry) {
    const resolution = tree.params.MeshQuality[segment.stem.level];
    // check if segment is the first in the branch
    if (segment.segment_number == 0) { // first segment in branch
        // make the base vertices instead of connecting from parent branch
        const base_vert_offset = geometry.vertex.length/3;
        const points_normals = circle_points_normals(segment.position, segment.direction, segment.radius, resolution)
        geometry.vertex.push(...points_normals[0])
        geometry.normal.push(...points_normals[1])
        geometry.uv.push(...points_normals[2])
        segment.vertex_idx = base_vert_offset
    } else {
        if (segment.parent != null) {
            segment.vertex_idx = connect_cylinder_geometry(geometry, segment.position, segment.direction, segment.radius, resolution, segment.parent.vertex_idx, segment.segment_number%2)
        }
    }
    
    if (segment.segment_number == tree.params.LevelParam[segment.stem.level].CurveRes-1 ) {
        const tip = segment.position.clone().add(segment.direction.clone().multiplyScalar(segment.stem.per_segment_length))
        segment.vertex_idx = connect_cylinder_geometry(geometry, tip, segment.direction, 0, resolution, segment.vertex_idx, (segment.segment_number+1)%2)
    }
    
    for (const child of segment.children) {
        build_segment_geometry(tree, child, geometry);
    }
}

function build_space_colony_geometry (tree : T.Tree, branch : S.SCBranch, geometry : Geometry) {
    // non shared geometry for now
    if (branch.parent == null) {
        let base_vert_offset = geometry.vertex.length/3;
        const points_normals = circle_points_normals(branch.start, branch.direction, branch.radius, 5)
        geometry.vertex.push(...points_normals[0])
        geometry.normal.push(...points_normals[1])
        geometry.uv.push(...points_normals[2])
        branch.vertex_offset = base_vert_offset
    } else {
        if (branch.extremity) branch.vertex_offset = connect_cylinder_geometry(geometry, branch.end, branch.direction, 0, 5, branch.parent.vertex_offset, branch.uv_value)
        else branch.vertex_offset = connect_cylinder_geometry(geometry, branch.end, branch.direction, branch.radius, 5, branch.parent.vertex_offset, branch.uv_value)
    }

    for (const child of branch.children) {
        build_space_colony_geometry(tree, child, geometry)
    }
}

// builds cylinder mesh from connecting existing circle vertices to new circle vertices
// returns idx vertex offset of new circle
function connect_cylinder_geometry(
    geometry: Geometry,
    position_tip: THREE.Vector3,
    direction_tip: THREE.Vector3,
    radius_tip: number,
    radial_sections: number,
    base_vert_offset: number,
    v_tip: number     // vertical UV for the new ring
): number {
    const tip_vert_offset = geometry.vertex.length / 3;
    const [tip_points, tip_normals, tip_uvs] = circle_points_normals(position_tip, direction_tip, radius_tip, radial_sections, v_tip);
    geometry.vertex.push(...tip_points);
    geometry.normal.push(...tip_normals);
    geometry.uv.push(...tip_uvs);

    // radial_sections quads; the extra (sections+1)-th vertex closes the seam cleanly
    for (let i = 0; i < radial_sections; i++) {
        const b0 = i     + base_vert_offset;  // base current
        const b1 = i + 1 + base_vert_offset;  // base next  (the extra vertex, not wrapped)
        const t0 = i     + tip_vert_offset;   // tip  current
        const t1 = i + 1 + tip_vert_offset;   // tip  next

        // base-to-tip triangle
        geometry.index.push(b0, b1, t0);
        // tip-to-base triangle
        geometry.index.push(b1, t1, t0);
    }
    return tip_vert_offset;
}


// Returns [positions, normals, uvs] for a ring of (sections+1) vertices.
// The extra vertex duplicates index 0 in position/normal but carries U=1,
// giving a clean UV seam without a visible geometric crack.
function circle_points_normals(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    radius: number,
    sections: number,
    v: number = 0.0   // vertical UV coordinate for this ring
): [number[], number[], number[]] {
    const angle = (2 * Math.PI) / sections;
    const points:  number[] = [];
    const normals: number[] = [];
    const uvs:     number[] = [];

    let rotated_radial = new THREE.Vector3(1,0,0).applyQuaternion(T.get_quaternion_from_dir(direction));

    for (let i = 0; i <= sections; i++) {   // <= gives the extra closing vertex
        rotated_radial.applyAxisAngle(direction, angle);

        const vertex = rotated_radial.clone().multiplyScalar(radius).add(position);
        points.push(vertex.x, vertex.y, vertex.z);
        normals.push(rotated_radial.x, rotated_radial.y, rotated_radial.z);

        const u = i / sections;             // 0 → 1 inclusive
        uvs.push(u, v);
    }

    return [points, normals, uvs];
}
