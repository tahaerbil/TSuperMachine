#include <emscripten/bind.h>
#include "Engine.h"

using namespace emscripten;

// Helper to expose vector<float> as Float32Array
val getRenderBufferWrapper(Engine& engine) {
    const std::vector<float>& buffer = engine.getRenderBuffer();
    return val(typed_memory_view(buffer.size(), buffer.data()));
}

EMSCRIPTEN_BINDINGS(cad_engine) {
    class_<Engine>("Engine")
        .constructor<>()
        .function("addLine", &Engine::addLine)
        .function("addCircle", &Engine::addCircle)
        .function("clear", &Engine::clear)
        .function("deleteEntity", &Engine::deleteEntity)
        .function("getRenderBuffer", &getRenderBufferWrapper);
}
