import * as T from 'three';
import * as p from './penn.ts';

export class SpaceColonizer {
    tree : p.Tree
    attractors : Array<T.Vector3> = []
    first_branch : SCBranch
    active_branches : Array<SCBranch> = []

    iteration : number = 0

    constructor (tree : p.Tree) {
        this.tree = tree
        this.first_branch = new SCBranch(new T.Vector3(0,0,0), new T.Vector3(0,1,0), null)
        if (!tree.params.SpaceColony) {return}
        this.generate_attractors()
        this.generate_new_tree_structure()
    }

    generate_attractors () {
        const n = 1000;
        const radius = 5;
        const center_y = 10;
        
        for (let i: number = 0; i < n; i += 1) {
            // Uniform random point inside sphere
            let x: number;
            let y: number;
            let z: number;

            do {
                x = this.tree.randFloat(-1, 1) * radius; 
                y = this.tree.randFloat(-1, 1) * radius; 
                z = this.tree.randFloat(-1, 1) * radius; 
            } while (x * x + y * y + z * z > radius * radius);

            this.attractors.push(new T.Vector3(x,y + center_y,z))
        }
    }

    create_attractors_point_cloud () : T.Points {
        const geometry = new T.BufferGeometry();
        const positions = new Float32Array(this.attractors.flatMap(v => [v.x, v.y, v.z]))
        geometry.setAttribute("position", new T.BufferAttribute(positions,3))
        const mat = new T.PointsMaterial({color : 0xff0000, size:0.1})
        return new T.Points(geometry, mat)
    }

    generate_new_tree_structure () {
        this.iteration = 0
        this.grow_first_branch();
    }

    grow_first_branch () {
        const MAX_DISTANCE = 1;
        const MAX_ITERATIONS = 100;

        if (this.first_branch == null) {return}
        let current_branch = this.first_branch;
        let found = false
        for (let i : number = 0; i < MAX_ITERATIONS; i += 1) {
            for (let j : number = 0; j < this.attractors.length; j += 1) {
                const attractor = this.attractors[j];
                const distance = current_branch.end.distanceTo(attractor)
                if (distance < MAX_DISTANCE) { found = true; break;}
            }
            if (found) break;
            const new_branch = new SCBranch(current_branch.end, current_branch.direction, current_branch)
            current_branch = new_branch
        }

        this.active_branches.push(current_branch)
    }

    /*
    space_colonization () {
        this.iteration += 1
        for (let i : number = 0; i < this.active_branches.length; i += 1) {
            const active_branch = this.active_branches[i];
            
        }
    }
    */
}

const BRANCH_SIZE = 0.5;
export class SCBranch {
    start : T.Vector3
    end : T.Vector3
    direction : T.Vector3
    active_branch_index : number = 0
    parent : SCBranch | null
    children : SCBranch[] = []
    attractors : T.Vector3[] = []
    
    constructor (start : T.Vector3, direction : T.Vector3, parent : SCBranch | null) {
        this.start = start
        this.direction = direction
        this.parent = parent
        if (parent != null) {
            parent.children.push(this)
        }
        this.end = start.clone().addScaledVector(direction, BRANCH_SIZE)
    }
}
