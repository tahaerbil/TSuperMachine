#pragma once
#include "Entity.h"
#include <vector>
#include <algorithm>

// Polyline Entity (multi-segment line)
class PolylineEntity : public Entity {
public:
    std::vector<Point> points;
    bool closed;

    PolylineEntity(const std::vector<Point>& pts, bool isClosed)
        : points(pts), closed(isClosed) {}

    EntityType getType() const override { return EntityType::POLYLINE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        
        // Add endpoints
        if (!points.empty()) {
            snaps.push_back({points.front(), SnapType::ENDPOINT});
            if (!closed && points.size() > 1) {
                snaps.push_back({points.back(), SnapType::ENDPOINT});
            }
        }
        
        // Add all vertices
        for (const auto& pt : points) {
            snaps.push_back({pt, SnapType::ENDPOINT});
        }
        
        // Add midpoints of all segments
        for (size_t i = 0; i < points.size() - 1; i++) {
            Point mid = {
                (points[i].x + points[i + 1].x) / 2.0,
                (points[i].y + points[i + 1].y) / 2.0
            };
            snaps.push_back({mid, SnapType::MIDPOINT});
        }
        
        // If closed, add midpoint of closing segment
        if (closed && points.size() > 2) {
            Point mid = {
                (points.back().x + points.front().x) / 2.0,
                (points.back().y + points.front().y) / 2.0
            };
            snaps.push_back({mid, SnapType::MIDPOINT});
        }
        
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        // Test all segments
        for (size_t i = 0; i < points.size() - 1; i++) {
            if (pointToSegmentDistance(x, y, points[i], points[i + 1]) <= tolerance) {
                return true;
            }
        }
        
        // If closed, test closing segment
        if (closed && points.size() > 2) {
            if (pointToSegmentDistance(x, y, points.back(), points.front()) <= tolerance) {
                return true;
            }
        }
        
        return false;
    }

    void translate(double dx, double dy) override {
        for (auto& pt : points) {
            pt.x += dx;
            pt.y += dy;
        }
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // All points must be inside
        for (const auto& pt : points) {
            if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) {
                return false;
            }
        }
        return true;
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Check if any point is inside
        for (const auto& pt : points) {
            if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) {
                return true;
            }
        }
        
        // Check if any segment intersects rectangle edges
        for (size_t i = 0; i < points.size(); i++) {
            size_t next = (i + 1) % points.size();
            if (!closed && next == 0) break;
            
            const Point& p1 = points[i];
            const Point& p2 = points[next];
            
            // Check intersection with all 4 edges
            if (segmentIntersectsRect(p1.x, p1.y, p2.x, p2.y, minX, minY, maxX, maxY)) {
                return true;
            }
        }
        
        return false;
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate all points
        for (auto& pt : points) {
            double dx = pt.x - cx;
            double dy = pt.y - cy;
            pt.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
            pt.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
        }
    }

    void scale(double cx, double cy, double factor) override {
        for (auto& pt : points) {
            pt.x = cx + (pt.x - cx) * factor;
            pt.y = cy + (pt.y - cy) * factor;
        }
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        for (auto& pt : points) {
            mirrorPoint(pt, x1, y1, x2, y2);
        }
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // TODO: Implement polyline offset (complex - requires corner handling)
        return nullptr;
    }

    std::vector<Point> getIntersections(const Entity* other) const override {
        return {}; // Default implementation
    }


private:
    bool segmentIntersectsRect(double x1, double y1, double x2, double y2,
                               double minX, double minY, double maxX, double maxY) const {
        // Check if segment intersects any of the 4 rectangle edges
        return lineSegmentIntersect(x1, y1, x2, y2, minX, maxY, maxX, maxY) || // Top
               lineSegmentIntersect(x1, y1, x2, y2, minX, minY, maxX, minY) || // Bottom
               lineSegmentIntersect(x1, y1, x2, y2, minX, minY, minX, maxY) || // Left
               lineSegmentIntersect(x1, y1, x2, y2, maxX, minY, maxX, maxY);   // Right
    }
    
    bool lineSegmentIntersect(double x1, double y1, double x2, double y2,
                              double x3, double y3, double x4, double y4) const {
        double denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (std::abs(denom) < 1e-10) return false;
        
        double t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        double u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
        
        return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
    }
    
    double pointToSegmentDistance(double px, double py, const Point& p1, const Point& p2) const {
        double dx = p2.x - p1.x;
        double dy = p2.y - p1.y;
        double len2 = dx * dx + dy * dy;
        
        if (len2 == 0.0) {
            dx = px - p1.x;
            dy = py - p1.y;
            return std::sqrt(dx * dx + dy * dy);
        }
        
        double t = ((px - p1.x) * dx + (py - p1.y) * dy) / len2;
        t = std::max(0.0, std::min(1.0, t));
        
        double closestX = p1.x + t * dx;
        double closestY = p1.y + t * dy;
        
        dx = px - closestX;
        dy = py - closestY;
        return std::sqrt(dx * dx + dy * dy);
    }
};
