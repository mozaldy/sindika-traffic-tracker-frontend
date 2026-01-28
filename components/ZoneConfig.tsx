"use client";

import React from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";

interface ZoneConfigProps {
  width: number;
  height: number;
  points: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  onPointsChange: (newPoints: number[]) => void;
}

export function ZoneConfig({ width, height, points, onPointsChange }: ZoneConfigProps) {
  
  const handleDragPoint = (e: any, index: number) => {
    const node = e.target;
    const newPoints = [...points];
    newPoints[index * 2] = node.x();
    newPoints[index * 2 + 1] = node.y();
    onPointsChange(newPoints);
  };

  const handleDragGroup = (e: any) => {
    const node = e.target;
    // node.x() and node.y() are the delta of the drag
    // We apply this delta to all points and then RESET the group position to 0,0
    const dx = node.x();
    const dy = node.y();
    
    node.position({ x: 0, y: 0 });

    const newPoints = points.map((val, i) => {
        return i % 2 === 0 ? val + dx : val + dy;
    });
    
    onPointsChange(newPoints);
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto absolute inset-0">
        <Stage width={width} height={height}>
          <Layer>
            <Group
                draggable
                onDragEnd={handleDragGroup}
            >
                {/* The Polygon Fill */}
                <Line
                points={points}
                closed
                fill="rgba(0, 255, 0, 0.3)"
                stroke="#00ff00"
                strokeWidth={2}
                />
                
                {/* Label */}
                <Text 
                    x={(points[0] + points[4]) / 2}
                    y={(points[1] + points[5]) / 2}
                    text="DETECTION ZONE"
                    fontSize={16}
                    fill="white"
                    fontStyle="bold"
                    shadowColor="black"
                    shadowBlur={2}
                    offsetX={50}
                    offsetY={10}
                />
            </Group>

            {/* Corner Handles */}
            {[0, 1, 2, 3].map((i) => (
              <Circle
                key={i}
                x={points[i * 2]}
                y={points[i * 2 + 1]}
                radius={10}
                fill="white"
                stroke="#00ff00"
                strokeWidth={2}
                draggable
                onDragMove={(e) => handleDragPoint(e, i)}
                shadowColor="black"
                shadowBlur={5}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
