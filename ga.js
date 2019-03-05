function nextGeneration(maxScore, player) {
    return pickOne(player);
}

function pickOne(player) {
    var num = player.gen;
    num+=1;
    return new Player(player.brain,num);
}
