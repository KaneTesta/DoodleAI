function nextGeneration(maxScore, player) {

    calculateFitness();
    return pickOne(maxScore, player);
}

function pickOne() {
    child = player;
    gen1 = child.gen;
    newPlayer = new Player(child.brain);
    newPlayer.gen = gen1+1;
    console.log(newPlayer.gen);
    newPlayer.mutate();
    console.log("mutated");
    return newPlayer;
}


function calculateFitness() {
    player.fitness = player.score/(maxScore+player.score);
}