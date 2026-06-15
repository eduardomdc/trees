import * as T from 'three';
import * as Mesh from './mesh.ts'
import * as Tex from './texture.ts'
import * as Space from './space-colonization.ts';

const quality = 1;
const UP = new T.Vector3(0,1,0)

export function get_quaternion_from_dir (dir : T.Vector3) : T.Quaternion {
    const up = new T.Vector3(0,1,0);
    return new T.Quaternion().setFromUnitVectors(up, dir);
}

export class Tree {
    seed : number;
    level_seed : number[] = [0,0,0,0];
    root : Segment | null = null;
    leaves : T.Matrix4[] = [];

    params : TreeParams;
    processed_params : ProcessedTreeParams; // parameters in a more useful format for segment-based generation

    space_colonizer : Space.SpaceColonizer;
    root_sc : Space.SpaceColonizer;

    constructor (params : TreeParams, seed : number) {
        this.seed = seed;
        this.construct_level_seeds();
        this.params = params;
        this.processed_params = new ProcessedTreeParams(this);
        this.space_colonizer = new Space.SpaceColonizer(this, this.params.SpaceColonyParam);
        this.root_sc = new Space.SpaceColonizer(this, this.params.RootParams); 
        if (!params.SpaceColony) {this.generate_parametric_tree()}
    }

    generate_parametric_tree () {
        this.root = new Segment();
        this.root = this.root.generate_stem_Segments(this, null);
    }

    build_tree_geometry (material : T.Material) : T.Mesh {
       const buffer_geometry = Mesh.build_tree_geometry(this);
       const mesh = new T.Mesh(buffer_geometry, material);
       mesh.castShadow = true;
       mesh.receiveShadow = true;
       return mesh;
    }

    build_root_geometry (material : T.Material) : T.Mesh {
       const buffer_geometry = Mesh.build_tree_geometry(this, true);
       const mesh = new T.Mesh(buffer_geometry, material);
       mesh.castShadow = true;
       mesh.receiveShadow = true;
       return mesh;
    } 
    
    build_leaves (material : T.Material) : T.InstancedMesh {
        const mesh = Mesh.build_leaves_mesh(this, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    construct_level_seeds () {
        for (let i = 0; i < 4; i += 1) {
            this.level_seed[i] = this.make_a_level_seed() 
        }
    }

    make_a_level_seed () : number {
        // var t = this.seed += 0x6D2B79F5;
        // t = Math.imul(t ^ t >>> 15, t | 1);
        // t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        let z = (this.seed += 0x9e3779b9);
        z ^= z >>> 16;
        z = Math.imul(z, 0x21f0aaad);
        z ^= z >>> 15;
        z = Math.imul(z, 0x735a2d97);
        z ^= z >>> 15;
        const rand = ((z ^ z >>> 14) >>> 0)
        return rand
    }

    randFloat (min : number, max : number, level : number) : number {
        //mullberry32
        // var t = this.level_seed[level] += 0x6D2B79F5;
        // t = Math.imul(t ^ t >>> 15, t | 1);
        // t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        // const rand = ((t ^ t >>> 14) >>> 0) / 4294967296;
        let z = (this.level_seed[level] += 0x9e3779b9);
        z ^= z >>> 16;
        z = Math.imul(z, 0x21f0aaad);
        z ^= z >>> 15;
        z = Math.imul(z, 0x735a2d97);
        z ^= z >>> 15;
        const rand = ((z ^ z >>> 14) >>> 0)/ 4294967296
        return min + (max-min) * rand;
    }

    randDirection(level : number) : T.Vector3 {
        let x: number;
        let y: number;
        let z: number;

        do {
            x = this.randFloat(-1, 1, level); 
            y = this.randFloat(-1, 1, level); 
            z = this.randFloat(-1, 1, level); 
        } while (x * x + y * y + z * z > 1);

        return new T.Vector3(x,y,z).normalize()
    }
}

class Stem {
    level : number = 0;
    length : number = 0;
    radius : number = 0;
    children : number = 0;
    leaves_in_this_stem : number = 0;
    per_segment_leaves : number = 0;
    last_spawned_child_Y_rotation_angle : number = 0;
    last_spawned_child_offset : number = 0;
    per_segment_length : number = 0;
    parent_segment : Segment | null = null;

    clone(): Stem {
        const s = new Stem();
        s.level = this.level;
        s.length = this.length;
        s.radius = this.radius;
        s.children = this.children;
        s.leaves_in_this_stem = this.leaves_in_this_stem;
        s.per_segment_leaves = this.per_segment_leaves;
        s.last_spawned_child_Y_rotation_angle = this.last_spawned_child_Y_rotation_angle;
        s.last_spawned_child_offset = this.last_spawned_child_offset;
        s.per_segment_length = this.per_segment_length;
        s.parent_segment = this.parent_segment;
        return s;
    }
}

export class Segment {
    children : Segment[] = [];
    parent : Segment | null = null;
    segment_number : number = 0;
    length_along_this_stem : number = 0; // used for calculating offset_child of this segment
    stem : Stem = new Stem();
    direction : T.Vector3 = new T.Vector3;
    position : T.Vector3 = new T.Vector3;
    radius : number = 0;

    vertex_idx : number = 0;
    vertex_count : number = 0;

    generate_stem_Segments (tree : Tree, parent : Segment | null) : Segment {
        return this.generate_a_segment(tree, parent)
    }

    get_x_dir_in_relation_to_parent_stem () : T.Vector3 {
        if (this.stem.parent_segment == null) {
            return new T.Vector3(-1,0,0)
        } else {
            return new T.Vector3().crossVectors(this.direction, this.stem.parent_segment.direction).multiplyScalar(-1).normalize()
        }
    }

    generate_a_segment (tree : Tree, parent : Segment | null, seg_splits : number = 0) : Segment {
        var next_segment : Segment = new Segment();

        if (parent) {
            next_segment.parent = parent
            next_segment.stem.level = parent.stem.level;
            next_segment.segment_number = parent.segment_number+1;
            next_segment.position = parent.position.clone();
            next_segment.direction = parent.direction.clone();
            next_segment.length_along_this_stem = parent.length_along_this_stem;
            if (seg_splits != 0) {
                next_segment.stem = parent.stem.clone()
            }
            else {next_segment.stem = parent.stem}
        } else { // trunk first segment
            next_segment.setup_stem(tree, next_segment.stem, null, 0)
            next_segment.direction.set(0,1,0)
            next_segment.position.y = tree.params.GenerateRoots ? tree.params.RootParams.root_start : 0
        }
        
        const curve_res = tree.params.LevelParam[next_segment.stem.level].CurveRes;
        if (next_segment.segment_number >= curve_res) {// stem end
            return next_segment;
        }
        

        const x_dir = next_segment.get_x_dir_in_relation_to_parent_stem() 

        if (parent){
            const curve = tree.params.LevelParam[next_segment.stem.level].Curve;
            // curve the new segment's coordinate frame a little
            const bendQ = new T.Quaternion().setFromAxisAngle(
                x_dir,
                Math.PI*(curve/curve_res)/180,  // bend angle
            );
            next_segment.direction.applyQuaternion(bendQ);
            // in either case, a random rotation of magnitude (nCurveV/nCurveRes ) is also added for each segment
            const curve_v = tree.params.LevelParam[next_segment.stem.level].CurveV;
            const randrot = new T.Quaternion().setFromAxisAngle(
                x_dir,
                tree.randFloat(-1,1, next_segment.stem.level)*Math.PI*(curve_v/curve_res)/180, 
            );
            next_segment.direction.applyQuaternion(randrot);

            // attraction up 
            if (next_segment.stem.level > 0) {
                const delta = tree.params.AttractionUp/tree.params.LevelParam[next_segment.stem.level].CurveRes
                next_segment.direction.addScaledVector(UP, delta).normalize()
            } else {
                const delta = tree.params.TrunkAttractionUp/tree.params.LevelParam[next_segment.stem.level].CurveRes
                next_segment.direction.addScaledVector(UP, delta).normalize()
            }

            // gnarlyness
            const gnarl = tree.params.LevelParam[next_segment.stem.level].Gnarly/tree.params.LevelParam[next_segment.stem.level].CurveRes
            if (gnarl != 0) {
                const random_vec = tree.randDirection(next_segment.stem.level)
                next_segment.direction.addScaledVector(random_vec, gnarl).normalize()
            }

            //const growth = new T.Vector3(0,next_segment.stem.per_segment_length, 0)// grows in the y axis
            const growth = parent.direction.clone().multiplyScalar(next_segment.stem.per_segment_length)
            
            next_segment.position.add(growth);
            next_segment.length_along_this_stem += growth.length();
        }
        // we need to clone the parent segment actually!!!
        
        // calculate radius
        const normalized_along_stem = next_segment.length_along_this_stem/next_segment.stem.length;
        next_segment.radius = next_segment.stem.radius * (1 - normalized_along_stem); // taper as a cone

        next_segment.generate_children(tree);
        next_segment.generate_leaves(tree);
        
        this.generate_stem_Segments(tree, next_segment);
        if (parent) parent.children.push(next_segment);
        
        return next_segment;
    }
    
    compute_child_rotation( tree: Tree, parent: Segment, child_level: number, offset_child: number): T.Quaternion {
        const isLeaf = tree.params.Levels === child_level;
        const src = isLeaf
            ? tree.params.LeavesParam
            : tree.params.LevelParam[child_level];

        let DownAngle = src.DownAngle;
        let DownAngleV = src.DownAngleV;
        let Rotate = src.Rotate;
        let RotateV = src.RotateV;

        const length_base = tree.params.LevelParam[parent.stem.level].BaseSize * parent.stem.length;
        const down_angle = Math.PI * (DownAngleV >= 0
            ? DownAngle + tree.randFloat(-1, 1, child_level) * DownAngleV
            : DownAngle + tree.randFloat(-1, 1, child_level) * (DownAngleV * ( 1 - 2 * ShapeRatio( 0, (parent.stem.length - offset_child)/(parent.stem.length-length_base) ) ))
        ) / 180;

        const rotation = new T.Quaternion();
        const a_rotation = new T.Quaternion();

        if (Rotate > 0) {
            const Y_rotation_angle = parent.stem.last_spawned_child_Y_rotation_angle
                + Math.PI * (Rotate + tree.randFloat(-1, 1, child_level) * RotateV) / 180;

            parent.stem.last_spawned_child_Y_rotation_angle = Y_rotation_angle;

            a_rotation.setFromAxisAngle(parent.direction, Y_rotation_angle);
            rotation.multiply(a_rotation).normalize();
        }

        const quart = get_quaternion_from_dir(parent.direction)
        const x_vec = new T.Vector3(1,0,0).applyQuaternion(quart)
        a_rotation.setFromAxisAngle(x_vec, -down_angle);
        rotation.multiply(a_rotation).normalize();

        return rotation;
    }

    generate_child (tree : Tree, parent : Segment, offset : number) {
        var child : Segment = new Segment();
        child.parent = parent;
        child.segment_number = 0;
        child.position = parent.position.clone();
        child.direction = parent.direction.clone();
        child.length_along_this_stem = 0;
        child.stem.level = parent.stem.level+1;
        

        // check if it is in barren trunk base
        var offset_child : number = 0;
        //var bottom_position_cap = 0; // used to cut off bare trunk base
        const position_across = offset;//parent.stem.per_segment_length*tree.randFloat(bottom_position_cap,1);
        offset_child = position_across + parent.length_along_this_stem;
        child.position.add(parent.direction.clone().multiplyScalar(position_across));
       
        /*
        const len_base = tree.processed_params.length_base[parent.stem.level]*parent.stem.length;
        if (this.length_along_this_stem < len_base) {
            const diff = this.length_along_this_stem+offset_child-len_base;
            if (diff < 0) {
                return; // shouldn't even be creating a child here
            }
        }*/
        this.setup_stem(tree, child.stem, parent, offset_child) 
        
        // ==== child segment ======
        // calculate radius
        const normalized_along_stem = child.length_along_this_stem/child.stem.length;
        child.radius = child.stem.radius * (1 - normalized_along_stem); // taper as a cone
        

        // child branch rotation
        child.direction.applyQuaternion(this.compute_child_rotation(tree, parent, child.stem.level, offset_child)).normalize();

        // fix initial rotation value of stem so child branches start parallel to ground (palm trees)
        const child_orientation = get_quaternion_from_dir(child.direction)
        const x = new T.Vector3(1,0,0).applyQuaternion(child_orientation)
        const z = new T.Vector3(0,0,1).applyQuaternion(child_orientation)
        child.stem.last_spawned_child_Y_rotation_angle = Math.atan2(-z.y, x.y)

    
        const parent_quaternion = get_quaternion_from_dir(parent.direction)
        const out_of_stem = new T.Vector3(0,0,1).applyQuaternion(parent_quaternion);
        out_of_stem.applyAxisAngle(parent.direction, this.stem.last_spawned_child_Y_rotation_angle);
        
        const parent_radius = parent.stem.radius*(1 - (offset_child/parent.stem.length))
        child.position.addScaledVector(out_of_stem, (child.stem.radius-parent_radius));

        child.generate_children(tree);
        child.generate_leaves(tree);

        parent.children.push(child);
        this.generate_stem_Segments(tree, child);
    }

    setup_stem (tree : Tree, stem : Stem, parent_segment : Segment | null, offset_child : number) {
        let parent_stem : Stem | null = null
        if (parent_segment != null) {parent_stem = parent_segment.stem; stem.parent_segment = parent_segment}
        // ==== stem setup ====
        // set length
        const length_child_max = tree.params.LevelParam[stem.level].Length + tree.randFloat(0,1,stem.level)*tree.params.LevelParam[stem.level].LengthV
        if (parent_stem == null) { // trunk
            stem.length = tree.processed_params.length_trunk;
            stem.per_segment_length = tree.processed_params.per_segment_length_trunk;
        } else {
            if (stem.level == 1) {
                stem.length = tree.processed_params.length_trunk * length_child_max * ShapeRatio(tree.params.Shape, (tree.processed_params.length_trunk-offset_child)/(tree.processed_params.length_trunk-tree.processed_params.length_base[parent_stem.level]) );
            } else {
                stem.length = length_child_max * (parent_stem.length - 0.6 * offset_child);
            }
        }
        
        if (stem.length <= 0) return;
        stem.per_segment_length = stem.length/tree.params.LevelParam[stem.level].CurveRes;
        
        // calculate stem radius
        if (parent_stem == null) {
            stem.radius = tree.processed_params.length_trunk*0.2*(Math.max(tree.params.Scale0+tree.params.ScaleV0*tree.randFloat(-1,1,stem.level), 0.01));
        } else {
            stem.radius = parent_stem.radius*(stem.length / parent_stem.length)**tree.params.RatioPower;
            // limit stem radius by radius of parent at that point
            const parent_radius = parent_stem.radius*(1 - (offset_child/parent_stem.length))
            stem.radius = Math.min(parent_radius, stem.radius)
        }

        // calculate expected number of children branches from this new stem
        if (parent_stem == null) {
            this.stem.children = tree.params.LevelParam[1].Branches
        } else {
            if (stem.level == 1) {
                stem.children = tree.params.LevelParam[stem.level+1].Branches * (0.2 + 0.8 * (stem.length/parent_stem.length)/length_child_max) 
            } else {
                const next_level = Math.min(stem.level+1, tree.params.Levels-1);
                stem.children =  tree.params.LevelParam[next_level].Branches * (1.0 - 0.5 * offset_child/parent_stem.length) 
            }
            // calculate leaf count
            if (stem.level == tree.params.Levels - 1 && tree.params.LeavesParam.Amount != 0) {
                stem.leaves_in_this_stem = tree.params.LeavesParam.Amount * (ShapeRatio(4, offset_child/parent_stem.length) * quality );
                stem.per_segment_leaves = stem.leaves_in_this_stem / tree.params.LevelParam[stem.level].CurveRes;
            }
        }

    }

    generate_children (tree : Tree) {
        if (this.stem.level >= tree.params.Levels-1) {return}
        let total_stem_children = this.stem.children
        let offset = 0, children_count = 0, offset_delta = 0;
        
        const len_base = tree.params.LevelParam[this.stem.level].BaseSize*this.stem.length;
        const child_bearing_length = this.stem.length - len_base;
        
        offset_delta = child_bearing_length/total_stem_children
        const diff = this.length_along_this_stem+this.stem.per_segment_length-len_base;
        if (child_bearing_length < 0.001) {return}
        if (diff > 0) { // there's a part that is not bare trunk
            offset = Math.max(0, len_base-this.length_along_this_stem)
            const children_per_unit_len = total_stem_children/child_bearing_length;
            const this_seg_children_bearing_len = this.stem.per_segment_length-offset
            children_count = children_per_unit_len * this_seg_children_bearing_len;
        } else { // it's all bare trunk, no children for this segment
            return;
        }
        var children_whole = Math.floor(children_count) + (tree.randFloat(0, 1, this.stem.level+1) <= children_count-Math.floor(children_count) ? 1:0);
        for (let i = 0; i < children_whole; i++) {
            this.generate_child(tree, this, offset);
            offset += offset_delta
        }
    }
    generate_leaves (tree : Tree) {
        if (this.stem.leaves_in_this_stem == 0) return;
        let offset = 0
        const len_base = tree.params.LevelParam[this.stem.level].BaseSize*this.stem.length;
        const child_bearing_length = this.stem.length - len_base;
        if (child_bearing_length < 0.001) {return}
        const offset_delta = child_bearing_length/this.stem.leaves_in_this_stem
        const diff = this.length_along_this_stem+this.stem.per_segment_length-len_base;
        let leaf_count = 0;
        if (diff > 0) {
            offset = Math.max(0, len_base-this.length_along_this_stem)
            const leaves_per_unit_len = this.stem.leaves_in_this_stem/child_bearing_length;
            const this_segment_leaf_bearing_len = this.stem.per_segment_length-offset;
            leaf_count = leaves_per_unit_len * this_segment_leaf_bearing_len;
        } else {
            return;
        }
        //const offset_delta = this.stem.per_segment_length/this.stem.per_segment_leaves;
        const this_quart = get_quaternion_from_dir(this.direction) 
        //const up = new T.Vector3(0,1,0)
        leaf_count = Math.floor(leaf_count) + ( tree.randFloat(0, 1, this.stem.level) <= (leaf_count-Math.floor(leaf_count)) ? 1 : 0 );
        for (let i = 0; i < leaf_count; i+=1) {
            const leaf_length = tree.params.LeavesParam.LeafScale;
            const leaf_width = leaf_length*tree.params.LeavesParam.LeafScaleX;
            
            const leaf_direction = this.direction.clone().applyQuaternion(this.compute_child_rotation(tree, this, this.stem.level+1, offset+this.length_along_this_stem)).normalize();

            const leaf_position = this.position.clone().addScaledVector(this.direction, offset);
            const out_of_stem = new T.Vector3(0,0,1).applyQuaternion(this_quart);
            out_of_stem.applyAxisAngle(this.direction, this.stem.last_spawned_child_Y_rotation_angle);
            const branch_radius = this.stem.radius*(1 - (offset+this.length_along_this_stem)/this.stem.length)
            leaf_position.addScaledVector(out_of_stem, -branch_radius);
            
            // get quaternion with phototropic leaf orientation
            //const parallel_dir = leaf_direction.clone().sub(this.position.clone().normalize().multiplyScalar(this.position.clone().normalize().dot(leaf_direction))).normalize() // direction parallel to branch from leaf direction
            //leaf_direction.lerp(parallel_dir, tree.params.LeavesParam.PhototropicBend)

            const leaf_x = new T.Vector3().crossVectors(leaf_direction, this.direction).normalize()
            //const light_dir = new T.Vector3().lerpVectors(parallel_dir, up, 0.5)
            //const leaf_x_for_up = new T.Vector3().crossVectors(leaf_direction, parallel_dir).normalize()
            //leaf_x.lerp(leaf_x_for_up, tree.params.LeavesParam.PhototropicBend)
            const leaf_z = new T.Vector3().crossVectors(leaf_x, leaf_direction).normalize()
            const quat_mat4 = new T.Matrix4().makeBasis(leaf_x, leaf_direction, leaf_z)
            const leaf_quart = new T.Quaternion().setFromRotationMatrix(quat_mat4)
            
            /*
            let leaf_normal = leaf_z
            const theta_pos = Math.atan2(leaf_position.z, leaf_position.x)
            const theta_bend =  theta_pos - Math.atan2(leaf_normal.z, leaf_normal.x)
            const bend1 = new T.Quaternion().setFromAxisAngle(up, theta_bend * tree.params.LeavesParam.PhototropicBend)
            leaf_quart.multiply(bend1)
            leaf_normal = new T.Vector3(0,0,1).applyQuaternion(leaf_quart)
            let phi_bend = Math.atan2(Math.sqrt(leaf_normal.x**2 + leaf_normal.z**2), leaf_normal.y)
            if (phi_bend > Math.PI/2) {phi_bend = phi_bend - Math.PI}
            const bend2 = new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0).applyQuaternion(leaf_quart), phi_bend* tree.params.LeavesParam.PhototropicBend)
            leaf_quart.multiply(bend2)
            */

            const mat4 = new T.Matrix4().compose(leaf_position, leaf_quart, new T.Vector3(leaf_width,leaf_length,1)); 
            tree.leaves.push(mat4);
            offset += offset_delta;
        }
    }
}

export type TreeParams = {
    SpaceColony : boolean,
    GenerateRoots : boolean,
    Shape : number, // general tree shape id
    Scale : number,ScaleV : number//size and scaling of tree
    Levels : number, // levels of recursion
    RatioPower : number, //radius/length ratio, reduction
    // trunk (level 0) only params
    Scale0 : number, ScaleV0 :number, //extra trunk scaling
    
    MeshQuality : number[], // dictates resolution of circular cross-sections of stems

    LevelParam : LevelParam[], // array of level-specific parameters indexed by level
    LeavesParam : LeavesParam,
    AttractionUp : number, //upward growth tendency
    TrunkAttractionUp : number,

    SpaceColonyParam : Space.SpaceColonyParam,
    RootParams : Space.SpaceColonyParam,

    TextureParam : TextureParam,
}

class ProcessedTreeParams {
    length_trunk : number; // length of full trunk ( 0Length ± 0LengthV )*scale_tree
    length_base : number[]; //(BaseSize*scale tree ) 
    scale_tree : number; // (Scale±ScaleV)
    per_segment_length_trunk : number;

    constructor(t: Tree){
        this.scale_tree = (t.params.Scale + t.randFloat(-1,1,0)*t.params.ScaleV);
        this.length_trunk = (t.params.LevelParam[0].Length+t.params.LevelParam[0].LengthV*t.randFloat(-1, 1, 0))*this.scale_tree;
        this.per_segment_length_trunk = this.length_trunk/t.params.LevelParam[0].CurveRes,
        this.length_base = [(t.params.LevelParam[0].BaseSize*this.scale_tree),(t.params.LevelParam[1].BaseSize*this.scale_tree),(t.params.LevelParam[2].BaseSize*this.scale_tree),(t.params.LevelParam[3].BaseSize*this.scale_tree)];
    }
}

export type LevelParam = {
    DownAngle : number, DownAngleV : number, // angle from parent
    Rotate : number, RotateV : number,  // spiraling angle
    Branches : number, // # of branches
    Length : number, LengthV:number,// relative length of children to parent, cross-section scaling
    CurveRes:number,Curve:number,CurveV:number, // curvature resolution and angles
    // new params
    BaseSize : number,
    Gnarly : number,
}
export type LeavesParam = {
    DownAngle : number, DownAngleV : number, // angle from parent
    Rotate : number, RotateV : number,  // spiraling angle
    Amount : number, // # of branches
    LeafScale : number, LeafScaleX : number,
}


export type TextureParam = {
    LeafTexture : keyof typeof Tex.LeafTextures,
    BarkTexture : keyof typeof Tex.BarkTextures,
    LeafHue : number,
    LeafBrightness : number,
    BarkHue : number,
    BarkBrightness : number,
}

enum ShapeID {
    Conical,
    Spherical,
    Hemispherical,
    Cylindrical,
    TaperedCylindrical,
    Flame,
    InverseConical,
    TendFlame,
};

function ShapeRatio (Shape : ShapeID, ratio : number) : number {
    switch (Shape) {
        case ShapeID.Conical:
            return 0.2 + 0.8*ratio;
        case ShapeID.Spherical:
            return 0.2 + 0.8*Math.sin(Math.PI*ratio);
        case ShapeID.Hemispherical:
            return 0.2 + 0.8*Math.sin(0.5*Math.PI*ratio);
        case ShapeID.Cylindrical:
            return 1.0;
        case ShapeID.TaperedCylindrical:
            return 0.5 + 0.5 * ratio;
        case ShapeID.Flame:
            return ratio/0.7;
        case ShapeID.InverseConical:
            return 1.0 - 0.8*ratio;
        case ShapeID.TendFlame:
            if (ratio <= 0.7) return 0.5 + 0.5 * ratio;
            else return 0.5 + 0.5 * (1.0 - ratio)/0.3;
    }
}
