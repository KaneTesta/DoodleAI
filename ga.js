function nextGeneration(maxScore, player) {
    return pickOne(maxScore, player);
}

function pickOne() {
    gen1 = player.gen;
    newPlayer = new Player(player.brain);
    newPlayer.gen = gen1+1;
    return newPlayer;
}
