"use strict";

export const serviceUuid = "3e135142-654f-9090-134a-a6ff5bb77046";
const writeUuid = "3fa4585a-ce4a-3bad-db4b-b8df8179ea09";
const notificationUuid = "d0e8434d-cd29-0996-af41-6c90f4e0eb2a";

function addListener(target, name, listener) {
	if ("addListener" in target) target.addListener(name, listener);
	else if ("addEventListener" in target) target.addEventListener(name, listener);
	else throw new Error("can't add event listener");
}

function removeListener(target, name, listener) {
	if ("removeListener" in target) target.removeListener(name, listener);
	else if ("removeEventListener" in target) target.removeEventListener(name, listener);
	else throw new Error("can't remove event listener");
}

function isBitSet(value, bit) {
	return (value & bit) == bit;
}

function parseStatus(data) {
	return {
		status: {
			manual: isBitSet(data.getUint8(2), 1),
			holiday: isBitSet(data.getUint8(2), 2),
			boost: isBitSet(data.getUint8(2), 4),
			dst: isBitSet(data.getUint8(2), 8),
			openWindow: isBitSet(data.getUint8(2), 16),
			lowBattery: isBitSet(data.getUint8(2), 128),
		},
		valvePosition: data.getUint8(3),
		targetTemperature: data.getUint8(5) / 2,
	};
}

export async function request(device, payload) {
	let server = await device.gatt.connect();
	let service = await server.getPrimaryService(serviceUuid);
	
	let writes = await service.getCharacteristic(writeUuid);
	let notifications = await service.getCharacteristic(notificationUuid);
	
	await notifications.startNotifications();
	
	let response = await new Promise(resolve => {
		let listener = e => {
			removeListener(notifications, "characteristicvaluechanged", listener);
			resolve(parseStatus(e.target.value));
		};
		
		addListener(notifications, "characteristicvaluechanged", listener);
		
		writes.writeValue(payload).catch(e => {
			removeListener(notifications, "characteristicvaluechanged", listener);
			reject(e);
		});
	});
	
	await notifications.stopNotifications();
	
	await server.disconnect();
	
	return response;
}

export async function getStatus(device) {
	let now = new Date();
	return await request(device, new Uint8Array([
		0x03,
		now.getFullYear() % 100,
		now.getMonth() + 1,
		now.getDate(),
		now.getHours(),
		now.getMinutes(),
		now.getSeconds(),
	]).buffer);
}

export async function setTargetTemperature(device, temperature) {
	return await request(device, new Uint8Array([
		0x41,
		Math.round(temperature*2),
	]).buffer);
}

export async function setBoost(device, enabled) {
	return await request(device, new Uint8Array([
		0x45,
		enabled ? 0x01 : 0x00,
	]).buffer);
}
