import { Vec2, v2 } from 'cc';

export class Boid {
    position: Vec2 = v2(0, 0);
    velocity: Vec2 = v2((Math.random() - 0.5) * 240, (Math.random() - 0.5) * 240);
    acceleration: Vec2 = v2(0, 0);

    maxSpeed: number = 240; 
    maxForce: number = 9;   

    private limitVector(vec: Vec2, max: number) {
        if (vec.lengthSqr() > max * max) {
            vec.normalize().multiplyScalar(max);
        }
    }

    separation(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;
            
            const dist = Vec2.distance(this.position, other.position);
            // 规则1：如果距离小于 perception * 0.5，产生排斥力
            if (dist > 0 && dist < perception * 0.5) {
                const diff = this.position.clone().subtract(other.position);
                diff.multiplyScalar(1 / (dist * dist)); // 距离越近，排斥力越大
                steering.add(diff);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.subtract(this.velocity);
            this.limitVector(steering, this.maxForce);
        }
        return steering;
    }

    alignment(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;

            const dist = Vec2.distance(this.position, other.position);
            // 列队
            if (dist > 0 && dist < perception) {
                steering.add(other.velocity);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            steering.normalize().multiplyScalar(this.maxSpeed);
            steering.subtract(this.velocity);
            this.limitVector(steering, this.maxForce);
        }
        return steering;
    }

    cohesion(boids: Boid[], perception: number): Vec2 {
        const steering = v2(0, 0);
        let total = 0;
        
        for (const other of boids) {
            if (other === this) continue;

            const dist = Vec2.distance(this.position, other.position);
            // 凝聚
            if (dist > 0 && dist < perception) {
                steering.add(other.position);
                total++;
            }
        }
        
        if (total > 0) {
            steering.multiplyScalar(1 / total);
            return this.seek(steering);
        }
        return v2(0, 0);
    }

    seek(target: Vec2): Vec2 {
        const desired = target.clone().subtract(this.position);
        desired.normalize().multiplyScalar(this.maxSpeed);
        const steering = desired.subtract(this.velocity);
        this.limitVector(steering, this.maxForce);
        return steering;
    }

    flee(target: Vec2, radius: number): Vec2 {
        const d = Vec2.distance(this.position, target);
        // 逃逸
        if (d < radius) {
            const desired = this.position.clone().subtract(target);
            desired.normalize().multiplyScalar(this.maxSpeed * 2);
            const steering = desired.subtract(this.velocity);
            this.limitVector(steering, this.maxForce * 3);
            return steering;
        }
        return v2(0, 0);
    }

    flock(boids: Boid[], params: any) {
        const sep = this.separation(boids, params.perception).multiplyScalar(params.sepWeight);
        const ali = this.alignment(boids, params.perception).multiplyScalar(params.aliWeight);
        const coh = this.cohesion(boids, params.perception).multiplyScalar(params.cohWeight);

        this.acceleration.add(sep);
        this.acceleration.add(ali);
        this.acceleration.add(coh);
    }

    update(dt: number) {
        const acc = this.acceleration.clone();
        acc.multiplyScalar(dt * 60);
        this.velocity.add(acc);
        this.limitVector(this.velocity, this.maxSpeed);
        
        const vel = this.velocity.clone().multiplyScalar(dt);
        this.position.add(vel);
        
        this.acceleration.set(0, 0);
    }
}
