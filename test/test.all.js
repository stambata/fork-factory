var tape = require('blue-tape');
var forkFactory = require('..');
var errors = require('../errors');
var path = require('path');
var forkManager;
tape('fork manager should be successfully initialized', (t) => {
    forkManager = forkFactory();
    t.equal(typeof forkManager, 'object', 'forkManager is an object');
    t.equal(Object.keys(forkManager).length, 5, 'forkManager provides 5 api methods');
    t.equal(typeof forkManager.stop, 'function', 'forkManager api provides method: stop');
    t.equal(typeof forkManager.registerMethod, 'function', 'forkManager api provides method: registerMethod');
    t.equal(typeof forkManager.importMethod, 'function', 'forkManager api provides method: importMethod');
    t.equal(typeof forkManager.remove, 'function', 'forkManager api provides method: remove');
    t.equal(typeof forkManager.list, 'function', 'forkManager api provides method: list');
    t.end();
});

tape('fork registration should fail when tried to be initialized without name', (t) => {
    return forkManager.registerMethod()
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.nameNotAString, true, error.message);
        });
});

tape('fork registration should fail when tried to be initialized with name different than string', (t) => {
    return forkManager.registerMethod(123)
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.nameNotAString, true, error.message);
        });
});

tape('fork registration should fail when path not passed', (t) => {
    return forkManager.registerMethod('fork1')
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.pathNotAString, true, error.message);
        });
});

tape('fork registration should fail when path not a string', (t) => {
    return forkManager.registerMethod('fork1', 123)
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.pathNotAString, true, error.message);
        });
});

tape('fork registration should fail when path is not absolute', (t) => {
    return forkManager.registerMethod('fork1', 'asdf')
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.pathNotAbsolute, true, error.message);
        });
});

tape('fork registration should fail when no module is available under the specified path', (t) => {
    return forkManager.registerMethod('fork1', path.join(__dirname, 'nonexisting'))
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.moduleNotFound, true, error.message);
        });
});

tape('fork registration should fail when no module is available under the specified path', (t) => {
    return forkManager.registerMethod('fork1', path.join(__dirname, 'nonexisting'))
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.moduleNotFound, true, error.message);
        });
});

tape('fork registration should fail when no function is exported under the specified path', (t) => {
    return forkManager.registerMethod('fork1', path.join(__dirname, 'forks', 'wrongExport'))
        .then((result) => {
            return t.fail();
        })
        .catch((error) => {
            return t.equal(error instanceof errors.notAFunction, true, error.message);
        });
});

tape('child process for fork registration of wrong export should have been successfully killed', (t) => {
    t.assert(Object.keys(forkManager.list()).length === 0, 'no active child processes');
    t.end();
});

tape('fork registration of synchronous handler should suceed', (t) => {
    return forkManager.registerMethod('synchronous', path.join(__dirname, 'forks', 'synchronous'))
        .then((handler) => {
            return t.equal(typeof handler, 'function', 'sucsessfully returned a handler');
        });
});

tape('fork manager should have 1 active fork', (t) => {
    t.assert(Object.keys(forkManager.list()).length === 1, 'one active fork');
    t.end();
});

tape('synchronous handler should be available', (t) => {
    return forkManager.importMethod('synchronous')
        .then((handler) => {
            return t.assert(typeof handler === 'function', 'handler returned');
        });
});

tape('synchronous handler should be successfully called', (t) => {
    let request = 123;
    return forkManager.importMethod('synchronous')
        .then((handler) => {
            return handler(request);
        })
        .then((result) => {
            t.assert(result.request === request, 'request matches');
            return t.assert(result.response === 'ok', 'response matches');
        });
});

tape('fork registration of promise handler should suceed', (t) => {
    return forkManager.registerMethod('promise', path.join(__dirname, 'forks', 'promise'))
        .then((handler) => {
            return t.equal(typeof handler, 'function', 'sucsessfully returned a handler');
        });
});

tape('fork manager should have 2 active forks', (t) => {
    t.assert(Object.keys(forkManager.list()).length === 2, 'two active forks');
    t.end();
});

tape('promise handler should be available', (t) => {
    return forkManager.importMethod('promise')
        .then((handler) => {
            return t.assert(typeof handler === 'function', 'handler returned');
        });
});

tape('promise handler should be successfully called', (t) => {
    let request = 123;
    return forkManager.importMethod('promise')
        .then((handler) => {
            return handler(request);
        })
        .then((result) => {
            t.assert(result.request === request, 'request matches');
            return t.assert(result.response === 'ok', 'response matches');
        });
});

tape('child processes should be successfully stopped', (t) => {
    forkManager.stop();
    t.equal(Object.keys(forkManager.list()).length, 0, 'forkManager has no running child processes');
    t.end();
});

