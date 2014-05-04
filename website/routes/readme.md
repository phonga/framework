Any javascript file under this directory will auto include to form routes:

```js
module.exports = function(Context) {
    Context.getApp().get('/', Context.invokeRequestHandler(function(req, resp) {
        // render home view found under the views directory
        resp.render('home');
    }));
};
```
