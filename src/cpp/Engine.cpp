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

unsigned int Engine::addArc(double cx, double cy, double radius, double startAngle, double endAngle) {
    auto arc = std::make_unique<ArcEntity>(Point{cx, cy}, radius, startAngle, endAngle);
    return db.addEntity(std::move(arc));
}

unsigned int Engine::addRegularPolygon(double cx, double cy, int sides, double radius) {
    if (sides < 3) return 0;
    
    std::vector<Point> points;
    double angleStep = 2 * M_PI / sides;
    
    // Start from top (90 degrees / PI/2) or standard 0?
    // AutoCAD usually starts from 0 (East) or allows rotation.
    // Let's start from 0 for simplicity, consistent with math.
    
    for (int i = 0; i < sides; ++i) {
        double angle = i * angleStep;
        points.push_back({
            cx + radius * std::cos(angle),
            cy + radius * std::sin(angle)
        });
    }
    
    auto polyline = std::make_unique<PolylineEntity>(points, true); // Closed
    return db.addEntity(std::move(polyline));
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

void Engine::moveSelected(double dx, double dy) {
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->translate(dx, dy);
        }
    }
}

void Engine::copySelected(double dx, double dy) {
    const auto& entities = db.getEntities();
    std::vector<std::unique_ptr<Entity>> copies;
    
    // Create copies of selected entities
    for (const auto& entity : entities) {
        if (entity->selected) {
            std::unique_ptr<Entity> copy;
            
            switch (entity->getType()) {
                case EntityType::LINE: {
                    auto* line = static_cast<LineEntity*>(entity.get());
                    copy = std::make_unique<LineEntity>(line->start, line->end);
                    break;
                }
                case EntityType::CIRCLE: {
                    auto* circle = static_cast<CircleEntity*>(entity.get());
                    copy = std::make_unique<CircleEntity>(circle->center, circle->radius);
                    break;
                }
                case EntityType::ARC: {
                    auto* arc = static_cast<ArcEntity*>(entity.get());
                    copy = std::make_unique<ArcEntity>(arc->center, arc->radius, arc->startAngle, arc->endAngle);
                    break;
                }
                case EntityType::POLYLINE: {
                    auto* polyline = static_cast<PolylineEntity*>(entity.get());
                    copy = std::make_unique<PolylineEntity>(polyline->points, polyline->closed);
                    break;
                }
                case EntityType::RECTANGLE: {
                    auto* rect = static_cast<RectangleEntity*>(entity.get());
                    copy = std::make_unique<RectangleEntity>(rect->p1, rect->p2);
                    break;
                }
            }
            
            if (copy) {
                // Apply translation to copy
                copy->translate(dx, dy);
                // Mark copy as selected
                copy->selected = true;
                copies.push_back(std::move(copy));
            }
            
            // Deselect original
            entity->selected = false;
        }
    }
    
    // Add all copies to database
    for (auto& copy : copies) {
        db.addEntity(std::move(copy));
    }
}

void Engine::selectByWindow(double x1, double y1, double x2, double y2) {
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->isFullyInside(x1, y1, x2, y2)) {
            entity->selected = true;
        }
    }
}

void Engine::selectByCrossing(double x1, double y1, double x2, double y2) {
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->intersectsRectangle(x1, y1, x2, y2)) {
            entity->selected = true;
        }
    }
}

void Engine::rotateSelected(double cx, double cy, double angle) {
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->rotate(cx, cy, angle);
        }
    }
}

unsigned int Engine::offsetEntity(unsigned int id, double distance, double clickX, double clickY) {
    const auto& entities = db.getEntities();
    
    // Find the entity
    for (const auto& entity : entities) {
        if (entity->id == id) {
            // Determine offset direction based on click position
            // For simplicity, we'll use a basic heuristic:
            // - For lines: check which side of the line the click is on
            // - For circles/arcs: check if click is inside or outside
            // - For rectangles: check if click is inside or outside
            
            bool outward = true; // Default
            
            if (entity->getType() == EntityType::LINE) {
                // Line: check which side of line the click is on
                auto* line = static_cast<LineEntity*>(entity.get());
                double dx = line->end.x - line->start.x;
                double dy = line->end.y - line->start.y;
                double cross = (clickX - line->start.x) * dy - (clickY - line->start.y) * dx;
                outward = cross < 0; // Negative cross product = right side (inverted for correct offset direction)
            } else if (entity->getType() == EntityType::CIRCLE) {
                // Circle: check if click is outside
                auto* circle = static_cast<CircleEntity*>(entity.get());
                double dx = clickX - circle->center.x;
                double dy = clickY - circle->center.y;
                double distSq = dx * dx + dy * dy;
                outward = distSq > circle->radius * circle->radius;
            } else if (entity->getType() == EntityType::ARC) {
                // Arc: check if click is outside
                auto* arc = static_cast<ArcEntity*>(entity.get());
                double dx = clickX - arc->center.x;
                double dy = clickY - arc->center.y;
                double distSq = dx * dx + dy * dy;
                outward = distSq > arc->radius * arc->radius;
            } else if (entity->getType() == EntityType::RECTANGLE) {
                // Rectangle: check if click is outside
                auto* rect = static_cast<RectangleEntity*>(entity.get());
                double minX = std::min(rect->p1.x, rect->p2.x);
                double maxX = std::max(rect->p1.x, rect->p2.x);
                double minY = std::min(rect->p1.y, rect->p2.y);
                double maxY = std::max(rect->p1.y, rect->p2.y);
                outward = !(clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY);
            }
            
            // Create offset entity
            auto offsetEntity = entity->offset(distance, outward);
            if (offsetEntity) {
                unsigned int newId = db.addEntity(std::move(offsetEntity));
                return newId;
            }
            return 0; // Failed to offset
        }
    }
    
    return 0; // Entity not found
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
        else if (entity->getType() == EntityType::ARC) {
            auto arc = static_cast<ArcEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(arc->center.x));
            renderBuffer.push_back(static_cast<float>(arc->center.y));
            renderBuffer.push_back(static_cast<float>(arc->radius));
            renderBuffer.push_back(static_cast<float>(arc->startAngle));
            renderBuffer.push_back(static_cast<float>(arc->endAngle));
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
