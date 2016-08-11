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
    return "";
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
    currentState = states.GameScreen;

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
    var box = document.getElementById('player').getBoundingClientRect();
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

    //Determina a área para os próximos canos
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

//Setar o BigScore
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

//Setar o CurrentScore
function setSmallScore() {
    var elemscore = $("#currentscore");
    elemscore.empty();

    var digits = score.toString().split('');
    for(var i=0; i<digits.length; i++){
        elemscore.append('<img src="assets/font_small_'+digits[i]+'.png" alt="'+digits[i]+'" />');
    }
}

//Setar o HighScore
function setHighScore() {
    var elemscore = $("#highscore");
    elemscore.empty();

    var digits = highscore.toString().split('');
    for(var i=0; i<digits.length; i++){
        elemscore.append('<img src="assets/font_small_'+digits[i]+'.png" alt="'+digits[i]+'" />');
    }
}

//Setar a Medalha
function setMedal() {
    var elemmedal = $("#medal");
    elemmedal.empty();

    if(score < 10)
        return false;

    if(score >= 10)
        medal = 'bronze';

    if(score >= 20)
        medal = 'silver';

    if(score >= 30)
        medal = 'gold';

    if(score >= 40)
        medal = 'platinum';

        elemmedal.append('<img src="assets/medal_'+medal+'.png" alt="'+medal+'" />');

        return true;
}

//Função para quando o player morrer
function playerDead() {
    //Pausa todas as animações
    $(".animated").css('animation-play-state','paused');
    $(".animated").css('-webkit-animation-play-state','paused');

    //Dropar o Bird do footer
    var playerbottom = $("#player").position().top + $("#player").width();
    var floor = $("#flyarea-game").height();
    var movey = Math.max(0, floor - playerbottom);
    $("#player").transition({ y:movey+'px', rotate:90 }, 1000, 'easeInOutCubic');

    currentState = states.ScoreScreen;

    //Destroi todos os gameloops
    clearInterval(loopGameloop);
    clearInterval(loopPipeloop);
    loopGameloop = null;
    loopPipeloop = null;

    //Mobile browsers não suportam buzz bindOnce event
    if(isIncompatible.any()) {
        //mostra o score
        showScore();
    } else {
        //Começa o hit sound e depois o som de morte e depois mostra o score
        soundHit.play().bindOnce("ended", function() {
            soundDie.play().bindOnce("ended", function() {
                showScore();
            });
        });
    }
}

//Função para mostrar o Score final
function showScore() {
    //mostra o quadro de score
    $("#scoreboard").css('display', 'block');

    //Remove o bigScore da Tela
    setBigScore(true);

    //Se o score obtido for maior que o atual
    if(score > highscore) {
        //Salva o Score
        highscore = score;
        setCookie("highscore", highscore, 999);
    }

    //Muda o quadro de score
    setSmallScore();
    setHighScore();
    var wonmedal = setMedal();

    //Som de Swoosh
    soundSwoosh.stop();
    soundSwoosh.play();

    //Mostra o quadro de Score
    $("#scoreboard").css({ y: '40px', opacity:0 });
    $("#replay").css({ y: '40px', opacity:0 });
    $("#scoreboard").transition({ y: '40px', opacity:1 }, 600, 'ease', function() {
        //Quando a animação terminar, começa o Swoosh
        soundSwoosh.stop();
        soundSwoosh.play();
        $("#replay").transition({ y: '0px', opacity:1 }, 600, 'ease');

        if(wonmedal) {
            $("#medal").css({ scale: 2, opacity: 0});
            $("#medal").css({ opacity: 1, scale: 1 }, 1200, 'ease');
        }
    });

    //Deixa o botão de replay com clique
    replayClickable = true;
}

$("#replay").click(function() {
    //Ação de replay com clique
    if(!replayClickable)
        return;
    else
        replayClickable = false;

    soundSwoosh.stop();
    soundSwoosh.play();

    $("#scoreboard").transition({ y: '-40px', opacity:1 }, 1000, 'ease', function() {
        //esconde o quadro do Score
        $("#scoreboard").css("display", "none");

        //Começa o game over e mostra a splash screen
        showSplash();
    });
});

//Função para armazenar a pontuação do jogador
function playerScore() {
    score += 1;
    soundScore.stop();
    soundScore.play();
    setBigScore();
}

//Função para ir mostrando e mudar os canos
function updatePipes() {
    //existe algum cano para remover?
    $(".pipe").filter(function() {
        return $(this).position().left <= -100;
    }).remove();

    //Add um novo cano
    var padding = 80;
    var constraint = 420 - pipeHeight - (padding * 2);
    var topheight = Math.floor((Math.random()*constraint) + padding);
    var bottomheight = (420 - pipeHeight) - topheight;
    var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height:'+topheight+'px;"></div><div class="pipe_lower" style="height:'+bottomheight+'px;"></div></div>');
    $("#flyarea-game").append(newpipe);
    pipes.push(newpipe);
}

// Definindo o suporte dos navegadores para o event Buzz definido anteriormente
   var isIncompatible = {
         Android: function() {
         return navigator.userAgent.match(/Android/i);
         },
         BlackBerry: function() {
         return navigator.userAgent.match(/BlackBerry/i);
         },
         iOS: function() {
         return navigator.userAgent.match(/iPhone|iPad|iPod/i);
         },
         Opera: function() {
         return navigator.userAgent.match(/Opera Mini/i);
         },
         Safari: function() {
         return (navigator.userAgent.match(/OS X.*Safari/) && ! navigator.userAgent.match(/Chrome/));
         },
         Windows: function() {
         return navigator.userAgent.match(/IEMobile/i);
         },
         any: function() {
         return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
         }
};
