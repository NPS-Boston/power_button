/*	POWER BUTTON
*	Does exactly what it says (if wired correctly):
*	Uses Raspberry Pi GPIO to "push" (shorting to ground by saturating a transistor) the power and/or reset headers of an ATX motherboard.
*
*	NOTE!
*	Check what voltage your power supply puts on the PS_ON pin! Dell OptiPlex PCs (in the author's case) all appear to be 3.3v which means a safe logic level with a Raspberry Pi. USE A MULTIMETER.
*	5v on PS_ON will mean using opto-couplers or something to isolate the 3.3v RPi logic pins.
*
*	USAGE:
*	init.js is intended to run as a HTTP service. Express serves a basic HTML page at "/" with two buttons:	Power and Reset. Pressing buttons will simply send a GET to "/power" or "/reset" endpoints.
*/

//PARAMETERS
const PORT = 8080;
const POWER_GPIO_BCM = 26;//BCM NUMBERING NOT PIN NUMBERING
const RESET_GPIO_BCM = 16;//BCM NUMBERING NOT PIN NUMBERING
const HOLD_TIME = 250; //Time in ms how long to hold button.
const TIMEOUT = 10 //Time in seconds to refuse another button push


//use NPM to get express.js and onoff package dependencies
var gpio = require('onoff').Gpio;
var express = require('express');
var app = express();

var POWER = new gpio(POWER_GPIO_BCM, 'low');
var RESET = new gpio(RESET_GPIO_BCM, 'low');


var readyToPush = true;


app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

//serve all the static stuff like manifest, icons, etc.
app.use(express.static(__dirname));

app.get('/power', function(req, res){
	//PUSH POWER BUTTON
	if(readyToPush)
	{
		console.log(req.ip + ": Request to push POWER button.");
		POWER.write(1,function(){
			//upon pushing (setting pin high) set timeout boolean first
			readyToPush = false;
			//set a timer from HOLD_TIME milliseconds from now to go back low
			setTimeout(function(){
				POWER.write(0,function(){
					res.status(200);
					console.log("POWER button complete.");
				});
			},HOLD_TIME);
			//lastly set another timer TIMEOUT seconds from now to reenable another push.
			setTimeout(function(){
				readyToPush = true;
			},TIMEOUT * 1000);
		});
	}
	else
	{
		console.log(req.ip + ": Request to push POWER button failed due to TIMEOUT.");
		res.status(500).send({ error: 'Too many requests. Wait at least ' + TIMEOUT + ' seconds!' })
	}
});
app.get('/reset', function(req, res){
	//PUSH RESET BUTTON
	if(readyToPush)
	{
		console.log(req.ip + ": Request to push RESET button.");
		RESET.write(1,function(){
			//upon pushing (setting pin high) set timeout boolean first
			readyToPush = false;
			//set a timer from HOLD_TIME milliseconds from now to go back low
			setTimeout(function(){
				RESET.write(0,function(){
					res.status(200);
					console.log("RESET button complete.");
				});
			},HOLD_TIME);
			//lastly set another timer TIMEOUT seconds from now to reenable another push.
			setTimeout(function(){
				readyToPush = true;
			},TIMEOUT * 1000);
		});
	}
	else
	{
		console.log(req.ip + ": Request to push RESET button failed due to TIMEOUT.");
		res.status(500).send({ error: 'Too many requests. Wait at least ' + TIMEOUT + ' seconds!' })
	}
});

app.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});