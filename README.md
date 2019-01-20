# eq3-bluetooth-thermostat

Use this library to control your "equiva Bluetooth Smart" or "eQ-3 Bluetooth Smart" radiator thermostats with javascript.
Works both in the Browser (with Web Bluetooth) and with Node.js (using Bluez, linux only).

At the moment only manual mode is supported, no timers or vacation mode.

Based on the great API write-up in [Heckie75/eQ-3-radiator-thermostat](https://github.com/Heckie75/eQ-3-radiator-thermostat).

## nodejs library usage

requires a modern Bluez version with BLE support

setup:

```
$ npm i eq3-bluetooth-thermostat webbluetooth-bluez
```

minimal example:

```javascript
const { getStatus } = require("eq3-bluetooth-thermostat");
const { getBluetoothDevice } = require("webbluetooth-bluez");
const dbus = require("dbus");

(async () => {
	let bus = dbus.getBus("system");
	let device = await getBluetoothDevice(bus, address);
	console.log(await getStatus(device));
	bus.disconnect();
})();
```

## web usage

```javascript
import { serviceUuid, getStatus } from "node_modules/eq3-bluetooth-thermostat/src/thermostat.js";

// ...

let device = await navigator.bluetooth.requestDevice({
	filters: [ { name: "CC-RT-BLE" } ],
	optionalServices: [ serviceUuid ],
});

console.log(await getStatus(device));
```

See [examples/thermostat.html](https://github.com/hinzundcode/eq3-bluetooth-thermostat/blob/master/examples/thermostat.html) for a more complete example.


## bonus: cli tool

```
$ npm i -g eq3-bluetooth-thermostat webbluetooth-bluez

$ eq3-thermostat
Usage: eq3-thermostat <device address> get-status
                                       set-temperature <temperature>
                                       enable-boost
                                       disable-boost
                                       on
                                       off

$ eq3-thermostat 01:23:45:67:89:AB get-status
{ status:
   { manual: true,
     holiday: false,
     boost: false,
     dst: true,
     openWindow: false,
     lowBattery: false },
  valvePosition: 0,
  targetTemperature: 21.5 }
```

## API

```typescript
interface Status {
	status: {
		manual: boolean;
		holiday: boolean;
		boost: boolean;
		dst: boolean;
		openWindow: boolean;
		lowBattery: boolean;
	},
	valvePosition: number;
	targetTemperature: number;
}

const serviceUuid: string = "3e135142-654f-9090-134a-a6ff5bb77046";

function getStatus(device: BluetoothDevice): Promise<Status>;
function setTargetTemperature(device: BluetoothDevice, temperature: number): Promise<Status>;
function setBoost(device: BluetoothDevice, enabled: boolean): Promise<Status>;
function request(device: BluetoohDevice, payload: ArrayBuffer): Promise<Status>;
```
