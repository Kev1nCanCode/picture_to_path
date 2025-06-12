import { Box, Container, Typography } from '@mui/material';
import { Canvas } from './components/Canvas';

function App() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Floor Plan Node Editor
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Upload a floor plan image and create nodes by clicking on the image. Connect nodes by using the "Create Edge" button.
        </Typography>
        <Canvas />
      </Box>
    </Container>
  );
}

export default App;
