#include "Engine.h"

Engine::Engine() {
    // Reserve some memory for the render buffer to avoid frequent reallocations
    renderBuffer.reserve(10000 * 6); 
}

unsigned int Engine::addLine(double x1, double y1, double x2, double y2) {
    return db.addEntity(std::make_unique<LineEntity>(Point{x1, y1}, Point{x2, y2}));
}

unsigned int Engine::addCircle(double cx, double cy, double radius) {
    return db.addEntity(std::make_unique<CircleEntity>(Point{cx, cy}, radius));
}

void Engine::clear() {
    db.clear();
}

void Engine::deleteEntity(unsigned int id) {
    db.deleteEntity(id);
}

const std::vector<float>& Engine::getRenderBuffer() {
    renderBuffer.clear();
    
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (!entity->visible) continue;

        // Format: [Type, Data..., Color]
        // Stride is currently variable but we'll standardize it or use a header
        // For now, let's use a fixed stride of 6 floats for simplicity in this PoC
        // LINE:   [0, x1, y1, x2, y2, color]
        // CIRCLE: [1, cx, cy, r,  0,  color]
        
        renderBuffer.push_back(static_cast<float>(entity->getType()));
        
        if (entity->getType() == EntityType::LINE) {
            auto line = static_cast<LineEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(line->start.x));
            renderBuffer.push_back(static_cast<float>(line->start.y));
            renderBuffer.push_back(static_cast<float>(line->end.x));
            renderBuffer.push_back(static_cast<float>(line->end.y));
        } else if (entity->getType() == EntityType::CIRCLE) {
            auto circle = static_cast<CircleEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(circle->center.x));
            renderBuffer.push_back(static_cast<float>(circle->center.y));
            renderBuffer.push_back(static_cast<float>(circle->radius));
            renderBuffer.push_back(0.0f); // Padding
        }
        
        // Color (packed float or just R channel for now - simplistic)
        renderBuffer.push_back(0.0f); 
    }
    
    return renderBuffer;
}
