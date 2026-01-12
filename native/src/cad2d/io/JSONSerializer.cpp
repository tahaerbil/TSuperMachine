#include "JSONSerializer.h"

std::string JSONSerializer::exportDatabase(const Database& db) {
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
                ss << "\"point\":{\"x\":" << pt->position.x << ",\"y\":" << pt->position.y << "}";
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

std::string JSONSerializer::getJsonValue(const std::string& json, const std::string& key) {
    auto pos = json.find("\"" + key + "\"");
    if (pos == std::string::npos) return "";
    
    pos = json.find(":", pos) + 1;
    while (json[pos] == ' ' || json[pos] == '\n') pos++; // skip whitespace
    
    char endChar = ',';
    if (json[pos] == '{') endChar = '}';
    else if (json[pos] == '[') endChar = ']';
    else if (json[pos] == '"') endChar = '"';
    
    // This is a very naive parser, assumes simple structure
    if (endChar == ',') {
        size_t end = json.find_first_of(",}", pos);
        return json.substr(pos, end - pos);
    }
    return ""; 
}

double JSONSerializer::extractNumber(const std::string& str, const std::string& key) {
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

void JSONSerializer::importDatabase(Database& db, const std::string& json) {
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
