#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>

// Forward declarations for OpenCASCADE types
class TopoDS_Shape;

namespace CAD3D {

// ============================================================================
// Mesh Data Structure (For Three.js Rendering)
// ============================================================================
struct MeshData {
    std::vector<float> vertices;    // [x, y, z, x, y, z, ...]
    std::vector<float> normals;     // [nx, ny, nz, nx, ny, nz, ...]
    std::vector<uint32_t> indices;  // Triangle indices
    bool valid = false;
};

// ============================================================================
// Shape Handle (Wraps OCCT TopoDS_Shape)
// ============================================================================
class ShapeHandle {
public:
    ShapeHandle();
    ~ShapeHandle();
    
    // Move semantics for efficiency
    ShapeHandle(ShapeHandle&& other) noexcept;
    ShapeHandle& operator=(ShapeHandle&& other) noexcept;
    
    // No copying (OCCT shapes can be heavy)
    ShapeHandle(const ShapeHandle&) = delete;
    ShapeHandle& operator=(const ShapeHandle&) = delete;
    
    bool isValid() const;
    
    // Internal OCCT access (implementation uses pimpl)
    class Impl;
    std::unique_ptr<Impl> impl;
};

// ============================================================================
// CAD3DEngine - Main Professional 3D Kernel Interface
// ============================================================================
class Engine {
public:
    Engine();
    ~Engine();
    
    // ========================================================================
    // Primitive Creation (Returns Shape ID)
    // ========================================================================
    // ========================================================================
    // Feature-Based Modeling API (Phase 2)
    // ========================================================================
    
    // Datum System
    uint32_t createDatumPlane(double ox, double oy, double oz, double nx, double ny, double nz);
    
    // Sketching (2D on Plane)
    uint32_t createSketch(uint32_t planeId);
    void addSketchLine(uint32_t sketchId, double x1, double y1, double x2, double y2);
    void addSketchCircle(uint32_t sketchId, double cx, double cy, double radius);
    void addSketchArc(uint32_t sketchId, double cx, double cy, double radius, double startAngle, double endAngle);
    
    // Feature Operations
    uint32_t createExtrude(uint32_t sketchId, double height, bool symmetric = false);
    uint32_t createRevolve(uint32_t sketchId, double px, double py, double pz, double dx, double dy, double dz, double angleDeg);

    // ========================================================================
    // Primitive Creation (Returns Shape ID)
    // ========================================================================
    uint32_t createBox(double dx, double dy, double dz);
    uint32_t createCylinder(double radius, double height);
    uint32_t createSphere(double radius);
    uint32_t createCone(double bottomRadius, double topRadius, double height);
    uint32_t createTorus(double majorRadius, double minorRadius);
    
    // ========================================================================
    // Boolean Operations
    // ========================================================================
    uint32_t booleanFuse(uint32_t shapeA, uint32_t shapeB);      // Union
    uint32_t booleanCut(uint32_t shapeA, uint32_t shapeB);       // Subtraction
    uint32_t booleanCommon(uint32_t shapeA, uint32_t shapeB);    // Intersection
    
    // ========================================================================
    // Modification Operations
    // ========================================================================
    bool translateShape(uint32_t id, double dx, double dy, double dz);
    bool rotateShape(uint32_t id, double axisX, double axisY, double axisZ, double angleDeg);
    bool filletEdges(uint32_t id, double radius);                // Edge rounding
    bool chamferEdges(uint32_t id, double distance);             // Edge beveling
    
    // ========================================================================
    // Data Export / Import
    // ========================================================================
    bool exportSTEP(uint32_t id, const std::string& filePath);
    bool exportIGES(uint32_t id, const std::string& filePath);
    uint32_t importSTEP(const std::string& filePath);
    uint32_t importIGES(const std::string& filePath);
    
    // ========================================================================
    // Rendering (Mesh Generation for Three.js)
    // ========================================================================
    MeshData getMeshData(uint32_t id, double deflection = 0.1);
    
    // ========================================================================
    // Internal Types (Public for helper access)
    // ========================================================================
    struct SketchElement {
        enum Type { LINE, CIRCLE, ARC } type;
        std::vector<double> params;
    };
    
    struct SketchObject {
        uint32_t planeId;
        std::vector<SketchElement> elements;
    };

    // ========================================================================
    // Management
    // ========================================================================
    bool deleteShape(uint32_t id);
    void clear();
    std::vector<uint32_t> getAllShapeIds() const;
    
private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
    
    uint32_t nextId = 1;
    std::unordered_map<uint32_t, ShapeHandle> shapes;
    std::unordered_map<uint32_t, SketchObject> sketches;
};

} // namespace CAD3D
