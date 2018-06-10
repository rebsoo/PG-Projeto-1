/*
PROJETO DE PROCESSAMENTO GRAFICO 2018.1
Rebeca Oliveira Silva (ros4)
M B M X 
*/

function resizeCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
}

function resizeToFit() {
    var width = parseFloat(window.getComputedStyle(canvas).width);
    var height = parseFloat(window.getComputedStyle(canvas).height);
    resizeCanvas(width, height);
}

var canvas = document.getElementById('canvasROS4');

var forma = canvas.getContext('2d');

resizeToFit();

var linhasCon = []; // array que guarda as linhas que ligam os pontos 'd'
var pontosCon = []; // array que guarda os pontos D colocados pelo usuario
var pontosS = []; // array que guarda os pontos B
var pontosS1 = []; // array para a curva fechada
var linhasS = []; // array que guarda as linhas da spline
var pontosCas = []; // array que guarda os pontos de casteljau
var linhasCas = []; // linhas da curva de bezier
var parametros = []; // array que guarda os parametros
var delta = []; // array de deltas dos parametros
var grau = 3; // o grau da b-spline (cubica)
var seg = 0; // a quantidade de segmentos
var T = 0; // numero de avalicoes escolhida pelo usuario
var pegouT = false; // booleano para saber se o valor de T ja foi enviado pelo usuario

// FUNCOES DE DESENHO --------------------------------------------------------

function limpar() { // limpa o canvas pelo botao "clean" e reinicia todas as variaveis
	forma.clearRect(0,0,canvas.width,canvas.height); 
	pontosCon.length = 0; 
	linhasCon.length = 0;
	pontosS.length = 0;
	linhasS.length = 0;
	pontosCas.length = 0;
	linhasCas.length = 0;
	pontosS1.length = 0;
	delta.length = 0;
	parametros.length = 0;
	pegouT = false;
	T = 0;
}

function excluir(posicaoX, posicaoY) { // exclui um ponto D 
	var indice1;
	indice1 = isInCircle({ 
	  x: posicaoX,
	  y: posicaoY
	});
	if (indice1 > -1) {
		pontosCon.splice(indice1,1);
		if (indice1 == 0) {
			linhasCon.splice(0,1);
		}
		else if (indice1 == pontosCon.length) {
			linhasCon.splice(linhasCon.length-1,1);
		}
		else {
			linhasCon.splice(indice1-1,2);
			linhasCon.splice(indice1-1,0,[[pontosCon[indice1-1][0],pontosCon[indice1-1][1]],
		[pontosCon[indice1][0],pontosCon[indice1][1]]]); // coloca no array o ponto onde comeca a linha e onde termina
		}
		refazer();
		}
		
}

function refazer() { // refaz o desenho apos de deletar um ponto D
	forma.clearRect(0,0,canvas.width,canvas.height);
	criarControle();
	splinePontos();
	curvaS();
}

function criarControle () { // desenha o controle a partir dos pontos D colocados pelo usuario na cor roxa
	var j;
	for (j = 0; j < pontosCon.length; j++){
		forma.beginPath();
		forma.strokeStyle = 'purple';
		forma.fillStyle = 'purple';
		forma.arc(pontosCon[j][0], pontosCon[j][1], 6, 0, 2*Math.PI); // ponto
		forma.stroke();
		forma.fill();
		
	}
	
	var p;
	
	for (p = 0; p < linhasCon.length; p++){
		forma.beginPath(); 
		forma.strokeStyle = 'purple'; 
		forma.lineWidth = 4;
		forma.moveTo(linhasCon[p][0][0], linhasCon[p][0][1]); // inicio da linha
		forma.lineTo(linhasCon[p][1][0], linhasCon[p][1][1]); //final da linha
		forma.stroke(); 
		forma.fill(); 
	}
	
}

function criarPontosS () { // desenha os pontos de controle B e suas linhas na cor branca
	var j;
	for (j = 0; j < pontosS.length; j++){
		forma.beginPath();
		forma.strokeStyle = 'white';
		forma.fillStyle = 'white';
		forma.arc(pontosS[j][0], pontosS[j][1], 4, 0, 2*Math.PI); // ponto
		forma.stroke();
		forma.fill();
		
	}
	
	var p;
	
	for (p = 0; p < linhasS.length; p++){
		forma.beginPath(); 
		forma.strokeStyle = 'white'; 
		forma.lineWidth = 2;
		forma.moveTo(linhasS[p][0][0], linhasS[p][0][1]); // inicio da linha
		forma.lineTo(linhasS[p][1][0], linhasS[p][1][1]); //final da linha
		forma.stroke(); 
		forma.fill(); 
	}
	
}

function criarCurva () { // desenha a curva de bezier na cor rosa
	var p;
	
	for (p = 0; p < linhasCas.length; p++){
		forma.beginPath(); 
		forma.strokeStyle = '#FF0080'; 
		forma.lineWidth = 2;
		forma.moveTo(linhasCas[p][0][0], linhasCas[p][0][1]); // inicio da linha
		forma.lineTo(linhasCas[p][1][0], linhasCas[p][1][1]); //final da linha
		forma.stroke(); 
		forma.fill(); 
	}
	
}

// FUNCOES DOS BOTOES --------------------------------------------------------

function apenasControle() { // ONLY D
	forma.clearRect(0,0,canvas.width,canvas.height);
	criarControle();
}

function apenasSpline() { //ONLY B
	forma.clearRect(0,0,canvas.width,canvas.height);
	criarPontosS();
}

function apenasCurva() { // ONLY CURVE
	forma.clearRect(0,0,canvas.width,canvas.height);
	criarCurva();
}
function todos() { // ALL
	forma.clearRect(0,0,canvas.width,canvas.height);
	criarControle();
	criarPontosS();
	criarCurva();
}

function pegarT() { // SEND 
	var t = document.getElementById('T').value;
	t = Number(t);
	T = t;
	pegouT = true;
}

// FUNCOES DE CALCULO --------------------------------------------------------

function numSeg() { // calcula o numero de segmentos
	seg = (pontosCon.length - 3);
}

function criarParametros() { // cria os parametros de acordo a quantidade de pontos B
	var i;
	for (i = 0; i <= (seg*3); i++) {
		if (i == 0) {
			parametros.push(0);
		}
		else if (i == (seg*3)) {
			parametros.push(1);
		}
		else {
			parametros.push(i/((seg*3)+1));
		}
		
	}
	
	var p;
	for (p = 0; p <= parametros.length - 2; p++) { // cria os deltas dos parametros encontrados
		delta.push(parametros[p+1] - parametros[p]);
	}
}

function controlePontos (posicaoX, posicaoY) { // armazenamento dos pontos D colocados pelo usuario
	pontosCon.push([posicaoX,posicaoY]); // coloca no array o ponto de acordo com o clique do mouse
	if (pontosCon.length > 1) {
		linhasCon.push([[pontosCon[pontosCon.length - 2][0],pontosCon[pontosCon.length - 2][1]],
		[pontosCon[pontosCon.length - 1][0],pontosCon[pontosCon.length - 1][1]]]); // coloca no array o ponto onde comeca a linha e onde termina
		}
	numSeg(); // calculo do numero de segmentos
	criarControle();
	if (pontosCon.length > 4) { // se existirem mais de 4 pontos de controle, desenhar os pontos B
		splinePontos();
	}
}

function splinePontos () { // calcula os pontos B a partir dos pontos D
	pontosS.length = 0;
	linhasS.length = 0;
	delta.length = 0;
	parametros.length = 0;
    criarParametros();
	numSeg();
	var i;
	var k = 1;
	var r = 1;
	for (i = 0; i <= (seg*3); i++) {
		console.log(pontosS);
		if(i == 0) { // inicio do segmento
			pontosS.push([pontosCon[i][0],pontosCon[i][1]]);
		}
		else if (i == 1) {
			pontosS.push([pontosCon[i][0],pontosCon[i][1]]);
		}
		else if (i == 2) {
			pontosS.push([(((delta[1]/(delta[0]+delta[1])) * pontosCon[i-1][0]) + ((delta[0]/(delta[0]+delta[1])) * pontosCon[i][0])), // coordenada x
			(((delta[1]/(delta[0]+delta[1])) * pontosCon[i-1][1]) + ((delta[0]/(delta[0]+delta[1])) * pontosCon[i][1]))]); // coordenada y
		}
		else if (i == (seg * 3)) { // final do segmento
			pontosS.push([pontosCon[pontosCon.length - 1][0],pontosCon[pontosCon.length - 1][1]]);
		}
		else if (i == ((seg * 3)-1)) {
			pontosS.push([pontosCon[pontosCon.length - 2][0],pontosCon[pontosCon.length - 2][1]]);
		}
		else if (i == ((seg * 3)-2)) {
			pontosS.push([(((delta[seg-1]/(delta[seg-2]+delta[seg-1])) * (pontosCon[pontosCon.length - 3][0])) + 
			((delta[seg-2]/(delta[seg-2]+delta[seg-1])) * (pontosCon[pontosCon.length - 2][0]))), // coordenada x
			((delta[seg-1]/(delta[seg-2]+delta[seg-1])) * (pontosCon[pontosCon.length - 3][1]) + 
			((delta[seg-2]/(delta[seg-2]+delta[seg-1])) * (pontosCon[pontosCon.length - 2][1])))]); // coordenada y
		}
		
		else if (i == ((3 * k)+1)) { // segmento tipico 
			pontosS.push([((((delta[k]+delta[k+1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][0])) + 
			((delta[k-1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][0]))), // coordenada x
			(((delta[k]+delta[k+1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][1]) + 
			((delta[k-1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][1])))]); // coordenada y	
		}
		else if (i == ((3 * k)+2)) {
			pontosS.push([((delta[k+1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][0]) + 
			(((delta[k]+delta[k-1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][0]))), // coordenada x
			((delta[k+1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][1]) + 
			(((delta[k]+delta[k-1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][1])))]); // coordenada y
			k++;
		}
		else if (i == (r * 3)) { // juncoes
			pontosS.push([(((delta[r]/(delta[r-1]+delta[r])) * pontosS[i-1][0]) + 
			((delta[r-1]/(delta[r-1]+delta[r])) * (((((delta[k]+delta[k+1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][0])) + 
			((delta[k-1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][0])))))), // coordenada x
			(((delta[r]/(delta[r-1]+delta[r])) * pontosS[i-1][1]) + 
			((delta[r-1]/(delta[r-1]+delta[r])) * ((((delta[k]+delta[k+1])/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+1][1]) + 
			((delta[k-1]/(delta[k-1]+delta[k]+delta[k+1])) * (pontosCon[k+2][1]))))))]); // coordenada y
			r++;
		}
		
		if (pontosS.length > 1) { // se existir mais de um ponto no array cria-se uma linha
		linhasS.push([[pontosS[pontosS.length - 2][0],pontosS[pontosS.length - 2][1]], // inico da linha
		[pontosS[pontosS.length - 1][0],pontosS[pontosS.length - 1][1]]]); // fim da linha
		}
	}
	criarPontosS();
}

function casteljau (nivel,t) { // calculo de casteljau
	if (nivel.length == 0) {
		return [];
	}
	else if (nivel.length == 1) {
		return nivel[0];
	}

	else {
		var temp = [];
		var y;
		var tempX, tempY;
		for (y = 0; y < nivel.length - 1; y++) {
			tempX = nivel[y][0]+(t*(nivel[y+1][0]-nivel[y][0]));
			tempY = nivel[y][1]+(t*(nivel[y+1][1]-nivel[y][1]));
			temp.push([tempX,tempY]);
		}
		
		return casteljau(temp,t);
		
		
	}		
	
	return temp;
}
function curvaS () { // calculo dos pontos que serao utilizados para o desenho da curva por meio de casteljau
	pontosCas.length = 0;
	linhasCas.length = 0;
	if (pegouT) {
		var param;
	pontosS1 = pontosS;
	pontosS1.push(pontosS[0]); // para a curva fechada
	for (param = 0; param <= T; param++) {
		var ponto = casteljau(pontosS1,(param/T));
		pontosCas.push([ponto[0],ponto[1]]);
		if (pontosCas.length > 1) {
			linhasCas.push([[pontosCas[pontosCas.length - 2][0],pontosCas[pontosCas.length - 2][1]], // inico da linha
		[pontosCas[pontosCas.length - 1][0],pontosCas[pontosCas.length - 1][1]]]); // fim da linha
			
		}
	}
	
	criarCurva();
	}
	
	
}

// FUNCOES DO MOUSE --------------------------------------------------------

function isInCircle(click) { // verifica se esta clicando em um ponto D
	var f;
	for (f = 0; f < pontosCon.length; f++) {
		var v = {
        x: pontosCon[f][0] - click.x,
        y: pontosCon[f][1] - click.y
    };
     if (Math.sqrt(v.x * v.x + v.y * v.y) <= 5) { // se for menor que o raio dos pontos de controle que e 6
		 return f;
	 }
		
	}
	return -1;
    
}

canvas.addEventListener('click', function(e){ // cria um ponto D ao clicar com o botao esquerdo do mouse
		forma.clearRect(0,0,canvas.width,canvas.height);
		controlePontos(e.offsetX, e.offsetY);
		
}); 

canvas.addEventListener('contextmenu', function(evt){ // exclui um ponto D ao clicar com o botao direito do mouse
	excluir(evt.offsetX, evt.offsetY);
});


 
		