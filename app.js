 const board=document.getElementById("board");
const info=document.getElementById("info");


let selected=null;

let currentTurn="white";

let gameType="";

let mode="";



let chess=[

["♜","♞","♝","♛","♚","♝","♞","♜"],
["♟","♟","♟","♟","♟","♟","♟","♟"],
["","","","","","","",""],
["","","","","","","",""],
["","","","","","","",""],
["","","","","","","",""],
["♙","♙","♙","♙","♙","♙","♙","♙"],
["♖","♘","♗","♕","♔","♗","♘","♖"]

];




let checkers=[

["⚫","","⚫","","⚫","","⚫",""],
["","⚫","","⚫","","⚫","","⚫"],
["⚫","","⚫","","⚫","","⚫",""],
["","","","","","","",""],
["","","","","","","",""],
["⚪","","⚪","","⚪","","⚪",""],
["","⚪","","⚪","","⚪","","⚪"],
["⚪","","⚪","","⚪","","⚪",""]

];



let boardData=[];



function selectGame(type){


gameType=type;


boardData =
type==="chess"
?
JSON.parse(JSON.stringify(chess))
:
JSON.parse(JSON.stringify(checkers));



document.getElementById("modes")
.classList.remove("hide");


draw();


}



function startGame(type){


mode=type;


info.innerHTML =
gameType+
" | "+
mode+
" | White ⚪ vs Black ⚫";


if(mode==="AI vs AI"){


setInterval(aiMove,1500);


}



}





function draw(){


board.innerHTML="";


for(let r=0;r<8;r++){


for(let c=0;c<8;c++){


let box=document.createElement("div");


box.className=
(r+c)%2===0
?
"box light"
:
"box dark";



let piece=boardData[r][c];


box.innerHTML=piece;



if("♟♜♞♝♛♚⚫".includes(piece))
{

box.style.color="black";

}



if("♙♖♘♗♕♔⚪".includes(piece))
{

box.style.color="white";

}



box.onclick=()=>move(r,c);



board.appendChild(box);


}

}


}




function move(r,c){


let piece=boardData[r][c];



if(selected===null){


if(piece!==""){


if(
(currentTurn==="white" && isWhite(piece))
||
(currentTurn==="black" && isBlack(piece))
)
{


selected=[r,c];


}


}


}



else{


let oldR=selected[0];

let oldC=selected[1];


boardData[r][c]=boardData[oldR][oldC];

boardData[oldR][oldC]="";



currentTurn =
currentTurn==="white"
?
"black"
:
"white";



selected=null;


draw();


}



}




function isWhite(p){

return "♙♖♘♗♕♔⚪".includes(p);

}



function isBlack(p){

return "♟♜♞♝♛♚⚫".includes(p);

}




function aiMove(){


let pieces=[];


for(let r=0;r<8;r++){


for(let c=0;c<8;c++){


let p=boardData[r][c];


if(
(currentTurn==="white" && isWhite(p))
||
(currentTurn==="black" && isBlack(p))
)
{

pieces.push([r,c]);

}


}


}



if(pieces.length===0)
return;



let move =
pieces[Math.floor(Math.random()*pieces.length)];



let r=move[0];

let c=move[1];



let next =
currentTurn==="white"
?
r-1
:
r+1;



if(next>=0 && next<8)
{


boardData[next][c]=boardData[r][c];

boardData[r][c]="";


}



currentTurn =
currentTurn==="white"
?
"black"
:
"white";



draw();


}