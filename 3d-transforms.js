var Tpot = Tpot || {};

//==============================================================================
/*
Don't need a generic transformation library. Just something simple and specific
*/
//==============================================================================
Tpot.Transform3d = (function () {
    return {
        identityMatrix: function () {
            return new Tpot.Matrix(_identityMatrix());
        },

        translationMatrix: function (v) {
            var matrix = _identityMatrix();
            if (v) {
                matrix[0][3] = v[0];
                matrix[1][3] = v[1];
                matrix[2][3] = v[2];
            }
            return new Tpot.Matrix(matrix);
        },

        scalingMatrix: function (v) {
            var matrix = _identityMatrix();
            if (v) {
                if (v.length) {
                    matrix[0][0] = v[0];
                    matrix[1][1] = v[1];
                    matrix[2][2] = v[2];
                }
                else {
                    matrix[0][0] = v;
                    matrix[1][1] = v;
                    matrix[2][2] = v;
                }
            }
            return new Tpot.Matrix(matrix);
        },

        rotationMatrix: function (v, angle) {
            var matrix = _identityMatrix();
            if (v && angle) {
                var cos = Math.cos(angle);
                var oneminuscos = 1 - cos;
                var sin = Math.sin(angle);
                var vs0 = v[0] * sin;
                var vs1 = v[1] * sin;
                var vs2 = v[2] * sin;
                var vc0 = v[0] * oneminuscos;
                var vc1 = v[1] * oneminuscos;
                var vc2 = v[2] * oneminuscos;
                var v00 = v[0] * vc0;
                var v01 = v[0] * vc1;
                var v02 = v[0] * vc2;
                var v10 = v01;
                var v11 = v[1] * vc1;
                var v12 = v[1] * vc2;
                var v20 = v02;
                var v21 = v12;
                var v22 = v[2] * vc2;
                matrix[0][0] = v00 + cos;
                matrix[0][1] = v01 - vs2;
                matrix[0][2] = v02 + vs1;
                matrix[1][0] = v10 + vs2;
                matrix[1][1] = v11 + cos;
                matrix[1][2] = v12 - vs0;
                matrix[2][0] = v20 - vs1;
                matrix[2][1] = v21 + vs0;
                matrix[2][2] = v22 + cos;
            }
            return new Tpot.Matrix(matrix);
        },

        perspectiveMatrix: function (direction) {
            var matrix = _identityMatrix();
            if (direction) {
                matrix[3][2] = direction;
                matrix[3][3] = 0;
            }
            return new Tpot.Matrix(matrix);
        },

        eulerRotationMatrix: function (angles) {
            // Extrinsic rotation about fixed axes
            var matrix = null;
            if (angles) {
                var alpha = angles[0];
                var beta = angles[1];
                var gamma = angles[2];

                // rotate by gamma clockwise about Z
                matrix = this.rotationMatrix([0, 0, 1], gamma).x(matrix);

                // rotate by beta clockwise about X
                matrix = this.rotationMatrix([1, 0, 0], beta).x(matrix);

                // rotate by alpha clockwise about Z
                matrix = this.rotationMatrix([0, 0, 1], alpha).x(matrix);
            }
            else {
                matrix = this.identityMatrix();
            }
            return matrix;
        },

        caculateEulerAngles: function (pA, pB) {
            var angles = [];
            var pDelta = [pB[0] - pA[0], pB[1] - pA[1], pB[2] - pA[2]];

            var dy = pDelta[0];
            var dx = -pDelta[1];
            angles[0]  = Math.atan2(dy, dx);

            dy = Math.sqrt(pDelta[0] * pDelta[0] + pDelta[1] * pDelta[1]);
            dx = pDelta[2];
            angles[1]  = Math.atan2(dy, dx);
            return angles;
        }
    };

    function _identityMatrix() {
        return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
    }

} ());