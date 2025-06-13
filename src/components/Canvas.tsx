import { useState, useRef, useEffect } from 'react';
import { Box, Button, Dialog, TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import type { Node, Edge, NodeFormData } from '../types';

const CANVAS_WIDTH = 800;  // Fixed width for the canvas container
const CANVAS_HEIGHT = 600; // Fixed height for the canvas container

export const Canvas = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [image, setImage] = useState<string | null>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isCreatingEdge, setIsCreatingEdge] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [showNodeForm, setShowNodeForm] = useState(false);
    const [showEdgeForm, setShowEdgeForm] = useState(false);
    const [nodeFormData, setNodeFormData] = useState<NodeFormData>({
        buildingId: '',
        floorId: '',
        name: '',
        position: { x: 0, y: 0 }
    });
    const [edgeFormData, setEdgeFormData] = useState({
        buildingId: '',
        floorId: '',
        sourceId: '',
        targetId: '',
        type: 'floor' as 'floor' | 'stair' | 'elevator'
    });
    const [defaultBuildingId, setDefaultBuildingId] = useState('');
    const [defaultFloorId, setDefaultFloorId] = useState('');
    const [nextNodeId, setNextNodeId] = useState(1); // Track the next available node ID
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editingEdge, setEditingEdge] = useState<Edge | null>(null);

    useEffect(() => {
        const updatePositions = () => {
            if (imageRef.current) {
                setImageSize({
                    width: imageRef.current.naturalWidth,
                    height: imageRef.current.naturalHeight
                });
            }
        };

        window.addEventListener('resize', updatePositions);
        return () => window.removeEventListener('resize', updatePositions);
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img.src);
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!image || !canvasRef.current) return;

        const imageElement = canvasRef.current.querySelector('img');
        if (!imageElement) return;

        const imageRect = imageElement.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Calculate click position relative to the canvas
        const x = event.clientX - canvasRect.left;
        const y = event.clientY - canvasRect.top;

        // Calculate scaling factors
        const scaleX = imageSize.width / imageRect.width;
        const scaleY = imageSize.height / imageRect.height;

        // Convert to actual image coordinates
        const actualX = Math.round(x * scaleX);
        const actualY = Math.round(y * scaleY);

        // Ensure coordinates are within image bounds
        if (actualX < 0 || actualX > imageSize.width || actualY < 0 || actualY > imageSize.height) {
            return;
        }

        if (isCreatingEdge) {
            // Find the closest node within 20 pixels
            const clickedNode = nodes.find(node => {
                const distance = Math.sqrt(
                    Math.pow(node.position.x - actualX, 2) + Math.pow(node.position.y - actualY, 2)
                );
                return distance < 20;
            });

            if (clickedNode) {
                if (!selectedNode) {
                    // First node selection
                    setSelectedNode(clickedNode);
                } else if (clickedNode.id !== selectedNode.id) {
                    // Second node selection - create edge
                    const newEdge: Edge = {
                        id: `edge-${edges.length + 1}`,
                        buildingId: selectedNode.buildingId,
                        floorId: selectedNode.floorId,
                        sourceId: selectedNode.id,
                        targetId: clickedNode.id,
                        type: 'floor' // default type
                    };
                    setEdges([...edges, newEdge]);
                    setSelectedNode(null);
                }
            }
        } else {
            setNodeFormData({
                buildingId: defaultBuildingId,
                floorId: defaultFloorId,
                name: '',
                position: { x: actualX, y: actualY }
            });
            setShowNodeForm(true);
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        // Remove the node
        setNodes(nodes.filter(node => node.id !== nodeId));
        // Remove any edges connected to this node
        setEdges(edges.filter(edge =>
            edge.sourceId !== nodeId && edge.targetId !== nodeId
        ));
    };

    const handleNodeEdit = (node: Node) => {
        setEditingNode(node);
        setNodeFormData({
            buildingId: node.buildingId,
            floorId: node.floorId,
            name: node.name,
            position: node.position
        });
        setShowNodeForm(true);
    };

    const handleNodeFormSubmit = () => {
        if (nodeFormData.name) {
            if (editingNode) {
                // Update existing node
                setNodes(nodes.map(node =>
                    node.id === editingNode.id
                        ? { ...node, ...nodeFormData }
                        : node
                ));
                setEditingNode(null);
            } else {
                // Create new node
                const newNode: Node = {
                    id: nextNodeId.toString(),
                    buildingId: nodeFormData.buildingId,
                    floorId: nodeFormData.floorId,
                    name: nodeFormData.name,
                    position: nodeFormData.position
                };
                setNodes([...nodes, newNode]);
                setNextNodeId(nextNodeId + 1);
            }
            setShowNodeForm(false);
            setNodeFormData({
                buildingId: defaultBuildingId,
                floorId: defaultFloorId,
                name: '',
                position: { x: 0, y: 0 }
            });
        }
    };

    const handleEdgeFormSubmit = () => {
        if (edgeFormData.type) {
            if (editingEdge) {
                // Update existing edge
                setEdges(edges.map(edge =>
                    edge.id === editingEdge.id
                        ? { ...edge, ...edgeFormData }
                        : edge
                ));
                setEditingEdge(null);
            } else if (selectedNode) {
                // Create new edge
                const newEdge: Edge = {
                    id: `edge-${edges.length + 1}`,
                    buildingId: selectedNode.buildingId,
                    floorId: selectedNode.floorId,
                    sourceId: selectedNode.id,
                    targetId: edgeFormData.targetId,
                    type: edgeFormData.type,
                };
                setEdges([...edges, newEdge]);
                setSelectedNode(null);
            }
            setShowEdgeForm(false);
            setEdgeFormData({
                buildingId: '',
                floorId: '',
                sourceId: '',
                targetId: '',
                type: 'floor'
            });
        }
    };

    const handleDeleteEdge = (edgeId: string) => {
        setEdges(edges.filter(edge => edge.id !== edgeId));
    };

    const handleEdgeEdit = (edge: Edge) => {
        setEditingEdge(edge);
        setEdgeFormData({
            buildingId: edge.buildingId,
            floorId: edge.floorId,
            sourceId: edge.sourceId,
            targetId: edge.targetId,
            type: edge.type
        });
        setShowEdgeForm(true);
    };

    const handleExport = () => {
        // Create nodes CSV
        const nodesCSV = [
            ['id', 'building_id', 'floor_id', 'name', 'x', 'y'].join(';'),
            ...nodes.map(node => [
                node.id,
                node.buildingId,
                node.floorId,
                node.name,
                node.position.x,
                node.position.y
            ].join(';'))
        ].join('\n');

        // Create edges CSV
        const edgesCSV = [
            ['building_id', 'floor_id', 'source_id', 'target_id', 'type'].join(';'),
            ...edges.map(edge => [
                edge.buildingId,
                edge.floorId,
                edge.sourceId,
                edge.targetId,
                edge.type
            ].join(';'))
        ].join('\n');

        // Create and download nodes CSV
        const nodesBlob = new Blob([nodesCSV], { type: 'text/csv;charset=utf-8;' });
        const nodesLink = document.createElement('a');
        nodesLink.href = URL.createObjectURL(nodesBlob);
        nodesLink.download = 'nodes.csv';
        nodesLink.click();

        // Create and download edges CSV
        const edgesBlob = new Blob([edgesCSV], { type: 'text/csv;charset=utf-8;' });
        const edgesLink = document.createElement('a');
        edgesLink.href = URL.createObjectURL(edgesBlob);
        edgesLink.download = 'edges.csv';
        edgesLink.click();
    };

    const getNodeStyle = (node: Node) => {
        const imageElement = canvasRef.current?.querySelector('img');
        if (!imageElement) return {};

        const imageRect = imageElement.getBoundingClientRect();

        // Calculate scaling factors
        const scaleX = imageRect.width / imageSize.width;
        const scaleY = imageRect.height / imageSize.height;

        // Convert actual image coordinates to display coordinates
        const displayX = node.position.x * scaleX;
        const displayY = node.position.y * scaleY;

        return {
            position: 'absolute',
            left: `${displayX}px`,
            top: `${displayY}px`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: selectedNode?.id === node.id ? 'blue' : 'red',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            zIndex: 2
        } as React.CSSProperties;
    };

    const getEdgeStyle = (edge: Edge) => {
        const imageElement = canvasRef.current?.querySelector('img');
        if (!imageElement) return {};

        const sourceNode = nodes.find(n => n.id === edge.sourceId);
        const targetNode = nodes.find(n => n.id === edge.targetId);
        if (!sourceNode || !targetNode) return {};

        const imageRect = imageElement.getBoundingClientRect();

        // Calculate scaling factors
        const scaleX = imageRect.width / imageSize.width;
        const scaleY = imageRect.height / imageSize.height;

        // Convert actual image coordinates to display coordinates
        const sourceX = sourceNode.position.x * scaleX;
        const sourceY = sourceNode.position.y * scaleY;
        const targetX = targetNode.position.x * scaleX;
        const targetY = targetNode.position.y * scaleY;

        const length = Math.sqrt(
            Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
        );
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX) * 180 / Math.PI;

        return {
            position: 'absolute' as const,
            left: `${sourceX}px`,
            top: `${sourceY}px`,
            width: `${length}px`,
            height: '2px',
            backgroundColor: edge.type === 'floor' ? 'green' : edge.type === 'stair' ? 'blue' : 'red',
            transform: `translate(0, -50%) rotate(${angle}deg)`,
            transformOrigin: '0 0',
            zIndex: 1
        };
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                />
                <label htmlFor="image-upload">
                    <Button variant="contained" component="span">
                        Upload Floor Plan
                    </Button>
                </label>
                <TextField
                    label="Default Building ID"
                    value={defaultBuildingId}
                    onChange={(e) => setDefaultBuildingId(e.target.value)}
                    size="small"
                />
                <TextField
                    label="Default Floor ID"
                    value={defaultFloorId}
                    onChange={(e) => setDefaultFloorId(e.target.value)}
                    size="small"
                />
                <Button
                    variant="contained"
                    color={isCreatingEdge ? "secondary" : "primary"}
                    onClick={() => setIsCreatingEdge(!isCreatingEdge)}
                >
                    {isCreatingEdge ? "Cancel Edge" : "Create Edge"}
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={handleExport}
                    disabled={nodes.length === 0}
                >
                    Export to CSV
                </Button>
            </Box>

            <Box
                sx={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    border: '1px solid #ccc',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f5f5f5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 2
                }}
                ref={canvasRef}
                onClick={handleCanvasClick}
            >
                {image && (
                    <img
                        ref={imageRef}
                        src={image}
                        alt="Floor Plan"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            position: 'relative',
                            zIndex: 0
                        }}
                        onLoad={() => {
                            if (imageRef.current) {
                                setNodes([]); // Clear nodes when loading new image
                            }
                        }}
                        draggable={false}
                    />
                )}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                    }}
                >
                    {edges.map(edge => (
                        <div key={`${edge.sourceId}-${edge.targetId}`} style={getEdgeStyle(edge)} />
                    ))}
                    {nodes.map(node => (
                        <div key={node.id} style={getNodeStyle(node)} />
                    ))}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TableContainer component={Paper} sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ p: 1, bgcolor: 'primary.main', color: 'white' }}>
                        Nodes Preview
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Building ID</TableCell>
                                <TableCell>Floor ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>X</TableCell>
                                <TableCell>Y</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {nodes.map((node) => (
                                <TableRow
                                    key={node.id}
                                    onClick={() => handleNodeEdit(node)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                    }}
                                >
                                    <TableCell>{node.id}</TableCell>
                                    <TableCell>{node.buildingId}</TableCell>
                                    <TableCell>{node.floorId}</TableCell>
                                    <TableCell>{node.name}</TableCell>
                                    <TableCell>{node.position.x}</TableCell>
                                    <TableCell>{node.position.y}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNode(node.id);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {nodes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">No nodes created yet</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TableContainer component={Paper} sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ p: 1, bgcolor: 'primary.main', color: 'white' }}>
                        Edges Preview
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Building ID</TableCell>
                                <TableCell>Floor ID</TableCell>
                                <TableCell>Source ID</TableCell>
                                <TableCell>Target ID</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {edges.map((edge) => (
                                <TableRow
                                    key={edge.id}
                                    onClick={() => handleEdgeEdit(edge)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                    }}
                                >
                                    <TableCell>{edge.buildingId}</TableCell>
                                    <TableCell>{edge.floorId}</TableCell>
                                    <TableCell>{edge.sourceId}</TableCell>
                                    <TableCell>{edge.targetId}</TableCell>
                                    <TableCell>{edge.type}</TableCell>
                                    <TableCell>
                                        <Button
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEdge(edge.id);
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {edges.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No edges created yet</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Dialog
                open={showNodeForm}
                onClose={() => {
                    setShowNodeForm(false);
                    setEditingNode(null);
                }}
                disableEscapeKeyDown
            >
                <Box
                    component="form"
                    onSubmit={handleNodeFormSubmit}
                    sx={{ p: 2 }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {editingNode ? 'Edit Node' : 'Create Node'}
                    </Typography>
                    <TextField
                        label="Building ID"
                        value={nodeFormData.buildingId}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, buildingId: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Floor ID"
                        value={nodeFormData.floorId}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, floorId: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Name"
                        value={nodeFormData.name}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
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
                        {editingNode ? 'Save Changes' : 'Create Node'}
                    </Button>
                </Box>
            </Dialog>

            <Dialog
                open={showEdgeForm}
                onClose={() => {
                    setShowEdgeForm(false);
                    setEditingEdge(null);
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {editingEdge ? 'Edit Edge' : 'Create Edge'}
                    </Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Edge Type</InputLabel>
                        <Select
                            value={edgeFormData.type}
                            onChange={(e) => setEdgeFormData({ ...edgeFormData, type: e.target.value as 'floor' | 'stair' | 'elevator' })}
                        >
                            <MenuItem value="floor">Floor</MenuItem>
                            <MenuItem value="stair">Stair</MenuItem>
                            <MenuItem value="elevator">Elevator</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        onClick={handleEdgeFormSubmit}
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        {editingEdge ? 'Save Changes' : 'Create Edge'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}; 