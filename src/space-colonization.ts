import * as T from 'three';
import * as p from './penn.ts';

export class SpaceColonizer {
    tree : p.Tree
    attractors : Array<T.Vector3> = []

    constructor (tree : p.Tree) {
        this.tree = tree
        if (!tree.params.SpaceColony) {return}
        this.generate_attractors()
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
                x = (Math.random() * 2 - 1) * radius;
                y = (Math.random() * 2 - 1) * radius;
                z = (Math.random() * 2 - 1) * radius;
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
}
