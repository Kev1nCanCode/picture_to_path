import { useRef, useState } from 'react';
import { Box, Button, Dialog, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { Node, Edge, NodeFormData, Position } from '../types';

export const Canvas = () => {
    const [image, setImage] = useState<string | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isCreatingEdge, setIsCreatingEdge] = useState(false);
    const [sourceNode, setSourceNode] = useState<Node | null>(null);
    const [showNodeForm, setShowNodeForm] = useState(false);
    const [showEdgeForm, setShowEdgeForm] = useState(false);
    const [clickPosition, setClickPosition] = useState<Position>({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const [defaultValues, setDefaultValues] = useState({
        building_id: '',
        floor_id: '',
    });

    const [nodeForm, setNodeForm] = useState<NodeFormData>({
        building_id: '',
        floor_id: '',
        name: '',
    });

    const [edgeType, setEdgeType] = useState<'floor' | 'stair' | 'elevator'>('elevator');

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!canvasRef.current || !image) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isCreatingEdge) {
            const clickedNode = nodes.find(node =>
                Math.abs(node.x - x) < 20 && Math.abs(node.y - y) < 20
            );

            if (clickedNode) {
                if (!sourceNode) {
                    setSourceNode(clickedNode);
                } else if (sourceNode.id !== clickedNode.id) {
                    setShowEdgeForm(true);
                    const newEdge: Edge = {
                        id: `edge-${edges.length + 1}`,
                        building_id: sourceNode.building_id,
                        floor_id: sourceNode.floor_id,
                        source_id: sourceNode.id,
                        target_id: clickedNode.id,
                        type: edgeType,
                    };
                    setEdges([...edges, newEdge]);
                    setSourceNode(null);
                }
            }
        } else {
            setClickPosition({ x, y });
            setNodeForm({
                building_id: defaultValues.building_id,
                floor_id: defaultValues.floor_id,
                name: '',
            });
            setShowNodeForm(true);
        }
    };

    const handleNodeFormSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const newNode: Node = {
            id: `node-${nodes.length + 1}`,
            ...nodeForm,
            x: clickPosition.x,
            y: clickPosition.y,
        };
        setNodes([...nodes, newNode]);
        setShowNodeForm(false);
        setNodeForm({ building_id: defaultValues.building_id, floor_id: defaultValues.floor_id, name: '' });
    };

    const exportToCSV = () => {
        // Export nodes
        const nodesCSV = [
            'building_id;floor_id;name;x;y',
            ...nodes.map(node => `${node.building_id};${node.floor_id};${node.name};${node.x};${node.y}`)
        ].join('\n');

        const nodesBlob = new Blob([nodesCSV], { type: 'text/csv' });
        const nodesURL = window.URL.createObjectURL(nodesBlob);
        const nodesLink = document.createElement('a');
        nodesLink.href = nodesURL;
        nodesLink.download = 'nodes.csv';
        nodesLink.click();

        // Export edges
        const edgesCSV = [
            'building_id;floor_id;source_id;target_id;type',
            ...edges.map(edge => `${edge.building_id};${edge.floor_id};${edge.source_id};${edge.target_id};${edge.type}`)
        ].join('\n');

        const edgesBlob = new Blob([edgesCSV], { type: 'text/csv' });
        const edgesURL = window.URL.createObjectURL(edgesBlob);
        const edgesLink = document.createElement('a');
        edgesLink.href = edgesURL;
        edgesLink.download = 'edges.csv';
        edgesLink.click();
    };

    const handleEdgeFormClose = () => {
        setShowEdgeForm(false);
        setSourceNode(null);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
                <TextField
                    label="Default Building ID"
                    value={defaultValues.building_id}
                    onChange={(e) => setDefaultValues({ ...defaultValues, building_id: e.target.value })}
                    size="small"
                />
                <TextField
                    label="Default Floor ID"
                    value={defaultValues.floor_id}
                    onChange={(e) => setDefaultValues({ ...defaultValues, floor_id: e.target.value })}
                    size="small"
                />
            </Box>

            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginBottom: 16 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={() => setIsCreatingEdge(!isCreatingEdge)}
                    color={isCreatingEdge ? 'secondary' : 'primary'}
                >
                    {isCreatingEdge ? 'Cancel Edge Creation' : 'Create Edge'}
                </Button>
                <Button variant="contained" onClick={exportToCSV}>
                    Export to CSV
                </Button>
            </Box>

            <Box
                ref={canvasRef}
                onClick={handleCanvasClick}
                sx={{
                    position: 'relative',
                    width: 'fit-content',
                    height: 'fit-content',
                    border: '1px solid #ccc',
                }}
            >
                {image && <img src={image} alt="Floor plan" style={{ maxWidth: '100%' }} />}

                {nodes.map((node) => (
                    <Box
                        key={node.id}
                        sx={{
                            position: 'absolute',
                            left: node.x - 5,
                            top: node.y - 5,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: sourceNode?.id === node.id ? 'secondary.main' : 'primary.main',
                            cursor: 'pointer',
                        }}
                    />
                ))}

                {edges.map((edge) => {
                    const source = nodes.find(n => n.id === edge.source_id);
                    const target = nodes.find(n => n.id === edge.target_id);
                    if (!source || !target) return null;

                    return (
                        <svg
                            key={edge.id}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                            }}
                        >
                            <line
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={edge.type === 'elevator' ? '#f00' : edge.type === 'stair' ? '#00f' : '#0f0'}
                                strokeWidth={2}
                            />
                        </svg>
                    );
                })}
            </Box>

            <Dialog
                open={showNodeForm}
                onClose={() => setShowNodeForm(false)}
                disableEscapeKeyDown
            >
                <Box
                    component="form"
                    onSubmit={handleNodeFormSubmit}
                    sx={{ p: 2 }}
                >
                    <TextField
                        label="Building ID"
                        value={nodeForm.building_id}
                        onChange={(e) => setNodeForm({ ...nodeForm, building_id: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Floor ID"
                        value={nodeForm.floor_id}
                        onChange={(e) => setNodeForm({ ...nodeForm, floor_id: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Name"
                        value={nodeForm.name}
                        onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                        fullWidth
                        margin="normal"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleNodeFormSubmit();
                            }
                        }}
                    />
                    <Button onClick={handleNodeFormSubmit} variant="contained">
                        Create Node
                    </Button>
                </Box>
            </Dialog>

            <Dialog open={showEdgeForm} onClose={handleEdgeFormClose}>
                <Box sx={{ p: 2 }}>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Edge Type</InputLabel>
                        <Select
                            value={edgeType}
                            onChange={(e) => setEdgeType(e.target.value as 'floor' | 'stair' | 'elevator')}
                        >
                            <MenuItem value="floor">Floor</MenuItem>
                            <MenuItem value="stair">Stair</MenuItem>
                            <MenuItem value="elevator">Elevator</MenuItem>
                        </Select>
                    </FormControl>
                    <Button onClick={handleEdgeFormClose} variant="contained">
                        Close
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}; 