module.exports = function(Context) {
    Context.route('/test')
        .get(function(req, resp) {
            resp.json({test: 'hello world'});
        })
};
