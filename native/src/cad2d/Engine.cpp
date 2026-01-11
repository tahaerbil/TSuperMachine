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

void Engine::trimEntity(double x, double y) {
    // 1. Identify valid entity under cursor
    int targetId = hitTest(x, y, 10.0); // Use a slightly larger tolerance for selection
    if (targetId == -1) return;

    auto target = db.getEntity(targetId);
    if (!target) return;
    
    // Only support LINE trimming for MVP
    if (target->getType() != EntityType::LINE) return;
    
    saveState();
    
    auto* line = static_cast<LineEntity*>(target.get());
    
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

void Engine::extendEntity(double x, double y) {
    // TODO: Implement Extend
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
            case EntityType::ELLIPSE: {
                auto* el = static_cast<EllipseEntity*>(entity.get());
                ss << "\"center\":{\"x\":" << el->center.x << ",\"y\":" << el->center.y << "},";
                ss << "\"majorRadius\":" << el->majorRadius << ",";
                ss << "\"minorRadius\":" << el->minorRadius << ",";
                ss << "\"rotation\":" << el->rotation;
                break;
            }
            case EntityType::POINT: {
                auto* pt = static_cast<PointEntity*>(entity.get());
                ss << "\"point\":{\"x\":" << pt->point.x << ",\"y\":" << pt->point.y << "}";
                break;
            }
            case EntityType::SPLINE: {
                auto* spl = static_cast<SplineEntity*>(entity.get());
                ss << "\"points\":[";
                 for (size_t j = 0; j < spl->controlPoints.size(); ++j) {
                    if (j > 0) ss << ",";
                    ss << "{\"x\":" << spl->controlPoints[j].x << ",\"y\":" << spl->controlPoints[j].y << "}";
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
    db.clear(); // Direct clear without saving state
    
    size_t pos = 0;
    while ((pos = json.find("{", pos)) != std::string::npos) {
        size_t end = json.find("}", pos);
        if (end == std::string::npos) break;
        
        std::string obj = json.substr(pos, end - pos + 1);
        pos = end + 1; 
        
        auto typePos = obj.find("\"type\":");
        if (typePos == std::string::npos) continue;
        int type = std::stoi(obj.substr(typePos + 7)); 
        
        if (type == static_cast<int>(EntityType::LINE)) {
            size_t p1Pos = obj.find("\"p1\":");
            size_t p2Pos = obj.find("\"p2\":");
            if (p1Pos != std::string::npos && p2Pos != std::string::npos) {
                double x1 = extractNumber(obj.substr(p1Pos), "x");
                double y1 = extractNumber(obj.substr(p1Pos), "y");
                double x2 = extractNumber(obj.substr(p2Pos), "x");
                double y2 = extractNumber(obj.substr(p2Pos), "y");
                db.addEntity(std::make_unique<LineEntity>(Point{x1, y1}, Point{x2, y2}));
            }
        } 
        else if (type == static_cast<int>(EntityType::CIRCLE)) {
            size_t cPos = obj.find("\"center\":");
            double cx = extractNumber(obj.substr(cPos), "x");
            double cy = extractNumber(obj.substr(cPos), "y");
            double r = extractNumber(obj, "radius");
            db.addEntity(std::make_unique<CircleEntity>(Point{cx, cy}, r));
        }
        else if (type == static_cast<int>(EntityType::RECTANGLE)) {
            size_t p1Pos = obj.find("\"p1\":");
            size_t p2Pos = obj.find("\"p2\":");
            double x1 = extractNumber(obj.substr(p1Pos), "x");
            double y1 = extractNumber(obj.substr(p1Pos), "y");
            double x2 = extractNumber(obj.substr(p2Pos), "x");
            double y2 = extractNumber(obj.substr(p2Pos), "y");
            db.addEntity(std::make_unique<RectangleEntity>(Point{x1, y1}, Point{x2, y2}));
        }
        else if (type == static_cast<int>(EntityType::ARC)) {
            size_t cPos = obj.find("\"center\":");
            double cx = extractNumber(obj.substr(cPos), "x");
            double cy = extractNumber(obj.substr(cPos), "y");
            double r = extractNumber(obj, "radius");
            double start = extractNumber(obj, "startAngle");
            double endAngle = extractNumber(obj, "endAngle");
            db.addEntity(std::make_unique<ArcEntity>(Point{cx, cy}, r, start, endAngle));
        }
        else if (type == static_cast<int>(EntityType::POLYLINE)) {
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
                 db.addEntity(std::make_unique<PolylineEntity>(points, closed));
             }
        }
        else if (type == static_cast<int>(EntityType::ELLIPSE)) {
            size_t cPos = obj.find("\"center\":");
            double cx = extractNumber(obj.substr(cPos), "x");
            double cy = extractNumber(obj.substr(cPos), "y");
            double maj = extractNumber(obj, "majorRadius");
            double min = extractNumber(obj, "minorRadius");
            double rot = extractNumber(obj, "rotation");
            db.addEntity(std::make_unique<EllipseEntity>(Point{cx, cy}, maj, min, rot));
        }
        else if (type == static_cast<int>(EntityType::POINT)) {
            size_t pPos = obj.find("\"point\":");
            double x = extractNumber(obj.substr(pPos), "x");
            double y = extractNumber(obj.substr(pPos), "y");
            db.addEntity(std::make_unique<PointEntity>(Point{x, y}));
        }
        else if (type == static_cast<int>(EntityType::SPLINE)) {
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
                  db.addEntity(std::make_unique<SplineEntity>(points));
             }
        }
    }
}

// ============================================================================
// DXF Export Implementation
// ============================================================================

std::string Engine::exportDXF() {
    std::stringstream ss;
    ss << std::fixed << std::setprecision(6);
    
    // DXF Header Section
    ss << "0\n";
    ss << "SECTION\n";
    ss << "2\n";
    ss << "HEADER\n";
    ss << "9\n";
    ss << "$ACADVER\n";
    ss << "1\n";
    ss << "AC1015\n";  // AutoCAD 2000 format - widely compatible
    ss << "9\n";
    ss << "$INSUNITS\n";
    ss << "70\n";
    ss << "4\n";  // Units: 4 = Millimeters
    ss << "0\n";
    ss << "ENDSEC\n";
    
    // Tables Section (minimal, required for compatibility)
    ss << "0\n";
    ss << "SECTION\n";
    ss << "2\n";
    ss << "TABLES\n";
    
    // Layer table
    ss << "0\n";
    ss << "TABLE\n";
    ss << "2\n";
    ss << "LAYER\n";
    ss << "70\n";
    ss << "1\n";
    ss << "0\n";
    ss << "LAYER\n";
    ss << "2\n";
    ss << "0\n";  // Layer name "0" (default)
    ss << "70\n";
    ss << "0\n";
    ss << "62\n";
    ss << "7\n";  // Color: white
    ss << "6\n";
    ss << "CONTINUOUS\n";  // Linetype
    ss << "0\n";
    ss << "ENDTAB\n";
    
    ss << "0\n";
    ss << "ENDSEC\n";
    
    // Entities Section
    ss << "0\n";
    ss << "SECTION\n";
    ss << "2\n";
    ss << "ENTITIES\n";
    
    const auto& entities = db.getEntities();
    for (const auto& entity : entities) {
        if (!entity->visible) continue;
        
        switch (entity->getType()) {
            case EntityType::LINE: {
                auto* line = static_cast<LineEntity*>(entity.get());
                ss << "0\n";
                ss << "LINE\n";
                ss << "8\n";
                ss << "0\n";  // Layer
                ss << "10\n";
                ss << line->start.x << "\n";  // Start X
                ss << "20\n";
                ss << line->start.y << "\n";  // Start Y
                ss << "30\n";
                ss << "0.0\n";  // Start Z (2D = 0)
                ss << "11\n";
                ss << line->end.x << "\n";  // End X
                ss << "21\n";
                ss << line->end.y << "\n";  // End Y
                ss << "31\n";
                ss << "0.0\n";  // End Z
                break;
            }
            
            case EntityType::CIRCLE: {
                auto* circle = static_cast<CircleEntity*>(entity.get());
                ss << "0\n";
                ss << "CIRCLE\n";
                ss << "8\n";
                ss << "0\n";  // Layer
                ss << "10\n";
                ss << circle->center.x << "\n";  // Center X
                ss << "20\n";
                ss << circle->center.y << "\n";  // Center Y
                ss << "30\n";
                ss << "0.0\n";  // Center Z
                ss << "40\n";
                ss << circle->radius << "\n";  // Radius
                break;
            }
            
            case EntityType::ARC: {
                auto* arc = static_cast<ArcEntity*>(entity.get());
                ss << "0\n";
                ss << "ARC\n";
                ss << "8\n";
                ss << "0\n";  // Layer
                ss << "10\n";
                ss << arc->center.x << "\n";  // Center X
                ss << "20\n";
                ss << arc->center.y << "\n";  // Center Y
                ss << "30\n";
                ss << "0.0\n";  // Center Z
                ss << "40\n";
                ss << arc->radius << "\n";  // Radius
                ss << "50\n";
                ss << (arc->startAngle * 180.0 / M_PI) << "\n";  // Start angle (degrees)
                ss << "51\n";
                ss << (arc->endAngle * 180.0 / M_PI) << "\n";  // End angle (degrees)
                break;
            }
            
            case EntityType::POLYLINE: {
                auto* pl = static_cast<PolylineEntity*>(entity.get());
                // Use LWPOLYLINE (lightweight polyline) for 2D
                ss << "0\n";
                ss << "LWPOLYLINE\n";
                ss << "8\n";
                ss << "0\n";  // Layer
                ss << "90\n";
                ss << pl->points.size() << "\n";  // Number of vertices
                ss << "70\n";
                ss << (pl->closed ? "1" : "0") << "\n";  // Closed flag
                
                for (const auto& pt : pl->points) {
                    ss << "10\n";
                    ss << pt.x << "\n";  // X
                    ss << "20\n";
                    ss << pt.y << "\n";  // Y
                }
                break;
            }
            
            case EntityType::RECTANGLE: {
                // Rectangle as LWPOLYLINE (4 vertices, closed)
                auto* rect = static_cast<RectangleEntity*>(entity.get());
                double minX = std::min(rect->p1.x, rect->p2.x);
                double maxX = std::max(rect->p1.x, rect->p2.x);
                double minY = std::min(rect->p1.y, rect->p2.y);
                double maxY = std::max(rect->p1.y, rect->p2.y);
                
                ss << "0\n";
                ss << "LWPOLYLINE\n";
                ss << "8\n";
                ss << "0\n";  // Layer
                ss << "90\n";
                ss << "4\n";  // 4 vertices
                ss << "70\n";
                ss << "1\n";  // Closed
                
                // Bottom-left
                ss << "10\n" << minX << "\n";
                ss << "20\n" << minY << "\n";
                // Bottom-right
                ss << "10\n" << maxX << "\n";
                ss << "20\n" << minY << "\n";
                // Top-right
                ss << "10\n" << maxX << "\n";
                ss << "20\n" << maxY << "\n";
                // Top-left
                ss << "10\n" << minX << "\n";
                ss << "20\n" << maxY << "\n";
                break;
            }
            

            case EntityType::POINT: {
                auto* pt = static_cast<PointEntity*>(entity.get());
                ss << "0\nPOINT\n8\n0\n";
                ss << "10\n" << pt->point.x << "\n";
                ss << "20\n" << pt->point.y << "\n";
                ss << "30\n0.0\n";
                break;
            }
            case EntityType::SPLINE: {
                auto* spl = static_cast<SplineEntity*>(entity.get());
                ss << "0\nSPLINE\n8\n0\n";
                ss << "71\n3\n"; // Degree
                ss << "74\n" << spl->controlPoints.size() << "\n"; // Num ctrl points
                for(const auto& p: spl->controlPoints) {
                    ss << "10\n" << p.x << "\n";
                    ss << "20\n" << p.y << "\n";
                    ss << "30\n0.0\n";
                }
                break;
            }
            default:
                break;
        }
    }
    
    ss << "0\n";
    ss << "ENDSEC\n";
    
    // End of file
    ss << "0\n";
    ss << "EOF\n";
    
    return ss.str();
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
            renderBuffer.push_back(static_cast<float>(pt->point.x));
            renderBuffer.push_back(static_cast<float>(pt->point.y));
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
                          bestSnap = {p, SnapType::INTERSECTION};
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
