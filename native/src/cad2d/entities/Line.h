#pragma once
#include "Entity.h"
#include <algorithm>

// Line Entity
class LineEntity : public Entity {
public:
    Point start;
    Point end;

    LineEntity(Point p1, Point p2) : start(p1), end(p2) {}
    
    EntityType getType() const override { return EntityType::LINE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        snaps.push_back({start, SnapType::ENDPOINT});
        snaps.push_back({end, SnapType::ENDPOINT});
        snaps.push_back({{ (start.x + end.x) / 2.0, (start.y + end.y) / 2.0 }, SnapType::MIDPOINT});
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        // Distance from point to line segment
        double A = x - start.x;
        double B = y - start.y;
        double C = end.x - start.x;
        double D = end.y - start.y;

        double dot = A * C + B * D;
        double len_sq = C * C + D * D;
        double param = -1;
        if (len_sq != 0) // in case of 0 length line
            param = dot / len_sq;

        double xx, yy;

        if (param < 0) {
            xx = start.x;
            yy = start.y;
        }
        else if (param > 1) {
            xx = end.x;
            yy = end.y;
        }
        else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }

        double dx = x - xx;
        double dy = y - yy;
        return (dx * dx + dy * dy) <= (tolerance * tolerance);
    }

    void translate(double dx, double dy) override {
        start.x += dx;
        start.y += dy;
        end.x += dx;
        end.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        // Normalize rectangle coordinates
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Both endpoints must be inside
        return (start.x >= minX && start.x <= maxX && start.y >= minY && start.y <= maxY) &&
               (end.x >= minX && end.x <= maxX && end.y >= minY && end.y <= maxY);
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        // Normalize rectangle coordinates
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Check if either endpoint is inside
        bool startInside = (start.x >= minX && start.x <= maxX && start.y >= minY && start.y <= maxY);
        bool endInside = (end.x >= minX && end.x <= maxX && end.y >= minY && end.y <= maxY);
        
        if (startInside || endInside) return true;
        
        // Check if line intersects any of the 4 rectangle edges
        // Top edge
        if (lineSegmentIntersect(start.x, start.y, end.x, end.y, minX, maxY, maxX, maxY)) return true;
        // Bottom edge
        if (lineSegmentIntersect(start.x, start.y, end.x, end.y, minX, minY, maxX, minY)) return true;
        // Left edge
        if (lineSegmentIntersect(start.x, start.y, end.x, end.y, minX, minY, minX, maxY)) return true;
        // Right edge
        if (lineSegmentIntersect(start.x, start.y, end.x, end.y, maxX, minY, maxX, maxY)) return true;
        
        return false;
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate start point
        double dx1 = start.x - cx;
        double dy1 = start.y - cy;
        start.x = cx + dx1 * std::cos(angle) - dy1 * std::sin(angle);
        start.y = cy + dx1 * std::sin(angle) + dy1 * std::cos(angle);
        
        // Rotate end point
        double dx2 = end.x - cx;
        double dy2 = end.y - cy;
        end.x = cx + dx2 * std::cos(angle) - dy2 * std::sin(angle);
        end.y = cy + dx2 * std::sin(angle) + dy2 * std::cos(angle);
    }

    void scale(double cx, double cy, double factor) override {
        start.x = cx + (start.x - cx) * factor;
        start.y = cy + (start.y - cy) * factor;
        end.x = cx + (end.x - cx) * factor;
        end.y = cy + (end.y - cy) * factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(start, x1, y1, x2, y2);
        mirrorPoint(end, x1, y1, x2, y2);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // Calculate perpendicular direction
        double dx = end.x - start.x;
        double dy = end.y - start.y;
        double length = std::sqrt(dx * dx + dy * dy);
        
        if (length < 1e-10) return nullptr; // Degenerate line
        
        // Perpendicular vector (rotate 90 degrees)
        double perpX = -dy / length;
        double perpY = dx / length;
        
        // Flip direction if not outward
        if (!outward) {
            perpX = -perpX;
            perpY = -perpY;
        }
        
        // Offset both points
        Point newStart = { start.x + perpX * distance, start.y + perpY * distance };
        Point newEnd = { end.x + perpX * distance, end.y + perpY * distance };
        
        return std::make_unique<LineEntity>(newStart, newEnd);
    }

    std::vector<Point> getIntersections(const Entity* other) const override;

private:
    bool lineSegmentIntersect(double x1, double y1, double x2, double y2,
                              double x3, double y3, double x4, double y4) const {
        double denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (std::abs(denom) < 1e-10) return false; // Parallel
        
        double t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        double u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
    }
};
