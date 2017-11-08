// constants
var WIDTH = 600;
var HEIGHT = 600;
var MAX_ROCKS = 5;
var MAX_ROCK_VEL = 0.5;
var MAX_ROCK_ANG_VEL = 0.1;
var MAX_LIVES = 4;
var INIT_DIST_COEF = 1.1;// the initial dist of the spawned rock and ship versus sum of radius
var SCORE_INC = 100;// score increment constant per rock shot

// global variables
var gameStart = false;
var score = 0;
var bestScore = 0;
var lives = MAX_LIVES;
var shotCount = 0;
var maxShotCount = 0;
var time = 0;
var rockGroup = new Set();
var missileGroup = new Set();
var explosionGroup = new Set();

// buttons or dropdown selector
var startBtn = document.getElementById("startBtn");
var rotateClockwiseBtn = document.getElementById("rcw");
var rotateCounterClockwiseBtn = document.getElementById("rccw");
var shootBtn = document.getElementById("shoot"); 
var thrustBtn = document.getElementById("thrust");
var level = document.getElementById("level");

// timer id
var rockGenTimerId;

// information display, such as score/bestscore/lives/accuracy
// message display when game is end
var bestScoreDisplay = document.getElementById("bestScore");
var scoreDisplay = document.getElementById("score");
var livesDisplay = document.getElementById("lives");
var accuracyDisplay = document.getElementById("accuracy");
var maxShotCountDisplay = document.getElementById("maxShotCount");
var message = document.getElementById("msg");

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;

// image resources
var shipImage = new Image();
shipImage.src = "https://i.imgur.com/a6EzFUM.png";
var shipInfo = new ImageInfo([45, 45], [90, 90], 35);
var nebulaImage = new Image();
nebulaImage.src = "https://i.imgur.com/XCLleKo.png";
var nebulaInfo = new ImageInfo([400, 300], [800, 600]);
var debrisImage = new Image();
debrisImage.src = "https://i.imgur.com/aY2UOt7.png";
var debrisInfo = new ImageInfo([400, 300], [800, 600]);
var missileImage = new Image();
missileImage.src = "https://i.imgur.com/cCEV1eH.png";
missileInfo = new ImageInfo([5,5], [10, 10], 3, 50);
var asteroidImage = new Image();
asteroidImage.src = "https://i.imgur.com/ldrD6rv.png";
asteroidInfo = new ImageInfo([45, 45], [90, 90], 40);
var explosionImage = new Image();
explosionImage.src = "https://i.imgur.com/mSoGMRT.png";
explosionInfo = new ImageInfo([64, 64], [128, 128], 17, 24, true);

var ship = new Ship([WIDTH / 2, HEIGHT / 2], [0, 0], 0, shipImage, shipInfo);

// initialization of game
window.onload = function () {
	setInterval(draw, 20);
	setDifficulty();
	toggleShipController(true);// disable all ship controller
	checkCookie();// check if bestScore in history available and display it
	startBtn.onclick = function() {
		startBtn.disabled = true;
		level.disabled = true;
		message.style.visibility="hidden";// hide the end-of-game message
		toggleShipController(false);// enable all ship controller
		rockGenTimerId = setInterval(rockGenerator, 1000);
		setShipController();
	}
}

// toggle the state of ship controller
function toggleShipController(on) {
	rotateClockwiseBtn.disabled = on;
	rotateCounterClockwiseBtn.disabled = on;
	thrustBtn.disabled = on;
	shootBtn.disabled = on;
}

// set level of difficulty
function setDifficulty() {
	level.addEventListener("change", function() {
		switch(level.selectedIndex) {
			case 0:
				MAX_ROCKS = 5;
				MAX_LIVES = 4;
				SCORE_INC = 100;
				MAX_ROCK_VEL = 0.5;
				break;
			case 1:
				MAX_ROCKS = 10;
				MAX_LIVES = 2;
				MAX_ROCK_VEL = 1.0;
				SCORE_INC = 200;
				break;
			case 2:
				MAX_ROCKS = 15;
				MAX_LIVES = 1;
				MAX_ROCK_VEL = 2.0;
				SCORE_INC = 400;
				break;
			default:
				break;
		}
		score = 0;
		lives = MAX_LIVES;
		shotCount = 0;
		time = 0;
		msg.style.visibility="hidden";
	});
}

// set event listeners for ship controllers
function setShipController() {
	rotateClockwiseBtn.onmouseover = function() {
		ship.incrementAngleVel();
	}
	rotateClockwiseBtn.onmouseout = function() {
		ship.decrementAngleVel();
	}
	rotateCounterClockwiseBtn.onmouseover = function() {
		ship.decrementAngleVel();
	}
	rotateCounterClockwiseBtn.onmouseout = function() {
		ship.incrementAngleVel();
	}
	shootBtn.onmousedown = function() {
		shotCount++;
		ship.shoot(missileGroup, missileImage, missileInfo);
	}
	thrustBtn.onmouseover = function() {
		ship.setThrust(true);
	}
	thrustBtn.onmouseout = function() {
		ship.setThrust(false);
	}
}


function draw() {
	if(lives == 0) {
		// display message when game is over
		message.firstElementChild.innerText = "Game Over\n" + 
					"Your score is " + score + "\n" +
					"Your shooting accuracy is " + score/SCORE_INC + "/" + shotCount;
		message.style.visibility="visible";

		// reset ship position, some global variables and update bestscore
		ship.reset([WIDTH / 2, HEIGHT / 2], [0, 0], 0, 0);
		rockGroup = new Set();
		missileGroup = new Set();
		bestScore = Math.max(bestScore, score);
		bestScoreDisplay.innerText = bestScore.toString();
		maxShotCount = Math.max(maxShotCount, shotCount);
		maxShotCountDisplay.innerText = maxShotCount.toString();
		setCookie("bestScore", bestScore, 365);// use cookie to store best score
		setCookie("maxShotCount", maxShotCount, 365);// use cookie to store max shot count
		score = 0;
		lives = MAX_LIVES;
		shotCount = 0;
		startBtn.disabled = false;
		level.disabled = false;
		toggleShipController(true);
		clearInterval(rockGenTimerId);
	}
	context.clearRect(0, 0, WIDTH, HEIGHT);
	time += 1;
	wtime = (time / 4) % WIDTH;
	context.drawImage(nebulaImage, 0, 0);
	context.drawImage(debrisImage, wtime - WIDTH, 0);
	context.drawImage(debrisImage, wtime, 0);

	// collision test for ship and rocks
	if(groupCollide(ship, rockGroup)) {
		lives -= 1;
	}

	// collision test for missiles and rocks
	score += SCORE_INC * groupGroupCollide(missileGroup, rockGroup);

	// draw ship, rocks, and missiles
	ship.draw(context);
	processSpriteGroup(context, rockGroup); // update and draw rocks
	processSpriteGroup(context, missileGroup); // update and draw missiles
	
	// draw explosions
	processSpriteGroup(context, explosionGroup);

	// update ship
	ship.update(WIDTH, HEIGHT);

	// display information
	scoreDisplay.innerText = score.toString();
	livesDisplay.innerText = lives.toString();
	accuracyDisplay.innerText = score/SCORE_INC + "/" + shotCount;
}

// generate a rock
function rockGenerator() {
	if(rockGroup.size >= MAX_ROCKS) {
		return;
	}
	var rockPos = [randRange(0, WIDTH), randRange(0, HEIGHT)];
	var rockVel = [randRange(0, 1) * 2 * MAX_ROCK_VEL - MAX_ROCK_VEL, 
				randRange(0, 1) * 2 * MAX_ROCK_VEL - MAX_ROCK_VEL];
	var rockAngVel = [randRange(0, 1) * 2 * MAX_ROCK_ANG_VEL - MAX_ROCK_ANG_VEL, 
					randRange(0, 1) * 2 * MAX_ROCK_ANG_VEL - MAX_ROCK_ANG_VEL];
	var rock = new Sprite(rockPos, rockVel, 0, rockAngVel, asteroidImage, asteroidInfo);
	if(dist(rock.getPosition(), ship.getPosition()) >= INIT_DIST_COEF * (rock.getRadius() + ship.getRadius())) {
		rockGroup.add(rock);
	}	
}

// draw sprites and remove the sprites whose age > lifespan
function processSpriteGroup(context, spriteSet) {
	removeSet = new Set();
	spriteSet.forEach(function(sprite) {
		sprite.draw(context);
		// if age > lifespan, remove this sprite
		if(sprite.update(WIDTH, HEIGHT)) {
			removeSet.add(sprite);
		}
	});
	removeSet.forEach(function(sprite) {
		spriteSet.delete(sprite);
	});
}

// collision detection between one object and a group of sprite
function groupCollide(object, spriteSet) {
	var isCollide = false;
	var clone = new Set(spriteSet);
	clone.forEach(function(s) {
		if(s.collide(object)) {
			isCollide = true;
			spriteSet.delete(s);
			// add new explosion to the explosionGroup
			newExplosion = new Sprite(object.getPosition(),[0, 0], 0, 0, explosionImage, explosionInfo);
			explosionGroup.add(newExplosion);
		}
	});
	return isCollide;
}

// collision detection between two groups of sprite
function groupGroupCollide(oneGroup, otherGroup) {
	var collideCnt = 0;
	var clone = new Set(oneGroup);
	clone.forEach(function(object) {
		if(groupCollide(object, otherGroup)) {
			oneGroup.delete(object);
			collideCnt++;
		}
	});
	return collideCnt;
}

// store metrics in cookies
function setCookie(cname, cvalue, exdays) {
	var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    document.cookie = cname + "=" + cvalue + ";" + "expires="+d.toUTCString(); 
}

// get one metric from a cookie
function getCookie(cname) {
	var arr = document.cookie.split(';');
    for(var i = 0; i < arr.length; i++) {
        var c = arr[i];
        if (c.indexOf(cname) >= 0) {
            return c.split("=")[1];
        }
    }
    return "";
}

// check if cookie contains metrics and retrieve them
function checkCookie() {
	var metrics = [getCookie("bestScore"), getCookie("maxShotCount")];
	if(metrics[0] !== "") {
		document.getElementById("bestScore").innerText = metrics[0];
		bestScore = parseInt(metrics[0]);
	} else {
		document.getElementById("bestScore").innerText = "No record available yet";
	}
	if(metrics[1] !== "") {
		document.getElementById("maxShotCount").innerText = metrics[1];
		maxShotCount = parseInt(metrics[1]);
	} else {
		document.getElementById("maxShotCount").innerText = "No record available yet";
	}
}