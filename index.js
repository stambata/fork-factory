'use strict';
const EventEmitter = require('events');
const fork = require('child_process').fork;
const path = require('path');
const childProcess = path.join(__dirname, 'childProcess');
const debugMode = process.execArgv.filter((arg) => arg.startsWith('--debug')).length > 0;
const net = require('net');
const errors = require('./errors');
const getRandomPort = () => new Promise((resolve, reject) => {
    let server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
        let port = server.address().port;
        server.close(() => resolve(port));
    });
});
class Fork extends EventEmitter {
    constructor(name, absolutePath, config) {
        super();
        this.initialized = false;
        this.name = name;
        this.path = absolutePath;
        this.requestId = 0;
        this.callbacks = {};
        this.config = Object.assign({
            timeout: 30000
        }, config);
        return this;
    }

    init() {
        return new Promise((resolve, reject) => {
            if (this.initialized) {
                return resolve(this);
            }
            this.initialized = true;
            let forkOptions = {};
            if (this.config.debugPort) {
                forkOptions.execArgv = ['--debug=' + this.config.debugPort];
            }
            this.childProcess = fork(childProcess, [this.name, this.path], forkOptions);
            this.childProcess.on('error', (error) => {
                this.dispose();
                throw error;
            });
            this.childProcess.once('message', (response) => {
                if (response.error && errors[response.method]) {
                    this.dispose();
                    return reject(errors[response.method]({params: response.error.params}));
                }
                this.childProcess.on('message', (response) => {
                    let callback = this.callbacks[response.id];
                    if (callback) {
                        delete this.callbacks[response.id];
                        callback(response);
                    }
                });
                return resolve(this);
            })
        })
    }

    send(params) {
        return new Promise((resolve, reject) => {
            if (this.requestId === Number.MAX_SAFE_INTEGER) {
                this.requestId = 0;
            }
            let timeout = null;
            ((requestId) => {
                timeout = setTimeout(() => {
                    delete this.callbacks[requestId];
                    reject(errors.requestTimeout());
                }, this.config.timeout);
            })(++this.requestId)
            this.callbacks[this.requestId] = (response) => {
                clearTimeout(timeout);
                return response.error ? reject(response.error) : resolve(response.result);
            };
            this.childProcess.send({
                id: this.requestId,
                params: params
            });
        });
    }

    dispose() {
        this.childProcess.kill('SIGINT');
        this.emit('dispose');
    }

}
const forkFactory = () => {
    let forks = {};
    const stop = () => Object.keys(forks).forEach(name => forks[name].dispose())
    const register = (name, absolutePath, config) => {
        if (typeof name !== 'string') {
            return Promise.reject(errors.nameNotAString({params: {name}}));
        }
        if (typeof absolutePath !== 'string') {
            return Promise.reject(errors.pathNotAString({params: {path: absolutePath}}));
        }
        if (!path.isAbsolute(absolutePath)) {
            return Promise.reject(errors.pathNotAbsolute({params: {path: absolutePath}}));
        }
        try {
            require.resolve(absolutePath);
        } catch (e) {
            return Promise.reject(errors.moduleNotFound({params: {path: absolutePath}}));
        }
        if (config) {
            if (typeof config !== 'object') {
                throw errors.configNotAnObject({params: {config}});
            }
        } else {
            config = {};
        }
        let promise = Promise.resolve(config);
        if (debugMode && !config.debugPort) {
            promise = promise
                .then(() => getRandomPort())
                .then((debugPort) => Object.assign(config, {debugPort}));
        }
        return promise
            .then((config) => {
                forks[name] = new Fork(name, absolutePath, config);
                forks[name].on('dispose', () => (delete forks[name]));
                return forks[name].init();
            })
            .then(() => get(name));
    };
    const get = (name) => {
        if (name) {
            if (typeof name !== 'string') {
                return Promise.reject(errors.nameNotAString({params: {name}}));
            }
            if (!forks[name]) {
                return Promise.reject(errors.forkNotFound({params: {fork: name}}));
            }
            return Promise.resolve(function() {
                return forks[name].send(Array.prototype.slice.call(arguments))
            });
        }
        return Promise.resolve(Object.keys(forks).reduce((all, name) => {
            all[name] = function() {
                return forks[name].send(Array.prototype.slice.call(arguments))
            }
            return all;
        }, {}));
    };
    return {register, get, stop};
}

module.exports = () => forkFactory();
