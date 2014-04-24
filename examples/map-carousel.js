var Tpot = Tpot || {};
Tpot.Map = Tpot.Map || {};

(function () {
    var pi = Math.atan(1) * 4;

    var top = function () {
        var ni = 4;
        var nj = 8;
        var r = [0.000, 0.500, 0.500, 0.000];
        var z = [1.000, 0.750, 0.700, 0.700];
        return {
            parameters: [
                {
                    count: ni,
                    isClosed: false
                },
                {
                    count: nj,
                    isClosed: true
                }
            ],

            points: function (p, t) {
                var i = p[0];
                var j = p[1];
                var s = j / nj;
                return [
                    r[i] * Math.cos(s * 2 * pi),
                    r[i] * Math.sin(s * 2 * pi),
                    z[i]
                ];
            },

            frontColor: [255, 0, 0]
        };
    };

    var middle = function () {
        var ni = 4;
        var nj = 8;
        var r = [0.000, 0.100, 0.100, 0.000];
        var z = [0.700, 0.700, 0.150, 0.150];
        return {
            parameters: [
                {
                    count: ni,
                    isClosed: false
                },
                {
                    count: nj,
                    isClosed: true
                }
            ],

            points: function (p, t) {
                var i = p[0];
                var j = p[1];
                var s = j / nj;
                return [
                    r[i] * Math.cos(s * 2 * pi),
                    r[i] * Math.sin(s * 2 * pi),
                    z[i]
                ];
            },

            frontColor: [0, 255, 0]
        };
    };

    var base = function () {
        var ni = 4;
        var nj = 8;
        var r = [0.000, 0.500, 0.500, 0.000];
        var z = [0.150, 0.150, 0.060, 0.060];
        return {
            parameters: [
                {
                    count: ni,
                    isClosed: false
                },
                {
                    count: nj,
                    isClosed: true
                }
            ],

            points: function (p, t) {
                var i = p[0];
                var j = p[1];
                var s = j / nj;
                return [
                    r[i] * Math.cos(s * 2 * pi),
                    r[i] * Math.sin(s * 2 * pi),
                    z[i]
                ];
            },

            frontColor: [0, 0, 255]
        };
    };

    var stand = function () {
        var ni = 5;
        var nj = 8;
        var r = [0.250, 0.250, 0.500, 0.500, 0.000];
        var z = [0.060, 0.030, 0.030, 0.000, 0.000];
        return {
            parameters: [
                {
                    count: ni,
                    isClosed: false
                },
                {
                    count: nj,
                    isClosed: true
                }
            ],

            points: function (p, t) {
                var i = p[0];
                var j = p[1];
                var s = j / nj;
                return [
                    r[i] * Math.cos(s * 2 * pi),
                    r[i] * Math.sin(s * 2 * pi),
                    z[i]
                ];
            },

            frontColor: [0, 0, 0]
        };
    };

    var rotator = function () {
        return {
            things: {
                'top': {
                    surface: top(),
                    color: [255, 0, 0]
                },
                'middle': {
                    surface: middle(),
                    color: [0, 255, 0]
                },
                'base': {
                    surface: base(),
                    color: [0, 0, 255]
                }
            }

        };
    };

    var carousel = function (rpm) {
        return {
            things: {
                'rotator': {
                    map: rotator(),
                    placement: {orientation: function (t) {return [0, 0, t * rpm / 60 * 2 * pi]; }}
                },
                'stand': {
                    surface: stand()
                }
            }

        };
    };

    Tpot.Map.Carousel = function (rpm) {
        return {
            things: {
                'rotator': {
                    map: {
                        things: {
                            'main': {map: rotator()},
                            'mini-carousel-1': {map: carousel(-rpm * 5), placement: {scale: [0.4, 0.4, 0.4], position: [+0.5, +0.0, 0.3]}},
                            'mini-carousel-2': {map: carousel(-rpm * 5), placement: {scale: [0.4, 0.4, 0.4], position: [+0.0, +0.5, 0.3]}},
                            'mini-carousel-3': {map: carousel(-rpm * 5), placement: {scale: [0.4, 0.4, 0.4], position: [-0.5, +0.0, 0.3]}},
                            'mini-carousel-4': {map: carousel(-rpm * 5), placement: {scale: [0.4, 0.4, 0.4], position: [+0.0, -0.5, 0.3]}}
                        }
                    },
                    placement: {orientation: function (t) {return [0, 0, t * rpm / 60 * 2 * pi]; }}
                },
                'stand': {
                    surface: stand()
                }
            }

        };
    };

}());
