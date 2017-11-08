// ImageInfo stores parameters of the image
class ImageInfo {
	constructor(center, size, radius, lifespan, animated) {
		this.center = center;
		this.size = size;
		this.radius = radius === undefined? 0 : radius;
		this.lifespan = lifespan === undefined? Infinity : lifespan;
		this.animated = animated === undefined? false : animated;
	}

	getCenter() {
		return this.center;
	}

	getSize() {
		return this.size;
	}

	getRadius() {
		return this.radius;
	}

	getLifespan() {
		return this.lifespan;
	}

	getAnimated() {
		return this.animated;
	}
}

class Sprite {
	constructor(pos, vel, ang, angVel, image, info) {
		this.pos = [pos[0], pos[1]];
		this.vel = [vel[0], vel[1]];
		this.angle = ang;
		this.angleVel = angVel;
		this.image = image;
		this.imageCenter = info.getCenter();
		this.imageSize = info.getSize();
		this.radius = info.getRadius();
		this.lifespan = info.getLifespan();
		this.animated = info.getAnimated();
		this.age = 0;
	}
	
	draw(context) {
		if(this.animated) {
			this.imageCenter = [this.imageSize[0] * (0.5 + this.age % this.lifespan),
								this.imageCenter[1]];
		}
		drawImage(context, this.image, this.imageCenter, this.imageSize, this.pos, this.imageSize, this.angle);
	}

	update(canvasWidth, canvasHeight) {
		// update angle
		this.angle += this.angleVel;
		// update position
		this.pos[0] = (this.pos[0] + this.vel[0] + canvasWidth) % canvasWidth;
		this.pos[1] = (this.pos[1] + this.vel[1] + canvasHeight) % canvasHeight;
		// update age
		this.age += 1
		// if age is greater than or equal to the lifespan of the sprite, 
		// remove it. return False(keep), True(remove)
		return this.age >= this.lifespan;
	}

	getPosition() {
		return this.pos;
	}

	getRadius() {
		return this.radius;
	}

	collide(otherObject) {
		var dis = dist(this.getPosition(), otherObject.getPosition());
		var radiusSum = this.getRadius() + otherObject.getRadius();
		return dis <= radiusSum;
	}
}

// Ship represents spaceship with parameters like position in canvas, velocity, angle, thrust, etc
class Ship {
	constructor(pos, vel, angle, image, info) {
		this.pos = [pos[0], pos[1]];
		this.vel = [vel[0], vel[1]];
		this.thrust = false;
		this.angle = angle;
		this.angleVel = 0;
		this.image = image;
		this.imageCenter = info.getCenter();
		this.imageSize = info.getSize();
		this.radius = info.getRadius();

		this.ACC_INC_RATIO = 0.1; // acceleration constant
		this.FRICTION_RATIO = 0.01; // friction causes deceleration
		this.ANG_VEL_INC = 0.03;// angluar velocity increment per update
		this.ANG_INC = 0.05;//angular increment per update
	}

	draw(context) {
		// display corresponding the image of spaceship w/o "thrust"
		if(this.thrust) {
			drawImage(context, this.image, 
				[this.imageCenter[0] + this.imageSize[0], this.imageCenter[1]],
				this.imageSize, this.pos, this.imageSize, this.angle);
		} else {
			drawImage(context, this.image, this.imageCenter,
				this.imageSize, this.pos, this.imageSize, this.angle);
		}
	}

	update(canvasWidth, canvasHeight) {
		// update angle
		this.angle += this.angleVel;
		// update position
		this.pos[0] = (this.pos[0] + this.vel[0] + canvasWidth) % canvasWidth;
		this.pos[1] = (this.pos[1] + this.vel[1] + canvasHeight) % canvasHeight;
		// update velocity
		
		if(this.thrust) {
			var acc = angleToVector(this.angle);
			this.vel[0] += acc[0] * this.ACC_INC_RATIO;
			this.vel[1] += acc[1] * this.ACC_INC_RATIO;
		} else {
			this.vel[0] *= (1 - this.FRICTION_RATIO);
			this.vel[1] *= (1 - this.FRICTION_RATIO);
		}
	}

	setThrust(on) {
		this.thrust = on;
	}

	incrementAngleVel() {
		this.angleVel += this.ANG_VEL_INC;
	}

	decrementAngleVel() {
		this.angleVel -= this.ANG_VEL_INC;
	}

	incrementAngle() {
		this.angle += this.ANG_INC;
	}

	decrementAngle() {
		this.angle -= this.ANG_INC;
	}

	shoot(missileGroup, missileImage, missileInfo) {
		var MISSILE_VEL = 6;
		var forward = angleToVector(this.angle);
		var missilePos = [this.pos[0] + this.radius * forward[0],
							this.pos[1] + this.radius * forward[1]];
		var missile_vel = [this.vel[0] +  MISSILE_VEL * forward[0],
							this.vel[1] + MISSILE_VEL * forward[1]];
		var missile = new Sprite(missilePos, missile_vel, this.angle, 0, missileImage, missileInfo);
		missileGroup.add(missile);
	}

	getPosition() {
		return this.pos;
	}

	getRadius() {
		return this.radius;
	}

	reset(newPos, newVel, newAng, newAngVel) {
		this.pos = newPos.slice();
		this.vel = newVel === undefined? [0, 0] : newVel.slice();
		this.angle = newAng === undefined? 0 : newAng;
		this.angleVel = newAngVel === undefined? 0 : newAngVel;
		this.thrust = false;
	}
}

// draw image (part of image) in the canvas, which perfoms mapping from imageCenter to dest_center, 
// from imageSize to dest_size, and rotates the image by specific angles
function drawImage(context, image, imageCenter, imageSize, dest_center, dest_size, angleInRadians) {
	var destX = dest_center[0];
	var destY= dest_center[1];
	var width = imageSize[0];
	var height = imageSize[1];
	
	// transform to the coordinate system after rotation
	context.translate(destX, destY);
	context.rotate(angleInRadians);
	// draw image with clipping
	// reference: https://www.w3schools.com/TAgs/canvas_drawimage.asp
	// syntax: context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
	context.drawImage(image, imageCenter[0]-width/2, imageCenter[1]-height/2, width, height, -width/2, -height/2, width, height);
	// restore the orginal coordinate system
	context.rotate(-angleInRadians);
	context.translate(-destX, -destY);
}

// helper functions to handle transformations
function angleToVector(ang) {
	return [Math.cos(ang), Math.sin(ang)];
}

function dist(p, q) {
	return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
}

function randRange(lower, upper) {
	return lower + (upper - lower) * Math.random();
}