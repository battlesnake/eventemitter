if (typeof window === 'undefined') {
	module.exports = require('even' + 'ts').EventEmitter;
} else {
	module.exports = EventEmitter;
}

EventEmitter.defaultMaxListeners = 10;

function EventEmitter() {
	const listeners = new Map();
	let maxListeners = EventEmitter.defaultMaxListeners;
	const validate_event = event => {
		if (typeof event !== 'string' && typeof event !== 'symbol') {
			throw new Error('Event name must be a string or a symbol');
		}
	};
	const validate_handler = handler => {
		if (typeof handler !== 'function') {
			throw new Error('Event handler must be a function');
		}
	};
	const get = (event, needed) => {
		validate_event(event);
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
		validate_event(event);
		validate_handler(handler);
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
		validate_event(event);
		validate_handler(handler);
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
		let list;
		if (typeof event === 'undefined') {
			list = [].concat(...listeners.values());
			listeners.clear();
		} else {
			validate_event(event);
			list = get(event, false);
			listeners.delete(event);
		}
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
		[...list].forEach(handler => handler(...args));
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
