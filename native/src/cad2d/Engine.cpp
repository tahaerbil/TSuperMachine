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

// ============================================================================
// Serialization Implementation
// ============================================================================

#include <sstream>
#include <iomanip>

std::string Engine::exportDatabase() {
    std::stringstream ss;
    ss << "[";
    
    const auto& entities = db.getEntities();
    for (size_t i = 0; i < entities.size(); ++i) {
        const auto& entity = entities[i];
        if (i > 0) ss << ",";
        
        ss << "{";
        ss << "\"type\":" << static_cast<int>(entity->getType()) << ",";
        ss << "\"color\":0,"; // Placeholder
        ss << "\"visible\":" << (entity->visible ? "true" : "false") << ",";
        
        switch (entity->getType()) {
            case EntityType::LINE: {
                auto* line = static_cast<LineEntity*>(entity.get());
                ss << "\"p1\":{\"x\":" << line->start.x << ",\"y\":" << line->start.y << "},";
                ss << "\"p2\":{\"x\":" << line->end.x << ",\"y\":" << line->end.y << "}";
                break;
            }
            case EntityType::CIRCLE: {
                auto* circle = static_cast<CircleEntity*>(entity.get());
                ss << "\"center\":{\"x\":" << circle->center.x << ",\"y\":" << circle->center.y << "},";
                ss << "\"radius\":" << circle->radius;
                break;
            }
            case EntityType::RECTANGLE: {
                auto* rect = static_cast<RectangleEntity*>(entity.get());
                ss << "\"p1\":{\"x\":" << rect->p1.x << ",\"y\":" << rect->p1.y << "},";
                ss << "\"p2\":{\"x\":" << rect->p2.x << ",\"y\":" << rect->p2.y << "}";
                break;
            }
            case EntityType::ARC: {
                auto* arc = static_cast<ArcEntity*>(entity.get());
                ss << "\"center\":{\"x\":" << arc->center.x << ",\"y\":" << arc->center.y << "},";
                ss << "\"radius\":" << arc->radius << ",";
                ss << "\"startAngle\":" << arc->startAngle << ",";
                ss << "\"endAngle\":" << arc->endAngle;
                break;
            }
            case EntityType::POLYLINE: {
                auto* pl = static_cast<PolylineEntity*>(entity.get());
                ss << "\"closed\":" << (pl->closed ? "true" : "false") << ",";
                ss << "\"points\":[";
                for (size_t j = 0; j < pl->points.size(); ++j) {
                    if (j > 0) ss << ",";
                    ss << "{\"x\":" << pl->points[j].x << ",\"y\":" << pl->points[j].y << "}";
                }
                ss << "]";
                break;
            }
        }
        
        ss << "}";
    }
    
    ss << "]";
    return ss.str();
}

// Simple JSON parser helper
std::string getJsonValue(const std::string& json, const std::string& key) {
    auto pos = json.find("\"" + key + "\"");
    if (pos == std::string::npos) return "";
    
    pos = json.find(":", pos) + 1;
    while (json[pos] == ' ' || json[pos] == '\n') pos++; // skip whitespace
    
    char endChar = ',';
    if (json[pos] == '{') endChar = '}';
    else if (json[pos] == '[') endChar = ']';
    else if (json[pos] == '"') endChar = '"';
    
    // This is a very naive parser, assumes simple structure
    // For numbers/bools
    if (endChar == ',') {
        size_t end = json.find_first_of(",}", pos);
        return json.substr(pos, end - pos);
    }
    
    // For objects/arrays/strings, we need proper matching
    // But since we control the export format, we can cheat a bit for now
    // NOTE: This is risky for complex strings, but OK for numbers/simple objects
    return ""; // Placeholder - Parsing logic is complex without library
}

// Helper to manually parse numbers from format like "x":123.45}
double extractNumber(const std::string& str, const std::string& key) {
    auto pos = str.find("\"" + key + "\":");
    if (pos == std::string::npos) return 0.0;
    
    pos += key.length() + 3; // skip "key":
    size_t end = str.find_first_of(",}", pos);
    try {
        return std::stod(str.substr(pos, end - pos));
    } catch (...) {
        return 0.0;
    }
}

void Engine::importDatabase(const std::string& json) {
    clear();
    
    // Minimal parser: Find each object {...} and parse it
    // Format: [{"type":0,...}, {"type":1,...}]
    
    size_t pos = 0;
    while ((pos = json.find("{", pos)) != std::string::npos) {
        size_t end = json.find("}", pos);
        if (end == std::string::npos) break;
        
        std::string obj = json.substr(pos, end - pos + 1);
        pos = end + 1; // Move past this object
        
        // Parse "type"
        auto typePos = obj.find("\"type\":");
        if (typePos == std::string::npos) continue;
        int type = std::stoi(obj.substr(typePos + 7)); // naive
        
        if (type == static_cast<int>(EntityType::LINE)) {
            // Find "p1":{"x":...,"y":...}
            size_t p1Pos = obj.find("\"p1\":");
            size_t p2Pos = obj.find("\"p2\":");
            
            if (p1Pos != std::string::npos && p2Pos != std::string::npos) {
                double x1 = extractNumber(obj.substr(p1Pos), "x");
                double y1 = extractNumber(obj.substr(p1Pos), "y");
                double x2 = extractNumber(obj.substr(p2Pos), "x");
                double y2 = extractNumber(obj.substr(p2Pos), "y");
                addLine(x1, y1, x2, y2);
            }
        } 
        else if (type == static_cast<int>(EntityType::CIRCLE)) {
            size_t cPos = obj.find("\"center\":");
            double cx = extractNumber(obj.substr(cPos), "x");
            double cy = extractNumber(obj.substr(cPos), "y");
            double r = extractNumber(obj, "radius");
            addCircle(cx, cy, r);
        }
        else if (type == static_cast<int>(EntityType::RECTANGLE)) {
            size_t p1Pos = obj.find("\"p1\":");
            size_t p2Pos = obj.find("\"p2\":");
            double x1 = extractNumber(obj.substr(p1Pos), "x");
            double y1 = extractNumber(obj.substr(p1Pos), "y");
            double x2 = extractNumber(obj.substr(p2Pos), "x");
            double y2 = extractNumber(obj.substr(p2Pos), "y");
            addRectangle(x1, y1, x2, y2);
        }
        else if (type == static_cast<int>(EntityType::ARC)) {
            size_t cPos = obj.find("\"center\":");
            double cx = extractNumber(obj.substr(cPos), "x");
            double cy = extractNumber(obj.substr(cPos), "y");
            double r = extractNumber(obj, "radius");
            double start = extractNumber(obj, "startAngle");
            double endAngle = extractNumber(obj, "endAngle");
            addArc(cx, cy, r, start, endAngle);
        }
        else if (type == static_cast<int>(EntityType::POLYLINE)) {
             // Polyline parsing is tricky without a real parser
             // For now, let's skip complex polyline parsing manually
             // Only if advanced parser library is added later
             
             // Simple fallback: Check if points exist
             size_t ptsPos = obj.find("\"points\":[");
             if (ptsPos != std::string::npos) {
                 std::vector<Point> points;
                 size_t arrayStart = ptsPos + 10;
                 size_t arrayEnd = obj.find("]", arrayStart);
                 std::string arr = obj.substr(arrayStart, arrayEnd - arrayStart);
                 
                 size_t pPos = 0;
                 while ((pPos = arr.find("{", pPos)) != std::string::npos) {
                     double px = extractNumber(arr.substr(pPos), "x");
                     double py = extractNumber(arr.substr(pPos), "y");
                     points.push_back({px, py});
                     pPos++;
                 }
                 
                 bool closed = obj.find("\"closed\":true") != std::string::npos;
                 addPolyline(points, closed);
             }
        }
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
