module.exports = function(Context) {
    Context.getApp().get('/', Context.invokeRequestHandler(function(req, resp) {
        resp.render('home');
    }));
};