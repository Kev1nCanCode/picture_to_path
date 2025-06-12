export interface Node {
    id: string;
    building_id: string;
    floor_id: string;
    name: string;
    x: number;
    y: number;
}

export interface Edge {
    id: string;
    building_id: string;
    floor_id: string;
    source_id: string;
    target_id: string;
    type: 'floor' | 'stair' | 'elevator';
}

export interface NodeFormData {
    building_id: string;
    floor_id: string;
    name: string;
}

export interface Position {
    x: number;
    y: number;
} 