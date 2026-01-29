"use client";

import React from "react";
import { Stage, Layer, Line, Circle, Text, Group } from "react-konva";
import { Zone, zoneColors } from "./ZoneConfigPanel";

interface MultiZoneConfigProps {
  width: number;
  height: number;
  zones: Zone[];
  onZonesChange: (zones: Zone[]) => void;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
}

export function MultiZoneConfig({ 
  width, 
  height, 
  zones, 
  onZonesChange,
  selectedZoneId,
  onSelectZone 
}: MultiZoneConfigProps) {
  
  const handlePointDrag = (zoneId: string, pointIndex: number, e: any) => {
    const node = e.target;
    const newZones = zones.map(zone => {
      if (zone.id !== zoneId) return zone;
      const newPolygon = [...zone.polygon];
      newPolygon[pointIndex * 2] = node.x();
      newPolygon[pointIndex * 2 + 1] = node.y();
      return { ...zone, polygon: newPolygon };
    });
    onZonesChange(newZones);
  };

  const handleBodyDragEnd = (zoneId: string, e: any) => {
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    
    node.position({ x: 0, y: 0 });

    const newZones = zones.map(zone => {
      if (zone.id !== zoneId) return zone;
      const newPolygon = zone.polygon.map((val, i) => 
        i % 2 === 0 ? val + dx : val + dy
      );
      return { ...zone, polygon: newPolygon };
    });
    onZonesChange(newZones);
  };

  // Helper to get edge center for labels
  const getEdgeCenter = (polygon: number[], i1: number, i2: number) => {
    const idx1 = i1 % 4;
    const idx2 = i2 % 4;
    const x = (polygon[idx1 * 2] + polygon[idx2 * 2]) / 2;
    const y = (polygon[idx1 * 2 + 1] + polygon[idx2 * 2 + 1]) / 2;
    return { x, y };
  };

  const getPolygonCenter = (polygon: number[]) => {
    let x = 0, y = 0;
    for (let i = 0; i < 4; i++) {
      x += polygon[i * 2];
      y += polygon[i * 2 + 1];
    }
    return { x: x / 4, y: y / 4 };
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto">
        <Stage width={width} height={height}>
          <Layer>
            {zones.map((zone) => {
              const colors = zoneColors[zone.type];
              const isSelected = selectedZoneId === zone.id;
              const center = getPolygonCenter(zone.polygon);
              
              return (
                <Group key={zone.id}>
                  {/* Polygon Body (Draggable) */}
                  <Group 
                    draggable 
                    onDragEnd={(e) => handleBodyDragEnd(zone.id, e)}
                    onClick={() => onSelectZone(zone.id)}
                    onTap={() => onSelectZone(zone.id)}
                  >
                    <Line
                      points={zone.polygon}
                      closed
                      fill={colors.fill}
                      stroke={colors.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      dash={isSelected ? undefined : [5, 5]}
                    />
                    
                    {/* Zone Name Label */}
                    <Text
                      x={center.x - 40}
                      y={center.y - 10}
                      text={zone.name}
                      fontSize={14}
                      fontStyle="bold"
                      fill={colors.stroke}
                      align="center"
                      width={80}
                    />
                    
                    {/* Edge Numbers (only for direction zones) */}
                    {zone.type === 'direction' && [0, 1, 2, 3].map((i) => {
                      const edgeCenter = getEdgeCenter(zone.polygon, i, i + 1);
                      return (
                        <Group key={i} x={edgeCenter.x} y={edgeCenter.y}>
                          <Circle radius={10} fill="white" />
                          <Text 
                            text={String(i + 1)} 
                            x={-4} y={-5}
                            fontSize={12} 
                            fontStyle="bold"
                            fill="black"
                          />
                        </Group>
                      );
                    })}
                  </Group>

                  {/* Corner Handles (only when selected) */}
                  {isSelected && [0, 1, 2, 3].map((i) => (
                    <Circle
                      key={i}
                      x={zone.polygon[i * 2]}
                      y={zone.polygon[i * 2 + 1]}
                      radius={8}
                      fill={colors.stroke}
                      stroke="white"
                      strokeWidth={2}
                      draggable
                      onDragMove={(e) => handlePointDrag(zone.id, i, e)}
                      hitStrokeWidth={20}
                    />
                  ))}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

// Keep backward compat export for old single-zone usage
interface ZoneConfigProps {
  width: number;
  height: number;
  points: number[];
  onPointsChange: (newPoints: number[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ZoneConfig({ width, height, points, onPointsChange, onSave, onCancel }: ZoneConfigProps) {
  const handlePointDrag = (e: any, index: number) => {
    const node = e.target;
    const newPoints = [...points];
    newPoints[index * 2] = node.x();
    newPoints[index * 2 + 1] = node.y();
    onPointsChange(newPoints);
  };

  const handleBodyDragEnd = (e: any) => {
    const node = e.target;
    const dx = node.x();
    const dy = node.y();
    node.position({ x: 0, y: 0 });
    const newPoints = points.map((val, i) => i % 2 === 0 ? val + dx : val + dy);
    onPointsChange(newPoints);
  };

  const getEdgeCenter = (i1: number, i2: number) => {
    const idx1 = i1 % 4;
    const idx2 = i2 % 4;
    const x = (points[idx1 * 2] + points[idx2 * 2]) / 2;
    const y = (points[idx1 * 2 + 1] + points[idx2 * 2 + 1]) / 2;
    return { x, y };
  };

  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium z-50 flex gap-4 items-center">
        <span>Drag corners to define zone</span>
        <div className="h-4 w-px bg-white/20" />
        <button onClick={onCancel} className="hover:text-red-400">Cancel</button>
        <button onClick={onSave} className="text-green-400 hover:text-green-300 font-bold">Save Zone</button>
      </div>
      <div className="absolute inset-0 pointer-events-auto">
        <Stage width={width} height={height}>
          <Layer>
            <Group draggable onDragEnd={handleBodyDragEnd}>
              <Line points={points} closed fill="rgba(0, 255, 0, 0.1)" stroke="#00ff00" strokeWidth={2} />
              {[0, 1, 2, 3].map((i) => {
                const center = getEdgeCenter(i, i + 1);
                return (
                  <Group key={i} x={center.x} y={center.y}>
                    <Circle radius={10} fill="white" />
                    <Text text={String(i + 1)} x={-4} y={-5} fontSize={12} fontStyle="bold" fill="black" />
                  </Group>
                );
              })}
            </Group>
            {[0, 1, 2, 3].map((i) => (
              <Circle
                key={i}
                x={points[i * 2]}
                y={points[i * 2 + 1]}
                radius={8}
                fill="white"
                stroke="black"
                strokeWidth={1}
                draggable
                onDragMove={(e) => handlePointDrag(e, i)}
                hitStrokeWidth={20}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
