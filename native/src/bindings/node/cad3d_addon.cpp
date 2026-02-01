/**
 * CAD3D Native Node.js Addon Binding
 * Exposes C++ CAD3DEngine to JavaScript via N-API
 */

#include <napi.h>
#include "../cad3d/CAD3DEngine.h"
#include <memory>

// Global engine instance (singleton for simplicity)
static std::unique_ptr<CAD3D::Engine> g_engine;

// ============================================================================
// Initialization
// ============================================================================
Napi::Value CreateEngine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        g_engine = std::make_unique<CAD3D::Engine>();
    }
    
    return Napi::Boolean::New(env, true);
}

Napi::Value DestroyEngine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    g_engine.reset();
    return Napi::Boolean::New(env, true);
}

// ============================================================================
// Primitive Creation
// ============================================================================
Napi::Value CreateBox(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: dx, dy, dz").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double dx = info[0].As<Napi::Number>().DoubleValue();
    double dy = info[1].As<Napi::Number>().DoubleValue();
    double dz = info[2].As<Napi::Number>().DoubleValue();
    
    uint32_t id = g_engine->createBox(dx, dy, dz);
    return Napi::Number::New(env, id);
}

Napi::Value CreateCylinder(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: radius, height").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double radius = info[0].As<Napi::Number>().DoubleValue();
    double height = info[1].As<Napi::Number>().DoubleValue();
    
    uint32_t id = g_engine->createCylinder(radius, height);
    return Napi::Number::New(env, id);
}

Napi::Value CreateSphere(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected 1 argument: radius").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double radius = info[0].As<Napi::Number>().DoubleValue();
    
    uint32_t id = g_engine->createSphere(radius);
    return Napi::Number::New(env, id);
}

Napi::Value CreateCone(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: bottomRadius, topRadius, height").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double bottomR = info[0].As<Napi::Number>().DoubleValue();
    double topR = info[1].As<Napi::Number>().DoubleValue();
    double height = info[2].As<Napi::Number>().DoubleValue();
    
    uint32_t id = g_engine->createCone(bottomR, topR, height);
    return Napi::Number::New(env, id);
}

Napi::Value CreateTorus(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: majorRadius, minorRadius").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double majorR = info[0].As<Napi::Number>().DoubleValue();
    double minorR = info[1].As<Napi::Number>().DoubleValue();
    
    uint32_t id = g_engine->createTorus(majorR, minorR);
    return Napi::Number::New(env, id);
}

// ============================================================================
// Feature Operations (Phase 2)
// ============================================================================

Napi::Value CreateDatumPlane(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 6) return Napi::Number::New(env, 0);
    
    double ox = info[0].As<Napi::Number>().DoubleValue();
    double oy = info[1].As<Napi::Number>().DoubleValue();
    double oz = info[2].As<Napi::Number>().DoubleValue();
    double nx = info[3].As<Napi::Number>().DoubleValue();
    double ny = info[4].As<Napi::Number>().DoubleValue();
    double nz = info[5].As<Napi::Number>().DoubleValue();
    
    return Napi::Number::New(env, g_engine->createDatumPlane(ox, oy, oz, nx, ny, nz));
}

Napi::Value CreateSketch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 1) return Napi::Number::New(env, 0);
    
    uint32_t planeId = info[0].As<Napi::Number>().Uint32Value();
    return Napi::Number::New(env, g_engine->createSketch(planeId));
}

Napi::Value AddSketchLine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 5) return env.Undefined();
    
    uint32_t sketchId = info[0].As<Napi::Number>().Uint32Value();
    double x1 = info[1].As<Napi::Number>().DoubleValue();
    double y1 = info[2].As<Napi::Number>().DoubleValue();
    double x2 = info[3].As<Napi::Number>().DoubleValue();
    double y2 = info[4].As<Napi::Number>().DoubleValue();
    
    g_engine->addSketchLine(sketchId, x1, y1, x2, y2);
    return env.Undefined();
}

Napi::Value AddSketchCircle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 4) return env.Undefined();
    
    uint32_t sketchId = info[0].As<Napi::Number>().Uint32Value();
    double cx = info[1].As<Napi::Number>().DoubleValue();
    double cy = info[2].As<Napi::Number>().DoubleValue();
    double r = info[3].As<Napi::Number>().DoubleValue();
    
    g_engine->addSketchCircle(sketchId, cx, cy, r);
    return env.Undefined();
}

Napi::Value CreateExtrude(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 2) return Napi::Number::New(env, 0);
    
    uint32_t sketchId = info[0].As<Napi::Number>().Uint32Value();
    double height = info[1].As<Napi::Number>().DoubleValue();
    // optional symmetric arg
    
    return Napi::Number::New(env, g_engine->createExtrude(sketchId, height));
}

Napi::Value CreateRevolve(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!g_engine || info.Length() < 8) return Napi::Number::New(env, 0);
    
    uint32_t sketchId = info[0].As<Napi::Number>().Uint32Value();
    double px = info[1].As<Napi::Number>().DoubleValue();
    double py = info[2].As<Napi::Number>().DoubleValue();
    double pz = info[3].As<Napi::Number>().DoubleValue();
    double dx = info[4].As<Napi::Number>().DoubleValue();
    double dy = info[5].As<Napi::Number>().DoubleValue();
    double dz = info[6].As<Napi::Number>().DoubleValue();
    double angle = info[7].As<Napi::Number>().DoubleValue();
    
    return Napi::Number::New(env, g_engine->createRevolve(sketchId, px, py, pz, dx, dy, dz, angle));
}

// ============================================================================
// Boolean Operations
// ============================================================================
Napi::Value BooleanFuse(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Number::New(env, 0);
    
    uint32_t a = info[0].As<Napi::Number>().Uint32Value();
    uint32_t b = info[1].As<Napi::Number>().Uint32Value();
    
    return Napi::Number::New(env, g_engine->booleanFuse(a, b));
}

Napi::Value BooleanCut(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Number::New(env, 0);
    
    uint32_t a = info[0].As<Napi::Number>().Uint32Value();
    uint32_t b = info[1].As<Napi::Number>().Uint32Value();
    
    return Napi::Number::New(env, g_engine->booleanCut(a, b));
}

Napi::Value BooleanCommon(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Number::New(env, 0);
    
    uint32_t a = info[0].As<Napi::Number>().Uint32Value();
    uint32_t b = info[1].As<Napi::Number>().Uint32Value();
    
    return Napi::Number::New(env, g_engine->booleanCommon(a, b));
}

// ============================================================================
// Modifications
// ============================================================================
Napi::Value TranslateShape(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 4) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    double dx = info[1].As<Napi::Number>().DoubleValue();
    double dy = info[2].As<Napi::Number>().DoubleValue();
    double dz = info[3].As<Napi::Number>().DoubleValue();
    
    return Napi::Boolean::New(env, g_engine->translateShape(id, dx, dy, dz));
}

Napi::Value RotateShape(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 5) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    double axisX = info[1].As<Napi::Number>().DoubleValue();
    double axisY = info[2].As<Napi::Number>().DoubleValue();
    double axisZ = info[3].As<Napi::Number>().DoubleValue();
    double angle = info[4].As<Napi::Number>().DoubleValue();
    
    return Napi::Boolean::New(env, g_engine->rotateShape(id, axisX, axisY, axisZ, angle));
}

Napi::Value FilletEdges(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    double radius = info[1].As<Napi::Number>().DoubleValue();
    
    return Napi::Boolean::New(env, g_engine->filletEdges(id, radius));
}

Napi::Value ChamferEdges(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    double distance = info[1].As<Napi::Number>().DoubleValue();
    
    return Napi::Boolean::New(env, g_engine->chamferEdges(id, distance));
}

// ============================================================================
// Mesh Data (For Three.js Rendering)
// ============================================================================
Napi::Value GetMeshData(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) {
        return env.Null();
    }
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    double deflection = info.Length() > 1 ? info[1].As<Napi::Number>().DoubleValue() : 0.1;
    
    CAD3D::MeshData mesh = g_engine->getMeshData(id, deflection);
    
    if (!mesh.valid) {
        return env.Null();
    }
    
    // Create result object
    Napi::Object result = Napi::Object::New(env);
    
    // Copy vertices to Float32Array
    Napi::Float32Array vertices = Napi::Float32Array::New(env, mesh.vertices.size());
    for (size_t i = 0; i < mesh.vertices.size(); ++i) {
        vertices[i] = mesh.vertices[i];
    }
    result.Set("vertices", vertices);
    
    // Copy normals to Float32Array
    Napi::Float32Array normals = Napi::Float32Array::New(env, mesh.normals.size());
    for (size_t i = 0; i < mesh.normals.size(); ++i) {
        normals[i] = mesh.normals[i];
    }
    result.Set("normals", normals);
    
    // Copy indices to Uint32Array
    Napi::Uint32Array indices = Napi::Uint32Array::New(env, mesh.indices.size());
    for (size_t i = 0; i < mesh.indices.size(); ++i) {
        indices[i] = mesh.indices[i];
    }
    result.Set("indices", indices);
    
    return result;
}

// ============================================================================
// File Import/Export
// ============================================================================
Napi::Value ExportSTEP(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    std::string path = info[1].As<Napi::String>().Utf8Value();
    
    return Napi::Boolean::New(env, g_engine->exportSTEP(id, path));
}

Napi::Value ExportIGES(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    std::string path = info[1].As<Napi::String>().Utf8Value();
    
    return Napi::Boolean::New(env, g_engine->exportIGES(id, path));
}

Napi::Value ImportSTEP(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) return Napi::Number::New(env, 0);
    
    std::string path = info[0].As<Napi::String>().Utf8Value();
    
    return Napi::Number::New(env, g_engine->importSTEP(path));
}

Napi::Value ImportIGES(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) return Napi::Number::New(env, 0);
    
    std::string path = info[0].As<Napi::String>().Utf8Value();
    
    return Napi::Number::New(env, g_engine->importIGES(path));
}

// ============================================================================
// Management
// ============================================================================
Napi::Value DeleteShape(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) return Napi::Boolean::New(env, false);
    
    uint32_t id = info[0].As<Napi::Number>().Uint32Value();
    return Napi::Boolean::New(env, g_engine->deleteShape(id));
}

Napi::Value Clear(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->clear();
    }
    
    return env.Undefined();
}

Napi::Value GetAllShapeIds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Array::New(env, 0);
    }
    
    std::vector<uint32_t> ids = g_engine->getAllShapeIds();
    Napi::Array result = Napi::Array::New(env, ids.size());
    
    for (size_t i = 0; i < ids.size(); ++i) {
        result.Set(i, Napi::Number::New(env, ids[i]));
    }
    
    return result;
}

// ============================================================================
// Module Initialization
// ============================================================================
Napi::Object InitCAD3D(Napi::Env env, Napi::Object exports) {
    // Lifecycle
    exports.Set("createEngine", Napi::Function::New(env, CreateEngine));
    exports.Set("destroyEngine", Napi::Function::New(env, DestroyEngine));
    
    // Primitives
    exports.Set("createBox", Napi::Function::New(env, CreateBox));
    exports.Set("createCylinder", Napi::Function::New(env, CreateCylinder));
    exports.Set("createSphere", Napi::Function::New(env, CreateSphere));
    exports.Set("createCone", Napi::Function::New(env, CreateCone));
    exports.Set("createTorus", Napi::Function::New(env, CreateTorus));

    // Feature Modeling
    exports.Set("createDatumPlane", Napi::Function::New(env, CreateDatumPlane));
    exports.Set("createSketch", Napi::Function::New(env, CreateSketch));
    exports.Set("addSketchLine", Napi::Function::New(env, AddSketchLine));
    exports.Set("addSketchCircle", Napi::Function::New(env, AddSketchCircle));
    exports.Set("createExtrude", Napi::Function::New(env, CreateExtrude));
    exports.Set("createRevolve", Napi::Function::New(env, CreateRevolve));
    
    // Boolean
    exports.Set("booleanFuse", Napi::Function::New(env, BooleanFuse));
    exports.Set("booleanCut", Napi::Function::New(env, BooleanCut));
    exports.Set("booleanCommon", Napi::Function::New(env, BooleanCommon));
    
    // Modifications
    exports.Set("translateShape", Napi::Function::New(env, TranslateShape));
    exports.Set("rotateShape", Napi::Function::New(env, RotateShape));
    exports.Set("filletEdges", Napi::Function::New(env, FilletEdges));
    exports.Set("chamferEdges", Napi::Function::New(env, ChamferEdges));
    
    // Rendering
    exports.Set("getMeshData", Napi::Function::New(env, GetMeshData));
    
    // File I/O
    exports.Set("exportSTEP", Napi::Function::New(env, ExportSTEP));
    exports.Set("exportIGES", Napi::Function::New(env, ExportIGES));
    exports.Set("importSTEP", Napi::Function::New(env, ImportSTEP));
    exports.Set("importIGES", Napi::Function::New(env, ImportIGES));
    
    // Management
    exports.Set("deleteShape", Napi::Function::New(env, DeleteShape));
    exports.Set("clear", Napi::Function::New(env, Clear));
    exports.Set("getAllShapeIds", Napi::Function::New(env, GetAllShapeIds));
    
    return exports;
}

NODE_API_MODULE(cad3d_addon, InitCAD3D)
