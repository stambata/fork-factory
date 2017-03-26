module.exports = function(request) {
    return Promise.resolve({
        request,
        response: 'ok'
    })
}