function nextGeneration(player, allPlayers) {
    normaliseFitness(allPlayers);
    player = generate(allPlayers);
    allPlayers = player.slice();
    return [player, allPlayers];
  }

function pickOne(player) {
    var num = player.gen;
    num+=1;
    return new Player(player.brain,num);
}


  // Generate a new population of players
function generate(oldPlayers) {
    var newPlayers = [];
    for (let i = 0; i < oldPlayers.length; i++) {
      // Select a player based on fitness
      var player = poolSelection(oldPlayers);
      newPlayers[i] = player;
    }
    return newPlayers;
  }

  // Normalize the fitness of all players
function normaliseFitness(players) {
    // Make score exponentially better?
    for (var i = 0; i < players.length; i++) {
        players[i].score = Math.pow(players[i].score, 2);
    }
  
    // Add up all the scores
    var sum = 0;
    for (var i = 0; i < players.length; i++) {
        sum += players[i].score;
    }
    // Divide by the sum
    for (var i = 0; i < players.length; i++) {
        players[i].fitness = players[i].score / sum;
    }
  }


// An algorithm for picking one player from an array
// based on fitness
function poolSelection(player) {
    // Start at 0
    let index = 0;
  
    // Pick a random number between 0 and 1
    let r = Math.random(1);
  
    // Keep subtracting probabilities until you get less than zero
    // Higher probabilities will be more likely to be fixed since they will
    // subtract a larger number towards zero
    while (r > 0) {
      r -= player[index].fitness;
      // And move on to the next
      index += 1;
    }
  
    // Go back one
    index -= 1;
  
    // Make sure it's a copy!
    // (this includes mutation)
    return player[index].copy();
  }
