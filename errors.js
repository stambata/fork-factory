var define = require('ut-error').define;
var ForkFactory = define('forkFactory');

module.exports = {
    forkFactory: ForkFactory,
    nameNotAString: define('nameNotAString', ForkFactory, '{name} must be a string'),
    pathNotAString: define('pathNotAString', ForkFactory, '{path} must be a string'),
    pathNotAbsolute: define('pathNotAbsolute', ForkFactory, '{path} must be an absolute path'),
    moduleNotFound: define('moduleNotFound', ForkFactory, 'module not found for path {path}'),
    configNotAnObject: define('configNotAnObject', ForkFactory, '{config} must be an object'),
    forkNotFound: define('forkNotFound', ForkFactory, 'fork {fork} not found'),
    notAFunction: define('notAFunction', ForkFactory, 'module {path} must export a function'),
    requestTimeout: define('requestTimeout', ForkFactory, 'request timeout')
};
