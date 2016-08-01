/*
* Definindo variáveis
*/

// Modo de depuração
var debugmode = false;

// Objeto para congelar os estados
var states = Object.freeze ({
    SplashScreen: 0,
    GameScreen: 1,
    ScoreScreen: 2
});

// Variáveis de ambiente
var gravity = 0.25;
var velocity = 0;
var position = 180; // Posição inicial
var rotation = 0;
var jump = -4.6; // Altura do pulo

var currentscore; // Armazena o score obtido
var score = 0; // Pontuação obtida
var highscore = 0; // Pontuação máxima obtida

var pipeHeight = 90;
var pipeWidth = 52;
var pipes = new Array();

var replayClickable = false;

var loopGameloop;
var loopPipeloop;

// Sons
var volume = 30;
var soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg");
var soundScore = new buzz.sound("assets/sounds/sfx_point.ogg");
var soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg");
var soundDie = new buzz.sound("assets/sounds/sfx_die.ogg");
var soundSwoosh = new buzz.sound("assets/sounds/sfx_swoshing.ogg");
buzz.all().setVolume(volume);

/*
* DEFININDO AS FUNÇÕES
*/

$(document).ready(function() {
    if(window.location.search == "?debug") debugmode = true;
    if(window.location.search == "?easy") pipeHeight = 200;

    var savedScore = getCookie("highscore");
    if(savedScore != "") highscore = parseInt(savedScore);

    showSplash();
});

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if(c.indexOf(name)==0) return c.substring(name.length, c.length);
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime()+(exdays*24*60*60*1000));
    var expires = "expires"+d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires;
}

function showSplash() {
    currentState = states.SplashScreen;

    velocity = 0;
    position = 100;
    rotation = 0;
    score = 0;

    // Resetar as posições do player para o novo jogo
    $("#player").css({ y:0, x:0 });
    updatePlayer( $("#player") );
    soundSwoosh.stop();
    soundSwoosh.play();

    // Limpar todos os canos
    $(".pipe").remove();
    pipes = new Array();

    // Começar todas as animações dos sprites novamente
    $(".animated").css('animation-play-state', 'running');
    $(".animated").css('-webkit-animation-play-state', 'running');

    $("#splash").transition({ opacity:1}, 2000, 'ease');
}

function startGame() {
    currentState = state.GameScreen;

    $("#splash").stop();
    $("#splash").transition({ opacity:0 }, 500, 'ease');

    setBigScore();

    if(debugmode) {
        $(".boudingbox").show();
    }

    var updateRate = 1000.0 / 60.0; //60 fps
    loopGameloop = setInterval(gameLoop, updateRate);
    loopPipeloop = setInterval(updatePipes, 1400);

    playerJump();
}

function updatePlayer(player) {
    rotation = Math.min((velocity/10) * 90, 90);
    $(player).css({ rotate: rotation, top: position });
}

function gameLoop() {
    var player = $("#player");

    // Upar a posição e a velocidade do player
    velocity += gravity;
    position += velocity;

    updatePlayer(player);

    // Criar o hack de boudingbox para o player
    var box = document.getElementById('player').getboudingClientRect();
    var origwidth = 34.0;
    var origheight = 24.0;

    var boxwidth = origwidth - (Math.sin(Math.abs(rotation)/90) * 8);
    var boxheight = (origheight + box.height) / 2;
    var boxleft = ((box.width - boxwidth) / 2) + box.left;
    var boxtop = ((box.height - boxheight) / 2) + box.top;
    var boxright = boxleft + boxwidth;
    var boxbottom = boxtop + boxheight;

    if(box.bottom >= $("#footer-game").offset().top) {
        playerDead();
        return;
    }

    // Se tentar passar do topo, zera a posição do player
    var ceiling = $("#ceiling");
    if(boxtop <= (ceiling.offset().top + ceiling.height()))
        position = 0;

    // Se não houver nenhum cano no jogo, ele retorna
    if(pipes[0] == null)
        return;

    var nextpipe = pipes[0];
    var nextpipeupper = nextpipe.children('.pipe_upper');

    var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
    var pipeleft = nextpipeupper.offset().left - 2;
    var piperight = pipeleft + pipeWidth;
    var pipebottom = pipetop + pipeHeight;

    // Se cair no cano
    if(boxright > pipeleft) {
        if(boxtop > pipetop && boxbottom < pipebottom) {
            // Dentro do cano
        } else {
            playerDead();
            return;
        }
    }

    // Passou do cano
    if(boxleft > piperight) {
        pipes.splice(0,1);
        playerScore();
    }
}

$(document).keydown(function(e){
    if(e.keyCode == 32) {
        // Pode usar o Space para sair da página de replay
        if(currentscore == states.ScoreScreen)
            $("#replay").click();
        else
            screenClick();
    }
});

//Usar o mouse ou teclado para começar
if("ontouchstart" in window)
    $(document).on("touchstart", screenClick);
else
    $(document).on("mousedown", screenClick);

function screenClick() {
    if(currentState == states.GameScreen) {
        playerJump();
    } else if(currentState == states.SplashScreen) {
        startGame();
    }
}

function playerJump() {
    velocity = jump;
    soundJump.stop();
    soundJump.play();
}

function setBigScore(erase) {
    var elemscore = $("#bigscore");
    elemscore.empty();

    if(erase)
        return;

    var digits = score.toString().split('');
    for(var i=0; i<digits.length; i++){
        elemscore.append('<img src="assets/font_big_'+digits[i]+'.png" alt="'+digits[i]+'" />');
    }
}
