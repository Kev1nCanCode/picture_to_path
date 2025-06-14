export type NodeColor = 'red' | 'green' | 'blue';

export interface Node {

    id: string;
    buildingId: string;
    floorId: string;
    name: string;
    position: Position;
    color: NodeColor;
}

export interface Edge {
    id: string;
    buildingId: string;
    floorId: string;
    sourceId: string;
    targetId: string;
    type: 'floor' | 'stair' | 'elevator';
}

export interface NodeFormData {
    buildingId: string;
    floorId: string;
    name: string;
    position: Position;
    color: NodeColor;
}

export interface Position {
    x: number;
    y: number;
} 