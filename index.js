var stream = require('stream');
var util = require('util');

function TransformContinuation(opts) {
    opts = opts || {};
    opts.objectMode = true;
    stream.Transform.call(this, opts);
}

util.inherits(TransformContinuation, stream.Transform);

TransformContinuation.prototype._transform = function (chunk, enc, next) {  
    if (typeof chunk === 'object') {
        if (!chunk.extra) {
            chunk.extra = {};
        }
        chunk.extra.continuation = new Buffer(chunk.key).toString('base64');
    }
    this.push(chunk);
    next();
};


function LevelContinuation(_db, opts) {
    function DB () {};
    DB.prototype = _db;

    var db = new DB();
    db.parent = _db;

    db.createReadStream = function (options) {
        if (options.continuation) {
            var lastkey = new Buffer(options.continuation, 'base64').toString('ascii');
            if (options.reverse) {
                options.end = lastkey + '~';
            } else {
                options.start = lastkey + '~';
            }
        }
        return db.parent.createReadStream(options).pipe(new TransformContinuation());
    };

    return db;
}

module.exports = LevelContinuation;
