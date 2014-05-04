Place API specific request handlers in individual files under this directory. The index.js file will look through the directory and auto require any javascript files.

Example:

```javascript
module.exports = function(Context) {
    Context.route('/test')
        .get(function(req, resp) {
            resp.json({test: 'hello world'});
        })
};
```
