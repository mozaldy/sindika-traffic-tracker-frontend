"use client";

import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";


export interface LineCoords {
  points: number[]; // [x1, y1, x2, y2]
}

export interface SpeedConfig {
  line1: LineCoords;
  line2: LineCoords;
  distance: number;
}

interface LineConfigProps {
  width: number;
  height: number;
  line1: number[];
  line2: number[];
  onLineChange: (lineIndex: 1 | 2, newPoints: number[]) => void;
}

const DraggableLine = ({
  points,
  color,
  onChange,
  label,
}: {
  points: number[];
  color: string;
  onChange: (pts: number[]) => void;
  label: string;
}) => {
  // We use a dedicated inner group for moving the whole line (Line + Text)
  // This ensures the endpoints (Circles) and the main container/coordinate system stay clean.
  const bodyGroupRef = React.useRef<any>(null);

  const handleBodyDragEnd = (e: any) => {
    const node = e.target;
    const dx = node.x();
    const dy = node.y();

    // Reset the body group transform immediately
    node.position({ x: 0, y: 0 });

    // Apply the delta to ALL points (creating the move effect)
    const newPoints = [
        points[0] + dx,
        points[1] + dy,
        points[2] + dx,
        points[3] + dy
    ];
    onChange(newPoints);
  };

  const handlePointDrag = (e: any, index: number) => {
    // e.target is the Circle.
    // Since Main Group is ALWAYS at 0,0, node.x()/.y() gives us the exact absolute coordinate
    // we need for the points array. simpler and safer.
    const node = e.target;
    
    const newPoints = [...points];
    newPoints[index * 2] = node.x();
    newPoints[index * 2 + 1] = node.y();
    
    onChange(newPoints);
  };

  return (
    <Group>
      {/* Draggable Body: Line + Text */}
      <Group
        draggable
        onDragEnd={handleBodyDragEnd}
        ref={bodyGroupRef}
      >
          <Line
            points={points}
            stroke={color}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={20} 
          />
          <Text
            x={(points[0] + points[2]) / 2}
            y={(points[1] + points[3]) / 2 - 20}
            text={label}
            fontSize={16}
            fill="white"
            fontStyle="bold"
            shadowColor="black"
            shadowBlur={2}
          />
      </Group>

      {/* Independent Endpoints */}
      <Circle
        x={points[0]}
        y={points[1]}
        radius={10}
        fill={color}
        draggable
        onDragMove={(e) => handlePointDrag(e, 0)}
        // No need for cancelBubble since parent isn't draggable
        shadowColor="black"
        shadowBlur={5}
      />
      <Circle
        x={points[2]}
        y={points[3]}
        radius={10}
        fill={color}
        draggable
        onDragMove={(e) => handlePointDrag(e, 1)}
        shadowColor="black"
        shadowBlur={5}
      />
    </Group>
  );
};

export function LineConfig({ width, height, line1, line2, onLineChange }: LineConfigProps) {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      <div className="pointer-events-auto absolute inset-0">
        <Stage width={width} height={height}>
          <Layer>
            <DraggableLine
              points={line1}
              color="#00ff00" // Green
              label="Start Line (A)"
              onChange={(pts) => onLineChange(1, pts)}
            />
            <DraggableLine
              points={line2}
              color="#ff0000" // Red
              label="End Line (B)"
              onChange={(pts) => onLineChange(2, pts)}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
