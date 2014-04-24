var Tpot = Tpot || {};

//==============================================================================
/*
Don't need a generic matrix library. Just something simple and specific
*/
//==============================================================================
Tpot.Matrix = (function () {

    var Matrix = function (m) {
        this._constructor(m);
    };

    Matrix.prototype = {
        _constructor: function (m) {
            this.m = m.m || m;
        },

        x: function (matrix) {
            return new Matrix(_multiplyMatrixMatrix(this.m, matrix && matrix.m));
        },

        xVector: function (vx) {
            var mx = this.m;
            var vr = new Array(3);

            var x = vx[0], y = vx[1], z = vx[2];
            var m0 = mx[0], m1 = mx[1], m2 = mx[2], m3 = mx[3];
            var invw = 1 / (m3[0] * x + m3[1] * y + m3[2] * z + m3[3]);

            vr[0] = (m0[0] * x + m0[1] * y + m0[2] * z + m0[3]) * invw;
            vr[1] = (m1[0] * x + m1[1] * y + m1[2] * z + m1[3]) * invw;
            vr[2] = (m2[0] * x + m2[1] * y + m2[2] * z + m2[3]) * invw;

            return vr;
        },

        det: function () {
            return _det(this.m);
        },

        inv: function () {
            return new Matrix(_inv(this.m));
        }
    };

    return Matrix;

    function _multiplyMatrixMatrix(ma, mb) {
        if (!mb) {
            return ma;
        }

        var mr = [[], [], [], []];
        var i, j, n = 4;

        for (i = 0; i < n; i++) {
            for (j = 0; j < n; j++) {
                mr[i][j] = entry(i, j, ma, mb);
            }
        }

        return mr;

        function entry(i, j, ma, mb) {
            var val = 0.0;
            for (var k = 0; k < n; k++) {
                val += ma[i][k] * mb[k][j];
            }
            return val;
        }
    }

    function _multiplyMatrixVector(mx, v) {
        if (!mx) {
            return v;
        }

        if (v.length < 4) {
            v = [v[0], v[1], v[2], 1];
        }

        var vector = [];
        var i, j, n = 4;

        for (i = 0; i < n; i++) {
            vector[i] = entry(i, mx, v);
        }

        var smallestReal = 1.0e-300;
        var divisor = Math.max(vector[3], smallestReal);
        for (i = 0; i < n; i++) {
            vector[i] = vector[i] / divisor;
        }

        return vector;

        function entry(i, mx, v) {
            var val = 0.0;
            for (var k = 0; k < n; k++) {
                val += mx[i][k] * v[k];
            }
            return val;
        }
    }

    function _minor(mx, iRemove, jRemove) {
        var n = mx.length;
        var m = n - 1;
        var mm = new Array(m);
        var row;
        for (var ii = 0, pi = 0; ii < n; ii++) {
            if (ii !==  iRemove) {
                mm[pi++] = row = new Array(m);
                for (var ij = 0, pj = 0; ij < n; ij++) {
                    if (ij !==  jRemove) {
                        row[pj++] = mx[ii][ij];
                    }
                }
            }
        }
        return mm;
    }

    function _det(mx) {
        switch (mx.length) {
        case 1:
            return mx[0][0];
        case 2:
            return mx[0][0] * mx[1][1] - mx[0][1] * mx[1][0];
        case 3:
            var r0 = mx[0], r1 = mx[1], r2 = mx[2];
            return r0[0] * (r1[1] * r2[2] - r1[2] * r2[1]) +
                   r0[1] * (r1[2] * r2[0] - r1[0] * r2[2]) +
                   r0[2] * (r1[0] * r2[1] - r1[1] * r2[0]);
        default:
            return _detGeneral(mx);
        }
    }

    function _detGeneral(mx) {
        var det = 0;
        var sr = -1;
        var el;
        var row = mx[0];
        for (var i = 0, n = mx.length; i < n; i++) {
            sr = -sr;
            el = row[i];
            if (el) {
                det += sr * el * _det(_minor(mx, 0, i));
            }
        }
        return det;
    }

    function _inv(mx) {
        var d = 1 / _det(mx);

        var n = mx.length;
        var mm = new Array(n);
        var row;
        var sr = 1;
        for (var ii = 0; ii < n; ii++) {
            mm[ii] = row = new Array(n);
            sr = -sr;
            var s = sr;
            for (var ij = 0; ij < n; ij++) {
                s = -s;
                row[ij] = s * _det(_minor(mx, ij, ii)) * d;
            }
        }

        return mm;
    }

}());


