var Tpot = Tpot || {};
Tpot.Map = Tpot.Map || {};

Tpot.Map.Teapot = function (n, freq) {
    var pi = Math.atan(1) *  4;

    var r = function (i, j) {return (i / n) * (i / n); };
    var s = function (i, j) {return (j / n); };

    var xCache = new Tpot.PointCache(function (i, j) {return r(i, j) * 100 * Math.cos(s(i, j) * 2 * pi); });
    var yCache = new Tpot.PointCache(function (i, j) {return r(i, j) * 100 * Math.sin(s(i, j) * 2 * pi); });
    var zCache = new Tpot.PointCache(function (i, j) {return 1 / (r(i, j) * r(i, j) * r(i, j)  + 0.01) * Math.cos(6 * r(i, j) * pi); });
    return {
        parameters: [
            {
                count: n,
                isClosed: false
            },
            {
                count: n,
                isClosed: true
            }
        ],

        points: function (i, j, t) {
            return [
                xCache.get(i, j),
                yCache.get(i, j),
                zCache.get(i, j)
            ];
        }
    };
};

