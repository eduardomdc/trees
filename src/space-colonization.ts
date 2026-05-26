import * as T from 'three';
import * as p from './penn.ts';

const UP = new T.Vector3(0,1,0)

const MAX_BRANCHES = 10000

export type SpaceColonyParam = {
    max_iterations : number;
    branch_length : number;
    attraction_range : number; 
    kill_range_relative : number;
    branch_randomness : number;
    branch_spread : number;
    inverse_growth_factor : number;
    branch_thickness : number;
    attractors : number;
    attractors_radius : number;
    attractors_height : number;
    attractors_tall : number;
    attractors_shape_mod : number;
    attractors_noise : number;
    attraction_up : number;
    see_attraction_cloud : boolean;
    leaf_start : number;
    leaves_per_branch : number;
    is_root : boolean;
    root_start : number;
}


export class SpaceColonizer {
    tree : p.Tree
    attractors : Array<Attractor> = []
    first_branch : SCBranch
    branches : Array<SCBranch> = []

    iteration : number = 0
    growth_factor : number = 0
    kill_range : number = 0.1
    params : SpaceColonyParam 

    constructor (tree : p.Tree, params : SpaceColonyParam) {
        this.tree = tree
        this.params = params 
        if (this.params.is_root) {
            this.first_branch = new SCBranch(new T.Vector3(0,this.params.root_start,0), new T.Vector3(0,-1,0), this.params.branch_length, null)
            if (!tree.params.GenerateRoots) {return}
        } else {
            if (tree.params.GenerateRoots) {
                this.first_branch = new SCBranch(new T.Vector3(0,tree.params.RootParams.root_start,0), new T.Vector3(0,1,0), this.params.branch_length, null)
            } else {
                this.first_branch = new SCBranch(new T.Vector3(0,0,0), new T.Vector3(0,1,0), this.params.branch_length, null)
            }
            if (!tree.params.SpaceColony) {return}
        }
        this.growth_factor = 1/this.params.inverse_growth_factor
        this.kill_range = this.params.attraction_range * this.params.kill_range_relative
        this.generate_attractors()
        this.generate_new_tree_structure()
    }

    generate_attractors () {
        const n = this.params.attractors;
        const radius = this.params.attractors_radius;
        const center_y = this.params.attractors_height;
        const h = this.params.attractors_tall;
        const m = 0.99*this.params.attractors_shape_mod/(radius*h);
        const height_factor = 1/(this.params.attractors_tall**2)
        
        if (m == 1/(radius*h)) return // singularity
        const min_y = (-radius*h)/(1+radius*h*m)
        const max_y = (radius*h)/(1-radius*h*m)

        for (let i: number = 0; i < n; i += 1) {
            // Uniform random point inside sphere
            let x: number;
            let y: number;
            let z: number;

            do {
                x = this.tree.randFloat(-1, 1) * radius; 
                y = this.tree.randFloat(min_y, max_y); 
                z = this.tree.randFloat(-1, 1) * radius; 
            } while (x * x + height_factor * y * y /(1+m*y)**2 + z * z > radius * radius);

            const pos = new T.Vector3(x,y + center_y,z)

            if (this.params.attractors_noise > 0) {
                const random = this.tree.randDirection();
                pos.addScaledVector(random, this.tree.randFloat(0, this.params.attractors_noise) )
            }

            this.attractors.push({ pos : pos, killed : false})
        }
    }

    create_attractors_point_cloud (material : T.PointsMaterial) : T.Points {
        const geometry = new T.BufferGeometry();
        const positions = new Float32Array(this.attractors.flatMap(v => [v.pos.x, v.pos.y, v.pos.z]))
        geometry.setAttribute("position", new T.BufferAttribute(positions,3))
        return new T.Points(geometry, material)
    }

    generate_new_tree_structure () {
        const max_iterations = this.params.max_iterations
        this.iteration = 0
        if (this.params.is_root) {
            this.branches.push(this.first_branch)
        } else {
            this.grow_first_branch();
        }
        
        while (this.iteration < max_iterations && this.attractors.length > 0 && this.branches.length < MAX_BRANCHES) {
            this.iteration += 1
            this.space_colonization()
        }

        this.calculate_branch_radius()
        if (this.params.attraction_up != 0) {this.attraction_up(this.branches[0], new T.Vector3())}
        if (!this.params.is_root) {
            this.add_leaves()
        } else {
            //this.prune_underground(this.first_branch)
        }
    }

    grow_first_branch () {
        const MAX_IT = 100
        const attraction_range = this.params.attraction_range
        if (this.first_branch == null) {return}
        let current_branch = this.first_branch;
        this.branches.push(this.first_branch)
        let found = false
        for (let i : number = 0; i < MAX_IT; i += 1) {
            for (let j : number = 0; j < this.attractors.length; j += 1) {
                const attractor = this.attractors[j];
                const distance = current_branch.end.distanceTo(attractor.pos)
                if (distance < attraction_range) { found = true; break;}
            }
            if (found) break;
            const new_branch = new SCBranch(current_branch.end, current_branch.direction, this.params.branch_length, current_branch)
            current_branch = new_branch
            this.branches.push(new_branch)
        }

    }

    space_colonization () {
        const attraction_range = this.params.attraction_range
        const kill_range = this.kill_range
        const randomness = this.params.branch_randomness
        const spread = this.params.branch_spread
        const branch_count = this.branches.length
        //const attraction_up = this.params.attraction_up
        for (let i : number = 0; i < branch_count; i += 1) {
            const branch = this.branches[i];
            if (!branch.active) {continue}
            
            branch.attractors = []
            for (let attractor_idx : number = 0; attractor_idx < this.attractors.length; attractor_idx += 1) {
                const attractor = this.attractors[attractor_idx]
                if (attractor.killed) {continue}
                const distance = branch.end.distanceTo(attractor.pos)
                if (distance < attraction_range) {
                    if (distance < kill_range) attractor.killed = true
                    branch.attractors.push(attractor.pos)
                }
            }
            
            if (branch.attractors.length > 0) {
                let sum_vector = branch.direction.clone() // think about this
                //let sum_vector = new T.Vector3(0,0,0)
                for (const attractor of branch.attractors) {
                    const direction = attractor.clone().sub(branch.end).normalize() // repeats :90, optimize later
                    sum_vector.add(direction) 
                }
                //sum_vector.add(new T.Vector3(this.tree.randFloat(-1, 1),this.tree.randFloat(-1, 1), this.tree.randFloat(-1, 1)).normalize().multiplyScalar(randomness)) // random direction is not seeded, fix later
                sum_vector.add(this.tree.randDirection().multiplyScalar(randomness))
                sum_vector.normalize()
                // spread
                if (spread > 0 && branch.children.length > 0) {
                    let paralel = this.tree.randDirection()
                    const similarity = sum_vector.dot(paralel)
                    paralel.sub(sum_vector.clone().multiplyScalar(similarity)).normalize()
                    sum_vector.add(paralel.multiplyScalar(spread*branch.children.length)).normalize()
                }
                // attraction up
                /*
                if ( attraction_up != 0) {
                    sum_vector.add(UP.clone().multiplyScalar(attraction_up)).normalize()
                }*/

                //const similarity = sum_vector.dot(branch.direction)
                //if (similarity > 0.95) continue;
                const new_branch = new SCBranch(branch.end, sum_vector, this.params.branch_length, branch);
                this.branches.push(new_branch)
            } else { // no attractors, this branch goes inactive
                branch.active = false
            }
       
        }

    }

    calculate_branch_radius () {
        for (let i : number = this.branches.length-1; i >= 0; i -= 1) {
            const branch = this.branches[i]
            if (branch.children.length == 0) {
                branch.extremity = true
                branch.radius = this.params.branch_thickness 
            } else {
                let sum = 0; 
                for (const child of branch.children) {
                    sum += child.radius**this.params.inverse_growth_factor
                } 
                branch.radius = sum**(this.growth_factor)
            }
        } 
    }

    attraction_up (branch : SCBranch, up_steer : T.Vector3) {
        // update branch start from parent end
        if (branch.parent != null) {
            branch.start = branch.parent.end.clone()
        }
        
        const old_dir = branch.direction.clone()
        branch.direction.add(up_steer)
        //branch.direction.addScaledVector(UP, this.params.attraction_up/(branch.radius+0.1)).normalize()
        branch.direction.lerp(UP, 0.03*this.params.attraction_up/(branch.radius)).normalize();
        const steering = branch.direction.clone().sub(old_dir)
        branch.end = branch.start.clone().addScaledVector(branch.direction, this.params.branch_length)
        
        for (const child of branch.children) {
            this.attraction_up(child, steering)
        }
    }

    prune_underground (branch : SCBranch) {
        if (branch.start.y < -0.1) {
            if (branch.parent == null) {return}
            for (let i : number = 0; i < branch.parent.children.length; i -= 1) {
                const child = branch.parent.children[i]
                if (child == branch) {
                    branch.parent.children.splice(i, 1); // remove this branch from it's parent
                    return;
                }
            }
            return
        }

        for (const child of branch.children) {
            this.prune_underground(child)
        }
    }

    add_leaves () {
        if (this.branches.length == 0) return
        const leaf_length = this.tree.params.LeavesParam.LeafScale
        const leaf_width = this.tree.params.LeavesParam.LeafScaleX * leaf_length
        const trunk_radius = this.branches[0].radius
        const leaf_radius_filter = (1-this.params.leaf_start)*this.params.branch_thickness + this.params.leaf_start*trunk_radius 
        const leaves_per_branch = this.params.leaves_per_branch
        const _delta = this.params.branch_length/leaves_per_branch

        for (let i : number = this.branches.length-1; i >= 0; i -= 1) {
            const branch = this.branches[i]
            if (branch.radius <= leaf_radius_filter) {
                if (branch.parent != null) { // check if inside parent, if so don't spawn leaf
                    if (branch.parent.radius> this.params.branch_length) continue 
                }
                
                let leaf_dislocation = 0
                for (let j : number = 0; j < leaves_per_branch; j += 1) {
                    const leaf_quart = p.get_quaternion_from_dir(branch.direction)

                    // calculate leaf orientation
                    const around_angle = Math.PI * (this.tree.randFloat(-1, 1));
                    const rotate_around = new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0), around_angle)
                    const down_angle = Math.PI * (this.tree.params.LeavesParam.DownAngle)/180
                    const rotate_down = new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0), down_angle)
                    // push leaf out of stem
                    const leaf_pos = branch.start.clone().addScaledVector(branch.direction, leaf_dislocation)
                    leaf_dislocation += _delta
                    const out_of_stem = new T.Vector3(0,0,1).applyQuaternion(leaf_quart)
                    out_of_stem.applyAxisAngle(branch.direction, around_angle);
                    const branch_radius = branch.radius
                    leaf_pos.addScaledVector(out_of_stem, branch_radius)
                    
                    leaf_quart.multiply(rotate_around).multiply(rotate_down)

                    const mat4 = new T.Matrix4().compose(leaf_pos, leaf_quart, new T.Vector3(leaf_width,leaf_length,1)); 
                    this.tree.leaves.push(mat4);
                } 
                if (branch.extremity && this.params.leaves_per_branch > 0) { // put another one on the ends of branches
                    const leaf_quart = p.get_quaternion_from_dir(branch.direction)
                    // calculate leaf orientation
                    const around_angle = Math.PI * (this.tree.randFloat(-1, 1));
                    const rotate_around = new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0), around_angle)
                    const down_angle = Math.PI * (this.tree.params.LeavesParam.DownAngle)/180
                    const rotate_down = new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0), down_angle)
                    // push leaf out of stem
                    const leaf_pos = branch.end.clone()
                    const out_of_stem = new T.Vector3(0,0,1).applyQuaternion(leaf_quart)
                    out_of_stem.applyAxisAngle(branch.direction, around_angle);
                    const branch_radius = branch.radius
                    leaf_pos.addScaledVector(out_of_stem, branch_radius)
                    
                    leaf_quart.multiply(rotate_around).multiply(rotate_down)

                    const mat4 = new T.Matrix4().compose(leaf_pos, leaf_quart, new T.Vector3(leaf_width,leaf_length,1)); 
                    this.tree.leaves.push(mat4);
                }
            }
        }
    }
}

type Attractor = {
    pos : T.Vector3
    killed : boolean
}

export class SCBranch {
    start : T.Vector3
    end : T.Vector3
    direction : T.Vector3
    active : boolean = true
    parent : SCBranch | null
    children : SCBranch[] = []
    attractors : T.Vector3[] = []
    vertex_offset : number = 0
    radius : number = 0
    extremity : boolean = false
    uv_value : number = 0 // vertical texture coordinate
    
    constructor (start : T.Vector3, direction : T.Vector3, length : number, parent : SCBranch | null) {
        this.start = start
        this.direction = direction
        this.parent = parent
        if (parent != null) {
            parent.children.push(this)
            this.uv_value = (parent.uv_value + 1)%2
        }
        this.end = start.clone().addScaledVector(direction, length)
    }
}

