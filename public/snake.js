// Adapted from the following Paperjs example:
// http://paperjs.org/examples/chain/

const Snake = function () {
  // The amount of points in the path:
  var pointCount = 10;

  // The distance between the points:
  var segmentLength = 50;

  var targetPos = { x: 0, y: 0 };

  var path = new paper.Path({
    strokeColor: '#E4141B',
    strokeWidth: 20,
    strokeCap: 'round',
  });

  var start = paper.view.center / [10, 1];
  for (var i = 0; i < pointCount; i++) path.add(new paper.Point(i * segmentLength, 0));

  this.onMouseMove = (event) => {
    targetPos.x = event.layerX;
    targetPos.y = event.layerY;
  };
  this.onTick = () => {
    path.firstSegment.point.x += (targetPos.x - path.firstSegment.point.x) / 50;
    path.firstSegment.point.y += (targetPos.y - path.firstSegment.point.y) / 50;
    for (var i = 0; i < pointCount - 1; i++) {
      var segment = path.segments[i];
      var nextSegment = segment.next;
      var vectorX = segment.point.x - nextSegment.point.x;
      var vectorY = segment.point.y - nextSegment.point.y;
      const lengthRatio = segmentLength / Math.sqrt(vectorX * vectorX + vectorY * vectorY);
      vectorX *= lengthRatio;
      vectorY *= lengthRatio;
      nextSegment.point.x = segment.point.x - vectorX;
      nextSegment.point.y = segment.point.y - vectorY;
    }
    path.smooth({ type: 'continuous' });

    setTimeout(this.onTick, 10);
  };

  this.getPoints = () => path.segments.map((s) => ({ x: s.point.x, y: s.point.y }));

  this.setPoints = (points) => {
    for (let i = 0; i < path.segments.length; i++) {
      const segment = path.segments[i];
      segment.point.x = points[i].x;
      segment.point.y = points[i].y;
    }
    path.smooth({ type: 'continuous' });
  };

  this.remove = () => path.remove();
};
