/*
FUNÇÃO ANONIMA é executada automaticamente assim que o doc html for 
carregado e assim mantera todas as variaveis locais por fim evitando
conflitos de memoria
*/
(function(){

    //Criando o canvas
    var cnv = document.querySelector("canvas");
    var ctx = cnv.getContext("2d");

    //Tamanho do canvas
    var WIDTH = cnv.width, HEIGHT = cnv.height; 

    //Defindo teclas do teclado
    var left = 37, up = 38, right = 39, down = 40;

    //detectando se o persona esta se locomovendo
    var mvLeft = mvUp = mvRight = mvDown = false;

    //Zoom Out, Zoom In da tela
    var tileSize = 64;

    var walls = [];

    var player = {
        x: tileSize + 2,
        y: tileSize + 2,
        width: 28,
        height: 28,
        speed: 6
    };
/*=================================================*/

//Esta matrix sera usada para desenhar o labirinto na tela
    var maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		[1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
		[1,1,1,0,1,1,1,0,0,1,0,0,0,1,0,0,0,0,0,1],
		[1,0,0,0,0,0,1,0,1,1,1,1,1,1,0,1,1,1,1,1],
		[1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,0,1],
		[1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1],
		[1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
		[1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1],
		[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,0,0,1,0,0,1,1,1,0,1,1,1,1,1,0,1,1,1,1],
		[1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
		[1,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
		[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    var T_WIDTH = maze[0].length * tileSize,
        T_HEIGHT = maze.length * tileSize;

    //======================================================//

    //Estrutura que servira para preencher essa estrutura com elementos que o persona ira colidir
    for( var row in maze ) {
        
        //Para cada indice j dentro do elemento maze referenciando ao indice i
        //Para cada linhado array sera adquirido cada um dos indices das colunas
        for ( var column in maze[row] ){

            var tile = maze[row][column];

            //identificação e criação do objeto muro
            if(tile === 1){

                 var wall = {

                    //Sera multiplicado o tamanho do bloco pela coluna
                    x: tileSize*column,
                    y: tileSize*row,
                    width: tileSize,
                    height: tileSize
               };

               //Fara a incerção do objeto dentro do array
               walls.push(wall);

            }
        }       
    }

    //======================================================//
    //CAMERA
    var cam = {
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        //4 metodos para estabelecer os limites dentro dos quais o persona pode se locomover sem mexer a camera
        innerLeftBoundary: function(){
            //Retornará o que é o limite a esquerda ate onde o personagem pode se deslocar sem interagir com a posição da camera
            return this.x + (this.width*0.25);//ate 25% da largura total da camera a esquerda podera se deslocar sem interfiri na posição da camera
        },
        innerTopBoundary: function(){
            return this.y + (this.height*0.25);
        },
        innerRightBoundary: function(){
            return this.x + (this.width*0.75);
        },
        innerBottomBoundary: function(){
            return this.y + (this.height*0.75);
        }
    };
    

    //======================================================//

    //função que verifica as colisões e ajusta a posição do personagem bloqueando-o 
    function blockRectangle(objA,objB){
      //Var para armazenar a distancia entre o centro dos objetos
      var  distX = ( objA.x + objA.width/2 ) - ( objB.x + objB.width/2 );//Vai armaz. a distancia entre os obj no eixo X
      var  distY = ( objA.y + objA.height/2 ) - ( objB.y + objB.height/2 );

      //O valor da soma das metades da larg. e altu. dos objetos
      var sumWidth = ( objA.width + objB.width )/2;
      var sumHeight = ( objA.height + objB.height )/2;

      //Verificação se ha colição
      /*
        LOGICA: se o valor absoluto da distancia entre os objetos em determinado 
        eixo se é menor que a soma das larguras ou da soma das alturas deacordo com o eixo q se esta verificando
      */
      //Se isso for verdade se teve uma situação de colisão
      if( Math.abs(distX) < sumWidth && Math.abs(distY) < sumHeight ){
        
            /*Bloqueio do obj A == quanto o objA invadiu o espaço/area do objB 
            pegando os pixels e ajustando na posição dele(objA) assim voltando 
            a quantidade de pixeus que foram invadidos dando a visão de bloqueio 
            */ 
            var overlapX = sumWidth - Math.abs(distX);
            var overlapY = sumHeight - Math.abs(distY);
            
            //Determina onde foi a colisão
            /*
                Se o valor de sobre posição do eixo X for maior que o verlap Y.
                Provavelmente obj. ja estava invadindo a area do outro no eixo X. E
                agora como ja houve colisão a invasão do eixo Y acabou de ocorrer entao 
                quer dizer que o valor de sobre posição do eixo y ele é menor
                do que o valor de sobre posição no eixo X / A colisão aconteceu no eixo
                 Y de cima para baixo ou de baixo para cima. 
            */
            if(overlapX > overlapY){
                /*Determina que se valor do persona. for maior que o valor em y
                 do muro se tera que fezer um ajuste no valor do persona. referente ao eixo y,
                 aumentando esse valor em funçao da quantidade q houve a sobreposiçao do persona.
                 em função do muro == O persona. envadiu o espaço de 2 pixels do muro e com isso sera 
                 feito uma soma ou subtração de dois pixels
                */ 
                objA.y = distY > 0 ? objA.y + overlapY : objA.y - overlapY;
            } else{
                objA.x = distX > 0 ? objA.x + overlapX : objA.x - overlapX;
            }
        }
    }

 //======================================================//

    //Evente Listener == informa ao sistema que ele tera que ficar atento a entrada de dados do user
    window.addEventListener("keydown",teclaBaixa, false);
    window.addEventListener("keyup", teclaAlta, false);

 //======================================================//

    function teclaBaixa(event){        //Essa função vai receber informaçoes refernete ao evento que a desparou
        var key = event.keyCode;       //Armazena o codigo da tecla procionada
        
        switch(key){                   //Confere qual o valor da var key
            case left:
                mvLeft = true;
                break;                 // Usado para parar de executar essa estrutura de avaliação do valor da variavel
            case up:
                mvUp = true;
                break;
            case right:
                mvRight = true;
                break;
            case down:
                mvDown = true;
                break;
        }
    }

     //======================================================//

    function teclaAlta(event){        
        var key = event.keyCode;        
        
        switch(key){                   
            case left:
                mvLeft = false;
                break; 
            case up:
                mvUp = false;
                break;
            case right:
                mvRight = false;
                break;
            case down:
                mvDown = false;
                break;
        }
    }

 //======================================================//

     /*Usado para atualizar os elementos do jogo
            Atualiza a posição do persona na tela
     */
    function update(){

        /*
        Fazer a verificação do estado dessas variaveis para atribuir
        movimento ao persona em função do estado dessas variaveis
        */
        if(mvLeft && !mvRight){
            player.x -= player.speed;
        } else
        if(mvRight && !mvLeft){
            player.x += player.speed;
        }
        if(mvUp && !mvDown){
            player.y -= player.speed;
        }else
        if(mvDown && !mvUp){
            player.y += player.speed;
        }

     //======================================================//

        //Assim que o persona for movido sera feito um checkout pra ver se o mesmo colidio com um desse muros ou não.
        for( var i in walls ){
            var wall = walls[i];//Vai pegar um muro de cada vez e checará se ele colide com o persona
            blockRectangle(player,wall);//Função que faz a verificação
        }

     //======================================================//

     //Fazendo a deslocação da camera de acordo com  persona.

      //Se a posição do jogaodr em X for menor do que o limite sequerdo da camera 
     if(player.x < cam.innerLeftBoundary()){
         cam.x = player.x - (cam.width*0.25);
     }
     if(player.y < cam.innerTopBoundary()){
         cam.y = player.y - (cam.height*0.25);
     }
     if(player.x + player.width > cam.innerRightBoundary()){
         cam.x = player.x + player.width - (cam.width*0.75);
     }
     if(player.y + player.height > cam.innerBottomBoundary()){
         cam.y = player.y + player.height - (cam.height*0.75);
     }

    //Define que a cam não pasara da borda da propria tela
     cam.x = Math.max(0,Math.min(T_WIDTH - cam.width, cam.x));
     cam.y = Math.max(0,Math.min(T_HEIGHT - cam.height, cam.y));
    }
      //======================================================//

    /*Usado para desenhar os elementos na tela*/
    function render(){
        
        //Limpa o canvas
        ctx.clearRect(0,0,WIDTH,HEIGHT);

        //Salva o estado do contexto na memoria  
        ctx.save();

        //================//
        /*
            sera feito o ajuste para deslocar o contexto de renderização 
            em proporção inversa ao deslocamento da camera, exemplificando 
            que se a camera se deslocol para a direita para se ter aquela area 
            que esta sendo coberta pela camera exibida na tela tera que ser ajustado
            na tela o contexto de render na mesma proporção para a esquerda 
        */
        ctx.translate(-cam.x,-cam.y);

        //================//
        
        //Para cada indice dentro do maze sera feito uma nova varredura
        for( var row in maze ) {
            
            //Para cada indice j dentro do elemento maze referenciando ao indice i
            //Para cada linhado array sera adquirido cada um dos indices das colunas
            for ( var column in maze[row] ){

                var tile = maze[row][column];

                //verificando se o valor desse tile é igual a 1  
                if(tile === 1){

                    var x = column*tileSize;
                    var y = row*tileSize;

                    ctx.fillRect(x,y,tileSize,tileSize);

                }
            }       
        }

        //-------------
        ctx.fillStyle = "orange";
        ctx.fillRect(player.x,player.y,player.width,player.height);

        //Restaura o estado do contexto ao que foi salvo anteriormente
        ctx.restore();
    }


     //======================================================//

    /*
    Usado para repetir as açoes indefinidamente
    Chamada de função recursiva
    */
    function loop(){
        update();
        render();
        requestAnimationFrame(loop, cnv);
    }

     //======================================================//

    /*
    Responsavel pela primeira chamada da função loop e apos isso ela
    fica encarregada de chamar a si propria
    */
    requestAnimationFrame(loop, cnv);   
}());
