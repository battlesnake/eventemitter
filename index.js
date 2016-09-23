if (typeof require === 'undefined') {
	if (typeof module !== 'undefined') {
		module.exports = EventEmitter;
	} else if (typeof window !== 'undefined') {
		window.EventEmitter = EventEmitter;
	} else {
		throw new Error('What the hell is this environment?');
	}
} else {
	module.exports = require('even' + 'ts').EventEmitter;
}

/* Deviation from Node.js spec: only permit String, not Symbol, for event name */

EventEmitter.defaultMaxListeners = 10;

function EventEmitter() {
	const listeners = new Map();
	let maxListeners = EventEmitter.defaultMaxListeners;
	const get = (event, needed) => {
		if (!listeners.has(event)) {
			if (needed) {
				listeners.set(event, []);
			} else {
				return [];
			}
		}
		return listeners.get(event);
	};
	const set = (event, handler, method) => {
		if (typeof event !== 'string') {
			throw new Error('Event name must be a string');
		}
		if (typeof handler !== 'function') {
			throw new Error('Event handler must be a function');
		}
		const list = get(event, true);
		if (list.length >= maxListeners) {
			console.warning(`Too many listeners for event ${event}`);
			return this;
		}
		this.emit('newListener', event, handler);
		list[method](handler);
		return this;
	};
	const append = (event, handler) => set(event, handler, 'push');
	const prepend = (event, handler) => set(event, handler, 'unshift');
	const unset = (event, handler) => {
		if (typeof event !== 'string') {
			throw new Error('Event name must be a string');
		}
		if (typeof handler !== 'function') {
			throw new Error('Event handler must be a function');
		}
		const list = get(event, false);
		if (!list) {
			return this;
		}
		const idx = list.indexOf(handler);
		if (idx === -1) {
			return this;
		}
		list.splice(idx, 1);
		if (list.length === 0) {
			listeners.delete(event);
		}
		this.emit('removeListener', event, handler);
		return this;
	};
	const blitz = event => {
		if (typeof event !== 'string') {
			throw new Error('Event name must be a string');
		}
		const list = get(event, false);
		listeners.delete(event);
		if (list) {
			list.forEach(handler => this.emit('removeListener', event, handler));
		}
		return this;
	};
	const trigger = (event, ...args) => {
		const list = get(event, false);
		if (!list) {
			if (event === 'error') {
				throw args[0] || new Error('Unknown error');
			}
			return false;
		}
		[...list].forEach(handler => handler(event, ...args));
		return true;
	};
	const getCount = event => {
		const list = get(event, false);
		return list ? list.length : 0;
	};
	const once = (eventName, listener) => {
		const handler = (...args) => {
			unset(eventName, handler);
			return listener(...args);
		};
		return handler;
	};
	this.addListener = (eventName, listener) => append(eventName, listener);
	this.emit = (eventName, ...args) => trigger(eventName, ...args);
	this.eventNames = () => [...listeners.keys()];
	this.getMaxListeners = () => maxListeners;
	this.listenerCount = eventName => getCount(eventName);
	this.listeners = eventName => [...(get(eventName, false) || [])];
	this.on = (eventName, listener) => append(eventName, listener);
	this.once = (eventName, listener) => append(eventName, once(eventName, listener));
	this.prependListener = (eventName, listener) => prepend(eventName, listener);
	this.prependOnceListener = (eventName, listener) => prepend(eventName, once(eventName, listener));
	this.removeAllListeners = eventName => blitz(eventName);
	this.removeListener = (eventName, listener) => unset(eventName, listener);
	this.setMaxListeners = n => maxListeners = n;
}
