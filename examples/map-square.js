var Tpot = Tpot || {};
Tpot.Map = Tpot.Map || {};

(function () {
    Tpot.Map.Square = function (n) {
        var x = [-n, +n];
        var y = [-n, +n];
        return {
            parameters: [
                {
                    count: 2,
                    isClosed: false
                },
                {
                    count: 2,
                    isClosed: false
                }
            ],

            points: function (p, t) {
                return [
                    x[p[0]],
                    y[p[1]],
                    0.0
                ];
            },

            frontColor: [255, 0, 0],
            xbackColor: [0, 255, 0]
        };
    };

}());
