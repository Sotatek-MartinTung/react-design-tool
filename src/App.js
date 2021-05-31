import React, { Component } from "react";
import { fabric } from "fabric";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.pointArray = [];
    this.lineArray = [];
    this.activeShape = false;
    this.polygonMode = false;
  }

  componentDidMount() {
    this.canvas = new fabric.Canvas("test", {
      preserveObjectStacking: true,
      width: 900,
      height: 900,
      selection: true,
      defaultCursor: "default",
    });
    this.canvas.setBackgroundImage(
      "https://data2.unhcr.org/images/documents/big_aa2c81585e808b644ef70587136c23601d33a2e9.jpg",
      this.canvas.renderAll.bind(this.canvas),
      {
        originX: "left",
        originY: "top",
      }
    );

    this.canvas.on({
      "mouse:down": (event) => {
        if (event.target && event.target.id === this.pointArray[0].id) {
          this.generatePolygon(this.pointArray);
        }
        if (this.polygonMode) {
          this.addPoint(event);
        }
      },

      "mouse:moving": (event) => {
        // var objType = event.target.get('type');
        console.log(event.target);
        // var p = event.target;
        // this.polygon.points[p.name] = {
        //   x: p.getCenterPoint().x,
        //   y: p.getCenterPoint().y,
        // };
      },

      "mouse:move": (options) => {
        if (this.activeLine && this.activeLine.class === "line") {
          const pointer = this.canvas.getPointer(options.e);
          this.activeLine.set({ x2: pointer.x, y2: pointer.y });

          const points = this.activeShape.get("points");
          points[this.pointArray.length] = {
            x: pointer.x,
            y: pointer.y,
          };
          this.activeShape.set({
            points: points,
          });
          this.canvas.renderAll();
        }
        this.canvas.renderAll();
      },
    });
  }

  addPoint = (options) => {
    const random = Math.floor(Math.random() * (999999 - 99 + 1)) + 99;
    const id = new Date().getTime() + random;
    const circle = new fabric.Circle({
      radius: 5,
      fill: "#ffffff",
      stroke: "#333333",
      strokeWidth: 0.5,
      left: options.e.layerX / this.canvas.getZoom(),
      top: options.e.layerY / this.canvas.getZoom(),
      // selectable: false,
      hasBorders: false,
      hasControls: false,
      originX: "center",
      originY: "center",
      id: id,
    });
    if (this.pointArray.length === 0) {
      circle.set({
        fill: "red",
      });
    }
    const points = [
      options.e.layerX / this.canvas.getZoom(),
      options.e.layerY / this.canvas.getZoom(),
      options.e.layerX / this.canvas.getZoom(),
      options.e.layerY / this.canvas.getZoom(),
    ];
    const line = new fabric.Line(points, {
      strokeWidth: 2,
      fill: "#999999",
      stroke: "#999999",
      class: "line",
      originX: "center",
      originY: "center",
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
    });
    if (this.activeShape) {
      const pos = this.canvas.getPointer(options.e);
      const points = this.activeShape.get("points");
      points.push({
        x: pos.x,
        y: pos.y,
      });
      const polygon = new fabric.Polygon(points, {
        stroke: "#333333",
        strokeWidth: 1,
        fill: "#cccccc",
        opacity: 0.1,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
      });
      this.canvas.remove(this.activeShape);
      this.canvas.add(polygon);
      this.activeShape = polygon;
      this.canvas.renderAll();
    } else {
      const polyPoint = [
        {
          x: options.e.layerX / this.canvas.getZoom(),
          y: options.e.layerY / this.canvas.getZoom(),
        },
      ];
      const polygon = new fabric.Polygon(polyPoint, {
        stroke: "#333333",
        strokeWidth: 1,
        fill: "#cccccc",
        opacity: 0.1,
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,
      });
      this.activeShape = polygon;
      this.canvas.add(polygon);
    }
    this.activeLine = line;

    this.pointArray.push(circle);
    this.lineArray.push(line);

    this.canvas.add(line);
    this.canvas.add(circle);
    this.canvas.selection = false;
  };

  generatePolygon = (pointArray) => {
    const points = [];
    pointArray.forEach((point) => {
      points.push({
        x: point.left,
        y: point.top,
      });
      this.canvas.remove(point);
    });
    this.lineArray.forEach((line) => {
      this.canvas.remove(line);
    });
    this.canvas.remove(this.activeShape).remove(this.activeLine);
    const polygon = new fabric.Polygon(points, {
      stroke: "#333333",
      strokeWidth: 0.5,
      fill: "red",
      opacity: 1,
      hasBorders: false,
    });
    this.canvas.add(polygon);
    this.activeLine = null;
    this.activeShape = null;
    this.polygonMode = false;
    this.canvas.selection = true;
  };

  drawPolygon = () => {
    this.polygonMode = true;
  };

  editToggle = () => {
    const poly = this.canvas.getObjects('polygon')[0];
    this.canvas.setActiveObject(poly);
    poly.edit = !poly.edit;
    if (poly.edit) {
      const lastControl = poly.points.length - 1;
      poly.cornerStyle = "circle";
      poly.cornerColor = "rgba(0,0,255,0.5)";

      const actionHandler = (eventData, transform, x, y) => {
        const polygon = transform.target,
          currentControl = polygon.controls[polygon.__corner],
          mouseLocalPosition = polygon.toLocalPoint(
            new fabric.Point(x, y),
            "center",
            "center"
          ),
          polygonBaseSize = polygon._getNonTransformedDimensions(),
          size = polygon._getTransformedDimensions(0, 0),
          finalPointPosition = {
            x:
              (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
              polygon.pathOffset.x,
            y:
              (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
              polygon.pathOffset.y,
          };
        polygon.points[currentControl.pointIndex] = finalPointPosition;
        return true;
      };
    
      const anchorWrapper = (anchorIndex, fn) => {
        return function (eventData, transform, x, y) {
          const fabricObject = transform.target,
            absolutePoint = fabric.util.transformPoint(
              {
                x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
                y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
              },
              fabricObject.calcTransformMatrix()
            ),
            actionPerformed = fn(eventData, transform, x, y),
            newDim = fabricObject._setPositionDimensions({}),
            polygonBaseSize = fabricObject._getNonTransformedDimensions(),
            newX =
              (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
              polygonBaseSize.x,
            newY =
              (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
              polygonBaseSize.y;
          fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
          return actionPerformed;
        };
      };


      poly.controls = poly.points.reduce(function (acc, point, index) {
        acc["p" + index] = new fabric.Control({
          positionHandler: (dim, finalMatrix, fabricObject) => {
            // console.log(fabricObject);
            const x =
                fabricObject.points[index].x - fabricObject.pathOffset.x,
              y = fabricObject.points[index].y - fabricObject.pathOffset.y;
            return fabric.util.transformPoint(
              { x: x, y: y },
              fabric.util.multiplyTransformMatrices(
                fabricObject.canvas.viewportTransform,
                fabricObject.calcTransformMatrix()
              )
            );
          },
          actionHandler: anchorWrapper(
            index > 0 ? index - 1 : lastControl,
            actionHandler
          ),
          actionName: "modifyPolygon",
          pointIndex: index,
        });
        return acc;
      }, {});
    } else {
      poly.cornerColor = "blue";
      poly.cornerStyle = "rect";
      poly.controls = fabric.Object.prototype.controls;
    }
    poly.hasBorders = !poly.edit;
    this.canvas.requestRenderAll();
  };

  render() {
    return (
      <div className="wrapper">
        <button onClick={this.drawPolygon}>Draw polygon</button>
        <button onClick={this.editToggle}>Edit</button>
        <canvas id="test" />
      </div>
    );
  }
}

export default App;
