# Floor Plan Node Editor

A web application for creating and managing nodes and edges on building floor plans. This tool allows you to upload floor plan images, place nodes at specific locations, and connect them with different types of edges (floor, stair, or elevator).

## Features

- Upload floor plan images
- Place nodes by clicking on the image
- Set default building and floor IDs
- Create edges between nodes with different types (floor, stair, elevator)
- Export nodes and edges to CSV files
- Responsive design that maintains node positions when resizing
- Support for high-resolution images with precise coordinate mapping

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd picture_to_path
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:5173
```

## How to Use

### Setting Default Values
1. At the top of the page, you'll find two text fields:
   - Default Building ID
   - Default Floor ID
2. Enter your default values here to automatically fill them when creating new nodes

### Uploading a Floor Plan
1. Click the file input button at the top of the page
2. Select your floor plan image file
3. The image will be displayed in the canvas area

### Creating Nodes
1. Click anywhere on the floor plan image
2. A dialog will appear with the following fields:
   - Building ID (pre-filled with default value)
   - Floor ID (pre-filled with default value)
   - Name (automatically focused)
3. Enter the node name and press Enter or click "Create Node"
4. The node will appear as a dot at the clicked location

### Creating Edges
1. Click the "Create Edge" button to enter edge creation mode
2. Click on the source node (it will be highlighted)
3. Click on the target node
4. Select the edge type in the dialog:
   - Floor (green line)
   - Stair (blue line)
   - Elevator (red line)
5. The edge will be created between the nodes
6. You can create multiple edges in sequence without clicking the "Create Edge" button again
7. Click "Create Edge" again to exit edge creation mode

### Exporting Data
1. Click the "Export to CSV" button
2. Two files will be downloaded:
   - `nodes.csv`: Contains node information (building_id, floor_id, name, x, y)
   - `edges.csv`: Contains edge information (building_id, floor_id, source_id, target_id, type)

### CSV Format

#### Nodes CSV Format
```
building_id;floor_id;name;x;y
```
- building_id: The ID of the building
- floor_id: The ID of the floor
- name: The name of the node
- x: X-coordinate in pixels
- y: Y-coordinate in pixels

#### Edges CSV Format
```
building_id;floor_id;source_id;target_id;type
```
- building_id: The ID of the building
- floor_id: The ID of the floor
- source_id: The ID of the source node
- target_id: The ID of the target node
- type: The type of edge (floor, stair, or elevator)

## Tips
- The coordinates are based on the actual image dimensions, not the displayed size
- Nodes and edges maintain their relative positions when the window is resized
- You can create multiple edges in sequence without exiting edge creation mode
- The name field is automatically focused when creating a new node
- Press Enter to quickly create a node after entering its name

## Development

### Project Structure
```
src/
  ├── components/
  │   └── Canvas.tsx    # Main canvas component
  ├── types/
  │   └── index.ts      # TypeScript type definitions
  ├── App.tsx           # Main application component
  └── main.tsx          # Application entry point
```

### Technologies Used
- React
- TypeScript
- Material-UI
- Vite

## License

This project is licensed under the MIT License.
