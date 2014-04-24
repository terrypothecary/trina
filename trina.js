//==============================================================================
/*
this module plots any number of functions in one view
features include:
1) hidden line removal
2) parameter points may be closed loops
3) all, none or every nth parameter point plotted
4) outline plotting when not all parameter points are plotted
5) optinal perspective transformation
6) intersect lines are generated
*/
//==============================================================================
var Tpot = Tpot || {};

Tpot.Trina = function (visible, hidden) {
    this._constructor(visible, hidden);
};

Tpot.Trina.prototype = {
    _constructor: function (visible, hidden) {
        this.view3d = new Tpot.View3d(visible, hidden);
        this.view3d.setRenderer(this);
    },

    setMap: function (map) {
        return this.view3d.setMap(map);
    },

    setCamera: function (camera) {
        return this.view3d.setCamera(camera);
    },

    draw: function () {
        return this.view3d.draw();
    },

    render: function (mesh) {
        return this._renderMap(mesh);
    },

    _renderMap: function (mesh) {
//        var info = this._renderLines(mesh);
        this._processFacets(mesh);
        var info = [];
        //this._renderLines(mesh, info);
        this._renderFacets(mesh, info);
        return info;
    },

    _tiles: function () {

    },

    _renderLines: function (mesh, info) {
        var lines = mesh.lines;
        for (var i = 0, n = lines.length; i < n; i++) {
            var line = lines[i];
            info.push({
                type: 'L',
                color: line.centroid.color.projected,
                points: [
                    {
                        x: line.points[0].position.projected[0],
                        y: line.points[0].position.projected[1]
                    },
                    {
                        x: line.points[1].position.projected[0],
                        y: line.points[1].position.projected[1]
                    }
                ]
            });
        }
    },

    _renderTiles: function (mesh, info) {
        var tiles = mesh.tiles;
        tiles.sort(this._orderFacets);
        for (var i = 0, n = tiles.length; i < n; i++) {
            var tile = tiles[i];
            info.push({
                type: 'Q',
                color: tile.centroid.color.projected,
                points: [
                    {
                        x: tile.points[0].position.projected[0],
                        y: tile.points[0].position.projected[1]
                    },
                    {
                        x: tile.points[1].position.projected[0],
                        y: tile.points[1].position.projected[1]
                    },
                    {
                        x: tile.points[3].position.projected[0],
                        y: tile.points[3].position.projected[1]
                    },
                    {
                        x: tile.points[2].position.projected[0],
                        y: tile.points[2].position.projected[1]
                    }
                ]
            });
        }
    },

    _renderFacets: function (mesh, info) {
        var facets = mesh.facets;
        facets.sort(this._orderFacets);
        for (var i = 0, n = facets.length; i < n; i++) {
            var facet = facets[i];
            var color = this._shade(facet.centroid.color.projected, 0.5 + this._dot(facet.normal, [0.28, 0.28, -0.28]));

            var faceSide = this._faceSide(
                this._delta([facet.points[0].position.projected, facet.points[1].position.projected]),
                this._delta([facet.points[0].position.projected, facet.points[2].position.projected])
            );

            if (faceSide > 0) {
                info.push({
                    type: 'T',
                    color: color,
                    points: [
                        {
                            x: facet.points[0].position.projected[0],
                            y: facet.points[0].position.projected[1]
                        },
                        {
                            x: facet.points[1].position.projected[0],
                            y: facet.points[1].position.projected[1]
                        },
                        {
                            x: facet.points[2].position.projected[0],
                            y: facet.points[2].position.projected[1]
                        }
                    ]
                });
            }

        }
    },

    _processFacets: function (mesh) {
        var facets = mesh.facets;
        for (var i = 0, n = facets.length; i < n; i++) {
            var facet = facets[i];
            facet.normal = this._normal(
                this._delta([facet.points[0].position.transformed, facet.points[1].position.transformed]),
                this._delta([facet.points[0].position.transformed, facet.points[2].position.transformed])
            );
        }
    },

    _orderFacets: function (a, b) {
        return b.centroid.position.transformed[2] - a.centroid.position.transformed[2];
    },

    _delta: function (points) {
        return [points[1][0] - points[0][0], points[1][1] - points[0][1], points[1][2] - points[0][2]];
    },

    _normal: function (v1, v2) {
        var i = (v1[1] * v2[2] - v1[2] * v2[1]);
        var j = (v1[2] * v2[0] - v1[0] * v2[2]);
        var k = (v1[0] * v2[1] - v1[1] * v2[0]);
        var n = [
            i,
            j,
            k
        ];
        return this._unit(n);
    },

    _faceSide: function (v1, v2) {
        return -(v1[0] * v2[1] - v1[1] * v2[0]);
    },

    _unit: function (v) {
        var d = 1 / Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [
            v[0] * d,
            v[1] * d,
            v[2] * d
        ];
    },

    _dot: function (va, vb) {
        return va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
    },

    _shade: function (color, shade) {
        return [color[0] * shade, color[1] * shade, color[2] * shade];
    },

    xrender: function (surfaces) {

/*
C
C MXP1=MAX I-PAR, MXP2=MAX J-PAR, MXF=MAX NUMBER OF FUNCTIONS
C MISC=MAX NUMBER OF TILE INTERSECTS PER LINE
      PARAMETER(MXP1=101,MXP2=101,MXF=10,MISC=101)
      REAL VALX(MXP1,MXP2,MXF),VALY(MXP1,MXP2,MXF),VALZ(MXP1,MXP2,MXF)
      INTEGER ISKIP(MXF),JSKIP(MXF)
      INTEGER ILOOP(MXF),JLOOP(MXF)
      INTEGER NX(MXF),NY(MXF)
      DIMENSION RLOW(MXP1-1),RHIG(MXP1-1),RPNT((MXP1-1)*2)
      DIMENSION XISC(MISC),YISC(MISC),ZISC(MISC),ITIL(MISC),JTIL(MISC)
      DIMENSION IFUN(MISC)
      DIMENSION XISC2(11) ,YISC2(11) ,ZISC2(11) ,ITIL2(11) ,JTIL2(11)
C
C INITIALIZE "PLOT10" GRAPHICS PACKAGE
      CALL INITT(960)
      CALL PLINIT(0)
      CALL TERM(3,4096)
      CALL PLON
C
C READ IN VEIWPORT LIMITS AND SPACE VIEWING POSITION
C IF IPERSP=1 THEN DRAW VIEW IN PERSPECTIVE
C IF ICROSS=1 THEN DRAW CROSS HAIRS ON WINDOW
C IF IBOARD=1 THEN DRAW BOARDER AROUND WINDOW
      D2R=ATAN(1.0)/45.0
      READ(1,*) XLO,XHI,YLO,YHI
      READ(1,*) THETA,PHI,PSI
      THETA = THETA * D2R
      PHI   = PHI   * D2R
      PSI   = PSI   * D2R
      READ(1,*) IBOARD,ICROSS,IPERSP
      IF(IPERSP.EQ.1) THEN
        READ(1,*) XPOS,YPOS,ZPOS,HFIELD
        HFIELD= TAN(HFIELD*D2R*0.5)
        VFIELD= HFIELD/(XHI-XLO) * (YHI-YLO)
      ENDIF
C
C READ IN THE VERTICES OF THE CARPET FUNCTIONS AND TRANSFORM THEM
      NF=0
      IFIRST=1
   10 CONTINUE
      NF=NF+1
      READ(1,*,END=90) NX(NF),NY(NF),ISKIP(NF),JSKIP(NF),
     &                 ILOOP(NF),JLOOP(NF)
      DO 20 IX=1,NX(NF)+1
      DO 20 IY=1,NY(NF)+1
   20   READ(1,*) VALX(IX,IY,NF),VALY(IX,IY,NF),VALZ(IX,IY,NF)

C
C ROTATE THE FUNCTION TO OBTAIN THE VIEWING ANGLES
C THIS IS DONE IN A SEPARATE LOOP TO ALLOW THE VALUES TO BE SCALED
C IF REQUIRED AT A LATER DATE
      DO 30 IX=1,NX(NF)+1
      DO 30 IY=1,NY(NF)+1
      X=VALX(IX,IY,NF)
      Y=VALY(IX,IY,NF)
      Z=VALZ(IX,IY,NF)
      CALL VIEW3D(X,Y,Z,XPOS,YPOS,ZPOS,THETA,PHI,PSI,X1,Y1,Z1)
      CALL PERSP(IPERSP,X1,Y1,Z1,HFIELD,VFIELD,XOT,YOT,ZOT)
      VALX(IX,IY,NF)=XOT
      VALY(IX,IY,NF)=YOT
      VALZ(IX,IY,NF)=ZOT
      CALL LIMITS(IFIRST,XOT,XMIN,XMAX)
      CALL LIMITS(IFIRST,YOT,YMIN,YMAX)
      IFIRST=0
   30 CONTINUE
      GOTO 10
   90 CONTINUE
      NF=NF-1
C
C DETERMINE THE VIRTUAL SPACE LIMITS AND SET UP VIEWPORT AND WINDOW
C LASER PRINTER LIMITS ARE X(0,4095), Y(0,3071)
      IF(IPERSP.EQ.1) THEN
        CALL TWINDO(NINT(XLO),NINT(XHI),NINT(YLO),NINT(YHI))
        CALL DWINDO(-1.0,1.0,-1.0,1.0)
      ELSE
        BOARD=0.01
        CALL VIEW(XMIN,XMAX,YMIN,YMAX,XLO,XHI,YLO,YHI,BOARD)
      ENDIF
      CALL NEWPAG
      IF(ICROSS.EQ.1) THEN
        XMI=(XHI+XLO)*0.5
        YMI=(YHI+YLO)*0.5
        CALL MOVABS(NINT(XMI),NINT(YMI)   )
        CALL DSHABS(NINT(XMI),NINT(YLO),16)
        CALL MOVABS(NINT(XMI),NINT(YMI)   )
        CALL DSHABS(NINT(XMI),NINT(YHI),16)
        CALL MOVABS(NINT(XMI),NINT(YMI)   )
        CALL DSHABS(NINT(XLO),NINT(YMI),16)
        CALL MOVABS(NINT(XMI),NINT(YMI)   )
        CALL DSHABS(NINT(XHI),NINT(YMI),16)
      ENDIF
      IF(IBOARD.EQ.1) THEN
        CALL MOVABS(NINT(XLO),NINT(YLO))
        CALL DRWABS(NINT(XLO),NINT(YHI))
        CALL DRWABS(NINT(XHI),NINT(YHI))
        CALL DRWABS(NINT(XHI),NINT(YLO))
        CALL DRWABS(NINT(XLO),NINT(YLO))
      ENDIF
C
C STEP THROUGH FUNCTIONS
      DO 80 IF=1,NF
*/
    surfaces.forEach(function (surface) {
      var p0 = surface.parameter[0];
      var p1 = surface.parameter[1];
/*
C
C STEP THROUGH THE LINE SEGMENTS
      IINC=0
      JINC=1
      DO 50 IPOS1=1,NX(IF)+1
*/
        // for each parameter0 loop through all parameter1
        for (var iP0 = 0, nP0 = p0.count; iP0 < nP0; iP0++) {
/*
      IDRAW=0
      DO 40 JPOS1=1,NY(IF)
*/
        for (var iP1 = 0, nP1 = p1.count; iP1 < nP1; iP1++) {
          var position = [ip0, ip1];
          var point = surface.points[iP0][iP1];

          this.outline(
            point,
            position

          );
/*
      CALL OUTLIN(
      VALX(1,1,IF),
      VALY(1,1,IF),
      NX(IF)+1,
      NY(IF)+1,
      MXP1,
      MXP2,
      IPOS1,
      JPOS1,
      JSKIP(IF),
      IINC,
      JINC,
      RLOW,
      RHIG,
      NRNG,
      ILOOP(IF),
      JLOOP(IF),
      IEDGE)


      SUBROUTINE OUTLIN(
      VALX,
      VALY,
      NP1,
      NP2,
      MXP1,
      MXP2,
      IPOS,
      JPOS,
      NSKIP,
      IINC,
      JINC,
      RLOW,
      RHIG,
      NRNG,
      ILOOP,
      JLOOP,
      IEDGE)


C***********************************************************************
C THIS SUBROUTINE DETERMINES WHICH PARTS OF THE LINE FROM (IPOS,JPOS)  *
C TO (IPOS+IINC,JPOS+JINC) IS PART OF AN OUTLINE. IF IEDGE IS 0 THEN   *
C NO PART OF THE LINE IS PART OF AN OUTLINE. THE LINE IS PARTIALLY     *
C OBSCURED BY USING THE OCCLUSION RANGE MECHANISM.                     *








      NRNG=0
      IEDGE=1
      NISC=0
      IF(ISKIP(IF).GT.0.AND.
     &  (ISKIP(IF).EQ.1.OR.MOD(IPOS1,ISKIP(IF)).EQ.1)) GOTO 45
C
C FIND THE LINE SEGMENTS THAT FORM THE OUTLINES
      CALL OUTLIN(VALX(1,1,IF),VALY(1,1,IF),NX(IF)+1,NY(IF)+1,MXP1,MXP2,
     &            IPOS1,JPOS1,JSKIP(IF),IINC,JINC,RLOW,RHIG,NRNG,
     &            ILOOP(IF),JLOOP(IF),IEDGE)
      IDRAW=0
   45 CONTINUE
C
C FIND THE LINE ENDS
      IPOS2=IPOS1+IINC
      JPOS2=JPOS1+JINC
      IPS=IPOS1-JINC
      JPS=JPOS1-IINC
      IF(IPS.EQ.0.AND.ILOOP(IF).EQ.1) IPS=NX(IF)
      IF(JPS.EQ.0.AND.JLOOP(IF).EQ.1) JPS=NY(IF)
      XL1=VALX(IPOS1,JPOS1,IF)
      YL1=VALY(IPOS1,JPOS1,IF)
      ZL1=VALZ(IPOS1,JPOS1,IF)
      DXL=VALX(IPOS2,JPOS2,IF)-XL1
      DYL=VALY(IPOS2,JPOS2,IF)-YL1
      DZL=VALZ(IPOS2,JPOS2,IF)-ZL1
C
C COLLECT OCCLUSION RANGES FOR LINE SEGMENT AGAINST ALL FUNCTIONS
      DO 47 IF1=1,NF
      CALL TILES(VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &           NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &           RLOW,RHIG,NRNG,IEDGE,
     &           1,NISC,XISC,YISC,ZISC,ITIL,JTIL,IFUN,IF,IF1,
     &           IF,IPOS1,JPOS1,IF,IPS,JPS)
   47 CONTINUE
      IF(IEDGE.EQ.0) GOTO 49
C
C FIND VISIBLE END POINTS FROM SET OF RANGES
      CALL RLIMS(RPNT,NPNT,RLOW,RHIG,NRNG)
C
C ALTERNATE MOVE-DRAW ALONG LINE BETWEEN VISIBLE POINTS
      CALL ALTERN(IDRAW,RPNT,NPNT,XL1,YL1,DXL,DYL)
   49 CONTINUE
C
C DEAL WITH GENERATED LINES OF INTERSECTION
      DO 52 I=1,NISC
        XL1=XISC(I)
        YL1=YISC(I)
        ZL1=ZISC(I)
        IF1=IFUN(I)
        CALL TILINT(VALX(1,1,IF),VALY(1,1,IF),VALZ(1,1,IF),
     &              NX(IF)+1,NY(IF)+1,MXP1,MXP2,
     &              VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &              NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,
     &              IPOS1,JPOS1,ITIL(I),JTIL(I),IINC,JINC,
     &              NLINE,XISC2,YISC2,ZISC2,ITIL2,JTIL2)
        DO 54 ILINE=1,NLINE
          IDRAW=0
          NRNG=0
          DXL=XISC2(ILINE)-XL1
          DYL=YISC2(ILINE)-YL1
          DZL=ZISC2(ILINE)-ZL1
          DO 56 IF1=1,NF
           CALL TILES(VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &           NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &           RLOW,RHIG,NRNG,1,
     &           0,NISC,XISC,YISC,ZISC,ITIL,JTIL,IFUN,IF,IF1,
     &           IFUN(I),ITIL(I),JTIL(I),IF,ITIL2(ILINE),JTIL2(ILINE))
   56     CONTINUE
          CALL RLIMS(RPNT,NPNT,RLOW,RHIG,NRNG)
          CALL ALTERN(IDRAW,RPNT,NPNT,XL1,YL1,DXL,DYL)
   54   CONTINUE
        IDRAW=0
   52 CONTINUE
C
   40 CONTINUE
*/
        }
/*
   50 CONTINUE
*/
        }
/*
C
      IINC=1
      JINC=0
      DO 70 JPOS1=1,NY(IF)+1
      IDRAW=0
      DO 60 IPOS1=1,NX(IF)
      NRNG=0
      IEDGE=1
      NISC=0
      IF(JSKIP(IF).GT.0.AND.
     &  (JSKIP(IF).EQ.1.OR.MOD(JPOS1,JSKIP(IF)).EQ.1)) GOTO 65
C
C FIND THE LINE SEGMENTS THAT FORM THE OUTLINES
      CALL OUTLIN(VALX(1,1,IF),VALY(1,1,IF),NX(IF)+1,NY(IF)+1,MXP1,MXP2,
     &            IPOS1,JPOS1,ISKIP(IF),IINC,JINC,RLOW,RHIG,NRNG,
     &            ILOOP(IF),JLOOP(IF),IEDGE)
      IDRAW=0
   65 CONTINUE
C
C FIND THE LINE ENDS
      IPOS2=IPOS1+IINC
      JPOS2=JPOS1+JINC
      IPS=IPOS1-JINC
      JPS=JPOS1-IINC
      IF(IPS.EQ.0.AND.ILOOP(IF).EQ.1) IPS=NX(IF)
      IF(JPS.EQ.0.AND.JLOOP(IF).EQ.1) JPS=NY(IF)
      XL1=VALX(IPOS1,JPOS1,IF)
      YL1=VALY(IPOS1,JPOS1,IF)
      ZL1=VALZ(IPOS1,JPOS1,IF)
      DXL=VALX(IPOS2,JPOS2,IF)-XL1
      DYL=VALY(IPOS2,JPOS2,IF)-YL1
      DZL=VALZ(IPOS2,JPOS2,IF)-ZL1
C
C COLLECT OCCLUSION RANGES FOR LINE SEGMENT AGAINST ALL FUNCTIONS
      DO 67 IF1=1,NF
      CALL TILES(VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &           NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &           RLOW,RHIG,NRNG,IEDGE,
     &           1,NISC,XISC,YISC,ZISC,ITIL,JTIL,IFUN,IF,IF1,
     &           IF,IPOS1,JPOS1,IF,IPS,JPS)
   67 CONTINUE
      IF(IEDGE.EQ.0) GOTO 69
C
C FIND VISIBLE END POINTS FROM SET OF RANGES
      CALL RLIMS(RPNT,NPNT,RLOW,RHIG,NRNG)
C
C ALTERNATE MOVE-DRAW ALONG LINE BETWEEN VISIBLE POINTS
      CALL ALTERN(IDRAW,RPNT,NPNT,XL1,YL1,DXL,DYL)
   69 CONTINUE
C
C DEAL WITH GENERATED LINES OF INTERSECTION
      DO 72 I=1,NISC
        XL1=XISC(I)
        YL1=YISC(I)
        ZL1=ZISC(I)
        IF1=IFUN(I)
        CALL TILINT(VALX(1,1,IF),VALY(1,1,IF),VALZ(1,1,IF),
     &              NX(IF)+1,NY(IF)+1,MXP1,MXP2,
     &              VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &              NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,
     &              IPOS1,JPOS1,ITIL(I),JTIL(I),IINC,JINC,
     &              NLINE,XISC2,YISC2,ZISC2,ITIL2,JTIL2)
        DO 74 ILINE=1,NLINE
          IDRAW=0
          NRNG=0
          DXL=XISC2(ILINE)-XL1
          DYL=YISC2(ILINE)-YL1
          DZL=ZISC2(ILINE)-ZL1
          DO 76 IF1=1,NF
           CALL TILES(VALX(1,1,IF1),VALY(1,1,IF1),VALZ(1,1,IF1),
     &           NX(IF1)+1,NY(IF1)+1,MXP1,MXP2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &           RLOW,RHIG,NRNG,1,
     &           0,NISC,XISC,YISC,ZISC,ITIL,JTIL,IFUN,IF,IF1,
     &           IFUN(I),ITIL(I),JTIL(I),IF,ITIL2(ILINE),JTIL2(ILINE))
   76     CONTINUE
          CALL RLIMS(RPNT,NPNT,RLOW,RHIG,NRNG)
          CALL ALTERN(IDRAW,RPNT,NPNT,XL1,YL1,DXL,DYL)
   74   CONTINUE
        IDRAW=0
   72 CONTINUE
C
   60 CONTINUE
   70 CONTINUE
      WRITE(*,1000) IF
 1000 FORMAT(' DONE ',I2)
   80 CONTINUE
*/
    });
/*
C
C EMPTY BUFFER
      CALL TSEND
      END
      SUBROUTINE TILES(VALX,VALY,VALZ,NPAR1,NPAR2,MXP1,MXP2,
     &                 XL1,YL1,ZL1,DXL,DYL,DZL,RLOW,RHIG,NRNG,IEDGE,
     &                 ISC,NISC,XISC,YISC,ZISC,ITIL,JTIL,IFUN,IF,IF1,
     &                 IFUN1,ITIL1,JTIL1,IFUN2,ITIL2,JTIL2)
C***********************************************************************
C THIS SUBROUTINE CHECKS THROUGH EVERY CARPET TILE TO PRODUCE A LIST   *
C OF OCCLUSION RANGES ON THE LINE SEGMENT (L1 TO L2).                  *
C----------------------------------------------------------------------*
C THIS SUBROUTINE CALLS:                                               *
C 1) INTERS                                                            *
C 2) SAMEZ                                                             *
C***********************************************************************
C
      DIMENSION VALX(MXP1,MXP2),VALY(MXP1,MXP2),VALZ(MXP1,MXP2)
      DIMENSION RLOW(*),RHIG(*)
C
      DIMENSION RP(4),SP(4),ZD(4),PVAL(8),PVALA(100)
      DIMENSION XISC(*),YISC(*),ZISC(*),ITIL(*),JTIL(*),IFUN(*)
      DIMENSION INCX1(4),INCY1(4),INCX2(4),INCY2(4),INCX3(4),INCY3(4)
      DATA INCX1/0,1,1,0/ INCY1/0,0,1,1/
      DATA INCX2/0,1,0,0/ INCY2/0,0,1,0/
      DATA INCX3/1,1,1,0/ INCY3/0,1,1,1/
      DATA SP/0.0,0.0,1.0,1.0/
C
C EVALUATE PVALS FOR EDGE OF CARPET
      DO 4 K=1,NPAR2
    4   PVALA(K)=(VALY(1,K)-YL1)*DXL - (VALX(1,K)-XL1)*DYL
C
C CHECK THROUGH EVERY CARPET TILE
      DO 40 I=1,NPAR1-1
        PVAL(3) = (VALY(I+1,1)-YL1)*DXL - (VALX(I+1,1)-XL1)*DYL
        PVAL(4) = PVALA(1)
        PVALA(1)= PVAL(3)
      DO 40 J=1,NPAR2-1
C
C ASSIGN LINE-RESPECTIVE VALUES TO THE 4 CORNERS OF THE TILES
C USING PREVIOUSLY CALCULATED VALUES TO SPEED THINGS UP.
        PVAL(1) = PVAL(4)
        PVAL(2) = PVAL(3)
        PVAL(3) = (VALY(I+1,J+1)-YL1)*DXL - (VALX(I+1,J+1)-XL1)*DYL
        PVAL(4) = PVALA(J+1)
        PVAL(5) = PVAL(1)
        PVAL(6) = PVAL(2)
        PVALA(J+1) = PVAL(3)
C
C IF TILE IS TRANSPARENT THEN IGNORE IT
      IF(IF1.EQ.IFUN1.AND.I.EQ.ITIL1.AND.J.EQ.JTIL1) GOTO 40
      IF(IF1.EQ.IFUN2.AND.I.EQ.ITIL2.AND.J.EQ.JTIL2) GOTO 40
C
C IF TILE LIES ENTIRELY TO ONE SIDE OF THE LINE THEN IT IS IGNORED
        IF(PVAL(1).GT.0.0.AND.PVAL(2).GT.0.0.AND.
     &     PVAL(3).GT.0.0.AND.PVAL(4).GT.0.0) GOTO 40
        IF(PVAL(1).LT.0.0.AND.PVAL(2).LT.0.0.AND.
     &     PVAL(3).LT.0.0.AND.PVAL(4).LT.0.0) GOTO 40
C
C FIND THE INTERSECT POINTS OF THE TILE ON THE LINE
        NINT=0
        DO 20 K=1,4
          L=K+1
          IF(PVAL(K).GT.0.0.AND.PVAL(L).GE.0.0) GOTO 20
          IF(PVAL(K).LT.0.0.AND.PVAL(L).LE.0.0) GOTO 20
C
          XT1=VALX(I+INCX2(K),J+INCY2(K))
          YT1=VALY(I+INCX2(K),J+INCY2(K))
          ZT1=VALZ(I+INCX2(K),J+INCY2(K))
          XT2=VALX(I+INCX3(K),J+INCY3(K))
          YT2=VALY(I+INCX3(K),J+INCY3(K))
          ZT2=VALZ(I+INCX3(K),J+INCY3(K))
          CALL INTERS(XL1,YL1,ZL1,DXL,DYL,DZL,
     &                XT1,YT1,ZT1,XT2,YT2,ZT2,DZ,SP(K),R)
          NINT=NINT+1
          RP(NINT)=R
          ZD(NINT)=DZ
   20   CONTINUE
   25   CONTINUE
C
C EXCEPTION CONDITIONS
      IF(NINT.LT.2) GOTO 40
C
C SORT THE RP'S INTO ASCENDING ORDER
      DO 30 K=1,NINT-1
      DO 30 L=1,NINT-K
      M=L+1
        IF(RP(L).GT.RP(M)) THEN
          RPTEMP=RP(L)
          RP(L) =RP(M)
          RP(M) =RPTEMP
          ZDTEMP=ZD(L)
          ZD(L) =ZD(M)
          ZD(M) =ZDTEMP
        ENDIF
   30 CONTINUE
      IF(NINT.EQ.3) THEN
        NINT=2
        RP(2)=RP(3)
        ZD(2)=ZD(3)
      ENDIF
C
C LOOP IF MORE THAN 1 RANGE (NINT=4)
      DO 40 IL=1,NINT-1,2
        IH=IL+1
C
C DISCOUNT TILE IF BOTH R'S LIE TO THE SAME SIDE AND OFF THE LINE
        IF(RP(IL).LE.0.0.AND.RP(IH).LE.0.0) GOTO 40
        IF(RP(IL).GE.1.0.AND.RP(IH).GE.1.0) GOTO 40
C
C NOT AN OCCLUSION RANGE IF TILE IS BEHIND LINE
        IF(ZD(IL).LT.0.0.AND.ZD(IH).LT.0.0) GOTO 40
C
C IF TILE ENTIRELY OBSCURING LINE THEN SKIP SAMEZ
        IF(ZD(IL).GT.0.0.AND.ZD(IH).GT.0.0) GOTO 35
C
C IF LINE LIES ON THE TILE THEN IT IS NOT OBSCURED
        IF(ZD(IL).EQ.ZD(IH)) GOTO 40
C
C IF LINE PASSES TROUGH CARPET TILE THEN UPDATE MIN AND MAX R
        CALL SAMEZ(RP(IL),RP(IH),ZD(IL),ZD(IH),R)
        IF(ISC.EQ.1.AND.IF.NE.IF1.AND.R.GE.0.0.AND.R.LE.1.0) THEN
          NISC=NISC+1
          XISC(NISC)=XL1+R*DXL
          YISC(NISC)=YL1+R*DYL
          ZISC(NISC)=ZL1+R*DZL
          ITIL(NISC)=I
          JTIL(NISC)=J
          IFUN(NISC)=IF1
        ENDIF
C
C IF LINE TOUCHES TILE BUT IS IN FRONT THEN IT IS NOT OBSCURED
C BUT THE ROUTINE SAMEZ HAS TO BE CALLED TO ENABLE INTERSECTS TO DRAWN
        IF(ZD(IL).EQ.0.0.AND.ZD(IH).LT.0.0) GOTO 40
        IF(ZD(IL).LT.0.0.AND.ZD(IH).EQ.0.0) GOTO 40
   35   CONTINUE
C
C ADD VALUES OF R TO THE LIST OF OCCLUSION RANGES
        IF(IEDGE.EQ.0) GOTO 40
        CALL ADDRNG(RLOW,RHIG,NRNG,RP(IL),RP(IH))
C
C END OF CARPET TILE GO ON TO NEXT
   40 CONTINUE
   50 CONTINUE
C
      RETURN
      END
      SUBROUTINE OUTLIN(
      VALX,     x values
      VALY,     y values
      NP1,      number of p1 + 1
      NP2,      number of p2 + 1
      MXP1,     max number of p1
      MXP2,     max number of p2
      IPOS,     current p1 index
      JPOS,     current p2 index
      NSKIP,    skip nth line
      IINC,     to increment p1
      JINC,     or increment p2
      RLOW,
      RHIG,
      NRNG,
      ILOOP,
      JLOOP,
      IEDGE)
C***********************************************************************
C THIS SUBROUTINE DETERMINES WHICH PARTS OF THE LINE FROM (IPOS,JPOS)  *
C TO (IPOS+IINC,JPOS+JINC) IS PART OF AN OUTLINE. IF IEDGE IS 0 THEN   *
C NO PART OF THE LINE IS PART OF AN OUTLINE. THE LINE IS PARTIALLY     *
C OBSCURED BY USING THE OCCLUSION RANGE MECHANISM.                     *
C***********************************************************************
C
      DIMENSION VALX(MXP1,MXP2),VALY(MXP1,MXP2)
      DIMENSION RLOW(*),RHIG(*)
      DIMENSION R(8),PV(2,0:3)
      DIMENSION VX(2,0:3),VY(2,0:3)
      REAL IX(2,0:3,0:1)/-1,+1,-1,+1,-1,+1,-1,+1,
     *                   -1,-1,+0,+0,+1,+1,+2,+2/
      REAL RSET(8) /-1.,-1.,-1.,-1.,-1.,-1.,+2.,+2./
      REAL J1A(0:3)/-1,+0,+1,+2/
      REAL J2A(0:3)/-1,-1,+1,+1/
      REAL J5A(0:3)/+0,+0,+1,+1/
C
      IEDGE=0
C
C FIND THE END POINTS OF THE LINE IN QUESTION
      XL1=VALX(IPOS,JPOS)
      YL1=VALY(IPOS,JPOS)
      DXL=VALX(IPOS+IINC,JPOS+JINC)-XL1
      DYL=VALY(IPOS+IINC,JPOS+JINC)-YL1
C
C IF AT LIMIT OF MATRIX, LINE IS NOT AN EDGE IF FUNCTION DOES NOT LOOP
      IF(IINC.EQ.1) THEN
        IF((JPOS.EQ.1.OR.JPOS.EQ.NP2).AND.JLOOP.EQ.0) GOTO 900
      ELSE
        IF((IPOS.EQ.1.OR.IPOS.EQ.NP1).AND.ILOOP.EQ.0) GOTO 900
      ENDIF
C
C FIND THE 4 SURROUNDING POINT VALUES USED TO DETERMINE WHICH PART OF
C THE LINE IS AN OUTLINE
        DO 5 K=1,2
        DO 5 L=1,2
          I=IPOS+IX(K,L,IINC)
          J=JPOS+IX(K,L,JINC)
          IF(I.LT.1  ) I=I+NP1-1
          IF(I.GT.NP1) I=I-NP1+1
          IF(J.LT.1  ) J=J+NP2-1
          IF(J.GT.NP2) J=J-NP2+1
          VX(K,L)=VALX(I,J)
          VY(K,L)=VALY(I,J)
          PV(K,L)=(VY(K,L)-YL1)*DXL-(VX(K,L)-XL1)*DYL
    5 CONTINUE
C
C CHECK IF NOT AN EDGE TILE
      IF(     ((PV(1,1).GE.0.0.AND.PV(1,2).GE.0.0) .OR.
     &         (PV(1,1).LE.0.0.AND.PV(1,2).LE.0.0)).AND.
     &    .NOT.(PV(1,1).EQ.0.0.AND.PV(1,2).EQ.0.0) .AND.
     &        ((PV(2,1).GE.0.0.AND.PV(2,2).GE.0.0) .OR.
     &         (PV(2,1).LE.0.0.AND.PV(2,2).LE.0.0)).AND.
     &    .NOT.(PV(2,1).EQ.0.0.AND.PV(2,2).EQ.0.0) .AND.
     &        ((PV(1,1).GE.0.0.AND.PV(2,1).LE.0.0) .OR.
     &         (PV(1,1).LE.0.0.AND.PV(2,1).GE.0.0)).AND.
     &        ((PV(1,2).GE.0.0.AND.PV(2,2).LE.0.0) .OR.
     &         (PV(1,2).LE.0.0.AND.PV(2,2).GE.0.0))) GOTO 900
      IEDGE=1
C
C SET FOLD POINTS TO -1
      DO 10 K=1,8
   10   R(K)=RSET(K)
C
C TEST WHETHER THE END POINT OF THE LINE IS NOT FOLDED
      IF(PV(1,2)*PV(2,2).LT.0.0) R(4)=+2.0
C
C FIND INTERSECT POINTS OF NEIGHBOURING LINES IF THE TILES ARE TWISTED
      DO 20 K=1,2
      IF(PV(K,1)*PV(K,2).LT.0.0)
     &  CALL INTERS(XL1,YL1,ZL1,DXL,DYL,DZL,
     &              VX(K,1),VY(K,1),DUM1,VX(K,2),VY(K,2),DUM2,
     &              DZ,0.0,R(K+1))
   20 CONTINUE
C
C BUBBLE SORT THE FOLD POINTS INTO ORDER
      DO 30 K=1,3
      DO 30 L=1,4-K
      M=L+1
        IF(R(L).GT.R(M)) THEN
          RTEMP=R(L)
          R(L)=R(M)
          R(M)=RTEMP
        ENDIF
   30 CONTINUE
C
C CHECK FOR OVERLAP OF NEIGHBOURING TILES
      DO 35 L=0,3,3
      J5=J5A(L)
      JP=(IPOS+J5)*IINC+(JPOS+J5)*JINC
      IF(NSKIP.GT.0.AND.
     &  (NSKIP.EQ.1.OR.MOD(JP,NSKIP).EQ.1)) GOTO 35
      J2=J2A(L)
      J3=J2+6
      J4=J3+1
      DO 35 K=1,2
        I=IPOS + IX(K,L,IINC)
          IF(I.LT.1  ) THEN
            IF(ILOOP.NE.1) GOTO 35
            I=I+NP1-1
          ENDIF
          IF(I.GT.NP1) THEN
            IF(ILOOP.NE.1) GOTO 35
            I=I-NP1+1
          ENDIF
C
        J=JPOS + IX(K,L,JINC)
          IF(J.LT.1  ) THEN
            IF(JLOOP.NE.1) GOTO 35
            J=J+NP2-1
          ENDIF
          IF(J.GT.NP1) THEN
            IF(JLOOP.NE.1) GOTO 35
            J=J-NP2+1
          ENDIF
C
        VX(K,L)=VALX(I,J)
        VY(K,L)=VALY(I,J)
        PV(K,L)=(VY(K,L)-YL1)*DXL-(VX(K,L)-XL1)*DYL
C
        M=L-J2
        IF(PV(K,L)*PV(K,M).LT.0.0) THEN
          CALL INTERS(XL1,YL1,ZL1,DXL,DYL,DZL,
     &                VX(K,L),VY(K,L),DUM1,VX(K,M),VY(K,M),DUM2,
     &                DZ,0.0,RP)
          R(J3)=MIN(R(J3),RP)
          R(J4)=MAX(R(J4),RP)
        ENDIF
   35 CONTINUE
C
C SET UP THE OCCLUSION RANGES
      DO 40 K=1,7,2
        L=K+1
        IF(R(K).LE.0.0.AND.R(L).LE.0.0) GOTO 40
        IF(R(K).GE.1.0.AND.R(L).GE.1.0) GOTO 40
        CALL ADDRNG(RLOW,RHIG,NRNG,R(K),R(L))
   40 CONTINUE
C
  900 CONTINUE
      RETURN
      END
      SUBROUTINE TILINT(VALX1,VALY1,VALZ1,NPARI1,NPARJ1,MXPI1,MXPJ1,
     &                  VALX2,VALY2,VALZ2,NPARI2,NPARJ2,MXPI2,MXPJ2,
     &                  IPOS,JPOS,ITIL,JTIL,IINC,JINC,
     &                  NLINE,XISC,YISC,ZISC,ITIL1,JTIL1)
C***********************************************************************
C THIS SUBROUTINE FINDS THE INTERSECT POINTS NECESSARY TO DRAW         *
C INTERSECT LINE BETWEEN TILES.                                        *
C THIS ROUTINE IS PROCESSED IF A LINE FROM FUNCTION 1 INTERSECTS WITH  *
C A TILE FROM FUNCTION 2.                                              *
C THE "INTERSECT LINE" DEFINES TWO TILES FROM FUNCTION 1 (A TILE       *
C EITHER SIDE), THE FIRST TILE IS THE TILE ON THE "MOST POSITIVE" SIDE *
C OF THE LINE.                                                         *
C EACH TILE DEFINES FOUR EDGES AROUND IT.                              *
C***********************************************************************
C
      DIMENSION XISC(*),YISC(*),ZISC(*),ITIL1(*),JTIL1(*),IFUN(11)
      DIMENSION RLOW(1),RHIG(1)
      DIMENSION VALX1(MXPI1,MXPJ1),VALY1(MXPI1,MXPJ1),VALZ1(MXPI1,MXPJ1)
      DIMENSION VALX2(MXPI2,MXPJ2),VALY2(MXPI2,MXPJ2),VALZ2(MXPI2,MXPJ2)
      DIMENSION INCX1(4),INCY1(4),INCX2(4),INCY2(4),INCX3(4),INCY3(4)
      DATA INCX1/0,1,1,0/ INCY1/0,0,1,1/
      DATA INCX2/0,1,0,0/ INCY2/0,0,1,0/
      DATA INCX3/1,1,1,0/ INCY3/0,1,1,1/
      NLINE=0
      IPS1=IPOS-JINC
      JPS1=JPOS-IINC
C
C STEP AROUND THE EDGES OF THE "FIRST TILE" DEFINED BY THE
C "INTERSECTING LINE" IN FUNCTION 1
      IF(IPOS.GE.NPARI1.OR.JPOS.GE.NPARJ1) GOTO 15
      DO 10 IL=1,4
      IF((IL.EQ.1.OR.IL.EQ.4).AND.INCX3(IL).EQ.IINC) GOTO 10
C
C DETERMINE THE START AND END POINTS OF THE EDGE
        IXS=IPOS+INCX2(IL)
        IYS=JPOS+INCY2(IL)
        IXF=IPOS+INCX3(IL)
        IYF=JPOS+INCY3(IL)
        XL1=VALX1(IXS,IYS)
        YL1=VALY1(IXS,IYS)
        ZL1=VALZ1(IXS,IYS)
        DXL=VALX1(IXF,IYF)-XL1
        DYL=VALY1(IXF,IYF)-YL1
        DZL=VALZ1(IXF,IYF)-ZL1
C
C CHECK WHETHER THE EDGE INTERSECTS WITH THE "INTERSECTING TILE"
      LLINE=NLINE
        CALL TILES(VALX2(ITIL,JTIL),VALY2(ITIL,JTIL),VALZ2(ITIL,JTIL),
     &             2,2,MXPI2,MXPJ2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &             RLOW,RHIG,NRNG,0,
     &             1,NLINE,XISC,YISC,ZISC,ITIL1,JTIL1,IFUN,0,1,
     &             0,0,0,0,0,0)
      IF(LLINE.NE.NLINE) THEN
        ITIL1(NLINE)=IPOS
        JTIL1(NLINE)=JPOS
      ENDIF
   10 CONTINUE
   15 CONTINUE
C
C CHECK FOR BACK INTERSECTION ON THE ONLY LINE THAT MAY BE MISSED
      IF(IPOS.GE.NPARI1.OR.JPOS.GE.NPARJ1) GOTO 18
      IF(IPS1.LT.1.OR.JPS1.LT.1) GOTO 18
C
C DETERMINE THE START AND END POINTS OF THE LINE
        IXS=IPOS+IINC-JINC
        IYS=JPOS+JINC-IINC
        IXF=IPOS+IINC
        IYF=JPOS+JINC
        XL1=VALX1(IXS,IYS)
        YL1=VALY1(IXS,IYS)
        ZL1=VALZ1(IXS,IYS)
        DXL=VALX1(IXF,IYF)-XL1
        DYL=VALY1(IXF,IYF)-YL1
        DZL=VALZ1(IXF,IYF)-ZL1
C
C CHECK WHETHER THE EDGE INTERSECTS WITH THE "INTERSECTING TILE"
      LLINE=NLINE
        CALL TILES(VALX2(ITIL,JTIL),VALY2(ITIL,JTIL),VALZ2(ITIL,JTIL),
     &             2,2,MXPI2,MXPJ2,XL1,YL1,ZL1,DXL,DYL,DZL,
     &             RLOW,RHIG,NRNG,0,
     &             1,NLINE,XISC,YISC,ZISC,ITIL1,JTIL1,IFUN,0,1,
     &             0,0,0,0,0,0)
      IF(LLINE.NE.NLINE) THEN
        ITIL1(NLINE)=IPS1
        JTIL1(NLINE)=JPS1
      ENDIF
   18 CONTINUE
C
C STEP AROUND THE EDGES OF THE "INTERSECTING TILE" IN FUNCTION 2
      DO 20 IL=1,4
C
C DETERMINE THE START AND END POINTS OF THE EDGE
        IXS=ITIL+INCX2(IL)
        IYS=JTIL+INCY2(IL)
        IXF=ITIL+INCX3(IL)
        IYF=JTIL+INCY3(IL)
        XL1=VALX2(IXS,IYS)
        YL1=VALY2(IXS,IYS)
        ZL1=VALZ2(IXS,IYS)
        DXL=VALX2(IXF,IYF)-XL1
        DYL=VALY2(IXF,IYF)-YL1
        DZL=VALZ2(IXF,IYF)-ZL1
C
C CHECK WHETHER THE EDGE INTERSECTS WITH THE FIRST TILE DEFINED BY THE
C "INTERSECTING LINE"
      IF(IPOS.GE.NPARI1.OR.JPOS.GE.NPARJ1) GOTO 25
        LLINE=NLINE
        CALL TILES(VALX1(IPOS,JPOS),VALY1(IPOS,JPOS),VALZ1(IPOS,JPOS),
     &             2,2,MXPI1,MXPJ1,XL1,YL1,ZL1,DXL,DYL,DZL,
     &             RLOW,RHIG,NRNG,0,
     &             1,NLINE,XISC,YISC,ZISC,ITIL1,JTIL1,IFUN,0,1,
     &             0,0,0,0,0,0)
        IF(LLINE.NE.NLINE) THEN
          ITIL1(NLINE)=IPOS
          JTIL1(NLINE)=JPOS
        ENDIF
   25 CONTINUE
C
C CHECK WHETHER THE EDGE INTERSECTS WITH THE SECOND TILE DEFINED BY THE
C "INTERSECTING LINE"
        IF(IPS1.LT.1.OR.JPS1.LT.1) GOTO 20
        LLINE=NLINE
        CALL TILES(VALX1(IPS1,JPS1),VALY1(IPS1,JPS1),VALZ1(IPS1,JPS1),
     &             2,2,MXPI1,MXPJ1,XL1,YL1,ZL1,DXL,DYL,DZL,
     &             RLOW,RHIG,NRNG,0,
     &             1,NLINE,XISC,YISC,ZISC,ITIL1,JTIL1,IFUN,0,1,
     &             0,0,0,0,0,0)
        IF(LLINE.NE.NLINE) THEN
          ITIL1(NLINE)=IPS1
          JTIL1(NLINE)=JPS1
        ENDIF
   20 CONTINUE
      RETURN
      END
      SUBROUTINE VIEW(XMIN,XMAX,YMIN,YMAX,XLO,XHI,YLO,YHI,BOARD)
C***********************************************************************
C THIS SUBROUTINE SETS UP THE VIRTUAL WINDOW SO THAT XMIN,XMAX,YMIN,   *
C YMAX FIT WITHIN THE SCREEN LIMITS OF XLO,XHI,YLO,YHI WITHOUT         *
C CHANGING THE RELATIVE PROPORTIONS OF THE AXES.                       *
C***********************************************************************
C
C LEAVE A "BOARD" BOARDER
      B=BOARD*0.5
      XPLO=XLO+(XHI-XLO)*B
      XPHI=XHI-(XHI-XLO)*B
      YPLO=YLO+(YHI-YLO)*B
      YPHI=YHI-(YHI-YLO)*B
      SX=XPHI-XPLO
      SY=YPHI-YPLO
      XMID=(XMAX+XMIN)*0.5
      YMID=(YMAX+YMIN)*0.5
      XRNG=(XMAX-XMIN)
      YRNG=(YMAX-YMIN)
      RMAX=MAX(XRNG/SX,YRNG/SY)
      XPMIN=XMID - RMAX*SX*0.5
      XPMAX=XMID + RMAX*SX*0.5
      YPMIN=YMID - RMAX*SY*0.5
      YPMAX=YMID + RMAX*SY*0.5
      CALL TWINDO(NINT(XPLO),NINT(XPHI),NINT(YPLO),NINT(YPHI))
      CALL DWINDO(XPMIN,XPMAX,YPMIN,YPMAX)
      RETURN
      END
      SUBROUTINE VIEW3D(XIN,YIN,ZIN,XC,YC,ZC,THETA,PHI,PSI,XOT,YOT,ZOT)
C***********************************************************************
C THIS SUBROUTINE ROTATES 3D SPACE ABOUT THE ORIGIN SO IT APPEARS THAT *
C THE VIEWING POSITION IS AT SPHERICAL POLAR DIRECTION (THETA,PHI),    *
C THIS PRODUCES A VIEW WITH THE Z AXIS VERITCAL IF THE VIEW IS NOT     *
C PARALLEL TO THE Z AXIS. THE ANGLE PSI DETERMINES THE TILT OF THE     *
C VIEW ONCE THE DIRECTION HAS BEEN DETERMINED.                         *
C IF THETA AND PHI ARE BOTH ZERO THEN THE Z AXIS RISES FROM THE PAGE   *
C AND THE Y AXIS RUN FROM LEFT TO RIGHT AND THE X AXIS RUN FROM TOP TO *
C BOTTOM, IE FROM BOTTOM TO TOP OF PAGE POINTS IN THE DIRECTION OF     *
C ZERO PHI. ROTATION IS ABOUT (XC,YC,ZC).                              *
C THE FINAL OUTCOME IS THAT THE POINT (X,Y,Z) (SPACE AXES) IS          *
C TRANSFORMED TO (XOT,YOT,ZOT) (VIEWER AXES) ORIGIN OF VIEW IS AT      *
C (0,0,0) AND DIRECTION OF VIEW IS IN THE -VE Z DIRECTION.             *
C***********************************************************************
C
C WITH ZERO ROTATION Y AXIS IS HORIZONTAL ON PAGE AND X AXIS RUNS DOWN
      X1=+(YIN-YC)
      Y1=-(XIN-XC)
      Z1=+(ZIN-ZC)
C
C ROTATE ABOUT THE Z AXIS
      X2= COS(-PHI)*X1 - SIN(-PHI)*Y1
      Y2= SIN(-PHI)*X1 + COS(-PHI)*Y1
      Z2= Z1
C
C ROTATE ABOUT THE NEW X AXIS
      X3= X2
      Y3= COS(-THETA)*Y2 - SIN(-THETA)*Z2
      Z3= SIN(-THETA)*Y2 + COS(-THETA)*Z2
C
C ROTATE ABOUT THE NEW Z AXIS
      XOT= COS(-PSI)*X3 - SIN(-PSI)*Y3
      YOT= SIN(-PSI)*X3 + COS(-PSI)*Y3
      ZOT= Z3
      RETURN
      END
      SUBROUTINE PERSP(IPERSP,XIN,YIN,ZIN,HFIELD,VFIELD,XOT,YOT,ZOT)
C***********************************************************************
C THIS SUBROUTINE TRANSFORMS A POINT IN VIEWER'S FRAME OF REFERENCE    *
C TO A PERSPECTIVE POSITION. A POINT LYING ON THE LIMITS OF THE        *
C HORIZONTAL FIELD OF VIEW HAS AN X VALUE OF 1.0 OR -1.0 ETC.          *
C***********************************************************************
C
      IF(IPERSP.EQ.0) THEN
        XOT=XIN
        YOT=YIN
        ZOT=ZIN
      ELSE
        DIST=-ZIN
        HPERSP=DIST*HFIELD
        VPERSP=DIST*VFIELD
        XOT=XIN/HPERSP
        YOT=YIN/VPERSP
        ZOT=ZIN
      ENDIF
      RETURN
      END
      SUBROUTINE LIMITS(IFIRST,VAL,VMIN,VMAX)
C***********************************************************************
C THIS SUBROUTINE ACCUMULATES THE MIN AND MAX VALUES RECIEVED          *
C***********************************************************************
C
      IF(IFIRST.EQ.1) THEN
        VMIN=VAL
        VMAX=VAL
      ELSE
        VMIN=MIN(VMIN,VAL)
        VMAX=MAX(VMAX,VAL)
      ENDIF
      RETURN
      END
      SUBROUTINE RLIMS(RPNT,IC,RLOW,RHIG,NRNG)
C***********************************************************************
C THIS SUBROUTINE ACCEPTS A NUMBER OF OCCLUSION RANGES IN RLOW & RHIG  *
C AND RETURNS A LIST OF ENDPOINTS THAT DO NOT LIE IN A BLIND SPOT      *
C THE RETURNED VALUES ARE IN INCREASING ORDER.                         *
C***********************************************************************
C
      DIMENSION RPNT(*),RLOW(*),RHIG(*)
C
C PICK FROM THEN RLOW(S)
      IC=0
      DO 20 IPNT=1,NRNG
      DO 10 IRNG=1,NRNG
      IF(IPNT.EQ.IRNG) GOTO 10
      IF(RLOW(IPNT).EQ.RLOW(IRNG).AND.IRNG.LT.IPNT) GOTO 20
      IF(RLOW(IPNT).GT.RLOW(IRNG).AND.RLOW(IPNT).LE.RHIG(IRNG)) GOTO 20
   10 CONTINUE
      IC=IC+1
      RPNT(IC)=RLOW(IPNT)
   20 CONTINUE
C
C PICK FROM THE RHIG(S)
      DO 40 IPNT=1,NRNG
      DO 30 IRNG=1,NRNG
      IF(IPNT.EQ.IRNG) GOTO 30
      IF(RHIG(IPNT).EQ.RHIG(IRNG).AND.IRNG.LT.IPNT) GOTO 40
      IF(RHIG(IPNT).GE.RLOW(IRNG).AND.RHIG(IPNT).LT.RHIG(IRNG)) GOTO 40
   30 CONTINUE
      IC=IC+1
      RPNT(IC)=RHIG(IPNT)
   40 CONTINUE
C
C BUBBLE SORT THE RPNT(S) INTO ASCENDING ORDER
      DO 60 I=1,IC-1
      NS=0
      DO 50 J=1,IC-I
      K=J+1
        IF(RPNT(J).GT.RPNT(K)) THEN
          TMP=RPNT(J)
          RPNT(J)=RPNT(K)
          RPNT(K)=TMP
          NS=1
        ENDIF
   50 CONTINUE
      IF(NS.EQ.0) GOTO 70
   60 CONTINUE
   70 CONTINUE
      RETURN
      END
      SUBROUTINE ALTERN(ID,RPNT,NPNT,X1,Y1,DX,DY)
C***********************************************************************
C THIS SUBROUTINE ALTERNATES A MOVE - DRAW BETWEEN EACH POINT IN RPNT  *
C IF IDRAW=1 THEN DRAW TO THE START OF THE LINE ELSE MOVE TO THIS POINT*
C***********************************************************************
C
      DIMENSION RPNT(*)
      ID1=ID
      R1=0.0
C
      ID=1
      RLAST=0.0
      DO 10 I=1,NPNT
        IF(RPNT(I).LE.0.0)   GOTO 5
        IF(RPNT(I).GT.1.0)   GOTO 20
        IF(RPNT(I).EQ.RLAST) GOTO 5
C
        RLAST=RPNT(I)
        IF(ID.EQ.1) THEN
          IF(ID1.EQ.0) CALL MOVEA(X1+R1*DX,Y1+R1*DY)
          CALL DRAWA(X1+RPNT(I)*DX,Y1+RPNT(I)*DY)
          ID1=1
        ELSE
          R1=RPNT(I)
          ID1=0
        ENDIF
    5   CONTINUE
        ID=1-ID
   10 CONTINUE
   20 CONTINUE
C
      IF(ID.EQ.1) THEN
        IF(ID1.EQ.0)     CALL MOVEA(X1+R1*DX,Y1+R1*DY)
        IF(RLAST.LT.1.0) CALL DRAWA(X1+DX,Y1+DY)
      ENDIF
      RETURN
      END
      SUBROUTINE ADDRNG(RLOW,RHIG,NRNG,RPL,RPH)
C***********************************************************************
C THIS SUBROUTINE ADDS AN OCCLUSION RANGE AND CHECKS WHETHER THE LINE  *
C IS TOTALLY OBSCURED.                                                 *
C***********************************************************************
C
      DIMENSION RLOW(*),RHIG(*)
C
      IF(NRNG.EQ.0) THEN
        NRNG=NRNG+1
        RLOW(NRNG)=RPL
        RHIG(NRNG)=RPH
        GOTO 100
      ENDIF
C
      RL1=RLOW(NRNG)
      RH1=RHIG(NRNG)
      IF((RPL.GE.RL1 .AND. RPL.LE.RH1) .OR.
     &   (RPH.GE.RL1 .AND. RPH.LE.RH1) .OR.
     &   (RPL.LE.RL1 .AND. RPH.GE.RH1)) THEN
        RLOW(NRNG)=MIN(RPL,RL1)
        RHIG(NRNG)=MAX(RPH,RH1)
      ELSE
        NRNG=NRNG+1
        RLOW(NRNG)=RPL
        RHIG(NRNG)=RPH
      ENDIF
C
      IF(NRNG.EQ.1) GOTO 100
      NRNG2=NRNG-1
      RL1=RLOW(NRNG)
      RH1=RHIG(NRNG)
      RL2=RLOW(NRNG2)
      RH2=RHIG(NRNG2)
      IF((RL1.GE.RL2 .AND. RL1.LE.RH2) .OR.
     &   (RH1.GE.RL2 .AND. RH1.LE.RH2) .OR.
     &   (RL1.LE.RL2 .AND. RH1.GE.RH2)) THEN
        RLOW(NRNG2)=MIN(RL1,RL2)
        RHIG(NRNG2)=MAX(RH1,RH2)
        NRNG=NRNG2
      ENDIF
C
  100 CONTINUE
      RETURN
      END
      SUBROUTINE INTERS(XL1,YL1,ZL1,DXL,DYL,DZL,
     &                  XT1,YT1,ZT1,XT2,YT2,ZT2,DZ,SP,R)
C***********************************************************************
C THIS SUBROUTINE FINDS THE INTERSECTION OF LINE SEGMENT T WITH THE    *
C EXTENDED LINE L. THE VALUE RETURNED IS THE R POSITION ALONG LINE L.  *
C***********************************************************************
C
C CALCULATE INTERSECT POSITION ALONG TILE EDGE
      DXT=XT2-XT1
      DYT=YT2-YT1
      DZT=ZT2-ZT1
      DX =XT1-XL1
      DY =YT1-YL1
      V1= DX*DYL- DY*DXL
      V2= DX*DYT- DY*DXT
      V3=DYT*DXL-DXT*DYL
C
C CHECK THAT THE POSITION OF INTERSECT DOES ACTUALLY LIE ON THE TILE
C FORCE IT TO IF NECESSARY
C IF LINES ARE CONCURRENT THEN S=PREDETERMINED VALUE (1.0 OR 0.0)
      IF(V3.EQ.0.0) THEN
        S=SP
      ELSE
        S=V1/V3
      ENDIF
      IF(S.LT.0.0) S=0.0
      IF(S.GT.1.0) S=1.0
C
C CALCULATE INTERSECT POSITION ALONG LINE
      IF(DXL.EQ.0.0.AND.DYL.EQ.0.0) THEN
        R=-1.0
      ELSE
        R=( (S*DXT+DX)*DXL + (S*DYT+DY)*DYL ) / ( DXL*DXL + DYL*DYL )
      ENDIF
C
C CALCULATE THE GAP IN THE Z-DIRECTION (REVERSING THE LINES ONLY
C NEGATES THIS VALUE, IT DOES NOT CHANGE THE EFFECT OF ROUNDING ERRORS)
      IF(V3.EQ.0.0) THEN
        DZ=(ZT1+S*DZT)-(ZL1+R*DZL)
      ELSE
        DZ=(ZT1-ZL1)+(V1*DZT-V2*DZL)/V3
      ENDIF
C
      RETURN
      END
      SUBROUTINE SAMEZ(R1,R2,ZD1,ZD2,R)
C***********************************************************************
C THIS SUBROUTINE RETURNS THE VALUE OF R AT WHICH THE Z-VALUE OF LINE  *
C L IS THE SAME AS THE Z-VALUE OF LINE T. AT R=R1 ZL=ZL1,ZT=ZT1 ETC..  *
C***********************************************************************
C
      R=ZD1/(ZD1-ZD2) * (R2-R1) + R1
C
C A GREATER Z IS NEARER VEIWER
      IF(ZD1.GT.0.0 .AND. ZD2.LT.0.0) R2=R
      IF(ZD2.GT.0.0 .AND. ZD1.LT.0.0) R1=R
      IF(R1.GT.R2) THEN
        TMP=R1
        R1=R2
        R2=TMP
      ENDIF
      RETURN
      END
*/
}
};
