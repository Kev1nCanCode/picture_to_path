import { useState, useRef, useEffect } from 'react';
import { Box, Button, Dialog, TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Switch, FormControlLabel } from '@mui/material';
import type { Node, Edge, NodeFormData, NodeColor } from '../types';

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
        position: { x: 0, y: 0 },
        color: 'red',
        isSearchable: false
    });
    const [edgeFormData, setEdgeFormData] = useState({
        buildingId: '',
        floorId: '',
        sourceId: '',
        targetId: '',
        type: 'floor' as 'floor' | 'stair' | 'elevator',
        weight: 0
    });
    const [defaultBuildingId, setDefaultBuildingId] = useState('');
    const [defaultFloorId, setDefaultFloorId] = useState('');
    const [nextNodeId, setNextNodeId] = useState(1); // Track the next available node ID
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
    const [isNextNodeSearchable, setIsNextNodeSearchable] = useState(false);

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
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const imageElement = canvas.querySelector('img');
        if (!imageElement) return;

        const imageRect = imageElement.getBoundingClientRect();

        // Calculate scaling factors
        const scaleX = imageSize.width / imageRect.width;
        const scaleY = imageSize.height / imageRect.height;

        // Calculate the offset of the image within the canvas
        const imageOffsetX = (rect.width - imageRect.width) / 2;
        const imageOffsetY = (rect.height - imageRect.height) / 2;

        // Convert display coordinates to actual image coordinates
        const actualX = Math.round((x - imageOffsetX) * scaleX);
        const actualY = Math.round((y - imageOffsetY) * scaleY);

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
                    // Calculate weight using the distance formula
                    const weight = Math.sqrt(
                        Math.pow(clickedNode.position.x - selectedNode.position.x, 2) +
                        Math.pow(clickedNode.position.y - selectedNode.position.y, 2)
                    );

                    // Second node selection - create edge
                    const newEdge: Edge = {
                        id: `edge-${edges.length + 1}`,
                        buildingId: selectedNode.buildingId,
                        floorId: selectedNode.floorId,
                        sourceId: selectedNode.id,
                        targetId: clickedNode.id,
                        type: 'floor', // default type
                        weight: weight
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
                position: { x: actualX, y: actualY },
                color: 'red',
                isSearchable: isNextNodeSearchable
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
            position: node.position,
            color: node.color,
            isSearchable: node.isSearchable
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
                    position: nodeFormData.position,
                    color: nodeFormData.color,
                    isSearchable: nodeFormData.isSearchable
                };
                setNodes([...nodes, newNode]);
                setNextNodeId(nextNodeId + 1);
            }
            setShowNodeForm(false);
            setNodeFormData({
                buildingId: defaultBuildingId,
                floorId: defaultFloorId,
                name: '',
                position: { x: 0, y: 0 },
                color: 'red',
                isSearchable: isNextNodeSearchable
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
                // Find the target node to calculate weight
                const targetNode = nodes.find(node => node.id === edgeFormData.targetId);
                if (!targetNode) return;

                // Calculate weight using the distance formula
                const weight = Math.sqrt(
                    Math.pow(targetNode.position.x - selectedNode.position.x, 2) +
                    Math.pow(targetNode.position.y - selectedNode.position.y, 2)
                );

                // Create new edge
                const newEdge: Edge = {
                    id: `edge-${edges.length + 1}`,
                    buildingId: selectedNode.buildingId,
                    floorId: selectedNode.floorId,
                    sourceId: selectedNode.id,
                    targetId: edgeFormData.targetId,
                    type: edgeFormData.type,
                    weight: weight
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
                type: 'floor',
                weight: 0
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
            type: edge.type,
            weight: edge.weight
        });
        setShowEdgeForm(true);
    };

    const handleExport = () => {
        // Create nodes CSV
        const nodesCSV = [
            ['id', 'building_id', 'floor_id', 'name', 'x', 'y', 'is_searchable'].join(';'),
            ...nodes.map(node => [
                node.id,
                node.buildingId,
                node.floorId,
                node.name,
                node.position.x,
                node.position.y,
                node.isSearchable ? 'TRUE' : 'FALSE'
            ].join(';'))
        ].join('\n');

        // Create edges CSV
        const edgesCSV = [
            ['building_id', 'floor_id', 'source_id', 'target_id', 'type', 'weight'].join(';'),
            ...edges.map(edge => [
                edge.buildingId,
                edge.floorId,
                edge.sourceId,
                edge.targetId,
                edge.type,
                edge.weight.toFixed(2)
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
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return {};

        // Calculate scaling factors
        const scaleX = imageRect.width / imageSize.width;
        const scaleY = imageRect.height / imageSize.height;

        // Calculate the offset of the image within the canvas
        const imageOffsetX = (canvasRect.width - imageRect.width) / 2;
        const imageOffsetY = (canvasRect.height - imageRect.height) / 2;

        // Convert actual image coordinates to display coordinates
        const displayX = node.position.x * scaleX + imageOffsetX;
        const displayY = node.position.y * scaleY + imageOffsetY;

        return {
            position: 'absolute',
            left: `${displayX}px`,
            top: `${displayY}px`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: selectedNode?.id === node.id ? 'blue' : node.color,
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
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return {};

        // Calculate scaling factors
        const scaleX = imageRect.width / imageSize.width;
        const scaleY = imageRect.height / imageSize.height;

        // Calculate the offset of the image within the canvas
        const imageOffsetX = (canvasRect.width - imageRect.width) / 2;
        const imageOffsetY = (canvasRect.height - imageRect.height) / 2;

        // Convert actual image coordinates to display coordinates
        const sourceX = sourceNode.position.x * scaleX + imageOffsetX;
        const sourceY = sourceNode.position.y * scaleY + imageOffsetY;
        const targetX = targetNode.position.x * scaleX + imageOffsetX;
        const targetY = targetNode.position.y * scaleY + imageOffsetY;

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
                <FormControlLabel
                    control={
                        <Switch
                            checked={isNextNodeSearchable}
                            onChange={(e) => setIsNextNodeSearchable(e.target.checked)}
                            color="primary"
                        />
                    }
                    label={`Next node will be ${isNextNodeSearchable ? 'searchable' : 'not searchable'}`}
                />
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
                                <TableCell>Searchable</TableCell>
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
                                    <TableCell>{node.isSearchable ? 'TRUE' : 'FALSE'}</TableCell>
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
                                <TableCell>Weight</TableCell>
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
                                    <TableCell>{edge.weight.toFixed(2)}</TableCell>
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
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Node Color</InputLabel>
                        <Select
                            value={nodeFormData.color}
                            onChange={(e) => setNodeFormData({ ...nodeFormData, color: e.target.value as NodeColor })}
                            label="Node Color"
                        >
                            <MenuItem value="red">Red</MenuItem>
                            <MenuItem value="green">Green</MenuItem>
                            <MenuItem value="blue">Blue</MenuItem>
                        </Select>
                    </FormControl>
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