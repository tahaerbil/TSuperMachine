#include "DXFExporter.h"

std::string DXFExporter::exportDXF(const Database& db) {
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
                ss << "0\nLINE\n";
                ss << "8\n0\n"; // Layer 0
                ss << "10\n" << line->start.x << "\n";
                ss << "20\n" << line->start.y << "\n";
                ss << "30\n0.0\n";
                ss << "11\n" << line->end.x << "\n";
                ss << "21\n" << line->end.y << "\n";
                ss << "31\n0.0\n";
                break;
            }
            case EntityType::CIRCLE: {
                auto* circle = static_cast<CircleEntity*>(entity.get());
                ss << "0\nCIRCLE\n";
                ss << "8\n0\n";
                ss << "10\n" << circle->center.x << "\n";
                ss << "20\n" << circle->center.y << "\n";
                ss << "30\n0.0\n";
                ss << "40\n" << circle->radius << "\n";
                break;
            }
            case EntityType::RECTANGLE: {
                auto* rect = static_cast<RectangleEntity*>(entity.get());
                // Export as Polyline
                ss << "0\nLWPOLYLINE\n";
                ss << "8\n0\n";
                ss << "90\n4\n"; // 4 vertices
                ss << "70\n1\n"; // Closed
                
                // P1
                ss << "10\n" << rect->p1.x << "\n";
                ss << "20\n" << rect->p1.y << "\n";
                // P2 (x2, y1)
                ss << "10\n" << rect->p2.x << "\n";
                ss << "20\n" << rect->p1.y << "\n";
                // P3 (x2, y2)
                ss << "10\n" << rect->p2.x << "\n";
                ss << "20\n" << rect->p2.y << "\n";
                // P4 (x1, y2)
                ss << "10\n" << rect->p1.x << "\n";
                ss << "20\n" << rect->p2.y << "\n";
                break;
            }
            case EntityType::ARC: {
                auto* arc = static_cast<ArcEntity*>(entity.get());
                ss << "0\nARC\n";
                ss << "8\n0\n";
                ss << "10\n" << arc->center.x << "\n";
                ss << "20\n" << arc->center.y << "\n";
                ss << "30\n0.0\n";
                ss << "40\n" << arc->radius << "\n";
                // DXF uses degrees
                ss << "50\n" << (arc->startAngle * 180.0 / M_PI) << "\n";
                ss << "51\n" << (arc->endAngle * 180.0 / M_PI) << "\n";
                break;
            }
            case EntityType::POLYLINE: {
                auto* pl = static_cast<PolylineEntity*>(entity.get());
                ss << "0\nLWPOLYLINE\n";
                ss << "8\n0\n";
                ss << "90\n" << pl->points.size() << "\n";
                ss << "70\n" << (pl->closed ? "1" : "0") << "\n";
                
                for (const auto& p : pl->points) {
                    ss << "10\n" << p.x << "\n";
                    ss << "20\n" << p.y << "\n";
                }
                break;
            }
        }
    }
    
    ss << "0\n";
    ss << "ENDSEC\n";
    ss << "0\n";
    ss << "EOF\n";
    
    return ss.str();
}
