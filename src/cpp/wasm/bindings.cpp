#include <emscripten/bind.h>
#include "Engine.h"

using namespace emscripten;

// Helper to expose vector<float> as Float32Array
val getRenderBufferWrapper(Engine& engine) {
    const std::vector<float>& buffer = engine.getRenderBuffer();
    return val(typed_memory_view(buffer.size(), buffer.data()));
}

EMSCRIPTEN_BINDINGS(cad_engine) {
    enum_<SnapType>("SnapType")
        .value("NONE", SnapType::NONE)
        .value("ENDPOINT", SnapType::ENDPOINT)
        .value("MIDPOINT", SnapType::MIDPOINT)
        .value("CENTER", SnapType::CENTER)
        .value("QUADRANT", SnapType::QUADRANT)
        .value("INTERSECTION", SnapType::INTERSECTION);

    value_object<Point>("Point")
        .field("x", &Point::x)
        .field("y", &Point::y);

    value_object<SnapPoint>("SnapPoint")
        .field("p", &SnapPoint::p)
        .field("type", &SnapPoint::type);

    // Register std::vector<Point> for polyline support
    register_vector<Point>("VectorPoint");

    class_<Engine>("Engine")
        .constructor<>()
        .function("addLine", &Engine::addLine)
        .function("addCircle", &Engine::addCircle)
        .function("addPolyline", &Engine::addPolyline)
        .function("addRectangle", &Engine::addRectangle)
        .function("addArc", &Engine::addArc)
        .function("addRegularPolygon", &Engine::addRegularPolygon)
        .function("clear", &Engine::clear)
        .function("deleteEntity", &Engine::deleteEntity)
        .function("getRenderBuffer", &getRenderBufferWrapper)
        .function("findClosestSnapPoint", &Engine::findClosestSnapPoint)
        .function("hitTest", &Engine::hitTest)
        .function("selectEntity", &Engine::selectEntity)
        .function("deselectAll", &Engine::deselectAll)
        .function("deleteSelected", &Engine::deleteSelected)
        .function("moveSelected", &Engine::moveSelected)
        .function("copySelected", &Engine::copySelected)
        .function("selectByWindow", &Engine::selectByWindow)
        .function("selectByCrossing", &Engine::selectByCrossing);
}
