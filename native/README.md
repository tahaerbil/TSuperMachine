# TSuperMachine Native CAD Engine

Native C++ CAD engine for TSuperMachine desktop application.

## Structure

```
native/
├── CMakeLists.txt          # CMake build configuration
├── package.json            # Node.js addon configuration
├── src/
│   ├── cad2d/              # 2D CAD Engine
│   │   ├── Geometry.h      # Entity classes (Line, Circle, Arc, etc.)
│   │   ├── Database.h      # Entity storage
│   │   ├── Engine.h        # Engine API
│   │   └── Engine.cpp      # Engine implementation
│   │
│   └── bindings/
│       └── node/           # Node.js Native Addon
│           └── addon.cpp   # N-API bindings
```

## Building

### Prerequisites

- CMake 3.15+
- C++17 compiler (GCC 9+, Clang 10+)
- Node.js 18+
- npm

### Install Dependencies

Dependencies are managed via the root `package.json` workspaces.

### Build (from root)

```bash
npm run native:build
npm run native:rebuild
```

### Build for Debug

```bash
npm run build:debug
```

## Usage in Electron

```javascript
// In Electron main process or preload
const cadAddon = require('./native/build/Release/cad_addon.node');

// Initialize engine
cadAddon.createEngine();

// Draw a line
const lineId = cadAddon.addLine(0, 0, 100, 100);

// Get render buffer
const buffer = cadAddon.getRenderBuffer();

// Cleanup
cadAddon.destroyEngine();
```

## API Reference

### Engine Lifecycle
- `createEngine()` - Initialize the CAD engine
- `destroyEngine()` - Cleanup the CAD engine

### Drawing Commands
- `addLine(x1, y1, x2, y2)` - Add a line
- `addCircle(cx, cy, radius)` - Add a circle
- `addRectangle(x1, y1, x2, y2)` - Add a rectangle
- `addArc(cx, cy, radius, startAngle, endAngle)` - Add an arc
- `addRegularPolygon(cx, cy, sides, radius)` - Add a regular polygon
- `addPolyline(points, closed)` - Add a polyline (points: [{x, y}, ...], closed: boolean)

### Serialization
- `exportDatabase()` - Returns the entire CAD database as a JSON string
- `importDatabase(json)` - Clears current database and loads entities from JSON string

### Modification Commands
- `clear()` - Clear all entities
- `deleteEntity(id)` - Delete entity by ID

### Selection Commands
- `hitTest(x, y, threshold)` - Test if point hits an entity
- `selectEntity(id)` - Toggle entity selection
- `deselectAll()` - Deselect all entities
- `deleteSelected()` - Delete selected entities
- `moveSelected(dx, dy)` - Move selected entities
- `copySelected(dx, dy)` - Copy selected entities
- `selectByWindow(x1, y1, x2, y2)` - Select entities fully inside window
- `selectByCrossing(x1, y1, x2, y2)` - Select entities crossing window
- `rotateSelected(cx, cy, angle)` - Rotate selected entities
- `offsetEntity(id, distance, clickX, clickY)` - Offset an entity

### Snapping
- `findClosestSnapPoint(x, y, threshold)` - Find closest snap point

### Rendering
- `getRenderBuffer()` - Get Float32Array of render data
