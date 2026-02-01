#include "CAD3DEngine.h"
#include <cstdint>

#ifdef HAVE_OPENCASCADE
// OpenCASCADE includes
#include <TopoDS.hxx>
#include <TopoDS_Shape.hxx>
#include <BRepPrimAPI_MakeBox.hxx>
#include <BRepPrimAPI_MakeCylinder.hxx>
#include <BRepPrimAPI_MakeSphere.hxx>
#include <BRepPrimAPI_MakeCone.hxx>
#include <BRepPrimAPI_MakeTorus.hxx>
#include <BRepAlgoAPI_Fuse.hxx>
#include <BRepAlgoAPI_Cut.hxx>
#include <BRepAlgoAPI_Common.hxx>
#include <BRepFilletAPI_MakeFillet.hxx>
#include <BRepFilletAPI_MakeChamfer.hxx>
#include <BRepMesh_IncrementalMesh.hxx>
#include <BRep_Tool.hxx>
#include <TopExp_Explorer.hxx>
#include <TopoDS_Face.hxx>
#include <Poly_Triangulation.hxx>
#include <gp_Trsf.hxx>
#include <gp_Vec.hxx>
#include <gp_Ax1.hxx>
#include <BRepBuilderAPI_Transform.hxx>
#include <STEPControl_Writer.hxx>
#include <STEPControl_Reader.hxx>
#include <IGESControl_Writer.hxx>
#include <IGESControl_Reader.hxx>
#include <BRepPrimAPI_MakePrism.hxx>
#include <BRepPrimAPI_MakeRevol.hxx>
#include <BRepBuilderAPI_MakeEdge.hxx>
#include <BRepBuilderAPI_MakeWire.hxx>
#include <BRepBuilderAPI_MakeFace.hxx>
#include <Geom_Plane.hxx>
#include <Geom_Line.hxx>
#include <Geom_Circle.hxx>
#include <GC_MakeSegment.hxx>
#include <GC_MakeCircle.hxx>
#include <GC_MakeArcOfCircle.hxx>
#include <TopLoc_Location.hxx>
#endif

#include <iostream>
#include <cmath>

namespace CAD3D {

// ============================================================================
// ShapeHandle Implementation (PIMPL)
// ============================================================================
class ShapeHandle::Impl {
public:
#ifdef HAVE_OPENCASCADE
    TopoDS_Shape shape;
#endif
    bool valid = false;
};

ShapeHandle::ShapeHandle() : impl(std::make_unique<Impl>()) {}
ShapeHandle::~ShapeHandle() = default;

ShapeHandle::ShapeHandle(ShapeHandle&& other) noexcept = default;
ShapeHandle& ShapeHandle::operator=(ShapeHandle&& other) noexcept = default;

bool ShapeHandle::isValid() const {
    return impl && impl->valid;
}

// ============================================================================
// Engine Implementation (PIMPL)
// ============================================================================
class Engine::Impl {
public:
    // Future: Add document management, undo stack, etc.
};

Engine::Engine() : pImpl(std::make_unique<Impl>()) {
#ifdef HAVE_OPENCASCADE
    std::cout << "[CAD3D] Engine initialized with OpenCASCADE support" << std::endl;
#else
    std::cout << "[CAD3D] Engine initialized (STUB MODE - No OCCT)" << std::endl;
#endif
}

Engine::~Engine() = default;

// ============================================================================
// Primitive Creation
// ============================================================================
uint32_t Engine::createBox(double dx, double dy, double dz) {
    ShapeHandle handle;
    
#ifdef HAVE_OPENCASCADE
    try {
        BRepPrimAPI_MakeBox boxMaker(dx, dy, dz);
        boxMaker.Build();
        if (boxMaker.IsDone()) {
            handle.impl->shape = boxMaker.Shape();
            handle.impl->valid = true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Box creation failed: " << e.GetMessageString() << std::endl;
        return 0;
    }
#else
    // STUB: Create placeholder for testing without OCCT
    handle.impl->valid = true;
    std::cout << "[CAD3D] STUB: Created box " << dx << "x" << dy << "x" << dz << std::endl;
#endif
    
    if (handle.isValid()) {
        uint32_t id = nextId++;
        shapes[id] = std::move(handle);
        return id;
    }
    return 0;
}

uint32_t Engine::createCylinder(double radius, double height) {
    ShapeHandle handle;
    
#ifdef HAVE_OPENCASCADE
    try {
        BRepPrimAPI_MakeCylinder cylMaker(radius, height);
        cylMaker.Build();
        if (cylMaker.IsDone()) {
            handle.impl->shape = cylMaker.Shape();
            handle.impl->valid = true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Cylinder creation failed: " << e.GetMessageString() << std::endl;
        return 0;
    }
#else
    handle.impl->valid = true;
    std::cout << "[CAD3D] STUB: Created cylinder R=" << radius << " H=" << height << std::endl;
#endif
    
    if (handle.isValid()) {
        uint32_t id = nextId++;
        shapes[id] = std::move(handle);
        return id;
    }
    return 0;
}

uint32_t Engine::createSphere(double radius) {
    ShapeHandle handle;
    
#ifdef HAVE_OPENCASCADE
    try {
        BRepPrimAPI_MakeSphere sphereMaker(radius);
        sphereMaker.Build();
        if (sphereMaker.IsDone()) {
            handle.impl->shape = sphereMaker.Shape();
            handle.impl->valid = true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Sphere creation failed: " << e.GetMessageString() << std::endl;
        return 0;
    }
#else
    handle.impl->valid = true;
    std::cout << "[CAD3D] STUB: Created sphere R=" << radius << std::endl;
#endif
    
    if (handle.isValid()) {
        uint32_t id = nextId++;
        shapes[id] = std::move(handle);
        return id;
    }
    return 0;
}

uint32_t Engine::createCone(double bottomRadius, double topRadius, double height) {
    ShapeHandle handle;
    
#ifdef HAVE_OPENCASCADE
    try {
        BRepPrimAPI_MakeCone coneMaker(bottomRadius, topRadius, height);
        coneMaker.Build();
        if (coneMaker.IsDone()) {
            handle.impl->shape = coneMaker.Shape();
            handle.impl->valid = true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Cone creation failed: " << e.GetMessageString() << std::endl;
        return 0;
    }
#else
    handle.impl->valid = true;
    std::cout << "[CAD3D] STUB: Created cone R1=" << bottomRadius << " R2=" << topRadius << " H=" << height << std::endl;
#endif
    
    if (handle.isValid()) {
        uint32_t id = nextId++;
        shapes[id] = std::move(handle);
        return id;
    }
    return 0;
}

uint32_t Engine::createTorus(double majorRadius, double minorRadius) {
    ShapeHandle handle;
    
#ifdef HAVE_OPENCASCADE
    try {
        BRepPrimAPI_MakeTorus torusMaker(majorRadius, minorRadius);
        torusMaker.Build();
        if (torusMaker.IsDone()) {
            handle.impl->shape = torusMaker.Shape();
            handle.impl->valid = true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Torus creation failed: " << e.GetMessageString() << std::endl;
        return 0;
    }
#else
    handle.impl->valid = true;
    std::cout << "[CAD3D] STUB: Created torus R=" << majorRadius << " r=" << minorRadius << std::endl;
#endif
    
    if (handle.isValid()) {
        uint32_t id = nextId++;
        shapes[id] = std::move(handle);
        return id;
    }
    return 0;
}

// ============================================================================
// Boolean Operations
// ============================================================================
uint32_t Engine::booleanFuse(uint32_t shapeA, uint32_t shapeB) {
#ifdef HAVE_OPENCASCADE
    auto itA = shapes.find(shapeA);
    auto itB = shapes.find(shapeB);
    if (itA == shapes.end() || itB == shapes.end()) return 0;
    
    try {
        BRepAlgoAPI_Fuse fuser(itA->second.impl->shape, itB->second.impl->shape);
        fuser.Build();
        if (fuser.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = fuser.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Boolean Fuse failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Boolean Fuse " << shapeA << " + " << shapeB << std::endl;
    return nextId++;
#endif
    return 0;
}

uint32_t Engine::booleanCut(uint32_t shapeA, uint32_t shapeB) {
#ifdef HAVE_OPENCASCADE
    auto itA = shapes.find(shapeA);
    auto itB = shapes.find(shapeB);
    if (itA == shapes.end() || itB == shapes.end()) return 0;
    
    try {
        BRepAlgoAPI_Cut cutter(itA->second.impl->shape, itB->second.impl->shape);
        cutter.Build();
        if (cutter.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = cutter.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Boolean Cut failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Boolean Cut " << shapeA << " - " << shapeB << std::endl;
    return nextId++;
#endif
    return 0;
}

uint32_t Engine::booleanCommon(uint32_t shapeA, uint32_t shapeB) {
#ifdef HAVE_OPENCASCADE
    auto itA = shapes.find(shapeA);
    auto itB = shapes.find(shapeB);
    if (itA == shapes.end() || itB == shapes.end()) return 0;
    
    try {
        BRepAlgoAPI_Common common(itA->second.impl->shape, itB->second.impl->shape);
        common.Build();
        if (common.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = common.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Boolean Common failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Boolean Common " << shapeA << " ∩ " << shapeB << std::endl;
    return nextId++;
#endif
    return 0;
}

// ============================================================================
// Modification Operations
// ============================================================================
bool Engine::translateShape(uint32_t id, double dx, double dy, double dz) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        gp_Trsf transform;
        transform.SetTranslation(gp_Vec(dx, dy, dz));
        BRepBuilderAPI_Transform transformer(it->second.impl->shape, transform, true);
        if (transformer.IsDone()) {
            it->second.impl->shape = transformer.Shape();
            return true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Translate failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Translate " << id << " by (" << dx << ", " << dy << ", " << dz << ")" << std::endl;
    return true;
#endif
    return false;
}

bool Engine::rotateShape(uint32_t id, double axisX, double axisY, double axisZ, double angleDeg) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        gp_Ax1 axis(gp_Pnt(0, 0, 0), gp_Dir(axisX, axisY, axisZ));
        gp_Trsf transform;
        transform.SetRotation(axis, angleDeg * M_PI / 180.0);
        BRepBuilderAPI_Transform transformer(it->second.impl->shape, transform, true);
        if (transformer.IsDone()) {
            it->second.impl->shape = transformer.Shape();
            return true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Rotate failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Rotate " << id << " around (" << axisX << ", " << axisY << ", " << axisZ << ") by " << angleDeg << "°" << std::endl;
    return true;
#endif
    return false;
}

bool Engine::filletEdges(uint32_t id, double radius) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        BRepFilletAPI_MakeFillet fillet(it->second.impl->shape);
        
        // Add all edges to fillet
        TopExp_Explorer explorer(it->second.impl->shape, TopAbs_EDGE);
        while (explorer.More()) {
            fillet.Add(radius, TopoDS::Edge(explorer.Current()));
            explorer.Next();
        }
        
        fillet.Build();
        if (fillet.IsDone()) {
            it->second.impl->shape = fillet.Shape();
            return true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Fillet failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Fillet all edges of " << id << " with R=" << radius << std::endl;
    return true;
#endif
    return false;
}

bool Engine::chamferEdges(uint32_t id, double distance) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        BRepFilletAPI_MakeChamfer chamfer(it->second.impl->shape);
        
        TopExp_Explorer explorer(it->second.impl->shape, TopAbs_EDGE);
        while (explorer.More()) {
            chamfer.Add(distance, TopoDS::Edge(explorer.Current()));
            explorer.Next();
        }
        
        chamfer.Build();
        if (chamfer.IsDone()) {
            it->second.impl->shape = chamfer.Shape();
            return true;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Chamfer failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Chamfer all edges of " << id << " with D=" << distance << std::endl;
    return true;
#endif
    return false;
}

// ============================================================================
// Mesh Generation (For Three.js Rendering)
// ============================================================================
MeshData Engine::getMeshData(uint32_t id, double deflection) {
    MeshData mesh;
    
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return mesh;
    
    try {
        // Triangulate the shape
        BRepMesh_IncrementalMesh mesher(it->second.impl->shape, deflection);
        mesher.Perform();
        
        if (!mesher.IsDone()) return mesh;
        
        // Extract triangles from all faces
        TopExp_Explorer faceExplorer(it->second.impl->shape, TopAbs_FACE);
        
        uint32_t vertexOffset = 0;
        
        while (faceExplorer.More()) {
            TopoDS_Face face = TopoDS::Face(faceExplorer.Current());
            TopLoc_Location location;
            Handle(Poly_Triangulation) triangulation = BRep_Tool::Triangulation(face, location);
            
            if (!triangulation.IsNull()) {
                gp_Trsf transform = location.Transformation();
                
                // Add vertices and normals
                for (int i = 1; i <= triangulation->NbNodes(); ++i) {
                    gp_Pnt point = triangulation->Node(i).Transformed(transform);
                    mesh.vertices.push_back(static_cast<float>(point.X()));
                    mesh.vertices.push_back(static_cast<float>(point.Y()));
                    mesh.vertices.push_back(static_cast<float>(point.Z()));
                    
                    // Compute normal (simplified - use face normal)
                    if (triangulation->HasNormals()) {
                        gp_Dir normal = triangulation->Normal(i);
                        mesh.normals.push_back(static_cast<float>(normal.X()));
                        mesh.normals.push_back(static_cast<float>(normal.Y()));
                        mesh.normals.push_back(static_cast<float>(normal.Z()));
                    } else {
                        mesh.normals.push_back(0.0f);
                        mesh.normals.push_back(0.0f);
                        mesh.normals.push_back(1.0f);
                    }
                }
                
                // Add triangle indices
                for (int i = 1; i <= triangulation->NbTriangles(); ++i) {
                    const Poly_Triangle& tri = triangulation->Triangle(i);
                    int n1, n2, n3;
                    tri.Get(n1, n2, n3);
                    
                    // Adjust for 0-based indexing and vertex offset
                    mesh.indices.push_back(vertexOffset + n1 - 1);
                    mesh.indices.push_back(vertexOffset + n2 - 1);
                    mesh.indices.push_back(vertexOffset + n3 - 1);
                }
                
                vertexOffset += triangulation->NbNodes();
            }
            
            faceExplorer.Next();
        }
        
        mesh.valid = !mesh.vertices.empty();
        
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Mesh generation failed: " << e.GetMessageString() << std::endl;
    }
#else
    // STUB: Generate a simple cube mesh for testing
    // 8 vertices, 12 triangles (2 per face)
    float s = 50.0f; // 50mm cube for visibility
    
    // Vertices (8 corners)
    float verts[] = {
        0, 0, 0,  s, 0, 0,  s, s, 0,  0, s, 0,  // Bottom
        0, 0, s,  s, 0, s,  s, s, s,  0, s, s   // Top
    };
    
    // Normals (per vertex, simplified)
    float norms[] = {
        -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1,
        -1,-1, 1, 1,-1, 1, 1,1, 1, -1,1, 1
    };
    
    // Indices (12 triangles)
    uint32_t inds[] = {
        0,1,2, 0,2,3, // Bottom
        4,6,5, 4,7,6, // Top
        0,4,5, 0,5,1, // Front
        2,6,7, 2,7,3, // Back
        0,3,7, 0,7,4, // Left
        1,5,6, 1,6,2  // Right
    };
    
    mesh.vertices.assign(verts, verts + 24);
    mesh.normals.assign(norms, norms + 24);
    mesh.indices.assign(inds, inds + 36);
    mesh.valid = true;
    
    std::cout << "[CAD3D] STUB: Generated placeholder cube mesh" << std::endl;
#endif
    
    return mesh;
}

// ============================================================================
// File Export/Import
// ============================================================================
bool Engine::exportSTEP(uint32_t id, const std::string& filePath) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        STEPControl_Writer writer;
        writer.Transfer(it->second.impl->shape, STEPControl_AsIs);
        IFSelect_ReturnStatus status = writer.Write(filePath.c_str());
        return status == IFSelect_RetDone;
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] STEP export failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Export STEP to " << filePath << std::endl;
    return true;
#endif
    return false;
}

bool Engine::exportIGES(uint32_t id, const std::string& filePath) {
#ifdef HAVE_OPENCASCADE
    auto it = shapes.find(id);
    if (it == shapes.end()) return false;
    
    try {
        IGESControl_Writer writer;
        writer.AddShape(it->second.impl->shape);
        return writer.Write(filePath.c_str());
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] IGES export failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Export IGES to " << filePath << std::endl;
    return true;
#endif
    return false;
}

uint32_t Engine::importSTEP(const std::string& filePath) {
#ifdef HAVE_OPENCASCADE
    try {
        STEPControl_Reader reader;
        IFSelect_ReturnStatus status = reader.ReadFile(filePath.c_str());
        if (status != IFSelect_RetDone) return 0;
        
        reader.TransferRoots();
        TopoDS_Shape shape = reader.OneShape();
        
        if (!shape.IsNull()) {
            ShapeHandle handle;
            handle.impl->shape = shape;
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] STEP import failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Import STEP from " << filePath << std::endl;
    return nextId++;
#endif
    return 0;
}

uint32_t Engine::importIGES(const std::string& filePath) {
#ifdef HAVE_OPENCASCADE
    try {
        IGESControl_Reader reader;
        IFSelect_ReturnStatus status = reader.ReadFile(filePath.c_str());
        if (status != IFSelect_RetDone) return 0;
        
        reader.TransferRoots();
        TopoDS_Shape shape = reader.OneShape();
        
        if (!shape.IsNull()) {
            ShapeHandle handle;
            handle.impl->shape = shape;
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] IGES import failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Import IGES from " << filePath << std::endl;
    return nextId++;
#endif
    return 0;
}

// ============================================================================
// Management
// ============================================================================
bool Engine::deleteShape(uint32_t id) {
    return shapes.erase(id) > 0;
}

void Engine::clear() {
    shapes.clear();
    nextId = 1;
}

std::vector<uint32_t> Engine::getAllShapeIds() const {
    std::vector<uint32_t> ids;
    ids.reserve(shapes.size());
    for (const auto& pair : shapes) {
        ids.push_back(pair.first);
    }
    return ids;
}

// Feature implementation will be appended here

// ============================================================================
// Feature-Based Modeling API (Phase 2)
// ============================================================================

uint32_t Engine::createDatumPlane(double ox, double oy, double oz, double nx, double ny, double nz) {
    // In Phase 2, Datum Planes are visual helpers or used for sketch orientation
    // We store them as a special shape or just track them
    // For now, let's create a visual plane (small surface)
    
#ifdef HAVE_OPENCASCADE
    try {
        gp_Pnt origin(ox, oy, oz);
        gp_Dir normal(nx, ny, nz);
        gp_Ax3 axis(origin, normal);
        
        // Create a 100x100 plane for visualization
        gp_Pln plane(axis);
        // Create a rectangular face on this plane
        // This is a simplification; datum planes are infinite
        BRepBuilderAPI_MakeFace faceMaker(plane, -50, 50, -50, 50);
        
        if (faceMaker.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = faceMaker.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Datum Plane creation failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Created Datum Plane at (" << ox << "," << oy << "," << oz << ")" << std::endl;
    return nextId++;
#endif
    return 0;
}

// Sketching
uint32_t Engine::createSketch(uint32_t planeId) {
    // Just create a new sketch container
    uint32_t id = nextId++;
    sketches[id] = SketchObject{planeId, {}};
    return id;
}

void Engine::addSketchLine(uint32_t sketchId, double x1, double y1, double x2, double y2) {
    auto it = sketches.find(sketchId);
    if (it != sketches.end()) {
        it->second.elements.push_back({SketchElement::LINE, {x1, y1, x2, y2}});
    }
}

void Engine::addSketchCircle(uint32_t sketchId, double cx, double cy, double radius) {
    auto it = sketches.find(sketchId);
    if (it != sketches.end()) {
        it->second.elements.push_back({SketchElement::CIRCLE, {cx, cy, radius}});
    }
}

void Engine::addSketchArc(uint32_t sketchId, double cx, double cy, double radius, double startAngle, double endAngle) {
    auto it = sketches.find(sketchId);
    if (it != sketches.end()) {
        it->second.elements.push_back({SketchElement::ARC, {cx, cy, radius, startAngle, endAngle}});
    }
}

// Helper to build wire from sketch
#ifdef HAVE_OPENCASCADE
TopoDS_Wire buildWireFromSketch(const Engine::SketchObject& sketch) {
    BRepBuilderAPI_MakeWire wireMaker;
    
    // In a real CAD system, we would map 2D sketch coords to 3D plane coords
    // For this MVP, let's assume sketch is on XY plane (z=0) for simplicity standard
    // Or we should use the planeId to get the transformation
    
    // TODO: Retrieve plane transformation from planeId
    gp_Trsf planeTrsf; // Identity for now (XY Plane)
    
    for (const auto& elem : sketch.elements) {
        if (elem.type == Engine::SketchElement::LINE) {
            gp_Pnt p1(elem.params[0], elem.params[1], 0);
            gp_Pnt p2(elem.params[2], elem.params[3], 0);
            p1.Transform(planeTrsf);
            p2.Transform(planeTrsf);
            wireMaker.Add(BRepBuilderAPI_MakeEdge(p1, p2));
        }
        else if (elem.type == Engine::SketchElement::CIRCLE) {
            gp_Pnt center(elem.params[0], elem.params[1], 0);
            center.Transform(planeTrsf);
            gp_Circ circle(gp_Ax2(center, gp::DZ()), elem.params[2]);
            wireMaker.Add(BRepBuilderAPI_MakeEdge(circle));
        }
        // TODO: Arcs
    }
    
    if (wireMaker.IsDone()) return wireMaker.Wire();
    return TopoDS_Wire();
}
#endif

uint32_t Engine::createExtrude(uint32_t sketchId, double height, bool symmetric) {
    auto it = sketches.find(sketchId);
    if (it == sketches.end()) return 0;

#ifdef HAVE_OPENCASCADE
    try {
        TopoDS_Wire wire = buildWireFromSketch(it->second);
        if (wire.IsNull()) return 0;
        
        // Create face from wire (profile)
        BRepBuilderAPI_MakeFace faceMaker(wire);
        if (!faceMaker.IsDone()) return 0;
        
        // Extrude
        gp_Vec extrudeDir(0, 0, height); // TODO: Use plane normal
        BRepPrimAPI_MakePrism prismMaker(faceMaker.Face(), extrudeDir);
        prismMaker.Build();
        
        if (prismMaker.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = prismMaker.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Extrude failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Extrude Sketch " << sketchId << " by " << height << std::endl;
    return nextId++;
#endif
    return 0;
}

uint32_t Engine::createRevolve(uint32_t sketchId, double px, double py, double pz, double dx, double dy, double dz, double angleDeg) {
    auto it = sketches.find(sketchId);
    if (it == sketches.end()) return 0;

#ifdef HAVE_OPENCASCADE
    try {
        TopoDS_Wire wire = buildWireFromSketch(it->second);
        if (wire.IsNull()) return 0;
        
        BRepBuilderAPI_MakeFace faceMaker(wire);
        if (!faceMaker.IsDone()) return 0;
        
        gp_Ax1 axis(gp_Pnt(px, py, pz), gp_Dir(dx, dy, dz));
        BRepPrimAPI_MakeRevol revolMaker(faceMaker.Face(), axis, angleDeg * M_PI / 180.0);
        revolMaker.Build();
        
        if (revolMaker.IsDone()) {
            ShapeHandle handle;
            handle.impl->shape = revolMaker.Shape();
            handle.impl->valid = true;
            uint32_t id = nextId++;
            shapes[id] = std::move(handle);
            return id;
        }
    } catch (const Standard_Failure& e) {
        std::cerr << "[CAD3D] Revolve failed: " << e.GetMessageString() << std::endl;
    }
#else
    std::cout << "[CAD3D] STUB: Revolve Sketch " << sketchId << " around axis" << std::endl;
    return nextId++;
#endif
    return 0;
}

} // namespace CAD3D

