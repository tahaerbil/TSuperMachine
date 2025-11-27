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

unsigned int Engine::addPolyline(const std::vector<Point>& points, bool closed) {
    auto polyline = std::make_unique<PolylineEntity>(points, closed);
    return db.addEntity(std::move(polyline));
}

unsigned int Engine::addRectangle(double x1, double y1, double x2, double y2) {
    auto rect = std::make_unique<RectangleEntity>(Point{x1, y1}, Point{x2, y2});
    return db.addEntity(std::move(rect));
}
void Engine::clear() {
    db.clear();
}

void Engine::deleteEntity(unsigned int id) {
    db.deleteEntity(id);
}



int Engine::hitTest(double x, double y, double threshold) {
    const auto& entities = db.getEntities();
    // Iterate in reverse to select top-most entity first
    for (auto it = entities.rbegin(); it != entities.rend(); ++it) {
        const auto& entity = *it;
        if (entity->visible && entity->hitTest(x, y, threshold)) {
            return entity->id;
        }
    }
    return -1;
}

void Engine::selectEntity(unsigned int id) {
    auto entity = db.getEntity(id);
    if (entity) {
        entity->selected = !entity->selected; // Toggle selection
    }
}

void Engine::deselectAll() {
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        entity->selected = false;
    }
}

void Engine::deleteSelected() {
    const auto& entities = db.getEntities();
    std::vector<unsigned int> idsToDelete;
    for (const auto& entity : entities) {
        if (entity->selected) {
            idsToDelete.push_back(entity->id);
        }
    }
    
    for (unsigned int id : idsToDelete) {
        db.deleteEntity(id);
    }
}

const std::vector<float>& Engine::getRenderBuffer() {
    renderBuffer.clear();
    
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (!entity->visible) continue;

        // Format: [Type, Data..., Color, Selected]
        // LINE:     [0, x1, y1, x2, y2, color, selected] - Stride 7
        // CIRCLE:   [1, cx, cy, r,  0,  color, selected] - Stride 7
        // POLYLINE: [3, numPoints, closed, x1, y1, x2, y2, ..., color, selected] - Variable stride
        // RECTANGLE: [4, x1, y1, x2, y2, color, selected] - Stride 7
        
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
        } else if (entity->getType() == EntityType::POLYLINE) {
            auto polyline = static_cast<PolylineEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(polyline->points.size()));
            renderBuffer.push_back(polyline->closed ? 1.0f : 0.0f);
            for (const auto& pt : polyline->points) {
                renderBuffer.push_back(static_cast<float>(pt.x));
                renderBuffer.push_back(static_cast<float>(pt.y));
            }
            // Padding to maintain consistent color/selected position
            // We'll add color and selected after the loop
        }
        else if (entity->getType() == EntityType::RECTANGLE) {
            auto rect = static_cast<RectangleEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(rect->p1.x));
            renderBuffer.push_back(static_cast<float>(rect->p1.y));
            renderBuffer.push_back(static_cast<float>(rect->p2.x));
            renderBuffer.push_back(static_cast<float>(rect->p2.y));
        }
        
        // Color (packed float or just R channel for now - simplistic)
        renderBuffer.push_back(0.0f); 
        
        // Selected Flag (1.0 = Selected, 0.0 = Not Selected)
        renderBuffer.push_back(entity->selected ? 1.0f : 0.0f);
    }
    
    return renderBuffer;
}

SnapPoint Engine::findClosestSnapPoint(double x, double y, double threshold) {
    SnapPoint bestSnap;
    bestSnap.type = SnapType::NONE;
    bestSnap.p = {x, y}; // Default to cursor pos if no snap
    
    double minDistance = threshold;

    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (!entity->visible) continue;
        
        std::vector<SnapPoint> snaps = entity->getSnapPoints();
        for (const auto& snap : snaps) {
            double dx = snap.p.x - x;
            double dy = snap.p.y - y;
            double dist = std::sqrt(dx*dx + dy*dy);
            
            if (dist < minDistance) {
                minDistance = dist;
                bestSnap = snap;
            }
        }
    }
    
    return bestSnap;
}
