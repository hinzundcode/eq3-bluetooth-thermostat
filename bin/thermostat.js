#!/usr/bin/env node
"use strict";
const { getStatus, setTargetTemperature, setBoost } = require("../dist/thermostat.js");
const { getBluetoothDevice } = require("webbluetooth-bluez");
const dbus = require("dbus");

const commands = {
	"get-status": device => getStatus(device),
	"enable-boost": device => setBoost(device, true),
	"disable-boost": device => setBoost(device, false),
	"on": device => setTargetTemperature(device, 30),
	"off": device => setTargetTemperature(device, 4.5),
	"set-temperature": device => {
		let temperature = parseFloat(process.argv[4]);
		
		if (temperature < 4.5 || temperature > 30)
			throw new Error("target temperature has to be between 4.5 and 30.0 in 0.5 steps");
		
		return setTargetTemperature(device, temperature);
	},
};

(async () => {
	let address = process.argv[2];
	let command = process.argv[3];
	if (!address || !command || typeof commands[command] != "function") {
		console.error("Usage: eq3-thermostat <device address> get-status");
		console.error("                                       set-temperature <temperature>");
		console.error("                                       enable-boost");
		console.error("                                       disable-boost");
		console.error("                                       on");
		console.error("                                       off");
		process.exit(1);
	}
	
	let bus = dbus.getBus("system");
	let device = await getBluetoothDevice(bus, address);
	
	try {
		let status = await commands[command](device);
		console.log(status);
	} catch (e) {
		console.error(e);
	}
	
	bus.disconnect();
})();
