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
        console.log("root segment", this.root);
        this.root.generate_stem_Segments(this, this.root);
        // generate_Segment (this, first_segment);
    }

    get_points() : THREE.Vector3[] {
        const points: THREE.Vector3[] = [];
        // for (const segment of this.segments) {
        //     points.push(segment.position);
        // }
        const traverse = (segment: Segment) => {
            // base of the segment
            const base = segment.position.clone();
            // tip of the segment (along local +Y)
            const tip = new THREE.Vector3(0, this.processed_params.level_param[segment.stem_level].per_segment_length, 0)
                .applyQuaternion(segment.rotation).add(base);
            
            points.push(base, tip);

            for (const splits of segment.splits) {
                traverse(splits);
            }

            for (const child of segment.children) {
                traverse(child);
            }

            // points.push(tip, base);
        };
        traverse(this.root);
        return points;
    }
}

export class Segment {
    splits : Segment[] = []; // list of stem split offs from this segment, generally will have one element, but can have two for dichotomous branching
    children : Segment[] = [];
    parent : Segment | null = null;
    stem_level : number = 0;
    segment_number : number = 0;
    length_along_this_stem : number = 0; // used for calculating offset_child of this segment
    rotation : THREE.Quaternion = new THREE.Quaternion;
    position : THREE.Vector3 = new THREE.Vector3;

    generate_stem_Segments (tree : pennTree, parent : Segment) {
        var next_segment : Segment = new Segment();
        next_segment.segment_number = parent.segment_number+1;
        next_segment.position = parent.position.clone();
        next_segment.rotation = parent.rotation.clone();
        next_segment.length_along_this_stem = parent.length_along_this_stem;
        
        if (next_segment.segment_number >= tree.params.LevelParam[next_segment.stem_level].CurveRes) return; // stem end
        
        // grow in the direction of the parent's Y axis
        const growth = new THREE.Vector3(
            0,
            tree.processed_params.level_param[0].per_segment_length, // grows in the y axis
            0
        ).applyQuaternion(next_segment.rotation);
        next_segment.position.add(growth);
        next_segment.length_along_this_stem += growth.length();

        // curve the new segment's coordinate frame a little
        const bendQ = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0), // local X axis
            0.4,                       // bend angle
        );
        next_segment.rotation.multiply(bendQ).normalize();


        parent.splits.push(next_segment);
        console.log("new segment:", next_segment);
        this.generate_stem_Segments(tree, next_segment);
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
    BaseSplits0 : number, //stem splits at base of trunk
    
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
    scale_tree : number; // (Scale±ScaleV)
    level_param : ProcessedLevelParam[];

    constructor(params: TreeParams){
        this.scale_tree = (params.Scale + randFloat(-1,1)*params.ScaleV);
        this.length_trunk = (params.LevelParam[0].Length)*this.scale_tree;
        this.level_param = [];
        const plp : ProcessedLevelParam = {
            per_segment_length : this.length_trunk/params.LevelParam[0].CurveRes,
        }
        this.level_param[0] = plp;
    }
}

type ProcessedLevelParam = {
    per_segment_length : number;
}

export type LevelParam = {
    DownAngle : number, DownAngleV : number, // angle from parent
    Rotate : number, RotateV : number,  // spiraling angle
    Branches : number, // # of branches
    Length : number, LengthV:number, Taper:number // relative length, cross-section scaling
    SegSplits : number, SplitAngle:number, SplitAngleV:number, // stem splits per segment
    CurveRes:number,Curve:number,CurveBack:number,CurveV:number, // curvature resolution and angles
}