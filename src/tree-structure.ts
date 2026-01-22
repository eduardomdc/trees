import * as THREE from 'three';

export interface BranchParams {
    length: number;
    radius: number;

    position: THREE.Vector3;
    rotation: THREE.Quaternion;
}

export class Branch {
    parent: Branch | null;
    children: Branch[] = [];

    length: number;
    radius: number;

    // Local transform
    position: THREE.Vector3;
    rotation: THREE.Quaternion;

    // Cached matrices (optional but useful)
    localMatrix: THREE.Matrix4 = new THREE.Matrix4();
    worldMatrix: THREE.Matrix4 = new THREE.Matrix4();

    constructor(params: BranchParams, parent: Branch | null = null) {
        this.parent = parent;

        this.length = params.length;
        this.radius = params.radius;

        this.position = params.position?.clone() ?? new THREE.Vector3();
        this.rotation = params.rotation?.clone() ?? new THREE.Euler();
    }

    add_child(child: Branch) {
        child.parent = this;
        this.children.push(child);
    }

    update_local_matrix() {
        this.localMatrix.compose(
            this.position,
            this.rotation,
            new THREE.Vector3(1,1,1)
        );
    }

    update_world_matrix(parentWorldMatrix?: THREE.Matrix4) {
        this.update_local_matrix();

        if (parentWorldMatrix) {
            this.worldMatrix.multiplyMatrices(parentWorldMatrix, this.localMatrix);
        } else {
            this.worldMatrix.copy(this.localMatrix);
        }

        for (const child of this.children) {
            child.update_world_matrix(this.worldMatrix);
        }
    }
}

export class Tree {
    root: Branch;

    constructor(root : Branch) {
        this.root = root;
    }

    get_world_points(): THREE.Vector3[] {
        const points: THREE.Vector3[] = [];

        this.root.update_world_matrix();

        const traverse = (branch: Branch) => {
            // base of the branch (origin in local space)
            const base = new THREE.Vector3(0, 0, 0)
                .applyMatrix4(branch.worldMatrix);

            // tip of the branch (along local +Y)
            const tip = new THREE.Vector3(0, branch.length, 0)
                .applyMatrix4(branch.worldMatrix);

            points.push(base, tip);

            for (const child of branch.children) {
                traverse(child);
            }

            points.push(tip, base);
        };

        traverse(this.root);
        return points;
    }
}

export function generate_branch (
    depth : number,
    maxDepth : number,
    parent : Branch | null = null
) : Branch {
    
    const branch = new Branch(
    {
        length: Math.max(parent?(parent.length*0.7):1.0, 0),
        radius: 0.1 * Math.pow(0.7, depth),
        position: parent ? new THREE.Vector3(0, parent.length, 0) : new THREE.Vector3(0,0,0),
        rotation: parent ? new THREE.Quaternion().setFromEuler(new THREE.Euler( 2*Math.random()-1, (2*Math.random()-1), (2*Math.random()-1)) ) : new THREE.Quaternion(),
    }, parent);

    if (depth < maxDepth) {
        const childCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < childCount; i++) {
            branch.add_child(generate_branch(depth + 1, maxDepth, branch));
        }
    }

  return branch;
}