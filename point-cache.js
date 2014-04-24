var Tpot = Tpot || {};

Tpot.PointCache = (function () {
    var Cache = function (fn) {
        this._constructor(fn);
    };

    Cache.prototype = {
        _constructor: function (fn) {
            this.fn = fn;
            this.cache = [];
            this.get = this._write;
            this.state = 0;
        },

        _read: function (p) {
            return this.cache[p[0]][p[1]];
        },

        _write: function (p, fn) {
            var i = p[0];
            var j = p[1];
            fn = fn || this.fn;
            var cache = this.cache;
            cache[i] = cache[i] || [];
//            if (cache[i][j] !== undefined) {
            if (false) {
                this.get = this._read;
            }
            else {
                cache[i][j] = fn(p);
            }
            return cache[i][j];
        }
    };

    return Cache;

}());

