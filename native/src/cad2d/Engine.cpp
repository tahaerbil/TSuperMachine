#include "Engine.h"

Engine::Engine() {
    // Reserve some memory for the render buffer to avoid frequent reallocations
    renderBuffer.reserve(10000 * 6); 
}

unsigned int Engine::addLine(double x1, double y1, double x2, double y2) {
    saveState();
    return db.addEntity(std::make_unique<LineEntity>(Point{x1, y1}, Point{x2, y2}));
}

unsigned int Engine::addCircle(double cx, double cy, double radius) {
    saveState();
    return db.addEntity(std::make_unique<CircleEntity>(Point{cx, cy}, radius));
}

unsigned int Engine::addPolyline(const std::vector<Point>& points, bool closed) {
    saveState();
    auto polyline = std::make_unique<PolylineEntity>(points, closed);
    return db.addEntity(std::move(polyline));
}

unsigned int Engine::addRectangle(double x1, double y1, double x2, double y2) {
    saveState();
    auto rect = std::make_unique<RectangleEntity>(Point{x1, y1}, Point{x2, y2});
    return db.addEntity(std::move(rect));
}

unsigned int Engine::addArc(double cx, double cy, double radius, double startAngle, double endAngle) {
    saveState();
    auto arc = std::make_unique<ArcEntity>(Point{cx, cy}, radius, startAngle, endAngle);
    return db.addEntity(std::move(arc));
}

unsigned int Engine::addRegularPolygon(double cx, double cy, int sides, double radius) {
    saveState();
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

unsigned int Engine::addPoint(double x, double y) {
    saveState();
    return db.addEntity(std::make_unique<PointEntity>(Point{x, y}));
}

unsigned int Engine::addSpline(const std::vector<Point>& points) {
    saveState();
    return db.addEntity(std::make_unique<SplineEntity>(points));
}
void Engine::clear() {
    saveState();
    db.clear();
}

void Engine::deleteEntity(unsigned int id) {
    saveState();
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
    saveState();
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
    saveState();
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->translate(dx, dy);
        }
    }
}

void Engine::copySelected(double dx, double dy) {
    saveState();
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
    saveState();
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->rotate(cx, cy, angle);
        }
    }
}

unsigned int Engine::offsetEntity(unsigned int id, double distance, double clickX, double clickY) {
    saveState();
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

void Engine::explodeSelected() {
    saveState();
    const auto& entities = db.getEntities();
    std::vector<unsigned int> idsToDelete;
    std::vector<std::unique_ptr<Entity>> newEntities;

    for (const auto& entity : entities) {
        if (!entity->selected) continue;

        if (entity->getType() == EntityType::RECTANGLE) {
            auto* rect = static_cast<RectangleEntity*>(entity.get());
            // Create 4 lines
            newEntities.push_back(std::make_unique<LineEntity>(rect->p1, Point{rect->p2.x, rect->p1.y}));
            newEntities.push_back(std::make_unique<LineEntity>(Point{rect->p2.x, rect->p1.y}, rect->p2));
            newEntities.push_back(std::make_unique<LineEntity>(rect->p2, Point{rect->p1.x, rect->p2.y}));
            newEntities.push_back(std::make_unique<LineEntity>(Point{rect->p1.x, rect->p2.y}, rect->p1));
            
            idsToDelete.push_back(entity->id);
        } 
        else if (entity->getType() == EntityType::POLYLINE) {
            auto* pl = static_cast<PolylineEntity*>(entity.get());
            const auto& pts = pl->points;
             if (pts.size() < 2) continue;

             for (size_t i = 0; i < pts.size() - 1; ++i) {
                 newEntities.push_back(std::make_unique<LineEntity>(pts[i], pts[i+1]));
             }
             if (pl->closed) {
                 newEntities.push_back(std::make_unique<LineEntity>(pts.back(), pts.front()));
             }
             idsToDelete.push_back(entity->id);
        }
    }

    for (unsigned int id : idsToDelete) {
        db.deleteEntity(id);
    }
    for (auto& newEntity : newEntities) {
        newEntity->selected = true; // Select the new exploded parts
        db.addEntity(std::move(newEntity));
    }
}

void Engine::trimEntity(double x, double y, double threshold) {
    // 1. Identify valid entity under cursor
    int targetId = hitTest(x, y, threshold); // Use tolerance for selection
    if (targetId == -1) return;

    auto target = db.getEntity(targetId);
    if (!target) return;
    
    // Only support LINE trimming for MVP
    if (target->getType() != EntityType::LINE) return;
    
    saveState();
    
    auto* line = static_cast<LineEntity*>(target);
    
    // 2. Find all intersections with this line
    std::vector<Point> intersections;
    std::vector<double> tValues; // 0..1 parameter along the line
    
    const auto& entities = db.getEntities();
    for (const auto& other : entities) {
        if (other->id == targetId) continue;
        if (!other->visible) continue;
        
        auto pts = target->getIntersections(other.get());
        for (const auto& p : pts) {
            // Project point onto line to get 't'
            double dx = line->end.x - line->start.x;
            double dy = line->end.y - line->start.y;
            double lenSq = dx*dx + dy*dy;
            double t = ((p.x - line->start.x) * dx + (p.y - line->start.y) * dy) / lenSq;
            
            if (t > 0.001 && t < 0.999) { // Avoid exact endpoints
                intersections.push_back(p);
                tValues.push_back(t);
            }
        }
    }
    
    if (tValues.empty()) return; // No intersections
    
    // 3. Add endpoints (0 and 1) and Click Point to determine which segment to remove
    tValues.push_back(0.0);
    tValues.push_back(1.0);
    std::sort(tValues.begin(), tValues.end());
    
    // Calculate t for the click point
    double dx = line->end.x - line->start.x;
    double dy = line->end.y - line->start.y;
    double lenSq = dx*dx + dy*dy;
    double clickT = ((x - line->start.x) * dx + (y - line->start.y) * dy) / lenSq;
    clickT = std::max(0.0, std::min(1.0, clickT));
    
    // 4. Determine which segment contains clickT
    double startT = 0;
    double endT = 1;
    bool found = false;
    
    for (size_t i = 0; i < tValues.size() - 1; ++i) {
        if (clickT >= tValues[i] && clickT <= tValues[i+1]) {
            startT = tValues[i];
            endT = tValues[i+1];
            found = true;
            break;
        }
    }
    
    if (!found) return;
    
    // 5. Create new lines 
    // We want to KEEP everything EXCEPT [startT, endT]
    // Basically we rebuild the line from 0..startT AND endT..1
    
    std::vector<std::unique_ptr<Entity>> newLines;
    
    if (startT > 0.001) {
        Point pStart = line->start;
        Point pEnd = { line->start.x + startT * dx, line->start.y + startT * dy };
        newLines.push_back(std::make_unique<LineEntity>(pStart, pEnd));
    }
    
    if (endT < 0.999) {
        Point pStart = { line->start.x + endT * dx, line->start.y + endT * dy };
        Point pEnd = line->end;
        newLines.push_back(std::make_unique<LineEntity>(pStart, pEnd));
    }
    
    // 6. Replace
    db.deleteEntity(targetId);
    for (auto& nl : newLines) {
        db.addEntity(std::move(nl));
    }
}

void Engine::extendEntity(double x, double y, double threshold) {
    // 1. Identify valid entity under cursor
    int targetId = hitTest(x, y, threshold);
    if (targetId == -1) return;

    auto target = db.getEntity(targetId);
    if (!target) return;
    
    // Only support LINE extension for MVP (similar to Trim)
    if (target->getType() != EntityType::LINE) return;
    
    saveState();
    
    auto* line = static_cast<LineEntity*>(target);
    
    // Determine which end to extend based on click proximity
    double dStart = std::pow(x - line->start.x, 2) + std::pow(y - line->start.y, 2);
    double dEnd = std::pow(x - line->end.x, 2) + std::pow(y - line->end.y, 2);
    
    bool extendEnd = dEnd < dStart;
    
    // Define the ray for extension
    // Ray starts at the end we want to extend, goes in direction of line
    Point rayOrigin = extendEnd ? line->end : line->start;
    double dx = line->end.x - line->start.x;
    double dy = line->end.y - line->start.y;
    
    // Normalize direction
    double len = std::sqrt(dx*dx + dy*dy);
    if (len < 1e-10) return; // Degenerate line
    
    // Direction vector must point OUTWARDS from the line
    double dirX = extendEnd ? dx/len : -dx/len;
    double dirY = extendEnd ? dy/len : -dy/len;
    
    // We need to define a "virtual" infinite line for intersection tests
    // Or simpler: Test against specific geometry types analytically
    
    double minDistSq = std::numeric_limits<double>::max();
    Point bestIntersection = {0, 0};
    bool found = false;
    
    const auto& entities = db.getEntities();
    for (const auto& other : entities) {
        if (other->id == targetId) continue;
        if (!other->visible) continue;
        
        // This is tricky: "getIntersections" usually computes considering finite segments.
        // For Extend, we need intersection of the Infinite Line (Ray) with finite segments.
        
        // Let's implement ray-vs-entity helpers or assume a very long line for 'probe'
        // Create a temporary "probe" line that is very long in the extend direction
        double bigLen = 100000.0; // Architecture usage scale
        Point probeEnd = {
            rayOrigin.x + dirX * bigLen,
            rayOrigin.y + dirY * bigLen
        };
        
        LineEntity probe(rayOrigin, probeEnd);
        auto pts = probe.getIntersections(other.get());
        
        for (const auto& p : pts) {
            // Distance from ray origin
            double dSq = std::pow(p.x - rayOrigin.x, 2) + std::pow(p.y - rayOrigin.y, 2);
            
            // Ignore intersection at exact origin (connected lines)
            if (dSq < 0.001) continue;
            
            if (dSq < minDistSq) {
                minDistSq = dSq;
                bestIntersection = p;
                found = true;
            }
        }
    }
    
    if (found) {
        // Update the line endpoint
        if (extendEnd) {
            line->end = bestIntersection;
        } else {
            line->start = bestIntersection;
        }
    }
}

// ============================================================================
// Serialization Implementation
// ============================================================================

#include "io/JSONSerializer.h"
#include "io/DXFExporter.h"

std::string Engine::exportDatabase() {
    return JSONSerializer::exportDatabase(db);
}

void Engine::importDatabase(const std::string& json) {
    JSONSerializer::importDatabase(db, json);
}

// ============================================================================
// DXF Export Implementation
// ============================================================================

std::string Engine::exportDXF() {
    return DXFExporter::exportDXF(db);
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
        else if (entity->getType() == EntityType::ELLIPSE) {
            auto el = static_cast<EllipseEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(el->center.x));
            renderBuffer.push_back(static_cast<float>(el->center.y));
            renderBuffer.push_back(static_cast<float>(el->majorRadius));
            renderBuffer.push_back(static_cast<float>(el->minorRadius));
            renderBuffer.push_back(static_cast<float>(el->rotation));
        }
        else if (entity->getType() == EntityType::POINT) {
            auto pt = static_cast<PointEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(pt->position.x));
            renderBuffer.push_back(static_cast<float>(pt->position.y));
            // Just basic coords
        }
        else if (entity->getType() == EntityType::SPLINE) {
            auto spl = static_cast<SplineEntity*>(entity.get());
            renderBuffer.push_back(static_cast<float>(spl->controlPoints.size()));
            for(const auto& p : spl->controlPoints) {
                renderBuffer.push_back(static_cast<float>(p.x));
                renderBuffer.push_back(static_cast<float>(p.y));
            }
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
        
        // Dynamic Intersection Snap (Lines only for now)
        // Check intersection with all other visible entities
        for(const auto& other : entities) {
             if(other->id == entity->id || !other->visible) continue;
             
             // This can be expensive O(N^2), optimize later if needed
             if (entity->id < other->id) { // Avoid double check
                 auto ipts = entity->getIntersections(other.get());
                 for(const auto& p : ipts) {
                      double dx = p.x - x;
                      double dy = p.y - y;
                      double dist = std::sqrt(dx*dx + dy*dy);
                      if (dist < minDistance) {
                          minDistance = dist;
                          bestSnap.p = p;
                          bestSnap.type = SnapType::INTERSECTION;
                      }
                 }
             }
        }
    }
    
    return bestSnap;
}

unsigned int Engine::addEllipse(double cx, double cy, double majorRadius, double minorRadius, double rotation) {
    saveState();
    return db.addEntity(std::make_unique<EllipseEntity>(Point{cx, cy}, majorRadius, minorRadius, rotation));
}

void Engine::scaleSelected(double cx, double cy, double factor) {
    saveState();
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->scale(cx, cy, factor);
        }
    }
}

void Engine::mirrorSelected(double x1, double y1, double x2, double y2) {
    saveState();
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (entity->selected) {
            entity->mirror(x1, y1, x2, y2);
        }
    }
}

void Engine::saveState() {
    undoStack.push_back(exportDatabase());
    // Limit stack size? 
    if (undoStack.size() > 50) undoStack.erase(undoStack.begin());
    
    // Clear redo stack on new action
    redoStack.clear();
}

void Engine::undo() {
    if (undoStack.empty()) return;
    
    // Save current state to redo
    redoStack.push_back(exportDatabase());
    
    // Load last state
    std::string state = undoStack.back();
    undoStack.pop_back();
    
    // Import (avoid clearing stacks inside import!)
    // importDatabase calls clear(), which calls saveState()... LOOP!
    // I need to be careful with importDatabase.
    
    // To avoid `clear()` calling `saveState()`:
    // I will call db.clear() directly inside importDatabase instead of this->clear().
    // Let's modify importDatabase first.
    
    // Actually, `importDatabase` calls `clear()`, which I modified to call `saveState()`.
    // This is valid: Importing a DB is an action.
    // BUT, `undo()` calls `importDatabase`. We don't want `undo` to save state to `undoStack` again.
    
    // Refactoring importDatabase to NOT call clear() or public add methods would be best.
    // Logic inside importDatabase:
    // db.clear(); 
    // ... parse ...
    // db.addEntity(...);
    
    // If I use this approach, I need to protect `importDatabase` from triggering side effects.
    // But wait, the `importDatabase` implementation above calls `addLine`, `addCircle`...
    // And those now call `saveState()`. 
    // So recursive death loop or spamming undo stack.
    
    // FIX: I must implement `importDatabase` to use `db.addEntity` directly.
    // I will update the `importDatabase` block above to use `db.addEntity` directly for all types.
    // And remove `clear()` call from it (replace with `db.clear()`).
    
    // For this `undo` implementation:
    // We need a `loadState(json)` helper that calls `db.clear()` and parses without saving state.
    // Since `importDatabase` is public API, let's change it to NOT save state? 
    // Or just make `undo` manually parse?
    
    // Best: Update `importDatabase` to use `db.addEntity` directly. 
    // It's in the same file `Engine.cpp`.
    
    // I'll proceed with adding `undo/redo` here, but I know `importDatabase` is currently broken regarding `saveState`.
    // I will fix `importDatabase` in a separate tool call if needed or in this one if I can.
    
    // Let's assume I fix `importDatabase` to use `db.addEntity`.
    importDatabase(state);
}

void Engine::redo() {
    if (redoStack.empty()) return;
    
    undoStack.push_back(exportDatabase());
    
    std::string state = redoStack.back();
    redoStack.pop_back();
    
    importDatabase(state);
}
