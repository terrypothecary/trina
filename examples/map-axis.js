var Tpot = Tpot || {};
Tpot.Map = Tpot.Map || {};

(function () {
    var pi = Math.atan(1) * 4;
    var nj = 12;

    Tpot.Map.Axes = function (n) {
        return {
            things: [
                {surface: Tpot.Map.Axis(n), placement: {scale: [200, 200, 200], orientation: [pi / 2, pi / 2, 0], position: [50, 0, 0]}, color: [255, 0, 0]},
                {surface: Tpot.Map.Axis(n), placement: {scale: [200, 200, 200], orientation: [0, -pi / 2, 0], position: [0, 50, 0]}, color: [0, 255, 0]},
                {surface: Tpot.Map.Axis(n), placement: {scale: [200, 200, 200], orientation: [0, 0, 0], position: [0, 0, 50]}, color: [0, 0, 255]}
            ]
        };
    };


    Tpot.Map.Axis = function (n) {
        var r = [0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.020, 0.000];
        var z = [0.000, 0.100, 0.200, 0.300, 0.400, 0.500, 0.600, 0.700, 0.800, 0.900, 0.900, 1.000];
        return {
            parameters: [
                {
                    count: nj,
                    isClosed: false
                },
                {
                    count: n,
                    isClosed: true
                }
            ],

            points: function (i, j, t) {
                var s = j / n;
                return [
                    r[i] * Math.cos(s * 2 * pi),
                    r[i] * Math.sin(s * 2 * pi),
                    z[i]
                ];
            }
        };
    };

}());
