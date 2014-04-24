var Tpot = Tpot || {};

//==============================================================================
/*
An intermediate representation of a map that is more suited to 3d rendering

build phase.
Performed each time the map tree structure or surface parameter definitions change.
Expected to be a one-off process.
During this phase:
1. The map tree is copied, flattened and points are allocated
2. A list of lines is generated
2. A list of edges is generated
3. A list of tiles is generated
4. A list of facets is generated

evaluateMap phase.
Performed for every frame
During this phase:
1. surface functions are evaluated
2. placement transformations are evaluated and combined

transform phase.
Performed for every frame
During this phase:
1. points are transformed by the placement transformations
2. tile centroids are calculated
3. points (including centroids) are projected (perspective and page scale and offset)
*/
//==============================================================================
Tpot.Mesh = (function () {

    var Mesh = function () {
        this._constructor();
    };

    Mesh.prototype = {
        _constructor: function () {
        },

        build: function (map) {
            _build(this, map);
        },

        evaluate: function (t) {
            _evaluate(this, t);
        },

        transform: function (cameraTransform, t) {
            _transform(this, cameraTransform, t);
        },

        project: function (projection) {
            _project(this, projection);
        }

    };

    var ITEM_TYPE = {
        CENTROID: 'c',
        LINE: 'l',
        EDGE: 'e',
        VERTEX: 'v',
        TILE: 't',
        FACET: 'f'
    };


    var Position = function () {
        return {
            evaluated: null,
            transformed: null,
            projected: null
        };
    };

    var Direction = function () {
        return {
            evaluated: null,
            transformed: null,
            projected: null
        };
    };

    var Color = function () {
        return {
            evaluated: null,
            transformed: null,
            projected: null
        };
    };

    var Atom = function (parameters, surface) {
        var config = 0;
        config += surface.getFrontColor ? 1 : 0;
        config += surface.getBackColor ? 2 : 0;

        var atom = {
            position: new Position(),
            frontColor: new Color(),
            backColor: new Color(),
            parameters: parameters,
            surface: surface,
            evaluate: this._evaluate[config],
            transform: this._transform[config],
            project: this._project[config]
        };

        return atom;
    };
    Atom.prototype._evaluate = [
        function (t) {
            this.position.evaluated = this.surface.getPosition(this.parameters, t);
        },
        function (t) {
            this.position.evaluated = this.surface.getPosition(this.parameters, t);
            this.frontColor.evaluated = this.surface.getFrontColor(this.parameters, t);
        },
        function (t) {
            this.position.evaluated = this.surface.getPosition(this.parameters, t);
            this.backColor.evaluated = this.surface.getBackColor(this.parameters, t);
        },
        function (t) {
            this.position.evaluated = this.surface.getPosition(this.parameters, t);
            this.frontColor.evaluated = this.surface.getFrontColor(this.parameters, t);
            this.backColor.evaluated = this.surface.getBackColor(this.parameters, t);
        }
    ];
    Atom.prototype._transform = [
        function () {
            this.position.transformed = this.surface.transform.xVector(this.position.evaluated);
        },
        function () {
            this.position.transformed = this.surface.transform.xVector(this.position.evaluated);
            this.frontColor.transformed = _mixColor([this.surface.colormix, this.frontColor.evaluated]);
        },
        function () {
            this.position.transformed = this.surface.transform.xVector(this.position.evaluated);
            this.backColor.transformed = _mixColor([this.surface.colormix, this.backColor.evaluated]);
        },
        function () {
            this.position.transformed = this.surface.transform.xVector(this.position.evaluated);
            this.frontColor.transformed = _mixColor([this.surface.colormix, this.frontColor.evaluated]);
            this.backColor.transformed = _mixColor([this.surface.colormix, this.backColor.evaluated]);
        }
    ];
    Atom.prototype._project = [
        function (projection) {
            this.position.projected = projection.xVector(this.position.transformed);
        },
        function (projection) {
            this.position.projected = projection.xVector(this.position.transformed);
            this.frontColor.projected = this.frontColor.transformed;
        },
        function (projection) {
            this.position.projected = projection.xVector(this.position.transformed);
            this.backColor.projected = this.backColor.transformed;
        },
        function (projection) {
            this.position.projected = projection.xVector(this.position.transformed);
            this.frontColor.projected = this.frontColor.transformed;
            this.backColor.projected = this.backColor.transformed;
        }
    ];

    var Point = function () {
        return {
            position: new Position(),
            color: new Color()
        };
    };

    var Line = function (points) {
        var line = {
            type: ITEM_TYPE.LINE,
            points: points,
            facets: [],
            isInterpolation: false
        };
        line.centroid = new Centroid(line, line.points);
        return line;
    };
    Object.defineProperty(Line.prototype, "position", {
        enumerable: true,
        configurable: true,
        get: function () {
            return this.position || (
                this.position = this._evaluatePosition()
            );
        }
    });

    var Edge = function (owner, index, line) {
        return {
            type: ITEM_TYPE.EDGE,
            owner: owner,
            line: line,
            index: index
        };
    };

    var Centroid = function (owner, points) {
        var config = points.length;
        config = config < 3 ? config : 3;
        this.type = ITEM_TYPE.CENTROID;
        this.owner = owner;
        this.color = new Color();
        this.points = points;
        this._position = null;
        this._color = null;
        this._evaluatePosition = this._evaluatePosition[config];
        this._evaluateColor = this._evaluateColor[config];
    };
    Centroid.prototype.reset = function () {
        this._position = null;
        this._color = null;
    };
    Object.defineProperty(Centroid.prototype, "position", {
        enumerable: true,
        configurable: true,
        get: function () {
            return this._position || (
                this._position = this._evaluatePosition()
            );
        }
    });
    Object.defineProperty(Centroid.prototype, "color", {
        enumerable: true,
        configurable: true,
        get: function () {
            return this._color || (
                this._color = this._evaluateColor()
            );
        }
    });
    Centroid.prototype._evaluatePosition = [
        function () {
            return {};
        },
        function () {
            return {
                transformed: this.points[0].position.transformed
            };
        },
        function () {
            var t0 = this.points[0].position.transformed;
            var t1 = this.points[1].position.transformed;
            return {
                transformed: [
                    (t0[0] + t1[0]) * 0.5,
                    (t0[1] + t1[1]) * 0.5,
                    (t0[2] + t1[2]) * 0.5
                ]
            };
        },
        function () {
            var points = this.points;
            var centroid = [0.0, 0.0, 0.0];
            var n = this.points.length;
            var nth = 1 / n;
            var point;

            for (var i = 0; i < n; i++) {
                point = this.points[i].position.transformed;
                centroid[0] += point[0];
                centroid[1] += point[1];
                centroid[2] += point[2];
            }

            centroid[0] = centroid[0] * nth;
            centroid[1] = centroid[1] * nth;
            centroid[2] = centroid[2] * nth;

            return {
                transformed: centroid
            };
        }
    ];
    Centroid.prototype._evaluateColor = [
        function () {
            return {};
        },
        function () {
            return {
                transformed: this.points[0].position.transformed
            };
        },
        function () {
            var t0 = this.points[0].color.transformed;
            var t1 = this.points[1].color.transformed;
            return {
                transformed: [
                    (t0[0] + t1[0]) * 0.5,
                    (t0[1] + t1[1]) * 0.5,
                    (t0[2] + t1[2]) * 0.5
                ]
            };
        },
        function () {
            var points = this.points;
            var centroid = [0.0, 0.0, 0.0];
            var n = this.points.length;
            var nth = 1 / n;
            var point;

            for (var i = 0; i < n; i++) {
                point = this.points[i].color.transformed;
                centroid[0] += point[0];
                centroid[1] += point[1];
                centroid[2] += point[2];
            }

            centroid[0] = centroid[0] * nth;
            centroid[1] = centroid[1] * nth;
            centroid[2] = centroid[2] * nth;

            return {
                transformed: centroid
            };
        }
    ];


    return Mesh;


    function _mixColor(colors) {
        var mix = [0.0, 0.0, 0.0];
        var n = colors.length;
        var count = 0;
        var color;

        for (var i = 0; i < n; i++) {
            color = colors[i];
            if (color) {
                count++;
                mix[0] += color[0];
                mix[1] += color[1];
                mix[2] += color[2];
            }
        }

        var nth = 1 / count;
        mix[0] = mix[0] * nth;
        mix[1] = mix[1] * nth;
        mix[2] = mix[2] * nth;

        return mix;
    }

    function _positionGetter(points) {
        var getter;
        if (typeof(points) === 'function') {
            getter = points;
        }
        else {
            getter = function (parameters, t) {
                return points[parameters[0]][parameters[1]];
            };
        }
        return getter;
    }

    function _colorGetter(colors, color) {
        var getter;
        if (typeof(colors) === 'function') {
            getter = function (parameters, t) {
                return _repairColor(colors(parameters, t));
            };
        }
        else if (colors) {
            getter = function (parameters, t) {
                return _repairColor(colors[parameters[0]][parameters[1]]);
            };
        }
        else if (color) {
            color = _repairColor(color);
            getter = function (parameters, t) {
                return color;
            };
        }
        return getter;
    }

    function _placementPropertyGetter(property, repairer) {
        var getter;
        if (typeof(property) === 'function') {
            if (repairer) {
                getter = function (t) {
                    return repairer(property());
                };
            }
            else {
                getter = property;
            }
        }
        else {
            if (repairer) {
                property = repairer(property);
            }
            getter = function (t) {
                return property;
            };
        }
        return getter;
    }

    function _parentPlacementGetter(placement) {
        /*
        The thing is first scaled from its own origin.
        Then it is orientated about its own origin.
        Then its origin is translated to a position in the parent map.
        */
        var getter;
        placement = placement || {};

        if (typeof(placement) === 'function') {
            getter = placement;
        }
        else if (placement.forEach && placement.length === 4) {
            getter = function (t) {
                return placement;
            };
        }
        else {
            var getScale = _placementPropertyGetter(placement.scale);
            var getOrientation = _placementPropertyGetter(placement.orientation);
            var getPosition = _placementPropertyGetter(placement.position);
            getter = function (t) {
                var matrix = null;
                matrix = Tpot.Transform3d.scalingMatrix(getScale(t)).x(matrix);
                matrix = Tpot.Transform3d.eulerRotationMatrix(getOrientation(t)).x(matrix);
                matrix = Tpot.Transform3d.translationMatrix(getPosition(t)).x(matrix);
                return matrix;
            };
        }

        return getter;
    }

    function _repairColor(color) {
        color = color || [0.0, 0.0, 0.0, 1.0, 0.0];
        color[3] = typeof(color[3]) !== 'undefined' ? color[3] : 1.0;
        color[4] = typeof(color[4]) !== 'undefined' ? color[4] : 1.0;
        return color;
    }

    function _parentColorGetter(color) {
        return _placementPropertyGetter(color, _repairColor);
    }

    function _build(mesh, map) {
        var i;
        var n;
        var item;

        mesh.all = [];
        mesh.surfaces = [];
        mesh.facets = [];
        mesh.tiles = [];
        mesh.vertices = [];
        mesh.lines = [];
        mesh.centroids = {};
        mesh.centroids.lines = [];
        mesh.centroids.tiles = [];
        mesh.centroids.facets = [];
        mesh.atoms = [];
        mesh.map = _buildMap(mesh, map);
        mesh.centroids.all = mesh.centroids.lines.concat(mesh.centroids.tiles).concat(mesh.centroids.facets);

        mesh.resettables = [];
        for (i = 0, n = mesh.all.length; i < n; i++) {
            item = mesh.all[i];
            if (item.reset) {
                mesh.resettables.push(item);
            }
        }
    }

    function _buildMap(mesh, inMap) {
        var copyMap = {};
        copyMap.things = {};

        Object.keys(inMap.things).forEach(function (name) {
            var inThing = inMap.things[name];

            var childThing = {
                getPlacement: _parentPlacementGetter(inThing.placement),
                getColor: _parentColorGetter(inThing.color)
            };
            copyMap.things[name] = childThing;

            if (inThing.map) {
                childThing.map = _buildMap(mesh, inThing.map);
            }
            else {
                childThing.surface = _buildSurface(mesh, inThing.surface);
                mesh.surfaces.push(childThing.surface);
                mesh.atoms = mesh.atoms.concat(childThing.surface.atoms.list);
                childThing.surface.faces.forEach(function (face) {
                    mesh.vertices = mesh.vertices.concat(face.vertices.list);
                    mesh.all = mesh.all.concat(face.vertices.list);
                    mesh.lines = mesh.lines.concat(face.vertices.lines);
                    mesh.all = mesh.all.concat(face.vertices.lines);
                    mesh.centroids.lines = mesh.centroids.lines.concat(face.vertices.centroids);
                    mesh.all = mesh.all.concat(face.vertices.centroids);
                    mesh.tiles = mesh.tiles.concat(face.tiles.list);
                    mesh.all = mesh.all.concat(face.tiles.list);
                    mesh.centroids.tiles = mesh.centroids.tiles.concat(face.tiles.centroids);
                    mesh.all = mesh.all.concat(face.tiles.centroids);
                    mesh.facets = mesh.facets.concat(face.facets.list);
                    mesh.all = mesh.all.concat(face.facets.list);
                    mesh.centroids.facets = mesh.centroids.facets.concat(face.facets.centroids);
                    mesh.all = mesh.all.concat(face.facets.centroids);
                });
            }
        }, this);

        return copyMap;
    }

    function _buildSurface(mesh, surface) {
        var copySurface = {};

        copySurface.parameters = [
            {
                count: surface.parameters[0].count,
                isClosed: surface.parameters[0].isClosed
            },
            {
                count: surface.parameters[1].count,
                isClosed: surface.parameters[1].isClosed
            }
        ];

        copySurface.getPosition = _positionGetter(surface.points);
        copySurface.getFrontColor = _colorGetter(surface.frontColors, surface.frontColor);
        copySurface.getBackColor = _colorGetter(surface.backColors, surface.backColor);

        copySurface.atoms = _buildAtoms(copySurface);

        copySurface.faces = [];
        if (copySurface.getFrontColor) {
            copySurface.faces.push(_buildFace(copySurface, true));
        }
        if (copySurface.getBackColor) {
            copySurface.faces.push(_buildFace(copySurface, false));
        }

        return copySurface;
    }

    function _buildFace(surface, isFront) {
        var face = {};
        face.parameters = surface.parameters;
        face.points = _buildPoints(surface, isFront);
        face.vertices = _buildVertices(face);
        face.tiles = _buildTiles(face);
        face.facets = _buildfacets(face);

        return face;
    }

    function _buildAtoms(surface) {
        var n0 = surface.parameters[0].count;
        var n1 = surface.parameters[1].count;
        var row;
        var atom;

        var atomMatrix = new Array(n0);    // atoms in the surface
        var atomList = [];                  // flat list of atoms

        for (var i0 = 0; i0 < n0; i0++) {
            row = atomMatrix[i0] = new Array(n1);
            for (var i1 = 0; i1 < n1; i1++) {
                atom = row[i1] = new Atom([i0, i1], surface);
                atomList.push(atom);
            }
        }

        return {
            matrix: atomMatrix,
            list: atomList
        };
    }

    function _buildPoints(surface, isFront) {
        var atoms = surface.atoms.matrix;
        var n0 = surface.parameters[0].count;
        var n1 = surface.parameters[1].count;

        var pointMatrix = new Array(n0);
        var pointRow;

        for (var i0 = 0; i0 < n0; i0++) {
            pointRow = pointMatrix[i0] = new Array(n1);
            for (var i1 = 0; i1 < n1; i1++) {
                if (isFront) {
                    pointRow[i1] = {
                        position: atoms[i0][i1].position,
                        color: atoms[i0][i1].frontColor
                    };
                }
                else {
                    pointRow[i1] = {
                        position: atoms[i0][n1 - i1 - 1].position,
                        color: atoms[i0][n1 - i1 - 1].backColor
                    };
                }
            }
        }

        return {
            matrix: pointMatrix
        };
    }

    function _buildVertices(face) {
        var points = face.points.matrix;
        var p0 = face.parameters[0];
        var p1 = face.parameters[1];
        var nP0 = p0.count;
        var nP1 = p1.count;
        var n0 = p0.count + (p0.isClosed ? 1 : 0);  // loop for one extra if the face is closed in this parameter
        var n1 = p1.count + (p1.isClosed ? 1 : 0);  // loop for one extra if the face is closed in this parameter

        var verticesRow;
        var vertex;
        var line;

        var vertexMatrix = new Array(nP0);    // vertices for each point in the face
        var vertexList = [];                  // flat list of vertices
        var lines = [];                     // flat list of lines
        var centroidList = [];              // flat list of centroid points

        // for each point determine the 2 forward-pointing lines eminating from it
        for (var i0 = 0; i0 < n0; i0++) {
            var iP0 = i0 % nP0;
            var jP0 = iP0 + 1;
            jP0 = p0.isClosed ? jP0 % p0.count : jP0;
            verticesRow = vertexMatrix[i0] = vertexMatrix[iP0] || new Array(nP1);
            for (var i1 = 0; i1 < n1; i1++) {
                var iP1 = i1 % nP1;
                var jP1 = iP1 + 1;
                jP1 = p1.isClosed ? jP1 % p1.count : jP1;
                vertex = verticesRow[i1] = vertexMatrix[iP0][iP1];     // if we've looped for one extra then the indexes will have looped back to zero

                if (!vertex) {
                    vertex = verticesRow[i1] = {
                        type: ITEM_TYPE.VERTEX,
                        point: points[iP0][iP1],
                        edges: []
                    };
                    if (points[jP0]) {
                        line = new Line([
                            points[iP0][iP1],
                            points[jP0][iP1]
                        ]);
                        vertex.edges[0] = new Edge(vertex, 0, line);
                        lines.push(line);
                        centroidList.push(line.centroid);
                    }
                    if (points[iP0][jP1]) {
                        line = new Line([
                            points[iP0][iP1],
                            points[iP0][jP1]
                        ]);
                        vertex.edges[1] = new Edge(vertex, 1, line);
                        lines.push(line);
                        centroidList.push(line.centroid);
                    }
                    vertexList.push(vertex);
                }
            }
        }

        return {
            matrix: vertexMatrix,
            list: vertexList,
            lines: lines,
            centroids: centroidList
        };
    }

    function _buildTiles(face) {

        var vertices = face.vertices.matrix;
        var p0 = face.parameters[0];
        var p1 = face.parameters[1];
        var i0;
        var n0 = vertices.length - 1;
        var i1;
        var n1 = vertices[0].length - 1;

        var tilesRow;
        var tile;

        var tileMatrix = new Array(n0);     // tiles in the face
        var tileList = [];                  // flat list of tiles
        var centroidList = [];              // flat list of centroid points

        // add each tile with it's corresponding 4 bounding edges
        for (i0 = 0; i0 < n0; i0++) {
            tilesRow = tileMatrix[i0] = new Array(n1);
            for (i1 = 0; i1 < n1; i1++) {

                tile = {
                    type: ITEM_TYPE.TILE,
                    points: [
                        vertices[i0][i1].edges[1].line.points[1],
                        vertices[i0][i1].edges[1].line.points[0],
                        vertices[i0 + 1][i1].edges[1].line.points[0],
                        vertices[i0 + 1][i1].edges[1].line.points[1]
                    ]
                };
                tile.edges = [
                    new Edge(tile, 0, vertices[i0][i1].edges[1].line),
                    new Edge(tile, 1, vertices[i0][i1].edges[0].line),
                    new Edge(tile, 2, vertices[i0 + 1][i1].edges[1].line),
                    new Edge(tile, 3, vertices[i0][i1 + 1].edges[0].line)
                ];
                tile.centroid = new Centroid(tile, [tile.edges[0].line.centroid, tile.edges[2].line.centroid]);

                tilesRow[i1] = tile;
                tileList.push(tile);
                centroidList.push(tile.centroid);
            }
        }

        // for each tile add it's 4 neighbouring tiles
        for (i0 = 0; i0 < n0; i0++) {
            tilesRow = tileMatrix[i0];

            var i0Minus = i0 - 1;
            var i0Plus = i0 + 1;
            if (p0.isClosed) {
                i0Minus = i0Minus % n0;
                i0Plus = i0Plus % n0;
            }

            for (i1 = 0; i1 < n1; i1++) {
                tile = tilesRow[i1];

                var i1Minus = i1 - 1;
                var i1Plus = i1 + 1;
                if (p1.isClosed) {
                    i1Minus = i1Minus % n1;
                    i1Plus = i1Plus % n1;
                }

                tilesRow[i1].tiles = [
                    tileMatrix[i0][i1Minus],
                    tileMatrix[i0][i1Plus],
                    tileMatrix[i0Minus] ? tileMatrix[i0Minus][i1] : undefined,
                    tileMatrix[i0Plus] ? tileMatrix[i0Plus][i1] : undefined
                ];
            }
        }

        return {
            matrix: tileMatrix,
            list: tileList,
            centroids: centroidList
        };
    }

    function _buildfacets(face) {
        var tiles = face.tiles.list;
        var facetList = [];                  // flat list of facets
        var centroidList = [];              // flat list of centroid points
        var facet;
        var tile;
        var iTile;
        var nTile = tiles.length;
        var lines = [];
        var line;
        var id = 0;

        for (iTile = 0; iTile < nTile; iTile++) {
            tile = tiles[iTile];
            var nPoint = tile.points.length;
            tile.facets = new Array(nPoint);
            for (var iPoint = 0; iPoint < nPoint; iPoint++) {

                line = new Line([
                    tile.centroid,
                    tile.points[iPoint]
                ]);
                line.isInterpolation = true;

                facet = {
                    type: ITEM_TYPE.facet,
                    id: id++,
                    sequence: iPoint,
                    points: [
                        tile.centroid,
                        tile.points[iPoint],
                        tile.points[(iPoint + 1) % nPoint]
                    ],
                    normal: new Point()
                };
                facet.edges = [
                    new Edge(facet, 0, tile.edges[iPoint].line),
                    new Edge(facet, 1, line)
                ];
                facet.centroid = new Centroid(facet, facet.points);

                line.facets[0] = facet;

                tile.facets[iPoint] = facet;
                facetList.push(facet);
                centroidList.push(facet.centroid);
            }
        }

        return {
            list: facetList,
            centroids: centroidList
        };
    }

    function _reset(resettables) {
        for (var i = 0, n = resettables.length; i < n; i++) {
            resettables[i].reset();
        }
    }

    function _evaluate(mesh, t) {
        _reset(mesh.resettables);
        _evaluateAtoms(mesh.atoms, t);
    }

    function _evaluateAtoms(atoms, t) {
        for (var i = 0, n = atoms.length; i < n; i++) {
            atoms[i].evaluate(t);
        }
    }

    function _transform(mesh, transform, t) {
        var defaultColor = [0.0, 0.0, 0.0, 1.0, 0.0];
        _createMapTransform(mesh.map, transform, defaultColor, t);
        _transformAtoms(mesh.atoms);
    }

    function _createMapTransform(map, parentTransform, parentColorMix, t) {
        Object.keys(map.things).forEach(function (name) {
            var thing = map.things[name];
            var transform = parentTransform.x(thing.getPlacement(t));
            var colormix = _mixColor([parentColorMix, thing.getColor(t)]);
            if (thing.map) {
                _createMapTransform(thing.map, transform, colormix, t);
            }
            else {
                thing.surface.transform = parentTransform;
                thing.surface.colormix = parentColorMix;
            }
        }, this);
    }

    function _transformAtoms(atoms) {
        for (var i = 0, n = atoms.length; i < n; i++) {
            atoms[i].transform();
        }
    }

    function _project(mesh, projection) {
        _projectAtoms(mesh.atoms, projection);
        _projectCentroids(mesh.centroids.all, projection);
        //_projectCentroids(mesh.centroids.lines, projection);
        //_projectCentroids(mesh.centroids.tiles, projection);
        //_projectCentroids(mesh.centroids.facets, projection);
    }

    function _projectAtoms(atoms, projection) {
        for (var i = 0, n = atoms.length; i < n; i++) {
            atoms[i].project(projection);
        }
    }

    function _projectCentroids(centroids, projection) {
        var centroid;
        var position;
        var color;
        for (var i = 0, n = centroids.length; i < n; i++) {
            centroid = centroids[i];

            position = centroid.position;
            position.projected = projection.xVector(position.transformed);

            color = centroid.color;
            color.projected = color.transformed;
        }
    }

}());


