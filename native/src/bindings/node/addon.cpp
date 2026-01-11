/**
 * TSuperMachine Native CAD Addon for Node.js/Electron
 * 
 * This file provides the N-API bindings to expose the C++ CAD engine
 * to JavaScript/TypeScript in Electron.
 */

#include <napi.h>
#include "../cad2d/Engine.h"

// Global engine instance (one per addon)
// In the future, we might want to support multiple instances
static Engine* g_engine = nullptr;

// ============================================================================
// Engine Lifecycle
// ============================================================================

Napi::Value CreateEngine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine != nullptr) {
        delete g_engine;
    }
    
    g_engine = new Engine();
    return Napi::Boolean::New(env, true);
}

Napi::Value DestroyEngine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine != nullptr) {
        delete g_engine;
        g_engine = nullptr;
    }
    
    return Napi::Boolean::New(env, true);
}

// ============================================================================
// Drawing Commands
// ============================================================================

Napi::Value AddLine(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: x1, y1, x2, y2").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double x1 = info[0].As<Napi::Number>().DoubleValue();
    double y1 = info[1].As<Napi::Number>().DoubleValue();
    double x2 = info[2].As<Napi::Number>().DoubleValue();
    double y2 = info[3].As<Napi::Number>().DoubleValue();
    
    unsigned int id = g_engine->addLine(x1, y1, x2, y2);
    return Napi::Number::New(env, id);
}

Napi::Value AddCircle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected 3 arguments: cx, cy, radius").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double cx = info[0].As<Napi::Number>().DoubleValue();
    double cy = info[1].As<Napi::Number>().DoubleValue();
    double radius = info[2].As<Napi::Number>().DoubleValue();
    
    unsigned int id = g_engine->addCircle(cx, cy, radius);
    return Napi::Number::New(env, id);
}

Napi::Value AddRectangle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: x1, y1, x2, y2").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double x1 = info[0].As<Napi::Number>().DoubleValue();
    double y1 = info[1].As<Napi::Number>().DoubleValue();
    double x2 = info[2].As<Napi::Number>().DoubleValue();
    double y2 = info[3].As<Napi::Number>().DoubleValue();
    
    unsigned int id = g_engine->addRectangle(x1, y1, x2, y2);
    return Napi::Number::New(env, id);
}

Napi::Value AddArc(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 5) {
        Napi::TypeError::New(env, "Expected 5 arguments: cx, cy, radius, startAngle, endAngle").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double cx = info[0].As<Napi::Number>().DoubleValue();
    double cy = info[1].As<Napi::Number>().DoubleValue();
    double radius = info[2].As<Napi::Number>().DoubleValue();
    double startAngle = info[3].As<Napi::Number>().DoubleValue();
    double endAngle = info[4].As<Napi::Number>().DoubleValue();
    
    unsigned int id = g_engine->addArc(cx, cy, radius, startAngle, endAngle);
    return Napi::Number::New(env, id);
}

Napi::Value AddRegularPolygon(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: cx, cy, sides, radius").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double cx = info[0].As<Napi::Number>().DoubleValue();
    double cy = info[1].As<Napi::Number>().DoubleValue();
    int sides = info[2].As<Napi::Number>().Int32Value();
    double radius = info[3].As<Napi::Number>().DoubleValue();
    
    unsigned int id = g_engine->addRegularPolygon(cx, cy, sides, radius);
    return Napi::Number::New(env, id);
}

Napi::Value AddPolyline(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        Napi::TypeError::New(env, "Engine not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: points array, closed boolean").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // First argument is an array of {x, y} objects
    Napi::Array pointsArray = info[0].As<Napi::Array>();
    bool closed = info[1].As<Napi::Boolean>().Value();
    
    std::vector<Point> points;
    for (uint32_t i = 0; i < pointsArray.Length(); i++) {
        Napi::Object pt = pointsArray.Get(i).As<Napi::Object>();
        double x = pt.Get("x").As<Napi::Number>().DoubleValue();
        double y = pt.Get("y").As<Napi::Number>().DoubleValue();
        points.push_back({x, y});
    }
    
    unsigned int id = g_engine->addPolyline(points, closed);
    return Napi::Number::New(env, id);
}

// ============================================================================
// Modification Commands
// ============================================================================

Napi::Value Clear(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->clear();
    }
    
    return env.Undefined();
}

Napi::Value DeleteEntity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) {
        return env.Undefined();
    }
    
    unsigned int id = info[0].As<Napi::Number>().Uint32Value();
    g_engine->deleteEntity(id);
    
    return env.Undefined();
}

// ============================================================================
// Selection Commands
// ============================================================================

Napi::Value HitTest(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 3) {
        return Napi::Number::New(env, -1);
    }
    
    double x = info[0].As<Napi::Number>().DoubleValue();
    double y = info[1].As<Napi::Number>().DoubleValue();
    double threshold = info[2].As<Napi::Number>().DoubleValue();
    
    int id = g_engine->hitTest(x, y, threshold);
    return Napi::Number::New(env, id);
}

Napi::Value SelectEntity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) {
        return env.Undefined();
    }
    
    unsigned int id = info[0].As<Napi::Number>().Uint32Value();
    g_engine->selectEntity(id);
    
    return env.Undefined();
}

Napi::Value DeselectAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->deselectAll();
    }
    
    return env.Undefined();
}

Napi::Value DeleteSelected(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_engine) {
        g_engine->deleteSelected();
    }
    
    return env.Undefined();
}

Napi::Value MoveSelected(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) {
        return env.Undefined();
    }
    
    double dx = info[0].As<Napi::Number>().DoubleValue();
    double dy = info[1].As<Napi::Number>().DoubleValue();
    g_engine->moveSelected(dx, dy);
    
    return env.Undefined();
}

Napi::Value CopySelected(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 2) {
        return env.Undefined();
    }
    
    double dx = info[0].As<Napi::Number>().DoubleValue();
    double dy = info[1].As<Napi::Number>().DoubleValue();
    g_engine->copySelected(dx, dy);
    
    return env.Undefined();
}

Napi::Value SelectByWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 4) {
        return env.Undefined();
    }
    
    double x1 = info[0].As<Napi::Number>().DoubleValue();
    double y1 = info[1].As<Napi::Number>().DoubleValue();
    double x2 = info[2].As<Napi::Number>().DoubleValue();
    double y2 = info[3].As<Napi::Number>().DoubleValue();
    g_engine->selectByWindow(x1, y1, x2, y2);
    
    return env.Undefined();
}

Napi::Value SelectByCrossing(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 4) {
        return env.Undefined();
    }
    
    double x1 = info[0].As<Napi::Number>().DoubleValue();
    double y1 = info[1].As<Napi::Number>().DoubleValue();
    double x2 = info[2].As<Napi::Number>().DoubleValue();
    double y2 = info[3].As<Napi::Number>().DoubleValue();
    g_engine->selectByCrossing(x1, y1, x2, y2);
    
    return env.Undefined();
}

Napi::Value RotateSelected(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 3) {
        return env.Undefined();
    }
    
    double cx = info[0].As<Napi::Number>().DoubleValue();
    double cy = info[1].As<Napi::Number>().DoubleValue();
    double angle = info[2].As<Napi::Number>().DoubleValue();
    g_engine->rotateSelected(cx, cy, angle);
    
    return env.Undefined();
}

Napi::Value OffsetEntity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 4) {
        return Napi::Number::New(env, 0);
    }
    
    unsigned int id = info[0].As<Napi::Number>().Uint32Value();
    double distance = info[1].As<Napi::Number>().DoubleValue();
    double clickX = info[2].As<Napi::Number>().DoubleValue();
    double clickY = info[3].As<Napi::Number>().DoubleValue();
    
    unsigned int newId = g_engine->offsetEntity(id, distance, clickX, clickY);
    return Napi::Number::New(env, newId);
}

// ============================================================================
// Snapping
// ============================================================================

Napi::Value FindClosestSnapPoint(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 3) {
        Napi::Object result = Napi::Object::New(env);
        result.Set("x", 0);
        result.Set("y", 0);
        result.Set("type", 0);
        return result;
    }
    
    double x = info[0].As<Napi::Number>().DoubleValue();
    double y = info[1].As<Napi::Number>().DoubleValue();
    double threshold = info[2].As<Napi::Number>().DoubleValue();
    
    SnapPoint snap = g_engine->findClosestSnapPoint(x, y, threshold);
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("x", snap.p.x);
    result.Set("y", snap.p.y);
    result.Set("type", static_cast<int>(snap.type));
    
    return result;
}

// ============================================================================
// Rendering
// ============================================================================

Napi::Value GetRenderBuffer(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::Float32Array::New(env, 0);
    }
    
    const std::vector<float>& buffer = g_engine->getRenderBuffer();
    
    // Create a Float32Array and copy the data
    Napi::Float32Array result = Napi::Float32Array::New(env, buffer.size());
    for (size_t i = 0; i < buffer.size(); i++) {
        result[i] = buffer[i];
    }
    
    return result;
}

// ============================================================================
// Serialization
// ============================================================================

Napi::Value ExportDatabase(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::String::New(env, "[]");
    }
    
    std::string json = g_engine->exportDatabase();
    return Napi::String::New(env, json);
}

Napi::Value ImportDatabase(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine || info.Length() < 1) {
        return env.Undefined();
    }
    
    std::string json = info[0].As<Napi::String>().Utf8Value();
    g_engine->importDatabase(json);
    
    return env.Undefined();
}

Napi::Value ExportDXF(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_engine) {
        return Napi::String::New(env, "");
    }
    
    std::string dxf = g_engine->exportDXF();
    return Napi::String::New(env, dxf);
}

// ============================================================================
// Module Initialization
// ============================================================================

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Engine lifecycle
    exports.Set("createEngine", Napi::Function::New(env, CreateEngine));
    exports.Set("destroyEngine", Napi::Function::New(env, DestroyEngine));
    
    // Drawing commands
    exports.Set("addLine", Napi::Function::New(env, AddLine));
    exports.Set("addCircle", Napi::Function::New(env, AddCircle));
    exports.Set("addRectangle", Napi::Function::New(env, AddRectangle));
    exports.Set("addArc", Napi::Function::New(env, AddArc));
    exports.Set("addRegularPolygon", Napi::Function::New(env, AddRegularPolygon));
    exports.Set("addPolyline", Napi::Function::New(env, AddPolyline));
    
    // Serialization
    exports.Set("exportDatabase", Napi::Function::New(env, ExportDatabase));
    exports.Set("importDatabase", Napi::Function::New(env, ImportDatabase));
    exports.Set("exportDXF", Napi::Function::New(env, ExportDXF));
    
    // Modification commands
    exports.Set("clear", Napi::Function::New(env, Clear));
    exports.Set("deleteEntity", Napi::Function::New(env, DeleteEntity));
    
    // Selection commands
    exports.Set("hitTest", Napi::Function::New(env, HitTest));
    exports.Set("selectEntity", Napi::Function::New(env, SelectEntity));
    exports.Set("deselectAll", Napi::Function::New(env, DeselectAll));
    exports.Set("deleteSelected", Napi::Function::New(env, DeleteSelected));
    exports.Set("moveSelected", Napi::Function::New(env, MoveSelected));
    exports.Set("copySelected", Napi::Function::New(env, CopySelected));
    exports.Set("selectByWindow", Napi::Function::New(env, SelectByWindow));
    exports.Set("selectByCrossing", Napi::Function::New(env, SelectByCrossing));
    exports.Set("rotateSelected", Napi::Function::New(env, RotateSelected));
    exports.Set("offsetEntity", Napi::Function::New(env, OffsetEntity));
    
    // Snapping
    exports.Set("findClosestSnapPoint", Napi::Function::New(env, FindClosestSnapPoint));
    
    // Rendering
    exports.Set("getRenderBuffer", Napi::Function::New(env, GetRenderBuffer));
    
    return exports;
}

NODE_API_MODULE(cad_addon, Init)
