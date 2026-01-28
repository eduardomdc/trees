import * as THREE from 'three';
import { randFloat } from 'three/src/math/MathUtils.js';

export class pennTree {

    root : Segment;

    params : TreeParams;
    processed_params : ProcessedTreeParams; // parameters in a more useful format for segment-based generation

    constructor (params : TreeParams) {
        this.params = params;
        this.processed_params = new ProcessedTreeParams(params);
        console.log("generating penn tree");
        this.root = new Segment();
        this.root = this.root.generate_stem_Segments(this, null);
    }

    get_points() : THREE.Vector3[][] {
        const points: THREE.Vector3[][] = [[],[],[],[]];// one list for each level
        // for (const segment of this.segments) {
        //     points.push(segment.position);
        // }
        const traverse = (segment: Segment) => {
            // base of the segment
            const base = segment.position.clone();
            // tip of the segment (along local +Y)
            const tip = new THREE.Vector3(0, segment.stem.per_segment_length, 0)
                .applyQuaternion(segment.rotation).add(base);
            
            points[segment.stem.level].push(base, tip);

            for (const child of segment.children) {
                traverse(child);
            }
        };
        traverse(this.root);
        return points;
    }
}

class Stem {
    level : number = 0;
    length : number = 0;
    children : number = 0;
    last_spawned_child_Y_rotation_angle : number = 0;
    per_segment_length : number = 0;
    per_segment_children : number = 0;
}

export class Segment {
    children : Segment[] = [];
    parent : Segment | null = null;
    segment_number : number = 0;
    length_along_this_stem : number = 0; // used for calculating offset_child of this segment
    stem : Stem = new Stem();
    rotation : THREE.Quaternion = new THREE.Quaternion;
    position : THREE.Vector3 = new THREE.Vector3;

    generate_stem_Segments (tree : pennTree, parent : Segment | null) : Segment {
        var next_segment : Segment = new Segment();

        if (parent) {
            next_segment.stem.level = parent.stem.level;
            next_segment.segment_number = parent.segment_number+1;
            next_segment.position = parent.position.clone();
            next_segment.rotation = parent.rotation.clone();
            next_segment.length_along_this_stem = parent.length_along_this_stem;
            next_segment.stem = parent.stem;
        } else { // trunk
            next_segment.stem.length = tree.processed_params.length_trunk;
            next_segment.stem.per_segment_length = tree.processed_params.per_segment_length_trunk;
        }
        
        const curve_res = tree.params.LevelParam[next_segment.stem.level].CurveRes;
        if (next_segment.segment_number >= curve_res) return next_segment; // stem end
        
        if (parent){
            const curve = tree.params.LevelParam[next_segment.stem.level].Curve;
            const curve_back = tree.params.LevelParam[next_segment.stem.level].CurveBack;
            // curve the new segment's coordinate frame a little
            if (curve_back == 0) {
                const bendQ = new THREE.Quaternion().setFromAxisAngle(
                    new THREE.Vector3(0, 0, 1), // local Z axis
                    Math.PI*(curve/curve_res)/180,  // bend angle
                );
                next_segment.rotation.multiply(bendQ);
            } else if (curve_back > 0) {
                // todo
            } else if (curve_back < 0) {
                // todo (probably won't do)
            }
            // in either case, a random rotation of magnitude (nCurveV/nCurveRes ) is also added for each segment
            const curve_v = tree.params.LevelParam[next_segment.stem.level].CurveV;
            const randrot = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 0, 1),
                randFloat(0,1)*Math.PI*(curve_v/curve_res)/180, 
            );
            next_segment.rotation.multiply(randrot).normalize();

            // grow in the direction of the parent's Y axis
            const growth = new THREE.Vector3(0,next_segment.stem.per_segment_length, 0)// grows in the y axis
            growth.applyQuaternion(parent.rotation);
            next_segment.position.add(growth);
            next_segment.length_along_this_stem += growth.length();
        }

        next_segment.generate_children(tree);

        if (parent) parent.children.push(next_segment);
        // console.log("new segment:", next_segment);

        this.generate_stem_Segments(tree, next_segment);
        return next_segment;
    }

    generate_child (tree : pennTree, parent : Segment) {
        var child : Segment = new Segment();
        child.parent = parent;
        child.segment_number = 0;
        child.position = parent.position.clone();
        child.rotation = parent.rotation.clone();
        child.length_along_this_stem = 0;
        child.stem.level = parent.stem.level+1;
        
        // check if it is in barren trunk base


        var offset_child : number = 0;
        var bottom_position_cap = 0; // used to cut off bare trunk base
        // move child across parent segment
        if (parent.stem.level == 0) { // if they're first branches don't add them on the bare trunk base
            const len_base = tree.processed_params.length_base;
            if (this.length_along_this_stem < len_base) {
                const diff = this.length_along_this_stem+tree.processed_params.per_segment_length_trunk-tree.processed_params.length_base;
                if (diff > 0) {
                    const fraction_out_of_bare_trunk = diff/tree.processed_params.per_segment_length_trunk;
                    bottom_position_cap = (1-fraction_out_of_bare_trunk);
                } else {
                    return; // shouldn't even be creating a child here
                }
            }
        }
        // position the child branch
        const position_across = parent.stem.per_segment_length*randFloat(bottom_position_cap,1);
        offset_child = position_across + parent.length_along_this_stem;
        child.position.add(new THREE.Vector3(0,position_across, 0).applyQuaternion(parent.rotation));
        
        
        // set length
        const length_child_max = tree.params.LevelParam[child.stem.level].Length + randFloat(0,1)*tree.params.LevelParam[child.stem.level].LengthV
        if (child.stem.level == 1) {
            child.stem.length = tree.processed_params.length_trunk * length_child_max * ShapeRatio(tree.params.Shape, (tree.processed_params.length_trunk-offset_child)/(tree.processed_params.length_trunk-tree.processed_params.length_base) );
        } else {
            child.stem.length = length_child_max * (parent.stem.length - 0.6 * offset_child);
        }
        if (child.stem.length <= 0) return;
        child.stem.per_segment_length = child.stem.length/tree.params.LevelParam[child.stem.level].CurveRes;
        
        // child branch rotation
        const DownAngle = tree.params.LevelParam[child.stem.level].DownAngle;
        const DownAngleV = tree.params.LevelParam[child.stem.level].DownAngleV;
        var a_rotation = new THREE.Quaternion();
        var Y_rotation_angle = 0;
        if (DownAngle >= 0) {
            const down_angle = Math.PI*(DownAngle + randFloat(0,1)*DownAngleV)/180;
            
            if (true) { // set Y rotation according to most recent spawned child
                const Rotate = tree.params.LevelParam[child.stem.level].Rotate;
                const RotateV = tree.params.LevelParam[child.stem.level].RotateV;
                if (tree.params.LevelParam[child.stem.level].Rotate > 0) { // helical distribution
                    
                    Y_rotation_angle = parent.stem.last_spawned_child_Y_rotation_angle; // rotate by previous child

                    // then a bit more
                    Y_rotation_angle += Math.PI*(Rotate + randFloat(-1,1)*RotateV)/180;
                    a_rotation.setFromAxisAngle(
                        new THREE.Vector3(0, 1, 0), // local Y axis
                        Y_rotation_angle,  // bend angle
                    );
                    // apply Y rotation to child rotation
                    child.rotation.multiply(a_rotation).normalize();
                } else { // todo

                }
            }
            // then rotate down
            a_rotation.setFromAxisAngle(
                new THREE.Vector3(0, 0, 1), // local Z axis
                down_angle,  // bend angle
            );
            child.rotation.multiply(a_rotation).normalize();
        } else {
            //todo
        }
        

        child.generate_children(tree);

        parent.children.push(child);
        parent.stem.last_spawned_child_Y_rotation_angle = Y_rotation_angle;
        // console.log("new child", child);
        this.generate_stem_Segments(tree, child);
    }

    generate_children (tree : pennTree) {
        if (this.stem.level < 3) {
            const children_branches = tree.params.LevelParam[this.stem.level+1].Branches
            var children_per_segment = children_branches/tree.params.LevelParam[this.stem.level].CurveRes
            if (this.stem.level == 0) {console.log("1Make", children_per_segment, "children");}
            if (this.stem.level == 0) {
                const len_base = tree.processed_params.length_base;
                if (this.length_along_this_stem < len_base) {
                    const diff = this.length_along_this_stem+tree.processed_params.per_segment_length_trunk-tree.processed_params.length_base;
                    if (diff > 0) {
                        const fraction_out_of_bare_trunk = diff/tree.processed_params.per_segment_length_trunk;
                        children_per_segment = children_per_segment*fraction_out_of_bare_trunk;
                    } else {
                        children_per_segment = 0;
                    }
                }
                
            }
            if (this.stem.level == 0) {console.log("2Make", children_per_segment, "children");}
            for (let i = 0; i < children_per_segment; i++) {
                this.generate_child(tree, this);
            }
        }
    }
}

export type TreeParams = {
    Shape : number, // general tree shape id
    BaseSize : number, // fractional branchless area at tree base
    Scale : number,ScaleV : number,ZScale : number,ZScaleV : number,//size and scaling of tree
    Levels : number, // levels of recursion
    Ratio : number, RatioPower : number, //radius/length ratio, reduction
    Lobes : number, LobeDepth : number // sinusoidal cross-section variation
    Flare : number, //exponential expansion at base of tree
    // trunk (level 0) only params
    Scale0 : number, ScaleV0 :number, //extra trunk scaling
    
    LevelParam : LevelParam[], // array of level-specific parameters indexed by level

    Leaves : number, // number of leaves per parent
    LeafShape : number, // shape id
    LeafScale : number,LeafScaleX : number, //leaf length, relative x scale
    AttractionUp : number, //upward growth tendency
    PruneRation: number, //fractional effect of pruning
    PruneWidth : number,PruneWidthPeak: number, // width, position of envelope peak
    PrunePowerLow : number,PrunePowerHigh : number, // curvature of envelope
}


class ProcessedTreeParams {
    length_trunk : number; // length of full trunk ( 0Length ± 0LengthV )*scale_tree
    length_base : number; //(BaseSize*scale tree ) 
    scale_tree : number; // (Scale±ScaleV)
    per_segment_length_trunk : number;
    level_param : ProcessedLevelParam[];

    constructor(params: TreeParams){
        this.scale_tree = (params.Scale + randFloat(0,1)*params.ScaleV);
        this.length_trunk = (params.LevelParam[0].Length)*this.scale_tree;
        this.per_segment_length_trunk = this.length_trunk/params.LevelParam[0].CurveRes,
        this.length_base = (params.BaseSize*params.Scale);
        this.level_param = [];
        const plp : ProcessedLevelParam = {
            
        }
        this.level_param[0] = plp;
    }
}

type ProcessedLevelParam = {
}

export type LevelParam = {
    DownAngle : number, DownAngleV : number, // angle from parent
    Rotate : number, RotateV : number,  // spiraling angle
    Branches : number, // # of branches
    Length : number, LengthV:number, Taper:number // relative length of children to parent, cross-section scaling
    CurveRes:number,Curve:number,CurveBack:number,CurveV:number, // curvature resolution and angles
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
    Envelope,
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
        case ShapeID.Envelope:
            return 0; // todo
    }
}