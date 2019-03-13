// RequestAnimFrame: a browser API for getting smooth animations
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var canvas = document.getElementById('canvas1'),
  ctx = canvas.getContext('2d');

var width = 422,
  height = 552;

canvas.width = width;
canvas.height = height;

//Variables for game
var platforms = [],
  image = document.getElementById("sprite"),
  platformCount = 10,
  generation = 0, 
  position = 0,
  gravity = 0.2,
  animloop,
  flag = 0,
  menuloop, broken = 0,
  dir;// score = 0, 
  firstRun = true;

//----------------------------------------------------BASE OBJECT ---------------------------------------------------------------------------//
var Base = function() {
  this.height = 5;
  this.width = width;

  //Sprite clipping
  this.cx = 0;
  this.cy = 614;
  this.cwidth = 100;
  this.cheight = 5;

  this.moved = 0;
  this.score = 0;

  this.x = 0;
  this.y = height - this.height;

  this.draw = function() {
    try {
      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };
};

var base = new Base();


function gaussianRandom()
{
	var v1, v2, s;

	do {
		v1 = 2 * Math.random() - 1;
		v2 = 2 * Math.random() - 1;
		s = v1 * v1 + v2 * v2;
	} while (s >= 1 || s == 0);

	s = Math.sqrt((-2 * Math.log(s)) / s);

	return v1 * s;
}



function mutate(x) {
  if (Math.random(1) < 0.1) {
    let offset = gaussianRandom() * 0.5;
    let newx = x + offset;
    return newx;
  } else {
    return x;
  }
}


//-------------------------------------------------------  Player object -------------------------------------------------------------
var Player = function(brain) {
    this.vy = 11;
    this.vx = 0;

    this.lastBounced = [];
    this.startCount = false;

    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isDead = false;

    this.width = 55;
    this.height = 40;

    //Sprite clipping
    this.cx = 0;
    this.cy = 0;
    this.cwidth = 110;
    this.cheight = 80;

    this.dir = "left";
    this.score = 0;

    this.x = width / 2 - this.width / 2;
    this.y = height;

    this.fitness = 0;
    this.lasers = new Array();
    this.platform_distance = new Array(5);
    this.platform_distance[0] = [null,null];
    this.platform_distance[1] = [null,null];
    this.platform_distance[2] = [null,null];
    this.platform_distance[3] = [null,null];
    this.platform_distance[4] = [null,null];


    if (brain instanceof NeuralNetwork){
      this.brain = brain.copy()
      this.brain.mutate(mutate);
    } else {
      this.brain = new NeuralNetwork(7,5,3);
    }
  

  //Function to Think
  this.think = function() {
  
    var inputs = [this.x/width, this.y/height,
                  this.platform_distance[0][0],//this.platform_distance[0][1],
                  this.platform_distance[1][0],//this.platform_distance[1][1],
                  this.platform_distance[2][0],//this.platform_distance[2][1],
                  //this.platform_distance[3][0],//this.platform_distance[3][1],
                  //this.platform_distance[4][0],//this.platform_distance[4][1],
                  this.vx, this.vy];
    var output = this.brain.predict(inputs);
      
    
    /*ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.strokeStyle = "#000000";
      ctx.arc(50, 500, 5, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.strokeStyle = "#000000";
      ctx.arc(50, 520, 5, 0, 2 * Math.PI);
      ctx.stroke();*/

    if (output[0] > output[1] && output[0] > output[2]){
      this.dir = "left";
      this.isMovingLeft = true;
      this.isMovingRight = false;

      /*ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.strokeStyle = "#FF0000";
      ctx.arc(50, 500, 5, 0, 2 * Math.PI);
      ctx.stroke();*/

    } else if (output[3] > output[1] && output[3] > output[2]){
      this.isMovingLeft = false;
      this.isMovingRight = false;

      /*ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.strokeStyle = "#FF0000";
      ctx.arc(50, 520, 5, 0, 2 * Math.PI);
      ctx.stroke();*/
    } else {
      this.dir = "right";
      this.isMovingLeft = false;
      this.isMovingRight = true;

      /*ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.strokeStyle = "#FF0000";
      ctx.arc(50, 520, 5, 0, 2 * Math.PI);
      ctx.stroke();*/
    }
  }

  this.copy = function() {
    return new Player(this.brain);
  }


  //Function to draw it
  this.draw = function() {
    try {
      if (this.dir == "right") this.cy = 121;
      else if (this.dir == "left") this.cy = 201;
      else if (this.dir == "right_land") this.cy = 289;
      else if (this.dir == "left_land") this.cy = 371;
      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };


  this.jump = function() {
    this.vy = -8;
  };

  this.jumpHigh = function() {
    this.vy = -16;
  };

};

total = 1;
player = [];
allPlayers = [];
aliveBestPlayerIndex = 0;

for (var i = 0; i<total;i++){
  newPlayer = new Player();
  allPlayers.push(newPlayer);
  player[i] = newPlayer;
}



//-------------------------------------------------------  Laser Vision object -------------------------------------------------------------


var Laser = function(direction, x_2, y_2) {
  this.laser_direction = direction;
  this.x2 = x_2;
  this.y2 = y_2;

  //Draw the Nodes for the NN Inputes
  this.drawNode = function(direction) {
    ctx.beginPath();
    ctx.setLineDash([0, 0]);
    if (direction == "down"){
      ctx.arc(25, 490, 5, 0, 2 * Math.PI);
    } else if (direction == "down-right"){
      ctx.arc(25, 510, 5, 0, 2 * Math.PI);
    } else if (direction == "down-left"){
      ctx.arc(25, 530, 5, 0, 2 * Math.PI);
    }
    ctx.stroke();
  }

  this.draw = function(platforms,playerX, playerY) {
    collision = false;
    dist = 0;
    px = 0; //platform x
    py = 0; //platform y

    //Iterate thru positions of platforms and check for collisions
    for(i = 0 ; i<platforms.length; i++){  
      if (this.laser_direction == "down"){
        if (playerX < (platforms[i].x + 70) && playerX > (platforms[i].x) && platforms[i].y > playerY){
          collision = true;
          
        }
      } else if (this.laser_direction == "right"){
          if (playerY <= platforms[i].y+17/2 && playerY >= platforms[i].y-17/2  && platforms[i].x > playerX){
            collision = true;
        }
      } else if (this.laser_direction == "left"){
          if ((playerY <= platforms[i].y+17 && playerY >= platforms[i].y  && platforms[i].x < playerX)){
            collision = true;
        }
      } else {
        x1 = playerX+30;
        y1 = playerY;
        m = (this.x2 - x1)/(this.y2 - y1);
        c = (this.y2-this.x2)*m;
        for(var x = x1; x<this.x2; x++){
          x3 = x1 - (x-x1);
          y = m*x+c;
          if (this.laser_direction == "down-right"){
            if (x < (platforms[i].x + 70) && x > (platforms[i].x) && y <= (platforms[i].y+17) && y >= (platforms[i].y)){
              collision = true;
            }
          } 
          if (this.laser_direction == "down-left" && i>0){
            if (x3 < (platforms[i].x + 70) && x3 > (platforms[i].x) && y <= (platforms[i].y+17) && y >= (platforms[i].y)){
              collision = true;
            }
          }
        }            
      }
      if (collision) {
        px = platforms[i].x;
        py = platforms[i].y;
        break;
      }
    }

      if (this.laser_direction == "down-left"){
        this.x2 = playerX - 150;
        this.y2 = playerY + 150;
      }
      
      //Comment out to remove Neural Network
      /*if (collision){ 
        //this.drawNode(this.laser_direction);
        ctx.strokeStyle = "#FF0000";
      } else { 
        //this.drawNode(this.laser_direction);
        ctx.strokeStyle = "#000000";
      }*/
      
      //Comment out to remove Laser Visions
      /*ctx.beginPath();
      ctx.setLineDash([10, 10]);
      ctx.moveTo(playerX+30, playerY+15);
      ctx.lineTo(this.x2, this.y2);
      if (collision){ 
        ctx.strokeStyle = "#FF0000";
      } else { 
        ctx.strokeStyle = "#000000";
      }
      ctx.lineWidth = 2;
      ctx.stroke();*/

      if (collision){ 
        return [(px - playerX)/width,(py - playerY)/height];
      } else { 
        return [null,null];
      }

      

    }
  }





//-------------------------------------------------------  Platform object -------------------------------------------------------------

function Platform() {
  this.width = 70;
  this.height = 17;

  this.x = Math.random() * (width - this.width);
  this.y = position;

  position += (height / platformCount);

  this.flag = 0;
  this.state = 0;

  //Sprite clipping
  this.cx = 0;
  this.cy = 0;
  this.cwidth = 105;
  this.cheight = 31;

  //Function to draw it
  this.draw = function() {
    try {

      if (this.type == 1) this.cy = 0;
      else if (this.type == 2) this.cy = 61;
      else if (this.type == 3 && this.flag === 0) this.cy = 31;
      else if (this.type == 3 && this.flag == 1) this.cy = 1000;
      else if (this.type == 4 && this.state === 0) this.cy = 90;
      else if (this.type == 4 && this.state == 1) this.cy = 1000;

      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height); //Comment Out for just lines for platforms
      
      /*ctx.beginPath();
      ctx.setLineDash([0, 0]);
      ctx.moveTo(this.x,this.y);
      ctx.lineTo(this.x+this.width, this.y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 5;
      ctx.stroke(); UNCOMMENT FOR LINES AS PLATFORMS, COMMENT OUT ABOVE*/

    } catch (e) {}
  };

  //Platform types
  //1: Normal
  //2: Moving
  //3: Breakable (Go through)
  //4: Vanishable 
  //Setting the probability of which type of platforms should be shown at what score
  
  //NEEDS TO BE LEADING PLAYER INDEX
  if (player[aliveBestPlayerIndex].score >= 5000) this.types = [2, 3, 3, 3, 4, 4, 4, 4];
  else if (player[aliveBestPlayerIndex].score >= 2000 && player[aliveBestPlayerIndex].score < 5000) this.types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
  else if (player[aliveBestPlayerIndex].score >= 1000 && player[aliveBestPlayerIndex].score < 2000) this.types = [2, 2, 2, 3, 3, 3, 3, 3];
  else if (player[aliveBestPlayerIndex].score >= 500 && player[aliveBestPlayerIndex].score < 1000) this.types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
  else if (player[aliveBestPlayerIndex].score >= 100 && player[aliveBestPlayerIndex].score < 500) this.types = [1, 1, 1, 1, 2, 2];
  else this.types = [1];

  this.type = this.types[Math.floor(Math.random() * this.types.length)];

  //We can't have two consecutive breakable platforms otherwise it will be impossible to reach another platform sometimes!
  if (this.type == 3 && broken < 1) {
    broken++;
  } else if (this.type == 3 && broken >= 1) {
    this.type = 1;
    broken = 0;
  }

  this.moved = 0;
  this.vx = 1;
}

for (var i = 0; i < platformCount; i++) {
  platforms.push(new Platform());
}

//------------------------------------------------------- Broken, Platform object -------------------------------------------------------------
var Platform_broken_substitute = function() {
  this.height = 30;
  this.width = 70;

  this.x = 0;
  this.y = 0;

  //Sprite clipping
  this.cx = 0;
  this.cy = 554;
  this.cwidth = 105;
  this.cheight = 60;

  this.appearance = false;

  this.draw = function() {
    try {
      if (this.appearance === true) ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
      else return;
    } catch (e) {}
  };
};

var platform_broken_substitute = new Platform_broken_substitute();



//-------------------------------------------------------  Spring object -------------------------------------------------------------
var spring = function() {
  this.x = 0;
  this.y = 0;

  this.width = 26;
  this.height = 30;

  //Sprite clipping
  this.cx = 0;
  this.cy = 0;
  this.cwidth = 45;
  this.cheight = 53;

  this.state = 0;

  this.draw = function() {
    try {
      if (this.state === 0) this.cy = 445;
      else if (this.state == 1) this.cy = 501;

      ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
    } catch (e) {}
  };
};

var Spring = new spring();



//-------------------------------------------------------  GAME CALCULATIONS -------------------------------------------------------------


function init() {

  //Variables for the game
  var dir = "left",
    jumpCount = 0;
  
  firstRun = false;

  //Function for clearing canvas in each consecutive frame

  function paintCanvas() {
    ctx.clearRect(0, 0, width, height);
  }

  //Player related calculations and functions

  function playerCalc(i) {
    if (player[i].dir == "left") {
      player[i].dir = "left";
      if (player[i].vy < -7 && player[i].vy > -15) player[i].dir = "left_land";
    } else if (player[i].dir == "right") {
      player[i].dir = "right";
      if (player[i].vy < -7 && player[i].vy > -15) player[i].dir = "right_land";
    }

    //Accelerations produces when the user hold the keys
    if (player[i].isMovingLeft === true) {
      player[i].x += player[i].vx;
      player[i].vx -= 0.15;
    } else {
      player[i].x += player[i].vx;
      if (player[i].vx < 0) player[i].vx += 0.1;
    }

    if (player[i].isMovingRight === true) {
      player[i].x += player[i].vx;
      player[i].vx += 0.15;
    } else {
      player[i].x += player[i].vx;
      if (player[i].vx > 0) player[i].vx -= 0.1;
    }

    // Speed limits! SHOULD BE 8 IF REPLICATING REAL GAME
    if(player[i].vx > 1)
      player[i].vx = 1;
    else if(player[i].vx < -1)
      player[i].vx = -1;

    
    //Jump the player when it hits the base
    if ((player[i].y + player[i].height) > base.y && base.y < height) {
      player[i].jump();
      player[i].lastBounced.push(base.y);
    }

    //Gameover if it hits the bottom 
    if (base.y > height && (player[i].y + player[i].height) > height && player[i].isDead != "lol") player[i].isDead = true;

    //Make the player move through walls
    if (player[i].x > width) player[i].x = 0 - player[i].width;
    else if (player[i].x < 0 - player[i].width) player[i].x = width;

    //Movement of player affected by gravity
    if (player[i].y >= (height / 2) - (player[i].height / 2)) {
      player[i].y += player[i].vy;
      player[i].vy += gravity;
    }

    //When the player reaches half height, move the platforms to create the illusion of scrolling and recreate the platforms that are out of viewport...
    else {
      platforms.forEach(function(p, i) {

        if (player[aliveBestPlayerIndex].vy < 0) {
          p.y -= player[aliveBestPlayerIndex].vy;
        }

        if (p.y > height) {
          platforms[i] = new Platform();
          platforms[i].y = p.y - height;
        }

      });

      base.y -= player[i].vy;
      player[i].vy += gravity;

      if (player[i].vy >= 0) {
        player[i].y += player[i].vy;
        player[i].vy += gravity;
      }

      if(player[i].startCount==true){
        player[i].score++;
      }
    }
    //Make the player jump when it collides with platforms
    collides(i);
  }

  //Spring algorithms

  function springCalc() {
    var s = Spring;
    var p = platforms[0];

    if (p.type == 1 || p.type == 2) {
      s.x = p.x + p.width / 2 - s.width / 2;
      s.y = p.y - p.height - 10;

      if (s.y > height / 1.1) s.state = 0;

      s.draw();
    } else {
      s.x = 0 - s.width;
      s.y = 0 - s.height;
    }
  }

  //Platform's horizontal movement (and falling) algo

  function platformCalc() {
    var subs = platform_broken_substitute;

    platforms.forEach(function(p, i) {
      if (p.type == 2) {
        if (p.x < 0 || p.x + p.width > width) p.vx *= -1;

        p.x += p.vx;
      }

      if (p.flag == 1 && subs.appearance === false && jumpCount === 0) {
        subs.x = p.x;
        subs.y = p.y;
        subs.appearance = true;

        jumpCount++;
      }

      p.draw();
    });

    if (subs.appearance === true) {
      subs.draw();
      subs.y += 8;
    }

    if (subs.y > height) subs.appearance = false;
  }

  function collides(j) {
    //Platforms
    platforms.forEach(function(p, i) {
      if (player[j].vy > 0 && p.state === 0 && (player[j].x + 15 < p.x + p.width) && (player[j].x + player[j].width - 15 > p.x) && (player[j].y + player[j].height > p.y) && (player[j].y + player[j].height < p.y + p.height)) {
        player[j].lastBounced.push(p.y);
        if (p.type == 3 && p.flag === 0) {
          p.flag = 1;
          jumpCount = 0;
          return;
        } else if (p.type == 4 && p.state === 0) {
          player[j].jump();
          if (!player[j].startCount) player[j].startCount = true;
          p.state = 1;
        } else if (p.flag == 1) return;
        else {
          player[j].jump();
          if (!player[j].startCount) player[j].startCount = true;
        }
      }
    });

    //Springs
    var s = Spring;
    if (player[j].vy > 0 && (s.state === 0) && (player[j].x + 15 < s.x + s.width) && (player[j].x + player[j].width - 15 > s.x) && (player[j].y + player[j].height > s.y) && (player[j].y + player[j].height < s.y + s.height)) {
      s.state = 1;
      player[j].jumpHigh();
    }

  }

  function updateScore() {
    var scoreText = document.getElementById("score");
    scoreText.innerHTML = player[aliveBestPlayerIndex].score;
  }

  function updateGen(generation){
    var genText = document.getElementById("generation");
    genText.innerHTML = "Generation: " + generation;
  }


  function gameOver() {
      setTimeout(function(){reset();},100);
      generation++;
      aliveBestPlayerIndex = 0;
  }

//-------------------------------------------------------  FUNCTION UPDATE -------------------------------------------------------------

  alive = total;
  function update() {
    maxScore = 0;
    deadCount = 0;
    last = 0;
    paintCanvas();
    platformCalc();
    springCalc();
    base.draw();

    for (var i = 0; i<alive; i++){
      player[i].lasers[0] = new Laser("down",player[i].x + 30 , player[i].y+170);
      player[i].lasers[1] = new Laser("down-left",player[i].x + 190, player[i].y + 150);
      player[i].lasers[2] = new Laser("down-right",player[i].x + 190, player[i].y+150);
      player[i].lasers[3] = new Laser("right",player.x + 220, player.y+15);
      player[i].lasers[4] = new Laser("left",player.x - 170 , player.y+15);
    
      if (player[i].score > maxScore) {
        maxScore = player[i].score;
        aliveBestPlayerIndex = i;
      }

      if (player[i].isDead == true){
        alive-=1;
      }

      if (alive == 0){
        player = [];
        gameOver();
      } else {
      
        for (var j = 0; j<5; j++){
            player[i].platform_distance[i] = player[i].lasers[j].draw(platforms, player[i].x,player[i].y);
            player[i].think();
            playerCalc(i);
        }
        player[i].draw();
        updateScore();
        updateGen(generation);

        for (var k = 0; k<player[i].lastBounced.length; k++){
          if (k==0){
            last = player[i].lastBounced[0];
          }
          if (player[i].lastBounced[k] != last){
            player[i].lastBounced = [];
          } else if (player[i].lastBounced[k] == last && k == player[i].lastBounced.length-1 && k>20){
            gameOver();
          }
        }


      }
    }
  }

  menuLoop = function(){return;};
  animloop = function() {
    update();
    requestAnimFrame(animloop);
  };

  animloop();
  hideMenu();
  showScore();
}

function reset() {
  showScore();

  ng = nextGeneration(player, allPlayers);
  player = ng[0];
  allPlayers.push(ng[1]);
  aliveBestPlayerIndex = 0;
  
  flag = 0;
  position = 0;
  alive = total;
  base = new Base();
  Spring = new spring();
  platform_broken_substitute = new Platform_broken_substitute();

  platforms = [];
  for (var i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }
}

//Hides the menu
function hideMenu() {
  var menu = document.getElementById("mainMenu");
  menu.style.zIndex = -1;
}

//Show ScoreBoard
function showScore() {
  var menu = document.getElementById("scoreBoard");
  menu.style.zIndex = 1;
}

//Hide ScoreBoard
function hideScore() {
  var menu = document.getElementById("scoreBoard");
  menu.style.zIndex = -1;
}

function playerJump(i) {
  player[i].y += player[i].vy;
  player[i].vy += gravity;

  if (player[i].vy > 0 && 
    (player[i].x + 15 < 260) && 
    (player[i].x + player[i].width - 15 > 155) && 
    (player[i].y + player[i].height > 475) && 
    (player[i].y + player[i].height < 500))
    player[i].jump();

  if (dir == "left") {
    player[i].dir = "left";
    if (player[i].vy < -7 && player[i].vy > -15) player[i].dir = "left_land";
  } else if (dir == "right") {
    player[i].dir = "right";
    if (player[i].vy < -7 && player[i].vy > -15) player[i].dir = "right_land";
  }


  //Jump the player when it hits the base
  if ((player[i].y + player[i].height) > base.y && base.y < height) {
    player[i].jump();
    player[i].lastBounced.push(base.y);
  }

  //Make the player move through walls
  if (player[i].x > width) player[i].x = 0 - player[i].width;
  else if (player[i].x < 0 - player[i].width) player[i].x = width;

}

function update() {
  ctx.clearRect(0, 0, width, height);
  for (var i = 0; i<total;i++){
    playerJump(i);
  }
}   

menuLoop = function() {
  update();
  requestAnimFrame(menuLoop);
};

menuLoop();