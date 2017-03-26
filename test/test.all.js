var tape = require('blue-tape');
var forkFactory = require('..');
var errors = require('../errors');
var path = require('path')
var forkManager;
tape('fork manager should be successfully initialized', (t) => {
	forkManager = forkFactory();
	t.equal(typeof forkManager, 'object', 'forkManager is an object');
	t.end();
});

tape('fork registration should fail when tried to be initialized without name', (t) => {
	return forkManager.register()
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.nameNotAString, true, error.message);
		})
});

tape('fork registration should fail when tried to be initialized with name different than string', (t) => {
	return forkManager.register(123)
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.nameNotAString, true, error.message);
		})
});

tape('fork registration should fail when path not passed', (t) => {
	return forkManager.register('fork1')
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.pathNotAString, true, error.message);
		})
});

tape('fork registration should fail when path not a string', (t) => {
	return forkManager.register('fork1', 123)
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.pathNotAString, true, error.message);
		})
});

tape('fork registration should fail when path is not absolute', (t) => {
	return forkManager.register('fork1', 'asdf')
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.pathNotAbsolute, true, error.message);
		})
});

tape('fork registration should fail when no module is available under the specified path', (t) => {
	return forkManager.register('fork1', path.join(__dirname, 'nonexisting'))
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.moduleNotFound, true, error.message);
		})
});

tape('fork registration should fail when no module is available under the specified path', (t) => {
	return forkManager.register('fork1', path.join(__dirname, 'nonexisting'))
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.moduleNotFound, true, error.message);
		})
});

tape('fork registration should fail when no function is exported under the specified path', (t) => {
	return forkManager.register('fork1', path.join(__dirname, 'forks', 'wrongExport'))
		.then((result) => {
			t.fail()
		})
		.catch((error) => {
			t.equal(error instanceof errors.notAFunction, true, error.message);
		})
});

tape('child process for fork registration of wrong export should have been successfully killed', (t) => {
	return forkManager.get()
		.then((result) => {
			t.assert(Object.keys(result).length === 0, 'no active child processes');
		})
});

tape('fork registration of synchronous handler should suceed', (t) => {
	return forkManager.register('synchronous', path.join(__dirname, 'forks', 'synchronous'))
		.then((handler) => {
			t.equal(typeof handler, 'function', 'sucsessfully returned a handler');
		})
});

tape('fork manager should have 1 active fork', (t) => {
	return forkManager.get()
		.then((result) => {
			t.assert(Object.keys(result).length === 1, 'one active fork');
		})
});

tape('synchronous handler should be available', (t) => {
	return forkManager.get('synchronous')
		.then((handler) => {
			t.assert(typeof handler === 'function', 'handler returned');
		})
});

tape('synchronous handler should be successfully called', (t) => {
	let request = 123
	return forkManager.get('synchronous')
		.then((handler) => {
			return handler(request)
		})
		.then((result) => {
			t.assert(result.request === request, 'request matches');
			t.assert(result.response === 'ok', 'response matches');
		})
});

tape('fork registration of promise handler should suceed', (t) => {
	return forkManager.register('promise', path.join(__dirname, 'forks', 'promise'))
		.then((handler) => {
			t.equal(typeof handler, 'function', 'sucsessfully returned a handler');
		})
});

tape('fork manager should have 2 active forks', (t) => {
	return forkManager.get()
		.then((result) => {
			t.assert(Object.keys(result).length === 2, 'two active forks');
		})
});

tape('promise handler should be available', (t) => {
	return forkManager.get('promise')
		.then((handler) => {
			t.assert(typeof handler === 'function', 'handler returned');
		})
});

tape('promise handler should be successfully called', (t) => {
	let request = 123
	return forkManager.get('promise')
		.then((handler) => {
			return handler(request)
		})
		.then((result) => {
			t.assert(result.request === request, 'request matches');
			t.assert(result.response === 'ok', 'response matches');
		})
});

tape('child processes should be successfully stopped', (t) => {
	forkManager.stop();
	t.equal(Object.keys(forkManager.get()).length, 0, 'forkManager has no running child processes');
	t.end();
});

