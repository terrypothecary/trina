var Tpot = Tpot || {};
Tpot.Map = Tpot.Map || {};

Tpot.Map.PulsingWave = function (n, freq) {
    var pi = Math.atan(1) *  4;

    var r = function (p) {return (p[0] / n) * (p[0] / n); };
    var s = function (p) {return (p[1] / n); };

    var xCache = new Tpot.PointCache(function (p) {return r(p) * 100 * Math.cos(s(p) * 2 * pi); });
    var yCache = new Tpot.PointCache(function (p) {return r(p) * 100 * Math.sin(s(p) * 2 * pi); });
    var zCache = new Tpot.PointCache(function (p) {return 1 / (r(p) * r(p) * r(p)  + 0.01) * Math.cos(6 * r(p) * pi); });
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

        points: function (p, t) {
            var amp = Math.sin(t * freq * 2 * pi);
            return [
                xCache.get(p),
                yCache.get(p),
                amp * zCache.get(p)
            ];
        },

        frontColor: [255, 0, 0],
        backColor: [0, 255, 0]
    };
};

