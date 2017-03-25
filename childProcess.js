var name = process.argv[2];
var method = require(process.argv[3]);
if (typeof method !== 'function') {
    process.send({
        method: 'notAFunction',
        error: {
            params: {
                path: process.argv[3]
            }
        }
    })
}
process.on('message', function(data) {
    try {
        return Promise.resolve(method.apply(method, data.params))
            .then(function(result) {
                return {
                    result: result
                };
            })
            .catch(function(error) {
                return {
                    error: error
                };
            })
            .then(function(response) {
                // response.jsonrpc: '2.0';
                response.id = data.id;
                response.method = data.method;
                return process.send(response);
            });
    } catch (error) {
        return process.send({
            // jsonrpc: '2.0',
            id: data.id,
            method: data.method,
            error: error
        });
    }
});
