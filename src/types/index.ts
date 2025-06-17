export type NodeColor = 'red' | 'green' | 'blue';

export interface Node {
    id: string;
    buildingId: string;
    floorId: string;
    name: string;
    position: Position;
    color: NodeColor;
    isSearchable: boolean;
}

export interface Edge {
    id: string;
    buildingId: string;
    floorId: string;
    sourceId: string;
    targetId: string;
    type: 'floor' | 'stair' | 'elevator';
    weight: number;
}

export interface NodeFormData {
    buildingId: string;
    floorId: string;
    name: string;
    position: Position;
    color: NodeColor;
    isSearchable: boolean;
}

export interface Position {
    x: number;
    y: number;
} 