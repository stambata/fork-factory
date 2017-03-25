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
                response.id = data.id;
                return process.send(response);
            });
    } catch (error) {
        process.send({
            id: data.id,
            error: error
        })
    }
});
