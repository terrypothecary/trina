/*global requestAnimationFrame*/

//==============================================================================
/*
surface:
{
    parameters: [
        {
            count: 10,
            isClosed: true
        }
    ],
    points: [
        [
            {
                x: 111,
                y: 222,
                z: 333
            }
        ]
    ]
}

camera:
{
    position: {
        x: 1,
        y: 1,
        z: 1
    },
    angle: {
        theta: 1,
        phi: 1,
        psi: 1
    },
    aperture: {
        x: 1,
        y: 1,
        z: 1
    }
}

*/
//==============================================================================

var Tpot = Tpot || {};

Tpot.View3d = function (visible) {
    this._constructor(visible);
};

Tpot.View3d.prototype = {
    _constructor: function (visible) {
        var hidden = document.createElement('canvas');
        hidden.width = visible.width;
        hidden.height = visible.height;

        var hidden2 = document.createElement('canvas');
        hidden2.width = visible.width;
        hidden2.height = visible.height;

        this.canvas = {
            visible: visible.getContext('2d'),
            hidden: hidden.getContext('2d'),
            hidden2: hidden.getContext('2d')
        };
        this.map = {
            things: {}
        };
        this.transformedMap = null;
        this.page = null;
        this.camera = null;
        this.time0 = 0.0;
        this.stats = new Tpot.Stats(2000);

        this.debug = document.getElementById('debug');

        this.mesh = new Tpot.Mesh();
    },

    get height() {
        return this.canvas.visible.canvas.height;
    },

    get width() {
        return this.canvas.visible.canvas.width;
    },

    setRenderer: function (renderer) {
        this.renderer = renderer;
    },

    setMap: function (map) {
        this.mesh.build(map);
        this.transformedMap = null;
        this.map = map;
    },

    setCamera: function (camera) {
        this.transformedMap = null;
        this.camera = camera;
    },

    // flatten the entire map hierarchy by placing every thing in the space of the root map
    transform: function (t) {
        var cameraTransform = this._createCameraTransform(this.camera, t);
        this.mesh.transform(cameraTransform, t);
    },

    project: function (t) {
        this.page = this.page ||
        {
            min: {
                x: this.width,
                y: this.height
            },
            max : {
                x: 0,
                y: 0
            }
        };

        var projection = this._createProjection(this.page, this.camera, t);
        this.mesh.project(projection);
    },

    draw: function () {
        this.stats.startFrame();

        requestAnimationFrame(this.draw.bind(this));

        var now = (new Date()).getTime() / 1000;
        this.time0 = this.time0 || now;
        var time = now - this.time0;
        var visible = this.canvas.visible;
        var hidden = this.canvas.hidden;
        var hidden2 = this.canvas.hidden2;

        this.stats.start('evaluate');
        this.mesh.evaluate(time);
        this.stats.finish('evaluate');

        this.stats.start('transform');
        this.transform(time);
        this.stats.finish('transform');

        this.stats.start('project');
        this.project(time);
        this.stats.finish('project');

        this.stats.start('3D render');
        var plotInfo = this.renderer.render(this.mesh);
        this.stats.finish('3D render');

        this.stats.start('2D render');

        hidden.canvas.width = hidden.canvas.width; //clear the offscreen canvas


        for (var i = 0, n = plotInfo.length; i < n; i++) {
            var plot = plotInfo[i];
            this._render2dObject(hidden, plot, i);
        }

        this.stats.log('clear canvas');
        visible.canvas.width = visible.canvas.width; //clear the onscreen canvas
        this.stats.log('drawImage');
        visible.drawImage(hidden.canvas, 0, 0);
        this.stats.finish('2D render');

        this.stats.finishFrame();
        if (this.debug) {
            this.debug.innerHTML = this.stats.get();
        }
    },

    _render2dObject: function (canvas, plot, i) {
        var color = this._rgb(plot.color);
        var points = plot.points;
        switch (plot.type) {
        case 'P':
            canvas.strokeStyle = color;
            canvas.beginPath();
            break;
        case 'L':
            this.stats.count('lines', 1);
            canvas.strokeStyle = color;
            canvas.beginPath();
            canvas.moveTo(points[0].x | 0, points[0].y | 0);
            canvas.lineTo(points[1].x | 0, points[1].y | 0);
            canvas.stroke();
            break;
        case 'T':
            this.stats.count('faces', 1);
            this.stats.log(
                i +
                ' color: ' + color +
                ' coords:' +
                ' (' + (points[0].x | 0) + ',' + (points[0].y | 0) + ')' +
                ' (' + (points[1].x | 0) + ',' + (points[1].y | 0) + ')' +
                ' (' + (points[2].x | 0) + ',' + (points[2].y | 0) + ')' +
                '');
            canvas.strokeStyle = color;
            canvas.fillStyle = color;
            canvas.beginPath();
            canvas.moveTo(points[0].x | 0, points[0].y | 0);
            canvas.lineTo(points[1].x | 0, points[1].y | 0);
            canvas.lineTo(points[2].x | 0, points[2].y | 0);
            canvas.closePath();
            //canvas.stroke();
            canvas.fill();
            break;
        case 'Q':
            canvas.strokeStyle = color;
            canvas.fillStyle = color;
            canvas.beginPath();
            canvas.moveTo(points[0].x | 0, points[0].y | 0);
            canvas.lineTo(points[1].x | 0, points[1].y | 0);
            canvas.lineTo(points[2].x | 0, points[2].y | 0);
            canvas.lineTo(points[3].x | 0, points[3].y | 0);
            canvas.closePath();
            //canvas.stroke();
            canvas.fill();
            break;
        default:
        }

    },

    _rgb: function (color) {
        return 'rgb(' + (color[0] | 0) + ',' + (color[1] | 0) + ',' + (color[2] | 0) + ')';
    },

    _evaluateProperty: function (p, t) {
        if (typeof(p) === 'function') {
            p = p(t);
        }
        return p;
    },

    _createPlacementTransform: function (placement, t) {
        /*
        The thing is first scaled from its own origin.
        Then it is orientated about its own origin.
        Then its origin is translated to a position in the parent map.
        */
        placement = placement || {};
        var matrix = null;
        matrix = Tpot.Transform3d.scalingMatrix(this._evaluateProperty(placement.scale, t)).x(matrix);
        matrix = Tpot.Transform3d.eulerRotationMatrix(this._evaluateProperty(placement.orientation, t)).x(matrix);
        matrix = Tpot.Transform3d.translationMatrix(this._evaluateProperty(placement.position, t)).x(matrix);
        return matrix;
    },

    _createCameraTransform: function (camera, t) {
        /*
        The camera, before any transformation starts, is at the origin looking in the positive Z direction.
        Positive Y is to the top.
        Positive X is to the left.
        The camera is then placed on the map and the map is transformed around the camera
        */
        var matrix = this._createPlacementTransform(camera, t).inv();
        return matrix;
    },

    _createProjection: function (page, camera, t) {
        /*
        1. perspective
        2. translate and scale to viwport
        */
        var matrix = null;
        if (camera) {
            var aperture = this._evaluateProperty(camera.aperture, t);
            if (aperture) {
                // add unit perspective looking in positive z direction
                matrix = Tpot.Transform3d.perspectiveMatrix(1).x(matrix);

                // zoom
                matrix = Tpot.Transform3d.scalingMatrix([aperture.z, aperture.z, 1]).x(matrix);

                // scale to aperture size. a point on the edge of the aperture wil have a value of 1.0
                matrix = Tpot.Transform3d.scalingMatrix([1 / aperture.x, 1 / aperture.y, 1]).x(matrix);
            }
        }

        if (page) {
            // scale to fit page
            matrix = Tpot.Transform3d.scalingMatrix([(page.max.x - page.min.x) / 2, (page.max.y - page.min.y) / 2, 1]).x(matrix);

            // move to fit page
            matrix = Tpot.Transform3d.translationMatrix([(page.max.x + page.min.x) / 2, (page.max.y + page.min.y) / 2, 1]).x(matrix);

            var offset = {
                x: (page.max.x + page.min.x) / 2,
                y: (page.max.y + page.min.y) / 2
            };
            var scale = {
                x: (page.max.x - page.min.x) / 2,
                y: (page.max.y - page.min.y) / 2
            };
        }

        return matrix;
    },

    _updateLimits: function (currentLimits, point) {
        var limits = currentLimits || {};

        if (!limits.max) {
            limits.max = {
                x: point[0],
                y: point[1],
                z: point[2]
            };
        }
        else {
            limits.max.x = limits.max.x > point[0] ? limits.max.x : point[0];
            limits.max.y = limits.max.y > point[1] ? limits.max.y : point[1];
            limits.max.z = limits.max.z > point[2] ? limits.max.z : point[2];
        }

        if (!limits.min) {
            limits.min = {
                x: point[0],
                y: point[1],
                z: point[2]
            };
        }
        else {
            limits.min.x = limits.min.x < point[0] ? limits.min.x : point[0];
            limits.min.y = limits.min.y < point[1] ? limits.min.y : point[1];
            limits.min.z = limits.min.z < point[2] ? limits.min.z : point[2];
        }

        return limits;
    }

};

